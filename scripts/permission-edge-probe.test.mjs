import test from'node:test';import assert from'node:assert/strict';import{inspectEdgeNativeListing,runEdgeProbe,edgeNativeVersionMatches}from'./permission-edge-probe.mjs';
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
test('Edge failure facts survive parser and final CI exporter with bounded domains and no raw fields',()=>{
 const facts={edgeProbeReason:26,edgeProbePackage:9,edgeProbeVersionMajor:1,edgeProbeVersionMinor:6,edgeProbeVersionPatch:8};
 const line='PERMISSION_EDGE_PROBE_FAILURE '+JSON.stringify(facts),parsed=privateDiagnostics(line,null);
 assert.deepEqual(edgeProbeFailureMetrics(line),facts);assert.equal(parsed.metrics.edgeProbePackage,9);
 const binding={repository:'nguyentronglinh045/pos-cafe',repositoryID:1263057386,event:'push',sourceSHA:'a'.repeat(40),workflowSHA:'a'.repeat(40),prHeadSHA:null,runId:'123',attempt:1};
 const rows=PROJECT_PHASES.slice(0,PROJECT_PHASES.indexOf('edge-resolution')+1).map(id=>({id,status:id==='edge-resolution'?'FAIL':'PASS',elapsedMs:1,exitCode:id==='edge-resolution'?1:0,invocationSHA:'b'.repeat(64),reportSHA:null,diagnostic:id==='edge-resolution'?parsed:null}));
 const receipt=publicSummary(binding,rows,{source:'b'.repeat(64),lock:'c'.repeat(64)});
 assert.deepEqual(receipt.phases.at(-1).diagnostic.metrics,facts);
 for(const change of[x=>x.edgeProbePackage=101,x=>x.edgeProbeVersionPatch=-1,x=>x.raw='PRIVATE_SENTINEL']){const invalid={...facts};change(invalid);assert.deepEqual(edgeProbeFailureMetrics('PERMISSION_EDGE_PROBE_FAILURE '+JSON.stringify(invalid)),{});}
 assert.deepEqual(edgeProbeFailureMetrics(line+'\n'+line),{});
});
