import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { REMAKE_TEST_FILES, REMAKE_CONTROLS, AUDIT_RULES, AUDIT_TARGET_CHECKS, AUDIT_SOURCE_FILES,
  uiTestInventory, readUIFile, readUIJSON, requireFreshUIOutput, uiEvidenceContext, remakeSelftestCounts, auditSelftestCounts } from './project-ui-results.mjs';

const sha = '1'.repeat(40), digest = '2'.repeat(64), hash = bytes => createHash('sha256').update(bytes).digest('hex');
const times = {startedAfter:1000,finishedBefore:3000};
const environment = {node:process.version,os:process.platform,engine:'chromium',channel:'chromium',browserVersion:'148.0.7778.96',playwrightVersion:'1.60.0'};
function control() {
  const image = Buffer.alloc(33); Buffer.from([137,80,78,71,13,10,26,10]).copy(image);image.write('IHDR',12);image.writeUInt32BE(568,16);image.writeUInt32BE(320,20);
  const cases = Object.entries(REMAKE_CONTROLS).map(([id,selftestExpectation]) => ({id,selftestExpectation,viewport:{width:568,height:320},
    thresholds:{channelThreshold:0,maxDiffRatio:0,geometryTolerancePx:0,minTargetPx:44}}));
  const expected = {root:'/synthetic',head:sha,...environment,files:Object.values(AUDIT_SOURCE_FILES).map(path => ({path,bytes:10,sha256:digest})),
    sourceSha256:null,config:{clock:'2026-10-19T03:00:00.000Z',cases},configSha256:digest,referenceSourceSha256:digest,contractSha256:digest,
    referenceFiles:[],fontProvenance:{sourceCommit:sha}};
  expected.sourceSha256=hash(JSON.stringify(expected.files));
  const source = {head:sha,dirty:false,files:expected.files,sha256:expected.sourceSha256};
  const report = {version:1,kind:'selftest',status:'PASS',productAcceptance:'NOT_ASSESSED',startedAt:new Date(1500).toISOString(),finishedAt:new Date(2500).toISOString(),
    configSha256:digest,referenceSourceSha256:digest,contractSha256:digest,referenceApproval:null,referenceFiles:[],source,
    actualSource:{...source,declaredRoot:expected.root,binding:'in-process-fixture',dataMode:'synthetic',serverRecipe:'in-process synthetic fixture server'},
    environment:{...environment,locale:'vi-VN',timezone:'Asia/Ho_Chi_Minh',dpr:1,clock:expected.config.clock,colorScheme:'light',animations:'disabled',
      capture:'viewport; two identical PNG captures required',fontSourceCommit:sha,playwrightModule:'playwright'},artifactBytes:cases.length*4*image.length,
    cases:cases.map(item => ({...structuredClone(item),status:item.selftestExpectation,pixels:{pass:item.selftestExpectation==='PASS'||item.id==='detect-occlusion',totalPixels:568*320,
      differentPixels:item.selftestExpectation==='FAIL'&&item.id!=='detect-occlusion'?1:0,diffRatio:item.selftestExpectation==='FAIL'&&item.id!=='detect-occlusion'?1/(568*320):0},
      geometry:{pass:item.id!=='detect-shift',maxGeometryDeltaPx:item.id==='detect-shift'?6:0},reference:{screenshotSha256:hash(image),tokens:{pass:true},observed:{font:{pass:true},responsive:{pass:true}}},
      actual:{screenshotSha256:hash(image),tokens:{pass:item.id!=='detect-palette'},observed:{font:{pass:item.id!=='detect-font'},
        responsive:{pass:!['detect-occlusion','detect-small-target','detect-overflow'].includes(item.id),horizontalOverflowPx:item.id==='detect-overflow'?632:0,
          checks:[{id:'complete',pass:!['detect-occlusion','detect-small-target'].includes(item.id),
            reason:item.id==='detect-occlusion'?'center_occluded':item.id==='detect-small-target'?'target_too_small':null}]}}}}))};
  return {report,expected,options:{...times,readArtifact:name=>name==='report.md'?Buffer.from('# Synthetic\nScope: **selftest**. Measurement status: **PASS**. Product acceptance: **NOT_ASSESSED**.'):image},image};
}
function auditControl() {
  const {expected}=control();
  const report={version:1,kind:'ui-audit-selftest',status:'PASS',productAcceptance:'NOT_ASSESSED',startedAt:new Date(1500).toISOString(),finishedAt:new Date(2500).toISOString(),
    expectedFindingCount:23,findingCount:23,requiredRules:[...AUDIT_RULES],detectedRules:[...AUDIT_RULES],missingRules:[],
    targetChecks:Object.fromEntries(AUDIT_TARGET_CHECKS.map(key=>[key,true])),source:{head:sha,...Object.fromEntries(Object.keys(AUDIT_SOURCE_FILES).map(key=>[key,digest]))},environment:{...environment}};
  return {report,expected};
}

