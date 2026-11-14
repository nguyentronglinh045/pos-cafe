// Tuần 6 — Lâm: làm theo nguyên văn docs/demo-runbook.md (bản docs e8a1810, viết lại 09/11) bước 1–16
// và đối chiếu một số yêu cầu FR với bản demo mock của main cd35439.
// Mỗi bước: ghi giờ, điều thấy trên màn, và tên nút/màn in đậm trong runbook có đúng chữ trên màn hay không.
// Chạy: node chay-runbook-va-yeu-cau.mjs <projectDir> <outDir> [baseURL]
// Store Key và PIN dùng ở đây là dữ liệu demo có sẵn trong mã nguồn chế độ mock; kết quả không ghi lại giá trị
// Store Key/PIN do màn Tạo quán sinh ra, và ảnh màn đó được làm mờ hai ô này.
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const [projectDir, outDir, baseURL = "http://127.0.0.1:5175"] = process.argv.slice(2);
const require = createRequire(join(projectDir, "package.json"));
const { chromium } = require("@playwright/test");

const ID = {
  owner: ["30000000-0000-4000-8000-000000000011", "123456"],
  cashier: ["30000000-0000-4000-8000-000000000013", "111111"],
  waiter: ["30000000-0000-4000-8000-000000000014", "384729"],
  B01: "7b035353-73d6-44bc-8ec4-1ab9951f7a58",
  americano: "80cfbd5a-a538-4da6-888d-2f732b7b8e2d",
  caPheSua: "3e43bb8c-198f-443f-83ab-18696983edaa",
  traSua: "f6dec6d1-792d-4ccd-8892-86c3f3f550fc",
  sizeM: "a5f986a6-ea67-4dd3-866e-42a0be8a0497",
  itDa: "9d64eca6-2712-484e-8962-848c27c41793",
  tranChau: "dbbecac5-7b06-42c8-8a53-44e08e8d61c3",
  catTra: "1ebf92aa-cf30-4e0d-8279-2b6fe3f8fb54",
};
const DEMO_KEY = "0001-X8F3QA";
const clock = () => new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Bangkok", hour12: false });
const clean = (s) => (s ?? "").replace(/\s+/g, " ").trim();
const text = async (loc) => clean(await loc.textContent());
const attr = (loc, name) => loc.getAttribute(name);
const due = (page) => attr(page.getByTestId("payment-order-summary"), "data-amount-due");
const received = (page) => attr(page.getByTestId("payment-received-amount"), "data-amount");
const toast = async (page) => clean(await page.locator("[data-rht-toaster]").innerText().catch(() => ""));
const tablesVisible = (page) => page.locator("[data-table-status]").evaluateAll((els) => els.map((e) => `${e.textContent.trim().slice(0, 3)}/${e.dataset.tableStatus}`));
const navLabels = (page) => page.locator('[data-testid^="nav-"]').evaluateAll((els) => els.map((e) => e.getAttribute("aria-label")).filter(Boolean));
const closeReceipt = async (page) => { await page.getByTestId("receipt-close-footer").click(); await page.getByTestId("receipt-preview").waitFor({ state: "detached", timeout: 5000 }).catch(() => {}); await page.waitForTimeout(300); };
// Chữ in đậm trong runbook có xuất hiện trên màn (chữ hiển thị, placeholder hoặc aria-label) không, so đúng từng dấu.
const labels = (page, list) => page.evaluate((list) => {
  const nfc = (s) => (s || "").normalize("NFC");
  const body = nfc(document.body.innerText);
  const extra = [...document.querySelectorAll("[placeholder],[aria-label]")].map((e) => nfc(e.getAttribute("placeholder")) + " " + nfc(e.getAttribute("aria-label"))).join(" ");
  return list.map((l) => `${l}: ${body.includes(nfc(l)) ? "có" : extra.includes(nfc(l)) ? "có (ô nhập/nhãn ẩn)" : "KHÔNG THẤY"}`);
}, list);
// Nút có thấy ngay không (không bị khung cuộn che).
const reachable = (loc) => loc.evaluate((el) => {
  const r = el.getBoundingClientRect();
  let p = el.parentElement, clipped = false;
  while (p) { const s = getComputedStyle(p); if (/(auto|scroll|hidden)/.test(s.overflowY + s.overflowX)) { const q = p.getBoundingClientRect(); if (r.top < q.top - 1 || r.bottom > q.bottom + 1) clipped = true; } p = p.parentElement; }
  const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  return !clipped && !!top && (top === el || el.contains(top));
});
const results = [];

async function pair(page) {
  await page.getByTestId("landing-screen").or(page.getByTestId("passcode-screen")).first().waitFor({ timeout: 30000 });
  if (await page.getByTestId("landing-screen").isVisible()) {
    await page.getByTestId("go-store-pairing").click();
    await page.getByTestId("store-key-input").fill(DEMO_KEY);
    await page.getByTestId("go-passcode").click();
  }
  await page.getByTestId("passcode-screen").waitFor();
}
async function login(page, [employeeId, pin]) {
  await pair(page);
  await page.getByTestId(`employee-${employeeId}`).click();
  for (const d of pin) await page.getByTestId(`pin-${d}`).click();
  await page.getByTestId("unlock-button").click();
  await page.getByTestId("floor-view").waitFor();
  await page.waitForTimeout(400);
}
async function relogin(page, who) {
  await page.getByTestId("nav-lock").click();
  await page.getByTestId("passcode-screen").waitFor();
  await page.getByTestId(`employee-${who[0]}`).click();
  for (const d of who[1]) await page.getByTestId(`pin-${d}`).click();
  await page.getByTestId("unlock-button").click();
  await page.getByTestId("floor-view").waitFor(); await page.waitForTimeout(400);
}

