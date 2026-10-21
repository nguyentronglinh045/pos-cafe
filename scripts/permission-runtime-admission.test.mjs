import test from'node:test';import assert from'node:assert/strict';import{validateAdmissionEvidence}from'./permission-runtime-admission.mjs';
import{PROJECT_PHASES,PROJECT_REPOSITORY_ID,publicSummary}from'./project-ci-results.mjs';
import{assertEdgeResolution}from'./permission-edge-resolution.mjs';
import{readFileSync}from'node:fs';
const edgeInputs=assertEdgeResolution('tests/permissions/runtime/edge-resolution',JSON.parse(readFileSync('tests/permissions/runtime/ci1-edge.json')));
const edgeResolution={schemaVersion:'permission-edge-resolution-v1',sourceSHA:'a'.repeat(40),scope:'NATIVE_RESOLVER_ONLY',...edgeInputs,cacheSHA256:'f'.repeat(64),observed:17,metadataOnly:3,warmBundles:2,runtimeBadSRIControls:1,rootRemoved:true,processReleased:true};
function base(){
 const admission={repository:'nguyentronglinh045/pos-cafe',branch:'run/permissions-20261020',sourceRoot:'D:/test/code',expectedRemoteSHA:'a'.repeat(40),retainedRoots:['D:/test/evidence'],knownHistoricalLinks:[]};
 const diagnosticControls={sourceSHA:'a'.repeat(40),lockSHA:'c'.repeat(64),run:7,pass:7,fullPipeline:true,mutationChecks:20,states:['failed','timedOut','interrupted','runner-error','metadata-absent','wrapper-failure','transport-refusal']};
 const budget={path:'D:/test/evidence/budget.json',sha256:'f'.repeat(64)},workstreamId='test-workstream';
 return{manifest:{schemaVersion:'permission-runtime-admission-v1',...admission,workstreamId,budget:structuredClone(budget),sourceSHA:'a'.repeat(40),profile:'PIN_ONBOARD',packet:{sha256:'b'.repeat(64)}},
 packet:{admission:structuredClone(admission),workstreamId,budget,effectivePins:[{path:'scripts/test.mjs',sha256:'c'.repeat(64)}]},
 reviews:{candidateSHA256:'b'.repeat(64),reviewers:[{name:'one',scope:'source',verdict:'APPROVE'},{name:'two',scope:'operations',verdict:'APPROVE'}]},
 light:{schemaVersion:'pos-cafe-light-ci-v1',repository:admission.repository,repositoryID:PROJECT_REPOSITORY_ID,event:'push',sourceSHA:'a'.repeat(40),workflowSHA:'a'.repeat(40),lockSHA:'c'.repeat(64),runId:'123',attempt:1,peakOwnedBytes:100,sourcePreserved:true,overallStatus:'PASS',
 phases:PROJECT_PHASES.map(id=>({id,status:'PASS',exitCode:0,counts:id==='runtime-reporters'?{run:4,pass:4,fail:0,skip:0,positiveControls:2,negativeControls:2,diagnosticControls}:id==='edge-resolution'?{run:3,pass:3,fail:0,skip:0,edgeResolution:structuredClone(edgeResolution)}:null}))},
 native:{sourceSHA:'a'.repeat(40),runId:'123',status:'NOT_PRESENT',rootRemoved:true,processReleased:true},
 prior:{reclaim:[{status:'RECLAIMED',imageUnlinked:true,measuredHostFreeDeltaBytes:100}]},disks:[{path:'C:/',freeBytes:31*1024**3},{path:'D:/',freeBytes:31*1024**3}],retainedBytes:100,activeJobs:0,wslPresent:false,edgeInputs};
}
test('same source CI receipt supports two data manifests and each profile while retaining source controls',()=>{
 const p=base();assert.equal(validateAdmissionEvidence(p,'heavy').status,'ADMITTED');p.manifest.profile='SUPABASE_T04';assert.equal(validateAdmissionEvidence(p,'heavy').status,'ADMITTED');
});
test('actual CI public exporter preserves only bounded diagnostic controls usable by admission',()=>{
 const p=base(),binding={...p.light,prHeadSHA:null},fingerprints={source:'b'.repeat(64),lock:p.light.lockSHA};
 const rows=p.light.phases.map(row=>({...row,elapsedMs:1,invocationSHA:'d'.repeat(64),reportSHA:null}));
 rows[6].counts.diagnosticControls.privateMessage='PRIVATE_DIAGNOSTIC_SENTINEL';
 const summary=publicSummary(binding,rows,fingerprints);
 assert.equal(JSON.stringify(summary).includes('PRIVATE_DIAGNOSTIC_SENTINEL'),false);
 p.light={...summary,sourcePreserved:true,peakOwnedBytes:100};
 assert.equal(validateAdmissionEvidence(p,'heavy').status,'ADMITTED');
 for(const mutate of[d=>d.sourceSHA='e'.repeat(40),d=>d.lockSHA='e'.repeat(64),d=>d.mutationChecks=19,d=>d.states.push('private')]){
  const bad=structuredClone(rows);mutate(bad[6].counts.diagnosticControls);assert.throws(()=>publicSummary(binding,bad,fingerprints));
 }
});
test('admission fails closed for stale CI, missing controls/review/binding, unreclaimed runtime and disk shortage',()=>{
 for(const change of[p=>p.light.sourceSHA='d'.repeat(40),p=>delete p.light.phases[6].counts.diagnosticControls,p=>p.light.phases[6].counts.diagnosticControls.pass=6,
 p=>p.light.phases[6].counts.diagnosticControls.mutationChecks=19,p=>p.light.phases[6].counts.run=0,p=>p.light.phases[6].counts.diagnosticControls.lockSHA='d'.repeat(64),
 p=>p.light.phases[0].id='duplicate',p=>p.light.phases[0].exitCode=1,p=>p.light.workflowSHA='d'.repeat(40),p=>p.light.repositoryID=1,p=>p.light.runId='invalid',p=>p.light.peakOwnedBytes=-1,
 p=>p.reviews.reviewers[1].verdict='CHANGES_REQUESTED',p=>p.reviews.candidateSHA256='d'.repeat(64),
 p=>{p.reviews.reviewers[1].name='one';p.reviews.reviewers.push({name:'irrelevant',scope:'other',verdict:'APPROVE'});},
 p=>p.prior.reclaim[0].imageUnlinked=false,p=>p.disks[0].freeBytes=1,p=>p.activeJobs=1,p=>p.wslPresent=true,p=>p.packet.effectivePins.push(p.packet.effectivePins[0]),
 p=>p.manifest.branch='main',p=>p.native.rootRemoved=false,p=>p.native.runId='999',p=>p.manifest.retainedRoots=[],p=>p.manifest.retainedRoots=['D:/unreviewed-scope'],p=>p.manifest.expectedRemoteSHA='e'.repeat(40),
 p=>p.manifest.budget.path='D:/test/new-ledger.json',p=>p.manifest.budget.sha256='e'.repeat(64),p=>p.manifest.workstreamId='reset-spent',
 p=>p.light.phases.find(x=>x.id==='edge-resolution').counts.edgeResolution.lockSHA256='e'.repeat(64),
 p=>p.light.phases.find(x=>x.id==='edge-resolution').counts.edgeResolution.runtimeBadSRIControls=0,
 p=>p.light.phases.find(x=>x.id==='edge-resolution').counts.edgeResolution.rootRemoved=false]){
  const p=base();change(p);assert.throws(()=>validateAdmissionEvidence(p,'heavy'),/REFUSED/);
 }
});
