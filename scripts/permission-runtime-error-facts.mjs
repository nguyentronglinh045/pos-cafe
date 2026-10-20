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
