import { createHash } from 'node:crypto';
import { types } from 'node:util';

// Pure preparation only: no filesystem, environment, process, network or DB adapter.
export const LEGACY_PINS = Object.freeze({
  baseCommit: '567af2191400ef559e90b3eccae0a0e4992f82e5',
  baseTree: '5b8667b4c421a7e6c47f566e1634129799a5f83d',
  sourceCommit: 'ef2c372aec60d8362549e47b7aedb27126129479',
  sourceTree: '1ef7df6b8f0e741ce96b4968edd77d1a28fe6fe4',
  packageSha256: 'c444db7f1e05ce130d88752ce27f8bf143f395696f9bf18054f265cb8ef54ca0',
  lockSha256: '1b6d400213384cd736ee7dd2108137d7b63b67a467bd9672886e220cc2f0cf0b',
  candidateLockSha256: '85969c1c161f74e9f68563182d99d1b0ac6fb5f17f5074444f329675ffd34e18',
  listingSha256: 'cc31a28b80d130a6d93fa5a8a22d44bed041ba581be88693036032d1fc0ce61a',
});
export const LEGACY_CONFIG_PINS = Object.freeze({
  'LEGACY:vite.config.ts': '2c5d878faa02357af712c970b8346ce75743b558ac60be4af99ceb84d4dc8308',
  'LEGACY:tsconfig.json': '770b4140bbb581e2dfd9ea9946ffc9c75a1d86ba7d2db5f77c83e37cbdf9d808',
  'LEGACY:tsconfig.app.json': '3aba1ecef85b84281c7ab44c9adb4ca7b91f713d75dffb8fb28c63905b6efea3',
  'LEGACY:tsconfig.node.json': '33a0e07677f7cd4a9fd2e4d3e038b2a4d48dae32bd2538432fa58c11adb56a68',
  'LEGACY:postcss.config.js': 'e32657baf631d7c5f4dc67b4b2ee0ec8e7d5b3c41860e09cddce7c0377cd80bc',
  'LEGACY:tailwind.config.ts': '2572ce1bfa14bf02897664194b1573d3e4ea9640635bc4aac6966f9aa9fd23df',
  'LEGACY:tailwind.posCafeStyles.ts': '52a7da173215b2922bca216b8bc7455bab479d06d78c4342307b239a4b369a99',
  'LEGACY:vitest.config.ts': '1cb32e60581f3bc8c6f2a6e487e2c337a89d40f3ae966b82896792ce5b077042',
  'LEGACY:playwright.config.ts': 'ab6f474cd4094ede9c33ff2f6fc376f97e28587413fc5c69fbf0d97c5a17d838',
  'CANDIDATE:scripts/permission-legacy-head.mjs': '67e5fef3ee270906d60a960dea46ed9d83c3eba38c52090c3d0e2a8ac9b9aea9',
  'CANDIDATE:scripts/permission-legacy-browser-prepare.mjs': '3e7908650e37668d5e3279fc1f54fae89fceeda1caa9951e55b80b30d114948e',
  'CANDIDATE:playwright.permission-legacy-transition.config.ts': '7852e623e9f7ec71c12a203824a10a47034112efb4c6de893271024a500cb62b',
  'CANDIDATE:tests/permissions/runtime/ci1-tools.json': 'bde0a12f4e0d2c603f912c260825db37b3c3ff1228b338166b9fbd053f083638',
  'CANDIDATE:tests/supabase/permissionCandidateEnvironment.ts': '32250edcabbf5eab7c0eb56f784bb2e077a13ca893bdd903985e44fc0e081304',
});
export const LEGACY_ERRORS = Object.freeze([
  'LEGACY_UNSAFE_DATA', 'LEGACY_INPUT_LIMIT', 'LEGACY_INVALID_JSON', 'LEGACY_DUPLICATE_KEY',
  'LEGACY_SOURCE_MISMATCH', 'LEGACY_LOCK_SUBSTITUTION', 'LEGACY_PACKAGE_MISMATCH',
  'LEGACY_UNSUPPORTED_LOCK', 'LEGACY_INVALID_GRAPH', 'LEGACY_MISSING_RESOLUTION',
  'LEGACY_MISSING_INTEGRITY', 'LEGACY_UNSAFE_PATH', 'LEGACY_LISTING_MISMATCH',
  'LEGACY_DUPLICATE_MEMBER', 'LEGACY_CONFIG_MISMATCH', 'LEGACY_INVALID_BOUND',
]);
const limit = 262144;
const fail = code => { throw new Error(code); };
const sha = text => createHash('sha256').update(text).digest('hex');
const blob = text => createHash('sha1').update(`blob ${Buffer.byteLength(text)}\0`).update(text).digest('hex');
const isHash = v => typeof v === 'string' && /^[a-f0-9]{64}$/.test(v);
const isGit = v => typeof v === 'string' && /^[a-f0-9]{40}$/.test(v);
const freeze = v => { if (v && typeof v === 'object') { Object.values(v).forEach(freeze); Object.freeze(v); } return v; };

