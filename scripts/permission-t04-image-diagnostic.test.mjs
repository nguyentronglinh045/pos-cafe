import test from 'node:test';
import assert from 'node:assert/strict';
import {
  runT04Profile, renderT04Evidence, runT04ImageDiagnostic, renderT04ImageDiagnostic,
  t04ExecutionMode, t04EventMode,
} from './permission-runtime-t04.mjs';
import { runtimeStageCatalog } from './permission-runtime-catalog.mjs';
import { IMAGE_OBSERVATION_KEYS, IMAGE_RESTORATION_KEYS } from './permission-t04-image-measurement.mjs';
import { ci1PublicExport, ci1WorkerPlan } from './permission-runtime-t04-worker.mjs';
import { assertT04ReclaimEvent } from './permission-runtime-t04-reclaim.mjs';
import {
  backendInvocation, assertBackendDispatchMode, backendEvidence, backendFailureEvidence,
  backendImageDiagnosticEvidence, backendImageDiagnosticFailureEvidence,
} from './project-backend-t04.mjs';

const sha = 'a'.repeat(40), digest = 'b'.repeat(64), otherSHA = 'c'.repeat(40), otherDigest = 'd'.repeat(64);
const repository = 'nguyentronglinh045/pos-cafe';
const catalog = runtimeStageCatalog().filter(stage => stage.runtimeProfile === 'SUPABASE_T04');
const metadata = { repository, runId: '123', attempt: 1, sourceSHA: sha, workflowSHA: sha,
  sourceFingerprint: digest, lockSHA: digest };
const diagnosticEnv = { GITHUB_REPOSITORY: repository, GITHUB_REPOSITORY_ID: '1263057386',
  GITHUB_EVENT_NAME: 'workflow_dispatch', GITHUB_SHA: sha, GITHUB_WORKFLOW_SHA: sha,
  GITHUB_RUN_ID: '123', GITHUB_RUN_ATTEMPT: '1', CI1_EXPECTED_SOURCE_SHA: sha,
  CI1_CONFIRMATION: 'RUN_T04_IMAGE_DIAGNOSTIC' };
const fullEnv = { ...diagnosticEnv, CI1_CONFIRMATION: 'RUN_T04_PROFILE' };

// Synthetic parser/orchestration controls only: these receipts are never runtime evidence.
function imageReceipt() {
  return { schemaVersion: 'permission-t04-image-measurement-v1', scope: 'SYNTHETIC_T04_IMAGE_ONLY',
    status: 'PASS', execution: 'RUNTIME', binding: { sourceSHA: sha, sourceFingerprint: digest,
      lockSHA: digest, runId: '123', attempt: 1, physicalBackendSHA: digest },
    observations: Object.fromEntries(IMAGE_OBSERVATION_KEYS.map(key => [key, true])),
    restoration: Object.fromEntries(IMAGE_RESTORATION_KEYS.map(key => [key, true])),
    timing: { target59Ms: 59000, target60Ms: 60000, target61Ms: 61000,
      observed59Ms: 59010, observed60Ms: 60010, observed61Ms: 61010 },
    uploadOrphanStatus: 'QUEUE_CLEANUP_UNCERTAIN' };
}
function row(stage) {
  const required = catalog.find(value => value.stage === stage).required.length;
  const run = stage === 'candidate-e2e' ? 6 : required;
  return { stage, status: 'PASS', required, run, discovered: run, pass: run, fail: 0, skip: 0, retry: 0,
    sourceSHA: sha, reportSHA: digest, invocationSHA: digest, supplementalOracles: 'NOT_PROVEN_BY_STAGE_COUNTS' };
}
function fixture(overrides = {}) {
  const calls = [], diagnostics = [];
  const defaults = {
    guard() {}, async bootstrap() {}, async physical() { return digest; },
    async baseline() { return digest; }, async preserved() { return true; },
    async checkpoint() { return { archiveSHA: digest, storageSHA: digest }; },
    async preflight() { return { status: 'PASS', archiveSHA: digest, storageSHA: digest,
      baselineSHA: digest, physicalSHA: digest }; },
    async prepare() {}, async stage(stage) { return row(stage); },
    async imageMeasurement() { return imageReceipt(); }, async afterStage() { return digest; },
    async restore(stage, beforeResetSHA) { return { stage, status: 'RESTORED_ORIGINAL', beforeResetSHA,
      archiveSHA: digest, baselineSHA: digest, physicalSHA: digest }; },
    diagnostic(stage, error, context) { diagnostics.push({ stage, error, context }); },
    async close() { return true; },
  };
  const adapter = Object.fromEntries(Object.entries({ ...defaults, ...overrides }).map(([name, fn]) => [name,
    typeof fn === 'function' ? (...args) => { calls.push({ name, args }); return fn(...args); } : fn]));
  return { adapter, calls, diagnostics };
}
const receipt = async (overrides, full = false) => ({
  ...await (full ? runT04Profile : runT04ImageDiagnostic)(fixture(overrides).adapter), ...metadata,
});
const worker = (failed = false) => ({ schemaVersion: 'permission-ci1-worker-status-v1',
  status: failed ? 'ERROR' : 'COMPLETE', businessCounts: null, cleanup: true, cleanupFailure: null,
  completed: ci1WorkerPlan('123', 1).stages.slice(1, failed ? 7 : undefined),
  failure: failed ? { stage: 'offline-edge', operation: 'PILOT_HARNESS', code: 'COMMAND_FAILED',
    command: 'node', exitCode: 1 } : null });
