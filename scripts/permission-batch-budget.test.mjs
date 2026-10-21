import test from'node:test';import assert from'node:assert/strict';
import{mkdtempSync,writeFileSync,readFileSync,rmSync,unlinkSync}from'node:fs';import{join}from'node:path';import{createHash}from'node:crypto';import{tmpdir}from'node:os';
import{initializeBatch,recordBatchUsage,reserveBatchAction,inspectBatch,measureBatchUsage,closeBatch}from'./permission-batch-budget.mjs';
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
