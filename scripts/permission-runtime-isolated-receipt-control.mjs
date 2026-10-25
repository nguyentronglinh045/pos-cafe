// Small filesystem control used by node-tools and the real reporter selftest.
// Fixtures are retained below the caller's artifacts directory; no backend runs.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, readFileSync, realpathSync, lstatSync, readdirSync, lchownSync,
  constants, openSync, closeSync, fstatSync, fchownSync, fchmodSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { writeIsolatedReceipt, ISOLATED_RECEIPT_MAX_BYTES, ISOLATED_RECEIPT_READ } from './permission-runtime-isolated-receipt.mjs';
import { ci1IsolatedFailure, ci1ReadIsolatedError, ci1FailureExport, ci1WorkerPlan } from './permission-runtime-t04-worker.mjs';
import { backendFailureEvidence, backendEvidence,backendImageDiagnosticFailureEvidence,backendImageDiagnosticEvidence } from './project-backend-t04.mjs';
import { runT04Profile,runT04ImageDiagnostic } from './permission-runtime-t04.mjs';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const originalError = () => Object.assign(Error('PRIVATE_RECEIPT_SENTINEL'), { status: 78, ci1Command: 'unshare' });

// Hold real root-owned fixtures in place while the actual CI accountant runs as
// the original caller. This proves monitor accessibility without a timing race.
export function callerReceiptAccounting(parent, owner) {
  assert.equal(process.platform, 'linux'); assert.equal(process.getuid(), 0);
  if (process.env.GITHUB_ACTIONS === 'true') assert(owner.uid > 0);
  const script = `import{allocatedBytes}from${JSON.stringify(new URL('./project-ci.mjs', import.meta.url).href)};console.log(allocatedBytes([process.argv[1]]));`;
  const child = spawnSync(process.execPath, ['--input-type=module', '-e', script, parent], {
    cwd: process.cwd(), uid: owner.uid, gid: owner.gid, encoding: 'utf8', timeout: 5000, maxBuffer: 8192 });
  assert.equal(child.status, 0, 'ISOLATED_RECEIPT_CALLER_ACCOUNTING_FAILED'); assert(!child.error && !child.signal);
  const bytes = Number(child.stdout.trim()); assert(Number.isSafeInteger(bytes) && bytes > 0 && bytes < 3 * 1024 ** 2);
  return bytes;
}

// Control fixtures only: prove production root/private guards first, then return
// exactly the freshly created trees to the caller for its existing inspect/rm
// lifecycle. Never follow a symlink or change production/private runtime files.
export function returnReceiptControlFixtures(parent, owner, created) {
  if (process.platform !== 'linux') return;
  const current = lstatSync(parent);
  assert.equal(realpathSync(parent), parent);
  for (const key of ['dev', 'ino', 'uid', 'gid']) assert.equal(current[key], owner[key]);
  assert(current.isDirectory() && !current.isSymbolicLink());
  let entries = 0, bytes = 0;
  for (const tree of created) {
    assert(['isolated-receipt', 'native-files', 'public-parent'].includes(relative(parent, tree.path)));
    const guard = () => {
      const info = lstatSync(tree.path);
      assert(info.isDirectory() && !info.isSymbolicLink() && info.dev === tree.dev && info.ino === tree.ino
        && info.uid === 0 && !(info.mode & 0o022));
      assert.equal(realpathSync(tree.path), tree.path);
    };
    const visit = path => {
      guard(); const info = lstatSync(path); assert(++entries <= 64 && info.dev === tree.dev);
      if (info.isSymbolicLink()) {
        // Parent is sealed/root-owned; lchown never follows the link, and no
        // path-based chmod may run on a leaf classified before a possible race.
        guard(); lchownSync(path, owner.uid, owner.gid); return;
      }
      assert(info.isFile() || info.isDirectory());
      if (info.isDirectory()) assert(info.uid === 0 && !(info.mode & 0o022));
      else { bytes += info.size; assert(bytes < 3 * 1024 ** 2); }
      const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK
        | (info.isDirectory() ? constants.O_DIRECTORY : 0));
      try {
        const opened = fstatSync(fd);
        for (const key of ['dev', 'ino', 'uid', 'gid', 'mode', 'nlink', 'size']) assert.equal(opened[key], info[key]);
        if (info.isDirectory()) for (const name of readdirSync(path)) visit(join(path, name));
        guard(); fchownSync(fd, owner.uid, owner.gid); fchmodSync(fd, info.isDirectory() ? 0o700 : 0o600);
      } finally { closeSync(fd); }
    };
    visit(tree.path);
  }
}

