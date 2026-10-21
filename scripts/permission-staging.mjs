import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, realpathSync, lstatSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, resolve, join, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runtimeStageCatalog } from './permission-runtime-catalog.mjs';

export const STAGING_BASELINE = '90e30f2b2b0f046c549b268b32f1840ad99c2409';
export const PRODUCTION_PROJECT_REF = 'kfqjdfwxhkdwihjobpny';
export const STAGING_DEADLINE = '2026-10-21T16:00:00.000Z';
export const STAGING_TEST_CUTOFF = '2026-10-21T15:45:00.000Z';
export const STAGING_WORKSTREAM = 'permission-staging-20261021';
const CLAIM_DIRECTORY = 'D:/Workspace/pos-cafe-permission-run-20261020/evidence/staging-20261021';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const HEX = /^[a-f0-9]{64}$/;
const ERROR_CODES = new Set(['STAGING_TARGET_REFUSED', 'STAGING_INPUT_REFUSED',
  'STAGING_COVERAGE_DRIFT', 'STAGING_SOURCE_DRIFT', 'STAGING_ATTEMPT_USED',
  'STAGING_DEADLINE', 'STAGING_REMOTE_REFUSED', 'STAGING_NETWORK_FAILED']);

const refuse = code => { throw new Error(code); };
const check = (value, code = 'STAGING_INPUT_REFUSED') => { if (!value) refuse(code); };
const exactKeys = (value, keys) => value && typeof value === 'object' && !Array.isArray(value)
  && JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...keys].sort());
export function canonical(value) {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).sort()
    .map(key => JSON.stringify(key) + ':' + canonical(value[key])).join(',') + '}';
  return JSON.stringify(value);
}
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
export const inventoryHash = value => sha256(canonical(value));
export function stagingErrorCode(error) {
  return ERROR_CODES.has(error?.message) ? error.message : 'STAGING_INPUT_REFUSED';
}

// Content of every tracked file, plus the four explicitly reviewed new tools.
// Existing unrelated untracked recovery helpers are outside this candidate.
export function stagingSourceFingerprint({ read = readFileSync } = {}) {
  const gitHead = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();
  check(/^[a-f0-9]{40}$/.test(gitHead), 'STAGING_SOURCE_DRIFT');
  const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 })
    .split('\0').filter(Boolean);
  const supplemental = ['scripts/permission-staging.mjs', 'scripts/permission-staging-cli.mjs',
    'scripts/permission-staging.test.mjs', 'scripts/permission-staging.README.md'];
  const files = [...new Set([...tracked, ...supplemental])].sort().map(path => {
    check(!isAbsolute(path) && !path.split(/[\\/]/).includes('..'), 'STAGING_SOURCE_DRIFT');
    check(lstatSync(resolve(ROOT, path)).isFile(), 'STAGING_SOURCE_DRIFT');
    return { path, sha256: sha256(read(resolve(ROOT, path))) };
  });
  return { version: 'permission-staging-source-v1', gitHead,
    scope: 'ALL_TRACKED_FILES_PLUS_FOUR_STAGING_FILES',
    assurance: read === readFileSync ? 'ACTUAL_FILES' : 'SYNTHETIC_FILES',
    trackedFileCount: tracked.length, files };
}

