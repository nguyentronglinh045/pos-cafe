import test from'node:test';
import assert from'node:assert/strict';
import{readFileSync}from'node:fs';
import{SERVICE_PROFILES,serviceProfile,serviceConfig,serviceEventProfile}from'./permission-runtime-service-profile.mjs';
test('service profile selection preserves exact projects/stages and splits incompatible PIN fixtures',()=>{
 assert.deepEqual(SERVICE_PROFILES.map(p=>serviceProfile(p).stages.length),[3,2,1,1,1,1,1]);
 assert.equal(serviceProfile('PIN_RACE').ports.api,59621);assert.equal(serviceProfile('PIN_EXPIRY').ports.db,59722);
 assert.equal(serviceProfile('PIN_EXPIRY').stoppedImagePeer,'PIN_RACE');
 assert.equal(serviceProfile('PIN_IDENTITY_SERVER').privateMustBeAbsent,true);
 assert.equal(serviceProfile('PIN_IDENTITY_ONBOARDING').project,'pos-cafe-perm-s31-t04-20261013');
 assert.equal(serviceProfile('PIN_IDENTITY_ONBOARDING').logicalProfile,'PIN_IDENTITY');
 assert.equal(serviceProfile('PIN_CANARY').bootstrap.neverReuseSeededPilot,true);
 assert.equal(serviceProfile('PIN_ONBOARD').cliAlias,'/var/tmp/pos-cafe-perm-s31-t04-20261013/bin/supabase');
 for(const p of['SUPABASE_T04','PIN_IDENTITY','STATIC','__proto__','PIN_ONBOARD\n'])assert.throws(()=>serviceProfile(p));
});
test('service config binds exact canonical source and canary derivation without weakening seed semantics',()=>{
 for(const id of SERVICE_PROFILES){const p=serviceProfile(id),path=p.config.path??p.config.base.path,raw=readFileSync(path);
  const bytes=serviceConfig(id,raw);assert.ok(bytes.toString().includes(`project_id = "${p.project}"`));
  assert.equal(serviceConfig(id,raw.toString().replaceAll('\r\n','\n').replaceAll('\n','\r\n')).equals(bytes),true);
  assert.throws(()=>serviceConfig(id,raw+'\n# drift'));
 }
});
test('service dispatch refuses wrong source, event, project, private repository and profile confusion',()=>{
 const sha='a'.repeat(40),env={GITHUB_ACTIONS:'true',RUNNER_ENVIRONMENT:'github-hosted',GITHUB_EVENT_NAME:'workflow_dispatch',
  GITHUB_REPOSITORY:'nguyentronglinh045/pos-cafe',GITHUB_REPOSITORY_ID:'1263057386',GITHUB_SHA:sha,GITHUB_WORKFLOW_SHA:sha,PERMISSION_RUNTIME_PROFILE:'SUPABASE_T02'};
 const event={repository:{id:1263057386,full_name:env.GITHUB_REPOSITORY,private:false},inputs:{confirmation:'RUN_SERVICE_PROFILE',expected_source_sha:sha,runtime_profile:'SUPABASE_T02'}};
 assert.equal(serviceEventProfile(env,event).id,'SUPABASE_T02');
 for(const delta of[{GITHUB_EVENT_NAME:'push'},{GITHUB_SHA:'b'.repeat(40)},{PERMISSION_RUNTIME_PROFILE:'PIN_ONBOARD'},{GITHUB_REPOSITORY_ID:'1'}])
  assert.throws(()=>serviceEventProfile({...env,...delta},event));
 for(const change of[e=>e.repository.private=true,e=>e.inputs.confirmation='RUN_T04_PROFILE',e=>e.inputs.expected_source_sha='b'.repeat(40)]){
  const e=structuredClone(event);change(e);assert.throws(()=>serviceEventProfile(env,e));
 }
});
