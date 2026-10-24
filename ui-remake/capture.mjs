/**
 * DOM measurements for the approved UI comparison capture policy.
 * Only the supplied anchors and critical controls are audited. This is not a
 * complete accessibility, contrast, keyboard, semantic, or business-flow audit.
 * Center-point hit testing cannot prove that every part of a control is usable.
 * Measurements use CSS pixels in the top-level page; frame contents are outside
 * this helper's scope. All document/shadow scroll positions are saved solely to
 * restore the capture view after checking controls below the current fold.
 *
 * Capture policy: wait for the named ready element, declared fonts and images;
 * disable CSS animations/transitions/caret; then wait two animation frames.
 * Park the pointer outside the viewport for both sides (neutral hover state).
 * No font, app state, clock, viewport, or layout override is injected here.
 * The runner additionally checks repeated screenshots for pixel stability.
 */

const TIMEOUT_MS = 5_000;
// A real login may queue pairing + welcome toasts before the declared clean
// state appears. Waiting longer changes no comparison threshold or app state.
const READY_TIMEOUT_MS = 15_000;
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;

function validateSelectors(entries, name) {
  if (!Array.isArray(entries)) throw new TypeError(`${name} must be an array`);
  const seen = new Set();
  for (const entry of entries) {
    if (!entry || typeof entry.id !== 'string' || !SAFE_ID.test(entry.id)) {
      throw new TypeError(`${name} IDs must match ${SAFE_ID}`);
    }
    if (seen.has(entry.id)) throw new TypeError(`${name} has duplicate ID: ${entry.id}`);
    seen.add(entry.id);
    if (typeof entry.selector !== 'string' || !entry.selector.trim()) {
      throw new TypeError(`${name}.${entry.id} must have a nonempty selector`);
    }
  }
}

async function exactlyOne(page, { id, selector }, kind) {
  const locator = page.locator(selector);
  const count = await locator.count();
  if (count !== 1) {
    throw new Error(`${kind} ${id} must match exactly one DOM element; found ${count}: ${selector}`);
  }
  return locator;
}

