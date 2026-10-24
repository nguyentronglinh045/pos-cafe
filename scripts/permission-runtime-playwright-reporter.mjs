import {runtimeReporterContext,reporterFile,writeRuntimeReport} from './permission-runtime-results.mjs';
import{runtimePlaywrightFailureFacts}from'./permission-runtime-error-facts.mjs';
import{candidateDiagnosticAttachment}from'./permission-runtime-candidate-diagnostic.mjs';

export default class RuntimePlaywrightReporter {
  onBegin(config,suite){
    this.context=runtimeReporterContext();this.results=new Map();this.errors=0;this.hookErrors=0;this.firstFailure=null;
    this.identity=t=>({file:reporterFile(this.context.sourceRoot,t.location.file),name:t.titlePath().slice(3).join(' > ')||t.title,
      project:t.parent.project()?.name||null});
    this.discovery=suite.allTests().map(t=>({...this.identity(t),retry:t.retries,repeats:t.parent.project()?.repeatEach??config.repeatEach,
      expectedFailure:t.expectedStatus!=='passed',exclusive:t._only===true,
      disabled:t.annotations.some(a=>['skip','fixme'].includes(a.type))}));
    this.selectedFiles=[...new Set(this.discovery.map(t=>t.file))];
  }
  onTestEnd(test,result){const x=this.identity(test),k=JSON.stringify(x),old=this.results.get(k);
    const failed=['failed','timedOut','interrupted'].includes(result.status),error=result.error??result.errors?.[0];
    const facts=failed?runtimePlaywrightFailureFacts(error,test.location.file):null;
    if(failed)this.firstFailure??=facts;
    const candidate=this.context.stage==='candidate-e2e'?candidateDiagnosticAttachment(x,result.attachments):null;
    this.results.set(k,{...x,state:result.status,attempts:(old?.attempts??0)+1,...(facts??{}),...(candidate?{candidateDiagnostic:candidate}:{})});}
  onStepEnd(test,result,step){if(step.category==='hook'&&step.error){
    this.hookErrors++;this.firstFailure??=runtimePlaywrightFailureFacts(step.error,test.location.file);}}
  onError(error){this.errors++;this.firstFailure??=runtimePlaywrightFailureFacts(error);}
  onEnd(result){writeRuntimeReport(this.context,{complete:true,runnerExit:result.status,errorCount:this.errors,hookErrorCount:this.hookErrors,...(this.firstFailure??{}),
    discovery:this.discovery,results:[...this.results.values()],selectedFiles:this.selectedFiles});}
}
