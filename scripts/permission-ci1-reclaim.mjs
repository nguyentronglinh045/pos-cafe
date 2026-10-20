import {readFileSync,writeFileSync,lstatSync,realpathSync,statfsSync,unlinkSync,readdirSync,rmdirSync} from 'node:fs';
import {execFileSync,spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {ci1WorkerLayout,ci1BytesHash} from './permission-ci1-intake.mjs';
import {CI1_LIMITS} from './permission-ci1-policy.mjs';

const refuse=()=>{throw Error('CI1_RECLAIM_REFUSED');};
export function assertReclaimFacts(f,control,expected){
  if(!f||f.rootOwned!==true||f.controlOwned!==true||f.imageOwned!==true||f.imageLinks!==1
    ||!Number.isSafeInteger(f.imageBytes)||f.imageBytes<0||f.imageBytes>CI1_LIMITS.filesystemBytes
    ||!['inactive','failed'].includes(f.unitActiveState)||f.attachedLoops!==0||f.ownedMounts!==0
    ||control?.runId!==expected.runId||control.attempt!==expected.attempt||control.sourceSHA!==expected.sourceSHA
    ||control.unit!==expected.unit||control.workerSHA!==expected.workerSHA)refuse();
  return true;
}
const run=(name,args)=>execFileSync(name,args,{encoding:'utf8',timeout:5000,maxBuffer:32768,stdio:['ignore','pipe','pipe']});
function admission(){
  const e=process.env;
  if(process.platform!=='linux'||e.GITHUB_ACTIONS!=='true'||e.RUNNER_ENVIRONMENT!=='github-hosted'
    ||e.GITHUB_REPOSITORY!=='nguyentronglinh045/pos-cafe'||e.GITHUB_REPOSITORY_ID!=='1263057386'
    ||e.GITHUB_EVENT_NAME!=='workflow_dispatch'||e.CI1_RECLAIM_AUTHORIZED!=='yes'
    ||!/^[a-f0-9]{40}$/.test(e.GITHUB_SHA??'')||e.GITHUB_SHA!==e.GITHUB_WORKFLOW_SHA)refuse();
  const event=JSON.parse(readFileSync(e.GITHUB_EVENT_PATH));
  if(event.repository?.id!==1263057386||event.repository.full_name!==e.GITHUB_REPOSITORY||event.repository.private!==false
    ||event.inputs?.confirmation!=='RUN_SYNTHETIC_PILOT')refuse();
  const root=realpathSync(process.cwd());
  if(run('git',['-c',`safe.directory=${root}`,'-C',root,'rev-parse','HEAD']).trim()!==e.GITHUB_SHA)refuse();
  return {root,layout:ci1WorkerLayout(e.GITHUB_RUN_ID,Number(e.GITHUB_RUN_ATTEMPT))};
}
function reclaim(root,layout){
  const owned=(p,kind,mode)=>{const s=lstatSync(p);if(s.isSymbolicLink()||realpathSync(p)!==p||s.uid!==0
    ||(s.mode&0o777)!==mode||!(kind==='file'?s.isFile():s.isDirectory()))refuse();return s;};
  if(!lstatSync(layout.task,{throwIfNoEntry:false}))return {schemaVersion:'permission-ci1-reclaim-v1',status:'NOT_CREATED',imageUnlinked:false};
  for(const p of ['/var','/var/lib'])if(lstatSync(p).isSymbolicLink()||realpathSync(p)!==p)refuse();
  owned(layout.task,'directory',0o700);const controlPath=layout.task+'/run-control.json';
  if(owned(controlPath,'file',0o400).size>4096)refuse();const control=JSON.parse(readFileSync(controlPath));
  const expected={...layout.identity,sourceSHA:process.env.GITHUB_SHA,workerSHA:ci1BytesHash(readFileSync(root+'/scripts/permission-ci1-worker.mjs'))};
  const unitActiveState=run('systemctl',['show',layout.identity.unit,'--property=ActiveState','--value']).trim();
  const mounts=run('findmnt',['--kernel','--list','--noheadings','--raw','--output','TARGET']).trim().split('\n');
  const ownedMounts=mounts.filter(p=>p===layout.volume||p.startsWith(layout.volume+'/')).length;
  const image=lstatSync(layout.image,{throwIfNoEntry:false});
  if(!image){
    if(ownedMounts!==0||!['inactive','failed'].includes(unitActiveState)||control.runId!==expected.runId
      ||control.attempt!==expected.attempt||control.sourceSHA!==expected.sourceSHA||control.workerSHA!==expected.workerSHA
      ||control.unit!==expected.unit)refuse();
    return {schemaVersion:'permission-ci1-reclaim-v1',status:'NO_IMAGE',imageUnlinked:false};
  }
  owned(layout.image,'file',0o600);
  const attachedLoops=run('losetup',['--noheadings','--associated',layout.image]).trim()?1:0;
  assertReclaimFacts({rootOwned:true,controlOwned:true,imageOwned:true,imageLinks:image.nlink,imageBytes:image.size,
    unitActiveState,attachedLoops,ownedMounts},control,expected);
  const before=statfsSync(layout.task),beforeBytes=before.bavail*before.bsize;
  const current=owned(layout.image,'file',0o600);
  if(current.dev!==image.dev||current.ino!==image.ino||current.size!==image.size||current.nlink!==1)refuse();
  unlinkSync(layout.image);
  const mountPoint=lstatSync(layout.volume,{throwIfNoEntry:false});
  if(mountPoint){owned(layout.volume,'directory',0o700);if(readdirSync(layout.volume).length===0)rmdirSync(layout.volume);}
  const after=statfsSync(layout.task);
  const receipt={schemaVersion:'permission-ci1-reclaim-v1',status:'RECLAIMED',imageUnlinked:true,imageLogicalBytes:image.size,
    imageAllocatedBytes:image.blocks*512,hostFreeBeforeBytes:beforeBytes,hostFreeAfterBytes:after.bavail*after.bsize,
    measuredHostFreeDeltaBytes:after.bavail*after.bsize-beforeBytes,remaining:'compact control/status/safe export only; ephemeral runner'};
  writeFileSync(layout.task+'/reclaim-receipt.json',JSON.stringify(receipt)+'\n',{flag:'wx',mode:0o600});return receipt;
}
function main(){
  const {root,layout}=admission();
  if(process.getuid()===0){console.log(JSON.stringify(reclaim(root,layout)));return;}
  const keys=['GITHUB_ACTIONS','RUNNER_ENVIRONMENT','GITHUB_REPOSITORY','GITHUB_REPOSITORY_ID','GITHUB_EVENT_NAME',
    'GITHUB_EVENT_PATH','GITHUB_SHA','GITHUB_WORKFLOW_SHA','GITHUB_RUN_ID','GITHUB_RUN_ATTEMPT','CI1_RECLAIM_AUTHORIZED'];
  const args=['--','env','-i','PATH=/usr/sbin:/usr/bin:/sbin:/bin',...keys.map(k=>`${k}=${process.env[k]}`),
    process.execPath,resolve(root,'scripts/permission-ci1-reclaim.mjs')];
  if(args.some(a=>/[\r\n\0]/.test(a)))refuse();
  const child=spawnSync('sudo',args,{cwd:root,encoding:'utf8',timeout:30000,maxBuffer:32768});
  if(child.status!==0||child.signal||child.error)refuse();
  const receipt=JSON.parse(child.stdout);
  if(receipt.schemaVersion!=='permission-ci1-reclaim-v1'||!['NOT_CREATED','NO_IMAGE','RECLAIMED'].includes(receipt.status))refuse();
  console.log(JSON.stringify(receipt));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  try{main();}catch{console.log('CI1_RECLAIM_REFUSED');process.exitCode=1;}
}
