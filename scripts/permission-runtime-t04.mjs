import{readFileSync,writeFileSync,statSync,realpathSync,lstatSync}from'node:fs';
import{join,resolve,dirname}from'node:path';
import{execFileSync}from'node:child_process';
import{pathToFileURL}from'node:url';
import{runtimeStageCatalog,runtimeStageCommand}from'./permission-runtime-catalog.mjs';
import{parseDiagnosticMarker}from'./permission-runtime-diagnostic-transport.mjs';
import{runtimeHash}from'./permission-runtime-results.mjs';
import{runtimeRunnerFailureFacts,RUNTIME_ERROR_CODES,RUNTIME_FAILURE_BOUNDS,assertRuntimeDiagnosticBinding}from'./permission-runtime-error-facts.mjs';
import{executeRuntimeStage,prepareRuntimeDirectory}from'./permission-runtime-stage.mjs';
import{trackedFingerprint}from'./project-ci.mjs';
import{realAdapter,readCi1LinuxEnvelope,ci1HarnessFailureMarker}from'./permission-runtime-t04-adapter.mjs';
import{assertCi1Envelope,ci1Identity,ci1ProcessEnvironment,CI1_PROJECT,CI1_RUNTIME}from'./permission-ci1-policy.mjs';
import{t04Lifecycle,t04StageEnvironment,createT04FixtureBoundary,assertT04ResourceFacts}from'./permission-runtime-t04-fixture.mjs';
import{T04_DIAGNOSTIC_BOUNDS}from'./permission-runtime-t04-restore-diagnostic.mjs';
import{runT04ImageMeasurement,validateT04ImageMeasurement}from'./permission-t04-image-measurement.mjs';

const catalog=runtimeStageCatalog().filter(s=>s.runtimeProfile==='SUPABASE_T04');
const ids=catalog.map(s=>s.stage),refuse=()=>{throw Error('PERMISSION_T04_RUNTIME_REFUSED');};
export function t04TimeBudget(startedAtEpochMs,now){
  if(!Number.isSafeInteger(startedAtEpochMs)||!Number.isSafeInteger(now)||startedAtEpochMs<1600000000000||now<startedAtEpochMs)refuse();
  // Unit30min is unchanged. Finish the child by minute27, reserving three
  // minutes for owned daemon/unmount/detach cleanup; inner gets 30s exit grace.
  const outerEnd=startedAtEpochMs+27*60000,deadline=Math.min(now+14*60000,outerEnd-30000);
  const harnessTimeoutMs=Math.min(15*60000,outerEnd-now);
  if(!Number.isSafeInteger(outerEnd)||deadline-now<60000||harnessTimeoutMs<=deadline-now)refuse();
  return{deadline,harnessTimeoutMs};
}
export const T04_FAILURE_BOUNDS=Object.freeze({...Object.fromEntries(Object.entries(RUNTIME_FAILURE_BOUNDS).map(([k,v])=>['t04'+k[0].toUpperCase()+k.slice(1),[0,v]])),t04ReportObserved:[0,3],t04StageOrdinal:[0,19],t04FailureOrdinal:[0,4],t04RunnerErrors:[0,10000],t04HookErrors:[0,10000],
 t04MissingRequired:[0,10000],t04FirstFailedRequired:[0,10000],t04BoundaryOrdinal:[1,19],t04BoundaryExit:[0,255],
 t04RestoreErrorOrdinal:[0,15],t04RestoreCommandOrdinal:[0,24],
 ...T04_DIAGNOSTIC_BOUNDS,
 t04RealtimeFailureMask:[0,1023],t04RealtimeFirstFailureOrdinal:[0,480],t04FailedTests:[0,10000],t04FirstFailedLine:[0,100000],t04TestErrorCodeOrdinal:[0,RUNTIME_ERROR_CODES.length],
 t04TestErrorNameOrdinal:[0,5],t04TestErrorMatcherOrdinal:[0,8]});
