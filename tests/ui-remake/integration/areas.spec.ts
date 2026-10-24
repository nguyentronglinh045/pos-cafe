import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs/promises";
import { readFileSync } from "node:fs";
import { loginAsAdmin } from "../../smoke/helpers";

const contract = JSON.parse(readFileSync("artifacts/stitch/B01/v3/responsive-contract.proposed.json", "utf8"));
type Fixture = { count: number; long: boolean };
async function fixtureRoute(page: Page, current: () => Fixture) {
  await page.route(/\/src\/adapters\/mock\/mockData\.ts(?:\?|$)/, async route => {
    const response = await route.fetch(), { count, long } = current();
    const patch = `
      const integrationCount=${count};
      mockFloorPlan.areas.splice(integrationCount);
      while(mockFloorPlan.areas.length<integrationCount){const i=mockFloorPlan.areas.length,id='integration-area-'+i;mockFloorPlan.areas.push({...mockFloorPlan.areas[0],id,name:'Lầu '+i,sortOrder:i});mockFloorPlan.tables.push({...mockFloorPlan.tables[0],id:'integration-table-'+i,areaId:id,name:'T'+i,status:'empty'});}
      ${long ? "mockFloorPlan.areas.forEach((a,i)=>{a.name='Khu vực tầng '+i+' — Không gian yên tĩnh dành cho nhóm khách làm việc và họp dự án tại quán cà phê. '.repeat(2)});" : ""}
    `;
    await route.fulfill({ response, body: await response.text() + "\n" + patch });
  });
}

async function measure(page: Page) {
  await page.mouse.move(-1, -1);
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  return page.getByTestId("floor-view").evaluate(root => {
    const rect = (e: Element) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right }; };
    const list = root.querySelector<HTMLElement>('[data-testid="floor-area-scroller"]')!;
    const buttons = [...list.querySelectorAll<HTMLButtonElement>("[aria-pressed]")];
    const active = buttons.find(e => e.getAttribute("aria-pressed") === "true")!, a = rect(active), b = rect(list);
    const filters = [...root.querySelectorAll<HTMLElement>('[data-testid^="floor-filter-"]')].map(e => ({ ...rect(e), text: e.textContent?.trim(), clipped: e.scrollWidth > e.clientWidth + 1 }));
    const arrows = [...root.querySelectorAll<HTMLButtonElement>(".area-step")].filter(e => !e.hidden).map(e => {
      const r = rect(e), hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      return { ...r, disabled: e.disabled, hit: e.disabled || !!hit && e.contains(hit) };
    });
    return { count: buttons.length, activeName: active.getAttribute("aria-label"), activeText: active.textContent, activeCount: active.querySelector(".tab-count")?.textContent, selected: active.dataset.testid, activeVisible: a.x >= b.x - 1 && a.right <= b.right + 1, rows: new Set(buttons.map(e => Math.round(rect(e).y))).size, minWidth: Math.min(...buttons.map(e => rect(e).width)), scrollLeft: list.scrollLeft, scrollMax: list.scrollWidth-list.clientWidth, names: buttons.map(e=>e.getAttribute("aria-label")), titles: buttons.map(e=>e.title), minHeight: Math.min(...buttons.map(e => rect(e).height)), canvasHeight: rect(root.querySelector('[data-testid="floor-canvas-viewport"]')!).height, toolbarHeight: rect(root.querySelector('[data-testid="floor-toolbar"]')!).height, overflow: document.documentElement.scrollWidth - innerWidth, filters, arrows };
  });
}
function assertLayout(m: Awaited<ReturnType<typeof measure>>, count: number) {
  expect(m.minWidth).toBeGreaterThanOrEqual(44); expect(m.titles).toEqual(m.names); expect(m.count).toBe(count); expect(m.rows).toBe(1); expect(m.minHeight).toBeGreaterThanOrEqual(44);
  expect(m.canvasHeight).toBeGreaterThanOrEqual(44); expect(m.overflow).toBeLessThanOrEqual(1); expect(m.activeVisible, JSON.stringify(m)).toBe(true);
  expect(m.filters.map(f => f.text)).toEqual(["Tất cả", "Trống", "Đang phục vụ"]);
  for (const f of m.filters) { expect(f.width).toBeGreaterThanOrEqual(44); expect(f.height).toBeGreaterThanOrEqual(44); expect(f.clipped).toBe(false); }
  for (const a of m.arrows) { expect(a.width).toBeGreaterThanOrEqual(44); expect(a.height).toBeGreaterThanOrEqual(44); expect(a.hit).toBe(true); }
}