export async function receiptFileRoundtrip(parent, record,mode='full') {
  assert(['full','image-diagnostic'].includes(mode));
  const identity = { runId: record.runId, attempt: record.attempt }, sourceSHA = record.sourceSHA;
  ci1IsolatedFailure(record, identity, sourceSHA);
  const oldUmask = process.platform === 'linux' ? process.umask(0o022) : null;
  const owner = lstatSync(parent), dir = join(parent, 'isolated-receipt'); mkdirSync(dir, { mode: 0o755 });
  const created = [{ path: dir, dev: lstatSync(dir).dev, ino: lstatSync(dir).ino }];
  try {
  const file = join(dir, 'isolated-failure.json'), bytes = Buffer.from(JSON.stringify(record));
  if (process.platform !== 'linux') {
    writeFileSync(file, bytes, { flag: 'wx', mode: 0o600 });
    const original = originalError(), result = ci1ReadIsolatedError(file, identity, sourceSHA, original);
    assert.equal(result.error, original);
    assert.equal(result.error.ci1Facts.isolatedReceiptReadOrdinal, ISOLATED_RECEIPT_READ.UNSAFE);
    return { coverage: 'WINDOWS_REFUSAL_ONLY', bytes: bytes.length, receiptSHA: hash(bytes), cap: ISOLATED_RECEIPT_MAX_BYTES,
      runId: record.runId, attempt: record.attempt, sourceSHA, originalPreserved: true, failure: null };
  }
  assert.equal(process.getuid(), 0);
  assert.equal(writeIsolatedReceipt(file, record, identity, sourceSHA, ci1IsolatedFailure), bytes.length);
  const callerAccountedBytes = callerReceiptAccounting(parent, owner);
  const inner = ci1ReadIsolatedError(file, identity, sourceSHA, originalError());
  assert.equal(inner.operation, record.failure.operation);
  assert.equal(inner.error.ci1Facts.isolatedReceiptReadOrdinal, ISOLATED_RECEIPT_READ.VALID);
  const failure = ci1FailureExport({ stage: 'offline-edge', operation: inner.operation, code: inner.error.ci1FailureCode,
    command: inner.error.ci1Command, exitCode: inner.error.status, facts: inner.error.ci1Facts });
  for (const [key, value] of Object.entries(record.failure.facts)) assert.equal(failure.facts[key], value);
  // Synthetic counts receipt exercises the unchanged outer failure gate only.
  const digest='b'.repeat(64);
  const diagnosticAdapter={guard(){},async bootstrap(){},async physical(){return digest;},async baseline(){return digest;},async preserved(){return true;},
    async checkpoint(){return{archiveSHA:digest,storageSHA:digest};},
    async preflight(){return{status:'PASS',archiveSHA:digest,storageSHA:digest,baselineSHA:digest,physicalSHA:digest};},async prepare(){},
    async stage(){return{stage:'candidate-e2e',status:'PASS',required:2,run:6,pass:6,fail:0,skip:0,retry:0};},
    async imageMeasurement(){throw Object.assign(Error('PRIVATE_RECEIPT_SENTINEL'),record.failure.facts);},async close(){return true;}};
  const evidence = { ...await (mode==='full'?runT04Profile({ guard() {}, async bootstrap() { throw Error('CONTROL'); }, async close() { return true; } })
      :runT04ImageDiagnostic(diagnosticAdapter)),
    repository: 'nguyentronglinh045/pos-cafe', ...identity, sourceSHA, workflowSHA: sourceSHA,
    sourceFingerprint: 'b'.repeat(64), lockSHA: 'c'.repeat(64) };
  const env = { GITHUB_REPOSITORY: evidence.repository, GITHUB_RUN_ID: identity.runId, GITHUB_RUN_ATTEMPT: String(identity.attempt),
    GITHUB_SHA: sourceSHA, GITHUB_WORKFLOW_SHA: sourceSHA,
    CI1_CONFIRMATION:mode==='full'?'RUN_T04_PROFILE':'RUN_T04_IMAGE_DIAGNOSTIC',CI1_EXPECTED_SOURCE_SHA:sourceSHA };
  const worker = { schemaVersion: 'permission-ci1-worker-status-v1', status: 'ERROR', businessCounts: null, cleanup: true,
    cleanupFailure: null, completed: ci1WorkerPlan(identity.runId, identity.attempt).stages.slice(1, 7), failure };
  const failureGate=mode==='full'?backendFailureEvidence:backendImageDiagnosticFailureEvidence;
  assert.equal(JSON.parse(failureGate(worker, evidence, env).json).status,mode==='full'?'FAIL':'DIAGNOSTIC_FAIL');
  assert.throws(() => backendEvidence(worker, evidence, env));
  assert.throws(() => backendImageDiagnosticEvidence(worker,evidence,env));
  if(mode==='image-diagnostic')assert.throws(()=>backendFailureEvidence(worker,evidence,{...env,CI1_CONFIRMATION:'RUN_T04_PROFILE'}));
  for (const change of [{ operation: null }, { command: 'unshare' }, { exitCode: 78 }])
    assert.throws(() => failureGate({ ...worker, failure: { ...failure, ...change } }, evidence, env));
  assert(!JSON.stringify(failure).includes('PRIVATE_RECEIPT_SENTINEL'));
  return { coverage: 'LINUX_ROOT_FILE_ROUNDTRIP', bytes: bytes.length, receiptSHA: hash(bytes), cap: ISOLATED_RECEIPT_MAX_BYTES,
    runId: record.runId, attempt: record.attempt, sourceSHA, originalPreserved: false, callerAccountedBytes, failure };
  } finally {
    try { returnReceiptControlFixtures(parent, owner, created); }
    finally { if (oldUmask !== null) process.umask(oldUmask); }
  }
}

