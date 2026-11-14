// Tuần 6 — Ngọc: kiểm lỗi giao diện bốn luồng POS theo tiêu chí trong spec, ở 5 cỡ màn ngang.
// Expected (nguồn):
//   Sơ đồ bàn  — remake-b01 B01-07/B01-08: dùng được từ 568×320; control ≥44×44, có tên đọc được; nội dung không tạo tràn trang.
//   Gọi món    — remake-b02 B02-08: dùng được từ 568×320; control 44; không tràn, không che nút chính.
//   Thanh toán — remake-b03 R07: dùng được từ 568×320; control ≥44×44; chữ ≥12px; tràn trang ≤1px; tiền/nhãn/nút chính không bị che.
//   Mang đi    — chưa có spec giao diện riêng: chỉ đo để tham khảo.
// Mỗi trạng thái × cỡ màn ghi: tràn trang (ngang/dọc), control nhỏ hơn 44×44, chữ nhỏ hơn 12px, chữ bị cắt,
// control không có tên, và phần tử chính (tiền, nút chính, nút đóng) có tới được và bị che hay không.
// Chạy: node kiem-giao-dien.mjs <projectDir> <outDir> [baseURL]
// Mã cửa hàng và PIN là dữ liệu demo có sẵn trong mã nguồn chế độ mock.
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const [projectDir, outDir, baseURL = "http://127.0.0.1:5175"] = process.argv.slice(2);
const require = createRequire(join(projectDir, "package.json"));
const { chromium } = require("@playwright/test");

const CASHIER = ["30000000-0000-4000-8000-000000000013", "111111"];
const B02 = "a254abd0-b883-4d5c-85c1-89f660409e02";
const AMERICANO = "80cfbd5a-a538-4da6-888d-2f732b7b8e2d";
const CA_PHE_SUA = "3e43bb8c-198f-443f-83ab-18696983edaa";
const VIEWPORTS = [[568, 320], [844, 390], [1024, 600], [1366, 768], [1920, 1080]];
const clock = () => new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Bangkok", hour12: false });

// Đo trong trang. scope: selector vùng cần đo (màn/hộp đang mở); keys: selector phần tử chính.
function measure({ scope, keys }) {
  const root = (scope && document.querySelectorAll(scope)[document.querySelectorAll(scope).length - 1]) || document.body;
  const doc = document.documentElement;
  const vis = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 1 && r.height > 1 && s.visibility !== "hidden" && s.display !== "none" && Number(s.opacity) > 0; };
  const label = (el) => (el.getAttribute("aria-label") || el.innerText || el.getAttribute("title") || el.getAttribute("placeholder") || el.value || el.getAttribute("data-testid") || el.tagName).replace(/\s+/g, " ").trim().slice(0, 40);
  const controls = [...root.querySelectorAll('button, a[href], input:not([type=hidden]), select, textarea, [role=button], [role=checkbox], [role=tab]')].filter((el) => !el.disabled && (vis(el) || (el.matches("input[type=checkbox],input[type=radio]") && el.closest("label") && vis(el.closest("label")))));
  const small = [];
  for (const el of controls) {
    let box = el.getBoundingClientRect();
    if (el.matches("input[type=checkbox],input[type=radio]") && el.closest("label")) box = el.closest("label").getBoundingClientRect();
    if (box.width < 43.5 || box.height < 43.5) small.push(`${label(el)} (${Math.round(box.width)}×${Math.round(box.height)})`);
  }
  const noName = controls.filter((el) => !(el.getAttribute("aria-label") || el.innerText.trim() || el.getAttribute("title") || el.getAttribute("aria-labelledby") || (el.labels && el.labels.length) || el.getAttribute("placeholder"))).map((el) => el.getAttribute("data-testid") || el.outerHTML.slice(0, 60));
  const tiny = [], clipped = [];
  for (const el of root.querySelectorAll("*")) {
    if (el.closest("svg") || !vis(el)) continue;
    const own = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim()).map((n) => n.textContent.trim()).join(" ");
    if (!own) continue;
    const s = getComputedStyle(el), fs = parseFloat(s.fontSize);
    if (fs < 12) tiny.push(`"${own.slice(0, 30)}" ${fs}px`);
    const ox = s.overflowX, ellipsis = s.textOverflow === "ellipsis";
    if ((ox === "hidden" || ox === "clip" || ellipsis) && el.scrollWidth > el.clientWidth + 1) clipped.push(`"${own.slice(0, 30)}" (${el.clientWidth}/${el.scrollWidth}px)`);
  }
  const keyResults = (keys || []).map((sel) => {
    const el = document.querySelector(sel);
    if (!el) return `${sel}: KHÔNG CÓ`;
    el.scrollIntoView({ block: "center", inline: "center" });
    const r = el.getBoundingClientRect();
    const inView = r.top >= -1 && r.left >= -1 && r.bottom <= innerHeight + 1 && r.right <= innerWidth + 1;
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    const covered = !(hit && (hit === el || el.contains(hit) || hit.contains(el)));
    return `${sel}: ${inView ? "tới được" : "NGOÀI MÀN sau khi cuộn"}${covered ? `, BỊ CHE bởi ${hit ? (hit.getAttribute("data-testid") || hit.className?.toString().slice(0, 30) || hit.tagName) : "không gì"}` : ""}`;
  });
  return {
    overflowX: doc.scrollWidth - doc.clientWidth, overflowY: doc.scrollHeight - doc.clientHeight,
    controls: controls.length, small: [...new Set(small)], noName: [...new Set(noName)],
    tiny: [...new Set(tiny)], clipped: [...new Set(clipped)], keys: keyResults,
  };
}

