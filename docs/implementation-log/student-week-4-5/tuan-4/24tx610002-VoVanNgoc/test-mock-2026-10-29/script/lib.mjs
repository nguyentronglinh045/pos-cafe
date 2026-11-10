import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const require = createRequire("f:/UTE/HK4/KLTN/pos-cafe-main/pos-cafe-main/package.json");
export const { chromium } = require("playwright");

export const BASE = "http://127.0.0.1:5175";
export const OUT = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "shots");
fs.mkdirSync(OUT, { recursive: true });

export const PINS = { owner: "123456", cashier: "111111", other: "384729" };

export async function newPage(browser, width, height, opts = {}) {
  const context = await browser.newContext({ viewport: { width, height }, hasTouch: !!opts.touch, isMobile: !!opts.mobile, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", m => { if (m.type() === "error") consoleErrors.push(m.text().slice(0, 200)); });
  page.on("pageerror", e => consoleErrors.push("pageerror: " + String(e).slice(0, 200)));
  return { context, page, consoleErrors };
}

export async function shot(page, name) {
  const file = path.join(OUT, name + ".png");
  await page.screenshot({ path: file });
  return file;
}

/** Pair the demo store (if needed) and unlock with an employee chosen by visible name pattern. */
export async function login(page, employeeName, pin) {
  await page.goto(BASE + "/");
  await page.getByTestId("landing-screen").or(page.getByTestId("passcode-screen")).first().waitFor({ timeout: 30000 });
  if (await page.getByTestId("landing-screen").isVisible()) {
    await page.getByTestId("go-store-pairing").click();
    await page.getByTestId("store-pairing-screen").waitFor();
    await page.getByTestId("store-key-input").fill("0001-X8F3QA");
    await page.getByTestId("go-passcode").click();
  }
  await page.getByTestId("passcode-screen").waitFor();
  await page.locator('[data-testid^="employee-"]').filter({ hasText: employeeName }).first().click();
  for (const d of pin) await page.getByTestId(`pin-${d}`).click();
  await page.getByTestId("unlock-button").click();
  await page.getByTestId("floor-view").waitFor({ timeout: 15000 });
  await page.waitForTimeout(800);
}

/** Layout heuristics: page-level horizontal overflow, visible controls below 44px, controls clipped by the viewport. */
export async function layoutAudit(page) {
  return page.evaluate(() => {
    const vw = window.innerWidth, vh = window.innerHeight;
    const doc = document.documentElement;
    const res = { viewport: `${vw}x${vh}`, pageOverflowX: doc.scrollWidth > vw + 1 ? doc.scrollWidth - vw : 0, pageOverflowY: doc.scrollHeight > vh + 1 ? doc.scrollHeight - vh : 0, small: [], clipped: [] };
    const controls = [...document.querySelectorAll('button, [role="button"], input, a[href], [role="checkbox"]')];
    for (const el of controls) {
      const r = el.getBoundingClientRect();
      const st = getComputedStyle(el);
      if (r.width === 0 || r.height === 0 || st.visibility === "hidden" || st.display === "none") continue;
      if (el.closest('[aria-hidden="true"], [inert]')) continue;
      const label = (el.getAttribute("data-testid") || el.getAttribute("aria-label") || el.textContent || el.tagName).trim().slice(0, 40);
      if ((r.width < 44 || r.height < 44) && el.type !== "checkbox" && el.type !== "hidden") res.small.push(`${label} ${Math.round(r.width)}x${Math.round(r.height)}`);
      if (r.right > vw + 1 || r.bottom > vh + 1 || r.left < -1 || r.top < -1) {
        // Only report when no scrollable ancestor could bring it into view.
        let p = el.parentElement, scrollable = false;
        while (p && p !== document.body) { const s = getComputedStyle(p); if (/(auto|scroll)/.test(s.overflowX + s.overflowY) && (p.scrollHeight > p.clientHeight || p.scrollWidth > p.clientWidth)) { scrollable = true; break; } p = p.parentElement; }
        if (!scrollable) res.clipped.push(`${label} [${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}x${Math.round(r.height)}]`);
      }
    }
    res.small = [...new Set(res.small)].slice(0, 25);
    res.clipped = [...new Set(res.clipped)].slice(0, 25);
    return res;
  });
}
