import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runStagingCli } from './permission-staging-cli.mjs';
import { buildStagingInventory, canonical, inventoryHash, validateStagingManifest,
  validateStagingPrivateConfig, stagingPreflight, STAGING_BASELINE, STAGING_DEADLINE,
  STAGING_TEST_CUTOFF, PRODUCTION_PROJECT_REF } from './permission-staging.mjs';
import { stagingSourceFingerprint, createStagingAttemptStore } from './permission-staging.mjs';

const ref = 'abcdefghijklmnopqrst';
const inventory = buildStagingInventory();
const sourceFingerprint = stagingSourceFingerprint();
const now = () => new Date('2026-10-21T14:00:00.000Z');
const jwt = claims => Buffer.from('{"alg":"HS256"}').toString('base64url') + '.'
  + Buffer.from(JSON.stringify(claims)).toString('base64url') + '.CANARY_SIGNATURE_DO_NOT_LOG';
const key = jwt({ role: 'anon', ref });
const config = () => ({ projectRef: ref, anonKey: key });
const manifest = () => ({ version: 'permission-staging-v1', projectRef: ref,
  apiOrigin: `https://${ref}.supabase.co`, baselineSource: STAGING_BASELINE,
  coverageSha256: inventoryHash(inventory), deadlineUtc: STAGING_DEADLINE,
  sourceFingerprintSha256: inventoryHash(sourceFingerprint),
  scope: 'READ_ONLY_PREFLIGHT', acknowledgement: 'STAGING_ONLY_NO_PRODUCTION' });
async function preflight(overrides = {}) {
  const value = overrides.manifest ?? manifest();
  return stagingPreflight({ manifest: value, inventory, privateConfig: config(),
    expectedManifestSha256: inventoryHash(value), clock: now,
    attemptStore: { claim() {} },
    fetchImpl: async () => ({ status: 200 }), ...overrides });
}

test('complete inventory retains 35 stages, 760 identities, original counting meanings and all source hashes', () => {
  assert.equal(inventory.stageCount, 35);
  assert.equal(inventory.requiredRows, 760);
  assert.equal(inventory.stages.filter(s => s.lane === 'STATIC').length, 5);
  assert.equal(inventory.stages.filter(s => s.lane === 'ISOLATED_REQUIRED').length, 1);
  assert.equal(inventory.stages.filter(s => s.lane === 'HOSTED_ADAPTATION_REQUIRED').length, 29);
  assert.equal(inventory.originalCounts.combinedManifestOccurrences, 837);
  assert.equal(inventory.stages.flatMap(s => s.rows).length, 760);
  assert(inventory.stages.every(s => s.required && s.rows.length > 0));
  assert(inventory.inputs.length > 30 && inventory.inputs.every(x => /^[a-f0-9]{64}$/.test(x.sha256)));
  assert.equal(inventoryHash(buildStagingInventory()), inventoryHash(inventory));
});

test('full source binding includes SQL, fixtures, app and lock, and detects a memory-only SQL change', async () => {
  for (const path of ['supabase/candidate/permission-identity.sql', 'tests/contracts/permissionIdentityFixture.ts',
    'scripts/permission-identity-runtime.mjs', 'src/app/runtimePorts.ts', 'package-lock.json']) {
    assert(sourceFingerprint.files.some(file => file.path === path));
  }
  assert(sourceFingerprint.files.length > 1000);
  const changed = stagingSourceFingerprint({ read: path => path.replaceAll('\\', '/').endsWith('/supabase/candidate/permission-identity.sql')
    ? Buffer.concat([readFileSync(path), Buffer.from('\n-- synthetic change')]) : readFileSync(path) });
  const sqlPath = 'supabase/candidate/permission-identity.sql';
  assert.notEqual(changed.files.find(file => file.path === sqlPath).sha256,
    sourceFingerprint.files.find(file => file.path === sqlPath).sha256);
  assert.equal(changed.files.length, sourceFingerprint.files.length);
  assert.notEqual(inventoryHash(changed), inventoryHash(sourceFingerprint));
  const value = manifest(); value.sourceFingerprintSha256 = inventoryHash(changed);
  let calls = 0;
  await assert.rejects(preflight({ manifest: value, fetchImpl: async () => { calls++; return { status: 200 }; } }), /STAGING_SOURCE_DRIFT/);
  assert.equal(calls, 0);
});