async function scenario(browser, name, viewport, fn) {
  const dir = join(outDir, "anh", name);
  mkdirSync(dir, { recursive: true });
  const context = await browser.newContext({ baseURL, viewport, deviceScaleFactor: 1, locale: "vi-VN", timezoneId: "Asia/Ho_Chi_Minh" });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 200)));
  const steps = [];
  const step = async (id, title, body) => {
    const rec = { id, title, start: clock(), end: null, seen: [], labels: [], shots: [] };
    const n = {
      seen: (s) => rec.seen.push(s),
      labels: async (list) => rec.labels.push(...(await labels(page, list))),
      shot: async (file) => { await page.mouse.move(-1, -1); await page.screenshot({ path: join(dir, `${file}.png`) }).catch(() => {}); rec.shots.push(`${name}/${file}.png`); },
    };
    try { await body(n); } catch (e) { rec.seen.push(`DỪNG: ${clean(String(e.message || e)).slice(0, 240)}`); await n.shot(`${id}-dung`); }
    rec.end = clock();
    steps.push(rec);
    console.log(`${name}/${id} ${rec.start}-${rec.end}${rec.seen.some((s) => s.startsWith("DỪNG")) ? " DỪNG" : ""}`);
  };
  await page.goto("/");
  await fn(page, step);
  results.push({ name, viewport, steps, pageErrors: errors });
  await context.close();
}

