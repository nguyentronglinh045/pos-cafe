// Registry transport only. The caller still verifies the pinned OCI config ID,
// linux/amd64, original tag and all owned-runtime/resource guards.
const refuse=()=>{throw Error('PINNED_IMAGE_TRANSPORT_REFUSED');};
export async function pullPinnedImage(run,reference,guard=()=>{},wait=ms=>new Promise(resolve=>setTimeout(resolve,ms)),onAttempt=()=>{}){
 if(typeof reference!=='string'||!/^public\.ecr\.aws\/supabase\/[a-z0-9._-]+@sha256:[a-f0-9]{64}$/.test(reference))refuse();
 const primary=reference.replace(/^public\.ecr\.aws\//,'ghcr.io/');
 for(let attempt=1;attempt<=3;attempt++){
  guard();onAttempt(attempt);
  try{run('docker',['pull','--quiet','--platform','linux/amd64',primary]);return primary;}
  catch(error){
   // Keep the existing bounded known-429 policy. Unknown/network/test failures
   // stop immediately; no blind retry or automatic alternate on an unknown error.
   if(error?.ci1FailureCode!=='DOCKER_REGISTRY_RATE_LIMIT')throw error;
   if(attempt===3){guard();onAttempt(4);run('docker',['pull','--quiet','--platform','linux/amd64',reference]);return reference;}
  }
  await wait(attempt===1?10000:30000);guard();
 }
}
export function imagePullRegistryOrdinal(attempt){if(!Number.isSafeInteger(attempt)||attempt<1||attempt>4)refuse();return attempt===4?1:2;}

export const DOCKER_DIAGNOSTIC_BOUNDS=Object.freeze({dockerFailureObserved:[0,2],dockerFailureKindOrdinal:[0,8],dockerFailureHttpStatus:[0,599],dockerFailureStderrBytes:[0,1048577]});
export function dockerSafeFailureMetric(key,value){const bounds=DOCKER_DIAGNOSTIC_BOUNDS[key];return !!bounds&&Number.isSafeInteger(value)&&value>=bounds[0]&&value<=bounds[1];}
// Only fixed categories/counts/status are emitted. Never URLs, signed query
// strings, bearer tokens, names, paths, raw lines, messages or stderr digests.
export function dockerFailureFacts(stderr){
 if(Buffer.isBuffer(stderr)){if(stderr.length>1048576)return{dockerFailureObserved:2,dockerFailureKindOrdinal:0,dockerFailureHttpStatus:0,dockerFailureStderrBytes:1048577};stderr=stderr.toString('utf8');}
 if(typeof stderr!=='string')return{dockerFailureObserved:0,dockerFailureKindOrdinal:0,dockerFailureHttpStatus:0,dockerFailureStderrBytes:0};
 const bytes=Buffer.byteLength(stderr);if(bytes>1048576)return{dockerFailureObserved:2,dockerFailureKindOrdinal:0,dockerFailureHttpStatus:0,dockerFailureStderrBytes:1048577};
 const patterns=[/(?:unexpected\s+EOF|\bEOF)(?:\s|$)/i,/connection reset|broken pipe|connection (?:was )?closed/i,
  /timeout|timed out|context deadline exceeded|request canceled/i,/unexpected status|server error|service unavailable/i,
  /digest mismatch|unexpected commit digest|invalid checksum|filesystem layer verification failed/i,
  /no matching manifest|does not match the specified platform/i,/pull access denied|requested access.*denied|denied:/i,
  /error response from daemon|error pulling|failed to resolve reference/i];
 const statuses=[...stderr.matchAll(/(?:status(?: code)?\s*[:=]?\s*|HTTP\/\d(?:\.\d)?\s+)([1-5][0-9]{2})(?=\s|$|[.:])/gi)].map(m=>Number(m[1]));
 const unique=[...new Set(statuses)];
 return{dockerFailureObserved:1,dockerFailureKindOrdinal:patterns.findIndex(pattern=>pattern.test(stderr))+1,
  dockerFailureHttpStatus:unique.length===1?unique[0]:0,dockerFailureStderrBytes:bytes};
}
