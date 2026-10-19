import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawn, spawnSync, execFileSync } from 'node:child_process';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';

export const REQUIRED_RULES = Object.freeze([
  'hit-blocked', 'empty-icon', 'placeholder-leak', 'bad-inline-style',
  'tiny-target', 'overflow-x', 'no-accessible-name', 'broken-image',
  'low-contrast', 'tiny-font', 'clipped-text', 'bad-class-token',
  'zero-size-interactive', 'overlapping-controls',
]);
export const EXPECTED_FINDING_COUNT = 23;
export const MAX_REPORT_BYTES = 1024 * 1024;
export const TARGET_CHECK_NAMES = Object.freeze([
  'labelUsesEffectiveArea', 'coveredLabelKeepsTinyFinding', 'validCornerUsesReachableArea',
  'choosesReachableAssociatedLabel', 'interactiveChildDoesNotActivateInput',
  'clippedControlIsReported', 'innerScrollerCanRevealControl',
  'offscreenLabelCanBeMeasuredAfterScroll', 'scrollOffsetsRestored',
  'disabledControlHasNoTapRequirement', 'inactiveLabelsDoNotToggle', 'bareSmallControlDetected',
  'scrollClippedHitIgnored', 'scrollClippedOverlapIgnored', 'trulyCoveredHitDetected', 'trulyCoveredOverlapDetected',
]);

export function parseArgs(args) {
  const result = { update: false, selftest: false, list: false };
  const booleans = { '--update': 'update', '--selftest': 'selftest', '--list': 'list', '--help': 'help' };
  const values = { '--state': 'state', '--route': 'route', '--viewport': 'viewport', '--selftest-report': 'selftestReport' };
  const seen = new Set();
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (seen.has(arg)) throw new Error(`Duplicate argument: ${arg}`);
    seen.add(arg);
    if (booleans[arg]) result[booleans[arg]] = true;
    else if (values[arg]) {
      const value = args[++i];
      if (!value || value.startsWith('--')) throw new Error(`Missing value: ${arg}`);
      result[values[arg]] = value;
    } else throw new Error(`Unknown argument: ${arg}`);
  }
  if (result.help && args.length !== 1) throw new Error('--help cannot be combined with other arguments');
  if (result.selftestReport && !result.selftest) throw new Error('--selftest-report requires --selftest');
  if (result.selftest && (result.update || result.list || result.state || result.route || result.viewport)) {
    throw new Error('--selftest cannot be combined with audit selection or --update');
  }
  if (result.update && result.list) throw new Error('--update cannot be combined with --list');
  if (result.update && (result.state || result.route || result.viewport)) throw new Error('--update requires the full configured matrix');
  if (result.state && result.route) throw new Error('Choose --state or --route');
  return result;
}

