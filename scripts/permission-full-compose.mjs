import {data,largeData,checked,result,record,demand,identity,hex,uint,sha,safePath} from './permission-full-d1-data.mjs';
import {planPin19,pin19Bounds} from './permission-full-pin-plan.mjs';
import {planPerm60,perm60Bounds,pinnedStageMap,boundsTemplate} from './permission-full-perm-plan.mjs';
import {checkPin19Evidence,checkIntegratedPinEvidence,createIntegratedPinReceiver} from './permission-full-pin-collect.mjs';
import {checkPermStage,checkPermSchedule,checkIntegratedPermStage} from './permission-full-perm-collect.mjs';
import {transportBounds,modelTransport} from './permission-proof-transport-model.mjs';
import {modelReceiver} from './permission-proof-receiver-model.mjs';
import {legacyBounds,readLegacyGraph} from './permission-full-legacy-plan.mjs';
import {assessBudget,initialBudgetInput,WRITER_CATALOG} from './permission-full-budget-plan.mjs';
import {initialProvisionInput,provisionPlan} from './permission-full-provision-plan.mjs';
import {sourceIndex}from'./permission-full-source-index.mjs';
import {collectSupplementalOracles}from'./permission-full-oracle-port.mjs';

// Each original kind/stage remains a separate provenance row. These relations
// describe containment in B's accounting buckets, never a finite byte bound.
const WRITER_KINDS={
 discovery:'evidence-members-closure',results:'evidence-members-closure',options:'evidence-members-closure',attestation:'evidence-members-closure',
 'tc18-control':'evidence-members-closure','tc19-preservation':'evidence-members-closure',observer:'evidence-members-closure','storage-get':'evidence-members-closure',preservation:'evidence-members-closure',
 'tc18-captures':'browser-trace-screenshot-temp','browser-trace':'browser-trace-screenshot-temp',screenshots:'browser-trace-screenshot-temp',trace:'browser-trace-screenshot-temp',temp:'browser-trace-screenshot-temp',
 'browser-profile':'browser-binary-cache-profile','stdout-stderr':'stdout-stderr',stdout:'stdout-stderr','database-WAL':'DB-data-WAL-reset',reset:'DB-data-WAL-reset','db-data-wal':'DB-data-WAL-reset','logical-reset':'DB-data-WAL-reset','source-control':'source-copy',
 retention:'GLOBAL_failure-retry-retention','failure-path':'GLOBAL_failure-retry-retention',
};

