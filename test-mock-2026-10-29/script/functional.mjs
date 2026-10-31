// Functional pass over the 4 POS screens (mock mode), one viewport. Each step logs what was observed.
import { chromium, newPage, shot, login } from "./lib.mjs";

const results = [];
const log = (id, ok, note) => { results.push({ id, ok, note }); console.log(`${ok === true ? "OK  " : ok === false ? "FAIL" : "INFO"} ${id} — ${note}`); };
async function step(id, fn) { try { await fn(); } catch (e) { log(id, false, "lỗi script/thao tác: " + String(e.message || e).split("\n")[0].slice(0, 200)); } }
const attr = (loc, name) => loc.getAttribute(name, { timeout: 3000 });

const browser = await chromium.launch();
const W = 1366, H = 768;
let { page, consoleErrors, context } = await newPage(browser, W, H);
page.setDefaultTimeout(6000);
await login(page, "Thu ngân", "111111");
const tables = page.locator('[data-testid^="table-"]');

// ---------- F1 Sơ đồ bàn ----------
await step("F1-1 sơ đồ", async () => {
  await shot(page, "F1-1-floor");
  const info = await tables.evaluateAll(els => els.map(e => `${e.textContent.trim().slice(0, 30)}:${e.getAttribute("data-table-status")}:${e.getAttribute("data-order-total")}`));
  log("F1-1 sơ đồ", true, `${info.length} bàn: ${info.join(" | ")}`);
});
await step("F1-2 lọc", async () => {
  await page.getByTestId("floor-filter-occupied").click();
  await page.waitForTimeout(400);
  await shot(page, "F1-2-filter-occupied");
  const pressed = await attr(page.getByTestId("floor-filter-occupied"), "aria-pressed");
  log("F1-2 lọc", pressed === "true", `bộ lọc "Đang phục vụ" aria-pressed=${pressed} (xem ảnh F1-2 để thấy bàn nào được làm nổi bật)`);
  await page.getByTestId("floor-filter-all").click();
});
await step("F1-3 decor", async () => {
  const decor = page.locator('[data-testid^="decor-"]').first();
  const n = await page.locator('[data-testid^="decor-"]').count();
  await decor.click({ force: true });
  await page.waitForTimeout(600);
  const opened = await page.getByTestId("order-drawer").isVisible();
  log("F1-3 decor", !opened, `${n} vật trang trí; bấm vật đầu tiên → ${opened ? "MỞ đơn (sai)" : "không mở đơn"}`);
});
let emptyTableId = null;
await step("F1-4 bàn trống", async () => {
  const empty = page.locator('[data-testid^="table-"][data-table-status="empty"]').first();
  emptyTableId = await attr(empty, "data-testid");
  await empty.click();
  await page.getByTestId("order-drawer").waitFor({ timeout: 5000 });
  await page.waitForTimeout(500);
  await shot(page, "F1-4-order-new");
  log("F1-4 bàn trống", true, `bấm ${emptyTableId} → mở màn đơn mới`);
});

