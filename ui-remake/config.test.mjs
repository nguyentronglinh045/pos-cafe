import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateConfig, within } from './config.mjs';

const make = () => ({version:1,kind:'selftest',title:'controls',cases:[{id:'min',viewport:{width:568,height:320},actual:{url:'fixture://payment',ready:'main'},reference:{url:'fixture://payment',ready:'main'},anchors:[{id:'title',actual:'h1',reference:'h1'}],criticalSelectors:[{id:'complete',selector:'button'}],thresholds:{channelThreshold:0,maxDiffRatio:0,geometryTolerancePx:0,minTargetPx:44},selftestExpectation:'PASS'}]});
test('accepts minimum landscape and reports bounded image estimate',()=>assert.equal(validateConfig(make()).estimatedBytes,568*320*24));
for(const [name,edit] of [
  ['portrait',c=>c.cases[0].viewport={width:320,height:568}],
  ['too short',c=>c.cases[0].viewport.height=319],
  ['NaN threshold',c=>c.cases[0].thresholds.maxDiffRatio=NaN],
  ['missing threshold',c=>delete c.cases[0].thresholds.geometryTolerancePx],
  ['remote target',c=>c.cases[0].actual.url='https://example.com'],
  ['credentials',c=>c.cases[0].actual.url='http://user:secret@127.0.0.1:5173'],
  ['executable step',c=>c.cases[0].actual.steps=[{action:'evaluate',selector:'main'}]],
  ['duplicate cases',c=>c.cases.push(structuredClone(c.cases[0]))],
  ['duplicate anchors',c=>c.cases[0].anchors.push(structuredClone(c.cases[0].anchors[0]))],
  ['no controls',c=>c.cases[0].criticalSelectors=[]],
  ['outside region',c=>c.cases[0].regions=[{id:'bad',x:560,y:0,width:20,height:20,maxDiffRatio:0}]],
  ['unsafe id',c=>c.cases[0].id='../escape'],
  ['huge output matrix',c=>c.cases=Array.from({length:32},(_,i)=>({...c.cases[0],id:`case-${i}`,viewport:{width:3840,height:2160}}))],
])test(`rejects ${name}`,()=>{const c=make();edit(c);assert.throws(()=>validateConfig(c))});
test('screen remake cannot take own implementation as reference',()=>{const c=make();c.kind='screen-remake';c.designUrl='https://stitch.withgoogle.com/projects/example';c.referenceFiles=['raw.html'];delete c.cases[0].selftestExpectation;c.cases[0].actual.url='http://127.0.0.1:5173';c.cases[0].reference.url=c.cases[0].actual.url;assert.throws(()=>validateConfig(c),/own design reference/)});
test('real screen cannot accept declared expected failure',()=>{const c=make();c.kind='screen-remake';c.designUrl='https://stitch.withgoogle.com/projects/example';c.referenceFiles=['raw.html'];c.cases[0].actual.url='http://127.0.0.1:5173';c.cases[0].reference.url='http://127.0.0.1:5174';assert.throws(()=>validateConfig(c),/expected failures/)});
test('relative file containment refuses traversal',()=>{assert.equal(within(process.cwd(),'ui-remake/config.mjs').endsWith('config.mjs'),true);assert.throws(()=>within(process.cwd(),'../escape'))});
