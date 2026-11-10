// Làm theo Demo Runbook (docs/demo-runbook.md @ docs 9916522), bước 1–11, trên bản demo mock.
// Mỗi bước: chữ trong hướng dẫn, thao tác đã làm, quan sát, nhãn nút thấy trên màn, ảnh.
// Chạy: node run-huong-dan.mjs <projectDir> <outDir> [baseURL]
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const [projectDir, outDir, baseURL = "http://127.0.0.1:5175"] = process.argv.slice(2);
const require = createRequire(join(projectDir, "package.json"));
const { chromium } = require("@playwright/test");

const ID = {
  owner: ["30000000-0000-4000-8000-000000000011", "123456"],
  cashier: ["30000000-0000-4000-8000-000000000013", "111111"],
  B01: "7b035353-73d6-44bc-8ec4-1ab9951f7a58",
  americano: "80cfbd5a-a538-4da6-888d-2f732b7b8e2d",
  caPheSua: "3e43bb8c-198f-443f-83ab-18696983edaa",
  traSua: "f6dec6d1-792d-4ccd-8892-86c3f3f550fc",
  sizeM: "a5f986a6-ea67-4dd3-866e-42a0be8a0497",
  itDa: "9d64eca6-2712-484e-8962-848c27c41793",
  tranChau: "dbbecac5-7b06-42c8-8a53-44e08e8d61c3",
  catCaPhe: "c68d7fbd-c06a-42a4-8140-476da8ebbf74",
  catTra: "1ebf92aa-cf30-4e0d-8279-2b6fe3f8fb54",
};
const VIEWPORT = { width: 1366, height: 768 };
const text = async (loc) => ((await loc.textContent()) ?? "").replace(/\s+/g, " ").trim();
const attr = (loc, name) => loc.getAttribute(name);
const buttons = async (loc) => [...new Set((await loc.getByRole("button").evaluateAll((els) => els.filter((e) => e.offsetParent !== null).map((e) => (e.getAttribute("aria-label") || e.textContent || "").replace(/\s+/g, " ").trim()))).filter(Boolean))];
const due = (page) => attr(page.getByTestId("payment-order-summary"), "data-amount-due");
const received = (page) => attr(page.getByTestId("payment-received-amount"), "data-amount");

