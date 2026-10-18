import {readFileSync,lstatSync,realpathSync,readdirSync,readlinkSync,statfsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash,randomBytes} from 'node:crypto';
import {resolve,posix} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {ci1Identity} from './permission-ci1-policy.mjs';
import {ci1LinuxRecipe} from './permission-ci1-harness.mjs';
import {ci1PublicationPath} from './permission-ci1-source.mjs';
import {withLightCorePattern,linuxCorePatternAdapter,coreDumpDisabled} from './project-ci-launch.mjs';
import {fullRuntimeLayout,fullRuntimeUnitProperties,assertFullRuntimeRootFacts} from './permission-full-runtime-policy.mjs';

const REPO='nguyentronglinh045/pos-cafe', ID='1263057386', LIMIT=65536, RESERVE=30*1024**3;
const CHECKOUT_CAP=128*1024**2, PUBLIC_SOURCE_CAP=64*1024**2;
const ENV={PATH:'/usr/sbin:/usr/bin:/sbin:/bin',LANG:'C',LC_ALL:'C',
  GIT_OPTIONAL_LOCKS:'0',GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:'/dev/null'};
const SHA=value=>createHash('sha256').update(value).digest('hex');
const check=(condition)=>{if(!condition)throw new Error('NAMESPACE_PROBE_REFUSED');};
const hex=(value,length)=>typeof value==='string'&&value.length===length&&new RegExp(`^[a-f0-9]{${length}}$`).test(value);
function data(value,keys) {
  check(value&&Object.getPrototypeOf(value)===Object.prototype);
  const result={};
  for(const key of Reflect.ownKeys(value)) {
    const d=Object.getOwnPropertyDescriptor(value,key);
    check(typeof key==='string'&&d.enumerable&&Object.hasOwn(d,'value'));
  }
  for(const key of keys){check(Object.hasOwn(value,key));result[key]=Object.getOwnPropertyDescriptor(value,key).value;}
  return result;
}
export function namespaceAdmission(input) {
  const {env,event,git,platform,arch,nodeVersion}=data(input,['env','event','git','platform','arch','nodeVersion']);
  const e=data(env,['GITHUB_ACTIONS','RUNNER_ENVIRONMENT','GITHUB_REPOSITORY','GITHUB_REPOSITORY_ID','GITHUB_EVENT_NAME',
    'GITHUB_SHA','GITHUB_WORKFLOW_SHA','GITHUB_WORKFLOW_REF','GITHUB_REF','GITHUB_REF_NAME','GITHUB_RUN_ID','GITHUB_RUN_ATTEMPT',
    'FULL_NAMESPACE_CONFIRMATION','FULL_NAMESPACE_EXPECTED_SHA']);
  const g=data(git,['head','tree','clean','fingerprint','bytes']);
  const ev=data(event,['repository','ref','inputs']),repository=data(ev.repository,['id','full_name','private']);
  const inputs=data(ev.inputs,['confirmation','expected_source_sha']);
  check(platform==='linux'&&arch==='x64'&&typeof nodeVersion==='string'&&/^v(?:22|24)\.[0-9]+\.[0-9]+$/.test(nodeVersion));
  check(e.GITHUB_ACTIONS==='true'&&e.RUNNER_ENVIRONMENT==='github-hosted'&&e.GITHUB_EVENT_NAME==='workflow_dispatch'
    &&e.GITHUB_REPOSITORY===REPO&&e.GITHUB_REPOSITORY_ID===ID&&repository.id===Number(ID)
    &&repository.full_name===REPO&&repository.private===false);
  check(e.FULL_NAMESPACE_CONFIRMATION==='RUN_NAMESPACE_PROBE'&&inputs.confirmation==='RUN_NAMESPACE_PROBE'
    &&hex(e.FULL_NAMESPACE_EXPECTED_SHA,40)&&inputs.expected_source_sha===e.FULL_NAMESPACE_EXPECTED_SHA
    &&g.head===e.FULL_NAMESPACE_EXPECTED_SHA&&g.head===e.GITHUB_SHA&&g.head===e.GITHUB_WORKFLOW_SHA
    &&hex(g.tree,40)&&hex(g.fingerprint,64)&&g.clean===true&&Number.isSafeInteger(g.bytes)&&g.bytes>0&&g.bytes<=CHECKOUT_CAP);
  check(typeof e.GITHUB_REF_NAME==='string'&&/^[A-Za-z0-9_./-]+$/.test(e.GITHUB_REF_NAME)&&!/\s/.test(e.GITHUB_REF_NAME)&&!e.GITHUB_REF_NAME.includes('..')
    &&e.GITHUB_REF===`refs/heads/${e.GITHUB_REF_NAME}`&&(ev.ref===e.GITHUB_REF_NAME||ev.ref===e.GITHUB_REF)
    &&e.GITHUB_WORKFLOW_REF===`${REPO}/.github/workflows/backend.yml@${e.GITHUB_REF}`);
  check(typeof e.GITHUB_RUN_ATTEMPT==='string'&&/^[1-9][0-9]{0,3}$/.test(e.GITHUB_RUN_ATTEMPT)
    &&String(Number(e.GITHUB_RUN_ATTEMPT))===e.GITHUB_RUN_ATTEMPT);
  return ci1Identity(e.GITHUB_RUN_ID,Number(e.GITHUB_RUN_ATTEMPT));
}

