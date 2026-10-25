#!/usr/bin/env node
/**
 * UI Audit runner (pos-cafe flavour).
 *
 *   node ui-audit/run.mjs                    # audit every configured target
 *   node ui-audit/run.mjs --update           # accept current findings as the baseline
 *   node ui-audit/run.mjs --state floor      # audit a single named state
 *   node ui-audit/run.mjs --route /          # audit a single URL route
 *   node ui-audit/run.mjs --viewport tablet  # audit a single viewport
 *   node ui-audit/run.mjs --selftest         # verify the harness against demo-buggy.html
 *   node ui-audit/run.mjs --list             # print configured targets and exit
 *
 * Config:  ui-audit/config.json
 * Output:  ui-audit/report.json, ui-audit/report.md, ui-audit/out/*.png
 * Exit code 1 when a blocking finding appears that is not in ui-audit/baseline.json.
 *
 * pos-cafe has no URL router: the whole app is one page driven by zustand state,
 * so a "target" is usually a named *state* reached by a short list of steps,
 * not a URL. See `states` in config.json and README.md.
 */
import { platform, release, arch } from 'node:os';
import { createHash } from 'node:crypto';
import { parseArgs, selectMatrix, sourceIdentity, verifySource, assessSelftest, TARGET_CHECK_NAMES,
  prepareReportPath, writeNewReport, loadPlaywright, startDevServer, stopDevServer,
  getDevServerDiagnostics, runAuditMatrix, setupFailure } from './runtime.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const auditSrc = fs.readFileSync(path.join(here, 'audit.js'), 'utf8');

const root = path.resolve(here, '..');
const options = parseArgs(process.argv.slice(2));
const cfg = JSON.parse(fs.readFileSync(path.join(here, 'config.json'), 'utf8'));
const outDir = path.join(here, 'out');
const baselinePath = path.join(here, 'baseline.json');
const sel = (s) => (s.startsWith('@') ? `[data-testid="${s.slice(1)}"]` : s);

if (options.help) {
  console.log(`UI audit (local mock only)
  npm run ui-audit:selftest
  node ui-audit/run.mjs --selftest --selftest-report artifacts/ui-audit/<new-name>.json
  node ui-audit/run.mjs --list
  node ui-audit/run.mjs [--state NAME | --route PATH] [--viewport NAME]
  --update accepts findings only after explicit owner review and approval.
See ui-audit/README.md. Pilot remaking a real Stitch screen is separate.`);
  process.exit(0);
}
const selftestReportPath = options.selftestReport ? prepareReportPath(root, options.selftestReport) : null;

// ---------------------------------------------------------------- steps
async function runSteps(page, steps) {
  for (const [index, step] of steps.entries()) {
    try {
      if (step.click) {
        await page.locator(sel(step.click)).first().click({ timeout: step.timeout || 15000 });
      } else if (step.fill) {
        await page.locator(sel(step.fill)).first().fill(String(step.value ?? ''), { timeout: step.timeout || 15000 });
      } else if (step.press) {
        await page.keyboard.press(step.press);
      } else if (step.waitFor) {
        await page
          .locator(sel(step.waitFor))
          .first()
          .waitFor({ state: step.state || 'visible', timeout: step.timeout || 20000 });
      } else if (step.wait) {
        await page.waitForTimeout(step.wait);
      } else if (step.clickAll) {
        // one click per listed selector, in order (PIN pads, quantity steppers)
        for (const s of step.clickAll) {
          await page.locator(sel(s)).first().click({ timeout: step.timeout || 15000 });
        }
      } else {
        throw new Error(`unknown step: ${JSON.stringify(step)}`);
      }
    } catch (error) {
      const detail = String(error?.message || error).split('\n')[0];
      throw new Error(`step ${index + 1} ${JSON.stringify(step)} failed: ${detail}`);
    }
  }
}

