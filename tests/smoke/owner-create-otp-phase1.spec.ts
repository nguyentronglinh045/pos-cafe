import { expect, test } from "@playwright/test";

test("FE-01 mock gửi mã, giữ ID khi mất phản hồi và F5 trước Xác nhận", async ({ page }) => {
  const requests: Array<{ requestId: string; intentId: string }> = [];
  const receipts: Array<{ resendNotBefore: number }> = [];
  await page.route("**/__pos_owner_mock/request-otp", async route => {
    requests.push(route.request().postDataJSON());
    const response = await route.fetch();
    expect(response.status()).toBe(202);
    receipts.push((await response.json()).receipt);
    if (requests.length === 1) await route.abort();
    else await route.fulfill({ response });
  });
  await page.clock.install();
  await page.goto("/?owner-create-mock=1");
  await page.getByTestId("go-create-store").click();
  await page.getByTestId("owner-create-send").click();
  await expect(page.getByRole("alert")).toContainText("Địa chỉ email không hợp lệ");
  expect(requests).toHaveLength(0);
  const email = `qa-${crypto.randomUUID()}@example.com`;
  const fillForm = async () => {
    await page.getByTestId("owner-create-email").fill(email);
    await page.getByTestId("owner-create-name").fill("Quán QA");
    await page.getByTestId("owner-create-pin").fill("038251");
  };
  await fillForm();
  await page.getByTestId("owner-create-send").click();
  await expect(page.getByRole("alert")).toContainText("Chưa nhận được phản hồi gửi mã");
  await page.getByTestId("owner-create-send").dblclick();
  await expect(page.getByTestId("owner-create-otp-receipt")).toContainText(email);
  await expect(page.getByTestId("owner-create-send")).toBeDisabled();
  await expect(page.getByTestId("owner-create-pin")).toHaveCount(0);
  expect(requests).toHaveLength(2);
  expect(requests[1].requestId).toBe(requests[0].requestId);
  expect(receipts[1]).toEqual(receipts[0]);

  await page.reload();
  await page.getByTestId("go-create-store").click();
  await expect(page.getByTestId("owner-create-email")).toHaveValue("");
  await expect(page.getByTestId("owner-create-name")).toHaveValue("");
  await expect(page.getByTestId("owner-create-pin")).toHaveValue("");
  expect(requests).toHaveLength(2);
  await fillForm();
  await page.getByTestId("owner-create-send").click();
  await expect(page.getByTestId("owner-create-otp-receipt")).toContainText(email);
  await expect(page.getByTestId("owner-create-send")).toBeDisabled();
  expect(requests[2].intentId).not.toBe(requests[0].intentId);
  expect(receipts[2].resendNotBefore).toBe(receipts[0].resendNotBefore);
  await page.clock.fastForward(10 * 60 * 1000);
  await expect(page.getByTestId("owner-create-send")).toHaveText("Gửi lại");
  await expect(page.getByTestId("owner-create-send")).toBeEnabled();
});

test("phase 1 hết thời gian chờ request treo và thử lại cùng requestId", async ({ page }) => {
  const ids: string[] = [];
  await page.route("**/__pos_owner_mock/request-otp", async route => {
    ids.push(route.request().postDataJSON().requestId);
    if (ids.length === 1) return; // Hang until the application aborts the request.
    await route.continue();
  });
  await page.clock.install();
  await page.goto("/?owner-create-mock=1");
  await page.getByTestId("go-create-store").click();
  await page.getByTestId("owner-create-email").fill(`qa-${crypto.randomUUID()}@example.com`);
  await page.getByTestId("owner-create-name").fill("Quán QA");
  await page.getByTestId("owner-create-pin").fill("038251");
  await page.getByTestId("owner-create-send").click();
  await expect.poll(() => ids.length).toBe(1);
  await page.clock.fastForward(60_000);
  await expect(page.getByRole("alert")).toContainText("Chưa nhận được phản hồi gửi mã");
  await expect(page.getByRole("button", { name: "Quay lại" })).toBeEnabled();
  await page.getByTestId("owner-create-send").click();
  await expect(page.getByTestId("owner-create-otp-receipt")).toBeVisible();
  expect(ids).toEqual([ids[0], ids[0]]);
});
