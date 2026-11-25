import { expect, test as base, type Browser, type Locator, type Page, type Request, type Response } from "@playwright/test";
import type { BusinessResult, EmployeeAdminUpdateRequest, OperationView, OrderSnapshot, WriteKind } from "../../src/domain";
import { installPermissionTimingProbe } from "../../scripts/permission-realtime-probe.mjs";
import { cashierUpdateConfirmed, restoreCashierOverrides } from "./restoreCashierOverrides";

type PairingFixture = { origin: string; publicKey: string; storeKey: string; storeNo: number; ownerPin: string };
type Fixture = PairingFixture & { cashierPin: string };
type Device = { page: Page; accessToken?: string; storeId?: string };
type Smoke = { owner: Device; fixture: Fixture; orders: Set<string> };
type StoreSignalProbe = { ready: { store: boolean }; signals: Array<{ table: string }> };

function pairingFixture(): PairingFixture {
  const { VITE_DATA_MODE, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SMOKE_SUPABASE_STORE_KEY,
    SMOKE_SUPABASE_OWNER_PIN } = process.env;
  if (VITE_DATA_MODE !== "supabase" || !VITE_SUPABASE_URL || !VITE_SUPABASE_ANON_KEY) {
    throw new Error("Set VITE_DATA_MODE=supabase and explicitly configure the Supabase URL and publishable key for the test project.");
  }
  const storeKey = SMOKE_SUPABASE_STORE_KEY?.trim().toUpperCase() ?? "";
  const storeNo = Number(/^(\d{1,10})-[A-Z0-9]{4,64}$/.exec(storeKey)?.[1]);
  if (!Number.isInteger(storeNo) || storeNo < 1 || storeNo > 2147483647) {
    throw new Error("Set SMOKE_SUPABASE_STORE_KEY to the provisioned test store's Store Key.");
  }
  if (!/^\d{6}$/.test(SMOKE_SUPABASE_OWNER_PIN ?? "")) {
    throw new Error("Set SMOKE_SUPABASE_OWNER_PIN for the provisioned test store.");
  }
  return { origin: new URL(VITE_SUPABASE_URL).origin, publicKey: VITE_SUPABASE_ANON_KEY, storeKey, storeNo,
    ownerPin: SMOKE_SUPABASE_OWNER_PIN! };
}

function testFixture(): Fixture {
  const cashierPin = process.env.SMOKE_SUPABASE_CASHIER_PIN;
  if (!cashierPin || !/^\d{6}$/.test(cashierPin)) {
    throw new Error("Set SMOKE_SUPABASE_CASHIER_PIN for the provisioned test store.");
  }
  return { ...pairingFixture(), cashierPin };
}

function backendPost(response: Response, fixture: PairingFixture, path: string) {
  const url = new URL(response.url());
  return url.origin === fixture.origin && url.pathname === path && response.request().method() === "POST";
}

async function unlock(page: Page, role: "owner" | "cashier", pin: string, employeeId?: string) {
  const passcode = page.getByTestId("passcode-screen");
  const employee = employeeId
    ? passcode.getByTestId("employee-" + employeeId)
    : passcode.locator('[data-testid^="employee-"]').filter({ has: page.getByText("Chủ quán", { exact: true }) });
  await employee.click();
  try {
    for (const digit of pin) await passcode.getByTestId("pin-" + digit).click();
  } catch {
    throw new Error("Could not enter the test employee PIN.");
  }
  await passcode.getByTestId("unlock-button").click();
  await expect(page.getByTestId("left-nav-session")).toHaveAttribute("data-role", role, { timeout: 30_000 });
  await expect(page.getByTestId("floor-view")).toBeVisible();
}