// Each primitive argument has its own 256KiB boundary. The initial models keep
// their reviewed-origin identities. New combined-source identity is separate:
// it never turns old base/legacy inventories into new-source runtime evidence.
export function composePreparation(contextJson,pinManifestJson,pinInventoryJson,pinCatalogJson,permManifestJson,permInventoryJson){return checked(()=>{
 for(const arg of [contextJson,pinManifestJson,pinInventoryJson,pinCatalogJson,permManifestJson,permInventoryJson])demand(typeof arg==='string','INPUT');
 const c=record(data(contextJson),['sourceIdentity','componentPins']);identity(c.sourceIdentity);demand(Array.isArray(c.componentPins),'SOURCE');
 const supplied={pinManifestJson,pinInventoryJson,pinCatalogJson,permManifestJson,permInventoryJson};
 for(const p of c.componentPins){record(p,['argument','sha256']);demand(typeof p.argument==='string'&&hex(p.sha256),'SOURCE');}
 demand(c.componentPins.length===5&&new Set(c.componentPins.map(p=>p.argument)).size===5,'SOURCE');
 for(const p of c.componentPins){record(p,['argument','sha256']);demand(Object.hasOwn(supplied,p.argument)&&hex(p.sha256)&&sha(supplied[p.argument])===p.sha256,'SOURCE');}
 const pin=planPin19(pinManifestJson,pinInventoryJson),pinBounds=pin19Bounds(pinManifestJson,pinCatalogJson);
 const perm=planPerm60(permManifestJson,permInventoryJson),stageMap=pinnedStageMap();
 const permBounds=perm60Bounds(JSON.stringify(stageMap),JSON.stringify({version:'perm-output-catalog-v1',rows:boundsTemplate()}));
 const transport=transportBounds(),legacy=legacyBounds();
 const budgetInput=initialBudgetInput();
 // B03 retains all 134 writers. A time/concurrency source row is explicitly a
 // non-writer gap rather than being assigned to an unrelated disk writer.
 const mappedRows=[];
 for(const [owner,rows] of [['P',pinBounds.writers??[]],['R',permBounds.rows??[]]])for(const row of rows){
  const profile=row.profile??row.runtimeProfile,kind=WRITER_KINDS[row.kind];const targets=WRITER_CATALOG.filter(w=>kind?.startsWith('GLOBAL_')?w.writerId===kind:w.profile===profile&&w.kind===kind);
  demand(targets.length===1||row.kind==='time-concurrency','BOUND');
  mappedRows.push({owner,sourceId:row.writerId??row.id,sourceStage:row.stage,sourceKind:row.kind,sourceProfile:profile,targetWriterIds:targets.map(w=>w.writerId),targetWriters:targets,mappingDecision:targets.length?'DECLARED_CONTAINMENT':'UNMAPPED_STOP',gap:targets.length?null:{owner:'D',field:'budget.time.profileWindows/resources',cause:'NON_BYTE_TIME_CONCURRENCY_DIMENSION_REQUIRES_SEPARATE_BOUND'},state:'UNKNOWN',maximumBytes:null,reason:'PRESERVE_COMPONENT_UNKNOWN_NO_CITATION_OR_COUNT_MAXIMUM'});
 }
 const budget=assessBudget(budgetInput),provision=provisionPlan(initialProvisionInput('STATIC'));
 return result('STOP',{sourceIdentity:c.sourceIdentity,codeComposition:'RECOVERED_COMPONENTS_CALLED',models:{pin,perm,transport,legacy,budget,provision},pinBounds,permBounds,mappedRows,
  counts:{pinCases:pin.caseCount,pinVariants:pin.subvariantCount,permCases:perm.coverage?.caseCount,permOccurrences:perm.coverage?.occurrenceCount,permStages:perm.coverage?.stageCount,
   pinBoundRows:pinBounds.writers?.length,permBoundRows:permBounds.rows?.length,budgetWriters:budget.ledger.length},
  originIdentity:'REVIEWED_PREPARATION_INPUTS_SEPARATE_FROM_NEW_COMBINED_SOURCE',missingInputs:[
   {owner:'D2',field:'actualAdmission',cause:'ALL_MAXIMA_PLACEMENTS_RETENTION_TIME_RESOURCE_ENFORCEMENT_NOT_OBSERVED',action:'SOURCE_BOUND_BOUNDED_ADMISSION_BEFORE_EXECUTION'},
   {owner:'E',field:'runtimeDiscoveryResults',cause:'NO_RUNTIME_EXECUTION_IN_D1',action:'SEPARATE_AUTHORIZED_EXACT_COMBINED_SOURCE_FULL_GATE'}]});
});}
export function collectComponent(contextJson,kind,payloadJson,contractJson){return checked(()=>{
 const c=record(data(contextJson),['sourceIdentity','payloadSha256','contractSha256']);identity(c.sourceIdentity);
 demand(typeof kind==='string'&&typeof payloadJson==='string'&&typeof contractJson==='string','INPUT');
 demand(hex(c.payloadSha256)&&hex(c.contractSha256)&&sha(payloadJson)===c.payloadSha256&&sha(contractJson)===c.contractSha256,'BINDING');
 let component;
 if(kind==='PIN')component=checkPin19Evidence(contractJson,payloadJson);
 // Integrated contract envelopes have an explicit strict 8MiB semantic channel;
 // recovered component arguments keep their original individual parser caps.
 else if(kind==='PIN_INTEGRATED'){const x=record(largeData(contractJson),['reviewedManifestJson','contextJson','expectedSourceIndexJson']);component=checkIntegratedPinEvidence(x.reviewedManifestJson,payloadJson,x.contextJson,x.expectedSourceIndexJson);if(component.modelDecision==='MATCH')demand(JSON.stringify(component.sourceIdentity)===JSON.stringify(c.sourceIdentity),'SOURCE');}
 else if(kind==='PERM_STAGE')component=checkPermStage(contractJson,payloadJson);
 else if(kind==='PERM_SCHEDULE')component=checkPermSchedule(contractJson,payloadJson);
 else if(kind==='PERM_INTEGRATED_STAGE'){const x=record(largeData(contractJson),['stageMapJson','contextJson']);component=checkIntegratedPermStage(x.stageMapJson,payloadJson,x.contextJson);const bound=data(x.contextJson);demand(bound.sourceFingerprint===c.sourceIdentity.sourceFingerprint&&bound.lockSha256===c.sourceIdentity.lockSha256,'SOURCE');}
 else if(kind==='TRANSPORT')component=modelTransport(payloadJson,contractJson);
 else if(kind==='RECEIVER')component=modelReceiver(payloadJson,contractJson);
 else if(kind==='SUPPLEMENTAL_ORACLES'){component=collectSupplementalOracles(payloadJson,contractJson);if(component.modelDecision==='MATCH')demand(JSON.stringify(component.sourceIdentity)===JSON.stringify(c.sourceIdentity),'SOURCE');}
 else if(kind==='LEGACY_GRAPH'){demand(contractJson==='null');component=readLegacyGraph(data(payloadJson));}
 else demand(false,'SCHEMA');
 const match=['TRANSPORT','RECEIVER'].includes(kind)?component.simulationAccepted===true:kind==='LEGACY_GRAPH'?component.decision==='MATCH':component.modelDecision==='MATCH';
 return result(match?'MATCH':'STOP',{component,sourceIdentity:c.sourceIdentity,originEvidence:'SUPPLIED_MODEL_ONLY',actualAdmission:false});
});}
export function stageRunBinding(inputJson){return checked(()=>{
 const x=record(data(inputJson),['sourceIdentity','workflowRunId','attempt','nonce','stage','permissionProfile','runtimeProfile','stageExecutionRunId']);identity(x.sourceIdentity);
 demand(typeof x.workflowRunId==='string'&&/^[1-9][0-9]{0,19}$/.test(x.workflowRunId)&&Number.isSafeInteger(x.attempt)&&x.attempt>=1&&x.attempt<=100,'BINDING');
 demand(typeof x.nonce==='string'&&/^[a-f0-9]{32}$/.test(x.nonce)&&typeof x.stageExecutionRunId==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(x.stageExecutionRunId),'BINDING');
 const expected=pinnedStageMap().stages.find(s=>s.stage===x.stage);demand(expected&&expected.profile===x.permissionProfile&&expected.runtimeProfile===x.runtimeProfile,'BINDING');
 return result('MATCH',{declaredBinding:x,actualRuntimeBinding:null});
});}
export function assessIntegratedBudget(contextJson,budgetJson){return checked(()=>{
 const c=record(data(contextJson),['sourceIdentity','inputSha256']);identity(c.sourceIdentity);demand(typeof budgetJson==='string'&&hex(c.inputSha256)&&sha(budgetJson)===c.inputSha256,'SOURCE');
 const b=assessBudget(data(budgetJson));return result(b.planDecision==='ADMITTED'?'MATCH':'STOP',{budget:b,sourceIdentity:c.sourceIdentity,admission:'NOT_RUN'});
});}

