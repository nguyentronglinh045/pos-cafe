// Tuần 6 — Ngọc: chạy N01 bản r04 trên bản demo mock, so kết quả thực tế với Expected r04.
// Expected r04 = Expected r02 + cập nhật theo câu trả lời của Linh ngày 08/11/2026 (Q-N01-1…8, CX-01…CX-04)
// + ca mới N01-09…N01-13 lấy từ order-management (mang đi), remake-b02 B02-02/B02-04, remake-b03 R04/R06.
// Kết quả mỗi bước: ĐÚNG | LỆCH — chờ CX-xx (Linh đã chốt sửa, chưa có code) | LỖI (khác Expected, chưa có trong CX) | CHƯA CHẠY.
// Chạy: node run-n01-r04.mjs <projectDir> <outDir> [baseURL]
// Mã cửa hàng và PIN dưới đây là dữ liệu demo có sẵn trong mã nguồn chế độ mock, không phải thông tin thật.
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
  catCaPhe: "c68d7fbd-c06a-42a4-8140-476da8ebbf74",
  catTra: "1ebf92aa-cf30-4e0d-8279-2b6fe3f8fb54",
};
const VIEWPORT = { width: 1366, height: 768 };
const clock = () => new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Bangkok", hour12: false });
const results = [];
const text = async (loc) => ((await loc.textContent()) ?? "").replace(/\s+/g, " ").trim();
const attr = (loc, name) => loc.getAttribute(name);
const due = (page) => attr(page.getByTestId("payment-order-summary"), "data-amount-due");
const received = (page) => attr(page.getByTestId("payment-received-amount"), "data-amount");
const total = (page) => attr(page.getByTestId("order-total-amount"), "data-amount");
const ok = (cond, lech = "LỖI") => (cond ? "ĐÚNG" : lech);

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
async function openTable(page, id) {
  const t = page.getByTestId(`table-${id}`);
  await t.scrollIntoViewIfNeeded();
  await t.click();
  await page.getByTestId("order-drawer").waitFor();
  await page.waitForTimeout(300);
}
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
const takeawayCount = async (page) => {
  await page.getByTestId("nav-takeaway").click();
  await page.getByTestId("takeaway-drawer").waitFor(); await page.waitForTimeout(300);
  const c = await text(page.getByTestId("takeaway-drawer").locator("header p"));
  return c;
};
const closeTakeaway = (page) => page.getByTestId("takeaway-drawer").getByRole("button", { name: "Đóng", exact: true }).first().click();

async function runCase(browser, caseId, title, fn) {
  const dir = join(outDir, "anh", caseId);
  mkdirSync(dir, { recursive: true });
  const context = await browser.newContext({ baseURL, viewport: VIEWPORT, deviceScaleFactor: 1, locale: "vi-VN", timezoneId: "Asia/Ho_Chi_Minh" });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 200)));
  const steps = [];
  const start = clock();
  const step = async (id, expected, source, body) => {
    const rec = { id, expected, source, observed: "", status: "CHƯA CHẠY", shot: `${caseId}/${id}.png`, time: clock() };
    try { Object.assign(rec, await body()); } catch (e) {
      rec.status = "CHƯA CHẠY";
      rec.observed = `Không thực hiện được: ${String(e.message || e).split("\n")[0].slice(0, 220)}`;
    }
    await page.mouse.move(-1, -1);
    await page.screenshot({ path: join(dir, `${id}.png`) }).catch(() => {});
    steps.push(rec);
  };
  await page.goto("/");
  await fn(page, step);
  results.push({ caseId, title, start, end: clock(), steps, pageErrors: errors });
  console.log(`${caseId} ${start}-${clock()}: ${steps.map((s) => `${s.id}=${s.status.split(" ")[0]}`).join(" ")}`);
  await context.close();
}