async function pairDevice(device: Device, fixture: PairingFixture) {
  const { page } = device;
  await page.goto("/");
  await page.getByTestId("go-store-pairing").click();
  try {
    await page.getByTestId("store-key-input").fill(fixture.storeKey)
      .catch(() => { throw new Error("Could not enter the fixture Store Key."); });
    const [reply] = await Promise.all([
      page.waitForResponse(response => backendPost(response, fixture, "/auth/v1/token"), { timeout: 30_000 }),
      page.getByTestId("store-pairing-screen").getByTestId("go-passcode").click(),
    ]);
    if (!reply.ok()) throw new Error("Supabase Auth refused the fixture pairing (HTTP " + reply.status() + ").");
    const auth = await reply.json();
    device.accessToken = auth.access_token;
    device.storeId = auth.user?.id;
    if (!device.accessToken || !device.storeId) throw new Error("Supabase Auth did not return a fixture session.");
    const label = "Cửa hàng #" + String(fixture.storeNo).padStart(4, "0");
    await expect(page.getByTestId("passcode-screen").getByText(label, { exact: true })).toBeVisible();
    return { refreshToken: auth.refresh_token as string, expiresAt: auth.expires_at as number };
  } finally {
    // A rejected pairing can leave the key visible in Playwright's error context.
    const input = page.getByTestId("store-key-input");
    if (await input.isVisible()) await input.fill("", { timeout: 1_000 }).catch(() => {});
  }
}

async function closeDevice(device: Device, fixture: Fixture) {
  if (!device.accessToken) return;
  try {
    await device.page.evaluate(async () => {
      const { createAppPortsFromViteEnv } = await import("/src/app/runtimePorts.ts");
      await createAppPortsFromViteEnv().permission?.session.revokeSession();
    });
  } finally {
    await revokeStoreSession(device, fixture);
  }
}

async function revokeStoreSession(device: Device, fixture: PairingFixture) {
  if (!device.accessToken) return;
  const logout = await device.page.request.post(fixture.origin + "/auth/v1/logout?scope=local", {
    headers: { apikey: fixture.publicKey, authorization: "Bearer " + device.accessToken },
    maxRedirects: 0, timeout: 12_000,
  }).catch(() => { throw new Error("Could not log out the smoke test device."); });
  if (logout.status() === 403) {
    const { code, error_code: errorCode } = await logout.json();
    if ((errorCode ?? code) === "session_not_found") return;
  }
  expect(logout.status(), "Smoke device local logout").toBe(204);
}

async function lockOwner(device: Device, fixture: PairingFixture) {
  const { page } = device;
  const lock = page.getByTestId("nav-lock");
  if (!await lock.isVisible()) return;
  const closeReport = page.getByTestId("report-close-button");
  if (await closeReport.isVisible()) await closeReport.click();
  const [revoke] = await Promise.all([
    page.waitForResponse(response => backendPost(response, fixture, "/rest/v1/rpc/permission_revoke_session"),
      { timeout: 12_000 }),
    lock.click(),
  ]);
  expect(revoke.status(), "B employee session cleanup").toBe(200);
  expect((await revoke.json()).ok, "B employee session was revoked").toBe(true);
}

async function closeRegressionOwner(device: Device, fixture: PairingFixture) {
  try {
    await lockOwner(device, fixture);
  } finally {
    await revokeStoreSession(device, fixture);
  }
}

async function voidRemainingOrders({ owner, orders }: Smoke) {
  if (!orders.size) return;
  const closed = await owner.page.evaluate(async (orderIds) => {
    const { createAppPortsFromViteEnv } = await import("/src/app/runtimePorts.ts");
    const ports = createAppPortsFromViteEnv();
    const read = ports.permission!.read;
    const { openOrders } = await read.getFloorOperational();
    const results = [];
    for (const { id } of openOrders.filter(order => orderIds.includes(order.id))) {
      const order = await read.getOpenOrderDetail(id);
      const operationId = crypto.randomUUID();
      const payload = {
        schemaVersion: 1, kind: "submit_order_changes", action: "void_open", orderId: id, expectedVersion: order.lockVersion,
      } as const;
      await ports.write.register(operationId, payload);
      const operation = await ports.write.execute(operationId, payload);
      results.push({ id, status: operation.status, code: operation.error?.code ?? null });
    }
    return results;
  }, [...orders]);
  for (const result of closed) expect(result, "Cleanup of the smoke test's open order").toMatchObject({ status: "applied" });
}

const test = base.extend<{ smoke: Smoke }>({
  smoke: async ({ page }, use) => {
    process.env.PLAYWRIGHT_NO_COPY_PROMPT = "1";
    const fixture = testFixture();
    const owner: Device = { page };
    const smoke = { owner, fixture, orders: new Set<string>() };
    try {
      await pairDevice(owner, fixture);
      await unlock(page, "owner", fixture.ownerPin);
      await use(smoke);
    } finally {
      try {
        await voidRemainingOrders(smoke);
      } finally {
        await closeDevice(owner, fixture);
      }
    }
  },
});

