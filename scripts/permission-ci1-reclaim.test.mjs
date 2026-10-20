import test from 'node:test';
import assert from 'node:assert/strict';
import {assertReclaimFacts} from './permission-ci1-reclaim.mjs';
const expected={runId:'123',attempt:1,sourceSHA:'a'.repeat(40),unit:'pos-cafe-ci1-r123-a1.service',workerSHA:'b'.repeat(64)};
const facts={rootOwned:true,controlOwned:true,imageOwned:true,imageLinks:1,imageBytes:18*1024**3,unitActiveState:'inactive',attachedLoops:0,ownedMounts:0};
test('reclaim admits only released, exact owned image and immutable run control',()=>assert.equal(assertReclaimFacts(facts,expected,expected),true));
test('reclaim refuses active runtime, mount/loop, shared inode, wrong owner or oversize',()=>{
  for(const change of [{unitActiveState:'active'},{unitActiveState:'deactivating'},{attachedLoops:1},{ownedMounts:1},
    {imageLinks:2},{imageOwned:false},{controlOwned:false},{rootOwned:false},{imageBytes:19*1024**3}]){
    assert.throws(()=>assertReclaimFacts({...facts,...change},expected,expected));
  }
});
test('reclaim cannot delete prior run, another attempt, source, unit or worker',()=>{
  for(const change of [{runId:'124'},{attempt:2},{sourceSHA:'c'.repeat(40)},{unit:'other'},{workerSHA:'c'.repeat(64)}]){
    assert.throws(()=>assertReclaimFacts(facts,{...expected,...change},expected));
  }
});
