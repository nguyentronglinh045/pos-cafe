import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {fullRuntimeLayout} from './permission-full-runtime-policy.mjs';
import {namespaceAdmission,namespaceArgv,namespaceMapping,namespaceSourceEqual,namespaceUnitAbsent,namespaceTrackedInventory,NAMESPACE_UNIT_CODE}
  from './permission-full-namespace-probe.mjs';

const hash=value=>createHash('sha256').update(value).digest('hex');
const sha='a'.repeat(40),nonce='b'.repeat(32),layout=()=>fullRuntimeLayout('39128774085',1,nonce,0);
const node={path:'/usr/bin/node',sha256:'c'.repeat(64),version:'v24.16.0'};
const refused=callback=>assert.throws(callback,/NAMESPACE_PROBE_REFUSED|FULL_RUNTIME_POLICY_REFUSED|CI1_GUARD_REFUSED|CI1_SOURCE_REFUSED/);
function admission() {
  return {platform:'linux',arch:'x64',nodeVersion:node.version,
    env:{GITHUB_ACTIONS:'true',RUNNER_ENVIRONMENT:'github-hosted',GITHUB_REPOSITORY:'nguyentronglinh045/pos-cafe',
      GITHUB_REPOSITORY_ID:'1263057386',GITHUB_EVENT_NAME:'workflow_dispatch',GITHUB_SHA:sha,GITHUB_WORKFLOW_SHA:sha,
      GITHUB_WORKFLOW_REF:'nguyentronglinh045/pos-cafe/.github/workflows/backend.yml@refs/heads/ci/probe',
      GITHUB_REF:'refs/heads/ci/probe',GITHUB_REF_NAME:'ci/probe',GITHUB_RUN_ID:'39128774085',GITHUB_RUN_ATTEMPT:'1',
      FULL_NAMESPACE_CONFIRMATION:'RUN_NAMESPACE_PROBE',FULL_NAMESPACE_EXPECTED_SHA:sha},
    event:{repository:{id:1263057386,full_name:'nguyentronglinh045/pos-cafe',private:false},ref:'ci/probe',
      inputs:{confirmation:'RUN_NAMESPACE_PROBE',expected_source_sha:sha}},
    git:{head:sha,tree:'d'.repeat(40),clean:true,fingerprint:'e'.repeat(64),bytes:1000}};
}
function mapped() {
  const l=layout(),root={device:'2049',inode:'5001',ownerUid:0,mode:0o700};
  const host={root:{...root},tmp:{device:'2049',inode:'2'},namespace:'mnt:[100]',nonce,label:l.ownerLabel};
  const unit={root:{...root},tmp:{device:'2049',inode:'3'},hostTmp:{...host.tmp},namespace:'mnt:[200]',hostNamespace:host.namespace,
    properties:{PrivateTmp:'yes',BindPaths:`${l.root}:${l.root}`,BindReadOnlyPaths:''},nonce,label:l.ownerLabel};
  return {host,unit};
}

test('manual admission binds public repository, source SHA, workflow/ref and exact native Node major',()=>{
  assert.equal(namespaceAdmission(admission()).runId,'39128774085');
  for(const [key,value] of Object.entries({GITHUB_ACTIONS:'false',RUNNER_ENVIRONMENT:'self-hosted',GITHUB_REPOSITORY:'foreign/repo',
    GITHUB_REPOSITORY_ID:'1',GITHUB_EVENT_NAME:'push',GITHUB_SHA:'f'.repeat(40),GITHUB_WORKFLOW_SHA:'f'.repeat(40),
    GITHUB_WORKFLOW_REF:'foreign/workflow',GITHUB_REF:'refs/tags/ci/probe',GITHUB_REF_NAME:'ci/../probe',
    GITHUB_RUN_ID:'01',GITHUB_RUN_ATTEMPT:'1\n',FULL_NAMESPACE_CONFIRMATION:'DO_NOT_RUN',FULL_NAMESPACE_EXPECTED_SHA:''})) {
    const input=admission();input.env[key]=value;refused(()=>namespaceAdmission(input));
  }
  for(const [key,value] of Object.entries({platform:'win32',arch:'arm64',nodeVersion:'v20.19.0'})){
    const input=admission();input[key]=value;refused(()=>namespaceAdmission(input));
  }
  for(const [key,value] of Object.entries({private:true,id:1,full_name:'foreign/repo'})){
    const input=admission();input.event.repository[key]=value;refused(()=>namespaceAdmission(input));
  }
  const wrongRef=admission();wrongRef.event.ref='another';refused(()=>namespaceAdmission(wrongRef));
  const wrongInput=admission();wrongInput.event.inputs.expected_source_sha='f'.repeat(40);refused(()=>namespaceAdmission(wrongInput));
  for(const [key,value] of Object.entries({head:'f'.repeat(40),clean:false,bytes:64*1024**2+1,fingerprint:'bad'})){
    const input=admission();input.git[key]=value;refused(()=>namespaceAdmission(input));
  }
});

