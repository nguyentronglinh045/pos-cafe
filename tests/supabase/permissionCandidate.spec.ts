import { expect, test, type Page, type Response, type Route } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import pg from "pg";
import { EMPLOYEE_IDS, STORE_IDS, runtimeProof } from "../../scripts/permission-identity-runtime.mjs";
import { candidateEnvironment, installStoreSession } from "./permissionCandidateEnvironment.ts";

const PIN = "384729";
// A complete PNG, including compressed pixel data and IEND, rather than the
// eight-byte signature used by the separate HTTP boundary fixture.
const MENU_IMAGE_PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");

/** Explicit synthetic setup: this existing fixture requested initial demo data.
 * The application then claims/runs it through the real owner login lifecycle. */
async function prepareInitialDemoFixture() {
  const env = candidateEnvironment(); runtimeProof();
  const db = new pg.Client({ connectionString: env.dsn }); await db.connect();
  try {
    await db.query('begin');
    const marker = (await db.query('select current_database() db,marker,engine,store_ids from private.idempotency_test_environment where singleton for update')).rows;
    if (marker.length !== 1 || marker[0].db !== 'postgres' || marker[0].marker !== env.marker
      || marker[0].engine !== 'supabase-identity-v1' || JSON.stringify(marker[0].store_ids) !== JSON.stringify(STORE_IDS)) throw new Error('SEED_FIXTURE_BINDING_MISMATCH');
    const stores = (await db.query('select id from public.stores order by id')).rows.map(row => row.id);
    if (JSON.stringify(stores) !== JSON.stringify(STORE_IDS)) throw new Error('SEED_FIXTURE_SCOPE_CHANGED');
    const previous = (await db.query('select workflow_id,status from private.initial_seed_workflows where store_id=$1 for update', [STORE_IDS[0]])).rows[0];
    if (previous && previous.status !== 'skipped') throw new Error('FRESH_INITIAL_SEED_FIXTURE_REQUIRED');
    const workflowId = previous?.workflow_id ?? randomUUID();
    if (previous) await db.query("update private.initial_seed_workflows set requested=true,status='pending' where workflow_id=$1", [workflowId]);
    else await db.query("insert into private.initial_seed_workflows(workflow_id,store_id,requested,template_version,status,created_at,updated_at) values($1,$2,true,1,'pending',private.write_clock(),private.write_clock())", [workflowId, STORE_IDS[0]]);
    for (const stage of ['employee', 'menu', 'floor']) await db.query('insert into private.initial_seed_stages(workflow_id,stage,stage_id) values($1,$2,$3)', [workflowId, stage, randomUUID()]);
    await db.query('commit');
  } catch (error) { await db.query('rollback'); throw error; }
  finally { await db.end(); }
}

async function login(page: Page, employeeId: string) {
  await installStoreSession(page); await page.goto("/");
  await expect(page.getByTestId("passcode-screen")).toBeVisible({ timeout: 15_000 });
  await page.getByTestId(`employee-${employeeId}`).click();
  for (const digit of PIN) await page.getByTestId(`pin-${digit}`).click();
  await page.getByTestId("unlock-button").click();
  await expect(page.getByTestId("floor-view")).toBeVisible({ timeout: 15_000 });
}

async function closeEmployees(page: Page) { await page.getByTestId("employees-close-button").click(); await expect(page.getByTestId("employees-drawer")).toBeHidden(); }

async function closeDrawerFromNav(page: Page) {
  if (await page.getByTestId("menu-editor").isVisible()) await page.getByRole("button", { name: "Thoát", exact: true }).click();
  else if (await page.getByTestId("floor-editor").isVisible()) await page.getByRole("button", { name: "Huỷ", exact: true }).click();
  else if (await page.getByTestId("settings-drawer").isVisible()) await page.getByRole("button", { name: "Huỷ", exact: true }).click();
  else throw new Error("SUPPORTED_DRAWER_NOT_VISIBLE");
  await expect(page.getByTestId("floor-view")).toBeVisible();
}

async function expectSavedRpc(page: Page, name: string, action: () => Promise<void>) {
  const response = page.waitForResponse(r => r.url().includes(`/rpc/${name}`));
  await action();
  const saved = await response;
  expect(saved.ok()).toBeTruthy();
  expect(await saved.json()).toMatchObject({ ok: true });
}

