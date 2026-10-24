import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { ISOLATED_RECEIPT_MAX_BYTES as CAP, ISOLATED_RECEIPT_READ as READ, ISOLATED_RECEIPT_FACT_BOUNDS,
  readIsolatedReceipt, writeIsolatedReceipt, serializeIsolatedReceipt, isolatedReceiptMaximumBytes } from './permission-runtime-isolated-receipt.mjs';
import { ci1IsolatedFailure, ci1ReadIsolatedError, ci1FailureExport, CI1_ISOLATED_RECEIPT_MAXIMUM_BYTES as t04Maximum } from './permission-runtime-t04-worker.mjs';
import { ci1IsolatedFailure as serviceValidate, ci1ReadIsolatedError as serviceRead, CI1_ISOLATED_RECEIPT_MAXIMUM_BYTES as serviceMaximum } from './permission-runtime-service-worker.mjs';
import { T04_FAILURE_BOUNDS, t04RunnerFailureFacts, t04SafeFailureMetric } from './permission-runtime-t04.mjs';
import { SERVICE_DIAGNOSTIC_BOUNDS } from './permission-runtime-service-diagnostic.mjs';
import { CANDIDATE_TEST_NAMES, CANDIDATE_TEST_FILE, CANDIDATE_TEST_PROJECT, CANDIDATE_DIAGNOSTIC_SCHEMA } from './permission-runtime-candidate-diagnostic.mjs';
import { runtimeStage } from './permission-runtime-catalog.mjs';
import { collectRuntimeDiagnosticFacts } from './permission-runtime-diagnostic-transport.mjs';
import { reporterReceiptFileControl, returnReceiptControlFixtures, callerReceiptAccounting } from './permission-runtime-isolated-receipt-control.mjs';

const identity = { runId: '12345', attempt: 1 }, sourceSHA = 'a'.repeat(40);
const record = facts => ({ schemaVersion: 'permission-ci1-isolated-failure-v1', ...identity, sourceSHA,
  failure: { stage: 'offline-edge', operation: 'PILOT_HARNESS', code: 'COMMAND_FAILED', command: 'node', exitCode: 1, facts }, cleanupFailure: null });
const rows = CANDIDATE_TEST_NAMES.map((name, i) => ({ file: CANDIDATE_TEST_FILE, name, project: CANDIDATE_TEST_PROJECT,
  state: [3, 5].includes(i) ? 'failed' : 'passed', attempts: 1,
  ...(i === 3 ? { candidateDiagnostic: { status: 1, value: { schemaVersion: CANDIDATE_DIAGNOSTIC_SCHEMA, testOrdinal: 4,
    milestoneOrdinal: 6, observations: [], image: { phaseOrdinal: 1, observed: 1, selectionCount: 2, selectionMatches: 2,
      imageCount: 2, srcMatches: 1, decoded: 1 } } } } : {}),
  ...([3, 5].includes(i) ? { failureLine: 391, failureFacts: { errorCodeOrdinal: 0, errorNameOrdinal: 4, errorMatcherOrdinal: 9 } } : {}) }));
const facts = { t04StageOrdinal: 10, ...t04RunnerFailureFacts(runtimeStage('candidate-e2e'), {
  discovery: rows.map(({ file, name, project }) => ({ file, name, project })), results: rows, errorCount: 0, hookErrorCount: 0 }) };
const outerError = () => Object.assign(Error('PRIVATE_RECEIPT_SENTINEL'), { ci1Command: 'unshare', status: 78 });
function fixtureRoot() {
  fs.mkdirSync(resolve('artifacts'), { recursive: true });
  return fs.mkdtempSync(resolve('artifacts/isolated-receipt-control-'));
}

