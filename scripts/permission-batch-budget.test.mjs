import test from'node:test';import assert from'node:assert/strict';
import{mkdtempSync,writeFileSync,readFileSync,rmSync,unlinkSync}from'node:fs';import{join}from'node:path';import{createHash}from'node:crypto';import{tmpdir}from'node:os';
import{lstatSync}from'node:fs';
import{initializeBatch,recordBatchUsage,reserveBatchAction,inspectBatch,measureBatchUsage,closeBatch,reservePublicationPair,reserveHeavyProfile,settleBatchDispatch,assertBatchScope,reservePostGateCi}from'./permission-batch-budget.mjs';
const sha='a'.repeat(40),now=Date.now();
function fixture(fn){const dir=mkdtempSync(join(process.env.TEMP??tmpdir(),'permission-budget-')),file=join(dir,'budget.json');
 const p={schemaVersion:'permission-batch-budget-v1',workstreamId:'permission-test',batch:'A',originalStartedAtUtc:new Date(now-1000).toISOString(),deadlineUtc:new Date(now+89*60000).toISOString(),allowance:{publication:1,ci:1,heavy:2,reviewRounds:2},usageLimits:{warnOutput:30000,stopOutput:50000,warnUncachedInput:100000,stopUncachedInput:150000}};
 writeFileSync(file,JSON.stringify(p));initializeBatch(file);recordBatchUsage(file,{status:'COMPLETE',observedAtUtc:new Date(now).toISOString(),outputTokens:5,uncachedInputTokens:10,responses:1});
 return Promise.resolve().then(()=>fn({dir,file,p})).finally(()=>rmSync(dir,{recursive:true}));}
test('budget persists allowances across source and identity changes, refuses exhaustion and duplicate actions',()=>fixture(({file})=>{
 reserveBatchAction(file,{kind:'heavy',sourceSHA:sha,identity:'pin',now});
 assert.throws(()=>reserveBatchAction(file,{kind:'heavy',sourceSHA:sha,identity:'pin',now}),/REFUSED/);
 reserveBatchAction(file,{kind:'heavy',sourceSHA:'b'.repeat(40),identity:'t04',now});
 assert.throws(()=>reserveBatchAction(file,{kind:'heavy',sourceSHA:'c'.repeat(40),identity:'new-error-new-chat',now}),/REFUSED/);
 assert.equal(inspectBatch(file,{now}).counts.heavy,2);assert.throws(()=>initializeBatch(file),/REFUSED/);
}));
test('original deadline and immutable allocation cannot be extended by manifest drift',()=>fixture(({file,p})=>{
 assert.equal(inspectBatch(file,{now:Date.parse(p.deadlineUtc)}).admitted,false);
 assert.equal(inspectBatch(file,{now,reserveMs:90*60000}).admitted,false);
 writeFileSync(file,JSON.stringify({...p,deadlineUtc:new Date(now+90*60000).toISOString()}));assert.throws(()=>inspectBatch(file,{now}),/REFUSED/);
}));
test('token warning is observable, stop/unknown/stale deny action and usage rollback fails closed',()=>fixture(({file})=>{
 const put=(status,outputTokens,at=now)=>recordBatchUsage(file,{status,observedAtUtc:new Date(at).toISOString(),outputTokens,uncachedInputTokens:10,responses:1});
 put('COMPLETE',30000);assert.equal(inspectBatch(file,{now}).warning,true);
 put('UNKNOWN',30000);assert.equal(inspectBatch(file,{now}).admitted,false);
 put('COMPLETE',50000);assert.throws(()=>reserveBatchAction(file,{kind:'ci',sourceSHA:sha,identity:'ci',now}),/REFUSED/);
 assert.throws(()=>put('COMPLETE',49999),/REFUSED/);
 assert.equal(inspectBatch(file,{now:now+120001}).admitted,false);
}));
test('journal corruption cannot reset spent allowances',()=>fixture(({file})=>{
 reserveBatchAction(file,{kind:'publication',sourceSHA:sha,identity:'publish',now});
 const path=file+'.journal.jsonl',rows=readFileSync(path,'utf8').trim().split('\n');writeFileSync(path,rows.slice(1).join('\n')+'\n');
 assert.throws(()=>inspectBatch(file,{now}),/REFUSED/);
}));
test('usage deduplicates actual per-response records, includes descendants, excludes old/unrelated records and does not add reasoning twice',()=>fixture(async({dir})=>{
 const stamp=new Date(now).toISOString(),line=(type,payload)=>JSON.stringify({timestamp:stamp,type,payload});
 const usage={input_tokens:100,cached_input_tokens:80,output_tokens:9,reasoning_output_tokens:5};
 const root=join(dir,'root.jsonl'),child=join(dir,'child.jsonl'),other=join(dir,'other.jsonl');
 writeFileSync(root,[line('session_meta',{id:'root'}),line('event_msg',{type:'task_started'}),line('token_usage_record',{thread_id:'root',response_id:'r',usage}),line('token_usage_record',{thread_id:'root',response_id:'r',usage}),line('event_msg',{type:'token_count',info:{total_token_usage:{output_tokens:99999}}})].join('\n'));
 writeFileSync(child,[line('session_meta',{id:'child',source:{subagent:{thread_spawn:{parent_thread_id:'root'}}}}),line('event_msg',{type:'task_started'}),line('token_usage_record',{thread_id:'child',response_id:'c',usage})].join('\n'));
 writeFileSync(other,[line('session_meta',{id:'other'}),line('token_usage_record',{thread_id:'other',response_id:'o',usage})].join('\n'));
 const result=await measureBatchUsage([root,child,other],{rootThreadId:'root',startedAtUtc:new Date(now-500).toISOString()});
 assert.equal(result.status,'COMPLETE');assert.equal(result.outputTokens,18);assert.equal(result.uncachedInputTokens,40);assert.equal(result.responses,2);
}));

const hashFile=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
function successor(file,p,extra={}){
 const next=file+'.continuation.json';
 const value={...p,schemaVersion:'permission-batch-budget-v2',budgetMode:'owner-time-only-continuation',usageLimits:null,
  deadlineUtc:new Date(now+120*60000).toISOString(),ownerAuthorization:{reference:'codex://threads/test user explicitly authorizes unlimited tokens until absolute deadline',authorizedAtUtc:new Date(now).toISOString(),authorizedDeadlineUtc:new Date(now+120*60000).toISOString()},
  predecessor:{path:file,policySHA256:hashFile(file),anchorSHA256:hashFile(file+'.anchor.json'),journalSHA256:hashFile(file+'.journal.jsonl')},...extra};
 writeFileSync(next,JSON.stringify(value));return{next,value};
}

