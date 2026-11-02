import { backendInvocation } from './project-backend.mjs';
import { ci1TrustedRepository } from './permission-ci1-policy.mjs';
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, existsSync, linkSync, rmSync, lstatSync } from 'node:fs';
import { crc32 } from 'node:zlib';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import SmokeFailureReporter, { smokeStepDiagnostic, smokeTraceDiagnostics, smokeTraceEvents, smokeTraceSnapshotFacts, smokeTraceExpectFacts, sourceBinding, vitestCounts, nodeCounts, smokeCounts, smokePreflightCounts, uiCounts, publicSummary, privateDiagnostics, nodeTapFailureDiagnostics, NODE_FAILURE_ERRNOS, guardFailureCode, PROJECTS, PROJECT_PHASES, hash } from './project-ci-results.mjs';
import { capturedCommand, trackedFingerprint, lightEnvironment, checkoutGit, allocatedBytes, coreLimitDisabled, browserRuntimeControlCanStart, gitCommitParents } from './project-ci.mjs';
import { lightService, lightOwnerMatches, withLightCorePattern, stopLightUnit, coreDumpDisabled, linuxCorePatternAdapter } from './project-ci-launch.mjs';
import { verifyReleaseRun, verifyReleaseEnvironment, verifyReleaseFiles, productionCommands, PRODUCTION_ENABLED } from './project-release.mjs';

// T02 fixtures follow the JSON serializer: errors[] has location/message only;
// raw error.stack and errorLocation describe that same first error.
function t02Error(line=31, message='FAKE_PRIVATE_TOKEN expected false to be true') {
  return {message,stack:`Error: ${message}\n    at /source/tests/smoke/pos-cafe.spec.ts:${line}:3`};
}
function t02Fixture({file='pos-cafe.spec.ts',title='case',projectName='desktop',status='failed',retry=0,line=20,errorLine=31}={}) {
  const error=t02Error(errorLine), filePath='/source/tests/smoke/'+file;
  const result={status,retry,duration:250,error,errors:[{message:error.message,location:{file:filePath,line:errorLine,column:3}}]};
  const testEntry={projectName,timeout:60000,results:[result]},spec={file,title,line,tests:[testEntry]};
  return {report:{suites:[{specs:[spec]}],stats:{expected:0,unexpected:1,skipped:0,flaky:0}},spec,testEntry,result,file:filePath,
    files:['tests/smoke/pos-cafe.spec.ts','tests/smoke/helpers.ts','tests/smoke/permission-ui-closeout.spec.ts','tests/smoke/demo-runbook.spec.ts','tests/smoke/report-presentation.spec.ts']};
}
function t02TestCase(f) { return {title:f.spec.title,location:{file:f.file,line:f.spec.line},parent:{project:()=>({name:f.testEntry.projectName})}}; }
function t02Record(f, changes={}) {
  return {schemaVersion:'pos-smoke-terminal-v1',caseDigest:hash(`${f.testEntry.projectName}|${f.spec.file}|${f.spec.line}|${f.spec.title}`),
    retry:f.result.retry,statusOrdinal:['failed','timedOut','interrupted'].indexOf(f.result.status)+1,
    step:{categoryOrdinal:2,apiOrdinal:7,locatorOrdinal:1,durationMs:11},...changes};
}
function t02Line(f,changes={}) {return 'PROJECT_SMOKE_TERMINAL_STEP '+JSON.stringify(t02Record(f,changes));}
function t02Parse(f,output=t02Line(f),complete=true) {return privateDiagnostics(output,f.report,f.files,'/source',complete);}
function t02NoStep(d) {for(const key of ['smokeStepCategoryOrdinal','smokeStepApiOrdinal','smokeStepLocatorOrdinal','smokeStepDurationMs','browserCrashBeforeFailedStep'])assert.equal(d.metrics[key],undefined,key);}

test('T02 TC08: buffer boundaries, 10000-result lifecycle and terminal-only output cap',t=>{
  const lines=[];t.mock.method(console,'log',line=>lines.push(line));const r=new SmokeFailureReporter();r.onBegin({rootDir:'/source/tests/smoke'});
  const f=t02Fixture(),tc=t02TestCase(f),error=t02Error(),step={category:'expect',title:'expect.toBeVisible',duration:11,error};
  const results=Array.from({length:64},()=>({status:'failed',retry:0,errors:[error]}));
  for(const result of results){r.onTestBegin(tc,result);r.onStepEnd(tc,result,step);
    for(let n=0;n<127;n++)r.onStepEnd(tc,result,{...step,error:t02Error(n+100)});
    assert.equal(r.buffers.get(result).size,128);}
  assert.equal(r.buffers.size,64);
  for(const result of results)r.onTestEnd(tc,result);
  assert.equal(r.buffers.size,0);assert.equal(lines.length,32);
  for(const line of lines){assert.ok(Buffer.byteLength(line)<=512);assert.notEqual(JSON.parse(line.slice('PROJECT_SMOKE_TERMINAL_STEP '.length)).step,null);}
  const quiet=new SmokeFailureReporter();quiet.onBegin({rootDir:'/source/tests/smoke'});
  for(let n=0;n<10000;n++){const result={status:'passed',retry:0,errors:[]};quiet.onTestBegin(tc,result);
    for(let k=0;k<20;k++)quiet.onStepEnd(tc,result,{...step,error:t02Error(k+100)});
    assert.ok(quiet.buffers.size<=64);quiet.onTestEnd(tc,result);assert.equal(quiet.buffers.size,0);}
  assert.equal(quiet.emitted,0);
  const late=t02Fixture({title:'not-emitted'});t02NoStep(t02Parse(late,lines.join('\n')));assert.equal(t02Parse(late,lines.join('\n')).metrics.smokeFailureLine,31);

});

test('T02 TC01-03b: successful transient errors emit nothing; terminal result owns every metric', t=>{
  const lines=[];t.mock.method(console,'log',line=>lines.push(line));
  const reporter=new SmokeFailureReporter();reporter.onBegin({rootDir:'/source/tests/smoke'});
  const a=t02Fixture({title:'passed',status:'passed'}),b=t02Fixture({title:'failed',errorLine:70});
  for(const f of [a,b]){const tc=t02TestCase(f),reported={...f.result,errors:[f.result.error]};reporter.onTestBegin(tc,reported);
    reporter.onStepEnd(tc,reported,{category:'expect',title:'expect.toBeVisible',duration:11,error:f.result.error});
    reporter.onTestEnd(tc,reported);}
  assert.equal(lines.length,1);assert.equal(reporter.buffers.size,0);
  b.report.suites[0].specs.unshift(a.spec);
  for(const output of [lines.join('\n'),t02Line(a)+'\n'+lines[0],lines[0]+'\n'+t02Line(a)]) {
    const d=t02Parse(b,output);assert.equal(d.metrics.smokeFailureLine,70);assert.equal(d.metrics.smokeStepDurationMs,11);
  }
  a.report.suites[0].specs=[a.spec];t02NoStep(t02Parse(a,''));
});

test('T02 TC03c/d/e: same first error, exact inner step, duplicate keys and bounded buffers',t=>{
  const lines=[];t.mock.method(console,'log',line=>lines.push(line));
  const run=(steps,errors,setup=()=>{})=>{const r=new SmokeFailureReporter(),f=t02Fixture();r.onBegin({rootDir:'/source/tests/smoke'});
    setup(r);r.onTestBegin(t02TestCase(f),f.result);for(const s of steps)r.onStepEnd(t02TestCase(f),f.result,s);
    f.result.errors=errors;r.onTestEnd(t02TestCase(f),f.result);return {r,record:JSON.parse(lines.at(-1).slice('PROJECT_SMOKE_TERMINAL_STEP '.length))};};
  const x=t02Error(40),y=t02Error(50),step=(error,duration=11)=>({category:'expect',title:'expect.toBeVisible',duration,error});
  assert.equal(run([step(x),step(y,29)],[x,y]).record.step.durationMs,11);
  assert.equal(run([step(x),step(y,29)],[y]).record.step.durationMs,29);
  assert.equal(run([step(x),step(x,29)],[x]).record.step,null);
  const parent={...step(x,99),category:'test.step'},child={...step(x),parent};
  assert.equal(run([child,parent],[x]).record.step.durationMs,11);
  const softParent={...parent},softChild={...child,parent:softParent};
  assert.equal(run([softChild,softParent],[x,y]).record.step.categoryOrdinal,2);
  // Boxed stack equality is the contract; missing-name box changes the stack.
  assert.equal(run([child,parent],[{...x}]).record.step.durationMs,11);
  assert.equal(run([child,parent],[{...x,stack:': '+x.stack}]).record.step,null);
  for(const bad of [{message:'x'},{...x,stack:'Error: no frame'},{...x,message:'x'.repeat(1048577)},{...x,stack:x.stack+'x'.repeat(1048577)}])
    assert.equal(run([step(x)],[bad]).record.step,null);
  const many=Array.from({length:128},(_,i)=>step(t02Error(i+100)));
  assert.equal(run([...many,step(x)],[x]).record.step,null);
  assert.equal(run([step(x),...many],[x]).record.step.durationMs,11);
  const full=run([step(x)],[x],r=>{for(let i=0;i<64;i++)r.onTestBegin({},{});});
  assert.equal(full.record.step,null);assert.equal(full.r.buffers.size,64);
  const r=new SmokeFailureReporter();r.onBegin({rootDir:'/source/tests/smoke'});const f=t02Fixture();r.onTestBegin({},f.result);
  for(const s of many)r.onStepEnd({},f.result,s);r.onStepEnd({},f.result,step(x));
  const map=r.buffers.get(f.result);assert.equal(map.size,128);
  for(const [key,value]of map){assert.match(key,/^[a-f0-9]{64}$/);assert.ok([1,2].includes(value.count));
    assert.ok(Object.values(value.fields).every(v=>v===null||Number.isInteger(v)));}
});

test('T02 TC04-07c: final attempt, interrupted fallback and unique discovery identity',()=>{
  const interrupted=t02Fixture({title:'interrupted',status:'interrupted'}),failed=t02Fixture({title:'failure',errorLine:80});
  failed.report.suites[0].specs.unshift(interrupted.spec);
  assert.equal(t02Parse(failed).metrics.smokeFailureLine,80);
  interrupted.result.errors=[];delete interrupted.result.error;
  const d=t02Parse(interrupted);assert.equal(d.metrics.smokeResultStatusOrdinal,3);assert.equal(d.metrics.smokeFailureLine,undefined);
  for(const status of ['passed','skipped','failed']){
    const f=t02Fixture();f.testEntry.results.push({...f.result,retry:1,status,duration:999});
    const d=t02Parse(f);t02NoStep(d);
    assert.equal(d.metrics.smokeResultStatusOrdinal,status==='failed'?1:undefined);
    if(status==='failed'){assert.equal(d.metrics.smokeResultDurationMs,999);f.result=f.testEntry.results[1];assert.equal(t02Parse(f).metrics.smokeStepDurationMs,11);}
    assert.throws(()=>smokeCounts(f.report,f.report,[]));
  }
  const a=t02Fixture(), variants=[t02Fixture({file:'demo-runbook.spec.ts',errorLine:55}),t02Fixture({title:'parameter2',errorLine:56}),t02Fixture({projectName:'phone-landscape',errorLine:57})];
  for(const b of variants)for(const reverseReport of [false,true])for(const reverseOutput of [false,true]){
    const f=reverseReport?b:a;f.report={suites:[{specs:reverseReport?[b.spec,a.spec]:[a.spec,b.spec]}]};
    const d=t02Parse(f,(reverseOutput?[t02Line(b,{step:{categoryOrdinal:2,apiOrdinal:0,locatorOrdinal:0,durationMs:29}}),t02Line(a)]:[t02Line(a),t02Line(b,{step:{categoryOrdinal:2,apiOrdinal:0,locatorOrdinal:0,durationMs:29}})]).join('\n'));
    assert.equal(d.metrics.smokeStepDurationMs,reverseReport?29:11);assert.deepEqual([...new Set(d.failedFiles)].sort(),[...new Set([a.spec.file,b.spec.file].map(file=>'tests/smoke/'+file))].sort());
  }
  const dup=t02Fixture();dup.report.suites[0].specs.push(structuredClone(dup.spec));t02NoStep(t02Parse(dup));
});

test('T02 TC05a-d/17/24: only error0 locations, strict paths, no timeout error1 fallback',()=>{
  const f=t02Fixture(),loc=f.result.errors[0].location;
  for(const file of ['/source/node_modules/x.ts','/source/tests/smoke/../pos-cafe.spec.ts','tests/smoke/%2e/x.ts','file://host/source/tests/smoke/pos-cafe.spec.ts','file:///source/tests/smoke/pos-cafe.spec.ts?q=1']){
    f.result.errors[0].location={...loc,file};assert.equal(t02Parse(f).metrics.smokeFailureLine,31);
  }
  delete f.result.errors[0].location;f.result.errorLocation={...loc,line:44};assert.equal(t02Parse(f).metrics.smokeFailureLine,44);
  delete f.result.errorLocation;assert.equal(t02Parse(f).metrics.smokeFailureLine,31);
  f.result.error={message:'timeout',stack:'Error: timeout'};f.result.errors=[{message:'timeout'},{message:'click',location:loc}];f.result.status='timedOut';
  const d=t02Parse(f,t02Line(f,{step:null}));assert.equal(d.metrics.smokeResultStatusOrdinal,2);t02NoStep(d);
  for(const k of ['smokeFailureLine','smokeFailureColumn','smokeStepSourceOrdinal','smokeHelperLine'])assert.equal(d.metrics[k],undefined);
  f.result.errors=[];f.result.error={...t02Error(31),location:loc};assert.equal(t02Parse(f).metrics.smokeFailureLine,31);
  f.result.errors=[{location:{...loc,file:'/source/tests/smoke/helpers.ts',line:6}}];assert.equal(t02Parse(f).metrics.smokeHelperLine,6);
  f.result.errors[0].location=loc;f.result.error.stack+='\n    at /source/tests/smoke/helpers.ts:19:7';assert.equal(t02Parse(f).metrics.smokeHelperLine,19);
  const presentation=t02Fixture({file:'report-presentation.spec.ts'});assert.equal(t02Parse(presentation).metrics.smokeStepSourceOrdinal,5);
});

