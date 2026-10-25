import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { checkPermStage,checkPermAggregate,checkPermSchedule } from './permission-full-perm-collect.mjs';
import { pinnedStageMap,sha256 } from './permission-full-perm-plan.mjs';

const map=pinnedStageMap(),mapText=JSON.stringify(map);
const json=JSON.stringify, clone=structuredClone;
const artifact=value=>{const text=json(value);return {path:'artifacts/model/'+sha256(text).slice(0,16)+'.json',text,byteHash:sha256(text),contentHash:sha256(json(JSON.parse(text)))}};
const sourceInventory=JSON.parse(readFileSync(new URL('../tests/permissions/prep-perm-source-inventory.json',import.meta.url),'utf8'));
const descriptor=sourceInventory.files.find(row => row.path === 'supabase/migrations/017_permission_catalog_bridge.sql');
function fixture(stageName) {
  const stage=map.stages.find(row=>row.stage===stageName),rows=stage.required;
  let discovery,results,options;
  if(stage.runner==='vitest') {
    // One selected file can contain extra tests. Those must also be discovered,
    // executed and covered by actual options; required variant filtering is insufficient.
    const all=[...rows,{file:stage.files[0],name:'full-file negative-control neighbour',project:null}];
    discovery=all.map(row=>({file:row.file,name:row.name}));
    results={success:true,errorCount:0,hookErrorCount:0,hookErrors:[],runErrors:[],
      testResults:[...new Set(all.map(row=>row.file))].map(file=>({name:file,
        assertionResults:all.filter(row=>row.file===file).map(row=>({fullName:row.name,status:'passed'}))}))};
    options={runner:'vitest-actual-options-v1',reason:'passed',errorCount:0,
      tests:all.map(row=>({file:row.file,name:row.name,state:'passed',options:{fails:false,retry:0,repeats:0,mode:'run'}}))};
  } else {
    const projects=[{id:rows[0].project,retries:0,repeatEach:1}];
    discovery={config:{projects},suites:[{specs:rows.map(row=>({title:row.name,file:row.file,
      tests:[{projectName:row.project,expectedStatus:'passed',results:[]}]})),suites:[]}],errors:[],stats:{unexpected:0,flaky:0,skipped:0}};
    results=clone(discovery);for(const spec of results.suites[0].specs)spec.tests[0].results=[{status:'passed',retry:0}];
    options={runner:'playwright-actual-options-v1',projects,
      tests:rows.map(row=>({...row,retries:0,repeatEachIndex:0,expectedStatus:'passed'}))};
  }
  const legacy=stage.runtimeProfile==='PG16_T01';
  const binding=stage.runtimeProfile==='STATIC'?{profile:stage.profile,stage:stage.stage,executionKind:stage.executionKind,
    configId:stage.configuration.path,backend:{applicable:false}}:
    {profile:stage.profile,stage:stage.stage,executionKind:'service',configId:stage.configuration.path,
      backend:{reference:'synthetic:simulation-only',host:'127.0.0.1',port:5432,database:'simulation',engine:'postgres'},
      fixtureIds:['10000000-0000-4000-8000-000000000001'],markerProof:'1'.repeat(64),catalogHash:'2'.repeat(64),schemaHash:'3'.repeat(64),
      appliedArtifacts:[{id:descriptor.path,hash:descriptor.sha256}],apiBinding:legacy?'OBSERVER_ONLY':{baseUrl:'http://127.0.0.1:62421',projectRef:'simulation'}};
  const result={version:'perm-stage-input-v1',evidenceMode:'SIMULATION',stage:stage.stage,profile:stage.profile,
    runtimeProfile:stage.runtimeProfile,runner:stage.runner,stageExecutionId:'10000000-0000-4000-8000-000000000001',workflowRunId:'39136704294',attempt:1,
    sourceBefore:map.inventoryHash,sourceAfter:map.inventoryHash,manifestHash:map.manifestHash,inventoryHash:map.inventoryHash,
    configHash:stage.configuration.sha256,lockHash:map.lockHash,recipeHash:stage.recipeHash,
    startedMs:1792380000000,finishedMs:1792380001000,exitCode:0,
    selection:{files:stage.files,grep:null,forbidOnly:true,retries:0,repeats:1},
    service:stage.runtimeProfile==='STATIC'?null:{engineMajor:legacy?16:17,physicalBackend:'4'.repeat(64),storageIdentity:'5'.repeat(64),
      topology:legacy?'OBSERVER_ONLY':'FULL_SUPABASE_12',apiMode:legacy?'OBSERVER_ONLY':'API_AUTH_STORAGE_REALTIME',binding},preservation:null,
    artifacts:{discovery:artifact(discovery),results:artifact(results),options:artifact(options),attestation:null}};
  if(result.service)result.preservation={scope:'FIXTURE_LOGICAL_ONLY',phase:stage.stage==='rollback-additive-database'?'TC53_ADDITIVE':
    stage.stage==='rollback-preflight-database'?'TC53_PREFLIGHT':stage.stage==='rollback-recovery-database'?'TC53_RECOVERY':'STAGE_HOOKS',
    beforeHash:'6'.repeat(64),afterHash:'6'.repeat(64),beforeBytes:2048,afterBytes:2048,sourceBefore:result.sourceBefore,sourceAfter:result.sourceAfter,
    startedMs:result.startedMs,finishedMs:result.finishedMs,reset:'REVIEWED_LOGICAL_BOUNDARY',snapshotOnly:true,physicalRestore:'NOT_RUN',delivery03:'NOT_RUN',closure:true};
  if(result.preservation)result.preservation.phaseProof=stage.stage==='rollback-additive-database'?
    {businessPreserved:true,phase27GrantsPreserved:true,catalogGrantsPreserved:true}:stage.stage==='rollback-preflight-database'?
    {wrongBindingBlockedBeforeBusinessRead:true,validDiscoveryReadOnly:true}:stage.stage==='rollback-recovery-database'?
    {postQSnapshot:true,forwardFixScope:true}:{hooksClosed:true};
  if(stage.stage==='rollback-recovery-database')result.preservation.recovery={postBackupWrite:true,restoreBlocked:true,forwardFix:true,qPreserved:true,kPreserved:true,r1Preserved:true};
  attest(result,binding);return result;
}
function attest(value,binding=value.service?.binding) {
  if(!binding)binding={profile:value.profile,stage:value.stage,executionKind:map.stages.find(s=>s.stage===value.stage).executionKind,
    configId:map.stages.find(s=>s.stage===value.stage).configuration.path,backend:{applicable:false}};
  value.artifacts.attestation=artifact({schemaVersion:'permission-execution-profile-v1',runner:'permission-execution-profile-v1',runId:value.stageExecutionId,
    sourceFingerprint:value.sourceBefore,executionProfile:binding,startedAt:new Date(value.startedMs).toISOString(),finishedAt:new Date(value.finishedMs).toISOString(),
    artifactHashes:Object.fromEntries(['discovery','results','options'].map(k=>[k,value.artifacts[k].contentHash])),
    artifactByteHashes:Object.fromEntries(['discovery','results','options'].map(k=>[k,value.artifacts[k].byteHash]))});
}
function mutateArtifact(value,name,mutate,{rebind=true}={}) {
  const parsed=JSON.parse(value.artifacts[name].text);mutate(parsed);value.artifacts[name]=artifact(parsed);if(rebind)attest(value);
}
function stop(value,code) {const result=checkPermStage(mapText,json(value));assert.equal(result.modelDecision,'STOP');if(code)assert.ok(result.errors.includes(code),json(result.errors));return result;}

