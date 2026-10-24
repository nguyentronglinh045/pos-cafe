import {CI1_LIMITS, ci1Identity} from './permission-ci1-policy.mjs';

// Pure planning predicates only. No filesystem, process, DB or service adapter is
// implemented here; matching supplied facts does not authorize a runtime run.
const refuse = () => { throw new Error('FULL_RUNTIME_POLICY_REFUSED'); };
function freeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}
const identityConfig = {path:'tests/permissions/runtime/identity.toml', bytes:15675,
  sha256:'41908625aed32f7ccb0071e5128e6b76c3642ff1acb14df96fb78978c834ed13'};
const t04Root = '/var/tmp/pos-cafe-perm-s31-t04-20261013';
const manual = {strategy:'MANUAL_001_016', migrationCount:16, initialDatabase:'NO_PUBLIC_STORES'};
function supabase(project, ports, config, bootstrap) {
  return {kind:'SUPABASE', project, aliasRoot:`/var/tmp/${project}`,
    stackAlias:`/var/tmp/${project}/stack`, cliAlias:`/var/tmp/${project}/bin/supabase`,
    cliVersion:'2.117.0', postgresMajor:17, ports, config,
    configMigrationsEnabled:true, configSeedEnabled:true, bootstrap,
    topology:{containerKinds:['db','auth','rest','kong','storage','realtime','edge_runtime','studio','pg_meta','inbucket','vector','analytics'],
      projectLabel:'com.supabase.cli.project', loopbackOnly:true,
      dbVolume:`supabase_db_${project}`, network:`supabase_network_${project}`},
    provisioning:'NEEDS_PORT', execution:'NOT_RUN'};
}
const profiles = freeze({
  PIN_ONBOARD:{...supabase('pos-cafe-perm-s31-onboard-20261013',
    {api:62921, db:62922, shadow:62920, pooler:62929, studio:62923, smtp:62924, analytics:62927, inspector:8084},
    {path:'tests/permissions/runtime/onboarding.toml', bytes:15629,
      sha256:'75413257628c2b2ec564faa272afeddcc70595254d0cda2ff34476f23bcd8852'},
    {...manual, source:'scripts/permission-pin-onboard-prepare.mjs',
      fixture:'EMPTY_ACTIVATION', emptyBeforeActivation:true, existingEnvRefused:true}),
    cliAlias:`${t04Root}/bin/supabase`},
  PIN_IDENTITY:{...supabase('pos-cafe-perm-s31-identity-20261013',
    {api:63021, db:63022, shadow:63020, pooler:63029, studio:63023, smtp:63024, analytics:63027, inspector:8090},
    {path:'tests/permissions/runtime/identity-close1.toml', bytes:15630,
      sha256:'0a44581147294c20bf1779207ee121c857934063927306857dd66e5a8c62d435'},
    {...manual, source:'scripts/permission-pin-identity-runtime.mjs',
      fixture:'LEGACY_AUTH_CATALOG_ACL', exactAclPreflightRequired:true}),
    cliAlias:`${t04Root}/bin/supabase`,
    privateAlias:'/var/tmp/pos-cafe-perm-s31-identity-20261013/private', privateMustBeAbsent:true},
  PIN_CANARY:{...supabase('pos-cafe-perm-s31-canary-20261013',
    {api:62821, db:62822, shadow:62820, pooler:62829, studio:62823, smtp:62824, analytics:62827, inspector:8088},
    {base:identityConfig, derivation:'TC19_EXACT_REPLACEMENTS',
      sha256:'0c4f1e1c26cc53335c750b9cc6cf93a095478fa7f05fed4f2f08f7d876dd2405',
      source:'tests/contracts/permissionCanaryEmptyRuntime.contract.test.ts',
      note:'Legacy seed-disabled replacement is a no-op with the pinned intervening comment; retain exact config.'},
    {source:'tests/contracts/permissionCanaryEmptyRuntime.contract.test.ts', strategy:'CLI_16_EMPTY_SEED_FILE',
      migrationCount:16, seedRelativePath:'stack/supabase/seed.sql', seedBytes:0, exclusiveSeedFile:true,
      actualReadback:{database:'postgres', cliMigrations:16, tenantRowsEmpty:true, authUsers:0, storageObjects:0},
      neverReuseSeededPilot:true}), cliAlias:`${t04Root}/bin/supabase`},
  PG16_T01:{kind:'NATIVE_POSTGRESQL', postgresMajor:16, project:null, aliasRoot:null, ports:null, config:null,
    aliasRootPattern:'^/var/tmp/pos-cafe-perm-t01-[a-z0-9-]+$',
    dataDirectoryMustEqualShowResult:true, adminDatabase:'postgres', adminHosts:['127.0.0.1','localhost','[::1]'],
    databaseNamePattern:'^pos_cafe_idem_test_perm_[a-f0-9]{12}$',
    bootstrap:{...manual, source:'scripts/permission-fixture-bootstrap.mjs',
      fixture:'NATIVE_AUTH_STORAGE_CATALOG_AND_LEGACY', verifiedPg16BinaryRequired:true,
      observerOnly:true, doesNotProve:['AUTH','REST','STORAGE_SERVICE','REALTIME']},
    provisioning:'NEEDS_PORT', execution:'NOT_RUN'},
  SUPABASE_T02:supabase('pos-cafe-perm-s31-t02-20261013',
    {api:63421, db:63422, shadow:63420, pooler:63429, studio:63423, smtp:63424, analytics:63427, inspector:8083},
    {path:'tests/permissions/runtime/config.toml', bytes:15625,
      sha256:'4aa08380ee7d58eddbc264e002087db88d5b90d514c3af0163dffbd06b513e2b'},
    {...manual, source:'scripts/permission-bridge-runtime.mjs', fixture:'LEGACY_AUTH_CATALOG',
      stages:['bridge-bridge-database','candidate-bridge-database','foundation-database']}),
  SUPABASE_T04:{...supabase('pos-cafe-perm-s31-t04-20261013',
    {api:62421, db:62422, shadow:62420, pooler:62429, studio:62423, smtp:62424, analytics:62427, inspector:8084},
    identityConfig, {...manual, source:'scripts/permission-identity-runtime.mjs', fixture:'LEGACY_AUTH_CATALOG',
      serviceFixtureSource:'scripts/permission-ci1-fixture.mjs', buckets:3, objects:6,
      payloadGetHashRequired:true, realtimeReadyBeforeBaseline:true}),
    samePhysicalBackendRequired:true, logicalResetsOnlyAtReviewedBoundaries:true,
    stages:['identity-database','candidate-images-service','administration-database','read-database',
      'clear-demo-database','candidate-signals-database','financial-database','candidate-print-database',
      'candidate-bulk-concurrency-database','candidate-e2e','candidate-seed-recovery-database','candidate-roles-e2e',
      'realtime-e2e','rollback-additive-database','rollback-preflight-database','rollback-recovery-database',
      'transition-database','transition-e2e','transition-compatibility-database']},
});