// The privileged unit executes only this already loaded literal. It imports no
// runner-owned checkout code. All three writes are exclusive public synthetic files.
export const NAMESPACE_UNIT_CODE=String.raw`
import {readFileSync,writeFileSync,lstatSync,realpathSync,readlinkSync,readdirSync,statfsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const fail=()=>{throw Error('REFUSED');};
const ok=v=>{if(!v)fail();};
const hash=v=>createHash('sha256').update(v).digest('hex');
try {
 const [root,nonce,label,run,attempt,nodeSHA,nodeVersion,hostPID,codeSHA]=process.argv.slice(1);
 ok(process.argv.length===10&&process.getuid()===0&&process.platform==='linux'&&process.arch==='x64');
 ok(root==='/var/tmp/pos-permission-full-'+run+'-'+attempt&&/^[1-9][0-9]{0,19}$/.test(run)&&/^[1-9][0-9]{0,3}$/.test(attempt));
 ok(/^[a-f0-9]{32}$/.test(nonce)&&nonce.length===32&&label==='pos-permission-full-'+run+'-'+attempt+'-'+nonce);
 ok(/^[1-9][0-9]*$/.test(hostPID)&&process.version===nodeVersion&&/^v(?:22|24)\.[0-9]+\.[0-9]+$/.test(nodeVersion));
 ok(process.execArgv.length===3&&process.execArgv[0]==='--input-type=module'&&process.execArgv[1]==='--eval'&&hash(process.execArgv[2])===codeSHA);
 const argv=readFileSync('/proc/self/cmdline').toString().split('\0');ok(argv.pop()==='');
 ok(JSON.stringify(argv)===JSON.stringify([process.execPath,...process.execArgv,'--',...process.argv.slice(1)]));
 const node=lstatSync(process.execPath);ok(node.isFile()&&!node.isSymbolicLink()&&node.uid===0&&!(node.mode&0o022)&&node.size<=128*1024**2);
 ok(realpathSync(process.execPath)===process.execPath&&realpathSync('/proc/self/exe')===process.execPath&&hash(readFileSync(process.execPath))===nodeSHA);
 const after=lstatSync(process.execPath);ok(node.dev===after.dev&&node.ino===after.ino&&node.size===after.size&&node.mtimeMs===after.mtimeMs);
 for(const path of ['/','/var','/var/tmp',root]){const s=lstatSync(path);ok(s.isDirectory()&&!s.isSymbolicLink()&&realpathSync(path)===path);}
 const info=path=>{const s=lstatSync(path,{bigint:true});return {device:String(s.dev),inode:String(s.ino),ownerUid:Number(s.uid),mode:Number(s.mode&511n)};};
 const rootInfo=info(root);ok(rootInfo.ownerUid===0&&rootInfo.mode===448&&readdirSync(root).length===0);
 const mounts=readFileSync('/proc/self/mountinfo','utf8');ok(Buffer.byteLength(mounts)<=65536);
 const owned=mounts.trim().split('\n').map(l=>l.split(' ')[4]).filter(p=>p===root||p.startsWith(root+'/'));ok(owned.length===1&&owned[0]===root);
 const unit='pos-cafe-ci1-r'+run+'-a'+attempt+'.service',cgroup='/system.slice/'+unit+'/supervisor';
 ok(readFileSync('/proc/self/cgroup','utf8').trim()==='0::'+cgroup);
 const cg='/sys/fs/cgroup/system.slice/'+unit,scalar=n=>readFileSync(cg+'/'+n,'utf8').trim();
 ok(scalar('cpu.max')==='100000 100000'&&scalar('memory.max')==='268435456'&&scalar('memory.swap.max')==='0'&&scalar('pids.max')==='64');
 ok(/^oom 0$/m.test(scalar('memory.events'))&&/^oom_kill 0$/m.test(scalar('memory.events'))&&/^max 0$/m.test(scalar('pids.events')));
 const names=['PrivateTmp','BindPaths','BindReadOnlyPaths','ControlGroup','ActiveState','MainPID','RuntimeMaxUSec','TimeoutStopUSec','KillMode','StandardOutput','StandardError','LimitCORE'];
 const raw=execFileSync('/usr/bin/systemctl',['show','--no-pager',...names.map(n=>'--property='+n),unit],
  {encoding:'utf8',timeout:5000,maxBuffer:8192,stdio:['ignore','pipe','pipe'],env:{PATH:'/usr/bin:/bin',LANG:'C',LC_ALL:'C'}});
 const lines=raw.trim().split('\n');ok(lines.length===names.length);
 const pairs=lines.map(line=>{const p=line.indexOf('=');ok(p>0);return [line.slice(0,p),line.slice(p+1)];});
 ok(new Set(pairs.map(pair=>pair[0])).size===names.length);const properties=Object.fromEntries(pairs);
 ok(Object.keys(properties).length===names.length&&names.every(n=>Object.hasOwn(properties,n)));
 ok(properties.PrivateTmp==='yes'&&properties.BindPaths===root+':'+root&&properties.BindReadOnlyPaths==='');
 ok(properties.ControlGroup==='/system.slice/'+unit&&properties.ActiveState==='active'&&properties.MainPID===String(process.pid));
 ok(properties.RuntimeMaxUSec==='1min'&&properties.TimeoutStopUSec==='10s'&&properties.KillMode==='control-group'
  &&properties.StandardOutput==='null'&&properties.StandardError==='null'&&properties.LimitCORE==='0');
 const limits=readFileSync('/proc/self/limits','utf8');ok(/^Max core file size\s+0\s+0\s+bytes\s*$/m.test(limits)&&readFileSync('/proc/sys/kernel/core_pattern','utf8')==='core\n');
 const ns=readlinkSync('/proc/self/ns/mnt'),hostNS=readlinkSync('/proc/'+hostPID+'/ns/mnt');
 ok(/^mnt:\[[0-9]+\]$/.test(ns)&&/^mnt:\[[0-9]+\]$/.test(hostNS)&&ns!==hostNS);
 const tmp=info('/var/tmp'),hostTmp=info('/proc/'+hostPID+'/root/var/tmp');ok(tmp.device!==hostTmp.device||tmp.inode!==hostTmp.inode);
 const free=()=>{const f=statfsSync(root);ok(f.bavail*f.bsize>=30*1024**3);};free();
 const owner={nonce,label},exportBytes=Buffer.from('namespace-probe-synthetic\n');
 writeFileSync(root+'/owner.json',JSON.stringify(owner),{flag:'wx',mode:384});
 writeFileSync(root+'/export.bin',exportBytes,{flag:'wx',mode:384});
 const facts={root:rootInfo,tmp,hostTmp,namespace:ns,hostNamespace:hostNS,properties,
  argvSHA:hash(JSON.stringify(argv)),codeSHA,nodeSHA,nodeVersion,nonce,label,exportSHA:hash(exportBytes),exportBytes:exportBytes.length};
 writeFileSync(root+'/unit.json',JSON.stringify(facts),{flag:'wx',mode:384});
 ok(readdirSync(root).sort().join(',')==='export.bin,owner.json,unit.json');
 let bytes=0,allocated=Number(lstatSync(root,{bigint:true}).blocks)*512;
 for(const name of readdirSync(root)){const s=lstatSync(root+'/'+name);ok(s.isFile()&&!s.isSymbolicLink()&&s.uid===0&&s.nlink===1&&(s.mode&511)===384);bytes+=s.size;allocated+=s.blocks*512;}
 ok(bytes<65536&&allocated<=1024**2);free();
}catch{process.exitCode=78;}
`;