// ---------- F2 Gọi món ----------
const cartLines = page.getByTestId("order-cart-line");
await step("F2-1 món không tùy chọn", async () => {
  await page.getByTestId("menu-item-80cfbd5a-a538-4da6-888d-2f732b7b8e2d").click(); // Americano
  await page.waitForTimeout(400);
  const dialog = await page.getByTestId("b02-modifier-dialog").isVisible().catch(() => false);
  const n = await cartLines.count();
  log("F2-1 món không tùy chọn", !dialog && n === 1, `Americano: popup=${dialog}, số dòng giỏ=${n}`);
});
await step("F2-2 món có tùy chọn + hủy", async () => {
  await page.getByTestId("menu-item-3e43bb8c-198f-443f-83ab-18696983edaa").click(); // Cà phê sữa
  await page.getByTestId("b02-modifier-dialog").waitFor({ timeout: 3000 });
  await shot(page, "F2-2-modifier-dialog");
  const confirmDisabled = await page.getByTestId("modifier-confirm").isDisabled();
  log("F2-2 popup tùy chọn", true, `Cà phê sữa mở popup; nút xác nhận khi chưa chọn: ${confirmDisabled ? "khóa" : "bật"} (dữ liệu mock không có nhóm bắt buộc → không kiểm được ca "nhóm bắt buộc chưa chọn")`);
  await page.getByTestId("modifier-picker-close").click();
  await page.waitForTimeout(300);
  const n = await cartLines.count();
  log("F2-3 hủy không đổi giỏ", n === 1, `sau khi đóng popup, số dòng giỏ=${n}`);
});
await step("F2-4 chọn Size L", async () => {
  await page.getByTestId("menu-item-3e43bb8c-198f-443f-83ab-18696983edaa").click();
  await page.getByTestId("modifier-value-62ca9453-5d44-47f4-8f85-a943d526348d").click();
  await page.getByTestId("modifier-confirm").click();
  await page.waitForTimeout(400);
  const lines = await cartLines.evaluateAll(els => els.map(e => `${e.textContent.replace(/\s+/g, " ").trim().slice(0, 50)} q=${e.getAttribute("data-quantity")} unit=${e.getAttribute("data-unit-price")} total=${e.getAttribute("data-line-total")}`));
  const total = await attr(page.getByTestId("order-total-amount"), "data-amount");
  log("F2-4 thêm Cà phê sữa Size L", lines.length === 2 && total === "71000", `giỏ: ${lines.join(" / ")}; tổng=${total} (kỳ vọng 35.000 + 36.000 = 71.000)`);
  await shot(page, "F2-4-cart");
});
await step("F2-5 tăng/giảm số lượng", async () => {
  const line = cartLines.filter({ hasText: "Cà phê sữa" });
  await line.getByTestId("order-cart-increase").click();
  await line.getByTestId("order-cart-increase").click();
  await page.waitForTimeout(300);
  const q = await attr(line, "data-quantity"), t = await attr(line, "data-line-total");
  const total = await attr(page.getByTestId("order-total-amount"), "data-amount");
  log("F2-5 tăng số lượng", q === "3" && t === "108000" && total === "143000", `Cà phê sữa L q=${q} dòng=${t} tổng=${total} (kỳ vọng 3, 108.000, 143.000)`);
});
await step("F2-6 đóng khi còn nháp", async () => {
  await page.getByTestId("order-close-button").click();
  await page.waitForTimeout(400);
  const dlg = page.getByTestId("b02-discard-dialog");
  const visible = await dlg.isVisible();
  await shot(page, "F2-6-discard-dialog");
  const text = visible ? (await dlg.textContent()).replace(/\s+/g, " ").trim().slice(0, 160) : "";
  log("F2-6 hỏi xác nhận bỏ nháp", visible, `hộp xác nhận: "${text}"`);
  if (visible) {
    await dlg.getByRole("button", { name: /tiếp tục/i }).click();
    await page.waitForTimeout(300);
    const n = await cartLines.count();
    log("F2-7 Tiếp tục chỉnh sửa giữ nháp", n === 2, `số dòng giỏ sau khi chọn tiếp tục=${n}`);
  }
});
await step("F2-8 gửi đơn", async () => {
  await page.getByTestId("submit-order-button-footer").click();
  const r = page.getByTestId("receipt-document");
  await r.waitFor({ timeout: 8000 });
  await shot(page, "F2-8-kitchen-ticket");
  log("F2-8 gửi đơn → phiếu bếp", true, `phiếu variant=${await attr(r, "data-variant")} total=${await attr(r, "data-total")}`);
  await page.getByTestId("receipt-close-header").click();
  await page.waitForTimeout(4500);
  const t = page.getByTestId(emptyTableId);
  log("F2-9 bàn chuyển đang phục vụ", (await attr(t, "data-table-status")) === "occupied", `${emptyTableId}: status=${await attr(t, "data-table-status")} total=${await attr(t, "data-order-total")}`);
  await shot(page, "F2-9-floor-occupied");
});

