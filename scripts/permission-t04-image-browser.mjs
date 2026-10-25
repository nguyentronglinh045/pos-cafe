// Synthetic loopback measurements only; importing this module has no effects.
const refuse=()=>{throw Error('PERMISSION_T04_IMAGE_BROWSER_REFUSED');};
const check=value=>{if(!value)refuse();};
export const IMAGE_ORIGIN_PATH='/functions/v1/menu-image-public/not-a-uuid';
function localOrigin(api){
 const u=new URL(api);check(u.protocol==='http:'&&u.hostname==='127.0.0.1'&&u.port!==''
  &&u.origin===api&&!u.username&&!u.password);return u.origin;
}
function remaining(deadline,now){const n=deadline-now();check(Number.isSafeInteger(deadline)&&Number.isFinite(n)&&n>0);return Math.min(10000,n);}
async function boundedSettlement(operation,ms){
 let timer;try{return await Promise.race([Promise.resolve().then(operation).then(()=>true,()=>false),
  new Promise(resolve=>{timer=setTimeout(()=>resolve(false),ms);})]);}finally{clearTimeout(timer);}
}
export async function closeImageMeasurementResource(resource,{deadline,now=Date.now}){
 const budget=Math.max(1,Math.min(10000,deadline-now()));
 if(!await boundedSettlement(()=>resource.close(),budget))throw Object.assign(Error('PERMISSION_T04_IMAGE_BROWSER_CLEANUP_FAILED'),
  {t04ImageMeasurementCleanupAttempted:1,t04ImageMeasurementCleanupFailed:1});
}
// A stalled renderer or failed close cannot trap outer restoration indefinitely.
// The outer owner still closes the browser; failed cancellation remains sticky.
export async function withImagePageDeadline(page,operation,deadline,now=Date.now){
 const timeout=remaining(deadline,now);let timer,settled=false;
 const pending=Promise.resolve().then(operation);pending.then(()=>{settled=true;},()=>{settled=true;});
 try{return await Promise.race([pending,new Promise((_,reject)=>{timer=setTimeout(()=>{
  const error=Error('PERMISSION_T04_IMAGE_PAGE_TIMEOUT');error.name='TimeoutError';reject(error);
 },timeout);})]);}
 catch(primary){
  let failed=false,closed=false;
  for(const close of [()=>page.close(),()=>page.context().close(),()=>page.context().browser().close()]){
   if(await boundedSettlement(close,1000)){closed=true;break;}failed=true;
  }
  if(!settled&&!await boundedSettlement(()=>pending.then(()=>undefined,()=>undefined),250))failed=true;
  if(failed||!closed)Object.assign(primary,{t04ImageMeasurementCleanupAttempted:1,t04ImageMeasurementCleanupFailed:1});
  throw primary;
 }finally{clearTimeout(timer);}
}
export async function bootstrapImageMeasurementPage(page,{api,gate,deadline,now=Date.now}){
 const origin=localOrigin(api),url=origin+IMAGE_ORIGIN_PATH;await gate();remaining(deadline,now);
 const response=await withImagePageDeadline(page,()=>page.goto(url,{waitUntil:'domcontentloaded',timeout:remaining(deadline,now)}),deadline,now);
 check(response&&response.status()===404&&response.headers()['cache-control']==='no-store'
  &&response.url()===url&&page.url()===url&&response.request().redirectedFrom()===null);
 check(await withImagePageDeadline(page,()=>page.evaluate(()=>location.origin),deadline,now)===origin);
 await gate();remaining(deadline,now);
 await withImagePageDeadline(page,()=>page.setContent('<!doctype html><title>T04 image cache measurement</title>',{timeout:remaining(deadline,now)}),deadline,now);
 check(await withImagePageDeadline(page,()=>page.evaluate(()=>location.origin),deadline,now)===origin);
 await gate();remaining(deadline,now);return page;
}
