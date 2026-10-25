// Task-owned OFFLINE successor preparation. No database/network/browser/apply client.
// The expired generateBootstrap entrypoint is deliberately never called.
import { readFileSync, writeFileSync, lstatSync, realpathSync, readdirSync } from 'node:fs';
import { resolve, dirname, join, isAbsolute, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  readSource, validateObservation, canonicalSqlFiles, collectSyntheticActivation,
  RAW_SQL_ORDER, hash,
} from '../../code/scripts/permission-staging-bootstrap.mjs';
import { renderBootstrapSql, renderReconcileSql, canonicalLf } from '../../code/scripts/permission-staging-bootstrap-sql.mjs';
import { stripTopLevelTransactions } from '../../code/scripts/permission-activation-steps.mjs';
import { ACTIVATION_SQL_ORDER } from '../../code/scripts/permission-activation-bundle.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const LOADED_HELPER_SHA256 = hash(readFileSync(fileURLToPath(import.meta.url)));
const HEX = /^[a-f0-9]{64}$/;
export const stable = value => JSON.stringify(value, (_key, item) => item && typeof item === 'object' && !Array.isArray(item)
  ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b))) : item);
const check = (value, code) => { if (!value) throw new Error(code); };
const same = (left, right) => stable(left) === stable(right);
const keys = (value, expected) => value && typeof value === 'object' && !Array.isArray(value)
  && Object.keys(value).sort().join(',') === expected.slice().sort().join(',');
const deepFreeze = value => { for (const item of Object.values(value)) if (item && typeof item === 'object') deepFreeze(item); return Object.freeze(value); };

// This is a NEW bounded owner-authorized phase. It does not reopen/reset an old
// window, claim, manifest, review, CI run or execution receipt.
export const PHASE_POLICY = deepFreeze({
  schemaVersion: 'permission-staging-setup-policy-v1',
  phaseId: 'permission-staging-setup-20261022-1700',
  projectRef: 'ineckiashpwloncxnbqx', forbiddenProjectRef: 'kfqjdfwxhkdwihjobpny',
  sourceRoot: 'D:/Workspace/pos-cafe-permission-ci-fix-20261022/code',
  sourceHead: 'b2e3122866f5b6108f026f381f4f12614c98027c',
  sourceFingerprint: 'b966736214d772b33ebcc37bf6d5ad8e8df79c861d09d877dc6db13ffd6758dd',
  canonicalSqlBundleSha256: 'efbd60e136525932704547f13ecccf4ff72e688402f178050502fb92fde68d34',
  mutationCutoffUtc: '2026-10-22T09:45:00.000Z', deadlineUtc: '2026-10-22T10:00:00.000Z',
  maxSqlBytes: 1_000_000,
  ownerAuthorization: {
    setupReference: 'USER_REPLY_call_f1764eba4eef4958b23d3c87a285418a:item0',
    deadlineReference: 'USER_REPLY_call_72a24f794f9941cab522370806009e17:item0',
  },
  reviewedPlan: {
    path: 'D:/Workspace/pos-cafe-docs/docs/implementation-log/permission-staging-setup-20261022/reviewed-plan01.md',
    sha256: '578d011590fd48d240b7223a55a217bfd98ea42dc8a5898be26f27905ceefdc9',
  },
  sourceInventory: {
    path: 'D:/Workspace/pos-cafe-docs/docs/implementation-log/permission-staging-setup-20261022/source-inventory01.json',
    sha256: 'fb1334feaa1d5393a524c32d7d3a7e5867e45a2321f3cd9c5db179119ee29efe',
  },
  predecessor: {
    bootstrapManifest: {
      path: 'D:/Workspace/pos-cafe-docs/docs/implementation-log/permission-release-20261022/bootstrap01/bootstrap.manifest.json',
      sha256: '789ca2430e6c38dc1d31f6ee165022a2f537d8a1550941fffb24d74872373204',
    },
    preflightClaim: {
      path: 'D:/Workspace/pos-cafe-docs/docs/implementation-log/permission-staging-20261021/remote-preflight01.claim.json',
      sha256: '3cd550a64bf676090ea3be7d277287173dbd4063f545a46577a5b3068957f766',
    },
  },
  scope: 'SCHEMA_RPC_RLS_ACL_HOOK_PUBLICATION_PRISTINE_ONLY',
  intendedTransport: 'TEMPORARY_STAGING_MCP_DATABASE_WRITE',
  excludedActions: ['ORIGINAL_DB', 'AUTH_SETTINGS', 'AUTH_USER_MUTATION', 'EDGE_DEPLOYMENT',
    'TENANT_AUTH_OBJECT_SEED', 'HEAVY_RUNTIME', 'CI', 'MAIN_PUSH'],
});