const event = (confirmation = 'RUN_T04_IMAGE_DIAGNOSTIC') => ({
  repository: { id: 1263057386, full_name: repository, private: false },
  inputs: { confirmation, expected_source_sha: sha },
});
const throwFailure = () => { throw new Error('synthetic failure'); };

test('diagnostic runs fixed candidate stage with all six tests and never claims whole T04', async () => {
  const f = fixture({ stages: ['pin-e2e'], stageIds: [], testNamePattern: 'one test' });
  const r = await runT04ImageDiagnostic(f.adapter, { stages: [] });
  assert.deepEqual(f.calls.filter(call => call.name === 'stage').map(call => call.args[0]), ['candidate-e2e']);
  assert.deepEqual(r.stages, [row('candidate-e2e')]);
  assert.equal(r.schemaVersion, 'permission-t04-image-diagnostic-v1');
  assert.equal(r.scope, 'CANDIDATE_IMAGE_DIAGNOSTIC_ONLY');
  assert.equal(r.status, 'DIAGNOSTIC_PASS');
  assert.equal(r.wholeT04, 'NOT_RUN');
  assert.equal(r.full35BusinessRuntime, 'NOT_RUN');
  assert.equal(r.remainingBusinessStages, 34);
  assert.equal(r.resets.length, 1);
  assert.equal(r.resets[0].status, 'RESTORED_ORIGINAL');
  assert.equal(r.cleanup, true);
  const rendered = renderT04ImageDiagnostic({ ...r, ...metadata });
  assert.deepEqual(JSON.parse(rendered.json), { ...r, ...metadata });
  assert.match(rendered.markdown, /DIAGNOSTIC_PASS/);
  assert.match(rendered.markdown, /Whole T04 is NOT_RUN/);
});

test('diagnostic observes image after all candidate tests and restores then verifies before closing', async () => {
  const f = fixture();
  await runT04ImageDiagnostic(f.adapter);
  const names = f.calls.map(call => call.name);
  assert.deepEqual(names.filter(name => name !== 'guard' && name !== 'physical' && name !== 'preserved'),
    ['bootstrap', 'baseline', 'checkpoint', 'preflight', 'prepare', 'stage', 'imageMeasurement', 'afterStage', 'restore', 'close']);
  assert.deepEqual(names.slice(names.indexOf('restore')), ['restore', 'physical', 'preserved', 'close']);
  assert.deepEqual(f.calls.find(call => call.name === 'restore').args, ['candidate-e2e', digest]);
  assert.equal(names.filter(name => name === 'close').length, 1);
});

