// Strict, private evidence readers for synthetic UI tool calibration only.
import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, realpathSync } from 'node:fs';
import { resolve, relative, isAbsolute, sep } from 'node:path';
import { platform, release, arch } from 'node:os';

const reject = () => { throw new Error('PROJECT_CI_UI_RESULT_INVALID'); };
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const integer = value => Number.isSafeInteger(value) && value >= 0;
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const unique = values => Array.isArray(values) && new Set(values).size === values.length;
const sameSet = (a, b) => unique(a) && unique(b) && same([...a].sort(), [...b].sort());
export const REMAKE_TEST_FILES = Object.freeze(['capture', 'config', 'metrics', 'run', 'run.integration', 'serve-reference'].map(name => `ui-remake/${name}.test.mjs`));
export const REMAKE_CONTROLS = Object.freeze({minimum:'PASS',phone:'PASS',tablet:'PASS',desktop:'PASS','long-vietnamese':'PASS',
  'detect-shift':'FAIL','detect-palette':'FAIL','detect-occlusion':'FAIL','detect-small-target':'FAIL','detect-font':'FAIL','detect-overflow':'FAIL'});
export const AUDIT_RULES = Object.freeze(['hit-blocked','empty-icon','placeholder-leak','bad-inline-style','tiny-target','overflow-x',
  'no-accessible-name','broken-image','low-contrast','tiny-font','clipped-text','bad-class-token','zero-size-interactive','overlapping-controls']);
export const AUDIT_TARGET_CHECKS = Object.freeze(['labelUsesEffectiveArea','coveredLabelKeepsTinyFinding','validCornerUsesReachableArea',
  'choosesReachableAssociatedLabel','interactiveChildDoesNotActivateInput','clippedControlIsReported','innerScrollerCanRevealControl',
  'offscreenLabelCanBeMeasuredAfterScroll','scrollOffsetsRestored','disabledControlHasNoTapRequirement','inactiveLabelsDoNotToggle',
  'bareSmallControlDetected','scrollClippedHitIgnored','scrollClippedOverlapIgnored','trulyCoveredHitDetected','trulyCoveredOverlapDetected']);
export const AUDIT_SOURCE_FILES = Object.freeze({detectorSha256:'ui-audit/audit.js',fixtureSha256:'ui-audit/demo-buggy.html',
  effectiveTargetsSha256:'ui-audit/effective-targets.html',runnerSha256:'ui-audit/run.mjs',configSha256:'ui-audit/config.json',runtimeSha256:'ui-audit/runtime.mjs'});

export function uiTestInventory(paths) {
  if (!unique(paths) || REMAKE_TEST_FILES.some(file => !paths.includes(file))
    || Object.values(AUDIT_SOURCE_FILES).some(file => !paths.includes(file))) reject();
  const files = paths.filter(file => /^(?:ui-remake|ui-audit)\/[A-Za-z0-9_.-]+\.test\.mjs$/.test(file)).sort();
  if (!files.some(file => file.startsWith('ui-audit/')) || files.length > 64) reject();
  return files;
}

// Refuse links in every path component, including a link to another file inside
// the checkout. Calibration must consume its fresh, declared physical output.
export function readUIFile(root, name, maxBytes = 32 * 1024 ** 2) {
  if (typeof name !== 'string' || !name || isAbsolute(name) || name.includes('\\') || name.split('/').some(part => !part || part === '.' || part === '..')) reject();
  const base = realpathSync(root), full = resolve(base, name), rel = relative(base, full);
  if (rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) reject();
  let part = base;
  for (const item of name.split('/')) { part = resolve(part, item); const stat = lstatSync(part); if (stat.isSymbolicLink()) reject(); }
  const stat = lstatSync(full);
  if (!stat.isFile() || !integer(stat.size) || stat.size > maxBytes || realpathSync(full) !== full) reject();
  return readFileSync(full);
}
export function readUIJSON(root, name, maxBytes) {
  try { return JSON.parse(readUIFile(root, name, maxBytes).toString('utf8')); } catch { reject(); }
}
export function requireFreshUIOutput(root, name) {
  if (typeof name !== 'string' || !/^artifacts\/(?:ui-remake|ui-audit)\/ci-[1-9][0-9]*-[1-9][0-9]*$/.test(name)) reject();
  let part = realpathSync(root);
  for (const item of name.split('/')) {
    part = resolve(part,item); const info = lstatSync(part,{throwIfNoEntry:false});
    if (info?.isSymbolicLink() || info && !info.isDirectory()) reject();
  }
  if (lstatSync(part,{throwIfNoEntry:false})) reject();
}