function canonicalLayout(layout) {
  const keys=['runId','attempt','nonce','ownerUid','root','ownerLabel','loopBackingFile','loopMount','mode'];
  const supplied=data(layout,keys),expected=fullRuntimeLayout(supplied.runId,supplied.attempt,supplied.nonce,0);
  check(Reflect.ownKeys(layout).length===keys.length&&keys.every(key=>supplied[key]===expected[key]));return expected;
}
export function namespaceArgv(layout,node,hostPID) {
  layout=canonicalLayout(layout);check(Number.isSafeInteger(hostPID)&&hostPID>0);
  const n=data(node,['path','sha256','version']);
  check(typeof n.path==='string'&&posix.isAbsolute(n.path)&&posix.normalize(n.path)===n.path&&/^[A-Za-z0-9_./-]+$/.test(n.path)&&!/[\r\n\0]/.test(n.path)
    &&hex(n.sha256,64)&&typeof n.version==='string'&&/^v(?:22|24)\.[0-9]+\.[0-9]+$/.test(n.version));
  const replacements={'--property=CPUQuota=300%':'--property=CPUQuota=100%',
    '--property=MemoryMax=10737418240':'--property=MemoryMax=268435456','--property=TasksMax=2048':'--property=TasksMax=64',
    '--property=RuntimeMaxSec=1800s':'--property=RuntimeMaxSec=60s','--property=TimeoutStopSec=30s':'--property=TimeoutStopSec=10s'};
  const prefix=ci1LinuxRecipe(layout.runId,layout.attempt).systemdArgv.filter(a=>a!=='--property=PrivateTmp=yes').map(a=>replacements[a]??a);
  prefix[0]='/usr/bin/systemd-run';
  return [...prefix,...fullRuntimeUnitProperties(layout),'/usr/bin/env','-i','PATH=/usr/bin:/bin','LANG=C','LC_ALL=C',
    n.path,'--input-type=module','--eval',NAMESPACE_UNIT_CODE,'--',layout.root,layout.nonce,layout.ownerLabel,
    layout.runId,String(layout.attempt),n.sha256,n.version,String(hostPID),SHA(NAMESPACE_UNIT_CODE)];
}

