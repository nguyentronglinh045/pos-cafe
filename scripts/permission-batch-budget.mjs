import{readFileSync,writeFileSync,openSync,closeSync,unlinkSync,lstatSync,realpathSync,renameSync,fsyncSync,writeSync}from'node:fs';
import{createReadStream}from'node:fs';
import{createInterface}from'node:readline';
import{resolve}from'node:path';
import{createHash}from'node:crypto';
import{pathToFileURL}from'node:url';
import{PROJECT_PHASES,PROJECT_REPOSITORY_ID,sourceBinding}from'./project-ci-results.mjs';
import{renderT04Evidence}from'./permission-runtime-t04.mjs';
import{renderServiceEvidence}from'./permission-runtime-service.mjs';
const hash=v=>createHash('sha256').update(typeof v==='string'?v:JSON.stringify(v)).digest('hex');
const fail=reason=>{throw Object.assign(Error('PERMISSION_BATCH_BUDGET_REFUSED'),{reason});};
const check=(ok,reason)=>{if(!ok)fail(reason);};
const exists=path=>!!lstatSync(path,{throwIfNoEntry:false});
function owned(path,cap=128*1024){const s=lstatSync(path);check(s.isFile()&&!s.isSymbolicLink()&&s.nlink===1&&s.size<=cap&&realpathSync(path)===resolve(path),'FILE');return readFileSync(path,'utf8');}
function policy(path){const raw=owned(path),p=JSON.parse(raw),start=Date.parse(p.originalStartedAtUtc),end=Date.parse(p.deadlineUtc);
 check(['permission-batch-budget-v1','permission-batch-budget-v2','permission-batch-budget-v3','permission-batch-budget-v4'].includes(p.schemaVersion)&&/^[a-z0-9-]{1,100}$/.test(p.workstreamId)&&['A','B'].includes(p.batch),'POLICY');
 if(p.schemaVersion==='permission-batch-budget-v4'){validateV4Policy(p);return{p,digest:hash(raw)};}
 const grant=p.schemaVersion==='permission-batch-budget-v3';
 const max=p.batch==='A'?(grant?{publication:2,ci:2,heavy:3,reviewRounds:6}:{publication:1,ci:1,heavy:2,reviewRounds:p.schemaVersion==='permission-batch-budget-v2'?4:2}):{publication:0,ci:0,heavy:6,reviewRounds:2};
 check(Number.isFinite(start)&&Number.isFinite(end)&&end>start,'DEADLINE');
 check(p.allowance&&Object.keys(p.allowance).sort().join(',')===Object.keys(max).sort().join(',')&&Object.entries(max).every(([k,v])=>Number.isSafeInteger(p.allowance[k])&&p.allowance[k]>=0&&p.allowance[k]<=v),'ALLOWANCE');
 if(p.schemaVersion==='permission-batch-budget-v1'){
  check(end-start<=(p.batch==='A'?90:180)*60000,'DEADLINE');
  const u=p.usageLimits;check(u&&u.warnOutput===30000&&u.stopOutput===50000&&u.warnUncachedInput===100000&&u.stopUncachedInput===150000,'TOKEN_LIMITS');
 }else{
  const a=p.ownerAuthorization;
  check(p.budgetMode==='owner-time-only-continuation'&&p.usageLimits===null&&a&&typeof a.reference==='string'&&a.reference.trim().length>=10&&a.reference.length<=2000
   &&Number.isFinite(Date.parse(a.authorizedAtUtc))&&Date.parse(a.authorizedAtUtc)>=start&&Date.parse(a.authorizedAtUtc)<end
   &&a.authorizedDeadlineUtc===p.deadlineUtc&&p.predecessor,'CONTINUATION_AUTHORIZATION');
  check(a.additionalReviewRounds===undefined||(p.batch==='A'&&a.additionalReviewRounds===2
   &&typeof a.reviewGrantReference==='string'&&a.reviewGrantReference.trim().length>=10&&a.reviewGrantReference.length<=2000),'REVIEW_GRANT');
  if(grant)check(p.batch==='A'&&a.additionalReviewRounds===undefined
   &&JSON.stringify(a.additionalActions)===JSON.stringify({publication:1,ci:1,heavy:1,reviewRounds:2})
   &&typeof a.actionGrantReference==='string'&&a.actionGrantReference.trim().length>=10&&a.actionGrantReference.length<=2000,'ACTION_GRANT');
  else check(a.additionalActions===undefined&&a.actionGrantReference===undefined,'ACTION_GRANT');
 }
 return{p,digest:hash(raw)};
}
function successorClaim(childPath,p){return{schemaVersion:'permission-batch-successor-v1',parentPolicySHA256:p.predecessor.policySHA256,
 childPath:resolve(childPath),childPolicySHA256:hash(owned(childPath))};}