function executionGrant(file,p,change=x=>x,beforeClose=()=>{}){
 closeBatch(file);const first=successor(file,p);initializeBatch(first.next);
 reserveBatchAction(first.next,{kind:'publication',sourceSHA:sha,identity:'published',now});
 reserveBatchAction(first.next,{kind:'ci',sourceSHA:sha,identity:'ci',now});
 reserveBatchAction(first.next,{kind:'heavy',sourceSHA:sha,identity:'old-pin',now});beforeClose(first.next);closeBatch(first.next);
 const path=first.next+'.grant.json',authorizedAtUtc=new Date(Math.max(Date.now()+1000,now+1000)).toISOString();
 const value={...first.value,schemaVersion:'permission-batch-budget-v3',allowance:{publication:2,ci:2,heavy:3,reviewRounds:4},ownerAuthorization:{reference:'codex://threads/test explicit owner approves one additional publication/CI/heavy and two reviews',authorizedAtUtc,authorizedDeadlineUtc:first.value.deadlineUtc,additionalActions:{publication:1,ci:1,heavy:1,reviewRounds:2},actionGrantReference:'Owner explicitly grants exactly these four increments without resetting spent or changing deadline'},predecessor:{path:first.next,policySHA256:hashFile(first.next),anchorSHA256:hashFile(first.next+'.anchor.json'),journalSHA256:hashFile(first.next+'.journal.jsonl')}};
 change(value);writeFileSync(path,JSON.stringify(value));return{path,value};
}
test('explicit execution grant carries spent and adds exactly approved actions with unchanged deadline',()=>fixture(({file,p})=>{
 const{path}=executionGrant(file,p);initializeBatch(path);const status=inspectBatch(path,{now:now+2000});
 assert.deepEqual(status.counts,{publication:1,ci:1,heavy:1,reviewRounds:0});
 reserveBatchAction(path,{kind:'publication',sourceSHA:sha,identity:'new-publish',now:now+2000});
 assert.throws(()=>reserveBatchAction(path,{kind:'publication',sourceSHA:sha,identity:'third-publish',now:now+2000}),e=>e.reason==='ALLOWANCE_EXHAUSTED');
 assert.equal(inspectBatch(path,{now:Date.parse(status.deadlineUtc)}).admitted,false);
}));
test('execution grant rejects missing authorization, wrong increments, changed deadline and old authorization',async()=>{
 for(const mutate of [v=>delete v.ownerAuthorization.additionalActions,v=>v.ownerAuthorization.additionalActions.heavy=2,v=>v.allowance.ci=1,v=>v.deadlineUtc=new Date(now+150*60000).toISOString(),v=>v.ownerAuthorization.authorizedAtUtc=new Date(now-1000).toISOString(),v=>v.ownerAuthorization.additionalReviewRounds=2])await fixture(({file,p})=>{
  const{path}=executionGrant(file,p,mutate);assert.throws(()=>initializeBatch(path));
 });
});
test('execution grant cannot be replayed through a sibling policy',()=>fixture(({file,p})=>{
 const{path}=executionGrant(file,p);initializeBatch(path);const sibling=path+'.sibling';writeFileSync(sibling,readFileSync(path));assert.throws(()=>initializeBatch(sibling),e=>e.reason==='SUCCESSOR_CONFLICT');
}));
test('grant must follow every cumulative reservation even when API timestamps are appended out of order',()=>fixture(({file,p})=>{
 const{path}=executionGrant(file,p,value=>{value.ownerAuthorization.authorizedAtUtc=new Date(now+10*60000+1000).toISOString();},prior=>{
  reserveBatchAction(prior,{kind:'heavy',sourceSHA:sha,identity:'later-time',now:now+20*60000});
  reserveBatchAction(prior,{kind:'reviewRounds',sourceSHA:sha,identity:'backdated-last-event',now:now+10*60000});
 });
 assert.throws(()=>initializeBatch(path),error=>error.reason==='REVIEW_GRANT_REPLAY');
}));
test('valid journal suffix truncation and truncation to empty fail against independently pinned head',()=>fixture(({file})=>{
 reserveBatchAction(file,{kind:'publication',sourceSHA:sha,identity:'publish',now});
 const path=file+'.journal.jsonl',raw=readFileSync(path,'utf8'),rows=raw.trim().split('\n');
 writeFileSync(path,rows.slice(0,-1).join('\n')+'\n');assert.throws(()=>inspectBatch(file,{now}),e=>e.reason==='HEAD_DRIFT');
 writeFileSync(path,'');assert.throws(()=>inspectBatch(file,{now}),e=>e.reason==='HEAD_DRIFT');
}));
test('missing, stale and pending head states fail closed rather than repairing journal or resetting counters',()=>fixture(({file})=>{
 const head=file+'.head.json',saved=readFileSync(head,'utf8');
 reserveBatchAction(file,{kind:'heavy',sourceSHA:sha,identity:'first',now});
 writeFileSync(head,saved);assert.throws(()=>inspectBatch(file,{now}),e=>e.reason==='HEAD_DRIFT');
 unlinkSync(head);assert.throws(()=>inspectBatch(file,{now}),e=>e.reason==='HEAD_MISSING');
 writeFileSync(file+'.head.tmp','partial update');assert.throws(()=>inspectBatch(file,{now}),e=>e.reason==='HEAD_PENDING');
}));
test('negative, nonfinite and fractional time reservation arguments cannot bypass deadline',()=>fixture(({file})=>{
 for(const reserveMs of[-1,NaN,Infinity,0.5]){
  assert.throws(()=>inspectBatch(file,{now,reserveMs}),e=>e.reason==='TIME_ARGUMENT');
  assert.throws(()=>reserveBatchAction(file,{kind:'heavy',sourceSHA:sha,identity:'bad',now,reserveMs}),e=>e.reason==='TIME_ARGUMENT');
 }
 assert.equal(inspectBatch(file,{now}).counts.heavy,0);
}));
test('explicit time-only successor carries cumulative spent and usage from closed predecessor; no token stop and absolute deadline remains',()=>fixture(({file,p})=>{
 reserveBatchAction(file,{kind:'heavy',sourceSHA:sha,identity:'old-heavy',now});
 recordBatchUsage(file,{status:'COMPLETE',observedAtUtc:new Date(now).toISOString(),outputTokens:50000,uncachedInputTokens:150000,responses:2});closeBatch(file);
 const{next}=successor(file,p);initializeBatch(next);
 const status=inspectBatch(next,{now:now+300000});assert.equal(status.admitted,true);assert.equal(status.counts.heavy,1);assert.equal(status.usage.outputTokens,50000);
 assert.throws(()=>reserveBatchAction(next,{kind:'heavy',sourceSHA:sha,identity:'old-heavy',now}),e=>e.reason==='DUPLICATE');
 reserveBatchAction(next,{kind:'heavy',sourceSHA:'b'.repeat(40),identity:'new-heavy',now});
 assert.throws(()=>reserveBatchAction(next,{kind:'heavy',sourceSHA:sha,identity:'third-heavy',now}),e=>e.reason==='ALLOWANCE_EXHAUSTED');
 assert.equal(inspectBatch(next,{now:now+120*60000}).admitted,false);assert.equal(inspectBatch(file,{now}).reasons.includes('CLOSED'),true);
}));
test('successor rejects open predecessor, allowance reset, changed origin and unpinned historical drift',()=>fixture(({file,p})=>{
 const{next,value}=successor(file,p);assert.throws(()=>initializeBatch(next),e=>e.reason==='PREDECESSOR_STATE');
 closeBatch(file);value.predecessor.journalSHA256=hashFile(file+'.journal.jsonl');
 for(const change of[{allowance:{...p.allowance,heavy:1}},{originalStartedAtUtc:new Date(now-500).toISOString()}]){
  writeFileSync(next,JSON.stringify({...value,...change}));assert.throws(()=>initializeBatch(next),e=>e.reason==='PREDECESSOR_STATE');
 }
 writeFileSync(next,JSON.stringify(value));initializeBatch(next);writeFileSync(file+'.journal.jsonl','');
 assert.throws(()=>inspectBatch(next,{now}),e=>e.reason==='PREDECESSOR_DRIFT');
}));
test('sealed legacy closed journal may be imported only with explicit exact hashes, never silently trusted by normal inspection',()=>fixture(({file,p})=>{
 reserveBatchAction(file,{kind:'publication',sourceSHA:sha,identity:'old-publish',now});closeBatch(file);unlinkSync(file+'.head.json');
 assert.throws(()=>inspectBatch(file,{now}),e=>e.reason==='HEAD_MISSING');
 const{next,value}=successor(file,p);value.predecessor.legacyWithoutHead=true;writeFileSync(next,JSON.stringify(value));initializeBatch(next);
 assert.equal(inspectBatch(next,{now}).counts.publication,1);
 assert.throws(()=>reserveBatchAction(next,{kind:'publication',sourceSHA:sha,identity:'publish-again',now}),e=>e.reason==='ALLOWANCE_EXHAUSTED');
}));

