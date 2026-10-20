import {createChunkDecoder}from'./permission-full-chunks.mjs';
import {data,largeData,checked,result,record,demand,identity,hex,uint,sha}from'./permission-full-d1-data.mjs';
import {pinnedStageMap}from'./permission-full-perm-plan.mjs';
import {checkIntegratedPermStage,checkPermSchedule}from'./permission-full-perm-collect.mjs';

// Independent expected digest/size and source/map bindings come from the frozen
// collection contract, never from received frame headers or commit metadata.
export function createPermAggregateReceiver(contextJson,stageMapJson){
 const c=record(data(contextJson),['sourceIdentity','stageMapSha256','payloadSha256','payloadBytes','workflowRunId','attempt']);identity(c.sourceIdentity);
 demand(hex(c.stageMapSha256)&&typeof stageMapJson==='string'&&sha(stageMapJson)===c.stageMapSha256&&hex(c.payloadSha256)&&uint(c.payloadBytes),'SOURCE');
 demand(typeof c.workflowRunId==='string'&&/^[1-9][0-9]{0,19}$/.test(c.workflowRunId)&&uint(c.attempt)&&c.attempt>0&&c.attempt<=100,'BINDING');
 const binding=sha(JSON.stringify(c)),decoder=createChunkDecoder(binding,c.payloadSha256,c.payloadBytes);let poisoned=false,finished=false;
 return Object.freeze({push(frame){demand(!poisoned&&!finished,'BINDING');try{decoder.push(frame);}catch(e){poisoned=true;throw e;}},finish(commit){demand(!poisoned&&!finished,'BINDING');finished=true;
  return checked(()=>{let raw;try{raw=decoder.finish(commit);}catch{poisoned=true;demand(false,'BINDING');}const value=record(largeData(raw),['version','runs']);demand(value.version==='perm-aggregate-input-v1'&&Array.isArray(value.runs)&&value.runs.length===27,'PARTITION');
   const expected=pinnedStageMap().stages,seen=new Set(),executions=new Set(),schedule=[];let count=0;
   const bind=JSON.stringify({stageMapSha256:c.stageMapSha256,sourceFingerprint:c.sourceIdentity.sourceFingerprint,lockSha256:c.sourceIdentity.lockSha256});
   for(const run of value.runs){record(run,['stage','evidenceJson']);demand(typeof run.stage==='string'&&typeof run.evidenceJson==='string'&&!seen.has(run.stage)&&expected.some(s=>s.stage===run.stage),'PARTITION');seen.add(run.stage);
    const row=checkIntegratedPermStage(stageMapJson,run.evidenceJson,bind);if(row.modelDecision!=='MATCH')return result('STOP',{errors:['D1_ORACLE'],stageFailed:run.stage,componentErrors:row.errors});demand(row.workflowRunId===c.workflowRunId&&row.attempt===c.attempt&&!executions.has(row.stageExecutionId),'BINDING');executions.add(row.stageExecutionId);count+=row.occurrences;
    schedule.push({stage:row.stage,runtimeProfile:row.runtimeProfile,stageExecutionId:row.stageExecutionId,workflowRunId:row.workflowRunId,attempt:row.attempt,startedMs:row.startedMs,finishedMs:row.finishedMs,physicalBackend:row.declaration?.physicalBackend??null,storageIdentity:row.declaration?.storageIdentity??null,backend:row.declaration?.backend??null});
   }
   const scheduling=checkPermSchedule(JSON.stringify(pinnedStageMap()),JSON.stringify({version:'perm-declared-schedule-v1',rows:schedule}));demand(scheduling.modelDecision==='MATCH','BACKEND');
   return result('MATCH',{sourceIdentity:c.sourceIdentity,stageCount:27,occurrenceCount:count,rawPayloadSha256:sha(raw),rawPayloadBytes:Buffer.byteLength(raw),backendObserved:false,authentication:'NOT_PROVEN',schedule:scheduling});
  });}});
}