function assertSuccessorClaim(childPath,p,{allowMissing=false}={}){
 const file=resolve(p.predecessor.path)+'.successor.json';if(!exists(file)){check(allowMissing,'SUCCESSOR_CLAIM_MISSING');return;}
 const actual=JSON.parse(owned(file)),expected=successorClaim(childPath,p);
 check(Object.keys(expected).every(k=>actual[k]===expected[k]),'SUCCESSOR_CONFLICT');
}
function predecessorState(p,depth=0,childPath,allowMissingClaim=false){
 if(p.schemaVersion==='permission-batch-budget-v1')return null;
 if(p.schemaVersion==='permission-batch-budget-v4')return v4Predecessor(p,depth,childPath,allowMissingClaim);
 check(depth<20,'PREDECESSOR_DEPTH');const ref=p.predecessor;
 check(typeof ref.path==='string'&&['policySHA256','anchorSHA256','journalSHA256'].every(k=>/^[a-f0-9]{64}$/.test(ref[k]??'')),'PREDECESSOR_REF');
 const path=resolve(ref.path);check(hash(owned(path))===ref.policySHA256&&hash(owned(path+'.anchor.json'))===ref.anchorSHA256&&hash(owned(path+'.journal.jsonl',1024**2))===ref.journalSHA256,'PREDECESSOR_DRIFT');
 const prior=readState(path,{allowLegacyWithoutHead:ref.legacyWithoutHead===true,depth:depth+1});
 const actionGrant=p.schemaVersion==='permission-batch-budget-v3'?p.ownerAuthorization.additionalActions:null;
 const reviewGrant=p.ownerAuthorization.additionalReviewRounds??0;
 check(prior.closed&&prior.p.workstreamId===p.workstreamId&&prior.p.batch===p.batch&&prior.p.originalStartedAtUtc===p.originalStartedAtUtc
  &&Object.keys(p.allowance).every(k=>p.allowance[k]===prior.p.allowance[k]+(actionGrant?.[k]??(k==='reviewRounds'?reviewGrant:0)))
  &&Date.parse(p.ownerAuthorization.authorizedAtUtc)>=Date.parse(prior.p.originalStartedAtUtc),'PREDECESSOR_STATE');
 if(actionGrant)check(prior.p.schemaVersion==='permission-batch-budget-v2'&&p.deadlineUtc===prior.p.deadlineUtc,'ACTION_GRANT_PREDECESSOR');
 if(reviewGrant||actionGrant)check(Date.parse(p.ownerAuthorization.authorizedAtUtc)>Date.parse(prior.p.ownerAuthorization?.authorizedAtUtc??prior.p.originalStartedAtUtc)
  &&Date.parse(p.ownerAuthorization.authorizedAtUtc)>=(actionGrant?Math.max(Date.parse(prior.p.originalStartedAtUtc),...prior.reservations.map(e=>Date.parse(e.atUtc))):Date.parse(prior.events.at(-1)?.atUtc))
  &&p.ownerAuthorization.reference!==prior.p.ownerAuthorization?.reference,'REVIEW_GRANT_REPLAY');
 assertSuccessorClaim(childPath,p,{allowMissing:allowMissingClaim});
 return prior;
}
function headValue(digest,events,previous,raw){return{schemaVersion:'permission-batch-head-v1',policySHA256:digest,eventCount:events.length,lastDigest:previous,journalSHA256:hash(raw)};}
function durableWrite(path,value,flag='wx'){const fd=openSync(path,flag,0o600);try{writeSync(fd,value);fsyncSync(fd);}finally{closeSync(fd);}}
export function initializeBatch(path){path=resolve(path);const{p,digest}=policy(path),anchor=path+'.anchor.json',journal=path+'.journal.jsonl';
 check([anchor,journal,path+'.head.json',path+'.head.tmp',path+'.lock'].every(p=>!exists(p)),'EXISTS');
 predecessorState(p,0,path,true);
 if(p.predecessor){const claim=resolve(p.predecessor.path)+'.successor.json';
  if(!exists(claim)){try{durableWrite(claim,JSON.stringify(successorClaim(path,p))+'\n');}catch(error){if(error.code!=='EEXIST')throw error;}}
  assertSuccessorClaim(path,p);
 }
 durableWrite(anchor,JSON.stringify({schemaVersion:'permission-batch-anchor-v1',workstreamId:p.workstreamId,batch:p.batch,policySHA256:digest})+'\n');
 durableWrite(journal,'');durableWrite(path+'.head.json',JSON.stringify(headValue(digest,[],digest,''))+'\n');return digest;
}
function readState(path,{allowLegacyWithoutHead=false,depth=0}={}){const{p,digest}=policy(path),a=JSON.parse(owned(path+'.anchor.json'));
 check(a.policySHA256===digest&&a.workstreamId===p.workstreamId&&a.batch===p.batch,'ANCHOR_DRIFT');
 check(!exists(path+'.head.tmp'),'HEAD_PENDING');
 let previous=digest;const events=[],raw=owned(path+'.journal.jsonl',1024**2);
 for(const line of raw.split('\n').filter(Boolean)){
  const e=JSON.parse(line),{digest:current,...payload}=e;
  check(e.index===events.length&&e.previous===previous&&hash(payload)===current,'JOURNAL');events.push(e);previous=current;
 }
 if(exists(path+'.head.json')){const h=JSON.parse(owned(path+'.head.json')),want=headValue(digest,events,previous,raw);
  check(Object.keys(want).every(k=>h[k]===want[k]),'HEAD_DRIFT');
 }else check(allowLegacyWithoutHead&&p.schemaVersion==='permission-batch-budget-v1','HEAD_MISSING');
 const prior=predecessorState(p,depth,path);
 if(p.schemaVersion==='permission-batch-budget-v4')return readV4State(p,digest,events,previous,raw,prior);
 const counts={...(prior?.counts??{publication:0,ci:0,heavy:0,reviewRounds:0})};
 let usage=prior?.usage??null,closed=false;const reservations=[...(prior?.reservations??[])];
 for(const e of events){check(!closed,'EVENT_AFTER_CLOSE');if(e.type==='reserve'){check(Object.hasOwn(counts,e.kind),'KIND');counts[e.kind]++;reservations.push(e);}
  else if(e.type==='usage')usage=e.usage;else if(e.type==='close')closed=true;else fail('EVENT');}
 check(Object.keys(counts).every(k=>counts[k]<=p.allowance[k]),'ALLOWANCE_EXHAUSTED');
 return{p,digest,events,previous,counts,usage,closed,reservations,raw};
}
function withLock(path,fn){path=resolve(path);const lock=path+'.lock';let fd;
 try{fd=openSync(lock,'wx',0o600);return fn(readState(path));}finally{if(fd!==undefined){closeSync(fd);unlinkSync(lock);}}}
function append(path,state,value){path=resolve(path);const payload={index:state.events.length,previous:state.previous,...value},event={...payload,digest:hash(payload)};
 const row=JSON.stringify(event)+'\n';durableWrite(path+'.journal.jsonl',row,'a');
 // A crash between durable journal append and atomic head replacement fails closed.
 const next=headValue(state.digest,[...state.events,event],event.digest,state.raw+row);
 durableWrite(path+'.head.tmp',JSON.stringify(next)+'\n');renameSync(path+'.head.tmp',path+'.head.json');}
