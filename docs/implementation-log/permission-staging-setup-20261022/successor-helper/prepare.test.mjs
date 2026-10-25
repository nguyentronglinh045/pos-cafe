import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PHASE_POLICY, stable, readPinned, readPinnedBytes, validatePolicy, validateSource, prepareBundle, writeOutputs, helperProvenance } from './prepare.mjs';
import { readSource, hash, providerCatalog } from '../../code/scripts/permission-staging-bootstrap.mjs';

// Synthetic observations/clock are ONLY test inputs. No fixture is written to
// disk, no live candidate is prepared, and the CLI never accepts a clock override.
const source = readSource(PHASE_POLICY.sourceRoot);
const inventory = readPinned(PHASE_POLICY.sourceInventory);
const predecessorManifest = readPinned(PHASE_POLICY.predecessor.bootstrapManifest);
const observation = () => ({
  schemaVersion: 'permission-staging-introspection-v1',
  identity: { database: 'postgres', databaseOid: '5', currentUser: 'postgres', sessionUser: 'postgres', serverVersionNum: '170011' },
  prerequisites: { authUsers: 'auth.users', storageBuckets: 'storage.buckets', storageObjects: 'storage.objects',
    authUid: 'auth.uid()', storageFoldername: 'storage.foldername(text)', existingStores: null, existingTestMarker: null,
    pgcryptoCrypt: 'extensions.crypt(text,text)', pgcryptoSalt: 'extensions.gen_salt(text)',
    pgcryptoDigest: 'extensions.digest(bytea,text)', pgcryptoHmac: 'extensions.hmac(bytea,bytea,text)', pgcryptoRandomBytes: 'extensions.gen_random_bytes(integer)' },
  executionCapabilities: { role: 'postgres', superuser: false, bypass_rls: true, can_alter_roles: true,
    can_set_pgrst_hook: true, can_manage_storage_objects: true, provider_role_usable: false,
    shared_preload: '', session_preload: '', provider_settings: [] },
  roles: [{ rolname: 'postgres' }], recoveryMemberships: [], extensions: [], schemas: [], defaultAcls: [],
  relations: [], functions: [], types: [], policies: [],
  publications: [{ pubname: 'supabase_realtime', owner: 'postgres', puballtables: false }],
  publicationTables: [], preRequestSettings: [], eventTriggers: [], dataCounts: { authUsers: '0', storageBuckets: '0', storageObjects: '0' },
});
const allowlist = value => ({ schemaVersion: 'permission-staging-provider-allowlist-v1', projectRef: PHASE_POLICY.projectRef,
  observationSha256: hash(JSON.stringify(value)), projectBinding: { projectRef: PHASE_POLICY.projectRef,
    sqlEditorUrl: 'https://supabase.com/dashboard/project/' + PHASE_POLICY.projectRef + '/sql/new' },
  reviewReferences: ['SYNTHETIC_SOURCE_REVIEW_ONLY', 'SYNTHETIC_OPERATIONS_REVIEW_ONLY'], providerCatalog: providerCatalog(value) });
const prepare = (changes = {}) => {
  const value = changes.observation ?? observation(), list = changes.allowlist ?? allowlist(value);
  return prepareBundle({ source, inventory, observation: value, observationSha256: hash(JSON.stringify(value)), allowlist: list,
    allowlistRawSha256: hash(JSON.stringify(list)), policy: PHASE_POLICY, policyRawSha256: hash(JSON.stringify(PHASE_POLICY)),
    predecessorManifest, nonce: '2'.repeat(32), now: new Date('2026-10-22T09:00:00.000Z'), ...changes });
};

test('new owner phase admits after old cutoff; exact policy and new cutoff fail closed', () => {
  validatePolicy(PHASE_POLICY, new Date('2026-10-22T09:00:00.000Z'));
  for (const date of ['2026-10-22T09:45:00.000Z', '2026-10-22T10:00:00.000Z', 'invalid'])
    assert.throws(() => validatePolicy(PHASE_POLICY, new Date(date)), /STAGING_MUTATION_ADMISSION_CLOSED/);
  for (const change of [{ mutationCutoffUtc: '2026-10-22T03:15:00.000Z' }, { deadlineUtc: '2026-10-23T10:00:00.000Z' },
    { projectRef: PHASE_POLICY.forbiddenProjectRef }, { ownerAuthorization: {} }])
    assert.throws(() => validatePolicy({ ...PHASE_POLICY, ...change }), /STAGING_SUCCESSOR_POLICY_REFUSED/);
});