test('UI inventory includes every remake and audit test and refuses missing required sources or audit tests',()=>{
  const paths=[...REMAKE_TEST_FILES,...Object.values(AUDIT_SOURCE_FILES),'ui-audit/runtime.test.mjs','ui-audit/run.integration.test.mjs'];
  assert.equal(uiTestInventory(paths).length,8);
  for(const path of REMAKE_TEST_FILES.concat(Object.values(AUDIT_SOURCE_FILES))) assert.throws(()=>uiTestInventory(paths.filter(value=>value!==path)));
  assert.throws(()=>uiTestInventory(paths.filter(path=>!path.endsWith('.test.mjs')||!path.startsWith('ui-audit/'))));
  assert.throws(()=>uiTestInventory([...paths,paths[0]]));
});
test('remake calibration accepts all eleven controls without promoting six detected defects to app acceptance',()=>{
  const {report,expected,options}=control();
  assert.deepEqual(remakeSelftestCounts(report,expected,options),{run:11,pass:11,fail:0,skip:0,positiveControls:5,negativeControls:6});
  assert.equal(report.productAcceptance,'NOT_ASSESSED');
});
for(const [name,edit] of [
  ['wrong kind',r=>r.kind='screen-remake'],['overall FAIL',r=>r.status='FAIL'],['product acceptance',r=>r.productAcceptance='PASS'],
  ['stale start',r=>r.startedAt=new Date(999).toISOString()],['future finish',r=>r.finishedAt=new Date(3001).toISOString()],
  ['reversed time',r=>r.finishedAt=new Date(1400).toISOString()],['invalid timestamp',r=>r.startedAt='not-a-date'],
  ['wrong HEAD',r=>r.source.head='9'.repeat(40)],['dirty source',r=>r.source.dirty=true],['changed actual source',r=>r.actualSource.sha256=digest],
  ['missing source file',r=>r.source.files=r.source.files.slice(1)],['wrong config hash',r=>r.configSha256='0'.repeat(64)],
  ['wrong contract hash',r=>r.contractSha256='0'.repeat(64)],['wrong reference hash',r=>r.referenceSourceSha256='0'.repeat(64)],
  ['wrong font commit',r=>r.environment.fontSourceCommit='0'.repeat(40)],['headless shell channel',r=>r.environment.channel=null],
  ['wrong module version',r=>r.environment.playwrightVersion='1.62.1'],['wrong node',r=>r.environment.node='v1.0.0'],
  ['missing case',r=>r.cases.pop()],['duplicate case',r=>r.cases[1]=structuredClone(r.cases[0])],['ERROR case',r=>r.cases[0].status='ERROR'],
  ['changed expected failure',r=>r.cases[5].selftestExpectation='PASS'],['unmeasured green',r=>r.cases[0].actual.observed.font.pass=undefined],
  ['wrong seeded class',r=>r.cases.find(c=>c.id==='detect-font').actual.observed.font.pass=true],
  ['unshifted geometry failure',r=>r.cases.find(c=>c.id==='detect-shift').geometry.maxGeometryDeltaPx=0],
  ['visible occlusion pixels',r=>{const c=r.cases.find(c=>c.id==='detect-occlusion');c.pixels.differentPixels=1;c.pixels.diffRatio=1/c.pixels.totalPixels;}],
  ['uncovered occlusion reason',r=>r.cases.find(c=>c.id==='detect-occlusion').actual.observed.responsive.checks[0].reason='another-failure'],
  ['wrong target-size failure',r=>r.cases.find(c=>c.id==='detect-small-target').actual.observed.responsive.checks[0].reason='center_occluded'],
  ['no measured overflow',r=>r.cases.find(c=>c.id==='detect-overflow').actual.observed.responsive.horizontalOverflowPx=1],
  ['unmeasured reference',r=>r.cases[0].reference.tokens.pass=false],['changed threshold',r=>r.cases[0].thresholds.maxDiffRatio=1],
  ['changed viewport',r=>r.cases[0].viewport.width=844],['invalid pixel arithmetic',r=>r.cases[0].pixels.diffRatio=NaN],
  ['pixel pass contradicts measurement',r=>{r.cases[0].pixels.differentPixels=1;r.cases[0].pixels.diffRatio=1/r.cases[0].pixels.totalPixels;}],
  ['wrong image hash',r=>r.cases[0].actual.screenshotSha256='0'.repeat(64)],['missing image hash',r=>delete r.cases[0].actual.screenshotSha256],['wrong artifact bytes',r=>r.artifactBytes++],
]) test(`remake evidence refuses ${name}`,()=>{
  const {report,expected,options}=control();edit(report);assert.throws(()=>remakeSelftestCounts(report,expected,options));
});
test('remake evidence refuses missing, wrong-size, and non-PNG required images',()=>{
  const {report,expected,options,image}=control();
  for(const readArtifact of [()=>{throw new Error('missing');},()=>Buffer.from('PRIVATE'),()=>{const b=Buffer.from(image);b.writeUInt32BE(1,16);return b;}])
    assert.throws(()=>remakeSelftestCounts(report,expected,{...options,readArtifact}));
});
test('remake evidence requires its current Markdown companion without treating it as image bytes',()=>{
  const {report,expected,options}=control();
  assert.throws(()=>remakeSelftestCounts(report,expected,{...options,readArtifact:name=>name==='report.md'?Buffer.from('# Wrong status'):options.readArtifact(name)}));
});
test('audit calibration requires exact count, all fourteen rules and all sixteen effective-target controls',()=>{
  const {report,expected}=auditControl();
  assert.deepEqual(auditSelftestCounts(report,expected,times),{run:1,pass:1,fail:0,skip:0,detectedFindings:23,targetControls:16});
});
for(const [name,edit] of [
  ['22 findings',r=>r.findingCount=22],['24 findings',r=>r.findingCount=24],['weakened expected count',r=>r.expectedFindingCount=22],
  ['missing rule',r=>r.detectedRules.pop()],['duplicate detected rule',r=>r.detectedRules.push(r.detectedRules[0])],
  ['changed required rule',r=>r.requiredRules[0]='another-rule'],['nonempty missing rules',r=>r.missingRules.push(AUDIT_RULES[0])],
  ['failed target control',r=>r.targetChecks.scrollOffsetsRestored=false],['missing target control',r=>delete r.targetChecks.scrollOffsetsRestored],
  ['extra untrusted target control',r=>r.targetChecks.FAKE_PRIVATE=true],['wrong detector hash',r=>r.source.detectorSha256='0'.repeat(64)],
  ['wrong helper hash',r=>r.source.runtimeSha256='0'.repeat(64)],['wrong HEAD',r=>r.source.head='9'.repeat(40)],
  ['stale report',r=>r.startedAt=new Date(999).toISOString()],['wrong browser',r=>r.environment.engine='firefox'],['overall FAIL',r=>r.status='FAIL'],
]) test(`audit evidence refuses ${name}`,()=>{const {report,expected}=auditControl();edit(report);assert.throws(()=>auditSelftestCounts(report,expected,times));});