export function inspectBatch(path,{now=Date.now(),reserveMs=0,reservationId}={}){
 check(Number.isSafeInteger(now)&&Number.isSafeInteger(reserveMs)&&reserveMs>=0&&Number.isSafeInteger(now+reserveMs),'TIME_ARGUMENT');
 const s=readState(resolve(path)),reasons=[];const u=s.usage,timeOnly=s.p.budgetMode==='owner-time-only-continuation';
 if(s.closed)reasons.push('CLOSED');
 if(s.p.schemaVersion==='permission-batch-budget-v4'&&now<Date.parse(s.p.ownerAuthorization.recordedAtUtc))reasons.push('AUTHORIZATION_FUTURE');
 if(s.pending?.length&&!(s.pending.length===1&&s.pending[0].reservationId===reservationId))reasons.push('PENDING');
 if(now<Date.parse(s.p.originalStartedAtUtc)||now+reserveMs>=Date.parse(s.p.deadlineUtc))reasons.push('DEADLINE');
 if(!timeOnly&&(!u||u.status!=='COMPLETE'||now-Date.parse(u.observedAtUtc)>120000||Date.parse(u.observedAtUtc)>now))reasons.push('USAGE_UNKNOWN_OR_STALE');
 if(!timeOnly&&u&&(u.outputTokens>=s.p.usageLimits.stopOutput||u.uncachedInputTokens>=s.p.usageLimits.stopUncachedInput))reasons.push('TOKEN_STOP');
 return{workstreamId:s.p.workstreamId,batch:s.p.batch,policySHA256:s.digest,deadlineUtc:s.p.deadlineUtc,budgetMode:timeOnly?'owner-time-only-continuation':'token-and-time',counts:s.counts,usage:u,
  ...(s.p.schemaVersion==='permission-batch-budget-v4'?{schemaVersion:s.p.schemaVersion,phaseId:s.p.phaseId,scope:s.p.scope,storage:s.p.storage,historicalCounts:s.historicalCounts,phaseCounts:s.phaseCounts,postGateCiCounts:s.postGateCiCounts,ciSettlements:s.ciSettlements,totalCounts:s.counts,pending:s.pending,blockedSources:s.blockedSources}:{}),
  warning:!timeOnly&&!!u&&(u.outputTokens>=s.p.usageLimits.warnOutput||u.uncachedInputTokens>=s.p.usageLimits.warnUncachedInput),reasons,admitted:reasons.length===0};
}
export function recordBatchUsage(path,usage){return withLock(path,s=>{
 check(!s.closed,'CLOSED');check(usage&&['COMPLETE','UNKNOWN'].includes(usage.status)&&Number.isFinite(Date.parse(usage.observedAtUtc))
  &&['outputTokens','uncachedInputTokens','responses'].every(k=>Number.isSafeInteger(usage[k])&&usage[k]>=0),'USAGE');
 if(s.usage)check(usage.outputTokens>=s.usage.outputTokens&&usage.uncachedInputTokens>=s.usage.uncachedInputTokens&&usage.responses>=s.usage.responses,'USAGE_ROLLBACK');
 append(path,s,{type:'usage',usage});return inspectBatch(path);
});}
export function reserveBatchAction(path,{kind,sourceSHA,identity,now=Date.now(),reserveMs=0}){return withLock(path,s=>{
 if(s.p.schemaVersion==='permission-batch-budget-v4')check(kind==='reviewRounds','V4_DISPATCH_API_REQUIRED');
 check(Object.hasOwn(s.counts,kind)&&/^[a-f0-9]{40}$/.test(sourceSHA??'')&&/^[A-Za-z0-9_.:-]{1,100}$/.test(identity??''),'ACTION');
 const status=inspectBatch(path,{now,reserveMs}),reviewOnly=s.p.schemaVersion==='permission-batch-budget-v4'&&kind==='reviewRounds';
 check(status.admitted||reviewOnly&&status.reasons.every(reason=>reason==='PENDING'),reviewOnly?status.reasons.find(reason=>reason!=='PENDING'):status.reasons[0]);
 check(s.p.schemaVersion==='permission-batch-budget-v4'&&kind==='reviewRounds'||s.counts[kind]<s.p.allowance[kind],'ALLOWANCE_EXHAUSTED');
 check(!s.reservations.some(e=>e.kind===kind&&e.identity===identity),'DUPLICATE');
 append(path,s,{type:'reserve',kind,sourceSHA,identity,atUtc:new Date(now).toISOString(),reserveMs});return inspectBatch(path,{now});
});}
export function closeBatch(path){return withLock(path,s=>{check(!s.pending?.length,'PENDING');if(!s.closed)append(path,s,{type:'close',atUtc:new Date().toISOString()});return inspectBatch(path);});}
const actionKeys=['publication','ci','heavy','reviewRounds'];
const postGateObligationIDs=Object.freeze(JSON.parse(readFileSync(new URL('../tests/permissions/full-oracle-contracts.json',import.meta.url),'utf8')).gaps.map(x=>x.field).sort());
const wholeProfiles=['SUPABASE_T04','SUPABASE_T02','PIN_ONBOARD','PIN_RACE','PIN_EXPIRY','PIN_IDENTITY_SERVER','PIN_IDENTITY_ONBOARDING','PIN_CANARY'];
const same=(a,b)=>canonical(a)===canonical(b);
const canonical=v=>JSON.stringify(v,(_k,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.entries(x).sort(([a],[b])=>a.localeCompare(b))):x);
const integer=v=>Number.isSafeInteger(v)&&v>=0;
function pinnedJSON(ref){check(ref&&typeof ref.path==='string'&&/^[a-f0-9]{64}$/.test(ref.sha256??''),'REFERENCE');const raw=owned(resolve(ref.path),4*1024**2);check(hash(raw)===ref.sha256,'REFERENCE_DRIFT');return JSON.parse(raw);}
function validateV4Policy(p){
 const start=Date.parse(p.originalStartedAtUtc),end=Date.parse(p.deadlineUtc),a=p.ownerAuthorization,l=p.phaseActionLimits,q=p.scope,t=p.storage;
 check(Number.isFinite(start)&&Number.isFinite(end)&&end>start&&/^[a-z0-9-]{1,100}$/.test(p.phaseId??'')&&p.budgetMode==='owner-time-only-continuation'&&p.usageLimits===null,'V4_POLICY');
 check(l&&same(Object.keys(l).sort(),actionKeys.slice().sort())&&['publication','ci','heavy'].every(k=>integer(l[k])&&l[k]<=10000)&&l.publication===l.ci&&l.reviewRounds===null,'V4_LIMITS');
 check(a&&typeof a.reference==='string'&&a.reference.trim().length>=10&&a.reference.length<=2000&&Number.isFinite(Date.parse(a.recordedAtUtc))&&Date.parse(a.recordedAtUtc)>=start&&Date.parse(a.recordedAtUtc)<end,'V4_AUTHORIZATION');
 const receipt=pinnedJSON(a.receipt),r=receipt.phaseActionLimits;
 check(receipt.reference===a.reference&&Date.parse(receipt.recordedAtUtc)===Date.parse(a.recordedAtUtc)&&Date.parse(receipt.authorizedDeadlineUtc)===end
  &&typeof receipt.answer==='string'&&receipt.answer.trim().length>0&&r&&r.candidatePublication===l.publication&&r.candidateCi===l.ci&&r.heavyProfiles===l.heavy&&r.reviewRounds===null,'V4_AUTHORIZATION_RECEIPT');
 check(q&&typeof q.repository==='string'&&/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(q.repository)&&typeof q.branch==='string'&&/^[A-Za-z0-9_./-]{1,100}$/.test(q.branch)&&!q.branch.includes('..')
  &&typeof q.sourceRoot==='string'&&realpathSync(q.sourceRoot)===resolve(q.sourceRoot)&&Array.isArray(q.profiles)&&q.profiles.length>0&&q.profiles.length<=wholeProfiles.length
  &&new Set(q.profiles).size===q.profiles.length&&q.profiles.every(x=>wholeProfiles.includes(x)),'V4_SCOPE');
 check(t&&t.baselineFreeBytes&&['C','D'].every(k=>integer(t.baselineFreeBytes[k]))&&t.taskMaximumBytes===20*1024**3&&t.reserveBytes===30*1024**3&&t.ciMaximumBytes===5*1024**3,'V4_STORAGE');
 check(Array.isArray(p.legacyBridge)&&p.legacyBridge.length<=20&&p.predecessor,'V4_HISTORY');
 if(p.postGateCi)validatePostGatePolicy(p);
}
function v4Predecessor(p,depth,childPath,allowMissingClaim){
 check(depth<20,'PREDECESSOR_DEPTH');const ref=p.predecessor,path=resolve(ref.path??'');
 check(['policySHA256','anchorSHA256','journalSHA256','headSHA256'].every(k=>/^[a-f0-9]{64}$/.test(ref[k]??'')),'PREDECESSOR_REF');
 for(const[suffix,key]of[['','policySHA256'],['.anchor.json','anchorSHA256'],['.journal.jsonl','journalSHA256'],['.head.json','headSHA256']])check(hash(owned(path+suffix,1024**2))===ref[key],'PREDECESSOR_DRIFT');
 const prior=readState(path,{depth:depth+1});
 check(prior.closed&&prior.p.workstreamId===p.workstreamId&&prior.p.batch===p.batch&&prior.p.originalStartedAtUtc===p.originalStartedAtUtc&&!prior.pending?.length,'PREDECESSOR_STATE');
 check(!prior.phaseIds?.includes(p.phaseId)&&p.ownerAuthorization.reference!==prior.p.ownerAuthorization?.reference&&!prior.authorizations?.includes(p.ownerAuthorization.reference),'V4_GRANT_REPLAY');
 check(Date.parse(p.ownerAuthorization.recordedAtUtc)>=Math.max(Date.parse(prior.events.at(-1)?.atUtc??prior.p.originalStartedAtUtc),...prior.reservations.map(e=>Date.parse(e.atUtc))),'V4_GRANT_CHRONOLOGY');
 if(prior.p.schemaVersion==='permission-batch-budget-v4')check(p.legacyBridge.length===0&&same(p.storage,prior.p.storage),'V4_BRIDGE_REPLAY');
 else check(prior.p.schemaVersion==='permission-batch-budget-v3'&&p.legacyBridge.length===2,'V4_BRIDGE_REQUIRED');
 if(p.postGateCi){const grant=pinnedJSON(p.postGateCi.grant);check(!prior.postGateGrantReferences?.includes(grant.reference)&&Date.parse(grant.recordedAtUtc)>=Date.parse(prior.events.at(-1)?.atUtc??prior.p.originalStartedAtUtc),'POST_GATE_GRANT_REPLAY');}
 legacyBridge(p,prior);assertSuccessorClaim(childPath,p,{allowMissing:allowMissingClaim});return prior;
}
function legacyBridge(p,prior){
 const counts={publication:0,ci:0,heavy:0,reviewRounds:0},claims=[],seen=new Set(prior.importedClaimSHA256s??[]);let first;
 for(const ref of p.legacyBridge){const a=pinnedJSON(ref.policy),c=pinnedJSON(ref.claim);
  check(!seen.has(ref.claim.sha256),'V4_BRIDGE_DUPLICATE');seen.add(ref.claim.sha256);
  check(['permission-release-phase-publication-claim-v1','permission-release-phase-publication-claim-v2'].includes(c.schemaVersion)&&c.policySHA256===ref.policy.sha256
   &&c.phaseId===a.phaseId&&c.sourceSHA===a.sourceSHA&&c.expectedRemoteSHA===a.expectedRemoteSHA&&c.packetSHA256===a.packet?.sha256&&c.reviewsSHA256===a.reviews?.sha256
   &&c.predecessor?.policySHA256===p.predecessor.policySHA256&&c.predecessor?.journalSHA256===p.predecessor.journalSHA256&&same(c.predecessor.counts,prior.counts)
   &&same(c.actions,{publication:1,ci:1})&&a.repository===p.scope.repository&&a.branch===p.scope.branch&&same(a.storage,p.storage)
   &&Number.isFinite(Date.parse(c.atUtc))&&Date.parse(c.atUtc)<Date.parse(p.ownerAuthorization.recordedAtUtc),'V4_BRIDGE_BINDING');
  if(c.schemaVersion==='permission-release-phase-publication-claim-v1'){
   check(!first&&a.schemaVersion==='permission-release-phase-admission-v1','V4_BRIDGE_ORDER');first=ref;
  }else check(first&&a.schemaVersion==='permission-release-phase-admission-v2'&&same(a.continuation,c.continuation)
   &&c.continuation?.parentPolicy?.sha256===first.policy.sha256&&c.continuation?.parentClaim?.sha256===first.claim.sha256
   &&same(c.continuation.additionalActions,{publication:1,ci:1}),'V4_BRIDGE_PARENT');
  counts.publication++;counts.ci++;claims.push(ref.claim.sha256);
 }
 if(p.legacyBridge.length)check(first&&claims.length===2,'V4_BRIDGE_REQUIRED');return{counts,claims};
}
function readV4State(p,digest,events,previous,raw,prior){
 const bridge=legacyBridge(p,prior),historicalCounts=Object.fromEntries(actionKeys.map(k=>[k,prior.counts[k]+bridge.counts[k]])),phaseCounts=Object.fromEntries(actionKeys.map(k=>[k,0]));
 const pending=new Map(),postGateCiCounts={pull_request:0,main_push:0,total:0},ciSettlements={},blocked=new Set(prior.blockedSources??[]),reservations=[...(prior.reservations??[])];let usage=prior.usage??null,closed=false;
 for(const e of events){check(!closed,'EVENT_AFTER_CLOSE');
  if(e.type==='usage')usage=e.usage;
  else if(e.type==='close'){check(pending.size===0,'PENDING');closed=true;}
  else if(e.type==='reserve'){check(e.kind==='reviewRounds','V4_DISPATCH_API_REQUIRED');phaseCounts.reviewRounds++;reservations.push(e);}
  else if(e.type==='dispatch'){
   check(['publication','heavy','ci'].includes(e.kind)&&/^[a-f0-9]{64}$/.test(e.reservationId??'')&&!pending.size&&!blocked.has(e.sourceSHA)
    &&/^[a-f0-9]{40}$/.test(e.sourceSHA??'')&&typeof e.identity==='string'&&e.reserveMs>=42*60000
    &&(e.kind==='heavy'?p.scope.profiles.includes(e.profile):e.profile===null),'V4_DISPATCH');
   check(!reservations.some(r=>r.identity===e.identity||r.kind===e.kind&&r.sourceSHA===e.sourceSHA&&(r.profile??null)===e.profile&&(e.kind!=='ci'||r.purpose===e.purpose)),'DUPLICATE');
   if(e.kind==='ci'){verifyPostGatePacket(p,e,ciSettlements);check(postGateCiCounts[e.purpose]<p.postGateCi.limits[e.purpose],'ALLOWANCE_EXHAUSTED');postGateCiCounts[e.purpose]++;postGateCiCounts.total++;}
   else{phaseCounts[e.kind]++;if(e.kind==='publication')phaseCounts.ci++;}pending.set(e.reservationId,e);reservations.push(e);
  }else if(e.type==='settle'){
   const intent=pending.get(e.reservationId);check(intent,'V4_SETTLEMENT_INTENT');const proof=verifyTerminal(p,intent,e.terminal);
   pending.delete(e.reservationId);if(intent.kind==='ci')ciSettlements[intent.purpose]={reservationId:intent.reservationId,packet:intent.packet,terminal:e.terminal,sourceSHA:intent.sourceSHA,conclusion:proof.conclusion};if(proof.conclusion!=='success')blocked.add(intent.sourceSHA);
  }else fail('EVENT');
 }
 check(['publication','ci','heavy'].every(k=>phaseCounts[k]<=p.phaseActionLimits[k]),'ALLOWANCE_EXHAUSTED');
 const counts=Object.fromEntries(actionKeys.map(k=>[k,historicalCounts[k]+phaseCounts[k]+(k==='ci'?postGateCiCounts.total:0)]));
 return{p,digest,events,previous,raw,counts,historicalCounts,phaseCounts,postGateCiCounts,ciSettlements,usage,closed,reservations,pending:[...pending.values()],blockedSources:[...blocked].sort(),
  importedClaimSHA256s:[...(prior.importedClaimSHA256s??[]),...bridge.claims],postGateGrantReferences:[...(prior.postGateGrantReferences??[]),...(p.postGateCi?[pinnedJSON(p.postGateCi.grant).reference]:[])],phaseIds:[...(prior.phaseIds??[]),p.phaseId],authorizations:[...(prior.authorizations??[]),p.ownerAuthorization.reference]};
}
function scopeStatus(path,s,context){
 check(s.p.schemaVersion==='permission-batch-budget-v4','V4_REQUIRED');const q=s.p.scope;
 check(context.repository===q.repository&&context.branch===q.branch&&typeof context.sourceRoot==='string'&&realpathSync(context.sourceRoot)===realpathSync(q.sourceRoot)
  &&/^[a-f0-9]{40}$/.test(context.sourceSHA??'')&&(!context.profile||q.profiles.includes(context.profile)),'V4_SCOPE');
 check(!s.blockedSources.includes(context.sourceSHA),'SOURCE_BLOCKED');
 if(context.reservationId){const own=s.pending.find(x=>x.reservationId===context.reservationId);check(own&&own.sourceSHA===context.sourceSHA&&own.profile===(context.profile??null),'PENDING_SCOPE');}
 const now=context.now??Date.now();check(now>=Date.parse(s.p.ownerAuthorization.recordedAtUtc),'V4_AUTHORIZATION_FUTURE');
 const status=inspectBatch(path,{now,reserveMs:context.reserveMs??42*60000,reservationId:context.reservationId});check(status.admitted,status.reasons[0]);return status;
}
export function assertBatchScope(path,context){return scopeStatus(resolve(path),readState(resolve(path)),context);}
function reserveDispatch(path,kind,context){return withLock(path,s=>{
 check(Number.isSafeInteger(context.reserveMs??42*60000)&&(context.reserveMs??42*60000)>=42*60000,'V4_RESERVE');
 scopeStatus(path,s,{...context,reservationId:undefined});check(!s.pending.length,'PENDING');
 check(/^[A-Za-z0-9_.:-]{1,100}$/.test(context.identity??''),'ACTION');const profile=kind==='publication'?null:context.profile;
 check(kind==='publication'||s.p.scope.profiles.includes(profile),'PROFILE');
 check(!s.reservations.some(r=>r.identity===context.identity||r.kind===kind&&r.sourceSHA===context.sourceSHA&&(r.profile??null)===profile),'DUPLICATE');
 check(s.phaseCounts[kind]<s.p.phaseActionLimits[kind]&&(kind!=='publication'||s.phaseCounts.ci<s.p.phaseActionLimits.ci),'ALLOWANCE_EXHAUSTED');
 const atUtc=new Date(context.now??Date.now()).toISOString(),value={type:'dispatch',kind,sourceSHA:context.sourceSHA,profile,identity:context.identity,atUtc,reserveMs:context.reserveMs??42*60000};
 const reservationId=hash({policySHA256:s.digest,index:s.events.length,...value});append(path,s,{...value,reservationId});
 return{reservationId,...inspectBatch(path,{now:context.now??Date.now(),reservationId})};
 });}
