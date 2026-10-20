// Only fixed ordinals leave private exception objects. Never serialize messages,
// query/params, expected/actual values, URLs, paths or stack text.
export const RUNTIME_ERROR_CODES=Object.freeze(['ERR_MODULE_NOT_FOUND','ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX',
 'ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING','ENOENT','EACCES','ECONNREFUSED','ETIMEDOUT',
 '23502','23503','23505','23514','42501','42601','42703','42883','42P01','42P07','3F000','57P03','57014','53300']);
export function runtimeErrorFacts(error){
 return{errorCodeOrdinal:RUNTIME_ERROR_CODES.indexOf(error?.code)+1,
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
 for(const[k,v]of[['runnerErrors',r.errorCount],['hookErrors',r.hookErrorCount]])if(Number.isSafeInteger(v)&&v>=0&&v<=10000)facts[k]=v;
 return facts;
}
