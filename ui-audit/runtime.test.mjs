import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { parseArgs, selectMatrix, assessSelftest, REQUIRED_RULES, TARGET_CHECK_NAMES,
  prepareReportPath, writeNewReport, verifySource, assertPortFree, startDevServer, stopDevServer } from './runtime.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(fs.readFileSync(path.join(root, 'ui-audit', 'config.json'), 'utf8'));
const checks = () => Object.fromEntries(TARGET_CHECK_NAMES.map(name => [name, true]));
const seeded = () => [...REQUIRED_RULES, ...Array(9).fill('placeholder-leak')].map(rule => ({ rule }));

test('legacy permissive 18..30 counts cannot pass the exactly-23 detector gate', () => {
  for (const count of [18, 22, 24, 30]) {
    const findings = [...REQUIRED_RULES, ...Array(count - REQUIRED_RULES.length).fill('placeholder-leak')].map(rule => ({ rule }));
    assert.equal(assessSelftest(findings, checks()).status, 'FAIL');
  }
  assert.equal(assessSelftest(seeded(), checks()).status, 'PASS');
});

test('23 findings cannot hide a missing defect class', () => {
  const findings = seeded().map(finding => finding.rule === 'hit-blocked' ? { rule: 'placeholder-leak' } : finding);
  const result = assessSelftest(findings, checks());
  assert.equal(result.findingCount, 23);
  assert.equal(result.status, 'FAIL');
  assert.deepEqual(result.missingRules, ['hit-blocked']);
});

test('every effective-target negative or positive control is mandatory by its exact key', () => {
  for (const name of TARGET_CHECK_NAMES) {
    const changed = checks(); changed[name] = false;
    assert.equal(assessSelftest(seeded(), changed).status, 'FAIL', name);
  }
  const renamed = checks(); delete renamed.scrollOffsetsRestored; renamed.unrelated = true;
  assert.equal(assessSelftest(seeded(), renamed).status, 'FAIL');
});

test('unknown/missing/duplicated CLI options and subset baseline acceptance fail closed', () => {
  for (const args of [['--viewprot', 'tablet'], ['--viewport'], ['--state', '--selftest'], ['--selftest', '--update'],
    ['--selftest-report', 'x.json'], ['--list', '--update'], ['--state', 'floor', '--route', '/'],
    ['--viewport', 'tablet', '--viewport', 'desktop'], ['--update', '--state', 'floor'], ['--update', '--viewport', 'tablet']]) {
    assert.throws(() => parseArgs(args), args.join(' '));
  }
  assert.deepEqual(parseArgs(['--state', 'floor', '--viewport', 'tablet']),
    { update: false, selftest: false, list: false, state: 'floor', viewport: 'tablet' });
});

test('published matrix is 13 main states by 3 historical viewports and uses the main mock admin', () => {
  const matrix = selectMatrix(config);
  assert.equal(matrix.targets.length, 13);
  assert.equal(matrix.viewports.length, 3);
  assert.deepEqual(matrix.viewports.map(vp => [vp.width, vp.height]), [[1024, 768], [1440, 900], [844, 390]]);
  const floor = matrix.targets.find(target => target.name === 'floor');
  assert(floor.steps.some(step => step.click === '@employee-6b7bd350-7db2-4160-8471-cca2668c070d'));
  assert(!JSON.stringify(matrix).includes('30000000-0000-4000-8000-000000000011'));
  assert(!matrix.targets.some(target => /compatibility|required-pin/.test(target.name)));
});

test('a nonexistent viewport/state or empty matrix cannot return a green audit', () => {
  for (const options of [{ viewport: 'typo' }, { state: 'typo' }, { route: '/missing' }]) {
    assert.throws(() => selectMatrix(config, options), /No targets or viewports matched/);
  }
  assert.throws(() => selectMatrix({ ...config, viewports: [] }), /No targets or viewports matched/);
  assert.throws(() => selectMatrix({ ...config, states: [] }), /No targets or viewports matched/);
  assert.equal(selectMatrix(config, { state: 'order-cart', viewport: 'tablet' }).targets.length, 1);
});

test('broken state inheritance fails before starting a server', () => {
  assert.throws(() => selectMatrix({ ...config, states: [{ name: 'one', extends: 'two' }] }), /Unknown parent/);
  assert.throws(() => selectMatrix({ ...config, states: [{ name: 'one', extends: 'two' }, { name: 'two', extends: 'one' }] }), /cycle/);
  assert.throws(() => selectMatrix({ ...config, viewports: [{ name: '../escape', width: 100, height: 100 }] }), /Invalid/);
  assert.throws(() => selectMatrix({ ...config, failOn: [] }), /failOn/);
  assert.throws(() => selectMatrix({ ...config, states: [{ name: 'remote', route: 'https://example.com' }] }), /owned local mock/);
});