test("candidate activation supports owner roster, floor, payment and first receipt preview", async ({ page }) => {
  await login(page, EMPLOYEE_IDS[0]);
  await page.getByTestId("nav-employees").click();
  await expect(page.getByTestId("employee-list-pane").locator('[data-testid^="employee-row-"]')).toHaveCount(3);
  await closeEmployees(page);
  const occupied = page.locator('[data-testid^="table-"]').filter({ has: page.locator('[data-floor-label="price"]') }).first();
  await occupied.click(); await expect(page.getByTestId("order-drawer")).toBeVisible();
  await page.getByTestId("submit-order-button-footer").click(); await expect(page.getByTestId("payment-drawer")).toBeVisible();
  await page.getByTestId("payment-received-amount").fill("50000"); await page.getByTestId("pay-button-footer").click();
  await expect(page.getByTestId("receipt-preview")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("receipt-preview")).toContainText("Fixture coffee");
});

test("owner permission change reaches a live cashier context within five seconds", async ({ browser }, testInfo) => {
  const ownerContext = await browser.newContext(), cashierContext = await browser.newContext();
  try {
    const owner = await ownerContext.newPage(), cashier = await cashierContext.newPage();
    const realtimeFrames: string[] = [];
    let measuring = false, signalReceivedAt: number | null = null;
    const decode = (frame: string) => { const value = JSON.parse(frame); return Array.isArray(value) ? { event: value[3], payload: value[4] } : value; };
    cashier.on("websocket", socket => socket.on("framereceived", event => {
      if (typeof event.payload !== "string") return;
      realtimeFrames.push(event.payload);
      const frame = decode(event.payload), data = frame.payload?.data;
      if (measuring && frame.event === "postgres_changes" && data?.table === "store_change_signals"
        && data.record?.topic === "permission" && data.record.target_id === EMPLOYEE_IDS[2]) signalReceivedAt ??= performance.now();
    }));
    await login(owner, EMPLOYEE_IDS[0]); await login(cashier, EMPLOYEE_IDS[2]);
    await expect.poll(() => realtimeFrames.some(value => {
      const frame = decode(value); return frame.event === "system" && frame.payload?.status === "ok" && frame.payload?.extension === "postgres_changes";
    }), { timeout: 15_000 }).toBe(true);
    await owner.getByTestId("nav-employees").click(); await owner.getByTestId(`employee-row-${EMPLOYEE_IDS[2]}`).click();
    const payment = owner.getByTestId("permission-payment.take");
    if (!(await payment.isChecked())) { await payment.check(); const saved = owner.waitForResponse(r => r.url().includes("/rpc/permission_admin_update")); await owner.getByTestId("save-employee-button").click(); await expect((await saved).ok()).toBeTruthy(); }
    const cashierTable = cashier.locator('[data-testid^="table-"]').first(), occupied = await cashierTable.locator('[data-floor-label="price"]').count() > 0; await cashierTable.click();
    if (!occupied) {
      await cashier.getByTestId("order-drawer").locator('[data-testid^="menu-item-"]').first().click();
      const modifier = cashier.getByTestId("modifier-confirm"); if (await modifier.isVisible()) await modifier.click();
      await cashier.getByTestId("submit-order-button-footer").click();
      const kitchenPreview = cashier.getByTestId("receipt-preview"); await expect(kitchenPreview).toBeVisible({ timeout: 10_000 }); await kitchenPreview.getByTestId("receipt-close-footer").click();
      await cashierTable.click();
    }
    await expect(cashier.getByTestId("submit-order-button-footer")).toBeEnabled({ timeout: 5_000 });
    await cashier.getByTestId("submit-order-button-footer").click(); await expect(cashier.getByTestId("payment-drawer")).toBeVisible();
    await payment.uncheck(); measuring = true;
    await expectSavedRpc(owner, "permission_admin_update", () => owner.getByTestId("save-employee-button").click());
    try {
      // The approved five-second budget starts at signal receipt. The separate
      // TC55 gate records the full browser clock chain and lost-signal fallback.
      await expect.poll(() => signalReceivedAt, { timeout: 10_000 }).not.toBeNull();
      const remaining = 5_000 - (performance.now() - signalReceivedAt!);
      await expect(cashier.getByTestId("payment-drawer")).toBeHidden({ timeout: Math.max(1, remaining) });
      expect(performance.now() - signalReceivedAt!).toBeLessThanOrEqual(5_000);
    }
    finally { await testInfo.attach("cashier-realtime-received.json", { body: JSON.stringify(realtimeFrames), contentType: "application/json" }); }
    await expect(cashier.getByTestId("floor-view")).toBeVisible();
  } finally { await ownerContext.close(); await cashierContext.close(); }
});

