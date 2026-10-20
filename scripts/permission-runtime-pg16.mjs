import{readFileSync,writeFileSync,mkdirSync,lstatSync,statfsSync,realpathSync}from'node:fs';
import{join,resolve}from'node:path';
import{execFileSync}from'node:child_process';
import{pathToFileURL}from'node:url';
import{runtimeHash}from'./permission-runtime-results.mjs';
import{runtimeStage}from'./permission-runtime-catalog.mjs';
import{executeRuntimeStage,prepareRuntimeDirectory}from'./permission-runtime-stage.mjs';
import{allocatedBytes,trackedFingerprint}from'./project-ci.mjs';
import{coreDumpDisabled}from'./project-ci-launch.mjs';
import{pg16Layout,createPg16Control,removePg16Root}from'./permission-runtime-pg16-cleanup.mjs';
import{runtimeErrorFacts,safeRuntimeErrorFacts}from'./permission-runtime-error-facts.mjs';
export{pg16Layout}from'./permission-runtime-pg16-cleanup.mjs';

const GiB=1024**3,stage='legacy-t01-database',expected=runtimeStage(stage),refuse=()=>{throw Error('PERMISSION_PG16_RUNTIME_REFUSED');};
const check=x=>{if(!x)refuse();};
let diagnosticStep=0;
export function pg16FailureRecord(error,operation,step,cleanup,report){
  const facts=safeRuntimeErrorFacts(report?.failureFacts)??runtimeErrorFacts(error),n=(v,max)=>Number.isInteger(v)&&v>=0&&v<=max?v:0;
  return{operation:n(operation,4),step:n(step,30),rootRemoved:cleanup?.rootRemoved===true,processReleased:cleanup?.processReleased===true,
    ...facts,runnerErrors:n(report?.errorCount,10000),hookErrors:n(report?.hookErrorCount,10000),
    failedTests:Array.isArray(report?.results)?n(report.results.filter(r=>r?.state==='failed').length,10000):0};
}
export async function runPg16Profile(adapter){
  let result=null,physical=null,failure=null,cleanup=null,operation='BOOTSTRAP';
  try{adapter.guard();await adapter.bootstrap();physical=await adapter.physical();check(/^[a-f0-9]{64}$/.test(physical));
    operation='STAGE';result=await adapter.stage();check(result?.stage===stage&&result.status==='PASS'&&result.required===expected.required.length
      &&Number.isSafeInteger(result.run)&&result.run>=result.required&&result.pass===result.run&&result.fail===0&&result.skip===0&&result.retry===0);
    operation='POSTCHECK';adapter.guard();check(await adapter.physical()===physical);
  }catch(error){failure=operation;try{adapter.diagnostic?.(error,operation);}catch{}}
  finally{try{cleanup=await adapter.close();}catch{}if(cleanup?.rootRemoved!==true||cleanup?.processReleased!==true)failure??='CLEANUP';}
  return{schemaVersion:'permission-pg16-runtime-v1',scope:'NATIVE_PG16_T01_ONLY',status:failure?'FAIL':'PASS',failure,
    stage:result,physicalSHA:physical,cleanup,full35BusinessRuntime:'NOT_RUN',remainingBusinessStages:34,
    supplementalOracles:'NOT_PROVEN_BY_STAGE_COUNTS'};
}
export function pg16ProfileCounts(r,binding){
  check(r?.schemaVersion==='permission-pg16-runtime-v1'&&r.scope==='NATIVE_PG16_T01_ONLY'&&r.status==='PASS'&&r.failure===null
    &&r.full35BusinessRuntime==='NOT_RUN'&&r.remainingBusinessStages===34&&r.supplementalOracles==='NOT_PROVEN_BY_STAGE_COUNTS'
    &&r.sourceSHA===binding.sourceSHA&&r.sourceFingerprint===binding.sourceFingerprint&&r.lockSHA===binding.lockSHA&&r.runId===binding.runId
    &&Number.isInteger(r.serverVersionNum)&&r.serverVersionNum>=160000&&r.serverVersionNum<170000
    &&/^[a-f0-9]{64}$/.test(r.physicalSHA??'')&&r.cleanup?.rootRemoved===true&&r.cleanup.processReleased===true);
  const s=r.stage;check(s?.stage===stage&&s.status==='PASS'&&s.sourceSHA===binding.sourceSHA&&s.required===expected.required.length
    &&Number.isSafeInteger(s.run)&&s.run>=s.required&&s.run===s.discovered&&s.pass===s.run&&s.fail===0&&s.skip===0&&s.retry===0
    &&['reportSHA','invocationSHA'].every(k=>/^[a-f0-9]{64}$/.test(s[k]??'')));
  return{run:s.run,pass:s.pass,fail:0,skip:0};
}
export function renderPg16Evidence(r,binding){
  pg16ProfileCounts(r,binding);
  const exact=(value,keys)=>check(value&&Object.keys(value).sort().join(',')===keys.sort().join(','));
  exact(r,['schemaVersion','scope','status','failure','stage','physicalSHA','cleanup','full35BusinessRuntime',
    'remainingBusinessStages','supplementalOracles','sourceSHA','sourceFingerprint','lockSHA','runId','serverVersionNum']);
  exact(r.stage,['stage','status','required','run','discovered','pass','fail','skip','retry','sourceSHA','reportSHA','invocationSHA','supplementalOracles']);
  exact(r.cleanup,['rootRemoved','processReleased','allocatedBeforeBytes','measuredFreeDeltaBytes']);
  check(Number.isSafeInteger(r.cleanup.allocatedBeforeBytes)&&r.cleanup.allocatedBeforeBytes>=0&&r.cleanup.allocatedBeforeBytes<=5*GiB
    &&Number.isSafeInteger(r.cleanup.measuredFreeDeltaBytes)&&Math.abs(r.cleanup.measuredFreeDeltaBytes)<=5*GiB
    &&r.stage.supplementalOracles==='NOT_PROVEN_BY_STAGE_COUNTS');
  const json=JSON.stringify(r,null,2)+'\n';check(Buffer.byteLength(json)<=16384);return{json};
}
async function main(){
  diagnosticStep=1;
  check(process.argv.length===3&&process.platform==='linux'&&process.getuid?.()>0&&process.env.GITHUB_ACTIONS==='true'
    &&process.env.RUNNER_ENVIRONMENT==='github-hosted'&&process.env.GITHUB_REPOSITORY==='nguyentronglinh045/pos-cafe'
    &&process.env.GITHUB_REPOSITORY_ID==='1263057386');
  const source=realpathSync(process.cwd()),layout=pg16Layout(process.env.GITHUB_RUN_ID,Number(process.env.GITHUB_RUN_ATTEMPT));
  diagnosticStep=2;
  check(readFileSync('/proc/self/cgroup','utf8').trim()==='0::/system.slice/'+layout.unit);
  const cg='/sys/fs/cgroup/system.slice/'+layout.unit,scalar=n=>readFileSync(cg+'/'+n,'utf8').trim(),uid=process.getuid();
  check(scalar('cpu.max')==='300000 100000'&&scalar('memory.max')===String(8*GiB)&&scalar('memory.swap.max')==='0'&&scalar('pids.max')==='1024');
  const binary='/usr/lib/postgresql/16/bin/',git=args=>execFileSync('git',args,{cwd:source,encoding:'utf8',timeout:10000,maxBuffer:128*1024});
  diagnosticStep=3;
  const paths=git(['ls-files','-z']).split('\0').filter(Boolean).sort(),sourceSHA=git(['rev-parse','HEAD']).trim();
  check(sourceSHA===process.env.GITHUB_SHA&&!git(['diff','--name-only','HEAD','--']).trim());
  const sourceFingerprint=trackedFingerprint(source,paths),lockSHA=runtimeHash(readFileSync(join(source,'package-lock.json')));
  const task=realpathSync(process.env.RUNNER_TEMP),deadline=Date.now()+5*60000;
  for(const p of['/var','/var/tmp'])check(realpathSync(p)===p&&!lstatSync(p).isSymbolicLink());
  check(!lstatSync(layout.root,{throwIfNoEntry:false}));
  const rootInfo={};let created=false,started=null,db,serverVersionNum=null;
  const rootGuard=()=>{
    if(!created)return;const s=lstatSync(layout.root);check(s.isDirectory()&&!s.isSymbolicLink()&&realpathSync(layout.root)===layout.root
      &&s.uid===uid&&(s.mode&0o777)===0o700&&s.dev===rootInfo.dev&&s.ino===rootInfo.ino);
  };
  const guard=()=>{
    rootGuard();check(trackedFingerprint(source,paths)===sourceFingerprint);
    for(const p of[source,task,'/var/tmp']){const f=statfsSync(p);check(f.bavail*f.bsize>=30*GiB);}
    check(Date.now()<deadline&&allocatedBytes([source,source+'/.git',task,layout.root])<=5*GiB&&allocatedBytes([layout.root])<=GiB
      &&Number(scalar('memory.current'))<8*GiB&&/^oom 0$/m.test(scalar('memory.events'))&&/^oom_kill 0$/m.test(scalar('memory.events'))
      &&/^max 0$/m.test(scalar('pids.events')));
    if(created){const log=lstatSync(layout.private+'/server.log',{throwIfNoEntry:false});check(!log||log.isFile()&&!log.isSymbolicLink()&&log.size<=1024**2);}
  };
  const call=(name,args,cleanup=false)=>{if(cleanup)rootGuard();else guard();
    return execFileSync(name,args,{encoding:'utf8',timeout:cleanup?15000:30000,maxBuffer:1024**2,stdio:['ignore','pipe','pipe'],
      env:{PATH:'/usr/bin:/bin',LANG:'C.UTF-8',HOME:layout.root,TMPDIR:layout.root}});};
  diagnosticStep=4;
  for(const n of['postgres','pg_ctl','initdb']){const s=lstatSync(binary+n);check(s.isFile()&&!s.isSymbolicLink()&&s.uid===0&&realpathSync(binary+n)===binary+n);}
  check(/^postgres \(PostgreSQL\) 16\.\d+/.test(call(binary+'postgres',['--version'])));
  const output=prepareRuntimeDirectory(source,resolve(process.argv[2]),guard);
  diagnosticStep=5;
  const processProof=pid=>{
    check(Number.isInteger(pid)&&pid>1&&lstatSync('/proc/'+pid).uid===uid&&realpathSync('/proc/'+pid+'/exe')===binary+'postgres');
    const argv=readFileSync('/proc/'+pid+'/cmdline','utf8').split('\0');check(argv.includes('-D')&&argv[argv.indexOf('-D')+1]===layout.data);
    check(readFileSync('/proc/'+pid+'/cgroup','utf8').trim()==='0::/system.slice/'+layout.unit);
    check(coreDumpDisabled(readFileSync('/proc/'+pid+'/limits','utf8'),readFileSync('/proc/sys/kernel/core_pattern','utf8')));
    const s=readFileSync('/proc/'+pid+'/stat','utf8');return s.slice(s.lastIndexOf(')')+2).split(' ')[19];
  };
  let diagnostic=null;
  const receipt=await runPg16Profile({guard,diagnostic:(error,operation)=>{
    let report=null;try{const p=join(output,stage+'-runner.json'),s=lstatSync(p);if(s.isFile()&&!s.isSymbolicLink()&&s.size<=1024**2)report=JSON.parse(readFileSync(p));}catch{}
    diagnostic=pg16FailureRecord(error,['BOOTSTRAP','STAGE','POSTCHECK','CLEANUP'].indexOf(operation)+1,diagnosticStep,null,report);
  },
    bootstrap:async()=>{
      diagnosticStep=6;
      guard();mkdirSync(layout.root,{mode:0o700});created=true;Object.assign(rootInfo,lstatSync(layout.root));rootGuard();
      createPg16Control(layout,source,sourceSHA);
      mkdirSync(layout.private,{mode:0o700});mkdirSync(layout.root+'/socket',{mode:0o700});
      diagnosticStep=7;call(binary+'initdb',['-D',layout.data,'--username=postgres','--auth=trust','--encoding=UTF8','--locale=C.UTF-8','--no-instructions']);
      const options=`-h 127.0.0.1 -p ${layout.port} -k ${layout.root}/socket -c shared_buffers=32MB -c max_connections=40 -c max_wal_size=128MB -c min_wal_size=80MB -c fsync=on`;
      diagnosticStep=8;call(binary+'pg_ctl',['-D',layout.data,'-l',layout.private+'/server.log','-w','-t','15','-o',options,'start']);
      diagnosticStep=9;
      const pid=Number(readFileSync(layout.data+'/postmaster.pid','utf8').split('\n')[0]);started={pid,ticks:processProof(pid)};
      diagnosticStep=10;const pg=(await import('pg')).default;db=new pg.Client({connectionString:`postgresql://postgres@127.0.0.1:${layout.port}/postgres`,connectionTimeoutMillis:5000,statement_timeout:30000});await db.connect();
      diagnosticStep=11;const bootstrap=await import('./permission-fixture-bootstrap.mjs');diagnosticStep=12;await bootstrap.bootstrapFixture({adminDsn:`postgresql://postgres@127.0.0.1:${layout.port}/postgres`,
        expectedDataDirectory:layout.data,runtimeDirectory:layout.private});guard();
    },
    physical:async()=>{diagnosticStep=13;guard();check(started&&processProof(started.pid)===started.ticks);
      const r=(await db.query("select current_setting('server_version_num')::int version,current_setting('data_directory') directory,(select system_identifier::text from pg_control_system()) identifier")).rows[0];
      check(r.version>=160000&&r.version<170000&&r.directory===layout.data&&/^\d+$/.test(r.identifier));serverVersionNum=r.version;return runtimeHash(r);},
    stage:()=>{diagnosticStep=14;return executeRuntimeStage(stage,{sourceRoot:source,outputRoot:output,baseEnv:{...process.env,IDEM_ENV_FILE:layout.private+'/observer.env'},
      sourceSHA,sourceFingerprint,lockSHA,runId:process.env.GITHUB_RUN_ID,guard,deadline});},
    close:async()=>{
      try{if(db)await db.end();}catch{/* Exact owned server shutdown below also closes this fixture-only connection. */}
      if(!created)return{rootRemoved:true,processReleased:true,allocatedBeforeBytes:0,measuredFreeDeltaBytes:0};
      rootGuard();const pidFile=lstatSync(layout.data+'/postmaster.pid',{throwIfNoEntry:false});
      if(pidFile){check(pidFile.isFile()&&!pidFile.isSymbolicLink()&&pidFile.uid===uid&&pidFile.size<8192);
        const pid=Number(readFileSync(layout.data+'/postmaster.pid','utf8').split('\n')[0]),ticks=processProof(pid);
        if(started)check(pid===started.pid&&ticks===started.ticks);else started={pid,ticks};
        call(binary+'pg_ctl',['-D',layout.data,'-m','fast','-w','-t','10','stop'],true);}
      check(!lstatSync(layout.data+'/postmaster.pid',{throwIfNoEntry:false}));
      const stillOwned=()=>{if(!started)return false;try{const s=readFileSync('/proc/'+started.pid+'/stat','utf8');
        return s.slice(s.lastIndexOf(')')+2).split(' ')[19]===started.ticks;}catch(error){if(error.code==='ENOENT')return false;throw error;}};
      const until=Date.now()+3000;while(stillOwned()&&Date.now()<until)await new Promise(done=>setTimeout(done,50));check(!stillOwned());
      const reclaimed=removePg16Root(layout,source,sourceSHA);created=false;return reclaimed;
    }});
  Object.assign(receipt,{sourceSHA,sourceFingerprint,lockSHA,runId:process.env.GITHUB_RUN_ID,serverVersionNum});
  writeFileSync(join(output,'profile-safe.json'),JSON.stringify(receipt)+'\n',{flag:'wx',mode:0o600});
  if(receipt.status==='PASS')console.log('PERMISSION_PG16_PROFILE '+JSON.stringify(JSON.parse(renderPg16Evidence(receipt,{sourceSHA,sourceFingerprint,lockSHA,runId:process.env.GITHUB_RUN_ID}).json)));
  else{diagnostic??=pg16FailureRecord(null,4,diagnosticStep,null,null);
    diagnostic.rootRemoved=receipt.cleanup?.rootRemoved===true;diagnostic.processReleased=receipt.cleanup?.processReleased===true;
    console.log('PERMISSION_PG16_FAILURE_FACTS '+JSON.stringify(diagnostic));process.exitCode=1;}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){try{await main();}catch(error){
  console.error('PERMISSION_PG16_FAILURE_FACTS '+JSON.stringify(pg16FailureRecord(error,0,diagnosticStep,null,null)));
  console.error('PERMISSION_PG16_RUNTIME_REFUSED');process.exitCode=1;}}
