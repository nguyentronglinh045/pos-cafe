import test from 'node:test';
import assert from 'node:assert/strict';
import { initialBudgetInput, PROFILES } from './permission-full-budget-plan.mjs';
import { provisionPlan, initialProvisionInput, lifecyclePlan, SOURCE_PINS } from './permission-full-provision-plan.mjs';
import { fullRuntimeProfile, fullRuntimeLayout } from './permission-full-runtime-policy.mjs';

// Entirely synthetic, deliberately tiny declarations. No observed run IDs or DB.
function fixture(profileId = 'STATIC') {
  const x = initialProvisionInput(profileId); const b = initialBudgetInput(); b.evidenceMode = 'SIMULATION';
  const s = owner => ({ owner, version: 'fixture-v1', path: 'synthetic.json', sha256: 'b'.repeat(64), kind: 'SIMULATION' });
  for (const d of b.dependencies) Object.assign(d, { status: 'BOUNDED', version: 'fixture-v1', sha256: 'b'.repeat(64), covers: [...d.required] });
  x.identity = { runId: '123', attempt: 1, nonce: 'c'.repeat(32), ownerUid: 1000 };
  const layout = fullRuntimeLayout('123', 1, x.identity.nonce, 1000);
  b.layout = { root: layout.root, loopMount: layout.loopMount, loopBackingFile: layout.loopBackingFile, runtimeStorageId: 'CLOUD_RUNTIME' };
  for (const store of b.storage) Object.assign(store, { hostId: store.location === 'CLOUD_RUNTIME' ? 'cloud' : 'windows', physicalIdentity: store.storageId,
    root: store.location === 'WINDOWS_C' ? 'C:/task' : store.location === 'WINDOWS_D' ? 'D:/task' : '/var/tmp', freeBytes: 100 * 1024 ** 3, source: s('D') });
  b.retainedTask = { allocatedBytes: 100, source: s('D'), allocationIds: ['history'] };
  b.time = { totalMaxSeconds: 100, phaseMaxSeconds: 20, profileWindows: PROFILES.map((profile, i) => ({ profile, startSeconds: i * 10, endSeconds: (i + 1) * 10 })), source: s('D') };
  Object.assign(b.resources, { memoryPeakBytes: 1000, pidsPeak: 1, source: s('D') });
  for (const [i, w] of b.writers.entries()) {
    const storageId = w.kind === 'receiver-private-C' ? 'WINDOWS_C' : w.profile === 'GLOBAL' ? 'WINDOWS_D' : 'CLOUD_RUNTIME';
    const root = storageId === 'WINDOWS_C' ? 'C:/task' : storageId === 'WINDOWS_D' ? 'D:/task' : layout.loopMount;
    Object.assign(w, { allocationId: `alloc-${i}`, placement: { storageId, path: `${root}/w${i}`, layer: w.profile === 'GLOBAL' ? 'OUTSIDE' : 'LOOP' },
      compressedBytes: 1, expandedMaxBytes: 1, allocatedMaxBytes: 1, peakMaxBytes: 1, overlapGroup: 'retained', startSeconds: 0,
      endSeconds: 100, durationMaxSeconds: 100, measurementOrBoundSource: s(w.owner), remainingUnknowns: [] });
  }
  x.budgetInput = b; x.review = { version: 'fixture-v1', sha256: 'd'.repeat(64) };
  const p = profileId === 'STATIC' ? null : fullRuntimeProfile(profileId);
  x.tools = { sourceSha: b.baseCommit, policySha256: SOURCE_PINS.policy, toolsManifestSha256: SOURCE_PINS.tools,
    imagesManifestSha256: SOURCE_PINS.images, configSha256: p?.config?.sha256 ?? null };
  const common = { path: layout.root, realpath: layout.root, directory: true, symlink: false, device: '7', inode: '8',
    ownerUid: 1000, mode: 0o700, nonce: x.identity.nonce, ownerLabel: layout.ownerLabel };
  x.rootFacts = { host: { ...common, preexistingSubmounts: [] }, unit: { ...common, privateTmp: true, bindSource: layout.root,
    bindDestination: layout.root, bindRecursive: false, ignoreMissingSource: false } };
  const aliases = p?.kind === 'SUPABASE' ? [...new Set([p.aliasRoot, p.stackAlias, p.cliAlias])] : [];
  if (profileId === 'PG16_T01') { x.t01Alias = '/var/tmp/pos-cafe-perm-t01-fixture'; aliases.push(x.t01Alias); }
  x.aliases = aliases.map(alias => ({ alias, target: `${layout.loopMount}/runtime/${alias.slice('/var/tmp/'.length)}`,
    sourceDevice: '9', sourceInode: '10', aliasDevice: '9', aliasInode: '10' }));
  if (profileId === 'PIN_IDENTITY') x.privatePathState = 'ABSENT';
  assert.ok(Buffer.byteLength(JSON.stringify(x)) <= 256 * 1024);
  return x;
}
const has = (x, code) => provisionPlan(x).reasons.some(r => r.code === code);

