import test from'node:test';import assert from'node:assert/strict';import{validateAdmissionEvidence,collectActiveBackendRuns,guardAdmissionAction,verifyGitBlobPins}from'./permission-runtime-admission.mjs';
import{execFileSync}from'node:child_process';import{createHash}from'node:crypto';
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

function v2(){
 const p=base();p.manifest.schemaVersion='permission-runtime-admission-v2';
 p.packet.sourceSHA=p.manifest.sourceSHA;p.packet.authors=['author-one','author-two'];
 p.manifest.local={path:'D:/test/local.json',sha256:'d'.repeat(64)};p.packet.localSHA256=p.manifest.local.sha256;
 p.local={schemaVersion:'permission-node-local-v1',sourceSHA:p.manifest.sourceSHA,wholeTrackedSuite:true,tests:904,pass:904,fail:0,skip:0,exitCode:0};
 return p;
}

test('actual Git batch verifies the tracked PNG above the old 1MiB limit without dropping its pin',()=>{
 const path='UI-Design-Google-Stitch-Week01/Tran Thi Lam/B02_goi_mon_tai_ban.png',bytes=readFileSync(path);
 assert.ok(bytes.length>1024**2);const head=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8',windowsHide:true}).trim();
 const pin={path,sha256:createHash('sha256').update(bytes).digest('hex')};
 assert.equal(verifyGitBlobPins(process.cwd(),head,[pin]).verified,1);
 assert.throws(()=>verifyGitBlobPins(process.cwd(),head,[{...pin,sha256:'0'.repeat(64)}]),error=>error.reason==='GIT_BLOB');
});

test('bounded binary Git batch refuses malformed headers, sizes, payload hashes, missing frames and trailing data',()=>{
 const head='b'.repeat(40),path='folder/Unicode á file.bin',payload=Buffer.from([0,255,10]),pin={path,sha256:createHash('sha256').update(payload).digest('hex')};
 const frame=(header='a'.repeat(40)+' blob 3',body=payload,end=Buffer.from('\n'))=>Buffer.concat([Buffer.from(header+'\n'),body,end]);
 const good=frame(),run=(exe,args,options)=>{assert.equal(exe,'git');assert.deepEqual(args,['cat-file','--batch']);assert.equal(options.input,head+':'+path+'\n');assert.equal(options.maxBuffer,64*1024**2);return good;};
 assert.deepEqual(verifyGitBlobPins('fixture',head,[pin],run),{verified:1,bytes:good.length});
 const highBit=Buffer.from(good);highBit[0]=0xe1;
 for(const bad of[
  Buffer.from(head+':'+path+' missing\n'),frame('a'.repeat(40)+' commit 3'),frame('a'.repeat(39)+' blob 3'),highBit,
  frame('a'.repeat(40)+' blob -1'),frame('a'.repeat(40)+' blob 1.5'),frame('a'.repeat(40)+' blob 03'),frame('a'.repeat(40)+' blob 67108865'),
  frame('a'.repeat(40)+' blob 2'),frame('a'.repeat(40)+' blob 4'),frame(undefined,Buffer.from([0,254,10])),frame(undefined,payload,Buffer.from('x')),
  good.subarray(0,good.length-1),Buffer.concat([good,Buffer.from('trailing')]),Buffer.concat([good,good]),'not a Buffer',
 ])assert.throws(()=>verifyGitBlobPins('fixture',head,[pin],()=>bad),/REFUSED/);
 assert.throws(()=>verifyGitBlobPins('fixture',head,[pin],()=>{throw Object.assign(Error('buffer'),{code:'ENOBUFS'});}),error=>error.reason==='GIT_BLOB_TRANSPORT');
 assert.throws(()=>verifyGitBlobPins('fixture',head,[{...pin,path:'bad\npath'}],()=>{throw Error('must not execute');}),error=>error.reason==='PINS');
 assert.throws(()=>verifyGitBlobPins('fixture',head,[pin,pin],()=>good),error=>error.reason==='PINS');
});

test('V4 publication requires whole local checks and independent reviews, CI is required only before heavy',()=>{
 const p=v2();delete p.light;delete p.native;delete p.edgeInputs;
 assert.equal(validateAdmissionEvidence(p,'publish').status,'ADMITTED');
 assert.throws(()=>validateAdmissionEvidence(p,'heavy'),/REFUSED/);
 const h=v2();assert.equal(validateAdmissionEvidence(h,'heavy').status,'ADMITTED');
 h.light.sourceSHA='e'.repeat(40);assert.throws(()=>validateAdmissionEvidence(h,'heavy'),/REFUSED/);
});

test('publication refuses author reviews and stale, partial, skipped or unpinned local checks',()=>{
 for(const mutate of[
  p=>p.packet.sourceSHA='e'.repeat(40),p=>p.packet.authors=[],p=>p.packet.authors=['author-one','author-one'],
  p=>p.packet.authors.push('one'),p=>p.packet.authors.push('two'),p=>p.local.sourceSHA='e'.repeat(40),
  p=>p.local.wholeTrackedSuite=false,p=>p.local.tests=903,p=>p.local.pass=903,p=>p.local.fail=1,p=>p.local.skip=1,p=>p.local.exitCode=1,
  p=>p.packet.localSHA256='e'.repeat(64),p=>delete p.local,p=>p.reviews.reviewers[1].name='one',
 ]){const p=v2();mutate(p);assert.throws(()=>validateAdmissionEvidence(p,'publish'),/REFUSED/);}
});

