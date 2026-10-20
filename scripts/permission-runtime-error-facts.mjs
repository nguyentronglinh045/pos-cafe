// Only fixed ordinals leave private exception objects. Never serialize messages,
// query/params, expected/actual values, URLs, paths or stack text.
// Only exact source-fixed helper messages are eligible; no substring or SQL text.
export const LEGACY_BROWSER_GUARD_CODES=Object.freeze(["LEGACY_BROWSER_FIXTURE_BINDING_MISMATCH","FRESH_LEGACY_BROWSER_FIXTURE_REQUIRED","LEGACY_BROWSER_TENANT_POLICY_REQUIRED","UNEXPECTED_LEGACY_FINANCIAL_GRANT","LEGACY_BROWSER_TABLE_MISSING","LEGACY_BROWSER_READ_GRANT_RESTORE_FAILED"]);
export const RUNTIME_ERROR_CODES=Object.freeze(['ERR_MODULE_NOT_FOUND','ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX',
 'ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING','ENOENT','EACCES','ECONNREFUSED','ETIMEDOUT',
 '23502','23503','23505','23514','42501','42601','42703','42883','42P01','42P07','3F000','57P03','57014','53300','PIN_CHANGE_REQUIRED','EMPLOYEE_SESSION_REQUIRED','INVALID_EMPLOYEE_REQUEST','AUTH_REQUIRED','WRITE_PROTOCOL_UNSUPPORTED','FORBIDDEN',...LEGACY_BROWSER_GUARD_CODES]);
export function runtimeErrorFacts(error){
 const codeOrdinal=RUNTIME_ERROR_CODES.indexOf(error?.code)+1;
 const guardOrdinal=LEGACY_BROWSER_GUARD_CODES.indexOf(error?.message);
 return{errorCodeOrdinal:codeOrdinal||(guardOrdinal>=0?28+guardOrdinal:0),
  errorNameOrdinal:['Error','TypeError','SyntaxError','AssertionError','TimeoutError'].indexOf(error?.name)+1,
  errorMatcherOrdinal:['toBe','toEqual','toStrictEqual','toBeTruthy','toBeFalsy','toContain','toThrow','toBeGreaterThan'].indexOf(error?.matcherResult?.name)+1};
}
export function safeRuntimeErrorFacts(value){
 const ranges={errorCodeOrdinal:RUNTIME_ERROR_CODES.length,errorNameOrdinal:5,errorMatcherOrdinal:8};
 if(!value||Object.keys(value).sort().join(',')!==Object.keys(ranges).sort().join(',')
  ||!Object.entries(ranges).every(([k,max])=>Number.isInteger(value[k])&&value[k]>=0&&value[k]<=max))return null;
 return Object.fromEntries(Object.keys(ranges).map(k=>[k,value[k]]));
}
export function runtimeErrorLine(error,file){
 if(typeof file!=='string'||!file||typeof error?.stack!=='string'||Buffer.byteLength(error.stack)>65536)return 0;
 const path=file.replaceAll('\\','/').replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const match=new RegExp('^\\s+at (?:[^()\\r\\n]+ \\()?(?:file://)?'+path+':([0-9]{1,6}):[0-9]{1,5}\\)?[ \\t]*$','m').exec(error.stack.replaceAll('\\','/'));
 const line=Number(match?.[1]);return Number.isInteger(line)&&line>=1&&line<=100000?line:0;
}

export const RUNTIME_ERROR_FILES=Object.freeze(['tests/contracts/permissionIdentityFixture.ts',
 'scripts/permission-pin-identity-runtime.mjs','scripts/permission-identity-runtime.mjs',
 'tests/contracts/ownerPinServerRuntime.contract.test.ts','tests/contracts/ownerPinServer.contract.test.ts',
 'tests/contracts/preflight.ts','tests/contracts/observerPreflight.ts','scripts/permission-inventory.mjs',
 'scripts/permission-fixture-diagnostics.mjs']);
export function runtimeErrorLocation(error,sourceRoot){
 if(typeof sourceRoot!=='string'||!sourceRoot||/[\r\n\0]/.test(sourceRoot))return{fileOrdinal:0,line:0};
 for(let i=0;i<RUNTIME_ERROR_FILES.length;i++){
  const line=runtimeErrorLine(error,sourceRoot.replace(/[\\/]$/,'')+'/'+RUNTIME_ERROR_FILES[i]);
  if(line)return{fileOrdinal:i+1,line};
 }
 return{fileOrdinal:0,line:0};
}
export function runtimeRunnerFailureFacts(expected,r){
 if(!Array.isArray(expected?.required)||!Array.isArray(r?.discovery)||!Array.isArray(r.results)
  ||[expected.required,r.discovery,r.results].some(a=>a.length>10000))throw Error('RUNTIME_FAILURE_REPORT_REFUSED');
 const key=x=>JSON.stringify([x.file,x.name,x.project??null]),found=new Set(r.discovery.map(key));
 const facts={missingRequired:expected.required.filter(x=>!found.has(key(x))).length,
  firstFailedRequired:expected.required.findIndex(x=>r.results.some(y=>key(y)===key(x)&&y.state==='failed'))+1,
  failedTests:r.results.filter(x=>x.state==='failed').length};
 const first=expected.required[facts.firstFailedRequired-1],result=first&&r.results.find(y=>key(y)===key(first));
 const finite=safeRuntimeErrorFacts(result?.failureFacts);
 if(finite)for(const[k,v]of Object.entries(finite))facts['test'+k[0].toUpperCase()+k.slice(1)]=v;
 if(Number.isSafeInteger(result?.failureLine)&&result.failureLine>=0&&result.failureLine<=100000)facts.firstFailedLine=result.failureLine;
 if(expected.stage==='realtime-e2e')for(const[key,max]of[['realtimeFailureMask',1023],['realtimeFirstFailureOrdinal',480]])if(Object.hasOwn(result??{},key)){
  const value=result[key];if(!Number.isSafeInteger(value)||value<0||value>max)throw Error('RUNTIME_FAILURE_REPORT_REFUSED');facts[key]=value;
 }
 for(const[k,v]of[['runnerErrors',r.errorCount],['hookErrors',r.hookErrorCount]])if(Number.isSafeInteger(v)&&v>=0&&v<=10000)facts[k]=v;
 return facts;
}