async function run() {
  mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ channel: "chrome", headless: true });

  // R — Runbook bản 09/11, bước 1–16, làm đúng thứ tự và chữ trong runbook.
  await scenario(browser, "R-runbook", { width: 1366, height: 768 }, async (page, step) => {
    let baseRev = "", origNo = null, splitNo = null, lastNo = null;
    await step("B01", "Mở app ở chế độ màn hình ngang", async (n) => {
      await page.getByTestId("landing-screen").waitFor({ timeout: 30000 });
      await n.labels(["Đã có quán", "Tạo quán mới"]);
      await n.shot("B01-man-dau");
    });
    await step("B02", "Đã có quán → nhập Store Key → Ghép thiết bị", async (n) => {
      await page.getByTestId("go-store-pairing").click();
      await page.getByTestId("store-pairing-screen").waitFor();
      await page.getByTestId("store-key-input").fill(DEMO_KEY);
      await n.labels(["Ghép thiết bị"]);
      n.seen(`Tiêu đề màn: "${await text(page.locator("h2").first())}"; nút: "${await text(page.getByTestId("go-passcode"))}"`);
      await page.getByTestId("go-passcode").click();
      await page.getByTestId("passcode-screen").waitFor();
    });
    await step("B03", "Chọn Chủ quán, nhập PIN, Mở khoá", async (n) => {
      n.seen(`Nhân viên: ${(await page.locator('[data-testid^="employee-"]').allInnerTexts()).map(clean).join(" | ")}`);
      await n.labels(["Chủ quán", "Quản lý", "Thu ngân", "Mở khoá"]);
      await page.getByTestId(`employee-${ID.owner[0]}`).click();
      for (const d of ID.owner[1]) await page.getByTestId(`pin-${d}`).click();
      await page.getByTestId("unlock-button").click();
      await page.getByTestId("floor-view").waitFor(); await page.waitForTimeout(400);
      n.seen(`Thanh trái của Chủ quán: ${(await navLabels(page)).join(", ")}`);
      await page.getByTestId("nav-report").click();
      await page.getByTestId("report-summary").waitFor(); await page.waitForTimeout(500);
      baseRev = await text(page.getByTestId("report-summary"));
      n.seen(`Báo cáo trước khi làm (để so ở bước 11): "${baseRev.slice(0, 100)}"`);
      await page.getByTestId("report-close-button").first().click(); await page.waitForTimeout(300);
    });
    await step("B04", "Sơ đồ bàn → bấm khu Tầng trệt → (bấm Trống) → bấm B01 → màn Gọi món", async (n) => {
      await n.labels(["Sơ đồ bàn", "Tầng trệt", "Trống", "Tất cả", "Đơn đang mở"]);
      await page.getByRole("button", { name: "Tầng trệt", exact: true }).click();
      await page.getByTestId("floor-filter-empty").click(); await page.waitForTimeout(300);
      n.seen(`Sau khi bấm Trống: ${(await tablesVisible(page)).join(", ")}`);
      await n.shot("B04a-loc-trong");
      await page.getByTestId(`table-${ID.B01}`).click();
      await page.getByTestId("order-drawer").waitFor(); await page.waitForTimeout(300);
      n.seen(`Màn mở ra: tiêu đề "${clean(await attr(page.getByTestId("b02-header"), "aria-label"))}"`);
      await n.labels(["Gọi món"]);
      await n.shot("B04b-man-goi-mon");
    });
    await step("B05", "Gọi món: danh mục, Tìm món, + Thêm, Có tùy chọn, Thêm vào đơn, Giỏ hàng, + −, Ghi chú, In/Gửi đơn, Phiếu gửi bếp", async (n) => {
      await n.labels(["Cà phê", "Trà & trà sữa", "Tìm món", "+ Thêm", "Có tùy chọn", "Giỏ hàng"]);
      await page.getByTestId(`menu-item-${ID.caPheSua}`).click();
      await page.getByTestId("b02-modifier-dialog").first().waitFor();
      await n.labels(["Thêm vào đơn"]);
      await n.shot("B05a-cua-so-tuy-chon");
      await page.getByTestId(`modifier-value-${ID.sizeM}`).click();
      await page.getByTestId(`modifier-value-${ID.itDa}`).click();
      await page.getByTestId("modifier-confirm").click(); await page.waitForTimeout(300);
      await page.getByTestId(`b02-category-${ID.catTra}`).click(); await page.waitForTimeout(200);
      await page.getByTestId(`menu-item-${ID.traSua}`).click();
      await page.getByTestId("b02-modifier-dialog").first().waitFor();
      await page.getByTestId(`modifier-value-${ID.tranChau}`).click();
      await page.getByTestId("modifier-confirm").click(); await page.waitForTimeout(300);
      await page.getByTestId("b02-search").fill("Americano"); await page.waitForTimeout(300);
      await page.getByTestId(`menu-item-${ID.americano}`).locator(".add-label").click(); await page.waitForTimeout(300);
      await page.getByTestId("b02-search").fill("");
      const am = page.getByTestId("order-cart-line").filter({ hasText: "Americano" });
      await am.getByTestId("order-cart-increase").click(); await page.waitForTimeout(200);
      const cp = page.getByTestId("order-cart-line").filter({ hasText: "Cà phê sữa" });
      await cp.getByTestId("b02-note").click();
      await page.getByTestId("b02-line-note").fill("ít ngọt");
      await page.getByTestId("b02-search").click(); await page.waitForTimeout(200);
      await n.labels(["Ghi chú", "In/Gửi đơn"]);
      n.seen(`Ghi chú không cần bấm lưu: dòng Cà phê sữa sau khi rời ô "${(await text(cp)).slice(0, 90)}"`);
      n.seen(`Tổng ${await attr(page.getByTestId("order-total-amount"), "data-amount")}đ; nút "${await text(page.getByTestId("submit-order-button-footer"))}"`);
      await n.shot("B05b-gio-hang");
      await page.getByTestId("submit-order-button-footer").click();
      await page.getByTestId("receipt-preview").waitFor({ timeout: 10000 });
      origNo = await attr(page.getByTestId("receipt-document"), "data-order-no");
      const doc = await text(page.getByTestId("receipt-document"));
      await n.labels(["Phiếu gửi bếp", "Đóng", "In"]);
      n.seen(`Phiếu gửi bếp đơn #${origNo}. FR-10 không hiện giá: phiếu ${/\d{1,3}([.,]\d{3})+\s*(₫|đ)|\d+K\b/.test(doc) ? "CÓ chữ giống giá tiền" : "không có số tiền"}; nội dung "${doc.slice(0, 160)}"`);
      await n.shot("B05c-phieu-gui-bep");
    });
    await step("B06", "Đóng phiếu → tự về Sơ đồ bàn → bấm Tất cả nếu đang lọc Trống → B01 đang phục vụ, có tổng tiền, có trong Đơn đang mở", async (n) => {
      await closeReceipt(page);
      n.seen(`Sau khi đóng phiếu: màn gọi món ${await page.getByTestId("order-drawer").count() ? "vẫn mở" : "đã đóng, về sơ đồ"}`);
      n.seen(`Đang lọc Trống: B01 ${await page.getByTestId(`table-${ID.B01}`).count() ? "thấy" : "không thấy (đúng như lưu ý bước 6)"}`);
      await page.getByTestId("floor-filter-all").click(); await page.waitForTimeout(300);
      const t = page.getByTestId(`table-${ID.B01}`);
      n.seen(`Bấm Tất cả: B01 trạng thái "${await attr(t, "data-table-status")}", chữ trên ô "${await text(t)}"`);
      const card = page.locator('[data-testid^="floor-order-"]').filter({ hasText: "B01" });
      n.seen(`Đơn đang mở có B01: ${await card.count() ? `có — "${(await text(card)).slice(0, 70)}"` : "KHÔNG"}`);
      await n.labels(["Mở đơn hàng"]);
      await n.shot("B06-so-do-sau-gui");
    });
    await step("B07", "Bấm lại bàn (hoặc Mở đơn hàng) → Thanh toán → màn Thanh toán đơn hàng, đã chọn sẵn toàn bộ", async (n) => {
      await page.getByTestId(`table-${ID.B01}`).click();
      await page.getByTestId("order-drawer").waitFor(); await page.waitForTimeout(300);
      n.seen(`Nút ở màn đơn đã gửi: "${await text(page.getByTestId("submit-order-button-footer"))}"`);
      await page.getByTestId("submit-order-button-footer").click();
      await page.getByTestId("payment-drawer").waitFor(); await page.waitForTimeout(300);
      await n.labels(["Thanh toán đơn hàng", "Chọn tất cả", "Tiền khách đưa", "In hóa đơn sau khi thanh toán"]);
      n.seen(`"${await text(page.getByTestId("b03-title"))}" — "${await text(page.getByTestId("b03-meta"))}"; Chọn tất cả ${(await page.getByTestId("pay-select-all").isChecked()) ? "bật sẵn" : "TẮT"}; phải trả ${await due(page)}đ; In hóa đơn ${(await page.getByTestId("print-receipt-checkbox").isChecked()) ? "bật sẵn" : "tắt"}`);
      await n.shot("B07-thanh-toan");
    });
    await step("B08", "Tách đơn: bỏ Chọn tất cả, đánh dấu món, + (1/2 → 2/2 → 1/2), Thanh toán món đã chọn, Hoá đơn thanh toán, phần còn lại số mới", async (n) => {
      await page.getByTestId("pay-select-all").uncheck(); await page.waitForTimeout(200);
      const am = page.getByTestId("pay-item-line").filter({ hasText: "Americano" });
      await am.getByTestId("pay-item-checkbox").check(); await page.waitForTimeout(200);
      const seq = [await text(am.getByTestId("b03-quantity"))];
      for (let i = 0; i < 2; i++) { await am.getByTestId("pay-item-plus").click(); await page.waitForTimeout(150); seq.push(await text(am.getByTestId("b03-quantity"))); }
      n.seen(`Đánh dấu Americano rồi bấm + hai lần: ${seq.join(" → ")}`);
      await am.getByTestId("pay-item-plus").click(); await page.waitForTimeout(150);
      n.seen(`Ô Tiền khách đưa tự điền ${await received(page)}đ, phải trả ${await due(page)}đ; nút "${await text(page.getByTestId("pay-button-footer"))}"`);
      await n.labels(["Thanh toán món đã chọn"]);
      await n.shot("B08a-chon-mot-phan");
      await page.getByTestId("pay-button-footer").click();
      await page.getByTestId("receipt-preview").waitFor({ timeout: 10000 });
      splitNo = await attr(page.getByTestId("receipt-document"), "data-order-no");
      await n.labels(["Hoá đơn thanh toán", "Hóa đơn thanh toán"]);
      n.seen(`Hóa đơn phần vừa trả: #${splitNo} (đơn gốc #${origNo}), tổng ${await attr(page.getByTestId("receipt-document"), "data-total")}đ`);
      await n.shot("B08b-hoa-don-phan-dau");
      await closeReceipt(page);
      n.seen(`Màn thanh toán ${await page.getByTestId("payment-drawer").count() ? "vẫn mở" : "đóng"}: "${await text(page.getByTestId("b03-meta"))}"; "${await text(page.getByTestId("b03-selected-count"))}"`);
      const opened = await page.getByTestId("nav-report").click({ timeout: 2500 }).then(() => true).catch(() => false);
      n.seen(`Bấm Báo cáo khi màn thanh toán đang mở: ${opened ? "BẤM ĐƯỢC" : "không bấm được (đúng như runbook)"}`);
      await n.shot("B08c-phan-con-lai");
    });
    await step("B09", "Trả phần còn lại: Chọn tất cả, Tiền khách đưa, ⌫, nút nhanh, thiếu/đủ/dư, Hoàn tất thanh toán", async (n) => {
      await page.getByTestId("pay-select-all").check(); await page.waitForTimeout(200);
      const d = Number(await due(page));
      n.seen(`Chọn tất cả: phải trả ${d}đ, ô tiền tự điền ${await received(page)}đ`);
      await n.labels(["Đúng tiền", "+20k", "+50k", "200k", "500k"]);
      const del = page.getByTestId("payment-key-delete");
      n.seen(`Nút xóa ở hàng cuối bàn phím số: chữ trên nút "${await text(del)}", hình biểu tượng ${await del.locator("svg").count() ? "có" : "không"}, nhãn đọc màn hình "${await attr(del, "aria-label")}"; ở 1366×768 chưa cuộn: ${(await reachable(del)) ? "thấy ngay" : "bị khuất, phải cuộn"}`);
      const input = page.getByTestId("payment-received-amount");
      await input.click(); await page.keyboard.press("Control+A"); await page.keyboard.type(String(d - 25000)); await page.waitForTimeout(200);
      const pay = page.getByTestId("pay-button-footer");
      n.seen(`Gõ thẳng ${d - 25000} (thiếu): "${await text(page.getByTestId("b03-change"))}"; nút ${(await pay.isDisabled()) ? "bị khóa" : "BẤM ĐƯỢC"}; nút Đúng tiền ${await page.getByRole("button", { name: "Đúng tiền", exact: true }).count() ? "hiện" : "ẩn (như runbook ghi, chờ CX-02)"}`);
      await n.labels(["Còn thiếu"]);
      await n.shot("B09a-thieu-tien");
      await input.click(); await page.keyboard.press("Control+A"); await page.keyboard.type(String(d + 25000)); await page.waitForTimeout(200);
      n.seen(`Gõ ${d + 25000} (dư): "${await text(page.getByTestId("b03-change"))}"; nút ${(await pay.isDisabled()) ? "bị khóa" : "bấm được"}`);
      await n.labels(["Tiền trả lại khách", "Hoàn tất thanh toán"]);
      n.seen(`Nút cuối: "${await text(pay)}"`);
      await n.shot("B09b-du-tien");
      await pay.click();
    });
    await step("B10", "Hoá đơn thanh toán → Đóng → về Sơ đồ bàn, B01 trống, không còn trong Đơn đang mở", async (n) => {
      await page.getByTestId("receipt-preview").waitFor({ timeout: 10000 });
      const doc = page.getByTestId("receipt-document");
      lastNo = await attr(doc, "data-order-no");
      n.seen(`Hóa đơn #${lastNo}, tổng ${await attr(doc, "data-total")}đ, khách đưa ${await attr(doc, "data-received-amount")}đ, trả lại ${await attr(doc, "data-change-amount")}đ`);
      await n.shot("B10a-hoa-don-cuoi");
      await closeReceipt(page);
      const t = page.getByTestId(`table-${ID.B01}`);
      n.seen(`B01 "${await attr(t, "data-table-status")}", chữ "${await text(t)}"; Đơn đang mở còn B01: ${await page.locator('[data-testid^="floor-order-"]').filter({ hasText: "B01" }).count() ? "CÒN" : "không"}`);
      await n.shot("B10b-ban-trong");
    });
    await step("B11", "Lịch sử đơn: 2 đơn Đã thanh toán; Báo cáo: doanh thu tăng đúng, hàng Món bán chạy", async (n) => {
      await page.getByTestId("nav-order-history").click();
      await page.getByTestId("order-history-drawer").waitFor(); await page.waitForTimeout(600);
      const rows = await page.locator('[data-testid^="history-row-"][data-table-label="B01"]').evaluateAll((els) => els.map((e) => `${e.textContent.replace(/\s+/g, " ").trim().slice(0, 40)} [${e.dataset.status}, ${e.dataset.total}đ]`));
      n.seen(`Lịch sử, đơn B01: ${rows.join(" || ")}. Số trên hóa đơn: #${splitNo}, #${lastNo}`);
      n.seen(`FR-14 nút lọc trong Lịch sử: ${(await page.getByTestId("order-history-drawer").locator("header button, header select, [data-testid^='history-'] button").allInnerTexts()).map(clean).filter(Boolean).slice(0, 14).join(" | ")}`);
      await n.labels(["Lịch sử đơn", "Đã thanh toán"]);
      await n.shot("B11a-lich-su");
      await page.getByTestId("history-close-button").click(); await page.waitForTimeout(300);
      await page.getByTestId("nav-report").click();
      await page.getByTestId("report-summary").waitFor(); await page.waitForTimeout(500);
      n.seen(`Báo cáo trước: "${baseRev.slice(0, 70)}"; sau: "${(await text(page.getByTestId("report-summary"))).slice(0, 70)}"`);
      const rep = clean(await page.getByTestId("report").innerText());
      const after = (key, len) => [...rep.matchAll(new RegExp(key, "g"))].map((m) => `"${rep.slice(m.index, m.index + len)}"`).join(" / ");
      n.seen(`Các chỗ ghi Món bán chạy: ${after("Món bán chạy", 45)}`);
      n.seen(`Tóm tắt nhanh: ${after("Giờ cao điểm", 110)}`);
      await n.labels(["Báo cáo", "Món bán chạy"]);
      await n.shot("B11b-bao-cao");
    });
    await step("B12", "Hủy đơn đã thanh toán: Lịch sử → chọn đơn → Hủy đơn → Lý do khác cần ghi chú → Đã hủy, người/giờ, In lại bị khóa", async (n) => {
      await page.getByTestId("report-close-button").first().click(); await page.waitForTimeout(300);
      await page.getByTestId("nav-order-history").click();
      await page.getByTestId("order-history-drawer").waitFor(); await page.waitForTimeout(500);
      await page.locator('[data-testid^="history-row-"][data-table-label="B01"]').last().click(); await page.waitForTimeout(400);
      n.seen(`Nút hủy: "${await text(page.getByTestId("history-void-order"))}"`);
      await n.labels(["Hủy đơn"]);
      await page.getByTestId("history-void-order").click();
      n.seen(`Các lý do: ${(await page.getByTestId("history-void-reason").locator("option").allInnerTexts()).map(clean).join(" | ")}`);
      await page.getByTestId("history-void-reason").selectOption("other");
      n.seen(`Chọn Lý do khác, chưa ghi chú: nút xác nhận ${(await page.getByTestId("history-void-confirm").isDisabled()) ? "bị khóa" : "BẤM ĐƯỢC"}`);
      await n.shot("B12a-hop-huy");
      await page.getByTestId("history-void-note").fill("Khách đổi ý sau khi trả tiền");
      await page.getByTestId("history-void-confirm").click(); await page.waitForTimeout(800);
      n.seen(`Sau khi hủy: nhãn "${await text(page.getByTestId("history-status-badge"))}"; thông tin hủy "${(await text(page.getByTestId("history-void-info"))).slice(0, 100)}"; nút in lại ${(await page.getByTestId("history-reprint-button").isDisabled()) ? "bị khóa" : "BẤM ĐƯỢC"}`);
      await n.labels(["Lý do khác", "Đã hủy", "Đã huỷ"]);
      await n.shot("B12b-da-huy");
    });
    await step("B13", "Báo cáo: đơn hủy bị loại khỏi doanh thu, Đơn đã huỷ và Tiền hủy tăng", async (n) => {
      await page.getByTestId("history-close-button").click(); await page.waitForTimeout(300);
      await page.getByTestId("nav-report").click();
      const s = page.getByTestId("report-summary"); await s.waitFor(); await page.waitForTimeout(500);
      n.seen(`Doanh thu ${await attr(s, "data-revenue")}đ, đơn đã trả ${await attr(s, "data-paid-orders")}, đơn hủy ${await attr(s, "data-void-count")}, tiền hủy ${await attr(s, "data-void-amount")}đ`);
      await n.labels(["Đơn đã huỷ", "Đơn đã hủy", "Tiền hủy", "Tiền huỷ"]);
      await n.shot("B13-bao-cao-sau-huy");
    });
    await step("B14", "Phân quyền: Nhân viên → Thu ngân → bỏ payment.take → lưu → đăng nhập Thu ngân → tạo/sửa đơn được, không thanh toán được → khôi phục", async (n) => {
      await page.getByTestId("report-close-button").first().click(); await page.waitForTimeout(300);
      await page.getByTestId("nav-employees").click();
      await page.getByTestId(`employee-row-${ID.cashier[0]}`).click();
      const perm = page.getByTestId("permission-payment.take");
      n.seen(`Ô quyền thanh toán: chữ cạnh ô "${clean(await perm.evaluate((el) => (el.closest("label") || el.parentElement).innerText))}"; đang ${(await perm.isChecked()) ? "bật" : "tắt"}`);
      await perm.uncheck();
      await n.shot("B14a-bo-quyen");
      await page.getByTestId("save-employee-button").click(); await page.waitForTimeout(4500);
      await page.getByTestId("employees-close-button").click(); await page.waitForTimeout(300);
      await relogin(page, ID.cashier);
      n.seen(`Thanh trái của Thu ngân: ${(await navLabels(page)).join(", ")}`);
      await page.getByTestId(`table-${ID.B01}`).click();
      await page.getByTestId("order-drawer").waitFor(); await page.waitForTimeout(300);
      // Danh mục còn ở "Trà & trà sữa" từ bước 5, nên tìm món như runbook gợi ý ("Không thấy món thì gõ tên vào ô Tìm món").
      await page.getByTestId("b02-search").fill("Americano"); await page.waitForTimeout(300);
      await page.getByTestId(`menu-item-${ID.americano}`).locator(".add-label").click(); await page.waitForTimeout(200);
      await page.getByTestId("b02-search").fill("");
      await page.getByTestId("submit-order-button-footer").click();
      await page.getByTestId("receipt-preview").waitFor({ timeout: 10000 });
      n.seen(`Thu ngân thiếu quyền vẫn gửi được đơn: tổng ${await attr(page.getByTestId("receipt-document"), "data-total")}đ`);
      await page.getByTestId("receipt-close-header").click(); await page.waitForTimeout(300);
      await page.getByTestId(`table-${ID.B01}`).click();
      await page.getByTestId("order-drawer").waitFor(); await page.waitForTimeout(300);
      n.seen(`Mở lại đơn đã gửi: nút ở chân màn ${await page.getByTestId("submit-order-button-footer").count() ? `"${await text(page.getByTestId("submit-order-button-footer"))}"` : "không có nút Thanh toán"}; các nút: ${(await page.getByTestId("order-drawer").getByRole("button").allInnerTexts()).map(clean).filter(Boolean).slice(-6).join(" | ")}`);
      await n.shot("B14b-thu-ngan-khong-thanh-toan");
      await page.getByTestId("order-close-button").click(); await page.waitForTimeout(300);
      await relogin(page, ID.owner);
      await page.getByTestId("nav-employees").click();
      await page.getByTestId(`employee-row-${ID.cashier[0]}`).click();
      await page.getByTestId("permission-payment.take").check();
      await page.getByTestId("save-employee-button").click(); await page.waitForTimeout(4500);
      n.seen(`Khôi phục: quyền thanh toán của Thu ngân ${(await page.getByTestId("permission-payment.take").isChecked()) ? "đã bật lại" : "CHƯA bật"}`);
      await page.getByTestId("employees-close-button").click(); await page.waitForTimeout(300);
    });
    await step("B15", "Quản trị: Thực đơn, Sơ đồ cửa hàng, Cài đặt", async (n) => {
      await n.labels(["Thực đơn", "Sơ đồ cửa hàng", "Cài đặt"]);
      for (const [nav, drawer, file] of [["nav-menu-editor", "menu-editor", "B15a-thuc-don"], ["nav-floor-editor", "floor-editor", "B15b-so-do-cua-hang"], ["nav-settings", "settings-drawer", "B15c-cai-dat"]]) {
        await page.getByTestId(nav).click();
        await page.getByTestId(drawer).waitFor(); await page.waitForTimeout(500);
        const head = page.getByTestId(drawer).locator("header").first();
        const closeBtn = head.getByRole("button", { name: /^(Đóng|Thoát|Hủy|Huỷ)$/ }).first();
        n.seen(`${drawer}: đầu màn "${clean(await head.innerText()).slice(0, 80)}"; nút đóng ghi "${await text(closeBtn)}"`);
        await n.shot(file);
        await closeBtn.click(); await page.waitForTimeout(400);
        const discard = page.getByRole("button", { name: "Bỏ thay đổi" });
        if (await discard.count()) { n.seen(`${drawer}: hỏi bỏ thay đổi dù chưa sửa gì`); await discard.click(); await page.waitForTimeout(300); }
        await page.getByTestId(drawer).waitFor({ state: "hidden", timeout: 5000 });
      }
    });
    await step("B16", "Xóa dữ liệu mẫu: còn đơn mở thì bị chặn", async (n) => {
      n.seen(`Đơn đang mở lúc này: ${(await page.locator('[data-testid^="floor-order-"]').allInnerTexts()).map(clean).map((s) => s.slice(0, 20)).join(" | ")}`);
      await page.getByTestId("nav-settings").click();
      await page.getByTestId("settings-drawer").waitFor();
      await page.getByTestId("settings-drawer").getByTestId("settings-section-demo").click(); await page.waitForTimeout(300);
      n.seen(`Mục dữ liệu mẫu: nút "${await text(page.getByTestId("open-clear-demo"))}"`);
      await page.getByTestId("open-clear-demo").click();
      await page.getByTestId("clear-demo-dialog").waitFor(); await page.waitForTimeout(600);
      const blocked = await page.getByTestId("clear-demo-blocked").count();
      n.seen(`Hộp xóa dữ liệu mẫu: ${blocked ? "BỊ CHẶN vì còn đơn mở" : "không thấy trạng thái bị chặn"}; nội dung "${(await text(page.getByTestId("clear-demo-dialog"))).slice(0, 200)}"`);
      await n.shot("B16-xoa-du-lieu-mau");
    });
  });

  // T — FR-08 mang đi, cùng câu trả lời Q-N01-1 (đơn chỉ có khi gửi món lần đầu).
  await scenario(browser, "T-mang-di", { width: 1366, height: 768 }, async (page, step) => {
    const drawer = () => page.getByTestId("takeaway-drawer");
    const listText = async () => clean(await drawer().innerText()).slice(0, 220);
    await step("T1", "Mở Bán mang đi khi chưa có đơn", async (n) => {
      await login(page, ID.owner);
      await page.getByTestId("nav-takeaway").click();
      await drawer().waitFor(); await page.waitForTimeout(400);
      n.seen(`Màn: "${await listText()}"`);
      await n.shot("T1-chua-co-don");
    });
    await step("T2", "Tạo đơn mang đi, thêm món rồi đóng khi chưa gửi → Bỏ đơn", async (n) => {
      await drawer().getByRole("button", { name: "Tạo đơn mang đi" }).first().click();
      await page.getByTestId("order-drawer").waitFor(); await page.waitForTimeout(300);
      n.seen(`Màn mở: "${clean(await attr(page.getByTestId("b02-header"), "aria-label"))}"`);
      await page.getByTestId(`menu-item-${ID.americano}`).click(); await page.waitForTimeout(200);
      await page.getByTestId("order-close-button").click(); await page.waitForTimeout(400);
      n.seen(`Đóng khi chưa gửi: ${clean(await page.getByRole("dialog").last().innerText().catch(() => "không có hộp hỏi")).slice(0, 120)}`);
      await page.getByRole("button", { name: "Bỏ đơn" }).click().catch(() => {}); await page.waitForTimeout(400);
      await page.getByTestId("nav-takeaway").click(); await drawer().waitFor(); await page.waitForTimeout(400);
      n.seen(`Sau khi bỏ: "${await listText()}"`);
    });
    let no = null;
    await step("T3", "Tạo đơn mang đi, gửi món, quay lại danh sách", async (n) => {
      await drawer().getByRole("button", { name: "Tạo đơn mang đi" }).first().click();
      await page.getByTestId("order-drawer").waitFor(); await page.waitForTimeout(300);
      await page.getByTestId(`menu-item-${ID.americano}`).click(); await page.waitForTimeout(200);
      await page.getByTestId("submit-order-button-footer").click();
      await page.getByTestId("receipt-preview").waitFor({ timeout: 10000 });
      no = await attr(page.getByTestId("receipt-document"), "data-order-no");
      n.seen(`Gửi đơn mang đi #${no}: cửa sổ "${clean(await page.getByTestId("receipt-preview").innerText()).slice(0, 40)}"`);
      await closeReceipt(page);
      n.seen(`Sau khi đóng phiếu: ${await page.getByTestId("order-drawer").count() ? "màn gọi món vẫn mở" : await drawer().count() ? "về danh sách mang đi" : "về sơ đồ bàn"}`);
      if (!(await drawer().count())) { await page.getByTestId("nav-takeaway").click(); await drawer().waitFor(); await page.waitForTimeout(400); }
      n.seen(`Danh sách: "${await listText()}"`);
      await n.shot("T3-danh-sach-co-don");
    });
    await step("T4", "Bấm thẻ lọc Đã thanh toán và Hôm nay khi có một đơn đang mở", async (n) => {
      for (const chip of ["Đã thanh toán", "Hôm nay"]) {
        await drawer().getByRole("button", { name: chip, exact: true }).click(); await page.waitForTimeout(300);
        n.seen(`Thẻ ${chip}: "${await listText()}"`);
        await n.shot(`T4-the-${chip === "Hôm nay" ? "hom-nay" : "da-thanh-toan"}`);
      }
      await drawer().getByRole("button", { name: "Đang mở", exact: true }).click(); await page.waitForTimeout(300);
    });
    await step("T5", "Thanh toán đơn mang đi từ danh sách, xem lại danh sách và Lịch sử", async (n) => {
      await drawer().getByRole("button", { name: "Thanh toán", exact: true }).first().click();
      await page.getByTestId("payment-drawer").waitFor(); await page.waitForTimeout(300);
      no = (await text(page.getByTestId("b03-meta"))).match(/#(\d+)/)?.[1] ?? no;
      n.seen(`Màn thanh toán: "${await text(page.getByTestId("b03-meta"))}", phải trả ${await due(page)}đ`);
      await page.getByTestId("pay-button-footer").click();
      await page.getByTestId("receipt-preview").waitFor({ timeout: 10000 });
      await closeReceipt(page);
      n.seen(`Sau khi trả: ${await drawer().count() ? "về danh sách mang đi" : "về sơ đồ bàn"}; thông báo "${await toast(page)}"`);
      if (!(await drawer().count())) { await page.getByTestId("nav-takeaway").click(); await drawer().waitFor(); await page.waitForTimeout(400); }
      await drawer().getByRole("button", { name: "Đã thanh toán", exact: true }).click(); await page.waitForTimeout(300);
      n.seen(`Thẻ Đã thanh toán sau khi trả #${no}: "${await listText()}"; nút In lại ${await drawer().getByRole("button", { name: "In lại" }).count() ? "có" : "không thấy"}`);
      await n.shot("T5-sau-khi-tra");
      await drawer().getByRole("button", { name: "Đóng", exact: true }).first().click(); await page.waitForTimeout(300);
      await page.getByTestId("nav-order-history").click();
      await page.getByTestId("order-history-drawer").waitFor(); await page.waitForTimeout(600);
      n.seen(`Lịch sử, dòng đầu: "${clean(await page.locator('[data-testid^="history-row-"]').first().innerText()).slice(0, 80)}"`);
      await n.shot("T5-lich-su");
    });
  });

  // K — FR-01 tạo quán mới và FR-03 đổi PIN tạm (nhánh runbook ghi "chưa thử").
  await scenario(browser, "K-tao-quan", { width: 1366, height: 768 }, async (page, step) => {
    let pinTam = null;
    await step("K1", "Tạo quán mới: các ô trên màn", async (n) => {
      await page.getByTestId("landing-screen").waitFor({ timeout: 30000 });
      await page.getByTestId("go-create-store").click();
      await page.getByTestId("create-store-screen").waitFor(); await page.waitForTimeout(300);
      n.seen(`Màn: "${clean(await page.getByTestId("create-store-screen").innerText()).slice(0, 400)}"`);
      n.seen(`Ô dữ liệu mẫu: ${(await page.getByTestId("seed-demo-checkbox").isChecked()) ? "bật sẵn" : "tắt"}; nút Tạo ${(await page.getByTestId("create-store-button").isDisabled()) ? "bị khóa" : "bấm được"} khi chưa nhập`);
      await n.shot("K1-man-tao-quan");
    });
    await step("K2", "Nhập tên, xác nhận giữ Store Key, Tạo quán → kết quả (che Store Key và PIN)", async (n) => {
      await page.getByTestId("store-name-input").fill("Quán thử tuần 6");
      const ack = page.getByTestId("key-loss-acknowledgement");
      if (await ack.count()) await ack.check();
      await page.getByTestId("create-store-button").click();
      await page.getByTestId("create-store-result").waitFor({ timeout: 20000 });
      pinTam = clean(await page.getByTestId("result-admin-pin").textContent());
      const key = clean(await page.getByTestId("result-store-key").textContent());
      const raw = clean(await page.getByTestId("create-store-result").innerText());
      n.seen(`Kết quả (đã che): "${raw.replaceAll(pinTam, "[PIN]").replaceAll(key, "[STORE KEY]").slice(0, 300)}"`);
      n.seen(`PIN tạm hiện ${raw.split(pinTam).length - 1} lần trên màn; Store Key hiện ${raw.split(key).length - 1} lần`);
      // Che mọi chỗ có PIN hoặc Store Key trước khi chụp (chỉ đổi chữ trên trang đang chụp, không đổi dữ liệu).
      await page.evaluate(([a, b]) => { const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let t; while ((t = w.nextNode())) t.nodeValue = t.nodeValue.split(a).join("••••••").split(b).join("••••-••••••"); }, [pinTam, key]);
      await n.shot("K2-ket-qua-da-che");
      await page.getByTestId("acknowledge-store-key").click(); await page.waitForTimeout(600);
    });
    await step("K3", "Đăng nhập chủ quán bằng PIN tạm → bắt buộc đổi PIN → vào POS", async (n) => {
      const where = (await page.getByTestId("passcode-screen").count()) ? "màn chọn nhân viên" : (await page.getByTestId("required-pin-change-screen").count()) ? "màn Đổi PIN tạm" : "màn khác";
      n.seen(`Sau khi xác nhận đã lưu: về ${where}`);
      if (where === "màn chọn nhân viên") {
        n.seen(`Nhân viên: ${(await page.locator('[data-testid^="employee-"]').allInnerTexts()).map(clean).join(" | ")}`);
        await page.locator('[data-testid^="employee-"]').first().click();
        for (const d of pinTam) await page.getByTestId(`pin-${d}`).click();
        await page.getByTestId("unlock-button").click();
      }
      await page.getByTestId("required-pin-change-screen").waitFor({ timeout: 15000 });
      n.seen(`Màn đổi PIN: "${clean(await page.getByTestId("required-pin-change-screen").innerText()).slice(0, 200)}"`);
      await n.shot("K3a-doi-pin-tam");
      await page.getByTestId("required-new-pin").fill("246802");
      await page.getByTestId("required-confirm-pin").fill("246802");
      await page.getByTestId("complete-required-pin").click();
      await page.getByTestId("passcode-screen").or(page.getByTestId("floor-view")).first().waitFor({ timeout: 15000 }); await page.waitForTimeout(500);
      if (await page.getByTestId("passcode-screen").count()) {
        n.seen(`Sau khi đổi PIN: về màn chọn nhân viên, thông báo "${clean(await page.getByTestId("session-notice").innerText().catch(() => ""))}"; tên quán trên đầu màn "${clean(await page.locator("header").first().innerText()).slice(0, 40)}"`);
        await n.shot("K3b-dang-nhap-lai");
        await page.locator('[data-testid^="employee-"]').first().click();
        for (const d of "246802") await page.getByTestId(`pin-${d}`).click();
        await page.getByTestId("unlock-button").click();
      }
      await page.getByTestId("floor-view").waitFor({ timeout: 15000 }); await page.waitForTimeout(500);
      n.seen(`Vào POS bằng PIN mới: bàn trên sơ đồ ${(await tablesVisible(page)).length}; thanh trái ${(await navLabels(page)).join(", ")}`);
      await n.shot("K3c-vao-pos");
    });
  });

  // P — FR-02 Store Key sai và FR-04 vai Phục vụ.
  await scenario(browser, "P-phuc-vu", { width: 1366, height: 768 }, async (page, step) => {
    await step("P1", "Nhập Store Key sai", async (n) => {
      await page.getByTestId("landing-screen").waitFor({ timeout: 30000 });
      await page.getByTestId("go-store-pairing").click();
      await page.getByTestId("store-key-input").fill("0000-AAAAAA");
      await page.getByTestId("go-passcode").click(); await page.waitForTimeout(1200);
      n.seen(`Sau khi bấm Ghép thiết bị với key sai: ${await page.getByTestId("passcode-screen").count() ? "VÀO ĐƯỢC màn chọn nhân viên" : `ở lại, thông báo "${(await toast(page)) || clean(await page.getByTestId("store-pairing-screen").innerText()).slice(0, 160)}"`}`);
      await n.shot("P1-key-sai");
    });
    await step("P2", "Đăng nhập Phục vụ: thanh trái, mở đơn đã gửi, Bán mang đi", async (n) => {
      if (!(await page.getByTestId("passcode-screen").count())) {
        await page.getByTestId("store-key-input").fill(DEMO_KEY);
        await page.getByTestId("go-passcode").click();
      }
      await page.getByTestId("passcode-screen").waitFor();
      n.seen(`Màn chọn nhân viên (vào từ key ở P1): ${(await page.locator('[data-testid^="employee-"]').allInnerTexts()).map(clean).join(" | ")}`);
      await page.getByTestId(`employee-${ID.waiter[0]}`).click();
      for (const d of ID.waiter[1]) await page.getByTestId(`pin-${d}`).click();
      await page.getByTestId("unlock-button").click();
      await page.getByTestId("floor-view").waitFor(); await page.waitForTimeout(400);
      n.seen(`Thanh trái của Phục vụ: ${(await navLabels(page)).join(", ")}`);
      await page.locator('[data-testid^="floor-order-"]').first().click();
      await page.getByTestId("order-drawer").waitFor(); await page.waitForTimeout(300);
      n.seen(`Mở đơn đã gửi: các nút ${(await page.getByTestId("order-drawer").getByRole("button").allInnerTexts()).map(clean).filter(Boolean).slice(-5).join(" | ")}`);
      await n.shot("P2a-phuc-vu-mo-don");
      await page.getByTestId("order-close-button").click(); await page.waitForTimeout(300);
      await page.getByTestId("nav-takeaway").click();
      await page.getByTestId("takeaway-drawer").waitFor(); await page.waitForTimeout(300);
      n.seen(`Bán mang đi của Phục vụ: "${clean(await page.getByTestId("takeaway-drawer").innerText()).slice(0, 160)}"`);
      await n.shot("P2b-phuc-vu-mang-di");
    });
  });

  // O — NFR-04 màn dọc: trước đăng nhập, rồi đăng nhập ở màn ngang và xoay sang dọc.
  await scenario(browser, "O-man-doc", { width: 390, height: 844 }, async (page, step) => {
    const guide = async () => (await page.getByTestId("rotate-guidance").count()) && (await page.getByTestId("rotate-guidance").isVisible()) ? `có — "${clean(await page.getByTestId("rotate-guidance").innerText()).slice(0, 120)}"` : "không thấy";
    await step("O1", "Màn dọc 390×844 trước khi đăng nhập", async (n) => {
      await page.getByTestId("landing-screen").waitFor({ timeout: 30000 }); await page.waitForTimeout(500);
      n.seen(`Màn đầu ở màn dọc: hướng dẫn xoay ${await guide()}`);
      await n.shot("O1-man-dau-doc");
    });
    await step("O2", "Đăng nhập ở màn ngang 844×390 rồi xoay sang dọc, rồi xoay lại", async (n) => {
      await page.setViewportSize({ width: 844, height: 390 });
      await login(page, ID.owner);
      await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(600);
      n.seen(`Xoay dọc sau đăng nhập: hướng dẫn xoay ${await guide()}; sơ đồ bàn ${(await page.getByTestId("floor-view").isVisible()) ? "vẫn hiện" : "ẩn"}`);
      await n.shot("O2a-xoay-doc");
      await page.setViewportSize({ width: 844, height: 390 }); await page.waitForTimeout(600);
      n.seen(`Xoay lại ngang: sơ đồ bàn ${(await page.getByTestId("floor-view").isVisible()) ? "hiện lại" : "VẪN ẨN"}`);
      await n.shot("O2b-xoay-lai-ngang");
    });
  });

  await browser.close();
  writeFileSync(join(outDir, "ket-qua.json"), JSON.stringify({ runbook: "docs/demo-runbook.md tại docs e8a1810", source: "main cd35439 (src giống hệt, đã so mã băm)", base: baseURL, finishedAt: new Date().toISOString(), results }, null, 2), "utf8");
}

run().catch((e) => { console.error(e); process.exit(1); });
