import test from'node:test';import assert from'node:assert/strict';
import{t04PartitionConstraintPlan}from'./permission-runtime-t04-partition.mjs';
const root={schema:'realtime',table:'messages',constraint:'messages_pkey',owner:'realtime_owner',kind:'p',local:true,inherited:0,
 parentSchema:null,parentTable:null,parentConstraint:null,tableKind:'p',tablePartition:false,parentAttached:true,childCount:1,
 definition:'PRIMARY KEY (id, inserted_at)',indexDefinition:'CREATE UNIQUE INDEX messages_pkey ON ONLY realtime.messages (id, inserted_at)',
 valid:true,ready:true,primary:true,unique:true,externalDependencies:false,extensionOwned:false};
const child={...root,table:'messages_1',constraint:'messages_1_pkey',local:false,inherited:1,parentSchema:'realtime',parentTable:'messages',parentConstraint:'messages_pkey',
 tableKind:'r',tablePartition:true,childCount:0,indexDefinition:'CREATE UNIQUE INDEX messages_1_pkey ON realtime.messages_1 (id, inserted_at)'};
function toc(rows){return rows.flatMap((r,i)=>[`${100+i}; 2606 ${200+i} CONSTRAINT ${r.schema} ${r.table} ${r.constraint} ${r.owner}`,
 `${300+i}; 1259 ${400+i} TABLE ${r.schema} ${r.table} ${r.owner}`]).join('\n')+'\n';}
test('partition pre-clean drops only the archived root using RESTRICT; order and recreated OIDs do not change logical checkpoint',()=>{
 const rows=[root,child],plan=t04PartitionConstraintPlan(rows,toc(rows));
 assert.equal(plan.dropSQL,'BEGIN; ALTER TABLE "realtime"."messages" DROP CONSTRAINT "messages_pkey" RESTRICT; COMMIT;');
 assert.deepEqual(t04PartitionConstraintPlan([...rows].reverse(),toc(rows).replaceAll('2606 2','2606 9')),plan);
 assert.equal(plan.topology.length,2);assert.equal(plan.dropSQL.includes('ONLY'),false);assert.equal(plan.dropSQL.includes('CASCADE'),false);
 const changed=t04PartitionConstraintPlan([root,{...child,definition:'PRIMARY KEY (inserted_at, id)'}],toc(rows));
 assert.notDeepEqual(changed.topology,plan.topology);
});
test('complete nested parent chains are accepted, missing parents and cycles are refused',()=>{
 const middle={...child,tableKind:'p',childCount:1},leaf={...child,table:'messages_2',constraint:'messages_2_pkey',parentTable:child.table,parentConstraint:child.constraint};
 const rows=[root,middle,leaf];assert.equal(t04PartitionConstraintPlan(rows,toc(rows)).topology.length,3);
 assert.throws(()=>t04PartitionConstraintPlan([root,leaf],toc(rows)));
 const cycle=[{...root,local:false,inherited:1,tablePartition:true,parentSchema:'realtime',parentTable:child.table,parentConstraint:child.constraint},child];
 assert.throws(()=>t04PartitionConstraintPlan(cycle,toc(cycle)));
});
test('external dependencies, extension ownership, drift and unbound archive entries are refused before any SQL',()=>{
 const rows=[root,child],archive=toc(rows);
 for(const delta of[{externalDependencies:true},{extensionOwned:true},{schema:'auth'},{owner:'unsafe name'},
  {kind:'u'},{local:true},{inherited:0},{parentAttached:false},{childCount:1},{childCount:129},{valid:false},{ready:false},{primary:false},{unique:false},
  {tablePartition:false},{definition:''},{indexDefinition:'x'.repeat(8193)},{extra:1},{constraint:'bad"; DROP SCHEMA auth;--'}])
  assert.throws(()=>t04PartitionConstraintPlan([root,{...child,...delta}],archive),JSON.stringify(delta));
 for(const bad of['',archive+archive,archive.replace('CONSTRAINT realtime messages_1','FK CONSTRAINT realtime messages_1'),
  archive.replace('TABLE realtime messages_1','VIEW realtime messages_1'),archive.replaceAll('realtime_owner','other_owner')])
  assert.throws(()=>t04PartitionConstraintPlan(rows,bad));
 assert.throws(()=>t04PartitionConstraintPlan([root,root,child],archive));
 assert.throws(()=>t04PartitionConstraintPlan([root],archive));
 assert.throws(()=>t04PartitionConstraintPlan(Array(129).fill(root),archive));
 const otherRoot={...root,table:'other',constraint:'other_pkey'},otherChild={...child,table:'other_1',constraint:'other_1_pkey',parentTable:'other',parentConstraint:'other_pkey'};
 const multiple=[root,child,otherRoot,otherChild];assert.throws(()=>t04PartitionConstraintPlan(multiple,toc(multiple)));
});
