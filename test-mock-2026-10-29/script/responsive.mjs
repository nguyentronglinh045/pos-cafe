// Responsive pass: same screens on common device sizes, screenshots + layout heuristics.
import fs from "node:fs";
import path from "node:path";
import { chromium, newPage, shot, login, layoutAudit, OUT } from "./lib.mjs";

const VIEWPORTS = [
  { name: "desktop-fhd", w: 1920, h: 1080 },
  { name: "laptop-1366", w: 1366, h: 768 },
  { name: "laptop-1280", w: 1280, h: 720 },
  { name: "bp-1279", w: 1279, h: 720 },
  { name: "ipad-air-land", w: 1180, h: 820, touch: true },
  { name: "ipad-land", w: 1024, h: 768, touch: true },
  { name: "bp-981", w: 981, h: 600, touch: true },
  { name: "bp-980", w: 980, h: 600, touch: true },
  { name: "phone-844-land", w: 844, h: 390, touch: true, mobile: true },
  { name: "phone-740-land", w: 740, h: 360, touch: true, mobile: true },
  { name: "phone-568-land", w: 568, h: 320, touch: true, mobile: true },
  { name: "ipad-portrait", w: 768, h: 1024, touch: true, portrait: true },
  { name: "phone-portrait", w: 390, h: 844, touch: true, mobile: true, portrait: true },
];
const only = process.argv[2] ? process.argv[2].split(",") : null;
const report = {};
const browser = await chromium.launch();

for (const vp of VIEWPORTS.filter(v => !only || only.includes(v.name))) {
  const r = report[vp.name] = { size: `${vp.w}x${vp.h}`, screens: {}, errors: [] };
  const { page, consoleErrors, context } = await newPage(browser, vp.w, vp.h, vp);
  page.setDefaultTimeout(8000);
  const capture = async (screen) => { await page.waitForTimeout(500); await shot(page, `R-${vp.name}-${screen}`); r.screens[screen] = await layoutAudit(page); };
  try {
    if (vp.portrait) {
      await page.goto("http://127.0.0.1:5175/");
      await page.waitForTimeout(2500);
      await shot(page, `R-${vp.name}-start`);
      r.screens.start = { text: (await page.locator("body").innerText()).replace(/\s+/g, " ").slice(0, 200) };
      await context.close();
      continue;
    }
    await login(page, "Thu ngân", "111111");
    await capture("floor");
    // Order panel toggle exists below 1280 per B01-07; record whether the list is visible.
    r.screens.floor.ordersPanelVisible = await page.getByTestId("floor-open-orders").isVisible().catch(() => false);
    r.screens.floor.ordersToggle = await page.getByTestId("floor-orders-toggle").isVisible().catch(() => false);
    const b02 = page.locator('[data-testid^="table-"]').filter({ hasText: "B02" }).first();
    await b02.scrollIntoViewIfNeeded().catch(() => {});
    await b02.click();
    await page.getByTestId("order-drawer").waitFor();
    await page.getByTestId("menu-item-80cfbd5a-a538-4da6-888d-2f732b7b8e2d").click();
    await page.getByTestId("menu-item-3e43bb8c-198f-443f-83ab-18696983edaa").click();
    await page.getByTestId("b02-modifier-dialog").waitFor();
    await capture("modifier");
    await page.getByTestId("modifier-value-62ca9453-5d44-47f4-8f85-a943d526348d").click();
    await page.getByTestId("modifier-confirm").click();
    await capture("order");
    await page.getByTestId("submit-order-button-footer").click();
    await page.getByTestId("receipt-document").waitFor({ timeout: 8000 });
    await capture("kitchen-receipt");
    await page.getByTestId("receipt-close-header").click();
    await page.waitForTimeout(4500);
    await b02.click();
    await page.getByTestId("order-drawer").waitFor();
    await page.getByTestId("submit-order-button-footer").click();
    await page.getByTestId("payment-drawer").waitFor();
    await capture("payment");
    await page.getByTestId("payment-close-button").click();
    await page.waitForTimeout(600);
    if (await page.getByTestId("order-drawer").isVisible().catch(() => false)) { await page.getByTestId("order-close-button").click(); await page.waitForTimeout(600); }
    await page.getByTestId("nav-takeaway").click();
    await page.waitForTimeout(800);
    await capture("takeaway");
  } catch (e) {
    r.errors.push(String(e.message || e).split("\n")[0].slice(0, 200));
    await shot(page, `R-${vp.name}-ERROR`).catch(() => {});
  }
  r.console = consoleErrors;
  await context.close();
  console.log(`${vp.name}: done, errors=${r.errors.length}`);
}
await browser.close();
fs.writeFileSync(path.join(OUT, "..", "responsive-report.json"), JSON.stringify(report, null, 2));
// Compact summary
for (const [name, r] of Object.entries(report)) {
  console.log(`\n== ${name} ${r.size} ${r.errors.length ? "ERR: " + r.errors.join("; ") : ""}`);
  for (const [s, a] of Object.entries(r.screens)) {
    if (a.text) { console.log(`  ${s}: "${a.text}"`); continue; }
    console.log(`  ${s}: overflowX=${a.pageOverflowX} overflowY=${a.pageOverflowY} clipped=${a.clipped.length} small=${a.small.length}${a.ordersPanelVisible !== undefined ? ` ordersPanel=${a.ordersPanelVisible} toggle=${a.ordersToggle}` : ""}`);
    if (a.clipped.length) console.log(`     clipped: ${a.clipped.slice(0, 6).join(" ; ")}`);
  }
  if (r.console?.length) console.log(`  console: ${r.console.slice(0, 3).join(" ; ")}`);
}