test('representative static, observer, TC53 and browser bytes match only a simulation model',()=>{
  for(const stage of ['candidate-seed-tools','legacy-t01-database','rollback-additive-database','rollback-preflight-database','rollback-recovery-database','candidate-roles-e2e']) {
    const result=checkPermStage(mapText,json(fixture(stage)));assert.equal(result.modelDecision,'MATCH',json(result.errors));
    assert.equal(result.valid,false);assert.equal(result.fullGate,'NOT_RUN');assert.equal(result.authentication,'NOT_PROVEN');
    assert.equal(result.backendObserved,false);assert.equal(result.stageResult.physicalRestore,'NOT_RUN');
  }
});

test('full-file closure catches skipped or extra neighbour even when every required variant passed',()=>{
  let value=fixture('candidate-seed-tools');
  mutateArtifact(value,'results',r=>r.testResults[0].assertionResults.at(-1).status='skipped');stop(value,'PERM_EVIDENCE_RESULTS');
  value=fixture('candidate-seed-tools');mutateArtifact(value,'discovery',r=>r.pop());stop(value,'PERM_EVIDENCE_RESULTS');
  value=fixture('candidate-seed-tools');mutateArtifact(value,'options',r=>r.tests.pop());stop(value,'PERM_EVIDENCE_RESULTS');
  value=fixture('candidate-seed-tools');mutateArtifact(value,'results',r=>r.hookErrorCount=1);stop(value,'PERM_EVIDENCE_RESULTS');
});

