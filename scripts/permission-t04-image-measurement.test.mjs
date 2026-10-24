// Pure controls only. Constructed observations are never backend evidence.
import test from 'node:test';
import assert from 'node:assert/strict';
import {runT04ImageMeasurement,validateT04ImageMeasurement,IMAGE_OBSERVATION_KEYS,
 IMAGE_RESTORATION_KEYS,T04_IMAGE_MEASUREMENT_FIELDS,createImageMeasurementDiagnostics,IMAGE_FAILURE_BOUNDS,imageFailureFacts,withImageMeasurementContext} from './permission-t04-image-measurement.mjs';
import {imageMeasurementFailureControl} from './permission-t04-image-diagnostic-control.mjs';
import {t04ParentFailureFacts,t04FailureFacts,t04SafeFailureMetric} from './permission-runtime-t04.mjs';
import {diagnosticMarker,collectRuntimeDiagnosticFacts} from './permission-runtime-diagnostic-transport.mjs';
import {ci1FailureExport,ci1IsolatedFailure} from './permission-runtime-t04-worker.mjs';

const epoch=1792717200000;
const binding={sourceSHA:'a'.repeat(40),sourceFingerprint:'b'.repeat(64),lockSHA:'c'.repeat(64),
 runId:'123',attempt:1,physicalBackendSHA:'d'.repeat(64)};
const stores=['10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002'];
const yes=keys=>Object.fromEntries(keys.map(key=>[key,true]));
function parsedShape(){return {schemaVersion:'permission-t04-image-measurement-v1',scope:'SYNTHETIC_T04_IMAGE_ONLY',status:'PASS',
 execution:'RUNTIME',binding:{...binding},observations:yes(IMAGE_OBSERVATION_KEYS),
 timing:{target59Ms:59000,target60Ms:60000,target61Ms:61000,observed59Ms:59000,observed60Ms:60000,observed61Ms:61000},
 restoration:yes(IMAGE_RESTORATION_KEYS),uploadOrphanStatus:'QUEUE_CLEANUP_UNCERTAIN'};}
