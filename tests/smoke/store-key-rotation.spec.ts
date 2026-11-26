import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test("owner rotates Store Key and re-pairs the current machine before entering PIN again", async ({ page }, info) => {
  test.skip(info.project.name === "portrait", "POS settings require landscape");
  await page.goto("/?owner-recovery-mock=1");
  await loginAsAdmin(page);
  await page.getByTestId("nav-settings").click();
  await page.getByTestId("settings-section-rotation").click();
  const send = page.getByTestId("rotation-send-otp");
  await expect(send).toBeDisabled();
  await page.getByTestId("rotation-store-name").fill("POS Demo");
  await send.click();
  await page.getByTestId("rotation-otp-input").fill("540218");
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