test('admission rejects getters and inherited facts before evaluating their values',()=>{
  let calls=0;const input=admission();Object.defineProperty(input.env,'GITHUB_SHA',{enumerable:true,get(){calls++;return sha;}});
  refused(()=>namespaceAdmission(input));assert.equal(calls,0);
  const inherited=admission();inherited.git=Object.create(inherited.git);refused(()=>namespaceAdmission(inherited));
  const nonenum=admission();Object.defineProperty(nonenum.git,'head',{value:sha,enumerable:false});refused(()=>namespaceAdmission(nonenum));
  const getterLayout={...layout()};Object.defineProperty(getterLayout,'runId',{enumerable:true,get(){calls++;return '39128774085';}});
  refused(()=>namespaceArgv(getterLayout,node,1234));assert.equal(calls,0);
  const toJSON={...layout(),toJSON(){calls++;return layout();}};refused(()=>namespaceArgv(toJSON,node,1234));
  const version={toString(){calls++;return node.version;}};refused(()=>namespaceArgv(layout(),{...node,version},1234));assert.equal(calls,0);
});

test('argv reuses CI1 supervisor with narrow limits, exact norbind and an isolated builtin-only literal',()=>{
  const args=namespaceArgv(layout(),node,1234);
  for(const arg of ['--property=CPUQuota=100%','--property=MemoryMax=268435456','--property=MemorySwapMax=0',
    '--property=TasksMax=64','--property=RuntimeMaxSec=60s','--property=TimeoutStopSec=10s','--property=LimitCORE=0',
    '--property=PrivateTmp=yes',`--property=BindPaths=${layout().root}:${layout().root}:norbind`]) assert.ok(args.includes(arg),arg);
  assert.equal(args.filter(a=>a.startsWith('--property=BindPaths=')).length,1);
  const envIndex=args.indexOf('/usr/bin/env');assert.deepEqual(args.slice(envIndex,envIndex+5),
    ['/usr/bin/env','-i','PATH=/usr/bin:/bin','LANG=C','LC_ALL=C']);
  assert.ok(args.includes(NAMESPACE_UNIT_CODE));
  assert.equal(/from ['"](?:\.\.?\/|pg)/.test(NAMESPACE_UNIT_CODE),false);
  for(const invalid of [{...node,path:'/tmp/../node'},{...node,version:'v23.0.0'},{...node,sha256:'bad'}])refused(()=>namespaceArgv(layout(),invalid,1234));
  refused(()=>namespaceArgv({...layout(),root:'/var/tmp/foreign'},node,1234));
});

test('primary255 readback is R:R, rejecting recursive, ignoremissing, multiple or broad binds',()=>{
  const good=mapped();assert.equal(namespaceMapping(layout(),good.host,good.unit),true);
  const root=layout().root;
  for(const value of [`${root}:${root}:norbind`,`${root}:${root}:rbind`,`-${root}:${root}`,`${root}:${root} /var/tmp:/var/tmp`,
    '/var/tmp:/var/tmp',`${root}:${root}\n`]){
    const fixture=mapped();fixture.unit.properties.BindPaths=value;refused(()=>namespaceMapping(layout(),fixture.host,fixture.unit));
  }
  for(const [key,value] of Object.entries({PrivateTmp:'no',BindReadOnlyPaths:'/var/tmp:/var/tmp'})){
    const fixture=mapped();fixture.unit.properties[key]=value;refused(()=>namespaceMapping(layout(),fixture.host,fixture.unit));
  }
});

test('mapping rejects device/inode/mode/nonce, namespace and actual private var/tmp identity drift',()=>{
  for(const [key,value] of Object.entries({device:'2050',inode:'5002',ownerUid:1001,mode:0o755})){
    const f=mapped();f.unit.root[key]=value;refused(()=>namespaceMapping(layout(),f.host,f.unit));
  }
  for(const key of ['host','unit']){const f=mapped();f[key].nonce='c'.repeat(32);refused(()=>namespaceMapping(layout(),f.host,f.unit));}
  for(const mutate of [f=>f.unit.namespace=f.host.namespace,f=>f.unit.hostNamespace='mnt:[300]',
    f=>f.unit.tmp={...f.host.tmp},f=>f.unit.hostTmp.inode='99']){
    const f=mapped();mutate(f);refused(()=>namespaceMapping(layout(),f.host,f.unit));
  }
});

test('stale source and preexisting units are refused before any launch',()=>{
  const source=admission().git;assert.equal(namespaceSourceEqual(source,{...source}),true);
  for(const [key,value] of Object.entries({head:'f'.repeat(40),tree:'f'.repeat(40),clean:false,bytes:1001,fingerprint:'f'.repeat(64)})){
    refused(()=>namespaceSourceEqual(source,{...source,[key]:value}));
  }
  for(const status of [0,1,4])assert.equal(namespaceUnitAbsent('LoadState=not-found\nActiveState=inactive\n',status),true);
  for(const output of ['LoadState=loaded\nActiveState=active\n','LoadState=loaded\nActiveState=inactive\n',
    'LoadState=not-found\nActiveState=inactive\nExtra=unknown\n',''])refused(()=>namespaceUnitAbsent(output,0));
  refused(()=>namespaceUnitAbsent('LoadState=not-found\nActiveState=inactive\n',-1));
});

test('clean git with ignored private inputs rejects before any source payload read; Git metadata stays unread',()=>{
  let reads=0;const content=Buffer.from('public source');
  const tracked=['src/public.mjs'],entries=[{path:tracked[0],bytes:content.length,links:1},{path:'.git/config',bytes:100,links:1}];
  const result=namespaceTrackedInventory(tracked,[],entries,path=>{reads++;assert.equal(path,tracked[0]);return content;});
  assert.equal(reads,1);assert.equal(result.bytes,content.length+100);
  for(const unknown of [['.env.local'],['artifacts/private-input.json']]){
    reads=0;refused(()=>namespaceTrackedInventory(tracked,unknown,entries,()=>{reads++;return content;}));assert.equal(reads,0);
  }
  reads=0;refused(()=>namespaceTrackedInventory(tracked,[],[...entries,{path:'.env.local',bytes:27,links:1}],()=>{reads++;return content;}));assert.equal(reads,0);
  for(const paths of [['../escape'],['.env.local']]){
    reads=0;refused(()=>namespaceTrackedInventory(paths,[],entries,()=>{reads++;return content;}));assert.equal(reads,0);
  }
  reads=0;refused(()=>namespaceTrackedInventory(tracked,[],[{...entries[0],links:2}],()=>{reads++;return content;}));assert.equal(reads,0);
});

function fakeUnit(mutate=()=>{}) {
  const l=layout(),files=new Map(),binary=Buffer.from('fake preinstalled node'),pid=77;
  const unit='pos-cafe-ci1-r39128774085-a1.service',base='/sys/fs/cgroup/system.slice/'+unit;
  const properties={PrivateTmp:'yes',BindPaths:`${l.root}:${l.root}`,BindReadOnlyPaths:'',ControlGroup:'/system.slice/'+unit,
    ActiveState:'active',MainPID:String(pid),RuntimeMaxUSec:'1min',TimeoutStopUSec:'10s',KillMode:'control-group',
    StandardOutput:'null',StandardError:'null',LimitCORE:'0'};
  const proc={argv:[node.path,l.root,nonce,l.ownerLabel,l.runId,'1',hash(binary),node.version,'1234',hash(NAMESPACE_UNIT_CODE)],
    execArgv:['--input-type=module','--eval',NAMESPACE_UNIT_CODE],execPath:node.path,platform:'linux',arch:'x64',version:node.version,pid,getuid:()=>0};
  const reads=new Map([['/proc/self/cgroup',`0::/system.slice/${unit}/supervisor\n`],
    [`${base}/cpu.max`,'100000 100000\n'],[`${base}/memory.max`,'268435456\n'],[`${base}/memory.swap.max`,'0\n'],
    [`${base}/pids.max`,'64\n'],[`${base}/memory.events`,'oom 0\noom_kill 0\n'],[`${base}/pids.events`,'max 0\n'],
    ['/proc/self/mountinfo',`1 0 8:1 / ${l.root} rw - ext4 /dev/sda rw\n`],
    ['/proc/self/limits','Max core file size        0                    0                    bytes\n'],
    ['/proc/sys/kernel/core_pattern','core\n'],[node.path,binary]]);
  reads.set('/proc/self/cmdline',Buffer.from([proc.execPath,...proc.execArgv,'--',...proc.argv.slice(1),''].join('\0')));
  mutate({proc,properties,reads,files});
  const stat=(path,options={})=>{const big=options.bigint===true,number=value=>big?BigInt(value):value;
    const file=path===node.path||files.has(path),ino=path==='/var/tmp'?3:path.includes('/root/var/tmp')?2:5001;
    return {dev:number(2049),ino:number(ino),uid:number(0),mode:number(file?0o100600:0o40700),size:file?(files.get(path)?.length??binary.length):0,
      mtimeMs:1,nlink:1,blocks:number(8),isFile:()=>file,isDirectory:()=>!file,isSymbolicLink:()=>false};};
  const context={Buffer,process:proc,createHash,readFileSync:path=>{
    assert.ok(reads.has(path),`unexpected read ${path}`);return reads.get(path);},
    writeFileSync:(path,content,options)=>{assert.equal(options.flag,'wx');assert.equal(files.has(path),false);files.set(path,Buffer.from(content));},
    lstatSync:stat,realpathSync:path=>path==='/proc/self/exe'?node.path:path,readdirSync:()=>[...files.keys()].map(path=>path.slice(l.root.length+1)),
    readlinkSync:path=>path==='/proc/self/ns/mnt'?'mnt:[200]':'mnt:[100]',statfsSync:()=>({bavail:40*1024**3,bsize:1}),
    execFileSync:()=>Object.entries(properties).map(([k,v])=>`${k}=${v}`).join('\n')+'\n'+(reads.get('systemctl-extra')??'')};
  const code=NAMESPACE_UNIT_CODE.replace(/^import .*;\n/gm,'');new vm.Script(code).runInNewContext(context,{timeout:1000});
  return {proc,files};
}
test('actual unit literal accepts deterministic synthetic facts and refuses changed readbacks before export',()=>{
  const pass=fakeUnit();assert.equal(pass.proc.exitCode,undefined);assert.equal(pass.files.size,3);
  for(const mutate of [f=>f.properties.BindPaths+=':rbind',f=>f.properties.MainPID='99',f=>f.properties.RuntimeMaxUSec='30min',
    f=>f.reads.set('/sys/fs/cgroup/system.slice/pos-cafe-ci1-r39128774085-a1.service/cpu.max','max 100000\n'),
    f=>f.reads.set('/proc/self/cmdline',Buffer.from('unexpected\0')),f=>f.reads.set('systemctl-extra','PrivateTmp=yes\n')]){
    const fail=fakeUnit(mutate);assert.equal(fail.proc.exitCode,78);assert.equal(fail.files.size,0);
  }
});

test('import is effect-free with filesystem mutation and process launch disabled',()=>{
  const url=new URL('./permission-full-namespace-probe.mjs',import.meta.url).href;
  const code=`import fs from 'node:fs';import cp from 'node:child_process';import {syncBuiltinESMExports} from 'node:module';
    const deny=()=>{throw Error('IMPORT_SIDE_EFFECT');};
    for(const key of ['writeFileSync','appendFileSync','mkdirSync','unlinkSync','chmodSync'])fs[key]=deny;
    for(const key of ['spawn','spawnSync','execFileSync'])cp[key]=deny;syncBuiltinESMExports();
    const module=await import(${JSON.stringify(url)});if(typeof module.namespaceAdmission!=='function')throw Error('MISSING_EXPORT');`;
  assert.equal(execFileSync(process.execPath,['--input-type=module','--eval',code],{encoding:'utf8',timeout:10000,maxBuffer:65536}),'');
});
