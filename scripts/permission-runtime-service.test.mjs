import test from'node:test';import assert from'node:assert/strict';
import{SERVICE_PROFILES,serviceProfile}from'./permission-runtime-service-profile.mjs';
import{runServiceProfile,renderServiceEvidence,serviceFailureFacts,servicePreparedEnvironment}from'./permission-runtime-service.mjs';
import{runtimeStage}from'./permission-runtime-catalog.mjs';
import{ci1FailureExport,ci1IsolatedFailure}from'./permission-runtime-service-worker.mjs';
import{assertReclaimFacts}from'./permission-runtime-service-reclaim.mjs';
import{peerContainerRecords}from'./permission-runtime-service-peer.mjs';
const h='a'.repeat(64),sha='b'.repeat(40),meta={repository:'nguyentronglinh045/pos-cafe',runId:'123',attempt:1,sourceSHA:sha,workflowSHA:sha,sourceFingerprint:h,lockSHA:h,stoppedPeerSHA:null};
test('canonical race/expiry children receive distinct required process ports as well as envfiles',()=>{
 const race=servicePreparedEnvironment('PIN_RACE','/private'),expiry=servicePreparedEnvironment('PIN_EXPIRY','/private');
 assert.equal(race.PIN_RACE_VITE_PORT,'5180');assert.equal(expiry.PIN_EXPIRY_VITE_PORT,'5181');
 assert.equal(race.PIN_RACE_ENV_FILE,'/private/pin-race.env');assert.equal(expiry.PIN_EXPIRY_ENV_FILE,'/private/pin-expiry.env');
 assert.equal(race.PIN_EXPIRY_VITE_PORT,undefined);assert.equal(expiry.PIN_RACE_VITE_PORT,undefined);
 for(const id of['PIN_IDENTITY_SERVER','PIN_CANARY','unknown'])assert.throws(()=>servicePreparedEnvironment(id,'/private'));
 assert.throws(()=>servicePreparedEnvironment('PIN_RACE','relative'));assert.throws(()=>servicePreparedEnvironment('PIN_EXPIRY','/private\nother'));
});
function row(stage){const required=runtimeStage(stage).required.length;return{stage,status:'PASS',required,discovered:required,run:required,pass:required,fail:0,skip:0,retry:0,reportSHA:h,sourceSHA:sha,invocationSHA:h,supplementalOracles:'NOT_PROVEN_BY_STAGE_COUNTS'};}
function adapter(changes={}){const events=[];return{events,guard(){events.push('guard');},async bootstrap(){events.push('bootstrap');},async physical(){return h;},
 async prepare(stage){events.push('prepare:'+stage);},async stage(stage){events.push('stage:'+stage);return row(stage);},diagnostic(){},async close(){events.push('close');return true;},...changes};}