test('T02 TC08/10/11/25/26: complete, unique, bounded terminal records only',()=>{
  const f=t02Fixture(),good=t02Line(f),other=t02Line(f,{caseDigest:'a'.repeat(64)}),crash='pw:browser Received signal 11';
  for(const records of [[good,good],[t02Line(f,{retry:1})],[t02Line(f,{statusOrdinal:2})],[t02Line(f,{extra:1})],
    [t02Line(f,{schemaVersion:'other'})],['prefix '+good],[good+'x'.repeat(1024)],['PROJECT_SMOKE_FAILED_STEP {}'],
    [t02Line(f,{step:{categoryOrdinal:999,apiOrdinal:0,locatorOrdinal:0,durationMs:1}})]])t02NoStep(t02Parse(f,records.join('\n')));
  assert.equal(t02Parse(f,[good,...Array(63).fill(other)].join('\n')).metrics.smokeStepDurationMs,11);
  const malformed='XPROJECT_SMOKE_TERMINAL_STEP'+ 'x'.repeat(1050);
  assert.equal(t02Parse(f,[good,...Array(63).fill(malformed)].join('\n')).metrics.smokeStepDurationMs,11);
  for(const records of [[good,...Array(63).fill(other),good],[good,...Array(64).fill(other)],[...Array(64).fill(other),good],[good,crash,...Array(64).fill(malformed)]]){
    const d=t02Parse(f,records.join('\n'));t02NoStep(d);assert.equal(d.metrics.smokeFailureLine,31);}
  t02NoStep(t02Parse(f,good,false));assert.equal(t02Parse(f,good).metrics.smokeStepDurationMs,11);
  const huge=t02Fixture();huge.report.suites.push(...Array.from({length:10000},()=>({})));t02NoStep(t02Parse(huge));assert.equal(t02Parse(huge).metrics.smokeFailureLine,31);
  const child=t02Fixture();child.report.suites[0].suites=Array.from({length:10001},()=>({}));t02NoStep(t02Parse(child));
  huge.result.status='interrupted';assert.equal(t02Parse(huge).metrics.smokeResultStatusOrdinal,undefined);
  const d=t02Parse(f,'[81/81]\ntests/smoke/helpers.ts:99:3\n'+good);assert.equal(d.metrics.smokeProgressIndex,undefined);assert.equal(d.metrics.smokeHelperLine,undefined);
  const defaultComplete=privateDiagnostics(good,f.report,f.files,'/source');assert.equal(defaultComplete.metrics.smokeStepDurationMs,11);
  assert.match(readFileSync(new URL('./project-ci.mjs',import.meta.url),'utf8'),/diagnostic = privateDiagnostics\(readFileSync\(output, 'utf8'\), report, paths, root, result\.blocked === false\);/);
});

test('T02 TC18/20-23/25: output/report separation for CR, LF, ANSI and crash ordering',()=>{
  const f=t02Fixture(),good=t02Line(f),crash='pw:browser Received signal 11';
  for(const ending of ['\r','\n','\r\n','']){
    f.result.errors[0].message=crash+'\n'+good;
    assert.equal(t02Parse(f,good+ending).metrics.smokeStepDurationMs,11);assert.equal(t02Parse(f,good+ending).metrics.browserCrashBeforeFailedStep,undefined);
    t02NoStep(t02Parse(f,'ordinary output'+ending));
    assert.equal(t02Parse(f,crash+'\r'+good+ending).metrics.browserCrashBeforeFailedStep,1);
  }
  assert.equal(t02Parse(f,good+'\r'+crash).metrics.browserCrashBeforeFailedStep,0);
  assert.equal(t02Parse(f,'X\r\x1b[0m\n'+crash+'\r'+good).metrics.browserCrashBeforeFailedStep,1);
  const missing=privateDiagnostics(good+'\n'+crash,null,f.files,'/source');t02NoStep(missing);assert.equal(missing.metrics.browserCrashSignal,11);assert.ok(missing.codes.includes('REPORT_MISSING'));
  for(const report of [{suites:{}},{testResults:[],numFailedTests:1}]){const d=privateDiagnostics(good+'\n[1/2]\ntests/smoke/helpers.ts:99:3',report,f.files,'/source');t02NoStep(d);assert.equal(d.metrics.smokeHelperLine,undefined);}
  const preflight=publicSummary(binding,[{id:'install',status:'FAIL',exitCode:1,elapsedMs:1,invocationSHA:digest,reportSHA:digest,diagnostic:t02Parse(f,good)}],{source:digest,lock:digest});
  assert.equal(preflight.overallStatus,'FAIL');assert.equal(preflight.phases[0].diagnostic.metrics.smokeStepDurationMs,11);
});

const sha = '1'.repeat(40), other = '2'.repeat(40), digest = '3'.repeat(64);
const env = { GITHUB_REPOSITORY: 'nguyentronglinh045/pos-cafe', GITHUB_REPOSITORY_ID: '1263057386', GITHUB_ACTIONS: 'true', RUNNER_ENVIRONMENT: 'github-hosted',
  GITHUB_EVENT_NAME: 'push', GITHUB_SHA: sha, GITHUB_WORKFLOW_SHA: sha, GITHUB_RUN_ID: '123', GITHUB_RUN_ATTEMPT: '1' };
const binding = sourceBinding(env, { after: sha, repository: { full_name: env.GITHUB_REPOSITORY, id: 1263057386 } }, sha);
const edgeReceipt={schemaVersion:'permission-edge-resolution-v1',sourceSHA:sha,scope:'NATIVE_RESOLVER_ONLY',configSHA256:'a'.repeat(64),lockSHA256:'b'.repeat(64),cacheSHA256:'c'.repeat(64),packages:20,observed:17,metadataOnly:3,warmBundles:2,runtimeBadSRIControls:1,rootRemoved:true,processReleased:true};

const traceLines = events => [{type:'context-options',version:8,playwrightVersion:'1.60.0',browserName:'chromium'},
  ...events].map(event => JSON.stringify(event)).join('\n') + '\n';

test('watch worker diagnostics publish only bounded numeric observations without worker errors, paths or arbitrary JSON',()=>{
  const facts={version:1,stage:6,failureStage:5,httpStatus:200,generatedWatchCount:3,appSourceWatched:1,watchedPathCount:204,closed:1,exitOrdinal:2,exitCode:1,timeoutOrdinal:0,
    error:'FAKE_PRIVATE_TOKEN',fixture:'/private/FAKE_PRIVATE_TOKEN',unknown:99};
  const diagnostic=privateDiagnostics('# PROJECT_UI_WATCH_CONTROL '+JSON.stringify(facts),null);
  assert.deepEqual(Object.fromEntries(Object.entries(diagnostic.metrics).filter(([key])=>key.startsWith('uiWatch'))),{
    uiWatchStageOrdinal:6,uiWatchFailureStageOrdinal:5,uiWatchHTTPStatus:200,uiWatchGeneratedWatchCount:3,uiWatchAppSourceWatched:1,uiWatchWatchedPathCount:204,
    uiWatchClosed:1,uiWatchExitOrdinal:2,uiWatchExitCode:1,uiWatchTimeoutOrdinal:0});
  const safe=publicSummary(binding,[{id:'install',status:'FAIL',elapsedMs:1,exitCode:1,invocationSHA:digest,reportSHA:digest,counts:null,diagnostic}],{source:digest,lock:digest});
  assert.equal(safe.phases[0].diagnostic.metrics.uiWatchFailureStageOrdinal,5);assert.equal(safe.overallStatus,'FAIL');
  assert.equal(JSON.stringify(safe).includes('FAKE_PRIVATE_TOKEN'),false);
  for(const raw of ['PROJECT_UI_WATCH_CONTROL {', 'PROJECT_UI_WATCH_CONTROL '+JSON.stringify({...facts,version:2}),
    'not a marker PROJECT_UI_WATCH_CONTROL '+JSON.stringify(facts),'PROJECT_UI_WATCH_CONTROL '+JSON.stringify(facts)+' trailing',
    'PROJECT_UI_WATCH_CONTROL '+JSON.stringify({...facts,raw:'x'.repeat(2048)})])
    assert.equal(Object.keys(privateDiagnostics(raw,null).metrics).some(key=>key.startsWith('uiWatch')),false);
  for(const [field,value] of Object.entries({stage:8,failureStage:-1,httpStatus:600,generatedWatchCount:1000001,appSourceWatched:2,watchedPathCount:'204',closed:true,exitOrdinal:6,exitCode:256,timeoutOrdinal:4})) {
    const result=privateDiagnostics('PROJECT_UI_WATCH_CONTROL '+JSON.stringify({version:1,[field]:value}),null);
    assert.equal(Object.keys(result.metrics).some(key=>key.startsWith('uiWatch')),false);
  }
});
function storedTraceZip(entries) {
  const files = [], central = []; let offset = 0;
  for (const [name, text] of Object.entries(entries)) {
    const filename = Buffer.from(name), bytes = Buffer.from(text), local = Buffer.alloc(30), directory = Buffer.alloc(46);
    local.writeUInt32LE(0x04034b50); local.writeUInt16LE(20, 4); local.writeUInt32LE(crc32(bytes), 14);
    local.writeUInt32LE(bytes.length, 18); local.writeUInt32LE(bytes.length, 22); local.writeUInt16LE(filename.length, 26);
    directory.writeUInt32LE(0x02014b50); directory.writeUInt16LE(20, 4); directory.writeUInt16LE(20, 6);
    directory.writeUInt32LE(crc32(bytes), 16); directory.writeUInt32LE(bytes.length, 20); directory.writeUInt32LE(bytes.length, 24);
    directory.writeUInt16LE(filename.length, 28); directory.writeUInt32LE(offset, 42);
    files.push(local, filename, bytes); central.push(directory, filename); offset += local.length + filename.length + bytes.length;
  }
  const end = Buffer.alloc(22), directory = Buffer.concat(central), count = Object.keys(entries).length;
  end.writeUInt32LE(0x06054b50); end.writeUInt16LE(count, 8); end.writeUInt16LE(count, 10);
  end.writeUInt32LE(directory.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...files, directory, end]);
}
const traceReport = path => ({suites:[{specs:[{tests:[{results:[{status:'timedOut',attachments:[{name:'trace',contentType:'application/zip',path}]}]}]}]}]});

test('trace observes browser JS errors without exporting messages, URLs, secrets or unmapped paths', () => {
  const secret = 'FAKE_TRACE_PRIVATE_TOKEN', file = 'src/app/App.tsx';
  const result = smokeTraceEvents(traceLines([
    {type:'event',class:'BrowserContext',method:'pageError',params:{error:{error:{name:'TypeError',message:secret,
      stack:`TypeError ${secret}\n at http://127.0.0.1:5175/${file}?t=123:89:7\n at http://private/${secret}.js:1:1`}}}},
    {type:'console',messageType:'error',text:`Maximum update depth exceeded ${secret}`},
    {type:'console',messageType:'warning',text:`The result of getSnapshot should be cached ${secret}`},
    {type:'resource-snapshot',snapshot:{request:{url:`http://private/${secret}`},response:{status:404}}},
    {type:'resource-snapshot',snapshot:{response:{status:503}}},
  ]), [file]);
  assert.deepEqual(result.codes,['JS_TYPE_ERROR','REACT_UPDATE_DEPTH','REACT_UNSTABLE_SNAPSHOT']);
  assert.deepEqual(result.failedFiles,[file]);
  assert.deepEqual(result.metrics,{traceReadable:1,tracePageErrors:1,traceConsoleErrors:1,traceConsoleWarnings:1,
    traceHttp4xx:1,traceHttp5xx:1,traceHttp2xx:0,traceModuleLine:89,traceModuleColumn:7,
    traceMainFrameSnapshots:0,traceSnapshotComplete:0,traceExpectCalls:0});
  const row = {id:'install',status:'FAIL',exitCode:1,elapsedMs:1,invocationSHA:digest,reportSHA:digest,diagnostic:result};
  const safe=publicSummary(binding,[row],{source:digest,lock:digest});
  assert.equal(safe.overallStatus,'FAIL');assert.deepEqual(safe.phases[0].diagnostic,result);
  assert.equal(JSON.stringify(safe).includes(secret),false);
  assert.equal(JSON.stringify(result).includes('http'),false);
  assert.equal(smokeTraceEvents(traceLines([{type:'event',class:'BrowserContext',method:'pageError',params:{error:{error:{stack:
    'at http://127.0.0.1:5175/src/unknown.ts:1:1\n at http://127.0.0.1:5175/src/../private.ts:1:1'}}}}]),[file]).failedFiles.length,0);
});

