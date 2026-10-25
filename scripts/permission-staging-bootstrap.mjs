// Offline preparation only: no database client, browser, network or apply command.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, lstatSync, realpathSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, join, dirname, isAbsolute } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { ACTIVATION_SQL_ORDER } from './permission-activation-bundle.mjs';
import { applyActivationSteps, stripTopLevelTransactions } from './permission-activation-steps.mjs';
import { renderBootstrapSql, renderReconcileSql,canonicalLf } from './permission-staging-bootstrap-sql.mjs';

export const POLICY = Object.freeze({
  projectRef: 'ineckiashpwloncxnbqx', forbiddenProjectRef: 'kfqjdfwxhkdwihjobpny',
  mutationCutoffUtc: '2026-10-22T03:15:00.000Z', deadlineUtc: '2026-10-22T04:00:00.000Z',
  predecessorClaimSha256: '3cd550a64bf676090ea3be7d277287173dbd4063f545a46577a5b3068957f766',
  maxSqlBytes: 1_000_000,
});
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const HEX = /^[a-f0-9]{64}$/;
const ownFiles = ['scripts/permission-staging-bootstrap.mjs','scripts/permission-staging-bootstrap-sql.mjs',
  'scripts/permission-staging-bootstrap.test.mjs','scripts/permission-staging-bootstrap.README.md',
  'scripts/permission-staging-introspection.sql','scripts/permission-staging-introspection.manifest.json'];
const controllers = ['scripts/permission-activation-bundle.mjs','scripts/permission-activation-steps.mjs',
  'scripts/permission-operator-error.mjs','scripts/permission-release-cutover.mjs'];
const baselineNames = ['001_schema_enums.sql','002_indexes_rls_triggers.sql','003_rpc_functions.sql',
  '004_realtime_publication.sql','005_menu_item_images_storage.sql','006_menu_item_image_asset_key.sql',
  '007_wipe_all_data.sql','008_modifier_rework.sql','009_partial_payment.sql','010_split_payment.sql',
  '011_void_paid_order.sql','012_action_permission_guardrails.sql','013_table_background_asset_key.sql',
  '014_write_identity_and_ledger.sql','015_write_business_helpers.sql','016_activate_write_protocol.sql'];
export const RAW_SQL_ORDER = Object.freeze([...baselineNames.map(name=>'supabase/migrations/'+name),
  'supabase/candidate/permission-compatibility-prepare.sql',...ACTIVATION_SQL_ORDER]);
export const hash = value => createHash('sha256').update(value).digest('hex');
export const canonicalSqlFiles = rawSql => rawSql.map(({path,sql})=>({path,sha256:hash(canonicalLf(sql)),bytes:Buffer.byteLength(canonicalLf(sql))}));
const stable = value => JSON.stringify(value, (_key,item) => item && typeof item==='object' && !Array.isArray(item)
  ? Object.fromEntries(Object.entries(item).sort(([a],[b])=>a.localeCompare(b))) : item);
const check = (value,code) => { if (!value) throw new Error(code); };
const keys = (value,expected) => value && typeof value==='object' && !Array.isArray(value)
  && Object.keys(value).sort().join(',')===expected.slice().sort().join(',');

// Pure capability predicate matches hasSupportedSupabaseProviderCapabilities.
// It does not grant anything and does not assume a hosted superuser.
export function supportedProvider(row) {
  const tokens = value => {
    if(typeof value!=='string')return [];
    const values=value.split(',').map(token=>token.trim());
    return values.every(token=>/^[a-z_][a-z0-9_]*(?:\.[a-z_][a-z0-9_]*|\.\*|\*)?$/.test(token))?values:[];
  };
  if(!row||row.provider_role_usable!==true||![...tokens(row.shared_preload),...tokens(row.session_preload)].includes('supautils')
    ||!Array.isArray(row.provider_settings))return false;
  const names=['supautils.privileged_role','supautils.privileged_role_allowed_configs','supautils.reserved_roles','supautils.policy_grants'];
  if(row.provider_settings.length!==names.length||row.provider_settings.some(s=>!s||typeof s!=='object'||!names.includes(s.name)
    ||typeof s.setting!=='string'||s.context!=='sighup'||!['configuration file','command line'].includes(s.source)||s.pending_restart!==false)
    ||new Set(row.provider_settings.map(s=>s.name)).size!==names.length)return false;
  const s=Object.fromEntries(row.provider_settings.map(s=>[s.name,s.setting]));
  if(s['supautils.privileged_role']!=='supabase_privileged_role'
    ||!tokens(s['supautils.privileged_role_allowed_configs']).some(t=>['pgrst.db_pre_request','pgrst.*'].includes(t))
    ||!tokens(s['supautils.reserved_roles']).includes('authenticator*'))return false;
  let grants;try{grants=JSON.parse(s['supautils.policy_grants']);}catch{return false;}
  return grants!==null&&typeof grants==='object'&&!Array.isArray(grants)&&Object.hasOwn(grants,row.role)
    &&Array.isArray(grants[row.role])&&grants[row.role].every(t=>typeof t==='string')&&grants[row.role].includes('storage.objects');
}