export function uiEvidenceContext(root, paths, head, node = process.version, os = process.platform) {
  if (!/^[a-f0-9]{40}$/.test(head) || !unique(paths) || paths.length > 10000) reject();
  let total = 0;
  const files = [...paths].sort().map(path => {
    const bytes = readUIFile(root, path, 64 * 1024 ** 2); total += bytes.length;
    if (total > 256 * 1024 ** 2) reject();
    return {path,bytes:bytes.length,sha256:hash(bytes)};
  });
  const configBytes = readUIFile(root, 'ui-remake/examples/selftest.json', 1024 ** 2);
  const config = JSON.parse(configBytes.toString('utf8'));
  if (config.version !== 1 || config.kind !== 'selftest' || !Array.isArray(config.cases)) reject();
  const cases = config.cases.map(item => ({...config.defaults,...item,thresholds:{...config.defaults?.thresholds,...item.thresholds}}));
  if (!sameSet(cases.map(item => item.id), Object.keys(REMAKE_CONTROLS))
    || cases.some(item => item.selftestExpectation !== REMAKE_CONTROLS[item.id])) reject();
  const cfg = {...config,cases};
  const fontProvenance = readUIJSON(root,'ui-remake/fonts/provenance.json',1024 ** 2);
  if (!/^[a-f0-9]{40}$/.test(fontProvenance.sourceCommit) || !Array.isArray(fontProvenance.files)
    || !sameSet(fontProvenance.files.map(item => item.file), ['Regular','Medium','SemiBold','Bold'].map(weight => `BeVietnamPro-${weight}.ttf`).concat('OFL.txt'))) reject();
  for (const item of fontProvenance.files) {
    const bytes = readUIFile(root,`ui-remake/fonts/${item.file}`,1024 ** 2);
    if (item.bytes !== bytes.length || item.sha256 !== hash(bytes)) reject();
  }
  const referenceFiles = [...new Set([...(cfg.referenceFiles || []),'ui-remake/palette-a-v1.json','ui-remake/fonts/provenance.json',
    ...['Regular','Medium','SemiBold','Bold'].map(weight => `ui-remake/fonts/BeVietnamPro-${weight}.ttf`)])].sort().map(path => {
      const record = files.find(item => item.path === path); if (!record) reject(); return record;
    });
  const referenceSourceSha256 = hash(JSON.stringify(referenceFiles));
  const contractSha256 = hash(JSON.stringify({kind:cfg.kind,designUrl:cfg.designUrl,referenceSourceSha256,clock:cfg.clock,browser:cfg.browser || 'chromium',
    channel:(cfg.browser || 'chromium') === 'chromium' ? 'chromium' : null,actualSourceRoot:cfg.actualSourceRoot,dataMode:cfg.dataMode,serverRecipe:cfg.serverRecipe,cases}));
  const playwrightVersion = readUIJSON(root,'node_modules/playwright/package.json',1024 ** 2).version;
  const lockedVersion = readUIJSON(root,'package-lock.json',4 * 1024 ** 2).packages?.['node_modules/playwright']?.version;
  if (!/^\d+\.\d+\.\d+$/.test(playwrightVersion) || playwrightVersion !== lockedVersion) reject();
  return {root:realpathSync(root),head,node,os,auditOS:`${platform()} ${release()} ${arch()}`,files,sourceSha256:hash(JSON.stringify(files)),config:cfg,configSha256:hash(configBytes),
    referenceFiles,referenceSourceSha256,contractSha256,fontProvenance,playwrightVersion};
}

