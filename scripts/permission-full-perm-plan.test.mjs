import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { planPerm60, perm60Bounds, boundsTemplate, parseInput, errorCodes, INPUT_CAP } from './permission-full-perm-plan.mjs';

// IO is limited to this task's prepared public fixture snapshots.
// No runtime fixture, environment, application, config or dependency is imported.
const root = new URL('../tests/permissions/', import.meta.url);
const manifest = readFileSync(new URL('prep-perm-manifest.json',root),'utf8');
const inventory = readFileSync(new URL('prep-perm-source-inventory.json',root),'utf8');
const plan = planPerm60(manifest,inventory);
const mapText = JSON.stringify(plan.stageMap);
const asJson = value => JSON.stringify(value);
function stop(result,code) {
  assert.equal(result.modelDecision,'STOP'); assert.equal(result.valid,false);
  assert.ok(result.errors.includes(code),asJson(result.errors));
}

test('canonical plan preserves all 60 required cases, 726 occurrences and 27 stage/profile executions', () => {
  assert.equal(plan.modelDecision,'MATCH');
  const coverage=plan.coverage;
  assert.equal(coverage.cases.length,60);
  assert.deepEqual(coverage.cases.map(row => row.id),Array.from({length:60},(_,n) => 'TC'+String(n+1).padStart(2,'0')));
  assert.equal(coverage.cases.reduce((n,row) => n+row.variants.length,0),726);
  assert.equal(coverage.uniqueStageIdentities,649);
  assert.equal(plan.stageMap.stages.length,27);
  const profileCounts={}; for (const stage of plan.stageMap.stages) profileCounts[stage.runtimeProfile]=(profileCounts[stage.runtimeProfile]??0)+1;
  assert.deepEqual(profileCounts,{STATIC:4,PG16_T01:1,SUPABASE_T02:3,SUPABASE_T04:19});
  assert.ok(coverage.cases.every(row => row.status === 'REQUIRED' && row.sourceHints.length));
  const reused=coverage.cases.flatMap(row => row.variants).map(row => asJson([row.stage,row.file,row.name,row.project]));
  assert.ok(new Set(reused).size < reused.length); // shared tests satisfy several cases, not extra actual runs
  for (const stage of plan.stageMap.stages) {
    assert.match(stage.configuration.sha256,/^[a-f0-9]{64}$/);
    assert.equal(stage.recipe.selection,'FULL_FILES_NO_GREP');
    assert.ok(stage.helpers.length);
    if (stage.executionKind === 'service') assert.ok(stage.sourceRefs.length);
    assert.equal(stage.required.length,new Set(stage.required.map(row => asJson([row.file,row.name,row.project]))).size);
  }
  const tc53=coverage.cases.find(row => row.id === 'TC53');
  assert.deepEqual(tc53.variants.map(row => row.stage),['rollback-additive-database','rollback-preflight-database','rollback-recovery-database']);
  assert.ok(plan.stageMap.stages.filter(row => row.runtimeProfile === 'SUPABASE_T04').every(row => row.physicalGroup === 'SUPABASE_T04'));
  for (const field of ['execution','runtimeAdmission','fullGate','custodyObserved']) assert.equal(plan[field],'NOT_RUN');
  assert.equal(plan.authentication,'NOT_PROVEN'); assert.equal(plan.valid,false); assert.equal(plan.effects,0);
  assert.ok(Buffer.byteLength(mapText) <= INPUT_CAP);
});

test('wrong bytes, dropped/swapped names, duplicate case and missing TC53 mapping cannot rewrite pinned acceptance', () => {
  const mutators=[m => m.cases.pop(),m => m.cases[0].variants[0].name+='!',
    m => m.cases[1].id='TC01',m => m.cases.find(row => row.id === 'TC53').variants.pop(),
    m => m.cases[0].status='PENDING_T16',m => m.cases[0].variants[0].stage='candidate-e2e',
    m => m.cases[0].variants[0].project='other',m => m.cases[0].sourceHints=[]];
  for (const mutate of mutators) { const m=JSON.parse(manifest); mutate(m); stop(planPerm60(asJson(m),inventory),'PERM_PLAN_MANIFEST'); }
  stop(planPerm60(manifest.replace('\n','\r\n'),inventory),'PERM_PLAN_MANIFEST');
  const source=JSON.parse(inventory);source.files[0].sha256='f'.repeat(64);
  stop(planPerm60(manifest,asJson(source)),'PERM_PLAN_SOURCE');
});

test('primitive boundary rejects hostile objects/functions/revoked proxies without traps', () => {
  let touched=0;
  const getter={get value(){touched++; throw new Error('secret');},toString(){touched++;return manifest;}};
  const proxy=new Proxy({}, {get(){touched++;throw new Error('secret');},getPrototypeOf(){touched++;throw new Error('secret');}});
  const revoked=Proxy.revocable({},{});revoked.revoke();
  for (const value of [getter,proxy,revoked.proxy,()=>manifest,null,7,new String(manifest),Symbol('secret')])
    stop(planPerm60(value,inventory),'PERM_PLAN_INPUT_TYPE');
  assert.equal(touched,0);
});

