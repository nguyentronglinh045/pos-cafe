// Pure preparation model. Only primitive JSON crosses the boundary. No IO or runtime adapters.
import {createHash} from 'node:crypto';

export const PIN19_PINS = Object.freeze({
  manifestSha256:'823eb39a478670e4f184e29fc0b4540a9c6410aa7a71efa44702bb7f8100105d',
  manifestContentSha256:'d71fe0347473ff18ab60c2181cb07f3540e6984601ef79f6ae49cfdb9da452d0',
  sourceInventorySha256:'cc858149275a4c5fc22fca6d9e8e0d5813b3668473af6f18682c7f2f41fffba1',
  sourceInventoryContentSha256:'9ce243c0df41916a64b0e7c7ac93792a5e273c8e3239d4c000106c92ebbf93d7',
  outputCatalogSha256:'17507aa3aef63e39ecdc4fce602f2ca41ef93abf91ccec093bb7ffc573fdc4d8',
  outputCatalogContentSha256:'edf85888a9a3d0948208e965747b2d6f065a38ba56903eacf1e41298e6b7aeae',
  sourceFingerprint:'acfe2aeff0e62303a96c78383934c3066155255e0988ce61a69cc9993dc84393',
  lockSha256:'85969c1c161f74e9f68563182d99d1b0ac6fb5f17f5074444f329675ffd34e18',
  baseCommit:'567af2191400ef559e90b3eccae0a0e4992f82e5',
  baseTree:'5b8667b4c421a7e6c47f566e1634129799a5f83d',
});
export const PIN19_ERRORS=Object.freeze({
  plan:Object.freeze(['PIN_PLAN_INPUT','PIN_PLAN_LIMIT','PIN_PLAN_JSON','PIN_PLAN_DUPLICATE_KEY','PIN_PLAN_NUMBER','PIN_PLAN_KEYS','PIN_PLAN_TYPE','PIN_PLAN_ENUM','PIN_PLAN_PATH','PIN_PLAN_HASH','PIN_PLAN_DUPLICATE','PIN_PLAN_CASE_SET','PIN_PLAN_SUBVARIANT','PIN_PLAN_IDENTITY','PIN_PLAN_SOURCE','PIN_PLAN_MANIFEST_BINDING','PIN_PLAN_INVENTORY_BINDING','PIN_PLAN_BOUNDS']),
  evidence:Object.freeze(['PIN_EVIDENCE_INPUT','PIN_EVIDENCE_LIMIT','PIN_EVIDENCE_JSON','PIN_EVIDENCE_DUPLICATE_KEY','PIN_EVIDENCE_NUMBER','PIN_EVIDENCE_KEYS','PIN_EVIDENCE_TYPE','PIN_EVIDENCE_ENUM','PIN_EVIDENCE_PATH','PIN_EVIDENCE_HASH','PIN_EVIDENCE_DUPLICATE','PIN_EVIDENCE_BINDING','PIN_EVIDENCE_STAGE_SET','PIN_EVIDENCE_IDENTITY_SET','PIN_EVIDENCE_RESULT','PIN_EVIDENCE_OPTIONS','PIN_EVIDENCE_TIME','PIN_EVIDENCE_ARTIFACT','PIN_EVIDENCE_ATTESTATION','PIN_EVIDENCE_TC18_CONTROL','PIN_EVIDENCE_TC18_SINK','PIN_EVIDENCE_TC18_FILE','PIN_EVIDENCE_CANARY_LEAK','PIN_EVIDENCE_TC19_PRESERVATION','PIN_EVIDENCE_DEPENDENCY']),
});
const profiles=['STATIC','PIN_ONBOARD','PIN_IDENTITY','PIN_CANARY'];
function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
export const PIN19_INTERFACE=freeze({
  schemaVersion:'permission-full-pin19-interface-v1', input:'primitive JSON text; UTF8 bytes<=262144; depth<=40; nodes<=20000; integers safe; duplicate keys refused',
  manifest:['schemaVersion','baseCommit','baseTree','testplan','sources','cases','mappings','dependencies','gaps'],
  source:['path','sha256'], inventory:['schemaVersion','baseCommit','baseTree','testplan','sources'], inventorySource:['path','sha256','bytes','representation'],testplan:['path','sha256','bytes','representation'],
  case:['id','subvariants'],subvariant:['id','oracle','mappingIds','closure','oracleRefs'],oracleRef:['path','sha256','lineStart','lineEnd'],
  mapping:['id','stage','runner','file','fullName','project','executionKind','runtimeProfile','config','source','dependencies','selectionPolicy','identityState','reason'],mappingSource:['path','sha256','line'],
  dependency:['id','runner','entry','oracle','identityState','reason'],missingInput:['owner','field','reason','nextAction'],
  outputCatalog:['schemaVersion','writers'],writer:['writerId','profile','stage','kind','maximumBytes','allocatedMaxBytes','durationMaxSeconds','countMax','retentionMaxBytes','state','boundSource','lifetime','overlap','placement','unknownReason'],
  evidence:['schemaVersion','evidenceMode','manifestSha256','baseCommit','baseTree','sourceFingerprint','lockSha256','recipeSha256','stages','tc18','tc19','dependencies'],
  stage:['stage','runtimeProfile','executionKind','runId','attempt','nonce','backendIdentity','observer','observerSha256','startedAt','finishedAt','sourceFingerprint','manifestSha256','configSha256','lockSha256','recipeSha256','documents','artifacts','attestation'],
  documents:['discovery','results','options'],artifact:['rawSha256','contentSha256','bytes'],
  attestation:['runId','attempt','nonce','backendIdentity','observerSha256','stage','runtimeProfile','executionKind','sourceFingerprint','manifestSha256','configSha256','lockSha256','recipeSha256','startedAt','finishedAt','artifacts'],
  observer:['kind','declaredOnly','backendIdentity','fixtureSha256','schemaSha256','catalogSha256','appliedArtifactSha256','apiBindingSha256','services'],
  identity:['file','fullName','project'],result:['file','fullName','project','expectedStatus','actualStatus','attempts','retries','repeatIndex','skip','only','todo'],
  options:['config','forbidOnly','retries','repeatEach','workers','noFilter'],
  tc18:['phase','childExit','browser','scenarios','controls','operator','files','maskedFormAsserted'],browser:['total','passed','failed','retried','missing','fatalCount'],capture:['scenario','canaries','sinks'],control:['scenario','canaries'],operator:['canaries','sinks'],sink:['captured','data'],notApplicable:['notApplicable','reason'],file:['path','readable','type','postExit','rawBase64','sha256','bytes'],
  tc19:['expectedEmptyStoreSet','relations','checks','before','after','authCount','storageObjectCount','cliMigrations','exclusiveSeedBytes'],relation:['relation','lockedCount'],
  tc19Checks:['sourceConfigBundleMarkerMatch','tenantDriftRejected','orphanDriftRejected','schemaDriftRejected','storeSetDriftRejected','writerBeforeLockVisible','writerAfterLockBlocked','faultRollbackCatalogAcl','newOwnerRestricted','neverReuseSeededPilot'],
  preservation:['authRowsSha256','authIdentitiesSha256','storageMetadataSha256','storageGetBytesSha256','configSha256','catalogAclSha256'],dependencyEvidence:['id','state','sha256'],
  enums:{runtimeProfile:profiles,runner:['vitest','playwright'],executionKind:['static','service'],identityState:['STATIC_INFERRED','UNKNOWN'],closure:['STATIC_MAPPED','UNKNOWN'],evidenceMode:['SIMULATION'],selectionPolicy:['EXACT_DISCOVERY_EQUAL_NO_FILTER']},
  constraints:'All arrays are bounded by input cap and node limit, unique semantic IDs/paths. Paths are relative ASCII segments without dot/dotdot, colon, backslash, leading slash, empty component, trailing dot/space or Windows device aliases. Hash=lowercase64hex; Git=exact base40hex. Date=canonical UTC milliseconds; workflow runId is not stage UUID. Typed records exact keys. Capture.data is opaque JSON scanned recursively. Initial writer maxima must all remain null/UNKNOWN. Outputs never carry supplied capture/documents/secrets.',
  errors:PIN19_ERRORS,
  bindingSemantics:'manifestSha256/sourceInventorySha256/outputCatalogSha256 pin exact file bytes; their ContentSha256 fields pin JSON.stringify(parsed) order. sourceFingerprint is this versioned pure inventory digest, not permissionFingerprint() or an observed runtime fingerprint. recipeSha256 and backend identities in SIMULATION are supplied consistency bindings, not measured/authenticated facts. TC19 catalogAclSha256 is the fault-rollback pair; other before/after hashes preserve unrelated objects across activation. storageMetadataSha256 must cover both buckets and objects.',
});
export function refuse(prefix,suffix){const code=prefix+'_'+suffix;if(!Object.values(PIN19_ERRORS).some(a=>a.includes(code)))throw new Error('PIN_PLAN_ENUM');throw new Error(code);}
export const sha256=value=>createHash('sha256').update(value).digest('hex');
export const jsonHash=value=>sha256(JSON.stringify(value));
export function contentHash(value){return sha256(canonical(value));}
function canonical(value){if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';return JSON.stringify(value);}
export function assert(ok,prefix,code){if(!ok)refuse(prefix,code);}
export function exact(value,keys,prefix='PIN_PLAN'){
  assert(value!==null&&typeof value==='object'&&!Array.isArray(value),prefix,'TYPE');
  const actual=Object.keys(value);assert(actual.length===keys.length&&actual.every(k=>keys.includes(k)),prefix,'KEYS');return value;
}
export function string(value,prefix='PIN_PLAN',limit=2048){assert(typeof value==='string'&&value.length>0&&value.length<=limit,prefix,'TYPE');return value;}
export function integer(value,prefix='PIN_PLAN'){assert(Number.isSafeInteger(value)&&value>=0,prefix,'NUMBER');return value;}
export function hash(value,prefix='PIN_PLAN'){assert(typeof value==='string'&&/^[a-f0-9]{64}$/.test(value),prefix,'HASH');return value;}
export function choice(value,values,prefix='PIN_PLAN'){assert(values.includes(value),prefix,'ENUM');return value;}
export function path(value,prefix='PIN_PLAN'){
  string(value,prefix,512);const segments=value.split('/');
  assert(!/[^A-Za-z0-9_./-]/.test(value)&&segments.every(p=>p&&p!=='.'&&p!=='..'&&!p.endsWith('.')&&!/^(?:CON|PRN|AUX|NUL|COM[0-9]|LPT[0-9])(?:\.|$)/i.test(p)),prefix,'PATH');return value;
}
export function unique(array,key,prefix='PIN_PLAN'){
  assert(Array.isArray(array),prefix,'TYPE');let ids;try{ids=array.map(key);}catch(error){if(error instanceof Error&&Object.values(PIN19_ERRORS).some(a=>a.includes(error.message)))throw error;refuse(prefix,'TYPE');}assert(new Set(ids).size===ids.length,prefix,'DUPLICATE');return array;
}
// Tiny strict JSON parser. No reviver/coercion, and no JSON.parse loss of duplicate keys.
export function parseText(input,prefix='PIN_PLAN'){
  assert(typeof input==='string',prefix,'INPUT');assert(Buffer.byteLength(input,'utf8')<=262144,prefix,'LIMIT');
  let i=0,nodes=0;const ws=()=>{while(i<input.length&&/[\t\n\r ]/.test(input[i]))i++;};
  const bad=()=>refuse(prefix,'JSON');
  const str=()=>{const start=i++;while(i<input.length){const c=input[i++];if(c==='"'){let value;try{value=JSON.parse(input.slice(start,i));}catch{bad();}assert(!/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(value),prefix,'JSON');return value;}if(c==='\\'){if(i>=input.length)bad();i++;}else if(c<' ')bad();}bad();};
  const value=depth=>{
    assert(depth<=40&&++nodes<=20000,prefix,'LIMIT');ws();const c=input[i];
    if(c==='"')return str();
    if(c==='{'||c==='['){i++;const object=c==='{';const out=object?Object.create(null):[];const end=object?'}':']';const seen=new Set();ws();if(input[i]===end){i++;return out;}
      for(;;){ws();let key;if(object){if(input[i]!=='"')bad();key=str();assert(!seen.has(key),prefix,'DUPLICATE_KEY');seen.add(key);ws();if(input[i++]!==':')bad();}const v=value(depth+1);if(object)out[key]=v;else out.push(v);ws();if(input[i]===end){i++;break;}if(input[i++]!==',')bad();}return out;
    }
    for(const [word,result] of [['true',true],['false',false],['null',null]])if(input.startsWith(word,i)){i+=word.length;return result;}
    const number=input.slice(i).match(/^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/);if(!number)bad();i+=number[0].length;const parsed=Number(number[0]);assert(Number.isSafeInteger(parsed)&&!Object.is(parsed,-0),prefix,'NUMBER');return parsed;
  };
  const result=value(0);ws();if(i!==input.length)bad();return result;
}
export function model(mode='PLAN_ONLY',decision='STOP'){
  return {modelDecision:decision,evidenceMode:mode,valid:false,authentication:'NOT_PROVEN',execution:'NOT_RUN',runtimeAdmission:'NOT_RUN',fullGate:'NOT_RUN',custodyObserved:'NOT_RUN',effects:0,executionEligibility:'STOP'};
}
export function manifestInput(text){
  const p='PIN_PLAN',m=exact(parseText(text),PIN19_INTERFACE.manifest);choice(m.schemaVersion,['permission-full-pin19-manifest-v1']);
  assert(m.baseCommit===PIN19_PINS.baseCommit&&m.baseTree===PIN19_PINS.baseTree,p,'SOURCE');
  exact(m.testplan,PIN19_INTERFACE.source);path(m.testplan.path);hash(m.testplan.sha256);
  unique(m.sources,s=>s.path);for(const s of m.sources){exact(s,PIN19_INTERFACE.source);path(s.path);hash(s.sha256);}
  const sources=new Map(m.sources.map(s=>[s.path,s.sha256]));
  assert(Array.isArray(m.cases),p,'TYPE');
  for(const c of m.cases){exact(c,PIN19_INTERFACE.case);string(c.id,p);}
  unique(m.cases,c=>c.id);assert(m.cases.length===19&&m.cases.every(c=>/^TC-PIN-(?:0[1-9]|1[0-9])$/.test(c.id)),p,'CASE_SET');
  for(const c of m.cases){exact(c,PIN19_INTERFACE.case);unique(c.subvariants,s=>s.id);assert(c.subvariants.length>0,p,'SUBVARIANT');for(const s of c.subvariants){exact(s,PIN19_INTERFACE.subvariant);path(s.id);string(s.oracle);choice(s.closure,['STATIC_MAPPED','UNKNOWN']);unique(s.mappingIds,x=>string(x));unique(s.oracleRefs,r=>JSON.stringify(r));for(const r of s.oracleRefs){exact(r,PIN19_INTERFACE.oracleRef);path(r.path);hash(r.sha256);integer(r.lineStart);integer(r.lineEnd);assert(r.lineStart>0&&r.lineEnd>=r.lineStart&&sources.get(r.path)===r.sha256,p,'SOURCE');}assert(s.closure==='STATIC_MAPPED'?s.oracleRefs.length>0:s.oracleRefs.length===0,p,'SUBVARIANT');}}
  unique(m.mappings,x=>x.id);for(const t of m.mappings){
    exact(t,PIN19_INTERFACE.mapping);string(t.id);path(t.stage);choice(t.runner,['vitest','playwright']);path(t.file);choice(t.runtimeProfile,profiles);choice(t.executionKind,['static','service']);assert((t.runtimeProfile==='STATIC')===(t.executionKind==='static'),p,'IDENTITY');
    exact(t.config,PIN19_INTERFACE.source);path(t.config.path);hash(t.config.sha256);exact(t.source,PIN19_INTERFACE.mappingSource);path(t.source.path);hash(t.source.sha256);integer(t.source.line);assert(t.source.line>0&&t.source.path===t.file&&sources.get(t.file)===t.source.sha256&&sources.get(t.config.path)===t.config.sha256,p,'SOURCE');
    unique(t.dependencies,x=>path(x));assert(t.dependencies.every(x=>sources.has(x)),p,'SOURCE');choice(t.selectionPolicy,['EXACT_DISCOVERY_EQUAL_NO_FILTER']);choice(t.identityState,['STATIC_INFERRED','UNKNOWN']);string(t.reason);
    if(t.identityState==='STATIC_INFERRED'){string(t.fullName);assert(t.runner==='playwright'?typeof t.project==='string'&&t.project.length>0:t.project===null,p,'IDENTITY');}
    else assert(t.fullName===null&&(t.project===null||typeof t.project==='string'),p,'IDENTITY');
  }
  unique(m.mappings,t=>t.identityState==='UNKNOWN'?t.id:JSON.stringify([t.stage,t.file,t.fullName,t.project]));
  const ids=new Set(m.mappings.map(t=>t.id));assert(m.cases.every(c=>c.subvariants.every(s=>s.mappingIds.every(id=>ids.has(id)))),p,'IDENTITY');
  unique(m.dependencies,d=>d.id);for(const d of m.dependencies){exact(d,PIN19_INTERFACE.dependency);for(const k of PIN19_INTERFACE.dependency)string(d[k]);choice(d.identityState,['UNKNOWN']);}
  assert(Array.isArray(m.gaps)&&m.gaps.length>0,p,'TYPE');for(const g of m.gaps){exact(g,PIN19_INTERFACE.missingInput);choice(g.owner,['P','R','D','A','B','L']);for(const k of ['field','reason','nextAction'])string(g[k],p,8192);}
  assert(jsonHash(m)===PIN19_PINS.manifestContentSha256&&sha256(text)===PIN19_PINS.manifestSha256,p,'MANIFEST_BINDING');return m;
}
export function planPin19(manifestJson,sourceInventoryJson){
  // Check both boundaries before touching either caller-controlled argument.
  assert(typeof manifestJson==='string'&&typeof sourceInventoryJson==='string','PIN_PLAN','INPUT');
  const m=manifestInput(manifestJson),inv=exact(parseText(sourceInventoryJson),PIN19_INTERFACE.inventory);
  choice(inv.schemaVersion,['permission-full-pin19-source-inventory-v1']);assert(inv.baseCommit===m.baseCommit&&inv.baseTree===m.baseTree,'PIN_PLAN','SOURCE');
  exact(inv.testplan,PIN19_INTERFACE.testplan);path(inv.testplan.path);hash(inv.testplan.sha256);integer(inv.testplan.bytes);choice(inv.testplan.representation,['SNAPSHOT_BYTES']);
  unique(inv.sources,s=>s.path);for(const s of inv.sources){exact(s,PIN19_INTERFACE.inventorySource);path(s.path);hash(s.sha256);integer(s.bytes);choice(s.representation,['GIT_BLOB_LF']);}
  assert(jsonHash(inv)===PIN19_PINS.sourceInventoryContentSha256&&sha256(sourceInventoryJson)===PIN19_PINS.sourceInventorySha256,'PIN_PLAN','INVENTORY_BINDING');
  return {...model(),schemaVersion:'permission-full-pin19-plan-v1',manifestState:'PARTIAL',planDecision:'STOP',caseCount:19,subvariantCount:m.cases.reduce((n,c)=>n+c.subvariants.length,0),staticOracleMappedCount:m.cases.reduce((n,c)=>n+c.subvariants.filter(v=>v.closure==='STATIC_MAPPED').length,0),mappingCount:m.mappings.length,staticIdentityCount:m.mappings.filter(t=>t.identityState==='STATIC_INFERRED').length,unknownIdentityCount:m.mappings.filter(t=>t.identityState==='UNKNOWN').length,actualDiscovery:'NOT_RUN',manifestSha256:PIN19_PINS.manifestSha256,sourceFingerprint:PIN19_PINS.sourceFingerprint,missingInputs:m.gaps};
}
export function pin19Bounds(manifestJson,outputCatalogJson){
  assert(typeof manifestJson==='string'&&typeof outputCatalogJson==='string','PIN_PLAN','INPUT');const m=manifestInput(manifestJson);
  const catalog=exact(parseText(outputCatalogJson),PIN19_INTERFACE.outputCatalog);choice(catalog.schemaVersion,['permission-full-pin19-output-catalog-v1']);unique(catalog.writers,w=>w.writerId);
  for(const w of catalog.writers){exact(w,PIN19_INTERFACE.writer);choice(w.profile,profiles);for(const k of ['writerId','stage','kind','lifetime','overlap','unknownReason'])string(w[k]);
    assert(['maximumBytes','allocatedMaxBytes','durationMaxSeconds','countMax','retentionMaxBytes','boundSource','placement'].every(k=>w[k]===null)&&w.state==='UNKNOWN','PIN_PLAN','BOUNDS');}
  assert(jsonHash(catalog)===PIN19_PINS.outputCatalogContentSha256&&sha256(outputCatalogJson)===PIN19_PINS.outputCatalogSha256,'PIN_PLAN','BOUNDS');
  return {...model(),schemaVersion:'permission-full-pin19-bounds-v1',owner:'P',version:1,planDecision:'STOP',sourceCommit:PIN19_PINS.baseCommit,sourceFingerprint:PIN19_PINS.sourceFingerprint,manifestSha256:PIN19_PINS.manifestSha256,sourceBindings:m.sources,sourceRepresentation:'GIT_BLOB_LF',writers:catalog.writers,policyCeilingsNotMeasured:{globalTaskBytes:21474836480,windowsReserveBytes:32212254720,loopBackingBytes:19327352832,outsideLoopBytes:2147483648,cpus:3,ramBytes:10737418240,swapBytes:0,pids:2048,timeSeconds:1800,oneHeavyEnvironment:true,actualGlobalRetainedBytes:null,technicalQuota:'NOT_RUN'},knownMinimums:{tc18ScenarioCount:20,tc18OperatorCount:1,tc18SinksPerScenario:11,tc18BrowserCount:7,tc18RequiredFiles:47,tc19LockedRelations:18},missingInputs:catalog.writers.map(w=>({owner:'P',field:w.writerId,reason:w.unknownReason,nextAction:'D/B need source-supported maximum bytes/allocated/time/concurrency/physical placement/retention including failure paths; do not substitute fixture size or timeout.'}))};
}
