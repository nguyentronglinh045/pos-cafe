// Chạy 8 ca N01 r02 trên bản demo mock, ghi từng bước: quan sát + trạng thái + ảnh.
// Chạy: node run-n01.mjs <projectDir> <outDir> [baseURL]
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
  B02: "a254abd0-b883-4d5c-85c1-89f660409e02",
  americano: "80cfbd5a-a538-4da6-888d-2f732b7b8e2d",
  caPheSua: "3e43bb8c-198f-443f-83ab-18696983edaa",
  groupSize: "054f9798-4ba4-49f3-8e40-8ca109eeb95e",
  sizeM: "a5f986a6-ea67-4dd3-866e-42a0be8a0497",
};
const VIEWPORT = { width: 1366, height: 768 };
const results = [];

async function login(page, [employeeId, pin]) {
  await page.getByTestId("landing-screen").or(page.getByTestId("passcode-screen")).first().waitFor({ timeout: 30000 });
  if (await page.getByTestId("landing-screen").isVisible()) {
    await page.getByTestId("go-store-pairing").click();
    await page.getByTestId("store-key-input").fill("0001-X8F3QA");
    await page.getByTestId("go-passcode").click();
  }
  await page.getByTestId("passcode-screen").waitFor();
  await page.getByTestId(`employee-${employeeId}`).click();
  for (const d of pin) await page.getByTestId(`pin-${d}`).click();
  await page.getByTestId("unlock-button").click();
  await page.getByTestId("floor-view").waitFor();
  await page.mouse.move(-1, -1);
  await page.locator(':root:not(:has([data-rht-toaster] > div)) [data-testid="floor-view"]').waitFor({ timeout: 15000 });
}
async function relogin(page, who) {
  await page.getByTestId("nav-lock").click();
  await login(page, who);
}
async function openTable(page, id) {
  const t = page.getByTestId(`table-${id}`);
  await t.scrollIntoViewIfNeeded();
  await t.click();
  await page.getByTestId("order-drawer").waitFor();
  await page.waitForTimeout(300);
}
const text = async (loc) => ((await loc.textContent()) ?? "").replace(/\s+/g, " ").trim();
const attr = (loc, name) => loc.getAttribute(name);
async function closeReceipt(page) {
  await page.getByTestId("receipt-close-header").click();
  await page.getByTestId("receipt-preview").waitFor({ state: "detached", timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(300);
}
async function openPayment(page) {
  await openTable(page, ID.B02);
  await page.getByTestId("submit-order-button-footer").click();
  await page.getByTestId("payment-drawer").waitFor();
  await page.waitForTimeout(300);
}
const due = (page) => attr(page.getByTestId("payment-order-summary"), "data-amount-due");
const received = (page) => attr(page.getByTestId("payment-received-amount"), "data-amount");

const only = process.env.N01_ONLY ? process.env.N01_ONLY.split(",") : null;
async function runCase(browser, caseId, title, fn) {
  if (only && !only.includes(caseId)) return;
  const dir = join(outDir, caseId);
  mkdirSync(dir, { recursive: true });
  const context = await browser.newContext({ baseURL, viewport: VIEWPORT, deviceScaleFactor: 1, locale: "vi-VN" });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 200)));
  const steps = [];
  const step = async (id, expected, body) => {
    const rec = { id, expected, observed: "", status: "CHƯA CHẠY", shot: `${caseId}/${id}.png` };
    try {
      const r = await body();
      Object.assign(rec, r);
    } catch (e) {
      rec.status = "CHƯA CHẠY";
      rec.observed = `Không thực hiện được: ${String(e.message || e).split("\n")[0].slice(0, 220)}`;
    }
    await page.mouse.move(-1, -1);
    await page.screenshot({ path: join(dir, `${id}.png`) }).catch(() => {});
    steps.push(rec);
  };
  await page.goto("/");
  await fn(page, step);
  results.push({ caseId, title, steps, pageErrors: errors });
  console.log(`${caseId}: ${steps.map((s) => `${s.id}=${s.status}`).join(" ")}`);
  await context.close();
}

