import test from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';import{basename}from'node:path';import{runInNewContext}from'node:vm';
import{pullPinnedImage,imagePullRegistryOrdinal,dockerFailureFacts,DOCKER_DIAGNOSTIC_BOUNDS}from'./permission-runtime-image-pull.mjs';
import*as ci1 from'./permission-ci1-worker.mjs';import*as t04 from'./permission-runtime-t04-worker.mjs';import*as service from'./permission-runtime-service-worker.mjs';
const modules=[ci1,t04,service],paths=['permission-ci1-worker.mjs','permission-runtime-t04-worker.mjs','permission-runtime-service-worker.mjs'];
const reference='public.ecr.aws/supabase/postgres-meta@sha256:'+'a'.repeat(64),primary=reference.replace('public.ecr.aws/','ghcr.io/');
test('all three runtime workers use one transport and preserve the exact digest/platform on the new primary',async()=>{
 for(const module of modules){assert.equal(module.ci1PullImage,pullPinnedImage);const calls=[];
  assert.equal(await module.ci1PullImage((command,args)=>calls.push([command,args]),reference),primary);
  assert.deepEqual(calls,[['docker',['pull','--quiet','--platform','linux/amd64',primary]]]);}
});
test('unknown Docker, network, integrity and auth failures stop after one call without retry or alternate',async()=>{
 for(const code of [undefined,'DOCKER_NETWORK','DOCKER_NO_SPACE','DOCKER_TLS','DOCKER_REGISTRY_AUTH','DOCKER_REGISTRY_NOT_FOUND']){
  let calls=0;const error=Object.assign(Error('PRIVATE_SECRET'),{ci1FailureCode:code});
  await assert.rejects(pullPinnedImage(()=>{calls++;throw error;},reference,()=>{},()=>assert.fail('no wait')),e=>e===error);assert.equal(calls,1);
 }
});
test('registry ordinals keep ECR1/GHCR2 even though the primary changed',()=>{
 assert.deepEqual([1,2,3,4].map(imagePullRegistryOrdinal),[2,2,2,1]);
 for(const bad of [0,5,1.5,'1',null])assert.throws(()=>imagePullRegistryOrdinal(bad));
});
test('Docker error facts expose finite categories/status/counts while signed URLs and stderr remain private',()=>{
 const samples=[['Get "https://registry.invalid/?signed=PRIVATE_SECRET": EOF',1,0],['connection reset by peer',2,0],
  ['net/http: request canceled while waiting for connection (Client.Timeout exceeded)',3,0],['unexpected status code: 503 Service Unavailable PRIVATE_SECRET',4,503],
  ['digest mismatch PRIVATE_SECRET',5,0],['no matching manifest for linux/amd64',6,0],['requested access to the resource is denied: PRIVATE_SECRET',7,0],
  ['error response from daemon: opaque PRIVATE_SECRET',8,0],['opaque PRIVATE_SECRET',0,0]];
 for(const [text,kind,status]of samples){const facts=dockerFailureFacts(text);assert.equal(facts.dockerFailureKindOrdinal,kind);assert.equal(facts.dockerFailureHttpStatus,status);
  assert.equal(facts.dockerFailureObserved,1);assert.equal(facts.dockerFailureStderrBytes,Buffer.byteLength(text));assert(!JSON.stringify(facts).includes('PRIVATE_SECRET'));}
 assert.equal(dockerFailureFacts('status code: 404 missing; HTTP/1.1 503 unavailable').dockerFailureHttpStatus,0);
 assert.equal(dockerFailureFacts('https://registry.invalid/503?PRIVATE_SECRET').dockerFailureHttpStatus,0);
});
test('missing and oversized private buffers get explicit bounded observation states',()=>{
 assert.equal(dockerFailureFacts(undefined).dockerFailureObserved,0);
 assert.equal(dockerFailureFacts(Buffer.from('unexpected EOF')).dockerFailureKindOrdinal,1);
 for(const input of ['x'.repeat(1048577),Buffer.alloc(1048577)])assert.deepEqual(dockerFailureFacts(input),{
  dockerFailureObserved:2,dockerFailureKindOrdinal:0,dockerFailureHttpStatus:0,dockerFailureStderrBytes:1048577});
});
test('actual worker command adapters attach bounded facts only to image pulls, leaving private SQL stderr unprojected',()=>{
 paths.forEach((path,index)=>{
  const source=readFileSync(new URL('./'+path,import.meta.url),'utf8'),start=source.indexOf('function commandRunner('),end=source.indexOf('\n}\n',start)+3;
  assert(start>=0&&end>start);let captured;
  const context={basename,CI1_SETUP:{commandTimeoutMs:1000},failureCommands:['docker'],ci1DockerFailureCode:modules[index].ci1DockerFailureCode,
   ci1UnmountFailureCode:()=>null,dockerFailureFacts,t04CommandOptions:options=>options,
   execFileSync:()=>{captured=Object.assign(Error('PRIVATE_SECRET'),{stderr:'unexpected status code: 502 Bad Gateway'});throw captured;}};
  runInNewContext(source.slice(start,end)+'\nthis.runner=commandRunner;',context);
  assert.throws(()=>context.runner({},()=>{})('docker',['pull',reference]),e=>e===captured);
  assert.equal(captured.ci1Facts.dockerFailureHttpStatus,502);
  assert.throws(()=>context.runner({},()=>{})('docker',['exec','private-sql']),e=>e===captured);assert.equal(captured.ci1Facts,undefined);
 });
});
test('each final public exporter rejects malformed or out-of-range Docker metrics independently',()=>{
 const facts=dockerFailureFacts('unexpected EOF'),failure={stage:'offline-edge',operation:'IMAGE_PULL',code:'COMMAND_FAILED',command:'docker',exitCode:1,facts};
 for(const module of modules){assert.deepEqual(module.ci1FailureExport(failure),failure);
  for(const [key,[min,max]]of Object.entries(DOCKER_DIAGNOSTIC_BOUNDS))for(const value of [min-1,max+1,0.5,'1'])
   assert.notDeepEqual(module.ci1FailureExport({...failure,facts:{...facts,[key]:value}}).facts,{...facts,[key]:value});
  assert(!JSON.stringify(module.ci1FailureExport({...failure,facts:{...facts,raw:'PRIVATE_SECRET'}})).includes('SECRET'));
 }
});
