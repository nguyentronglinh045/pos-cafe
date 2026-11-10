import { chromium, newPage, shot, login } from "./lib.mjs";
const browser = await chromium.launch();
for (const [name, w, h] of [["phone-portrait", 390, 844], ["ipad-portrait", 768, 1024]]) {
  const { page, context } = await newPage(browser, w, h, { touch: true });
  page.setDefaultTimeout(8000);
  try {
    await page.goto("http://127.0.0.1:5175/");
    await page.getByTestId("landing-screen").or(page.getByTestId("passcode-screen")).first().waitFor({ timeout: 30000 });
    await page.getByTestId("go-store-pairing").click();
    await page.getByTestId("store-key-input").fill("0001-X8F3QA");
    await page.getByTestId("go-passcode").click();
    await page.waitForTimeout(1500);
    await shot(page, `P-${name}-after-pairing`);
    console.log(name, "after pairing:", (await page.locator("body").innerText()).replace(/\s+/g, " ").slice(0, 200));
    // rotate to landscape and back
    await page.setViewportSize({ width: h, height: w });
    await page.waitForTimeout(1200);
    await shot(page, `P-${name}-rotated-landscape`);
    console.log(name, "rotated → landscape:", (await page.locator("body").innerText()).replace(/\s+/g, " ").slice(0, 120));
  } catch (e) { console.log(name, "ERR", String(e.message).split("\n")[0]); }
  await context.close();
}
await browser.close();