test('pins all source and SQL identities; preserves complete 30-fragment atomic shape and honest provenance', async () => {
  const result = await prepare(), manifest = result.manifest;
  assert.equal(manifest.rawFiles.length, 28); assert.equal(manifest.controllers.length, 4); assert.equal(manifest.sourceSnapshot.files.length, 1106);
  assert.equal(manifest.fragments.length, 30); assert.equal(manifest.fragments[16].path, 'supabase/candidate/permission-compatibility-prepare.sql');
  assert.equal(manifest.fragments[17].path, 'supabase/migrations/017_permission_catalog_bridge.sql');
  assert.equal(manifest.fragments[18].path, 'controller:employees.role-to-text'); assert.equal(manifest.fragments.at(-1).path, 'controller:legacy-teardown');
  assert.equal(manifest.binding.canonicalSqlBundleSha256, PHASE_POLICY.canonicalSqlBundleSha256);
  assert.equal(manifest.binding.sourceHead, PHASE_POLICY.sourceHead); assert.equal(manifest.binding.mutationCutoffUtc, PHASE_POLICY.mutationCutoffUtc);
  assert.equal(manifest.binding.predecessorBootstrapManifestSha256, PHASE_POLICY.predecessor.bootstrapManifest.sha256);
  assert.equal(manifest.execution, 'NOT_RUN'); assert.equal(manifest.ready, false); assert.equal(manifest.businessTestsRun, false);
  assert.equal(manifest.successorHelper.b2CiValidatesThisTooling, false); assert.equal(manifest.applicationCi.validatesSuccessorTooling, false);
  assert.match(manifest.apply, /^BLOCKED/); assert.equal(manifest.sql.sha256, hash(result.sql)); assert.ok(manifest.sql.bytes <= 1_000_000);
  assert.equal((result.sql.match(/\$permission_staging_bootstrap\$/g) ?? []).length, 2);
  assert.equal((result.sql.match(/STAGING_FRESH_OBSERVATION_DRIFT/g) ?? []).length, 2);
  assert.ok(result.sql.indexOf('lock table auth.users') < result.sql.indexOf('create table private.permission_staging_bootstrap_marker'));
  for (const guard of ['STAGING_RAW_SELECT_EXPOSED', 'STAGING_RAW_COLUMN_PRIVILEGE_EXPOSED', 'STAGING_RAW_WRITE_OR_MAINTENANCE_EXPOSED',
    'STAGING_TENANT_NOT_EMPTY', 'STAGING_EXECUTION_WINDOW_CLOSED', 'STAGING_MUTATION_ADMISSION_CLOSED', 'COMMITTED_NOT_READY']) assert.ok(result.sql.includes(guard));
  assert.ok(!result.sql.includes('\r')); assert.match(result.reconcileSql, /'ready',false/);
  assert.doesNotMatch(result.reconcileSql, /\b(?:insert|update|delete|truncate|create|drop|alter|begin|commit)\s/i);
});

test('rejects wrong HEAD, dishonest fingerprint, raw/order/controller/introspection drift', () => {
  const cases = [
    [s => { s.head = '0'.repeat(40); }, /STAGING_SOURCE_HEAD_MISMATCH/],
    [s => { s.sourceFingerprint = '0'.repeat(64); }, /STAGING_SOURCE_FINGERPRINT_MISMATCH/],
    [s => { s.files[0].bytes++; }, /STAGING_SOURCE_FINGERPRINT_MISMATCH/],
    [s => { s.rawSql[0].sql += '-- changed'; }, /STAGING_RAW_SQL_DRIFT/],
    [s => { [s.rawSql[0], s.rawSql[1]] = [s.rawSql[1], s.rawSql[0]]; }, /STAGING_RAW_SQL_DRIFT/],
    [s => { s.rawSql.pop(); }, /STAGING_RAW_SQL_DRIFT/],
    [s => { s.controllerFiles[0].sha256 = '0'.repeat(64); }, /STAGING_CONTROLLER_INVENTORY_DRIFT/],
    [s => { s.introspectionSql += '\n'; }, /STAGING_INTROSPECTION_DRIFT/],
  ];
  for (const [mutate, expected] of cases) { const candidate = structuredClone(source); mutate(candidate); assert.throws(() => validateSource(candidate, inventory), expected); }
  const wrongInventory = structuredClone(inventory); wrongInventory.canonicalFiles[0].sha256 = '0'.repeat(64);
  assert.throws(() => validateSource(source, wrongInventory), /STAGING_CANONICAL_SQL_DRIFT/);
});

