import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync,unlinkSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {expectedEdgeLock,EDGE_CONFIG,assertEdgeResolution,installEdgeResolution} from './permission-edge-resolution.mjs';
import{ci1EdgeBundleArguments as serviceArgs,ci1EdgeCacheProof as serviceProof}from'./permission-runtime-service-worker.mjs';
import{ci1EdgeBundleArguments as t04Args,ci1EdgeCacheProof as t04Proof}from'./permission-runtime-t04-worker.mjs';
const manifest=JSON.parse(readFileSync('tests/permissions/runtime/ci1-edge.json'));
const fixture=fn=>{const root=mkdtempSync(join(process.env.PERMISSION_STATIC_TEST_TMP??tmpdir(),'edge-lock-'));try{
 writeFileSync(join(root,'deno.json'),JSON.stringify(EDGE_CONFIG));writeFileSync(join(root,'deno.lock'),JSON.stringify(expectedEdgeLock(manifest)));return fn(root);
}finally{rmSync(root,{recursive:true,force:true});}};
test('reviewed lock pins all20packages and separates runtime Node types from ws types',()=>{
 const lock=expectedEdgeLock(manifest);assert.equal(Object.keys(lock.npm).length,20);
 assert.equal(lock.specifiers['npm:@types/node@*'],'22.5.4');
 assert.deepEqual(lock.npm['@types/ws@8.18.2'].dependencies,['@types/node@26.6.5']);
 assert.deepEqual(lock.npm['@types/node@22.5.4'].dependencies,['undici-types@6.19.8']);
 assert.deepEqual(lock.npm['@supabase/realtime-js@2.10.2'].dependencies.find(x=>x.startsWith('@types/phoenix@')),'@types/phoenix@1.6.7');
 assert.ok(lock.npm['@types/phoenix@1.6.7'].integrity.startsWith('sha512-'));
 assert.equal(assertEdgeResolution('tests/permissions/runtime/edge-resolution',manifest).packages,20);
});
test('missing lock, unknown version, changed integrity, missing edge and disabled lock refuse before resolver',()=>{
 for(const change of [x=>delete x.npm['@types/phoenix@1.6.7'],x=>x.npm['@types/phoenix@1.6.8']={integrity:'fake'},x=>x.npm['@types/phoenix@1.6.7'].integrity='fake',x=>x.npm['@supabase/realtime-js@2.10.2'].dependencies.pop(),x=>x.specifiers['npm:@types/node@*']='26.6.5'])fixture(root=>{
  const lock=expectedEdgeLock(manifest);change(lock);writeFileSync(join(root,'deno.lock'),JSON.stringify(lock));assert.throws(()=>assertEdgeResolution(root,manifest));
 });
 fixture(root=>{unlinkSync(join(root,'deno.lock'));assert.throws(()=>assertEdgeResolution(root,manifest));});
 fixture(root=>{writeFileSync(join(root,'deno.json'),JSON.stringify({lock:false}));assert.throws(()=>assertEdgeResolution(root,manifest));});
});
test('unresolved or ambiguous dependency fails rather than selecting latest',()=>{
 const copy=structuredClone(manifest);copy.packages.find(x=>x.name==='@supabase/realtime-js').dependencies.unknown='*';assert.throws(()=>expectedEdgeLock(copy));
});
test('runtime installation copies reviewed inputs once and refuses an existing config',()=>fixture(root=>{
 const target=join(root,'functions');mkdirSync(target);assert.deepEqual(installEdgeResolution(process.cwd(),target,manifest),assertEdgeResolution('tests/permissions/runtime/edge-resolution',manifest));
 assert.throws(()=>installEdgeResolution(process.cwd(),target,manifest));
}));
test('both runtime paths explicitly select reviewed config and reject the actual1.6.8 regression',()=>{
 const layout={volume:'/owned',identity:{runId:'123',attempt:1,unit:'owned.service'},edgeVolume:'owned-edge'};
 for(const args of [serviceArgs,t04Args]){const command=args(layout,'pinned','host','warm','menu-image-public',0);assert.equal(command[command.indexOf('--import-map')+1],'/owned/runtime/stack/supabase/functions/deno.json');}
 const registry='/cache/npm/registry.npmjs.org',folder=registry+'/@types/phoenix',map=new Map([[registry,['@types']],[registry+'/@types',['phoenix']],[folder,['registry.json','1.6.8']]]);
 const read={list:path=>map.get(path),stat:path=>({isDirectory:()=>Array.isArray(map.get(path)),isSymbolicLink:()=>false})};
 for(const proof of [serviceProof,t04Proof])assert.throws(()=>proof('/cache',manifest,read),error=>error.ci1FailureCode==='EDGE_CACHE_PIN'&&error.ci1Facts.edgePackageOrdinal===9&&error.ci1Facts.edgeVersionPatch===8);
});