test.use({ trace: "off", screenshot: "off", video: "off" });

test("TC-OWNER-112 unpair before PIN revokes A and preserves B", async ({ page, browser, baseURL }) => {
  const fixture = pairingFixture();
  const a: Device = { page };
  const contextB = await browser.newContext({ baseURL });
  const b: Device = { page: await contextB.newPage() };
  let verified = false;

  try {
    await b.page.clock.install();
    const oldA = await pairDevice(a, fixture);
    const sessionB = await pairDevice(b, fixture);
    await unlock(b.page, "owner", fixture.ownerPin);
    await expect(a.page.getByTestId("unlock-button")).toBeDisabled();
    expect(a.storeId).toBe(b.storeId);
    expect(Boolean(oldA.refreshToken && sessionB.refreshToken && oldA.refreshToken !== sessionB.refreshToken),
      "Both devices have separate Auth sessions").toBe(true);

    const [logoutA] = await Promise.all([
      a.page.waitForResponse(response => backendPost(response, fixture, "/auth/v1/logout"), { timeout: 12_000 }),
      a.page.getByText("← Đổi quán / Gỡ ghép", { exact: true }).click(),
    ]);
    expect(logoutA.status()).toBe(204);
    await expect(a.page.getByTestId("go-store-pairing")).toBeVisible();

    const refreshURL = fixture.origin + "/auth/v1/token?grant_type=refresh_token";
    const deniedA = await a.page.request.post(refreshURL, {
      headers: { apikey: fixture.publicKey }, data: { refresh_token: oldA.refreshToken },
      maxRedirects: 0, timeout: 12_000,
    }).catch(() => { throw new Error("Could not check the old A session."); });
    const rejected = await deniedA.json();
    if (typeof rejected.access_token === "string") a.accessToken = rejected.access_token;
    expect(deniedA.status(), "Auth rejects the old A session").toBe(400);
    expect(["refresh_token_not_found", "session_not_found"], "Auth reports the old A session is gone")
      .toContain(rejected.error_code ?? rejected.code);
    expect(Boolean(rejected.access_token), "Auth did not issue a new A access token").toBe(false);
    a.accessToken = undefined;
    expect(new URL(logoutA.url()).searchParams.get("scope")).toBe("local");

    // Advance only B's browser scheduler. Supabase still handles the refresh in real time.
    expect(Number.isFinite(sessionB.expiresAt), "B received an expiry from Auth").toBe(true);
    await b.page.bringToFront();
    const [refreshB] = await Promise.all([
      b.page.waitForResponse(response => response.url() === refreshURL
        && backendPost(response, fixture, "/auth/v1/token"), { timeout: 12_000 }),
      b.page.clock.fastForward(Math.max(30_000, sessionB.expiresAt * 1000 - Date.now() - 60_000)),
    ]);
    expect(refreshB.status(), "Auth renews B's own session").toBe(200);
    const renewedB = await refreshB.json();
    expect(Boolean(renewedB.access_token && renewedB.refresh_token
      && renewedB.refresh_token !== sessionB.refreshToken), "Auth issued a renewed B session").toBe(true);
    b.accessToken = renewedB.access_token;

    const [reportB] = await Promise.all([
      b.page.waitForResponse(response => backendPost(response, fixture, "/rest/v1/rpc/permission_get_sales_report"),
        { timeout: 12_000 }),
      b.page.getByRole("button", { name: "Báo cáo", exact: true }).click(),
    ]);
    expect(reportB.status(), "B can read reports after refresh").toBe(200);
    expect((await reportB.json()).ok, "B retained report permissions").toBe(true);
    await expect(b.page.getByTestId("report-summary")).toBeVisible();

    await pairDevice(a, fixture);
    await a.page.getByTestId("passcode-screen").getByRole("button", { name: "Chủ quán", exact: true }).click();
    await expect(a.page.getByTestId("unlock-button")).toBeDisabled();
    verified = true;
  } finally {
    try {
      const cleanup = await Promise.allSettled([revokeStoreSession(a, fixture), closeRegressionOwner(b, fixture)]);
      const failedDevices = cleanup.flatMap((result, index) => result.status === "rejected" ? [index === 0 ? "A" : "B"] : []);
      if (failedDevices.length) {
        const note = `Could not confirm cleanup for ${failedDevices.join(", ")}.`;
        if (verified) throw new Error(note);
        test.info().annotations.push({ type: "cleanup", description: note });
      }
    } finally {
      await contextB.close();
    }
  }
});