// systemd255 systemctl-show.c:1447-1478 prints flags=0/norbind as R:R.
// https://github.com/systemd/systemd/blob/v255/src/systemctl/systemctl-show.c#L1447-L1478
export function namespaceMapping(layout,host,unit) {
  layout=canonicalLayout(layout);
  const h=data(host,['root','tmp','namespace','nonce','label']),u=data(unit,['root','tmp','hostTmp','namespace','hostNamespace','properties','nonce','label']);
  const p=data(u.properties,['PrivateTmp','BindPaths','BindReadOnlyPaths']);
  check(p.PrivateTmp==='yes'&&p.BindPaths===`${layout.root}:${layout.root}`&&p.BindReadOnlyPaths==='');
  const observed=(root,nonce,label)=>({...data(root,['device','inode','ownerUid','mode']),path:layout.root,realpath:layout.root,
    directory:true,symlink:false,nonce,ownerLabel:label});
  assertFullRuntimeRootFacts(layout,{host:{...observed(h.root,h.nonce,h.label),preexistingSubmounts:[]},
    unit:{...observed(u.root,u.nonce,u.label),privateTmp:true,bindSource:layout.root,bindDestination:layout.root,bindRecursive:false,ignoreMissingSource:false}});
  const ht=data(h.tmp,['device','inode']),ut=data(u.tmp,['device','inode']),seen=data(u.hostTmp,['device','inode']);
  check(typeof h.namespace==='string'&&/^mnt:\[[0-9]+\]$/.test(h.namespace)&&!/\s/.test(h.namespace)&&u.hostNamespace===h.namespace
    &&typeof u.namespace==='string'&&/^mnt:\[[0-9]+\]$/.test(u.namespace)&&!/\s/.test(u.namespace)&&u.namespace!==h.namespace
    &&(ht.device!==ut.device||ht.inode!==ut.inode)&&ht.device===seen.device&&ht.inode===seen.inode);
  return true;
}

