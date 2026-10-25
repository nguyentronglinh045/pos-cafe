// Synthetic test-data builders factored from reviewed R02; no I/O or execution.
import {sha256}from'./permission-full-perm-plan.mjs';
import {data,demand}from'./permission-full-d1-data.mjs';
export function createPermFixtureFactory(mapJson,inventoryJson){const map=data(mapJson),sourceInventory=data(inventoryJson);const json=JSON.stringify,clone=structuredClone;
const artifact=value=>{const text=json(value);return {path:'artifacts/model/'+sha256(text).slice(0,16)+'.json',text,byteHash:sha256(text),contentHash:sha256(json(JSON.parse(text)))}};
const descriptor=sourceInventory.files.find(row => row.path === 'supabase/migrations/017_permission_catalog_bridge.sql');
function fixture(stageName) {
  const stage=map.stages.find(row=>row.stage===stageName),rows=stage.required;
  let discovery,results,options;
  if(stage.runner==='vitest') {
    // One selected file can contain extra tests. Those must also be discovered,
    // executed and covered by actual options; required variant filtering is insufficient.
    const all=[...rows,{file:stage.files[0],name:'full-file negative-control neighbour',project:null},
      ...stage.files.filter(file=>!rows.some(row=>row.file===file)&&file!==stage.files[0]).map(file=>({file,name:'full-file non-PERM neighbour',project:null}))];
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

return Object.freeze({fixture,attest});}
