import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";
import { loginAsAdmin, waitForStageFit, waitForTransientOverlays } from "./helpers";

async function expectNodeCenterKeepsLogicalRatio(
  page: Page,
  stageTestId: string,
  nodeTestId: string,
  expected: { x: number; y: number },
) {
  await waitForStageFit(page, stageTestId);
  await page.waitForTimeout(250);

  const stageBox = await page.getByTestId(stageTestId).boundingBox();
  const nodeBox = await page.getByTestId(nodeTestId).boundingBox();

  if (!stageBox || !nodeBox) {
    throw new Error(`Missing geometry for ${stageTestId}/${nodeTestId}`);
  }

  const nodeCenterX = nodeBox.x + nodeBox.width / 2 - stageBox.x;
  const nodeCenterY = nodeBox.y + nodeBox.height / 2 - stageBox.y;

  expect(nodeCenterX / stageBox.width).toBeCloseTo(expected.x / 1600, 2);
  expect(nodeCenterY / stageBox.height).toBeCloseTo(expected.y / 900, 2);
}

async function expectNodeInsideStage(page: Page, stageTestId: string, nodeTestId: string) {
  const visualTolerance = 8;
  const stageBox = await page.getByTestId(stageTestId).boundingBox();
  const nodeBox = await page.getByTestId(nodeTestId).boundingBox();

  if (!stageBox || !nodeBox) {
    throw new Error(`Missing geometry for ${stageTestId}/${nodeTestId}`);
  }

  expect(nodeBox.x).toBeGreaterThanOrEqual(stageBox.x - visualTolerance);
  expect(nodeBox.y).toBeGreaterThanOrEqual(stageBox.y - visualTolerance);
  expect(nodeBox.x + nodeBox.width).toBeLessThanOrEqual(stageBox.x + stageBox.width + visualTolerance);
  expect(nodeBox.y + nodeBox.height).toBeLessThanOrEqual(stageBox.y + stageBox.height + visualTolerance);
}

async function expectReadableFloorLabel(page: Page, nodeTestId: string, label: "name" | "price", minHeight = 10) {
  const labelBox = await page.getByTestId(nodeTestId).locator(`[data-floor-label="${label}"]`).boundingBox();

  if (!labelBox) {
    throw new Error(`Missing ${label} label for ${nodeTestId}`);
  }

  expect(labelBox.height).toBeGreaterThanOrEqual(minHeight);
}

async function expectVisuallyRound(locator: Locator) {
  const geometry = await locator.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      borderRadius: Number.parseFloat(getComputedStyle(element).borderTopLeftRadius),
      height: rect.height,
      width: rect.width,
    };
  });

  expect(Math.abs(geometry.width - geometry.height)).toBeLessThanOrEqual(1);
  expect(geometry.borderRadius).toBeGreaterThanOrEqual(Math.min(geometry.width, geometry.height) / 2);
}

async function openB02PaymentDrawer(page: Page) {
  await page.getByTestId("table-a254abd0-b883-4d5c-85c1-89f660409e02").click();
  await page.getByTestId("submit-order-button-footer").click();
  await expect(page.getByTestId("payment-drawer")).toBeVisible();
}

async function closeCleanDrawer(page: Page, drawerTestId: string) {
  const drawer = page.getByTestId(drawerTestId);
  await drawer.locator("header").getByRole("button", { name: "Đóng" }).click();
  await expect(drawer).toBeHidden();
}

async function cancelDirtyDrawer(page: Page, drawerTestId: string) {
  const drawer = page.getByTestId(drawerTestId);
  await drawer.locator("header").getByRole("button", { name: /^(Hu|Tho)/ }).click();

  const discardButton = page.getByRole("button", { name: "Bỏ thay đổi" });
  await discardButton
    .waitFor({ state: "visible", timeout: 1000 })
    .then(() => discardButton.click())
    .catch(() => undefined);

  await expect(drawer).toBeHidden();
}

