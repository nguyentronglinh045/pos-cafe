import test from 'node:test';
import assert from 'node:assert/strict';
import { POLICY,RAW_SQL_ORDER,hash,canonicalSqlFiles,providerCatalog,validateObservation,supportedProvider,
  readSource,collectSyntheticActivation,generateBootstrap } from './permission-staging-bootstrap.mjs';
import { stripTopLevelTransactions } from './permission-activation-steps.mjs';

const observation = () => ({
  schemaVersion:'permission-staging-introspection-v1',
  identity:{database:'postgres',databaseOid:'5',currentUser:'postgres',sessionUser:'postgres',serverVersionNum:'170006'},
  prerequisites:{authUsers:'auth.users',storageBuckets:'storage.buckets',storageObjects:'storage.objects',
    authUid:'auth.uid()',storageFoldername:'storage.foldername(text)',existingStores:null,existingTestMarker:null,
    pgcryptoCrypt:'extensions.crypt(text,text)',pgcryptoSalt:'extensions.gen_salt(text)',pgcryptoDigest:'extensions.digest(bytea,text)',
    pgcryptoHmac:'extensions.hmac(bytea,bytea,text)',pgcryptoRandomBytes:'extensions.gen_random_bytes(integer)'},
  executionCapabilities:{role:'postgres',superuser:false,bypass_rls:true,can_alter_roles:true,can_set_pgrst_hook:true,
    can_manage_storage_objects:true,provider_role_usable:false,shared_preload:'',session_preload:'',provider_settings:[]},
  roles:[{rolname:'postgres'}],recoveryMemberships:[],extensions:[],schemas:[],defaultAcls:[],relations:[],functions:[],types:[],policies:[],
  publications:[{pubname:'supabase_realtime',owner:'postgres',puballtables:false}],publicationTables:[],preRequestSettings:[],eventTriggers:[],
  dataCounts:{authUsers:'0',storageBuckets:'0',storageObjects:'0'},
});
const reviewed = (o) => ({schemaVersion:'permission-staging-provider-allowlist-v1',projectRef:POLICY.projectRef,
  observationSha256:hash(JSON.stringify(o)),projectBinding:{projectRef:POLICY.projectRef,
    sqlEditorUrl:'https://supabase.com/dashboard/project/'+POLICY.projectRef+'/sql/new'},
  reviewReferences:['SYNTHETIC_SOURCE_REVIEW','SYNTHETIC_OPERATIONS_REVIEW'],providerCatalog:providerCatalog(o)});
const prepare = async (changes={}) => {
  const o=changes.observation??observation(),source=changes.source??readSource();
  return generateBootstrap({source,observation:o,observationSha256:hash(JSON.stringify(o)),allowlist:changes.allowlist??reviewed(o),
    expectedSourceFingerprint:source.sourceFingerprint,nonce:'1'.repeat(32),now:new Date('2026-10-22T01:00:00Z'),...changes});
};

