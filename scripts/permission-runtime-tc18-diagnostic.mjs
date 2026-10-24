import{readFileSync,lstatSync,realpathSync}from'node:fs';
import{join}from'node:path';

export const TC18_WRAPPER_CODES=Object.freeze(['PIN_CANARY_OUTPUT_UNREADABLE','PIN_CANARY_CONTROL_INCOMPLETE',
 'PIN_CANARY_DENIED_INPUT_MISSING','PIN_CANARY_ARTIFACT_MISSING','PIN_CANARY_BROWSER_FAILED','PIN_CANARY_RUNNER_FAILED',
 'PIN_CANARY_RUN_FAILED','CANARY_ARTIFACT_INPUT_INVALID','CANARY_ARTIFACT_UNREADABLE','CANARY_ARTIFACT_SCAN_LIMIT',
 'CANARY_ARTIFACT_EMPTY','CANARY_ORACLE_SCAN_LIMIT','CANARY_ORACLE_UNREADABLE_VALUE','CANARY_ORACLE_INVALID_INPUT',
 'CANARY_REQUIRED_SINK_MISSING','CANARY_REQUIRED_SINK_NOT_CAPTURED','CANARY_LEAK_artifact']);
const bindingKeys=['stage','sourceSHA','sourceFingerprint','lockSHA','configSHA','runId','invocationSHA'];
const exact=(x,keys)=>!!x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).sort().join(',')===keys.slice().sort().join(',');
const bindingValid=b=>exact(b,bindingKeys)&&b.stage==='pin-tc18-wrapper'&&/^[a-f0-9]{40}$/.test(b.sourceSHA??'')
 &&['sourceFingerprint','lockSHA','configSHA','invocationSHA'].every(k=>/^[a-f0-9]{64}$/.test(b[k]??''))&&/^[1-9][0-9]{0,19}$/.test(b.runId??'');
const invalid=()=>({serviceTc18ReceiptObserved:2,serviceTc18WrapperStatus:0,serviceTc18WrapperCodeOrdinal:0,serviceTc18ControlDeleted:0});
export function projectTc18WrapperReceipt(receipt,expected){
 if(!bindingValid(expected))throw Error('TC18_DIAGNOSTIC_BINDING_REFUSED');
 const fail=receipt?.status==='FAIL',keys=['status','startedUtc','endedUtc','controlDeleted','runtimeBinding',
  ...(fail?['code']:['browser','scenarioCount','operatorCaptureCount','artifactScan'])];
 if(!exact(receipt,keys)||!bindingValid(receipt.runtimeBinding)||bindingKeys.some(k=>receipt.runtimeBinding[k]!==expected[k])
  ||!['PASS','FAIL'].includes(receipt.status)||typeof receipt.controlDeleted!=='boolean')return invalid();
 const iso=s=>typeof s==='string'&&s.length===24&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString()===s;
 if(!iso(receipt.startedUtc)||!iso(receipt.endedUtc)||receipt.endedUtc<receipt.startedUtc)return invalid();
 const ordinal=fail?TC18_WRAPPER_CODES.indexOf(receipt.code)+1:0;
 if(fail&&!ordinal)return invalid();
 if(!fail){
  const b=receipt.browser,a=receipt.artifactScan;
  if(!exact(b,['total','passed','retried','missing'])||b.total!==7||b.passed!==7||b.retried!==0||b.missing!==0
   ||receipt.scenarioCount!==20||receipt.operatorCaptureCount!==1||!exact(a,['fileCount','files'])
   ||!Number.isInteger(a.fileCount)||a.fileCount<1||a.fileCount>1000||!Array.isArray(a.files)||a.files.length!==a.fileCount)return invalid();
  for(const f of a.files)if(!exact(f,['path','bytes','sha256'])||typeof f.path!=='string'||!f.path||f.path.length>4096
   ||!Number.isSafeInteger(f.bytes)||f.bytes<0||f.bytes>64*1024**2||!/^[a-f0-9]{64}$/.test(f.sha256??''))return invalid();
 }
 return{serviceTc18ReceiptObserved:1,serviceTc18WrapperStatus:fail?2:1,serviceTc18WrapperCodeOrdinal:ordinal,
  serviceTc18ControlDeleted:receipt.controlDeleted?1:2};
}
// The receipt stays private. Only finite projections leave the owned volume.
export function readTc18WrapperReceipt({sourceRoot,outputRoot,device,expected,owner=0}){
 const missing={serviceTc18ReceiptObserved:3,serviceTc18WrapperStatus:0,serviceTc18WrapperCodeOrdinal:0,serviceTc18ControlDeleted:0};
 try{
  if(!outputRoot.startsWith(sourceRoot+'/artifacts/')||realpathSync(outputRoot)!==outputRoot)return invalid();
  const directory=lstatSync(outputRoot);if(!directory.isDirectory()||directory.isSymbolicLink()||directory.dev!==device
   ||directory.uid!==owner||(directory.mode&0o077)!==0)return invalid();
  const path=join(outputRoot,'artifact-scan-safe.json'),s=lstatSync(path,{throwIfNoEntry:false});if(!s)return missing;
  if(!s.isFile()||s.isSymbolicLink()||s.nlink!==1||s.uid!==owner||(s.mode&0o077)!==0||s.dev!==device
   ||s.size<1||s.size>65536||realpathSync(path)!==path)return invalid();
  return projectTc18WrapperReceipt(JSON.parse(readFileSync(path,'utf8')),expected);
 }catch{return invalid();}
}
