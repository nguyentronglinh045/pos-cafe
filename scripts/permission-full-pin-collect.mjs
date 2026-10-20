// Consistency model only. Supplied JSON is never filesystem/process authority or authenticated evidence.
import {PIN19_INTERFACE as S,PIN19_PINS as P,assert,exact,string,integer,hash,choice,path,unique,parseText,manifestInput,model,sha256,contentHash} from './permission-full-pin-plan.mjs';
import {data,largeData,record,demand,identity as sourceIdentity,hex as sourceHex,sha as sourceHash,checked,result} from './permission-full-d1-data.mjs';
import {partitionDiscovery} from './permission-full-source.mjs';
import {sourceIndex}from'./permission-full-source-index.mjs';
import {createChunkDecoder}from'./permission-full-chunks.mjs';
import {extname} from 'node:path';
const p='PIN_EVIDENCE';
export const TC18_SCENARIOS=Object.freeze(['complete','recovery','bootstrap','seed'].flatMap(op=>['success','denial','fault','lostAck','replay'].map(kind=>op+':'+kind)));
export const TC18_SINKS=Object.freeze(['audit','registry','signal','realtime','browserStorage','url','console','telemetry','artifact','errorMessage','screenshotText']);
const client=new Set(['browserStorage','url','console','screenshotText']);
export const TC18_REQUIRED_FILES=Object.freeze([...TC18_SCENARIOS.flatMap(s=>['png','json'].map(ext=>'runtime/'+s.replace(':','-')+'.'+ext)),
  'runtime/masked-completion.png','runtime/complete-realtime-readiness.json','runtime/recovery-realtime-readiness.json','runtime/operator.png','runtime/operator.json','runner.log','browser-safe.json']);
