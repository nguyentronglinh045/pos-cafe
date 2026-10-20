import {runtimeReporterContext,reporterFile,writeRuntimeReport} from './permission-runtime-results.mjs';

export default class RuntimePlaywrightReporter {
  onBegin(config,suite){
    this.context=runtimeReporterContext();this.results=new Map();this.errors=0;
    this.identity=t=>({file:reporterFile(this.context.sourceRoot,t.location.file),name:t.titlePath().slice(3).join(' > ')||t.title,
      project:t.parent.project()?.name||null});
    this.discovery=suite.allTests().map(t=>({...this.identity(t),retry:t.retries,repeats:t.parent.project()?.repeatEach??config.repeatEach,
      expectedFailure:t.expectedStatus!=='passed',exclusive:t._only===true,
      disabled:t.annotations.some(a=>['skip','fixme'].includes(a.type))}));
    this.selectedFiles=[...new Set(this.discovery.map(t=>t.file))];
  }
  onTestEnd(test,result){const x=this.identity(test),k=JSON.stringify(x),old=this.results.get(k);
    this.results.set(k,{...x,state:result.status,attempts:(old?.attempts??0)+1});}
  onError(){this.errors++;}
  onEnd(result){writeRuntimeReport(this.context,{complete:true,runnerExit:result.status,errorCount:this.errors,hookErrorCount:0,
    discovery:this.discovery,results:[...this.results.values()],selectedFiles:this.selectedFiles});}
}
