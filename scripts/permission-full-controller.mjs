import {types}from'node:util';
import{data,checked,result,record,demand,identity,hex,uint,sha,freeze,D1Error}from'./permission-full-d1-data.mjs';
import{PROFILES,assessBudget}from'./permission-full-budget-plan.mjs';
import{initialProvisionInput,provisionPlan,lifecyclePlan}from'./permission-full-provision-plan.mjs';
import{pinnedStageMap}from'./permission-full-perm-plan.mjs';
import{modelReceiver}from'./permission-proof-receiver-model.mjs';
import{custodyAckDescriptor,verifyCustodyAck}from'./permission-full-custody.mjs';
import{CUSTODY_FIELDS}from'./permission-full-integration-plan.mjs';
import PIN_MANIFEST from'../tests/permissions/full-pin19-integrated.json' with{type:'json'};

export const FULL_STAGE_PLAN=freeze(PROFILES.flatMap(profile=>{
 const perm=pinnedStageMap().stages.filter(s=>s.runtimeProfile===profile).map(s=>({stage:s.stage,runtimeProfile:profile,permissionProfile:s.profile,owner:'R'}));
 const stages=[...new Set(PIN_MANIFEST.mappings.filter(m=>m.runtimeProfile===profile).map(m=>m.stage))];
 return [...perm,...stages.map(stage=>({stage,runtimeProfile:profile,permissionProfile:null,owner:'P'}))];
}));

const memoryBrands=new WeakSet();
// The only injectable ports in D1 are constructed here from inert JSON. A
// caller's proxy/object/function is never inspected or invoked as an adapter.
export function createMemorySupervisor(fixtureJson){const fixture=record(data(fixtureJson),['sourceIdentity','budgetInput']);identity(fixture.sourceIdentity);
 const trace=[];const ports=Object.freeze({sourceIdentity:freeze(fixture.sourceIdentity),admission:()=>assessBudget(fixture.budgetInput),
  record:row=>{trace.push(freeze({...row}));},trace:()=>[...trace],provision:profile=>provisionPlan(initialProvisionInput(profile))});memoryBrands.add(ports);return ports;}
