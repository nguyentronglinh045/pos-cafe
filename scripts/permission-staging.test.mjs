import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync, readFileSync, existsSync, realpathSync, symlinkSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { runStagingCli, privateConfigLocation, protectedDirectoryBoundary } from './permission-staging-cli.mjs';
import { buildStagingInventory, canonical, inventoryHash, validateStagingManifest,
  validateStagingPrivateConfig, stagingPreflight, STAGING_BASELINE, STAGING_DEADLINE,
  STAGING_TEST_CUTOFF, PRODUCTION_PROJECT_REF } from './permission-staging.mjs';
import { stagingSourceFingerprint, createStagingAttemptStore, createStagingRemediationAttemptStore,
  STAGING_REMEDIATION_GRANT, STAGING_REST_PROBE_PATH, sha256 } from './permission-staging.mjs';

const ref = 'abcdefghijklmnopqrst';
const inventory = buildStagingInventory();
const sourceFingerprint = stagingSourceFingerprint();
const now = () => new Date('2026-10-21T14:00:00.000Z');
const jwt = claims => Buffer.from('{"alg":"HS256"}').toString('base64url') + '.'
  + Buffer.from(JSON.stringify(claims)).toString('base64url') + '.CANARY_SIGNATURE_DO_NOT_LOG';
const key = jwt({ role: 'anon', ref });
const config = () => ({ projectRef: ref, anonKey: key });
// All synthetic files remain below one task-owned temp root, included in CI's
// TMPDIR accounting. No real claim/evidence/config path is used or removed.
const temporaryParent = resolve(process.env.PERMISSION_STATIC_TEST_TMP ?? process.env.TMPDIR ?? tmpdir());
mkdirSync(temporaryParent, { recursive: true });
const fixtureRoot = mkdtempSync(join(realpathSync(temporaryParent), 'permission-staging-ci-portability-20261022-'));
function ownedFixture(name) {
  const path = join(fixtureRoot, name);
  mkdirSync(path, { mode: 0o700 });
  return path;
}
const missingResource = (body = { code: 'PGRST205', message: 'CANARY_BODY_DO_NOT_LOG', hint: key }) =>
  new Response(JSON.stringify(body), { status: 404, headers: { 'content-type': 'application/json; charset=utf-8' } });
const successResponse = url => url.endsWith('/auth/v1/settings') ? new Response(null, { status: 200 }) : missingResource();
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
    fetchImpl: async url => successResponse(url), ...overrides });
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

test('valid target proves Auth reachability and typed REST routing with no data or mutation proof', async () => {
  const calls = [];
  const receipt = await preflight({ fetchImpl: async (url, options) => {
    calls.push({ url, options }); return successResponse(url);
  } });
  assert.equal(receipt.status, 'PASS');
  assert.equal(receipt.assurance, 'SYNTHETIC_TRANSPORT');
  assert.equal(receipt.mutationReady, false);
  assert.equal(receipt.businessTestsRun, false);
  assert.equal(receipt.restDataAccessVerified, false);
  assert.equal(receipt.requests[1].postgrestCode, 'PGRST205');
  assert.equal(receipt.requests[1].classification, 'REST_ROUTER_MISSING_RESOURCE');
  assert.deepEqual(calls.map(x => x.url), [`https://${ref}.supabase.co/auth/v1/settings`, `https://${ref}.supabase.co${STAGING_REST_PROBE_PATH}`]);
  for (const { options } of calls) {
    assert.equal(options.method, 'GET'); assert.equal(options.redirect, 'error');
    assert.equal(options.headers.apikey, key); assert(options.signal.aborted);
  }
  assert(!canonical(receipt).includes(key));
  assert(!canonical(receipt).includes('CANARY_BODY_DO_NOT_LOG'));
});

for (const [name, response] of [
  ['401 with expected-looking JSON', () => new Response('{"code":"PGRST205"}', { status: 401, headers: {'content-type':'application/json'} })],
  ['generic404', () => new Response('{}', { status: 404, headers: {'content-type':'application/json'} })],
  ['wrong PostgREST code', () => missingResource({code:'PGRST301'})],
  ['HTML404', () => new Response('{"code":"PGRST205"}', { status: 404, headers: {'content-type':'text/html'} })],
  ['malformed JSON', () => new Response('{bad', { status: 404, headers: {'content-type':'application/json'} })],
  ['oversized body', () => missingResource({code:'PGRST205', hint:'x'.repeat(4096)})],
  ['unexpected success/resource collision', () => new Response('[]', {status:200})],
]) test(`REST ${name} is refused; an HTTP error alone is never routing proof`, async () => {
  let calls=0;
  const receipt = await preflight({fetchImpl: async url => { calls++; return url.endsWith('/auth/v1/settings')
    ? new Response(null,{status:200}) : response(); }});
  assert.equal(calls,2); assert.equal(receipt.status,'FAIL');
  assert.equal(receipt.errorCode,'STAGING_REMOTE_REFUSED');
  assert.equal(receipt.restDataAccessVerified,false); assert.equal(receipt.mutationReady,false);
  assert(!canonical(receipt).includes(key));
});

