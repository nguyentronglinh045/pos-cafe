import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { LEGACY_PINS, LEGACY_CONFIG_PINS, LEGACY_ERRORS, readLegacyGraph, readLegacyListing,
  bindLegacyConfig, legacyBounds, makeLegacyRecipe } from './permission-full-legacy-plan.mjs';

const hash = v => createHash('sha256').update(v).digest('hex');
const integrity = `sha512-${Buffer.alloc(64, 7).toString('base64')}`;
const git = 'a'.repeat(40);
const entry = (version = '1.0.0', rest = {}) => ({ version, resolved: `https://registry.npmjs.org/example/-/example-${version}.tgz`, integrity, ...rest });
function fixture(change = () => {}) {
  const pkg = { name: 'fixture', version: '1.0.0', scripts: { build: 'never execute this synthetic command' },
    dependencies: { alpha: '^1.0.0' }, devDependencies: { tool: '1.0.0' }, optionalDependencies: { native: '1.0.0' } };
  const lock = { name: pkg.name, version: pkg.version, lockfileVersion: 3, packages: {
    '': { name: pkg.name, version: pkg.version, dependencies: pkg.dependencies, devDependencies: pkg.devDependencies, optionalDependencies: pkg.optionalDependencies },
    'node_modules/alpha': entry('1.2.0', { dependencies: { beta: '^1', opt: '^1' }, optionalDependencies: { opt: '^2' },
      peerDependencies: { absent: '^1', absentOptional: '^1' }, peerDependenciesMeta: { absentOptional: { optional: true } } }),
    'node_modules/alpha/node_modules/beta': entry('1.9.0'),
    'node_modules/beta': entry('2.0.0'),
    'node_modules/native': entry('1.0.0', { optional: true, os: ['darwin'], cpu: ['arm64'], hasInstallScript: true }),
    'node_modules/tool': entry('1.0.0', { dev: true, engines: { node: '>=18' } }),
  } };
  change(lock, pkg);
  return encode(pkg, JSON.stringify(lock));
}
function encode(pkg, lockJson) {
  const packageJson = JSON.stringify(pkg);
  return { representation: 'SYNTHETIC', sourceCommit: git, sourceTree: git, packageJson, lockJson,
    expectedPackageSha256: hash(packageJson), expectedLockSha256: hash(lockJson) };
}
function listingInput(lines) {
  const listing = lines.map(([p, bytes = 1, blob = git]) => `100644 blob ${blob} ${bytes}\t${p}\0`).join('');
  return { representation: 'SYNTHETIC', sourceCommit: git, sourceTree: git, listing, expectedListingSha256: hash(listing) };
}
function expectError(code, fn) { assert.throws(fn, e => e instanceof Error && e.message === code && LEGACY_ERRORS.includes(code)); }

test('direct/dev/transitive/nested/optional/peer edges retain exact lock identity without platform pruning', () => {
  const i = fixture(), graph = readLegacyGraph(i);
  assert.equal(graph.summary.packageCount, 5);
  assert.equal(graph.summary.directEdgeCount, 3);
  assert.equal(graph.summary.lockIdentity.sha256, hash(i.lockJson));
  assert.equal(graph.summary.lockIdentity.bytes, Buffer.byteLength(i.lockJson));
  assert.equal(graph.edges.find(e => e.from === 'node_modules/alpha' && e.name === 'beta').to, 'node_modules/alpha/node_modules/beta');
  const opt = graph.edges.filter(e => e.name === 'opt');
  assert.equal(opt.length, 1); assert.equal(opt[0].specifier, '^2'); assert.equal(opt[0].status, 'OPTIONAL_NOT_LOCKED');
  assert.equal(graph.edges.find(e => e.name === 'absent').status, 'UNKNOWN_REQUIRED_TARGET');
  assert.equal(graph.edges.find(e => e.name === 'absentOptional').status, 'OPTIONAL_NOT_LOCKED');
  const nativeEdge = graph.edges.find(e => e.name === 'native');
  assert.deepEqual(nativeEdge.targetPlatform, { os: ['darwin'], cpu: ['arm64'] });
  const native = graph.nodes.find(n => n.path === nativeEdge.to);
  assert.equal(native.hasInstallScript, true); assert.equal(native.installScriptCommand, null);
  assert.equal(native.installScriptMaximumBytes, null); assert.equal(graph.summary.unresolvedRequiredCount, 1);
  assert.equal(graph.evidenceMode, 'SIMULATION'); assert.equal(graph.execution, 'NOT_RUN'); assert.equal(graph.decision, 'STOP');
  assert.ok(Object.isFrozen(graph.nodes[0]));
});