test('valid target sends exactly two bounded GETs, explicit anon key, no redirects and no mutation proof', async () => {
  const calls = [];
  const receipt = await preflight({ fetchImpl: async (url, options) => {
    calls.push({ url, options }); return { status: 200 };
  } });
  assert.equal(receipt.status, 'PASS');
  assert.equal(receipt.assurance, 'SYNTHETIC_TRANSPORT');
  assert.equal(receipt.mutationReady, false);
  assert.equal(receipt.businessTestsRun, false);
  assert.deepEqual(calls.map(x => x.url), [`https://${ref}.supabase.co/auth/v1/settings`, `https://${ref}.supabase.co/rest/v1/`]);
  for (const { options } of calls) {
    assert.equal(options.method, 'GET'); assert.equal(options.redirect, 'error');
    assert.equal(options.headers.apikey, key); assert(options.signal.aborted);
  }
  assert(!canonical(receipt).includes(key));
});

for (const [name, change] of [
  ['production ref', m => { m.projectRef = PRODUCTION_PROJECT_REF; m.apiOrigin = `https://${PRODUCTION_PROJECT_REF}.supabase.co`; }],
  ['production origin', m => { m.apiOrigin = `https://${PRODUCTION_PROJECT_REF}.supabase.co`; }],
  ...['http://', 'https://user@', 'https://', 'https://', 'https://', 'https://', 'https://']
    .map((prefix, i) => [`origin variant ${i}`, m => { m.apiOrigin = prefix + ref + '.supabase.co'
      + ['', '', ':443', '/', '/rest/v1/', '?target=prod', '#fragment'][i]; }]),
  ['hostname suffix', m => { m.apiOrigin += '.attacker.example'; }],
  ['unknown operation', m => { m.scope = 'RESET'; }],
  ['unexpected field', m => { m.sql = 'delete from public.stores'; }],
]) test(`invalid ${name} is rejected with zero network calls`, async () => {
  const value = manifest(); change(value); let calls = 0;
  await assert.rejects(preflight({ manifest: value, fetchImpl: async () => { calls++; return { status: 200 }; } }),
    /STAGING_(TARGET|INPUT)_REFUSED/);
  assert.equal(calls, 0);
});

test('manifest hash binding and coverage changes cannot silently select a new inventory', async () => {
  await assert.rejects(preflight({ expectedManifestSha256: '0'.repeat(64) }), /STAGING_INPUT_REFUSED/);
  for (const mutate of [x => x.stages[0].rows.pop(), x => x.stages[0].rows[0].name += ' changed',
    x => x.inputs[0].sha256 = '0'.repeat(64)]) {
    const changed = structuredClone(inventory); mutate(changed);
    await assert.rejects(preflight({ inventory: changed }), /STAGING_COVERAGE_DRIFT/);
  }
});

test('private configuration never falls back to ambient values or accepts service credentials', async () => {
  const previous = process.env.VITE_SUPABASE_URL;
  process.env.VITE_SUPABASE_URL = `https://${PRODUCTION_PROJECT_REF}.supabase.co`;
  try {
    for (const invalid of [undefined, {}, { ...config(), extra: 'ignored' }, { ...config(), projectRef: PRODUCTION_PROJECT_REF },
      { ...config(), anonKey: '' }, { ...config(), anonKey: 'x'.repeat(8193) }, { ...config(), anonKey: key + '\n' },
      { ...config(), anonKey: jwt({ role: 'service_role', ref }) }, { ...config(), anonKey: jwt({ role: 'anon', ref: PRODUCTION_PROJECT_REF }) },
      { ...config(), anonKey: 'sb_secret_abcdefghijklmnopqrstuv' }]) {
      let calls = 0;
      await assert.rejects(preflight({ privateConfig: invalid, fetchImpl: async () => { calls++; return { status: 200 }; } }), /STAGING_INPUT_REFUSED/);
      assert.equal(calls, 0);
    }
    assert.equal((await preflight()).status, 'PASS');
    assert.equal(validateStagingPrivateConfig({ projectRef: ref, anonKey: 'sb_publishable_abcdefghijklmnopqrstuv' }, ref),
      'sb_publishable_abcdefghijklmnopqrstuv');
  } finally {
    if (previous === undefined) delete process.env.VITE_SUPABASE_URL;
    else process.env.VITE_SUPABASE_URL = previous;
  }
});

