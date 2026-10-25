// Local fault controls only. No database, network or browser effects. These
// failures exercise the real helper sanitizer and cannot create runtime PASS.
import {runT04ImageMeasurement,createImageMeasurementDiagnostics,IMAGE_OBSERVATION_KEYS,
 IMAGE_RESTORATION_KEYS,imageFailureFacts} from './permission-t04-image-measurement.mjs';
export async function imageMeasurementFailureControl(kind='predicate-cleanup'){
 if(!['predicate','predicate-cleanup','external','warm-cleanup'].includes(kind))throw Error('IMAGE_CONTROL_REFUSED');
 const epoch=1792717200000,digest='b'.repeat(64),stores=['10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002'];
 const binding={sourceSHA:'a'.repeat(40),sourceFingerprint:digest,lockSHA:digest,runId:'123',attempt:1,physicalBackendSHA:digest};
 const jwt=(role,sub)=>[Buffer.from('{}').toString('base64url'),Buffer.from(JSON.stringify({role,exp:Math.floor(epoch/1000)+3600,...(sub?{sub}:{})})).toString('base64url'),'signature'].join('.');
 const observations=Object.fromEntries(IMAGE_OBSERVATION_KEYS.map(key=>[key,true]));observations.cache60Denied=false;observations.cache61Denied=false;
 const progress=createImageMeasurementDiagnostics(observations);let closed=0;
 const options={root:'/unit/synthetic',guard(){},deadline:epoch+225001,api:'http://127.0.0.1:62421',storeIds:stores,
  employeeId:'20000000-0000-4000-8000-000000000001',db:{query(){throw Error('IMAGE_CONTROL_DB_FORBIDDEN');}},
  anonKey:jwt('anon'),storeJwt:jwt('authenticated',stores[0]),serviceKey:jwt('service_role'),binding,physical:async()=>digest};
 const overrides={now:()=>epoch,monotonic:()=>0,sourceFacts:()=>({sourceSHA:binding.sourceSHA,sourceFingerprint:digest,lockSHA:digest}),
  effects:async()=>({measure:async()=>{
   try{progress.step(kind==='external'?7:kind==='warm-cleanup'?28:31);
    if(kind==='warm-cleanup'){progress.warm(200,false,true);progress.check(false,65);}
    if(kind==='external')throw TypeError('PRIVATE_IMAGE_CONTROL_URL_TOKEN_SQL');
    progress.timing(60,59999);progress.check(false,67);
   }catch(error){throw progress.capture(error);}
  },close:async()=>{closed++;for(const key of IMAGE_OBSERVATION_KEYS)observations[key]=true;progress.step(33);
   if(kind==='predicate-cleanup'||kind==='warm-cleanup')throw Error('PRIVATE_IMAGE_CONTROL_CLEANUP');
   return Object.fromEntries(IMAGE_RESTORATION_KEYS.map(key=>[key,true]));}})};
 try{await runT04ImageMeasurement(options,overrides);}catch(error){
  if(error.message!=='PERMISSION_T04_IMAGE_MEASUREMENT_FAILED'||closed!==1)throw Error('IMAGE_CONTROL_REFUSED');
  return{t04ImageMeasurementPhaseOrdinal:error.t04ImageMeasurementPhaseOrdinal,
   t04ImageMeasurementCleanupAttempted:error.t04ImageMeasurementCleanupAttempted,
   t04ImageMeasurementCleanupFailed:error.t04ImageMeasurementCleanupFailed,...imageFailureFacts(error)};
 }
 throw Error('IMAGE_CONTROL_UNEXPECTED_PASS');
}
