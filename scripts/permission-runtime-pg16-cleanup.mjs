import{readFileSync,writeFileSync,lstatSync,realpathSync,readdirSync,statfsSync,rmSync}from'node:fs';
import{join,resolve}from'node:path';
import{execFileSync,spawnSync}from'node:child_process';
import{createHash}from'node:crypto';
import{pathToFileURL}from'node:url';
import{reclaimUnitState}from'./permission-ci1-reclaim.mjs';
import{sourceBinding}from'./project-ci-results.mjs';

const check=x=>{if(!x)throw Error('PERMISSION_PG16_CLEANUP_REFUSED');};
const hash=b=>createHash('sha256').update(b).digest('hex');
export function pg16Layout(runId,attempt){
 check(/^[1-9][0-9]{0,19}$/.test(runId??'')&&Number.isInteger(attempt)&&attempt>=1&&attempt<=1000);
 const root=`/var/tmp/pos-cafe-perm-t01-r${runId}-a${attempt}`;
 return{root,data:root+'/data',private:root+'/private',unit:`pos-cafe-light-r${runId}-a${attempt}.service`,port:65482};
}
const keys=['schemaVersion','runId','attempt','unit','sourceSHA','nativeSHA','cleanupSHA','uid','device','inode'];
export function pg16ControlMatches(c,expected){
 check(c&&Object.keys(c).sort().join(',')===keys.slice().sort().join(',')&&c.schemaVersion==='permission-pg16-control-v1'
  &&keys.filter(k=>k!=='schemaVersion').every(k=>c[k]===expected[k])&&Number.isSafeInteger(c.uid)&&c.uid>0
  &&Number.isSafeInteger(c.device)&&Number.isSafeInteger(c.inode));return true;
}
function expectedControl(layout,source,sourceSHA){
 const r=lstatSync(layout.root);check(r.isDirectory()&&!r.isSymbolicLink()&&realpathSync(layout.root)===layout.root
  &&r.uid===process.getuid()&&(r.mode&0o777)===0o700&&/^[a-f0-9]{40}$/.test(sourceSHA));
 for(const p of['/var','/var/tmp'])check(realpathSync(p)===p&&!lstatSync(p).isSymbolicLink());
 const match=/^pos-cafe-light-r([1-9][0-9]*)-a([1-9][0-9]*)\.service$/.exec(layout.unit);check(match);
 return{schemaVersion:'permission-pg16-control-v1',runId:match[1],attempt:Number(match[2]),unit:layout.unit,sourceSHA,
  nativeSHA:hash(readFileSync(join(source,'scripts/permission-runtime-pg16.mjs'))),
  cleanupSHA:hash(readFileSync(join(source,'scripts/permission-runtime-pg16-cleanup.mjs'))),uid:r.uid,device:r.dev,inode:r.ino};
}
export function createPg16Control(layout,source,sourceSHA){
 const c=expectedControl(layout,source,sourceSHA);
 writeFileSync(layout.root+'/run-control.json',JSON.stringify(c)+'\n',{flag:'wx',mode:0o400});return c;
}
export function readPg16Control(layout,source,sourceSHA){
 const p=layout.root+'/run-control.json',s=lstatSync(p);
 check(s.isFile()&&!s.isSymbolicLink()&&s.nlink===1&&s.uid===process.getuid()&&(s.mode&0o777)===0o400&&s.size<4096);
 const c=JSON.parse(readFileSync(p));pg16ControlMatches(c,expectedControl(layout,source,sourceSHA));return c;
}
export function pg16OwnedProcessPresent(layout){
 for(const name of readdirSync('/proc').filter(n=>/^[1-9][0-9]*$/.test(n))){
  try{const p='/proc/'+name;if(lstatSync(p).uid!==process.getuid())continue;
   const a=readFileSync(p+'/cmdline','utf8').split('\0');
   if(a.includes('-D')&&a[a.indexOf('-D')+1]===layout.data)return true;
  }catch(e){if(!['ENOENT','ESRCH'].includes(e.code))throw e;}
 }return false;
}
export function removePg16Root(layout,source,sourceSHA){
 const c=readPg16Control(layout,source,sourceSHA);check(!pg16OwnedProcessPresent(layout));
 let allocatedBeforeBytes=0;
 const scan=p=>{const s=lstatSync(p);check(!s.isSymbolicLink()&&s.uid===c.uid&&s.dev===c.device);
  allocatedBeforeBytes+=s.blocks*512;
  if(s.isDirectory())for(const n of readdirSync(p))scan(join(p,n));else check(s.nlink===1&&(s.isFile()
   ||s.isSocket()&&p===layout.root+'/socket/.s.PGSQL.'+layout.port));
 };scan(layout.root);check(allocatedBeforeBytes<=5*1024**3);readPg16Control(layout,source,sourceSHA);
 const before=statfsSync(layout.root);rmSync(layout.root,{recursive:true});check(!lstatSync(layout.root,{throwIfNoEntry:false}));
 const after=statfsSync('/var/tmp');return{rootRemoved:true,processReleased:true,allocatedBeforeBytes,
  measuredFreeDeltaBytes:after.bavail*after.bsize-before.bavail*before.bsize};
}
export function reclaimPg16AfterUnit(source,env){
 check(process.platform==='linux'&&process.getuid()>0&&env.GITHUB_ACTIONS==='true'&&env.RUNNER_ENVIRONMENT==='github-hosted'
  &&env.GITHUB_REPOSITORY==='nguyentronglinh045/pos-cafe'&&env.GITHUB_REPOSITORY_ID==='1263057386');
 const layout=pg16Layout(env.GITHUB_RUN_ID,Number(env.GITHUB_RUN_ATTEMPT));
 const actual=execFileSync('git',['rev-parse','HEAD'],{cwd:source,encoding:'utf8',timeout:10000,maxBuffer:4096}).trim();
 check(/^[a-f0-9]{40}$/.test(actual)&&!execFileSync('git',['diff','--name-only','HEAD','--'],{cwd:source,encoding:'utf8',timeout:10000,maxBuffer:8192}).trim());
 const commit=execFileSync('git',['cat-file','-p','HEAD'],{cwd:source,encoding:'utf8',timeout:10000,maxBuffer:1024**2});
 const parents=commit.slice(0,commit.indexOf('\n\n')).split('\n').filter(l=>/^parent [a-f0-9]{40}$/.test(l)).map(l=>l.slice(7));
 sourceBinding(env,JSON.parse(readFileSync(env.GITHUB_EVENT_PATH)),actual,env.GITHUB_EVENT_NAME==='pull_request'?parents:undefined);
 check(lstatSync(source).uid===process.getuid());
 const state=spawnSync('/usr/bin/systemctl',['show',layout.unit,'--property=LoadState','--property=ActiveState'],{encoding:'utf8',timeout:10000,maxBuffer:4096});
 let populated=null;try{const m=/^populated ([01])$/m.exec(readFileSync('/sys/fs/cgroup/system.slice/'+layout.unit+'/cgroup.events','utf8'));check(m);populated=Number(m[1]);}
 catch(e){if(e.code!=='ENOENT')throw e;}reclaimUnitState(state,populated);
 if(!lstatSync(layout.root,{throwIfNoEntry:false}))return{schemaVersion:'permission-pg16-reclaim-v1',status:'NOT_PRESENT',rootRemoved:true,processReleased:true};
 const result=removePg16Root(layout,source,actual);
 return{schemaVersion:'permission-pg16-reclaim-v1',status:'RECLAIMED',...result};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{console.log(JSON.stringify(reclaimPg16AfterUnit(realpathSync(process.cwd()),process.env)));}
 catch{console.log('PERMISSION_PG16_RECLAIM_REFUSED');process.exitCode=1;}
}
