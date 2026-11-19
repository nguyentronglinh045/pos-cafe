import{readFileSync,writeFileSync,lstatSync,statSync,realpathSync}from'node:fs';
import{join,dirname,resolve}from'node:path';
import{execFileSync}from'node:child_process';
import{pathToFileURL}from'node:url';
import{runtimeStage,runtimeStageCommand}from'./permission-runtime-catalog.mjs';
import{runtimeHash}from'./permission-runtime-results.mjs';
import{executeRuntimeStage,prepareRuntimeDirectory}from'./permission-runtime-stage.mjs';
import{trackedFingerprint}from'./project-ci.mjs';
import{CI1_PROJECT,CI1_RUNTIME,ACTIVE_PROFILE,ci1Identity,ci1ProcessEnvironment,assertCi1Envelope}from'./permission-runtime-service-policy.mjs';
import{readCi1LinuxEnvelope}from'./permission-runtime-service-linux.mjs';
import{ci1ImagesIntake,ci1PinnedImageProof}from'./permission-ci1-intake.mjs';
import{ci1HarnessFailureMarker,realAdapter}from'./permission-runtime-t04-adapter.mjs';
import{t04TimeBudget}from'./permission-runtime-t04.mjs';
import{serviceProfile,serviceConfig,serviceEventProfile,t06Profile}from'./permission-runtime-service-profile.mjs';
import{readStoppedServicePeer}from'./permission-runtime-service-peer.mjs';
import{serviceSafeFailureMetric,serviceStageErrorFacts,serviceRunnerFailureFacts}from'./permission-runtime-service-diagnostic.mjs';
import{readTc18WrapperReceipt}from'./permission-runtime-tc18-diagnostic.mjs';
import{parseDiagnosticMarker}from'./permission-runtime-diagnostic-transport.mjs';
import{assertRuntimeDiagnosticBinding}from'./permission-runtime-error-facts.mjs';

import{createT04FixtureBoundary,t04Lifecycle,t04StageEnvironment,assertT04ResourceFacts}from'./permission-runtime-t04-fixture.mjs';
import{t06CandidateCheckout,t06DefaultCases,t06ObservedCases,t06AckPhases,validateT06Evidence}from'./permission-runtime-t06.mjs';

