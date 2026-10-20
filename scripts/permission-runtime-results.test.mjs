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