export function createStagingAttemptStore(directory) {
  return { claim(details) {
    const path = resolve(directory);
    const same = (a, b) => process.platform === 'win32' ? a.toLowerCase() === b.toLowerCase() : a === b;
    check(isAbsolute(directory) && same(realpathSync(dirname(path)), dirname(path)));
    try { mkdirSync(path); } catch (error) { if (error.code !== 'EEXIST') throw error; }
    check(lstatSync(path).isDirectory() && same(realpathSync(path), path));
    try {
      writeFileSync(join(path, 'remote-preflight.claim.json'), JSON.stringify({
        version: 'permission-staging-attempt-v1', workstream: STAGING_WORKSTREAM,
        ...details, allowance: { attempts: 1, requests: 2 }, status: 'CONSUMED_BEFORE_NETWORK',
      }, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
    } catch (error) {
      if (error.code === 'EEXIST') refuse('STAGING_ATTEMPT_USED');
      throw error;
    }
  } };
}

// Importing this module neither contacts a backend nor reads ambient env files.
export function buildStagingInventory() {
  const catalog = runtimeStageCatalog();
  const paths = new Set(['scripts/permission-runtime-catalog.mjs', 'scripts/permission-full-controller.mjs',
    'scripts/permission-full-perm-plan.mjs', 'scripts/permission-full-runtime-policy.mjs',
    'tests/permissions/prep-perm-manifest.json', 'tests/permissions/full-pin19-integrated.json']);
  const stages = catalog.map(stage => {
    for (const path of [...stage.files, stage.config.path]) paths.add(path);
    return { stage: stage.stage, runtimeProfile: stage.runtimeProfile,
      lane: stage.runtimeProfile === 'STATIC' ? 'STATIC'
        : stage.runtimeProfile === 'PG16_T01' ? 'ISOLATED_REQUIRED' : 'HOSTED_ADAPTATION_REQUIRED',
      required: true, hostedStatus: stage.runtimeProfile === 'STATIC' ? 'NOT_APPLICABLE' : 'NOT_IMPLEMENTED',
      rows: stage.required.map(row => ({ file: row.file, name: row.name, project: row.project ?? null })) };
  });
  const requiredRows = stages.reduce((sum, stage) => sum + stage.rows.length, 0);
  check(stages.length === 35 && requiredRows === 760, 'STAGING_COVERAGE_DRIFT');
  for (const stage of stages) check(new Set(stage.rows.map(canonical)).size === stage.rows.length,
    'STAGING_COVERAGE_DRIFT');
  return { version: 'permission-staging-inventory-v1', baselineSource: STAGING_BASELINE,
    stageCount: stages.length, requiredRows,
    originalCounts: { permissionCases: 60, permissionOccurrences: 726, pinCases: 19,
      pinSubvariants: 183, pinMappings: 111, combinedManifestOccurrences: 837 },
    inputs: [...paths].sort().map(path => ({ path, sha256: sha256(readFileSync(resolve(ROOT, path))) })),
    stages };
}

function assertTime(manifest, now) {
  const milliseconds = now instanceof Date ? now.getTime() : NaN;
  check(manifest.deadlineUtc === STAGING_DEADLINE && Number.isFinite(milliseconds)
    && milliseconds >= Date.parse('2026-10-21T00:00:00.000Z')
    && milliseconds < Date.parse(STAGING_TEST_CUTOFF), 'STAGING_DEADLINE');
}

export function validateStagingManifest(manifest, inventory, now = new Date(), sourceFingerprint) {
  check(exactKeys(manifest, ['version', 'projectRef', 'apiOrigin', 'baselineSource', 'coverageSha256',
    'sourceFingerprintSha256', 'deadlineUtc', 'scope', 'acknowledgement']));
  check(manifest.version === 'permission-staging-v1' && manifest.scope === 'READ_ONLY_PREFLIGHT'
    && manifest.acknowledgement === 'STAGING_ONLY_NO_PRODUCTION');
  check(typeof manifest.projectRef === 'string' && /^[a-z]{20}$/.test(manifest.projectRef)
    && manifest.projectRef !== PRODUCTION_PROJECT_REF, 'STAGING_TARGET_REFUSED');
  check(manifest.apiOrigin === `https://${manifest.projectRef}.supabase.co`, 'STAGING_TARGET_REFUSED');
  check(manifest.baselineSource === STAGING_BASELINE && HEX.test(manifest.coverageSha256)
    && inventory?.version === 'permission-staging-inventory-v1' && inventory.stageCount === 35
    && inventory.requiredRows === 760 && inventoryHash(inventory) === manifest.coverageSha256,
  'STAGING_COVERAGE_DRIFT');
  assertTime(manifest, now);
  check(HEX.test(manifest.sourceFingerprintSha256)
    && inventoryHash(sourceFingerprint ?? stagingSourceFingerprint()) === manifest.sourceFingerprintSha256,
  'STAGING_SOURCE_DRIFT');
  return { projectRef: manifest.projectRef, apiOrigin: manifest.apiOrigin };
}

export function validateStagingPrivateConfig(config, projectRef) {
  check(exactKeys(config, ['projectRef', 'anonKey']) && config.projectRef === projectRef);
  const key = config.anonKey;
  check(typeof key === 'string' && key.length >= 16 && key.length <= 8192
    && !/[\s\x00-\x1f\x7f]/.test(key));
  // Never send a service-role/secret key through this read-only client.
  if (key.startsWith('sb_publishable_')) check(/^sb_publishable_[A-Za-z0-9_-]{16,}$/.test(key));
  else {
    let claims;
    try {
      check(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(key));
      claims = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString('utf8'));
    } catch { refuse('STAGING_INPUT_REFUSED'); }
    check(claims?.role === 'anon' && claims.ref === projectRef);
  }
  return key;
}

export function stagingToolFingerprint() {
  return ['scripts/permission-staging.mjs', 'scripts/permission-staging-cli.mjs']
    .map(path => ({ path, sha256: sha256(readFileSync(resolve(ROOT, path))) }));
}

// No SQL, seed, reset, management API, or mutation method is implemented here.
export async function stagingPreflight({ manifest, inventory, privateConfig,
  expectedManifestSha256, clock = () => new Date(), fetchImpl = fetch, timeoutMs = 5000, attemptStore }) {
  check(HEX.test(expectedManifestSha256) && inventoryHash(manifest) === expectedManifestSha256);
  check(Number.isInteger(timeoutMs) && timeoutMs > 0 && timeoutMs <= 5000);
  const startedMonotonic = performance.now(), expiresAt = startedMonotonic + 15000;
  const assertWindow = () => check(performance.now() < expiresAt, 'STAGING_NETWORK_FAILED');
  check(process.env.NODE_TLS_REJECT_UNAUTHORIZED !== '0', 'STAGING_TARGET_REFUSED');
  const actual = fetchImpl === fetch;
  check(actual ? attemptStore === undefined : typeof attemptStore?.claim === 'function');
  const sourceFingerprint = stagingSourceFingerprint();
  const target = validateStagingManifest(manifest, inventory, clock(), sourceFingerprint);
  const key = validateStagingPrivateConfig(privateConfig, target.projectRef);
  const tools = stagingToolFingerprint();
  const assertSource = () => {
    check(inventoryHash(buildStagingInventory()) === manifest.coverageSha256
      && canonical(stagingToolFingerprint()) === canonical(tools), 'STAGING_COVERAGE_DRIFT');
    check(inventoryHash(stagingSourceFingerprint()) === manifest.sourceFingerprintSha256,
      'STAGING_SOURCE_DRIFT');
  };
  assertSource();
  assertWindow();
  validateStagingManifest(manifest, inventory, clock(), sourceFingerprint);
  const startedUtc = clock().toISOString();
  (actual ? createStagingAttemptStore(CLAIM_DIRECTORY) : attemptStore).claim({
    projectRef: target.projectRef, manifestSha256: expectedManifestSha256,
    sourceFingerprintSha256: manifest.sourceFingerprintSha256, startedUtc,
  });
  const requests = [];
  let status = 'PASS', errorCode = null;
  for (const path of ['/auth/v1/settings', '/rest/v1/']) {
    let controller, timer;
    try {
      // A slow first request cannot admit a second after the cutoff.
      validateStagingManifest(manifest, inventory, clock(), sourceFingerprint);
      assertSource();
      validateStagingManifest(manifest, inventory, clock(), sourceFingerprint);
      assertWindow();
      controller = new AbortController();
      const timeout = new Promise((_, reject) => { timer = setTimeout(() => {
        controller.abort(); reject(new Error('STAGING_NETWORK_FAILED'));
      }, Math.min(timeoutMs, Math.max(1, Math.floor(expiresAt - performance.now())))); });
      requests.push({ path, status: 'ATTEMPTED', httpStatus: null });
      let response;
      try {
        response = await Promise.race([fetchImpl(target.apiOrigin + path, { method: 'GET', redirect: 'error',
          headers: { apikey: key }, signal: controller.signal }), timeout]);
      } catch { refuse('STAGING_NETWORK_FAILED'); }
      requests.at(-1).httpStatus = Number.isInteger(response?.status) ? response.status : null;
      check(response?.status >= 200 && response.status < 300, 'STAGING_REMOTE_REFUSED');
      requests.at(-1).status = 'PASS';
      validateStagingManifest(manifest, inventory, clock(), sourceFingerprint);
      assertSource();
      validateStagingManifest(manifest, inventory, clock(), sourceFingerprint);
      assertWindow();
    } catch (error) {
      status = 'FAIL'; errorCode = stagingErrorCode(error);
      if (requests.at(-1)?.status === 'ATTEMPTED') requests.at(-1).status = 'FAIL';
      break;
    } finally {
      clearTimeout(timer);
      controller?.abort(); // Do not retain or log response bodies.
    }
  }
  return { version: 'permission-staging-preflight-v1', assurance: actual ? 'ACTUAL_HTTP' : 'SYNTHETIC_TRANSPORT',
    operation: 'READ_ONLY_PREFLIGHT', baselineSource: STAGING_BASELINE,
    manifestSha256: expectedManifestSha256, coverageSha256: inventoryHash(inventory),
    sourceFingerprintSha256: manifest.sourceFingerprintSha256, gitHead: sourceFingerprint.gitHead,
    sourceScope: sourceFingerprint.scope, sourceFileCount: sourceFingerprint.files.length,
    workstream: STAGING_WORKSTREAM, attemptConsumed: true, runtimeNode: process.version,
    privateConfigSha256: inventoryHash(privateConfig), tools,
    projectRef: target.projectRef, apiOrigin: target.apiOrigin, startedUtc, endedUtc: clock().toISOString(),
    elapsedMs: Math.round(performance.now() - startedMonotonic),
    status, errorCode, requests, mutationReady: false, businessTestsRun: false };
}