// Check descriptors before reading values. Proxies are rejected without invoking traps.
// Accept only bounded JSON data; functions, cycles, symbols, holes and accessors refuse.
function data(value) {
  let bytes = 0, nodes = 0;
  const seen = new Set();
  function visit(v, depth) {
    if (++nodes > 50000 || depth > 64) fail('LEGACY_INPUT_LIMIT');
    if (v === null || typeof v === 'boolean') return v;
    if (typeof v === 'string') { bytes += Buffer.byteLength(v); if (bytes > limit) fail('LEGACY_INPUT_LIMIT'); return v; }
    if (typeof v === 'number' && Number.isSafeInteger(v)) return v;
    if (typeof v !== 'object' || types.isProxy(v) || seen.has(v)) fail('LEGACY_UNSAFE_DATA');
    const array = Array.isArray(v), proto = Object.getPrototypeOf(v);
    if (proto !== (array ? Array.prototype : Object.prototype) && !(proto === null && !array)) fail('LEGACY_UNSAFE_DATA');
    seen.add(v);
    const descriptors = Object.getOwnPropertyDescriptors(v), keys = Reflect.ownKeys(descriptors);
    const out = array ? [] : Object.create(null);
    if (array && (v.length > 50000 || keys.length !== v.length + 1)) fail('LEGACY_UNSAFE_DATA');
    for (const key of keys) {
      if (array && key === 'length') continue;
      if (typeof key !== 'string') fail('LEGACY_UNSAFE_DATA');
      const d = descriptors[key];
      if (!d.enumerable || !Object.hasOwn(d, 'value') || (array && !/^(0|[1-9][0-9]*)$/.test(key))) fail('LEGACY_UNSAFE_DATA');
      bytes += Buffer.byteLength(key) + 8;
      if (bytes > limit) fail('LEGACY_INPUT_LIMIT');
      out[key] = visit(d.value, depth + 1);
    }
    seen.delete(v);
    return out;
  }
  return visit(value, 0);
}
function text(v) { if (typeof v !== 'string' || Buffer.byteLength(v) > limit) fail('LEGACY_INPUT_LIMIT'); return v; }
function path(v) {
  if (typeof v !== 'string' || !v || v.length > 1024 || /[\\:\x00-\x1f\x7f]/.test(v)
    || v.startsWith('/') || v.split('/').some(p => !p || p === '.' || p === '..' || p === '.git'
      || /[. ]$/.test(p) || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(p))) fail('LEGACY_UNSAFE_PATH');
  return v;
}

