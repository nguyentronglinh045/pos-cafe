import { isAbsolute, resolve, relative, sep } from 'node:path';

const idPattern = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const finite = (value, min, max) => Number.isFinite(value) && value >= min && value <= max;
export const MAX_PIXELS = 16_777_216;
export const MAX_ARTIFACT_BYTES = 512 * 1024 * 1024;

export function expandConfig(cfg) {
  return { ...cfg, cases: (cfg.cases || []).map(item => ({ ...cfg.defaults, ...item, thresholds: { ...cfg.defaults?.thresholds, ...item.thresholds } })) };
}

export function within(root, path) {
  const full = resolve(root, path), rel = relative(root, full);
  assert(rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel), `Path escapes root: ${path}`);
  return full;
}

function target(value, kind) {
  assert(value && typeof value.url === 'string' && typeof value.ready === 'string' && value.ready.trim(), 'Target needs url and ready selector');
  const url = new URL(value.url);
  assert(!url.username && !url.password, 'Credentials in target URLs are forbidden');
  assert((url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) || (kind === 'selftest' && url.protocol === 'fixture:' && url.hostname === 'payment'), 'Only explicit local HTTP targets are supported; export Stitch locally first');
  assert(!value.steps || Array.isArray(value.steps) && value.steps.length <= 50, 'Invalid steps');
  for (const step of value.steps || []) {
    assert(step && ['click', 'fill', 'waitFor', 'scrollIntoView'].includes(step.action) && typeof step.selector === 'string' && step.selector.trim(), 'Step must be click/fill/waitFor/scrollIntoView with selector');
    assert(step.action !== 'fill' || typeof step.value === 'string', 'Fill requires string value');
  }
}

export function validateConfig(cfg) {
  assert(cfg?.version === 1 && ['selftest', 'screen-remake'].includes(cfg.kind), 'Unsupported config version/kind');
  assert(typeof cfg.title === 'string' && cfg.title.trim(), 'Config needs title');
  assert(Array.isArray(cfg.cases) && cfg.cases.length > 0 && cfg.cases.length <= 32, 'Config needs 1..32 cases');
  if (cfg.kind === 'screen-remake') {
    assert(typeof cfg.designUrl === 'string' && /^https:\/\//.test(cfg.designUrl), 'Screen remake needs original designUrl metadata');
    assert(Array.isArray(cfg.referenceFiles) && cfg.referenceFiles.length > 0 && cfg.referenceFiles.every(p => typeof p === 'string' && p.trim()), 'Screen remake needs immutable referenceFiles');
  }
  const ids = new Set();
  let estimatedBytes = 0;
  for (const item of cfg.cases) {
    assert(idPattern.test(item.id) && !ids.has(item.id), 'Case ids must be safe and unique'); ids.add(item.id);
    const vp = item.viewport;
    assert(vp && Number.isInteger(vp.width) && Number.isInteger(vp.height) && vp.width >= 568 && vp.height >= 320 && vp.width > vp.height && vp.width * vp.height <= MAX_PIXELS, `Invalid landscape viewport: ${item.id}`);
    estimatedBytes += vp.width * vp.height * 24;
    target(item.actual, cfg.kind); target(item.reference, cfg.kind);
    if (cfg.kind === 'screen-remake') assert(item.actual.url !== item.reference.url, 'Actual UI cannot be its own design reference');
    assert(Array.isArray(item.anchors) && item.anchors.length > 0 && item.anchors.length <= 64, 'Need 1..64 anchor correspondences');
    const anchors = new Set();
    for (const a of item.anchors) { assert(idPattern.test(a.id) && !anchors.has(a.id) && typeof a.actual === 'string' && a.actual.trim() && typeof a.reference === 'string' && a.reference.trim(), 'Invalid/duplicate anchor'); anchors.add(a.id); }
    assert(Array.isArray(item.criticalSelectors) && item.criticalSelectors.length > 0 && item.criticalSelectors.length <= 64, 'Need 1..64 critical selectors');
    const controls = new Set();
    for (const a of item.criticalSelectors) { assert(idPattern.test(a.id) && !controls.has(a.id) && typeof a.selector === 'string' && a.selector.trim(), 'Invalid/duplicate critical selector'); controls.add(a.id); }
    const t = item.thresholds;
    assert(t && Number.isInteger(t.channelThreshold) && finite(t.channelThreshold, 0, 255) && finite(t.maxDiffRatio, 0, 1) && finite(t.geometryTolerancePx, 0, 100) && finite(t.minTargetPx, 1, 200), 'Explicit, finite pixel/geometry/target thresholds required');
    assert(!item.regions || Array.isArray(item.regions), 'Regions must be array');
    const regionIds = new Set();
    for (const r of item.regions || []) {
      assert(idPattern.test(r.id) && !regionIds.has(r.id), 'Region ids must be safe and unique'); regionIds.add(r.id);
      assert(Number.isInteger(r.x) && Number.isInteger(r.y) && Number.isInteger(r.width) && Number.isInteger(r.height) && r.x >= 0 && r.y >= 0 && r.width > 0 && r.height > 0 && r.x + r.width <= vp.width && r.y + r.height <= vp.height && finite(r.maxDiffRatio, 0, 1), 'Invalid region geometry/threshold');
    }
    if (cfg.kind === 'selftest') assert(['PASS', 'FAIL'].includes(item.selftestExpectation), 'Selftest needs explicit expected measurement outcome');
    else assert(item.selftestExpectation === undefined, 'Real screen cannot declare expected failures');
  }
  assert(estimatedBytes <= MAX_ARTIFACT_BYTES, 'Conservative image-output budget exceeds 512 MiB; split the explicit case matrix');
  return { estimatedBytes, caseCount: cfg.cases.length };
}