test('usage conflicting duplicate or malformed timestamp is UNKNOWN rather than understated COMPLETE',()=>fixture(async({dir})=>{
 const file=join(dir,'usage.jsonl'),stamp=new Date(now).toISOString(),usage={input_tokens:100,cached_input_tokens:80,output_tokens:9};
 const rows=[{timestamp:stamp,type:'session_meta',payload:{id:'root'}},{timestamp:stamp,type:'token_usage_record',payload:{thread_id:'root',response_id:'r',usage}}];
 for(const bad of[{timestamp:stamp,type:'token_usage_record',payload:{thread_id:'root',response_id:'r',usage:{...usage,output_tokens:99}}},{timestamp:'invalid',type:'token_usage_record',payload:{thread_id:'root',response_id:'different',usage}}]){
  writeFileSync(file,[...rows,bad].map(r=>JSON.stringify(r)).join('\n'));
  assert.equal((await measureBatchUsage([file],{rootThreadId:'root',startedAtUtc:new Date(now-500).toISOString()})).status,'UNKNOWN');
 }
}));

test('explicit owner grant adds exactly two review rounds while carrying spent and all execution allowances',()=>fixture(({file,p})=>{
 reserveBatchAction(file,{kind:'reviewRounds',sourceSHA:sha,identity:'round-1',now});reserveBatchAction(file,{kind:'reviewRounds',sourceSHA:sha,identity:'round-2',now});
 reserveBatchAction(file,{kind:'heavy',sourceSHA:sha,identity:'old-heavy',now});closeBatch(file);
 const{next,value}=successor(file,p);value.allowance.reviewRounds=4;value.ownerAuthorization.additionalReviewRounds=2;
 value.ownerAuthorization.reviewGrantReference='Owner explicitly adds maximum two independent review rounds, no execution reset';value.ownerAuthorization.authorizedAtUtc=new Date(Date.now()+1000).toISOString();
 writeFileSync(next,JSON.stringify(value));initializeBatch(next);assert.deepEqual(inspectBatch(next,{now:now+2000}).counts,{publication:0,ci:0,heavy:1,reviewRounds:2});
 reserveBatchAction(next,{kind:'reviewRounds',sourceSHA:sha,identity:'round-3',now:now+2000});reserveBatchAction(next,{kind:'reviewRounds',sourceSHA:sha,identity:'round-4',now:now+2000});
 assert.throws(()=>reserveBatchAction(next,{kind:'reviewRounds',sourceSHA:sha,identity:'round-5',now:now+2000}),e=>e.reason==='ALLOWANCE_EXHAUSTED');
 assert.equal(inspectBatch(next,{now:now+2000}).counts.heavy,1);
}));

test('review allowance cannot increase without an explicit grant or increase execution allowances',()=>fixture(({file,p})=>{
 closeBatch(file);const{next,value}=successor(file,p);value.ownerAuthorization.authorizedAtUtc=new Date(Date.now()+1000).toISOString();
 for(const changed of[
  {...value,allowance:{...p.allowance,reviewRounds:4}},
  {...value,allowance:{...p.allowance,reviewRounds:4},ownerAuthorization:{...value.ownerAuthorization,additionalReviewRounds:1,reviewGrantReference:'Wrong size grant'}},
  {...value,allowance:{...p.allowance,reviewRounds:4},ownerAuthorization:{...value.ownerAuthorization,additionalReviewRounds:2}},
  {...value,allowance:{...p.allowance,reviewRounds:4,heavy:3},ownerAuthorization:{...value.ownerAuthorization,additionalReviewRounds:2,reviewGrantReference:'Two review rounds only'}},
 ]){writeFileSync(next,JSON.stringify(changed));assert.throws(()=>initializeBatch(next),/REFUSED/);}
}));

test('a review grant cannot be replayed across successors to multiply the allowance',()=>fixture(({file,p})=>{
 closeBatch(file);const{next,value}=successor(file,p);value.allowance.reviewRounds=4;value.ownerAuthorization.additionalReviewRounds=2;
 value.ownerAuthorization.reviewGrantReference='Owner grants only two more reviews';value.ownerAuthorization.authorizedAtUtc=new Date(Date.now()+1000).toISOString();writeFileSync(next,JSON.stringify(value));initializeBatch(next);closeBatch(next);
 const again=successor(next,value);again.value.allowance.reviewRounds=6;writeFileSync(again.next,JSON.stringify(again.value));assert.throws(()=>initializeBatch(again.next),/REFUSED/);
}));

test('identical owner grant cannot initialize sibling successors and split cumulative spent',()=>fixture(({file,p})=>{
 reserveBatchAction(file,{kind:'reviewRounds',sourceSHA:sha,identity:'original-1',now});reserveBatchAction(file,{kind:'reviewRounds',sourceSHA:sha,identity:'original-2',now});closeBatch(file);
 const{next,value}=successor(file,p);value.allowance.reviewRounds=4;value.ownerAuthorization.additionalReviewRounds=2;
 value.ownerAuthorization.reviewGrantReference='Owner grants two reviews once, not per successor path';value.ownerAuthorization.authorizedAtUtc=new Date(Date.now()+1000).toISOString();writeFileSync(next,JSON.stringify(value));initializeBatch(next);
 const sibling=next+'.sibling.json';writeFileSync(sibling,JSON.stringify(value));assert.throws(()=>initializeBatch(sibling),e=>e.reason==='SUCCESSOR_CONFLICT');
 reserveBatchAction(next,{kind:'reviewRounds',sourceSHA:sha,identity:'new-3',now:now+2000});reserveBatchAction(next,{kind:'reviewRounds',sourceSHA:sha,identity:'new-4',now:now+2000});
 assert.equal(inspectBatch(next,{now:now+2000}).counts.reviewRounds,4);
 assert.equal(lstatSync(sibling+'.anchor.json',{throwIfNoEntry:false}),undefined);
}));

test('single successor also prevents time-only execution budget forks; missing or changed claim fails closed',()=>fixture(({file,p})=>{
 reserveBatchAction(file,{kind:'heavy',sourceSHA:sha,identity:'old-heavy',now});closeBatch(file);const{next,value}=successor(file,p);initializeBatch(next);
 const sibling=next+'.sibling.json';writeFileSync(sibling,JSON.stringify(value));assert.throws(()=>initializeBatch(sibling),e=>e.reason==='SUCCESSOR_CONFLICT');
 const claim=file+'.successor.json',saved=readFileSync(claim);unlinkSync(claim);assert.throws(()=>inspectBatch(next,{now}),e=>e.reason==='SUCCESSOR_CLAIM_MISSING');
 writeFileSync(claim,JSON.stringify({...JSON.parse(saved),childPath:sibling}));assert.throws(()=>inspectBatch(next,{now}),e=>e.reason==='SUCCESSOR_CONFLICT');
 writeFileSync(claim,saved);assert.equal(inspectBatch(next,{now}).counts.heavy,1);
}));


