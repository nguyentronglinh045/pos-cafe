-- permission-staging-introspection-v1: one SELECT, no setup or mutation.
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
) as permission_staging_introspection;