const jwt=(role,sub)=>[Buffer.from('{}').toString('base64url'),Buffer.from(JSON.stringify({role,exp:Math.floor(epoch/1000)+3600,...(sub?{sub}:{})})).toString('base64url'),'signature'].join('.');
function fixture(){
 const effects=[];
 const options={root:'/unit/synthetic',guard:()=>{effects.push('guard');},deadline:epoch+225001,api:'http://127.0.0.1:62421',
  storeIds:[...stores],employeeId:'20000000-0000-4000-8000-000000000001',
  db:{query(){effects.push('db');throw Error('UNIT_DB_FORBIDDEN');}},anonKey:jwt('anon'),storeJwt:jwt('authenticated',stores[0]),
  serviceKey:jwt('service_role'),binding:{...binding},physical:async()=>{effects.push('physical');return binding.physicalBackendSHA;}};
 const overrides={now:()=>epoch,monotonic:()=>0,
  sourceFacts:()=>{effects.push('source');return {sourceSHA:binding.sourceSHA,sourceFingerprint:binding.sourceFingerprint,lockSHA:binding.lockSHA};},
  effects:async()=>{effects.push('adapter');return {measure:async()=>{effects.push('measure');const shape=parsedShape();return {observations:shape.observations,timing:shape.timing};},
   close:async()=>{effects.push('close');return yes(IMAGE_RESTORATION_KEYS);}};}};
 return {options,overrides,effects};
}
test('schema controls accept an explicitly constructed parser fixture with full or physical-only expected binding',()=>{
 const r=parsedShape();assert.equal(validateT04ImageMeasurement(r,binding),true);
 assert.equal(validateT04ImageMeasurement(r,{physicalBackendSHA:binding.physicalBackendSHA}),true);
 assert.equal(T04_IMAGE_MEASUREMENT_FIELDS.binding.length,6);
 assert(Object.isFrozen(IMAGE_OBSERVATION_KEYS));assert(Object.isFrozen(IMAGE_RESTORATION_KEYS));
});
test('every observation and restoration is mandatory and strictly boolean',()=>{
 for(const [section,keys] of [['observations',IMAGE_OBSERVATION_KEYS],['restoration',IMAGE_RESTORATION_KEYS]])
  for(const key of keys)for(const bad of [false,0,1,'true',null,undefined]){
   const r=parsedShape();r[section][key]=bad;assert.throws(()=>validateT04ImageMeasurement(r,binding),/REFUSED/);
  }
});
test('unknown keys and omitted keys cannot carry raw identifiers or credentials through the safe schema',()=>{
 const edits=[r=>r.raw='UNIT_SECRET_URL',r=>r.binding.token='UNIT_SECRET_TOKEN',r=>r.observations.objectKey='UNIT_OBJECT_KEY',
  r=>r.restoration.sql='UNIT_SQL',r=>r.timing.url='UNIT_URL',r=>delete r.status,r=>delete r.binding.runId,
  r=>delete r.observations.publication,r=>delete r.restoration.browserClosed,r=>delete r.timing.target60Ms];
 for(const edit of edits){const r=parsedShape();edit(r);assert.throws(()=>validateT04ImageMeasurement(r,binding),/REFUSED/);}
});
test('all source/lock/run/attempt/physical binding members are checked, including when expected binding is partial',()=>{
 for(const key of T04_IMAGE_MEASUREMENT_FIELDS.binding){const r=parsedShape();r.binding[key]=key==='attempt'?2:'e'.repeat(key==='sourceSHA'?40:64);
  assert.throws(()=>validateT04ImageMeasurement(r,binding),/REFUSED/);}
 for(const bad of [{},{workflowSHA:binding.sourceSHA},{physicalBackendSHA:'f'.repeat(64)},null])
  assert.throws(()=>validateT04ImageMeasurement(parsedShape(),bad),/REFUSED/);
 const malformed=parsedShape();malformed.binding.sourceSHA='UNIT_RAW_SOURCE';
 assert.throws(()=>validateT04ImageMeasurement(malformed,{physicalBackendSHA:binding.physicalBackendSHA}),/REFUSED/);
});
test('target60 is exactly 60000ms; measured targets cannot be early, substituted, nonfinite or outside their window',()=>{
 const edits=[r=>r.timing.target60Ms=60250,r=>r.timing.observed59Ms=58999,r=>r.timing.observed60Ms=59999,
  r=>r.timing.observed61Ms=60999,r=>r.timing.observed60Ms=60750,r=>r.timing.observed61Ms=180001,
  r=>r.timing.observed59Ms=NaN,r=>r.timing.observed60Ms=60000.5,r=>r.timing.observed61Ms=Infinity];
 for(const edit of edits){const r=parsedShape();edit(r);assert.throws(()=>validateT04ImageMeasurement(r,binding),/REFUSED/);}
});
test('mock PASS, orphan-free claims, missing observations and alternative scope are refused',()=>{
 for(const [field,bad] of [['execution','UNIT_SIMULATION'],['status','FAIL'],['scope','HOSTED'],['uploadOrphanStatus','ZERO_ORPHANS'],['schemaVersion',2]]){
  const r=parsedShape();r[field]=bad;assert.throws(()=>validateT04ImageMeasurement(r,binding),/REFUSED/);
 }
});
test('hosted/alias/wrong-port URLs and noncanonical roots refuse before any adapter or query',async()=>{
 const values=[['api','https://example.supabase.co'],['api','http://localhost:62421'],['api','http://127.0.0.1:62421/'],
  ['api','http://127.0.0.1:54321'],['root','/unit/../synthetic'],['root','/unit/synthetic/'],['root','D:\\unit'],['root','/unit\nsynthetic']];
 for(const [key,value] of values){const f=fixture();f.options[key]=value;
  await assert.rejects(runT04ImageMeasurement(f.options,f.overrides),/REFUSED/);
  assert(!f.effects.includes('adapter'));assert(!f.effects.includes('db'));
 }
});
test('missing or insufficient deadline refuses before source, physical, browser and database effects',async()=>{
 for(const deadline of [undefined,epoch,epoch+224999,epoch+225000-1,Infinity,epoch+225000.5]){
  const f=fixture();f.options.deadline=deadline;await assert.rejects(runT04ImageMeasurement(f.options,f.overrides),/REFUSED/);
  assert.deepEqual(f.effects,[]);
 }
});
test('wrong source, lock, run, physical backend and changing deadline are fail-closed before measurement',async()=>{
 for(const key of ['sourceSHA','sourceFingerprint','lockSHA']){
  const f=fixture();f.overrides.sourceFacts=()=>({sourceSHA:binding.sourceSHA,sourceFingerprint:binding.sourceFingerprint,lockSHA:binding.lockSHA,
   [key]:'f'.repeat(key==='sourceSHA'?40:64)});
  await assert.rejects(runT04ImageMeasurement(f.options,f.overrides),/REFUSED/);assert(!f.effects.includes('adapter'));
 }
 {const f=fixture();f.options.binding.runId='0';await assert.rejects(runT04ImageMeasurement(f.options,f.overrides),/REFUSED/);assert.deepEqual(f.effects,[]);}
 {const f=fixture();f.options.physical=async()=> 'f'.repeat(64);await assert.rejects(runT04ImageMeasurement(f.options,f.overrides),/REFUSED/);assert(!f.effects.includes('adapter'));}
 {const f=fixture();let ticks=0;f.overrides.now=()=>epoch+(++ticks>5?10000:0);
  await assert.rejects(runT04ImageMeasurement(f.options,f.overrides),/REFUSED/);assert(!f.effects.includes('adapter'));}
});
test('credential role, exact store set and owned employee are validated without loading a client',async()=>{
 const edits=[o=>o.storeIds.reverse(),o=>o.storeIds.push(stores[0]),o=>o.employeeId='20000000-0000-4000-8000-000000000002',
  o=>o.storeJwt=jwt('authenticated',stores[1]),o=>o.anonKey=jwt('service_role'),o=>o.serviceKey=jwt('anon'),
  o=>o.storeJwt='UNIT_SECRET_INVALID_JWT'];
 for(const edit of edits){const f=fixture();edit(f.options);await assert.rejects(runT04ImageMeasurement(f.options,f.overrides),/REFUSED/);
  assert(!f.effects.includes('adapter'));assert(!f.effects.includes('db'));
 }
});
test('injected observations are labeled UNIT_SIMULATION and rejected as runtime evidence',async()=>{
 const f=fixture(),r=await runT04ImageMeasurement(f.options,f.overrides);
 assert.equal(r.execution,'UNIT_SIMULATION');assert.equal(f.effects.filter(x=>x==='close').length,1);
 assert.throws(()=>validateT04ImageMeasurement(r,binding),/REFUSED/);
 assert(!JSON.stringify(r).includes(f.options.serviceKey));assert(!JSON.stringify(r).includes(f.options.storeJwt));
 assert(!JSON.stringify(r).includes(f.options.root));assert(!JSON.stringify(r).includes(f.options.api));
});
test('measurement failure always closes the adapter and replaces raw error text with a fixed safe code',async()=>{
 const f=fixture();f.overrides.effects=async()=>({measure:async()=>{throw Error('UNIT_SECRET_TOKEN_URL_SQL');},
  close:async()=>{f.effects.push('close');return yes(IMAGE_RESTORATION_KEYS);}});
 await assert.rejects(runT04ImageMeasurement(f.options,f.overrides),error=>error.message==='PERMISSION_T04_IMAGE_MEASUREMENT_FAILED');
 assert.deepEqual(f.effects.filter(x=>x==='close'),['close']);
});
test('cleanup uncertainty cannot produce an accepted receipt',async()=>{
 for(const fault of ['throw','false','missing']){
  const f=fixture();f.overrides.effects=async()=>({measure:async()=>{const r=parsedShape();return {observations:r.observations,timing:r.timing};},
   close:async()=>{if(fault==='throw')throw Error('UNIT_RAW_CLEANUP');const r=yes(IMAGE_RESTORATION_KEYS);if(fault==='false')r.ownedStorageRemoved=false;
    if(fault==='missing')delete r.browserClosed;return r;}});
  await assert.rejects(runT04ImageMeasurement(f.options,f.overrides),error=>error.message==='PERMISSION_T04_IMAGE_MEASUREMENT_FAILED');
 }
});
test('guard denial has zero DB/network/browser adapter effects and no raw error leakage',async()=>{
 const f=fixture();f.options.guard=()=>{throw Error('UNIT_PRIVATE_GUARD_DETAIL');};
 await assert.rejects(runT04ImageMeasurement(f.options,f.overrides),error=>error.message==='PERMISSION_T04_IMAGE_MEASUREMENT_REFUSED');
 assert.deepEqual(f.effects,[]);
});

