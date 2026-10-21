import test from'node:test';import assert from'node:assert/strict';
import{runtimeRunnerFailureFacts,assertRuntimeDiagnosticBinding}from'./permission-runtime-error-facts.mjs';
import{t04RunnerFailureFacts,t04FailureFacts,t04SafeFailureMetric}from'./permission-runtime-t04.mjs';
import{serviceRunnerFailureFacts,serviceSafeFailureMetric}from'./permission-runtime-service-diagnostic.mjs';
import{serviceFailureFacts}from'./permission-runtime-service.mjs';
import{diagnosticMarker,finiteDiagnosticFacts,collectRuntimeDiagnosticFacts}from'./permission-runtime-diagnostic-transport.mjs';
import{verifyDiagnosticPipeline,verifyDiagnosticMutationControls}from'./permission-runtime-diagnostic-selftest.mjs';
const item={file:'synthetic.test.mjs',name:'required',project:'p'},expected={stage:'transition-e2e',runner:'playwright',required:[item]};
const facts={errorCodeOrdinal:31,errorNameOrdinal:1,errorMatcherOrdinal:0};
for(const[state,ordinal]of[['failed',1],['timedOut',2],['interrupted',3]])test('actual projections, parsers, final filter and collector preserve '+state,()=>{
 const r={discovery:[item],results:[{...item,state,attempts:1,failureFacts:facts,failureLine:68}],errorCount:0,hookErrorCount:0};
 for(const[prefix,produce,parse,safe]of[['t04',t04RunnerFailureFacts,t04FailureFacts,t04SafeFailureMetric],['service',serviceRunnerFailureFacts,serviceFailureFacts,serviceSafeFailureMetric]]){
  const value={[prefix+'StageOrdinal']:1,...(prefix==='service'?{serviceSetupOrdinal:3}:{}),...produce(expected,r)};
  const text=diagnosticMarker(prefix==='t04'?'T04_FAILURE_FACTS':'SERVICE_FAILURE_FACTS',value,safe);
  const exported=finiteDiagnosticFacts(parse(text),safe),out=collectRuntimeDiagnosticFacts([{failure:{facts:exported}}],prefix,safe)[0];
  assert.equal(out[prefix+'OutcomeOrdinal'],ordinal);assert.equal(out[prefix+'TestErrorCodeOrdinal'],31);assert.equal(out[prefix+'FirstFailedLine'],68);
  assert.equal(out[prefix+'FailedTests'],state==='failed'?1:0);assert.equal(out[prefix+'DiagnosticRequired'],1);
 }
});
test('the real verifier refuses facts dropped at marker/parser/export/collector boundaries',()=>{
 const c={sourceSHA:'a'.repeat(40),sourceFingerprint:'b'.repeat(64),lockSHA:'c'.repeat(64),configSHA:'d'.repeat(64),runId:'123',invocationSHA:'e'.repeat(64),argv:['runner','test']};
 const r={schemaVersion:'permission-runtime-stage-v1',stage:expected.stage,runner:expected.runner,...c,discovery:[item],results:[{...item,state:'failed',attempts:1,failureFacts:facts,failureLine:68}],errorCount:0,hookErrorCount:0};
 assert.doesNotThrow(()=>verifyDiagnosticPipeline(expected,r,c,'failed'));
 assert.equal(verifyDiagnosticMutationControls(expected,r,c,'failed'),4);
});
test('runner errors remain runner-origin and earlier skipped rows do not steal a later failure',()=>{
 const r={discovery:[item],results:[{...item,state:'passed'}],errorCount:1,hookErrorCount:0,failureFacts:facts,failureLine:68};
 const out=runtimeRunnerFailureFacts(expected,r);assert.equal(out.failureOriginOrdinal,2);assert.equal(out.firstFailedRequired,0);assert.equal(out.runnerFirstErrorCodeOrdinal,31);assert.equal(out.runnerFirstErrorLine,68);assert(!Object.hasOwn(out,'testErrorCodeOrdinal'));
});
test('malformed oversized duplicate markers and out-of-bound or raw fields never cross public transport',()=>{
 for(const text of['T04_FAILURE_FACTS {','x'.repeat(1024**2+1),'T04_FAILURE_FACTS {"t04StageOrdinal":1}\nT04_FAILURE_FACTS {"t04StageOrdinal":1}','T04_FAILURE_FACTS {"t04StageOrdinal":1,"raw":"SECRET"}','T04_FAILURE_FACTS {"t04StageOrdinal":1,"t04OutcomeOrdinal":5}'])assert.deepEqual(t04FailureFacts(text),{});
 assert.throws(()=>collectRuntimeDiagnosticFacts([{facts:{t04StageOrdinal:1,t04Private:'SECRET'}}],'t04',t04SafeFailureMetric));
});
test('diagnostic binding refuses stale source/run/config/invocation and wrong argv independently',()=>{
 const c={sourceSHA:'a'.repeat(40),sourceFingerprint:'b'.repeat(64),lockSHA:'c'.repeat(64),configSHA:'d'.repeat(64),runId:'123',invocationSHA:'e'.repeat(64),argv:['/runner','test']};
 const r={schemaVersion:'permission-runtime-stage-v1',stage:expected.stage,runner:'playwright',...c,discovery:[item],results:[]};assert.equal(assertRuntimeDiagnosticBinding(expected,r,c),r);
 for(const k of Object.keys(c))assert.throws(()=>assertRuntimeDiagnosticBinding(expected,{...r,[k]:k==='argv'?['/other']: 'stale'},c));
});