test("portrait pre-login flow keeps primary actions reachable", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "portrait", "portrait-only assertion");
  await page.goto("/");
  await expect(page.getByTestId("landing-screen")).toBeVisible();
  await expect(page.getByTestId("rotate-guidance")).toBeHidden();
  await expect(page.getByTestId("go-store-pairing")).toBeInViewport();

  await page.setViewportSize({ width: 390, height: 620 });
  await expect(page.getByTestId("go-store-pairing")).toBeInViewport();
  await page.getByTestId("go-store-pairing").click();

  await expect(page.getByTestId("store-pairing-screen")).toBeVisible();
  await page.getByTestId("store-key-input").fill("0001-X8F3QA");
  await expect(page.getByTestId("go-passcode")).toBeInViewport();
  await page.getByTestId("go-passcode").click();

  await expect(page.getByTestId("passcode-screen")).toBeVisible();
  await expect(page.getByTestId("unlock-button")).toBeInViewport();
  await page.getByTestId("employee-6b7bd350-7db2-4160-8471-cca2668c070d").click();
  for (const digit of ["1", "2", "3", "4", "5", "6"]) {
    await page.getByTestId(`pin-${digit}`).click();
  }
  await page.getByTestId("unlock-button").click();

  await expect(page.getByTestId("rotate-guidance")).toBeVisible();
});

test("POS mock flow keeps primary actions visible on landscape viewports", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "portrait", "landscape-only flow");
  await page.goto("/");
  await expect(page.getByTestId("landing-screen")).toBeVisible();
  await loginAsAdmin(page);

  await page.getByTestId("table-7b035353-73d6-44bc-8ec4-1ab9951f7a58").click();
  await expect(page.getByTestId("order-drawer")).toBeVisible();
  await page.getByTestId("menu-item-3e43bb8c-198f-443f-83ab-18696983edaa").click();
  await expect(page.getByTestId("submit-order-button")).toBeVisible();
});

test("ordering an item with modifiers opens the picker and adds the choice to the cart", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "portrait", "landscape-only flow");
  await page.goto("/");
  await loginAsAdmin(page);

  await page.getByTestId("table-7b035353-73d6-44bc-8ec4-1ab9951f7a58").click();
  await expect(page.getByTestId("order-drawer")).toBeVisible();

  // Cà phê sữa có nhóm tuỳ chọn (Size/Đá) → bấm vào phải hiện popup chọn modifier.
  await page.getByTestId("menu-item-3e43bb8c-198f-443f-83ab-18696983edaa").click();
  await expect(page.getByTestId("modifier-confirm")).toBeVisible();

  await page.getByTestId("modifier-value-62ca9453-5d44-47f4-8f85-a943d526348d").click();
  await page.getByTestId("modifier-confirm").click();

  await expect(page.getByTestId("modifier-confirm")).toBeHidden();
  await expect(page.getByTestId("order-drawer").getByText("Size L")).toBeVisible();
});

