import test from'node:test';import assert from'node:assert/strict';
import{SERVICE_DIAGNOSTIC_BOUNDS,serviceSafeFailureMetric,serviceStageErrorFacts,serviceRunnerFailureFacts}from'./permission-runtime-service-diagnostic.mjs';
import{serviceFailureFacts}from'./permission-runtime-service.mjs';
import{ci1FailureExport,ci1IsolatedFailure}from'./permission-runtime-service-worker.mjs';
test('service diagnostics preserve required-case identity and safe hook/fixture context without private data',()=>{
 const one={file:'test.ts',name:'one',project:null},two={file:'test.ts',name:'two',project:null};
 const facts=serviceRunnerFailureFacts({required:[one,two]},{discovery:[one,two],results:[{...one,state:'passed'},
  {...two,state:'failed',failureLine:92,failureFacts:{errorCodeOrdinal:0,errorNameOrdinal:4,errorMatcherOrdinal:2},raw:'SECRET'}],
  errorCount:0,hookErrorCount:1,failureFacts:{errorCodeOrdinal:12,errorNameOrdinal:1,errorMatcherOrdinal:0},
  failureLocation:{fileOrdinal:1,line:41},fixtureDriftOrdinal:4,stack:'SECRET'});
 assert.equal(facts.serviceFirstFailedRequired,2);assert.equal(facts.serviceFailedTests,1);assert.equal(facts.serviceFirstFailedLine,92);
 assert.equal(facts.serviceHookErrors,1);assert.equal(facts.serviceFirstErrorCodeOrdinal,12);assert.equal(facts.serviceErrorLine,41);
 assert.equal(facts.serviceFixtureDriftOrdinal,4);assert.equal(JSON.stringify(facts).includes('SECRET'),false);
 assert.deepEqual(serviceStageErrorFacts({code:'ENOENT',name:'Error',runtimeStageBoundaryOrdinal:6,message:'SECRET'}),
  {serviceStageErrorCodeOrdinal:4,serviceStageErrorNameOrdinal:1,serviceStageBoundaryOrdinal:6});
});
test('each diagnostic boundary rejects unknown, noninteger and out-of-range facts independently',()=>{
 const baseline={serviceStageOrdinal:1,serviceSetupOrdinal:3},failure=facts=>({stage:'offline-edge',operation:'PILOT_HARNESS',code:'COMMAND_FAILED',command:'node',exitCode:1,facts});
 for(const[k,max]of Object.entries(SERVICE_DIAGNOSTIC_BOUNDS)){
  for(const v of[0,max]){
   const p={...baseline,[k]:v};assert.equal(serviceSafeFailureMetric(k,v),true);
   assert.deepEqual(serviceFailureFacts('SERVICE_FAILURE_FACTS '+JSON.stringify(p)),p);
   assert.deepEqual(ci1FailureExport(failure(p)).facts,p);
  }
  for(const v of[-1,max+1,0.1,'1',null]){
   const p={...baseline,[k]:v};assert.equal(serviceSafeFailureMetric(k,v),false);
   assert.deepEqual(serviceFailureFacts('SERVICE_FAILURE_FACTS '+JSON.stringify(p)),{});
   assert.equal(Object.hasOwn(ci1FailureExport(failure(p)).facts??{},k),false);
   assert.throws(()=>ci1IsolatedFailure({schemaVersion:'permission-ci1-isolated-failure-v1',runId:'123',attempt:1,sourceSHA:'a'.repeat(40),failure:failure(p),cleanupFailure:null},{runId:'123',attempt:1},'a'.repeat(40)));
  }
 }
 assert.deepEqual(serviceFailureFacts('SERVICE_FAILURE_FACTS '+JSON.stringify({...baseline,raw:'SECRET'})),{});
 assert.equal(serviceSafeFailureMetric('raw',1),false);
});

test('TC18 result counts distinguish skipped timedOut interrupted and attempt anomalies from passed once',()=>{
 const required=Array.from({length:5},(_,i)=>({file:'test.ts',name:String(i),project:null}));
 const results=required.map((x,i)=>({...x,state:['passed','timedOut','interrupted','skipped','passed'][i],attempts:i===4?2:1,failureLine:77,raw:'PRIVATE'}));
 const f=serviceRunnerFailureFacts({stage:'pin-tc18-wrapper',required},{discovery:required,results});
 assert.equal(f.serviceFailedTests,0);assert.equal(f.serviceTc18PassedOnceCount,1);assert.equal(f.serviceTc18NonPassedCount,3);
 assert.equal(f.serviceTc18AttemptAnomalies,1);assert.equal(f.serviceTc18FirstNonPassedRequired,2);assert.equal(f.serviceTc18FirstNonPassedLine,77);assert(!JSON.stringify(f).includes('PRIVATE'));
 const exit=serviceStageErrorFacts({runtimeStageChildExitCode:1,runtimeResultFailureOrdinal:1});
 assert.equal(exit.serviceChildExitObserved,1);assert.equal(exit.serviceChildExitCode,1);assert.equal(exit.serviceResultFailureOrdinal,1);
 for(const value of[null,undefined,256,-1,'PRIVATE']){const r=serviceStageErrorFacts({runtimeStageChildExitCode:value});assert.equal(r.serviceChildExitObserved,0);assert.equal(r.serviceChildExitCode,0);}
});