export const TC19_RELATIONS=Object.freeze(['private.employee_sessions','public.categories','public.employees','public.floor_areas','public.floor_decor_items','public.menu_item_option_groups','public.menu_items','public.option_groups','public.option_values','public.order_events','public.order_item_options','public.order_items','public.orders','public.payments','public.store_settings','public.stores','public.tables','public.write_operations']);
const uuid=v=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(v);
const identity=t=>JSON.stringify([t.file,t.fullName,t.project]);
const sameSet=(a,b)=>a.length===b.length&&new Set(a).size===a.length&&a.every(v=>b.includes(v));
function utc(value){string(value,p);assert(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value),p,'TIME');const time=Date.parse(value);assert(Number.isSafeInteger(time)&&new Date(time).toISOString()===value,p,'TIME');return time;}
function descriptor(value){exact(value,S.artifact,p);hash(value.rawSha256,p);hash(value.contentSha256,p);integer(value.bytes,p);}
function identityRow(row){path(row.file,p);string(row.fullName,p);assert(row.project===null||typeof row.project==='string'&&row.project.length>0,p,'TYPE');}
function observerContract(s){
  const o=exact(s.observer,S.observer,p);hash(s.observerSha256,p);assert(contentHash(o)===s.observerSha256&&o.declaredOnly===true&&o.backendIdentity===s.backendIdentity,p,'BINDING');
  const definition=s.executionKind==='static'?['STATIC_NO_BACKEND',[]]:s.stage==='pin-identity-server'?['SQL_OBSERVER',['SQL']]:s.stage==='pin-canary-empty'?['EMPTY_TARGET_OBSERVER',['SQL','AUTH','REST','STORAGE']]:s.stage==='pin-tc18-wrapper'?['TC18_WRAPPER',['SQL','AUTH','REST','STORAGE','REALTIME','CHROMIUM']]:['BROWSER_AUTH_REST',['SQL','AUTH','REST','CHROMIUM']];
  assert(o.kind===definition[0],p,'BINDING');unique(o.services,v=>string(v,p),p);assert(sameSet(o.services,definition[1]),p,'BINDING');
  for(const key of ['fixtureSha256','schemaSha256','catalogSha256','appliedArtifactSha256']){if(s.executionKind==='static')assert(o[key]===null,p,'BINDING');else hash(o[key],p);}
  if(s.executionKind==='static'||o.kind==='SQL_OBSERVER')assert(o.apiBindingSha256===null,p,'BINDING');else hash(o.apiBindingSha256,p);
}
function scan(value,needles,budget){
  assert(++budget.nodes<=20000,p,'LIMIT');
  if(typeof value==='string'){assert(!needles.some(n=>value.includes(n)),p,'CANARY_LEAK');return;}
  if(typeof value==='number'){const text=String(value);assert(!needles.some(n=>text.includes(n)||/^\d{6}$/.test(n)&&String(Number(n))===text),p,'CANARY_LEAK');return;}
  if(value===null||typeof value!=='object')return;
  if(!Array.isArray(value)&&value.numericKind==='BIGINT'){
    exact(value,['numericKind','decimal'],p);assert(typeof value.decimal==='string'&&/^-?(?:0|[1-9][0-9]*)$/.test(value.decimal),p,'TC18_SINK');
    const text=value.decimal;assert(!needles.some(n=>text.includes(n)||/^\d{6}$/.test(n)&&String(Number(n))===text),p,'CANARY_LEAK');
  }
  for(const key of Object.keys(value)){scan(key,needles,budget);scan(value[key],needles,budget);}
}
function canaries(values){assert(Array.isArray(values)&&values.length>0,p,'TC18_CONTROL');unique(values,x=>string(x,p,256),p);assert(values.every(x=>x.length>=6),p,'TC18_CONTROL');return values;}
function needlesFor(values){return [...new Set(values.flatMap(v=>[v,encodeURIComponent(v),Buffer.from(v).toString('base64')]))];}
function sinks(value,scenario,secrets,budget){
  exact(value,TC18_SINKS,p);const needles=needlesFor(secrets);
  for(const name of TC18_SINKS){const sink=value[name];assert(sink!==null&&typeof sink==='object'&&!Array.isArray(sink),p,'TC18_SINK');
    if(Object.hasOwn(sink,'notApplicable')){exact(sink,S.notApplicable,p);assert(sink.notApplicable===true&&sink.reason==='NO_CLIENT_SURFACE'&&scenario.startsWith('recovery:')&&client.has(name),p,'TC18_SINK');}
    else {exact(sink,S.sink,p);assert(sink.captured===true&&sink.data!==null,p,'TC18_SINK');scan(sink.data,needles,budget);}
  }
}
function checkTc18(value){
  const t=exact(value,S.tc18,p);assert(t.phase==='POST_CHILD_EXIT'&&t.childExit===0&&t.maskedFormAsserted===true,p,'TC18_FILE');
  exact(t.browser,S.browser,p);assert(t.browser.total===7&&t.browser.passed===7&&['failed','retried','missing','fatalCount'].every(k=>t.browser[k]===0),p,'RESULT');
  unique(t.scenarios,s=>s.scenario,p);assert(sameSet(t.scenarios.map(s=>s.scenario),TC18_SCENARIOS),p,'TC18_CONTROL');
  unique(t.controls,c=>c.scenario,p);assert(sameSet(t.controls.map(c=>c.scenario),[...TC18_SCENARIOS,'operator']),p,'TC18_CONTROL');
  const controls=new Map();for(const c of t.controls){exact(c,S.control,p);controls.set(c.scenario,canaries(c.canaries));}
  // The pinned safe wrapper explicitly checks the submitted TEMP_PIN for this fixture.
  assert(controls.get('complete:denial').includes('123'+'456'),p,'TC18_CONTROL');
  const all=new Set();const budget={nodes:0};
  for(const s of t.scenarios){exact(s,S.capture,p);const secrets=canaries(s.canaries);assert(sameSet(secrets,controls.get(s.scenario)),p,'TC18_CONTROL');secrets.forEach(x=>all.add(x));sinks(s.sinks,s.scenario,secrets,budget);}
  exact(t.operator,S.operator,p);const op=canaries(t.operator.canaries);assert(sameSet(op,controls.get('operator')),p,'TC18_CONTROL');op.forEach(x=>all.add(x));sinks(t.operator.sinks,'operator',op,budget);
  unique(t.files,f=>path(f.path,p).toLowerCase(),p);assert(TC18_REQUIRED_FILES.every(file=>t.files.some(f=>f.path===file))&&t.files.length<=1000,p,'TC18_FILE');
  const needles=needlesFor([...all]);for(const f of t.files){
    exact(f,S.file,p);path(f.path,p);assert(f.type==='REGULAR'&&f.readable===true&&f.postExit===true,p,'TC18_FILE');hash(f.sha256,p);integer(f.bytes,p);
    assert(typeof f.rawBase64==='string'&&f.rawBase64.length<=262144&&/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(f.rawBase64),p,'TC18_FILE');
    const bytes=Buffer.from(f.rawBase64,'base64');assert(bytes.toString('base64')===f.rawBase64&&bytes.length===f.bytes&&sha256(bytes)===f.sha256,p,'ARTIFACT');
    assert(!needles.some(n=>bytes.includes(Buffer.from(n))),p,'CANARY_LEAK');
    if(extname(f.path).toLowerCase()==='.json')scan(parseText(bytes.toString('utf8'),p),needles,budget);
  }
  return {scenarioCount:20,operatorCount:1,sinkSlots:231,requiredFileCount:47,suppliedFileCount:t.files.length,scanKind:'SUPPLIED_BYTES_AND_JSON_NO_OCR',afterChildExit:'SUPPLIED_SIMULATION'};
}
function checkTc19(value){
  const t=exact(value,S.tc19,p);assert(t.expectedEmptyStoreSet===true&&t.authCount===66&&t.storageObjectCount===1&&t.cliMigrations===16&&t.exclusiveSeedBytes===0,p,'TC19_PRESERVATION');
  unique(t.relations,r=>r.relation,p);assert(sameSet(t.relations.map(r=>r.relation),TC19_RELATIONS),p,'TC19_PRESERVATION');
  for(const r of t.relations){exact(r,S.relation,p);assert(r.lockedCount===0,p,'TC19_PRESERVATION');}
  exact(t.checks,S.tc19Checks,p);assert(S.tc19Checks.every(k=>t.checks[k]===true),p,'TC19_PRESERVATION');
  exact(t.before,S.preservation,p);exact(t.after,S.preservation,p);for(const key of S.preservation){hash(t.before[key],p);hash(t.after[key],p);assert(t.before[key]===t.after[key],p,'TC19_PRESERVATION');}
  return {lockedRelations:18,preservation:'DECLARED_DIGEST_EQUALITY_ONLY',actualReadback:'NOT_RUN',actualBytesAuthenticated:false};
}
export function checkPin19Evidence(manifestJson,evidenceJson){
  assert(typeof manifestJson==='string'&&typeof evidenceJson==='string',p,'INPUT');
  const m=manifestInput(manifestJson),e=exact(parseText(evidenceJson,p),S.evidence,p);
  return checkEvidenceRecords(m,e,P);
}
function checkEvidenceRecords(m,e,pins){
  assert(e.schemaVersion==='permission-full-pin19-evidence-v1'&&e.evidenceMode==='SIMULATION',p,'ENUM');
  assert(e.baseCommit===pins.baseCommit&&e.baseTree===pins.baseTree&&e.manifestSha256===pins.manifestSha256&&e.sourceFingerprint===pins.sourceFingerprint&&e.lockSha256===pins.lockSha256,p,'BINDING');hash(e.recipeSha256,p);
  // Only known static identities can be checked. Missing identities always remain explicit STOP;
  // no input can make the unresolved execution plan runnable.
  const expected=new Map();for(const t of m.mappings.filter(t=>t.identityState==='STATIC_INFERRED')){if(!expected.has(t.stage))expected.set(t.stage,[]);expected.get(t.stage).push(t);}
  unique(e.stages,s=>s.stage,p);assert(sameSet(e.stages.map(s=>s.stage),[...expected.keys()]),p,'STAGE_SET');
  unique(e.stages,s=>s.runId,p);unique(e.stages,s=>s.nonce,p);
  let checkedIdentities=0;const backends=new Map();for(const s of e.stages){
    exact(s,S.stage,p);const rows=expected.get(s.stage),first=rows[0];assert(rows.every(r=>r.runtimeProfile===first.runtimeProfile&&r.config.sha256===first.config.sha256),p,'BINDING');
    assert(s.runtimeProfile===first.runtimeProfile&&s.executionKind===first.executionKind&&s.configSha256===first.config.sha256&&s.sourceFingerprint===e.sourceFingerprint&&s.manifestSha256===e.manifestSha256&&s.lockSha256===e.lockSha256&&s.recipeSha256===e.recipeSha256,p,'BINDING');
    assert(uuid(s.runId)&&uuid(s.nonce)&&s.attempt===1,p,'BINDING');if(s.executionKind==='static')assert(s.backendIdentity===null,p,'BINDING');else {hash(s.backendIdentity,p);if(backends.has(s.runtimeProfile))assert(backends.get(s.runtimeProfile)===s.backendIdentity,p,'BINDING');else{assert(![...backends.values()].includes(s.backendIdentity),p,'BINDING');backends.set(s.runtimeProfile,s.backendIdentity);}}
    observerContract(s);
    assert(utc(s.finishedAt)>=utc(s.startedAt),p,'TIME');
    exact(s.documents,S.documents,p);exact(s.artifacts,S.documents,p);const docs=Object.create(null);
    for(const kind of S.documents){docs[kind]=parseText(s.documents[kind],p);descriptor(s.artifacts[kind]);assert(sha256(s.documents[kind])===s.artifacts[kind].rawSha256&&contentHash(docs[kind])===s.artifacts[kind].contentSha256&&Buffer.byteLength(s.documents[kind])===s.artifacts[kind].bytes,p,'ARTIFACT');}
    exact(docs.discovery,['tests'],p);unique(docs.discovery.tests,t=>identity(t),p);for(const t of docs.discovery.tests){exact(t,S.identity,p);identityRow(t);}
    const wanted=[...new Set(rows.map(identity))];assert(sameSet(docs.discovery.tests.map(identity),wanted),p,'IDENTITY_SET');
    exact(docs.results,['tests'],p);unique(docs.results.tests,t=>identity(t),p);assert(sameSet(docs.results.tests.map(identity),wanted),p,'IDENTITY_SET');
    for(const t of docs.results.tests){exact(t,S.result,p);identityRow(t);assert(t.expectedStatus==='passed'&&t.actualStatus==='passed'&&t.attempts===1&&t.retries===0&&t.repeatIndex===0&&t.skip===false&&t.only===false&&t.todo===false,p,'RESULT');}
    exact(docs.options,S.options,p);exact(docs.options.config,S.source,p);assert(docs.options.config.path===first.config.path&&docs.options.config.sha256===first.config.sha256&&docs.options.forbidOnly===true&&docs.options.retries===0&&docs.options.repeatEach===1&&docs.options.workers===1&&docs.options.noFilter===(pins.partitionedStages?.includes(s.stage)?false:true),p,'OPTIONS');
    exact(s.attestation,S.attestation,p);for(const key of S.attestation.filter(k=>k!=='artifacts'))assert(s.attestation[key]===s[key],p,'ATTESTATION');exact(s.attestation.artifacts,S.documents,p);
    for(const kind of S.documents){descriptor(s.attestation.artifacts[kind]);assert(contentHash(s.attestation.artifacts[kind])===contentHash(s.artifacts[kind]),p,'ATTESTATION');}
    checkedIdentities+=wanted.length;
  }
  unique(e.dependencies,d=>d.id,p);assert(sameSet(e.dependencies.map(d=>d.id),m.dependencies.map(d=>d.id)),p,'DEPENDENCY');
  for(const d of e.dependencies){exact(d,S.dependencyEvidence,p);if(pins.integrated)assert(d.state==='SIMULATION_VERIFIED'&&d.sha256===pins.dependencyDigests.get(d.id),p,'DEPENDENCY');else assert(d.state==='NOT_RUN'&&d.sha256===null,p,'DEPENDENCY');}
  const tc18=checkTc18(e.tc18),tc19=checkTc19(e.tc19);
  return {...model('SIMULATION','MATCH'),schemaVersion:'permission-full-pin19-consistency-v1',manifestState:'PARTIAL',planDecision:'STOP',checkedKnownIdentities:checkedIdentities,unresolvedIdentityCount:m.mappings.filter(t=>t.identityState==='UNKNOWN').length,tc18,tc19,missingInputs:m.gaps,dependencies:'NOT_RUN',limitations:['Supplied byte hashes and backend/attestation bindings are not authenticated or actual observations.','Unknown identities and oracle closure remain outside this consistency MATCH.','No per-case execution PASS is inferred from identity/count totals.']};
}

