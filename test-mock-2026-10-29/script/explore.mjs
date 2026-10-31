import { chromium, newPage, shot, BASE } from "./lib.mjs";

const browser = await chromium.launch();
const { page, consoleErrors } = await newPage(browser, 1366, 768);
await page.goto(BASE + "/");
await page.getByTestId("landing-screen").or(page.getByTestId("passcode-screen")).first().waitFor({ timeout: 30000 });
await shot(page, "00-landing");
if (await page.getByTestId("landing-screen").isVisible()) {
  await page.getByTestId("go-store-pairing").click();
  await page.getByTestId("store-key-input").fill("0001-X8F3QA");
  await page.getByTestId("go-passcode").click();
}
await page.getByTestId("passcode-screen").waitFor();
await shot(page, "01-passcode");
const emps = await page.locator('[data-testid^="employee-"]').evaluateAll(els => els.map(e => `${e.getAttribute("data-testid")} | ${e.textContent.trim()}`));
console.log("EMPLOYEES", emps);
console.log("ERRORS", consoleErrors);
await browser.close();