// Native JSON.parse discards duplicate keys. This bounded reader refuses them,
// including escaped duplicates, before a graph can silently lose a package/edge.
function json(input) {
  input = text(input); let at = 0, nodes = 0;
  const ws = () => { while (/[ \t\r\n]/.test(input[at] ?? '') && at < input.length) at++; };
  function string() {
    const start = at++;
    while (at < input.length) {
      if (input[at] === '\\') { at += 2; continue; }
      if (input[at++] === '"') { try { return JSON.parse(input.slice(start, at)); } catch { fail('LEGACY_INVALID_JSON'); } }
    }
    fail('LEGACY_INVALID_JSON');
  }
  function value(depth) {
    if (++nodes > 50000 || depth > 64) fail('LEGACY_INPUT_LIMIT');
    ws(); const c = input[at];
    if (c === '"') return string();
    if (c === '{' || c === '[') {
      const array = c === '[', out = array ? [] : Object.create(null), keys = new Set(); at++; ws();
      if (input[at] === (array ? ']' : '}')) { at++; return out; }
      for (;;) {
        let key;
        if (!array) {
          ws(); if (input[at] !== '"') fail('LEGACY_INVALID_JSON'); key = string();
          if (keys.has(key)) fail('LEGACY_DUPLICATE_KEY'); keys.add(key);
          ws(); if (input[at++] !== ':') fail('LEGACY_INVALID_JSON');
        }
        const v = value(depth + 1); if (array) out.push(v); else out[key] = v;
        ws(); const end = input[at++]; if (end === (array ? ']' : '}')) return out;
        if (end !== ',') fail('LEGACY_INVALID_JSON');
      }
    }
    const token = /^(?:true|false|null|-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?)/.exec(input.slice(at));
    if (!token) fail('LEGACY_INVALID_JSON'); at += token[0].length; return JSON.parse(token[0]);
  }
  const out = value(0); ws(); if (at !== input.length) fail('LEGACY_INVALID_JSON'); return out;
}
function record(v) { if (!v || Array.isArray(v) || typeof v !== 'object') fail('LEGACY_INVALID_GRAPH'); return v; }
function configOwner(v) {
  if (typeof v !== 'string' || !['LEGACY', 'CANDIDATE'].includes(v)) fail('LEGACY_CONFIG_MISMATCH');
  return v;
}
function map(v = {}) {
  record(v);
  if (Object.entries(v).some(([k,x]) => !/^(@[a-zA-Z0-9_.~-]+\/)?[a-zA-Z0-9_.~-]+$/.test(k) || typeof x !== 'string' || !x)) fail('LEGACY_INVALID_GRAPH');
  for (const k of Object.keys(v)) path(k);
  return v;
}
const sortedMap = m => JSON.stringify(Object.entries(map(m)).sort(([a],[b]) => a.localeCompare(b)));
function source(i) {
  record(i);
  if (!['CANONICAL_GIT', 'SYNTHETIC'].includes(i.representation) || !isGit(i.sourceCommit) || !isGit(i.sourceTree)) fail('LEGACY_SOURCE_MISMATCH');
  if (i.representation === 'CANONICAL_GIT' && (i.sourceCommit !== LEGACY_PINS.sourceCommit || i.sourceTree !== LEGACY_PINS.sourceTree)) fail('LEGACY_SOURCE_MISMATCH');
}
function identity(content) { return { bytes: Buffer.byteLength(content), sha256: sha(content), gitBlob: blob(content) }; }
function strings(v) { if (v === undefined) return []; if (!Array.isArray(v) || v.some(x => typeof x !== 'string' || !x)) fail('LEGACY_INVALID_GRAPH'); return v; }
const packagePath = /^(?:node_modules\/(?:@[a-zA-Z0-9_.~-]+\/)?[a-zA-Z0-9_.~-]+)(?:\/node_modules\/(?:@[a-zA-Z0-9_.~-]+\/)?[a-zA-Z0-9_.~-]+)*$/;
function parent(p) { const n = p.lastIndexOf('/node_modules/'); return n < 0 ? '' : p.slice(0, n); }
function target(packages, from, name) {
  for (let p = from;; p = parent(p)) {
    const candidate = `${p ? `${p}/` : ''}node_modules/${name}`;
    if (Object.hasOwn(packages, candidate)) return candidate;
    if (!p) return null;
  }
}