export function selectMatrix(conf, options = {}) {
  if (!conf || !Array.isArray(conf.states) || !Array.isArray(conf.routes) || !Array.isArray(conf.viewports)) {
    throw new Error('Config requires states, routes and viewports arrays');
  }
  localAddress(conf.baseUrl);
  if (!Array.isArray(conf.failOn) || !conf.failOn.length || conf.failOn.some(severity => !['error', 'warn', 'info'].includes(severity))) {
    throw new Error('Config requires nonempty recognized failOn severities');
  }
  const names = new Set();
  for (const state of conf.states) {
    if (!state || typeof state.name !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(state.name) || names.has(state.name)) {
      throw new Error('State names must be safe and unique');
    }
    names.add(state.name);
    if (state.steps !== undefined && !Array.isArray(state.steps)) throw new Error(`Invalid steps: ${state.name}`);
  }
  const byName = new Map(conf.states.map(state => [state.name, state]));
  const steps = (state, seen = new Set()) => {
    if (seen.has(state.name)) throw new Error(`State inheritance cycle: ${state.name}`);
    seen.add(state.name);
    if (state.extends && !byName.has(state.extends)) throw new Error(`Unknown parent: ${state.extends}`);
    return [...(state.extends ? steps(byName.get(state.extends), seen) : []), ...(state.steps || [])];
  };
  const targets = [
    ...conf.routes.map(route => ({ name: route, kind: 'route', route, steps: [], describe: '' })),
    ...conf.states.filter(state => !state.skip).map(state => ({
      name: state.name, kind: 'state', route: state.route || conf.routes[0] || '/',
      steps: steps(state), describe: state.describe || '',
    })),
  ].filter(target => (!options.state || (target.kind === 'state' && target.name === options.state)) &&
    (!options.route || (target.kind === 'route' && target.route === options.route)));
  const viewportNames = new Set();
  for (const vp of conf.viewports) {
    if (!vp || typeof vp.name !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(vp.name) || viewportNames.has(vp.name) ||
      !Number.isInteger(vp.width) || !Number.isInteger(vp.height) || vp.width < 1 || vp.height < 1 || vp.width * vp.height > 16_777_216) {
      throw new Error('Invalid or duplicate viewport');
    }
    viewportNames.add(vp.name);
  }
  const viewports = conf.viewports.filter(vp => !options.viewport || vp.name === options.viewport);
  if (!targets.length || !viewports.length) throw new Error('No targets or viewports matched; use --list');
  for (const target of targets) {
    if (typeof target.route !== 'string' || new URL(target.route, conf.baseUrl).origin !== new URL(conf.baseUrl).origin) {
      throw new Error('Audit targets must stay on the owned local mock server');
    }
  }
  if (targets.length * viewports.length > 256) throw new Error('Audit matrix exceeds 256 state/viewport pairs');
  return { targets, viewports };
}

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
export function sourceIdentity(here) {
  const root = path.resolve(here, '..');
  const source = { head: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim() };
  for (const [name, file] of Object.entries({ detectorSha256: 'audit.js', fixtureSha256: 'demo-buggy.html',
    effectiveTargetsSha256: 'effective-targets.html', runnerSha256: 'run.mjs', configSha256: 'config.json', runtimeSha256: 'runtime.mjs' })) {
    source[name] = hash(fs.readFileSync(path.join(here, file)));
  }
  return source;
}

export function assessSelftest(findings, targetChecks) {
  const detectedRules = [...new Set(findings.map(finding => finding.rule))].sort();
  const missingRules = REQUIRED_RULES.filter(rule => !detectedRules.includes(rule));
  return { expectedFindingCount: EXPECTED_FINDING_COUNT, findingCount: findings.length,
    requiredRules: [...REQUIRED_RULES], detectedRules, missingRules, targetChecks,
    status: findings.length === EXPECTED_FINDING_COUNT && !missingRules.length &&
      Object.keys(targetChecks).length === TARGET_CHECK_NAMES.length && TARGET_CHECK_NAMES.every(name => targetChecks[name] === true) ? 'PASS' : 'FAIL' };
}

export function verifySource(before, after) {
  if (JSON.stringify(before) !== JSON.stringify(after)) throw new Error('UI_AUDIT_SOURCE_CHANGED: source changed during measurement');
}

function inside(root, full) {
  const rel = path.relative(root, full);
  if (rel === '..' || rel.startsWith(`..${path.sep}`) || path.isAbsolute(rel)) throw new Error('Report path escapes artifacts/ui-audit');
}