test("floor plan stage keeps demo layout readable across landscape viewports", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "portrait", "landscape-only flow");
  await page.goto("/");
  await loginAsAdmin(page);

  await expectNodeCenterKeepsLogicalRatio(page, "floor-stage", "table-7b035353-73d6-44bc-8ec4-1ab9951f7a58", { x: 260, y: 190 });
  await expectNodeCenterKeepsLogicalRatio(page, "floor-stage", "table-5d2847f6-adfe-4594-8673-a8375f27c148", { x: 1180, y: 520 });
  await expectNodeCenterKeepsLogicalRatio(page, "floor-stage", "decor-f7d63df4-e1f5-4435-8ded-8f0865dfd95d", { x: 1480, y: 88 });
  await expectNodeCenterKeepsLogicalRatio(page, "floor-stage", "decor-e7ae25fd-6e51-432a-85aa-6c3829e5b9f8", { x: 300, y: 760 });
  for (const nodeTestId of ["table-7b035353-73d6-44bc-8ec4-1ab9951f7a58", "table-a254abd0-b883-4d5c-85c1-89f660409e02", "table-5d2847f6-adfe-4594-8673-a8375f27c148", "decor-f7d63df4-e1f5-4435-8ded-8f0865dfd95d", "decor-e7ae25fd-6e51-432a-85aa-6c3829e5b9f8"]) {
    await expectNodeInsideStage(page, "floor-stage", nodeTestId);
  }
  await expect(page.getByTestId("table-7b035353-73d6-44bc-8ec4-1ab9951f7a58").getByText("B01", { exact: true })).toBeVisible();
  await expect(page.getByTestId("table-7b035353-73d6-44bc-8ec4-1ab9951f7a58").getByText("Trống", { exact: true })).toHaveCount(0);
  await expect(page.getByTestId("table-7b035353-73d6-44bc-8ec4-1ab9951f7a58").getByText("4 chỗ", { exact: true })).toHaveCount(0);
  await expect(page.getByTestId("table-a254abd0-b883-4d5c-85c1-89f660409e02").getByText("B02", { exact: true })).toBeVisible();
  await expect(page.getByTestId("table-a254abd0-b883-4d5c-85c1-89f660409e02").getByText("125K", { exact: true })).toBeVisible();
  await expect(page.getByTestId("table-a254abd0-b883-4d5c-85c1-89f660409e02").getByText(/#24/)).toHaveCount(0);
  await expectReadableFloorLabel(page, "table-7b035353-73d6-44bc-8ec4-1ab9951f7a58", "name");
  await expectReadableFloorLabel(page, "table-a254abd0-b883-4d5c-85c1-89f660409e02", "price");
  await waitForTransientOverlays(page);
  await page.getByTestId("floor-view").screenshot({ path: testInfo.outputPath("floor-stage-pos.png") });

  await page.getByTestId("nav-floor-editor").click();
  await expect(page.getByTestId("floor-editor")).toBeVisible();
  await expect(page.getByTestId("floor-editor-stage")).toBeVisible();
  await expectNodeCenterKeepsLogicalRatio(page, "floor-editor-stage", "fe-table-7b035353-73d6-44bc-8ec4-1ab9951f7a58", { x: 260, y: 190 });
  await expectNodeCenterKeepsLogicalRatio(page, "floor-editor-stage", "fe-table-5d2847f6-adfe-4594-8673-a8375f27c148", { x: 1180, y: 520 });
  await expectReadableFloorLabel(page, "fe-table-7b035353-73d6-44bc-8ec4-1ab9951f7a58", "name");
  await page.getByTestId("floor-editor-stage").screenshot({ path: testInfo.outputPath("floor-stage-editor.png") });

  const stageFit = await page.getByTestId("floor-editor-stage").evaluate((stage) => {
    const parent = stage.parentElement;
    const stageRect = stage.getBoundingClientRect();
    const parentRect = parent?.getBoundingClientRect();
    return {
      stageWidth: stageRect.width,
      parentWidth: parentRect?.width ?? 0,
      parentScrollWidth: parent?.scrollWidth ?? 0,
      parentClientWidth: parent?.clientWidth ?? 0,
    };
  });

  expect(stageFit.stageWidth).toBeLessThanOrEqual(stageFit.parentWidth + 1);
  expect(stageFit.parentScrollWidth).toBeLessThanOrEqual(stageFit.parentClientWidth + 1);

  if (testInfo.project.name === "phone-landscape" || testInfo.project.name === "small-landscape") {
    const stageBox = await page.getByTestId("floor-editor-stage").boundingBox();
    const inspectorBox = await page.getByTestId("floor-editor-inspector").boundingBox();
    if (!stageBox || !inspectorBox) {
      throw new Error("Missing editor stage or inspector geometry");
    }
    expect(inspectorBox.y).toBeGreaterThanOrEqual(stageBox.y + stageBox.height - 1);
  }
});

