import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {checkPin19Evidence,TC18_SCENARIOS,TC18_SINKS,TC18_REQUIRED_FILES,TC19_RELATIONS} from './permission-full-pin-collect.mjs';
import {PIN19_PINS as P,PIN19_INTERFACE as S,PIN19_ERRORS as E,sha256,contentHash} from './permission-full-pin-plan.mjs';
const manifest=readFileSync(new URL('../tests/permissions/full-pin19-cases.json',import.meta.url),'utf8');
const parsed=JSON.parse(manifest),secret='12'+'3456';
const uid=n=>'10000000-0000-4000-8000-'+String(n).padStart(12,'0');
const fixed='a'.repeat(64),sinkSet=()=>Object.fromEntries(TC18_SINKS.map(k=>[k,{captured:true,data:{redacted:true}}]));
function fixture(){
  const groups=new Map();for(const t of parsed.mappings.filter(t=>t.identityState==='STATIC_INFERRED')){if(!groups.has(t.stage))groups.set(t.stage,[]);groups.get(t.stage).push(t);}
  let n=0;const stages=[...groups].map(([stage,rows])=>{
    const t=rows[0],tests=rows.map(t=>({file:t.file,fullName:t.fullName,project:t.project}));
    const documents={discovery:JSON.stringify({tests}),results:JSON.stringify({tests:tests.map(t=>({...t,expectedStatus:'passed',actualStatus:'passed',attempts:1,retries:0,repeatIndex:0,skip:false,only:false,todo:false}))}),options:JSON.stringify({config:t.config,forbidOnly:true,retries:0,repeatEach:1,workers:1,noFilter:true})};
    const artifacts=Object.fromEntries(Object.entries(documents).map(([k,v])=>[k,{rawSha256:sha256(v),contentSha256:contentHash(JSON.parse(v)),bytes:Buffer.byteLength(v)}]));
    const s={stage,runtimeProfile:t.runtimeProfile,executionKind:t.executionKind,runId:uid(++n),attempt:1,nonce:uid(++n),backendIdentity:t.executionKind==='static'?null:sha256('simulation backend '+t.runtimeProfile),startedAt:'2026-10-19T00:00:00.000Z',finishedAt:'2026-10-19T00:00:01.000Z',sourceFingerprint:P.sourceFingerprint,manifestSha256:P.manifestSha256,configSha256:t.config.sha256,lockSha256:P.lockSha256,recipeSha256:fixed,documents,artifacts};
    const definition=s.executionKind==='static'?['STATIC_NO_BACKEND',[]]:stage==='pin-identity-server'?['SQL_OBSERVER',['SQL']]:stage==='pin-canary-empty'?['EMPTY_TARGET_OBSERVER',['SQL','AUTH','REST','STORAGE']]:stage==='pin-tc18-wrapper'?['TC18_WRAPPER',['SQL','AUTH','REST','STORAGE','REALTIME','CHROMIUM']]:['BROWSER_AUTH_REST',['SQL','AUTH','REST','CHROMIUM']];
    s.observer={kind:definition[0],declaredOnly:true,backendIdentity:s.backendIdentity,...Object.fromEntries(['fixtureSha256','schemaSha256','catalogSha256','appliedArtifactSha256'].map(k=>[k,s.executionKind==='static'?null:fixed])),apiBindingSha256:s.executionKind==='static'||definition[0]==='SQL_OBSERVER'?null:fixed,services:definition[1]};s.observerSha256=contentHash(s.observer);
    s.attestation=Object.fromEntries(S.attestation.map(k=>[k,structuredClone(s[k])]));return s;
  });
  const tc18={phase:'POST_CHILD_EXIT',childExit:0,browser:{total:7,passed:7,failed:0,retried:0,missing:0,fatalCount:0},scenarios:TC18_SCENARIOS.map(scenario=>({scenario,canaries:[secret],sinks:sinkSet()})),controls:[...TC18_SCENARIOS,'operator'].map(scenario=>({scenario,canaries:[secret]})),operator:{canaries:[secret],sinks:sinkSet()},files:TC18_REQUIRED_FILES.map(path=>{const b=Buffer.from(path.endsWith('.json')?'{}':'opaque simulation bytes');return {path,readable:true,type:'REGULAR',postExit:true,rawBase64:b.toString('base64'),sha256:sha256(b),bytes:b.length};}),maskedFormAsserted:true};
  const before=Object.fromEntries(S.preservation.map(k=>[k,fixed]));
  const tc19={expectedEmptyStoreSet:true,relations:TC19_RELATIONS.map(relation=>({relation,lockedCount:0})),checks:Object.fromEntries(S.tc19Checks.map(k=>[k,true])),before,after:{...before},authCount:66,storageObjectCount:1,cliMigrations:16,exclusiveSeedBytes:0};
  return {schemaVersion:'permission-full-pin19-evidence-v1',evidenceMode:'SIMULATION',manifestSha256:P.manifestSha256,baseCommit:P.baseCommit,baseTree:P.baseTree,sourceFingerprint:P.sourceFingerprint,lockSha256:P.lockSha256,recipeSha256:fixed,stages,tc18,tc19,dependencies:parsed.dependencies.map(d=>({id:d.id,state:'NOT_RUN',sha256:null}))};
}
const encode=e=>JSON.stringify(e);
const finite=fn=>assert.throws(fn,e=>e instanceof Error&&[...E.evidence,...E.plan].includes(e.message));
function doc(e,kind,fn){const s=e.stages[0],v=JSON.parse(s.documents[kind]);fn(v);s.documents[kind]=JSON.stringify(v);const raw=s.documents[kind];s.artifacts[kind]={rawSha256:sha256(raw),contentSha256:contentHash(v),bytes:Buffer.byteLength(raw)};s.attestation.artifacts[kind]={...s.artifacts[kind]};}
test('complete supplied simulation checks known identities, all TC18 slots and TC19 digests without actual PASS',()=>{
  const e=fixture(),text=encode(e);assert(Buffer.byteLength(text)<=262144);const r=checkPin19Evidence(manifest,text);assert.equal(r.modelDecision,'MATCH');assert.equal(r.executionEligibility,'STOP');assert.equal(r.valid,false);assert.equal(r.fullGate,'NOT_RUN');assert.equal(r.authentication,'NOT_PROVEN');assert.equal(r.tc18.sinkSlots,231);assert.equal(r.tc19.actualReadback,'NOT_RUN');assert(!('runId' in r));
});
test('caller objects/proxies are rejected before any trap and never leak thrown payload',()=>{
  let traps=0;const evil=new Proxy({},{get(){traps++;throw Error(secret);},ownKeys(){traps++;throw Error(secret);}});finite(()=>checkPin19Evidence(manifest,evil));finite(()=>checkPin19Evidence(evil,'{}'));assert.equal(traps,0);
});
const mutations=[
 ['synthetic claiming actual',e=>e.evidenceMode='ACTUAL'],['stale source',e=>e.sourceFingerprint='b'.repeat(64)],['mixed manifest',e=>e.manifestSha256='b'.repeat(64)],['mixed config',e=>e.stages[0].configSha256='b'.repeat(64)],['mixed profile',e=>e.stages[0].runtimeProfile='PIN_CANARY'],
 ['workflow decimal runId in stage UUID',e=>e.stages[0].runId='39136704294'],['second attempt',e=>e.stages[0].attempt=2],['inverted time',e=>e.stages[0].finishedAt='2026-10-18T00:00:00.000Z'],['duplicate nonce',e=>e.stages[1].nonce=e.stages[0].nonce],['missing stage',e=>e.stages.pop()],
 ['raw hash mismatch',e=>e.stages[0].artifacts.discovery.rawSha256='b'.repeat(64)],['stale attestation',e=>e.stages[0].attestation.sourceFingerprint='b'.repeat(64)],
 ['extra discovered test',e=>doc(e,'discovery',d=>d.tests.push({file:'tests/extra.test.ts',fullName:'unselected test',project:null}))],['missing identity',e=>doc(e,'results',d=>d.tests.pop())],['wrong fullName',e=>doc(e,'results',d=>d.tests[0].fullName+=' suffix')],
 ['required skip',e=>doc(e,'results',d=>d.tests[0].skip=true)],['retry',e=>doc(e,'results',d=>d.tests[0].retries=1)],['repeat',e=>doc(e,'results',d=>d.tests[0].repeatIndex=1)],['expected failure',e=>doc(e,'results',d=>d.tests[0].expectedStatus='failed')],['only',e=>doc(e,'results',d=>d.tests[0].only=true)],['filter',e=>doc(e,'options',d=>d.noFilter=false)],
 ['same-profile backend drift',e=>{const s=e.stages.find((s,i)=>e.stages.findIndex(t=>t.runtimeProfile===s.runtimeProfile)<i);s.backendIdentity='b'.repeat(64);s.attestation.backendIdentity=s.backendIdentity;}],['profile backend alias',e=>{const s=e.stages.find(s=>s.executionKind==='service'&&s.runtimeProfile!==e.stages[0].runtimeProfile);s.backendIdentity=e.stages[0].backendIdentity;s.attestation.backendIdentity=s.backendIdentity;}],
 ['missing SQL observer catalog',e=>{const s=e.stages.find(s=>s.stage==='pin-identity-server');s.observer.catalogSha256=null;s.observerSha256=contentHash(s.observer);s.attestation.observerSha256=s.observerSha256;}],['TC18 without real-time service contract',e=>{const s=e.stages.find(s=>s.stage==='pin-tc18-wrapper');s.observer.services=s.observer.services.filter(x=>x!=='REALTIME');s.observerSha256=contentHash(s.observer);s.attestation.observerSha256=s.observerSha256;}],['browser API binding absent',e=>{const s=e.stages.find(s=>s.observer.kind==='BROWSER_AUTH_REST');s.observer.apiBindingSha256=null;s.observerSha256=contentHash(s.observer);s.attestation.observerSha256=s.observerSha256;}],['observer actual claim',e=>e.stages[0].observer.declaredOnly=false],
 ['missing scenario',e=>e.tc18.scenarios.pop()],['duplicate scenario',e=>e.tc18.scenarios[1]=e.tc18.scenarios[0]],['missing sink',e=>delete e.tc18.scenarios[0].sinks.audit],['invalid N/A scope',e=>e.tc18.scenarios[0].sinks.console={notApplicable:true,reason:'NO_CLIENT_SURFACE'}],['N/A server sink',e=>e.tc18.scenarios.find(s=>s.scenario==='recovery:success').sinks.audit={notApplicable:true,reason:'NO_CLIENT_SURFACE'}],
 ['denial control missing submitted PIN',e=>{e.tc18.controls.find(c=>c.scenario==='complete:denial').canaries=['654'+'321'];}],['operator control absent',e=>e.tc18.controls.pop()],['browser required skipped',e=>e.tc18.browser.missing=1],['before child exit',e=>e.tc18.phase='DURING_CHILD'],['missing artifact',e=>e.tc18.files.pop()],['unreadable artifact',e=>e.tc18.files[0].readable=false],['symlink artifact',e=>e.tc18.files[0].type='SYMLINK'],['artifact alias',e=>e.tc18.files.push({...e.tc18.files[0],path:e.tc18.files[0].path.toUpperCase()})],['artifact byte drift',e=>e.tc18.files[0].sha256='b'.repeat(64)],['masked form absent',e=>e.tc18.maskedFormAsserted=false],
 ['false empty target',e=>e.tc19.expectedEmptyStoreSet=false],['orphan under lock',e=>e.tc19.relations[0].lockedCount=1],['missing locked relation',e=>e.tc19.relations.pop()],['writer after lock unproven',e=>e.tc19.checks.writerAfterLockBlocked=false],['Auth hashes changed counts equal',e=>e.tc19.after.authRowsSha256='b'.repeat(64)],['Storage GET bytes changed counts equal',e=>e.tc19.after.storageGetBytesSha256='b'.repeat(64)],['catalog ACL fault unproven',e=>e.tc19.checks.faultRollbackCatalogAcl=false],['seeded pilot',e=>e.tc19.checks.neverReuseSeededPilot=false],['missing dependency',e=>e.dependencies.pop()],['dependency actual claim',e=>{e.dependencies[0].state='PASS';e.dependencies[0].sha256=fixed;}]
];
for(const [name,fn] of mutations)test(name+' refuses safely',()=>{const e=fixture();fn(e);finite(()=>checkPin19Evidence(manifest,encode(e)));});
test('recovery-only structured client N/A retains the slot and is accepted only in simulation',()=>{
  const e=fixture();for(const c of e.tc18.scenarios.filter(s=>s.scenario.startsWith('recovery:')))for(const sink of ['browserStorage','url','console','screenshotText'])c.sinks[sink]={notApplicable:true,reason:'NO_CLIENT_SURFACE'};assert.equal(checkPin19Evidence(manifest,encode(e)).modelDecision,'MATCH');
});
for(const [name,value] of [['string',secret],['numeric',Number(secret)],['BigInt persistence model',{numericKind:'BIGINT',decimal:secret}],['base64',Buffer.from(secret).toString('base64')]])test(name+' canary leak raises only a fixed code',()=>{
  const e=fixture();e.tc18.scenarios[0].sinks.audit.data=value;assert.throws(()=>checkPin19Evidence(manifest,encode(e)),{message:'PIN_EVIDENCE_CANARY_LEAK'});
});
test('numeric scalar catches coercion that removes leading zeroes',()=>{
  const e=fixture(),zero='00'+'0123';e.tc18.scenarios[0].canaries.push(zero);e.tc18.controls[0].canaries.push(zero);e.tc18.scenarios[0].sinks.registry.data=123;assert.throws(()=>checkPin19Evidence(manifest,encode(e)),{message:'PIN_EVIDENCE_CANARY_LEAK'});
});
for(const [name,body] of [['late append runner',()=>Buffer.from('clean\n'+secret)],['PNG bytes',()=>Buffer.from([0x89,0x50,0x4e,0x47,...Buffer.from(secret)])],['escaped JSON',()=>Buffer.from('{"v":"\\u0031\\u0032\\u0033\\u0034\\u0035\\u0036"}')]])test(name+' is scanned from the supplied whole-file bytes after child exit',()=>{
  const e=fixture(),file=e.tc18.files.find(f=>name.includes('JSON')?f.path.endsWith('.json'):name.includes('PNG')?f.path.endsWith('.png'):f.path==='runner.log'),b=body();file.rawBase64=b.toString('base64');file.sha256=sha256(b);file.bytes=b.length;assert.throws(()=>checkPin19Evidence(manifest,encode(e)),{message:'PIN_EVIDENCE_CANARY_LEAK'});
});
test('duplicate keys inside a raw document cannot be hidden by recomputing its metadata',()=>{
  const e=fixture(),s=e.stages[0];s.documents.options='{"forbidOnly":true,"forbidOnly":false}';finite(()=>checkPin19Evidence(manifest,encode(e)));
});
for(const extension of ['json','JSON','JsOn']){
  test('P-SEC-01 extra .'+extension+' decodes escaped canary after child exit',()=>{
    const e=fixture(),b=Buffer.from('{"v":"\\u0031\\u0032\\u0033\\u0034\\u0035\\u0036"}');
    e.tc18.files.push({path:'runtime/extra.'+extension,readable:true,type:'REGULAR',postExit:true,rawBase64:b.toString('base64'),sha256:sha256(b),bytes:b.length});
    assert.throws(()=>checkPin19Evidence(manifest,encode(e)),{name:'Error',message:'PIN_EVIDENCE_CANARY_LEAK'});
  });
  test('P-SEC-01 extra malformed .'+extension+' refuses safely after child exit',()=>{
    const e=fixture(),b=Buffer.from('{');
    e.tc18.files.push({path:'runtime/malformed.'+extension,readable:true,type:'REGULAR',postExit:true,rawBase64:b.toString('base64'),sha256:sha256(b),bytes:b.length});
    assert.throws(()=>checkPin19Evidence(manifest,encode(e)),{name:'Error',message:'PIN_EVIDENCE_JSON'});
  });
}
