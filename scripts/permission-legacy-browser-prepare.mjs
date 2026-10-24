export const LEGACY_BROWSER_READ_TABLES = Object.freeze(["orders", "order_items", "order_item_options", "payments"]);
const ROLES = Object.freeze(["anon", "authenticated"]);
const BASE_PRIVILEGES = Object.freeze(["SELECT", "INSERT", "UPDATE", "DELETE", "TRUNCATE", "REFERENCES", "TRIGGER"]);
const same = (actual, expected) => Array.isArray(actual)
  && JSON.stringify([...actual].sort()) === JSON.stringify([...expected].sort());
const refused = () => { throw new Error("UNEXPECTED_LEGACY_FINANCIAL_GRANT"); };

// Unlike information_schema.role_table_grants, aclexplode includes PG17 MAINTAIN.
// Include PUBLIC and every currently inherited role in the pre-mutation check.
const tableAclSql = `select c.relname table_name,
    case when x.grantee=0 then 'PUBLIC' else pg_get_userbyid(x.grantee) end grantee,
    x.privilege_type,x.is_grantable,(x.grantor=c.relowner) owner_grant
  from pg_class c join pg_namespace n on n.oid=c.relnamespace
  cross join lateral aclexplode(coalesce(c.relacl,acldefault('r',c.relowner))) x
  where n.nspname='public' and c.relname=any($1::text[])
    and case when x.grantee=0 then true else exists(select 1 from pg_roles r where r.rolname=any($2::text[])
      and pg_has_role(r.oid,x.grantee,'USAGE')) end
  order by c.relname,grantee,x.privilege_type`;
const columnAclSql = `select c.relname table_name from pg_class c
  join pg_namespace n on n.oid=c.relnamespace join pg_attribute a on a.attrelid=c.oid
  cross join lateral aclexplode(a.attacl) x
  where n.nspname='public' and c.relname=any($1::text[]) and a.attnum>0 and not a.attisdropped
    and case when x.grantee=0 then true else exists(select 1 from pg_roles r where r.rolname=any($2::text[])
      and pg_has_role(r.oid,x.grantee,'USAGE')) end`;
const effectiveSql = `select c.relname table_name,r.rolname grantee,
    array(select p from unnest($3::text[]) p where has_table_privilege(r.oid,c.oid,p) order by p) privileges,
    array(select p from unnest(array['SELECT','INSERT','UPDATE','REFERENCES']) p
      where has_any_column_privilege(r.oid,c.oid,p) order by p) column_privileges
  from pg_class c join pg_namespace n on n.oid=c.relnamespace cross join pg_roles r
  where n.nspname='public' and c.relname=any($1::text[]) and r.rolname=any($2::text[])
  order by c.relname,r.rolname`;
const protectionSql = `select c.relname table_name,c.relrowsecurity,
    count(p.policyname)::int policies,
    bool_and(p.policyname=c.relname||'_store_is_auth_user' and p.cmd='ALL' and p.roles='{public}'::name[]
      and p.qual='(store_id = auth.uid())' and p.with_check='(store_id = auth.uid())') policy_matches
  from pg_class c join pg_namespace n on n.oid=c.relnamespace
  left join pg_policies p on p.schemaname=n.nspname and p.tablename=c.relname
  where n.nspname='public' and c.relname=any($1::text[])
  group by c.relname,c.relrowsecurity order by c.relname`;
function verifyProtection(rows) {
  if (!same(rows.map(row => row.table_name), LEGACY_BROWSER_READ_TABLES)
    || rows.some(row => row.relrowsecurity !== true || row.policies !== 1 || row.policy_matches !== true))
    throw new Error("LEGACY_BROWSER_TENANT_POLICY_REQUIRED");
}
function verifyEffective(rows, final) {
  const expected = LEGACY_BROWSER_READ_TABLES.flatMap(table => ROLES.map(role => `${table}:${role}`));
  if (!same(rows.map(row => `${row.table_name}:${row.grantee}`), expected)) return false;
  return rows.every(row => {
    if (!Array.isArray(row.privileges) || !Array.isArray(row.column_privileges)
      || new Set(row.privileges).size !== row.privileges.length
      || new Set(row.column_privileges).size !== row.column_privileges.length) return false;
    if (final) return same(row.privileges, row.grantee === 'authenticated' ? ['SELECT'] : [])
      && same(row.column_privileges, row.grantee === 'authenticated' ? ['SELECT'] : []);
    return row.privileges.every(p => p === 'SELECT' || p === 'MAINTAIN')
      && row.column_privileges.every(p => p === 'SELECT');
  });
}

/** Prepare only the bound isolated legacy fixture. Normalize recognized stock
 * read/maintenance grants down to the original authenticated SELECT surface.
 * Unknown DML, grant options, PUBLIC/inherited ACLs and column ACLs stop before
 * mutation. Transaction rollback preserves the original ACL if any postcheck fails.
 */