export function createFullController(contextJson,ports){const context=record(data(contextJson),['sourceIdentity','nonce']);identity(context.sourceIdentity);demand(typeof context.nonce==='string'&&/^[a-f0-9]{32}$/.test(context.nonce),'BINDING');
 demand(ports!==null&&typeof ports==='object'&&!types.isProxy(ports)&&memoryBrands.has(ports),'INPUT');demand(JSON.stringify(context.sourceIdentity)===JSON.stringify(ports.sourceIdentity),'SOURCE');
 const expected=FULL_STAGE_PLAN;let frozen=false,admitted=false,active=null,index=0,stageIndex=0,backend=null,storage=null,closed=new Set();
 const handle=eventJson=>checked(()=>{const e=record(data(eventJson),['kind','profile','stage','sourceFingerprint','nonce','backend','storage','receiptSha256']);
  demand(typeof e.kind==='string'&&e.sourceFingerprint===context.sourceIdentity.sourceFingerprint&&e.nonce===context.nonce&&hex(e.receiptSha256),'BINDING');
  if(e.kind==='SOURCE_FREEZE'){demand(!frozen&&!active,'BINDING');frozen=true;}
  else if(e.kind==='ADMISSION'){demand(frozen&&!admitted,'BINDING');const a=ports.admission();demand(a.evidenceMode==='SIMULATION'&&a.planDecision==='ADMITTED','BOUND');admitted=true;}
  else if(e.kind==='PROFILE_START'){demand(admitted&&active===null&&e.profile===PROFILES[index],'BINDING');active=e.profile;stageIndex=0;backend=null;storage=null;ports.record({kind:'PROVISION_RECIPE',profile:e.profile,recipe:ports.provision(e.profile).schemaVersion,execution:'NOT_RUN'});}
  else if(e.kind==='STAGE_FINISH'){demand(active!==null&&e.profile===active,'BINDING');const stages=expected.filter(s=>s.runtimeProfile===active);demand(e.stage===stages[stageIndex]?.stage,'PARTITION');
   if(active==='SUPABASE_T04'){demand(hex(e.backend)&&hex(e.storage),'BACKEND');if(backend===null){backend=e.backend;storage=e.storage;}demand(backend===e.backend&&storage===e.storage,'BACKEND');}stageIndex++;}
  else if(e.kind==='PROFILE_CLOSE'){demand(frozen&&admitted&&active!==null&&active===PROFILES[index]&&e.profile===active&&!closed.has(active)&&stageIndex===expected.filter(s=>s.runtimeProfile===active).length,'PARTITION');closed.add(active);active=null;index++;}
  else demand(false,'SCHEMA');
  ports.record({kind:e.kind,profile:e.profile,stage:e.stage,sourceFingerprint:e.sourceFingerprint,receiptSha256:e.receiptSha256,simulation:true});
  return result('MATCH',{simulationState:{frozen,admitted,active,closed:[...closed],nextProfile:PROFILES[index]??null},actualAdmission:false});
 });
 return Object.freeze({simulate:handle,snapshot:()=>result('MATCH',{trace:ports.trace(),closed:[...closed],actualAdmission:false}),
  execute:input=>{data(input);throw new D1Error('EXECUTION_NOT_GRANTED');}});
}
export function fullWorkflowPlan(inputJson){return checked(()=>{const c=record(data(inputJson),['sourceIdentity']);identity(c.sourceIdentity);
 const recipes=PROFILES.map(profile=>provisionPlan(initialProvisionInput(profile)));
 return result('STOP',{sourceIdentity:c.sourceIdentity,workflowVersion:'permission-full-workflow-v1',profileOrder:PROFILES,stageMapping:FULL_STAGE_PLAN,pinExtraDependencies:PIN_MANIFEST.dependencies,
  recipes,custodyFields:CUSTODY_FIELDS,executor:'NONE_D1_PURE_ONLY',failures:['FAIL','CANCEL','TIMEOUT'].map(lifecyclePlan),
  requiredActualGates:['FINAL_COMBINED_SOURCE_CI','BOUNDED_GLOBAL_PHYSICAL_ADMISSION','SOURCE_BOUND_RUNTIME_GRANT','INDEPENDENT_OBSERVER','FULL_AUTH_EOF_CHILD_SUCCESS_ORIGIN_ARCHIVE_MEMBER_CLOSURE','LATEST_AUTHENTICATED_OWNER_ACK','RETENTION','EXACT_CLEANUP_GRANT'],
  inheritedStop:{gpgFailedActual:2,gpgAdditionalAllowed:0,fixtureDeleteBlocks:2,fixtureDeleteAllowed:0,hp1:'RETIRED'}});
});}
export function assessPrivateReceiver(contextJson,requestJson,expectationJson,conditionsJson){return checked(()=>{
 const c=record(data(contextJson),['sourceIdentity']);identity(c.sourceIdentity);
 const conditions=record(data(conditionsJson),['ramMaximumBytes','plaintextBytes','fullAuthentication','eof','childExit','independentOrigin','archiveClosed','membersClosed']);
 demand(uint(conditions.ramMaximumBytes)&&conditions.ramMaximumBytes>0&&conditions.ramMaximumBytes<10737418240&&uint(conditions.plaintextBytes)&&conditions.plaintextBytes<=conditions.ramMaximumBytes,'BOUND');
 demand(conditions.fullAuthentication===true&&conditions.eof===true&&conditions.childExit===0&&conditions.independentOrigin===true&&conditions.archiveClosed===true&&conditions.membersClosed===true,'AUTHENTICATION');
 const expectation=data(expectationJson);demand(expectation&&typeof expectation==='object'&&expectation.binding&&typeof expectation.binding==='object','CUSTODY');
 demand(expectation.binding.permissionFingerprint===c.sourceIdentity.sourceFingerprint&&expectation.binding.lockSha256===c.sourceIdentity.lockSha256&&expectation.binding.recipeSha256===c.sourceIdentity.recipeSha256,'SOURCE');
 const received=modelReceiver(requestJson,expectationJson);demand(received.simulationAccepted===true,'CUSTODY');
 demand(expectation.members.reduce((n,m)=>n+m.bytes,0)===conditions.plaintextBytes,'BOUND');
 return result('MATCH',{sourceIdentity:c.sourceIdentity,receiver:received,plaintextWrites:0,ackPosts:0,privatePath:null,ramOnly:true,authenticationConditions:'SIMULATED_DECLARATIONS_NOT_OBSERVED_OR_AUTHENTICATED'});
});}
export function custodyRetentionPort(inputJson){return checked(()=>{
 const x=record(data(inputJson),['sourceIdentity','binding','query','now','retention']);identity(x.sourceIdentity);record(x.binding,CUSTODY_FIELDS);
 demand(x.binding.permissionFingerprint===x.sourceIdentity.sourceFingerprint&&x.binding.lockSha256===x.sourceIdentity.lockSha256&&x.binding.recipeSha256===x.sourceIdentity.recipeSha256,'SOURCE');
 // Convert only after strict primitive parsing; original custody requires an
 // ordinary data record. This preserves the exact 17-field wire contract.
 const b=JSON.parse(JSON.stringify(x.binding));const descriptor=custodyAckDescriptor(b);
 record(x.query,['repositoryId','queriedSha','complete','statuses']);demand(Array.isArray(x.query.statuses));for(const s of x.query.statuses){record(s,['id','context','state','description','target_url','created_at','creator']);record(s.creator,['id','type']);}
 const ack=verifyCustodyAck(b,x.query,{now:x.now});demand(ack.valid===true,'CUSTODY');
 record(x.retention,['bindingCommitment','allocationIds','maximumBytes','until','processesReleased','cleanupGrant']);
 demand(typeof x.retention.processesReleased==='boolean'&&x.retention.cleanupGrant===false,'CUSTODY');
 demand(x.retention.bindingCommitment===descriptor.commitment&&Array.isArray(x.retention.allocationIds)&&x.retention.allocationIds.length>0&&x.retention.allocationIds.every(a=>typeof a==='string'&&/^[A-Za-z0-9_-]+$/.test(a))&&new Set(x.retention.allocationIds).size===x.retention.allocationIds.length,'CUSTODY');
 demand(uint(x.retention.maximumBytes)&&x.retention.maximumBytes>=b.cipherBytes&&typeof x.retention.until==='string'&&Number.isFinite(Date.parse(x.retention.until))&&Date.parse(x.retention.until)>=Date.parse(x.now),'BOUND');
 return result('MATCH',{custodyCommitment:descriptor.commitment,simulatedLatestStatusId:ack.statusId,retentionRecordedAsDeclaration:true,actualAckVerified:false,intentionalCleanupAllowed:false,deletePermission:false});
});}
