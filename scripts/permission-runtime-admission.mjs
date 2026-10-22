import {readFileSync,lstatSync,realpathSync,statfsSync,readdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {inspectBatch,reserveBatchAction,reservePublicationPair,reserveHeavyProfile,assertBatchScope} from './permission-batch-budget.mjs';
import {PROJECT_PHASES,PROJECT_REPOSITORY_ID} from './project-ci-results.mjs';
import {publicEdgeResolution,assertEdgeResolution} from './permission-edge-resolution.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const check=(value,reason)=>{if(!value)throw Object.assign(Error('PERMISSION_RUNTIME_ADMISSION_REFUSED'),{reason});};
const activeStatuses=['queued','in_progress','waiting','requested','pending'];
const profiles=['SUPABASE_T04','PIN_ONBOARD','SUPABASE_T02','PIN_RACE','PIN_EXPIRY','PIN_IDENTITY_SERVER','PIN_IDENTITY_ONBOARDING','PIN_CANARY'];
function read(ref){
 check(ref&&typeof ref.path==='string'&&/^[a-f0-9]{64}$/.test(ref.sha256??''),'REF');
 const path=resolve(ref.path),stat=lstatSync(path);
 check(stat.isFile()&&!stat.isSymbolicLink()&&stat.nlink===1&&stat.size<=4*1024**2&&realpathSync(path)===path,'REF_FILE');
 const bytes=readFileSync(path);check(sha(bytes)===ref.sha256,'REF_HASH');return JSON.parse(bytes);
}

export function validateAdmissionEvidence({manifest:m,packet,reviews,light,native,local,prior,disks,retainedBytes,activeJobs,wslPresent,edgeInputs},kind){
 const v2=m.schemaVersion==='permission-runtime-admission-v2';
 check((v2||m.schemaVersion==='permission-runtime-admission-v1')&&m.repository==='nguyentronglinh045/pos-cafe'&&m.branch==='run/permissions-20261020'
  &&/^[a-f0-9]{40}$/.test(m.sourceSHA??'')&&['publish','heavy'].includes(kind),'MANIFEST');
 if(v2){
  check(packet.sourceSHA===m.sourceSHA&&Array.isArray(packet.authors)&&packet.authors.length>0&&packet.authors.length<=10
   &&new Set(packet.authors).size===packet.authors.length&&packet.authors.every(a=>typeof a==='string'&&a.trim().length>0),'AUTHORS');
  check(local?.schemaVersion==='permission-node-local-v1'&&local.sourceSHA===m.sourceSHA&&local.wholeTrackedSuite===true
   &&Number.isSafeInteger(local.tests)&&local.tests>=904&&local.pass===local.tests&&local.fail===0&&local.skip===0&&local.exitCode===0
   &&packet.localSHA256===m.local?.sha256,'LOCAL_CHECKS');
 }
 const independent=r=>!v2||!packet.authors.includes(r.name);
 check(reviews.candidateSHA256===m.packet.sha256&&Array.isArray(reviews.reviewers)
  &&reviews.reviewers.some(a=>a.scope==='source'&&a.verdict==='APPROVE'&&typeof a.name==='string'&&a.name.length>0&&independent(a)
   &&reviews.reviewers.some(b=>b.scope==='operations'&&b.verdict==='APPROVE'&&typeof b.name==='string'&&b.name.length>0&&a.name!==b.name&&independent(b))),'REVIEWS');
 check(packet.admission&&['repository','branch','sourceRoot','expectedRemoteSHA','retainedRoots','knownHistoricalLinks'].every(k=>JSON.stringify(packet.admission[k])===JSON.stringify(m[k])),'REVIEWED_OPERATION_SCOPE');
 check(packet.workstreamId===m.workstreamId&&packet.budget&&m.budget&&packet.budget.path===m.budget.path&&packet.budget.sha256===m.budget.sha256,'REVIEWED_BUDGET');
 check(Array.isArray(m.retainedRoots)&&m.retainedRoots.length>0&&m.retainedRoots.length<=10&&new Set(m.retainedRoots).size===m.retainedRoots.length
  &&m.retainedRoots.every(p=>typeof p==='string'&&/^[A-Z]:[\\/]/i.test(p)),'RETAINED_ROOTS');
 check(Array.isArray(packet.effectivePins)&&packet.effectivePins.length>0&&packet.effectivePins.length<=2000
  &&new Set(packet.effectivePins.map(p=>p.path)).size===packet.effectivePins.length
  &&packet.effectivePins.every(p=>typeof p.path==='string'&&!p.path.includes('..')&&!/[\\:\r\n\0]/.test(p.path)&&!p.path.startsWith('/')&&/^[a-f0-9]{64}$/.test(p.sha256??'')),'PINS');
 check(Array.isArray(disks)&&disks.length===2&&disks.every(d=>['C:/','D:/'].includes(d.path)&&d.freeBytes>=30*1024**3)
  &&new Set(disks.map(d=>d.path)).size===2&&Number.isSafeInteger(retainedBytes)&&retainedBytes>=0&&retainedBytes<=768*1024**2,'DISK');
 check(activeJobs===0&&wslPresent===false,'ACTIVE_RUNTIME');
 check(prior?.reclaim?.length===1&&prior.reclaim[0].status==='RECLAIMED'&&prior.reclaim[0].imageUnlinked===true&&prior.reclaim[0].measuredHostFreeDeltaBytes>0,'PRIOR_RECLAIM');
 if(kind==='heavy'){
  check(profiles.includes(m.profile),'PROFILE');
  check(light?.schemaVersion==='pos-cafe-light-ci-v1'&&light.repository===m.repository&&light.repositoryID===PROJECT_REPOSITORY_ID&&light.event==='push'
   &&light.sourceSHA===m.sourceSHA&&light.workflowSHA===m.sourceSHA&&/^[1-9][0-9]{0,19}$/.test(light.runId??'')&&Number.isSafeInteger(light.attempt)&&light.attempt>=1
   &&light.sourcePreserved===true&&light.overallStatus==='PASS'&&JSON.stringify(light.phases?.map(p=>p.id))===JSON.stringify(PROJECT_PHASES)
   &&light.phases.every(p=>p.status==='PASS'&&p.exitCode===0)&&Number.isSafeInteger(light.peakOwnedBytes)&&light.peakOwnedBytes>=0&&light.peakOwnedBytes<=5*1024**3,'OWN_CI');
  const c=light.phases.find(p=>p.id==='runtime-reporters')?.counts,d=c?.diagnosticControls;
  check(c?.run===4&&c.pass===4&&c.fail===0&&c.skip===0&&c.positiveControls===2&&c.negativeControls===2
   &&d?.sourceSHA===m.sourceSHA&&d.lockSHA===light.lockSHA&&d.run===7&&d.pass===7&&d.fullPipeline===true&&d.mutationChecks===20
   &&JSON.stringify(d.states)===JSON.stringify(['failed','timedOut','interrupted','runner-error','metadata-absent','wrapper-failure','transport-refusal']),'DIAGNOSTIC_CONTROLS');
  check(native?.sourceSHA===m.sourceSHA&&native.runId===light.runId&&native.status==='NOT_PRESENT'&&native.rootRemoved===true&&native.processReleased===true,'NATIVE_CLEANUP');
  const edge=publicEdgeResolution(light.phases.find(p=>p.id==='edge-resolution')?.counts?.edgeResolution,m.sourceSHA);
  check(edgeInputs&&edge.lockSHA256===edgeInputs.lockSHA256&&edge.configSHA256===edgeInputs.configSHA256,'EDGE_RESOLUTION');
 }
 return {status:'ADMITTED',sourceSHA:m.sourceSHA,kind};
}

// Check every active status for the workflow repository-wide, including branches
// absent from the candidate's latest 30 runs. Positive or uncertain results block.
export function collectActiveBackendRuns(repository,run=execFileSync,cwd){
 check(repository==='nguyentronglinh045/pos-cafe','MANIFEST');
 let active=0;
 for(const status of activeStatuses){
  const endpoint=`repos/${repository}/actions/workflows/backend.yml/runs?status=${status}&per_page=100`;
  const pages=JSON.parse(run('gh',['api','--paginate','--slurp',endpoint],{cwd,encoding:'utf8',timeout:30000,maxBuffer:4*1024**2,windowsHide:true}));
  check(Array.isArray(pages)&&pages.length>0,'ACTIVE_API');
  for(const page of pages){
   check(Number.isSafeInteger(page.total_count)&&page.total_count>=0&&Array.isArray(page.workflow_runs),'ACTIVE_API');
   check(page.workflow_runs.every(r=>Number.isSafeInteger(r.id)&&r.id>0&&r.path==='.github/workflows/backend.yml'&&r.status===status),'ACTIVE_API');
   check(page.total_count!==0||page.workflow_runs.length===0,'ACTIVE_API');
   active+=Math.max(page.total_count,page.workflow_runs.length);
  }
 }
 return active;
}

// The same sequence is used by production and negative controls. A refusal after
// reservation never returns the spent action or frees its pending intent.
export function guardAdmissionAction({collect,reserve,act,clock=Date.now,reserveMs,dispatch=false}){
 const before=collect();
 if(!dispatch)return {...before,dispatch:false};
 let reservation;
 try{
  reservation=reserve(clock());
  const after=collect(reservation.reservationId),now=clock(),deadline=Date.parse(after.budget.deadlineUtc);
  check(Number.isSafeInteger(now)&&Number.isSafeInteger(reserveMs)&&reserveMs>=0&&Number.isFinite(deadline)&&now+reserveMs<deadline,'DEADLINE');
  act();return {...after,dispatch:true,reservationId:reservation.reservationId};
 }catch(error){if(reservation?.reservationId)error.reservationId=reservation.reservationId;throw error;}
}

export function runtimeAdmission(manifestPath,kind,{dispatch=false,identity,clock=Date.now,run=execFileSync}={}){
 const manifestFile=resolve(manifestPath),initial=readFileSync(manifestFile),m=JSON.parse(initial);
 check(m.repository==='nguyentronglinh045/pos-cafe'&&m.branch==='run/permissions-20261020'&&typeof m.sourceRoot==='string','MANIFEST');
 const v2=m.schemaVersion==='permission-runtime-admission-v2',reserveMs=(v2||kind==='heavy'?42:37)*60000;
 const cwd=realpathSync(m.sourceRoot),git=args=>run('git',args,{cwd,timeout:30000,maxBuffer:1024**2,windowsHide:true});
 const context={repository:m.repository,branch:m.branch,sourceRoot:cwd,sourceSHA:m.sourceSHA,...(kind==='heavy'?{profile:m.profile}:{})};
 const collect=reservationId=>{
  const stat=lstatSync(manifestFile);
  check(stat.isFile()&&!stat.isSymbolicLink()&&stat.nlink===1&&stat.size<=128*1024&&realpathSync(manifestFile)===manifestFile&&sha(readFileSync(manifestFile))===sha(initial),'MANIFEST_FILE');
  check(realpathSync(m.sourceRoot)===cwd,'SOURCE_DRIFT');
  const packet=read(m.packet),reviews=read(m.reviews),prior=read(m.prior),local=v2?read(m.local):null;
  const light=kind==='heavy'?read(m.light):null,native=kind==='heavy'?read(m.native):null;
  const skip=new Set(m.knownHistoricalLinks??[]);check([...skip].every(x=>/^test-junction-[a-f0-9-]{36}$/.test(x)),'HISTORICAL_LINKS');
  const measure=path=>{const s=lstatSync(path);if(s.isSymbolicLink()){check(skip.has(path.split(/[\\/]/).at(-1)),'LINK');return 0;}return s.isFile()?s.size:readdirSync(path).reduce((n,x)=>n+measure(join(path,x)),0);};
  const disks=['C:/','D:/'].map(path=>{const s=statfsSync(path);return {path,freeBytes:s.bavail*s.bsize};});
  const retainedBytes=m.retainedRoots.reduce((n,path)=>n+measure(path),0);
  const runs=JSON.parse(run('gh',['run','list','--repo',m.repository,'--branch',m.branch,'--limit','30','--json','status'],{cwd,encoding:'utf8',timeout:30000,windowsHide:true}));
  check(Array.isArray(runs)&&runs.every(r=>['completed',...activeStatuses].includes(r.status)),'ACTIVE_API');
  const result=validateAdmissionEvidence({manifest:m,packet,reviews,prior,light,native,local,disks,retainedBytes,
   activeJobs:runs.filter(r=>r.status!=='completed').length+collectActiveBackendRuns(m.repository,run,cwd),
   wslPresent:!!run('wsl',['--list','--quiet'],{encoding:'utf16le',timeout:15000,windowsHide:true}).replaceAll('\0','').trim(),
   edgeInputs:kind==='heavy'?assertEdgeResolution(join(cwd,'tests/permissions/runtime/edge-resolution'),JSON.parse(readFileSync(join(cwd,'tests/permissions/runtime/ci1-edge.json')))):null},kind);
  check(git(['rev-parse','HEAD']).toString().trim()===m.sourceSHA&&!git(['diff','--name-only','HEAD','--']).toString().trim(),'SOURCE_DRIFT');
  for(const pin of packet.effectivePins)check(sha(git(['show',m.sourceSHA+':'+pin.path]))===pin.sha256,'GIT_BLOB');
  const remote=git(['ls-remote','origin','refs/heads/'+m.branch]).toString().split(/\s+/)[0];
  check(remote===(kind==='publish'?m.expectedRemoteSHA:m.sourceSHA),'REMOTE_DRIFT');
  const options={now:clock(),reserveMs,reservationId};
  const budget=v2?assertBatchScope(m.budget.path,{...context,...options}):inspectBatch(m.budget.path,options);
  check(budget.admitted&&budget.policySHA256===m.budget.sha256&&budget.workstreamId===m.workstreamId,'BATCH_BUDGET');
  check(v2?budget.schemaVersion==='permission-batch-budget-v4':budget.schemaVersion!=='permission-batch-budget-v4','BUDGET_VERSION');
  return {...result,budget,retainedBytes,disks};
 };
 return guardAdmissionAction({collect,clock,reserveMs,dispatch,
  reserve:now=>{
   check(/^[A-Za-z0-9_.:-]{1,100}$/.test(identity??''),'IDENTITY');
   if(v2)return (kind==='publish'?reservePublicationPair:reserveHeavyProfile)(m.budget.path,{...context,identity,now,reserveMs});
   if(kind==='publish'){
    reserveBatchAction(m.budget.path,{kind:'publication',sourceSHA:m.sourceSHA,identity,now,reserveMs});
    reserveBatchAction(m.budget.path,{kind:'ci',sourceSHA:m.sourceSHA,identity:identity+'-auto-ci',now,reserveMs});
   }else reserveBatchAction(m.budget.path,{kind:'heavy',sourceSHA:m.sourceSHA,identity,now,reserveMs});
   return {reservationId:undefined};
  },
  act:()=>{
   if(kind==='publish')run('git',['push','origin',m.sourceSHA+':refs/heads/'+m.branch],{cwd,timeout:60000,windowsHide:true,stdio:'pipe'});
   else{
    const t04=m.profile==='SUPABASE_T04',args=['workflow','run','backend.yml','--repo',m.repository,'--ref',m.branch,'-f','confirmation='+(t04?'RUN_T04_PROFILE':'RUN_SERVICE_PROFILE'),'-f','expected_source_sha='+m.sourceSHA];
    if(!t04)args.push('-f','runtime_profile='+m.profile);
    run('gh',args,{cwd,timeout:30000,windowsHide:true,stdio:'pipe'});
   }
  }
 });
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{const[kind,path,identity,flag]=process.argv.slice(2);console.log(JSON.stringify(runtimeAdmission(path,kind,{identity,dispatch:flag==='--dispatch'})));}
 catch(error){console.log(JSON.stringify({status:'REFUSED',code:'PERMISSION_RUNTIME_ADMISSION_REFUSED',reason:error.reason??'IO_OR_PARSE',...(error.reservationId?{reservationId:error.reservationId}:{})}));process.exitCode=1;}
}