test('full runner still requires nineteen stages and ten resets and cannot use diagnostic subset hints', async () => {
  const f = fixture({ stages: ['candidate-e2e'] }), r = await runT04Profile(f.adapter, { stages: ['candidate-e2e'] });
  assert.equal(r.status, 'PASS');
  assert.deepEqual(r.stages.map(value => value.stage), catalog.map(value => value.stage));
  assert.equal(r.stages.length, 19);
  assert.equal(r.resets.length, 10);
  assert.equal(r.remainingBusinessStages, 16);
  assert.equal(JSON.parse(renderT04Evidence({ ...r, ...metadata }).json).stages.length, 19);
});

test('two registered required cases or any count other than full six cannot pass diagnostic', async () => {
  assert.equal(row('candidate-e2e').required, 2);
  for (const run of [0, 1, 2, 5, 7, 6.5, '6']) {
    const f = fixture({ stage: stage => ({ ...row(stage), run, discovered: run, pass: run }) });
    const r = await runT04ImageDiagnostic(f.adapter);
    assert.equal(r.status, 'DIAGNOSTIC_FAIL', String(run));
    assert.equal(r.failure, 'candidate-e2e');
    assert(!f.calls.some(call => call.name === 'imageMeasurement'), String(run));
    assert.equal(r.cleanup, true);
  }
});

test('stage identity, required count, failed, skipped and retried cases stop before image measurement', async () => {
  for (const delta of [{ stage: 'pin-e2e' }, { required: 6 }, { status: 'NOT_RUN' },
    { pass: 5, fail: 1 }, { skip: 1 }, { retry: 1 }]) {
    const f = fixture({ stage: stage => ({ ...row(stage), ...delta }) }), r = await runT04ImageDiagnostic(f.adapter);
    assert.equal(r.status, 'DIAGNOSTIC_FAIL');
    assert.deepEqual(r.stages, [{ stage: 'candidate-e2e', status: 'FAIL' }]);
    assert(!f.calls.some(call => call.name === 'imageMeasurement'));
  }
});

test('bootstrap and preflight cannot be skipped before candidate work', async () => {
  for (const overrides of [{ bootstrap: throwFailure }, { checkpoint: () => null },
    { preflight: () => ({ status: 'PASS' }) }, { physical: throwFailure }, { preserved: () => false }]) {
    const f = fixture(overrides), r = await runT04ImageDiagnostic(f.adapter);
    assert.equal(r.status, 'DIAGNOSTIC_FAIL');
    assert.equal(r.failure, 'bootstrap');
    assert.deepEqual(r.stages, [{ stage: 'candidate-e2e', status: 'NOT_RUN' }]);
    assert(!f.calls.some(call => call.name === 'stage'));
    assert.equal(f.calls.filter(call => call.name === 'close').length, 1);
    assert.equal(JSON.parse(renderT04ImageDiagnostic({ ...r, ...metadata }).json).status, 'DIAGNOSTIC_FAIL');
  }
});

test('each missing or failed image proof stops before observation and restore', async () => {
  for (const imageMeasurement of [undefined, () => null, throwFailure,
    () => ({ ...imageReceipt(), binding: { ...imageReceipt().binding, physicalBackendSHA: otherDigest } })]) {
    const f = fixture({ imageMeasurement }), r = await runT04ImageDiagnostic(f.adapter);
    assert.equal(r.status, 'DIAGNOSTIC_FAIL');
    assert.equal(r.failure, 'candidate-e2e');
    assert.equal(r.imageMeasurement, null);
    assert(!f.calls.some(call => ['afterStage', 'restore'].includes(call.name)));
    assert.equal(r.cleanup, true);
  }
});

