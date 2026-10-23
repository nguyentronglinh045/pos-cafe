import{mkdirSync,writeFileSync,readFileSync}from'node:fs';import{join,resolve,relative}from'node:path';import{spawnSync}from'node:child_process';
import{runtimeHash,validateRuntimeStage}from'./permission-runtime-results.mjs';
import{assertRuntimeDiagnosticBinding}from'./permission-runtime-error-facts.mjs';
import{t04RunnerFailureFacts,t04FailureFacts,t04SafeFailureMetric}from'./permission-runtime-t04.mjs';
import{serviceRunnerFailureFacts,serviceSafeFailureMetric}from'./permission-runtime-service-diagnostic.mjs';import{serviceFailureFacts}from'./permission-runtime-service.mjs';
import{diagnosticMarker,finiteDiagnosticFacts,collectRuntimeDiagnosticFacts}from'./permission-runtime-diagnostic-transport.mjs';
import{projectTc18WrapperReceipt}from'./permission-runtime-tc18-diagnostic.mjs';
import{ci1FailureExport as t04FailureExport}from'./permission-runtime-t04-worker.mjs';
import{ci1FailureExport as serviceFailureExport}from'./permission-runtime-service-worker.mjs';
const check=x=>{if(!x)throw Error('RUNTIME_DIAGNOSTIC_SELFTEST_FAILED');};
export const DIAGNOSTIC_CONTROL_STATES=Object.freeze(['failed','timedOut','interrupted','runner-error','metadata-absent','wrapper-failure','transport-refusal']);
export function verifyDiagnosticPipeline(expected,report,context,mode,adapters={}){
 assertRuntimeDiagnosticBinding(expected,report,{...context,argv:context.argv});
 const expectedOutcome={failed:1,timedOut:2,interrupted:3,'metadata-absent':1}[mode];
 for(const[prefix,produce,parse,safe]of[['t04',t04RunnerFailureFacts,t04FailureFacts,t04SafeFailureMetric],['service',serviceRunnerFailureFacts,serviceFailureFacts,serviceSafeFailureMetric]]){
  const facts={[prefix+'StageOrdinal']:1,...(prefix==='service'?{serviceSetupOrdinal:3}:{}),...produce(expected,report)};
  const marker=(adapters.marker??diagnosticMarker)(prefix==='t04'?'T04_FAILURE_FACTS':'SERVICE_FAILURE_FACTS',facts,safe);
  const parsed=(adapters.parse??parse)(marker),exporter=prefix==='t04'?t04FailureExport:serviceFailureExport;
  const failure=(adapters.export??exporter)({stage:'harness',operation:'PILOT_HARNESS',code:'COMMAND_FAILED',command:'node',exitCode:1,facts:parsed},exporter);
  const out=(adapters.collect??collectRuntimeDiagnosticFacts)([{failure}],prefix,safe)[0];
  check(out&&!JSON.stringify(out).includes('PRIVATE_DIAGNOSTIC_SENTINEL'));
  check(Object.entries(facts).every(([k,v])=>out[k]===v));
  if(mode==='hook-error')check(out[prefix+'FailureOriginOrdinal']===2&&out[prefix+'HookErrors']>0
   &&out[prefix+'OutcomeOrdinal']===4&&out[prefix+'DiagnosticRequired']===1
   &&out[prefix+'RunnerFirstErrorFileOrdinal']===10&&out[prefix+'RunnerFirstErrorLine']>0
   &&out[prefix+'ImageHookStepOrdinal']===7&&out[prefix+'ImageJwtSubreasonOrdinal']===8&&out[prefix+'ImageJwtAlgorithmOrdinal']===2
   &&out[prefix+'ImageJwtAuthStatus']===401);
  else if(mode==='runner-error')check(out[prefix+'FailureOriginOrdinal']===2&&out[prefix+'RunnerErrors']>0&&out[prefix+'DiagnosticRequired']===0);
  else check(out[prefix+'OutcomeOrdinal']===expectedOutcome&&out[prefix+'DiagnosticRequired']===1
   &&out[prefix+'FailedTests']===(mode==='failed'||mode==='metadata-absent'?1:0));
  if(mode==='failed')check(out[prefix+'TestErrorCodeOrdinal']===31&&out[prefix+'FirstFailedLine']>0);
  if(mode==='metadata-absent')check(out[prefix+'TestErrorCodeOrdinal']===0);
  check(out[prefix+'FailureOriginOrdinal']===(['runner-error','hook-error'].includes(mode)?2:1));
 }
}
// Execute the same verifier with a mutation at each real transport boundary.
// A control succeeds only if all four injected losses are detected.
export function verifyDiagnosticMutationControls(expected,report,context,mode){
 const drop=facts=>Object.fromEntries(Object.entries(facts).filter(([k])=>!k.endsWith('FailureOriginOrdinal')));
 const mutations=[
  {marker:(prefix,facts,safe)=>diagnosticMarker(prefix,drop(facts),safe)},
  {parse:text=>drop(text.startsWith('T04_')?t04FailureFacts(text):serviceFailureFacts(text))},
  {export:(value,exporter)=>{const out=exporter(value);return{...out,facts:drop(out.facts??{})};}},
  {collect:(records,prefix,safe)=>collectRuntimeDiagnosticFacts(records,prefix,safe).map(drop)}
 ];
 for(const adapters of mutations){let refused=false;try{verifyDiagnosticPipeline(expected,report,context,mode,adapters);}catch{refused=true;}check(refused);}
 return mutations.length;
}
export function diagnosticReporterSelftest(root,parent,{sourceSHA,lockSHA}){
 const summary={run:7,pass:0,states:[...DIAGNOSTIC_CONTROL_STATES],sourceSHA,lockSHA,fullPipeline:true,mutationChecks:0};
 for(const mode of DIAGNOSTIC_CONTROL_STATES.slice(0,5)){
  const dir=join(parent,'diagnostic-'+mode);mkdirSync(dir);const file=join(dir,'case.spec.mjs'),config=join(dir,'config.mjs');
  const ready=join(dir,'ready');
  const body=mode==='failed'?"throw new Error('UNEXPECTED_LEGACY_FINANCIAL_GRANT');":mode==='metadata-absent'?"throw new Error('PRIVATE_DIAGNOSTIC_SENTINEL');":mode==='interrupted'?`(await import('node:fs')).writeFileSync(${JSON.stringify(ready)},'ready');await new Promise(()=>{});`:mode==='timedOut'?"await new Promise(()=>{});":"";
  writeFileSync(file,`import{test}from'@playwright/test';test.describe('suite',()=>{test('required',async()=>{${body}});});\n`);
  const teardown=join(dir,'teardown.mjs');if(mode==='runner-error')writeFileSync(teardown,"export default()=>{throw new Error('UNEXPECTED_LEGACY_FINANCIAL_GRANT');};\n");
  writeFileSync(config,`export default ${JSON.stringify({testDir:dir,testMatch:'case.spec.mjs',workers:1,retries:0,repeatEach:1,forbidOnly:true,timeout:mode==='timedOut'?100:mode==='interrupted'?0:3000,globalTimeout:6000,...(mode==='runner-error'?{globalTeardown:teardown}:{})})};\n`);
  const cli=resolve(root,'node_modules/@playwright/test/cli.js'),bootstrap=join(dir,'interrupt.mjs');
  // Emit the signal inside the CLI process after the required case starts.
  // process.kill(...,'SIGINT') on Windows terminates before reporter teardown.
  if(mode==='interrupted')writeFileSync(bootstrap,`import{existsSync}from'node:fs';import{pathToFileURL}from'node:url';const timer=setInterval(()=>{if(existsSync(${JSON.stringify(ready)})){clearInterval(timer);process.emit('SIGINT');}},20);timer.unref();await import(pathToFileURL(${JSON.stringify(cli)}).href);\n`);
  const argv=[mode==='interrupted'?bootstrap:cli,'test','--config',config,'--reporter','./scripts/permission-runtime-playwright-reporter.mjs'];
  const context={stage:'diagnostic-'+mode.toLowerCase(),runner:'playwright',sourceSHA,sourceFingerprint:runtimeHash('diagnostic:'+sourceSHA),lockSHA,
   configSHA:runtimeHash(readFileSync(config)),runId:process.env.GITHUB_RUN_ID??'1',invocationSHA:runtimeHash(argv),sourceRoot:root,outputRoot:dir};
  const cp=join(dir,'context.json');writeFileSync(cp,JSON.stringify(context));
  const child=spawnSync(process.execPath,argv,{cwd:root,env:{...process.env,PERMISSION_RUNTIME_CONTEXT:cp},encoding:'utf8',timeout:12000,maxBuffer:128*1024,windowsHide:true});
  check(!child.error&&!child.signal&&child.status!==0);
  const raw=readFileSync(join(dir,context.stage+'-runner.json'),'utf8');check(!raw.includes('PRIVATE_DIAGNOSTIC_SENTINEL'));
  const report=JSON.parse(raw),item={file:relative(root,file).replaceAll('\\','/'),name:'suite > required',project:''};
  const expected={stage:context.stage,runner:'playwright',required:[item],files:[item.file],configSHA:context.configSHA,exactDiscovery:true,argv};
  check(report.discovery.length===1&&report.discovery[0].file===item.file&&report.discovery[0].name===item.name);
  item.project=report.discovery[0].project;
  if(mode!=='runner-error')check(report.results[0]?.state===(mode==='metadata-absent'?'failed':mode));
  let refused=false;try{validateRuntimeStage(expected,report,context,child.status);}catch{refused=true;}check(refused);
  verifyDiagnosticPipeline(expected,report,{...context,argv},mode);
  summary.mutationChecks+=verifyDiagnosticMutationControls(expected,report,{...context,argv},mode);summary.pass++;
 }
 const binding={stage:'pin-tc18-wrapper',sourceSHA,sourceFingerprint:runtimeHash('wrapper'),lockSHA,configSHA:runtimeHash('config'),runId:process.env.GITHUB_RUN_ID??'1',invocationSHA:runtimeHash('argv')};
 const facts={serviceStageOrdinal:1,serviceSetupOrdinal:3,...projectTc18WrapperReceipt({startedUtc:'2026-10-20T17:00:00.000Z',endedUtc:'2026-10-20T17:01:00.000Z',controlDeleted:true,runtimeBinding:binding,status:'FAIL',code:'CANARY_LEAK_artifact'},binding)};
 const text=diagnosticMarker('SERVICE_FAILURE_FACTS',facts,serviceSafeFailureMetric);
 const out=collectRuntimeDiagnosticFacts([{failure:serviceFailureExport({stage:'harness',operation:'PILOT_HARNESS',code:'COMMAND_FAILED',facts:serviceFailureFacts(text)})}],'service',serviceSafeFailureMetric)[0];
 check(out.serviceTc18WrapperStatus===2&&out.serviceTc18WrapperCodeOrdinal===17);summary.pass++;
 check(Object.keys(t04FailureFacts('T04_FAILURE_FACTS {"t04StageOrdinal":1,"raw":"PRIVATE_DIAGNOSTIC_SENTINEL"}')).length===0);
 check(Object.keys(t04FailureFacts('T04_FAILURE_FACTS {"t04StageOrdinal":1}\nT04_FAILURE_FACTS {"t04StageOrdinal":1}')).length===0);summary.pass++;
 return summary;
}
