import test from 'node:test';
import assert from 'node:assert/strict';
import { assessBudget, initialBudgetInput, LIMITS, PROFILES, WRITER_CATALOG, planData, PlanError, PLAN_ERRORS } from './permission-full-budget-plan.mjs';

function fixture() {
  const x = initialBudgetInput(); x.evidenceMode = 'SIMULATION';
  const source = owner => ({ owner, version: 'fixture-v1', path: 'synthetic-bounds.json', sha256: 'a'.repeat(64), kind: 'SIMULATION' });
  for (const d of x.dependencies) Object.assign(d, { status: 'BOUNDED', version: 'fixture-v1', sha256: 'a'.repeat(64), covers: [...d.required] });
  x.layout = { root: '/var/tmp/pos-permission-full-123-1', loopMount: '/var/tmp/pos-permission-full-123-1/data', loopBackingFile: '/var/tmp/pos-permission-full-123-1/data.img', runtimeStorageId: 'CLOUD_RUNTIME' };
  for (const s of x.storage) Object.assign(s, { hostId: s.location === 'CLOUD_RUNTIME' ? 'github-host' : 'windows-host', physicalIdentity: s.storageId,
    root: s.location === 'WINDOWS_C' ? 'C:/task' : s.location === 'WINDOWS_D' ? 'D:/task' : '/var/tmp', freeBytes: 100 * 1024 ** 3, source: source('D') });
  x.retainedTask = { allocatedBytes: 123456, source: source('D'), allocationIds: ['historical'] };
  x.time = { totalMaxSeconds: 100, phaseMaxSeconds: 20, profileWindows: PROFILES.map((profile, i) => ({ profile, startSeconds: i * 10, endSeconds: (i + 1) * 10 })), source: source('D') };
  Object.assign(x.resources, { memoryPeakBytes: 1024, pidsPeak: 1, source: source('D') });
  for (const [i, w] of x.writers.entries()) {
    const store = w.kind === 'receiver-private-C' ? 'WINDOWS_C' : w.profile === 'GLOBAL' ? 'WINDOWS_D' : 'CLOUD_RUNTIME';
    const root = store === 'WINDOWS_C' ? 'C:/task' : store === 'WINDOWS_D' ? 'D:/task' : x.layout.loopMount;
    Object.assign(w, { allocationId: `allocation-${i}`, placement: { storageId: store, path: `${root}/writer-${i}`, layer: store === 'CLOUD_RUNTIME' ? 'LOOP' : 'OUTSIDE' },
      compressedBytes: 10, expandedMaxBytes: 10, allocatedMaxBytes: 10, peakMaxBytes: 10, overlapGroup: 'all-retained',
      startSeconds: 0, endSeconds: 100, durationMaxSeconds: 100, measurementOrBoundSource: source(w.owner), remainingUnknowns: [] });
  }
  assert.ok(Buffer.byteLength(JSON.stringify(x)) <= LIMITS.inputBytes);
  return x;
}
const has = (x, code) => assessBudget(x).reasons.some(r => r.code === code);