test('wrong source/config/lock/recipe/profile/UUID and late/raw hash changes are refused with finite codes',()=>{
  for(const field of ['sourceBefore','sourceAfter','manifestHash','inventoryHash','configHash','lockHash','recipeHash']) {
    const value=fixture('candidate-seed-tools');value[field]='f'.repeat(64);stop(value,'PERM_EVIDENCE_HASH');
  }
  for(const [field,bad] of [['stageExecutionId','39136704294'],['workflowRunId','10000000-0000-4000-8000-000000000001'],['profile','legacy'],['runtimeProfile','candidate'],['runner','playwright']]) {
    const value=fixture('candidate-seed-tools');value[field]=bad;stop(value,'PERM_EVIDENCE_IDENTITY');
  }
  let value=fixture('candidate-seed-tools');value.artifacts.results.text+=' ';stop(value,'PERM_EVIDENCE_HASH');
  value=fixture('candidate-seed-tools');mutateArtifact(value,'results',r=>r.success=false,{rebind:false});stop(value,'PERM_EVIDENCE_HASH');
  value=fixture('candidate-seed-tools');value.artifacts.discovery.contentHash='0'.repeat(64);stop(value,'PERM_EVIDENCE_HASH');
});

test('retry/repeat/fails/focus and missing actual options cannot become a standard pass',()=>{
  for(const [field,bad] of [['retry',1],['repeats',1],['fails',true],['mode','only']]) {
    const value=fixture('candidate-seed-tools');mutateArtifact(value,'options',r=>r.tests[0].options[field]=bad);stop(value,'PERM_EVIDENCE_OPTIONS');
  }
  let value=fixture('candidate-seed-tools');delete value.artifacts.options;stop(value,'PERM_EVIDENCE_SCHEMA');
  value=fixture('candidate-seed-tools');value.selection.grep='TC-PERM';stop(value,'PERM_EVIDENCE_OPTIONS');
});

test('exact full name/file/project and duplicates fail even with equal counts and rebound byte hashes',()=>{
  for(const mutate of [r=>r[0].name+='different',r=>r[0].file='tests/other.test.ts',r=>r[1]=clone(r[0])]) {
    const value=fixture('candidate-seed-tools');mutateArtifact(value,'discovery',mutate);stop(value);
  }
  let value=fixture('candidate-roles-e2e');mutateArtifact(value,'results',r=>r.suites[0].specs[0].tests[0].projectName='other');stop(value,'PERM_EVIDENCE_IDENTITY');
  value=fixture('candidate-roles-e2e');mutateArtifact(value,'results',r=>r.suites[0].specs[0].tests[0].expectedStatus='failed');stop(value,'PERM_EVIDENCE_RESULTS');
  value=fixture('candidate-roles-e2e');mutateArtifact(value,'results',r=>r.suites[0].specs[0].tests[0].results.push({status:'passed',retry:1}));stop(value);
});