export function reservePublicationPair(path,context){return reserveDispatch(path,'publication',context);}
export function reserveHeavyProfile(path,context){return reserveDispatch(path,'heavy',context);}
function verifyTerminal(p,intent,ref){
 if(intent.kind==='ci')return verifyPostGateTerminal(p,intent,ref);
 const t=pinnedJSON(ref);check(t.schemaVersion==='permission-batch-terminal-v1'&&t.reservationId===intent.reservationId&&t.kind===intent.kind&&t.sourceSHA===intent.sourceSHA&&t.profile===intent.profile
  &&/^[1-9][0-9]{0,19}$/.test(t.runId??'')&&t.attempt===1&&['success','failure','cancelled','timed_out'].includes(t.conclusion),'V4_TERMINAL');
 const m=pinnedJSON(t.metadata),o=t.observation?pinnedJSON(t.observation):null,r=pinnedJSON(t.reclaim);
 check(String(m.id)===t.runId&&m.head_sha===t.sourceSHA&&m.run_attempt===t.attempt&&m.status==='completed'&&m.conclusion===t.conclusion
  &&m.path==='.github/workflows/'+(intent.kind==='publication'?'ci.yml':'backend.yml')&&m.event===(intent.kind==='publication'?'push':'workflow_dispatch'),'V4_TERMINAL_METADATA');
 check(m.repository?.full_name===p.scope.repository&&m.repository?.id===PROJECT_REPOSITORY_ID&&m.head_repository?.full_name===p.scope.repository&&m.head_repository?.id===PROJECT_REPOSITORY_ID&&m.head_branch===p.scope.branch,'V4_TERMINAL_REPOSITORY');
 if(intent.kind==='publication'){
  check(r.schemaVersion==='permission-pg16-reclaim-v1'&&r.status==='NOT_PRESENT'&&r.rootRemoved===true&&r.processReleased===true&&r.sourceSHA===t.sourceSHA&&r.runId===t.runId,'V4_TERMINAL_RECLAIM');
  if(t.conclusion==='success')check(o?.schemaVersion==='pos-cafe-light-ci-v1'&&o.repository===p.scope.repository&&o.sourceSHA===t.sourceSHA&&o.workflowSHA===t.sourceSHA&&o.runId===t.runId&&o.attempt===1&&o.sourcePreserved===true&&o.overallStatus==='PASS'
   &&same(o.phases?.map(x=>x.id),PROJECT_PHASES)&&o.phases.every(x=>x.status==='PASS'&&x.exitCode===0),'V4_TERMINAL_OBSERVATION');
 }else{
  check(o&&o.schemaVersion===(intent.profile==='SUPABASE_T04'?'t04-observed-checkpoint-v1':'service-observed-checkpoint-v1')&&o.sourceSHA===t.sourceSHA&&o.runId===t.runId&&o.conclusion===t.conclusion
   &&(intent.profile==='SUPABASE_T04'||o.executionProfile===intent.profile&&o.attempt===1)&&/^[a-f0-9]{64}$/.test(o.logSHA256??'')&&Array.isArray(o.reclaim)&&o.reclaim.length===1&&same(o.reclaim[0],r),'V4_TERMINAL_OBSERVATION');
  check(r.schemaVersion==='permission-ci1-reclaim-v1'&&r.status==='RECLAIMED'&&r.imageUnlinked===true&&Number.isSafeInteger(r.measuredHostFreeDeltaBytes)&&r.measuredHostFreeDeltaBytes>0,'V4_TERMINAL_RECLAIM');
  if(t.conclusion==='success'){
   check(Array.isArray(o.evidence)&&o.evidence.length===1,'V4_TERMINAL_OBSERVATION');const runtime=o.evidence[0];
   if(intent.profile==='SUPABASE_T04')renderT04Evidence(runtime);else{renderServiceEvidence(runtime);check(runtime.executionProfile===intent.profile,'V4_TERMINAL_PROFILE');}
   check(runtime.sourceSHA===t.sourceSHA&&runtime.workflowSHA===t.sourceSHA&&runtime.runId===t.runId&&runtime.attempt===1&&runtime.status==='PASS','V4_TERMINAL_OBSERVATION');
  }
 }
 return t;
}
export function settleBatchDispatch(path,{reservationId,sourceSHA,profile,runId,attempt,conclusion,terminal,now=Date.now()}){return withLock(path,s=>{
 check(s.p.schemaVersion==='permission-batch-budget-v4'&&!s.closed,'V4_REQUIRED');check(Number.isSafeInteger(now),'TIME_ARGUMENT');
 const intent=s.pending.find(x=>x.reservationId===reservationId);check(intent,'V4_SETTLEMENT_INTENT');const t=verifyTerminal(s.p,intent,terminal);
 check(sourceSHA===t.sourceSHA&&(profile??null)===t.profile&&runId===t.runId&&attempt===t.attempt&&conclusion===t.conclusion,'V4_TERMINAL_BINDING');
 append(path,s,{type:'settle',reservationId,terminal,atUtc:new Date(now).toISOString()});return inspectBatch(path,{now});
 });}

