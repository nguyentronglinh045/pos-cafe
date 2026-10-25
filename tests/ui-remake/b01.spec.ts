import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { login, openOrders, scenario, tableIds } from "./fixtures";
// This is a responsive/interaction suite, not a pixel reference generator.
import { observePage } from "../../ui-remake/capture.mjs";
const contract = JSON.parse(readFileSync("artifacts/stitch/B01/v3/responsive-contract.proposed.json", "utf8"));
const selectors = ["nav-floor", "nav-lock", "floor-refresh-button", "floor-filter-all", "floor-filter-empty", "floor-filter-occupied", `table-${tableIds.B01}`, `table-${tableIds.B02}`];

async function checkResponsive(page: Page) {
  const result = await observePage(page, { anchors: ["floor-view", "nav-floor", "floor-header", `table-${tableIds.B02}`].map((id) => ({ id, selector: `[data-testid="${id}"]` })), criticalSelectors: selectors.map((id) => ({ id, selector: `[data-testid="${id}"]` })), minTargetPx: 44, requiredFont: "Be Vietnam Pro" });
  expect(result.responsive, JSON.stringify(result.responsive)).toMatchObject({ pass: true });
  expect(result.font.pass).toBe(true);
  expect(await page.evaluate(() => ({ x: document.documentElement.scrollWidth - innerWidth, y: document.documentElement.scrollHeight - innerHeight }))).toEqual({ x: 0, y: 0 });
}

const heightBoundaries = [568, 1024].flatMap(width => [479, 480, 481].map(height => ({ id: `bp-height-${width}-${height}`, width, height })));
for (const vp of [...contract.viewports, ...heightBoundaries]) test(`matrix ${vp.id} ${vp.width}x${vp.height}`, async ({ page }, info) => {
  await page.setViewportSize({ width: vp.width, height: vp.height });
  await login(page);
  await checkResponsive(page);
  // Touch a table after native scroller positioning, then verify its business context.
  const table = page.getByTestId(`table-${tableIds.B02}`);
  await table.scrollIntoViewIfNeeded(); await table.tap();
  await expect(page.getByTestId("order-drawer")).toBeVisible();
  const overlay = await page.getByTestId("order-drawer").evaluate((e) => e.parentElement!.getBoundingClientRect().left);
  // OrderDrawer currently uses PortalDrawer's full-screen default. Preserve it;
  // only callers explicitly opting into workspace use the shared rail offset.
  expect(overlay).toBe(0);
  await page.getByTestId("order-close-button").click();
  await expect(page.getByTestId("order-drawer")).toHaveCount(0);
  await page.getByTestId("floor-filter-empty").click();
  await expect(page.getByTestId(`table-${tableIds.B02}`)).toHaveCount(0);
  await page.getByTestId("floor-filter-occupied").click();
  await expect(page.getByTestId(`table-${tableIds.B01}`)).toHaveCount(0);
  await page.getByTestId("floor-filter-all").click();
  await openOrders(page);
  if (vp.width < 1280) {
    await expect(page.getByRole("dialog", { name: "Đơn đang mở" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Đóng danh sách đơn" })).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(page.locator(".order-card").last()).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Đóng danh sách đơn" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("floor-orders-toggle")).toBeFocused();
    await expect(page.getByTestId("floor-open-orders")).not.toBeVisible();
  }
  await page.getByTestId("floor-refresh-button").focus(); await page.keyboard.press("Enter");
  await expect(page.getByRole("status").filter({ hasText: "Đã làm mới dữ liệu" })).toBeVisible();
  await page.screenshot({ path: `artifacts/b01-responsive/${vp.id}.png`, animations: "disabled" });
  await info.attach("responsive-contract", { body: JSON.stringify({ viewport: vp, modalities: ["pointer", "touch", "keyboard"], status: "PASS" }), contentType: "application/json" });
});

for (const vp of heightBoundaries) test(`height breakpoint retry ${vp.width}x${vp.height}`, async ({ page }) => {
  await page.setViewportSize(vp);await scenario(page,"floor-error");await login(page);
  const retry=page.getByRole("button",{name:"Thử tải lại"});
  await expect(retry).toBeVisible();
  await page.evaluate(()=>Object.assign(window,{__b01Scenario:"default"}));
  await retry.click();await expect(page.getByTestId(`table-${tableIds.B01}`)).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollHeight-innerHeight)).toBe(0);
});