test('independent missing-input matrix covers all profiles/writers and cannot admit unknowns', () => {
  const input = initialBudgetInput(); const r = assessBudget(input);
  assert.equal(r.planDecision, 'STOP'); assert.equal(r.totals.globalTaskMaxBytes, null); assert.equal(r.totals.remainingTaskBytes, null);
  assert.deepEqual(new Set(input.writers.filter(w => w.profile !== 'GLOBAL').map(w => w.profile)), new Set(PROFILES));
  assert.equal(r.ledger.length, 134); assert.equal(WRITER_CATALOG.length, 134);
  for (const profile of PROFILES) for (const kind of ['candidate-npm-dependencies', 'legacy-npm-dependencies', 'DB-data-WAL-reset', 'evidence-members-closure'])
    assert.ok(r.ledger.some(w => w.profile === profile && w.kind === kind));
  for (const owner of ['A', 'L', 'P', 'R', 'D']) assert.ok(r.missingInputs.some(m => m.owner === owner));
  assert.ok(r.ledger.every(w => w.peakMaxBytes === null && w.remainingUnknowns.includes('UNKNOWN')));
});
test('complete bounded simulation counts backing once, includes retained and outside allocation', () => {
  const x = fixture(); const r = assessBudget(x);
  assert.deepEqual(r.reasons, []); assert.equal(r.planDecision, 'ADMITTED');
  assert.equal(r.totals.loopContentPeakMaxBytes, 1260); assert.equal(r.totals.outsidePeakMaxBytes, 80);
  assert.equal(r.totals.globalTaskMaxBytes, 19327352832 + 80 + 123456);
  assert.equal(r.totals.remainingTaskBytes, 21474836480 - (19327352832 + 80 + 123456));
  assert.equal(r.evidenceMode, 'SIMULATION'); assert.equal(r.quotaEnforced, false);
  for (const k of ['execution', 'runtimeAdmission', 'enforcement', 'custodyObserved']) assert.equal(r[k], 'NOT_RUN');
  assert.ok(Object.isFrozen(r.ledger[0]));
});
test('missing required dependency or writer, unknown bound/source and stale version fail closed', () => {
  let x = fixture(); x.dependencies.pop(); assert.ok(has(x, 'MISSING_INPUT'));
  x = fixture(); x.writers.pop(); assert.ok(has(x, 'MISSING_WRITER'));
  x = fixture(); x.writers[0].peakMaxBytes = null; assert.ok(has(x, 'UNKNOWN_MAXIMUM')); assert.equal(assessBudget(x).totals.globalTaskMaxBytes, null);
  x = fixture(); x.writers[0].measurementOrBoundSource = null; assert.ok(has(x, 'MISSING_INPUT'));
  x = fixture(); x.writers[0].measurementOrBoundSource.version = 'stale'; assert.ok(has(x, 'SOURCE_MISMATCH'));
  x = fixture(); x.dependencies[2].covers.pop(); assert.ok(has(x, 'MISSING_INPUT'));
});
test('free disk cannot replace remaining task budget; overbudget outside and loop stop', () => {
  let x = fixture(); x.retainedTask.allocatedBytes = 2 * 1024 ** 3 + 1; assert.ok(has(x, 'OVER_BUDGET'));
  x = fixture(); Object.assign(x.writers[0], { peakMaxBytes: 2 * 1024 ** 3 + 1 }); assert.ok(has(x, 'OVER_BUDGET'));
  x = fixture(); x.writers[8].peakMaxBytes = 17 * 1024 ** 3 + 1; assert.ok(has(x, 'OVER_BUDGET'));
  x = fixture(); x.writers[0].expandedMaxBytes = 11; assert.ok(has(x, 'OVER_BUDGET'));
});
test('reserve at exact boundary admits; one byte below on C, D or runtime stops', () => {
  for (const store of ['WINDOWS_C', 'WINDOWS_D', 'CLOUD_RUNTIME']) {
    const x = fixture(); const s = x.storage.find(s => s.storageId === store);
    const growth = store === 'CLOUD_RUNTIME' ? 19327352832 : store === 'WINDOWS_C' ? 10 : 70;
    s.freeBytes = 32212254720 + growth;
    assert.equal(assessBudget(x).planDecision, 'ADMITTED'); s.freeBytes--; assert.ok(has(x, 'RESERVE'));
  }
});
test('one heavy profile order and bounded time are required', () => {
  let x = fixture(); x.time.profileWindows[2].startSeconds = 19; assert.ok(has(x, 'OVERLAP'));
  x = fixture(); x.time.profileWindows.pop(); assert.ok(has(x, 'MISSING_INPUT'));
  x = fixture(); x.time.totalMaxSeconds = 1801; assert.ok(has(x, 'TIME'));
  x = fixture(); x.time.phaseMaxSeconds = 301; assert.ok(has(x, 'TIME'));
  x = fixture(); x.writers[0].durationMaxSeconds = 101; assert.ok(has(x, 'OVERLAP'));
});
test('planned non-overlap never discounts retained/failure maxima', () => {
  const x = fixture(); const [a, b] = x.writers.slice(8, 10);
  Object.assign(a, { peakMaxBytes: 9 * 1024 ** 3, startSeconds: 0, endSeconds: 10, durationMaxSeconds: 10, overlapGroup: 'first' });
  Object.assign(b, { peakMaxBytes: 9 * 1024 ** 3, startSeconds: 20, endSeconds: 30, durationMaxSeconds: 10, overlapGroup: 'second' });
  assert.ok(has(x, 'OVER_BUDGET'));
});
test('duplicate writers/allocation/retained or backing-content double counts are refused', () => {
  let x = fixture(); x.writers.push(structuredClone(x.writers[0])); assert.ok(has(x, 'DUPLICATE_WRITER'));
  x = fixture(); x.writers[0].allocationId = x.writers[1].allocationId; assert.ok(has(x, 'DUPLICATE_ALLOCATION'));
  x = fixture(); x.writers[0].allocationId = 'historical'; assert.ok(has(x, 'DUPLICATE_ALLOCATION'));
  x = fixture(); x.writers[0].placement = { storageId: 'CLOUD_RUNTIME', path: x.layout.loopBackingFile, layer: 'OUTSIDE' }; assert.ok(has(x, 'PLACEMENT_ESCAPE'));
});
test('physical placement must match storage and privateC/cipherD, without alias escapes', () => {
  for (const path of ['/var/tmp/elsewhere', '/var/tmp/pos-permission-full-123-1/data/../escape', 'C:/task/private']) {
    const x = fixture(); x.writers[8].placement.path = path; assert.ok(has(x, path.includes('..') ? 'UNKNOWN_PLACEMENT' : 'PLACEMENT_ESCAPE'));
  }
  let x = fixture(); x.writers[5].placement = { storageId: 'WINDOWS_D', path: 'D:/task/plain', layer: 'OUTSIDE' }; assert.ok(has(x, 'PLACEMENT_ESCAPE'));
  x = fixture(); x.storage[0].physicalIdentity = x.storage[1].physicalIdentity; assert.ok(has(x, 'DUPLICATE_ALLOCATION'));
  x = fixture(); x.storage[0].freeBytes = null; assert.ok(has(x, 'UNKNOWN_MAXIMUM'));
});
test('fake enforcement, stale source, resource cap and malformed integer cannot admit', () => {
  let x = fixture(); x.quotaEnforced = true; assert.throws(() => assessBudget(x), { code: 'ENFORCEMENT_CLAIM' });
  x = fixture(); x.baseCommit = 'f'.repeat(40); assert.ok(has(x, 'SOURCE_MISMATCH'));
  for (const [field, value] of [['maxHeavyEnvironments', 2], ['memoryPeakBytes', 10 * 1024 ** 3], ['pidsPeak', 2048], ['swapBytes', 1]]) {
    x = fixture(); x.resources[field] = value; assert.ok(has(x, 'RESOURCE'));
  }
  x = fixture(); x.writers[0].peakMaxBytes = -1; assert.throws(() => assessBudget(x), { code: 'UNSAFE_DATA' });
  assert.throws(() => assessBudget(null), { code: 'INPUT_INVALID' });
});
test('getter, inherited property, toJSON and proxy traps have zero effects', () => {
  let effects = 0;
  const x = fixture(); Object.defineProperty(x.writers[0], 'peakMaxBytes', { enumerable: true, get() { effects++; return 0; } });
  assert.throws(() => assessBudget(x), { code: 'UNSAFE_DATA' });
  const inherited = Object.create({ peakMaxBytes: 0 }); assert.throws(() => planData(inherited), { code: 'UNSAFE_DATA' });
  assert.throws(() => planData({ toJSON() { effects++; return {}; } }), { code: 'UNSAFE_DATA' });
  const p = new Proxy({}, { ownKeys() { effects++; return []; }, getPrototypeOf() { effects++; return Object.prototype; } });
  assert.throws(() => planData(p), { code: 'UNSAFE_DATA' }); assert.equal(effects, 0);
});
test('input limits, cycles, sparse arrays, unsafe keys and non-data reject finitely', () => {
  assert.throws(() => planData({ huge: 'a'.repeat(256 * 1024) }), { code: 'INPUT_LIMIT' });
  const cycle = {}; cycle.self = cycle; assert.throws(() => planData(cycle), { code: 'UNSAFE_DATA' });
  assert.throws(() => planData(new Array(2)), { code: 'UNSAFE_DATA' });
  assert.throws(() => planData(JSON.parse('{"__proto__":1}')), { code: 'UNSAFE_DATA' });
  assert.throws(() => planData({ x: Infinity }), { code: 'UNSAFE_DATA' });
});
test('B-SEC-01: non-array retained allocation IDs and UNKNOWN/null return finite STOP', () => {
  for (const value of [1, {}, true, 'historical', 'UNKNOWN', null]) {
    const x = fixture(); x.retainedTask.allocationIds = value;
    let r; assert.doesNotThrow(() => { r = assessBudget(x); });
    assert.equal(r.planDecision, 'STOP');
    assert.ok(r.reasons.some(reason => reason.code === 'MISSING_INPUT' && reason.at === 'retainedTask.allocationIds'));
    assert.ok(r.missingInputs.some(missing => missing.at === 'retainedTask.allocationIds' && missing.reason === 'UNKNOWN'));
    assert.equal(r.totals.globalTaskMaxBytes, null); assert.equal(r.totals.remainingTaskBytes, null);
  }
  const unknown = assessBudget(initialBudgetInput());
  assert.equal(unknown.planDecision, 'STOP'); assert.equal(unknown.ledger[0].peakMaxBytes, null);
});
test('B-SEC-01: dependency owner type/enum validates before property-key conversion', () => {
  for (const value of [{}, null, [], 1, true, 'UNKNOWN', '__proto__']) {
    const x = fixture(); x.dependencies[0].owner = value;
    assert.throws(() => assessBudget(x), error => error instanceof PlanError && error.code === 'INPUT_INVALID');
  }
  let effects = 0; const x = fixture();
  Object.defineProperty(x.dependencies[0], 'owner', { enumerable: true, get() { effects++; return 'A'; } });
  assert.throws(() => assessBudget(x), error => error instanceof PlanError && error.code === 'UNSAFE_DATA');
  const y = fixture(); y.dependencies[0].owner = new Proxy({}, { get() { effects++; }, getPrototypeOf() { effects++; return Object.prototype; } });
  assert.throws(() => assessBudget(y), error => error instanceof PlanError && error.code === 'UNSAFE_DATA');
  assert.equal(effects, 0);
});
test('B-SEC-01: other native lookup/interpolation boundaries stay within finite errors or STOP', () => {
  for (const mutate of [
    x => { x.storage[0].storageId = {}; }, x => { x.storage[0].physicalIdentity = {}; },
    x => { x.layout.root = {}; }, x => { x.layout.runtimeStorageId = {}; },
    x => { x.writers[0].writerId = {}; }, x => { x.writers[0].placement.storageId = {}; },
    x => { x.writers[0].measurementOrBoundSource.owner = {}; },
    x => { x.time.profileWindows[0].profile = {}; },
    x => { x.retainedTask.allocationIds = [{}]; },
  ]) {
    const x = fixture(); mutate(x);
    try { assert.equal(assessBudget(x).planDecision, 'STOP'); }
    catch (error) { assert.ok(error instanceof PlanError); assert.ok(PLAN_ERRORS.includes(error.code)); }
  }
});
