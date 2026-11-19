// Pure selection/configuration. This module creates no runtime or permission.
import{createHash}from'node:crypto';
import{fullRuntimeProfile}from'./permission-full-runtime-policy.mjs';
import{runtimeStageCatalog}from'./permission-runtime-catalog.mjs';

export const SERVICE_PROFILES=Object.freeze(['SUPABASE_T02','PIN_ONBOARD','PIN_RACE','PIN_EXPIRY','PIN_IDENTITY_SERVER','PIN_IDENTITY_ONBOARDING','PIN_CANARY']);
export const T06_CI_REF='refs/heads/ci/t06-pin-seed-regression-20261119';
export const T06_CANDIDATE_SHA='3dd68aea1c14eb05306115bedb7300a78fee3f16';
export const T06_CANDIDATE_TREE='97fd905c5adf55a5e89d150acdba424553d2676b';
export const t06Profile=id=>id==='T06_ACK'||id==='T06_SEED';
const check=x=>{if(!x)throw Error('PERMISSION_SERVICE_PROFILE_REFUSED');};
export function serviceProfile(id){
 check(SERVICE_PROFILES.includes(id)||t06Profile(id));
 const logicalProfile=id==='T06_SEED'?'SUPABASE_T04':id.startsWith('PIN_IDENTITY_')?'PIN_IDENTITY':['PIN_RACE','PIN_EXPIRY','T06_ACK'].includes(id)?'PIN_ONBOARD':id;
 // The server fixture explicitly selects close1; the unchanged onboarding
 // config imports candidateEnvironment and requires the T04 identity engine.
 // Separate fresh envelopes preserve both fixed guard identities.
 let p=fullRuntimeProfile(id==='PIN_IDENTITY_ONBOARDING'||t06Profile(id)?'SUPABASE_T04':logicalProfile);
 if(id==='T06_ACK'){
  const project='pos-cafe-perm-g2a-20261009';
  p={...p,project,aliasRoot:'/var/tmp/'+project,stackAlias:'/var/tmp/'+project+'/stack',
   ports:{...p.ports,api:59521,db:59522,shadow:59520,pooler:59529,studio:59523,smtp:59524,analytics:59527},
   config:{base:p.config,sha256:'9d1c1f8a335e448a0be2a99cbfb0264be86aeb6a1cd2de9e0449b83365a5332d'}};
 }
 if(['PIN_RACE','PIN_EXPIRY'].includes(id)){
  const race=id==='PIN_RACE',project='pos-cafe-perm-'+(race?'g2b':'g2c')+'-20261009',prefix=race?5962:5972;
  p={...p,project,aliasRoot:'/var/tmp/'+project,stackAlias:'/var/tmp/'+project+'/stack',
   ports:{api:prefix*10+1,db:prefix*10+2,shadow:prefix*10,pooler:prefix*10+9,studio:prefix*10+3,smtp:prefix*10+4,analytics:prefix*10+7,inspector:race?8086:8087},
   config:{base:fullRuntimeProfile('SUPABASE_T04').config,derivation:race?'G2B_EXACT_REPLACEMENTS':'G2C_EXACT_REPLACEMENTS',
    sha256:race?'844ec477e66b8039a554079ae9a3139121085709f0a056ed4eb7aadfcea841e2':'4fc38d8529595b701aa1bb0606ade41b4389a73eefef05fcb8668e592f37a904'},
   bootstrap:{strategy:'MANUAL_001_016',migrationCount:16,source:race?'scripts/permission-pin-race-prepare.mjs':'scripts/permission-pin-expiry-prepare.mjs',fixture:'EMPTY_ACTIVATION'},
   ...(race?{}:{stoppedImagePeer:'PIN_RACE'})};
 }
 const stages=id==='T06_ACK'?['t06-pin-ack']:id==='T06_SEED'?['candidate-seed-recovery-database']:id==='PIN_IDENTITY_SERVER'?['pin-identity-server']:id==='PIN_IDENTITY_ONBOARDING'?['pin-identity-onboarding']
  :id==='PIN_RACE'?['pin-onboard-race']:id==='PIN_EXPIRY'?['pin-onboard-expiry']
  :runtimeStageCatalog().filter(s=>s.runtimeProfile===id&&!['pin-onboard-race','pin-onboard-expiry'].includes(s.stage)).map(s=>s.stage);
 return{...p,id,logicalProfile,stages,...(id==='PIN_IDENTITY_ONBOARDING'?{bootstrap:{strategy:'MANUAL_001_016',migrationCount:16,
  initialDatabase:'NO_PUBLIC_STORES',source:'scripts/permission-identity-runtime.mjs',fixture:'LEGACY_AUTH_CATALOG',
  doesNotClaimT04SixStorageObjectFixture:true}}:{})};
}
export function serviceConfig(id,raw){
 const p=serviceProfile(id);check(Buffer.isBuffer(raw)||typeof raw==='string');
 let text=raw.toString().replaceAll('\r\n','\n');check(Buffer.byteLength(text)<32768);
 if(id==='T06_ACK')text=text.replaceAll('pos-cafe-perm-s31-t04-20261013',p.project).replaceAll('6242','5952');
 if(id==='PIN_CANARY')text=text.replaceAll('pos-cafe-perm-s31-t04-20261013',p.project).replaceAll('6242','6282')
  .replace('inspector_port = 8084','inspector_port = 8088').replace('[db.seed]\nenabled = true','[db.seed]\nenabled = false');
 if(['PIN_RACE','PIN_EXPIRY'].includes(id))text=text.replaceAll('pos-cafe-perm-s31-t04-20261013',p.project)
  .replaceAll('6242',id==='PIN_RACE'?'5962':'5972').replace('inspector_port = 8084','inspector_port = '+p.ports.inspector);
 check(createHash('sha256').update(text).digest('hex')===p.config.sha256);return Buffer.from(text);
}
export function serviceEventProfile(env,event){
 const p=serviceProfile(env.PERMISSION_RUNTIME_PROFILE);
 check(env.GITHUB_ACTIONS==='true'&&env.RUNNER_ENVIRONMENT==='github-hosted'&&env.GITHUB_EVENT_NAME==='workflow_dispatch'
  &&env.GITHUB_REPOSITORY==='nguyentronglinh045/pos-cafe'&&env.GITHUB_REPOSITORY_ID==='1263057386'
  &&/^[a-f0-9]{40}$/.test(env.GITHUB_SHA??'')&&env.GITHUB_WORKFLOW_SHA===env.GITHUB_SHA
  &&event?.repository?.id===1263057386&&event.repository.full_name===env.GITHUB_REPOSITORY&&event.repository.private===false
  &&event.inputs?.confirmation==='RUN_SERVICE_PROFILE'&&event.inputs.expected_source_sha===env.GITHUB_SHA
  &&event.inputs.runtime_profile===p.id);
 if(t06Profile(p.id)){
  check(env.GITHUB_REF===T06_CI_REF&&(event.ref===T06_CI_REF||event.ref===T06_CI_REF.slice('refs/heads/'.length))
   &&event.inputs.candidate_source_sha===T06_CANDIDATE_SHA&&env.GITHUB_SHA!==T06_CANDIDATE_SHA);
 }else check(!event.inputs.candidate_source_sha);
 return p;
}
