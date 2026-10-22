// Only the owned disposable Linux CI task executes the native artifact.
import {readFileSync,writeFileSync,openSync,closeSync,writeSync,mkdirSync,mkdtempSync,lstatSync,realpathSync,readdirSync,statfsSync,rmSync,cpSync,chmodSync}from'node:fs';
import {resolve,join,sep}from'node:path';import{pathToFileURL}from'node:url';import{createHash}from'node:crypto';import{spawn}from'node:child_process';
import {assertEdgeResolution,installEdgeResolution,publicEdgeResolution}from'./permission-edge-resolution.mjs';
import {ci1EdgeCacheProof}from'./permission-runtime-t04-worker.mjs';
export const EDGE_NATIVE=Object.freeze({url:'https://github.com/supabase/edge-runtime/releases/download/v1.74.3/edge-runtime-v1.74.3-x86_64-linux.tar.gz',bytes:82997085,sha256:'8b5a0f998a552d80690136de969eaa7ab15175509684a5598a97629afa243db1'});
const check=(ok,code='INPUT')=>{if(!ok)throw Object.assign(Error('EDGE_PROBE_REFUSED'),{code});};
const REASONS=Object.freeze(['INPUT','ENVELOPE','EXISTS','ARCHIVE_LIST','ARCHIVE_ENTRY','ARCHIVE_DUPLICATE','ARCHIVE_PATH','ARCHIVE_TYPE','ARCHIVE_BOUND','ARCHIVE_BINARY','OWNED_LINK','OWNED_ENTRIES','OWNED_TYPE','OWNED_BOUND','FREE_SPACE','DOWNLOAD_HTTP','DOWNLOAD_BOUND','DOWNLOAD_HASH','ARCHIVE_COMMAND','EXTRACT','VERSION','BUNDLE','CACHE_CLOSURE','BAD_SRI_CONTROL','CLEANUP_IDENTITY','EDGE_CACHE_PIN','EDGE_CACHE_SRI','EDGE_CACHE_DEPENDENCIES','EDGE_RESOLUTION_INPUT','OWNED_OWNER','OWNED_DEVICE','OWNED_DRIFT','PROCESS_RELEASE','CLEANUP_CONTROL','COMMAND_TIMEOUT','OUTPUT_BOUND']);
const reason=error=>REASONS.indexOf(error?.ci1FailureCode??error?.code)+1;
const io=error=>['EACCES','EPERM','ENOENT'].indexOf(error?.code)+1;
const bounded=(value,max)=>Number.isSafeInteger(value)&&value>=0&&value<=max?value:0;
export function edgeProbeFailure(primary,cleanup,{stage,rootRemoved,processReleased}){
 const selected=primary??cleanup,facts=selected?.ci1Facts??{};
 const error=Object.assign(Error('EDGE_PROBE_REFUSED'),{primaryError:primary,cleanupError:cleanup,code:selected?.code,
  ci1FailureCode:selected?.ci1FailureCode,ci1Facts:selected?.ci1Facts});
 error.edgeProbeFacts={edgeProbeReason:reason(selected),edgeProbePackage:bounded(facts.edgePackageOrdinal,100),
  edgeProbeVersionMajor:bounded(facts.edgeVersionMajor,1000000),edgeProbeVersionMinor:bounded(facts.edgeVersionMinor,1000000),edgeProbeVersionPatch:bounded(facts.edgeVersionPatch,1000000),
  edgeProbeStage:bounded(stage,10),edgeProbePrimaryReason:reason(primary),edgeProbePrimaryIO:io(primary),
  edgeProbeCleanupReason:reason(cleanup),edgeProbeCleanupIO:io(cleanup),edgeProbeRootRemoved:Number(rootRemoved===true),edgeProbeProcessReleased:Number(processReleased===true)};
 return error;
}
// Bind the exact freshly created private root. Never repair an arbitrary path,
// another owner/device, symlink, hardlinked file or replaced directory.
export function captureEdgeRoot(root,parent){
 check(process.platform==='linux'&&process.getuid?.()>0,'ENVELOPE');
 check(root===resolve(root)&&parent===resolve(parent)&&root.startsWith(parent+sep)&&realpathSync(parent)===parent,'CLEANUP_IDENTITY');
 const s=lstatSync(root);check(s.isDirectory()&&!s.isSymbolicLink()&&realpathSync(root)===root&&(s.mode&0o777)===0o700,'CLEANUP_IDENTITY');
 check(s.uid===process.getuid(),'OWNED_OWNER');return Object.freeze({root,parent,uid:s.uid,device:s.dev,inode:s.ino});
}
function edgeRootMatches(identity){
 const s=lstatSync(identity.root);check(s.isDirectory()&&!s.isSymbolicLink()&&realpathSync(identity.root)===identity.root
  &&identity.root.startsWith(identity.parent+sep)&&s.dev===identity.device&&s.ino===identity.inode,'CLEANUP_IDENTITY');
 check(s.uid===identity.uid&&identity.uid===process.getuid(),'OWNED_OWNER');
}
function scanEdgeRoot(identity){
 edgeRootMatches(identity);let bytes=0;const entries=[];
 const visit=path=>{const s=lstatSync(path);check(!s.isSymbolicLink(),'OWNED_LINK');check(s.uid===identity.uid,'OWNED_OWNER');check(s.dev===identity.device,'OWNED_DEVICE');
  check(entries.length<100000,'OWNED_ENTRIES');check(s.isDirectory()||s.isFile()&&s.nlink===1,'OWNED_TYPE');
  entries.push({path,device:s.dev,inode:s.ino,mode:s.mode&0o7777,directory:s.isDirectory()});
  if(s.isDirectory())for(const name of readdirSync(path).sort())visit(join(path,name));else bytes+=s.blocks===undefined?s.size:s.blocks*512;
  check(Number.isSafeInteger(bytes)&&bytes<=1024**3,'OWNED_BOUND');};visit(identity.root);return{bytes,entries};
}
export function removeEdgeRoot(identity){
 // Validate the complete tree before the first chmod. Only directory owner
 // write/search bits change; file modes and every other permission stay intact.
 const before=scanEdgeRoot(identity);
 for(const entry of before.entries.filter(x=>x.directory)){
  edgeRootMatches(identity);const s=lstatSync(entry.path);check(s.isDirectory()&&!s.isSymbolicLink()&&s.uid===identity.uid&&s.dev===entry.device&&s.ino===entry.inode&&(s.mode&0o7777)===entry.mode,'OWNED_DRIFT');
  if((entry.mode&0o300)!==0o300)chmodSync(entry.path,entry.mode|0o300);
 }
 const after=scanEdgeRoot(identity);check(after.entries.length===before.entries.length,'OWNED_DRIFT');
 for(let i=0;i<before.entries.length;i++){const a=before.entries[i],b=after.entries[i];check(a.path===b.path&&a.device===b.device&&a.inode===b.inode&&a.directory===b.directory
  &&b.mode===(a.directory?a.mode|0o300:a.mode),'OWNED_DRIFT');}
 edgeRootMatches(identity);rmSync(identity.root,{recursive:true});check(!lstatSync(identity.root,{throwIfNoEntry:false}),'CLEANUP_IDENTITY');return true;
}
function edgeRootAbsent(root){try{return!lstatSync(root,{throwIfNoEntry:false});}catch{return false;}}
export function finishEdgeProbe(primary,identity,{stage,processReleased}){
 let cleanup=null;try{check(processReleased===true,'PROCESS_RELEASE');removeEdgeRoot(identity);}catch(error){cleanup=error;}
 const rootRemoved=edgeRootAbsent(identity.root);
 if(primary||cleanup)throw edgeProbeFailure(primary,cleanup,{stage:primary?stage:10,rootRemoved,processReleased});
 return{rootRemoved,processReleased};
}
// Actual POSIX control before the native download. UID0/Windows cannot prove
// the0555 failure. Deliberate errors remain synthetic, never business proof.
export function verifyEdgeCleanupControl(parent){
 check(process.platform==='linux'&&process.getuid?.()>0,'ENVELOPE');
 check(parent===resolve(parent)&&realpathSync(parent)===parent,'CLEANUP_IDENTITY');
 const root=mkdtempSync(join(parent,'edge-cleanup-control-')),identity=captureEdgeRoot(root,parent);let primary=null,cleanup=null;
 try{const directory=join(root,'readonly');mkdirSync(directory,{mode:0o700});writeFileSync(join(directory,'file'),'control',{flag:'wx',mode:0o400});chmodSync(directory,0o555);
  let denied=null;try{rmSync(root,{recursive:true});}catch(error){denied=error;}check(denied?.code==='EACCES'&&!edgeRootAbsent(root),'CLEANUP_CONTROL');
  const sentinel=Object.assign(Error('deliberate primary'),{code:'VERSION'}),combined=edgeProbeFailure(sentinel,denied,{stage:5,rootRemoved:false,processReleased:true});
  check(combined.primaryError===sentinel&&combined.cleanupError===denied&&combined.edgeProbeFacts.edgeProbePrimaryReason===reason(sentinel)
   &&combined.edgeProbeFacts.edgeProbeCleanupIO===1&&combined.edgeProbeFacts.edgeProbeRootRemoved===0,'CLEANUP_CONTROL');
  const onlyCleanup=edgeProbeFailure(null,denied,{stage:10,rootRemoved:false,processReleased:true});
  check(onlyCleanup.edgeProbeFacts.edgeProbePrimaryReason===0&&onlyCleanup.edgeProbeFacts.edgeProbeCleanupIO===1,'CLEANUP_CONTROL');
 }catch(error){primary=error;}
 try{removeEdgeRoot(identity);}catch(error){cleanup=error;}
 if(primary||cleanup)throw edgeProbeFailure(primary,cleanup,{stage:1,rootRemoved:edgeRootAbsent(root),processReleased:true});
 return{schemaVersion:'permission-edge-cleanup-control-v1',readOnlyDirectoryDenied:true,primaryPreserved:true,cleanupFailureSeparated:true,rootRemoved:true};
}
export function edgeNativeVersionMatches(output){
 // The release archive is v1.74.3 by SHA256. Its source CLI crate is0.1.0
 // and embedded deno crate2.1.4; the release tag is not its --version banner.
 return typeof output==='string'&&/^edge-runtime 0\.1\.0\ndeno 2\.1\.4 \(release, x86_64-unknown-linux-gnu\)$/.test(output.replaceAll('\r\n','\n').trim());
}
export function inspectEdgeNativeListing(text){
 check(typeof text==='string'&&text.length>0&&text.length<128*1024,'ARCHIVE_LIST');const seen=new Set();let bytes=0;
 for(const line of text.trim().split('\n')){
  const m=/^([-d])[rwxstST-]{9}\s+\S+\s+(\d+)\s+\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}\s+(\.\/(?:[A-Za-z0-9_.+-]+\/?)*?)\/?$/.exec(line);check(m,'ARCHIVE_ENTRY');
  const name=m[3].replace(/\/$/,'');check(!seen.has(name),'ARCHIVE_DUPLICATE');seen.add(name);
  check(name==='.'||/^(?:\.\/bin(?:\/(?:edge-runtime|\.edge-runtime-wrapped))?|\.\/lib(?:\/lib[A-Za-z0-9_.+-]+)?)$/.test(name),'ARCHIVE_PATH');
  check((['.','./bin','./lib'].includes(name))===(m[1]==='d'),'ARCHIVE_TYPE');bytes+=Number(m[2]);check(Number.isSafeInteger(bytes)&&bytes<=256*1024**2,'ARCHIVE_BOUND');
 }
 check(seen.has('./bin/edge-runtime')&&seen.has('./bin/.edge-runtime-wrapped'),'ARCHIVE_BINARY');return{entries:seen.size,unpackedBytes:bytes};
}
export async function runEdgeProbe(source,root,sourceSHA){
 source=resolve(source);root=resolve(root);const parent=resolve(process.env.TMPDIR??'');
 check(process.platform==='linux'&&process.arch==='x64'&&process.getuid?.()>0&&parent&&root.startsWith(parent+sep)&&root!==parent&&/^[a-f0-9]{40}$/.test(sourceSHA),'ENVELOPE');
 check(realpathSync(parent)===parent,'CLEANUP_IDENTITY');
 check(!lstatSync(root,{throwIfNoEntry:false}),'EXISTS');
 const manifest=JSON.parse(readFileSync(join(source,'tests/permissions/runtime/ci1-edge.json'))),inputs=assertEdgeResolution(join(source,'tests/permissions/runtime/edge-resolution'),manifest);
 mkdirSync(root,{mode:0o700});
 const identity=captureEdgeRoot(root,parent),children=new Set();
 const guard=()=>{scanEdgeRoot(identity);const disk=statfsSync(root);check(disk.bavail*disk.bsize>=30*1024**3,'FREE_SPACE');};
 const run=(command,args,env={})=>new Promise((done,reject)=>{
  guard();let output='',failure;const child=spawn(command,args,{cwd:root,env:{...process.env,...env},stdio:['ignore','pipe','pipe']});children.add(child);
  const stop=error=>{failure??=error;child.kill('SIGKILL');};const timer=setTimeout(()=>stop(Object.assign(Error('EDGE_PROBE_COMMAND_TIMEOUT'),{code:'COMMAND_TIMEOUT'})),120000);
  const interval=setInterval(()=>{try{guard();}catch(error){stop(error);}},500);
  const take=chunk=>{output+=chunk.toString();if(Buffer.byteLength(output)>128*1024)stop(Object.assign(Error('EDGE_PROBE_OUTPUT_BOUND'),{code:'OUTPUT_BOUND'}));};child.stdout.on('data',take);child.stderr.on('data',take);
  child.on('error',error=>{failure??=error;});child.on('close',(status,signal)=>{children.delete(child);clearTimeout(timer);clearInterval(interval);failure?reject(failure):done({status,signal,output});});
 });
 let result,primary=null,stage=1;
 try{
  guard();verifyEdgeCleanupControl(root);guard();stage=2;
  const archive=join(root,'edge.tar.gz'),fd=openSync(archive,'wx',0o600),hash=createHash('sha256');let bytes=0,last=0;
  try{const response=await fetch(EDGE_NATIVE.url,{signal:AbortSignal.timeout(120000)});check(response.ok,'DOWNLOAD_HTTP');
   for await(const chunk of response.body){bytes+=chunk.length;check(bytes<=EDGE_NATIVE.bytes,'DOWNLOAD_BOUND');hash.update(chunk);writeSync(fd,chunk);if(Date.now()-last>500){guard();last=Date.now();}}
  }finally{closeSync(fd);}
  check(bytes===EDGE_NATIVE.bytes&&hash.digest('hex')===EDGE_NATIVE.sha256,'DOWNLOAD_HASH');
  stage=3;const listing=await run('tar',['-tvf',archive,'--numeric-owner','--utc']);check(listing.status===0,'ARCHIVE_COMMAND');inspectEdgeNativeListing(listing.output);
  stage=4;
  const runtime=join(root,'runtime');mkdirSync(runtime);const extract=await run('tar',['-xzf',archive,'--no-same-owner','--no-same-permissions','-C',runtime]);check(extract.status===0,'EXTRACT');rmSync(archive);
  stage=5;const binary=join(runtime,'bin/edge-runtime'),version=await run(binary,['--version']);check(version.status===0&&edgeNativeVersionMatches(version.output),'VERSION');stage=6;
  const functions=join(root,'functions');cpSync(join(source,'supabase/functions'),functions,{recursive:true,errorOnExist:true,force:false});installEdgeResolution(source,functions,manifest);
  const cache=join(root,'cache');mkdirSync(cache);const env={DENO_DIR:cache,DENO_NO_PACKAGE_JSON:'1',HOME:root};
  stage=7;for(const name of ['menu-image-public','menu-image-gateway']){assertEdgeResolution(functions,manifest);
   const bundle=await run(binary,['bundle','--import-map',join(functions,'deno.json'),'--entrypoint',join(functions,name,'index.ts'),'--output',join(root,name+'.eszip')],env);
   check(bundle.status===0,'BUNDLE');assertEdgeResolution(functions,manifest);
  }
  stage=8;const proof=ci1EdgeCacheProof(cache,manifest),closure=new Set([...proof.observed,...proof.metadataOnly]);check(closure.size===20&&manifest.packages.every(p=>closure.has(`${p.name}@${p.version}`)),'CACHE_CLOSURE');stage=9;
  // This control deliberately bypasses our input admission to prove that the
  // actual native resolver reads lock integrity. Its cache is fresh and private.
  const bad=join(root,'bad-functions');cpSync(functions,bad,{recursive:true});const badLock=JSON.parse(readFileSync(join(bad,'deno.lock')));
  const old=badLock.npm[manifest.root].integrity;badLock.npm[manifest.root].integrity=old.slice(0,7)+(old[7]==='A'?'B':'A')+old.slice(8);
  // cp preserves readonly mode; replacing this one owned copy is intentional.
  rmSync(join(bad,'deno.lock'));writeFileSync(join(bad,'deno.lock'),JSON.stringify(badLock));const badCache=join(root,'bad-cache');mkdirSync(badCache);
  const negative=await run(binary,['bundle','--import-map',join(bad,'deno.json'),'--entrypoint',join(bad,'menu-image-public/index.ts'),'--output',join(root,'must-not-pass.eszip')],{...env,DENO_DIR:badCache});
  check(negative.status!==0&&negative.status!==null&&!negative.signal&&/integrity|checksum/i.test(negative.output),'BAD_SRI_CONTROL');
  result={schemaVersion:'permission-edge-resolution-v1',sourceSHA,scope:'NATIVE_RESOLVER_ONLY',...inputs,cacheSHA256:proof.sha256,observed:proof.observed.length,metadataOnly:proof.metadataOnly.length,warmBundles:2,runtimeBadSRIControls:1};
 }catch(error){primary=error;}
 const lifecycle=finishEdgeProbe(primary,identity,{stage,processReleased:children.size===0});
 return publicEdgeResolution({...result,...lifecycle},sourceSHA);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{const [source,root,sourceSHA]=process.argv.slice(2);const receipt=await runEdgeProbe(source,root,sourceSHA);console.log('PERMISSION_EDGE_RESOLUTION '+JSON.stringify(receipt));}
 catch(error){console.error('PERMISSION_EDGE_PROBE_FAILURE '+JSON.stringify(error.edgeProbeFacts??edgeProbeFailure(error,null,{stage:0,rootRemoved:false,processReleased:false}).edgeProbeFacts));process.exitCode=1;}
}