function currentTime(report, startedAfter, finishedBefore) {
  const start = Date.parse(report.startedAt), end = Date.parse(report.finishedAt);
  if (!Number.isFinite(start) || !Number.isFinite(end) || !integer(startedAfter) || !integer(finishedBefore)
    || new Date(start).toISOString() !== report.startedAt || new Date(end).toISOString() !== report.finishedAt
    || start < startedAfter || end < start || end > finishedBefore) reject();
}
function environment(value, expected) {
  if (!value || value.node !== expected.node || value.os !== expected.os || value.engine !== 'chromium'
    || value.channel !== 'chromium' || value.playwrightVersion !== expected.playwrightVersion
    || !/^\d+\.\d+\.\d+\.\d+$/.test(value.browserVersion)) reject();
}
function source(value, expected) {
  if (!value || value.head !== expected.head || value.dirty !== false || !same(value.files,expected.files)
    || value.sha256 !== expected.sourceSha256 || value.sha256 !== hash(JSON.stringify(value.files))) reject();
}
function png(bytes, viewport, sha) {
  if (!Buffer.isBuffer(bytes) || bytes.length < 33 || !bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
    || bytes.toString('ascii',12,16) !== 'IHDR' || bytes.readUInt32BE(16) !== viewport.width || bytes.readUInt32BE(20) !== viewport.height
    || sha !== undefined && hash(bytes) !== sha) reject();
}

export function remakeSelftestCounts(report, expected, {startedAfter,finishedBefore,readArtifact}) {
  if (!report || report.version !== 1 || report.kind !== 'selftest' || report.status !== 'PASS'
    || report.productAcceptance !== 'NOT_ASSESSED' || report.error !== undefined || report.referenceApproval !== null) reject();
  currentTime(report,startedAfter,finishedBefore); environment(report.environment,expected);
  source(report.source,expected); source(report.actualSource,expected);
  if (report.actualSource.declaredRoot !== expected.root || report.actualSource.binding !== 'in-process-fixture'
    || report.actualSource.dataMode !== 'synthetic' || report.actualSource.serverRecipe !== 'in-process synthetic fixture server') reject();
  const env = report.environment;
  if (env.locale !== 'vi-VN' || env.timezone !== 'Asia/Ho_Chi_Minh' || env.dpr !== 1 || env.clock !== expected.config.clock
    || env.colorScheme !== 'light' || env.animations !== 'disabled' || env.capture !== 'viewport; two identical PNG captures required'
    || env.fontSourceCommit !== expected.fontProvenance.sourceCommit || env.playwrightModule !== 'playwright') reject();
  if (report.configSha256 !== expected.configSha256 || report.referenceSourceSha256 !== expected.referenceSourceSha256
    || report.contractSha256 !== expected.contractSha256 || !same(report.referenceFiles,expected.referenceFiles)
    || !Array.isArray(report.cases) || !sameSet(report.cases.map(item => item.id),Object.keys(REMAKE_CONTROLS))) reject();
  const markdown = readArtifact('report.md');
  if (!Buffer.isBuffer(markdown) || markdown.length > 1024 ** 2 || !markdown.toString('utf8').startsWith('# ')
    || !markdown.toString('utf8').includes('Scope: **selftest**. Measurement status: **PASS**. Product acceptance: **NOT_ASSESSED**.')) reject();
  let artifactBytes = 0;
  for (const item of report.cases) {
    const cfg = expected.config.cases.find(value => value.id === item.id);
    if (item.status !== REMAKE_CONTROLS[item.id] || item.selftestExpectation !== REMAKE_CONTROLS[item.id] || item.error !== undefined
      || !same(item.viewport,cfg.viewport) || !same(item.thresholds,cfg.thresholds)) reject();
    const passes = [item.pixels?.pass,item.geometry?.pass,item.actual?.tokens?.pass,item.actual?.observed?.font?.pass,item.actual?.observed?.responsive?.pass];
    if (passes.some(value => typeof value !== 'boolean') || (passes.every(Boolean) ? 'PASS' : 'FAIL') !== item.status
      || item.reference?.tokens?.pass !== true || item.reference?.observed?.font?.pass !== true || item.reference?.observed?.responsive?.pass !== true) reject();
    if (!integer(item.pixels.totalPixels) || item.pixels.totalPixels !== item.viewport.width * item.viewport.height
      || !integer(item.pixels.differentPixels) || item.pixels.differentPixels > item.pixels.totalPixels
      || !Number.isFinite(item.pixels.diffRatio) || Math.abs(item.pixels.diffRatio - item.pixels.differentPixels / item.pixels.totalPixels) > 1e-12
      || item.pixels.pass !== (item.pixels.diffRatio <= cfg.thresholds.maxDiffRatio)) reject();
    if (item.id === 'detect-shift' && (item.geometry.pass !== false || !Number.isFinite(item.geometry.maxGeometryDeltaPx) || item.geometry.maxGeometryDeltaPx <= 0)
      || item.id === 'detect-palette' && item.actual.tokens.pass !== false
      || item.id === 'detect-font' && item.actual.observed.font.pass !== false
      || ['detect-occlusion','detect-small-target','detect-overflow'].includes(item.id) && item.actual.observed.responsive.pass !== false) reject();
    const responsive = item.actual.observed.responsive;
    if (item.id === 'detect-occlusion' && (item.pixels.differentPixels !== 0 || !responsive.checks?.some(check => check.id === 'complete' && check.pass === false && check.reason === 'center_occluded'))
      || item.id === 'detect-small-target' && !responsive.checks?.some(check => check.id === 'complete' && check.pass === false && check.reason === 'target_too_small')
      || item.id === 'detect-overflow' && (!Number.isFinite(responsive.horizontalOverflowPx) || responsive.horizontalOverflowPx <= 1)) reject();
    for (const suffix of ['reference','actual','diff','overlay']) {
      const bytes = readArtifact(`${item.id}-${suffix}.png`); artifactBytes += bytes.length;
      if (artifactBytes > 512 * 1024 ** 2) reject();
      if (['reference','actual'].includes(suffix) && !/^[a-f0-9]{64}$/.test(item[suffix].screenshotSha256)) reject();
      png(bytes,item.viewport,['reference','actual'].includes(suffix) ? item[suffix].screenshotSha256 : undefined);
    }
  }
  if (!integer(report.artifactBytes) || report.artifactBytes !== artifactBytes) reject();
  return {run:11,pass:11,fail:0,skip:0,positiveControls:5,negativeControls:6};
}