test('measurement phase and sticky cleanup facts preserve the first failure without raw causes',async()=>{
 for(const kind of['admission','adapter','measure-cleanup','close-recovered','null-result','invalid-receipt']){
  const f=fixture();let closes=0;
  if(kind==='admission')f.options.guard=()=>{throw Error('PRIVATE_ADMISSION');};
  f.overrides.effects=async()=>{
   if(kind==='adapter')throw Error('PRIVATE_ADAPTER');
   return{measure:async()=>{if(kind==='measure-cleanup')throw Error('PRIVATE_MEASURE');
    if(kind==='null-result')return null;const r=parsedShape();if(kind==='invalid-receipt')r.observations.publication=false;return r;},
    close:async()=>{closes++;if(kind==='measure-cleanup'||kind==='close-recovered'&&closes===1)throw Error('PRIVATE_CLEANUP');return yes(IMAGE_RESTORATION_KEYS);}};
  };
  const phase={admission:1,adapter:2,'measure-cleanup':3,'close-recovered':4,'null-result':5,'invalid-receipt':5}[kind];
  await assert.rejects(runT04ImageMeasurement(f.options,f.overrides),error=>{
   assert.equal(error.t04ImageMeasurementPhaseOrdinal,phase);
   assert.equal(error.t04ImageMeasurementCleanupAttempted,phase>2?1:0);
   assert.equal(error.t04ImageMeasurementCleanupFailed,['measure-cleanup','close-recovered'].includes(kind)?1:0);
   assert(!error.message.includes('PRIVATE'));return true;
  });
  assert.equal(closes,phase<3?0:kind==='close-recovered'?2:1);
 }
});

