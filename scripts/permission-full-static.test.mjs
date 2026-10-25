import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import {createRequire,registerHooks} from 'node:module';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {staticStagePlan,runStaticStage,loadStaticHelpers} from './permission-full-static.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'tests/permissions/permissionAggregateCases.json'),'utf8'));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const source={commit:'a'.repeat(40),tree:'b'.repeat(40),fingerprint:'c'.repeat(64),manifestSha256:hash(JSON.stringify(manifest)),manifest};
let tempRoot;
function fixtureRoot() {
 if(!tempRoot) {
  const supplied=process.env.PERMISSION_STATIC_TEST_TMP??(process.platform==='win32'?null:os.tmpdir());
  assert.ok(supplied&&path.isAbsolute(supplied),'Set PERMISSION_STATIC_TEST_TMP to an existing owned directory on D for Windows');
  if(process.platform==='win32')assert.equal(path.parse(path.resolve(supplied)).root.toUpperCase(),'D:\\');
  assert.equal(fs.lstatSync(supplied).isSymbolicLink(),false);assert.ok(fs.statSync(supplied).isDirectory());
  tempRoot=fs.mkdtempSync(path.join(fs.realpathSync(supplied),'permission-static-unit-'));
 }
 return tempRoot;
}
const outputs=[];
function fakeHelpers(verify=()=>({valid:true,discoveredCount:5,executedCount:5})) {
 return {verifySuite:verify,
  captureExecutionProfile:async input=>({...input,backend:{applicable:false}}),
  emitExecutionAttestation:input=>fs.writeFileSync(input.outputPath,JSON.stringify({syntheticOnly:true,source:input.sourceFingerprint})),
  collectVerifiedExecution:()=>{throw new Error('SIMULATION_MUST_NOT_COLLECT');}};
}
function fakeInvocation({mutate=()=>{},discoveryExit=0,executionExit=0}={}) {
 return async call=>{
  const entries=[...call.plan.required,...call.plan.files.filter(file=>!call.plan.required.some(item=>item.file===file)).map(file=>({file,name:'extra regression'}))];
  entries.push({file:call.plan.files[0],name:'config-file regression outside aggregate variants'});
  if(call.phase==='discovery') {
   fs.writeFileSync(call.paths.discovery,JSON.stringify(entries));return {status:discoveryExit};
  }
  const result={success:true,errorCount:0,hookErrorCount:0,hookErrors:[],runErrors:[],testResults:entries.map(item=>({name:item.file,assertionResults:[{fullName:item.name,status:'passed'}]}))};
  const options={runner:'vitest-actual-options-v1',reason:'passed',errorCount:0,tests:entries.map(item=>({...item,state:'passed',options:{fails:false,retry:0,repeats:0,mode:'run'}}))};
  mutate({result,options,entries});
  fs.writeFileSync(call.paths.results,JSON.stringify(result));fs.writeFileSync(call.paths.options,JSON.stringify(options));
  return {status:executionExit};
 };
}
let counter=0;
async function simulate(extra={}) {
 const result=await runStaticStage({stage:'candidate-seed-tools',outputRoot:fixtureRoot(),runId:'synthetic-'+(++counter)},
  {helpers:fakeHelpers(),readSource:()=>source,invoke:fakeInvocation(),...extra});
 outputs.push(result.directory);return result;
}