const run=(command,args,options={})=>execFileSync(command,args,{encoding:'utf8',timeout:10000,maxBuffer:LIMIT,
  stdio:['ignore','pipe','pipe'],env:ENV,...options});
function noLinks(path,rootOnly=false) {
  check(posix.isAbsolute(path)&&posix.normalize(path)===path&&/^[A-Za-z0-9_./-]+$/.test(path)&&!/[\r\n\0]/.test(path));
  let current='';for(const part of path.split('/').filter(Boolean)){current+='/'+part;const s=lstatSync(current);check(!s.isSymbolicLink()&&realpathSync(current)===current&&(!rootOnly||(s.uid===0&&!(s.mode&0o022))));}
}
function metadata(path) {const s=lstatSync(path,{bigint:true});check(s.isDirectory()&&!s.isSymbolicLink());
  return {device:String(s.dev),inode:String(s.ino),ownerUid:Number(s.uid),mode:Number(s.mode&511n)};}
// Every path is vetted before the first content read. Ignored/untracked files
// are refused, including private inputs hidden by a clean git status. Git files
// contribute metadata-only bytes to the checkout budget; their payload is not hashed.
export function namespaceTrackedInventory(tracked,unknown,entries,read) {
  check(Array.isArray(tracked)&&tracked.length>0&&tracked.length<=20000&&Array.isArray(unknown)&&unknown.length===0
    &&Array.isArray(entries)&&entries.length<=20000&&typeof read==='function');
  const paths=new Set(tracked);check(paths.size===tracked.length);
  for(const path of tracked)check(typeof path==='string'&&ci1PublicationPath(path)===true);
  let bytes=0,publicBytes=0;const files=new Map();
  for(const entry of entries){const e=data(entry,['path','bytes','links']);check(typeof e.path==='string'&&!files.has(e.path)
    &&Number.isSafeInteger(e.bytes)&&e.bytes>=0&&e.links===1);bytes+=e.bytes;check(bytes<=CHECKOUT_CAP);
    check(e.path==='.git'||e.path.startsWith('.git/')||paths.has(e.path));
    if(paths.has(e.path)){publicBytes+=e.bytes;check(publicBytes<=PUBLIC_SOURCE_CAP);}files.set(e.path,e);}
  check(tracked.every(path=>files.has(path)));
  const hash=createHash('sha256');for(const path of [...tracked].sort()){
    const content=read(path);check(Buffer.isBuffer(content)&&content.length===files.get(path).bytes);
    hash.update(path);hash.update('\0');hash.update(content);hash.update('\0');}
  return {fingerprint:hash.digest('hex'),bytes};
}
function snapshot(root) {
  noLinks(root);
  const git=args=>run('/usr/bin/git',['-c',`safe.directory=${root}`,'-C',root,...args]);
  const head=git(['rev-parse','HEAD']).trim(),tree=git(['rev-parse','HEAD^{tree}']).trim();
  check(git(['status','--porcelain=v1','--untracked-files=all']).trim()==='');
  const tracked=git(['ls-files','-z','--cached']).split('\0').filter(Boolean);
  const unknown=[...git(['ls-files','-z','--others','--exclude-standard']).split('\0'),
    ...git(['ls-files','-z','--others','--ignored','--exclude-standard']).split('\0')].filter(Boolean);
  check(unknown.length===0);const entries=[],device=lstatSync(root).dev;let nodes=0;
  const visit=(directory,depth=0)=>{check(depth<40);for(const name of readdirSync(directory).sort()){
    const path=directory+'/'+name,s=lstatSync(path);check(++nodes<=20000&&!s.isSymbolicLink()&&s.dev===device);
    if(s.isDirectory())visit(path,depth+1);else{check(s.isFile()&&entries.length<20000);entries.push({path:path.slice(root.length+1),bytes:s.size,links:s.nlink});}
  }};visit(root);
  const inventory=namespaceTrackedInventory(tracked,unknown,entries,path=>readFileSync(`${root}/${path}`));
  check(SHA(git(['show','HEAD:scripts/permission-full-namespace-probe.mjs']))===SHA(readFileSync(`${root}/scripts/permission-full-namespace-probe.mjs`)));
  return {head,tree,clean:true,...inventory};
}
function nativeNode() {
  const path=realpathSync(process.execPath),s=lstatSync(path);noLinks(path,true);
  check(s.isFile()&&s.uid===0&&!(s.mode&0o022)&&s.size<=128*1024**2);
  const sha256=SHA(readFileSync(path)),after=lstatSync(path);
  check(s.dev===after.dev&&s.ino===after.ino&&s.size===after.size&&s.mtimeMs===after.mtimeMs);
  return {path,sha256,version:process.version};
}
function reserve(root) {for(const path of ['/var/tmp',root]){const s=statfsSync(path);check(s.bavail*s.bsize>=RESERVE);}}
function noMount(root) {const raw=readFileSync('/proc/self/mountinfo','utf8');check(Buffer.byteLength(raw)<=LIMIT);
  check(!raw.trim().split('\n').some(line=>{const p=line.split(' ')[4];return p===root||p.startsWith(root+'/');}));}
