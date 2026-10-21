// Only the owned disposable Linux CI task executes the native artifact.
import {readFileSync,writeFileSync,openSync,closeSync,writeSync,mkdirSync,lstatSync,readdirSync,statfsSync,rmSync,cpSync}from'node:fs';
import {resolve,join,sep}from'node:path';import{pathToFileURL}from'node:url';import{createHash}from'node:crypto';import{spawn}from'node:child_process';
import {assertEdgeResolution,installEdgeResolution,publicEdgeResolution}from'./permission-edge-resolution.mjs';
import {ci1EdgeCacheProof}from'./permission-runtime-t04-worker.mjs';
export const EDGE_NATIVE=Object.freeze({url:'https://github.com/supabase/edge-runtime/releases/download/v1.74.3/edge-runtime-v1.74.3-x86_64-linux.tar.gz',bytes:82997085,sha256:'8b5a0f998a552d80690136de969eaa7ab15175509684a5598a97629afa243db1'});
const check=(ok,code='INPUT')=>{if(!ok)throw Object.assign(Error('EDGE_PROBE_REFUSED'),{code});};
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
function ownedBytes(root){let bytes=0,entries=0;const visit=path=>{const s=lstatSync(path);check(!s.isSymbolicLink(),'OWNED_LINK');check(++entries<=100000,'OWNED_ENTRIES');if(s.isDirectory())for(const n of readdirSync(path))visit(join(path,n));else{check(s.isFile()&&s.nlink===1,'OWNED_TYPE');bytes+=s.blocks===undefined?s.size:s.blocks*512;}};visit(root);return bytes;}
export async function runEdgeProbe(source,root,sourceSHA){
 source=resolve(source);root=resolve(root);const parent=resolve(process.env.TMPDIR??'');
 check(process.platform==='linux'&&process.arch==='x64'&&parent&&root.startsWith(parent+sep)&&root!==parent&&/^[a-f0-9]{40}$/.test(sourceSHA),'ENVELOPE');
 check(!lstatSync(root,{throwIfNoEntry:false}),'EXISTS');
 const manifest=JSON.parse(readFileSync(join(source,'tests/permissions/runtime/ci1-edge.json'))),inputs=assertEdgeResolution(join(source,'tests/permissions/runtime/edge-resolution'),manifest);
 mkdirSync(root,{mode:0o700});
 const guard=()=>{check(ownedBytes(root)<=1024**3,'OWNED_BOUND');const disk=statfsSync(root);check(disk.bavail*disk.bsize>=30*1024**3,'FREE_SPACE');};
 const run=(command,args,env={})=>new Promise((done,reject)=>{
  guard();let output='',failure;const child=spawn(command,args,{cwd:root,env:{...process.env,...env},stdio:['ignore','pipe','pipe']});
  const stop=error=>{failure??=error;child.kill('SIGKILL');};const timer=setTimeout(()=>stop(Error('EDGE_PROBE_COMMAND_TIMEOUT')),120000);
  const interval=setInterval(()=>{try{guard();}catch(error){stop(error);}},500);
  const take=chunk=>{output+=chunk.toString();if(Buffer.byteLength(output)>128*1024)stop(Error('EDGE_PROBE_OUTPUT_BOUND'));};child.stdout.on('data',take);child.stderr.on('data',take);
  child.on('error',error=>{failure??=error;});child.on('close',(status,signal)=>{clearTimeout(timer);clearInterval(interval);failure?reject(failure):done({status,signal,output});});
 });
 let result;
 try{
  const archive=join(root,'edge.tar.gz'),fd=openSync(archive,'wx',0o600),hash=createHash('sha256');let bytes=0,last=0;
  try{const response=await fetch(EDGE_NATIVE.url,{signal:AbortSignal.timeout(120000)});check(response.ok,'DOWNLOAD_HTTP');
   for await(const chunk of response.body){bytes+=chunk.length;check(bytes<=EDGE_NATIVE.bytes,'DOWNLOAD_BOUND');hash.update(chunk);writeSync(fd,chunk);if(Date.now()-last>500){guard();last=Date.now();}}
  }finally{closeSync(fd);}
  check(bytes===EDGE_NATIVE.bytes&&hash.digest('hex')===EDGE_NATIVE.sha256,'DOWNLOAD_HASH');
  const listing=await run('tar',['-tvf',archive,'--numeric-owner','--utc']);check(listing.status===0,'ARCHIVE_COMMAND');inspectEdgeNativeListing(listing.output);
  const runtime=join(root,'runtime');mkdirSync(runtime);const extract=await run('tar',['-xzf',archive,'--no-same-owner','--no-same-permissions','-C',runtime]);check(extract.status===0,'EXTRACT');rmSync(archive);
  const binary=join(runtime,'bin/edge-runtime'),version=await run(binary,['--version']);check(version.status===0&&edgeNativeVersionMatches(version.output),'VERSION');
  const functions=join(root,'functions');cpSync(join(source,'supabase/functions'),functions,{recursive:true,errorOnExist:true,force:false});installEdgeResolution(source,functions,manifest);
  const cache=join(root,'cache');mkdirSync(cache);const env={DENO_DIR:cache,DENO_NO_PACKAGE_JSON:'1',HOME:root};
  for(const name of ['menu-image-public','menu-image-gateway']){assertEdgeResolution(functions,manifest);
   const bundle=await run(binary,['bundle','--import-map',join(functions,'deno.json'),'--entrypoint',join(functions,name,'index.ts'),'--output',join(root,name+'.eszip')],env);
   check(bundle.status===0,'BUNDLE');assertEdgeResolution(functions,manifest);
  }
  const proof=ci1EdgeCacheProof(cache,manifest),closure=new Set([...proof.observed,...proof.metadataOnly]);check(closure.size===20&&manifest.packages.every(p=>closure.has(`${p.name}@${p.version}`)),'CACHE_CLOSURE');
  // This control deliberately bypasses our input admission to prove that the
  // actual native resolver reads lock integrity. Its cache is fresh and private.
  const bad=join(root,'bad-functions');cpSync(functions,bad,{recursive:true});const badLock=JSON.parse(readFileSync(join(bad,'deno.lock')));
  const old=badLock.npm[manifest.root].integrity;badLock.npm[manifest.root].integrity=old.slice(0,7)+(old[7]==='A'?'B':'A')+old.slice(8);
  // cp preserves readonly mode; replacing this one owned copy is intentional.
  rmSync(join(bad,'deno.lock'));writeFileSync(join(bad,'deno.lock'),JSON.stringify(badLock));const badCache=join(root,'bad-cache');mkdirSync(badCache);
  const negative=await run(binary,['bundle','--import-map',join(bad,'deno.json'),'--entrypoint',join(bad,'menu-image-public/index.ts'),'--output',join(root,'must-not-pass.eszip')],{...env,DENO_DIR:badCache});
  check(negative.status!==0&&negative.status!==null&&!negative.signal&&/integrity|checksum/i.test(negative.output),'BAD_SRI_CONTROL');
  result={schemaVersion:'permission-edge-resolution-v1',sourceSHA,scope:'NATIVE_RESOLVER_ONLY',...inputs,cacheSHA256:proof.sha256,observed:proof.observed.length,metadataOnly:proof.metadataOnly.length,warmBundles:2,runtimeBadSRIControls:1};
 }finally{check(root.startsWith(parent+sep)&&lstatSync(root).isDirectory(),'CLEANUP_IDENTITY');rmSync(root,{recursive:true});}
 return publicEdgeResolution({...result,rootRemoved:!lstatSync(root,{throwIfNoEntry:false}),processReleased:true},sourceSHA);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{const [source,root,sourceSHA]=process.argv.slice(2);const receipt=await runEdgeProbe(source,root,sourceSHA);console.log('PERMISSION_EDGE_RESOLUTION '+JSON.stringify(receipt));}
 catch(error){const facts=error.ci1Facts??{},safe=(n,max)=>Number.isSafeInteger(n)&&n>=0&&n<=max?n:0;
  console.error('PERMISSION_EDGE_PROBE_FAILURE '+JSON.stringify({edgeProbeReason:['INPUT','ENVELOPE','EXISTS','ARCHIVE_LIST','ARCHIVE_ENTRY','ARCHIVE_DUPLICATE','ARCHIVE_PATH','ARCHIVE_TYPE','ARCHIVE_BOUND','ARCHIVE_BINARY','OWNED_LINK','OWNED_ENTRIES','OWNED_TYPE','OWNED_BOUND','FREE_SPACE','DOWNLOAD_HTTP','DOWNLOAD_BOUND','DOWNLOAD_HASH','ARCHIVE_COMMAND','EXTRACT','VERSION','BUNDLE','CACHE_CLOSURE','BAD_SRI_CONTROL','CLEANUP_IDENTITY','EDGE_CACHE_PIN','EDGE_CACHE_SRI','EDGE_CACHE_DEPENDENCIES','EDGE_RESOLUTION_INPUT'].indexOf(error.ci1FailureCode??error.code)+1,edgeProbePackage:safe(facts.edgePackageOrdinal,100),edgeProbeVersionMajor:safe(facts.edgeVersionMajor,1000000),edgeProbeVersionMinor:safe(facts.edgeVersionMinor,1000000),edgeProbeVersionPatch:safe(facts.edgeVersionPatch,1000000)}));process.exitCode=1;}
}