test('canonical legacy rejects candidate/substitute lock even when caller supplies matching replacement hash', () => {
  const i = { ...fixture(), representation: 'CANONICAL_GIT', sourceCommit: LEGACY_PINS.sourceCommit, sourceTree: LEGACY_PINS.sourceTree };
  expectError('LEGACY_LOCK_SUBSTITUTION', () => readLegacyGraph(i));
  assert.notEqual(LEGACY_PINS.lockSha256, LEGACY_PINS.candidateLockSha256);
});

test('stale source commit/tree and unsupported lock versions refuse', () => {
  expectError('LEGACY_SOURCE_MISMATCH', () => readLegacyGraph({ ...fixture(), representation: 'CANONICAL_GIT' }));
  expectError('LEGACY_SOURCE_MISMATCH', () => readLegacyGraph({ ...fixture(), sourceTree: '../tree' }));
  expectError('LEGACY_UNSUPPORTED_LOCK', () => readLegacyGraph(fixture(l => { l.lockfileVersion = 2; })));
});

test('package declarations cannot silently diverge from lock root', () => {
  expectError('LEGACY_PACKAGE_MISMATCH', () => readLegacyGraph(fixture(l => { l.packages[''].dependencies = { alpha: '^9' }; })));
  expectError('LEGACY_PACKAGE_MISMATCH', () => readLegacyGraph(fixture(l => { l.name = 'wrong'; })));
});

test('missing resolution/integrity or invalid SRI is a finite error, not a partial graph', () => {
  expectError('LEGACY_MISSING_RESOLUTION', () => readLegacyGraph(fixture(l => { delete l.packages['node_modules/alpha'].resolved; })));
  expectError('LEGACY_MISSING_INTEGRITY', () => readLegacyGraph(fixture(l => { delete l.packages['node_modules/alpha'].integrity; })));
  expectError('LEGACY_MISSING_INTEGRITY', () => readLegacyGraph(fixture(l => { l.packages['node_modules/alpha'].integrity = 'sha512-YQ=='; })));
  expectError('LEGACY_MISSING_RESOLUTION', () => readLegacyGraph(fixture(l => { l.packages['node_modules/alpha'].resolved = 'file:///private/archive.tgz'; })));
  expectError('LEGACY_MISSING_RESOLUTION', () => readLegacyGraph(fixture(l => { l.packages['node_modules/alpha'].resolved = 'https://name:secret@example.invalid/a'; })));
});

test('duplicate package or escaped duplicate edge keys refuse before JSON overwrite', () => {
  const i = fixture();
  expectError('LEGACY_DUPLICATE_KEY', () => readLegacyGraph({ ...i, lockJson: i.lockJson.replace('"packages":{', '"packages":{"node_modules/alpha":{},'),
    expectedLockSha256: hash(i.lockJson.replace('"packages":{', '"packages":{"node_modules/alpha":{},')) }));
  const raw = i.lockJson.replace('"beta":"^1"', '"beta":"^1","b\\u0065ta":"^2"');
  expectError('LEGACY_DUPLICATE_KEY', () => readLegacyGraph({ ...i, lockJson: raw, expectedLockSha256: hash(raw) }));
});

test('truncated JSON, extra JSON tail and missing package version refuse', () => {
  const i = fixture();
  for (const raw of [i.lockJson.slice(0, -1), `${i.lockJson} false`]) {
    expectError('LEGACY_INVALID_JSON', () => readLegacyGraph({ ...i, lockJson: raw, expectedLockSha256: hash(raw) }));
  }
  expectError('LEGACY_INVALID_GRAPH', () => readLegacyGraph(fixture(l => { delete l.packages['node_modules/alpha'].version; })));
});

