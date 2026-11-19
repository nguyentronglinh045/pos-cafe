import test from 'node:test';
import assert from 'node:assert/strict';
import {serviceProfile,serviceEventProfile,T06_CI_REF,T06_CANDIDATE_SHA,T06_CANDIDATE_TREE} from './permission-runtime-service-profile.mjs';
import {runtimeStage} from './permission-runtime-catalog.mjs';
import {t06ObservedCases,t06DefaultCases,validateT06Evidence} from './permission-runtime-t06.mjs';

const workflowSHA='a'.repeat(40);
const sourceFingerprint='a543c8a7c5e0ea2d635b0843440191bd9cc6de102e4b4739e3319fe517d8ed37';

test('T06 selection accepts only the independently pinned PR source on the dedicated CI ref',()=>{
  const env={GITHUB_ACTIONS:'true',RUNNER_ENVIRONMENT:'github-hosted',GITHUB_EVENT_NAME:'workflow_dispatch',
    GITHUB_REPOSITORY:'nguyentronglinh045/pos-cafe',GITHUB_REPOSITORY_ID:'1263057386',GITHUB_REF:T06_CI_REF,
    GITHUB_SHA:workflowSHA,GITHUB_WORKFLOW_SHA:workflowSHA,PERMISSION_RUNTIME_PROFILE:'T06_ACK'};
  const event={ref:T06_CI_REF,repository:{id:1263057386,full_name:env.GITHUB_REPOSITORY,private:false},
    inputs:{confirmation:'RUN_SERVICE_PROFILE',runtime_profile:'T06_ACK',expected_source_sha:workflowSHA,candidate_source_sha:T06_CANDIDATE_SHA}};
  assert.deepEqual(serviceEventProfile(env,event).stages,['t06-pin-ack']);
  assert.deepEqual(serviceProfile('T06_SEED').stages,['candidate-seed-recovery-database']);
  assert.throws(()=>serviceEventProfile({...env,GITHUB_REF:'refs/heads/main'},event));
  assert.throws(()=>serviceEventProfile(env,{...event,inputs:{...event.inputs,candidate_source_sha:workflowSHA}}));
  assert.throws(()=>serviceEventProfile({...env,GITHUB_WORKFLOW_SHA:T06_CANDIDATE_SHA},event));
});

test('T06 ACK receipt keeps each result distinct and rejects drift and invented passes',()=>{
  const stage='t06-pin-ack',expected={...runtimeStage(stage),argv:['playwright','test']};
  const context={stage,runner:'playwright',sourceSHA:T06_CANDIDATE_SHA,sourceFingerprint,lockSHA:'b'.repeat(64),
    configSHA:expected.configSHA,runId:'1',invocationSHA:'c'.repeat(64)};
  const base={...context,schemaVersion:'permission-runtime-stage-v1',complete:true,argv:expected.argv,
    errorCount:0,hookErrorCount:0,
    discovery:expected.required.map(item=>({...item,retry:0,repeats:1,disabled:false,exclusive:false,expectedFailure:false}))};
  const report={...base,results:[{...expected.required[0],state:'failed',attempts:1},{...expected.required[1],state:'skipped',attempts:1}]};
  const cases=t06ObservedCases(expected,report,context);
  assert.deepEqual(cases.map(item=>item.status),['FAIL','NOT_RUN']);
  assert.throws(()=>t06ObservedCases(expected,{...report,sourceSHA:workflowSHA},context));
  const evidence={...context,workflowSHA,status:'FAIL',t06:{candidatePreserved:true,candidateTree:T06_CANDIDATE_TREE,cases,fixture:{postcheck:'PASS'}}};
  assert.doesNotThrow(()=>validateT06Evidence(evidence,stage));
  assert.throws(()=>validateT06Evidence({...evidence,status:'PASS'},stage));
});

test('a successful T06 seed receipt requires preflight, observer and original restore',()=>{
  const stage='candidate-seed-recovery-database';
  const fixture={preflight:'PASS',restore:'RESTORED_ORIGINAL',archiveSHA:'a'.repeat(64),storageSHA:'b'.repeat(64),
    baselineSHA:'c'.repeat(64),afterSHA:'d'.repeat(64)};
  const evidence={sourceSHA:T06_CANDIDATE_SHA,workflowSHA,sourceFingerprint,status:'PASS',
    t06:{candidatePreserved:true,candidateTree:T06_CANDIDATE_TREE,cases:t06DefaultCases(stage).map(item=>({...item,status:'PASS'})),fixture}};
  assert.doesNotThrow(()=>validateT06Evidence(evidence,stage));
  assert.throws(()=>validateT06Evidence({...evidence,t06:{...evidence.t06,fixture:{...fixture,restore:'NOT_RUN'}}},stage));
});