async function withSecondDevice(browser: Browser, baseURL: string | undefined, smoke: Smoke, run: (device: Device) => Promise<void>) {
  const context = await browser.newContext({ baseURL });
  const device: Device = { page: await context.newPage() };
  try {
    await run(device);
  } finally {
    try {
      await closeDevice(device, smoke.fixture);
    } finally {
      await context.close();
    }
  }
}

function tableTile(page: Page, tableId: string) {
  return page.getByTestId("floor-view").getByTestId("table-" + tableId);
}

async function closeReceiptPopupIfAny(page: Page) {
  const close = page.getByTestId("receipt-preview").getByRole("button", { name: "Đóng" }).first();
  const visible = await close.waitFor({ state: "visible", timeout: 2_500 }).then(() => true, () => false);
  if (visible) await close.click();
}

async function uiWrite<K extends WriteKind>(
  page: Page, smoke: Smoke, button: Locator, kind: K,
): Promise<Extract<BusinessResult, { kind: K }>> {
  const trackOrder = (request: Request) => {
    const url = new URL(request.url());
    if (kind !== "submit_order_changes" || url.origin !== smoke.fixture.origin ||
        url.pathname !== "/rest/v1/rpc/register_write_operation" || request.method() !== "POST") return;
    const payload = request.postDataJSON()?.p_payload;
    if (payload?.kind === kind && payload.action === "create" && typeof payload.orderId === "string") {
      smoke.orders.add(payload.orderId);
      test.info().annotations.push({ type: "smoke-order-id", description: payload.orderId });
    }
  };
  page.on("request", trackOrder);
  const [reply] = await Promise.all([
    page.waitForResponse(response => backendPost(response, smoke.fixture, "/rest/v1/rpc/execute_write_operation")
      && response.request().postDataJSON()?.p_payload?.kind === kind, { timeout: 30_000 }),
    button.click(),
  ]).finally(() => page.off("request", trackOrder));
  const envelope = await reply.json() as { ok: boolean; operation?: OperationView; error?: { code: string } };
  const result = envelope.operation?.result;
  expect({ http: reply.status(), status: envelope.operation?.status, kind: result?.kind,
    error: envelope.error?.code ?? envelope.operation?.error?.code ?? null }).toEqual({ http: 200, status: "applied", kind, error: null });
  return result as Extract<BusinessResult, { kind: K }>;
}

async function createOpenOrder(page: Page, smoke: Smoke, quantity = 1) {
  const table = page.getByTestId("floor-view").locator('[data-testid^="table-"][data-table-status="empty"]').first();
  const tableId = (await table.getAttribute("data-testid"))?.slice("table-".length);
  if (!tableId) throw new Error("The test store needs an empty table.");
  await tableTile(page, tableId).click();
  const drawer = page.getByTestId("order-drawer");
  await expect(page.getByTestId("b02-header")).toHaveAttribute("aria-label", /Đơn mới$/);
  expect(await page.evaluate(async () => (await import("/src/app/useAppStore.ts")).useAppStore.getState().orderContext))
    .toMatchObject({ tableId, orderId: null });
  const menuItem = drawer.locator('[data-testid^="menu-item-"]').first();
  for (let i = 0; i < quantity; i++) {
    await menuItem.click();
    const confirm = page.getByTestId("modifier-confirm");
    const visible = await confirm.waitFor({ state: "visible", timeout: 1_500 }).then(() => true, () => false);
    if (visible) await confirm.click();
  }
  const { order, action } = await uiWrite(page, smoke, page.getByTestId("submit-order-button-footer"), "submit_order_changes");
  expect({ tableId: order.tableId, status: order.status, storeId: order.storeId, action })
    .toEqual({ tableId, status: "open", storeId: smoke.owner.storeId, action: "create" });
  await expect(drawer).toBeHidden({ timeout: 30_000 });
  await closeReceiptPopupIfAny(page);
  await expect(tableTile(page, tableId)).toHaveAttribute("data-table-status", "occupied");
  return { ...order, tableId };
}

