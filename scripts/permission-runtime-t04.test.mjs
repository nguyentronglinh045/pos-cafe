import test from'node:test';
import assert from'node:assert/strict';
import{runT04Profile,renderT04Evidence,t04FailureFacts,t04TimeBudget,t04RunnerFailureFacts}from'./permission-runtime-t04.mjs';
import{runtimeStageCatalog}from'./permission-runtime-catalog.mjs';
import{backendInvocation}from'./project-backend-t04.mjs';
import{reclaimUnitState}from'./permission-runtime-t04-reclaim.mjs';
import{assertLegacyDependencyBoundary}from'./permission-legacy-head.mjs';
import{t04Lifecycle,t04StageEnvironment,assertT04ResourceFacts,assertT04ContainerContinuity}from'./permission-runtime-t04-fixture.mjs';
import{CI1_LIMITS,CI1_PROJECT,ci1Identity}from'./permission-ci1-policy.mjs';
import{ci1FailureExport,ci1IsolatedFailure,t04CommandOptions}from'./permission-runtime-t04-worker.mjs';
const catalog=runtimeStageCatalog().filter(s=>s.runtimeProfile==='SUPABASE_T04'),ids=catalog.map(s=>s.stage);
const sha='a'.repeat(40),digest='b'.repeat(64);
const row=id=>{const n=catalog.find(s=>s.stage===id).required.length;return{stage:id,status:'PASS',required:n,run:n,discovered:n,
 pass:n,fail:0,skip:0,retry:0,sourceSHA:sha,reportSHA:digest,invocationSHA:digest,supplementalOracles:'NOT_PROVEN_BY_STAGE_COUNTS'};};
function fixture(change={}){const seen=[],closed=[],prepared=[],reset=[];return{seen,closed,prepared,reset,adapter:{guard(){},async bootstrap(){},async physical(){return digest;},
 async baseline(){return digest;},async preserved(){return true;},async checkpoint(){return{archiveSHA:digest,storageSHA:digest};},
 async prepare(id){prepared.push(id);},async afterStage(){return digest;},async restore(stage,beforeResetSHA){reset.push(stage);
   return{stage,status:'RESTORED_ORIGINAL',beforeResetSHA,archiveSHA:digest,baselineSHA:digest,physicalSHA:digest};},async stage(id){seen.push(id);return row(id);},
 async close(){closed.push(true);return true;},...change}};}