async function run() {
  mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ channel: "chrome", headless: true });

  await runCase(browser, "N01-01", "Sơ đồ bàn", async (page, step) => {
    await step("B1", "Màn đầu tiên là Sơ đồ bàn", "S02/PERM-03", async () => {
      await login(page, ID.cashier);
      const drawers = await page.locator('[data-testid$="-drawer"]').count();
      return { observed: `Đăng nhập Thu ngân; Sơ đồ bàn hiện, ${drawers} màn mở đè.`, status: ok((await page.getByTestId("floor-view").isVisible()) && drawers === 0) };
    });
    await step("B2", "Sơ đồ hiện bàn và vật trang trí của khu", "floor-operations: Chuyển khu", async () => {
      await page.getByRole("button", { name: "Tầng trệt", exact: true }).click(); await page.waitForTimeout(300);
      const tables = await page.locator("[data-table-status]").count(), decor = await page.locator('[data-testid^="decor-"]').count();
      return { observed: `Tầng trệt: ${tables} bàn, ${decor} vật trang trí.`, status: ok(tables > 0 && decor > 0) };
    });
    await step("B3", "Bàn 1 trống; Bàn 2 đang phục vụ, ô bàn ghi tên bàn và tổng tiền 125.000đ; số đơn #24 xem ở danh sách Đơn đang mở", "floor-operations (sửa theo Q-N01-5, 08/11)", async () => {
      const b1 = page.getByTestId(`table-${ID.B01}`), b2 = page.getByTestId(`table-${ID.B02}`);
      const s1 = await attr(b1, "data-table-status"), s2 = await attr(b2, "data-table-status"), t2 = await text(b2), tot = await attr(b2, "data-order-total");
      const card = page.locator('[data-testid^="floor-order-"]').filter({ hasText: "B02" });
      const cardText = (await card.count()) ? await text(card.first()) : "";
      return { observed: `B01 "${s1}". B02 "${s2}", chữ trên ô "${t2}", tổng ${tot}đ. Đơn đang mở của B02: "${cardText.slice(0, 60)}".`, status: ok(s1 === "empty" && s2 === "occupied" && tot === "125000" && /#24/.test(cardText) && !/#24/.test(t2)) };
    });
    await step("B4", "Chọn bộ lọc 'Đang phục vụ': bàn khớp sáng lên, bàn không khớp vẫn hiện đúng chỗ", "floor-operations: Lọc theo trạng thái; Q-N01-8, CX-01", async () => {
      const all = await page.locator("[data-table-status]").count();
      await page.getByTestId("floor-filter-occupied").click(); await page.waitForTimeout(400);
      const now = await page.locator("[data-table-status]").evaluateAll((els) => els.map((e) => `${e.textContent.trim().slice(0, 3)}/${e.dataset.tableStatus}`));
      return { observed: `Trước lọc ${all} bàn; sau lọc còn ${now.length} bàn trên sơ đồ: ${now.join(", ")}. Bàn không khớp ${now.length < all ? "bị ẩn" : "vẫn hiện"}.`, status: now.length < all ? "LỆCH — chờ CX-01" : "ĐÚNG" };
    });
    await page.getByTestId("floor-filter-all").click().catch(() => {});
    await step("B5", "Bấm vật trang trí: không mở đơn nào", "floor-operations: Bấm vào vật trang trí", async () => {
      await page.locator('[data-testid^="decor-"]').first().click({ force: true }); await page.waitForTimeout(800);
      const opened = await page.getByTestId("order-drawer").count();
      return { observed: opened ? "Có màn đơn mở." : "Không có màn đơn nào mở.", status: ok(!opened) };
    });
    await step("B6", "Bấm Bàn 1: mở màn tạo đơn mới cho Bàn 1", "floor-operations: Mở đơn tại bàn trống", async () => {
      await openTable(page, ID.B01);
      const header = await text(page.getByTestId("b02-header"));
      return { observed: `Đầu màn: "${header.slice(0, 80)}".`, status: ok(/Bàn B01/.test(header) && /Đơn mới/.test(header)) };
    });
  });

  await runCase(browser, "N01-02", "Gọi món — nhóm bắt buộc", async (page, step) => {
    await step("CB", "Chuẩn bị dữ liệu: nhóm Size của Cà phê sữa là bắt buộc", "điều kiện chạy (r03)", async () => {
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
      await page.getByRole("button", { name: "Thoát" }).click();
      await page.getByTestId("floor-view").waitFor(); await page.waitForTimeout(500);
      await page.getByTestId("nav-lock").click();
      await login(page, ID.cashier);
      return { observed: `Chủ quán đổi nhóm "Size" thành "Bắt buộc chọn" (${now ? "đã đổi" : "chưa đổi"}), lưu, thoát; đăng nhập lại Thu ngân.`, status: now ? "ĐÃ CHUẨN BỊ" : "LỖI CHUẨN BỊ" };
    });
    await step("B1", "Mở đơn 24 của Bàn 2, tổng 125.000đ", "S02/B02-01", async () => {
      await openTable(page, ID.B02);
      const header = await text(page.getByTestId("b02-header"));
      return { observed: `Đầu màn "${header.slice(0, 70)}"; tổng ${await total(page)}đ.`, status: ok(/#24/.test(header) && (await total(page)) === "125000") };
    });
    await step("B2", "Americano vào giỏ ngay, không mở hộp thoại; tổng 160.000đ", "B02-01, B02-03", async () => {
      const before = await page.getByTestId("order-cart-line").count();
      await page.getByTestId(`menu-item-${ID.americano}`).click(); await page.waitForTimeout(400);
      const dialog = await page.getByTestId("b02-modifier-dialog").count(), after = await page.getByTestId("order-cart-line").count();
      return { observed: `Hộp thoại ${dialog ? "có mở" : "không mở"}; giỏ ${before} → ${after} dòng; tổng ${await total(page)}đ.`, status: ok(!dialog && after === before + 1 && (await total(page)) === "160000") };
    });
    const linesAfterB2 = await page.getByTestId("order-cart-line").count().catch(() => -1);
    await step("B3", "Bấm Cà phê sữa, chưa chọn: hộp thoại mở, nút thêm bị khóa", "B02-03", async () => {
      await page.getByTestId(`menu-item-${ID.caPheSua}`).click();
      await page.getByTestId("b02-modifier-dialog").first().waitFor();
      return { observed: `Hộp thoại mở; nút "Thêm vào đơn" ${(await page.getByTestId("modifier-confirm").isDisabled()) ? "bị khóa" : "bấm được"}.`, status: ok(await page.getByTestId("modifier-confirm").isDisabled()) };
    });
    await step("B4", "Hủy (đóng) hộp thoại: giỏ không đổi so với sau B2", "B02-03 (Q-N01-6: dùng remake-b02)", async () => {
      await page.getByTestId("modifier-picker-close").click(); await page.waitForTimeout(400);
      const open = await page.getByTestId("b02-modifier-dialog").count(), lines = await page.getByTestId("order-cart-line").count();
      return { observed: `Dùng nút đóng (X, tên "Đóng"). Hộp ${open ? "vẫn mở" : "đã đóng"}; giỏ ${lines} dòng (sau B2: ${linesAfterB2}), tổng ${await total(page)}đ.`, status: ok(!open && lines === linesAfterB2) };
    });
    await step("B5", "Chọn giá trị hợp lệ: nút thêm mở khóa; dòng Cà phê sữa vào giỏ, hiện tùy chọn", "S03, B02-03", async () => {
      await page.getByTestId(`menu-item-${ID.caPheSua}`).click();
      await page.getByTestId("b02-modifier-dialog").first().waitFor();
      await page.getByTestId(`modifier-value-${ID.sizeM}`).click();
      const enabled = await page.getByTestId("modifier-confirm").isEnabled();
      await page.getByTestId("modifier-confirm").click(); await page.waitForTimeout(400);
      const last = (await page.getByTestId("order-cart-line").evaluateAll((els) => els.map((e) => e.textContent.replace(/\s+/g, " ").trim().slice(0, 60)))).pop() ?? "";
      return { observed: `Nút thêm ${enabled ? "mở khóa" : "vẫn khóa"}; dòng cuối giỏ "${last}".`, status: ok(enabled && /Cà phê sữa/.test(last) && /Size M/.test(last)) };
    });
  });

  await runCase(browser, "N01-03", "Gọi món — đóng khi còn nháp", async (page, step) => {
    await login(page, ID.cashier);
    await step("B1", "Mở đơn 24 của Bàn 2", "S02", async () => { await openTable(page, ID.B02); return { observed: `Tổng ${await total(page)}đ.`, status: ok((await total(page)) === "125000") }; });
    await step("B2", "Thêm Americano: tổng nháp 160.000đ", "B02-01", async () => {
      await page.getByTestId(`menu-item-${ID.americano}`).click(); await page.waitForTimeout(300);
      return { observed: `Tổng ${await total(page)}đ.`, status: ok((await total(page)) === "160000") };
    });
    await step("B3", "Bấm đóng: hiện hộp 'Bỏ đơn chưa gửi?'", "B02-07", async () => {
      await page.getByTestId("order-close-button").click();
      const vis = await page.getByText("Bỏ đơn chưa gửi?", { exact: true }).isVisible().catch(() => false);
      const btns = await page.getByRole("dialog").last().getByRole("button").allTextContents().catch(() => []);
      return { observed: `Hộp ${vis ? 'hiện "Bỏ đơn chưa gửi?"' : "không hiện"}; nút: ${btns.map((b) => `"${b.trim()}"`).join(", ")}.`, status: ok(vis) };
    });
    await step("B4", "'Tiếp tục chỉnh sửa': vẫn ở màn đơn, nháp giữ 160.000đ", "B02-07", async () => {
      await page.getByRole("button", { name: "Tiếp tục chỉnh sửa" }).click(); await page.waitForTimeout(300);
      const open = await page.getByTestId("order-drawer").isVisible();
      return { observed: `Màn đơn ${open ? "vẫn mở" : "đã đóng"}; tổng ${await total(page)}đ.`, status: ok(open && (await total(page)) === "160000") };
    });
    await step("B5", "Đóng lần nữa: với đơn đã gửi nút bỏ ghi 'Bỏ thay đổi'; bấm bỏ thì màn đơn đóng và đơn về bản đã lưu (125.000đ)", "B02-07 (cập nhật 08/11), Q-N01-4, CX-03", async () => {
      await page.getByTestId("order-close-button").click();
      const dlg = page.getByRole("dialog").last();
      const names = (await dlg.getByRole("button").allTextContents()).map((b) => b.trim());
      const discard = names.find((n) => /^Bỏ/.test(n)) ?? "";
      await dlg.getByRole("button", { name: discard, exact: true }).click(); await page.waitForTimeout(500);
      const closed = (await page.getByTestId("order-drawer").count()) === 0;
      await openTable(page, ID.B02);
      const t = await total(page);
      const behaviour = closed && t === "125000";
      return { observed: `Nút bỏ ghi "${discard}". Bấm xong màn đơn ${closed ? "đóng" : "vẫn mở"}; mở lại B02 tổng ${t}đ.`, status: !behaviour ? "LỖI" : discard === "Bỏ thay đổi" ? "ĐÚNG" : "LỆCH — chờ CX-03 (hành vi đúng, chữ nút chưa đổi)" };
    });
  });

  await runCase(browser, "N01-04", "Thanh toán — trả đủ", async (page, step) => {
    await login(page, ID.cashier);
    await step("B1", "Mở đơn 24, bấm Thanh toán", "S04", async () => { await openPayment(page); return { observed: `"${(await text(page.getByTestId("b03-meta"))).slice(0, 60)}".`, status: "ĐÚNG" }; });
    await step("B2", "Mặc định chọn tất cả; phải trả 125.000đ", "R03", async () => {
      const all = await page.getByTestId("pay-select-all").isChecked(), d = await due(page);
      return { observed: `Chọn tất cả ${all ? "bật" : "tắt"}; phải trả ${d}đ.`, status: ok(all && d === "125000") };
    });
    await step("B3", "Bấm Thẻ/QR: không được chọn, vẫn tiền mặt", "S04 phương thức khả dụng, R01", async () => {
      const card = page.getByTestId("b03-method-card");
      await card.click({ force: true, timeout: 2000 }).catch(() => {});
      const cash = await page.getByTestId("b03-method-cash").evaluate((e) => e.classList.contains("active")), cardOn = await card.evaluate((e) => e.classList.contains("active"));
      return { observed: `Thẻ ${(await card.isDisabled()) ? "bị vô hiệu" : "bấm được"}; Tiền mặt ${cash ? "vẫn chọn" : "không chọn"}.`, status: ok(cash && !cardOn) };
    });
    await step("B4", "'200k': khách đưa 200.000đ, trả lại 75.000đ", "R04", async () => {
      await page.getByRole("button", { name: "200k", exact: true }).click(); await page.waitForTimeout(200);
      const r = await received(page), ch = await text(page.getByTestId("payment-change-summary-value"));
      return { observed: `Khách đưa ${r}đ; trả lại "${ch}".`, status: ok(r === "200000" && /75\.000/.test(ch)) };
    });
    await step("B5", "'+20k' đặt 145.000đ; '200k' đặt lại 200.000đ", "R04", async () => {
      await page.getByRole("button", { name: "+20k", exact: true }).click(); await page.waitForTimeout(200);
      const a = await received(page);
      await page.getByRole("button", { name: "200k", exact: true }).click(); await page.waitForTimeout(200);
      return { observed: `+20k → ${a}đ; 200k → ${await received(page)}đ.`, status: ok(a === "145000" && (await received(page)) === "200000") };
    });
    await step("B6", "Hoàn tất: màn thanh toán đóng; Bàn 2 trống; Lịch sử có đơn đã thanh toán 125.000đ của B02", "S04, R05", async () => {
      await page.getByTestId("pay-button-footer").click();
      await page.getByTestId("receipt-document").waitFor();
      const payOpen = await page.getByTestId("payment-drawer").count();
      await closeReceipt(page);
      const s2 = await attr(page.getByTestId(`table-${ID.B02}`), "data-table-status");
      await page.getByTestId("nav-order-history").click(); await page.getByTestId("order-history-drawer").waitFor(); await page.waitForTimeout(500);
      const rows = await page.locator('[data-testid^="history-row-"][data-table-label="B02"]').evaluateAll((els) => els.map((e) => `${e.dataset.total}đ/${e.dataset.status}`));
      return { observed: `Màn thanh toán ${payOpen ? "vẫn mở" : "đóng"}; B02 "${s2}"; Lịch sử B02: ${rows.join(", ")}.`, status: ok(!payOpen && s2 === "empty" && rows.includes("125000đ/paid")) };
    });
    await step("B7", "Lịch sử hiện số đơn do database cấp (#24) như hóa đơn, chia nhóm theo ngày", "CX-04 (chốt 09/11)", async () => {
      const row = page.locator('[data-testid^="history-row-"][data-table-label="B02"][data-total="125000"]').first();
      const rt = await text(row);
      const groups = await page.getByTestId("order-history-drawer").getByText(/^(Thứ|Chủ nhật).*\d{2}\/\d{2}\/\d{4}$/).count();
      return { observed: `Dòng Lịch sử của đơn vừa trả: "${rt.slice(0, 60)}"; dòng tiêu đề theo ngày: ${groups}.`, status: /#24\b/.test(rt) && groups > 0 ? "ĐÚNG" : "LỆCH — chờ CX-04" };
    });
  });

  await runCase(browser, "N01-05", "Thanh toán — thiếu tiền / không chọn", async (page, step) => {
    await login(page, ID.cashier);
    await step("B1", "Mở thanh toán đơn 24: chọn tất cả, phải trả 125.000đ", "R03", async () => {
      await openPayment(page);
      return { observed: `Phải trả ${await due(page)}đ; ô khách đưa ${await received(page)}đ.`, status: ok((await due(page)) === "125000") };
    });
    await step("B2", "Xóa hết, nhập 124999 bằng bàn phím số: hiển thị thiếu 1đ", "R04", async () => {
      let n = 0;
      while ((await received(page)) !== "0" && n < 12) { await page.getByTestId("payment-key-delete").click(); n++; }
      for (const k of "124999") await page.getByTestId(`payment-key-${k}`).click();
      const w = (await page.getByTestId("payment-insufficient-warning").count()) ? await text(page.getByTestId("payment-insufficient-warning")) : "";
      return { observed: `Xóa ${n} lần; khách đưa ${await received(page)}đ; cảnh báo "${w}".`, status: ok((await received(page)) === "124999" && /thiếu 1/.test(w)) };
    });
    await step("B3", "Nút hoàn tất vẫn hiện ở trạng thái khóa kèm lý do; bấm không ghi lệnh", "R04, PERM-04, Q-N01-3", async () => {
      const btn = page.getByTestId("pay-button-footer");
      const vis = await btn.isVisible(), dis = await btn.isDisabled();
      await btn.click({ force: true, timeout: 2000 }).catch(() => {}); await page.waitForTimeout(500);
      const receipt = await page.getByTestId("receipt-document").count();
      return { observed: `Nút ${vis ? "hiện" : "ẩn"}, ${dis ? "khóa" : "bấm được"}; lý do: dòng "Còn thiếu"; bấm ép ${receipt ? "CÓ hóa đơn" : "không ra hóa đơn"}.`, status: ok(vis && dis && !receipt) };
    });
    await step("B4", "Bấm 'Đúng tiền': số khách đưa = 125.000đ", "R04; Q-N01-7 giữ Expected, CX-02", async () => {
      const quick = page.getByRole("button", { name: "Đúng tiền", exact: true });
      if (!(await quick.count())) return { observed: "Khi đang thiếu tiền, hàng nút nhanh bị thay bằng dòng \"Còn thiếu…\", không có nút Đúng tiền để bấm.", status: "LỆCH — chờ CX-02" };
      await quick.click();
      return { observed: `Khách đưa ${await received(page)}đ.`, status: ok((await received(page)) === "125000") };
    });
    await step("B5", "Bỏ chọn tất cả: phải trả 0đ, bị chặn hoàn tất", "S04, R05", async () => {
      await page.getByTestId("pay-select-all").uncheck(); await page.waitForTimeout(300);
      const d = await due(page), dis = await page.getByTestId("pay-button-footer").isDisabled();
      return { observed: `Phải trả ${d}đ; "${await text(page.getByTestId("b03-selected-count"))}"; nút ${dis ? "khóa" : "bấm được"}.`, status: ok(d === "0" && dis) };
    });
  });

  await runCase(browser, "N01-06", "Thanh toán — trả một phần", async (page, step) => {
    await login(page, ID.cashier);
    await step("B1", "Mở thanh toán đơn 24", "S04", async () => { await openPayment(page); return { observed: `Phải trả ${await due(page)}đ.`, status: "ĐÚNG" }; });
    await step("B2", "Bỏ chọn tất cả: 0đ", "R03", async () => {
      await page.getByTestId("pay-select-all").uncheck(); await page.waitForTimeout(200);
      return { observed: `Phải trả ${await due(page)}đ.`, status: ok((await due(page)) === "0") };
    });
    const coffee = page.getByTestId("pay-item-line").filter({ hasText: "Cà phê sữa" });
    const qty = async () => `${await attr(coffee, "data-selected-quantity")}/${await attr(coffee, "data-line-quantity")}`;
    await step("B3", "Tick dòng Cà phê: 1/2, phải trả 29.000đ", "R03", async () => {
      await coffee.getByTestId("pay-item-checkbox").check(); await page.waitForTimeout(200);
      return { observed: `Cà phê sữa ${await qty()}; phải trả ${await due(page)}đ.`, status: ok((await qty()) === "1/2" && (await due(page)) === "29000") };
    });
    await step("B4", "'+' hai lần: 2/2 58.000đ rồi 1/2 29.000đ", "R03", async () => {
      await coffee.getByTestId("pay-item-plus").click(); await page.waitForTimeout(200);
      const a = `${await qty()} ${await due(page)}đ`;
      await coffee.getByTestId("pay-item-plus").click(); await page.waitForTimeout(200);
      const b = `${await qty()} ${await due(page)}đ`;
      return { observed: `Lần 1: ${a}; lần 2: ${b}.`, status: ok(a === "2/2 58000đ" && b === "1/2 29000đ") };
    });
    await step("B5", "Đúng tiền, hoàn tất: màn vẫn mở; đơn tách 29.000đ; nguồn 96.000đ; lựa chọn rỗng, 0đ", "R05", async () => {
      await page.getByRole("button", { name: "Đúng tiền", exact: true }).click();
      await page.getByTestId("pay-button-footer").click();
      await page.getByTestId("receipt-document").waitFor();
      const paid = await attr(page.getByTestId("receipt-document"), "data-total");
      await closeReceipt(page);
      const open = await page.getByTestId("payment-drawer").isVisible(), tot = await attr(page.getByTestId("payment-order-summary"), "data-order-total"), d = await due(page), all = await page.getByTestId("pay-select-all").isChecked();
      return { observed: `Đơn tách ${paid}đ; màn ${open ? "vẫn mở" : "đóng"}; nguồn ${tot}đ; phải trả ${d}đ; Chọn tất cả ${all ? "bật" : "tắt"}.`, status: ok(open && paid === "29000" && tot === "96000" && d === "0" && !all) };
    });
    await step("B6", "Đóng màn thanh toán: Bàn 2 vẫn đang phục vụ, tổng 96.000đ", "S04", async () => {
      await page.getByTestId("payment-close-button").first().click(); await page.waitForTimeout(500);
      const b2 = page.getByTestId(`table-${ID.B02}`);
      return { observed: `B02 "${await attr(b2, "data-table-status")}", tổng ${await attr(b2, "data-order-total")}đ.`, status: ok((await attr(b2, "data-table-status")) === "occupied" && (await attr(b2, "data-order-total")) === "96000") };
    });
  });

  await runCase(browser, "N01-07", "Mang đi", async (page, step) => {
    let before = [], orderNo = null, countBefore = "";
    await login(page, ID.cashier);
    await step("B1", "Ghi lại bàn đang phục vụ; mở khu Mang đi", "S09", async () => {
      before = await page.locator('[data-table-status="occupied"]').evaluateAll((els) => els.map((e) => e.textContent.trim().slice(0, 3)));
      countBefore = await takeawayCount(page);
      return { observed: `Bàn đang phục vụ: ${before.join(", ")}; Mang đi: "${countBefore}".`, status: "ĐÚNG" };
    });
    await step("B2", "Tạo đơn mang đi, thêm Americano, gửi", "order-management: Tạo đơn mang đi", async () => {
      await page.getByRole("button", { name: "Tạo đơn mang đi" }).first().click();
      await page.getByTestId("order-drawer").waitFor();
      await page.getByTestId(`menu-item-${ID.americano}`).click();
      await page.getByTestId("submit-order-button-footer").click();
      await page.getByTestId("receipt-document").waitFor();
      orderNo = await attr(page.getByTestId("receipt-document"), "data-order-no");
      await closeReceipt(page);
      return { observed: `Gửi xong ra phiếu bếp đơn #${orderNo}.`, status: ok(!!orderNo) };
    });
    await step("B3", "Đơn mới có trong danh sách mang đi đang mở; không bàn nào đổi sang đang phục vụ", "order-management: Tạo đơn mang đi", async () => {
      const c = await takeawayCount(page);
      const listed = await page.getByTestId("takeaway-drawer").getByText(`#${orderNo}`, { exact: true }).count();
      await closeTakeaway(page); await page.waitForTimeout(300);
      const after = await page.locator('[data-table-status="occupied"]').evaluateAll((els) => els.map((e) => e.textContent.trim().slice(0, 3)));
      return { observed: `"${countBefore}" → "${c}"; #${orderNo} ${listed ? "có" : "không có"}; bàn đang phục vụ ${after.join(", ")}.`, status: ok(listed && after.join() === before.join()) };
    });
    await step("B4", "Mở lại đơn từ danh sách, Thanh toán, Đúng tiền, hoàn tất", "S09, R04", async () => {
      await takeawayCount(page);
      const card = page.getByTestId("takeaway-drawer").locator("div.cursor-pointer", { hasText: `#${orderNo}` }).first();
      await card.getByRole("button", { name: "Mở đơn", exact: true }).click();
      await page.getByTestId("order-drawer").waitFor();
      await page.getByTestId("submit-order-button-footer").click();
      await page.getByTestId("payment-drawer").waitFor();
      await page.getByRole("button", { name: "Đúng tiền", exact: true }).click();
      await page.getByTestId("pay-button-footer").click();
      await page.getByTestId("receipt-document").waitFor();
      const paid = await attr(page.getByTestId("receipt-document"), "data-total");
      await closeReceipt(page);
      return { observed: `Hóa đơn ${paid}đ.`, status: ok(paid === "35000") };
    });
    await step("B5", "Đơn rời khỏi danh sách mang đi", "order-management: Đơn mang đi đã thanh toán", async () => {
      const c = await takeawayCount(page);
      const listed = await page.getByTestId("takeaway-drawer").getByText(`#${orderNo}`, { exact: true }).count();
      await closeTakeaway(page);
      return { observed: `"${c}"; #${orderNo} ${listed ? "VẪN còn" : "không còn"}.`, status: ok(!listed) };
    });
    await step("B6", "Chỉ còn xem được ở Lịch sử đơn: đơn mang đi đã thanh toán", "order-management: Đơn mang đi đã thanh toán", async () => {
      await page.getByTestId("nav-order-history").click(); await page.getByTestId("order-history-drawer").waitFor(); await page.waitForTimeout(500);
      const rows = await page.locator('[data-testid^="history-row-"][data-total="35000"]').evaluateAll((els) => els.map((e) => `${e.dataset.tableLabel}/${e.dataset.status}`));
      return { observed: `Đơn 35.000đ trong Lịch sử: ${rows.join(", ") || "(không có)"}.`, status: ok(rows.some((r) => r.endsWith("/paid"))) };
    });
  });

  await runCase(browser, "N01-08", "Thiếu quyền — Waiter", async (page, step) => {
    await step("B1", "Vai Waiter: về Sơ đồ bàn", "PERM-03", async () => {
      await login(page, ID.waiter);
      return { observed: `Vai ${await attr(page.getByTestId("left-nav-session"), "data-role")}.`, status: ok((await page.getByTestId("floor-view").isVisible())) };
    });
    await step("B2", "Không có Lịch sử đơn, Báo cáo, Thực đơn, Nhân viên, Cài đặt", "PERM-02, PERM-04", async () => {
      const nav = await page.locator('[data-testid^="nav-"]').evaluateAll((els) => els.map((e) => e.getAttribute("aria-label")).filter(Boolean));
      const bad = ["Lịch sử đơn", "Báo cáo", "Thực đơn", "Nhân viên", "Cài đặt"].filter((x) => nav.includes(x));
      return { observed: `Thanh trái: ${nav.join(", ")}.`, status: ok(!bad.length) };
    });
    await step("B3", "Bấm Bàn 2: đơn 24 mở được", "S02", async () => {
      await openTable(page, ID.B02);
      return { observed: `"${(await text(page.getByTestId("b02-header"))).slice(0, 70)}".`, status: ok(/#24/.test(await text(page.getByTestId("b02-header")))) };
    });
    await step("B4", "Thêm Americano, gửi: đơn 24 có thêm Americano, 160.000đ", "PERM-02", async () => {
      await page.getByTestId(`menu-item-${ID.americano}`).click();
      await page.getByTestId("submit-order-button-footer").click();
      await page.getByTestId("receipt-document").waitFor();
      await closeReceipt(page);
      await openTable(page, ID.B02);
      return { observed: `Mở lại: tổng ${await total(page)}đ.`, status: ok((await total(page)) === "160000") };
    });
    await step("B5", "Đơn đã gửi: chỉ có nút Đóng; không có Thanh toán, không có Hủy đơn đang mở", "Q-N01-2 (08/11), PERM-04", async () => {
      const header = await page.getByTestId("order-drawer").locator("header").first().getByRole("button").allTextContents();
      const pay = await page.getByTestId("order-drawer").getByRole("button", { name: /Thanh toán/ }).count();
      const voidBtn = await page.getByTestId("clear-open-order").count();
      const footer = await page.getByTestId("submit-order-button-footer").count();
      return { observed: `Nút ở đầu màn: ${header.map((b) => `"${b.trim()}"`).join(", ")}; nút Thanh toán ${pay ? "CÓ" : "không"}; nút chính ở chân màn ${footer ? "CÓ" : "không"}; Hủy đơn mở ${voidBtn ? "CÓ" : "không"}.`, status: ok(!pay && !voidBtn && !footer) };
    });
  });

  // ===== Ca mới r04 =====
  await runCase(browser, "N01-09", "Mang đi — thoát trước khi gửi món", async (page, step) => {
    let c0 = "";
    await login(page, ID.cashier);
    await step("B1", "Mở Bán mang đi, ghi số đơn đang mở", "S09", async () => { c0 = await takeawayCount(page); return { observed: `"${c0}".`, status: "ĐÚNG" }; });
    await step("B2", "Tạo đơn mang đi, thêm Americano (chưa gửi)", "order-management", async () => {
      await page.getByRole("button", { name: "Tạo đơn mang đi" }).first().click();
      await page.getByTestId("order-drawer").waitFor();
      await page.getByTestId(`menu-item-${ID.americano}`).click(); await page.waitForTimeout(300);
      return { observed: `"${(await text(page.getByTestId("b02-header"))).slice(0, 50)}", tổng ${await total(page)}đ.`, status: ok((await total(page)) === "35000") };
    });
    await step("B3", "Bấm đóng: hỏi 'Bỏ đơn chưa gửi?'; đơn mới nên nút bỏ ghi 'Bỏ đơn'", "B02-07, CX-03", async () => {
      await page.getByTestId("order-close-button").click();
      const vis = await page.getByText("Bỏ đơn chưa gửi?", { exact: true }).isVisible().catch(() => false);
      const btns = (await page.getByRole("dialog").last().getByRole("button").allTextContents()).map((b) => b.trim());
      return { observed: `Hộp ${vis ? "hiện" : "không hiện"}; nút: ${btns.join(", ")}.`, status: ok(vis && btns.includes("Bỏ đơn")) };
    });
    await step("B4", "Bấm Bỏ đơn: không có đơn nào được tạo, danh sách mang đi không đổi", "order-management: Thoát trước khi gửi món; Q-N01-1", async () => {
      await page.getByRole("button", { name: "Bỏ đơn", exact: true }).click(); await page.waitForTimeout(400);
      const c1 = await takeawayCount(page);
      return { observed: `Danh sách: "${c0}" → "${c1}".`, status: ok(c1 === c0) };
    });
  });

  await runCase(browser, "N01-10", "Gọi món — tìm món và đổi danh mục", async (page, step) => {
    await login(page, ID.cashier);
    await step("B1", "Mở Bàn 1, chọn danh mục 'Trà & trà sữa'", "B02-02", async () => {
      await openTable(page, ID.B01);
      await page.getByTestId(`b02-category-${ID.catTra}`).click(); await page.waitForTimeout(200);
      return { observed: `Americano ở danh mục này: ${(await page.getByTestId(`menu-item-${ID.americano}`).count()) ? "có" : "không"}.`, status: ok(!(await page.getByTestId(`menu-item-${ID.americano}`).count())) };
    });
    await step("B2", "Gõ 'americano' (chữ thường): vẫn tìm thấy Americano dù đang ở danh mục khác", "B02-02 (không phân biệt hoa thường, trên toàn menu)", async () => {
      await page.getByTestId("b02-search").fill("americano"); await page.waitForTimeout(300);
      return { observed: `Kết quả: ${(await page.getByTestId(`menu-item-${ID.americano}`).count()) ? "thấy Americano" : "không thấy"}.`, status: ok(await page.getByTestId(`menu-item-${ID.americano}`).count()) };
    });
    await step("B3", "Đổi sang danh mục 'Cà phê': ô tìm được xóa", "B02-02 (đổi category xóa search)", async () => {
      await page.getByTestId(`b02-category-${ID.catCaPhe}`).click(); await page.waitForTimeout(300);
      const v = await page.getByTestId("b02-search").inputValue();
      return { observed: `Ô tìm sau khi đổi danh mục: "${v}".`, status: ok(v === "") };
    });
  });

  await runCase(browser, "N01-11", "Gọi món — thêm/bớt món đã gửi", async (page, step) => {
    await login(page, ID.cashier);
    const saved = (name) => page.getByTestId("order-cart-line").filter({ hasText: name }).filter({ hasText: "Phần đã lưu" });
    const lines = () => page.getByTestId("order-cart-line").evaluateAll((els) => els.map((e) => e.textContent.replace(/\s+/g, " ").trim().slice(0, 48)));
    await step("B1", "Mở đơn 24 (Bàn 2): các dòng đã gửi ghi 'Phần đã lưu'", "B02-04", async () => {
      await openTable(page, ID.B02);
      const l = await lines();
      return { observed: `${l.length} dòng: ${l.join(" | ")}; tổng ${await total(page)}đ.`, status: ok(l.length === 3 && (await total(page)) === "125000") };
    });
    await step("B2", "Bấm + ở dòng Bạc xỉu đã lưu: dòng đã lưu giữ nguyên, thêm một dòng Bạc xỉu mới theo giá hiện hành; tổng 157.000đ", "B02-04 (saved+ → thêm dòng giá hiện hành)", async () => {
      await saved("Bạc xỉu").getByTestId("order-cart-increase").click(); await page.waitForTimeout(300);
      const l = await lines();
      const savedQty = await text(saved("Bạc xỉu").getByTestId("order-cart-quantity"));
      const newLines = l.filter((x) => /Bạc xỉu/.test(x) && !/Phần đã lưu/.test(x));
      return { observed: `${l.length} dòng: ${l.join(" | ")}. Dòng đã lưu số lượng ${savedQty}; dòng Bạc xỉu mới: ${newLines.length}; tổng ${await total(page)}đ.`, status: ok(savedQty === "1" && newLines.length === 1 && (await total(page)) === "157000") };
    });
    await step("B3", "Bấm − ở dòng Croissant đã lưu: về 0 thì dòng ẩn khỏi giỏ; tổng giảm 35.000đ", "B02-04 (saved− clamp 0; giỏ ẩn dòng 0)", async () => {
      await saved("Croissant").getByTestId("order-cart-decrease").click(); await page.waitForTimeout(300);
      const l = await lines();
      return { observed: `${l.length} dòng: ${l.join(" | ")}; tổng ${await total(page)}đ.`, status: ok(!l.some((x) => /Croissant/.test(x)) && (await total(page)) === "122000") };
    });
    await step("B4", "Đóng, bỏ thay đổi: mở lại đơn 24 về bản đã lưu 125.000đ, Croissant còn", "B02-07, Q-N01-4", async () => {
      await page.getByTestId("order-close-button").click();
      const dlg = page.getByRole("dialog").last();
      const discard = (await dlg.getByRole("button").allTextContents()).map((b) => b.trim()).find((n) => /^Bỏ/.test(n));
      await dlg.getByRole("button", { name: discard, exact: true }).click(); await page.waitForTimeout(400);
      await openTable(page, ID.B02);
      const l = await lines();
      return { observed: `Nút bỏ "${discard}". Mở lại: ${l.length} dòng, tổng ${await total(page)}đ.`, status: ok((await total(page)) === "125000" && l.some((x) => /Croissant/.test(x))) };
    });
  });

  await runCase(browser, "N01-12", "Thanh toán — nhập tiền khách đưa", async (page, step) => {
    await login(page, ID.cashier);
    await step("B1", "Mở thanh toán đơn 24: ô khách đưa 125.000", "R03", async () => { await openPayment(page); return { observed: `Khách đưa ${await received(page)}đ.`, status: ok((await received(page)) === "125000") }; });
    await step("B2", "Bấm xóa một lần: xóa một chữ số (12.500)", "R04 (delete xóa một chữ số)", async () => {
      await page.getByTestId("payment-key-delete").click(); await page.waitForTimeout(150);
      return { observed: `Khách đưa ${await received(page)}đ.`, status: ok((await received(page)) === "12500") };
    });
    await step("B3", "Bấm phím 00: thêm hai số 0 (1.250.000)", "R04 (có phím 00)", async () => {
      await page.getByTestId("payment-key-00").click(); await page.waitForTimeout(150);
      return { observed: `Khách đưa ${await received(page)}đ.`, status: ok((await received(page)) === "1250000") };
    });
    await step("B4", "Bấm thêm 4 chữ số 9: chỉ giữ tối đa 9 chữ số", "R04 (cắt tối đa 9 chữ số)", async () => {
      for (let i = 0; i < 4; i++) await page.getByTestId("payment-key-9").click();
      await page.waitForTimeout(150);
      const r = await received(page);
      return { observed: `Khách đưa ${r}đ (${r.length} chữ số).`, status: ok(r.length <= 9) };
    });
    await step("B5", "Gõ thẳng '12a5b' vào ô: chỉ nhận chữ số (125)", "R04 (direct input chỉ nhận chữ số)", async () => {
      const input = page.getByTestId("payment-received-amount");
      await input.click(); await page.keyboard.press("Control+A"); await page.keyboard.type("12a5b"); await page.waitForTimeout(200);
      return { observed: `Khách đưa ${await received(page)}đ; ô hiện "${await input.inputValue()}".`, status: ok((await received(page)) === "125") };
    });
    await step("B6", "Nút nhanh: Đúng tiền = 125.000; +50k = 175.000; 500k = 500.000", "R04", async () => {
      const input = page.getByTestId("payment-received-amount");
      await input.click(); await page.keyboard.press("Control+A"); await page.keyboard.type("200000"); await page.waitForTimeout(200);
      const vals = [];
      for (const n of ["Đúng tiền", "+50k", "500k"]) { await page.getByRole("button", { name: n, exact: true }).click(); await page.waitForTimeout(150); vals.push(`${n} → ${await received(page)}`); }
      return { observed: vals.join("; "), status: ok(vals.join() === "Đúng tiền → 125000,+50k → 175000,500k → 500000") };
    });
  });

  await runCase(browser, "N01-13", "Thanh toán — in hóa đơn và tạm tính", async (page, step) => {
    await login(page, ID.cashier);
    await step("B1", "Mở thanh toán đơn 24: ô 'In hóa đơn sau khi thanh toán' bật sẵn", "R06 (checkbox in mặc định true)", async () => {
      await openPayment(page);
      return { observed: `Ô in ${(await page.getByTestId("print-receipt-checkbox").isChecked()) ? "bật sẵn" : "tắt"}.`, status: ok(await page.getByTestId("print-receipt-checkbox").isChecked()) };
    });
    await step("B2", "Bấm in tạm tính: hiện phiếu tạm tính nằm trên màn thanh toán; đơn chưa bị thanh toán", "R06 (Xem tạm tính không ghi lệnh)", async () => {
      const btn = page.getByTestId("print-provisional-button");
      const label = await text(btn);
      await btn.click();
      await page.getByTestId("receipt-preview").waitFor({ timeout: 8000 });
      const pv = await text(page.getByTestId("receipt-preview"));
      const onTop = await page.evaluate(() => { const p = document.querySelector('[data-testid="receipt-preview"]').getBoundingClientRect(); const el = document.elementFromPoint(p.left + p.width / 2, p.top + 20); return !!el?.closest('[data-testid="receipt-preview"]'); });
      return { observed: `Nút "${label}". Cửa sổ: "${pv.slice(0, 70)}"; nằm trên cùng: ${onTop ? "có" : "KHÔNG"}.`, status: ok(/tạm tính/i.test(pv) && onTop) };
    });
    await step("B3", "Đóng phiếu tạm tính: vẫn ở màn thanh toán, phải trả không đổi; bàn vẫn đang phục vụ", "R06", async () => {
      await closeReceipt(page);
      const open = await page.getByTestId("payment-drawer").isVisible(), d = await due(page);
      await page.getByTestId("payment-close-button").first().click(); await page.waitForTimeout(400);
      if (await page.getByTestId("order-drawer").count()) { await page.getByTestId("order-close-button").click(); await page.waitForTimeout(300); }
      const s2 = await attr(page.getByTestId(`table-${ID.B02}`), "data-table-status");
      return { observed: `Màn thanh toán ${open ? "vẫn mở" : "đóng"}, phải trả ${d}đ; sau đó B02 "${s2}".`, status: ok(open && d === "125000" && s2 === "occupied") };
    });
  });

  await browser.close();
  writeFileSync(join(outDir, "ket-qua.json"), JSON.stringify({ source: "main cd35439 (src giống hệt, đã so mã băm)", viewport: VIEWPORT, finishedAt: new Date().toISOString(), results }, null, 2), "utf8");
}

run().catch((e) => { console.error(e); process.exit(1); });