export function providerCatalog(observation) {
  const {identity,...catalog}=observation;
  return structuredClone(catalog);
}
export function validateObservation(observation,allowlist,observationSha256) {
  const sections=['schemaVersion','identity','prerequisites','executionCapabilities','roles','recoveryMemberships','extensions',
    'schemas','defaultAcls','relations','functions','types','policies','publications','publicationTables','preRequestSettings','eventTriggers','dataCounts'];
  check(keys(observation,sections)&&observation.schemaVersion==='permission-staging-introspection-v1','STAGING_OBSERVATION_INVALID');
  check(keys(allowlist,['schemaVersion','projectRef','observationSha256','projectBinding','reviewReferences','providerCatalog'])
    &&allowlist.schemaVersion==='permission-staging-provider-allowlist-v1'&&allowlist.projectRef===POLICY.projectRef
    &&HEX.test(observationSha256)&&allowlist.observationSha256===observationSha256,'STAGING_REVIEWED_ALLOWLIST_REQUIRED');
  check(Array.isArray(allowlist.reviewReferences)&&allowlist.reviewReferences.length===2
    &&new Set(allowlist.reviewReferences).size===2&&allowlist.reviewReferences.every(x=>typeof x==='string'&&x.length>0&&x.length<=200),
    'STAGING_TWO_REVIEW_REFERENCES_REQUIRED');
  let bindingUrl;try{bindingUrl=new URL(allowlist.projectBinding?.sqlEditorUrl);}catch{throw new Error('STAGING_PROJECT_BINDING_REQUIRED');}
  check(keys(allowlist.projectBinding,['projectRef','sqlEditorUrl'])&&allowlist.projectBinding.projectRef===POLICY.projectRef
    &&bindingUrl.protocol==='https:'&&bindingUrl.hostname==='supabase.com'&&!bindingUrl.username&&!bindingUrl.password
    &&bindingUrl.pathname.startsWith('/dashboard/project/'+POLICY.projectRef+'/sql')&&!bindingUrl.search&&!bindingUrl.hash,
    'STAGING_PROJECT_BINDING_REQUIRED');
  check(stable(providerCatalog(observation))===stable(allowlist.providerCatalog),'STAGING_UNKNOWN_PROVIDER_CATALOG');
  const identity=observation.identity,p=observation.prerequisites,c=observation.executionCapabilities;
  check(identity?.database==='postgres'&&identity.currentUser==='postgres'&&identity.sessionUser==='postgres'
    &&Number(identity.serverVersionNum)>=150000&&/^[1-9][0-9]*$/.test(String(identity.databaseOid))
    &&Number(identity.databaseOid)<=4294967295,'STAGING_DATABASE_IDENTITY_REQUIRED');
  check(c?.role==='postgres'&&c.superuser===false&&c.bypass_rls===true&&c.can_alter_roles===true
    &&((c.can_set_pgrst_hook===true&&c.can_manage_storage_objects===true)||supportedProvider(c)), 'STAGING_PROVIDER_CAPABILITIES_REQUIRED');
  check(p?.authUsers==='auth.users'&&p.storageBuckets==='storage.buckets'&&p.storageObjects==='storage.objects'
    &&p.authUid&&p.storageFoldername&&p.existingStores===null&&p.existingTestMarker===null
    &&['pgcryptoCrypt','pgcryptoSalt','pgcryptoDigest','pgcryptoHmac','pgcryptoRandomBytes'].every(key=>typeof p[key]==='string'),
    'STAGING_FRESH_PREREQUISITES_REQUIRED');
  check(keys(observation.dataCounts,['authUsers','storageBuckets','storageObjects'])
    &&Object.values(observation.dataCounts).every(count=>count==='0'),'STAGING_NONEMPTY_PROVIDER_DATA');
  for(const key of sections.filter(k=>!['schemaVersion','identity','prerequisites','executionCapabilities','dataCounts'].includes(k)))
    check(Array.isArray(observation[key]),'STAGING_OBSERVATION_INVALID');
  check(observation.recoveryMemberships.length===0&&observation.preRequestSettings.length===0
    &&!observation.roles.some(r=>r.rolname==='pos_owner_recovery'),'STAGING_EXISTING_SECURITY_STATE');
  for(const name of ['relations','functions','types'])check(observation[name].every(x=>typeof x.extension_name==='string'&&x.extension_name.length>0),
    'STAGING_EXISTING_APPLICATION_CATALOG');
  check(observation.publications.some(p=>p.pubname==='supabase_realtime'&&p.puballtables===false), 'STAGING_REALTIME_PUBLICATION_REQUIRED');
  check(!observation.publicationTables.some(p=>p.schemaname==='public'),'STAGING_EXISTING_PUBLIC_PUBLICATION');
  return {catalog:providerCatalog(observation),projectBinding:allowlist.projectBinding,reviewReferences:allowlist.reviewReferences};
}

