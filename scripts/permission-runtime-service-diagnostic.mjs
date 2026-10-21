// Shared finite bounds apply independently at the child parser and final export.
import{runtimeRunnerFailureFacts,safeRuntimeErrorFacts,runtimeErrorFacts,RUNTIME_ERROR_CODES,RUNTIME_ERROR_FILES,RUNTIME_FAILURE_BOUNDS}from'./permission-runtime-error-facts.mjs';
import{FIXTURE_DRIFT_CODES}from'./permission-fixture-diagnostics.mjs';
import{TC18_WRAPPER_CODES}from'./permission-runtime-tc18-diagnostic.mjs';
export const SERVICE_DIAGNOSTIC_BOUNDS=Object.freeze({...Object.fromEntries(Object.entries(RUNTIME_FAILURE_BOUNDS).map(([k,v])=>['service'+k[0].toUpperCase()+k.slice(1),v])),serviceStageOrdinal:3,serviceSetupOrdinal:3,
 serviceChildExitObserved:1,serviceChildExitCode:255,serviceResultFailureOrdinal:16,
 serviceTc18ReceiptObserved:3,serviceTc18WrapperStatus:2,serviceTc18WrapperCodeOrdinal:TC18_WRAPPER_CODES.length,serviceTc18ControlDeleted:2,
 serviceTc18ResultCount:10000,serviceTc18PassedOnceCount:10000,serviceTc18NonPassedCount:10000,serviceTc18AttemptAnomalies:10000,
 serviceTc18FirstNonPassedRequired:10000,serviceTc18FirstNonPassedLine:100000,
 serviceStageBoundaryOrdinal:7,serviceReportObserved:3,serviceStageErrorCodeOrdinal:RUNTIME_ERROR_CODES.length,serviceStageErrorNameOrdinal:5,
 serviceMissingRequired:10000,serviceFirstFailedRequired:10000,serviceFailedTests:10000,serviceFirstFailedLine:100000,
 serviceRunnerErrors:10000,serviceHookErrors:10000,serviceTestErrorCodeOrdinal:RUNTIME_ERROR_CODES.length,serviceTestErrorNameOrdinal:5,serviceTestErrorMatcherOrdinal:8,
 serviceFirstErrorCodeOrdinal:RUNTIME_ERROR_CODES.length,serviceFirstErrorNameOrdinal:5,serviceFirstErrorMatcherOrdinal:8,
 serviceErrorFileOrdinal:RUNTIME_ERROR_FILES.length,serviceErrorLine:100000,serviceFixtureDriftOrdinal:FIXTURE_DRIFT_CODES.length});
export const serviceSafeFailureMetric=(key,value)=>Object.hasOwn(SERVICE_DIAGNOSTIC_BOUNDS,key)&&Number.isSafeInteger(value)&&value>=0&&value<=SERVICE_DIAGNOSTIC_BOUNDS[key];
export function serviceStageErrorFacts(error){
 const r=runtimeErrorFacts(error),facts={serviceStageErrorCodeOrdinal:r.errorCodeOrdinal,serviceStageErrorNameOrdinal:r.errorNameOrdinal};
 if(serviceSafeFailureMetric('serviceStageBoundaryOrdinal',error?.runtimeStageBoundaryOrdinal))facts.serviceStageBoundaryOrdinal=error.runtimeStageBoundaryOrdinal;
 if(Object.hasOwn(error??{},'runtimeStageChildExitCode')){
  const code=error.runtimeStageChildExitCode,observed=Number.isInteger(code)&&code>=0&&code<=255;
  facts.serviceChildExitObserved=observed?1:0;facts.serviceChildExitCode=observed?code:0;
 }
 if(serviceSafeFailureMetric('serviceResultFailureOrdinal',error?.runtimeResultFailureOrdinal))facts.serviceResultFailureOrdinal=error.runtimeResultFailureOrdinal;
 return facts;
}
export function serviceRunnerFailureFacts(expected,report){
 const facts=Object.fromEntries(Object.entries(runtimeRunnerFailureFacts(expected,report)).map(([k,v])=>['service'+k[0].toUpperCase()+k.slice(1),v]));
 const first=safeRuntimeErrorFacts(report.failureFacts);
 if(expected.stage==='pin-tc18-wrapper'){
  const rows=report.results,key=x=>JSON.stringify([x.file,x.name,x.project??null]);
  facts.serviceTc18ResultCount=rows.length;facts.serviceTc18PassedOnceCount=rows.filter(x=>x.state==='passed'&&x.attempts===1).length;
  facts.serviceTc18NonPassedCount=rows.filter(x=>x.state!=='passed').length;facts.serviceTc18AttemptAnomalies=rows.filter(x=>x.attempts!==1).length;
  const at=expected.required.findIndex(x=>rows.some(y=>key(x)===key(y)&&y.state!=='passed'));
  facts.serviceTc18FirstNonPassedRequired=at+1;
  const row=at>=0&&rows.find(y=>key(y)===key(expected.required[at])&&y.state!=='passed');
  if(serviceSafeFailureMetric('serviceTc18FirstNonPassedLine',row?.failureLine))facts.serviceTc18FirstNonPassedLine=row.failureLine;
 }
 if(first)for(const[k,v]of Object.entries(first))facts['serviceFirst'+k[0].toUpperCase()+k.slice(1)]=v;
 const l=report.failureLocation;
 if(l&&Object.keys(l).sort().join(',')==='fileOrdinal,line'&&serviceSafeFailureMetric('serviceErrorFileOrdinal',l.fileOrdinal)
  &&serviceSafeFailureMetric('serviceErrorLine',l.line)&&(l.fileOrdinal===0)===(l.line===0)){
  facts.serviceErrorFileOrdinal=l.fileOrdinal;facts.serviceErrorLine=l.line;
 }
 if(serviceSafeFailureMetric('serviceFixtureDriftOrdinal',report.fixtureDriftOrdinal))facts.serviceFixtureDriftOrdinal=report.fixtureDriftOrdinal;
 if(!Object.entries(facts).every(([k,v])=>serviceSafeFailureMetric(k,v)))throw Error('SERVICE_FAILURE_FACTS_REFUSED');
 return facts;
}
