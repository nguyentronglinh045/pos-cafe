import { chromium, newPage, login, shot } from "./lib.mjs";
const browser = await chromium.launch();
for (const [w, h] of [[1920, 1080], [1366, 768], [1280, 720], [1180, 820], [1024, 768], [981, 600], [844, 390]]) {
  const { page, context } = await newPage(browser, w, h, { touch: true });
  page.setDefaultTimeout(8000);
  await login(page, "Thu ngân", "111111");
  await page.locator('[data-testid^="table-"]').filter({ hasText: "B02" }).first().click();
  await page.getByTestId("order-drawer").waitFor();
  await page.getByTestId("submit-order-button-footer").click();
  await page.getByTestId("payment-drawer").waitFor();
  await page.waitForTimeout(600);
  const pos = async () => page.evaluate(() => {
    const vh = window.innerHeight;
    const footer = document.querySelector('[data-testid="b03-footer"]')?.getBoundingClientRect();
    const limit = footer ? footer.top : vh;
    return ["payment-key-0", "payment-key-delete", "b03-quick-0", "payment-received-amount"].map(id => {
      const r = document.querySelector(`[data-testid="${id}"]`)?.getBoundingClientRect();
      return r ? `${id}: y=${Math.round(r.top)}..${Math.round(r.bottom)}${r.bottom > limit ? " (khuất dưới footer/mép)" : ""}` : `${id}: không có`;
    }).join(" | ");
  });
  const before = await pos();
  await page.getByTestId("payment-key-0").scrollIntoViewIfNeeded();
  const after = await pos();
  console.log(`${w}x${h}\n  trước cuộn: ${before}\n  sau cuộn:  ${after}`);
  await context.close();
}
await browser.close();