test('bounded readers refuse traversal, symlink parents, malformed JSON, oversized files and reused output',()=>{
  const root=mkdtempSync(join(tmpdir(),'pos-ci-ui-reader-')),target=join(root,'target');mkdirSync(target);writeFileSync(join(target,'data.json'),'{}');
  assert.deepEqual(readUIJSON(root,'target/data.json'),{});
  for(const name of ['../data.json','/data.json','target/../data.json','target\\data.json','target'])assert.throws(()=>readUIFile(root,name));
  assert.throws(()=>readUIFile(root,'target/data.json',1));
  writeFileSync(join(target,'bad.json'),'{');assert.throws(()=>readUIJSON(root,'target/bad.json'));
  symlinkSync(target,join(root,'link'),'junction');assert.throws(()=>readUIFile(root,'link/data.json'));
  requireFreshUIOutput(root,'artifacts/ui-remake/ci-1-1');mkdirSync(join(root,'artifacts/ui-remake/ci-1-1'),{recursive:true});
  assert.throws(()=>requireFreshUIOutput(root,'artifacts/ui-remake/ci-1-1'));
  mkdirSync(join(root,'artifacts/ui-audit'),{recursive:true});symlinkSync(target,join(root,'artifacts/ui-audit/ci-1-1'),'junction');
  assert.throws(()=>requireFreshUIOutput(root,'artifacts/ui-audit/ci-1-1'));
  assert.throws(()=>requireFreshUIOutput(root,'artifacts/elsewhere/ci-1-1'));
});

