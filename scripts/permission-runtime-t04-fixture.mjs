import {readFileSync,writeFileSync,lstatSync,statSync,realpathSync,mkdirSync,readlinkSync} from 'node:fs';
import {execFileSync,spawnSync} from 'node:child_process';
import {join,dirname} from 'node:path';
import {runtimeStageCatalog} from './permission-runtime-catalog.mjs';
import {runtimeHash} from './permission-runtime-results.mjs';
import {CI1_PROJECT,CI1_RUNTIME,CI1_LIMITS,ci1Identity,ci1TrustedRepository} from './permission-ci1-policy.mjs';
import {coreDumpDisabled} from './project-ci-launch.mjs';
import{containerContinuityHash}from'./permission-runtime-container-state.mjs';
import{t04CorrelateRestoreLog,t04CorrelateServerLog,T04_RESTORE_SQLSTATES,
 t04RestoreConstraintTarget,t04ConstraintCatalogFacts,t04LogCapabilityMask}from'./permission-runtime-t04-restore-diagnostic.mjs';

const catalog=runtimeStageCatalog().filter(s=>s.runtimeProfile==='SUPABASE_T04');
const resets=new Set(['candidate-e2e','candidate-seed-recovery-database','candidate-roles-e2e','realtime-e2e',
  'rollback-additive-database','rollback-preflight-database','rollback-recovery-database',
  'transition-database','transition-e2e','transition-compatibility-database']);