test('JSON scanner rejects escaped duplicate keys, overflow, prototypes, deep and malformed input; exact byte cap', () => {
  for (const value of ['{"x":1,"x":2}','{"x":1,"\\u0078":2}']) assert.throws(()=>parseInput(value),{code:'PERM_PLAN_DUPLICATE_KEY'});
  for (const value of ['{"__proto__":{}}','{"constructor":1}']) assert.throws(()=>parseInput(value),{code:'PERM_PLAN_SCHEMA'});
  for (const value of ['1e999','9007199254740992','[1,]','{"x":}','"\\ud800"','['.repeat(66)+']'.repeat(66)])
    assert.throws(()=>parseInput(value),{code:'PERM_PLAN_JSON'});
  assert.equal(parseInput('"'+'x'.repeat(INPUT_CAP-2)+'"').length,INPUT_CAP-2);
  assert.throws(()=>parseInput('"'+'x'.repeat(INPUT_CAP-1)+'"'),{code:'PERM_PLAN_INPUT_SIZE'});
  assert.throws(()=>parseInput('"'+'ế'.repeat(INPUT_CAP/2)+'"'),{code:'PERM_PLAN_INPUT_SIZE'});
  assert.ok(errorCodes().every(code => /^PERM_(PLAN|EVIDENCE)_[A-Z_]+$/.test(code)));
});

test('bounds retain every writer with null maxima and explicit missing owner/action instead of guessed fit', () => {
  const rows=boundsTemplate();assert.equal(rows.length,351);
  const result=perm60Bounds(mapText,asJson({version:'perm-output-catalog-v1',rows}));
  assert.equal(result.modelDecision,'STOP');assert.equal(result.missingInputs.length,351);
  assert.equal(result.aggregateMaximumBytes,null);assert.equal(result.quotaEnforced,false);
  assert.ok(result.rows.every(row => row.maximumBytes === null && row.maximumSeconds === null && row.state === 'UNKNOWN'));
  assert.ok(result.missingInputs.every(row => row.owner==='R' && row.nextAction));
});

test('an exact source hash with an impossible line cannot establish a writer maximum', () => {
  const source=JSON.parse(inventory).files.find(row => row.path === 'package-lock.json');
  const rows=boundsTemplate();
  Object.assign(rows[0],{state:'BOUNDED',maximumBytes:1,boundSource:{path:source.path,sha256:source.sha256,line:Number.MAX_SAFE_INTEGER},
    lifetime:{startSeconds:0,endSeconds:1},overlap:'SEQUENTIAL',placement:'OWNED_LOOP',maximumSeconds:1,unknownReason:null});
  stop(perm60Bounds(mapText,asJson({version:'perm-output-catalog-v1',rows})),'PERM_PLAN_BOUNDS');
});

test('even an existing source citation cannot admit unsupported BOUNDED claims in the initial pure contract', () => {
  const source=JSON.parse(inventory).files.find(row => row.path === 'package-lock.json');
  const rows=boundsTemplate();
  for (const row of rows) Object.assign(row,{state:'BOUNDED',maximumBytes:0,
    boundSource:{path:source.path,sha256:source.sha256,line:1},
    lifetime:{startSeconds:0,endSeconds:0},overlap:'SEQUENTIAL',placement:'OWNED_LOOP',maximumSeconds:1,unknownReason:null});
  stop(perm60Bounds(mapText,asJson({version:'perm-output-catalog-v1',rows})),'PERM_PLAN_BOUNDS');
  const unknown=boundsTemplate();
  unknown[0].boundSource={path:source.path,sha256:source.sha256,line:1};
  stop(perm60Bounds(mapText,asJson({version:'perm-output-catalog-v1',rows:unknown})),'PERM_PLAN_BOUNDS');
  const control=perm60Bounds(mapText,asJson({version:'perm-output-catalog-v1',rows:boundsTemplate()}));
  assert.equal(control.modelDecision,'STOP');assert.equal(control.boundsProvenance,'NOT_PROVEN');
  assert.equal(control.missingInputs.length,351);
  assert.ok(control.rows.every(row=>row.state==='UNKNOWN'&&row.maximumBytes===null&&row.boundSource===null));
  assert.equal(control.runtimeAdmission,'NOT_RUN');assert.equal(control.valid,false);
});

test('bounds reject dropped writer/retention/time, forged bounded source, overflow and stage-map config drift', () => {
  const mutateRows=[r=>r.pop(),r=>{r[0].maximumBytes=0;r[0].state='BOUNDED';r[0].unknownReason=null;},
    r=>delete r[0].lifetime,r=>r[0].maximumBytes=Number.MAX_SAFE_INTEGER+1,
    r=>r[1].id=r[0].id,r=>r[0].placement='D_DRIVE_IS_QUOTA',r=>r[0].runtimeProfile='candidate'];
  for (const mutate of mutateRows) { const rows=boundsTemplate();mutate(rows);
    const result=perm60Bounds(mapText,asJson({version:'perm-output-catalog-v1',rows}));
    assert.equal(result.modelDecision,'STOP');assert.ok(result.errors?.length); }
  const map=structuredClone(plan.stageMap);map.stages[0].configuration.sha256='0'.repeat(64);
  stop(perm60Bounds(asJson(map),asJson({version:'perm-output-catalog-v1',rows:[]})),'PERM_PLAN_STAGE_MAP');
  assert.ok(fileURLToPath(root).replaceAll('\\','/').endsWith('/tests/permissions/'));
});