// ---------- F3 Thanh toán ----------
const due = () => attr(page.getByTestId("payment-order-summary"), "data-amount-due");
const received = () => attr(page.getByTestId("payment-received-amount"), "data-amount");
await step("F3-1 mở thanh toán", async () => {
  await page.getByTestId(emptyTableId).click();
  await page.getByTestId("order-drawer").waitFor();
  await page.getByTestId("submit-order-button-footer").click();
  await page.getByTestId("payment-drawer").waitFor({ timeout: 5000 });
  await page.waitForTimeout(500);
  await shot(page, "F3-1-payment");
  const selAll = await page.getByTestId("pay-select-all").isChecked();
  log("F3-1 mặc định chọn tất cả", selAll && (await due()) === "143000", `chọn tất cả=${selAll}; phải trả=${await due()}; khách đưa ban đầu=${await received()}`);
});
await step("F3-2 phương thức", async () => {
  const methods = await page.locator('[data-testid^="b03-method-"], [data-testid^="payment-method-"]').evaluateAll(els => els.map(e => `${e.getAttribute("data-testid")}:${e.textContent.trim().slice(0, 20)}:disabled=${e.disabled || e.getAttribute("aria-disabled")}:pressed=${e.getAttribute("aria-pressed") ?? e.getAttribute("aria-checked")}`));
  log("F3-2 phương thức thanh toán", null, methods.join(" | ") || "không tìm thấy nút phương thức");
});
await step("F3-3 nút nhanh", async () => {
  const quick = await page.locator('[data-testid^="b03-quick-"]').evaluateAll(els => els.map(e => e.textContent.trim()));
  const vals = [];
  for (let i = 0; i < quick.length; i++) { await page.getByTestId(`b03-quick-${i}`).click(); await page.waitForTimeout(150); vals.push(`${quick[i]}→${await received()}`); }
  log("F3-3 nút tiền nhanh", null, `${vals.join(", ")} (spec R04: Đúng tiền=due, +20k=due+20.000, +50k=due+50.000, 200k/500k cố định)`);
  await shot(page, "F3-3-quick");
});
await step("F3-4 thiếu tiền", async () => {
  // Clear then type 152999
  for (let i = 0; i < 12; i++) await page.getByTestId("payment-key-delete").click();
  for (const d of "142999") await page.getByTestId(`payment-key-${d}`).click();
  await page.waitForTimeout(200);
  const warn = page.getByTestId("payment-insufficient-warning");
  const short = await warn.isVisible() ? await attr(warn, "data-shortfall") : "không hiện";
  const disabled = await page.getByTestId("pay-button-footer").isDisabled();
  await shot(page, "F3-4-insufficient");
  log("F3-4 thiếu 1đ bị chặn", short === "1" && disabled, `khách đưa=${await received()}, thiếu=${short}, nút thanh toán khóa=${disabled}`);
});
await step("F3-5 9 chữ số", async () => {
  for (let i = 0; i < 12; i++) await page.getByTestId("payment-key-delete").click();
  for (const d of "1234567891") await page.getByTestId(`payment-key-${d}`).click();
  log("F3-5 tối đa 9 chữ số", (await received()).length <= 9, `gõ 10 chữ số → khách đưa=${await received()}`);
});
await step("F3-6 bỏ chọn tất cả", async () => {
  await page.getByTestId("pay-select-all").uncheck();
  await page.waitForTimeout(300);
  const disabled = await page.getByTestId("pay-button-footer").isDisabled();
  await shot(page, "F3-6-nothing-selected");
  log("F3-6 không chọn món bị chặn", (await due()) === "0" && disabled, `phải trả=${await due()}, khách đưa=${await received()}, nút khóa=${disabled}`);
});
await step("F3-7 chọn từng dòng + xoay vòng", async () => {
  const line = page.getByTestId("pay-item-line").filter({ hasText: "Cà phê sữa" });
  await line.getByTestId("pay-item-checkbox").check();
  const s1 = `${await attr(line, "data-selected-quantity")}/${await attr(line, "data-line-quantity")}:${await due()}`;
  await line.getByTestId("pay-item-plus").click();
  const s2 = `${await attr(line, "data-selected-quantity")}/${await attr(line, "data-line-quantity")}:${await due()}`;
  await line.getByTestId("pay-item-plus").click();
  const s3 = `${await attr(line, "data-selected-quantity")}/${await attr(line, "data-line-quantity")}:${await due()}`;
  await line.getByTestId("pay-item-plus").click();
  const s4 = `${await attr(line, "data-selected-quantity")}/${await attr(line, "data-line-quantity")}:${await due()}`;
  log("F3-7 chọn dòng Cà phê sữa L ×3", s1 === "1/3:36000" && s2 === "2/3:72000" && s3 === "3/3:108000" && s4 === "1/3:36000", `tick→${s1}; +→${s2}; +→${s3}; +→${s4} (kỳ vọng 1→2→3→1)`);
  await shot(page, "F3-7-select-line");
});
await step("F3-8 trả một phần", async () => {
  await page.getByTestId("b03-quick-0").click();
  await page.getByTestId("pay-button-footer").click();
  const r = page.getByTestId("receipt-document");
  await r.waitFor({ timeout: 8000 });
  log("F3-8 hóa đơn tách", (await attr(r, "data-total")) === "36000", `hóa đơn tách total=${await attr(r, "data-total")} số=${await attr(r, "data-order-no")}`);
  await page.getByTestId("receipt-close-header").click();
  await page.waitForTimeout(800);
  const stillOpen = await page.getByTestId("payment-drawer").isVisible();
  const selAll = stillOpen ? await page.getByTestId("pay-select-all").isChecked() : null;
  await shot(page, "F3-8-after-split");
  log("F3-9 sau tách", stillOpen && selAll === false && (await due()) === "0", `drawer còn mở=${stillOpen}; chọn tất cả=${selAll}; phải trả=${stillOpen ? await due() : "-"}; tổng đơn nguồn=${stillOpen ? await attr(page.getByTestId("payment-order-total-value"), "data-amount").catch(() => "?") : "-"}`);
});
await step("F3-10 trả nốt", async () => {
  await page.getByTestId("pay-select-all").check();
  await page.waitForTimeout(200);
  const d = await due();
  for (let i = 0; i < 12; i++) await page.getByTestId("payment-key-delete").click();
  for (const k of "200000") await page.getByTestId(`payment-key-${k}`).click();
  const change = await page.getByTestId("payment-change-summary-value").textContent().catch(() => "?");
  await shot(page, "F3-10-change");
  log("F3-10 tiền thối", null, `phải trả=${d}; khách đưa=${await received()}; tiền thối hiển thị="${change.trim()}" (kỳ vọng ${200000 - Number(d)})`);
  await page.getByTestId("pay-button-footer").click();
  const r = page.getByTestId("receipt-document");
  await r.waitFor({ timeout: 8000 });
  await page.getByTestId("receipt-close-header").click();
  await page.waitForTimeout(4500);
  const t = page.getByTestId(emptyTableId);
  const drawer = await page.getByTestId("payment-drawer").isVisible();
  log("F3-11 trả hết → bàn trống", (await attr(t, "data-table-status")) === "empty" && !drawer, `drawer thanh toán mở=${drawer}; bàn status=${await attr(t, "data-table-status")} total=${await attr(t, "data-order-total")}`);
});

