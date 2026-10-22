import test from'node:test';import assert from'node:assert/strict';
import{mkdtempSync,readFileSync,readdirSync,rmSync,lstatSync}from'node:fs';import{join,resolve}from'node:path';import{tmpdir}from'node:os';
import{RELEASE_PHASE as P,RELEASE_PHASE_TOOLS,RECOVERY_EXCLUSIONS,releasePhaseScope,validateReleasePhase,claimReleasePublication,requireReleaseMoment,collectReleaseFacts,runAtReleaseMoment,RELEASE_OPEN_PR_PATH,candidatePullRequestCount}from'./permission-release-phase-admission.mjs';
const GiB=1024**3;
function fixture(){
 const p={schemaVersion:'permission-release-phase-admission-v1',phaseId:P.id,repository:P.repository,branch:P.branch,sourceRoot:P.sourceRoot,sourceSHA:'a'.repeat(40),expectedRemoteSHA:'b'.repeat(40),deadlineUtc:P.deadlineUtc,publicationCutoffUtc:P.publicationCutoffUtc,
  predecessor:{policySHA256:P.policySHA256,journalSHA256:P.journalSHA256,counts:{publication:2,ci:2,heavy:1,reviewRounds:6}},
  storage:{baselineFreeBytes:{C:64*GiB,D:64*GiB},taskMaximumBytes:20*GiB,reserveBytes:30*GiB,ciMaximumBytes:5*GiB},packet:{path:'D:/fixture/packet.json',sha256:'c'.repeat(64)},reviews:{path:'D:/fixture/reviews.json',sha256:'d'.repeat(64)}};
 const packet={schemaVersion:'permission-release-phase-packet-v1',sourceSHA:p.sourceSHA,admission:releasePhaseScope(p),authors:['/root','/root/release_gate_feasibility_20261022'],sourcePins:RELEASE_PHASE_TOOLS.map(path=>({path,sha256:'e'.repeat(64)}))};
 const reviews={candidateSHA256:p.packet.sha256,reviewers:[{name:'/root/independent-source',scope:'source',verdict:'APPROVE'},{name:'/root/independent-operations',scope:'operations',verdict:'APPROVE'}]};
 const facts={nowMs:Date.parse('2026-10-22T02:00:00.000Z'),predecessorPolicySHA256:P.policySHA256,predecessorJournalSHA256:P.journalSHA256,predecessorClosed:true,
  head:p.sourceSHA,branch:p.branch,sourceRoot:p.sourceRoot,trackedClean:true,remoteSHA:p.expectedRemoteSHA,fastForward:true,untracked:[...RECOVERY_EXCLUSIONS],tracked:[...RELEASE_PHASE_TOOLS],pinMatches:[true,true,true],originMatches:true,activeJobs:0,openPullRequests:0,claimPresent:false,freeBytes:{C:64*GiB,D:64*GiB}};
 return{p,packet,reviews,facts};
}
const verify=x=>validateReleasePhase(x.p,x.packet,x.reviews,x.facts);
test('transparent new phase preserves old CLOSED counts and reserves only one candidate publication plus automatic CI',()=>{
 const x=fixture(),before=structuredClone(x);const result=verify(x);assert.equal(result.status,'ADMITTED');assert.equal(result.predecessorStatus,'CLOSED');
 assert.deepEqual(result.predecessorCounts,{publication:2,ci:2,heavy:1,reviewRounds:6});assert.deepEqual(result.newActions,{publication:1,ci:1});assert.equal(result.reservedCIBytes,5*GiB);assert.deepEqual(x,before);
});
test('refuses predecessor reset, reopened history, wrong source, main, deployment and undeclared actions',()=>{
 for(const change of[x=>x.p.predecessor.policySHA256='f'.repeat(64),x=>x.p.predecessor.journalSHA256='f'.repeat(64),x=>x.p.predecessor.counts.publication=0,
  x=>x.facts.predecessorPolicySHA256='f'.repeat(64),x=>x.facts.predecessorJournalSHA256='f'.repeat(64),x=>x.facts.predecessorClosed=false,
  x=>x.p.branch='main',x=>x.p.repository='other/repository',x=>x.p.sourceRoot='D:/other/code',x=>x.p.sourceSHA=x.p.expectedRemoteSHA,x=>x.p.deploy=true,
  x=>x.facts.head='f'.repeat(40),x=>x.facts.branch='main',x=>x.facts.trackedClean=false,x=>x.facts.remoteSHA='f'.repeat(40),x=>x.facts.fastForward=false,x=>x.facts.originMatches=false]){
  const x=fixture();change(x);assert.throws(()=>verify(x),/REFUSED/);
 }
});
test('all policy tools must be tracked committed pins; only the exact15 historical recovery paths remain untracked',()=>{
 for(const change of[x=>x.facts.untracked.push('scripts/unknown.mjs'),x=>x.facts.untracked.pop(),x=>x.facts.untracked.push(x.facts.untracked[0]),
  x=>x.facts.tracked.push(RECOVERY_EXCLUSIONS[0]),x=>x.facts.tracked.pop(),x=>x.facts.pinMatches[0]=false,x=>x.packet.sourcePins.pop(),
  x=>x.packet.sourcePins.push({...x.packet.sourcePins[0]}),x=>x.packet.sourcePins[0].path='../escape',x=>x.packet.sourcePins[0].sha256='wrong']){
  const x=fixture();change(x);assert.throws(()=>verify(x),/REFUSED/);
 }
});
test('requires exact packet operation binding and two distinct non-author APPROVE scopes; no third reviewer is ignored',()=>{
 for(const change of[x=>x.packet.sourceSHA='f'.repeat(40),x=>x.packet.admission={...x.packet.admission,expectedRemoteSHA:'f'.repeat(40)},x=>x.packet.authors.pop(),
  x=>x.reviews.candidateSHA256='f'.repeat(64),x=>x.reviews.reviewers[0].verdict='CHANGES_REQUESTED',x=>x.reviews.reviewers[1].scope='source',
  x=>x.reviews.reviewers[1].name=x.reviews.reviewers[0].name,x=>x.reviews.reviewers[0].name='/root',x=>x.reviews.reviewers.push({name:'third',scope:'other',verdict:'BLOCKED'})]){
  const x=fixture();change(x);assert.throws(()=>verify(x),/REFUSED/);
 }
});
test('cutoff is exclusive and immutable; at least37 minutes remain without backdating the phase',()=>{
 const x=fixture();x.facts.nowMs=Date.parse(P.publicationCutoffUtc)-1;assert.equal(verify(x).status,'ADMITTED');
 for(const now of[Date.parse(P.publicationCutoffUtc),Date.parse(P.deadlineUtc)-37*60000+1,Date.parse(P.deadlineUtc),Date.parse('2026-10-21T23:59:59.999Z'),NaN]){
  const y=fixture();y.facts.nowMs=now;assert.throws(()=>verify(y),error=>error.reason==='DEADLINE');
 }
 for(const change of[y=>y.p.deadlineUtc='2026-10-23T04:00:00.000Z',y=>y.p.publicationCutoffUtc='2026-10-22T03:59:00.000Z']){
  const y=fixture();change(y);assert.throws(()=>verify(y),error=>error.reason==='DEADLINE_POLICY');
 }
});
test('requires both Windows reserves and bounds total positive disk fall plus5GiB CI within20GiB',()=>{
 const x=fixture();x.facts.freeBytes.C-=15*GiB;assert.equal(verify(x).windowsGrowthBytes,15*GiB);
 for(const change of[y=>y.facts.freeBytes.C=30*GiB-1,y=>y.facts.freeBytes.D=30*GiB-1,y=>y.facts.freeBytes.C-=15*GiB+1,
  y=>{y.facts.freeBytes.C-=10*GiB;y.facts.freeBytes.D-=6*GiB;},y=>y.p.storage.taskMaximumBytes=21*GiB,y=>y.p.storage.ciMaximumBytes=0,
  y=>y.facts.activeJobs=1,y=>y.facts.claimPresent=true]){
  const y=fixture();change(y);assert.throws(()=>verify(y),/REFUSED/);
 }
});
test('open PR lookup is scoped to exact repository head and malformed or unrelated responses refuse',()=>{
 assert.equal(RELEASE_OPEN_PR_PATH,'repos/nguyentronglinh045/pos-cafe/pulls?state=open&head=nguyentronglinh045%3Arun%2Fpermissions-20261020&per_page=1');
 const pr={number:6,state:'open',head:{ref:P.branch,repo:{full_name:P.repository}},base:{repo:{full_name:P.repository}}};
 assert.equal(candidatePullRequestCount([]),0);assert.equal(candidatePullRequestCount([pr]),1);
 for(const value of[null,{},'',{items:[]},[pr,pr],[{}],[{...pr,state:'closed'}],[{...pr,head:{...pr.head,ref:'main'}}],
  [{...pr,head:{...pr.head,repo:{full_name:'other/repository'}}}],[{...pr,base:{repo:{full_name:'other/repository'}}}]]){
  assert.throws(()=>candidatePullRequestCount(value),error=>error.reason==='PR_RESPONSE');
 }
});
test('open PR blocks publication despite zero active jobs, with no claim or push action',()=>{
 const root=mkdtempSync(join(resolve(process.env.PERMISSION_STATIC_TEST_TMP??tmpdir()),'release-phase-pr-')),path=join(root,'claim.json');let pushes=0;
 try{for(const count of[1,undefined,null,'0',-1]){
   const x=fixture();x.facts.openPullRequests=count;assert.equal(x.facts.activeJobs,0);
   assert.throws(()=>{verify(x);claimReleasePublication(path,{},()=>pushes++);},error=>error.reason==='OPEN_PULL_REQUEST');
   assert.equal(pushes,0);assert.equal(lstatSync(path,{throwIfNoEntry:false}),undefined);
  }}finally{rmSync(root,{recursive:true});}
});
test('PR appearing during live recheck refuses push and preserves the consumed claim',()=>{
 const root=mkdtempSync(join(resolve(process.env.PERMISSION_STATIC_TEST_TMP??tmpdir()),'release-phase-pr-recheck-')),path=join(root,'claim.json');let pushes=0;
 try{
  const x=fixture();assert.equal(verify(x).status,'ADMITTED');
  assert.throws(()=>claimReleasePublication(path,{actions:{publication:1,ci:1}},()=>{
   const fresh={...x.facts,openPullRequests:1};validateReleasePhase(x.p,x.packet,x.reviews,fresh);pushes++;
  }),error=>error.reason==='OPEN_PULL_REQUEST');
  assert.equal(pushes,0);assert.equal(lstatSync(path).isFile(),true);assert.throws(()=>claimReleasePublication(path,{},()=>pushes++),error=>error.code==='EEXIST');assert.equal(pushes,0);
 }finally{rmSync(root,{recursive:true});}
});
test('clock is captured after observation I/O and cutoff crossing prevents claim consumption',()=>{
 const x=fixture(),cutoff=Date.parse(P.publicationCutoffUtc);let now=cutoff-1,pushes=0;
 x.facts=collectReleaseFacts(()=>{const observed={...x.facts,nowMs:now};now=cutoff;return observed;},()=>now);
 assert.equal(x.facts.nowMs,cutoff);assert.throws(()=>verify(x),error=>error.reason==='DEADLINE');
 const root=mkdtempSync(join(resolve(process.env.PERMISSION_STATIC_TEST_TMP??tmpdir()),'release-phase-clock-')),path=join(root,'claim.json');
 try{
  now=cutoff-1;const early=collectReleaseFacts(()=>fixture().facts,()=>now);assert.equal(validateReleasePhase(x.p,x.packet,x.reviews,early).status,'ADMITTED');
  // Parent/other pre-consumption I/O can consume the final millisecond. The
  // production helper invokes this fresh barrier after parent metadata reads.
  now=cutoff;assert.throws(()=>claimReleasePublication(path,{},()=>pushes++,()=>requireReleaseMoment(x.p,now)),error=>error.reason==='DEADLINE');
  assert.equal(pushes,0);assert.equal(lstatSync(path,{throwIfNoEntry:false}),undefined);assert.deepEqual(readdirSync(root),[]);
 }finally{rmSync(root,{recursive:true});}
});
test('cutoff crossed during revalidation or claim verification prevents push and retains spent claim',()=>{
 const cutoff=Date.parse(P.publicationCutoffUtc);
 for(const crossing of['revalidation','claim-verification']){
  const x=fixture(),root=mkdtempSync(join(resolve(process.env.PERMISSION_STATIC_TEST_TMP??tmpdir()),'release-phase-clock-spent-')),path=join(root,'claim.json');let now=cutoff-1,pushes=0;
  try{
   assert.throws(()=>claimReleasePublication(path,{actions:{publication:1,ci:1}},()=>{
    const fresh=collectReleaseFacts(()=>{if(crossing==='revalidation')now=cutoff;return x.facts;},()=>now);
    validateReleasePhase(x.p,x.packet,x.reviews,fresh);
    assert.deepEqual(JSON.parse(readFileSync(path)).actions,{publication:1,ci:1});now=cutoff;
    return runAtReleaseMoment(x.p,()=>pushes++,()=>now);
   },()=>requireReleaseMoment(x.p,now)),error=>error.reason==='DEADLINE');
   assert.equal(pushes,0);assert.equal(lstatSync(path).isFile(),true);
   assert.throws(()=>claimReleasePublication(path,{},()=>pushes++),error=>error.code==='EEXIST');assert.equal(pushes,0);
  }finally{rmSync(root,{recursive:true});}
 }
});
test('exclusive combined claim is flushed before publication; changing payload cannot create a second attempt',()=>{
 const root=mkdtempSync(join(resolve(process.env.PERMISSION_STATIC_TEST_TMP??tmpdir()),'release-phase-claim-')),path=join(root,'claim.json');let pushes=0;
 const payload={phaseId:P.id,sourceSHA:'a'.repeat(40),actions:{publication:1,ci:1}};
 try{
  assert.equal(claimReleasePublication(path,payload,()=>{assert.equal(lstatSync(path).isFile(),true);assert.deepEqual(JSON.parse(readFileSync(path)),payload);pushes++;return'published';}),'published');
  const before=readFileSync(path);assert.throws(()=>claimReleasePublication(path,{...payload,sourceSHA:'b'.repeat(40)},()=>pushes++),error=>error.code==='EEXIST');
  assert.equal(pushes,1);assert.deepEqual(readFileSync(path),before);assert.deepEqual(readdirSync(root),['claim.json']);
 }finally{rmSync(root,{recursive:true});}
});
test('failed or unknown publication keeps its claim spent and never retries the callback',()=>{
 const root=mkdtempSync(join(resolve(process.env.PERMISSION_STATIC_TEST_TMP??tmpdir()),'release-phase-failure-')),path=join(root,'claim.json');let pushes=0;
 try{
  assert.throws(()=>claimReleasePublication(path,{actions:{publication:1,ci:1}},()=>{pushes++;throw Error('deliberate unknown publication');}),/deliberate/);
  assert.equal(lstatSync(path).isFile(),true);assert.throws(()=>claimReleasePublication(path,{},()=>pushes++),error=>error.code==='EEXIST');assert.equal(pushes,1);
 }finally{rmSync(root,{recursive:true});}
});