async function run() {
  mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ channel: "chrome", headless: true });

  // N01-01 — Sơ đồ bàn (Cashier)
  await runCase(browser, "N01-01", "Sơ đồ bàn", async (page, step) => {
    await step("B1", "Màn đầu tiên là Sơ đồ bàn", async () => {
      await login(page, ID.cashier);
      const role = await attr(page.getByTestId("left-nav-session"), "data-role");
      const drawers = await page.locator('[data-testid$="-drawer"]').count();
      const ok = (await page.getByTestId("floor-view").isVisible()) && drawers === 0;
      return { observed: `Đăng nhập vai ${role}; màn Sơ đồ bàn hiện, không có màn nào khác mở đè.`, status: ok ? "ĐÚNG" : "LỖI" };
    });
    await step("B2", "Sơ đồ hiện bàn và vật trang trí của Tầng 1", async () => {
      const area = page.getByRole("button", { name: "Tầng trệt", exact: true });
      const wasSelected = await attr(area, "aria-pressed");
      await area.click(); await page.waitForTimeout(300);
      const tables = await page.locator("[data-table-status]").evaluateAll((els) => els.map((e) => e.textContent.trim().slice(0, 3)));
      const decor = await page.locator('[data-testid^="decor-"]').count();
      return { observed: `Khu "Tầng trệt" (đang được chọn sẵn trước khi bấm: ${wasSelected}); hiện ${tables.length} bàn (${tables.join(", ")}) và ${decor} vật trang trí.`, status: tables.includes("B01") && tables.includes("B02") && decor > 0 ? "ĐÚNG" : "LỖI" };
    });
    await step("B3", "Bàn 1 trống; Bàn 2 đang phục vụ kèm 'số đơn' và tổng tiền 125.000đ", async () => {
      const b1 = page.getByTestId(`table-${ID.B01}`), b2 = page.getByTestId(`table-${ID.B02}`);
      const s1 = await attr(b1, "data-table-status"), s2 = await attr(b2, "data-table-status");
      const total2 = await attr(b2, "data-order-total"), t2 = await text(b2);
      return { observed: `B01: trạng thái "${s1}". B02: trạng thái "${s2}", chữ trên bàn "${t2}", tổng ${total2}đ; trên bàn không có số thứ tự đơn hay số lượng đơn.`, status: s1 === "empty" && s2 === "occupied" && total2 === "125000" ? "ĐÚNG một phần — 'số đơn' CHƯA KẾT LUẬN (Q-N01-5)" : "LỖI" };
    });
    await step("B4", "Chọn bộ lọc 'đang phục vụ': chỉ Bàn 2 được làm nổi bật", async () => {
      await page.getByTestId("floor-filter-occupied").click(); await page.waitForTimeout(400);
      const visible = await page.locator("[data-table-status]").evaluateAll((els) => els.map((e) => `${e.textContent.trim().slice(0, 3)}(${e.dataset.tableStatus},${e.dataset.orderTotal ?? "?"})`));
      const all = await text(page.getByTestId("floor-view").locator(".floor-footer, footer").first()).catch(() => "");
      return { observed: `Sau khi lọc chỉ còn ${visible.length} bàn trên sơ đồ: ${visible.join(", ")}. Bàn không khớp bị ẩn khỏi sơ đồ (không phải làm nổi bật). ${all}`, status: "LỖI so với expected (ẩn thay vì làm nổi bật, S02 L035)" };
    });
    await page.getByTestId("floor-filter-all").click().catch(() => {});
    await step("B5", "Bấm vật trang trí: không mở đơn nào", async () => {
      const decor = page.locator('[data-testid^="decor-"]').first();
      const decorId = await attr(decor, "data-testid");
      await decor.click({ force: true }); await page.waitForTimeout(800);
      const opened = await page.getByTestId("order-drawer").count();
      return { observed: `Bấm ${decorId}: ${opened ? "có màn đơn mở" : "không có màn đơn nào mở"}.`, status: opened ? "LỖI" : "ĐÚNG" };
    });
    await step("B6", "Bấm Bàn 1: mở màn tạo đơn mới cho Bàn 1", async () => {
      await openTable(page, ID.B01);
      const header = await text(page.getByTestId("b02-header"));
      return { observed: `Màn đơn mở, đầu màn: "${header.slice(0, 80)}".`, status: /Bàn B01/.test(header) && /Đơn mới/.test(header) ? "ĐÚNG" : "LỖI" };
    });
  });

  // N01-02 — Gọi món: nhóm bắt buộc (dựng dữ liệu bằng vai Chủ quán, chạy bằng Cashier)
  await runCase(browser, "N01-02", "Gọi món — nhóm bắt buộc", async (page, step) => {
    await step("CB", "Chuẩn bị dữ liệu: nhóm Size của Cà phê sữa là bắt buộc", async () => {
      await login(page, ID.owner);
      await page.getByTestId("nav-menu-editor").click();
      await page.getByTestId(`menu-edit-card-${ID.caPheSua}`).locator("strong").first().click();
      await page.getByTestId(`edit-group-${ID.groupSize}`).click();
      await page.getByRole("button", { name: "Không bắt buộc", exact: true }).click();
      const now = await page.getByRole("button", { name: "Bắt buộc chọn", exact: true }).count();
      await page.locator("h3", { hasText: "Sửa nhóm tuỳ chọn" }).locator("xpath=../button").click();
      await page.getByTestId("save-menu-button").click();
      await page.getByTestId("menu-dirty-badge").waitFor({ state: "detached", timeout: 8000 }).catch(() => {});
      await page.waitForTimeout(800);
      const badge = await page.getByTestId(`menu-edit-card-${ID.caPheSua}`).count() ? await page.locator("span", { hasText: /^Bắt buộc$/ }).count() : 0;
      await page.getByRole("button", { name: "Thoát" }).click();
      await page.getByTestId("floor-view").waitFor();
      await page.waitForTimeout(500);
      await relogin(page, ID.cashier);
      return { observed: `Vai Chủ quán vào Thực đơn → Cà phê sữa → Sửa nhóm "Size" → bấm "Không bắt buộc" thành "Bắt buộc chọn" (${now ? "đã đổi" : "chưa đổi"}) → Lưu (nhãn "Bắt buộc" hiện ở nhóm: ${badge ? "có" : "không"}) → Thoát. Sau đó khóa, đăng nhập lại vai Thu ngân.`, status: now ? "ĐÃ CHUẨN BỊ" : "LỖI CHUẨN BỊ" };
    });
    await step("B1", "Mở đơn 24 của Bàn 2", async () => {
      await openTable(page, ID.B02);
      const header = await text(page.getByTestId("b02-header")), total = await attr(page.getByTestId("order-total-amount"), "data-amount");
      return { observed: `Đầu màn: "${header.slice(0, 70)}"; tổng ${total}đ.`, status: /#24/.test(header) && total === "125000" ? "ĐÚNG" : "LỖI" };
    });
    await step("B2", "Americano vào giỏ ngay, không mở hộp thoại tùy chọn", async () => {
      const before = await page.getByTestId("order-cart-line").count();
      await page.getByTestId(`menu-item-${ID.americano}`).click(); await page.waitForTimeout(400);
      const dialog = await page.getByTestId("b02-modifier-dialog").count();
      const after = await page.getByTestId("order-cart-line").count(), total = await attr(page.getByTestId("order-total-amount"), "data-amount");
      return { observed: `Hộp thoại tùy chọn: ${dialog ? "có mở" : "không mở"}; số dòng giỏ ${before} → ${after}; tổng ${total}đ.`, status: !dialog && after === before + 1 ? "ĐÚNG" : "LỖI" };
    });
    const linesAfterB2 = await page.getByTestId("order-cart-line").count().catch(() => -1);
    await step("B3", "Bấm Cà phê sữa, chưa chọn: hộp thoại mở, nút thêm bị khóa", async () => {
      await page.getByTestId(`menu-item-${ID.caPheSua}`).click();
      await page.getByTestId("b02-modifier-dialog").first().waitFor();
      const disabled = await page.getByTestId("modifier-confirm").isDisabled();
      const dlg = await text(page.getByTestId("b02-modifier-dialog").first());
      return { observed: `Hộp thoại mở ("${dlg.slice(0, 90)}…"); nút "Thêm vào đơn" ${disabled ? "bị khóa" : "bấm được"}.`, status: disabled ? "ĐÚNG" : "LỖI" };
    });
    await step("B4", "Bấm Hủy: hộp thoại đóng, giỏ không đổi so với sau B2", async () => {
      const cancel = await page.getByTestId("b02-modifier-dialog").first().getByRole("button", { name: /Hủy|Huỷ/ }).count();
      await page.getByTestId("modifier-picker-close").click(); await page.waitForTimeout(400);
      const open = await page.getByTestId("b02-modifier-dialog").count();
      const lines = await page.getByTestId("order-cart-line").count(), total = await attr(page.getByTestId("order-total-amount"), "data-amount");
      return { observed: `Hộp thoại ${cancel ? "có" : "KHÔNG có"} nút chữ "Hủy"; đã dùng nút đóng (X, tên "Đóng"). Sau khi đóng: hộp thoại ${open ? "vẫn mở" : "đã đóng"}; giỏ ${lines} dòng (sau B2: ${linesAfterB2}), tổng ${total}đ.`, status: !open && lines === linesAfterB2 ? (cancel ? "ĐÚNG" : "ĐÚNG (dùng nút Đóng thay cho Hủy)") : "LỖI" };
    });
    await step("B5", "Chọn giá trị hợp lệ: nút thêm mở khóa; dòng Cà phê sữa vào giỏ, hiện tùy chọn", async () => {
      await page.getByTestId(`menu-item-${ID.caPheSua}`).click();
      await page.getByTestId("b02-modifier-dialog").first().waitFor();
      await page.getByTestId(`modifier-value-${ID.sizeM}`).click();
      const enabled = await page.getByTestId("modifier-confirm").isEnabled();
      await page.getByTestId("modifier-confirm").click(); await page.waitForTimeout(400);
      const lines = await page.getByTestId("order-cart-line").evaluateAll((els) => els.map((e) => e.textContent.replace(/\s+/g, " ").trim().slice(0, 60)));
      const last = lines[lines.length - 1] ?? "";
      return { observed: `Sau khi chọn "Size M": nút thêm ${enabled ? "mở khóa" : "vẫn khóa"}. Dòng cuối giỏ: "${last}".`, status: enabled && /Cà phê sữa/.test(last) && /Size M/.test(last) ? "ĐÚNG" : "LỖI" };
    });
  });

  // N01-03 — Đóng đơn khi còn nháp (Cashier)
  await runCase(browser, "N01-03", "Gọi món — đóng khi còn nháp", async (page, step) => {
    await login(page, ID.cashier);
    await step("B1", "Mở đơn 24 của Bàn 2", async () => {
      await openTable(page, ID.B02);
      return { observed: `Tổng ${await attr(page.getByTestId("order-total-amount"), "data-amount")}đ.`, status: "ĐÚNG" };
    });
    await step("B2", "Giỏ có Americano, tổng nháp 160.000đ", async () => {
      await page.getByTestId(`menu-item-${ID.americano}`).click(); await page.waitForTimeout(300);
      const total = await attr(page.getByTestId("order-total-amount"), "data-amount");
      return { observed: `Tổng sau khi thêm Americano: ${total}đ.`, status: total === "160000" ? "ĐÚNG" : "LỖI" };
    });
    await step("B3", "Bấm đóng: hiện hộp xác nhận 'Bỏ đơn chưa gửi?'", async () => {
      await page.getByTestId("order-close-button").click();
      const ok = await page.getByText("Bỏ đơn chưa gửi?", { exact: true }).isVisible().catch(() => false);
      const btns = await page.getByRole("dialog").last().getByRole("button").allTextContents().catch(() => []);
      return { observed: `Hộp xác nhận ${ok ? 'hiện "Bỏ đơn chưa gửi?"' : "không hiện"}; các nút: ${btns.map((b) => `"${b.trim()}"`).join(", ")}.`, status: ok ? "ĐÚNG" : "LỖI" };
    });
    await step("B4", "Chọn 'Tiếp tục chỉnh sửa': vẫn ở màn đơn, nháp giữ (160.000đ)", async () => {
      await page.getByRole("button", { name: "Tiếp tục chỉnh sửa" }).click(); await page.waitForTimeout(300);
      const open = await page.getByTestId("order-drawer").isVisible(), total = await attr(page.getByTestId("order-total-amount"), "data-amount");
      return { observed: `Màn đơn ${open ? "vẫn mở" : "đã đóng"}; tổng ${total}đ.`, status: open && total === "160000" ? "ĐÚNG" : "LỖI" };
    });
    await step("B5", "Đóng lần nữa, chọn bỏ nháp: thay đổi chưa gửi bị bỏ", async () => {
      await page.getByTestId("order-close-button").click();
      await page.getByRole("button", { name: "Bỏ đơn", exact: true }).click(); await page.waitForTimeout(500);
      const closed = (await page.getByTestId("order-drawer").count()) === 0;
      await openTable(page, ID.B02);
      const total = await attr(page.getByTestId("order-total-amount"), "data-amount");
      return { observed: `Nút bỏ tên "Bỏ đơn". Sau khi bấm: màn đơn ${closed ? "đóng" : "vẫn mở"} (Q-N01-4). Mở lại Bàn 2: tổng ${total}đ, không còn Americano.`, status: total === "125000" ? "ĐÚNG" : "LỖI" };
    });
  });

  // N01-04 — Thanh toán đủ, tiền mặt (Cashier)
  await runCase(browser, "N01-04", "Thanh toán — trả đủ", async (page, step) => {
    await login(page, ID.cashier);
    await step("B1", "Mở đơn 24, bấm Thanh toán", async () => {
      await openPayment(page);
      return { observed: `Màn thanh toán mở: "${(await text(page.getByTestId("b03-meta"))).slice(0, 60)}".`, status: "ĐÚNG" };
    });
    await step("B2", "Mặc định chọn tất cả; phải trả 125.000đ", async () => {
      const all = await page.getByTestId("pay-select-all").isChecked(), d = await due(page);
      return { observed: `"Chọn tất cả": ${all ? "bật" : "tắt"}; phải trả ${d}đ; ${await text(page.getByTestId("b03-selected-count"))}.`, status: all && d === "125000" ? "ĐÚNG" : "LỖI" };
    });
    await step("B3", "Bấm Thẻ (hoặc QR): không được chọn, vẫn tiền mặt", async () => {
      const card = page.getByTestId("b03-method-card"), qr = page.getByTestId("b03-method-qr");
      const cardDisabled = await card.isDisabled(), qrDisabled = await qr.isDisabled();
      await card.click({ force: true, timeout: 2000 }).catch(() => {});
      const cashActive = await page.getByTestId("b03-method-cash").evaluate((e) => e.classList.contains("active"));
      const cardActive = await card.evaluate((e) => e.classList.contains("active"));
      return { observed: `Nút Thẻ ${cardDisabled ? "bị vô hiệu" : "bấm được"}, QR ${qrDisabled ? "bị vô hiệu" : "bấm được"}; sau khi bấm Thẻ: Tiền mặt ${cashActive ? "vẫn đang chọn" : "không còn chọn"}, Thẻ ${cardActive ? "được chọn" : "không được chọn"}.`, status: cashActive && !cardActive ? "ĐÚNG" : "LỖI" };
    });
    await step("B4", "Bấm '200k': khách đưa 200.000đ, trả lại 75.000đ", async () => {
      await page.getByTestId("b03-quick-3").click(); await page.waitForTimeout(200);
      const r = await received(page), change = await text(page.getByTestId("payment-change-summary-value"));
      return { observed: `Khách đưa ${r}đ; tiền trả lại "${change}".`, status: r === "200000" && /75\.000/.test(change) ? "ĐÚNG" : "LỖI" };
    });
    await step("B5", "'+20k' đặt 145.000đ; '200k' đặt lại 200.000đ", async () => {
      await page.getByTestId("b03-quick-1").click(); await page.waitForTimeout(200);
      const r1 = await received(page);
      await page.getByTestId("b03-quick-3").click(); await page.waitForTimeout(200);
      const r2 = await received(page);
      return { observed: `Sau "+20k": ${r1}đ; sau "200k": ${r2}đ.`, status: r1 === "145000" && r2 === "200000" ? "ĐÚNG" : "LỖI" };
    });
    await step("B6", "Hoàn tất: màn thanh toán đóng; Bàn 2 trống; Lịch sử: đơn 24 đã thanh toán", async () => {
      await page.getByTestId("pay-button-footer").click();
      await page.getByTestId("receipt-document").waitFor();
      const payOpen = await page.getByTestId("payment-drawer").count(), bill = await attr(page.getByTestId("receipt-document"), "data-order-no");
      await closeReceipt(page);
      const s2 = await attr(page.getByTestId(`table-${ID.B02}`), "data-table-status");
      await page.getByTestId("nav-order-history").click(); await page.getByTestId("order-history-drawer").waitFor(); await page.waitForTimeout(500);
      const rows = await page.locator('[data-testid^="history-row-"][data-table-label="B02"]').evaluateAll((els) => els.map((e) => `${e.dataset.total}đ/${e.dataset.status}`));
      return { observed: `Sau khi bấm hoàn tất: màn thanh toán ${payOpen ? "vẫn mở" : "đóng"}, hiện hóa đơn số ${bill} (vì ô "In hóa đơn sau khi thanh toán" bật sẵn). Bàn B02: "${s2}". Lịch sử, các đơn bàn B02: ${rows.join(", ")}.`, status: !payOpen && s2 === "empty" && rows.includes("125000đ/paid") ? "ĐÚNG" : "LỖI" };
    });
  });

  // N01-05 — Thiếu tiền, không chọn món (Cashier)
  await runCase(browser, "N01-05", "Thanh toán — thiếu tiền / không chọn", async (page, step) => {
    await login(page, ID.cashier);
    await step("B1", "Mở thanh toán đơn 24: chọn tất cả, phải trả 125.000đ", async () => {
      await openPayment(page);
      return { observed: `Phải trả ${await due(page)}đ; ô khách đưa ban đầu: ${await received(page)}đ.`, status: (await due(page)) === "125000" ? "ĐÚNG" : "LỖI" };
    });
    await step("B2", "Xóa hết, nhập 124999 bằng bàn phím số: hiển thị thiếu 1đ", async () => {
      let n = 0;
      while ((await received(page)) !== "0" && n < 12) { await page.getByTestId("payment-key-delete").click(); n++; }
      for (const k of "124999") await page.getByTestId(`payment-key-${k}`).click();
      const r = await received(page);
      const warn = page.getByTestId("payment-insufficient-warning");
      const w = (await warn.count()) ? await text(warn) : "(không có cảnh báo)";
      return { observed: `Bấm xóa ${n} lần; nhập xong khách đưa ${r}đ; cảnh báo: "${w}".`, status: r === "124999" && /thiếu 1/.test(w) ? "ĐÚNG" : "LỖI" };
    });
    await step("B3", "Bấm hoàn tất: nút bị khóa (vẫn hiện, kèm lý do); không ghi lệnh; đơn vẫn mở", async () => {
      const btn = page.getByTestId("pay-button-footer");
      const vis = await btn.isVisible(), dis = await btn.isDisabled(), title = await attr(btn, "title");
      await btn.click({ force: true, timeout: 2000 }).catch(() => {});
      await page.waitForTimeout(500);
      const receipt = await page.getByTestId("receipt-document").count(), payOpen = await page.getByTestId("payment-drawer").count();
      return { observed: `Nút hoàn tất ${vis ? "vẫn hiện" : "không hiện"}, ${dis ? "bị khóa" : "bấm được"}; chú thích nút: "${title ?? ""}"; lý do hiện trên màn: dòng "Còn thiếu 1 ₫". Bấm ép: ${receipt ? "CÓ ra hóa đơn" : "không ra hóa đơn"}; màn thanh toán ${payOpen ? "vẫn mở" : "đóng"}.`, status: vis && dis && !receipt && payOpen ? "ĐÚNG" : "LỖI" };
    });
    await step("B4", "Bấm 'Đúng tiền': số khách đưa = 125.000đ", async () => {
      const quick = await page.getByRole("button", { name: "Đúng tiền", exact: true }).count();
      if (!quick) return { observed: `Không bấm được: khi đang thiếu tiền, hàng nút nhanh (Đúng tiền, +20k, +50k, 200k, 500k) bị thay bằng dòng "Còn thiếu…", nên không có nút "Đúng tiền" trên màn.`, status: "LỖI so với kịch bản (không có nút để bấm) — CẦN LÀM RÕ" };
      await page.getByRole("button", { name: "Đúng tiền", exact: true }).click();
      return { observed: `Khách đưa ${await received(page)}đ.`, status: (await received(page)) === "125000" ? "ĐÚNG" : "LỖI" };
    });
    await step("B5", "Bỏ chọn tất cả, bấm hoàn tất: phải trả 0đ, 'chưa chọn món', bị chặn", async () => {
      await page.getByTestId("pay-select-all").uncheck(); await page.waitForTimeout(300);
      const d = await due(page), btn = page.getByTestId("pay-button-footer");
      const dis = await btn.isDisabled(), title = await attr(btn, "title"), label = await text(page.getByTestId("b03-pay-label"));
      const count = await text(page.getByTestId("b03-selected-count"));
      await btn.click({ force: true, timeout: 2000 }).catch(() => {});
      await page.waitForTimeout(400);
      const receipt = await page.getByTestId("receipt-document").count();
      return { observed: `Phải trả ${d}đ; dòng đếm "${count}"; nút "${label}" ${dis ? "bị khóa" : "bấm được"}, chú thích "${title ?? ""}"; bấm ép ${receipt ? "CÓ ra hóa đơn" : "không ra hóa đơn"}.`, status: d === "0" && dis && !receipt ? "ĐÚNG" : "LỖI" };
    });
  });

  // N01-06 — Tách trả (Cashier)
  await runCase(browser, "N01-06", "Thanh toán — trả một phần", async (page, step) => {
    await login(page, ID.cashier);
    await step("B1", "Mở thanh toán đơn 24", async () => { await openPayment(page); return { observed: `Phải trả ${await due(page)}đ.`, status: "ĐÚNG" }; });
    await step("B2", "Bỏ chọn tất cả: 0đ", async () => {
      await page.getByTestId("pay-select-all").uncheck(); await page.waitForTimeout(200);
      return { observed: `Phải trả ${await due(page)}đ.`, status: (await due(page)) === "0" ? "ĐÚNG" : "LỖI" };
    });
    const coffee = page.getByTestId("pay-item-line").filter({ hasText: "Cà phê sữa" });
    const qty = async () => `${await attr(coffee, "data-selected-quantity")}/${await attr(coffee, "data-line-quantity")}`;
    await step("B3", "Tick dòng Cà phê: 1/2, phải trả 29.000đ", async () => {
      await coffee.getByTestId("pay-item-checkbox").check(); await page.waitForTimeout(200);
      return { observed: `Dòng "Cà phê sữa" (dữ liệu demo thay cho "Cà phê"): ${await qty()}; phải trả ${await due(page)}đ.`, status: (await qty()) === "1/2" && (await due(page)) === "29000" ? "ĐÚNG" : "LỖI" };
    });
    await step("B4", "Bấm '+' hai lần: 2/2 58.000đ rồi 1/2 29.000đ", async () => {
      await coffee.getByTestId("pay-item-plus").click(); await page.waitForTimeout(200);
      const a = `${await qty()} ${await due(page)}đ`;
      await coffee.getByTestId("pay-item-plus").click(); await page.waitForTimeout(200);
      const b = `${await qty()} ${await due(page)}đ`;
      return { observed: `Lần 1: ${a}; lần 2: ${b}.`, status: a === "2/2 58000đ" && b === "1/2 29000đ" ? "ĐÚNG" : "LỖI" };
    });
    await step("B5", "Đúng tiền rồi hoàn tất: màn vẫn mở; đơn tách 29.000đ; nguồn còn 96.000đ; lựa chọn rỗng, phải trả 0đ", async () => {
      await page.getByRole("button", { name: "Đúng tiền", exact: true }).click();
      await page.getByTestId("pay-button-footer").click();
      await page.getByTestId("receipt-document").waitFor();
      const paid = await attr(page.getByTestId("receipt-document"), "data-total");
      await closeReceipt(page);
      const payOpen = await page.getByTestId("payment-drawer").isVisible();
      const total = await attr(page.getByTestId("payment-order-summary"), "data-order-total"), d = await due(page);
      const all = await page.getByTestId("pay-select-all").isChecked();
      const selected = await page.getByTestId("pay-item-line").evaluateAll((els) => els.filter((e) => e.dataset.selectedQuantity && e.dataset.selectedQuantity !== "0").length);
      return { observed: `Hóa đơn đơn tách ${paid}đ. Sau khi đóng hóa đơn: màn thanh toán ${payOpen ? "vẫn mở" : "đóng"}; tổng đơn nguồn ${total}đ; phải trả ${d}đ; "Chọn tất cả" ${all ? "bật" : "tắt"}; số dòng đang chọn ${selected}.`, status: payOpen && paid === "29000" && total === "96000" && d === "0" && !all && selected === 0 ? "ĐÚNG" : "LỖI" };
    });
    await step("B6", "Đóng màn thanh toán: Bàn 2 vẫn đang phục vụ, tổng 96.000đ", async () => {
      await page.getByTestId("payment-close-button").first().click(); await page.waitForTimeout(500);
      const b2 = page.getByTestId(`table-${ID.B02}`);
      const s = await attr(b2, "data-table-status"), t = await attr(b2, "data-order-total");
      return { observed: `Bàn B02: "${s}", tổng ${t}đ.`, status: s === "occupied" && t === "96000" ? "ĐÚNG" : "LỖI" };
    });
  });

  // N01-07 — Mang đi (Cashier)
  await runCase(browser, "N01-07", "Mang đi", async (page, step) => {
    let before = [], orderNo = null, countBefore = "";
    await login(page, ID.cashier);
    await step("B1", "Ghi lại bàn đang phục vụ; mở khu Mang đi", async () => {
      before = await page.locator('[data-table-status="occupied"]').evaluateAll((els) => els.map((e) => e.textContent.trim().slice(0, 3)));
      await page.getByTestId("nav-takeaway").click(); await page.getByTestId("takeaway-drawer").waitFor();
      countBefore = await text(page.getByTestId("takeaway-drawer").locator("header p"));
      return { observed: `Bàn đang phục vụ ở Tầng trệt: ${before.join(", ")} (dữ liệu demo có nhiều hơn "chỉ Bàn 2"). Màn Mang đi mở: "${countBefore}".`, status: "ĐÚNG" };
    });
    await step("B2", "Tạo đơn mang đi, thêm Americano, gửi", async () => {
      await page.getByRole("button", { name: "Tạo đơn mang đi" }).first().click();
      await page.getByTestId("order-drawer").waitFor();
      const header = await text(page.getByTestId("b02-header"));
      await page.getByTestId(`menu-item-${ID.americano}`).click();
      await page.getByTestId("submit-order-button-footer").click();
      await page.getByTestId("receipt-document").waitFor();
      orderNo = await attr(page.getByTestId("receipt-document"), "data-order-no");
      const variant = await attr(page.getByTestId("receipt-document"), "data-variant");
      await closeReceipt(page);
      return { observed: `Màn đơn: "${header.slice(0, 50)}"; gửi xong ra phiếu ${variant === "kitchen" ? "bếp" : variant} đơn số ${orderNo}.`, status: orderNo ? "ĐÚNG" : "LỖI" };
    });
    await step("B3", "Đơn mới có trong danh sách mang đi; không bàn nào đổi sang đang phục vụ", async () => {
      await page.getByTestId("nav-takeaway").click(); await page.getByTestId("takeaway-drawer").waitFor(); await page.waitForTimeout(300);
      const countNow = await text(page.getByTestId("takeaway-drawer").locator("header p"));
      const listed = await page.getByTestId("takeaway-drawer").getByText(`#${orderNo}`, { exact: true }).count();
      await page.getByTestId("takeaway-drawer").getByRole("button", { name: "Đóng", exact: true }).click(); await page.waitForTimeout(300);
      const after = await page.locator('[data-table-status="occupied"]').evaluateAll((els) => els.map((e) => e.textContent.trim().slice(0, 3)));
      return { observed: `Danh sách mang đi: "${countBefore}" → "${countNow}"; đơn #${orderNo} ${listed ? "có" : "không có"} trong danh sách. Bàn đang phục vụ: ${after.join(", ")} (trước: ${before.join(", ")}).`, status: listed && after.join() === before.join() ? "ĐÚNG" : "LỖI" };
    });
    await step("B4", "Mở lại đơn từ danh sách, Thanh toán, Đúng tiền, hoàn tất", async () => {
      await page.getByTestId("nav-takeaway").click(); await page.getByTestId("takeaway-drawer").waitFor();
      const card = page.getByTestId("takeaway-drawer").locator("div.cursor-pointer", { hasText: `#${orderNo}` }).first();
      await card.getByRole("button", { name: "Mở đơn", exact: true }).click();
      await page.getByTestId("order-drawer").waitFor();
      await page.getByTestId("submit-order-button-footer").click();
      await page.getByTestId("payment-drawer").waitFor();
      const d = await due(page);
      await page.getByRole("button", { name: "Đúng tiền", exact: true }).click();
      await page.getByTestId("pay-button-footer").click();
      await page.getByTestId("receipt-document").waitFor();
      const paid = await attr(page.getByTestId("receipt-document"), "data-total");
      await closeReceipt(page);
      return { observed: `Phải trả ${d}đ; hoàn tất, hóa đơn ${paid}đ.`, status: paid === "35000" ? "ĐÚNG" : "LỖI" };
    });
    await step("B5", "Đơn không còn trong danh sách mang đi", async () => {
      await page.getByTestId("nav-takeaway").click(); await page.getByTestId("takeaway-drawer").waitFor(); await page.waitForTimeout(300);
      const listed = await page.getByTestId("takeaway-drawer").getByText(`#${orderNo}`, { exact: true }).count();
      const countNow = await text(page.getByTestId("takeaway-drawer").locator("header p"));
      await page.getByTestId("takeaway-drawer").getByRole("button", { name: "Đóng", exact: true }).click();
      return { observed: `Danh sách: "${countNow}"; đơn #${orderNo} ${listed ? "VẪN còn" : "không còn"}.`, status: listed ? "LỖI" : "ĐÚNG" };
    });
    await step("B6", "Lịch sử đơn: thấy đơn mang đi đã thanh toán", async () => {
      await page.getByTestId("nav-order-history").click(); await page.getByTestId("order-history-drawer").waitFor(); await page.waitForTimeout(500);
      const rows = await page.locator('[data-testid^="history-row-"][data-total="35000"]').evaluateAll((els) => els.map((e) => `${e.dataset.tableLabel}/${e.dataset.status}`));
      return { observed: `Các đơn 35.000đ trong Lịch sử: ${rows.join(", ") || "(không có)"}.`, status: rows.some((r) => r.endsWith("/paid")) ? "ĐÚNG" : "LỖI" };
    });
  });

  // N01-08 — Thiếu quyền (Waiter)
  await runCase(browser, "N01-08", "Thiếu quyền — Waiter", async (page, step) => {
    await step("B1", "Vào ứng dụng vai Waiter: về Sơ đồ bàn", async () => {
      await login(page, ID.waiter);
      const role = await attr(page.getByTestId("left-nav-session"), "data-role");
      return { observed: `Vai ${role}; màn Sơ đồ bàn hiện.`, status: role === "waiter" && (await page.getByTestId("floor-view").isVisible()) ? "ĐÚNG" : "LỖI" };
    });
    await step("B2", "Không có lối vào Lịch sử đơn, Báo cáo, Menu, Nhân viên, Cài đặt", async () => {
      const nav = await page.locator('[data-testid^="nav-"]').evaluateAll((els) => els.map((e) => e.getAttribute("aria-label")));
      const forbidden = ["Lịch sử đơn", "Báo cáo", "Thực đơn", "Nhân viên", "Cài đặt"].filter((x) => nav.includes(x));
      return { observed: `Thanh điều hướng: ${nav.join(", ")}.`, status: forbidden.length ? `LỖI (còn ${forbidden.join(", ")})` : "ĐÚNG" };
    });
    await step("B3", "Bấm Bàn 2: đơn 24 mở được", async () => {
      await openTable(page, ID.B02);
      const header = await text(page.getByTestId("b02-header"));
      return { observed: `Đầu màn: "${header.slice(0, 70)}".`, status: /#24/.test(header) ? "ĐÚNG" : "LỖI" };
    });
    await step("B4", "Thêm Americano, gửi: gửi được; đơn 24 có thêm Americano", async () => {
      await page.getByTestId(`menu-item-${ID.americano}`).click();
      const sendLabel = await text(page.getByTestId("submit-order-button-footer"));
      await page.getByTestId("submit-order-button-footer").click();
      await page.getByTestId("receipt-document").waitFor();
      await closeReceipt(page);
      await openTable(page, ID.B02);
      const lines = await page.getByTestId("order-cart-line").evaluateAll((els) => els.map((e) => e.textContent.replace(/\s+/g, " ").trim().slice(0, 25)));
      const total = await attr(page.getByTestId("order-total-amount"), "data-amount");
      return { observed: `Nút gửi: "${sendLabel}"; gửi xong ra phiếu bếp. Mở lại đơn: ${lines.length} dòng, có Americano: ${lines.some((l) => /Americano/.test(l)) ? "có" : "không"}; tổng ${total}đ.`, status: lines.some((l) => /Americano/.test(l)) && total === "160000" ? "ĐÚNG" : "LỖI" };
    });
    await step("B5", "Không có nút/lối vào Thanh toán, không có nút hủy đơn đang mở", async () => {
      const buttons = await page.getByTestId("order-drawer").getByRole("button").allTextContents();
      const names = [...new Set(buttons.map((b) => b.replace(/\s+/g, " ").trim()).filter(Boolean))];
      const pay = names.filter((n) => /Thanh toán/.test(n)), voidBtn = await page.getByTestId("clear-open-order").count();
      return { observed: `Nút trên màn đơn: ${names.filter((n) => !/^\+|Thêm$/.test(n)).slice(0, 20).join(" | ")}. Nút "Thanh toán": ${pay.length ? "CÓ" : "không có"}; nút "Hủy đơn mở": ${voidBtn ? "CÓ" : "không có"}.`, status: !pay.length && !voidBtn ? "ĐÚNG" : "LỖI" };
    });
  });

  await browser.close();
  writeFileSync(join(outDir, only ? `ket-qua-${only.join("-")}.json` : "ket-qua.json"), JSON.stringify(results, null, 2), "utf8");
}

run().catch((e) => { console.error(e); process.exit(1); });
