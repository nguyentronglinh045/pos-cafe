import test from'node:test';import assert from'node:assert/strict';
import{runtimeErrorFacts,safeRuntimeErrorFacts,runtimeErrorLine,runtimeErrorLocation,RUNTIME_ERROR_FILES}from'./permission-runtime-error-facts.mjs';
import{annotateImageHookFailure,runtimeImageHookFailureFacts,safeImageHookFailureFacts,IMAGE_HOOK_DIAGNOSTIC_BOUNDS,
 IMAGE_HOOK_ERROR_CODES,IMAGE_HOOK_STEPS}from'./permission-runtime-error-facts.mjs';
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

import{LEGACY_BROWSER_GUARD_CODES,COMPATIBILITY_ROUTE_GUARD_CODES}from'./permission-runtime-error-facts.mjs';
test('legacy guard ordinals append 28..33 without changing the original 27 structured codes',()=>{
 const old=["ERR_MODULE_NOT_FOUND","ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX","ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING","ENOENT","EACCES","ECONNREFUSED","ETIMEDOUT","23502","23503","23505","23514","42501","42601","42703","42883","42P01","42P07","3F000","57P03","57014","53300","PIN_CHANGE_REQUIRED","EMPLOYEE_SESSION_REQUIRED","INVALID_EMPLOYEE_REQUEST","AUTH_REQUIRED","WRITE_PROTOCOL_UNSUPPORTED","FORBIDDEN"];
 assert.deepEqual(RUNTIME_ERROR_CODES.slice(0,27),old);assert.equal(RUNTIME_ERROR_CODES.length,40);
 for(const[ordinal,code]of old.entries())assert.equal(runtimeErrorFacts({code}).errorCodeOrdinal,ordinal+1);
 for(const[i,code]of LEGACY_BROWSER_GUARD_CODES.entries()){
  assert.equal(runtimeErrorFacts(new Error(code)).errorCodeOrdinal,28+i);
  assert.equal(runtimePlaywrightFailureFacts({message:'Error: '+code}).failureFacts.errorCodeOrdinal,28+i);
  assert.equal(runtimePlaywrightFailureFacts({message:code}).failureFacts.errorCodeOrdinal,28+i);
  assert.deepEqual(safeRuntimeErrorFacts(runtimeErrorFacts(new Error(code))),runtimeErrorFacts(new Error(code)));
 }
});
test('legacy message classification refuses prefix suffix multiline stack header quoted and Received decoys',()=>{
 for(const code of LEGACY_BROWSER_GUARD_CODES){
  for(const message of['PRIVATE '+code,code+' PRIVATE','Error: '+code+' PRIVATE','Error: '+code+'\n',' '+code,code+' ','"'+code+'"','Expected: "'+code+'"','Error\n    at '+code,'Error: Error: '+code,'expect(received).toBe(expected)\nReceived: "'+code+'"']){
   assert.equal(runtimeErrorFacts({message}).errorCodeOrdinal,0);
   const out=runtimePlaywrightFailureFacts({message,stack:'Error: '+code});assert.equal(out.failureFacts.errorCodeOrdinal,0);assert(!JSON.stringify(out).includes('PRIVATE'));
  }
 }
 assert.equal(runtimePlaywrightFailureFacts({message:'Error: UNKNOWN_PRIVATE_GUARD'}).failureFacts.errorCodeOrdinal,0);
});
test('structured known codes keep precedence over exact legacy helper messages',()=>{
 for(const code of LEGACY_BROWSER_GUARD_CODES){
  assert.equal(runtimeErrorFacts({code:'23505',message:code}).errorCodeOrdinal,10);
  assert.equal(runtimePlaywrightFailureFacts({code:'23505',message:'Error: '+code}).failureFacts.errorCodeOrdinal,10);
 }
});

