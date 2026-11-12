import { expect, test, type Page } from "@playwright/test";

const preview = "/?owner-create-mock=1";
const attemptStorage = "pos.ownerCreate.attemptId";
const ownerPin = "638251";

async function openAndSend(page: Page, seedDemo = false) {
  await page.goto(preview);
  await page.getByTestId("go-create-store").click();
  await page.getByTestId("owner-create-email").fill(`owner-${crypto.randomUUID()}@example.com`);
  await page.getByTestId("owner-create-name").fill("Quán thử OTP");
  await page.getByTestId("owner-create-pin").fill(ownerPin);
  if (seedDemo) await page.getByRole("checkbox", { name: "Khởi tạo dữ liệu mẫu" }).check();
  await page.getByTestId("owner-create-send").click();
  await expect(page.getByTestId("owner-create-otp")).toBeVisible();
}

test("OTP sai rồi đúng, lưu Store Key, ghép thủ công và retry seed tại thông báo chung", async ({ page, context, browser }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await openAndSend(page, true);
  await page.getByTestId("owner-create-otp").fill("000001");
  await page.getByTestId("owner-create-verify").click();
  await expect(page.getByRole("alert")).toContainText("Mã xác minh không đúng");
  expect(await page.evaluate(key => sessionStorage.getItem(key), attemptStorage)).toBeNull();
  const acceptedAttempts: string[] = [];
  let lostKey: string | undefined;
  await page.route("**/__pos_owner_mock/verify", async route => {
    acceptedAttempts.push(route.request().postDataJSON().attemptId);
    if (acceptedAttempts.length > 1) return route.continue();
    const response = await route.fetch();
    expect(response.status()).toBe(200);
    lostKey = (await response.json()).storeKey;
    await route.abort();
  });
  await page.getByTestId("owner-create-otp").fill("012345");
  await page.getByTestId("owner-create-verify").click();
  await expect(page.getByRole("alert")).toContainText("Chưa xác nhận được kết quả");
  await page.getByRole("button", { name: "Thử lại xác minh" }).click();
  const keyDisplay = page.getByTestId("owner-created-store-key");
  await expect(keyDisplay).toHaveText(/^\d+-[A-Z0-9]{32}$/);
  const storeKey = (await keyDisplay.textContent())!;
  expect(storeKey).toBe(lostKey);
  expect(acceptedAttempts).toEqual([acceptedAttempts[0], acceptedAttempts[0]]);
  await page.getByTestId("owner-copy-store-key").click();
  await expect(page.getByText("Đã sao chép Store Key.")).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(storeKey);
  await page.getByTestId("owner-key-saved").click();
  await expect(page.getByTestId("store-key-input")).toHaveValue("");
  await expect(page.getByTestId("passcode-screen")).toHaveCount(0);
  expect(await page.evaluate(key => sessionStorage.getItem(key), attemptStorage)).toBeNull();

  const other = await browser.newPage({ viewport: page.viewportSize() ?? undefined });
  try {
    await other.goto(page.url());
    await other.getByTestId("go-store-pairing").click();
    await other.getByTestId("store-key-input").fill(storeKey);
    await other.getByTestId("go-passcode").click();
    await expect(other.getByTestId("passcode-screen")).toBeVisible();
    await other.getByRole("button", { name: /Chủ quán/ }).click();
    for (const digit of ownerPin) await other.getByTestId(`pin-${digit}`).click();
    await other.getByTestId("unlock-button").click();
    const viewport = other.viewportSize();
    if (viewport && viewport.height > viewport.width) {
      await expect(other.getByTestId("rotate-guidance")).toBeVisible();
      await other.setViewportSize({ width: viewport.height, height: viewport.width });
    }
    await expect(other.getByTestId("floor-view")).toBeVisible();
    await expect(other.getByTestId("initial-seed-status")).toContainText("Chưa hoàn tất dữ liệu mẫu");
    await other.getByTestId("retry-initial-seed").click();
    await expect(other.getByTestId("initial-seed-status")).toHaveCount(0);
    await expect(other.getByText("Đã thêm dữ liệu mẫu.")).toBeVisible();
  } finally {
    await other.close();
  }
});