export const FULL_RUNTIME_POLICY = freeze({mode:'PLAN_ONLY', execution:'NOT_RUN', provisioning:'NEEDS_PORT',
  profileOrder:Object.keys(profiles), maxHeavyEnvironments:1, hp1:'RETIRED_DO_NOT_RUN',
  resources:{enforcement:'NOT_ENFORCED_BY_THIS_MODULE', loopBytes:CI1_LIMITS.filesystemBytes,
    taskBytes:CI1_LIMITS.taskBytes, hostReserveBytes:CI1_LIMITS.hostReserveBytes,
    admission:'STOP_UNTIL_ACTUAL_MAXIMUM_GROWTH_RESERVES_WRITER_PLACEMENT_AND_TIME_FIT_VERIFIED'},
  adapters:'NEEDS_PORT: preserve fixed guard aliases and prove controlled mapping below owned loop; never disable guards',
});

export function fullRuntimeProfile(id) {
  if (typeof id !== 'string' || !Object.hasOwn(profiles,id)) refuse();
  return profiles[id];
}

export function fullRuntimeLayout(runId, attempt, nonce, ownerUid) {
  ci1Identity(runId,attempt); // Preserve the existing exact run/attempt admission range.
  if (typeof nonce !== 'string' || !/^[a-f0-9]{32}$/.test(nonce) || nonce.length !== 32
    || !Number.isSafeInteger(ownerUid) || ownerUid < 0 || ownerUid > 0xffffffff) refuse();
  const root = `/var/tmp/pos-permission-full-${runId}-${attempt}`;
  return freeze({runId, attempt, nonce, ownerUid, root, ownerLabel:`pos-permission-full-${runId}-${attempt}-${nonce}`,
    loopBackingFile:`${root}/data.img`, loopMount:`${root}/data`, mode:'PLAN_ONLY'});
}