test('observation, restore and post-restore verification failures cannot become diagnostic success', async () => {
  for (const overrides of [{ afterStage: () => 'invalid' }, { restore: () => null },
    { restore: (stage, beforeResetSHA) => ({ stage, status: 'RESTORED_ORIGINAL', beforeResetSHA,
      archiveSHA: otherDigest, baselineSHA: digest, physicalSHA: digest }) }]) {
    const f = fixture(overrides), r = await runT04ImageDiagnostic(f.adapter);
    assert.equal(r.status, 'DIAGNOSTIC_FAIL');
    assert.equal(r.failure, 'candidate-e2e');
    assert.equal(r.resets.length, 0);
    assert.equal(r.cleanup, true);
  }
  for (const method of ['physical', 'preserved']) {
    let restored = false;
    const f = fixture({ restore: (stage, beforeResetSHA) => {
      restored = true;
      return { stage, status: 'RESTORED_ORIGINAL', beforeResetSHA, archiveSHA: digest,
        baselineSHA: digest, physicalSHA: digest };
    }, [method]: () => restored ? (method === 'physical' ? otherDigest : false) : (method === 'physical' ? digest : true) });
    const r = await runT04ImageDiagnostic(f.adapter);
    assert.equal(r.status, 'DIAGNOSTIC_FAIL', method);
    assert.equal(r.failure, 'candidate-e2e');
    assert.equal(r.resets.length, 1);
    assert.equal(r.cleanup, true);
  }
});

test('first image failure survives diagnostic callback and cleanup failures', async () => {
  const first = Object.assign(new Error('first image failure'), { t04ImageMeasurePredicateOrdinal: 7 });
  const observed = [];
  for (const close of [() => false, throwFailure]) {
    const f = fixture({ imageMeasurement: () => { throw first; }, close,
      diagnostic: (stage, error, context) => { observed.push({ stage, error, context }); throw new Error('report failure'); } });
    const r = await runT04ImageDiagnostic(f.adapter);
    assert.equal(r.failure, 'candidate-e2e');
    assert.equal(r.status, 'DIAGNOSTIC_FAIL');
    assert.equal(r.cleanup, false);
    assert.equal(f.calls.filter(call => call.name === 'close').length, 1);
    assert.equal(JSON.parse(renderT04ImageDiagnostic({ ...r, ...metadata }).json).failure, 'candidate-e2e');
  }
  assert.equal(observed.length, 2);
  for (const item of observed) {
    assert.equal(item.error, first);
    assert.equal(item.stage, 'candidate-e2e');
    assert.equal(item.context.phaseOrdinal, 5);
  }
});

test('cleanup alone failing after valid image and restore produces only DIAGNOSTIC_FAIL', async () => {
  for (const close of [() => false, () => undefined, throwFailure]) {
    const r = await receipt({ close });
    assert.equal(r.failure, 'cleanup');
    assert.equal(r.status, 'DIAGNOSTIC_FAIL');
    assert.equal(r.stages[0].status, 'PASS');
    assert.equal(r.resets.length, 1);
    assert.equal(JSON.parse(renderT04ImageDiagnostic(r).json).cleanup, false);
    assert.throws(() => renderT04ImageDiagnostic({ ...r, status: 'DIAGNOSTIC_PASS', failure: null }));
  }
});

test('renderer refuses stage subsets, duplicates, arbitrary stages and count shortcuts', async () => {
  const r = await receipt();
  for (const stages of [[], [r.stages[0], r.stages[0]], [row(catalog[0].stage)],
    [{ ...r.stages[0], required: 6 }], [{ ...r.stages[0], run: 2, discovered: 2, pass: 2 }],
    [{ ...r.stages[0], discovered: 5 }], [{ ...r.stages[0], sourceSHA: otherSHA }],
    [{ ...r.stages[0], skip: 1 }], [{ ...r.stages[0], retry: 1 }]]) {
    assert.throws(() => renderT04ImageDiagnostic({ ...r, stages }));
  }
});

