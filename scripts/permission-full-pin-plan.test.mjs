import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {planPin19,pin19Bounds,parseText,PIN19_PINS as P,PIN19_ERRORS as E,PIN19_INTERFACE as S} from './permission-full-pin-plan.mjs';
const manifest=readFileSync(new URL('../tests/permissions/full-pin19-cases.json',import.meta.url),'utf8');
const inventory=readFileSync(new URL('../tests/permissions/prep-pin-source-inventory.json',import.meta.url),'utf8');
const catalog=readFileSync(new URL('../tests/permissions/prep-pin-output-catalog.json',import.meta.url),'utf8');
const alter=(text,fn)=>{const v=JSON.parse(text);fn(v);return JSON.stringify(v);};
const finite=fn=>assert.throws(fn,e=>e instanceof Error&&E.plan.includes(e.message));
test('19 cases preserve required subvariants and remain a partial STOP, never runtime evidence',()=>{
  const r=planPin19(manifest,inventory);assert.equal(r.caseCount,19);assert.equal(r.subvariantCount,183);assert.equal(r.manifestState,'PARTIAL');assert.equal(r.planDecision,'STOP');assert.equal(r.valid,false);assert.equal(r.execution,'NOT_RUN');assert.equal(r.effects,0);assert.equal(r.authentication,'NOT_PROVEN');assert.equal(r.manifestSha256,P.manifestSha256);assert(r.missingInputs.length>0);
});
test('bounds account all profiles and all failure/retained writers without substituting zero for unknown',()=>{
  const r=pin19Bounds(manifest,catalog);assert.equal(r.writers.length,72);assert.equal(r.knownMinimums.tc18RequiredFiles,47);for(const w of r.writers){assert.equal(w.maximumBytes,null);assert.equal(w.allocatedMaxBytes,null);assert.equal(w.placement,null);}assert.equal(r.planDecision,'STOP');
});
test('public schema descriptors cannot be mutated to disable validation',()=>{assert(Object.isFrozen(S));assert(Object.isFrozen(S.tc19Checks));assert(Object.isFrozen(S.enums.runtimeProfile));assert.throws(()=>S.tc19Checks.pop(),TypeError);});
test('objects, boxed strings, revocable proxies and getters are refused without traps or coercion',()=>{
  let calls=0;const evil=new Proxy({},{get(){calls++;throw Error('SECRET');},ownKeys(){calls++;throw Error('SECRET');},getPrototypeOf(){calls++;throw Error('SECRET');}});
  const getter={get x(){calls++;throw Error('SECRET');},toString(){calls++;throw Error('SECRET');}};
  const revoked=Proxy.revocable({},{});revoked.revoke();
  for(const x of [evil,getter,revoked.proxy,new String(manifest),null,1,()=>{},1n]){finite(()=>planPin19(x,inventory));finite(()=>planPin19(manifest,x));finite(()=>pin19Bounds(manifest,x));}assert.equal(calls,0);
});
test('duplicate escaped keys, syntax, fractional/unsafe integers and oversized/deep JSON refuse with finite codes',()=>{
  for(const x of ['{"a":1,"\\u0061":2}','{"a":1,}','[1,]','{"a":9007199254740992}','{"a":1.1}','{"a":-0}','{"a":1e400}','[NaN]','"\\ud800"','['.repeat(42)+'0'+']'.repeat(42),' '.repeat(262145)])finite(()=>parseText(x));
  assert.equal(parseText(' '.repeat(262143)+'0'),0);assert.equal(parseText('9007199254740991'),9007199254740991);
});
test('prototype-like duplicate keys cannot overwrite schema or mutate ambient Object.prototype',()=>{
  const r=parseText('{"__proto__":{"canary":true}}');assert.equal(Object.getPrototypeOf(r),null);assert.equal({}.canary,undefined);finite(()=>planPin19('{"__proto__":{},"__proto__":{}}',inventory));
});
for(const [name,value] of [
 ['empty object',{}],['data object',{a:1}],['null',null],['empty array',[]],['singleton array',['TC-PIN-01']],
 ['integer',1],['boolean true',true],['boolean false',false],
 ['proto key',JSON.parse('{"__proto__":{"id":"TC-PIN-01"}}')],['toString key',{toString:'TC-PIN-01'}],['valueOf key',{valueOf:'TC-PIN-01'}],['constructor key',{constructor:'TC-PIN-01'}]
])test('P-EVC-01 case ID '+name+' refuses before regex coercion',()=>{
  const malformed=alter(manifest,m=>m.cases[0].id=value);
  assert.throws(()=>planPin19(malformed,inventory),{name:'Error',message:'PIN_PLAN_TYPE'});
  assert.throws(()=>pin19Bounds(malformed,catalog),{name:'Error',message:'PIN_PLAN_TYPE'});
  assert.equal({}.id,undefined);
});
const mutations=[
 ['missing case',m=>m.cases.pop()],['duplicate case',m=>m.cases[1]=m.cases[0]],['extra case',m=>m.cases.push({id:'TC-PIN-20',subvariants:[]})],
 ['missing subvariant',m=>m.cases[0].subvariants.pop()],['duplicate subvariant',m=>m.cases[0].subvariants.push(m.cases[0].subvariants[0])],
 ['extra oracle field',m=>m.cases[0].subvariants[0].ignore=true],['close oracle without evidence',m=>m.cases[0].subvariants[0].closure='CLOSED'],
 ['changed fullName',m=>m.mappings[0].fullName+=' extra'],['dropped suite title',m=>{const t=m.mappings.find(t=>t.fullName?.includes(' > '));t.fullName=t.fullName.split(' > ').at(-1);}],
 ['wrong project',m=>m.mappings.find(t=>t.runner==='playwright').project='other'],['wrong config',m=>m.mappings[0].config.sha256='a'.repeat(64)],
 ['mixed runtime profile',m=>m.mappings[0].runtimeProfile='PIN_CANARY'],['unsafe path',m=>m.mappings[0].file='../outside.ts'],['Windows alias',m=>m.sources[0].path='scripts/CON.txt'],
 ['stale base',m=>m.baseCommit='0'.repeat(40)],['unknown key',m=>m.command='run'],['malformed mapping',m=>m.mappings[0]=null]
];
for(const [name,fn] of mutations)test(name+' fails closed',()=>finite(()=>planPin19(alter(manifest,fn),inventory)));
test('changed canonical hash or representation cannot be laundered through inventory',()=>{
  finite(()=>planPin19(manifest,alter(inventory,i=>i.sources[0].sha256='f'.repeat(64))));finite(()=>planPin19(manifest,alter(inventory,i=>i.sources[0].representation='WORKTREE_CRLF')));
});
for(const [name,fn] of [
 ['drop failure writer',c=>c.writers.splice(c.writers.findIndex(w=>w.kind==='failure-path'),1)],['fake zero bound',c=>c.writers[0].maximumBytes=0],['fake measured cap',c=>{c.writers[0].state='BOUNDED';c.writers[0].maximumBytes=4096;}],['drop retention',c=>c.writers=c.writers.filter(w=>w.kind!=='retention')],['wrong placement',c=>c.writers[0].placement='D:/tmp'],['overflow',c=>c.writers[0].allocatedMaxBytes=Number.MAX_SAFE_INTEGER+1]
])test(name+' is not runtime admission',()=>finite(()=>pin19Bounds(manifest,alter(catalog,fn))));