async function login(page) {
  await page.getByTestId("landing-screen").or(page.getByTestId("passcode-screen")).first().waitFor({ timeout: 30000 });
  if (await page.getByTestId("landing-screen").isVisible()) {
    await page.getByTestId("go-store-pairing").click();
    await page.getByTestId("store-key-input").fill("0001-X8F3QA");
    await page.getByTestId("go-passcode").click();
  }
  await page.getByTestId("passcode-screen").waitFor();
  await page.getByTestId(`employee-${CASHIER[0]}`).click();
  for (const d of CASHIER[1]) await page.getByTestId(`pin-${d}`).click();
  await page.getByTestId("unlock-button").click();
  await page.getByTestId("floor-view").waitFor();
  await page.mouse.move(-1, -1);
  await page.locator(':root:not(:has([data-rht-toaster] > div)) [data-testid="floor-view"]').waitFor({ timeout: 15000 });
}
const openB02 = async (page) => { const t = page.getByTestId(`table-${B02}`); await t.scrollIntoViewIfNeeded(); await t.click(); await page.getByTestId("order-drawer").waitFor(); await page.waitForTimeout(400); };
const tid = (id) => `[data-testid="${id}"]`;

const STATES = [
  { id: "1-so-do-ban", screen: "Sơ đồ bàn", spec: "B01-07/08", scope: tid("floor-view"), keys: [tid(`table-${B02}`), tid("floor-filter-all")], go: async () => {} },
  // Dưới 1280px khung "Đơn đang mở" thu gọn thành nút (B01-07); mở ra rồi kiểm thẻ đơn và đóng bằng Escape (B01-08).
  { id: "1b-don-dang-mo", screen: "Sơ đồ bàn", spec: "B01-07/08", scope: tid("floor-open-orders"), keys: ['[data-testid^="floor-order-"]'],
    go: async (p) => { const t = p.getByTestId("floor-orders-toggle"); if (await t.isVisible()) { await t.click(); await p.waitForTimeout(400); } },
    after: async (p) => { const t = p.getByTestId("floor-orders-toggle"); if (!(await t.isVisible())) return "Khung Đơn đang mở hiện thường trực (≥1280px), không có nút thu gọn."; await p.keyboard.press("Escape"); await p.waitForTimeout(300); return `Mở bằng nút "Đơn đang mở"; bấm Escape: khung ${(await t.getAttribute("aria-expanded")) === "false" ? "đã đóng" : "VẪN MỞ"}.`; } },
  { id: "2-goi-mon", screen: "Gọi món", spec: "B02-08", scope: tid("order-drawer"), keys: [tid("submit-order-button-footer"), tid("order-total-amount"), tid("order-close-button")], go: async (p) => openB02(p) },
  { id: "3-hop-tuy-chon", screen: "Gọi món", spec: "B02-08", scope: tid("b02-modifier-dialog"), keys: [tid("modifier-confirm"), tid("modifier-picker-close")], go: async (p) => { await p.getByTestId(`menu-item-${CA_PHE_SUA}`).click(); await p.getByTestId("b02-modifier-dialog").first().waitFor(); await p.waitForTimeout(300); }, after: async (p) => { await p.getByTestId("modifier-picker-close").click(); await p.waitForTimeout(300); } },
  { id: "4-hop-bo-nhap", screen: "Gọi món", spec: "B02-08", scope: '[role="dialog"]', keys: [], go: async (p) => { await p.getByTestId(`menu-item-${AMERICANO}`).click(); await p.waitForTimeout(300); await p.getByTestId("order-close-button").click(); await p.getByText("Bỏ đơn chưa gửi?", { exact: true }).waitFor(); await p.waitForTimeout(300); }, after: async (p) => { await p.getByRole("button", { name: "Bỏ đơn", exact: true }).click(); await p.waitForTimeout(400); } },
  { id: "5-thanh-toan", screen: "Thanh toán", spec: "R07", scope: tid("payment-drawer"), keys: [tid("pay-button-footer"), tid("payment-amount-due-value"), tid("payment-received-amount"), tid("payment-key-delete"), tid("pay-select-all")], go: async (p) => { await openB02(p); await p.getByTestId("submit-order-button-footer").click(); await p.getByTestId("payment-drawer").waitFor(); await p.waitForTimeout(400); } },
  { id: "6-thieu-tien", screen: "Thanh toán", spec: "R07", scope: tid("payment-drawer"), keys: [tid("payment-insufficient-warning"), tid("pay-button-footer"), tid("payment-change-summary-value")], go: async (p) => { const i = p.getByTestId("payment-received-amount"); await i.click(); await p.keyboard.press("Control+A"); await p.keyboard.type("1000"); await p.waitForTimeout(300); } },
  { id: "7-phieu-tam-tinh", screen: "Thanh toán", spec: "R06/R07", scope: tid("receipt-preview"), keys: [tid("receipt-close-header"), tid("receipt-close-footer")], go: async (p) => { await p.getByTestId("print-provisional-button").click(); await p.getByTestId("receipt-preview").waitFor(); await p.waitForTimeout(400); }, after: async (p) => { await p.getByTestId("receipt-close-header").click(); await p.waitForTimeout(300); await p.getByTestId("payment-close-button").first().click(); await p.waitForTimeout(400); if (await p.getByTestId("order-drawer").count()) { await p.getByTestId("order-close-button").click(); await p.waitForTimeout(300); } } },
  { id: "8-mang-di", screen: "Mang đi", spec: "chưa có spec (tham khảo)", scope: tid("takeaway-drawer"), keys: [], go: async (p) => { await p.getByTestId("nav-takeaway").click(); await p.getByTestId("takeaway-drawer").waitFor(); await p.waitForTimeout(400); } },
];