test('backend query covers every active status without restricting branch or recent-run count',()=>{
 const seen=[];
 const fake=(exe,args)=>{assert.equal(exe,'gh');assert.deepEqual(args.slice(0,3),['api','--paginate','--slurp']);
  const endpoint=args[3];assert.match(endpoint,/actions\/workflows\/backend\.yml\/runs\?status=/);
  assert.equal(endpoint.includes('branch='),false);seen.push(new URL('https://api.github.com/'+endpoint).searchParams.get('status'));
  return JSON.stringify([{total_count:0,workflow_runs:[]}]);};
 assert.equal(collectActiveBackendRuns('nguyentronglinh045/pos-cafe',fake),0);
 assert.deepEqual(seen,['queued','in_progress','waiting','requested','pending']);
 let index=0;
 const elsewhere=()=>JSON.stringify([{total_count:++index===5?1:0,workflow_runs:index===5?[{id:123,path:'.github/workflows/backend.yml',status:'pending',head_branch:'other-branch'}]:[]}]);
 assert.equal(collectActiveBackendRuns('nguyentronglinh045/pos-cafe',elsewhere),1);
 // A positive count with an empty/truncated page must never look idle.
 assert.equal(collectActiveBackendRuns('nguyentronglinh045/pos-cafe',()=>JSON.stringify([{total_count:1001,workflow_runs:[]}])),5005);
});

test('malformed or contradictory workflow metadata cannot prove no active backend',()=>{
 for(const result of['not-json','null','[]',JSON.stringify([{}]),JSON.stringify([{total_count:-1,workflow_runs:[]}]),
  JSON.stringify([{total_count:0,workflow_runs:[{id:1,path:'.github/workflows/backend.yml',status:'queued'}]}]),
  JSON.stringify([{total_count:1,workflow_runs:[{id:1,path:'.github/workflows/other.yml',status:'queued'}]}]),
  JSON.stringify([{total_count:1,workflow_runs:[{id:1,path:'.github/workflows/backend.yml',status:'completed'}]}])]){
  assert.throws(()=>collectActiveBackendRuns('nguyentronglinh045/pos-cafe',()=>result));
 }
});

function dispatchHarness(){
 const state={spent:0,acted:0,collections:[],now:1000},deadline=10000;
 const config={dispatch:true,reserveMs:1000,clock:()=>state.now,
  collect:id=>{state.collections.push(id??null);return{status:'ADMITTED',budget:{deadlineUtc:new Date(deadline).toISOString()}};},
  reserve:()=>{state.spent++;return{reservationId:'intent-1'};},act:()=>state.acted++};
 return{state,config,deadline};
}

test('dispatch makes fresh postclaim checks, then acts once; dry-run never spends',()=>{
 const {state,config}=dispatchHarness(),result=guardAdmissionAction(config);
 assert.equal(result.reservationId,'intent-1');assert.equal(state.spent,1);assert.equal(state.acted,1);
 assert.deepEqual(state.collections,[null,'intent-1']);
 const d=dispatchHarness();d.config.dispatch=false;guardAdmissionAction(d.config);
 assert.equal(d.state.spent,0);assert.equal(d.state.acted,0);assert.deepEqual(d.state.collections,[null]);
});

test('crossing reserve cutoff during fresh checks retains spent intent and refuses external action',()=>{
 for(const delta of[0,1,1000]){
  const {state,config,deadline}=dispatchHarness(),original=config.collect;
  config.collect=id=>{const value=original(id);if(id)state.now=deadline-config.reserveMs+delta;return value;};
  assert.throws(()=>guardAdmissionAction(config),error=>error.reason==='DEADLINE'&&error.reservationId==='intent-1');
  assert.equal(state.spent,1);assert.equal(state.acted,0);assert.deepEqual(state.collections,[null,'intent-1']);
 }
});

test('changed facts or uncertain transport after reservation never return budget or replay',()=>{
 const fresh=dispatchHarness(),original=fresh.config.collect;
 fresh.config.collect=id=>{if(id)throw Object.assign(Error('changed source or remote'),{reason:'SOURCE_DRIFT'});return original(id);};
 assert.throws(()=>guardAdmissionAction(fresh.config),e=>e.reason==='SOURCE_DRIFT'&&e.reservationId==='intent-1');
 assert.equal(fresh.state.spent,1);assert.equal(fresh.state.acted,0);
 const unknown=dispatchHarness();unknown.config.act=()=>{unknown.state.acted++;throw Error('transport unknown');};
 assert.throws(()=>guardAdmissionAction(unknown.config),e=>e.reservationId==='intent-1');
 assert.equal(unknown.state.spent,1);assert.equal(unknown.state.acted,1);
 const before=dispatchHarness();before.config.collect=()=>{throw Error('initial refusal');};
 assert.throws(()=>guardAdmissionAction(before.config));assert.equal(before.state.spent,0);assert.equal(before.state.acted,0);
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
