// New22Oct publication phase only. The21Oct ledger remains CLOSED and immutable.
import{readFileSync,lstatSync,realpathSync,statfsSync,openSync,writeFileSync,fsyncSync,closeSync}from'node:fs';
import{resolve,isAbsolute,dirname}from'node:path';import{execFileSync}from'node:child_process';import{createHash}from'node:crypto';import{pathToFileURL}from'node:url';
const GiB=1024**3,ROOT='D:/Workspace/pos-cafe-permission-run-20261020';
export const RELEASE_PHASE=Object.freeze({id:'permission-release-20261022',repository:'nguyentronglinh045/pos-cafe',branch:'run/permissions-20261020',sourceRoot:ROOT+'/code',
 deadlineUtc:'2026-10-22T04:00:00.000Z',publicationCutoffUtc:'2026-10-22T03:15:00.000Z',reserveMs:37*60000,
 predecessorPolicy:ROOT+'/evidence/loop-prevention-20261021/budget-edge-resolution-2300.json',predecessorJournal:ROOT+'/evidence/loop-prevention-20261021/budget-edge-resolution-2300.json.journal.jsonl',
 policySHA256:'3c222cb3a5b66a37107522ddce08c2fc8f68e99777f4a921aeb0eba2c936797c',journalSHA256:'583f336dafa025e3088e0afc1dad23be68b2324c6e5f37facc11ca230d372880',
 claim:ROOT+'/evidence/permission-release-20261022/publication-autoci.claim.json'});
