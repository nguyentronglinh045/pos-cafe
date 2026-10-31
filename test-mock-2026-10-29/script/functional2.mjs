// Takeaway flow + missing-permission flow (fresh browser contexts).
import { chromium, newPage, shot, login } from "./lib.mjs";

const log = (id, ok, note) => console.log(`${ok === true ? "OK  " : ok === false ? "FAIL" : "INFO"} ${id} — ${note}`);
async function step(id, fn) { try { await fn(); } catch (e) { log(id, false, "lỗi script/thao tác: " + String(e.message || e).split("\n")[0].slice(0, 200)); } }
const browser = await chromium.launch();
const AMERICANO = "menu-item-80cfbd5a-a538-4da6-888d-2f732b7b8e2d";

// ---------- F4 Mang đi (Thu ngân) ----------
{
  const { page, consoleErrors } = await newPage(browser, 1366, 768);
  page.setDefaultTimeout(6000);
  await login(page, "Thu ngân", "111111");
  const occupied = () => page.locator('[data-testid^="table-"][data-table-status="occupied"]').count();
  const cards = () => page.locator('[data-testid^="floor-order-"], .takeaway-card, [data-testid*="takeaway-order"]');
  let before, orderNo;
  await step("F4-1 tạo đơn mang đi", async () => {
    before = await occupied();
    await page.getByTestId("nav-takeaway").click();
    await page.getByRole("button", { name: "Tạo đơn mang đi" }).click();
    await page.getByTestId("order-drawer").waitFor();
    await page.waitForTimeout(400);
    await shot(page, "F4-1-takeaway-new-order");
    const header = (await page.getByTestId("b02-header").textContent()).replace(/\s+/g, " ").trim();
    log("F4-1 tạo đơn mang đi", true, `màn đơn mở, header: "${header.slice(0, 80)}"`);
  });
  await step("F4-2 gửi đơn", async () => {
    await page.getByTestId(AMERICANO).click();
    await page.getByTestId("submit-order-button-footer").click();
    const r = page.getByTestId("receipt-document");
    await r.waitFor({ timeout: 8000 });
    orderNo = await r.getAttribute("data-order-no");
    log("F4-2 gửi đơn mang đi", true, `phiếu bếp total=${await r.getAttribute("data-total")} số đơn=${orderNo}`);
    await page.getByTestId("receipt-close-header").click();
    await page.waitForTimeout(4500);
  });
  await step("F4-3 danh sách + không chiếm bàn", async () => {
    if (!(await page.getByRole("button", { name: "Tạo đơn mang đi" }).isVisible().catch(() => false))) await page.getByTestId("nav-takeaway").click();
    await page.waitForTimeout(800);
    await shot(page, "F4-3-takeaway-list");
    const listText = (await page.locator("body").textContent()).replace(/\s+/g, " ");
    const m = listText.match(/(\d+) đơn đang mở/);
    log("F4-3 đơn mới trong danh sách đang mở", null, `tiêu đề: "${m ? m[0] : "?"}"; có Americano trong màn: ${/Americano/.test(listText)}`);
    await page.getByRole("button", { name: "Đóng" }).first().click();
    await page.waitForTimeout(500);
    const after = await occupied();
    log("F4-4 không chiếm bàn", before === after, `bàn đang phục vụ trước=${before}, sau=${after}`);
  });
  await step("F4-5 thanh toán mang đi", async () => {
    await page.getByTestId("nav-takeaway").click();
    await page.waitForTimeout(600);
    const card = page.locator("div").filter({ hasText: new RegExp(`#${orderNo}\\b`) }).filter({ has: page.getByRole("button", { name: "Thanh toán" }) }).last();
    await card.getByRole("button", { name: "Thanh toán" }).first().click();
    await page.getByTestId("payment-drawer").waitFor();
    await page.getByTestId("b03-quick-0").click();
    await page.getByTestId("pay-button-footer").click();
    await page.getByTestId("receipt-document").waitFor({ timeout: 8000 });
    await page.getByTestId("receipt-close-header").click();
    await page.waitForTimeout(4500);
    if (!(await page.getByRole("button", { name: "Tạo đơn mang đi" }).isVisible().catch(() => false))) await page.getByTestId("nav-takeaway").click();
    await page.waitForTimeout(800);
    await shot(page, "F4-5-takeaway-after-pay");
    const stillListed = await page.getByText(new RegExp(`#${orderNo}\\b`)).count();
    log("F4-5 đã thanh toán → rời danh sách đang mở", stillListed === 0, `đơn #${orderNo} còn trong tab "Đang mở": ${stillListed > 0}`);
    await page.getByRole("button", { name: "Đã thanh toán" }).click();
    await page.waitForTimeout(800);
    await shot(page, "F4-6-takeaway-paid-tab");
    log("F4-6 tab Đã thanh toán", null, `đơn #${orderNo} hiện trong tab "Đã thanh toán": ${(await page.getByText(new RegExp(`#${orderNo}\\b`)).count()) > 0}`);
    await page.getByRole("button", { name: "Đóng" }).first().click();
    await page.getByTestId("nav-order-history").click();
    await page.waitForTimeout(1200);
    await shot(page, "F4-7-history");
    log("F4-7 lịch sử đơn", null, `đơn #${orderNo} có trong Lịch sử: ${(await page.getByText(new RegExp(`#?${orderNo}\\b`)).count()) > 0}`);
  });
  console.log("CONSOLE ERRORS F4:", consoleErrors.length ? consoleErrors : "không có");
}

// ---------- F5 Thiếu quyền (Phục vụ) ----------
{
  const { page, consoleErrors } = await newPage(browser, 1366, 768);
  page.setDefaultTimeout(6000);
  await step("F5-1 đăng nhập Phục vụ", async () => {
    await page.goto("http://127.0.0.1:5175/");
    await page.getByTestId("landing-screen").or(page.getByTestId("passcode-screen")).first().waitFor({ timeout: 30000 });
    if (await page.getByTestId("landing-screen").isVisible()) {
      await page.getByTestId("go-store-pairing").click();
      await page.getByTestId("store-key-input").fill("0001-X8F3QA");
      await page.getByTestId("go-passcode").click();
    }
    await page.locator('[data-testid^="employee-"]').filter({ hasText: "Phục vụ" }).first().click();
    for (const d of "384729") await page.getByTestId(`pin-${d}`).click();
    await page.getByTestId("unlock-button").click();
    await page.waitForTimeout(2000);
    await shot(page, "F5-1-waiter-home");
    const floor = await page.getByTestId("floor-view").isVisible().catch(() => false);
    log("F5-1 Phục vụ vào sơ đồ", floor, floor ? "về màn Sơ đồ bàn" : "không thấy sơ đồ (xem ảnh F5-1, có thể bị yêu cầu đổi PIN)");
  });
  await step("F5-2 điều hướng", async () => {
    const nav = await page.locator('[data-testid^="nav-"]').evaluateAll(els => els.map(e => e.getAttribute("data-testid")));
    const forbidden = nav.filter(n => /order-history|report|menu-editor|employees|settings|floor-editor/.test(n));
    log("F5-2 không có lối vào thiếu quyền", forbidden.length === 0, `nav: ${nav.join(", ")}`);
  });
  await step("F5-3 mở đơn đang phục vụ", async () => {
    await page.locator('[data-testid^="table-"][data-table-status="occupied"]').filter({ hasText: "B02" }).first().click();
    await page.getByTestId("order-drawer").waitFor();
    await page.waitForTimeout(600);
    await shot(page, "F5-3-waiter-order");
    const btns = await page.getByTestId("order-drawer").locator("button:visible").evaluateAll(els => els.map(e => e.textContent.trim()).filter(Boolean));
    const hasPay = btns.some(b => /thanh toán/i.test(b));
    const hasVoid = btns.some(b => /hủy đơn|huỷ đơn/i.test(b));
    log("F5-3 không có Thanh toán / Hủy đơn", !hasPay && !hasVoid, `nút trong màn đơn: ${[...new Set(btns)].slice(0, 20).join(" | ")}`);
  });
  await step("F5-4 gọi thêm món", async () => {
    await page.getByTestId(AMERICANO).click();
    await page.waitForTimeout(300);
    await page.getByTestId("submit-order-button-footer").click();
    const r = page.getByTestId("receipt-document");
    await r.waitFor({ timeout: 8000 });
    log("F5-4 Phục vụ gửi món được", true, `phiếu bếp total=${await r.getAttribute("data-total")}`);
    await page.getByTestId("receipt-close-header").click();
    await page.waitForTimeout(4500);
  });
  await step("F5-5 mang đi của Phục vụ", async () => {
    const nav = page.getByTestId("nav-takeaway");
    if (!(await nav.count())) { log("F5-5 mang đi", null, "không có lối vào Bán mang đi"); return; }
    await nav.click();
    await page.waitForTimeout(800);
    await shot(page, "F5-5-waiter-takeaway");
    const btns = await page.locator("button:visible").evaluateAll(els => els.map(e => e.textContent.trim()).filter(Boolean));
    log("F5-5 mang đi của Phục vụ", !btns.some(b => /^Thanh toán$/.test(b)), `nút: ${[...new Set(btns)].slice(0, 20).join(" | ")}`);
  });
  console.log("CONSOLE ERRORS F5:", consoleErrors.length ? consoleErrors : "không có");
}
await browser.close();