test('rejects nonce reuse and missing/changed predecessor or raw pins', async () => {
  for (const nonce of ['', 'z'.repeat(32), 'A'.repeat(32), predecessorManifest.binding.nonce]) await assert.rejects(prepare({ nonce }), /STAGING_NEW_NONCE_REQUIRED/);
  await assert.rejects(prepare({ predecessorManifest: {} }), /STAGING_PREDECESSOR_BINDING_MISMATCH/);
  await assert.rejects(prepare({ policyRawSha256: 'bad' }), /STAGING_PINNED_INPUT_REQUIRED/);
  assert.throws(() => readPinned({ ...PHASE_POLICY.sourceInventory, sha256: '0'.repeat(64) }), /STAGING_INPUT_HASH_MISMATCH/);
  assert.throws(() => readPinned({ path: 'relative.json', sha256: '0'.repeat(64) }), /STAGING_PINNED_INPUT_REQUIRED/);
});

test('provider observation freshness, target, exact allowlist and two independent references stay enforced', async () => {
  for (const key of ['authUsers', 'storageBuckets', 'storageObjects']) {
    const value = observation(); value.dataCounts[key] = '1'; await assert.rejects(prepare({ observation: value }), /STAGING_NONEMPTY_PROVIDER_DATA/);
  }
  const occupied = observation(); occupied.relations.push({ schema_name: 'public', relname: 'x', extension_name: null });
  await assert.rejects(prepare({ observation: occupied }), /STAGING_EXISTING_APPLICATION_CATALOG/);
  const capability = observation(); capability.executionCapabilities.superuser = true;
  await assert.rejects(prepare({ observation: capability }), /STAGING_PROVIDER_CAPABILITIES_REQUIRED/);
  const hooked = observation(); hooked.preRequestSettings.push({ unexpected: true });
  await assert.rejects(prepare({ observation: hooked }), /STAGING_EXISTING_SECURITY_STATE/);
  const value = observation(), original = allowlist(value); original.projectRef = PHASE_POLICY.forbiddenProjectRef;
  await assert.rejects(prepare({ observation: value, allowlist: original }), /STAGING_REVIEWED_ALLOWLIST_REQUIRED/);
  const one = allowlist(value); one.reviewReferences = ['same', 'same'];
  await assert.rejects(prepare({ observation: value, allowlist: one }), /STAGING_TWO_REVIEW_REFERENCES_REQUIRED/);
  const unknown = allowlist(value); unknown.providerCatalog.defaultAcls.push({ unknown: true });
  await assert.rejects(prepare({ observation: value, allowlist: unknown }), /STAGING_UNKNOWN_PROVIDER_CATALOG/);
});

test('exclusive output writer refuses existing content/code target and preserves partial failures without cleanup', () => {
  const writes = [], target = 'D:/Workspace/pos-cafe-permission-ci-fix-20261022/output-test-only';
  const io = { realpathSync: path => path, lstatSync: () => ({ isDirectory: () => true, isSymbolicLink: () => false }),
    readdirSync: () => [], writeFileSync: (path, value, options) => { assert.equal(options.flag, 'wx'); writes.push({ path, value }); } };
  const result = { sql: 'SYNTHETIC_ONLY', reconcileSql: 'SYNTHETIC_ONLY', manifest: { execution: 'NOT_RUN' } };
  writeOutputs(target, result, io); assert.equal(writes.length, 3);
  assert.throws(() => writeOutputs(target, result, { ...io, readdirSync: () => ['bootstrap.sql'] }), /STAGING_OUTPUT_NOT_EMPTY/);
  assert.throws(() => writeOutputs(PHASE_POLICY.sourceRoot, result, io), /STAGING_OUTPUT_DIRECTORY_REFUSED/);
  let attempted = 0;
  assert.throws(() => writeOutputs(target, result, { ...io, writeFileSync: () => { if (++attempted === 2) throw new Error('EEXIST'); } }), /EEXIST/);
  assert.equal(attempted, 2);
});

test('helper hashes identify actual new source/tests separately from frozen application', () => {
  const provenance = helperProvenance(); assert.equal(provenance.files.length, 2);
  assert.ok(provenance.files.every(file => hash(readFileSync(file.path)) === file.sha256));
  assert.ok(provenance.files.every(file => !file.path.startsWith(PHASE_POLICY.sourceRoot)));
  assert.equal(hash(JSON.stringify(provenance.files)), provenance.sha256);
  assert.equal(stable(PHASE_POLICY), stable(JSON.parse(JSON.stringify(PHASE_POLICY))));
  assert.equal(hash(readPinnedBytes(PHASE_POLICY.reviewedPlan)), PHASE_POLICY.reviewedPlan.sha256);
  assert.equal(hash(readPinnedBytes(PHASE_POLICY.predecessor.preflightClaim)), PHASE_POLICY.predecessor.preflightClaim.sha256);
});
