import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {validateRuntimeStage,runtimeReporterContext,runtimeHash} from './permission-runtime-results.mjs';
import VitestReporter from './permission-runtime-vitest-reporter.mjs';
import PlaywrightReporter from './permission-runtime-playwright-reporter.mjs';

const argv=[resolve('node_modules/vitest/vitest.mjs'),'run','--config','config.mjs','tests/example.test.ts'];
const context={sourceSHA:'a'.repeat(40),sourceFingerprint:'b'.repeat(64),lockSHA:'c'.repeat(64),configSHA:'d'.repeat(64),
  runId:'12345',invocationSHA:runtimeHash(argv)};
const identity={file:'tests/example.test.ts',name:'suite > required',project:null};
const expected={stage:'example',runner:'vitest',required:[identity],files:[identity.file],configSHA:context.configSHA,exactDiscovery:true,argv};
function report(){return {schemaVersion:'permission-runtime-stage-v1',...context,stage:'example',runner:'vitest',complete:true,
  runnerExit:'passed',errorCount:0,hookErrorCount:0,argv:[...argv],discovery:[{...identity,retry:0,repeats:1,expectedFailure:false,exclusive:false,disabled:false}],
  results:[{...identity,state:'passed',attempts:1}],selectedFiles:[identity.file]};}
test('real-stage normalization requires exact discovery and all passing single executions',()=>{
  const r=validateRuntimeStage(expected,report(),context,0);assert.equal(r.required,1);assert.equal(r.skip,0);
  assert.equal(r.supplementalOracles,'NOT_PROVEN_BY_STAGE_COUNTS');
});
const mutations={
  'lost source binding':r=>r.sourceSHA='f'.repeat(40),
  'old config binding':r=>r.configSHA='f'.repeat(64),
  'late afterAll failure':r=>r.hookErrorCount=1,
  'unhandled error':r=>r.errorCount=1,
  'timeout despite green bodies':r=>r.runnerExit='interrupted',
  'skipped required test':r=>r.results[0].state='skipped',
  'successful retry':r=>r.results[0].attempts=2,
  'retry option':r=>r.discovery[0].retry=1,
  'repeat option':r=>r.discovery[0].repeats=2,
  'expected failure':r=>r.discovery[0].expectedFailure=true,
  'disabled':r=>r.discovery[0].disabled=true,
  'exclusive':r=>r.discovery[0].exclusive=true,
  'missing discovery':r=>r.discovery=[],
  'duplicate result':r=>r.results.push({...r.results[0]}),
  'missing module':r=>r.selectedFiles=[],
  'unselected file':r=>r.discovery[0].file='tests/other.test.ts',
  'wrong project':r=>r.discovery[0].project='other',
  'unexpected discovery':r=>{r.discovery.push({...r.discovery[0],name:'extra'});r.results.push({...r.results[0],name:'extra'});},
};
for(const [name,mutate]of Object.entries(mutations))test('refuses '+name,()=>{
  const r=report();mutate(r);assert.throws(()=>validateRuntimeStage(expected,r,context,0),/RESULTS_REFUSED/);
});
test('PERM full files may contain additional tests only when each is also passing and selected',()=>{
  const r=report();mutations['unexpected discovery'](r);
  assert.equal(validateRuntimeStage({...expected,exactDiscovery:false},r,context,0).discovered,2);
  r.results[1].state='skipped';assert.throws(()=>validateRuntimeStage({...expected,exactDiscovery:false},r,context,0));
});
function fixture(run){const root=mkdtempSync(join(tmpdir(),'permission-runtime-reporter-'));
  try{run(root);}finally{rmSync(root,{recursive:true,force:true});}}
test('Vitest reporter captures nested hook errors and diagnostic retries rather than hiding them in pass totals',()=>fixture(root=>{
  const reporter=new VitestReporter();reporter.context={...context,stage:'example',runner:'vitest',sourceRoot:root,outputPath:join(root,'result.json')};
  reporter.discovery=[];reporter.seen=new Set();
  const module={moduleId:join(root,identity.file),project:{name:''},errors:()=>[],
    children:{allTests:()=>[t],allSuites:()=>[{errors:()=>[Error('sensitive hook text')]}]}};
  const t={module,fullName:identity.name,options:{},result:()=>({state:'passed'}),diagnostic:()=>({retryCount:1,repeatCount:0})};
  reporter.onTestModuleCollected(module);reporter.onTestRunEnd([module],[],'passed');
  const raw=readFileSync(reporter.context.outputPath,'utf8'),r=JSON.parse(raw);
  assert.equal(r.hookErrorCount,1);assert.equal(r.results[0].attempts,2);assert(!raw.includes('sensitive hook text'));
  assert.throws(()=>validateRuntimeStage(expected,r,context,0));
}));
test('Vitest failed result records only exact test line and finite error facts, excluding actual/expected/private stack text',()=>fixture(root=>{
 const reporter=new VitestReporter();reporter.context={...context,stage:'example',runner:'vitest',sourceRoot:root,outputPath:join(root,'result.json')};
 reporter.discovery=[];reporter.seen=new Set();
 const module={moduleId:join(root,identity.file),project:{name:''},errors:()=>[],children:{allTests:()=>[t],allSuites:()=>[]}};
 const error={name:'AssertionError',stack:'SECRET\n at assertion ('+module.moduleId+':184:2)',matcherResult:{name:'toEqual',actual:'SECRET',expected:'SECRET'}};
 const t={module,fullName:identity.name,options:{},result:()=>({state:'failed',errors:[error]}),diagnostic:()=>({retryCount:0,repeatCount:0})};
 reporter.onTestModuleCollected(module);reporter.onTestRunEnd([module],[],'failed');
 const raw=readFileSync(reporter.context.outputPath,'utf8'),r=JSON.parse(raw);
 assert.equal(r.results[0].state,'failed');assert.equal(r.results[0].failureLine,184);assert.equal(r.results[0].failureFacts.errorMatcherOrdinal,2);
 assert(!raw.includes('SECRET'));assert.throws(()=>validateRuntimeStage(expected,r,context,1));
}));