test('trace snapshot counts resolve post-order references and expose only fixed screen observations', () => {
  const event=html=>({type:'frame-snapshot',snapshot:{isMainFrame:true,pageId:'FAKE_PRIVATE_PAGE',frameId:'FAKE_PRIVATE_FRAME',
    frameUrl:'http://127.0.0.1:5175/',html}});
  const first=event(['HTML',{},['BODY',{},['DIV',{id:'root'},['MAIN',{'data-testid':'landing-screen'},'FAKE_TRACE_PRIVATE_TOKEN']]]]);
  const second=event([[1,4]]); // text0, main1, div2, body3, html4
  assert.deepEqual(smokeTraceSnapshotFacts([first,second]),{traceMainFrameSnapshots:2,traceSnapshotComplete:1,
    traceScreenMask:1,traceLandingNodes:1,traceAppRootNodes:1});
  const paired=event(['HTML',{},['DIV',{id:'root'},['MAIN',{'data-testid':'passcode-screen'}],['P',{},'private']]]);
  const result=smokeTraceEvents(traceLines([first,second,paired]),[]);
  assert.equal(result.metrics.traceScreenMask,4);assert.equal(result.metrics.traceLandingNodes,0);
  assert.equal(JSON.stringify(result).includes('PRIVATE'),false);assert.equal(JSON.stringify(result).includes('http'),false);
  const duplicate=event(['DIV',{id:'root'},['MAIN',{'data-testid':'landing-screen'}],['MAIN',{'data-testid':'landing-screen'}]]);
  assert.equal(smokeTraceSnapshotFacts([duplicate]).traceLandingNodes,2);
  const incomplete=smokeTraceSnapshotFacts([first,event([[4,999]])]);
  assert.equal(incomplete.traceSnapshotComplete,0);assert.equal(incomplete.traceScreenMask,undefined);
  const external=event(['MAIN',{'data-testid':'landing-screen'}]);external.snapshot.frameUrl='http://private/FAKE_TRACE_PRIVATE_TOKEN';
  assert.equal(smokeTraceSnapshotFacts([external]).traceMainFrameSnapshots,0);
  for(const frameUrl of ['http://private/FAKE_TRACE_PRIVATE_TOKEN','not a URL','http://127.0.0.1:5175/other']) {
    const outside=event(['MAIN',{'data-testid':'landing-screen'}]);outside.snapshot.frameUrl=frameUrl;
    const last=smokeTraceSnapshotFacts([first,outside]);
    assert.equal(last.traceSnapshotComplete,0);assert.equal(last.traceScreenMask,undefined);assert.equal(last.traceLandingNodes,undefined);
  }
  assert.equal(smokeTraceSnapshotFacts([first,external,second]).traceSnapshotComplete,0);
  assert.equal(smokeTraceSnapshotFacts([first,event([[1,4,99]])]).traceSnapshotComplete,0);
  for(const attrs of [{id:'root','data-testid':123},{id:{}},{title:{private:'FAKE_TRACE_PRIVATE_TOKEN'}},
    {id:'root','data-testid':'landing-screen',class:42}]) {
    const malformed=smokeTraceSnapshotFacts([event(['DIV',attrs])]);
    assert.equal(malformed.traceSnapshotComplete,0);assert.equal(malformed.traceScreenMask,undefined);
  }
  const deep=event(Array.from({length:260}).reduce(node=>['DIV',{},node],['MAIN',{'data-testid':'landing-screen'}]));
  assert.equal(smokeTraceSnapshotFacts([deep]).traceSnapshotComplete,0);
  const wide=event(['DIV',{id:'root'},...Array(100001).fill('private')]);
  assert.equal(smokeTraceSnapshotFacts([wide]).traceSnapshotComplete,0);
  const safe=publicSummary(binding,[{id:'install',status:'FAIL',exitCode:1,elapsedMs:1,invocationSHA:digest,reportSHA:digest,diagnostic:result}],{source:digest,lock:digest});
  assert.equal(safe.phases[0].diagnostic.metrics.traceScreenMask,4);assert.equal(safe.overallStatus,'FAIL');
});

test('fixed selector and browser protocol errors never reflect error text', () => {
  for(const [message,code] of [
    ['strict mode violation: FAKE_TRACE_PRIVATE_TOKEN resolved to 2 elements','SELECTOR_STRICT'],
    ['Invalid selector FAKE_TRACE_PRIVATE_TOKEN','SELECTOR_INVALID'],
    ['toBeVisible can be only used with Locator object FAKE_TRACE_PRIVATE_TOKEN','EXPECT_LOCATOR_REQUIRED'],
    ['Target page, context or browser has been closed FAKE_TRACE_PRIVATE_TOKEN','BROWSER_CLOSED'],
    ['Execution context was destroyed FAKE_TRACE_PRIVATE_TOKEN','CONTEXT_DESTROYED'],
    ['Protocol error FAKE_TRACE_PRIVATE_TOKEN','PROTOCOL_ERROR']]) {
    const result=privateDiagnostics(message,null);
    assert.ok(result.codes.includes(code));assert.equal(JSON.stringify(result).includes('FAKE_TRACE_PRIVATE_TOKEN'),false);
  }
});

test('trace distinguishes configured timeout from observed fixed-locator expect results without raw values', () => {
  const before={type:'before',class:'Frame',method:'expect',callId:'FAKE_PRIVATE_CALL',startTime:100,
    params:{selector:'internal:testid=[data-testid="landing-screen"s]',expression:'to.be.visible',timeout:5000,timeoutForLogs:5000}};
  const after={type:'after',callId:before.callId,endTime:111.4,error:{name:'Expect',message:'FAKE_TRACE_PRIVATE_TOKEN'},
    result:{matches:false,timedOut:false,received:{value:'FAKE_TRACE_PRIVATE_TOKEN'}}};
  const result=smokeTraceEvents(traceLines([before,after]),[]);
  assert.deepEqual(smokeTraceExpectFacts([before,after]),{traceExpectCalls:1,traceExpectTimeoutMs:5000,traceExpectLogTimeoutMs:5000,
    traceExpectMatches:0,traceExpectTimedOut:0,traceExpectReceivedOrdinal:3,traceExpectErrorOrdinal:1,traceExpectDurationMs:11});
  const safe=publicSummary(binding,[{id:'install',status:'FAIL',exitCode:1,elapsedMs:1,invocationSHA:digest,reportSHA:digest,diagnostic:result}],{source:digest,lock:digest});
  assert.equal(safe.phases[0].diagnostic.metrics.traceExpectMatches,0);assert.equal(JSON.stringify(safe).includes('PRIVATE'),false);
  assert.deepEqual(smokeTraceExpectFacts([{...before,params:{...before.params,selector:'FAKE_PRIVATE_SELECTOR'}},after]),{traceExpectCalls:0});
  assert.equal(smokeTraceExpectFacts(Array(100).fill(before)).traceExpectCalls,1);
  const next={...before,callId:'second'}, missing={type:'after',callId:'second',endTime:112};
  assert.equal(smokeTraceExpectFacts([before,after,next,missing]).traceExpectMatches,undefined);
  for(const [value,ordinal] of [[{s:'visible'},1],[{s:'hidden'},2],[{s:'FAKE_TRACE_PRIVATE_TOKEN'},3],
    [{v:'undefined'},0],[{n:42},3],[{s:'visible',raw:'FAKE_TRACE_PRIVATE_TOKEN'},3],['visible',3],[undefined,0]]) {
    const facts=smokeTraceExpectFacts([before,{...after,result:{matches:false,received:{value}}}]);
    assert.equal(facts.traceExpectReceivedOrdinal,ordinal);assert.equal(JSON.stringify(facts).includes('PRIVATE'),false);
  }
  assert.equal(privateDiagnostics('expect.toBeVisible with timeout 5000ms; FAKE_TRACE_PRIVATE_TOKEN',null).codes.includes('TEST_TIMEOUT'),false);
  for(const text of ['Timed out 5000ms','Test timeout of 60000ms exceeded','Timeout: 5000ms','Timeout 5000ms exceeded'])
    assert.ok(privateDiagnostics(text,null).codes.includes('TEST_TIMEOUT'));
});

test('renderer crash protocol signals stay finite and never expose captured protocol content', () => {
  for(const line of ['pw:protocol RECV {"method":"Inspector.targetCrashed","private":"FAKE_TRACE_PRIVATE_TOKEN"}',
    'pw:api Page crashed FAKE_TRACE_PRIVATE_TOKEN','pw:browser [pid=123][err] Received signal 11 FAKE_TRACE_PRIVATE_TOKEN']) {
    const diagnostic=privateDiagnostics(line,null);
    assert.ok(diagnostic.codes.includes('BROWSER_RENDERER_CRASH'));
    const safe=publicSummary(binding,[{id:'install',status:'FAIL',exitCode:1,elapsedMs:1,invocationSHA:digest,reportSHA:digest,diagnostic}],{source:digest,lock:digest});
    assert.equal(safe.overallStatus,'FAIL');assert.ok(safe.phases[0].diagnostic.codes.includes('BROWSER_RENDERER_CRASH'));
    assert.equal(JSON.stringify(safe).includes('PRIVATE'),false);
  }
  assert.equal(privateDiagnostics('Target.detachedFromTarget on normal cleanup',null).codes.includes('BROWSER_RENDERER_CRASH'),false);
  assert.equal(privateDiagnostics('pw:protocol RECV {"id":1,"result":{"body":"Inspector.targetCrashed"}}',null).codes.includes('BROWSER_RENDERER_CRASH'),false);
  for(const line of ['pw:protocol RECV {"id":1,"result":{"method":"Inspector.targetCrashed"}}',
    'pw:protocol SEND {"method":"Inspector.targetCrashed"}',
    'pw:protocol RECV {"id":1,"result":{"body":"pw:api Page crashed"}}',
    'pw:protocol RECV {"id":1,"result":{"body":"pw:browser Received signal 11"}}',
    'pw:protocol RECV {"id":1,"result":{"body":"\\\"method\\\":\\\"Inspector.targetCrashed\\\""}}'])
    assert.equal(privateDiagnostics(line,null).codes.includes('BROWSER_RENDERER_CRASH'),false);
});

test('protocol source strings do not become application errors and only top-level crash facts survive', () => {
  const payload='pw:protocol SEND '+JSON.stringify({method:'Runtime.callFunctionOn',params:{functionDeclaration:'TypeError ReferenceError Timed out FAKE_PRIVATE'}});
  const nested='pw:protocol RECV '+JSON.stringify({id:1,result:{method:'Target.targetCrashed',params:{errorCode:99}}});
  const clean=privateDiagnostics(payload+'\n'+nested,null);
  for(const code of ['TYPE_ERROR','REFERENCE_ERROR','TEST_TIMEOUT','BROWSER_RENDERER_CRASH']) assert.equal(clean.codes.includes(code),false);
  const event='2026-10-17T00:00:00Z pw:protocol RECV ◀ '+JSON.stringify({method:'Target.targetCrashed',params:{status:'crashed',errorCode:139,targetId:'FAKE_PRIVATE'}});
  const marker='PROJECT_SMOKE_FAILED_STEP {}';
  const observed=privateDiagnostics(event+'\n'+marker+'\npw:browser [pid=123][err] Received signal 11 FAKE_PRIVATE',null);
  assert.equal(observed.metrics.browserTargetCrashStatusOrdinal,1); assert.equal(observed.metrics.browserTargetCrashErrorCode,139);
  assert.equal(observed.metrics.browserCrashBeforeFailedStep,undefined); assert.equal(observed.metrics.browserCrashSignal,11);
  assert.equal(privateDiagnostics(marker+'\n'+event,null).metrics.browserCrashBeforeFailedStep,undefined);
  const safe=publicSummary(binding,[{id:'install',status:'FAIL',exitCode:1,elapsedMs:1,invocationSHA:digest,reportSHA:digest,diagnostic:observed}],{source:digest,lock:digest});
  assert.equal(safe.overallStatus,'FAIL'); assert.equal(safe.phases[0].diagnostic.metrics.browserTargetCrashErrorCode,139);
  assert.equal(JSON.stringify(safe).includes('PRIVATE'),false);
  const unknown=privateDiagnostics('pw:protocol RECV '+JSON.stringify({method:'Target.targetCrashed',params:{status:'FAKE_PRIVATE',errorCode:-1}}),null);
  assert.equal(unknown.metrics.browserTargetCrashStatusOrdinal,undefined); assert.equal(unknown.metrics.browserTargetCrashErrorCode,undefined);
});

test('static browser runtime control has strict finite facts and cannot replace failed application acceptance', () => {
  const record={schemaVersion:'pos-browser-runtime-control-v1',stage:9,crashed:0,complete:1,cleanup:1};
  const line=value=>'PROJECT_BROWSER_RUNTIME_CONTROL '+JSON.stringify(value);
  const diagnostic=privateDiagnostics(line(record),null);
  assert.equal(diagnostic.metrics.browserProbeComplete,1); assert.equal(diagnostic.metrics.browserProbeStageOrdinal,9);
  const safe=publicSummary(binding,[{id:'install',status:'FAIL',exitCode:1,elapsedMs:1,invocationSHA:digest,reportSHA:digest,diagnostic}],{source:digest,lock:digest});
  assert.equal(safe.overallStatus,'FAIL');
  for(const bad of [{...record,raw:'FAKE_PRIVATE'},{...record,stage:10},{...record,crashed:1},{...record,stage:8},{...record,complete:2}])
    assert.equal(privateDiagnostics(line(bad),null).metrics.browserProbeComplete,undefined);
  assert.equal(privateDiagnostics(line(record)+'\n'+line(record),null).metrics.browserProbeComplete,undefined);
  assert.equal(privateDiagnostics('pw:browser [err] '+line(record),null).metrics.browserProbeComplete,undefined);
  const failed=privateDiagnostics(line({...record,stage:8,crashed:1,complete:0}),null);
  assert.equal(failed.metrics.browserProbeStageOrdinal,8); assert.equal(failed.metrics.browserProbeCrashed,1);
});

test('static browser control refuses attribution while previous cgroup processes or descendants remain', () => {
  assert.equal(browserRuntimeControlCanStart('123\n','nr_descendants 0\nnr_dying_descendants 0\n',123),true);
  for(const [procs,stat] of [['123\n124\n','nr_descendants 0'],['123\n','nr_descendants 1'],['123\n',''],['','nr_descendants 0'],['0123','nr_descendants 0']])
    assert.equal(browserRuntimeControlCanStart(procs,stat,123),false);
});

test('actual debug formatter CR prefixes and colored duration suffixes preserve crash facts without source-string errors', () => {
  for (const colored of [false,true]) {
    const prefix=colored?'\u001b[32m  pw:protocol\u001b[0m ':'2026-10-17T00:00:00.000Z pw:protocol ';
    const suffix=colored?' \u001b[32m+0ms\u001b[0m':'';
    const send=prefix+'SEND ► '+JSON.stringify({method:'Runtime.callFunctionOn',params:{functionDeclaration:'TypeError ReferenceError Timed out FAKE_PRIVATE'}})+suffix;
    const receive=prefix+'◀ RECV '+JSON.stringify({method:'Inspector.targetCrashed',params:{}})+suffix;
    const observed=privateDiagnostics('\r'+send+'\r\n'+receive+'\rPROJECT_SMOKE_FAILED_STEP {}',null);
    for(const code of ['TYPE_ERROR','REFERENCE_ERROR','TEST_TIMEOUT']) assert.equal(observed.codes.includes(code),false);
    assert.equal(observed.metrics.browserInspectorCrashObserved,1); assert.equal(observed.metrics.browserCrashBeforeFailedStep,undefined);
    assert.equal(privateDiagnostics(receive+' FAKE_PRIVATE',null).metrics.browserInspectorCrashObserved,undefined);
  }
});

