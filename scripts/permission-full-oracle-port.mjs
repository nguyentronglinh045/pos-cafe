import{data,largeData,checked,result,record,demand,identity,sha}from'./permission-full-d1-data.mjs';
import{sourceIndex}from'./permission-full-source-index.mjs';
import{ORACLE_CONTRACT as C,checkGateControls,checkRestrictedSurface,checkErrorContexts,checkKeyPersistence,checkMacAuditProjection,operatorPolicy,checkUiAndRegression}from'./permission-full-oracles.mjs';
import{checkAuditSemantics}from'./permission-full-audit-oracle.mjs';

// Eight separately bounded primitive declarations close twelve supplemental
// consistency obligations. The contract/index channel is strict 8MiB JSON;
// each oracle payload retains its 256KiB parser. No commands are executed.
export function collectSupplementalOracles(payloadJson,contractJson){return checked(()=>{const c=record(largeData(contractJson),['sourceIdentity','sourceIndexJson','sourceIndexExpectedJson','auditContractJson','auditExpectedJson']);identity(c.sourceIdentity);const{index}=sourceIndex(JSON.stringify(c.sourceIdentity),c.sourceIndexJson,c.sourceIndexExpectedJson);const x=record(data(payloadJson),['gateJson','surfaceJson','errorsJson','keyJson','uiJson','macJson','auditJson','operatorJson']);
 for(const v of Object.values(x))demand(typeof v==='string','INPUT');demand(typeof c.auditContractJson==='string'&&typeof c.auditExpectedJson==='string','INPUT');
 const entry=index.get('ui-audit/run.mjs'),config=index.get('ui-audit/config.json');demand(entry&&config,'SOURCE');
 const uiContext=JSON.stringify({sourceIdentity:c.sourceIdentity,entrySha256:entry.sha256,configSha256:config.sha256});
 const values={gate:checkGateControls(x.gateJson),surface:checkRestrictedSurface(x.surfaceJson),errors:checkErrorContexts(x.errorsJson),key:checkKeyPersistence(x.keyJson),ui:checkUiAndRegression(x.uiJson,uiContext),mac:checkMacAuditProjection(x.macJson),audit:checkAuditSemantics(x.auditJson,c.auditContractJson,c.auditExpectedJson),operator:operatorPolicy(x.operatorJson)};
 for(const[k,r]of Object.entries(values))if(k!=='operator')demand(r.modelDecision!=='MATCH'||r.sourceFingerprint===c.sourceIdentity.sourceFingerprint,'SOURCE');
 const functions=['gate','surface','errors','errors','key','ui','ui','ui','ui','mac+audit','errors','operator'];demand(C.gaps.length===functions.length,'SOURCE');
 const rows=C.gaps.map((g,i)=>{const components=functions[i].split('+');const match=components.every(k=>values[k].modelDecision==='MATCH');return{field:g.field,sourceFingerprint:c.sourceIdentity.sourceFingerprint,payloadSha256:components.map(k=>sha(x[({gate:'gateJson',surface:'surfaceJson',errors:'errorsJson',key:'keyJson',ui:'uiJson',mac:'macJson',audit:'auditJson',operator:'operatorJson'})[k]])),components,modelDecision:match?'MATCH':'STOP',state:match?'PURE_CONSISTENCY_VERIFIED_OBSERVATION_NOT_RUN':'STOP',actualObservation:'NOT_RUN'};});
 return result(rows.every(r=>r.modelDecision==='MATCH')?'MATCH':'STOP',{sourceIdentity:c.sourceIdentity,gapRows:rows,components:values,coveredGapRows:rows.filter(r=>r.modelDecision==='MATCH').length,sourceContract:'COMPLETE_RAW_INDEX_FINGERPRINT_WITH_CANONICAL_UI_ARGV',actualObservation:'NOT_RUN'});
});}