test("responsive width/height sweep and breakpoint transitions", async ({ page }) => {
  test.setTimeout(120_000);
  await login(page);
  const widths = new Set<number>([568, 979, 980, 981, 1279, 1280, 1281, 1920]);
  for (let w = 568; w <= 1920; w += 32) widths.add(w);
  for (const height of [320, 390, 600]) for (const width of [...widths].sort((a,b) => a-b)) {
    if (width <= height) continue;
    await page.setViewportSize({ width, height });
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    const bounds = await page.evaluate(() => {
      const floor = document.querySelector('[data-testid="floor-view"]')!.getBoundingClientRect();
      const canvas = document.querySelector('[data-testid="floor-canvas-viewport"]')!.getBoundingClientRect();
      return { x: document.documentElement.scrollWidth - innerWidth, y: document.documentElement.scrollHeight - innerHeight, floor: floor.height, canvas: canvas.height };
    });
    expect(bounds, `${width}x${height}`).toMatchObject({ x: 0, y: 0 });
    expect(bounds.canvas, `${width}x${height}`).toBeGreaterThan(44);
  }
});

for (const vp of [{width:568,height:320},{width:1024,height:600},{width:1920,height:1080}]) {
  for (const state of ["floor-loading", "floor-error", "empty", "orders-loading", "orders-error", "orders-empty", "boundary", "small-table", "adjacent"])
    test(`${state} ${vp.width}x${vp.height}`, async ({ page }) => {
      await page.setViewportSize(vp); await scenario(page, state); await login(page);
      if (state === "floor-loading") await expect(page.getByText("Đang tải sơ đồ...", {exact:true})).toBeVisible();
      if (state === "floor-error") {
        await expect(page.getByTestId("floor-error-state")).toContainText("Không thể kết nối tới máy chủ.");
        await page.evaluate(() => { Object.assign(window, {__b01Scenario:"default"}); });
        await page.getByRole("button", {name:"Thử tải lại"}).click();
        await expect(page.getByTestId(`table-${tableIds.B01}`)).toBeVisible();
      }
      if (state === "empty") await expect(page.getByText("Chưa có bàn. Vào Sơ đồ để tạo bàn.")).toBeVisible();
      if (state.startsWith("orders-") || state === "boundary") {
        await openOrders(page);
        if (state === "orders-loading") await expect(page.getByText("Đang tải đơn đang mở...")).toBeVisible();
        if (state === "orders-empty") await expect(page.getByText("Chưa có đơn tại bàn.")).toBeVisible();
        if (state === "orders-error") {
          await expect(page.getByText("Không tải được đơn đang mở.")).toBeVisible();
          await page.evaluate(() => { Object.assign(window, {__b01Scenario:"default"}); });
          await page.getByRole("button",{name:"Thử lại",exact:true}).click();
          await expect(page.locator(".order-card")).toHaveCount(3);
        }
        if (state === "boundary") {
          await expect(page.locator(".order-card")).toHaveCount(100);
          await page.locator(".order-card").last().scrollIntoViewIfNeeded();
          const overflow = await page.getByTestId("floor-open-orders").evaluate(e => e.scrollWidth > e.clientWidth);
          expect(overflow).toBe(false);
        }
      }
      if (state === "small-table") {
        const t=page.getByTestId(`table-${tableIds.B01}`); await t.scrollIntoViewIfNeeded();
        const box=(await t.boundingBox())!;expect(box.width).toBeGreaterThanOrEqual(44);expect(box.height).toBeGreaterThanOrEqual(44);
        await t.tap();await expect(page.getByTestId("order-drawer")).toBeVisible();
      }
      if (state === "adjacent") for (const id of [tableIds.B01, tableIds.B02]) {
        const table=page.getByTestId(`table-${id}`);await table.scrollIntoViewIfNeeded();
        const box=(await table.boundingBox())!;expect(box.width).toBeGreaterThanOrEqual(44);expect(box.height).toBeGreaterThanOrEqual(44);
        const hit=await table.evaluate(e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));});expect(hit).toBe(true);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth-innerWidth)).toBe(0);
    });
  test(`cashier navigation/keyboard lock ${vp.width}`, async ({ page }) => {
    await page.setViewportSize(vp);await login(page,true);
    for(const id of ["employees","menu-editor","floor-editor","report","payment-settings","settings"])await expect(page.getByTestId(`nav-${id}`)).toHaveCount(0);
    await expect(page.getByTestId("nav-order-history")).toBeEnabled();
    await page.getByTestId("nav-lock").focus();await page.keyboard.press("Enter");
    await expect(page.getByTestId("passcode-screen")).toBeVisible();
  });

  test(`area2 far-table dirty-exit payment-return ${vp.width}`, async ({ page }) => {
    await page.setViewportSize(vp);await login(page);
    await page.getByRole("button",{name:"Lầu 1",exact:true}).click();
    await expect(page.locator("[data-table-status]")).toHaveCount(6);
    await page.getByRole("button",{name:"Tầng trệt",exact:true}).click();
    const far=page.getByRole("button",{name:/^B08(?: |$)/});await far.scrollIntoViewIfNeeded();await far.tap();
    await expect(page.getByTestId("order-drawer")).toContainText("Bàn B08");
    await page.getByTestId("order-close-button").click();
    await page.getByTestId(`table-${tableIds.B01}`).scrollIntoViewIfNeeded();await page.getByTestId(`table-${tableIds.B01}`).tap();
    await page.getByTestId("menu-item-3e43bb8c-198f-443f-83ab-18696983edaa").click();
    await page.getByTestId("modifier-value-62ca9453-5d44-47f4-8f85-a943d526348d").click();await page.getByTestId("modifier-confirm").click();
    await page.getByTestId("order-close-button").click();await expect(page.getByText("Bỏ đơn chưa gửi?",{exact:true})).toBeVisible();
    await page.getByRole("button",{name:"Tiếp tục chỉnh sửa"}).click();await expect(page.getByTestId("order-drawer")).toBeVisible();
    await page.getByTestId("order-close-button").click();await page.getByRole("button",{name:"Bỏ đơn",exact:true}).click();
    await expect(page.getByTestId("order-drawer")).toHaveCount(0);
    await page.getByTestId(`table-${tableIds.B02}`).scrollIntoViewIfNeeded();await page.getByTestId(`table-${tableIds.B02}`).tap();
    await page.getByTestId("submit-order-button-footer").click();await expect(page.getByTestId("payment-drawer")).toBeVisible();
    await page.getByTestId("b03-back-footer").click();
    await expect(page.getByTestId("payment-drawer")).toHaveCount(0);await expect(page.getByTestId("floor-view")).toBeVisible();
  });
}

