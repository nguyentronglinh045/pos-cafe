import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { randomUUID, createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { REQUIRED_RULES, TARGET_CHECK_NAMES } from './runtime.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const runner = path.join(root, 'ui-audit', 'run.mjs');
const run = (args, env = {}) => spawnSync(process.execPath, [runner, ...args], {
  cwd: root, encoding: 'utf8', timeout: 60_000, env: { ...process.env, ...env }, windowsHide: true,
});
const outputPath = label => `artifacts/ui-audit/test-cli-${label}-${randomUUID()}.json`;

test('real browser selftest emits source-bound PASS and refuses an existing report', () => {
  const output = outputPath('chromium');
  const result = run(['--selftest', '--selftest-report', output]);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /selftest: 23 finding\(s\)/);
  assert.match(result.stdout, /selftest OK/);
  const bytes = fs.readFileSync(path.join(root, output));
  const report = JSON.parse(bytes);
  assert.equal(report.version, 1);
  assert.equal(report.kind, 'ui-audit-selftest');
  assert.equal(report.status, 'PASS');
  assert.equal(report.productAcceptance, 'NOT_ASSESSED');
  assert.equal(report.findingCount, 23);
  assert.equal(report.expectedFindingCount, 23);
  assert.deepEqual(report.requiredRules, [...REQUIRED_RULES]);
  assert.deepEqual(report.missingRules, []);
  assert.deepEqual(Object.keys(report.targetChecks), [...TARGET_CHECK_NAMES]);
  assert(Object.values(report.targetChecks).every(value => value === true));
  assert.equal(report.sourcePreserved, true);
  assert.equal(report.environment.engine, 'chromium');
  assert.equal(report.environment.channel, 'chromium');
  assert.match(report.environment.browserVersion, /^\d+\./);
  assert.match(report.environment.playwrightVersion, /^\d+\.\d+\./);
  for (const [field, file] of Object.entries({ detectorSha256: 'audit.js', fixtureSha256: 'demo-buggy.html',
    effectiveTargetsSha256: 'effective-targets.html', runnerSha256: 'run.mjs', configSha256: 'config.json', runtimeSha256: 'runtime.mjs' })) {
    assert.equal(report.source[field], createHash('sha256').update(fs.readFileSync(path.join(root, 'ui-audit', file))).digest('hex'));
  }
  const overwrite = run(['--selftest', '--selftest-report', output]);
  assert.notEqual(overwrite.status, 0);
  assert.match(overwrite.stderr, /already exists/);
  assert.deepEqual(fs.readFileSync(path.join(root, output)), bytes);
});

test('failed browser-module setup emits FAIL instead of a zero-findings PASS', () => {
  const output = outputPath('setup-failure');
  const missing = new URL(`./missing-${randomUUID()}.mjs`, import.meta.url).href;
  const result = run(['--selftest', '--selftest-report', output], { UI_AUDIT_PLAYWRIGHT_MODULE: missing });
  assert.equal(result.status, 1, result.stdout + result.stderr);
  const report = JSON.parse(fs.readFileSync(path.join(root, output), 'utf8'));
  assert.equal(report.status, 'FAIL');
  assert.equal(report.findingCount, 0);
  assert.equal(report.productAcceptance, 'NOT_ASSESSED');
  assert.equal(report.sourcePreserved, true);
  assert(report.errors.length > 0);
  assert.match(result.stdout, /selftest FAILED/);
  assert.doesNotMatch(result.stdout, /selftest OK/);
});

test('a page-setup exception still closes the owned context and browser', () => {
  // Fault injection into the real CLI cleanup path, never a product/browser PASS.
  const folder = path.join(root, 'artifacts', 'ui-audit', `test-cleanup-double-${randomUUID()}`);
  fs.mkdirSync(folder, { recursive: true });
  const marker = path.join(folder, 'closed.jsonl');
  fs.writeFileSync(path.join(folder, 'package.json'), JSON.stringify({ name: 'playwright', version: '0.0.0-test' }));
  const modulePath = path.join(folder, 'fake-playwright.mjs');
  fs.writeFileSync(modulePath, `import fs from 'node:fs';
    const mark = value => fs.appendFileSync(${JSON.stringify(marker)}, JSON.stringify(value) + '\\n');
    export const chromium = { launch: async () => ({
      version: () => '0.0.0-test',
      newContext: async () => ({ addInitScript: async () => {},
        newPage: async () => { throw new Error('SEEDED_PAGE_SETUP_FAILURE'); },
        close: async () => mark('context') }),
      close: async () => mark('browser') }) };`);
  const output = outputPath('context-failure');
  const result = run(['--selftest', '--selftest-report', output], { UI_AUDIT_PLAYWRIGHT_MODULE: pathToFileURL(modulePath).href });
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.deepEqual(fs.readFileSync(marker, 'utf8').trim().split('\n').map(line => JSON.parse(line)), ['context', 'browser']);
  const report = JSON.parse(fs.readFileSync(path.join(root, output), 'utf8'));
  assert.equal(report.status, 'FAIL');
  assert.equal(report.productAcceptance, 'NOT_ASSESSED');
  assert(report.errors.includes('SEEDED_PAGE_SETUP_FAILURE'));
});

test('CLI selection typos fail before browser startup instead of claiming an empty clean audit', () => {
  for (const args of [['--viewport', 'does-not-exist'], ['--state', 'does-not-exist'], ['--viewprot', 'tablet']]) {
    const result = run(args, { UI_AUDIT_PLAYWRIGHT_MODULE: 'file:///this-module-must-not-be-loaded.mjs' });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /No targets or viewports matched|Unknown argument/);
    assert.doesNotMatch(result.stdout, /no new UI anomalies/);
  }
});