export function reporterReceiptFileControl(root, parent, record,mode='full') {
  assert(['full','image-diagnostic'].includes(mode));
  const tool = fileURLToPath(import.meta.url), args = [tool, 'roundtrip', parent,mode];
  const elevated = process.platform === 'linux' && process.getuid() !== 0;
  const child = spawnSync(elevated ? '/usr/bin/sudo' : process.execPath,
    elevated ? ['-n', '--', process.execPath, ...args] : args,
    { cwd: root, input: JSON.stringify(record), encoding: 'utf8', timeout: 15000, maxBuffer: 1024 ** 2, windowsHide: true });
  assert.equal(child.status, 0, 'ISOLATED_RECEIPT_FILESYSTEM_CONTROL_FAILED');
  assert(!child.error && !child.signal);
  const result = JSON.parse(child.stdout);
  assert.equal(result.coverage, process.platform === 'linux' ? 'LINUX_ROOT_FILE_ROUNDTRIP' : 'WINDOWS_REFUSAL_ONLY');
  // This runs in the original (nonroot on LIGHT CI) caller, after handback.
  const dir = join(parent, 'isolated-receipt'), file = join(dir, 'isolated-failure.json');
  assert.deepEqual(readdirSync(dir), ['isolated-failure.json']);
  assert.equal(hash(readFileSync(file)), result.receiptSHA);
  if (process.platform === 'linux') {
    assert.equal(lstatSync(dir).uid, process.getuid()); assert.equal(lstatSync(file).uid, process.getuid());
    assert.equal(lstatSync(dir).mode & 0o777, 0o700); assert.equal(lstatSync(file).mode & 0o777, 0o600);
  }
  result.callerCanInspect = true;
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const parent = resolve(process.argv[3]), scope = relative(resolve('artifacts'), parent);
    assert.equal(process.argv[2], 'roundtrip');
    assert(scope && !scope.startsWith('..') && !scope.includes(':') && realpathSync(parent) === parent && lstatSync(parent).isDirectory());
    const input = readFileSync(0); assert(input.length <= ISOLATED_RECEIPT_MAX_BYTES);
    console.log(JSON.stringify(await receiptFileRoundtrip(parent, JSON.parse(input),process.argv[4]??'full')));
  } catch { console.error('ISOLATED_RECEIPT_FILESYSTEM_CONTROL_FAILED'); process.exitCode = 1; }
}