test("owner creates waiter and real UI hides protected administration and reporting", async ({ browser, page }) => {
  await login(page, EMPLOYEE_IDS[0]);
  for (const id of ["nav-employees", "nav-menu-editor", "nav-floor-editor", "nav-report", "nav-settings"]) await expect(page.getByTestId(id)).toBeVisible();
  await page.getByTestId("nav-employees").click(); await page.getByTestId("add-employee-button").click();
  await page.getByTestId("employee-name-input").fill("Waiter E2E"); await page.getByTestId("employee-role-select").selectOption("waiter");
  await page.getByTestId("employee-pin-input").fill("456789"); await page.getByTestId("employee-confirm-pin-input").fill("456789");
  const created = page.waitForResponse(r => r.url().includes("/rpc/permission_admin_create")); await page.getByTestId("save-employee-button").click(); expect((await created).ok()).toBeTruthy();
  const row = page.locator('[data-testid^="employee-row-"]').filter({ hasText: "Waiter E2E" }); await expect(row).toBeVisible();
  const waiterId = (await row.getAttribute("data-testid"))!.slice("employee-row-".length);
  const context = await browser.newContext(); try {
    const waiter = await context.newPage(); await installStoreSession(waiter); await waiter.goto("/"); await waiter.getByTestId(`employee-${waiterId}`).click();
    for (const digit of "456789") await waiter.getByTestId(`pin-${digit}`).click(); await waiter.getByTestId("unlock-button").click(); await expect(waiter.getByTestId("floor-view")).toBeVisible();
    for (const id of ["nav-employees", "nav-menu-editor", "nav-floor-editor", "nav-report", "nav-settings"]) await expect(waiter.getByTestId(id)).toHaveCount(0);
  } finally { await context.close(); }
});

