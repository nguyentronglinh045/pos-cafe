// Kiểm 20 đề xuất của Lâm (HD-01…HD-20) trên bản demo mock: làm theo bước 4–11, ghi giờ thật từng bước.
// Chạy: node kiem-20-de-xuat.mjs <projectDir> <outDir> [baseURL]
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const [projectDir, outDir, baseURL = "http://127.0.0.1:5175"] = process.argv.slice(2);
const require = createRequire(join(projectDir, "package.json"));
const { chromium } = require("@playwright/test");

const ID = {
  owner: ["30000000-0000-4000-8000-000000000011", "123456"],
  manager: ["30000000-0000-4000-8000-000000000012", "384729"],
  cashier: ["30000000-0000-4000-8000-000000000013", "111111"],
  B01: "7b035353-73d6-44bc-8ec4-1ab9951f7a58",
  B04: null,
  americano: "80cfbd5a-a538-4da6-888d-2f732b7b8e2d",
  caPheSua: "3e43bb8c-198f-443f-83ab-18696983edaa",
  traSua: "f6dec6d1-792d-4ccd-8892-86c3f3f550fc",
  croissant: "91bbd9ab-1397-4275-8e49-620b70f45b55",
  sizeM: "a5f986a6-ea67-4dd3-866e-42a0be8a0497",
  itDa: "9d64eca6-2712-484e-8962-848c27c41793",
  tranChau: "dbbecac5-7b06-42c8-8a53-44e08e8d61c3",
  catCaPhe: "c68d7fbd-c06a-42a4-8140-476da8ebbf74",
  catTra: "1ebf92aa-cf30-4e0d-8279-2b6fe3f8fb54",
  catBanh: "d8e03f30-1979-44b1-8fae-dc3cf6756680",
};
const clock = () => new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Bangkok", hour12: false });
const clean = (s) => (s ?? "").replace(/\s+/g, " ").trim();
const text = async (loc) => clean(await loc.textContent());
const attr = (loc, name) => loc.getAttribute(name);
const due = (page) => attr(page.getByTestId("payment-order-summary"), "data-amount-due");
const received = (page) => attr(page.getByTestId("payment-received-amount"), "data-amount");
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
  await page.waitForTimeout(400);
}
const closeReceipt = async (page) => { await page.getByTestId("receipt-close-footer").click(); await page.getByTestId("receipt-preview").waitFor({ state: "detached", timeout: 5000 }).catch(() => {}); await page.waitForTimeout(300); };
const toast = async (page) => clean(await page.locator("[data-rht-toaster]").innerText().catch(() => ""));
const tablesVisible = (page) => page.locator("[data-table-status]").evaluateAll((els) => els.map((e) => `${e.textContent.trim().slice(0, 3)}/${e.dataset.tableStatus}`));
const filterPressed = (page) => page.locator('[data-testid^="floor-filter-"]').evaluateAll((els) => els.filter((e) => e.getAttribute("aria-pressed") === "true").map((e) => e.textContent.trim()).join(","));
// Nút/ô có thấy được ngay không, tức không bị khung cuộn che và không phải cuộn.
const reachable = (loc) => loc.evaluate((el) => {
  const r = el.getBoundingClientRect();
  let p = el.parentElement, clipped = false;
  while (p) {
    const s = getComputedStyle(p);
    if (/(auto|scroll|hidden)/.test(s.overflowY + s.overflowX)) {
      const q = p.getBoundingClientRect();
      if (r.top < q.top - 1 || r.bottom > q.bottom + 1) clipped = true;
    }
    p = p.parentElement;
  }
  const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  return !clipped && !!top && (top === el || el.contains(top));
});

