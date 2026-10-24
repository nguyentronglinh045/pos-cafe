import { test } from 'node:test';
import assert from 'node:assert/strict';
import { capacityAdmission, capacityResult } from './permission-capacity-probe.mjs';
const sha='a'.repeat(40), GiB=1024**3;
const env={GITHUB_ACTIONS:'true',RUNNER_ENVIRONMENT:'github-hosted',GITHUB_REPOSITORY:'nguyentronglinh045/pos-cafe',GITHUB_REPOSITORY_ID:'1263057386',GITHUB_EVENT_NAME:'workflow_dispatch',PERMISSION_CAPACITY_CONFIRMATION:'RUN_CAPACITY_PROBE',PERMISSION_CAPACITY_EXPECTED_SHA:sha,GITHUB_SHA:sha,GITHUB_WORKFLOW_SHA:sha,GITHUB_RUN_ID:'123',GITHUB_RUN_ATTEMPT:'1'};
const event={repository:{full_name:env.GITHUB_REPOSITORY,id:1263057386,private:false},inputs:{confirmation:'RUN_CAPACITY_PROBE',expected_source_sha:sha}};
test('probe binds the actual reviewed source, dispatch and public repository',()=>{
  assert.equal(capacityAdmission(env,event,{head:sha,clean:true}),true);
  for(const key of Object.keys(env))assert.throws(()=>capacityAdmission({...env,[key]:'bad'},event,{head:sha,clean:true}));
  assert.throws(()=>capacityAdmission(env,event,{head:sha,clean:false}));
  assert.throws(()=>capacityAdmission(env,event,{head:'b'.repeat(40),clean:true}));
  assert.throws(()=>capacityAdmission(env,{...event,repository:{...event.repository,private:true}},{head:sha,clean:true}));
});
test('reserve, total task budget, memory and CPU must all fit; observations never grant runtime',()=>{
  const fit={hostFreeBytes:50*GiB,memoryBytes:12*GiB,cpus:3};
  assert.equal(capacityResult(fit).status,'CAPACITY_AVAILABLE');
  for(const key of Object.keys(fit))assert.equal(capacityResult({...fit,[key]:fit[key]-1}).status,'INSUFFICIENT_CAPACITY');
  assert.equal(capacityResult(fit).fullExecution,'NOT_RUN');assert.equal(capacityResult(fit).quotaEnforced,false);
});
test('public capacity output drops arbitrary facts and rejects invalid metrics',()=>{
  assert.equal(JSON.stringify(capacityResult({hostFreeBytes:1,memoryBytes:1,cpus:1,raw:'secret'})).includes('secret'),false);
  for(const bad of [-1,NaN,Infinity,'1'])assert.throws(()=>capacityResult({hostFreeBytes:bad,memoryBytes:1,cpus:1}));
});