const fail=()=>{throw Error('T04_FIXTURE_BOUNDARY_REFUSED');};
const check=value=>{if(!value)fail();};
// Only fixed ordinals leave the private pg_restore stderr buffer. No SQL,
// identifiers, DETAIL text, paths or exception messages enter public evidence.
export function t04RestoreFailureFacts(stderr){
 if(Buffer.isBuffer(stderr)){if(stderr.length>1024**2)return{};stderr=stderr.toString('utf8');}
 if(typeof stderr!=='string'||Buffer.byteLength(stderr)>1024**2||!stderr.includes('pg_restore:'))return{};
 const primary=stderr.match(/^pg_restore: error: could not execute query: (?:ERROR|FATAL):\s*([^\r\n]*)/m)?.[1]
  ??stderr.match(/^pg_restore: error: ((?!could not execute query:)[^\r\n]*)/m)?.[1]??'';
 const errors=[/^cannot drop .* because other objects depend on it$/i,/ already exists$/i,/ does not exist$/i,
  /^(?:permission denied|must be (?:owner|superuser)|not permitted)/i,/^.*violates foreign key constraint/i,
  /^duplicate key value|^.*violates unique constraint/i,/^.*violates check constraint|^.*violates not-null constraint/i,
  /^syntax error/i,/^.*(?:not supported|unsupported)/i,/^.*(?:being accessed by other users|active .*connection)/i,
  /^(?:invalid (?:value|parameter)|unrecognized configuration parameter)/i,/^(?:no space left|could not (?:read|write|open) file)/i,
  /^(?:statement timeout|lock timeout|canceling statement)/i,/^.*cannot run inside a transaction block/i,
  /^(?:input file.*(?:not|too)|unexpected end of file|did not find magic string)/i];
 const command=stderr.match(/(?:^|\n)Command was: ([^\r\n]*)/)?.[1]??'';
 const commands=[/^DROP SCHEMA\b/,/^DROP EXTENSION\b/,/^DROP TABLE\b/,/^ALTER TABLE\b.*\bDROP CONSTRAINT\b/,
  /^DROP FUNCTION\b/,/^DROP TYPE\b/,/^DROP TRIGGER\b/,/^DROP POLICY\b/,/^DROP PUBLICATION\b/,
  /^DROP EVENT TRIGGER\b/,/^CREATE SCHEMA\b/,/^CREATE EXTENSION\b/,/^CREATE TABLE\b/,/^ALTER TABLE\b/,
  /^COPY\b/,/^COMMENT\b/,/^(?:GRANT|REVOKE)\b/,/^SET\b/,/^SELECT\b/,/^CREATE FUNCTION\b/,
  /^CREATE POLICY\b/,/^CREATE PUBLICATION\b/,/^DROP\b/,/^CREATE\b/];
 return{t04RestoreErrorOrdinal:errors.findIndex(p=>p.test(primary))+1,
  t04RestoreCommandOrdinal:commands.findIndex(p=>p.test(command))+1};
}
// PG17 grants a non-superuser creator ADMIN-only membership in its new role.
// The fixed fixture creator is postgres; the bootstrap superuser is supabase_admin.
// Keep all unrelated edges byte-for-byte for the original-baseline comparison.
export function t04BaselineMemberships(rows,hasRecovery){
 check(Array.isArray(rows)&&rows.length<=10000&&typeof hasRecovery==='boolean');
 const fields=['role','member','grantor','admin_option','inherit_option','set_option'];
 for(const row of rows)check(row&&Object.keys(row).sort().join(',')===fields.slice().sort().join(',')
  &&['role','member','grantor'].every(k=>typeof row[k]==='string'&&Buffer.byteLength(row[k])>=1&&Buffer.byteLength(row[k])<=63)
  &&['admin_option','inherit_option','set_option'].every(k=>typeof row[k]==='boolean'));
 const related=rows.filter(r=>[r.role,r.member,r.grantor].includes('pos_owner_recovery'));
 if(hasRecovery)check(related.length===1&&related[0].role==='pos_owner_recovery'&&related[0].member==='postgres'
  &&related[0].grantor==='supabase_admin'&&related[0].admin_option===true&&related[0].inherit_option===false&&related[0].set_option===false);
 else check(related.length===0);
 return rows.filter(r=>![r.role,r.member,r.grantor].includes('pos_owner_recovery'));
}
// The same real resource/write/namespace facts are required while eleven
// services are deliberately stopped. Container continuity is checked separately;
// no read-back fact is changed to pretend that stopped containers are running.
export function assertT04ResourceFacts(p,identity){
  const expected=ci1Identity(identity.runId,identity.attempt),GiB=1024**3;
  check(p&&p.platform==='linux'&&p.arch==='x64'&&p.githubHosted===true&&p.publicRepository===true
    &&p.hostCPUs===4&&p.hostMemoryBytes>=14*GiB&&p.hostMemoryBytes<=18*GiB&&ci1TrustedRepository(p.repository)
    &&p.manual===true&&p.unit===expected.unit&&p.cgroup===`/system.slice/${expected.unit}`&&p.delegatedSupervisor===true);
  check(p.cpuMax===`${CI1_LIMITS.cpuQuota} ${CI1_LIMITS.cpuPeriod}`&&p.memoryMax===String(CI1_LIMITS.memoryBytes)
    &&p.swapMax==='0'&&p.pidsMax===String(CI1_LIMITS.pids)&&p.runtimeSeconds===CI1_LIMITS.runtimeSeconds
    &&p.killMode==='control-group'&&p.stopGraceSeconds===CI1_LIMITS.stopGraceSeconds&&p.standardOutput==='null'&&p.standardError==='null');
  check(p.filesystem==='ext4'&&p.loopBacked===true&&p.imageBytes===CI1_LIMITS.filesystemBytes
    &&p.filesystemBytes<=CI1_LIMITS.filesystemBytes&&p.imageAllocatedBytes>=CI1_LIMITS.filesystemBytes
    &&p.imageAllocatedBytes<=CI1_LIMITS.filesystemBytes+1024**2&&p.filesystemBytes>0
    &&p.filesystemFreeBytes>=CI1_LIMITS.filesystemReserveBytes&&p.hostFreeBytes>=CI1_LIMITS.hostReserveBytes&&p.mutablePathsOnVolume===true);
  for(const key of ['hostMemoryBytes','imageAllocatedBytes','filesystemBytes','filesystemFreeBytes','hostFreeBytes','memoryCurrent','pidsCurrent'])
    check(Number.isSafeInteger(p[key])&&p[key]>=0);
  check(p.filesystemFreeBytes<=p.filesystemBytes&&p.memoryCurrent<CI1_LIMITS.memoryBytes&&p.pidsCurrent<CI1_LIMITS.pids
    &&p.oomEvents===0&&p.pidsLimitEvents===0&&p.privateNamespaces===true&&p.noDefaultRoute===true&&p.ownedDaemon===true);
  return true;
}
export function t04Lifecycle(stage){
  check(catalog.some(s=>s.stage===stage));
  const pre=['candidate-seed-recovery-database','candidate-roles-e2e','realtime-e2e'].includes(stage)?'activated':
    stage==='transition-compatibility-database'?'bridge':'legacy';
  const post=stage==='rollback-recovery-database'?'candidate-pass-through':
    ['candidate-e2e','candidate-roles-e2e','realtime-e2e','transition-database','transition-e2e'].includes(stage)?'activated':pre;
  return {pre,post,reset:resets.has(stage)};
}
export function t04StageEnvironment(stage,baseEnv,privateDirectory){
  const spec=catalog.find(s=>s.stage===stage);check(spec);
  const env={...baseEnv};delete env.PERM_ROLLBACK_VARIANT;delete env.PERM_REALTIME_PRIVATE_ARTIFACT_DIR;
  if(spec.rollbackVariant)env.PERM_ROLLBACK_VARIANT=spec.rollbackVariant;
  if(stage==='realtime-e2e'){
    check(typeof privateDirectory==='string'&&privateDirectory.startsWith('/')&&privateDirectory.split('/').includes('private')
      &&!privateDirectory.split('/').some(p=>p==='..'||p==='.')&&!/[\r\n\0]/.test(privateDirectory));
    env.PERM_REALTIME_PRIVATE_ARTIFACT_DIR=privateDirectory;
  }
  return env;
}
export function assertT04ContainerContinuity(before,after,{stopped=false,cgroup,device,readCgroup,readLimits,pattern}){
  check(Array.isArray(before)&&Array.isArray(after)&&before.length===12&&after.length===12
    &&new Set(after.map(c=>c.Id)).size===12);
  for(const old of before){
    const current=after.find(c=>c.Id===old.Id);check(current&&containerContinuityHash(current)
      ===containerContinuityHash(old)&&current.Config.Labels?.['com.supabase.cli.project']===CI1_PROJECT);
    const isDB=current.Name==='/supabase_db_'+CI1_PROJECT;
    check(current.State.Running===(!stopped||isDB));
    for(const mount of current.Mounts)check(mount.Type==='tmpfs'||['bind','volume'].includes(mount.Type)&&statSync(mount.Source).dev===device);
    if(current.State.Running){
      check(Number.isSafeInteger(current.State.Pid)&&current.State.Pid>0&&readCgroup(current.State.Pid).trim().split('\n')
        .some(line=>line.startsWith('0::'+cgroup+'/'))&&coreDumpDisabled(readLimits(current.State.Pid),pattern));
    }else check(current.State.Pid===0);
  }
  return true;
}