async function scenario(browser, name, viewport, fn) {
  const dir = join(outDir, name);
  mkdirSync(dir, { recursive: true });
  const context = await browser.newContext({ baseURL, viewport, deviceScaleFactor: 1, locale: "vi-VN" });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 200)));
  const steps = [];
  const step = async (id, title, body) => {
    const rec = { id, title, start: clock(), end: null, seen: [], shots: [] };
    const n = {
      seen: (s) => rec.seen.push(s),
      shot: async (file) => { await page.mouse.move(-1, -1); await page.screenshot({ path: join(dir, `${file}.png`) }).catch(() => {}); rec.shots.push(`${file}.png`); },
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

  // A — Luồng chính theo đúng đề xuất của Lâm.
  await scenario(browser, "A-luong-chinh", { width: 1366, height: 768 }, async (page, step) => {
    let baseRevenue = "", origNo = null, splitNo = null, lastNo = null;
    await step("TRUOC", "HD-01, HD-02: vào quán, chọn Chủ quán; ghi doanh thu ban đầu", async (n) => {
      await page.getByTestId("landing-screen").waitFor({ timeout: 30000 });
      n.seen(`Màn đầu: ${clean(await page.getByTestId("landing-screen").getByRole("button").allInnerTexts().then((a) => a.join(" | ")))}`);
      await page.getByTestId("go-store-pairing").click();
      await page.getByTestId("store-key-input").fill("0001-X8F3QA");
      n.seen(`Nút sau khi nhập Store Key: "${await text(page.getByTestId("go-passcode"))}"`);
      await page.getByTestId("go-passcode").click();
      await page.getByTestId("passcode-screen").waitFor();
      n.seen(`Nhân viên: ${(await page.locator('[data-testid^="employee-"]').allInnerTexts()).map(clean).join(" | ")}`);
      await page.getByTestId(`employee-${ID.owner[0]}`).click();
      for (const d of ID.owner[1]) await page.getByTestId(`pin-${d}`).click();
      n.seen(`Nút mở: "${await text(page.getByTestId("unlock-button"))}"`);
      await page.getByTestId("unlock-button").click();
      await page.getByTestId("floor-view").waitFor();
      await page.waitForTimeout(400);
      await page.getByTestId("nav-report").click();
      await page.getByTestId("report-summary").waitFor(); await page.waitForTimeout(500);
      baseRevenue = await text(page.getByTestId("report-summary"));
      n.seen(`Báo cáo ban đầu: "${baseRevenue.slice(0, 120)}"`);
      await n.shot("00-bao-cao-ban-dau");
      await page.getByTestId("report-close-button").first().click(); await page.waitForTimeout(300);
    });

    await step("B4", "HD-03: chọn khu, bấm Trống, chọn B01", async (n) => {
      n.seen(`Trước khi lọc: ${(await tablesVisible(page)).join(", ")}`);
      await page.getByRole("button", { name: "Tầng trệt", exact: true }).click();
      await page.getByTestId("floor-filter-empty").click(); await page.waitForTimeout(300);
      n.seen(`Sau khi bấm Trống: ${(await tablesVisible(page)).join(", ")}; bộ lọc đang chọn "${await filterPressed(page)}"`);
      await n.shot("B4a-loc-trong");
      await page.getByTestId(`table-${ID.B01}`).click();
      await page.getByTestId("order-drawer").waitFor(); await page.waitForTimeout(300);
      n.seen(`Màn mở: "${clean(await attr(page.getByTestId("b02-header"), "aria-label"))}"`);
    });

    await step("B5", "HD-04, 05, 06, 07: đổi danh mục, tìm món, tùy chọn, số lượng, ghi chú, gửi đơn", async (n) => {
      await page.getByTestId(`menu-item-${ID.caPheSua}`).click();
      const dlg = page.getByTestId("b02-modifier-dialog").first();
      await dlg.waitFor();
      await page.getByTestId(`modifier-value-${ID.sizeM}`).click();
      await page.getByTestId(`modifier-value-${ID.itDa}`).click();
      await page.getByTestId("modifier-confirm").click(); await page.waitForTimeout(300);
      n.seen("Món có tùy chọn (Cà phê sữa): mở cửa sổ chọn Size, Đá; có nút Thêm vào đơn.");
      n.seen(`Trà sữa ở danh mục Cà phê: ${await page.getByTestId(`menu-item-${ID.traSua}`).count() ? "có" : "không thấy"}`);
      await page.getByTestId(`b02-category-${ID.catTra}`).click(); await page.waitForTimeout(200);
      n.seen(`Sau khi đổi danh mục: Trà sữa ${await page.getByTestId(`menu-item-${ID.traSua}`).count() ? "hiện" : "không hiện"}`);
      await page.getByTestId(`menu-item-${ID.traSua}`).click();
      await dlg.waitFor();
      await page.getByTestId(`modifier-value-${ID.tranChau}`).click();
      await page.getByTestId("modifier-confirm").click(); await page.waitForTimeout(300);
      // Tìm món đang ở danh mục khác, bấm đúng chữ "+ Thêm".
      await page.getByTestId("b02-search").fill("Americano"); await page.waitForTimeout(300);
      const am = page.getByTestId(`menu-item-${ID.americano}`);
      n.seen(`Tìm "Americano" khi đang ở Trà & trà sữa: ${await am.count() ? "thấy món" : "không thấy"}; ô đếm "${await text(page.locator(".menu-count"))}"`);
      await n.shot("B5a-tim-mon");
      await am.locator(".add-label").click(); await page.waitForTimeout(300);
      n.seen(`Bấm "+ Thêm": cửa sổ tùy chọn ${await page.getByTestId("b02-modifier-dialog").count() ? "CÓ mở" : "không mở, vào giỏ ngay"}; ô tìm sau đó "${await page.getByTestId("b02-search").inputValue()}"`);
      await page.getByTestId("b02-search").fill("");
      const amLine = page.getByTestId("order-cart-line").filter({ hasText: "Americano" });
      await amLine.getByTestId("order-cart-increase").click();
      await amLine.getByTestId("order-cart-increase").click();
      const up = await text(amLine.getByTestId("order-cart-quantity"));
      await amLine.getByTestId("order-cart-decrease").click(); await page.waitForTimeout(200);
      n.seen(`Americano: + + thành ${up}, − thành ${await text(amLine.getByTestId("order-cart-quantity"))}`);
      const cp = page.getByTestId("order-cart-line").filter({ hasText: "Cà phê sữa" });
      await cp.getByTestId("b02-note").click();
      await page.getByTestId("b02-line-note").fill("ít ngọt");
      await page.getByTestId("b02-search").click(); await page.waitForTimeout(200);
      n.seen(`Rời ô ghi chú (không bấm lưu): dòng giỏ "${(await text(cp)).slice(0, 80)}"`);
      n.seen(`Tổng ${await attr(page.getByTestId("order-total-amount"), "data-amount")}đ; nút "${await text(page.getByTestId("submit-order-button-footer"))}"`);
      await n.shot("B5b-gio");
      await page.getByTestId("submit-order-button-footer").click();
      await page.getByTestId("receipt-preview").waitFor({ timeout: 10000 });
      const pv = page.getByTestId("receipt-preview");
      origNo = await attr(page.getByTestId("receipt-document"), "data-order-no");
      n.seen(`Cửa sổ "${await text(pv.locator("div.text-sm.font-extrabold").first())}", đơn #${origNo}; nút: ${(await pv.getByRole("button").allInnerTexts()).map(clean).filter(Boolean).join(" | ")}; phiếu có ghi chú "ít ngọt": ${/ít ngọt/.test(await text(page.getByTestId("receipt-document"))) ? "có" : "không"}`);
      await n.shot("B5c-phieu-bep");
    });

    await step("B6", "HD-08: đóng phiếu, về sơ đồ, thấy bàn và Đơn đang mở", async (n) => {
      await closeReceipt(page);
      n.seen(`Màn gọi món ${await page.getByTestId("order-drawer").count() ? "vẫn mở" : "đã tự đóng"}`);
      const filter = await filterPressed(page);
      const visible = await page.getByTestId(`table-${ID.B01}`).count();
      n.seen(`Bộ lọc vẫn đang là "${filter}". Bàn B01 trên sơ đồ: ${visible ? "thấy" : "KHÔNG THẤY (đang bị lọc ẩn)"}. Các bàn đang hiện: ${(await tablesVisible(page)).join(", ")}`);
      const card = page.locator('[data-testid^="floor-order-"]').filter({ hasText: "B01" });
      n.seen(`Đơn đang mở có B01: ${await card.count() ? `có — "${(await text(card)).slice(0, 60)}"` : "không"}`);
      await n.shot("B6a-sau-khi-gui");
      await page.getByTestId("floor-filter-all").click(); await page.waitForTimeout(300);
      const t = page.getByTestId(`table-${ID.B01}`);
      n.seen(`Bấm Tất cả: B01 hiện lại, trạng thái "${await attr(t, "data-table-status")}", chữ "${await text(t)}"`);
      await n.shot("B6b-bam-tat-ca");
    });

    await step("B7", "HD-09: thử cả hai đường mở lại đơn, rồi Thanh toán", async (n) => {
      await page.locator('[data-testid^="floor-order-"]').filter({ hasText: "B01" }).click();
      await page.getByTestId("order-drawer").waitFor(); await page.waitForTimeout(300);
      n.seen(`Đường 1, Mở đơn hàng ở khung bên phải: mở "${clean(await attr(page.getByTestId("b02-header"), "aria-label"))}"`);
      await page.getByTestId("order-close-button").click(); await page.waitForTimeout(300);
      await page.getByTestId(`table-${ID.B01}`).click();
      await page.getByTestId("order-drawer").waitFor(); await page.waitForTimeout(300);
      n.seen(`Đường 2, bấm bàn: mở "${clean(await attr(page.getByTestId("b02-header"), "aria-label"))}"`);
      await page.getByTestId("submit-order-button-footer").click();
      await page.getByTestId("payment-drawer").waitFor(); await page.waitForTimeout(300);
      n.seen(`Màn "${await text(page.getByTestId("b03-title"))}" — "${await text(page.getByTestId("b03-meta"))}"; Chọn tất cả ${(await page.getByTestId("pay-select-all").isChecked()) ? "bật sẵn" : "tắt"}; phải trả ${await due(page)}đ; tiền khách đưa ${await received(page)}đ; In hóa đơn ${(await page.getByTestId("print-receipt-checkbox").isChecked()) ? "bật sẵn" : "tắt"}`);
      n.seen(`Ở 1366×768, chưa cuộn: nút xóa ${(await reachable(page.getByTestId("payment-key-delete"))) ? "thấy ngay" : "BỊ KHUẤT, phải cuộn"}; dòng Americano ${(await reachable(page.getByTestId("pay-item-line").filter({ hasText: "Americano" }))) ? "thấy ngay" : "BỊ KHUẤT, phải cuộn"}`);
      await n.shot("B7-thanh-toan");
    });

    await step("B8", "HD-10, 11, 12, 13: bỏ Chọn tất cả, chọn một phần, nút + khi đã đủ, trả phần đầu", async (n) => {
      await page.getByTestId("pay-select-all").uncheck(); await page.waitForTimeout(200);
      const am = page.getByTestId("pay-item-line").filter({ hasText: "Americano" });
      await am.getByTestId("pay-item-checkbox").check(); await page.waitForTimeout(200);
      const seq = [await text(am.getByTestId("b03-quantity"))];
      for (let i = 0; i < 3; i++) { await am.getByTestId("pay-item-plus").click(); await page.waitForTimeout(150); seq.push(await text(am.getByTestId("b03-quantity"))); }
      n.seen(`Tick rồi bấm + ba lần: ${seq.join(" → ")}`);
      n.seen(`Phải trả ${await due(page)}đ; tiền khách đưa tự điền ${await received(page)}đ; nút "${await text(page.getByTestId("pay-button-footer"))}"`);
      await n.shot("B8a-chon-mot-phan");
      await page.getByTestId("pay-button-footer").click();
      await page.getByTestId("receipt-preview").waitFor({ timeout: 10000 });
      splitNo = await attr(page.getByTestId("receipt-document"), "data-order-no");
      n.seen(`Bật "Hoá đơn" đơn #${splitNo} (đơn gốc #${origNo}), tổng ${await attr(page.getByTestId("receipt-document"), "data-total")}đ`);
      await n.shot("B8b-hoa-don-phan-dau");
      await closeReceipt(page);
      n.seen(`Màn thanh toán ${await page.getByTestId("payment-drawer").count() ? "vẫn mở" : "đóng"}: "${await text(page.getByTestId("b03-meta"))}"; tổng đơn ${await attr(page.getByTestId("payment-order-summary"), "data-order-total")}đ; phải trả ${await due(page)}đ; "${await text(page.getByTestId("b03-selected-count"))}"; Chọn tất cả ${(await page.getByTestId("pay-select-all").isChecked()) ? "bật" : "tắt"}; thông báo "${await toast(page)}"`);
      await n.shot("B8c-sau-khi-tach");
      const nav = page.getByTestId("nav-report");
      const openedReport = await nav.click({ timeout: 2500 }).then(() => true).catch(() => false);
      n.seen(`Thử bấm Báo cáo khi màn thanh toán đang mở: ${openedReport ? "bấm được" : "không bấm được (màn thanh toán che thanh trái)"}`);
    });

    await step("B9", "HD-14, 15: ở lại màn thanh toán, Chọn tất cả; thử thiếu, đủ, dư; hoàn tất", async (n) => {
      const all = page.getByTestId("pay-select-all");
      await all.check(); await page.waitForTimeout(200);
      const d = Number(await due(page));
      n.seen(`Bấm Chọn tất cả: phải trả ${d}đ; tiền khách đưa tự điền ${await received(page)}đ`);
      const key = async (val) => {
        let k = 0;
        while ((await received(page)) !== "0" && k < 12) { await page.getByTestId("payment-key-delete").click(); k++; }
        for (const c of String(val)) await page.getByTestId(`payment-key-${c}`).click();
        await page.waitForTimeout(150);
        return k;
      };
      const pay = page.getByTestId("pay-button-footer");
      const k = await key(d - 25000);
      n.seen(`Xóa ${k} lần, nhập ${d - 25000} (thiếu): "${await text(page.getByTestId("b03-change"))}"; nút ${(await pay.isDisabled()) ? "bị khóa" : "bấm được"}; nút nhanh ${await page.getByRole("button", { name: "Đúng tiền", exact: true }).count() ? "có" : "ẩn"}`);
      await n.shot("B9a-thieu");
      await key(d);
      n.seen(`Nhập đúng ${d} (đủ): "${await text(page.getByTestId("b03-change"))}"; nút ${(await pay.isDisabled()) ? "bị khóa" : "bấm được"}`);
      await key(d + 25000);
      n.seen(`Nhập ${d + 25000} (dư): "${await text(page.getByTestId("b03-change"))}"; nút ${(await pay.isDisabled()) ? "bị khóa" : "bấm được"}`);
      await n.shot("B9b-du");
      n.seen(`Nút cuối: "${await text(pay)}"`);
      await pay.click();
    });

    await step("B10", "HD-16: hóa đơn cuối, đóng, về sơ đồ, bàn trống", async (n) => {
      await page.getByTestId("receipt-preview").waitFor({ timeout: 10000 });
      const doc = page.getByTestId("receipt-document");
      lastNo = await attr(doc, "data-order-no");
      n.seen(`"Hoá đơn" đơn #${lastNo}, tổng ${await attr(doc, "data-total")}đ, khách đưa ${await attr(doc, "data-received-amount")}đ, trả lại ${await attr(doc, "data-change-amount")}đ`);
      await n.shot("B10a-hoa-don-cuoi");
      await closeReceipt(page);
      const t = page.getByTestId(`table-${ID.B01}`);
      n.seen(`Màn thanh toán ${await page.getByTestId("payment-drawer").count() ? "vẫn mở" : "đã đóng"}; B01 "${await attr(t, "data-table-status")}", chữ "${await text(t)}"; thông báo "${await toast(page)}"`);
      await n.shot("B10b-ban-trong");
    });

    await step("B11", "HD-17: Lịch sử đơn và mức tăng Báo cáo", async (n) => {
      await page.getByTestId("nav-order-history").click();
      await page.getByTestId("order-history-drawer").waitFor(); await page.waitForTimeout(600);
      const rows = await page.locator('[data-testid^="history-row-"][data-table-label="B01"]').evaluateAll((els) => els.map((e) => `${e.textContent.replace(/\s+/g, " ").trim().slice(0, 40)} [${e.dataset.status}, ${e.dataset.total}đ]`));
      n.seen(`Lịch sử, các đơn B01: ${rows.join(" || ")}. Số trên hóa đơn: #${splitNo} và #${lastNo}.`);
      await n.shot("B11a-lich-su");
      await page.getByTestId("order-history-drawer").getByRole("button", { name: "Đóng", exact: true }).first().click({ timeout: 3000 }).catch(() => page.keyboard.press("Escape"));
      await page.waitForTimeout(400);
      await page.getByTestId("nav-report").click();
      await page.getByTestId("report-summary").waitFor(); await page.waitForTimeout(500);
      n.seen(`Báo cáo trước: "${baseRevenue.slice(0, 80)}"; sau: "${(await text(page.getByTestId("report-summary"))).slice(0, 80)}"`);
      await n.shot("B11b-bao-cao");
    });
  });

  // B — Làm đúng nguyên văn bước 8–9: rời màn thanh toán để xem Báo cáo, tắt in hóa đơn, gõ thẳng vào ô tiền.
  await scenario(browser, "B-roi-man-thanh-toan", { width: 1366, height: 768 }, async (page, step) => {
    await step("B1", "Tạo đơn Americano ×2, Croissant trên B01, mở thanh toán", async (n) => {
      await login(page, ID.owner);
      await page.getByTestId(`table-${ID.B01}`).click();
      await page.getByTestId("order-drawer").waitFor(); await page.waitForTimeout(300);
      await page.getByTestId(`menu-item-${ID.americano}`).click(); await page.waitForTimeout(200);
      await page.getByTestId("order-cart-line").filter({ hasText: "Americano" }).getByTestId("order-cart-increase").click();
      await page.getByTestId(`b02-category-${ID.catBanh}`).click(); await page.waitForTimeout(200);
      await page.getByTestId(`menu-item-${ID.croissant}`).click(); await page.waitForTimeout(200);
      await page.getByTestId("submit-order-button-footer").click();
      await page.getByTestId("receipt-preview").waitFor();
      await closeReceipt(page);
      await page.getByTestId(`table-${ID.B01}`).click();
      await page.getByTestId("order-drawer").waitFor(); await page.waitForTimeout(300);
      await page.getByTestId("submit-order-button-footer").click();
      await page.getByTestId("payment-drawer").waitFor(); await page.waitForTimeout(300);
      n.seen(`"${await text(page.getByTestId("b03-meta"))}", phải trả ${await due(page)}đ`);
    });
    await step("B2", "HD-13 nhánh tắt: bỏ ô In hóa đơn, trả một phần", async (n) => {
      await page.getByTestId("print-receipt-checkbox").uncheck();
      await page.getByTestId("pay-select-all").uncheck(); await page.waitForTimeout(200);
      await page.getByTestId("pay-item-line").filter({ hasText: "Americano" }).getByTestId("pay-item-checkbox").check(); await page.waitForTimeout(200);
      await page.getByTestId("pay-button-footer").click(); await page.waitForTimeout(800);
      n.seen(`Tắt in hóa đơn, trả ${"1 Americano"}: cửa sổ hóa đơn ${await page.getByTestId("receipt-preview").count() ? "CÓ hiện" : "không hiện"}; màn thanh toán ${await page.getByTestId("payment-drawer").count() ? "vẫn mở" : "đóng"}; "${await text(page.getByTestId("b03-meta"))}"; "${await text(page.getByTestId("b03-selected-count"))}"; thông báo "${await toast(page)}"`);
      n.seen(`Ô In hóa đơn sau khi trả: ${(await page.getByTestId("print-receipt-checkbox").isChecked()) ? "tự bật lại" : "vẫn tắt"}`);
      await n.shot("B2-tat-in");
    });
    await step("B3", "HD-14: bấm Quay lại, xem Báo cáo, mở lại thanh toán", async (n) => {
      await page.getByTestId("payment-close-button").first().click(); await page.waitForTimeout(500);
      n.seen(`Bấm Quay lại: màn thanh toán ${await page.getByTestId("payment-drawer").count() ? "vẫn mở" : "đóng"}; màn gọi món ${await page.getByTestId("order-drawer").count() ? "mở" : "đóng"}; sơ đồ ${await page.getByTestId("floor-view").isVisible() ? "hiện" : "ẩn"}`);
      await n.shot("B3a-sau-quay-lai");
      if (await page.getByTestId("order-drawer").count()) { await page.getByTestId("order-close-button").click(); await page.waitForTimeout(300); }
      await page.getByTestId("nav-report").click();
      await page.getByTestId("report-summary").waitFor(); await page.waitForTimeout(500);
      n.seen(`Báo cáo: "${(await text(page.getByTestId("report-summary"))).slice(0, 80)}"`);
      await page.getByTestId("report-close-button").first().click(); await page.waitForTimeout(300);
      await page.getByTestId(`table-${ID.B01}`).click();
      await page.getByTestId("order-drawer").waitFor(); await page.waitForTimeout(300);
      await page.getByTestId("submit-order-button-footer").click();
      await page.getByTestId("payment-drawer").waitFor(); await page.waitForTimeout(300);
      n.seen(`Vào lại: Chọn tất cả ${(await page.getByTestId("pay-select-all").isChecked()) ? "BẬT SẴN" : "tắt"}; "${await text(page.getByTestId("b03-selected-count"))}"; phải trả ${await due(page)}đ; In hóa đơn ${(await page.getByTestId("print-receipt-checkbox").isChecked()) ? "bật" : "tắt"}`);
      await n.shot("B3b-vao-lai");
    });
    await step("B4", "HD-15: gõ thẳng vào ô Tiền khách đưa bằng bàn phím máy", async (n) => {
      const d = Number(await due(page));
      const input = page.getByTestId("payment-received-amount");
      await input.click();
      await page.keyboard.press("Control+A");
      await page.keyboard.type(String(d + 5000));
      await page.waitForTimeout(200);
      n.seen(`Bấm vào ô, chọn hết, gõ ${d + 5000}: ô thành ${await received(page)}đ; "${await text(page.getByTestId("b03-change"))}"`);
      await page.getByTestId("print-receipt-checkbox").uncheck().catch(() => {});
      await page.getByTestId("pay-button-footer").click(); await page.waitForTimeout(800);
      n.seen(`Hoàn tất khi tắt in: hóa đơn ${await page.getByTestId("receipt-preview").count() ? "CÓ hiện" : "không hiện"}; màn thanh toán ${await page.getByTestId("payment-drawer").count() ? "vẫn mở" : "đóng"}; thông báo "${await toast(page)}"`);
      await n.shot("B4-go-tien");
    });
  });

  // C — Vai nào có Báo cáo (HD-02).
  for (const [role, who] of [["quan-ly", ID.manager], ["thu-ngan", ID.cashier]]) {
    await scenario(browser, `C-${role}`, { width: 1366, height: 768 }, async (page, step) => {
      await step("NAV", `HD-02: thanh trái của vai ${role}`, async (n) => {
        await login(page, who);
        n.seen(`Thanh trái: ${(await page.locator('[data-testid^="nav-"]').evaluateAll((els) => els.map((e) => e.getAttribute("aria-label")))).join(", ")}`);
      });
    });
  }

  // D — Tải lại trang có giữ dữ liệu không.
  await scenario(browser, "D-tai-lai-trang", { width: 1366, height: 768 }, async (page, step) => {
    await step("F5", "Gửi đơn trên B01 rồi tải lại trang", async (n) => {
      await login(page, ID.owner);
      await page.getByTestId(`table-${ID.B01}`).click();
      await page.getByTestId("order-drawer").waitFor(); await page.waitForTimeout(300);
      await page.getByTestId(`menu-item-${ID.americano}`).click(); await page.waitForTimeout(200);
      await page.getByTestId("submit-order-button-footer").click();
      await page.getByTestId("receipt-preview").waitFor();
      await closeReceipt(page);
      n.seen(`Trước khi tải lại: B01 "${await attr(page.getByTestId(`table-${ID.B01}`), "data-table-status")}"`);
      await page.reload();
      await page.getByTestId("landing-screen").or(page.getByTestId("passcode-screen")).or(page.getByTestId("floor-view")).first().waitFor({ timeout: 30000 });
      const where = (await page.getByTestId("landing-screen").count()) ? "màn mở đầu" : (await page.getByTestId("passcode-screen").count()) ? "màn chọn nhân viên" : "sơ đồ bàn";
      n.seen(`Sau khi tải lại: về ${where}`);
      if (where !== "sơ đồ bàn") await login(page, ID.owner);
      await page.waitForTimeout(400);
      n.seen(`Vào lại: B01 "${await attr(page.getByTestId(`table-${ID.B01}`), "data-table-status")}"`);
    });
  });

  // E — Màn lớn: nút xóa và danh sách món có cần cuộn không (HD-15).
  await scenario(browser, "E-man-1920", { width: 1920, height: 1080 }, async (page, step) => {
    await step("DO", "HD-15: ở 1920×1080 nút xóa có thấy ngay không", async (n) => {
      await login(page, ID.owner);
      await page.getByTestId("floor-order-" + "x").count();
      await page.locator('[data-testid^="floor-order-"]').filter({ hasText: "B02" }).click();
      await page.getByTestId("order-drawer").waitFor(); await page.waitForTimeout(300);
      await page.getByTestId("submit-order-button-footer").click();
      await page.getByTestId("payment-drawer").waitFor(); await page.waitForTimeout(300);
      n.seen(`Ở 1920×1080, chưa cuộn: nút xóa ${(await reachable(page.getByTestId("payment-key-delete"))) ? "thấy ngay" : "BỊ KHUẤT, phải cuộn"}`);
      await n.shot("E-1920");
    });
  });

  await browser.close();
  writeFileSync(join(outDir, "ket-qua.json"), JSON.stringify({ guide: "Đề xuất r02 của Lâm", base: baseURL, finishedAt: new Date().toISOString(), results }, null, 2), "utf8");
}

run().catch((e) => { console.error(e); process.exit(1); });