// Fixed labels already emitted by the existing TC55 timing assertion. Raw
// error message/location/stack never enter the private runner report.
export const REALTIME_FAILURE_ORACLES=Object.freeze(['signal-arrival','dom-apply','foreground-online',
 'signal-and-apply-records','no-resume-during-measurement','revision-authority-chain','chain-budget-5s',
 'fallback-poll-budget-30s','fallback-apply-budget-35s','signal-apply-budget-5s']);
export const REALTIME_FAILURE_SCENARIOS=Object.freeze([...Array.from({length:10},(_,i)=>['cycle-'+(i+1)+'-grant','cycle-'+(i+1)+'-revoke']).flat(),'global-catalog-grant','global-catalog-revoke','lost-signal-grant','restored-signal-revoke']);
export function runtimePlaywrightFailureFacts(error,file){
 let failureLine=runtimeErrorLine(error,file);const location=error?.location;
 if(typeof file==='string'&&typeof location?.file==='string'&&location.file.replaceAll('\\','/')===file.replaceAll('\\','/')
  &&Number.isSafeInteger(location.line)&&location.line>=1&&location.line<=100000)failureLine=location.line;
 const failureFacts=runtimeErrorFacts(error);let realtimeFailureMask=0,realtimeFirstFailureOrdinal=0;
 if(typeof error?.message==='string'&&Buffer.byteLength(error.message)<=65536){
  const message=error.message.replace(/\x1b\[[0-9;]*m/g,'');
  // Playwright 1.60 serializes plain Error.message as exactly Error: <literal>.
  const guardOrdinal=LEGACY_BROWSER_GUARD_CODES.findIndex(code=>message==='Error: '+code||message===code);
  if(failureFacts.errorCodeOrdinal===0&&guardOrdinal>=0)failureFacts.errorCodeOrdinal=28+guardOrdinal;
  // First fixed scenario/device/oracle combination: 24 * 2 * 10 = 480.
  for(const m of message.matchAll(/(?:^|[\s'"\[,])(cycle-(?:10|[1-9])-(?:grant|revoke)|global-catalog-(?:grant|revoke)|lost-signal-grant|restored-signal-revoke)\/device([01]): REALTIME_TIMING_ORACLE_FAILED:([a-z0-9-]{1,64})(?=$|[\s'"\],.])/g)){
   const phase=REALTIME_FAILURE_SCENARIOS.indexOf(m[1]),oracle=REALTIME_FAILURE_ORACLES.indexOf(m[3]);
   if(phase>=0&&oracle>=0){realtimeFirstFailureOrdinal=(phase*2+Number(m[2]))*10+oracle+1;break;}
  }
  // These are serialized assertion literals, not an invented JS error.code.
  // Classify exactly one complete Received scalar after a single matcher
  // header. Count every Received field before whitelisting: unknown values,
  // duplicate fields and trailing payloads must never select a header code.
  const matchers=[...message.matchAll(/\bexpect\(received\)(?:\.not)?\.(toBe|toEqual|toStrictEqual|toBeTruthy|toBeFalsy|toContain|toThrow|toBeGreaterThan)\(expected\)/g)];
  const matcher=matchers.length===1?matchers[0]:null;
  const received=matcher?message.slice(matcher.index+matcher[0].length).split(/\r?\n/).filter(line=>/^[\t ]*Received:/.test(line)):[];
  const scalar=received.length===1?/^[\t ]*Received:[\t ]*"([A-Z][A-Z0-9_]{0,63})"[\t ]*$/.exec(received[0]):null;
  if(failureFacts.errorCodeOrdinal===0&&scalar)failureFacts.errorCodeOrdinal=RUNTIME_ERROR_CODES.slice(0,27).indexOf(scalar[1])+1;
  if(failureFacts.errorMatcherOrdinal===0&&matcher)failureFacts.errorMatcherOrdinal=['toBe','toEqual','toStrictEqual','toBeTruthy','toBeFalsy','toContain','toThrow','toBeGreaterThan'].indexOf(matcher[1])+1;
  for(const m of message.matchAll(/REALTIME_TIMING_ORACLE_FAILED:([a-z0-9-]{1,64})(?=$|[\s'"\],.])/g)){
   const ordinal=REALTIME_FAILURE_ORACLES.indexOf(m[1]);if(ordinal>=0)realtimeFailureMask|=2**ordinal;
  }
 }
 return{failureFacts,failureLine,...(realtimeFailureMask?{realtimeFailureMask}:{}),...(realtimeFirstFailureOrdinal?{realtimeFirstFailureOrdinal}:{})};
}
