import { expect, type Page } from "@playwright/test";
export const tableIds = { B01: "7b035353-73d6-44bc-8ec4-1ab9951f7a58", B02: "a254abd0-b883-4d5c-85c1-89f660409e02" };

/** Browser-only module response fixtures. Nothing is added to application runtime. */
export async function scenario(page: Page, state: string) {
  await page.addInitScript((value) => { Object.assign(window, { __b01Scenario: value }); }, state);
  await page.route(/\/src\/adapters\/mock\/mockData\.ts(?:\?|$)/, async (route) => {
    const response = await route.fetch();
    let patch = "";
    if (state === "empty") patch = "mockFloorPlan.tables.length=0;mockFloorPlan.decorItems.length=0;mockOrders.length=0;";
    if (state === "orders-empty") patch = "mockOrders.length=0;";
    if (state === "boundary") patch = `
      mockFloorPlan.areas[0].name='Khu vực '+ 'rất dài '.repeat(16);
      mockEmployees[0].name='Nhân viên '+ 'rất dài '.repeat(16);
      mockSettings.displayName='Quán cà phê '+ 'rất dài '.repeat(16);
      mockFloorPlan.tables[0].name='Bàn '+ 'rất dài '.repeat(16);
      const original=mockOrders[0];mockOrders.length=0;
      for(let i=0;i<100;i++)mockOrders.push({...structuredClone(original),id:crypto.randomUUID(),orderNo:100+i,orderType:'takeaway',tableId:null,total:999999999});`;
    if (state === "small-table") patch = "mockFloorPlan.tables[0].width=40;mockFloorPlan.tables[0].height=40;mockFloorPlan.tables[0].rotation=30;";
    if (state === "adjacent") patch = "mockFloorPlan.tables[0].width=40;mockFloorPlan.tables[0].height=40;mockFloorPlan.tables[0].rotation=0;mockFloorPlan.tables[1].width=40;mockFloorPlan.tables[1].height=40;mockFloorPlan.tables[1].rotation=0;mockFloorPlan.tables[1].posX=340;mockFloorPlan.tables[1].posY=190;";
    await route.fulfill({ response, body: await response.text() + "\n" + patch });
  });
  // Floor and open orders share the same protected operational projection.
  await page.route(/\/src\/adapters\/mock\/permissionRepos\.ts(?:\?|$)/, async route => {
    const response = await route.fetch();
    const patch = `const b01Read=MockPermissionReadRepo.prototype.getFloorOperational;
      MockPermissionReadRepo.prototype.getFloorOperational=async function(...args){
        if(['floor-loading','orders-loading'].includes(window.__b01Scenario))return new Promise(()=>{});
        if(['floor-error','orders-error'].includes(window.__b01Scenario))throw new Error('Không thể kết nối tới máy chủ.');
        return b01Read.apply(this,args);
      };`;
    await route.fulfill({response,body:await response.text()+"\n"+patch});
  });
}

export async function login(page: Page, cashier = false) {
  await page.clock.setFixedTime(new Date("2026-10-19T03:00:00Z"));
  await page.goto("/");
  await page.getByTestId("go-store-pairing").click();
  await page.getByTestId("store-key-input").fill("0001-X8F3QA");
  await page.getByTestId("go-passcode").click();
  await page.getByTestId(cashier ? "employee-30000000-0000-4000-8000-000000000013" : "employee-30000000-0000-4000-8000-000000000011").click();
  for (const digit of cashier ? "111111" : "123456") await page.getByTestId(`pin-${digit}`).click();
  await page.getByTestId("unlock-button").click();
  await expect(page.getByTestId("floor-view")).toBeVisible();
  await page.getByTestId("nav-floor").click();
  await page.locator(":root:not(:has([data-rht-toaster] > div)) [data-testid='floor-view']").waitFor({ timeout: 20_000 });
  await page.evaluate(() => document.fonts.ready);
}

export async function openOrders(page: Page) {
  if (page.viewportSize()!.width < 1280) await page.getByTestId("floor-orders-toggle").click();
  await expect(page.getByTestId("floor-open-orders")).toBeVisible();
}
