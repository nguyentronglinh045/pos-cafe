import { chromium, newPage, login } from "./lib.mjs";
const browser = await chromium.launch();
for (const [w, h] of [[568, 320], [740, 360], [844, 390], [1024, 768]]) {
  const { page, context } = await newPage(browser, w, h, { touch: true });
  page.setDefaultTimeout(8000);
  await login(page, "Thu ngân", "111111");
  await page.getByTestId("nav-takeaway").click();
  await page.waitForTimeout(800);
  const info = await page.evaluate(() => {
    const vw = window.innerWidth;
    const out = [];
    for (const el of document.querySelectorAll("h2, h3, div, span")) {
      const t = (el.childNodes[0]?.nodeType === 3 ? el.childNodes[0].textContent : "").trim();
      if (!/^(Chi tiết đơn|Đơn số|#26|84\.000|42K|Tổng)/.test(t)) continue;
      const r = el.getBoundingClientRect();
      if (r.width) out.push(`${t.slice(0, 14)} x=${Math.round(r.left)}..${Math.round(r.right)} (vw=${vw})${r.right > vw ? " NGOÀI MÀN" : ""}`);
    }
    // nearest horizontally-scrollable container of the detail pane
    const sc = [...document.querySelectorAll("*")].filter(e => e.scrollWidth > e.clientWidth + 2 && /(auto|scroll)/.test(getComputedStyle(e).overflowX)).map(e => `${e.className.toString().slice(0, 40)} sw=${e.scrollWidth} cw=${e.clientWidth}`);
    const hidden = [...document.querySelectorAll("*")].filter(e => e.scrollWidth > e.clientWidth + 2 && getComputedStyle(e).overflowX === "hidden" && e.clientWidth > 200).map(e => `${(e.getAttribute("data-testid") || e.className.toString()).slice(0, 50)} sw=${e.scrollWidth} cw=${e.clientWidth}`);
    return { out: [...new Set(out)].slice(0, 10), scrollable: sc.slice(0, 5), hiddenOverflow: hidden.slice(0, 5) };
  });
  console.log(`\n== ${w}x${h}`, JSON.stringify(info, null, 1));
  await context.close();
}
await browser.close();