/** Observe explicit anchors and critical targets without leaving the page scrolled. */
export async function observePage(page, { anchors, criticalSelectors, minTargetPx, requiredFont } = {}) {
  validateSelectors(anchors, 'anchors');
  validateSelectors(criticalSelectors, 'criticalSelectors');
  if (typeof minTargetPx !== 'number' || !Number.isFinite(minTargetPx) || minTargetPx <= 0) {
    throw new TypeError('minTargetPx must be an explicit positive finite number');
  }
  if (typeof requiredFont !== 'string' || !requiredFont.trim() || requiredFont.includes(',')) {
    throw new TypeError('requiredFont must be a nonempty single font family name');
  }

  // Validate all coverage before measuring anything. A missing/ambiguous selector
  // must stop the comparison instead of silently reducing its coverage.
  const anchorLocators = [];
  const criticalLocators = [];
  for (const entry of anchors) anchorLocators.push(await exactlyOne(page, entry, 'Anchor'));
  for (const entry of criticalSelectors) criticalLocators.push(await exactlyOne(page, entry, 'Critical target'));

  const measuredAnchors = [];
  for (let index = 0; index < anchors.length; index += 1) {
    const measured = await anchorLocators[index].evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        x: rect.x, y: rect.y, width: rect.width, height: rect.height,
        fontFamily: style.fontFamily, fontSize: style.fontSize,
        fontWeight: style.fontWeight, lineHeight: style.lineHeight,
        color: style.color, backgroundColor: style.backgroundColor,
      };
    });
    measuredAnchors.push({ id: anchors[index].id, ...measured });
  }

  const viewport = await page.evaluate(() => ({ width: innerWidth, height: innerHeight }));
  const horizontalOverflowPx = await page.evaluate(() => Math.max(0,
    (document.scrollingElement ?? document.documentElement).scrollWidth - document.documentElement.clientWidth));
  const font = await page.evaluate(({ required, anchorFamilies }) => {
    const normalize = (family) => family.trim().replace(/^(['"])(.*)\1$/, '$2').replace(/\s+/g, ' ').toLowerCase();
    const firstFamily = (list) => {
      let quote = null;
      let escaped = false;
      for (let i = 0; i < list.length; i += 1) {
        const char = list[i];
        if (escaped) { escaped = false; continue; }
        if (char === '\\') { escaped = true; continue; }
        if (quote) { if (char === quote) quote = null; }
        else if (char === '"' || char === "'") quote = char;
        else if (char === ',') return normalize(list.slice(0, i));
      }
      return normalize(list);
    };
    const normalizedRequired = normalize(required);
    const faces = Array.from(document.fonts).filter((face) => normalize(face.family) === normalizedRequired)
      .map((face) => ({ family: face.family, status: face.status, style: face.style, weight: face.weight, stretch: face.stretch }));
    const loaded = faces.some((face) => face.status === 'loaded');
    const anchorChecks = anchorFamilies.map(({ id, fontFamily }) => ({
      id, firstFamily: firstFamily(fontFamily), pass: firstFamily(fontFamily) === normalizedRequired,
    }));
    const pass = loaded && anchorChecks.every((check) => check.pass);
    return {
      required, declared: faces.length > 0, loaded, pass, faces, anchors: anchorChecks,
      reason: pass ? null : !faces.length ? 'required_font_not_declared'
        : !loaded ? 'required_font_not_loaded' : 'anchor_font_family_mismatch',
    };
  }, { required: requiredFont.trim(), anchorFamilies: measuredAnchors });

  // Keep the elements in an isolated JSHandle, never on window/app state. Include
  // zero positions too: scrollIntoView may move a previously unscrolled parent.
  const scrollSnapshot = await page.evaluateHandle(() => {
    const elements = [];
    const collect = (root) => {
      for (const element of root.querySelectorAll('*')) {
        elements.push({ element, left: element.scrollLeft, top: element.scrollTop });
        if (element.shadowRoot) collect(element.shadowRoot);
      }
    };
    collect(document);
    return { x: scrollX, y: scrollY, elements };
  });

  const checks = [];
  try {
    for (let index = 0; index < criticalSelectors.length; index += 1) {
      const entry = criticalSelectors[index];
      const locator = criticalLocators[index];
      const before = await locator.evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          visible: element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true, contentVisibilityAuto: true }),
          pointerEvents: style.pointerEvents,
        };
      });
      let scrollError = null;
      if (before.visible && before.pointerEvents !== 'none') {
        try { await locator.scrollIntoViewIfNeeded({ timeout: TIMEOUT_MS }); }
        catch { scrollError = 'scroll_into_view_failed'; }
      }
      const measured = await locator.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        const visible = element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true, contentVisibilityAuto: true });
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const inViewport = centerX >= 0 && centerY >= 0 && centerX < innerWidth && centerY < innerHeight;
        const hit = inViewport ? document.elementFromPoint(centerX, centerY) : null;
        // elementFromPoint retargets shadow contents to the host; follow open
        // shadow roots so descendants of a shadow control can still be hit.
        let deepestHit = hit;
        while (deepestHit?.shadowRoot) {
          const next = deepestHit.shadowRoot.elementFromPoint(centerX, centerY);
          if (!next || next === deepestHit) break;
          deepestHit = next;
        }
        const hitMatches = deepestHit === element || element.contains(deepestHit)
          || hit === element || element.contains(hit);
        return {
          width: rect.width, height: rect.height, visible,
          pointerEvents: style.pointerEvents, inViewport,
          reachable: visible && style.pointerEvents !== 'none' && inViewport && hitMatches,
          occluded: inViewport && !hitMatches,
        };
      });
      const reasons = [];
      if (measured.width < minTargetPx || measured.height < minTargetPx) reasons.push('target_too_small');
      if (!measured.visible) reasons.push('not_visible');
      if (measured.pointerEvents === 'none') reasons.push('pointer_events_none');
      if (scrollError) reasons.push(scrollError);
      if (!measured.inViewport) reasons.push('center_outside_viewport');
      if (measured.occluded) reasons.push('center_occluded');
      const pass = !scrollError && measured.reachable && measured.width >= minTargetPx && measured.height >= minTargetPx;
      checks.push({
        id: entry.id, selector: entry.selector, pass,
        width: measured.width, height: measured.height,
        reachable: measured.reachable, occluded: measured.occluded,
        reason: pass ? null : reasons.join(';'),
      });
    }
  } finally {
    try {
      await scrollSnapshot.evaluate(async (snapshot) => {
        const restore = () => {
          for (const { element, left, top } of snapshot.elements) {
            if (element.isConnected) element.scrollTo({ left, top, behavior: 'instant' });
          }
          window.scrollTo({ left: snapshot.x, top: snapshot.y, behavior: 'instant' });
        };
        restore();
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        restore();
      });
    } finally { await scrollSnapshot.dispose(); }
  }

  return {
    anchors: measuredAnchors,
    responsive: { pass: horizontalOverflowPx <= 1 && checks.every((check) => check.pass), viewport, horizontalOverflowPx, checks },
    font,
  };
}

/** Apply the capture policy without injecting an actual-page font or app fixture. */
export async function stabilizePage(page, { readySelector } = {}) {
  if (typeof readySelector !== 'string' || !readySelector.trim()) {
    throw new TypeError('readySelector must be a nonempty selector');
  }
  const ready = page.locator(readySelector);
  // Login/resize can leave the pointer over a toast, pausing its timer forever.
  // Neutralize hover before waiting as well as before decoding/capture.
  await page.mouse.move(-1, -1);
  const initialCount = await ready.count();
  if (initialCount > 1) throw new Error(`Ready selector must match exactly one DOM element; found ${initialCount}: ${readySelector}`);
  try { await ready.waitFor({ state: 'visible', timeout: READY_TIMEOUT_MS }); }
  catch { throw new Error(`Ready selector must match exactly one visible DOM element: ${readySelector}`); }
  await exactlyOne(page, { id: 'ready', selector: readySelector }, 'Ready selector');
  await page.mouse.move(-1, -1);

  const decodedImages = await page.evaluate(async ({ timeoutMs }) => {
    let timer;
    try {
      return await Promise.race([
        (async () => {
          await document.fonts.ready;
          const images = Array.from(document.images).filter((image) => image.currentSrc || image.hasAttribute('src'));
          await Promise.all(images.map(async (image, index) => {
            try { await image.decode(); }
            catch { throw new Error(`Image ${index + 1} failed to decode`); }
            if (!image.complete || image.naturalWidth === 0) throw new Error(`Image ${index + 1} failed to load`);
          }));
          return images.length;
        })(),
        new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Fonts/images did not settle within capture timeout')), timeoutMs); }),
      ]);
    } finally { clearTimeout(timer); }
  }, { timeoutMs: TIMEOUT_MS });

  await page.addStyleTag({ content: '*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }' });
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  return { readySelector, decodedImages, policy: { animations: 'disabled', transitions: 'disabled', caret: 'hidden' } };
}
