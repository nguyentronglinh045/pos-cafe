// Shared finite bounds apply independently at the child parser and final export.
import{runtimeRunnerFailureFacts,safeRuntimeErrorFacts,runtimeErrorFacts,RUNTIME_ERROR_CODES,RUNTIME_ERROR_FILES}from'./permission-runtime-error-facts.mjs';
import{FIXTURE_DRIFT_CODES}from'./permission-fixture-diagnostics.mjs';
export const SERVICE_DIAGNOSTIC_BOUNDS=Object.freeze({serviceStageOrdinal:3,serviceSetupOrdinal:3,
 serviceStageBoundaryOrdinal:7,serviceReportObserved:3,serviceStageErrorCodeOrdinal:RUNTIME_ERROR_CODES.length,serviceStageErrorNameOrdinal:5,
 serviceMissingRequired:10000,serviceFirstFailedRequired:10000,serviceFailedTests:10000,serviceFirstFailedLine:100000,
 serviceRunnerErrors:10000,serviceHookErrors:10000,serviceTestErrorCodeOrdinal:RUNTIME_ERROR_CODES.length,serviceTestErrorNameOrdinal:5,serviceTestErrorMatcherOrdinal:8,
 serviceFirstErrorCodeOrdinal:RUNTIME_ERROR_CODES.length,serviceFirstErrorNameOrdinal:5,serviceFirstErrorMatcherOrdinal:8,
 serviceErrorFileOrdinal:RUNTIME_ERROR_FILES.length,serviceErrorLine:100000,serviceFixtureDriftOrdinal:FIXTURE_DRIFT_CODES.length});
export const serviceSafeFailureMetric=(key,value)=>Object.hasOwn(SERVICE_DIAGNOSTIC_BOUNDS,key)&&Number.isSafeInteger(value)&&value>=0&&value<=SERVICE_DIAGNOSTIC_BOUNDS[key];
export function serviceStageErrorFacts(error){
 const r=runtimeErrorFacts(error),facts={serviceStageErrorCodeOrdinal:r.errorCodeOrdinal,serviceStageErrorNameOrdinal:r.errorNameOrdinal};
 if(serviceSafeFailureMetric('serviceStageBoundaryOrdinal',error?.runtimeStageBoundaryOrdinal))facts.serviceStageBoundaryOrdinal=error.runtimeStageBoundaryOrdinal;
 return facts;
}
export function serviceRunnerFailureFacts(expected,report){
 const facts=Object.fromEntries(Object.entries(runtimeRunnerFailureFacts(expected,report)).map(([k,v])=>['service'+k[0].toUpperCase()+k.slice(1),v]));
 const first=safeRuntimeErrorFacts(report.failureFacts);
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
