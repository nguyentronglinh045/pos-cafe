import { types } from 'node:util';
import { CI1_LIMITS } from './permission-ci1-policy.mjs';

// Declaration-only interfaces. No adapter, filesystem, process, network or clock.
// Bounds supplied by a caller are not authenticated observations or permission.
export const BUDGET_VERSION = 'permission-full-budget-plan-v1';
export const BASE_COMMIT = '567af2191400ef559e90b3eccae0a0e4992f82e5';
export const BASE_TREE = '5b8667b4c421a7e6c47f566e1634129799a5f83d';
export const PROFILES = Object.freeze(['STATIC', 'PIN_ONBOARD', 'PIN_IDENTITY', 'PIN_CANARY', 'PG16_T01', 'SUPABASE_T02', 'SUPABASE_T04']);
export const LIMITS = Object.freeze({ ...CI1_LIMITS, outsideBytes: 2 * 1024 ** 3, inputBytes: 256 * 1024 });
export const PLAN_ERRORS = Object.freeze(['UNSAFE_DATA', 'INPUT_LIMIT', 'INPUT_INVALID', 'SOURCE_MISMATCH',
  'MISSING_INPUT', 'UNKNOWN_MAXIMUM', 'MISSING_WRITER', 'DUPLICATE_WRITER', 'DUPLICATE_ALLOCATION',
  'UNKNOWN_PLACEMENT', 'PLACEMENT_ESCAPE', 'OVER_BUDGET', 'RESERVE', 'OVERLAP', 'TIME', 'RESOURCE', 'ENFORCEMENT_CLAIM']);
export class PlanError extends Error {
  constructor(code) { super(code); this.name = 'PlanError'; this.code = code; }
}
const invalid = () => { throw new PlanError('INPUT_INVALID'); };
function freezePlan(value) {
  if (value && typeof value === 'object') { Object.values(value).forEach(freezePlan); Object.freeze(value); }
  return value;
}