function validatePostGatePolicy(p){
 const q=p.postGateCi,g=pinnedJSON(q.grant);
 check(same(q.limits,{pull_request:1,main_push:1})&&g.additionalAutomaticCi===2&&typeof g.reference==='string'&&g.reference.trim().length>=10&&g.reference!==p.ownerAuthorization.reference
  &&typeof g.answer==='string'&&g.answer.trim().length>0&&Date.parse(g.authorizedDeadlineUtc)===Date.parse(p.deadlineUtc)
  &&Date.parse(g.recordedAtUtc)>=Date.parse(p.ownerAuthorization.recordedAtUtc)&&Date.parse(g.recordedAtUtc)<Date.parse(p.deadlineUtc),'POST_GATE_GRANT');
}
function verifyPostGatePacket(p,intent,settlements={}){
 check(p.postGateCi&&['pull_request','main_push'].includes(intent.purpose),'POST_GATE_GRANT_REQUIRED');
 const packet=pinnedJSON(intent.packet),reviews=pinnedJSON(intent.reviews),gate=pinnedJSON(packet.fullGate),map=packet.mapping;
 check(packet.schemaVersion==='permission-postgate-ci-packet-v1'&&packet.repository===p.scope.repository&&packet.sourceSHA===intent.sourceSHA&&packet.purpose===intent.purpose
  &&packet.acceptance==='D19/R0/R1'&&/^[a-f0-9]{40}$/.test(packet.candidateTreeSHA??'')&&Array.isArray(packet.authors)&&packet.authors.length>0&&packet.authors.every(x=>typeof x==='string'&&x.length>0)&&new Set(packet.authors).size===packet.authors.length,'POST_GATE_PACKET');
 check(reviews.candidateSHA256===intent.packet.sha256&&Array.isArray(reviews.reviewers)&&reviews.reviewers.some(a=>a.scope==='source'&&a.verdict==='APPROVE'&&!packet.authors.includes(a.name)&&typeof a.name==='string'&&a.name.length>0
  &&reviews.reviewers.some(b=>b.scope==='operations'&&b.verdict==='APPROVE'&&typeof b.name==='string'&&b.name.length>0&&b.name!==a.name&&!packet.authors.includes(b.name))),'POST_GATE_REVIEWS');
 check(gate.schemaVersion==='permission-fullgate-reviewed-v1'&&gate.sourceSHA===intent.sourceSHA&&gate.status==='PASS'&&gate.stageCount===35&&gate.requiredIdentities===760&&gate.requiredSkip===0&&gate.retry===0
  &&Array.isArray(gate.obligations)&&gate.obligations.length===12&&new Set(gate.obligations.map(x=>x.id)).size===12&&gate.obligations.every(x=>typeof x.id==='string'&&x.id.length>0&&x.status==='PASS')
  &&Array.isArray(gate.receipts)&&gate.receipts.length>0&&gate.receipts.length<=100&&/^[a-f0-9]{64}$/.test(gate.workflowSHA256??''),'POST_GATE_FULL_GATE');
 check(same(gate.obligations.map(x=>x.id).sort(),postGateObligationIDs),'POST_GATE_OBLIGATIONS');
 pinnedJSON(gate.inventory);for(const ref of[...gate.receipts,...gate.obligations.map(x=>x.evidence)])pinnedJSON(ref);
 check(map&&map.targetBranch==='main'&&/^[a-f0-9]{40}$/.test(map.baseSHA??'')&&map.baseSHA!==intent.sourceSHA,'POST_GATE_MAPPING');
 const candidate=pinnedJSON(map.candidateCommit),base=pinnedJSON(map.baseCommit);
 check(candidate.sha===intent.sourceSHA&&candidate.tree?.sha===packet.candidateTreeSHA&&base.sha===map.baseSHA,'POST_GATE_MAPPING');
 if(intent.purpose==='main_push'){
  const prior=settlements.pull_request;check(prior?.conclusion==='success'&&prior.sourceSHA===intent.sourceSHA,'POST_GATE_PR_REQUIRED');
  const prProof=pinnedJSON(prior.terminal),pr=pinnedJSON(prProof.pullRequest),prPacket=pinnedJSON(prior.packet);
  check(integer(map.prNumber)&&map.prNumber>0&&map.prNumber===pr.number&&map.baseSHA===prPacket.mapping.baseSHA&&packet.candidateTreeSHA===prPacket.candidateTreeSHA&&same(map.prSettlement,prior),'POST_GATE_MAPPING');
 }
 return{packet,gate,map};
}
export function reservePostGateCi(path,context){return withLock(path,s=>{
 check(Number.isSafeInteger(context.reserveMs??42*60000)&&(context.reserveMs??42*60000)>=42*60000,'V4_RESERVE');scopeStatus(path,s,{...context,reservationId:undefined});check(!s.pending.length,'PENDING');
 check(/^[A-Za-z0-9_.:-]{1,100}$/.test(context.identity??''),'ACTION');
 const value={type:'dispatch',kind:'ci',sourceSHA:context.sourceSHA,profile:null,purpose:context.purpose,identity:context.identity,packet:context.packet,reviews:context.reviews,atUtc:new Date(context.now??Date.now()).toISOString(),reserveMs:context.reserveMs??42*60000};
 verifyPostGatePacket(s.p,value,s.ciSettlements);check((context.now??Date.now())>=Date.parse(pinnedJSON(s.p.postGateCi.grant).recordedAtUtc),'POST_GATE_AUTHORIZATION_FUTURE');
 check(s.postGateCiCounts[value.purpose]<s.p.postGateCi.limits[value.purpose]&&!s.reservations.some(r=>r.identity===value.identity||r.kind==='ci'&&r.purpose===value.purpose),'ALLOWANCE_EXHAUSTED');
 const reservationId=hash({policySHA256:s.digest,index:s.events.length,...value});append(path,s,{...value,reservationId});return{reservationId,...inspectBatch(path,{now:context.now??Date.now(),reservationId})};
 });}