function nativeCases(parent) {
  assert.equal(process.platform, 'linux'); assert.equal(process.getuid(), 0);
  const oldUmask = process.umask(0o022);
  const owner = fs.lstatSync(parent), dir = join(parent, 'native-files'); fs.mkdirSync(dir, { mode: 0o755 });
  const created = [{ path: dir, dev: fs.lstatSync(dir).dev, ino: fs.lstatSync(dir).ino }];
  try {
  const valid = record(facts), bytes = Buffer.from(JSON.stringify(valid)); let cases = 0;
  const put = (name, body) => { const path = join(dir, name); fs.writeFileSync(path, body, { flag: 'wx', mode: 0o600 }); return path; };
  const check = (path, expected, binding = identity, sha = sourceSHA) => {
    const original = outerError(), recovered = ci1ReadIsolatedError(path, binding, sha, original);
    assert.equal(recovered.error.ci1Facts.isolatedReceiptReadOrdinal, expected);
    const exported = ci1FailureExport({ stage: 'offline-edge', operation: recovered.operation, code: recovered.error.ci1FailureCode ?? 'COMMAND_FAILED',
      command: recovered.error.ci1Command, exitCode: recovered.error.status, facts: recovered.error.ci1Facts });
    assert.equal(exported.facts.isolatedReceiptReadOrdinal, expected);
    if (expected !== READ.VALID) {
      assert.equal(recovered.error, original); assert.equal(recovered.operation, undefined);
      assert.equal(exported.command, 'unshare'); assert.equal(exported.exitCode, 78); assert.equal(exported.operation, null);
    }
    assert(!JSON.stringify(exported).includes('PRIVATE_RECEIPT_SENTINEL'));
    cases++; return recovered;
  };
  const full = put('valid.json', bytes);
  assert.deepEqual(collectRuntimeDiagnosticFacts([{ failure: { facts: check(full, READ.VALID).error.ci1Facts } }], 't04', t04SafeFailureMetric)[0], facts);
  const written = join(dir, 'writer.json');
  assert.equal(writeIsolatedReceipt(written, valid, identity, sourceSHA, ci1IsolatedFailure), bytes.length);
  check(written, READ.VALID);
  assert.throws(() => writeIsolatedReceipt(written, valid, identity, sourceSHA, ci1IsolatedFailure));
  for (const length of [CAP - 1, CAP, CAP + 1]) {
    const path = put('boundary-' + length + '.json', Buffer.concat([bytes, Buffer.alloc(length - bytes.length, 32)]));
    const result = check(path, length > CAP ? READ.OVERSIZED : READ.VALID);
    assert.equal(result.error.ci1Facts.isolatedReceiptBytes, length);
    assert.equal(result.error.ci1Facts.isolatedReceiptBytesCapped, length > CAP ? 1 : 0);
  }
  const huge = put('huge.json', Buffer.alloc(CAP + 99, 32)), capped = check(huge, READ.OVERSIZED);
  assert.equal(capped.error.ci1Facts.isolatedReceiptBytes, CAP + 1);
  check(join(dir, 'missing.json'), READ.MISSING);
  check(put('malformed.json', '{PRIVATE_RECEIPT_SENTINEL'), READ.MALFORMED);
  for (const [name, change] of [['source', { sourceSHA: 'b'.repeat(40) }], ['run', { runId: '54321' }], ['attempt', { attempt: 2 }],
    ['schema', { schemaVersion: 'unknown' }], ['raw', { raw: 'PRIVATE_RECEIPT_SENTINEL' }]])
    check(put(name + '.json', JSON.stringify({ ...valid, ...change })), READ.BINDING);
  for (const [binding, sha] of [[{ runId: '0', attempt: 1 }, sourceSHA], [{ ...identity, attempt: 1001 }, sourceSHA], [identity, 'bad']])
    check(full, READ.BINDING, binding, sha);
  const wrongMode = put('mode.json', bytes); fs.chmodSync(wrongMode, 0o644); check(wrongMode, READ.UNSAFE);
  const wrongOwner = put('owner.json', bytes); fs.chownSync(wrongOwner, 65534, 65534); check(wrongOwner, READ.UNSAFE);
  const link = join(dir, 'symlink.json'); fs.symlinkSync(full, link); check(link, READ.UNSAFE);
  const hardOriginal = put('hard-original.json', bytes), hard = join(dir, 'hard.json'); fs.linkSync(hardOriginal, hard); check(hard, READ.UNSAFE);
  const directory = join(dir, 'directory'); fs.mkdirSync(directory, { mode: 0o755 }); check(directory, READ.UNSAFE);
  check(join(full, 'child'), READ.IO);
  const outside = join(parent, 'public-parent'); fs.mkdirSync(outside, { mode: 0o755 });
  const outsideIdentity = { path: outside, dev: fs.lstatSync(outside).dev, ino: fs.lstatSync(outside).ino };
  const badParent = join(outside, 'receipt.json'); fs.writeFileSync(badParent, bytes, { mode: 0o600 });
  const badIdentity = fs.lstatSync(badParent);
  const outsideFd = fs.openSync(outside, fs.constants.O_RDONLY | fs.constants.O_DIRECTORY | fs.constants.O_NOFOLLOW);
  try { fs.fchmodSync(outsideFd, 0o777); check(badParent, READ.UNSAFE); }
  finally { try { fs.fchmodSync(outsideFd, 0o755); } finally { fs.closeSync(outsideFd); } }
  assert.deepEqual(fs.readdirSync(outside), ['receipt.json']);
  assert.equal(badIdentity.nlink, 1);
  const sealed = fs.lstatSync(badParent);
  for (const key of ['dev', 'ino', 'uid', 'gid', 'mode', 'nlink', 'size']) assert.equal(sealed[key], badIdentity[key]);
  // Only admit this temporarily writable tree to privileged handback after its
  // exact original entry/inode/link identity is proven; unexpected links refuse.
  created.push(outsideIdentity);
  const disappeared = put('disappeared.json', bytes), originalRealpath = fs.realpathSync;
  try {
    fs.realpathSync = (...args) => { if (args[0] === disappeared) fs.renameSync(disappeared, disappeared + '.moved');
      return originalRealpath(...args); };
    syncBuiltinESMExports(); check(disappeared, READ.UNSTABLE);
  } finally { fs.realpathSync = originalRealpath; syncBuiltinESMExports(); }
  // Deterministic races mutate real files during the production fd read; only
  // readSync scheduling is intercepted, no metadata or validation is mocked.
  for (const mode of ['grow', 'replace']) {
    const path = put(mode + '.json', bytes), replacement = mode === 'replace' ? put('replacement.json', bytes) : null;
    const originalRead = fs.readSync; let mutated = false;
    try {
      fs.readSync = (...args) => { const n = originalRead(...args); if (!mutated) { mutated = true;
        if (mode === 'grow') fs.appendFileSync(path, ' '); else fs.renameSync(replacement, path); } return n; };
      syncBuiltinESMExports(); check(path, READ.UNSTABLE);
    } finally { fs.readSync = originalRead; syncBuiltinESMExports(); }
  }
  const maximumFacts = Object.fromEntries(Object.entries(T04_FAILURE_BOUNDS).map(([key, bounds]) => [key, bounds[1]]));
  const both = record(maximumFacts); both.cleanupFailure = { ...both.failure, stage: 'cleanup' };
  const bothBytes = Buffer.byteLength(JSON.stringify(both)); assert(bothBytes > 65536 && bothBytes <= t04Maximum);
  const bothPath = join(dir, 'both.json'); writeIsolatedReceipt(bothPath, both, identity, sourceSHA, ci1IsolatedFailure);
  assert.equal(check(bothPath, READ.VALID).error.ci1Facts.isolatedCleanupFailed, 1);
  const cleanupOnly = { ...both, failure: null }, cleanupPath = join(dir, 'cleanup-only.json');
  writeIsolatedReceipt(cleanupPath, cleanupOnly, identity, sourceSHA, ci1IsolatedFailure);
  assert.equal(check(cleanupPath, READ.VALID).error.ci1Facts.isolatedCleanupFailed, 1);
  const service = record({ ...SERVICE_DIAGNOSTIC_BOUNDS }); service.cleanupFailure = { ...service.failure, stage: 'cleanup' };
  const servicePath = join(dir, 'service.json'); writeIsolatedReceipt(servicePath, service, identity, sourceSHA, serviceValidate);
  const serviceResult = serviceRead(servicePath, identity, sourceSHA, outerError());
  assert.equal(serviceResult.error.ci1Facts.isolatedReceiptReadOrdinal, READ.VALID);
  assert.deepEqual(Object.fromEntries(Object.keys(SERVICE_DIAGNOSTIC_BOUNDS).map(key => [key, serviceResult.error.ci1Facts[key]])), SERVICE_DIAGNOSTIC_BOUNDS);
  cases++;
  const files = fs.readdirSync(dir).map(name => fs.lstatSync(join(dir, name))).filter(info => info.isFile());
  const callerAccountedBytes = callerReceiptAccounting(parent, owner);
  return { coverage: 'LINUX_ROOT_FILESYSTEM', cases, files: files.length, bytes: files.reduce((n, info) => n + info.size, 0), bothBytes, callerAccountedBytes };
  } finally { try { returnReceiptControlFixtures(parent, owner, created); } finally { process.umask(oldUmask); } }
}

