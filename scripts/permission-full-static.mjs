import fs from 'node:fs';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {assertPrivateRoot} from './permission-hosted-schema.mjs';

const MANIFEST='tests/permissions/permissionAggregateCases.json';
const LIMIT=8*1024*1024;
const definitions=Object.freeze({
 'foundation-unit':{profile:'candidate',executionKind:'unit',config:'vitest.config.ts'},
 'candidate-unit':{profile:'candidate',executionKind:'unit',config:'vitest.config.ts'},
 'candidate-seed-tools':{profile:'candidate',executionKind:'static',config:'vitest.permission-seed.config.ts'},
 'legacy-t01-tools':{profile:'legacy',executionKind:'static',config:'tests/contracts/tooling.config.ts'},
});
// Preserve the complete existing permission-verify.mjs T01 tools inventory.
const t01Files=['permissionPreflight.tool.test.ts','permissionMigrationPlan.tool.test.ts',
 'permissionBridgeOracle.tool.test.ts','permissionInventory.tool.test.ts','permissionVerify.tool.test.ts','harness.tool.test.ts']
 .map(file=>'tests/contracts/'+file);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const fail=code=>{throw Object.assign(new Error(code),{code});};
const check=(ok,code)=>{if(!ok)fail(code);};
const git=args=>execFileSync('git',args,{encoding:'utf8',maxBuffer:LIMIT,windowsHide:true});
const normalized=file=>file.replaceAll('\\','/');

export function staticStagePlan(stage,manifest) {
 check(typeof stage==='string'&&Object.hasOwn(definitions,stage),'STATIC_STAGE_REFUSED');
 const definition=definitions[stage];
 check(manifest?.schemaVersion===1&&Array.isArray(manifest.cases)&&manifest.cases.length===60,'STATIC_MANIFEST_INVALID');
 check(new Set(manifest.cases.map(item=>item.id)).size===60&&manifest.cases.every(item=>/^TC(?:0[1-9]|[1-5][0-9]|60)$/.test(item.id)&&item.status==='REQUIRED'&&Array.isArray(item.variants)),'STATIC_MANIFEST_INVALID');
 const variants=manifest.cases.flatMap(item=>item.variants.filter(variant=>variant.stage===stage).map(variant=>({...variant,profile:variant.profile??item.profile})));
 check(variants.length>0&&variants.every(variant=>variant.profile===definition.profile&&variant.runner==='vitest'
  &&typeof variant.name==='string'&&variant.name.length>0&&typeof variant.file==='string'
  &&/^(?:src|tests)\/[A-Za-z0-9_./-]+\.(?:test|spec)\.tsx?$/.test(variant.file)&&!variant.file.split('/').includes('..')),'STATIC_VARIANTS_INVALID');
 const required=[...new Map(variants.map(variant=>[variant.file+'|'+variant.name,{file:variant.file,name:variant.name}])).values()];
 const files=[...new Set([...variants.map(variant=>variant.file),...(stage==='legacy-t01-tools'?t01Files:[])])].sort();
 return {stage,...definition,files,required,variantOccurrences:variants.length,selection:'FULL_FILES_NO_VARIANT_GREP'};
}

export async function loadStaticHelpers() {
 const [source,suite,evidence]=await Promise.all([import('./permission-preflight-core.mjs'),import('./permission-verify.mjs'),import('./permission-execution-evidence.mjs')]);
 return {permissionFingerprint:source.permissionFingerprint,verifySuite:suite.verifySuite,
  captureExecutionProfile:evidence.captureExecutionProfile,emitExecutionAttestation:evidence.emitExecutionAttestation,
  collectVerifiedExecution:evidence.collectVerifiedExecution};
}
function frozenGit() {
 check(git(['status','--porcelain=v1','--untracked-files=all']).trim()==='','STATIC_SOURCE_NOT_FROZEN');
 return {commit:git(['rev-parse','HEAD']).trim(),tree:git(['rev-parse','HEAD^{tree}']).trim()};
}
function committedSource(helpers) {
 const source=frozenGit(),bytes=Buffer.from(git(['show',source.commit+':'+MANIFEST]));
 return {...source,fingerprint:helpers.permissionFingerprint(),manifestSha256:sha(bytes),manifest:JSON.parse(bytes)};
}
function ordinaryDirectory(directory) {
 check(typeof directory==='string'&&path.isAbsolute(directory),'STATIC_OUTPUT_REFUSED');
 const resolved=path.resolve(directory),root=path.parse(resolved).root;let cursor=root;
 for(const component of resolved.slice(root.length).split(path.sep).filter(Boolean)) {
  cursor=path.join(cursor,component);check(!fs.lstatSync(cursor).isSymbolicLink(),'STATIC_OUTPUT_REFUSED');
 }
 check(fs.realpathSync(resolved)===resolved&&fs.statSync(resolved).isDirectory(),'STATIC_OUTPUT_REFUSED');
 return resolved;
}
function writeJson(file,value) {
 const bytes=Buffer.from(JSON.stringify(value,null,2)+'\n');check(bytes.length<=LIMIT,'STATIC_REPORT_LIMIT');
 fs.writeFileSync(file,bytes,{flag:'wx',mode:0o600});
}
function readJson(file) {
 const stat=fs.lstatSync(file);check(stat.isFile()&&!stat.isSymbolicLink()&&stat.nlink===1&&stat.size<=LIMIT,'STATIC_REPORT_REFUSED');
 return JSON.parse(fs.readFileSync(file,'utf8'));
}
function childEnvironment(paths,runId) {
 const env={};
 for(const key of ['PATH','PATHEXT','SystemRoot','WINDIR','HOME','USERPROFILE','LOCALAPPDATA','TEMP','TMP','TMPDIR','LANG','LC_ALL','CI'])if(process.env[key])env[key]=process.env[key];
 return {...env,NO_COLOR:'1',VITE_DATA_MODE:'mock',VITE_SUPABASE_URL:'',VITE_SUPABASE_ANON_KEY:'',
  PERM_RESULTS_FILE:paths.results,IDEM_ATTESTATION_FILE:paths.options,PERM_RUN_ID:runId};
}
const executeProcess=({argv,env})=>spawnSync(process.execPath,argv,{encoding:'utf8',windowsHide:true,timeout:300000,maxBuffer:16*1024*1024,env});