export function readLegacyGraph(input) {
  const i = data(input); source(i);
  const pkgText = text(i.packageJson), lockText = text(i.lockJson);
  const packageIdentity = identity(pkgText), lockIdentity = identity(lockText);
  const packagePin = i.representation === 'CANONICAL_GIT' ? LEGACY_PINS.packageSha256 : i.expectedPackageSha256;
  const lockPin = i.representation === 'CANONICAL_GIT' ? LEGACY_PINS.lockSha256 : i.expectedLockSha256;
  if (!isHash(lockPin) || lockIdentity.sha256 !== lockPin) fail('LEGACY_LOCK_SUBSTITUTION');
  if (!isHash(packagePin) || packageIdentity.sha256 !== packagePin) fail('LEGACY_PACKAGE_MISMATCH');
  const pkg = record(json(pkgText)), lock = record(json(lockText));
  if (lock.lockfileVersion !== 3) fail('LEGACY_UNSUPPORTED_LOCK');
  const packages = record(lock.packages), root = record(packages['']);
  for (const field of ['dependencies', 'devDependencies', 'optionalDependencies']) {
    if (sortedMap(pkg[field]) !== sortedMap(root[field])) fail('LEGACY_PACKAGE_MISMATCH');
  }
  if (pkg.name !== root.name || pkg.version !== root.version || pkg.name !== lock.name || pkg.version !== lock.version) fail('LEGACY_PACKAGE_MISMATCH');
  const nodes = [], edges = [];
  for (const [p, entry] of Object.entries(packages)) {
    record(entry); if (!p) continue; path(p); if (!packagePath.test(p)) fail('LEGACY_UNSAFE_PATH');
    if (typeof entry.version !== 'string' || !entry.version || entry.link === true) fail('LEGACY_INVALID_GRAPH');
    if (typeof entry.resolved !== 'string') fail('LEGACY_MISSING_RESOLUTION');
    let url; try { url = new URL(entry.resolved); } catch { fail('LEGACY_MISSING_RESOLUTION'); }
    if (url.protocol !== 'https:' || url.username || url.password || url.hash || url.search) fail('LEGACY_MISSING_RESOLUTION');
    const sri = typeof entry.integrity === 'string' && /^(sha256|sha384|sha512)-([A-Za-z0-9+/]+={0,2})$/.exec(entry.integrity);
    const lengths = { sha256: 32, sha384: 48, sha512: 64 };
    if (!sri || Buffer.from(sri[2], 'base64').length !== lengths[sri[1]] || Buffer.from(sri[2], 'base64').toString('base64') !== sri[2]) fail('LEGACY_MISSING_INTEGRITY');
    for (const flag of ['dev', 'optional', 'hasInstallScript']) if (entry[flag] !== undefined && typeof entry[flag] !== 'boolean') fail('LEGACY_INVALID_GRAPH');
    nodes.push({ path: p, version: entry.version, resolved: entry.resolved, integrity: entry.integrity,
      dev: entry.dev === true, optional: entry.optional === true, os: strings(entry.os), cpu: strings(entry.cpu),
      engines: map(entry.engines), hasInstallScript: entry.hasInstallScript === true,
      installScriptCommand: null, installScriptMaximumBytes: null, scriptKnowledge: 'UNKNOWN_PACKAGE_MANIFEST_NOT_INSPECTED' });
  }
  const nodeByPath = new Map(nodes.map(n => [n.path, n]));
  for (const [from, entry] of Object.entries(packages)) {
    for (const [field,kind] of [['dependencies','DEPENDENCY'],['devDependencies','DEV'],['optionalDependencies','OPTIONAL'],['peerDependencies','PEER']]) {
      if (from && field === 'devDependencies') continue;
      for (const [name, specifier] of Object.entries(map(entry[field]))) {
        if (field === 'dependencies' && Object.hasOwn(entry.optionalDependencies ?? {}, name)) continue;
        const to = target(packages, from, name), peerOptional = kind === 'PEER' && entry.peerDependenciesMeta?.[name]?.optional === true;
        const optional = kind === 'OPTIONAL' || peerOptional;
        edges.push({ from, name, specifier, kind, direct: from === '', optional, to,
          status: to ? 'LOCK_PATH_RESOLVED' : optional ? 'OPTIONAL_NOT_LOCKED' : 'UNKNOWN_REQUIRED_TARGET',
          targetPlatform: to ? { os: nodeByPath.get(to).os, cpu: nodeByPath.get(to).cpu } : null });
      }
    }
  }
  const graphSha256 = sha(JSON.stringify({ packageIdentity, lockIdentity, nodes, edges }));
  return freeze({ schemaVersion: 'permission-legacy-graph-v1', evidenceMode: i.representation === 'CANONICAL_GIT' ? 'PLAN_ONLY' : 'SIMULATION',
    execution: 'NOT_RUN', runtimeAdmission: 'NOT_RUN', decision: 'STOP',
    summary: { representation: i.representation, sourceCommit: i.sourceCommit, sourceTree: i.sourceTree, packageIdentity, lockIdentity, graphSha256,
      packageCount: nodes.length, edgeCount: edges.length, directEdgeCount: edges.filter(e => e.direct).length,
      unresolvedRequiredCount: edges.filter(e => e.status === 'UNKNOWN_REQUIRED_TARGET').length,
      installScriptFlagCount: nodes.filter(n => n.hasInstallScript).length },
    nodes, edges, rootScripts: pkg.scripts ?? {},
    limitations: ['LOCK_DIRECTORY_ANCESTRY_ONLY_NOT_ACTUAL_NODE_RESOLUTION', 'SEMVER_COMPATIBILITY_NOT_EXECUTED',
      'PACKAGE_MANIFESTS_AND_PLATFORM_SELECTION_UNKNOWN', 'NO_NETWORK_OR_LIFECYCLE_EXECUTION', 'DECLARED_INTEGRITY_NOT_OBSERVED_ARCHIVE_INTEGRITY'] });
}