function verifyPostGateTerminal(p,intent,ref){
 const t=pinnedJSON(ref),{packet,map,gate}=verifyPostGatePacket(p,intent,intent.purpose==='main_push'?postGatePriorFromPacket(p,intent):{});
 check(t.schemaVersion==='permission-batch-terminal-v1'&&t.reservationId===intent.reservationId&&t.kind==='ci'&&t.sourceSHA===intent.sourceSHA&&t.profile===null&&t.purpose===intent.purpose
  &&/^[1-9][0-9]{0,19}$/.test(t.runId??'')&&t.attempt===1&&['success','failure','cancelled','timed_out'].includes(t.conclusion)&&/^[a-f0-9]{40}$/.test(t.testedSourceSHA??''),'POST_GATE_TERMINAL');
 const m=pinnedJSON(t.metadata),o=pinnedJSON(t.observation),r=pinnedJSON(t.reclaim),commit=pinnedJSON(t.testedCommit),pr=pinnedJSON(t.pullRequest),event=intent.purpose==='pull_request'?'pull_request':'push';
 check(String(m.id)===t.runId&&m.run_attempt===1&&m.status==='completed'&&m.conclusion===t.conclusion&&m.path==='.github/workflows/ci.yml'&&m.event===event,'POST_GATE_METADATA');
 check(m.repository?.full_name===p.scope.repository&&m.repository?.id===PROJECT_REPOSITORY_ID&&m.head_repository?.full_name===p.scope.repository&&m.head_repository?.id===PROJECT_REPOSITORY_ID,'POST_GATE_METADATA_REPOSITORY');
 check(m.head_branch===(event==='pull_request'?p.scope.branch:map.targetBranch),'POST_GATE_METADATA_BRANCH');
 check(commit.sha===t.testedSourceSHA&&commit.tree?.sha===packet.candidateTreeSHA&&pr.head?.sha===intent.sourceSHA&&pr.head?.repo?.full_name===p.scope.repository&&pr.base?.repo?.full_name===p.scope.repository
  &&pr.head.ref===p.scope.branch&&pr.base.ref===map.targetBranch&&integer(pr.number)&&pr.number>0,'POST_GATE_MAPPING');
 let eventData;
 if(event==='pull_request'){
  check(pr.base.sha===map.baseSHA&&Array.isArray(commit.parents)&&same(commit.parents.map(x=>x.sha),[map.baseSHA,intent.sourceSHA])&&o.prHeadSHA===intent.sourceSHA
   &&['candidate','tested_merge'].includes(t.metadataHeadRole)&&m.head_sha===(t.metadataHeadRole==='candidate'?intent.sourceSHA:t.testedSourceSHA),'POST_GATE_PR_MAPPING');
  check(Array.isArray(m.pull_requests)&&m.pull_requests.length===1&&m.pull_requests[0].number===pr.number&&m.pull_requests[0].head?.sha===pr.head.sha&&m.pull_requests[0].base?.sha===map.baseSHA,'POST_GATE_METADATA_PR');
  eventData={repository:{id:PROJECT_REPOSITORY_ID,full_name:p.scope.repository},pull_request:pr};
 }else{
  const main=pinnedJSON(t.mainRef);check(pr.number===map.prNumber&&pr.base.sha===map.baseSHA&&pr.merged===true&&pr.merge_commit_sha===t.testedSourceSHA&&main.ref==='refs/heads/'+map.targetBranch&&main.object?.sha===t.testedSourceSHA&&m.head_sha===t.testedSourceSHA&&o.prHeadSHA===null
   &&Array.isArray(commit.parents)&&same(commit.parents.map(x=>x.sha),[map.baseSHA,intent.sourceSHA]),'POST_GATE_MAIN_MAPPING');
  check(Array.isArray(m.pull_requests)&&m.pull_requests.every(x=>x.number===pr.number&&x.head?.sha===pr.head.sha&&x.base?.sha===map.baseSHA),'POST_GATE_METADATA_PR');
  eventData={repository:{id:PROJECT_REPOSITORY_ID,full_name:p.scope.repository},after:t.testedSourceSHA};
 }
 const binding=sourceBinding({GITHUB_REPOSITORY:p.scope.repository,GITHUB_REPOSITORY_ID:String(PROJECT_REPOSITORY_ID),GITHUB_SHA:t.testedSourceSHA,GITHUB_WORKFLOW_SHA:o.workflowSHA,GITHUB_RUN_ID:t.runId,GITHUB_RUN_ATTEMPT:'1',GITHUB_EVENT_NAME:event},eventData,t.testedSourceSHA,commit.parents?.map(x=>x.sha)??[]);
 check(o.schemaVersion==='pos-cafe-light-ci-v1'&&o.repository===p.scope.repository&&o.repositoryID===PROJECT_REPOSITORY_ID&&o.event===event&&o.sourceSHA===binding.sourceSHA&&o.prHeadSHA===binding.prHeadSHA&&o.runId===t.runId&&o.attempt===1,'POST_GATE_CI_BINDING');
 const wf=pinnedJSON(t.workflowCommit),tree=pinnedJSON(t.workflowTree),blob=owned(resolve(t.workflowBlob?.path??''),1024**2);check(hash(blob)===t.workflowBlob?.sha256&&hash(blob)===gate.workflowSHA256,'POST_GATE_WORKFLOW');
 const gitBlob=createHash('sha1').update('blob '+Buffer.byteLength(blob)+'\0').update(blob).digest('hex');
 check(wf.sha===o.workflowSHA&&tree.sha===wf.tree?.sha&&tree.truncated===false&&Array.isArray(tree.tree)&&tree.tree.length<=10000
  &&tree.tree.filter(x=>x.path==='.github/workflows/ci.yml'&&x.type==='blob'&&x.sha===gitBlob).length===1,'POST_GATE_WORKFLOW');
 check(r.schemaVersion==='permission-pg16-reclaim-v1'&&r.status==='NOT_PRESENT'&&r.rootRemoved===true&&r.processReleased===true&&r.sourceSHA===t.testedSourceSHA&&r.runId===t.runId,'V4_TERMINAL_RECLAIM');
 if(t.conclusion==='success')check(o.overallStatus==='PASS'&&o.sourcePreserved===true&&same(o.phases?.map(x=>x.id),PROJECT_PHASES)&&o.phases.every(x=>x.status==='PASS'&&x.exitCode===0),'POST_GATE_CI_OBSERVATION');
 return t;
}
function postGatePriorFromPacket(p,intent){
 const packet=pinnedJSON(intent.packet),prior=packet.mapping?.prSettlement;check(prior&&prior.sourceSHA===intent.sourceSHA&&prior.conclusion==='success','POST_GATE_PR_REQUIRED');return{pull_request:prior};
}

