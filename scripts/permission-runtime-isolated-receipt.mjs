// A private, source/run-bound receipt crosses the namespace before owned reclaim.
// This is diagnostic transport only; it cannot authorize a business PASS.
import { constants, lstatSync, realpathSync, openSync, closeSync, fstatSync, readSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';

export const ISOLATED_RECEIPT_MAX_BYTES = 128 * 1024;
export const ISOLATED_RECEIPT_READ = Object.freeze({ VALID: 1, MISSING: 2, OVERSIZED: 3,
  UNSAFE: 4, MALFORMED: 5, BINDING: 6, IO: 7, UNSTABLE: 8 });
export const ISOLATED_RECEIPT_FACT_BOUNDS = Object.freeze({ isolatedReceiptReadOrdinal: 8,
  isolatedReceiptBytes: ISOLATED_RECEIPT_MAX_BYTES + 1, isolatedReceiptBytesCapped: 1 });
const refuse = () => { throw Error('ISOLATED_RECEIPT_REFUSED'); };
export function isolatedReceiptSafeFact(key, value) {
  return Object.hasOwn(ISOLATED_RECEIPT_FACT_BOUNDS, key) && Number.isSafeInteger(value)
    && value >= 0 && value <= ISOLATED_RECEIPT_FACT_BOUNDS[key];
}
export function assertIsolatedReceiptIdentity(identity, sourceSHA) {
  if (typeof identity?.runId !== 'string' || !/^[1-9][0-9]{0,19}$/.test(identity.runId)
    || !Number.isSafeInteger(identity.attempt) || identity.attempt < 1 || identity.attempt > 1000
    || typeof sourceSHA !== 'string' || !/^[a-f0-9]{40}$/.test(sourceSHA)) refuse();
}

// Conservative proof for the complete envelope, including simultaneous primary
// and cleanup failures. Every allowed numeric fact takes its longest possible
// safe-integer representation (even where its real bound is much smaller).
// Enum/key syntax excludes escaping; null/omitted values are always shorter.
export function isolatedReceiptMaximumBytes({ metrics, operations, codes, commands }) {
  const longest = values => {
    if (!values.length || values.some(x => !/^[A-Za-z0-9_.-]{1,64}$/.test(x))) refuse();
    return values.reduce((a, b) => a.length >= b.length ? a : b);
  };
  if (metrics.some(x => !/^[A-Za-z][A-Za-z0-9]{0,127}$/.test(x))) refuse();
  const failure = { stage: 'offline-edge', operation: longest(operations), code: longest(codes),
    command: longest(commands), exitCode: 255,
    facts: Object.fromEntries(metrics.map(key => [key, Number.MAX_SAFE_INTEGER])) };
  const bytes = Buffer.byteLength(JSON.stringify({ schemaVersion: 'permission-ci1-isolated-failure-v1',
    runId: '9'.repeat(20), attempt: 1000, sourceSHA: 'f'.repeat(40), failure,
    cleanupFailure: { ...failure, stage: 'cleanup' } }));
  if (bytes > ISOLATED_RECEIPT_MAX_BYTES) refuse();
  return bytes;
}

function outcome(ordinal, size = 0, value = null) {
  return { value, facts: { isolatedReceiptReadOrdinal: ordinal,
    isolatedReceiptBytes: Math.min(Number.isSafeInteger(size) && size >= 0 ? size : 0, ISOLATED_RECEIPT_MAX_BYTES + 1),
    isolatedReceiptBytesCapped: size > ISOLATED_RECEIPT_MAX_BYTES ? 1 : 0 } };
}
const same = (a, b) => ['dev', 'ino', 'uid', 'gid', 'mode', 'nlink', 'size', 'mtimeNs', 'ctimeNs']
  .every(key => a[key] === b[key]);
const safeFile = info => info.isFile() && !info.isSymbolicLink() && info.uid === 0n
  && !(info.mode & 0o077n) && info.nlink === 1n;
function safeParent(file) {
  if (!isAbsolute(file) || resolve(file) !== file) refuse();
  const path = dirname(file), info = lstatSync(path, { bigint: true });
  // The receipt itself must stay private. A root-owned readable directory is
  // safe against caller replacement and lets CI account for synthetic fixtures;
  // real runtime setup still creates its private directory with mode0700.
  if (process.platform !== 'linux' || !info.isDirectory() || info.isSymbolicLink() || info.uid !== 0n
    || (info.mode & 0o022n) || realpathSync(path) !== path) refuse();
  return info;
}
function boundSize(info) { return Number(info.size > BigInt(ISOLATED_RECEIPT_MAX_BYTES + 1) ? BigInt(ISOLATED_RECEIPT_MAX_BYTES + 1) : info.size); }

export function serializeIsolatedReceipt(value, identity, sourceSHA, validate) {
  assertIsolatedReceiptIdentity(identity, sourceSHA);
  validate(value, identity, sourceSHA);
  const bytes = Buffer.from(JSON.stringify(value));
  if (bytes.length > ISOLATED_RECEIPT_MAX_BYTES) refuse();
  return bytes;
}
export function writeIsolatedReceipt(file, value, identity, sourceSHA, validate) {
  const bytes = serializeIsolatedReceipt(value, identity, sourceSHA, validate), parent = safeParent(file);
  let fd;
  try {
    fd = openSync(file, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600);
    const before = fstatSync(fd, { bigint: true });
    if (!safeFile(before) || before.dev !== parent.dev || before.size !== 0n) refuse();
    writeFileSync(fd, bytes);
    const after = fstatSync(fd, { bigint: true });
    if (!safeFile(after) || after.dev !== before.dev || after.ino !== before.ino || after.size !== BigInt(bytes.length)
      || !same(after, lstatSync(file, { bigint: true })) || realpathSync(file) !== file) refuse();
    return bytes.length;
  } finally { if (fd !== undefined) closeSync(fd); }
}

// No readFileSync/parse-by-path: bounded fd reads, no-follow, and both fd/path
// identity checks prevent a replaced, linked, growing or unsafe file being used.
export function readIsolatedReceipt(file, identity, sourceSHA, validate) {
  let info, parent, fd, size = 0;
  try { assertIsolatedReceiptIdentity(identity, sourceSHA); }
  catch { return outcome(ISOLATED_RECEIPT_READ.BINDING); }
  try { info = lstatSync(file, { bigint: true }); size = boundSize(info); }
  catch (error) { return outcome(error.code === 'ENOENT' ? ISOLATED_RECEIPT_READ.MISSING : ISOLATED_RECEIPT_READ.IO); }
  try { parent = safeParent(file); }
  catch { return outcome(ISOLATED_RECEIPT_READ.UNSAFE, size); }
  try {
    if (!safeFile(info) || info.dev !== parent.dev || realpathSync(file) !== file) return outcome(ISOLATED_RECEIPT_READ.UNSAFE, size);
  } catch { return outcome(ISOLATED_RECEIPT_READ.UNSTABLE, size); }
  if (info.size > BigInt(ISOLATED_RECEIPT_MAX_BYTES)) return outcome(ISOLATED_RECEIPT_READ.OVERSIZED, size);
  try {
    fd = openSync(file, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
    const before = fstatSync(fd, { bigint: true });
    if (!safeFile(before) || !same(info, before)) return outcome(ISOLATED_RECEIPT_READ.UNSTABLE, size);
    const bytes = Buffer.alloc(ISOLATED_RECEIPT_MAX_BYTES + 1);
    let length = 0, read;
    while (length < bytes.length && (read = readSync(fd, bytes, length, bytes.length - length, length)) > 0) length += read;
    size = length;
    const after = fstatSync(fd, { bigint: true }), pathAfter = lstatSync(file, { bigint: true });
    if (!safeFile(after) || !same(before, after) || !same(after, pathAfter) || realpathSync(file) !== file
      || !same(parent, lstatSync(dirname(file), { bigint: true })) || BigInt(length) !== after.size)
      return outcome(ISOLATED_RECEIPT_READ.UNSTABLE, Math.max(size, boundSize(after)));
    if (length > ISOLATED_RECEIPT_MAX_BYTES) return outcome(ISOLATED_RECEIPT_READ.OVERSIZED, size);
    let value;
    try { value = JSON.parse(bytes.subarray(0, length).toString('utf8')); }
    catch { return outcome(ISOLATED_RECEIPT_READ.MALFORMED, size); }
    try { validate(value, identity, sourceSHA); }
    catch { return outcome(ISOLATED_RECEIPT_READ.BINDING, size); }
    return outcome(ISOLATED_RECEIPT_READ.VALID, size, value);
  } catch (error) {
    return outcome(['ENOENT', 'ELOOP'].includes(error.code) ? ISOLATED_RECEIPT_READ.UNSTABLE : ISOLATED_RECEIPT_READ.IO, size);
  } finally { if (fd !== undefined) { try { closeSync(fd); } catch { /* Read-only descriptor; preserve the classified outcome. */ } } }
}

export function recoverIsolatedError(file, identity, sourceSHA, original, validate, toError) {
  const receipt = readIsolatedReceipt(file, identity, sourceSHA, validate);
  if (receipt.value) {
    const inner = toError(receipt.value, identity, sourceSHA);
    inner.error.ci1Facts = { ...inner.error.ci1Facts, ...receipt.facts };
    return inner;
  }
  // Never turn a missing/refused receipt into an invented inner failure.
  original.ci1Facts = { ...original.ci1Facts, ...receipt.facts };
  return { operation: undefined, error: original };
}