test('partial browser control progress survives forced timeout without inventing completion or cleanup', () => {
  const stages=n=>Array.from({length:n},(_,i)=>'PROJECT_BROWSER_RUNTIME_STAGE '+(i+1)).join('\n');
  const partial=privateDiagnostics(stages(8)+'\nPROJECT_BROWSER_RUNTIME_FAILURE 1\nPROJECT_BROWSER_RUNTIME_CRASH 1\n',null).metrics;
  assert.equal(partial.browserProbeStageOrdinal,8); assert.equal(partial.browserProbeFailureNameOrdinal,1); assert.equal(partial.browserProbeCrashed,1);
  assert.equal(partial.browserProbeComplete,undefined); assert.equal(partial.browserProbeCleanup,undefined);
  for(const raw of ['PROJECT_BROWSER_RUNTIME_STAGE 2',stages(2)+'\nPROJECT_BROWSER_RUNTIME_STAGE 2',stages(9)+'\nPROJECT_BROWSER_RUNTIME_STAGE 10',
    stages(2)+'\nPROJECT_BROWSER_RUNTIME_FAILURE 9',stages(2)+'\nPROJECT_BROWSER_RUNTIME_CRASH FAKE_PRIVATE'])
    assert.equal(privateDiagnostics(raw,null).metrics.browserProbeStageOrdinal,undefined);
  const final={schemaVersion:'pos-browser-runtime-control-v1',stage:9,crashed:0,complete:1,cleanup:1};
  assert.equal(privateDiagnostics(stages(9)+'\nPROJECT_BROWSER_RUNTIME_CONTROL '+JSON.stringify(final),null).metrics.browserProbeComplete,1);
  assert.equal(privateDiagnostics(stages(8)+'\nPROJECT_BROWSER_RUNTIME_CONTROL '+JSON.stringify(final),null).metrics.browserProbeComplete,undefined);
});

test('native browser fatal diagnostics export known source ordinals and numeric facts without paths or messages', () => {
  const lines=['2026 pw:browser [pid=123][err] # Fatal error in ../../v8/src/base/platform/platform-posix.cc, line 42',
    '2026 pw:browser [pid=123][err] # Check failed: mmap reserve virtual address space FAKE_PRIVATE',
    '2026 pw:browser [pid=123][err] native stack FAKE_PRIVATE'];
  const diagnostic=privateDiagnostics(lines.join('\n'),null);
  assert.equal(diagnostic.metrics.browserNativeFatalSourceOrdinal,1);assert.equal(diagnostic.metrics.browserNativeFatalLine,42);
  assert.equal(diagnostic.metrics.browserNativeFatalReasonMask,1+4+2048);
  const safe=publicSummary(binding,[{id:'install',status:'FAIL',exitCode:1,elapsedMs:1,invocationSHA:digest,reportSHA:digest,diagnostic}],{source:digest,lock:digest});
  assert.equal(JSON.stringify(safe).includes('PRIVATE'),false);assert.equal(JSON.stringify(safe).includes('platform-posix'),false);
  const native=privateDiagnostics('pw:browser [pid=1][err] [123:456:1017/090000:FATAL:sandbox_linux.cc:123] Check failed: operation not permitted',null);
  assert.equal(native.metrics.browserNativeFatalSourceOrdinal,16);assert.equal(native.metrics.browserNativeFatalLine,123);
  for(const text of ['FATAL:platform-posix.cc:42 FAKE_PRIVATE','pw:protocol RECV '+JSON.stringify({result:{body:lines[0]}}),
    'pw:browser [pid=1][err] [123:456:ERROR:CONSOLE:1] "# Fatal error in platform-posix.cc, line 42"'])
    assert.equal(privateDiagnostics(text,null).metrics.browserNativeFatalObserved,undefined);
  const unknown=privateDiagnostics('pw:browser [pid=1][err] # Fatal error in ../../FAKE_PRIVATE.cc, line 43',null);
  assert.equal(unknown.metrics.browserNativeFatalObserved,1);assert.equal(unknown.metrics.browserNativeFatalSourceOrdinal,undefined);
});

test('target crash markers expose only finite status and exit code for the static control', () => {
  const base='PROJECT_BROWSER_RUNTIME_STAGE 1\nPROJECT_BROWSER_RUNTIME_STAGE 2\n';
  const diagnostic=privateDiagnostics(base+'PROJECT_BROWSER_RUNTIME_TARGET_CRASH 1 133',null);
  assert.equal(diagnostic.metrics.browserProbeTargetStatusOrdinal,1);assert.equal(diagnostic.metrics.browserProbeTargetErrorCode,133);
  for(const value of ['1 -1','5 133','1 65536','1 133 FAKE_PRIVATE','1 133\nPROJECT_BROWSER_RUNTIME_TARGET_CRASH 1 133'])
    assert.equal(privateDiagnostics(base+'PROJECT_BROWSER_RUNTIME_TARGET_CRASH '+value,null).metrics.browserProbeTargetErrorCode,undefined);
});

test('real unzip streams only owned failed trace JSONL and never extracts resource files', () => {
  const root=mkdtempSync(join(tmpdir(),'pos-trace-')), folder=join(root,'test-results','case');mkdirSync(folder,{recursive:true});
  const file=join(folder,'trace.zip'), source='src/app/App.tsx';
  writeFileSync(file,storedTraceZip({'0-trace.trace':traceLines([{type:'console',messageType:'error',text:'ReferenceError FAKE_TRACE_PRIVATE_TOKEN'}]),
    '0-trace.network':traceLines([{type:'resource-snapshot',snapshot:{response:{status:500}}}]),'resources/private.txt':'FAKE_TRACE_PRIVATE_TOKEN'}));
  const calls=[], unzip=process.platform==='win32'?'D:/Git/usr/bin/unzip.exe':'unzip';
  const result=smokeTraceDiagnostics(traceReport(file),root,[source],(command,args,options)=>{
    assert.equal(command,'unzip');calls.push(args);return execFileSync(unzip,args,options);
  });
  assert.equal(result.metrics.traceReadable,1);assert.equal(result.metrics.traceConsoleErrors,1);assert.equal(result.metrics.traceHttp5xx,1);
  assert.deepEqual(result.codes,['JS_REFERENCE_ERROR']);assert.equal(calls.length,3);
  assert.deepEqual(calls.slice(1),[['-p',file,'0-trace.trace'],['-p',file,'0-trace.network']]);
  assert.equal(existsSync(join(folder,'resources')),false);assert.equal(JSON.stringify(result).includes('FAKE_TRACE_PRIVATE_TOKEN'),false);
});

test('real unzip preserves JSONL boundaries after Playwright test.trace without a final newline', () => {
  const root=mkdtempSync(join(tmpdir(),'pos-trace-boundary-')), folder=join(root,'test-results','case');mkdirSync(folder,{recursive:true});
  const file=join(folder,'trace.zip'), secret='FAKE_TRACE_PRIVATE_TOKEN';
  const runner=JSON.stringify({type:'context-options',origin:'testRunner',version:8,playwrightVersion:'1.60.0',browserName:''});
  const library=traceLines([{type:'console',messageType:'error',text:`ReferenceError ${secret}`}]).trimEnd();
  const network=JSON.stringify({type:'resource-snapshot',snapshot:{response:{status:503}}});
  writeFileSync(file,storedTraceZip({'test.trace':runner,'0-trace.trace':library,'0-trace.network':network}));
  const unzip=process.platform==='win32'?'D:/Git/usr/bin/unzip.exe':'unzip';
  assert.throws(()=>smokeTraceEvents(execFileSync(unzip,['-p',file,'test.trace','0-trace.trace','0-trace.network'],{encoding:'utf8'}),[]));
  const result=smokeTraceDiagnostics(traceReport(file),root,[],(_command,args,options)=>execFileSync(unzip,args,options));
  assert.equal(result.metrics.traceReadable,1);assert.equal(result.metrics.traceContextCount,2);
  assert.equal(result.metrics.traceConsoleErrors,1);assert.equal(result.metrics.traceHttp5xx,1);
  assert.deepEqual(result.codes,['JS_REFERENCE_ERROR']);assert.equal(JSON.stringify(result).includes(secret),false);
});

test('separate trace members retain aggregate decoded bounds and reject malformed member JSON', () => {
  const root=mkdtempSync(join(tmpdir(),'pos-trace-total-')), folder=join(root,'test-results');mkdirSync(folder);
  const file=join(folder,'trace.zip');writeFileSync(file,'fake owned zip');
  const big=' '.repeat(8*1024**2), optionsSeen=[];
  const over=smokeTraceDiagnostics(traceReport(file),root,[],(_command,args,options)=>{
    if(args[0]==='-Z1')return 'test.trace\n0-trace.trace\n';optionsSeen.push(options);return big;
  });
  assert.deepEqual(over.codes,['TRACE_UNAVAILABLE']);assert.equal(over.metrics.traceRefusalOrdinal,8);
  assert.ok(optionsSeen.every(options=>options.timeout>0&&options.timeout<=10000));
  assert.ok(optionsSeen[1].maxBuffer<optionsSeen[0].maxBuffer);
  const bad=smokeTraceDiagnostics(traceReport(file),root,[],(_command,args)=>
    args[0]==='-Z1'?'test.trace\n0-trace.trace\n':args[2]==='test.trace'?'not JSON':traceLines([]));
  assert.deepEqual(bad.codes,['TRACE_UNAVAILABLE']);assert.equal(bad.metrics.traceRefusalOrdinal,8);
});

test('missing, outside, duplicate, corrupt or oversized trace data remains unavailable and cannot change failure', () => {
  const root=mkdtempSync(join(tmpdir(),'pos-trace-refuse-')), folder=join(root,'test-results');mkdirSync(folder);
  const file=join(folder,'trace.zip');writeFileSync(file,'not a zip');
  const unavailable=(actual,ordinal)=>{
    assert.deepEqual(actual.codes,['TRACE_UNAVAILABLE']);assert.deepEqual(actual.failedFiles,[]);
    assert.equal(actual.metrics.traceRefusalOrdinal,ordinal);assert.equal(JSON.stringify(actual).includes('FAKE_TRACE_PRIVATE_TOKEN'),false);
  };
  const never=()=>{throw new Error('FAKE_TRACE_PRIVATE_TOKEN');};
  unavailable(smokeTraceDiagnostics(null,root,[],never),2);
  unavailable(smokeTraceDiagnostics(traceReport(join(root,'outside.zip')),root,[],never),3);
  const duplicate=traceReport(file);duplicate.suites[0].specs[0].tests[0].results[0].attachments.push({name:'trace',contentType:'application/zip',path:file});
  unavailable(smokeTraceDiagnostics(duplicate,root,[],never),2);
  const unzip=process.platform==='win32'?'D:/Git/usr/bin/unzip.exe':'unzip';
  unavailable(smokeTraceDiagnostics(traceReport(file),root,[],(_command,args,options)=>execFileSync(unzip,args,options)),5);
  for(const data of ['not json\n','{}\n'.repeat(10001),'x'.repeat(16*1024**2+1)])
    unavailable(smokeTraceDiagnostics(traceReport(file),root,[],(_command,args)=>args[0]==='-Z1'?'0-trace.trace\n':data),8);
  for(const delta of [{version:7},{playwrightVersion:'1.59.0'},{browserName:'firefox'}])
    assert.throws(()=>smokeTraceEvents(JSON.stringify({type:'context-options',version:8,playwrightVersion:'1.60.0',browserName:'chromium',...delta}),[]));
  unavailable(smokeTraceDiagnostics(traceReport(file),root,[],()=> '../private.trace\n'),6);
});

test('trace refusal stages and known locator outcomes stay finite in public diagnostics', () => {
  const root=mkdtempSync(join(tmpdir(),'pos-trace-stages-')), folder=join(root,'test-results');mkdirSync(folder);
  const file=join(folder,'trace.zip');writeFileSync(file,'fake owned zip');
  const wrong=JSON.stringify({type:'context-options',origin:'library',version:7,playwrightVersion:'1.59.2',browserName:'chromium'})+'\n';
  const diagnostic=smokeTraceDiagnostics(traceReport(file),root,[],(_command,args)=>args[0]==='-Z1'?'0-trace.trace\n':wrong);
  assert.equal(diagnostic.metrics.traceRefusalOrdinal,9);assert.equal(diagnostic.metrics.traceContextVersion,7);
  assert.equal(diagnostic.metrics.traceVersionMinor,59);assert.equal(diagnostic.metrics.traceBrowserOrdinal,1);
  const timed=smokeTraceDiagnostics(traceReport(file),root,[],()=>{throw Object.assign(new Error('FAKE_TRACE_PRIVATE_TOKEN'),{code:'ETIMEDOUT',raw:'FAKE_TRACE_PRIVATE_TOKEN'});});
  assert.equal(timed.metrics.traceRefusalOrdinal,5);assert.equal(timed.metrics.traceToolTimedOut,1);
  const safe=publicSummary(binding,[{id:'install',status:'FAIL',exitCode:1,elapsedMs:1,invocationSHA:digest,reportSHA:digest,
    diagnostic:{...timed,metrics:{...timed.metrics,raw:'FAKE_TRACE_PRIVATE_TOKEN'}}}],{source:digest,lock:digest});
  assert.equal(safe.overallStatus,'FAIL');assert.equal(safe.phases[0].diagnostic.metrics.traceToolTimedOut,1);
  assert.equal(JSON.stringify(safe).includes('FAKE_TRACE_PRIVATE_TOKEN'),false);
  assert.ok(privateDiagnostics('Received: <element(s) not found>',null).codes.includes('LOCATOR_NOT_FOUND'));
  assert.ok(privateDiagnostics('Received: hidden',null).codes.includes('LOCATOR_HIDDEN'));
});

test('temporary core handler is restored after success, action failure and failed setup; unsafe cleanup keeps it disabled', () => {
  const original='|/private/FAKE_UNIT_HANDLER\n';
  const fake=()=>{const state={value:original,writes:[],actions:0};return {state,
    read:()=>state.value,write:value=>{state.writes.push(value);state.value=value;}};};
  const success=fake();assert.equal(withLightCorePattern(success,()=>{success.state.actions++;return 17;}),17);
  assert.deepEqual(success.state.writes,['core\n',original]);assert.equal(success.state.value,original);
  const failed=fake();assert.throws(()=>withLightCorePattern(failed,()=>{throw new Error('ACTION_FAILED');}),{message:'ACTION_FAILED'});
  assert.equal(failed.state.value,original);
  const setup=fake(),write=setup.write;setup.write=value=>{write(value);if(value==='core\n')setup.state.value='wrong\n';};
  assert.throws(()=>withLightCorePattern(setup,()=>{setup.state.actions++;}),{message:'PROJECT_CI_CORE_PATTERN_INVALID'});
  assert.equal(setup.state.actions,0);assert.equal(setup.state.value,original);
  const unsafe=fake();unsafe.beforeRestore=()=>{throw new Error('PROJECT_CI_CORE_PATTERN_RESTORE_FAILED');};
  assert.throws(()=>withLightCorePattern(unsafe,()=>0),{message:'PROJECT_CI_CORE_PATTERN_RESTORE_FAILED'});
  assert.equal(unsafe.state.value,'core\n');
  const invalid=fake();invalid.read=()=> 'bad\nsecond\n';
  assert.throws(()=>withLightCorePattern(invalid,()=>0));assert.equal(invalid.state.writes.length,0);
});

