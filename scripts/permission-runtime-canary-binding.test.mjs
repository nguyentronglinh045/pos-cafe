import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {tc18ReporterArguments} from './permission-runtime-canary-binding.mjs';

function fixture(run){const source=mkdtempSync(join(tmpdir(),'permission-canary-binding-')),root=join(source,'scan'),outside=join(source,'outside');
  mkdirSync(root);mkdirSync(outside);
  const path=join(source,'context.json'),c={stage:'pin-tc18-wrapper',runner:'playwright',sourceRoot:source,outputRoot:root,
    sourceSHA:'a'.repeat(40),sourceFingerprint:'b'.repeat(64),configSHA:'c'.repeat(64),lockSHA:'d'.repeat(64),
    invocationSHA:'e'.repeat(64),runId:'12345'};
  try{run({source,root,outside,path,c,save:()=>writeFileSync(path,JSON.stringify(c)),env:{PERMISSION_RUNTIME_CONTEXT:path}});}
  finally{rmSync(source,{recursive:true});}}
test('TC18 keeps default safe reporter when full collector is absent',()=>assert.deepEqual(tc18ReporterArguments('unused',{}),[]));
test('TC18 runtime report is admitted only in the exact scanned wrapper tree',()=>fixture(f=>{
  f.save();assert.deepEqual(tc18ReporterArguments(f.root,f.env,f.source),['--reporter',
    './scripts/permission-pin-canary-reporter.mjs,./scripts/permission-runtime-playwright-reporter.mjs']);
}));
test('TC18 rejects the counterexample external output channel before browser launch',()=>fixture(f=>{
  f.c.outputRoot=f.outside;f.save();assert.throws(()=>tc18ReporterArguments(f.root,f.env,f.source),/BOUNDARY_REFUSED/);
}));
test('TC18 rejects a different checkout or stage context',()=>fixture(f=>{
  f.c.sourceRoot=f.outside;f.save();assert.throws(()=>tc18ReporterArguments(f.root,f.env,f.source));
  f.c.sourceRoot=f.source;f.c.stage='other';f.save();assert.throws(()=>tc18ReporterArguments(f.root,f.env,f.source));
}));