export function readSource(root=ROOT) {
  const head=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
  const tracked=execFileSync('git',['ls-files','-z'],{cwd:root,encoding:'utf8',maxBuffer:4*1024*1024}).split('\0').filter(Boolean);
  const paths=[...new Set([...tracked,...ownFiles])].sort();
  const files=paths.map(path=>{const absolute=resolve(root,path);check(absolute.startsWith(resolve(root)+ (process.platform==='win32'?'\\':'/'))
    &&lstatSync(absolute).isFile()&&!lstatSync(absolute).isSymbolicLink(),'STAGING_SOURCE_PATH_REFUSED');
    const bytes=readFileSync(absolute);return {path,sha256:hash(bytes),bytes:bytes.length};});
  const rawSql=RAW_SQL_ORDER.map(path=>{const bytes=readFileSync(join(root,path));return {path,sha256:hash(bytes),bytes:bytes.length,sql:bytes.toString('utf8')};});
  const controllerFiles=controllers.map(path=>{const bytes=readFileSync(join(root,path));return {path,sha256:hash(bytes),bytes:bytes.length};});
  return {head,files,sourceFingerprint:hash(stable({head,files})),rawSql,controllerFiles,
    introspectionSql:readFileSync(join(root,'scripts/permission-staging-introspection.sql'),'utf8')};
}

