import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { randomUUID, createHash } from 'node:crypto';
import { spawnSync, execFileSync } from 'node:child_process';
import { platform, release, arch } from 'node:os';
import { REQUIRED_RULES, TARGET_CHECK_NAMES } from './runtime.mjs';
import { auditSelftestCounts } from '../scripts/project-ui-results.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const runner = path.join(root, 'ui-audit', 'run.mjs');
const run = (args, env = {}) => spawnSync(process.execPath, [runner, ...args], {
  cwd: root, encoding: 'utf8', timeout: 60_000, env: { ...process.env, ...env }, windowsHide: true,
});
const outputPath = label => `artifacts/ui-audit/test-cli-${label}-${randomUUID()}.json`;

test('real browser selftest emits source-bound PASS and refuses an existing report', () => {
  const output = outputPath('chromium');
  // Derive the consumer's facts independently, before launching the producer.
  // In particular, its full audit OS is not the remake runner's platform field.
  const auditFiles = ['audit.js','demo-buggy.html','effective-targets.html','run.mjs','config.json','runtime.mjs'];
  const moduleUrl = process.env.UI_AUDIT_PLAYWRIGHT_MODULE || import.meta.resolve('playwright');
  const expected = {head:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),node:process.version,os:platform(),
    auditOS:`${platform()} ${release()} ${arch()}`,
    playwrightVersion:JSON.parse(fs.readFileSync(fileURLToPath(new URL('./package.json',moduleUrl)),'utf8')).version,
    files:auditFiles.map(file=>{const bytes=fs.readFileSync(path.join(root,'ui-audit',file));
      return {path:`ui-audit/${file}`,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')};})};
  const startedAfter = Date.now();
  const result = run(['--selftest', '--selftest-report', output]);
  const finishedBefore = Date.now();
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
  assert.deepEqual(auditSelftestCounts(report,expected,{startedAfter,finishedBefore}),
    {run:1,pass:1,fail:0,skip:0,detectedFindings:23,targetControls:16});
  for (const edit of [r=>r.environment.os=platform(),r=>r.sourcePreserved=false,r=>r.errors.push('SEEDED_CONSUMER_REJECTION')]) {
    const corrupted=structuredClone(report);edit(corrupted);
    assert.throws(()=>auditSelftestCounts(corrupted,expected,{startedAfter,finishedBefore}));
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
