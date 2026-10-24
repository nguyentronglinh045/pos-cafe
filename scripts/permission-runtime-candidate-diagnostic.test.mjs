import test from'node:test';
import assert from'node:assert/strict';
import{readFileSync}from'node:fs';
import{runInNewContext}from'node:vm';
import{CANDIDATE_TEST_FILE,CANDIDATE_TEST_PROJECT,CANDIDATE_TEST_NAMES,CANDIDATE_CHECKPOINT_BOUNDS,CANDIDATE_IMAGE_BOUNDS,
 CANDIDATE_DIAGNOSTIC_SCHEMA,CANDIDATE_DIAGNOSTIC_ATTACHMENT,CANDIDATE_DIAGNOSTIC_MAX_BYTES,
 candidateTestOrdinal,candidateDiagnosticAttachment,safeCandidateDiagnostic}from'./permission-runtime-candidate-diagnostic.mjs';
import{runtimePlaywrightFailureFacts,runtimeRunnerFailureFacts,assertRuntimeDiagnosticBinding,
 RUNTIME_ERROR_MATCHERS,RUNTIME_ERROR_CODES}from'./permission-runtime-error-facts.mjs';
import{runtimeStage}from'./permission-runtime-catalog.mjs';
import{runtimeHash,validateRuntimeStage}from'./permission-runtime-results.mjs';
import{t04RunnerFailureFacts,t04FailureFacts,t04SafeFailureMetric,T04_FAILURE_BOUNDS}from'./permission-runtime-t04.mjs';
import{ci1FailureExport,ci1IsolatedFailure}from'./permission-runtime-t04-worker.mjs';
import{diagnosticMarker,collectRuntimeDiagnosticFacts}from'./permission-runtime-diagnostic-transport.mjs';
const identities=CANDIDATE_TEST_NAMES.map(name=>({file:CANDIDATE_TEST_FILE,name,project:CANDIDATE_TEST_PROJECT}));
const argv=['/owned/node','/owned/playwright','test','--retries=0'];
const stage=runtimeStage('candidate-e2e'),expected={...stage,argv};
const context={sourceSHA:'a'.repeat(40),sourceFingerprint:'b'.repeat(64),lockSHA:'c'.repeat(64),
 configSHA:stage.configSHA,runId:'123',invocationSHA:runtimeHash(argv),argv};
const observation=(checkpointOrdinal,delta={})=>({checkpointOrdinal,...Object.fromEntries(Object.keys(CANDIDATE_CHECKPOINT_BOUNDS).map(key=>[key,0])),...delta});
const diagnostic=(testOrdinal=6,delta={})=>({schemaVersion:CANDIDATE_DIAGNOSTIC_SCHEMA,testOrdinal,milestoneOrdinal:17,
 observations:[observation(3,{dbReadState:1,dbSuffix:2,drawerCount:2,inputCount:1}),observation(4,{dbReadState:1,dbEqualsPreclear:2})],image:null,...delta});
