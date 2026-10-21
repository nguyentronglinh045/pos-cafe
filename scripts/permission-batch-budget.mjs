import{readFileSync,writeFileSync,openSync,closeSync,unlinkSync,lstatSync,realpathSync,renameSync,fsyncSync,writeSync}from'node:fs';
import{createReadStream}from'node:fs';
import{createInterface}from'node:readline';
import{resolve}from'node:path';
import{createHash}from'node:crypto';
import{pathToFileURL}from'node:url';
const hash=v=>createHash('sha256').update(typeof v==='string'?v:JSON.stringify(v)).digest('hex');
const fail=reason=>{throw Object.assign(Error('PERMISSION_BATCH_BUDGET_REFUSED'),{reason});};
const check=(ok,reason)=>{if(!ok)fail(reason);};
const exists=path=>!!lstatSync(path,{throwIfNoEntry:false});
function owned(path,cap=128*1024){const s=lstatSync(path);check(s.isFile()&&!s.isSymbolicLink()&&s.nlink===1&&s.size<=cap&&realpathSync(path)===resolve(path),'FILE');return readFileSync(path,'utf8');}
function policy(path){const raw=owned(path),p=JSON.parse(raw),start=Date.parse(p.originalStartedAtUtc),end=Date.parse(p.deadlineUtc);
 check(['permission-batch-budget-v1','permission-batch-budget-v2'].includes(p.schemaVersion)&&/^[a-z0-9-]{1,100}$/.test(p.workstreamId)&&['A','B'].includes(p.batch),'POLICY');
 const max=p.batch==='A'?{publication:1,ci:1,heavy:2,reviewRounds:p.schemaVersion==='permission-batch-budget-v2'?4:2}:{publication:0,ci:0,heavy:6,reviewRounds:2};
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
 check(depth<20,'PREDECESSOR_DEPTH');const ref=p.predecessor;
 check(typeof ref.path==='string'&&['policySHA256','anchorSHA256','journalSHA256'].every(k=>/^[a-f0-9]{64}$/.test(ref[k]??'')),'PREDECESSOR_REF');
 const path=resolve(ref.path);check(hash(owned(path))===ref.policySHA256&&hash(owned(path+'.anchor.json'))===ref.anchorSHA256&&hash(owned(path+'.journal.jsonl',1024**2))===ref.journalSHA256,'PREDECESSOR_DRIFT');
 const prior=readState(path,{allowLegacyWithoutHead:ref.legacyWithoutHead===true,depth:depth+1});
 const reviewGrant=p.ownerAuthorization.additionalReviewRounds??0;
 check(prior.closed&&prior.p.workstreamId===p.workstreamId&&prior.p.batch===p.batch&&prior.p.originalStartedAtUtc===p.originalStartedAtUtc
  &&Object.keys(p.allowance).every(k=>p.allowance[k]===prior.p.allowance[k]+(k==='reviewRounds'?reviewGrant:0))
  &&Date.parse(p.ownerAuthorization.authorizedAtUtc)>=Date.parse(prior.p.originalStartedAtUtc),'PREDECESSOR_STATE');
 if(reviewGrant)check(Date.parse(p.ownerAuthorization.authorizedAtUtc)>Date.parse(prior.p.ownerAuthorization?.authorizedAtUtc??prior.p.originalStartedAtUtc)
  &&Date.parse(p.ownerAuthorization.authorizedAtUtc)>=Date.parse(prior.events.at(-1)?.atUtc)
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
 const prior=predecessorState(p,depth,path),counts={...(prior?.counts??{publication:0,ci:0,heavy:0,reviewRounds:0})};
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
export function inspectBatch(path,{now=Date.now(),reserveMs=0}={}){
 check(Number.isSafeInteger(now)&&Number.isSafeInteger(reserveMs)&&reserveMs>=0&&Number.isSafeInteger(now+reserveMs),'TIME_ARGUMENT');
 const s=readState(resolve(path)),reasons=[];const u=s.usage,timeOnly=s.p.budgetMode==='owner-time-only-continuation';
 if(s.closed)reasons.push('CLOSED');
 if(now<Date.parse(s.p.originalStartedAtUtc)||now+reserveMs>=Date.parse(s.p.deadlineUtc))reasons.push('DEADLINE');
 if(!timeOnly&&(!u||u.status!=='COMPLETE'||now-Date.parse(u.observedAtUtc)>120000||Date.parse(u.observedAtUtc)>now))reasons.push('USAGE_UNKNOWN_OR_STALE');
 if(!timeOnly&&u&&(u.outputTokens>=s.p.usageLimits.stopOutput||u.uncachedInputTokens>=s.p.usageLimits.stopUncachedInput))reasons.push('TOKEN_STOP');
 return{workstreamId:s.p.workstreamId,batch:s.p.batch,policySHA256:s.digest,deadlineUtc:s.p.deadlineUtc,budgetMode:timeOnly?'owner-time-only-continuation':'token-and-time',counts:s.counts,usage:u,
  warning:!timeOnly&&!!u&&(u.outputTokens>=s.p.usageLimits.warnOutput||u.uncachedInputTokens>=s.p.usageLimits.warnUncachedInput),reasons,admitted:reasons.length===0};
}
export function recordBatchUsage(path,usage){return withLock(path,s=>{
 check(!s.closed,'CLOSED');check(usage&&['COMPLETE','UNKNOWN'].includes(usage.status)&&Number.isFinite(Date.parse(usage.observedAtUtc))
  &&['outputTokens','uncachedInputTokens','responses'].every(k=>Number.isSafeInteger(usage[k])&&usage[k]>=0),'USAGE');
 if(s.usage)check(usage.outputTokens>=s.usage.outputTokens&&usage.uncachedInputTokens>=s.usage.uncachedInputTokens&&usage.responses>=s.usage.responses,'USAGE_ROLLBACK');
 append(path,s,{type:'usage',usage});return inspectBatch(path);
});}
export function reserveBatchAction(path,{kind,sourceSHA,identity,now=Date.now(),reserveMs=0}){return withLock(path,s=>{
 check(Object.hasOwn(s.counts,kind)&&/^[a-f0-9]{40}$/.test(sourceSHA??'')&&/^[A-Za-z0-9_.:-]{1,100}$/.test(identity??''),'ACTION');
 const status=inspectBatch(path,{now,reserveMs});check(status.admitted,status.reasons[0]);
 check(s.counts[kind]<s.p.allowance[kind],'ALLOWANCE_EXHAUSTED');
 check(!s.reservations.some(e=>e.kind===kind&&e.identity===identity),'DUPLICATE');
 append(path,s,{type:'reserve',kind,sourceSHA,identity,atUtc:new Date(now).toISOString(),reserveMs});return inspectBatch(path,{now});
});}
export function closeBatch(path){return withLock(path,s=>{if(!s.closed)append(path,s,{type:'close',atUtc:new Date().toISOString()});return inspectBatch(path);});}
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