test("admin mock modules are reachable without changing URL", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "portrait", "landscape-only flow");
  await page.goto("/");
  await loginAsAdmin(page);
  const initialUrl = page.url();

  await page.getByTestId("nav-menu-editor").click();
  await expect(page.getByTestId("menu-editor")).toBeVisible();
  await expect(page.getByTestId("save-menu-button")).toBeVisible();
  await page.getByTestId("add-item-button").click();
  await expect(page.getByTestId("menu-dirty-badge")).toBeVisible();
  await expect(page.getByTestId("menu-item-name-input")).toBeVisible();
  await cancelDirtyDrawer(page, "menu-editor");

  await page.getByTestId("nav-floor-editor").click();
  await expect(page.getByTestId("floor-editor")).toBeVisible();
  await expect(page.getByTestId("save-floor-button")).toBeVisible();
  await page.getByTestId("add-table-round").click();
  await expect(page.getByTestId("floor-dirty-badge")).toBeVisible();
  await expect(page.getByTestId("fe-table-name-input")).toBeVisible();
  await cancelDirtyDrawer(page, "floor-editor");

  await page.getByTestId("nav-report").click();
  await expect(page.getByTestId("report")).toBeVisible();
  await page.getByTestId("report").getByRole("button", { name: /7/ }).click();
  await expect(page.getByTestId("report").getByText("Doanh thu", { exact: true })).toBeVisible();
  await closeCleanDrawer(page, "report");

  await page.getByTestId("nav-employees").click();
  await expect(page.getByTestId("employees-drawer")).toBeVisible();
  await expect(page.getByTestId("add-employee-button")).toBeVisible();
  await expect(page.getByTestId("employee-row-6b7bd350-7db2-4160-8471-cca2668c070d")).toHaveClass(/bg-pos-primary/);

  const employeeSplitGeometry = await page.getByTestId("employees-split-layout").evaluate((split) => {
    const list = split.querySelector('[data-testid="employee-list-pane"]');
    const detail = split.querySelector('[data-testid="employee-detail-pane"]');
    if (!(list instanceof HTMLElement) || !(detail instanceof HTMLElement)) return null;
    const splitBox = split.getBoundingClientRect();
    const listBox = list.getBoundingClientRect();
    const detailBox = detail.getBoundingClientRect();
    return {
      splitWidth: splitBox.width,
      listRight: listBox.right,
      listWidth: listBox.width,
      detailLeft: detailBox.left,
      detailWidth: detailBox.width,
    };
  });
  if (!employeeSplitGeometry) throw new Error("Missing employee split-pane geometry");
  expect(employeeSplitGeometry.listRight).toBeLessThanOrEqual(employeeSplitGeometry.detailLeft + 1);
  expect(employeeSplitGeometry.detailWidth).toBeGreaterThan(employeeSplitGeometry.listWidth);
  expect(employeeSplitGeometry.splitWidth).toBeLessThanOrEqual((page.viewportSize()?.width ?? 0) + 1);

  await closeCleanDrawer(page, "employees-drawer");

  await expect(page.getByTestId("nav-kitchen")).toHaveCount(0);

  await page.getByTestId("nav-payment-settings").click();
  const payDrawer = page.getByTestId("payment-settings-drawer");
  await expect(payDrawer).toBeVisible();
  await expect(page.getByTestId("save-payment-button")).toBeVisible();
  await payDrawer.getByTestId("payment-method-qr").click();
  await payDrawer.locator("section").getByRole("button", { name: /B.*t/ }).first().click();
  await payDrawer.locator("section").getByRole("button", { name: /QR/ }).click();
  await expect(page.getByTestId("pay-qr-preview")).toBeVisible();
  await cancelDirtyDrawer(page, "payment-settings-drawer");

  await page.getByTestId("nav-settings").click();
  const settingsDrawer = page.getByTestId("settings-drawer");
  await expect(settingsDrawer).toBeVisible();
  await expect(page.getByTestId("save-settings-button")).toBeVisible();
  await settingsDrawer.getByTestId("settings-section-demo").click();
  await page.getByTestId("open-clear-demo").click();
  await expect(page.getByTestId("clear-demo-dialog")).toBeVisible();
  expect(page.url()).toBe(initialUrl);
});

test("floor toolbar actions stay fully inside the floor workspace", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "portrait", "landscape-only floor toolbar");
  await page.goto("/");
  await loginAsAdmin(page);

  const floorView = page.getByTestId("floor-view");
  const floorBox = await floorView.boundingBox();
  if (!floorBox) throw new Error("Missing floor workspace geometry");

  const actions = [
    page.getByTestId("floor-refresh-button"),
    floorView.getByRole("button", { name: "Tất cả", exact: true }),
    floorView.getByRole("button", { name: "Trống", exact: true }),
    floorView.getByRole("button", { name: "Đang phục vụ", exact: true }),
  ];

  for (const action of actions) {
    await expect(action).toBeVisible();
    const actionBox = await action.boundingBox();
    if (!actionBox) throw new Error("Missing floor toolbar action geometry");
    const actionName = (await action.textContent())?.trim() ?? "<unknown>";
    expect(actionBox.x).toBeGreaterThanOrEqual(floorBox.x - 1);
    expect(actionBox.x + actionBox.width, `${actionName} should stay inside the floor workspace`).toBeLessThanOrEqual(
      floorBox.x + floorBox.width + 1,
    );
  }
});

test("sample floor shows varied image decor across both areas", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "desktop-only sample decor check");
  await page.goto("/");
  await loginAsAdmin(page);

  const floorStage = page.getByTestId("floor-stage");
  for (const assetPath of [
    "/floor-assets/walls/img-color-cell3.webp",
    "/floor-assets/decor/deco-fixtures-03.png",
    "/floor-assets/decor/deco-tree-05.png",
    "/floor-assets/decor/deco-seat-08.png",
    "/floor-assets/decor/deco-other-01.png",
  ]) {
    await expect(floorStage.locator(`img[src="${assetPath}"]`)).toBeVisible();
  }

  await page.getByTestId("floor-view").getByRole("button", { name: "Lầu 1", exact: true }).click();
  for (const assetPath of [
    "/floor-assets/walls/img-color-cell7.webp",
    "/floor-assets/decor/deco-tree-20.png",
    "/floor-assets/decor/deco-seat-21.png",
    "/floor-assets/decor/deco-fixtures-18.png",
    "/floor-assets/decor/deco-other-02.png",
  ]) {
    await expect(floorStage.locator(`img[src="${assetPath}"]`)).toBeVisible();
  }
});