// ---------------------------------------------------------------- findings
// Selectors of repeated rows differ only by :nth-of-type(N). Collapsing them
// keeps one menu item's defect from producing forty baseline entries, and keeps
// the baseline stable when the seed data changes.
// React `useId` ids (MUI inputs) change between renders, so they are normalised
// too or the baseline would churn on every unrelated re-render.
const normalizeSel = (s) =>
  s.replace(/:nth-of-type\(\d+\)/g, ':nth-of-type(n)').replace(/#:r[0-9a-z]*:/gi, '#:r:');

const keyOf = (f, target, vp, collapse) =>
  [target.name, vp.name, f.rule, collapse ? normalizeSel(f.sel) : f.sel].join(' :: ');

function collapseFindings(findings) {
  const groups = new Map();
  for (const f of findings) {
    const g = groups.get(f.key);
    if (!g) {
      groups.set(f.key, { ...f, count: 1, examples: [f.sel] });
    } else {
      g.count += 1;
      if (g.examples.length < 3 && !g.examples.includes(f.sel)) g.examples.push(f.sel);
    }
  }
  return [...groups.values()];
}

// ---------------------------------------------------------------- reporting
const SEV_ORDER = { error: 0, warn: 1, info: 2 };

function tally(findings, field) {
  const m = new Map();
  for (const f of findings) m.set(f[field], (m.get(f[field]) || 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

function writeMarkdown(all, targets, viewports, setupFailures = [], coverage = {}) {
  const fresh = all.filter((f) => !f.known);
  const lines = [];
  lines.push('# UI audit report', '');
  lines.push(`generated: ${new Date().toISOString()}`);
  lines.push(`targets: ${targets.length} x viewports: ${viewports.length}`);
  lines.push(`findings: ${all.length} total, ${fresh.length} not in baseline`, '');
  lines.push(`setup failures: ${setupFailures.length}`);
  lines.push(`coverage: ${coverage.completedPairs ?? 0}/${targets.length * viewports.length} completed`);
  lines.push(`status: ${coverage.status || 'INCOMPLETE'}`, '');

  if (setupFailures.length) {
    lines.push('## Blocking setup failures', '');
    lines.push('| target | viewport | failed step |');
    lines.push('| --- | --- | --- |');
    for (const failure of setupFailures)
      lines.push(`| ${failure.target} | ${failure.viewport} | ${failure.detail.replaceAll('|', '\\|')} |`);
    lines.push('');
  }

  if (coverage.serverDiagnostics?.tail && setupFailures.length) {
    lines.push('## Owned server diagnostic tail (private runtime output)', '');
    lines.push('```text', coverage.serverDiagnostics.tail.replaceAll('```', '[fence]').slice(-4096), '```', '');
  }

  lines.push('## By severity', '');
  lines.push('| severity | total | new |');
  lines.push('| --- | ---: | ---: |');
  for (const [s] of tally(all, 'severity')) {
    lines.push(
      `| ${s} | ${all.filter((f) => f.severity === s).length} | ${fresh.filter((f) => f.severity === s).length} |`,
    );
  }
  lines.push('');

  lines.push('## By rule', '');
  lines.push('| rule | severity | total | new |');
  lines.push('| --- | --- | ---: | ---: |');
  for (const [rule, n] of tally(all, 'rule')) {
    const sev = all.find((f) => f.rule === rule).severity;
    lines.push(`| \`${rule}\` | ${sev} | ${n} | ${fresh.filter((f) => f.rule === rule).length} |`);
  }
  lines.push('');

  lines.push('## By target', '');
  lines.push('| target | viewport | total | new |');
  lines.push('| --- | --- | ---: | ---: |');
  for (const t of targets) {
    for (const vp of viewports) {
      const scope = all.filter((f) => f.target === t.name && f.viewport === vp.name);
      if (!scope.length) continue;
      lines.push(`| ${t.name} | ${vp.name} | ${scope.length} | ${scope.filter((f) => !f.known).length} |`);
    }
  }
  lines.push('');

  lines.push('## Findings', '');
  const sorted = [...all].sort(
    (a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity] || a.rule.localeCompare(b.rule),
  );
  for (const f of sorted) {
    const n = f.count > 1 ? ` x${f.count}` : '';
    lines.push(`### \`${f.rule}\` (${f.severity})${f.known ? ' - baseline' : ''}${n}`);
    lines.push(`- target: **${f.target}** / ${f.viewport}`);
    lines.push(`- selector: \`${f.sel}\``);
    lines.push(`- detail: ${f.detail}`);
    if (f.label) lines.push(`- text: "${f.label}"`);
    if (f.rect) lines.push(`- rect: ${f.rect.w}x${f.rect.h} at (${f.rect.x}, ${f.rect.y})`);
    lines.push('');
  }
  fs.writeFileSync(path.join(here, 'report.md'), lines.join('\n'));
}

// ---------------------------------------------------------------- selftest
async function selftest() {
  const startedAt = new Date().toISOString();
  const source = sourceIdentity(here);
  const environment = { node: process.version, os: `${platform()} ${release()} ${arch()}`,
    engine: 'chromium', channel: 'chromium', browserVersion: null, playwrightVersion: null };
  let browser, ctx, findings = [], targetFindings = [];
  let targetChecks = Object.fromEntries(TARGET_CHECK_NAMES.map(name => [name, false]));
  const errors = [];
  try {
    const playwright = await loadPlaywright();
    environment.playwrightVersion = playwright.version;
    browser = await playwright.chromium.launch({ channel: 'chromium', headless: true });
    environment.browserVersion = browser.version();
    ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1 });
    await ctx.addInitScript({ content: auditSrc });
    const page = await ctx.newPage();
    await page.goto(pathToFileURL(path.join(here, 'demo-buggy.html')).toString(), { waitUntil: 'load' });
    await page.waitForTimeout(300);
    findings = await page.evaluate(() => window.__uiAudit());
    const controls = await ctx.newPage();
    await controls.goto(pathToFileURL(path.join(here, 'effective-targets.html')).toString(), { waitUntil: 'load' });
    targetFindings = await controls.evaluate(() => window.__uiAudit());
    const scrollOffsetsRestored = await controls.evaluate(() =>
      document.getElementById('offscreen-label-scroll').scrollTop === 0);
    const inactiveLabelsDoNotToggle = await controls.evaluate(() => {
      const covered = document.getElementById('anchor-label-input');
      const disabled = document.getElementById('disabled-input');
      document.getElementById('anchor-cover').click();
      disabled.parentElement.click();
      return !covered.checked && !disabled.checked;
    });
    const has = (rule, selector) => targetFindings.some(f => f.rule === rule && f.sel === selector);
    targetChecks = {
      labelUsesEffectiveArea: !has('tiny-target', '#healthy-label-input'),
      coveredLabelKeepsTinyFinding: has('tiny-target', '#partly-label-input'),
      validCornerUsesReachableArea: !has('tiny-target', '#corner-label-input'),
      choosesReachableAssociatedLabel: !has('tiny-target', '#multi-label-input'),
      interactiveChildDoesNotActivateInput: has('tiny-target', '#anchor-label-input'),
      clippedControlIsReported: has('clipped-interactive', '#clipped-button'),
      innerScrollerCanRevealControl: !has('clipped-interactive', '#nested-button'),
      offscreenLabelCanBeMeasuredAfterScroll: !has('tiny-target', '#offscreen-label-input'),
      scrollOffsetsRestored,
      disabledControlHasNoTapRequirement: !has('tiny-target', '#disabled-input'),
      inactiveLabelsDoNotToggle,
      bareSmallControlDetected: has('tiny-target', '#small-button'),
      scrollClippedHitIgnored: !has('hit-blocked', '#off-scroll'),
      scrollClippedOverlapIgnored: !has('overlapping-controls', '#off-scroll'),
      trulyCoveredHitDetected: has('hit-blocked', '#covered-button'),
      trulyCoveredOverlapDetected: has('overlapping-controls', '#covered-button'),
    };
  } catch (error) { errors.push(String(error.message || error)); }
  finally {
    try { await ctx?.close(); } catch (error) { errors.push(`Context cleanup failed: ${error.message}`); }
    try { await browser?.close(); } catch (error) { errors.push(`Browser cleanup failed: ${error.message}`); }
  }
  let sourcePreserved = false;
  try { verifySource(source, sourceIdentity(here)); sourcePreserved = true; }
  catch (error) { errors.push(error.message); }
  const assessment = assessSelftest(findings, targetChecks);
  const status = assessment.status === 'PASS' && !errors.length ? 'PASS' : 'FAIL';
  console.log(`selftest: ${findings.length} finding(s) on demo-buggy.html`);
  console.log(`  severity: ${tally(findings, 'severity').map(([key, value]) => `${key}=${value}`).join(' ')}`);
  for (const [rule, count] of tally(findings, 'rule')) console.log(`  ${rule.padEnd(24)} ${count}`);
  if (findings.length !== 23) console.log(`FAIL finding count ${findings.length}; expected exactly 23`);
  if (assessment.missingRules.length) console.log(`FAIL missing rules: ${assessment.missingRules.join(', ')}`);
  for (const [name, passed] of Object.entries(targetChecks)) if (!passed) console.log(`FAIL effective-target control: ${name}`);
  if (Object.values(targetChecks).every(Boolean)) console.log('effective-target controls OK');
  for (const error of errors) console.log(`FAIL ${error}`);
  const report = { version: 1, kind: 'ui-audit-selftest', productAcceptance: 'NOT_ASSESSED',
    startedAt, finishedAt: new Date().toISOString(), ...assessment, status, source, environment, sourcePreserved, errors };
  if (selftestReportPath) writeNewReport(root, selftestReportPath, report);
  console.log(status === 'PASS' ? '\nselftest OK - exactly 23 findings, 14 required rules and 16 effective-target controls' :
    '\nselftest FAILED - fix the harness before trusting any app result');
  return status === 'PASS' ? 0 : 1;
}

if (options.selftest) process.exit(await selftest());

// ---------------------------------------------------------------- main
const { targets, viewports } = selectMatrix(cfg, options);
if (options.list) {
  console.log('targets:');
  for (const target of targets) console.log(`  ${target.kind.padEnd(6)} ${target.name.padEnd(24)} ${target.describe}`);
  console.log('viewports:');
  for (const vp of viewports) console.log(`  ${vp.name.padEnd(10)} ${vp.width}x${vp.height}`);
  process.exit(0);
}

fs.mkdirSync(outDir, { recursive: true });
const baseline = fs.existsSync(baselinePath)
  ? new Set(JSON.parse(fs.readFileSync(baselinePath, 'utf8')))
  : new Set();
const collapse = cfg.collapse !== false;
const failOn = new Set(cfg.failOn || ['error']);
const severityOverride = cfg.severityOverride || {};

let devServer = null;
let browser = null;
let exitCode = 0;
const all = [];
const pinPhotos = [];
const setupFailures = [];
const startedAt = new Date().toISOString();
const environment = { node: process.version, os: `${platform()} ${release()} ${arch()}`,
  engine: 'chromium', channel: 'chromium', browserVersion: null, playwrightVersion: null };
const operationalSource = () => ({ ...sourceIdentity(here),
  baselineSha256: createHash('sha256').update(fs.readFileSync(baselinePath)).digest('hex') });
const source = { before: operationalSource(), after: null, preserved: null };
let progress = { expectedPairs: targets.length * viewports.length, attemptedPairs: 0, completedPairs: 0 };
let finishedAt = null;
const status = () => !finishedAt || setupFailures.length || progress.completedPairs !== progress.expectedPairs ? 'INCOMPLETE' : 'COMPLETE';
const checkpoint = () => {
  const runStatus = { version: 1, kind: 'ui-audit-run', status: status(), productAcceptance: 'NOT_ASSESSED',
    startedAt, finishedAt, ...progress, setupFailures, source, environment, pinPhotos, serverDiagnostics: getDevServerDiagnostics(devServer) };
  // Keep the historical finding-array contract; completeness is explicit in the
  // Markdown and the additional ignored status receipt, never inferred from [].
  fs.writeFileSync(path.join(here, 'report.json'), JSON.stringify(all, null, 2));
  fs.writeFileSync(path.join(outDir, 'status.json'), JSON.stringify(runStatus, null, 2));
  writeMarkdown(all, targets, viewports, setupFailures, runStatus);
};
const recordFailure = failure => {
  setupFailures.push(failure);
  exitCode = 2;
  console.log(`SETUP-FAIL ${failure.viewport.padEnd(8)} ${failure.target.padEnd(24)} ${failure.detail}`);
  const diagnostics = getDevServerDiagnostics(devServer);
  if (diagnostics?.tail) console.log(`Owned dev server diagnostic tail (max4096 chars):\n${diagnostics.tail}`);
};
let stopping = false;
const cleanup = async () => {
  try { await browser?.close(); }
  finally { await stopDevServer(devServer); }
};
for (const [signal, code] of [['SIGINT', 130], ['SIGTERM', 143]]) process.once(signal, async () => {
  if (stopping) return;
  stopping = true;
  recordFailure(setupFailure('__run__', 'all', 'interrupted', new Error(signal)));
  try { await cleanup(); }
  finally { finishedAt = new Date().toISOString(); checkpoint(); process.exit(code); }
});

checkpoint();
let outerStage = 'server-start';
try {
  devServer = await startDevServer(cfg, root, { onStarted: child => { devServer = child; } });
  outerStage = 'browser-start';
  const playwright = await loadPlaywright();
  environment.playwrightVersion = playwright.version;
  browser = await playwright.chromium.launch({ channel: 'chromium', headless: true });
  environment.browserVersion = browser.version();
  const ctxOpts = {};
  if (cfg.storageState && fs.existsSync(path.join(here, cfg.storageState))) {
    ctxOpts.storageState = path.join(here, cfg.storageState);
  }
  outerStage = 'matrix';
  await runAuditMatrix({ browser, targets, viewports, contextOptions: ctxOpts,
    onFailure: recordFailure,
    onProgress: ({ failures: _failures, ...current }) => { progress = current; checkpoint(); },
    runTarget: async ({ context: ctx, target, viewport: vp, stage }) => {
      // Each state has a fresh context; store pairing cannot leak between cases.
      stage('detector-install');
      await ctx.addInitScript({ content: auditSrc });
      const page = await ctx.newPage();
      const url = new URL(target.route, cfg.baseUrl).toString();
      stage('navigation');
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: cfg.timeout || 30000 });
      } catch {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: cfg.timeout || 30000 });
      }
      stage('steps');
      if (cfg.waitFor) await page.waitForSelector(sel(cfg.waitFor), { timeout: 10000 });
      await runSteps(page, target.steps);
      stage('settle-fonts');
      await page.waitForTimeout(cfg.settleMs ?? 400);
      await page.evaluate(() => document.fonts && document.fonts.ready);
      stage('detector');
      const raw = await page.evaluate((o) => window.__uiAudit(o), {
        minTarget: cfg.minTarget ?? 24,
        minFont: cfg.minFont ?? 10,
        contrastMin: cfg.contrastMin ?? 4.5,
        checkContrast: cfg.checkContrast !== false,
        ignore: cfg.ignore || '',
      });
      const scope = await page.evaluate(() => window.__uiAuditScope || null);
      for (const finding of raw) {
        if (severityOverride[finding.rule]) finding.severity = severityOverride[finding.rule];
        Object.assign(finding, { scope, target: target.name, route: target.route, viewport: vp.name,
          key: keyOf(finding, target, vp, collapse) });
      }
      const grouped = collapse ? collapseFindings(raw) : raw.map(f => ({ ...f, count: 1, examples: [f.sel] }));
      for (const finding of grouped) { finding.known = baseline.has(finding.key); all.push(finding); }
      // Preserve detected findings even if annotation/screenshot subsequently fails.
      const fresh = grouped.filter(finding => !finding.known);
      const pinTarget = target.name === 'required-pin-change';
      if (grouped.length || pinTarget) {
        if (pinTarget) {
          const url = new URL(page.url());
          if (cfg.devServer?.env?.VITE_DATA_MODE !== 'mock' || cfg.devServer.env.VITE_SUPABASE_URL !== ''
            || cfg.devServer.env.VITE_SUPABASE_ANON_KEY !== '' || cfg.baseUrl !== 'http://127.0.0.1:5178'
            || target.route !== '/ui-audit/required-pin-change.html' || url.origin !== cfg.baseUrl
            || url.pathname !== target.route || url.search || url.hash || options.update) throw new Error('PIN_PHOTO_FIXTURE_REFUSED');
          const safe = await page.evaluate(() => {
            const inputs = [...document.querySelectorAll('input')];
            return document.querySelectorAll('[data-testid="required-pin-change-screen"]').length === 1
              && document.querySelectorAll('[data-testid="complete-required-pin"]').length === 1
              && document.body.innerText.includes('Tài khoản: Chủ quán Cà phê Mây')
              && inputs.length === 2 && inputs.every(input => input.type === 'password' && input.value === ''
                && ['required-new-pin', 'required-confirm-pin'].includes(input.getAttribute('data-testid')))
              && new Set(inputs.map(input => input.getAttribute('data-testid'))).size === 2;
          });
          if (!safe) throw new Error('PIN_PHOTO_CONTENT_REFUSED');
        }
        stage('annotation');
        await page.evaluate(fs2 => window.__uiAuditMark(fs2), grouped);
        stage('screenshot');
        const name = target.name.replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '') || 'root';
        const filename = `${name}__${vp.name}.png`, photoPath = path.join(outDir, filename);
        await page.screenshot({ path: photoPath, fullPage: true,
          ...(pinTarget ? { mask: [page.locator('input[type="password"]')], maskColor: '#000000' } : {}) });
        if (pinTarget) {
          const bytes = fs.readFileSync(photoPath);
          pinPhotos.push({ state: target.name, viewport: vp.name, width: vp.width, height: vp.height,
            filename, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'),
            credentialFreeMock: true, passwordInputsEmpty: true, maskedPasswordInputs: 2, annotatedFindings: grouped.length });
        }
      }
      const bad = fresh.filter(finding => failOn.has(finding.severity)).length;
      console.log(`${bad ? 'FAIL' : ' ok '}  ${vp.name.padEnd(8)} ${target.name.padEnd(24)} ` +
        `${grouped.length} finding(s), ${fresh.length} new` + (scope ? `  [scoped to top layer ${scope}]` : ''));
    },
  });
} catch (error) {
  recordFailure(setupFailure('__run__', 'all', outerStage, error));
} finally {
  try { await cleanup(); }
  catch (error) { recordFailure(setupFailure('__run__', 'all', 'cleanup', error)); }
  try { source.after = operationalSource(); verifySource(source.before, source.after); source.preserved = true; }
  catch (error) { source.preserved = false; recordFailure(setupFailure('__run__', 'all', 'source-validation', error)); }
  finishedAt = new Date().toISOString();
  checkpoint();
}