import{PROJECT_PHASES}from'./project-ci-results.mjs';
const put=(dir,name,value)=>{const path=join(dir,name);writeFileSync(path,JSON.stringify(value));return{path,sha256:hashFile(path)};};
const pinParent=path=>({path,policySHA256:hashFile(path),anchorSHA256:hashFile(path+'.anchor.json'),journalSHA256:hashFile(path+'.journal.jsonl'),headSHA256:hashFile(path+'.head.json')});
function v4Fixture(fn,limits={publication:2,ci:2,heavy:8,reviewRounds:null}){const now=Date.now()+10000;return fixture(({dir,file,p})=>{
 for(let i=0;i<2;i++)reserveBatchAction(file,{kind:'reviewRounds',sourceSHA:sha,identity:'v1-review-'+i,now});closeBatch(file);
 const v2=successor(file,p);v2.value.allowance.reviewRounds=4;Object.assign(v2.value.ownerAuthorization,{additionalReviewRounds:2,reviewGrantReference:'Owner grants two additional reviews',authorizedAtUtc:new Date(now+2000).toISOString()});writeFileSync(v2.next,JSON.stringify(v2.value));initializeBatch(v2.next);
 for(const kind of['publication','ci','heavy','reviewRounds','reviewRounds'])reserveBatchAction(v2.next,{kind,sourceSHA:sha,identity:'v2-'+kind+'-'+inspectBatch(v2.next,{now:now+3000}).counts[kind],now:now+3000});closeBatch(v2.next);
 const v3=join(dir,'v3.json'),value={...v2.value,schemaVersion:'permission-batch-budget-v3',allowance:{publication:2,ci:2,heavy:3,reviewRounds:6},ownerAuthorization:{reference:'Owner grants the separate third immutable legacy phase',authorizedAtUtc:new Date(now+3500).toISOString(),authorizedDeadlineUtc:v2.value.deadlineUtc,additionalActions:{publication:1,ci:1,heavy:1,reviewRounds:2},actionGrantReference:'Actual one-time owner execution grant recorded independently'},predecessor:pinParent(v2.next)};
 writeFileSync(v3,JSON.stringify(value));initializeBatch(v3);
 for(const kind of['publication','ci','reviewRounds','reviewRounds'])reserveBatchAction(v3,{kind,sourceSHA:sha,identity:'v3-'+kind+'-'+inspectBatch(v3,{now:now+4000}).counts[kind],now:now+4000});closeBatch(v3);
 const prior=inspectBatch(v3,{now:now+5000}),storage={baselineFreeBytes:{C:100*1024**3,D:100*1024**3},taskMaximumBytes:20*1024**3,reserveBytes:30*1024**3,ciMaximumBytes:5*1024**3};
 const pred={policySHA256:hashFile(v3),journalSHA256:hashFile(v3+'.journal.jsonl'),counts:prior.counts};
 const policy1=put(dir,'external-policy1.json',{schemaVersion:'permission-release-phase-admission-v1',phaseId:'old-release',repository:'nguyentronglinh045/pos-cafe',branch:'run/permissions-20261020',sourceSHA:'c'.repeat(40),expectedRemoteSHA:sha,packet:{sha256:'1'.repeat(64)},reviews:{sha256:'2'.repeat(64)},storage});
 const claim1=put(dir,'external-claim1.json',{schemaVersion:'permission-release-phase-publication-claim-v1',phaseId:'old-release',atUtc:new Date(now+4500).toISOString(),policySHA256:policy1.sha256,packetSHA256:'1'.repeat(64),reviewsSHA256:'2'.repeat(64),sourceSHA:'c'.repeat(40),expectedRemoteSHA:sha,predecessor:pred,actions:{publication:1,ci:1}});
 const continuation={parentPolicy:policy1,parentClaim:claim1,additionalActions:{publication:1,ci:1}};
 const policy2=put(dir,'external-policy2.json',{schemaVersion:'permission-release-phase-admission-v2',phaseId:'old-release',repository:'nguyentronglinh045/pos-cafe',branch:'run/permissions-20261020',sourceSHA:'d'.repeat(40),expectedRemoteSHA:'c'.repeat(40),packet:{sha256:'3'.repeat(64)},reviews:{sha256:'4'.repeat(64)},storage,continuation});
 const claim2=put(dir,'external-claim2.json',{schemaVersion:'permission-release-phase-publication-claim-v2',phaseId:'old-release',atUtc:new Date(now+4700).toISOString(),policySHA256:policy2.sha256,packetSHA256:'3'.repeat(64),reviewsSHA256:'4'.repeat(64),sourceSHA:'d'.repeat(40),expectedRemoteSHA:'c'.repeat(40),predecessor:pred,actions:{publication:1,ci:1},continuation});
 const deadlineUtc=new Date(now+6*3600000).toISOString(),recordedAtUtc=new Date(now+5000).toISOString(),reference='Actual owner reply granting this new phase once';
 const receipt=put(dir,'owner.json',{reference,recordedAtUtc,authorizedDeadlineUtc:deadlineUtc,answer:'Explicitly approved with unchanged full gate',phaseActionLimits:{candidatePublication:limits.publication,candidateCi:limits.ci,heavyProfiles:limits.heavy,reviewRounds:null}});
 const next=join(dir,'v4.json'),v4={schemaVersion:'permission-batch-budget-v4',workstreamId:p.workstreamId,batch:'A',phaseId:'new-phase',originalStartedAtUtc:p.originalStartedAtUtc,deadlineUtc,budgetMode:'owner-time-only-continuation',usageLimits:null,ownerAuthorization:{reference,recordedAtUtc,receipt},phaseActionLimits:limits,scope:{repository:'nguyentronglinh045/pos-cafe',branch:'run/permissions-20261020',sourceRoot:dir,profiles:['SUPABASE_T04','SUPABASE_T02','PIN_ONBOARD','PIN_RACE','PIN_EXPIRY','PIN_IDENTITY_SERVER','PIN_IDENTITY_ONBOARDING','PIN_CANARY']},storage,predecessor:pinParent(v3),legacyBridge:[{policy:policy1,claim:claim1},{policy:policy2,claim:claim2}]};
 const save=()=>writeFileSync(next,JSON.stringify(v4));save();const context={...v4.scope,sourceSHA:'e'.repeat(40),identity:'dispatch-1',now:now+6000};
 return fn({dir,file:next,p:v4,save,context,prior:v3,refs:{claim1,claim2,policy1,policy2}});
 });}