test('unsafe nested package paths cannot enter dependency graph', () => {
  for (const p of ['../node_modules/evil', 'node_modules/../evil', 'C:/evil', 'node_modules\\evil', 'node_modules/con']) {
    expectError('LEGACY_UNSAFE_PATH', () => readLegacyGraph(fixture(l => { l.packages[p] = entry(); })));
  }
});

test('source listing preserves every member blob/byte identity and rejects duplicate/truncated listings', () => {
  const i = listingInput([['package.json', 10], ['package-lock.json', 20], ['src/a.ts', 30]]);
  const result = readLegacyListing(i);
  assert.equal(result.summary.fileCount, 3); assert.equal(result.summary.sourceLogicalBytes, 60);
  assert.equal(result.entries[2].gitBlob, git);
  expectError('LEGACY_DUPLICATE_MEMBER', () => readLegacyListing(listingInput([['a'],['a']])));
  const truncated = i.listing.slice(0, -1);
  expectError('LEGACY_LISTING_MISMATCH', () => readLegacyListing({ ...i, listing: truncated, expectedListingSha256: hash(truncated) }));
  expectError('LEGACY_LISTING_MISMATCH', () => readLegacyListing({ ...i, expectedListingSha256: '0'.repeat(64) }));
});

test('symlink, submodule, path traversal, absolute and Windows alias source members refuse', () => {
  for (const p of ['../a','/a','C:/a','a\\b','.git/config','a//b','a/./b','NUL.txt','a.']) {
    expectError('LEGACY_UNSAFE_PATH', () => readLegacyListing(listingInput([[p]])));
  }
  for (const prefix of ['120000 blob', '160000 commit']) {
    const listing = `${prefix} ${git} 1\ta\0`;
    expectError('LEGACY_LISTING_MISMATCH', () => readLegacyListing({ ...listingInput([['a']]), listing, expectedListingSha256: hash(listing) }));
  }
});

test('canonical source listing cannot accept a self-declared replacement digest', () => {
  const i = listingInput([['package.json']]);
  expectError('LEGACY_LISTING_MISMATCH', () => readLegacyListing({ ...i, representation: 'CANONICAL_GIT', sourceCommit: LEGACY_PINS.sourceCommit, sourceTree: LEGACY_PINS.sourceTree }));
});

test('config binding hashes canonical bytes without importing executable config', () => {
  const content = 'import react from "@vitejs/plugin-react";\nimport { defineConfig } from "vite";\n\nexport default defineConfig({\n  plugins: [react()],\n  resolve: {\n    alias: {\n      "@": "/src",\n    },\n  },\n});\n';
  const c = bindLegacyConfig({ owner: 'LEGACY', path: 'vite.config.ts', text: content });
  assert.equal(c.bytes, 193); assert.equal(c.sha256, LEGACY_CONFIG_PINS['LEGACY:vite.config.ts']);
  assert.equal(c.gitBlob, '4165be9f0cc7baccbf4a85b538737549d57d5de8');
  expectError('LEGACY_CONFIG_MISMATCH', () => bindLegacyConfig({ owner: 'LEGACY', path: 'vite.config.ts', text: `${content}\n` }));
});

function recipeFixture() {
  // Deliberately synthetic descriptors exercise the predicate, not Git observation.
  const configs = Object.entries(LEGACY_CONFIG_PINS).map(([key, sha256]) => {
    const colon = key.indexOf(':'); return { owner: key.slice(0,colon), path: key.slice(colon+1), sha256, gitBlob: git, bytes: 1 };
  });
  const g = { representation: 'CANONICAL_GIT', sourceCommit: LEGACY_PINS.sourceCommit, sourceTree: LEGACY_PINS.sourceTree,
    packageIdentity: { sha256: LEGACY_PINS.packageSha256, gitBlob: git, bytes: 1 },
    lockIdentity: { sha256: LEGACY_PINS.lockSha256, gitBlob: git, bytes: 1 }, graphSha256: 'b'.repeat(64) };
  const s = { ...g, listingSha256: LEGACY_PINS.listingSha256, members: [
    { path: 'package.json', gitBlob: git, bytes: 1 }, { path: 'package-lock.json', gitBlob: git, bytes: 1 },
    ...configs.filter(c => c.owner === 'LEGACY').map(c => ({ path: c.path, gitBlob: c.gitBlob, bytes: c.bytes })),
  ] };
  return { g, s, configs };
}

