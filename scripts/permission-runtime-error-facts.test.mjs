import test from'node:test';import assert from'node:assert/strict';
import{runtimeErrorFacts,safeRuntimeErrorFacts,runtimeErrorLine,runtimeErrorLocation,RUNTIME_ERROR_FILES}from'./permission-runtime-error-facts.mjs';
test('runtime error projection keeps only known code/name/matcher ordinals, never private exception fields',()=>{
 const a=runtimeErrorFacts({name:'AssertionError',code:'23505',message:'SECRET',query:'SECRET',stack:'SECRET',
  matcherResult:{name:'toBe',actual:'SECRET',expected:'SECRET'}});
 assert(a.errorCodeOrdinal>0);assert.equal(a.errorNameOrdinal,4);assert.equal(a.errorMatcherOrdinal,1);
 assert.equal(JSON.stringify(a).includes('SECRET'),false);assert.deepEqual(safeRuntimeErrorFacts(a),a);
 assert.deepEqual(runtimeErrorFacts({name:'SECRET',code:'SECRET',matcherResult:{name:'SECRET'}}),{errorCodeOrdinal:0,errorNameOrdinal:0,errorMatcherOrdinal:0});
 for(const delta of[{raw:'SECRET'},{errorCodeOrdinal:99},{errorNameOrdinal:-1},{errorMatcherOrdinal:1.1}])assert.equal(safeRuntimeErrorFacts({...a,...delta}),null);
});
test('hook origin only projects a fixed source-file ordinal and line, including Windows paths',()=>{
 const root='/owned/source',file=root+'/'+RUNTIME_ERROR_FILES[0];
 assert.deepEqual(runtimeErrorLocation({stack:'Error: SECRET\n    at setup ('+file+':41:9)'},root),{fileOrdinal:1,line:41});
 assert.deepEqual(runtimeErrorLocation({stack:'Error\n    at D:\\owned\\source\\'+RUNTIME_ERROR_FILES[0].replaceAll('/','\\')+':99:1'},'D:\\owned\\source'),{fileOrdinal:1,line:99});
 for(const stack of['SECRET','Error\n    at /other/source/'+RUNTIME_ERROR_FILES[0]+':41:9','Error\n    at '+file+':100001:1'])
  assert.deepEqual(runtimeErrorLocation({stack},root),{fileOrdinal:0,line:0});
});
test('failure location projects only a bounded line from the exact current test file, never another path or stack payload',()=>{
 const file='/owned/tests/example[1].test.ts';
 assert.equal(runtimeErrorLine({stack:'SECRET\n    at test ('+file+':184:22)'},file),184);
 assert.equal(runtimeErrorLine({stack:'Error\n    at file://'+file+':99:1'},file),99);
 assert.equal(runtimeErrorLine({stack:'Error\n    at D:\\owned\\tests\\test.ts:123:2'},'D:\\owned\\tests\\test.ts'),123);
 assert.equal(runtimeErrorLine({stack:'AssertionError: '+file+':42:1\n    at test ('+file+':184:22)'},file),184);
 for(const stack of['SECRET','AssertionError: '+file+':42:1','Error\n"    at '+file+':42:1"',
  'Error\n    at /other/tests/example[1].test.ts:1:1','Error\n    at '+file+':0:1','Error\n    at '+file+':100001:1','Error\n    at '+file+':184:1'+'x'.repeat(65536)])
  assert.equal(runtimeErrorLine({stack},file),0);
});

import{readFileSync}from'node:fs';import{runInNewContext}from'node:vm';
import{runtimePlaywrightFailureFacts,REALTIME_FAILURE_ORACLES,runtimeRunnerFailureFacts}from'./permission-runtime-error-facts.mjs';