function terminal(f,reservation,{kind='heavy',conclusion='failure',sourceSHA=f.context.sourceSHA,profile='PIN_IDENTITY_SERVER',runId='123',mutate=()=>{},observation}={}){
 const base=reservation.reservationId.slice(0,12),meta={id:Number(runId),head_sha:sourceSHA,run_attempt:1,status:'completed',conclusion,path:'.github/workflows/'+(kind==='publication'?'ci.yml':'backend.yml'),event:kind==='publication'?'push':'workflow_dispatch',repository:{full_name:f.context.repository,id:1263057386},head_repository:{full_name:f.context.repository,id:1263057386},head_branch:f.context.branch};
 const r=kind==='publication'?{schemaVersion:'permission-pg16-reclaim-v1',status:'NOT_PRESENT',rootRemoved:true,processReleased:true,sourceSHA,runId}:{schemaVersion:'permission-ci1-reclaim-v1',status:'RECLAIMED',imageUnlinked:true,measuredHostFreeDeltaBytes:1000};
 const observed=observation??(kind==='publication'?{schemaVersion:'pos-cafe-light-ci-v1',repository:f.context.repository,sourceSHA,workflowSHA:sourceSHA,runId,attempt:1,sourcePreserved:true,overallStatus:'PASS',phases:PROJECT_PHASES.map(id=>({id,status:'PASS',exitCode:0}))}:{schemaVersion:profile==='SUPABASE_T04'?'t04-observed-checkpoint-v1':'service-observed-checkpoint-v1',sourceSHA,runId,attempt:1,executionProfile:profile,conclusion,logSHA256:'a'.repeat(64),reclaim:[r],evidence:[]});
 mutate({meta,reclaim:r,observation:observed});
 const proof={schemaVersion:'permission-batch-terminal-v1',reservationId:reservation.reservationId,kind,sourceSHA,profile:kind==='publication'?null:profile,runId,attempt:1,conclusion,metadata:put(f.dir,base+'-metadata.json',meta),observation:put(f.dir,base+'-observation.json',observed),reclaim:put(f.dir,base+'-reclaim.json',r)};
 return{reservationId:reservation.reservationId,sourceSHA,profile:proof.profile,runId,attempt:1,conclusion,terminal:put(f.dir,base+'-terminal.json',proof),now:f.context.now};
}
test('V4 derives historical4/4/1/6 from closed legacy chain and two claims without double-counting; no token cap',()=>v4Fixture(f=>{
 initializeBatch(f.file);const s=inspectBatch(f.file,{now:f.context.now});assert.deepEqual(s.historicalCounts,{publication:4,ci:4,heavy:1,reviewRounds:6});assert.deepEqual(s.phaseCounts,{publication:0,ci:0,heavy:0,reviewRounds:0});assert.deepEqual(s.counts,s.historicalCounts);assert.equal(s.admitted,true);
 recordBatchUsage(f.file,{status:'UNKNOWN',observedAtUtc:new Date(f.context.now).toISOString(),outputTokens:999999,uncachedInputTokens:9999999,responses:10});assert.equal(inspectBatch(f.file,{now:f.context.now}).admitted,true);
}));
test('V4 bridge rejects missing, duplicate, tampered and wrong-parent history before consuming successor claim',async()=>{
 for(const change of[f=>f.p.legacyBridge.pop(),f=>f.p.legacyBridge[1]=f.p.legacyBridge[0],f=>writeFileSync(f.refs.claim2.path,'{}'),f=>{const v=JSON.parse(readFileSync(f.refs.claim2.path));v.continuation.parentClaim.sha256='f'.repeat(64);f.p.legacyBridge[1].claim=put(f.dir,'wrong-parent.json',v);}])await v4Fixture(f=>{
  change(f);f.save();assert.throws(()=>initializeBatch(f.file),/REFUSED/);assert.equal(lstatSync(f.prior+'.successor.json',{throwIfNoEntry:false}),undefined);assert.equal(lstatSync(f.file+'.anchor.json',{throwIfNoEntry:false}),undefined);
 });
});
test('V4 owner receipt, deadline, scope and fixed root bindings cannot be omitted or drifted',async()=>{
 for(const change of[f=>f.p.ownerAuthorization.reference='PENDING',f=>f.p.phaseActionLimits.heavy=9,f=>f.p.deadlineUtc=new Date(now+7*3600000).toISOString(),f=>f.p.scope.profiles=['unknown']])await v4Fixture(f=>{change(f);f.save();assert.throws(()=>initializeBatch(f.file),/REFUSED/);});
 await v4Fixture(f=>{initializeBatch(f.file);for(const change of[{repository:'other/repo'},{branch:'main'},{sourceRoot:tmpdir()},{sourceSHA:'bad'},{profile:'unknown'}])assert.throws(()=>assertBatchScope(f.file,{...f.context,...change}),/REFUSED/);});
});
test('V4 publication atomically spends one push plus CI, pending blocks competitors and own revalidation keeps deadline',()=>v4Fixture(f=>{
 initializeBatch(f.file);const r=reservePublicationPair(f.file,f.context),s=inspectBatch(f.file,{now:f.context.now});assert.deepEqual(s.phaseCounts,{publication:1,ci:1,heavy:0,reviewRounds:0});assert.equal(s.reasons.includes('PENDING'),true);assert.equal(inspectBatch(f.file,{now:f.context.now,reservationId:r.reservationId}).admitted,true);
 assert.throws(()=>assertBatchScope(f.file,{...f.context,sourceSHA:'f'.repeat(40),reservationId:r.reservationId}),e=>e.reason==='PENDING_SCOPE');
 assert.throws(()=>reservePublicationPair(f.file,{...f.context,identity:'competing',sourceSHA:'f'.repeat(40)}),e=>e.reason==='PENDING');
 assert.equal(inspectBatch(f.file,{now:Date.parse(f.p.deadlineUtc)-42*60000,reserveMs:42*60000,reservationId:r.reservationId}).admitted,false);
 settleBatchDispatch(f.file,terminal(f,r,{kind:'publication',conclusion:'success'}));assert.equal(inspectBatch(f.file,{now:f.context.now}).pending.length,0);
 assert.throws(()=>reservePublicationPair(f.file,{...f.context,identity:'same-sha-retry'}),e=>e.reason==='DUPLICATE');
 const r2=reservePublicationPair(f.file,{...f.context,identity:'second-candidate',sourceSHA:'f'.repeat(40)});settleBatchDispatch(f.file,terminal(f,r2,{kind:'publication',conclusion:'success',sourceSHA:'f'.repeat(40),runId:'124'}));
 assert.throws(()=>reservePublicationPair(f.file,{...f.context,identity:'third',sourceSHA:'1'.repeat(40)}),e=>e.reason==='ALLOWANCE_EXHAUSTED');assert.equal(inspectBatch(f.file,{now:f.context.now}).counts.publication,6);
}));
test('V4 readonly review recording remains time-only during pending CI and cannot release a dispatch slot',()=>v4Fixture(f=>{
 initializeBatch(f.file);reservePublicationPair(f.file,f.context);
 reserveBatchAction(f.file,{kind:'reviewRounds',sourceSHA:f.context.sourceSHA,identity:'independent-review-while-ci-pending',now:f.context.now});
 const s=inspectBatch(f.file,{now:f.context.now});assert.equal(s.phaseCounts.reviewRounds,1);assert.equal(s.pending.length,1);
 assert.throws(()=>reserveHeavyProfile(f.file,{...f.context,profile:'PIN_CANARY',identity:'concurrent-heavy'}),e=>e.reason==='PENDING');
 assert.throws(()=>reservePublicationPair(f.file,{...f.context,identity:'concurrent-publication',sourceSHA:'f'.repeat(40)}),e=>e.reason==='PENDING');
 assert.throws(()=>reserveBatchAction(f.file,{kind:'reviewRounds',sourceSHA:f.context.sourceSHA,identity:'expired-review',now:Date.parse(f.p.deadlineUtc)}),e=>e.reason==='DEADLINE');
}));
test('V4 heavy reservation persists across uncertain dispatch and failed settlement; valid failure blocks source but allows fixed SHA',()=>v4Fixture(f=>{
 initializeBatch(f.file);const r=reserveHeavyProfile(f.file,{...f.context,profile:'PIN_IDENTITY_SERVER'});assert.throws(()=>reserveHeavyProfile(f.file,{...f.context,profile:'PIN_CANARY',identity:'other'}),e=>e.reason==='PENDING');assert.throws(()=>closeBatch(f.file),e=>e.reason==='PENDING');
 const bad=terminal(f,r,{mutate:x=>x.reclaim.measuredHostFreeDeltaBytes=0});assert.throws(()=>settleBatchDispatch(f.file,bad),/REFUSED/);assert.equal(inspectBatch(f.file,{now:f.context.now}).pending.length,1);
 settleBatchDispatch(f.file,terminal(f,r));assert.throws(()=>reserveHeavyProfile(f.file,{...f.context,profile:'PIN_IDENTITY_SERVER',identity:'retry'}),e=>e.reason==='SOURCE_BLOCKED');
 reserveHeavyProfile(f.file,{...f.context,sourceSHA:'f'.repeat(40),profile:'PIN_IDENTITY_SERVER',identity:'fixed-source'});assert.equal(inspectBatch(f.file,{now:f.context.now}).phaseCounts.heavy,2);
}));
test('V4 heavy max8 persists across SHA changes and valid terminal receipts',()=>v4Fixture(f=>{
 initializeBatch(f.file);for(let i=0;i<8;i++){const sourceSHA=(i+1).toString(16).repeat(40),r=reserveHeavyProfile(f.file,{...f.context,sourceSHA,identity:'heavy-'+i,profile:'PIN_IDENTITY_SERVER'});settleBatchDispatch(f.file,terminal(f,r,{sourceSHA,runId:String(200+i)}));}
 assert.equal(inspectBatch(f.file,{now:f.context.now}).phaseCounts.heavy,8);assert.equal(inspectBatch(f.file,{now:f.context.now}).counts.heavy,9);
 assert.throws(()=>reserveHeavyProfile(f.file,{...f.context,identity:'ninth',profile:'PIN_IDENTITY_SERVER'}),e=>e.reason==='ALLOWANCE_EXHAUSTED');
}));
test('V4 terminal cross-checks actual metadata, profile, attempt, observation and reclaim rather than positive booleans',async()=>{
 for(const change of[x=>x.meta.head_sha='f'.repeat(40),x=>x.meta.run_attempt=2,x=>x.meta.status='in_progress',x=>x.meta.path='.github/workflows/ci.yml',x=>x.observation.executionProfile='PIN_CANARY',x=>x.observation.logSHA256='bad',x=>x.reclaim.imageUnlinked=false])await v4Fixture(f=>{
  initializeBatch(f.file);const r=reserveHeavyProfile(f.file,{...f.context,profile:'PIN_IDENTITY_SERVER'});assert.throws(()=>settleBatchDispatch(f.file,terminal(f,r,{mutate:change})),/REFUSED/);assert.equal(inspectBatch(f.file,{now:f.context.now}).pending.length,1);
 });
});
test('V4 strict42minute boundary and scope checks refuse before claim; old reserve API cannot bypass paired publication',()=>v4Fixture(f=>{
 initializeBatch(f.file);for(const reserveMs of[-1,0,41*60000,NaN,Infinity])assert.throws(()=>reserveHeavyProfile(f.file,{...f.context,profile:'PIN_CANARY',reserveMs}),/REFUSED/);
 assert.throws(()=>reservePublicationPair(f.file,{...f.context,now:Date.parse(f.p.deadlineUtc)-42*60000}),e=>e.reason==='DEADLINE');
 assert.throws(()=>reserveBatchAction(f.file,{kind:'publication',sourceSHA:sha,identity:'bypass',now:f.context.now}),e=>e.reason==='V4_DISPATCH_API_REQUIRED');
 assert.equal(inspectBatch(f.file,{now:f.context.now}).phaseCounts.publication,0);
}));
test('V4 missing or truncated durable head and forked successor cannot reset phase spending',()=>v4Fixture(f=>{
 initializeBatch(f.file);const sibling=f.file+'.sibling';writeFileSync(sibling,JSON.stringify(f.p));assert.throws(()=>initializeBatch(sibling),e=>e.reason==='SUCCESSOR_CONFLICT');
 reservePublicationPair(f.file,f.context);const journal=f.file+'.journal.jsonl';writeFileSync(journal,'');assert.throws(()=>inspectBatch(f.file,{now:f.context.now}),e=>e.reason==='HEAD_DRIFT');
}));

