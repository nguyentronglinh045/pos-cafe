import{readFileSync,lstatSync,realpathSync,statfsSync,readdirSync}from'node:fs';import{resolve,join}from'node:path';import{execFileSync}from'node:child_process';import{createHash}from'node:crypto';import{pathToFileURL}from'node:url';
import{inspectBatch,reserveBatchAction}from'./permission-batch-budget.mjs';
import{PROJECT_PHASES,PROJECT_REPOSITORY_ID}from'./project-ci-results.mjs';
import{publicEdgeResolution,assertEdgeResolution}from'./permission-edge-resolution.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');const check=(v,reason)=>{if(!v)throw Object.assign(Error('PERMISSION_RUNTIME_ADMISSION_REFUSED'),{reason});};
const read=ref=>{check(ref&&typeof ref.path==='string'&&/^[a-f0-9]{64}$/.test(ref.sha256??''),'REF');const p=resolve(ref.path),s=lstatSync(p);check(s.isFile()&&!s.isSymbolicLink()&&s.nlink===1&&s.size<=4*1024**2&&realpathSync(p)===p,'REF_FILE');const b=readFileSync(p);check(sha(b)===ref.sha256,'REF_HASH');return JSON.parse(b);};
export function validateAdmissionEvidence({manifest:m,packet,reviews,light,native,prior,disks,retainedBytes,activeJobs,wslPresent,edgeInputs},kind){
 check(m.schemaVersion==='permission-runtime-admission-v1'&&m.repository==='nguyentronglinh045/pos-cafe'&&m.branch==='run/permissions-20261020'
  &&/^[a-f0-9]{40}$/.test(m.sourceSHA??'')&&['publish','heavy'].includes(kind),'MANIFEST');
 check(reviews.candidateSHA256===m.packet.sha256&&Array.isArray(reviews.reviewers)
  &&reviews.reviewers.some(a=>a.scope==='source'&&a.verdict==='APPROVE'&&typeof a.name==='string'&&a.name.length>0
   &&reviews.reviewers.some(b=>b.scope==='operations'&&b.verdict==='APPROVE'&&typeof b.name==='string'&&b.name.length>0&&a.name!==b.name)),'REVIEWS');
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
  check(['SUPABASE_T04','PIN_ONBOARD','SUPABASE_T02','PIN_RACE','PIN_EXPIRY','PIN_IDENTITY_SERVER','PIN_IDENTITY_ONBOARDING','PIN_CANARY'].includes(m.profile),'PROFILE');
  check(light?.schemaVersion==='pos-cafe-light-ci-v1'&&light.repository===m.repository&&light.repositoryID===PROJECT_REPOSITORY_ID&&light.event==='push'
   &&light.sourceSHA===m.sourceSHA&&light.workflowSHA===m.sourceSHA&&/^[1-9][0-9]{0,19}$/.test(light.runId??'')&&Number.isSafeInteger(light.attempt)&&light.attempt>=1
   &&light.sourcePreserved===true&&light.overallStatus==='PASS'&&JSON.stringify(light.phases?.map(p=>p.id))===JSON.stringify(PROJECT_PHASES)
   &&light.phases.every(p=>p.status==='PASS'&&p.exitCode===0)&&Number.isSafeInteger(light.peakOwnedBytes)&&light.peakOwnedBytes>=0&&light.peakOwnedBytes<=5*1024**3,'OWN_CI');
  const d=light.phases.find(p=>p.id==='runtime-reporters')?.counts?.diagnosticControls;
  const c=light.phases.find(p=>p.id==='runtime-reporters').counts;
  check(c?.run===4&&c.pass===4&&c.fail===0&&c.skip===0&&c.positiveControls===2&&c.negativeControls===2
   &&d?.sourceSHA===m.sourceSHA&&d.lockSHA===light.lockSHA&&d.run===7&&d.pass===7&&d.fullPipeline===true&&d.mutationChecks===20
   &&JSON.stringify(d.states)===JSON.stringify(['failed','timedOut','interrupted','runner-error','metadata-absent','wrapper-failure','transport-refusal']),'DIAGNOSTIC_CONTROLS');
  check(native?.sourceSHA===m.sourceSHA&&native.runId===light.runId&&native.status==='NOT_PRESENT'&&native.rootRemoved===true&&native.processReleased===true,'NATIVE_CLEANUP');
  const e=publicEdgeResolution(light.phases.find(p=>p.id==='edge-resolution')?.counts?.edgeResolution,m.sourceSHA);
  check(edgeInputs&&e.lockSHA256===edgeInputs.lockSHA256&&e.configSHA256===edgeInputs.configSHA256,'EDGE_RESOLUTION');
 }
 return{status:'ADMITTED',sourceSHA:m.sourceSHA,kind};
}
export function runtimeAdmission(manifestPath,kind,{dispatch=false,identity}={}){
 const manifestFile=resolve(manifestPath),ms=lstatSync(manifestFile);check(ms.isFile()&&!ms.isSymbolicLink()&&ms.nlink===1&&ms.size<=128*1024&&realpathSync(manifestFile)===manifestFile,'MANIFEST_FILE');
 const m=JSON.parse(readFileSync(manifestFile));check(m.repository==='nguyentronglinh045/pos-cafe'&&m.branch==='run/permissions-20261020'&&typeof m.sourceRoot==='string','MANIFEST');
 const cwd=realpathSync(m.sourceRoot),git=args=>execFileSync('git',args,{cwd,timeout:30000,maxBuffer:1024**2,windowsHide:true});
 const packet=read(m.packet),reviews=read(m.reviews),prior=read(m.prior),light=kind==='heavy'?read(m.light):null,native=kind==='heavy'?read(m.native):null;
 const skip=new Set(m.knownHistoricalLinks??[]);check([...skip].every(x=>/^test-junction-[a-f0-9-]{36}$/.test(x)),'HISTORICAL_LINKS');
 const measure=p=>{const s=lstatSync(p);if(s.isSymbolicLink()){check(skip.has(p.split(/[\\/]/).at(-1)),'LINK');return 0;}return s.isFile()?s.size:readdirSync(p).reduce((n,x)=>n+measure(join(p,x)),0);};
 const disks=['C:/','D:/'].map(path=>{const s=statfsSync(path);return{path,freeBytes:s.bavail*s.bsize};});
 const retainedBytes=m.retainedRoots.reduce((n,p)=>n+measure(p),0);
 const runs=JSON.parse(execFileSync('gh',['run','list','--repo',m.repository,'--branch',m.branch,'--limit','30','--json','status'],{cwd,encoding:'utf8',timeout:30000,windowsHide:true}));
 const result=validateAdmissionEvidence({manifest:m,packet,reviews,prior,light,native,disks,retainedBytes,activeJobs:runs.filter(r=>r.status!=='completed').length,
  wslPresent:!!execFileSync('wsl',['--list','--quiet'],{encoding:'utf16le',timeout:15000,windowsHide:true}).replaceAll('\0','').trim(),
  edgeInputs:kind==='heavy'?assertEdgeResolution(join(cwd,'tests/permissions/runtime/edge-resolution'),JSON.parse(readFileSync(join(cwd,'tests/permissions/runtime/ci1-edge.json')))):null},kind);
 check(git(['rev-parse','HEAD']).toString().trim()===m.sourceSHA&&!git(['diff','--name-only','HEAD','--']).toString().trim(),'SOURCE_DRIFT');
 for(const p of packet.effectivePins)check(sha(git(['show',m.sourceSHA+':'+p.path]))===p.sha256,'GIT_BLOB');
 const remote=git(['ls-remote','origin','refs/heads/'+m.branch]).toString().split(/\s+/)[0];
 check(remote===(kind==='publish'?m.expectedRemoteSHA:m.sourceSHA),'REMOTE_DRIFT');
 const budget=inspectBatch(m.budget.path,{reserveMs:kind==='publish'?37*60000:42*60000});
 check(budget.admitted&&budget.policySHA256===m.budget.sha256&&budget.workstreamId===m.workstreamId,'BATCH_BUDGET');
 if(!dispatch)return{...result,dispatch:false,budget,retainedBytes,disks};
 check(/^[A-Za-z0-9_.:-]{1,100}$/.test(identity??''),'IDENTITY');
 if(kind==='publish'){
  reserveBatchAction(m.budget.path,{kind:'publication',sourceSHA:m.sourceSHA,identity,reserveMs:37*60000});
  reserveBatchAction(m.budget.path,{kind:'ci',sourceSHA:m.sourceSHA,identity:identity+'-auto-ci',reserveMs:37*60000});
  execFileSync('git',['push','origin',m.sourceSHA+':refs/heads/'+m.branch],{cwd,timeout:60000,windowsHide:true,stdio:'pipe'});
 }else{
  reserveBatchAction(m.budget.path,{kind:'heavy',sourceSHA:m.sourceSHA,identity,reserveMs:42*60000});
  const t04=m.profile==='SUPABASE_T04',args=['workflow','run','backend.yml','--repo',m.repository,'--ref',m.branch,'-f','confirmation='+(t04?'RUN_T04_PROFILE':'RUN_SERVICE_PROFILE'),'-f','expected_source_sha='+m.sourceSHA];
  if(!t04)args.push('-f','runtime_profile='+m.profile);execFileSync('gh',args,{cwd,timeout:30000,windowsHide:true,stdio:'pipe'});
 }
 return{...result,dispatch:true,identity};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){try{const[kind,path,identity,flag]=process.argv.slice(2);console.log(JSON.stringify(runtimeAdmission(path,kind,{identity,dispatch:flag==='--dispatch'})));}catch(e){console.log(JSON.stringify({status:'REFUSED',code:'PERMISSION_RUNTIME_ADMISSION_REFUSED',reason:e.reason??'IO_OR_PARSE'}));process.exitCode=1;}}