test('synthetic collector reproduces controller mutation order without a DB',async()=>{
  const source=readSource(),f=await collectSyntheticActivation(source.rawSql);
  assert.equal(f.length,13);assert.equal(f[0].path,RAW_SQL_ORDER[17]);
  assert.equal(f[1].sql,'alter table public.employees alter column role type text using role::text');
  assert.match(f.at(-1).sql,/drop type public\.employee_role;/);
  assert.ok(f.every(x=>!x.sql.startsWith('update public.employees set role=case')));
});
test('raw and normalized SQL remain pinned; generated receipt claims no execution',async()=>{
  const result=await prepare();
  assert.equal(result.manifest.rawFiles.length,28);
  assert.deepEqual(result.manifest.rawFiles.map(f=>f.path),RAW_SQL_ORDER);
  assert.equal(result.manifest.binding.rawSqlBundleSha256,hash(JSON.stringify(result.manifest.rawFiles)));
  assert.equal(result.manifest.binding.canonicalSqlBundleSha256,hash(JSON.stringify(result.manifest.canonicalFiles)));
  assert.equal(result.manifest.binding.canonicalSqlBundleSha256,'efbd60e136525932704547f13ecccf4ff72e688402f178050502fb92fde68d34');
  assert.equal(result.manifest.fragments.length,30);
  assert.equal(result.manifest.execution,'NOT_RUN');assert.equal(result.manifest.ready,false);
  assert.match(result.manifest.browserApply,/^BLOCKED/);assert.equal(result.manifest.businessTestsRun,false);
  assert.equal(result.manifest.sql.sha256,hash(result.sql));assert.ok(result.manifest.sql.bytes<=POLICY.maxSqlBytes);
  assert.equal(result.manifest.sql.newlines,'LF');assert.deepEqual(result.manifest.sql.transforms,['STRIP_OUTER_BEGIN_COMMIT','CRLF_TO_LF']);
  assert.ok(!result.sql.includes('\r'));assert.ok(!result.reconcileSql.includes('\r'));
});
test('guard order locks and rechecks before any owned write; wrapper is atomic',async()=>{
  const {sql}=await prepare();
  assert.ok(sql.indexOf('lock table auth.users')<sql.indexOf('create table private.permission_staging_bootstrap_marker'));
  assert.equal((sql.match(/STAGING_FRESH_OBSERVATION_DRIFT/g)??[]).length,2);
  assert.doesNotMatch(sql,/set local statement_timeout=/);assert.match(sql,/server_timeout_ms>120000/);
  assert.match(sql,/set_config\('lock_timeout','5s',true\)/);
  assert.match(sql,/STAGING_MUTATION_ADMISSION_CLOSED/);assert.match(sql,/STAGING_EXECUTION_WINDOW_CLOSED/);
  assert.match(sql,/STAGING_TENANT_NOT_EMPTY/);assert.match(sql,/STAGING_RAW_SELECT_EXPOSED/);
  assert.match(sql,/STAGING_RAW_WRITE_OR_MAINTENANCE_EXPOSED/);
  assert.match(sql,/STAGING_RAW_COLUMN_PRIVILEGE_EXPOSED/);
  assert.match(sql,/has_any_column_privilege\(api.role_name,c.oid,'SELECT'\)/);
  assert.match(sql,/has_any_column_privilege\(api.role_name,c.oid,'INSERT,UPDATE,REFERENCES'\)/);
  assert.ok(sql.indexOf('007_wipe_all_data.sql')>sql.indexOf('STAGING_FRESH_OBSERVATION_DRIFT'));
  assert.equal((sql.match(/\$permission_staging_bootstrap\$/g)??[]).length,2);
  assert.ok(sql.trim().endsWith('end $permission_staging_bootstrap$;'));
});
test('shared transaction stripper preserves PLpgSQL BEGIN and strips outer boundaries',()=>{
  const sample="begin; do $$ begin perform 1; end $$; commit;";
  assert.equal(stripTopLevelTransactions(sample),' do $$ begin perform 1; end $$; ');
  assert.throws(()=>stripTopLevelTransactions('savepoint candidate;'),/NESTED_TRANSACTION_COMMAND_REFUSED/);
});
test('canonical SQL identities are identical for LF and CRLF checkouts',()=>{
  const source=readSource(),lf=source.rawSql.map(f=>({...f,sql:f.sql.replaceAll('\r\n','\n')}));
  const crlf=lf.map(f=>({...f,sql:f.sql.replaceAll('\n','\r\n')}));
  assert.deepEqual(canonicalSqlFiles(lf),canonicalSqlFiles(crlf));
  assert.deepEqual(canonicalSqlFiles(lf).map(f=>f.path),RAW_SQL_ORDER);
  assert.throws(()=>canonicalSqlFiles([{path:'test.sql',sql:'select 1;\r'}]),/STAGING_LONE_CR_REFUSED/);
});
test('nonzero counts are rejected even if copied into an apparent reviewed allowlist',async()=>{
  for(const key of ['authUsers','storageBuckets','storageObjects']){
    const o=observation();o.dataCounts[key]='1';await assert.rejects(prepare({observation:o}),/STAGING_NONEMPTY_PROVIDER_DATA/);
  }
});
test('unknown baseline and existing application objects cannot be accepted silently',async()=>{
  const o=observation(),a=reviewed(o);o.defaultAcls.push({owner:'unexpected'});
  assert.throws(()=>validateObservation(o,a,a.observationSha256),/STAGING_UNKNOWN_PROVIDER_CATALOG/);
  const occupied=observation();occupied.relations.push({schema_name:'public',relname:'foreign_table',extension_name:null});
  await assert.rejects(prepare({observation:occupied}),/STAGING_EXISTING_APPLICATION_CATALOG/);
});
test('existing hook/recovery state is rejected before preparation',async()=>{
  for(const key of ['preRequestSettings','recoveryMemberships']){
    const o=observation();o[key].push({unexpected:true});await assert.rejects(prepare({observation:o}),/STAGING_EXISTING_SECURITY_STATE/);
  }
});
test('wrong project, unreviewed observation and insufficient capability are refused',async()=>{
  const o=observation(),a=reviewed(o);a.projectRef=POLICY.forbiddenProjectRef;
  await assert.rejects(prepare({allowlist:a}),/STAGING_REVIEWED_ALLOWLIST_REQUIRED/);
  const u=observation(),ua=reviewed(u);ua.reviewReferences=[];
  await assert.rejects(prepare({observation:u,allowlist:ua}),/STAGING_TWO_REVIEW_REFERENCES_REQUIRED/);
  const c=observation();c.executionCapabilities.superuser=true;
  await assert.rejects(prepare({observation:c}),/STAGING_PROVIDER_CAPABILITIES_REQUIRED/);
});
test('provider capability fallback is supported only by the exact supautils contract',()=>{
  const row={role:'postgres',provider_role_usable:true,shared_preload:'supautils',session_preload:'',provider_settings:[
    ['supautils.privileged_role','supabase_privileged_role'],['supautils.privileged_role_allowed_configs','pgrst.db_pre_request'],
    ['supautils.reserved_roles','authenticator*'],['supautils.policy_grants','{"postgres":["storage.objects"]}']
  ].map(([name,setting])=>({name,setting,context:'sighup',source:'configuration file',pending_restart:false}))};
  assert.equal(supportedProvider(row),true);
  row.provider_settings[3].setting='{"postgres":["storage.buckets"]}';assert.equal(supportedProvider(row),false);
});
test('cutoff, source bytes and fingerprint drift fail closed',async()=>{
  await assert.rejects(prepare({now:new Date(POLICY.mutationCutoffUtc)}),/STAGING_MUTATION_ADMISSION_CLOSED/);
  await assert.rejects(prepare({expectedSourceFingerprint:'0'.repeat(64)}),/STAGING_SOURCE_FINGERPRINT_MISMATCH/);
  const source=readSource();source.rawSql[0].sql+='\n-- unpinned';
  await assert.rejects(prepare({source}),/STAGING_RAW_SQL_DRIFT/);
});
test('reconciliation is a single read-only catalog/count SELECT and makes no readiness claim',async()=>{
  const {reconcileSql}=await prepare();
  assert.match(reconcileSql,/^--[^\n]*\nselect /);assert.doesNotMatch(reconcileSql,/\b(?:insert|update|delete|truncate|create|drop|alter|begin|commit)\s/i);
  assert.match(reconcileSql,/'ready',false/);assert.match(reconcileSql,/'matchingMarkerObserved'/);
  assert.doesNotMatch(reconcileSql,/select \*|email|passcode|token_hash/);
});