import{spawn}from'node:child_process';
import{pathToFileURL}from'node:url';
import{runtimeStage}from'./permission-runtime-catalog.mjs';
import{serviceProfile}from'./permission-runtime-service-profile.mjs';
function passingService(sourceSHA,runId='123',profile='PIN_IDENTITY_SERVER'){
 const h='a'.repeat(64),p=serviceProfile(profile),stages=p.stages.map(stage=>{const required=runtimeStage(stage).required.length;return{stage,status:'PASS',required,discovered:required,run:required,pass:required,fail:0,skip:0,retry:0,reportSHA:h,sourceSHA,invocationSHA:h,supplementalOracles:'NOT_PROVEN_BY_STAGE_COUNTS'};});
 return{schemaVersion:'permission-service-runtime-v1',scope:'ONE_SERVICE_PROFILE_ONLY',executionProfile:profile,logicalProfile:p.logicalProfile,status:'PASS',failure:null,stages,
  physicalBackendSHA:h,fixtureConnectionClosed:true,full35BusinessRuntime:'NOT_RUN',remainingBusinessStages:35-stages.length,supplementalOracles:'NOT_PROVEN_BY_STAGE_COUNTS',repository:'nguyentronglinh045/pos-cafe',runId,attempt:1,sourceSHA,workflowSHA:sourceSHA,sourceFingerprint:h,lockSHA:h,stoppedPeerSHA:null};
}
test('V4 valid service proof settles success; renderer rejects a skipped required case and proof drift fails closed',()=>v4Fixture(f=>{
 initializeBatch(f.file);const r=reserveHeavyProfile(f.file,{...f.context,profile:'PIN_IDENTITY_SERVER'}),runtime=passingService(f.context.sourceSHA);
 const valid=terminal(f,r,{conclusion:'success',mutate:x=>x.observation.evidence=[runtime]});
 const bad=terminal(f,r,{conclusion:'success',mutate:x=>{x.observation.evidence=[structuredClone(runtime)];x.observation.evidence[0].stages[0].skip=1;}});assert.throws(()=>settleBatchDispatch(f.file,bad));
 const restored=terminal(f,r,{conclusion:'success',mutate:x=>x.observation.evidence=[runtime]});settleBatchDispatch(f.file,restored);
 const s=inspectBatch(f.file,{now:f.context.now});assert.equal(s.pending.length,0);assert.deepEqual(s.blockedSources,[]);
 const proof=JSON.parse(readFileSync(restored.terminal.path));writeFileSync(proof.metadata.path,'{}');assert.throws(()=>inspectBatch(f.file,{now:f.context.now}),e=>e.reason==='REFERENCE_DRIFT');
}));
test('V4 rejects valid nested runtime evidence from another service profile without releasing pending intent',()=>v4Fixture(f=>{
 initializeBatch(f.file);const r=reserveHeavyProfile(f.file,{...f.context,profile:'PIN_IDENTITY_SERVER'}),wrong=passingService(f.context.sourceSHA,'123','PIN_ONBOARD');
 const proof=terminal(f,r,{conclusion:'success',mutate:x=>x.observation.evidence=[wrong]});
 assert.throws(()=>settleBatchDispatch(f.file,proof),e=>e.reason==='V4_TERMINAL_PROFILE');assert.equal(inspectBatch(f.file,{now:f.context.now}).pending.length,1);assert.equal(inspectBatch(f.file,{now:f.context.now}).phaseCounts.heavy,1);
}));
test('V4 two concurrent process dispatchers cannot both reserve even before GitHub lists the run',()=>v4Fixture(async f=>{
 initializeBatch(f.file);const module=pathToFileURL(join(import.meta.dirname,'permission-batch-budget.mjs')).href;
 const launch=i=>new Promise((resolve,reject)=>{const script=`import{reserveHeavyProfile}from${JSON.stringify(module)};try{const r=reserveHeavyProfile(${JSON.stringify(f.file)},${JSON.stringify({...f.context,profile:i?'PIN_CANARY':'PIN_RACE',identity:'concurrent-'+i})});console.log(JSON.stringify({ok:true,reservationId:r.reservationId}));}catch(e){console.log(JSON.stringify({ok:false,reason:e.reason??e.code}));}`;
  const c=spawn(process.execPath,['--input-type=module','-e',script],{windowsHide:true});let out='',err='';c.stdout.on('data',x=>out+=x);c.stderr.on('data',x=>err+=x);c.on('error',reject);c.on('close',code=>{if(code!==0)reject(Error(err));else resolve(JSON.parse(out));});});
 const results=await Promise.all([launch(0),launch(1)]);assert.equal(results.filter(r=>r.ok).length,1);assert.equal(inspectBatch(f.file,{now:f.context.now}).pending.length,1);assert.equal(inspectBatch(f.file,{now:f.context.now}).phaseCounts.heavy,1);
}));
test('V4 successor takes total spent and failed sources forward, resets only newly granted phase counters, and forbids bridge replay',()=>v4Fixture(f=>{
 initializeBatch(f.file);const r=reserveHeavyProfile(f.file,{...f.context,profile:'PIN_IDENTITY_SERVER'});settleBatchDispatch(f.file,terminal(f,r));closeBatch(f.file);
 const next=f.file+'.successor',recordedAtUtc=new Date(f.context.now+1000).toISOString(),reference='Independent actual owner reply for a later phase';
 const receipt=put(f.dir,'owner-next.json',{reference,recordedAtUtc,authorizedDeadlineUtc:f.p.deadlineUtc,answer:'Approve a separate next phase without resetting history',phaseActionLimits:{candidatePublication:2,candidateCi:2,heavyProfiles:8,reviewRounds:null}});
 const p={...f.p,phaseId:'next-new-phase',ownerAuthorization:{reference,recordedAtUtc,receipt},predecessor:pinParent(f.file),legacyBridge:[]};writeFileSync(next,JSON.stringify(p));initializeBatch(next);
 const s=inspectBatch(next,{now:f.context.now+2000});assert.deepEqual(s.historicalCounts,{publication:4,ci:4,heavy:2,reviewRounds:6});assert.deepEqual(s.phaseCounts,{publication:0,ci:0,heavy:0,reviewRounds:0});assert.deepEqual(s.blockedSources,[f.context.sourceSHA]);
 assert.throws(()=>reserveHeavyProfile(next,{...f.context,now:f.context.now+2000,profile:'PIN_CANARY'}),e=>e.reason==='SOURCE_BLOCKED');
 reserveBatchAction(next,{kind:'reviewRounds',sourceSHA:sha,identity:'review-without-token-cap',now:f.context.now+2000});assert.equal(inspectBatch(next,{now:f.context.now+2000}).phaseCounts.reviewRounds,1);
 const fork=next+'.fork';writeFileSync(fork,JSON.stringify({...p,legacyBridge:f.p.legacyBridge}));assert.throws(()=>initializeBatch(fork),e=>e.reason==='V4_BRIDGE_REPLAY');
}));