test('deadline boundaries fail closed and a slow first GET cannot start a second', async () => {
  validateStagingManifest(manifest(), inventory, new Date(Date.parse(STAGING_TEST_CUTOFF) - 1));
  for (const time of [STAGING_TEST_CUTOFF, STAGING_DEADLINE, '2026-10-22T00:00:00Z', 'invalid']) {
    await assert.rejects(preflight({ clock: () => new Date(time) }), /STAGING_DEADLINE/);
  }
  const value = manifest(); value.deadlineUtc = '2026-10-22T16:00:00.000Z';
  await assert.rejects(preflight({ manifest: value }), /STAGING_DEADLINE/);
  let late = false, calls = 0;
  const receipt = await preflight({ clock: () => late ? new Date(STAGING_TEST_CUTOFF) : now(),
    fetchImpl: async () => { calls++; late = true; return { status: 200 }; } });
  assert.equal(calls, 1); assert.equal(receipt.errorCode, 'STAGING_DEADLINE');
});

for (const status of [301, 302, 401, 403, 500]) test(`HTTP ${status} stops after one request without leaking body`, async () => {
  let calls = 0;
  const receipt = await preflight({ fetchImpl: async () => { calls++; return { status, body: key }; } });
  assert.equal(calls, 1); assert.equal(receipt.errorCode, 'STAGING_REMOTE_REFUSED');
  assert(!canonical(receipt).includes(key));
});

test('network exception and real timeout keep finite errors and do not retry', async () => {
  const receipt = await preflight({ fetchImpl: async () => { throw Error('secret=' + key); } });
  assert.equal(receipt.errorCode, 'STAGING_NETWORK_FAILED');
  assert(!canonical(receipt).includes(key));
  let calls = 0;
  const timeout = await preflight({ timeoutMs: 15, fetchImpl: async () => { calls++; return new Promise(() => {}); } });
  assert.equal(calls, 1); assert.equal(timeout.errorCode, 'STAGING_NETWORK_FAILED');
});

test('disabled TLS validation is refused before any network request', async () => {
  const previous = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; let calls = 0;
  try {
    await assert.rejects(preflight({ fetchImpl: async () => { calls++; return { status: 200 }; } }), /STAGING_TARGET_REFUSED/);
    assert.equal(calls, 0);
  } finally {
    if (previous === undefined) delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    else process.env.NODE_TLS_REJECT_UNAUTHORIZED = previous;
  }
});

test('actual HTTP cannot use an injected attempt store and synthetic HTTP must declare its store', async () => {
  await assert.rejects(preflight({ fetchImpl: fetch }), /STAGING_INPUT_REFUSED/);
  await assert.rejects(preflight({ attemptStore: undefined }), /STAGING_INPUT_REFUSED/);
});

test('CLI reserves parseable evidence before network, refuses repeat path and invalid output without network', async () => {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const fixture = resolve(root, '..', 'evidence', 'staging-node-fixtures-' + Date.now());
  mkdirSync(fixture, { recursive: true });
  const manifestPath = join(fixture, 'manifest.json'), privatePath = join(fixture, 'synthetic-private.json');
  const outputPath = join(fixture, 'receipt.json');
  const value = manifest();
  writeFileSync(manifestPath, JSON.stringify(value)); writeFileSync(privatePath, JSON.stringify(config()));
  let calls = 0;
  const attemptStore = createStagingAttemptStore(join(fixture, 'attempt-store'));
  const adapter = { clock: now, attemptStore, fetchImpl: async () => {
    assert.equal(JSON.parse(readFileSync(outputPath)).status, 'STARTED');
    calls++; return { status: 200 };
  } };
  const args = ['preflight', manifestPath, privatePath, inventoryHash(value), outputPath];
  const result = await runStagingCli(args, adapter);
  assert.equal(result.exitCode, 0); assert.equal(calls, 2);
  const saved = JSON.parse(readFileSync(outputPath));
  assert.equal(saved.assurance, 'SYNTHETIC_TRANSPORT'); assert.equal(saved.status, 'PASS');
  assert(!readFileSync(outputPath, 'utf8').includes(key));
  calls = 0;
  const repeat = await runStagingCli(args, adapter);
  assert.equal(repeat.exitCode, 1); assert.equal(calls, 0);
  const renamedOutput = join(fixture, 'receipt-renamed.json');
  const renamed = await runStagingCli([...args.slice(0, -1), renamedOutput], adapter);
  assert.equal(renamed.exitCode, 1); assert.equal(renamed.summary.errorCode, 'STAGING_ATTEMPT_USED');
  assert.equal(calls, 0);
  const missingParent = await runStagingCli([...args.slice(0, -1), join(fixture, 'missing', 'receipt.json')], adapter);
  assert.equal(missingParent.exitCode, 1); assert.equal(calls, 0);
  const insideCode = await runStagingCli(['preflight', manifestPath, join(root, '.env.example'), inventoryHash(value),
    join(fixture, 'forbidden-private-receipt.json')], adapter);
  assert.equal(insideCode.exitCode, 1); assert.equal(calls, 0);
});