const check=x=>{if(!x)throw Error('PERMISSION_SERVICE_RUNTIME_REFUSED');};
export function servicePreparedEnvironment(id,privateRoot){
 check(['PIN_ONBOARD','PIN_RACE','PIN_EXPIRY','T06_ACK'].includes(id)&&typeof privateRoot==='string'&&privateRoot.startsWith('/')&&!/[\r\n\0]/.test(privateRoot));
 if(id==='T06_ACK')return{PIN_ACK_ENV_FILE:privateRoot+'/pin-ack.env',PIN_ACK_VITE_PORT:'5179'};
 if(id==='PIN_RACE')return{PIN_RACE_ENV_FILE:privateRoot+'/pin-race.env',PIN_RACE_VITE_PORT:'5180'};
 if(id==='PIN_EXPIRY')return{PIN_EXPIRY_ENV_FILE:privateRoot+'/pin-expiry.env',PIN_EXPIRY_VITE_PORT:'5181'};
 return{PIN_ONBOARD_ENV_FILE:privateRoot+'/pin-onboard.env'};
}
export function serviceFailureFacts(stderr){
 const p=parseDiagnosticMarker('SERVICE_FAILURE_FACTS',stderr,serviceSafeFailureMetric);
 return Object.hasOwn(p,'serviceStageOrdinal')&&Object.hasOwn(p,'serviceSetupOrdinal')?p:{};
}
export async function runServiceProfile(profile,adapter){
 const ids=serviceProfile(profile).stages,rows=[];let failure=null,physical=null,fixtureConnectionClosed=false;
 try{adapter.guard();await adapter.bootstrap();physical=await adapter.physical();check(/^[a-f0-9]{64}$/.test(physical));
  for(const stage of ids){
   if(failure){rows.push({stage,status:'NOT_RUN'});continue;}
   try{adapter.guard();check(await adapter.physical()===physical);await adapter.prepare(stage);
    const r=await adapter.stage(stage),s=runtimeStage(stage);
    check(r?.stage===stage&&r.status==='PASS'&&r.required===s.required.length&&Number.isSafeInteger(r.run)
     &&r.run>=r.required&&r.pass===r.run&&r.fail===0&&r.skip===0&&r.retry===0);
    adapter.guard();check(await adapter.physical()===physical);rows.push(r);
   }catch(e){failure=stage;rows.push({stage,status:'FAIL'});try{adapter.diagnostic(stage,e);}catch{}}
  }
 }catch(e){failure??='bootstrap';try{adapter.diagnostic('bootstrap',e);}catch{}
  for(const stage of ids)if(!rows.some(r=>r.stage===stage))rows.push({stage,status:'NOT_RUN'});
 }finally{try{fixtureConnectionClosed=await adapter.close()===true;}catch{}if(!fixtureConnectionClosed)failure??='cleanup';}
 return{schemaVersion:'permission-service-runtime-v1',scope:'ONE_SERVICE_PROFILE_ONLY',executionProfile:profile,
  logicalProfile:serviceProfile(profile).logicalProfile,status:failure?'FAIL':'PASS',failure,stages:rows,
  physicalBackendSHA:physical,fixtureConnectionClosed,full35BusinessRuntime:'NOT_RUN',remainingBusinessStages:35-ids.length,
  supplementalOracles:'NOT_PROVEN_BY_STAGE_COUNTS'};
}
export function renderServiceEvidence(r){
 const p=serviceProfile(r?.executionProfile),ids=p.stages,split=t06Profile(p.id);
 const exact=(v,keys)=>check(v&&Object.keys(v).sort().join(',')===keys.sort().join(','));
 exact(r,['schemaVersion','scope','executionProfile','logicalProfile','status','failure','stages','physicalBackendSHA',
  'fixtureConnectionClosed','full35BusinessRuntime','remainingBusinessStages','supplementalOracles',
  'repository','runId','attempt','sourceSHA','workflowSHA','sourceFingerprint','lockSHA','stoppedPeerSHA',...(split?['t06']:[])]);
 check(r.schemaVersion==='permission-service-runtime-v1'&&r.scope==='ONE_SERVICE_PROFILE_ONLY'&&r.logicalProfile===p.logicalProfile
  &&r.repository==='nguyentronglinh045/pos-cafe'&&/^[1-9][0-9]{0,19}$/.test(r.runId??'')
  &&Number.isInteger(r.attempt)&&r.attempt>=1&&r.attempt<=1000&&['PASS','FAIL'].includes(r.status)
  &&r.full35BusinessRuntime==='NOT_RUN'&&r.remainingBusinessStages===35-ids.length
  &&r.supplementalOracles==='NOT_PROVEN_BY_STAGE_COUNTS'&&typeof r.fixtureConnectionClosed==='boolean'
  &&['sourceSHA','workflowSHA'].every(k=>/^[a-f0-9]{40}$/.test(r[k]??''))&&(split||r.sourceSHA===r.workflowSHA)
  &&['sourceFingerprint','lockSHA'].every(k=>/^[a-f0-9]{64}$/.test(r[k]??''))
  &&(r.physicalBackendSHA===null||/^[a-f0-9]{64}$/.test(r.physicalBackendSHA??''))
  &&(r.stoppedPeerSHA===null||p.id==='PIN_EXPIRY'&&/^[a-f0-9]{64}$/.test(r.stoppedPeerSHA??''))
  &&Array.isArray(r.stages)&&r.stages.length===ids.length&&[null,'bootstrap','cleanup',...(split?['candidate-preservation']:[]),...ids].includes(r.failure));
 for(let i=0;i<ids.length;i++){const row=r.stages[i],s=runtimeStage(ids[i]);
  check(row?.stage===ids[i]&&['PASS','FAIL','NOT_RUN'].includes(row.status));
  if(row.status==='PASS'){
   exact(row,['stage','status','required','discovered','run','pass','fail','skip','retry','reportSHA','sourceSHA','invocationSHA','supplementalOracles']);
   check(row.required===s.required.length&&Number.isSafeInteger(row.run)&&row.run>=row.required&&row.discovered===row.run
    &&row.pass===row.run&&row.fail===0&&row.skip===0&&row.retry===0&&row.sourceSHA===r.sourceSHA
    &&row.supplementalOracles==='NOT_PROVEN_BY_STAGE_COUNTS'&&['reportSHA','invocationSHA'].every(k=>/^[a-f0-9]{64}$/.test(row[k]??'')));
  }else exact(row,['stage','status']);
 }
 if(r.status==='PASS')check(r.failure===null&&r.fixtureConnectionClosed&&r.physicalBackendSHA!==null&&r.stages.every(s=>s.status==='PASS')
  &&(p.id!=='PIN_EXPIRY'||r.stoppedPeerSHA!==null));
 else{check(r.failure!==null);const failed=ids.indexOf(r.failure);
  check(!(r.failure==='bootstrap'&&r.stages.some(s=>s.status!=='NOT_RUN'))
   &&!(r.failure==='cleanup'&&(r.fixtureConnectionClosed||r.stages.some(s=>s.status!=='PASS')))
   &&!(failed>=0&&r.stages.some((s,i)=>s.status!==(i<failed?'PASS':i===failed?'FAIL':'NOT_RUN'))));
 }
 if(split)validateT06Evidence(r,ids[0]);
 const json=JSON.stringify(r,null,2)+'\n';check(Buffer.byteLength(json)<=16384);
 return{json,markdown:`# Permission service profile\n\n${p.id}: **${r.status}**. Only ${ids.length} catalog stages; full35/oracles remain unproven.\n`};
}
async function main(){
 check(process.platform==='linux'&&process.argv.length===3&&process.versions.node==='24.16.0');
 serviceEventProfile(process.env,JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH)));
 const root=realpathSync(process.argv[2]),source=realpathSync(process.cwd());check(source===join(root,'source'));
 const identity=ci1Identity(process.env.GITHUB_RUN_ID,Number(process.env.GITHUB_RUN_ATTEMPT));
 const guard=()=>assertCi1Envelope(readCi1LinuxEnvelope(root,identity),identity);guard();
 const file=join(dirname(root),'run-control.json'),info=lstatSync(file);
 check(info.isFile()&&!info.isSymbolicLink()&&realpathSync(file)===file&&info.uid===0&&(info.mode&0o777)===0o400&&info.nlink===1&&info.size<4096);
 const control=JSON.parse(readFileSync(file));check(control.runId===identity.runId&&control.attempt===identity.attempt
  &&control.unit===identity.unit&&control.profile===ACTIVE_PROFILE.id&&control.sourceSHA===process.env.GITHUB_SHA
  &&control.workerSHA===runtimeHash(readFileSync(join(source,'scripts/permission-runtime-service-worker.mjs'))));
 const {deadline}=t04TimeBudget(control.startedAtEpochMs,Date.now());
 const env={...ci1ProcessEnvironment(root,process.env),...process.env};
 const call=(name,args,cap=30000,cwd=source)=>{guard();const remaining=deadline-Date.now()-1000;check(remaining>0);
  return execFileSync(name,args,{cwd,env,encoding:'utf8',timeout:Math.min(cap,remaining),killSignal:'SIGKILL',maxBuffer:1024**2,stdio:['ignore','pipe','pipe']});};
 const install=cwd=>{
  check(!lstatSync(cwd+'/node_modules',{throwIfNoEntry:false}));
  const path=join(cwd,'package-lock.json'),lock=runtimeHash(readFileSync(path));
  call('npm',['ci','--offline','--no-audit','--no-fund'],300000,cwd);
  check(runtimeHash(readFileSync(path))===lock);
 };
 const profile=ACTIVE_PROFILE,split=t06Profile(profile.id),seed=profile.id==='T06_SEED';
 const git=args=>call('git',args,10000),workflowSHA=git(['rev-parse','HEAD']).trim();
 check(workflowSHA===process.env.GITHUB_WORKFLOW_SHA&&!git(['diff','--name-only','HEAD','--']).trim());
 const candidate=split?t06CandidateCheckout(root):null;
 if(!split)install(source);
 const testSource=candidate?.source??source,sourceSHA=candidate?.sourceSHA??workflowSHA;
 const lockSHA=candidate?.lockSHA??runtimeHash(readFileSync(source+'/package-lock.json'));
 const sourceFingerprint=candidate?.sourceFingerprint??trackedFingerprint(source,git(['ls-files','-z']).split('\0').filter(Boolean).sort());
 const outputRoot=prepareRuntimeDirectory(testSource,join(testSource,'artifacts',`permission-service-${profile.id.toLowerCase()}-${identity.runId}-${identity.attempt}`),guard);
 let cases=split?t06DefaultCases(profile.stages[0]):null,caseReportObserved=false;
 const fixture=seed?{preflight:'NOT_RUN',restore:'NOT_RUN',archiveSHA:null,storageSHA:null,baselineSHA:null,afterSHA:null}:{postcheck:'NOT_RUN'};
 let seedAdapter,boundary;
 const aliasPrivate=CI1_RUNTIME+'/private',privateRoot=profile.id==='PIN_IDENTITY_SERVER'?aliasPrivate:root+'/private';
 if(profile.id==='PIN_IDENTITY_SERVER')check(!lstatSync(aliasPrivate,{throwIfNoEntry:false}));
 let db,runtime,setupOrdinal=0;
 const stoppedPeerSHA=profile.id==='PIN_EXPIRY'?readStoppedServicePeer(root,identity,env,call):null;
 const status=()=>{const s=JSON.parse(call(CI1_RUNTIME+'/bin/supabase',['status','--workdir',CI1_RUNTIME+'/stack','-o','json']));
  const d=new URL(s.DB_URL);check(s.API_URL==='http://127.0.0.1:'+profile.ports.api&&d.protocol==='postgresql:'&&d.hostname==='127.0.0.1'
   &&d.port===String(profile.ports.db)&&d.pathname==='/postgres'&&!d.search&&!d.hash);return s;};
 const services=()=>{
  const actual=readFileSync(CI1_RUNTIME+'/stack/supabase/config.toml');
  check(serviceConfig(profile.id,readFileSync(source+'/'+(profile.config.path??profile.config.base.path))).equals(actual));
  const pins=ci1ImagesIntake(JSON.parse(readFileSync(source+'/tests/permissions/runtime/ci1-images.json')));
  const names=['db','auth','rest','kong','storage','realtime','edge_runtime','studio','pg_meta','inbucket','vector','analytics'];
  const list=JSON.parse(call('docker',['inspect',...names.map(n=>'supabase_'+n+'_'+CI1_PROJECT)]));check(list.length===12);
  const network='supabase_network_'+CI1_PROJECT,net=JSON.parse(call('docker',['network','inspect',network]));
  check(net.length===1&&net[0].Name===network&&net[0].Options?.['com.docker.network.bridge.host_binding_ipv4']==='127.0.0.1');
  for(let i=0;i<list.length;i++){const c=list[i];check(c.Name==='/supabase_'+names[i]+'_'+CI1_PROJECT&&c.State.Running
   &&(!c.State.Health||c.State.Health.Status==='healthy')&&c.Config.Labels?.['com.supabase.cli.project']===CI1_PROJECT&&c.NetworkSettings.Networks?.[network]);
   for(const bindings of Object.values(c.NetworkSettings.Ports??{}))for(const b of bindings??[])check(['127.0.0.1','::1'].includes(b.HostIp));
   const pin=pins.find(p=>p.ref===c.Config.Image),image=JSON.parse(call('docker',['image','inspect',c.Config.Image]))[0];
   ci1PinnedImageProof(pin,{image:c.Config.Image,imageId:c.Image},image);
  }return list;
 };
 const physical=async()=>{guard();const containers=services(),s=status();
  if(!db){const pg=(await import('pg')).default;db=new pg.Client({connectionString:s.DB_URL,connectionTimeoutMillis:5000,statement_timeout:10000});await db.connect();}
  const row=(await db.query("select current_database() database,(select oid::text from pg_database where datname=current_database()) database_oid,current_setting('server_version_num')::int version,current_setting('data_directory') directory,(select system_identifier::text from pg_control_system()) identifier")).rows[0];
  check(row.database==='postgres'&&row.version>=170000&&row.version<180000&&/^\d+$/.test(row.database_oid)&&/^\d+$/.test(row.identifier));
  const c=containers[0],mount=c.Mounts.find(m=>m.Type==='volume'&&m.Name==='supabase_db_'+CI1_PROJECT);check(mount);
  const v=statSync(mount.Source);check(v.dev===statSync(root).dev);
  return runtimeHash({databaseOID:row.database_oid,system_identifier:row.identifier,data_directory:row.directory,stoppedPeerSHA,
   container:c.Id,volumeDevice:v.dev,volumeInode:v.ino,api:s.API_URL,project:CI1_PROJECT});
 };
 const seedPrepare=async stage=>{
  const baseline=await seedAdapter.baseline(),physicalSHA=await physical();
  boundary=await createT04FixtureBoundary({root,identity,guard,physical,baseline,preserved:seedAdapter.preserved,deadline,
    resourceGuard:()=>assertT04ResourceFacts(readCi1LinuxEnvelope(root,identity),identity)});
  Object.assign(fixture,{baselineSHA:baseline,archiveSHA:boundary.archiveSHA,storageSHA:boundary.storageSHA,preflight:'FAIL'});
  const proof=await boundary.preflight();
  check(proof.status==='PASS'&&proof.archiveSHA===boundary.archiveSHA&&proof.storageSHA===boundary.storageSHA
    &&proof.baselineSHA===baseline&&proof.physicalSHA===physicalSHA&&await physical()===physicalSHA
    &&await seedAdapter.preserved(baseline));
  fixture.preflight='PASS';
  await boundary.prepare(stage);
 };
 const t06After=async stage=>{
  if(seed){
   fixture.restore='FAIL';
   const physicalSHA=await physical();
   fixture.afterSHA=await boundary.observe(t04Lifecycle(stage).post);
   const restored=await boundary.restore(stage,fixture.afterSHA);
   check(restored.stage===stage&&restored.status==='RESTORED_ORIGINAL'&&restored.archiveSHA===fixture.archiveSHA
     &&restored.beforeResetSHA===fixture.afterSHA&&restored.baselineSHA===fixture.baselineSHA&&restored.physicalSHA===physicalSHA
     &&await physical()===physicalSHA&&await seedAdapter.preserved(fixture.baselineSHA));
   fixture.restore='RESTORED_ORIGINAL';
  }else{
   fixture.postcheck='FAIL';
   const helper=await import(join(testSource,'tests/supabase/permissionPinAckEnvironment.ts'));
   await helper.assertPinAckTarget(db,helper.pinAckEnvironment());
   fixture.postcheck='PASS';
  }
 };
 const receipt=await runServiceProfile(profile.id,{guard,
  bootstrap:async()=>{setupOrdinal=1;services();status();setupOrdinal=2;
   if(seed){
    seedAdapter=await realAdapter(root,identity);
    await seedAdapter.bootstrap();
    env.IDEM_ENV_FILE=privateRoot+'/bridge.env';
    install(testSource);
   }else if(split){
    install(source);
    install(testSource);
    call(process.execPath,[testSource+'/scripts/permission-pin-ack-prepare.mjs',privateRoot],300000,testSource);
    Object.assign(env,servicePreparedEnvironment(profile.id,privateRoot));
    process.env.PIN_ACK_ENV_FILE=env.PIN_ACK_ENV_FILE;
    env.PIN_ACK_REPORT_FILE=join(privateRoot,'ack-browser-safe.json');
   }else if(profile.id==='SUPABASE_T02'||profile.id==='PIN_IDENTITY_ONBOARDING'||profile.id==='PIN_IDENTITY_SERVER'){
    runtime=await import(profile.id==='SUPABASE_T02'?'./permission-bridge-runtime.mjs':profile.id==='PIN_IDENTITY_SERVER'?'./permission-pin-identity-runtime.mjs':'./permission-identity-runtime.mjs');
    await runtime.bootstrapBridgeRuntime(privateRoot);env.IDEM_ENV_FILE=privateRoot+'/bridge.env';
    if(profile.id==='PIN_IDENTITY_SERVER')env.PIN_IDENTITY_RUNTIME='close1';
   }else if(['PIN_ONBOARD','PIN_RACE','PIN_EXPIRY'].includes(profile.id)){
    const part=profile.id==='PIN_ONBOARD'?'onboard':profile.id==='PIN_RACE'?'race':'expiry';
    call(process.execPath,[source+'/scripts/permission-pin-'+part+'-prepare.mjs',privateRoot],300000);
    Object.assign(env,servicePreparedEnvironment(profile.id,privateRoot));
   }else check(profile.id==='PIN_CANARY');setupOrdinal=3;
  },physical,prepare:async stage=>{check(Date.now()<deadline);if(seed)await seedPrepare(stage);},
  stage:async stage=>{
   const settings=seed?t04StageEnvironment(stage,env):env;
   const execute=()=>executeRuntimeStage(stage,{sourceRoot:testSource,outputRoot,baseEnv:settings,sourceSHA,sourceFingerprint,
     lockSHA,runId:identity.runId,guard,deadline,...(split?{observeReport:(expected,report,context)=>{
      cases=t06ObservedCases(expected,report,context);
      caseReportObserved=true;
     }}:{})});
   let result;
   try{result=await execute();}
   catch(error){
    if(split){
     if(error?.runtimeStageBoundaryOrdinal>=4&&!caseReportObserved)
      cases=cases.map(item=>({...item,status:'UNVERIFIED'}));
     await t06After(stage).catch(()=>{});
    }
    throw error;
   }
   if(split){check(cases.every(item=>item.status==='PASS'));await t06After(stage);}
   return result;
  },
  diagnostic:(stage,error)=>{
   const facts={serviceStageOrdinal:profile.stages.indexOf(stage)+1,serviceSetupOrdinal:setupOrdinal,...serviceStageErrorFacts(error),serviceReportObserved:0};
   const expected=profile.stages.includes(stage)?runtimeStage(stage):null;
   if(expected)try{
    const command=runtimeStageCommand(stage,{sourceRoot:testSource,outputRoot}),path=join(command.reportRoot,stage+'-runner.json'),s=lstatSync(path,{throwIfNoEntry:false});
    if(!s)facts.serviceReportObserved=3;
    else{
     facts.serviceReportObserved=2;
     check(s.isFile()&&!s.isSymbolicLink()&&s.nlink===1&&s.uid===0&&(s.mode&0o077)===0&&s.size<=1024**2
      &&s.dev===statSync(root).dev&&realpathSync(path)===path);
     const r=JSON.parse(readFileSync(path));
     assertRuntimeDiagnosticBinding(expected,r,{sourceSHA,sourceFingerprint,lockSHA,configSHA:expected.configSHA,
      runId:identity.runId,invocationSHA:runtimeHash(command.runnerArgv),argv:command.runnerArgv});
     Object.assign(facts,serviceRunnerFailureFacts(expected,r));facts.serviceReportObserved=1;
    }
   }catch{/* Invalid/missing reports never become PASS or invented counts. */}
   if(stage==='pin-tc18-wrapper'){
    Object.assign(facts,{serviceTc18ReceiptObserved:2,serviceTc18WrapperStatus:0,serviceTc18WrapperCodeOrdinal:0,serviceTc18ControlDeleted:0});
    try{
     guard();const command=runtimeStageCommand(stage,{sourceRoot:source,outputRoot});
     Object.assign(facts,readTc18WrapperReceipt({sourceRoot:source,outputRoot:command.reportRoot,device:statSync(root).dev,
      expected:{stage,sourceSHA,sourceFingerprint,lockSHA,configSHA:expected.configSHA,runId:identity.runId,invocationSHA:runtimeHash(command.runnerArgv)}}));
    }catch{/* Receipt admission failure preserves the original bounded facts. */}
   }
   console.error('SERVICE_FAILURE_FACTS '+JSON.stringify(facts));
  },
  close:async()=>{
   let okay=true;
   try{if(boundary)await boundary.close();}catch{okay=false;}
   try{if(db)await db.end();}catch{okay=false;}
   try{if(seedAdapter)await seedAdapter.close();}catch{okay=false;}
   return okay;
  }});
 if(split){
  if(!seed&&env.PIN_ACK_REPORT_FILE)cases=t06AckPhases(env.PIN_ACK_REPORT_FILE,cases);
  let candidatePreserved=false;
  try{candidatePreserved=t06CandidateCheckout(root).sourceFingerprint===sourceFingerprint;}catch{}
  if(!candidatePreserved&&receipt.status==='PASS'){
   receipt.status='FAIL';receipt.failure='candidate-preservation';
  }
  receipt.t06={candidatePreserved,candidateTree:candidate.tree,cases,fixture};
 }
 Object.assign(receipt,{repository:process.env.GITHUB_REPOSITORY,runId:identity.runId,attempt:identity.attempt,
  sourceSHA,workflowSHA,sourceFingerprint,lockSHA,stoppedPeerSHA});
 const rendered=renderServiceEvidence(receipt);writeFileSync(root+'/private/public-evidence.json',rendered.json,{flag:'wx',mode:0o600});
 writeFileSync(root+'/private/public-summary.md',rendered.markdown,{flag:'wx',mode:0o600});if(receipt.status!=='PASS')process.exitCode=1;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){try{await main();}
 catch(error){console.error(ci1HarnessFailureMarker(10,error));process.exitCode=78;}}