// Read only own enumerable data fields: inherited properties/getters cannot
// substitute read-back facts, and getters are never invoked by these predicates.
function record(value, fields) {
  if (!value || Object.getPrototypeOf(value) !== Object.prototype) refuse();
  const output = {};
  for (const name of fields) {
    const descriptor = Object.getOwnPropertyDescriptor(value,name);
    if (!descriptor || !descriptor.enumerable || !Object.hasOwn(descriptor,'value')) refuse();
    output[name] = descriptor.value;
  }
  return output;
}
function checkedLayout(layout) {
  const fields = ['runId','attempt','nonce','ownerUid','root','ownerLabel','loopBackingFile','loopMount','mode'];
  const supplied = record(layout,fields);
  const expected = fullRuntimeLayout(supplied.runId,supplied.attempt,supplied.nonce,supplied.ownerUid);
  if (fields.some(field => supplied[field] !== expected[field])) refuse();
  return expected;
}

// Ubuntu/systemd 255 syntax. norbind prevents pre-existing child mounts from
// being recursively inherited; source existence is mandatory (no '-' prefix).
export function fullRuntimeUnitProperties(layout) {
  const {root} = checkedLayout(layout);
  return Object.freeze(['--property=PrivateTmp=yes', `--property=BindPaths=${root}:${root}:norbind`]);
}

// Future Linux adapter must independently read host/unit lstat/stat/realpath,
// owner nonce/label and host findmnt before provisioning. Setup receipts or CLI
// declarations are not evidence. This function checks supplied facts only: it
// performs no measurement, mount, resource enforcement or runtime admission.
export function assertFullRuntimeRootFacts(layout, observations) {
  const expected = checkedLayout(layout);
  const {host,unit} = record(observations,['host','unit']);
  const fields = ['path','realpath','directory','symlink','device','inode','ownerUid','mode','nonce','ownerLabel'];
  const hostFacts = record(host,[...fields,'preexistingSubmounts']);
  const unitFacts = record(unit,[...fields,'privateTmp','bindSource','bindDestination','bindRecursive','ignoreMissingSource']);
  for (const facts of [hostFacts,unitFacts]) {
    if (facts.path !== expected.root || facts.realpath !== expected.root || facts.directory !== true || facts.symlink !== false
      || typeof facts.device !== 'string' || !/^(0|[1-9][0-9]*)$/.test(facts.device) || /\D/.test(facts.device)
      || typeof facts.inode !== 'string' || !/^[1-9][0-9]*$/.test(facts.inode) || /\D/.test(facts.inode)
      || facts.ownerUid !== expected.ownerUid || facts.mode !== 0o700
      || facts.nonce !== expected.nonce || facts.ownerLabel !== expected.ownerLabel) refuse();
  }
  if (hostFacts.device !== unitFacts.device || hostFacts.inode !== unitFacts.inode
    || !Array.isArray(hostFacts.preexistingSubmounts) || hostFacts.preexistingSubmounts.length !== 0
    || unitFacts.privateTmp !== true || unitFacts.bindSource !== expected.root || unitFacts.bindDestination !== expected.root
    || unitFacts.bindRecursive !== false || unitFacts.ignoreMissingSource !== false) refuse();
  return freeze({mode:'PLAN_ONLY', predicate:'ROOT_FACTS_MATCH', execution:'NOT_RUN', provisioning:'NEEDS_PORT'});
}
