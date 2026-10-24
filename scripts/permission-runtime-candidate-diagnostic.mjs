// Candidate-only, source-fixed diagnostic projection. This is not an acceptance
// catalog: all six full-file tests still pass through validateRuntimeStage.
export const CANDIDATE_DIAGNOSTIC_ATTACHMENT='candidate-e2e-diagnostics';
export const CANDIDATE_DIAGNOSTIC_SCHEMA='candidate-e2e-diagnostics-v2';
export const CANDIDATE_DIAGNOSTIC_MAX_BYTES=16384;
export const CANDIDATE_TEST_FILE='tests/supabase/permissionCandidate.spec.ts';
export const CANDIDATE_TEST_PROJECT='permission-candidate-isolated';
export const CANDIDATE_TEST_NAMES=Object.freeze([
 'candidate activation supports owner roster, floor, payment and first receipt preview',
 'owner permission change reaches a live cashier context within five seconds',
 'owner creates waiter and real UI hides protected administration and reporting',
 'owner persists menu, floor and store settings changes through real candidate RPCs',
 'four active roles have protected navigation parity with server authorization',
 'owner clears demo data through UI and refetch preserves custom records',
]);
// Tri-state: 0 UNKNOWN, 1 false, 2 true. Counts: 0 UNKNOWN, 1 zero,
// 2 one, 3 many. Read states: 0 UNKNOWN, 1 success, 2 error.
export const CANDIDATE_CHECKPOINT_BOUNDS=Object.freeze({
 dbReadState:2,apiReadState:2,dbSuffix:2,apiSuffix:2,apiEqualsDb:2,
 dbEqualsPersist:2,apiEqualsPersist:2,dbEqualsPreclear:2,apiEqualsPreclear:2,
 inputSuffix:2,inputEqualsPreclear:2,drawerVisible:2,inputVisible:2,
 cancelDialog:2,savePending:2,drawerCount:3,inputCount:3,sectionOrdinal:3,
 queryState:4,dirty:2,requestFailedCount:3,settingsReadPending:2,
});
// One optional test4 image observation, never multiplied across settings rows.
export const CANDIDATE_IMAGE_BOUNDS=Object.freeze({phaseOrdinal:2,observed:1,selectionCount:3,
 selectionMatches:2,imageCount:3,srcMatches:2,decoded:2});
const ordinal=(value,max)=>Number.isSafeInteger(value)&&value>=0&&value<=max;
const exact=(value,keys)=>value!==null&&typeof value==='object'&&!Array.isArray(value)
 &&Object.keys(value).sort().join(',')===[...keys].sort().join(',');