function addPostGate(f,change=()=>{}){
 const grant={reference:'Separate actual owner reply for PR and main CI only',recordedAtUtc:new Date(f.context.now).toISOString(),authorizedDeadlineUtc:f.p.deadlineUtc,answer:'Approve only PR and main CI after full gate',additionalAutomaticCi:2};change(grant);
 f.p.postGateCi={grant:put(f.dir,'postgate-owner.json',grant),limits:{pull_request:1,main_push:1}};f.save();
}
function postPacket(f,purpose='pull_request',change=()=>{}){
 const prefix='packet-'+purpose,leaf=put(f.dir,prefix+'-leaf.json',{schemaVersion:'unit-fixture-not-runtime-evidence',status:'TEST_ONLY'}),workflowBlob=join(f.dir,prefix+'-workflow.yml'),blob='reviewed workflow unit fixture\n';writeFileSync(workflowBlob,blob);
 const obligationIDs=JSON.parse(readFileSync(new URL('../tests/permissions/full-oracle-contracts.json',import.meta.url),'utf8')).gaps.map(x=>x.field),candidateTreeSHA='b'.repeat(40),baseSHA='a'.repeat(40),gate={schemaVersion:'permission-fullgate-reviewed-v1',sourceSHA:f.context.sourceSHA,status:'PASS',stageCount:35,requiredIdentities:760,requiredSkip:0,retry:0,obligations:Array.from({length:12},(_,i)=>({id:obligationIDs[i],status:'PASS',evidence:leaf})),inventory:leaf,receipts:[leaf],workflowSHA256:hashFile(workflowBlob)};
 const map={targetBranch:'main',baseSHA,candidateCommit:put(f.dir,prefix+'-candidate.json',{sha:f.context.sourceSHA,tree:{sha:candidateTreeSHA}}),baseCommit:put(f.dir,prefix+'-base.json',{sha:baseSHA,tree:{sha:'c'.repeat(40)}})};
 if(purpose==='main_push'){map.prNumber=7;map.prSettlement=inspectBatch(f.file,{now:f.context.now}).ciSettlements.pull_request;}
 const packet={schemaVersion:'permission-postgate-ci-packet-v1',repository:f.context.repository,sourceSHA:f.context.sourceSHA,candidateTreeSHA,purpose,authors:['author-a','author-b'],acceptance:'D19/R0/R1',fullGate:null,mapping:map};
 const reviewers={candidateSHA256:null,reviewers:[{name:'reviewer-source',scope:'source',verdict:'APPROVE'},{name:'reviewer-operations',scope:'operations',verdict:'APPROVE'}]};change({packet,gate,reviews:reviewers});
 packet.fullGate=put(f.dir,prefix+'-fullgate.json',gate);const packetRef=put(f.dir,prefix+'.json',packet);reviewers.candidateSHA256=packetRef.sha256;
 return{packet:packetRef,reviews:put(f.dir,prefix+'-reviews.json',reviewers),workflowBlob:{path:workflowBlob,sha256:hashFile(workflowBlob)},candidateTreeSHA,baseSHA};
}
function postTerminal(f,reservation,packet,{purpose='pull_request',conclusion='success',change=()=>{}}={}){
 const prefix='post-terminal-'+purpose,testedSourceSHA=(purpose==='pull_request'?'7':'8').repeat(40),workflowSHA='9'.repeat(40),runId=purpose==='pull_request'?'301':'302',event=purpose==='pull_request'?'pull_request':'push';
 const metadata={id:Number(runId),head_sha:purpose==='pull_request'?f.context.sourceSHA:testedSourceSHA,run_attempt:1,status:'completed',conclusion,path:'.github/workflows/ci.yml',event,head_branch:purpose==='pull_request'?f.context.branch:'main',repository:{full_name:f.context.repository,id:1263057386},head_repository:{full_name:f.context.repository,id:1263057386},pull_requests:purpose==='pull_request'?[{number:7,head:{sha:f.context.sourceSHA},base:{sha:packet.baseSHA}}]:[]};
 const observation={schemaVersion:'pos-cafe-light-ci-v1',repository:f.context.repository,repositoryID:1263057386,event,sourceSHA:testedSourceSHA,workflowSHA,prHeadSHA:purpose==='pull_request'?f.context.sourceSHA:null,runId,attempt:1,sourcePreserved:true,overallStatus:conclusion==='success'?'PASS':'FAIL',phases:PROJECT_PHASES.map(id=>({id,status:'PASS',exitCode:0}))};
 const reclaim={schemaVersion:'permission-pg16-reclaim-v1',status:'NOT_PRESENT',rootRemoved:true,processReleased:true,sourceSHA:testedSourceSHA,runId};
 const commit={sha:testedSourceSHA,tree:{sha:packet.candidateTreeSHA},parents:[{sha:packet.baseSHA},{sha:f.context.sourceSHA}]};
 const pr={number:7,head:{sha:f.context.sourceSHA,ref:f.context.branch,repo:{full_name:f.context.repository}},base:{sha:packet.baseSHA,ref:'main',repo:{full_name:f.context.repository}},merged:purpose==='main_push',merge_commit_sha:purpose==='main_push'?testedSourceSHA:null};
 const main={ref:'refs/heads/main',object:{sha:testedSourceSHA}},wf={sha:workflowSHA,tree:{sha:'6'.repeat(40)}},blob=readFileSync(packet.workflowBlob.path),gitBlob=createHash('sha1').update('blob '+blob.length+'\0').update(blob).digest('hex'),tree={sha:wf.tree.sha,truncated:false,tree:[{path:'.github/workflows/ci.yml',type:'blob',sha:gitBlob}]};
 change({metadata,observation,reclaim,commit,pr,main,workflowCommit:wf,workflowTree:tree});
 const proof={schemaVersion:'permission-batch-terminal-v1',reservationId:reservation.reservationId,kind:'ci',sourceSHA:f.context.sourceSHA,profile:null,purpose,testedSourceSHA,runId,attempt:1,conclusion,metadataHeadRole:'candidate',metadata:put(f.dir,prefix+'-metadata.json',metadata),observation:put(f.dir,prefix+'-ci.json',observation),reclaim:put(f.dir,prefix+'-reclaim.json',reclaim),testedCommit:put(f.dir,prefix+'-commit.json',commit),pullRequest:put(f.dir,prefix+'-pr.json',pr),workflowCommit:put(f.dir,prefix+'-workflowcommit.json',wf),workflowTree:put(f.dir,prefix+'-workflowtree.json',tree),workflowBlob:packet.workflowBlob};
 if(purpose==='main_push')proof.mainRef=put(f.dir,prefix+'-main.json',main);
 return{reservationId:reservation.reservationId,sourceSHA:f.context.sourceSHA,profile:null,runId,attempt:1,conclusion,terminal:put(f.dir,prefix+'.json',proof),now:f.context.now};
}
test('postgate CI requires optional separately pinned owner grant and unchanged deadline/limits',async()=>{
 await v4Fixture(f=>{initializeBatch(f.file);assert.throws(()=>reservePostGateCi(f.file,{...f.context,purpose:'pull_request',...postPacket(f)}),e=>e.reason==='POST_GATE_GRANT_REQUIRED');});
 for(const change of[g=>g.additionalAutomaticCi=3,g=>g.authorizedDeadlineUtc=new Date(Date.now()+9*3600000).toISOString(),g=>g.answer=''])await v4Fixture(f=>{addPostGate(f,change);assert.throws(()=>initializeBatch(f.file),/REFUSED/);});
});
test('postgate incomplete gate, changed refs and author/self reviews cannot consume CI-only slot',async()=>{
 for(const change of[x=>x.gate.stageCount=34,x=>x.gate.requiredIdentities=759,x=>x.gate.obligations.pop(),x=>x.gate.obligations[0].id='renamed-required-obligation',x=>x.gate.obligations[0].status='SOURCE_MAPPED',x=>x.gate.requiredSkip=1,x=>x.reviews.reviewers[0].name='author-a',x=>x.reviews.reviewers.pop()])await v4Fixture(f=>{
  addPostGate(f);initializeBatch(f.file);const packet=postPacket(f,'pull_request',change);assert.throws(()=>reservePostGateCi(f.file,{...f.context,purpose:'pull_request',...packet}),/REFUSED/);assert.equal(inspectBatch(f.file,{now:f.context.now}).postGateCiCounts.total,0);
 });
});
test('postgate PR candidate differs from tested merge; main differs again; exact tree mapping and CI-only totals remain distinct',()=>v4Fixture(f=>{
 addPostGate(f);initializeBatch(f.file);
 for(let i=0;i<2;i++){const sourceSHA=(i?'f':'e').repeat(40),r=reservePublicationPair(f.file,{...f.context,sourceSHA,identity:'candidate-'+i});settleBatchDispatch(f.file,terminal(f,r,{kind:'publication',conclusion:'success',sourceSHA,runId:String(120+i)}));}
 f.context.sourceSHA='f'.repeat(40);
 const pr=postPacket(f),r=reservePostGateCi(f.file,{...f.context,purpose:'pull_request',...pr});assert.throws(()=>reserveHeavyProfile(f.file,{...f.context,profile:'PIN_CANARY'}),e=>e.reason==='PENDING');settleBatchDispatch(f.file,postTerminal(f,r,pr));
 assert.throws(()=>reservePostGateCi(f.file,{...f.context,purpose:'pull_request',identity:'another-pr',...pr}),e=>e.reason==='ALLOWANCE_EXHAUSTED');
 const main=postPacket(f,'main_push'),r2=reservePostGateCi(f.file,{...f.context,purpose:'main_push',identity:'merge-main-ci',...main});settleBatchDispatch(f.file,postTerminal(f,r2,main,{purpose:'main_push'}));
 const s=inspectBatch(f.file,{now:f.context.now});assert.equal(s.phaseCounts.ci,2);assert.deepEqual(s.postGateCiCounts,{pull_request:1,main_push:1,total:2});assert.equal(s.counts.ci,8);assert.equal(s.counts.publication,6);assert.equal(s.pending.length,0);
 closeBatch(f.file);const next=f.file+'.post-next',reference='Owner next core grant without replaying extra CI grant',recordedAtUtc=new Date(f.context.now+1000).toISOString(),receipt=put(f.dir,'post-next-owner.json',{reference,recordedAtUtc,authorizedDeadlineUtc:f.p.deadlineUtc,answer:'Separate next phase',phaseActionLimits:{candidatePublication:2,candidateCi:2,heavyProfiles:8,reviewRounds:null}}),p={...f.p,phaseId:'post-next-phase',ownerAuthorization:{reference,recordedAtUtc,receipt},predecessor:pinParent(f.file),legacyBridge:[]};delete p.postGateCi;writeFileSync(next,JSON.stringify(p));initializeBatch(next);assert.equal(inspectBatch(next,{now:f.context.now+2000}).historicalCounts.ci,8);
}));
test('postgate main before verified successful PR CI is refused before claim',()=>v4Fixture(f=>{
 addPostGate(f);initializeBatch(f.file);const main=postPacket(f,'main_push');assert.throws(()=>reservePostGateCi(f.file,{...f.context,purpose:'main_push',...main}),e=>e.reason==='POST_GATE_PR_REQUIRED');assert.equal(inspectBatch(f.file,{now:f.context.now}).postGateCiCounts.total,0);
}));
test('postgate PR hostile parent/head/tree/event/attempt/workflow/cleanup mappings remain pending and spent',async()=>{
 for(const change of[x=>x.commit.parents.reverse(),x=>x.pr.head.sha='1'.repeat(40),x=>x.commit.tree.sha='2'.repeat(40),x=>x.metadata.event='push',x=>x.metadata.run_attempt=2,x=>x.metadata.head_branch='other-branch',x=>delete x.metadata.head_branch,x=>x.metadata.repository={full_name:'other/repo',id:1},x=>delete x.metadata.repository,x=>x.metadata.pull_requests=[{number:999,head:{sha:'1'.repeat(40)},base:{sha:'2'.repeat(40)}}],x=>delete x.metadata.pull_requests,x=>x.workflowTree.tree[0].sha='3'.repeat(40),x=>x.reclaim.sourceSHA='4'.repeat(40),x=>x.observation.phases.pop()])await v4Fixture(f=>{
  addPostGate(f);initializeBatch(f.file);const packet=postPacket(f),r=reservePostGateCi(f.file,{...f.context,purpose:'pull_request',...packet});assert.throws(()=>settleBatchDispatch(f.file,postTerminal(f,r,packet,{change})));const s=inspectBatch(f.file,{now:f.context.now});assert.equal(s.pending.length,1);assert.equal(s.postGateCiCounts.total,1);
 });
});
test('postgate CI-only retains strict42-minute cutoff and does not borrow heavy/publication allowance',()=>v4Fixture(f=>{
 addPostGate(f);initializeBatch(f.file);const packet=postPacket(f);assert.throws(()=>reservePostGateCi(f.file,{...f.context,purpose:'pull_request',...packet,now:Date.parse(f.p.deadlineUtc)-42*60000}),e=>e.reason==='DEADLINE');const s=inspectBatch(f.file,{now:f.context.now});assert.equal(s.postGateCiCounts.total,0);assert.equal(s.phaseCounts.ci,0);assert.equal(s.phaseCounts.heavy,0);assert.equal(s.phaseCounts.publication,0);
}));