async function run() {
  mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({ baseURL, viewport: VIEWPORT, deviceScaleFactor: 1, locale: "vi-VN" });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 200)));
  const steps = [];
  const shot = async (name) => { await page.mouse.move(-1, -1); await page.screenshot({ path: join(outDir, `${name}.png`) }).catch(() => {}); return `${name}.png`; };
  const step = async (id, guide, body) => {
    const rec = { id, guide, did: [], seen: [], shots: [] };
    const note = { did: (s) => rec.did.push(s), seen: (s) => rec.seen.push(s), shot: async (n) => rec.shots.push(await shot(n)) };
    try { await body(note); } catch (e) { rec.seen.push(`DỪNG: ${String(e.message || e).split("\n")[0].slice(0, 220)}`); rec.shots.push(await shot(`${id}-dung`)); }
    steps.push(rec);
    console.log(`${id}: ${rec.seen.length} quan sát${rec.seen.some((s) => s.startsWith("DỪNG")) ? " (DỪNG)" : ""}`);
  };
  const orderNoInHeader = async () => (await text(page.getByTestId("b02-header"))).match(/#(\d+)/)?.[1] ?? null;
  const closeReceipt = async () => { await page.getByTestId("receipt-close-footer").click(); await page.getByTestId("receipt-preview").waitFor({ state: "detached", timeout: 5000 }).catch(() => {}); await page.waitForTimeout(300); };

  await page.goto("/");

  await step("B01-03", "1. Mở app ở landscape. 2. Nếu chưa paired, tạo store mới hoặc ghép Store Key. 3. Vào passcode, chọn nhân viên có quyền cần cho demo và nhập PIN.", async (n) => {
    await page.getByTestId("landing-screen").waitFor({ timeout: 30000 });
    n.seen(`Màn mở đầu, các nút: ${(await buttons(page.getByTestId("landing-screen"))).join(" | ")}`);
    await n.shot("B01-mo-dau");
    await page.getByTestId("go-store-pairing").click();
    n.did(`Bấm "Đã có quán" (ghép bằng Store Key demo).`);
    await page.getByTestId("store-key-input").fill("0001-X8F3QA");
    const goLabel = await text(page.getByTestId("go-passcode"));
    await page.getByTestId("go-passcode").click();
    n.did(`Nhập Store Key demo, bấm "${goLabel}".`);
    await page.getByTestId("passcode-screen").waitFor();
    const emps = await page.locator('[data-testid^="employee-"]').evaluateAll((els) => els.map((e) => e.textContent.replace(/\s+/g, " ").trim()));
    n.seen(`Màn chọn nhân viên: ${emps.join(" | ")}`);
    await n.shot("B03-chon-nhan-vien");
    await page.getByTestId(`employee-${ID.owner[0]}`).click();
    for (const d of ID.owner[1]) await page.getByTestId(`pin-${d}`).click();
    const unlock = await text(page.getByTestId("unlock-button"));
    await page.getByTestId("unlock-button").click();
    n.did(`Chọn Chủ quán (vì bước 8 cần mở Báo cáo), nhập PIN demo, bấm "${unlock}".`);
    await page.getByTestId("floor-view").waitFor();
    await page.mouse.move(-1, -1);
    await page.locator(':root:not(:has([data-rht-toaster] > div)) [data-testid="floor-view"]').waitFor({ timeout: 15000 }).catch(() => {});
    const nav = await page.locator('[data-testid^="nav-"]').evaluateAll((els) => els.map((e) => e.getAttribute("aria-label")));
    n.seen(`Vào màn "Sơ đồ bàn". Thanh trái: ${nav.join(", ")}.`);
  });

  await step("B04", "4. Ở floor view, chọn khu/tầng, mở một bàn trống.", async (n) => {
    const areas = await page.getByTestId("floor-view").locator("button[aria-pressed]").evaluateAll((els) => els.map((e) => `${e.textContent.trim()}${e.getAttribute("aria-pressed") === "true" ? " (đang chọn)" : ""}`));
    n.seen(`Dải khu: ${areas.join(", ")}.`);
    const legend = await page.getByTestId("floor-view").getByRole("button").evaluateAll((els) => els.map((e) => e.textContent.replace(/\s+/g, " ").trim()).filter((t) => /Tất cả|Trống|Đang phục vụ|Làm mới/.test(t)));
    n.seen(`Nút lọc/làm mới trên sơ đồ: ${[...new Set(legend)].join(", ")}.`);
    const empty = await page.locator('[data-table-status="empty"]').evaluateAll((els) => els.map((e) => e.textContent.trim().slice(0, 3)));
    n.seen(`Bàn trống ở khu đang chọn: ${empty.join(", ")}. Trên bàn không có chữ "trống"; phân biệt bằng màu/viền.`);
    await n.shot("B04a-so-do");
    const t = page.getByTestId(`table-${ID.B01}`);
    await t.click();
    await page.getByTestId("order-drawer").waitFor(); await page.waitForTimeout(300);
    n.did("Khu \"Tầng trệt\" đã được chọn sẵn; bấm bàn B01 (trống).");
    n.seen(`Màn mở: "${(await text(page.getByTestId("b02-header"))).slice(0, 90)}".`);
    n.seen(`Nút trên đầu màn đơn: ${(await buttons(page.getByTestId("b02-header"))).join(" | ")}.`);
    await n.shot("B04b-man-goi-mon");
  });

  await step("B05", "5. Tạo order dine-in: chọn món, option/topping, chỉnh số lượng/ghi chú, gửi đơn.", async (n) => {
    // Món có tùy chọn: Cà phê sữa (Size, Đá).
    await page.getByTestId(`menu-item-${ID.caPheSua}`).click();
    const dlg = page.getByTestId("b02-modifier-dialog").first();
    await dlg.waitFor();
    n.did("Bấm món \"Cà phê sữa\".");
    n.seen(`Hộp chọn tùy chọn mở: "${(await text(dlg)).slice(0, 160)}…"`);
    n.seen(`Nút trong hộp: ${(await buttons(dlg)).join(" | ")}.`);
    await n.shot("B05a-hop-tuy-chon");
    await page.getByTestId(`modifier-value-${ID.sizeM}`).click();
    await page.getByTestId(`modifier-value-${ID.itDa}`).click();
    const confirmLabel = await text(page.getByTestId("modifier-confirm"));
    await page.getByTestId("modifier-confirm").click(); await page.waitForTimeout(300);
    n.did(`Chọn "Size M", "Ít đá", bấm "${confirmLabel}".`);
    // Món có topping: Trà sữa truyền thống (ở danh mục khác).
    const catTra = page.getByTestId(`b02-category-${ID.catTra}`);
    const catTraLabel = await text(catTra);
    await catTra.click(); await page.waitForTimeout(200);
    n.did(`Bấm danh mục "${catTraLabel}" bên trái (món ở danh mục khác).`);
    await page.getByTestId(`menu-item-${ID.traSua}`).click();
    await dlg.waitFor();
    n.seen(`Hộp tùy chọn của Trà sữa truyền thống: "${(await text(dlg)).slice(0, 140)}…"`);
    await page.getByTestId(`modifier-value-${ID.tranChau}`).click();
    const qtyCtl = await page.getByTestId(`modifier-qty-inc-${ID.tranChau}`).count();
    await n.shot("B05b-topping");
    await page.getByTestId("modifier-confirm").click(); await page.waitForTimeout(300);
    n.did(`Bấm "Trà sữa truyền thống", chọn topping "Trân châu"${qtyCtl ? " (có nút tăng/giảm số lượng topping)" : ""}, bấm "${confirmLabel}".`);
    // Món không tùy chọn + chỉnh số lượng.
    await page.getByTestId(`b02-category-${ID.catCaPhe}`).click(); await page.waitForTimeout(200);
    await page.getByTestId(`menu-item-${ID.americano}`).click(); await page.waitForTimeout(300);
    const dialogForAmericano = await page.getByTestId("b02-modifier-dialog").count();
    const amLine = page.getByTestId("order-cart-line").filter({ hasText: "Americano" });
    await amLine.getByTestId("order-cart-increase").click(); await page.waitForTimeout(200);
    n.did(`Bấm "Americano" (${dialogForAmericano ? "có" : "không"} mở hộp tùy chọn), bấm "+" trên dòng giỏ để thành ${await text(amLine.getByTestId("order-cart-quantity"))}.`);
    // Ghi chú.
    const cpLine = page.getByTestId("order-cart-line").filter({ hasText: "Cà phê sữa" });
    const noteLabel = await text(cpLine.getByTestId("b02-note"));
    await cpLine.getByTestId("b02-note").click();
    const ph = await attr(page.getByTestId("b02-line-note"), "placeholder");
    await page.getByTestId("b02-line-note").fill("ít ngọt");
    n.did(`Bấm "${noteLabel}" trên dòng Cà phê sữa, gõ "ít ngọt" (ô ghi chú gợi ý: "${ph}"). Không có nút lưu ghi chú riêng.`);
    const lines = await page.getByTestId("order-cart-line").evaluateAll((els) => els.map((e) => e.textContent.replace(/\s+/g, " ").trim().slice(0, 90)));
    n.seen(`Giỏ hàng: ${lines.join(" || ")}.`);
    const footer = page.getByTestId("b02-footer");
    n.seen(`Chân giỏ: "${await text(footer)}". Tổng ${await attr(page.getByTestId("order-total-amount"), "data-amount")}đ.`);
    await n.shot("B05c-gio-truoc-khi-gui");
    const sendLabel = await text(page.getByTestId("submit-order-button-footer"));
    await page.getByTestId("submit-order-button-footer").click();
    n.did(`Bấm "${sendLabel}" (hướng dẫn ghi "gửi đơn").`);
    await page.getByTestId("receipt-preview").waitFor({ timeout: 10000 });
    const doc = page.getByTestId("receipt-document");
    n.seen(`Sau khi gửi, tự bật cửa sổ "${await text(page.getByTestId("receipt-preview").locator("div.text-sm.font-extrabold").first())}" (${await attr(doc, "data-variant")}), đơn số ${await attr(doc, "data-order-no")}; nút: ${(await buttons(page.getByTestId("receipt-preview"))).join(" | ")}. Hướng dẫn không nhắc cửa sổ này.`);
    await n.shot("B05d-phieu-gui-bep");
  });

  await step("B06", "6. Quay lại floor, thấy bàn chuyển sang đang phục vụ.", async (n) => {
    await closeReceipt();
    n.did("Bấm \"Đóng\" trên phiếu gửi bếp.");
    const drawerOpen = await page.getByTestId("order-drawer").count();
    n.seen(`Sau khi đóng phiếu: màn gọi món ${drawerOpen ? "VẪN MỞ, phải tự bấm Đóng để về sơ đồ" : "đã tự đóng, đang ở sơ đồ bàn"}.`);
    if (drawerOpen) { await page.getByTestId("order-close-button").click(); await page.waitForTimeout(300); }
    const t = page.getByTestId(`table-${ID.B01}`);
    n.seen(`Bàn B01: trạng thái "${await attr(t, "data-table-status")}", chữ trên bàn "${await text(t)}", tổng ${await attr(t, "data-order-total")}đ.`);
    await n.shot("B06-ban-dang-phuc-vu");
  });

  let origNo = null;
  await step("B07", "7. Mở lại order, chuyển sang payment.", async (n) => {
    await page.getByTestId(`table-${ID.B01}`).click();
    await page.getByTestId("order-drawer").waitFor(); await page.waitForTimeout(300);
    origNo = await orderNoInHeader();
    n.did("Bấm lại bàn B01.");
    n.seen(`Màn đơn: "${(await text(page.getByTestId("b02-header"))).slice(0, 90)}". Nút đầu màn: ${(await buttons(page.getByTestId("b02-header"))).join(" | ")}; nút chân giỏ: "${await text(page.getByTestId("submit-order-button-footer"))}".`);
    await n.shot("B07a-mo-lai-don");
    await page.getByTestId("submit-order-button-footer").click();
    await page.getByTestId("payment-drawer").waitFor(); await page.waitForTimeout(300);
    n.did("Bấm \"Thanh toán\" (hướng dẫn ghi \"chuyển sang payment\").");
    n.seen(`Màn thanh toán: "${await text(page.getByTestId("b03-title"))}" — "${await text(page.getByTestId("b03-meta"))}".`);
    n.seen(`"Chọn tất cả": ${(await page.getByTestId("pay-select-all").isChecked()) ? "đang bật" : "tắt"}; "${await text(page.getByTestId("b03-selected-count"))}"; thanh toán lần này ${await due(page)}đ; ô "Tiền khách đưa" điền sẵn ${await received(page)}đ; ô "In hóa đơn sau khi thanh toán" ${(await page.getByTestId("print-receipt-checkbox").isChecked()) ? "bật sẵn" : "tắt"}.`);
    n.seen(`Nút chân màn: "${await text(page.getByTestId("pay-button-footer"))}"${(await page.getByTestId("b03-back-footer").count()) ? `, "${await text(page.getByTestId("b03-back-footer"))}"` : ""}.`);
    await n.shot("B07b-man-thanh-toan");
  });

  let splitNo = null;
  await step("B08", "8. Demo instant pay: bỏ `Chọn tất cả`, tick 1-2 món (chỉnh số lượng bằng nút `+`), hoàn tất → preview bill riêng mở khi có initial grant và bật checkbox in (kế thừa số đơn gốc), đơn gốc còn lại trên bàn với số mới; mở report thấy doanh thu vào NGAY.", async (n) => {
    await page.getByTestId("pay-select-all").uncheck(); await page.waitForTimeout(200);
    n.did("Bỏ \"Chọn tất cả\".");
    n.seen(`Sau khi bỏ: thanh toán lần này ${await due(page)}đ; tiền khách đưa ${await received(page)}đ.`);
    const am = page.getByTestId("pay-item-line").filter({ hasText: "Americano" });
    await am.getByTestId("pay-item-checkbox").check(); await page.waitForTimeout(200);
    const q1 = await text(am.getByTestId("b03-quantity"));
    await am.getByTestId("pay-item-plus").click(); await page.waitForTimeout(200);
    const q2 = await text(am.getByTestId("b03-quantity"));
    n.did(`Tick dòng Americano (thành ${q1}), bấm "+" (thành ${q2}).`);
    const insuff = await page.getByTestId("payment-insufficient-warning").count();
    const payBtn = page.getByTestId("pay-button-footer");
    n.seen(`Thanh toán lần này ${await due(page)}đ; tiền khách đưa ${await received(page)}đ; ${insuff ? `cảnh báo "${await text(page.getByTestId("payment-insufficient-warning"))}"` : "không có cảnh báo thiếu tiền"}; nút "${await text(payBtn)}" ${(await payBtn.isDisabled()) ? "BỊ KHÓA" : "bấm được"}.`);
    await n.shot("B08a-chon-mot-phan");
    if (await payBtn.isDisabled()) {
      await page.getByRole("button", { name: "Đúng tiền", exact: true }).click();
      n.did("Nút hoàn tất bị khóa nên bấm \"Đúng tiền\" (hướng dẫn không ghi bước này).");
    }
    const payLabel = await text(payBtn);
    await payBtn.click();
    n.did(`Bấm "${payLabel}" (hướng dẫn ghi "hoàn tất").`);
    await page.getByTestId("receipt-preview").waitFor({ timeout: 10000 });
    const doc = page.getByTestId("receipt-document");
    splitNo = await attr(doc, "data-order-no");
    n.seen(`Bật cửa sổ "${await text(page.getByTestId("receipt-preview").locator("div.text-sm.font-extrabold").first())}": đơn số ${splitNo}, tổng ${await attr(doc, "data-total")}đ, khách đưa ${await attr(doc, "data-received-amount")}đ, trả lại ${await attr(doc, "data-change-amount")}đ. Số đơn gốc trước khi tách: ${origNo}.`);
    await n.shot("B08b-hoa-don-tach");
    await closeReceipt();
    n.did("Bấm \"Đóng\" trên hóa đơn.");
    const payOpen = await page.getByTestId("payment-drawer").count();
    if (payOpen) {
      n.seen(`Màn thanh toán vẫn mở: "${await text(page.getByTestId("b03-meta"))}"; tổng đơn ${await attr(page.getByTestId("payment-order-summary"), "data-order-total")}đ; thanh toán lần này ${await due(page)}đ; "Chọn tất cả" ${(await page.getByTestId("pay-select-all").isChecked()) ? "bật" : "tắt"}.`);
    } else n.seen("Màn thanh toán đã đóng.");
    await n.shot("B08c-sau-khi-tach");
    // "mở report": thử bấm Báo cáo khi màn thanh toán còn mở.
    let reportOpened = false;
    try { await page.getByTestId("nav-report").click({ timeout: 2500 }); await page.getByTestId("report-summary").waitFor({ timeout: 3000 }); reportOpened = true; } catch { /* bị che */ }
    n.seen(reportOpened ? "Bấm \"Báo cáo\" ở thanh trái được ngay khi màn thanh toán còn mở." : "Không bấm được \"Báo cáo\" khi màn thanh toán còn mở (màn thanh toán che thanh trái).");
    if (!reportOpened) {
      await page.getByTestId("payment-close-button").first().click(); await page.waitForTimeout(400);
      n.did("Đóng màn thanh toán để mở Báo cáo.");
      const t = page.getByTestId(`table-${ID.B01}`);
      n.seen(`Bàn B01 sau khi tách: "${await attr(t, "data-table-status")}", chữ "${await text(t)}", tổng ${await attr(t, "data-order-total")}đ.`);
      await page.getByTestId("nav-report").click();
      await page.getByTestId("report-summary").waitFor();
    }
    await page.waitForTimeout(500);
    n.seen(`Báo cáo: "${(await text(page.getByTestId("report-summary"))).slice(0, 220)}".`);
    const orders = await page.locator('[data-testid^="report-order-"]').evaluateAll((els) => els.map((e) => e.textContent.replace(/\s+/g, " ").trim().slice(0, 60)));
    if (orders.length) n.seen(`Đơn trong báo cáo: ${orders.slice(0, 6).join(" || ")}.`);
    await n.shot("B08d-bao-cao");
    await page.getByTestId("report-close-button").first().click(); await page.waitForTimeout(400);
  });

  await step("B09", "9. Chủ động chọn phần còn lại sau split (selection lúc này rỗng), rồi nhập tiền khách đưa, kiểm tra trạng thái thiếu/đủ tiền, hoàn tất thanh toán.", async (n) => {
    if (!(await page.getByTestId("payment-drawer").count())) {
      await page.getByTestId(`table-${ID.B01}`).click();
      await page.getByTestId("order-drawer").waitFor(); await page.waitForTimeout(300);
      n.seen(`Mở lại B01: "${(await text(page.getByTestId("b02-header"))).slice(0, 90)}".`);
      await page.getByTestId("submit-order-button-footer").click();
      await page.getByTestId("payment-drawer").waitFor(); await page.waitForTimeout(300);
      n.did("Vì phải rời màn thanh toán để xem báo cáo ở bước 8, mở lại B01 → \"Thanh toán\".");
    }
    const all = page.getByTestId("pay-select-all");
    n.seen(`Khi vào lại: "${await text(page.getByTestId("b03-meta"))}"; "Chọn tất cả" ${(await all.isChecked()) ? "ĐANG BẬT (không rỗng như hướng dẫn ghi)" : "tắt (rỗng)"}; "${await text(page.getByTestId("b03-selected-count"))}"; thanh toán lần này ${await due(page)}đ; tiền khách đưa ${await received(page)}đ.`);
    await n.shot("B09a-vao-lai-thanh-toan");
    if (!(await all.isChecked())) { await all.check(); n.did("Bấm \"Chọn tất cả\" để chọn phần còn lại."); }
    else n.did("Không cần chọn: phần còn lại đã được chọn sẵn.");
    const d = Number(await due(page));
    let k = 0;
    while ((await received(page)) !== "0" && k < 12) { await page.getByTestId("payment-key-delete").click(); k++; }
    for (const c of String(d - 25000)) await page.getByTestId(`payment-key-${c}`).click();
    n.did(`Bấm nút xóa (biểu tượng, không có chữ) ${k} lần cho ô về 0, nhập ${d - 25000} bằng bàn phím số trên màn.`);
    const w = page.getByTestId("payment-insufficient-warning");
    n.seen(`Thiếu tiền: ${(await w.count()) ? `"${await text(w)}"` : "không có cảnh báo"}; ô "${await text(page.getByTestId("b03-change"))}"; nút "${await text(page.getByTestId("pay-button-footer"))}" ${(await page.getByTestId("pay-button-footer").isDisabled()) ? "bị khóa" : "bấm được"}; hàng nút nhanh ${(await page.getByRole("button", { name: "Đúng tiền", exact: true }).count()) ? "có" : "không hiện"}.`);
    await n.shot("B09b-thieu-tien");
    k = 0;
    while ((await received(page)) !== "0" && k < 12) { await page.getByTestId("payment-key-delete").click(); k++; }
    for (const c of String(d + 25000)) await page.getByTestId(`payment-key-${c}`).click();
    n.did(`Xóa lại, nhập ${d + 25000}.`);
    n.seen(`Đủ tiền: ô "${await text(page.getByTestId("b03-change"))}"; nút "${await text(page.getByTestId("pay-button-footer"))}" ${(await page.getByTestId("pay-button-footer").isDisabled()) ? "bị khóa" : "bấm được"}.`);
    await n.shot("B09c-du-tien");
    const label = await text(page.getByTestId("pay-button-footer"));
    await page.getByTestId("pay-button-footer").click();
    n.did(`Bấm "${label}".`);
  });

  await step("B10", "10. Xem receipt preview, quay lại floor thấy bàn trống.", async (n) => {
    await page.getByTestId("receipt-preview").waitFor({ timeout: 10000 });
    const doc = page.getByTestId("receipt-document");
    n.seen(`Cửa sổ "${await text(page.getByTestId("receipt-preview").locator("div.text-sm.font-extrabold").first())}": đơn số ${await attr(doc, "data-order-no")}, tổng ${await attr(doc, "data-total")}đ, khách đưa ${await attr(doc, "data-received-amount")}đ, trả lại ${await attr(doc, "data-change-amount")}đ; nút: ${(await buttons(page.getByTestId("receipt-preview"))).join(" | ")}.`);
    await n.shot("B10a-hoa-don");
    await closeReceipt();
    n.did("Bấm \"Đóng\".");
    n.seen(`Sau khi đóng: màn thanh toán ${(await page.getByTestId("payment-drawer").count()) ? "vẫn mở" : "đã đóng"}, màn gọi món ${(await page.getByTestId("order-drawer").count()) ? "vẫn mở" : "đã đóng"}.`);
    const t = page.getByTestId(`table-${ID.B01}`);
    n.seen(`Bàn B01: "${await attr(t, "data-table-status")}", chữ "${await text(t)}".`);
    await n.shot("B10b-ban-trong");
  });

  await step("B11", "11. Mở report/history: 2 đơn độc lập từ cùng một bàn, số đơn tăng theo thứ tự thanh toán.", async (n) => {
    await page.getByTestId("nav-order-history").click();
    await page.getByTestId("order-history-drawer").waitFor(); await page.waitForTimeout(600);
    const rows = await page.locator('[data-testid^="history-row-"][data-table-label="B01"]').evaluateAll((els) => els.map((e) => `${e.textContent.replace(/\s+/g, " ").trim().slice(0, 80)} [${e.dataset.status}, ${e.dataset.total}đ]`));
    n.did("Bấm \"Lịch sử đơn\" ở thanh trái.");
    n.seen(`Các đơn của bàn B01 trong Lịch sử: ${rows.join(" || ") || "(không có)"}. Số đơn tách ở bước 8: ${splitNo}; số đơn gốc ban đầu: ${origNo}.`);
    await n.shot("B11a-lich-su");
    await page.getByTestId("order-history-drawer").getByRole("button", { name: "Đóng", exact: true }).first().click().catch(() => {});
    await page.waitForTimeout(400);
    await page.getByTestId("nav-report").click();
    await page.getByTestId("report-summary").waitFor(); await page.waitForTimeout(500);
    n.seen(`Báo cáo: "${(await text(page.getByTestId("report-summary"))).slice(0, 220)}".`);
    await n.shot("B11b-bao-cao");
  });

  // Đối chiếu nhanh: Thu ngân có lối vào Báo cáo không (bước 8 và 11 cần Báo cáo).
  await page.getByTestId("report-close-button").first().click().catch(() => {});
  await page.waitForTimeout(300);
  await step("PHU", "Phụ: nếu chọn vai Thu ngân ở bước 3 thì có làm được bước 8 và 11 không?", async (n) => {
    await page.getByTestId("nav-lock").click();
    await page.getByTestId("passcode-screen").waitFor();
    await page.getByTestId(`employee-${ID.cashier[0]}`).click();
    for (const d of ID.cashier[1]) await page.getByTestId(`pin-${d}`).click();
    await page.getByTestId("unlock-button").click();
    await page.getByTestId("floor-view").waitFor(); await page.waitForTimeout(500);
    const nav = await page.locator('[data-testid^="nav-"]').evaluateAll((els) => els.map((e) => e.getAttribute("aria-label")));
    n.did("Khóa máy, đăng nhập vai Thu ngân.");
    n.seen(`Thanh trái của Thu ngân: ${nav.join(", ")}.`);
    await n.shot("PHU-thu-ngan");
  });

  await browser.close();
  writeFileSync(join(outDir, "ket-qua.json"), JSON.stringify({ guide: "docs/demo-runbook.md @ docs 9916522", finishedAt: new Date().toISOString(), steps, pageErrors: errors }, null, 2), "utf8");
}

run().catch((e) => { console.error(e); process.exit(1); });