const upper=key=>key[0].toUpperCase()+key.slice(1);
export function candidateTestOrdinal(identity){
 return identity?.file===CANDIDATE_TEST_FILE&&identity.project===CANDIDATE_TEST_PROJECT
  ?CANDIDATE_TEST_NAMES.indexOf(identity.name)+1:0;
}
export function safeCandidateDiagnostic(value,testOrdinal){
 if(!exact(value,['schemaVersion','testOrdinal','milestoneOrdinal','observations','image'])
  ||value.schemaVersion!==CANDIDATE_DIAGNOSTIC_SCHEMA||value.testOrdinal!==testOrdinal
  ||!ordinal(testOrdinal,6)||testOrdinal===0||!ordinal(value.milestoneOrdinal,31)
  ||!Array.isArray(value.observations)||value.observations.length>5)return null;
 const seen=new Set(),observations=[];
 for(const row of value.observations){
  if(!exact(row,['checkpointOrdinal',...Object.keys(CANDIDATE_CHECKPOINT_BOUNDS)])
   ||!ordinal(row.checkpointOrdinal,5)||row.checkpointOrdinal===0||seen.has(row.checkpointOrdinal)
   ||!Object.entries(CANDIDATE_CHECKPOINT_BOUNDS).every(([key,max])=>ordinal(row[key],max)))return null;
  seen.add(row.checkpointOrdinal);observations.push({...row});
 }
 if(value.image!==null){
  if(testOrdinal!==4||!exact(value.image,Object.keys(CANDIDATE_IMAGE_BOUNDS))
   ||!Object.entries(CANDIDATE_IMAGE_BOUNDS).every(([k,max])=>ordinal(value.image[k],max))
   ||value.image.phaseOrdinal===0
   ||value.image.observed===0&&Object.entries(value.image).some(([k,v])=>!['phaseOrdinal','observed'].includes(k)&&v!==0)
   ||value.image.observed===1&&(value.image.selectionCount===0||value.image.imageCount===0||value.image.selectionMatches===0)
   ||value.image.selectionMatches===2&&value.image.selectionCount!==2
   ||value.image.observed===1&&value.image.imageCount===2&&(value.image.srcMatches===0||value.image.decoded===0)
   ||value.image.imageCount!==2&&(value.image.srcMatches!==0||value.image.decoded!==0))return null;
 }
 return {schemaVersion:CANDIDATE_DIAGNOSTIC_SCHEMA,testOrdinal,milestoneOrdinal:value.milestoneOrdinal,observations,image:value.image};
}
// Missing/invalid never becomes an observed false. No file attachment is opened.
export function candidateDiagnosticAttachment(identity,attachments){
 const testOrdinal=candidateTestOrdinal(identity);if(!testOrdinal)return null;
 const rows=Array.isArray(attachments)?attachments.filter(a=>a?.name===CANDIDATE_DIAGNOSTIC_ATTACHMENT):[];
 if(rows.length===0)return {status:0};
 if(rows.length!==1)return {status:2};
 const a=rows[0];
 if(a.contentType!=='application/json'||!Buffer.isBuffer(a.body)||a.body.length>CANDIDATE_DIAGNOSTIC_MAX_BYTES
  ||a.path!==undefined)return {status:2};
 try{
  const value=safeCandidateDiagnostic(JSON.parse(a.body.toString('utf8')),testOrdinal);
  return value?{status:1,value}:{status:2};
 }catch{return {status:2};}
}
export function candidateDiagnosticBounds(errorCodeMax,errorMatcherMax){
 const out={candidateInventoryStatus:3,candidateUnknownDiscovery:10000,candidateUnknownResults:10000,
  candidateDuplicateDiscovery:10000,candidateDuplicateResults:10000,candidateMissingDiscovery:6,candidateMissingResults:6};
 for(const[key,max]of Object.entries(CANDIDATE_IMAGE_BOUNDS))out['candidateImage'+upper(key)]=max;
 for(let i=1;i<=6;i++){
  const p='candidateTest'+i;
  Object.assign(out,{[p+'Discovered']:1,[p+'State']:6,[p+'Attempts']:10000,[p+'FailureLine']:100000,
   [p+'ErrorCodeOrdinal']:errorCodeMax,[p+'ErrorNameOrdinal']:5,[p+'ErrorMatcherOrdinal']:errorMatcherMax,
   [p+'DiagnosticStatus']:2,[p+'MilestoneOrdinal']:31});
  for(let j=1;j<=5;j++){
   out[p+'Checkpoint'+j+'Reached']=1;
   for(const[key,max]of Object.entries(CANDIDATE_CHECKPOINT_BOUNDS))out[p+'Checkpoint'+j+upper(key)]=max;
  }
 }
 return out;
}
export function candidateRuntimeFailureFacts(report,{errorCodeMax,errorMatcherMax}){
 const discovery=report.discovery,results=report.results;
 const ds=Array.from({length:6},()=>[]),rs=Array.from({length:6},()=>[]);
 let unknownDiscovery=0,unknownResults=0;
 for(const row of discovery){const i=candidateTestOrdinal(row);if(i)ds[i-1].push(row);else unknownDiscovery++;}
 for(const row of results){const i=candidateTestOrdinal(row);if(i)rs[i-1].push(row);else unknownResults++;}
 const duplicates=a=>a.reduce((n,rows)=>n+Math.max(0,rows.length-1),0),missing=a=>a.filter(rows=>!rows.length).length;
 const invalid=unknownDiscovery+unknownResults+duplicates(ds)+duplicates(rs)>0;
 const out={candidateInventoryStatus:invalid?3:missing(ds)+missing(rs)>0?2:1,
  candidateUnknownDiscovery:unknownDiscovery,candidateUnknownResults:unknownResults,
  candidateDuplicateDiscovery:duplicates(ds),candidateDuplicateResults:duplicates(rs),
  candidateMissingDiscovery:missing(ds),candidateMissingResults:missing(rs)};
 for(const key of Object.keys(CANDIDATE_IMAGE_BOUNDS))out['candidateImage'+upper(key)]=0;
 for(let i=1;i<=6;i++){
  const p='candidateTest'+i,row=rs[i-1].length===1?rs[i-1][0]:null;
  out[p+'Discovered']=ds[i-1].length===1?1:0;
  out[p+'State']=['passed','failed','timedOut','interrupted','skipped','pending'].indexOf(row?.state)+1;
  for(const[key,max,value]of[['Attempts',10000,row?.attempts],['FailureLine',100000,row?.failureLine],
   ['ErrorCodeOrdinal',errorCodeMax,row?.failureFacts?.errorCodeOrdinal],
   ['ErrorNameOrdinal',5,row?.failureFacts?.errorNameOrdinal],['ErrorMatcherOrdinal',errorMatcherMax,row?.failureFacts?.errorMatcherOrdinal]])
   out[p+key]=ordinal(value,max)?value:0;
  const attachment=row?.candidateDiagnostic;
  const value=attachment?.status===1?safeCandidateDiagnostic(attachment.value,i):null;
  const validEnvelope=exact(attachment,['status','value'])&&attachment.status===1&&value;
  out[p+'DiagnosticStatus']=validEnvelope?1:attachment===undefined||exact(attachment,['status'])&&attachment.status===0?0:2;
  out[p+'MilestoneOrdinal']=validEnvelope?value.milestoneOrdinal:0;
  if(i===4&&validEnvelope&&value.image)for(const key of Object.keys(CANDIDATE_IMAGE_BOUNDS))out['candidateImage'+upper(key)]=value.image[key];
  for(let j=1;j<=5;j++){
   const checkpoint=validEnvelope?value.observations.find(x=>x.checkpointOrdinal===j):null;
   out[p+'Checkpoint'+j+'Reached']=checkpoint?1:0;
   for(const key of Object.keys(CANDIDATE_CHECKPOINT_BOUNDS))out[p+'Checkpoint'+j+upper(key)]=checkpoint?.[key]??0;
  }
 }
 return out;
}