test('Playwright error location is bounded and bound to the exact selected test file, with stack fallback',()=>{
 const file='D:\\owned\\test.spec.ts',stack='Error\n    at test (D:\\owned\\test.spec.ts:71:4)';
 assert.equal(runtimePlaywrightFailureFacts({location:{file:'D:/owned/test.spec.ts',line:88},stack},file).failureLine,88);
 for(const location of[{file:'/other/private.spec.ts',line:88},{file,line:0},{file,line:100001},{file,line:1.5}])
  assert.equal(runtimePlaywrightFailureFacts({location,stack},file).failureLine,71);
 assert.equal(runtimePlaywrightFailureFacts({location:{file:'/other/private.spec.ts',line:88}},file).failureLine,0);
});
test('Realtime error messages yield only the ten fixed oracle bits, never raw payloads, paths or signed URLs',()=>{
 const message=REALTIME_FAILURE_ORACLES.map(x=>'REALTIME_TIMING_ORACLE_FAILED:'+x).join('\n')+' SECRET https://private.invalid/?signed=SECRET';
 const out=runtimePlaywrightFailureFacts({message,stack:'SECRET',location:{file:'SECRET',line:44}},'/selected');
 assert.equal(out.realtimeFailureMask,1023);assert.equal(out.failureLine,0);assert(!JSON.stringify(out).includes('SECRET'));
 assert.equal(runtimePlaywrightFailureFacts({message:'\x1b[31mREALTIME_TIMING_ORACLE_FAILED:signal-arrival\x1b[0m'}).realtimeFailureMask,1);
 for(const message of['REALTIME_TIMING_ORACLE_FAILED:signal-arrival-private','REALTIME_TIMING_ORACLE_FAILED:unknown', 'x'.repeat(65537)+' REALTIME_TIMING_ORACLE_FAILED:signal-arrival'])
  assert(!Object.hasOwn(runtimePlaywrightFailureFacts({message}),'realtimeFailureMask'));
});
test('Realtime bitmask projects only from the failed required canonical stage and refuses out-of-range private values',()=>{
 const item={file:'tests/supabase/permissionRealtime.spec.ts',name:'TC55',project:'p'},expected={stage:'realtime-e2e',required:[item]};
 const r={discovery:[item],results:[{...item,state:'failed',realtimeFailureMask:3}],errorCount:0,hookErrorCount:0};
 assert.equal(runtimeRunnerFailureFacts(expected,r).realtimeFailureMask,3);
 assert(!Object.hasOwn(runtimeRunnerFailureFacts({...expected,stage:'other'},r),'realtimeFailureMask'));
 for(const value of[-1,1024,1.5,'1'])assert.throws(()=>runtimeRunnerFailureFacts(expected,{...r,results:[{...r.results[0],realtimeFailureMask:value}]}));
});
test('actual Playwright reporter adapter preserves statuses/attempts/discovery while exporting only finite failure facts',()=>{
 let report;const source=readFileSync(new URL('./permission-runtime-playwright-reporter.mjs',import.meta.url),'utf8')
  .replace(/^import[^;]+;[\r\n]*/gm,'').replace('export default class','class');
 const context={runtimeReporterContext:()=>({sourceRoot:'/source'}),reporterFile:(_root,p)=>p,runtimePlaywrightFailureFacts,writeRuntimeReport:(_ctx,value)=>{report=value;}};
 runInNewContext(source+'\nthis.Reporter=RuntimePlaywrightReporter;',context);const reporter=new context.Reporter();
 const t={location:{file:'/source/test.spec.ts'},titlePath:()=>['a','b','c','required'],title:'required',retries:1,expectedStatus:'passed',annotations:[],parent:{project:()=>({name:'p',repeatEach:1})}};
 reporter.onBegin({repeatEach:1},{allTests:()=>[t]});
 reporter.onTestEnd(t,{status:'failed',error:{message:'SECRET REALTIME_TIMING_ORACLE_FAILED:signal-arrival',location:{file:t.location.file,line:42}}});
 reporter.onTestEnd(t,{status:'passed'});reporter.onEnd({status:'passed'});
 const data=JSON.parse(JSON.stringify(report));assert.equal(data.results[0].state,'passed');assert.equal(data.results[0].attempts,2);assert.equal(data.discovery[0].retry,1);
 assert.equal(data.failureLine,42);assert.equal(data.realtimeFailureMask,1);assert(!JSON.stringify(data).includes('SECRET'));
 const okay=new context.Reporter();okay.onBegin({repeatEach:1},{allTests:()=>[t]});okay.onTestEnd(t,{status:'passed'});okay.onEnd({status:'passed'});
 assert(!Object.hasOwn(report,'failureFacts'));assert(!Object.hasOwn(report.results[0],'failureLine'));
});