test('compatibility route ordinals append 34..40 and require exact structured provenance',()=>{
 assert.deepEqual(RUNTIME_ERROR_CODES.slice(27,33),LEGACY_BROWSER_GUARD_CODES);
 assert.deepEqual(RUNTIME_ERROR_CODES.slice(33),COMPATIBILITY_ROUTE_GUARD_CODES);
 for(const[i,code]of COMPATIBILITY_ROUTE_GUARD_CODES.entries()){
  const error=Object.assign(new Error('PRIVATE https://private.invalid/?token=SECRET'),{name:'AssertionError',code});
  const facts=runtimeErrorFacts(error);
  assert.deepEqual(facts,{errorCodeOrdinal:34+i,errorNameOrdinal:4,errorMatcherOrdinal:0});
  assert.deepEqual(safeRuntimeErrorFacts(facts),facts);assert(!JSON.stringify(facts).includes('PRIVATE'));
  for(const message of[code,'Error: '+code,'expect(received).toBe(expected)\nReceived: "'+code+'"']){
   assert.equal(runtimeErrorFacts({message}).errorCodeOrdinal,0);
   assert.equal(runtimePlaywrightFailureFacts({message}).failureFacts.errorCodeOrdinal,0);
  }
 }
 assert.equal(runtimeErrorFacts({code:'COMPATIBILITY_ROUTE_8'}).errorCodeOrdinal,0);
 assert.equal(safeRuntimeErrorFacts({errorCodeOrdinal:41,errorNameOrdinal:4,errorMatcherOrdinal:0}),null);
 const item={file:'tests/contracts/permissionCompatibility.contract.test.ts',name:'required',project:null};
 const report={discovery:[item],results:[{...item,state:'failed',failureFacts:{errorCodeOrdinal:40,errorNameOrdinal:4,errorMatcherOrdinal:0}}]};
 assert.equal(runtimeRunnerFailureFacts({stage:'transition-compatibility-database',required:[item]},report).testErrorCodeOrdinal,40);
 assert(!Object.hasOwn(runtimeRunnerFailureFacts({stage:'transition-compatibility-database',required:[item]},{...report,results:[{...report.results[0],failureFacts:{errorCodeOrdinal:41,errorNameOrdinal:4,errorMatcherOrdinal:0}}]}),'testErrorCodeOrdinal'));
});

test('actual Vitest reporter carries a structured compatibility route ordinal without private assertion material',()=>{
 let report;
 const source=readFileSync(new URL('./permission-runtime-vitest-reporter.mjs',import.meta.url),'utf8')
  .replace(/^import[^;]+;[\r\n]*/gm,'').replace('export default class','class');
 const context={runtimeReporterContext:()=>({sourceRoot:'/source'}),reporterFile:(_root,p)=>p.slice('/source/'.length),
  runtimeErrorFacts,runtimeErrorLine,runtimeErrorLocation,fixtureDriftCode:()=>'',FIXTURE_DRIFT_CODES:[],writeRuntimeReport:(_ctx,value)=>{report=value;}};
 runInNewContext(source+'\nthis.Reporter=RuntimeVitestReporter;',context);
 const reporter=new context.Reporter();reporter.onInit();
 const error={name:'AssertionError',code:'COMPATIBILITY_ROUTE_7',message:'PRIVATE',stack:'PRIVATE\n    at test (/source/tests/contracts/permissionCompatibility.contract.test.ts:91:3)'};
 const module={moduleId:'/source/tests/contracts/permissionCompatibility.contract.test.ts',project:{name:''},children:{allTests:()=>[item],allSuites:()=>[]}};
 const item={module,fullName:'required',options:{retry:0,repeats:0},diagnostic:()=>({retryCount:0,repeatCount:0}),result:()=>({state:'failed',errors:[error]})};
 reporter.onTestModuleCollected(module);reporter.onTestRunEnd([module],[],'failed');
 const data=JSON.parse(JSON.stringify(report));
 assert.equal(data.results[0].failureFacts.errorCodeOrdinal,40);assert.equal(data.results[0].failureLine,91);
 assert.equal(data.results[0].attempts,1);assert.equal(data.failureFacts.errorCodeOrdinal,40);
 assert(!JSON.stringify(data).includes('PRIVATE'));
});