export function auditSelftestCounts(report, expected, {startedAfter,finishedBefore}) {
  if (!report || report.version !== 1 || report.kind !== 'ui-audit-selftest' || report.status !== 'PASS'
    || report.productAcceptance !== 'NOT_ASSESSED' || report.error !== undefined || report.sourcePreserved !== true || !same(report.errors,[])
    || typeof expected.auditOS !== 'string' || report.expectedFindingCount !== 23 || report.findingCount !== 23
    || !sameSet(report.requiredRules,AUDIT_RULES) || !unique(report.detectedRules)
    || report.detectedRules.length > 32 || report.detectedRules.some(rule => typeof rule !== 'string' || !/^[a-z][a-z-]{0,63}$/.test(rule))
    || AUDIT_RULES.some(rule => !report.detectedRules.includes(rule)) || !same(report.missingRules,[])
    || !report.targetChecks || !sameSet(Object.keys(report.targetChecks),AUDIT_TARGET_CHECKS)
    || Object.values(report.targetChecks).some(value => value !== true)) reject();
  currentTime(report,startedAfter,finishedBefore); environment(report.environment,{...expected,os:expected.auditOS});
  if (report.source?.head !== expected.head) reject();
  for (const [field,path] of Object.entries(AUDIT_SOURCE_FILES)) {
    const record = expected.files.find(item => item.path === path);
    if (!record || report.source[field] !== record.sha256) reject();
  }
  return {run:1,pass:1,fail:0,skip:0,detectedFindings:23,targetControls:16};
}