export function readLegacyListing(input) {
  const i = data(input); source(i); const listing = text(i.listing);
  const expected = i.representation === 'CANONICAL_GIT' ? LEGACY_PINS.listingSha256 : i.expectedListingSha256;
  if (!isHash(expected) || sha(listing) !== expected || !listing.endsWith('\0')) fail('LEGACY_LISTING_MISMATCH');
  const entries = [], seen = new Set(); let sourceBytes = 0;
  for (const line of listing.slice(0, -1).split('\0')) {
    const match = /^(100644|100755) blob ([a-f0-9]{40}) +([0-9]+)\t(.+)$/.exec(line);
    if (!match) fail('LEGACY_LISTING_MISMATCH');
    const p = path(match[4]), bytes = Number(match[3]);
    if (!Number.isSafeInteger(bytes) || bytes < 0 || !Number.isSafeInteger(sourceBytes + bytes)) fail('LEGACY_LISTING_MISMATCH');
    if (seen.has(p)) fail('LEGACY_DUPLICATE_MEMBER'); seen.add(p); sourceBytes += bytes;
    entries.push({ path: p, mode: match[1], gitBlob: match[2], bytes });
  }
  const required = ['package.json', 'package-lock.json', ...Object.keys(LEGACY_CONFIG_PINS).filter(k => k.startsWith('LEGACY:')).map(k => k.slice(7))];
  const members = entries.filter(e => required.includes(e.path));
  return freeze({ entries, summary: { representation: i.representation, sourceCommit: i.sourceCommit, sourceTree: i.sourceTree,
    listingSha256: sha(listing), listingBytes: Buffer.byteLength(listing), fileCount: entries.length, sourceLogicalBytes: sourceBytes, members } });
}

export function bindLegacyConfig(input) {
  const i = record(data(input)), owner = configOwner(i.owner);
  const key = `${owner}:${path(i.path)}`, content = text(i.text);
  if (!Object.hasOwn(LEGACY_CONFIG_PINS, key) || sha(content) !== LEGACY_CONFIG_PINS[key]) fail('LEGACY_CONFIG_MISMATCH');
  return freeze({ owner, path: i.path, ...identity(content), representation: 'CANONICAL_GIT_BYTES' });
}

export function legacyBounds(input = []) {
  const supplied = data(input);
  if (!Array.isArray(supplied)) fail('LEGACY_INVALID_BOUND');
  const writers = ['dependency-transfer', 'dependency-unpack', 'install-scripts', 'npm-cache', 'build-temp', 'dist',
    'preview-server', 'browser-profile-traces', 'source-archive', 'tool-runtime', 'retained-failure-output'];
  const seen = new Set();
  for (const b of supplied) {
    record(b);
    if (!writers.includes(b.writerId) || seen.has(b.writerId)) fail('LEGACY_INVALID_BOUND'); seen.add(b.writerId);
    for (const f of ['compressedMaxBytes', 'expandedMaxBytes', 'allocatedMaxBytes', 'peakMaxBytes', 'durationMaxSeconds']) {
      if (b[f] !== null && (!Number.isSafeInteger(b[f]) || b[f] < 0)) fail('LEGACY_INVALID_BOUND');
    }
    if (typeof b.source !== 'string' || !b.source || (b.peakMaxBytes !== null && b.allocatedMaxBytes !== null && b.peakMaxBytes < b.allocatedMaxBytes)) fail('LEGACY_INVALID_BOUND');
  }
  const rows = writers.map(writerId => ({ writerId, placement: null, storageIdentity: null, overlapGroup: 'LEGACY_CANDIDATE_BROWSER_AND_RETAINED_OUTPUT',
    compressedMaxBytes: null, expandedMaxBytes: null, allocatedMaxBytes: null, peakMaxBytes: null, durationMaxSeconds: null,
    reason: 'UNKNOWN', source: 'LOCK_HAS_NO_ARCHIVE_SIZE_UNPACK_MAXIMUM_OR_RUNTIME_MEASUREMENT',
    suppliedDescriptor: supplied.find(b => b.writerId === writerId) ?? null }));
  // Supplied declarations are preserved for review, never promoted to measured/proven bounds.
  return freeze({ schemaVersion: 'permission-legacy-bounds-v1', decision: 'STOP', runtimeAdmission: 'NOT_RUN', rows,
    missingInputs: writers.map(writerId => ({ writerId, owner: 'L_TO_B_D_FUTURE_AUTHORIZED_MEASUREMENT', reason: 'UNKNOWN' })) });
}