test('image hook metadata covers every setup step and keeps a failed cleanup separate from the primary',()=>{
 for(let step=1;step<=IMAGE_HOOK_STEPS.length;step++){
  const primary=Object.assign(new Error('IMAGE_EXPIRED_JWT_FIXTURE_UNAVAILABLE'),{code:'42501',query:'PRIVATE',
   permissionImageJwtSubreasonOrdinal:4,permissionImageJwtAlgorithmOrdinal:2});
  assert.equal(annotateImageHookFailure(primary,step),primary);
  const cleanup=Object.assign(new TypeError('PRIVATE cleanup'),{token:'PRIVATE'});
  assert.equal(annotateImageHookFailure(cleanup,step,primary,true),cleanup);
  const facts=runtimeImageHookFailureFacts(cleanup);
  assert.equal(facts.imageHookStepOrdinal,step);assert.equal(facts.imageHookCleanupFailed,1);
  assert.equal(facts.imageHookErrorOrdinal,IMAGE_HOOK_ERROR_CODES.indexOf(primary.message)+1);
  assert.equal(facts.imageHookPrimaryErrorCodeOrdinal,RUNTIME_ERROR_CODES.indexOf('42501')+1);
  assert.equal(facts.imageHookPrimaryErrorNameOrdinal,1);assert.equal(facts.imageJwtSubreasonOrdinal,4);
  assert.equal(facts.imageJwtAlgorithmOrdinal,2);assert(!JSON.stringify(facts).includes('PRIVATE'));
 }
 for(const message of['PRIVATE IMAGE_EXPIRED_JWT_FIXTURE_UNAVAILABLE','IMAGE_EXPIRED_JWT_FIXTURE_UNAVAILABLE PRIVATE',
  'IMAGE_EXPIRED_JWT_FIXTURE_UNAVAILABLE\n','Error: IMAGE_EXPIRED_JWT_FIXTURE_UNAVAILABLE'])
  assert.equal(runtimeImageHookFailureFacts(new Error(message)).imageHookErrorOrdinal,0);
 assert.equal(runtimeImageHookFailureFacts(annotateImageHookFailure('PRIVATE',99)).imageHookStepOrdinal,0);
 const unknown=annotateImageHookFailure(new Error('PRIVATE primary'),2);
 const knownCleanup=annotateImageHookFailure(new Error('IMAGE_FIXTURE_MARKER_REFUSED'),2,unknown,true);
 assert.equal(runtimeImageHookFailureFacts(knownCleanup).imageHookErrorOrdinal,0);
 assert.equal(runtimeImageHookFailureFacts(knownCleanup).imageHookCleanupFailed,1);
 const baseline=runtimeImageHookFailureFacts(undefined);assert.deepEqual(safeImageHookFailureFacts(baseline),baseline);
 for(const[key,max]of Object.entries(IMAGE_HOOK_DIAGNOSTIC_BOUNDS))for(const value of[-1,max+1,0.5,'1',null]){
  assert.equal(safeImageHookFailureFacts({...baseline,[key]:value}),null);
  const projected=runtimeImageHookFailureFacts({['permission'+key[0].toUpperCase()+key.slice(1)]:value});
  assert.equal(projected[key],0);
 }
 assert.equal(safeImageHookFailureFacts({...baseline,raw:'PRIVATE'}),null);
});

test('image locations append fixed file ordinals and reject unrelated or malformed paths',()=>{
 assert.equal(RUNTIME_ERROR_FILES.length,11);
 for(const[file,index]of[['tests/contracts/permissionImagesFixture.ts',10],['tests/contracts/permissionImagesRuntime.contract.test.ts',11]]){
  assert.deepEqual(runtimeErrorLocation({stack:'PRIVATE\n    at hook (/source/'+file+':260:4)'},'/source'),{fileOrdinal:index,line:260});
  assert.deepEqual(runtimeErrorLocation({stack:'PRIVATE\n    at hook (/other/'+file+':260:4)'},'/source'),{fileOrdinal:0,line:0});
 }
});

