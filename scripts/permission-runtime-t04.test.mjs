import test from'node:test';
import assert from'node:assert/strict';
import{runT04Profile,renderT04Evidence,t04FailureFacts,t04TimeBudget,t04RunnerFailureFacts}from'./permission-runtime-t04.mjs';
import{runtimeStageCatalog}from'./permission-runtime-catalog.mjs';
import{backendInvocation}from'./project-backend-t04.mjs';
import{reclaimUnitState}from'./permission-runtime-t04-reclaim.mjs';
import{assertLegacyDependencyBoundary}from'./permission-legacy-head.mjs';
import{t04Lifecycle,t04StageEnvironment,assertT04ResourceFacts,assertT04ContainerContinuity,t04BaselineMemberships,t04RestoreFailureFacts}from'./permission-runtime-t04-fixture.mjs';
import{CI1_LIMITS,CI1_PROJECT,ci1Identity}from'./permission-ci1-policy.mjs';
import{ci1FailureExport,ci1IsolatedFailure,t04CommandOptions}from'./permission-runtime-t04-worker.mjs';
import{t04CorrelateRestoreLog,T04_RESTORE_SQLSTATES,t04CorrelateServerLog,
 t04RestoreConstraintTarget,t04ConstraintCatalogFacts,T04_DIAGNOSTIC_BOUNDS,t04LogCapabilityMask}from'./permission-runtime-t04-restore-diagnostic.mjs';
import{IMAGE_OBSERVATION_KEYS,IMAGE_RESTORATION_KEYS}from'./permission-t04-image-measurement.mjs';
const catalog=runtimeStageCatalog().filter(s=>s.runtimeProfile==='SUPABASE_T04'),ids=catalog.map(s=>s.stage);
const sha='a'.repeat(40),digest='b'.repeat(64);
// Parser/orchestration fixture only; this object is never backend evidence.
const imageReceipt=()=>({schemaVersion:'permission-t04-image-measurement-v1',scope:'SYNTHETIC_T04_IMAGE_ONLY',status:'PASS',execution:'RUNTIME',
 binding:{sourceSHA:sha,sourceFingerprint:digest,lockSHA:digest,runId:'123',attempt:1,physicalBackendSHA:digest},
 observations:Object.fromEntries(IMAGE_OBSERVATION_KEYS.map(key=>[key,true])),
 timing:{target59Ms:59000,target60Ms:60000,target61Ms:61000,observed59Ms:59010,observed60Ms:60010,observed61Ms:61010},
 restoration:Object.fromEntries(IMAGE_RESTORATION_KEYS.map(key=>[key,true])),uploadOrphanStatus:'QUEUE_CLEANUP_UNCERTAIN'});
const row=id=>{const n=catalog.find(s=>s.stage===id).required.length;return{stage:id,status:'PASS',required:n,run:n,discovered:n,
 pass:n,fail:0,skip:0,retry:0,sourceSHA:sha,reportSHA:digest,invocationSHA:digest,supplementalOracles:'NOT_PROVEN_BY_STAGE_COUNTS'};};
