import test from'node:test';import assert from'node:assert/strict';
import{mkdtempSync,mkdirSync,writeFileSync,statSync,chmodSync,rmSync,linkSync}from'node:fs';import{tmpdir}from'node:os';import{join}from'node:path';
import{TC18_WRAPPER_CODES,projectTc18WrapperReceipt,readTc18WrapperReceipt}from'./permission-runtime-tc18-diagnostic.mjs';
const binding={stage:'pin-tc18-wrapper',sourceSHA:'a'.repeat(40),sourceFingerprint:'b'.repeat(64),lockSHA:'c'.repeat(64),configSHA:'d'.repeat(64),runId:'12345',invocationSHA:'e'.repeat(64)};
const base=()=>({startedUtc:'2026-10-20T17:00:00.000Z',endedUtc:'2026-10-20T17:01:00.000Z',controlDeleted:true,runtimeBinding:{...binding}});
const failure=code=>({...base(),status:'FAIL',code});
test('exact wrapper whitelist exports only fixed ordinal with bound control-deleted status',()=>{
 for(const[at,code]of TC18_WRAPPER_CODES.entries()){
  const p=projectTc18WrapperReceipt(failure(code),binding);assert.deepEqual(p,{serviceTc18ReceiptObserved:1,serviceTc18WrapperStatus:2,serviceTc18WrapperCodeOrdinal:at+1,serviceTc18ControlDeleted:1});
  assert(!JSON.stringify(p).includes(code));
 }
 const p=projectTc18WrapperReceipt({...failure(TC18_WRAPPER_CODES[0]),controlDeleted:false},binding);assert.equal(p.serviceTc18ControlDeleted,2);
});
test('unknown codes and private prefix payloads never export raw content or become valid receipts',()=>{
 for(const code of['PIN_CANARY_PRIVATE_123456','CANARY_LEAK_artifact PRIVATE',null,{},'']){
  const p=projectTc18WrapperReceipt(failure(code),binding);assert.equal(p.serviceTc18ReceiptObserved,2);assert.equal(p.serviceTc18WrapperCodeOrdinal,0);assert(!JSON.stringify(p).includes('PRIVATE'));
 }
});
test('stale source/run/invocation, malformed binding, timestamps and extra payloads are refused',()=>{
 for(const[key,value]of Object.entries(binding)){
  const r=failure(TC18_WRAPPER_CODES[0]);r.runtimeBinding[key]=value==='12345'?'54321':key==='stage'?'other':'f'.repeat(value.length);
  assert.equal(projectTc18WrapperReceipt(r,binding).serviceTc18ReceiptObserved,2);
 }
 for(const r of[null,{}, {...failure(TC18_WRAPPER_CODES[0]),private:'SECRET'}, {...failure(TC18_WRAPPER_CODES[0]),startedUtc:'invalid'}, {...failure(TC18_WRAPPER_CODES[0]),endedUtc:'2026-10-20T16:00:00.000Z'}])assert.equal(projectTc18WrapperReceipt(r,binding).serviceTc18ReceiptObserved,2);
 assert.throws(()=>projectTc18WrapperReceipt(failure(TC18_WRAPPER_CODES[0]),{...binding,raw:'PRIVATE'}));
});
test('a valid PASS receipt is a finite diagnostic observation and must retain seven bodies and complete scan metadata',()=>{
 const r={...base(),status:'PASS',browser:{total:7,passed:7,retried:0,missing:0},scenarioCount:20,operatorCaptureCount:1,
  artifactScan:{fileCount:1,files:[{path:'PRIVATE',bytes:1,sha256:'f'.repeat(64)}]}};
 const p=projectTc18WrapperReceipt(r,binding);assert.equal(p.serviceTc18WrapperStatus,1);assert.equal(p.serviceTc18WrapperCodeOrdinal,0);assert(!JSON.stringify(p).includes('PRIVATE'));
 for(const change of[x=>x.browser.retried=1,x=>x.scenarioCount=19,x=>x.artifactScan.fileCount=2,x=>x.artifactScan.files[0].bytes=Infinity]){
  const invalid=structuredClone(r);change(invalid);assert.equal(projectTc18WrapperReceipt(invalid,binding).serviceTc18ReceiptObserved,2);
 }
});
test('owned reader enforces exact fresh root, size, regular-file identity and platform permissions',()=>{
 const source=mkdtempSync(join(tmpdir(),'permission-tc18-receipt-')),out=join(source,'artifacts','tc18'),file=join(out,'artifact-scan-safe.json');
 try{
  mkdirSync(out,{recursive:true,mode:0o700});const input={sourceRoot:source.replaceAll('\\','/'),outputRoot:out.replaceAll('\\','/'),device:statSync(source).dev,expected:binding,owner:process.getuid?.()??0};
  assert.notEqual(readTc18WrapperReceipt(input).serviceTc18ReceiptObserved,1);
  writeFileSync(file,JSON.stringify(failure(TC18_WRAPPER_CODES[3])),{mode:0o600});
  const posix=process.platform!=='win32';assert.equal(readTc18WrapperReceipt(input).serviceTc18ReceiptObserved,posix?1:2);
  assert.equal(readTc18WrapperReceipt({...input,outputRoot:source.replaceAll('\\','/')}).serviceTc18ReceiptObserved,2);
  assert.equal(readTc18WrapperReceipt({...input,owner:input.owner+1}).serviceTc18ReceiptObserved,2);
  writeFileSync(file,'{');assert.equal(readTc18WrapperReceipt(input).serviceTc18ReceiptObserved,2);
  writeFileSync(file,' '.repeat(65537));assert.equal(readTc18WrapperReceipt(input).serviceTc18ReceiptObserved,2);
  writeFileSync(file,JSON.stringify(failure(TC18_WRAPPER_CODES[0])));chmodSync(file,0o600);
  linkSync(file,join(out,'extra-link'));assert.equal(readTc18WrapperReceipt(input).serviceTc18ReceiptObserved,2);
 }finally{rmSync(source,{recursive:true,force:true});}
});

import{serviceRunnerFailureFacts}from'./permission-runtime-service-diagnostic.mjs';
test('first nonpassed line cannot come from an earlier passed row with the same identity',()=>{
 const one={file:'test.ts',name:'one',project:null};
 const facts=serviceRunnerFailureFacts({stage:'pin-tc18-wrapper',required:[one]},
  {discovery:[one],results:[{...one,state:'passed',attempts:1,failureLine:42},{...one,state:'timedOut',attempts:1,failureLine:77}]});
 assert.equal(facts.serviceTc18FirstNonPassedRequired,1);assert.equal(facts.serviceTc18FirstNonPassedLine,77);
 assert.equal(facts.serviceTc18PassedOnceCount,1);assert.equal(facts.serviceTc18NonPassedCount,1);
});
