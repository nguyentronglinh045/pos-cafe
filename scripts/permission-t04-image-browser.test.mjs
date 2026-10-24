import test from 'node:test';
import assert from 'node:assert/strict';
import {bootstrapImageMeasurementPage,withImagePageDeadline,IMAGE_ORIGIN_PATH} from './permission-t04-image-browser.mjs';
import {createImageMeasurementDiagnostics,imageFailureFacts,withImageMeasurementContext} from './permission-t04-image-measurement.mjs';
import {closeImageControlResources} from './permission-t04-image-browser-control.mjs';
const api='http://127.0.0.1:62421',url=api+IMAGE_ORIGIN_PATH;
function fixture(){
 let clock=1000,origin=api;const calls=[];
 const response={status:()=>404,headers:()=>({'cache-control':'no-store'}),url:()=>url,request:()=>({redirectedFrom:()=>null})};
 const page={goto:async(u,o)=>{calls.push(['goto',u,o]);return response;},url:()=>url,evaluate:async()=>origin,
  setContent:async()=>{calls.push(['content']);},close:async()=>{calls.push(['close']);}};
 return{page,response,calls,options:{api,gate:async()=>{calls.push(['gate']);},deadline:11000,now:()=>clock},
  setClock:value=>{clock=value;},setOrigin:value=>{origin=value;}};
}
test('bootstrap admits only exact owned nonasset404, without touching image URL',async()=>{
 const f=fixture();assert.equal(await bootstrapImageMeasurementPage(f.page,f.options),f.page);
 assert.deepEqual(f.calls.map(c=>c[0]),['gate','goto','gate','content','gate']);assert.equal(f.calls[1][1],url);
 assert.equal(f.calls[1][2].timeout,10000);
});
test('bootstrap refuses wrong URL/status/cache/origin/redirect and post-content origin change',async()=>{
 const edits=[f=>{f.response.status=()=>200;},f=>{f.response.headers=()=>({'cache-control':'private, max-age=60'});},
  f=>{f.response.url=()=>url+'/';},f=>{f.page.url=()=>url+'/';},f=>{f.response.request=()=>({redirectedFrom:()=>({})});},
  f=>f.setOrigin('null'),f=>{f.page.setContent=async()=>f.setOrigin('http://127.0.0.1:54321');},f=>{f.page.goto=async()=>null;}];
 for(const edit of edits){const f=fixture();edit(f);await assert.rejects(bootstrapImageMeasurementPage(f.page,f.options),/REFUSED/);}
});
test('invalid origins and expired deadlines have no navigation effects',async()=>{
 for(const bad of ['https://example.com','http://localhost:62421',api+'/',api+'/path','http://user:pass@127.0.0.1:62421']){
  const f=fixture();f.options.api=bad;await assert.rejects(bootstrapImageMeasurementPage(f.page,f.options));assert(!f.calls.some(c=>c[0]==='goto'));
 }
 const f=fixture();f.setClock(11000);await assert.rejects(bootstrapImageMeasurementPage(f.page,f.options));assert(!f.calls.some(c=>c[0]==='goto'));
 const later=fixture();later.page.setContent=async()=>later.setClock(11000);await assert.rejects(bootstrapImageMeasurementPage(later.page,later.options));
});
test('renderer timeout cancels and settles without falsely marking ordinary cancellation failure',async()=>{
 let rejectPending;const page={close:async()=>{rejectPending(Error('cancelled'));}};
 await assert.rejects(withImagePageDeadline(page,()=>new Promise((_,reject)=>{rejectPending=reject;}),Date.now()+30),error=>error.name==='TimeoutError'&&error.t04ImageMeasurementCleanupFailed!==1);
});
test('failed page close falls back to owned context and sticky bit survives successful fresh close',async()=>{
 let rejectPending,contextCloses=0;const page={close:async()=>{throw Error('CLOSE_FAILED');},context:()=>({close:async()=>{contextCloses++;rejectPending(Error('cancelled'));}})};
 const diagnostic=createImageMeasurementDiagnostics({});diagnostic.step(29);
 await assert.rejects(withImageMeasurementContext(()=>withImagePageDeadline(page,()=>new Promise((_,reject)=>{rejectPending=reject;}),Date.now()+30),
  async()=>{},error=>diagnostic.capture(error)),error=>error.t04ImageMeasurementCleanupFailed===1&&error.t04ImageMeasureStepOrdinal===29);
 assert.equal(contextCloses,1);
});
test('unsettled renderer and all failed cancellation attempts return bounded failure to outer owner',async()=>{
 const never=()=>new Promise(()=>{}),page={close:never,context:()=>({close:never,browser:()=>({close:never})})};
 const started=Date.now();await assert.rejects(withImagePageDeadline(page,never,Date.now()+20),error=>error.name==='TimeoutError'&&error.t04ImageMeasurementCleanupFailed===1);
 assert(Date.now()-started<5000);
});
test('origin evaluate timeout cancels within the original bootstrap deadline',async()=>{
 const f=fixture();let rejectPending;f.options.now=Date.now;f.options.deadline=Date.now()+30;
 f.page.evaluate=()=>new Promise((_,reject)=>{rejectPending=reject;});f.page.close=async()=>rejectPending(Error('cancelled'));
 await assert.rejects(bootstrapImageMeasurementPage(f.page,f.options),error=>error.name==='TimeoutError');
});
test('control attempts every context close and server termination, preserving primary failure',async()=>{
 const primary=Error('PRIMARY');let second=0,terminated=0;
 await assert.rejects(closeImageControlResources([{close:async()=>{throw Error('CLOSE');}},{close:async()=>{second++;}}],{terminate:async()=>{terminated++;}},primary),error=>error===primary);
 assert.equal(second,1);assert.equal(terminated,1);
});
test('warm predicate operands are bounded, frozen before cleanup, reset at next step',()=>{
 const d=createImageMeasurementDiagnostics({});d.step(28);d.warm(200,false,true);const e=d.capture(Error('PRIVATE'));
 assert.deepEqual([e.t04ImageWarmStatus200Ordinal,e.t04ImageWarmCachedOrdinal,e.t04ImageWarmBytesMatchOrdinal],[2,1,2]);
 d.step(33);assert.deepEqual(imageFailureFacts(d.capture(Error('SECOND'))),imageFailureFacts(e));
 const next=createImageMeasurementDiagnostics({});next.step(28);next.warm(503,true,false);next.step(29);
 const unknown=next.capture(Error());assert.equal(unknown.t04ImageWarmStatus200Ordinal,0);assert.equal(unknown.t04ImageWarmCachedOrdinal,0);assert.equal(unknown.t04ImageWarmBytesMatchOrdinal,0);
});