test("round tables stay visually circular in the editor and POS floor", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "desktop-only round table workflow");
  await page.goto("/");
  await loginAsAdmin(page);

  await page.getByTestId("nav-floor-editor").click();
  await expect(page.getByTestId("floor-editor")).toBeVisible();
  await page.getByTestId("add-table-round").click();

  const editorTable = page.getByTestId("floor-editor-stage").getByRole("button", { name: /B09/ });
  await expect(editorTable).toBeVisible();
  await expectVisuallyRound(editorTable);

  await page.getByTestId("save-floor-button").click();
  await expect(page.getByTestId("floor-dirty-badge")).toBeHidden();
  await page.getByTestId("floor-editor").locator("header").getByRole("button", { name: "Huỷ" }).click();
  await expect(page.getByTestId("floor-editor")).toBeHidden();

  const posTable = page.getByTestId("floor-stage").getByRole("button", { name: /B09/ });
  await expect(posTable).toBeVisible();
  await expectVisuallyRound(posTable);
});

test("wall, decor and table backgrounds persist from editor to POS floor", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "desktop-only decor workflow");
  await page.goto("/");
  await loginAsAdmin(page);

  await page.getByTestId("nav-floor-editor").click();
  await expect(page.getByTestId("floor-editor")).toBeVisible();

  await page.getByTestId("add-wall-asset").click();
  await expect(page.getByTestId("floor-decor-asset-picker")).toBeVisible();
  await expect(page.getByTestId("decor-asset-wall-09")).toBeVisible();
  await page.getByTestId("decor-asset-wall-04").click();
  await page.getByTestId("confirm-decor-asset").click();
  await expect(page.getByTestId("floor-decor-asset-picker")).toBeHidden();

  await page.getByTestId("add-decor-asset").click();
  await page.getByTestId("decor-group-fixtures").click();
  await expect(page.getByTestId("decor-asset-fixtures-30")).toBeVisible();
  await page.getByTestId("decor-asset-fixtures-30").click();
  await page.getByTestId("confirm-decor-asset").click();

  const editorStage = page.getByTestId("floor-editor-stage");
  await expect(editorStage.getByRole("img", { name: "Tường 04" })).toBeVisible();
  await expect(editorStage.getByRole("img", { name: "Thiết bị 30" })).toBeVisible();

  await page.getByTestId("fe-table-7b035353-73d6-44bc-8ec4-1ab9951f7a58").click();
  await page.getByTestId("change-table-background").click();
  await expect(page.getByTestId("floor-table-background-picker")).toBeVisible();
  await expect(page.getByTestId("table-background-asset-default")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("table-background-asset-table-bg-11")).toBeVisible();
  await page.getByTestId("table-background-asset-table-bg-11").click();
  await page.getByTestId("confirm-table-background").click();
  await expect(page.getByTestId("floor-table-background-picker")).toBeHidden();
  await expect(page.getByTestId("fe-table-7b035353-73d6-44bc-8ec4-1ab9951f7a58")).toHaveCSS("background-image", /table-bg-11\.png/);

  await page.getByTestId("save-floor-button").click();
  await expect(page.getByTestId("floor-dirty-badge")).toBeHidden();
  await page.getByTestId("floor-editor").locator("header").getByRole("button", { name: "Huỷ" }).click();
  await expect(page.getByTestId("floor-editor")).toBeHidden();

  const posStage = page.getByTestId("floor-stage");
  await expect(posStage.getByRole("img", { name: "Tường 04" })).toBeVisible();
  await expect(posStage.getByRole("img", { name: "Thiết bị 30" })).toBeVisible();
  await expect(page.getByTestId("table-7b035353-73d6-44bc-8ec4-1ab9951f7a58")).toHaveCSS("background-image", /table-bg-11\.png/);
});