export async function collectSyntheticActivation(rawSql) {
  const map=new Map(rawSql.map(f=>[f.path,f.sql]));
  const mutationStatements=[];let reads=0;
  const collector={async query(sql,parameters){
    if(sql.startsWith('select split_part(setting,')&&sql.includes("r.rolname='authenticator'")){reads++;return{rows:[{value:'public.permission_contract_pre_request'}]};}
    if(sql.startsWith('select s.id,count(*) filter')){check(Array.isArray(parameters)&&parameters.length===1&&parameters[0].length===0,'STAGING_SYNTHETIC_NONEMPTY_MAPPING');reads++;return{rows:[]};}
    if(sql==="select pg_get_functiondef('public.get_write_capabilities()'::regprocedure) definition"){
      reads++;return{rows:[{definition:"'writeProtocolVersion',1 'permissionContractVersion',2"}]};}
    if(sql.startsWith('select count(*)::int count from pg_type')){reads++;return{rows:[{count:0}]};}
    check(parameters===undefined,'STAGING_SYNTHETIC_PARAMETERS_REFUSED');
    mutationStatements.push(sql);return{rows:[]};
  }};
  // This is a planner collector, never a database or evidence adapter. SQL-level
  // live empty/schema/owner guards are rendered separately; collector rows are inert.
  await applyActivationSteps(collector,{plan:{status:'READY',stores:[]},storeIds:[],expectedEmptyStoreSet:false,sqlFiles:map});
  check(reads===4&&mutationStatements.length===ACTIVATION_SQL_ORDER.length+2,'STAGING_CONTROLLER_SHAPE_CHANGED');
  check(mutationStatements[0]===stripTopLevelTransactions(map.get(ACTIVATION_SQL_ORDER[0]))
    &&mutationStatements[1]==='alter table public.employees alter column role type text using role::text','STAGING_CONTROLLER_ORDER_CHANGED');
  for(let i=1;i<ACTIVATION_SQL_ORDER.length;i++)check(mutationStatements[i+1]===stripTopLevelTransactions(map.get(ACTIVATION_SQL_ORDER[i])),'STAGING_CONTROLLER_ORDER_CHANGED');
  check(mutationStatements.at(-1).startsWith('revoke all on function public.create_employee(')
    &&mutationStatements.at(-1).trim().endsWith('drop type public.employee_role;'),'STAGING_LEGACY_TEARDOWN_CHANGED');
  return mutationStatements.map((sql,index)=>({phase:'activation',
    path:index===1?'controller:employees.role-to-text':index===mutationStatements.length-1?'controller:legacy-teardown':ACTIVATION_SQL_ORDER[index===0?0:index-1],sql}));
}

export async function generateBootstrap({source,observation,observationSha256,allowlist,expectedSourceFingerprint,nonce,now=new Date()}) {
  check(now instanceof Date&&Number.isFinite(now.valueOf())&&now.valueOf()<Date.parse(POLICY.mutationCutoffUtc),'STAGING_MUTATION_ADMISSION_CLOSED');
  check(source&&source.sourceFingerprint===expectedSourceFingerprint&&HEX.test(expectedSourceFingerprint),'STAGING_SOURCE_FINGERPRINT_MISMATCH');
  check(/^[a-f0-9]{32}$/.test(nonce),'STAGING_NONCE_REQUIRED');
  const reviewed=validateObservation(observation,allowlist,observationSha256);
  check(source.rawSql.length===28&&source.rawSql.every((f,i)=>f.path===RAW_SQL_ORDER[i]&&hash(f.sql)===f.sha256
    &&Buffer.byteLength(f.sql)===f.bytes),'STAGING_RAW_SQL_DRIFT');
  check(source.rawSql.every(f=>source.files.some(s=>s.path===f.path&&s.sha256===f.sha256&&s.bytes===f.bytes))
    &&source.controllerFiles.every(f=>source.files.some(s=>s.path===f.path&&s.sha256===f.sha256&&s.bytes===f.bytes)),
    'STAGING_SOURCE_SNAPSHOT_DRIFT');
  const rawFiles=source.rawSql.map(({path,sha256,bytes})=>({path,sha256,bytes}));
  const rawSqlMap=new Map(source.rawSql.map(f=>[f.path,f.sql]));
  const fragments=baselineNames.map(name=>({phase:'baseline',path:'supabase/migrations/'+name,
    sql:stripTopLevelTransactions(rawSqlMap.get('supabase/migrations/'+name))}));
  fragments.push({phase:'prepare',path:'supabase/candidate/permission-compatibility-prepare.sql',
    sql:stripTopLevelTransactions(rawSqlMap.get('supabase/candidate/permission-compatibility-prepare.sql'))});
  fragments.push(...await collectSyntheticActivation(source.rawSql));
  for(const fragment of fragments) fragment.sql=canonicalLf(fragment.sql);
  const canonicalFiles=canonicalSqlFiles(source.rawSql);
  const binding={projectRef:POLICY.projectRef,database:'postgres',nonce,sourceHead:source.head,
    sourceFingerprint:source.sourceFingerprint,rawSqlBundleSha256:hash(JSON.stringify(rawFiles)),
    canonicalSqlBundleSha256:hash(JSON.stringify(canonicalFiles)),
    controllersSha256:hash(JSON.stringify(source.controllerFiles)),observationSha256,
    allowlistSha256:hash(stable(allowlist)),predecessorClaimSha256:POLICY.predecessorClaimSha256,
    mutationCutoffUtc:POLICY.mutationCutoffUtc,deadlineUtc:POLICY.deadlineUtc};
  const sql=renderBootstrapSql({observation,catalog:reviewed.catalog,fragments,binding,introspectionSql:source.introspectionSql});
  check(Buffer.byteLength(sql)<=POLICY.maxSqlBytes,'STAGING_SQL_EDITOR_SIZE_EXCEEDED');
  const reconcileSql=renderReconcileSql(binding);
  return {sql,reconcileSql,manifest:{schemaVersion:'permission-staging-bootstrap-manifest-v1',
    preparation:'OFFLINE_ONLY',execution:'NOT_RUN',browserApply:'BLOCKED_PENDING_EXACT_EDITOR_BYTES_AND_TWO_SCOPE_REVIEW',
    syntheticCollector:'PLANNING_ONLY_NOT_DATABASE_EVIDENCE',binding,projectBinding:reviewed.projectBinding,
    reviewReferences:reviewed.reviewReferences,rawFiles,canonicalFiles,controllers:source.controllerFiles,
    sourceSnapshot:{head:source.head,files:source.files,scope:'ALL_TRACKED_PLUS_SIX_BOOTSTRAP_AND_INTROSPECTION_FILES'},
    fragments:fragments.map(({phase,path,sql})=>({phase,path,sha256:hash(sql),bytes:Buffer.byteLength(sql)})),
    sql:{sha256:hash(sql),bytes:Buffer.byteLength(sql),newlines:'LF',transforms:['STRIP_OUTER_BEGIN_COMMIT','CRLF_TO_LF']},
    reconcile:{sha256:hash(reconcileSql),bytes:Buffer.byteLength(reconcileSql),newlines:'LF',transforms:['CRLF_TO_LF']},
    businessTestsRun:false,ready:false}};
}