test("owner persists menu, floor and store settings changes through real candidate RPCs", async ({ page }, testInfo) => {
  await login(page, EMPLOYEE_IDS[0]);

  await page.getByTestId("nav-menu-editor").click();
  const menuCard = page.locator('[data-testid^="menu-edit-card-"]').first();
  const itemId = (await menuCard.getAttribute("data-testid"))!.slice("menu-edit-card-".length);
  await menuCard.click();
  const nameInput = page.getByTestId("menu-item-name-input");
  const originalName = await nameInput.inputValue();
  const changedName = `${originalName} E2E`;
  const price = Number(await page.getByLabel("Giá (VND)", { exact: true }).inputValue());
  const priceText = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(price);
  await nameInput.fill(changedName);
  await page.getByLabel("Chọn ảnh món", { exact: true }).setInputFiles({ name: "candidate-menu.png", mimeType: "image/png", buffer: MENU_IMAGE_PNG });
  const { api } = candidateEnvironment();
  const gatewayUrl = `${api}/functions/v1/menu-image-gateway`;
  const preflights: Response[] = [];
  const observePreflight = (response: Response) => {
    if (response.url() === gatewayUrl && response.request().method() === "OPTIONS") preflights.push(response);
  };
  page.on("response", observePreflight);
  const uploadResponse = page.waitForResponse(response => response.url() === gatewayUrl && response.request().method() === "POST");
  const menuRequest = page.waitForRequest(request => request.url() === `${api}/rest/v1/rpc/apply_menu_changes` && request.method() === "POST");
  let uploadHandle: string;
  try {
    const [, uploaded, savedRequest] = await Promise.all([
      expectSavedRpc(page, "apply_menu_changes", () => page.getByTestId("save-menu-button").click()),
      uploadResponse, menuRequest,
    ]);
    expect(uploaded.status()).toBe(201);
    const clientInfo = uploaded.request().headers()["x-client-info"] ?? "";
    const lockedVersion: string = JSON.parse(readFileSync("package-lock.json", "utf8")).packages["node_modules/@supabase/supabase-js"].version;
    expect(clientInfo.split(/[\/; ]/)).toContain(lockedVersion);
    expect(clientInfo).toMatch(/(?:supabase-js-web\/|(?:^|[; ])runtime=web(?:;|$))/);
    expect(uploaded.request().headers()["x-pos-permission-contract"]).toBeUndefined();
    const body = await uploaded.json();
    expect(body).toMatchObject({ ok: true, data: { uploadHandle: expect.stringMatching(/^[0-9a-f-]{36}$/) } });
    uploadHandle = body.data.uploadHandle;
    expect(savedRequest.postDataJSON().p_changes.imageChanges).toEqual([{ itemId, uploadHandle }]);
    const options = await Promise.all(preflights.map(async response => {
      const headers = await response.allHeaders();
      expect(response.status()).toBe(204);
      expect(headers["access-control-allow-origin"]).toBe("*");
      const allowed = (headers["access-control-allow-headers"] ?? "").toLowerCase().split(",").map(value => value.trim());
      const methods = (headers["access-control-allow-methods"] ?? "").toUpperCase().split(",").map(value => value.trim());
      expect(methods).toContain("POST");
      for (const header of ["authorization", "apikey", "x-client-info", "x-pos-employee-token"]) expect(allowed).toContain(header);
      return { status: response.status(), allowOrigin: headers["access-control-allow-origin"], allowHeaders: allowed, allowMethods: methods };
    }));
    await testInfo.attach("menu-image-browser-transport.json", { body: JSON.stringify({ functionPath: "/functions/v1/menu-image-gateway", clientInfo, postStatus: uploaded.status(),
      // Some browser engines hide automatic preflight from Playwright events.
      // A missing event is explicitly unobserved, never an OPTIONS PASS.
      preflight: options.length ? "OBSERVED" : "NOT_OBSERVABLE", options }), contentType: "application/json" });
  } finally { page.off("response", observePreflight); }
  // This committed upload is owned by the isolated candidate-e2e stage. Its
  // post-stage measurement/cleanup must discover exact private registry keys
  // for the two guarded STORE_IDS and remove their bytes before parent observe.
  // On browser-stage failure, T04 must fail and close/reclaim its owned runtime;
  // the success-only stage helper is not per-test or standalone-case cleanup.
  const publicUrl = `${api}/functions/v1/menu-image-public/${uploadHandle}`;
  const savedImage = page.getByTestId("menu-editor-detail-pane").getByRole("img", { name: `Ảnh ${changedName}`, exact: true });
  await expect(savedImage).toHaveAttribute("src", publicUrl);
  await expect.poll(() => savedImage.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
  await closeDrawerFromNav(page);
  await page.getByTestId("nav-menu-editor").click();
  await page.locator('[data-testid^="menu-edit-card-"]').filter({ hasText: changedName }).click();
  await expect(page.getByTestId("menu-item-name-input")).toHaveValue(changedName);
  await expect(savedImage).toHaveAttribute("src", publicUrl);
  await expect.poll(() => savedImage.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
  await closeDrawerFromNav(page);

  await page.getByTestId("nav-floor-editor").click();
  const table = page.locator('[data-testid^="fe-table-"]').first();
  await table.click();
  const tableName = page.getByTestId("fe-table-name-input");
  const changedTableName = `${await tableName.inputValue()}E`;
  await tableName.fill(changedTableName);
  await expectSavedRpc(page, "apply_floor_changes", () => page.getByTestId("save-floor-button").click());
  await closeDrawerFromNav(page);
  await page.getByTestId("nav-floor-editor").click();
  await page.locator('[data-testid^="fe-table-"]').filter({ hasText: changedTableName }).click();
  await expect(page.getByTestId("fe-table-name-input")).toHaveValue(changedTableName);
  await closeDrawerFromNav(page);

  await page.getByTestId("nav-settings").click();
  const storeName = page.getByTestId("settings-name-input");
  const changedStoreName = `${await storeName.inputValue()} E2E`;
  await storeName.fill(changedStoreName);
  await expectSavedRpc(page, "update_store_settings", () => page.getByTestId("save-settings-button").click());
  await closeDrawerFromNav(page);
  await page.getByTestId("nav-settings").click();
  await expect(page.getByTestId("settings-name-input")).toHaveValue(changedStoreName);
  await closeDrawerFromNav(page);

  // TC47 consumer-only variant: real upload/save/render above; this one exact
  // image response is injected at the browser boundary. It does not prove a
  // Storage/DB fault, cache TTL, or the separate real-origin failure variants.
  const orderTable = page.locator('[data-testid^="table-"]').first();
  await orderTable.click();
  await page.getByPlaceholder("Tìm món...").fill(changedName);
  const orderCard = page.getByTestId(`menu-item-${itemId}`);
  await expect(orderCard.getByRole("img")).toHaveAttribute("src", publicUrl);
  await expect.poll(() => orderCard.getByRole("img").evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
  const imageBox = orderCard.locator(":scope > div").first();
  const imageBoxBefore = await imageBox.boundingBox(), cardBefore = await orderCard.boundingBox();
  expect(imageBoxBefore).not.toBeNull(); expect(cardBefore).not.toBeNull();
  expect(imageBoxBefore!.width).toBeGreaterThan(0); expect(imageBoxBefore!.height).toBeGreaterThan(0);
  await page.getByTestId("order-close-button").click();
  await expect(page.getByTestId("order-drawer")).toBeHidden();
  const failImage = async (route: Route) => {
    expect(route.request().method()).toBe("GET");
    await route.fulfill({ status: 503, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ ok: false, error: { code: "PERMISSION_UPDATE_UNAVAILABLE" } }) });
  };
  await page.route(publicUrl, failImage);
  try {
    const failedImage = page.waitForResponse(response => response.url() === publicUrl && response.request().method() === "GET");
    // Keep the existing occupied dine-in order: the later clear-demo case
    // relies on it to prove OPEN_ORDERS_BLOCK_CLEAR_DEMO. Pay only this new order.
    await page.getByTestId("nav-takeaway").click();
    await page.getByTestId("takeaway-drawer").locator("header").getByRole("button", { name: "Tạo đơn mang đi", exact: true }).click();
    await page.getByPlaceholder("Tìm món...").fill(changedName);
    const failed = await failedImage;
    expect(failed.status()).toBe(503);
    expect((await failed.allHeaders())["cache-control"]).toBe("no-store");
    await expect(orderCard.getByTestId("menu-image-placeholder")).toBeVisible();
    await expect(orderCard.getByRole("img")).toHaveCount(0);
    const imageBoxAfter = await imageBox.boundingBox(), cardAfter = await orderCard.boundingBox();
    expect(imageBoxAfter).not.toBeNull(); expect(cardAfter).not.toBeNull();
    for (const dimension of ["width", "height"] as const) {
      expect(imageBoxAfter![dimension]).toBeCloseTo(imageBoxBefore![dimension], 1);
      expect(cardAfter![dimension]).toBeCloseTo(cardBefore![dimension], 1);
    }
    await expect(orderCard.locator("strong")).toHaveText(changedName);
    await expect(orderCard).toContainText(priceText);
    await expect(orderCard).toBeEnabled();
    await orderCard.click();
    const modifier = page.getByTestId("modifier-confirm"); if (await modifier.isVisible()) await modifier.click();
    await expect(page.getByTestId("order-cart-line").filter({ hasText: changedName })).toBeVisible();
    await page.getByTestId("submit-order-button-footer").click();
    await expect(page.getByTestId("receipt-preview")).toBeVisible();
    await expect(page.getByTestId("receipt-preview")).toContainText(changedName);
    await expect(page.getByTestId("receipt-document")).toHaveAttribute("data-variant", "kitchen");
    const orderNo = (await page.getByTestId("receipt-document").getAttribute("data-order-no"))!;
    expect(orderNo).toMatch(/^\d+$/);
    await page.getByTestId("receipt-close-footer").click();
    await expect(page.getByTestId("floor-view")).toBeVisible();
    const takeawayOrder = page.getByRole("button").filter({ has: page.getByText(`#${orderNo}`, { exact: true }) });
    await expect(takeawayOrder).toHaveCount(1);
    await takeawayOrder.click();
    await page.getByTestId("submit-order-button-footer").click();
    await expect(page.getByTestId("payment-drawer")).toBeVisible();
    await page.getByTestId("payment-received-amount").fill("1000000");
    await page.getByTestId("print-receipt-checkbox").check();
    await page.getByTestId("pay-button-footer").click();
    await expect(page.getByTestId("receipt-preview")).toBeVisible();
    await expect(page.getByTestId("receipt-preview")).toContainText(changedName);
    await expect(page.getByTestId("receipt-document")).toHaveAttribute("data-variant", "receipt");
    await expect(page.getByTestId("receipt-document")).toHaveAttribute("data-order-no", orderNo);
    await expect(page.getByTestId("receipt-document")).toHaveAttribute("data-total", String(price));
  } finally { await page.unroute(publicUrl, failImage); }
});

test("four active roles have protected navigation parity with server authorization", async ({ browser }) => {
  const rosterContext = await browser.newContext();
  const rosterPage = await rosterContext.newPage();
  await installStoreSession(rosterPage); await rosterPage.goto("/");
  const waiterButton = rosterPage.locator('[data-testid^="employee-"]').filter({ hasText: "Waiter E2E" });
  await expect(waiterButton).toBeVisible();
  const waiterId = (await waiterButton.getAttribute("data-testid"))!.slice("employee-".length);
  await rosterContext.close();
  const cases = [
    { id: EMPLOYEE_IDS[0], allowed: ["nav-employees", "nav-menu-editor", "nav-floor-editor", "nav-report", "nav-settings"] },
    { id: EMPLOYEE_IDS[1], allowed: ["nav-employees", "nav-menu-editor", "nav-floor-editor", "nav-report"] },
    { id: EMPLOYEE_IDS[2], allowed: [] },
    { id: waiterId, allowed: [], pin: "456789" },
  ];
  const protectedRpcs = [
    ["nav-employees", "permission_admin_list"], ["nav-menu-editor", "permission_get_menu_admin"],
    ["nav-floor-editor", "permission_get_floor_admin"], ["nav-settings", "permission_get_settings_admin"],
  ] as const;
  for (const role of cases) {
    const context = await browser.newContext();
    try {
      const page = await context.newPage();
      let employeeToken = "";
      page.on("request", request => { const token = request.headers()["x-pos-employee-token"]; if (token) employeeToken = token; });
      if (role.pin) {
        await installStoreSession(page); await page.goto("/"); await page.getByTestId(`employee-${role.id}`).click();
        for (const digit of role.pin) await page.getByTestId(`pin-${digit}`).click();
        await page.getByTestId("unlock-button").click(); await expect(page.getByTestId("floor-view")).toBeVisible();
      } else await login(page, role.id);
      for (const id of ["nav-employees", "nav-menu-editor", "nav-floor-editor", "nav-report", "nav-settings"])
        if (role.allowed.includes(id)) await expect(page.getByTestId(id)).toBeVisible(); else await expect(page.getByTestId(id)).toHaveCount(0);
      await expect.poll(() => employeeToken.length).toBeGreaterThan(0);
      const { api, anonKey } = candidateEnvironment();
      const results = await page.evaluate(async ({ token, apiUrl, key, rpcs }) => {
        const session = Object.values(localStorage).map(value => { try { return JSON.parse(value); } catch { return null; } }).find(value => value?.access_token);
        return Promise.all(rpcs.map(async rpc => { const response = await fetch(`${apiUrl}/rest/v1/rpc/${rpc}`, { method: "POST", headers: { apikey: key, Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json", "x-pos-employee-token": token, "x-pos-permission-contract": "2" }, body: "{}" }); return { status: response.status, body: await response.json() }; }));
      }, { token: employeeToken, apiUrl: api, key: anonKey, rpcs: protectedRpcs.map(([, rpc]) => rpc) });
      for (const [index, [nav]] of protectedRpcs.entries()) {
        expect(results[index].status).toBe(200);
        const allowed = role.allowed.includes(nav); expect(results[index].body.ok).toBe(allowed);
        if (!allowed) expect(results[index].body.error.code).toBe("FORBIDDEN");
      }
    } finally { await context.close(); }
  }
});

test("owner clears demo data through UI and refetch preserves custom records", async ({ page }) => {
  await prepareInitialDemoFixture();
  const seeded: Array<Promise<{ stage: string; ok: boolean }>> = [];
  page.on('response', response => {
    if (response.url().includes('/rpc/permission_run_initial_seed_stage') && response.ok())
      seeded.push(response.json().then(body => ({ stage: response.request().postDataJSON().p_request.stage, ok: body.ok })));
  });
  await login(page, EMPLOYEE_IDS[0]);
  await expect.poll(() => seeded.length).toBe(3);
  expect(await Promise.all(seeded)).toEqual(['employee', 'menu', 'floor'].map(stage => ({ stage, ok: true })));
  await page.getByTestId("nav-settings").click();
  await page.getByTestId("settings-section-demo").click();
  await page.getByTestId("open-clear-demo").click();
  await expect(page.getByTestId("clear-demo-dialog")).toBeVisible();
  await expect(page.getByTestId("clear-demo-blocked")).toBeVisible();
  await page.getByTestId("clear-demo-dialog").getByRole("button", { name: "Huỷ", exact: true }).click();
  await closeDrawerFromNav(page);
  for (;;) {
    const occupied = page.locator('[data-testid^="table-"]').filter({ has: page.locator('[data-floor-label="price"]') }).first();
    if (await occupied.count() === 0) break;
    await occupied.click(); await page.getByTestId("submit-order-button-footer").click();
    await page.getByTestId("payment-received-amount").fill("1000000");
    await page.getByTestId("pay-button-footer").click(); await expect(page.getByTestId("receipt-preview")).toBeVisible();
    await page.getByTestId("receipt-close-footer").click(); await expect(page.getByTestId("floor-view")).toBeVisible();
  }
  await page.getByTestId("nav-settings").click(); await page.getByTestId("settings-section-demo").click();
  // Initial seed ran at normal owner login above. No standalone reseed route is exposed.
  await expect(page.getByTestId("seed-demo-button")).toHaveCount(0);
  await closeDrawerFromNav(page);
  await page.getByTestId("nav-menu-editor").click();
  await expect(page.locator('[data-testid^="menu-edit-card-"]').filter({ hasText: "Fixture coffee E2E" })).toHaveCount(1);
  await page.getByTestId("menu-editor").getByRole("button", { name: /^Cà phê \d+$/ }).click();
  await expect(page.locator('[data-testid^="menu-edit-card-"]').filter({ hasText: "Cà phê sữa" })).toHaveCount(1);
  await closeDrawerFromNav(page);
  await page.getByTestId("nav-employees").click();
  await expect(page.locator('[data-testid^="employee-row-"]').filter({ hasText: "Thu ngân demo" })).toHaveCount(1);
  await closeEmployees(page);
  await page.getByTestId("nav-settings").click(); await page.getByTestId("settings-section-demo").click();
  await page.getByTestId("open-clear-demo").click(); await expect(page.getByTestId("clear-demo-blocked")).toHaveCount(0);
  await page.getByTestId("clear-demo-confirm-input").fill("CLEAR");
  await expectSavedRpc(page, "clear_demo_data", () => page.getByTestId("clear-demo-confirm-button").click());
  await expect(page.getByTestId("clear-demo-dialog")).toBeHidden();
  await closeDrawerFromNav(page);
  await page.getByTestId("nav-settings").click();
  await expect(page.getByTestId("settings-name-input")).toHaveValue(/E2E$/);
  await closeDrawerFromNav(page);
  await page.getByTestId("nav-menu-editor").click();
  await expect(page.getByTestId("menu-editor").getByRole("button", { name: /^Cà phê \d+$/ })).toHaveCount(0);
  await expect(page.locator('[data-testid^="menu-edit-card-"]').filter({ hasText: "Cà phê sữa" })).toHaveCount(0);
  await expect(page.locator('[data-testid^="menu-edit-card-"]').filter({ hasText: "Fixture coffee E2E" })).toHaveCount(1);
  await closeDrawerFromNav(page);
  await page.getByTestId("nav-employees").click();
  await expect(page.locator('[data-testid^="employee-row-"]').filter({ hasText: "Waiter E2E" })).toBeVisible();
  await page.locator('[data-testid^="employee-row-"]').filter({ hasText: "Thu ngân demo" }).click();
  await expect(page.getByTestId("employee-active-toggle")).not.toBeChecked();
});
