// Pure controls only. Constructed observations are never backend evidence.
import test from 'node:test';
import assert from 'node:assert/strict';
import {runT04ImageMeasurement,validateT04ImageMeasurement,IMAGE_OBSERVATION_KEYS,
 IMAGE_RESTORATION_KEYS,T04_IMAGE_MEASUREMENT_FIELDS} from './permission-t04-image-measurement.mjs';

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
