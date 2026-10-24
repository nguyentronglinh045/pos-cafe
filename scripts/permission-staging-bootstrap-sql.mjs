// Offline SQL rendering. This module neither connects nor claims execution proof.
import { EMPTY_TARGET_RELATIONS } from './permission-activation-bundle.mjs';

export const literal = value => "'" + String(value).replaceAll("'", "''") + "'";
export const jsonLiteral = value => literal(JSON.stringify(value)) + '::jsonb';
export function canonicalLf(value) {
  if (/\r(?!\n)/.test(value)) throw new Error('STAGING_LONE_CR_REFUSED');
  return value.replaceAll('\r\n','\n');
}
const tenantDiscovery = `with recursive tenant_relations(oid) as (
 select c.oid from pg_class c join pg_namespace n on n.oid=c.relnamespace
 where c.relkind in ('r','p') and n.nspname in ('public','private') and
 (n.nspname='public' and c.relname='stores' or exists(select 1 from pg_attribute a
 where a.attrelid=c.oid and a.attname='store_id' and a.attnum>0 and not a.attisdropped))
 union select child.oid from tenant_relations parent
 join pg_constraint fk on fk.confrelid=parent.oid and fk.contype='f'
 join pg_class child on child.oid=fk.conrelid join pg_namespace ns on ns.oid=child.relnamespace
 where child.relkind in ('r','p') and ns.nspname in ('public','private')
) select n.nspname schema_name,c.relname relation_name from tenant_relations t
 join pg_class c on c.oid=t.oid join pg_namespace n on n.oid=c.relnamespace order by 1,2`;

function tenantGuard(expected) {
  return `tenant_count:=0;
 for relation_row in ${tenantDiscovery} loop
  tenant_count:=tenant_count+1;
  ${expected ? `if not (relation_row.schema_name||'.'||relation_row.relation_name=any(array[${EMPTY_TARGET_RELATIONS.map(literal).join(',')}])) then raise exception 'STAGING_TENANT_SCHEMA_DRIFT'; end if;` : ''}
  execute format('select exists(select 1 from %I.%I)',relation_row.schema_name,relation_row.relation_name) into has_rows;
  if has_rows then raise exception 'STAGING_TENANT_NOT_EMPTY'; end if;
 end loop;
 ${expected ? `if tenant_count<>${EMPTY_TARGET_RELATIONS.length} then raise exception 'STAGING_TENANT_SCHEMA_DRIFT'; end if;` : ''}`;
}