test('recipe is only symbolic NOT_RUN: explicit own legacy tools, loopback ports, unchanged old guard', () => {
  const { g, s, configs } = recipeFixture(), result = makeLegacyRecipe(g,s,configs);
  assert.equal(result.execution, 'NOT_RUN'); assert.equal(result.runtimeAdmission, 'NOT_RUN');
  assert.equal(result.observationsNotRun.archiveSha256, null); assert.equal(result.observationsNotRun.distSha256, null);
  assert.equal(result.integration.sharedPatchApplied, false);
  for (const [id, port] of [['candidate-dev','5178'],['legacy-preview','5179']]) {
    const step = result.steps.find(s => s.id === id);
    assert.ok(step.argv.includes('127.0.0.1')); assert.ok(step.argv.includes(port)); assert.ok(step.argv.includes('--strictPort'));
  }
  assert.ok(result.steps.find(s => s.id === 'typecheck').argv[0].includes('/legacy/source/node_modules/'));
  assert.ok(result.preconditions.includes('FINANCIAL_DML_STAYS_REVOKED_TENANT_RLS_STAYS_ENABLED'));
  assert.equal(result.bounds.decision, 'STOP'); assert.match(result.recipeSha256, /^[a-f0-9]{64}$/);
});

test('recipe refuses source/config/blob/lock substitution, duplicate and missing config closure', () => {
  const {g,s,configs} = recipeFixture();
  expectError('LEGACY_SOURCE_MISMATCH', () => makeLegacyRecipe({...g, lockIdentity: {...g.lockIdentity, sha256: LEGACY_PINS.candidateLockSha256}},s,configs));
  expectError('LEGACY_SOURCE_MISMATCH', () => makeLegacyRecipe(g,{...s,members:s.members.map((m,n)=>n===0?{...m,bytes:2}:m)},configs));
  expectError('LEGACY_CONFIG_MISMATCH', () => makeLegacyRecipe(g,s,configs.map((c,n)=>n===0?{...c,sha256:'0'.repeat(64)}:c)));
  expectError('LEGACY_CONFIG_MISMATCH', () => makeLegacyRecipe(g,s,configs.slice(1)));
  expectError('LEGACY_DUPLICATE_MEMBER', () => makeLegacyRecipe(g,s,configs.map((c,n)=>n===1?configs[0]:c)));
});

test('unknown maximums and unverified zero/positive declarations never become admission', () => {
  const result = legacyBounds(); assert.equal(result.decision, 'STOP'); assert.equal(result.rows.length, 11);
  for (const row of result.rows) for (const f of ['compressedMaxBytes','expandedMaxBytes','allocatedMaxBytes','peakMaxBytes','durationMaxSeconds']) assert.equal(row[f],null);
  const declaration = { writerId:'dist', compressedMaxBytes:0, expandedMaxBytes:0, allocatedMaxBytes:0, peakMaxBytes:0, durationMaxSeconds:0, source:'SYNTHETIC_DECLARATION' };
  assert.equal(legacyBounds([declaration]).rows.find(r=>r.writerId==='dist').peakMaxBytes,null);
  for (const n of [-1, 1.5, Number.MAX_SAFE_INTEGER+1, Infinity]) {
    assert.throws(() => legacyBounds([{...declaration,peakMaxBytes:n}]));
  }
  expectError('LEGACY_INVALID_BOUND', () => legacyBounds([declaration,declaration]));
});

