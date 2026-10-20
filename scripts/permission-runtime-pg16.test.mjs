import test from'node:test';
import assert from'node:assert/strict';
import{pg16Layout,runPg16Profile,pg16ProfileCounts,renderPg16Evidence}from'./permission-runtime-pg16.mjs';
import{runtimeStage}from'./permission-runtime-catalog.mjs';
import{pg16ControlMatches}from'./permission-runtime-pg16-cleanup.mjs';
const digest='a'.repeat(64),sha='b'.repeat(40),required=runtimeStage('legacy-t01-database').required.length;
const row={stage:'legacy-t01-database',status:'PASS',required,run:required,discovered:required,pass:required,fail:0,skip:0,retry:0,
 sourceSHA:sha,reportSHA:digest,invocationSHA:digest,supplementalOracles:'NOT_PROVEN_BY_STAGE_COUNTS'};
const binding={sourceSHA:sha,sourceFingerprint:digest,lockSHA:digest,runId:'123'};
function fixture(changes={}){const events=[];return{events,adapter:{guard(){events.push('guard');},async bootstrap(){events.push('bootstrap');},
 async physical(){events.push('physical');return digest;},async stage(){events.push('stage');return row;},
 async close(){events.push('close');return{rootRemoved:true,processReleased:true,allocatedBeforeBytes:64*1024**2,measuredFreeDeltaBytes:64*1024**2};},...changes}};}
test('native PG16 layout is exact per run/attempt and refuses command/path text',()=>{
 assert.equal(pg16Layout('123',2).root,'/var/tmp/pos-cafe-perm-t01-r123-a2');
 for(const id of['../x','123\n--x','0','01'])assert.throws(()=>pg16Layout(id,1));
 for(const attempt of[0,1001,1.5])assert.throws(()=>pg16Layout('123',attempt));
});
test('native orchestrator closes once and projects only complete full-file result on stable actual backend',async()=>{
 const f=fixture(),r=await runPg16Profile(f.adapter);assert.equal(r.status,'PASS');assert.equal(f.events.filter(x=>x==='close').length,1);
 assert.equal(r.full35BusinessRuntime,'NOT_RUN');assert.equal(r.remainingBusinessStages,34);
 assert.deepEqual(pg16ProfileCounts({...r,...binding,serverVersionNum:160015},binding),{run:required,pass:required,fail:0,skip:0});
});
test('bootstrap/stage/physical/cleanup failures never return native PASS and always attempt cleanup',async()=>{
 let n=0;for(const change of[{async bootstrap(){throw Error('setup');}},{async stage(){return{...row,skip:1};}},
  {async stage(){return{...row,retry:1};}},{async physical(){return++n===1?digest:'c'.repeat(64);}},{async close(){return{rootRemoved:false,processReleased:true};}}]){
  const f=fixture(change),r=await runPg16Profile(f.adapter);assert.equal(r.status,'FAIL');
  if(!change.close)assert.equal(f.events.filter(x=>x==='close').length,1);
 }
});
test('native count validator rejects wrong engine, source, missing cases and retained runtime',async()=>{
 const f=fixture(),r={...await runPg16Profile(f.adapter),...binding,serverVersionNum:160015};
 for(const delta of[{serverVersionNum:170006},{sourceSHA:'c'.repeat(40)},{cleanup:{rootRemoved:false,processReleased:true}},
  {stage:{...row,required:required-1}},{stage:{...row,run:required-1}},{stage:{...row,discovered:required+1}},{full35BusinessRuntime:'PASS'}])
   assert.throws(()=>pg16ProfileCounts({...r,...delta},binding));
});
test('cleanup control rejects another run, source, worker, owner, inode and unknown fields',()=>{
 const c={schemaVersion:'permission-pg16-control-v1',runId:'123',attempt:1,unit:'pos-cafe-light-r123-a1.service',
  sourceSHA:sha,nativeSHA:digest,cleanupSHA:digest,uid:1001,device:2,inode:345};
 assert.equal(pg16ControlMatches(c,c),true);
 for(const delta of[{runId:'124'},{attempt:2},{unit:'other.service'},{sourceSHA:'c'.repeat(40)},
  {nativeSHA:'c'.repeat(64)},{cleanupSHA:'c'.repeat(64)},{uid:0},{device:3},{inode:346},{raw:'private'}])
  assert.throws(()=>pg16ControlMatches({...c,...delta},c));
});
test('safe native proof refuses raw fields and malformed cleanup numbers',async()=>{
 const f=fixture(),r={...await runPg16Profile(f.adapter),...binding,serverVersionNum:160015};
 assert.equal(JSON.parse(renderPg16Evidence(r,binding).json).status,'PASS');
 for(const delta of[{secret:'private'},{stage:{...row,raw:'private'}},{cleanup:{...r.cleanup,raw:'private'}},
  {cleanup:{...r.cleanup,allocatedBeforeBytes:-1}},{cleanup:{...r.cleanup,measuredFreeDeltaBytes:6*1024**3}}])
  assert.throws(()=>renderPg16Evidence({...r,...delta},binding));
});
