import test from'node:test';import assert from'node:assert/strict';
import{canonicalContainerMounts,containerContinuityHash}from'./permission-runtime-container-state.mjs';
test('unordered Docker mount maps retain all fields while canonical order ignores JSON key and mount iteration order',()=>{
 const c={Config:{Image:'pinned',Labels:{b:'2',a:'1'}},HostConfig:{ReadonlyRootfs:false},Mounts:[
  {Destination:'/b',Source:'/owned/b',Type:'volume',RW:true,Propagation:'rprivate'},
  {Destination:'/a',Source:'/owned/a',Type:'bind',RW:false,Propagation:'rprivate'}]};
 const p={Config:{Labels:{a:'1',b:'2'},Image:'pinned'},HostConfig:{ReadonlyRootfs:false},Mounts:c.Mounts.toReversed()};
 assert.equal(containerContinuityHash(c),containerContinuityHash(p));
 for(const mutate of[x=>x.Config.Image='other',x=>x.HostConfig.ReadonlyRootfs=true,x=>x.Mounts[0].RW=false,
  x=>x.Mounts[0].Source='/external',x=>x.Mounts[0].Propagation='shared',x=>x.Mounts[0].newField='changed']){
  const x=structuredClone(c);mutate(x);assert.notEqual(containerContinuityHash(x),containerContinuityHash(c));
 }
 assert.deepEqual(c.Mounts.map(m=>m.Destination),['/b','/a']);
});
test('duplicate or invalid destinations and unserializable container values fail closed',()=>{
 for(const value of[[{Destination:'/a'},{Destination:'/a'}],[{Destination:'relative'}],[{Destination:'/a\n'}],null])assert.throws(()=>canonicalContainerMounts(value));
 assert.throws(()=>containerContinuityHash({Config:{value:undefined},HostConfig:{},Mounts:[]}));
});