test('getters, proxies, inherited descriptors, cycles and toJSON hooks have zero invoked effects', () => {
  let effects = 0;
  const getter = {...fixture()}; Object.defineProperty(getter,'lockJson',{ enumerable:true,get(){ effects++; return ''; } });
  const proxy = new Proxy({}, { get(){ effects++; }, ownKeys(){ effects++; return []; }, getPrototypeOf(){ effects++; return null; } });
  const inherited = Object.create(fixture());
  const cyclic = {}; cyclic.self = cyclic;
  for (const input of [getter,proxy,inherited,cyclic,{...fixture(),toJSON(){effects++;return {};}}]) expectError('LEGACY_UNSAFE_DATA',()=>readLegacyGraph(input));
  const configGetter = {owner:'LEGACY',path:'vite.config.ts'}; Object.defineProperty(configGetter,'text',{enumerable:true,get(){effects++;return '';}});
  expectError('LEGACY_UNSAFE_DATA',()=>bindLegacyConfig(configGetter));
  assert.equal(effects,0);
});

test('oversize input, deep object, sparse arrays and symbols refuse before work', () => {
  expectError('LEGACY_INPUT_LIMIT',()=>readLegacyGraph({...fixture(),lockJson:' '.repeat(262145)}));
  let nested = {}; for(let n=0;n<65;n++) nested={nested};
  expectError('LEGACY_INPUT_LIMIT',()=>readLegacyGraph(nested));
  expectError('LEGACY_UNSAFE_DATA',()=>legacyBounds(new Array(1)));
  const i=fixture(); i[Symbol('hidden')]='x'; expectError('LEGACY_UNSAFE_DATA',()=>readLegacyGraph(i));
});

test('null and malformed containers produce finite model errors, never native TypeError', () => {
  for (const fn of [()=>readLegacyGraph(null),()=>readLegacyListing(null),()=>bindLegacyConfig(null),()=>legacyBounds([null])]) {
    expectError('LEGACY_INVALID_GRAPH',fn);
  }
  const {g,s,configs}=recipeFixture();
  expectError('LEGACY_INVALID_GRAPH',()=>makeLegacyRecipe(g,{...s,members:[null]},configs));
  expectError('LEGACY_INVALID_GRAPH',()=>makeLegacyRecipe(g,s,configs.map((c,n)=>n===0?null:c)));
  expectError('LEGACY_INVALID_GRAPH',()=>readLegacyGraph(fixture(l=>{l.packages['node_modules/alpha'].engines={node:123};})));
});

test('L-SEC-01 rejects malformed owner before coercion in both config APIs with finite errors and zero effects', () => {
  let effects = 0;
  const {g,s,configs}=recipeFixture();
  const invalidOwners=[{},Object.create(null),{toString:'not callable',valueOf:'not callable'},null,[],['LEGACY'],0,1,true,false,'','legacy','UNKNOWN','LEGACY:CANDIDATE'];
  for(const owner of invalidOwners){
    expectError('LEGACY_CONFIG_MISMATCH',()=>bindLegacyConfig({owner,path:'vite.config.ts',text:''}));
    expectError('LEGACY_CONFIG_MISMATCH',()=>makeLegacyRecipe(g,s,configs.map((c,n)=>n===0?{...c,owner}:c)));
  }
  expectError('LEGACY_CONFIG_MISMATCH',()=>bindLegacyConfig({path:'vite.config.ts',text:''}));
  const absent=({...configs[0]}); delete absent.owner;
  expectError('LEGACY_CONFIG_MISMATCH',()=>makeLegacyRecipe(g,s,configs.map((c,n)=>n===0?absent:c)));
  const getter={};Object.defineProperty(getter,'valueOf',{enumerable:true,get(){effects++;return ()=>{effects++;};}});
  const proxy=new Proxy({}, {get(){effects++;},ownKeys(){effects++;return [];},getPrototypeOf(){effects++;return null;}});
  const coercion={toString(){effects++;return 'LEGACY';},valueOf(){effects++;return 'LEGACY';}};
  const primitiveHook={[Symbol.toPrimitive](){effects++;return 'LEGACY';}};
  for(const owner of [getter,proxy,coercion,primitiveHook,undefined,Symbol('LEGACY')]){
    expectError('LEGACY_UNSAFE_DATA',()=>bindLegacyConfig({owner,path:'vite.config.ts',text:''}));
    expectError('LEGACY_UNSAFE_DATA',()=>makeLegacyRecipe(g,s,configs.map((c,n)=>n===0?{...c,owner}:c)));
  }
  assert.equal(effects,0);
});