test('PG16 observer cannot attest API services, T04 PG17 topology and applied source pins are mandatory',()=>{
  let value=fixture('legacy-t01-database');value.service.apiMode='API_AUTH_STORAGE_REALTIME';stop(value,'PERM_EVIDENCE_BINDING');
  value=fixture('rollback-additive-database');value.service.engineMajor=16;stop(value,'PERM_EVIDENCE_BINDING');
  value=fixture('rollback-additive-database');value.service.binding.apiBinding='OBSERVER_ONLY';stop(value);
  value=fixture('rollback-additive-database');value.service.binding.appliedArtifacts[0].hash='f'.repeat(64);stop(value,'PERM_EVIDENCE_BINDING');
  value=fixture('rollback-additive-database');value.service.topology='DB_AUTH_REST_ONLY';stop(value,'PERM_EVIDENCE_BINDING');
});

test('preservation is hash+byte/phase/time/scope closure; a logical fixture never attests physical restore',()=>{
  for(const [field,bad] of [['afterHash','7'.repeat(64)],['afterBytes',2049],['phase','TC53_RECOVERY'],['reset','RECREATE_BACKEND'],['closure',false],['physicalRestore','PASS'],['delivery03','PASS'],['finishedMs',0]]) {
    const value=fixture('rollback-additive-database');value.preservation[field]=bad;stop(value,'PERM_EVIDENCE_PRESERVATION');
  }
  const value=fixture('rollback-recovery-database');value.preservation.recovery.qPreserved=false;stop(value,'PERM_EVIDENCE_PRESERVATION');
});

test('hostile input, extra fields, traversal, duplicate artifact paths and unsafe integers are finite refusals',()=>{
  let touched=0;const hostile=new Proxy({}, {get(){touched++;throw new Error('private');}});
  assert.deepEqual(checkPermStage(mapText,hostile).errors,['PERM_PLAN_INPUT_TYPE']);assert.equal(touched,0);
  let value=fixture('candidate-seed-tools');value.secret='do-not-echo';const result=stop(value,'PERM_EVIDENCE_SCHEMA');assert.ok(!json(result).includes('do-not-echo'));
  value=fixture('candidate-seed-tools');value.artifacts.results.path='../secret';stop(value);
  value=fixture('candidate-seed-tools');value.artifacts.results.path=value.artifacts.discovery.path;stop(value);
  value=fixture('candidate-seed-tools');value.attempt=Number.MAX_SAFE_INTEGER+1;stop(value,'PERM_PLAN_JSON');
  assert.deepEqual(checkPermStage(mapText,'{"stage":1,"\\u0073tage":2}').errors,['PERM_PLAN_DUPLICATE_KEY']);
});

test('artifact paths reject Windows aliases/devices before hash or closure admission',()=>{
  for(const paths of [
    ['artifacts/model/x.json','artifacts/model/X.JSON'],
    ['artifacts/MODEL/x.json','ARTIFACTS/model/x.json'],
    ['artifacts/model/x.json','artifacts/model/x.json'],
  ]) {
    const value=fixture('candidate-seed-tools');
    value.artifacts.discovery.path=paths[0];value.artifacts.results.path=paths[1];
    assert.deepEqual(stop(value).errors,['PERM_EVIDENCE_SCHEMA']);
  }
  for(const path of ['artifacts/CON/result.json','artifacts/con.json','artifacts/pRn/result.json',
    'artifacts/AUX/result.json','artifacts/NUL.txt','artifacts/COM1/result.json','artifacts/lpt9.log',
    'artifacts/model/name.','artifacts/model/name.json:stream','artifacts\\model\\x.json',
    'C:/artifacts/model/x.json','//server/share/x.json']) {
    const value=fixture('candidate-seed-tools');value.artifacts.results.path=path;
    // Invalid bytes would fail hashing if path admission did not run first.
    value.artifacts.results.byteHash='0'.repeat(64);
    assert.deepEqual(stop(value).errors,['PERM_EVIDENCE_SCHEMA']);
  }
  const value=fixture('candidate-seed-tools');
  value.artifacts.discovery.path='artifacts/model/x.json';
  value.artifacts.results.path='artifacts/model/xy.JSON';
  assert.equal(checkPermStage(mapText,json(value)).modelDecision,'MATCH');
});

