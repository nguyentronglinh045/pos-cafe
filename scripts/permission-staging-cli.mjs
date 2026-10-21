import { readFileSync, writeFileSync, realpathSync, statSync, openSync, closeSync, ftruncateSync, writeSync } from 'node:fs';
import { isAbsolute, resolve, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildStagingInventory, canonical, inventoryHash, stagingPreflight,
  stagingErrorCode, validateStagingManifest, validateStagingPrivateConfig,
  stagingSourceFingerprint } from './permission-staging.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = resolve(ROOT, '..', '..', 'pos-cafe-docs');
function requireInput(value) { if (!value) throw Error('STAGING_INPUT_REFUSED'); }
function absoluteExisting(path) { requireInput(typeof path === 'string' && isAbsolute(path)); return realpathSync(path); }
function readJson(path, maxBytes) {
  const actual = absoluteExisting(path);
  requireInput(statSync(actual).isFile() && statSync(actual).size <= maxBytes);
  const text = readFileSync(actual);
  requireInput(text.length <= maxBytes);
  return JSON.parse(text.toString('utf8'));
}
function outside(root, path) {
  const part = relative(root, path);
  return part !== '' && (part === '..' || part.startsWith('..\\') || part.startsWith('../') || isAbsolute(part));
}
function writeNew(path, value) {
  requireInput(typeof path === 'string' && isAbsolute(path));
  writeFileSync(path, JSON.stringify(value, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
}
function writeReceipt(fd, value) {
  const bytes = Buffer.from(JSON.stringify(value, null, 2) + '\n');
  ftruncateSync(fd, 0);
  let offset = 0;
  while (offset < bytes.length) {
    const written = writeSync(fd, bytes, offset, bytes.length - offset, offset);
    requireInput(written > 0); offset += written;
  }
}
export async function runStagingCli(argv, { clock, fetchImpl, attemptStore } = {}) {
 try {
  const [operation, ...args] = argv;
  const inventory = buildStagingInventory();
  if (operation === 'inventory' && args.length === 1) {
    writeNew(args[0], inventory);
    return { exitCode: 0, summary: { status: 'PASS', operation, stageCount: inventory.stageCount,
      requiredRows: inventory.requiredRows, coverageSha256: inventoryHash(inventory) } };
  } else if (operation === 'source' && args.length === 1) {
    const source = stagingSourceFingerprint();
    writeNew(args[0], source);
    return { exitCode: 0, summary: { status: 'PASS', operation, gitHead: source.gitHead,
      sourceFileCount: source.files.length, sourceFingerprintSha256: inventoryHash(source) } };
  } else if (operation === 'preflight' && args.length === 4) {
    const [manifestPath, configPath, expectedManifestSha256, receiptPath] = args;
    const manifest = readJson(manifestPath, 16384);
    validateStagingManifest(manifest, inventory, clock?.());
    const configRealPath = absoluteExisting(configPath);
    requireInput(outside(realpathSync(ROOT), configRealPath) && outside(realpathSync(DOCS), configRealPath));
    const privateConfig = readJson(configRealPath, 16384);
    validateStagingPrivateConfig(privateConfig, manifest.projectRef);
    requireInput(expectedManifestSha256 === inventoryHash(manifest));
    requireInput(typeof receiptPath === 'string' && isAbsolute(receiptPath));
    // Reserve evidence before contacting the backend; an existing receipt refuses
    // a repeated attempt with this evidence path. Never overwrite old evidence.
    const receiptFd = openSync(receiptPath, 'wx', 0o600);
    let receipt;
    try {
      writeReceipt(receiptFd, { status: 'STARTED', operation: 'READ_ONLY_PREFLIGHT',
        manifestSha256: expectedManifestSha256, startedUtc: new Date().toISOString() });
      try {
        receipt = await stagingPreflight({ manifest, inventory, privateConfig, expectedManifestSha256, clock, fetchImpl, attemptStore });
      } catch (error) {
        receipt = { status: 'REFUSED', errorCode: stagingErrorCode(error), manifestSha256: expectedManifestSha256,
          endedUtc: new Date().toISOString(), businessTestsRun: false, mutationReady: false };
      }
      writeReceipt(receiptFd, receipt);
    } finally { closeSync(receiptFd); }
    return { exitCode: receipt.status === 'PASS' ? 0 : 1, summary: receipt };
  } else throw Error('STAGING_INPUT_REFUSED');
} catch (error) {
  return { exitCode: 1, summary: { status: 'REFUSED', errorCode: stagingErrorCode(error) } };
 }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await runStagingCli(process.argv.slice(2));
  (result.exitCode ? console.error : console.log)(canonical(result.summary));
  process.exitCode = result.exitCode;
}