export function createIntegratedComponentReceiver(contextJson,kind,contractJson){const c=record(data(contextJson),['sourceIdentity','payloadSha256','payloadBytes','contractSha256','expectedSourceIndexSha256']);identity(c.sourceIdentity);demand(kind==='PIN_INTEGRATED'&&typeof contractJson==='string'&&hex(c.contractSha256)&&sha(contractJson)===c.contractSha256&&hex(c.payloadSha256)&&uint(c.payloadBytes)&&hex(c.expectedSourceIndexSha256),'SOURCE');
 const x=record(largeData(contractJson),['reviewedManifestJson','contextJson']);demand(typeof x.reviewedManifestJson==='string'&&typeof x.contextJson==='string','INPUT');
 return createIntegratedPinReceiver(JSON.stringify({sourceIdentity:c.sourceIdentity,reviewedManifestSha256:sha(x.reviewedManifestJson),sourceContractSha256:sha(x.contextJson),payloadSha256:c.payloadSha256,payloadBytes:c.payloadBytes,expectedSourceIndexSha256:c.expectedSourceIndexSha256}),x.reviewedManifestJson,x.contextJson);
}

export function compilePermSourceContract(identityJson,sourceIndexJson,expectedSourceIndexJson){return checked(()=>{
 const {sourceIdentity,index}=sourceIndex(identityJson,sourceIndexJson,expectedSourceIndexJson);
 const map=pinnedStageMap();map.inventoryHash=sourceIdentity.sourceFingerprint;map.lockHash=sourceIdentity.lockSha256;
 for(const s of map.stages){demand(index.has(s.configuration.path),'SOURCE');const config=index.get(s.configuration.path);s.configuration={path:config.path,bytes:config.bytes,sha256:config.sha256};s.recipe.config={...s.configuration};
  for(const file of new Set([...s.files,...s.recipe.files,...s.required.map(r=>r.file)]))demand(index.has(file),'SOURCE');
  for(const group of [s.helpers,s.sourceRefs])if(Array.isArray(group))for(const r of group){if(r&&typeof r==='object'&&typeof r.path==='string'&&Object.hasOwn(r,'sha256')){const actual=index.get(r.path);demand(actual,'SOURCE');r.sha256=actual.sha256;if(Object.hasOwn(r,'bytes'))r.bytes=actual.bytes;if(Object.hasOwn(r,'line'))demand(Number.isSafeInteger(r.line)&&r.line>=1&&r.line<=actual.lines,'SOURCE');}}
  s.recipeHash=sha(JSON.stringify([s.recipe,s.configuration,sourceIdentity.recipeSha256]));
 }
 const stageMapJson=JSON.stringify(map);return result('MATCH',{sourceIdentity,stageMap:map,stageMapJson,stageMapSha256:sha(stageMapJson),origin:'REVIEWED_R02_60_726_27_IDENTITY_SET_WITH_NEW_COMBINED_SOURCE_DIGESTS'});
});}