test('browser setup signatures become finite diagnostics without exporting private output', () => {
  const result=privateDiagnostics('browserType.launch: FAKE_UNIT_SECRET https://private.example\nHost system is missing dependencies\nNo usable sandbox\nchrome_crashpad_handler: --database is required\nsignal=SIGILL',null);
  for(const code of ['BROWSER_LAUNCH','BROWSER_DEPENDENCIES','BROWSER_SANDBOX','BROWSER_CRASHPAD','BROWSER_EXECUTION'])assert.ok(result.codes.includes(code));
  assert.equal(JSON.stringify(result).includes('FAKE_UNIT_SECRET'),false);
  assert.equal(JSON.stringify(result).includes('private.example'),false);
  for(const code of ['RESOURCE_CORE_PATTERN','RESOURCE_HOST_GROWTH'])assert.equal(guardFailureCode({code}),code);
});

test('smoke timeout exposes only finite API stage and a known failing source location', () => {
  const messages = ['browser.newContext:', 'browserContext.newPage:', 'page.goto:', 'locator.click:',
    'expect(locator).toBeVisible()', 'while setting up "page"', 'while tearing down "context"'];
  const codes = ['BROWSER_CONTEXT', 'BROWSER_PAGE', 'PAGE_NAVIGATION', 'LOCATOR_ACTION', 'ASSERTION_VISIBLE', 'FIXTURE_SETUP', 'FIXTURE_TEARDOWN'];
  for (const [i, message] of messages.entries()) {
    const report = { suites: [{ specs: [{ file: 'pos-cafe.spec.ts', line: 119, tests: [{ projectName: 'desktop',
      results: [{ status: 'timedOut', error: { message: message + ' FAKE_PRIVATE_TOKEN https://private.example',
        stack: 'at /private/source/tests/smoke/pos-cafe.spec.ts:121:14' } }] }] }] }] };
    const info = privateDiagnostics('', report, ['tests/smoke/pos-cafe.spec.ts'], '/private/source');
    assert.ok(info.codes.includes(codes[i]));
    assert.equal(info.metrics.smokeFailureLine, 121); assert.equal(info.metrics.smokeFailureColumn, 14);
    const safe = publicSummary(binding, [{ id: 'install', status: 'FAIL', elapsedMs: 1, exitCode: 1,
      invocationSHA: digest, reportSHA: digest, diagnostic: info }], { source: digest, lock: digest });
    assert.equal(safe.phases[0].diagnostic.metrics.smokeFailureLine, 121);
    for (const secret of ['FAKE_PRIVATE_TOKEN', 'private.example', '/private/source']) assert.equal(JSON.stringify(safe).includes(secret), false);
    assert.equal(privateDiagnostics('', report, []).metrics.smokeFailureLine, undefined);
    report.suites[0].specs[0].tests[0].results[0].error.stack = 'at /private/source/tests/smoke/pos-cafe.spec.ts:1000001:14';
    assert.equal(privateDiagnostics('', report, ['tests/smoke/pos-cafe.spec.ts'], '/private/source').metrics.smokeFailureLine, undefined);
  }
});

test('shared core adapter rejects arbitrary units and requires zero limits plus non-piped pattern', () => {
  const limits='Max core file size        0                    0                    bytes';
  assert.equal(coreDumpDisabled(limits,'core\n'),true);
  assert.equal(coreDumpDisabled(limits,'|handler\n'),false);
  assert.equal(coreDumpDisabled(limits.replace(/0/g,'unlimited'),'core\n'),false);
  for(const unit of ['pos-cafe-light-r123-a1.service','pos-cafe-ci1-r123-a1.service']) assert.equal(typeof linuxCorePatternAdapter(unit).beforeRestore,'function');
  for(const unit of ['ssh.service','pos-cafe-ci1-r123-a1.service\n','../arbitrary']) assert.throws(()=>linuxCorePatternAdapter(unit));
});

test('failure reporter retains only the terminal error step and finite fields, without raw data', t => {
  const f=t02Fixture(), error=t02Error(122), step={title:'expect.toBeVisible',category:'expect',duration:5000,
    error:{...error,message:"FAKE_PRIVATE_TOKEN\nLocator: getByTestId('landing-screen')"}};
  f.result.errors=[{location:{file:f.file,line:122,column:3},message:step.error.message}];f.result.error=step.error;
  const lines=[];t.mock.method(console,'log',line=>lines.push(line));
  const reporter=new SmokeFailureReporter();reporter.onBegin({rootDir:'/source/tests/smoke'});
  const testCase=t02TestCase(f);const reported={...f.result,errors:[step.error]};reporter.onTestBegin(testCase,reported);
  reporter.onStepEnd(testCase,reported,{...step,error:undefined});reporter.onStepEnd(testCase,reported,step);
  assert.equal(lines.length,0);reporter.onTestEnd(testCase,reported);assert.equal(reporter.onEnd,undefined);
  const info=privateDiagnostics(lines.join('\n'),f.report,f.files,'/source');
  assert.equal(info.metrics.smokeFailureLine,122);assert.equal(info.metrics.smokeStepSourceOrdinal,1);
  assert.equal(info.metrics.smokeStepLocatorOrdinal,1);assert.equal(info.metrics.smokeStepCategoryOrdinal,2);
  assert.equal(info.metrics.smokeStepApiOrdinal,7);assert.equal(info.metrics.smokeStepDurationMs,5000);
  const safe=publicSummary(binding,[{id:'install',status:'FAIL',elapsedMs:1,exitCode:1,invocationSHA:digest,reportSHA:digest,diagnostic:info}],{source:digest,lock:digest});
  assert.equal(safe.overallStatus,'FAIL');assert.equal(safe.schemaVersion,'pos-cafe-light-ci-v2');
  for(let i=0;i<40;i++){const r={...f.result,errors:[step.error]};reporter.onTestBegin(testCase,r);reporter.onStepEnd(testCase,r,step);reporter.onTestEnd(testCase,r);}
  assert.equal(lines.length,32);assert.equal(reporter.buffers.size,0);
  for(const secret of ['FAKE_PRIVATE_TOKEN','/source',process.cwd()])assert.equal(JSON.stringify(safe).includes(secret)||lines.join('\n').includes(secret),false);
  const unknown=smokeStepDiagnostic({...step,title:'FAKE_PRIVATE_TOKEN',category:'FAKE_PRIVATE_TOKEN',duration:Infinity,
    location:{file:'/private/unknown.ts',line:1,column:1},error:{message:"Locator: getByTestId('FAKE_PRIVATE_TOKEN')"}},'/source');
  assert.equal(unknown.file,null);assert.equal(unknown.categoryOrdinal,0);assert.equal(unknown.locatorOrdinal,0);assert.equal(unknown.durationMs,null);
});

test('core restore requires stopped unit plus recursively empty or confirmed absent cgroup', () => {
  const fake=()=>({stop:()=>({status:0}),state:()=>({load:'loaded',active:'inactive'}),populated:()=>0});
  assert.doesNotThrow(()=>stopLightUnit(fake()));
  const gone=fake();gone.stop=()=>({status:5});gone.state=()=>({load:'not-found',active:'inactive'});gone.populated=()=>null;
  assert.doesNotThrow(()=>stopLightUnit(gone));
  for(const change of [a=>{a.stop=()=>({status:1});},a=>{a.state=()=>({load:'loaded',active:'active'});a.populated=()=>null;},
    a=>{a.populated=()=>1;},a=>{a.populated=()=>{throw Object.assign(new Error(),{code:'EACCES'});};},
    a=>{a.state=()=>{throw new Error('READ_FAILED');};},a=>{a.stop=()=>{throw new Error('STOP_FAILED');};}]) {
    const a=fake();change(a);assert.throws(()=>stopLightUnit(a));
  }
});

test('source binding distinguishes tested PR merge from head and refuses mismatched SHA/event/repo', () => {
  const base = '4'.repeat(40);
  const event = { repository: { full_name: env.GITHUB_REPOSITORY, id: 1263057386 }, pull_request: { head: { sha: other }, base: { sha: base }, merge_commit_sha: sha } };
  assert.equal(sourceBinding({ ...env, GITHUB_EVENT_NAME: 'pull_request' }, event, sha, [base, other]).prHeadSHA, other);
  assert.throws(() => sourceBinding({ ...env, GITHUB_EVENT_NAME: 'pull_request' }, event, other));
  assert.throws(() => sourceBinding({ ...env, GITHUB_EVENT_NAME: 'pull_request_target' }, event, sha));
  assert.throws(() => sourceBinding(env, { after: other }, sha));
  assert.throws(() => sourceBinding({ ...env, GITHUB_REPOSITORY_ID: '1' }, event, sha));
  assert.throws(() => sourceBinding(env, { ...event, repository: {...event.repository, id:1} }, sha));
});

test('Vitest requires exact discovered file set, totals and zero pending/fail/hook errors', () => {
  const report = { numTotalTests: 1, numPassedTests: 1, numFailedTests: 0, success: true,
    testResults: [{ name: '/source/src/a.test.ts', status: 'passed', assertionResults: [{ status: 'passed' }] }] };
  assert.equal(vitestCounts(report, ['src/a.test.ts'], '/source').pass, 1);
  assert.throws(() => vitestCounts(report, ['src/a.test.ts', 'src/b.test.ts'], '/source'));
  assert.throws(() => vitestCounts({ ...report, numTotalTests: 2 }, ['src/a.test.ts'], '/source'));
  assert.throws(() => vitestCounts({ ...report, numRuntimeErrorTestSuites: 1 }, ['src/a.test.ts'], '/source'));
});

test('light tooling accounts for exactly the declared real-backend case without accepting any other skip or failure', () => {
  const manual = [{file:'tests/contracts/gates.tool.test.ts',fullName:'TC-IDEM-087/tool real backend'}];
  const report = {numTotalTests:2,numPassedTests:1,numFailedTests:0,numPendingTests:1,success:true,
    testResults:[{name:'/source/tests/contracts/gates.tool.test.ts',status:'passed',assertionResults:[
      {fullName:'pure runner gate',status:'passed'}, {fullName:manual[0].fullName,status:'pending'}]}]};
  const files = [manual[0].file];
  assert.deepEqual(vitestCounts(report,files,'/source',manual),{discovered:2,run:1,pass:1,fail:0,skip:1,manualDeferred:1});
  assert.throws(()=>vitestCounts(report,files,'/source'));
  const extra = structuredClone(report);extra.testResults[0].assertionResults[0].status='pending';
  assert.throws(()=>vitestCounts(extra,files,'/source',manual));
  const missing = structuredClone(report);missing.testResults[0].assertionResults[1].fullName='another case';
  assert.throws(()=>vitestCounts(missing,files,'/source',manual));
  const accidentalRun = structuredClone(report);accidentalRun.testResults[0].assertionResults[1].status='passed';
  assert.throws(()=>vitestCounts(accidentalRun,files,'/source',manual));
  assert.throws(()=>vitestCounts(report,files,'/source',[...manual,...manual]));
  assert.throws(()=>vitestCounts({...report,numPendingTests:0,numTodoTests:1},files,'/source',manual));
});

test('Node TAP pending/cancelled/malformed counts cannot become a pass', () => {
  const tap = '# tests 2\n# pass 2\n# fail 0\n# cancelled 0\n# skipped 0\n# todo 0\n';
  assert.equal(nodeCounts(tap).run, 2);
  assert.throws(() => nodeCounts(tap.replace('# skipped 0', '# skipped 1')));
  assert.throws(() => nodeCounts('FAKE_PRIVATE_TOKEN'));
});

const nodeFailureBlock = (location, code = 'ENOENT') => [
  'not ok 1 - FAKE_NODE_PRIVATE_TITLE', '  ---', '  duration_ms: 1', "  type: 'test'",
  '  location: ' + JSON.stringify(location), "  failureType: 'testCodeFailure'", '  error: |-',
  '    FAKE_NODE_PRIVATE_TOKEN TypeError test timed out Protocol error', '  code: ' + JSON.stringify(code),
  '  stack: |-', '    at /private/FAKE_NODE_PRIVATE_TOKEN:99:99', '  ...',
].join('\n');
const nodeTap = body => 'TAP version 13\n' + body + '\n1..1\n# tests 1\n# pass 0\n# fail 1\n# cancelled 0\n# skipped 0\n# todo 0\n';
const publicNodeDiagnostic = diagnostic => publicSummary(binding, PROJECT_PHASES.slice(0,5).map(id => ({
  id, status:id === 'node-tools' ? 'FAIL' : 'PASS', elapsedMs:1, exitCode:id === 'node-tools' ? 1 : 0,
  invocationSHA:digest, reportSHA:digest, counts:null, diagnostic:id === 'node-tools' ? diagnostic : null,
})), {source:digest,lock:digest}).phases[4].diagnostic;