// Usage is counted from unique per-response records, not cumulative counters.
// Only the named root and its actual descendants after this batch's start count.
export async function measureBatchUsage(files,{rootThreadId,startedAtUtc}){
 const start=Date.parse(startedAtUtc);check(Array.isArray(files)&&files.length<=5000&&Number.isFinite(start),'SESSIONS');
 const metas=[];
 for(const file of files){let first='';for await(const line of createInterface({input:createReadStream(file),crlfDelay:Infinity})){first=line;break;}
  try{const r=JSON.parse(first);if(r.type==='session_meta')metas.push({file,meta:r.payload});}catch{}}
 const ids=new Set([rootThreadId]);let changed=true;
 while(changed){changed=false;for(const{meta}of metas){const parent=meta.source?.subagent?.thread_spawn?.parent_thread_id;
  if(ids.has(parent)&&!ids.has(meta.id)){ids.add(meta.id);changed=true;}}}
 const seen=new Map(),active=new Set(),withUsage=new Set();let outputTokens=0,uncachedInputTokens=0,unknown=false;
 for(const{file,meta}of metas){if(!ids.has(meta.id))continue;
  for await(const line of createInterface({input:createReadStream(file),crlfDelay:Infinity})){
   let r;try{r=JSON.parse(line);}catch{unknown=true;continue;}const stamp=Date.parse(r.timestamp);if(!Number.isFinite(stamp)){unknown=true;continue;}if(stamp<start)continue;
   const q=r.payload;if(r.type==='event_msg'&&q?.type==='task_started')active.add(meta.id);
   if(r.type!=='token_usage_record'||q?.thread_id!==meta.id)continue;
   const u=q.usage,key=meta.id+':'+q.response_id;
   if(!q.response_id||!u||!['input_tokens','cached_input_tokens','output_tokens'].every(k=>Number.isSafeInteger(u[k])&&u[k]>=0)||u.cached_input_tokens>u.input_tokens){unknown=true;continue;}
   const record=[u.input_tokens,u.cached_input_tokens,u.output_tokens].join(':');if(seen.has(key)){if(seen.get(key)!==record)unknown=true;continue;}
   seen.set(key,record);withUsage.add(meta.id);outputTokens+=u.output_tokens;uncachedInputTokens+=u.input_tokens-u.cached_input_tokens;
  }
 }
 if(!metas.some(x=>x.meta.id===rootThreadId)||[...active].some(id=>!withUsage.has(id)))unknown=true;
 return{status:unknown?'UNKNOWN':'COMPLETE',observedAtUtc:new Date().toISOString(),outputTokens,uncachedInputTokens,responses:seen.size,
  threads:[...withUsage].sort(),limits:'Tool/message boundary observation; current in-flight response and missing records can overrun. Not billing or a native model hardcap.'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{const[command,file,arg]=process.argv.slice(2);let result;
  if(command==='init')result={policySHA256:initializeBatch(file)};
  else if(command==='check')result=inspectBatch(file);
  else if(command==='reserve')result=reserveBatchAction(file,JSON.parse(owned(arg)));
  else if(command==='usage'){const config=JSON.parse(owned(arg));result=recordBatchUsage(file,await measureBatchUsage(config.files,config));}
  else if(command==='close')result=closeBatch(file);else fail('COMMAND');
  console.log(JSON.stringify(result));if(command==='check'&&!result.admitted)process.exitCode=2;
 }catch(error){console.log(JSON.stringify({status:'REFUSED',code:'PERMISSION_BATCH_BUDGET_REFUSED',reason:error.reason??'IO_OR_PARSE'}));process.exitCode=1;}
}
