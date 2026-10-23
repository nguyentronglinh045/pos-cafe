// Manual, Git-source Preview only. No Vercel SDK/CLI, production mutation or logs API.
import {readFileSync, statSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {hash, PROJECT_REPOSITORY, PROJECT_REPOSITORY_ID} from './project-ci-results.mjs';
import {verifyReleaseRun,verifyReleaseFiles,verifyReleaseEnvironment,PRODUCTION_ENABLED} from './project-release.mjs';

const MAX=2*1024*1024, POLL_MS=600000;
const SHA=/^[a-f0-9]{40}(?![\s\S])/, DIGEST=/^[a-f0-9]{64}(?![\s\S])/;
const ID=/^dpl_[A-Za-z0-9]{1,128}(?![\s\S])/;
const PROTECTION=['ssoProtection','passwordProtection','trustedIps','trustedSources','protectionBypass','optionsAllowlist'];
const PROJECT_REF='ineckiashpwloncxnbqx', SUPABASE_URL=`https://${PROJECT_REF}.supabase.co`;
const CONFIG_KEYS=['POS_PREVIEW_DATA_MODE','POS_PREVIEW_SUPABASE_URL','POS_PREVIEW_SUPABASE_PUBLISHABLE_KEY'];
const ENV_ROW_KEYS=['key','value','type','target','visibility','id','createdAt','createdBy','updatedAt','updatedBy','comment',
  'securityIssues','decrypted','system','gitBranch','customEnvironmentIds','configurationId','contentHint','edgeConfigId','edgeConfigTokenId','sunsetSecretId'];
const CODES=['CONTEXT','POLICY','AUTH','SOURCE','CI','FILES','PRODUCTION_GUARD','PREVIEW_GUARD','PROJECT','CONFIG','READINESS','API','DEPLOYMENT','TIMEOUT','ROUTING','PROTECTION','BUILD','MODE','FAILED'];
const fail=code=>{throw Object.assign(new Error('FRONTEND_PREVIEW_'+code),{code:'FRONTEND_PREVIEW_'+code});};
const check=(ok,code)=>{if(!ok)fail(code);};
const matches=(value,pattern)=>typeof value==='string'&&pattern.test(value);
const canonical=value=>JSON.stringify(value,(_key,item)=>item&&typeof item==='object'&&!Array.isArray(item)?
  Object.fromEntries(Object.entries(item).sort(([a],[b])=>a<b?-1:a>b?1:0)):item);
const exact=(value,keys)=>value&&typeof value==='object'&&!Array.isArray(value)&&canonical(Object.keys(value).sort())===canonical([...keys].sort());
const text=(value,max=256)=>typeof value==='string'&&value.length>0&&value.length<=max&&!/[\0\r\n]/.test(value);
const present=(object,key)=>({present:Object.hasOwn(object,key),value:Object.hasOwn(object,key)?object[key]:null});
const finite=error=>{const code=CODES.some(item=>error?.code==='FRONTEND_PREVIEW_'+item)?error.code:'FRONTEND_PREVIEW_FAILED';
  return Object.assign(new Error(code),{code});};

export function validatePreviewPolicy(policy) {
  check(exact(policy,['schemaVersion','reviewers','allowedSourceBranches','productionEnabled','trustedFiles','preview'])&&
    policy.schemaVersion==='pos-release-policy-v1'&&policy.productionEnabled===false&&!PRODUCTION_ENABLED&&
    Array.isArray(policy.allowedSourceBranches)&&policy.allowedSourceBranches.length===1&&policy.allowedSourceBranches[0]==='main'&&
    Array.isArray(policy.reviewers)&&policy.reviewers.length===1&&policy.reviewers[0]==='nguyentronglinh045','POLICY');
  const p=policy.preview;
  check(exact(p,['projectId','projectName','teamSlug','repoId','protectionFields'])&&
    p.projectId==='prj_7xwZL8MUEccVL2o0EvxoCtIYJ1en'&&p.projectName==='pos-cafe'&&
    p.teamSlug==='24tx810010-hcmutes-projects'&&p.repoId===PROJECT_REPOSITORY_ID&&Array.isArray(p.protectionFields)&&
    p.protectionFields.length===PROTECTION.length&&p.protectionFields.every((field,i)=>field===PROTECTION[i]),'POLICY');
  check(policy.trustedFiles&&typeof policy.trustedFiles==='object'&&!Array.isArray(policy.trustedFiles)&&
    Object.keys(policy.trustedFiles).length<=64,'POLICY');
  for(const [file,digest] of Object.entries(policy.trustedFiles))check(matches(file,/^[.A-Za-z0-9_/-]+(?![\s\S])/)&&
    file.split('/').every(part=>part&&part!=='.'&&part!=='..')&&matches(digest,DIGEST),'POLICY');
  for(const file of ['.github/workflows/ci.yml','.github/workflows/frontend-preview.yml','scripts/project-preview.mjs',
    'scripts/project-release.mjs','vercel.json'])check(Object.hasOwn(policy.trustedFiles,file),'POLICY');
  return p;
}

export function verifyPreviewEnvironment(environment,branches,policy) {
  const rules=Array.isArray(environment?.protection_rules)?environment.protection_rules.filter(rule=>rule?.type==='required_reviewers'):[];
  const review=rules[0],reviewers=review?.reviewers;
  check(typeof environment?.name==='string'&&environment.name.toLowerCase()==='preview'&&environment.can_admins_bypass===false&&
    environment.deployment_branch_policy?.protected_branches===false&&environment.deployment_branch_policy.custom_branch_policies===true&&
    rules.length===1&&review.prevent_self_review===false&&Array.isArray(reviewers)&&reviewers.length===1&&
    reviewers[0]?.type==='User'&&reviewers[0].reviewer?.id===54500418&&reviewers[0].reviewer.login==='nguyentronglinh045'&&
    Array.isArray(policy?.reviewers)&&policy.reviewers.length===1&&policy.reviewers[0]===reviewers[0].reviewer.login&&
    Array.isArray(branches)&&branches.length===1&&branches[0]?.name==='main'&&branches[0].type==='branch','PREVIEW_GUARD');
  return true;
}

export const ignorePreview=env=>env.VERCEL_ENV==='preview'?1:0;
function previewConfiguration(group) {
  const keys=Object.keys(group);
  if(keys.length===0)return {dataMode:'mock',projectRef:null,url:'',publishableKey:''};
  check(exact(group,CONFIG_KEYS)&&group.POS_PREVIEW_DATA_MODE==='supabase'&&group.POS_PREVIEW_SUPABASE_URL===SUPABASE_URL&&
    matches(group.POS_PREVIEW_SUPABASE_PUBLISHABLE_KEY,/^sb_publishable_[A-Za-z0-9_-]{16,256}(?![\s\S])/),'CONFIG');
  return {dataMode:'supabase',projectRef:PROJECT_REF,url:SUPABASE_URL,publishableKey:group.POS_PREVIEW_SUPABASE_PUBLISHABLE_KEY};
}
export function previewProjectConfiguration(payload,expectedMode) {
  check(['mock','supabase'].includes(expectedMode),'CONFIG');
  let rows;
  if(Array.isArray(payload))rows=payload;
  else if(exact(payload,['envs']))rows=payload.envs;
  else if(exact(payload,['envs','hiddenProductionEnvCount'])){
    check(payload.hiddenProductionEnvCount===0,'CONFIG');rows=payload.envs;
  }else if(exact(payload,['envs','pagination'])){
    // Vercel SDK FilterProjectEnvsResponseBody2 / Pagination: a complete list
    // has neither a next nor a previous page, and count describes this page.
    const page=payload.pagination;rows=payload.envs;
    check(exact(page,['count','next','prev'])&&Number.isSafeInteger(page.count)&&page.count>=0&&page.count<=256&&
      page.count===rows?.length&&page.next===null&&page.prev===null,'CONFIG');
  }else fail('CONFIG');
  check(Array.isArray(rows)&&rows.length<=256,'CONFIG');
  const group={},selected=[];
  for(const row of rows){
    check(row&&typeof row==='object'&&!Array.isArray(row)&&text(row.key,256),'CONFIG');
    if(!/^POS_PREVIEW_/i.test(row.key))continue; // Never inspect unrelated or legacy VITE values.
    check(CONFIG_KEYS.includes(row.key)&&!Object.hasOwn(group,row.key)&&Object.keys(row).every(key=>ENV_ROW_KEYS.includes(key))&&
      row.type==='plain'&&(!Object.hasOwn(row,'visibility')||row.visibility==='config')&&
      Array.isArray(row.target)&&row.target.length===1&&row.target[0]==='preview'&&
      (!Object.hasOwn(row,'gitBranch')||row.gitBranch===null)&&(!Object.hasOwn(row,'system')||row.system===false)&&
      (!Object.hasOwn(row,'decrypted')||row.decrypted===false)&&
      (!Object.hasOwn(row,'customEnvironmentIds')||Array.isArray(row.customEnvironmentIds)&&row.customEnvironmentIds.length===0)&&
      (!Object.hasOwn(row,'securityIssues')||Array.isArray(row.securityIssues)&&row.securityIssues.length===0)&&
      ['configurationId','contentHint','edgeConfigId','edgeConfigTokenId','sunsetSecretId'].every(key=>!Object.hasOwn(row,key)||row[key]===null),'CONFIG');
    group[row.key]=row.value;selected.push(row);
  }
  const config=previewConfiguration(group);check(config.dataMode===expectedMode,'CONFIG');
  return {...config,configurationSha256:hash(canonical(selected.sort((a,b)=>a.key<b.key?-1:a.key>b.key?1:0)))};
}
export function previewBuildEnvironment(env) {
  check(env.VERCEL_ENV==='preview','BUILD');
  const config=previewConfiguration(Object.fromEntries(Object.keys(env).filter(key=>/^POS_PREVIEW_/i.test(key)).map(key=>[key,env[key]])));
  return {...Object.fromEntries(['PATH','HOME','TMPDIR','TMP','TEMP','LANG','LC_ALL','TZ','SystemRoot'].filter(key=>typeof env[key]==='string').map(key=>[key,env[key]])),
    VITE_DATA_MODE:config.dataMode,VITE_SUPABASE_URL:config.url,VITE_SUPABASE_ANON_KEY:config.publishableKey};
}
export function buildPreview(env,run=spawnSync) {
  try {
    const result=run('npm',['run','build'],{env:previewBuildEnvironment(env),shell:false,windowsHide:true,
      stdio:['ignore','pipe','pipe'],timeout:600000,maxBuffer:MAX});
    check(result.status===0&&!result.error&&!result.signal,'BUILD');return true;
  }catch(error){throw finite(error);}
}

function snapshotProject(project,p) {
  check(project&&project.id===p.projectId&&project.name===p.projectName&&project.framework==='vite'&&
    (!Object.hasOwn(project,'rootDirectory')||project.rootDirectory===null)&&project.autoExposeSystemEnvs===true&&
    project.link?.type==='github'&&project.link.repoId===p.repoId&&project.link.productionBranch==='main'&&Array.isArray(project.alias)&&project.alias.length<=1024,'PROJECT');
  const domains=new Set();
  const productionAliases=project.alias.map(alias=>{
    check(alias&&text(alias.domain,253)&&!domains.has(alias.domain.toLowerCase()),'PROJECT');domains.add(alias.domain.toLowerCase());
    for(const key of ['environment','target'])if(Object.hasOwn(alias,key))check(alias[key]===null||text(alias[key]),'PROJECT');
    for(const key of ['redirect','gitBranch'])if(Object.hasOwn(alias,key))check(alias[key]===null||
      (typeof alias[key]==='string'&&alias[key].length<=2048&&!/[\0\r\n]/.test(alias[key])),'PROJECT');
    if(Object.hasOwn(alias,'redirectStatusCode'))check(alias.redirectStatusCode===null||[301,302,307,308].includes(alias.redirectStatusCode),'PROJECT');
    const deployment=present(alias,'deployment');
    if(deployment.present&&deployment.value!==null){check(deployment.value&&typeof deployment.value==='object'&&
      Object.hasOwn(deployment.value,'id')&&(deployment.value.id===null||matches(deployment.value.id,ID)),'PROJECT');deployment.value={id:deployment.value.id};}
    // Validate every record before filtering. An explicit non-production signal
    // excludes a route only when every specified signal is known non-production;
    // absent/null/unknown-only routes remain possible production and are pinned.
    // These field-specific enums are case-sensitive in GET /v9/projects.
    // Unknown values stay conservative; normalization never changes the snapshot.
    const signals=[['environment',{preview:'nonProduction',production:'production'}],
      ['target',{PREVIEW:'nonProduction',PRODUCTION:'production',STAGING:'nonProduction'}]]
      .filter(([key])=>alias[key]!==undefined&&alias[key]!==null).map(([key,values])=>Object.hasOwn(values,alias[key])?values[alias[key]]:'unknown');
    check(!(signals.includes('production')&&signals.includes('nonProduction')),'ROUTING');
    if(signals.length&&signals.every(signal=>signal==='nonProduction'))return null;
    return {domain:alias.domain,environment:present(alias,'environment'),target:present(alias,'target'),deployment,
      redirect:present(alias,'redirect'),redirectStatusCode:present(alias,'redirectStatusCode'),gitBranch:present(alias,'gitBranch')};
  }).filter(alias=>alias!==null).sort((a,b)=>a.domain<b.domain?-1:a.domain>b.domain?1:0);
  const targets=present(project,'targets');
  if(targets.present){check(targets.value&&typeof targets.value==='object'&&!Array.isArray(targets.value),'PROJECT');
    const production=present(targets.value,'production');
    if(production.present&&production.value!==null){const target=production.value;
      check(target&&matches(target.id,ID),'PROJECT');
      if(Object.hasOwn(target,'alias'))check(target.alias===null||(Array.isArray(target.alias)&&target.alias.length<=1024&&target.alias.every(x=>text(x,253))),'PROJECT');
      production.value={id:target.id,alias:present(target,'alias')};
    }targets.value={production};
  }
  return {routing:canonical({aliases:productionAliases,targets}),protection:canonical(Object.fromEntries(p.protectionFields.map(key=>[key,present(project,key)])))};
}

function previewUrl(value) {
  check(text(value,300)&&/^(?:https:\/\/)?[a-z0-9.-]+\.vercel\.app\/?$/.test(value),'DEPLOYMENT');
  const url=new URL(value.startsWith('https://')?value:'https://'+value);
  check(url.protocol==='https:'&&!url.port&&!url.username&&!url.password&&!url.search&&!url.hash&&url.pathname==='/'&&
    url.hostname.endsWith('.vercel.app')&&url.hostname.length<=253&&url.hostname.split('.').every(label=>/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label)),'DEPLOYMENT');
  return url.origin;
}

