import assert from 'node:assert/strict';
import {Worker} from 'node:worker_threads';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {bootstrapImageMeasurementPage} from './permission-t04-image-browser.mjs';

// An actual HTTP server in a different event loop: a slow controller guard must
// not stall the synthetic origin and manufacture a browser timing failure.
const serverSource=`
const {parentPort,workerData}=require('node:worker_threads'),http=require('node:http');
const state=new Int32Array(workerData),png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64');
const path='/functions/v1/menu-image-public/';let returned=false;
const server=http.createServer((q,r)=>{
 if(q.url===path+'not-a-uuid'){
  const mode=Atomics.load(state,1);if(mode===4&&!returned){returned=true;r.writeHead(302,{Location:'/bounce'});r.end();return;}
  r.writeHead(mode===2?200:404,{'Content-Type':'application/json','Cache-Control':mode===3?'private, max-age=60':'no-store'});
  r.end(JSON.stringify({ok:false,error:{code:'NOT_FOUND'}}));return;
 }
 if(q.url==='/bounce'){r.writeHead(302,{Location:path+'not-a-uuid'});r.end();return;}
 if(q.url==='/origin'){r.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-store'});r.end('<!doctype html><title>Owned HTTP page</title>');return;}
 if(!q.url.startsWith(path)){r.writeHead(404,{'Cache-Control':'no-store'});r.end();return;}
 const id=Number(q.url.slice(path.length));if(!Number.isInteger(id)||id<1||id>8){r.writeHead(404);r.end();return;}
 Atomics.add(state,2+id,1);
 if(id===2&&Atomics.load(state,0)===1){r.writeHead(404,{'Access-Control-Allow-Origin':'*','Cache-Control':'no-store'});r.end('{}');return;}
 const headers={'Access-Control-Allow-Origin':'*','Cache-Control':id===3?'no-store':'private, max-age=60, must-revalidate',ETag:'"synthetic-'+id+'"'};
 if(q.headers['if-none-match']===headers.ETag){r.writeHead(304,headers);r.end();return;}
 r.writeHead(200,{...headers,'Content-Type':'image/png','Content-Length':png.length});r.end(png);
});server.listen(0,'127.0.0.1',()=>parentPort.postMessage(server.address().port));
`;
const hash=bytes=>createHash('sha256').update(Buffer.from(bytes)).digest('hex');
async function createControlReader(context,page,{gate,deadline}){
 const cdp=await context.newCDPSession(page),events=[];
 cdp.on('Network.requestServedFromCache',e=>events.push({type:'cache',id:e.requestId}));
 cdp.on('Network.responseReceived',e=>events.push({type:'response',id:e.requestId,status:e.response.status,url:e.response.url,
  disk:e.response.fromDiskCache===true,worker:e.response.fromServiceWorker===true}));await cdp.send('Network.enable');
 return {get:async url=>{await gate();const offset=events.length;
  const timeoutMs=Math.max(1,Math.min(10000,deadline-Date.now()));
  const value=await page.evaluate(async({url,timeoutMs})=>{const requestAt=performance.now();const r=await fetch(url,{signal:AbortSignal.timeout(timeoutMs)});
   const bytes=Array.from(new Uint8Array(await r.arrayBuffer()));return{status:r.status,cache:r.headers.get('cache-control'),bytes,requestAt,completedAt:performance.now()};},{url,timeoutMs});
  const observed=events.slice(offset),responses=observed.filter(e=>e.type==='response'&&e.url===url);
  assert(responses.length===1&&!responses[0].worker);return{...value,cached:responses[0].disk||observed.some(e=>e.type==='cache'&&e.id===responses[0].id)};
 }};
}
export async function closeImageControlResources(contexts,worker,primary){
 let failure=primary;for(const context of contexts)try{await context.close();}catch(error){failure??=error;}
 try{await worker.terminate();}catch(error){failure??=error;}if(failure)throw failure;
}
export async function imageBrowserControl(browser){
 const state=new Int32Array(new SharedArrayBuffer(16*4)),worker=new Worker(serverSource,{eval:true,workerData:state.buffer});
 let port;try{port=await new Promise((resolve,reject)=>{worker.once('message',resolve);worker.once('error',reject);});}
 catch(error){await worker.terminate();throw error;}
 const api='http://127.0.0.1:'+port,asset=id=>api+'/functions/v1/menu-image-public/'+id;
 const deadline=Date.now()+110000,contexts=[];let guardCalls=0;
 const noop=async()=>{};
 const make=async(bootstrap=true,gate=noop)=>{
  const context=await browser.newContext();contexts.push(context);const page=await context.newPage();
  if(bootstrap)await bootstrapImageMeasurementPage(page,{api,gate,deadline});else await page.setContent('<!doctype html><title>Opaque origin</title>');
  const reader=await createControlReader(context,page,{gate,deadline});return{context,page,reader};
 };
 let result,primary;
 try{
  const old=await make(false),oldCold=await old.reader.get(asset(1)),oldWarm=await old.reader.get(asset(1));
  assert.equal(oldWarm.status,200);assert.equal(hash(oldWarm.bytes),hash(oldCold.bytes));assert.equal(oldWarm.cached,false);assert.equal(Atomics.load(state,3),2);
  const fixed=await make(),cold=await fixed.reader.get(asset(2)),warm=await fixed.reader.get(asset(2)),coldAt=performance.now()-(warm.completedAt-cold.completedAt);
  assert.equal(cold.cached,false);assert.equal(warm.cached,true);assert.equal(warm.status,200);assert.equal(hash(cold.bytes),hash(warm.bytes));assert.equal(Atomics.load(state,4),1);
  assert(await fixed.page.evaluate(async bytes=>{const image=await createImageBitmap(new Blob([new Uint8Array(bytes)],{type:'image/png'}));const ok=image.width===1&&image.height===1;image.close();return ok;},cold.bytes));
  const noStore=await make(),ns1=await noStore.reader.get(asset(3)),ns2=await noStore.reader.get(asset(3));
  assert.equal(ns1.cached,false);assert.equal(ns2.cached,false);assert.equal(Atomics.load(state,5),2);
  // A distinct loopback hostname exercises a cross-origin cache.
  const cross=await make(false);await cross.page.goto(api.replace('127.0.0.1','localhost')+'/origin');
  const cross1=await cross.reader.get(asset(4)),cross2=await cross.reader.get(asset(4));
  assert.equal(cross1.cached,false);assert.equal(cross2.cached,true);assert.equal(Atomics.load(state,6),1);
  for(const mode of [2,3,4]){
   Atomics.store(state,1,mode);const context=await browser.newContext();contexts.push(context);const page=await context.newPage();
   await assert.rejects(bootstrapImageMeasurementPage(page,{api,gate:noop,deadline}),/REFUSED/);
  }
  Atomics.store(state,1,0);Atomics.store(state,0,1);
  const fresh=await make(),withdrawn=await fresh.reader.get(asset(2));assert.equal(withdrawn.status,404);assert.equal(withdrawn.cache,'no-store');assert.equal(withdrawn.cached,false);
  const gate=async()=>{guardCalls++;};
  const timed=await createControlReader(fixed.context,fixed.page,{gate,deadline}),observed=[];
  for(const second of [59,60,61]){
   for(;;){await gate();const wait=coldAt+second*1000-performance.now();if(wait<=0)break;await new Promise(resolve=>setTimeout(resolve,Math.min(wait,1000)));}
   const v=await timed.get(asset(2)),elapsed=Math.floor(v.requestAt-cold.completedAt);
   assert(elapsed>=second*1000&&elapsed<second*1000+750);observed.push(elapsed);
   if(second===59)assert(v.status===404&&v.cache==='no-store'||v.status===200&&v.cached&&hash(v.bytes)===hash(cold.bytes));
   else assert(v.status===404&&v.cache==='no-store'&&!v.cached);
  }
  assert(guardCalls>=3);
  let deniedCalls=0;const denied=await make(false);
  await assert.rejects(bootstrapImageMeasurementPage(denied.page,{api,deadline,gate:async()=>{deniedCalls++;throw Error('CONTROL_GUARD_DENIED');}}),/CONTROL_GUARD_DENIED/);
  assert.equal(deniedCalls,1);
  result={opaqueOriginRefused:1,stableOriginCache:1,crossOriginCache:1,noStoreRefused:1,bootstrapRefusals:3,freshAfterUnlink:1,
   guardFailureRefused:1,timedSamples:3,observedMs:observed,guardCalls};
 }catch(error){primary=error;}
 await closeImageControlResources(contexts,worker,primary);return result;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const{chromium}=await import('@playwright/test');let browser;
 try{browser=await chromium.launch({channel:'chromium',headless:true,timeout:10000});
  const result=await imageBrowserControl(browser);console.log('T04_IMAGE_BROWSER_CONTROL '+JSON.stringify(result));
 }finally{if(browser)await browser.close();}
}