test('renderer refuses missing checkpoint, image, restore, cleanup and false whole-runtime claims', async () => {
  const r = await receipt();
  for (const delta of [{ fixtureCheckpoint: null }, { imageMeasurement: null }, { resets: [] },
    { cleanup: false }, { runnerPreflight: 'NOT_RUN' }, { physicalBackendSHA: null }, { logicalBaselineSHA: null },
    { wholeT04: 'PASS' }, { full35BusinessRuntime: 'PASS' }, { remainingBusinessStages: 16 },
    { supplementalOracles: 'PASS' }, { status: 'PASS' }, { failure: 'private exception' }, { raw: 'private data' }]) {
    assert.throws(() => renderT04ImageDiagnostic({ ...r, ...delta }));
  }
  for (const delta of [{ stage: 'pin-e2e' }, { status: 'PASS' }, { physicalSHA: otherDigest },
    { baselineSHA: otherDigest }, { archiveSHA: otherDigest }, { beforeResetSHA: '' }]) {
    assert.throws(() => renderT04ImageDiagnostic({ ...r, resets: [{ ...r.resets[0], ...delta }] }));
  }
});

test('every image observation and restoration remains mandatory in diagnostic evidence', async () => {
  const r = await receipt();
  assert.equal(IMAGE_OBSERVATION_KEYS.length, 24);
  assert.equal(IMAGE_RESTORATION_KEYS.length, 8);
  for (const [field, keys] of [['observations', IMAGE_OBSERVATION_KEYS], ['restoration', IMAGE_RESTORATION_KEYS]]) {
    for (const key of keys) {
      const malformed = structuredClone(r);
      malformed.imageMeasurement[field][key] = false;
      assert.throws(() => renderT04ImageDiagnostic(malformed), field + '.' + key);
      delete malformed.imageMeasurement[field][key];
      assert.throws(() => renderT04ImageDiagnostic(malformed), 'missing ' + field + '.' + key);
    }
  }
});

test('image source, lock, run, attempt and physical binding must match the diagnostic receipt', async () => {
  const r = await receipt();
  for (const [key, value] of Object.entries({ sourceSHA: otherSHA, sourceFingerprint: otherDigest,
    lockSHA: otherDigest, runId: '124', attempt: 2, physicalBackendSHA: otherDigest })) {
    const malformed = structuredClone(r);
    malformed.imageMeasurement.binding[key] = value;
    assert.throws(() => renderT04ImageDiagnostic(malformed), key);
  }
});

test('whole and diagnostic renderers and public exporters reject each other for both success and failure', async () => {
  for (const overrides of [undefined, { imageMeasurement: throwFailure }]) {
    const diagnostic = await receipt(overrides), full = await receipt(overrides, true);
    assert.throws(() => renderT04Evidence(diagnostic));
    assert.throws(() => renderT04ImageDiagnostic(full));
    assert.throws(() => ci1PublicExport(diagnostic));
    assert.throws(() => ci1PublicExport(full, 'image-diagnostic'));
    assert.equal(JSON.parse(ci1PublicExport(diagnostic, 'image-diagnostic').json).wholeT04, 'NOT_RUN');
    assert.equal(JSON.parse(ci1PublicExport(full).json).stages.length, 19);
    for (const mode of ['candidate-e2e', 'diagnostic', '', null, {}]) {
      assert.throws(() => ci1PublicExport(diagnostic, mode));
    }
  }
});