function schedule() {
  return {version:'perm-declared-schedule-v1',rows:map.stages.map((stage,index)=>({stage:stage.stage,runtimeProfile:stage.runtimeProfile,
    stageExecutionId:'10000000-0000-4000-8000-'+String(index+1).padStart(12,'0'),workflowRunId:'39136704294',attempt:1,
    startedMs:1792380000000+index*10000,finishedMs:1792380001000+index*10000,
    physicalBackend:stage.runtimeProfile==='STATIC'?null:'a'.repeat(64),storageIdentity:stage.runtimeProfile==='STATIC'?null:'b'.repeat(64),
    backend:stage.runtimeProfile==='STATIC'?null:{reference:stage.runtimeProfile,host:'127.0.0.1',port:5432,database:'simulation',engine:'postgres'}}))};
}
test('27-stage schedule preserves 19 T04 including rollback/transition; supplied is never observed',()=>{
  const value=schedule(),result=checkPermSchedule(mapText,json(value));assert.equal(result.modelDecision,'MATCH');assert.equal(result.backendObserved,false);assert.equal(result.stageEvidenceChecked,false);
  for(const stage of ['rollback-additive-database','rollback-preflight-database','rollback-recovery-database','transition-database','transition-e2e','transition-compatibility-database']) {
    for(const field of ['physicalBackend','storageIdentity']) {
      const changed=clone(value);changed.rows.find(row=>row.stage===stage)[field]='c'.repeat(64);
      assert.deepEqual(checkPermSchedule(mapText,json(changed)).errors,['PERM_EVIDENCE_BACKEND']);
    }
  }
});
test('schedule refuses overlapping services, mixed attempt/run, duplicate stage/UUID and total duration beyond gate',()=>{
  for(const mutate of [s=>s.rows[9].startedMs=s.rows[8].startedMs,s=>s.rows[8].attempt=2,s=>s.rows[8].workflowRunId='1',
    s=>s.rows[8].stage=s.rows[9].stage,s=>s.rows[8].stageExecutionId=s.rows[9].stageExecutionId,s=>s.rows.at(-1).finishedMs+=1800001]) {
    const value=schedule();mutate(value);assert.equal(checkPermSchedule(mapText,json(value)).modelDecision,'STOP');
  }
});
test('aggregate refuses missing/duplicate/extra runs and caller-made MATCH summaries; oversized raw evidence is not truncated',()=>{
  const manifest=readFileSync(new URL('../tests/permissions/prep-perm-manifest.json',import.meta.url),'utf8');
  let input={version:'perm-aggregate-input-v1',runs:map.stages.map(row=>({stage:row.stage,evidenceJson:'{}'}))};
  input.runs.pop();assert.equal(checkPermAggregate(manifest,json(input)).modelDecision,'STOP');
  input={version:'perm-aggregate-input-v1',runs:map.stages.map(row=>({stage:row.stage,evidenceJson:'{}'}))};
  input.runs[26].stage=input.runs[25].stage;assert.deepEqual(checkPermAggregate(manifest,json(input)).errors,['PERM_EVIDENCE_RUN_SET']);
  input.runs[26].stage=map.stages[26].stage;input.runs[0].evidenceJson=json({stage:input.runs[0].stage,modelDecision:'MATCH'});
  assert.deepEqual(checkPermAggregate(manifest,json(input)).errors,['PERM_EVIDENCE_SCHEMA']);
  assert.deepEqual(checkPermAggregate(manifest,' '.repeat(262145)).errors,['PERM_PLAN_INPUT_SIZE']);
});