console.log('');
console.log(`total ${all.length} finding(s): ${tally(all, 'severity').map(([k, v]) => `${k}=${v}`).join(' ') || 'none'}`);
for (const [rule, n] of tally(all, 'rule')) console.log(`  ${rule.padEnd(24)} ${n}`);
console.log('\nreport: ui-audit/report.md, ui-audit/report.json');

if (setupFailures.length) {
  console.log(`\n${setupFailures.length} blocking setup failure(s); audit coverage is incomplete.`);
  for (const failure of setupFailures)
    console.log(`  ${failure.target} [${failure.viewport}] ${failure.detail}`);
}

if (options.update) {
  if (setupFailures.length) {
    console.log('baseline not updated because one or more targets were not audited');
    process.exit(2);
  }
  const keys = [...new Set(all.map((f) => f.key))].sort();
  fs.writeFileSync(baselinePath, JSON.stringify(keys, null, 2));
  console.log(`baseline updated: ${keys.length} accepted finding(s)`);
  process.exit(0);
}

const blocking = all.filter((f) => !f.known && failOn.has(f.severity));
if (blocking.length) {
  console.log(`\n${blocking.length} new ${[...failOn].join('/')} finding(s):\n`);
  for (const f of blocking) {
    console.log(`  ${f.target} [${f.viewport}] ${f.rule}${f.count > 1 ? ` x${f.count}` : ''}`);
    console.log(`    ${f.sel}`);
    console.log(`    ${f.detail}${f.label ? `  ("${f.label}")` : ''}`);
  }
  console.log(`\nannotated screenshots: ${path.relative(process.cwd(), outDir)}`);
  console.log('Classify the annotated findings; baseline changes require explicit owner approval.');
  process.exit(exitCode || 1);
}
if (exitCode) {
  console.log('\nAudit INCOMPLETE; no clean result is claimed.');
  process.exit(exitCode);
}
console.log('\nno new UI anomalies at configured blocking severities; warnings/info remain in the report');
process.exit(0);
