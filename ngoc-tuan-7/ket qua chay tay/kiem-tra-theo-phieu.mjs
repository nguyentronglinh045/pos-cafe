// Kiểm tra UI tự động theo phiếu tuần 7, do AI thực hiện; không xác nhận Ngọc tự chạy tay.
// Expected r04 = Expected r02 + cập nhật theo câu trả lời của Linh ngày 08/11/2026 (Q-N01-1…8, CX-01…CX-04)
// + ca mới N01-09…N01-13 lấy từ order-management (mang đi), remake-b02 B02-02/B02-04, remake-b03 R04/R06.
// Kết quả mỗi bước: ĐÚNG | LỆCH — chờ CX-xx (Linh đã chốt sửa, chưa có code) | LỖI (khác Expected, chưa có trong CX) | CHƯA CHẠY.
// Chạy: node run-n01-r04.mjs <projectDir> <outDir> [baseURL]
// Tuần 7: đặt biến N01_SOURCE để ghi đúng commit đang chạy, ví dụ N01_SOURCE="main 2e57649".
// Mã cửa hàng và PIN dưới đây là dữ liệu demo có sẵn trong mã nguồn chế độ mock, không phải thông tin thật.
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const [projectDir, outDir, baseURL = "http://127.0.0.1:5175"] = process.argv.slice(2);
const require = createRequire(join(projectDir, "package.json"));
const { chromium, expect } = require("@playwright/test");

const ID = {
  owner: ["30000000-0000-4000-8000-000000000011", "123456"],
  cashier: ["30000000-0000-4000-8000-000000000013", "111111"],
  waiter: ["30000000-0000-4000-8000-000000000014", "384729"],
  B01: "7b035353-73d6-44bc-8ec4-1ab9951f7a58",
  B02: "a254abd0-b883-4d5c-85c1-89f660409e02",
  americano: "80cfbd5a-a538-4da6-888d-2f732b7b8e2d",
  caPheSua: "3e43bb8c-198f-443f-83ab-18696983edaa",
  groupSize: "054f9798-4ba4-49f3-8e40-8ca109eeb95e",
  sizeM: "a5f986a6-ea67-4dd3-866e-42a0be8a0497",
  catCaPhe: "c68d7fbd-c06a-42a4-8140-476da8ebbf74",
  catTra: "1ebf92aa-cf30-4e0d-8279-2b6fe3f8fb54",
};
const VIEWPORT = { width: 1366, height: 768 };
const clock = () => new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Bangkok", hour12: false });
const results = [];
const text = async (loc) => ((await loc.textContent()) ?? "").replace(/\s+/g, " ").trim();
const attr = (loc, name) => loc.getAttribute(name);
const due = (page) => attr(page.getByTestId("payment-order-summary"), "data-amount-due");
const received = (page) => attr(page.getByTestId("payment-received-amount"), "data-amount");
const total = (page) => attr(page.getByTestId("order-total-amount"), "data-amount");
const ok = (cond, lech = "LỖI") => (cond ? "ĐÚNG" : lech);