test('diagnostic and whole backend collectors require their own receipt and dispatch mode', async () => {
  for (const failed of [false, true]) {
    const overrides = failed ? { imageMeasurement: throwFailure } : undefined;
    const diagnostic = await receipt(overrides), full = await receipt(overrides, true), w = worker(failed);
    const diagnosticGate = failed ? backendImageDiagnosticFailureEvidence : backendImageDiagnosticEvidence;
    const fullGate = failed ? backendFailureEvidence : backendEvidence;
    assert.equal(JSON.parse(diagnosticGate(w, diagnostic, diagnosticEnv).json).status,
      failed ? 'DIAGNOSTIC_FAIL' : 'DIAGNOSTIC_PASS');
    assert.equal(JSON.parse(fullGate(w, full, fullEnv).json).status, failed ? 'FAIL' : 'PASS');
    assert.throws(() => fullGate(w, diagnostic, fullEnv));
    assert.throws(() => diagnosticGate(w, full, diagnosticEnv));
    assert.throws(() => fullGate(w, full, diagnosticEnv));
    assert.throws(() => diagnosticGate(w, diagnostic, fullEnv));
    for (const delta of [{ CI1_CONFIRMATION: undefined }, { CI1_CONFIRMATION: 'candidate-e2e' },
      { CI1_EXPECTED_SOURCE_SHA: undefined }, { CI1_EXPECTED_SOURCE_SHA: otherSHA }]) {
      assert.throws(() => diagnosticGate(w, diagnostic, { ...diagnosticEnv, ...delta }));
    }
  }
});

test('diagnostic backend collectors reject wrong source, run, attempt, repository and workflow', async () => {
  for (const failed of [false, true]) {
    const r = await receipt(failed ? { imageMeasurement: throwFailure } : undefined), w = worker(failed);
    const collect = failed ? backendImageDiagnosticFailureEvidence : backendImageDiagnosticEvidence;
    for (const delta of [{ GITHUB_SHA: otherSHA, CI1_EXPECTED_SOURCE_SHA: otherSHA, GITHUB_WORKFLOW_SHA: otherSHA },
      { GITHUB_RUN_ID: '124' }, { GITHUB_RUN_ATTEMPT: '2' }, { GITHUB_REPOSITORY: 'other/project' },
      { GITHUB_WORKFLOW_SHA: otherSHA }]) {
      assert.throws(() => collect(w, r, { ...diagnosticEnv, ...delta }));
    }
    for (const delta of [{ cleanup: false }, { cleanupFailure: { code: 'FAIL' } }, { businessCounts: { pass: 6 } },
      { completed: w.completed.slice(1) }, { completed: [...w.completed].reverse() },
      { status: failed ? 'COMPLETE' : 'ERROR' }]) {
      assert.throws(() => collect({ ...w, ...delta }, r, diagnosticEnv));
    }
  }
});

test('success cannot enter failure collector and failure cannot enter success collector', async () => {
  const passed = await receipt(), failed = await receipt({ imageMeasurement: throwFailure });
  assert.throws(() => backendImageDiagnosticEvidence(worker(), failed, diagnosticEnv));
  assert.throws(() => backendImageDiagnosticFailureEvidence(worker(true), passed, diagnosticEnv));
  for (const delta of [{ stage: 'harness' }, { operation: 'OTHER' }, { command: 'bash' }, { exitCode: 0 }, { exitCode: 78 }]) {
    const w = worker(true);
    assert.throws(() => backendImageDiagnosticFailureEvidence({ ...w, failure: { ...w.failure, ...delta } }, failed, diagnosticEnv));
  }
});

