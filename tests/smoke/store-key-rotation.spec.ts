import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test("owner rotates Store Key and re-pairs the current machine before entering PIN again", async ({ page }, info) => {
  await page.goto("/?owner-recovery-mock=1");
  const viewport = page.viewportSize();
  const landscape = viewport && { width: viewport.height, height: viewport.width };
  if (info.project.name === "portrait" && landscape) await page.setViewportSize(landscape);
  await loginAsAdmin(page);
  if (info.project.name === "portrait" && viewport && landscape) {
    await page.setViewportSize(viewport);
    await expect(page.getByTestId("rotate-guidance")).toBeVisible();
    await page.setViewportSize(landscape);
    await expect(page.getByTestId("floor-view")).toBeVisible();
  }
  await page.getByTestId("nav-settings").click();
  await page.getByTestId("settings-section-rotation").click();
  const send = page.getByTestId("rotation-send-otp");
  await expect(send).toBeDisabled();
  await page.getByTestId("rotation-store-name").fill("POS Demo");
  await send.click();
  const otp = page.getByTestId("rotation-otp-input");
  await otp.fill("540");
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  const gate = page.getByTestId("permission-verification-gate");
  await expect(gate).toBeVisible();
  await expect(otp).toHaveCount(0);
  await page.evaluate(() => {
    Reflect.deleteProperty(document, "visibilityState");
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(gate).toHaveCount(0);
  await expect(otp).toBeVisible();
  await expect(otp).toBeEnabled();
  await expect(otp).toHaveValue("");
  await expect(send).toBeDisabled();
  await expect(page.getByTestId("rotation-store-name")).toHaveValue("POS Demo");
  await expect(page.getByTestId("rotation-confirm")).toBeDisabled();
  await otp.fill("540218");
  await page.getByTestId("rotation-confirm").click();
  await expect(page.getByLabel("Store Key mới")).toHaveText(/^0001-[A-Z0-9]{32}$/);
  await page.getByRole("button", { name: "Dùng key mới trên máy này" }).click();
  await expect(page.getByTestId("passcode-screen")).toBeVisible();
  await expect(page.getByTestId("floor-view")).toHaveCount(0);
  await page.getByTestId("employee-30000000-0000-4000-8000-000000000011").click();
  await expect(page.getByTestId("unlock-button")).toBeDisabled();
  for (const digit of ["1", "2", "3", "4", "5", "6"]) await page.getByTestId(`pin-${digit}`).click();
  await page.getByTestId("unlock-button").click();
  await expect(page.getByTestId("floor-view")).toBeVisible();
});