import{RUNTIME_ERROR_CODES}from'./permission-runtime-error-facts.mjs';
test('serialized Playwright Received code and matcher project only existing finite categories, never Expected or raw values',()=>{
 const out=runtimePlaywrightFailureFacts({message:'SECRET\nexpect(received).toBe(expected)\nExpected: "PIN_CHANGE_REQUIRED"\nReceived: "EMPLOYEE_SESSION_REQUIRED"'});
 assert.equal(out.failureFacts.errorCodeOrdinal,RUNTIME_ERROR_CODES.indexOf('EMPLOYEE_SESSION_REQUIRED')+1);assert.equal(out.failureFacts.errorMatcherOrdinal,1);assert(!JSON.stringify(out).includes('SECRET'));
 for(const message of['Expected: "PIN_CHANGE_REQUIRED"\nReceived: "SECRET"','Received: "PIN_CHANGE_REQUIRED"\nReceived: "EMPLOYEE_SESSION_REQUIRED"','x'.repeat(65537)+'\nReceived: "PIN_CHANGE_REQUIRED"'])
  assert.equal(runtimePlaywrightFailureFacts({message}).failureFacts.errorCodeOrdinal,0);
});
test('a structured known error code and matcher keep precedence over serialized assertion text',()=>{
 const out=runtimePlaywrightFailureFacts({code:'23505',matcherResult:{name:'toEqual'},message:'expect(received).toBe(expected)\nReceived: "EMPLOYEE_SESSION_REQUIRED"'});
 assert.equal(out.failureFacts.errorCodeOrdinal,RUNTIME_ERROR_CODES.indexOf('23505')+1);assert.equal(out.failureFacts.errorMatcherOrdinal,2);
});

test('serialized Received provenance refuses header decoys, unknown actuals, duplicate fields and trailing payloads',()=>{
 const header='expect(received).toBe(expected)\nExpected: "PIN_CHANGE_REQUIRED"\n';
 for(const message of[
  'Received: "PIN_CHANGE_REQUIRED"\n'+header+'Received: "actual-private-value"',
  header+'Received: "EMPLOYEE_SESSION_REQUIRED"\nReceived: "private-lowercase"',
  header+'Received: "EMPLOYEE_SESSION_REQUIRED"\nReceived: "EMPLOYEE_SESSION_REQUIRED"',
  header+'Received: "EMPLOYEE_SESSION_REQUIRED" private-suffix',
  header+'Received: "EMPLOYEE_SESSION_REQUIRED"\nReceived: {private: true}',
  header+'Received: "EMPLOYEE_SESSION_REQUIRED"\n'+header+'Received: "EMPLOYEE_SESSION_REQUIRED"',
  'Received: "EMPLOYEE_SESSION_REQUIRED"'
 ])assert.equal(runtimePlaywrightFailureFacts({message}).failureFacts.errorCodeOrdinal,0);
 const positive=runtimePlaywrightFailureFacts({message:'Received: "PIN_CHANGE_REQUIRED"\n'+header+'  Received: "EMPLOYEE_SESSION_REQUIRED"  '});
 assert.equal(positive.failureFacts.errorCodeOrdinal,RUNTIME_ERROR_CODES.indexOf('EMPLOYEE_SESSION_REQUIRED')+1);
 assert.equal(positive.failureFacts.errorMatcherOrdinal,1);
});

test('Realtime first failure ordinal binds only fixed scenario/device/oracle labels and stays absent outside its canonical stage',()=>{
 for(const[label,device,oracle,ordinal]of[['cycle-1-grant',0,'signal-arrival',1],['global-catalog-revoke',0,'signal-and-apply-records',424],['restored-signal-revoke',1,'signal-apply-budget-5s',480]]){
  const out=runtimePlaywrightFailureFacts({message:label+'/device'+device+': REALTIME_TIMING_ORACLE_FAILED:'+oracle});assert.equal(out.realtimeFirstFailureOrdinal,ordinal);
 }
 for(const message of['private-cycle-1-grant/device0: REALTIME_TIMING_ORACLE_FAILED:signal-arrival','cycle-11-grant/device0: REALTIME_TIMING_ORACLE_FAILED:signal-arrival','cycle-1-grant/device2: REALTIME_TIMING_ORACLE_FAILED:signal-arrival','cycle-1-grant/device0: REALTIME_TIMING_ORACLE_FAILED:private'])assert(!Object.hasOwn(runtimePlaywrightFailureFacts({message}),'realtimeFirstFailureOrdinal'));
 const item={file:'test.ts',name:'required',project:null},r={discovery:[item],results:[{...item,state:'failed',realtimeFirstFailureOrdinal:480}]};
 assert.equal(runtimeRunnerFailureFacts({stage:'realtime-e2e',required:[item]},r).realtimeFirstFailureOrdinal,480);
 assert(!Object.hasOwn(runtimeRunnerFailureFacts({stage:'other',required:[item]},r),'realtimeFirstFailureOrdinal'));
 for(const value of[-1,481,1.5,'1'])assert.throws(()=>runtimeRunnerFailureFacts({stage:'realtime-e2e',required:[item]},{...r,results:[{...r.results[0],realtimeFirstFailureOrdinal:value}]}));
});