for (const { width, height } of contract.viewports) test(`area strip ${width}x${height}: 1/2/5/6 and long names`, async ({ page }, info) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width, height });
  let current: Fixture = { count: 1, long: false };
  await fixtureRoute(page, () => current);
  const results = []; let toolbarHeight: number | undefined;
  for (const count of [1, 2, 5, 6]) for (const long of [false, true]) {
    current = { count, long };
    if (results.length) await page.evaluate(() => localStorage.clear());
    await page.goto("/"); await loginAsAdmin(page);
    const initial = await measure(page); assertLayout(initial, count);
    if (toolbarHeight === undefined) toolbarHeight = initial.toolbarHeight;
    expect(initial.toolbarHeight).toBe(toolbarHeight);
    if (long) expect(initial.activeName!.length).toBeGreaterThanOrEqual(80);
    const selectedBeforeScroll = initial.selected;
    expect(initial.arrows.length).toBe(initial.scrollMax > 1 ? 2 : 0);
    if(initial.arrows.length){expect(initial.arrows[0].disabled).toBe(true);expect(initial.arrows[1].disabled).toBe(false);}
    const next = page.getByTestId("floor-area-next");
    if (initial.arrows.length) { await next.tap(); const moved=await measure(page); expect(moved.selected).toBe(selectedBeforeScroll);expect(moved.scrollLeft).toBeGreaterThan(initial.scrollLeft);await page.getByTestId("floor-area-prev").tap();const back=await measure(page);expect(back.scrollLeft).toBeLessThan(moved.scrollLeft);expect(back.selected).toBe(selectedBeforeScroll); }
    const buttons = page.getByTestId("floor-area-scroller").locator("button");
    for (let index = 0; index < count; index++) {
      const button = buttons.nth(index);
      await button.focus(); await button.press("Enter");
      const selected = await measure(page); assertLayout(selected, count); expect(selected.selected).toBe(await button.getAttribute("data-testid"));
      await expect(button).toBeFocused(); await expect(button).toHaveAccessibleName(selected.names[index]!); if(long) expect(selected.names[index]!.length).toBeGreaterThanOrEqual(80);
      const expectedName=long ? "Khu vực tầng "+index+" — Không gian yên tĩnh dành cho nhóm khách làm việc và họp dự án tại quán cà phê. ".repeat(2) : ["Tầng trệt","Lầu 1"][index] ?? "Lầu "+index;
      await expect(button).toHaveAccessibleName(expectedName);
      if (index >= 2) { expect(selected.activeCount).toBe("1"); await expect(page.getByTestId(`table-integration-table-${index}`)).toHaveCount(1); }
    }
    if (count === 6) {
      await page.setViewportSize({ width: 1920, height: 1080 }); await measure(page);
      await page.setViewportSize({ width, height }); const resized = await measure(page); assertLayout(resized, count); expect(resized.selected).toBe("floor-area-integration-area-5");
    }
    if (count === 6 && [568, 981, 1280, 1920].includes(width) && [320, 768, 1080].includes(height)) await page.screenshot({ path: info.outputPath(`${count}-${long ? "long" : "short"}-${width}x${height}.png`) });
    results.push({ count, long, initial });
  }
  await fs.writeFile(info.outputPath("areas.json"), JSON.stringify({ width, height, fixtures: results }, null, 2));
});


for(const width of [568,1920])test('area modalities and scroll edges '+width,async({page})=>{
  await page.setViewportSize({width,height:320});await fixtureRoute(page,()=>({count:6,long:true}));await page.goto('/');await loginAsAdmin(page);
  const list=page.getByTestId('floor-area-scroller'),buttons=list.locator('button'),next=page.getByTestId('floor-area-next'),prev=page.getByTestId('floor-area-prev');
  const initial=await measure(page),beforeTables=await page.locator('[data-table-status]').evaluateAll(es=>es.map(e=>e.getAttribute('data-testid')));
  if(initial.arrows.length){
    await expect(prev).toBeDisabled();await expect(next).toBeEnabled();
    for(let n=0;n<20&&await next.isEnabled();n++)await next.tap();
    const end=await measure(page);expect(end.scrollLeft).toBeGreaterThan(0);expect(Math.abs(end.scrollLeft-end.scrollMax)).toBeLessThanOrEqual(1);await expect(next).toBeDisabled();await expect(prev).toBeEnabled();
    expect(end.selected).toBe(initial.selected);expect(await page.locator('[data-table-status]').evaluateAll(es=>es.map(e=>e.getAttribute('data-testid')))).toEqual(beforeTables);
    for(let n=0;n<20&&await prev.isEnabled();n++)await prev.tap();await expect(prev).toBeDisabled();expect((await measure(page)).scrollLeft).toBeLessThanOrEqual(1);
    // Native wheel scrolling, without selecting another area.
    await list.hover();await page.mouse.wheel(200,0);await expect.poll(()=>list.evaluate(e=>e.scrollLeft)).toBeGreaterThan(0);expect((await measure(page)).selected).toBe(initial.selected);
  }
  await buttons.last().tap();let m=await measure(page);assertLayout(m,6);expect(m.selected).toBe('floor-area-integration-area-5');
  await page.keyboard.press('Shift+Tab');await expect(buttons.nth(4)).toBeFocused();await page.keyboard.press('Enter');m=await measure(page);assertLayout(m,6);expect(m.selected).toBe('floor-area-integration-area-4');
  await page.keyboard.press('Tab');await expect(buttons.last()).toBeFocused();await page.keyboard.press('Space');m=await measure(page);assertLayout(m,6);expect(m.selected).toBe('floor-area-integration-area-5');
});