test('real helper failure captures first predicate or external class before secondary cleanup changes state',async()=>{
 for(const kind of['predicate','predicate-cleanup','external']){
  const facts=await imageMeasurementFailureControl(kind);
  assert.equal(facts.t04ImageMeasurementPhaseOrdinal,3);assert.equal(facts.t04ImageMeasurementCleanupAttempted,1);
  assert.equal(facts.t04ImageMeasurementCleanupFailed,kind==='predicate-cleanup'?1:0);
  assert.equal(facts.t04ImageMeasureStepOrdinal,kind==='external'?7:31);
  assert.equal(facts.t04ImageMeasurePredicateOrdinal,kind==='external'?0:67);
  assert.equal(facts.t04ImageMeasureExceptionClassOrdinal,kind==='external'?2:1);
  assert.equal(facts.t04ImageMeasureObservationMask,16777215-2**11-2**12);
  assert.equal(facts.t04ImageMeasureElapsedObserved,kind==='external'?0:1);
  assert.equal(facts.t04ImageMeasureElapsedMs,kind==='external'?0:59999);
  assert(!JSON.stringify(facts).includes('PRIVATE'));
 }
});
test('image diagnostic snapshot is immutable and timing resets between cache targets with honest saturation',()=>{
 const observations={},progress=createImageMeasurementDiagnostics(observations);
 progress.step(30);progress.timing(59,59000);progress.step(31);
 const snapshot=imageFailureFacts(progress.capture({name:'PRIVATE_SECRET_NAME',message:'PRIVATE'}));
 assert.equal(snapshot.t04ImageMeasureCacheTargetOrdinal,2);assert.equal(snapshot.t04ImageMeasureElapsedObserved,0);
 assert.equal(snapshot.t04ImageMeasureElapsedMs,0);assert.equal(snapshot.t04ImageMeasureExceptionClassOrdinal,0);
 progress.step(33);observations.publication=true;assert.deepEqual(imageFailureFacts(progress.capture(TypeError('PRIVATE'))),snapshot);
 for(const [value,observed,ms,capped] of [[NaN,0,0,0],[Infinity,0,0,0],[-1,1,0,1],[999999,1,180000,1],[0,1,0,0],[60750,1,60750,0]]){
  const p=createImageMeasurementDiagnostics({});p.step(31);p.timing(60,value);const f=imageFailureFacts(p.capture(Error()));
  assert.deepEqual([f.t04ImageMeasureElapsedObserved,f.t04ImageMeasureElapsedMs,f.t04ImageMeasureElapsedCapped],[observed,ms,capped]);
 }
 for(const value of[0,34,NaN,'1'])assert.throws(()=>createImageMeasurementDiagnostics({}).step(value));
 for(const value of[0,71,NaN,'1'])assert.throws(()=>createImageMeasurementDiagnostics({}).check(false,value));
});
test('every image failure field survives bounded parent-marker-worker-collector projection and rejects poisoned values',async()=>{
 const facts={t04StageOrdinal:10,...t04ParentFailureFacts(await imageMeasurementFailureControl(),{phaseOrdinal:5})};
 const base={stage:'offline-edge',operation:'PILOT_HARNESS',code:'COMMAND_FAILED',command:'node',exitCode:1};
 const parsed=t04FailureFacts(diagnosticMarker('T04_FAILURE_FACTS',facts,t04SafeFailureMetric));
 const failure=ci1FailureExport({...base,facts:parsed});
 assert.deepEqual(collectRuntimeDiagnosticFacts([{failure}],'t04',t04SafeFailureMetric)[0],facts);
 const envelope=f=>({schemaVersion:'permission-ci1-isolated-failure-v1',runId:'123',attempt:1,sourceSHA:binding.sourceSHA,failure:f,cleanupFailure:null});
 assert(ci1IsolatedFailure(envelope(failure),{runId:'123',attempt:1},binding.sourceSHA));
 for(const [key,[min,max]] of Object.entries(IMAGE_FAILURE_BOUNDS))for(const bad of[min-1,max+1,0.5,'PRIVATE_IMAGE',null]){
  const invalid={...base,facts:{...facts,[key]:bad}};
  assert.deepEqual(t04FailureFacts('T04_FAILURE_FACTS '+JSON.stringify(invalid.facts)),{});
  assert.notDeepEqual(ci1FailureExport(invalid),invalid);
  assert.throws(()=>ci1IsolatedFailure(envelope(invalid),{runId:'123',attempt:1},binding.sourceSHA));
 }
});
test('fresh-context closure preserves body predicate or external failure and sticky cleanup through successful outer close',async()=>{
 for(const kind of['predicate-both','external-both','body-only','close-only']){
  const f=fixture(),p=createImageMeasurementDiagnostics({publication:true});let bodyCalls=0,innerCloses=0,outerCloses=0;
  f.overrides.effects=async()=>({measure:async()=>{
   try{p.step(29);await withImageMeasurementContext(async()=>{bodyCalls++;
    if(kind==='predicate-both'||kind==='body-only')p.check(false,66);
    if(kind==='external-both')throw TypeError('PRIVATE_FRESH_REQUEST');return true;
   },async()=>{innerCloses++;if(kind!=='body-only')throw RangeError('PRIVATE_FRESH_CLOSE');},e=>p.capture(e));
   }catch(error){throw p.capture(error);}
  },close:async()=>{outerCloses++;return yes(IMAGE_RESTORATION_KEYS);}});
  await assert.rejects(runT04ImageMeasurement(f.options,f.overrides),error=>{
   assert.equal(error.t04ImageMeasurementPhaseOrdinal,3);assert.equal(error.t04ImageMeasureStepOrdinal,29);
   assert.equal(error.t04ImageMeasurePredicateOrdinal,['predicate-both','body-only'].includes(kind)?66:0);
   assert.equal(error.t04ImageMeasureExceptionClassOrdinal,kind==='external-both'?2:kind==='close-only'?3:1);
   assert.equal(error.t04ImageMeasurementCleanupAttempted,1);assert.equal(error.t04ImageMeasurementCleanupFailed,kind==='body-only'?0:1);
   assert(!JSON.stringify(error).includes('PRIVATE'));return true;
  });
  assert.deepEqual([bodyCalls,innerCloses,outerCloses],[1,1,1]);
 }
 let closes=0;assert.equal(await withImageMeasurementContext(async()=>42,async()=>{closes++;},()=>{throw Error('MUST_NOT_CAPTURE');}),42);assert.equal(closes,1);
});