async function login(page, [employeeId, pin]) {
  await page.getByTestId("landing-screen").or(page.getByTestId("passcode-screen")).first().waitFor({ timeout: 30000 });
  if (await page.getByTestId("landing-screen").isVisible()) {
    await page.getByTestId("go-store-pairing").click();
    await page.getByTestId("store-key-input").fill("0001-X8F3QA");
    await page.getByTestId("go-passcode").click();
  }
  await page.getByTestId("passcode-screen").waitFor();
  await page.getByTestId(`employee-${employeeId}`).click();
  for (const d of pin) await page.getByTestId(`pin-${d}`).click();
  await page.getByTestId("unlock-button").click();
  await page.getByTestId("floor-view").waitFor();
  await page.mouse.move(-1, -1);
  await page.locator(':root:not(:has([data-rht-toaster] > div)) [data-testid="floor-view"]').waitFor({ timeout: 15000 });
}
async function openTable(page, id) {
  const t = page.getByTestId(`table-${id}`);
  await t.scrollIntoViewIfNeeded();
  await t.click();
  await page.getByTestId("order-drawer").waitFor();
  await page.waitForTimeout(300);
}
async function closeReceipt(page) {
  await page.getByTestId("receipt-close-header").click();
  await page.getByTestId("receipt-preview").waitFor({ state: "detached", timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(300);
}
async function openPayment(page) {
  await openTable(page, ID.B02);
  await page.getByTestId("submit-order-button-footer").click();
  await page.getByTestId("payment-drawer").waitFor();
  await page.waitForTimeout(300);
}
const takeawayCount = async (page) => {
  await page.getByTestId("nav-takeaway").click();
  await page.getByTestId("takeaway-drawer").waitFor(); await page.waitForTimeout(300);
  const c = await text(page.getByTestId("takeaway-drawer").locator("header p"));
  return c;
};
const closeTakeaway = (page) => page.getByTestId("takeaway-drawer").getByRole("button", { name: "Đóng", exact: true }).first().click();

async function runCase(browser, caseId, title, fn) {
  const dir = join(outDir, "anh", caseId);
  mkdirSync(dir, { recursive: true });
  const context = await browser.newContext({ baseURL, viewport: caseId === "MANG-DI" ? {width:568,height:320} : VIEWPORT, deviceScaleFactor: 1, locale: "vi-VN", timezoneId: "Asia/Ho_Chi_Minh" });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 200)));
  const steps = [];
  page.setDefaultTimeout(10000);
  const start = clock();
  const step = async (id, expected, source, body) => {
    const rec = { id, expected, source, observed: "", status: "CHƯA CHẠY", shot: `${caseId}/${id}.png`, time: clock() };
    try { Object.assign(rec, await body()); } catch (e) {
      rec.status = "CHƯA CHẠY";
      rec.observed = `Không thực hiện được: ${String(e.message || e).split("\n")[0].slice(0, 220)}`;
    }
    await page.mouse.move(-1, -1);
    await page.screenshot({ path: join(dir, `${id}.png`) }).catch(() => {});
    steps.push(rec);
  };
  await page.goto("/");
  await fn(page, step);
  results.push({ caseId, title, start, end: clock(), steps, pageErrors: errors });
  console.log(`${caseId} ${start}-${clock()}: ${steps.map((s) => `${s.id}=${s.status.split(" ")[0]}`).join(" ")}`);
  await context.close();
}