test('all seven envelopes require exact ordered full-file stages and preserve physical identity',async()=>{
 for(const p of SERVICE_PROFILES){const a=adapter(),r={...await runServiceProfile(p,a),...meta,stoppedPeerSHA:p==='PIN_EXPIRY'?h:null};
  assert.equal(r.status,'PASS');assert.deepEqual(r.stages.map(s=>s.stage),serviceProfile(p).stages);
  assert.equal(a.events.filter(e=>e==='close').length,1);assert.equal(JSON.parse(renderServiceEvidence(r).json).status,'PASS');
 }
});
test('peer identity records bind twelve actual container identities and hash private config only',()=>{
 const project='pos-cafe-perm-g2b-20261009',names=['db','auth','rest','kong','storage','realtime','edge_runtime','studio','pg_meta','inbucket','vector','analytics'];
 const containers=names.map((n,i)=>({Name:'/supabase_'+n+'_'+project,Id:(i+1).toString(16).padStart(64,'0'),Image:'sha256:'+h,
  Config:{Labels:{'com.supabase.cli.project':project},Image:'pinned-image',Env:['SECRET=private']},HostConfig:{},Mounts:[]}));
 const r=peerContainerRecords(containers,project);assert.equal(r.length,12);assert.equal(JSON.stringify(r).includes('private'),false);
 for(const edit of[a=>a.pop(),a=>a[0].Name='/other',a=>a[0].Config.Labels['com.supabase.cli.project']='other',a=>a[1].Id=a[0].Id]){
  const a=structuredClone(containers);edit(a);assert.throws(()=>peerContainerRecords(a,project));
 }
});
test('service failures stop later stages, never relabel missing/skipped/retried cases, and always close',async()=>{
 for(const change of[{async bootstrap(){throw Error();}},{async stage(s){return{...row(s),skip:1};}},
  {async stage(s){return{...row(s),retry:1};}},{async stage(s){return{...row(s),required:0};}},{async close(){return false;}}]){
  const a=adapter(change),r={...await runServiceProfile('PIN_ONBOARD',a),...meta};assert.equal(r.status,'FAIL');
  assert.equal(JSON.parse(renderServiceEvidence(r).json).status,'FAIL');
  if(r.failure!=='bootstrap'&&r.failure!=='cleanup')assert.ok(r.stages.slice(1).every(s=>s.status==='NOT_RUN'));
 }
 let n=0;const r=await runServiceProfile('SUPABASE_T02',adapter({async physical(){return++n===1?h:'c'.repeat(64);}}));assert.equal(r.status,'FAIL');
});
test('safe service proof refuses profile confusion, source drift and arbitrary secret fields',async()=>{
 const r={...await runServiceProfile('SUPABASE_T02',adapter()),...meta};
 for(const change of[{executionProfile:'PIN_IDENTITY_SERVER'},{logicalProfile:'PIN_ONBOARD'},{sourceSHA:'c'.repeat(40)},
  {raw:'private'},{stages:[{...r.stages[0],raw:'private'},...r.stages.slice(1)]},{full35BusinessRuntime:'PASS'}])
  assert.throws(()=>renderServiceEvidence({...r,...change}));
});
test('finite service diagnostics are independently bounded at parsing and final public projection',()=>{
 assert.deepEqual(serviceFailureFacts('SERVICE_FAILURE_FACTS {"serviceStageOrdinal":2,"serviceSetupOrdinal":3}'),{serviceStageOrdinal:2,serviceSetupOrdinal:3});
 assert.deepEqual(serviceFailureFacts('SERVICE_FAILURE_FACTS {"raw":"private"}'),{});
 const f={stage:'offline-edge',operation:'PILOT_HARNESS',code:'COMMAND_FAILED',command:'node',exitCode:1,facts:{serviceStageOrdinal:99,serviceSetupOrdinal:99,raw:'private'}};
 assert.equal(ci1FailureExport(f).facts,undefined);
 assert.throws(()=>ci1IsolatedFailure({schemaVersion:'permission-ci1-isolated-failure-v1',runId:'123',attempt:1,sourceSHA:sha,failure:f,cleanupFailure:null},{runId:'123',attempt:1},sha));
});
test('service reclaim binds selected profile in addition to source/worker/run/owner/process/mount facts',()=>{
 const expected={profile:'SUPABASE_T02',runId:'123',attempt:1,sourceSHA:sha,unit:'pos-cafe-ci1-r123-a1.service',workerSHA:h};
 const f={rootOwned:true,controlOwned:true,imageOwned:true,imageLinks:1,imageBytes:18*1024**3,unitActiveState:'inactive',unitPopulated:null,attachedLoops:0,ownedMounts:0};
 assert.equal(assertReclaimFacts(f,expected,expected),true);
 for(const change of[{profile:'PIN_CANARY'},{sourceSHA:'c'.repeat(40)},{workerSHA:'c'.repeat(64)}])assert.throws(()=>assertReclaimFacts(f,{...expected,...change},expected));
 for(const change of[{attachedLoops:1},{ownedMounts:1},{unitPopulated:1},{imageLinks:2}])assert.throws(()=>assertReclaimFacts({...f,...change},expected,expected));
});
