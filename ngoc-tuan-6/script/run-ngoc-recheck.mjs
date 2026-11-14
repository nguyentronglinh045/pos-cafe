// Focused browser recheck. This is automated Playwright evidence, not a personal manual attestation.
// node run-ngoc-recheck.mjs <projectDir> <newOutputDir> [baseURL]
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, join, relative } from 'node:path';
import { createHash } from 'node:crypto';

const [projectArg, outputArg, baseURL = 'http://127.0.0.1:5175'] = process.argv.slice(2);
if (!projectArg || !outputArg) throw Error('projectDir and newOutputDir are required');
if (new URL(baseURL).hostname !== '127.0.0.1') throw Error('Only the local demo is allowed');
const projectDir = resolve(projectArg), outDir = resolve(outputArg);
if (existsSync(join(outDir, 'ket-qua.json'))) throw Error('Use a new output directory to preserve earlier evidence');
const require = createRequire(join(projectDir, 'package.json'));
const { chromium, expect } = require('@playwright/test');
const now = () => new Date().toISOString();
const clock = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Bangkok', dateStyle: 'short', timeStyle: 'medium' }).format(new Date()) + ' UTC+7';
const digest = data => createHash('sha256').update(data).digest('hex');
function sourceFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? sourceFiles(join(dir, e.name)) : [join(dir, e.name)]);
}
const sourceManifest = sourceFiles(join(projectDir, 'src')).sort().map(file => ({ file: relative(projectDir, file).replaceAll('\\', '/'), sha256: digest(readFileSync(file)) }));
const report = { method: 'AUTOMATED_PLAYWRIGHT_RECHECK', performedBy: 'Codex AI', personalManualAttestation: false, baseURL, timezone: 'Asia/Bangkok', startedAt: now(), startedLocal: clock(), sourceFingerprint: digest(JSON.stringify(sourceManifest)), sourceManifest, results: [] };
mkdirSync(join(outDir, 'anh'), { recursive: true });
const save = () => writeFileSync(join(outDir, 'ket-qua.json'), JSON.stringify(report, null, 2) + '\n');
save();
const browser = await chromium.launch({ channel: 'chrome', headless: true });
report.browserVersion = browser.version();
const B02 = 'a254abd0-b883-4d5c-85c1-89f660409e02';
const normalize = s => s.replace(/\s+/g, ' ').trim();
const content = async loc => normalize(await loc.innerText());

async function login(page) {
  await page.goto(baseURL);
  await expect(page.getByTestId('landing-screen').or(page.getByTestId('passcode-screen')).first()).toBeVisible();
  if (await page.getByTestId('landing-screen').isVisible()) {
    await page.getByTestId('go-store-pairing').click();
    await page.getByTestId('store-key-input').fill('0001-X8F3QA');
    await page.getByTestId('go-passcode').click();
  }
  await page.getByTestId('employee-30000000-0000-4000-8000-000000000013').click();
  for (const digit of '111111') await page.getByTestId(`pin-${digit}`).click();
  await page.getByTestId('unlock-button').click();
  await expect(page.getByTestId('floor-view')).toBeVisible();
  await expect(page.locator('[data-rht-toaster] > div')).toHaveCount(0, { timeout: 15000 });
}
async function openB02(page) { await page.getByTestId(`table-${B02}`).click(); await expect(page.getByTestId('order-total-amount')).toHaveAttribute('data-amount', '125000'); }
async function runCase(caseId, viewport, body) {
  const record = { caseId, viewport, start: clock(), steps: [], pageErrors: [] };
  report.results.push(record);
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, locale: 'vi-VN', timezoneId: 'Asia/Bangkok' });
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  page.on('pageerror', error => record.pageErrors.push(String(error)));
  const shot = async name => {
    const file = `anh/${caseId}-${name}.png`;
    await page.screenshot({ path: join(outDir, file), animations: 'disabled' });
    return file;
  };
  const step = async (id, expected, action) => {
    const result = { id, expected, time: clock(), status: 'CHƯA CHẠY' };
    record.steps.push(result);
    try { Object.assign(result, await action()); result.status ??= 'ĐÚNG'; if (result.status === 'CHƯA CHẠY') result.status = 'ĐÚNG'; }
    catch (error) { result.status = 'LỖI KIỂM TRA'; result.error = String(error.message); throw error; }
    finally { result.shot = await shot(id).catch(() => null); save(); }
    console.log(`${caseId}/${id}: ${result.status}`);
  };
  try { await login(page); await body(page, step, shot); record.status = record.steps.some(s => s.status.startsWith('LỆCH')) ? 'LỆCH ĐÃ BIẾT' : 'ĐÚNG'; }
  catch (error) { record.status = 'KHÔNG HOÀN TẤT'; record.error = String(error.message); }
  finally { record.end = clock(); await context.tracing.stop({ path: join(outDir, `${caseId}-trace.zip`) }); await context.close(); save(); }
}