test("employee permission editor gates payment after re-login", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "desktop-only permission workflow");
  await page.goto("/");
  await loginAsAdmin(page);

  await page.getByTestId("nav-employees").click();
  await expect(page.getByTestId("employees-drawer")).toBeVisible();
  await page.getByTestId("employee-row-22828322-623b-42e7-8a28-a2bdf367c364").click();

  const paymentPermission = page.getByTestId("employee-permission-payment.take");
  await expect(paymentPermission).toBeChecked();
  await paymentPermission.uncheck();
  await page.getByTestId("save-employee-button").click();
  await expect(page.getByText("Đã lưu nhân viên", { exact: true })).toBeVisible();
  await expect(page.getByTestId("save-employee-button")).toBeEnabled();

  await closeCleanDrawer(page, "employees-drawer");
  await page.getByTestId("nav-lock").click();
  await expect(page.getByTestId("passcode-screen")).toBeVisible();
  await page.getByTestId("employee-22828322-623b-42e7-8a28-a2bdf367c364").click();
  for (const digit of ["1", "1", "1", "1", "1", "1"]) {
    await page.getByTestId(`pin-${digit}`).click();
  }
  await page.getByTestId("unlock-button").click();
  await expect(page.getByTestId("floor-view")).toBeVisible();

  await page.getByTestId("table-a254abd0-b883-4d5c-85c1-89f660409e02").click();
  await expect(page.getByTestId("order-drawer")).toBeVisible();
  const paymentAction = page.getByTestId("submit-order-button-footer");
  await expect(paymentAction).toBeDisabled();
  await expect(paymentAction).toHaveAttribute("title", "Không có quyền thanh toán");
});

test("payment drawer exposes complete action for occupied table", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "portrait", "landscape-only flow");
  await page.goto("/");
  await loginAsAdmin(page);
  await openB02PaymentDrawer(page);
  await expect(page.getByTestId("pay-button-footer")).toBeVisible();
});

test("payment drawer keeps secondary text readable on landscape viewports", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "portrait", "landscape-only flow");
  await page.goto("/"); await loginAsAdmin(page); await openB02PaymentDrawer(page);
  const failures = await page.getByTestId("payment-drawer").evaluate(drawer => {
    const selectors = ['header p','.method small','label[for="payment-received-amount"]','#payment-received-amount + span','.quick button','.tag','article p','.unit','.row','label.print'];
    return selectors.flatMap(selector => {
      const elements = Array.from(drawer.querySelectorAll<HTMLElement>(selector));
      return elements.length === 0 ? [{selector,reason:"missing"}] : elements.filter(e => parseFloat(getComputedStyle(e).fontSize)<12).map(() => ({selector,reason:"font<12"}));
    });
  });
  expect(failures).toEqual([]);
});

test("payment drawer keeps readable controls across approved landscape breakpoints", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "covers multiple landscape breakpoints in one run");
  await page.goto("/"); await loginAsAdmin(page); await openB02PaymentDrawer(page);
  for (const viewport of [{width:568,height:320},{width:844,height:390},{width:1024,height:600},{width:1101,height:600},{width:1440,height:900}]) {
    await page.setViewportSize(viewport);
    await expect(page.getByTestId("b03-title")).toHaveText("Thanh toán đơn hàng");
    const result = await page.getByTestId("payment-drawer").evaluate(drawer => {
      const fontFailures = Array.from(drawer.querySelectorAll<HTMLElement>('button,label,h1,h2,h3,p,span,strong,input,small')).filter(e => e.getBoundingClientRect().width>0 && e.getBoundingClientRect().height>0 && parseFloat(getComputedStyle(e).fontSize)<12).map(e=>e.textContent);
      return {fontFailures,overflow:Math.max(0,document.documentElement.scrollWidth-innerWidth),keypad:drawer.querySelectorAll('[data-testid="payment-keypad"] button').length,itemsScroll:getComputedStyle(drawer.querySelector('[data-testid="payment-order-items"]')!).overflowY};
    });
    expect(result.fontFailures).toEqual([]);expect(result.overflow).toBeLessThanOrEqual(1);expect(result.keypad).toBe(12);expect(result.itemsScroll).toBe("auto");
    await expect(page.getByTestId("pay-button-footer")).toBeVisible();
    const footer=await page.getByTestId("pay-button-footer").boundingBox();expect(footer?.height).toBeGreaterThanOrEqual(44);
  }
  const amountInput=page.getByTestId("payment-received-amount");
  await expect(amountInput).toHaveValue("125.000");await amountInput.fill("1234567");await expect(amountInput).toHaveValue("1.234.567");await page.getByTestId("payment-key-delete").click();await expect(amountInput).toHaveValue("123.456");
});