test('REST body read is covered by request timeout and is not retried', async () => {
  let calls=0;
  const receipt = await preflight({timeoutMs:1000, fetchImpl: async (url, options) => {
    calls++;
    if(url.endsWith('/auth/v1/settings')) return new Response(null,{status:200});
    const body = new ReadableStream({start(controller) {
      options.signal.addEventListener('abort',()=>controller.error(new Error('CANARY_PRIVATE_ERROR')), {once:true});
    } });
    return new Response(body,{status:404,headers:{'content-type':'application/json'}});
  }});
  assert.equal(calls,2); assert.equal(receipt.status,'FAIL');
  assert.equal(receipt.errorCode,'STAGING_NETWORK_FAILED');
  assert(!canonical(receipt).includes('CANARY_PRIVATE_ERROR'));
});

test('chunked JSON at exactly4096bytes is accepted without preserving body fields', async () => {
  const base=JSON.stringify({code:'PGRST205',padding:''});
  const text=JSON.stringify({code:'PGRST205',padding:'x'.repeat(4096-Buffer.byteLength(base))});
  assert.equal(Buffer.byteLength(text),4096);
  const bytes=Buffer.from(text);
  const receipt=await preflight({fetchImpl:async url=>url.endsWith('/auth/v1/settings')
    ? new Response(null,{status:200}) : new Response(new ReadableStream({start(controller){
      controller.enqueue(bytes.subarray(0,2000)); controller.enqueue(bytes.subarray(2000)); controller.close();
    }}),{status:404,headers:{'content-type':'application/json'}})});
  assert.equal(receipt.status,'PASS');
  assert.equal(receipt.requests[1].postgrestCode,'PGRST205');
  assert(!canonical(receipt).includes('padding'));
});