const imageFacts={phaseOrdinal:2,observed:1,selectionCount:2,selectionMatches:2,imageCount:2,srcMatches:1,decoded:1};
const attachment=value=>({name:CANDIDATE_DIAGNOSTIC_ATTACHMENT,contentType:'application/json',body:Buffer.from(JSON.stringify(value))});
function reporterFixture(failures=[4,6],options={}){
 let captured;
 const source=readFileSync(new URL('./permission-runtime-playwright-reporter.mjs',import.meta.url),'utf8')
  .replace(/^import[^;]+;[\r\n]*/gm,'').replace('export default class','class');
 const vm={runtimeReporterContext:()=>({...context,sourceRoot:'/owned',stage:stage.stage,runner:'playwright'}),
  reporterFile:(_root,path)=>path.replace('/owned/',''),runtimePlaywrightFailureFacts,candidateDiagnosticAttachment,
  writeRuntimeReport:(ctx,value)=>{captured={schemaVersion:'permission-runtime-stage-v1',stage:stage.stage,runner:'playwright',...context,...value};}};
 runInNewContext(source+'\nthis.Reporter=RuntimePlaywrightReporter;',vm);
 const reporter=new vm.Reporter(),tests=identities.map(x=>({location:{file:'/owned/'+x.file},title:x.name,titlePath:()=>['a','b','c',x.name],
  retries:0,expectedStatus:'passed',annotations:[],parent:{project:()=>({name:x.project,repeatEach:1})}}));
 reporter.onBegin({repeatEach:1},{allTests:()=>tests});
 for(let i=1;i<=6;i++){
  const fail=failures.includes(i),line=i===6?391:200;
  reporter.onTestEnd(tests[i-1],{status:fail?'failed':'passed',attachments:options.attachments?.[i]??(fail&&i===6?[attachment(diagnostic())]:fail&&i===4?[attachment(diagnostic(4,{image:imageFacts}))]:[]),
   ...(fail?{error:{message:'expect(locator).toHaveValue(expected)\nExpected: PRIVATE_DIAGNOSTIC_SENTINEL\nReceived: PRIVATE_DIAGNOSTIC_SENTINEL',
    location:{file:tests[i-1].location.file,line}}}:{})});
 }
 if(options.retry)reporter.onTestEnd(tests[3],{status:'passed'});
 if(options.hook)reporter.onStepEnd(tests[5],{}, {category:'hook',error:{message:'PRIVATE_DIAGNOSTIC_SENTINEL',location:{file:tests[5].location.file,line:350}}});
 if(options.runner)reporter.onError({message:'PRIVATE_DIAGNOSTIC_SENTINEL'});
 reporter.onEnd({status:failures.length?'failed':'passed'});
 return JSON.parse(JSON.stringify(captured));
}
function pipeline(report){
 assertRuntimeDiagnosticBinding(expected,report,context);
 const facts={t04StageOrdinal:10,...t04RunnerFailureFacts(expected,report)};
 const marker=diagnosticMarker('T04_FAILURE_FACTS',facts,t04SafeFailureMetric);
 const parsed=t04FailureFacts(marker),failure=ci1FailureExport({stage:'offline-edge',operation:'PILOT_HARNESS',
  code:'COMMAND_FAILED',command:'node',exitCode:1,facts:parsed});
 const isolated=ci1IsolatedFailure({schemaVersion:'permission-ci1-isolated-failure-v1',runId:'123',attempt:1,
  sourceSHA:context.sourceSHA,failure,cleanupFailure:null},{runId:'123',attempt:1},context.sourceSHA);
 const outer=ci1FailureExport({...isolated.failure,facts:{...isolated.failure.facts,isolatedFailureSeen:1}});
 const collected=collectRuntimeDiagnosticFacts([{schemaVersion:'pos-backend-failure-v1',failure:outer}],'t04',t04SafeFailureMetric)[0];
 assert.deepEqual(collected,facts);
 assert(Buffer.byteLength(marker)<65536,'fixed inventory must remain below the existing 1MiB transport cap without increasing it');
 assert(!JSON.stringify({report,collected}).includes('PRIVATE_DIAGNOSTIC_SENTINEL'));
 return collected;
}
test('six fixed diagnostic identities match selected source and unchanged catalog without narrowing full-file execution',()=>{
 const source=readFileSync(new URL('../'+CANDIDATE_TEST_FILE,import.meta.url),'utf8');
 assert.deepEqual([...source.matchAll(/^test\("([^"]+)"/gm)].map(x=>x[1]),CANDIDATE_TEST_NAMES);
 assert.equal(stage.required.length,2);
 for(const row of stage.required)assert(candidateTestOrdinal(row)>0);
 assert.equal(candidateTestOrdinal({...identities[0],project:'private-project'}),0);
 assert.equal(candidateTestOrdinal({...identities[0],file:'other.spec.ts'}),0);
});
test('actual reporter, stage rejection, T04, isolated and outer exporters and collector distinguish both non-required failures',()=>{
 const a=reporterFixture([4,6]),b=reporterFixture([5,6]);
 assert.throws(()=>validateRuntimeStage(expected,a,context,1));
 assert.throws(()=>validateRuntimeStage(expected,b,context,1));
 const first=pipeline(a),second=pipeline(b);
 for(const out of[first,second]){
  assert.equal(out.t04FailedTests,2);assert.equal(out.t04FirstFailedRequired,1);
  assert.equal(out.t04CandidateInventoryStatus,1);assert.equal(out.t04CandidateTest6State,2);
  assert.equal(out.t04CandidateTest6FailureLine,391);assert.equal(out.t04CandidateTest6ErrorMatcherOrdinal,9);
  assert.equal(out.t04CandidateTest6Checkpoint3Reached,1);assert.equal(out.t04CandidateTest6Checkpoint3DbSuffix,2);
  assert.equal(out.t04CandidateTest6Checkpoint4DbEqualsPreclear,2);
  assert.equal(out.t04CandidateTest6Checkpoint1Reached,0);assert.equal(out.t04CandidateTest6Checkpoint1DbSuffix,0);
 }
 assert.equal(first.t04CandidateTest4State,2);assert.equal(first.t04CandidateTest5State,1);
 assert.equal(second.t04CandidateTest4State,1);assert.equal(second.t04CandidateTest5State,2);
 for(const[key,value]of Object.entries(imageFacts)){
  const metric='t04CandidateImage'+key[0].toUpperCase()+key.slice(1);
  assert.equal(first[metric],value);assert.equal(second[metric],0);
 }
 assert.equal(second.t04CandidateTest4DiagnosticStatus,0);
 assert.notDeepEqual(first,second);
});
test('missing, unknown and duplicate identities are explicit and never mislabel another failure',()=>{
 const source=reporterFixture(),cases=[
  [r=>r.results.pop(),2,'candidateMissingResults',1],
  [r=>r.discovery.pop(),2,'candidateMissingDiscovery',1],
  [r=>r.results.push({...r.results[0],name:'PRIVATE_DIAGNOSTIC_SENTINEL',state:'failed'}),3,'candidateUnknownResults',1],
  [r=>r.discovery.push({...r.discovery[0],name:'PRIVATE_DIAGNOSTIC_SENTINEL'}),3,'candidateUnknownDiscovery',1],
  [r=>r.results.push({...r.results[0]}),3,'candidateDuplicateResults',1],
  [r=>r.discovery.push({...r.discovery[0]}),3,'candidateDuplicateDiscovery',1],
 ];
 for(const[mutate,status,key,count]of cases){const r=structuredClone(source);mutate(r);const out=runtimeRunnerFailureFacts(expected,r);
  assert.equal(out.candidateInventoryStatus,status);assert.equal(out[key],count);assert(!JSON.stringify(out).includes('PRIVATE_DIAGNOSTIC_SENTINEL'));}
});
test('attachment schema is fixed, bounded, identity-bound and never reads private files',()=>{
 assert(safeCandidateDiagnostic(diagnostic(),6));
 assert.equal(candidateDiagnosticAttachment(identities[5],[]).status,0);
 const base=attachment(diagnostic());
 assert.equal(candidateDiagnosticAttachment(identities[5],[{...base,path:undefined}]).status,1);
 for(const bad of[
  {...base,contentType:'text/plain'}, {...base,path:'PRIVATE_DIAGNOSTIC_SENTINEL'}, {...base,body:Buffer.alloc(CANDIDATE_DIAGNOSTIC_MAX_BYTES+1)},
  {...base,body:Buffer.from('{')}, attachment(diagnostic(4)),attachment({...diagnostic(),raw:'PRIVATE_DIAGNOSTIC_SENTINEL'}),
  attachment(diagnostic(6,{milestoneOrdinal:32})),attachment(diagnostic(6,{observations:[observation(1),observation(1)]})),
  attachment(diagnostic(6,{observations:[observation(1,{dbSuffix:'PRIVATE_DIAGNOSTIC_SENTINEL'})]})),
 ]){const value=candidateDiagnosticAttachment(identities[5],[bad]);assert.deepEqual(value,{status:2});}
 assert.deepEqual(candidateDiagnosticAttachment(identities[5],[base,base]),{status:2});
 const malformed=reporterFixture([4,6],{attachments:{6:[attachment({...diagnostic(),raw:'PRIVATE_DIAGNOSTIC_SENTINEL'})]}});
 const out=pipeline(malformed);assert.equal(out.t04CandidateTest6DiagnosticStatus,2);assert.equal(out.t04CandidateTest6Checkpoint3Reached,0);
});
test('every scalar endpoint survives fixed bounds; unknown/raw keys and out-of-bound values are refused',()=>{
 const report=reporterFixture();const facts={t04StageOrdinal:10,...t04RunnerFailureFacts(expected,report)};
 for(const[key,[min,max]]of Object.entries(T04_FAILURE_BOUNDS).filter(([key])=>key.startsWith('t04Candidate'))){
  for(const value of[min,max])assert(t04SafeFailureMetric(key,value));
  for(const value of[-1,max+1,0.5,'1'])assert(!t04SafeFailureMetric(key,value));
 }
 for(const delta of[{t04CandidateSecret:'PRIVATE_DIAGNOSTIC_SENTINEL'},{t04CandidateTest6State:7},{t04CandidateTest6Checkpoint4DbSuffix:3}]){
  assert.throws(()=>diagnosticMarker('T04_FAILURE_FACTS',{...facts,...delta},t04SafeFailureMetric));
  assert.deepEqual(t04FailureFacts('T04_FAILURE_FACTS '+JSON.stringify({...facts,...delta})),{});
 }
});
test('image schema refuses private values, misplaced observations and false certainty for absent images',()=>{
 assert(safeCandidateDiagnostic(diagnostic(4,{image:imageFacts}),4));
 for(const image of[
  {...imageFacts,url:'PRIVATE_DIAGNOSTIC_SENTINEL'}, {...imageFacts,itemId:'PRIVATE_DIAGNOSTIC_SENTINEL'},
  {...imageFacts,phaseOrdinal:0}, {...imageFacts,observed:0},
  ...[0,1,3].map(selectionCount=>({...imageFacts,selectionCount})),
  {...imageFacts,selectionMatches:0},{...imageFacts,srcMatches:0},{...imageFacts,decoded:0},
  {...imageFacts,imageCount:0,srcMatches:0,decoded:0},
  ...[0,1,3].map(imageCount=>({...imageFacts,imageCount})),
  ...Object.entries(CANDIDATE_IMAGE_BOUNDS).map(([key,max])=>({...imageFacts,[key]:max+1})),
 ])assert.equal(safeCandidateDiagnostic(diagnostic(4,{image}),4),null);
 assert.equal(safeCandidateDiagnostic(diagnostic(6,{image:imageFacts}),6),null);
 const missing=diagnostic(4);delete missing.image;assert.equal(safeCandidateDiagnostic(missing,4),null);
 assert.equal(safeCandidateDiagnostic(diagnostic(4,{schemaVersion:'candidate-e2e-diagnostics-v1'}),4),null);
 assert(safeCandidateDiagnostic(diagnostic(4,{image:{phaseOrdinal:1,observed:0,selectionCount:0,selectionMatches:0,imageCount:0,srcMatches:0,decoded:0}}),4));
});
test('all discovered tests, retries, hooks and source guards retain fail-closed acceptance',()=>{
 const okay=reporterFixture([]);assert.equal(validateRuntimeStage(expected,okay,context,0).run,6);
 for(const ordinal of[1,2,3,4,5,6])assert.throws(()=>validateRuntimeStage(expected,reporterFixture([ordinal]),context,0));
 for(const flags of[{retry:true},{hook:true},{runner:true}]){
  const report=reporterFixture([],flags);assert.throws(()=>validateRuntimeStage(expected,report,context,0));
  const out=pipeline(report);
  if(flags.hook)assert.equal(out.t04HookErrors,1);
  if(flags.runner)assert.equal(out.t04RunnerErrors,1);
  if(flags.retry)assert.equal(out.t04CandidateTest4Attempts,2);
 }
 for(const key of['sourceSHA','sourceFingerprint','lockSHA','configSHA','runId','invocationSHA','argv']){
  const changed={...okay,[key]:key==='argv'?['/other']: 'stale'};
  assert.throws(()=>assertRuntimeDiagnosticBinding(expected,changed,context));
 }
});
test('toHaveValue appends matcher9 without interpreting private input values as Auth error codes',()=>{
 assert.equal(RUNTIME_ERROR_MATCHERS.length,9);
 const facts=runtimePlaywrightFailureFacts({message:'expect(locator).toHaveValue(expected)\nReceived: "PIN_CHANGE_REQUIRED"'}).failureFacts;
 assert.equal(facts.errorMatcherOrdinal,9);assert.equal(facts.errorCodeOrdinal,0);
 assert.equal(RUNTIME_ERROR_CODES.length,40);
});
