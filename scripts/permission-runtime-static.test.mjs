import test from 'node:test';
import assert from 'node:assert/strict';
import {runStaticProfile,staticProfileCounts} from './permission-runtime-static.mjs';
import {runtimeStageCatalog} from './permission-runtime-catalog.mjs';
import {prepareRuntimeDirectory} from './permission-runtime-stage.mjs';
import {mkdtempSync,mkdirSync,symlinkSync,existsSync,unlinkSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const ids=runtimeStageCatalog().filter(s=>s.runtimeProfile==='STATIC').map(s=>s.stage);
const binding={sourceSHA:'a'.repeat(40),sourceFingerprint:'b'.repeat(64),lockSHA:'c'.repeat(64),runId:'123'};
const passed=stage=>{const n=runtimeStageCatalog().find(s=>s.stage===stage).required.length;
  return {stage,status:'PASS',required:n,run:n,discovered:n,pass:n,fail:0,skip:0,retry:0,
    sourceSHA:binding.sourceSHA,reportSHA:'d'.repeat(64),invocationSHA:'e'.repeat(64)};};
test('static profile executes all five approved stages in order without calling service stages',async()=>{
  const seen=[];const result=await runStaticProfile({guard(){},stage:async id=>{seen.push(id);return passed(id);}});
  assert.deepEqual(seen,ids);assert.equal(result.status,'PASS');assert.equal(result.fullBusinessRuntime,'NOT_RUN');
  assert.equal(result.remainingBusinessStages,30);
});
test('failure stops later effects and retains remaining stages as NOT_RUN',async()=>{
  const seen=[];const result=await runStaticProfile({guard(){},stage:async id=>{seen.push(id);if(id===ids[1])throw Error('fail');return passed(id);}});
  assert.deepEqual(seen,ids.slice(0,2));assert.equal(result.status,'FAIL');
  assert.deepEqual(result.stages.map(s=>s.status),['PASS','FAIL','NOT_RUN','NOT_RUN','NOT_RUN']);
});
test('quota failure precedes first command and a skipped/retried receipt cannot close a stage',async()=>{
  let calls=0;const result=await runStaticProfile({guard(){throw Error('quota');},stage:async()=>{calls++;}});
  assert.equal(calls,0);assert.equal(result.status,'FAIL');
  for(const change of [{skip:1},{retry:1},{pass:0},{stage:'other'}]){
    const r=await runStaticProfile({guard(){},stage:async id=>({...passed(id),...change})});assert.equal(r.status,'FAIL');
  }
});
test('fresh output refuses a junction parent before creating directories beyond it',()=>{
  const root=mkdtempSync(join(tmpdir(),'permission-static-path-')),outside=mkdtempSync(join(tmpdir(),'permission-static-outside-'));
  const link=join(root,'artifacts');symlinkSync(outside,link,process.platform==='win32'?'junction':'dir');
  try{assert.throws(()=>prepareRuntimeDirectory(root,join(link,'must-not-exist'),()=>{}));assert(!existsSync(join(outside,'must-not-exist')));}
  finally{unlinkSync(link);rmSync(root,{recursive:true});rmSync(outside,{recursive:true});}
});
test('public static counts bind every ordered stage and reject truncated, stale or skipped receipts',async()=>{
  const receipt={...await runStaticProfile({guard(){},stage:async id=>passed(id)}),...binding};
  assert.deepEqual(staticProfileCounts(receipt,binding),{run:313,pass:313,fail:0,skip:0});
  for(const change of [{sourceSHA:'f'.repeat(40)},{runId:'124'},{stages:receipt.stages.slice(1)},
    {stages:[...receipt.stages].reverse()},{status:'FAIL'},{remainingBusinessStages:0}])
    assert.throws(()=>staticProfileCounts({...receipt,...change},binding));
  for(const change of [{skip:1},{retry:1},{required:1},{sourceSHA:'f'.repeat(40)},{reportSHA:'bad'},{run:NaN}]){
    const stages=structuredClone(receipt.stages);Object.assign(stages[0],change);
    assert.throws(()=>staticProfileCounts({...receipt,stages},binding));
  }
});