export function checkIntegratedPinEvidence(reviewedManifestJson,evidenceJson,contextJson,expectedSourceIndexJson){return checked(()=>{demand(typeof evidenceJson==='string'&&Buffer.byteLength(evidenceJson)<=262144,'INPUT');return integratedPinRecords(reviewedManifestJson,evidenceJson,contextJson,expectedSourceIndexJson);});}
// Full aggregate semantics is private: only the verified decoder below may
// pass a payload exceeding the original 256KiB primitive evidence boundary.
function integratedPinRecords(reviewedManifestJson,evidenceJson,contextJson,expectedSourceIndexJson){return checked(()=>{
 const c=record(largeData(contextJson),['sourceIdentity','integratedManifestSha256','sourceIndexJson','fullStages','partition','dependencyDigests','registrationReceiptJson']);sourceIdentity(c.sourceIdentity);demand(sourceHex(c.integratedManifestSha256),'SOURCE');
 const m=structuredClone(manifestInput(reviewedManifestJson));demand(typeof c.sourceIndexJson==='string'&&Array.isArray(c.fullStages)&&Array.isArray(c.dependencyDigests),'SCHEMA');
 const {index:sourceRows}=sourceIndex(JSON.stringify(c.sourceIdentity),c.sourceIndexJson,expectedSourceIndexJson);const index=new Map([...sourceRows].map(([path,r])=>[path,r.sha256])),e=exact(largeData(evidenceJson),S.evidence,p);
 demand(index.get('tests/permissions/full-pin19-integrated.json')===c.integratedManifestSha256&&e.recipeSha256===c.sourceIdentity.recipeSha256,'SOURCE');
 demand(typeof c.registrationReceiptJson==='string'&&index.get('tests/permissions/full-pin-closeout-registrations.json')===sourceHash(c.registrationReceiptJson),'SOURCE');
 const registration=record(data(c.registrationReceiptJson),['version','origin','source','configs','tests']);record(registration.source,['path','sha256']);demand(registration.version==='permission-closeout-registrations-v1'&&registration.source.path==='tests/supabase/ownerPinOnboardingCloseout.spec.ts'&&index.get(registration.source.path)===registration.source.sha256&&Array.isArray(registration.configs)&&registration.configs.length===2&&Array.isArray(registration.tests),'SOURCE');
 const configs=new Map();for(const r of registration.configs){record(r,['path','sha256']);demand(index.get(r.path)===r.sha256&&!configs.has(r.path),'SOURCE');configs.set(r.path,r.sha256);}demand(configs.has('playwright.pin-onboard-closeout.config.ts')&&configs.has('playwright.pin-tc18.config.ts'),'SOURCE');
 const part=partitionDiscovery(JSON.stringify(c.partition));demand(part.modelDecision==='MATCH'&&JSON.stringify(c.partition.sourceIdentity)===JSON.stringify(c.sourceIdentity),'PARTITION');
 const registered=[];for(const t of registration.tests){exact(t,S.identity,p);identityRow(t);demand(t.file===registration.source.path,'SOURCE');registered.push(identity(t));}demand(new Set(registered).size===registered.length&&sameSet(registered,c.partition.fullFile.map(identity)),'PARTITION');
 const group=new Map();for(const r of m.mappings.filter(r=>r.identityState==='STATIC_INFERRED')){if(!group.has(r.stage))group.set(r.stage,[]);group.get(r.stage).push(r);}
 demand(c.fullStages.length===group.size,'PARTITION');const seen=new Set(),rebased=[],partitioned=[];
 for(const stage of c.fullStages){record(stage,['stage','configPath','configSha256','tests']);demand(typeof stage.stage==='string'&&group.has(stage.stage)&&!seen.has(stage.stage)&&Array.isArray(stage.tests),'PARTITION');seen.add(stage.stage);
  const original=group.get(stage.stage),first=original[0];demand(stage.configPath===first.config.path&&index.get(stage.configPath)===stage.configSha256,'SOURCE');
  const keys=[];for(const t of stage.tests){exact(t,S.identity,p);identityRow(t);demand(index.has(t.file),'SOURCE');keys.push(identity(t));rebased.push({...first,id:'d1-fullfile-'+rebased.length,file:t.file,fullName:t.fullName,project:t.project,config:{path:stage.configPath,sha256:stage.configSha256}});}
  demand(new Set(keys).size===keys.length&&original.every(t=>keys.includes(identity(t))),'PARTITION');
  if(stage.configPath==='playwright.pin-onboard-closeout.config.ts'||stage.configPath==='playwright.pin-tc18.config.ts'){
   const wanted=stage.configPath==='playwright.pin-tc18.config.ts'?c.partition.tc18:c.partition.ordinary;demand(sameSet(keys,wanted.map(identity)),'PARTITION');partitioned.push(stage.stage);
  }
 }
 const deps=new Map();for(const d of c.dependencyDigests){record(d,['id','sha256']);demand(typeof d.id==='string'&&sourceHex(d.sha256)&&!deps.has(d.id),'BINDING');deps.set(d.id,d.sha256);}demand(m.dependencies.every(d=>deps.has(d.id))&&deps.size===m.dependencies.length,'BINDING');
 m.mappings=rebased;const pins={...P,sourceFingerprint:c.sourceIdentity.sourceFingerprint,lockSha256:c.sourceIdentity.lockSha256,manifestSha256:c.integratedManifestSha256,integrated:true,partitionedStages:partitioned,dependencyDigests:deps};
 const checked=checkEvidenceRecords(m,e,pins);return result('MATCH',{component:checked,sourceIdentity:c.sourceIdentity,origin:'P03_REQUIRED_IDENTITIES_PRESERVED_PLUS_FULL_FILE_SOURCE_CONTRACT',partition:part,actualDiscovery:'NOT_RUN',projectionAuthority:false});
});}