import ts from'typescript';import{createHmac,generateKeyPairSync,sign as cryptoSign,verify as cryptoVerify}from'node:crypto';
test('the actual expired-JWT helper validates HS256 ES256 RS256 sources and mints an HS256 pair with only expiry different',async()=>{
 const source=readFileSync(new URL('../tests/contracts/permissionImagesFixture.ts',import.meta.url),'utf8');
 const start=source.indexOf('export async function expiredImageStoreJwt()'),end=source.indexOf('\nasync function restoreCompatibility',start);
 assert(start>=0&&end>start);
 const code=ts.transpileModule(source.slice(start,end).replace('export async function','async function'),
  {compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
 const key='SYNTHETIC_PRIVATE_KEY_MUST_NOT_LEAK_123456789',now=1792771200,storeId='10000000-0000-4000-8000-000000000001';
 const ec=generateKeyPairSync('ec',{namedCurve:'prime256v1'}),rsa=generateKeyPairSync('rsa',{modulusLength:2048});
 const claims={sub:storeId,role:'authenticated',aud:'authenticated',exp:now+3600,iat:now-30,
  privateClaim:'SYNTHETIC_PRIVATE_CLAIM'};
 const encode=value=>Buffer.from(JSON.stringify(value)).toString('base64url');
 const signed=(header={alg:'HS256',typ:'JWT',kid:'SYNTHETIC_PRIVATE_KID'},payload=encode(claims))=>{
  const input=encode(header)+'.'+payload;
  const signature=header.alg==='ES256'?cryptoSign('sha256',Buffer.from(input),{key:ec.privateKey,dsaEncoding:'ieee-p1363'}).toString('base64url'):
   header.alg==='RS256'?cryptoSign('sha256',Buffer.from(input),rsa.privateKey).toString('base64url'):
   createHmac('sha256',key).update(input).digest('base64url');
  return input+'.'+signature;
 };
 const authenticated=async(url,options)=>{
  assert.equal(url,'http://127.0.0.1:62421/auth/v1/user');assert.equal(options.method,'GET');assert.equal(options.redirect,'error');
  assert.deepEqual(JSON.parse(JSON.stringify(options.headers)),{apikey:'SYNTHETIC_ANON_KEY',Authorization:options.headers.Authorization});
  assert(options.signal instanceof AbortSignal);assert(!JSON.stringify(options.headers).includes(key));
  const parts=options.headers.Authorization.slice(7).split('.');
  const[header,payload,signature]=parts,algorithm=JSON.parse(Buffer.from(header,'base64url')).alg;
  const input=header+'.'+payload;
  const valid=parts.length===3&&(algorithm==='HS256'?createHmac('sha256',key).update(input).digest('base64url')===signature:
   cryptoVerify('sha256',Buffer.from(input),algorithm==='ES256'?{key:ec.publicKey,dsaEncoding:'ieee-p1363'}:rsa.publicKey,Buffer.from(signature,'base64url')));
  return{ok:valid,status:valid?200:401,json:async()=>({id:storeId})};
 };
 const invoke=async({token=signed(),read=()=>key,hmac=createHmac,auth=authenticated}={})=>{
  const context={baselineReady:true,verifyMarker:async()=>{},PROJECT:'synthetic-only',process:{platform:'linux'},
   execFileSync:(command,args,options)=>{
    assert.equal(command,'docker');assert.deepEqual(JSON.parse(JSON.stringify(args)),['exec','supabase_auth_synthetic-only','printenv','GOTRUE_JWT_SECRET']);
    assert.equal(options.timeout,5000);assert.equal(options.maxBuffer,512);return read();
   },env:{storeJwt:token,api:'http://127.0.0.1:62421',anonKey:'SYNTHETIC_ANON_KEY'},STORE_IDS:[storeId],
   Buffer,createHmac:hmac,Date:{now:()=>now*1000},AbortSignal:{timeout:ms=>{assert.equal(ms,5000);return AbortSignal.timeout(ms);}},fetch:auth,runtimeErrorFacts};
  runInNewContext(code+'\nthis.invoke=expiredImageStoreJwt;',context);return context.invoke();
 };
 for(const alg of['HS256','ES256','RS256']){
  const token=signed({alg,typ:'JWT',kid:'SYNTHETIC_PRIVATE_KID'});let authCalls=0;
  const success=await invoke({token,auth:async(url,options)=>{authCalls++;assert.equal(options.headers.Authorization,'Bearer '+token);return authenticated(url,options);}});
  assert.equal(authCalls,1);
  const decoded={};
  for(const[name,delta]of[['validJwt',3600],['expiredJwt',-3600]]){
   const[header,payload,signature]=success[name].split('.');decoded[name]=JSON.parse(Buffer.from(payload,'base64url'));
   assert.deepEqual(JSON.parse(Buffer.from(header,'base64url')),{alg:'HS256',typ:'JWT'});
   assert.equal(decoded[name].sub,storeId);assert.equal(decoded[name].exp,now+delta);assert.equal(decoded[name].iat,now-7200);
   assert.equal(decoded[name].privateClaim,claims.privateClaim);
   assert.equal(createHmac('sha256',key).update(header+'.'+payload).digest('base64url'),signature);
  }
  const withoutExpiry=value=>Object.fromEntries(Object.entries(value).filter(([key])=>key!=='exp'));
  assert.deepEqual(withoutExpiry(decoded.validJwt),withoutExpiry(decoded.expiredJwt));
  assert.deepEqual(withoutExpiry(decoded.validJwt),withoutExpiry({...claims,iat:now-7200}));
 }
 let calls=0;
 for(const[options,reason,algorithm,status=0,cause=0]of[
  [{read:()=>{throw Object.assign(Error('SYNTHETIC_PRIVATE_READ'),{code:'ENOENT'});}},1,0,0,4],
  [{read:()=>''},2,0],
  [{read:()=>key.repeat(10)},2,0],
  [{token:'not-json.payload.signature'},3,0],
  [{token:signed({alg:'PRIVATE_UNKNOWN_ALGORITHM'})},4,4],
  [{token:signed().split('.').slice(0,2).join('.')+'.PRIVATE'},5,1],
  [{token:signed({},'not-json')},4,0],
  [{token:signed({alg:'HS256'},'not-json')},6,1],
  ...[{sub:'other-store'},{role:'service_role'},{aud:['authenticated']},{aud:'anon'}].map(delta=>[{token:signed({alg:'HS256'},encode({...claims,...delta}))},7,1]),
  [{token:signed({alg:'ES256'}).split('.').slice(0,2).join('.')+'.'+Buffer.alloc(64).toString('base64url')},8,2,401],
  [{token:signed()+'.PRIVATE'},8,1,401],
  [{auth:async()=>({ok:false,status:500})},8,1,500],
  [{auth:async()=>({ok:true,status:200,json:async()=>({id:'other-store'})})},8,1,200],
  [{auth:async()=>({ok:true,status:200,json:async()=>{throw Error('PRIVATE JSON');}})},8,1,200],
  [{auth:async()=>{throw Object.assign(Error('PRIVATE TRANSPORT'),{code:'ETIMEDOUT'});}},8,1,0,7],
  [{hmac:(...args)=>{if(++calls>1)throw Error('SYNTHETIC_PRIVATE_SIGN');return createHmac(...args);}},9,1,200],
 ]){
  await assert.rejects(invoke(options),error=>{
   assert.equal(error.message,'IMAGE_EXPIRED_JWT_FIXTURE_UNAVAILABLE');
   const facts=runtimeImageHookFailureFacts(error);assert.equal(facts.imageJwtSubreasonOrdinal,reason);
   assert.equal(facts.imageJwtAlgorithmOrdinal,algorithm);assert.equal(facts.imageJwtAuthStatus,status);
   assert.equal(facts.imageJwtCauseErrorCodeOrdinal,cause);
   for(const secret of[key,options.token,'SYNTHETIC_PRIVATE_CLAIM','SYNTHETIC_PRIVATE_READ','PRIVATE_UNKNOWN_ALGORITHM'])
    if(secret)assert(!JSON.stringify(facts).includes(secret));
   return true;
  });
 }
});