export async function main(inputPath,outputDirectory) {
  check(isAbsolute(inputPath??'')&&isAbsolute(outputDirectory??''),'STAGING_ABSOLUTE_PATHS_REQUIRED');
  const input=JSON.parse(readFileSync(inputPath,'utf8'));
  check(keys(input,['schemaVersion','projectRef','sourceFingerprint','observation','allowlist','nonce'])
    &&input.schemaVersion==='permission-staging-bootstrap-input-v1'&&input.projectRef===POLICY.projectRef,'STAGING_INPUT_REFUSED');
  const pinned=(ref)=>{check(keys(ref,['path','sha256'])&&isAbsolute(ref.path)&&HEX.test(ref.sha256),'STAGING_PINNED_INPUT_REQUIRED');
    const bytes=readFileSync(ref.path);check(hash(bytes)===ref.sha256,'STAGING_INPUT_HASH_MISMATCH');return JSON.parse(bytes);};
  const observation=pinned(input.observation),allowlist=pinned(input.allowlist);
  const output=realpathSync(outputDirectory);check(lstatSync(output).isDirectory(),'STAGING_OUTPUT_DIRECTORY_REQUIRED');
  const result=await generateBootstrap({source:readSource(),observation,allowlist,observationSha256:input.observation.sha256,
    expectedSourceFingerprint:input.sourceFingerprint,nonce:input.nonce});
  check(readSource().sourceFingerprint===input.sourceFingerprint,'STAGING_SOURCE_CHANGED_DURING_PREPARATION');
  for(const [name,value] of [['bootstrap.sql',result.sql],['reconcile.sql',result.reconcileSql],['bootstrap.manifest.json',JSON.stringify(result.manifest,null,2)+'\n']])
    writeFileSync(join(output,name),value,{flag:'wx',mode:0o600});
  return {status:'PREPARED_NOT_EXECUTED',sqlSha256:result.manifest.sql.sha256,sqlBytes:result.manifest.sql.bytes};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  try{process.stdout.write(JSON.stringify(await main(process.argv[2],process.argv[3]))+'\n');}
  catch(error){process.stderr.write(JSON.stringify({status:'BLOCKED',code:/^STAGING_[A-Z_]+$/.test(error.message)?error.message:'STAGING_PREPARATION_FAILED'})+'\n');process.exitCode=1;}
}