// Inspect every existing parent before mkdir: a junction must never redirect a
// supposedly harmless report into source or another repository.
function checkParents(root, target) {
  const rel = path.relative(root, path.dirname(target));
  let current = root;
  for (const segment of ['', ...rel.split(path.sep).filter(Boolean)]) {
    if (segment) current = path.join(current, segment);
    try {
      const entry = fs.lstatSync(current);
      if (entry.isSymbolicLink() || !entry.isDirectory()) throw new Error('Report parent must be a physical directory');
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
}

export function prepareReportPath(root, relativePath) {
  if (typeof relativePath !== 'string' || !relativePath || path.isAbsolute(relativePath)) throw new Error('Report needs a repo-relative .json path');
  const base = path.join(root, 'artifacts', 'ui-audit');
  const full = path.resolve(root, relativePath);
  inside(base, full);
  if (full === base || path.extname(full).toLowerCase() !== '.json') throw new Error('Report must be a new .json file under artifacts/ui-audit');
  checkParents(root, full);
  try { fs.lstatSync(full); throw new Error('Report already exists; choose a new path'); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  return full;
}

export function writeNewReport(root, reportPath, report) {
  const full = prepareReportPath(root, path.relative(root, reportPath));
  const bytes = JSON.stringify(report, null, 2) + '\n';
  if (Buffer.byteLength(bytes) > MAX_REPORT_BYTES) throw new Error('Selftest report exceeds 1 MiB');
  fs.mkdirSync(path.dirname(full), { recursive: true });
  checkParents(root, full);
  fs.writeFileSync(full, bytes, { flag: 'wx' });
}

export async function loadPlaywright(moduleName = process.env.UI_AUDIT_PLAYWRIGHT_MODULE || 'playwright') {
  const loaded = await import(moduleName);
  // For the explicit existing module override, find that package's own version.
  let location = moduleName.startsWith('file:') ? fileURLToPath(moduleName) : fileURLToPath(import.meta.resolve(moduleName));
  location = path.dirname(location);
  while (true) {
    const candidate = path.join(location, 'package.json');
    if (fs.existsSync(candidate)) {
      const pkg = JSON.parse(fs.readFileSync(candidate, 'utf8'));
      if (pkg.name === 'playwright') return { chromium: loaded.chromium, version: pkg.version };
    }
    const parent = path.dirname(location);
    if (parent === location) throw new Error('Cannot identify the loaded playwright package version');
    location = parent;
  }
}

function localAddress(baseUrl) {
  const url = new URL(baseUrl);
  if (url.protocol !== 'http:' || !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) || url.username || url.password) {
    throw new Error('Audit requires an explicit local HTTP mock server');
  }
  return { host: url.hostname === '[::1]' ? '::1' : url.hostname, port: Number(url.port || 80) };
}

export async function assertPortFree(baseUrl) {
  const { host, port } = localAddress(baseUrl);
  await new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once('error', error => reject(new Error(`UI_AUDIT_PORT_IN_USE: cannot own ${host}:${port} (${error.code})`)));
    probe.listen({ host, port, exclusive: true }, () => probe.close(error => error ? reject(error) : resolve()));
  });
}

export async function reachable(url, timeoutMs = 1000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try { const response = await fetch(url, { signal: controller.signal }); await response.body?.cancel(); return response.ok; }
  catch { return false; }
  finally { clearTimeout(timer); }
}

export async function stopDevServer(child) {
  if (!child || !child.pid || child.exitCode !== null || child.signalCode !== null) return;
  if (process.platform === 'win32') {
    const killed = spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true });
    if (killed.status !== 0 && child.exitCode === null && child.signalCode === null) child.kill('SIGTERM');
  } else {
    try { process.kill(-child.pid, 'SIGTERM'); }
    catch (error) { if (error.code !== 'ESRCH') child.kill('SIGTERM'); }
  }
  if (child.exitCode === null && child.signalCode === null) {
    await new Promise((resolve) => {
      const timer = setTimeout(resolve, 3000);
      child.once('exit', () => { clearTimeout(timer); resolve(); });
    });
  }
  if (child.exitCode === null && child.signalCode === null) {
    if (process.platform !== 'win32') { try { process.kill(-child.pid, 'SIGKILL'); } catch {} }
    else child.kill('SIGKILL');
  }
}

export async function startDevServer(conf, root, { onStarted = () => {} } = {}) {
  const ds = conf.devServer;
  if (!ds || typeof ds.command !== 'string' || !ds.command.trim()) throw new Error('Audit needs its own devServer command');
  if (ds.env?.VITE_DATA_MODE !== 'mock' || ds.env?.VITE_SUPABASE_URL !== '' || ds.env?.VITE_SUPABASE_ANON_KEY !== '') {
    throw new Error('Audit devServer must explicitly use mock data with empty Supabase configuration');
  }
  await assertPortFree(conf.baseUrl);
  const child = spawn(ds.command, { shell: true, cwd: root, env: { ...process.env, ...ds.env },
    stdio: ['ignore', 'pipe', 'pipe'], detached: process.platform !== 'win32', windowsHide: true });
  onStarted(child);
  let log = '', launchError;
  child.once('error', error => { launchError = error; });
  const append = data => { log = (log + String(data)).slice(-4096); };
  child.stdout?.on('data', append);
  child.stderr?.on('data', append);
  try {
    const deadline = Date.now() + (ds.readyTimeoutMs || 90000);
    while (Date.now() < deadline) {
      if (launchError) throw launchError;
      if (child.exitCode !== null || child.signalCode !== null) throw new Error(`Dev server exited before ready:\n${log.slice(-1200)}`);
      if (await reachable(conf.baseUrl, Math.min(1000, Math.max(1, deadline - Date.now())))) return child;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error(`Dev server never became ready at ${conf.baseUrl}:\n${log.slice(-1200)}`);
  } catch (error) { await stopDevServer(child); throw error; }
}