function admittedDependencies(dependencies) {
 check(dependencies!==null&&typeof dependencies==='object'&&Object.getPrototypeOf(dependencies)===Object.prototype,'STATIC_DEPENDENCIES_REFUSED');
 const keys=Reflect.ownKeys(dependencies),values=Object.create(null);
 for(const key of keys) {
  check(typeof key==='string'&&['helpers','readSource','invoke'].includes(key),'STATIC_DEPENDENCIES_REFUSED');
  const descriptor=Object.getOwnPropertyDescriptor(dependencies,key);
  check(descriptor?.enumerable===true&&Object.hasOwn(descriptor,'value')&&!Object.hasOwn(descriptor,'get')&&!Object.hasOwn(descriptor,'set'),'STATIC_DEPENDENCIES_REFUSED');
  values[key]=descriptor.value;
 }
 return {values,simulation:keys.length>0};
}

// Any dependency injection is a simulation: its report cannot enter the aggregate.
export async function runStaticStage({stage,outputRoot,runId=randomUUID()},dependencies={}) {
 check(typeof stage==='string'&&Object.hasOwn(definitions,stage),'STATIC_STAGE_REFUSED');
 check(typeof runId==='string'&&/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(runId),'STATIC_RUN_ID_INVALID');
 const {values:injected,simulation}=admittedDependencies(dependencies);
 if(!simulation)frozenGit();
 let helpers;
 try{helpers=injected.helpers??await loadStaticHelpers();}catch{fail('STATIC_HELPER_LOAD_FAILED');}
 const readSource=injected.readSource??(()=>committedSource(helpers));
 const source=readSource();
 check(/^[a-f0-9]{64}$/.test(source.fingerprint??'')&&/^[a-f0-9]{40}$/.test(source.commit??'')&&/^[a-f0-9]{40}$/.test(source.tree??'')&&/^[a-f0-9]{64}$/.test(source.manifestSha256??''),'STATIC_SOURCE_INVALID');
 const plan=staticStagePlan(stage,source.manifest);
 const sameSource=()=>{const current=readSource();return ['fingerprint','commit','tree','manifestSha256'].every(key=>current[key]===source[key]);};
 if(!simulation) {
  check(!fs.readdirSync(process.cwd()).some(name=>/^\.env(?:\.|$)/.test(name)&&name!=='.env.example'),'STATIC_ENV_FILE_REFUSED');
  for(const file of [...plan.files,plan.config,'scripts/permission-vitest-reporter.mjs','node_modules/vitest/vitest.mjs'])check(fs.statSync(file).isFile(),'STATIC_SOURCE_FILE_MISSING');
 }
 const parent=ordinaryDirectory(outputRoot);
 if(!simulation) {
  try{assertPrivateRoot(parent);}catch{fail('STATIC_OUTPUT_PRIVATE_REQUIRED');}
  if(process.platform!=='win32')check(fs.statSync(parent).uid===process.getuid(),'STATIC_OUTPUT_PRIVATE_REQUIRED');
 }
 const directory=path.join(parent,stage+'-'+runId);check(!fs.existsSync(directory),'STATIC_OUTPUT_EXISTS');
 fs.mkdirSync(directory,{mode:0o700});
 const paths=Object.fromEntries(['discovery','results','options'].map(name=>[name,path.join(directory,name+'.json')]));
 const invoke=injected.invoke??executeProcess,env=childEnvironment(paths,runId),startedAt=new Date().toISOString();
 const phases=[];let checked=null,accepted=null,errorCode=null;
 try {
  const discovery=await invoke({phase:'discovery',plan,paths,env,argv:['node_modules/vitest/vitest.mjs','list','--config',plan.config,...plan.files,'--json='+paths.discovery]});
  phases.push({phase:'discovery',exitCode:discovery.status??null});
  check(discovery.status===0&&!discovery.error&&!discovery.signal,'STATIC_DISCOVERY_FAILED');
  check(sameSource(),'STATIC_SOURCE_DRIFT');
  const execution=await invoke({phase:'execution',plan,paths,env,argv:['node_modules/vitest/vitest.mjs','run','--config',plan.config,...plan.files,'--allowOnly=false','--retry=0','--maxWorkers=1','--reporter=./scripts/permission-vitest-reporter.mjs']});
  phases.push({phase:'execution',exitCode:execution.status??null});
  check(execution.status===0&&!execution.error&&!execution.signal,'STATIC_EXECUTION_FAILED');
  const [discovered,results,options]=['discovery','results','options'].map(name=>readJson(paths[name]));
  check(results.errorCount===0&&results.hookErrorCount===0&&(results.hookErrors?.length??0)===0&&(results.runErrors?.length??0)===0,'STATIC_RUNNER_HOOK_ERRORS');
  checked=helpers.verifySuite(discovered,results,options,plan.files,plan.required);
  check(checked.valid,'STATIC_SUITE_INVALID');
  check(sameSource(),'STATIC_SOURCE_DRIFT');
  const executionProfile=await helpers.captureExecutionProfile({profile:plan.profile,stage,executionKind:plan.executionKind,configId:plan.config});
  check(executionProfile.backend?.applicable===false,'STATIC_BACKEND_BINDING_REFUSED');
  const attestationPath=path.join(directory,'profile-attestation.json'),reportPath=path.join(directory,'execution-report.json');
  helpers.emitExecutionAttestation({runId,sourceFingerprint:source.fingerprint,executionProfile,startedAt,finishedAt:new Date().toISOString(),artifactPaths:paths,outputPath:attestationPath});
  const report={schemaVersion:simulation?'permission-static-simulation-v1':'permission-execution-report-v1',simulation,valid:!simulation,exitCode:0,runId,
   sourceFingerprint:source.fingerprint,profile:plan.profile,stage,executionKind:plan.executionKind,runner:'vitest',
   artifacts:Object.fromEntries(Object.entries(paths).map(([name,file])=>[name,{path:normalized(file),sha256:sha(fs.readFileSync(file))}])),
   attestation:{path:normalized(attestationPath),sha256:sha(fs.readFileSync(attestationPath))}};
  writeJson(reportPath,report);
  if(!simulation) {
   check(sameSource(),'STATIC_SOURCE_DRIFT');
   accepted=helpers.collectVerifiedExecution({reportPath,attestationPath,currentSourceFingerprint:source.fingerprint});
   writeJson(path.join(directory,'collected-execution.json'),accepted);
  }
 } catch(error){errorCode=/^STATIC_[A-Z_]+$/.test(error?.code??'')?error.code:'STATIC_COLLECTION_FAILED';}
 const valid=!simulation&&!errorCode&&accepted!==null;
 const summary={schemaVersion:'permission-full-static-stage-v1',scope:'ONE_STATIC_STAGE_ONLY',stage,profile:plan.profile,simulation,valid,
  status:errorCode?'FAIL':simulation?'SIMULATED_PASS':'STATIC_STAGE_PASS',code:errorCode,acceptedForAggregate:valid,
  source:{commit:source.commit,tree:source.tree,fingerprint:source.fingerprint,manifestSha256:source.manifestSha256},
  inventory:{files:plan.files,requiredVariants:plan.required.length,variantOccurrences:plan.variantOccurrences},
  counts:checked?{discovered:checked.discoveredCount,executed:checked.executedCount}:null,phases,
  fullGate:'NOT_RUN',serviceStages:'REFUSED',pinRuntime:'REFUSED',hp1:'RETIRED_NOT_RUN',cleanup:'NOT_PERFORMED',upload:'NOT_PERFORMED'};
 writeJson(path.join(directory,'summary.json'),summary);
 return {...summary,directory};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href) {
 try {
  const args=process.argv.slice(2);check(args.length===4&&args[0]==='--stage'&&args[2]==='--output-root','STATIC_ARGUMENT_REFUSED');
  const result=await runStaticStage({stage:args[1],outputRoot:path.resolve(args[3])});
  console.log(JSON.stringify({stage:result.stage,status:result.status,valid:result.valid,code:result.code,counts:result.counts,fullGate:result.fullGate}));
  if(!result.valid)process.exitCode=1;
 }catch(error){console.error(/^STATIC_[A-Z_]+$/.test(error?.code??'')?error.code:'STATIC_STAGE_BLOCKED');process.exitCode=1;}
}