const metadata={repository:'nguyentronglinh045/pos-cafe',runId:'123',attempt:1,sourceSHA:sha,workflowSHA:sha,sourceFingerprint:digest,lockSHA:digest};
test('T04 time budget uses immutable launch time and retains three-minute cleanup within unchanged thirty-minute unit',()=>{
 const start=1790000000000;
 assert.deepEqual(t04TimeBudget(start,start+5*60000),{deadline:start+19*60000,harnessTimeoutMs:15*60000});
 assert.deepEqual(t04TimeBudget(start,start+14*60000),{deadline:start+26.5*60000,harnessTimeoutMs:13*60000});
 for(const elapsed of[0,5,12,14,20,25]){
  const now=start+elapsed*60000,b=t04TimeBudget(start,now);
  assert(b.deadline-now<=14*60000);assert(b.harnessTimeoutMs<=15*60000);
  assert(now+b.harnessTimeoutMs<=start+27*60000);assert(b.deadline+30000<=start+27*60000);
 }
 for(const [s,n]of[[start,start-1],[start,start+26*60000],[undefined,start],[start+0.1,start]])assert.throws(()=>t04TimeBudget(s,n));
});
test('outer command deadline is recomputed after slow supervisor guard and hard-kills only the timed child',()=>{
 const end=1790000000000,options={cwd:'/source',timeout:900000,absoluteDeadlineEpochMs:end};
 assert.deepEqual(t04CommandOptions(options,end-120000),{cwd:'/source',timeout:119000,killSignal:'SIGKILL'});
 assert.deepEqual(t04CommandOptions({cwd:'/source',timeout:5000},end),{cwd:'/source',timeout:5000});
 assert.equal(t04CommandOptions(options,end-60000).timeout,59000);
 for(const now of[end-1000,end,end+1])assert.throws(()=>t04CommandOptions(options,now));
});
test('final isolated/public failure projection enforces boundary ordinal/exit bounds independently of upstream parser',()=>{
 const f={stage:'offline-edge',operation:'PILOT_HARNESS',code:'COMMAND_FAILED',command:'node',exitCode:1,
  facts:{t04BoundaryOrdinal:15,t04BoundaryExit:1}};
 const receipt=failure=>({schemaVersion:'permission-ci1-isolated-failure-v1',runId:'123',attempt:1,sourceSHA:sha,failure,cleanupFailure:null});
 assert.deepEqual(ci1FailureExport(f),f);assert(ci1IsolatedFailure(receipt(f),ci1Identity('123',1),sha));
 for(const delta of[{t04BoundaryOrdinal:20},{t04BoundaryOrdinal:0},{t04BoundaryExit:256}]){
  const invalid={...f,facts:{...f.facts,...delta}},projected=ci1FailureExport(invalid);
  assert.notDeepEqual(projected,invalid);assert.throws(()=>ci1IsolatedFailure(receipt(invalid),ci1Identity('123',1),sha));
 }
});
test('T04 assertion diagnostic parser and final exporter independently reject out-of-range ordinals and private raw fields',()=>{
 const facts={t04StageOrdinal:4,t04FirstFailedRequired:4,t04FailedTests:9,t04FirstFailedLine:184,
  t04TestErrorCodeOrdinal:0,t04TestErrorNameOrdinal:4,t04TestErrorMatcherOrdinal:2};
 const failure={stage:'offline-edge',operation:'PILOT_HARNESS',code:'COMMAND_FAILED',command:'node',exitCode:1,facts};
 assert.deepEqual(t04FailureFacts('T04_FAILURE_FACTS '+JSON.stringify(facts)),facts);assert.deepEqual(ci1FailureExport(failure),failure);
 const receipt=f=>({schemaVersion:'permission-ci1-isolated-failure-v1',runId:'123',attempt:1,sourceSHA:sha,failure:f,cleanupFailure:null});
 assert(ci1IsolatedFailure(receipt(failure),ci1Identity('123',1),sha));
 for(const delta of[{t04FirstFailedLine:100001},{t04FirstFailedLine:-1},{t04TestErrorCodeOrdinal:999},
  {t04TestErrorNameOrdinal:6},{t04TestErrorMatcherOrdinal:9},{t04FailedTests:10001},{t04StageOrdinal:20},{raw:'SECRET'}]){
  const invalid={...failure,facts:{...facts,...delta}};assert.deepEqual(t04FailureFacts('T04_FAILURE_FACTS '+JSON.stringify(invalid.facts)),{});
  assert.notDeepEqual(ci1FailureExport(invalid),invalid);assert.throws(()=>ci1IsolatedFailure(receipt(invalid),ci1Identity('123',1),sha));
 }
});

test('T04 actual failed-test selector cannot confuse earlier skipped or pending required tests with a later assertion failure',()=>{
 const required=[{file:'x.test.ts',name:'first'},{file:'x.test.ts',name:'second'}];
 for(const state of['skipped','pending']){
  const facts=t04RunnerFailureFacts({required},{discovery:required,errorCount:0,hookErrorCount:0,results:[{...required[0],state},
   {...required[1],state:'failed',failureLine:184,failureFacts:{errorCodeOrdinal:0,errorNameOrdinal:4,errorMatcherOrdinal:2}}]});
  assert.equal(facts.t04FirstFailedRequired,2);assert.equal(facts.t04FailedTests,1);assert.equal(facts.t04FirstFailedLine,184);
  assert.equal(facts.t04TestErrorMatcherOrdinal,2);assert.equal(facts.t04MissingRequired,0);
 }
 const facts=t04RunnerFailureFacts({required},{discovery:[],results:[],errorCount:0,hookErrorCount:0});
 assert.equal(facts.t04MissingRequired,2);assert.equal(facts.t04FirstFailedRequired,0);assert(!('t04FirstFailedLine'in facts));
});