test('additional grant is bound to the consumed prior claim, fixed target and a single new slot', () => {
  const root=ownedFixture('staging-grant');
  const prior={version:'permission-staging-attempt-v1',workstream:'permission-staging-20261021',projectRef:'ineckiashpwloncxnbqx',
    manifestSha256:'a58a52d7855bf071827350b78619b86a3a56ad030b1721511655ab4346397e1b',
    sourceFingerprintSha256:'35ef7b6781bcfc5ed1b91875f5b129f5c0ee07ef7955509ed98e73231ee8807c',
    startedUtc:'2026-10-21T15:13:32.182Z',allowance:{attempts:1,requests:2},status:'CONSUMED_BEFORE_NETWORK'};
  const bytes=Buffer.from(JSON.stringify(prior,null,2)+'\n');
  assert.equal(sha256(bytes),STAGING_REMEDIATION_GRANT.predecessorClaimSha256);
  const priorPath=join(root,'remote-preflight.claim.json'), grantPath=join(root,'rest-probe-remediation01.grant.json');
  const newPath=join(root,'remote-preflight-remediation01.claim.json');
  writeFileSync(priorPath,bytes);
  const store=createStagingRemediationAttemptStore(root);
  const details={projectRef:STAGING_REMEDIATION_GRANT.projectRef,manifestSha256:'a'.repeat(64),
    sourceFingerprintSha256:'b'.repeat(64),startedUtc:now().toISOString()};
  assert.throws(()=>store.claim(details),/STAGING_GRANT_REFUSED/);
  writeFileSync(grantPath,JSON.stringify({...STAGING_REMEDIATION_GRANT,additionalAttempts:2}));
  assert.throws(()=>store.claim(details),/STAGING_GRANT_REFUSED/);
  writeFileSync(grantPath,JSON.stringify(STAGING_REMEDIATION_GRANT));
  assert.throws(()=>store.claim({...details,projectRef:ref}),/STAGING_GRANT_REFUSED/);
  writeFileSync(priorPath,Buffer.concat([bytes,Buffer.from(' ')]));
  assert.throws(()=>store.claim(details),/STAGING_GRANT_REFUSED/);
  assert.equal(existsSync(newPath),false);
  writeFileSync(priorPath,bytes);
  store.claim(details);
  assert.equal(readFileSync(priorPath,'utf8'),bytes.toString('utf8'));
  assert.equal(JSON.parse(readFileSync(newPath)).grantSha256,inventoryHash(STAGING_REMEDIATION_GRANT));
  assert.throws(()=>store.claim({...details,manifestSha256:'c'.repeat(64)}),/STAGING_ATTEMPT_USED/);
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
  const fixture = ownedFixture('staging-cli');
  const manifestPath = join(fixture, 'manifest.json'), privatePath = join(fixture, 'synthetic-private.json');
  const outputPath = join(fixture, 'receipt.json');
  const value = manifest();
  writeFileSync(manifestPath, JSON.stringify(value)); writeFileSync(privatePath, JSON.stringify(config()));
  let calls = 0;
  const attemptStore = createStagingAttemptStore(join(fixture, 'attempt-store'));
  const adapter = { clock: now, attemptStore, fetchImpl: async url => {
    assert.equal(JSON.parse(readFileSync(outputPath)).status, 'STARTED');
    calls++; return successResponse(url);
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

test('private config is accepted outside a code-only checkout with a genuinely absent docs boundary', () => {
  const root = ownedFixture('absent-docs'), codeRoot = join(root, 'code');
  mkdirSync(codeRoot);
  const docsRoot = join(root, 'missing-parent', 'docs');
  const configPath = join(root, 'synthetic-private.json');
  writeFileSync(configPath, JSON.stringify(config()));
  assert.equal(protectedDirectoryBoundary(docsRoot), docsRoot);
  assert.equal(privateConfigLocation(configPath, { codeRoot, docsRoot }), realpathSync(configPath));
  assert.equal(existsSync(join(root, 'missing-parent')), false);
});

test('existing canonical code/docs boundaries reject inside and symlink-aliased private configs', () => {
  const root = ownedFixture('present-docs'), codeRoot = join(root, 'code'), docsRoot = join(root, 'docs');
  mkdirSync(codeRoot); mkdirSync(docsRoot);
  const outsidePath = join(root, 'synthetic-private.json');
  const codePath = join(codeRoot, 'synthetic-private.json'), docsPath = join(docsRoot, 'synthetic-private.json');
  for (const path of [outsidePath, codePath, docsPath]) writeFileSync(path, JSON.stringify(config()));
  assert.equal(privateConfigLocation(outsidePath, { codeRoot, docsRoot }), realpathSync(outsidePath));
  for (const path of [codePath, docsPath]) assert.throws(() => privateConfigLocation(path, { codeRoot, docsRoot }), /STAGING_INPUT_REFUSED/);
  const alias = join(root, 'docs-alias');
  symlinkSync(docsRoot, alias, process.platform === 'win32' ? 'junction' : 'dir');
  assert.throws(() => privateConfigLocation(docsPath, { codeRoot, docsRoot: alias }), /STAGING_INPUT_REFUSED/);
  assert.throws(() => privateConfigLocation(join(alias, 'synthetic-private.json'), { codeRoot, docsRoot }), /STAGING_INPUT_REFUSED/);
});

test('dangling docs links or ancestors never become an absent-directory fallback', () => {
  const root = ownedFixture('dangling-docs'), target = join(root, 'missing-target'), link = join(root, 'docs-link');
  symlinkSync(target, link, process.platform === 'win32' ? 'junction' : 'dir');
  for (const path of [link, join(link, 'missing-child')]) {
    assert.throws(() => protectedDirectoryBoundary(path), error => error.code === 'ENOENT');
  }
});

test('permission and non-directory errors are propagated without canonical-boundary fallback', () => {
  const root = ownedFixture('boundary-errors');
  for (const code of ['EACCES', 'ENOTDIR']) {
    let realpathCalls = 0;
    assert.throws(() => protectedDirectoryBoundary(join(root, 'docs'), {
      lstat() { throw Object.assign(new Error('synthetic boundary error'), { code }); },
      realpath() { realpathCalls++; return root; },
    }), error => error.code === code);
    assert.equal(realpathCalls, 0);
  }
  const file = join(root, 'file'); writeFileSync(file, 'synthetic regular file');
  assert.throws(() => protectedDirectoryBoundary(file), /STAGING_INPUT_REFUSED/);
  assert.throws(() => protectedDirectoryBoundary(join(file, 'docs')), error => error.code === 'ENOTDIR' || error.message === 'STAGING_INPUT_REFUSED');
});
