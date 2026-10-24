import test from 'node:test';
import assert from 'node:assert/strict';
import {globSync,readdirSync} from 'node:fs';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {join} from 'node:path';
import legacy from '../vitest.contract.config.ts';

const root=fileURLToPath(new URL('../',import.meta.url));
const discover=config=>globSync(config.test.include,{cwd:root,exclude:config.test.exclude??[]})
  .map(path=>path.replaceAll('\\','/')).sort();

test('actual legacy discovery stays on its nine write contracts without loading permission modules',()=>{
  const legacyFiles=readdirSync(join(root,'tests/contracts')).filter(name=>/^write.+\.contract\.test\.ts$/.test(name))
    .map(name=>'tests/contracts/'+name).sort();
  assert.equal(legacyFiles.length,9);
  assert.deepEqual(discover(legacy),legacyFiles);
});

test('every permission and PIN contract remains discoverable in a dedicated configuration',async()=>{
  const expected=readdirSync(join(root,'tests/contracts')).filter(name=>/^(?:permission|ownerPin).+\.contract\.test\.ts$/.test(name))
    .map(name=>'tests/contracts/'+name).sort();
  assert(expected.length>0);
  const found=new Set();
  for(const name of readdirSync(root).filter(name=>/^vitest\.(?:permission|owner-pin).*\.config\.ts$/.test(name))){
    if(name==='vitest.permission-rollback.config.ts'){
      const previous=process.env.PERM_ROLLBACK_VARIANT;
      try{
        for(const variant of ['Additive','Preflight','Recovery']){
          process.env.PERM_ROLLBACK_VARIANT=variant;
          const {default:config}=await import(pathToFileURL(join(root,name)).href+'?discovery='+variant);
          for(const path of discover(config))found.add(path);
        }
      }finally{
        if(previous===undefined)delete process.env.PERM_ROLLBACK_VARIANT;
        else process.env.PERM_ROLLBACK_VARIANT=previous;
      }
      continue;
    }
    const {default:config}=await import(pathToFileURL(join(root,name)).href);
    for(const path of discover(config))found.add(path);
  }
  for(const path of expected)assert(found.has(path),`${path} has no dedicated discovery route`);
});
