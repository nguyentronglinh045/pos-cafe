import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import { loginAsAdmin } from '../../smoke/helpers';
const TABLE='a254abd0-b883-4d5c-85c1-89f660409e02', AMERICANO='80cfbd5a-a538-4da6-888d-2f732b7b8e2d';
const matrix=[[568,320],[844,390],[981,320],[1024,600],[1024,768],[1440,900],[1920,1080],[2560,1080],[759,390],[760,390],[761,390],[1099,600],[1100,600],[1101,600],[1599,900],[1600,900],[1601,900],[568,479],[568,480],[568,481],[1024,479],[1024,480],[1024,481]];
async function fixture(page:Page, state='clean', width=568,height=320) {
  await page.setViewportSize({width,height});
  await page.goto('/tests/ui-remake/b02/harness.html?case='+state);
  await expect(page.getByTestId('order-drawer')).toBeVisible();
  if(!['menu-loading','menu-error','order-loading','order-error'].includes(state)) await expect(page.getByTestId('order-total-amount')).not.toHaveAttribute('data-amount','0');
  await page.evaluate(()=>document.fonts.ready);
}
async function geometry(page:Page, all=true) {
  await page.mouse.move(-1,-1); // Do not keep react-hot-toast paused under a hovered pointer after resize.
  await page.locator(':root:not(:has([data-rht-toaster] > div)) [data-testid="order-drawer"]').waitFor({timeout:15000});
  await expect.poll(()=>page.getByTestId('order-drawer').evaluate(e=>{const r=e.getBoundingClientRect();return Math.abs(r.x)<=1&&Math.abs(r.y)<=1&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1;})).toBe(true);
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  const failures=await page.getByTestId('order-drawer').evaluate((root, all)=>{
    const errors:string[]=[];
    const r=root.getBoundingClientRect();
    if(r.x < -1 || r.y < -1 || r.right>innerWidth+1 || r.bottom>innerHeight+1) errors.push('drawer outside viewport');
    if(document.documentElement.scrollWidth>innerWidth+1) errors.push('page horizontal overflow');
    const controls=root.querySelectorAll<HTMLElement>(all?'button,input':'[data-testid=submit-order-button-footer],[data-testid=order-close-button],[data-testid=b02-search]');
    const scrolls=[root,...Array.from(root.querySelectorAll('*'))].map(e=>({e,x:e.scrollLeft,y:e.scrollTop}));
    for(const e of controls){if(e.getClientRects().length===0)continue;
      const b=e.getBoundingClientRect(); if(b.width<44||b.height<44)errors.push(`${e.dataset.testid??e.textContent}: target ${b.width}x${b.height}`);
      if(e.matches(':disabled'))continue;
      e.scrollIntoView({block:'center',inline:'nearest'});
      const a=e.getBoundingClientRect(),hit=document.elementFromPoint(a.x+a.width/2,a.y+a.height/2);
      if(!hit||!e.contains(hit))errors.push(`${e.dataset.testid??e.textContent}: occluded`);
    }
    scrolls.forEach(({e,x,y})=>{e.scrollLeft=x;e.scrollTop=y;});return errors;
  },all);
  expect(failures).toEqual([]);
}
for(const [width,height] of matrix)test(`matrix ${width}x${height} clean+dirty`,async({page},info)=>{
  // Full application entry, real pairing/login, then resize the existing drawer.
  await page.setViewportSize({width:1920,height:1080});await page.goto('/');await loginAsAdmin(page);
  await page.getByTestId('table-'+TABLE).click();await expect(page.getByTestId('order-total-amount')).toHaveAttribute('data-amount','125000');
  await page.setViewportSize({width,height});await geometry(page);
  await page.getByTestId('menu-item-'+AMERICANO).click();await expect(page.getByTestId('order-total-amount')).toHaveAttribute('data-amount','160000');
  await geometry(page);await page.mouse.move(-1,-1);
  await page.screenshot({path:info.outputPath('dirty.png')});
});
test('fluid width sweep at 320/390/600 and exact breakpoints',async({page},info)=>{
  test.setTimeout(180_000);await fixture(page);const measurements=[];
  const widths=[...new Set([...Array.from({length:43},(_,i)=>568+i*32),1920,759,760,761,1099,1100,1101,1599,1600,1601])].sort((a,b)=>a-b);
  for(const height of [320,390,600])for(const width of widths.filter(w=>w>height)){
    await page.setViewportSize({width,height});await geometry(page,false);measurements.push({width,height,pass:true});
  }
  await fs.writeFile(info.outputPath('sweep.json'),JSON.stringify(measurements,null,2));
});
test('minimum: keyboard modifiers, focus, notes, keep/discard; touch menu and category scroll',async({page,context})=>{
  await fixture(page);
  const search=page.getByTestId('b02-search');await search.fill('Cà phê sữa');
  const item=page.getByTestId('menu-item-3e43bb8c-198f-443f-83ab-18696983edaa');await item.focus();await page.keyboard.press('Enter');
  const modal=page.getByTestId('b02-modifier-dialog');await expect(modal).toBeVisible();
  await expect(page.getByTestId('modifier-confirm')).toBeEnabled(); // Seeded coffee modifiers are optional.
  for(const button of await modal.getByRole('button').all()){const b=await button.boundingBox();expect(b?.width).toBeGreaterThanOrEqual(44);expect(b?.height).toBeGreaterThanOrEqual(44);}
  await page.keyboard.press('Shift+Tab');await expect(page.getByTestId('modifier-confirm')).toBeFocused();
  await page.keyboard.press('Escape');await expect(modal).toBeHidden();await expect(item).toBeFocused();
  await search.fill('Americano');await page.getByTestId('menu-item-'+AMERICANO).click();
  const line=page.getByTestId('order-cart-line').last();await line.getByTestId('b02-note').click();await line.getByTestId('b02-line-note').fill('Ít đá '.repeat(20));
  await page.getByTestId('order-close-button').click();const discard=page.getByTestId('b02-discard-dialog');await expect(discard).toBeVisible();
  await page.keyboard.press('Escape');await expect(discard).toBeHidden();await expect(page.getByTestId('order-total-amount')).toHaveAttribute('data-amount','160000');
  await page.getByTestId('order-close-button').click();await discard.getByRole('button',{name:'Bỏ đơn',exact:true}).click();await expect(page.getByTestId('order-drawer')).toBeHidden();
  const touch=await context.browser()!.newContext({hasTouch:true,viewport:{width:568,height:320},locale:"vi-VN",timezoneId:"Asia/Ho_Chi_Minh",colorScheme:"light",reducedMotion:"reduce"});const t=await touch.newPage();
  try{await t.goto(new URL('/tests/ui-remake/b02/harness.html',page.url()).href);await t.getByTestId('b02-search').fill('Americano');await t.getByTestId('menu-item-'+AMERICANO).tap();await expect(t.getByTestId('order-total-amount')).toHaveAttribute('data-amount','160000');const cat=t.locator('.category-list button').last();await cat.tap();await geometry(t);}finally{await touch.close();}
});
for(const state of ['menu-loading','menu-error','order-loading','order-error','empty','unavailable','paid','void','deny','cashier'])test(`state ${state}`,async({page},info)=>{
  await fixture(page,state);await geometry(page);
  if(state==='menu-loading')await expect(page.getByText('Đang tải menu...')).toBeVisible();
  if(state.endsWith('error')){await expect(page.getByTestId(state==='menu-error'?'order-menu-error-state':'order-error-state')).toBeVisible();await page.evaluate(()=> (window as any).b02.retry());await page.getByRole('button',{name:state==='menu-error'?'Thử tải lại':'Thử lại',exact:true}).click();await expect(page.getByTestId('menu-item-'+AMERICANO)).toBeVisible();await expect(page.getByTestId('order-total-amount')).toHaveAttribute('data-amount','125000');}
  if(state==='order-loading'||state==='deny'||state==='paid'||state==='void')await expect(page.getByTestId('submit-order-button-footer')).toBeDisabled();
  if(state==='empty')await expect(page.getByText('Không có món.')).toBeVisible();
  if(state==='unavailable')await expect(page.getByTestId('menu-item-'+AMERICANO)).toBeDisabled();
  if(state==='cashier')await expect(page.getByTestId('submit-order-button-footer')).toBeEnabled();
  if(state==='void')await expect(page.getByTestId('b02-header')).toContainText('Đã hủy');
  await page.screenshot({path:info.outputPath(state+'.png')});
});
test('stress: 120-char labels/notes, 100 menu and cart lines, quantity 999 and large money',async({page},info)=>{
  await fixture(page,'stress');await geometry(page);await expect(page.getByTestId('order-cart-line')).toHaveCount(100);
  await page.locator('.product').last().scrollIntoViewIfNeeded();await expect(page.locator('.product').last()).toBeInViewport();
  await page.getByTestId('order-cart-line').last().scrollIntoViewIfNeeded();await expect(page.getByTestId('order-cart-line').last()).toBeInViewport();
  const overflow=await page.locator('.cart-footer,.line-top,.summary-row').evaluateAll(es=>es.filter(e=>e.scrollWidth>e.clientWidth+1).map(e=>e.className));expect(overflow).toEqual([]);
  await page.screenshot({path:info.outputPath('stress.png')});
});
test('saved + preserves snapshot and creates new current-priced line; zero removes only new row; clamp 999',async({page})=>{
  await fixture(page);await page.evaluate(()=> (window as any).b02.historical());
  const saved=page.getByTestId('order-cart-line').first();await saved.getByTestId('order-cart-increase').click();
  const added=page.getByTestId('order-cart-line').last();await expect(saved).toHaveAttribute('data-quantity','2');await expect(saved).toHaveAttribute('data-unit-price','29000');await expect(added).toHaveAttribute('data-unit-price','51000');
  await added.getByTestId('order-cart-decrease').click();await expect(page.getByTestId('order-cart-line')).toHaveCount(3);
  await saved.getByTestId('order-cart-decrease').click();await saved.getByTestId('order-cart-decrease').click();await expect(page.getByTestId('order-cart-line')).toHaveCount(2);
  expect(await page.evaluate(()=> (window as any).b02.store.getState().draftItems.some((d:any)=>d.sourceItemId&&d.quantity===0))).toBe(true);
  await page.getByTestId('menu-item-'+AMERICANO).click();
  await page.evaluate(()=>{const s=(window as any).b02.store;const d=s.getState().draftItems;s.getState().setDraftItems(d.map((x:any)=>({...x,quantity:!x.sourceItemId?999:x.quantity})));});
  const newest=page.getByTestId('order-cart-line').last();await newest.getByTestId('order-cart-increase').click();await expect(newest).toHaveAttribute('data-quantity','999');
  await geometry(page);
});
test('remote conflict and offline block leave draft intact, recovery CTA reachable',async({page,context},info)=>{
  await fixture(page);await page.getByTestId('menu-item-'+AMERICANO).click();await page.evaluate(()=> (window as any).b02.remote());
  await expect(page.getByRole('alert')).toContainText('Đơn đã thay đổi');await expect(page.getByTestId('submit-order-button-footer')).toBeDisabled();await geometry(page);
  await page.getByRole('button',{name:'Bỏ bản đang sửa và dùng đơn trên server'}).click();await expect(page.getByTestId('order-total-amount')).toHaveAttribute('data-amount','125000');
  await context.setOffline(true);await expect(page.getByTestId('write-attempt-notice')).toBeVisible();await expect(page.getByTestId('submit-order-button')).toBeDisabled();await geometry(page);await page.screenshot({path:info.outputPath('offline.png')});await context.setOffline(false);
});
test('price review preserves saved prices, submit closes and creates initial kitchen preview',async({page},info)=>{
  await fixture(page);await page.getByTestId('menu-item-'+AMERICANO).click();await page.evaluate(()=> (window as any).b02.price());
  await page.getByTestId('submit-order-button-footer').click();await expect(page.getByTestId('price-changed-review')).toBeVisible();await expect(page.getByTestId('submit-order-button-footer')).toBeDisabled();await geometry(page);await page.screenshot({path:info.outputPath('price.png')});
  await page.getByRole('button',{name:'Dùng giá mới để kiểm tra lại giỏ'}).click();await expect(page.getByTestId('order-total-amount')).toHaveAttribute('data-amount','161000');
  await page.getByTestId('submit-order-button-footer').click();await expect(page.getByTestId('order-drawer')).toBeHidden();await expect(page.getByTestId('fixture-receipt')).toHaveText('kitchen');
});
test('permission denial survives programmatic click bypass',async({page})=>{
  await fixture(page);await page.getByTestId('menu-item-'+AMERICANO).click();await page.evaluate(()=> (window as any).b02.denyUpdate());await expect(page.getByTestId('submit-order-button-footer')).toBeDisabled();
  await page.getByTestId('submit-order-button-footer').evaluate(e=>{e.removeAttribute('disabled');(e as HTMLElement).click();});
  expect(await page.evaluate(()=> (window as any).b02.state.orders.find((o:any)=>o.orderNo===24).total)).toBe(125000);await expect(page.getByTestId('order-drawer')).toBeVisible();
});
test('shared palette module update changes actual CSS controls and MUI popup together',async({page})=>{
  const palette=JSON.parse(await fs.readFile('ui-remake/palette-a-v1.json','utf8'));
  const changed={...palette,colors:{...palette.colors,'--primary':'#145A64'}};let intercepted=0;
  await page.route('**/ui-remake/palette-a-v1.json*',route=>{intercepted++;return route.fulfill({contentType:'text/javascript',body:'export default '+JSON.stringify(changed)});});
  await fixture(page);
  expect(intercepted).toBeGreaterThan(0);
  await expect(page.getByTestId('submit-order-button')).toHaveCSS('background-color','rgb(20, 90, 100)');
  await page.getByTestId('menu-item-3e43bb8c-198f-443f-83ab-18696983edaa').click();
  await expect(page.getByTestId('modifier-confirm')).toHaveCSS('background-color','rgb(20, 90, 100)');
});
