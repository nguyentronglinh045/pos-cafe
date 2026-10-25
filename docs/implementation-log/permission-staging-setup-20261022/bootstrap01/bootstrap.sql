-- GENERATED OFFLINE. No database execution or business PASS is asserted.
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
 if clock_timestamp()>='2026-10-22T09:45:00.000Z'::timestamptz then raise exception 'STAGING_MUTATION_ADMISSION_CLOSED'; end if;
 if current_database()<>'postgres' or current_user<>'postgres' then raise exception 'STAGING_IDENTITY_MISMATCH'; end if;
 perform pg_advisory_xact_lock(hashtext('pos-cafe:permission-staging-bootstrap:ineckiashpwloncxnbqx'));
 select permission_staging_introspection into fresh from (-- permission-staging-introspection-v1: one SELECT, no setup or mutation.
-- Review and bind the SQL-editor project ref and this file's raw SHA256 first.
-- Counts only for Auth/Storage data; no application rows, secrets or function bodies.
with
execution_capabilities as (
  -- Keep the SELECT contract aligned with readReleaseExecutionCapabilities in
  -- scripts/permission-release-cutover.mjs. No elevated role is assumed.
  select current_user role,r.rolsuper superuser,r.rolbypassrls bypass_rls,r.rolcreaterole can_alter_roles,
    has_parameter_privilege(current_user,'pgrst.db_pre_request','SET') can_set_pgrst_hook,
    pg_has_role(current_user,c.relowner,'USAGE') can_manage_storage_objects,
    pg_get_userbyid(c.relowner) storage_objects_owner,
    current_setting('shared_preload_libraries') shared_preload,current_setting('session_preload_libraries') session_preload,
    exists(select 1 from pg_roles p where p.rolname='supabase_privileged_role'
      and pg_has_role(current_user,p.oid,'USAGE')) provider_role_usable,
    (select coalesce(jsonb_agg(jsonb_build_object('name',s.name,'setting',s.setting,'context',s.context,
      'source',s.source,'pending_restart',s.pending_restart) order by s.name),'[]'::jsonb) from pg_settings s
      where s.name in('supautils.privileged_role','supautils.privileged_role_allowed_configs',
        'supautils.reserved_roles','supautils.policy_grants')) provider_settings
    from pg_roles r cross join pg_class c where r.rolname=current_user and c.oid='storage.objects'::regclass
),
roles as (
  select rolname,rolsuper,rolinherit,rolcreaterole,rolcreatedb,
         rolcanlogin,rolreplication,rolbypassrls
  from pg_roles
  where rolname in (current_user,session_user,'anon','authenticated','service_role',
                    'authenticator','supabase_privileged_role','pos_owner_recovery')
),
recovery_memberships as (
  select pg_get_userbyid(m.roleid) role_name,
         pg_get_userbyid(m.member) member_name,
         pg_get_userbyid(m.grantor) grantor_name,m.admin_option
  from pg_auth_members m join pg_roles r on r.oid=m.roleid
  where r.rolname='pos_owner_recovery'
),
extensions as (
  select e.extname,e.extversion,n.nspname schema_name
  from pg_extension e join pg_namespace n on n.oid=e.extnamespace
),
schemas as (
  select n.nspname,pg_get_userbyid(n.nspowner) owner,n.nspacl::text acl
  from pg_namespace n
  where n.nspname in ('public','private','auth','storage','extensions')
),
default_acls as (
  select pg_get_userbyid(a.defaclrole) owner,coalesce(n.nspname,'*') schema_name,
         a.defaclobjtype object_type,a.defaclacl::text acl
  from pg_default_acl a left join pg_namespace n on n.oid=a.defaclnamespace
),
relations as (
  select n.nspname schema_name,c.relname,c.relkind,
         pg_get_userbyid(c.relowner) owner,c.relrowsecurity,c.relforcerowsecurity,
         c.relacl::text acl,
         (select e.extname from pg_depend d join pg_extension e on e.oid=d.refobjid
          where d.classid='pg_class'::regclass and d.objid=c.oid
            and d.refclassid='pg_extension'::regclass and d.deptype='e') extension_name
  from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname in ('public','private') and c.relkind in ('r','p','v','m','S','f')
),
functions as (
  select n.nspname schema_name,p.proname,
         pg_get_function_identity_arguments(p.oid) arguments,
         pg_get_userbyid(p.proowner) owner,p.prosecdef,p.proacl::text acl,
         (select e.extname from pg_depend d join pg_extension e on e.oid=d.refobjid
          where d.classid='pg_proc'::regclass and d.objid=p.oid
            and d.refclassid='pg_extension'::regclass and d.deptype='e') extension_name
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname in ('public','private')
),
types as (
  select n.nspname schema_name,t.typname,t.typtype,
         (select e.extname from pg_depend d join pg_extension e on e.oid=d.refobjid
          where d.classid='pg_type'::regclass and d.objid=t.oid
            and d.refclassid='pg_extension'::regclass and d.deptype='e') extension_name
  from pg_type t join pg_namespace n on n.oid=t.typnamespace
  where n.nspname in ('public','private') and t.typtype in ('e','d')
),
policies as (
  select n.nspname schema_name,c.relname,p.polname,p.polcmd,p.polpermissive,
         (p.polqual is not null) has_using,(p.polwithcheck is not null) has_check,
         (select coalesce(jsonb_agg(case when x.role_oid=0 then 'PUBLIC'
           else pg_get_userbyid(x.role_oid) end order by x.role_oid),'[]'::jsonb)
          from unnest(p.polroles) x(role_oid)) roles
  from pg_policy p join pg_class c on c.oid=p.polrelid
  join pg_namespace n on n.oid=c.relnamespace
  where n.nspname in ('public','private','storage')
),
publications as (
  select pubname,pg_get_userbyid(pubowner) owner,puballtables,
         pubinsert,pubupdate,pubdelete,pubtruncate
  from pg_publication
),
publication_tables as (
  select pubname,schemaname,tablename from pg_publication_tables
),
pre_request_settings as (
  select coalesce(d.datname,'*') database_name,r.rolname,setting
  from pg_db_role_setting s
  left join pg_database d on d.oid=s.setdatabase
  join pg_roles r on r.oid=s.setrole,
  lateral unnest(s.setconfig) setting
  where r.rolname='authenticator' and setting like 'pgrst.db_pre_request=%'
),
event_triggers as (
  select evtname,evtevent,evtenabled,evtfoid::regprocedure::text function_name
  from pg_event_trigger
)
select jsonb_build_object(
  'schemaVersion','permission-staging-introspection-v1',
  'identity',jsonb_build_object(
    'database',current_database(),'databaseOid',(select oid from pg_database where datname=current_database()),
    'sessionUser',session_user,'currentUser',current_user,'backendPid',pg_backend_pid(),
    'serverAddress',inet_server_addr()::text,'serverPort',inet_server_port(),
    'serverVersion',current_setting('server_version'),
    'serverVersionNum',current_setting('server_version_num'),
    'statementTimeout',current_setting('statement_timeout'),
    'lockTimeout',current_setting('lock_timeout'),
    'transactionReadOnly',current_setting('transaction_read_only'),
    'capturedAtUtc',to_char(statement_timestamp() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"')
  ),
  'prerequisites',jsonb_build_object(
    'authUsers',to_regclass('auth.users')::text,
    'storageBuckets',to_regclass('storage.buckets')::text,
    'storageObjects',to_regclass('storage.objects')::text,
    'authUid',to_regprocedure('auth.uid()')::text,
    'storageFoldername',to_regprocedure('storage.foldername(text)')::text,
    'existingStores',to_regclass('public.stores')::text,
    'existingTestMarker',to_regclass('private.idempotency_test_environment')::text,
    'pgcryptoCrypt',to_regprocedure('extensions.crypt(text,text)')::text,
    'pgcryptoSalt',to_regprocedure('extensions.gen_salt(text)')::text,
    'pgcryptoDigest',to_regprocedure('extensions.digest(bytea,text)')::text,
    'pgcryptoHmac',to_regprocedure('extensions.hmac(bytea,bytea,text)')::text,
    'pgcryptoRandomBytes',to_regprocedure('extensions.gen_random_bytes(integer)')::text
  ),
  'executionCapabilities',(select to_jsonb(c) from execution_capabilities c),
  'roles',(select coalesce(jsonb_agg(to_jsonb(r) order by rolname),'[]'::jsonb) from roles r),
  'recoveryMemberships',(select coalesce(jsonb_agg(to_jsonb(r) order by role_name,member_name,grantor_name),'[]'::jsonb) from recovery_memberships r),
  'extensions',(select coalesce(jsonb_agg(to_jsonb(e) order by extname),'[]'::jsonb) from extensions e),
  'schemas',(select coalesce(jsonb_agg(to_jsonb(s) order by nspname),'[]'::jsonb) from schemas s),
  'defaultAcls',(select coalesce(jsonb_agg(to_jsonb(a) order by owner,schema_name,object_type),'[]'::jsonb) from default_acls a),
  'relations',(select coalesce(jsonb_agg(to_jsonb(r) order by schema_name,relname),'[]'::jsonb) from relations r),
  'functions',(select coalesce(jsonb_agg(to_jsonb(f) order by schema_name,proname,arguments),'[]'::jsonb) from functions f),
  'types',(select coalesce(jsonb_agg(to_jsonb(t) order by schema_name,typname),'[]'::jsonb) from types t),
  'policies',(select coalesce(jsonb_agg(to_jsonb(p) order by schema_name,relname,polname),'[]'::jsonb) from policies p),
  'publications',(select coalesce(jsonb_agg(to_jsonb(p) order by pubname),'[]'::jsonb) from publications p),
  'publicationTables',(select coalesce(jsonb_agg(to_jsonb(p) order by pubname,schemaname,tablename),'[]'::jsonb) from publication_tables p),
  'preRequestSettings',(select coalesce(jsonb_agg(to_jsonb(s) order by database_name,rolname,setting),'[]'::jsonb) from pre_request_settings s),
  'eventTriggers',(select coalesce(jsonb_agg(to_jsonb(t) order by evtname),'[]'::jsonb) from event_triggers t),
  'dataCounts',jsonb_build_object(
    'authUsers',(select count(*)::text from auth.users),
    'storageBuckets',(select count(*)::text from storage.buckets),
    'storageObjects',(select count(*)::text from storage.objects)
  )
) as permission_staging_introspection) inspected;
 if fresh-'identity' is distinct from '{"roles":[{"rolname":"anon","rolsuper":false,"rolinherit":true,"rolcanlogin":false,"rolcreatedb":false,"rolbypassrls":false,"rolcreaterole":false,"rolreplication":false},{"rolname":"authenticated","rolsuper":false,"rolinherit":true,"rolcanlogin":false,"rolcreatedb":false,"rolbypassrls":false,"rolcreaterole":false,"rolreplication":false},{"rolname":"authenticator","rolsuper":false,"rolinherit":false,"rolcanlogin":true,"rolcreatedb":false,"rolbypassrls":false,"rolcreaterole":false,"rolreplication":false},{"rolname":"postgres","rolsuper":false,"rolinherit":true,"rolcanlogin":true,"rolcreatedb":true,"rolbypassrls":true,"rolcreaterole":true,"rolreplication":true},{"rolname":"service_role","rolsuper":false,"rolinherit":true,"rolcanlogin":false,"rolcreatedb":false,"rolbypassrls":true,"rolcreaterole":false,"rolreplication":false},{"rolname":"supabase_privileged_role","rolsuper":false,"rolinherit":true,"rolcanlogin":false,"rolcreatedb":false,"rolbypassrls":false,"rolcreaterole":false,"rolreplication":false}],"types":[],"schemas":[{"acl":"{supabase_admin=UC/supabase_admin,anon=U/supabase_admin,authenticated=U/supabase_admin,service_role=U/supabase_admin,supabase_auth_admin=UC/supabase_admin,dashboard_user=UC/supabase_admin,postgres=U/supabase_admin}","owner":"supabase_admin","nspname":"auth"},{"acl":"{postgres=UC/postgres,anon=U/postgres,authenticated=U/postgres,service_role=U/postgres,dashboard_user=UC/postgres}","owner":"postgres","nspname":"extensions"},{"acl":"{pg_database_owner=UC/pg_database_owner,=U/pg_database_owner,postgres=U/pg_database_owner,anon=U/pg_database_owner,authenticated=U/pg_database_owner,service_role=U/pg_database_owner}","owner":"pg_database_owner","nspname":"public"},{"acl":"{supabase_admin=UC/supabase_admin,postgres=U*/supabase_admin,anon=U/supabase_admin,authenticated=U/supabase_admin,service_role=U/supabase_admin,supabase_storage_admin=U*C*/supabase_admin,dashboard_user=UC/supabase_admin}","owner":"supabase_admin","nspname":"storage"}],"policies":[],"functions":[],"relations":[],"dataCounts":{"authUsers":"0","storageBuckets":"0","storageObjects":"0"},"extensions":[{"extname":"pg_stat_statements","extversion":"1.11","schema_name":"extensions"},{"extname":"pgcrypto","extversion":"1.3","schema_name":"extensions"},{"extname":"plpgsql","extversion":"1.0","schema_name":"pg_catalog"},{"extname":"supabase_vault","extversion":"0.3.1","schema_name":"vault"},{"extname":"uuid-ossp","extversion":"1.1","schema_name":"extensions"}],"defaultAcls":[{"acl":"{postgres=rwU/postgres}","owner":"postgres","object_type":"S","schema_name":"public"},{"acl":"{postgres=X/postgres}","owner":"postgres","object_type":"f","schema_name":"public"},{"acl":"{postgres=arwdDxtm/postgres,anon=Dxtm/postgres,authenticated=Dxtm/postgres,service_role=Dxtm/postgres}","owner":"postgres","object_type":"r","schema_name":"public"},{"acl":"{postgres=rwU/postgres,anon=rwU/postgres,authenticated=rwU/postgres,service_role=rwU/postgres}","owner":"postgres","object_type":"S","schema_name":"storage"},{"acl":"{postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}","owner":"postgres","object_type":"f","schema_name":"storage"},{"acl":"{postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres}","owner":"postgres","object_type":"r","schema_name":"storage"},{"acl":"{postgres=r*w*U*/supabase_admin}","owner":"supabase_admin","object_type":"S","schema_name":"extensions"},{"acl":"{postgres=X*/supabase_admin}","owner":"supabase_admin","object_type":"f","schema_name":"extensions"},{"acl":"{postgres=a*r*w*d*D*x*t*m*/supabase_admin}","owner":"supabase_admin","object_type":"r","schema_name":"extensions"},{"acl":"{postgres=rwU/supabase_admin,anon=rwU/supabase_admin,authenticated=rwU/supabase_admin,service_role=rwU/supabase_admin}","owner":"supabase_admin","object_type":"S","schema_name":"graphql"},{"acl":"{postgres=X/supabase_admin,anon=X/supabase_admin,authenticated=X/supabase_admin,service_role=X/supabase_admin}","owner":"supabase_admin","object_type":"f","schema_name":"graphql"},{"acl":"{postgres=arwdDxtm/supabase_admin,anon=arwdDxtm/supabase_admin,authenticated=arwdDxtm/supabase_admin,service_role=arwdDxtm/supabase_admin}","owner":"supabase_admin","object_type":"r","schema_name":"graphql"},{"acl":"{postgres=rwU/supabase_admin,anon=rwU/supabase_admin,authenticated=rwU/supabase_admin,service_role=rwU/supabase_admin}","owner":"supabase_admin","object_type":"S","schema_name":"graphql_public"},{"acl":"{postgres=X/supabase_admin,anon=X/supabase_admin,authenticated=X/supabase_admin,service_role=X/supabase_admin}","owner":"supabase_admin","object_type":"f","schema_name":"graphql_public"},{"acl":"{postgres=arwdDxtm/supabase_admin,anon=arwdDxtm/supabase_admin,authenticated=arwdDxtm/supabase_admin,service_role=arwdDxtm/supabase_admin}","owner":"supabase_admin","object_type":"r","schema_name":"graphql_public"},{"acl":"{postgres=rwU/supabase_admin,anon=rwU/supabase_admin,authenticated=rwU/supabase_admin,service_role=rwU/supabase_admin}","owner":"supabase_admin","object_type":"S","schema_name":"public"},{"acl":"{postgres=X/supabase_admin,anon=X/supabase_admin,authenticated=X/supabase_admin,service_role=X/supabase_admin}","owner":"supabase_admin","object_type":"f","schema_name":"public"},{"acl":"{postgres=arwdDxtm/supabase_admin,anon=arwdDxtm/supabase_admin,authenticated=arwdDxtm/supabase_admin,service_role=arwdDxtm/supabase_admin}","owner":"supabase_admin","object_type":"r","schema_name":"public"},{"acl":"{postgres=rwU/supabase_admin,dashboard_user=rwU/supabase_admin}","owner":"supabase_admin","object_type":"S","schema_name":"realtime"},{"acl":"{postgres=X/supabase_admin,dashboard_user=X/supabase_admin}","owner":"supabase_admin","object_type":"f","schema_name":"realtime"},{"acl":"{postgres=a*r*wdDxtm/supabase_admin,dashboard_user=arwdDxtm/supabase_admin}","owner":"supabase_admin","object_type":"r","schema_name":"realtime"},{"acl":"{postgres=rwU/supabase_auth_admin,dashboard_user=rwU/supabase_auth_admin}","owner":"supabase_auth_admin","object_type":"S","schema_name":"auth"},{"acl":"{postgres=X/supabase_auth_admin,dashboard_user=X/supabase_auth_admin}","owner":"supabase_auth_admin","object_type":"f","schema_name":"auth"},{"acl":"{postgres=arwdDxtm/supabase_auth_admin,dashboard_user=arwdDxtm/supabase_auth_admin}","owner":"supabase_auth_admin","object_type":"r","schema_name":"auth"}],"publications":[{"owner":"postgres","pubname":"supabase_realtime","pubdelete":true,"pubinsert":true,"pubupdate":true,"pubtruncate":true,"puballtables":false}],"eventTriggers":[{"evtname":"issue_graphql_placeholder","evtevent":"sql_drop","evtenabled":"O","function_name":"set_graphql_placeholder()"},{"evtname":"issue_pg_cron_access","evtevent":"ddl_command_end","evtenabled":"O","function_name":"grant_pg_cron_access()"},{"evtname":"issue_pg_graphql_access","evtevent":"ddl_command_end","evtenabled":"O","function_name":"grant_pg_graphql_access()"},{"evtname":"issue_pg_net_access","evtevent":"ddl_command_end","evtenabled":"O","function_name":"grant_pg_net_access()"},{"evtname":"pgrst_ddl_watch","evtevent":"ddl_command_end","evtenabled":"O","function_name":"pgrst_ddl_watch()"},{"evtname":"pgrst_drop_watch","evtevent":"sql_drop","evtenabled":"O","function_name":"pgrst_drop_watch()"}],"prerequisites":{"authUid":"auth.uid()","authUsers":"auth.users","pgcryptoHmac":"hmac(bytea,bytea,text)","pgcryptoSalt":"gen_salt(text)","pgcryptoCrypt":"crypt(text,text)","existingStores":null,"pgcryptoDigest":"digest(bytea,text)","storageBuckets":"storage.buckets","storageObjects":"storage.objects","storageFoldername":"storage.foldername(text)","existingTestMarker":null,"pgcryptoRandomBytes":"gen_random_bytes(integer)"},"schemaVersion":"permission-staging-introspection-v1","publicationTables":[],"preRequestSettings":[],"recoveryMemberships":[],"executionCapabilities":{"role":"postgres","superuser":false,"bypass_rls":true,"shared_preload":"pg_stat_statements, pgaudit, plpgsql, plpgsql_check, pg_cron, pg_net, pgsodium, auto_explain, pg_tle, plan_filter, supabase_vault","can_alter_roles":true,"session_preload":"supautils","provider_settings":[{"name":"supautils.policy_grants","source":"configuration file","context":"sighup","setting":"{\"postgres\":[\"auth.audit_log_entries\",\"auth.flow_state\",\"auth.identities\",\"auth.instances\",\"auth.mfa_amr_claims\",\"auth.mfa_challenges\",\"auth.mfa_factors\",\"auth.oauth_clients\",\"auth.one_time_tokens\",\"auth.refresh_tokens\",\"auth.saml_providers\",\"auth.saml_relay_states\",\"auth.sessions\",\"auth.sso_domains\",\"auth.sso_providers\",\"auth.users\",\"realtime.messages\",\"realtime.subscription\",\"storage.buckets\",\"storage.buckets_analytics\",\"storage.objects\",\"storage.prefixes\",\"storage.s3_multipart_uploads\",\"storage.s3_multipart_uploads_parts\"]}","pending_restart":false},{"name":"supautils.privileged_role","source":"configuration file","context":"sighup","setting":"supabase_privileged_role","pending_restart":false},{"name":"supautils.privileged_role_allowed_configs","source":"configuration file","context":"sighup","setting":"auto_explain.*, deadlock_timeout, log_duration, log_lock_waits, log_min_duration_statement, log_min_error_statement, log_min_messages, log_parameter_max_length, log_replication_commands, log_statement, log_temp_files, pg_net.batch_size, pg_net.ttl, pg_stat_statements.*, pgaudit.log, pgaudit.log_catalog, pgaudit.log_client, pgaudit.log_level, pgaudit.log_relation, pgaudit.log_rows, pgaudit.log_statement, pgaudit.log_statement_once, pgaudit.role, pgrst.*, plan_filter.*, safeupdate.enabled, session_replication_role, track_functions, track_io_timing, wal_compression","pending_restart":false},{"name":"supautils.reserved_roles","source":"configuration file","context":"sighup","setting":"supabase_admin, supabase_auth_admin, supabase_storage_admin, supabase_read_only_user, supabase_realtime_admin, supabase_replication_admin, supabase_etl_admin, dashboard_user, pgbouncer, service_role*, authenticator*, authenticated*, anon*, supabase_privileged_role","pending_restart":false}],"can_set_pgrst_hook":false,"provider_role_usable":true,"storage_objects_owner":"supabase_storage_admin","can_manage_storage_objects":false}}'::jsonb or
   jsonb_build_object('database',fresh#>'{identity,database}',
   'databaseOid',fresh#>'{identity,databaseOid}','sessionUser',fresh#>'{identity,sessionUser}',
   'currentUser',fresh#>'{identity,currentUser}','serverVersionNum',fresh#>'{identity,serverVersionNum}') is distinct from '{"database":"postgres","databaseOid":"5","sessionUser":"postgres","currentUser":"postgres","serverVersionNum":"170011"}'::jsonb then
  raise exception 'STAGING_FRESH_OBSERVATION_DRIFT'; end if;
 lock table auth.users,storage.buckets,storage.objects in share mode;
 select permission_staging_introspection into fresh from (-- permission-staging-introspection-v1: one SELECT, no setup or mutation.
-- Review and bind the SQL-editor project ref and this file's raw SHA256 first.
-- Counts only for Auth/Storage data; no application rows, secrets or function bodies.
with
execution_capabilities as (
  -- Keep the SELECT contract aligned with readReleaseExecutionCapabilities in
  -- scripts/permission-release-cutover.mjs. No elevated role is assumed.
  select current_user role,r.rolsuper superuser,r.rolbypassrls bypass_rls,r.rolcreaterole can_alter_roles,
    has_parameter_privilege(current_user,'pgrst.db_pre_request','SET') can_set_pgrst_hook,
    pg_has_role(current_user,c.relowner,'USAGE') can_manage_storage_objects,
    pg_get_userbyid(c.relowner) storage_objects_owner,
    current_setting('shared_preload_libraries') shared_preload,current_setting('session_preload_libraries') session_preload,
    exists(select 1 from pg_roles p where p.rolname='supabase_privileged_role'
      and pg_has_role(current_user,p.oid,'USAGE')) provider_role_usable,
    (select coalesce(jsonb_agg(jsonb_build_object('name',s.name,'setting',s.setting,'context',s.context,
      'source',s.source,'pending_restart',s.pending_restart) order by s.name),'[]'::jsonb) from pg_settings s
      where s.name in('supautils.privileged_role','supautils.privileged_role_allowed_configs',
        'supautils.reserved_roles','supautils.policy_grants')) provider_settings
    from pg_roles r cross join pg_class c where r.rolname=current_user and c.oid='storage.objects'::regclass
),
roles as (
  select rolname,rolsuper,rolinherit,rolcreaterole,rolcreatedb,
         rolcanlogin,rolreplication,rolbypassrls
  from pg_roles
  where rolname in (current_user,session_user,'anon','authenticated','service_role',
                    'authenticator','supabase_privileged_role','pos_owner_recovery')
),
recovery_memberships as (
  select pg_get_userbyid(m.roleid) role_name,
         pg_get_userbyid(m.member) member_name,
         pg_get_userbyid(m.grantor) grantor_name,m.admin_option
  from pg_auth_members m join pg_roles r on r.oid=m.roleid
  where r.rolname='pos_owner_recovery'
),
extensions as (
  select e.extname,e.extversion,n.nspname schema_name
  from pg_extension e join pg_namespace n on n.oid=e.extnamespace
),
schemas as (
  select n.nspname,pg_get_userbyid(n.nspowner) owner,n.nspacl::text acl
  from pg_namespace n
  where n.nspname in ('public','private','auth','storage','extensions')
),
default_acls as (
  select pg_get_userbyid(a.defaclrole) owner,coalesce(n.nspname,'*') schema_name,
         a.defaclobjtype object_type,a.defaclacl::text acl
  from pg_default_acl a left join pg_namespace n on n.oid=a.defaclnamespace
),
relations as (
  select n.nspname schema_name,c.relname,c.relkind,
         pg_get_userbyid(c.relowner) owner,c.relrowsecurity,c.relforcerowsecurity,
         c.relacl::text acl,
         (select e.extname from pg_depend d join pg_extension e on e.oid=d.refobjid
          where d.classid='pg_class'::regclass and d.objid=c.oid
            and d.refclassid='pg_extension'::regclass and d.deptype='e') extension_name
  from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname in ('public','private') and c.relkind in ('r','p','v','m','S','f')
),
functions as (
  select n.nspname schema_name,p.proname,
         pg_get_function_identity_arguments(p.oid) arguments,
         pg_get_userbyid(p.proowner) owner,p.prosecdef,p.proacl::text acl,
         (select e.extname from pg_depend d join pg_extension e on e.oid=d.refobjid
          where d.classid='pg_proc'::regclass and d.objid=p.oid
            and d.refclassid='pg_extension'::regclass and d.deptype='e') extension_name
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname in ('public','private')
),
types as (
  select n.nspname schema_name,t.typname,t.typtype,
         (select e.extname from pg_depend d join pg_extension e on e.oid=d.refobjid
          where d.classid='pg_type'::regclass and d.objid=t.oid
            and d.refclassid='pg_extension'::regclass and d.deptype='e') extension_name
  from pg_type t join pg_namespace n on n.oid=t.typnamespace
  where n.nspname in ('public','private') and t.typtype in ('e','d')
),
policies as (
  select n.nspname schema_name,c.relname,p.polname,p.polcmd,p.polpermissive,
         (p.polqual is not null) has_using,(p.polwithcheck is not null) has_check,
         (select coalesce(jsonb_agg(case when x.role_oid=0 then 'PUBLIC'
           else pg_get_userbyid(x.role_oid) end order by x.role_oid),'[]'::jsonb)
          from unnest(p.polroles) x(role_oid)) roles
  from pg_policy p join pg_class c on c.oid=p.polrelid
  join pg_namespace n on n.oid=c.relnamespace
  where n.nspname in ('public','private','storage')
),
publications as (
  select pubname,pg_get_userbyid(pubowner) owner,puballtables,
         pubinsert,pubupdate,pubdelete,pubtruncate
  from pg_publication
),
publication_tables as (
  select pubname,schemaname,tablename from pg_publication_tables
),
pre_request_settings as (
  select coalesce(d.datname,'*') database_name,r.rolname,setting
  from pg_db_role_setting s
  left join pg_database d on d.oid=s.setdatabase
  join pg_roles r on r.oid=s.setrole,
  lateral unnest(s.setconfig) setting
  where r.rolname='authenticator' and setting like 'pgrst.db_pre_request=%'
),
event_triggers as (
  select evtname,evtevent,evtenabled,evtfoid::regprocedure::text function_name
  from pg_event_trigger
)
select jsonb_build_object(
  'schemaVersion','permission-staging-introspection-v1',
  'identity',jsonb_build_object(
    'database',current_database(),'databaseOid',(select oid from pg_database where datname=current_database()),
    'sessionUser',session_user,'currentUser',current_user,'backendPid',pg_backend_pid(),
    'serverAddress',inet_server_addr()::text,'serverPort',inet_server_port(),
    'serverVersion',current_setting('server_version'),
    'serverVersionNum',current_setting('server_version_num'),
    'statementTimeout',current_setting('statement_timeout'),
    'lockTimeout',current_setting('lock_timeout'),
    'transactionReadOnly',current_setting('transaction_read_only'),
    'capturedAtUtc',to_char(statement_timestamp() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"')
  ),
  'prerequisites',jsonb_build_object(
    'authUsers',to_regclass('auth.users')::text,
    'storageBuckets',to_regclass('storage.buckets')::text,
    'storageObjects',to_regclass('storage.objects')::text,
    'authUid',to_regprocedure('auth.uid()')::text,
    'storageFoldername',to_regprocedure('storage.foldername(text)')::text,
    'existingStores',to_regclass('public.stores')::text,
    'existingTestMarker',to_regclass('private.idempotency_test_environment')::text,
    'pgcryptoCrypt',to_regprocedure('extensions.crypt(text,text)')::text,
    'pgcryptoSalt',to_regprocedure('extensions.gen_salt(text)')::text,
    'pgcryptoDigest',to_regprocedure('extensions.digest(bytea,text)')::text,
    'pgcryptoHmac',to_regprocedure('extensions.hmac(bytea,bytea,text)')::text,
    'pgcryptoRandomBytes',to_regprocedure('extensions.gen_random_bytes(integer)')::text
  ),
  'executionCapabilities',(select to_jsonb(c) from execution_capabilities c),
  'roles',(select coalesce(jsonb_agg(to_jsonb(r) order by rolname),'[]'::jsonb) from roles r),
  'recoveryMemberships',(select coalesce(jsonb_agg(to_jsonb(r) order by role_name,member_name,grantor_name),'[]'::jsonb) from recovery_memberships r),
  'extensions',(select coalesce(jsonb_agg(to_jsonb(e) order by extname),'[]'::jsonb) from extensions e),
  'schemas',(select coalesce(jsonb_agg(to_jsonb(s) order by nspname),'[]'::jsonb) from schemas s),
  'defaultAcls',(select coalesce(jsonb_agg(to_jsonb(a) order by owner,schema_name,object_type),'[]'::jsonb) from default_acls a),
  'relations',(select coalesce(jsonb_agg(to_jsonb(r) order by schema_name,relname),'[]'::jsonb) from relations r),
  'functions',(select coalesce(jsonb_agg(to_jsonb(f) order by schema_name,proname,arguments),'[]'::jsonb) from functions f),
  'types',(select coalesce(jsonb_agg(to_jsonb(t) order by schema_name,typname),'[]'::jsonb) from types t),
  'policies',(select coalesce(jsonb_agg(to_jsonb(p) order by schema_name,relname,polname),'[]'::jsonb) from policies p),
  'publications',(select coalesce(jsonb_agg(to_jsonb(p) order by pubname),'[]'::jsonb) from publications p),
  'publicationTables',(select coalesce(jsonb_agg(to_jsonb(p) order by pubname,schemaname,tablename),'[]'::jsonb) from publication_tables p),
  'preRequestSettings',(select coalesce(jsonb_agg(to_jsonb(s) order by database_name,rolname,setting),'[]'::jsonb) from pre_request_settings s),
  'eventTriggers',(select coalesce(jsonb_agg(to_jsonb(t) order by evtname),'[]'::jsonb) from event_triggers t),
  'dataCounts',jsonb_build_object(
    'authUsers',(select count(*)::text from auth.users),
    'storageBuckets',(select count(*)::text from storage.buckets),
    'storageObjects',(select count(*)::text from storage.objects)
  )
) as permission_staging_introspection) inspected;
 if fresh-'identity' is distinct from '{"roles":[{"rolname":"anon","rolsuper":false,"rolinherit":true,"rolcanlogin":false,"rolcreatedb":false,"rolbypassrls":false,"rolcreaterole":false,"rolreplication":false},{"rolname":"authenticated","rolsuper":false,"rolinherit":true,"rolcanlogin":false,"rolcreatedb":false,"rolbypassrls":false,"rolcreaterole":false,"rolreplication":false},{"rolname":"authenticator","rolsuper":false,"rolinherit":false,"rolcanlogin":true,"rolcreatedb":false,"rolbypassrls":false,"rolcreaterole":false,"rolreplication":false},{"rolname":"postgres","rolsuper":false,"rolinherit":true,"rolcanlogin":true,"rolcreatedb":true,"rolbypassrls":true,"rolcreaterole":true,"rolreplication":true},{"rolname":"service_role","rolsuper":false,"rolinherit":true,"rolcanlogin":false,"rolcreatedb":false,"rolbypassrls":true,"rolcreaterole":false,"rolreplication":false},{"rolname":"supabase_privileged_role","rolsuper":false,"rolinherit":true,"rolcanlogin":false,"rolcreatedb":false,"rolbypassrls":false,"rolcreaterole":false,"rolreplication":false}],"types":[],"schemas":[{"acl":"{supabase_admin=UC/supabase_admin,anon=U/supabase_admin,authenticated=U/supabase_admin,service_role=U/supabase_admin,supabase_auth_admin=UC/supabase_admin,dashboard_user=UC/supabase_admin,postgres=U/supabase_admin}","owner":"supabase_admin","nspname":"auth"},{"acl":"{postgres=UC/postgres,anon=U/postgres,authenticated=U/postgres,service_role=U/postgres,dashboard_user=UC/postgres}","owner":"postgres","nspname":"extensions"},{"acl":"{pg_database_owner=UC/pg_database_owner,=U/pg_database_owner,postgres=U/pg_database_owner,anon=U/pg_database_owner,authenticated=U/pg_database_owner,service_role=U/pg_database_owner}","owner":"pg_database_owner","nspname":"public"},{"acl":"{supabase_admin=UC/supabase_admin,postgres=U*/supabase_admin,anon=U/supabase_admin,authenticated=U/supabase_admin,service_role=U/supabase_admin,supabase_storage_admin=U*C*/supabase_admin,dashboard_user=UC/supabase_admin}","owner":"supabase_admin","nspname":"storage"}],"policies":[],"functions":[],"relations":[],"dataCounts":{"authUsers":"0","storageBuckets":"0","storageObjects":"0"},"extensions":[{"extname":"pg_stat_statements","extversion":"1.11","schema_name":"extensions"},{"extname":"pgcrypto","extversion":"1.3","schema_name":"extensions"},{"extname":"plpgsql","extversion":"1.0","schema_name":"pg_catalog"},{"extname":"supabase_vault","extversion":"0.3.1","schema_name":"vault"},{"extname":"uuid-ossp","extversion":"1.1","schema_name":"extensions"}],"defaultAcls":[{"acl":"{postgres=rwU/postgres}","owner":"postgres","object_type":"S","schema_name":"public"},{"acl":"{postgres=X/postgres}","owner":"postgres","object_type":"f","schema_name":"public"},{"acl":"{postgres=arwdDxtm/postgres,anon=Dxtm/postgres,authenticated=Dxtm/postgres,service_role=Dxtm/postgres}","owner":"postgres","object_type":"r","schema_name":"public"},{"acl":"{postgres=rwU/postgres,anon=rwU/postgres,authenticated=rwU/postgres,service_role=rwU/postgres}","owner":"postgres","object_type":"S","schema_name":"storage"},{"acl":"{postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}","owner":"postgres","object_type":"f","schema_name":"storage"},{"acl":"{postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres}","owner":"postgres","object_type":"r","schema_name":"storage"},{"acl":"{postgres=r*w*U*/supabase_admin}","owner":"supabase_admin","object_type":"S","schema_name":"extensions"},{"acl":"{postgres=X*/supabase_admin}","owner":"supabase_admin","object_type":"f","schema_name":"extensions"},{"acl":"{postgres=a*r*w*d*D*x*t*m*/supabase_admin}","owner":"supabase_admin","object_type":"r","schema_name":"extensions"},{"acl":"{postgres=rwU/supabase_admin,anon=rwU/supabase_admin,authenticated=rwU/supabase_admin,service_role=rwU/supabase_admin}","owner":"supabase_admin","object_type":"S","schema_name":"graphql"},{"acl":"{postgres=X/supabase_admin,anon=X/supabase_admin,authenticated=X/supabase_admin,service_role=X/supabase_admin}","owner":"supabase_admin","object_type":"f","schema_name":"graphql"},{"acl":"{postgres=arwdDxtm/supabase_admin,anon=arwdDxtm/supabase_admin,authenticated=arwdDxtm/supabase_admin,service_role=arwdDxtm/supabase_admin}","owner":"supabase_admin","object_type":"r","schema_name":"graphql"},{"acl":"{postgres=rwU/supabase_admin,anon=rwU/supabase_admin,authenticated=rwU/supabase_admin,service_role=rwU/supabase_admin}","owner":"supabase_admin","object_type":"S","schema_name":"graphql_public"},{"acl":"{postgres=X/supabase_admin,anon=X/supabase_admin,authenticated=X/supabase_admin,service_role=X/supabase_admin}","owner":"supabase_admin","object_type":"f","schema_name":"graphql_public"},{"acl":"{postgres=arwdDxtm/supabase_admin,anon=arwdDxtm/supabase_admin,authenticated=arwdDxtm/supabase_admin,service_role=arwdDxtm/supabase_admin}","owner":"supabase_admin","object_type":"r","schema_name":"graphql_public"},{"acl":"{postgres=rwU/supabase_admin,anon=rwU/supabase_admin,authenticated=rwU/supabase_admin,service_role=rwU/supabase_admin}","owner":"supabase_admin","object_type":"S","schema_name":"public"},{"acl":"{postgres=X/supabase_admin,anon=X/supabase_admin,authenticated=X/supabase_admin,service_role=X/supabase_admin}","owner":"supabase_admin","object_type":"f","schema_name":"public"},{"acl":"{postgres=arwdDxtm/supabase_admin,anon=arwdDxtm/supabase_admin,authenticated=arwdDxtm/supabase_admin,service_role=arwdDxtm/supabase_admin}","owner":"supabase_admin","object_type":"r","schema_name":"public"},{"acl":"{postgres=rwU/supabase_admin,dashboard_user=rwU/supabase_admin}","owner":"supabase_admin","object_type":"S","schema_name":"realtime"},{"acl":"{postgres=X/supabase_admin,dashboard_user=X/supabase_admin}","owner":"supabase_admin","object_type":"f","schema_name":"realtime"},{"acl":"{postgres=a*r*wdDxtm/supabase_admin,dashboard_user=arwdDxtm/supabase_admin}","owner":"supabase_admin","object_type":"r","schema_name":"realtime"},{"acl":"{postgres=rwU/supabase_auth_admin,dashboard_user=rwU/supabase_auth_admin}","owner":"supabase_auth_admin","object_type":"S","schema_name":"auth"},{"acl":"{postgres=X/supabase_auth_admin,dashboard_user=X/supabase_auth_admin}","owner":"supabase_auth_admin","object_type":"f","schema_name":"auth"},{"acl":"{postgres=arwdDxtm/supabase_auth_admin,dashboard_user=arwdDxtm/supabase_auth_admin}","owner":"supabase_auth_admin","object_type":"r","schema_name":"auth"}],"publications":[{"owner":"postgres","pubname":"supabase_realtime","pubdelete":true,"pubinsert":true,"pubupdate":true,"pubtruncate":true,"puballtables":false}],"eventTriggers":[{"evtname":"issue_graphql_placeholder","evtevent":"sql_drop","evtenabled":"O","function_name":"set_graphql_placeholder()"},{"evtname":"issue_pg_cron_access","evtevent":"ddl_command_end","evtenabled":"O","function_name":"grant_pg_cron_access()"},{"evtname":"issue_pg_graphql_access","evtevent":"ddl_command_end","evtenabled":"O","function_name":"grant_pg_graphql_access()"},{"evtname":"issue_pg_net_access","evtevent":"ddl_command_end","evtenabled":"O","function_name":"grant_pg_net_access()"},{"evtname":"pgrst_ddl_watch","evtevent":"ddl_command_end","evtenabled":"O","function_name":"pgrst_ddl_watch()"},{"evtname":"pgrst_drop_watch","evtevent":"sql_drop","evtenabled":"O","function_name":"pgrst_drop_watch()"}],"prerequisites":{"authUid":"auth.uid()","authUsers":"auth.users","pgcryptoHmac":"hmac(bytea,bytea,text)","pgcryptoSalt":"gen_salt(text)","pgcryptoCrypt":"crypt(text,text)","existingStores":null,"pgcryptoDigest":"digest(bytea,text)","storageBuckets":"storage.buckets","storageObjects":"storage.objects","storageFoldername":"storage.foldername(text)","existingTestMarker":null,"pgcryptoRandomBytes":"gen_random_bytes(integer)"},"schemaVersion":"permission-staging-introspection-v1","publicationTables":[],"preRequestSettings":[],"recoveryMemberships":[],"executionCapabilities":{"role":"postgres","superuser":false,"bypass_rls":true,"shared_preload":"pg_stat_statements, pgaudit, plpgsql, plpgsql_check, pg_cron, pg_net, pgsodium, auto_explain, pg_tle, plan_filter, supabase_vault","can_alter_roles":true,"session_preload":"supautils","provider_settings":[{"name":"supautils.policy_grants","source":"configuration file","context":"sighup","setting":"{\"postgres\":[\"auth.audit_log_entries\",\"auth.flow_state\",\"auth.identities\",\"auth.instances\",\"auth.mfa_amr_claims\",\"auth.mfa_challenges\",\"auth.mfa_factors\",\"auth.oauth_clients\",\"auth.one_time_tokens\",\"auth.refresh_tokens\",\"auth.saml_providers\",\"auth.saml_relay_states\",\"auth.sessions\",\"auth.sso_domains\",\"auth.sso_providers\",\"auth.users\",\"realtime.messages\",\"realtime.subscription\",\"storage.buckets\",\"storage.buckets_analytics\",\"storage.objects\",\"storage.prefixes\",\"storage.s3_multipart_uploads\",\"storage.s3_multipart_uploads_parts\"]}","pending_restart":false},{"name":"supautils.privileged_role","source":"configuration file","context":"sighup","setting":"supabase_privileged_role","pending_restart":false},{"name":"supautils.privileged_role_allowed_configs","source":"configuration file","context":"sighup","setting":"auto_explain.*, deadlock_timeout, log_duration, log_lock_waits, log_min_duration_statement, log_min_error_statement, log_min_messages, log_parameter_max_length, log_replication_commands, log_statement, log_temp_files, pg_net.batch_size, pg_net.ttl, pg_stat_statements.*, pgaudit.log, pgaudit.log_catalog, pgaudit.log_client, pgaudit.log_level, pgaudit.log_relation, pgaudit.log_rows, pgaudit.log_statement, pgaudit.log_statement_once, pgaudit.role, pgrst.*, plan_filter.*, safeupdate.enabled, session_replication_role, track_functions, track_io_timing, wal_compression","pending_restart":false},{"name":"supautils.reserved_roles","source":"configuration file","context":"sighup","setting":"supabase_admin, supabase_auth_admin, supabase_storage_admin, supabase_read_only_user, supabase_realtime_admin, supabase_replication_admin, supabase_etl_admin, dashboard_user, pgbouncer, service_role*, authenticator*, authenticated*, anon*, supabase_privileged_role","pending_restart":false}],"can_set_pgrst_hook":false,"provider_role_usable":true,"storage_objects_owner":"supabase_storage_admin","can_manage_storage_objects":false}}'::jsonb or
   jsonb_build_object('database',fresh#>'{identity,database}',
   'databaseOid',fresh#>'{identity,databaseOid}','sessionUser',fresh#>'{identity,sessionUser}',
   'currentUser',fresh#>'{identity,currentUser}','serverVersionNum',fresh#>'{identity,serverVersionNum}') is distinct from '{"database":"postgres","databaseOid":"5","sessionUser":"postgres","currentUser":"postgres","serverVersionNum":"170011"}'::jsonb then
  raise exception 'STAGING_FRESH_OBSERVATION_DRIFT'; end if;
 if clock_timestamp()>='2026-10-22T09:45:00.000Z'::timestamptz then raise exception 'STAGING_MUTATION_ADMISSION_CLOSED'; end if;
 -- These two owned objects are the first writes, after locked freshness checks.
 create schema if not exists private;
 create table private.permission_staging_bootstrap_marker(
  singleton boolean primary key check(singleton),binding jsonb not null,
  state text not null check(state='COMMITTED_NOT_READY'));
 revoke all on private.permission_staging_bootstrap_marker from public,anon,authenticated,service_role;
 insert into private.permission_staging_bootstrap_marker values(true,'{"projectRef":"ineckiashpwloncxnbqx","database":"postgres","nonce":"c439a96e8e0a4088865f74185b9a121d","sourceHead":"b2e3122866f5b6108f026f381f4f12614c98027c","sourceFingerprint":"b966736214d772b33ebcc37bf6d5ad8e8df79c861d09d877dc6db13ffd6758dd","rawSqlBundleSha256":"efbd60e136525932704547f13ecccf4ff72e688402f178050502fb92fde68d34","canonicalSqlBundleSha256":"efbd60e136525932704547f13ecccf4ff72e688402f178050502fb92fde68d34","controllersSha256":"b988353c053b5dc860fd7e2854e70b90b18db3c30a866e7cfbdc56a806768bd9","observationSha256":"3ff90ea220d35841d478f9e407fbd803a133051c74e77b16606874612e44d6a0","allowlistSha256":"7b39addc2ad0924e3be9b38e01149b7b73e72ba8a5d4883ba8ec1afbb250479f","allowlistRawSha256":"d997fe5e4c9522e1a7df4815211c994f3deb8735a0db7c82f04f5a79813d460e","predecessorClaimSha256":"3cd550a64bf676090ea3be7d277287173dbd4063f545a46577a5b3068957f766","predecessorBootstrapManifestSha256":"789ca2430e6c38dc1d31f6ee165022a2f537d8a1550941fffb24d74872373204","phaseId":"permission-staging-setup-20261022-1700","phasePolicyRawSha256":"da8f14f4ebdfe6c55a45be1577dca40b52bc3eb6f8021f556cf79a9f39c577a0","phasePolicyCanonicalSha256":"644bb8dcbab6ba2d0b7f8eedd0dec7e3951a0d3fbd68eabe7a43c7015cd81cb8","successorHelperSha256":"87d0a39b5219ad83581d688b69869bfc1cab80455e13873ac1b2d624d3acb3d4","mutationCutoffUtc":"2026-10-22T09:45:00.000Z","deadlineUtc":"2026-10-22T10:00:00.000Z"}'::jsonb,'COMMITTED_NOT_READY');
 execute 'comment on table private.permission_staging_bootstrap_marker is '||quote_literal('{"projectRef":"ineckiashpwloncxnbqx","database":"postgres","nonce":"c439a96e8e0a4088865f74185b9a121d","sourceHead":"b2e3122866f5b6108f026f381f4f12614c98027c","sourceFingerprint":"b966736214d772b33ebcc37bf6d5ad8e8df79c861d09d877dc6db13ffd6758dd","rawSqlBundleSha256":"efbd60e136525932704547f13ecccf4ff72e688402f178050502fb92fde68d34","canonicalSqlBundleSha256":"efbd60e136525932704547f13ecccf4ff72e688402f178050502fb92fde68d34","controllersSha256":"b988353c053b5dc860fd7e2854e70b90b18db3c30a866e7cfbdc56a806768bd9","observationSha256":"3ff90ea220d35841d478f9e407fbd803a133051c74e77b16606874612e44d6a0","allowlistSha256":"7b39addc2ad0924e3be9b38e01149b7b73e72ba8a5d4883ba8ec1afbb250479f","allowlistRawSha256":"d997fe5e4c9522e1a7df4815211c994f3deb8735a0db7c82f04f5a79813d460e","predecessorClaimSha256":"3cd550a64bf676090ea3be7d277287173dbd4063f545a46577a5b3068957f766","predecessorBootstrapManifestSha256":"789ca2430e6c38dc1d31f6ee165022a2f537d8a1550941fffb24d74872373204","phaseId":"permission-staging-setup-20261022-1700","phasePolicyRawSha256":"da8f14f4ebdfe6c55a45be1577dca40b52bc3eb6f8021f556cf79a9f39c577a0","phasePolicyCanonicalSha256":"644bb8dcbab6ba2d0b7f8eedd0dec7e3951a0d3fbd68eabe7a43c7015cd81cb8","successorHelperSha256":"87d0a39b5219ad83581d688b69869bfc1cab80455e13873ac1b2d624d3acb3d4","mutationCutoffUtc":"2026-10-22T09:45:00.000Z","deadlineUtc":"2026-10-22T10:00:00.000Z"}'::jsonb::text);
 -- 1: supabase/migrations/001_schema_enums.sql
 if clock_timestamp()>=least(started_at+interval '50 seconds','2026-10-22T10:00:00.000Z'::timestamptz) then raise exception 'STAGING_EXECUTION_WINDOW_CLOSED'; end if;
 execute $permission_fragment_0$create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create sequence if not exists public.store_no_seq;

create type public.employee_role as enum ('admin', 'cashier', 'kitchen');
create type public.seed_status as enum ('pending', 'seeded', 'failed');
create type public.option_select_type as enum ('single', 'multi');
create type public.table_shape as enum ('round', 'square', 'rectangle');
create type public.table_status as enum ('empty', 'occupied');
create type public.decor_kind as enum ('wall', 'plant', 'counter', 'door', 'decor', 'image');
create type public.order_type as enum ('dine_in', 'takeaway');
create type public.order_status as enum ('open', 'paid', 'void');
create type public.order_item_status as enum ('waiting', 'done', 'removed');
create type public.discount_type as enum ('none', 'percent', 'amount');
create type public.payment_method as enum ('cash', 'bank_transfer', 'qr', 'other');

create table public.stores (
  id uuid primary key references auth.users (id) on delete cascade,
  store_no integer not null unique,
  name text,
  email text,
  seed_status public.seed_status not null default 'pending',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.employees (
  id uuid primary key,
  store_id uuid not null references public.stores (id) on delete cascade,
  name text not null,
  role public.employee_role not null,
  passcode_hash text not null,
  is_active boolean not null default true,
  seed_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, id)
);

create table public.store_settings (
  store_id uuid primary key references public.stores (id) on delete cascade,
  display_name text not null default 'POS Demo',
  address text not null default '',
  currency text not null default 'VND',
  timezone text not null default 'Asia/Saigon',
  bill_footer text not null default '',
  qr_info jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint store_settings_currency_vnd check (currency = 'VND')
);

create table public.categories (
  id uuid primary key,
  store_id uuid not null references public.stores (id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  seed_key text,
  deleted_at timestamptz,
  deleted_by_employee_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, id),
  foreign key (store_id, deleted_by_employee_id) references public.employees (store_id, id)
);

create table public.menu_items (
  id uuid primary key,
  store_id uuid not null references public.stores (id) on delete cascade,
  category_id uuid not null,
  name text not null,
  price integer not null check (price >= 0),
  image_asset_key text,
  sort_order integer not null default 0,
  is_available boolean not null default true,
  seed_key text,
  deleted_at timestamptz,
  deleted_by_employee_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, id),
  foreign key (store_id, category_id) references public.categories (store_id, id),
  foreign key (store_id, deleted_by_employee_id) references public.employees (store_id, id)
);

create table public.option_groups (
  id uuid primary key,
  store_id uuid not null references public.stores (id) on delete cascade,
  menu_item_id uuid not null,
  name text not null,
  select_type public.option_select_type not null,
  is_required boolean not null default false,
  min_select integer not null default 0,
  max_select integer not null default 1,
  sort_order integer not null default 0,
  seed_key text,
  deleted_at timestamptz,
  deleted_by_employee_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, id),
  foreign key (store_id, menu_item_id) references public.menu_items (store_id, id),
  foreign key (store_id, deleted_by_employee_id) references public.employees (store_id, id),
  constraint option_group_select_bounds check (min_select >= 0 and max_select >= min_select)
);

create table public.option_values (
  id uuid primary key,
  store_id uuid not null references public.stores (id) on delete cascade,
  option_group_id uuid not null,
  name text not null,
  price_delta integer not null default 0,
  sort_order integer not null default 0,
  seed_key text,
  deleted_at timestamptz,
  deleted_by_employee_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, id),
  foreign key (store_id, option_group_id) references public.option_groups (store_id, id),
  foreign key (store_id, deleted_by_employee_id) references public.employees (store_id, id)
);

create table public.floor_areas (
  id uuid primary key,
  store_id uuid not null references public.stores (id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  seed_key text,
  deleted_at timestamptz,
  deleted_by_employee_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, id),
  foreign key (store_id, deleted_by_employee_id) references public.employees (store_id, id)
);

create table public.tables (
  id uuid primary key,
  store_id uuid not null references public.stores (id) on delete cascade,
  area_id uuid not null,
  name text not null,
  background_asset_key text,
  pos_x integer not null,
  pos_y integer not null,
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  shape public.table_shape not null,
  rotation integer not null default 0,
  seats integer not null default 2,
  sort_order integer not null default 0,
  status public.table_status not null default 'empty',
  seed_key text,
  deleted_at timestamptz,
  deleted_by_employee_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, id),
  foreign key (store_id, area_id) references public.floor_areas (store_id, id),
  foreign key (store_id, deleted_by_employee_id) references public.employees (store_id, id)
);

create table public.floor_decor_items (
  id uuid primary key,
  store_id uuid not null references public.stores (id) on delete cascade,
  area_id uuid not null,
  kind public.decor_kind not null,
  label text,
  asset_key text not null,
  pos_x integer not null,
  pos_y integer not null,
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  rotation integer not null default 0,
  z_index integer not null default 0,
  is_locked boolean not null default false,
  seed_key text,
  deleted_at timestamptz,
  deleted_by_employee_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, id),
  foreign key (store_id, area_id) references public.floor_areas (store_id, id),
  foreign key (store_id, deleted_by_employee_id) references public.employees (store_id, id)
);

create table public.orders (
  id uuid primary key,
  store_id uuid not null references public.stores (id) on delete cascade,
  table_id uuid,
  order_type public.order_type not null,
  order_no integer not null,
  business_date date not null,
  status public.order_status not null default 'open',
  subtotal integer not null default 0,
  discount_type public.discount_type not null default 'none',
  discount_value integer not null default 0,
  total integer not null default 0,
  employee_id uuid not null,
  paid_at timestamptz,
  lock_version integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, id),
  unique (store_id, business_date, order_no),
  foreign key (store_id, table_id) references public.tables (store_id, id),
  foreign key (store_id, employee_id) references public.employees (store_id, id),
  constraint order_money_nonnegative check (subtotal >= 0 and discount_value >= 0 and total >= 0)
);

create table public.order_items (
  id uuid primary key,
  store_id uuid not null references public.stores (id) on delete cascade,
  order_id uuid not null,
  menu_item_id uuid,
  item_name text not null,
  quantity integer not null check (quantity >= 0),
  unit_price integer not null check (unit_price >= 0),
  note text,
  status public.order_item_status not null default 'waiting',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, id),
  foreign key (store_id, order_id) references public.orders (store_id, id) on delete cascade,
  foreign key (store_id, menu_item_id) references public.menu_items (store_id, id)
);

create table public.order_item_options (
  id uuid primary key,
  store_id uuid not null references public.stores (id) on delete cascade,
  order_item_id uuid not null,
  option_value_id uuid,
  option_name text not null,
  price_delta integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, id),
  foreign key (store_id, order_item_id) references public.order_items (store_id, id) on delete cascade,
  foreign key (store_id, option_value_id) references public.option_values (store_id, id)
);

create table public.payments (
  id uuid primary key,
  store_id uuid not null references public.stores (id) on delete cascade,
  order_id uuid not null,
  employee_id uuid not null,
  method public.payment_method not null,
  amount integer not null check (amount >= 0),
  received_amount integer not null check (received_amount >= 0),
  change_amount integer not null check (change_amount >= 0),
  paid_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, id),
  foreign key (store_id, order_id) references public.orders (store_id, id),
  foreign key (store_id, employee_id) references public.employees (store_id, id)
);
$permission_fragment_0$;
-- 2: supabase/migrations/002_indexes_rls_triggers.sql
 if clock_timestamp()>=least(started_at+interval '50 seconds','2026-10-22T10:00:00.000Z'::timestamptz) then raise exception 'STAGING_EXECUTION_WINDOW_CLOSED'; end if;
 execute $permission_fragment_1$create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger employees_set_updated_at before update on public.employees
for each row execute function public.set_updated_at();

create trigger stores_set_updated_at before update on public.stores
for each row execute function public.set_updated_at();

create trigger store_settings_set_updated_at before update on public.store_settings
for each row execute function public.set_updated_at();

create trigger categories_set_updated_at before update on public.categories
for each row execute function public.set_updated_at();

create trigger menu_items_set_updated_at before update on public.menu_items
for each row execute function public.set_updated_at();

create trigger option_groups_set_updated_at before update on public.option_groups
for each row execute function public.set_updated_at();

create trigger option_values_set_updated_at before update on public.option_values
for each row execute function public.set_updated_at();

create trigger floor_areas_set_updated_at before update on public.floor_areas
for each row execute function public.set_updated_at();

create trigger tables_set_updated_at before update on public.tables
for each row execute function public.set_updated_at();

create trigger floor_decor_items_set_updated_at before update on public.floor_decor_items
for each row execute function public.set_updated_at();

create trigger orders_set_updated_at before update on public.orders
for each row execute function public.set_updated_at();

create trigger order_items_set_updated_at before update on public.order_items
for each row execute function public.set_updated_at();

create trigger order_item_options_set_updated_at before update on public.order_item_options
for each row execute function public.set_updated_at();

create trigger payments_set_updated_at before update on public.payments
for each row execute function public.set_updated_at();

create index employees_store_active_idx on public.employees (store_id, is_active);
create unique index employees_store_seed_key_idx on public.employees (store_id, seed_key) where seed_key is not null;
create index categories_store_active_idx on public.categories (store_id, sort_order) where deleted_at is null;
create unique index categories_store_seed_key_idx on public.categories (store_id, seed_key) where seed_key is not null;
create index menu_items_store_category_active_idx on public.menu_items (store_id, category_id, sort_order) where deleted_at is null;
create unique index menu_items_store_seed_key_idx on public.menu_items (store_id, seed_key) where seed_key is not null;
create index option_groups_store_item_active_idx on public.option_groups (store_id, menu_item_id, sort_order) where deleted_at is null;
create unique index option_groups_store_seed_key_idx on public.option_groups (store_id, seed_key) where seed_key is not null;
create index option_values_store_group_active_idx on public.option_values (store_id, option_group_id, sort_order) where deleted_at is null;
create unique index option_values_store_seed_key_idx on public.option_values (store_id, seed_key) where seed_key is not null;
create index floor_areas_store_active_idx on public.floor_areas (store_id, sort_order) where deleted_at is null;
create unique index floor_areas_store_seed_key_idx on public.floor_areas (store_id, seed_key) where seed_key is not null;
create index tables_store_area_active_idx on public.tables (store_id, area_id, sort_order) where deleted_at is null;
create unique index tables_store_seed_key_idx on public.tables (store_id, seed_key) where seed_key is not null;
create index floor_decor_items_store_area_active_idx on public.floor_decor_items (store_id, area_id, z_index) where deleted_at is null;
create unique index floor_decor_items_store_seed_key_idx on public.floor_decor_items (store_id, seed_key) where seed_key is not null;
create index orders_store_status_idx on public.orders (store_id, status, business_date desc);
create unique index orders_store_table_open_idx on public.orders (store_id, table_id) where status = 'open' and table_id is not null;
create index order_items_store_order_idx on public.order_items (store_id, order_id, sort_order);
create index payments_store_paid_at_idx on public.payments (store_id, paid_at desc);

alter table public.stores enable row level security;
alter table public.employees enable row level security;
alter table public.store_settings enable row level security;
alter table public.categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.option_groups enable row level security;
alter table public.option_values enable row level security;
alter table public.floor_areas enable row level security;
alter table public.tables enable row level security;
alter table public.floor_decor_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_item_options enable row level security;
alter table public.payments enable row level security;

create policy stores_is_current_auth_user on public.stores
for all using (id = auth.uid()) with check (id = auth.uid());

create policy employees_store_is_auth_user on public.employees
for all using (store_id = auth.uid()) with check (store_id = auth.uid());

create policy store_settings_store_is_auth_user on public.store_settings
for all using (store_id = auth.uid()) with check (store_id = auth.uid());

create policy categories_store_is_auth_user on public.categories
for all using (store_id = auth.uid()) with check (store_id = auth.uid());

create policy menu_items_store_is_auth_user on public.menu_items
for all using (store_id = auth.uid()) with check (store_id = auth.uid());

create policy option_groups_store_is_auth_user on public.option_groups
for all using (store_id = auth.uid()) with check (store_id = auth.uid());

create policy option_values_store_is_auth_user on public.option_values
for all using (store_id = auth.uid()) with check (store_id = auth.uid());

create policy floor_areas_store_is_auth_user on public.floor_areas
for all using (store_id = auth.uid()) with check (store_id = auth.uid());

create policy tables_store_is_auth_user on public.tables
for all using (store_id = auth.uid()) with check (store_id = auth.uid());

create policy floor_decor_items_store_is_auth_user on public.floor_decor_items
for all using (store_id = auth.uid()) with check (store_id = auth.uid());

create policy orders_store_is_auth_user on public.orders
for all using (store_id = auth.uid()) with check (store_id = auth.uid());

create policy order_items_store_is_auth_user on public.order_items
for all using (store_id = auth.uid()) with check (store_id = auth.uid());

create policy order_item_options_store_is_auth_user on public.order_item_options
for all using (store_id = auth.uid()) with check (store_id = auth.uid());

create policy payments_store_is_auth_user on public.payments
for all using (store_id = auth.uid()) with check (store_id = auth.uid());
$permission_fragment_1$;
-- 3: supabase/migrations/003_rpc_functions.sql
 if clock_timestamp()>=least(started_at+interval '50 seconds','2026-10-22T10:00:00.000Z'::timestamptz) then raise exception 'STAGING_EXECUTION_WINDOW_CLOSED'; end if;
 execute $permission_fragment_2$create or replace function public.get_next_store_no()
returns integer
language sql
security definer
set search_path = public
as $$
  select nextval('public.store_no_seq')::integer;
$$;

create or replace function public.hash_employee_pin(p_pin text)
returns text
language sql
security definer
set search_path = public
as $$
  select extensions.crypt(p_pin, extensions.gen_salt('bf'));
$$;

create or replace function public.verify_employee_pin(
  p_employee_id uuid,
  p_pin text
) returns table (
  id uuid,
  name text,
  role public.employee_role
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select e.id, e.name, e.role
  from public.employees e
  where e.store_id = auth.uid()
    and e.id = p_employee_id
    and e.is_active = true
    and e.passcode_hash = extensions.crypt(p_pin, e.passcode_hash);

  if not found then
    raise exception 'INVALID_PIN'
      using errcode = 'P0001',
            hint = 'Employee must be active and PIN must match.';
  end if;
end;
$$;

create or replace function public.submit_order_changes(
  p_order_id uuid,
  p_table_id uuid,
  p_order_type public.order_type,
  p_employee_id uuid,
  p_expected_lock_version integer,
  p_items jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_store_id uuid := auth.uid();
  v_employee_role public.employee_role;
  v_existing_order public.orders%rowtype;
  v_has_existing_order boolean := false;
  v_table public.tables%rowtype;
  v_table_name text;
  v_timezone text;
  v_business_date date;
  v_order_no integer;
  v_order_type public.order_type;
  v_lock_version integer := 0;
  v_active_count integer := 0;
  v_subtotal integer := 0;
  v_total integer := 0;
  v_sort_order integer := 0;
  v_item record;
  v_option record;
  v_menu_item public.menu_items%rowtype;
  v_option_value record;
  v_option_total integer;
  v_lines jsonb := '[]'::jsonb;
  v_ticket jsonb;
begin
  if v_store_id is null then
    raise exception 'AUTH_REQUIRED'
      using errcode = 'P0001',
            hint = 'A store session is required.';
  end if;

  select e.role
  into v_employee_role
  from public.employees e
  where e.store_id = v_store_id
    and e.id = p_employee_id
    and e.is_active = true;

  if not found then
    raise exception 'FORBIDDEN'
      using errcode = 'P0001',
            hint = 'Employee must be active and belong to the current store.';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'INVALID_ORDER_ITEMS'
      using errcode = 'P0001',
            hint = 'p_items must be a jsonb array.';
  end if;

  perform pg_advisory_xact_lock(hashtext(v_store_id::text || ':pos-write'));

  if p_order_type = 'takeaway'::public.order_type then
    p_table_id := null;
  end if;

  select count(*)
  into v_active_count
  from jsonb_to_recordset(p_items) as item(
    id uuid,
    "menuItemId" uuid,
    quantity integer,
    note text,
    options jsonb
  )
  where coalesce(item.quantity, 0) > 0;

  if exists (
    select 1
    from jsonb_to_recordset(p_items) as item(
      id uuid,
      "menuItemId" uuid,
      quantity integer,
      note text,
      options jsonb
    )
    where coalesce(item.quantity, 0) < 0
  ) then
    raise exception 'INVALID_ORDER_ITEMS'
      using errcode = 'P0001',
            hint = 'Item quantity must be non-negative.';
  end if;

  if p_order_id is null then
    if v_active_count = 0 then
      return jsonb_build_object(
        'orderId', null,
        'status', 'void',
        'tableId', p_table_id,
        'tableStatus', null,
        'orderNo', 0,
        'businessDate', null,
        'lockVersion', 0,
        'ticket', null
      );
    end if;

    raise exception 'INVALID_ORDER_ID'
      using errcode = 'P0001',
            hint = 'New orders must pass a client-generated p_order_id UUID.';
  end if;

  if p_table_id is not null then
    select *
    into v_table
    from public.tables t
    where t.store_id = v_store_id
      and t.id = p_table_id
      and t.deleted_at is null
    for update;

    if not found then
      raise exception 'TABLE_NOT_FOUND'
        using errcode = 'P0001',
              hint = 'Table must exist, be active, and belong to the current store.';
    end if;

    v_table_name := v_table.name;
  end if;

  select *
  into v_existing_order
  from public.orders o
  where o.store_id = v_store_id
    and o.id = p_order_id
  for update;

  v_has_existing_order := found;

  if v_has_existing_order then
    v_order_type := v_existing_order.order_type;

    if v_existing_order.status <> 'open'::public.order_status
      or v_existing_order.lock_version <> p_expected_lock_version then
      raise exception 'ORDER_VERSION_CONFLICT'
        using errcode = 'P0001',
              hint = 'Order status or lock_version changed before submit.';
    end if;

    if v_existing_order.table_id is not null and p_table_id is distinct from v_existing_order.table_id then
      p_table_id := v_existing_order.table_id;
      select *
      into v_table
      from public.tables t
      where t.store_id = v_store_id
        and t.id = p_table_id
      for update;
      v_table_name := v_table.name;
    end if;

    if exists (
      select 1
      from jsonb_to_recordset(p_items) as item(
        id uuid,
        "menuItemId" uuid,
        quantity integer,
        note text,
        options jsonb
      )
      join public.order_items oi
        on oi.store_id = v_store_id
       and oi.order_id = p_order_id
       and oi.id = item.id
      where coalesce(item.quantity, 0) > 0
    ) then
      raise exception 'INVALID_ORDER_ITEMS'
        using errcode = 'P0001',
              hint = 'Replace-submit must use fresh client UUIDs for active order_items.';
    end if;

    update public.order_items oi
    set status = 'removed'::public.order_item_status
    where oi.store_id = v_store_id
      and oi.order_id = p_order_id
      and oi.status <> 'removed'::public.order_item_status;

    if v_active_count = 0 then
      update public.orders o
      set status = 'void'::public.order_status,
          subtotal = 0,
          discount_type = 'none'::public.discount_type,
          discount_value = 0,
          total = 0,
          lock_version = o.lock_version + 1
      where o.store_id = v_store_id
        and o.id = p_order_id
      returning o.lock_version into v_lock_version;

      if p_table_id is not null then
        update public.tables t
        set status = 'empty'::public.table_status
        where t.store_id = v_store_id
          and t.id = p_table_id;
      end if;

      return jsonb_build_object(
        'orderId', p_order_id,
        'status', 'void',
        'tableId', p_table_id,
        'tableStatus', case when p_table_id is null then null else 'empty' end,
        'orderNo', v_existing_order.order_no,
        'businessDate', v_existing_order.business_date::text,
        'lockVersion', v_lock_version,
        'ticket', null
      );
    end if;
  else
    v_order_type := p_order_type;

    if p_expected_lock_version is not null then
      raise exception 'ORDER_VERSION_CONFLICT'
        using errcode = 'P0001',
              hint = 'New orders must not pass an expected lock_version.';
    end if;

    if v_active_count = 0 then
      return jsonb_build_object(
        'orderId', null,
        'status', 'void',
        'tableId', p_table_id,
        'tableStatus', null,
        'orderNo', 0,
        'businessDate', null,
        'lockVersion', 0,
        'ticket', null
      );
    end if;

    if p_table_id is not null and exists (
      select 1
      from public.orders o
      where o.store_id = v_store_id
        and o.table_id = p_table_id
        and o.status = 'open'::public.order_status
    ) then
      raise exception 'ORDER_VERSION_CONFLICT'
        using errcode = 'P0001',
              hint = 'Table already has an open order.';
    end if;

    if v_order_type is null then
      raise exception 'INVALID_ORDER_ITEMS'
        using errcode = 'P0001',
              hint = 'New orders must include order_type.';
    end if;

    select coalesce(ss.timezone, 'Asia/Saigon')
    into v_timezone
    from public.store_settings ss
    where ss.store_id = v_store_id;

    v_timezone := coalesce(v_timezone, 'Asia/Saigon');
    v_business_date := (now() at time zone v_timezone)::date;

    perform pg_advisory_xact_lock(hashtext(v_store_id::text || ':' || v_business_date::text));

    select coalesce(max(o.order_no), 0) + 1
    into v_order_no
    from public.orders o
    where o.store_id = v_store_id
      and o.business_date = v_business_date;

    insert into public.orders (
      id,
      store_id,
      table_id,
      order_type,
      order_no,
      business_date,
      status,
      subtotal,
      discount_type,
      discount_value,
      total,
      employee_id,
      lock_version
    ) values (
      p_order_id,
      v_store_id,
      p_table_id,
      v_order_type,
      v_order_no,
      v_business_date,
      'open'::public.order_status,
      0,
      'none'::public.discount_type,
      0,
      0,
      p_employee_id,
      0
    );
  end if;

  for v_item in
    select *
    from jsonb_to_recordset(p_items) as item(
      id uuid,
      "menuItemId" uuid,
      quantity integer,
      note text,
      options jsonb
    )
    where coalesce(item.quantity, 0) > 0
  loop
    if v_item.id is null or v_item."menuItemId" is null then
      raise exception 'INVALID_ORDER_ITEMS'
        using errcode = 'P0001',
              hint = 'Active items must include id and menuItemId.';
    end if;

    select *
    into v_menu_item
    from public.menu_items mi
    where mi.store_id = v_store_id
      and mi.id = v_item."menuItemId"
      and mi.deleted_at is null
      and mi.is_available = true;

    if not found then
      raise exception 'MENU_ITEM_UNAVAILABLE'
        using errcode = 'P0001',
              hint = 'Menu item is missing, deleted, unavailable, or outside the current store.';
    end if;

    v_sort_order := v_sort_order + 1;
    v_option_total := 0;

    insert into public.order_items (
      id,
      store_id,
      order_id,
      menu_item_id,
      item_name,
      quantity,
      unit_price,
      note,
      status,
      sort_order
    ) values (
      v_item.id,
      v_store_id,
      p_order_id,
      v_menu_item.id,
      v_menu_item.name,
      v_item.quantity,
      v_menu_item.price,
      nullif(v_item.note, ''),
      'waiting'::public.order_item_status,
      v_sort_order
    );

    for v_option in
      select *
      from jsonb_to_recordset(
        case
          when jsonb_typeof(v_item.options) = 'array' then v_item.options
          else '[]'::jsonb
        end
      ) as opt(
        id uuid,
        "optionValueId" uuid
      )
    loop
      if v_option.id is null or v_option."optionValueId" is null then
        raise exception 'INVALID_ORDER_ITEMS'
          using errcode = 'P0001',
                hint = 'Options must include id and optionValueId.';
      end if;

      select ov.id, ov.name, ov.price_delta
      into v_option_value
      from public.option_values ov
      join public.option_groups og
        on og.store_id = ov.store_id
       and og.id = ov.option_group_id
      where ov.store_id = v_store_id
        and ov.id = v_option."optionValueId"
        and ov.deleted_at is null
        and og.deleted_at is null
        and og.menu_item_id = v_menu_item.id;

      if not found then
        raise exception 'OPTION_VALUE_UNAVAILABLE'
          using errcode = 'P0001',
                hint = 'Option value is missing, deleted, or not attached to the submitted menu item.';
      end if;

      insert into public.order_item_options (
        id,
        store_id,
        order_item_id,
        option_value_id,
        option_name,
        price_delta
      ) values (
        v_option.id,
        v_store_id,
        v_item.id,
        v_option_value.id,
        v_option_value.name,
        v_option_value.price_delta
      );

      v_option_total := v_option_total + v_option_value.price_delta;
    end loop;

    v_subtotal := v_subtotal + ((v_menu_item.price + v_option_total) * v_item.quantity);
  end loop;

  v_total := v_subtotal;

  update public.orders o
  set subtotal = v_subtotal,
      discount_type = 'none'::public.discount_type,
      discount_value = 0,
      total = v_total,
      employee_id = p_employee_id,
      lock_version = case when v_has_existing_order then o.lock_version + 1 else o.lock_version end
  where o.store_id = v_store_id
    and o.id = p_order_id
  returning o.order_no, o.business_date, o.lock_version
  into v_order_no, v_business_date, v_lock_version;

  if p_table_id is not null then
    update public.tables t
    set status = 'occupied'::public.table_status
    where t.store_id = v_store_id
      and t.id = p_table_id;
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'name', oi.item_name,
        'quantity', oi.quantity,
        'unitPrice', oi.unit_price,
        'options', coalesce(
          (
            select jsonb_agg(oio.option_name order by oio.created_at)
            from public.order_item_options oio
            where oio.store_id = oi.store_id
              and oio.order_item_id = oi.id
          ),
          '[]'::jsonb
        )
      )
      order by oi.sort_order
    ),
    '[]'::jsonb
  )
  into v_lines
  from public.order_items oi
  where oi.store_id = v_store_id
    and oi.order_id = p_order_id
    and oi.status <> 'removed'::public.order_item_status;

  v_ticket := jsonb_build_object(
    'orderNo', v_order_no,
    'tableName', v_table_name,
    'orderType', v_order_type,
    'lines', v_lines,
    'total', v_total
  );

  return jsonb_build_object(
    'orderId', p_order_id,
    'status', 'open',
    'tableId', p_table_id,
    'tableStatus', case when p_table_id is null then null else 'occupied' end,
    'orderNo', v_order_no,
    'businessDate', v_business_date::text,
    'lockVersion', v_lock_version,
    'ticket', v_ticket
  );
end;
$$;

create or replace function public.pay_order(
  p_payment_id uuid,
  p_order_id uuid,
  p_employee_id uuid,
  p_method public.payment_method,
  p_expected_lock_version integer,
  p_received_amount integer
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_store_id uuid := auth.uid();
  v_employee_role public.employee_role;
  v_order public.orders%rowtype;
  v_table_name text;
  v_change_amount integer;
  v_paid_at timestamptz;
  v_lines jsonb := '[]'::jsonb;
  v_receipt jsonb;
begin
  if v_store_id is null then
    raise exception 'AUTH_REQUIRED'
      using errcode = 'P0001',
            hint = 'A store session is required.';
  end if;

  select e.role
  into v_employee_role
  from public.employees e
  where e.store_id = v_store_id
    and e.id = p_employee_id
    and e.is_active = true;

  if not found then
    raise exception 'FORBIDDEN'
      using errcode = 'P0001',
            hint = 'Employee must be active and belong to the current store.';
  end if;

  perform pg_advisory_xact_lock(hashtext(v_store_id::text || ':pos-write'));

  if p_payment_id is null then
    raise exception 'INVALID_PAYMENT_ID'
      using errcode = 'P0001',
            hint = 'Payment must pass a client-generated UUID.';
  end if;

  if p_received_amount < 0 then
    raise exception 'PAYMENT_AMOUNT_TOO_LOW'
      using errcode = 'P0001',
            hint = 'received amount must be non-negative.';
  end if;

  select *
  into v_order
  from public.orders o
  where o.store_id = v_store_id
    and o.id = p_order_id
  for update;

  if not found
    or v_order.status <> 'open'::public.order_status
    or v_order.lock_version <> p_expected_lock_version then
    raise exception 'ORDER_VERSION_CONFLICT'
      using errcode = 'P0001',
            hint = 'Order status or lock_version changed before payment.';
  end if;

  if p_received_amount < v_order.total then
    raise exception 'PAYMENT_AMOUNT_TOO_LOW'
      using errcode = 'P0001',
            hint = 'received amount must be greater than or equal to order total.';
  end if;

  if v_order.table_id is not null then
    select t.name
    into v_table_name
    from public.tables t
    where t.store_id = v_store_id
      and t.id = v_order.table_id
    for update;
  end if;

  v_change_amount := p_received_amount - v_order.total;
  v_paid_at := now();

  insert into public.payments (
    id,
    store_id,
    order_id,
    employee_id,
    method,
    amount,
    received_amount,
    change_amount,
    paid_at
  ) values (
    p_payment_id,
    v_store_id,
    p_order_id,
    p_employee_id,
    p_method,
    v_order.total,
    p_received_amount,
    v_change_amount,
    v_paid_at
  );

  update public.orders o
  set status = 'paid'::public.order_status,
      paid_at = v_paid_at,
      lock_version = o.lock_version + 1
  where o.store_id = v_store_id
    and o.id = p_order_id
  returning * into v_order;

  if v_order.table_id is not null then
    update public.tables t
    set status = 'empty'::public.table_status
    where t.store_id = v_store_id
      and t.id = v_order.table_id;
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'name', oi.item_name,
        'quantity', oi.quantity,
        'unitPrice', oi.unit_price,
        'options', coalesce(
          (
            select jsonb_agg(oio.option_name order by oio.created_at)
            from public.order_item_options oio
            where oio.store_id = oi.store_id
              and oio.order_item_id = oi.id
          ),
          '[]'::jsonb
        )
      )
      order by oi.sort_order
    ),
    '[]'::jsonb
  )
  into v_lines
  from public.order_items oi
  where oi.store_id = v_store_id
    and oi.order_id = p_order_id
    and oi.status <> 'removed'::public.order_item_status;

  v_receipt := jsonb_build_object(
    'orderNo', v_order.order_no,
    'tableName', v_table_name,
    'orderType', v_order.order_type,
    'lines', v_lines,
    'total', v_order.total,
    'receivedAmount', p_received_amount,
    'changeAmount', v_change_amount,
    'paidAt', v_paid_at::text
  );

  return jsonb_build_object(
    'orderId', p_order_id,
    'paymentId', p_payment_id,
    'status', 'paid',
    'total', v_order.total,
    'receivedAmount', p_received_amount,
    'changeAmount', v_change_amount,
    'lockVersion', v_order.lock_version,
    'receipt', v_receipt
  );
end;
$$;

create or replace function public.clear_demo_data(
  p_employee_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_store_id uuid := auth.uid();
  v_role public.employee_role;
  v_categories integer := 0;
  v_menu_items integer := 0;
  v_option_groups integer := 0;
  v_option_values integer := 0;
  v_floor_areas integer := 0;
  v_tables integer := 0;
  v_decor_items integer := 0;
  v_deactivated_employees integer := 0;
begin
  if v_store_id is null then
    raise exception 'AUTH_REQUIRED'
      using errcode = 'P0001',
            hint = 'A store session is required.';
  end if;

  select e.role
  into v_role
  from public.employees e
  where e.store_id = v_store_id
    and e.id = p_employee_id
    and e.is_active = true;

  if v_role is distinct from 'admin'::public.employee_role then
    raise exception 'FORBIDDEN'
      using errcode = 'P0001',
            hint = 'Only admin can clear demo data.';
  end if;

  perform pg_advisory_xact_lock(hashtext(v_store_id::text || ':pos-write'));

  if exists (
    select 1
    from public.orders o
    where o.store_id = v_store_id
      and o.status = 'open'
  ) then
    raise exception 'OPEN_ORDERS_BLOCK_CLEAR_DEMO'
      using errcode = 'P0001',
            hint = 'Close or void all open orders before clearing demo data.';
  end if;

  update public.option_values ov
  set deleted_at = coalesce(ov.deleted_at, now()),
      deleted_by_employee_id = coalesce(ov.deleted_by_employee_id, p_employee_id)
  where ov.store_id = v_store_id
    and ov.seed_key is not null
    and ov.deleted_at is null;
  get diagnostics v_option_values = row_count;

  update public.option_groups og
  set deleted_at = coalesce(og.deleted_at, now()),
      deleted_by_employee_id = coalesce(og.deleted_by_employee_id, p_employee_id)
  where og.store_id = v_store_id
    and og.seed_key is not null
    and og.deleted_at is null;
  get diagnostics v_option_groups = row_count;

  update public.menu_items mi
  set deleted_at = coalesce(mi.deleted_at, now()),
      deleted_by_employee_id = coalesce(mi.deleted_by_employee_id, p_employee_id)
  where mi.store_id = v_store_id
    and mi.seed_key is not null
    and mi.deleted_at is null;
  get diagnostics v_menu_items = row_count;

  update public.categories c
  set deleted_at = coalesce(c.deleted_at, now()),
      deleted_by_employee_id = coalesce(c.deleted_by_employee_id, p_employee_id)
  where c.store_id = v_store_id
    and c.seed_key is not null
    and c.deleted_at is null;
  get diagnostics v_categories = row_count;

  update public.floor_decor_items fdi
  set deleted_at = coalesce(fdi.deleted_at, now()),
      deleted_by_employee_id = coalesce(fdi.deleted_by_employee_id, p_employee_id)
  where fdi.store_id = v_store_id
    and fdi.seed_key is not null
    and fdi.deleted_at is null;
  get diagnostics v_decor_items = row_count;

  update public.tables t
  set deleted_at = coalesce(t.deleted_at, now()),
      deleted_by_employee_id = coalesce(t.deleted_by_employee_id, p_employee_id),
      status = 'empty'::public.table_status
  where t.store_id = v_store_id
    and t.seed_key is not null
    and t.deleted_at is null;
  get diagnostics v_tables = row_count;

  update public.floor_areas fa
  set deleted_at = coalesce(fa.deleted_at, now()),
      deleted_by_employee_id = coalesce(fa.deleted_by_employee_id, p_employee_id)
  where fa.store_id = v_store_id
    and fa.seed_key is not null
    and fa.deleted_at is null;
  get diagnostics v_floor_areas = row_count;

  update public.employees e
  set is_active = false
  where e.store_id = v_store_id
    and e.seed_key is not null
    and e.role <> 'admin'::public.employee_role
    and e.is_active = true;
  get diagnostics v_deactivated_employees = row_count;

  return jsonb_build_object(
    'cleared', true,
    'categories', v_categories,
    'menuItems', v_menu_items,
    'optionGroups', v_option_groups,
    'optionValues', v_option_values,
    'floorAreas', v_floor_areas,
    'tables', v_tables,
    'decorItems', v_decor_items,
    'deactivatedEmployees', v_deactivated_employees
  );
end;
$$;

create or replace function public.void_order(
  p_order_id uuid,
  p_employee_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception 'VOID_ORDER_RESERVED'
    using errcode = 'P0001',
          hint = 'MVP cancellation of open orders goes through submit_order_changes with all quantities set to zero.';
end;
$$;
$permission_fragment_2$;
-- 4: supabase/migrations/004_realtime_publication.sql
 if clock_timestamp()>=least(started_at+interval '50 seconds','2026-10-22T10:00:00.000Z'::timestamptz) then raise exception 'STAGING_EXECUTION_WINDOW_CLOSED'; end if;
 execute $permission_fragment_3$do $$
declare
  realtime_table text;
  realtime_tables text[] := array[
    'orders',
    'payments',
    'tables',
    'categories',
    'menu_items',
    'option_groups',
    'option_values',
    'floor_areas',
    'floor_decor_items'
  ];
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) then
    foreach realtime_table in array realtime_tables loop
      if not exists (
        select 1
        from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = realtime_table
      ) then
        execute format('alter publication supabase_realtime add table public.%I', realtime_table);
      end if;
    end loop;
  end if;
end;
$$;
$permission_fragment_3$;
-- 5: supabase/migrations/005_menu_item_images_storage.sql
 if clock_timestamp()>=least(started_at+interval '50 seconds','2026-10-22T10:00:00.000Z'::timestamptz) then raise exception 'STAGING_EXECUTION_WINDOW_CLOSED'; end if;
 execute $permission_fragment_4$insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'menu-item-images',
  'menu-item-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists menu_item_images_public_read on storage.objects;
create policy menu_item_images_public_read
on storage.objects
for select
to public
using (bucket_id = 'menu-item-images');

drop policy if exists menu_item_images_store_insert on storage.objects;
create policy menu_item_images_store_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'menu-item-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists menu_item_images_store_update on storage.objects;
create policy menu_item_images_store_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'menu-item-images'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'menu-item-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists menu_item_images_store_delete on storage.objects;
create policy menu_item_images_store_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'menu-item-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);
$permission_fragment_4$;
-- 6: supabase/migrations/006_menu_item_image_asset_key.sql
 if clock_timestamp()>=least(started_at+interval '50 seconds','2026-10-22T10:00:00.000Z'::timestamptz) then raise exception 'STAGING_EXECUTION_WINDOW_CLOSED'; end if;
 execute $permission_fragment_5$alter table public.menu_items
add column if not exists image_asset_key text;
$permission_fragment_5$;
-- 7: supabase/migrations/007_wipe_all_data.sql
 if clock_timestamp()>=least(started_at+interval '50 seconds','2026-10-22T10:00:00.000Z'::timestamptz) then raise exception 'STAGING_EXECUTION_WINDOW_CLOSED'; end if;
 execute $permission_fragment_6$-- 007_wipe_all_data.sql
-- Xoá sạch TOÀN BỘ dữ liệu hiện có (kể cả store cũ) trước khi đổi mô hình modifier.
-- Lý do: tính năng modifier được làm dở dang theo mô hình cũ (option_groups gắn cứng
-- 1 món). Chuyển sang modifier dùng chung nên không migrate dữ liệu cũ — xoá hết để
-- tránh "mirage" dữ liệu. Dev/test chạy mock nên không ảnh hưởng.
--
-- CẢNH BÁO: KHÔNG HỒI PHỤC ĐƯỢC. Chỉ chạy trên project demo.
-- Sau bước này DB về trạng thái chưa có store nào → pair store + seed lại từ UI.

truncate table public.stores cascade;
$permission_fragment_6$;
-- 8: supabase/migrations/008_modifier_rework.sql
 if clock_timestamp()>=least(started_at+interval '50 seconds','2026-10-22T10:00:00.000Z'::timestamptz) then raise exception 'STAGING_EXECUTION_WINDOW_CLOSED'; end if;
 execute $permission_fragment_7$-- 008_modifier_rework.sql
-- Chuyển modifier (tuỳ chọn món) sang mô hình DÙNG CHUNG:
--   * option_groups không còn gắn cứng vào 1 món (bỏ menu_item_id, min/max_select).
--   * bảng nối menu_item_option_groups (nhiều-nhiều) cho biết món nào dùng nhóm nào.
--   * order_item_options thêm cột quantity (số lượng modifier, mặc định 1).
-- Chạy SAU 007_wipe_all_data.sql.

-- ----- 1. Bảng nối món <-> nhóm tuỳ chọn dùng chung -----
create table if not exists public.menu_item_option_groups (
  id uuid primary key,
  store_id uuid not null references public.stores (id) on delete cascade,
  menu_item_id uuid not null,
  option_group_id uuid not null,
  sort_order integer not null default 0,
  seed_key text,
  deleted_at timestamptz,
  deleted_by_employee_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, id),
  foreign key (store_id, menu_item_id) references public.menu_items (store_id, id),
  foreign key (store_id, option_group_id) references public.option_groups (store_id, id),
  foreign key (store_id, deleted_by_employee_id) references public.employees (store_id, id)
);

-- ----- 2. option_groups: bỏ ràng buộc gắn 1 món + min/max -----
drop index if exists public.option_groups_store_item_active_idx;
alter table public.option_groups drop constraint if exists option_group_select_bounds;
alter table public.option_groups drop column if exists menu_item_id;
alter table public.option_groups drop column if exists min_select;
alter table public.option_groups drop column if exists max_select;
create index if not exists option_groups_store_active_idx
  on public.option_groups (store_id, sort_order) where deleted_at is null;

-- ----- 3. order_item_options: số lượng modifier -----
alter table public.order_item_options
  add column if not exists quantity integer not null default 1 check (quantity > 0);

-- ----- 4. Index / trigger / RLS cho bảng nối -----
create index if not exists menu_item_option_groups_store_item_active_idx
  on public.menu_item_option_groups (store_id, menu_item_id, sort_order) where deleted_at is null;
create index if not exists menu_item_option_groups_store_group_active_idx
  on public.menu_item_option_groups (store_id, option_group_id) where deleted_at is null;
create unique index if not exists menu_item_option_groups_store_seed_key_idx
  on public.menu_item_option_groups (store_id, seed_key) where seed_key is not null;

create trigger menu_item_option_groups_set_updated_at before update on public.menu_item_option_groups
for each row execute function public.set_updated_at();

alter table public.menu_item_option_groups enable row level security;
create policy menu_item_option_groups_store_is_auth_user on public.menu_item_option_groups
for all using (store_id = auth.uid()) with check (store_id = auth.uid());

-- ----- 5. Realtime publication -----
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'menu_item_option_groups'
    ) then
      execute 'alter publication supabase_realtime add table public.menu_item_option_groups';
    end if;
  end if;
end;
$$;

-- ----- 6. submit_order_changes: validate qua bảng nối + lưu/nhân quantity -----
create or replace function public.submit_order_changes(
  p_order_id uuid,
  p_table_id uuid,
  p_order_type public.order_type,
  p_employee_id uuid,
  p_expected_lock_version integer,
  p_items jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_store_id uuid := auth.uid();
  v_employee_role public.employee_role;
  v_existing_order public.orders%rowtype;
  v_has_existing_order boolean := false;
  v_table public.tables%rowtype;
  v_table_name text;
  v_timezone text;
  v_business_date date;
  v_order_no integer;
  v_order_type public.order_type;
  v_lock_version integer := 0;
  v_active_count integer := 0;
  v_subtotal integer := 0;
  v_total integer := 0;
  v_sort_order integer := 0;
  v_item record;
  v_option record;
  v_menu_item public.menu_items%rowtype;
  v_option_value record;
  v_option_total integer;
  v_option_qty integer;
  v_lines jsonb := '[]'::jsonb;
  v_ticket jsonb;
begin
  if v_store_id is null then
    raise exception 'AUTH_REQUIRED'
      using errcode = 'P0001',
            hint = 'A store session is required.';
  end if;

  select e.role
  into v_employee_role
  from public.employees e
  where e.store_id = v_store_id
    and e.id = p_employee_id
    and e.is_active = true;

  if not found then
    raise exception 'FORBIDDEN'
      using errcode = 'P0001',
            hint = 'Employee must be active and belong to the current store.';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'INVALID_ORDER_ITEMS'
      using errcode = 'P0001',
            hint = 'p_items must be a jsonb array.';
  end if;

  perform pg_advisory_xact_lock(hashtext(v_store_id::text || ':pos-write'));

  if p_order_type = 'takeaway'::public.order_type then
    p_table_id := null;
  end if;

  select count(*)
  into v_active_count
  from jsonb_to_recordset(p_items) as item(
    id uuid,
    "menuItemId" uuid,
    quantity integer,
    note text,
    options jsonb
  )
  where coalesce(item.quantity, 0) > 0;

  if exists (
    select 1
    from jsonb_to_recordset(p_items) as item(
      id uuid,
      "menuItemId" uuid,
      quantity integer,
      note text,
      options jsonb
    )
    where coalesce(item.quantity, 0) < 0
  ) then
    raise exception 'INVALID_ORDER_ITEMS'
      using errcode = 'P0001',
            hint = 'Item quantity must be non-negative.';
  end if;

  if p_order_id is null then
    if v_active_count = 0 then
      return jsonb_build_object(
        'orderId', null,
        'status', 'void',
        'tableId', p_table_id,
        'tableStatus', null,
        'orderNo', 0,
        'businessDate', null,
        'lockVersion', 0,
        'ticket', null
      );
    end if;

    raise exception 'INVALID_ORDER_ID'
      using errcode = 'P0001',
            hint = 'New orders must pass a client-generated p_order_id UUID.';
  end if;

  if p_table_id is not null then
    select *
    into v_table
    from public.tables t
    where t.store_id = v_store_id
      and t.id = p_table_id
      and t.deleted_at is null
    for update;

    if not found then
      raise exception 'TABLE_NOT_FOUND'
        using errcode = 'P0001',
              hint = 'Table must exist, be active, and belong to the current store.';
    end if;

    v_table_name := v_table.name;
  end if;

  select *
  into v_existing_order
  from public.orders o
  where o.store_id = v_store_id
    and o.id = p_order_id
  for update;

  v_has_existing_order := found;

  if v_has_existing_order then
    v_order_type := v_existing_order.order_type;

    if v_existing_order.status <> 'open'::public.order_status
      or v_existing_order.lock_version <> p_expected_lock_version then
      raise exception 'ORDER_VERSION_CONFLICT'
        using errcode = 'P0001',
              hint = 'Order status or lock_version changed before submit.';
    end if;

    if v_existing_order.table_id is not null and p_table_id is distinct from v_existing_order.table_id then
      p_table_id := v_existing_order.table_id;
      select *
      into v_table
      from public.tables t
      where t.store_id = v_store_id
        and t.id = p_table_id
      for update;
      v_table_name := v_table.name;
    end if;

    if exists (
      select 1
      from jsonb_to_recordset(p_items) as item(
        id uuid,
        "menuItemId" uuid,
        quantity integer,
        note text,
        options jsonb
      )
      join public.order_items oi
        on oi.store_id = v_store_id
       and oi.order_id = p_order_id
       and oi.id = item.id
      where coalesce(item.quantity, 0) > 0
    ) then
      raise exception 'INVALID_ORDER_ITEMS'
        using errcode = 'P0001',
              hint = 'Replace-submit must use fresh client UUIDs for active order_items.';
    end if;

    update public.order_items oi
    set status = 'removed'::public.order_item_status
    where oi.store_id = v_store_id
      and oi.order_id = p_order_id
      and oi.status <> 'removed'::public.order_item_status;

    if v_active_count = 0 then
      update public.orders o
      set status = 'void'::public.order_status,
          subtotal = 0,
          discount_type = 'none'::public.discount_type,
          discount_value = 0,
          total = 0,
          lock_version = o.lock_version + 1
      where o.store_id = v_store_id
        and o.id = p_order_id
      returning o.lock_version into v_lock_version;

      if p_table_id is not null then
        update public.tables t
        set status = 'empty'::public.table_status
        where t.store_id = v_store_id
          and t.id = p_table_id;
      end if;

      return jsonb_build_object(
        'orderId', p_order_id,
        'status', 'void',
        'tableId', p_table_id,
        'tableStatus', case when p_table_id is null then null else 'empty' end,
        'orderNo', v_existing_order.order_no,
        'businessDate', v_existing_order.business_date::text,
        'lockVersion', v_lock_version,
        'ticket', null
      );
    end if;
  else
    v_order_type := p_order_type;

    if p_expected_lock_version is not null then
      raise exception 'ORDER_VERSION_CONFLICT'
        using errcode = 'P0001',
              hint = 'New orders must not pass an expected lock_version.';
    end if;

    if v_active_count = 0 then
      return jsonb_build_object(
        'orderId', null,
        'status', 'void',
        'tableId', p_table_id,
        'tableStatus', null,
        'orderNo', 0,
        'businessDate', null,
        'lockVersion', 0,
        'ticket', null
      );
    end if;

    if p_table_id is not null and exists (
      select 1
      from public.orders o
      where o.store_id = v_store_id
        and o.table_id = p_table_id
        and o.status = 'open'::public.order_status
    ) then
      raise exception 'ORDER_VERSION_CONFLICT'
        using errcode = 'P0001',
              hint = 'Table already has an open order.';
    end if;

    if v_order_type is null then
      raise exception 'INVALID_ORDER_ITEMS'
        using errcode = 'P0001',
              hint = 'New orders must include order_type.';
    end if;

    select coalesce(ss.timezone, 'Asia/Saigon')
    into v_timezone
    from public.store_settings ss
    where ss.store_id = v_store_id;

    v_timezone := coalesce(v_timezone, 'Asia/Saigon');
    v_business_date := (now() at time zone v_timezone)::date;

    perform pg_advisory_xact_lock(hashtext(v_store_id::text || ':' || v_business_date::text));

    select coalesce(max(o.order_no), 0) + 1
    into v_order_no
    from public.orders o
    where o.store_id = v_store_id
      and o.business_date = v_business_date;

    insert into public.orders (
      id,
      store_id,
      table_id,
      order_type,
      order_no,
      business_date,
      status,
      subtotal,
      discount_type,
      discount_value,
      total,
      employee_id,
      lock_version
    ) values (
      p_order_id,
      v_store_id,
      p_table_id,
      v_order_type,
      v_order_no,
      v_business_date,
      'open'::public.order_status,
      0,
      'none'::public.discount_type,
      0,
      0,
      p_employee_id,
      0
    );
  end if;

  for v_item in
    select *
    from jsonb_to_recordset(p_items) as item(
      id uuid,
      "menuItemId" uuid,
      quantity integer,
      note text,
      options jsonb
    )
    where coalesce(item.quantity, 0) > 0
  loop
    if v_item.id is null or v_item."menuItemId" is null then
      raise exception 'INVALID_ORDER_ITEMS'
        using errcode = 'P0001',
              hint = 'Active items must include id and menuItemId.';
    end if;

    select *
    into v_menu_item
    from public.menu_items mi
    where mi.store_id = v_store_id
      and mi.id = v_item."menuItemId"
      and mi.deleted_at is null
      and mi.is_available = true;

    if not found then
      raise exception 'MENU_ITEM_UNAVAILABLE'
        using errcode = 'P0001',
              hint = 'Menu item is missing, deleted, unavailable, or outside the current store.';
    end if;

    v_sort_order := v_sort_order + 1;
    v_option_total := 0;

    insert into public.order_items (
      id,
      store_id,
      order_id,
      menu_item_id,
      item_name,
      quantity,
      unit_price,
      note,
      status,
      sort_order
    ) values (
      v_item.id,
      v_store_id,
      p_order_id,
      v_menu_item.id,
      v_menu_item.name,
      v_item.quantity,
      v_menu_item.price,
      nullif(v_item.note, ''),
      'waiting'::public.order_item_status,
      v_sort_order
    );

    for v_option in
      select *
      from jsonb_to_recordset(
        case
          when jsonb_typeof(v_item.options) = 'array' then v_item.options
          else '[]'::jsonb
        end
      ) as opt(
        id uuid,
        "optionValueId" uuid,
        quantity integer
      )
    loop
      if v_option.id is null or v_option."optionValueId" is null then
        raise exception 'INVALID_ORDER_ITEMS'
          using errcode = 'P0001',
                hint = 'Options must include id and optionValueId.';
      end if;

      -- Tuỳ chọn hợp lệ khi nhóm của nó được liên kết với đúng món qua menu_item_option_groups.
      select ov.id, ov.name, ov.price_delta
      into v_option_value
      from public.option_values ov
      join public.option_groups og
        on og.store_id = ov.store_id
       and og.id = ov.option_group_id
      join public.menu_item_option_groups miog
        on miog.store_id = og.store_id
       and miog.option_group_id = og.id
      where ov.store_id = v_store_id
        and ov.id = v_option."optionValueId"
        and ov.deleted_at is null
        and og.deleted_at is null
        and miog.deleted_at is null
        and miog.menu_item_id = v_menu_item.id;

      if not found then
        raise exception 'OPTION_VALUE_UNAVAILABLE'
          using errcode = 'P0001',
                hint = 'Option value is missing, deleted, or not attached to the submitted menu item.';
      end if;

      v_option_qty := greatest(coalesce(v_option.quantity, 1), 1);

      insert into public.order_item_options (
        id,
        store_id,
        order_item_id,
        option_value_id,
        option_name,
        price_delta,
        quantity
      ) values (
        v_option.id,
        v_store_id,
        v_item.id,
        v_option_value.id,
        v_option_value.name,
        v_option_value.price_delta,
        v_option_qty
      );

      v_option_total := v_option_total + (v_option_value.price_delta * v_option_qty);
    end loop;

    v_subtotal := v_subtotal + ((v_menu_item.price + v_option_total) * v_item.quantity);
  end loop;

  v_total := v_subtotal;

  update public.orders o
  set subtotal = v_subtotal,
      discount_type = 'none'::public.discount_type,
      discount_value = 0,
      total = v_total,
      employee_id = p_employee_id,
      lock_version = case when v_has_existing_order then o.lock_version + 1 else o.lock_version end
  where o.store_id = v_store_id
    and o.id = p_order_id
  returning o.order_no, o.business_date, o.lock_version
  into v_order_no, v_business_date, v_lock_version;

  if p_table_id is not null then
    update public.tables t
    set status = 'occupied'::public.table_status
    where t.store_id = v_store_id
      and t.id = p_table_id;
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'name', oi.item_name,
        'quantity', oi.quantity,
        'unitPrice', oi.unit_price,
        'options', coalesce(
          (
            select jsonb_agg(
              case when oio.quantity > 1 then oio.option_name || ' ×' || oio.quantity else oio.option_name end
              order by oio.created_at
            )
            from public.order_item_options oio
            where oio.store_id = oi.store_id
              and oio.order_item_id = oi.id
          ),
          '[]'::jsonb
        )
      )
      order by oi.sort_order
    ),
    '[]'::jsonb
  )
  into v_lines
  from public.order_items oi
  where oi.store_id = v_store_id
    and oi.order_id = p_order_id
    and oi.status <> 'removed'::public.order_item_status;

  v_ticket := jsonb_build_object(
    'orderNo', v_order_no,
    'tableName', v_table_name,
    'orderType', v_order_type,
    'lines', v_lines,
    'total', v_total
  );

  return jsonb_build_object(
    'orderId', p_order_id,
    'status', 'open',
    'tableId', p_table_id,
    'tableStatus', case when p_table_id is null then null else 'occupied' end,
    'orderNo', v_order_no,
    'businessDate', v_business_date::text,
    'lockVersion', v_lock_version,
    'ticket', v_ticket
  );
end;
$$;

-- ----- 7. clear_demo_data: tombstone thêm bảng nối -----
create or replace function public.clear_demo_data(
  p_employee_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_store_id uuid := auth.uid();
  v_role public.employee_role;
  v_categories integer := 0;
  v_menu_items integer := 0;
  v_option_groups integer := 0;
  v_option_values integer := 0;
  v_menu_item_option_groups integer := 0;
  v_floor_areas integer := 0;
  v_tables integer := 0;
  v_decor_items integer := 0;
  v_deactivated_employees integer := 0;
begin
  if v_store_id is null then
    raise exception 'AUTH_REQUIRED'
      using errcode = 'P0001',
            hint = 'A store session is required.';
  end if;

  select e.role
  into v_role
  from public.employees e
  where e.store_id = v_store_id
    and e.id = p_employee_id
    and e.is_active = true;

  if v_role is distinct from 'admin'::public.employee_role then
    raise exception 'FORBIDDEN'
      using errcode = 'P0001',
            hint = 'Only admin can clear demo data.';
  end if;

  perform pg_advisory_xact_lock(hashtext(v_store_id::text || ':pos-write'));

  if exists (
    select 1
    from public.orders o
    where o.store_id = v_store_id
      and o.status = 'open'
  ) then
    raise exception 'OPEN_ORDERS_BLOCK_CLEAR_DEMO'
      using errcode = 'P0001',
            hint = 'Close or void all open orders before clearing demo data.';
  end if;

  update public.menu_item_option_groups miog
  set deleted_at = coalesce(miog.deleted_at, now()),
      deleted_by_employee_id = coalesce(miog.deleted_by_employee_id, p_employee_id)
  where miog.store_id = v_store_id
    and miog.seed_key is not null
    and miog.deleted_at is null;
  get diagnostics v_menu_item_option_groups = row_count;

  update public.option_values ov
  set deleted_at = coalesce(ov.deleted_at, now()),
      deleted_by_employee_id = coalesce(ov.deleted_by_employee_id, p_employee_id)
  where ov.store_id = v_store_id
    and ov.seed_key is not null
    and ov.deleted_at is null;
  get diagnostics v_option_values = row_count;

  update public.option_groups og
  set deleted_at = coalesce(og.deleted_at, now()),
      deleted_by_employee_id = coalesce(og.deleted_by_employee_id, p_employee_id)
  where og.store_id = v_store_id
    and og.seed_key is not null
    and og.deleted_at is null;
  get diagnostics v_option_groups = row_count;

  update public.menu_items mi
  set deleted_at = coalesce(mi.deleted_at, now()),
      deleted_by_employee_id = coalesce(mi.deleted_by_employee_id, p_employee_id)
  where mi.store_id = v_store_id
    and mi.seed_key is not null
    and mi.deleted_at is null;
  get diagnostics v_menu_items = row_count;

  update public.categories c
  set deleted_at = coalesce(c.deleted_at, now()),
      deleted_by_employee_id = coalesce(c.deleted_by_employee_id, p_employee_id)
  where c.store_id = v_store_id
    and c.seed_key is not null
    and c.deleted_at is null;
  get diagnostics v_categories = row_count;

  update public.floor_decor_items fdi
  set deleted_at = coalesce(fdi.deleted_at, now()),
      deleted_by_employee_id = coalesce(fdi.deleted_by_employee_id, p_employee_id)
  where fdi.store_id = v_store_id
    and fdi.seed_key is not null
    and fdi.deleted_at is null;
  get diagnostics v_decor_items = row_count;

  update public.tables t
  set deleted_at = coalesce(t.deleted_at, now()),
      deleted_by_employee_id = coalesce(t.deleted_by_employee_id, p_employee_id),
      status = 'empty'::public.table_status
  where t.store_id = v_store_id
    and t.seed_key is not null
    and t.deleted_at is null;
  get diagnostics v_tables = row_count;

  update public.floor_areas fa
  set deleted_at = coalesce(fa.deleted_at, now()),
      deleted_by_employee_id = coalesce(fa.deleted_by_employee_id, p_employee_id)
  where fa.store_id = v_store_id
    and fa.seed_key is not null
    and fa.deleted_at is null;
  get diagnostics v_floor_areas = row_count;

  update public.employees e
  set is_active = false
  where e.store_id = v_store_id
    and e.seed_key is not null
    and e.role <> 'admin'::public.employee_role
    and e.is_active = true;
  get diagnostics v_deactivated_employees = row_count;

  return jsonb_build_object(
    'cleared', true,
    'categories', v_categories,
    'menuItems', v_menu_items,
    'optionGroups', v_option_groups,
    'optionValues', v_option_values,
    'menuItemOptionGroups', v_menu_item_option_groups,
    'floorAreas', v_floor_areas,
    'tables', v_tables,
    'decorItems', v_decor_items,
    'deactivatedEmployees', v_deactivated_employees
  );
end;
$$;

-- ----- 8. pay_order: biên lai hiện số lượng modifier (×N) -----
create or replace function public.pay_order(
  p_payment_id uuid,
  p_order_id uuid,
  p_employee_id uuid,
  p_method public.payment_method,
  p_expected_lock_version integer,
  p_received_amount integer
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_store_id uuid := auth.uid();
  v_employee_role public.employee_role;
  v_order public.orders%rowtype;
  v_table_name text;
  v_change_amount integer;
  v_paid_at timestamptz;
  v_lines jsonb := '[]'::jsonb;
  v_receipt jsonb;
begin
  if v_store_id is null then
    raise exception 'AUTH_REQUIRED'
      using errcode = 'P0001',
            hint = 'A store session is required.';
  end if;

  select e.role
  into v_employee_role
  from public.employees e
  where e.store_id = v_store_id
    and e.id = p_employee_id
    and e.is_active = true;

  if not found then
    raise exception 'FORBIDDEN'
      using errcode = 'P0001',
            hint = 'Employee must be active and belong to the current store.';
  end if;

  perform pg_advisory_xact_lock(hashtext(v_store_id::text || ':pos-write'));

  if p_payment_id is null then
    raise exception 'INVALID_PAYMENT_ID'
      using errcode = 'P0001',
            hint = 'Payment must pass a client-generated UUID.';
  end if;

  if p_received_amount < 0 then
    raise exception 'PAYMENT_AMOUNT_TOO_LOW'
      using errcode = 'P0001',
            hint = 'received amount must be non-negative.';
  end if;

  select *
  into v_order
  from public.orders o
  where o.store_id = v_store_id
    and o.id = p_order_id
  for update;

  if not found
    or v_order.status <> 'open'::public.order_status
    or v_order.lock_version <> p_expected_lock_version then
    raise exception 'ORDER_VERSION_CONFLICT'
      using errcode = 'P0001',
            hint = 'Order status or lock_version changed before payment.';
  end if;

  if p_received_amount < v_order.total then
    raise exception 'PAYMENT_AMOUNT_TOO_LOW'
      using errcode = 'P0001',
            hint = 'received amount must be greater than or equal to order total.';
  end if;

  if v_order.table_id is not null then
    select t.name
    into v_table_name
    from public.tables t
    where t.store_id = v_store_id
      and t.id = v_order.table_id
    for update;
  end if;

  v_change_amount := p_received_amount - v_order.total;
  v_paid_at := now();

  insert into public.payments (
    id,
    store_id,
    order_id,
    employee_id,
    method,
    amount,
    received_amount,
    change_amount,
    paid_at
  ) values (
    p_payment_id,
    v_store_id,
    p_order_id,
    p_employee_id,
    p_method,
    v_order.total,
    p_received_amount,
    v_change_amount,
    v_paid_at
  );

  update public.orders o
  set status = 'paid'::public.order_status,
      paid_at = v_paid_at,
      lock_version = o.lock_version + 1
  where o.store_id = v_store_id
    and o.id = p_order_id
  returning * into v_order;

  if v_order.table_id is not null then
    update public.tables t
    set status = 'empty'::public.table_status
    where t.store_id = v_store_id
      and t.id = v_order.table_id;
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'name', oi.item_name,
        'quantity', oi.quantity,
        'unitPrice', oi.unit_price,
        'options', coalesce(
          (
            select jsonb_agg(
              case when oio.quantity > 1 then oio.option_name || ' ×' || oio.quantity else oio.option_name end
              order by oio.created_at
            )
            from public.order_item_options oio
            where oio.store_id = oi.store_id
              and oio.order_item_id = oi.id
          ),
          '[]'::jsonb
        )
      )
      order by oi.sort_order
    ),
    '[]'::jsonb
  )
  into v_lines
  from public.order_items oi
  where oi.store_id = v_store_id
    and oi.order_id = p_order_id
    and oi.status <> 'removed'::public.order_item_status;

  v_receipt := jsonb_build_object(
    'orderNo', v_order.order_no,
    'tableName', v_table_name,
    'orderType', v_order.order_type,
    'lines', v_lines,
    'total', v_order.total,
    'receivedAmount', p_received_amount,
    'changeAmount', v_change_amount,
    'paidAt', v_paid_at::text
  );

  return jsonb_build_object(
    'orderId', p_order_id,
    'paymentId', p_payment_id,
    'status', 'paid',
    'total', v_order.total,
    'receivedAmount', p_received_amount,
    'changeAmount', v_change_amount,
    'lockVersion', v_order.lock_version,
    'receipt', v_receipt
  );
end;
$$;
$permission_fragment_7$;
-- 9: supabase/migrations/009_partial_payment.sql
 if clock_timestamp()>=least(started_at+interval '50 seconds','2026-10-22T10:00:00.000Z'::timestamptz) then raise exception 'STAGING_EXECUTION_WINDOW_CLOSED'; end if;
 execute $permission_fragment_8$-- 009_partial_payment.sql
-- Instant pay: thanh toán theo từng món trong một đơn (nhiều payment/đơn).
--   * orders.paid_amount: tiền đã thu cộng dồn; còn phải thu = total - paid_amount.
--   * order_items.payment_id: dòng món đã được trả bởi payment nào (null = chưa trả).
--     Trả một phần số lượng -> TÁCH DÒNG: dòng mới (UUID client cấp) mang phần đã trả.
--   * RPC pay_order_items: thanh toán một phần; đơn vẫn 'open' tới khi hết món chưa trả.
--   * submit_order_changes: dòng đã trả bị ĐÓNG BĂNG (không replace); chặn huỷ đơn đã thu tiền.
--   * pay_order: thu PHẦN CÒN LẠI (total - paid_amount); bill chỉ in các món của lần trả này.
--   * View history_entries: lịch sử theo LẦN THANH TOÁN (mỗi payment một dòng) + đơn huỷ.
-- Chạy SAU 008_modifier_rework.sql.

-- ----- 1. Cột mới -----
alter table public.orders
  add column if not exists paid_amount integer not null default 0
  check (paid_amount >= 0);

alter table public.order_items
  add column if not exists payment_id uuid;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'order_items_payment_fk'
  ) then
    alter table public.order_items
      add constraint order_items_payment_fk
      foreign key (store_id, payment_id) references public.payments (store_id, id);
  end if;
end;
$$;

create index if not exists order_items_store_payment_idx
  on public.order_items (store_id, payment_id) where payment_id is not null;
create index if not exists payments_store_order_idx
  on public.payments (store_id, order_id, paid_at);

-- ----- 2. View lịch sử theo lần thanh toán -----
-- security_invoker: RLS của payments/orders áp theo phiên gọi (lọc theo store).
create or replace view public.history_entries
with (security_invoker = on)
as
select
  p.id,
  'payment'::text as kind,
  p.store_id,
  o.id as order_id,
  o.order_no,
  (row_number() over (partition by p.store_id, p.order_id order by p.paid_at, p.created_at))::integer as payment_seq,
  (count(*) over (partition by p.store_id, p.order_id))::integer as payment_count,
  o.table_id,
  o.order_type,
  o.business_date,
  p.paid_at as occurred_at,
  p.employee_id,
  p.amount
from public.payments p
join public.orders o
  on o.store_id = p.store_id
 and o.id = p.order_id
union all
select
  o.id,
  'void'::text as kind,
  o.store_id,
  o.id as order_id,
  o.order_no,
  0 as payment_seq,
  0 as payment_count,
  o.table_id,
  o.order_type,
  o.business_date,
  null::timestamptz as occurred_at,
  null::uuid as employee_id,
  0 as amount
from public.orders o
where o.status = 'void'::public.order_status;

grant select on public.history_entries to anon, authenticated, service_role;

-- ----- 3. RPC pay_order_items: thanh toán một phần theo món -----
create or replace function public.pay_order_items(
  p_payment_id uuid,
  p_order_id uuid,
  p_employee_id uuid,
  p_method public.payment_method,
  p_expected_lock_version integer,
  p_received_amount integer,
  p_items jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_store_id uuid := auth.uid();
  v_employee_role public.employee_role;
  v_order public.orders%rowtype;
  v_order_item public.order_items%rowtype;
  v_line record;
  v_table_name text;
  v_unit_total integer;
  v_amount integer := 0;
  v_change_amount integer;
  v_paid_at timestamptz;
  v_remaining integer;
  v_status text := 'open';
  v_lines jsonb := '[]'::jsonb;
  v_receipt jsonb;
begin
  if v_store_id is null then
    raise exception 'AUTH_REQUIRED'
      using errcode = 'P0001',
            hint = 'A store session is required.';
  end if;

  select e.role
  into v_employee_role
  from public.employees e
  where e.store_id = v_store_id
    and e.id = p_employee_id
    and e.is_active = true;

  if not found then
    raise exception 'FORBIDDEN'
      using errcode = 'P0001',
            hint = 'Employee must be active and belong to the current store.';
  end if;

  perform pg_advisory_xact_lock(hashtext(v_store_id::text || ':pos-write'));

  if p_payment_id is null then
    raise exception 'INVALID_PAYMENT_ID'
      using errcode = 'P0001',
            hint = 'Payment must pass a client-generated UUID.';
  end if;

  if p_received_amount < 0 then
    raise exception 'PAYMENT_AMOUNT_TOO_LOW'
      using errcode = 'P0001',
            hint = 'received amount must be non-negative.';
  end if;

  if p_items is null
    or jsonb_typeof(p_items) <> 'array'
    or jsonb_array_length(p_items) = 0 then
    raise exception 'INVALID_ORDER_ITEMS'
      using errcode = 'P0001',
            hint = 'p_items must be a non-empty jsonb array.';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_items) as line("orderItemId" uuid)
    group by line."orderItemId"
    having count(*) > 1
  ) then
    raise exception 'INVALID_ORDER_ITEMS'
      using errcode = 'P0001',
            hint = 'Duplicate order item in payment selection.';
  end if;

  select *
  into v_order
  from public.orders o
  where o.store_id = v_store_id
    and o.id = p_order_id
  for update;

  if not found
    or v_order.status <> 'open'::public.order_status
    or v_order.lock_version <> p_expected_lock_version then
    raise exception 'ORDER_VERSION_CONFLICT'
      using errcode = 'P0001',
            hint = 'Order status or lock_version changed before payment.';
  end if;

  if v_order.table_id is not null then
    select t.name
    into v_table_name
    from public.tables t
    where t.store_id = v_store_id
      and t.id = v_order.table_id
    for update;
  end if;

  -- Lượt 1: khoá dòng, validate và tính tiền phía server (DB là nguồn giá).
  for v_line in
    select *
    from jsonb_to_recordset(p_items) as line(
      "orderItemId" uuid,
      quantity integer,
      "splitItemId" uuid
    )
  loop
    if v_line."orderItemId" is null or coalesce(v_line.quantity, 0) < 1 then
      raise exception 'INVALID_ORDER_ITEMS'
        using errcode = 'P0001',
              hint = 'Each line must include orderItemId and a positive quantity.';
    end if;

    select *
    into v_order_item
    from public.order_items oi
    where oi.store_id = v_store_id
      and oi.order_id = p_order_id
      and oi.id = v_line."orderItemId"
      and oi.status <> 'removed'::public.order_item_status
    for update;

    if not found or v_order_item.payment_id is not null then
      raise exception 'INVALID_ORDER_ITEMS'
        using errcode = 'P0001',
              hint = 'Order item is missing, removed, or already paid.';
    end if;

    if v_line.quantity > v_order_item.quantity then
      raise exception 'INVALID_ORDER_ITEMS'
        using errcode = 'P0001',
              hint = 'Line quantity exceeds the remaining quantity.';
    end if;

    if v_line.quantity < v_order_item.quantity and v_line."splitItemId" is null then
      raise exception 'INVALID_ORDER_ITEMS'
        using errcode = 'P0001',
              hint = 'Partial-quantity lines must pass a client-generated splitItemId.';
    end if;

    select v_order_item.unit_price + coalesce(sum(oio.price_delta * oio.quantity), 0)
    into v_unit_total
    from public.order_item_options oio
    where oio.store_id = v_store_id
      and oio.order_item_id = v_order_item.id;

    v_amount := v_amount + (v_unit_total * v_line.quantity);
  end loop;

  if p_received_amount < v_amount then
    raise exception 'PAYMENT_AMOUNT_TOO_LOW'
      using errcode = 'P0001',
            hint = 'received amount must be greater than or equal to the selected amount.';
  end if;

  v_change_amount := p_received_amount - v_amount;
  v_paid_at := now();

  insert into public.payments (
    id,
    store_id,
    order_id,
    employee_id,
    method,
    amount,
    received_amount,
    change_amount,
    paid_at
  ) values (
    p_payment_id,
    v_store_id,
    p_order_id,
    p_employee_id,
    p_method,
    v_amount,
    p_received_amount,
    v_change_amount,
    v_paid_at
  );

  -- Lượt 2: gắn payment_id; trả một phần số lượng thì tách dòng đã trả ra riêng.
  for v_line in
    select *
    from jsonb_to_recordset(p_items) as line(
      "orderItemId" uuid,
      quantity integer,
      "splitItemId" uuid
    )
  loop
    select *
    into v_order_item
    from public.order_items oi
    where oi.store_id = v_store_id
      and oi.id = v_line."orderItemId";

    if v_line.quantity = v_order_item.quantity then
      update public.order_items oi
      set payment_id = p_payment_id
      where oi.store_id = v_store_id
        and oi.id = v_order_item.id;
    else
      update public.order_items oi
      set quantity = oi.quantity - v_line.quantity
      where oi.store_id = v_store_id
        and oi.id = v_order_item.id;

      insert into public.order_items (
        id,
        store_id,
        order_id,
        menu_item_id,
        item_name,
        quantity,
        unit_price,
        note,
        status,
        sort_order,
        payment_id
      ) values (
        v_line."splitItemId",
        v_store_id,
        p_order_id,
        v_order_item.menu_item_id,
        v_order_item.item_name,
        v_line.quantity,
        v_order_item.unit_price,
        v_order_item.note,
        v_order_item.status,
        v_order_item.sort_order,
        p_payment_id
      );

      -- Snapshot option của dòng tách (id server cấp: dòng snapshot, client không sửa).
      insert into public.order_item_options (
        id,
        store_id,
        order_item_id,
        option_value_id,
        option_name,
        price_delta,
        quantity
      )
      select
        gen_random_uuid(),
        oio.store_id,
        v_line."splitItemId",
        oio.option_value_id,
        oio.option_name,
        oio.price_delta,
        oio.quantity
      from public.order_item_options oio
      where oio.store_id = v_store_id
        and oio.order_item_id = v_order_item.id;
    end if;
  end loop;

  update public.orders o
  set paid_amount = o.paid_amount + v_amount,
      lock_version = o.lock_version + 1
  where o.store_id = v_store_id
    and o.id = p_order_id
  returning * into v_order;

  -- Hết món chưa trả -> đơn đóng, bàn trống.
  if not exists (
    select 1
    from public.order_items oi
    where oi.store_id = v_store_id
      and oi.order_id = p_order_id
      and oi.status <> 'removed'::public.order_item_status
      and oi.payment_id is null
  ) then
    v_status := 'paid';

    update public.orders o
    set status = 'paid'::public.order_status,
        paid_at = v_paid_at
    where o.store_id = v_store_id
      and o.id = p_order_id
    returning * into v_order;

    if v_order.table_id is not null then
      update public.tables t
      set status = 'empty'::public.table_status
      where t.store_id = v_store_id
        and t.id = v_order.table_id;
    end if;
  end if;

  v_remaining := v_order.total - v_order.paid_amount;

  -- Bill chỉ gồm các món của lần trả này.
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'name', oi.item_name,
        'quantity', oi.quantity,
        'unitPrice', oi.unit_price,
        'options', coalesce(
          (
            select jsonb_agg(
              case when oio.quantity > 1 then oio.option_name || ' ×' || oio.quantity else oio.option_name end
              order by oio.created_at
            )
            from public.order_item_options oio
            where oio.store_id = oi.store_id
              and oio.order_item_id = oi.id
          ),
          '[]'::jsonb
        )
      )
      order by oi.sort_order
    ),
    '[]'::jsonb
  )
  into v_lines
  from public.order_items oi
  where oi.store_id = v_store_id
    and oi.order_id = p_order_id
    and oi.payment_id = p_payment_id;

  v_receipt := jsonb_build_object(
    'orderNo', v_order.order_no,
    'tableName', v_table_name,
    'orderType', v_order.order_type,
    'lines', v_lines,
    'total', v_amount,
    'receivedAmount', p_received_amount,
    'changeAmount', v_change_amount,
    'paidAt', v_paid_at::text
  );

  return jsonb_build_object(
    'orderId', p_order_id,
    'paymentId', p_payment_id,
    'status', v_status,
    'amount', v_amount,
    'receivedAmount', p_received_amount,
    'changeAmount', v_change_amount,
    'paidAmount', v_order.paid_amount,
    'remainingAmount', v_remaining,
    'lockVersion', v_order.lock_version,
    'receipt', v_receipt
  );
end;
$$;

-- ----- 4. submit_order_changes: đóng băng dòng đã trả, chặn huỷ đơn đã thu tiền -----
create or replace function public.submit_order_changes(
  p_order_id uuid,
  p_table_id uuid,
  p_order_type public.order_type,
  p_employee_id uuid,
  p_expected_lock_version integer,
  p_items jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_store_id uuid := auth.uid();
  v_employee_role public.employee_role;
  v_existing_order public.orders%rowtype;
  v_has_existing_order boolean := false;
  v_table public.tables%rowtype;
  v_table_name text;
  v_timezone text;
  v_business_date date;
  v_order_no integer;
  v_order_type public.order_type;
  v_lock_version integer := 0;
  v_active_count integer := 0;
  v_subtotal integer := 0;
  v_paid_subtotal integer := 0;
  v_total integer := 0;
  v_sort_order integer := 0;
  v_item record;
  v_option record;
  v_menu_item public.menu_items%rowtype;
  v_option_value record;
  v_option_total integer;
  v_option_qty integer;
  v_lines jsonb := '[]'::jsonb;
  v_ticket jsonb;
begin
  if v_store_id is null then
    raise exception 'AUTH_REQUIRED'
      using errcode = 'P0001',
            hint = 'A store session is required.';
  end if;

  select e.role
  into v_employee_role
  from public.employees e
  where e.store_id = v_store_id
    and e.id = p_employee_id
    and e.is_active = true;

  if not found then
    raise exception 'FORBIDDEN'
      using errcode = 'P0001',
            hint = 'Employee must be active and belong to the current store.';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'INVALID_ORDER_ITEMS'
      using errcode = 'P0001',
            hint = 'p_items must be a jsonb array.';
  end if;

  perform pg_advisory_xact_lock(hashtext(v_store_id::text || ':pos-write'));

  if p_order_type = 'takeaway'::public.order_type then
    p_table_id := null;
  end if;

  select count(*)
  into v_active_count
  from jsonb_to_recordset(p_items) as item(
    id uuid,
    "menuItemId" uuid,
    quantity integer,
    note text,
    options jsonb
  )
  where coalesce(item.quantity, 0) > 0;

  if exists (
    select 1
    from jsonb_to_recordset(p_items) as item(
      id uuid,
      "menuItemId" uuid,
      quantity integer,
      note text,
      options jsonb
    )
    where coalesce(item.quantity, 0) < 0
  ) then
    raise exception 'INVALID_ORDER_ITEMS'
      using errcode = 'P0001',
            hint = 'Item quantity must be non-negative.';
  end if;

  if p_order_id is null then
    if v_active_count = 0 then
      return jsonb_build_object(
        'orderId', null,
        'status', 'void',
        'tableId', p_table_id,
        'tableStatus', null,
        'orderNo', 0,
        'businessDate', null,
        'lockVersion', 0,
        'ticket', null
      );
    end if;

    raise exception 'INVALID_ORDER_ID'
      using errcode = 'P0001',
            hint = 'New orders must pass a client-generated p_order_id UUID.';
  end if;

  if p_table_id is not null then
    select *
    into v_table
    from public.tables t
    where t.store_id = v_store_id
      and t.id = p_table_id
      and t.deleted_at is null
    for update;

    if not found then
      raise exception 'TABLE_NOT_FOUND'
        using errcode = 'P0001',
              hint = 'Table must exist, be active, and belong to the current store.';
    end if;

    v_table_name := v_table.name;
  end if;

  select *
  into v_existing_order
  from public.orders o
  where o.store_id = v_store_id
    and o.id = p_order_id
  for update;

  v_has_existing_order := found;

  if v_has_existing_order then
    v_order_type := v_existing_order.order_type;

    if v_existing_order.status <> 'open'::public.order_status
      or v_existing_order.lock_version <> p_expected_lock_version then
      raise exception 'ORDER_VERSION_CONFLICT'
        using errcode = 'P0001',
              hint = 'Order status or lock_version changed before submit.';
    end if;

    if v_existing_order.table_id is not null and p_table_id is distinct from v_existing_order.table_id then
      p_table_id := v_existing_order.table_id;
      select *
      into v_table
      from public.tables t
      where t.store_id = v_store_id
        and t.id = p_table_id
      for update;
      v_table_name := v_table.name;
    end if;

    if exists (
      select 1
      from jsonb_to_recordset(p_items) as item(
        id uuid,
        "menuItemId" uuid,
        quantity integer,
        note text,
        options jsonb
      )
      join public.order_items oi
        on oi.store_id = v_store_id
       and oi.order_id = p_order_id
       and oi.id = item.id
      where coalesce(item.quantity, 0) > 0
    ) then
      raise exception 'INVALID_ORDER_ITEMS'
        using errcode = 'P0001',
              hint = 'Replace-submit must use fresh client UUIDs for active order_items.';
    end if;

    -- Instant pay: dòng đã trả bị đóng băng — chỉ replace phần chưa thanh toán.
    update public.order_items oi
    set status = 'removed'::public.order_item_status
    where oi.store_id = v_store_id
      and oi.order_id = p_order_id
      and oi.status <> 'removed'::public.order_item_status
      and oi.payment_id is null;

    if v_active_count = 0 then
      if v_existing_order.paid_amount > 0 then
        raise exception 'ORDER_PARTIALLY_PAID'
          using errcode = 'P0001',
                hint = 'Orders with collected payments cannot be voided.';
      end if;

      update public.orders o
      set status = 'void'::public.order_status,
          subtotal = 0,
          discount_type = 'none'::public.discount_type,
          discount_value = 0,
          total = 0,
          lock_version = o.lock_version + 1
      where o.store_id = v_store_id
        and o.id = p_order_id
      returning o.lock_version into v_lock_version;

      if p_table_id is not null then
        update public.tables t
        set status = 'empty'::public.table_status
        where t.store_id = v_store_id
          and t.id = p_table_id;
      end if;

      return jsonb_build_object(
        'orderId', p_order_id,
        'status', 'void',
        'tableId', p_table_id,
        'tableStatus', case when p_table_id is null then null else 'empty' end,
        'orderNo', v_existing_order.order_no,
        'businessDate', v_existing_order.business_date::text,
        'lockVersion', v_lock_version,
        'ticket', null
      );
    end if;

    -- Dòng mới xếp sau các dòng đã trả để bill giữ thứ tự ổn định.
    select coalesce(max(oi.sort_order), 0)
    into v_sort_order
    from public.order_items oi
    where oi.store_id = v_store_id
      and oi.order_id = p_order_id
      and oi.status <> 'removed'::public.order_item_status
      and oi.payment_id is not null;
  else
    v_order_type := p_order_type;

    if p_expected_lock_version is not null then
      raise exception 'ORDER_VERSION_CONFLICT'
        using errcode = 'P0001',
              hint = 'New orders must not pass an expected lock_version.';
    end if;

    if v_active_count = 0 then
      return jsonb_build_object(
        'orderId', null,
        'status', 'void',
        'tableId', p_table_id,
        'tableStatus', null,
        'orderNo', 0,
        'businessDate', null,
        'lockVersion', 0,
        'ticket', null
      );
    end if;

    if p_table_id is not null and exists (
      select 1
      from public.orders o
      where o.store_id = v_store_id
        and o.table_id = p_table_id
        and o.status = 'open'::public.order_status
    ) then
      raise exception 'ORDER_VERSION_CONFLICT'
        using errcode = 'P0001',
              hint = 'Table already has an open order.';
    end if;

    if v_order_type is null then
      raise exception 'INVALID_ORDER_ITEMS'
        using errcode = 'P0001',
              hint = 'New orders must include order_type.';
    end if;

    select coalesce(ss.timezone, 'Asia/Saigon')
    into v_timezone
    from public.store_settings ss
    where ss.store_id = v_store_id;

    v_timezone := coalesce(v_timezone, 'Asia/Saigon');
    v_business_date := (now() at time zone v_timezone)::date;

    perform pg_advisory_xact_lock(hashtext(v_store_id::text || ':' || v_business_date::text));

    select coalesce(max(o.order_no), 0) + 1
    into v_order_no
    from public.orders o
    where o.store_id = v_store_id
      and o.business_date = v_business_date;

    insert into public.orders (
      id,
      store_id,
      table_id,
      order_type,
      order_no,
      business_date,
      status,
      subtotal,
      discount_type,
      discount_value,
      total,
      employee_id,
      lock_version
    ) values (
      p_order_id,
      v_store_id,
      p_table_id,
      v_order_type,
      v_order_no,
      v_business_date,
      'open'::public.order_status,
      0,
      'none'::public.discount_type,
      0,
      0,
      p_employee_id,
      0
    );
  end if;

  for v_item in
    select *
    from jsonb_to_recordset(p_items) as item(
      id uuid,
      "menuItemId" uuid,
      quantity integer,
      note text,
      options jsonb
    )
    where coalesce(item.quantity, 0) > 0
  loop
    if v_item.id is null or v_item."menuItemId" is null then
      raise exception 'INVALID_ORDER_ITEMS'
        using errcode = 'P0001',
              hint = 'Active items must include id and menuItemId.';
    end if;

    select *
    into v_menu_item
    from public.menu_items mi
    where mi.store_id = v_store_id
      and mi.id = v_item."menuItemId"
      and mi.deleted_at is null
      and mi.is_available = true;

    if not found then
      raise exception 'MENU_ITEM_UNAVAILABLE'
        using errcode = 'P0001',
              hint = 'Menu item is missing, deleted, unavailable, or outside the current store.';
    end if;

    v_sort_order := v_sort_order + 1;
    v_option_total := 0;

    insert into public.order_items (
      id,
      store_id,
      order_id,
      menu_item_id,
      item_name,
      quantity,
      unit_price,
      note,
      status,
      sort_order
    ) values (
      v_item.id,
      v_store_id,
      p_order_id,
      v_menu_item.id,
      v_menu_item.name,
      v_item.quantity,
      v_menu_item.price,
      nullif(v_item.note, ''),
      'waiting'::public.order_item_status,
      v_sort_order
    );

    for v_option in
      select *
      from jsonb_to_recordset(
        case
          when jsonb_typeof(v_item.options) = 'array' then v_item.options
          else '[]'::jsonb
        end
      ) as opt(
        id uuid,
        "optionValueId" uuid,
        quantity integer
      )
    loop
      if v_option.id is null or v_option."optionValueId" is null then
        raise exception 'INVALID_ORDER_ITEMS'
          using errcode = 'P0001',
                hint = 'Options must include id and optionValueId.';
      end if;

      -- Tuỳ chọn hợp lệ khi nhóm của nó được liên kết với đúng món qua menu_item_option_groups.
      select ov.id, ov.name, ov.price_delta
      into v_option_value
      from public.option_values ov
      join public.option_groups og
        on og.store_id = ov.store_id
       and og.id = ov.option_group_id
      join public.menu_item_option_groups miog
        on miog.store_id = og.store_id
       and miog.option_group_id = og.id
      where ov.store_id = v_store_id
        and ov.id = v_option."optionValueId"
        and ov.deleted_at is null
        and og.deleted_at is null
        and miog.deleted_at is null
        and miog.menu_item_id = v_menu_item.id;

      if not found then
        raise exception 'OPTION_VALUE_UNAVAILABLE'
          using errcode = 'P0001',
                hint = 'Option value is missing, deleted, or not attached to the submitted menu item.';
      end if;

      v_option_qty := greatest(coalesce(v_option.quantity, 1), 1);

      insert into public.order_item_options (
        id,
        store_id,
        order_item_id,
        option_value_id,
        option_name,
        price_delta,
        quantity
      ) values (
        v_option.id,
        v_store_id,
        v_item.id,
        v_option_value.id,
        v_option_value.name,
        v_option_value.price_delta,
        v_option_qty
      );

      v_option_total := v_option_total + (v_option_value.price_delta * v_option_qty);
    end loop;

    v_subtotal := v_subtotal + ((v_menu_item.price + v_option_total) * v_item.quantity);
  end loop;

  -- Tổng đơn = phần đã trả (đóng băng) + phần draft mới.
  select coalesce(sum((oi.unit_price + coalesce(opt.option_total, 0)) * oi.quantity), 0)
  into v_paid_subtotal
  from public.order_items oi
  left join lateral (
    select sum(oio.price_delta * oio.quantity) as option_total
    from public.order_item_options oio
    where oio.store_id = oi.store_id
      and oio.order_item_id = oi.id
  ) opt on true
  where oi.store_id = v_store_id
    and oi.order_id = p_order_id
    and oi.status <> 'removed'::public.order_item_status
    and oi.payment_id is not null;

  v_total := v_subtotal + v_paid_subtotal;

  update public.orders o
  set subtotal = v_total,
      discount_type = 'none'::public.discount_type,
      discount_value = 0,
      total = v_total,
      employee_id = p_employee_id,
      lock_version = case when v_has_existing_order then o.lock_version + 1 else o.lock_version end
  where o.store_id = v_store_id
    and o.id = p_order_id
  returning o.order_no, o.business_date, o.lock_version
  into v_order_no, v_business_date, v_lock_version;

  if p_table_id is not null then
    update public.tables t
    set status = 'occupied'::public.table_status
    where t.store_id = v_store_id
      and t.id = p_table_id;
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'name', oi.item_name,
        'quantity', oi.quantity,
        'unitPrice', oi.unit_price,
        'options', coalesce(
          (
            select jsonb_agg(
              case when oio.quantity > 1 then oio.option_name || ' ×' || oio.quantity else oio.option_name end
              order by oio.created_at
            )
            from public.order_item_options oio
            where oio.store_id = oi.store_id
              and oio.order_item_id = oi.id
          ),
          '[]'::jsonb
        )
      )
      order by oi.sort_order
    ),
    '[]'::jsonb
  )
  into v_lines
  from public.order_items oi
  where oi.store_id = v_store_id
    and oi.order_id = p_order_id
    and oi.status <> 'removed'::public.order_item_status;

  v_ticket := jsonb_build_object(
    'orderNo', v_order_no,
    'tableName', v_table_name,
    'orderType', v_order_type,
    'lines', v_lines,
    'total', v_total
  );

  return jsonb_build_object(
    'orderId', p_order_id,
    'status', 'open',
    'tableId', p_table_id,
    'tableStatus', case when p_table_id is null then null else 'occupied' end,
    'orderNo', v_order_no,
    'businessDate', v_business_date::text,
    'lockVersion', v_lock_version,
    'ticket', v_ticket
  );
end;
$$;

-- ----- 5. pay_order: thu PHẦN CÒN LẠI; bill chỉ in các món của lần trả này -----
create or replace function public.pay_order(
  p_payment_id uuid,
  p_order_id uuid,
  p_employee_id uuid,
  p_method public.payment_method,
  p_expected_lock_version integer,
  p_received_amount integer
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_store_id uuid := auth.uid();
  v_employee_role public.employee_role;
  v_order public.orders%rowtype;
  v_table_name text;
  v_amount integer;
  v_change_amount integer;
  v_paid_at timestamptz;
  v_lines jsonb := '[]'::jsonb;
  v_receipt jsonb;
begin
  if v_store_id is null then
    raise exception 'AUTH_REQUIRED'
      using errcode = 'P0001',
            hint = 'A store session is required.';
  end if;

  select e.role
  into v_employee_role
  from public.employees e
  where e.store_id = v_store_id
    and e.id = p_employee_id
    and e.is_active = true;

  if not found then
    raise exception 'FORBIDDEN'
      using errcode = 'P0001',
            hint = 'Employee must be active and belong to the current store.';
  end if;

  perform pg_advisory_xact_lock(hashtext(v_store_id::text || ':pos-write'));

  if p_payment_id is null then
    raise exception 'INVALID_PAYMENT_ID'
      using errcode = 'P0001',
            hint = 'Payment must pass a client-generated UUID.';
  end if;

  if p_received_amount < 0 then
    raise exception 'PAYMENT_AMOUNT_TOO_LOW'
      using errcode = 'P0001',
            hint = 'received amount must be non-negative.';
  end if;

  select *
  into v_order
  from public.orders o
  where o.store_id = v_store_id
    and o.id = p_order_id
  for update;

  if not found
    or v_order.status <> 'open'::public.order_status
    or v_order.lock_version <> p_expected_lock_version then
    raise exception 'ORDER_VERSION_CONFLICT'
      using errcode = 'P0001',
            hint = 'Order status or lock_version changed before payment.';
  end if;

  -- Instant pay: số phải thu = phần còn lại sau các lần trả từng phần.
  v_amount := v_order.total - v_order.paid_amount;

  if p_received_amount < v_amount then
    raise exception 'PAYMENT_AMOUNT_TOO_LOW'
      using errcode = 'P0001',
            hint = 'received amount must be greater than or equal to the remaining amount.';
  end if;

  if v_order.table_id is not null then
    select t.name
    into v_table_name
    from public.tables t
    where t.store_id = v_store_id
      and t.id = v_order.table_id
    for update;
  end if;

  v_change_amount := p_received_amount - v_amount;
  v_paid_at := now();

  insert into public.payments (
    id,
    store_id,
    order_id,
    employee_id,
    method,
    amount,
    received_amount,
    change_amount,
    paid_at
  ) values (
    p_payment_id,
    v_store_id,
    p_order_id,
    p_employee_id,
    p_method,
    v_amount,
    p_received_amount,
    v_change_amount,
    v_paid_at
  );

  -- Các món chưa trả thuộc về lần trả cuối này.
  update public.order_items oi
  set payment_id = p_payment_id
  where oi.store_id = v_store_id
    and oi.order_id = p_order_id
    and oi.status <> 'removed'::public.order_item_status
    and oi.payment_id is null;

  update public.orders o
  set status = 'paid'::public.order_status,
      paid_at = v_paid_at,
      paid_amount = o.total,
      lock_version = o.lock_version + 1
  where o.store_id = v_store_id
    and o.id = p_order_id
  returning * into v_order;

  if v_order.table_id is not null then
    update public.tables t
    set status = 'empty'::public.table_status
    where t.store_id = v_store_id
      and t.id = v_order.table_id;
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'name', oi.item_name,
        'quantity', oi.quantity,
        'unitPrice', oi.unit_price,
        'options', coalesce(
          (
            select jsonb_agg(
              case when oio.quantity > 1 then oio.option_name || ' ×' || oio.quantity else oio.option_name end
              order by oio.created_at
            )
            from public.order_item_options oio
            where oio.store_id = oi.store_id
              and oio.order_item_id = oi.id
          ),
          '[]'::jsonb
        )
      )
      order by oi.sort_order
    ),
    '[]'::jsonb
  )
  into v_lines
  from public.order_items oi
  where oi.store_id = v_store_id
    and oi.order_id = p_order_id
    and oi.payment_id = p_payment_id;

  v_receipt := jsonb_build_object(
    'orderNo', v_order.order_no,
    'tableName', v_table_name,
    'orderType', v_order.order_type,
    'lines', v_lines,
    'total', v_amount,
    'receivedAmount', p_received_amount,
    'changeAmount', v_change_amount,
    'paidAt', v_paid_at::text
  );

  return jsonb_build_object(
    'orderId', p_order_id,
    'paymentId', p_payment_id,
    'status', 'paid',
    'total', v_amount,
    'receivedAmount', p_received_amount,
    'changeAmount', v_change_amount,
    'lockVersion', v_order.lock_version,
    'receipt', v_receipt
  );
end;
$$;
$permission_fragment_8$;
-- 10: supabase/migrations/010_split_payment.sql
 if clock_timestamp()>=least(started_at+interval '50 seconds','2026-10-22T10:00:00.000Z'::timestamptz) then raise exception 'STAGING_EXECUTION_WINDOW_CLOSED'; end if;
 execute $permission_fragment_9$-- 010_split_payment.sql
-- Instant pay REWORK (thay thế mô hình partial-payment của 009):
-- thanh toán một phần = TÁCH các món được chọn ra một ĐƠN MỚI ĐỘC LẬP và thanh
-- toán đơn đó ngay trong cùng transaction. Hai đơn không liên kết gì nhau (chỉ
-- chung table_id lúc thanh toán). Nhờ vậy: mỗi lần thu = một đơn 'paid' -> vào
-- report NGAY; đơn gốc còn lại là đơn bình thường (sửa/void được).
--
-- QUY TẮC ĐÁNH SỐ: bill thanh toán trước mang order_no NHỎ hơn — đơn tách KẾ
-- THỪA order_no của đơn gốc; đơn gốc (phần chưa trả) nhận order_no mới (max+1).
-- Ví dụ bàn #12 trả 2 lần: bill #12 (lần 1), phần còn lại thành #13, bill #13.
--
-- Dọn 009: drop view history_entries, cột order_items.payment_id, orders.paid_amount;
-- submit_order_changes / pay_order trở về đúng phiên bản 008.
-- Chạy SAU 009_partial_payment.sql.

-- ----- 1. Dọn schema 009 -----
drop view if exists public.history_entries;

alter table public.order_items drop constraint if exists order_items_payment_fk;
drop index if exists public.order_items_store_payment_idx;
alter table public.order_items drop column if exists payment_id;
alter table public.orders drop column if exists paid_amount;

-- Giữ payments_store_order_idx (hữu ích cho tra cứu payment theo đơn).
create index if not exists payments_store_order_idx
  on public.payments (store_id, order_id, paid_at);

-- ----- 2. RPC pay_order_items: tách đơn độc lập và thanh toán ngay -----
create or replace function public.pay_order_items(
  p_payment_id uuid,
  p_order_id uuid,
  p_new_order_id uuid,
  p_employee_id uuid,
  p_method public.payment_method,
  p_expected_lock_version integer,
  p_received_amount integer,
  p_items jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_store_id uuid := auth.uid();
  v_employee_role public.employee_role;
  v_source public.orders%rowtype;
  v_order_item public.order_items%rowtype;
  v_line record;
  v_table_name text;
  v_unit_total integer;
  v_amount integer := 0;
  v_change_amount integer;
  v_paid_at timestamptz;
  v_split_order_no integer;
  v_source_new_no integer;
  v_source_total integer := 0;
  v_source_lock_version integer;
  v_lines jsonb := '[]'::jsonb;
  v_receipt jsonb;
begin
  if v_store_id is null then
    raise exception 'AUTH_REQUIRED'
      using errcode = 'P0001',
            hint = 'A store session is required.';
  end if;

  select e.role
  into v_employee_role
  from public.employees e
  where e.store_id = v_store_id
    and e.id = p_employee_id
    and e.is_active = true;

  if not found then
    raise exception 'FORBIDDEN'
      using errcode = 'P0001',
            hint = 'Employee must be active and belong to the current store.';
  end if;

  perform pg_advisory_xact_lock(hashtext(v_store_id::text || ':pos-write'));

  if p_payment_id is null then
    raise exception 'INVALID_PAYMENT_ID'
      using errcode = 'P0001',
            hint = 'Payment must pass a client-generated UUID.';
  end if;

  if p_new_order_id is null then
    raise exception 'INVALID_ORDER_ID'
      using errcode = 'P0001',
            hint = 'Split payments must pass a client-generated p_new_order_id UUID.';
  end if;

  if p_received_amount < 0 then
    raise exception 'PAYMENT_AMOUNT_TOO_LOW'
      using errcode = 'P0001',
            hint = 'received amount must be non-negative.';
  end if;

  if p_items is null
    or jsonb_typeof(p_items) <> 'array'
    or jsonb_array_length(p_items) = 0 then
    raise exception 'INVALID_ORDER_ITEMS'
      using errcode = 'P0001',
            hint = 'p_items must be a non-empty jsonb array.';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_items) as line("orderItemId" uuid)
    group by line."orderItemId"
    having count(*) > 1
  ) then
    raise exception 'INVALID_ORDER_ITEMS'
      using errcode = 'P0001',
            hint = 'Duplicate order item in payment selection.';
  end if;

  select *
  into v_source
  from public.orders o
  where o.store_id = v_store_id
    and o.id = p_order_id
  for update;

  if not found
    or v_source.status <> 'open'::public.order_status
    or v_source.lock_version <> p_expected_lock_version then
    raise exception 'ORDER_VERSION_CONFLICT'
      using errcode = 'P0001',
            hint = 'Order status or lock_version changed before payment.';
  end if;

  if v_source.table_id is not null then
    select t.name
    into v_table_name
    from public.tables t
    where t.store_id = v_store_id
      and t.id = v_source.table_id
    for update;
  end if;

  -- Lượt 1: khoá dòng, validate và tính tiền phía server (DB là nguồn giá).
  for v_line in
    select *
    from jsonb_to_recordset(p_items) as line(
      "orderItemId" uuid,
      quantity integer,
      "splitItemId" uuid
    )
  loop
    if v_line."orderItemId" is null or coalesce(v_line.quantity, 0) < 1 then
      raise exception 'INVALID_ORDER_ITEMS'
        using errcode = 'P0001',
              hint = 'Each line must include orderItemId and a positive quantity.';
    end if;

    select *
    into v_order_item
    from public.order_items oi
    where oi.store_id = v_store_id
      and oi.order_id = p_order_id
      and oi.id = v_line."orderItemId"
      and oi.status <> 'removed'::public.order_item_status
    for update;

    if not found then
      raise exception 'INVALID_ORDER_ITEMS'
        using errcode = 'P0001',
              hint = 'Order item is missing or removed.';
    end if;

    if v_line.quantity > v_order_item.quantity then
      raise exception 'INVALID_ORDER_ITEMS'
        using errcode = 'P0001',
              hint = 'Line quantity exceeds the order line quantity.';
    end if;

    if v_line.quantity < v_order_item.quantity and v_line."splitItemId" is null then
      raise exception 'INVALID_ORDER_ITEMS'
        using errcode = 'P0001',
              hint = 'Partial-quantity lines must pass a client-generated splitItemId.';
    end if;

    select v_order_item.unit_price + coalesce(sum(oio.price_delta * oio.quantity), 0)
    into v_unit_total
    from public.order_item_options oio
    where oio.store_id = v_store_id
      and oio.order_item_id = v_order_item.id;

    v_amount := v_amount + (v_unit_total * v_line.quantity);
  end loop;

  -- Chọn đủ 100% đơn thì client phải dùng pay_order (đơn gốc đóng, không tách).
  if not exists (
    select 1
    from public.order_items oi
    left join jsonb_to_recordset(p_items) as line("orderItemId" uuid, quantity integer)
      on line."orderItemId" = oi.id
    where oi.store_id = v_store_id
      and oi.order_id = p_order_id
      and oi.status <> 'removed'::public.order_item_status
      and coalesce(line.quantity, 0) < oi.quantity
  ) then
    raise exception 'INVALID_ORDER_ITEMS'
      using errcode = 'P0001',
            hint = 'Full selection must go through pay_order.';
  end if;

  if p_received_amount < v_amount then
    raise exception 'PAYMENT_AMOUNT_TOO_LOW'
      using errcode = 'P0001',
            hint = 'received amount must be greater than or equal to the selected amount.';
  end if;

  v_change_amount := p_received_amount - v_amount;
  v_paid_at := now();

  -- Đánh số: bill (đơn tách) kế thừa số của đơn gốc; đơn gốc nhận số mới.
  v_split_order_no := v_source.order_no;
  perform pg_advisory_xact_lock(hashtext(v_store_id::text || ':' || v_source.business_date::text));
  select coalesce(max(o.order_no), 0) + 1
  into v_source_new_no
  from public.orders o
  where o.store_id = v_store_id
    and o.business_date = v_source.business_date;

  -- Đổi số đơn gốc TRƯỚC để nhả số cũ cho đơn tách (unique store/business_date/order_no).
  update public.orders o
  set order_no = v_source_new_no
  where o.store_id = v_store_id
    and o.id = p_order_id;

  insert into public.orders (
    id,
    store_id,
    table_id,
    order_type,
    order_no,
    business_date,
    status,
    subtotal,
    discount_type,
    discount_value,
    total,
    employee_id,
    paid_at,
    lock_version
  ) values (
    p_new_order_id,
    v_store_id,
    v_source.table_id,
    v_source.order_type,
    v_split_order_no,
    v_source.business_date,
    'paid'::public.order_status,
    v_amount,
    'none'::public.discount_type,
    0,
    v_amount,
    p_employee_id,
    v_paid_at,
    0
  );

  -- Lượt 2: move nguyên dòng sang đơn tách, hoặc tách dòng khi trả một phần số lượng.
  for v_line in
    select *
    from jsonb_to_recordset(p_items) as line(
      "orderItemId" uuid,
      quantity integer,
      "splitItemId" uuid
    )
  loop
    select *
    into v_order_item
    from public.order_items oi
    where oi.store_id = v_store_id
      and oi.id = v_line."orderItemId";

    if v_line.quantity = v_order_item.quantity then
      update public.order_items oi
      set order_id = p_new_order_id
      where oi.store_id = v_store_id
        and oi.id = v_order_item.id;
    else
      update public.order_items oi
      set quantity = oi.quantity - v_line.quantity
      where oi.store_id = v_store_id
        and oi.id = v_order_item.id;

      insert into public.order_items (
        id,
        store_id,
        order_id,
        menu_item_id,
        item_name,
        quantity,
        unit_price,
        note,
        status,
        sort_order
      ) values (
        v_line."splitItemId",
        v_store_id,
        p_new_order_id,
        v_order_item.menu_item_id,
        v_order_item.item_name,
        v_line.quantity,
        v_order_item.unit_price,
        v_order_item.note,
        v_order_item.status,
        v_order_item.sort_order
      );

      -- Snapshot option của dòng tách (id server cấp: dòng snapshot, client không sửa).
      insert into public.order_item_options (
        id,
        store_id,
        order_item_id,
        option_value_id,
        option_name,
        price_delta,
        quantity
      )
      select
        gen_random_uuid(),
        oio.store_id,
        v_line."splitItemId",
        oio.option_value_id,
        oio.option_name,
        oio.price_delta,
        oio.quantity
      from public.order_item_options oio
      where oio.store_id = v_store_id
        and oio.order_item_id = v_order_item.id;
    end if;
  end loop;

  insert into public.payments (
    id,
    store_id,
    order_id,
    employee_id,
    method,
    amount,
    received_amount,
    change_amount,
    paid_at
  ) values (
    p_payment_id,
    v_store_id,
    p_new_order_id,
    p_employee_id,
    p_method,
    v_amount,
    p_received_amount,
    v_change_amount,
    v_paid_at
  );

  -- Đơn gốc: tính lại tổng phần còn lại, bump lock_version. Bàn vẫn occupied.
  select coalesce(sum((oi.unit_price + coalesce(opt.option_total, 0)) * oi.quantity), 0)
  into v_source_total
  from public.order_items oi
  left join lateral (
    select sum(oio.price_delta * oio.quantity) as option_total
    from public.order_item_options oio
    where oio.store_id = oi.store_id
      and oio.order_item_id = oi.id
  ) opt on true
  where oi.store_id = v_store_id
    and oi.order_id = p_order_id
    and oi.status <> 'removed'::public.order_item_status;

  update public.orders o
  set subtotal = v_source_total,
      total = v_source_total,
      lock_version = o.lock_version + 1
  where o.store_id = v_store_id
    and o.id = p_order_id
  returning o.lock_version into v_source_lock_version;

  -- Bill của đơn tách.
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'name', oi.item_name,
        'quantity', oi.quantity,
        'unitPrice', oi.unit_price,
        'options', coalesce(
          (
            select jsonb_agg(
              case when oio.quantity > 1 then oio.option_name || ' ×' || oio.quantity else oio.option_name end
              order by oio.created_at
            )
            from public.order_item_options oio
            where oio.store_id = oi.store_id
              and oio.order_item_id = oi.id
          ),
          '[]'::jsonb
        )
      )
      order by oi.sort_order
    ),
    '[]'::jsonb
  )
  into v_lines
  from public.order_items oi
  where oi.store_id = v_store_id
    and oi.order_id = p_new_order_id;

  v_receipt := jsonb_build_object(
    'orderNo', v_split_order_no,
    'tableName', v_table_name,
    'orderType', v_source.order_type,
    'lines', v_lines,
    'total', v_amount,
    'receivedAmount', p_received_amount,
    'changeAmount', v_change_amount,
    'paidAt', v_paid_at::text
  );

  return jsonb_build_object(
    'orderId', p_new_order_id,
    'orderNo', v_split_order_no,
    'paymentId', p_payment_id,
    'status', 'paid',
    'total', v_amount,
    'receivedAmount', p_received_amount,
    'changeAmount', v_change_amount,
    'receipt', v_receipt,
    'sourceOrderId', p_order_id,
    'sourceOrderNo', v_source_new_no,
    'sourceTotal', v_source_total,
    'sourceLockVersion', v_source_lock_version
  );
end;
$$;

-- ----- 3. submit_order_changes: trở về đúng phiên bản 008 -----
create or replace function public.submit_order_changes(
  p_order_id uuid,
  p_table_id uuid,
  p_order_type public.order_type,
  p_employee_id uuid,
  p_expected_lock_version integer,
  p_items jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_store_id uuid := auth.uid();
  v_employee_role public.employee_role;
  v_existing_order public.orders%rowtype;
  v_has_existing_order boolean := false;
  v_table public.tables%rowtype;
  v_table_name text;
  v_timezone text;
  v_business_date date;
  v_order_no integer;
  v_order_type public.order_type;
  v_lock_version integer := 0;
  v_active_count integer := 0;
  v_subtotal integer := 0;
  v_total integer := 0;
  v_sort_order integer := 0;
  v_item record;
  v_option record;
  v_menu_item public.menu_items%rowtype;
  v_option_value record;
  v_option_total integer;
  v_option_qty integer;
  v_lines jsonb := '[]'::jsonb;
  v_ticket jsonb;
begin
  if v_store_id is null then
    raise exception 'AUTH_REQUIRED'
      using errcode = 'P0001',
            hint = 'A store session is required.';
  end if;

  select e.role
  into v_employee_role
  from public.employees e
  where e.store_id = v_store_id
    and e.id = p_employee_id
    and e.is_active = true;

  if not found then
    raise exception 'FORBIDDEN'
      using errcode = 'P0001',
            hint = 'Employee must be active and belong to the current store.';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'INVALID_ORDER_ITEMS'
      using errcode = 'P0001',
            hint = 'p_items must be a jsonb array.';
  end if;

  perform pg_advisory_xact_lock(hashtext(v_store_id::text || ':pos-write'));

  if p_order_type = 'takeaway'::public.order_type then
    p_table_id := null;
  end if;

  select count(*)
  into v_active_count
  from jsonb_to_recordset(p_items) as item(
    id uuid,
    "menuItemId" uuid,
    quantity integer,
    note text,
    options jsonb
  )
  where coalesce(item.quantity, 0) > 0;

  if exists (
    select 1
    from jsonb_to_recordset(p_items) as item(
      id uuid,
      "menuItemId" uuid,
      quantity integer,
      note text,
      options jsonb
    )
    where coalesce(item.quantity, 0) < 0
  ) then
    raise exception 'INVALID_ORDER_ITEMS'
      using errcode = 'P0001',
            hint = 'Item quantity must be non-negative.';
  end if;

  if p_order_id is null then
    if v_active_count = 0 then
      return jsonb_build_object(
        'orderId', null,
        'status', 'void',
        'tableId', p_table_id,
        'tableStatus', null,
        'orderNo', 0,
        'businessDate', null,
        'lockVersion', 0,
        'ticket', null
      );
    end if;

    raise exception 'INVALID_ORDER_ID'
      using errcode = 'P0001',
            hint = 'New orders must pass a client-generated p_order_id UUID.';
  end if;

  if p_table_id is not null then
    select *
    into v_table
    from public.tables t
    where t.store_id = v_store_id
      and t.id = p_table_id
      and t.deleted_at is null
    for update;

    if not found then
      raise exception 'TABLE_NOT_FOUND'
        using errcode = 'P0001',
              hint = 'Table must exist, be active, and belong to the current store.';
    end if;

    v_table_name := v_table.name;
  end if;

  select *
  into v_existing_order
  from public.orders o
  where o.store_id = v_store_id
    and o.id = p_order_id
  for update;

  v_has_existing_order := found;

  if v_has_existing_order then
    v_order_type := v_existing_order.order_type;

    if v_existing_order.status <> 'open'::public.order_status
      or v_existing_order.lock_version <> p_expected_lock_version then
      raise exception 'ORDER_VERSION_CONFLICT'
        using errcode = 'P0001',
              hint = 'Order status or lock_version changed before submit.';
    end if;

    if v_existing_order.table_id is not null and p_table_id is distinct from v_existing_order.table_id then
      p_table_id := v_existing_order.table_id;
      select *
      into v_table
      from public.tables t
      where t.store_id = v_store_id
        and t.id = p_table_id
      for update;
      v_table_name := v_table.name;
    end if;

    if exists (
      select 1
      from jsonb_to_recordset(p_items) as item(
        id uuid,
        "menuItemId" uuid,
        quantity integer,
        note text,
        options jsonb
      )
      join public.order_items oi
        on oi.store_id = v_store_id
       and oi.order_id = p_order_id
       and oi.id = item.id
      where coalesce(item.quantity, 0) > 0
    ) then
      raise exception 'INVALID_ORDER_ITEMS'
        using errcode = 'P0001',
              hint = 'Replace-submit must use fresh client UUIDs for active order_items.';
    end if;

    update public.order_items oi
    set status = 'removed'::public.order_item_status
    where oi.store_id = v_store_id
      and oi.order_id = p_order_id
      and oi.status <> 'removed'::public.order_item_status;

    if v_active_count = 0 then
      update public.orders o
      set status = 'void'::public.order_status,
          subtotal = 0,
          discount_type = 'none'::public.discount_type,
          discount_value = 0,
          total = 0,
          lock_version = o.lock_version + 1
      where o.store_id = v_store_id
        and o.id = p_order_id
      returning o.lock_version into v_lock_version;

      if p_table_id is not null then
        update public.tables t
        set status = 'empty'::public.table_status
        where t.store_id = v_store_id
          and t.id = p_table_id;
      end if;

      return jsonb_build_object(
        'orderId', p_order_id,
        'status', 'void',
        'tableId', p_table_id,
        'tableStatus', case when p_table_id is null then null else 'empty' end,
        'orderNo', v_existing_order.order_no,
        'businessDate', v_existing_order.business_date::text,
        'lockVersion', v_lock_version,
        'ticket', null
      );
    end if;
  else
    v_order_type := p_order_type;

    if p_expected_lock_version is not null then
      raise exception 'ORDER_VERSION_CONFLICT'
        using errcode = 'P0001',
              hint = 'New orders must not pass an expected lock_version.';
    end if;

    if v_active_count = 0 then
      return jsonb_build_object(
        'orderId', null,
        'status', 'void',
        'tableId', p_table_id,
        'tableStatus', null,
        'orderNo', 0,
        'businessDate', null,
        'lockVersion', 0,
        'ticket', null
      );
    end if;

    if p_table_id is not null and exists (
      select 1
      from public.orders o
      where o.store_id = v_store_id
        and o.table_id = p_table_id
        and o.status = 'open'::public.order_status
    ) then
      raise exception 'ORDER_VERSION_CONFLICT'
        using errcode = 'P0001',
              hint = 'Table already has an open order.';
    end if;

    if v_order_type is null then
      raise exception 'INVALID_ORDER_ITEMS'
        using errcode = 'P0001',
              hint = 'New orders must include order_type.';
    end if;

    select coalesce(ss.timezone, 'Asia/Saigon')
    into v_timezone
    from public.store_settings ss
    where ss.store_id = v_store_id;

    v_timezone := coalesce(v_timezone, 'Asia/Saigon');
    v_business_date := (now() at time zone v_timezone)::date;

    perform pg_advisory_xact_lock(hashtext(v_store_id::text || ':' || v_business_date::text));

    select coalesce(max(o.order_no), 0) + 1
    into v_order_no
    from public.orders o
    where o.store_id = v_store_id
      and o.business_date = v_business_date;

    insert into public.orders (
      id,
      store_id,
      table_id,
      order_type,
      order_no,
      business_date,
      status,
      subtotal,
      discount_type,
      discount_value,
      total,
      employee_id,
      lock_version
    ) values (
      p_order_id,
      v_store_id,
      p_table_id,
      v_order_type,
      v_order_no,
      v_business_date,
      'open'::public.order_status,
      0,
      'none'::public.discount_type,
      0,
      0,
      p_employee_id,
      0
    );
  end if;

  for v_item in
    select *
    from jsonb_to_recordset(p_items) as item(
      id uuid,
      "menuItemId" uuid,
      quantity integer,
      note text,
      options jsonb
    )
    where coalesce(item.quantity, 0) > 0
  loop
    if v_item.id is null or v_item."menuItemId" is null then
      raise exception 'INVALID_ORDER_ITEMS'
        using errcode = 'P0001',
              hint = 'Active items must include id and menuItemId.';
    end if;

    select *
    into v_menu_item
    from public.menu_items mi
    where mi.store_id = v_store_id
      and mi.id = v_item."menuItemId"
      and mi.deleted_at is null
      and mi.is_available = true;

    if not found then
      raise exception 'MENU_ITEM_UNAVAILABLE'
        using errcode = 'P0001',
              hint = 'Menu item is missing, deleted, unavailable, or outside the current store.';
    end if;

    v_sort_order := v_sort_order + 1;
    v_option_total := 0;

    insert into public.order_items (
      id,
      store_id,
      order_id,
      menu_item_id,
      item_name,
      quantity,
      unit_price,
      note,
      status,
      sort_order
    ) values (
      v_item.id,
      v_store_id,
      p_order_id,
      v_menu_item.id,
      v_menu_item.name,
      v_item.quantity,
      v_menu_item.price,
      nullif(v_item.note, ''),
      'waiting'::public.order_item_status,
      v_sort_order
    );

    for v_option in
      select *
      from jsonb_to_recordset(
        case
          when jsonb_typeof(v_item.options) = 'array' then v_item.options
          else '[]'::jsonb
        end
      ) as opt(
        id uuid,
        "optionValueId" uuid,
        quantity integer
      )
    loop
      if v_option.id is null or v_option."optionValueId" is null then
        raise exception 'INVALID_ORDER_ITEMS'
          using errcode = 'P0001',
                hint = 'Options must include id and optionValueId.';
      end if;

      -- Tuỳ chọn hợp lệ khi nhóm của nó được liên kết với đúng món qua menu_item_option_groups.
      select ov.id, ov.name, ov.price_delta
      into v_option_value
      from public.option_values ov
      join public.option_groups og
        on og.store_id = ov.store_id
       and og.id = ov.option_group_id
      join public.menu_item_option_groups miog
        on miog.store_id = og.store_id
       and miog.option_group_id = og.id
      where ov.store_id = v_store_id
        and ov.id = v_option."optionValueId"
        and ov.deleted_at is null
        and og.deleted_at is null
        and miog.deleted_at is null
        and miog.menu_item_id = v_menu_item.id;

      if not found then
        raise exception 'OPTION_VALUE_UNAVAILABLE'
          using errcode = 'P0001',
                hint = 'Option value is missing, deleted, or not attached to the submitted menu item.';
      end if;

      v_option_qty := greatest(coalesce(v_option.quantity, 1), 1);

      insert into public.order_item_options (
        id,
        store_id,
        order_item_id,
        option_value_id,
        option_name,
        price_delta,
        quantity
      ) values (
        v_option.id,
        v_store_id,
        v_item.id,
        v_option_value.id,
        v_option_value.name,
        v_option_value.price_delta,
        v_option_qty
      );

      v_option_total := v_option_total + (v_option_value.price_delta * v_option_qty);
    end loop;

    v_subtotal := v_subtotal + ((v_menu_item.price + v_option_total) * v_item.quantity);
  end loop;

  v_total := v_subtotal;

  update public.orders o
  set subtotal = v_subtotal,
      discount_type = 'none'::public.discount_type,
      discount_value = 0,
      total = v_total,
      employee_id = p_employee_id,
      lock_version = case when v_has_existing_order then o.lock_version + 1 else o.lock_version end
  where o.store_id = v_store_id
    and o.id = p_order_id
  returning o.order_no, o.business_date, o.lock_version
  into v_order_no, v_business_date, v_lock_version;

  if p_table_id is not null then
    update public.tables t
    set status = 'occupied'::public.table_status
    where t.store_id = v_store_id
      and t.id = p_table_id;
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'name', oi.item_name,
        'quantity', oi.quantity,
        'unitPrice', oi.unit_price,
        'options', coalesce(
          (
            select jsonb_agg(
              case when oio.quantity > 1 then oio.option_name || ' ×' || oio.quantity else oio.option_name end
              order by oio.created_at
            )
            from public.order_item_options oio
            where oio.store_id = oi.store_id
              and oio.order_item_id = oi.id
          ),
          '[]'::jsonb
        )
      )
      order by oi.sort_order
    ),
    '[]'::jsonb
  )
  into v_lines
  from public.order_items oi
  where oi.store_id = v_store_id
    and oi.order_id = p_order_id
    and oi.status <> 'removed'::public.order_item_status;

  v_ticket := jsonb_build_object(
    'orderNo', v_order_no,
    'tableName', v_table_name,
    'orderType', v_order_type,
    'lines', v_lines,
    'total', v_total
  );

  return jsonb_build_object(
    'orderId', p_order_id,
    'status', 'open',
    'tableId', p_table_id,
    'tableStatus', case when p_table_id is null then null else 'occupied' end,
    'orderNo', v_order_no,
    'businessDate', v_business_date::text,
    'lockVersion', v_lock_version,
    'ticket', v_ticket
  );
end;
$$;

-- ----- 4. pay_order: trở về đúng phiên bản 008 (thu nguyên tổng đơn) -----
create or replace function public.pay_order(
  p_payment_id uuid,
  p_order_id uuid,
  p_employee_id uuid,
  p_method public.payment_method,
  p_expected_lock_version integer,
  p_received_amount integer
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_store_id uuid := auth.uid();
  v_employee_role public.employee_role;
  v_order public.orders%rowtype;
  v_table_name text;
  v_change_amount integer;
  v_paid_at timestamptz;
  v_lines jsonb := '[]'::jsonb;
  v_receipt jsonb;
begin
  if v_store_id is null then
    raise exception 'AUTH_REQUIRED'
      using errcode = 'P0001',
            hint = 'A store session is required.';
  end if;

  select e.role
  into v_employee_role
  from public.employees e
  where e.store_id = v_store_id
    and e.id = p_employee_id
    and e.is_active = true;

  if not found then
    raise exception 'FORBIDDEN'
      using errcode = 'P0001',
            hint = 'Employee must be active and belong to the current store.';
  end if;

  perform pg_advisory_xact_lock(hashtext(v_store_id::text || ':pos-write'));

  if p_payment_id is null then
    raise exception 'INVALID_PAYMENT_ID'
      using errcode = 'P0001',
            hint = 'Payment must pass a client-generated UUID.';
  end if;

  if p_received_amount < 0 then
    raise exception 'PAYMENT_AMOUNT_TOO_LOW'
      using errcode = 'P0001',
            hint = 'received amount must be non-negative.';
  end if;

  select *
  into v_order
  from public.orders o
  where o.store_id = v_store_id
    and o.id = p_order_id
  for update;

  if not found
    or v_order.status <> 'open'::public.order_status
    or v_order.lock_version <> p_expected_lock_version then
    raise exception 'ORDER_VERSION_CONFLICT'
      using errcode = 'P0001',
            hint = 'Order status or lock_version changed before payment.';
  end if;

  if p_received_amount < v_order.total then
    raise exception 'PAYMENT_AMOUNT_TOO_LOW'
      using errcode = 'P0001',
            hint = 'received amount must be greater than or equal to order total.';
  end if;

  if v_order.table_id is not null then
    select t.name
    into v_table_name
    from public.tables t
    where t.store_id = v_store_id
      and t.id = v_order.table_id
    for update;
  end if;

  v_change_amount := p_received_amount - v_order.total;
  v_paid_at := now();

  insert into public.payments (
    id,
    store_id,
    order_id,
    employee_id,
    method,
    amount,
    received_amount,
    change_amount,
    paid_at
  ) values (
    p_payment_id,
    v_store_id,
    p_order_id,
    p_employee_id,
    p_method,
    v_order.total,
    p_received_amount,
    v_change_amount,
    v_paid_at
  );

  update public.orders o
  set status = 'paid'::public.order_status,
      paid_at = v_paid_at,
      lock_version = o.lock_version + 1
  where o.store_id = v_store_id
    and o.id = p_order_id
  returning * into v_order;

  if v_order.table_id is not null then
    update public.tables t
    set status = 'empty'::public.table_status
    where t.store_id = v_store_id
      and t.id = v_order.table_id;
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'name', oi.item_name,
        'quantity', oi.quantity,
        'unitPrice', oi.unit_price,
        'options', coalesce(
          (
            select jsonb_agg(
              case when oio.quantity > 1 then oio.option_name || ' ×' || oio.quantity else oio.option_name end
              order by oio.created_at
            )
            from public.order_item_options oio
            where oio.store_id = oi.store_id
              and oio.order_item_id = oi.id
          ),
          '[]'::jsonb
        )
      )
      order by oi.sort_order
    ),
    '[]'::jsonb
  )
  into v_lines
  from public.order_items oi
  where oi.store_id = v_store_id
    and oi.order_id = p_order_id
    and oi.status <> 'removed'::public.order_item_status;

  v_receipt := jsonb_build_object(
    'orderNo', v_order.order_no,
    'tableName', v_table_name,
    'orderType', v_order.order_type,
    'lines', v_lines,
    'total', v_order.total,
    'receivedAmount', p_received_amount,
    'changeAmount', v_change_amount,
    'paidAt', v_paid_at::text
  );

  return jsonb_build_object(
    'orderId', p_order_id,
    'paymentId', p_payment_id,
    'status', 'paid',
    'total', v_order.total,
    'receivedAmount', p_received_amount,
    'changeAmount', v_change_amount,
    'lockVersion', v_order.lock_version,
    'receipt', v_receipt
  );
end;
$$;
$permission_fragment_9$;
-- 11: supabase/migrations/011_void_paid_order.sql
 if clock_timestamp()>=least(started_at+interval '50 seconds','2026-10-22T10:00:00.000Z'::timestamptz) then raise exception 'STAGING_EXECUTION_WINDOW_CLOSED'; end if;
 execute $permission_fragment_10$-- 011_void_paid_order.sql
-- Hủy (void) một đơn ĐÃ THANH TOÁN từ màn Lịch sử đơn.
--
-- Void đơn paid GIỮ NGUYÊN total/subtotal/order_no/business_date/paid_at và payment row
-- (audit + để report tính đúng), chỉ đổi status -> 'void', ghi metadata hủy, tăng lock_version;
-- KHÔNG đụng tables.status (đơn paid đã trả bàn từ trước).
--
-- Report tính trực tiếp từ orders.status='paid' theo business_date nên void là doanh thu tự đúng;
-- 'paid_at is not null' phân biệt đơn hủy-sau-thanh-toán (tính vào tổng hợp đơn hủy) với đơn open
-- bị hủy trước thanh toán (paid_at null, total 0, không tính).
--
-- Đợt này cũng thêm seam phân quyền theo hành động: employees.permission_overrides (jsonb, nullable)
-- shape {"grants":[...],"denies":[...]}. Quyền hiệu lực = (default_theo_role ∪ grants) − denies.
-- Đây là guardrail app-layer; RPC check chỉ để phòng thủ/audit (spoof được với session hợp lệ),
-- KHÔNG phải DB-secured.

-- 1a. Cột metadata hủy trên orders --------------------------------------------------------------

alter table public.orders
  add column voided_at timestamptz,
  add column voided_by_employee_id uuid,
  add column void_reason_code text,
  add column void_reason_note text;

alter table public.orders
  add constraint orders_voided_by_employee_fk
    foreign key (store_id, voided_by_employee_id)
    references public.employees (store_id, id);

alter table public.orders
  add constraint orders_void_reason_code_check
    check (void_reason_code is null or void_reason_code in
      ('wrong_order', 'customer_request', 'out_of_stock', 'duplicate', 'other'));

-- 1b. Seam phân quyền theo hành động (null = không override) -------------------------------------

alter table public.employees
  add column permission_overrides jsonb;

-- 1c. verify_employee_pin trả thêm permission_overrides -----------------------------------------
-- Đổi return table -> phải drop trước khi tạo lại (create or replace không đổi được signature).

drop function if exists public.verify_employee_pin(uuid, text);

create function public.verify_employee_pin(
  p_employee_id uuid,
  p_pin text
) returns table (
  id uuid,
  name text,
  role public.employee_role,
  permission_overrides jsonb
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select e.id, e.name, e.role, e.permission_overrides
  from public.employees e
  where e.store_id = auth.uid()
    and e.id = p_employee_id
    and e.is_active = true
    and e.passcode_hash = extensions.crypt(p_pin, e.passcode_hash);

  if not found then
    raise exception 'INVALID_PIN'
      using errcode = 'P0001',
            hint = 'Employee must be active and PIN must match.';
  end if;
end;
$$;

-- 1d. void_order — thay stub reserved bằng bản thật ---------------------------------------------
-- Stub cũ có signature (uuid, uuid); bản mới 5 tham số -> phải drop signature cũ (tránh overload).

drop function if exists public.void_order(uuid, uuid);

create function public.void_order(
  p_order_id uuid,
  p_employee_id uuid,
  p_expected_lock_version integer,
  p_reason_code text,
  p_reason_note text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_store_id uuid := auth.uid();
  v_role public.employee_role;
  v_overrides jsonb;
  v_order public.orders%rowtype;
  v_lock_version integer;
  v_voided_at timestamptz;
begin
  if v_store_id is null then
    raise exception 'AUTH_REQUIRED'
      using errcode = 'P0001',
            hint = 'A store session is required.';
  end if;

  select e.role, coalesce(e.permission_overrides, '{}'::jsonb)
  into v_role, v_overrides
  from public.employees e
  where e.store_id = v_store_id
    and e.id = p_employee_id
    and e.is_active = true;

  if not found then
    raise exception 'FORBIDDEN'
      using errcode = 'P0001',
            hint = 'Employee must be active and belong to the current store.';
  end if;

  -- Quyền hiệu lực = (default_theo_role ∪ grants) − denies. denies luôn thắng.
  if jsonb_exists(coalesce(v_overrides->'denies', '[]'::jsonb), 'order.voidPaid')
     or not (
       v_role = 'admin'::public.employee_role
       or jsonb_exists(coalesce(v_overrides->'grants', '[]'::jsonb), 'order.voidPaid')
     )
  then
    raise exception 'FORBIDDEN'
      using errcode = 'P0001',
            hint = 'Employee lacks order.voidPaid permission.';
  end if;

  if p_reason_code is null or p_reason_code not in
    ('wrong_order', 'customer_request', 'out_of_stock', 'duplicate', 'other')
  then
    raise exception 'VOID_REASON_REQUIRED'
      using errcode = 'P0001',
            hint = 'A valid void reason code is required.';
  end if;

  if p_reason_code = 'other' and coalesce(btrim(p_reason_note), '') = '' then
    raise exception 'VOID_REASON_REQUIRED'
      using errcode = 'P0001',
            hint = 'A note is required when reason code is other.';
  end if;

  select *
  into v_order
  from public.orders o
  where o.store_id = v_store_id
    and o.id = p_order_id
  for update;

  if not found then
    raise exception 'NOT_FOUND'
      using errcode = 'P0001',
            hint = 'Order not found in the current store.';
  end if;

  if v_order.status <> 'paid'::public.order_status
    or v_order.lock_version <> p_expected_lock_version then
    raise exception 'ORDER_VERSION_CONFLICT'
      using errcode = 'P0001',
            hint = 'Only a paid order at the expected lock_version can be voided.';
  end if;

  update public.orders o
  set status = 'void'::public.order_status,
      voided_at = now(),
      voided_by_employee_id = p_employee_id,
      void_reason_code = p_reason_code,
      void_reason_note = nullif(btrim(coalesce(p_reason_note, '')), ''),
      lock_version = o.lock_version + 1
  where o.store_id = v_store_id
    and o.id = p_order_id
  returning o.lock_version, o.voided_at into v_lock_version, v_voided_at;

  return jsonb_build_object(
    'orderId', p_order_id,
    'status', 'void',
    'lockVersion', v_lock_version,
    'voidedAt', v_voided_at::text
  );
end;
$$;
$permission_fragment_10$;
-- 12: supabase/migrations/012_action_permission_guardrails.sql
 if clock_timestamp()>=least(started_at+interval '50 seconds','2026-10-22T10:00:00.000Z'::timestamptz) then raise exception 'STAGING_EXECUTION_WINDOW_CLOSED'; end if;
 execute $permission_fragment_11$-- 012_action_permission_guardrails.sql
-- Guardrail quyền hành động tại RPC; không đổi schema hoặc chữ ký RPC.
-- Quyền app-layer vẫn là chốt chính. Các check ở đây đọc permission_overrides live để phòng thủ.

-- Source of truth cho default role -> permission là src/core/guards.ts.
-- Giữ helper SQL này đồng bộ với map TypeScript và E2E deny-permission.
create or replace function public.has_employee_permission(
  p_role public.employee_role,
  p_overrides jsonb,
  p_permission text
) returns boolean
language sql
immutable
as $$
  select case
    when jsonb_exists(coalesce(p_overrides->'denies', '[]'::jsonb), p_permission) then false
    when jsonb_exists(coalesce(p_overrides->'grants', '[]'::jsonb), p_permission) then true
    when p_role = 'admin'::public.employee_role
      then p_permission in (
        'order.create',
        'order.update',
        'order.voidOpen',
        'payment.take',
        'order.voidPaid'
      )
    when p_role = 'cashier'::public.employee_role
      then p_permission in (
        'order.create',
        'order.update',
        'order.voidOpen',
        'payment.take'
      )
    else false
  end
$$;

create or replace function public.pay_order_items(
  p_payment_id uuid,
  p_order_id uuid,
  p_new_order_id uuid,
  p_employee_id uuid,
  p_method public.payment_method,
  p_expected_lock_version integer,
  p_received_amount integer,
  p_items jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_store_id uuid := auth.uid();
  v_employee_role public.employee_role;
  v_overrides jsonb;
  v_source public.orders%rowtype;
  v_order_item public.order_items%rowtype;
  v_line record;
  v_table_name text;
  v_unit_total integer;
  v_amount integer := 0;
  v_change_amount integer;
  v_paid_at timestamptz;
  v_split_order_no integer;
  v_source_new_no integer;
  v_source_total integer := 0;
  v_source_lock_version integer;
  v_lines jsonb := '[]'::jsonb;
  v_receipt jsonb;
begin
  if v_store_id is null then
    raise exception 'AUTH_REQUIRED'
      using errcode = 'P0001',
            hint = 'A store session is required.';
  end if;

  select e.role, coalesce(e.permission_overrides, '{}'::jsonb)
  into v_employee_role, v_overrides
  from public.employees e
  where e.store_id = v_store_id
    and e.id = p_employee_id
    and e.is_active = true;

  if not found then
    raise exception 'FORBIDDEN'
      using errcode = 'P0001',
            hint = 'Employee must be active and belong to the current store.';
  end if;

  if not public.has_employee_permission(
    v_employee_role,
    v_overrides,
    'payment.take'
  ) then
    raise exception 'FORBIDDEN'
      using errcode = 'P0001',
            hint = 'Employee lacks payment.take permission.';
  end if;

  perform pg_advisory_xact_lock(hashtext(v_store_id::text || ':pos-write'));

  if p_payment_id is null then
    raise exception 'INVALID_PAYMENT_ID'
      using errcode = 'P0001',
            hint = 'Payment must pass a client-generated UUID.';
  end if;

  if p_new_order_id is null then
    raise exception 'INVALID_ORDER_ID'
      using errcode = 'P0001',
            hint = 'Split payments must pass a client-generated p_new_order_id UUID.';
  end if;

  if p_received_amount < 0 then
    raise exception 'PAYMENT_AMOUNT_TOO_LOW'
      using errcode = 'P0001',
            hint = 'received amount must be non-negative.';
  end if;

  if p_items is null
    or jsonb_typeof(p_items) <> 'array'
    or jsonb_array_length(p_items) = 0 then
    raise exception 'INVALID_ORDER_ITEMS'
      using errcode = 'P0001',
            hint = 'p_items must be a non-empty jsonb array.';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_items) as line("orderItemId" uuid)
    group by line."orderItemId"
    having count(*) > 1
  ) then
    raise exception 'INVALID_ORDER_ITEMS'
      using errcode = 'P0001',
            hint = 'Duplicate order item in payment selection.';
  end if;

  select *
  into v_source
  from public.orders o
  where o.store_id = v_store_id
    and o.id = p_order_id
  for update;

  if not found
    or v_source.status <> 'open'::public.order_status
    or v_source.lock_version <> p_expected_lock_version then
    raise exception 'ORDER_VERSION_CONFLICT'
      using errcode = 'P0001',
            hint = 'Order status or lock_version changed before payment.';
  end if;

  if v_source.table_id is not null then
    select t.name
    into v_table_name
    from public.tables t
    where t.store_id = v_store_id
      and t.id = v_source.table_id
    for update;
  end if;

  -- Lượt 1: khoá dòng, validate và tính tiền phía server (DB là nguồn giá).
  for v_line in
    select *
    from jsonb_to_recordset(p_items) as line(
      "orderItemId" uuid,
      quantity integer,
      "splitItemId" uuid
    )
  loop
    if v_line."orderItemId" is null or coalesce(v_line.quantity, 0) < 1 then
      raise exception 'INVALID_ORDER_ITEMS'
        using errcode = 'P0001',
              hint = 'Each line must include orderItemId and a positive quantity.';
    end if;

    select *
    into v_order_item
    from public.order_items oi
    where oi.store_id = v_store_id
      and oi.order_id = p_order_id
      and oi.id = v_line."orderItemId"
      and oi.status <> 'removed'::public.order_item_status
    for update;

    if not found then
      raise exception 'INVALID_ORDER_ITEMS'
        using errcode = 'P0001',
              hint = 'Order item is missing or removed.';
    end if;

    if v_line.quantity > v_order_item.quantity then
      raise exception 'INVALID_ORDER_ITEMS'
        using errcode = 'P0001',
              hint = 'Line quantity exceeds the order line quantity.';
    end if;

    if v_line.quantity < v_order_item.quantity and v_line."splitItemId" is null then
      raise exception 'INVALID_ORDER_ITEMS'
        using errcode = 'P0001',
              hint = 'Partial-quantity lines must pass a client-generated splitItemId.';
    end if;

    select v_order_item.unit_price + coalesce(sum(oio.price_delta * oio.quantity), 0)
    into v_unit_total
    from public.order_item_options oio
    where oio.store_id = v_store_id
      and oio.order_item_id = v_order_item.id;

    v_amount := v_amount + (v_unit_total * v_line.quantity);
  end loop;

  -- Chọn đủ 100% đơn thì client phải dùng pay_order (đơn gốc đóng, không tách).
  if not exists (
    select 1
    from public.order_items oi
    left join jsonb_to_recordset(p_items) as line("orderItemId" uuid, quantity integer)
      on line."orderItemId" = oi.id
    where oi.store_id = v_store_id
      and oi.order_id = p_order_id
      and oi.status <> 'removed'::public.order_item_status
      and coalesce(line.quantity, 0) < oi.quantity
  ) then
    raise exception 'INVALID_ORDER_ITEMS'
      using errcode = 'P0001',
            hint = 'Full selection must go through pay_order.';
  end if;

  if p_received_amount < v_amount then
    raise exception 'PAYMENT_AMOUNT_TOO_LOW'
      using errcode = 'P0001',
            hint = 'received amount must be greater than or equal to the selected amount.';
  end if;

  v_change_amount := p_received_amount - v_amount;
  v_paid_at := now();

  -- Đánh số: bill (đơn tách) kế thừa số của đơn gốc; đơn gốc nhận số mới.
  v_split_order_no := v_source.order_no;
  perform pg_advisory_xact_lock(hashtext(v_store_id::text || ':' || v_source.business_date::text));
  select coalesce(max(o.order_no), 0) + 1
  into v_source_new_no
  from public.orders o
  where o.store_id = v_store_id
    and o.business_date = v_source.business_date;

  -- Đổi số đơn gốc TRƯỚC để nhả số cũ cho đơn tách (unique store/business_date/order_no).
  update public.orders o
  set order_no = v_source_new_no
  where o.store_id = v_store_id
    and o.id = p_order_id;

  insert into public.orders (
    id,
    store_id,
    table_id,
    order_type,
    order_no,
    business_date,
    status,
    subtotal,
    discount_type,
    discount_value,
    total,
    employee_id,
    paid_at,
    lock_version
  ) values (
    p_new_order_id,
    v_store_id,
    v_source.table_id,
    v_source.order_type,
    v_split_order_no,
    v_source.business_date,
    'paid'::public.order_status,
    v_amount,
    'none'::public.discount_type,
    0,
    v_amount,
    p_employee_id,
    v_paid_at,
    0
  );

  -- Lượt 2: move nguyên dòng sang đơn tách, hoặc tách dòng khi trả một phần số lượng.
  for v_line in
    select *
    from jsonb_to_recordset(p_items) as line(
      "orderItemId" uuid,
      quantity integer,
      "splitItemId" uuid
    )
  loop
    select *
    into v_order_item
    from public.order_items oi
    where oi.store_id = v_store_id
      and oi.id = v_line."orderItemId";

    if v_line.quantity = v_order_item.quantity then
      update public.order_items oi
      set order_id = p_new_order_id
      where oi.store_id = v_store_id
        and oi.id = v_order_item.id;
    else
      update public.order_items oi
      set quantity = oi.quantity - v_line.quantity
      where oi.store_id = v_store_id
        and oi.id = v_order_item.id;

      insert into public.order_items (
        id,
        store_id,
        order_id,
        menu_item_id,
        item_name,
        quantity,
        unit_price,
        note,
        status,
        sort_order
      ) values (
        v_line."splitItemId",
        v_store_id,
        p_new_order_id,
        v_order_item.menu_item_id,
        v_order_item.item_name,
        v_line.quantity,
        v_order_item.unit_price,
        v_order_item.note,
        v_order_item.status,
        v_order_item.sort_order
      );

      -- Snapshot option của dòng tách (id server cấp: dòng snapshot, client không sửa).
      insert into public.order_item_options (
        id,
        store_id,
        order_item_id,
        option_value_id,
        option_name,
        price_delta,
        quantity
      )
      select
        gen_random_uuid(),
        oio.store_id,
        v_line."splitItemId",
        oio.option_value_id,
        oio.option_name,
        oio.price_delta,
        oio.quantity
      from public.order_item_options oio
      where oio.store_id = v_store_id
        and oio.order_item_id = v_order_item.id;
    end if;
  end loop;

  insert into public.payments (
    id,
    store_id,
    order_id,
    employee_id,
    method,
    amount,
    received_amount,
    change_amount,
    paid_at
  ) values (
    p_payment_id,
    v_store_id,
    p_new_order_id,
    p_employee_id,
    p_method,
    v_amount,
    p_received_amount,
    v_change_amount,
    v_paid_at
  );

  -- Đơn gốc: tính lại tổng phần còn lại, bump lock_version. Bàn vẫn occupied.
  select coalesce(sum((oi.unit_price + coalesce(opt.option_total, 0)) * oi.quantity), 0)
  into v_source_total
  from public.order_items oi
  left join lateral (
    select sum(oio.price_delta * oio.quantity) as option_total
    from public.order_item_options oio
    where oio.store_id = oi.store_id
      and oio.order_item_id = oi.id
  ) opt on true
  where oi.store_id = v_store_id
    and oi.order_id = p_order_id
    and oi.status <> 'removed'::public.order_item_status;

  update public.orders o
  set subtotal = v_source_total,
      total = v_source_total,
      lock_version = o.lock_version + 1
  where o.store_id = v_store_id
    and o.id = p_order_id
  returning o.lock_version into v_source_lock_version;

  -- Bill của đơn tách.
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'name', oi.item_name,
        'quantity', oi.quantity,
        'unitPrice', oi.unit_price,
        'options', coalesce(
          (
            select jsonb_agg(
              case when oio.quantity > 1 then oio.option_name || ' ×' || oio.quantity else oio.option_name end
              order by oio.created_at
            )
            from public.order_item_options oio
            where oio.store_id = oi.store_id
              and oio.order_item_id = oi.id
          ),
          '[]'::jsonb
        )
      )
      order by oi.sort_order
    ),
    '[]'::jsonb
  )
  into v_lines
  from public.order_items oi
  where oi.store_id = v_store_id
    and oi.order_id = p_new_order_id;

  v_receipt := jsonb_build_object(
    'orderNo', v_split_order_no,
    'tableName', v_table_name,
    'orderType', v_source.order_type,
    'lines', v_lines,
    'total', v_amount,
    'receivedAmount', p_received_amount,
    'changeAmount', v_change_amount,
    'paidAt', v_paid_at::text
  );

  return jsonb_build_object(
    'orderId', p_new_order_id,
    'orderNo', v_split_order_no,
    'paymentId', p_payment_id,
    'status', 'paid',
    'total', v_amount,
    'receivedAmount', p_received_amount,
    'changeAmount', v_change_amount,
    'receipt', v_receipt,
    'sourceOrderId', p_order_id,
    'sourceOrderNo', v_source_new_no,
    'sourceTotal', v_source_total,
    'sourceLockVersion', v_source_lock_version
  );
end;
$$;

create or replace function public.submit_order_changes(
  p_order_id uuid,
  p_table_id uuid,
  p_order_type public.order_type,
  p_employee_id uuid,
  p_expected_lock_version integer,
  p_items jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_store_id uuid := auth.uid();
  v_employee_role public.employee_role;
  v_overrides jsonb;
  v_existing_order public.orders%rowtype;
  v_has_existing_order boolean := false;
  v_table public.tables%rowtype;
  v_table_name text;
  v_timezone text;
  v_business_date date;
  v_order_no integer;
  v_order_type public.order_type;
  v_lock_version integer := 0;
  v_active_count integer := 0;
  v_subtotal integer := 0;
  v_total integer := 0;
  v_sort_order integer := 0;
  v_item record;
  v_option record;
  v_menu_item public.menu_items%rowtype;
  v_option_value record;
  v_option_total integer;
  v_option_qty integer;
  v_lines jsonb := '[]'::jsonb;
  v_ticket jsonb;
begin
  if v_store_id is null then
    raise exception 'AUTH_REQUIRED'
      using errcode = 'P0001',
            hint = 'A store session is required.';
  end if;

  select e.role, coalesce(e.permission_overrides, '{}'::jsonb)
  into v_employee_role, v_overrides
  from public.employees e
  where e.store_id = v_store_id
    and e.id = p_employee_id
    and e.is_active = true;

  if not found then
    raise exception 'FORBIDDEN'
      using errcode = 'P0001',
            hint = 'Employee must be active and belong to the current store.';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'INVALID_ORDER_ITEMS'
      using errcode = 'P0001',
            hint = 'p_items must be a jsonb array.';
  end if;

  perform pg_advisory_xact_lock(hashtext(v_store_id::text || ':pos-write'));

  if p_order_type = 'takeaway'::public.order_type then
    p_table_id := null;
  end if;

  select count(*)
  into v_active_count
  from jsonb_to_recordset(p_items) as item(
    id uuid,
    "menuItemId" uuid,
    quantity integer,
    note text,
    options jsonb
  )
  where coalesce(item.quantity, 0) > 0;

  if exists (
    select 1
    from jsonb_to_recordset(p_items) as item(
      id uuid,
      "menuItemId" uuid,
      quantity integer,
      note text,
      options jsonb
    )
    where coalesce(item.quantity, 0) < 0
  ) then
    raise exception 'INVALID_ORDER_ITEMS'
      using errcode = 'P0001',
            hint = 'Item quantity must be non-negative.';
  end if;

  if p_order_id is null then
    if v_active_count = 0 then
      return jsonb_build_object(
        'orderId', null,
        'status', 'void',
        'tableId', p_table_id,
        'tableStatus', null,
        'orderNo', 0,
        'businessDate', null,
        'lockVersion', 0,
        'ticket', null
      );
    end if;

    raise exception 'INVALID_ORDER_ID'
      using errcode = 'P0001',
            hint = 'New orders must pass a client-generated p_order_id UUID.';
  end if;

  if p_table_id is not null then
    select *
    into v_table
    from public.tables t
    where t.store_id = v_store_id
      and t.id = p_table_id
      and t.deleted_at is null
    for update;

    if not found then
      raise exception 'TABLE_NOT_FOUND'
        using errcode = 'P0001',
              hint = 'Table must exist, be active, and belong to the current store.';
    end if;

    v_table_name := v_table.name;
  end if;

  select *
  into v_existing_order
  from public.orders o
  where o.store_id = v_store_id
    and o.id = p_order_id
  for update;

  v_has_existing_order := found;

  if not v_has_existing_order then
    if not public.has_employee_permission(
      v_employee_role,
      v_overrides,
      'order.create'
    ) then
      raise exception 'FORBIDDEN'
        using errcode = 'P0001',
              hint = 'Employee lacks order.create permission.';
    end if;
  elsif v_active_count > 0 then
    if not public.has_employee_permission(
      v_employee_role,
      v_overrides,
      'order.update'
    ) then
      raise exception 'FORBIDDEN'
        using errcode = 'P0001',
              hint = 'Employee lacks order.update permission.';
    end if;
  else
    if not public.has_employee_permission(
      v_employee_role,
      v_overrides,
      'order.voidOpen'
    ) then
      raise exception 'FORBIDDEN'
        using errcode = 'P0001',
              hint = 'Employee lacks order.voidOpen permission.';
    end if;
  end if;

  if v_has_existing_order then
    v_order_type := v_existing_order.order_type;

    if v_existing_order.status <> 'open'::public.order_status
      or v_existing_order.lock_version <> p_expected_lock_version then
      raise exception 'ORDER_VERSION_CONFLICT'
        using errcode = 'P0001',
              hint = 'Order status or lock_version changed before submit.';
    end if;

    if v_existing_order.table_id is not null and p_table_id is distinct from v_existing_order.table_id then
      p_table_id := v_existing_order.table_id;
      select *
      into v_table
      from public.tables t
      where t.store_id = v_store_id
        and t.id = p_table_id
      for update;
      v_table_name := v_table.name;
    end if;

    if exists (
      select 1
      from jsonb_to_recordset(p_items) as item(
        id uuid,
        "menuItemId" uuid,
        quantity integer,
        note text,
        options jsonb
      )
      join public.order_items oi
        on oi.store_id = v_store_id
       and oi.order_id = p_order_id
       and oi.id = item.id
      where coalesce(item.quantity, 0) > 0
    ) then
      raise exception 'INVALID_ORDER_ITEMS'
        using errcode = 'P0001',
              hint = 'Replace-submit must use fresh client UUIDs for active order_items.';
    end if;

    update public.order_items oi
    set status = 'removed'::public.order_item_status
    where oi.store_id = v_store_id
      and oi.order_id = p_order_id
      and oi.status <> 'removed'::public.order_item_status;

    if v_active_count = 0 then
      update public.orders o
      set status = 'void'::public.order_status,
          subtotal = 0,
          discount_type = 'none'::public.discount_type,
          discount_value = 0,
          total = 0,
          lock_version = o.lock_version + 1
      where o.store_id = v_store_id
        and o.id = p_order_id
      returning o.lock_version into v_lock_version;

      if p_table_id is not null then
        update public.tables t
        set status = 'empty'::public.table_status
        where t.store_id = v_store_id
          and t.id = p_table_id;
      end if;

      return jsonb_build_object(
        'orderId', p_order_id,
        'status', 'void',
        'tableId', p_table_id,
        'tableStatus', case when p_table_id is null then null else 'empty' end,
        'orderNo', v_existing_order.order_no,
        'businessDate', v_existing_order.business_date::text,
        'lockVersion', v_lock_version,
        'ticket', null
      );
    end if;
  else
    v_order_type := p_order_type;

    if p_expected_lock_version is not null then
      raise exception 'ORDER_VERSION_CONFLICT'
        using errcode = 'P0001',
              hint = 'New orders must not pass an expected lock_version.';
    end if;

    if v_active_count = 0 then
      return jsonb_build_object(
        'orderId', null,
        'status', 'void',
        'tableId', p_table_id,
        'tableStatus', null,
        'orderNo', 0,
        'businessDate', null,
        'lockVersion', 0,
        'ticket', null
      );
    end if;

    if p_table_id is not null and exists (
      select 1
      from public.orders o
      where o.store_id = v_store_id
        and o.table_id = p_table_id
        and o.status = 'open'::public.order_status
    ) then
      raise exception 'ORDER_VERSION_CONFLICT'
        using errcode = 'P0001',
              hint = 'Table already has an open order.';
    end if;

    if v_order_type is null then
      raise exception 'INVALID_ORDER_ITEMS'
        using errcode = 'P0001',
              hint = 'New orders must include order_type.';
    end if;

    select coalesce(ss.timezone, 'Asia/Saigon')
    into v_timezone
    from public.store_settings ss
    where ss.store_id = v_store_id;

    v_timezone := coalesce(v_timezone, 'Asia/Saigon');
    v_business_date := (now() at time zone v_timezone)::date;

    perform pg_advisory_xact_lock(hashtext(v_store_id::text || ':' || v_business_date::text));

    select coalesce(max(o.order_no), 0) + 1
    into v_order_no
    from public.orders o
    where o.store_id = v_store_id
      and o.business_date = v_business_date;

    insert into public.orders (
      id,
      store_id,
      table_id,
      order_type,
      order_no,
      business_date,
      status,
      subtotal,
      discount_type,
      discount_value,
      total,
      employee_id,
      lock_version
    ) values (
      p_order_id,
      v_store_id,
      p_table_id,
      v_order_type,
      v_order_no,
      v_business_date,
      'open'::public.order_status,
      0,
      'none'::public.discount_type,
      0,
      0,
      p_employee_id,
      0
    );
  end if;

  for v_item in
    select *
    from jsonb_to_recordset(p_items) as item(
      id uuid,
      "menuItemId" uuid,
      quantity integer,
      note text,
      options jsonb
    )
    where coalesce(item.quantity, 0) > 0
  loop
    if v_item.id is null or v_item."menuItemId" is null then
      raise exception 'INVALID_ORDER_ITEMS'
        using errcode = 'P0001',
              hint = 'Active items must include id and menuItemId.';
    end if;

    select *
    into v_menu_item
    from public.menu_items mi
    where mi.store_id = v_store_id
      and mi.id = v_item."menuItemId"
      and mi.deleted_at is null
      and mi.is_available = true;

    if not found then
      raise exception 'MENU_ITEM_UNAVAILABLE'
        using errcode = 'P0001',
              hint = 'Menu item is missing, deleted, unavailable, or outside the current store.';
    end if;

    v_sort_order := v_sort_order + 1;
    v_option_total := 0;

    insert into public.order_items (
      id,
      store_id,
      order_id,
      menu_item_id,
      item_name,
      quantity,
      unit_price,
      note,
      status,
      sort_order
    ) values (
      v_item.id,
      v_store_id,
      p_order_id,
      v_menu_item.id,
      v_menu_item.name,
      v_item.quantity,
      v_menu_item.price,
      nullif(v_item.note, ''),
      'waiting'::public.order_item_status,
      v_sort_order
    );

    for v_option in
      select *
      from jsonb_to_recordset(
        case
          when jsonb_typeof(v_item.options) = 'array' then v_item.options
          else '[]'::jsonb
        end
      ) as opt(
        id uuid,
        "optionValueId" uuid,
        quantity integer
      )
    loop
      if v_option.id is null or v_option."optionValueId" is null then
        raise exception 'INVALID_ORDER_ITEMS'
          using errcode = 'P0001',
                hint = 'Options must include id and optionValueId.';
      end if;

      -- Tuỳ chọn hợp lệ khi nhóm của nó được liên kết với đúng món qua menu_item_option_groups.
      select ov.id, ov.name, ov.price_delta
      into v_option_value
      from public.option_values ov
      join public.option_groups og
        on og.store_id = ov.store_id
       and og.id = ov.option_group_id
      join public.menu_item_option_groups miog
        on miog.store_id = og.store_id
       and miog.option_group_id = og.id
      where ov.store_id = v_store_id
        and ov.id = v_option."optionValueId"
        and ov.deleted_at is null
        and og.deleted_at is null
        and miog.deleted_at is null
        and miog.menu_item_id = v_menu_item.id;

      if not found then
        raise exception 'OPTION_VALUE_UNAVAILABLE'
          using errcode = 'P0001',
                hint = 'Option value is missing, deleted, or not attached to the submitted menu item.';
      end if;

      v_option_qty := greatest(coalesce(v_option.quantity, 1), 1);

      insert into public.order_item_options (
        id,
        store_id,
        order_item_id,
        option_value_id,
        option_name,
        price_delta,
        quantity
      ) values (
        v_option.id,
        v_store_id,
        v_item.id,
        v_option_value.id,
        v_option_value.name,
        v_option_value.price_delta,
        v_option_qty
      );

      v_option_total := v_option_total + (v_option_value.price_delta * v_option_qty);
    end loop;

    v_subtotal := v_subtotal + ((v_menu_item.price + v_option_total) * v_item.quantity);
  end loop;

  v_total := v_subtotal;

  update public.orders o
  set subtotal = v_subtotal,
      discount_type = 'none'::public.discount_type,
      discount_value = 0,
      total = v_total,
      employee_id = p_employee_id,
      lock_version = case when v_has_existing_order then o.lock_version + 1 else o.lock_version end
  where o.store_id = v_store_id
    and o.id = p_order_id
  returning o.order_no, o.business_date, o.lock_version
  into v_order_no, v_business_date, v_lock_version;

  if p_table_id is not null then
    update public.tables t
    set status = 'occupied'::public.table_status
    where t.store_id = v_store_id
      and t.id = p_table_id;
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'name', oi.item_name,
        'quantity', oi.quantity,
        'unitPrice', oi.unit_price,
        'options', coalesce(
          (
            select jsonb_agg(
              case when oio.quantity > 1 then oio.option_name || ' ×' || oio.quantity else oio.option_name end
              order by oio.created_at
            )
            from public.order_item_options oio
            where oio.store_id = oi.store_id
              and oio.order_item_id = oi.id
          ),
          '[]'::jsonb
        )
      )
      order by oi.sort_order
    ),
    '[]'::jsonb
  )
  into v_lines
  from public.order_items oi
  where oi.store_id = v_store_id
    and oi.order_id = p_order_id
    and oi.status <> 'removed'::public.order_item_status;

  v_ticket := jsonb_build_object(
    'orderNo', v_order_no,
    'tableName', v_table_name,
    'orderType', v_order_type,
    'lines', v_lines,
    'total', v_total
  );

  return jsonb_build_object(
    'orderId', p_order_id,
    'status', 'open',
    'tableId', p_table_id,
    'tableStatus', case when p_table_id is null then null else 'occupied' end,
    'orderNo', v_order_no,
    'businessDate', v_business_date::text,
    'lockVersion', v_lock_version,
    'ticket', v_ticket
  );
end;
$$;

create or replace function public.pay_order(
  p_payment_id uuid,
  p_order_id uuid,
  p_employee_id uuid,
  p_method public.payment_method,
  p_expected_lock_version integer,
  p_received_amount integer
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_store_id uuid := auth.uid();
  v_employee_role public.employee_role;
  v_overrides jsonb;
  v_order public.orders%rowtype;
  v_table_name text;
  v_change_amount integer;
  v_paid_at timestamptz;
  v_lines jsonb := '[]'::jsonb;
  v_receipt jsonb;
begin
  if v_store_id is null then
    raise exception 'AUTH_REQUIRED'
      using errcode = 'P0001',
            hint = 'A store session is required.';
  end if;

  select e.role, coalesce(e.permission_overrides, '{}'::jsonb)
  into v_employee_role, v_overrides
  from public.employees e
  where e.store_id = v_store_id
    and e.id = p_employee_id
    and e.is_active = true;

  if not found then
    raise exception 'FORBIDDEN'
      using errcode = 'P0001',
            hint = 'Employee must be active and belong to the current store.';
  end if;

  if not public.has_employee_permission(
    v_employee_role,
    v_overrides,
    'payment.take'
  ) then
    raise exception 'FORBIDDEN'
      using errcode = 'P0001',
            hint = 'Employee lacks payment.take permission.';
  end if;

  perform pg_advisory_xact_lock(hashtext(v_store_id::text || ':pos-write'));

  if p_payment_id is null then
    raise exception 'INVALID_PAYMENT_ID'
      using errcode = 'P0001',
            hint = 'Payment must pass a client-generated UUID.';
  end if;

  if p_received_amount < 0 then
    raise exception 'PAYMENT_AMOUNT_TOO_LOW'
      using errcode = 'P0001',
            hint = 'received amount must be non-negative.';
  end if;

  select *
  into v_order
  from public.orders o
  where o.store_id = v_store_id
    and o.id = p_order_id
  for update;

  if not found
    or v_order.status <> 'open'::public.order_status
    or v_order.lock_version <> p_expected_lock_version then
    raise exception 'ORDER_VERSION_CONFLICT'
      using errcode = 'P0001',
            hint = 'Order status or lock_version changed before payment.';
  end if;

  if p_received_amount < v_order.total then
    raise exception 'PAYMENT_AMOUNT_TOO_LOW'
      using errcode = 'P0001',
            hint = 'received amount must be greater than or equal to order total.';
  end if;

  if v_order.table_id is not null then
    select t.name
    into v_table_name
    from public.tables t
    where t.store_id = v_store_id
      and t.id = v_order.table_id
    for update;
  end if;

  v_change_amount := p_received_amount - v_order.total;
  v_paid_at := now();

  insert into public.payments (
    id,
    store_id,
    order_id,
    employee_id,
    method,
    amount,
    received_amount,
    change_amount,
    paid_at
  ) values (
    p_payment_id,
    v_store_id,
    p_order_id,
    p_employee_id,
    p_method,
    v_order.total,
    p_received_amount,
    v_change_amount,
    v_paid_at
  );

  update public.orders o
  set status = 'paid'::public.order_status,
      paid_at = v_paid_at,
      lock_version = o.lock_version + 1
  where o.store_id = v_store_id
    and o.id = p_order_id
  returning * into v_order;

  if v_order.table_id is not null then
    update public.tables t
    set status = 'empty'::public.table_status
    where t.store_id = v_store_id
      and t.id = v_order.table_id;
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'name', oi.item_name,
        'quantity', oi.quantity,
        'unitPrice', oi.unit_price,
        'options', coalesce(
          (
            select jsonb_agg(
              case when oio.quantity > 1 then oio.option_name || ' ×' || oio.quantity else oio.option_name end
              order by oio.created_at
            )
            from public.order_item_options oio
            where oio.store_id = oi.store_id
              and oio.order_item_id = oi.id
          ),
          '[]'::jsonb
        )
      )
      order by oi.sort_order
    ),
    '[]'::jsonb
  )
  into v_lines
  from public.order_items oi
  where oi.store_id = v_store_id
    and oi.order_id = p_order_id
    and oi.status <> 'removed'::public.order_item_status;

  v_receipt := jsonb_build_object(
    'orderNo', v_order.order_no,
    'tableName', v_table_name,
    'orderType', v_order.order_type,
    'lines', v_lines,
    'total', v_order.total,
    'receivedAmount', p_received_amount,
    'changeAmount', v_change_amount,
    'paidAt', v_paid_at::text
  );

  return jsonb_build_object(
    'orderId', p_order_id,
    'paymentId', p_payment_id,
    'status', 'paid',
    'total', v_order.total,
    'receivedAmount', p_received_amount,
    'changeAmount', v_change_amount,
    'lockVersion', v_order.lock_version,
    'receipt', v_receipt
  );
end;
$$;
$permission_fragment_11$;
-- 13: supabase/migrations/013_table_background_asset_key.sql
 if clock_timestamp()>=least(started_at+interval '50 seconds','2026-10-22T10:00:00.000Z'::timestamptz) then raise exception 'STAGING_EXECUTION_WINDOW_CLOSED'; end if;
 execute $permission_fragment_12$alter table public.tables
add column if not exists background_asset_key text;
$permission_fragment_12$;
-- 14: supabase/migrations/014_write_identity_and_ledger.sql
 if clock_timestamp()>=least(started_at+interval '50 seconds','2026-10-22T10:00:00.000Z'::timestamptz) then raise exception 'STAGING_EXECUTION_WINDOW_CLOSED'; end if;
 execute $permission_fragment_13$-- Protocol v1 foundation. Activation/grants are completed atomically by 016.
-- Never rewrite historical prices or infer a legacy creator from employee_id.


create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
alter default privileges in schema private revoke execute on functions from public;

create function private.write_clock() returns timestamptz
language sql volatile set search_path = pg_catalog as $$ select clock_timestamp() $$;

create function private.write_error(p_code text, p_details jsonb default null) returns jsonb
language sql immutable set search_path = pg_catalog as $$
select jsonb_build_object('code', p_code, 'message', case p_code
 when 'AUTH_REQUIRED' then 'Chưa ghép cửa hàng. Vui lòng đăng nhập lại.'
 when 'EMPLOYEE_SESSION_REQUIRED' then 'Phiên nhân viên đã hết hiệu lực. Vui lòng nhập lại PIN.'
 when 'INVALID_PIN' then 'PIN không đúng hoặc nhân viên không còn hoạt động.'
 when 'FORBIDDEN' then 'Bạn không có quyền thực hiện thao tác này.'
 when 'INVALID_WRITE_REQUEST' then 'Dữ liệu thao tác không hợp lệ. Vui lòng tải lại và kiểm tra.'
 when 'IDEMPOTENCY_KEY_REUSED' then 'Mã thao tác đã gắn với nội dung khác. Hãy mở lại thao tác đã lưu.'
 when 'OPERATION_NOT_FOUND' then 'Server chưa tìm thấy thao tác này. Chưa thể xác nhận đã thực hiện hay đã hủy.'
 when 'OPERATION_EXPIRED' then 'Lệnh đã hết hạn thực hiện. Đơn vẫn được giữ; hãy kiểm tra và xác nhận một thao tác mới.'
 when 'OPERATION_CANCELLED' then 'Lệnh đã được hủy trước khi thực hiện.'
 when 'ORDER_VERSION_CONFLICT' then 'Đơn đã thay đổi. Hãy tải lại, kiểm tra rồi xác nhận một thao tác mới.'
 when 'TABLE_OCCUPIED' then 'Bàn đã có đơn mở. Hãy mở đơn hiện tại của bàn.'
 when 'NOT_FOUND' then 'Không tìm thấy đơn trong cửa hàng này.'
 when 'TABLE_NOT_FOUND' then 'Bàn không còn khả dụng. Vui lòng chọn lại bàn.'
 when 'ENTITY_ID_CONFLICT' then 'Mã dữ liệu đã được sử dụng. Hãy tải lại trước khi tạo thao tác mới.'
 when 'MENU_ITEM_UNAVAILABLE' then 'Món không còn khả dụng. Vui lòng chọn lại.'
 when 'OPTION_VALUE_UNAVAILABLE' then 'Tùy chọn không còn phù hợp với món. Vui lòng chọn lại.'
 when 'INVALID_ORDER_ITEMS' then 'Các món được chọn không hợp lệ. Vui lòng kiểm tra lại đơn.'
 when 'PAYMENT_AMOUNT_TOO_LOW' then 'Tiền nhận chưa đủ để thanh toán phần đã chọn.'
 when 'VOID_REASON_REQUIRED' then 'Vui lòng chọn lý do hủy và nhập ghi chú nếu chọn lý do khác.'
 when 'PRICE_CHANGED' then 'Giá phần gọi thêm đã thay đổi. Hãy kiểm tra giá mới trước khi xác nhận lại.'
 when 'WRITE_RESULT_UNKNOWN' then 'Chưa xác định kết quả trên server. Hãy tra cứu thao tác trước khi tiếp tục.'
 when 'WRITE_TEMPORARILY_UNAVAILABLE' then 'Chưa thể hoàn tất yêu cầu. Hãy tra cứu và chỉ thử lại cùng thao tác.'
 when 'WRITE_PROTOCOL_UNSUPPORTED' then 'Phiên bản ứng dụng và server chưa tương thích. Tạm dừng ghi và tải lại ứng dụng.'
 when 'RECEIPT_UNAVAILABLE' then 'Đơn chưa thanh toán hoặc đã hủy nên không thể in hóa đơn.'
 else 'Dữ liệu thao tác không hợp lệ. Vui lòng tải lại và kiểm tra.' end, 'details', p_details)
$$;

create function private.write_failure(p_code text, p_details jsonb default null) returns jsonb
language sql immutable set search_path = pg_catalog as $$
 select jsonb_build_object('ok',false,'error',private.write_error(p_code,p_details))
$$;

-- P0400 is reserved for known, durable business rejection. Never catch arbitrary
-- SQL exceptions as a business outcome: deadlocks/faults must roll back the request.
create function private.reject_write(p_code text, p_details jsonb default null) returns void
language plpgsql set search_path = pg_catalog as $$
begin raise exception using errcode='P0400', message=private.write_error(p_code,p_details)::text; end
$$;

create function private.valid_uuid(p_value jsonb) returns boolean
language sql immutable set search_path = pg_catalog as $$
 select coalesce(jsonb_typeof(p_value)='string'
 and (p_value#>>'{}') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
 and (p_value#>>'{}') <> '00000000-0000-0000-0000-000000000000',false)
$$;
create function private.valid_integer(p_value jsonb,p_min numeric,p_max numeric) returns boolean
language plpgsql immutable set search_path=pg_catalog as $$
declare n numeric;
begin
 if jsonb_typeof(p_value) is distinct from 'number' then return false; end if;
 n := (p_value#>>'{}')::numeric;
 return n=trunc(n) and n between p_min and p_max;
end $$;
create function private.valid_note(p_value jsonb) returns boolean
language sql immutable set search_path=pg_catalog as $$
 select p_value is null or p_value='null'::jsonb or
 (jsonb_typeof(p_value)='string' and char_length(p_value#>>'{}')<=500)
$$;
-- Match ECMAScript String.trim used by core/UI; PostgreSQL btrim(text) alone
-- removes only U+0020 and would accept a tab/NBSP-only "other" reason.
create function private.trim_whitespace(p_value text) returns text
language sql immutable set search_path=pg_catalog as $$
 select btrim(p_value, (select string_agg(chr(code),'') from unnest(array[
 9,10,11,12,13,32,160,5760,8192,8193,8194,8195,8196,8197,8198,8199,
 8200,8201,8202,8232,8233,8239,8287,12288,65279]) as x(code)))
$$;
create function private.exact_fields(p_value jsonb,p_required text[],p_optional text[] default '{}') returns boolean
language plpgsql immutable set search_path=pg_catalog as $$
begin
 if jsonb_typeof(p_value) is distinct from 'object' then return false; end if;
 return p_value ?& p_required and not exists(select 1 from jsonb_object_keys(p_value) k where not k=any(p_required||p_optional));
end $$;

create function private.valid_write_payload(p_id uuid,p jsonb) returns boolean
language plpgsql immutable set search_path=pg_catalog as $$
declare required text[]; line jsonb; opt jsonb; kind text; action text;
begin
 if p_id is null or p_id='00000000-0000-0000-0000-000000000000'::uuid or
    p is null or jsonb_typeof(p)<>'object' or octet_length(p::text)>262144 or
    p->'schemaVersion' is distinct from '1'::jsonb or not private.valid_uuid(p->'orderId') then return false; end if;
 kind:=p->>'kind'; action:=p->>'action';
 required:=array['schemaVersion','kind','orderId','expectedVersion'];
 if kind='submit_order_changes' then
  required:=required||'action'::text;
  if action='create' then
   if not private.exact_fields(p,required||array['orderType','tableId','newLines']) or
      p->'expectedVersion' is distinct from 'null'::jsonb or
      coalesce(p->>'orderType','') not in ('dine_in','takeaway') or
      (p->>'orderType'='dine_in' and not private.valid_uuid(p->'tableId')) or
      (p->>'orderType'='takeaway' and p->'tableId' is distinct from 'null'::jsonb) then return false; end if;
  elsif action='update' then
   if not private.exact_fields(p,required||array['retainedLines','newLines']) or
      not private.valid_integer(p->'expectedVersion',0,2147483647) or
      jsonb_typeof(p->'retainedLines') is distinct from 'array' then return false; end if;
   if jsonb_array_length(p->'retainedLines') not between 1 and 200 then return false; end if;
   for line in select value from jsonb_array_elements(p->'retainedLines') loop
    if not private.exact_fields(line,array['sourceItemId','quantity'],array['note']) or
       not private.valid_uuid(line->'sourceItemId') or not private.valid_integer(line->'quantity',0,999) or not private.valid_note(line->'note') then return false; end if;
   end loop;
  elsif action='void_open' then
   return private.exact_fields(p,required) and private.valid_integer(p->'expectedVersion',0,2147483647);
  else return false;
  end if;
  if jsonb_typeof(p->'newLines') is distinct from 'array' then return false; end if;
  if jsonb_array_length(p->'newLines') not between (case when action='create' then 1 else 0 end) and 200 then return false; end if;
  for line in select value from jsonb_array_elements(p->'newLines') loop
   if not private.exact_fields(line,array['id','menuItemId','quantity','quotedBasePrice','options'],array['note']) or
      not private.valid_uuid(line->'id') or not private.valid_uuid(line->'menuItemId') or
      not private.valid_integer(line->'quantity',1,999) or not private.valid_integer(line->'quotedBasePrice',0,2147483647) or
      not private.valid_note(line->'note') or jsonb_typeof(line->'options') is distinct from 'array' then return false; end if;
   if jsonb_array_length(line->'options')>20 then return false; end if;
   for opt in select value from jsonb_array_elements(line->'options') loop
    if not private.exact_fields(opt,array['id','optionValueId','quantity','quotedPriceDelta']) or
       not private.valid_uuid(opt->'id') or not private.valid_uuid(opt->'optionValueId') or
       not private.valid_integer(opt->'quantity',1,99) or not private.valid_integer(opt->'quotedPriceDelta',0,2147483647) then return false; end if;
   end loop;
  end loop;
 elsif kind in ('pay_order','pay_order_items') then
  required:=required||array['paymentId','method','receivedAmount'];
  if kind='pay_order_items' then required:=required||array['newOrderId','lines']; end if;
  if not private.exact_fields(p,required) or not private.valid_integer(p->'expectedVersion',0,2147483647) or
     not private.valid_uuid(p->'paymentId') or p->>'method' is distinct from 'cash' or
     not private.valid_integer(p->'receivedAmount',0,2147483647) then return false; end if;
  if kind='pay_order_items' then
   if not private.valid_uuid(p->'newOrderId') or jsonb_typeof(p->'lines') is distinct from 'array' then return false; end if;
   if jsonb_array_length(p->'lines') not between 1 and 200 then return false; end if;
   for line in select value from jsonb_array_elements(p->'lines') loop
    if not private.exact_fields(line,array['orderItemId','quantity','splitItemId']) or
       not private.valid_uuid(line->'orderItemId') or not private.valid_uuid(line->'splitItemId') or
       not private.valid_integer(line->'quantity',1,999) then return false; end if;
   end loop;
  end if;
 elsif kind='void_order' then
  if not private.exact_fields(p,required||'reason'::text,array['reasonNote']) or
     not private.valid_integer(p->'expectedVersion',0,2147483647) or
     coalesce(p->>'reason','') not in ('wrong_order','customer_request','out_of_stock','duplicate','other') or
     not private.valid_note(p->'reasonNote') then return false; end if;
 else return false;
 end if;
 -- Duplicate freshly allocated IDs are malformed before registration. Duplicate
 -- retained/source IDs are business provenance errors and remain execute-time.
 if exists(select 1 from jsonb_array_elements(coalesce(p->'newLines','[]')) x group by (x->>'id')::uuid having count(*)>1) or
    exists(select 1 from jsonb_array_elements(coalesce(p->'newLines','[]')) x cross join lateral jsonb_array_elements(x->'options') v group by (v->>'id')::uuid having count(*)>1) or
    exists(select 1 from jsonb_array_elements(coalesce(p->'lines','[]')) x group by (x->>'splitItemId')::uuid having count(*)>1) then return false; end if;
 return true;
end $$;

create table private.employee_sessions (
 token_hash bytea primary key,
 store_id uuid not null references public.stores(id),
 employee_id uuid not null,
 issued_at timestamptz not null,
 expires_at timestamptz not null,
 revoked_at timestamptz,
 foreign key(store_id,employee_id) references public.employees(store_id,id),
 check (expires_at=issued_at+interval '12 hours')
);
create index employee_sessions_employee_idx on private.employee_sessions(store_id,employee_id);
revoke all on private.employee_sessions from public,anon,authenticated;

create function private.employee_token_hash() returns bytea
language sql stable set search_path=pg_catalog as $$
 select extensions.digest(convert_to(coalesce(nullif(current_setting('request.headers',true),'')::jsonb->>'x-pos-employee-token',''),'UTF8'),'sha256')
$$;
create function private.current_employee(p_lock boolean default false) returns public.employees
language plpgsql volatile security definer set search_path=pg_catalog as $$
declare e public.employees; s private.employee_sessions; sid uuid:=auth.uid();
begin
 if sid is null then raise exception 'AUTH_REQUIRED' using errcode='P0401'; end if;
 select * into s from private.employee_sessions where token_hash=private.employee_token_hash() and store_id=sid;
 if not found then raise exception 'EMPLOYEE_SESSION_REQUIRED' using errcode='P0401'; end if;
 if p_lock then
  select * into e from public.employees where store_id=sid and id=s.employee_id for share;
  select * into s from private.employee_sessions where token_hash=s.token_hash and store_id=sid for share;
 else select * into e from public.employees where store_id=sid and id=s.employee_id;
 end if;
 if e.id is null or not e.is_active or s.revoked_at is not null or s.expires_at<=private.write_clock() then
  raise exception 'EMPLOYEE_SESSION_REQUIRED' using errcode='P0401';
 end if;
 return e;
end $$;

create function private.require_admin() returns uuid
language plpgsql volatile security definer set search_path=pg_catalog as $$
declare e public.employees;
begin
 e:=private.current_employee(true);
 if e.role<>'admin'::public.employee_role then raise exception 'FORBIDDEN' using errcode='P0401'; end if;
 return e.id;
end $$;

create function private.safe_employee(e public.employees) returns jsonb
language sql immutable set search_path=pg_catalog as $$
 select jsonb_build_object('id',e.id,'name',e.name,'role',e.role,'isActive',e.is_active,'permissionOverrides',e.permission_overrides)
$$;

create function public.start_employee_session(p_employee_id uuid,p_pin text) returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog as $$
declare e public.employees; token text; issued timestamptz;
begin
 if auth.uid() is null then return private.write_failure('AUTH_REQUIRED'); end if;
 if p_pin is null or p_pin !~ '^[0-9]{6}$' then return private.write_failure('INVALID_PIN'); end if;
 select * into e from public.employees where store_id=auth.uid() and id=p_employee_id for share;
 if not found or not e.is_active or e.passcode_hash<>extensions.crypt(p_pin,e.passcode_hash) then return private.write_failure('INVALID_PIN'); end if;
 token:=rtrim(translate(encode(extensions.gen_random_bytes(32),'base64'),'+/','-_'),'=');
 issued:=private.write_clock();
 insert into private.employee_sessions(token_hash,store_id,employee_id,issued_at,expires_at)
 values(extensions.digest(convert_to(token,'UTF8'),'sha256'),auth.uid(),e.id,issued,issued+interval '12 hours');
 return jsonb_build_object('ok',true,'employee',private.safe_employee(e),'token',token,'issuedAt',issued,'expiresAt',issued+interval '12 hours');
end $$;

create function public.revoke_employee_session() returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog as $$
declare eid uuid;
begin
 if auth.uid() is null then return private.write_failure('AUTH_REQUIRED'); end if;
 select employee_id into eid from private.employee_sessions where store_id=auth.uid() and token_hash=private.employee_token_hash();
 perform 1 from public.employees where store_id=auth.uid() and id=eid for share;
 update private.employee_sessions set revoked_at=coalesce(revoked_at,private.write_clock()) where store_id=auth.uid() and token_hash=private.employee_token_hash();
 return jsonb_build_object('ok',true);
end $$;

create function private.revoke_changed_employee_sessions() returns trigger
language plpgsql security definer set search_path=pg_catalog as $$
begin
 if new.passcode_hash is distinct from old.passcode_hash or (old.is_active and not new.is_active) then
  update private.employee_sessions set revoked_at=coalesce(revoked_at,private.write_clock()) where store_id=new.store_id and employee_id=new.id;
 end if;
 return new;
end $$;
create trigger employees_revoke_sessions after update on public.employees for each row execute function private.revoke_changed_employee_sessions();

create function public.bootstrap_store(p_admin_id uuid,p_store_no integer,p_display_name text,p_address text) returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog as $$
declare sid uuid:=auth.uid(); email text;
begin
 if sid is null then return private.write_failure('AUTH_REQUIRED'); end if;
 if not private.valid_uuid(to_jsonb(p_admin_id)) or p_store_no is null or p_store_no<=0 or
    p_display_name is null or char_length(btrim(p_display_name)) not between 1 and 120 or
    p_address is null or char_length(btrim(p_address))>500 then return private.write_failure('INVALID_WRITE_REQUEST'); end if;
 select u.email into email from auth.users u where u.id=sid;
 if email is distinct from 'store'||p_store_no::text||'@store.pos.local' then return private.write_failure('FORBIDDEN'); end if;
 perform pg_advisory_xact_lock(hashtext(sid::text||':bootstrap'));
 if exists(select 1 from public.stores where id=sid or store_no=p_store_no) or exists(select 1 from public.employees where id=p_admin_id) then
  return private.write_failure('ENTITY_ID_CONFLICT');
 end if;
 insert into public.stores(id,store_no,name,email,seed_status) values(sid,p_store_no,btrim(p_display_name),null,'pending');
 insert into public.store_settings(store_id,display_name,address) values(sid,btrim(p_display_name),btrim(p_address));
 insert into public.employees(id,store_id,name,role,passcode_hash) values(p_admin_id,sid,'Quản lý','admin',extensions.crypt('123456',extensions.gen_salt('bf')));
 return jsonb_build_object('ok',true,'storeId',sid,'storeNo',p_store_no,'adminId',p_admin_id,'adminPin','123456');
end $$;

create function public.create_employee(p_employee_id uuid,p_name text,p_role public.employee_role,p_pin text,p_seed_key text default null) returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog as $$
declare e public.employees;
begin
 perform private.require_admin();
 if not private.valid_uuid(to_jsonb(p_employee_id)) or p_name is null or char_length(btrim(p_name)) not between 1 and 120 or
    p_role is null or p_pin is null or p_pin !~ '^[0-9]{6}$' then return private.write_failure('INVALID_WRITE_REQUEST'); end if;
 if exists(select 1 from public.employees where id=p_employee_id) then return private.write_failure('ENTITY_ID_CONFLICT'); end if;
 insert into public.employees(id,store_id,name,role,passcode_hash,seed_key) values(p_employee_id,auth.uid(),btrim(p_name),p_role,extensions.crypt(p_pin,extensions.gen_salt('bf')),p_seed_key) returning * into e;
 return jsonb_build_object('ok',true,'employee',private.safe_employee(e));
exception when sqlstate 'P0401' then return private.write_failure(sqlerrm);
end $$;

create function public.seed_employee(p_employee_id uuid,p_name text,p_role public.employee_role,p_pin text,p_seed_key text) returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog as $$
declare e public.employees;
begin
 perform private.require_admin();
 if p_seed_key is null or p_seed_key not like 'demo.%' or p_role='admin' then return private.write_failure('INVALID_WRITE_REQUEST'); end if;
 select * into e from public.employees where id=p_employee_id for update;
 if not found then return public.create_employee(p_employee_id,p_name,p_role,p_pin,p_seed_key); end if;
 if e.store_id<>auth.uid() or e.seed_key is distinct from p_seed_key or e.role='admin' then return private.write_failure('ENTITY_ID_CONFLICT'); end if;
 if p_pin is null or p_pin !~ '^[0-9]{6}$' or p_name is null or char_length(btrim(p_name)) not between 1 and 120 or p_role is null then return private.write_failure('INVALID_WRITE_REQUEST'); end if;
 update public.employees set name=btrim(p_name),role=p_role,is_active=true,passcode_hash=extensions.crypt(p_pin,extensions.gen_salt('bf')) where id=e.id returning * into e;
 return jsonb_build_object('ok',true,'employee',private.safe_employee(e));
exception when sqlstate 'P0401' then return private.write_failure(sqlerrm);
end $$;

create function public.reset_employee_pin(p_employee_id uuid,p_pin text) returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog as $$
begin
 perform private.require_admin();
 if p_pin is null or p_pin !~ '^[0-9]{6}$' then return private.write_failure('INVALID_WRITE_REQUEST'); end if;
 update public.employees set passcode_hash=extensions.crypt(p_pin,extensions.gen_salt('bf')) where store_id=auth.uid() and id=p_employee_id;
 if not found then return private.write_failure('NOT_FOUND'); end if;
 return jsonb_build_object('ok',true);
exception when sqlstate 'P0401' then return private.write_failure(sqlerrm);
end $$;

-- Fail rather than silently repairing historical financial data.
do $$ begin
 if exists(select 1 from public.option_values where price_delta<0) or
    exists(select 1 from public.order_item_options where price_delta<0 or quantity<1) or
    exists(select 1 from public.orders where lock_version<0 or order_no<1) or
    exists(select 1 from public.order_items i where i.unit_price::bigint+coalesce((select sum(o.price_delta::bigint*o.quantity) from public.order_item_options o where o.store_id=i.store_id and o.order_item_id=i.id),0)>2147483647) or
    exists(select 1 from public.order_items i where i.quantity::bigint*(i.unit_price::bigint+coalesce((select sum(o.price_delta::bigint*o.quantity) from public.order_item_options o where o.store_id=i.store_id and o.order_item_id=i.id),0))>2147483647) or
    exists(select 1 from public.order_items i where i.status<>'removed' and (i.quantity not between 1 and 999 or i.menu_item_id is null)) or
    exists(select 1 from public.order_items i where i.status<>'removed' group by i.store_id,i.order_id having count(*)>200) or
    exists(select 1 from public.order_items i where i.status<>'removed' group by i.store_id,i.order_id having
      sum(i.quantity::bigint*(i.unit_price::bigint+coalesce((select sum(o.price_delta::bigint*o.quantity) from public.order_item_options o where o.store_id=i.store_id and o.order_item_id=i.id),0)))>2147483647) then
  raise exception 'IDEMPOTENCY_MIGRATION_PREFLIGHT: invalid legacy money/version/number; inspect raw rows before migration';
 end if;
end $$;
alter table public.option_values add constraint option_values_nonnegative_delta check(price_delta>=0);
alter table public.order_item_options add constraint order_item_options_nonnegative_delta check(price_delta>=0);
alter table public.orders add column created_by_employee_id uuid,
 add column last_modified_by_employee_id uuid,
 add foreign key(store_id,created_by_employee_id) references public.employees(store_id,id),
 add foreign key(store_id,last_modified_by_employee_id) references public.employees(store_id,id),
 add constraint orders_valid_version check(lock_version>=0);
alter table public.payments add column receipt_snapshot jsonb;

create type public.write_operation_status as enum('pending','applied','rejected','cancelled','expired');
create table public.write_operations (
 store_id uuid not null references public.stores(id), operation_id uuid not null,
 schema_version integer not null check(schema_version=1), kind text not null,
 action text, required_permission text not null, payload jsonb not null,
 order_id uuid generated always as ((payload->>'orderId')::uuid) stored,
 registered_at timestamptz not null, expires_at timestamptz not null,
 initiated_by_employee_id uuid not null, status public.write_operation_status not null default 'pending',
 result jsonb, error jsonb, executed_by_employee_id uuid, decided_at timestamptz,
 cancelled_by_employee_id uuid, replay_count bigint not null default 0 check(replay_count>=0),
 primary key(store_id,operation_id),
 foreign key(store_id,initiated_by_employee_id) references public.employees(store_id,id),
 foreign key(store_id,executed_by_employee_id) references public.employees(store_id,id),
 foreign key(store_id,cancelled_by_employee_id) references public.employees(store_id,id),
 check(expires_at=registered_at+interval '24 hours'),
 check(private.valid_write_payload(operation_id,payload)),
 check(kind=payload->>'kind' and action is not distinct from payload->>'action'),
 check((status='pending' and result is null and error is null and decided_at is null and executed_by_employee_id is null and cancelled_by_employee_id is null)
 or (status='applied' and result is not null and error is null and decided_at is not null and executed_by_employee_id is not null and cancelled_by_employee_id is null)
 or (status='rejected' and result is null and error is not null and decided_at is not null and executed_by_employee_id is null and cancelled_by_employee_id is null)
 or (status='cancelled' and result is null and error is null and decided_at is not null and executed_by_employee_id is null and cancelled_by_employee_id is not null)
 or (status='expired' and result is null and error is null and decided_at is not null and executed_by_employee_id is null and cancelled_by_employee_id is null))
);
create index write_operations_recent_idx on public.write_operations(store_id,registered_at desc,operation_id desc);
create index write_operations_order_idx on public.write_operations(store_id,order_id,registered_at desc,operation_id desc);
create index write_operations_expiry_idx on public.write_operations(store_id,status,expires_at);
create table public.order_events (
 id uuid primary key,store_id uuid not null references public.stores(id),operation_id uuid not null,
 action text not null,source_order_id uuid not null,result_order_id uuid,payment_id uuid,
 initiated_by uuid not null,executed_by uuid not null,occurred_at timestamptz not null,
 before_version integer,after_version integer not null,summary jsonb not null,
 unique(store_id,operation_id),
 foreign key(store_id,operation_id) references public.write_operations(store_id,operation_id),
 foreign key(store_id,source_order_id) references public.orders(store_id,id),
 foreign key(store_id,result_order_id) references public.orders(store_id,id),
 foreign key(store_id,payment_id) references public.payments(store_id,id),
 foreign key(store_id,initiated_by) references public.employees(store_id,id),
 foreign key(store_id,executed_by) references public.employees(store_id,id)
);
alter table public.write_operations enable row level security;
alter table public.order_events enable row level security;
revoke all on public.write_operations,public.order_events from public,anon,authenticated;

create function private.immutable_operation() returns trigger
language plpgsql set search_path=pg_catalog as $$
begin
 if tg_op='DELETE' then raise exception 'IMMUTABLE_OPERATION'; end if;
 if (to_jsonb(new)-array['order_id','status','result','error','executed_by_employee_id','decided_at','cancelled_by_employee_id','replay_count'])
 is distinct from (to_jsonb(old)-array['order_id','status','result','error','executed_by_employee_id','decided_at','cancelled_by_employee_id','replay_count']) then raise exception 'IMMUTABLE_OPERATION'; end if;
 if old.status<>'pending' and (to_jsonb(new)-array['order_id','replay_count']) is distinct from (to_jsonb(old)-array['order_id','replay_count']) then raise exception 'IMMUTABLE_OPERATION'; end if;
 return new;
end $$;
create trigger write_operations_immutable before update or delete on public.write_operations for each row execute function private.immutable_operation();
create function private.immutable_event() returns trigger language plpgsql set search_path=pg_catalog as $$
begin raise exception 'IMMUTABLE_ORDER_EVENT'; end $$;
create trigger order_events_immutable before update or delete on public.order_events for each row execute function private.immutable_event();

revoke all on all functions in schema private from public,anon,authenticated;
revoke all on function public.start_employee_session(uuid,text),public.revoke_employee_session(),public.bootstrap_store(uuid,integer,text,text),public.create_employee(uuid,text,public.employee_role,text,text),public.seed_employee(uuid,text,public.employee_role,text,text),public.reset_employee_pin(uuid,text) from public,anon,authenticated;

$permission_fragment_13$;
-- 15: supabase/migrations/015_write_business_helpers.sql
 if clock_timestamp()>=least(started_at+interval '50 seconds','2026-10-22T10:00:00.000Z'::timestamptz) then raise exception 'STAGING_EXECUTION_WINDOW_CLOSED'; end if;
 execute $permission_fragment_14$-- Private, transaction-local planning and application. Only protocol v1 calls
-- these helpers after schema/auth, locks and the final server clock checkpoint.

alter table public.order_item_options add column snapshot_sort_order integer not null default 0;

create function private.write_permission(p jsonb) returns text
language sql immutable set search_path=pg_catalog as $$
 select case p->>'kind' when 'submit_order_changes' then case p->>'action'
 when 'create' then 'order.create' when 'update' then 'order.update' when 'void_open' then 'order.voidOpen' end
 when 'pay_order' then 'payment.take' when 'pay_order_items' then 'payment.take' when 'void_order' then 'order.voidPaid' end
$$;

create function private.operation_view(w public.write_operations) returns jsonb
language sql stable set search_path=pg_catalog as $$
 select jsonb_build_object('operationId',w.operation_id,'schemaVersion',w.schema_version,'kind',w.kind,'action',w.action,
 'status',w.status,'payload',w.payload,'registeredAt',w.registered_at,'expiresAt',w.expires_at,
 'initiatedByEmployeeId',w.initiated_by_employee_id,'decidedAt',w.decided_at,'executedByEmployeeId',w.executed_by_employee_id,
 'cancelledByEmployeeId',w.cancelled_by_employee_id,'result',w.result,'error',w.error,'replayCount',w.replay_count::text)
$$;

create function private.item_unit_total(p_store uuid,p_item uuid) returns bigint
language sql stable set search_path=pg_catalog as $$
 select i.unit_price::bigint+coalesce((select sum(o.price_delta::bigint*o.quantity) from public.order_item_options o
 where o.store_id=i.store_id and o.order_item_id=i.id),0) from public.order_items i where i.store_id=p_store and i.id=p_item
$$;
create function private.item_snapshot(i public.order_items) returns jsonb
language sql stable set search_path=pg_catalog as $$
 select jsonb_build_object('id',i.id,'menuItemId',i.menu_item_id,'name',i.item_name,'quantity',i.quantity,
 'baseUnitPrice',i.unit_price,'note',i.note,'status','active','unitTotal',private.item_unit_total(i.store_id,i.id),
 'lineTotal',private.item_unit_total(i.store_id,i.id)*i.quantity,'options',coalesce((select jsonb_agg(
 jsonb_build_object('id',o.id,'optionValueId',o.option_value_id,'name',o.option_name,'priceDelta',o.price_delta,'quantity',o.quantity)
 order by o.snapshot_sort_order,o.created_at,o.id) from public.order_item_options o where o.store_id=i.store_id and o.order_item_id=i.id),'[]'::jsonb))
$$;
create function private.order_snapshot(p_store uuid,p_order uuid) returns jsonb
language sql stable set search_path=pg_catalog as $$
 select jsonb_build_object('id',o.id,'storeId',o.store_id,'orderNo',o.order_no,'businessDate',o.business_date,
 'orderType',o.order_type,'tableId',o.table_id,'status',o.status,'lockVersion',o.lock_version,'subtotal',o.subtotal,'total',o.total,
 'createdAt',o.created_at,'updatedAt',o.updated_at,'paidAt',o.paid_at,'createdByEmployeeId',o.created_by_employee_id,
 'lastModifiedByEmployeeId',o.last_modified_by_employee_id,'voidedAt',o.voided_at,'voidedByEmployeeId',o.voided_by_employee_id,
 'voidReasonCode',o.void_reason_code,'voidReasonNote',o.void_reason_note,'items',coalesce((select jsonb_agg(private.item_snapshot(i) order by i.sort_order,i.created_at,i.id)
 from public.order_items i where i.store_id=o.store_id and i.order_id=o.id and i.status<>'removed'),'[]'::jsonb))
 from public.orders o where o.store_id=p_store and o.id=p_order
$$;
create function private.payment_snapshot(p_store uuid,p_payment uuid) returns jsonb
language sql stable set search_path=pg_catalog as $$
 select jsonb_build_object('id',p.id,'orderId',p.order_id,'employeeId',p.employee_id,'method',p.method,'amount',p.amount,
 'receivedAmount',p.received_amount,'changeAmount',p.change_amount,'createdAt',p.created_at)
 from public.payments p where p.store_id=p_store and p.id=p_payment
$$;
create function private.receipt_snapshot(p_store uuid,p_payment uuid) returns jsonb
language sql stable set search_path=pg_catalog as $$
 select jsonb_build_object('schemaVersion',1,'orderId',o.id,'paymentId',p.id,'orderNo',o.order_no,'businessDate',o.business_date,
 'storeName',s.display_name,'address',s.address,'footer',s.bill_footer,'tableName',t.name,'paidAt',p.paid_at,
 'employeeName',e.name,'total',p.amount,'receivedAmount',p.received_amount,'changeAmount',p.change_amount,
 'lines',coalesce((select jsonb_agg((private.item_snapshot(i)-array['id','status','options'])||jsonb_build_object('orderItemId',i.id,
 'options',coalesce((select jsonb_agg(jsonb_build_object('optionValueId',v.option_value_id,'name',v.option_name,'quantity',v.quantity,'priceDelta',v.price_delta)
 order by v.snapshot_sort_order,v.created_at,v.id) from public.order_item_options v where v.store_id=i.store_id and v.order_item_id=i.id),'[]'::jsonb))
 order by i.sort_order,i.created_at,i.id) from public.order_items i where i.store_id=o.store_id and i.order_id=o.id and i.status<>'removed'),'[]'::jsonb))
 from public.payments p join public.orders o on o.store_id=p.store_id and o.id=p.order_id
 join public.store_settings s on s.store_id=p.store_id join public.employees e on e.store_id=p.store_id and e.id=p.employee_id
 left join public.tables t on t.store_id=o.store_id and t.id=o.table_id where p.store_id=p_store and p.id=p_payment
$$;

-- Every row/advisory lock that can delay the first financial effect is acquired
-- here, before locking the acting employee and checking the final clock.
create function private.lock_write_input(p jsonb) returns void
language plpgsql volatile set search_path=pg_catalog as $$
declare sid uuid:=auth.uid(); oid uuid:=(p->>'orderId')::uuid; tid uuid; day date; ident uuid;
begin
 perform 1 from public.orders where store_id=sid and id=oid order by id for update;
 select table_id,business_date into tid,day from public.orders where store_id=sid and id=oid;
 if p->>'action'='create' then tid:=(p->>'tableId')::uuid; end if;
 perform 1 from public.tables where store_id=sid and id=tid order by id for update;
 perform 1 from public.order_items where store_id=sid and order_id=oid order by id for update;
 perform 1 from public.order_item_options where store_id=sid and order_item_id in(select id from public.order_items where store_id=sid and order_id=oid) order by id for update;
 if p->>'action'='create' or p->>'kind'='pay_order_items' then
  -- A store-wide numbering lock also covers a create validation that crosses
  -- midnight. Its plan may refresh to a new businessDate without a later wait.
  perform pg_advisory_xact_lock(hashtext(sid::text||':order-number'));
  if day is null then select (private.write_clock() at time zone timezone)::date into day from public.store_settings where store_id=sid; end if;
  perform pg_advisory_xact_lock(hashtext(sid::text||':'||day::text));
 end if;
 if coalesce(jsonb_array_length(p->'newLines'),0)>0 then perform pg_advisory_xact_lock(hashtext(sid::text||':catalog-write')); end if;
 -- Cross-store calls with the same client UUID serialize before INSERT/unique checks.
 for ident in select distinct id from (
  select oid id where p->>'action'='create'
  union all select (p->>'newOrderId')::uuid where p ? 'newOrderId'
  union all select (p->>'paymentId')::uuid where p ? 'paymentId'
  union all select (x->>'id')::uuid from jsonb_array_elements(coalesce(p->'newLines','[]')) x
  union all select (v->>'id')::uuid from jsonb_array_elements(coalesce(p->'newLines','[]')) x cross join lateral jsonb_array_elements(x->'options') v
  union all select (x->>'splitItemId')::uuid from jsonb_array_elements(coalesce(p->'lines','[]')) x
 ) ids order by id loop perform pg_advisory_xact_lock(hashtextextended(ident::text,1)); end loop;
 perform 1 from public.store_settings where store_id=sid for share;
 perform 1 from public.stores where id=sid for share;
end $$;

-- Payload numbers have already passed valid_integer. Parse through numeric so
-- JSONB-equivalent integral spellings (2, 2.0, 2e0) execute identically without
-- rewriting the registered payload. This also applies to recordset projections.
create function private.prepare_write(p jsonb) returns jsonb
language plpgsql volatile set search_path=pg_catalog as $$
#variable_conflict use_column
declare sid uuid:=auth.uid(); oid uuid:=(p->>'orderId')::uuid; o public.orders; item public.order_items;
 menu public.menu_items; ov public.option_values; grp record; line jsonb; opt jsonb;
 prepared jsonb:='[]'; prepared_options jsonb; changed_lines jsonb:='[]'; changed_options jsonb;
new_total bigint:=0; quoted_new_total bigint:=0; retained_total bigint:=0; amount bigint:=0; unit bigint; line_total bigint; quote_unit bigint;
changed boolean:=false; any_changed boolean:=false; count_active integer:=0; count_selected integer; next_no bigint; day date; zone text;
 ids uuid[]:='{}'; opt_ids uuid[]:='{}'; sources uuid[]:='{}'; option_values uuid[]; id uuid;
begin
 select * into o from public.orders where store_id=sid and id=oid;
 if p->>'action'='create' then
  if exists(select 1 from public.orders where id=oid) then perform private.reject_write('ENTITY_ID_CONFLICT'); end if;
  if p->>'orderType'='dine_in' then
   if not exists(select 1 from public.tables where store_id=sid and id=(p->>'tableId')::uuid and deleted_at is null) then perform private.reject_write('TABLE_NOT_FOUND'); end if;
   if exists(select 1 from public.orders where store_id=sid and table_id=(p->>'tableId')::uuid and status='open') then perform private.reject_write('TABLE_OCCUPIED'); end if;
  end if;
 else
  if o.id is null then perform private.reject_write('NOT_FOUND'); end if;
  if o.lock_version<>(p->>'expectedVersion')::numeric::integer or
     (p->>'kind'='void_order' and o.status<>'paid') or (p->>'kind'<>'void_order' and o.status<>'open') then perform private.reject_write('ORDER_VERSION_CONFLICT'); end if;
  if o.lock_version=2147483647 then perform private.reject_write('INVALID_WRITE_REQUEST'); end if;
 end if;

 -- Provenance and fresh IDs are checked before looking up menu/price data.
 if p->>'action'='update' then
  for line in select value from jsonb_array_elements(p->'retainedLines') loop
   id:=(line->>'sourceItemId')::uuid;
   -- Qualify identifiers explicitly: PL/pgSQL variables are never column aliases.
   select i.* into item from public.order_items i where i.store_id=sid and i.order_id=oid and i.id=(line->>'sourceItemId')::uuid and i.status<>'removed';
   if item.id is null or id=any(sources) or (line->>'quantity')::numeric::integer>item.quantity then perform private.reject_write('INVALID_ORDER_ITEMS'); end if;
   sources:=array_append(sources,id);
   if (line->>'quantity')::numeric::integer>0 then
    count_active:=count_active+1;
    unit:=private.item_unit_total(sid,item.id); line_total:=unit*(line->>'quantity')::numeric::integer;
    if unit not between 0 and 2147483647 or line_total not between 0 and 2147483647 then perform private.reject_write('INVALID_WRITE_REQUEST'); end if;
    retained_total:=retained_total+line_total;
   end if;
  end loop;
  if exists(select 1 from public.order_items i where i.store_id=sid and i.order_id=oid and i.status<>'removed' and not i.id=any(sources)) then perform private.reject_write('INVALID_ORDER_ITEMS'); end if;
 end if;
 if p->>'kind' in ('pay_order','pay_order_items') and exists(select 1 from public.payments where id=(p->>'paymentId')::uuid) then perform private.reject_write('ENTITY_ID_CONFLICT'); end if;
 if p->>'kind'='pay_order_items' then
  if (p->>'newOrderId')::uuid=oid or exists(select 1 from public.orders where id=(p->>'newOrderId')::uuid) then perform private.reject_write('ENTITY_ID_CONFLICT'); end if;
  for line in select value from jsonb_array_elements(p->'lines') loop
   id:=(line->>'orderItemId')::uuid;
   select i.* into item from public.order_items i where i.store_id=sid and i.order_id=oid and i.id=(line->>'orderItemId')::uuid and i.status<>'removed';
   if item.id is null or id=any(sources) or (line->>'quantity')::numeric::integer>item.quantity then perform private.reject_write('INVALID_ORDER_ITEMS'); end if;
   sources:=array_append(sources,id);
   id:=(line->>'splitItemId')::uuid;
   if id=any(ids) or exists(select 1 from public.order_items i where i.id=(line->>'splitItemId')::uuid) then perform private.reject_write('ENTITY_ID_CONFLICT'); end if;
   ids:=array_append(ids,id);
  end loop;
  if not exists(select 1 from public.order_items i left join jsonb_to_recordset(p->'lines') x("orderItemId" uuid,quantity numeric) on x."orderItemId"=i.id
    where i.store_id=sid and i.order_id=oid and i.status<>'removed' and coalesce(x.quantity,0)<i.quantity) then perform private.reject_write('INVALID_ORDER_ITEMS'); end if;
 end if;
 for line in select value from jsonb_array_elements(coalesce(p->'newLines','[]')) loop
  id:=(line->>'id')::uuid;
  if id=any(ids) or exists(select 1 from public.order_items i where i.id=(line->>'id')::uuid) then perform private.reject_write('ENTITY_ID_CONFLICT'); end if;
  ids:=array_append(ids,id);
  for opt in select value from jsonb_array_elements(line->'options') loop
   id:=(opt->>'id')::uuid;
   if id=any(opt_ids) or exists(select 1 from public.order_item_options i where i.id=(opt->>'id')::uuid) then perform private.reject_write('ENTITY_ID_CONFLICT'); end if;
   opt_ids:=array_append(opt_ids,id);
  end loop;
 end loop;

 -- Build a private immutable plan from catalog snapshots while holding its lock.
 for line in select value from jsonb_array_elements(coalesce(p->'newLines','[]')) loop
  select m.* into menu from public.menu_items m join public.categories c on c.store_id=m.store_id and c.id=m.category_id
  where m.store_id=sid and m.id=(line->>'menuItemId')::uuid and m.is_available and m.deleted_at is null and c.deleted_at is null;
  if menu.id is null then perform private.reject_write('MENU_ITEM_UNAVAILABLE'); end if;
  unit:=menu.price; quote_unit:=(line->>'quotedBasePrice')::numeric::bigint; prepared_options:='[]'; changed_options:='[]'; option_values:='{}';
  changed:=menu.price<>(line->>'quotedBasePrice')::numeric::integer;
  for opt in select value from jsonb_array_elements(line->'options') loop
   select v.* into ov from public.option_values v join public.option_groups g on g.store_id=v.store_id and g.id=v.option_group_id
   where v.store_id=sid and v.id=(opt->>'optionValueId')::uuid and v.deleted_at is null and g.deleted_at is null
   and exists(select 1 from public.menu_item_option_groups l where l.store_id=sid and l.menu_item_id=menu.id and l.option_group_id=g.id and l.deleted_at is null);
   if ov.id is null or ov.id=any(option_values) then perform private.reject_write('OPTION_VALUE_UNAVAILABLE'); end if;
   option_values:=array_append(option_values,ov.id);
   unit:=unit+ov.price_delta::bigint*(opt->>'quantity')::numeric::integer;
   quote_unit:=quote_unit+(opt->>'quotedPriceDelta')::numeric::bigint*(opt->>'quantity')::numeric::integer;
   changed:=changed or ov.price_delta<>(opt->>'quotedPriceDelta')::numeric::integer;
   changed_options:=changed_options||jsonb_build_array(jsonb_build_object('optionValueId',ov.id,'quoted',(opt->>'quotedPriceDelta')::numeric::integer,'current',ov.price_delta));
   prepared_options:=prepared_options||jsonb_build_array(jsonb_build_object('id',opt->>'id','optionValueId',ov.id,'name',ov.name,'priceDelta',ov.price_delta,'quantity',(opt->>'quantity')::numeric::integer));
  end loop;
  for grp in select g.* from public.option_groups g where g.store_id=sid and g.deleted_at is null and exists
   (select 1 from public.menu_item_option_groups l where l.store_id=sid and l.menu_item_id=menu.id and l.option_group_id=g.id and l.deleted_at is null) loop
   select count(*) into count_selected from public.option_values v where v.store_id=sid and v.option_group_id=grp.id and v.id=any(option_values);
   if (grp.is_required and count_selected=0) or (grp.select_type='single' and count_selected>1) then perform private.reject_write('OPTION_VALUE_UNAVAILABLE'); end if;
  end loop;
  line_total:=unit*(line->>'quantity')::numeric::integer;
  if unit not between 0 and 2147483647 or quote_unit not between 0 and 2147483647 or line_total not between 0 and 2147483647 or
     quote_unit*(line->>'quantity')::numeric::integer>2147483647 then perform private.reject_write('INVALID_WRITE_REQUEST'); end if;
  new_total:=new_total+line_total;
  quoted_new_total:=quoted_new_total+quote_unit*(line->>'quantity')::numeric::integer;
  count_active:=count_active+1;
  any_changed:=any_changed or changed;
  if changed then changed_lines:=changed_lines||jsonb_build_array(jsonb_build_object('lineId',line->>'id','base',jsonb_build_object('quoted',(line->>'quotedBasePrice')::numeric::integer,'current',menu.price),'options',changed_options)); end if;
  prepared:=prepared||jsonb_build_array(jsonb_build_object('id',line->>'id','menuItemId',menu.id,'name',menu.name,'quantity',(line->>'quantity')::numeric::integer,
  'baseUnitPrice',menu.price,'note',line->>'note','options',prepared_options));
 end loop;
 if p->>'action' in ('create','update') then
  if count_active not between 1 and 200 then perform private.reject_write('INVALID_ORDER_ITEMS'); end if;
  if new_total>2147483647 or retained_total+new_total>2147483647 or
     quoted_new_total>2147483647 or retained_total+quoted_new_total>2147483647 then perform private.reject_write('INVALID_WRITE_REQUEST'); end if;
  if any_changed then perform private.reject_write('PRICE_CHANGED',jsonb_build_object('lines',changed_lines,'proposedNewLinesTotal',new_total)); end if;
 end if;
 if p->>'kind' in ('pay_order','pay_order_items') then
  for item in select i.* from public.order_items i where i.store_id=sid and i.order_id=oid and i.status<>'removed' loop
   unit:=private.item_unit_total(sid,item.id);
   if unit not between 0 and 2147483647 or unit*item.quantity not between 0 and 2147483647 then perform private.reject_write('INVALID_WRITE_REQUEST'); end if;
   if p->>'kind'='pay_order' then amount:=amount+unit*item.quantity;
   else select coalesce(sum((x->>'quantity')::numeric::integer),0) into count_selected from jsonb_array_elements(p->'lines') x where (x->>'orderItemId')::uuid=item.id;
    amount:=amount+unit*count_selected;
   end if;
  end loop;
  if amount>2147483647 then perform private.reject_write('INVALID_WRITE_REQUEST'); end if;
  if amount<=0 then perform private.reject_write('INVALID_ORDER_ITEMS'); end if;
  if p->>'kind'='pay_order' and amount<>o.total then perform private.reject_write('INVALID_ORDER_ITEMS'); end if;
  if p->>'kind'='pay_order_items' and o.total-amount<0 then perform private.reject_write('INVALID_ORDER_ITEMS'); end if;
  if (p->>'receivedAmount')::numeric::integer<amount then perform private.reject_write('PAYMENT_AMOUNT_TOO_LOW'); end if;
 end if;
 if p->>'kind'='void_order' and p->>'reason'='other' and coalesce(private.trim_whitespace(p->>'reasonNote'),'')='' then perform private.reject_write('VOID_REASON_REQUIRED'); end if;
 if p->>'action'='create' then
  select timezone into zone from public.store_settings where store_id=sid;
  day:=(private.write_clock() at time zone zone)::date;
 elsif p->>'kind'='pay_order_items' then day:=o.business_date;
 end if;
 if day is not null then
  select coalesce(max(order_no)::bigint,0)+1 into next_no from public.orders where store_id=sid and business_date=day;
  if next_no>2147483647 then perform private.reject_write('INVALID_WRITE_REQUEST'); end if;
 end if;
 return jsonb_build_object('newLines',prepared,'total',new_total+retained_total,'amount',amount,'nextNo',next_no,'businessDate',day,'timezone',zone);
end $$;

create function private.apply_write(p jsonb,plan jsonb,p_actor uuid,p_at timestamptz) returns jsonb
language plpgsql volatile set search_path=pg_catalog as $$
declare sid uuid:=auth.uid(); oid uuid:=(p->>'orderId')::uuid; payment_id uuid:=(p->>'paymentId')::uuid;
 paid_oid uuid:=coalesce((p->>'newOrderId')::uuid,oid); o public.orders; item public.order_items;
 line jsonb; opt jsonb; idx integer; opt_idx integer; amount integer:=(plan->>'amount')::numeric::integer; receipt jsonb;
begin
 select * into o from public.orders where store_id=sid and id=oid;
 if p->>'kind'='submit_order_changes' then
  if p->>'action'='create' then
   insert into public.orders(id,store_id,table_id,order_type,order_no,business_date,status,subtotal,total,employee_id,created_by_employee_id,last_modified_by_employee_id,created_at,updated_at)
   values(oid,sid,(p->>'tableId')::uuid,(p->>'orderType')::public.order_type,(plan->>'nextNo')::numeric::integer,(plan->>'businessDate')::date,'open',(plan->>'total')::numeric::integer,(plan->>'total')::numeric::integer,p_actor,p_actor,p_actor,p_at,p_at);
  elsif p->>'action'='update' then
   for line in select value from jsonb_array_elements(p->'retainedLines') loop
    if (line->>'quantity')::numeric::integer=0 then
     update public.order_items set status='removed' where store_id=sid and id=(line->>'sourceItemId')::uuid;
    else update public.order_items set quantity=(line->>'quantity')::numeric::integer,note=line->>'note' where store_id=sid and id=(line->>'sourceItemId')::uuid;
    end if;
   end loop;
   update public.orders set subtotal=(plan->>'total')::numeric::integer,total=(plan->>'total')::numeric::integer,lock_version=lock_version+1,last_modified_by_employee_id=p_actor where store_id=sid and id=oid;
  else
   update public.order_items set status='removed' where store_id=sid and order_id=oid and status<>'removed';
   update public.orders set status='void',subtotal=0,total=0,lock_version=lock_version+1,last_modified_by_employee_id=p_actor where store_id=sid and id=oid;
   if o.table_id is not null then update public.tables set status='empty' where store_id=sid and id=o.table_id; end if;
  end if;
  select coalesce(max(sort_order),-1)+1 into idx from public.order_items where store_id=sid and order_id=oid;
  for line in select value from jsonb_array_elements(plan->'newLines') loop
   insert into public.order_items(id,store_id,order_id,menu_item_id,item_name,quantity,unit_price,note,sort_order,created_at,updated_at)
   values((line->>'id')::uuid,sid,oid,(line->>'menuItemId')::uuid,line->>'name',(line->>'quantity')::numeric::integer,(line->>'baseUnitPrice')::numeric::integer,line->>'note',idx,p_at,p_at);
   idx:=idx+1; opt_idx:=0;
   for opt in select value from jsonb_array_elements(line->'options') loop
    insert into public.order_item_options(id,store_id,order_item_id,option_value_id,option_name,price_delta,quantity,snapshot_sort_order,created_at,updated_at)
    values((opt->>'id')::uuid,sid,(line->>'id')::uuid,(opt->>'optionValueId')::uuid,opt->>'name',(opt->>'priceDelta')::numeric::integer,(opt->>'quantity')::numeric::integer,opt_idx,p_at,p_at);
    opt_idx:=opt_idx+1;
   end loop;
  end loop;
  if p->>'action'='create' and p->>'tableId' is not null then update public.tables set status='occupied' where store_id=sid and id=(p->>'tableId')::uuid; end if;
  return jsonb_build_object('kind',p->>'kind','action',p->>'action','order',private.order_snapshot(sid,oid));
 elsif p->>'kind'='void_order' then
  update public.orders set status='void',voided_at=p_at,voided_by_employee_id=p_actor,void_reason_code=p->>'reason',void_reason_note=nullif(private.trim_whitespace(p->>'reasonNote'),''),lock_version=lock_version+1 where store_id=sid and id=oid;
  return jsonb_build_object('kind',p->>'kind','order',private.order_snapshot(sid,oid));
 elsif p->>'kind'='pay_order_items' then
  update public.orders set order_no=(plan->>'nextNo')::numeric::integer where store_id=sid and id=oid;
  insert into public.orders(id,store_id,table_id,order_type,order_no,business_date,status,subtotal,total,employee_id,paid_at,created_by_employee_id,last_modified_by_employee_id,created_at,updated_at)
  values(paid_oid,sid,o.table_id,o.order_type,o.order_no,o.business_date,'paid',amount,amount,p_actor,p_at,p_actor,null,p_at,p_at);
  for line in select value from jsonb_array_elements(p->'lines') loop
   select i.* into item from public.order_items i where i.store_id=sid and i.id=(line->>'orderItemId')::uuid;
   if (line->>'quantity')::numeric::integer=item.quantity then
    update public.order_items set order_id=paid_oid where store_id=sid and id=item.id;
   else
    update public.order_items set quantity=quantity-(line->>'quantity')::numeric::integer where store_id=sid and id=item.id;
    insert into public.order_items(id,store_id,order_id,menu_item_id,item_name,quantity,unit_price,note,status,sort_order,created_at,updated_at)
    values((line->>'splitItemId')::uuid,sid,paid_oid,item.menu_item_id,item.item_name,(line->>'quantity')::numeric::integer,item.unit_price,item.note,item.status,item.sort_order,p_at,p_at);
    insert into public.order_item_options(id,store_id,order_item_id,option_value_id,option_name,price_delta,quantity,snapshot_sort_order,created_at,updated_at)
    select gen_random_uuid(),sid,(line->>'splitItemId')::uuid,v.option_value_id,v.option_name,v.price_delta,v.quantity,v.snapshot_sort_order,p_at,p_at from public.order_item_options v where v.store_id=sid and v.order_item_id=item.id;
   end if;
  end loop;
  update public.orders set subtotal=subtotal-amount,total=total-amount,lock_version=lock_version+1 where store_id=sid and id=oid;
 end if;
 insert into public.payments(id,store_id,order_id,employee_id,method,amount,received_amount,change_amount,paid_at,created_at,updated_at)
 values(payment_id,sid,paid_oid,p_actor,'cash',amount,(p->>'receivedAmount')::numeric::integer,(p->>'receivedAmount')::numeric::integer-amount,p_at,p_at,p_at);
 if p->>'kind'='pay_order' then
  update public.orders set status='paid',paid_at=p_at,lock_version=lock_version+1 where store_id=sid and id=oid;
  if o.table_id is not null then update public.tables set status='empty' where store_id=sid and id=o.table_id; end if;
 end if;
 receipt:=private.receipt_snapshot(sid,payment_id);
 update public.payments set receipt_snapshot=receipt where store_id=sid and id=payment_id;
 if p->>'kind'='pay_order' then
  return jsonb_build_object('kind',p->>'kind','order',private.order_snapshot(sid,oid),'payment',private.payment_snapshot(sid,payment_id),'receipt',receipt);
 end if;
 return jsonb_build_object('kind',p->>'kind','sourceOrder',private.order_snapshot(sid,oid),'paidOrder',private.order_snapshot(sid,paid_oid),'payment',private.payment_snapshot(sid,payment_id),'receipt',receipt);
end $$;

revoke all on all functions in schema private from public,anon,authenticated;

$permission_fragment_14$;
-- 16: supabase/migrations/016_activate_write_protocol.sql
 if clock_timestamp()>=least(started_at+interval '50 seconds','2026-10-22T10:00:00.000Z'::timestamptz) then raise exception 'STAGING_EXECUTION_WINDOW_CLOSED'; end if;
 execute $permission_fragment_15$-- One activation transaction: no old financial RPC or direct DML stays callable.


create function public.get_write_capabilities() returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog as $$
begin
 perform private.current_employee(false);
 return jsonb_build_object('writeProtocolVersion',1,'maxPayloadBytes',262144,'pendingTtlSeconds',86400);
exception when sqlstate 'P0401' then return private.write_failure(sqlerrm);
end $$;

create function public.register_write_operation(p_operation_id uuid,p_payload jsonb) returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog as $$
declare e public.employees; w public.write_operations; at_time timestamptz; permission text;
begin
 e:=private.current_employee(false);
 if not private.valid_write_payload(p_operation_id,p_payload) then return private.write_failure('INVALID_WRITE_REQUEST'); end if;
 permission:=private.write_permission(p_payload);
 perform pg_advisory_xact_lock(hashtext(auth.uid()::text||':pos-write'));
 select * into w from public.write_operations where store_id=auth.uid() and operation_id=p_operation_id for update;
 e:=private.current_employee(true);
 if not public.has_employee_permission(e.role,e.permission_overrides,coalesce(w.required_permission,permission)) then return private.write_failure('FORBIDDEN'); end if;
 if w.operation_id is not null then
  if w.payload<>p_payload then return private.write_failure('IDEMPOTENCY_KEY_REUSED'); end if;
 else
  at_time:=private.write_clock();
  if exists(select 1 from private.employee_sessions where store_id=auth.uid() and token_hash=private.employee_token_hash() and expires_at<=at_time) then return private.write_failure('EMPLOYEE_SESSION_REQUIRED'); end if;
  insert into public.write_operations(store_id,operation_id,schema_version,kind,action,required_permission,payload,registered_at,expires_at,initiated_by_employee_id)
  values(auth.uid(),p_operation_id,1,p_payload->>'kind',p_payload->>'action',permission,p_payload,at_time,at_time+interval '24 hours',e.id) returning * into w;
 end if;
 return jsonb_build_object('ok',true,'operation',private.operation_view(w));
exception when sqlstate 'P0401' then return private.write_failure(sqlerrm);
end $$;

create function private.write_operation_request(p_mode text,p_operation_id uuid,p_payload jsonb default null) returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog as $$
declare e public.employees; w public.write_operations; plan jsonb; business_result jsonb; business_error jsonb;
 at_time timestamptz; before_version integer; after_version integer;
begin
 e:=private.current_employee(false);
 if p_operation_id is null or p_operation_id='00000000-0000-0000-0000-000000000000'::uuid or
    (p_mode='execute' and not private.valid_write_payload(p_operation_id,p_payload)) then return private.write_failure('INVALID_WRITE_REQUEST'); end if;
 perform pg_advisory_xact_lock(hashtext(auth.uid()::text||':pos-write'));
 select * into w from public.write_operations where store_id=auth.uid() and operation_id=p_operation_id for update;
 if not found then return private.write_failure('OPERATION_NOT_FOUND'); end if;
 e:=private.current_employee(false);
 if not public.has_employee_permission(e.role,e.permission_overrides,w.required_permission) then return private.write_failure('FORBIDDEN'); end if;
 if p_mode='execute' and w.payload<>p_payload then return private.write_failure('IDEMPOTENCY_KEY_REUSED'); end if;
 if w.status<>'pending' then
  e:=private.current_employee(true);
  if not public.has_employee_permission(e.role,e.permission_overrides,w.required_permission) then return private.write_failure('FORBIDDEN'); end if;
  if p_mode='execute' then update public.write_operations set replay_count=replay_count+1 where store_id=w.store_id and operation_id=w.operation_id returning * into w; end if;
  return jsonb_build_object('ok',true,'operation',private.operation_view(w));
 end if;
 if p_mode='execute' then perform private.lock_write_input(w.payload); end if;
 e:=private.current_employee(true);
 if not public.has_employee_permission(e.role,e.permission_overrides,w.required_permission) then return private.write_failure('FORBIDDEN'); end if;
 if p_mode='execute' then
  -- Validation may be long. Record its known error, but expiry/auth at the final
  -- checkpoint take precedence. Nothing in this region writes business tables.
  begin plan:=private.prepare_write(w.payload);
  exception when sqlstate 'P0400' then business_error:=sqlerrm::jsonb;
  end;
 end if;
 at_time:=private.write_clock();
 -- A request can validate across midnight. Refresh its read-only create plan
 -- under the already-held store/catalog/numbering locks, then take a new final
 -- checkpoint. No numbering/financial effect or additional lock occurs here.
 while p_mode='execute' and w.action='create' and business_error is null and
       (plan->>'businessDate')::date is distinct from (at_time at time zone (plan->>'timezone'))::date loop
  begin plan:=private.prepare_write(w.payload);
  exception when sqlstate 'P0400' then business_error:=sqlerrm::jsonb;
  end;
  at_time:=private.write_clock();
 end loop;
 if exists(select 1 from private.employee_sessions where store_id=auth.uid() and token_hash=private.employee_token_hash() and expires_at<=at_time) then return private.write_failure('EMPLOYEE_SESSION_REQUIRED'); end if;
 if at_time>=w.expires_at then
  update public.write_operations set status='expired',decided_at=at_time where store_id=w.store_id and operation_id=w.operation_id returning * into w;
 elsif p_mode='cancel' then
  update public.write_operations set status='cancelled',decided_at=at_time,cancelled_by_employee_id=e.id where store_id=w.store_id and operation_id=w.operation_id returning * into w;
 elsif p_mode='execute' then
  if business_error is null then
   select lock_version into before_version from public.orders where store_id=w.store_id and id=w.order_id;
   begin
    business_result:=private.apply_write(w.payload,plan,e.id,at_time);
    select lock_version into after_version from public.orders where store_id=w.store_id and id=w.order_id;
    insert into public.order_events(id,store_id,operation_id,action,source_order_id,result_order_id,payment_id,initiated_by,executed_by,occurred_at,before_version,after_version,summary)
    values(gen_random_uuid(),w.store_id,w.operation_id,coalesce(w.action,w.kind),w.order_id,(w.payload->>'newOrderId')::uuid,(w.payload->>'paymentId')::uuid,
     w.initiated_by_employee_id,e.id,at_time,before_version,after_version,
     jsonb_build_object('kind',w.kind,'orderId',w.order_id,'resultOrderId',w.payload->>'newOrderId','paymentId',w.payload->>'paymentId',
      'total',coalesce(business_result#>'{order,total}',business_result#>'{paidOrder,total}')));
    update public.write_operations set status='applied',result=business_result,executed_by_employee_id=e.id,decided_at=at_time where store_id=w.store_id and operation_id=w.operation_id returning * into w;
   exception
    when sqlstate 'P0400' then business_error:=sqlerrm::jsonb;
    when unique_violation then business_error:=private.write_error('ENTITY_ID_CONFLICT');
   end;
  end if;
  if business_error is not null then
   -- This update is OUTSIDE the subtransaction, so a known rejection is durable
   -- while every earlier financial effect from that subtransaction rolled back.
   update public.write_operations set status='rejected',error=business_error,decided_at=at_time where store_id=w.store_id and operation_id=w.operation_id returning * into w;
  end if;
 end if;
 return jsonb_build_object('ok',true,'operation',private.operation_view(w));
exception when sqlstate 'P0401' then return private.write_failure(sqlerrm);
end $$;

create function public.execute_write_operation(p_operation_id uuid,p_payload jsonb) returns jsonb
language sql volatile security definer set search_path=pg_catalog as $$ select private.write_operation_request('execute',p_operation_id,p_payload) $$;
create function public.get_write_operation(p_operation_id uuid) returns jsonb
language sql volatile security definer set search_path=pg_catalog as $$ select private.write_operation_request('get',p_operation_id) $$;
create function public.cancel_write_operation(p_operation_id uuid) returns jsonb
language sql volatile security definer set search_path=pg_catalog as $$ select private.write_operation_request('cancel',p_operation_id) $$;

create function public.list_write_operations(p_order_id uuid default null,p_kinds text[] default null,p_statuses text[] default null,
 p_registered_from timestamptz default null,p_registered_to timestamptz default null,p_cursor text default null,p_limit integer default 50) returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog as $$
declare e public.employees; w public.write_operations; at_time timestamptz; cursor_value jsonb; scope text;
 cursor_at timestamptz; cursor_id uuid; next_cursor text; items jsonb:='[]'; item_count integer:=0; last_at timestamptz; last_id uuid;
begin
 e:=private.current_employee(false);
 if p_limit is null or p_limit not between 1 and 100 or char_length(p_cursor)>512 or
    (p_order_id is not null and not private.valid_uuid(to_jsonb(p_order_id))) or
    (p_registered_from is not null and not isfinite(p_registered_from)) or (p_registered_to is not null and not isfinite(p_registered_to)) or
    p_registered_from>p_registered_to or
    exists(select 1 from unnest(p_kinds) k where k is null or k not in('submit_order_changes','pay_order','pay_order_items','void_order')) or
    exists(select 1 from unnest(p_statuses) s where s is null or s not in('pending','applied','rejected','cancelled','expired')) then return private.write_failure('INVALID_WRITE_REQUEST'); end if;
 scope:=encode(extensions.digest(jsonb_build_object('store',auth.uid(),'order',p_order_id,'kinds',p_kinds,'statuses',p_statuses,'from',p_registered_from,'to',p_registered_to)::text,'sha256'),'hex');
 if p_cursor is not null then
  begin
   cursor_value:=convert_from(decode(p_cursor,'base64'),'UTF8')::jsonb;
   if not private.exact_fields(cursor_value,array['at','id','scope']) or cursor_value->>'scope' is distinct from scope or
      not private.valid_uuid(cursor_value->'id') or jsonb_typeof(cursor_value->'at') is distinct from 'string' then return private.write_failure('INVALID_WRITE_REQUEST'); end if;
   cursor_at:=(cursor_value->>'at')::timestamptz; cursor_id:=(cursor_value->>'id')::uuid;
   if not isfinite(cursor_at) then return private.write_failure('INVALID_WRITE_REQUEST'); end if;
  exception when invalid_text_representation or invalid_parameter_value or invalid_datetime_format or datetime_field_overflow or character_not_in_repertoire then return private.write_failure('INVALID_WRITE_REQUEST');
  end;
 end if;
 perform pg_advisory_xact_lock(hashtext(auth.uid()::text||':pos-write'));
 -- Lock pending rows before reading final permissions. A grant committed while
 -- waiting may make another kind visible; it must not introduce a new row wait
 -- after the clock checkpoint. Results/expiry still filter by current permission.
 for w in select x.* from public.write_operations x where x.store_id=auth.uid() and x.status='pending' order by x.operation_id for update loop null; end loop;
 e:=private.current_employee(true); at_time:=private.write_clock();
 if exists(select 1 from private.employee_sessions where store_id=auth.uid() and token_hash=private.employee_token_hash() and expires_at<=at_time) then return private.write_failure('EMPLOYEE_SESSION_REQUIRED'); end if;
 update public.write_operations x set status='expired',decided_at=at_time where x.store_id=auth.uid() and x.status='pending' and x.expires_at<=at_time and public.has_employee_permission(e.role,e.permission_overrides,x.required_permission);
 for w in select x.* from public.write_operations x where x.store_id=auth.uid()
  and public.has_employee_permission(e.role,e.permission_overrides,x.required_permission)
  and (p_order_id is null or x.order_id=p_order_id) and (p_kinds is null or x.kind=any(p_kinds))
  and (p_statuses is null or x.status::text=any(p_statuses)) and (p_registered_from is null or x.registered_at>=p_registered_from)
  and (p_registered_to is null or x.registered_at<=p_registered_to)
  and (cursor_at is null or (x.registered_at,x.operation_id)<(cursor_at,cursor_id))
  order by x.registered_at desc,x.operation_id desc limit p_limit+1 loop
  item_count:=item_count+1;
  if item_count>p_limit then
   next_cursor:=replace(encode(convert_to(jsonb_build_object('at',last_at,'id',last_id,'scope',scope)::text,'UTF8'),'base64'),E'\n',''); exit;
  end if;
  items:=items||jsonb_build_array(private.operation_view(w)); last_at:=w.registered_at; last_id:=w.operation_id;
 end loop;
 return jsonb_build_object('ok',true,'page',jsonb_build_object('items',items,'nextCursor',next_cursor,'serverTime',at_time));
exception when sqlstate 'P0401' then return private.write_failure(sqlerrm);
end $$;

-- Explicit history print lookup checks CURRENT paid state. The saved receipt is
-- returned unchanged; legacy metadata is visibly identified as reconstruction.
create function public.get_payment_receipt(p_order_id uuid) returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog as $$
declare e public.employees; o public.orders; p public.payments;
begin
 e:=private.current_employee(false);
 if not public.has_employee_permission(e.role,e.permission_overrides,'payment.take') then return private.write_failure('FORBIDDEN'); end if;
 select * into o from public.orders where store_id=auth.uid() and id=p_order_id;
 if not found or o.status<>'paid' then return private.write_failure('RECEIPT_UNAVAILABLE'); end if;
 select * into p from public.payments where store_id=auth.uid() and order_id=o.id order by paid_at desc,id desc limit 1;
 if not found then return private.write_failure('RECEIPT_UNAVAILABLE'); end if;
 return jsonb_build_object('ok',true,'receipt',coalesce(p.receipt_snapshot,private.receipt_snapshot(auth.uid(),p.id)),
 'legacyMetadata',p.receipt_snapshot is null);
exception when sqlstate 'P0401' then return private.write_failure(sqlerrm);
end $$;

-- RLS helper only answers whether the current token is an active administrator.
-- It has no caller-controlled employee ID and never returns credential material.
create function private.is_verified_admin() returns boolean
language plpgsql volatile security definer set search_path=pg_catalog as $$
declare e public.employees;
begin e:=private.current_employee(false); return e.role='admin';
exception when sqlstate 'P0401' then return false;
end $$;

create function private.catalog_statement_lock() returns trigger
language plpgsql security definer set search_path=pg_catalog as $$
begin
 if auth.uid() is not null then perform pg_advisory_xact_lock(hashtext(auth.uid()::text||':catalog-write')); end if;
 return null;
end $$;
do $$ declare relation text; pol record;
begin
 foreach relation in array array['categories','menu_items','option_groups','option_values','menu_item_option_groups','floor_areas','tables','floor_decor_items','employees','store_settings','stores'] loop
  for pol in select policyname from pg_policies where schemaname='public' and tablename=relation loop execute format('drop policy %I on public.%I',pol.policyname,relation); end loop;
  execute format('create policy tenant_select on public.%I for select to authenticated using (%I=auth.uid())',relation,case when relation='stores' then 'id' else 'store_id' end);
  execute format('create policy admin_insert on public.%I for insert to authenticated with check (%I=auth.uid() and private.is_verified_admin())',relation,case when relation='stores' then 'id' else 'store_id' end);
  execute format('create policy admin_update on public.%I for update to authenticated using (%I=auth.uid() and private.is_verified_admin()) with check (%I=auth.uid() and private.is_verified_admin())',relation,case when relation='stores' then 'id' else 'store_id' end,case when relation='stores' then 'id' else 'store_id' end);
  execute format('revoke all on public.%I from public,anon,authenticated',relation);
  if relation not in ('employees','stores','store_settings','tables') then
   execute format('grant select,insert,update on public.%I to authenticated',relation);
  end if;
 end loop;
 foreach relation in array array['categories','menu_items','option_groups','option_values','menu_item_option_groups'] loop
  execute format('create trigger catalog_lock_before_statement before insert or update or delete on public.%I for each statement execute function private.catalog_statement_lock()',relation);
 end loop;
end $$;

-- Immutable identity, including config entities. Column grants alone cannot
-- protect IDs when a generic admin editor/upsert supplies identity columns.
create function private.preserve_tenant_identity() returns trigger
language plpgsql set search_path=pg_catalog as $$
begin
 if new.id is distinct from old.id or new.store_id is distinct from old.store_id then raise exception 'FORBIDDEN' using errcode='42501'; end if;
 return new;
end $$;
do $$ declare relation text; begin
 foreach relation in array array['categories','menu_items','option_groups','option_values','menu_item_option_groups','floor_areas','tables','floor_decor_items','employees'] loop
  execute format('create trigger identity_immutable before update on public.%I for each row execute function private.preserve_tenant_identity()',relation);
 end loop;
end $$;

grant select(id,store_id,name,role,is_active,seed_key,created_at,updated_at,permission_overrides) on public.employees to authenticated;
grant update(name,role,is_active,permission_overrides) on public.employees to authenticated;
grant select on public.stores,public.store_settings,public.tables to authenticated;
grant update(name,seed_status,is_active) on public.stores to authenticated;
grant update(display_name,address,currency,timezone,bill_footer,qr_info) on public.store_settings to authenticated;
grant insert(id,store_id,area_id,name,background_asset_key,pos_x,pos_y,width,height,shape,rotation,seats,sort_order,seed_key,deleted_at,deleted_by_employee_id) on public.tables to authenticated;
grant update(area_id,name,background_asset_key,pos_x,pos_y,width,height,shape,rotation,seats,sort_order,seed_key,deleted_at,deleted_by_employee_id) on public.tables to authenticated;

-- The legacy clear endpoint keeps its signature so existing admin flows can
-- migrate without relying on an employee ID as authentication.
create or replace function public.clear_demo_data(p_employee_id uuid) returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog as $$
declare actor uuid; relation text; affected integer; result jsonb:=jsonb_build_object('cleared',true);
begin
 perform pg_advisory_xact_lock(hashtext(auth.uid()::text||':pos-write'));
 perform pg_advisory_xact_lock(hashtext(auth.uid()::text||':catalog-write'));
 actor:=private.require_admin();
 if actor is distinct from p_employee_id then return private.write_failure('FORBIDDEN'); end if;
 if exists(select 1 from public.orders where store_id=auth.uid() and status='open') then raise exception 'OPEN_ORDERS_EXIST' using errcode='P0001'; end if;
 foreach relation in array array['menu_item_option_groups','option_values','option_groups','menu_items','categories','floor_decor_items','tables','floor_areas'] loop
  execute format('update public.%I set deleted_at=private.write_clock(),deleted_by_employee_id=$1 where store_id=$2 and seed_key is not null and deleted_at is null',relation) using actor,auth.uid();
  get diagnostics affected=row_count;
  result:=result||jsonb_build_object(case relation when 'menu_item_option_groups' then 'menuItemOptionGroups' when 'option_values' then 'optionValues' when 'option_groups' then 'optionGroups' when 'menu_items' then 'menuItems' when 'floor_decor_items' then 'decorItems' when 'floor_areas' then 'floorAreas' else relation end,affected);
 end loop;
 update public.employees set is_active=false where store_id=auth.uid() and seed_key is not null and role<>'admin' and is_active;
 get diagnostics affected=row_count;
 return result||jsonb_build_object('deactivatedEmployees',affected);
exception when sqlstate 'P0401' then return private.write_failure(sqlerrm);
end $$;

-- Financial SELECT remains store-scoped, but every mutation is private.
revoke insert,update,delete,truncate,references,trigger on public.orders,public.order_items,public.order_item_options,public.payments from public,anon,authenticated;
revoke all on public.write_operations,public.order_events from public,anon,authenticated;
revoke all on all functions in schema private from public,anon,authenticated;
grant usage on schema private to authenticated;
grant execute on function private.is_verified_admin() to authenticated;
-- Keep every historical overload blocked, not just the newest SQL signatures.
do $$ declare f record; begin
 for f in select p.oid::regprocedure signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public'
 and p.proname in ('submit_order_changes','pay_order','pay_order_items','void_order','verify_employee_pin','hash_employee_pin') loop
  execute format('revoke all on function %s from public,anon,authenticated',f.signature);
 end loop;
 for f in select p.oid::regprocedure signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public'
 and p.proname in ('get_write_capabilities','register_write_operation','execute_write_operation','get_write_operation','list_write_operations','cancel_write_operation','start_employee_session','revoke_employee_session','bootstrap_store','create_employee','seed_employee','reset_employee_pin','get_payment_receipt','clear_demo_data') loop
  execute format('revoke all on function %s from public,anon,authenticated',f.signature);
  execute format('grant execute on function %s to authenticated',f.signature);
  -- Wire timestamps are always UTC even if a request changes its DB timezone.
  execute format('alter function %s set timezone = %L',f.signature,'UTC');
 end loop;
end $$;
-- Auth-less calls can obtain a structured AUTH_REQUIRED, never business data.
grant execute on function public.get_write_capabilities(),public.start_employee_session(uuid,text),public.register_write_operation(uuid,jsonb),public.execute_write_operation(uuid,jsonb),public.get_write_operation(uuid),public.cancel_write_operation(uuid),public.list_write_operations(uuid,text[],text[],timestamptz,timestamptz,text,integer) to anon;

notify pgrst,'reload schema';

$permission_fragment_15$;
 tenant_count:=0;
 for relation_row in with recursive tenant_relations(oid) as (
 select c.oid from pg_class c join pg_namespace n on n.oid=c.relnamespace
 where c.relkind in ('r','p') and n.nspname in ('public','private') and
 (n.nspname='public' and c.relname='stores' or exists(select 1 from pg_attribute a
 where a.attrelid=c.oid and a.attname='store_id' and a.attnum>0 and not a.attisdropped))
 union select child.oid from tenant_relations parent
 join pg_constraint fk on fk.confrelid=parent.oid and fk.contype='f'
 join pg_class child on child.oid=fk.conrelid join pg_namespace ns on ns.oid=child.relnamespace
 where child.relkind in ('r','p') and ns.nspname in ('public','private')
) select n.nspname schema_name,c.relname relation_name from tenant_relations t
 join pg_class c on c.oid=t.oid join pg_namespace n on n.oid=c.relnamespace order by 1,2 loop
  tenant_count:=tenant_count+1;
  if not (relation_row.schema_name||'.'||relation_row.relation_name=any(array['private.employee_sessions','public.categories','public.employees','public.floor_areas','public.floor_decor_items','public.menu_item_option_groups','public.menu_items','public.option_groups','public.option_values','public.order_events','public.order_item_options','public.order_items','public.orders','public.payments','public.store_settings','public.stores','public.tables','public.write_operations'])) then raise exception 'STAGING_TENANT_SCHEMA_DRIFT'; end if;
  execute format('select exists(select 1 from %I.%I)',relation_row.schema_name,relation_row.relation_name) into has_rows;
  if has_rows then raise exception 'STAGING_TENANT_NOT_EMPTY'; end if;
 end loop;
 if tenant_count<>18 then raise exception 'STAGING_TENANT_SCHEMA_DRIFT'; end if;
 -- 17: supabase/candidate/permission-compatibility-prepare.sql
 if clock_timestamp()>=least(started_at+interval '50 seconds','2026-10-22T10:00:00.000Z'::timestamptz) then raise exception 'STAGING_EXECUTION_WINDOW_CLOSED'; end if;
 execute $permission_fragment_16$-- PERM-30 compatibility preparation. Install while the old client is still
-- allowed: the singleton starts in pass-through mode and activation flips it.

create table if not exists private.permission_contract_gate (
 singleton boolean primary key default true check (singleton),
 strict boolean not null default false,
 contract_version integer not null default 2 check (contract_version=2)
);
insert into private.permission_contract_gate(singleton,strict,contract_version)
values(true,false,2) on conflict(singleton) do nothing;

-- An older preparation must never silently accept its previous client marker.
-- Release preflight must resolve that drift before this candidate is activated.
do $$ begin
 if exists(select 1 from private.permission_contract_gate where contract_version<>2) then
  raise exception 'PERMISSION_CONTRACT_VERSION_MISMATCH';
 end if;
end $$;

create or replace function private.assert_permission_contract() returns void
language plpgsql volatile security definer set search_path=pg_catalog as $$
declare
 strict_mode boolean;
 required_version integer;
 headers jsonb;
 claims jsonb;
 request_role text;
 path text:=nullif(current_setting('request.path',true),'');
 marker text;
begin
 select g.strict,g.contract_version into strict_mode,required_version from private.permission_contract_gate g where singleton;
 perform set_config('response.headers',
  (coalesce(nullif(current_setting('response.headers',true),'')::jsonb,'[]'::jsonb)||
   jsonb_build_array(jsonb_build_object('X-Pos-Permission-Hook',case when strict_mode then 'strict' else 'pass-through' end)))::text,true);
 -- A missing/corrupt singleton must fail closed. Only the explicit prepared
 -- value false is pass-through.
 if strict_mode=false then return; end if;
 -- SECURITY DEFINER changes current_role. PostgREST's transaction-scoped JWT
 -- claims are populated only after signature verification and preserve the
 -- impersonated request role across this call.
 begin claims:=nullif(current_setting('request.jwt.claims',true),'')::jsonb;
 exception when others then claims:='{}'::jsonb;
 end;
 request_role:=coalesce(claims->>'role','anon');
 if request_role not in ('anon','authenticated') then return; end if;
 -- Safe, public discovery is the only Data API exception.
 if path='/rpc/permission_get_contract' then return; end if;
 begin headers:=nullif(current_setting('request.headers',true),'')::jsonb;
 exception when others then headers:='{}'::jsonb;
 end;
 marker:=headers->>'x-pos-permission-contract';
 if strict_mode is null or marker is distinct from required_version::text then
  raise sqlstate 'PGRST' using
   message='{"code":"WRITE_PROTOCOL_UNSUPPORTED","message":"Phiên bản ứng dụng chưa tương thích. Vui lòng tải phiên bản mới trước khi tiếp tục.","details":null,"hint":null}',
   detail='{"status":426,"headers":{}}';
 end if;
end $$;

create or replace function public.permission_contract_pre_request() returns void
language sql volatile security definer set search_path=pg_catalog as $$
 select private.assert_permission_contract()
$$;

-- Deliberately inert: only PostgREST's configured pre-request hook may add the
-- routing marker. Calling the hook itself would produce a false-positive probe.
create or replace function public.permission_contract_probe() returns boolean
language sql stable security invoker set search_path=pg_catalog as $$ select true $$;

revoke all on table private.permission_contract_gate from public,anon,authenticated,service_role;
revoke all on function private.assert_permission_contract() from public,anon,authenticated,service_role;
revoke all on function public.permission_contract_pre_request() from public,anon,authenticated,service_role;
grant execute on function public.permission_contract_pre_request() to anon,authenticated,service_role;
revoke all on function public.permission_contract_probe() from public,anon,authenticated,service_role;
grant execute on function public.permission_contract_probe() to anon,authenticated,service_role;

do $$
declare configured text;
begin
 select split_part(setting,'=',2) into configured
 from pg_db_role_setting s join pg_roles r on r.oid=s.setrole,
 lateral unnest(s.setconfig) setting
 where r.rolname='authenticator' and setting like 'pgrst.db_pre_request=%';
 if configured is not null and configured not in ('','public.permission_contract_pre_request') then
  raise exception 'UNEXPECTED_DB_PRE_REQUEST:%',configured;
 end if;
 execute 'alter role authenticator set pgrst.db_pre_request to ''public.permission_contract_pre_request''';
end $$;
notify pgrst,'reload config';
notify pgrst,'reload schema';
$permission_fragment_16$;
-- 18: supabase/migrations/017_permission_catalog_bridge.sql
 if clock_timestamp()>=least(started_at+interval '50 seconds','2026-10-22T10:00:00.000Z'::timestamptz) then raise exception 'STAGING_EXECUTION_WINDOW_CLOSED'; end if;
 execute $permission_fragment_17$-- PERM-T02: additive catalog and legacy bridge. No candidate activation.


create table public.permission_roles (
 code text primary key check(code in ('owner','manager','cashier','waiter','kitchen')),
 label_vi text not null check(length(label_vi)>0),
 enabled boolean not null,
 selectable boolean not null,
 check(enabled = (code <> 'kitchen')),
 check(selectable = (code in ('manager','cashier','waiter')))
);
create table public.permission_catalog (
 code text primary key check(code in ('floor.view','order.create','order.update','order.voidOpen',
  'payment.take','orderHistory.view','order.voidPaid','menu.manage','floor.manage','employee.manage',
  'employee.permission.edit','report.view','settings.manage','data.clearDemo','receipt.reprint')),
 label_vi text not null check(length(label_vi)>0),
 module text not null,
 owner_only boolean not null default false check(owner_only = (code='data.clearDemo')),
 baseline boolean not null default false check(baseline = (code='floor.view'))
);
create table public.role_permission_defaults (
 role_code text not null references public.permission_roles(code),
 permission_code text not null references public.permission_catalog(code),
 primary key(role_code,permission_code),
 check(role_code <> 'kitchen'),
 check(permission_code <> 'data.clearDemo' or role_code='owner')
);
create table public.permission_catalog_state (
 singleton boolean primary key default true check(singleton),
 revision bigint not null default 0 check(revision>=0),
 changed_in_transaction xid8
);
alter table public.employees add column permission_revision bigint not null default 0 check(permission_revision>=0);

insert into public.permission_roles values
 ('owner','Chủ quán',true,false), ('manager','Quản lý',true,true),
 ('cashier','Thu ngân',true,true), ('waiter','Phục vụ',true,true), ('kitchen','Bếp',false,false);
insert into public.permission_catalog(code,label_vi,module,owner_only,baseline) values
 ('floor.view','Xem sơ đồ bàn','floor',false,true),
 ('order.create','Tạo đơn','order',false,false),
 ('order.update','Sửa đơn mở','order',false,false),
 ('order.voidOpen','Hủy đơn mở','order',false,false),
 ('payment.take','Thu tiền','payment',false,false),
 ('orderHistory.view','Xem lịch sử đơn','orderHistory',false,false),
 ('order.voidPaid','Hủy đơn đã thanh toán','orderHistory',false,false),
 ('menu.manage','Quản lý thực đơn','menuEditor',false,false),
 ('floor.manage','Điều chỉnh sơ đồ bàn','floorEditor',false,false),
 ('employee.manage','Quản lý nhân viên','employees',false,false),
 ('employee.permission.edit','Chỉnh quyền nhân viên','employees',false,false),
 ('report.view','Xem báo cáo','report',false,false),
 ('settings.manage','Quản lý thiết lập','settings',false,false),
 ('data.clearDemo','Xóa dữ liệu mẫu','clearDemo',true,false),
 ('receipt.reprint','In lại hóa đơn','receipt',false,false);
insert into public.role_permission_defaults select 'owner',code from public.permission_catalog;
insert into public.role_permission_defaults select 'manager',code from public.permission_catalog
 where code not in ('employee.permission.edit','settings.manage','data.clearDemo');
insert into public.role_permission_defaults values
 ('cashier','floor.view'),('cashier','order.create'),('cashier','order.update'),('cashier','order.voidOpen'),
 ('cashier','payment.take'),('cashier','orderHistory.view'),('cashier','receipt.reprint'),
 ('waiter','floor.view'),('waiter','order.create'),('waiter','order.update');
insert into public.permission_catalog_state(singleton) values(true);

-- Rows serialize catalog maintenance. A transaction with actual row changes
-- increments once; a no-op UPDATE leaves the revision untouched.
create function private.permission_catalog_lock() returns trigger
language plpgsql security definer set search_path=pg_catalog as $$
begin
 perform 1 from public.permission_catalog_state where singleton for update;
 if not found then raise exception 'PERMISSION_CATALOG_INVALID' using errcode='23514'; end if;
 return null;
end $$;
create function private.permission_catalog_changed() returns trigger
language plpgsql security definer set search_path=pg_catalog as $$
begin
 if tg_op='UPDATE' and new is not distinct from old then return null; end if;
 update public.permission_catalog_state set revision=revision+1,changed_in_transaction=pg_current_xact_id()
 where singleton and changed_in_transaction is distinct from pg_current_xact_id();
 if not exists(select from public.permission_catalog_state where singleton) then
  raise exception 'PERMISSION_CATALOG_INVALID' using errcode='23514';
 end if;
 return null;
end $$;
create function private.permission_catalog_validate() returns trigger
language plpgsql security definer set search_path=pg_catalog as $$
begin
 if (select count(*) from public.permission_roles)<>5 or (select count(*) from public.permission_catalog)<>15
 or (select count(*) from public.permission_catalog_state)<>1
 or (select count(*) from public.role_permission_defaults where role_code='owner')<>15
 or (select count(*) from public.role_permission_defaults where permission_code='floor.view')<>4 then
  raise exception 'PERMISSION_CATALOG_INVALID' using errcode='23514';
 end if;
 return null;
end $$;
create function private.permission_catalog_no_truncate() returns trigger
language plpgsql set search_path=pg_catalog as $$
begin raise exception 'PERMISSION_CATALOG_INVALID' using errcode='23514'; end $$;
do $$ declare t text; begin
 foreach t in array array['permission_roles','permission_catalog','role_permission_defaults'] loop
  execute format('create trigger catalog_lock before insert or update or delete on public.%I for each statement execute function private.permission_catalog_lock()',t);
  execute format('create trigger catalog_revision after insert or update or delete on public.%I for each row execute function private.permission_catalog_changed()',t);
  execute format('create constraint trigger catalog_invariant after insert or update or delete on public.%I deferrable initially deferred for each row execute function private.permission_catalog_validate()',t);
  execute format('create trigger catalog_no_truncate before truncate on public.%I execute function private.permission_catalog_no_truncate()',t);
 end loop;
end $$;
create constraint trigger catalog_state_invariant after insert or update or delete on public.permission_catalog_state
 deferrable initially deferred for each row execute function private.permission_catalog_validate();
create trigger catalog_no_truncate before truncate on public.permission_catalog_state
 for each statement execute function private.permission_catalog_no_truncate();

-- T05 will consume these registries through authenticated, audited RPCs.
-- No client, service wrapper or publication gets direct registry/key access.
create table private.permission_request_mac_keys (
 key_version integer primary key check(key_version>0),
 secret_bytes bytea not null check(octet_length(secret_bytes)>=32)
);
insert into private.permission_request_mac_keys values(1,extensions.gen_random_bytes(32));
create table private.employee_admin_requests (
 store_id uuid not null references public.stores(id),
 actor_type text not null check(actor_type in ('employee','recovery')),
 actor_key text not null check(length(actor_key)>0),
 request_id uuid not null,
 kind text not null,
 payload_mac bytea not null check(octet_length(payload_mac)=32),
 mac_key_version integer not null references private.permission_request_mac_keys(key_version),
 terminal_outcome jsonb not null,
 audit_keys jsonb not null default '[]' check(jsonb_typeof(audit_keys)='array'),
 primary key(store_id,actor_type,actor_key,request_id)
);
create table private.bootstrap_requests (
 store_id uuid not null references public.stores(id), request_id uuid not null, owner_id uuid not null,
 canonical_input jsonb not null check(jsonb_typeof(canonical_input)='object'),
 outcome jsonb not null,
 primary key(store_id,request_id)
);

-- Internal legacy catalog is intentionally separate from the five candidate roles.
-- Removing admin, denying kitchen overrides or activating new defaults here would
-- change phase-27 semantics. T16 removes this bridge after consumer migration.
create table private.legacy_permission_roles (
 code public.employee_role primary key, modules text[] not null, enabled_in_ui boolean not null
);
create table private.legacy_permission_catalog (code text primary key);
create table private.legacy_permission_defaults (
 role_code public.employee_role references private.legacy_permission_roles(code),
 permission_code text references private.legacy_permission_catalog(code),
 primary key(role_code,permission_code)
);
insert into private.legacy_permission_roles values
 ('admin',array['floor','order','payment','orderHistory','menuEditor','floorEditor','employees','report','settings','clearDemo','kitchen'],true),
 ('cashier',array['floor','order','payment','orderHistory'],true),('kitchen',array['kitchen'],false);
insert into private.legacy_permission_catalog values
 ('order.create'),('order.update'),('order.voidOpen'),('payment.take'),('order.voidPaid');
insert into private.legacy_permission_defaults select 'admin',code from private.legacy_permission_catalog;
insert into private.legacy_permission_defaults select 'cashier',code from private.legacy_permission_catalog where code<>'order.voidPaid';

create function private.legacy_has_employee_permission(p_role public.employee_role,p_overrides jsonb,p_permission text)
returns boolean language sql stable security definer set search_path=pg_catalog as $$
 select case
  when jsonb_exists(coalesce(p_overrides->'denies','[]'::jsonb),p_permission) then false
  when jsonb_exists(coalesce(p_overrides->'grants','[]'::jsonb),p_permission) then true
  when p_permission is null and p_role in ('admin','cashier') then null
  else exists(select from private.legacy_permission_defaults where role_code=p_role and permission_code=p_permission)
 end
$$;
create or replace function public.has_employee_permission(p_role public.employee_role,p_overrides jsonb,p_permission text)
returns boolean language sql stable security definer set search_path=pg_catalog as $$
 select private.legacy_has_employee_permission(p_role,p_overrides,p_permission)
$$;
create function private.legacy_permission_snapshot(p_role public.employee_role,p_overrides jsonb,p_active boolean)
returns jsonb language sql stable security definer set search_path=pg_catalog as $$
 with rights as (select coalesce(jsonb_agg(code order by code),'[]'::jsonb) codes from private.legacy_permission_catalog
 where private.legacy_has_employee_permission(p_role,p_overrides,code))
 select jsonb_build_object('configuredEffective',rights.codes,'activeGuard',coalesce(p_active,false),
 'actionPermissions',case when p_active then rights.codes else '[]'::jsonb end,
 'accessibleModules',case when p_active then to_jsonb(r.modules) else '[]'::jsonb end,
 'roleEnabledInUi',r.enabled_in_ui) from rights cross join private.legacy_permission_roles r where r.code=p_role
$$;

create function private.normalize_permission_overrides(p_role text,p_overrides jsonb)
returns jsonb language plpgsql stable security definer set search_path=pg_catalog as $$
declare grants text[]; denies text[]; defaults text[]; normalized_grants text[]; normalized_denies text[];
begin
 if not exists(select from public.permission_roles where code=p_role) then
  raise exception 'INVALID_EMPLOYEE_REQUEST' using errcode='22023';
 end if;
 if p_overrides is null or p_overrides='null'::jsonb then return null; end if;
 if jsonb_typeof(p_overrides)<>'object' then raise exception 'INVALID_EMPLOYEE_REQUEST' using errcode='22023'; end if;
 if not(p_overrides ?& array['grants','denies']) or (p_overrides-array['grants','denies'])<>'{}'::jsonb
 or jsonb_typeof(p_overrides->'grants')<>'array' or jsonb_typeof(p_overrides->'denies')<>'array' then
  raise exception 'INVALID_EMPLOYEE_REQUEST' using errcode='22023';
 end if;
 if jsonb_array_length(p_overrides->'grants')>100 or jsonb_array_length(p_overrides->'denies')>100 then
  raise exception 'INVALID_EMPLOYEE_REQUEST' using errcode='22023';
 end if;
 if exists(select from jsonb_array_elements((p_overrides->'grants')||(p_overrides->'denies')) x
  where jsonb_typeof(x)<>'string' or not exists(select from public.permission_catalog c where c.code=x#>>'{}')) then
  raise exception 'INVALID_EMPLOYEE_REQUEST' using errcode='22023';
 end if;
 select coalesce(array_agg(distinct x order by x),'{}') into grants from jsonb_array_elements_text(p_overrides->'grants') x;
 select coalesce(array_agg(distinct x order by x),'{}') into denies from jsonb_array_elements_text(p_overrides->'denies') x;
 if exists(select from public.permission_catalog where baseline and code=any(denies)) then
  raise exception 'PERMISSION_BASELINE_REQUIRED' using errcode='22023';
 end if;
 if p_role<>'owner' and exists(select from public.permission_catalog where owner_only and code=any(grants)) then
  raise exception 'OWNER_ONLY_PERMISSION' using errcode='22023';
 end if;
 select coalesce(array_agg(permission_code),'{}') into defaults from public.role_permission_defaults where role_code=p_role;
 select coalesce(array_agg(x order by x),'{}') into normalized_grants from unnest(grants) x where not(x=any(defaults) or x=any(denies));
 select coalesce(array_agg(x order by x),'{}') into normalized_denies from unnest(denies) x where x=any(defaults);
 if cardinality(normalized_grants)+cardinality(normalized_denies)=0 then return null; end if;
 return jsonb_build_object('grants',to_jsonb(normalized_grants),'denies',to_jsonb(normalized_denies));
end $$;
create function private.configured_employee_permissions(p_role text,p_overrides jsonb)
returns text[] language plpgsql stable security definer set search_path=pg_catalog as $$
declare normalized jsonb; result text[];
begin
 normalized:=private.normalize_permission_overrides(p_role,p_overrides);
 select coalesce(array_agg(c.code order by c.code),'{}') into result from public.permission_catalog c
 where (exists(select from public.role_permission_defaults d where d.role_code=p_role and d.permission_code=c.code)
 or coalesce(normalized->'grants','[]'::jsonb) ? c.code)
 and not(coalesce(normalized->'denies','[]'::jsonb) ? c.code);
 return result;
end $$;

-- Harden only new objects; existing grants and employee policies remain intact.
do $$ declare t text; f regprocedure; begin
 foreach t in array array['permission_roles','permission_catalog','role_permission_defaults','permission_catalog_state'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from public,anon,authenticated,service_role',t);
 end loop;
 foreach t in array array['permission_request_mac_keys','employee_admin_requests','bootstrap_requests',
  'legacy_permission_roles','legacy_permission_catalog','legacy_permission_defaults'] loop
  execute format('revoke all on private.%I from public,anon,authenticated,service_role',t);
 end loop;
 for f in select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='private' and p.proname in ('permission_catalog_lock','permission_catalog_changed','permission_catalog_validate','permission_catalog_no_truncate',
  'legacy_has_employee_permission','legacy_permission_snapshot','normalize_permission_overrides','configured_employee_permissions') loop
  execute format('revoke all on function %s from public,anon,authenticated,service_role',f);
 end loop;
end $$;

$permission_fragment_17$;
-- 19: controller:employees.role-to-text
 if clock_timestamp()>=least(started_at+interval '50 seconds','2026-10-22T10:00:00.000Z'::timestamptz) then raise exception 'STAGING_EXECUTION_WINDOW_CLOSED'; end if;
 execute $permission_fragment_18$alter table public.employees alter column role type text using role::text$permission_fragment_18$;
-- 20: supabase/candidate/permission-identity.sql
 if clock_timestamp()>=least(started_at+interval '50 seconds','2026-10-22T10:00:00.000Z'::timestamptz) then raise exception 'STAGING_EXECUTION_WINDOW_CLOSED'; end if;
 execute $permission_fragment_19$-- PERM-T04 candidate fragment. NOT an automatic migration or activation launcher.
-- Install transactionally only after approved role mapping to text (T16).
-- No grants to legacy functions are restored. Fixture staging is separate.
do $$ begin
 if (select udt_name from information_schema.columns where table_schema='public' and table_name='employees' and column_name='role') <> 'text'
 or exists(select 1 from public.employees e left join public.permission_roles r on r.code=e.role where r.code is null)
 or exists(select 1 from public.stores s where (select count(*) from public.employees e where e.store_id=s.id and e.role='owner' and e.is_active)<>1)
 then raise exception 'OWNER_MIGRATION_REVIEW_REQUIRED'; end if;
end $$;

alter table public.employees add constraint employees_permission_role_fk foreign key(role) references public.permission_roles(code);
alter table public.employees add constraint employees_owner_active check(role<>'owner' or is_active);
alter table public.employees add column pin_change_required boolean not null default false;
alter table public.employees add constraint employees_pin_change_owner check(not pin_change_required or role='owner');
alter table private.employee_sessions drop constraint employee_sessions_check;
alter table private.employee_sessions add column purpose text not null default 'normal'
 check(purpose in ('normal','required_pin_change'));
alter table private.employee_sessions add column employee_revision bigint not null default 0
 check(employee_revision between 0 and 9007199254740991);
alter table private.employee_sessions add constraint employee_sessions_purpose_ttl check(
 (purpose='normal' and expires_at=issued_at+interval '12 hours') or
 (purpose='required_pin_change' and expires_at=issued_at+interval '5 minutes'));
create unique index employees_one_owner on public.employees(store_id) where role='owner';
create function private.assert_store_owner() returns trigger
language plpgsql security definer set search_path=pg_catalog as $$
declare sid uuid; stores uuid[];
begin
 if tg_table_name='stores' then
  stores:=array[case when tg_op<>'DELETE' then new.id end,case when tg_op<>'INSERT' then old.id end];
 else
  stores:=array[case when tg_op<>'DELETE' then new.store_id end,case when tg_op<>'INSERT' then old.store_id end];
 end if;
 for sid in select distinct x from unnest(stores) x where x is not null loop
  if exists(select 1 from public.stores where id=sid) and
     (select count(*) from public.employees where store_id=sid and role='owner' and is_active)<>1 then
   raise exception 'OWNER_PROTECTED' using errcode='23514';
  end if;
 end loop;
 return null;
end $$;
create constraint trigger employees_owner_boundary after insert or update or delete on public.employees
 deferrable initially deferred for each row execute function private.assert_store_owner();
create constraint trigger stores_owner_boundary after insert or update or delete on public.stores
 deferrable initially deferred for each row execute function private.assert_store_owner();

-- Audit has no cascading business/employee FK. No secret, PIN digest or request MAC.
create table public.employee_admin_audit (
 store_id uuid not null, actor_type text not null check(actor_type in ('employee','operator')),
 actor_key text not null, request_id uuid not null, target_id uuid not null,
 kind text not null, outcome text not null check(outcome in ('applied','noop','denied')), reason text,
 before_snapshot jsonb, proposed_after jsonb, actual_after jsonb, actor_effective text[] not null,
 catalog_revision bigint not null, credential_changed boolean not null default false,
 operator_case_ref text, operator_proof_ref text, occurred_at timestamptz not null,
 primary key(store_id,actor_type,actor_key,request_id,target_id)
);
create table public.store_change_signals (
 store_id uuid not null, topic text not null, revision bigint not null check(revision>=0),
 event_id uuid not null, target_id uuid, primary key(store_id,topic)
);
alter table public.employee_admin_audit enable row level security;
alter table public.store_change_signals enable row level security;
revoke all on public.employee_admin_audit,public.store_change_signals from public,anon,authenticated,service_role;
alter table private.employee_admin_requests drop constraint employee_admin_requests_actor_type_check;
alter table private.employee_admin_requests add check(actor_type in ('employee','operator'));

-- Reservation exists before Auth/signup and therefore contains no tenant secret.
create table private.store_no_reservations (
 request_id uuid primary key,
 store_no integer not null unique check(store_no between 1 and 2147483647),
 created_at timestamptz not null
);
create table private.initial_seed_workflows (
 workflow_id uuid primary key,
 store_id uuid not null unique references public.stores(id) on delete cascade,
 requested boolean not null,
 template_version integer not null check(template_version=1),
 status text not null check(status in ('skipped','pending','in_progress','needs_retry','completed')),
 workflow_revision bigint not null default 0 check(workflow_revision between 0 and 9007199254740991),
 auto_claimed_at timestamptz,
 run_generation bigint not null default 0 check(run_generation between 0 and 9007199254740991),
 last_error_code text check(last_error_code in ('ENTITY_ID_CONFLICT','PERMISSION_UPDATE_UNAVAILABLE')),
 created_at timestamptz not null,
 updated_at timestamptz not null
);
create table private.initial_seed_stages (
 workflow_id uuid not null references private.initial_seed_workflows(workflow_id) on delete cascade,
 stage text not null check(stage in ('employee','menu','floor')),
 stage_id uuid not null unique,
 status text not null default 'pending' check(status in ('pending','committed')),
 committed_at timestamptz,
 receipt jsonb,
 primary key(workflow_id,stage),
 check((status='pending' and committed_at is null and receipt is null) or
       (status='committed' and committed_at is not null and jsonb_typeof(receipt)='object'))
);

-- Match ECMAScript trim in the candidate input parser, including non-ASCII spaces.
create function private.permission_trim(value text) returns text
language sql immutable set search_path=pg_catalog as $$
 select btrim(value,U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF')
$$;
create function private.permission_stable_uuid(namespace uuid,value text) returns uuid
language plpgsql immutable strict set search_path=pg_catalog as $$
declare h text:=encode(extensions.digest(convert_to(namespace::text||':'||value,'UTF8'),'sha256'),'hex');
begin
 h:=substr(h,1,12)||'5'||substr(h,14,3)||case when substr(h,17,1) in ('0','1','2','3') then '8' when substr(h,17,1) in ('4','5','6','7') then '9' when substr(h,17,1) in ('8','9','a','b') then 'a' else 'b' end||substr(h,18,15);
 return (substr(h,1,8)||'-'||substr(h,9,4)||'-'||substr(h,13,4)||'-'||substr(h,17,4)||'-'||substr(h,21,12))::uuid;
end $$;
create function private.permission_failure(code text,context text default null) returns jsonb
language sql immutable set search_path=pg_catalog as $$
 select case when code='INVALID_PIN' and context='self_pin' then
  jsonb_build_object('ok',false,'error',jsonb_build_object('code',code,'message','PIN hiện tại không đúng.','details',null))
 else jsonb_build_object('ok',false,'error',jsonb_build_object('code',code,'details',null,'message',case code
  when 'INVALID_EMPLOYEE_REQUEST' then 'Thông tin nhân viên không hợp lệ. Kiểm tra các trường được đánh dấu.'
  when 'EMPLOYEE_ROLE_UNAVAILABLE' then 'Vai trò này chưa được hỗ trợ trên ứng dụng.'
  when 'OWNER_PROTECTED' then 'Không thể thay đổi chủ quán bằng thao tác này.'
   when 'EMPLOYEE_VERSION_CONFLICT' then 'PIN hoặc trạng thái tài khoản đã thay đổi. Vui lòng đăng nhập lại.'
   when 'ADMIN_REQUEST_REUSED' then 'Mã yêu cầu đã được dùng cho nội dung khác.'
   when 'PIN_CHANGE_REQUIRED' then 'Bạn cần đổi PIN tạm trước khi sử dụng quán.'
   when 'PIN_REUSE_NOT_ALLOWED' then 'PIN mới phải khác PIN tạm đang dùng.'
   when 'INITIAL_SEED_ATTEMPT_STALE' then 'Tiến trình dữ liệu mẫu đã thay đổi. Kiểm tra trạng thái trước khi thử lại.'
   when 'ENTITY_ID_CONFLICT' then 'Dữ liệu hiện có trùng với dữ liệu mẫu. Đã dừng để giữ các thay đổi của quán.'
  when 'PERMISSION_UPDATE_UNAVAILABLE' then 'Chưa thể xác nhận thay đổi. Kiểm tra kết quả trước khi thử lại.'
  when 'OWNER_RECOVERY_REVIEW_REQUIRED' then 'Chưa đủ căn cứ khôi phục chủ quán. Cần xác minh hồ sơ hỗ trợ.'
  when 'BOOTSTRAP_CONFLICT' then 'Cửa hàng đã được khởi tạo; không thể thay chủ quán bằng thao tác này.'
  else private.write_error(code)->>'message' end)) end
$$;

create function private.permission_store_mutex(sid uuid) returns void
language plpgsql volatile set search_path=pg_catalog as $$ begin
 perform pg_advisory_xact_lock(hashtextextended('store-authority:'||sid::text,0));
 -- Prelock the FK parent before employee/session/catalog locks and the final checkpoint.
 perform 1 from public.stores where id=sid for share;
end $$;
create function private.permission_catalog_share() returns void
language sql volatile set search_path=pg_catalog as $$
 select pg_advisory_xact_lock_shared(hashtextextended('permission-catalog',0))
$$;
create or replace function private.permission_catalog_lock() returns trigger
language plpgsql security definer set search_path=pg_catalog as $$ begin
 perform pg_advisory_xact_lock(hashtextextended('permission-catalog',0));
 perform 1 from public.permission_catalog_state where singleton for update;
 if not found then raise exception 'PERMISSION_CATALOG_INVALID' using errcode='23514'; end if;
 return null;
end $$;
create function private.permission_identity_lock(sid uuid,eid uuid,all_sessions boolean) returns void
language plpgsql volatile set search_path=pg_catalog as $$ begin
 perform private.permission_store_mutex(sid);
 if all_sessions then
  perform 1 from public.employees where store_id=sid and id=eid for update;
  perform 1 from private.employee_sessions where store_id=sid and employee_id=eid order by token_hash for update;
 else
  perform 1 from public.employees where store_id=sid and id=eid for share;
 end if;
 perform private.permission_catalog_share();
end $$;

-- VOLATILE and a new statement after every possible wait. Identification is not authorization.
create function private.permission_current_employee(p_lock boolean default true) returns public.employees
language plpgsql volatile security definer set search_path=pg_catalog as $$
declare sid uuid:=auth.uid(); eid uuid; e public.employees; s private.employee_sessions;
begin
 if sid is null then raise exception 'AUTH_REQUIRED' using errcode='P0401'; end if;
 select employee_id into eid from private.employee_sessions where store_id=sid and token_hash=private.employee_token_hash();
 if p_lock then
  perform 1 from public.employees where store_id=sid and id=eid for share;
  perform 1 from private.employee_sessions where store_id=sid and token_hash=private.employee_token_hash() for share;
  perform private.permission_catalog_share();
 end if;
 select * into e from public.employees where store_id=sid and id=eid;
 select * into s from private.employee_sessions where store_id=sid and token_hash=private.employee_token_hash();
  if e.id is null or not e.is_active or s.token_hash is null or s.revoked_at is not null or s.expires_at<=private.write_clock() then
   raise exception 'EMPLOYEE_SESSION_REQUIRED' using errcode='P0401';
  end if;
  if s.purpose<>'normal' or e.pin_change_required then
   raise exception 'PIN_CHANGE_REQUIRED' using errcode='P0401';
  end if;
 if not exists(select 1 from public.permission_roles where code=e.role and enabled) then
  raise exception 'EMPLOYEE_ROLE_UNAVAILABLE' using errcode='P0401';
 end if;
 return e;
end $$;
create function private.permission_catalog_json() returns jsonb
language sql volatile set search_path=pg_catalog as $$
 select jsonb_build_object('contractVersion',1,'revision',(select revision from public.permission_catalog_state where singleton),
  'roles',(select jsonb_agg(jsonb_build_object('code',code,'labelVi',label_vi,'enabled',enabled,'selectable',selectable) order by code) from public.permission_roles),
  'permissions',(select jsonb_agg(jsonb_build_object('code',code,'labelVi',label_vi,'module',module,'ownerOnly',owner_only,'baseline',baseline) order by code) from public.permission_catalog),
  'defaults',(select jsonb_agg(jsonb_build_object('roleCode',role_code,'permissionCode',permission_code) order by role_code,permission_code) from public.role_permission_defaults))
$$;
create function private.permission_employee_snapshot(e public.employees) returns jsonb
language sql volatile set search_path=pg_catalog as $$
 select jsonb_build_object('id',e.id,'name',e.name,'role',e.role,'isActive',e.is_active,'pinChangeRequired',e.pin_change_required,'permissionRevision',e.permission_revision,
  'overrides',private.normalize_permission_overrides(e.role,e.permission_overrides),'effective',private.configured_employee_permissions(e.role,e.permission_overrides))
$$;
create function private.permission_authority_json(e public.employees) returns jsonb
language plpgsql volatile set search_path=pg_catalog as $$
declare ov jsonb:=private.normalize_permission_overrides(e.role,e.permission_overrides); perms text[]:=private.configured_employee_permissions(e.role,e.permission_overrides); sources jsonb;
begin
 select jsonb_agg(jsonb_build_object('permission',p.code,'effective',p.code=any(perms),'sources',
  to_jsonb(array_remove(array[case when d.permission_code is not null then 'default' end,
    case when ov->'grants' ? p.code then 'grant' end,case when ov->'denies' ? p.code then 'deny' end,
    case when p.baseline and d.permission_code is not null then 'baseline' end],null))) order by p.code)
 into sources from public.permission_catalog p left join public.role_permission_defaults d on d.permission_code=p.code and d.role_code=e.role;
 return jsonb_build_object('storeId',e.store_id,'employeeId',e.id,'role',e.role,'active',true,
  'employeeRevision',e.permission_revision,'catalogRevision',(select revision from public.permission_catalog_state where singleton),'permissions',perms,'sources',sources);
end $$;
create function public.permission_get_authority() returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog as $$
declare e public.employees; begin
 e:=private.permission_current_employee();
 return jsonb_build_object('ok',true,'data',jsonb_build_object('catalog',private.permission_catalog_json(),'snapshot',private.permission_authority_json(e)));
exception when sqlstate 'P0401' then return private.permission_failure(sqlerrm); end $$;
create function public.permission_get_revision() returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog as $$
declare e public.employees; begin
 e:=private.permission_current_employee();
 return jsonb_build_object('ok',true,'data',jsonb_build_object('employeeRevision',e.permission_revision,
 'catalogRevision',(select revision from public.permission_catalog_state where singleton),'serverTime',private.write_clock()));
exception when sqlstate 'P0401' then return private.permission_failure(sqlerrm); end $$;
create function public.permission_list_roster() returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog as $$ begin
 if auth.uid() is null then return private.permission_failure('AUTH_REQUIRED'); end if;
 return jsonb_build_object('ok',true,'data',coalesce((select jsonb_agg(jsonb_build_object('id',e.id,'name',e.name) order by e.name,e.id)
 from public.employees e join public.permission_roles r on r.code=e.role and r.enabled where e.store_id=auth.uid() and e.is_active),'[]'));
end $$;
create function public.permission_start_session(p_employee_id uuid,p_pin text) returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog as $$
declare e public.employees; token text; issued timestamptz; purpose text; ttl interval;
begin
 if auth.uid() is null then return private.permission_failure('AUTH_REQUIRED'); end if;
 if p_pin is null or p_pin !~ '^[0-9]{6}$' then return private.permission_failure('INVALID_PIN'); end if;
 perform private.permission_identity_lock(auth.uid(),p_employee_id,false);
 select * into e from public.employees where store_id=auth.uid() and id=p_employee_id;
 if e.id is null or not e.is_active or e.passcode_hash<>extensions.crypt(p_pin,e.passcode_hash) then return private.permission_failure('INVALID_PIN'); end if;
 if not exists(select 1 from public.permission_roles where code=e.role and enabled) then return private.permission_failure('EMPLOYEE_ROLE_UNAVAILABLE'); end if;
  if e.pin_change_required and e.role<>'owner' then return private.permission_failure('PERMISSION_UPDATE_UNAVAILABLE'); end if;
  purpose:=case when e.pin_change_required then 'required_pin_change' else 'normal' end;
  ttl:=case when purpose='required_pin_change' then interval '5 minutes' else interval '12 hours' end;
  token:=rtrim(translate(encode(extensions.gen_random_bytes(32),'base64'),'+/','-_'),'='); issued:=private.write_clock();
  insert into private.employee_sessions(token_hash,store_id,employee_id,issued_at,expires_at,purpose,employee_revision)
  values(extensions.digest(convert_to(token,'UTF8'),'sha256'),auth.uid(),e.id,issued,issued+ttl,purpose,e.permission_revision);
  if purpose='required_pin_change' then
   return jsonb_build_object('ok',true,'token',token,'kind','required_pin_change','pinChangeRequired',true,
    'storeId',e.store_id,'employeeId',e.id,'name',e.name,'employeeRevision',e.permission_revision,
    'issuedAt',issued,'expiresAt',issued+ttl);
  end if;
  return jsonb_build_object('ok',true,'token',token,'kind','normal','pinChangeRequired',false,'issuedAt',issued,'expiresAt',issued+ttl,
   'authority',jsonb_build_object('catalog',private.permission_catalog_json(),'snapshot',private.permission_authority_json(e)));
end $$;
create function public.permission_revoke_session() returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog as $$
declare eid uuid; begin
 if auth.uid() is null then return private.permission_failure('AUTH_REQUIRED'); end if;
 perform private.permission_store_mutex(auth.uid());
 select employee_id into eid from private.employee_sessions where store_id=auth.uid() and token_hash=private.employee_token_hash();
 perform 1 from public.employees where store_id=auth.uid() and id=eid for share;
 perform 1 from private.employee_sessions where store_id=auth.uid() and token_hash=private.employee_token_hash() for update;
 update private.employee_sessions set revoked_at=coalesce(revoked_at,private.write_clock()) where store_id=auth.uid() and token_hash=private.employee_token_hash();
 return jsonb_build_object('ok',true);
end $$;

-- Common atomic credential mutation. Caller holds mutex, target UPDATE, every
-- target session UPDATE, and catalog SHARE. Only private trusted entry points.
create function private.permission_pin_change(sid uuid,e public.employees,p jsonb,actor_type text,actor_key text,kind text,denial text) returns jsonb
language plpgsql volatile set search_path=pg_catalog as $$
declare req uuid:=(p->>'requestId')::uuid; old_request private.employee_admin_requests; key private.permission_request_mac_keys;
 mac bytea; result jsonb; before_json jsonb:=private.permission_employee_snapshot(e); after_json jsonb;
 changed boolean:=false; outcome text; why text:=denial; actor_rights text[]; catrev bigint;
begin
 select * into old_request from private.employee_admin_requests r where r.store_id=sid and r.actor_type=permission_pin_change.actor_type and r.actor_key=permission_pin_change.actor_key and request_id=req;
 select * into key from private.permission_request_mac_keys where key_version=coalesce(old_request.mac_key_version,(select max(key_version) from private.permission_request_mac_keys));
 mac:=extensions.hmac(convert_to(jsonb_build_object('kind',kind,'targetId',e.id,'payload',p)::text,'UTF8'),key.secret_bytes,'sha256');
 if old_request.request_id is not null then
  if old_request.payload_mac<>mac then return private.permission_failure('ADMIN_REQUEST_REUSED'); end if;
  if old_request.terminal_outcome->>'ok'='true' then return old_request.terminal_outcome||jsonb_build_object('outcome','replayed'); end if;
  return old_request.terminal_outcome;
 end if;
 if why is null and actor_type='employee' and (p->>'expectedRevision')::bigint<>e.permission_revision then why:='EMPLOYEE_VERSION_CONFLICT'; end if;
 if why is null and actor_type='employee' and e.passcode_hash<>extensions.crypt(p->>'currentPin',e.passcode_hash) then why:='INVALID_PIN'; end if;
 catrev:=(select revision from public.permission_catalog_state where singleton);
 actor_rights:=case when actor_type='employee' then private.configured_employee_permissions(e.role,e.permission_overrides) else array[]::text[] end;
 if why is not null then outcome:='denied'; result:=private.permission_failure(why,kind);
  else
   changed:=e.passcode_hash<>extensions.crypt(p->>'newPin',e.passcode_hash);
   outcome:=case when kind='owner_recovery' or changed then 'applied' else 'noop' end;
   if kind='owner_recovery' then
    update public.employees set
     passcode_hash=case when changed then extensions.crypt(p->>'newPin',extensions.gen_salt('bf')) else passcode_hash end,
     pin_change_required=true,permission_revision=permission_revision+1
    where store_id=sid and id=e.id returning * into e;
    update private.employee_sessions set revoked_at=coalesce(revoked_at,private.write_clock()) where store_id=sid and employee_id=e.id;
    insert into public.store_change_signals values(sid,'permission',1,req,e.id)
    on conflict(store_id,topic) do update set revision=public.store_change_signals.revision+1,event_id=req,target_id=e.id;
   elsif changed then
    update public.employees set passcode_hash=extensions.crypt(p->>'newPin',extensions.gen_salt('bf')),permission_revision=permission_revision+1
    where store_id=sid and id=e.id returning * into e;
    insert into public.store_change_signals values(sid,'permission',1,req,e.id)
    on conflict(store_id,topic) do update set revision=public.store_change_signals.revision+1,event_id=req,target_id=e.id;
   end if;
   result:=jsonb_build_object('ok',true,'outcome',outcome,'data',jsonb_build_object('credentialChanged',changed,
    'pinChangeRequired',e.pin_change_required,'employeeRevision',e.permission_revision));
 end if;
 after_json:=private.permission_employee_snapshot(e);
 insert into public.employee_admin_audit values(sid,actor_type,actor_key,req,e.id,kind,outcome,why,before_json,
  before_json,after_json,actor_rights,catrev,changed,p->>'caseRef',p->>'proofRef',private.write_clock());
 insert into private.employee_admin_requests values(sid,actor_type,actor_key,req,kind,mac,key.key_version,result,
  jsonb_build_array(jsonb_build_array(sid,actor_type,actor_key,req,e.id)));
 return result;
end $$;

create function public.permission_check_required_pin_session() returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog as $$
declare sid uuid:=auth.uid(); eid uuid; e public.employees; s private.employee_sessions;
begin
 if sid is null then return private.permission_failure('AUTH_REQUIRED'); end if;
 select employee_id into eid from private.employee_sessions where store_id=sid and token_hash=private.employee_token_hash();
 perform private.permission_store_mutex(sid);
 perform 1 from public.employees where store_id=sid and id=eid for share;
 perform 1 from private.employee_sessions where store_id=sid and token_hash=private.employee_token_hash() for share;
 perform private.permission_catalog_share();
 select * into e from public.employees where store_id=sid and id=eid;
 select * into s from private.employee_sessions where store_id=sid and token_hash=private.employee_token_hash();
 if e.id is null or not e.is_active or e.role<>'owner' or not e.pin_change_required or s.token_hash is null
  or s.purpose<>'required_pin_change' or s.revoked_at is not null or s.expires_at<=private.write_clock()
  or s.employee_id<>e.id or s.employee_revision<>e.permission_revision then return private.permission_failure('EMPLOYEE_SESSION_REQUIRED'); end if;
 return jsonb_build_object('ok',true,'data',jsonb_build_object('valid',true,'purpose','required_pin_change',
  'employeeRevision',e.permission_revision,'expiresAt',s.expires_at));
exception when others then return private.permission_failure('PERMISSION_UPDATE_UNAVAILABLE'); end $$;

create function public.permission_complete_required_pin_change(p_request jsonb) returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog as $$
declare sid uuid:=auth.uid(); eid uuid; e public.employees; s private.employee_sessions; req uuid;
 prior private.employee_admin_requests; key private.permission_request_mac_keys; mac bytea; result jsonb;
 before_json jsonb; after_json jsonb; catrev bigint; receipt_payload jsonb; why text; occurred timestamptz;
begin
 if sid is null then return private.permission_failure('AUTH_REQUIRED'); end if;
 if jsonb_typeof(p_request) is distinct from 'object' or
  not p_request ?& array['requestId','expectedRevision','newPin'] or
  p_request-array['requestId','expectedRevision','newPin']<>'{}' or
  not private.valid_uuid(p_request->'requestId') or
  jsonb_typeof(p_request->'expectedRevision') is distinct from 'number' or (p_request->>'expectedRevision') !~ '^[0-9]+$' or
  (p_request->>'expectedRevision')::numeric>9007199254740991 or
  jsonb_typeof(p_request->'newPin') is distinct from 'string' or (p_request->>'newPin') !~ '^[0-9]{6}$'
 then return private.permission_failure('INVALID_EMPLOYEE_REQUEST'); end if;
 req:=(p_request->>'requestId')::uuid;
 select employee_id into eid from private.employee_sessions where store_id=sid and token_hash=private.employee_token_hash();
 perform private.permission_identity_lock(sid,eid,true);
 select * into e from public.employees where store_id=sid and id=eid;
 select * into s from private.employee_sessions where store_id=sid and token_hash=private.employee_token_hash();
 -- Session validity deliberately precedes receipt lookup: a completed request
 -- revokes its own credential and can never be replayed into authority.
 if e.id is null or not e.is_active or e.role<>'owner' or not e.pin_change_required or s.token_hash is null
  or s.purpose<>'required_pin_change' or s.revoked_at is not null or s.expires_at<=private.write_clock()
  or s.employee_id<>e.id or s.employee_revision<>e.permission_revision then return private.permission_failure('EMPLOYEE_SESSION_REQUIRED'); end if;
 select * into prior from private.employee_admin_requests r where r.store_id=sid and r.actor_type='employee' and r.actor_key=e.id::text and r.request_id=req;
 select * into key from private.permission_request_mac_keys where key_version=coalesce(prior.mac_key_version,(select max(key_version) from private.permission_request_mac_keys)) for share;
 if key.key_version is null then return private.permission_failure('PERMISSION_UPDATE_UNAVAILABLE'); end if;
 receipt_payload:=jsonb_build_object('kind','complete_required_pin_change','targetId',e.id,'requestId',req,
  'expectedRevision',p_request->'expectedRevision','newPinMac',encode(extensions.hmac(convert_to(p_request->>'newPin','UTF8'),key.secret_bytes,'sha256'),'hex'));
 mac:=extensions.hmac(convert_to(receipt_payload::text,'UTF8'),key.secret_bytes,'sha256');
 if prior.request_id is not null then
  if prior.payload_mac<>mac then return private.permission_failure('ADMIN_REQUEST_REUSED'); end if;
  return prior.terminal_outcome;
 end if;
 if (p_request->>'expectedRevision')::bigint<>e.permission_revision then why:='EMPLOYEE_VERSION_CONFLICT';
 elsif e.passcode_hash=extensions.crypt(p_request->>'newPin',e.passcode_hash) then why:='PIN_REUSE_NOT_ALLOWED'; end if;
 before_json:=private.permission_employee_snapshot(e); catrev:=(select revision from public.permission_catalog_state where singleton); occurred:=private.write_clock();
 if why is not null then
  result:=private.permission_failure(why); after_json:=before_json;
  insert into public.employee_admin_audit(store_id,actor_type,actor_key,request_id,target_id,kind,outcome,reason,before_snapshot,proposed_after,actual_after,actor_effective,catalog_revision,credential_changed,occurred_at)
  values(sid,'employee',e.id::text,req,e.id,'complete_required_pin_change','denied',why,before_json,before_json,after_json,array[]::text[],catrev,false,occurred);
  insert into private.employee_admin_requests(store_id,actor_type,actor_key,request_id,kind,payload_mac,mac_key_version,terminal_outcome,audit_keys)
  values(sid,'employee',e.id::text,req,'complete_required_pin_change',mac,key.key_version,result,jsonb_build_array(jsonb_build_array(sid,'employee',e.id,req,e.id)));
  return result;
 end if;
 update public.employees set passcode_hash=extensions.crypt(p_request->>'newPin',extensions.gen_salt('bf')),
  pin_change_required=false,permission_revision=permission_revision+1 where store_id=sid and id=e.id returning * into e;
 update private.employee_sessions set revoked_at=coalesce(revoked_at,occurred) where store_id=sid and employee_id=e.id;
 insert into public.store_change_signals values(sid,'permission',1,req,e.id)
 on conflict(store_id,topic) do update set revision=public.store_change_signals.revision+1,event_id=req,target_id=e.id;
 result:=jsonb_build_object('ok',true,'outcome','applied','data',jsonb_build_object('credentialChanged',true,
  'pinChangeRequired',false,'employeeRevision',e.permission_revision));
 after_json:=private.permission_employee_snapshot(e);
 insert into public.employee_admin_audit(store_id,actor_type,actor_key,request_id,target_id,kind,outcome,before_snapshot,proposed_after,actual_after,actor_effective,catalog_revision,credential_changed,occurred_at)
 values(sid,'employee',e.id::text,req,e.id,'complete_required_pin_change','applied',before_json,after_json,after_json,array[]::text[],catrev,true,occurred);
 insert into private.employee_admin_requests(store_id,actor_type,actor_key,request_id,kind,payload_mac,mac_key_version,terminal_outcome,audit_keys)
 values(sid,'employee',e.id::text,req,'complete_required_pin_change',mac,key.key_version,result,jsonb_build_array(jsonb_build_array(sid,'employee',e.id,req,e.id)));
 return result;
exception when sqlstate 'P0401' then return private.permission_failure(sqlerrm);
 when others then return private.permission_failure('PERMISSION_UPDATE_UNAVAILABLE'); end $$;
create function private.permission_pin_input(p jsonb,recovery boolean) returns boolean
language plpgsql immutable set search_path=pg_catalog as $$ begin
 if jsonb_typeof(p) is distinct from 'object' or not private.valid_uuid(p->'requestId') then return false; end if;
 if recovery then
  if not p ?& array['requestId','storeId','targetId','operatorRef','caseRef','proofRef','newPin'] or
   p - array['requestId','storeId','targetId','operatorRef','caseRef','proofRef','newPin'] <> '{}' or
   not private.valid_uuid(p->'storeId') or not private.valid_uuid(p->'targetId') then return false; end if;
 else
  if not p ?& array['requestId','currentPin','newPin','expectedRevision'] or p-array['requestId','currentPin','newPin','expectedRevision']<>'{}'
   or jsonb_typeof(p->'expectedRevision')<>'number' or (p->>'expectedRevision') !~ '^[0-9]+$'
   or (p->>'expectedRevision')::numeric>9007199254740991 then return false; end if;
 end if;
 return true;
end $$;
create function public.permission_change_own_pin(p_request jsonb) returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog as $$
declare eid uuid; e public.employees; why text;
begin
 if auth.uid() is null then return private.permission_failure('AUTH_REQUIRED'); end if;
 select employee_id into eid from private.employee_sessions where store_id=auth.uid() and token_hash=private.employee_token_hash();
 perform private.permission_identity_lock(auth.uid(),eid,true);
 e:=private.permission_current_employee(false);
 if e.role<>'owner' then return private.permission_failure('FORBIDDEN'); end if;
 if not private.permission_pin_input(p_request,false) then return private.permission_failure('INVALID_EMPLOYEE_REQUEST'); end if;
 if jsonb_typeof(p_request->'currentPin') is distinct from 'string' or (p_request->>'currentPin') !~ '^[0-9]{6}$'
 or jsonb_typeof(p_request->'newPin') is distinct from 'string' or (p_request->>'newPin') !~ '^[0-9]{6}$' then why:='INVALID_EMPLOYEE_REQUEST'; end if;
 return private.permission_pin_change(auth.uid(),e,p_request,'employee',e.id::text,'self_pin',why);
exception when sqlstate 'P0401' then return private.permission_failure(sqlerrm);
 when others then return private.permission_failure('PERMISSION_UPDATE_UNAVAILABLE'); end $$;

do $$ begin
 if not exists(select 1 from pg_roles where rolname='pos_owner_recovery') then create role pos_owner_recovery nologin noinherit; end if;
 if exists(select 1 from pg_roles where rolname='pos_owner_recovery' and (rolcanlogin or rolsuper or rolcreaterole or rolcreatedb or rolreplication or rolbypassrls))
 or pg_has_role('anon','pos_owner_recovery','MEMBER') or pg_has_role('authenticated','pos_owner_recovery','MEMBER') or pg_has_role('service_role','pos_owner_recovery','MEMBER') then
  raise exception 'OWNER_MIGRATION_REVIEW_REQUIRED';
 end if;
end $$;
create function private.permission_recover_owner(p_request jsonb) returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog as $$
declare sid uuid; eid uuid; e public.employees; k text;
begin
 -- The invoker must explicitly assume the dedicated role. service_role and an
 -- employee token, including owner, are never sufficient.
 if current_setting('role',true)<>'pos_owner_recovery' and not(current_setting('role',true)='none' and session_user='pos_owner_recovery') then return private.permission_failure('FORBIDDEN'); end if;
 if not private.permission_pin_input(p_request,true) then return private.permission_failure('OWNER_RECOVERY_REVIEW_REQUIRED'); end if;
 foreach k in array array['operatorRef','caseRef','proofRef'] loop
  if jsonb_typeof(p_request->k) is distinct from 'string' or char_length(private.permission_trim(p_request->>k)) not between 1 and 200 then return private.permission_failure('OWNER_RECOVERY_REVIEW_REQUIRED'); end if;
 end loop;
 if jsonb_typeof(p_request->'newPin') is distinct from 'string' or (p_request->>'newPin') !~ '^[0-9]{6}$' then return private.permission_failure('INVALID_EMPLOYEE_REQUEST'); end if;
 sid:=(p_request->>'storeId')::uuid; eid:=(p_request->>'targetId')::uuid;
 perform private.permission_identity_lock(sid,eid,true);
 select * into e from public.employees where store_id=sid and id=eid;
 if e.id is null then return private.permission_failure('NOT_FOUND'); end if;
 if e.role<>'owner' or not e.is_active then return private.permission_failure('OWNER_PROTECTED'); end if;
 return private.permission_pin_change(sid,e,p_request,'operator',p_request->>'operatorRef','owner_recovery',null);
exception when others then return private.permission_failure('PERMISSION_UPDATE_UNAVAILABLE'); end $$;

create function public.permission_reserve_store_no(p_create_attempt_id uuid) returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog as $$
declare reserved integer; candidate bigint;
begin
 if p_create_attempt_id is null or p_create_attempt_id='00000000-0000-0000-0000-000000000000'::uuid then
  return private.permission_failure('INVALID_WRITE_REQUEST');
 end if;
 perform pg_advisory_xact_lock(hashtextextended('store-number-reservation:'||p_create_attempt_id::text,0));
 select store_no into reserved from private.store_no_reservations where request_id=p_create_attempt_id;
 if reserved is not null then return jsonb_build_object('ok',true,'data',jsonb_build_object('storeNo',reserved)); end if;
 loop
  candidate:=nextval('public.store_no_seq');
  if candidate not between 1 and 2147483647 then return private.permission_failure('PERMISSION_UPDATE_UNAVAILABLE'); end if;
  exit when not exists(select 1 from public.stores where store_no=candidate)
   and not exists(select 1 from private.store_no_reservations where store_no=candidate);
 end loop;
 insert into private.store_no_reservations(request_id,store_no,created_at) values(p_create_attempt_id,candidate::integer,private.write_clock());
 return jsonb_build_object('ok',true,'data',jsonb_build_object('storeNo',candidate::integer));
exception when others then return private.permission_failure('PERMISSION_UPDATE_UNAVAILABLE'); end $$;

create function public.permission_bootstrap_store(p_request jsonb) returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog as $$
declare sid uuid:=auth.uid(); req uuid; eid uuid; sn integer; name text; addr text; seed_demo boolean; input jsonb;
 prior private.bootstrap_requests; result jsonb; email text; workflow_id uuid; stage_name text;
begin
 if sid is null then return private.permission_failure('AUTH_REQUIRED'); end if;
 if jsonb_typeof(p_request) is distinct from 'object' or not p_request ?& array['requestId','ownerId','storeNo','displayName','address','seedDemo']
 or p_request-array['requestId','ownerId','storeNo','displayName','address','seedDemo']<>'{}' or not private.valid_uuid(p_request->'requestId') or not private.valid_uuid(p_request->'ownerId')
 or jsonb_typeof(p_request->'storeNo') is distinct from 'number' or (p_request->>'storeNo') !~ '^[0-9]+$'
 or (p_request->>'storeNo')::numeric not between 1 and 2147483647
 or jsonb_typeof(p_request->'displayName') is distinct from 'string' or char_length(private.permission_trim(p_request->>'displayName')) not between 1 and 120
 or jsonb_typeof(p_request->'address') is distinct from 'string' or char_length(private.permission_trim(p_request->>'address'))>500
 or jsonb_typeof(p_request->'seedDemo') is distinct from 'boolean' then return private.permission_failure('INVALID_WRITE_REQUEST'); end if;
 req:=(p_request->>'requestId')::uuid; eid:=(p_request->>'ownerId')::uuid; sn:=(p_request->>'storeNo')::integer;
 name:=private.permission_trim(p_request->>'displayName'); addr:=private.permission_trim(p_request->>'address'); seed_demo:=(p_request->>'seedDemo')::boolean;
 perform private.permission_store_mutex(sid);
 perform pg_advisory_xact_lock(hashtext(sid::text||':bootstrap'));
 select u.email into email from auth.users u where u.id=sid for share;
 if email is distinct from 'store'||sn::text||'@store.pos.local' then return private.permission_failure('FORBIDDEN'); end if;
 perform private.permission_catalog_share();
 input:=jsonb_build_object('ownerId',eid,'storeNo',sn,'displayName',name,'address',addr,'seedDemo',seed_demo);
 select * into prior from private.bootstrap_requests where store_id=sid and request_id=req;
 if prior.request_id is not null then
  if prior.canonical_input<>input then return private.permission_failure('BOOTSTRAP_CONFLICT'); end if;
  return prior.outcome||jsonb_build_object('outcome','replayed');
 end if;
 if exists(select 1 from public.stores where id=sid or store_no=sn) or exists(select 1 from public.employees where id=eid) then return private.permission_failure('BOOTSTRAP_CONFLICT'); end if;
 workflow_id:=private.permission_stable_uuid(sid,'initial-seed.workflow.v1');
 insert into public.stores(id,store_no,name,email,seed_status) values(sid,sn,name,null,(case when seed_demo then 'pending' else 'seeded' end)::public.seed_status);
 insert into public.store_settings(store_id,display_name,address) values(sid,name,addr);
 insert into public.employees(id,store_id,name,role,passcode_hash,pin_change_required) values(eid,sid,'Chủ quán','owner',extensions.crypt('123456',extensions.gen_salt('bf')),true);
 insert into private.initial_seed_workflows(workflow_id,store_id,requested,template_version,status,created_at,updated_at)
 values(workflow_id,sid,seed_demo,1,case when seed_demo then 'pending' else 'skipped' end,private.write_clock(),private.write_clock());
 if seed_demo then
  foreach stage_name in array array['employee','menu','floor'] loop
   insert into private.initial_seed_stages(workflow_id,stage,stage_id)
   values(workflow_id,stage_name,private.permission_stable_uuid(sid,'initial-seed.v1.'||stage_name));
  end loop;
 end if;
 result:=jsonb_build_object('ok',true,'outcome','applied','data',jsonb_build_object('storeId',sid,'storeNo',sn,'ownerId',eid,
  'seedRequested',seed_demo,'seedWorkflowId',workflow_id));
 insert into private.bootstrap_requests values(sid,req,eid,input,result);
 -- Initial PIN policy stays baseline. It is never returned or replayed here.
 return result;
exception when unique_violation then return private.permission_failure('BOOTSTRAP_CONFLICT');
 when others then return private.permission_failure('PERMISSION_UPDATE_UNAVAILABLE'); end $$;

-- Public compatibility metadata only; safe before pairing or creating Auth users.
create function public.permission_get_contract() returns jsonb
language sql immutable set search_path=pg_catalog as $$
 select jsonb_build_object('permissionContractVersion',2,'writeProtocolVersion',1)
$$;
revoke all on function public.permission_get_contract() from public,anon,authenticated,service_role;
grant execute on function public.permission_get_contract() to anon,authenticated;

create function public.permission_get_store_session() returns jsonb
language plpgsql stable security definer set search_path=pg_catalog as $$
declare sid uuid:=auth.uid(); s public.stores;
begin
 if sid is null then return private.permission_failure('AUTH_REQUIRED'); end if;
 select * into s from public.stores where id=sid;
 if s.id is null then return private.permission_failure('AUTH_REQUIRED'); end if;
 return jsonb_build_object('ok',true,'data',jsonb_build_object('storeId',s.id,'storeNo',s.store_no));
exception when others then return private.permission_failure('PERMISSION_UPDATE_UNAVAILABLE'); end $$;

-- Default privileges in Supabase may expose new functions: always revoke first.
do $$ declare f record; begin
 for f in select p.oid::regprocedure signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where (n.nspname='private' and (p.proname like 'permission_%' or p.proname='assert_store_owner'))
   or (n.nspname='public' and p.proname in ('permission_start_session','permission_revoke_session','permission_get_authority','permission_get_revision','permission_list_roster','permission_change_own_pin','permission_check_required_pin_session','permission_complete_required_pin_change','permission_reserve_store_no','permission_bootstrap_store','permission_get_store_session')) loop
  execute format('revoke all on function %s from public,anon,authenticated,service_role',f.signature);
 end loop;
end $$;
grant execute on function public.permission_start_session(uuid,text),public.permission_revoke_session(),public.permission_get_authority(),
 public.permission_get_revision(),public.permission_list_roster(),public.permission_change_own_pin(jsonb),public.permission_check_required_pin_session(),
 public.permission_complete_required_pin_change(jsonb),public.permission_bootstrap_store(jsonb) to authenticated;
grant execute on function public.permission_reserve_store_no(uuid) to anon,authenticated;
-- New clients use a stable creation UUID. Retire the non-idempotent allocator.
revoke all on function public.get_next_store_no() from public,anon,authenticated,service_role;
grant execute on function public.permission_get_store_session() to authenticated;
grant usage on schema private to pos_owner_recovery;
grant execute on function private.permission_recover_owner(jsonb) to pos_owner_recovery;
$permission_fragment_19$;
-- 21: supabase/candidate/permission-administration.sql
 if clock_timestamp()>=least(started_at+interval '50 seconds','2026-10-22T10:00:00.000Z'::timestamptz) then raise exception 'STAGING_EXECUTION_WINDOW_CLOSED'; end if;
 execute $permission_fragment_20$-- PERM-T05 staged fragment, after permission-identity.sql. Not an activation launcher.
alter table public.employee_admin_audit add column details jsonb;
create index employee_admin_audit_page on public.employee_admin_audit(store_id,occurred_at desc);

-- Rotation appends a version. Old secrets/versions must remain stable for replay.
create function private.permission_mac_keys_immutable() returns trigger
language plpgsql set search_path=pg_catalog as $$ begin raise exception 'PERMISSION_MAC_KEY_IMMUTABLE'; end $$;
create trigger permission_mac_keys_immutable before update or delete or truncate on private.permission_request_mac_keys
 for each statement execute function private.permission_mac_keys_immutable();

create function private.permission_admin_failure(code text,details jsonb default null) returns jsonb
language plpgsql volatile set search_path=pg_catalog as $$
declare message text; labels text;
begin
 message:=case code
  when 'AUTH_REQUIRED' then 'Phiên nhân viên không còn hợp lệ. Vui lòng đăng nhập lại.'
  when 'EMPLOYEE_SESSION_REQUIRED' then 'Phiên nhân viên không còn hợp lệ. Vui lòng đăng nhập lại.'
  when 'NOT_FOUND' then 'Không tìm thấy dữ liệu được phép truy cập.'
  when 'SELF_PERMISSION_EDIT_FORBIDDEN' then 'Bạn không thể tự sửa vai trò hoặc quyền của mình.'
  when 'SELF_DISABLE_FORBIDDEN' then 'Bạn không thể tự tạm khóa tài khoản đang dùng.'
  when 'OWNER_ONLY_PERMISSION' then 'Quyền này chỉ dành cho chủ quán.'
  when 'PERMISSION_BASELINE_REQUIRED' then 'Quyền xem sơ đồ bàn luôn được cấp và không thể tắt.'
  when 'PERMISSION_CATALOG_STALE' then 'Danh mục quyền đã thay đổi. Tải lại trước khi lưu.'
  when 'PERMISSION_REFRESH_UNAVAILABLE' then 'Chưa xác minh được quyền. Kiểm tra kết nối và thử lại.'
  else private.permission_failure(code)->'error'->>'message' end;
 if code='PERMISSION_CEILING_EXCEEDED' then
  select string_agg(label_vi,', ' order by p.code) into labels from public.permission_catalog p where details->'missingPermissions' ? p.code;
  message:='Không thể quản lý nhân viên này vì vượt quyền của bạn. Quyền còn thiếu: '||coalesce(labels,'')||'.';
 end if;
 return jsonb_build_object('ok',false,'error',jsonb_build_object('code',code,'message',message,'details',details));
end $$;
create function private.permission_admin_view(e public.employees) returns jsonb
language sql volatile set search_path=pg_catalog as $$
 select private.permission_employee_snapshot(e)||jsonb_build_object('sources',private.permission_authority_json(e)->'sources')
$$;
create function private.permission_valid_revision(value jsonb) returns boolean
language plpgsql immutable set search_path=pg_catalog as $$ begin
 if jsonb_typeof(value) is distinct from 'number' then return false; end if;
 if value::text !~ '^[0-9]+$' then return false; end if;
 return value::text::numeric<=9007199254740991;
end $$;

-- The request body is syntactically canonical JSONB for the MAC, independent of
-- catalog changes. Missing fields and explicit null remain different requests.
create function private.permission_admin_execute(kind text,p jsonb) returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog as $$
declare sid uuid:=auth.uid(); aid uuid; tid uuid; req uuid; row_id uuid; session_row record;
 a public.employees; before_e public.employees; after_e public.employees; prior private.employee_admin_requests;
 mac_key private.permission_request_mac_keys; payload_mac bytea; patch jsonb; why text; details jsonb;
 actor_rights text[]; before_rights text[]; after_rights text[]; missing text[]; required text[]:=array[]::text[];
 catrev bigint; normalized jsonb; changed boolean:=false; credential_changed boolean:=false;
 before_json jsonb; proposed_json jsonb; actual_json jsonb; result jsonb; outcome text;
 has_read boolean; is_create boolean:=kind='create_employee'; audit_kind text;
 action_error text; candidate_valid boolean;
begin
 if sid is null then return private.permission_admin_failure('AUTH_REQUIRED'); end if;
 -- For malformed identity fields there is no honest request/target audit key.
 if kind not in ('create_employee','update_employee','reset_pin') or jsonb_typeof(p) is distinct from 'object'
 or not private.valid_uuid(p->'requestId') or not private.valid_uuid(p->case when is_create then 'id' else 'targetId' end) then
  perform private.permission_current_employee();
  return private.permission_admin_failure('INVALID_EMPLOYEE_REQUEST');
 end if;
 req:=(p->>'requestId')::uuid; tid:=(p->>case when is_create then 'id' else 'targetId' end)::uuid;
 select employee_id into aid from private.employee_sessions where store_id=sid and token_hash=private.employee_token_hash();
 perform private.permission_store_mutex(sid);
 -- A client-chosen global employee UUID can collide across stores. Serialize
 -- insert attempts before the final auth checkpoint, never lock foreign rows.
 if is_create then perform pg_advisory_xact_lock(hashtextextended('employee-create:'||tid::text,0)); end if;
 for row_id in select id from public.employees where store_id=sid and id in (aid,tid) order by id loop
  if row_id=tid then perform 1 from public.employees where store_id=sid and id=row_id for update;
  else perform 1 from public.employees where store_id=sid and id=row_id for share; end if;
 end loop;
 for session_row in select token_hash,employee_id from private.employee_sessions
  where store_id=sid and (employee_id=tid or token_hash=private.employee_token_hash()) order by token_hash loop
  if session_row.employee_id=tid then perform 1 from private.employee_sessions where token_hash=session_row.token_hash for update;
  else perform 1 from private.employee_sessions where token_hash=session_row.token_hash for share; end if;
 end loop;
 select * into prior from private.employee_admin_requests r where r.store_id=sid and r.actor_type='employee' and r.actor_key=aid::text and r.request_id=req;
 select * into mac_key from private.permission_request_mac_keys where key_version=coalesce(prior.mac_key_version,(select max(key_version) from private.permission_request_mac_keys)) for share;
 if mac_key.key_version is null then return private.permission_admin_failure('PERMISSION_UPDATE_UNAVAILABLE'); end if;
 perform private.permission_catalog_share();
 a:=private.permission_current_employee(false);
 select * into before_e from public.employees where store_id=sid and id=tid;
 actor_rights:=private.configured_employee_permissions(a.role,a.permission_overrides);
 catrev:=(select revision from public.permission_catalog_state where singleton);
 has_read:='employee.manage'=any(actor_rights) or 'employee.permission.edit'=any(actor_rights);
 patch:=case when kind='update_employee' then p->'patch' else p end;
 if kind in ('create_employee','reset_pin') then required:=array['employee.manage'];
 elsif jsonb_typeof(patch)='object' and patch ?| array['name','role','isActive'] then required:=array['employee.manage']; end if;
 if kind in ('create_employee','update_employee') and jsonb_typeof(patch)='object' and patch ? 'overrides' then required:=array_append(required,'employee.permission.edit'); end if;
 if not has_read or not required<@actor_rights then why:='FORBIDDEN'; end if;
 -- Scope errors reveal neither a foreign row nor audit of that row.
 if (not is_create and before_e.id is null) or (is_create and before_e.id is null and exists(select 1 from public.employees where id=tid)) then
  return private.permission_admin_failure(case when why is not null then why else 'NOT_FOUND' end);
 end if;
 payload_mac:=extensions.hmac(convert_to(jsonb_build_object('kind',kind,'targetId',tid,'payload',p)::text,'UTF8'),mac_key.secret_bytes,'sha256');
 if prior.request_id is not null then
  if why is not null then return private.permission_admin_failure(why); end if;
  if prior.payload_mac<>payload_mac then return private.permission_admin_failure('ADMIN_REQUEST_REUSED'); end if;
  if prior.terminal_outcome->>'ok'='true' then return prior.terminal_outcome||jsonb_build_object('outcome','replayed'); end if;
  return prior.terminal_outcome;
 end if;
 if before_e.id is not null then actual_json:=private.permission_employee_snapshot(before_e); end if;
 if not is_create then before_json:=actual_json; end if;
 after_e:=before_e;
 action_error:=why; why:=null;

 -- Shape/field validation is separate from catalog-dependent normalization.
 if why is null then
  if is_create then
   if not p ?& array['requestId','id','name','role','pin','expectedCatalogRevision']
    or p-array['requestId','id','name','role','pin','expectedCatalogRevision','overrides']<>'{}' then why:='INVALID_EMPLOYEE_REQUEST'; end if;
  elsif kind='update_employee' then
   if not p ?& array['requestId','targetId','expectedRevision','patch'] or p-array['requestId','targetId','expectedRevision','expectedCatalogRevision','patch']<>'{}'
    or jsonb_typeof(patch) is distinct from 'object' then why:='INVALID_EMPLOYEE_REQUEST';
   elsif patch-array['name','role','isActive','overrides']<>'{}' then why:='INVALID_EMPLOYEE_REQUEST'; end if;
  else
   if not p ?& array['requestId','targetId','expectedRevision','newPin'] or p-array['requestId','targetId','expectedRevision','newPin']<>'{}' then why:='INVALID_EMPLOYEE_REQUEST'; end if;
  end if;
 end if;
 if why is null then
  if (is_create or patch ? 'name') and (jsonb_typeof(patch->'name') is distinct from 'string' or char_length(private.permission_trim(patch->>'name')) not between 1 and 120) then
   why:='INVALID_EMPLOYEE_REQUEST'; details:=jsonb_build_object('fieldErrors',jsonb_build_object('name',case when char_length(private.permission_trim(patch->>'name'))>120 then 'Tên nhân viên tối đa 120 ký tự.' else 'Tên nhân viên không được để trống.' end));
  elsif (is_create or kind='reset_pin') and (jsonb_typeof(p->case when is_create then 'pin' else 'newPin' end) is distinct from 'string' or (p->>case when is_create then 'pin' else 'newPin' end) !~ '^[0-9]{6}$') then
   why:='INVALID_EMPLOYEE_REQUEST'; details:=jsonb_build_object('fieldErrors',jsonb_build_object('pin','PIN phải gồm đúng 6 chữ số.'));
  elsif kind='update_employee' and patch ? 'isActive' and jsonb_typeof(patch->'isActive') is distinct from 'boolean' then why:='INVALID_EMPLOYEE_REQUEST';
  elsif not is_create and not private.permission_valid_revision(p->'expectedRevision') then why:='INVALID_EMPLOYEE_REQUEST';
  elsif (is_create or (kind='update_employee' and patch ?| array['role','overrides']) or p ? 'expectedCatalogRevision') and not private.permission_valid_revision(p->'expectedCatalogRevision') then why:='INVALID_EMPLOYEE_REQUEST';
  end if;
 end if;
 candidate_valid:=why is null;
 if why is null then
  -- Presence, rather than difference, protects self permissions and explicit reset.
  if not is_create and aid=tid and kind='update_employee' and patch ?| array['role','overrides'] then why:='SELF_PERMISSION_EDIT_FORBIDDEN';
  elsif not is_create and aid=tid and kind='update_employee' and patch->'isActive'='false'::jsonb then why:='SELF_DISABLE_FORBIDDEN';
  elsif not is_create and aid=tid and kind='reset_pin' then why:='FORBIDDEN';
  elsif not is_create and before_e.role='owner' and aid<>tid then why:='OWNER_PROTECTED';
  elsif kind in ('create_employee','update_employee') and patch->>'role'='owner' then why:='OWNER_PROTECTED';
  elsif (is_create or (kind='update_employee' and patch ? 'role')) and (jsonb_typeof(patch->'role') is distinct from 'string' or not exists(select 1 from public.permission_roles where code=patch->>'role' and selectable and enabled)) then why:='INVALID_EMPLOYEE_REQUEST';
  end if;
 end if;
 if why is null then
  if not is_create and (p->>'expectedRevision')::bigint<>before_e.permission_revision then why:='EMPLOYEE_VERSION_CONFLICT';
  elsif p ? 'expectedCatalogRevision' and (p->>'expectedCatalogRevision')::bigint<>catrev then why:='PERMISSION_CATALOG_STALE'; end if;
 end if;
 if candidate_valid and (not (is_create or (kind='update_employee' and patch ? 'role'))
   or exists(select 1 from public.permission_roles where code=patch->>'role' and enabled))
   and (not (p ? 'expectedCatalogRevision') or case when private.permission_valid_revision(p->'expectedCatalogRevision') then (p->>'expectedCatalogRevision')::numeric=catrev else false end) then
  -- A denied but independently valid proposal is still useful audit evidence.
  -- Catalog-stale or unparseable input never gets a fabricated proposal.
  if is_create then
   after_e.id:=tid; after_e.store_id:=sid; after_e.name:=private.permission_trim(p->>'name'); after_e.role:=p->>'role'; after_e.is_active:=true; after_e.permission_revision:=0; after_e.permission_overrides:=null;
  elsif kind='update_employee' then
   if patch ? 'name' then after_e.name:=private.permission_trim(patch->>'name'); end if;
   if patch ? 'isActive' then after_e.is_active:=(patch->>'isActive')::boolean; end if;
   if patch ? 'role' and patch->>'role'<>before_e.role then after_e.role:=patch->>'role'; after_e.permission_overrides:=null; end if;
  end if;
  -- User decision T05: discard OLD overrides on role change, then apply an
  -- explicitly supplied NEW override set in that same atomic request.
  begin
   if kind in ('create_employee','update_employee') and patch ? 'overrides' then
    normalized:=private.normalize_permission_overrides(after_e.role,nullif(patch->'overrides','null'::jsonb));
    after_e.permission_overrides:=normalized;
   end if;
   proposed_json:=private.permission_employee_snapshot(after_e);
  exception when sqlstate 'P0001' or sqlstate '22023' then
   if sqlerrm in ('INVALID_EMPLOYEE_REQUEST','PERMISSION_BASELINE_REQUIRED','OWNER_ONLY_PERMISSION') then why:=coalesce(why,sqlerrm); else raise; end if;
  end;
 end if;
 why:=coalesce(action_error,why);
 if action_error is not null then details:=null; end if;
 if why is null and is_create and before_e.id is not null then why:='INVALID_EMPLOYEE_REQUEST'; end if;
 if why is null and a.role<>'owner' then
  before_rights:=case when is_create then array[]::text[] else private.configured_employee_permissions(before_e.role,before_e.permission_overrides) end;
  after_rights:=private.configured_employee_permissions(after_e.role,after_e.permission_overrides);
  select coalesce(array_agg(code order by code),array[]::text[]) into missing from (select unnest(before_rights||after_rights) code except select unnest(actor_rights)) m;
  if cardinality(missing)>0 then why:='PERMISSION_CEILING_EXCEEDED'; details:=jsonb_build_object('missingPermissions',missing); end if;
 end if;
 if why is null then
  if is_create then
   insert into public.employees(id,store_id,name,role,is_active,permission_overrides,permission_revision,passcode_hash)
   values(tid,sid,after_e.name,after_e.role,true,after_e.permission_overrides,0,extensions.crypt(p->>'pin',extensions.gen_salt('bf'))) returning * into after_e;
   changed:=true;
  elsif kind='reset_pin' then
   credential_changed:=before_e.passcode_hash<>extensions.crypt(p->>'newPin',before_e.passcode_hash); changed:=credential_changed;
   if changed then update public.employees set passcode_hash=extensions.crypt(p->>'newPin',extensions.gen_salt('bf')),permission_revision=permission_revision+1 where id=tid and store_id=sid returning * into after_e; end if;
  else
   changed:=row(after_e.name,after_e.role,after_e.is_active,after_e.permission_overrides) is distinct from row(before_e.name,before_e.role,before_e.is_active,before_e.permission_overrides);
   if changed then update public.employees set name=after_e.name,role=after_e.role,is_active=after_e.is_active,permission_overrides=after_e.permission_overrides,permission_revision=permission_revision+1 where id=tid and store_id=sid returning * into after_e; end if;
  end if;
  if changed then
   insert into public.store_change_signals values(sid,'permission',1,req,tid)
   on conflict(store_id,topic) do update set revision=public.store_change_signals.revision+1,event_id=req,target_id=tid;
  end if;
  outcome:=case when changed then 'applied' else 'noop' end;
  actual_json:=private.permission_employee_snapshot(after_e);
  result:=jsonb_build_object('ok',true,'outcome',outcome,'data',private.permission_admin_view(after_e));
 else outcome:='denied'; result:=private.permission_admin_failure(why,details);
 end if;
 audit_kind:=kind;
 insert into public.employee_admin_audit(store_id,actor_type,actor_key,request_id,target_id,kind,outcome,reason,before_snapshot,proposed_after,actual_after,actor_effective,catalog_revision,credential_changed,occurred_at,details)
 values(sid,'employee',aid::text,req,tid,audit_kind,outcome,why,before_json,proposed_json,actual_json,actor_rights,catrev,credential_changed,private.write_clock(),details);
 insert into private.employee_admin_requests(store_id,actor_type,actor_key,request_id,kind,payload_mac,mac_key_version,terminal_outcome,audit_keys)
 values(sid,'employee',aid::text,req,kind,payload_mac,mac_key.key_version,result,jsonb_build_array(jsonb_build_array(sid,'employee',aid,req,tid)));
 return result;
exception when sqlstate 'P0401' then return private.permission_admin_failure(sqlerrm);
 when others then return private.permission_admin_failure('PERMISSION_UPDATE_UNAVAILABLE');
end $$;
create function public.permission_admin_create(p_request jsonb) returns jsonb
language sql volatile security definer set search_path=pg_catalog as $$ select private.permission_admin_execute('create_employee',p_request) $$;
create function public.permission_admin_update(p_request jsonb) returns jsonb
language sql volatile security definer set search_path=pg_catalog as $$ select private.permission_admin_execute('update_employee',p_request) $$;
create function public.permission_admin_reset_pin(p_request jsonb) returns jsonb
language sql volatile security definer set search_path=pg_catalog as $$ select private.permission_admin_execute('reset_pin',p_request) $$;

create function public.permission_admin_list() returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog as $$
declare a public.employees; rights text[]; result jsonb;
begin
 a:=private.permission_current_employee(); rights:=private.configured_employee_permissions(a.role,a.permission_overrides);
 if not (rights && array['employee.manage','employee.permission.edit']) then return private.permission_admin_failure('FORBIDDEN'); end if;
 select coalesce(jsonb_agg(private.permission_admin_view(e) order by e.name,e.id),'[]') into result from public.employees e where store_id=a.store_id;
 return jsonb_build_object('ok',true,'data',result);
exception when sqlstate 'P0401' then return private.permission_admin_failure(sqlerrm);
 when others then return private.permission_admin_failure('PERMISSION_REFRESH_UNAVAILABLE'); end $$;
create function public.permission_admin_get(p_target_id uuid) returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog as $$
declare a public.employees; e public.employees; rights text[];
begin
 a:=private.permission_current_employee(); rights:=private.configured_employee_permissions(a.role,a.permission_overrides);
 if not (rights && array['employee.manage','employee.permission.edit']) then return private.permission_admin_failure('FORBIDDEN'); end if;
 select * into e from public.employees where store_id=a.store_id and id=p_target_id;
 if e.id is null then return private.permission_admin_failure('NOT_FOUND'); end if;
 return jsonb_build_object('ok',true,'data',private.permission_admin_view(e));
exception when sqlstate 'P0401' then return private.permission_admin_failure(sqlerrm);
 when others then return private.permission_admin_failure('PERMISSION_REFRESH_UNAVAILABLE'); end $$;

create function private.permission_base64url(value bytea) returns text
language sql immutable set search_path=pg_catalog as $$ select rtrim(translate(replace(encode(value,'base64'),E'\n',''),'+/','-_'),'=') $$;
create function private.permission_audit_key(a public.employee_admin_audit) returns text
language sql immutable set search_path=pg_catalog as $$
 select private.permission_base64url(convert_to(jsonb_build_array(a.store_id,a.actor_type,a.actor_key,a.request_id,a.target_id)::text,'UTF8'))
$$;
create function private.permission_audit_view(a public.employee_admin_audit) returns jsonb
language sql immutable set search_path=pg_catalog as $$
 select jsonb_build_object('auditKey',private.permission_audit_key(a),'storeId',a.store_id,'actorType',a.actor_type,'actorKey',a.actor_key,
  'requestId',a.request_id,'targetId',a.target_id,'occurredAt',a.occurred_at,'kind',a.kind,'outcome',a.outcome,'reason',a.reason,
  'actorEffective',a.actor_effective,'catalogRevision',a.catalog_revision,'before',a.before_snapshot,'proposedAfter',a.proposed_after,
  'actualAfter',a.actual_after,'credentialChanged',a.credential_changed,'details',a.details,'operatorCaseRef',a.operator_case_ref,'operatorProofRef',a.operator_proof_ref)
$$;
create function public.permission_admin_audit(p_filter jsonb default '{}'::jsonb) returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog as $$
declare a public.employees; rights text[]; target uuid; outcome_filter text; page_limit integer:=50;
 key private.permission_request_mac_keys; cursor_body jsonb; cursor_bytes text; supplied_mac text; expected_mac text;
 last_at timestamptz; last_key text; next_cursor text; result jsonb:='[]'::jsonb; n integer:=0; entry record; last_returned public.employee_admin_audit;
begin
 a:=private.permission_current_employee(); rights:=private.configured_employee_permissions(a.role,a.permission_overrides);
 if a.role<>'owner' and not 'employee.permission.edit'=any(rights) then return private.permission_admin_failure('FORBIDDEN'); end if;
 if jsonb_typeof(p_filter) is distinct from 'object' or p_filter-array['cursor','limit','targetId','outcome']<>'{}' then return private.permission_admin_failure('INVALID_EMPLOYEE_REQUEST'); end if;
 if p_filter ? 'limit' then
  if not private.permission_valid_revision(p_filter->'limit') then return private.permission_admin_failure('INVALID_EMPLOYEE_REQUEST'); end if;
  if (p_filter->>'limit')::numeric not between 1 and 100 then return private.permission_admin_failure('INVALID_EMPLOYEE_REQUEST'); end if;
  page_limit:=(p_filter->>'limit')::integer;
 end if;
 if p_filter ? 'targetId' then
  if not private.valid_uuid(p_filter->'targetId') then return private.permission_admin_failure('INVALID_EMPLOYEE_REQUEST'); end if;
  target:=(p_filter->>'targetId')::uuid;
 end if;
 if p_filter ? 'outcome' then
  if jsonb_typeof(p_filter->'outcome') is distinct from 'string' or p_filter->>'outcome' not in ('applied','denied','noop') then return private.permission_admin_failure('INVALID_EMPLOYEE_REQUEST'); end if;
  outcome_filter:=p_filter->>'outcome';
 end if;
 if p_filter ? 'cursor' then
  begin
   if jsonb_typeof(p_filter->'cursor') is distinct from 'string' or length(p_filter->>'cursor')>8192 or (p_filter->>'cursor') !~ '^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{43}$' then raise exception 'invalid cursor'; end if;
   cursor_bytes:=split_part(p_filter->>'cursor','.',1); supplied_mac:=split_part(p_filter->>'cursor','.',2);
   cursor_body:=convert_from(decode(translate(cursor_bytes,'-_','+/')||repeat('=',(4-length(cursor_bytes)%4)%4),'base64'),'UTF8')::jsonb;
   select * into key from private.permission_request_mac_keys where key_version=(cursor_body->>'keyVersion')::integer;
   expected_mac:=private.permission_base64url(extensions.hmac(convert_to('employee-audit-cursor:'||cursor_bytes,'UTF8'),key.secret_bytes,'sha256'));
   if key.key_version is null or expected_mac is distinct from supplied_mac or cursor_body->>'version'<>'1'
    or cursor_body->>'storeId' is distinct from a.store_id::text or cursor_body->>'targetId' is distinct from target::text or cursor_body->>'outcome' is distinct from outcome_filter then raise exception 'invalid cursor'; end if;
   last_at:=(cursor_body->>'lastAt')::timestamptz; last_key:=cursor_body->>'lastKey';
   if last_at is null or last_key is null then raise exception 'invalid cursor'; end if;
  exception when others then return private.permission_admin_failure('INVALID_EMPLOYEE_REQUEST'); end;
 end if;
 if target is not null and not exists(select 1 from public.employees where store_id=a.store_id and id=target)
 and not exists(select 1 from public.employee_admin_audit where store_id=a.store_id and target_id=target) then return private.permission_admin_failure('NOT_FOUND'); end if;
 for entry in select r as audit_row,private.permission_audit_key(r) as audit_key from public.employee_admin_audit r
  where r.store_id=a.store_id and (target is null or r.target_id=target) and (outcome_filter is null or r.outcome=outcome_filter)
  and (last_at is null or r.occurred_at<last_at or (r.occurred_at=last_at and private.permission_audit_key(r) collate "C"<last_key collate "C"))
  order by r.occurred_at desc,private.permission_audit_key(r) collate "C" desc limit page_limit+1 loop
  n:=n+1;
  if n<=page_limit then result:=result||jsonb_build_array(private.permission_audit_view(entry.audit_row)); last_returned:=entry.audit_row;
  else
   select * into key from private.permission_request_mac_keys order by key_version desc limit 1;
   cursor_body:=jsonb_build_object('version',1,'keyVersion',key.key_version,'storeId',a.store_id,'targetId',target,'outcome',outcome_filter,
    'lastAt',last_returned.occurred_at,'lastKey',private.permission_audit_key(last_returned));
   cursor_bytes:=private.permission_base64url(convert_to(cursor_body::text,'UTF8'));
   next_cursor:=cursor_bytes||'.'||private.permission_base64url(extensions.hmac(convert_to('employee-audit-cursor:'||cursor_bytes,'UTF8'),key.secret_bytes,'sha256'));
  end if;
 end loop;
 return jsonb_build_object('ok',true,'data',jsonb_build_object('rows',result,'nextCursor',next_cursor));
exception when sqlstate 'P0401' then return private.permission_admin_failure(sqlerrm);
 when others then return private.permission_admin_failure('PERMISSION_REFRESH_UNAVAILABLE'); end $$;

-- The candidate fragment owns its ACL closure; tests must not rely on fixture
-- broad revokes to hide a missing production grant/revoke statement here.
revoke all on public.employees,public.employee_admin_audit from public,anon,authenticated,service_role;
-- A table-level REVOKE does not remove the column grants from migration 016.
do $$ declare c record; begin
 for c in select attname from pg_attribute where attrelid='public.employees'::regclass and attnum>0 and not attisdropped loop
  execute format('revoke select(%1$I),insert(%1$I),update(%1$I),references(%1$I) on public.employees from public,anon,authenticated,service_role',c.attname);
 end loop;
end $$;
do $$ declare f record; begin
 for f in select p.oid::regprocedure signature,n.nspname,p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where (n.nspname='private' and (p.proname like 'permission_admin_%' or p.proname like 'permission_audit_%' or p.proname in ('permission_valid_revision','permission_base64url','permission_mac_keys_immutable')))
 or (n.nspname='public' and (p.proname like 'permission_admin_%' or p.proname in ('create_employee','update_employee','reset_employee_pin','seed_employee','verify_employee_pin','hash_employee_pin','start_employee_session','revoke_employee_session','bootstrap_store'))) loop
  execute format('revoke all on function %s from public,anon,authenticated,service_role',f.signature);
 end loop;
end $$;
grant execute on function public.permission_admin_create(jsonb),public.permission_admin_update(jsonb),public.permission_admin_reset_pin(jsonb),
 public.permission_admin_list(),public.permission_admin_get(uuid),public.permission_admin_audit(jsonb) to authenticated;
$permission_fragment_20$;
-- 22: supabase/candidate/permission-financial.sql
 if clock_timestamp()>=least(started_at+interval '50 seconds','2026-10-22T10:00:00.000Z'::timestamptz) then raise exception 'STAGING_EXECUTION_WINDOW_CLOSED'; end if;
 execute $permission_fragment_21$-- PERM-T06 staged financial fragment after T04/T05. Not an activation launcher.
-- Protocol payload, planners, effects, receipt/R1 schema, K identity and TTL stay
-- unchanged. Every authority lock is acquired AFTER the business wait region.

create function private.permission_financial_checkpoint(p_references uuid[] default array[]::uuid[]) returns public.employees
language plpgsql volatile security definer set search_path=pg_catalog as $$
declare sid uuid:=auth.uid(); eid uuid;
begin
 if sid is null then raise exception 'AUTH_REQUIRED' using errcode='P0401'; end if;
 select employee_id into eid from private.employee_sessions where store_id=sid and token_hash=private.employee_token_hash();
 -- Register writes a store FK too. Execute already holds this lock in its
 -- business prelock; never allow a fresh FK wait after session/clock validation.
 perform 1 from public.stores where id=sid for share;
 perform 1 from public.employees where store_id=sid and id=any(coalesce(p_references,array[]::uuid[])||array[eid]) order by id for share;
 perform 1 from private.employee_sessions where store_id=sid and token_hash=private.employee_token_hash() for share;
 perform private.permission_catalog_share();
 return private.permission_current_employee(false);
end $$;

create function private.permission_financial_allowed(e public.employees,p_permission text) returns boolean
language sql volatile set search_path=pg_catalog as $$
 select p_permission=any(private.configured_employee_permissions(e.role,e.permission_overrides))
$$;

create or replace function public.get_write_capabilities() returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog as $$
begin
 perform private.permission_financial_checkpoint();
 return jsonb_build_object('writeProtocolVersion',1,'maxPayloadBytes',262144,'pendingTtlSeconds',86400,'permissionContractVersion',2);
exception when sqlstate 'P0401' then return private.permission_failure(sqlerrm);
end $$;

create or replace function public.register_write_operation(p_operation_id uuid,p_payload jsonb) returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog as $$
declare e public.employees; w public.write_operations; at_time timestamptz; permission text;
begin
 e:=private.permission_current_employee(false);
 if not private.valid_write_payload(p_operation_id,p_payload) then return private.write_failure('INVALID_WRITE_REQUEST'); end if;
 permission:=private.write_permission(p_payload);
 perform pg_advisory_xact_lock(hashtext(auth.uid()::text||':pos-write'));
 select * into w from public.write_operations where store_id=auth.uid() and operation_id=p_operation_id for update;
 e:=private.permission_financial_checkpoint();
 if not private.permission_financial_allowed(e,coalesce(w.required_permission,permission)) then return private.write_failure('FORBIDDEN'); end if;
 if w.operation_id is not null then
  if w.payload<>p_payload then return private.write_failure('IDEMPOTENCY_KEY_REUSED'); end if;
 else
  at_time:=private.write_clock();
  if exists(select 1 from private.employee_sessions where store_id=auth.uid() and token_hash=private.employee_token_hash() and expires_at<=at_time) then return private.write_failure('EMPLOYEE_SESSION_REQUIRED'); end if;
  insert into public.write_operations(store_id,operation_id,schema_version,kind,action,required_permission,payload,registered_at,expires_at,initiated_by_employee_id)
  values(auth.uid(),p_operation_id,1,p_payload->>'kind',p_payload->>'action',permission,p_payload,at_time,at_time+interval '24 hours',e.id) returning * into w;
 end if;
 return jsonb_build_object('ok',true,'operation',private.operation_view(w));
exception when sqlstate 'P0401' then return private.permission_failure(sqlerrm);
end $$;

-- Replace the private dispatcher signature so printGrantId stays outside payload/R1.
drop function if exists public.execute_write_operation(uuid,jsonb);
drop function if exists public.get_write_operation(uuid);
drop function if exists public.cancel_write_operation(uuid);
drop function if exists private.write_operation_request(text,uuid,jsonb);
create function private.write_operation_request(p_mode text,p_operation_id uuid,p_payload jsonb default null,p_print_grant_id uuid default null) returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog as $$
declare e public.employees; w public.write_operations; plan jsonb; business_result jsonb; business_error jsonb; initial_print_grant jsonb;
 at_time timestamptz; before_version integer; after_version integer;
begin
 e:=private.permission_current_employee(false);
 if p_operation_id is null or p_operation_id='00000000-0000-0000-0000-000000000000'::uuid or
    (p_mode='execute' and not private.valid_write_payload(p_operation_id,p_payload)) then return private.write_failure('INVALID_WRITE_REQUEST'); end if;
 perform pg_advisory_xact_lock(hashtext(auth.uid()::text||':pos-write'));
 select * into w from public.write_operations where store_id=auth.uid() and operation_id=p_operation_id for update;
 if not found then
  perform private.permission_financial_checkpoint();
  return private.write_failure('OPERATION_NOT_FOUND');
 end if;
 if p_print_grant_id is not null and (p_mode<>'execute' or w.kind not in('pay_order','pay_order_items')) then return private.write_failure('INVALID_WRITE_REQUEST'); end if;
 e:=private.permission_current_employee(false);
 if not private.permission_financial_allowed(e,w.required_permission) then return private.write_failure('FORBIDDEN'); end if;
 if p_mode='execute' and w.payload<>p_payload then return private.write_failure('IDEMPOTENCY_KEY_REUSED'); end if;
 if w.status<>'pending' then
  e:=private.permission_financial_checkpoint();
  if not private.permission_financial_allowed(e,w.required_permission) then return private.write_failure('FORBIDDEN'); end if;
  if p_mode='execute' then update public.write_operations set replay_count=replay_count+1 where store_id=w.store_id and operation_id=w.operation_id returning * into w; end if;
  return jsonb_build_object('ok',true,'operation',private.operation_view(w));
 end if;
 if p_mode='execute' then perform private.lock_write_input(w.payload); end if;
 -- Both actor and immutable K initiator are FK parents of the event. Lock
 -- the complete UUID-ordered set, never actor first in a separate helper.
 e:=private.permission_financial_checkpoint(case when p_mode='execute' then array[w.initiated_by_employee_id] else array[]::uuid[] end);
 if not private.permission_financial_allowed(e,w.required_permission) then return private.write_failure('FORBIDDEN'); end if;
 if p_mode='execute' then
  -- Validation may be long. Record its known error, but expiry/auth at the final
  -- checkpoint take precedence. Nothing in this region writes business tables.
  begin plan:=private.prepare_write(w.payload);
  exception when sqlstate 'P0400' then business_error:=sqlerrm::jsonb;
  end;
 end if;
 at_time:=private.write_clock();
 -- A request can validate across midnight. Refresh its read-only create plan
 -- under the already-held store/catalog/numbering locks, then take a new final
 -- checkpoint. No numbering/financial effect or additional lock occurs here.
 while p_mode='execute' and w.action='create' and business_error is null and
       (plan->>'businessDate')::date is distinct from (at_time at time zone (plan->>'timezone'))::date loop
  begin plan:=private.prepare_write(w.payload);
  exception when sqlstate 'P0400' then business_error:=sqlerrm::jsonb;
  end;
  at_time:=private.write_clock();
 end loop;
 if exists(select 1 from private.employee_sessions where store_id=auth.uid() and token_hash=private.employee_token_hash() and expires_at<=at_time) then return private.write_failure('EMPLOYEE_SESSION_REQUIRED'); end if;
 if at_time>=w.expires_at then
  update public.write_operations set status='expired',decided_at=at_time where store_id=w.store_id and operation_id=w.operation_id returning * into w;
 elsif p_mode='cancel' then
  update public.write_operations set status='cancelled',decided_at=at_time,cancelled_by_employee_id=e.id where store_id=w.store_id and operation_id=w.operation_id returning * into w;
 elsif p_mode='execute' then
  if business_error is null then
   select lock_version into before_version from public.orders where store_id=w.store_id and id=w.order_id;
   begin
    business_result:=private.apply_write(w.payload,plan,e.id,at_time);
    select lock_version into after_version from public.orders where store_id=w.store_id and id=w.order_id;
    insert into public.order_events(id,store_id,operation_id,action,source_order_id,result_order_id,payment_id,initiated_by,executed_by,occurred_at,before_version,after_version,summary)
    values(gen_random_uuid(),w.store_id,w.operation_id,coalesce(w.action,w.kind),w.order_id,(w.payload->>'newOrderId')::uuid,(w.payload->>'paymentId')::uuid,
     w.initiated_by_employee_id,e.id,at_time,before_version,after_version,
     jsonb_build_object('kind',w.kind,'orderId',w.order_id,'resultOrderId',w.payload->>'newOrderId','paymentId',w.payload->>'paymentId',
      'total',coalesce(business_result#>'{order,total}',business_result#>'{paidOrder,total}')));
    update public.write_operations set status='applied',result=business_result,executed_by_employee_id=e.id,decided_at=at_time where store_id=w.store_id and operation_id=w.operation_id returning * into w;
    if p_print_grant_id is not null then
     execute 'select private.permission_create_initial_receipt_print_grant($1,$2,$3,$4,$5,$6)'
      into initial_print_grant using p_print_grant_id,w.store_id,w.operation_id,
      case when w.kind='pay_order_items' then (w.payload->>'newOrderId')::uuid else w.order_id end,e.id,at_time;
    end if;
   exception
    when sqlstate 'P0400' then business_error:=sqlerrm::jsonb;
    when unique_violation then business_error:=private.write_error('ENTITY_ID_CONFLICT');
   end;
  end if;
  if business_error is not null then
   -- This update is OUTSIDE the subtransaction, so a known rejection is durable
   -- while every earlier financial effect from that subtransaction rolled back.
   update public.write_operations set status='rejected',error=business_error,decided_at=at_time where store_id=w.store_id and operation_id=w.operation_id returning * into w;
  end if;
 end if;
 return jsonb_build_object('ok',true,'operation',private.operation_view(w))||
  case when initial_print_grant is null then '{}'::jsonb else jsonb_build_object('initialReceiptPrintGrant',initial_print_grant) end;
exception when sqlstate 'P0401' then return private.permission_failure(sqlerrm);
end $$;

create or replace function public.execute_write_operation(p_operation_id uuid,p_payload jsonb) returns jsonb
language sql volatile security definer set search_path=pg_catalog as $$ select private.write_operation_request('execute',p_operation_id,p_payload,null) $$;
create function public.execute_write_operation(p_operation_id uuid,p_payload jsonb,p_print_grant_id uuid) returns jsonb
language sql volatile security definer set search_path=pg_catalog as $$ select private.write_operation_request('execute',p_operation_id,p_payload,p_print_grant_id) $$;
create or replace function public.get_write_operation(p_operation_id uuid) returns jsonb
language sql volatile security definer set search_path=pg_catalog as $$ select private.write_operation_request('get',p_operation_id,null,null) $$;
create or replace function public.cancel_write_operation(p_operation_id uuid) returns jsonb
language sql volatile security definer set search_path=pg_catalog as $$ select private.write_operation_request('cancel',p_operation_id,null,null) $$;

create or replace function public.list_write_operations(p_order_id uuid default null,p_kinds text[] default null,p_statuses text[] default null,
 p_registered_from timestamptz default null,p_registered_to timestamptz default null,p_cursor text default null,p_limit integer default 50) returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog as $$
declare e public.employees; w public.write_operations; at_time timestamptz; cursor_value jsonb; scope text;
 cursor_at timestamptz; cursor_id uuid; next_cursor text; items jsonb:='[]'; item_count integer:=0; last_at timestamptz; last_id uuid;
begin
 e:=private.permission_current_employee(false);
 if p_limit is null or p_limit not between 1 and 100 or char_length(p_cursor)>512 or
    (p_order_id is not null and not private.valid_uuid(to_jsonb(p_order_id))) or
    (p_registered_from is not null and not isfinite(p_registered_from)) or (p_registered_to is not null and not isfinite(p_registered_to)) or
    p_registered_from>p_registered_to or
    exists(select 1 from unnest(p_kinds) k where k is null or k not in('submit_order_changes','pay_order','pay_order_items','void_order')) or
    exists(select 1 from unnest(p_statuses) s where s is null or s not in('pending','applied','rejected','cancelled','expired')) then return private.write_failure('INVALID_WRITE_REQUEST'); end if;
 scope:=encode(extensions.digest(jsonb_build_object('store',auth.uid(),'order',p_order_id,'kinds',p_kinds,'statuses',p_statuses,'from',p_registered_from,'to',p_registered_to)::text,'sha256'),'hex');
 if p_cursor is not null then
  begin
   cursor_value:=convert_from(decode(p_cursor,'base64'),'UTF8')::jsonb;
   if not private.exact_fields(cursor_value,array['at','id','scope']) or cursor_value->>'scope' is distinct from scope or
      not private.valid_uuid(cursor_value->'id') or jsonb_typeof(cursor_value->'at') is distinct from 'string' then return private.write_failure('INVALID_WRITE_REQUEST'); end if;
   cursor_at:=(cursor_value->>'at')::timestamptz; cursor_id:=(cursor_value->>'id')::uuid;
   if not isfinite(cursor_at) then return private.write_failure('INVALID_WRITE_REQUEST'); end if;
  exception when invalid_text_representation or invalid_parameter_value or invalid_datetime_format or datetime_field_overflow or character_not_in_repertoire then return private.write_failure('INVALID_WRITE_REQUEST');
  end;
 end if;
 perform pg_advisory_xact_lock(hashtext(auth.uid()::text||':pos-write'));
 -- Lock pending rows before reading final permissions. A grant committed while
 -- waiting may make another kind visible; it must not introduce a new row wait
 -- after the clock checkpoint. Results/expiry still filter by current permission.
 for w in select x.* from public.write_operations x where x.store_id=auth.uid() and x.status='pending' order by x.operation_id for update loop null; end loop;
 e:=private.permission_financial_checkpoint(); at_time:=private.write_clock();
 if exists(select 1 from private.employee_sessions where store_id=auth.uid() and token_hash=private.employee_token_hash() and expires_at<=at_time) then return private.write_failure('EMPLOYEE_SESSION_REQUIRED'); end if;
 update public.write_operations x set status='expired',decided_at=at_time where x.store_id=auth.uid() and x.status='pending' and x.expires_at<=at_time and private.permission_financial_allowed(e,x.required_permission);
 for w in select x.* from public.write_operations x where x.store_id=auth.uid()
  and private.permission_financial_allowed(e,x.required_permission)
  and (p_order_id is null or x.order_id=p_order_id) and (p_kinds is null or x.kind=any(p_kinds))
  and (p_statuses is null or x.status::text=any(p_statuses)) and (p_registered_from is null or x.registered_at>=p_registered_from)
  and (p_registered_to is null or x.registered_at<=p_registered_to)
  and (cursor_at is null or (x.registered_at,x.operation_id)<(cursor_at,cursor_id))
  order by x.registered_at desc,x.operation_id desc limit p_limit+1 loop
  -- No new locks here: employee/session/catalog are already held. Recheck
  -- session time and the stored action for each result, including page lookahead.
  e:=private.permission_current_employee(false);
  if not private.permission_financial_allowed(e,w.required_permission) then continue; end if;
  item_count:=item_count+1;
  if item_count>p_limit then
   next_cursor:=replace(encode(convert_to(jsonb_build_object('at',last_at,'id',last_id,'scope',scope)::text,'UTF8'),'base64'),E'\n',''); exit;
  end if;
  items:=items||jsonb_build_array(private.operation_view(w)); last_at:=w.registered_at; last_id:=w.operation_id;
 end loop;
 return jsonb_build_object('ok',true,'page',jsonb_build_object('items',items,'nextCursor',next_cursor,'serverTime',at_time));
exception when sqlstate 'P0401' then return private.permission_failure(sqlerrm);
end $$;

-- Preserve the protocol's public auth-error envelope without granting anonymous
-- business access. Each entry point still requires store JWT + employee session.
revoke all on function private.permission_financial_checkpoint(uuid[]),private.permission_financial_allowed(public.employees,text),
 private.write_operation_request(text,uuid,jsonb,uuid) from public,anon,authenticated,service_role;
revoke all on function public.get_write_capabilities(),public.register_write_operation(uuid,jsonb),public.execute_write_operation(uuid,jsonb),
 public.execute_write_operation(uuid,jsonb,uuid),public.get_write_operation(uuid),public.cancel_write_operation(uuid),public.list_write_operations(uuid,text[],text[],timestamptz,timestamptz,text,integer)
 from public,anon,authenticated,service_role;
grant execute on function public.get_write_capabilities(),public.register_write_operation(uuid,jsonb),public.execute_write_operation(uuid,jsonb),
 public.execute_write_operation(uuid,jsonb,uuid),public.get_write_operation(uuid),public.cancel_write_operation(uuid),public.list_write_operations(uuid,text[],text[],timestamptz,timestamptz,text,integer)
 to anon,authenticated;

-- CREATE OR REPLACE replaces proconfig too. Preserve migration 016's UTC wire
-- contract even when the caller changes its own session timezone.
alter function public.get_write_capabilities() set timezone='UTC';
alter function public.register_write_operation(uuid,jsonb) set timezone='UTC';
alter function public.execute_write_operation(uuid,jsonb) set timezone='UTC';
alter function public.execute_write_operation(uuid,jsonb,uuid) set timezone='UTC';
alter function public.get_write_operation(uuid) set timezone='UTC';
alter function public.cancel_write_operation(uuid) set timezone='UTC';
alter function public.list_write_operations(uuid,text[],text[],timestamptz,timestamptz,text,integer) set timezone='UTC';

-- Own the write boundary, including any column grants inherited by a deployment.
-- Sensitive business SELECT/projections are completed separately by T07.
revoke all on public.write_operations,public.order_events from public,anon,authenticated,service_role;
do $$ declare t text; c record; f record; begin
 foreach t in array array['orders','order_items','order_item_options','payments','write_operations','order_events'] loop
  execute format('revoke insert,update,delete,truncate,references,trigger on public.%I from public,anon,authenticated,service_role',t);
  for c in select attname from pg_attribute where attrelid=format('public.%I',t)::regclass and attnum>0 and not attisdropped loop
   execute format('revoke insert(%1$I),update(%1$I),references(%1$I) on public.%2$I from public,anon,authenticated,service_role',c.attname,t);
   if t in ('write_operations','order_events') then execute format('revoke select(%I) on public.%I from public,anon,authenticated,service_role',c.attname,t); end if;
  end loop;
 end loop;
 for f in select p.oid::regprocedure signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname in ('submit_order_changes','pay_order','pay_order_items','void_order') loop
  execute format('revoke all on function %s from public,anon,authenticated,service_role',f.signature);
 end loop;
end $$;
$permission_fragment_21$;
-- 23: supabase/candidate/permission-read.sql
 if clock_timestamp()>=least(started_at+interval '50 seconds','2026-10-22T10:00:00.000Z'::timestamptz) then raise exception 'STAGING_EXECUTION_WINDOW_CLOSED'; end if;
 execute $permission_fragment_22$-- PERM-T07 projection fragment, staged after T04-T06. Not an activation launcher.
-- Each public entry verifies current authority after any target-row wait. Raw
-- relations are closed below, including inherited per-column grants and views.

create function private.permission_read_guard(required text[]) returns void
language plpgsql volatile set search_path=pg_catalog as $$
declare e public.employees;
begin
 e:=private.permission_current_employee(true);
 if cardinality(required)>0 and not(required && private.configured_employee_permissions(e.role,e.permission_overrides)) then
  raise exception 'FORBIDDEN' using errcode='P0401';
 end if;
end $$;

-- Stored business_date remains the accounting key. Hour buckets are display
-- groupings in the store's configured IANA timezone, never the device timezone.
create function private.permission_read_report(sid uuid,business_day date) returns jsonb
language sql stable set search_path=pg_catalog as $$
 with paid as materialized (select * from public.orders where store_id=sid and business_date=business_day and status='paid'),
 totals as (select coalesce(sum(total),0) revenue,count(*) n from paid),
 hours as (select coalesce(to_char(coalesce(p.paid_at,p.created_at) at time zone s.timezone,'HH24'),'--') label,sum(p.total) revenue
   from paid p join public.store_settings s on s.store_id=sid group by 1),
 top_item as (select i.item_name,sum(i.quantity) quantity from public.order_items i join paid p on p.id=i.order_id
   where i.store_id=sid and i.status<>'removed' group by i.item_name order by quantity desc,i.item_name collate "C" limit 1),
 voided as (select count(*) n,coalesce(sum(total),0) amount from public.orders
   where store_id=sid and business_date=business_day and status='void' and paid_at is not null)
 select jsonb_build_object('businessDate',business_day,'revenue',t.revenue,'paidOrders',t.n,
  'averageTicket',case when t.n=0 then 0 else round(t.revenue::numeric/t.n) end,'topItemName',coalesce((select item_name from top_item),'-'),
  'hourlyRevenue',coalesce((select jsonb_agg(jsonb_build_object('label',label,'revenue',revenue) order by label) from hours),'[]'),
  'voidCount',v.n,'voidAmount',v.amount) from totals t cross join voided v
$$;

create function public.permission_get_sales_report(p_filter jsonb) returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog set timezone='UTC' as $$
declare result jsonb;
begin
 perform private.permission_current_employee(false);
 if not private.exact_fields(p_filter,array['businessDate'],array[]::text[]) or not private.permission_read_date(p_filter->'businessDate') then
  return private.write_failure('INVALID_WRITE_REQUEST');
 end if;
 perform private.permission_read_guard(array['report.view']);
 result:=private.permission_read_report(auth.uid(),(p_filter->>'businessDate')::date);
 perform private.permission_current_employee(false);
 return jsonb_build_object('ok',true,'data',result);
exception when sqlstate 'P0401' then return private.permission_failure(sqlerrm);
end $$;
create function private.permission_read_missing() returns jsonb
language sql immutable set search_path=pg_catalog as $$
 select jsonb_build_object('ok',false,'error',jsonb_build_object('code','NOT_FOUND','message','Không tìm thấy dữ liệu được phép truy cập.','details',null))
$$;
create function private.permission_read_date(v jsonb) returns boolean
language plpgsql immutable set search_path=pg_catalog as $$
begin
 if jsonb_typeof(v) is distinct from 'string' or (v#>>'{}') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then return false; end if;
 return to_char((v#>>'{}')::date,'YYYY-MM-DD')=(v#>>'{}');
exception when invalid_datetime_format or datetime_field_overflow then return false;
end $$;
create function private.permission_read_history_filter(p jsonb) returns boolean
language plpgsql immutable set search_path=pg_catalog as $$
begin
 if not private.exact_fields(p,array['page','pageSize'],array['fromDate','toDate','status','orderType','search','tableIds'])
  or not private.valid_integer(p->'page',1,9007199254740991) or not private.valid_integer(p->'pageSize',1,100) then return false; end if;
 if (p?'fromDate' and not private.permission_read_date(p->'fromDate')) or (p?'toDate' and not private.permission_read_date(p->'toDate'))
  or (p->>'fromDate')>(p->>'toDate') then return false; end if;
 if (p?'status' and (jsonb_typeof(p->'status')<>'string' or p->>'status' not in ('paid','void')))
  or (p?'orderType' and (jsonb_typeof(p->'orderType')<>'string' or p->>'orderType' not in ('dine_in','takeaway')))
  or (p?'search' and jsonb_typeof(p->'search')<>'string') then return false; end if;
 if p?'tableIds' then
  if jsonb_typeof(p->'tableIds')<>'array' then return false; end if;
  if exists(select 1 from jsonb_array_elements(p->'tableIds') v where not private.valid_uuid(v)) then return false; end if;
 end if;
 return true;
end $$;

create function private.permission_read_floor(sid uuid) returns jsonb
language sql stable set search_path=pg_catalog as $$
 with a as (select * from public.floor_areas where store_id=sid and deleted_at is null),
 t as (select t.* from public.tables t join a on a.id=t.area_id where t.store_id=sid and t.deleted_at is null),
 d as (select d.* from public.floor_decor_items d join a on a.id=d.area_id where d.store_id=sid and d.deleted_at is null)
 select jsonb_build_object(
  'areas',coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name,'sortOrder',sort_order) order by sort_order,id) from a),'[]'),
  'tables',coalesce((select jsonb_agg(jsonb_build_object('id',id,'areaId',area_id,'name',name,'backgroundAssetKey',background_asset_key,
    'posX',pos_x,'posY',pos_y,'width',width,'height',height,'shape',shape,'rotation',rotation,'seats',seats,'sortOrder',sort_order,'status',status) order by sort_order,id) from t),'[]'),
  'decorItems',coalesce((select jsonb_agg(jsonb_build_object('id',id,'areaId',area_id,'kind',kind,'label',label,'assetKey',asset_key,
    'posX',pos_x,'posY',pos_y,'width',width,'height',height,'rotation',rotation,'zIndex',z_index,'isLocked',is_locked) order by z_index,id) from d),'[]'))
$$;
create function private.permission_read_menu(sid uuid,operational boolean) returns jsonb
language sql stable set search_path=pg_catalog as $$
 with c as (select * from public.categories where store_id=sid and deleted_at is null),
 m as (select m.* from public.menu_items m join c on c.id=m.category_id where m.store_id=sid and m.deleted_at is null and (not operational or m.is_available)),
 l as (select l.* from public.menu_item_option_groups l join m on m.id=l.menu_item_id join public.option_groups g on g.store_id=l.store_id and g.id=l.option_group_id and g.deleted_at is null where l.store_id=sid and l.deleted_at is null),
 g as (select g.* from public.option_groups g where g.store_id=sid and g.deleted_at is null and (not operational or exists(select 1 from l where l.option_group_id=g.id))),
 v as (select v.* from public.option_values v join g on g.id=v.option_group_id where v.store_id=sid and v.deleted_at is null)
 select jsonb_build_object(
  'categories',coalesce((select jsonb_agg(jsonb_build_object('id',c.id,'name',c.name,'sortOrder',c.sort_order) order by c.sort_order,c.id) from c where not operational or exists(select 1 from m where m.category_id=c.id)),'[]'),
  'menuItems',coalesce((select jsonb_agg(jsonb_build_object('id',id,'categoryId',category_id,'name',name,'price',price,'imageAssetKey',image_asset_key,'sortOrder',sort_order,'isAvailable',is_available) order by sort_order,id) from m),'[]'),
  'optionGroups',coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name,'selectType',select_type,'isRequired',is_required,'sortOrder',sort_order) order by sort_order,id) from g),'[]'),
  'optionValues',coalesce((select jsonb_agg(jsonb_build_object('id',id,'optionGroupId',option_group_id,'name',name,'priceDelta',price_delta,'sortOrder',sort_order) order by sort_order,id) from v),'[]'),
  'menuItemOptionGroups',coalesce((select jsonb_agg(jsonb_build_object('id',id,'menuItemId',menu_item_id,'optionGroupId',option_group_id,'sortOrder',sort_order) order by sort_order,id) from l),'[]'))
$$;
create function private.permission_read_items(sid uuid,oid uuid) returns jsonb
language sql stable set search_path=pg_catalog as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',i.id,'menuItemId',i.menu_item_id,'itemName',i.item_name,'quantity',i.quantity,'unitPrice',i.unit_price,'note',i.note,
  'options',coalesce((select jsonb_agg(jsonb_build_object('id',v.id,'optionValueId',v.option_value_id,'optionName',v.option_name,'priceDelta',v.price_delta,'quantity',v.quantity)
    order by v.snapshot_sort_order,v.created_at,v.id) from public.order_item_options v where v.store_id=sid and v.order_item_id=i.id),'[]')) order by i.sort_order,i.created_at,i.id),'[]')
 from public.order_items i where i.store_id=sid and i.order_id=oid and i.status<>'removed'
$$;
create function private.permission_read_summary(o public.orders) returns jsonb
language sql immutable set search_path=pg_catalog as $$
 select jsonb_build_object('id',o.id,'orderNo',o.order_no,'status',o.status,'total',o.total,'lockVersion',o.lock_version,'tableId',o.table_id,'orderType',o.order_type,'businessDate',o.business_date)
$$;
-- Whitelist nested JSON before it crosses REST. Projection never rewrites the
-- immutable receipt or terminal R1; every supported v1 value remains unchanged.
create function private.permission_read_receipt(v jsonb) returns jsonb
language sql immutable strict set search_path=pg_catalog as $$
 select (select coalesce(jsonb_object_agg(key,value),'{}') from jsonb_each(v) where key=any(array[
  'schemaVersion','orderId','paymentId','orderNo','businessDate','storeName','address','footer','tableName','paidAt','employeeName','total','receivedAmount','changeAmount']))
 ||jsonb_build_object('lines',coalesce((select jsonb_agg(
   (select coalesce(jsonb_object_agg(key,value),'{}') from jsonb_each(line) where key=any(array[
    'orderItemId','menuItemId','name','quantity','baseUnitPrice','unitTotal','lineTotal','note']))
   ||jsonb_build_object('options',coalesce((select jsonb_agg(
      (select coalesce(jsonb_object_agg(key,value),'{}') from jsonb_each(opt) where key=any(array['optionValueId','name','priceDelta','quantity']))
      order by oi) from jsonb_array_elements(line->'options') with ordinality o(opt,oi)),'[]'))
   order by li) from jsonb_array_elements(v->'lines') with ordinality l(line,li)),'[]'))
$$;
create function private.permission_read_order(sid uuid,oid uuid,purpose text) returns jsonb
language sql stable set search_path=pg_catalog as $$
 select case purpose when 'open' then jsonb_build_object('id',o.id,'orderNo',o.order_no,'orderType',o.order_type,'tableId',o.table_id,
   'status',o.status,'total',o.total,'lockVersion',o.lock_version,'items',private.permission_read_items(sid,o.id))
  when 'void' then jsonb_build_object('id',o.id,'orderNo',o.order_no,'status',o.status,'total',o.total,'lockVersion',o.lock_version)
  when 'history' then private.permission_read_summary(o)||jsonb_build_object(
   'createdAt',o.created_at,'updatedAt',o.updated_at,'createdByEmployeeId',o.created_by_employee_id,'lastModifiedByEmployeeId',o.last_modified_by_employee_id,
   'items',private.permission_read_items(sid,o.id),'paidAt',o.paid_at,'voidedAt',o.voided_at,'voidedByEmployeeId',o.voided_by_employee_id,
   'voidReasonCode',o.void_reason_code,'voidReasonNote',o.void_reason_note,'receiptSnapshot',private.permission_read_receipt(p.receipt_snapshot),
   'payment',case when p.id is null then null else jsonb_build_object('id',p.id,'employeeId',p.employee_id,'method',p.method,'amount',p.amount,'receivedAmount',p.received_amount,'changeAmount',p.change_amount,'paidAt',p.paid_at) end,
   'cashierName',(select e.name from public.employees e where e.store_id=sid and e.id=p.employee_id),
   'voidedByName',(select e.name from public.employees e where e.store_id=sid and e.id=o.voided_by_employee_id)) end
 from public.orders o left join lateral (select * from public.payments p where p.store_id=sid and p.order_id=o.id order by p.paid_at desc,p.id desc limit 1) p on true
 where o.store_id=sid and o.id=oid and ((purpose='open' and o.status='open') or (purpose='void' and o.status='paid') or (purpose='history' and o.status in ('paid','void')))
$$;
create function private.permission_read_history(sid uuid,p jsonb) returns jsonb
language sql stable set search_path=pg_catalog as $$
 with f as (select private.permission_trim(regexp_replace(coalesce(p->>'search',''),'[%,()]','','g')) search),
 candidates as materialized (select o.* from public.orders o cross join f where o.store_id=sid and o.status in ('paid','void')
  and (not(p?'fromDate') or o.business_date>=(p->>'fromDate')::date) and (not(p?'toDate') or o.business_date<=(p->>'toDate')::date)
  and (not(p?'status') or o.status::text=p->>'status') and (not(p?'orderType') or o.order_type::text=p->>'orderType')
  and ((f.search='' and jsonb_array_length(coalesce(p->'tableIds','[]'))=0)
    or (f.search<>'' and ((regexp_replace(f.search,'^#','') ~ '^[0-9]+$' and o.order_no::text=coalesce(nullif(ltrim(regexp_replace(f.search,'^#',''),'0'),''),'0'))
       or position(lower(f.search) in o.id::text)>0 or position(lower(f.search) in coalesce(o.table_id::text,''))>0))
    or exists(select 1 from jsonb_array_elements_text(coalesce(p->'tableIds','[]')) x where x::uuid=o.table_id))),
 page as (select * from candidates order by business_date desc,order_no desc,id desc limit (p->>'pageSize')::numeric::int offset (((p->>'page')::numeric-1)*(p->>'pageSize')::numeric)::bigint)
 select jsonb_build_object('total',(select count(*) from candidates),'items',coalesce((select jsonb_agg(private.permission_read_summary(row(page.*)::public.orders) order by business_date desc,order_no desc,id desc) from page),'[]'))
$$;

-- Public read entry points and grant closure follow. Each query is a fresh
-- statement after the authority locks; projection builders share one snapshot.

-- T07 PUBLIC READ ENTRIES

create function public.permission_list_report_orders(p_filter jsonb) returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog set timezone='UTC' as $$
declare result jsonb;
begin
 perform private.permission_current_employee(false);
 if not private.exact_fields(p_filter,array['fromDate','toDate'],array[]::text[])
   or not private.permission_read_date(p_filter->'fromDate') or not private.permission_read_date(p_filter->'toDate')
   or (p_filter->>'fromDate')>(p_filter->>'toDate') then return private.write_failure('INVALID_WRITE_REQUEST'); end if;
 perform private.permission_read_guard(array['report.view']);
 select coalesce(jsonb_agg(jsonb_build_object('id',o.id,'orderNo',o.order_no,'businessDate',o.business_date,'orderType',o.order_type,
  'total',o.total,'status','paid','tableName',t.name) order by o.business_date desc,o.order_no desc,o.id desc),'[]') into result
 from (select id,order_no,business_date,order_type,total,table_id from public.orders where store_id=auth.uid() and status='paid'
  and business_date between (p_filter->>'fromDate')::date and (p_filter->>'toDate')::date
  order by business_date desc,order_no desc,id desc limit 20) o
 left join public.tables t on t.store_id=auth.uid() and t.id=o.table_id and t.deleted_at is null;
 perform private.permission_current_employee(false);
 return jsonb_build_object('ok',true,'data',result);
exception when sqlstate 'P0401' then return private.permission_failure(sqlerrm);
end $$;

create function public.permission_get_floor_operational() returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog set timezone='UTC' as $$
declare result jsonb;
begin
 perform private.permission_current_employee(false);
 
 
 
 perform private.permission_read_guard(array['floor.view']::text[]);
 result:=(select jsonb_build_object('floorPlan',private.permission_read_floor(auth.uid()),'openOrders',coalesce((select jsonb_agg(
 jsonb_build_object('id',o.id,'tableId',o.table_id,'orderType',o.order_type,'orderNo',o.order_no,'total',o.total,'createdAt',o.created_at) order by o.order_no,o.id)
 from public.orders o where o.store_id=auth.uid() and o.status='open'),'[]')));
 perform private.permission_current_employee(false);
 if result is null then return private.permission_read_missing(); end if;
 return jsonb_build_object('ok',true,'data',result);
exception when sqlstate 'P0401' then return private.permission_failure(sqlerrm);
end $$;

create function public.permission_get_floor_admin() returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog set timezone='UTC' as $$
declare result jsonb;
begin
 perform private.permission_current_employee(false);
 
 
 
 perform private.permission_read_guard(array['floor.manage']::text[]);
 result:=private.permission_read_floor(auth.uid());
 perform private.permission_current_employee(false);
 if result is null then return private.permission_read_missing(); end if;
 return jsonb_build_object('ok',true,'data',result);
exception when sqlstate 'P0401' then return private.permission_failure(sqlerrm);
end $$;

create function public.permission_get_pos_menu() returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog set timezone='UTC' as $$
declare result jsonb;
begin
 perform private.permission_current_employee(false);
 
 
 
 perform private.permission_read_guard(array['order.create','order.update']::text[]);
 result:=private.permission_read_menu(auth.uid(),true);
 perform private.permission_current_employee(false);
 if result is null then return private.permission_read_missing(); end if;
 return jsonb_build_object('ok',true,'data',result);
exception when sqlstate 'P0401' then return private.permission_failure(sqlerrm);
end $$;

create function public.permission_get_menu_admin() returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog set timezone='UTC' as $$
declare result jsonb;
begin
 perform private.permission_current_employee(false);
 
 
 
 perform private.permission_read_guard(array['menu.manage']::text[]);
 result:=private.permission_read_menu(auth.uid(),false);
 perform private.permission_current_employee(false);
 if result is null then return private.permission_read_missing(); end if;
 return jsonb_build_object('ok',true,'data',result);
exception when sqlstate 'P0401' then return private.permission_failure(sqlerrm);
end $$;

create function public.permission_get_open_order_detail(p_order_id uuid) returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog set timezone='UTC' as $$
declare result jsonb;
begin
 perform private.permission_current_employee(false);
 if not private.valid_uuid(to_jsonb(p_order_id)) then return private.write_failure('INVALID_WRITE_REQUEST'); end if;
 
 perform 1 from public.orders where store_id=auth.uid() and id=p_order_id for share;
 perform private.permission_read_guard(array['order.update','order.voidOpen','payment.take']::text[]);
 result:=private.permission_read_order(auth.uid(),p_order_id,'open');
 perform private.permission_current_employee(false);
 if result is null then return private.permission_read_missing(); end if;
 return jsonb_build_object('ok',true,'data',result);
exception when sqlstate 'P0401' then return private.permission_failure(sqlerrm);
end $$;

create function public.permission_get_paid_order_for_void(p_order_id uuid) returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog set timezone='UTC' as $$
declare result jsonb;
begin
 perform private.permission_current_employee(false);
 if not private.valid_uuid(to_jsonb(p_order_id)) then return private.write_failure('INVALID_WRITE_REQUEST'); end if;
 
 perform 1 from public.orders where store_id=auth.uid() and id=p_order_id for share;
 perform private.permission_read_guard(array['order.voidPaid']::text[]);
 result:=private.permission_read_order(auth.uid(),p_order_id,'void');
 perform private.permission_current_employee(false);
 if result is null then return private.permission_read_missing(); end if;
 return jsonb_build_object('ok',true,'data',result);
exception when sqlstate 'P0401' then return private.permission_failure(sqlerrm);
end $$;

create function public.permission_get_order_history_detail(p_order_id uuid) returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog set timezone='UTC' as $$
declare result jsonb;
begin
 perform private.permission_current_employee(false);
 if not private.valid_uuid(to_jsonb(p_order_id)) then return private.write_failure('INVALID_WRITE_REQUEST'); end if;
 
 perform 1 from public.orders where store_id=auth.uid() and id=p_order_id for share;
 perform private.permission_read_guard(array['orderHistory.view']::text[]);
 result:=private.permission_read_order(auth.uid(),p_order_id,'history');
 perform private.permission_current_employee(false);
 if result is null then return private.permission_read_missing(); end if;
 return jsonb_build_object('ok',true,'data',result);
exception when sqlstate 'P0401' then return private.permission_failure(sqlerrm);
end $$;

create function public.permission_list_order_history(p_filter jsonb) returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog set timezone='UTC' as $$
declare result jsonb;
begin
 perform private.permission_current_employee(false);
 
 if not private.permission_read_history_filter(p_filter) then return private.write_failure('INVALID_WRITE_REQUEST'); end if;
 
 perform private.permission_read_guard(array['orderHistory.view']::text[]);
 result:=private.permission_read_history(auth.uid(),p_filter);
 perform private.permission_current_employee(false);
 if result is null then return private.permission_read_missing(); end if;
 return jsonb_build_object('ok',true,'data',result);
exception when sqlstate 'P0401' then return private.permission_failure(sqlerrm);
end $$;

create function public.permission_get_store_display() returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog set timezone='UTC' as $$
declare result jsonb;
begin
 perform private.permission_current_employee(false);
 
 
 
 perform private.permission_read_guard(array[]::text[]);
 result:=(select jsonb_build_object('displayName',display_name,'address',address,'currency',currency,'timezone',timezone,'billFooter',bill_footer) from public.store_settings where store_id=auth.uid());
 perform private.permission_current_employee(false);
 if result is null then return private.permission_read_missing(); end if;
 return jsonb_build_object('ok',true,'data',result);
exception when sqlstate 'P0401' then return private.permission_failure(sqlerrm);
end $$;

create function public.permission_get_settings_admin() returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog set timezone='UTC' as $$
declare result jsonb;
begin
 perform private.permission_current_employee(false);
 
 
 
 perform private.permission_read_guard(array['settings.manage']::text[]);
 result:=(select jsonb_build_object('storeId',store_id,'displayName',display_name,'address',address,'currency',currency,'timezone',timezone,'billFooter',bill_footer) from public.store_settings where store_id=auth.uid());
 perform private.permission_current_employee(false);
 if result is null then return private.permission_read_missing(); end if;
 return jsonb_build_object('ok',true,'data',result);
exception when sqlstate 'P0401' then return private.permission_failure(sqlerrm);
end $$;

create or replace function public.get_payment_receipt(p_order_id uuid) returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog set timezone='UTC' as $$
declare result jsonb;
begin
 perform private.permission_current_employee(false);
 if not private.valid_uuid(to_jsonb(p_order_id)) then return private.write_failure('INVALID_WRITE_REQUEST'); end if;
 perform 1 from public.orders where store_id=auth.uid() and id=p_order_id for share;
 perform private.permission_read_guard(array['orderHistory.view','payment.take']);
 select jsonb_build_object('ok',true,'receipt',private.permission_read_receipt(coalesce(p.receipt_snapshot,private.receipt_snapshot(auth.uid(),p.id))),'legacyMetadata',p.receipt_snapshot is null)
 into result from public.orders o join lateral (select p.* from public.payments p where p.store_id=o.store_id and p.order_id=o.id order by p.paid_at desc,p.id desc limit 1) p on true
 where o.store_id=auth.uid() and o.id=p_order_id and o.status='paid';
 perform private.permission_current_employee(false);
 return coalesce(result,private.write_failure('RECEIPT_UNAVAILABLE'));
exception when sqlstate 'P0401' then return private.permission_failure(sqlerrm);
end $$;

-- These application relations are RPC-only. Close every inherited table and
-- column privilege, including provider-default TRUNCATE/REFERENCES/TRIGGER and
-- version-specific privileges such as PG17 MAINTAIN. Do not change unrelated
-- relations/default ACLs; T10 grants its separate signal SELECT explicitly.
-- Include the legacy history view retained by some installations.
do $$
declare t record; a record; f record;
begin
 for t in select c.oid,c.relname from pg_class c where c.relnamespace='public'::regnamespace and c.relname=any(array[
  'stores','store_settings','employees','categories','menu_items','option_groups','option_values','menu_item_option_groups',
  'floor_areas','tables','floor_decor_items','orders','order_items','order_item_options','payments','write_operations','order_events',
  'employee_admin_audit','permission_catalog','permission_catalog_state','permission_roles','role_permission_defaults','history_entries']) loop
  execute format('revoke all privileges on public.%I from public,anon,authenticated,service_role',t.relname);
  for a in select attname from pg_attribute where attrelid=t.oid and attnum>0 and not attisdropped loop
   execute format('revoke all privileges(%I) on public.%I from public,anon,authenticated,service_role',a.attname,t.relname);
  end loop;
 end loop;
 for f in select p.oid::regprocedure signature,n.nspname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where (n.nspname='private' and p.proname like 'permission_read_%')
     or (n.nspname='public' and (p.proname in ('permission_get_floor_operational','permission_get_pos_menu','permission_get_open_order_detail',
       'permission_get_paid_order_for_void','permission_list_order_history','permission_get_order_history_detail','get_payment_receipt',
       'permission_get_sales_report','permission_list_report_orders','permission_get_menu_admin','permission_get_floor_admin','permission_get_settings_admin','permission_get_store_display'))) loop
  execute format('revoke all on function %s from public,anon,authenticated,service_role',f.signature);
  if f.nspname='public' then execute format('grant execute on function %s to anon,authenticated',f.signature); end if;
 end loop;
end $$;
$permission_fragment_22$;
-- 24: supabase/candidate/permission-changes.sql
 if clock_timestamp()>=least(started_at+interval '50 seconds','2026-10-22T10:00:00.000Z'::timestamptz) then raise exception 'STAGING_EXECUTION_WINDOW_CLOSED'; end if;
 execute $permission_fragment_23$-- PERM-T08 staged non-financial write fragment. Apply after T01-T07 candidates.
-- This file is a candidate, not an activation migration.

create function private.permission_changes_failure(code text, details jsonb default null) returns jsonb
language sql volatile set search_path=pg_catalog as $$
 select case when details is null then private.permission_failure(code)
 else jsonb_build_object('ok',false,'error',(private.permission_failure(code)->'error')||jsonb_build_object('details',details)) end
$$;

create function private.permission_changes_checkpoint(required_permission text) returns public.employees
language plpgsql volatile security definer set search_path=pg_catalog as $$
declare sid uuid:=auth.uid(); eid uuid; actor public.employees;
begin
 if sid is null then raise exception 'AUTH_REQUIRED' using errcode='P0401'; end if;
 select employee_id into eid from private.employee_sessions where store_id=sid and token_hash=private.employee_token_hash();
 perform 1 from public.stores where id=sid for share;
 perform 1 from public.employees where store_id=sid and id=eid for share;
 perform 1 from private.employee_sessions where store_id=sid and token_hash=private.employee_token_hash() for share;
 perform private.permission_catalog_share();
 actor:=private.permission_current_employee(false);
 if not required_permission=any(private.configured_employee_permissions(actor.role,actor.permission_overrides)) then
  raise exception 'FORBIDDEN' using errcode='P0401';
 end if;
 return actor;
end $$;

create function private.permission_changes_valid_uuid_array(values_json jsonb) returns boolean
language sql immutable set search_path=pg_catalog as $$
 select jsonb_typeof(values_json)='array' and not exists(
  select 1 from jsonb_array_elements(values_json) x where jsonb_typeof(x)<>'object' or not private.valid_uuid(x->'id'))
$$;

create function private.permission_changes_valid_set(set_json jsonb, create_fields text[], update_fields text[], optional_create_fields text[] default array[]::text[]) returns boolean
language sql immutable set search_path=pg_catalog as $$
 select jsonb_typeof(set_json)='object' and set_json ?& array['created','updated','deleted']
 and set_json-array['created','updated','deleted']='{}'::jsonb
 and jsonb_typeof(set_json->'created')='array' and jsonb_typeof(set_json->'updated')='array' and jsonb_typeof(set_json->'deleted')='array'
 and not exists(select 1 from jsonb_array_elements(set_json->'created') x where jsonb_typeof(x)<>'object' or not x ?& create_fields or x-(create_fields||optional_create_fields)<>'{}'::jsonb or not private.valid_uuid(x->'id'))
 and not exists(select 1 from jsonb_array_elements(set_json->'updated') x where jsonb_typeof(x)<>'object' or not x ? 'id' or x-(update_fields||array['id'])<>'{}'::jsonb or (select count(*) from jsonb_object_keys(x))<2 or not private.valid_uuid(x->'id'))
 and not exists(select 1 from jsonb_array_elements(set_json->'deleted') x where jsonb_typeof(x)<>'object' or not x ? 'id' or x-array['id','deletedByEmployeeId']<>'{}'::jsonb or not private.valid_uuid(x->'id')
  or (x ? 'deletedByEmployeeId' and x->'deletedByEmployeeId'<>'null'::jsonb))
$$;

create function private.permission_changes_text(v jsonb, max_len int default 120, nullable boolean default false) returns boolean
language sql immutable set search_path=pg_catalog as $$
 select case when v is null then false when v='null'::jsonb then nullable
 else jsonb_typeof(v)='string' and char_length(btrim(v#>>'{}')) between 1 and max_len end
$$;
create function private.permission_changes_int(v jsonb, min_value int, max_value int) returns boolean
language sql immutable set search_path=pg_catalog as $$
 select jsonb_typeof(v)='number' and v::text~'^-?[0-9]+$' and v::text::numeric between min_value and max_value
$$;
create function private.permission_changes_bool(v jsonb) returns boolean language sql immutable set search_path=pg_catalog as $$ select jsonb_typeof(v)='boolean' $$;
create function private.permission_floor_asset(v jsonb, table_background boolean) returns boolean
language plpgsql immutable set search_path=pg_catalog as $$
declare key text; n int;
begin
 if v='null'::jsonb then return table_background; end if;
 if jsonb_typeof(v)<>'string' then return false; end if; key:=v#>>'{}';
 if table_background then
  if key !~ '^/floor-assets/tables/table-bg-[0-9]{2}\.png$' then return false; end if;
  n:=substring(key from '([0-9]{2})\.png$')::int; return n between 1 and 11;
 end if;
 if key='/floor-assets/walls/img-color-cell.png' then return true; end if;
 if key~'^/floor-assets/walls/img-color-cell[1-8]\.webp$' then return true; end if;
 if key !~ '^/floor-assets/decor/deco-(tree|seat|fixtures|other)-[0-9]{2}\.png$' then return false; end if;
 n:=substring(key from '([0-9]{2})\.png$')::int;
 return case substring(key from 'deco-([a-z]+)-') when 'tree' then n between 1 and 57 when 'seat' then n between 1 and 29 when 'fixtures' then n between 1 and 30 when 'other' then n between 1 and 15 else false end;
end $$;

create function private.permission_menu_valid(p jsonb) returns boolean
language plpgsql immutable set search_path=pg_catalog as $$
declare x jsonb;
begin
 if jsonb_typeof(p)<>'object' or not p ?& array['categories','menuItems','optionGroups','optionValues','menuItemOptionGroups']
 or p-array['categories','menuItems','optionGroups','optionValues','menuItemOptionGroups','imageChanges']<>'{}' then return false; end if;
 if not private.permission_changes_valid_set(p->'categories',array['id','name','sortOrder'],array['name','sortOrder'])
 or not private.permission_changes_valid_set(p->'menuItems',array['id','categoryId','name','price','sortOrder','isAvailable'],array['categoryId','name','price','imageAssetKey','sortOrder','isAvailable'],array['imageAssetKey'])
 or not private.permission_changes_valid_set(p->'optionGroups',array['id','name','selectType','isRequired','sortOrder'],array['name','selectType','isRequired','sortOrder'])
 or not private.permission_changes_valid_set(p->'optionValues',array['id','optionGroupId','name','priceDelta','sortOrder'],array['optionGroupId','name','priceDelta','sortOrder'])
 or not private.permission_changes_valid_set(p->'menuItemOptionGroups',array['id','menuItemId','optionGroupId','sortOrder'],array['menuItemId','optionGroupId','sortOrder']) then return false; end if;
 if p?'imageChanges' and (jsonb_typeof(p->'imageChanges')<>'array' or exists(select 1 from jsonb_array_elements(p->'imageChanges') j
  where jsonb_typeof(j)<>'object' or not j?&array['itemId','uploadHandle'] or j-array['itemId','uploadHandle']<>'{}'
  or not private.valid_uuid(j->'itemId') or (j->'uploadHandle'<>'null'::jsonb and not private.valid_uuid(j->'uploadHandle')))
  or (select count(*)<>count(distinct j->>'itemId') from jsonb_array_elements(p->'imageChanges') j)) then return false; end if;
 for x in select value from jsonb_array_elements((p->'categories'->'created')||(p->'categories'->'updated')) loop
  if (x?'name' and not private.permission_changes_text(x->'name')) or (x?'sortOrder' and not private.permission_changes_int(x->'sortOrder',0,2147483647)) then return false; end if; end loop;
 for x in select value from jsonb_array_elements((p->'menuItems'->'created')||(p->'menuItems'->'updated')) loop
  if (x?'categoryId' and not private.valid_uuid(x->'categoryId')) or (x?'name' and not private.permission_changes_text(x->'name'))
   or (x?'price' and not private.permission_changes_int(x->'price',0,2147483647)) or (x?'sortOrder' and not private.permission_changes_int(x->'sortOrder',0,2147483647))
   or (x?'isAvailable' and not private.permission_changes_bool(x->'isAvailable')) then return false; end if;
  -- T09 owns new private upload handles. T08 accepts no image on create and only
  -- an unchanged legacy reference on update (checked under the row lock below).
  if x ? 'imageAssetKey' and x->'imageAssetKey'<>'null'::jsonb and not private.permission_changes_text(x->'imageAssetKey',512) then return false; end if;
 end loop;
 for x in select value from jsonb_array_elements((p->'optionGroups'->'created')||(p->'optionGroups'->'updated')) loop
  if (x?'name' and not private.permission_changes_text(x->'name')) or (x?'selectType' and x->>'selectType' not in ('single','multi'))
   or (x?'isRequired' and not private.permission_changes_bool(x->'isRequired')) or (x?'sortOrder' and not private.permission_changes_int(x->'sortOrder',0,2147483647)) then return false; end if; end loop;
 for x in select value from jsonb_array_elements((p->'optionValues'->'created')||(p->'optionValues'->'updated')) loop
  if (x?'optionGroupId' and not private.valid_uuid(x->'optionGroupId')) or (x?'name' and not private.permission_changes_text(x->'name'))
   or (x?'priceDelta' and not private.permission_changes_int(x->'priceDelta',0,2147483647)) or (x?'sortOrder' and not private.permission_changes_int(x->'sortOrder',0,2147483647)) then return false; end if; end loop;
 for x in select value from jsonb_array_elements((p->'menuItemOptionGroups'->'created')||(p->'menuItemOptionGroups'->'updated')) loop
  if (x?'menuItemId' and not private.valid_uuid(x->'menuItemId')) or (x?'optionGroupId' and not private.valid_uuid(x->'optionGroupId'))
   or (x?'sortOrder' and not private.permission_changes_int(x->'sortOrder',0,2147483647)) then return false; end if; end loop;
 return true;
end $$;

create function private.permission_lock_changes(p jsonb, keys text[], tables text[]) returns void
language plpgsql volatile security definer set search_path=pg_catalog as $$
declare i int; rid uuid;
begin
 perform private.permission_store_mutex(auth.uid());
 perform pg_advisory_xact_lock(hashtext(auth.uid()::text||':pos-write'));
 perform pg_advisory_xact_lock(hashtext(auth.uid()::text||':catalog-write'));
 for i in 1..cardinality(keys) loop
  for rid in select distinct (j->>'id')::uuid from jsonb_array_elements((p->keys[i]->'updated')||(p->keys[i]->'deleted')) j order by 1 loop
   execute format('select 1 from public.%I where store_id=$1 and id=$2 for update',tables[i]) using auth.uid(),rid;
  end loop;
 end loop;
end $$;

create function public.apply_menu_changes(p_changes jsonb) returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog as $$
declare actor public.employees; x jsonb; current_key text; affected int:=0; sid uuid:=auth.uid();
begin
 perform private.permission_current_employee(false);
 if not private.permission_menu_valid(p_changes) then return private.permission_changes_failure('INVALID_WRITE_REQUEST'); end if;
 perform private.permission_lock_changes(p_changes,array['categories','menuItems','optionGroups','optionValues','menuItemOptionGroups'],array['categories','menu_items','option_groups','option_values','menu_item_option_groups']);
 -- Lock referenced parents after mutable targets and before the final checkpoint.
 perform 1 from public.categories where store_id=sid and id in (select (j->>'categoryId')::uuid from jsonb_array_elements((p_changes->'menuItems'->'created')||(p_changes->'menuItems'->'updated')) j where j?'categoryId') order by id for share;
 perform 1 from public.option_groups where store_id=sid and id in (select (j->>'optionGroupId')::uuid from jsonb_array_elements((p_changes->'optionValues'->'created')||(p_changes->'optionValues'->'updated')||(p_changes->'menuItemOptionGroups'->'created')||(p_changes->'menuItemOptionGroups'->'updated')) j where j?'optionGroupId') order by id for share;
 perform 1 from public.menu_items where store_id=sid and id in (select (j->>'menuItemId')::uuid from jsonb_array_elements((p_changes->'menuItemOptionGroups'->'created')||(p_changes->'menuItemOptionGroups'->'updated')) j where j?'menuItemId') order by id for share;
 perform 1 from public.menu_items where store_id=sid and id in (select (j->>'itemId')::uuid from jsonb_array_elements(coalesce(p_changes->'imageChanges','[]'::jsonb)) j) order by id for update;
 -- T09 supplies this helper. Dynamic dispatch keeps this T08 fragment stageable
 -- before the private image registry is installed; activation installs both.
 if p_changes?'imageChanges' then execute 'select private.permission_lock_menu_image_changes($1,$2)' using sid,p_changes->'imageChanges'; end if;
 actor:=private.permission_changes_checkpoint('menu.manage');
 -- Every update/delete id must resolve inside the current tenant.
 if exists(select 1 from (values ('categories','categories'),('menuItems','menu_items'),('optionGroups','option_groups'),('optionValues','option_values'),('menuItemOptionGroups','menu_item_option_groups')) v(k,t)
  cross join lateral jsonb_array_elements((p_changes->v.k->'updated')||(p_changes->v.k->'deleted')) j
  where case v.t when 'categories' then not exists(select 1 from public.categories q where q.store_id=sid and q.id=(j->>'id')::uuid)
   when 'menu_items' then not exists(select 1 from public.menu_items q where q.store_id=sid and q.id=(j->>'id')::uuid)
   when 'option_groups' then not exists(select 1 from public.option_groups q where q.store_id=sid and q.id=(j->>'id')::uuid)
   when 'option_values' then not exists(select 1 from public.option_values q where q.store_id=sid and q.id=(j->>'id')::uuid)
   else not exists(select 1 from public.menu_item_option_groups q where q.store_id=sid and q.id=(j->>'id')::uuid) end) then return private.permission_changes_failure('NOT_FOUND'); end if;
 if exists(select 1 from jsonb_array_elements(p_changes->'menuItems'->'created') j where j?'imageAssetKey' and j->'imageAssetKey'<>'null'::jsonb)
 or exists(select 1 from jsonb_array_elements(p_changes->'menuItems'->'updated') j join public.menu_items m on m.store_id=sid and m.id=(j->>'id')::uuid where j?'imageAssetKey' and j->>'imageAssetKey' is distinct from m.image_asset_key) then
  return private.permission_changes_failure('INVALID_WRITE_REQUEST');
 end if;
 -- Create parents before children.
 for x in select value from jsonb_array_elements(p_changes->'categories'->'created') loop insert into public.categories(id,store_id,name,sort_order) values((x->>'id')::uuid,sid,btrim(x->>'name'),(x->>'sortOrder')::int); affected:=affected+1; end loop;
 for x in select value from jsonb_array_elements(p_changes->'menuItems'->'created') loop insert into public.menu_items(id,store_id,category_id,name,price,sort_order,is_available) values((x->>'id')::uuid,sid,(x->>'categoryId')::uuid,btrim(x->>'name'),(x->>'price')::int,(x->>'sortOrder')::int,(x->>'isAvailable')::boolean); affected:=affected+1; end loop;
 for x in select value from jsonb_array_elements(p_changes->'optionGroups'->'created') loop insert into public.option_groups(id,store_id,name,select_type,is_required,sort_order) values((x->>'id')::uuid,sid,btrim(x->>'name'),(x->>'selectType')::public.option_select_type,(x->>'isRequired')::boolean,(x->>'sortOrder')::int); affected:=affected+1; end loop;
 for x in select value from jsonb_array_elements(p_changes->'optionValues'->'created') loop insert into public.option_values(id,store_id,option_group_id,name,price_delta,sort_order) values((x->>'id')::uuid,sid,(x->>'optionGroupId')::uuid,btrim(x->>'name'),(x->>'priceDelta')::int,(x->>'sortOrder')::int); affected:=affected+1; end loop;
 for x in select value from jsonb_array_elements(p_changes->'menuItemOptionGroups'->'created') loop insert into public.menu_item_option_groups(id,store_id,menu_item_id,option_group_id,sort_order) values((x->>'id')::uuid,sid,(x->>'menuItemId')::uuid,(x->>'optionGroupId')::uuid,(x->>'sortOrder')::int); affected:=affected+1; end loop;
 for x in select value from jsonb_array_elements(coalesce(p_changes->'imageChanges','[]'::jsonb)) loop
  -- Draft IDs may be staged before creation, but only an active item in this
  -- transaction can publish. Raise (rather than return) to roll back earlier inserts.
  perform 1 from public.menu_items where store_id=sid and id=(x->>'itemId')::uuid and deleted_at is null;
  if not found or exists(select 1 from jsonb_array_elements(p_changes->'menuItems'->'deleted') d where d->>'id'=x->>'itemId') then
   raise exception 'NOT_FOUND' using errcode='P0404';
  end if;
  if x->'uploadHandle'='null'::jsonb then
   select image_asset_key into current_key from public.menu_items where store_id=sid and id=(x->>'itemId')::uuid;
   if current_key is not null then execute 'select private.permission_unpublish_menu_image($1,$2,$3)' using sid,(x->>'itemId')::uuid,current_key; end if;
   update public.menu_items set image_asset_key=null where store_id=sid and id=(x->>'itemId')::uuid;
  else
   execute 'select private.permission_finalize_menu_image($1,$2,$3)' into current_key using sid,(x->>'itemId')::uuid,(x->>'uploadHandle')::uuid;
   update public.menu_items set image_asset_key=current_key where store_id=sid and id=(x->>'itemId')::uuid;
  end if; affected:=affected+1;
 end loop;
 -- JSON populate_record limits updates to the explicit whitelist without dynamic SQL.
 for x in select value from jsonb_array_elements(p_changes->'categories'->'updated') loop update public.categories q set name=coalesce(btrim(x->>'name'),q.name),sort_order=coalesce((x->>'sortOrder')::int,q.sort_order) where q.store_id=sid and q.id=(x->>'id')::uuid; affected:=affected+1; end loop;
 for x in select value from jsonb_array_elements(p_changes->'menuItems'->'updated') loop update public.menu_items q set category_id=coalesce((x->>'categoryId')::uuid,q.category_id),name=coalesce(btrim(x->>'name'),q.name),price=coalesce((x->>'price')::int,q.price),sort_order=coalesce((x->>'sortOrder')::int,q.sort_order),is_available=coalesce((x->>'isAvailable')::boolean,q.is_available) where q.store_id=sid and q.id=(x->>'id')::uuid; affected:=affected+1; end loop;
 for x in select value from jsonb_array_elements(p_changes->'optionGroups'->'updated') loop update public.option_groups q set name=coalesce(btrim(x->>'name'),q.name),select_type=coalesce((x->>'selectType')::public.option_select_type,q.select_type),is_required=coalesce((x->>'isRequired')::boolean,q.is_required),sort_order=coalesce((x->>'sortOrder')::int,q.sort_order) where q.store_id=sid and q.id=(x->>'id')::uuid; affected:=affected+1; end loop;
 for x in select value from jsonb_array_elements(p_changes->'optionValues'->'updated') loop update public.option_values q set option_group_id=coalesce((x->>'optionGroupId')::uuid,q.option_group_id),name=coalesce(btrim(x->>'name'),q.name),price_delta=coalesce((x->>'priceDelta')::int,q.price_delta),sort_order=coalesce((x->>'sortOrder')::int,q.sort_order) where q.store_id=sid and q.id=(x->>'id')::uuid; affected:=affected+1; end loop;
 for x in select value from jsonb_array_elements(p_changes->'menuItemOptionGroups'->'updated') loop update public.menu_item_option_groups q set menu_item_id=coalesce((x->>'menuItemId')::uuid,q.menu_item_id),option_group_id=coalesce((x->>'optionGroupId')::uuid,q.option_group_id),sort_order=coalesce((x->>'sortOrder')::int,q.sort_order) where q.store_id=sid and q.id=(x->>'id')::uuid; affected:=affected+1; end loop;
 -- Tombstone children before parents; actor comes only from the authenticated session.
 for current_key in select unnest(array['menuItemOptionGroups','optionValues','optionGroups','menuItems','categories']) loop
  for x in select value from jsonb_array_elements(p_changes->current_key->'deleted') loop
   case current_key
    when 'menuItemOptionGroups' then update public.menu_item_option_groups set deleted_at=coalesce(deleted_at,now()),deleted_by_employee_id=actor.id where store_id=sid and id=(x->>'id')::uuid;
    when 'optionValues' then update public.option_values set deleted_at=coalesce(deleted_at,now()),deleted_by_employee_id=actor.id where store_id=sid and id=(x->>'id')::uuid;
    when 'optionGroups' then update public.option_groups set deleted_at=coalesce(deleted_at,now()),deleted_by_employee_id=actor.id where store_id=sid and id=(x->>'id')::uuid;
    when 'menuItems' then update public.menu_items set deleted_at=coalesce(deleted_at,now()),deleted_by_employee_id=actor.id where store_id=sid and id=(x->>'id')::uuid;
    else update public.categories set deleted_at=coalesce(deleted_at,now()),deleted_by_employee_id=actor.id where store_id=sid and id=(x->>'id')::uuid; end case; affected:=affected+1;
  end loop;
 end loop;
 return jsonb_build_object('ok',true,'data',null);
exception when sqlstate 'P0401' then return private.permission_failure(sqlerrm); when sqlstate 'P0404' then return private.permission_changes_failure('NOT_FOUND'); when unique_violation or foreign_key_violation or check_violation then return private.permission_changes_failure('INVALID_WRITE_REQUEST');
end $$;

create function private.permission_floor_valid(p jsonb) returns boolean language plpgsql immutable set search_path=pg_catalog as $$
declare x jsonb;
begin
 if jsonb_typeof(p)<>'object' or not p?&array['areas','tables','decorItems'] or p-array['areas','tables','decorItems']<>'{}' then return false; end if;
 if not private.permission_changes_valid_set(p->'areas',array['id','name','sortOrder'],array['name','sortOrder'])
 or not private.permission_changes_valid_set(p->'tables',array['id','areaId','name','backgroundAssetKey','posX','posY','width','height','shape','rotation','seats','sortOrder'],array['areaId','name','backgroundAssetKey','posX','posY','width','height','shape','rotation','seats','sortOrder'])
 or not private.permission_changes_valid_set(p->'decorItems',array['id','areaId','kind','label','assetKey','posX','posY','width','height','rotation','zIndex','isLocked'],array['areaId','kind','label','assetKey','posX','posY','width','height','rotation','zIndex','isLocked']) then return false; end if;
 for x in select value from jsonb_array_elements((p->'areas'->'created')||(p->'areas'->'updated')) loop if (x?'name' and not private.permission_changes_text(x->'name')) or (x?'sortOrder' and not private.permission_changes_int(x->'sortOrder',0,2147483647)) then return false; end if; end loop;
 for x in select value from jsonb_array_elements((p->'tables'->'created')||(p->'tables'->'updated')) loop
  if (x?'areaId' and not private.valid_uuid(x->'areaId')) or (x?'name' and not private.permission_changes_text(x->'name')) or (x?'shape' and x->>'shape' not in('round','square','rectangle'))
   or (x?'backgroundAssetKey' and not private.permission_floor_asset(x->'backgroundAssetKey',true))
   or exists(select 1 from jsonb_each(x) e where e.key=any(array['posX','posY','rotation']) and not private.permission_changes_int(e.value,-100000,100000))
   or exists(select 1 from jsonb_each(x) e where e.key=any(array['width','height','seats']) and not private.permission_changes_int(e.value,1,100000))
   or (x?'sortOrder' and not private.permission_changes_int(x->'sortOrder',0,2147483647)) then return false; end if; end loop;
 for x in select value from jsonb_array_elements((p->'decorItems'->'created')||(p->'decorItems'->'updated')) loop
  if (x?'areaId' and not private.valid_uuid(x->'areaId')) or (x?'kind' and x->>'kind' not in('wall','plant','counter','door','decor','image'))
   or (x?'label' and not private.permission_changes_text(x->'label',120,true)) or (x?'assetKey' and not private.permission_floor_asset(x->'assetKey',false))
   or exists(select 1 from jsonb_each(x) e where e.key=any(array['posX','posY','rotation','zIndex']) and not private.permission_changes_int(e.value,-100000,100000))
   or exists(select 1 from jsonb_each(x) e where e.key=any(array['width','height']) and not private.permission_changes_int(e.value,1,100000))
   or (x?'isLocked' and not private.permission_changes_bool(x->'isLocked')) then return false; end if; end loop;
 return true;
end $$;

create function public.apply_floor_changes(p_changes jsonb) returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog as $$
declare actor public.employees; x jsonb; sid uuid:=auth.uid(); affected int:=0;
begin
 perform private.permission_current_employee(false);
 if not private.permission_floor_valid(p_changes) then return private.permission_changes_failure('INVALID_WRITE_REQUEST'); end if;
 perform private.permission_lock_changes(p_changes,array['areas','tables','decorItems'],array['floor_areas','tables','floor_decor_items']);
 perform 1 from public.floor_areas where store_id=sid and id in (select (j->>'areaId')::uuid from jsonb_array_elements((p_changes->'tables'->'created')||(p_changes->'tables'->'updated')||(p_changes->'decorItems'->'created')||(p_changes->'decorItems'->'updated')) j where j?'areaId') order by id for share;
 actor:=private.permission_changes_checkpoint('floor.manage');
 if exists(select 1 from jsonb_array_elements((p_changes->'areas'->'updated')||(p_changes->'areas'->'deleted')) j
   where not exists(select 1 from public.floor_areas q where q.store_id=sid and q.id=(j->>'id')::uuid))
 or exists(select 1 from jsonb_array_elements((p_changes->'tables'->'updated')||(p_changes->'tables'->'deleted')) j
   where not exists(select 1 from public.tables q where q.store_id=sid and q.id=(j->>'id')::uuid))
 or exists(select 1 from jsonb_array_elements((p_changes->'decorItems'->'updated')||(p_changes->'decorItems'->'deleted')) j
   where not exists(select 1 from public.floor_decor_items q where q.store_id=sid and q.id=(j->>'id')::uuid)) then return private.permission_changes_failure('NOT_FOUND'); end if;
  -- All target rows are locked above. Reject the whole request before its first
  -- mutation when any requested table deletion is no longer allowed.
  if exists(select 1 from jsonb_array_elements(p_changes->'tables'->'deleted') j
    join public.tables q on q.store_id=sid and q.id=(j->>'id')::uuid where q.status<>'empty') then
   return private.permission_changes_failure('INVALID_WRITE_REQUEST');
  end if;
 for x in select value from jsonb_array_elements(p_changes->'areas'->'created') loop insert into public.floor_areas(id,store_id,name,sort_order) values((x->>'id')::uuid,sid,btrim(x->>'name'),(x->>'sortOrder')::int); affected:=affected+1; end loop;
 for x in select value from jsonb_array_elements(p_changes->'tables'->'created') loop insert into public.tables(id,store_id,area_id,name,background_asset_key,pos_x,pos_y,width,height,shape,rotation,seats,sort_order) values((x->>'id')::uuid,sid,(x->>'areaId')::uuid,btrim(x->>'name'),x->>'backgroundAssetKey',(x->>'posX')::int,(x->>'posY')::int,(x->>'width')::int,(x->>'height')::int,(x->>'shape')::public.table_shape,(x->>'rotation')::int,(x->>'seats')::int,(x->>'sortOrder')::int); affected:=affected+1; end loop;
 for x in select value from jsonb_array_elements(p_changes->'decorItems'->'created') loop insert into public.floor_decor_items(id,store_id,area_id,kind,label,asset_key,pos_x,pos_y,width,height,rotation,z_index,is_locked) values((x->>'id')::uuid,sid,(x->>'areaId')::uuid,(x->>'kind')::public.decor_kind,nullif(x->>'label',''),x->>'assetKey',(x->>'posX')::int,(x->>'posY')::int,(x->>'width')::int,(x->>'height')::int,(x->>'rotation')::int,(x->>'zIndex')::int,(x->>'isLocked')::boolean); affected:=affected+1; end loop;
 for x in select value from jsonb_array_elements(p_changes->'areas'->'updated') loop update public.floor_areas q set name=coalesce(btrim(x->>'name'),q.name),sort_order=coalesce((x->>'sortOrder')::int,q.sort_order) where store_id=sid and id=(x->>'id')::uuid; affected:=affected+1; end loop;
 for x in select value from jsonb_array_elements(p_changes->'tables'->'updated') loop update public.tables q set area_id=coalesce((x->>'areaId')::uuid,q.area_id),name=coalesce(btrim(x->>'name'),q.name),background_asset_key=case when x?'backgroundAssetKey' then x->>'backgroundAssetKey' else q.background_asset_key end,pos_x=coalesce((x->>'posX')::int,q.pos_x),pos_y=coalesce((x->>'posY')::int,q.pos_y),width=coalesce((x->>'width')::int,q.width),height=coalesce((x->>'height')::int,q.height),shape=coalesce((x->>'shape')::public.table_shape,q.shape),rotation=coalesce((x->>'rotation')::int,q.rotation),seats=coalesce((x->>'seats')::int,q.seats),sort_order=coalesce((x->>'sortOrder')::int,q.sort_order) where store_id=sid and id=(x->>'id')::uuid; affected:=affected+1; end loop;
 for x in select value from jsonb_array_elements(p_changes->'decorItems'->'updated') loop update public.floor_decor_items q set area_id=coalesce((x->>'areaId')::uuid,q.area_id),kind=coalesce((x->>'kind')::public.decor_kind,q.kind),label=case when x?'label' then nullif(x->>'label','') else q.label end,asset_key=coalesce(x->>'assetKey',q.asset_key),pos_x=coalesce((x->>'posX')::int,q.pos_x),pos_y=coalesce((x->>'posY')::int,q.pos_y),width=coalesce((x->>'width')::int,q.width),height=coalesce((x->>'height')::int,q.height),rotation=coalesce((x->>'rotation')::int,q.rotation),z_index=coalesce((x->>'zIndex')::int,q.z_index),is_locked=coalesce((x->>'isLocked')::boolean,q.is_locked) where store_id=sid and id=(x->>'id')::uuid; affected:=affected+1; end loop;
 for x in select value from jsonb_array_elements(p_changes->'decorItems'->'deleted') loop update public.floor_decor_items set deleted_at=coalesce(deleted_at,now()),deleted_by_employee_id=actor.id where store_id=sid and id=(x->>'id')::uuid; affected:=affected+1; end loop;
 for x in select value from jsonb_array_elements(p_changes->'tables'->'deleted') loop update public.tables set deleted_at=coalesce(deleted_at,now()),deleted_by_employee_id=actor.id where store_id=sid and id=(x->>'id')::uuid and status='empty'; if not found then return private.permission_changes_failure('INVALID_WRITE_REQUEST'); end if; affected:=affected+1; end loop;
 for x in select value from jsonb_array_elements(p_changes->'areas'->'deleted') loop update public.floor_areas set deleted_at=coalesce(deleted_at,now()),deleted_by_employee_id=actor.id where store_id=sid and id=(x->>'id')::uuid; affected:=affected+1; end loop;
 return jsonb_build_object('ok',true,'data',null);
exception when sqlstate 'P0401' then return private.permission_failure(sqlerrm); when unique_violation or foreign_key_violation or check_violation then return private.permission_changes_failure('INVALID_WRITE_REQUEST');
end $$;

create function public.update_store_settings(p_input jsonb) returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog as $$
declare actor public.employees; before_row public.store_settings; after_row public.store_settings; sid uuid:=auth.uid();
begin
 perform private.permission_current_employee(false);
 if jsonb_typeof(p_input)<>'object' or p_input='{}'::jsonb or p_input-array['displayName','address','billFooter','timezone']<>'{}'
 or (p_input?'displayName' and not private.permission_changes_text(p_input->'displayName',120))
 or (p_input?'address' and (jsonb_typeof(p_input->'address')<>'string' or char_length(p_input->>'address')>500))
 or (p_input?'billFooter' and (jsonb_typeof(p_input->'billFooter')<>'string' or char_length(p_input->>'billFooter')>500))
 or (p_input?'timezone' and (jsonb_typeof(p_input->'timezone')<>'string' or not exists(select 1 from pg_timezone_names where name=p_input->>'timezone'))) then return private.permission_changes_failure('INVALID_WRITE_REQUEST'); end if;
 perform private.permission_store_mutex(sid);
 select * into before_row from public.store_settings where store_id=sid for update;
 actor:=private.permission_changes_checkpoint('settings.manage');
 if before_row.store_id is null then return private.permission_changes_failure('NOT_FOUND'); end if;
 if p_input?'timezone' and p_input->>'timezone' is distinct from before_row.timezone and actor.role<>'owner' then return private.permission_changes_failure('FORBIDDEN'); end if;
 update public.store_settings set display_name=case when p_input?'displayName' then btrim(p_input->>'displayName') else display_name end,address=case when p_input?'address' then p_input->>'address' else address end,bill_footer=case when p_input?'billFooter' then p_input->>'billFooter' else bill_footer end,timezone=case when p_input?'timezone' then p_input->>'timezone' else timezone end where store_id=sid returning * into after_row;
 return jsonb_build_object('ok',true,'data',jsonb_build_object('storeId',after_row.store_id,'displayName',after_row.display_name,'address',after_row.address,'currency',after_row.currency,'timezone',after_row.timezone,'billFooter',after_row.bill_footer));
exception when sqlstate 'P0401' then return private.permission_failure(sqlerrm); end $$;

create or replace function public.clear_demo_data(p_request_id uuid,p_confirmation boolean) returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog as $$
declare sid uuid:=auth.uid(); actor public.employees; demo public.employees; prior private.employee_admin_requests;
 mac_key private.permission_request_mac_keys; payload_mac bytea; actor_rights text[]; catrev bigint;
 before_json jsonb; after_json jsonb; result jsonb; audit_keys jsonb:='[]'::jsonb;
 why text; outcome text; n int:=0; menu_changed boolean:=false; floor_changed boolean:=false;
 employee_changed boolean:=false;
begin
 -- This preliminary read rejects missing/revoked sessions before any request
 -- registry or audit work. Authority is checked again after every bulk lock.
 actor:=private.permission_current_employee(false);
 if p_request_id is null then return private.permission_changes_failure('INVALID_WRITE_REQUEST'); end if;
 perform private.permission_store_mutex(sid);
 perform pg_advisory_xact_lock(hashtext(sid::text||':pos-write'));
 perform pg_advisory_xact_lock(hashtext(sid::text||':catalog-write'));
 perform 1 from public.orders where store_id=sid and status='open' order by id for share;
 -- Seed rows only. Finance, K/R1, prior audit, custom rows and owner survive.
 perform 1 from public.menu_item_option_groups where store_id=sid and seed_key is not null order by id for update;
 perform 1 from public.option_values where store_id=sid and seed_key is not null order by id for update;
 perform 1 from public.option_groups where store_id=sid and seed_key is not null order by id for update;
 perform 1 from public.menu_items where store_id=sid and seed_key is not null order by id for update;
 perform 1 from public.categories where store_id=sid and seed_key is not null order by id for update;
 perform 1 from public.floor_decor_items where store_id=sid and seed_key is not null order by id for update;
 perform 1 from public.tables where store_id=sid and seed_key is not null order by id for update;
 perform 1 from public.floor_areas where store_id=sid and seed_key is not null order by id for update;
 perform 1 from public.employees where store_id=sid and seed_key is not null and role<>'owner' order by id for update;
 perform 1 from private.employee_sessions s where s.store_id=sid and exists(
  select 1 from public.employees e where e.store_id=sid and e.id=s.employee_id and e.seed_key is not null and e.role<>'owner'
 ) order by s.token_hash for update;

 select * into prior from private.employee_admin_requests r where r.store_id=sid and r.actor_type='employee'
  and r.actor_key=actor.id::text and r.request_id=p_request_id;
 select * into mac_key from private.permission_request_mac_keys where key_version=coalesce(
  prior.mac_key_version,(select max(key_version) from private.permission_request_mac_keys)) for share;
 if mac_key.key_version is null then return private.permission_changes_failure('PERMISSION_UPDATE_UNAVAILABLE'); end if;
 payload_mac:=extensions.hmac(convert_to(jsonb_build_object('kind','clear_demo_data','requestId',p_request_id,
  'confirmation',p_confirmation)::text,'UTF8'),mac_key.secret_bytes,'sha256');

 -- Recheck the live session/catalog after waiting. floor.view is the baseline
 -- checkpoint; owner-only clear authority is evaluated below so verified
 -- denials can be persisted instead of being raised and rolled back.
 actor:=private.permission_changes_checkpoint('floor.view');
 actor_rights:=private.configured_employee_permissions(actor.role,actor.permission_overrides);
 catrev:=(select revision from public.permission_catalog_state where singleton);
 if prior.request_id is not null then
  if prior.payload_mac<>payload_mac then return private.permission_changes_failure('ADMIN_REQUEST_REUSED'); end if;
  if actor.role<>'owner' or not 'data.clearDemo'=any(actor_rights) then return private.permission_changes_failure('FORBIDDEN'); end if;
  return prior.terminal_outcome;
 end if;

 if actor.role<>'owner' or not 'data.clearDemo'=any(actor_rights) then why:='FORBIDDEN';
 elsif p_confirmation is distinct from true then why:='INVALID_WRITE_REQUEST';
 elsif exists(select 1 from public.orders where store_id=sid and status='open') then why:='OPEN_ORDERS_BLOCK_CLEAR_DEMO';
 end if;

 if why is null then
  update public.menu_item_option_groups set deleted_at=coalesce(deleted_at,private.write_clock()),deleted_by_employee_id=actor.id where store_id=sid and seed_key is not null and deleted_at is null; get diagnostics n=row_count; menu_changed:=menu_changed or n>0;
  update public.option_values set deleted_at=coalesce(deleted_at,private.write_clock()),deleted_by_employee_id=actor.id where store_id=sid and seed_key is not null and deleted_at is null; get diagnostics n=row_count; menu_changed:=menu_changed or n>0;
  update public.option_groups set deleted_at=coalesce(deleted_at,private.write_clock()),deleted_by_employee_id=actor.id where store_id=sid and seed_key is not null and deleted_at is null; get diagnostics n=row_count; menu_changed:=menu_changed or n>0;
  update public.menu_items set deleted_at=coalesce(deleted_at,private.write_clock()),deleted_by_employee_id=actor.id where store_id=sid and seed_key is not null and deleted_at is null; get diagnostics n=row_count; menu_changed:=menu_changed or n>0;
  update public.categories set deleted_at=coalesce(deleted_at,private.write_clock()),deleted_by_employee_id=actor.id where store_id=sid and seed_key is not null and deleted_at is null; get diagnostics n=row_count; menu_changed:=menu_changed or n>0;
  update public.floor_decor_items set deleted_at=coalesce(deleted_at,private.write_clock()),deleted_by_employee_id=actor.id where store_id=sid and seed_key is not null and deleted_at is null; get diagnostics n=row_count; floor_changed:=floor_changed or n>0;
  update public.tables set deleted_at=coalesce(deleted_at,private.write_clock()),deleted_by_employee_id=actor.id where store_id=sid and seed_key is not null and deleted_at is null; get diagnostics n=row_count; floor_changed:=floor_changed or n>0;
  update public.floor_areas set deleted_at=coalesce(deleted_at,private.write_clock()),deleted_by_employee_id=actor.id where store_id=sid and seed_key is not null and deleted_at is null; get diagnostics n=row_count; floor_changed:=floor_changed or n>0;
 end if;

 -- A verified denial is audited against each concrete same-store demo identity.
 -- A successful request audits only identities actually deactivated.
 for demo in select * from public.employees where store_id=sid and seed_key is not null and role<>'owner' order by id loop
  if why is not null or demo.is_active then
   before_json:=private.permission_employee_snapshot(demo); after_json:=before_json;
   outcome:=case when why is null then 'applied' else 'denied' end;
   if why is null then
    update public.employees set is_active=false,permission_revision=permission_revision+1 where store_id=sid and id=demo.id returning * into demo;
    update private.employee_sessions set revoked_at=coalesce(revoked_at,private.write_clock())
     where store_id=sid and employee_id=demo.id and revoked_at is null;
    after_json:=private.permission_employee_snapshot(demo); employee_changed:=true;
   end if;
   insert into public.employee_admin_audit(store_id,actor_type,actor_key,request_id,target_id,kind,outcome,reason,
    before_snapshot,proposed_after,actual_after,actor_effective,catalog_revision,credential_changed,occurred_at,details)
   values(sid,'employee',actor.id::text,p_request_id,demo.id,'clear_demo_data',outcome,why,before_json,
    case when why is null then after_json else null end,after_json,actor_rights,catrev,false,private.write_clock(),
    jsonb_build_object('seedKey',demo.seed_key));
   audit_keys:=audit_keys||jsonb_build_array(jsonb_build_array(sid,'employee',actor.id,p_request_id,demo.id));
  end if;
 end loop;

 if why is null then
  if menu_changed then insert into public.store_change_signals values(sid,'menu',1,p_request_id,null)
   on conflict(store_id,topic) do update set revision=public.store_change_signals.revision+1,event_id=p_request_id,target_id=null; end if;
  if floor_changed then insert into public.store_change_signals values(sid,'floor',1,p_request_id,null)
   on conflict(store_id,topic) do update set revision=public.store_change_signals.revision+1,event_id=p_request_id,target_id=null; end if;
  if employee_changed then insert into public.store_change_signals values(sid,'permission',1,p_request_id,null)
   on conflict(store_id,topic) do update set revision=public.store_change_signals.revision+1,event_id=p_request_id,target_id=null; end if;
  outcome:=case when menu_changed or floor_changed or employee_changed then 'applied' else 'noop' end;
  result:=jsonb_build_object('ok',true,'outcome',outcome,'data',null);
 else result:=private.permission_changes_failure(why);
 end if;
 insert into private.employee_admin_requests(store_id,actor_type,actor_key,request_id,kind,payload_mac,mac_key_version,terminal_outcome,audit_keys)
 values(sid,'employee',actor.id::text,p_request_id,'clear_demo_data',payload_mac,mac_key.key_version,result,audit_keys);
 return result;
exception when sqlstate 'P0401' then return private.permission_failure(sqlerrm);
 when others then return private.permission_changes_failure('PERMISSION_UPDATE_UNAVAILABLE'); end $$;

-- Close every direct write path, including column ACLs, and retire all legacy
-- overloads. Seed/provisioning must use a separately privileged internal path.
do $$ declare t record; a record; f record; begin
 for t in select c.oid,c.relname from pg_class c where c.relnamespace='public'::regnamespace and c.relname=any(array['store_settings','categories','menu_items','option_groups','option_values','menu_item_option_groups','floor_areas','tables','floor_decor_items']) loop
  execute format('revoke insert,update,delete,truncate on public.%I from public,anon,authenticated,service_role',t.relname);
  for a in select attname from pg_attribute where attrelid=t.oid and attnum>0 and not attisdropped loop execute format('revoke insert(%I),update(%I) on public.%I from public,anon,authenticated,service_role',a.attname,a.attname,t.relname); end loop;
 end loop;
 for f in select p.oid::regprocedure signature,n.nspname,p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where
  (n.nspname='private' and (p.proname like 'permission_changes_%' or p.proname in('permission_floor_asset','permission_floor_valid','permission_lock_changes','permission_menu_valid')))
  or (n.nspname='public' and p.proname in('apply_menu_changes','apply_floor_changes','update_store_settings','clear_demo_data','seed_employee')) loop
  execute format('revoke all on function %s from public,anon,authenticated,service_role',f.signature);
  if f.nspname='public' and (f.proname in('apply_menu_changes','apply_floor_changes','update_store_settings')
   or f.signature::text='clear_demo_data(uuid,boolean)') then execute format('grant execute on function %s to anon,authenticated',f.signature); end if;
 end loop;
end $$;
$permission_fragment_23$;
-- 25: supabase/candidate/permission-images.sql
 if clock_timestamp()>=least(started_at+interval '50 seconds','2026-10-22T10:00:00.000Z'::timestamptz) then raise exception 'STAGING_EXECUTION_WINDOW_CLOSED'; end if;
 execute $permission_fragment_24$-- PERM-T09 candidate fragment. Apply after permission-changes.sql.
-- Storage bytes are outside the DB transaction; these registries are the authority for staging/publication.

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('menu-item-image-staging','menu-item-image-staging',false,5242880,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

-- No storage.objects policy is created for the staging bucket. Store JWTs cannot
-- list/read/write/copy/delete it; Edge service credentials operate on exact derived keys.
drop policy if exists permission_image_staging_select on storage.objects;
drop policy if exists permission_image_staging_insert on storage.objects;
drop policy if exists permission_image_staging_update on storage.objects;
drop policy if exists permission_image_staging_delete on storage.objects;
-- Retain legacy public object GET through the public bucket flag, but remove its
-- broad object SELECT/list policy and every store-JWT mutation policy.
drop policy if exists menu_item_images_public_read on storage.objects;
drop policy if exists menu_item_images_store_insert on storage.objects;
drop policy if exists menu_item_images_store_update on storage.objects;
drop policy if exists menu_item_images_store_delete on storage.objects;

create table private.menu_image_uploads(
 upload_handle uuid primary key,
 store_id uuid not null references public.stores(id),
 item_id uuid not null,
 object_key text not null unique,
 mime_type text not null check(mime_type in('image/jpeg','image/png','image/webp')),
 byte_size bigint not null check(byte_size between 1 and 5242880),
 created_by_employee_id uuid not null,
 state text not null check(state in('uploading','ready','published','discarded')),
 created_at timestamptz not null default now(),
 ready_at timestamptz,
 published_at timestamptz,
 discarded_at timestamptz,
 unique(store_id,item_id,upload_handle),
 -- Draft item IDs need not exist until the atomic menu transaction publishes.
 -- The published asset registry below retains the same-store item foreign key.
 foreign key(store_id,created_by_employee_id) references public.employees(store_id,id)
);
create table private.menu_image_assets(
 asset_key uuid primary key,
 store_id uuid not null references public.stores(id),
 item_id uuid not null,
 upload_handle uuid not null unique references private.menu_image_uploads(upload_handle),
 object_key text not null unique,
 mime_type text not null check(mime_type in('image/jpeg','image/png','image/webp')),
 byte_size bigint not null check(byte_size between 1 and 5242880),
 published boolean not null default true,
 published_at timestamptz not null,
 unpublished_at timestamptz,
 foreign key(store_id,item_id) references public.menu_items(store_id,id)
);
revoke all on private.menu_image_uploads,private.menu_image_assets from public,anon,authenticated,service_role;

create function public.permission_menu_image_begin_upload(p_item_id uuid,p_upload_handle uuid,p_mime_type text,p_byte_size bigint) returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog as $$
declare sid uuid:=auth.uid(); actor public.employees; ext text; object_key text;
begin
 if p_item_id is null or p_upload_handle is null or p_mime_type is null or p_mime_type not in('image/jpeg','image/png','image/webp') or p_byte_size is null or p_byte_size<1 or p_byte_size>5242880 then
  return private.permission_changes_failure('INVALID_WRITE_REQUEST');
 end if;
 perform private.permission_current_employee(false);
 perform private.permission_store_mutex(sid);
 actor:=private.permission_changes_checkpoint('menu.manage');
 -- Private staging binds the proposed ID without revealing whether another
 -- store owns it. apply_menu_changes verifies an active same-store row (created
 -- in that transaction if necessary) before finalizing the handle.
 ext:=case p_mime_type when 'image/jpeg' then 'jpg' when 'image/png' then 'png' else 'webp' end;
 object_key:=sid::text||'/menu-items/'||p_item_id::text||'/'||p_upload_handle::text||'.'||ext;
 insert into private.menu_image_uploads(upload_handle,store_id,item_id,object_key,mime_type,byte_size,created_by_employee_id,state)
 values(p_upload_handle,sid,p_item_id,object_key,p_mime_type,p_byte_size,actor.id,'uploading');
 return jsonb_build_object('ok',true,'data',jsonb_build_object('uploadHandle',p_upload_handle,'objectKey',object_key));
exception when unique_violation then return private.permission_changes_failure('INVALID_WRITE_REQUEST');
 when sqlstate 'P0401' then return private.permission_failure(sqlerrm);
end $$;

create function public.permission_menu_image_mark_ready(p_upload_handle uuid) returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog as $$
declare sid uuid:=auth.uid(); actor public.employees; upload private.menu_image_uploads;
begin
 perform private.permission_current_employee(false);
 perform private.permission_store_mutex(sid);
 select * into upload from private.menu_image_uploads where store_id=sid and upload_handle=p_upload_handle for update;
 actor:=private.permission_changes_checkpoint('menu.manage');
 if upload.upload_handle is null then return private.permission_changes_failure('NOT_FOUND'); end if;
 if upload.state<>'uploading' then return private.permission_changes_failure('INVALID_WRITE_REQUEST'); end if;
 update private.menu_image_uploads set state='ready',ready_at=now() where upload_handle=p_upload_handle;
 return jsonb_build_object('ok',true,'data',jsonb_build_object('uploadHandle',p_upload_handle));
exception when sqlstate 'P0401' then return private.permission_failure(sqlerrm);
end $$;

create function public.permission_menu_image_read_staging(p_upload_handle uuid) returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog as $$
declare sid uuid:=auth.uid(); actor public.employees; upload private.menu_image_uploads;
begin
 perform private.permission_current_employee(false);
 perform private.permission_store_mutex(sid);
 select * into upload from private.menu_image_uploads where store_id=sid and upload_handle=p_upload_handle for share;
 actor:=private.permission_changes_checkpoint('menu.manage');
 if upload.upload_handle is null or upload.state not in('ready','published') then return private.permission_changes_failure('NOT_FOUND'); end if;
 return jsonb_build_object('ok',true,'data',jsonb_build_object('objectKey',upload.object_key,'mimeType',upload.mime_type,'byteSize',upload.byte_size));
exception when sqlstate 'P0401' then return private.permission_failure(sqlerrm);
end $$;

create function public.permission_menu_image_discard_upload(p_upload_handle uuid) returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog as $$
declare sid uuid:=auth.uid(); actor public.employees; upload private.menu_image_uploads;
begin
 perform private.permission_current_employee(false);
 perform private.permission_store_mutex(sid);
 select * into upload from private.menu_image_uploads where store_id=sid and upload_handle=p_upload_handle for update;
 actor:=private.permission_changes_checkpoint('menu.manage');
 if upload.upload_handle is null then return private.permission_changes_failure('NOT_FOUND'); end if;
 if upload.state='published' then return private.permission_changes_failure('INVALID_WRITE_REQUEST'); end if;
 update private.menu_image_uploads set state='discarded',discarded_at=now() where upload_handle=p_upload_handle;
 return jsonb_build_object('ok',true,'data',jsonb_build_object('objectKey',upload.object_key));
exception when sqlstate 'P0401' then return private.permission_failure(sqlerrm);
end $$;

-- apply_menu_changes calls this after its business/parent locks and before its
-- final authority checkpoint. Subsequent finalize/unpublish helpers therefore do
-- not wait on mutable image authority state after authorization.
create function private.permission_lock_menu_image_changes(p_store_id uuid,p_image_changes jsonb) returns void
language plpgsql volatile security definer set search_path=pg_catalog as $$
begin
 if p_store_id is distinct from auth.uid() or jsonb_typeof(p_image_changes)<>'array' then
  raise exception 'INVALID_WRITE_REQUEST' using errcode='P0001';
 end if;
 perform 1 from private.menu_image_uploads u join jsonb_array_elements(p_image_changes) x
  on x->>'uploadHandle' is not null and u.upload_handle=(x->>'uploadHandle')::uuid
 where u.store_id=p_store_id order by u.item_id,u.upload_handle for update of u;
 perform 1 from private.menu_image_assets a join jsonb_array_elements(p_image_changes) x
  on a.item_id=(x->>'itemId')::uuid
 where a.store_id=p_store_id and a.published order by a.item_id,a.asset_key for update of a;
end $$;

-- Called only inside apply_menu_changes after its final current-authority checkpoint.
create function private.permission_finalize_menu_image(p_store_id uuid,p_item_id uuid,p_upload_handle uuid) returns text
language plpgsql volatile security definer set search_path=pg_catalog as $$
declare upload private.menu_image_uploads; asset uuid:=p_upload_handle;
begin
 if p_store_id is distinct from auth.uid() then raise exception 'FORBIDDEN' using errcode='P0401'; end if;
 select * into upload from private.menu_image_uploads where store_id=p_store_id and item_id=p_item_id and upload_handle=p_upload_handle for update;
 if upload.upload_handle is null then raise exception 'NOT_FOUND' using errcode='P0404'; end if;
 if upload.state<>'ready' then raise exception 'INVALID_WRITE_REQUEST' using errcode='P0001'; end if;
 update private.menu_image_assets set published=false,unpublished_at=now()
  where store_id=p_store_id and item_id=p_item_id and published;
 insert into private.menu_image_assets(asset_key,store_id,item_id,upload_handle,object_key,mime_type,byte_size,published,published_at)
 values(asset,p_store_id,p_item_id,p_upload_handle,upload.object_key,upload.mime_type,upload.byte_size,true,now());
 update private.menu_image_uploads set state='published',published_at=now() where upload_handle=p_upload_handle;
 return asset::text;
end $$;

create function private.permission_unpublish_menu_image(p_store_id uuid,p_item_id uuid,p_asset_key text) returns void
language plpgsql volatile security definer set search_path=pg_catalog as $$
begin
 if p_store_id is distinct from auth.uid() then raise exception 'FORBIDDEN' using errcode='P0401'; end if;
 update private.menu_image_assets set published=false,unpublished_at=now()
 where store_id=p_store_id and item_id=p_item_id and asset_key::text=p_asset_key and published;
end $$;

-- Every removal path (including clear-demo) withdraws the previous asset in the
-- same DB transaction. Bytes may remain privately stored for later cleanup.
create function private.permission_unpublish_changed_menu_image() returns trigger
language plpgsql volatile security definer set search_path=pg_catalog as $$
begin
 if old.image_asset_key is distinct from new.image_asset_key or new.deleted_at is not null then
  update private.menu_image_assets set published=false,unpublished_at=now()
   where store_id=old.store_id and item_id=old.id and asset_key::text=old.image_asset_key and published;
 end if;
 return new;
end $$;
revoke all on function private.permission_unpublish_changed_menu_image() from public,anon,authenticated,service_role;
create trigger permission_menu_image_withdrawal after update of image_asset_key,deleted_at on public.menu_items
 for each row execute function private.permission_unpublish_changed_menu_image();

-- Public Edge function calls this with service_role. It returns only an exact active binding.
create function public.permission_menu_image_public_lookup(p_asset_key uuid) returns jsonb
language sql stable security definer set search_path=pg_catalog as $$
 select case when a.asset_key is null then null else jsonb_build_object(
  'assetKey',a.asset_key,'objectKey',a.object_key,'mimeType',a.mime_type,'byteSize',a.byte_size)
 end from (select p_asset_key asset_key) requested left join private.menu_image_assets a
 on a.asset_key=requested.asset_key and a.published and exists(
  select 1 from public.menu_items m where m.store_id=a.store_id and m.id=a.item_id
   and m.deleted_at is null and m.image_asset_key=a.asset_key::text)
$$;

do $$ declare f record; begin
 for f in select p.oid::regprocedure signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where (n.nspname='public' and p.proname like 'permission_menu_image_%') or (n.nspname='private' and p.proname in('permission_lock_menu_image_changes','permission_finalize_menu_image','permission_unpublish_menu_image'))
 loop execute format('revoke all on function %s from public,anon,authenticated,service_role',f.signature); end loop;
 grant execute on function public.permission_menu_image_begin_upload(uuid,uuid,text,bigint),public.permission_menu_image_mark_ready(uuid),
  public.permission_menu_image_read_staging(uuid),public.permission_menu_image_discard_upload(uuid) to authenticated;
 grant execute on function public.permission_menu_image_public_lookup(uuid) to service_role;
end $$;
$permission_fragment_24$;
-- 26: supabase/candidate/permission-signals.sql
 if clock_timestamp()>=least(started_at+interval '50 seconds','2026-10-22T10:00:00.000Z'::timestamptz) then raise exception 'STAGING_EXECUTION_WINDOW_CLOSED'; end if;
 execute $permission_fragment_25$-- PERM-T10 candidate fragment. Apply after permission-identity.sql.
-- Signals are lossy invalidation hints; protected data is re-read through current-authority RPCs.

create table public.permission_catalog_signals (
 singleton boolean primary key default true check(singleton),
 revision bigint not null check(revision>=0),
 event_id uuid not null
);

alter table public.store_change_signals replica identity full;
alter table public.permission_catalog_signals replica identity full;
alter table public.permission_catalog_signals enable row level security;

revoke all on public.store_change_signals,public.permission_catalog_signals from public,anon,authenticated,service_role;
grant select on public.store_change_signals,public.permission_catalog_signals to authenticated;

create policy store_change_signals_same_store on public.store_change_signals
 for select to authenticated using(store_id=auth.uid());
create policy permission_catalog_signals_authenticated on public.permission_catalog_signals
 for select to authenticated using(singleton);

create function private.emit_store_change_signal() returns trigger
language plpgsql security definer set search_path=pg_catalog as $$
declare
 row_data jsonb:=case when tg_op='DELETE' then to_jsonb(old) else to_jsonb(new) end;
 sid uuid:=(row_data->>'store_id')::uuid;
 signal_topic text:=tg_argv[0];
begin
 if sid is null or signal_topic not in ('menu','floor','orders','report','settings') then
  raise exception 'INVALID_STORE_SIGNAL' using errcode='23514';
 end if;
 insert into public.store_change_signals(store_id,topic,revision,event_id,target_id)
 values(sid,signal_topic,1,gen_random_uuid(),null)
 on conflict(store_id,topic) do update
 set revision=public.store_change_signals.revision+1,event_id=excluded.event_id,target_id=null;
 return case when tg_op='DELETE' then old else new end;
end $$;

-- Keep the baseline invalidation surface. The join table intentionally has no trigger:
-- join-only modifier changes retain the documented manual refresh/reconnect limitation.
create trigger permission_signal_orders after insert or update or delete on public.orders
 for each row execute function private.emit_store_change_signal('orders');
create trigger permission_signal_payments after insert or update or delete on public.payments
 for each row execute function private.emit_store_change_signal('orders');
create trigger permission_signal_tables after insert or update or delete on public.tables
 for each row execute function private.emit_store_change_signal('orders');
create trigger permission_signal_categories after insert or update or delete on public.categories
 for each row execute function private.emit_store_change_signal('menu');
create trigger permission_signal_menu_items after insert or update or delete on public.menu_items
 for each row execute function private.emit_store_change_signal('menu');
create trigger permission_signal_option_groups after insert or update or delete on public.option_groups
 for each row execute function private.emit_store_change_signal('menu');
create trigger permission_signal_option_values after insert or update or delete on public.option_values
 for each row execute function private.emit_store_change_signal('menu');
create trigger permission_signal_floor_areas after insert or update or delete on public.floor_areas
 for each row execute function private.emit_store_change_signal('floor');
create trigger permission_signal_floor_decor after insert or update or delete on public.floor_decor_items
 for each row execute function private.emit_store_change_signal('floor');
create trigger permission_signal_store_settings after insert or update or delete on public.store_settings
 for each row execute function private.emit_store_change_signal('settings');

create function private.emit_permission_catalog_signal() returns trigger
language plpgsql security definer set search_path=pg_catalog as $$
begin
 if new.revision is distinct from old.revision then
  insert into public.permission_catalog_signals(singleton,revision,event_id)
  values(true,new.revision,gen_random_uuid())
  on conflict(singleton) do update set revision=excluded.revision,event_id=excluded.event_id;
 end if;
 return new;
end $$;
create trigger permission_catalog_signal after update of revision on public.permission_catalog_state
 for each row execute function private.emit_permission_catalog_signal();

-- Remove every raw public-table route, including employee/audit/financial/menu joins,
-- then publish only the two minimal signal relations.
do $$
declare published record;
begin
 if exists(select 1 from pg_publication where pubname='supabase_realtime') then
  for published in
   select schemaname,tablename from pg_publication_tables
   where pubname='supabase_realtime' and schemaname='public'
     and tablename not in ('store_change_signals','permission_catalog_signals')
  loop
   execute format('alter publication supabase_realtime drop table %I.%I',published.schemaname,published.tablename);
  end loop;
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='store_change_signals') then
   alter publication supabase_realtime add table public.store_change_signals;
  end if;
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='permission_catalog_signals') then
   alter publication supabase_realtime add table public.permission_catalog_signals;
  end if;
 end if;
end $$;
$permission_fragment_25$;
-- 27: supabase/candidate/permission-print.sql
 if clock_timestamp()>=least(started_at+interval '50 seconds','2026-10-22T10:00:00.000Z'::timestamptz) then raise exception 'STAGING_EXECUTION_WINDOW_CLOSED'; end if;
 execute $permission_fragment_26$-- PERM-T14 candidate fragment. Apply after permission-financial.sql and permission-read.sql.
-- Grants are private capability evidence outside immutable write payload/result R1.

create table private.initial_receipt_print_grants(
 grant_id uuid primary key,
 store_id uuid not null,
 operation_id uuid not null,
 order_id uuid not null,
 executor_employee_id uuid not null,
 employee_session_hash bytea not null,
 created_at timestamptz not null,
 unique(store_id,operation_id),
 foreign key(store_id,operation_id) references public.write_operations(store_id,operation_id),
 foreign key(store_id,order_id) references public.orders(store_id,id),
 foreign key(store_id,executor_employee_id) references public.employees(store_id,id)
);
revoke all on private.initial_receipt_print_grants from public,anon,authenticated,service_role;

create function private.initial_receipt_print_grant_immutable() returns trigger
language plpgsql security definer set search_path=pg_catalog as $$ begin
 raise exception 'INITIAL_PRINT_GRANT_IMMUTABLE' using errcode='23514';
end $$;
create trigger initial_receipt_print_grant_immutable before update or delete on private.initial_receipt_print_grants
 for each row execute function private.initial_receipt_print_grant_immutable();

-- Financial execute calls this only after its pending operation has transitioned
-- to applied inside the same transaction. It never mutates operation payload/R1.
create function private.permission_create_initial_receipt_print_grant(
 p_grant_id uuid,p_store_id uuid,p_operation_id uuid,p_order_id uuid,p_executor_employee_id uuid,p_created_at timestamptz
) returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog as $$
declare w public.write_operations; current_session private.employee_sessions;
begin
 if p_grant_id is null or p_grant_id='00000000-0000-0000-0000-000000000000'::uuid or p_store_id is distinct from auth.uid() then
  raise exception 'INVALID_WRITE_REQUEST' using errcode='P0001';
 end if;
 select * into w from public.write_operations where store_id=p_store_id and operation_id=p_operation_id;
 select * into current_session from private.employee_sessions where store_id=p_store_id and token_hash=private.employee_token_hash();
 if w.operation_id is null or w.status<>'applied' or w.kind not in('pay_order','pay_order_items')
  or w.executed_by_employee_id is distinct from p_executor_employee_id or current_session.employee_id is distinct from p_executor_employee_id
  or current_session.revoked_at is not null or current_session.expires_at<=p_created_at
  or not exists(select 1 from public.orders where store_id=p_store_id and id=p_order_id and status='paid') then
  raise exception 'INVALID_WRITE_REQUEST' using errcode='P0001';
 end if;
 insert into private.initial_receipt_print_grants(grant_id,store_id,operation_id,order_id,executor_employee_id,employee_session_hash,created_at)
 values(p_grant_id,p_store_id,p_operation_id,p_order_id,p_executor_employee_id,current_session.token_hash,p_created_at);
 return jsonb_build_object('grantId',p_grant_id,'orderId',p_order_id);
end $$;

create function public.authorize_initial_receipt_print(p_grant_id uuid,p_print_request_id uuid) returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog set timezone='UTC' as $$
declare actor public.employees; grant_row private.initial_receipt_print_grants; sid uuid:=auth.uid(); session_hash bytea:=private.employee_token_hash();
begin
 perform private.permission_current_employee(false);
 if p_grant_id is null or p_print_request_id is null or p_grant_id='00000000-0000-0000-0000-000000000000'::uuid or p_print_request_id='00000000-0000-0000-0000-000000000000'::uuid then
  return private.write_failure('INVALID_WRITE_REQUEST');
 end if;
 select * into grant_row from private.initial_receipt_print_grants where store_id=sid and grant_id=p_grant_id;
 if grant_row.grant_id is not null then
  perform 1 from public.orders where store_id=sid and id=grant_row.order_id for share;
  perform 1 from private.initial_receipt_print_grants where store_id=sid and grant_id=p_grant_id for share;
 end if;
 actor:=private.permission_financial_checkpoint();
 if grant_row.grant_id is null or grant_row.executor_employee_id is distinct from actor.id or grant_row.employee_session_hash is distinct from session_hash
  or not private.permission_financial_allowed(actor,'payment.take') then return private.write_failure('FORBIDDEN'); end if;
 if not exists(select 1 from public.write_operations w where w.store_id=sid and w.operation_id=grant_row.operation_id and w.status='applied'
   and w.kind in('pay_order','pay_order_items') and w.executed_by_employee_id=actor.id and w.result is not null)
  or not exists(select 1 from public.orders o join public.payments p on p.store_id=o.store_id and p.order_id=o.id
   where o.store_id=sid and o.id=grant_row.order_id and o.status='paid') then return private.write_failure('RECEIPT_UNAVAILABLE'); end if;
 perform private.permission_current_employee(false);
 return jsonb_build_object('ok',true,'data',jsonb_build_object('authorized',true,'grantId',p_grant_id,'printRequestId',p_print_request_id));
exception when sqlstate 'P0401' then return private.permission_failure(sqlerrm);
end $$;

create function public.prepare_receipt_reprint(p_order_id uuid) returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog set timezone='UTC' as $$
declare actor public.employees; sid uuid:=auth.uid(); result jsonb;
begin
 perform private.permission_current_employee(false);
 if p_order_id is null or p_order_id='00000000-0000-0000-0000-000000000000'::uuid then return private.write_failure('INVALID_WRITE_REQUEST'); end if;
 perform 1 from public.orders where store_id=sid and id=p_order_id for share;
 actor:=private.permission_financial_checkpoint();
 if not private.permission_financial_allowed(actor,'receipt.reprint')
  or not (private.permission_financial_allowed(actor,'payment.take') or private.permission_financial_allowed(actor,'orderHistory.view'))
  then return private.write_failure('FORBIDDEN'); end if;
 select jsonb_build_object('receipt',private.permission_read_receipt(coalesce(p.receipt_snapshot,private.receipt_snapshot(sid,p.id))),
  'legacyMetadata',p.receipt_snapshot is null) into result
 from public.orders o join lateral (select p.* from public.payments p where p.store_id=o.store_id and p.order_id=o.id order by p.paid_at desc,p.id desc limit 1) p on true
 where o.store_id=sid and o.id=p_order_id and o.status='paid';
 perform private.permission_current_employee(false);
 if result is null then return private.write_failure('RECEIPT_UNAVAILABLE'); end if;
 return jsonb_build_object('ok',true,'data',result);
exception when sqlstate 'P0401' then return private.permission_failure(sqlerrm);
end $$;

revoke all on function private.initial_receipt_print_grant_immutable(),private.permission_create_initial_receipt_print_grant(uuid,uuid,uuid,uuid,uuid,timestamptz),
 public.authorize_initial_receipt_print(uuid,uuid),public.prepare_receipt_reprint(uuid) from public,anon,authenticated,service_role;
grant execute on function public.authorize_initial_receipt_print(uuid,uuid),public.prepare_receipt_reprint(uuid) to authenticated;

$permission_fragment_26$;
-- 28: supabase/candidate/permission-seed.sql
 if clock_timestamp()>=least(started_at+interval '50 seconds','2026-10-22T10:00:00.000Z'::timestamptz) then raise exception 'STAGING_EXECUTION_WINDOW_CLOSED'; end if;
 execute $permission_fragment_27$-- Durable initial-demo workflow. Installed after identity, administration and changes.
-- Standalone seed routes are closed; only the workflow runner invokes these helpers.
create function private.permission_seed_uuid(p_store uuid,p_seed_key text) returns uuid
language sql immutable strict set search_path=pg_catalog as $$ select private.permission_stable_uuid(p_store,p_seed_key) $$;

create function private.permission_initial_seed_status_json(p_store uuid) returns jsonb
language sql stable set search_path=pg_catalog as $$
 select jsonb_build_object('workflowId',w.workflow_id,'status',w.status,'workflowRevision',w.workflow_revision,
  'autoEligible',(w.status='pending' and w.auto_claimed_at is null),'runGeneration',w.run_generation,
  'lastErrorCode',w.last_error_code,'stages',coalesce((select jsonb_agg(jsonb_build_object('stage',s.stage,
   'stageId',s.stage_id,'status',s.status,'committedAt',s.committed_at)
   order by case s.stage when 'employee' then 1 when 'menu' then 2 else 3 end)
   from private.initial_seed_stages s where s.workflow_id=w.workflow_id),'[]'::jsonb))
 from private.initial_seed_workflows w where w.store_id=p_store
$$;

create function private.permission_seed_employee_insert(p_store uuid,p_actor public.employees,p_event uuid) returns void
language plpgsql volatile set search_path=pg_catalog as $$
declare tid uuid:=private.permission_seed_uuid(p_store,'demo.employee.demo-emp-cashier'); sk text:='demo.employee.demo-emp-cashier';
 target public.employees; rights text[];
begin
 if exists(select 1 from public.employees where id=tid or (store_id=p_store and seed_key=sk)) then raise exception 'ENTITY_ID_CONFLICT' using errcode='P0001'; end if;
 insert into public.employees(id,store_id,name,role,passcode_hash,is_active,seed_key,permission_revision,permission_overrides,pin_change_required)
 values(tid,p_store,'Thu ngân demo','cashier',extensions.crypt('111111',extensions.gen_salt('bf')),true,sk,0,null,false) returning * into target;
 rights:=private.configured_employee_permissions(p_actor.role,p_actor.permission_overrides);
 insert into public.employee_admin_audit(store_id,actor_type,actor_key,request_id,target_id,kind,outcome,proposed_after,actual_after,
  actor_effective,catalog_revision,credential_changed,occurred_at)
 values(p_store,'employee',p_actor.id::text,p_event,target.id,'initial_seed_employee','applied',private.permission_employee_snapshot(target),
  private.permission_employee_snapshot(target),rights,(select revision from public.permission_catalog_state where singleton),false,private.write_clock());
 insert into public.store_change_signals values(p_store,'permission',1,p_event,target.id)
 on conflict(store_id,topic) do update set revision=public.store_change_signals.revision+1,event_id=p_event,target_id=target.id;
end $$;

create function private.permission_seed_menu_insert(p_store uuid) returns void
language plpgsql volatile set search_path=pg_catalog as $$
declare r record; id_value uuid; seed_value text;
begin
 for r in select * from jsonb_to_recordset('[{"k":"cat-coffee","n":"Cà phê","s":1},{"k":"cat-tea","n":"Trà & trà sữa","s":2}]') as x(k text,n text,s int) loop
  seed_value:='demo.category.'||r.k; id_value:=private.permission_seed_uuid(p_store,seed_value);
  if exists(select 1 from public.categories where id=id_value or (store_id=p_store and seed_key=seed_value)) then raise exception 'ENTITY_ID_CONFLICT' using errcode='P0001'; end if;
  insert into public.categories(id,store_id,name,sort_order,seed_key,deleted_at,deleted_by_employee_id) values(id_value,p_store,r.n,r.s,seed_value,null,null);
 end loop;
 for r in select * from jsonb_to_recordset('[{"k":"mi-ca-phe-sua","c":"cat-coffee","n":"Cà phê sữa","p":29000,"s":1},{"k":"mi-bac-xiu","c":"cat-coffee","n":"Bạc xỉu","p":32000,"s":2},{"k":"mi-latte","c":"cat-coffee","n":"Latte","p":45000,"s":3},{"k":"mi-tra-dao","c":"cat-tea","n":"Trà đào","p":42000,"s":4},{"k":"mi-tra-sua-truyen-thong","c":"cat-tea","n":"Trà sữa truyền thống","p":39000,"s":5},{"k":"mi-tra-chanh","c":"cat-tea","n":"Trà chanh","p":29000,"s":6}]') as x(k text,c text,n text,p int,s int) loop
  seed_value:='demo.menu_item.'||r.k; id_value:=private.permission_seed_uuid(p_store,seed_value);
  if exists(select 1 from public.menu_items where id=id_value or (store_id=p_store and seed_key=seed_value)) then raise exception 'ENTITY_ID_CONFLICT' using errcode='P0001'; end if;
  insert into public.menu_items(id,store_id,category_id,name,price,image_asset_key,sort_order,is_available,seed_key,deleted_at,deleted_by_employee_id)
  values(id_value,p_store,private.permission_seed_uuid(p_store,'demo.category.'||r.c),r.n,r.p,null,r.s,true,seed_value,null,null);
 end loop;
 for r in select * from jsonb_to_recordset('[{"k":"og-coffee-size","n":"Size","t":"single","s":1},{"k":"og-tea-topping","n":"Topping","t":"multi","s":2}]') as x(k text,n text,t text,s int) loop
  seed_value:='demo.option_group.'||r.k; id_value:=private.permission_seed_uuid(p_store,seed_value);
  if exists(select 1 from public.option_groups where id=id_value or (store_id=p_store and seed_key=seed_value)) then raise exception 'ENTITY_ID_CONFLICT' using errcode='P0001'; end if;
  insert into public.option_groups(id,store_id,name,select_type,is_required,sort_order,seed_key,deleted_at,deleted_by_employee_id)
  values(id_value,p_store,r.n,r.t::public.option_select_type,false,r.s,seed_value,null,null);
 end loop;
 for r in select * from jsonb_to_recordset('[{"k":"ov-size-m","g":"og-coffee-size","n":"Size M","p":0,"s":1},{"k":"ov-size-l","g":"og-coffee-size","n":"Size L","p":7000,"s":2},{"k":"ov-tran-chau","g":"og-tea-topping","n":"Trân châu","p":7000,"s":1},{"k":"ov-kem-pho-mai","g":"og-tea-topping","n":"Kem phô mai","p":10000,"s":2}]') as x(k text,g text,n text,p int,s int) loop
  seed_value:='demo.option_value.'||r.k; id_value:=private.permission_seed_uuid(p_store,seed_value);
  if exists(select 1 from public.option_values where id=id_value or (store_id=p_store and seed_key=seed_value)) then raise exception 'ENTITY_ID_CONFLICT' using errcode='P0001'; end if;
  insert into public.option_values(id,store_id,option_group_id,name,price_delta,sort_order,seed_key,deleted_at,deleted_by_employee_id)
  values(id_value,p_store,private.permission_seed_uuid(p_store,'demo.option_group.'||r.g),r.n,r.p,r.s,seed_value,null,null);
 end loop;
 for r in select * from jsonb_to_recordset('[{"k":"miog-size-ca-phe-sua","m":"mi-ca-phe-sua","g":"og-coffee-size","s":1},{"k":"miog-size-bac-xiu","m":"mi-bac-xiu","g":"og-coffee-size","s":1},{"k":"miog-topping-tra-sua","m":"mi-tra-sua-truyen-thong","g":"og-tea-topping","s":1}]') as x(k text,m text,g text,s int) loop
  seed_value:='demo.menu_item_option_group.'||r.k; id_value:=private.permission_seed_uuid(p_store,seed_value);
  if exists(select 1 from public.menu_item_option_groups where id=id_value or (store_id=p_store and seed_key=seed_value)) then raise exception 'ENTITY_ID_CONFLICT' using errcode='P0001'; end if;
  insert into public.menu_item_option_groups(id,store_id,menu_item_id,option_group_id,sort_order,seed_key,deleted_at,deleted_by_employee_id)
  values(id_value,p_store,private.permission_seed_uuid(p_store,'demo.menu_item.'||r.m),private.permission_seed_uuid(p_store,'demo.option_group.'||r.g),r.s,seed_value,null,null);
 end loop;
end $$;

create function private.permission_seed_floor_insert(p_store uuid) returns void
language plpgsql volatile set search_path=pg_catalog as $$
declare r record; aid uuid:=private.permission_seed_uuid(p_store,'demo.area.area-ground'); id_value uuid; seed_value text;
begin
 if exists(select 1 from public.floor_areas where id=aid or (store_id=p_store and seed_key='demo.area.area-ground')) then raise exception 'ENTITY_ID_CONFLICT' using errcode='P0001'; end if;
 insert into public.floor_areas(id,store_id,name,sort_order,seed_key,deleted_at,deleted_by_employee_id) values(aid,p_store,'Tầng trệt',1,'demo.area.area-ground',null,null);
 for r in select * from jsonb_to_recordset('[{"k":"tbl-b01","n":"B01","x":260,"s":1},{"k":"tbl-b02","n":"B02","x":500,"s":2},{"k":"tbl-b03","n":"B03","x":750,"s":3},{"k":"tbl-b04","n":"B04","x":1040,"s":4}]') as x(k text,n text,x int,s int) loop
  seed_value:='demo.table.'||r.k; id_value:=private.permission_seed_uuid(p_store,seed_value);
  if exists(select 1 from public.tables where id=id_value or (store_id=p_store and seed_key=seed_value)) then raise exception 'ENTITY_ID_CONFLICT' using errcode='P0001'; end if;
  insert into public.tables(id,store_id,area_id,name,background_asset_key,pos_x,pos_y,width,height,shape,rotation,seats,sort_order,seed_key,deleted_at,deleted_by_employee_id)
  values(id_value,p_store,aid,r.n,null,r.x,190,case when r.k='tbl-b03' then 126 else 120 end,76,'rectangle',0,4,r.s,seed_value,null,null);
 end loop;
 for r in select * from jsonb_to_recordset('[{"k":"decor-wall-ground","kind":"wall","n":"Tường gạch","a":"/floor-assets/walls/img-color-cell3.webp","x":800,"y":40,"w":1500,"h":36,"z":0,"l":true},{"k":"decor-counter","kind":"image","n":"Quầy pha chế","a":"/floor-assets/decor/deco-fixtures-03.png","x":1370,"y":300,"w":220,"h":160,"z":1,"l":true},{"k":"decor-door","kind":"image","n":"Lối vào","a":"/floor-assets/decor/deco-other-15.png","x":1480,"y":88,"w":110,"h":70,"z":1,"l":true},{"k":"decor-plant","kind":"plant","n":"Cây lá xanh","a":"/floor-assets/decor/deco-tree-05.png","x":220,"y":700,"w":120,"h":120,"z":1,"l":false},{"k":"decor-seat-ground","kind":"image","n":"Ghế thư giãn","a":"/floor-assets/decor/deco-seat-08.png","x":500,"y":620,"w":100,"h":130,"z":1,"l":false},{"k":"decor-reception-ground","kind":"image","n":"Quầy đón khách","a":"/floor-assets/decor/deco-other-10.png","x":800,"y":720,"w":210,"h":70,"z":1,"l":true},{"k":"decor-game-ground","kind":"image","n":"Bàn bi-a","a":"/floor-assets/decor/deco-other-01.png","x":1200,"y":650,"w":210,"h":130,"z":1,"l":false}]') as x(k text,kind text,n text,a text,x int,y int,w int,h int,z int,l boolean) loop
  seed_value:='demo.decor.'||r.k; id_value:=private.permission_seed_uuid(p_store,seed_value);
  if exists(select 1 from public.floor_decor_items where id=id_value or (store_id=p_store and seed_key=seed_value)) then raise exception 'ENTITY_ID_CONFLICT' using errcode='P0001'; end if;
  insert into public.floor_decor_items(id,store_id,area_id,kind,label,asset_key,pos_x,pos_y,width,height,rotation,z_index,is_locked,seed_key,deleted_at,deleted_by_employee_id)
  values(id_value,p_store,aid,r.kind::public.decor_kind,r.n,r.a,r.x,r.y,r.w,r.h,0,r.z,r.l,seed_value,null,null);
 end loop;
end $$;

create function public.permission_get_initial_seed_status() returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog as $$
declare sid uuid:=auth.uid(); actor public.employees; result jsonb;
begin
 actor:=private.permission_current_employee();
 if actor.role<>'owner' then return private.permission_failure('FORBIDDEN'); end if;
 result:=private.permission_initial_seed_status_json(sid);
 if result is null then return private.permission_failure('NOT_FOUND'); end if;
 return jsonb_build_object('ok',true,'data',result);
exception when sqlstate 'P0401' then return private.permission_failure(sqlerrm);
 when others then return private.permission_failure('PERMISSION_UPDATE_UNAVAILABLE'); end $$;

create function public.permission_begin_initial_seed(p_request jsonb) returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog as $$
declare sid uuid:=auth.uid(); actor public.employees; workflow private.initial_seed_workflows; mode text; expected bigint;
begin
 if sid is null then return private.permission_failure('AUTH_REQUIRED'); end if;
 if jsonb_typeof(p_request) is distinct from 'object' or not p_request ?& array['mode','expectedWorkflowRevision']
  or p_request-array['mode','expectedWorkflowRevision']<>'{}' or jsonb_typeof(p_request->'mode') is distinct from 'string'
  or p_request->>'mode' not in ('initial','retry') or jsonb_typeof(p_request->'expectedWorkflowRevision') is distinct from 'number'
  or (p_request->>'expectedWorkflowRevision') !~ '^[0-9]+$' or (p_request->>'expectedWorkflowRevision')::numeric>9007199254740991
 then return private.permission_failure('INVALID_WRITE_REQUEST'); end if;
 mode:=p_request->>'mode'; expected:=(p_request->>'expectedWorkflowRevision')::bigint;
 perform private.permission_store_mutex(sid);
 select * into workflow from private.initial_seed_workflows where store_id=sid for update;
 actor:=private.permission_current_employee();
 if actor.role<>'owner' then return private.permission_failure('FORBIDDEN'); end if;
 if workflow.workflow_id is null then return private.permission_failure('NOT_FOUND'); end if;
 if mode='initial' and not(workflow.status='pending' and workflow.auto_claimed_at is null) then
  return jsonb_build_object('ok',true,'data',jsonb_build_object('acquired',false,'runGeneration',workflow.run_generation,'workflowRevision',workflow.workflow_revision,'status',workflow.status));
 end if;
 if expected<>workflow.workflow_revision then return private.permission_failure('INITIAL_SEED_ATTEMPT_STALE'); end if;
 if mode='retry' and workflow.status not in ('in_progress','needs_retry') then return private.permission_failure('INITIAL_SEED_ATTEMPT_STALE'); end if;
 update private.initial_seed_workflows set status='in_progress',auto_claimed_at=case when mode='initial' then private.write_clock() else auto_claimed_at end,
  run_generation=run_generation+1,workflow_revision=workflow_revision+1,last_error_code=null,updated_at=private.write_clock()
 where workflow_id=workflow.workflow_id returning * into workflow;
 return jsonb_build_object('ok',true,'data',jsonb_build_object('acquired',true,'runGeneration',workflow.run_generation,'workflowRevision',workflow.workflow_revision,'status',workflow.status));
exception when sqlstate 'P0401' then return private.permission_failure(sqlerrm);
 when others then return private.permission_failure('PERMISSION_UPDATE_UNAVAILABLE'); end $$;

create function public.permission_run_initial_seed_stage(p_request jsonb) returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog as $$
declare sid uuid:=auth.uid(); actor public.employees; workflow private.initial_seed_workflows; stage_row private.initial_seed_stages;
 stage_name text; generation bigint; stage_order integer; committed_before integer; happened timestamptz; failure_code text;
 eid uuid; target_id uuid; row_id uuid; session_row record;
begin
 if sid is null then return private.permission_failure('AUTH_REQUIRED'); end if;
 if jsonb_typeof(p_request) is distinct from 'object' or not p_request ?& array['runGeneration','stage']
  or p_request-array['runGeneration','stage']<>'{}' or jsonb_typeof(p_request->'stage') is distinct from 'string'
  or p_request->>'stage' not in ('employee','menu','floor') or jsonb_typeof(p_request->'runGeneration') is distinct from 'number'
  or (p_request->>'runGeneration') !~ '^[0-9]+$' or (p_request->>'runGeneration')::numeric>9007199254740991
 then return private.permission_failure('INVALID_WRITE_REQUEST'); end if;
 stage_name:=p_request->>'stage'; generation:=(p_request->>'runGeneration')::bigint;
 stage_order:=case stage_name when 'employee' then 1 when 'menu' then 2 else 3 end;
 actor:=private.permission_current_employee(false);
 if actor.role<>'owner' then return private.permission_failure('FORBIDDEN'); end if;
 eid:=actor.id;
 target_id:=case when stage_name='employee' then private.permission_seed_uuid(sid,'demo.employee.demo-emp-cashier') end;
 perform private.permission_store_mutex(sid);
 -- Bulk seed shares the same outer order as clear and financial writes. The
 -- menu/business advisory must be held before any employee or session row.
 perform pg_advisory_xact_lock(hashtext(sid::text||':pos-write'));
 perform pg_advisory_xact_lock(hashtext(sid::text||':catalog-write'));
 select * into workflow from private.initial_seed_workflows where store_id=sid for update;
 select * into stage_row from private.initial_seed_stages where workflow_id=workflow.workflow_id and stage=stage_name for update;
 if target_id is not null then
  perform pg_advisory_xact_lock(hashtextextended('employee-create:'||target_id::text,0));
 end if;
 for row_id in select id from public.employees where store_id=sid and id=any(array_remove(array[eid,target_id],null)) order by id loop
  if row_id=target_id then perform 1 from public.employees where store_id=sid and id=row_id for update;
  else perform 1 from public.employees where store_id=sid and id=row_id for share; end if;
 end loop;
 for session_row in select token_hash,employee_id from private.employee_sessions
  where store_id=sid and (token_hash=private.employee_token_hash() or employee_id=target_id) order by token_hash loop
  if session_row.employee_id=target_id then perform 1 from private.employee_sessions where token_hash=session_row.token_hash for update;
  else perform 1 from private.employee_sessions where token_hash=session_row.token_hash for share; end if;
 end loop;
 perform private.permission_catalog_share();
 -- Re-read session, role and clock only after every lock that can wait.
 actor:=private.permission_current_employee(false);
 if actor.id<>eid or actor.role<>'owner' then return private.permission_failure('FORBIDDEN'); end if;
 if workflow.workflow_id is null then return private.permission_failure('NOT_FOUND'); end if;
 if generation<>workflow.run_generation then return private.permission_failure('INITIAL_SEED_ATTEMPT_STALE'); end if;
 if stage_row.stage_id is null then return private.permission_failure('INITIAL_SEED_ATTEMPT_STALE'); end if;
 if stage_row.status='committed' then return jsonb_build_object('ok',true,'data',private.permission_initial_seed_status_json(sid)); end if;
 if workflow.status<>'in_progress' then return private.permission_failure('INITIAL_SEED_ATTEMPT_STALE'); end if;
 select count(*)::integer into committed_before from private.initial_seed_stages where workflow_id=workflow.workflow_id and status='committed'
  and case stage when 'employee' then 1 when 'menu' then 2 else 3 end<stage_order;
 if committed_before<>stage_order-1 or exists(select 1 from private.initial_seed_stages where workflow_id=workflow.workflow_id and status='committed'
  and case stage when 'employee' then 1 when 'menu' then 2 else 3 end>stage_order) then return private.permission_failure('INITIAL_SEED_ATTEMPT_STALE'); end if;
 begin
  if stage_name='employee' then perform private.permission_seed_employee_insert(sid,actor,stage_row.stage_id);
  elsif stage_name='menu' then perform private.permission_seed_menu_insert(sid);
  else perform private.permission_seed_floor_insert(sid); end if;
  happened:=private.write_clock();
  update private.initial_seed_stages set status='committed',committed_at=happened,
   receipt=jsonb_build_object('stage',stage_name,'stageId',stage_row.stage_id,'runGeneration',generation,'committedAt',happened)
   where workflow_id=workflow.workflow_id and stage=stage_name;
  update private.initial_seed_workflows set status=case when stage_name='floor' then 'completed' else 'in_progress' end,
   workflow_revision=workflow_revision+1,last_error_code=null,updated_at=happened where workflow_id=workflow.workflow_id;
  if stage_name='floor' then update public.stores set seed_status='seeded' where id=sid; end if;
 exception when sqlstate 'P0401' then raise;
  when others then
  failure_code:=case when sqlstate='23505' or sqlerrm='ENTITY_ID_CONFLICT' then 'ENTITY_ID_CONFLICT' else 'PERMISSION_UPDATE_UNAVAILABLE' end;
  update private.initial_seed_workflows set status='needs_retry',workflow_revision=workflow_revision+1,last_error_code=failure_code,updated_at=private.write_clock()
   where workflow_id=workflow.workflow_id;
  update public.stores set seed_status='failed' where id=sid;
  return private.permission_failure(failure_code);
 end;
 return jsonb_build_object('ok',true,'data',private.permission_initial_seed_status_json(sid));
exception when sqlstate 'P0401' then return private.permission_failure(sqlerrm);
 when others then return private.permission_failure('PERMISSION_UPDATE_UNAVAILABLE'); end $$;

drop function if exists public.seed_demo_employee(uuid);
drop function if exists public.seed_demo_menu();
drop function if exists public.seed_demo_floor();
do $$ declare f record; begin
 for f in select p.oid::regprocedure signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where (n.nspname='private' and (p.proname like 'permission_seed_%' or p.proname='permission_initial_seed_status_json'))
   or (n.nspname='public' and p.proname in ('permission_get_initial_seed_status','permission_begin_initial_seed','permission_run_initial_seed_stage')) loop
  execute format('revoke all on function %s from public,anon,authenticated,service_role',f.signature);
 end loop;
end $$;
grant execute on function public.permission_get_initial_seed_status(),public.permission_begin_initial_seed(jsonb),public.permission_run_initial_seed_stage(jsonb) to authenticated;
alter function public.permission_get_initial_seed_status() set timezone='UTC';
alter function public.permission_begin_initial_seed(jsonb) set timezone='UTC';
alter function public.permission_run_initial_seed_stage(jsonb) set timezone='UTC';
notify pgrst,'reload schema';
$permission_fragment_27$;
-- 29: supabase/candidate/permission-compatibility-activate.sql
 if clock_timestamp()>=least(started_at+interval '50 seconds','2026-10-22T10:00:00.000Z'::timestamptz) then raise exception 'STAGING_EXECUTION_WINDOW_CLOSED'; end if;
 execute $permission_fragment_28$-- Final PERM-30 cutover. This fragment belongs in the atomic activation bundle.
do $$
declare configured text;
begin
 select split_part(setting,'=',2) into configured
 from pg_db_role_setting s join pg_roles r on r.oid=s.setrole,
 lateral unnest(s.setconfig) setting
 where r.rolname='authenticator' and setting like 'pgrst.db_pre_request=%';
 if configured is distinct from 'public.permission_contract_pre_request' then
  raise exception 'PERMISSION_CONTRACT_HOOK_NOT_PREPARED';
 end if;
 if to_regprocedure('private.assert_permission_contract()') is null or
    to_regprocedure('public.permission_contract_pre_request()') is null then
  raise exception 'PERMISSION_CONTRACT_HOOK_NOT_PREPARED';
 end if;
 if exists(select 1 from private.permission_contract_gate where contract_version<>2) then
  raise exception 'PERMISSION_CONTRACT_VERSION_MISMATCH';
 end if;
 update private.permission_contract_gate set strict=true where singleton and contract_version=2;
 if not found then raise exception 'PERMISSION_CONTRACT_HOOK_NOT_PREPARED'; end if;
end $$;
$permission_fragment_28$;
-- 30: controller:legacy-teardown
 if clock_timestamp()>=least(started_at+interval '50 seconds','2026-10-22T10:00:00.000Z'::timestamptz) then raise exception 'STAGING_EXECUTION_WINDOW_CLOSED'; end if;
 execute $permission_fragment_29$revoke all on function public.create_employee(uuid,text,public.employee_role,text,text),public.seed_employee(uuid,text,public.employee_role,text,text),
      public.verify_employee_pin(uuid,text),public.has_employee_permission(public.employee_role,jsonb,text),
      private.legacy_has_employee_permission(public.employee_role,jsonb,text),private.legacy_permission_snapshot(public.employee_role,jsonb,boolean) from public,anon,authenticated,service_role;
      drop function public.create_employee(uuid,text,public.employee_role,text,text);
      drop function public.seed_employee(uuid,text,public.employee_role,text,text);
      drop function public.verify_employee_pin(uuid,text);
      drop function public.has_employee_permission(public.employee_role,jsonb,text);
      drop function private.legacy_has_employee_permission(public.employee_role,jsonb,text);
      drop function private.legacy_permission_snapshot(public.employee_role,jsonb,boolean);
      drop table private.legacy_permission_defaults;
      drop table private.legacy_permission_roles;
      drop table private.legacy_permission_catalog;
      drop type public.employee_role;$permission_fragment_29$;
 set constraints all immediate;
 tenant_count:=0;
 for relation_row in with recursive tenant_relations(oid) as (
 select c.oid from pg_class c join pg_namespace n on n.oid=c.relnamespace
 where c.relkind in ('r','p') and n.nspname in ('public','private') and
 (n.nspname='public' and c.relname='stores' or exists(select 1 from pg_attribute a
 where a.attrelid=c.oid and a.attname='store_id' and a.attnum>0 and not a.attisdropped))
 union select child.oid from tenant_relations parent
 join pg_constraint fk on fk.confrelid=parent.oid and fk.contype='f'
 join pg_class child on child.oid=fk.conrelid join pg_namespace ns on ns.oid=child.relnamespace
 where child.relkind in ('r','p') and ns.nspname in ('public','private')
) select n.nspname schema_name,c.relname relation_name from tenant_relations t
 join pg_class c on c.oid=t.oid join pg_namespace n on n.oid=c.relnamespace order by 1,2 loop
  tenant_count:=tenant_count+1;
  
  execute format('select exists(select 1 from %I.%I)',relation_row.schema_name,relation_row.relation_name) into has_rows;
  if has_rows then raise exception 'STAGING_TENANT_NOT_EMPTY'; end if;
 end loop;
 
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
 select count(*) into marker_count from private.permission_staging_bootstrap_marker where singleton and binding='{"projectRef":"ineckiashpwloncxnbqx","database":"postgres","nonce":"c439a96e8e0a4088865f74185b9a121d","sourceHead":"b2e3122866f5b6108f026f381f4f12614c98027c","sourceFingerprint":"b966736214d772b33ebcc37bf6d5ad8e8df79c861d09d877dc6db13ffd6758dd","rawSqlBundleSha256":"efbd60e136525932704547f13ecccf4ff72e688402f178050502fb92fde68d34","canonicalSqlBundleSha256":"efbd60e136525932704547f13ecccf4ff72e688402f178050502fb92fde68d34","controllersSha256":"b988353c053b5dc860fd7e2854e70b90b18db3c30a866e7cfbdc56a806768bd9","observationSha256":"3ff90ea220d35841d478f9e407fbd803a133051c74e77b16606874612e44d6a0","allowlistSha256":"7b39addc2ad0924e3be9b38e01149b7b73e72ba8a5d4883ba8ec1afbb250479f","allowlistRawSha256":"d997fe5e4c9522e1a7df4815211c994f3deb8735a0db7c82f04f5a79813d460e","predecessorClaimSha256":"3cd550a64bf676090ea3be7d277287173dbd4063f545a46577a5b3068957f766","predecessorBootstrapManifestSha256":"789ca2430e6c38dc1d31f6ee165022a2f537d8a1550941fffb24d74872373204","phaseId":"permission-staging-setup-20261022-1700","phasePolicyRawSha256":"da8f14f4ebdfe6c55a45be1577dca40b52bc3eb6f8021f556cf79a9f39c577a0","phasePolicyCanonicalSha256":"644bb8dcbab6ba2d0b7f8eedd0dec7e3951a0d3fbd68eabe7a43c7015cd81cb8","successorHelperSha256":"87d0a39b5219ad83581d688b69869bfc1cab80455e13873ac1b2d624d3acb3d4","mutationCutoffUtc":"2026-10-22T09:45:00.000Z","deadlineUtc":"2026-10-22T10:00:00.000Z"}'::jsonb;
 if marker_count<>1 then raise exception 'STAGING_MARKER_MISMATCH'; end if;
 if clock_timestamp()>=least(started_at+interval '50 seconds','2026-10-22T10:00:00.000Z'::timestamptz) then raise exception 'STAGING_EXECUTION_WINDOW_CLOSED'; end if;
end $permission_staging_bootstrap$;
