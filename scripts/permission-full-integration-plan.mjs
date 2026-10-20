import { createHash } from 'node:crypto';
import { Buffer } from 'node:buffer';

// D0 declaration model. No I/O, adapters, runtime imports, clock reads or grants.
// Contracts are data transcriptions of reviewed B03 and canonical source567.
const freeze = v => { if (v && typeof v === 'object') { Object.values(v).forEach(freeze); Object.freeze(v); } return v; };
export const VERSION = 'permission-full-integration-plan-v1';
export const BASE_COMMIT = '567af2191400ef559e90b3eccae0a0e4992f82e5';
export const BASE_TREE = '5b8667b4c421a7e6c47f566e1634129799a5f83d';
export const PERM_HASH = '6571509a877e3bee7f75efa6bc6488667952b6639a9abbf7fbb7d6f86c43156d';
export const PROFILES = freeze(['STATIC', 'PIN_ONBOARD', 'PIN_IDENTITY', 'PIN_CANARY', 'PG16_T01', 'SUPABASE_T02', 'SUPABASE_T04']);
export const LIMITS = freeze({ inputBytes: 262144, nodes: 24000, depth: 24, taskBytes: 21474836480, hostReserveBytes: 32212254720,
  loopBytes: 19327352832, outsideBytes: 2147483648, loopFreeBytes: 1073741824, memoryBytes: 10737418240,
  cpuQuota: 300000, cpuPeriod: 100000, swapBytes: 0, pids: 2048, runtimeSeconds: 1800, phaseSeconds: 300, maxHeavyEnvironments: 1 });
export const ERRORS = freeze(['UNSAFE_INPUT', 'INPUT_LIMIT', 'JSON', 'DUPLICATE_KEY', 'SCHEMA', 'SOURCE', 'MISSING_INPUT',
  'WRITER', 'BOUND', 'PLACEMENT', 'ALLOCATION', 'BUDGET', 'TIME', 'RESOURCE', 'COVERAGE', 'STAGE', 'RUN_ID', 'BACKEND', 'CUSTODY', 'ACK', 'RETENTION'].map(x => `INTEGRATION_${x}`));
class Refusal extends Error { constructor(code) { super(code); this.code = `INTEGRATION_${code}`; } }
const refuse = code => { throw new Refusal(code); };
const uint = v => Number.isSafeInteger(v) && v >= 0;
const hash = (v, n = 64) => typeof v === 'string' && v.length === n && /^[a-f0-9]+$/.test(v);
const id = v => typeof v === 'string' && /^[A-Za-z0-9_-]{1,100}$/.test(v);
const text = v => typeof v === 'string' && v.length > 0 && v.length <= 300 && !/[\x00-\x1f\x7f]/.test(v);
const digest = v => createHash('sha256').update(JSON.stringify(v)).digest('hex');
const exact = (v, keys) => { if (!v || typeof v !== 'object' || Array.isArray(v) || Object.keys(v).length !== keys.length || keys.some(k => !Object.hasOwn(v, k))) refuse('SCHEMA'); };
const array = v => { if (!Array.isArray(v)) refuse('SCHEMA'); };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const date = v => typeof v === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(v)
  && Number.isFinite(Date.parse(v)) && new Date(v).toISOString().replace('.000Z', 'Z') === v.replace('.000Z', 'Z');
// Portable metadata may later be materialized on Windows. Win32 device names
// remain reserved in any directory and with extensions, irrespective of case.
// Include DOS port superscript aliases and console/clock device spellings.
const deviceComponent = p => /^(?:con|prn|aux|nul|com[1-9¹²³]|lpt[1-9¹²³]|conin\$|conout\$|clock\$)(?: *\.| *$)/i.test(p);
const relative = v => text(v) && /^[A-Za-z0-9_.\/-]+$/.test(v) && !v.startsWith('/') && !v.endsWith('/')
  && !v.includes('//') && !v.split('/').some(p => ['.', '..'].includes(p) || /[. ]$/.test(p) || deviceComponent(p));