export function makeLegacyRecipe(graphInput, listingInput, configInput) {
  const g = data(graphInput), s = data(listingInput), configs = data(configInput);
  source(g); source(s);
  if (g.representation !== 'CANONICAL_GIT' || s.representation !== 'CANONICAL_GIT'
    || s.listingSha256 !== LEGACY_PINS.listingSha256 || g.lockIdentity?.sha256 !== LEGACY_PINS.lockSha256
    || g.packageIdentity?.sha256 !== LEGACY_PINS.packageSha256 || !isHash(g.graphSha256)) fail('LEGACY_SOURCE_MISMATCH');
  if (!Array.isArray(configs) || configs.length !== Object.keys(LEGACY_CONFIG_PINS).length || !Array.isArray(s.members)) fail('LEGACY_CONFIG_MISMATCH');
  const memberMap = new Map(s.members.map(m => {
    record(m); path(m.path);
    if (!isGit(m.gitBlob) || !Number.isSafeInteger(m.bytes) || m.bytes < 0) fail('LEGACY_SOURCE_MISMATCH');
    return [m.path, m];
  }));
  if (memberMap.size !== s.members.length) fail('LEGACY_DUPLICATE_MEMBER');
  for (const [p, id] of [['package.json',g.packageIdentity], ['package-lock.json',g.lockIdentity]]) {
    const member = memberMap.get(p); if (!member || member.gitBlob !== id.gitBlob || member.bytes !== id.bytes) fail('LEGACY_SOURCE_MISMATCH');
  }
  const seen = new Set();
  for (const c of configs) {
    record(c);
    const owner = configOwner(c.owner);
    const key = `${owner}:${path(c.path)}`;
    if (seen.has(key)) fail('LEGACY_DUPLICATE_MEMBER'); seen.add(key);
    if (!Object.hasOwn(LEGACY_CONFIG_PINS,key) || c.sha256 !== LEGACY_CONFIG_PINS[key]
      || !isGit(c.gitBlob) || !Number.isSafeInteger(c.bytes) || c.bytes < 0) fail('LEGACY_CONFIG_MISMATCH');
    if (c.owner === 'LEGACY') { const m = memberMap.get(c.path); if (!m || m.gitBlob !== c.gitBlob || m.bytes !== c.bytes) fail('LEGACY_CONFIG_MISMATCH'); }
  }
  const root = '/OWNED_LOOP_UNBOUND/legacy', src = `${root}/source`, node = '/OWNED_TOOL_UNBOUND/node/bin/node';
  const env = { policy: 'EXPLICIT_ALLOWLIST_NO_INHERITED_ENV_OR_ENV_FILES', source: 'FUTURE_REVIEWED_SYNTHETIC_LOOPBACK_FIXTURE',
    keys: ['PATH','HOME','TMPDIR','VITE_DATA_MODE','VITE_SUPABASE_URL','VITE_SUPABASE_ANON_KEY'], values: null,
    environmentBinding: null, credentialAccess: 'NOT_RUN' };
  const steps = [
    { id: 'archive', executable: 'git', argv: ['archive','--format=tar',`--output=${root}/source.tar`,LEGACY_PINS.sourceCommit], cwd: '/CANDIDATE_CHECKOUT_UNBOUND' },
    { id: 'extract', executable: 'tar', argv: ['-xf',`${root}/source.tar`,'-C',src], cwd: root },
    { id: 'install', executable: node, argv: ['/OWNED_TOOL_UNBOUND/node/lib/node_modules/npm/bin/npm-cli.js','ci','--cache',`${root}/npm-cache`,'--no-audit','--no-fund'], cwd: src },
    { id: 'typecheck', executable: node, argv: [`${src}/node_modules/typescript/bin/tsc`,'-b'], cwd: src },
    { id: 'build', executable: node, argv: [`${src}/node_modules/vite/bin/vite.js`,'build'], cwd: src },
    { id: 'legacy-preview', executable: node, argv: [`${src}/node_modules/vite/bin/vite.js`,'preview','--host','127.0.0.1','--port','5179','--strictPort'], cwd: src },
    { id: 'candidate-dev', executable: node, argv: ['/CANDIDATE_CHECKOUT_UNBOUND/node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5178','--strictPort'], cwd: '/CANDIDATE_CHECKOUT_UNBOUND' },
  ].map(step => ({ ...step, execution: 'NOT_RUN', environment: env }));
  const recipe = { schemaVersion: 'permission-legacy-recipe-v1', evidenceMode: 'PLAN_ONLY', execution: 'NOT_RUN', runtimeAdmission: 'NOT_RUN',
    sourceCommit: g.sourceCommit, sourceTree: g.sourceTree, lockSha256: g.lockIdentity.sha256, graphSha256: g.graphSha256,
    sourceListingSha256: s.listingSha256, configs, steps, layoutStatus: 'SYMBOLIC_PATHS_NOT_ADMITTED_NOT_EXECUTABLE',
    toolRequirements: { platform: 'linux/x64', nodeVersion: '24.16.0', npmVersion: '11.13.0',
      nodeArchiveSha256: '2faf6a387e9b62b888e21c54f01249fb27537ffecf1842f29f4c919d0a59a0ff',
      nodeArchiveTransferBytes: 57023429, source: 'tests/permissions/runtime/ci1-tools.json:4-13',
      compiler: 'LEGACY_LOCK:typescript@5.9.3', bundler: 'LEGACY_LOCK:vite@8.0.16', reactPlugin: 'LEGACY_LOCK:@vitejs/plugin-react@6.0.2',
      viteAndPluginNodeRange: '^20.19.0 || >=22.12.0', browserTool: 'LEGACY_LOCK:@playwright/test@1.60.0', actualToolDigests: null },
    integration: { oldHelper: 'UNCHANGED_REFUSES_CANDIDATE_LEGACY_LOCK_DIFFERENCE',
      proposal: 'D_NEW_REVIEWED_ADAPTER_WITH_SEPARATE_LEGACY_INSTALL_AND_EXACT_LEGACY_PINS',
      ancestorResolution: 'OLD_ARCHIVED_SOURCE_REACHES_CANDIDATE_NODE_MODULES; NEW_PLAN_USES_SOURCE_OWN_NODE_MODULES',
      sharedPatchApplied: false, dependencySharing: 'NONE_WITHOUT_EXACT_PACKAGE_AND_RUNTIME_IDENTITY_PROOF' },
    preconditions: ['NEW_HUMAN_AUTHORIZATION_FOR_INSTALL_ARCHIVE_BUILD_SERVE', 'B_GLOBAL_WRITER_LEDGER_ADMITTED_AND_ACTUAL_RESERVE_READBACK',
      'D_REVIEWED_LAYOUT_TOOL_PATHS_HASHES_AND_ENV_ALLOWLIST', 'EXACT_GIT_SOURCE_TREE_LISTING_LOCK_PACKAGE_CONFIG_READBACK',
      'NO_ANCESTOR_CANDIDATE_DEPENDENCY_SUBSTITUTION', 'CLEAN_OWNED_NO_SYMLINK_NO_ENV_FILE_SOURCE_ROOT',
      'LIFECYCLE_SCRIPT_COMMANDS_AND_MAXIMUM_WRITES_REVIEWED', 'EXACT_SYNTHETIC_FIXTURE_IDENTITY_AND_LOOPBACK_BACKEND',
      'FINANCIAL_DML_STAYS_REVOKED_TENANT_RLS_STAYS_ENABLED', 'EXISTING_BROWSER_PREPARE_NOT_IMPORTED_OR_CALLED',
      'FREE_PORTS_5178_5179_STRICT_PORT_NO_REUSE', 'CUSTODY_ACK_RETENTION_AND_FAILURE_STOP_GATES_UNCHANGED'],
    observationsNotRun: { archiveSha256: null, actualNode: null, actualLockReadback: null, environmentBinding: null, distSha256: null,
      serverIdentity: null, backendIdentity: null, browserResult: null },
    bounds: legacyBounds(), stop: 'UNKNOWN_MAXIMUM_GROWTH_PLACEMENT_TIME_TOOLS_ENVIRONMENT_AND_GRANT',
  };
  return freeze({ ...recipe, recipeSha256: sha(JSON.stringify(recipe)), hashMeaning: 'RECIPE_BYTES_ONLY_NOT_ACTUAL_ARCHIVE_OR_DIST' });
}