async function openPayment(page: Page, order: OrderSnapshot & { tableId: string }) {
  await tableTile(page, order.tableId).click();
  await expect(page.getByTestId("b02-header")).toHaveAttribute("aria-label", new RegExp("Đơn #" + order.orderNo + "$"));
  await page.getByTestId("submit-order-button-footer").click();
  await expect(page.getByTestId("payment-drawer")).toBeVisible();
  await expectPaymentOrder(page, order.id);
}

async function expectPaymentOrder(page: Page, orderId: string) {
  expect(await page.evaluate(async () => (await import("/src/app/useAppStore.ts")).useAppStore.getState().paymentOrderId))
    .toBe(orderId);
}

async function payOrder(page: Page, smoke: Smoke, order: OrderSnapshot & { tableId: string }, alreadyOpen = false) {
  if (alreadyOpen) await expectPaymentOrder(page, order.id);
  else await openPayment(page, order);
  const { order: paid, receipt, payment } = await uiWrite(page, smoke, page.getByTestId("pay-button-footer"), "pay_order");
  expect({ id: paid.id, status: paid.status, receiptOrder: receipt.orderId, amount: payment.amount })
    .toEqual({ id: order.id, status: "paid", receiptOrder: order.id, amount: order.total });
  await expect(page.getByTestId("payment-drawer")).toBeHidden({ timeout: 30_000 });
  await expect(page.getByTestId("receipt-preview")).toContainText(new RegExp("#" + paid.orderNo + "(?!\\d)"));
  await closeReceiptPopupIfAny(page);
  await expect(tableTile(page, order.tableId)).toHaveAttribute("data-table-status", "empty");
  return paid;
}

async function historyRow(page: Page, orderId: string) {
  await page.getByRole("button", { name: "Lịch sử" }).click();
  return page.getByTestId("order-history-drawer").getByTestId("history-row-" + orderId);
}

async function salesReport(page: Page, businessDate: string) {
  return page.evaluate(async date => {
    const { createAppPortsFromViteEnv } = await import("/src/app/runtimePorts.ts");
    return createAppPortsFromViteEnv().permission!.read.getSalesReport({ businessDate: date });
  }, businessDate);
}

test("Supabase UI smoke pairs a prepared store, pays an order, and shows history/report", async ({ smoke }) => {
  const { page } = smoke.owner;
  const order = await createOpenOrder(page, smoke);
  const before = await salesReport(page, order.businessDate);
  await payOrder(page, smoke, order);
  expect(await salesReport(page, order.businessDate)).toMatchObject({
    paidOrders: before.paidOrders + 1, revenue: before.revenue + order.total,
  });
  const row = await historyRow(page, order.id);
  await expect(row).toHaveAttribute("data-status", "paid");
  await expect(row).toHaveAttribute("data-total", String(order.total));
  await page.getByTestId("order-history-drawer").getByRole("button", { name: "Đóng" }).first().click();
  await page.getByRole("button", { name: "Báo cáo" }).click();
  await expect(page.getByTestId("report").getByText("Doanh thu hôm nay").first()).toBeVisible();
  await expect(page.getByTestId("report").getByText("Số đơn đã thanh toán").first()).toBeVisible();
});

async function findCashier(page: Page) {
  return page.evaluate(async () => {
    const { createAppPortsFromViteEnv } = await import("/src/app/runtimePorts.ts");
    const employees = await createAppPortsFromViteEnv().permission!.employeeAdmin.listEmployees();
    const seeded = employees.filter(employee => employee.isActive && employee.role === "cashier" && employee.name === "Thu ngân demo");
    if (seeded.length !== 1) throw new Error("The test store needs exactly one active seeded cashier.");
    return seeded[0];
  });
}