export function validatePolicy(policy, now = new Date()) {
  check(same(policy, PHASE_POLICY), 'STAGING_SUCCESSOR_POLICY_REFUSED');
  check(now instanceof Date && Number.isFinite(now.valueOf())
    && now.valueOf() < Date.parse(policy.mutationCutoffUtc), 'STAGING_MUTATION_ADMISSION_CLOSED');
}

export function readPinnedBytes(reference) {
  check(keys(reference, ['path', 'sha256']) && isAbsolute(reference.path) && HEX.test(reference.sha256), 'STAGING_PINNED_INPUT_REQUIRED');
  const item = lstatSync(reference.path);
  check(item.isFile() && !item.isSymbolicLink() && item.nlink === 1 && item.size <= 4 * 1024 ** 2, 'STAGING_PINNED_FILE_REFUSED');
  const bytes = readFileSync(reference.path);
  check(hash(bytes) === reference.sha256, 'STAGING_INPUT_HASH_MISMATCH');
  return bytes;
}
export const readPinned = reference => JSON.parse(readPinnedBytes(reference));

export function helperProvenance() {
  const files = ['prepare.mjs', 'prepare.test.mjs'].map(name => {
    const path = join(HERE, name), item = lstatSync(path);
    check(item.isFile() && !item.isSymbolicLink() && item.nlink === 1, 'STAGING_HELPER_FILE_REFUSED');
    const bytes = readFileSync(path);
    return { path, sha256: hash(bytes), bytes: bytes.length };
  });
  check(files[0].sha256 === LOADED_HELPER_SHA256, 'STAGING_HELPER_CHANGED_AFTER_LOAD');
  return { files, sha256: hash(JSON.stringify(files)),
    scope: 'TASK_OWNED_OFFLINE_SUCCESSOR_OUTSIDE_FROZEN_APPLICATION_CHECKOUT',
    b2CiValidatesThisTooling: false };
}

export function validateSource(source, inventory) {
  check(source?.head === PHASE_POLICY.sourceHead && inventory?.head === PHASE_POLICY.sourceHead, 'STAGING_SOURCE_HEAD_MISMATCH');
  check(source.sourceFingerprint === PHASE_POLICY.sourceFingerprint
    && inventory.sourceFingerprint === PHASE_POLICY.sourceFingerprint
    && hash(stable({ head: source.head, files: source.files })) === PHASE_POLICY.sourceFingerprint,
  'STAGING_SOURCE_FINGERPRINT_MISMATCH');
  check(Array.isArray(source.files) && source.files.length === 1106 && same(source.files, inventory.files), 'STAGING_SOURCE_SNAPSHOT_DRIFT');
  check(Array.isArray(source.rawSql) && source.rawSql.length === 28 && source.rawSql.every((file, index) =>
    file.path === RAW_SQL_ORDER[index] && hash(file.sql) === file.sha256 && Buffer.byteLength(file.sql) === file.bytes), 'STAGING_RAW_SQL_DRIFT');
  const rawFiles = source.rawSql.map(({ path, sha256, bytes }) => ({ path, sha256, bytes }));
  check(same(rawFiles, inventory.rawFiles), 'STAGING_RAW_SQL_INVENTORY_DRIFT');
  check(Array.isArray(source.controllerFiles) && source.controllerFiles.length === 4
    && same(source.controllerFiles, inventory.controllers), 'STAGING_CONTROLLER_INVENTORY_DRIFT');
  check([...rawFiles, ...source.controllerFiles].every(file => source.files.some(snapshot => same(snapshot, file))), 'STAGING_SOURCE_SNAPSHOT_DRIFT');
  const canonicalFiles = canonicalSqlFiles(source.rawSql);
  check(same(canonicalFiles, inventory.canonicalFiles)
    && hash(JSON.stringify(canonicalFiles)) === PHASE_POLICY.canonicalSqlBundleSha256
    && inventory.canonicalSqlBundleSha256 === PHASE_POLICY.canonicalSqlBundleSha256, 'STAGING_CANONICAL_SQL_DRIFT');
  const introspection = source.files.find(file => file.path === 'scripts/permission-staging-introspection.sql');
  check(introspection && typeof source.introspectionSql === 'string' && hash(source.introspectionSql) === introspection.sha256
    && Buffer.byteLength(source.introspectionSql) === introspection.bytes, 'STAGING_INTROSPECTION_DRIFT');
  return { rawFiles, canonicalFiles };
}