test('postgate known CI failure stays spent, blocks candidate and cannot be retried under another purpose',()=>v4Fixture(f=>{
 addPostGate(f);initializeBatch(f.file);const packet=postPacket(f),r=reservePostGateCi(f.file,{...f.context,purpose:'pull_request',...packet});
 settleBatchDispatch(f.file,postTerminal(f,r,packet,{conclusion:'failure'}));const s=inspectBatch(f.file,{now:f.context.now});assert.equal(s.pending.length,0);assert.equal(s.postGateCiCounts.total,1);assert.deepEqual(s.blockedSources,[f.context.sourceSHA]);
 assert.throws(()=>reservePostGateCi(f.file,{...f.context,purpose:'pull_request',identity:'retry-pr',...packet}),e=>e.reason==='SOURCE_BLOCKED');
 assert.throws(()=>reservePostGateCi(f.file,{...f.context,purpose:'main_push',identity:'borrow-main',...postPacket(f,'main_push')}),e=>e.reason==='SOURCE_BLOCKED');
}));
test('postgate main wrong merged SHA, tree, PR identity and source cleanup never settle',async()=>{
 for(const change of[x=>x.pr.merge_commit_sha='1'.repeat(40),x=>x.pr.base.sha='1'.repeat(40),x=>x.commit.parents.reverse(),x=>x.commit.parents[0].sha='1'.repeat(40),x=>x.metadata.head_branch='other-branch',x=>x.commit.tree.sha='2'.repeat(40),x=>x.pr.number=99,x=>x.main.object.sha='3'.repeat(40),x=>x.reclaim.sourceSHA='4'.repeat(40)])await v4Fixture(f=>{
  addPostGate(f);initializeBatch(f.file);const pr=postPacket(f),r=reservePostGateCi(f.file,{...f.context,purpose:'pull_request',...pr});settleBatchDispatch(f.file,postTerminal(f,r,pr));
  const main=postPacket(f,'main_push'),r2=reservePostGateCi(f.file,{...f.context,purpose:'main_push',identity:'main-ci',...main});assert.throws(()=>settleBatchDispatch(f.file,postTerminal(f,r2,main,{purpose:'main_push',change})));assert.equal(inspectBatch(f.file,{now:f.context.now}).pending.length,1);
 });
});