export function t04SafeFailureMetric(key,value){const bounds=T04_FAILURE_BOUNDS[key];return!!bounds&&Number.isSafeInteger(value)&&value>=bounds[0]&&value<=bounds[1];}
export function t04RunnerFailureFacts(expected,r){
 return Object.fromEntries(Object.entries(runtimeRunnerFailureFacts(expected,r)).map(([k,v])=>['t04'+k[0].toUpperCase()+k.slice(1),v]));
}
export function t04FailureFacts(stderr){
  const p=parseDiagnosticMarker('T04_FAILURE_FACTS',stderr,t04SafeFailureMetric);
  return Object.hasOwn(p,'t04StageOrdinal')?p:{};
}
export async function runT04Profile(adapter){
  const rows=[],resets=[];let failure=null,physical=null,baseline=null,cleanup=false,checkpoint=null,runnerPreflight='NOT_RUN',imageMeasurement=null;
  try{
    adapter.guard();await adapter.bootstrap();physical=await adapter.physical();baseline=await adapter.baseline();
    if(![physical,baseline].every(h=>typeof h==='string'&&/^[a-f0-9]{64}$/.test(h)))refuse();
    checkpoint=await adapter.checkpoint(baseline);
    if(!checkpoint||Object.keys(checkpoint).sort().join(',')!=='archiveSHA,storageSHA'
      ||!Object.values(checkpoint).every(h=>/^[a-f0-9]{64}$/.test(h)))refuse();
    runnerPreflight='FAIL';const proof=await adapter.preflight();
    if(!proof||Object.keys(proof).sort().join(',')!=='archiveSHA,baselineSHA,physicalSHA,status,storageSHA'
      ||proof.status!=='PASS'||proof.archiveSHA!==checkpoint.archiveSHA||proof.storageSHA!==checkpoint.storageSHA
      ||proof.baselineSHA!==baseline||proof.physicalSHA!==physical||await adapter.physical()!==physical
      ||!await adapter.preserved(baseline))refuse();
    runnerPreflight='PASS';
    for(const stage of ids){
      if(failure){rows.push({stage,status:'NOT_RUN'});continue;}
      try{
        adapter.guard();if(await adapter.physical()!==physical||!await adapter.preserved(baseline))refuse();
        await adapter.prepare(stage);
        const r=await adapter.stage(stage),expected=catalog.find(s=>s.stage===stage);
        if(r?.stage!==stage||r.status!=='PASS'||r.required!==expected.required.length||!Number.isSafeInteger(r.run)
          ||r.run<r.required||r.pass!==r.run||r.fail!==0||r.skip!==0||r.retry!==0)refuse();
        adapter.guard();if(await adapter.physical()!==physical)refuse();
        if(stage==='candidate-e2e'){
          const measured=await adapter.imageMeasurement();
          validateT04ImageMeasurement(measured,{physicalBackendSHA:physical});
          imageMeasurement=measured;
          adapter.guard();if(await adapter.physical()!==physical)refuse();
        }
        const beforeResetSHA=await adapter.afterStage(stage);
        if(!/^[a-f0-9]{64}$/.test(beforeResetSHA))refuse();
        if(t04Lifecycle(stage).reset){
          const restored=await adapter.restore(stage,beforeResetSHA);
          if(restored?.stage!==stage||restored.status!=='RESTORED_ORIGINAL'||restored.archiveSHA!==checkpoint.archiveSHA
            ||restored.beforeResetSHA!==beforeResetSHA||restored.baselineSHA!==baseline||restored.physicalSHA!==physical)refuse();
          resets.push(restored);
        }
        if(await adapter.physical()!==physical||!await adapter.preserved(baseline))refuse();
        rows.push(r);
      }catch(error){failure=stage;rows.push({stage,status:'FAIL'});try{adapter.diagnostic?.(stage,error);}catch{}}
    }
  }catch(error){failure??='bootstrap';try{adapter.diagnostic?.('bootstrap',error);}catch{}
    for(const stage of ids)if(!rows.some(r=>r.stage===stage))rows.push({stage,status:'NOT_RUN'});}
  finally{try{cleanup=await adapter.close()===true;}catch{}if(!cleanup)failure??='cleanup';}
  return{schemaVersion:'permission-t04-runtime-v1',scope:'T04_NINETEEN_STAGES_ONLY',status:failure?'FAIL':'PASS',failure,
    stages:rows,physicalBackendSHA:physical,logicalBaselineSHA:baseline,fixtureCheckpoint:checkpoint,resets,cleanup,runnerPreflight,imageMeasurement,
    full35BusinessRuntime:'NOT_RUN',remainingBusinessStages:16,supplementalOracles:'NOT_PROVEN_BY_STAGE_COUNTS'};
}
export function renderT04Evidence(receipt){
  if(receipt?.schemaVersion!=='permission-t04-runtime-v1'||receipt.scope!=='T04_NINETEEN_STAGES_ONLY'
    ||!['PASS','FAIL'].includes(receipt.status)||receipt.full35BusinessRuntime!=='NOT_RUN'||receipt.remainingBusinessStages!==16
    ||!['NOT_RUN','FAIL','PASS'].includes(receipt.runnerPreflight)
    ||receipt.supplementalOracles!=='NOT_PROVEN_BY_STAGE_COUNTS'||typeof receipt.cleanup!=='boolean'
    ||!/^[1-9][0-9]{0,19}$/.test(receipt.runId??'')||!Number.isSafeInteger(receipt.attempt)||receipt.attempt<1||receipt.attempt>1000
    ||!['sourceFingerprint','lockSHA'].every(k=>/^[a-f0-9]{64}$/.test(receipt[k]??''))
    ||!['sourceSHA','workflowSHA'].every(k=>/^[a-f0-9]{40}$/.test(receipt[k]??''))
    ||receipt.workflowSHA!==receipt.sourceSHA||receipt.repository!=='nguyentronglinh045/pos-cafe'
    ||!Array.isArray(receipt.stages)||receipt.stages.length!==19
    ||![null,'bootstrap','cleanup',...ids].includes(receipt.failure)
    ||!['physicalBackendSHA','logicalBaselineSHA'].every(k=>receipt[k]===null||/^[a-f0-9]{64}$/.test(receipt[k]??'')))refuse();
  const resetStages=ids.filter(s=>t04Lifecycle(s).reset),cp=receipt.fixtureCheckpoint;
  if(cp!==null&&(!cp||Object.keys(cp).sort().join(',')!=='archiveSHA,storageSHA'
    ||!Object.values(cp).every(h=>/^[a-f0-9]{64}$/.test(h))))refuse();
  if(!Array.isArray(receipt.resets)||receipt.resets.length>resetStages.length||receipt.resets.some((r,i)=>
    !r||Object.keys(r).sort().join(',')!=='archiveSHA,baselineSHA,beforeResetSHA,physicalSHA,stage,status'
      ||r.stage!==resetStages[i]||r.status!=='RESTORED_ORIGINAL'||r.archiveSHA!==cp?.archiveSHA
      ||r.baselineSHA!==receipt.logicalBaselineSHA||r.physicalSHA!==receipt.physicalBackendSHA
      ||!['archiveSHA','baselineSHA','beforeResetSHA','physicalSHA'].every(k=>/^[a-f0-9]{64}$/.test(r[k]??''))))refuse();
  for(let i=0;i<ids.length;i++){
    const row=receipt.stages[i];if(row?.stage!==ids[i]||!['PASS','FAIL','NOT_RUN'].includes(row.status))refuse();
    if(row.status==='PASS'&&(row.required!==catalog[i].required.length||row.sourceSHA!==receipt.sourceSHA
      ||!Number.isSafeInteger(row.run)||row.run<row.required||row.run!==row.discovered||row.pass!==row.run
      ||row.fail!==0||row.skip!==0||row.retry!==0||row.supplementalOracles!=='NOT_PROVEN_BY_STAGE_COUNTS'
      ||!['reportSHA','invocationSHA'].every(k=>/^[a-f0-9]{64}$/.test(row[k]??''))))refuse();
  }
  const imageStage=receipt.stages.find(row=>row.stage==='candidate-e2e');
  if(receipt.imageMeasurement===null){if(imageStage.status==='PASS')refuse();}
  else{
    if(imageStage.status==='NOT_RUN')refuse();
    validateT04ImageMeasurement(receipt.imageMeasurement,{sourceSHA:receipt.sourceSHA,sourceFingerprint:receipt.sourceFingerprint,
      lockSHA:receipt.lockSHA,runId:receipt.runId,attempt:receipt.attempt,physicalBackendSHA:receipt.physicalBackendSHA});
  }
  if(receipt.runnerPreflight!=='PASS'&&(receipt.stages.some(r=>r.status!=='NOT_RUN')||receipt.resets.length!==0))refuse();
  if(receipt.status==='PASS'&&(receipt.runnerPreflight!=='PASS'||receipt.failure!==null||!receipt.cleanup||receipt.stages.some(r=>r.status!=='PASS')
    ||cp===null||receipt.resets.length!==resetStages.length
    ||!['physicalBackendSHA','logicalBaselineSHA'].every(k=>/^[a-f0-9]{64}$/.test(receipt[k]??''))))refuse();
  if(receipt.status==='FAIL'){
    const failed=ids.indexOf(receipt.failure);
    if(receipt.failure===null||receipt.failure==='bootstrap'&&receipt.stages.some(r=>r.status!=='NOT_RUN')
      ||receipt.failure==='cleanup'&&(receipt.cleanup||receipt.stages.some(r=>r.status!=='PASS'))
      ||failed>=0&&receipt.stages.some((r,i)=>r.status!==(i<failed?'PASS':i===failed?'FAIL':'NOT_RUN')))refuse();
  }
  const keys=['schemaVersion','scope','status','failure','stages','physicalBackendSHA','logicalBaselineSHA','cleanup',
    'fixtureCheckpoint','resets','runnerPreflight','imageMeasurement',
    'full35BusinessRuntime','remainingBusinessStages','supplementalOracles','repository','runId','attempt','sourceSHA','workflowSHA',
    'sourceFingerprint','lockSHA'];
  if(Object.keys(receipt).some(k=>!keys.includes(k))||Object.keys(receipt).length!==keys.length)refuse();
  const rowKeys=['stage','status','required','discovered','run','pass','fail','skip','retry','reportSHA','sourceSHA','invocationSHA','supplementalOracles'];
  for(const r of receipt.stages){const allowed=r.status==='PASS'?rowKeys:['stage','status'];if(Object.keys(r).some(k=>!allowed.includes(k)))refuse();}
  const json=JSON.stringify(receipt,null,2)+'\n';if(Buffer.byteLength(json)>32768)refuse();
  return{json,markdown:`# Permission T04 runtime\n\nScope: T04_NINETEEN_STAGES_ONLY. Status: **${receipt.status}**. Full35/oracles remain unproven.\n`};
}
async function main(){
  if(process.argv.length!==3||process.platform!=='linux'||process.env.PERMISSION_RUNTIME_PROFILE!=='SUPABASE_T04')refuse();
  const root=realpathSync(process.argv[2]),source=realpathSync(process.cwd());
  if(source!==join(root,'source'))refuse();
  const identity=ci1Identity(process.env.GITHUB_RUN_ID,Number(process.env.GITHUB_RUN_ATTEMPT));
  const guard=()=>assertCi1Envelope(readCi1LinuxEnvelope(root,identity),identity);
  guard();
  const controlPath=join(dirname(root),'run-control.json'),info=lstatSync(controlPath);
  if(!info.isFile()||info.isSymbolicLink()||realpathSync(controlPath)!==controlPath||info.uid!==0
    ||(info.mode&0o777)!==0o400||info.nlink!==1||info.size>4096)refuse();
  const control=JSON.parse(readFileSync(controlPath));
  if(control.runId!==identity.runId||control.attempt!==identity.attempt||control.unit!==identity.unit||control.sourceSHA!==process.env.GITHUB_SHA
    ||control.workerSHA!==runtimeHash(readFileSync(join(source,'scripts/permission-runtime-t04-worker.mjs'))))refuse();
  const {deadline}=t04TimeBudget(control.startedAtEpochMs,Date.now()),adapter=await realAdapter(root,identity);
  const git=args=>execFileSync('git',args,{cwd:source,encoding:'utf8',timeout:10000,maxBuffer:128*1024});
  const sourceSHA=git(['rev-parse','HEAD']).trim(),paths=git(['ls-files','-z']).split('\0').filter(Boolean).sort();
  if(sourceSHA!==process.env.GITHUB_SHA||git(['diff','--name-only','HEAD','--']).trim())refuse();
  const sourceFingerprint=trackedFingerprint(source,paths),lockSHA=runtimeHash(readFileSync(join(source,'package-lock.json')));
  const outputRoot=prepareRuntimeDirectory(source,join(source,'artifacts',`permission-t04-${identity.runId}-${identity.attempt}`),guard);
  const env=ci1ProcessEnvironment(root,process.env);
  for(const k of['GITHUB_ACTIONS','RUNNER_ENVIRONMENT','GITHUB_REPOSITORY','GITHUB_EVENT_NAME','GITHUB_EVENT_PATH',
    'GITHUB_RUN_ID','GITHUB_RUN_ATTEMPT','GITHUB_SHA','GITHUB_WORKFLOW_SHA','CI1_EXECUTION_AUTHORIZED'])env[k]=process.env[k];
  Object.assign(env,{IDEM_ENV_FILE:join(root,'private','bridge.env'),PERMISSION_RUNTIME_PROFILE:'SUPABASE_T04',
    PLAYWRIGHT_BROWSERS_PATH:join(root,'home/.cache/ms-playwright')});
  let db,boundary;
  const physical=async()=>{
    guard();const pg=(await import('pg')).default;
    if(!db){const runtime=await import('./permission-identity-runtime.mjs'),target=runtime.parseBridgeEnvironment({IDEM_ENV_FILE:env.IDEM_ENV_FILE});
      db=new pg.Client({connectionString:target.dsn,connectionTimeoutMillis:5000,statement_timeout:10000});await db.connect();}
    const row=(await db.query("select current_database() database,(select oid::text from pg_database where datname=current_database()) database_oid,current_setting('data_directory') data_directory,(select system_identifier::text from pg_control_system()) system_identifier")).rows[0];
    const containers=JSON.parse(execFileSync('docker',['inspect',`supabase_db_${CI1_PROJECT}`],{encoding:'utf8',timeout:10000,maxBuffer:65536}));
    const container=containers[0],mount=container?.Mounts?.find(m=>m.Type==='volume'&&m.Name===`supabase_db_${CI1_PROJECT}`);
    if(row.database!=='postgres'||!/^\d+$/.test(row.system_identifier??'')||!/^\d+$/.test(row.database_oid??'')||!mount||!container.State.Running
      ||container.Config.Labels?.['com.supabase.cli.project']!==CI1_PROJECT||statSync(mount.Source).dev!==statSync(root).dev)refuse();
    const s=statSync(mount.Source),status=JSON.parse(execFileSync(CI1_RUNTIME+'/bin/supabase',['status','--workdir',CI1_RUNTIME+'/stack','-o','json'],
      {encoding:'utf8',timeout:10000,maxBuffer:65536}));
    if(status.API_URL!=='http://127.0.0.1:62421'||new URL(status.DB_URL).port!=='62422')refuse();
    return runtimeHash({system_identifier:row.system_identifier,database_oid:row.database_oid,data_directory:row.data_directory,container:container.Id,
      mountDevice:s.dev,mountInode:s.ino,api:status.API_URL});
  };
  const diagnostic=(stage,error)=>{
    const facts={t04StageOrdinal:ids.indexOf(stage)+1,t04FailureOrdinal:({42501:1,42883:2,ECONNREFUSED:3,ETIMEDOUT:4})[error?.code]??0,t04ReportObserved:0};
    if(Number.isInteger(error?.t04BoundaryOrdinal)&&error.t04BoundaryOrdinal>=1&&error.t04BoundaryOrdinal<=19){
      facts.t04BoundaryOrdinal=error.t04BoundaryOrdinal;
      if(Number.isInteger(error?.status)&&error.status>=0&&error.status<=255)facts.t04BoundaryExit=error.status;
      if(t04SafeFailureMetric('t04PreflightOrdinal',error?.t04PreflightOrdinal))facts.t04PreflightOrdinal=error.t04PreflightOrdinal;
      if(error.t04RestoreFacts)for(const key of['t04RestoreErrorOrdinal','t04RestoreCommandOrdinal',...Object.keys(T04_DIAGNOSTIC_BOUNDS)])
        if(t04SafeFailureMetric(key,error.t04RestoreFacts[key]))facts[key]=error.t04RestoreFacts[key];
    }
    try{const expected=catalog.find(c=>c.stage===stage);if(!expected)throw Error('NO_STAGE');
      const command=runtimeStageCommand(stage,{sourceRoot:source,outputRoot}),path=join(command.reportRoot,stage+'-runner.json'),s=lstatSync(path,{throwIfNoEntry:false});
      facts.t04ReportObserved=s?2:3;if(!s)throw Error('NO_REPORT');
      if(!s.isFile()||s.isSymbolicLink()||s.nlink!==1||s.uid!==0||(s.mode&0o077)!==0||s.dev!==statSync(root).dev||s.size>1024**2||realpathSync(path)!==path)refuse();
      const r=JSON.parse(readFileSync(path));
      assertRuntimeDiagnosticBinding(expected,r,{sourceSHA,sourceFingerprint,lockSHA,configSHA:expected.configSHA,
        runId:identity.runId,invocationSHA:runtimeHash(command.runnerArgv),argv:command.runnerArgv});
      Object.assign(facts,t04RunnerFailureFacts(expected,r));facts.t04ReportObserved=1;
    }catch{/* Missing or malformed private runner report adds no invented counts. */}
    console.error('T04_FAILURE_FACTS '+JSON.stringify(facts));
  };
  const receipt=await runT04Profile({guard,bootstrap:adapter.bootstrap,baseline:adapter.baseline,preserved:adapter.preserved,physical,diagnostic,
    checkpoint:async baseline=>{boundary=await createT04FixtureBoundary({root,identity,guard,physical,baseline,preserved:adapter.preserved,deadline,
      resourceGuard:()=>assertT04ResourceFacts(readCi1LinuxEnvelope(root,identity),identity)});
      return{archiveSHA:boundary.archiveSHA,storageSHA:boundary.storageSHA};},
    preflight:()=>boundary.preflight(),
    prepare:stage=>boundary.prepare(stage),afterStage:stage=>boundary.observe(t04Lifecycle(stage).post),restore:(stage,hash)=>boundary.restore(stage,hash),
    stage:stage=>executeRuntimeStage(stage,{sourceRoot:source,outputRoot,
      baseEnv:t04StageEnvironment(stage,env,stage==='realtime-e2e'?boundary.privateDirectory(stage):undefined),sourceSHA,sourceFingerprint,lockSHA,
      runId:identity.runId,guard,deadline}),
    imageMeasurement:async()=>{
      guard();
      const runtime=await import('./permission-identity-runtime.mjs');
      const target=runtime.parseBridgeEnvironment({IDEM_ENV_FILE:env.IDEM_ENV_FILE});
      const physicalBackendSHA=await physical();
      const status=JSON.parse(execFileSync(CI1_RUNTIME+'/bin/supabase',['status','--workdir',CI1_RUNTIME+'/stack','-o','json'],
        {encoding:'utf8',timeout:10000,maxBuffer:65536}));
      if(target.api!=='http://127.0.0.1:62421'||status.API_URL!==target.api||typeof status.SERVICE_ROLE_KEY!=='string'
        ||!status.SERVICE_ROLE_KEY||new URL(target.dsn).port!=='62422')refuse();
      return runT04ImageMeasurement({root,guard,deadline,api:target.api,storeIds:runtime.STORE_IDS,employeeId:runtime.EMPLOYEE_IDS[0],db,
        anonKey:target.anonKey,storeJwt:target.storeJwt,serviceKey:status.SERVICE_ROLE_KEY,physical,
        binding:{sourceSHA,sourceFingerprint,lockSHA,runId:identity.runId,attempt:identity.attempt,physicalBackendSHA}});
    },
    close:async()=>{let okay=true;try{if(boundary)await boundary.close();}catch{okay=false;}
      try{if(db)await db.end();}catch{okay=false;}finally{await adapter.close();}return okay;}});
  Object.assign(receipt,{repository:process.env.GITHUB_REPOSITORY,runId:identity.runId,attempt:identity.attempt,
    sourceSHA,workflowSHA:process.env.GITHUB_WORKFLOW_SHA,sourceFingerprint,lockSHA});
  const rendered=renderT04Evidence(receipt);
  writeFileSync(join(root,'private','public-evidence.json'),rendered.json,{flag:'wx',mode:0o600});
  writeFileSync(join(root,'private','public-summary.md'),rendered.markdown,{flag:'wx',mode:0o600});
  if(receipt.status!=='PASS')process.exitCode=1;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  try{await main();}catch(error){console.error(ci1HarnessFailureMarker(10,error));process.exitCode=78;}
}