test('Node TAP failures expose only tracked script location and direct finite errno, never message signatures', () => {
  const output = nodeTap(nodeFailureBlock('/source/scripts/a.test.mjs:42:7'));
  const result = privateDiagnostics(output, null, ['scripts/a.test.mjs'], '/source');
  assert.deepEqual(result, {codes:['COMMAND_FAILED','NODE_TEST_FAILURE'], metrics:{nodeFailureCount:1,
    nodeFailureLine:42,nodeFailureColumn:7,nodeFailureErrnoOrdinal:1},failedFiles:['scripts/a.test.mjs']});
  assert.deepEqual(publicNodeDiagnostic(result), result);
  assert.equal(JSON.stringify(result).includes('PRIVATE'), false);
  assert.equal(JSON.stringify(result).includes('/source'), false);
  assert.throws(() => nodeCounts(output)); // Diagnostics never replace the acceptance parser.
  const noErrno = privateDiagnostics(nodeTap(nodeFailureBlock('/source/scripts/a.test.mjs:42:7','FAKE_NODE_PRIVATE_TOKEN')),
    null,['scripts/a.test.mjs'],'/source');
  assert.equal(noErrno.metrics.nodeFailureErrnoOrdinal,undefined);
  for (const [index,code] of NODE_FAILURE_ERRNOS.entries()) assert.equal(privateDiagnostics(
    nodeTap(nodeFailureBlock('/source/scripts/a.test.mjs:42:7',code)), null,['scripts/a.test.mjs'],'/source')
    .metrics.nodeFailureErrnoOrdinal,index+1);
});

test('passing TAP fixture strings and nested fake failure records cannot label a real failure', () => {
  const body = ['# TypeError test timed out Protocol error FAKE_NODE_PRIVATE_TOKEN',
    '# PROJECT_UI_WATCH_CONTROL {"version":1,"failureStage":5}', 'ok 1 - FAKE_NODE_PRIVATE_TITLE', '  ---',
    '  duration_ms: 1', '  expected: |-', ...nodeFailureBlock('/source/scripts/a.test.mjs:42:7').split('\n').map(line=>'    '+line),
    '  ...'].join('\n');
  const result = privateDiagnostics(nodeTap(body),null,['scripts/a.test.mjs'],'/source');
  assert.deepEqual(result,{codes:['COMMAND_FAILED','REPORT_MISSING'],metrics:{},failedFiles:[]});
  assert.equal(nodeTapFailureDiagnostics('ordinary command failed FAKE_NODE_PRIVATE_TOKEN',[],'/source'),null);
  assert.deepEqual(privateDiagnostics('ordinary command failed',null),result);
});

test('truncated, malformed and untrusted TAP locations publish no failure facts', () => {
  const block = nodeFailureBlock('/source/scripts/a.test.mjs:42:7');
  for (const body of [block.replace('  ...',''), block.replace('  location:', '  location: |-\n    location:'),
    block.replace('  duration_ms: 1','  location: "/source/scripts/a.test.mjs:41:7"'),
    block.replace('  ---',' ---'), block.replace('  code: "ENOENT"','  code: 123'),
    block.replace('  error: |-','FAKE_NODE_PRIVATE_TOKEN'),
    ...['/private/scripts/a.test.mjs:42:7','/source-shadow/scripts/a.test.mjs:42:7','/source/scripts/../scripts/a.test.mjs:42:7',
      'file:///source/scripts/%2e%2e/scripts/a.test.mjs:42:7','file://private/source/scripts/a.test.mjs:42:7',
      'file:///source/scripts/a.test.mjs?FAKE_NODE_PRIVATE_TOKEN:42:7','/source/scripts/untracked.test.mjs:42:7',
      '/source/src/a.test.mjs:42:7','/source/scripts/a.test.mjs:0:7','/source/scripts/a.test.mjs:42:1000001']
      .map(location=>nodeFailureBlock(location))]) {
    const result = privateDiagnostics(nodeTap(body),null,['scripts/a.test.mjs'],'/source');
    assert.deepEqual(result,{codes:['COMMAND_FAILED','REPORT_MISSING'],metrics:{},failedFiles:[]});
    assert.equal(JSON.stringify(publicNodeDiagnostic(result)).includes('PRIVATE'),false);
  }
  assert.deepEqual(privateDiagnostics(nodeTap(block),null,[],'/source').failedFiles,[]);
});

test('nested TAP, file URLs and completed records before truncation preserve only observed source facts', () => {
  const root=join(tmpdir(),'pos-node-tap-source'), file='scripts/a.test.mjs';
  const nested=nodeFailureBlock(pathToFileURL(join(root,file)).href+':12:3').split('\n').map(line=>'    '+line).join('\n');
  const result=privateDiagnostics('TAP version 13\n# Subtest: FAKE_NODE_PRIVATE_TITLE\n'+nested+'\n'+
    nodeFailureBlock('/private/FAKE_NODE_PRIVATE_TOKEN:1:1').replace('  ...',''),null,[file],root);
  assert.deepEqual(result.metrics,{nodeFailureCount:1,nodeFailureLine:12,nodeFailureColumn:3,nodeFailureErrnoOrdinal:1});
  assert.deepEqual(result.failedFiles,[file]);
  assert.equal(JSON.stringify(result).includes('PRIVATE'),false);
  const windows=nodeTap(nodeFailureBlock('/source/scripts/a.test.mjs:12:3').replace(
    '"/source/scripts/a.test.mjs:12:3"', "'D:\\\\source\\\\scripts\\\\a.test.mjs:12:3'"));
  assert.deepEqual(privateDiagnostics(windows,null,[file],'D:/source').failedFiles,[file]);
});

test('public TAP export requires parser source provenance, finite bounds and the node-tools phase', () => {
  const result=privateDiagnostics(nodeTap(nodeFailureBlock('/source/scripts/a.test.mjs:42:7')),null,
    ['scripts/a.test.mjs','scripts/b.test.mjs'],'/source');
  result.failedFiles.push('scripts/b.test.mjs','scripts/FAKE_NODE_PRIVATE_TOKEN.test.mjs','scripts/../private.test.mjs','/private/token');
  result.metrics.raw='FAKE_NODE_PRIVATE_TOKEN';result.codes.push('FAKE_NODE_PRIVATE_TOKEN');
  const safe=publicNodeDiagnostic(result);
  assert.deepEqual(safe.failedFiles,['scripts/a.test.mjs']);assert.equal(JSON.stringify(safe).includes('PRIVATE'),false);
  assert.deepEqual(publicNodeDiagnostic({...result}),{codes:['COMMAND_FAILED'],metrics:{},failedFiles:[]});
  for (const [key,max] of Object.entries({nodeFailureCount:10000,nodeFailureLine:1000000,nodeFailureColumn:1000000,nodeFailureErrnoOrdinal:NODE_FAILURE_ERRNOS.length})) {
    const original=result.metrics[key];
    for (const value of [max+1,0,-1,1.5,'1',Infinity,NaN]) {
      result.metrics[key]=value;assert.equal(Object.hasOwn(publicNodeDiagnostic(result).metrics,key),false);
    }
    result.metrics[key]=original;
  }
  const other=publicSummary(binding,[{id:'install',status:'FAIL',elapsedMs:1,exitCode:1,invocationSHA:digest,
    reportSHA:digest,counts:null,diagnostic:result}],{source:digest,lock:digest}).phases[0].diagnostic;
  assert.deepEqual(other,{codes:['COMMAND_FAILED'],metrics:{},failedFiles:[]});
});

test('TAP diagnostics bound output, YAML bodies and the number of exported source files', () => {
  for (const output of ['TAP version 13\n'+'x'.repeat(8*1024**2),'TAP version 13\n'+'\n'.repeat(200001),
    nodeTap(nodeFailureBlock('/source/scripts/a.test.mjs:42:7').replace('  stack: |-', '    '+'x'.repeat(65537)+'\n  stack: |-'))])
    assert.deepEqual(privateDiagnostics(output,null,['scripts/a.test.mjs'],'/source').metrics,{});
  const files=Array.from({length:33},(_,i)=>`scripts/a${i}.test.mjs`);
  const result=privateDiagnostics(nodeTap(files.map(file=>nodeFailureBlock('/source/'+file+':1:1')).join('\n')),
    null,files,'/source');
  assert.equal(result.metrics.nodeFailureCount,33);assert.equal(result.failedFiles.length,32);
  assert.equal(publicNodeDiagnostic(result).failedFiles.length,32);
});

test('a real failing Node child produces the supported TAP metadata without exporting its error or title', () => {
  const root=mkdtempSync(join(tmpdir(),'pos-node-tap-diagnostics-'));mkdirSync(join(root,'scripts'));
  const file=join(root,'scripts','a.test.mjs');
  writeFileSync(file,"import test from 'node:test';\ntest('FAKE_NODE_PRIVATE_TITLE',()=>{throw Object.assign(new Error('FAKE_NODE_PRIVATE_TOKEN TypeError Protocol error'),{code:'ENOENT'});});\n");
  const childEnv={...process.env};delete childEnv.NODE_TEST_CONTEXT;
  let output;
  try { execFileSync(process.execPath,['--test','--test-reporter=tap',file],
    {cwd:root,env:childEnv,encoding:'utf8',timeout:10000,maxBuffer:1024**2,stdio:['ignore','pipe','pipe']});assert.fail('child must fail'); }
  catch(error) { assert.equal(error.status,1);output=error.stdout; }
  const result=privateDiagnostics(output,null,['scripts/a.test.mjs'],root);
  assert.deepEqual(result.failedFiles,['scripts/a.test.mjs']);assert.equal(result.metrics.nodeFailureCount,1);
  assert.equal(result.metrics.nodeFailureLine,2);assert.ok(result.metrics.nodeFailureColumn>0);
  assert.equal(result.metrics.nodeFailureErrnoOrdinal,1);assert.deepEqual(result.codes,['COMMAND_FAILED','NODE_TEST_FAILURE']);
  assert.deepEqual(publicNodeDiagnostic(result),result);assert.equal(JSON.stringify(result).includes('PRIVATE'),false);
  assert.throws(()=>nodeCounts(output));
});

test('smoke requires every project/case and exact applicability skips without retries or expected failures', () => {
  const report = { suites: [{ specs: PROJECTS.map(projectName => ({ file: 'a.ts', line: 1, title: 'case', tests: [
    { projectName, expectedStatus: 'passed', status: 'expected', results: [{ status: 'passed', retry: 0, errors: [] }] }] })) }],
    errors: [], stats: { expected: 6, skipped: 0, unexpected: 0, flaky: 0 } };
  assert.equal(smokeCounts(report, report, []).pass, 6);
  const missing = structuredClone(report); missing.suites[0].specs.pop();
  assert.throws(() => smokeCounts(missing, report, []));
  const retry = structuredClone(report); retry.suites[0].specs[0].tests[0].results[0].retry = 1;
  assert.throws(() => smokeCounts(retry, report, []));
});

test('smoke preflight requires the one original desktop case and never substitutes for full matrix', () => {
  const spec=projectName=>({file:'pos-cafe.spec.ts',line:119,title:'POS mock flow keeps primary actions visible on landscape viewports',
    tests:[{projectName,expectedStatus:'passed',status:'expected',results:[{status:'passed',retry:0,errors:[]}]}]});
  const discovery={suites:[{specs:PROJECTS.map(spec)}],errors:[]};
  const report={suites:[{specs:[spec('desktop')]}],errors:[],stats:{expected:1,unexpected:0,skipped:0,flaky:0}};
  assert.equal(smokePreflightCounts(report,discovery).pass,1);
  assert.throws(()=>smokeCounts(report,discovery,[]));
  for(const change of [r=>{r.suites[0].specs[0].line=120;},r=>{r.suites[0].specs.push(spec('desktop'));},
    r=>{r.suites[0].specs[0].tests[0].results[0].status='skipped';},r=>{r.stats.unexpected=1;},
    r=>{r.suites[0].specs[0].tests[0].results[0].retry=1;},r=>{r.errors=['FAKE_UNIT_SECRET'];}]) {
    const bad=structuredClone(report);change(bad);assert.throws(()=>smokePreflightCounts(bad,discovery));
  }
});

test('failed Playwright diagnostics expose known source locations and counts without raw errors or titles', () => {
  const report={suites:[{specs:[{file:'pos-cafe.spec.ts',line:119,title:'FAKE_UNIT_SECRET',tests:[{projectName:'desktop',results:[{
    status:'timedOut',errors:[{message:'Test timeout FAKE_UNIT_SECRET'}],error:{message:'Test timeout FAKE_UNIT_SECRET',stack:'at /source/tests/smoke/helpers.ts:19:3'}}]}]}]}],
    stats:{expected:0,unexpected:1,skipped:0,flaky:0}};
  const d=privateDiagnostics('[9/81] FAKE_UNIT_SECRET',report,['tests/smoke/pos-cafe.spec.ts','tests/smoke/helpers.ts'],'/source');
  assert.deepEqual(d.failedFiles,['tests/smoke/pos-cafe.spec.ts']);
  assert.equal(d.metrics.smokeUnexpected,1);assert.equal(d.metrics.smokeHelperLine,19);assert.equal(d.metrics.smokeTestLine,119);
  assert.equal(d.metrics.smokeFailureProjectOrdinal,1);assert.equal(d.metrics.smokeProgressIndex,undefined);
  assert.equal(JSON.stringify(d).includes('FAKE_UNIT_SECRET'),false);
  const bad=structuredClone(report);bad.suites[0].specs[0].file='../private/FAKE_UNIT_SECRET';bad.stats.unexpected=-1;
  const safe=privateDiagnostics('',bad,[]);assert.deepEqual(safe.failedFiles,[]);assert.equal(safe.metrics.smokeUnexpected,undefined);
});

test('permission light profile requires all seventeen phases, including UI calibration, without app acceptance substitutions', () => {
  assert.deepEqual(PROJECT_PHASES, ['install','build','unit','tooling','node-tools','browser',
    'runtime-reporters','edge-resolution','permission-static','permission-pg16','ui-tools','ui-remake-selftest','ui-audit-selftest','smoke-discovery','smoke-preflight','smoke','ui-selftest','ui-audit']);
  const rows=PROJECT_PHASES.map(id=>({id,status:'PASS',elapsedMs:1,exitCode:0,invocationSHA:digest,reportSHA:digest,counts:null}));
  assert.equal(publicSummary(binding,rows,{source:digest,lock:digest}).overallStatus,'PASS');
  for(const id of ['ui-selftest','ui-audit','ui-tools']) {
    assert.throws(()=>publicSummary(binding,[...rows,{...rows[0],id}],{source:digest,lock:digest}));
    assert.throws(()=>publicSummary(binding,[{...rows[0],id},...rows.slice(1)],{source:digest,lock:digest}));
  }
  for (const index of [6,7,8,12]) {
    assert.throws(()=>publicSummary(binding,rows.filter((_,i)=>i!==index),{source:digest,lock:digest}));
    const bad=structuredClone(rows);bad[index].status='FAIL';
    assert.equal(publicSummary(binding,bad,{source:digest,lock:digest}).overallStatus,'FAIL');
  }
  assert.equal(publicSummary(binding,rows.slice(0,-1),{source:digest,lock:digest}).overallStatus,'FAIL');
  const failedAudit=structuredClone(rows);failedAudit.at(-1).status='FAIL';
  assert.equal(publicSummary(binding,failedAudit,{source:digest,lock:digest}).overallStatus,'FAIL');
  const reordered=structuredClone(rows);[reordered[6],reordered[7]]=[reordered[7],reordered[6]];
  assert.throws(()=>publicSummary(binding,reordered,{source:digest,lock:digest}));
});