function fixture(change={}){const seen=[],closed=[],prepared=[],reset=[];return{seen,closed,prepared,reset,adapter:{guard(){},async bootstrap(){},async physical(){return digest;},
 async baseline(){return digest;},async preserved(){return true;},async checkpoint(){return{archiveSHA:digest,storageSHA:digest};},
 async preflight(){return{status:'PASS',archiveSHA:digest,storageSHA:digest,baselineSHA:digest,physicalSHA:digest};},
  async imageMeasurement(){return imageReceipt();},
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

test('compatibility route seven survives both T04 diagnostic boundaries while route eight and private fields are refused',()=>{
 const facts={t04StageOrdinal:19,t04FirstFailedRequired:2,t04FirstFailedLine:91,t04TestErrorCodeOrdinal:40,t04TestErrorNameOrdinal:4};
 const failure={stage:'offline-edge',operation:'PILOT_HARNESS',code:'COMMAND_FAILED',command:'node',exitCode:1,facts};
 assert.deepEqual(t04FailureFacts('T04_FAILURE_FACTS '+JSON.stringify(facts)),facts);
 assert.deepEqual(ci1FailureExport(failure),failure);
 for(const delta of[{t04TestErrorCodeOrdinal:41},{raw:'PRIVATE'}]){
  const invalid={...failure,facts:{...facts,...delta}};
  assert.deepEqual(t04FailureFacts('T04_FAILURE_FACTS '+JSON.stringify(invalid.facts)),{});
  assert.notDeepEqual(ci1FailureExport(invalid),invalid);
 }
});

test('private pg_restore failures project finite categories through both public boundaries without SQL or identifiers',()=>{
 const privateText='pg_restore: error: could not execute query: ERROR: cannot drop extension FAKE_PRIVATE_KEY because other objects depend on it\nDETAIL: FAKE_PRIVATE_KEY\nCommand was: DROP EXTENSION IF EXISTS FAKE_PRIVATE_KEY;';
 const facts=t04RestoreFailureFacts(Buffer.from(privateText));assert.deepEqual(facts,{t04RestoreErrorOrdinal:1,t04RestoreCommandOrdinal:2});
 assert.deepEqual(t04RestoreFailureFacts('pg_restore: error: ERROR: relation "FAKE_PRIVATE_KEY" already exists\nCommand was: CREATE TABLE FAKE_PRIVATE_KEY (id int);'),
  {t04RestoreErrorOrdinal:2,t04RestoreCommandOrdinal:13});
 assert.deepEqual(t04RestoreFailureFacts('pg_restore: error: UNKNOWN FAKE_PRIVATE_KEY'),{t04RestoreErrorOrdinal:0,t04RestoreCommandOrdinal:0});
 assert.deepEqual(t04RestoreFailureFacts('pg_restore: error: could not execute query: ERROR: permission denied for schema private\nDETAIL: already exists\nCommand was: CREATE FUNCTION private.fn() returns text language sql as $$ select \'already exists\' $$;'),
  {t04RestoreErrorOrdinal:4,t04RestoreCommandOrdinal:20});
 for(const raw of[undefined,{},'unrelated FAKE_PRIVATE_KEY','pg_restore:'+ 'x'.repeat(1024**2),Buffer.alloc(1024**2+1)])assert.deepEqual(t04RestoreFailureFacts(raw),{});
 const failure={stage:'offline-edge',operation:'PILOT_HARNESS',code:'COMMAND_FAILED',command:'node',exitCode:1,
  facts:{t04StageOrdinal:10,t04BoundaryOrdinal:15,t04BoundaryExit:1,...facts}};
 const receipt=f=>({schemaVersion:'permission-ci1-isolated-failure-v1',runId:'123',attempt:1,sourceSHA:sha,failure:f,cleanupFailure:null});
 assert.deepEqual(t04FailureFacts('T04_FAILURE_FACTS '+JSON.stringify(failure.facts)),failure.facts);
 assert.deepEqual(ci1FailureExport(failure),failure);assert(ci1IsolatedFailure(receipt(failure),ci1Identity('123',1),sha));
 assert(!JSON.stringify(ci1FailureExport(failure)).includes('FAKE_PRIVATE_KEY'));
 for(const delta of[{t04RestoreErrorOrdinal:16},{t04RestoreErrorOrdinal:-1},{t04RestoreCommandOrdinal:25},{t04RestoreCommandOrdinal:'SECRET'},{stderr:privateText}]){
  const invalid={...failure,facts:{...failure.facts,...delta}};assert.deepEqual(t04FailureFacts('T04_FAILURE_FACTS '+JSON.stringify(invalid.facts)),{});
  assert.notDeepEqual(ci1FailureExport(invalid),invalid);assert.throws(()=>ci1IsolatedFailure(receipt(invalid),ci1Identity('123',1),sha));
 }
});

test('restore server error needs exact private primary and statement correlation on the same backend PID',()=>{
 const primary='cannot drop inherited constraint "FAKE_PRIVATE" of relation "FAKE_PRIVATE"';
 const command='ALTER TABLE ONLY private.FAKE_PRIVATE DROP CONSTRAINT FAKE_PRIVATE;',prefix='%m [%p] %q%u@%d ';
 const client='pg_restore: error: could not execute query: ERROR:  '+primary+'\nCommand was: '+command+'\n';
 const line=(pid,level,body)=>`2026-10-20 09:00:00.123 UTC [${pid}] supabase_admin@postgres ${level}:  ${body}`;
 const error=line(42,'ERROR','42P16: '+primary),statement=line(42,'STATEMENT',command);
 const noise=line(7,'ERROR','42501: background permission denied')+'\n'+line(7,'STATEMENT','SELECT 1;');
 const actual=t04CorrelateRestoreLog(client,noise+'\n'+error+'\n'+line(42,'LOCATION','private_location')+'\n'+statement,prefix);
 assert.deepEqual(actual,{t04RestoreLogObserved:1,t04RestoreSqlstateOrdinal:T04_RESTORE_SQLSTATES.indexOf('42P16')+1});
 assert(!JSON.stringify(actual).includes('FAKE_PRIVATE'));
 for(const log of[error,statement,error+'\n'+line(7,'STATEMENT',command),error+'\n'+line(42,'STATEMENT','SELECT 1;'),
  line(42,'ERROR','42P16: different primary')+'\n'+statement,
  error+'\n'+line(42,'STATEMENT',`SELECT '${command} ERROR: 42P16: ${primary}';`)])
  assert.deepEqual(t04CorrelateRestoreLog(client,log,prefix),{t04RestoreLogObserved:0,t04RestoreSqlstateOrdinal:0});
 assert.deepEqual(t04CorrelateRestoreLog(client,error+'\n'+statement+'\n'+error+'\n'+statement,prefix),{t04RestoreLogObserved:2,t04RestoreSqlstateOrdinal:0});
});
test('restore log parser rejects unsupported/truncated/oversized material and never projects an unknown SQLSTATE string',()=>{
 const primary='fixed message',command='ALTER TABLE public.example DROP CONSTRAINT example;',prefix='%m [%p] ';
 const client='pg_restore: error: could not execute query: ERROR:  '+primary+'\nCommand was: '+command;
 const log='2026-10-20 09:00:00 UTC [42] ERROR:  ZZZZZ: '+primary+'\n2026-10-20 09:00:00 UTC [42] STATEMENT:  '+command;
 assert.deepEqual(t04CorrelateRestoreLog(client,log,prefix),{t04RestoreLogObserved:1,t04RestoreSqlstateOrdinal:0});
 for(const p of['%i','%m [%p] %p ','%m [%p] %z ','x'.repeat(257)])assert.deepEqual(t04CorrelateRestoreLog(client,log,p),{t04RestoreLogObserved:3,t04RestoreSqlstateOrdinal:0});
 for(const [c,l]of[[undefined,log],[client,{}],[client,'x'.repeat(1024**2+1)],['pg_restore: '+ 'x'.repeat(1024**2),log],
  [client,log+'\n'+'x'.repeat(65537)],[client,log+'\n'.repeat(10001)],[client+'\n'+client,log]])
  assert.deepEqual(t04CorrelateRestoreLog(c,l,prefix),{t04RestoreLogObserved:0,t04RestoreSqlstateOrdinal:0});
});
test('server restore diagnostics are independently range-checked at parser and final public exporter',()=>{
 const facts={t04StageOrdinal:10,t04BoundaryOrdinal:15,t04RestoreLogObserved:1,t04RestoreSqlstateOrdinal:T04_RESTORE_SQLSTATES.length};
 const failure={stage:'offline-edge',operation:'PILOT_HARNESS',code:'COMMAND_FAILED',command:'node',exitCode:1,facts};
 const receipt=f=>({schemaVersion:'permission-ci1-isolated-failure-v1',runId:'123',attempt:1,sourceSHA:sha,failure:f,cleanupFailure:null});
 assert.deepEqual(t04FailureFacts('T04_FAILURE_FACTS '+JSON.stringify(facts)),facts);assert.deepEqual(ci1FailureExport(failure),failure);
 assert(ci1IsolatedFailure(receipt(failure),ci1Identity('123',1),sha));
 for(const delta of[{t04RestoreLogObserved:5},{t04RestoreSqlstateOrdinal:T04_RESTORE_SQLSTATES.length+1},{t04RestoreSqlstateOrdinal:-1},{privateLog:'FAKE_PRIVATE'}]){
  const invalid={...failure,facts:{...facts,...delta}};assert.deepEqual(t04FailureFacts('T04_FAILURE_FACTS '+JSON.stringify(invalid.facts)),{});
  assert.notDeepEqual(ci1FailureExport(invalid),invalid);assert.throws(()=>ci1IsolatedFailure(receipt(invalid),ci1Identity('123',1),sha));
 }
});

test('T04 reset permits only PG17 fixed ADMIN-only creator edge and still requires every unrelated baseline edge unchanged',()=>{
 const original=[{role:'base_role',member:'base_member',grantor:'supabase_admin',admin_option:false,inherit_option:true,set_option:true}];
 const edge={role:'pos_owner_recovery',member:'postgres',grantor:'supabase_admin',admin_option:true,inherit_option:false,set_option:false};
 assert.deepEqual(t04BaselineMemberships(original,false),original);assert.deepEqual(t04BaselineMemberships([...original,edge],true),original);
 for(const delta of[{member:'authenticated'},{grantor:'postgres'},{admin_option:false},{inherit_option:true},{set_option:true},{raw:'PRIVATE'}])
  assert.throws(()=>t04BaselineMemberships([...original,{...edge,...delta}],true));
 for(const rows of[original,[...original,edge,edge],[...original,edge,{...edge,role:'another',member:'pos_owner_recovery'}]])
  assert.throws(()=>t04BaselineMemberships(rows,true));
 assert.throws(()=>t04BaselineMemberships([...original,edge],false));
 for(const rows of[[{...original[0],set_option:false},edge],[...original,{...original[0],role:'extra_role'},edge]])
  assert.notDeepEqual(t04BaselineMemberships(rows,true),original);
});

test('T04 orchestrator runs exactly nineteen canonical stages, preserves physical and logical backend and closes once',async()=>{
 const f=fixture(),r=await runT04Profile(f.adapter);assert.equal(r.status,'PASS');assert.deepEqual(f.seen,ids);assert.equal(f.closed.length,1);
 assert.equal(r.remainingBusinessStages,16);assert.equal(r.full35BusinessRuntime,'NOT_RUN');
 const rendered=renderT04Evidence({...r,...metadata});assert.equal(JSON.parse(rendered.json).stages.length,19);
 assert.deepEqual(f.prepared,ids);assert.deepEqual(f.reset,ids.filter(s=>t04Lifecycle(s).reset));assert.equal(f.reset.length,10);
});

test('image measurement runs once after candidate browser success and before storage observation or reset',async()=>{
 const order=[],f=fixture({async stage(id){order.push('stage:'+id);return row(id);},
  async imageMeasurement(){order.push('image');return imageReceipt();},
  async afterStage(id){order.push('observe:'+id);return digest;}});
 const r=await runT04Profile(f.adapter);assert.equal(r.status,'PASS');assert.equal(order.filter(x=>x==='image').length,1);
 const index=order.indexOf('image');assert.equal(order[index-1],'stage:candidate-e2e');assert.equal(order[index+1],'observe:candidate-e2e');
 assert.deepEqual(r.imageMeasurement,imageReceipt());assert.equal(f.closed.length,1);
});

test('missing, simulated, unbound or incomplete image measurement fails candidate stage and blocks every later stage',async()=>{
 const wrong=change=>({...imageReceipt(),...change});
 for(const measure of[undefined,async()=>{throw Error('controlled measurement failure');},
  async()=>wrong({execution:'UNIT_SIMULATION'}),async()=>wrong({binding:{...imageReceipt().binding,physicalBackendSHA:'c'.repeat(64)}}),
  async()=>wrong({restoration:{...imageReceipt().restoration,browserClosed:false}})]){
  const f=fixture({imageMeasurement:measure}),r=await runT04Profile(f.adapter),index=ids.indexOf('candidate-e2e');
  assert.equal(r.status,'FAIL');assert.equal(r.failure,'candidate-e2e');assert.equal(r.stages[index].status,'FAIL');
  assert(r.stages.slice(index+1).every(s=>s.status==='NOT_RUN'));assert.equal(r.imageMeasurement,null);assert.equal(f.closed.length,1);
  assert.equal(JSON.parse(renderT04Evidence({...r,...metadata}).json).status,'FAIL');
 }
});

test('public T04 renderer binds image measurement to current source and rejects missing, private or incomplete proof',async()=>{
 const f=fixture(),r={...await runT04Profile(f.adapter),...metadata};
 for(const value of[null,undefined,{...imageReceipt(),raw:'PRIVATE'},
  {...imageReceipt(),binding:{...imageReceipt().binding,sourceSHA:'c'.repeat(40)}},
  {...imageReceipt(),binding:{...imageReceipt().binding,runId:'124'}},
  {...imageReceipt(),observations:{...imageReceipt().observations,warmCache:false}},
  {...imageReceipt(),execution:'UNIT_SIMULATION'}])assert.throws(()=>renderT04Evidence({...r,imageMeasurement:value}));
 const early=fixture({async bootstrap(){throw Error('controlled');}}),failed={...await runT04Profile(early.adapter),...metadata};
 assert.throws(()=>renderT04Evidence({...failed,imageMeasurement:imageReceipt()}));
 assert.equal(JSON.parse(renderT04Evidence(failed).json).imageMeasurement,null);
});
test('canonical rollback variants cannot inherit caller choice; realtime output requires its own private path',()=>{
 for(const [stage,variant]of[['rollback-additive-database','Additive'],['rollback-preflight-database','Preflight'],['rollback-recovery-database','Recovery']])
  assert.equal(t04StageEnvironment(stage,{PERM_ROLLBACK_VARIANT:'bad'}).PERM_ROLLBACK_VARIANT,variant);
 assert.equal(t04StageEnvironment('candidate-e2e',{PERM_ROLLBACK_VARIANT:'Recovery'}).PERM_ROLLBACK_VARIANT,undefined);
 assert.throws(()=>t04StageEnvironment('realtime-e2e',{},'/tmp/public'));
 assert.equal(t04StageEnvironment('realtime-e2e',{},'/volume/private/t04-realtime').PERM_REALTIME_PRIVATE_ARTIFACT_DIR,'/volume/private/t04-realtime');
 assert.equal(t04Lifecycle('candidate-roles-e2e').pre,'activated');assert.equal(t04Lifecycle('realtime-e2e').pre,'activated');
 assert.deepEqual(t04Lifecycle('transition-compatibility-database'),{pre:'candidate-pass-through',post:'candidate-pass-through',reset:true});
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
  let completed=false;const f=fixture({async stage(id){f.seen.push(id);completed=true;return row(id);},
   ...(kind==='physical'?{async physical(){return completed?'c'.repeat(64):digest;}}
    :{async preserved(){return!completed;}})}),r=await runT04Profile(f.adapter);
  assert.equal(r.status,'FAIL');assert.deepEqual(f.seen,ids.slice(0,1));assert.equal(r.stages[0].status,'FAIL');
  assert(r.stages.slice(1).every(s=>s.status==='NOT_RUN'));assert.equal(f.closed.length,1);
  assert.equal(JSON.parse(renderT04Evidence({...r,...metadata}).json).status,'FAIL');
 }
});

test('runner preflight is mandatory before all nineteen business stages and cannot change checkpoint identity',async()=>{
 const valid={status:'PASS',archiveSHA:digest,storageSHA:digest,baselineSHA:digest,physicalSHA:digest};
 for(const delta of[{status:'FAIL'},{archiveSHA:'c'.repeat(64)},{storageSHA:'c'.repeat(64)},
  {baselineSHA:'c'.repeat(64)},{physicalSHA:'c'.repeat(64)},{extra:'PRIVATE'}]){
  const f=fixture({async preflight(){return{...valid,...delta};}}),r=await runT04Profile(f.adapter);
  assert.equal(r.failure,'bootstrap');assert.equal(r.runnerPreflight,'FAIL');assert.equal(f.closed.length,1);
  assert.equal(f.seen.length,0);assert.equal(f.reset.length,0);assert(r.stages.every(s=>s.status==='NOT_RUN'));
  assert.equal(JSON.parse(renderT04Evidence({...r,...metadata}).json).runnerPreflight,'FAIL');
 }
 for(const change of[{preflight:undefined},{async preflight(){throw Error('controlled log unavailable');}}]){
  const f=fixture(change),r=await runT04Profile(f.adapter);assert.equal(r.runnerPreflight,'FAIL');assert.equal(f.seen.length,0);
 }
 const order=[],f=fixture({async preflight(){order.push('preflight');return valid;},async stage(id){order.push(id);return row(id);}});
 const r=await runT04Profile(f.adapter);assert.equal(r.status,'PASS');assert.deepEqual(order,['preflight',...ids]);
 assert.equal(r.runnerPreflight,'PASS');assert.equal(r.resets.length,10);
 for(const state of['FAIL','NOT_RUN',undefined])assert.throws(()=>renderT04Evidence({...r,...metadata,runnerPreflight:state}));
});

test('controlled observability requires the actual session PID and division-by-zero SQLSTATE without exporting the PID',()=>{
 const prefix='%m [%p] ',command='select 1 / 0;',primary='division by zero';
 const pair=pid=>`2026-10-20 09:00:00 UTC [${pid}] ERROR:  22012: ${primary}\n2026-10-20 09:00:00 UTC [${pid}] STATEMENT:  ${command}`;
 const result=t04CorrelateServerLog(primary,command,pair(12)+'\n'+pair(13),prefix,12);
 assert.deepEqual(result,{t04RestoreLogObserved:1,t04RestoreSqlstateOrdinal:T04_RESTORE_SQLSTATES.indexOf('22012')+1});
 assert.equal(t04CorrelateServerLog(primary,command,pair(13),prefix,12).t04RestoreLogObserved,0);
 for(const pid of[0,-1,2147483648,'12',NaN])assert.equal(t04CorrelateServerLog(primary,command,pair(12),prefix,pid).t04RestoreLogObserved,0);
});

test('failed constraint target accepts a complete unique pg_restore command and refuses extra SQL or ambiguous framing',()=>{
 const stderr=command=>'pg_restore: error: could not execute query: ERROR:  fixed\nCommand was: '+command+'\n';
 assert.deepEqual(t04RestoreConstraintTarget(stderr('ALTER TABLE IF EXISTS ONLY auth.users DROP CONSTRAINT IF EXISTS users_pkey;')),
  {schema:'auth',table:'users',constraint:'users_pkey'});
 assert.deepEqual(t04RestoreConstraintTarget(stderr('ALTER TABLE "A"."t""x" DROP CONSTRAINT "c x";')),
  {schema:'A',table:'t"x',constraint:'c x'});
 for(const command of['ALTER TABLE auth.users DROP CONSTRAINT users_pkey; SELECT 1;',
  'ALTER TABLE users DROP CONSTRAINT users_pkey;','ALTER TABLE auth.users DROP CONSTRAINT "";',
  'ALTER TABLE auth.users DROP CONSTRAINT "'+ 'x'.repeat(64)+'";',
  'ALTER TABLE auth.users DROP CONSTRAINT users_pkey;\nSELECT 1;',
  'ALTER TABLE auth.users DROP CONSTRAINT users_pkey;\nCommand was: DROP TABLE auth.users;'])
  assert.equal(t04RestoreConstraintTarget(stderr(command)),null);
 assert.equal(t04RestoreConstraintTarget(stderr('ALTER TABLE auth.users DROP CONSTRAINT users_pkey;').repeat(2)),null);
});

test('finite constraint facts require unique logical catalog/archive binding even after restore changes object OIDs',()=>{
 const target={schema:'realtime',table:'messages',constraint:'messages_pkey'},r={...target,oid:12345,owner:'supabase_admin',kind:'p',
  local:false,inherited:1,parent:true,dependencies:9};
 const toc='2999; 2606 12345 CONSTRAINT realtime messages messages_pkey supabase_admin\n';
 const facts=t04ConstraintCatalogFacts(target,[r],toc);
 assert.deepEqual(facts,{t04RestoreTargetObserved:1,t04RestoreSchemaOrdinal:5,t04RestoreConstraintKind:3,
  t04RestoreConstraintLocal:0,t04RestoreConstraintInherited:1,t04RestoreConstraintParent:1,t04RestoreDependencyMask:9});
 for(const rows of[[],[r,r],[{...r,oid:'12345'}],[{...r,constraint:'another'}],[{...r,inherited:-1}],[{...r,dependencies:32}]])
  assert.deepEqual(t04ConstraintCatalogFacts(target,rows,toc),{t04RestoreTargetObserved:3});
 assert.deepEqual(t04ConstraintCatalogFacts(target,[{...r,oid:87654}],toc),facts);
 for(const text of[toc.replace('12345','0'),toc.replace('12345','4294967296'),toc+toc,
  toc.replace('CONSTRAINT','FK CONSTRAINT'),toc.replace('messages_pkey','another')])
  assert.deepEqual(t04ConstraintCatalogFacts(target,[r],text),{t04RestoreTargetObserved:4});
 const spaced={...target,constraint:'c x'};
 assert.deepEqual(t04ConstraintCatalogFacts(spaced,[{...r,...spaced}],toc),{t04RestoreTargetObserved:4});
 assert(!JSON.stringify(facts).includes('messages'));assert(!JSON.stringify(facts).includes('12345'));
});

test('log capability mask identifies each unsupported channel component without exporting configuration',()=>{
 const logging={collector:'off',destination:'stderr',prefix:'%m [%p] '};
 assert.equal(t04LogCapabilityMask('json-file',logging),15);assert.equal(t04LogCapabilityMask('local',logging),15);
 assert.equal(t04LogCapabilityMask('none',logging),14);
 assert.equal(t04LogCapabilityMask('json-file',{...logging,collector:'on'}),13);
 assert.equal(t04LogCapabilityMask('json-file',{...logging,destination:'csvlog'}),11);
 assert.equal(t04LogCapabilityMask('json-file',{...logging,prefix:'%z'}),7);
 assert.equal(t04LogCapabilityMask(undefined,undefined),0);
});

test('every finite catalog/preflight metric is bounded independently at both public exporters',()=>{
 const base={stage:'offline-edge',operation:'PILOT_HARNESS',code:'COMMAND_FAILED',command:'node',exitCode:1};
 for(const[key,[min,max]]of Object.entries(T04_DIAGNOSTIC_BOUNDS)){
  const facts={t04StageOrdinal:0,[key]:max},failure={...base,facts};
  assert.deepEqual(t04FailureFacts('T04_FAILURE_FACTS '+JSON.stringify(facts)),facts);
  assert.deepEqual(ci1FailureExport(failure),failure);
  for(const value of[min-1,max+1,'1']){
   const invalid={...base,facts:{...facts,[key]:value}};
   assert.deepEqual(t04FailureFacts('T04_FAILURE_FACTS '+JSON.stringify(invalid.facts)),{});
   assert.notDeepEqual(ci1FailureExport(invalid),invalid);
  }
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

import{ci1FailureExport as t04FinalFailureExport}from'./permission-runtime-t04-worker.mjs';
test('Realtime finite mask is independently bounded at T04 parser and final worker exporter',()=>{
 for(const mask of[0,1,1023]){const facts={t04StageOrdinal:13,t04RealtimeFailureMask:mask};
  assert.equal(t04FailureFacts('T04_FAILURE_FACTS '+JSON.stringify(facts)).t04RealtimeFailureMask,mask);
  assert.equal(t04FinalFailureExport({stage:'offline-edge',operation:'PILOT_HARNESS',code:'COMMAND_FAILED',command:'node',exitCode:1,facts}).facts.t04RealtimeFailureMask,mask);}
 for(const mask of[-1,1024,1.5,'1']){const facts={t04StageOrdinal:13,t04RealtimeFailureMask:mask};
  assert.deepEqual(t04FailureFacts('T04_FAILURE_FACTS '+JSON.stringify(facts)),{});
  assert(!Object.hasOwn(t04FinalFailureExport({facts}).facts??{},'t04RealtimeFailureMask'));}
});

test('Realtime first failure ordinal is independently bounded at parser and final exporter',()=>{
 for(const value of[0,1,480]){const facts={t04StageOrdinal:13,t04RealtimeFirstFailureOrdinal:value};assert.equal(t04FailureFacts('T04_FAILURE_FACTS '+JSON.stringify(facts)).t04RealtimeFirstFailureOrdinal,value);assert.equal(t04FinalFailureExport({facts}).facts.t04RealtimeFirstFailureOrdinal,value);}
 for(const value of[-1,481,1.5,'1']){const facts={t04StageOrdinal:13,t04RealtimeFirstFailureOrdinal:value};assert.deepEqual(t04FailureFacts('T04_FAILURE_FACTS '+JSON.stringify(facts)),{});assert(!Object.hasOwn(t04FinalFailureExport({facts}).facts??{},'t04RealtimeFirstFailureOrdinal'));}
});