function verifyDeployment(record,id,p,sourceSHA) {
  check(record&&record.id===id&&record.projectId===p.projectId&&Object.hasOwn(record,'target')&&record.target===null&&
    record.gitSource?.sha===sourceSHA&&['QUEUED','INITIALIZING','BUILDING','READY'].includes(record.readyState),'DEPLOYMENT');
  for(const [key,expected] of Object.entries({type:'github',repoId:p.repoId,ref:'main'}))
    if(Object.hasOwn(record.gitSource,key))check(record.gitSource[key]===expected,'DEPLOYMENT');
  if(record.meta&&Object.hasOwn(record.meta,'githubCommitSha'))check(record.meta.githubCommitSha===sourceSHA,'DEPLOYMENT');
  return record.readyState;
}

// Dependency injection controls transport/time only; the same closed auth,
// source, pins, project and routing checks run in unit fakes and production.
export async function deployPreview({env,event,policy},dependencies={}) {
  try {
    const p=validatePreviewPolicy(policy),input=event?.inputs;
    check((exact(input,['source_sha','ci_run_id','ci_attempt'])||exact(input,['source_sha','ci_run_id','ci_attempt','data_mode'])&&
      ['mock','supabase'].includes(input.data_mode))&&matches(input.source_sha,SHA)&&
      matches(input.ci_run_id,/^[1-9][0-9]{0,19}(?![\s\S])/)&&matches(input.ci_attempt,/^[1-9][0-9]{0,3}(?![\s\S])/),'CONTEXT');
    const expectedMode=input.data_mode??'mock';
    check(env.GITHUB_ACTIONS==='true'&&env.RUNNER_ENVIRONMENT==='github-hosted'&&env.GITHUB_REPOSITORY===PROJECT_REPOSITORY&&
      env.GITHUB_REPOSITORY_ID===String(PROJECT_REPOSITORY_ID)&&env.GITHUB_EVENT_NAME==='workflow_dispatch'&&env.GITHUB_REF==='refs/heads/main'&&
      env.GITHUB_SHA===input.source_sha&&env.GITHUB_WORKFLOW_SHA===input.source_sha&&event.repository?.full_name===PROJECT_REPOSITORY&&
      event.repository.id===PROJECT_REPOSITORY_ID,'CONTEXT');
    check(text(env.GITHUB_TOKEN,4096)&&!/[\s]/.test(env.GITHUB_TOKEN)&&text(env.VERCEL_TOKEN,4096)&&!/[\s]/.test(env.VERCEL_TOKEN),'AUTH');
    const request=dependencies.fetch??globalThis.fetch,now=dependencies.now??(()=>performance.now()),sleep=dependencies.sleep??(ms=>new Promise(done=>setTimeout(done,ms)));
    const stage=name=>{dependencies.onStage?.(name);};
    const ghBase=`https://api.github.com/repos/${PROJECT_REPOSITORY}/`,vercelBase='https://api.vercel.com';
    async function json(url,token,method='GET',body,deadline=Infinity,publicHeaders) {
      const remaining=deadline-now();check(remaining>0,'TIMEOUT');const controller=new AbortController();
      const timer=setTimeout(()=>controller.abort(),Math.min(15000,remaining));
      try {
        const response=await request(url,{method,redirect:'error',signal:controller.signal,
          headers:publicHeaders??{Authorization:`Bearer ${token}`,Accept:'application/json','Content-Type':'application/json',
            ...(url.startsWith(ghBase)?{'X-GitHub-Api-Version':'2022-11-28'}:{})},
          ...(body===undefined?{}:{body:JSON.stringify(body)})});
        check(response.ok&&response.body,'API');const length=response.headers.get('content-length');
        check(length===null||(/^[0-9]+$/.test(length)&&Number(length)<=MAX),'API');
        const reader=response.body.getReader(),chunks=[];let size=0;
        while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;check(size<=MAX,'API');chunks.push(Buffer.from(value));}
        check(!controller.signal.aborted&&now()<deadline,'TIMEOUT');return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(chunks,size)));
      }catch(error){if(error?.code?.startsWith('FRONTEND_PREVIEW_'))throw error;fail(controller.signal.aborted?'TIMEOUT':'API');}
      finally{clearTimeout(timer);controller.abort();}
    }
    const gh=path=>json(ghBase+path,env.GITHUB_TOKEN);
    const vercel=(path,method,body,deadline)=>json(vercelBase+path+(path.includes('?')?'&':'?')+'slug='+encodeURIComponent(p.teamSlug),env.VERCEL_TOKEN,method,body,deadline);
    const liveMain=async()=>{const ref=await gh('git/ref/heads/main');check(ref.object?.sha===input.source_sha,'SOURCE');};
    stage('SOURCE');await liveMain();
    stage('CI');const runInput={sourceSHA:input.source_sha,runId:input.ci_run_id,attempt:Number(input.ci_attempt)};
    try{verifyReleaseRun(await gh(`actions/runs/${input.ci_run_id}/attempts/${input.ci_attempt}`),runInput,policy);}catch{fail('CI');}
    stage('FILES');const files={};
    for(const file of Object.keys(policy.trustedFiles)){
      const item=await gh(`contents/${file}?ref=${input.source_sha}`);
      check(item.encoding==='base64'&&typeof item.content==='string'&&Number.isSafeInteger(item.size)&&item.size>=0&&item.size<=MAX,'FILES');
      files[file]=Buffer.from(item.content,'base64');check(files[file].length===item.size,'FILES');
    }
    try{verifyReleaseFiles(files,policy);}catch{fail('FILES');}
    stage('PRODUCTION_GUARD');
    try{verifyReleaseEnvironment(await gh('environments/production'),(await gh('environments/production/deployment-branch-policies')).branch_policies,policy);}catch{fail('PRODUCTION_GUARD');}
    stage('PREVIEW_GUARD');
    try{verifyPreviewEnvironment(await gh('environments/Preview'),(await gh('environments/Preview/deployment-branch-policies')).branch_policies,policy);}catch{fail('PREVIEW_GUARD');}
    stage('PROJECT');const before=snapshotProject(await vercel(`/v9/projects/${p.projectId}`),p);
    stage('CONFIG');const config=previewProjectConfiguration(await vercel(`/v10/projects/${p.projectId}/env?decrypt=false`),expectedMode);
    let authReadiness='NOT_RUN',permissionContractReadiness='NOT_RUN';
    if(config.dataMode==='supabase'){
      stage('READINESS');
      try{
        const readinessDeadline=now()+30000;
        const settings=await json(config.url+'/auth/v1/settings',null,'GET',undefined,readinessDeadline,{apikey:config.publishableKey});
        check(settings?.mailer_autoconfirm===true&&settings.disable_signup===false&&settings.external?.email===true,'READINESS');
        authReadiness='PASS';
        const contract=await json(config.url+'/rest/v1/rpc/permission_get_contract',null,'POST',{},readinessDeadline,
          {apikey:config.publishableKey,'Content-Type':'application/json','x-pos-permission-contract':'2'});
        check(contract?.permissionContractVersion===2&&contract.writeProtocolVersion===1,'READINESS');permissionContractReadiness='PASS';
      }catch{fail('READINESS');}
    }
    await liveMain();stage('CREATE');
    const created=await vercel('/v13/deployments','POST',{name:p.projectName,project:p.projectId,
      gitSource:{type:'github',repoId:p.repoId,ref:'main',sha:input.source_sha}});
    check(matches(created.id,ID)&&(!Object.hasOwn(created,'target')||created.target===null),'DEPLOYMENT');
    stage('POLL');const deadline=now()+POLL_MS;let deployment;
    while(true){deployment=await vercel(`/v13/deployments/${created.id}?withGitRepoInfo=true`,undefined,undefined,deadline);
      if(verifyDeployment(deployment,created.id,p,input.source_sha)==='READY')break;
      check(now()<deadline,'TIMEOUT');await sleep(Math.min(5000,deadline-now()));
    }
    stage('RECHECK');const after=snapshotProject(await vercel(`/v9/projects/${p.projectId}`),p);await liveMain();
    check(before.routing===after.routing,'ROUTING');check(before.protection===after.protection,'PROTECTION');
    const afterConfig=previewProjectConfiguration(await vercel(`/v10/projects/${p.projectId}/env?decrypt=false`),expectedMode);
    check(config.configurationSha256===afterConfig.configurationSha256,'CONFIG');
    const url=previewUrl(deployment.url);stage('COMPLETE');
    return {schemaVersion:'pos-frontend-preview-v1',status:'READY',sourceSHA:input.source_sha,ciRunId:input.ci_run_id,ciAttempt:Number(input.ci_attempt),
      projectId:p.projectId,deploymentId:created.id,url,productionRoutingUnchanged:true,declaredProtectionUnchanged:true,protectionFieldsChecked:PROTECTION.length,
      productionRoutingSha256:hash(before.routing),protectionSha256:hash(before.protection),dataMode:config.dataMode,supabaseProjectRef:config.projectRef,
      configurationSha256:config.configurationSha256,authReadiness,permissionContractReadiness,httpStatus:null,applicationSmoke:'NOT_RUN'};
  }catch(error){throw finite(error);}
}

function localJson(file){check(statSync(file).isFile()&&statSync(file).size<=MAX,'POLICY');return JSON.parse(readFileSync(file,'utf8'));}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  try {
    const mode=process.argv[2];
    if(mode==='ignore')process.exitCode=ignorePreview(process.env);
    else if(mode==='build'){buildPreview(process.env);console.log('FRONTEND_PREVIEW_BUILD_COMPLETE');}
    else if(mode==='deploy')console.log(JSON.stringify(await deployPreview({env:process.env,event:localJson(process.env.GITHUB_EVENT_PATH),
      policy:localJson(resolve('ci/release-policy.json'))},{onStage:name=>console.log('FRONTEND_PREVIEW_STAGE_'+name)})));
    else fail('MODE');
  }catch(error){console.log(finite(error).code);process.exitCode=1;}
}