test('source identity detects changed runner/config bytes as well as changed HEAD', () => {
  const before = { head: 'abc', runnerSha256: '123', configSha256: '456' };
  assert.doesNotThrow(() => verifySource(before, { ...before }));
  for (const changed of [{ ...before, head: 'new' }, { ...before, runnerSha256: 'bad' }, { ...before, configSha256: 'bad' }]) {
    assert.throws(() => verifySource(before, changed), /UI_AUDIT_SOURCE_CHANGED/);
  }
});

test('selftest reports cannot overwrite files or escape their owned artifact tree', () => {
  const prefix = `artifacts/ui-audit/test-runtime-${randomUUID()}`;
  const output = prepareReportPath(root, `${prefix}/report.json`);
  writeNewReport(root, output, { status: 'FAIL', synthetic: true });
  const original = fs.readFileSync(output);
  assert.throws(() => writeNewReport(root, output, { status: 'PASS' }), /already exists/);
  assert.deepEqual(fs.readFileSync(output), original);
  for (const bad of ['src/report.json', 'artifacts/ui-audit/../../src/report.json', `${prefix}/text.txt`, path.resolve(root, prefix, 'absolute.json')]) {
    assert.throws(() => prepareReportPath(root, bad));
  }
});

test('junction parent rejection occurs before mkdir can create a directory in source', () => {
  const id = `test-junction-${randomUUID()}`;
  const parent = path.join(root, 'artifacts', 'ui-audit', id);
  const target = path.join(root, 'artifacts', 'ui-audit', `junction-target-${randomUUID()}`);
  fs.mkdirSync(target, { recursive: true });
  fs.symlinkSync(target, parent, process.platform === 'win32' ? 'junction' : 'dir');
  assert.throws(() => prepareReportPath(root, `artifacts/ui-audit/${id}/must-not-exist/report.json`), /physical directory/);
  assert.equal(fs.existsSync(path.join(target, 'must-not-exist')), false);
});

const listen = server => new Promise((resolve, reject) => {
  server.once('error', reject); server.listen(0, '127.0.0.1', () => resolve(server.address().port));
});
const close = server => new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
async function freePort() { const server = createServer(); const port = await listen(server); await close(server); return port; }
function serverConfig(port, mode, readyTimeoutMs = 3000) {
  return { baseUrl: `http://127.0.0.1:${port}`, devServer: {
    command: `"${process.execPath}" "${path.join(root, 'ui-audit', 'fixtures', 'lifecycle-server.mjs')}"`, readyTimeoutMs,
    env: { VITE_DATA_MODE: 'mock', VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '',
      UI_AUDIT_LIFECYCLE_PORT: String(port), UI_AUDIT_LIFECYCLE_MODE: mode },
  } };
}
async function portReleased(baseUrl) {
  const end = Date.now() + 3000;
  while (true) {
    try { await assertPortFree(baseUrl); return; }
    catch (error) { if (Date.now() >= end) throw error; await new Promise(resolve => setTimeout(resolve, 50)); }
  }
}

test('preexisting server is rejected and never stopped/reused', async () => {
  const server = createServer((_request, response) => response.end('unowned'));
  const port = await listen(server);
  let launched = false;
  try {
    await assert.rejects(startDevServer(serverConfig(port, 'ready'), root, { onStarted: () => { launched = true; } }), /UI_AUDIT_PORT_IN_USE/);
    assert.equal(launched, false);
    assert.equal(await (await fetch(`http://127.0.0.1:${port}`)).text(), 'unowned');
  } finally { await close(server); }
});

test('a server that never becomes HTTP-ready is stopped even though startup throws', async () => {
  const port = await freePort(), cfg = serverConfig(port, 'not-ready', 1200);
  let owned;
  try {
    await assert.rejects(startDevServer(cfg, root, { onStarted: child => { owned = child; } }), /never became ready/);
    assert(owned?.pid, 'fixture process was actually started');
    await portReleased(cfg.baseUrl);
  } finally { await stopDevServer(owned); }
});

test('an early child exit cannot be mistaken for a ready dev server', async () => {
  const port = await freePort(), cfg = serverConfig(port, 'exit');
  await assert.rejects(startDevServer(cfg, root), /exited before ready/);
  await portReleased(cfg.baseUrl);
});

test('owned ready server is stopped with its shell/process tree', async () => {
  const port = await freePort(), cfg = serverConfig(port, 'ready');
  let child;
  try {
    child = await startDevServer(cfg, root);
    assert.equal((await fetch(cfg.baseUrl)).status, 200);
  } finally { await stopDevServer(child); }
  await portReleased(cfg.baseUrl);
});

test('only local explicit mock environments are accepted for the app audit', async () => {
  const port = await freePort();
  await assert.rejects(startDevServer({ ...serverConfig(port, 'ready'), baseUrl: 'https://example.com' }, root), /local HTTP/);
  const cfg = serverConfig(port, 'ready'); cfg.devServer.env.VITE_DATA_MODE = 'supabase';
  await assert.rejects(startDevServer(cfg, root), /explicitly use mock/);
});
