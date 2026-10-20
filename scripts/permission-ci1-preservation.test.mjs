import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ci1PreservationSurfaces,ci1CatalogFailureMarker,ci1CatalogFailureFacts,CI1_CATALOG_DIAGNOSTIC_BOUNDS} from './permission-ci1-preservation.mjs';
import {ci1HarnessFailureFacts} from './permission-ci1-harness.mjs';
import {ci1FailureExport,ci1IsolatedFailure} from './permission-runtime-t04-worker.mjs';
import {ci1Identity} from './permission-ci1-policy.mjs';

function relation(){
  // Real source counterexample:001 declares14 columns;008 drops3,7,8.
  const source=readFileSync(new URL('../supabase/migrations/001_schema_enums.sql',import.meta.url),'utf8');
  const block=source.split('create table public.option_groups (')[1].split('\n);')[0];
  const names=[...block.matchAll(/^  ([a-z_]+) (?:uuid|text|integer|boolean|timestamptz|public\.option_select_type)\b/gm)].map(m=>m[1]);
  assert.equal(names.length,14);
  const migration=readFileSync(new URL('../supabase/migrations/008_modifier_rework.sql',import.meta.url),'utf8');
  const dropped=[...migration.matchAll(/alter table public\.option_groups drop column if exists ([a-z_]+);/g)].map(m=>m[1]);
  assert.deepEqual(dropped,['menu_item_id','min_select','max_select']);
  return {surfaceId:'SELECT:public.option_groups',schema:'public',object:'option_groups',kind:'SELECT',evidence:'catalog',
    relation:{schema:'public',object:'option_groups',owner:'postgres',aclHash:'acl'},observedGrants:[{granted:false}],
    columns:names.map((column,index)=>({schema:'public',object:'option_groups',column,ordinal:index+1,type:'text',notNull:false,
      identity:'',generated:'',collation:null,defaultHash:'default',aclHash:'acl',observerCanSelect:true})).filter(c=>!dropped.includes(c.column))};
}
test('logical dump compaction of actual dropped columns preserves the visible schema without mutating inventory',()=>{
  const before=[relation()],original=structuredClone(before),after=structuredClone(before);
  after[0].columns.forEach((column,index)=>column.ordinal=index+1);
  assert.notDeepEqual(before,after);assert.deepEqual(ci1PreservationSurfaces(before),ci1PreservationSurfaces(after));
  assert.deepEqual(before,original);assert.equal(before[0].columns.find(c=>c.column==='name').ordinal,4);
  assert.equal(ci1PreservationSurfaces(before)[0].columns.find(c=>c.column==='name').ordinal,3);
});
test('visible column order, membership, all other column fields, ACL and effective grants remain strict',()=>{
  const before=[relation()],baseline=ci1PreservationSurfaces(before);
  const change=fn=>{const after=structuredClone(before);fn(after[0]);assert.notDeepEqual(ci1PreservationSurfaces(after),baseline);};
  change(row=>{[row.columns[0].ordinal,row.columns[1].ordinal]=[row.columns[1].ordinal,row.columns[0].ordinal];});
  change(row=>row.columns.reverse());change(row=>row.columns.pop());
  change(row=>row.columns.push({...row.columns[0],column:'added',ordinal:15}));
  for(const [key,value] of Object.entries({type:'integer',notNull:true,identity:'a',generated:'s',collation:'C',defaultHash:'new',aclHash:'new',observerCanSelect:false}))
    change(row=>row.columns[0][key]=value);
  change(row=>row.relation.aclHash='new');change(row=>row.observedGrants[0].granted=true);
});
test('malformed or duplicate physical positions/names cannot become a logical preservation baseline',()=>{
  for(const update of [row=>row.columns[0].ordinal=0,row=>row.columns[0].ordinal=1.5,row=>row.columns[0].ordinal=32768,
    row=>row.columns[1].ordinal=row.columns[0].ordinal,row=>row.columns[1].column=row.columns[0].column,
    row=>delete row.columns[0].ordinal,row=>row.columns[0].schema='private',row=>row.columns[0].object='other']){
    const rows=[relation()];update(rows[0]);assert.throws(()=>ci1PreservationSurfaces(rows));
  }
});
test('catalog diagnostics identify fields and source identity only as bounded numbers, never raw private values',()=>{
  const before=ci1PreservationSurfaces([relation()]);before.push({surfaceId:'static:SELECT:public.option_groups',kind:'SELECT',schema:'public',object:'option_groups',evidence:'static'});
  const after=structuredClone(before);after[0].columns[0].defaultHash='PRIVATE_SECRET';after[0].relation.aclHash='OTHER_SECRET';
  const marker=ci1CatalogFailureMarker(before,after),facts=ci1CatalogFailureFacts(marker);
  assert.equal(facts.t04CatalogDriftMask,34);assert.equal(facts.t04CatalogChanged,1);assert.equal(facts.t04CatalogRelationFieldMask,512);
  assert.equal(facts.t04CatalogColumnFieldMask,512);assert.equal(facts.t04CatalogFirstStaticOrdinal,1);
  assert.deepEqual(ci1HarnessFailureFacts(marker),facts);assert(!marker.includes('SECRET'));
  assert.equal(ci1CatalogFailureMarker(before,before),null);
  assert.equal(ci1CatalogFailureMarker([...before,before[0]],after),null);
});
test('catalog marker parser and final T04 exporter independently refuse unbounded or reflected facts',()=>{
  const before=ci1PreservationSurfaces([relation()]),after=structuredClone(before);after[0].columns[0].type='changed';
  const marker=ci1CatalogFailureMarker(before,after),facts=ci1CatalogFailureFacts(marker);
  const failure={stage:'offline-edge',operation:'PILOT_HARNESS',code:'COMMAND_FAILED',command:'node',exitCode:1,facts};
  const sourceSHA='a'.repeat(40),receipt=value=>({schemaVersion:'permission-ci1-isolated-failure-v1',runId:'123',attempt:1,sourceSHA,failure:value,cleanupFailure:null});
  assert.deepEqual(ci1FailureExport(failure),failure);assert(ci1IsolatedFailure(receipt(failure),ci1Identity('123',1),sourceSHA));
  for(const invalid of [marker+' PRIVATE_SECRET',marker+'\n'+marker,marker.replace('CI1_CATALOG_FAILURE 32','CI1_CATALOG_FAILURE 032')])assert.deepEqual(ci1CatalogFailureFacts(invalid),{});
  for(const [key,[min,max]] of Object.entries(CI1_CATALOG_DIAGNOSTIC_BOUNDS))for(const n of [min-1,max+1,0.5]){
    const wrong={...failure,facts:{...facts,[key]:n}};assert.notDeepEqual(ci1FailureExport(wrong),wrong);
    assert.throws(()=>ci1IsolatedFailure(receipt(wrong),ci1Identity('123',1),sourceSHA));
    const numbers=Object.keys(CI1_CATALOG_DIAGNOSTIC_BOUNDS).map(k=>wrong.facts[k]);
    assert.deepEqual(ci1CatalogFailureFacts('CI1_CATALOG_FAILURE '+numbers.join(' ')),{});
  }
});
