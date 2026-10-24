// A real, started then stopped G2b stack provides image identity only.
// It is not a race-test PASS or an application fixture attestation.
import{readFileSync,writeFileSync,lstatSync,statSync,realpathSync}from'node:fs';
import{runtimeHash}from'./permission-runtime-results.mjs';
import{serviceProfile,serviceConfig}from'./permission-runtime-service-profile.mjs';
import{ci1ImagesIntake,ci1PinnedImageProof}from'./permission-ci1-intake.mjs';
import{coreDumpDisabled}from'./project-ci-launch.mjs';
import{canonicalContainerValue,canonicalContainerMounts}from'./permission-runtime-container-state.mjs';
const names=['db','auth','rest','kong','storage','realtime','edge_runtime','studio','pg_meta','inbucket','vector','analytics'];
const check=x=>{if(!x)throw Error('PERMISSION_SERVICE_PEER_REFUSED');};
export const servicePeerLayout=root=>({root:root+'/runtime-peer',alias:serviceProfile('PIN_RACE').aliasRoot,
 project:serviceProfile('PIN_RACE').project,edgeVolume:'supabase_edge_runtime_'+serviceProfile('PIN_RACE').project});
export function peerContainerRecords(containers,project){
 check(Array.isArray(containers)&&containers.length===12&&new Set(containers.map(c=>c?.Id)).size===12);
 return containers.map((c,i)=>{check(c?.Name==='/supabase_'+names[i]+'_'+project&&c.Config?.Labels?.['com.supabase.cli.project']===project
   &&/^[a-f0-9]{64}$/.test(c.Id??'')&&/^sha256:[a-f0-9]{64}$/.test(c.Image??'')&&typeof c.Config.Image==='string'
   &&c.HostConfig&&Array.isArray(c.Mounts));
  return{id:c.Id,name:c.Name,imageId:c.Image,imageRef:c.Config.Image,configSHA:runtimeHash(canonicalContainerValue(c.Config)),
   hostConfigSHA:runtimeHash(canonicalContainerValue(c.HostConfig)),mountsSHA:runtimeHash(canonicalContainerMounts(c.Mounts))};
 });
}
function readContainers(root,run){const p=servicePeerLayout(root);return JSON.parse(run('docker',['inspect',...names.map(n=>'supabase_'+n+'_'+p.project)]));}
function aliasGuard(root,run){const p=servicePeerLayout(root),a=lstatSync(p.alias),b=lstatSync(p.root);
 check(a.isDirectory()&&b.isDirectory()&&!a.isSymbolicLink()&&!b.isSymbolicLink()&&realpathSync(p.alias)===p.alias&&realpathSync(p.root)===p.root
  &&a.uid===0&&b.uid===0&&(a.mode&0o777)===0o700&&(b.mode&0o777)===0o700&&a.dev===statSync(root).dev&&a.dev===b.dev&&a.ino===b.ino);
 const m=JSON.parse(run('findmnt',['--json','--target',p.alias,'--output','TARGET,FSTYPE'])).filesystems[0];check(m.target===p.alias&&m.fstype==='ext4');
 const raw=readFileSync(root+'/source/tests/permissions/runtime/identity.toml');
 check(serviceConfig('PIN_RACE',raw).equals(readFileSync(p.alias+'/stack/supabase/config.toml')));return p;
}
function mountedInside(root,list){for(const c of list){
 for(const bindings of Object.values(c.NetworkSettings.Ports??{}))for(const b of bindings??[])check(['127.0.0.1','::1'].includes(b.HostIp));
 for(const m of c.Mounts)check(m.Type==='tmpfs'||['bind','volume'].includes(m.Type)&&statSync(m.Source).dev===statSync(root).dev);
 }}
export function startedServicePeer(root,identity,env,run){
 const p=aliasGuard(root,run),list=readContainers(root,run);mountedInside(root,list);
 const records=peerContainerRecords(list,p.project),pins=ci1ImagesIntake(JSON.parse(readFileSync(root+'/source/tests/permissions/runtime/ci1-images.json')));
 for(const c of list){check(c.State.Running&&(!c.State.Health||c.State.Health.Status==='healthy')&&Number.isInteger(c.State.Pid)&&c.State.Pid>0);
  check(readFileSync('/proc/'+c.State.Pid+'/cgroup','utf8').trim().startsWith('0::/system.slice/'+identity.unit+'/'));
  check(coreDumpDisabled(readFileSync('/proc/'+c.State.Pid+'/limits','utf8'),readFileSync('/proc/sys/kernel/core_pattern','utf8')));
  ci1PinnedImageProof(pins.find(x=>x.ref===c.Config.Image),{image:c.Config.Image,imageId:c.Image},JSON.parse(run('docker',['image','inspect',c.Config.Image]))[0]);
 }
 const network='supabase_network_'+p.project,n=JSON.parse(run('docker',['network','inspect',network]));
 check(n.length===1&&n[0].Name===network&&n[0].Options?.['com.docker.network.bridge.host_binding_ipv4']==='127.0.0.1');
 return{schemaVersion:'permission-service-stopped-peer-v1',project:p.project,runId:identity.runId,attempt:identity.attempt,
  sourceSHA:env.GITHUB_SHA,unit:identity.unit,configSHA:runtimeHash(readFileSync(p.alias+'/stack/supabase/config.toml')),containers:records};
}
export function recordStoppedServicePeer(root,identity,env,run,started){
 const p=aliasGuard(root,run),list=readContainers(root,run);mountedInside(root,list);
 check(started.project===p.project&&started.sourceSHA===env.GITHUB_SHA&&started.runId===identity.runId&&started.attempt===identity.attempt
  &&started.unit===identity.unit&&list.every(c=>c.State.Running===false&&c.State.Pid===0)
  &&JSON.stringify(peerContainerRecords(list,p.project))===JSON.stringify(started.containers));
 writeFileSync(root+'/private/stopped-peer.json',JSON.stringify(started)+'\n',{flag:'wx',mode:0o400});
 return readStoppedServicePeer(root,identity,env,run);
}
export function readStoppedServicePeer(root,identity,env,run){
 const p=aliasGuard(root,run),file=root+'/private/stopped-peer.json',s=lstatSync(file);
 check(s.isFile()&&!s.isSymbolicLink()&&s.uid===0&&(s.mode&0o777)===0o400&&s.nlink===1&&s.size<=16384&&realpathSync(file)===file);
 const r=JSON.parse(readFileSync(file)),list=readContainers(root,run);mountedInside(root,list);
 check(r.schemaVersion==='permission-service-stopped-peer-v1'&&r.project===p.project&&r.runId===identity.runId&&r.attempt===identity.attempt
  &&r.sourceSHA===env.GITHUB_SHA&&r.unit===identity.unit&&r.configSHA===runtimeHash(readFileSync(p.alias+'/stack/supabase/config.toml'))
  &&list.every(c=>c.State.Running===false&&c.State.Pid===0)&&JSON.stringify(peerContainerRecords(list,p.project))===JSON.stringify(r.containers));
 return runtimeHash(r);
}
