import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
const sourceRoot='D:/Workspace/pos-cafe-permission-run-20261020';
const targetRoot='D:/Workspace/pos-cafe-permission-timeonly-20261022';
const evidenceRoot='D:/Workspace/pos-cafe-docs/docs/implementation-log/permission-main-staging-night-20261022';
const hash=value=>createHash('sha256').update(value).digest('hex');
const once=(source,oldValue,newValue)=>{if(source.split(oldValue).length!==2)throw Error('SOURCE_SHAPE');return source.replace(oldValue,newValue);};
mkdirSync(targetRoot+'/operations',{recursive:true});mkdirSync(targetRoot+'/evidence',{recursive:true});
const records=[];
for(const kind of ['service','t04']){
 const original=sourceRoot+'/collect-cloud-'+kind+'.mjs',bytes=readFileSync(original);let text=bytes.toString();
 text=text.replaceAll("from'./code/scripts/","from'../code/scripts/");
 text=once(text,"root='D:/Workspace/pos-cafe-permission-run-20261020'","root='"+targetRoot+"'");
 if(kind==='t04'){
  const insert="const api=JSON.parse(execFileSync('gh',['api',`repos/nguyentronglinh045/pos-cafe/actions/runs/${id}`],{cwd,encoding:'utf8',timeout:30000,maxBuffer:65536}));\n"
   +"if(api.head_sha!==sha||api.status!=='completed'||api.path!=='.github/workflows/backend.yml'||api.event!=='workflow_dispatch'||api.run_attempt!==1)throw Error('ATTEMPT_OR_WORKFLOW_DRIFT');\n"
   +"const git=args=>execFileSync('git',args,{cwd,timeout:30000,maxBuffer:1024**2,windowsHide:true});\n"
   +"if(git(['rev-parse','HEAD']).toString().trim()!==sha||git(['diff','--name-only','HEAD','--']).toString().trim())throw Error('VALIDATOR_SOURCE_DRIFT');\n"
   +"const validatorPaths=['scripts/permission-runtime-t04.mjs','scripts/permission-runtime-results.mjs','scripts/permission-runtime-catalog.mjs'];\n"
   +"const validatorPins=validatorPaths.map(path=>({path,gitLfSHA256:createHash('sha256').update(git(['show',sha+':'+path])).digest('hex')}));\n";
  text=once(text,"const log=execFileSync('gh',['run','view',id,'--log']",insert+"const log=execFileSync('gh',['run','view',id,'--attempt','1','--log']");
  text=once(text,"if(p.sourceSHA!==sha||p.runId!==id)","if(p.sourceSHA!==sha||p.workflowSHA!==sha||p.runId!==id||p.attempt!==1||metadata.conclusion==='success'&&p.status!=='PASS')");
  text=once(text,"const evidence=objects.filter(p=>p.schemaVersion==='permission-t04-runtime-v1');","const evidence=objects.filter(p=>p.schemaVersion==='permission-t04-runtime-v1');if(evidence.length>1||metadata.conclusion==='success'&&evidence.length!==1)throw Error('DUPLICATE_OR_SUCCESS_WITHOUT_OBSERVATION');");
  text=once(text,"sourceSHA:sha,runId:id,conclusion:metadata.conclusion","sourceSHA:sha,runId:id,attempt:1,validatorPins,conclusion:metadata.conclusion");
 }
 if(kind==='service')text=once(text,"api.attempt<1||api.attempt>1000","api.attempt!==1");
 const target=targetRoot+'/operations/collect-cloud-'+kind+'.mjs';
 writeFileSync(target,text,{flag:'wx'});records.push({kind,sourcePath:original,sourceSHA256:hash(bytes),targetPath:target,targetSHA256:hash(Buffer.from(text))});
}
writeFileSync(evidenceRoot+'/collector-preparation01.json',JSON.stringify({schemaVersion:'permission-night-collector-preparation-v1',recordedAtUtc:new Date().toISOString(),records,
 changes:['new isolated checkout imports/root','T04 explicit attempt1, workflow event/path, HEAD/clean and validator pins','T04 nested source/workflow/attempt and success shape','service no retry attempt'],
 execution:'NOT_RUN',originalHelpersModified:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(records));