if (process.argv[2] === '--native-filesystem') {
  try { console.log(JSON.stringify(nativeCases(resolve(process.argv[3])))); }
  catch { console.error('ISOLATED_RECEIPT_NATIVE_CONTROL_FAILED'); process.exitCode = 1; }
} else {
  test('complete fixed-schema maxima include both branches and remain inside the shared 128KiB bound', () => {
    assert.equal(t04Maximum, 100551); assert.equal(serviceMaximum, 106305);
    assert(t04Maximum < CAP && serviceMaximum < CAP);
    assert.equal(Object.keys(facts).length, 773);
    const largeMetrics = Array.from({ length: 3000 }, (_, n) => 'metric' + n.toString().padStart(4, '0') + 'X'.repeat(60));
    assert.throws(() => isolatedReceiptMaximumBytes({ metrics: largeMetrics, operations: ['OP'], codes: ['CODE'], commands: ['node'] }));
  });
  test('writer uses the same byte cap and strict source/run/schema before creating a file', () => {
    const value = record(facts), encoded = serializeIsolatedReceipt(value, identity, sourceSHA, ci1IsolatedFailure);
    assert(encoded.length > 8192 && encoded.length < CAP);
    assert.throws(() => serializeIsolatedReceipt({ ...value, raw: 'PRIVATE_RECEIPT_SENTINEL' }, identity, sourceSHA, ci1IsolatedFailure));
    for (const binding of [{ runId: '0', attempt: 1 }, { runId: '9'.repeat(21), attempt: 1 }, { ...identity, attempt: 1001 }])
      assert.throws(() => serializeIsolatedReceipt({ ...value, ...binding }, binding, sourceSHA, ci1IsolatedFailure));
    // Isolate the writer's independent byte guard from the fixed-schema guard.
    assert.throws(() => serializeIsolatedReceipt({ value: 'x'.repeat(CAP) }, identity, sourceSHA, () => {}));
    const dir = fixtureRoot(), file = join(dir, 'must-not-exist.json');
    assert.throws(() => writeIsolatedReceipt(file, { ...value, raw: 'PRIVATE_RECEIPT_SENTINEL' }, identity, sourceSHA, ci1IsolatedFailure));
    assert.equal(fs.existsSync(file), false);
    console.log('ISOLATED_RECEIPT_RETAINED ' + JSON.stringify({ path: dir, files: 0, bytes: 0 }));
  });
  test('receipt observation exporter rejects unknown, excessive and secret fields', () => {
    for (const [key, bound] of Object.entries(ISOLATED_RECEIPT_FACT_BOUNDS)) {
      assert.equal(ci1FailureExport(record({ [key]: bound }).failure).facts[key], bound);
      for (const value of [-1, bound + 1, 'PRIVATE_RECEIPT_SENTINEL', NaN])
        assert.equal(ci1FailureExport(record({ [key]: value }).failure).facts?.[key], undefined);
    }
    assert.equal(ci1FailureExport(record({ raw: 'PRIVATE_RECEIPT_SENTINEL' }).failure).facts, undefined);
  });
  test('real receipt file reader feeds recovered inner failure through unchanged outer failure evidence gate', () => {
    const dir = fixtureRoot(), result = reporterReceiptFileControl(process.cwd(), dir, record(facts));
    if (process.platform === 'linux') {
      assert.equal(result.coverage, 'LINUX_ROOT_FILE_ROUNDTRIP');
      assert.deepEqual(collectRuntimeDiagnosticFacts([{ failure: result.failure }], 't04', t04SafeFailureMetric)[0], facts);
    } else {
      assert.equal(result.coverage, 'WINDOWS_REFUSAL_ONLY'); assert.equal(result.failure, null);
    }
    console.log('ISOLATED_RECEIPT_RETAINED ' + JSON.stringify({ path: dir, files: 1, bytes: result.bytes, coverage: result.coverage }));
  });
  test('native filesystem guards: bounds, missing, malformed, drift, ownership, links and actual file races', () => {
    const dir = fixtureRoot();
    if (process.platform !== 'linux') {
      const file = join(dir, 'unsafe-on-windows.json'); fs.writeFileSync(file, JSON.stringify(record(facts)), { mode: 0o600 });
      assert.equal(readIsolatedReceipt(file, identity, sourceSHA, ci1IsolatedFailure).facts.isolatedReceiptReadOrdinal, READ.UNSAFE);
      assert.equal(readIsolatedReceipt(join(dir, 'absent.json'), identity, sourceSHA, ci1IsolatedFailure).facts.isolatedReceiptReadOrdinal, READ.MISSING);
      console.log('ISOLATED_RECEIPT_RETAINED ' + JSON.stringify({ path: dir, files: 1, bytes: fs.statSync(file).size,
        coverage: 'WINDOWS_REFUSAL_ONLY_UNIX_OWNERSHIP_NOT_EXECUTED' }));
      return;
    }
    const args = [fileURLToPath(import.meta.url), '--native-filesystem', dir], elevated = process.getuid() !== 0;
    const child = spawnSync(elevated ? '/usr/bin/sudo' : process.execPath,
      elevated ? ['-n', '--', process.execPath, ...args] : args, { cwd: process.cwd(), encoding: 'utf8', timeout: 15000, maxBuffer: 8192 });
    assert.equal(child.status, 0, 'ISOLATED_RECEIPT_NATIVE_CONTROL_FAILED'); assert(!child.error && !child.signal);
    const report = JSON.parse(child.stdout); assert.equal(report.coverage, 'LINUX_ROOT_FILESYSTEM'); assert.equal(report.cases, 29);
    assert(report.bytes < 3 * 1024 ** 2);
    const inspect = path => {
      const info = fs.lstatSync(path); assert.equal(info.uid, process.getuid());
      if (info.isDirectory()) { assert.equal(info.mode & 0o777, 0o700); for (const name of fs.readdirSync(path)) inspect(join(path, name)); }
      else if (info.isFile()) { assert.equal(info.mode & 0o777, 0o600); assert.equal(fs.readFileSync(path).length, info.size); }
    };
    inspect(dir); // Same nonroot recursive accessibility needed by CI accounting/cleanup.
    console.log('ISOLATED_RECEIPT_RETAINED ' + JSON.stringify({ path: dir, ...report }));
  });
  test('both production worker adapters use shared writer and actual reader; legacy 8KiB gate is absent', () => {
    for (const worker of ['t04', 'service']) {
      const source = fs.readFileSync(new URL('./permission-runtime-' + worker + '-worker.mjs', import.meta.url), 'utf8');
      assert(source.includes('writeIsolatedReceipt(`${root}/private/isolated-failure.json`, record'));
      assert(source.includes('ci1ReadIsolatedError(`${root}/private/isolated-failure.json`, layout.identity'));
      assert(!source.includes('info.size <= 8192'));
      assert(source.includes("failureFacts: () => ['IMAGE_PULL', 'IMAGE_TAG', 'IMAGE_INSPECT'].includes(operation)"));
    }
  });
}