test("F5 sau Xác nhận chỉ tra mã cũ, cho rời màn và giữ mã tới kết quả cuối", async ({ page }) => {
  const lookups: unknown[] = [];
  let sends = 0;
  let verifications = 0;
  let statusFixture: "unknown" | "failed" | undefined;
  await page.route("**/__pos_owner_mock/request-otp", route => { sends += 1; return route.continue(); });
  await page.route("**/__pos_owner_mock/status", route => {
    lookups.push(route.request().postDataJSON());
    if (statusFixture) return route.fulfill({
      status: 200, json: { status: statusFixture }, headers: { "X-POS-Mock-Now": String(Date.now()) },
    });
    return route.continue();
  });
  await page.route("**/__pos_owner_mock/verify", () => { verifications += 1; }); // Held before reaching the server.
  await openAndSend(page);
  await page.getByTestId("owner-create-otp").fill("012345");
  const request = page.waitForRequest("**/__pos_owner_mock/verify");
  await page.getByTestId("owner-create-verify").click();
  const payload = (await request).postDataJSON();
  const saved = () => page.evaluate(key => sessionStorage.getItem(key), attemptStorage);
  expect(await saved()).toBe(payload.attemptId);
  expect(await page.evaluate(() => Object.entries(sessionStorage).filter(([key]) => key.startsWith("pos.ownerCreate."))))
    .toEqual([[attemptStorage, payload.attemptId]]);
  await page.reload();
  await expect(page.getByTestId("owner-lookup-status")).toContainText("Chưa xác định kết quả");
  expect(lookups).toEqual([{ attemptId: payload.attemptId }]);
  expect(verifications).toBe(1);
  expect(sends).toBe(1);
  await expect(page.getByTestId("owner-create-otp")).toHaveCount(0);

  statusFixture = "unknown";
  await page.getByTestId("owner-lookup-pair").click();
  await expect(page.getByTestId("store-key-input")).toHaveValue("");
  expect(await saved()).toBe(payload.attemptId);
  await page.getByText("Chưa có quán? Tạo quán mới").click();
  await expect(page.getByTestId("owner-lookup-status")).toContainText("Chưa xác định kết quả");
  await page.getByTestId("owner-lookup-home").click();
  expect(await saved()).toBe(payload.attemptId);
  await page.getByTestId("go-create-store").click();
  await expect(page.getByTestId("owner-lookup-status")).toContainText("Chưa xác định kết quả");
  expect(lookups).toEqual(Array.from({ length: 3 }, () => ({ attemptId: payload.attemptId })));

  // Deliver the held request from the test harness after the new page has reattached.
  const late = await page.request.post("/__pos_owner_mock/verify", { data: payload });
  expect(late.status()).toBe(200);
  expect(await late.json()).toMatchObject({ status: "created" });
  statusFixture = undefined;
  await page.reload();
  await expect(page.getByTestId("owner-lookup-status")).toContainText("Vui lòng kiểm tra email");
  await expect(page.getByTestId("owner-created-store-key")).toHaveCount(0);
  expect(sends).toBe(1);
  expect(verifications).toBe(1);
  await page.getByTestId("owner-lookup-home").click();
  expect(await saved()).toBeNull();
  await page.getByTestId("go-create-store").click();
  await expect(page.getByTestId("owner-create-email")).toHaveValue("");

  statusFixture = "failed";
  await page.evaluate(([key, attemptId]) => sessionStorage.setItem(key, attemptId), [attemptStorage, payload.attemptId]);
  await page.reload();
  await expect(page.getByTestId("owner-lookup-status")).toContainText("Lượt tạo đã được hoàn lại");
  await page.getByTestId("owner-start-again").click();
  expect(await saved()).toBeNull();
  await expect(page.getByTestId("owner-create-email")).toHaveValue("");
});