async function run() {
  mkdirSync(outDir,{recursive:true});
  const browser=await chromium.launch({channel:"chrome",headless:true});
  await runCase(browser, "N01-11", "Gọi món — thêm/bớt món đã gửi", async (page, step) => {
    await login(page, ID.cashier);
    const saved = (name) => page.getByTestId("order-cart-line").filter({ hasText: name }).filter({ hasText: "Phần đã lưu" });
    const lines = () => page.getByTestId("order-cart-line").evaluateAll((els) => els.map((e) => e.textContent.replace(/\s+/g, " ").trim().slice(0, 48)));
    await step("B1", "Mở đơn 24 (Bàn 2): các dòng đã gửi ghi 'Phần đã lưu'", "B02-04", async () => {
      await openTable(page, ID.B02);
      const l = await lines();
      const header = await text(page.getByTestId("b02-header"));
      return { observed: `${header}; ${l.length} dòng: ${l.join(" | ")}; tổng ${await total(page)}đ.`, status: ok(/#24/.test(header) && l.length === 3 && l.every(x=>/Phần đã lưu/.test(x)) && (await total(page)) === "125000") };
    });
    await step("B2", "Bấm + ở dòng Bạc xỉu đã lưu: dòng đã lưu giữ nguyên, thêm một dòng Bạc xỉu mới theo giá hiện hành; tổng 157.000đ", "B02-04 (saved+ → thêm dòng giá hiện hành)", async () => {
      await saved("Bạc xỉu").getByTestId("order-cart-increase").click(); await page.waitForTimeout(300);
      const l = await lines();
      const savedQty = await text(saved("Bạc xỉu").getByTestId("order-cart-quantity"));
      const newLines = l.filter((x) => /Bạc xỉu/.test(x) && !/Phần đã lưu/.test(x));
      return { observed: `${l.length} dòng: ${l.join(" | ")}. Dòng đã lưu số lượng ${savedQty}; dòng Bạc xỉu mới: ${newLines.length}; tổng ${await total(page)}đ.`, status: ok(savedQty === "1" && newLines.length === 1 && (await total(page)) === "157000") };
    });
    await step("B3", "Bấm − ở dòng Croissant đã lưu: về 0 thì dòng ẩn khỏi giỏ; tổng giảm 35.000đ", "B02-04 (saved− clamp 0; giỏ ẩn dòng 0)", async () => {
      await saved("Croissant").getByTestId("order-cart-decrease").click(); await page.waitForTimeout(300);
      const l = await lines();
      return { observed: `${l.length} dòng: ${l.join(" | ")}; tổng ${await total(page)}đ.`, status: ok(!l.some((x) => /Croissant/.test(x)) && (await total(page)) === "122000") };
    });
    await step("B4", "Đóng, bỏ thay đổi: mở lại đơn 24 về bản đã lưu 125.000đ, Croissant còn", "B02-07, Q-N01-4", async () => {
      await page.getByTestId("order-close-button").click();
      const dlg = page.getByRole("dialog").last();
      await dlg.waitFor({state:"visible"});
      await page.waitForTimeout(300);
      const discard = (await dlg.getByRole("button").allTextContents()).map((b) => b.trim()).find((n) => /^Bỏ/.test(n));
      await page.screenshot({ path: join(outDir,"anh","N01-11","B4-hop-xac-nhan.png") });
      await dlg.getByRole("button", { name: discard, exact: true }).click(); await page.waitForTimeout(400);
      await openTable(page, ID.B02);
      const l = await lines();
      return { observed: `Nút bỏ "${discard}". Mở lại: ${l.length} dòng đã lưu, tổng ${await total(page)}đ; Croissant còn; không còn dòng gọi thêm.`, status: ok((await total(page)) === "125000" && l.length===3 && l.every(x=>/Phần đã lưu/.test(x)) && l.some((x) => /Croissant/.test(x))) };
    });
  });

  await runCase(browser, "N01-12", "Thanh toán — nhập tiền khách đưa", async (page, step) => {
    await login(page, ID.cashier);
    await step("B1", "Mở thanh toán đơn 24: ô khách đưa 125.000", "R03", async () => { await openPayment(page); return { observed: `Khách đưa ${await received(page)}đ.`, status: ok((await received(page)) === "125000") }; });
    await step("B2", "Bấm xóa một lần: xóa một chữ số (12.500)", "R04 (delete xóa một chữ số)", async () => {
      await page.getByTestId("payment-key-delete").click(); await page.waitForTimeout(150);
      const locked = await page.getByTestId("pay-button").isDisabled();
      return { observed: `Khách đưa ${await received(page)}đ; Hoàn tất bị khóa: ${locked}.`, status: ok((await received(page)) === "12500" && locked) };
    });
    await step("B3", "Bấm phím 00: thêm hai số 0 (1.250.000)", "R04 (có phím 00)", async () => {
      await page.getByTestId("payment-key-00").click(); await page.waitForTimeout(150);
      return { observed: `Khách đưa ${await received(page)}đ.`, status: ok((await received(page)) === "1250000") };
    });
    await step("B4", "Bấm thêm 4 chữ số 9: chỉ giữ tối đa 9 chữ số", "R04 (cắt tối đa 9 chữ số)", async () => {
      for (let i = 0; i < 4; i++) await page.getByTestId("payment-key-9").click();
      await page.waitForTimeout(150);
      const r = await received(page);
      return { observed: `Khách đưa ${r}đ (${r.length} chữ số).`, status: ok(r === "125000099") };
    });
    await step("B5", "Gõ thẳng '12a5b' vào ô: chỉ nhận chữ số (125)", "R04 (direct input chỉ nhận chữ số)", async () => {
      const input = page.getByTestId("payment-received-amount");
      await input.click(); await page.keyboard.press("Control+A"); await page.keyboard.type("12a5b"); await page.waitForTimeout(200);
      const locked = await page.getByTestId("pay-button").isDisabled();
      const exactVisible = await page.getByRole("button", {name:"Đúng tiền",exact:true}).isVisible();
      return { observed: `Khách đưa ${await received(page)}đ; ô hiện "${await input.inputValue()}"; Hoàn tất bị khóa: ${locked}; nút Đúng tiền hiện: ${exactVisible}.`, status: ok((await received(page)) === "125" && locked) };
    });
    await step("B6", "Nút nhanh: Đúng tiền = 125.000; +50k = 175.000; 500k = 500.000", "R04", async () => {
      const input = page.getByTestId("payment-received-amount");
      await input.click(); await page.keyboard.press("Control+A"); await page.keyboard.type("200000"); await page.waitForTimeout(200);
      const vals = [];
      for (const n of ["Đúng tiền", "+50k", "500k"]) { await page.getByRole("button", { name: n, exact: true }).click(); await page.waitForTimeout(150); vals.push(`${n} → ${await received(page)}`); await page.screenshot({path:join(outDir,"anh","N01-12",`B6-${vals.length}.png`)}); }
      return { observed: vals.join("; "), status: ok(vals.join() === "Đúng tiền → 125000,+50k → 175000,500k → 500000") };
    });
    await step("SAU-B6", "Đóng thanh toán, không Hoàn tất; mở lại B02 vẫn #24/125.000đ", "Phiếu chạy tay", async () => {
      await page.getByTestId("payment-close-button").first().click();
      if (await page.getByTestId("order-drawer").isVisible()) await page.getByTestId("order-close-button").click();
      await openTable(page, ID.B02);
      const header = await text(page.getByTestId("b02-header"));
      return {observed: header+"; tổng "+await total(page)+"đ; chưa bấm Hoàn tất.",status:ok(/#24/.test(header) && await total(page)==="125000")};
    });
  });

  await runCase(browser, "MANG-DI", "Bán mang đi 568×320", async (page, step) => {
    await login(page, ID.cashier);
    const drawer = () => page.getByTestId("takeaway-drawer");
    const card = () => drawer().locator("section div.cursor-pointer").filter({hasText:"#26"}).first();
    const detail = () => drawer().locator("aside");
    const shot = async name => page.screenshot({path:join(outDir,"anh","MANG-DI",name+".png")});
    const openList = async () => {await takeawayCount(page); await drawer().locator("aside").getByText("#26",{exact:true}).waitFor();};
    const orderOK = async () => {await expect(page.getByTestId("b02-header")).toContainText("Đơn #26"); await expect(page.getByTestId("order-total-amount")).toHaveAttribute("data-amount","84000"); return true;};
    const paymentOK = async () => {await expect(page.getByTestId("payment-drawer")).toContainText("Đơn #26"); await expect(page.getByTestId("payment-order-summary")).toHaveAttribute("data-amount-due","84000"); return true;};
    const closeOrder = async () => {await page.getByTestId("order-close-button").click(); await page.getByTestId("order-drawer").waitFor({state:"detached"});};
    const closePayment = async () => {await page.getByTestId("payment-close-button").first().click(); await page.getByTestId("payment-drawer").waitFor({state:"detached"});};
    const metrics = async () => drawer().evaluate(el => ({
      viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio},
      page:{width:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,height:document.documentElement.clientHeight,scrollHeight:document.documentElement.scrollHeight},
      buttons:[...el.querySelectorAll('button')].map(b=>{const r=b.getBoundingClientRect();const c=getComputedStyle(b);return {label:b.innerText.trim(),width:r.width,height:r.height,fontSize:c.fontSize,x:r.x,y:r.y};}),
      scroll:[...el.querySelectorAll('*')].filter(e=>/(auto|scroll)/.test(getComputedStyle(e).overflowX+getComputedStyle(e).overflowY)).map(e=>({tag:e.tagName,cls:e.className,left:e.scrollLeft,top:e.scrollTop,maxX:e.scrollWidth-e.clientWidth,maxY:e.scrollHeight-e.clientHeight})),
      clippedText:[...el.querySelectorAll('p,h1,h2,h3,span')].filter(e=>e.scrollWidth>e.clientWidth+1 && e.clientWidth>0 && ['hidden','clip'].includes(getComputedStyle(e).overflowX)).map(e=>({text:e.innerText,width:e.clientWidth,scrollWidth:e.scrollWidth}))
    }));
    const evidence = [];
    const snap = async label => {const m=await metrics();evidence.push({label,time:clock(),...m});return m;};
    const reach = async (button,label) => {
      const before = await metrics();
      // Scroll with wheel inside the actual scroll containers; no forced click or DOM state mutation.
      const outer = drawer().locator(':scope > div').first();
      const ob=await outer.boundingBox();
      await page.mouse.move(ob.x+Math.min(200,ob.width/2),ob.y+ob.height/2);
      await page.mouse.wheel(1000,0);
      const panel=detail().locator(':scope > div').nth(1);
      const pb=await panel.boundingBox();
      await page.mouse.move(Math.min(560,pb.x+pb.width/2),pb.y+pb.height/2);
      await page.mouse.wheel(0,500);
      await page.waitForTimeout(200);
      const after=await snap(label);
      const hit=await button.evaluate(b=>{const r=b.getBoundingClientRect();const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {x:r.x,y:r.y,width:r.width,height:r.height,reachable:!!hit&&(hit===b||b.contains(hit))};});
      await shot(label+'-nut-sau-cuon');
      const change=after.scroll.map((s,i)=>({tag:s.tag,x:s.left-(before.scroll[i]?.left||0),y:s.top-(before.scroll[i]?.top||0)})).filter(s=>s.x||s.y);
      return {hit,change};
    };
    await step("T1", "1 đơn #26/84.000đ; 9 nút; không tràn trang", "Phiếu chạy tay", async () => {
      await openList();
      const m=await snap("T1");
      return {observed:`${await text(drawer().locator('header p'))}; thẻ: ${await text(card())}; ${m.buttons.length} nút; trang ${m.page.width}/${m.page.scrollWidth}px; có cuộn nội bộ: ${JSON.stringify(m.scroll)}.`,status:ok(await card().count()===1 && /84.000/.test(await text(card())) && m.buttons.length===9 && m.page.width===m.page.scrollWidth && m.page.height===m.page.scrollHeight)};
    });
    await step("T2", "Ba thẻ lọc bấm được; Đã thanh toán rỗng, Hôm nay/Đang mở có #26", "Phiếu chạy tay", async () => {
      const checks=[];
      for(const name of ["Đã thanh toán","Hôm nay","Đang mở"]){
        await drawer().getByRole('button',{name,exact:true}).click();
        const n=await card().count();checks.push({name,count:n});await shot('T2-'+checks.length);
      }
      return {observed:JSON.stringify(checks),status:ok(checks.map(x=>x.count).join()==="0,1,1")};
    });
    await step("T3", "Mở nháp mới, đóng chưa thêm món; mở lại vẫn 1 đơn", "Phiếu chạy tay / Q-N01-1", async () => {
      await drawer().getByRole('button',{name:'Tạo đơn mang đi',exact:true}).click();
      await page.getByTestId('order-drawer').waitFor();
      const h=await text(page.getByTestId('b02-header'));await shot('T3-nhap-moi');
      await closeOrder();await openList();
      return {observed:`Nháp: ${h}; mở lại: ${await text(drawer().locator('header p'))}.`,status:ok(/Đơn mới/.test(h) && await card().count()===1 && /1 đơn/.test(await text(drawer().locator('header p'))))};
    });
    await step("T4a", "Mở đơn trên thẻ đúng #26/84.000đ", "Phiếu chạy tay", async () => {
      await card().getByRole('button',{name:'Mở đơn',exact:true}).click();
      const passed=await orderOK(); const observed=`${await text(page.getByTestId('b02-header'))}; tổng ${await total(page)}đ.`;
      return {observed,status:ok(passed)};
    });
    await closeOrder();await openList();
    await step("T4b", "Thanh toán trên thẻ đúng #26, phải trả 84.000đ; đóng", "Phiếu chạy tay", async () => {
      await card().getByRole('button',{name:'Thanh toán',exact:true}).click();
      const passed=await paymentOK();const observed=`Thanh toán #26: ${passed}; phải trả ${await due(page)}đ.`;await shot('T4b-thanh-toan');
      await closePayment();await openList();return {observed,status:ok(passed)};
    });
    await step("T4c", "Cuộn khung chi tiết và bấm Mở đơn; đúng #26", "Phiếu chạy tay", async () => {
      const b=detail().getByRole('button',{name:'Mở đơn',exact:true});const r=await reach(b,'T4c');
      if(!r.hit.reachable) return {observed:`Sau cuộn chưa bấm được: ${JSON.stringify(r)}`,status:'LỖI'};
      await b.click();const passed=await orderOK();return {observed:`Cuộn thực tế: ${JSON.stringify(r)}; mở đúng #26/84.000đ: ${passed}.`,status:ok(passed)};
    });
    if(await page.getByTestId('order-drawer').isVisible()) {await closeOrder();await openList();}
    await step("T4d", "Cuộn ngang/dọc tới Thanh toán trong chi tiết; đúng #26/84.000đ", "Phiếu chạy tay", async () => {
      const b=detail().getByRole('button',{name:'Thanh toán',exact:true});const r=await reach(b,'T4d');
      if(!r.hit.reachable) return {observed:`Sau cuộn chưa bấm được: ${JSON.stringify(r)}`,status:'LỖI'};
      await b.click();const passed=await paymentOK();await shot('T4d-thanh-toan');await closePayment();await openList();
      return {observed:`Cuộn thực tế: ${JSON.stringify(r)}; mở đúng thanh toán #26/84.000đ: ${passed}.`,status:ok(passed)};
    });
    await step("T5", "Cuộn tới tổng 84.000đ; Đóng hoạt động; mở lại vẫn 1 đơn", "Phiếu chạy tay", async () => {
      const b=detail().getByRole('button',{name:'Thanh toán',exact:true});await reach(b,'T5');
      const totalLabel=detail().locator('strong').filter({hasText:/84\.000\s*₫/});
      await expect(totalLabel).toHaveCount(1);
      const seen=await totalLabel.evaluate(el=>{const r=el.getBoundingClientRect();const at=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return !!at&&(at===el||el.contains(at));});
      await shot('T5-tong');await closeTakeaway(page);await page.getByTestId('floor-view').waitFor();await openList();
      const count=await card().count();return {observed:`Chi tiết có tổng 84.000đ nhìn thấy, không bị che: ${seen}; đóng về sơ đồ; mở lại ${count} thẻ #26.`,status:ok(seen && count===1)};
    });
    writeFileSync(join(outDir,'do-dac-mang-di.json'),JSON.stringify(evidence,null,2),'utf8');
  });
  const browserVersion=browser.version();
  await browser.close();
  writeFileSync(join(outDir,"ket-qua.json"),JSON.stringify({source:"main 2e5764958a08300aac2f98701144a7d89ac8d4a5",method:"AI kiểm tra UI tự động bằng Playwright headless; không phải Ngọc tự chạy tay",date:"20/11/2026",timezone:"Asia/Bangkok (UTC+7)",baseURL,browserVersion,viewport:{desktop:VIEWPORT,takeaway:{width:568,height:320}},finishedAt:new Date().toISOString(),results},null,2),'utf8');
}
run().catch(e=>{writeFileSync(join(outDir,'loi-thuc-thi.txt'),String(e.stack),'utf8');console.error(e);process.exit(1);});
