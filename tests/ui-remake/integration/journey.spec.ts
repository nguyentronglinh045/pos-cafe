import { test, expect, type Page } from "@playwright/test";
import { loginAsAdmin } from "../../smoke/helpers";

const B01 = "7b035353-73d6-44bc-8ec4-1ab9951f7a58", B02 = "a254abd0-b883-4d5c-85c1-89f660409e02";
async function ready(page: Page, width: number, height: number) {
  await page.setViewportSize({ width, height }); await page.goto("/"); await loginAsAdmin(page);
  await page.mouse.move(-1, -1);
  await page.locator(':root:not(:has([data-rht-toaster] > div)) [data-testid="floor-view"]').waitFor({ timeout: 15000 });
}
async function open(page: Page, id: string) {
  const table = page.getByTestId(`table-${id}`); await table.scrollIntoViewIfNeeded(); await table.tap();
  await expect(page.getByTestId("order-drawer")).toBeVisible();
}
for (const [width, height] of [[568, 320], [1920, 1080]]) {
  test(`floor to order dirty-exit to split/full payment to floor ${width}`, async ({ page }, info) => {
    // Browser fixture only: swap B02 with a vacant upstairs slot, keeping valid geometry.
    await page.route(/\/src\/adapters\/mock\/mockData\.ts(?:\?|$)/,async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+"\n{const b=mockFloorPlan.tables.find(t=>t.id==='"+B02+"'),l=mockFloorPlan.tables.find(t=>t.areaId===mockFloorPlan.areas[1].id),a={areaId:b.areaId,posX:b.posX,posY:b.posY,width:b.width,height:b.height};Object.assign(b,{areaId:l.areaId,posX:l.posX,posY:l.posY,width:l.width,height:l.height});Object.assign(l,a);}"});});
    await ready(page, width, height);
    const chosenArea=page.getByRole("button",{name:"Lầu 1",exact:true});
    await chosenArea.tap(); await expect(page.locator("[data-table-status]")).toHaveCount(6);
    const coordinates = await page.locator("[data-table-status]").evaluateAll(elements => elements.map(e => ({ id: (e as HTMLElement).dataset.testid, x: (e as HTMLElement).style.left, y: (e as HTMLElement).style.top })));
    await expect(chosenArea).toHaveAttribute("aria-pressed","true");
    await open(page, B02);
    await page.getByTestId("menu-item-80cfbd5a-a538-4da6-888d-2f732b7b8e2d").click();
    await expect(page.getByTestId("order-total-amount")).toHaveAttribute("data-amount", "160000");
    await page.getByTestId("order-close-button").click();
    await expect(page.getByText("Bỏ đơn chưa gửi?", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Tiếp tục chỉnh sửa" }).click();
    await expect(page.getByTestId("order-total-amount")).toHaveAttribute("data-amount", "160000");
    await page.getByTestId("order-close-button").click(); await page.getByRole("button", { name: "Bỏ đơn", exact: true }).click();
    await expect(page.getByTestId("order-drawer")).toHaveCount(0);
    await open(page, B02); await expect(page.getByTestId("order-total-amount")).toHaveAttribute("data-amount", "125000");
    await expect(chosenArea).toHaveAttribute("aria-pressed","true");
    await page.getByTestId("submit-order-button-footer").click();
    await expect(page.getByTestId("payment-drawer")).toBeVisible();
    await page.getByTestId("pay-select-all").uncheck(); await page.getByTestId("pay-item-checkbox").first().check();
    await expect(page.getByTestId("payment-order-summary")).toHaveAttribute("data-amount-due", "29000");
    await page.getByTestId("payment-received-amount").fill("50000");
    await page.getByTestId("pay-button-footer").click();
    const receipt = page.getByTestId("receipt-document");
    await expect(receipt).toHaveAttribute("data-total", "29000"); await expect(receipt).toHaveAttribute("data-change-amount", "21000");
    await page.getByTestId("receipt-close-header").click();
    await expect(chosenArea).toHaveAttribute("aria-pressed","true");
    await expect(page.getByTestId("payment-order-summary")).toHaveAttribute("data-order-total", "96000");
    await expect(page.getByTestId("payment-order-summary")).toHaveAttribute("data-amount-due", "0");
    await page.getByTestId("pay-select-all").check(); await page.getByTestId("payment-received-amount").fill("100000");
    await page.getByTestId("pay-button-footer").click();
    await expect(receipt).toHaveAttribute("data-total", "96000"); await expect(receipt).toHaveAttribute("data-change-amount", "4000");
    await expect(page.getByTestId("payment-drawer")).toHaveCount(0);
    await expect(page.locator("body")).toHaveClass(/ui-remake/);
    await page.getByTestId("receipt-close-header").focus(); await page.keyboard.press("Escape");
    await expect(page.getByTestId("receipt-preview")).toHaveCount(0);
    await expect(page.getByTestId(`table-${B02}`)).toHaveAttribute("data-table-status", "empty");
    await expect(chosenArea).toHaveAttribute("aria-pressed", "true");
    expect(await page.locator("[data-table-status]").evaluateAll(elements => elements.map(e => ({ id: (e as HTMLElement).dataset.testid, x: (e as HTMLElement).style.left, y: (e as HTMLElement).style.top })))).toEqual(coordinates);
    await page.screenshot({ path: info.outputPath("after-payments.png") });
  });

  test(`floor to new modifier order to kitchen to payment ${width}`, async ({ page }) => {
    await ready(page, width, height); await open(page, B01);
    await page.getByTestId("menu-item-3e43bb8c-198f-443f-83ab-18696983edaa").click();
    await page.getByTestId("modifier-value-62ca9453-5d44-47f4-8f85-a943d526348d").click(); await page.getByTestId("modifier-confirm").click();
    await expect(page.getByTestId("order-cart-line")).toHaveAttribute("data-unit-price", "36000");
    await page.getByTestId("submit-order-button-footer").click();
    await expect(page.getByTestId("receipt-document")).toHaveAttribute("data-variant", "kitchen");
    await expect(page.getByTestId("receipt-document")).toHaveAttribute("data-total", "36000");
    await page.getByTestId("receipt-close-header").click();
    await expect(page.getByTestId(`table-${B01}`)).toHaveAttribute("data-order-total", "36000");
    await open(page, B01); await page.getByTestId("submit-order-button-footer").click();
    await expect(page.getByTestId("payment-order-summary")).toHaveAttribute("data-amount-due", "36000");
    await page.getByTestId("payment-received-amount").fill("50000"); await page.getByTestId("pay-button-footer").click();
    await expect(page.getByTestId("receipt-document")).toHaveAttribute("data-total", "36000");
    await expect(page.getByTestId("receipt-document")).toHaveAttribute("data-change-amount", "14000");
    await page.getByTestId("receipt-close-header").click();
    await expect(page.getByTestId(`table-${B01}`)).toHaveAttribute("data-table-status", "empty");
  });
}
