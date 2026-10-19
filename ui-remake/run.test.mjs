import { test } from 'node:test';
import assert from 'node:assert/strict';
import { contractDigest, assertApproved } from './run.mjs';
const cfg = () => ({kind:'screen-remake',designUrl:'https://stitch.withgoogle.com/projects/test',clock:'2026-10-19T03:00:00Z',actualSourceRoot:'.',dataMode:'mock',serverRecipe:'mock-local',cases:[{id:'min',viewport:{width:568,height:320},thresholds:{maxDiffRatio:0},anchors:[{id:'a',actual:'button',reference:'button'}]}]});
const approve = c => { const h=contractDigest(c,'reference-hash');c.referenceApproval={by:'owner',at:'2026-10-19T03:00:00Z',sourceSha256:'reference-hash',contractSha256:h};return h;};
test('approval binds reference content and the measurement contract',()=>{const c=cfg(), h=approve(c);assert.doesNotThrow(()=>assertApproved(c,'reference-hash',h));assert.throws(()=>assertApproved(c,'modified-reference',h),/NOT_APPROVED/)});
for(const [name,edit] of [
  ['threshold',c=>c.cases[0].thresholds.maxDiffRatio=1],
  ['viewport',c=>c.cases[0].viewport.width=844],
  ['selector',c=>c.cases[0].anchors[0].actual='body'],
  ['clock',c=>c.clock='2026-10-20T03:00:00Z'],
  ['browser',c=>c.browser='firefox'],
  ['server recipe',c=>c.serverRecipe='different source'],
])test(`changed ${name} invalidates stored approval`,()=>{const c=cfg();approve(c);edit(c);assert.throws(()=>assertApproved(c,'reference-hash',contractDigest(c,'reference-hash')),/NOT_APPROVED/)});
test('approval metadata and display title do not recursively change its own digest',()=>{const c=cfg(),before=approve(c);c.title='Readable title';assert.equal(contractDigest(c,'reference-hash'),before)});
test('missing approver and invalid date cannot authorize a reference',()=>{for(const change of [a=>a.by='',a=>a.at='not-a-date']){const c=cfg(),h=approve(c);change(c.referenceApproval);assert.throws(()=>assertApproved(c,'reference-hash',h),/NOT_APPROVED/)}});