test('predeclares all four allowed static stages from the current required manifest',()=>{
 for(const [stage,occurrences,profile] of [['foundation-unit',108,'candidate'],['candidate-unit',242,'candidate'],['candidate-seed-tools',4,'candidate'],['legacy-t01-tools',28,'legacy']]) {
  const plan=staticStagePlan(stage,manifest);assert.equal(plan.variantOccurrences,occurrences);assert.equal(plan.profile,profile);
  assert.equal(plan.selection,'FULL_FILES_NO_VARIANT_GREP');assert.ok(plan.required.length>0);
 }
 const tools=staticStagePlan('legacy-t01-tools',manifest);
 assert.equal(tools.files.length,6);assert.ok(tools.files.includes('tests/contracts/harness.tool.test.ts'));
});
test('refuses every service/PIN stage and malformed or incomplete manifest',async()=>{
 for(const stage of ['identity-database','legacy-t01-database','candidate-images-service','PIN_BROWSER48','HP1','unknown','__proto__','constructor','toString']) {
  assert.throws(()=>staticStagePlan(stage,manifest),error=>error.code==='STATIC_STAGE_REFUSED');
  await assert.rejects(()=>runStaticStage({stage,outputRoot:'unused'}),error=>error.code==='STATIC_STAGE_REFUSED');
 }
 assert.throws(()=>staticStagePlan('candidate-unit',{...manifest,cases:manifest.cases.slice(1)}),error=>error.code==='STATIC_MANIFEST_INVALID');
 const changed=structuredClone(manifest);changed.cases[0].status='PENDING_T16';
 assert.throws(()=>staticStagePlan('candidate-unit',changed),error=>error.code==='STATIC_MANIFEST_INVALID');
});
test('runs list before full-file execution, filters secrets, and never upgrades simulation into gate evidence',async()=>{
 const calls=[];
 const result=await simulate({invoke:async call=>{calls.push(call);assert.equal(call.env.VITE_DATA_MODE,'mock');assert.equal(call.env.SUPABASE_SERVICE_ROLE_KEY,undefined);return fakeInvocation()(call);}});
 assert.deepEqual(calls.map(call=>call.phase),['discovery','execution']);
 assert.ok(calls[1].argv.includes('--allowOnly=false')&&calls[1].argv.includes('--retry=0')&&calls[1].argv.includes('--maxWorkers=1'));
 assert.ok(!calls[1].argv.some(arg=>/grep|testNamePattern/.test(arg)));
 assert.equal(result.status,'SIMULATED_PASS');assert.equal(result.valid,false);assert.equal(result.acceptedForAggregate,false);assert.equal(result.fullGate,'NOT_RUN');
 const report=JSON.parse(fs.readFileSync(path.join(result.directory,'execution-report.json'),'utf8'));
 assert.equal(report.schemaVersion,'permission-static-simulation-v1');assert.equal(report.valid,false);
});
test('rejects inherited, hidden, accessor and symbol dependency overrides before any getter or effect',async()=>{
 let getterCalls=0,effects=0;
 const overrides={helpers:fakeHelpers(),readSource:()=>{effects++;return source;},invoke:()=>{effects++;throw new Error('MUST_NOT_RUN');}};
 const hidden=Object.defineProperty({},'helpers',{value:overrides.helpers,enumerable:false});
 const accessor=Object.defineProperty({},'helpers',{get(){getterCalls++;return overrides.helpers;},enumerable:true});
 const symbol={[Symbol('helpers')]:overrides.helpers};
 const unexpected={...overrides,unexpected:true};
 for(const dependencies of [Object.create(overrides),hidden,accessor,symbol,unexpected,Object.create(null),null]) {
  await assert.rejects(()=>runStaticStage({stage:'candidate-seed-tools',outputRoot:'unused',runId:'must-not-write'},dependencies),error=>error.code==='STATIC_DEPENDENCIES_REFUSED');
 }
 assert.equal(getterCalls,0);assert.equal(effects,0);
});
test('discovery failure cannot start execution or emit accepted evidence',async()=>{
 const calls=[];const result=await simulate({invoke:async call=>{calls.push(call.phase);return fakeInvocation({discoveryExit:1})(call);}});
 assert.deepEqual(calls,['discovery']);assert.equal(result.code,'STATIC_DISCOVERY_FAILED');assert.equal(result.valid,false);
});
test('source drift after discovery stops before execution',async()=>{
 let reads=0;const calls=[];
 const result=await simulate({readSource:()=>({...source,fingerprint:++reads===1?source.fingerprint:'d'.repeat(64)}),invoke:async call=>{calls.push(call.phase);return fakeInvocation()(call);}});
 assert.deepEqual(calls,['discovery']);assert.equal(result.code,'STATIC_SOURCE_DRIFT');
});
test('failed process and passed test bodies with failed afterAll hooks are rejected',async()=>{
 const failed=await simulate({invoke:fakeInvocation({executionExit:1})});assert.equal(failed.code,'STATIC_EXECUTION_FAILED');
 const hooks=await simulate({invoke:fakeInvocation({mutate:({result})=>{result.hookErrorCount=1;result.hookErrors=[{code:'PERMISSION_ERROR_OPAQUE'}];}})});
 assert.equal(hooks.code,'STATIC_RUNNER_HOOK_ERRORS');
});
test('suite verifier rejection and final source drift cannot create accepted output',async()=>{
 const invalid=await simulate({helpers:fakeHelpers(()=>({valid:false,discoveredCount:5,executedCount:4}))});assert.equal(invalid.code,'STATIC_SUITE_INVALID');
 let reads=0;const changed=await simulate({readSource:()=>({...source,tree:++reads<3?source.tree:'e'.repeat(40)})});assert.equal(changed.code,'STATIC_SOURCE_DRIFT');
});
test('fresh output identity prevents overwrite without deleting existing evidence',async()=>{
 const result=await simulate();
 const runId=path.basename(result.directory).slice('candidate-seed-tools-'.length);
 const before=fs.readFileSync(path.join(result.directory,'summary.json'));
 await assert.rejects(()=>runStaticStage({stage:'candidate-seed-tools',outputRoot:fixtureRoot(),runId},{helpers:fakeHelpers(),readSource:()=>source,invoke:fakeInvocation()}),error=>error.code==='STATIC_OUTPUT_EXISTS');
 assert.deepEqual(fs.readFileSync(path.join(result.directory,'summary.json')),before);
});
test('real-helper integration follows explicit installed pg opt-in',async t=>{
 const pgModule=process.env.PERMISSION_STATIC_TEST_PG_MODULE;
 if(!pgModule){t.diagnostic('REAL_HELPER_INTEGRATION_NOT_RUN: PERMISSION_STATIC_TEST_PG_MODULE unset; dependency-injected units remain required');return;}
 assert.ok(path.isAbsolute(pgModule)&&fs.lstatSync(pgModule).isFile());
 const packagePath=path.resolve(path.dirname(pgModule),'..','package.json');
 const metadata=JSON.parse(fs.readFileSync(packagePath,'utf8'));assert.equal(metadata.name,'pg');assert.match(metadata.version,/^\d+\.\d+\.\d+/);
 const pg=createRequire(import.meta.url)(pgModule),originalConnect=pg.Client.prototype.connect,originalQuery=pg.Client.prototype.query;
 let databaseCalls=0;
 pg.Client.prototype.connect=pg.Client.prototype.query=function(){databaseCalls++;throw new Error('STATIC_TEST_DATABASE_FORBIDDEN');};
 const hook=registerHooks({resolve(specifier,context,next){return specifier==='pg'?{url:pathToFileURL(pgModule).href,shortCircuit:true}:next(specifier,context);}});
 try {
  const helpers=await loadStaticHelpers();
  const successful=await simulate({helpers});assert.equal(successful.status,'SIMULATED_PASS');assert.ok(successful.counts.executed>successful.inventory.requiredVariants);
  const bad=await simulate({helpers,invoke:fakeInvocation({mutate:({options})=>{options.tests[0].options.retry=1;}})});assert.equal(bad.code,'STATIC_SUITE_INVALID');
  const missing=await simulate({helpers,invoke:fakeInvocation({mutate:({result})=>{result.testResults.pop();}})});assert.equal(missing.code,'STATIC_SUITE_INVALID');
  const reportPath=path.join(successful.directory,'execution-report.json'),attestationPath=path.join(successful.directory,'profile-attestation.json');
  assert.throws(()=>helpers.collectVerifiedExecution({reportPath,attestationPath,currentSourceFingerprint:source.fingerprint}),/EVIDENCE_REPORT_INVALID/);
  assert.equal(databaseCalls,0);
  t.diagnostic(JSON.stringify({scope:'SYNTHETIC_UNIT_ONLY',pgModule:fs.realpathSync(pgModule),pgVersion:metadata.version,pgPackageSha256:hash(fs.readFileSync(packagePath)),databaseCalls}));
 } finally {hook.deregister();pg.Client.prototype.connect=originalConnect;pg.Client.prototype.query=originalQuery;}
});
test('synthetic test outputs stay below 1 MiB and are retained without automatic cleanup',()=>{
 let bytes=0,files=0;
 const visit=directory=>{for(const entry of fs.readdirSync(directory,{withFileTypes:true})){const file=path.join(directory,entry.name);assert.equal(fs.lstatSync(file).isSymbolicLink(),false);if(entry.isDirectory())visit(file);else{files++;bytes+=fs.statSync(file).size;}}};
 if(tempRoot)visit(tempRoot);
 assert.ok(bytes<=1024*1024);assert.ok(files>0);
 console.log(JSON.stringify({schema:'permission-static-unit-receipt-v1',syntheticOnly:true,bytes,files,root:tempRoot,cleanup:'NOT_PERFORMED',actualVitest:'NOT_RUN',fullGate:'NOT_RUN'}));
});