test('public evidence excludes arbitrary binding/count/raw fields and incomplete phase sets fail', () => {
  const rows = PROJECT_PHASES.map(id => ({ id, status: 'PASS', elapsedMs: 1, exitCode: 0, invocationSHA: digest, reportSHA: digest,
    counts: { pass: 1, raw: 'FAKE_PRIVATE_TOKEN',...(id==='edge-resolution'?{edgeResolution:edgeReceipt}:{}) } }));
  const result = publicSummary({ ...binding, raw: 'FAKE_PRIVATE_TOKEN' }, rows, { source: digest, lock: digest });
  assert.equal(result.overallStatus, 'PASS');
  assert.equal(JSON.stringify(result).includes('FAKE_PRIVATE_TOKEN'), false);
  assert.equal(publicSummary(binding, rows.slice(0, -1), { source: digest, lock: digest }).overallStatus, 'FAIL');
});

test('public native diagnostics independently reject out-of-domain numbers even without private parser',()=>{
 const limits={pg16Operation:4,pg16Step:30,pg16ErrorCodeOrdinal:21,pg16ErrorNameOrdinal:5,pg16ErrorMatcherOrdinal:8,
  pg16RunnerErrors:10000,pg16HookErrors:10000,pg16FailedTests:10000,pg16RootRemoved:1,pg16ProcessReleased:1};
 const project=metrics=>publicSummary(binding,[{id:'install',status:'FAIL',elapsedMs:1,exitCode:1,invocationSHA:digest,reportSHA:digest,
  diagnostic:{codes:['COMMAND_FAILED'],metrics,failedFiles:[]}}],{source:digest,lock:digest}).phases[0].diagnostic.metrics;
 assert.deepEqual(project(limits),limits);
 for(const [key,max]of Object.entries(limits))for(const v of[max+1,Number.MAX_SAFE_INTEGER,-1,1.5,'1',Infinity])assert.equal(Object.hasOwn(project({[key]:v}),key),false);
 assert.deepEqual(project({raw:'SECRET',pg16Step:30,pg16RootRemoved:1}),{pg16Step:30,pg16RootRemoved:1});
});
test('public UI calibration counts stay finite, numeric and separate from product acceptance', () => {
  const rows=PROJECT_PHASES.map(id=>({id,status:'PASS',elapsedMs:1,exitCode:0,invocationSHA:digest,reportSHA:digest,
    counts:{run:11,pass:11,positiveControls:5,negativeControls:6,targetControls:16,detectedFindings:23,
      productAcceptance:'FAKE_PRIVATE_TOKEN',raw:'FAKE_PRIVATE_TOKEN',...(id==='edge-resolution'?{edgeResolution:edgeReceipt}:{})}}));
  const result=publicSummary(binding,rows,{source:digest,lock:digest});
  assert.equal(result.overallStatus,'PASS');assert.equal(result.phases[7].counts.negativeControls,6);
  assert.equal(result.phases[8].counts.targetControls,16);assert.equal(JSON.stringify(result).includes('FAKE_PRIVATE_TOKEN'),false);
  for(const value of [NaN,Infinity,-1,Number.MAX_SAFE_INTEGER+1,'23']) {
    rows[8].counts.detectedFindings=value;
    assert.equal(Object.hasOwn(publicSummary(binding,rows,{source:digest,lock:digest}).phases[8].counts,'detectedFindings'),false);
  }
});

test('failed Vitest diagnostics retain known counters and source paths without raw messages or credentials', () => {
  const report = { numTotalTests: 2, numPassedTests: 1, numFailedTests: 1, numPendingTests: 0, success: false,
    secret: 'FAKE_PRIVATE_TOKEN', testResults: [{ name: '/source/src/a.test.ts', status: 'failed',
      failureMessage: 'AssertionError: FAKE_PRIVATE_TOKEN test \u001b[31mtimed\u001b[39m out' }, { name: '/private/FAKE_PRIVATE_TOKEN', status: 'failed' }] };
  const diagnostic = privateDiagnostics('FAKE_PRIVATE_TOKEN', report, ['src/a.test.ts'], '/source');
  assert.equal(diagnostic.metrics.numFailedTests, 1);
  assert.deepEqual(diagnostic.failedFiles, ['src/a.test.ts']);
  assert.ok(diagnostic.codes.includes('TEST_TIMEOUT'));
  assert.equal(JSON.stringify(diagnostic).includes('FAKE_PRIVATE_TOKEN'), false);
  const row = { id: 'install', status: 'FAIL', exitCode: 1, elapsedMs: 1, invocationSHA: digest, reportSHA: digest,
    diagnostic: { ...diagnostic, codes: [...diagnostic.codes, 'FAKE_PRIVATE_TOKEN'], metrics: { ...diagnostic.metrics, raw: 'FAKE_PRIVATE_TOKEN' } } };
  assert.equal(JSON.stringify(publicSummary(binding, [row], {source:digest,lock:digest})).includes('FAKE_PRIVATE_TOKEN'), false);
  assert.ok(privateDiagnostics('ERROR: Coverage for lines (89%) does not meet global threshold (90%)', null).codes.includes('COVERAGE_LINES'));
  const architectureReport = { testResults: [{ name: '/source/src/architectureBoundaries.test.ts', status: 'failed',
    assertionResults: [{status:'passed'}, {status:'failed', message:'FAKE_PRIVATE_TOKEN'}] }] };
  const precise = privateDiagnostics('', architectureReport, ['src/architectureBoundaries.test.ts'], '/source');
  assert.equal(precise.metrics.architectureAssertion, 2);
  assert.equal(JSON.stringify(precise).includes('FAKE_PRIVATE_TOKEN'), false);
  const passedText = {testResults:[{name:'/source/src/a.test.ts',status:'passed',assertionResults:[{status:'passed',failureMessages:['Test timed out FAKE_PRIVATE_TOKEN']}]}]};
  assert.equal(privateDiagnostics('',passedText,['src/a.test.ts'],'/source').codes.includes('TEST_TIMEOUT'), false);
});

test('fresh capture retains output privately; guard refusal stops dependent process and never echoes output', async () => {
  const root = mkdtempSync(join(tmpdir(), 'pos-ci-test-'));
  const result = await capturedCommand(process.execPath, ['-e', 'process.stdout.write("FAKE_PRIVATE_TOKEN"); process.exit(7)'],
    { cwd: root, env: process.env, output: join(root, 'out'), guard() {} });
  assert.equal(result.exitCode, 7); assert.equal(readFileSync(join(root, 'out'), 'utf8'), 'FAKE_PRIVATE_TOKEN');
  await assert.rejects(capturedCommand(process.execPath, [], { cwd: root, env: {}, output: join(root, 'blocked'), guard() { throw new Error(); } }));
  writeFileSync(join(root, 'source'), 'before'); const initial = trackedFingerprint(root, ['source']);
  writeFileSync(join(root, 'source'), 'after'); assert.notEqual(trackedFingerprint(root, ['source']), initial);
});

test('light supervisor constrains descendants and passes no credential environment', () => {
  const args = lightService({ ...env, GITHUB_TOKEN: 'FAKE_PRIVATE_TOKEN' }, '/node', '/source', 1001);
  assert.ok(args.includes('--property=User=1001'));
  assert.equal(lightOwnerMatches(1001,1001),true);assert.equal(lightOwnerMatches(0,0),false);assert.equal(lightOwnerMatches(1001,1002),false);
  for(const uid of [0,-1,1.5,NaN,'1001','1001\nUser=0']) assert.throws(()=>lightService(env,'/node','/source',uid));
  assert.ok(args.includes('--property=KillMode=control-group'));
  assert.ok(args.includes('--property=MemorySwapMax=0'));
  assert.ok(args.includes('--property=LimitCORE=0'));
  assert.equal(coreLimitDisabled('Max core file size        0        0        bytes\n'), true);
  assert.equal(coreLimitDisabled('Max core file size        0        unlimited        bytes\n'), false);
  assert.equal(coreLimitDisabled('Max core file size        unlimited        unlimited        bytes\n'), false);
  assert.equal(args.join(' ').includes('FAKE_PRIVATE_TOKEN'), false);
});

test('allocation facts deduplicate overlapping roots and hardlinks without treating logical bytes as allocated bytes', t => {
  const root=mkdtempSync(join(tmpdir(),'pos-ci-owned-'));
  t.after(()=>rmSync(root,{recursive:true,force:true}));
  writeFileSync(join(root,'core.1'),Buffer.alloc(32));linkSync(join(root,'core.1'),join(root,'core.2'));
  const facts={},bytes=allocatedBytes([root,root],facts);
  assert.equal(facts.coreFileCount,1);
  assert.equal(facts.ownedBytesAtCheckpoint,bytes);
  assert.ok(facts.coreAllocatedBytes>=0&&facts.coreAllocatedBytes<=bytes);
  assert.equal(Object.values(facts).every(Number.isSafeInteger),true);
});