export function createIntegratedPinReceiver(expectedJson,reviewedManifestJson,sourceContractJson){
 const c=record(data(expectedJson),['sourceIdentity','reviewedManifestSha256','sourceContractSha256','payloadSha256','payloadBytes','expectedSourceIndexSha256']);sourceIdentity(c.sourceIdentity);
 demand(typeof reviewedManifestJson==='string'&&typeof sourceContractJson==='string'&&sourceHex(c.reviewedManifestSha256)&&sourceHash(reviewedManifestJson)===c.reviewedManifestSha256&&sourceHex(c.sourceContractSha256)&&sourceHash(sourceContractJson)===c.sourceContractSha256&&sourceHex(c.payloadSha256)&&Number.isSafeInteger(c.payloadBytes)&&c.payloadBytes>0,'SOURCE');
 const contract=largeData(sourceContractJson);demand(contract&&typeof contract==='object'&&JSON.stringify(contract.sourceIdentity)===JSON.stringify(c.sourceIdentity),'SOURCE');
 const expectedIndexJson=JSON.stringify({sourceFingerprint:c.sourceIdentity.sourceFingerprint,graphSha256:c.sourceIdentity.graphSha256,expectedSourceIndexSha256:c.expectedSourceIndexSha256});sourceIndex(JSON.stringify(c.sourceIdentity),contract.sourceIndexJson,expectedIndexJson);
 const bindingSha256=sourceHash(JSON.stringify(c)),decoder=createChunkDecoder(bindingSha256,c.payloadSha256,c.payloadBytes);let poisoned=false,finished=false;
 return Object.freeze({push(frameText){demand(!poisoned&&!finished,'BINDING');try{return decoder.push(frameText);}catch(e){poisoned=true;throw e;}},finish(commitText){demand(!poisoned&&!finished,'BINDING');finished=true;return checked(()=>{let raw;try{raw=decoder.finish(commitText);}catch{poisoned=true;demand(false,'BINDING');}const checked=integratedPinRecords(reviewedManifestJson,raw,sourceContractJson,expectedIndexJson);return result(checked.modelDecision,{component:checked,sourceIdentity:c.sourceIdentity,rawPayloadSha256:sourceHash(raw),rawPayloadBytes:Buffer.byteLength(raw),bindingSha256,framing:'VERIFIED_COMPLETE_BEFORE_SEMANTICS',actualObservation:'NOT_RUN'});});}});
}