try {
  await runCase('N01-11', { width: 1366, height: 768 }, async (page, step, shot) => {
    const lines = page.getByTestId('order-cart-line');
    const saved = name => lines.filter({ hasText: name }).filter({ hasText: 'Phần đã lưu' });
    const total = page.getByTestId('order-total-amount');
    await step('B1', 'Đơn #24 có 3 dòng đã lưu, tổng 125000', async () => { await openB02(page); await expect(lines).toHaveCount(3); await expect(page.getByTestId('b02-header')).toContainText('#24'); return { observed: await lines.allTextContents(), amount: await total.getAttribute('data-amount') }; });
    await step('B2', 'Saved Bạc xỉu vẫn x1; có dòng gọi thêm riêng; tổng 157000', async () => {
      await saved('Bạc xỉu').getByTestId('order-cart-increase').click();
      await expect(saved('Bạc xỉu').getByTestId('order-cart-quantity')).toHaveText('1');
      const added = lines.filter({ hasText: 'Bạc xỉu' }).filter({ hasText: 'Phần gọi thêm' });
      await expect(added).toHaveCount(1); await expect(added.getByTestId('order-cart-quantity')).toHaveText('1');
      await expect(total).toHaveAttribute('data-amount', '157000'); await added.scrollIntoViewIfNeeded();
      return { observed: await lines.allTextContents(), amount: '157000' };
    });
    await step('B3', 'Croissant giảm về 0 thì ẩn; tổng 122000', async () => {
      await saved('Croissant').getByTestId('order-cart-decrease').click(); await expect(lines.filter({ hasText: 'Croissant' })).toHaveCount(0); await expect(total).toHaveAttribute('data-amount', '122000');
      return { observed: await lines.allTextContents(), amount: '122000' };
    });
    await step('B4', 'Nút Bỏ thay đổi; bỏ nháp, mở lại 125000 và Croissant còn', async () => {
      await page.getByTestId('order-close-button').click(); const dialog = page.getByRole('dialog').last();
      await expect(dialog).toContainText('Bỏ đơn chưa gửi?'); const discard = dialog.getByRole('button', { name: /^Bỏ/ }); const label = await content(discard);
      const dialogShot = await shot('B4-hop-bo-nhap'); await discard.click(); await expect(page.getByTestId('order-drawer')).toHaveCount(0);
      await openB02(page); await expect(lines).toHaveCount(3); await expect(saved('Croissant')).toHaveCount(1); await expect(lines.filter({ hasText: 'Phần gọi thêm' })).toHaveCount(0);
      if (!['Bỏ đơn', 'Bỏ thay đổi'].includes(label)) throw Error(`Unexpected discard label: ${label}`);
      return { status: label === 'Bỏ thay đổi' ? 'ĐÚNG' : 'LỆCH — chờ CX-03', behavior: 'ĐÚNG', label, dialogShot, amount: '125000', observed: await lines.allTextContents() };
    });
  });
  await runCase('N01-12', { width: 1366, height: 768 }, async (page, step, shot) => {
    const amount = page.getByTestId('payment-received-amount');
    async function verify(value) { await expect(amount).toHaveAttribute('data-amount', value); return { received: value, display: await amount.inputValue(), finishDisabled: await page.getByTestId('pay-button-footer').isDisabled() }; }
    await step('B1', 'Mở thanh toán #24: 125000', async () => { await openB02(page); await page.getByTestId('submit-order-button-footer').click(); await expect(page.getByTestId('payment-drawer')).toBeVisible(); return verify('125000'); });
    await step('B2', 'Xóa 1 chữ số: 12500', async () => { await page.getByTestId('payment-key-delete').click(); const value = await verify('12500'); expect(value.finishDisabled).toBe(true); return value; });
    await step('B3', 'Bấm 00: 1250000', async () => { await page.getByTestId('payment-key-00').click(); return verify('1250000'); });
    await step('B4', 'Bấm 9 bốn lần: giữ đúng 125000099 (9 chữ số)', async () => { for (let i = 0; i < 4; i++) await page.getByTestId('payment-key-9').click(); return verify('125000099'); });
    await step('B5', 'Gõ 12a5b: chỉ còn 125, hoàn tất bị khóa', async () => {
      await amount.click(); await page.keyboard.press('Control+A'); await page.keyboard.type('12a5b'); const value = await verify('125'); expect(value.finishDisabled).toBe(true);
      return { ...value, exactAmountButtonVisible: await page.getByRole('button', { name: 'Đúng tiền', exact: true }).isVisible() };
    });
    await step('B6', 'Nhập lại 200000; Đúng tiền=125000; +50k=175000; 500k=500000', async () => {
      await amount.fill('200000'); await verify('200000'); const preparationShot = await shot('B6-nhap-lai-200000'); const values = [];
      for (const [name, value] of [['Đúng tiền', '125000'], ['+50k', '175000'], ['500k', '500000']]) { await page.getByRole('button', { name, exact: true }).click(); values.push({ name, ...await verify(value), shot: await shot(`B6-${value}`) }); }
      return { preparation: '200000', preparationShot, values };
    });
    await page.getByTestId('payment-close-button').first().click();
    if (await page.getByTestId('order-drawer').count()) await page.getByTestId('order-close-button').click();
    await openB02(page); await expect(page.getByTestId('b02-header')).toContainText('#24');
  });
  await runCase('MANG-DI-568x320', { width: 568, height: 320 }, async (page, step, shot) => {
    const drawer = page.getByTestId('takeaway-drawer');
    async function open() { await page.getByTestId('nav-takeaway').click(); await expect(drawer).toBeVisible(); await expect(drawer.locator('header p')).toContainText('1 đơn đang mở'); await expect(drawer.locator('aside')).toContainText('#26'); }
    async function closeTarget() { if (await page.getByTestId('payment-drawer').count()) await page.getByTestId('payment-close-button').first().click(); if (await page.getByTestId('order-drawer').count()) await page.getByTestId('order-close-button').click(); await expect(page.getByTestId('floor-view')).toBeVisible(); }
    async function inspect(locator) {
      await locator.scrollIntoViewIfNeeded(); await locator.click({ trial: true });
      return locator.evaluate(el => { const r = el.getBoundingClientRect(), hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return { text: el.textContent.trim(), x: r.x, y: r.y, width: r.width, height: r.height, fullyInViewport: r.x >= 0 && r.y >= 0 && r.right <= innerWidth && r.bottom <= innerHeight, centerHit: hit === el || el.contains(hit), scrollParents: [...(function* () { let p = el.parentElement; while (p) { yield p; p = p.parentElement; } })()].filter(p => p.scrollWidth > p.clientWidth || p.scrollHeight > p.clientHeight).map(p => ({ tag: p.tagName, className: p.className, scrollLeft: p.scrollLeft, scrollTop: p.scrollTop, clientWidth: p.clientWidth, scrollWidth: p.scrollWidth, clientHeight: p.clientHeight, scrollHeight: p.scrollHeight })) }; });
    }
    await step('T1', 'Mở mang đi tại đúng 568x320; ghi trạng thái ban đầu và 9 nút', async () => {
      await open(); const controls = await drawer.getByRole('button').evaluateAll(els => els.map(el => { const r = el.getBoundingClientRect(); return { text: el.textContent.trim(), width: r.width, height: r.height }; }));
      expect(controls).toHaveLength(9); return { controls, document: await page.evaluate(() => ({ width: innerWidth, height: innerHeight, overflowX: document.documentElement.scrollWidth - innerWidth, overflowY: document.documentElement.scrollHeight - innerHeight })) };
    });
    await step('T2', 'Bấm cả ba thẻ lọc; Đã thanh toán rỗng; Hôm nay/Đang mở có đơn #26', async () => {
      const filters = [];
      for (const name of ['Đã thanh toán', 'Hôm nay', 'Đang mở']) { const button = drawer.getByRole('button', { name, exact: true }); const control = await inspect(button); await button.click(); await expect(drawer.locator('section')).toContainText(name === 'Đã thanh toán' ? 'Chưa có đơn mang đi đang mở.' : '#26'); filters.push({ name, control, list: await content(drawer.locator('section')), shot: await shot(`T2-${filters.length + 1}`) }); }
      return { filters };
    });
    await step('T3', 'Tạo đơn mở nháp mới; đóng không gửi, danh sách vẫn 1 đơn', async () => {
      const control = await inspect(drawer.getByRole('button', { name: 'Tạo đơn mang đi', exact: true })); await drawer.getByRole('button', { name: 'Tạo đơn mang đi', exact: true }).click(); await expect(page.getByTestId('b02-header')).toContainText('Đơn mới'); const newOrderShot = await shot('T3-don-moi'); await closeTarget(); await open(); return { control, newOrderShot, openOrders: 1 };
    });
    for (const [scope, title] of [['section', 'the-don'], ['aside', 'chi-tiet']]) {
      for (const [name, target] of [['Mở đơn', 'order'], ['Thanh toán', 'payment']]) {
        await step(`T4-${title}-${target}`, `Cuộn tới và bấm ${name} ở ${title}: đúng đơn #26, 84000`, async () => {
          const button = drawer.locator(scope).getByRole('button', { name, exact: true }); const control = await inspect(button); expect(control.fullyInViewport).toBe(true); expect(control.centerHit).toBe(true); const beforeClickShot = await shot(`T4-${title}-${target}-truoc-bam`); await button.click();
          if (target === 'order') { await expect(page.getByTestId('b02-header')).toContainText('#26'); await expect(page.getByTestId('order-total-amount')).toHaveAttribute('data-amount', '84000'); }
          else { await expect(page.getByTestId('payment-drawer')).toContainText('Đơn #26'); await expect(page.getByTestId('payment-order-summary')).toHaveAttribute('data-amount-due', '84000'); }
          const targetShot = await shot(`T4-${title}-${target}-da-mo`); await closeTarget(); await open(); return { control, beforeClickShot, targetShot, amount: '84000', completedPayment: false };
        });
      }
    }
    await step('T5', 'Cuộn tới tổng chi tiết 84000; bấm Đóng; mở lại vẫn một đơn', async () => {
      const sum = drawer.locator('aside').getByText('84.000 ₫', { exact: true }); await expect(sum).toHaveCount(1); await sum.scrollIntoViewIfNeeded(); const totalShot = await shot('T5-tong-chi-tiet');
      const button = drawer.getByRole('button', { name: 'Đóng', exact: true }); const control = await inspect(button); await button.click(); await expect(drawer).toHaveCount(0); await open(); return { total: await content(sum), control, totalShot, openOrders: 1 };
    });
  });
} finally {
  const after = sourceFiles(join(projectDir, 'src')).sort().map(file => ({ file: relative(projectDir, file).replaceAll('\\', '/'), sha256: digest(readFileSync(file)) }));
  report.sourceUnchanged = JSON.stringify(after) === JSON.stringify(sourceManifest);
  report.finishedAt = now(); report.finishedLocal = clock(); save(); await browser.close();
}
console.log(JSON.stringify(report.results.map(r => ({ caseId: r.caseId, status: r.status, steps: r.steps.length, pageErrors: r.pageErrors, error: r.error })), null, 2));
if (!report.sourceUnchanged || report.results.length !== 3 || report.results.some(r => r.status === 'KHÔNG HOÀN TẤT' || r.pageErrors.length)) process.exitCode = 1;
