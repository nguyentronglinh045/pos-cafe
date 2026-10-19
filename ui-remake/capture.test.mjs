import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { after, before, test } from 'node:test';
import { observePage, stabilizePage } from './capture.mjs';

// Uses the already installed browser/runtime. A missing module or engine is a
// failed setup, never a skipped test presented as successful browser evidence.
const { chromium } = await import(process.env.UI_REMAKE_PLAYWRIGHT_MODULE || 'playwright');
let browser;
before(async () => { browser = await chromium.launch({ headless: true, channel: 'chromium', timeout: 20_000 }); });
after(async () => { if (browser) await browser.close(); });

const settings = {
  anchors: [{ id: 'primary', selector: '#primary' }],
  criticalSelectors: [{ id: 'primary', selector: '#primary' }],
  minTargetPx: 32,
  requiredFont: 'Be Vietnam Pro',
};
const baseStyle = '<style>html,body{margin:0}body{font:16px/24px Arial,sans-serif}button{box-sizing:border-box;width:96px;height:40px}#primary{font:600 18px/27px Arial,sans-serif;color:rgb(1,2,3);background:rgb(245,246,247)}</style>';

async function fixture(html, run) {
  const context = await browser.newContext({ viewport: { width: 568, height: 320 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.setDefaultTimeout(5_000);
  try {
    await page.setContent(`${baseStyle}${html}`, { waitUntil: 'load', timeout: 10_000 });
    await run(page);
  } finally { await context.close(); }
}

test('normal critical target records exact CSS geometry/styles and independent font failure', { timeout: 15_000 }, async () => {
  await fixture('<button id="primary"><span>Thanh toán</span></button>', async (page) => {
    const result = await observePage(page, settings);
    assert.deepEqual(result.responsive.viewport, { width: 568, height: 320 });
    assert.equal(result.responsive.horizontalOverflowPx, 0);
    assert.equal(result.responsive.pass, true);
    assert.deepEqual(result.responsive.checks[0], {
      id: 'primary', selector: '#primary', pass: true, width: 96, height: 40,
      reachable: true, occluded: false, reason: null,
    });
    assert.deepEqual(result.anchors[0], {
      id: 'primary', x: 0, y: 0, width: 96, height: 40,
      fontFamily: 'Arial, sans-serif', fontSize: '18px', fontWeight: '600', lineHeight: '27px',
      color: 'rgb(1, 2, 3)', backgroundColor: 'rgb(245, 246, 247)',
    });
    assert.equal(result.font.pass, false);
    assert.equal(result.font.loaded, false);
    assert.equal(result.font.reason, 'required_font_not_declared');
  });
});

test('document horizontal overflow fails but an internal canvas scroller does not', { timeout: 15_000 }, async () => {
  await fixture('<button id="primary">Xong</button><div style="width:700px;height:20px"></div>', async (page) => {
    const result = await observePage(page, settings);
    assert.equal(result.responsive.horizontalOverflowPx, 132);
    assert.equal(result.responsive.pass, false);
    assert.equal(result.responsive.checks[0].pass, true);
  });
  await fixture('<button id="primary">Xong</button><div style="width:300px;overflow:auto"><div style="width:1200px;height:20px"></div></div>', async (page) => {
    const result = await observePage(page, settings);
    assert.equal(result.responsive.horizontalOverflowPx, 0);
    assert.equal(result.responsive.pass, true);
  });
});

test('one CSS pixel of overflow is tolerated and more than one fails', { timeout: 15_000 }, async () => {
  await fixture('<button id="primary">Xong</button><div id="wide" style="width:569px;height:20px"></div>', async (page) => {
    assert.equal((await observePage(page, settings)).responsive.pass, true);
    await page.locator('#wide').evaluate((element) => { element.style.width = '570px'; });
    const result = await observePage(page, settings);
    assert.equal(result.responsive.horizontalOverflowPx, 2);
    assert.equal(result.responsive.pass, false);
  });
});

test('tiny and covered critical targets fail for their actual measured reasons', { timeout: 15_000 }, async () => {
  await fixture('<button id="primary" style="width:31px;height:32px">1</button><button id="covered" style="position:absolute;left:150px;top:20px">2</button><div style="position:absolute;left:150px;top:20px;width:96px;height:40px;background:transparent;z-index:9"></div>', async (page) => {
    const result = await observePage(page, {
      ...settings,
      criticalSelectors: [{ id: 'tiny', selector: '#primary' }, { id: 'covered', selector: '#covered' }],
    });
    assert.equal(result.responsive.pass, false);
    assert.equal(result.responsive.checks[0].width, 31);
    assert.equal(result.responsive.checks[0].reachable, true);
    assert.equal(result.responsive.checks[0].reason, 'target_too_small');
    assert.equal(result.responsive.checks[1].reachable, false);
    assert.equal(result.responsive.checks[1].occluded, true);
    assert.match(result.responsive.checks[1].reason, /center_occluded/);
  });
});

test('exact minimum target size passes, hidden and pointer-disabled targets fail', { timeout: 15_000 }, async () => {
  await fixture('<button id="primary" style="width:32px;height:32px">1</button><button id="hidden" style="opacity:0">2</button><button id="no-pointer" style="pointer-events:none">3</button>', async (page) => {
    const result = await observePage(page, { ...settings, criticalSelectors: [
      { id: 'boundary', selector: '#primary' }, { id: 'hidden', selector: '#hidden' }, { id: 'pointer', selector: '#no-pointer' },
    ] });
    assert.equal(result.responsive.checks[0].pass, true);
    assert.equal(result.responsive.checks[1].pass, false);
    assert.match(result.responsive.checks[1].reason, /not_visible/);
    assert.equal(result.responsive.checks[2].pass, false);
    assert.match(result.responsive.checks[2].reason, /pointer_events_none/);
  });
});

test('below-fold targets are reachable and document scroll plus anchor coordinates are restored', { timeout: 15_000 }, async () => {
  await fixture('<div style="height:900px"></div><button id="primary">Xong</button><div style="height:500px"></div>', async (page) => {
    await page.evaluate(() => scrollTo(0, 40));
    const before = await page.locator('#primary').boundingBox();
    const result = await observePage(page, settings);
    assert.equal(result.responsive.pass, true);
    assert.equal(result.responsive.checks[0].reachable, true);
    assert.equal(result.anchors[0].y, before.y);
    assert.equal(await page.evaluate(() => scrollY), 40);
    assert.deepEqual(await page.locator('#primary').boundingBox(), before);
  });
});

test('nested horizontal/vertical scrollers and document positions are restored', { timeout: 15_000 }, async () => {
  await fixture('<div style="height:450px"></div><div id="outer" style="height:140px;width:300px;overflow:auto"><div style="height:200px"></div><div id="inner" style="height:100px;width:250px;overflow:auto"><div style="height:180px;width:600px"></div><button id="primary" style="margin-left:400px">Xong</button><div style="height:250px"></div></div><div style="height:300px"></div></div><div style="height:500px"></div>', async (page) => {
    const positions = () => page.evaluate(() => ({
      window: [scrollX, scrollY],
      outer: [document.querySelector('#outer').scrollLeft, document.querySelector('#outer').scrollTop],
      inner: [document.querySelector('#inner').scrollLeft, document.querySelector('#inner').scrollTop],
    }));
    await page.evaluate(() => {
      scrollTo(0, 50);
      document.querySelector('#outer').scrollTop = 20;
      document.querySelector('#inner').scrollTo(35, 30);
    });
    const before = await positions();
    const result = await observePage(page, settings);
    assert.equal(result.responsive.pass, true);
    assert.deepEqual(await positions(), before);
  });
});

for (const kind of ['anchors', 'criticalSelectors']) {
  test(`${kind}: missing or duplicate selector is an error, never reduced coverage`, { timeout: 15_000 }, async () => {
    await fixture('<button id="primary">Xong</button><span class="duplicate">A</span><span class="duplicate">B</span>', async (page) => {
      await assert.rejects(observePage(page, { ...settings, [kind]: [{ id: 'missing', selector: '#missing' }] }), /exactly one DOM element; found 0/);
      await assert.rejects(observePage(page, { ...settings, [kind]: [{ id: 'duplicate', selector: '.duplicate' }] }), /exactly one DOM element; found 2/);
    });
  });
}

test('invalid IDs, duplicate IDs, missing font, and missing/nonpositive target minimum are rejected', async () => {
  for (const kind of ['anchors', 'criticalSelectors']) {
    await assert.rejects(observePage(null, { ...settings, [kind]: [{ id: '../unsafe', selector: '#primary' }] }), /IDs must match/);
    await assert.rejects(observePage(null, { ...settings, [kind]: [{ id: 'same', selector: '#primary' }, { id: 'same', selector: '#other' }] }), /duplicate ID/);
  }
  for (const minTargetPx of [undefined, 0, -1, Infinity, NaN, '32']) {
    await assert.rejects(observePage(null, { ...settings, minTargetPx }), /positive finite number/);
  }
  for (const requiredFont of [undefined, '', 'Arial, sans-serif']) {
    await assert.rejects(observePage(null, { ...settings, requiredFont }), /single font family/);
  }
});

test('system fallback cannot pass as a loaded declared web font', { timeout: 15_000 }, async () => {
  await fixture('<button id="primary">Xong</button>', async (page) => {
    // document.fonts.check can say true for system/fallback text even though no
    // matching declared FontFace exists. That is intentionally not a pass.
    assert.equal(await page.evaluate(() => document.fonts.check('16px Arial')), true);
    const result = await observePage(page, { ...settings, requiredFont: 'Arial' });
    assert.equal(result.font.anchors[0].pass, true);
    assert.equal(result.font.declared, false);
    assert.equal(result.font.loaded, false);
    assert.equal(result.font.pass, false);
  });
});

test('declared Be Vietnam Pro must load and be each anchor first family', { timeout: 15_000 }, async () => {
  const fontData = (await readFile(new URL('./fonts/BeVietnamPro-Regular.ttf', import.meta.url))).toString('base64');
  await fixture(`<style>@font-face{font-family:'Be Vietnam Pro';src:url(data:font/ttf;base64,${fontData}) format('truetype');font-weight:100 900}#primary{font-family:'Be Vietnam Pro',Arial,sans-serif}</style><button id="primary">Tiếng Việt</button>`, async (page) => {
    await stabilizePage(page, { readySelector: '#primary' });
    const loaded = await observePage(page, settings);
    assert.equal(loaded.font.declared, true);
    assert.equal(loaded.font.loaded, true);
    assert.equal(loaded.font.pass, true);
    assert.equal(loaded.font.faces[0].status, 'loaded');
    await page.locator('#primary').evaluate((element) => { element.style.fontFamily = 'Arial, "Be Vietnam Pro", sans-serif'; });
    const wrongFirstFamily = await observePage(page, settings);
    assert.equal(wrongFirstFamily.font.loaded, true);
    assert.equal(wrongFirstFamily.font.pass, false);
    assert.equal(wrongFirstFamily.font.reason, 'anchor_font_family_mismatch');
  });
});

test('declared face that has never loaded cannot pass', { timeout: 15_000 }, async () => {
  await fixture('<button id="primary">Xong</button>', async (page) => {
    await page.evaluate(() => document.fonts.add(new FontFace('Be Vietnam Pro', 'local("NoSuchFontFace-7654321")')));
    const result = await observePage(page, settings);
    assert.equal(result.font.declared, true);
    assert.equal(result.font.faces[0].status, 'unloaded');
    assert.equal(result.font.loaded, false);
    assert.equal(result.font.pass, false);
    assert.equal(result.font.reason, 'required_font_not_loaded');
  });
});

test('stabilize waits for readiness/images and disables motion/caret without changing box layout', { timeout: 15_000 }, async () => {
  const svg = encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="red"/></svg>');
  await fixture(`<style>@keyframes blink{from{opacity:.5}to{opacity:1}}#primary{animation:blink 2s infinite;transition:color 2s;caret-color:red}</style><button id="primary">Xong</button><img src="data:image/svg+xml,${svg}"><img>`, async (page) => {
    const before = await page.locator('#primary').boundingBox();
    const result = await stabilizePage(page, { readySelector: '#primary' });
    assert.equal(result.decodedImages, 1);
    assert.deepEqual(result.policy, { animations: 'disabled', transitions: 'disabled', caret: 'hidden' });
    const style = await page.locator('#primary').evaluate((element) => {
      const computed = getComputedStyle(element);
      return { animation: computed.animationName, transition: computed.transitionProperty, caret: computed.caretColor };
    });
    assert.deepEqual(style, { animation: 'none', transition: 'none', caret: 'rgba(0, 0, 0, 0)' });
    assert.deepEqual(await page.locator('#primary').boundingBox(), before);
  });
});

test('stabilize fails on a broken sourced image', { timeout: 15_000 }, async () => {
  await fixture('<button id="primary">Xong</button><img src="data:image/png;base64,not-an-image">', async (page) => {
    await assert.rejects(stabilizePage(page, { readySelector: '#primary' }), /Image 1 failed to decode/);
  });
  await fixture('<button id="primary">Xong</button><img src="">', async (page) => {
    await assert.rejects(stabilizePage(page, { readySelector: '#primary' }), /Image 1 failed to decode/);
  });
});

test('stabilize requires exactly one visible ready selector', { timeout: 20_000 }, async () => {
  await fixture('<button id="primary">Xong</button><span class="many">A</span><span class="many">B</span><div id="hidden" style="display:none">Ẩn</div>', async (page) => {
    await assert.rejects(stabilizePage(page, { readySelector: '.many' }), /exactly one DOM element; found 2/);
    await assert.rejects(stabilizePage(page, { readySelector: '#missing' }), /exactly one visible DOM element/);
    await assert.rejects(stabilizePage(page, { readySelector: '#hidden' }), /exactly one visible DOM element/);
    await assert.rejects(stabilizePage(page, { readySelector: '' }), /nonempty selector/);
  });
});