export async function prepareLegacyBrowserSurface(db, { marker, storeIds }) {
  let begun = false;
  try {
    await db.query('begin'); begun = true;
    await db.query("set local statement_timeout='10s'");
    const fixture = (await db.query("select marker,engine,store_ids from private.idempotency_test_environment where singleton")).rows;
    if (fixture.length !== 1 || fixture[0].marker !== marker || fixture[0].engine !== "supabase-identity-v1"
      || !same(fixture[0].store_ids, storeIds)) throw new Error("LEGACY_BROWSER_FIXTURE_BINDING_MISMATCH");
    const actualStores = (await db.query("select id from public.stores order by id")).rows.map(row => row.id);
    if (!same(actualStores, storeIds)
      || (await db.query("select to_regclass('public.permission_catalog') value")).rows[0].value !== null
      || (await db.query("select to_regtype('public.employee_role') value")).rows[0].value !== "employee_role")
      throw new Error("FRESH_LEGACY_BROWSER_FIXTURE_REQUIRED");
    const protection = (await db.query(protectionSql, [LEGACY_BROWSER_READ_TABLES])).rows;
    verifyProtection(protection);
    await db.query('lock table public.orders,public.order_items,public.order_item_options,public.payments in access exclusive mode');
    verifyProtection((await db.query(protectionSql, [LEGACY_BROWSER_READ_TABLES])).rows);
    const version = (await db.query("select current_setting('server_version_num')::int value")).rows[0]?.value;
    if (!Number.isSafeInteger(version) || version < 160000) refused();
    const privileges = [...BASE_PRIVILEGES, ...(version >= 170000 ? ['MAINTAIN'] : [])];
    const acl = (await db.query(tableAclSql, [LEGACY_BROWSER_READ_TABLES, ROLES])).rows;
    const keys = new Set();
    for (const row of acl) {
      const key = `${row.table_name}:${row.grantee}:${row.privilege_type}`;
      if (!LEGACY_BROWSER_READ_TABLES.includes(row.table_name) || !ROLES.includes(row.grantee)
        || !['SELECT', ...(version >= 170000 ? ['MAINTAIN'] : [])].includes(row.privilege_type)
        || row.is_grantable !== false || row.owner_grant !== true || keys.has(key)) refused();
      keys.add(key);
    }
    if ((await db.query(columnAclSql, [LEGACY_BROWSER_READ_TABLES, ROLES])).rows.length) refused();
    const effectiveBefore = (await db.query(effectiveSql, [LEGACY_BROWSER_READ_TABLES, ROLES, privileges])).rows;
    if (!verifyEffective(effectiveBefore, false)) refused();
    const before = effectiveBefore.filter(row => row.grantee === 'authenticated')
      .map(row => ({ table_name: row.table_name, allowed: row.privileges.includes('SELECT') }));
    if (before.length !== LEGACY_BROWSER_READ_TABLES.length) throw new Error("LEGACY_BROWSER_TABLE_MISSING");
    // Fixed names only; all observed removable grants were classified above.
    await db.query('revoke all privileges on public.orders,public.order_items,public.order_item_options,public.payments from anon,authenticated');
    await db.query('grant select on public.orders,public.order_items,public.order_item_options,public.payments to authenticated');
    const effectiveAfter = (await db.query(effectiveSql, [LEGACY_BROWSER_READ_TABLES, ROLES, privileges])).rows;
    const finalAcl = (await db.query(tableAclSql, [LEGACY_BROWSER_READ_TABLES, ROLES])).rows;
    const finalColumns = (await db.query(columnAclSql, [LEGACY_BROWSER_READ_TABLES, ROLES])).rows;
    if (!verifyEffective(effectiveAfter, true) || finalColumns.length
      || !same(finalAcl.map(row => `${row.table_name}:${row.grantee}:${row.privilege_type}`),
        LEGACY_BROWSER_READ_TABLES.map(table => `${table}:authenticated:SELECT`))
      || finalAcl.some(row => row.is_grantable !== false || row.owner_grant !== true))
      throw new Error("LEGACY_BROWSER_READ_GRANT_RESTORE_FAILED");
    verifyProtection((await db.query(protectionSql, [LEGACY_BROWSER_READ_TABLES])).rows);
    const after = effectiveAfter.filter(row => row.grantee === 'authenticated')
      .map(row => ({ table_name: row.table_name, allowed: row.privileges.includes('SELECT') }));
    await db.query('commit'); begun = false;
    return { status: "LEGACY_BROWSER_READS_READY", protection, before, after,
      restored: before.filter(row => row.allowed !== true).map(row => row.table_name),
      normalized: { anonSelect: acl.filter(row => row.grantee === 'anon' && row.privilege_type === 'SELECT').length,
        maintain: acl.filter(row => row.privilege_type === 'MAINTAIN').length } };
  } catch (error) {
    if (begun) await db.query('rollback').catch(() => {});
    throw error;
  }
}