async function run() {
  mkdirSync(join(outDir, "anh"), { recursive: true });
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const out = [];
  for (const [w, h] of VIEWPORTS) {
    const vp = `${w}x${h}`;
    const context = await browser.newContext({ baseURL, viewport: { width: w, height: h }, deviceScaleFactor: 1, locale: "vi-VN", timezoneId: "Asia/Ho_Chi_Minh", hasTouch: true });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e).slice(0, 200)));
    await page.goto("/");
    try { await login(page); } catch (e) { out.push({ viewport: vp, state: "dang-nhap", error: String(e.message).slice(0, 200) }); await context.close(); continue; }
    for (const s of STATES) {
      const rec = { viewport: vp, state: s.id, screen: s.screen, spec: s.spec, time: clock() };
      try {
        await s.go(page);
        await page.mouse.move(-1, -1);
        await page.screenshot({ path: join(outDir, "anh", `${vp}-${s.id}.png`) });
        Object.assign(rec, await page.evaluate(measure, { scope: s.scope, keys: s.keys }));
        await page.screenshot({ path: join(outDir, "anh", `${vp}-${s.id}.png`) });
        if (s.after) { const note = await s.after(page); if (note) rec.note = note; }
      } catch (e) {
        rec.error = `Không dựng được trạng thái: ${String(e.message || e).split("\n")[0].slice(0, 200)}`;
        await page.screenshot({ path: join(outDir, "anh", `${vp}-${s.id}-dung.png`) }).catch(() => {});
        await page.keyboard.press("Escape").catch(() => {});
      }
      out.push(rec);
      console.log(`${vp} ${s.id}: ${rec.error ? "DỪNG" : `tràn ${rec.overflowX}/${rec.overflowY}, nhỏ ${rec.small.length}, chữ<12 ${rec.tiny.length}, cắt ${rec.clipped.length}, không tên ${rec.noName.length}, che ${rec.keys.filter((k) => /CHE|NGOÀI|KHÔNG CÓ/.test(k)).length}`}`);
    }
    out.push({ viewport: vp, pageErrors: errors });
    await context.close();
  }
  await browser.close();
  writeFileSync(join(outDir, "ket-qua.json"), JSON.stringify({ source: "main cd35439 (src giống hệt, đã so mã băm)", role: "Thu ngân", finishedAt: new Date().toISOString(), results: out }, null, 2), "utf8");
}

run().catch((e) => { console.error(e); process.exit(1); });