export const RELEASE_PHASE_TOOLS=Object.freeze(['scripts/permission-release-phase-admission.mjs','scripts/permission-release-phase-admission.test.mjs','scripts/permission-release-phase-admission.README.md']);
export const RECOVERY_EXCLUSIONS=Object.freeze(['permission-recovery-capture-controller.mjs','permission-recovery-capture.mjs','permission-recovery-capture.ps1','permission-recovery-cleanup.mjs','permission-recovery-output.mjs','permission-recovery-output.test.mjs','permission-recovery-owner-acl.mjs','permission-recovery-owner-acl.test.mjs','permission-recovery-restore.mjs','permission-recovery-schema.mjs','permission-recovery-schema.test.mjs','permission-recovery-storage.mjs','permission-recovery-toc.mjs','permission-recovery-toc.test.mjs','permission-recovery-tools.mjs'].map(p=>'scripts/'+p));
const COUNTS=Object.freeze({publication:2,ci:2,heavy:1,reviewRounds:6}),AUTHORS=['/root','/root/release_gate_feasibility_20261022'];
const check=(ok,reason)=>{if(!ok)throw Object.assign(Error('PERMISSION_RELEASE_PHASE_REFUSED'),{reason});};
const hex=(v,n)=>typeof v==='string'&&new RegExp('^[a-f0-9]{'+n+'}$').test(v),integer=v=>Number.isSafeInteger(v)&&v>=0;
const canonical=v=>JSON.stringify(v,(_k,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.entries(x).sort(([a],[b])=>a.localeCompare(b))):x);
export const releasePhaseHash=bytes=>createHash('sha256').update(bytes).digest('hex');
export const RELEASE_OPEN_PR_PATH='repos/'+RELEASE_PHASE.repository+'/pulls?state=open&head='+encodeURIComponent(RELEASE_PHASE.repository.split('/')[0]+':'+RELEASE_PHASE.branch)+'&per_page=1';
export function candidatePullRequestCount(value){
 check(Array.isArray(value)&&value.length<=1,'PR_RESPONSE');
 for(const pr of value)check(pr&&Number.isSafeInteger(pr.number)&&pr.number>0&&pr.state==='open'&&pr.head?.ref===RELEASE_PHASE.branch
  &&pr.head?.repo?.full_name===RELEASE_PHASE.repository&&pr.base?.repo?.full_name===RELEASE_PHASE.repository,'PR_RESPONSE');
 return value.length;
}
const keys=(v,names)=>check(v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join(',')===names.slice().sort().join(','),'SCHEMA');
export const releasePhaseScope=p=>Object.fromEntries(Object.entries(p).filter(([key])=>!['packet','reviews'].includes(key)));
const reference=r=>{keys(r,['path','sha256']);check(typeof r.path==='string'&&/^[A-Z]:[\\/]/i.test(r.path)&&hex(r.sha256,64),'REFERENCE');};
function validateReleaseScope(p,packet,reviews){
 keys(p,['schemaVersion','phaseId','repository','branch','sourceRoot','sourceSHA','expectedRemoteSHA','deadlineUtc','publicationCutoffUtc','predecessor','storage','packet','reviews']);
 check(p.schemaVersion==='permission-release-phase-admission-v1'&&p.phaseId===RELEASE_PHASE.id&&p.repository===RELEASE_PHASE.repository&&p.branch===RELEASE_PHASE.branch
  &&p.sourceRoot===RELEASE_PHASE.sourceRoot&&hex(p.sourceSHA,40)&&hex(p.expectedRemoteSHA,40)&&p.sourceSHA!==p.expectedRemoteSHA,'SCOPE');
 check(p.deadlineUtc===RELEASE_PHASE.deadlineUtc&&p.publicationCutoffUtc===RELEASE_PHASE.publicationCutoffUtc,'DEADLINE_POLICY');
 keys(p.predecessor,['policySHA256','journalSHA256','counts']);check(p.predecessor.policySHA256===RELEASE_PHASE.policySHA256&&p.predecessor.journalSHA256===RELEASE_PHASE.journalSHA256
  &&canonical(p.predecessor.counts)===canonical(COUNTS),'PREDECESSOR');
 keys(p.storage,['baselineFreeBytes','taskMaximumBytes','reserveBytes','ciMaximumBytes']);keys(p.storage.baselineFreeBytes,['C','D']);
 check(p.storage.taskMaximumBytes===20*GiB&&p.storage.reserveBytes===30*GiB&&p.storage.ciMaximumBytes===5*GiB
  &&Object.values(p.storage.baselineFreeBytes).every(v=>integer(v)&&v>=30*GiB),'STORAGE_POLICY');reference(p.packet);reference(p.reviews);
 keys(packet,['schemaVersion','sourceSHA','admission','authors','sourcePins']);
 check(packet.schemaVersion==='permission-release-phase-packet-v1'&&packet.sourceSHA===p.sourceSHA&&canonical(packet.admission)===canonical(releasePhaseScope(p)),'PACKET_BINDING');
 check(Array.isArray(packet.authors)&&packet.authors.length>=2&&packet.authors.length<=20&&new Set(packet.authors).size===packet.authors.length
  &&packet.authors.every(v=>typeof v==='string'&&v.length>0&&v.length<=200)&&AUTHORS.every(a=>packet.authors.includes(a)),'AUTHORS');
 check(Array.isArray(packet.sourcePins)&&packet.sourcePins.length>=3&&packet.sourcePins.length<=2000&&new Set(packet.sourcePins.map(x=>x.path)).size===packet.sourcePins.length,'SOURCE_PINS');
 for(const pin of packet.sourcePins){keys(pin,['path','sha256']);check(typeof pin.path==='string'&&/^[A-Za-z0-9_./-]+$/.test(pin.path)&&!pin.path.startsWith('/')&&!pin.path.includes('..')
  &&hex(pin.sha256,64)&&!RECOVERY_EXCLUSIONS.includes(pin.path),'SOURCE_PINS');}
 check(RELEASE_PHASE_TOOLS.every(path=>packet.sourcePins.some(pin=>pin.path===path)),'TOOL_PINS');
 keys(reviews,['candidateSHA256','reviewers']);check(reviews.candidateSHA256===p.packet.sha256&&Array.isArray(reviews.reviewers)&&reviews.reviewers.length===2,'REVIEWS');
 for(const r of reviews.reviewers){keys(r,['name','scope','verdict']);check(typeof r.name==='string'&&r.name.length>0&&r.name.length<=200&&!packet.authors.includes(r.name)&&r.verdict==='APPROVE','REVIEWS');}
 check(new Set(reviews.reviewers.map(r=>r.name)).size===2&&reviews.reviewers.map(r=>r.scope).sort().join(',')==='operations,source','REVIEWS');
}
export function requireReleaseMoment(p,nowMs){
 check(p.deadlineUtc===RELEASE_PHASE.deadlineUtc&&p.publicationCutoffUtc===RELEASE_PHASE.publicationCutoffUtc,'DEADLINE_POLICY');
 check(integer(nowMs)&&nowMs>=Date.parse('2026-10-22T00:00:00.000Z')&&nowMs<Date.parse(p.publicationCutoffUtc)
  &&Date.parse(p.deadlineUtc)-nowMs>=RELEASE_PHASE.reserveMs,'DEADLINE');
}
// Capture time after the last observation, never before potentially slow I/O.
export function collectReleaseFacts(readFacts,clock=Date.now){const facts=readFacts();return{...facts,nowMs:clock()};}
export function runAtReleaseMoment(p,action,clock=Date.now){requireReleaseMoment(p,clock());return action();}
export function validateReleasePhase(p,packet,reviews,f){
 validateReleaseScope(p,packet,reviews);requireReleaseMoment(p,f.nowMs);
 check(f.predecessorPolicySHA256===RELEASE_PHASE.policySHA256&&f.predecessorJournalSHA256===RELEASE_PHASE.journalSHA256&&f.predecessorClosed===true,'PREDECESSOR_CHANGED');
 check(f.head===p.sourceSHA&&f.branch===p.branch&&f.sourceRoot===p.sourceRoot&&f.trackedClean===true&&f.remoteSHA===p.expectedRemoteSHA&&f.fastForward===true,'SOURCE_OR_REMOTE');
 check(Array.isArray(f.untracked)&&f.untracked.length===RECOVERY_EXCLUSIONS.length&&new Set(f.untracked).size===RECOVERY_EXCLUSIONS.length&&f.untracked.every(x=>RECOVERY_EXCLUSIONS.includes(x)),'UNTRACKED');
 check(Array.isArray(f.tracked)&&Array.isArray(f.pinMatches)&&f.pinMatches.length===packet.sourcePins.length&&f.pinMatches.every(v=>v===true)
  &&packet.sourcePins.every(pin=>f.tracked.includes(pin.path))&&!RECOVERY_EXCLUSIONS.some(path=>f.tracked.includes(path)),'SOURCE_OR_TOOL_PINS');
 check(f.originMatches===true&&f.activeJobs===0&&f.claimPresent===false,'REMOTE_OR_CLAIM');
 check(f.openPullRequests===0,'OPEN_PULL_REQUEST');
 keys(f.freeBytes,['C','D']);check(Object.values(f.freeBytes).every(v=>integer(v)&&v>=30*GiB),'DISK_RESERVE');
 const windowsGrowthBytes=['C','D'].reduce((n,d)=>n+Math.max(0,p.storage.baselineFreeBytes[d]-f.freeBytes[d]),0);
 check(Number.isSafeInteger(windowsGrowthBytes)&&windowsGrowthBytes+5*GiB<=20*GiB,'TASK_GROWTH');
 return{status:'ADMITTED',phaseId:p.phaseId,sourceSHA:p.sourceSHA,predecessorStatus:'CLOSED',predecessorCounts:{...COUNTS},newActions:{publication:1,ci:1},windowsGrowthBytes,reservedCIBytes:5*GiB};
}
function readRegular(path,max=4*1024**2){check(isAbsolute(path),'PATH');const s=lstatSync(path);check(s.isFile()&&!s.isSymbolicLink()&&s.nlink===1&&s.size<=max&&realpathSync(path)===resolve(path),'FILE');return readFileSync(path);}
function readReference(ref){reference(ref);const bytes=readRegular(ref.path);check(releasePhaseHash(bytes)===ref.sha256,'REFERENCE_CHANGED');return JSON.parse(bytes);}
// One combined exclusive reservation precedes the callback. Failure, crash or
// uncertain push keeps it spent. No reset/delete/alternate claim path in the CLI.
export function claimReleasePublication(path,payload,publish,beforeConsume=()=>{}){
 const s=lstatSync(dirname(path));check(s.isDirectory()&&!s.isSymbolicLink()&&realpathSync(dirname(path))===resolve(dirname(path)),'CLAIM_PARENT');
 beforeConsume();
 const fd=openSync(path,'wx',0o600);try{writeFileSync(fd,JSON.stringify(payload)+'\n');fsyncSync(fd);}finally{closeSync(fd);}return publish();
}
export function releasePhaseAdmission(policyPath,{dispatch=false}={}){
 check(process.platform==='win32'&&typeof dispatch==='boolean','PLATFORM');const policyBytes=readRegular(resolve(policyPath),128*1024),p=JSON.parse(policyBytes);
 check(p.sourceRoot===RELEASE_PHASE.sourceRoot&&p.repository===RELEASE_PHASE.repository&&p.branch===RELEASE_PHASE.branch,'SCOPE');
 const packet=readReference(p.packet),reviews=readReference(p.reviews);validateReleaseScope(p,packet,reviews);const cwd=realpathSync(p.sourceRoot);
 const command=(name,args,max=4*1024**2)=>execFileSync(name,args,{cwd,encoding:'utf8',windowsHide:true,timeout:30000,maxBuffer:max,stdio:['ignore','pipe','pipe']});
 const git=args=>command('git',args),normal=path=>path.replaceAll('\\','/');
 const collect=()=>collectReleaseFacts(()=>{
  check(normal(git(['rev-parse','--show-toplevel']).trim())===normal(cwd),'GIT_ROOT');
  check(releasePhaseHash(readRegular(resolve(policyPath),128*1024))===releasePhaseHash(policyBytes),'POLICY_CHANGED');readReference(p.packet);readReference(p.reviews);
  const oldPolicy=readRegular(RELEASE_PHASE.predecessorPolicy),oldJournal=readRegular(RELEASE_PHASE.predecessorJournal);
  const journal=oldJournal.toString('utf8').trim().split('\n').map(line=>JSON.parse(line));
  const urls=[git(['remote','get-url','origin']).trim(),git(['remote','get-url','--all','--push','origin']).trim()];
  const allowed=['https://github.com/'+p.repository+'.git','git@github.com:'+p.repository+'.git'];
  const repository=JSON.parse(command('gh',['api','repos/'+p.repository]));check(repository.id===1263057386&&repository.full_name===p.repository&&repository.private===false,'REPOSITORY_IDENTITY');
  const activeJobs=['queued','in_progress','waiting','requested','pending'].reduce((sum,status)=>{const result=JSON.parse(command('gh',['api','repos/'+p.repository+'/actions/runs?status='+status+'&per_page=1']));check(integer(result.total_count),'JOBS_RESPONSE');return sum+result.total_count;},0);
  const openPullRequests=candidatePullRequestCount(JSON.parse(command('gh',['api',RELEASE_OPEN_PR_PATH])));
  const tracked=git(['ls-files','-z']).split('\0').filter(Boolean),untracked=git(['ls-files','--others','--exclude-standard','-z']).split('\0').filter(Boolean);
  const output=git(['ls-remote','origin','refs/heads/'+p.branch]).trim();check(new RegExp('^[a-f0-9]{40}\\s+refs/heads/'+p.branch+'$').test(output),'REMOTE_RESPONSE');
  let fastForward=false;try{git(['merge-base','--is-ancestor',p.expectedRemoteSHA,p.sourceSHA]);fastForward=true;}catch{}
  return{predecessorPolicySHA256:releasePhaseHash(oldPolicy),predecessorJournalSHA256:releasePhaseHash(oldJournal),predecessorClosed:journal.at(-1)?.type==='close',
   head:git(['rev-parse','HEAD']).trim(),branch:git(['branch','--show-current']).trim(),sourceRoot:normal(cwd),
   trackedClean:git(['diff','--no-ext-diff','--no-textconv','--name-only','HEAD','--']).trim()===''&&git(['ls-files','-v','-z']).split('\0').filter(Boolean).every(line=>line.startsWith('H ')),
   remoteSHA:output.split(/\s/)[0],fastForward,tracked,untracked,pinMatches:packet.sourcePins.map(pin=>{const path=resolve(cwd,pin.path),s=lstatSync(path);return tracked.includes(pin.path)&&s.isFile()&&!s.isSymbolicLink()&&s.nlink===1&&realpathSync(path)===path
    &&releasePhaseHash(execFileSync('git',['show',p.sourceSHA+':'+pin.path],{cwd,windowsHide:true,timeout:30000,maxBuffer:4*1024**2,stdio:['ignore','pipe','pipe']}))===pin.sha256;}),
   originMatches:urls.every(url=>allowed.includes(url)),activeJobs,openPullRequests,claimPresent:!!lstatSync(RELEASE_PHASE.claim,{throwIfNoEntry:false}),
   freeBytes:Object.fromEntries(['C','D'].map(d=>{const s=statfsSync(d+':/');return[d,s.bavail*s.bsize];}))};
 });
 const facts=collect(),decision=validateReleasePhase(p,packet,reviews,facts);if(!dispatch)return{...decision,dispatch:false};
 const claim={schemaVersion:'permission-release-phase-publication-claim-v1',phaseId:p.phaseId,atUtc:new Date().toISOString(),policySHA256:releasePhaseHash(policyBytes),packetSHA256:p.packet.sha256,reviewsSHA256:p.reviews.sha256,
  sourceSHA:p.sourceSHA,expectedRemoteSHA:p.expectedRemoteSHA,predecessor:p.predecessor,actions:{publication:1,ci:1}};
 return claimReleasePublication(RELEASE_PHASE.claim,claim,()=>{
  const fresh=collect();check(fresh.claimPresent,'CLAIM_LOST');fresh.claimPresent=false;validateReleasePhase(p,packet,reviews,fresh);
  check(releasePhaseHash(readRegular(RELEASE_PHASE.claim))===releasePhaseHash(Buffer.from(JSON.stringify(claim)+'\n')),'CLAIM_CHANGED');
  runAtReleaseMoment(p,()=>command('git',['-c','remote.origin.mirror=false','-c','push.followTags=false','push','--porcelain','--no-verify','--recurse-submodules=no','origin',p.sourceSHA+':refs/heads/'+p.branch]));
  return{...decision,dispatch:true,publicationAttempted:true,automaticCI:'EXPECTED_NOT_YET_VERIFIED'};
 },()=>requireReleaseMoment(p,Date.now()));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){try{
 const args=process.argv.slice(2);check(args.length>=1&&args.length<=2&&(args.length===1||args[1]==='--dispatch'),'ARGUMENTS');console.log(JSON.stringify(releasePhaseAdmission(args[0],{dispatch:args[1]==='--dispatch'})));
}catch(error){console.log(JSON.stringify({status:'REFUSED',code:'PERMISSION_RELEASE_PHASE_REFUSED',reason:error.reason??(error.code==='EEXIST'?'ALREADY_CLAIMED':'IO_OR_REMOTE')}));process.exitCode=1;}}