// ---------- F4 Mang đi ----------
await step("F4 mang đi", async () => {
  const before = await page.locator('[data-testid^="table-"][data-table-status="occupied"]').count();
  await page.getByTestId("nav-takeaway").click();
  await page.waitForTimeout(800);
  await shot(page, "F4-1-takeaway");
  const btns = await page.locator('[role="dialog"] button, [data-testid*="takeaway"] button').evaluateAll(els => els.map(e => (e.getAttribute("data-testid") || "") + ":" + e.textContent.trim().slice(0, 30)).filter(Boolean));
  log("F4-1 mở Bán mang đi", null, `nút: ${btns.slice(0, 15).join(" | ")}`);
  const create = page.getByRole("button", { name: /tạo|mới/i }).first();
  await create.click();
  await page.getByTestId("order-drawer").waitFor({ timeout: 5000 });
  await page.getByTestId("menu-item-80cfbd5a-a538-4da6-888d-2f732b7b8e2d").click();
  await page.getByTestId("submit-order-button-footer").click();
  await page.getByTestId("receipt-document").waitFor({ timeout: 8000 });
  await page.getByTestId("receipt-close-header").click();
  await page.waitForTimeout(4500);
  await shot(page, "F4-2-after-submit");
  if (!(await page.getByText(/mang đi/i).first().isVisible().catch(() => false))) await page.getByTestId("nav-takeaway").click();
  await page.waitForTimeout(800);
  await shot(page, "F4-3-takeaway-list");
  const after = await page.locator('[data-testid^="table-"][data-table-status="occupied"]').count();
  log("F4-2 không chiếm bàn", before === after, `số bàn đang phục vụ trước=${before}, sau=${after}`);
});

// ---------- F5 Thiếu quyền ----------
await step("F5 Phục vụ", async () => {
  await page.getByTestId("nav-lock").click();
  await page.getByTestId("passcode-screen").waitFor();
  await page.locator('[data-testid^="employee-"]').filter({ hasText: "Phục vụ" }).first().click();
  for (const d of "384729") await page.getByTestId(`pin-${d}`).click();
  await page.getByTestId("unlock-button").click();
  await page.waitForTimeout(1500);
  await shot(page, "F5-1-waiter-home");
  const pinChange = await page.getByText(/đổi PIN|PIN mới/i).first().isVisible().catch(() => false);
  if (pinChange) { log("F5-1 Phục vụ đăng nhập", null, "app yêu cầu đổi PIN lần đầu — dừng ca quyền ở đây"); return; }
  const nav = await page.locator('[data-testid^="nav-"]').evaluateAll(els => els.map(e => e.getAttribute("data-testid")));
  log("F5-1 điều hướng Phục vụ", !nav.some(n => /order-history|report|menu-editor|employees|settings/.test(n)), `nav hiện: ${nav.join(", ")}`);
  const occ = page.locator('[data-testid^="table-"][data-table-status="occupied"]').first();
  if (await occ.count()) {
    await occ.click();
    await page.getByTestId("order-drawer").waitFor({ timeout: 5000 });
    await page.waitForTimeout(500);
    await shot(page, "F5-2-waiter-order");
    const footer = await page.getByTestId("submit-order-button-footer").textContent().catch(() => "(không có nút chính)");
    log("F5-2 đơn của Phục vụ", null, `nút chính ở footer: "${footer.trim()}"`);
  } else log("F5-2 đơn của Phục vụ", null, "không còn bàn đang phục vụ để mở");
});

console.log("CONSOLE ERRORS:", consoleErrors.length ? consoleErrors : "không có");
await browser.close();