function rootFile(root,name) {
  const path=`${root}/${name}`,stat=()=>run('/usr/bin/sudo',['--','/usr/bin/stat','--format=%f:%u:%h:%d:%i:%s:%b','--',path]).trim();
  const before=stat(),[mode,uid,links,device,inode,size,blocks]=before.split(':');
  check(parseInt(mode,16)===0o100600&&uid==='0'&&links==='1'&&/^\d+$/.test(size)&&Number(size)<LIMIT);
  const content=run('/usr/bin/sudo',['--','/usr/bin/cat','--',path],{encoding:null});check(stat()===before&&content.length===Number(size));
  return {content,bytes:Number(size),allocated:Number(blocks)*512,device,inode};
}

export function namespaceSourceEqual(before,after) {
  const keys=['head','tree','clean','fingerprint','bytes'];const a=data(before,keys),b=data(after,keys);
  check(keys.every(key=>a[key]===b[key])&&a.clean===true);return true;
}
export function namespaceUnitAbsent(output,status) {
  check(typeof output==='string'&&output.length<4096&&[0,1,4].includes(status)
    &&output.trim().split('\n').sort().join('\n')==='ActiveState=inactive\nLoadState=not-found');return true;
}
async function main() {
  let phase='ADMISSION_BOOT';
  try {
    check(process.argv.length===3&&process.argv[2]==='probe'&&process.platform==='linux'&&process.arch==='x64'
      &&process.env.FULL_NAMESPACE_CONFIRMATION==='RUN_NAMESPACE_PROBE'&&hex(process.env.FULL_NAMESPACE_EXPECTED_SHA,40)
      &&process.execArgv.length===0&&process.getuid()>0&&process.env.GITHUB_REPOSITORY===REPO&&process.env.GITHUB_REPOSITORY_ID===ID
      &&process.env.GITHUB_ACTIONS==='true'&&process.env.RUNNER_ENVIRONMENT==='github-hosted'&&process.env.GITHUB_EVENT_NAME==='workflow_dispatch');
    phase='ADMISSION_WORKSPACE';
    const root=realpathSync(process.cwd());check(root===process.env.GITHUB_WORKSPACE&&lstatSync(root).uid===process.getuid()
      &&realpathSync(fileURLToPath(import.meta.url))===`${root}/scripts/permission-full-namespace-probe.mjs`);
    phase='ADMISSION_EVENT';
    const eventPath=process.env.GITHUB_EVENT_PATH;check(lstatSync(eventPath).size<=LIMIT);
    const event=JSON.parse(readFileSync(eventPath,'utf8'));check(event.repository?.private===false
      &&event.repository?.id===Number(ID)&&event.repository?.full_name===REPO);
    phase='ADMISSION_SOURCE';
    const before=snapshot(root),env={...process.env};
    phase='ADMISSION_IDENTITY';
    const identity=namespaceAdmission({env,event,git:before,platform:process.platform,arch:process.arch,nodeVersion:process.version});
    phase='ADMISSION_NODE';
    const node=nativeNode();
    phase='ADMISSION_HOST';
    const layout=fullRuntimeLayout(identity.runId,identity.attempt,randomBytes(16).toString('hex'),0);
    const cgroup='/sys/fs/cgroup/system.slice/'+identity.unit;noLinks('/var/tmp');noMount(layout.root);reserve(root);
    check(!lstatSync(layout.root,{throwIfNoEntry:false})&&!lstatSync(cgroup,{throwIfNoEntry:false}));
    const host={tmp:metadata('/var/tmp'),namespace:readlinkSync('/proc/self/ns/mnt')};
    phase='ADMISSION_HOST_UNIT';
    try{namespaceUnitAbsent(run('/usr/bin/systemctl',['show','--property=LoadState','--property=ActiveState',identity.unit]),0);}
    catch(error){check(error.code===undefined&&Number.isInteger(error.status));namespaceUnitAbsent(error.stdout,error.status);}
    phase='SUPERVISOR';
    const receipt=withLightCorePattern(linuxCorePatternAdapter(identity.unit),()=>{
      check(coreDumpDisabled(readFileSync('/proc/self/limits','utf8'),readFileSync('/proc/sys/kernel/core_pattern','utf8')));
      phase='ROOT';run('/usr/bin/sudo',['--','/usr/bin/mkdir','--mode=0700','--',layout.root]);
      noLinks(layout.root);host.root=metadata(layout.root);check(host.root.ownerUid===0&&host.root.mode===0o700);noMount(layout.root);
      phase='UNIT';run('/usr/bin/sudo',['--','/usr/bin/env','-i',...Object.entries(ENV).map(([k,v])=>`${k}=${v}`),
        ...namespaceArgv(layout,node,process.pid)],{timeout:80000});
      phase='READBACK';check(run('/usr/bin/sudo',['--','/usr/bin/ls','-A1','--',layout.root]).trim().split('\n').sort().join(',')==='export.bin,owner.json,unit.json');
      const owner=rootFile(layout.root,'owner.json'),proof=rootFile(layout.root,'unit.json'),artifact=rootFile(layout.root,'export.bin');
      const ownerValue=JSON.parse(owner.content),unit=JSON.parse(proof.content);
      check(ownerValue.nonce===layout.nonce&&ownerValue.label===layout.ownerLabel&&unit.nodeSHA===node.sha256&&unit.nodeVersion===node.version
        &&unit.codeSHA===SHA(NAMESPACE_UNIT_CODE)&&hex(unit.argvSHA,64));
      host.nonce=ownerValue.nonce;host.label=ownerValue.label;
      namespaceMapping(layout,host,unit);check(JSON.stringify(metadata(layout.root))===JSON.stringify(host.root));noMount(layout.root);
      const expected=Buffer.from('namespace-probe-synthetic\n');check(artifact.content.equals(expected)&&unit.exportSHA===SHA(expected)&&unit.exportBytes===expected.length);
      const bytes=owner.bytes+proof.bytes+artifact.bytes,allocated=owner.allocated+proof.allocated+artifact.allocated+Number(lstatSync(layout.root).blocks)*512;
      check(bytes<LIMIT&&allocated<=1024**2);return {bytes,allocated,exportSHA:SHA(expected),exportBytes:expected.length};
    });
    phase='SOURCE';check(SHA(rootFile(layout.root,'export.bin').content)===receipt.exportSHA);
    namespaceSourceEqual(before,snapshot(root));check(JSON.stringify(nativeNode())===JSON.stringify(node));reserve(root);
    console.log(JSON.stringify({schemaVersion:'permission-full-namespace-probe-v1',scope:'NAMESPACE_PROBE_ONLY',status:'PASS',
      sourceSHA:before.head,sourceTree:before.tree,sourceFingerprint:before.fingerprint,sourceBytes:before.bytes,
      runId:identity.runId,attempt:identity.attempt,nodeVersion:node.version,nodeSHA:node.sha256,
      codeSHA:SHA(NAMESPACE_UNIT_CODE),mappingVerified:true,privateTmpVerified:true,argvVerified:true,limitsVerified:true,
      exportSurvivesStop:true,sourcePreserved:true,files:3,...receipt,quotaEnforced:false,permissionFull:'NOT_RUN',hp1:'RETIRED'}));
  }catch{console.log(`NAMESPACE_PROBE_BLOCKED_${phase}`);process.exitCode=1;}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await main();