export async function prepareBundle({ source, inventory, observation, observationSha256, allowlist, allowlistRawSha256,
  policy, policyRawSha256, predecessorManifest, nonce, now = new Date() }) {
  validatePolicy(policy, now);
  check(HEX.test(policyRawSha256) && HEX.test(allowlistRawSha256), 'STAGING_PINNED_INPUT_REQUIRED');
  check(/^[a-f0-9]{32}$/.test(nonce) && nonce !== predecessorManifest?.binding?.nonce, 'STAGING_NEW_NONCE_REQUIRED');
  check(predecessorManifest?.binding?.sourceHead === '38a55aab775e1d70dba4b62d6658f41e28f8aef1'
    && predecessorManifest.binding.predecessorClaimSha256 === policy.predecessor.preflightClaim.sha256
    && predecessorManifest.binding.mutationCutoffUtc === '2026-10-22T03:15:00.000Z'
    && predecessorManifest.execution === 'NOT_RUN', 'STAGING_PREDECESSOR_BINDING_MISMATCH');
  const { rawFiles, canonicalFiles } = validateSource(source, inventory);
  const reviewed = validateObservation(observation, allowlist, observationSha256);
  const helper = helperProvenance();
  const rawSqlMap = new Map(source.rawSql.map(file => [file.path, file.sql]));
  const fragments = RAW_SQL_ORDER.slice(0, 16).map(path => ({ phase: 'baseline', path,
    sql: stripTopLevelTransactions(rawSqlMap.get(path)) }));
  fragments.push({ phase: 'prepare', path: RAW_SQL_ORDER[16], sql: stripTopLevelTransactions(rawSqlMap.get(RAW_SQL_ORDER[16])) });
  fragments.push(...await collectSyntheticActivation(source.rawSql));
  const expectedPaths = [...RAW_SQL_ORDER.slice(0, 17), ACTIVATION_SQL_ORDER[0], 'controller:employees.role-to-text',
    ...ACTIVATION_SQL_ORDER.slice(1), 'controller:legacy-teardown'];
  check(fragments.length === 30 && same(fragments.map(fragment => fragment.path), expectedPaths)
    && fragments.every((fragment, index) => fragment.phase === (index < 16 ? 'baseline' : index === 16 ? 'prepare' : 'activation')),
  'STAGING_FRAGMENT_ORDER_DRIFT');
  for (const fragment of fragments) fragment.sql = canonicalLf(fragment.sql);
  const binding = { projectRef: policy.projectRef, database: 'postgres', nonce, sourceHead: source.head,
    sourceFingerprint: source.sourceFingerprint, rawSqlBundleSha256: hash(JSON.stringify(rawFiles)),
    canonicalSqlBundleSha256: hash(JSON.stringify(canonicalFiles)), controllersSha256: hash(JSON.stringify(source.controllerFiles)),
    observationSha256, allowlistSha256: hash(stable(allowlist)), allowlistRawSha256,
    predecessorClaimSha256: policy.predecessor.preflightClaim.sha256,
    predecessorBootstrapManifestSha256: policy.predecessor.bootstrapManifest.sha256,
    phaseId: policy.phaseId, phasePolicyRawSha256: policyRawSha256, phasePolicyCanonicalSha256: hash(stable(policy)),
    successorHelperSha256: helper.sha256, mutationCutoffUtc: policy.mutationCutoffUtc, deadlineUtc: policy.deadlineUtc };
  const sql = renderBootstrapSql({ observation, catalog: reviewed.catalog, fragments, binding, introspectionSql: source.introspectionSql });
  check(Buffer.byteLength(sql) <= policy.maxSqlBytes, 'STAGING_SQL_SIZE_EXCEEDED');
  const reconcileSql = renderReconcileSql(binding);
  return { sql, reconcileSql, manifest: {
    schemaVersion: 'permission-staging-setup-bootstrap-manifest-v1', preparedAtUtc: now.toISOString(),
    preparation: 'OFFLINE_ONLY_NEW_SUCCESSOR_PHASE', execution: 'NOT_RUN',
    apply: 'BLOCKED_PENDING_TWO_SCOPE_EXACT_OUTPUT_AND_TRANSPORT_REVIEW',
    syntheticCollector: 'PLANNING_ONLY_NOT_DATABASE_EVIDENCE', binding,
    phasePolicy: policy, successorHelper: helper,
    applicationCi: { sourceHead: policy.sourceHead, inheritedHistoricalEvidenceOnly: true, validatesSuccessorTooling: false },
    projectBinding: reviewed.projectBinding, reviewReferences: reviewed.reviewReferences,
    rawFiles, canonicalFiles, controllers: source.controllerFiles,
    sourceSnapshot: { head: source.head, files: source.files, scope: 'ALL_TRACKED_PLUS_SIX_BOOTSTRAP_AND_INTROSPECTION_FILES' },
    fragments: fragments.map(({ phase, path, sql: body }) => ({ phase, path, sha256: hash(body), bytes: Buffer.byteLength(body) })),
    sql: { sha256: hash(sql), bytes: Buffer.byteLength(sql), newlines: 'LF', transforms: ['STRIP_OUTER_BEGIN_COMMIT', 'CRLF_TO_LF'] },
    reconcile: { sha256: hash(reconcileSql), bytes: Buffer.byteLength(reconcileSql), newlines: 'LF', transforms: ['CRLF_TO_LF'] },
    businessTestsRun: false, ready: false,
  } };
}

