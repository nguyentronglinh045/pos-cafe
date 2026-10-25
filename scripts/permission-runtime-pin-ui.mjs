import{readFileSync,writeFileSync,appendFileSync,mkdirSync,lstatSync,realpathSync,readdirSync,statfsSync}from'node:fs';
import{join,resolve}from'node:path';import{execFileSync,spawnSync}from'node:child_process';import{pathToFileURL}from'node:url';import{crc32}from'node:zlib';
import{hash,sourceBinding,uiCounts}from'./project-ci-results.mjs';import{trackedFingerprint,allocatedBytes,gitCommitParents}from'./project-ci.mjs';
import{pg16Layout}from'./permission-runtime-pg16-cleanup.mjs';import{reclaimUnitState}from'./permission-ci1-reclaim.mjs';import{REQUIRED_RULES}from'../ui-audit/runtime.mjs';
import{pinUiActionRoot}from'./permission-pin-ui-policy.mjs';

const check=x=>{if(!x)throw Error('PERMISSION_PIN_UI_REFUSED');},cap=2*1024**2;
export const PIN_UI_VIEWPORTS=Object.freeze([{name:'desktop',width:1440,height:900},{name:'tablet',width:1024,height:768},{name:'mobile',width:844,height:390}]);
const keys=(x,wanted)=>check(x&&Object.keys(x).sort().join(',')===wanted.slice().sort().join(','));
const filename=v=>'required_pin_change__'+v+'.png',hex=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
export function pinPngFacts(bytes,viewport){
 check(Buffer.isBuffer(bytes)&&bytes.length>=45&&bytes.length<=1024**2&&bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])));
 let at=8,header=null,idat=0,ended=false,count=0;
 while(at<bytes.length){check(++count<=1024&&at+12<=bytes.length);const n=bytes.readUInt32BE(at),type=bytes.toString('ascii',at+4,at+8);check(n<=1024**2&&at+12+n<=bytes.length);
  check(['IHDR','IDAT','IEND','sRGB','gAMA','cHRM','pHYs'].includes(type)&&crc32(bytes.subarray(at+4,at+8+n))===bytes.readUInt32BE(at+8+n));
  if(type==='IHDR'){check(!header&&at===8&&n===13);header={width:bytes.readUInt32BE(at+8),height:bytes.readUInt32BE(at+12)};
   check(bytes[at+16]===8&&[2,6].includes(bytes[at+17])&&bytes[at+18]===0&&bytes[at+19]===0&&bytes[at+20]===0);}
  else{check(header&&!ended);if(type==='IDAT')idat+=n;else if(type==='IEND'){check(n===0&&idat>0);ended=true;}
   else check(({sRGB:1,gAMA:4,cHRM:32,pHYs:9})[type]===n);}
  at+=n+12;if(ended){check(at===bytes.length);break;}
 }
 check(ended&&header.width===viewport.width&&header.height>=viewport.height&&header.height<=6000);return header;
}
export function pinUiManifest(binding,proofs,images,findings,baselineSHA256,sourceFiles,passed){
 keys(binding,['sourceSHA','sourceFingerprint','lockSHA','runId','attempt']);check(/^[a-f0-9]{40}$/.test(binding.sourceSHA)&&hex(binding.sourceFingerprint)&&hex(binding.lockSHA)
  &&/^[1-9][0-9]{0,19}$/.test(binding.runId)&&Number.isInteger(binding.attempt)&&binding.attempt>=1&&binding.attempt<=1000&&hex(baselineSHA256)&&typeof passed==='boolean');
 keys(sourceFiles,['runnerSHA256','fixtureSHA256','configSHA256','detectorSHA256']);check(Object.values(sourceFiles).every(hex));
 check(Array.isArray(proofs)&&proofs.length===3&&Array.isArray(images)&&images.length===3&&Array.isArray(findings)&&findings.length<=128);
 const photos=PIN_UI_VIEWPORTS.map(v=>{const p=proofs.filter(x=>x?.viewport===v.name),im=images.filter(x=>x?.filename===filename(v.name));check(p.length===1&&im.length===1);
  const proof=p[0],image=im[0];keys(proof,['state','viewport','width','height','filename','bytes','sha256','credentialFreeMock','passwordInputsEmpty','maskedPasswordInputs','annotatedFindings']);
  check(proof.state==='required-pin-change'&&proof.width===v.width&&proof.height===v.height&&proof.filename===filename(v.name)
   &&proof.credentialFreeMock===true&&proof.passwordInputsEmpty===true&&proof.maskedPasswordInputs===2&&proof.bytes===image.bytes.length&&proof.sha256===hash(image.bytes));
  const dimensions=pinPngFacts(image.bytes,v),rows=findings.filter(f=>f?.viewport===v.name);check(rows.length===proof.annotatedFindings);
  return{viewport:v.name,width:v.width,height:v.height,filename:proof.filename,bytes:proof.bytes,sha256:proof.sha256,imageWidth:dimensions.width,imageHeight:dimensions.height,
   passwordInputsEmpty:true,maskedPasswordInputs:2,photoInspected:false,classifications:'PENDING_VISUAL_REVIEW',findingIds:rows.map(f=>hash(f.key))};});
 const seen=new Set(),safeFindings=findings.map(f=>{check(f&&f.target==='required-pin-change'&&PIN_UI_VIEWPORTS.some(v=>v.name===f.viewport)
  &&REQUIRED_RULES.includes(f.rule)&&['error','warn','info'].includes(f.severity)&&typeof f.known==='boolean'&&typeof f.key==='string'&&f.key.length<=2048&&!seen.has(f.key));seen.add(f.key);
  check(f.rect===null||f.rect&&Object.keys(f.rect).sort().join(',')==='h,w,x,y'&&Object.values(f.rect).every(n=>Number.isInteger(n)&&Math.abs(n)<=100000)&&f.rect.w>=0&&f.rect.h>=0);
  return{id:hash(f.key),viewport:f.viewport,rule:f.rule,severity:f.severity,known:f.known,rect:f.rect===null?null:{x:f.rect.x,y:f.rect.y,w:f.rect.w,h:f.rect.h}};});
 check(!passed||safeFindings.every(f=>f.known));
 const argv=['node','ui-audit/run.mjs','--state','required-pin-change'];
 const r={schemaVersion:'permission-pin-ui-photos-v1',scope:'CREDENTIAL_FREE_MOCK_PIN_UI_ONLY',...binding,
  auditStatus:passed?'PASS':'FAIL_REVIEW_REQUIRED',visualReview:'NOT_RUN',canonicalArgv:argv,invocationSHA256:hash(JSON.stringify(argv)),
  baselineSHA256,sourceFiles,credentialFreeMock:true,photos,findings:safeFindings,rawLogsOrPrivateTC18Exported:false};
 const json=JSON.stringify(r,null,2)+'\n';check(Buffer.byteLength(json)<=16384&&photos.reduce((n,p)=>n+p.bytes,Buffer.byteLength(json))<=cap);return{r,json};
}
function context(){
 check(process.platform==='linux'&&process.getuid?.()>0&&process.versions.node==='24.16.0');
 const root=realpathSync(process.cwd()),git=a=>execFileSync('git',a,{cwd:root,encoding:'utf8',timeout:10000,maxBuffer:128*1024}),actual=git(['rev-parse','HEAD']).trim();
 const e=process.env,b=sourceBinding(e,JSON.parse(readFileSync(e.GITHUB_EVENT_PATH)),actual,gitCommitParents(git(['cat-file','-p','HEAD'])));
 check(!git(['diff','--name-only','HEAD','--']).trim());const paths=git(['ls-files','-z']).split('\0').filter(Boolean).sort();
 const binding={sourceSHA:b.sourceSHA,sourceFingerprint:trackedFingerprint(root,paths),lockSHA:hash(readFileSync(join(root,'package-lock.json'))),runId:b.runId,attempt:b.attempt};
 const guard=()=>{check(trackedFingerprint(root,paths)===binding.sourceFingerprint&&allocatedBytes([root,root+'/.git',e.RUNNER_TEMP,pinUiActionRoot(root)])+4*1024**2<=5*1024**3
  &&allocatedBytes([pinUiActionRoot(root)])<=64*1024**2);
  for(const p of[root,e.RUNNER_TEMP]){const f=statfsSync(p);check(f.bavail*f.bsize>=30*1024**3);}};
 const out=join(root,'artifacts','permission-pin-ui-safe',b.runId+'-'+b.attempt),layout=pg16Layout(b.runId,b.attempt);
 return{root,binding,guard,out,layout};
}
function file(p,max,owner=process.getuid()){
 const s=lstatSync(p);check(s.isFile()&&!s.isSymbolicLink()&&s.nlink===1&&s.uid===owner&&s.size>0&&s.size<=max&&realpathSync(p)===p);return readFileSync(p);
}
function sourceFiles(root){return Object.fromEntries(Object.entries({runnerSHA256:'ui-audit/run.mjs',fixtureSHA256:'ui-audit/required-pin-change.html',configSHA256:'ui-audit/config.json',detectorSHA256:'ui-audit/audit.js'}).map(([k,p])=>[k,hash(readFileSync(join(root,p)))]));}
function freshDirectory(root,path){
 check(path.startsWith(root+'/artifacts/')&&!lstatSync(path,{throwIfNoEntry:false}));
 let p=root;for(const part of path.slice(root.length+1).split('/')){p+='/'+part;const s=lstatSync(p,{throwIfNoEntry:false});
  if(s)check(s.isDirectory()&&!s.isSymbolicLink()&&s.uid===process.getuid()&&s.dev===lstatSync(root).dev&&realpathSync(p)===p);else mkdirSync(p,{mode:0o700});}
}
function validateExport(c){
 const{out,root,binding}=c,s=lstatSync(out);check(s.isDirectory()&&!s.isSymbolicLink()&&s.uid===process.getuid()&&s.dev===lstatSync(root).dev&&(s.mode&0o777)===0o700&&realpathSync(out)===out);
 check(readdirSync(out).sort().join(',')===['manifest.json',...PIN_UI_VIEWPORTS.map(v=>filename(v.name))].sort().join(','));
 for(const name of readdirSync(out))check((lstatSync(out+'/'+name).mode&0o777)===0o400);
 const manifest=JSON.parse(file(out+'/manifest.json',16384)),images=PIN_UI_VIEWPORTS.map(v=>({filename:filename(v.name),bytes:file(out+'/'+filename(v.name),1024**2)}));
 validatePinUiManifest(manifest,binding,images,hash(readFileSync(root+'/ui-audit/baseline.json')),sourceFiles(root));c.guard();return manifest;
}
export function validatePinUiManifest(manifest,binding,images,baselineSHA256,files){
 const proofs=manifest.photos.map(p=>({state:'required-pin-change',viewport:p.viewport,width:p.width,height:p.height,filename:p.filename,bytes:p.bytes,sha256:p.sha256,
  credentialFreeMock:true,passwordInputsEmpty:p.passwordInputsEmpty,maskedPasswordInputs:p.maskedPasswordInputs,annotatedFindings:p.findingIds.length}));
 const rawFindings=manifest.findings.map(f=>({...f,target:'required-pin-change',key:f.id}));
 // Recheck explicit public schema, domains and image bytes independently; do not
 // regenerate identity hashes from already-hashed finding IDs.
 keys(manifest,['schemaVersion','scope',...Object.keys(binding),'auditStatus','visualReview','canonicalArgv','invocationSHA256','baselineSHA256','sourceFiles','credentialFreeMock','photos','findings','rawLogsOrPrivateTC18Exported']);
 for(const[k,v]of Object.entries(binding))check(manifest[k]===v);check(manifest.schemaVersion==='permission-pin-ui-photos-v1'&&manifest.scope==='CREDENTIAL_FREE_MOCK_PIN_UI_ONLY'
  &&['PASS','FAIL_REVIEW_REQUIRED'].includes(manifest.auditStatus)&&manifest.visualReview==='NOT_RUN'&&manifest.credentialFreeMock===true&&manifest.rawLogsOrPrivateTC18Exported===false
  &&manifest.baselineSHA256===baselineSHA256&&JSON.stringify(manifest.sourceFiles)===JSON.stringify(files)
  &&JSON.stringify(manifest.canonicalArgv)==='["node","ui-audit/run.mjs","--state","required-pin-change"]'&&manifest.invocationSHA256===hash(JSON.stringify(manifest.canonicalArgv)));
 pinUiManifest(binding,proofs,images,rawFindings,manifest.baselineSHA256,manifest.sourceFiles,manifest.auditStatus==='PASS');
 for(const p of manifest.photos){keys(p,['viewport','width','height','filename','bytes','sha256','imageWidth','imageHeight','passwordInputsEmpty','maskedPasswordInputs','photoInspected','classifications','findingIds']);
  check(p.photoInspected===false&&p.classifications==='PENDING_VISUAL_REVIEW'&&Array.isArray(p.findingIds)&&p.findingIds.every(hex)
   &&JSON.stringify(p.findingIds)===JSON.stringify(manifest.findings.filter(f=>f.viewport===p.viewport).map(f=>f.id)));
  const dimensions=pinPngFacts(images.find(i=>i.filename===p.filename).bytes,PIN_UI_VIEWPORTS.find(v=>v.name===p.viewport));check(p.imageWidth===dimensions.width&&p.imageHeight===dimensions.height);}
 for(const f of manifest.findings){keys(f,['id','viewport','rule','severity','known','rect']);check(hex(f.id));}
 check(images.reduce((n,p)=>n+p.bytes.length,Buffer.byteLength(JSON.stringify(manifest,null,2)+'\n'))<=cap);return manifest;
}
async function main(){
 const c=context(),{root,binding,guard,out,layout}=c;guard();
 if(process.argv[2]==='--export-check'){
  check(process.argv.length===3);let populated=null;try{const text=readFileSync('/sys/fs/cgroup/system.slice/'+layout.unit+'/cgroup.events','utf8');check(/^populated [01]$/m.test(text));populated=Number(/^populated ([01])$/m.exec(text)[1]);}catch(e){if(e.code!=='ENOENT')throw e;}
  const state=spawnSync('systemctl',['show',layout.unit,'--no-pager','--property=LoadState','--property=ActiveState'],{encoding:'utf8',timeout:10000,maxBuffer:4096});reclaimUnitState(state,populated);
  if(!lstatSync(out,{throwIfNoEntry:false})){console.log('PIN_UI_SAFE_EXPORT_NOT_PRESENT');return;}
  validateExport(c);const output=process.env.GITHUB_OUTPUT;check(typeof output==='string'&&output.startsWith(realpathSync(process.env.RUNNER_TEMP)+'/'));
  const info=lstatSync(output);check(info.isFile()&&!info.isSymbolicLink()&&info.uid===process.getuid()&&info.nlink===1&&info.size<=65536&&realpathSync(output)===output);
  appendFileSync(output,'ready=true\n');console.log('PIN_UI_SAFE_EXPORT_READY');return;
 }
 check(process.argv.length===2&&readFileSync('/proc/self/cgroup','utf8').trim()==='0::/system.slice/'+layout.unit);
 const privateRoot=join(root,'artifacts','permission-pin-ui-private-'+binding.runId+'-'+binding.attempt);freshDirectory(root,privateRoot);freshDirectory(root,out);
 const cg='/sys/fs/cgroup/system.slice/'+layout.unit;
 for(const[k,v]of Object.entries({'cpu.max':'300000 100000','memory.max':String(8*1024**3),'memory.swap.max':'0','pids.max':'1024'}))check(readFileSync(cg+'/'+k,'utf8').trim()===v);
 const baseline=hash(readFileSync(root+'/ui-audit/baseline.json')),started=Date.now(),childDeadline=started+450000;
 const target=spawnSync(process.execPath,['ui-audit/run.mjs','--state','required-pin-change'],{cwd:root,env:process.env,timeout:120000,killSignal:'SIGKILL',maxBuffer:1024**2});
 const raw=Buffer.concat([target.stdout??Buffer.alloc(0),target.stderr??Buffer.alloc(0)]);writeFileSync(privateRoot+'/target-private.log',raw,{flag:'wx',mode:0o600});guard();
 check(!target.error&&!target.signal&&[0,1].includes(target.status)&&hash(readFileSync(root+'/ui-audit/baseline.json'))===baseline);
 const status=JSON.parse(file(root+'/ui-audit/out/status.json',1024**2));check(status.kind==='ui-audit-run'&&status.status==='COMPLETE'&&status.expectedPairs===3&&status.completedPairs===3&&status.attemptedPairs===3
  &&status.setupFailures?.length===0&&status.source?.preserved===true&&JSON.stringify(status.source.before)===JSON.stringify(status.source.after)
  &&Date.parse(status.startedAt)>=started-1000&&Date.parse(status.finishedAt)<=Date.now()+5000);
 const findings=JSON.parse(file(root+'/ui-audit/report.json',1024**2)),config=JSON.parse(readFileSync(root+'/ui-audit/config.json'));
 if(target.status===0)uiCounts(raw.toString(),findings,{...config,states:config.states.filter(s=>s.name==='required-pin-change')});
 const images=PIN_UI_VIEWPORTS.map(v=>({filename:filename(v.name),bytes:file(root+'/ui-audit/out/'+filename(v.name),1024**2)}));
 const{json}=pinUiManifest(binding,status.pinPhotos,images,findings,baseline,sourceFiles(root),target.status===0);
 for(const i of images)writeFileSync(out+'/'+i.filename,i.bytes,{flag:'wx',mode:0o400});writeFileSync(out+'/manifest.json',json,{flag:'wx',mode:0o400});validateExport(c);
 console.log('PIN_UI_TARGETED_PROJECTION '+JSON.stringify({sourceSHA:binding.sourceSHA,runId:binding.runId,photos:3,status:target.status===0?'PASS':'FAIL_REVIEW_REQUIRED'}));
 if(target.status!==0){process.exitCode=1;return;}
 // Targeted output stays private. The existing full-matrix normalizer receives
 // exactly the real full-matrix stdout, never 3 targeted rows relabeled as48.
 const remaining=childDeadline-Date.now()-1000;check(remaining>0);
 const full=spawnSync(process.execPath,['ui-audit/run.mjs'],{cwd:root,env:process.env,timeout:Math.min(330000,remaining),killSignal:'SIGKILL',maxBuffer:1024**2});guard();
 if(full.stdout)process.stdout.write(full.stdout);if(full.stderr)process.stderr.write(full.stderr);
 check(!full.error&&!full.signal&&hash(readFileSync(root+'/ui-audit/baseline.json'))===baseline);process.exitCode=full.status===0?0:1;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){try{await main();}catch{console.error('PERMISSION_PIN_UI_REFUSED');process.exitCode=1;}}