test('context binds canonical source records, font bytes, installed runtime and independent channel contract',()=>{
  const root=mkdtempSync(join(tmpdir(),'pos-ci-ui-context-'));
  const put=(path,bytes)=>{mkdirSync(dirname(join(root,path)),{recursive:true});writeFileSync(join(root,path),bytes);};
  const files=new Set([...REMAKE_TEST_FILES,...Object.values(AUDIT_SOURCE_FILES),'ui-audit/runtime.test.mjs','ui-remake/palette-a-v1.json','ui-remake/fixtures/payment.html']);
  for(const path of files)put(path,'synthetic');
  const fontFiles=['Regular','Medium','SemiBold','Bold'].map(weight=>`BeVietnamPro-${weight}.ttf`).concat('OFL.txt');
  const provenance={sourceCommit:sha,files:fontFiles.map(file=>({file,bytes:4,sha256:hash('font')}))};
  for(const file of fontFiles){const path=`ui-remake/fonts/${file}`;put(path,'font');files.add(path);}
  put('ui-remake/fonts/provenance.json',JSON.stringify(provenance));files.add('ui-remake/fonts/provenance.json');
  const config={version:1,kind:'selftest',clock:'2026-10-19T03:00:00Z',referenceFiles:['ui-remake/fixtures/payment.html'],defaults:{thresholds:{maxDiffRatio:0}},
    cases:Object.entries(REMAKE_CONTROLS).map(([id,selftestExpectation])=>({id,selftestExpectation,viewport:{width:568,height:320}}))};
  put('ui-remake/examples/selftest.json',JSON.stringify(config));files.add('ui-remake/examples/selftest.json');
  put('node_modules/playwright/package.json',JSON.stringify({version:'1.60.0'}));
  put('package-lock.json',JSON.stringify({packages:{'node_modules/playwright':{version:'1.60.0'}}}));files.add('package-lock.json');
  const expected=uiEvidenceContext(root,[...files],sha);
  assert.equal(expected.root,realpathSync(root));assert.equal(expected.playwrightVersion,'1.60.0');assert.equal(expected.files.length,files.size);
  assert.equal(expected.sourceSha256,hash(JSON.stringify(expected.files)));
  const cases=config.cases.map(item=>({...config.defaults,...item,thresholds:{...config.defaults.thresholds,...item.thresholds}}));
  assert.equal(expected.contractSha256,hash(JSON.stringify({kind:'selftest',referenceSourceSha256:expected.referenceSourceSha256,clock:config.clock,browser:'chromium',channel:'chromium',cases})));
  put('node_modules/playwright/package.json',JSON.stringify({version:'1.62.1'}));assert.throws(()=>uiEvidenceContext(root,[...files],sha));
  put('node_modules/playwright/package.json',JSON.stringify({version:'1.60.0'}));
  put('ui-remake/fonts/BeVietnamPro-Regular.ttf','bad');assert.throws(()=>uiEvidenceContext(root,[...files],sha));
});