test('initial plan is useful but STOP, without invented runtime binding', () => {
  for (const id of PROFILES) {
    const r = provisionPlan(initialProvisionInput(id)); assert.equal(r.planDecision, 'STOP');
    assert.ok(r.reasons.some(r => r.code === 'BUDGET_STOP'));
    for (const step of ['source-review-budget-grant', 'previous-profile-transition', 'host-unit-root-visibility', 'loop-and-cgroup-boundary',
      'fixed-alias-mapping', 'tools-config-bootstrap', 'profile-execution-evidence', 'custody-and-retention', 'intentional-cleanup-locked'])
      assert.ok(r.steps.some(s => s.id === step));
    assert.ok(Object.values(r.runtimeBinding).every(v => v === null)); assert.equal(r.declaredLayout, null);
    assert.ok(r.steps.every(s => s.execution === 'NOT_RUN' && s.onMissingOrMismatch === 'STOP_RETAIN_NO_INTENTIONAL_CLEANUP'));
  }
});
test('bounded simulations preserve ordered steps, topology, identity and NOT_RUN on every profile', () => {
  for (const id of PROFILES) {
    const r = provisionPlan(fixture(id)); assert.deepEqual(r.reasons, [], id); assert.equal(r.planDecision, 'ADMITTED');
    assert.equal(r.evidenceMode, 'SIMULATION'); assert.equal(r.execution, 'NOT_RUN'); assert.equal(r.runtimeAdmission, 'NOT_RUN');
    assert.equal(r.enforcement, 'NOT_RUN'); assert.equal(r.custodyObserved, 'NOT_RUN'); assert.equal(r.cleanup.intentionalAllowed, false);
    assert.ok(Object.values(r.runtimeBinding).every(v => v === null));
    assert.ok(r.unitProperties.includes(`--property=BindPaths=${r.declaredLayout.root}:${r.declaredLayout.root}:norbind`));
    assert.deepEqual(r.steps.map(s => s.order), r.steps.map((_, i) => i + 1));
    if (r.profileRequirements.kind === 'SUPABASE') { assert.equal(r.profileRequirements.postgresMajor, 17); assert.equal(r.profileRequirements.topology.containerKinds.length, 12); }
  }
});
test('PIN_IDENTITY keeps private absent before bootstrap; canary exact empty seed and CLI16', () => {
  let x = fixture('PIN_IDENTITY'); x.privatePathState = 'PRESENT'; assert.ok(has(x, 'PRIVATE_NOT_ABSENT'));
  x.privatePathState = 'UNKNOWN'; assert.ok(has(x, 'PRIVATE_NOT_ABSENT'));
  const r = provisionPlan(fixture('PIN_CANARY')); const b = r.profileRequirements.bootstrap;
  assert.equal(b.strategy, 'CLI_16_EMPTY_SEED_FILE'); assert.equal(b.migrationCount, 16); assert.equal(b.seedBytes, 0); assert.equal(b.exclusiveSeedFile, true);
  const identity = provisionPlan(fixture('PIN_IDENTITY'));
  assert.ok(identity.steps.findIndex(s => s.id === 'identity-private-absent') < identity.steps.findIndex(s => s.id === 'tools-config-bootstrap'));
});
test('T01 is PG16 observer and T04 retains19 stages and one physical backend', () => {
  const t01 = provisionPlan(fixture('PG16_T01')).profileRequirements;
  assert.equal(t01.postgresMajor, 16); assert.equal(t01.bootstrap.observerOnly, true);
  assert.deepEqual(t01.bootstrap.doesNotProve, ['AUTH', 'REST', 'STORAGE_SERVICE', 'REALTIME']);
  const t04 = provisionPlan(fixture('SUPABASE_T04')).profileRequirements;
  assert.equal(t04.stages.length, 19); assert.equal(t04.samePhysicalBackendRequired, true); assert.equal(t04.logicalResetsOnlyAtReviewedBoundaries, true);
});
test('budget cannot be replaced by a forged ADMITTED report or unknown/stale inputs', () => {
  let x = fixture(); x.budgetInput = { planDecision: 'ADMITTED' }; assert.throws(() => provisionPlan(x), { code: 'INPUT_INVALID' });
  x = fixture(); x.budgetInput.retainedTask.allocatedBytes = null; assert.ok(has(x, 'BUDGET_STOP'));
  x = fixture(); x.tools.policySha256 = 'f'.repeat(64); assert.ok(has(x, 'TOOL_IDENTITY'));
  x = fixture(); x.review = null; assert.ok(has(x, 'MISSING_INPUT'));
  assert.throws(() => provisionPlan({ ...initialProvisionInput(), profileId: 'HP1' }), { code: 'PROFILE_REFUSED' });
});
test('host/unit stale nonce, inode, preexisting mount and recursive bind are refused', () => {
  for (const mutate of [
    x => { x.rootFacts.unit.nonce = 'f'.repeat(32); }, x => { x.rootFacts.unit.inode = '99'; },
    x => { x.rootFacts.host.preexistingSubmounts.push('/bad'); }, x => { x.rootFacts.unit.bindRecursive = true; },
    x => { x.rootFacts.unit.ignoreMissingSource = true; }, x => { x.rootFacts.host.ownerUid = 0; },
    x => { x.budgetInput.layout.root = '/var/tmp/stale'; },
  ]) { const x = fixture('SUPABASE_T04'); mutate(x); assert.ok(has(x, 'STALE_IDENTITY')); }
});
test('fixed aliases cannot escape, duplicate, use wrong guard name or fake device/inode', () => {
  for (const mutate of [
    x => { x.aliases[0].target = '/tmp/escape'; }, x => { x.aliases[0].aliasInode = '99'; },
    x => { x.aliases[0].alias = '/var/tmp/unapproved'; }, x => { x.aliases.push(structuredClone(x.aliases[0])); },
    x => { x.aliases[0].target += '/../escape'; },
  ]) { const x = fixture('SUPABASE_T04'); mutate(x); assert.ok(has(x, 'ALIAS_ESCAPE')); }
  let x = fixture('SUPABASE_T04'); x.aliases.pop(); assert.ok(has(x, 'MISSING_INPUT'));
  x = fixture('PG16_T01'); x.t01Alias = '/tmp/pos-cafe-perm-t01-fake'; assert.ok(has(x, 'ALIAS_ESCAPE'));
});
test('intentional cleanup remains locked; cancel/timeout loss risk never implies custody PASS', () => {
  for (const event of ['FAIL', 'CANCEL', 'TIMEOUT', 'CUSTODY_PENDING', 'INTENTIONAL_CLEANUP']) {
    const r = lifecyclePlan(event); assert.equal(r.planDecision, 'STOP'); assert.equal(r.intentionalCleanupAllowed, false); assert.equal(r.custodyObserved, 'NOT_RUN');
    if (['CANCEL', 'TIMEOUT'].includes(event)) assert.equal(r.platformTeardown, 'UNPROVEN_LOSS_RISK');
  }
  assert.throws(() => lifecyclePlan('CLEANUP_GRANTED'), { code: 'INPUT_INVALID' });
});
test('getter/proxy/function effects stay zero through provision boundary', () => {
  let effects = 0; const x = fixture(); Object.defineProperty(x.rootFacts.unit, 'device', { enumerable: true, get() { effects++; return '7'; } });
  assert.throws(() => provisionPlan(x), { code: 'UNSAFE_DATA' });
  const p = new Proxy({}, { get() { effects++; }, ownKeys() { effects++; return []; } });
  assert.throws(() => provisionPlan(p), { code: 'UNSAFE_DATA' });
  const y = initialProvisionInput(); y.tools = () => { effects++; }; assert.throws(() => provisionPlan(y), { code: 'UNSAFE_DATA' }); assert.equal(effects, 0);
});