export function renderBootstrapSql({ observation, catalog, fragments, binding, introspectionSql }) {
  const inspection = introspectionSql.trim().replace(/;\s*$/, '');
  const expectedIdentity = Object.fromEntries(['database','databaseOid','sessionUser','currentUser','serverVersionNum']
    .map(key => [key, observation.identity[key]]));
  const identityProjection = `jsonb_build_object('database',fresh#>'{identity,database}',
   'databaseOid',fresh#>'{identity,databaseOid}','sessionUser',fresh#>'{identity,sessionUser}',
   'currentUser',fresh#>'{identity,currentUser}','serverVersionNum',fresh#>'{identity,serverVersionNum}')`;
  const inspect = `select permission_staging_introspection into fresh from (${inspection}) inspected;
 if fresh-'identity' is distinct from ${jsonLiteral(catalog)} or
   ${identityProjection} is distinct from ${jsonLiteral(expectedIdentity)} then
  raise exception 'STAGING_FRESH_OBSERVATION_DRIFT'; end if;`;
  const execute = (fragment, index) => {
    const tag = `$permission_fragment_${index}$`;
    if (fragment.sql.includes(tag)) throw new Error('STAGING_SQL_DELIMITER_COLLISION');
    return `-- ${index + 1}: ${fragment.path}\n if clock_timestamp()>=least(started_at+interval '50 seconds',${literal(binding.deadlineUtc)}::timestamptz) then raise exception 'STAGING_EXECUTION_WINDOW_CLOSED'; end if;\n execute ${tag}${fragment.sql}${tag};`;
  };
  const baseline = fragments.filter(f => f.phase === 'baseline');
  const rest = fragments.filter(f => f.phase !== 'baseline');
  const sql = `-- GENERATED OFFLINE. No database execution or business PASS is asserted.
-- One top-level DO is one implicitly transactional statement. Do not retry after an ambiguous response.
-- PostgreSQL17: https://www.postgresql.org/docs/17/sql-do.html
-- https://www.postgresql.org/docs/17/protocol-flow.html
do $permission_staging_bootstrap$
declare fresh jsonb; relation_row record; has_rows boolean; tenant_count integer; marker_count integer;
 started_at timestamptz:=clock_timestamp(); server_timeout_ms bigint;
begin
 select setting::bigint into server_timeout_ms from pg_settings where name='statement_timeout' and unit='ms';
 if server_timeout_ms is null or server_timeout_ms<=0 or server_timeout_ms>120000 then raise exception 'STAGING_SERVER_TIMEOUT_NOT_BOUNDED'; end if;
 -- This bounds future lock waits. No SET inside this DO is claimed to restart its statement timer.
 perform set_config('lock_timeout','5s',true);
 if clock_timestamp()>=${literal(binding.mutationCutoffUtc)}::timestamptz then raise exception 'STAGING_MUTATION_ADMISSION_CLOSED'; end if;
 if current_database()<>'postgres' or current_user<>${literal(observation.identity.currentUser)} then raise exception 'STAGING_IDENTITY_MISMATCH'; end if;
 perform pg_advisory_xact_lock(hashtext('pos-cafe:permission-staging-bootstrap:ineckiashpwloncxnbqx'));
 ${inspect}
 lock table auth.users,storage.buckets,storage.objects in share mode;
 ${inspect}
 if clock_timestamp()>=${literal(binding.mutationCutoffUtc)}::timestamptz then raise exception 'STAGING_MUTATION_ADMISSION_CLOSED'; end if;
 -- These two owned objects are the first writes, after locked freshness checks.
 create schema if not exists private;
 create table private.permission_staging_bootstrap_marker(
  singleton boolean primary key check(singleton),binding jsonb not null,
  state text not null check(state='COMMITTED_NOT_READY'));
 revoke all on private.permission_staging_bootstrap_marker from public,anon,authenticated,service_role;
 insert into private.permission_staging_bootstrap_marker values(true,${jsonLiteral(binding)},'COMMITTED_NOT_READY');
 execute 'comment on table private.permission_staging_bootstrap_marker is '||quote_literal(${jsonLiteral(binding)}::text);
 ${baseline.map(execute).join('\n')}
 ${tenantGuard(true)}
 ${rest.map((f,i)=>execute(f,i+baseline.length)).join('\n')}
 set constraints all immediate;
 ${tenantGuard(false)}
 if exists(select 1 from auth.users) or exists(select 1 from storage.objects) then raise exception 'STAGING_PROVIDER_DATA_DRIFT'; end if;
 if to_regtype('public.employee_role') is not null then raise exception 'STAGING_LEGACY_ENUM_REMAINS'; end if;
 if (select count(*) from private.permission_contract_gate where singleton and strict and contract_version=2)<>1 then raise exception 'STAGING_STRICT_GATE_FAILED'; end if;
 if (select array_agg(code order by code) from public.permission_roles) is distinct from array['cashier','kitchen','manager','owner','waiter']::text[]
 or (select count(*) from public.permission_catalog)<>15 then raise exception 'STAGING_CATALOG_POSTFLIGHT_FAILED'; end if;
 if not exists(select 1 from pg_constraint where conrelid='public.employees'::regclass and conname='employees_permission_role_fk' and contype='f' and convalidated)
 or not exists(select 1 from pg_trigger where tgrelid='public.employees'::regclass and tgname='employees_owner_boundary' and tgconstraint<>0 and tgenabled<>'D')
 or not exists(select 1 from pg_trigger where tgrelid='public.stores'::regclass and tgname='stores_owner_boundary' and tgconstraint<>0 and tgenabled<>'D') then raise exception 'STAGING_OWNER_BOUNDARY_FAILED'; end if;
 if not exists(select 1 from storage.buckets where id='menu-item-image-staging' and not public and file_size_limit=5242880)
 or (select count(*) from storage.buckets)<>2
 or exists(select 1 from pg_policy where polrelid='storage.objects'::regclass and polname=any(array['menu_item_images_public_read','menu_item_images_store_insert','menu_item_images_store_update','menu_item_images_store_delete','permission_image_staging_select','permission_image_staging_insert','permission_image_staging_update','permission_image_staging_delete'])) then raise exception 'STAGING_STORAGE_POSTFLIGHT_FAILED'; end if;
 if (select array_agg(tablename::text order by tablename) from pg_publication_tables where pubname='supabase_realtime' and schemaname='public')
 is distinct from array['permission_catalog_signals','store_change_signals']::text[] then raise exception 'STAGING_PUBLICATION_POSTFLIGHT_FAILED'; end if;
 if exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
 where n.nspname='public' and c.relkind in('r','p','v','m')
 and c.relname not in('store_change_signals','permission_catalog_signals')
 and not exists(select 1 from pg_depend d where d.classid='pg_class'::regclass and d.objid=c.oid and d.refclassid='pg_extension'::regclass and d.deptype='e')
 and (has_table_privilege('anon',c.oid,'SELECT') or has_table_privilege('authenticated',c.oid,'SELECT') or has_table_privilege('service_role',c.oid,'SELECT')))
 then raise exception 'STAGING_RAW_SELECT_EXPOSED'; end if;
 if exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
 cross join (values('anon'),('authenticated'),('service_role')) api(role_name)
 where n.nspname='public' and c.relkind in('r','p','v','m')
 and not exists(select 1 from pg_depend d where d.classid='pg_class'::regclass and d.objid=c.oid and d.refclassid='pg_extension'::regclass and d.deptype='e')
 and (not(api.role_name='authenticated' and c.relname in('store_change_signals','permission_catalog_signals'))
 and has_any_column_privilege(api.role_name,c.oid,'SELECT')
 or has_any_column_privilege(api.role_name,c.oid,'INSERT,UPDATE,REFERENCES')))
 then raise exception 'STAGING_RAW_COLUMN_PRIVILEGE_EXPOSED'; end if;
 if exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
 cross join (values('anon'),('authenticated'),('service_role')) api(role_name)
 where n.nspname='public' and c.relkind in('r','p','v','m')
 and not exists(select 1 from pg_depend d where d.classid='pg_class'::regclass and d.objid=c.oid and d.refclassid='pg_extension'::regclass and d.deptype='e')
 and (has_table_privilege(api.role_name,c.oid,'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
 or case when current_setting('server_version_num')::integer>=170000 then has_table_privilege(api.role_name,c.oid,'MAINTAIN') else false end))
 then raise exception 'STAGING_RAW_WRITE_OR_MAINTENANCE_EXPOSED'; end if;
 if has_table_privilege('anon','private.permission_staging_bootstrap_marker','SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
 or has_table_privilege('authenticated','private.permission_staging_bootstrap_marker','SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
 or has_table_privilege('service_role','private.permission_staging_bootstrap_marker','SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') then raise exception 'STAGING_MARKER_EXPOSED'; end if;
 if position('''writeProtocolVersion'',1' in pg_get_functiondef('public.get_write_capabilities()'::regprocedure))=0
 or position('''permissionContractVersion'',2' in pg_get_functiondef('public.get_write_capabilities()'::regprocedure))=0 then raise exception 'STAGING_CAPABILITY_POSTFLIGHT_FAILED'; end if;
 select count(*) into marker_count from private.permission_staging_bootstrap_marker where singleton and binding=${jsonLiteral(binding)};
 if marker_count<>1 then raise exception 'STAGING_MARKER_MISMATCH'; end if;
 if clock_timestamp()>=least(started_at+interval '50 seconds',${literal(binding.deadlineUtc)}::timestamptz) then raise exception 'STAGING_EXECUTION_WINDOW_CLOSED'; end if;
end $permission_staging_bootstrap$;
`;
  if ((sql.match(/\$permission_staging_bootstrap\$/g)??[]).length!==2) throw new Error('STAGING_OUTER_DELIMITER_COLLISION');
  return canonicalLf(sql);
}

export function renderReconcileSql(binding) {
  return canonicalLf(`-- Read-only reconciliation after any ambiguous outcome; never replay the bootstrap.
select jsonb_build_object('schemaVersion','permission-staging-bootstrap-reconcile-v1',
 'database',current_database(),'currentUser',current_user,
 'markerRelation',to_regclass('private.permission_staging_bootstrap_marker')::text,
 'markerBinding',obj_description(to_regclass('private.permission_staging_bootstrap_marker'),'pg_class')::jsonb,
 'expectedBinding',${jsonLiteral(binding)},
 'matchingMarkerObserved',coalesce(obj_description(to_regclass('private.permission_staging_bootstrap_marker'),'pg_class')::jsonb=${jsonLiteral(binding)},false),
 'legacyEnum',to_regtype('public.employee_role')::text,
 'storesRelation',to_regclass('public.stores')::text,
 'authUsers',(select count(*)::text from auth.users),
 'storageObjects',(select count(*)::text from storage.objects),
 'businessTestsRun',false,'ready',false) as permission_staging_bootstrap_reconcile;
`);
}