// Injectable filesystem exists only for focused offline tests; the CLI uses the
// real exclusive writer. A partial filesystem failure preserves every output.
export function writeOutputs(outputDirectory, result, io = { realpathSync, lstatSync, readdirSync, writeFileSync }) {
  check(isAbsolute(outputDirectory ?? ''), 'STAGING_ABSOLUTE_PATHS_REQUIRED');
  const output = io.realpathSync(outputDirectory), item = io.lstatSync(outputDirectory);
  const withinCode = relative(resolve(PHASE_POLICY.sourceRoot), output);
  check(item.isDirectory() && !item.isSymbolicLink()
    && (withinCode.startsWith('..\\') || withinCode.startsWith('../') || isAbsolute(withinCode)), 'STAGING_OUTPUT_DIRECTORY_REFUSED');
  check(io.readdirSync(output).length === 0, 'STAGING_OUTPUT_NOT_EMPTY');
  for (const [name, value] of [['bootstrap.sql', result.sql], ['reconcile.sql', result.reconcileSql],
    ['bootstrap.manifest.json', JSON.stringify(result.manifest, null, 2) + '\n']]) {
    io.writeFileSync(join(output, name), value, { flag: 'wx', mode: 0o600 });
  }
}

export async function main(inputPath, outputDirectory) {
  check(isAbsolute(inputPath ?? '') && isAbsolute(outputDirectory ?? ''), 'STAGING_ABSOLUTE_PATHS_REQUIRED');
  const inputBytes = readFileSync(inputPath), input = JSON.parse(inputBytes);
  check(keys(input, ['schemaVersion', 'projectRef', 'sourceFingerprint', 'policy', 'observation', 'allowlist', 'nonce'])
    && input.schemaVersion === 'permission-staging-setup-input-v1' && input.projectRef === PHASE_POLICY.projectRef
    && input.sourceFingerprint === PHASE_POLICY.sourceFingerprint, 'STAGING_INPUT_REFUSED');
  const policy = readPinned(input.policy); validatePolicy(policy);
  readPinnedBytes(policy.reviewedPlan);
  const inventory = readPinned(policy.sourceInventory), predecessorManifest = readPinned(policy.predecessor.bootstrapManifest);
  readPinned(policy.predecessor.preflightClaim);
  const observation = readPinned(input.observation), allowlist = readPinned(input.allowlist);
  const source = readSource(PHASE_POLICY.sourceRoot), helperBefore = helperProvenance();
  const result = await prepareBundle({ source, inventory, observation, observationSha256: input.observation.sha256,
    allowlist, allowlistRawSha256: input.allowlist.sha256, policy, policyRawSha256: input.policy.sha256,
    predecessorManifest, nonce: input.nonce });
  result.manifest.pinnedInputs = { input: { path: resolve(inputPath), sha256: hash(inputBytes) },
    policy: input.policy, observation: input.observation, allowlist: input.allowlist,
    sourceInventory: policy.sourceInventory, reviewedPlan: policy.reviewedPlan, predecessor: policy.predecessor };
  validateSource(readSource(PHASE_POLICY.sourceRoot), inventory);
  check(same(helperBefore, helperProvenance()), 'STAGING_HELPER_CHANGED_DURING_PREPARATION');
  check(hash(readFileSync(inputPath)) === hash(inputBytes), 'STAGING_INPUT_CHANGED_DURING_PREPARATION');
  for (const reference of [input.policy, input.observation, input.allowlist, policy.sourceInventory,
    policy.predecessor.bootstrapManifest, policy.predecessor.preflightClaim]) readPinned(reference);
  readPinnedBytes(policy.reviewedPlan);
  validatePolicy(policy); // Real wall clock immediately before the first output write.
  writeOutputs(outputDirectory, result);
  return { status: 'PREPARED_NOT_EXECUTED', sqlSha256: result.manifest.sql.sha256, sqlBytes: result.manifest.sql.bytes,
    helperSha256: result.manifest.successorHelper.sha256, applicationSourceHead: source.head };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { process.stdout.write(JSON.stringify(await main(process.argv[2], process.argv[3])) + '\n'); }
  catch (error) { process.stderr.write(JSON.stringify({ status: 'BLOCKED', code: /^STAGING_[A-Z_]+$/.test(error.message)
    ? error.message : 'STAGING_PREPARATION_FAILED' }) + '\n'); process.exitCode = 1; }
}