test("Supabase enforces per-employee payment permission in UI and RPC", async ({ smoke, browser, baseURL }) => {
  const owner = smoke.owner.page;
  const cashier = await findCashier(owner);
  const hasPayment = cashier.effective.includes("payment.take");
  expect(hasPayment, "The seeded cashier initially has payment.take").toBe(true);
  let change: { requestId: string; request: Request } | undefined;
  const observeChange = (request: Request) => {
    const url = new URL(request.url());
    if (url.origin !== smoke.fixture.origin || url.pathname !== "/rest/v1/rpc/permission_admin_update" || request.method() !== "POST") return;
    const input = request.postDataJSON()?.p_request as EmployeeAdminUpdateRequest | undefined;
    if (input?.targetId === cashier.id && input.expectedRevision === cashier.permissionRevision
        && input.patch.overrides?.denies.includes("payment.take")) change = { requestId: input.requestId, request };
  };
  owner.on("request", observeChange);
  try {
    await owner.getByTestId("nav-employees").click();
    const employeesDrawer = owner.getByTestId("employees-drawer");
    await employeesDrawer.getByTestId("employee-row-" + cashier.id).click();
    const permission = employeesDrawer.getByTestId("permission-payment.take");
    await expect(permission).toBeChecked();
    await permission.uncheck();
    await employeesDrawer.getByTestId("save-employee-button").click();
    await expect(owner.getByText("Đã cập nhật quyền nhân viên.", { exact: true })).toBeVisible();
    expect(change?.requestId, "The browser sent the fixture cashier permission update").toBeTruthy();

    await withSecondDevice(browser, baseURL, smoke, async device => {
      const { page } = device;
      await pairDevice(device, smoke.fixture);
      expect(device.storeId).toBe(smoke.owner.storeId);
      await unlock(page, "cashier", smoke.fixture.cashierPin, cashier.id);
      const order = await createOpenOrder(page, smoke);
      await tableTile(page, order.tableId).click();
      await expect(page.getByTestId("b02-header")).toHaveAttribute("aria-label", new RegExp("Đơn #" + order.orderNo + "$"));
      await expect(page.getByTestId("submit-order-button-footer")).toHaveCount(0);
      await expect(page.getByTestId("payment-drawer")).toBeHidden();

      const outcome = await page.evaluate(async id => {
        const { createAppPortsFromViteEnv } = await import("/src/app/runtimePorts.ts");
        const ports = createAppPortsFromViteEnv();
        const before = await ports.permission!.read.getOpenOrderDetail(id);
        let code: string | null | undefined;
        try {
          const operationId = crypto.randomUUID();
          const payload = {
            schemaVersion: 1, kind: "pay_order", orderId: id, paymentId: crypto.randomUUID(),
            method: "cash", expectedVersion: before.lockVersion, receivedAmount: before.total,
          } as const;
          await ports.write.register(operationId, payload);
          const operation = await ports.write.execute(operationId, payload);
          code = operation.error?.code ?? null;
        } catch (error) {
          code = (error as { code?: string }).code;
        }
        const after = await ports.permission!.read.getOpenOrderDetail(id);
        return { code, status: after.status, unchanged: before.lockVersion === after.lockVersion };
      }, order.id);
      expect(outcome).toEqual({ code: "FORBIDDEN", status: "open", unchanged: true });
    });
  } finally {
    owner.off("request", observeChange);
    if (change) {
      const responseConfirmed = await cashierUpdateConfirmed(change.request, cashier.id);
      await owner.evaluate(restoreCashierOverrides, { original: cashier, requestId: change.requestId, responseConfirmed });
    }
  }
});

test("Supabase owner voids a paid order and it leaves the paid revenue", async ({ smoke }) => {
  const { page } = smoke.owner;
  const order = await createOpenOrder(page, smoke);
  await payOrder(page, smoke, order);
  const beforeVoid = await salesReport(page, order.businessDate);

  const row = await historyRow(page, order.id);
  await row.click();
  const voidButton = page.getByTestId("history-void-order");
  await expect(voidButton).toBeEnabled();
  await voidButton.click();
  await expect(page.getByTestId("history-void-popup")).toBeVisible();
  await page.getByTestId("history-void-reason").selectOption("duplicate");
  const result = await uiWrite(page, smoke, page.getByTestId("history-void-confirm"), "void_order");
  expect(result.order).toMatchObject({ id: order.id, status: "void", voidReasonCode: "duplicate" });

  await expect(page.getByTestId("history-void-popup")).toBeHidden();
  await expect(page.getByTestId("history-void-info")).toBeVisible();
  await expect(row).toHaveAttribute("data-status", "void");
  expect(await salesReport(page, order.businessDate)).toMatchObject({
    paidOrders: beforeVoid.paidOrders - 1, revenue: beforeVoid.revenue - order.total,
    voidCount: beforeVoid.voidCount + 1, voidAmount: beforeVoid.voidAmount + order.total,
  });
});