// One immutable logical checkpoint of this newly created synthetic capsule.
// It never opens a remote endpoint or replaces the database/container/volume.
export async function createT04FixtureBoundary({root,identity,guard,resourceGuard,physical,baseline,preserved,deadline}){
  let step=1,preflightPhase=0;
  const failure=error=>{if(error&&typeof error==='object'){error.t04BoundaryOrdinal=step;error.t04PreflightOrdinal=preflightPhase;}return error;};
  const checked=fn=>async(...args)=>{try{return await fn(...args);}catch(error){throw failure(error);}};
  try{
  guard();check(process.platform==='linux'&&process.getuid?.()===0&&process.versions.node==='24.16.0'
    &&root===realpathSync(root)&&realpathSync(process.cwd())===join(root,'source'));
  const runtime=await import('./permission-identity-runtime.mjs');
  const inventory=await import('./permission-inventory.mjs');
  const pg=(await import('pg')).default;
  const privateRoot=join(root,'private'),device=statSync(root).dev;
  const ownFile=(path,max)=>{const s=lstatSync(path);check(s.isFile()&&!s.isSymbolicLink()&&realpathSync(path)===path
    &&s.uid===0&&(s.mode&0o077)===0&&s.nlink===1&&s.dev===device&&s.size>0&&s.size<=max);return s;};
  const call=(name,args,{input,maxBuffer=1024**2,timeout=30000,env}={})=>{
    try{
    resourceGuard();check(Date.now()+1000<deadline);
    const value=execFileSync(name,args,{input,env,timeout:Math.min(timeout,deadline-Date.now()),maxBuffer,
      stdio:[input===undefined?'ignore':'pipe','pipe','pipe']});resourceGuard();return value;
    }catch(error){if(step===15&&error&&typeof error==='object')error.t04RestoreFacts=t04RestoreFailureFacts(error.stderr);throw failure(error);}
  };
  step=2;
  const inspect=()=>JSON.parse(call('docker',['inspect',...['db','auth','rest','kong','storage','realtime','edge_runtime','studio',
    'pg_meta','inbucket','vector','analytics'].map(n=>'supabase_'+n+'_'+CI1_PROJECT)]));
  const containers=inspect(),dbContainer=containers.find(c=>c.Name==='/supabase_db_'+CI1_PROJECT);
  check(dbContainer&&containers.length===12);
  const services=containers.filter(c=>c.Id!==dbContainer.Id).map(c=>c.Id),cgroup='/system.slice/'+identity.unit;
  const continuity=stopped=>assertT04ContainerContinuity(containers,inspect(),{stopped,cgroup,device,
    readCgroup:pid=>readFileSync(`/proc/${pid}/cgroup`,'utf8'),readLimits:pid=>readFileSync(`/proc/${pid}/limits`,'utf8'),
    pattern:readFileSync('/proc/sys/kernel/core_pattern','utf8')});
  continuity(false);
  step=3;
  const environment=()=>runtime.parseBridgeEnvironment({IDEM_ENV_FILE:join(privateRoot,'bridge.env')});
  const env=environment();check(env.controlPath===join(privateRoot,'fixture-control.json'));
  const files=[join(privateRoot,'bridge.env'),env.controlPath].map(path=>{ownFile(path,65536);return{path,bytes:readFileSync(path)};});
  step=3;
  const logOptions='-c log_error_verbosity=verbose -c log_min_error_statement=error -c log_min_messages=error';
  const db=new pg.Client({connectionString:env.dsn,statement_timeout:30000,connectionTimeoutMillis:5000});await db.connect();
  try{
  const rows=async sql=>(await db.query(sql)).rows;
  const binding=async()=>{
    const r=await rows('select marker,engine,store_ids from private.idempotency_test_environment where singleton');
    check(r.length===1&&r[0].marker===env.marker&&r[0].engine==='supabase-identity-v1'
      &&JSON.stringify(r[0].store_ids)===JSON.stringify(runtime.STORE_IDS));
    for(const schema of ['public.stores','auth.users'])check(JSON.stringify((await rows(`select id from ${schema} order by id`)).map(r=>r.id))
      ===JSON.stringify(runtime.STORE_IDS));
  };
  const financial=async()=>{
    const result=[];for(const table of ['orders','order_items','order_item_options','payments','write_operations','order_events'])
      result.push((await rows(`select md5(coalesce(jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text),'[]')::text) h from public.${table} t`))[0].h);
    return runtimeHash(result);
  };
  const status=JSON.parse(call(CI1_RUNTIME+'/bin/supabase',['status','--workdir',CI1_RUNTIME+'/stack','-o','json']));
  check(status.API_URL===env.api&&typeof status.SERVICE_ROLE_KEY==='string');
  const storage=async()=>{
    const metadata=await rows('select to_jsonb(o) row from storage.objects o order by id');
    const buckets=await rows('select to_jsonb(b) row from storage.buckets b order by id');
    check(metadata.length===6&&buckets.length===3);
    const payloads=[];let total=0;
    for(const {row:o} of metadata){
      check(typeof o.bucket_id==='string'&&typeof o.name==='string'&&!o.name.split('/').includes('..'));
      const response=await fetch(env.api+'/storage/v1/object/authenticated/'+encodeURIComponent(o.bucket_id)+'/'+o.name.split('/').map(encodeURIComponent).join('/'),
        {headers:{apikey:status.SERVICE_ROLE_KEY,Authorization:'Bearer '+status.SERVICE_ROLE_KEY},signal:AbortSignal.timeout(10000)});
      check(response.ok);const reader=response.body.getReader(),chunks=[];let size=0;
      for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;total+=value.length;
        if(size>1024**2||total>6*1024**2){await reader.cancel();fail();}chunks.push(value);}
      payloads.push(runtimeHash(Buffer.concat(chunks)));
    }
    return runtimeHash({metadata,buckets,payloads});
  };
  await binding();const originalPhysical=await physical(),originalFinancial=await financial(),originalStorage=await storage();
  const databaseIdentity=async()=>runtimeHash(await rows(`select current_database() database,
    (select oid from pg_database where datname=current_database()) oid,(select system_identifier::text from pg_control_system()) system_identifier`));
  const originalDatabaseIdentity=await databaseIdentity();
  const resetPhysical=async()=>{continuity(true);check(await databaseIdentity()===originalDatabaseIdentity);};
  check(await preserved(baseline));
  step=4;
  const globals=async()=>{
    const result=await rows(`select rolname,rolsuper,rolinherit,rolcreaterole,rolcreatedb,rolcanlogin,rolreplication,rolbypassrls,rolconnlimit,rolvaliduntil,rolconfig
      from pg_roles order by rolname`);
    // The one reviewed hook is validated independently below, not arbitrary GUCs.
    return result.map(r=>r.rolname!=='authenticator'?r:{...r,rolconfig:
      r.rolconfig?.filter(v=>v!=='pgrst.db_pre_request=public.permission_contract_pre_request').length
        ?r.rolconfig.filter(v=>v!=='pgrst.db_pre_request=public.permission_contract_pre_request'):null});
  };
  const memberships=()=>rows(`select pg_get_userbyid(roleid) role,pg_get_userbyid(member) member,pg_get_userbyid(grantor) grantor,
    admin_option,inherit_option,set_option from pg_auth_members order by 1,2,3`);
  const originalMemberships=runtimeHash(await memberships());
  const settings=async()=>(await rows(`select coalesce(d.datname,'*') database,coalesce(r.rolname,'*') role,s.setconfig
    from pg_db_role_setting s left join pg_database d on d.oid=s.setdatabase left join pg_roles r on r.oid=s.setrole order by 1,2`))
    .map(r=>({...r,setconfig:r.role==='authenticator'&&r.database==='*'
      ?r.setconfig.filter(v=>v!=='pgrst.db_pre_request=public.permission_contract_pre_request'):r.setconfig}))
    .filter(r=>r.setconfig.length>0);
  const originalSettings=runtimeHash(await settings());
  const originalRoles=await globals();check(!originalRoles.some(r=>r.rolname==='pos_owner_recovery'));
  const logging=(await rows(`select current_setting('log_destination') destination,current_setting('logging_collector') collector,
    current_setting('log_line_prefix') prefix`))[0];
  const logCapability=t04LogCapabilityMask(dbContainer.HostConfig?.LogConfig?.Type,logging);
  const readLogs=since=>{
    if(logCapability!==15){
      throw Object.assign(Error('T04_LOG_UNSUPPORTED'),{t04RestoreFacts:{t04RestoreLogObserved:3,t04RestoreSqlstateOrdinal:0,t04RestoreLogCapabilityMask:logCapability}});
    }
    resourceGuard();check(Date.now()+1000<deadline);
    const logs=spawnSync('docker',['logs','--since',since,'--tail','128',dbContainer.Id],
      {timeout:Math.min(5000,deadline-Date.now()),killSignal:'SIGKILL',maxBuffer:1024**2,stdio:['ignore','pipe','pipe']});
    resourceGuard();const size=(logs.stdout?.length??0)+(logs.stderr?.length??0);
    if(logs.status!==0||logs.error||size>1024**2)throw Object.assign(Error('T04_LOG_READ_FAILED'),
      {t04RestoreFacts:{t04RestoreLogObserved:4,t04RestoreSqlstateOrdinal:0,t04RestoreLogCapabilityMask:logCapability}});
    return Buffer.concat([logs.stdout??Buffer.alloc(0),logs.stderr??Buffer.alloc(0)]);
  };
  const publicSchema=async()=>rows(`select pg_get_userbyid(n.nspowner) owner,obj_description(n.oid,'pg_namespace') comment,
    (select jsonb_agg(jsonb_build_object('grantor',pg_get_userbyid(a.grantor),'grantee',
      case when a.grantee=0 then 'PUBLIC' else pg_get_userbyid(a.grantee) end,'privilege',a.privilege_type,'grantable',a.is_grantable)
      order by a.grantor,a.grantee,a.privilege_type,a.is_grantable)
      from aclexplode(coalesce(n.nspacl,acldefault('n',n.nspowner))) a) acl
    from pg_namespace n where n.nspname='public'`);
  const originalPublicSchema=await publicSchema();check(originalPublicSchema.length===1);
  const hook=async()=>rows(`select setdatabase,setting from pg_db_role_setting s join pg_roles r on r.oid=s.setrole,
    lateral unnest(s.setconfig) setting where r.rolname='authenticator' and setting like 'pgrst.db_pre_request=%' order by setdatabase,setting`);
  check((await hook()).length===0);
  const sql=statement=>call('docker',['exec','--user','postgres',dbContainer.Id,'psql','-XAt','-v','ON_ERROR_STOP=1',
    '-U','supabase_admin','-d','postgres','-c',statement]);
  step=5;
  const actor=JSON.parse(sql(`select json_build_object('actor',current_user,'super',r.rolsuper,'version',current_setting('server_version_num')::int,
    'database',current_database()) from pg_roles r where r.rolname=current_user`).toString());
  check(actor.actor==='supabase_admin'&&actor.super===true&&actor.version>=170000&&actor.version<180000&&actor.database==='postgres');
  check(/^pg_dump \(PostgreSQL\) 17\./.test(call('docker',['exec',dbContainer.Id,'pg_dump','--version']).toString().trim()));
  step=6;
  const archivePath=join(privateRoot,'t04-original.dump');check(!lstatSync(archivePath,{throwIfNoEntry:false}));
  const archive=call('docker',['exec','--user','postgres',dbContainer.Id,'pg_dump','-U','supabase_admin','-d','postgres','--format=custom'],
    {maxBuffer:8*1024**2,timeout:45000});check(archive.length>0&&archive.length<=8*1024**2);
  writeFileSync(archivePath,archive,{flag:'wx',mode:0o400});const archiveInfo=ownFile(archivePath,8*1024**2),archiveSHA=runtimeHash(archive);
  const toc=call('docker',['exec','-i','--user','postgres',dbContainer.Id,'pg_restore','--list'],
    {input:archive,maxBuffer:1024**2,timeout:10000}).toString('utf8');
  step=7;
  check(await storage()===originalStorage&&await financial()===originalFinancial&&await preserved(baseline)&&await physical()===originalPhysical);
  const phase=async expected=>{
    await binding();const e=environment();
    if(expected==='legacy'||expected==='bridge')await runtime.assertBridgeFixture(db,e,expected);
    else{
      const candidate=await import('../tests/supabase/permissionCandidateEnvironment.ts');
      if(expected==='activated')await candidate.assertActivatedCandidate(db,{...e,controlPath:e.controlPath});
      else{
        check(expected==='candidate-pass-through');
        const r=await rows(`select to_regclass('public.permission_catalog') catalog,strict,contract_version from private.permission_contract_gate where singleton`);
        check(r.length===1&&r[0].catalog&&r[0].strict===false&&r[0].contract_version===2);
      }
    }
  };
  const observe=async expected=>{step=10;guard();await phase(expected);check(await storage()===originalStorage);
    const value=await inventory.collectInventory(db);return runtimeHash({phase:expected,catalog:value.catalogHash,financial:await financial(),storage:originalStorage});};
  const prepare=async stage=>{
    guard();check(await preserved(baseline)&&await physical()===originalPhysical);const lifecycle=t04Lifecycle(stage);
    if(lifecycle.pre==='activated'){
      step=8;
      const old=process.env.IDEM_ENV_FILE;process.env.IDEM_ENV_FILE=files[0].path;
      try{await(await import('../tests/supabase/permissionCandidateGlobalSetup.ts')).default();}
      finally{if(old===undefined)delete process.env.IDEM_ENV_FILE;else process.env.IDEM_ENV_FILE=old;}
      check(await financial()===originalFinancial);
    }else if(lifecycle.pre==='bridge'){
      step=9;
      await db.query(readFileSync('supabase/migrations/017_permission_catalog_bridge.sql','utf8'));
      await db.query("notify pgrst,'reload schema'");check(await financial()===originalFinancial);
    }
    return observe(lifecycle.pre);
  };
  const restore=async(stage,beforeResetSHA,preflight=false)=>{
    step=11;
    guard();check((preflight?stage==='runner-preflight':t04Lifecycle(stage).reset)
      &&/^[a-f0-9]{64}$/.test(beforeResetSHA)&&await physical()===originalPhysical);
    // Check protected payload/metadata BEFORE restore can hide a regression.
    check(await storage()===originalStorage);await binding();
    const currentRoles=await globals(),allowed=currentRoles.filter(r=>r.rolname!=='pos_owner_recovery');
    const recovery=currentRoles.find(r=>r.rolname==='pos_owner_recovery');
    if(recovery)check(['rolsuper','rolinherit','rolcreaterole','rolcreatedb','rolcanlogin','rolreplication','rolbypassrls']
      .every(k=>recovery[k]===false)&&recovery.rolconnlimit===-1&&recovery.rolvaliduntil===null&&recovery.rolconfig===null);
    check(runtimeHash(allowed)===runtimeHash(originalRoles)&&runtimeHash(t04BaselineMemberships(await memberships(),!!recovery))===originalMemberships
      &&runtimeHash(await settings())===originalSettings);
    const hooks=await hook();check(hooks.length<=1&&hooks.every(r=>r.setdatabase===0&&r.setting==='pgrst.db_pre_request=public.permission_contract_pre_request'));
    const info=ownFile(archivePath,8*1024**2);check(info.ino===archiveInfo.ino&&info.dev===archiveInfo.dev&&runtimeHash(readFileSync(archivePath))===archiveSHA);
    step=12;continuity(false);call('docker',['stop','--time','5',...services],{timeout:45000});continuity(true);
    // Only these source-defined synthetic app schemas and one known new global role.
    // If restore fails after this commit, the attempt fails; never adopt a new baseline.
    step=13;sql("drop schema public cascade; drop schema private cascade; alter role authenticator reset pgrst.db_pre_request;");
    step=14;if(currentRoles.some(r=>r.rolname==='pos_owner_recovery'))sql('drop role pos_owner_recovery');
    // A whole-database PG17 dump assumes initdb's public schema already exists:
    // it can emit owner/ACL/comment deltas but never CREATE SCHEMA public.
    // Reestablish precisely that base before replaying the original archive.
    sql("create schema public authorization pg_database_owner; grant all on schema public to pg_database_owner; grant usage on schema public to public; comment on schema public is 'standard public schema';");
    step=15;
    const restoreStarted=new Date().toISOString();
    try{call('docker',['exec','-i','--env','PGOPTIONS='+logOptions,
      '--user','postgres',dbContainer.Id,'pg_restore','--clean','--if-exists','--single-transaction','--exit-on-error',
      '-U','supabase_admin','-d','postgres'],{input:archive,maxBuffer:1024**2,timeout:60000});}
    catch(error){
      // Read once, inside the same deadline/quota, without changing the failed
      // SQL/transaction or retrying it. Diagnostic failure keeps the original error.
      let facts;
      try{facts=t04CorrelateRestoreLog(error?.stderr,readLogs(restoreStarted),logging.prefix);}
      catch(logError){facts=logError?.t04RestoreFacts??{t04RestoreLogObserved:4,t04RestoreSqlstateOrdinal:0};}
      facts.t04RestoreLogCapabilityMask=logCapability;
      // The failed pg_restore transaction has rolled back. Its preceding manual
      // schema drop has not. Missing targets remain UNKNOWN, never an assumption.
      const target=t04RestoreConstraintTarget(error?.stderr);
      facts.t04RestoreTargetObserved=target?0:2;
      if(target&&facts.t04RestoreLogObserved===1)try{
        resourceGuard();check(Date.now()+6000<deadline);await resetPhysical();
        await db.query('begin read only');
        try{
          await db.query("set local statement_timeout='5s'");
          const result=await db.query(`select c.oid,n.nspname schema,t.relname "table",c.conname "constraint",
            pg_get_userbyid(t.relowner) owner,c.contype kind,c.conislocal "local",c.coninhcount inherited,(c.conparentid<>0) parent,
            (select coalesce(bit_or(case d.classid when 'pg_constraint'::regclass then 1 when 'pg_trigger'::regclass then 2
              when 'pg_rewrite'::regclass then 4 when 'pg_class'::regclass then 8 else 16 end),0)::int from pg_depend d
              where (d.refclassid='pg_constraint'::regclass and d.refobjid=c.oid)
                 or (c.conindid<>0 and d.refclassid='pg_class'::regclass and d.refobjid=c.conindid)) dependencies
            from pg_constraint c join pg_class t on t.oid=c.conrelid join pg_namespace n on n.oid=t.relnamespace
            where n.nspname=$1 and t.relname=$2 and c.conname=$3`,[target.schema,target.table,target.constraint]);
          facts={...facts,...t04ConstraintCatalogFacts(target,result.rows,toc)};
        }finally{await db.query('rollback');}
        resourceGuard();await resetPhysical();
      }catch{facts.t04RestoreTargetObserved=0;for(const key of Object.keys(facts))if(/^t04Restore(?:Schema|Constraint|Dependency)/.test(key))delete facts[key];}
      if(error&&typeof error==='object')error.t04RestoreFacts={...error.t04RestoreFacts,...facts};throw error;
    }
    step=16;for(const f of files){ownFile(f.path,65536);writeFileSync(f.path,f.bytes,{mode:0o600});}
    check(runtimeHash(await globals())===runtimeHash(originalRoles)&&runtimeHash(await memberships())===originalMemberships
      &&runtimeHash(await settings())===originalSettings&&(await hook()).length===0
      &&runtimeHash(await publicSchema())===runtimeHash(originalPublicSchema));
    step=17;call('docker',['start',...services],{timeout:45000});
    step=18;
    const until=Math.min(deadline,Date.now()+45000);let ready=false;
    while(Date.now()<until){resourceGuard();try{continuity(false);guard();await phase('legacy');ready=true;break;}catch{}
      await new Promise(resolve=>setTimeout(resolve,250));}
    check(ready&&await physical()===originalPhysical&&await preserved(baseline)&&await storage()===originalStorage);
    return {stage,status:'RESTORED_ORIGINAL',beforeResetSHA,archiveSHA,baselineSHA:baseline,physicalSHA:originalPhysical};
  };
  const preflight=checked(async()=>{
    preflightPhase=1;step=7;resourceGuard();check(await physical()===originalPhysical);
    if(logCapability!==15)throw Object.assign(Error('T04_LOG_UNSUPPORTED'),
      {t04RestoreFacts:{t04RestoreLogObserved:3,t04RestoreSqlstateOrdinal:0,t04RestoreLogCapabilityMask:logCapability}});
    // The fixture DSN is deliberately non-superuser. Only the local privileged
    // psql control and pg_restore connection receive these diagnostic GUCs.
    const since=new Date().toISOString(),command='select 1 / 0;';let controlError;
    try{call('docker',['exec','--env','PGOPTIONS='+logOptions,'--user','postgres',dbContainer.Id,
      'psql','-XAt','-v','ON_ERROR_STOP=1','-U','supabase_admin','-d','postgres',
      '-c','select pg_backend_pid();','-c',command],{timeout:10000});}catch(error){controlError=error;}
    const pidText=controlError?.stdout?.toString('utf8')??'',client=controlError?.stderr?.toString('utf8')??'';
    const headers=[...client.matchAll(/^ERROR:\s+([^\r\n]*)/gm)];
    if(![1,3].includes(controlError?.status))throw Object.assign(Error('T04_CONTROL_EXIT_REFUSED'),
      {t04RestoreFacts:{t04PreflightControlOrdinal:1,t04RestoreLogCapabilityMask:logCapability}});
    if(!/^[1-9][0-9]{0,9}\r?\n$/.test(pidText)||headers.length!==1)throw Object.assign(Error('T04_CONTROL_FRAMING_REFUSED'),
      {t04RestoreFacts:{t04PreflightControlOrdinal:2,t04RestoreLogCapabilityMask:logCapability}});
    const facts=t04CorrelateServerLog(headers[0][1].trim(),command,readLogs(since),logging.prefix,Number(pidText.trim()));
    facts.t04RestoreLogCapabilityMask=logCapability;
    facts.t04PreflightControlOrdinal=facts.t04RestoreLogObserved!==1?3
      :facts.t04RestoreSqlstateOrdinal!==T04_RESTORE_SQLSTATES.indexOf('22012')+1?4:0;
    if(facts.t04RestoreLogObserved!==1||facts.t04RestoreSqlstateOrdinal!==T04_RESTORE_SQLSTATES.indexOf('22012')+1)
      throw Object.assign(Error('T04_LOG_CONTROL_FAILED'),{t04RestoreFacts:facts});
    preflightPhase=2;
    const before=await observe('legacy'),result=await restore('runner-preflight',before,true);
    preflightPhase=0;
    return{status:'PASS',archiveSHA,storageSHA:originalStorage,baselineSHA:result.baselineSHA,physicalSHA:result.physicalSHA};
  });
  return{prepare:checked(prepare),observe:checked(observe),restore:checked((stage,hash)=>restore(stage,hash)),preflight,
    archiveSHA,storageSHA:originalStorage,close:()=>db.end(),
    privateDirectory:stage=>{try{step=19;check(stage==='realtime-e2e');const path=join(privateRoot,'t04-realtime');
      check(!lstatSync(path,{throwIfNoEntry:false}));guard();mkdirSync(path,{mode:0o700});
      check(statSync(path).dev===device&&realpathSync(path)===path);return path;}catch(error){throw failure(error);}}};
  }catch(error){await db.end().catch(()=>{});throw failure(error);}
  }catch(error){throw failure(error);}
}
