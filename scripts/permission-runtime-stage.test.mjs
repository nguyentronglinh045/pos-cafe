import test from'node:test';import assert from'node:assert/strict';
import{runtimeApplicationRunId}from'./permission-runtime-stage.mjs';import{runtimeStageCatalog}from'./permission-runtime-catalog.mjs';
test('legacy application UUID contract is separate from numeric GitHub reporter identity; other stages retain original environment identity',()=>{
 const a=runtimeApplicationRunId('legacy-t01-database','39375275814'),b=runtimeApplicationRunId('legacy-t01-database','39375275814');
 const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
 assert.match(a,uuid);assert.match(b,uuid);assert.notEqual(a,b);
 for(const s of runtimeStageCatalog().filter(s=>s.stage!=='legacy-t01-database'))assert.equal(runtimeApplicationRunId(s.stage,'39375275814'),'39375275814');
 for(const id of['0','01','../x','393\n--x',a])assert.throws(()=>runtimeApplicationRunId('legacy-t01-database',id));
 assert.throws(()=>runtimeApplicationRunId('unknown','39375275814'));
});
