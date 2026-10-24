import test from'node:test';import assert from'node:assert/strict';
import{mkdtempSync,mkdirSync,writeFileSync,lstatSync,readFileSync,unlinkSync,rmSync,chmodSync,symlinkSync,linkSync}from'node:fs';
import{join,resolve}from'node:path';import{tmpdir}from'node:os';
import{inspectEdgeNativeListing,runEdgeProbe,edgeNativeVersionMatches,edgeProbeFailure,captureEdgeRoot,removeEdgeRoot,finishEdgeProbe,verifyEdgeCleanupControl}from'./permission-edge-probe.mjs';
import{edgeProbeFailureMetrics}from'./permission-edge-resolution.mjs';import{privateDiagnostics,publicSummary,PROJECT_PHASES}from'./project-ci-results.mjs';
const listing='drwxr-xr-x 0/0 0 1970-01-01 00:00 ./\ndrwxr-xr-x 0/0 0 1970-01-01 00:00 ./bin/\n-rwxr-xr-x 0/0 456 1970-01-01 00:00 ./bin/edge-runtime\n-rwxr-xr-x 0/0 160063816 1970-01-01 00:00 ./bin/.edge-runtime-wrapped\ndrwxr-xr-x 0/0 0 1970-01-01 00:00 ./lib/\n-rwxr-xr-x 0/0 3230944 1970-01-01 00:00 ./lib/libstdc++.so.6\n';
test('native banner matches exact source crate versions while archive SHA pins the release tag',()=>{
 const actual='edge-runtime 0.1.0\ndeno 2.1.4 (release, x86_64-unknown-linux-gnu)\n';assert.equal(edgeNativeVersionMatches(actual),true);
 for(const wrong of [actual.replace('0.1.0','1.74.3'),actual.replace('2.1.4','2.1.5'),actual.replace('release','debug'),actual.replace('x86_64','aarch64')])assert.equal(edgeNativeVersionMatches(wrong),false);
});
test('native archive inspector bounds expanded data and rejects escaping paths, links, duplicates and missing executable',()=>{
 assert.equal(inspectEdgeNativeListing(listing).unpackedBytes,163295216);
 for(const invalid of [listing.replace('./lib/libstdc++.so.6','./lib/../../escape'),listing.replace('./lib/libstdc++.so.6','/tmp/escape'),listing.replace('-rwxr-xr-x 0/0 456','lrwxr-xr-x 0/0 456'),listing+listing.split('\n')[2]+'\n',listing.replace('160063816','999999999'),listing.replace('./bin/.edge-runtime-wrapped','./bin/unknown')])assert.throws(()=>inspectEdgeNativeListing(invalid));
});
test('native probe refuses platform/path envelope before download or data creation',async()=>{
 await assert.rejects(()=>runEdgeProbe(process.cwd(),process.cwd(),'a'.repeat(40)));
});
test('primary failure survives cleanup failure and successful cleanup with separate finite facts',()=>{
 const primary=Object.assign(Error('PRIVATE_PRIMARY_SENTINEL'),{code:'VERSION'}),cleanup=Object.assign(Error('PRIVATE_CLEANUP_SENTINEL'),{code:'EACCES'});
 const combined=edgeProbeFailure(primary,cleanup,{stage:5,rootRemoved:false,processReleased:true});
 assert.equal(combined.primaryError,primary);assert.equal(combined.cleanupError,cleanup);
 assert.equal(combined.edgeProbeFacts.edgeProbeReason,21);assert.equal(combined.edgeProbeFacts.edgeProbePrimaryReason,21);
 assert.equal(combined.edgeProbeFacts.edgeProbeCleanupReason,0);assert.equal(combined.edgeProbeFacts.edgeProbeCleanupIO,1);
 assert.equal(combined.edgeProbeFacts.edgeProbeStage,5);assert.equal(combined.edgeProbeFacts.edgeProbeRootRemoved,0);assert.equal(combined.edgeProbeFacts.edgeProbeProcessReleased,1);
 const preserved=edgeProbeFailure(primary,null,{stage:5,rootRemoved:true,processReleased:true});
 assert.equal(preserved.primaryError,primary);assert.equal(preserved.edgeProbeFacts.edgeProbePrimaryReason,21);
 assert.equal(preserved.edgeProbeFacts.edgeProbeCleanupIO,0);assert.equal(preserved.edgeProbeFacts.edgeProbeRootRemoved,1);
 const cleanupOnly=edgeProbeFailure(null,cleanup,{stage:10,rootRemoved:false,processReleased:true});
 assert.equal(cleanupOnly.primaryError,null);assert.equal(cleanupOnly.edgeProbeFacts.edgeProbePrimaryReason,0);assert.equal(cleanupOnly.edgeProbeFacts.edgeProbeCleanupIO,1);
 for(const error of[combined,preserved,cleanupOnly])assert.doesNotMatch(JSON.stringify(error.edgeProbeFacts),/PRIVATE_|SENTINEL|message|stack|path/);
});
test('IO ordinals and lifecycle facts fail closed without raw or invented success',()=>{
 for(const [code,ordinal]of[['EACCES',1],['EPERM',2],['ENOENT',3],['UNKNOWN_PRIVATE_CODE',0]]){
  const error=Object.assign(Error('PRIVATE_IO_SENTINEL'),{code}),failure=edgeProbeFailure(error,error,{stage:99,rootRemoved:'true',processReleased:1});
  assert.equal(failure.edgeProbeFacts.edgeProbePrimaryIO,ordinal);assert.equal(failure.edgeProbeFacts.edgeProbeCleanupIO,ordinal);
  assert.equal(failure.edgeProbeFacts.edgeProbeStage,0);assert.equal(failure.edgeProbeFacts.edgeProbeRootRemoved,0);assert.equal(failure.edgeProbeFacts.edgeProbeProcessReleased,0);
  assert.deepEqual(edgeProbeFailureMetrics('PERMISSION_EDGE_PROBE_FAILURE '+JSON.stringify(failure.edgeProbeFacts)),failure.edgeProbeFacts);
 }
});
test('actual0555 cleanup control requires Linux nonroot; other platforms prove refusal only',()=>{
 const parent=resolve(process.env.PERMISSION_STATIC_TEST_TMP??tmpdir());
 if(process.platform!=='linux'||!(process.getuid?.()>0)){
  assert.throws(()=>verifyEdgeCleanupControl(parent),error=>error.code==='ENVELOPE');return;
 }
 assert.deepEqual(verifyEdgeCleanupControl(parent),{schemaVersion:'permission-edge-cleanup-control-v1',readOnlyDirectoryDenied:true,primaryPreserved:true,cleanupFailureSeparated:true,rootRemoved:true});
});
test('owned cleanup refuses links and changed identity before repairing any directory',()=>{
 if(process.platform!=='linux'||!(process.getuid?.()>0)){
  assert.throws(()=>captureEdgeRoot(process.cwd(),resolve('..')),error=>error.code==='ENVELOPE');return;
 }
 const parent=resolve(process.env.PERMISSION_STATIC_TEST_TMP??tmpdir()),outer=mkdtempSync(join(parent,'edge-owner-test-'));
 const root=join(outer,'owned');mkdirSync(root,{mode:0o700});const identity=captureEdgeRoot(root,outer),directory=join(root,'readonly'),outside=join(outer,'outside');
 mkdirSync(directory,{mode:0o700});writeFileSync(join(directory,'file'),'owned',{mode:0o400});writeFileSync(outside,'preserved',{mode:0o600});chmodSync(directory,0o555);
 try{
  const primary=Object.assign(Error('PRIVATE_PRIMARY_SENTINEL'),{code:'VERSION'});
  assert.throws(()=>finishEdgeProbe(primary,identity,{stage:5,processReleased:false}),error=>error.primaryError===primary&&error.cleanupError.code==='PROCESS_RELEASE'
   &&error.edgeProbeFacts.edgeProbeRootRemoved===0&&error.edgeProbeFacts.edgeProbeProcessReleased===0);
  assert.equal(lstatSync(directory).mode&0o777,0o555);
  for(const binding of[{...identity,uid:identity.uid+1},{...identity,inode:identity.inode+1},{...identity,device:identity.device+1}]){
   assert.throws(()=>removeEdgeRoot(binding));assert.equal(lstatSync(directory).mode&0o777,0o555);assert.equal(lstatSync(root).isDirectory(),true);
  }
  const link=join(root,'link');symlinkSync(outside,link);assert.throws(()=>removeEdgeRoot(identity),error=>error.code==='OWNED_LINK');
  assert.throws(()=>finishEdgeProbe(primary,identity,{stage:5,processReleased:true}),error=>error.primaryError===primary&&error.cleanupError.code==='OWNED_LINK'
   &&error.edgeProbeFacts.edgeProbePrimaryReason===21&&error.edgeProbeFacts.edgeProbeCleanupReason===11&&error.edgeProbeFacts.edgeProbeRootRemoved===0);
  assert.equal(lstatSync(directory).mode&0o777,0o555);unlinkSync(link);
  linkSync(outside,link);assert.throws(()=>removeEdgeRoot(identity),error=>error.code==='OWNED_TYPE');assert.equal(lstatSync(directory).mode&0o777,0o555);unlinkSync(link);
  assert.equal(readFileSync(outside,'utf8'),'preserved');
  assert.throws(()=>finishEdgeProbe(primary,identity,{stage:5,processReleased:true}),error=>error.primaryError===primary&&error.cleanupError===null
   &&error.edgeProbeFacts.edgeProbePrimaryReason===21&&error.edgeProbeFacts.edgeProbeRootRemoved===1);
  assert.equal(lstatSync(root,{throwIfNoEntry:false}),undefined);assert.equal(readFileSync(outside,'utf8'),'preserved');
 }finally{if(lstatSync(root,{throwIfNoEntry:false}))removeEdgeRoot(identity);rmSync(outer,{recursive:true});}
});
test('Edge failure facts survive parser and final CI exporter with bounded domains and no raw fields',()=>{
 const facts={edgeProbeReason:26,edgeProbePackage:9,edgeProbeVersionMajor:1,edgeProbeVersionMinor:6,edgeProbeVersionPatch:8,
  edgeProbeStage:8,edgeProbePrimaryReason:26,edgeProbePrimaryIO:0,edgeProbeCleanupReason:0,edgeProbeCleanupIO:1,edgeProbeRootRemoved:0,edgeProbeProcessReleased:1};
 const line='PERMISSION_EDGE_PROBE_FAILURE '+JSON.stringify(facts),parsed=privateDiagnostics(line,null);
 assert.deepEqual(edgeProbeFailureMetrics(line),facts);assert.equal(parsed.metrics.edgeProbePackage,9);
 const binding={repository:'nguyentronglinh045/pos-cafe',repositoryID:1263057386,event:'push',sourceSHA:'a'.repeat(40),workflowSHA:'a'.repeat(40),prHeadSHA:null,runId:'123',attempt:1};
 const rows=PROJECT_PHASES.slice(0,PROJECT_PHASES.indexOf('edge-resolution')+1).map(id=>({id,status:id==='edge-resolution'?'FAIL':'PASS',elapsedMs:1,exitCode:id==='edge-resolution'?1:0,invocationSHA:'b'.repeat(64),reportSHA:null,diagnostic:id==='edge-resolution'?parsed:null}));
 const receipt=publicSummary(binding,rows,{source:'b'.repeat(64),lock:'c'.repeat(64)});
 assert.deepEqual(receipt.phases.at(-1).diagnostic.metrics,facts);
 for(const change of[x=>x.edgeProbePackage=101,x=>x.edgeProbeVersionPatch=-1,x=>x.edgeProbePrimaryIO=4,x=>x.edgeProbeCleanupReason=37,x=>x.edgeProbeRootRemoved=true,x=>delete x.edgeProbeProcessReleased,x=>x.raw='PRIVATE_SENTINEL']){const invalid={...facts};change(invalid);assert.deepEqual(edgeProbeFailureMetrics('PERMISSION_EDGE_PROBE_FAILURE '+JSON.stringify(invalid)),{});}
 assert.deepEqual(edgeProbeFailureMetrics(line+'\n'+line),{});
});