test('T04 orchestrator runs exactly nineteen canonical stages, preserves physical and logical backend and closes once',async()=>{
 const f=fixture(),r=await runT04Profile(f.adapter);assert.equal(r.status,'PASS');assert.deepEqual(f.seen,ids);assert.equal(f.closed.length,1);
 assert.equal(r.remainingBusinessStages,16);assert.equal(r.full35BusinessRuntime,'NOT_RUN');
 const rendered=renderT04Evidence({...r,...metadata});assert.equal(JSON.parse(rendered.json).stages.length,19);
 assert.deepEqual(f.prepared,ids);assert.deepEqual(f.reset,ids.filter(s=>t04Lifecycle(s).reset));assert.equal(f.reset.length,10);
});
test('canonical rollback variants cannot inherit caller choice; realtime output requires its own private path',()=>{
 for(const [stage,variant]of[['rollback-additive-database','Additive'],['rollback-preflight-database','Preflight'],['rollback-recovery-database','Recovery']])
  assert.equal(t04StageEnvironment(stage,{PERM_ROLLBACK_VARIANT:'bad'}).PERM_ROLLBACK_VARIANT,variant);
 assert.equal(t04StageEnvironment('candidate-e2e',{PERM_ROLLBACK_VARIANT:'Recovery'}).PERM_ROLLBACK_VARIANT,undefined);
 assert.throws(()=>t04StageEnvironment('realtime-e2e',{},'/tmp/public'));
 assert.equal(t04StageEnvironment('realtime-e2e',{},'/volume/private/t04-realtime').PERM_REALTIME_PRIVATE_ARTIFACT_DIR,'/volume/private/t04-realtime');
 assert.equal(t04Lifecycle('candidate-roles-e2e').pre,'activated');assert.equal(t04Lifecycle('realtime-e2e').pre,'activated');
 assert.equal(t04Lifecycle('transition-compatibility-database').pre,'bridge');
 assert.deepEqual(t04Lifecycle('candidate-seed-recovery-database'),{pre:'activated',post:'activated',reset:true});
 assert.equal(t04Lifecycle('rollback-recovery-database').post,'candidate-pass-through');
});
test('a failed protected-service observation prevents reset; a wrong restored checkpoint prevents further stages',async()=>{
 for(const change of[{async afterStage(){throw Error('storage drift');}},
  {async restore(stage,beforeResetSHA){return{stage,status:'RESTORED_ORIGINAL',beforeResetSHA,archiveSHA:digest,
    baselineSHA:'c'.repeat(64),physicalSHA:digest};}}]){
  const f=fixture(change),r=await runT04Profile(f.adapter);assert.equal(r.status,'FAIL');assert.equal(f.closed.length,1);
  if(change.afterStage){assert.equal(f.reset.length,0);assert.equal(f.seen.length,1);}
  else assert.deepEqual(f.seen,ids.slice(0,10));
 }
});
test('reset resource gate keeps actual quota/namespace/write/daemon facts without pretending services are running',()=>{
 const identity=ci1Identity('123',1),GiB=1024**3;
 const p={platform:'linux',arch:'x64',githubHosted:true,publicRepository:true,hostCPUs:4,hostMemoryBytes:16*GiB,
  repository:metadata.repository,manual:true,unit:identity.unit,cgroup:'/system.slice/'+identity.unit,delegatedSupervisor:true,
  cpuMax:'300000 100000',memoryMax:String(CI1_LIMITS.memoryBytes),swapMax:'0',pidsMax:String(CI1_LIMITS.pids),
  runtimeSeconds:1800,killMode:'control-group',stopGraceSeconds:30,standardOutput:'null',standardError:'null',
  filesystem:'ext4',loopBacked:true,imageBytes:18*GiB,imageAllocatedBytes:18*GiB,filesystemBytes:18*GiB,
  filesystemFreeBytes:2*GiB,hostFreeBytes:40*GiB,mutablePathsOnVolume:true,memoryCurrent:GiB,pidsCurrent:20,
  oomEvents:0,pidsLimitEvents:0,privateNamespaces:true,noDefaultRoute:true,ownedDaemon:true,
  containersInCgroup:false,containersCoreDisabled:false};
 assert.equal(assertT04ResourceFacts(p,identity),true);assert.equal(p.containersInCgroup,false);
 for(const delta of[{imageBytes:19*GiB},{memoryCurrent:CI1_LIMITS.memoryBytes},{hostFreeBytes:29*GiB},
  {swapMax:'1'},{mutablePathsOnVolume:false},{privateNamespaces:false},{noDefaultRoute:false},{ownedDaemon:false},{oomEvents:1}])
   assert.throws(()=>assertT04ResourceFacts({...p,...delta},identity));
});
test('stopped-service phase requires exact twelve identities/configs/mounts, running DB and stopped eleven others',()=>{
 const before=Array.from({length:12},(_,i)=>({Id:String(i),Name:i===0?'/supabase_db_'+CI1_PROJECT:'/service'+i,
  Config:{Labels:{'com.supabase.cli.project':CI1_PROJECT}},HostConfig:{},Mounts:[],State:{Running:true,Pid:i+1}}));
 const after=structuredClone(before);for(let i=1;i<12;i++)after[i].State={Running:false,Pid:0};
 const opts={stopped:true,cgroup:'/system.slice/test',device:1,readCgroup:()=> '0::/system.slice/test/db',
  readLimits:()=> 'Max core file size        0                    0                    bytes',pattern:'core\n'};
 assert.equal(assertT04ContainerContinuity(before,after,opts),true);
 for(const mutate of[a=>a[0].State.Running=false,a=>a[1].State.Running=true,a=>a[2].Id='replacement',
  a=>a[3].Config.Labels={},a=>a[4].HostConfig={different:true}]){
  const a=structuredClone(after);mutate(a);assert.throws(()=>assertT04ContainerContinuity(before,a,opts));
 }
});
test('T04 diagnostic transport accepts bounded numeric stage facts and refuses raw fields, duplicate rows and malformed data',()=>{
 const facts={t04StageOrdinal:2,t04HookErrors:1},line='T04_FAILURE_FACTS '+JSON.stringify(facts);
 assert.deepEqual(t04FailureFacts(line),facts);
 for(const s of[line+'\n'+line,'T04_FAILURE_FACTS {','T04_FAILURE_FACTS '+JSON.stringify({...facts,private:'raw'}),
  'T04_FAILURE_FACTS '+JSON.stringify({...facts,t04BoundaryOrdinal:20}),'T04_FAILURE_FACTS '+JSON.stringify({...facts,t04BoundaryExit:256}),
  'T04_FAILURE_FACTS '+JSON.stringify({...facts,t04StageOrdinal:20}),'T04_FAILURE_FACTS '+JSON.stringify({...facts,t04HookErrors:'secret'})])
  assert.deepEqual(t04FailureFacts(s),{});
 assert.deepEqual(t04FailureFacts('T04_FAILURE_FACTS '+JSON.stringify({...facts,t04BoundaryOrdinal:15,t04BoundaryExit:1})),
  {...facts,t04BoundaryOrdinal:15,t04BoundaryExit:1});
});
test('physical drift or logical preservation failure prevents next stage and retains NOT_RUN rows',async()=>{
 for(const kind of['physical','preserved']){
  let calls=0;const f=fixture(kind==='physical'?{async physical(){return++calls>2?'c'.repeat(64):digest;}}
   :{async preserved(){return++calls<2;}}),r=await runT04Profile(f.adapter);
  assert.equal(r.status,'FAIL');assert.deepEqual(f.seen,ids.slice(0,1));assert.equal(r.stages[0].status,'FAIL');
  assert(r.stages.slice(1).every(s=>s.status==='NOT_RUN'));assert.equal(f.closed.length,1);
  assert.equal(JSON.parse(renderT04Evidence({...r,...metadata}).json).status,'FAIL');
 }
});
test('bootstrap, quota, skipped or retried stage and cleanup failures cannot close T04',async()=>{
 for(const change of[{async bootstrap(){throw Error('bootstrap');}},{guard(){throw Error('quota');}},
  {async stage(id){return{...row(id),skip:1};}},{async stage(id){return{...row(id),retry:1};}},
  {async close(){return false;}}]){
  const f=fixture(change),r=await runT04Profile(f.adapter);assert.equal(r.status,'FAIL');
  assert.equal(JSON.parse(renderT04Evidence({...r,...metadata}).json).status,'FAIL');
 }
});
test('T04 public projection refuses raw fields, arbitrary failure text, missing stages and false full verdicts',async()=>{
 const f=fixture(),r={...await runT04Profile(f.adapter),...metadata};
 for(const delta of[{secret:'raw'},{failure:'raw SQL secret',status:'FAIL'},
  {physicalBackendSHA:'private data'},{stages:r.stages.slice(1)},{workflowSHA:'c'.repeat(40)},
  {full35BusinessRuntime:'PASS'},{cleanup:false}])assert.throws(()=>renderT04Evidence({...r,...delta}));
 assert.throws(()=>renderT04Evidence({...r,resets:r.resets.slice(0,8)}));
 const stages=structuredClone(r.stages);stages[0].raw='private data';assert.throws(()=>renderT04Evidence({...r,stages}));
});
test('manual T04 invocation requires exact expected source and selects its own worker; collected reclaim stays strict',()=>{
 const e={GITHUB_REPOSITORY:metadata.repository,GITHUB_REPOSITORY_ID:'1263057386',GITHUB_EVENT_NAME:'workflow_dispatch',
  CI1_CONFIRMATION:'RUN_T04_PROFILE',CI1_EXPECTED_SOURCE_SHA:sha,GITHUB_SHA:sha,GITHUB_WORKFLOW_SHA:sha,GITHUB_RUN_ID:'123',GITHUB_RUN_ATTEMPT:'1'};
 assert(backendInvocation(e,'/node','/source').argv.some(s=>s.replaceAll('\\','/').endsWith('/permission-runtime-t04-worker.mjs')));
 assert.throws(()=>backendInvocation({...e,CI1_EXPECTED_SOURCE_SHA:'c'.repeat(40)},'/node','/source'));
 assert.throws(()=>reclaimUnitState({status:1,stdout:'LoadState=not-found=garbage\nActiveState=inactive\n'},null));
 assert.throws(()=>assertLegacyDependencyBoundary('/unowned',{artifacts:'/unowned/artifacts',target:'/unowned/target',source:'/unowned/target/source'}));
});
