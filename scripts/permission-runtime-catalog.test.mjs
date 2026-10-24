import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {runtimeStageCatalog,runtimeStage,runtimeStageCommand,runtimeConfigBinding} from './permission-runtime-catalog.mjs';

test('catalog retains all35 stages,27 PERM recipes and111 exact PIN mappings',()=>{
  const rows=runtimeStageCatalog();assert.equal(rows.length,35);
  assert.equal(rows.filter(r=>r.owner==='R').length,27);
  assert.equal(rows.filter(r=>r.owner==='P').reduce((n,r)=>n+r.required.length,0),111);
  assert.equal(rows.filter(r=>r.runtimeProfile==='SUPABASE_T04').length,19);
  assert.deepEqual(rows.filter(r=>r.rollbackVariant).map(r=>r.rollbackVariant),['Additive','Preflight','Recovery']);
});
test('PIN partition stays disjoint48+7 and TC18 remains inside mandatory canary wrapper',()=>{
  const a=runtimeStage('pin-onboard-closeout'),b=runtimeStage('pin-tc18-wrapper');
  const keys=r=>r.required.map(x=>JSON.stringify(x));
  assert.equal(a.required.length,48);assert.equal(b.required.length,7);
  assert.equal(new Set([...keys(a),...keys(b)]).size,55);
  const command=runtimeStageCommand(b.stage,{sourceRoot:resolve('.'),outputRoot:resolve('artifacts/full')});
  assert.equal(command.wrapper,true);assert(command.argv[0].endsWith('permission-pin-canary-run.mjs'));
  assert(command.timeoutMs>25*60000);assert.equal(command.reportRoot,command.argv[1]);
});
test('current canonical config hashes match all source configs after CRLF-only normalization',()=>{
  for(const s of runtimeStageCatalog()){
    const bytes=Buffer.from(readFileSync(s.config.path,'utf8').replaceAll('\r\n','\n'));
    assert.equal(runtimeConfigBinding(s.stage,bytes),s.configSHA,s.config.path);
    assert.throws(()=>runtimeConfigBinding(s.stage,Buffer.concat([bytes,Buffer.from('\n')])));
  }
});
test('all direct recipes use full files with no ad-hoc CLI name filters',()=>{
  for(const s of runtimeStageCatalog().filter(s=>!s.wrapper)){
    const c=runtimeStageCommand(s.stage,{sourceRoot:resolve('.'),outputRoot:resolve('artifacts/full')});
    for(const f of s.files)assert(c.argv.includes(f));
    assert(!c.argv.some(v=>/^(--grep|--grep-invert|--testNamePattern|-t)$/.test(v)));
    assert(c.argv.includes(s.runner==='vitest'?'--allowOnly=false':'--forbid-only'));
    assert(c.argv.includes(s.runner==='vitest'?'--retry=0':'--retries=0'));
  }
});
test('unknown stage and relative roots cannot select arbitrary commands',()=>{
  assert.throws(()=>runtimeStage('not-approved'));
  assert.throws(()=>runtimeStageCommand('candidate-unit',{sourceRoot:'.',outputRoot:'artifacts'}));
});
