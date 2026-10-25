import { readFileSync } from "node:fs";
import { digest } from "../../scripts/permission-preflight-core.mjs";
import { withFixtureCleanup } from "../../scripts/permission-fixture-diagnostics.mjs";
import { cleanupFinancialFixture, db, env, fixtureEvidence, resetFinancialFixture, setupFinancialFixture } from "./permissionFinancialFixture";
export * from "./permissionFinancialFixture";

export const readRelations = ["stores", "store_settings", "employees", "categories", "menu_items", "option_groups", "option_values", "menu_item_option_groups",
  "floor_areas", "tables", "floor_decor_items", "orders", "order_items", "order_item_options", "payments", "write_operations", "order_events",
  "employee_admin_audit", "permission_catalog", "permission_catalog_state", "permission_roles", "role_permission_defaults", "history_entries"];
let staged = false, createdLegacyView = false, originalReceipt = "", originalHash = "";
let originalReceiptAcl: any[] = [];
let employeeColumns = "", catalogStateColumns = "";
const originalRelationHashes = new Map<string, string>();
type RelationAcl = { relname: string; column_name: string | null; grantee: string; grantor: string; privilege: string; grantable: boolean };
type OrderedRelationAcl = RelationAcl & { item_ordinal: number };
const appRoles = ["PUBLIC", "anon", "authenticated", "service_role"];
let originalAcl: RelationAcl[] = [], candidateFunctions: string[] = [];
let originalOrderedAcl: OrderedRelationAcl[] = [], originalRawAcl: unknown[] = [];
const q = (s: string) => '"' + s.replaceAll('"', '""') + '"';
const role = (s: string) => s === "PUBLIC" ? "public" : q(s);
async function readOrderedRelationAcl(): Promise<OrderedRelationAcl[]> {
  return (await db.query(`select * from (
    select c.relname,null::text column_name,coalesce(r.rolname,'PUBLIC') grantee,
      pg_get_userbyid(x.grantor) grantor,x.privilege_type privilege,x.is_grantable grantable,item.ordinality::int item_ordinal
    from pg_class c cross join lateral unnest(coalesce(c.relacl,acldefault('r',c.relowner))) with ordinality item(acl,ordinality)
    cross join lateral aclexplode(array[item.acl]) x
    left join pg_roles r on r.oid=x.grantee
    where c.relnamespace='public'::regnamespace and c.relname=any($1::text[])
    union all
    select c.relname,a.attname,coalesce(r.rolname,'PUBLIC'),
      pg_get_userbyid(x.grantor),x.privilege_type,x.is_grantable,item.ordinality::int
    from pg_attribute a join pg_class c on c.oid=a.attrelid
    cross join lateral unnest(a.attacl) with ordinality item(acl,ordinality)
    cross join lateral aclexplode(array[item.acl]) x left join pg_roles r on r.oid=x.grantee
    where c.relnamespace='public'::regnamespace and c.relname=any($1::text[])
      and a.attnum>0 and not a.attisdropped
  ) acl order by relname,column_name nulls first,item_ordinal,privilege`, [readRelations])).rows;
}
function normalizedRelationAcl(rows: OrderedRelationAcl[]): RelationAcl[] {
  return rows.map(({ item_ordinal: _ordinal, ...row }) => row).sort((a, b) => {
    const left = JSON.stringify(a), right = JSON.stringify(b);
    return left < right ? -1 : left > right ? 1 : 0;
  });
}
export async function readRelationAcl(): Promise<RelationAcl[]> {
  return normalizedRelationAcl(await readOrderedRelationAcl());
}
async function readRawRelationAcl(): Promise<unknown[]> {
  // Match the outer inventory's raw table/column ACL hash inputs exactly.
  // Table NULL/default is equivalent there; column NULL and '{}' are distinct.
  return (await db.query(`select * from (
    select c.relname,null::text column_name,coalesce(c.relacl,acldefault('r',c.relowner))::text acl
      from pg_class c where c.relnamespace='public'::regnamespace and c.relname=any($1::text[])
    union all
    select c.relname,a.attname,coalesce(a.attacl::text,'')
      from pg_attribute a join pg_class c on c.oid=a.attrelid
      where c.relnamespace='public'::regnamespace and c.relname=any($1::text[]) and a.attnum>0 and not a.attisdropped
  ) acl order by relname,column_name nulls first`, [readRelations])).rows;
}
function requireRestorableAclOrder(rows: OrderedRelationAcl[]) {
  const appSeen = new Set<string>();
  for (const row of rows) {
    const scope = JSON.stringify([row.relname, row.column_name]);
    if (appRoles.includes(row.grantee)) appSeen.add(scope);
    else if (appSeen.has(scope)) throw new Error("READ_ACL_FOREIGN_ITEM_ORDER_UNSUPPORTED");
  }
}
async function restoreAppRelationAcl() {
  const currentActor = (await db.query("select current_user actor")).rows[0].actor as string;
  await db.query("begin");
  try {
    const grants = originalOrderedAcl.filter(a => appRoles.includes(a.grantee));
    if (grants.some(a => !/^[A-Z]+$/.test(a.privilege))) throw new Error("READ_ACL_PRIVILEGE_INVALID");
    // Hex contains no SQL quoting characters. The one server-side block avoids
    // hundreds of hosted roundtrips while retaining original grantor/options.
    const payloadHex = Buffer.from(JSON.stringify(grants), "utf8").toString("hex");
    await db.query(`do $read_acl_restore$
      declare restore_actor text:=current_user; pending jsonb:=convert_from(decode('${payloadHex}','hex'),'UTF8')::jsonb;
        deferred jsonb; blocked_scopes jsonb; scope_key text; item jsonb; restored boolean;
        passes integer:=0; maximum_passes integer:=jsonb_array_length(pending)+1;
      begin
        while jsonb_array_length(pending)>0 loop
          passes:=passes+1;
          if passes>maximum_passes then raise exception 'READ_ACL_GRANTOR_RESTORE_FAILED'; end if;
          deferred:='[]'::jsonb; blocked_scopes:='{}'::jsonb;
          for item in select value from jsonb_array_elements(pending) loop
            scope_key:=jsonb_build_array(item->>'relname',item->'column_name')::text;
            if blocked_scopes ? scope_key then deferred:=deferred||jsonb_build_array(item); continue; end if;
            restored:=false;
            begin
              execute format('set local role %I',item->>'grantor');
              execute format('grant %s%s on public.%I to %s%s',item->>'privilege',
                case when item->>'column_name' is null then '' else format('(%I)',item->>'column_name') end,
                item->>'relname',case when item->>'grantee'='PUBLIC' then 'public' else format('%I',item->>'grantee') end,
                case when (item->>'grantable')::boolean then ' with grant option' else '' end);
              execute format('set local role %I',restore_actor);
              -- A warning-only GRANT is not success. Check the exact ACL entry
              -- locally and defer it until upstream grant options are restored.
              if item->>'column_name' is null then
                select exists(select 1 from pg_class c cross join lateral aclexplode(c.relacl) a
                  where c.relnamespace='public'::regnamespace and c.relname=item->>'relname'
                    and (case when a.grantee=0 then 'PUBLIC' else pg_get_userbyid(a.grantee) end)=item->>'grantee'
                    and pg_get_userbyid(a.grantor)=item->>'grantor' and a.privilege_type=item->>'privilege'
                    and a.is_grantable=(item->>'grantable')::boolean) into restored;
              else
                select exists(select 1 from pg_attribute col join pg_class c on c.oid=col.attrelid
                  cross join lateral aclexplode(col.attacl) a
                  where c.relnamespace='public'::regnamespace and c.relname=item->>'relname' and col.attname=item->>'column_name'
                    and col.attnum>0 and not col.attisdropped
                    and (case when a.grantee=0 then 'PUBLIC' else pg_get_userbyid(a.grantee) end)=item->>'grantee'
                    and pg_get_userbyid(a.grantor)=item->>'grantor' and a.privilege_type=item->>'privilege'
                    and a.is_grantable=(item->>'grantable')::boolean) into restored;
              end if;
            exception when insufficient_privilege then
              -- This subtransaction also restores its caller's LOCAL role.
              restored:=false;
            end;
            if not restored then
              deferred:=deferred||jsonb_build_array(item);
              blocked_scopes:=blocked_scopes||jsonb_build_object(scope_key,true);
            end if;
          end loop;
          if jsonb_array_length(deferred)>=jsonb_array_length(pending) then raise exception 'READ_ACL_GRANTOR_RESTORE_FAILED'; end if;
          pending:=deferred;
        end loop;
        execute format('set local role %I',restore_actor);
      end $read_acl_restore$;`);
    if (digest(await readRelationAcl()) !== digest(originalAcl)) throw new Error("READ_ACL_RESTORE_DRIFT");
    if (digest(await readRawRelationAcl()) !== digest(originalRawAcl)) throw new Error("READ_RAW_ACL_RESTORE_DRIFT");
    if ((await db.query("select current_user actor")).rows[0].actor !== currentActor) throw new Error("READ_ACL_RESTORE_ROLE_DRIFT");
    await db.query("commit");
  } catch (error) {
    await db.query("rollback");
    throw error;
  }
}
export async function readFingerprint() {
  const values = [];
  for (const name of readRelations) values.push((await db.query(`select coalesce(jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text),'[]') rows from public.${q(name)} t`)).rows[0].rows);
  return digest(values);
}
export async function setupReadFixture() {
  await setupFinancialFixture();
  if (!(await db.query("select to_regclass('public.history_entries') name")).rows[0].name) {
    // Migration010 removed this view. Reintroduce it only as an inherited-ACL
    // negative control: the fragment must also protect installations retaining it.
    await db.query("create view public.history_entries with (security_invoker=true) as select * from public.orders");
    createdLegacyView = true;
  }
  originalHash = await readFingerprint();
  for (const name of readRelations) originalRelationHashes.set(name, digest((await db.query(`select coalesce(jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text),'[]') rows from public.${q(name)} t`)).rows[0].rows));
  await db.query("create temporary table t07_employees as table public.employees");
  await db.query("create temporary table t07_catalog_state as table public.permission_catalog_state");
  employeeColumns = (await db.query("select attname from pg_attribute where attrelid='public.employees'::regclass and attnum>0 and not attisdropped and attgenerated='' and attname<>'id' order by attnum")).rows.map(r => q(r.attname)).join(",");
  catalogStateColumns = (await db.query("select attname from pg_attribute where attrelid='public.permission_catalog_state'::regclass and attnum>0 and not attisdropped and attgenerated='' order by attnum")).rows.map(r => q(r.attname)).join(",");
  originalReceipt = (await db.query("select pg_get_functiondef('public.get_payment_receipt(uuid)'::regprocedure) d")).rows[0].d;
  originalReceiptAcl = (await db.query(`select coalesce(r.rolname,'PUBLIC') grantee,a.privilege_type privilege,a.is_grantable grantable
    from pg_proc p cross join lateral aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a
    left join pg_roles r on r.oid=a.grantee where p.oid='public.get_payment_receipt(uuid)'::regprocedure
    and (a.grantee=0 or r.rolname in ('anon','authenticated','service_role'))`)).rows;
  originalOrderedAcl = await readOrderedRelationAcl();
  originalAcl = normalizedRelationAcl(originalOrderedAcl);
  originalRawAcl = await readRawRelationAcl();
  // Revoking API items leaves all foreign/owner items in place. Reconstructing
  // an interleaved original array would require touching those foreign grants.
  // Refuse that unsupported fixture before hostile grants or candidate DDL.
  requireRestorableAclOrder(originalOrderedAcl);
  await db.query("begin");
  // Reproduce hostile provider defaults on every listed relation, including
  // PG17 MAINTAIN where available, without changing any global default ACL.
  for (const name of readRelations) {
    await db.query(`grant all privileges on public.${q(name)} to public,anon,authenticated,service_role`);
    const col = (await db.query("select attname from pg_attribute where attrelid=$1::regclass and attnum>0 and not attisdropped order by attnum limit 1", ["public." + name])).rows[0].attname;
    await db.query(`grant all privileges(${q(col)}) on public.${q(name)} to public,anon,authenticated,service_role`);
  }
  const hostileAcl = await readRelationAcl();
  const open = appRoles.every(appRole => readRelations.every(name =>
    hostileAcl.some(a => a.relname === name && a.grantee === appRole && a.column_name === null && a.privilege === "SELECT")
    && hostileAcl.some(a => a.relname === name && a.grantee === appRole && a.column_name !== null && a.privilege === "UPDATE")))
    && (await db.query("select has_table_privilege('service_role','public.stores','TRUNCATE') ok")).rows[0].ok;
  if (!open) throw new Error("READ_HOSTILE_ACL_CONTROL_NOT_OPEN");
  await db.query(readFileSync("supabase/candidate/permission-read.sql", "utf8"));
  const closedAcl = await readRelationAcl();
  if (closedAcl.some(a => appRoles.includes(a.grantee))) throw new Error("READ_DIRECT_GRANT_REMAINED");
  if (digest(closedAcl) !== digest(originalAcl.filter(a => !appRoles.includes(a.grantee)))) throw new Error("READ_FOREIGN_ACL_DRIFT");
  for (const name of readRelations) for (const appRole of ["anon", "authenticated", "service_role"]) {
    if ((await db.query("select has_table_privilege($1,$2,'SELECT') or has_any_column_privilege($1,$2,'SELECT') ok", [appRole, "public." + name])).rows[0].ok)
      throw new Error("READ_GRANT_REMAINED: " + name);
  }
  fixtureEvidence.readAclNegativeControl = open;
  await db.query("commit"); staged = true;
  fixtureEvidence.readPhasePreserved = originalHash === await readFingerprint();
  candidateFunctions = (await db.query(`select pg_get_functiondef(p.oid) d from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where (n.nspname='private' and p.proname like 'permission_read_%') or (n.nspname='public' and
      p.proname in ('permission_get_floor_operational','permission_get_pos_menu','permission_get_open_order_detail','permission_get_paid_order_for_void',
      'permission_list_order_history','permission_get_order_history_detail','get_payment_receipt','permission_get_sales_report','permission_list_report_orders','permission_get_menu_admin',
      'permission_get_floor_admin','permission_get_settings_admin','permission_get_store_display'))`)).rows.map(r => r.d);
  await db.query("notify pgrst,'reload schema'");
  // NOTIFY is asynchronous. Probe this newly added read surface without an
  // employee token, so readiness cannot create/refresh a session or business row.
  // Only the cache-miss response is transient; tested operations are never retried.
  const deadline = Date.now() + 3000;
  while (Date.now() < deadline) {
    const response = await fetch(env.api + "/rest/v1/rpc/permission_get_floor_operational", {
      method: "POST", headers: { apikey: env.anonKey, Authorization: "Bearer " + env.storeJwt,
        "Content-Type": "application/json" }, body: "{}",
      signal: AbortSignal.timeout(Math.max(1, Math.min(1000, deadline - Date.now()))),
    });
    const result = await response.json();
    if (response.status === 200 && result?.ok === false && result.error?.code === "EMPLOYEE_SESSION_REQUIRED") return;
    if (response.status !== 404 || result?.code !== "PGRST202") throw new Error("READ_API_READINESS_REFUSED");
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error("READ_API_NOT_READY");
}
export async function resetReadFixture() {
  if (!staged) return;
  await db.query("rollback");
  for (const definition of candidateFunctions) await db.query(definition);
  await resetFinancialFixture();
  // Identity reset updates timestamps. Restore the native baseline precisely;
  // T07 also fingerprints employee read surfaces, not only financial rows.
  await db.query("begin");
  await db.query("alter table public.employees disable trigger user");
  await db.query(`update public.employees e set (${employeeColumns})=(select ${employeeColumns} from pg_temp.t07_employees b where b.id=e.id) where e.id in (select id from pg_temp.t07_employees)`);
  await db.query("alter table public.employees enable trigger user");
  await db.query("alter table public.permission_catalog_state disable trigger user");
  await db.query(`update public.permission_catalog_state set (${catalogStateColumns})=(select ${catalogStateColumns} from pg_temp.t07_catalog_state)`);
  await db.query("alter table public.permission_catalog_state enable trigger user");
  await db.query("commit");
}
export async function cleanupReadFixture() {
  await withFixtureCleanup(async () => {
    if (staged) {
      await resetReadFixture();
      fixtureEvidence.readBusinessRestored = originalHash === await readFingerprint();
      if (!fixtureEvidence.readBusinessRestored) {
        const changed = [];
        for (const name of readRelations) if (originalRelationHashes.get(name) !== digest((await db.query(`select coalesce(jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text),'[]') rows from public.${q(name)} t`)).rows[0].rows)) changed.push(name);
        throw new Error("READ_FIXTURE_DRIFT: " + changed.join(","));
      }
      await db.query(originalReceipt);
      await db.query('revoke all privileges on function public.get_payment_receipt(uuid) from PUBLIC,anon,authenticated,service_role');
      for (const grant of originalReceiptAcl) await db.query(`grant ${grant.privilege} on function public.get_payment_receipt(uuid) to ${role(grant.grantee)}${grant.grantable ? ' with grant option' : ''}`);
      await restoreAppRelationAcl();
    }
  }, async () => {
    if (createdLegacyView) await db.query("drop view public.history_entries");
    await cleanupFinancialFixture();
  });
}