test('light npm loads two separate empty configs and ignores inherited credentials', () => {
  const root = mkdtempSync(join(tmpdir(), 'pos-ci-npm-'));
  const childEnv = lightEnvironment(root, { ...process.env, GITHUB_TOKEN: 'FAKE_PRIVATE_TOKEN', NPM_TOKEN: 'FAKE_PRIVATE_TOKEN' });
  assert.notEqual(childEnv.NPM_CONFIG_USERCONFIG, childEnv.NPM_CONFIG_GLOBALCONFIG);
  assert.equal(readFileSync(childEnv.NPM_CONFIG_USERCONFIG, 'utf8'), '');
  assert.equal(readFileSync(childEnv.NPM_CONFIG_GLOBALCONFIG, 'utf8'), '');
  const npm = [join(process.execPath, '..', 'node_modules', 'npm', 'bin', 'npm-cli.js'),
    join(process.execPath, '..', '..', 'lib', 'node_modules', 'npm', 'bin', 'npm-cli.js')].find(existsSync);
  assert.ok(npm, 'npm bundled with the pinned Node runtime must exist');
  const version = execFileSync(process.execPath, [npm, '--version'], { env: childEnv, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  assert.match(version.trim(), /^\d+\.\d+\.\d+$/);
  assert.equal(JSON.stringify(childEnv).includes('FAKE_PRIVATE_TOKEN'), false);
});

test('checkout Git trusts only its exact directory and captures command errors', () => {
  const root = mkdtempSync(join(tmpdir(), 'pos-ci-git-'));
  assert.match(checkoutGit(root, ['init', '--quiet', '--initial-branch=main']), /^$/);
  assert.equal(checkoutGit(root, ['rev-parse', '--show-toplevel']).trim().replaceAll('\\', '/'), root.replaceAll('\\', '/'));
  assert.throws(() => checkoutGit(root, ['rev-parse', '--verify', 'missing']), error => Boolean(error.stderr?.length));
});

test('output overflow terminates the owned child and reusing an old capture cannot pass', async () => {
  const root = mkdtempSync(join(tmpdir(), 'pos-ci-overflow-'));
  const output = join(root, 'out');
  const result = await capturedCommand(process.execPath, ['-e', 'process.stdout.write("x".repeat(2048)); setInterval(()=>{},1000)'],
    { cwd: root, env: process.env, output, guard() {}, maxBytes: 32, timeoutMs: 2000 });
  assert.equal(result.blocked, true);
  assert.equal(result.blockCode, 'OUTPUT_LIMIT');
  await assert.rejects(capturedCommand(process.execPath, [], { cwd: root, env: process.env, output, guard() {} }));
});

test('monitor failure and timeout remain distinct finite signals without reflecting arbitrary errors', async () => {
  const root = mkdtempSync(join(tmpdir(), 'pos-ci-monitor-'));
  let calls = 0;
  const monitored = await capturedCommand(process.execPath, ['-e', 'setInterval(()=>{},1000)'], {
    cwd: root, env: process.env, output: join(root, 'monitor'), monitorMs: 20,
    guard() { if (++calls > 1) throw Object.assign(new Error('FAKE_PRIVATE_TOKEN'), { code: 'ENOENT' }); },
  });
  assert.equal(monitored.blocked, true); assert.equal(monitored.blockCode, 'GUARD_IO_ENOENT');
  assert.equal(JSON.stringify(monitored).includes('FAKE_PRIVATE_TOKEN'), false);
  const timeout = await capturedCommand(process.execPath, ['-e', 'setInterval(()=>{},1000)'], {
    cwd: root, env: process.env, output: join(root, 'timeout'), timeoutMs: 50, guard() {},
  });
  assert.equal(timeout.blockCode, 'COMMAND_TIMEOUT');
  for (const code of ['RESOURCE_FREE_SPACE', 'RESOURCE_OWNED_CAP', 'RESOURCE_CGROUP_DRIFT'])
    assert.equal(guardFailureCode({code}), code);
  assert.equal(guardFailureCode({code:'FAKE_PRIVATE_TOKEN',message:'FAKE_PRIVATE_TOKEN'}), 'GUARD_REFUSED');
  const row = { id:'install', status:'FAIL', exitCode:null, elapsedMs:1, invocationSHA:digest, reportSHA:null,
    diagnostic:{codes:['RESOURCE_FREE_SPACE','PROCESS_SIGTERM','FAKE_PRIVATE_TOKEN'],
      metrics:{minimumObservedFreeBytes:123,oomKills:1,raw:'FAKE_PRIVATE_TOKEN'},failedFiles:[]} };
  const safe = publicSummary(binding,[row],{source:digest,lock:digest});
  assert.deepEqual(safe.phases[0].diagnostic.codes,['RESOURCE_FREE_SPACE','PROCESS_SIGTERM']);
  assert.equal(safe.phases[0].diagnostic.metrics.oomKills,1);
  assert.equal(JSON.stringify(safe).includes('FAKE_PRIVATE_TOKEN'),false);
});

test('CD rejects PR/fork/failing/wrong-attempt runs and checker changes even with the same source SHA', () => {
  const input = { sourceSHA: sha, runId: '123', attempt: 1 };
  const policy = { allowedSourceBranches: ['main'], trustedFiles: { 'ci.yml': hash('trusted') } };
  const run = { repository: { full_name: env.GITHUB_REPOSITORY, id:1263057386 }, head_repository: { full_name: env.GITHUB_REPOSITORY, id:1263057386 },
    id: 123, run_attempt: 1, head_sha: sha, event: 'push', status: 'completed', conclusion: 'success', path: '.github/workflows/ci.yml', head_branch: 'main' };
  assert.equal(verifyReleaseRun(run, input, policy), true);
  for (const delta of [{ event: 'pull_request' }, { conclusion: 'failure' }, { run_attempt: 2 }, { head_repository: { full_name: 'attacker/fork' } }, { repository: {full_name:env.GITHUB_REPOSITORY,id:1} }]) {
    assert.throws(() => verifyReleaseRun({ ...run, ...delta }, input, policy));
  }
  assert.throws(() => verifyReleaseFiles({ 'ci.yml': Buffer.from('changed') }, policy));
});

test('CD requires the exact owner, branch restrictions and no admin bypass; production cannot be enabled by input/env', () => {
  const policy = { reviewers: ['nguyentronglinh045'] };
  const environment = { name: 'production', can_admins_bypass: false, deployment_branch_policy: { protected_branches: false, custom_branch_policies: true },
    protection_rules: [{ type: 'required_reviewers', prevent_self_review: false, reviewers: [{ type: 'User', reviewer: { login: 'nguyentronglinh045' } }] }] };
  assert.equal(verifyReleaseEnvironment(environment, [{ name: 'main', type: 'branch' }], policy), true);
  assert.equal(verifyReleaseEnvironment({ ...environment, name: 'Production' }, [{ name: 'main', type: 'branch' }], policy), true);
  assert.throws(() => verifyReleaseEnvironment({ ...environment, name: 'Preview' }, [{ name: 'main', type: 'branch' }], policy));
  assert.throws(() => verifyReleaseEnvironment({ ...environment, can_admins_bypass: true }, [{ name: 'main', type: 'branch' }], policy));
  assert.throws(() => verifyReleaseEnvironment(environment, [{ name: '*', type: 'branch' }], policy));
  assert.equal(PRODUCTION_ENABLED, false);
  assert.throws(() => productionCommands({ enable: true, VERCEL_TOKEN: 'FAKE_PRIVATE_TOKEN' }));
});

test('CD verifies canonical Git bytes across CRLF checkouts and rejects checker/config drift', () => {
  const root = mkdtempSync(join(tmpdir(), 'pos-ci-canonical-'));
  checkoutGit(root, ['init', '--quiet', '--initial-branch=main']);
  writeFileSync(join(root, 'checker.txt'), 'checker\r\nfixture\r\n');
  const blob = checkoutGit(root, ['-c', 'core.autocrlf=true', 'hash-object', '-w', '--path=checker.txt', 'checker.txt']).trim();
  const canonical = execFileSync('git', ['-C', root, 'cat-file', 'blob', blob], { stdio: ['ignore', 'pipe', 'pipe'] });
  assert.equal(canonical.toString(), 'checker\nfixture\n');
  const policy = { trustedFiles: { 'scripts/project-ci-results.mjs': hash(canonical), 'playwright.project-ci.config.ts': hash(canonical), 'ui-audit/audit.js': hash(canonical), 'ui-audit/demo-buggy.html': hash(canonical) } };
  const files = Object.fromEntries(Object.keys(policy.trustedFiles).map(path => [path, canonical]));
  assert.equal(verifyReleaseFiles(files, policy), true);
  for (const path of Object.keys(files)) assert.throws(() => verifyReleaseFiles({ ...files, [path]: Buffer.from('changed') }, policy));
  assert.throws(() => verifyReleaseFiles(Object.fromEntries(Object.keys(files).map(path => [path, readFileSync(join(root, 'checker.txt'))])), policy));
});

test('binding refusal reports only a finite guard and never copies private event fields', () => {
  const privateValue = 'synthetic-private-event-value';
  const event = { repository: { id: 1263057386, full_name: 'nguyentronglinh045/pos-cafe' },
    pull_request: { head: { sha }, merge_commit_sha: other, privateValue } };
  assert.throws(() => sourceBinding({ ...env, GITHUB_EVENT_NAME: 'pull_request' }, event, sha), error => {
    assert.equal(error.message, 'PROJECT_CI_RESULT_INVALID');
    assert.equal(error.bindingGuard, 4);
    assert.deepEqual(Object.keys(error), ['bindingGuard']);
    assert.equal(JSON.stringify(error).includes(privateValue), false);
    return true;
  });
  assert.throws(() => sourceBinding({ ...env, GITHUB_EVENT_NAME: 'workflow_dispatch' }, event, sha), error => error.bindingGuard === 6);
});

test('PR admission binds actual Git parents even when webhook merge SHA is stale', () => {
  const base = '4'.repeat(40), head = other;
  const event = { repository: { full_name: env.GITHUB_REPOSITORY, id: 1263057386 },
    pull_request: { head: { sha: head }, base: { sha: base }, merge_commit_sha: null } };
  const prEnv = { ...env, GITHUB_EVENT_NAME: 'pull_request' };
  for (const reportedMerge of [undefined, null, '5'.repeat(40)]) {
    const result = sourceBinding(prEnv, { ...event, pull_request: { ...event.pull_request, merge_commit_sha: reportedMerge } }, sha, [base, head]);
    assert.equal(result.sourceSHA, sha); assert.equal(result.prHeadSHA, head);
  }
  for (const parents of [undefined, [], [base], [head, base], [base, base], [base, '5'.repeat(40)], [base, head, sha]]) {
    assert.throws(() => sourceBinding(prEnv, event, sha, parents), error => error.bindingGuard === 4);
  }
  assert.throws(() => sourceBinding({ ...prEnv, GITHUB_SHA: head }, event, head, [base, head]));
  assert.throws(() => sourceBinding(prEnv, { ...event, pull_request: { ...event.pull_request, base: {} } }, sha, [base, head]));
});

test('commit parent parser reads only canonical headers, never message or signature lines', () => {
  const base = '4'.repeat(40), head = other;
  const headers = `tree ${digest.slice(0, 40)}\nparent ${base}\nparent ${head}\nauthor test\ncommitter test\ngpgsig signature\n parent ${sha}`;
  const text = headers + `\n\nmessage\nparent ${sha}\n`;
  assert.deepEqual(gitCommitParents(text), [base, head]);
  for (const value of ['', 'parent x\n\nmessage', 'parent '+head, null, 'x'.repeat(65537)+'\n\n']) assert.throws(() => gitCommitParents(value));
});

test('UI gate requires every target/viewport and rejects fresh or incomplete findings', () => {
  const cfg = { states: [{ name: 'floor' }], viewports: [{ name: 'tablet' }] };
  const output = ' ok   tablet floor 0 finding(s), 0 new\nno new UI anomalies';
  assert.equal(uiCounts(output, [], cfg).run, 1);
  assert.throws(() => uiCounts('no new UI anomalies', [], cfg));
  assert.throws(() => uiCounts(output, [{ known: false }], cfg));
});



test('backend manual guard requires confirmation, immutable workflow/source and exact allowed repositories', () => {
  assert.ok(backendInvocation({ ...env, GITHUB_EVENT_NAME: 'workflow_dispatch', CI1_CONFIRMATION: 'RUN_SYNTHETIC_PILOT' }, '/node', '/source').argv.includes('CI1_EXECUTION_AUTHORIZED=yes'));
  assert.throws(() => backendInvocation({ ...env, CI1_CONFIRMATION: 'RUN_SYNTHETIC_PILOT' }, '/node', '/source'));
  assert.equal(ci1TrustedRepository(env.GITHUB_REPOSITORY), true);
  assert.equal(ci1TrustedRepository('nguyentronglinh045/pos-cafe-ci-preflight'), true);
  assert.equal(ci1TrustedRepository('attacker/pos-cafe'), false);
});


function t02PhaseRows(id) {
  return PROJECT_PHASES.slice(0,PROJECT_PHASES.indexOf(id)).map(id=>({id,status:'PASS',exitCode:0,elapsedMs:1,invocationSHA:digest,reportSHA:digest,counts:null,diagnostic:null}));
}
function t02Phase(root,rows,overrides={}) {
  // Execute the production closure with local unit dependencies, not copied
  // fail/stop decisions. The GitHub/cgroup service itself is not run here.
  const source=readFileSync(new URL('./project-ci.mjs',import.meta.url),'utf8');
  const body=source.slice(source.indexOf('  const phase = async ('),source.indexOf('  const json = name =>'));
  assert.ok(body.startsWith('  const phase = async (')&&body.endsWith('  };\n'));
  const dependencies={root,task:root,rows,binding,fingerprints:{source:digest,lock:digest},paths:[],env:process.env,
    capturedCommand,hash,trackedFingerprint:()=>digest,guard(){},guardFacts:{},guardFailureCode,lstatSync,readFileSync,
    privateDiagnostics,join,json:name=>JSON.parse(readFileSync(join(root,name+'.json'),'utf8')),
    refuse(){throw Error('PROJECT_CI_REFUSED');},guardRefuse(){throw Error('RESOURCE_SOURCE_DRIFT');},...overrides};
  return new Function(...Object.keys(dependencies),body+'\nreturn phase;')(...Object.values(dependencies));
}

test('T02 TC13: reporter throw in a real child cannot pass collector or run later phases',async t=>{
  const root=mkdtempSync(join(tmpdir(),'t02-reporter-throw-'));t.after(()=>rmSync(root,{recursive:true,force:true}));
  const child=`import R from ${JSON.stringify(new URL('./project-ci-results.mjs',import.meta.url).href)};
    const reporter=new R(), error={message:'CONTROL',stack:'Error: CONTROL\\n at /source/spec.ts:1:1'};
    const result={status:'failed',retry:0,errors:[error]}, test={title:'control',location:{file:process.cwd()+'/spec.ts',line:1},parent:{project:()=>({name:'desktop'})}};
    reporter.onBegin({rootDir:process.cwd()});reporter.onTestBegin(test,result);
    reporter.onStepEnd(test,result,{error,title:'expect.toBe',category:'expect',duration:1});
    console.log=()=>{throw Error('REPORTER_INTERNAL_CONTROL')};reporter.onTestEnd(test,result);`;
  const rows=t02PhaseRows('smoke'),phase=t02Phase(root,rows);
  let continued=false;
  await assert.rejects(async()=>{await phase('smoke',process.execPath,['--input-type=module','--eval',child]);continued=true;},/PROJECT_CI_REFUSED/);
  assert.equal(continued,false);assert.equal(rows.at(-1).id,'smoke');assert.equal(rows.at(-1).status,'FAIL');assert.equal(rows.at(-1).exitCode,1);
  assert.match(readFileSync(join(root,'smoke.log'),'utf8'),/REPORTER_INTERNAL_CONTROL/);
  const safe=publicSummary(binding,rows,{source:digest,lock:digest});assert.equal(safe.overallStatus,'FAIL');
  assert.equal(safe.phases.some(p=>p.id==='ui-selftest'||p.id==='ui-audit'),false);
  assert.equal(JSON.stringify(safe).includes('REPORTER_INTERNAL_CONTROL'),false);assert.equal(SmokeFailureReporter.prototype.onEnd,undefined);
});

test('T02 TC19: failed desktop preflight keeps terminal attribution and trace diagnostics',async t=>{
  const root=mkdtempSync(join(tmpdir(),'t02-preflight-'));t.after(()=>rmSync(root,{recursive:true,force:true}));
  const folder=join(root,'test-results','case');mkdirSync(folder,{recursive:true});const file=join(folder,'trace.zip');
  writeFileSync(file,storedTraceZip({'0-trace.trace':traceLines([{type:'console',messageType:'error',text:'ReferenceError FAKE_TRACE_PRIVATE_TOKEN'}])}));
  const f=t02Fixture();f.result.errors[0].location.file=join(root,'tests','smoke','pos-cafe.spec.ts');
  f.result.attachments=[{name:'trace',contentType:'application/zip',path:file}];writeFileSync(join(root,'smoke-preflight.json'),JSON.stringify(f.report));
  const cgroup=join(root,'cgroup');mkdirSync(cgroup);for(const name of ['cgroup.procs','cgroup.stat'])writeFileSync(join(cgroup,name),'');
  const unzip=process.platform==='win32'?'D:/Git/usr/bin/unzip.exe':'unzip';
  const rows=t02PhaseRows('smoke-preflight'),phase=t02Phase(root,rows,{paths:f.files,cgroup,browserRuntimeControlCanStart:()=>false,
    smokeTraceDiagnostics:(report,root,files)=>smokeTraceDiagnostics(report,root,files,(_command,args,options)=>execFileSync(unzip,args,options))});
  const child='console.log('+JSON.stringify(t02Line(f))+');process.exitCode=1;';
  await assert.rejects(()=>phase('smoke-preflight',process.execPath,['--eval',child],undefined,'smoke-preflight'),/PROJECT_CI_REFUSED/);
  const diagnostic=rows.at(-1).diagnostic;assert.equal(rows.at(-1).status,'FAIL');assert.equal(diagnostic.metrics.smokeFailureLine,31);
  assert.equal(diagnostic.metrics.smokeFailureProjectOrdinal,1);assert.equal(diagnostic.metrics.smokeStepDurationMs,11);
  assert.equal(diagnostic.metrics.traceReadable,1);assert.equal(diagnostic.metrics.traceConsoleErrors,1);assert.ok(diagnostic.codes.includes('JS_REFERENCE_ERROR'));
  const safe=publicSummary(binding,rows,{source:digest,lock:digest});assert.equal(safe.overallStatus,'FAIL');
  assert.equal(safe.phases.at(-1).id,'smoke-preflight');assert.equal(safe.phases.at(-1).diagnostic.metrics.traceConsoleErrors,1);
  assert.equal(safe.phases.some(p=>p.id==='smoke'),false);assert.equal(JSON.stringify(safe).includes('FAKE_TRACE_PRIVATE_TOKEN'),false);
});
