import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { integrationPlan, mapBudgetInputs, custodyLifecyclePlan, VERSION, BASE_COMMIT, BASE_TREE, PERM_HASH,
  PROFILES, LIMITS, ERRORS, INPUT_REQUIREMENTS, REVIEWED_INPUTS, WRITER_CATALOG, WRITER_MAPPING,
  STAGE_MAPPING, CUSTODY_FIELDS, LIFECYCLE, RUNTIME_CONTRACTS, CLOSURE_LEDGER } from './permission-full-integration-plan.mjs';

// Serialized RAM fixtures only, serial test execution. Every fixture is <=256KiB;
// no filesystem, config/runtime imports, environment access or external effects.
const H = 'a'.repeat(64); const N = 'b'.repeat(32);
const sha = v => createHash('sha256').update(JSON.stringify(v)).digest('hex');
const clone = v => JSON.parse(JSON.stringify(v));
const json = v => { const s = JSON.stringify(v); assert.ok(Buffer.byteLength(s) <= LIMITS.inputBytes); return s; };
const unknown = owner => ({ owner, version: 'UNKNOWN', path: null, sha256: null, candidateSha256: null, covers: [] });
function bindings() {
  return ['A', 'B', 'L', 'P', 'R', 'D'].map(owner => ({ owner, ...(REVIEWED_INPUTS[owner] ?? { version: 'simulation-v1', path: `metadata/${owner}.json`, sha256: H, candidateSha256: H }),
    covers: owner === 'B' ? [] : [...INPUT_REQUIREMENTS[owner]] }));
}
function source(owner) { const b = bindings().find(b => b.owner === owner); return { owner, version: b.version, path: b.path, sha256: b.sha256, kind: 'SIMULATION' }; }
function budgetFixture() {
  return { schemaVersion: 'permission-full-integration-budget-v1', evidenceMode: 'SIMULATION', baseCommit: BASE_COMMIT, baseTree: BASE_TREE,
    bindings: bindings(), layout: { root: '/owned/task', loopMount: '/owned/task/data', loopBackingFile: '/owned/task/data.img', runtimeStorageId: 'CLOUD_RUNTIME' },
    storage: ['WINDOWS_C', 'WINDOWS_D', 'CLOUD_RUNTIME'].map(location => ({ storageId: location, location, hostId: location === 'CLOUD_RUNTIME' ? 'linux' : 'windows',
      physicalIdentity: location, root: location === 'WINDOWS_C' ? 'C:/private' : location === 'WINDOWS_D' ? 'D:/cipher' : '/owned', freeBytes: 100 * 1024 ** 3, source: source('D') })),
    retainedTask: { allocatedBytes: 0, allocationIds: [], source: source('D') },
    time: { totalMaxSeconds: 1800, phaseMaxSeconds: 300, profileWindows: PROFILES.map((profile, i) => ({ profile, startSeconds: i * 200, endSeconds: (i + 1) * 200 })), source: source('D') },
    resources: { cpuQuota: 300000, cpuPeriod: 100000, memoryPeakBytes: 1024, swapBytes: 0, pidsPeak: 10, maxHeavyEnvironments: 1, source: source('D') },
    writers: WRITER_CATALOG.map((w, i) => ({ ...clone(w), phases: [w.profile === 'GLOBAL' ? 'TASK_LIFETIME' : w.profile], allocationId: `allocation_${i}`,
      placement: { storageId: w.kind === 'ciphertext-D' ? 'WINDOWS_D' : w.kind === 'receiver-private-C' ? 'WINDOWS_C' : 'CLOUD_RUNTIME',
        path: w.kind === 'ciphertext-D' ? 'D:/cipher/run' : w.kind === 'receiver-private-C' ? 'C:/private/run' : `/owned/task/data/w${i}`, layer: ['ciphertext-D', 'receiver-private-C'].includes(w.kind) ? 'OUTSIDE' : 'LOOP' },
      compressedBytes: 10, expandedMaxBytes: 20, allocatedMaxBytes: 30, peakMaxBytes: 40, overlapGroup: 'RETAIN_THROUGH_ACK',
      startSeconds: w.profile === 'GLOBAL' ? 0 : PROFILES.indexOf(w.profile) * 200, endSeconds: 1800, durationMaxSeconds: 100,
      lifetime: 'THROUGH_ACK_OR_AUTHORIZED_CLEANUP', measurementOrBoundSource: source(w.owner), remainingUnknowns: [], sourceFields: clone(WRITER_MAPPING[i].sourceFields) })) };
}
function custodyFixture() {
  const binding = { repository: 'nguyentronglinh045/pos-cafe', repositoryId: 1263057386, runId: '12345678901234567890', attempt: 1, sourceSha: BASE_COMMIT,
    profile: 'SUPABASE_T04', nonce: N, permissionFingerprint: H, lockSha256: H, recipeSha256: H, artifactId: 99, cipherSha256: H, cipherBytes: 100,
    archiveSha256: H, manifestSha256: H, closureSha256: H, closedAt: '2026-10-19T00:03:00Z' };
  const bh = sha(CUSTODY_FIELDS.map(k => binding[k])); const commitment = sha(['permission-custody-ack-v1', ...CUSTODY_FIELDS.map(k => binding[k])]);
  const steps = LIFECYCLE.map((state, i) => ({ state, receiptSha256: H, bindingSha256: bh, at: `2026-10-19T00:${String(i).padStart(2, '0')}:00Z`,
    placement: [3, 6, 7].includes(i) ? 'PRIVATE_C' : i === 5 ? 'CIPHER_D' : null, mode: 'SIMULATION' }));
  return { schemaVersion: 'permission-full-integration-custody-v1', evidenceMode: 'SIMULATION', baseCommit: BASE_COMMIT, baseTree: BASE_TREE, binding, steps,
    ackQuery: { repositoryId: 1263057386, queriedSha: BASE_COMMIT, complete: true, mode: 'SIMULATION', statuses: [{ id: 2,
      context: `pos-perm-custody/${binding.runId}/1/6/${N}`, state: 'success', description: `sha256:${commitment}`,
      target_url: `https://github.com/nguyentronglinh045/pos-cafe/actions/runs/${binding.runId}`, creator: { id: 54500418, type: 'User' }, created_at: '2026-10-19T00:08:00Z' }] },
    retention: { bindingSha256: bh, allocationIds: ['retained_cipher', 'retained_private'], maximumBytes: 200, until: '2026-10-20T00:00:00Z', policy: 'THROUGH_ACK_OR_AUTHORIZED_CLEANUP' },
    now: '2026-10-19T00:11:00Z' };
}
function integrationFixture() {
  const offsets = { PG16_T01: 800, SUPABASE_T02: 1000, SUPABASE_T04: 1200 }; const counts = new Map();
  return { schemaVersion: VERSION, evidenceMode: 'SIMULATION', baseCommit: BASE_COMMIT, baseTree: BASE_TREE, bindings: bindings(),
    coverage: { pinCaseIds: Array.from({ length: 19 }, (_, i) => `TC-PIN-${String(i + 1).padStart(2, '0')}`), pinManifestSha256: H, pinIdentitiesSha256: H,
      permCases: 60, permOccurrences: 726, permManifestSha256: PERM_HASH, tc53Stages: ['rollback-additive-database', 'rollback-preflight-database', 'rollback-recovery-database'] },
    stages: clone(STAGE_MAPPING), run: { workflowRunId: '12345678901234567890', attempt: 1, nonce: N,
      executions: STAGE_MAPPING.map((s, i) => ({ ...s, stageExecutionRunId: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}` })) },
    backends: STAGE_MAPPING.filter(s => s.runtimeProfile !== 'STATIC').map(s => { const n = counts.get(s.runtimeProfile) ?? 0; counts.set(s.runtimeProfile, n + 1);
      return { stage: s.stage, runtimeProfile: s.runtimeProfile, backendId: `${s.runtimeProfile}_backend`, storageId: `${s.runtimeProfile}_volume`, startSeconds: offsets[s.runtimeProfile] + n * 10, endSeconds: offsets[s.runtimeProfile] + n * 10 + 10 }; }),
    budget: budgetFixture(), custody: custodyFixture() };
}
function safe(r) {
  assert.equal(r.contractVersion, 'permission-main-prep-prd-v1'); assert.equal(r.taskId, 'D0'); assert.equal(r.valid, false); assert.equal(r.authentication, 'NOT_PROVEN');
  for (const k of ['execution', 'runtimeAdmission', 'fullGate', 'custodyObserved']) assert.equal(r[k], 'NOT_RUN');
  assert.equal(r.intentionalCleanupAllowed, false); assert.equal(r.effects, 0); assert.ok(Object.isFrozen(r));
  assert.deepEqual(r.runtimeBinding, { runId: null, attempt: null, profile: null, stage: null, nonce: null, backendIdentity: null });
  assert.ok(r.errors.every(e => ERRORS.includes(e.code))); assert.ok(Buffer.byteLength(JSON.stringify(r)) < 1024 * 1024);
  return r;
}
function stop(api, fixture, mutate, code) { mutate(fixture); const r = safe(api(json(fixture))); assert.equal(r.modelDecision, 'STOP'); if (code) assert.ok(r.errors.some(e => e.code === `INTEGRATION_${code}`), JSON.stringify(r.errors)); return r; }

test('D0 main: 134 rows preserve B identities/owners, backing once, all model results remain non-actual', () => {
  const r = safe(mapBudgetInputs(json(budgetFixture()))); assert.equal(r.modelDecision, 'MATCH'); assert.equal(r.mappedDeclarations.writers.length, 134);
  // Independently transcribed B03 catalog oracle, generated from B03 text (not
  // importing or running it). Prevent a changed implementation and fixture from
  // silently agreeing on a dropped/reassigned writer.
  assert.equal(sha(WRITER_CATALOG), '0156c9374e13ae867bd180d5b88caa84eade5bf619cee6cfee58f0022cbe5340');
  assert.deepEqual(r.mappedDeclarations.writers.map(({ writerId, profile, kind, owner }) => ({ writerId, profile, kind, owner })), WRITER_CATALOG);
  assert.equal(r.accounting.globalMaxBytes, LIMITS.loopBytes + 80); assert.equal(r.accounting.loopContentMaxBytes, 132 * 40);
  assert.equal(r.accounting.technicalQuotaEnforced, false); assert.equal(r.mappedDeclarations.dependencies.every(d => d.status === 'BOUNDED'), true);
  for (const p of ['STATIC', 'PIN_IDENTITY', 'SUPABASE_T04']) assert.equal(r.mappedDeclarations.writers.find(w => w.writerId === `${p}_DB-data-WAL-reset`).owner, p === 'STATIC' ? 'D' : p.startsWith('PIN') ? 'P' : 'R');
});
test('D0 initial: reviewed provenance cannot fill missing P/R or unknown maxima', () => {
  const x = budgetFixture(); x.evidenceMode = 'PLAN_ONLY'; x.bindings = x.bindings.map(b => ['P', 'R', 'D'].includes(b.owner) ? unknown(b.owner) : { ...b, covers: [] }); x.writers = [];
  const r = safe(mapBudgetInputs(json(x))); assert.equal(r.modelDecision, 'STOP'); assert.equal(r.mappedDeclarations.writers.length, 134);
  assert.ok(r.missingInputs.some(m => m.owner === 'P')); assert.ok(r.missingInputs.some(m => m.owner === 'R')); assert.equal(r.accounting.globalMaxBytes, null);
  assert.ok(r.mappedDeclarations.dependencies.every(d => d.status === 'UNKNOWN')); assert.equal(r.mappedDeclarations.writers[0].peakMaxBytes, null);
});
test('D0 integration: exact 27 tuples retain two taxonomies, 19 T04, coverage and open closure ledger', () => {
  const r = safe(integrationPlan(json(integrationFixture()))); assert.equal(r.modelDecision, 'MATCH'); assert.equal(r.expectedStages.length, 27);
  // Canonical manifest567 stage/profile tuples plus runtimepolicy mapping,
  // independently generated from text by PowerShell, not this module.
  assert.equal(sha([...STAGE_MAPPING].sort((a, b) => a.stage < b.stage ? -1 : a.stage > b.stage ? 1 : 0)), '2ef42e7ec130b7f8372cbc60b9cf4ecbf9572f1b366194e7fcd6f827c49c3b72');
  assert.equal(r.expectedStages.filter(s => s.runtimeProfile === 'SUPABASE_T04').length, 19); assert.equal(r.expectedStages.filter(s => s.runtimeProfile === 'STATIC').length, 4);
  assert.equal(r.expectedStages.find(s => s.stage === 'rollback-preflight-database').permissionProfile, 'transition'); assert.ok(r.closureLedger.every(r => r.actualStatus === 'NOT_RUN'));
});
test('D0 custody: exact17 fields, lifecycle simulation, latest ACK and retention never permit cleanup', () => {
  const r = safe(custodyLifecyclePlan(json(custodyFixture()))); assert.equal(r.modelDecision, 'MATCH'); assert.equal(r.custodyFields.length, 17); assert.equal(r.lifecycle.length, 11);
  assert.equal(r.actualAckVerified, false); assert.equal(r.simulatedAckStatusId, 2);
});
test('D0 security: primitive interface never touches getters, proxy traps, coercions or adapters', () => {
  let calls = 0; const hostile = { get evidenceMode() { calls++; throw Error('secret'); }, toString() { calls++; throw Error('secret'); } };
  const proxy = new Proxy({}, { get() { calls++; throw Error('secret'); }, getPrototypeOf() { calls++; throw Error('secret'); }, ownKeys() { calls++; throw Error('secret'); } });
  for (const api of [integrationPlan, mapBudgetInputs, custodyLifecyclePlan]) for (const x of [hostile, proxy, () => { calls++; }, null, 1, Symbol('private'), new String('{}')]) {
    const r = safe(api(x)); assert.equal(r.modelDecision, 'STOP'); assert.equal(r.errors[0].code, 'INTEGRATION_UNSAFE_INPUT'); assert.equal(JSON.stringify(r).includes('secret'), false);
  }
  assert.equal(calls, 0);
});
test('D0 JSON: malformed, decoded duplicate keys, forbidden keys and node/depth/byte limits', () => {
  for (const api of [integrationPlan, mapBudgetInputs, custodyLifecyclePlan]) {
    for (const input of ['', '{', '[1,]', '{"a":1,"\\u0061":2}', '{"constructor":1}', '{"__proto__":1}', '{"n":9007199254740992}', '{"n":-0}', '{"n":1.5}', 'true false', '"bad\\x"']) assert.equal(safe(api(input)).modelDecision, 'STOP');
    assert.equal(api('['.repeat(26) + 'null' + ']'.repeat(26)).errors[0].code, 'INTEGRATION_INPUT_LIMIT');
    assert.equal(api(' '.repeat(262145)).errors[0].code, 'INTEGRATION_INPUT_LIMIT');
    assert.equal(api(' '.repeat(262144)).errors[0].code, 'INTEGRATION_JSON');
    assert.equal(api('[' + '0,'.repeat(24001) + '0]').errors[0].code, 'INTEGRATION_INPUT_LIMIT');
  }
});
test('D0 schema: unknown/missing fields and non-string sort elements yield finite errors', () => {
  stop(integrationPlan, integrationFixture(), x => { x.commandAdapter = '/bin/sh'; }, 'SCHEMA');
  stop(integrationPlan, integrationFixture(), x => { delete x.coverage; }, 'SCHEMA');
  stop(integrationPlan, integrationFixture(), x => { x.coverage.pinCaseIds[0] = {}; }, 'SCHEMA');
  stop(mapBudgetInputs, budgetFixture(), x => { x.quotaEnforced = true; }, 'SCHEMA');
  stop(custodyLifecyclePlan, custodyFixture(), x => { x.binding.extra = 'untrusted'; }, 'SCHEMA');
});
test('D0 source: A/B/L pins, version/hash/base drift, D0 owner and wrong source mapping are refused', () => {
  for (const owner of ['A', 'B', 'L']) for (const field of ['version', 'sha256', 'candidateSha256']) stop(mapBudgetInputs, budgetFixture(), x => { x.bindings.find(b => b.owner === owner)[field] = field === 'version' ? 'stale-v0' : 'c'.repeat(64); }, 'SOURCE');
  stop(integrationPlan, integrationFixture(), x => { x.baseTree = '0'.repeat(40); }, 'SOURCE');
  stop(mapBudgetInputs, budgetFixture(), x => { x.bindings.find(b => b.owner === 'D').owner = 'D0'; }, 'SCHEMA');
  stop(mapBudgetInputs, budgetFixture(), x => { x.writers[0].measurementOrBoundSource.version = 'stale'; }, 'SOURCE');
  stop(mapBudgetInputs, budgetFixture(), x => { x.writers[0].sourceFields = ['R.wrong']; }, 'WRITER');
  const r = stop(mapBudgetInputs, budgetFixture(), x => { x.writers.find(w => w.owner === 'A').measurementOrBoundSource.kind = 'BOUND'; }, 'BOUND');
  assert.equal(r.mappedDeclarations.dependencies.find(d => d.owner === 'A').status, 'UNKNOWN');
});
test('D0 writers: removed/duplicated writer, unknown max and absent retained allocation cannot pass', () => {
  stop(mapBudgetInputs, budgetFixture(), x => { x.writers.pop(); }, 'WRITER');
  stop(mapBudgetInputs, budgetFixture(), x => { x.writers.push(clone(x.writers[0])); }, 'WRITER');
  stop(mapBudgetInputs, budgetFixture(), x => { x.writers[100].peakMaxBytes = null; }, 'BOUND');
  stop(mapBudgetInputs, budgetFixture(), x => { x.retainedTask.allocatedBytes = null; }, 'BOUND');
  stop(mapBudgetInputs, budgetFixture(), x => { x.retainedTask.allocationIds = null; }, 'MISSING_INPUT');
  stop(mapBudgetInputs, budgetFixture(), x => { x.retainedTask.allocatedBytes = 1; }, 'PLACEMENT');
});
test('D0 budget: overflow, outside writers, loop capacity and backing cannot be hidden or counted twice', () => {
  stop(mapBudgetInputs, budgetFixture(), x => { const w = x.writers.find(w => w.kind === 'ciphertext-D'); w.peakMaxBytes = LIMITS.outsideBytes + 1; }, 'BUDGET');
  stop(mapBudgetInputs, budgetFixture(), x => { x.writers[0].peakMaxBytes = LIMITS.loopBytes; }, 'BUDGET');
  stop(mapBudgetInputs, budgetFixture(), x => { x.writers[0].placement = { storageId: 'CLOUD_RUNTIME', path: x.layout.loopBackingFile, layer: 'OUTSIDE' }; }, 'PLACEMENT');
  stop(mapBudgetInputs, budgetFixture(), x => { x.writers[1].allocationId = x.writers[0].allocationId; }, 'ALLOCATION');
  stop(mapBudgetInputs, budgetFixture(), x => { x.retainedTask.allocationIds = [x.writers[0].allocationId]; }, 'ALLOCATION');
  stop(mapBudgetInputs, budgetFixture(), x => { x.writers[0].peakMaxBytes = Number.MAX_SAFE_INTEGER; x.writers[1].peakMaxBytes = Number.MAX_SAFE_INTEGER; }, 'BOUND');
});
test('D0 placement: private C/cipher D, canonical aliases, actual-volume reserve and distinct physical storage', () => {
  stop(mapBudgetInputs, budgetFixture(), x => { x.writers.find(w => w.kind === 'receiver-private-C').placement = { storageId: 'WINDOWS_D', path: 'D:/cipher/private', layer: 'OUTSIDE' }; }, 'PLACEMENT');
  stop(mapBudgetInputs, budgetFixture(), x => { x.writers[0].placement.path = '/owned/task/data/../escape'; }, 'PLACEMENT');
  stop(mapBudgetInputs, budgetFixture(), x => { x.writers[0].placement.path = 'C:/private/file:ads'; }, 'PLACEMENT');
  stop(mapBudgetInputs, budgetFixture(), x => { x.storage[1].physicalIdentity = x.storage[0].physicalIdentity; }, 'ALLOCATION');
  stop(mapBudgetInputs, budgetFixture(), x => { x.storage[2].freeBytes = LIMITS.hostReserveBytes + LIMITS.loopBytes - 1; }, 'BUDGET');
  const x = budgetFixture(); x.storage[2].freeBytes = LIMITS.hostReserveBytes + LIMITS.loopBytes; assert.equal(mapBudgetInputs(json(x)).modelDecision, 'MATCH');
});
test('D0 Windows device components: placement, storage root and portable metadata reject DOS aliases', () => {
  // Each starts from the independent canonical MATCH control, so a different
  // missing source/budget input cannot conceal a broken device-name guard.
  const names = ['NUL', 'nul.json', 'CoN', 'CON.logs', 'PRN', 'aUx.log', 'COM1', 'cOm9.bin', 'LPT1', 'lPt9.log',
    'COM¹', 'COM².log', 'LPT³.dat', 'CONIN$', 'conout$.log', 'CLOCK$', 'NuL .json'];
  for (const name of names) stop(mapBudgetInputs, budgetFixture(), x => {
    x.writers.find(w => w.kind === 'receiver-private-C').placement.path = `C:/private/${name}`;
  }, 'PLACEMENT');
  stop(mapBudgetInputs, budgetFixture(), x => { x.writers.find(w => w.kind === 'ciphertext-D').placement.path = 'D:/cipher/CON/result.json'; }, 'PLACEMENT');
  stop(mapBudgetInputs, budgetFixture(), x => {
    x.storage.find(s => s.location === 'WINDOWS_D').root = 'D:/CON';
    x.writers.find(w => w.kind === 'ciphertext-D').placement.path = 'D:/CON/run';
  }, 'PLACEMENT');
  for (const path of ['metadata/NUL.json', 'metadata/aUx/report.json', 'metadata/lPt9.log']) stop(mapBudgetInputs, budgetFixture(), x => {
    x.bindings.find(b => b.owner === 'P').path = path;
    for (const w of x.writers.filter(w => w.owner === 'P')) w.measurementOrBoundSource.path = path;
  }, 'SCHEMA');
  const x = budgetFixture();
  x.writers.find(w => w.kind === 'receiver-private-C').placement.path = 'C:/private/NULL.json';
  x.storage.find(s => s.location === 'WINDOWS_D').root = 'D:/CONNECTION';
  x.writers.find(w => w.kind === 'ciphertext-D').placement.path = 'D:/CONNECTION/CONIFER/result.json';
  x.bindings.find(b => b.owner === 'P').path = 'metadata/COM0.json';
  for (const w of x.writers.filter(w => w.owner === 'P')) w.measurementOrBoundSource.path = 'metadata/COM0.json';
  x.writers[0].placement.path = '/owned/task/data/NUL'; // a normal Linux basename
  assert.equal(safe(mapBudgetInputs(json(x))).modelDecision, 'MATCH');
});
test('D0 time/resources: missing bound, profile overlap, retained lifetime and fixed caps', () => {
  stop(mapBudgetInputs, budgetFixture(), x => { x.time.totalMaxSeconds = null; }, 'BOUND');
  stop(mapBudgetInputs, budgetFixture(), x => { x.time.totalMaxSeconds = 1801; }, 'TIME');
  stop(mapBudgetInputs, budgetFixture(), x => { x.time.profileWindows[1].startSeconds = 0; }, 'TIME');
  stop(mapBudgetInputs, budgetFixture(), x => { x.writers[0].endSeconds = 1801; }, 'TIME');
  stop(mapBudgetInputs, budgetFixture(), x => { x.resources.memoryPeakBytes = LIMITS.memoryBytes; }, 'RESOURCE');
  stop(mapBudgetInputs, budgetFixture(), x => { x.resources.maxHeavyEnvironments = 2; }, 'RESOURCE');
});
test('D0 coverage: no promotion for missing P/R, PIN18, PERM725, stage26 or TC53 two', () => {
  const r = stop(integrationPlan, integrationFixture(), x => { x.bindings = x.bindings.map(b => ['P', 'R'].includes(b.owner) ? unknown(b.owner) : b); x.budget = null; }, 'MISSING_INPUT');
  assert.ok(r.missingInputs.some(m => m.owner === 'P')); assert.ok(r.missingInputs.some(m => m.owner === 'R'));
  stop(integrationPlan, integrationFixture(), x => { x.coverage.pinCaseIds.pop(); }, 'COVERAGE');
  stop(integrationPlan, integrationFixture(), x => { x.coverage.permOccurrences = 725; }, 'COVERAGE');
  stop(integrationPlan, integrationFixture(), x => { x.stages.pop(); }, 'STAGE');
  stop(integrationPlan, integrationFixture(), x => { x.coverage.tc53Stages.pop(); }, 'COVERAGE');
  stop(integrationPlan, integrationFixture(), x => { x.stages[0].runtimeProfile = 'SUPABASE_T04'; }, 'STAGE');
});
test('D0 run IDs: UUID is not custody runId; decimal is not stage execution UUID; all tuples bind', () => {
  stop(integrationPlan, integrationFixture(), x => { x.run.workflowRunId = x.run.executions[0].stageExecutionRunId; }, 'RUN_ID');
  stop(integrationPlan, integrationFixture(), x => { x.run.workflowRunId = '0123'; }, 'RUN_ID');
  stop(integrationPlan, integrationFixture(), x => { x.run.executions[0].stageExecutionRunId = x.run.workflowRunId; }, 'RUN_ID');
  stop(integrationPlan, integrationFixture(), x => { x.run.executions[1].stageExecutionRunId = x.run.executions[0].stageExecutionRunId; }, 'RUN_ID');
  stop(integrationPlan, integrationFixture(), x => { x.custody.binding.runId = '999'; }, 'CUSTODY');
});
test('D0 backend: candidate identity kept but transition/rollback swapped storage still STOP; service overlap STOP', () => {
  for (const stage of ['transition-database', 'rollback-preflight-database', 'rollback-recovery-database']) stop(integrationPlan, integrationFixture(), x => { x.backends.find(b => b.stage === stage).storageId = 'new_unowned_volume'; }, 'BACKEND');
  stop(integrationPlan, integrationFixture(), x => { x.backends.find(b => b.stage === 'identity-database').startSeconds = 100; }, 'BACKEND');
  stop(integrationPlan, integrationFixture(), x => { for (const b of x.backends) { b.startSeconds += 500; b.endSeconds += 500; } }, 'TIME');
  stop(integrationPlan, integrationFixture(), x => { x.backends.pop(); }, 'MISSING_INPUT');
});
test('D0 custody boundaries:17 immutable fields, cipher cap, closedAt, privacy, ordered member closure', () => {
  stop(custodyLifecyclePlan, custodyFixture(), x => { x.binding.runId = '00000000-0000-4000-8000-000000000001'; }, 'CUSTODY');
  stop(custodyLifecyclePlan, custodyFixture(), x => { x.binding.cipherBytes = 268435457; }, 'CUSTODY');
  stop(custodyLifecyclePlan, custodyFixture(), x => { x.steps.splice(7, 1); }, 'CUSTODY');
  stop(custodyLifecyclePlan, custodyFixture(), x => { x.steps[6].placement = 'CIPHER_D'; }, 'PLACEMENT');
  stop(custodyLifecyclePlan, custodyFixture(), x => { x.steps[3].at = '2026-10-19T00:03:01Z'; }, 'CUSTODY');
  stop(custodyLifecyclePlan, custodyFixture(), x => { x.steps[7].bindingSha256 = 'c'.repeat(64); }, 'CUSTODY');
});
test('D0 synthetic: PLAN_ONLY cannot treat simulation statuses/receipts as authenticated observed ACK', () => {
  stop(custodyLifecyclePlan, custodyFixture(), x => { x.evidenceMode = 'PLAN_ONLY'; }, 'CUSTODY');
  stop(custodyLifecyclePlan, custodyFixture(), x => { x.ackQuery.mode = 'PLAN_ONLY'; }, 'ACK');
  const x = custodyFixture(); x.binding = null; x.steps = []; x.ackQuery = null; x.retention = null; assert.equal(safe(custodyLifecyclePlan(json(x))).modelDecision, 'STOP');
});
test('D0 ACK: owner/User, complete exact-SHA query, stale source and post-close time mandatory', () => {
  stop(custodyLifecyclePlan, custodyFixture(), x => { x.ackQuery.complete = false; }, 'ACK');
  stop(custodyLifecyclePlan, custodyFixture(), x => { x.ackQuery.queriedSha = 'c'.repeat(40); }, 'ACK');
  stop(custodyLifecyclePlan, custodyFixture(), x => { x.ackQuery.statuses[0].creator.id = 1; }, 'ACK');
  stop(custodyLifecyclePlan, custodyFixture(), x => { x.ackQuery.statuses[0].creator.type = 'Bot'; }, 'ACK');
  stop(custodyLifecyclePlan, custodyFixture(), x => { x.ackQuery.statuses[0].created_at = '2026-10-19T00:02:00Z'; }, 'ACK');
  stop(custodyLifecyclePlan, custodyFixture(), x => { x.ackQuery.statuses[0].description = 'sha256:' + 'c'.repeat(64); }, 'ACK');
});
test('D0 ACK latest case-insensitive context defeats old success; duplicate identities are refused', () => {
  stop(custodyLifecyclePlan, custodyFixture(), x => { const newer = clone(x.ackQuery.statuses[0]); newer.id = 3; newer.context = newer.context.toUpperCase(); newer.state = 'failure'; x.ackQuery.statuses.unshift(newer); }, 'ACK');
  stop(custodyLifecyclePlan, custodyFixture(), x => { const newer = clone(x.ackQuery.statuses[0]); newer.id = 3; newer.creator.id = 1; x.ackQuery.statuses.unshift(newer); }, 'ACK');
  stop(custodyLifecyclePlan, custodyFixture(), x => { x.ackQuery.statuses.push(clone(x.ackQuery.statuses[0])); }, 'ACK');
  const x = custodyFixture(); x.ackQuery.statuses[0].context = x.ackQuery.statuses[0].context.toUpperCase(); assert.equal(custodyLifecyclePlan(json(x)).modelDecision, 'MATCH');
});
test('D0 retention: no deletion capability, missing/short/stale retention STOP', () => {
  stop(custodyLifecyclePlan, custodyFixture(), x => { x.retention = null; }, 'MISSING_INPUT');
  stop(custodyLifecyclePlan, custodyFixture(), x => { x.retention.maximumBytes = 1; }, 'RETENTION');
  stop(custodyLifecyclePlan, custodyFixture(), x => { x.retention.until = '2026-10-18T00:00:00Z'; }, 'RETENTION');
  stop(custodyLifecyclePlan, custodyFixture(), x => { x.intentionalCleanupAllowed = true; }, 'SCHEMA');
});
test('D0 obligations: runtime special fixtures, topology, aliases, norbind and independent gate owners remain explicit', () => {
  assert.match(RUNTIME_CONTRACTS.PIN_IDENTITY, /MUST-BE-ABSENT/); assert.match(RUNTIME_CONTRACTS.PIN_CANARY, /CLI_16_EMPTY_SEED_FILE/);
  assert.match(RUNTIME_CONTRACTS.PG16_T01, /observerOnly/); assert.match(RUNTIME_CONTRACTS.SUPABASE_T02, /PG17/); assert.equal(RUNTIME_CONTRACTS.topology.length, 12);
  assert.ok(RUNTIME_CONTRACTS.rootMapping.some(s => s.includes('DEVICE_INODE'))); assert.ok(RUNTIME_CONTRACTS.rootMapping.includes('BindPaths=root:root:norbind'));
  assert.ok(CLOSURE_LEDGER.some(r => r.requiredGate === 'FINAL_EVC')); assert.ok(CLOSURE_LEDGER.some(r => r.requiredGate === 'FINAL_SEC'));
  assert.ok(Object.isFrozen(WRITER_MAPPING[0].sourceFields));
});

test('D0 safe snapshot: missing live P/R and actual bounds remain STOP in PLAN_ONLY', () => {
  const b = budgetFixture(); b.evidenceMode = 'PLAN_ONLY'; b.bindings = b.bindings.map(v => ['D', 'P', 'R'].includes(v.owner) ? unknown(v.owner) : { ...v, covers: [] });
  b.writers = []; b.layout = { root: null, loopMount: null, loopBackingFile: null, runtimeStorageId: null };
  b.storage = ['WINDOWS_C', 'WINDOWS_D', 'CLOUD_RUNTIME'].map(location => ({ storageId: location, location, hostId: null, physicalIdentity: null, root: null, freeBytes: null, source: null }));
  b.retainedTask = { allocatedBytes: null, source: null, allocationIds: null }; b.time = { totalMaxSeconds: null, phaseMaxSeconds: null, profileWindows: null, source: null };
  b.resources.memoryPeakBytes = null; b.resources.pidsPeak = null; b.resources.source = null;
  const custody = { schemaVersion: 'permission-full-integration-custody-v1', evidenceMode: 'PLAN_ONLY', baseCommit: BASE_COMMIT, baseTree: BASE_TREE,
    binding: null, steps: [], ackQuery: null, retention: null, now: '2026-10-19T00:00:00Z' };
  const input = { schemaVersion: VERSION, evidenceMode: 'PLAN_ONLY', baseCommit: BASE_COMMIT, baseTree: BASE_TREE, bindings: b.bindings,
    coverage: null, stages: [], run: null, backends: [], budget: b, custody };
  const result = safe(integrationPlan(json(input))); assert.equal(result.modelDecision, 'STOP'); assert.equal(result.mappedBudget.mappedDeclarations.writers.length, 134);
  assert.ok(result.missingInputs.some(m => m.owner === 'P')); assert.ok(result.missingInputs.some(m => m.owner === 'R'));
  assert.ok(result.mappedBudget.mappedDeclarations.dependencies.every(d => d.status === 'UNKNOWN'));
  // Console is only test-runner output, captured by the authorized shell into
  // safe artifacts. This is a declaration snapshot, not execution evidence.
  console.log('D0_SAFE_RECEIPT ' + JSON.stringify({ schemaVersion: 'permission-full-integration-safe-snapshot-v1', input, result }));
});