const absolute = v => text(v) && (/^\//.test(v) || /^[CD]:\//.test(v)) && !/[\\%:*?<>|]/.test(v.replace(/^[CD]:/, ''))
  && !v.includes('//') && !v.split('/').some(p => ['.', '..'].includes(p) || /[. ]$/.test(p) || (/^[CD]:\//.test(v) && deviceComponent(p)))
  && (v === '/' || /^[CD]:\/$/.test(v) || !v.endsWith('/'));
const pathKey = p => /^[CD]:/.test(p) ? p.toLowerCase() : p;
const within = (p, r) => absolute(p) && absolute(r) && (pathKey(p) === pathKey(r) || pathKey(p).startsWith(pathKey(r) + (r.endsWith('/') ? '' : '/')));

// Parse JSON ourselves to reject decoded duplicate keys BEFORE overwriting.
// The typeof check precedes every property/reflection/coercion on caller input.
function parse(input) {
  if (typeof input !== 'string') refuse('UNSAFE_INPUT');
  if (Buffer.byteLength(input, 'utf8') > LIMITS.inputBytes) refuse('INPUT_LIMIT');
  let i = 0; let nodes = 0;
  const ws = () => { while (/[ \t\r\n]/.test(input[i] ?? '') && i < input.length) i++; };
  const string = () => {
    const start = i++;
    while (i < input.length) {
      const c = input[i++];
      if (c === '"') { try { return JSON.parse(input.slice(start, i)); } catch { refuse('JSON'); } }
      if (c === '\\') i++;
    }
    refuse('JSON');
  };
  const value = depth => {
    if (++nodes > LIMITS.nodes || depth > LIMITS.depth) refuse('INPUT_LIMIT');
    ws(); const c = input[i];
    if (c === '"') return string();
    if (c === '{') {
      i++; ws(); const out = Object.create(null); const seen = new Set();
      if (input[i] === '}') { i++; return out; }
      while (i < input.length) {
        ws(); if (input[i] !== '"') refuse('JSON'); const k = string();
        if (seen.has(k)) refuse('DUPLICATE_KEY'); seen.add(k);
        if (['__proto__', 'prototype', 'constructor'].includes(k)) refuse('SCHEMA');
        ws(); if (input[i++] !== ':') refuse('JSON'); out[k] = value(depth + 1); ws();
        if (input[i] === '}') { i++; return out; } if (input[i++] !== ',') refuse('JSON');
      }
      refuse('JSON');
    }
    if (c === '[') {
      i++; ws(); const out = []; if (input[i] === ']') { i++; return out; }
      while (i < input.length) { out.push(value(depth + 1)); ws(); if (input[i] === ']') { i++; return out; } if (input[i++] !== ',') refuse('JSON'); }
      refuse('JSON');
    }
    for (const [token, v] of [['null', null], ['true', true], ['false', false]]) if (input.startsWith(token, i)) { i += token.length; return v; }
    const token = input.slice(i).match(/^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/);
    if (!token) refuse('JSON'); i += token[0].length; const n = Number(token[0]);
    if (!uint(n) || Object.is(n, -0)) refuse('SCHEMA'); return n;
  };
  const out = value(0); ws(); if (i !== input.length) refuse('JSON'); return out;
}

function context(mode = 'PLAN_ONLY') {
  const errors = []; const missingInputs = []; const seen = new Set();
  const stop = (code, field, owner = 'D') => {
    const key = `${code}:${owner}:${field}`; if (seen.has(key)) return; seen.add(key);
    errors.push({ code: `INTEGRATION_${code}`, field, owner });
    missingInputs.push({ owner, field, reason: `INTEGRATION_${code}`, nextAction: 'SUPPLY_REVIEWED_SOURCE_BOUND_DECLARATION_OR_FUTURE_AUTHORIZED_READBACK' });
  };
  return { mode, errors, missingInputs, stop };
}
const envelope = (c, details = {}) => freeze({ contractVersion: 'permission-main-prep-prd-v1', taskId: 'D0', status: 'PARTIAL',
  modelVersion: VERSION, baseCommit: BASE_COMMIT, baseTree: BASE_TREE, evidenceMode: c.mode,
  modelDecision: c.errors.length ? 'STOP' : 'MATCH', valid: false, authentication: 'NOT_PROVEN', execution: 'NOT_RUN',
  runtimeAdmission: 'NOT_RUN', fullGate: 'NOT_RUN', custodyObserved: 'NOT_RUN', effects: 0, intentionalCleanupAllowed: false,
  runtimeBinding: { runId: null, attempt: null, profile: null, stage: null, nonce: null, backendIdentity: null },
  errors: c.errors, missingInputs: c.missingInputs, ...details });
function api(input, action) {
  try { const x = parse(input); const c = context(x?.evidenceMode === 'SIMULATION' ? 'SIMULATION' : 'PLAN_ONLY'); return envelope(c, action(x, c)); }
  catch (e) { if (!(e instanceof Refusal)) throw e; const c = context(); c.stop(e.code.slice(12), 'input'); return envelope(c); }
}
function header(x, version, keys, c) {
  exact(x, ['schemaVersion', 'evidenceMode', 'baseCommit', 'baseTree', ...keys]);
  if (x.schemaVersion !== version || !['PLAN_ONLY', 'SIMULATION'].includes(x.evidenceMode)) refuse('SCHEMA');
  if (x.baseCommit !== BASE_COMMIT || x.baseTree !== BASE_TREE) c.stop('SOURCE', 'base');
}
export const INPUT_REQUIREMENTS = freeze({
  A: ['archive-seal-cipher-status-members', 'receiver-privateC-ACK-retention', 'failure-retry-peak-RAM'],
  L: ['legacy-source-lock-graph', 'transfer-unpack-install-scripts', 'build-dist-cache-server-browser-time'],
  P: ['PIN19-exact-case-file-fullName-project-identities', 'TC18-capture-control-TC19-preservation', 'outputs-members-traces-temp-concurrency-time'],
  R: ['PERM60-726occurrences-27stages', 'T04-19stages-one-physical-backend', 'TC53-three-DB-variants-WAL-reset-preservation-time'],
  D: ['global-writer-overlap-controller-supervisor', 'historical-retained-task-allocation', 'physical-storage-reserves-resource-time-bounds'] });
export const REVIEWED_INPUTS = freeze({
  A: { version: 'permission-transport-model-v1', path: 'receipts/bounds-for-b.json', sha256: '7c2f5ecf98322d0a8c7f7435bd5f74740a430b905def354b8df533e38cd5f4b7', candidateSha256: '2686c9384422bba462c60482ad48fa6b91622c1710c30b5b087cd6207f1fdb0a' },
  B: { version: 'permission-full-budget-plan-v1', path: 'scripts/permission-full-budget-plan.mjs', sha256: '7cb9f798b92edcf1e893c8c5cd36f3d33c9ad4bf7bfd9f57c6621f04a83ebb3b', candidateSha256: '2216e89b5997629e6464da8b44d027f5deeb7a353740ab1cdfe16a0ccb377250' },
  L: { version: 'permission-legacy-bounds-v1', path: 'payload/bounds-to-b.json', sha256: '8d689f484b4dc5c7fd44a76692f0a61ec50beece2f81d907c25ddc39c38ada02', candidateSha256: '37c1ce63a05855a3029067eafd11ac4a2ab43467e20bc0de088fe98a07f5df27' } });
function bindings(rows, c) {
  array(rows); const map = new Map();
  for (const b of rows) {
    exact(b, ['owner', 'version', 'path', 'sha256', 'candidateSha256', 'covers']); array(b.covers);
    if (!['A', 'B', 'L', 'P', 'R', 'D'].includes(b.owner) || map.has(b.owner) || b.covers.some(k => !text(k)) || new Set(b.covers).size !== b.covers.length) refuse('SCHEMA');
    map.set(b.owner, b);
    if (b.version === 'UNKNOWN') { if (b.path !== null || b.sha256 !== null || b.candidateSha256 !== null || b.covers.length) refuse('SCHEMA'); c.stop('MISSING_INPUT', 'bindings', b.owner); continue; }
    if (!text(b.version) || !relative(b.path) || !hash(b.sha256) || !hash(b.candidateSha256)) refuse('SCHEMA');
    if (Object.hasOwn(REVIEWED_INPUTS, b.owner) && Object.keys(REVIEWED_INPUTS[b.owner]).some(k => b[k] !== REVIEWED_INPUTS[b.owner][k])) c.stop('SOURCE', 'bindings', b.owner);
    if (b.owner !== 'B' && (b.covers.some(k => !INPUT_REQUIREMENTS[b.owner].includes(k)) || INPUT_REQUIREMENTS[b.owner].some(k => !b.covers.includes(k)))) c.stop('MISSING_INPUT', 'bindingCoverage', b.owner);
    if (b.owner === 'B' && b.covers.length) refuse('SCHEMA');
  }
  for (const owner of ['A', 'B', 'L', 'P', 'R', 'D']) if (!map.has(owner)) c.stop('MISSING_INPUT', 'bindings', owner);
  return map;
}
const globals = [['source-worktrees-control-index', 'D'], ['tools-transfer', 'L'], ['tools-unpack', 'L'], ['controller-supervisor-logs', 'D'],
  ['ciphertext-D', 'A'], ['receiver-private-C', 'A'], ['ACK-global-retention', 'A'], ['failure-retry-retention', 'D']];
const kinds = [['source-copy', 'D'], ['legacy-npm-dependencies', 'L'], ['legacy-npm-cache', 'L'], ['legacy-install-scripts', 'L'],
  ['candidate-npm-dependencies', 'D'], ['candidate-npm-cache', 'D'], ['candidate-install-scripts', 'D'], ['candidate-build-dist-server', 'D'],
  ['browser-binary-cache-profile', 'P'], ['browser-trace-screenshot-temp', 'P'], ['legacy-unpack-build-dist-server', 'L'],
  ['docker-compressed-transfer', 'D'], ['docker-expanded-layers', 'D'], ['containerd-snapshots', 'D'], ['container-writable-logs', 'D'],
  ['DB-data-WAL-reset', 'R'], ['stdout-stderr', 'D'], ['evidence-members-closure', 'R']];
export const WRITER_CATALOG = freeze([...globals.map(([kind, owner]) => ({ writerId: `GLOBAL_${kind}`, profile: 'GLOBAL', kind, owner })),
  ...PROFILES.flatMap(profile => kinds.map(([kind, owner]) => ({ writerId: `${profile}_${kind}`, profile, kind,
    owner: /^(browser-|DB-|evidence-)/.test(kind) ? (profile === 'STATIC' ? 'D' : profile.startsWith('PIN_') ? 'P' : 'R') : owner })))]);
const L_FIELDS = { 'tools-transfer': ['rows.source-archive', 'rows.tool-runtime', 'rows.dependency-transfer'], 'tools-unpack': ['rows.dependency-unpack', 'rows.tool-runtime'],
  'legacy-npm-dependencies': ['rows.dependency-transfer', 'rows.dependency-unpack'], 'legacy-npm-cache': ['rows.npm-cache'],
  'legacy-install-scripts': ['rows.install-scripts'], 'legacy-unpack-build-dist-server': ['rows.build-temp', 'rows.dist', 'rows.preview-server'] };
export const WRITER_MAPPING = freeze(WRITER_CATALOG.map(w => ({ ...w, sourceFields: w.owner === 'A'
  ? ({ 'ciphertext-D': ['profiles.*.bounds.cipherDAllocatedMaxBytes'], 'receiver-private-C': ['profiles.*.bounds.privateCAllocatedMaxBytes'],
    'ACK-global-retention': ['profiles.*.bounds.ackAllocatedMaxBytes', 'profiles.*.bounds.globalRetainedAllocatedMaxBytes', 'profiles.*.bounds.failurePathOverheadMaxBytes'] })[w.kind]
  : w.owner === 'L' ? L_FIELDS[w.kind] : [`${w.owner}.profiles.${w.profile}.${w.kind}`],
  aggregation: w.owner === 'A' || w.owner === 'L' ? 'CONSERVATIVE_SUM_REQUIRES_ALL_COMPONENT_MAXIMA' : 'OWNED_WRITER_DECLARATION',
  requiredSupplement: 'compressed/expanded/allocated/peak/placement/physical/time/lifetime/failure/source required; UNKNOWN never inferred from logical size' })));
const W_KEYS = ['writerId', 'profile', 'kind', 'owner', 'phases', 'allocationId', 'placement', 'compressedBytes', 'expandedMaxBytes', 'allocatedMaxBytes', 'peakMaxBytes',
  'overlapGroup', 'startSeconds', 'endSeconds', 'durationMaxSeconds', 'lifetime', 'measurementOrBoundSource', 'remainingUnknowns'];
const MAX_KEYS = ['compressedBytes', 'expandedMaxBytes', 'allocatedMaxBytes', 'peakMaxBytes', 'startSeconds', 'endSeconds', 'durationMaxSeconds'];
function unknownWriter(w) { return { ...w, phases: [w.profile === 'GLOBAL' ? 'TASK_LIFETIME' : w.profile], allocationId: null,
  placement: { storageId: null, path: null, layer: null }, compressedBytes: null, expandedMaxBytes: null, allocatedMaxBytes: null, peakMaxBytes: null,
  overlapGroup: null, startSeconds: null, endSeconds: null, durationMaxSeconds: null, lifetime: 'THROUGH_ACK_OR_AUTHORIZED_CLEANUP',
  measurementOrBoundSource: null, remainingUnknowns: ['UNKNOWN'] }; }
function budget(x, c) {
  header(x, 'permission-full-integration-budget-v1', ['bindings', 'writers', 'layout', 'storage', 'retainedTask', 'time', 'resources'], c);
  const deps = bindings(x.bindings, c); const source = (s, owner, field) => {
    if (s === null) { c.stop('MISSING_INPUT', field, owner); return false; }
    exact(s, ['owner', 'version', 'path', 'sha256', 'kind']); const b = deps.get(owner);
    if (!text(s.version) || !relative(s.path) || !hash(s.sha256) || !['BOUND', 'SIMULATION'].includes(s.kind) || s.owner !== owner) refuse('SCHEMA');
    if (!b || ['version', 'path', 'sha256'].some(k => s[k] !== b[k]) || (s.kind === 'SIMULATION' && x.evidenceMode !== 'SIMULATION')) { c.stop('SOURCE', field, owner); return false; }
    // The pinned A01/L02 bounds explicitly contain UNKNOWN maxima. Merely
    // attaching their digest to invented numbers cannot upgrade them to BOUND.
    if (['A', 'L'].includes(owner) && s.kind !== 'SIMULATION') { c.stop('BOUND', 'reviewedBoundsRemainUnknown', owner); return false; }
    return true;
  };
  const max = (v, field, owner = 'D') => { if (v === null) { c.stop('BOUND', field, owner); return false; } if (!uint(v)) refuse('SCHEMA'); return true; };
  const sum = a => { let n = 0; for (const v of a) { n += v; if (!uint(n)) refuse('BOUND'); } return n; };
  exact(x.layout, ['root', 'loopMount', 'loopBackingFile', 'runtimeStorageId']);
  const l = x.layout; const layoutKnown = absolute(l.root) && l.root.startsWith('/') && l.loopMount === `${l.root}/data` && l.loopBackingFile === `${l.root}/data.img` && id(l.runtimeStorageId);
  if (!layoutKnown) c.stop('PLACEMENT', 'layout');
  array(x.storage); const stores = new Map(); const physical = new Set();
  for (const s of x.storage) {
    exact(s, ['storageId', 'location', 'hostId', 'physicalIdentity', 'root', 'freeBytes', 'source']);
    if (!id(s.storageId) || stores.has(s.storageId) || !['WINDOWS_C', 'WINDOWS_D', 'CLOUD_RUNTIME'].includes(s.location)) refuse('SCHEMA');
    stores.set(s.storageId, s); max(s.freeBytes, 'storage.freeBytes'); source(s.source, 'D', 'storage.source');
    if (!text(s.hostId) || !text(s.physicalIdentity) || !absolute(s.root)) c.stop('PLACEMENT', 'storage.identity');
    else { const key = `${s.hostId}:${s.physicalIdentity}`; if (physical.has(key)) c.stop('ALLOCATION', 'storage.alias'); physical.add(key);
      if ((s.location === 'WINDOWS_C' && !s.root.startsWith('C:/')) || (s.location === 'WINDOWS_D' && !s.root.startsWith('D:/')) || (s.location === 'CLOUD_RUNTIME' && !s.root.startsWith('/'))) c.stop('PLACEMENT', 'storage.root'); }
  }
  for (const loc of ['WINDOWS_C', 'WINDOWS_D', 'CLOUD_RUNTIME']) if ([...stores.values()].filter(s => s.location === loc).length !== 1) c.stop('PLACEMENT', `storage.${loc}`);
  if (layoutKnown && (!stores.has(l.runtimeStorageId) || stores.get(l.runtimeStorageId).location !== 'CLOUD_RUNTIME' || !within(l.root, stores.get(l.runtimeStorageId).root))) c.stop('PLACEMENT', 'layout.runtime');
  exact(x.retainedTask, ['allocatedBytes', 'source', 'allocationIds']); max(x.retainedTask.allocatedBytes, 'retainedTask.allocatedBytes'); source(x.retainedTask.source, 'D', 'retainedTask.source');
  const allocations = new Set();
  if (x.retainedTask.allocationIds === null) c.stop('MISSING_INPUT', 'retainedTask.allocationIds');
  else { array(x.retainedTask.allocationIds); for (const a of x.retainedTask.allocationIds) { if (!id(a) || allocations.has(a)) refuse('ALLOCATION'); allocations.add(a); } }
  exact(x.time, ['totalMaxSeconds', 'phaseMaxSeconds', 'profileWindows', 'source']);
  max(x.time.totalMaxSeconds, 'time.totalMaxSeconds'); max(x.time.phaseMaxSeconds, 'time.phaseMaxSeconds'); source(x.time.source, 'D', 'time.source');
  if (x.time.totalMaxSeconds > LIMITS.runtimeSeconds || x.time.phaseMaxSeconds > LIMITS.phaseSeconds || (x.time.totalMaxSeconds !== null && x.time.phaseMaxSeconds > x.time.totalMaxSeconds)) c.stop('TIME', 'time.maxima');
  const windows = new Map();
  if (x.time.profileWindows === null) c.stop('MISSING_INPUT', 'time.profileWindows');
  else { array(x.time.profileWindows); for (const w of x.time.profileWindows) { exact(w, ['profile', 'startSeconds', 'endSeconds']);
    if (!PROFILES.includes(w.profile) || windows.has(w.profile) || !uint(w.startSeconds) || !uint(w.endSeconds)) refuse('SCHEMA'); windows.set(w.profile, w); }
    let end = 0; for (const p of PROFILES) { const w = windows.get(p); if (!w) c.stop('MISSING_INPUT', `time.${p}`); else { if (w.startSeconds < end || w.endSeconds < w.startSeconds || w.endSeconds > x.time.totalMaxSeconds) c.stop('TIME', `time.${p}`); end = w.endSeconds; } } }
  exact(x.resources, ['cpuQuota', 'cpuPeriod', 'memoryPeakBytes', 'swapBytes', 'pidsPeak', 'maxHeavyEnvironments', 'source']);
  for (const k of ['cpuQuota', 'cpuPeriod', 'swapBytes', 'maxHeavyEnvironments']) if (!uint(x.resources[k])) refuse('SCHEMA');
  max(x.resources.memoryPeakBytes, 'resources.memoryPeakBytes'); max(x.resources.pidsPeak, 'resources.pidsPeak'); source(x.resources.source, 'D', 'resources.source');
  if (x.resources.cpuQuota !== LIMITS.cpuQuota || x.resources.cpuPeriod !== LIMITS.cpuPeriod || x.resources.swapBytes !== 0 || x.resources.maxHeavyEnvironments !== 1
    || x.resources.memoryPeakBytes >= LIMITS.memoryBytes || x.resources.pidsPeak >= LIMITS.pids) c.stop('RESOURCE', 'resources');
  array(x.writers); const supplied = new Map();
  for (const w of x.writers) { exact(w, [...W_KEYS, 'sourceFields']);
    const cat = WRITER_MAPPING.find(v => v.writerId === w.writerId);
    if (!cat || supplied.has(w.writerId) || ['profile', 'kind', 'owner'].some(k => w[k] !== cat[k]) || !same(w.sourceFields, cat.sourceFields)) refuse('WRITER'); supplied.set(w.writerId, w); }
  const loop = []; const outside = []; const hostGrowth = new Map(); const writerReady = new Map(); const paths = new Set();
  const writers = WRITER_CATALOG.map(cat => {
    const given = supplied.get(cat.writerId); if (!given) c.stop('WRITER', cat.writerId, cat.owner);
    const w = given ? Object.fromEntries(W_KEYS.map(k => [k, given[k]])) : unknownWriter(cat); const before = c.errors.length;
    array(w.phases); array(w.remainingUnknowns);
    if (!same(w.phases, [cat.profile === 'GLOBAL' ? 'TASK_LIFETIME' : cat.profile]) || w.remainingUnknowns.some(v => !text(v)) || w.lifetime !== 'THROUGH_ACK_OR_AUTHORIZED_CLEANUP') refuse('SCHEMA');
    if (w.remainingUnknowns.length) c.stop('MISSING_INPUT', `${cat.writerId}.remainingUnknowns`, cat.owner);
    const sourced = source(w.measurementOrBoundSource, cat.owner, `${cat.writerId}.source`);
    const known = MAX_KEYS.map(k => max(w[k], `${cat.writerId}.${k}`, cat.owner)).every(Boolean);
    if (!id(w.allocationId)) c.stop('ALLOCATION', `${cat.writerId}.allocationId`, cat.owner);
    else { if (allocations.has(w.allocationId)) c.stop('ALLOCATION', `${cat.writerId}.duplicate`, cat.owner); allocations.add(w.allocationId); }
    if (!id(w.overlapGroup)) c.stop('MISSING_INPUT', `${cat.writerId}.overlapGroup`, cat.owner);
    if (known && (w.startSeconds > w.endSeconds || w.durationMaxSeconds > w.endSeconds - w.startSeconds || w.endSeconds > x.time.totalMaxSeconds)) c.stop('TIME', `${cat.writerId}.lifetime`, cat.owner);
    const win = windows.get(cat.profile);
    // endSeconds covers retained writes through ACK; profile execution must fit its window.
    if (known && cat.profile !== 'GLOBAL' && (!win || w.startSeconds < win.startSeconds || w.startSeconds + w.durationMaxSeconds > win.endSeconds)) c.stop('TIME', `${cat.writerId}.window`, cat.owner);
    if (known && [w.compressedBytes, w.expandedMaxBytes, w.allocatedMaxBytes].some(n => n > w.peakMaxBytes)) c.stop('BUDGET', `${cat.writerId}.peak`, cat.owner);
    exact(w.placement, ['storageId', 'path', 'layer']); const p = w.placement; const store = stores.get(p.storageId);
    const placed = ['LOOP', 'OUTSIDE'].includes(p.layer) && store && absolute(p.path) && absolute(store.root) && layoutKnown;
    if (!placed) c.stop('PLACEMENT', cat.writerId, cat.owner);
    else {
      if (!within(p.path, store.root) || (p.layer === 'LOOP' && (p.storageId !== l.runtimeStorageId || !within(p.path, l.loopMount)))
        || (p.layer === 'OUTSIDE' && within(p.path, l.loopMount)) || pathKey(p.path) === pathKey(l.loopBackingFile)
        || (cat.kind === 'ciphertext-D' && store.location !== 'WINDOWS_D') || (cat.kind === 'receiver-private-C' && store.location !== 'WINDOWS_C')) c.stop('PLACEMENT', cat.writerId, cat.owner);
      const pk = `${p.storageId}:${pathKey(p.path)}`; if (paths.has(pk)) c.stop('ALLOCATION', `${cat.writerId}.pathAlias`, cat.owner); paths.add(pk);
      if (w.peakMaxBytes !== null) { if (p.layer === 'LOOP') loop.push(w.peakMaxBytes); else { outside.push(w.peakMaxBytes); hostGrowth.set(p.storageId, sum([hostGrowth.get(p.storageId) ?? 0, w.peakMaxBytes])); } }
    }
    writerReady.set(cat.writerId, Boolean(given) && sourced && known && placed && c.errors.length === before); return w;
  });
  const loopPeak = sum(loop); const outsidePeak = sum(outside); const subtotal = sum([LIMITS.loopBytes, outsidePeak, x.retainedTask.allocatedBytes ?? 0]);
  if (loopPeak > LIMITS.loopBytes - LIMITS.loopFreeBytes || outsidePeak > LIMITS.outsideBytes || subtotal > LIMITS.taskBytes) c.stop('BUDGET', 'accounting');
  if (layoutKnown) hostGrowth.set(l.runtimeStorageId, sum([hostGrowth.get(l.runtimeStorageId) ?? 0, LIMITS.loopBytes]));
  // Retained placement is not supplied by B03. Keep its physical allocation as
  // a missing D input whenever positive; never pretend global bytes locate it.
  if (x.retainedTask.allocatedBytes > 0) c.stop('PLACEMENT', 'retainedTask.physicalAllocation');
  for (const s of stores.values()) if (s.freeBytes !== null && s.freeBytes - (hostGrowth.get(s.storageId) ?? 0) < LIMITS.hostReserveBytes) c.stop('BUDGET', 'storage.reserve');
  const dependencies = Object.entries(INPUT_REQUIREMENTS).map(([owner, required]) => {
    const b = deps.get(owner); const ok = b && b.version !== 'UNKNOWN' && required.every(k => b.covers.includes(k))
      && !c.errors.some(e => e.owner === owner) && writers.filter(w => w.owner === owner).every(w => writerReady.get(w.writerId));
    return { owner, status: ok ? 'BOUNDED' : 'UNKNOWN', version: b?.version === 'UNKNOWN' ? null : b?.version ?? null,
      sha256: b?.sha256 ?? null, covers: b?.covers ?? [], required: [...required] };
  });
  return { mappingVersion: 'permission-full-integration-writer-map-v1', writerMapping: WRITER_MAPPING,
    mappedDeclarations: { schemaVersion: 'permission-full-budget-plan-v1', baseCommit: BASE_COMMIT, baseTree: BASE_TREE, evidenceMode: x.evidenceMode,
      dependencies, layout: x.layout, storage: x.storage, retainedTask: x.retainedTask, time: x.time, resources: x.resources, writers },
    accounting: { method: 'ALL_PEAKS_NO_RELEASE_CREDIT_LOOP_BACKING_ONCE', technicalQuotaEnforced: false,
      loopContentMaxBytes: c.errors.length ? null : loopPeak, outsideMaxBytes: c.errors.length ? null : outsidePeak,
      globalMaxBytes: c.errors.length ? null : subtotal, knownPlannedAllocationSubtotalBytes: subtotal } };
}
export const mapBudgetInputs = input => api(input, budget);

const staticStages = ['candidate-unit', 'foundation-unit', 'legacy-t01-tools', 'candidate-seed-tools'];
const t02Stages = ['bridge-bridge-database', 'candidate-bridge-database', 'foundation-database'];
const t04Stages = ['identity-database', 'candidate-images-service', 'administration-database', 'read-database', 'clear-demo-database', 'candidate-signals-database',
  'financial-database', 'candidate-print-database', 'candidate-bulk-concurrency-database', 'candidate-e2e', 'candidate-seed-recovery-database', 'candidate-roles-e2e',
  'realtime-e2e', 'rollback-additive-database', 'rollback-preflight-database', 'rollback-recovery-database', 'transition-database', 'transition-e2e', 'transition-compatibility-database'];
export const STAGE_MAPPING = freeze([...staticStages.map(stage => ({ stage, permissionProfile: stage === 'legacy-t01-tools' ? 'legacy' : 'candidate', runtimeProfile: 'STATIC' })),
  { stage: 'legacy-t01-database', permissionProfile: 'legacy', runtimeProfile: 'PG16_T01' }, ...t02Stages.map(stage => ({ stage, permissionProfile: 'bridge', runtimeProfile: 'SUPABASE_T02' })),
  ...t04Stages.map(stage => ({ stage, permissionProfile: /^(rollback|transition)-/.test(stage) ? 'transition' : 'candidate', runtimeProfile: 'SUPABASE_T04' }))]);
export const RUNTIME_CONTRACTS = freeze({ sourcePolicySha256: 'efa9e4ba861b4e7268e7efaeeaeeb123a9cef4541bb9bd6adb43b9f4a400f0ae',
  observed: 'NOT_RUN', order: PROFILES, maxHeavyEnvironments: 1,
  rootMapping: ['OWNED_NONCE_LABEL', 'HOST_UNIT_LSTAT_STAT_REALPATH_DEVICE_INODE_OWNER_MODE0700_MATCH', 'NO_SYMLINK_NO_PREEXISTING_SUBMOUNTS', 'PrivateTmp=yes', 'BindPaths=root:root:norbind', 'NO_IGNORE_MISSING_SOURCE'],
  topology: ['db', 'auth', 'rest', 'kong', 'storage', 'realtime', 'edge_runtime', 'studio', 'pg_meta', 'inbucket', 'vector', 'analytics'],
  services: 'CLI2.117.0/PG17/LOOPBACK_ONLY/com.supabase.cli.project/owned-db-volume-and-network/unchanged-fixed-guard-aliases',
  PIN_ONBOARD: 'MANUAL_001_016/EMPTY_ACTIVATION/NO_PUBLIC_STORES/existingEnvRefused',
  PIN_IDENTITY: 'PG17/MANUAL_001_016/LEGACY_AUTH_CATALOG_ACL/exactAclPreflight/private-alias-MUST-BE-ABSENT',
  PIN_CANARY: 'PG17/CLI_16_EMPTY_SEED_FILE/exclusive-zero-byte-stack/supabase/seed.sql/postgres-cliMigrations16-tenantEmpty-auth0-storage0/never-seeded-pilot',
  PG16_T01: 'VERIFIED_NATIVE_PG16/observerOnly/SHOW-data-directory-match/loopback-admin-postgres/exact-test-db-and-alias-pattern/NO-API-Auth-Storage-Realtime-CLAIM',
  SUPABASE_T02: 'PG17/MANUAL_001_016/LEGACY_AUTH_CATALOG/three-stages',
  SUPABASE_T04: 'PG17/MANUAL_001_016/LEGACY_AUTH_CATALOG/3buckets-6objects-GET-hash/realtime-ready-before-baseline/19-same-physical-backend/only-reviewed-logical-reset-boundaries',
  aliases: ['PIN profiles cliAlias=/var/tmp/pos-cafe-perm-s31-t04-20261013/bin/supabase', 'PIN_IDENTITY privateAlias=/var/tmp/pos-cafe-perm-s31-identity-20261013/private',
    'SUPABASE aliases=/var/tmp/pos-cafe-perm-s31-{onboard,identity,canary,t02,t04}-20261013/{stack,bin/supabase}', 'PG16_T01 ^/var/tmp/pos-cafe-perm-t01-[a-z0-9-]+$'],
  configPins: {
    PIN_ONBOARD: { path: 'tests/permissions/runtime/onboarding.toml', sha256: '75413257628c2b2ec564faa272afeddcc70595254d0cda2ff34476f23bcd8852' },
    PIN_IDENTITY: { path: 'tests/permissions/runtime/identity-close1.toml', sha256: '0a44581147294c20bf1779207ee121c857934063927306857dd66e5a8c62d435' },
    PIN_CANARY: { derivation: 'TC19_EXACT_REPLACEMENTS_OF_IDENTITY_CONFIG_KEEP_SEED_DISABLED_NOOP_COMMENT', sha256: '0c4f1e1c26cc53335c750b9cc6cf93a095478fa7f05fed4f2f08f7d876dd2405' },
    SUPABASE_T02: { path: 'tests/permissions/runtime/config.toml', sha256: '4aa08380ee7d58eddbc264e002087db88d5b90d514c3af0163dffbd06b513e2b' },
    SUPABASE_T04: { path: 'tests/permissions/runtime/identity.toml', sha256: '41908625aed32f7ccb0071e5128e6b76c3642ff1acb14df96fb78978c834ed13' }
  },
  PG16_DATABASE_NAME: '^pos_cafe_idem_test_perm_[a-f0-9]{12}$',
  actualProvisioning: 'NEEDS_PORT_NOT_AUTHORIZED_D0' });
const TC53 = ['rollback-additive-database', 'rollback-preflight-database', 'rollback-recovery-database'];
function stages(rows, c) {
  array(rows); const seen = new Set();
  for (const r of rows) { exact(r, ['stage', 'permissionProfile', 'runtimeProfile']); const expected = STAGE_MAPPING.find(s => s.stage === r.stage);
    if (!expected || seen.has(r.stage) || ['permissionProfile', 'runtimeProfile'].some(k => r[k] !== expected[k])) refuse('STAGE'); seen.add(r.stage); }
  if (seen.size !== 27) c.stop('STAGE', 'stages', 'R');
}
function integration(x, c) {
  header(x, VERSION, ['bindings', 'coverage', 'stages', 'run', 'backends', 'budget', 'custody'], c); bindings(x.bindings, c); stages(x.stages, c);
  if (x.coverage === null) { c.stop('MISSING_INPUT', 'coverage', 'P'); c.stop('MISSING_INPUT', 'coverage', 'R'); }
  else { const cov = x.coverage; exact(cov, ['pinCaseIds', 'pinManifestSha256', 'pinIdentitiesSha256', 'permCases', 'permOccurrences', 'permManifestSha256', 'tc53Stages']); array(cov.pinCaseIds); array(cov.tc53Stages);
    if (cov.pinCaseIds.some(v => typeof v !== 'string') || cov.tc53Stages.some(v => typeof v !== 'string')) refuse('SCHEMA');
    if (!same([...cov.pinCaseIds].sort(), Array.from({ length: 19 }, (_, i) => `TC-PIN-${String(i + 1).padStart(2, '0')}`)) || !hash(cov.pinManifestSha256) || !hash(cov.pinIdentitiesSha256)) c.stop('COVERAGE', 'coverage.PIN19', 'P');
    if (cov.permCases !== 60 || cov.permOccurrences !== 726 || cov.permManifestSha256 !== PERM_HASH || !same([...cov.tc53Stages].sort(), [...TC53].sort())) c.stop('COVERAGE', 'coverage.PERM60_TC53', 'R'); }
  if (x.run === null) c.stop('MISSING_INPUT', 'run');
  else { exact(x.run, ['workflowRunId', 'attempt', 'nonce', 'executions']);
    if (typeof x.run.workflowRunId !== 'string' || !/^[1-9][0-9]{0,19}$/.test(x.run.workflowRunId) || !uint(x.run.attempt) || x.run.attempt < 1 || x.run.attempt > 1000 || !hash(x.run.nonce, 32)) refuse('RUN_ID');
    array(x.run.executions); const ids = new Set(); const seen = new Set();
    for (const e of x.run.executions) { exact(e, ['stage', 'permissionProfile', 'runtimeProfile', 'stageExecutionRunId']); const s = STAGE_MAPPING.find(r => r.stage === e.stage);
      if (!s || seen.has(e.stage) || ['permissionProfile', 'runtimeProfile'].some(k => e[k] !== s[k])) refuse('STAGE'); seen.add(e.stage);
      if (typeof e.stageExecutionRunId !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(e.stageExecutionRunId) || ids.has(e.stageExecutionRunId)) refuse('RUN_ID'); ids.add(e.stageExecutionRunId); }
    if (seen.size !== 27) c.stop('STAGE', 'run.executions');
    if (c.mode !== 'SIMULATION') c.stop('RUN_ID', 'run.unobservedDeclaration'); }
  array(x.backends); const backends = new Map(); const intervals = new Map();
  for (const b of x.backends) { exact(b, ['stage', 'runtimeProfile', 'backendId', 'storageId', 'startSeconds', 'endSeconds']); const s = STAGE_MAPPING.find(v => v.stage === b.stage);
    if (!s || s.runtimeProfile === 'STATIC' || b.runtimeProfile !== s.runtimeProfile || backends.has(b.stage) || !id(b.backendId) || !id(b.storageId) || !uint(b.startSeconds) || !uint(b.endSeconds)) refuse('BACKEND'); backends.set(b.stage, b);
    if (b.startSeconds > b.endSeconds || b.endSeconds > LIMITS.runtimeSeconds) c.stop('TIME', 'backend.intervals');
    const all = intervals.get(b.runtimeProfile) ?? []; all.push(b); intervals.set(b.runtimeProfile, all); }
  if (backends.size !== 23) c.stop('MISSING_INPUT', 'backendDeclarations', 'R');
  const first = backends.get(t04Stages[0]);
  for (const name of t04Stages) { const b = backends.get(name); if (!b || !first || b.backendId !== first.backendId || b.storageId !== first.storageId) c.stop('BACKEND', 'T04.samePhysicalDeclared', 'R'); }
  let previousEnd = 0;
  for (const profile of ['PG16_T01', 'SUPABASE_T02', 'SUPABASE_T04']) {
    const ordered = STAGE_MAPPING.filter(s => s.runtimeProfile === profile).map(s => backends.get(s.stage)).filter(Boolean);
    for (const b of ordered) { if (b.startSeconds < previousEnd) c.stop('BACKEND', 'serviceOverlapOrOrder', 'R'); previousEnd = Math.max(previousEnd, b.endSeconds); }
  }
  let budgetResult = null; let custodyResult = null;
  if (x.budget === null) c.stop('MISSING_INPUT', 'budget'); else {
    if (!same(x.budget.bindings, x.bindings) || x.budget.evidenceMode !== x.evidenceMode) c.stop('SOURCE', 'budget.bindings');
    budgetResult = budget(x.budget, c);
    if (Array.isArray(x.budget.time.profileWindows)) for (const b of backends.values()) {
      const w = x.budget.time.profileWindows.find(w => w.profile === b.runtimeProfile);
      if (!w || b.startSeconds < w.startSeconds || b.endSeconds > w.endSeconds) c.stop('TIME', 'backend.profileWindow', 'R');
    }
  }
  if (x.custody === null) c.stop('MISSING_INPUT', 'custody', 'A'); else {
    if (!x.custody || typeof x.custody !== 'object') refuse('SCHEMA');
    if (x.custody.evidenceMode !== x.evidenceMode) c.stop('SOURCE', 'custody.mode', 'A');
    if (x.run && x.custody.binding && (x.custody.binding.runId !== x.run.workflowRunId || x.custody.binding.attempt !== x.run.attempt || x.custody.binding.nonce !== x.run.nonce)) c.stop('CUSTODY', 'custody.runBinding', 'A');
    custodyResult = custody(x.custody, c);
  }
  return { declaredCompatibilityOnly: true, expectedStages: STAGE_MAPPING, runtimeContracts: RUNTIME_CONTRACTS,
    mappedBudget: budgetResult, custodyPlan: custodyResult, closureLedger: CLOSURE_LEDGER };
}
export const integrationPlan = input => api(input, integration);

export const CUSTODY_FIELDS = freeze(['repository', 'repositoryId', 'runId', 'attempt', 'sourceSha', 'profile', 'nonce', 'permissionFingerprint',
  'lockSha256', 'recipeSha256', 'artifactId', 'cipherSha256', 'cipherBytes', 'archiveSha256', 'manifestSha256', 'closureSha256', 'closedAt']);
export const LIFECYCLE = freeze(['SOURCE_FROZEN', 'PREFLIGHT_ADMITTED', 'PROFILE_EXECUTING', 'CLOSED_PRIVATE_EVIDENCE', 'SEALED', 'RECEIVED_CIPHER_D',
  'VERIFIED_OPEN_PRIVATE_C', 'VERIFIED_MEMBER_CLOSURE', 'OWNER_ACK_VERIFIED', 'RETENTION_RECORDED', 'CLEANUP_ELIGIBLE']);
function custody(x, c) {
  header(x, 'permission-full-integration-custody-v1', ['binding', 'steps', 'ackQuery', 'retention', 'now'], c);
  array(x.steps); if (!date(x.now)) refuse('SCHEMA');
  if (x.binding === null) { c.stop('MISSING_INPUT', 'custody.binding', 'A'); if (x.steps.length || x.ackQuery !== null || x.retention !== null) refuse('CUSTODY');
    return { lifecycleVersion: 'permission-full-integration-lifecycle-v1', lifecycle: LIFECYCLE, custodyFields: CUSTODY_FIELDS, observed: 'NOT_RUN', declaredBindingSha256: null }; }
  const b = x.binding; exact(b, CUSTODY_FIELDS);
  if (b.repository !== 'nguyentronglinh045/pos-cafe' || b.repositoryId !== 1263057386 || b.sourceSha !== BASE_COMMIT || !PROFILES.includes(b.profile)
    || typeof b.runId !== 'string' || !/^[1-9][0-9]{0,19}$/.test(b.runId) || !uint(b.attempt) || b.attempt < 1 || b.attempt > 1000 || !hash(b.nonce, 32)
    || !uint(b.artifactId) || b.artifactId < 1 || !uint(b.cipherBytes) || b.cipherBytes < 1 || b.cipherBytes > 268435456 || !date(b.closedAt) || Date.parse(b.closedAt) > Date.parse(x.now)) refuse('CUSTODY');
  for (const field of ['permissionFingerprint', 'lockSha256', 'recipeSha256', 'cipherSha256', 'archiveSha256', 'manifestSha256', 'closureSha256']) if (!hash(b[field])) refuse('CUSTODY');
  const bindingHash = digest(CUSTODY_FIELDS.map(k => b[k]));
  const commitment = digest(['permission-custody-ack-v1', ...CUSTODY_FIELDS.map(k => b[k])]);
  const descriptor = { context: `pos-perm-custody/${b.runId}/${b.attempt}/${PROFILES.indexOf(b.profile)}/${b.nonce}`,
    description: `sha256:${commitment}`, target_url: `https://github.com/nguyentronglinh045/pos-cafe/actions/runs/${b.runId}` };
  if (x.steps.length !== LIFECYCLE.length) c.stop('CUSTODY', 'custody.lifecycle', 'A');
  let previous = 0;
  for (let i = 0; i < x.steps.length; i++) {
    const s = x.steps[i]; exact(s, ['state', 'receiptSha256', 'bindingSha256', 'at', 'placement', 'mode']);
    if (s.state !== LIFECYCLE[i] || !hash(s.receiptSha256) || s.bindingSha256 !== bindingHash || !date(s.at) || !['PLAN_ONLY', 'SIMULATION'].includes(s.mode)
      || ![null, 'PRIVATE_C', 'CIPHER_D'].includes(s.placement)) refuse('CUSTODY');
    const at = Date.parse(s.at); if (at < previous || at > Date.parse(x.now)) c.stop('CUSTODY', 'custody.timeOrder', 'A'); previous = at;
    if (s.mode !== x.evidenceMode || x.evidenceMode !== 'SIMULATION') c.stop('CUSTODY', 'custody.unauthenticatedReceipts', 'A');
    if ([3, 6, 7].includes(i) && s.placement !== 'PRIVATE_C' || i === 5 && s.placement !== 'CIPHER_D') c.stop('PLACEMENT', 'custody.privacy', 'A');
    if (i === 3 && at !== Date.parse(b.closedAt)) c.stop('CUSTODY', 'custody.closedAt', 'A');
  }
  let latest = null;
  if (x.ackQuery === null) c.stop('MISSING_INPUT', 'custody.ACK', 'A');
  else { const q = x.ackQuery; exact(q, ['repositoryId', 'queriedSha', 'complete', 'statuses', 'mode']); array(q.statuses);
    if (typeof q.complete !== 'boolean' || !['PLAN_ONLY', 'SIMULATION'].includes(q.mode) || q.statuses.length > 10000) refuse('ACK');
    if (q.repositoryId !== 1263057386 || q.queriedSha !== b.sourceSha || q.complete !== true || q.mode !== x.evidenceMode || c.mode !== 'SIMULATION') c.stop('ACK', 'custody.query', 'A');
    const seen = new Set();
    for (const s of q.statuses) {
      exact(s, ['id', 'context', 'state', 'description', 'target_url', 'creator', 'created_at']); exact(s.creator, ['id', 'type']);
      if (!uint(s.id) || !s.id || seen.has(s.id) || !text(s.context) || !text(s.state) || !text(s.description) || !text(s.target_url) || !uint(s.creator.id) || !text(s.creator.type) || !date(s.created_at)) refuse('ACK'); seen.add(s.id);
      if (s.context.toLowerCase() === descriptor.context.toLowerCase() && (!latest || s.id > latest.id)) latest = s;
    }
    if (!latest || latest.creator.id !== 54500418 || latest.creator.type !== 'User' || latest.state !== 'success' || latest.description !== descriptor.description
      || latest.target_url !== descriptor.target_url || Date.parse(latest.created_at) < Date.parse(b.closedAt) || Date.parse(latest.created_at) > Date.parse(x.now)) c.stop('ACK', 'custody.latestOwnerBinding', 'A');
    if (latest && x.steps[8] && Date.parse(latest.created_at) > Date.parse(x.steps[8].at)) c.stop('ACK', 'custody.ackAfterVerification', 'A');
  }
  if (x.retention === null) c.stop('MISSING_INPUT', 'custody.retention', 'A');
  else { const r = x.retention; exact(r, ['bindingSha256', 'allocationIds', 'maximumBytes', 'until', 'policy']); array(r.allocationIds);
    if (r.bindingSha256 !== bindingHash || !r.allocationIds.length || r.allocationIds.some(a => !id(a)) || new Set(r.allocationIds).size !== r.allocationIds.length
      || !uint(r.maximumBytes) || r.maximumBytes < b.cipherBytes || !date(r.until) || Date.parse(r.until) < Date.parse(x.now) || r.policy !== 'THROUGH_ACK_OR_AUTHORIZED_CLEANUP') c.stop('RETENTION', 'custody.retention', 'A'); }
  return { lifecycleVersion: 'permission-full-integration-lifecycle-v1', lifecycle: LIFECYCLE, custodyFields: CUSTODY_FIELDS,
    observed: 'NOT_RUN', declaredBindingSha256: bindingHash, simulatedAckStatusId: c.mode === 'SIMULATION' ? latest?.id ?? null : null,
    actualAckVerified: false, intentionalCleanupAllowed: false, failurePolicy: 'RETAIN_RUN_NONCE_SOURCE_PARTIAL_RECEIPTS_NO_PASS_NO_RETRY_OR_DELETE_PERMISSION' };
}
export const custodyLifecyclePlan = input => api(input, custody);
export const CLOSURE_LEDGER = freeze([
  ['P', 'PIN19_ALL_IDENTITIES_VARIANTS'], ['P', 'TC18_SECRET_ORACLE_CAPTURE'], ['P', 'TC19_EMPTY_TARGET_PRESERVATION'], ['R', 'PERM27_60_726'], ['R', 'TC53_THREE_DB'],
  ['R', 'T04_19_PHYSICAL_BACKEND'], ['L', 'LEGACY_PROVENANCE'], ['D', 'CANDIDATE_PROVENANCE'], ['D', 'BUDGET_RESOURCES_TIME_RETAINED_PHYSICAL'], ['A', 'TRANSPORT_AUTH_PRIVATE_CLOSURE'],
  ['A', 'LATEST_OWNER_ACK_RETENTION'], ['D', 'FINAL_CI'], ['D', 'FINAL_EVC'], ['D', 'FINAL_SEC'], ['D', 'OWNER_WALKTHROUGH'], ['D', 'MERGE'], ['D', 'HOSTED_RELEASE_CLOSE2_CLOSE3']
].map(([owner, requiredGate]) => ({ owner, requiredGate, inputHash: null, actualStatus: 'NOT_RUN', evidence: null, reviewer: null,
  missingAction: 'EXACT_REVIEWED_SOURCE_AND_FUTURE_AUTHORIZED_GATE_REQUIRED', scope: requiredGate === 'HOSTED_RELEASE_CLOSE2_CLOSE3' ? 'OUTSIDE_CURRENT_GRANT' : 'OPEN_ACTUAL_GATE' })));