test('Playwright reporter preserves describe ancestry, project and actual duplicate attempts',()=>fixture(root=>{
  const project={name:'desktop',repeatEach:1},t={location:{file:join(root,identity.file)},title:'required',
    titlePath:()=>['','desktop','example.test.ts','suite','required'],parent:{project:()=>project},retries:0,
    expectedStatus:'passed',annotations:[]};
  const reporter=new PlaywrightReporter();const c={...context,stage:'example',runner:'playwright',sourceRoot:root,outputRoot:root};
  const p=join(root,'context.json');writeFileSync(p,JSON.stringify(c));
  const old=process.env.PERMISSION_RUNTIME_CONTEXT;process.env.PERMISSION_RUNTIME_CONTEXT=p;
  try{reporter.onBegin({repeatEach:1},{allTests:()=>[t]});reporter.onTestEnd(t,{status:'passed'});reporter.onTestEnd(t,{status:'passed'});reporter.onEnd({status:'passed'});}
  finally{if(old===undefined)delete process.env.PERMISSION_RUNTIME_CONTEXT;else process.env.PERMISSION_RUNTIME_CONTEXT=old;}
  const r=JSON.parse(readFileSync(join(root,'example-runner.json')));assert.equal(r.discovery[0].name,identity.name);
  assert.equal(r.discovery[0].project,'desktop');assert.equal(r.results[0].attempts,2);
}));
test('context refuses to overwrite prior evidence',()=>fixture(root=>{
  const p=join(root,'context.json');writeFileSync(p,JSON.stringify({...context,stage:'example',runner:'vitest',sourceRoot:resolve(root),outputRoot:resolve(root)}));
  writeFileSync(join(root,'example-runner.json'),'old evidence');
  assert.throws(()=>runtimeReporterContext({PERMISSION_RUNTIME_CONTEXT:p}));
}));
test('passing reporter cannot override nonzero, absent or signalled child exit',()=>{
  for(const exit of [1,null,undefined,137])assert.throws(()=>validateRuntimeStage(expected,report(),context,exit));
});
test('PERM required-name subset cannot hide ad-hoc grep/shard/project filtering of full files',()=>{
  for(const suffix of [['--grep','required'],['--project','desktop'],['--shard','1/2'],['--testNamePattern','required']]){
    const r=report();r.argv.push(...suffix);
    assert.throws(()=>validateRuntimeStage({...expected,exactDiscovery:false},r,context,0));
    const forged={...context,invocationSHA:runtimeHash(r.argv)};r.invocationSHA=forged.invocationSHA;
    assert.throws(()=>validateRuntimeStage({...expected,exactDiscovery:false},r,forged,0));
  }
});

test('fixed validation refusal ordinals retain all sixteen original strict sections',()=>{
 const checks=[
  [1,()=>[expected,report(),context,1]],
  [2,()=>[null,report(),context,0]],
  [3,()=>[expected,report(),{...context,sourceSHA:'private'},0]],
  [4,()=>[{...expected,configSHA:'f'.repeat(64)},report(),context,0]],
  [5,()=>[{...expected,argv:['relative','run']},report(),context,0]],
  [6,()=>[expected,{...report(),stage:'wrong'},context,0]],
  [7,()=>[expected,{...report(),sourceSHA:'f'.repeat(40)},context,0]],
  [8,()=>[expected,{...report(),argv:[...argv,'--private']},context,0]],
  [9,()=>[expected,{...report(),errorCount:1},context,0]],
  [10,()=>[expected,{...report(),results:[]},context,0]],
  [11,()=>[{...expected,required:[identity,identity]},report(),context,0]],
  [12,()=>{const r=report();r.discovery[0].disabled=true;return[expected,r,context,0];}],
  [13,()=>{const r=report();r.results[0].state='timedOut';return[expected,r,context,0];}],
  [14,()=>{const r=report();r.discovery[0].project='other';r.results[0].project='other';return[expected,r,context,0];}],
  [15,()=>{const r=report();mutations['unexpected discovery'](r);return[expected,r,context,0];}],
  [16,()=>[expected,{...report(),selectedFiles:[]},context,0]],
 ];
 for(const[ordinal,args]of checks)assert.throws(()=>validateRuntimeStage(...args()),e=>e.message==='PERMISSION_RUNTIME_RESULTS_REFUSED'&&e.runtimeResultFailureOrdinal===ordinal);
});
