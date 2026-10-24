import {runtimeReporterContext,reporterFile,writeRuntimeReport} from './permission-runtime-results.mjs';
import {runtimeErrorFacts,runtimeErrorLine,runtimeErrorLocation,runtimeImageHookFailureFacts} from './permission-runtime-error-facts.mjs';
import {fixtureDriftCode,FIXTURE_DRIFT_CODES} from './permission-fixture-diagnostics.mjs';

export default class RuntimeVitestReporter {
  onInit(){this.context=runtimeReporterContext();this.discovery=[];this.seen=new Set();}
  identity(test){return {file:reporterFile(this.context.sourceRoot,test.module.moduleId),name:test.fullName,
    project:test.module.project?.name||null};}
  onTestModuleCollected(module){
    for(const test of module.children.allTests()){
      const x=this.identity(test),k=JSON.stringify(x);
      if(this.seen.has(k))throw Error('PERMISSION_RUNTIME_DUPLICATE_TEST');this.seen.add(k);
      this.discovery.push({...x,retry:test.options.retry??0,repeats:(test.options.repeats??0)+1,
        expectedFailure:test.options.fails===true,exclusive:test.options.mode==='only',
        disabled:['skip','todo'].includes(test.options.mode)});
    }
  }
  onTestRunEnd(modules,errors,reason){
    const hookErrors=modules.flatMap(m=>[m,...(m.children.allSuites?.()??[])])
      .flatMap(s=>typeof s.errors==='function'?s.errors():Array.isArray(s.errors)?s.errors:[]);
    const results=modules.flatMap(m=>[...m.children.allTests()].map(t=>{const result=t.result();return{...this.identity(t),
      state:result.state,attempts:1+(t.diagnostic()?.retryCount??NaN)+(t.diagnostic()?.repeatCount??NaN),
      ...(result.state==='failed'?{failureFacts:runtimeErrorFacts(result.errors?.[0]),failureLine:runtimeErrorLine(result.errors?.[0],m.moduleId)}:{})};}));
    const firstError=errors[0]??hookErrors[0]??modules.flatMap(m=>[...m.children.allTests()].flatMap(t=>t.result().errors??[]))[0];
    writeRuntimeReport(this.context,{complete:true,runnerExit:reason,errorCount:errors.length,hookErrorCount:hookErrors.length,
      failureFacts:runtimeErrorFacts(firstError),
      failureLocation:runtimeErrorLocation(firstError,this.context.sourceRoot),
      ...(this.context.stage==='candidate-images-service'?{imageHookFacts:runtimeImageHookFailureFacts(firstError)}:{}),
      fixtureDriftOrdinal:FIXTURE_DRIFT_CODES.indexOf(fixtureDriftCode(firstError))+1,
      discovery:this.discovery,results,selectedFiles:[...new Set(modules.map(m=>reporterFile(this.context.sourceRoot,m.moduleId)))]});
  }
}