test("shared palette update reaches floor and order controls at runtime", async ({ page }) => {
  await page.route(/\/ui-remake\/palette-a-v1\.json(?:\?|$)/,async route=>{
    const response=await route.fetch();const body=(await response.text()).replaceAll("#0F766E","#145A64");
    await route.fulfill({response,body});
  });
  await login(page);
  expect(await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue("--primary").trim())).toBe("#145A64");
  await expect(page.getByTestId("nav-floor")).toHaveCSS("color","rgb(20, 90, 100)");
  await expect(page.getByRole("button",{name:"Tầng trệt",exact:true})).toHaveCSS("background-color","rgb(20, 90, 100)");
  await page.getByTestId(`table-${tableIds.B02}`).click();
  const outlined=page.getByTestId("order-close-button");
  const muted=JSON.parse(readFileSync("ui-remake/palette-a-v1.json","utf8")).colors["--muted"];
  const rgb=`rgb(${[1,3,5].map(i=>parseInt(muted.slice(i,i+2),16)).join(", ")})`;
  await expect(outlined).toHaveCSS("color",rgb); // B02 approved close action uses muted, not primary. MUI propagation is covered by B03 theme test.
  const font=await outlined.evaluate(e=>getComputedStyle(e).fontFamily);expect(font.split(",")[0].replaceAll('"','').trim()).toBe("Be Vietnam Pro");
  const utility=page.getByTestId("submit-order-button-footer");await expect(utility).toHaveCSS("background-color","rgb(20, 90, 100)");
});