// Reject proxies before any reflection, and descriptors before reading values.
// A caller cannot execute getters/toJSON/iterators through the data interface.
export function planData(value) {
  const seen = new Set(); let nodes = 0;
  function copy(v, depth) {
    if (++nodes > 24000 || depth > 24) throw new PlanError('INPUT_LIMIT');
    if (v === null || typeof v === 'boolean' || typeof v === 'string') return v;
    if (typeof v === 'number' && Number.isSafeInteger(v) && v >= 0) return v;
    if (!v || typeof v !== 'object' || types.isProxy(v) || seen.has(v)) throw new PlanError('UNSAFE_DATA');
    const array = Array.isArray(v); const proto = Object.getPrototypeOf(v);
    if (proto !== (array ? Array.prototype : Object.prototype) && !(proto === null && !array)) throw new PlanError('UNSAFE_DATA');
    seen.add(v); const result = array ? [] : Object.create(null);
    const descriptors = Object.getOwnPropertyDescriptors(v);
    if (array && (!Number.isSafeInteger(descriptors.length?.value) || descriptors.length.value > 24000)) throw new PlanError('INPUT_LIMIT');
    for (const key of Reflect.ownKeys(descriptors)) {
      if (array && key === 'length') continue;
      const d = descriptors[key];
      if (typeof key !== 'string' || ['__proto__', 'constructor', 'prototype'].includes(key)
        || !d.enumerable || !Object.hasOwn(d, 'value') || (array && !/^(0|[1-9][0-9]*)$/.test(key))) throw new PlanError('UNSAFE_DATA');
      result[key] = copy(d.value, depth + 1);
    }
    if (array && (Object.keys(result).length !== descriptors.length.value || result.length !== descriptors.length.value)) throw new PlanError('UNSAFE_DATA');
    seen.delete(v); return result;
  }
  const output = copy(value, 0);
  if (Buffer.byteLength(JSON.stringify(output)) > LIMITS.inputBytes) throw new PlanError('INPUT_LIMIT');
  return output;
}
const exact = (v, keys) => {
  if (!v || typeof v !== 'object' || Array.isArray(v) || Object.keys(v).length !== keys.length || keys.some(k => !Object.hasOwn(v, k))) invalid();
};
const uint = v => Number.isSafeInteger(v) && v >= 0;
const id = v => typeof v === 'string' && /^[A-Za-z0-9_-]{1,100}$/.test(v);
const text = v => typeof v === 'string' && v.length > 0 && v.length <= 300 && !/[\0\r\n]/.test(v);
const hash = v => typeof v === 'string' && /^[a-f0-9]{64}$/.test(v);
export function absolutePlanPath(v) {
  return typeof v === 'string' && v.length <= 300 && (/^\//.test(v) || /^[A-Z]:\//.test(v))
    && !/[\\\0\r\n]/.test(v) && !v.includes('//') && !v.split('/').some(p => p === '.' || p === '..')
    && !v.split('/').some((p, i) => (i > 0 && p.includes(':')) || /[. ]$/.test(p));
}
export const withinPlanPath = (path, root) => absolutePlanPath(path) && absolutePlanPath(root)
  && (path === root || path.startsWith(root + (root.endsWith('/') ? '' : '/')));

export const INPUT_REQUIREMENTS = freezePlan({
  A: ['archive-seal-cipher-status-members', 'receiver-privateC-ACK-retention', 'failure-retry-peak-RAM'],
  L: ['legacy-source-lock-graph', 'transfer-unpack-install-scripts', 'build-dist-cache-server-browser-time'],
  P: ['PIN19-exact-case-file-fullName-project-identities', 'TC18-capture-control-TC19-preservation', 'outputs-members-traces-temp-concurrency-time'],
  R: ['PERM60-726occurrences-27stages', 'T04-19stages-one-physical-backend', 'TC53-three-DB-variants-WAL-reset-preservation-time'],
  D: ['global-writer-overlap-controller-supervisor', 'historical-retained-task-allocation', 'physical-storage-reserves-resource-time-bounds'],
});
const globalKinds = [
  ['source-worktrees-control-index', 'D'], ['tools-transfer', 'L'], ['tools-unpack', 'L'],
  ['controller-supervisor-logs', 'D'], ['ciphertext-D', 'A'], ['receiver-private-C', 'A'],
  ['ACK-global-retention', 'A'], ['failure-retry-retention', 'D'],
];
const profileKinds = [
  ['source-copy', 'D'], ['legacy-npm-dependencies', 'L'], ['legacy-npm-cache', 'L'], ['legacy-install-scripts', 'L'],
  ['candidate-npm-dependencies', 'D'], ['candidate-npm-cache', 'D'], ['candidate-install-scripts', 'D'], ['candidate-build-dist-server', 'D'],
  ['browser-binary-cache-profile', 'P'], ['browser-trace-screenshot-temp', 'P'], ['legacy-unpack-build-dist-server', 'L'],
  ['docker-compressed-transfer', 'D'], ['docker-expanded-layers', 'D'], ['containerd-snapshots', 'D'],
  ['container-writable-logs', 'D'], ['DB-data-WAL-reset', 'R'], ['stdout-stderr', 'D'], ['evidence-members-closure', 'R'],
];
export const WRITER_CATALOG = freezePlan([
  ...globalKinds.map(([kind, owner]) => ({ writerId: `GLOBAL_${kind}`, profile: 'GLOBAL', kind, owner })),
  ...PROFILES.flatMap(profile => profileKinds.map(([kind, owner]) => ({ writerId: `${profile}_${kind}`, profile, kind,
    owner: /^(browser-|DB-|evidence-)/.test(kind) ? (profile === 'STATIC' ? 'D' : profile.startsWith('PIN_') ? 'P' : 'R') : owner }))),
]);

export function initialBudgetInput() {
  return {
    schemaVersion: BUDGET_VERSION, baseCommit: BASE_COMMIT, baseTree: BASE_TREE, evidenceMode: 'PLAN_ONLY',
    dependencies: Object.entries(INPUT_REQUIREMENTS).map(([owner, required]) => ({ owner, status: 'UNKNOWN', version: null, sha256: null, covers: [], required: [...required] })),
    layout: { root: null, loopMount: null, loopBackingFile: null, runtimeStorageId: null },
    storage: ['WINDOWS_C', 'WINDOWS_D', 'CLOUD_RUNTIME'].map(location => ({ storageId: location, location, hostId: null, physicalIdentity: null, root: null, freeBytes: null, source: null })),
    retainedTask: { allocatedBytes: null, source: null, allocationIds: null },
    time: { totalMaxSeconds: null, phaseMaxSeconds: null, profileWindows: null, source: null },
    resources: { cpuQuota: LIMITS.cpuQuota, cpuPeriod: LIMITS.cpuPeriod, memoryPeakBytes: null, swapBytes: 0, pidsPeak: null, maxHeavyEnvironments: 1, source: null },
    writers: WRITER_CATALOG.map(w => ({ ...w, phases: [w.profile === 'GLOBAL' ? 'TASK_LIFETIME' : w.profile],
      allocationId: null, placement: { storageId: null, path: null, layer: null },
      compressedBytes: null, expandedMaxBytes: null, allocatedMaxBytes: null, peakMaxBytes: null,
      overlapGroup: null, startSeconds: null, endSeconds: null, durationMaxSeconds: null,
      lifetime: 'THROUGH_ACK_OR_AUTHORIZED_CLEANUP', measurementOrBoundSource: null, remainingUnknowns: ['UNKNOWN'] })),
  };
}

// Conservative accounting: no credit for a planned cleanup, non-overlap, alias,
// compression or namespace PASS. Sum all per-writer peaks through retention and
// failure paths. Loop content consumes loop capacity; backing is counted ONCE in
// global/host allocation. Retained task allocation is additional and never free.
export function assessBudget(input) {
  const x = planData(input);
  if (!x || typeof x !== 'object' || Array.isArray(x)) invalid();
  if (Object.hasOwn(x, 'quotaEnforced') || Object.hasOwn(x, 'enforcement')) throw new PlanError('ENFORCEMENT_CLAIM');
  exact(x, ['schemaVersion', 'baseCommit', 'baseTree', 'evidenceMode', 'dependencies', 'layout', 'storage', 'retainedTask', 'time', 'resources', 'writers']);
  if (x.schemaVersion !== BUDGET_VERSION || !['PLAN_ONLY', 'SIMULATION'].includes(x.evidenceMode)) invalid();
  const reasons = []; const missingInputs = [];
  const stop = (code, at, owner = 'D', reason = code) => { reasons.push({ code, at, owner, reason }); };
  const missing = (at, owner, reason = 'UNKNOWN') => { missingInputs.push({ owner, version: 'UNKNOWN', source: null, at, reason }); stop('MISSING_INPUT', at, owner, reason); };
  const source = (s, at, owner) => {
    if (s === null) { missing(at, owner); return false; }
    exact(s, ['owner', 'version', 'path', 'sha256', 'kind']);
    if (!text(s.version) || !text(s.path) || !hash(s.sha256) || s.owner !== owner || !['BOUND', 'SIMULATION'].includes(s.kind)) invalid();
    if (deps.get(owner)?.status === 'BOUNDED' && s.version !== deps.get(owner).version) stop('SOURCE_MISMATCH', at, owner, 'STALE_BOUND_VERSION');
    if (s.kind === 'SIMULATION' && x.evidenceMode !== 'SIMULATION') stop('SOURCE_MISMATCH', at, owner, 'SIMULATION_REQUIRES_SIMULATION_ENVELOPE');
    return true;
  };
  const maximum = (v, at, owner) => { if (v === null) { stop('UNKNOWN_MAXIMUM', at, owner, 'UNKNOWN'); return false; } if (!uint(v)) invalid(); return true; };
  const sum = values => { const n = values.reduce((a, b) => a + b, 0); if (!uint(n)) invalid(); return n; };
  if (x.baseCommit !== BASE_COMMIT || x.baseTree !== BASE_TREE) stop('SOURCE_MISMATCH', 'base');
  if (!Array.isArray(x.dependencies) || !Array.isArray(x.writers) || !Array.isArray(x.storage)) invalid();
  const deps = new Map();
  for (const d of x.dependencies) {
    exact(d, ['owner', 'status', 'version', 'sha256', 'covers', 'required']);
    if (typeof d.owner !== 'string' || !Object.hasOwn(INPUT_REQUIREMENTS, d.owner) || deps.has(d.owner) || !Array.isArray(d.covers)
      || JSON.stringify(d.required) !== JSON.stringify(INPUT_REQUIREMENTS[d.owner]) || !['UNKNOWN', 'BOUNDED'].includes(d.status)) invalid();
    deps.set(d.owner, d);
    if (d.status === 'UNKNOWN' || !text(d.version) || !hash(d.sha256) || INPUT_REQUIREMENTS[d.owner].some(k => !d.covers.includes(k))) missing(`dependencies.${d.owner}`, d.owner);
  }
  for (const owner of Object.keys(INPUT_REQUIREMENTS)) if (!deps.has(owner)) missing(`dependencies.${owner}`, owner);
  exact(x.layout, ['root', 'loopMount', 'loopBackingFile', 'runtimeStorageId']);
  const layoutKnown = absolutePlanPath(x.layout.root) && x.layout.loopMount === `${x.layout.root}/data`
    && x.layout.loopBackingFile === `${x.layout.root}/data.img` && id(x.layout.runtimeStorageId);
  if (!layoutKnown) stop('UNKNOWN_PLACEMENT', 'layout');
  const stores = new Map(); const physical = new Set();
  for (const s of x.storage) {
    exact(s, ['storageId', 'location', 'hostId', 'physicalIdentity', 'root', 'freeBytes', 'source']);
    if (!id(s.storageId) || stores.has(s.storageId) || !['WINDOWS_C', 'WINDOWS_D', 'CLOUD_RUNTIME'].includes(s.location)) invalid();
    stores.set(s.storageId, s); maximum(s.freeBytes, `storage.${s.storageId}.freeBytes`, 'D'); source(s.source, `storage.${s.storageId}.source`, 'D');
    if (!text(s.hostId) || !text(s.physicalIdentity) || !absolutePlanPath(s.root)) stop('UNKNOWN_PLACEMENT', `storage.${s.storageId}`);
    else {
      const key = `${s.hostId}:${s.physicalIdentity}`;
      if (physical.has(key)) stop('DUPLICATE_ALLOCATION', `storage.${s.storageId}`, 'D', 'DUPLICATE_PHYSICAL_STORAGE');
      physical.add(key);
      if ((s.location === 'WINDOWS_C' && !s.root.startsWith('C:/')) || (s.location === 'WINDOWS_D' && !s.root.startsWith('D:/'))
        || (s.location === 'CLOUD_RUNTIME' && !s.root.startsWith('/'))) stop('PLACEMENT_ESCAPE', `storage.${s.storageId}`);
    }
  }
  for (const location of ['WINDOWS_C', 'WINDOWS_D', 'CLOUD_RUNTIME']) if (![...stores.values()].some(s => s.location === location)) missing(`storage.${location}`, 'D');
  const runtime = stores.get(x.layout.runtimeStorageId);
  if (layoutKnown && (!runtime || runtime.location !== 'CLOUD_RUNTIME' || !withinPlanPath(x.layout.root, runtime.root))) stop('PLACEMENT_ESCAPE', 'layout');
  exact(x.retainedTask, ['allocatedBytes', 'source', 'allocationIds']);
  maximum(x.retainedTask.allocatedBytes, 'retainedTask.allocatedBytes', 'D'); source(x.retainedTask.source, 'retainedTask.source', 'D');
  if (!Array.isArray(x.retainedTask.allocationIds)) missing('retainedTask.allocationIds', 'D');
  else if (x.retainedTask.allocationIds.some(v => !id(v)) || new Set(x.retainedTask.allocationIds).size !== x.retainedTask.allocationIds.length) invalid();
  exact(x.time, ['totalMaxSeconds', 'phaseMaxSeconds', 'profileWindows', 'source']);
  maximum(x.time.totalMaxSeconds, 'time.totalMaxSeconds', 'D'); maximum(x.time.phaseMaxSeconds, 'time.phaseMaxSeconds', 'D'); source(x.time.source, 'time.source', 'D');
  if (x.time.totalMaxSeconds > LIMITS.runtimeSeconds || x.time.phaseMaxSeconds > LIMITS.phaseTimeoutMs / 1000
    || (x.time.totalMaxSeconds !== null && x.time.phaseMaxSeconds > x.time.totalMaxSeconds)) stop('TIME', 'time');
  if (!Array.isArray(x.time.profileWindows)) missing('time.profileWindows', 'D');
  else {
    const windows = new Map(); let previousEnd = 0;
    for (const w of x.time.profileWindows) {
      exact(w, ['profile', 'startSeconds', 'endSeconds']);
      if (!PROFILES.includes(w.profile) || windows.has(w.profile) || !uint(w.startSeconds) || !uint(w.endSeconds)) invalid();
      windows.set(w.profile, w);
    }
    for (const profile of PROFILES) {
      const w = windows.get(profile);
      if (!w) { missing(`time.${profile}`, 'D'); continue; }
      if (w.startSeconds < previousEnd || w.endSeconds < w.startSeconds || w.endSeconds > x.time.totalMaxSeconds) stop('OVERLAP', `time.${profile}`, 'D', 'PROFILE_ORDER_ONE_HEAVY');
      previousEnd = w.endSeconds;
    }
  }
  exact(x.resources, ['cpuQuota', 'cpuPeriod', 'memoryPeakBytes', 'swapBytes', 'pidsPeak', 'maxHeavyEnvironments', 'source']);
  maximum(x.resources.memoryPeakBytes, 'resources.memoryPeakBytes', 'D'); maximum(x.resources.pidsPeak, 'resources.pidsPeak', 'D'); source(x.resources.source, 'resources.source', 'D');
  if (x.resources.cpuQuota !== LIMITS.cpuQuota || x.resources.cpuPeriod !== LIMITS.cpuPeriod || x.resources.swapBytes !== 0
    || x.resources.memoryPeakBytes >= LIMITS.memoryBytes || x.resources.pidsPeak >= LIMITS.pids || x.resources.maxHeavyEnvironments !== 1) stop('RESOURCE', 'resources');
  // A non-array was recorded as missing above; never pass it to an iterable API.
  // The safe empty set is only for continued diagnostics: missing still forces STOP.
  const found = new Set(); const allocations = new Set(Array.isArray(x.retainedTask.allocationIds) ? x.retainedTask.allocationIds : []);
  const outside = []; const loop = []; const hostGrowth = new Map();
  for (const w of x.writers) {
    exact(w, ['writerId', 'profile', 'kind', 'owner', 'phases', 'allocationId', 'placement', 'compressedBytes', 'expandedMaxBytes', 'allocatedMaxBytes', 'peakMaxBytes',
      'overlapGroup', 'startSeconds', 'endSeconds', 'durationMaxSeconds', 'lifetime', 'measurementOrBoundSource', 'remainingUnknowns']);
    const required = WRITER_CATALOG.find(r => r.writerId === w.writerId);
    if (!required || ['profile', 'kind', 'owner'].some(k => w[k] !== required[k])) invalid();
    if (found.has(w.writerId)) stop('DUPLICATE_WRITER', w.writerId, w.owner); found.add(w.writerId);
    if (!Array.isArray(w.phases) || w.phases.length === 0 || w.phases.some(v => !id(v)) || !Array.isArray(w.remainingUnknowns)) invalid();
    if (w.remainingUnknowns.length) missing(`${w.writerId}.remainingUnknowns`, w.owner);
    if (w.lifetime !== 'THROUGH_ACK_OR_AUTHORIZED_CLEANUP') invalid();
    source(w.measurementOrBoundSource, `${w.writerId}.source`, w.owner);
    const known = ['compressedBytes', 'expandedMaxBytes', 'allocatedMaxBytes', 'peakMaxBytes', 'startSeconds', 'endSeconds', 'durationMaxSeconds']
      .map(k => maximum(w[k], `${w.writerId}.${k}`, w.owner)).every(Boolean);
    if (!id(w.allocationId)) missing(`${w.writerId}.allocationId`, w.owner);
    else { if (allocations.has(w.allocationId)) stop('DUPLICATE_ALLOCATION', w.writerId, w.owner); allocations.add(w.allocationId); }
    if (!id(w.overlapGroup)) missing(`${w.writerId}.overlapGroup`, w.owner);
    if (known && (w.startSeconds > w.endSeconds || w.durationMaxSeconds > w.endSeconds - w.startSeconds
      || w.endSeconds > x.time.totalMaxSeconds)) stop('OVERLAP', w.writerId, w.owner);
    if (known && (w.peakMaxBytes < w.allocatedMaxBytes || w.peakMaxBytes < w.expandedMaxBytes || w.peakMaxBytes < w.compressedBytes)) stop('OVER_BUDGET', w.writerId, w.owner, 'PEAK_BELOW_DECLARED_BYTE_MAXIMUM');
    exact(w.placement, ['storageId', 'path', 'layer']);
    const p = w.placement; const store = stores.get(p.storageId);
    if (!['LOOP', 'OUTSIDE'].includes(p.layer) || !store || !absolutePlanPath(p.path)) { stop('UNKNOWN_PLACEMENT', w.writerId, w.owner); continue; }
    if (!withinPlanPath(p.path, store.root) || !layoutKnown
      || (p.layer === 'LOOP' && (p.storageId !== x.layout.runtimeStorageId || !withinPlanPath(p.path, x.layout.loopMount)))
      || (p.layer === 'OUTSIDE' && withinPlanPath(p.path, x.layout.loopMount))
      || p.path === x.layout.loopBackingFile
      || (w.kind === 'ciphertext-D' && store.location !== 'WINDOWS_D')
      || (w.kind === 'receiver-private-C' && store.location !== 'WINDOWS_C')) stop('PLACEMENT_ESCAPE', w.writerId, w.owner);
    if (w.peakMaxBytes !== null) {
      if (p.layer === 'LOOP') loop.push(w.peakMaxBytes);
      else { outside.push(w.peakMaxBytes); hostGrowth.set(p.storageId, sum([hostGrowth.get(p.storageId) ?? 0, w.peakMaxBytes])); }
    }
  }
  for (const w of WRITER_CATALOG) if (!found.has(w.writerId)) stop('MISSING_WRITER', w.writerId, w.owner);
  const completeMaxima = reasons.length === 0;
  const loopPeak = sum(loop); const outsidePeak = sum(outside);
  const lowerBound = sum([LIMITS.filesystemBytes, outsidePeak, x.retainedTask.allocatedBytes ?? 0]);
  if (loopPeak > LIMITS.filesystemBytes - LIMITS.filesystemReserveBytes) stop('OVER_BUDGET', 'loop', 'D', 'LOOP_FREE_RESERVE');
  if (outsidePeak > LIMITS.outsideBytes || lowerBound > LIMITS.taskBytes) stop('OVER_BUDGET', 'global', 'D', 'TASK_OR_OUTSIDE_CAP');
  if (layoutKnown) hostGrowth.set(x.layout.runtimeStorageId, sum([hostGrowth.get(x.layout.runtimeStorageId) ?? 0, LIMITS.filesystemBytes]));
  for (const s of stores.values()) if (s.freeBytes !== null && s.freeBytes - (hostGrowth.get(s.storageId) ?? 0) < LIMITS.hostReserveBytes) stop('RESERVE', `storage.${s.storageId}`);
  return freezePlan({ schemaVersion: BUDGET_VERSION, evidenceMode: x.evidenceMode, planDecision: reasons.length ? 'STOP' : 'ADMITTED', reasons, missingInputs,
    execution: 'NOT_RUN', runtimeAdmission: 'NOT_RUN', enforcement: 'NOT_RUN', custodyObserved: 'NOT_RUN', quotaEnforced: false,
    accounting: 'CONSERVATIVE_ALL_PEAKS_NO_RELEASE_CREDIT_LOOP_BACKING_ONCE',
    totals: { loopContentPeakMaxBytes: completeMaxima ? loopPeak : null, outsidePeakMaxBytes: completeMaxima ? outsidePeak : null,
      globalTaskMaxBytes: completeMaxima ? lowerBound : null, knownPlannedAllocationSubtotalBytes: lowerBound,
      remainingTaskBytes: completeMaxima ? Math.max(0, LIMITS.taskBytes - lowerBound) : null },
    dependencies: x.dependencies, ledger: x.writers,
    notRun: ['actual transport', 'provision', 'install', 'build', 'backend', 'physical admission/enforcement', 'ACK/custody', 'fullgate'],
  });
}
