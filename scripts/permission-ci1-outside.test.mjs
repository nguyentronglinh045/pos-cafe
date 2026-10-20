import test from 'node:test';
import assert from 'node:assert/strict';
import {backendOutsideAdmission} from './project-backend.mjs';
import {allocatedOutsideBytes} from './permission-ci1-outside.mjs';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync,symlinkSync,unlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
test('outside-loop admission reserves bounded control/export/log growth below1GiB',()=>{
  const r=backendOutsideAdmission(512*1024**2);assert.equal(r.technicalQuota,false);
  assert(r.measuredBytes+r.reservedFutureBytes<=r.budgetBytes);
  assert.equal(backendOutsideAdmission(1024**3-16*1024**2).budgetBytes,1024**3);
});
test('outside admission refuses unknown, unsafe or oversized accounting',()=>{
  for(const n of [undefined,null,NaN,-1,0.5,1024**3-16*1024**2+1,1024**3])assert.throws(()=>backendOutsideAdmission(n));
});
test('outside accounting includes Git objects and action payloads and deduplicates overlapping roots',()=>{
  const root=mkdtempSync(join(tmpdir(),'ci1-outside-count-'));
  try{
    mkdirSync(join(root,'.git'));mkdirSync(join(root,'_actions'));
    const before=allocatedOutsideBytes([root]);writeFileSync(join(root,'.git','objects.pack'),Buffer.alloc(65536,1));
    writeFileSync(join(root,'_actions','bundle.js'),Buffer.alloc(65536,2));
    const after=allocatedOutsideBytes([root]);assert(after>=before+131072);
    assert.equal(allocatedOutsideBytes([root,join(root,'.git'),join(root,'_actions')]),after);
  }finally{rmSync(root,{recursive:true});}
});
test('outside link cannot hide unaccounted external payloads',()=>{
  const root=mkdtempSync(join(tmpdir(),'ci1-outside-link-')),other=mkdtempSync(join(tmpdir(),'ci1-outside-external-'));
  const link=join(root,'escape');symlinkSync(other,link,process.platform==='win32'?'junction':'dir');
  try{assert.throws(()=>allocatedOutsideBytes([root]),/OUTSIDE_LINK_REFUSED/);}
  finally{unlinkSync(link);rmSync(root,{recursive:true});rmSync(other,{recursive:true});}
});
