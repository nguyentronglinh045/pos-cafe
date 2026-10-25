import {readFileSync,writeFileSync,mkdirSync,lstatSync,realpathSync,statfsSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {runtimeStageCatalog} from './permission-runtime-catalog.mjs';
import {runtimeHash} from './permission-runtime-results.mjs';
import {executeRuntimeStage,prepareRuntimeDirectory} from './permission-runtime-stage.mjs';
import {trackedFingerprint,allocatedBytes} from './project-ci.mjs';

const GiB=1024**3,refuse=()=>{throw Error('PERMISSION_STATIC_PROFILE_REFUSED');};
const catalog=runtimeStageCatalog().filter(s=>s.runtimeProfile==='STATIC');
const stages=catalog.map(s=>s.stage);
export function staticProfileCounts(receipt,binding){
  if(receipt?.schemaVersion!=='permission-static-profile-v1'||receipt.scope!=='PERMISSION_STATIC_ONLY'
    ||receipt.status!=='PASS'||receipt.failure!==null||receipt.fullBusinessRuntime!=='NOT_RUN'
    ||receipt.remainingBusinessStages!==30||receipt.supplementalOracles!=='NOT_PROVEN_BY_STATIC_PROFILE'
    ||receipt.sourceSHA!==binding.sourceSHA||receipt.sourceFingerprint!==binding.sourceFingerprint
    ||receipt.lockSHA!==binding.lockSHA||receipt.runId!==binding.runId
    ||!Array.isArray(receipt.stages)||receipt.stages.length!==catalog.length)refuse();
  const counts={run:0,pass:0,fail:0,skip:0};
  for(let i=0;i<catalog.length;i++){
    const row=receipt.stages[i],expected=catalog[i];
    if(row?.stage!==expected.stage||row.status!=='PASS'||row.sourceSHA!==binding.sourceSHA
      ||row.required!==expected.required.length||!Number.isSafeInteger(row.run)||row.run<row.required
      ||row.discovered!==row.run||row.pass!==row.run||row.fail!==0||row.skip!==0||row.retry!==0
      ||!['reportSHA','invocationSHA'].every(k=>/^[a-f0-9]{64}$/.test(row[k]??'')))refuse();
    counts.run+=row.run;counts.pass+=row.pass;
  }
  return counts;
}
export async function runStaticProfile(adapter){
  const rows=[];let failure=null;
  for(const stage of stages){
    if(failure){rows.push({stage,status:'NOT_RUN'});continue;}
    try{adapter.guard();const r=await adapter.stage(stage);
      if(r?.stage!==stage||r.status!=='PASS'||r.fail!==0||r.skip!==0||r.retry!==0||r.pass!==r.run
        ||r.required!==catalog.find(s=>s.stage===stage).required.length||!Number.isSafeInteger(r.run)||r.run<r.required)refuse();
      rows.push(r);
    }catch{failure=stage;rows.push({stage,status:'FAIL'});}
  }
  return {schemaVersion:'permission-static-profile-v1',scope:'PERMISSION_STATIC_ONLY',status:failure?'FAIL':'PASS',failure,
    stages:rows,fullBusinessRuntime:'NOT_RUN',remainingBusinessStages:30,supplementalOracles:'NOT_PROVEN_BY_STATIC_PROFILE'};
}
async function main(){
  if(process.platform!=='linux'||process.env.GITHUB_ACTIONS!=='true'||process.env.RUNNER_ENVIRONMENT!=='github-hosted'
    ||process.env.GITHUB_REPOSITORY!=='nguyentronglinh045/pos-cafe'||process.env.GITHUB_REPOSITORY_ID!=='1263057386')refuse();
  const root=realpathSync(process.cwd()),outputRoot=resolve(process.argv[2]??'');
  if(process.argv.length!==3||!outputRoot.startsWith(root+'/artifacts/')||lstatSync(outputRoot,{throwIfNoEntry:false}))refuse();
  // This entry is designed to run under the existing bounded light supervisor.
  const unit=`/system.slice/pos-cafe-light-r${process.env.GITHUB_RUN_ID}-a${process.env.GITHUB_RUN_ATTEMPT}.service`;
  if(readFileSync('/proc/self/cgroup','utf8').trim()!=='0::'+unit)refuse();
  const cg='/sys/fs/cgroup'+unit,scalar=n=>readFileSync(cg+'/'+n,'utf8').trim();
  if(scalar('cpu.max')!=='300000 100000'||scalar('memory.max')!==String(8*GiB)||scalar('memory.swap.max')!=='0'||scalar('pids.max')!=='1024')refuse();
  const git=args=>execFileSync('git',args,{cwd:root,encoding:'utf8',timeout:10000,maxBuffer:128*1024});
  const paths=git(['ls-files','-z']).split('\0').filter(Boolean).sort(),sourceSHA=git(['rev-parse','HEAD']).trim();
  if(sourceSHA!==process.env.GITHUB_SHA||git(['diff','--name-only','HEAD','--']).trim())refuse();
  const sourceFingerprint=trackedFingerprint(root,paths),lockSHA=runtimeHash(readFileSync(join(root,'package-lock.json')));
  const guard=()=>{
    for(const p of [root,process.env.RUNNER_TEMP]){const f=statfsSync(p);if(f.bavail*f.bsize<30*GiB)refuse();}
    if(allocatedBytes([root,process.env.RUNNER_TEMP])>5*GiB||Number(scalar('memory.current'))>=8*GiB)refuse();
    if(!/^oom 0$/m.test(scalar('memory.events'))||!/^oom_kill 0$/m.test(scalar('memory.events'))||!/^max 0$/m.test(scalar('pids.events')))refuse();
  };
  prepareRuntimeDirectory(root,outputRoot,guard);
  const deadline=Date.now()+7*60000;
  const receipt=await runStaticProfile({guard,stage:stage=>executeRuntimeStage(stage,{sourceRoot:root,outputRoot,
    baseEnv:process.env,sourceSHA,sourceFingerprint,lockSHA,runId:process.env.GITHUB_RUN_ID,guard,deadline})});
  Object.assign(receipt,{sourceSHA,sourceFingerprint,lockSHA,runId:process.env.GITHUB_RUN_ID});
  writeFileSync(join(outputRoot,'profile-safe.json'),JSON.stringify(receipt)+'\n',{flag:'wx',mode:0o600});
  console.log('PERMISSION_STATIC_PROFILE '+JSON.stringify(receipt));
  if(receipt.status!=='PASS')process.exitCode=1;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  try{await main();}catch{console.log('PERMISSION_STATIC_PROFILE_FAILED');process.exitCode=1;}
}
