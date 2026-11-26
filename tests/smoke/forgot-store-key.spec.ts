import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

const confirmation = "Nếu email này đứng tên quán, thư chứa Store Key đã được gửi.";

test("public pairing and settings use the same email-only recovery dialog", async ({ page }, info) => {
  await page.goto("/?owner-recovery-mock=1");
  await page.getByTestId("go-store-pairing").click();
  await page.getByTestId("pairing-forgot-key").click();
  const dialog = page.getByRole("dialog", { name: "Quên Store Key?" });
  const email = dialog.getByTestId("forgot-key-email");
  const send = dialog.getByTestId("forgot-key-submit");
  await email.focus();
  await email.press("Tab");
  await expect(dialog.getByRole("button", { name: "Đóng" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(send).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(email).toBeFocused();
  await send.click();
  await expect(dialog.getByRole("alert")).toHaveText(/Địa chỉ email không hợp lệ/);
  await email.fill("  Fixture@invalid.test  ");
  await send.click();
  await expect(dialog.getByRole("status")).toHaveText(confirmation);
  await dialog.getByRole("button", { name: "Đóng" }).click();
  await expect(page.getByTestId("store-pairing-screen")).toBeVisible();

  await page.getByRole("button", { name: "Quay lại" }).click();
  const viewport = page.viewportSize();
  if (info.project.name === "portrait" && viewport) {
    await page.setViewportSize({ width: viewport.height, height: viewport.width });
  }
  await loginAsAdmin(page);
  await page.getByTestId("nav-settings").click();
  await page.getByTestId("settings-forgot-key").click();
  await expect(email).toHaveValue("");
  await email.fill("nobody@invalid.test");
  await send.click();
  await expect(dialog.getByRole("status")).toHaveText(confirmation);
  await dialog.getByRole("button", { name: "Đóng" }).click();
  await expect(page.getByTestId("save-settings-button")).toBeVisible();
});