test('dispatch accepts only two fixed modes bound to exact source and rejects arbitrary profile strings', () => {
  for (const [confirmation, mode] of [['RUN_T04_PROFILE', 'full'], ['RUN_T04_IMAGE_DIAGNOSTIC', 'image-diagnostic']]) {
    assert.equal(t04ExecutionMode(confirmation), mode);
    assert.equal(t04EventMode(event(confirmation), sha), mode);
    assert.equal(backendInvocation({ ...diagnosticEnv, CI1_CONFIRMATION: confirmation }, '/node', '/source').mode, mode);
  }
  for (const confirmation of [undefined, '', 'RUN_T04_PROFILE ', 'RUN_T04_IMAGE_DIAGNOSTIC\n',
    'RUN_T04_STAGE', 'candidate-e2e', 'SUPABASE_T04', ['RUN_T04_IMAGE_DIAGNOSTIC']]) {
    assert.throws(() => t04ExecutionMode(confirmation));
    assert.throws(() => backendInvocation({ ...diagnosticEnv, CI1_CONFIRMATION: confirmation }, '/node', '/source'));
  }
  for (const source of [undefined, otherSHA, sha.toUpperCase(), 'a'.repeat(39)]) {
    assert.throws(() => t04EventMode({ ...event(), inputs: { ...event().inputs, expected_source_sha: source } }, sha));
    assert.throws(() => backendInvocation({ ...diagnosticEnv, CI1_EXPECTED_SOURCE_SHA: source }, '/node', '/source'));
  }
  assert.throws(() => backendInvocation({ ...diagnosticEnv, GITHUB_WORKFLOW_SHA: otherSHA }, '/node', '/source'));
});

test('dispatch admission requires environment and event to agree on both fixed mode and exact source', () => {
  for (const [env, mode] of [[fullEnv, 'full'], [diagnosticEnv, 'image-diagnostic']]) {
    const matchingEvent = event(env.CI1_CONFIRMATION);
    assert.equal(assertBackendDispatchMode(env, matchingEvent), mode);
    const otherConfirmation = mode === 'full' ? 'RUN_T04_IMAGE_DIAGNOSTIC' : 'RUN_T04_PROFILE';
    assert.throws(() => assertBackendDispatchMode(env, event(otherConfirmation)));
    assert.throws(() => assertBackendDispatchMode({ ...env, CI1_CONFIRMATION: otherConfirmation }, matchingEvent));
    for (const invalid of [undefined, '', otherSHA, 'a'.repeat(39), 'A'.repeat(40)]) {
      assert.throws(() => assertBackendDispatchMode({ ...env, CI1_EXPECTED_SOURCE_SHA: invalid }, matchingEvent));
      assert.throws(() => assertBackendDispatchMode(env,
        { ...matchingEvent, inputs: { ...matchingEvent.inputs, expected_source_sha: invalid } }));
      assert.throws(() => assertBackendDispatchMode({ ...env, GITHUB_SHA: invalid }, matchingEvent));
    }
    for (const confirmation of [undefined, '', 'candidate-e2e', 'RUN_T04_IMAGE_DIAGNOSTIC\n']) {
      assert.throws(() => assertBackendDispatchMode({ ...env, CI1_CONFIRMATION: confirmation }, matchingEvent));
      assert.throws(() => assertBackendDispatchMode(env,
        { ...matchingEvent, inputs: { ...matchingEvent.inputs, confirmation } }));
    }
  }
});

test('reclaim accepts both fixed source-bound modes and refuses wrong source or repository admission', () => {
  for (const [confirmation, mode] of [['RUN_T04_PROFILE', 'full'], ['RUN_T04_IMAGE_DIAGNOSTIC', 'image-diagnostic']]) {
    assert.equal(assertT04ReclaimEvent(event(confirmation), diagnosticEnv), mode);
  }
  for (const delta of [{ id: 1 }, { full_name: 'other/project' }, { private: true }, { private: undefined }]) {
    assert.throws(() => assertT04ReclaimEvent({ ...event(), repository: { ...event().repository, ...delta } }, diagnosticEnv));
  }
  for (const inputs of [{ confirmation: 'candidate-e2e', expected_source_sha: sha },
    { confirmation: 'RUN_T04_IMAGE_DIAGNOSTIC', expected_source_sha: otherSHA },
    { confirmation: 'RUN_T04_IMAGE_DIAGNOSTIC' }, {}]) {
    assert.throws(() => assertT04ReclaimEvent({ ...event(), inputs }, diagnosticEnv));
  }
  assert.throws(() => assertT04ReclaimEvent(event(), { ...diagnosticEnv, GITHUB_WORKFLOW_SHA: otherSHA }));
});