test("Supabase instant pay splits selected items into an independent paid order", async ({ smoke }) => {
  const { page } = smoke.owner;
  const order = await createOpenOrder(page, smoke, 2);
  await openPayment(page, order);
  const payAll = page.getByTestId("pay-select-all");
  const pay = page.getByTestId("pay-button-footer");

  await payAll.uncheck();
  await page.getByTestId("pay-item-checkbox").first().check();
  await expect(page.getByTestId("pay-item-quantity").first()).toHaveText("1/2");
  const split = await uiWrite(page, smoke, pay, "pay_order_items");
  expect(split.paidOrder.id).not.toBe(order.id);
  expect(split.paidOrder).toMatchObject({ orderNo: order.orderNo, status: "paid" });
  expect(split.sourceOrder).toMatchObject({ id: order.id, status: "open" });
  expect(split.sourceOrder.orderNo).toBeGreaterThan(order.orderNo);
  expect(split.sourceOrder.total + split.paidOrder.total).toBe(order.total);
  await expect(page.getByTestId("receipt-preview")).toContainText(new RegExp("#" + order.orderNo + "(?!\\d)"));
  await closeReceiptPopupIfAny(page);

  await expect(page.getByTestId("payment-drawer")).toBeVisible();
  await expect(page.getByTestId("pay-item-line")).toHaveCount(1);
  await expect(page.getByTestId("pay-item-line")).toHaveAttribute("data-line-quantity", "1");
  // Refetch after a split cannot authorize another payment without a new selection.
  await expect(payAll).not.toBeChecked();
  await expect(pay).toBeDisabled();
  await payAll.check();
  const remaining = await payOrder(page, smoke, { ...split.sourceOrder, tableId: order.tableId }, true);
  expect(remaining.orderNo).toBe(split.sourceOrder.orderNo);
  await expect(await historyRow(page, remaining.id)).toHaveAttribute("data-status", "paid");
  await expect(page.getByTestId("history-row-" + split.paidOrder.id)).toHaveAttribute("data-status", "paid");
});

test("Supabase realtime invalidates table status across two browsers", async ({ smoke, browser, baseURL }) => {
  await withSecondDevice(browser, baseURL, smoke, async device => {
    const pageA = smoke.owner.page;
    const pageB = device.page;
    await pageB.addInitScript(installPermissionTimingProbe, { storeId: smoke.owner.storeId!, storeTopic: "orders" });
    await pairDevice(device, smoke.fixture);
    expect(device.storeId).toBe(smoke.owner.storeId);
    await unlock(pageB, "owner", smoke.fixture.ownerPin);

    const signalCount = () => pageB.evaluate(() => (window as unknown as { permissionTimingProbe: StoreSignalProbe })
      .permissionTimingProbe.signals.filter(signal => signal.table === "store_change_signals").length);
    await expect.poll(() => pageB.evaluate(() => (window as unknown as { permissionTimingProbe: StoreSignalProbe })
      .permissionTimingProbe.ready.store), { timeout: 20_000 }).toBe(true);

    const beforeOrder = await signalCount();
    const order = await createOpenOrder(pageA, smoke);
    await expect.poll(signalCount, { timeout: 20_000 }).toBeGreaterThan(beforeOrder);
    await expect(tableTile(pageB, order.tableId)).toHaveAttribute("data-table-status", "occupied", { timeout: 30_000 });
    const beforePayment = await signalCount();
    await payOrder(pageB, smoke, order);
    await expect.poll(signalCount, { timeout: 20_000 }).toBeGreaterThan(beforePayment);
    await expect(tableTile(pageA, order.tableId)).toHaveAttribute("data-table-status", "empty", { timeout: 30_000 });
  });
});
