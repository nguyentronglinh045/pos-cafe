import test from 'node:test';
import assert from 'node:assert/strict';
import {hash} from './project-ci-results.mjs';
import {ignorePreview,previewBuildEnvironment,buildPreview,validatePreviewPolicy,previewProjectConfiguration,deployPreview} from './project-preview.mjs';
const sha='1'.repeat(40),other='2'.repeat(40),repo='nguyentronglinh045/pos-cafe',repoId=1263057386;
const projectId='prj_7xwZL8MUEccVL2o0EvxoCtIYJ1en';
const supabaseUrl='https://ineckiashpwloncxnbqx.supabase.co',publishableKey='sb_publishable_SYNTHETIC_PUBLIC_0123456789';
const functionalGroup={POS_PREVIEW_DATA_MODE:'supabase',POS_PREVIEW_SUPABASE_URL:supabaseUrl,POS_PREVIEW_SUPABASE_PUBLISHABLE_KEY:publishableKey};
const functionalRows=()=>Object.entries(functionalGroup).map(([key,value])=>({key,value,type:'plain',visibility:'config',target:['preview']}));
const protectionFields=['ssoProtection','passwordProtection','trustedIps','trustedSources','protectionBypass','optionsAllowlist'];
const fileBytes=Object.fromEntries(['.github/workflows/ci.yml','.github/workflows/frontend-preview.yml',
  'scripts/project-preview.mjs','scripts/project-release.mjs','vercel.json'].map(file=>[file,Buffer.from('synthetic canonical '+file+'\n')]));
const policy={schemaVersion:'pos-release-policy-v1',reviewers:['nguyentronglinh045'],allowedSourceBranches:['main'],productionEnabled:false,
  trustedFiles:Object.fromEntries(Object.entries(fileBytes).map(([file,bytes])=>[file,hash(bytes)])),
  preview:{projectId,projectName:'pos-cafe',teamSlug:'24tx810010-hcmutes-projects',repoId,protectionFields}};
const env={GITHUB_ACTIONS:'true',RUNNER_ENVIRONMENT:'github-hosted',GITHUB_REPOSITORY:repo,GITHUB_REPOSITORY_ID:String(repoId),
  GITHUB_EVENT_NAME:'workflow_dispatch',GITHUB_REF:'refs/heads/main',GITHUB_SHA:sha,GITHUB_WORKFLOW_SHA:sha,
  GITHUB_TOKEN:'SYNTHETIC_GH_TOKEN',VERCEL_TOKEN:'SYNTHETIC_VERCEL_TOKEN'};
const event={inputs:{source_sha:sha,ci_run_id:'123',ci_attempt:'1'},repository:{full_name:repo,id:repoId}};
const run={repository:{full_name:repo,id:repoId},head_repository:{full_name:repo,id:repoId},id:123,run_attempt:1,head_sha:sha,
  head_branch:'main',event:'push',status:'completed',conclusion:'success',path:'.github/workflows/ci.yml'};
const project={id:projectId,name:'pos-cafe',framework:'vite',rootDirectory:null,autoExposeSystemEnvs:true,
  link:{type:'github',repoId,productionBranch:'main',org:'historical-owner-before-transfer'},
  alias:[{domain:'pos-cafe.vercel.app',environment:'production',target:'PRODUCTION',deployment:{id:'dpl_production'}}],
  targets:{production:{id:'dpl_production',alias:['pos-cafe.vercel.app']}},
  ssoProtection:null,protectionBypass:{SYNTHETIC_PRIVATE_BYPASS:{scope:'automation-bypass'}}};
const production={name:'Production',can_admins_bypass:false,deployment_branch_policy:{protected_branches:false,custom_branch_policies:true},
  protection_rules:[{type:'required_reviewers',prevent_self_review:false,reviewers:[{type:'User',reviewer:{login:'nguyentronglinh045'}}]}]};
const preview={...structuredClone(production),name:'Preview',protection_rules:[{type:'required_reviewers',prevent_self_review:false,
  reviewers:[{type:'User',reviewer:{login:'nguyentronglinh045',id:54500418}}]}]};
const deployment={id:'dpl_preview',projectId,target:null,gitSource:{type:'github',repoId,ref:'main',sha},
  meta:{githubCommitSha:sha},readyState:'READY',url:'pos-cafe-preview.vercel.app'};
const reject=(fn,code)=>assert.rejects(fn,error=>error.code==='FRONTEND_PREVIEW_'+code&&error.message===error.code);
function fixture(options={}) {
  let clock=0,mainReads=0,projectReads=0,configReads=0,polls=0;const calls=[],stages=[];
  const input={env:structuredClone(env),event:structuredClone(event),policy:structuredClone(policy)};
  if(Object.hasOwn(options,'dataMode'))input.event.inputs.data_mode=options.dataMode;
  const dependencies={now:()=>clock,sleep:async ms=>{clock+=ms;},onStage:stage=>stages.push(stage),fetch:async(url,request)=>{
    const parsed=new URL(url);calls.push({url,method:request.method,body:request.body,headers:request.headers,signal:request.signal,redirect:request.redirect});
    if(options.transport)return options.transport(parsed,request);
    let data;
    if(parsed.hostname==='api.github.com') {
      const path=parsed.pathname.slice(('/repos/'+repo+'/').length);
      if(path==='git/ref/heads/main')data={object:{sha:options.mainShas?.[mainReads++]??sha}};
      else if(path.startsWith('actions/runs/'))data={...structuredClone(run),...options.run};
      else if(path.startsWith('contents/')){const file=path.slice('contents/'.length),bytes=options.changedFile===file?Buffer.from('changed'):fileBytes[file];
        data={encoding:'base64',size:bytes.length,content:bytes.toString('base64')};}
      else if(path==='environments/production')data={...structuredClone(production),...options.production};
      else if(path==='environments/production/deployment-branch-policies')data={branch_policies:[{name:'main',type:'branch'}]};
      else if(path==='environments/Preview'){data=structuredClone(preview);options.preview?.(data);}
      else if(path==='environments/Preview/deployment-branch-policies')data={branch_policies:options.previewBranches??[{name:'main',type:'branch'}]};
      else assert.fail('Unexpected GitHub API path');
    } else if(parsed.hostname==='ineckiashpwloncxnbqx.supabase.co') {
      if(options.publicTransport)return options.publicTransport(parsed,request);
      clock+=options.publicDelayMs??0;
      if(parsed.pathname==='/auth/v1/settings')data={mailer_autoconfirm:true,disable_signup:false,external:{email:true},...options.authSettings};
      else if(parsed.pathname==='/rest/v1/rpc/permission_get_contract')data={permissionContractVersion:2,writeProtocolVersion:1,...options.contract};
      else assert.fail('Unexpected Supabase API path');
    } else {
      assert.equal(parsed.hostname,'api.vercel.com');assert.equal(parsed.searchParams.get('slug'),policy.preview.teamSlug);
      if(parsed.pathname==='/v9/projects/'+projectId){projectReads++;data=structuredClone(project);options.project?.(data,projectReads);}
      else if(parsed.pathname==='/v10/projects/'+projectId+'/env'){
        assert.equal(request.method,'GET');assert.equal(parsed.searchParams.get('decrypt'),'false');
        assert.equal(parsed.searchParams.has('target'),false);assert.equal(parsed.searchParams.has('gitBranch'),false);
        data=structuredClone(options.envResponse??{envs:options.envRows??[]});options.environment?.(data,++configReads);
      }
      else if(parsed.pathname==='/v13/deployments'&&request.method==='POST') {
        if(options.postError)throw options.postError;data={id:'dpl_preview',target:null};
      } else if(parsed.pathname==='/v13/deployments/dpl_preview') {
        assert.equal(parsed.searchParams.get('withGitRepoInfo'),'true');data=structuredClone(deployment);
        data.readyState=options.states?.[Math.min(polls++,options.states.length-1)]??'READY';options.deployment?.(data);
      } else assert.fail('Unexpected Vercel API path');
    }
    return new Response(JSON.stringify(data),{status:200,headers:{'content-type':'application/json'}});
  }};
  return {input,dependencies,calls,stages,postCount:()=>calls.filter(call=>call.method==='POST'&&new URL(call.url).hostname==='api.vercel.com').length,
    run:()=>deployPreview(input,dependencies)};
}

test('ignore opens only Preview and build strips tokens, inherited VITE and process overrides',()=>{
  for(const value of [undefined,'production','development','Preview','unknown']) {
    assert.equal(ignorePreview({VERCEL_ENV:value}),0);let invoked=false;
    assert.throws(()=>buildPreview({VERCEL_ENV:value},()=>{invoked=true;}),error=>error.code==='FRONTEND_PREVIEW_BUILD');assert.equal(invoked,false);
  }
  assert.equal(ignorePreview({VERCEL_ENV:'preview'}),1);
  const inherited={VERCEL_ENV:'preview',PATH:'/usr/bin',HOME:'/private',TMPDIR:'/private/tmp',LANG:'C',VERCEL_TOKEN:'SYNTHETIC_PRIVATE',
    GITHUB_TOKEN:'SYNTHETIC_PRIVATE',VITE_DATA_MODE:'supabase',VITE_SUPABASE_URL:'https://synthetic.invalid',VITE_SUPABASE_ANON_KEY:'SYNTHETIC_PRIVATE',
    VITE_EXTRA:'SYNTHETIC_PRIVATE',NODE_OPTIONS:'--import=SYNTHETIC_PRIVATE',NPM_TOKEN:'SYNTHETIC_PRIVATE'};
  const child=previewBuildEnvironment(inherited);
  assert.deepEqual(child,{PATH:'/usr/bin',HOME:'/private',TMPDIR:'/private/tmp',LANG:'C',VITE_DATA_MODE:'mock',VITE_SUPABASE_URL:'',VITE_SUPABASE_ANON_KEY:''});
  assert.equal(buildPreview(inherited,(command,args,options)=>{assert.equal(command,'npm');assert.deepEqual(args,['run','build']);
    assert.deepEqual(options.env,child);assert.deepEqual(options.stdio,['ignore','pipe','pipe']);return {status:0};}),true);
  for(const result of [{status:1,stderr:'SYNTHETIC_PRIVATE'},{status:0,error:new Error('SYNTHETIC_PRIVATE')},{status:0,signal:'SIGTERM'}])
    assert.throws(()=>buildPreview(inherited,()=>result),error=>error.message==='FRONTEND_PREVIEW_BUILD');
});

test('closed Preview policy rejects changed project, team, owner gates, open fields and missing checker pins',()=>{
  validatePreviewPolicy(policy);
  for(const mutate of [p=>{p.preview.projectId='prj_other';},p=>{p.preview.teamSlug='other';},p=>{p.preview.repoId=String(repoId);},
    p=>{p.preview.extra=true;},p=>{p.preview.protectionFields.pop();},p=>{p.reviewers=['other'];},p=>{p.allowedSourceBranches.push('feature');},
    p=>{p.productionEnabled=true;},p=>{p.trustedFiles={};},p=>{p.trustedFiles['../outside']='1'.repeat(64);}]) {
    const changed=structuredClone(policy);mutate(changed);assert.throws(()=>validatePreviewPolicy(changed),error=>error.code==='FRONTEND_PREVIEW_POLICY');
  }
});

test('successful fake Preview binds exact source/CI and sends exactly one minimal Git-source POST',async()=>{
  const f=fixture({states:['QUEUED','INITIALIZING','BUILDING','READY']}),result=await f.run();
  assert.equal(f.postCount(),1);const post=f.calls.find(call=>call.method==='POST');
  assert.deepEqual(JSON.parse(post.body),{name:'pos-cafe',project:projectId,gitSource:{type:'github',repoId,ref:'main',sha}});
  assert.ok(f.calls.every(call=>call.redirect==='error'&&call.signal instanceof AbortSignal));
  assert.ok(f.calls.filter(call=>call.method!=='POST').every(call=>call.method==='GET'&&call.body===undefined));
  assert.deepEqual(f.stages,['SOURCE','CI','FILES','PRODUCTION_GUARD','PREVIEW_GUARD','PROJECT','CONFIG','CREATE','POLL','RECHECK','COMPLETE']);
  assert.equal(result.status,'READY');assert.equal(result.url,'https://pos-cafe-preview.vercel.app');assert.equal(result.applicationSmoke,'NOT_RUN');
  assert.equal(result.httpStatus,null);assert.equal(result.productionRoutingUnchanged,true);assert.equal(result.declaredProtectionUnchanged,true);
  assert.equal(Object.hasOwn(result,'routingUnchanged'),false);assert.match(result.productionRoutingSha256,/^[a-f0-9]{64}$/);
  for(const privateText of ['SYNTHETIC_PRIVATE_BYPASS','SYNTHETIC_GH_TOKEN','SYNTHETIC_VERCEL_TOKEN','historical-owner-before-transfer'])
    assert.equal(JSON.stringify(result).includes(privateText),false);
});

test('credentials and GitHub context fail before any request or POST',async()=>{
  for(const mutate of [f=>{delete f.input.env.VERCEL_TOKEN;},f=>{delete f.input.env.GITHUB_TOKEN;}]) {
    const f=fixture();mutate(f);await reject(f.run,'AUTH');assert.equal(f.calls.length,0);
  }
  for(const mutate of [f=>{f.input.env.GITHUB_REPOSITORY='attacker/fork';},f=>{f.input.env.GITHUB_REF='refs/heads/feature';},
    f=>{f.input.env.GITHUB_EVENT_NAME='push';},f=>{f.input.env.GITHUB_WORKFLOW_SHA=other;},f=>{f.input.env.GITHUB_SHA=other;},
    f=>{f.input.event.inputs.source_sha=[sha];},f=>{f.input.event.inputs.ci_attempt='01';},f=>{f.input.event.repository.id=1;}]) {
    const f=fixture();mutate(f);await reject(f.run,'CONTEXT');assert.equal(f.calls.length,0);
  }
});

test('wrong or failed CI, changed canonical files and broken production lock never POST',async()=>{
  for(const runChange of [{conclusion:'failure'},{event:'pull_request'},{head_branch:'feature'},{head_sha:other},{run_attempt:2},
    {repository:{full_name:repo,id:1}},{head_repository:{full_name:'attacker/fork',id:1}}]) {
    const f=fixture({run:runChange});await reject(f.run,'CI');assert.equal(f.postCount(),0);
  }
  const changed=fixture({changedFile:'vercel.json'});await reject(changed.run,'FILES');assert.equal(changed.postCount(),0);
  const unprotected=fixture({production:{can_admins_bypass:true}});await reject(unprotected.run,'PRODUCTION_GUARD');assert.equal(unprotected.postCount(),0);
});

test('Preview requires exact owner approval protection and main-only branches before any provider request',async()=>{
  for(const mutate of [p=>{p.name='Production';},p=>{p.can_admins_bypass=true;},p=>{delete p.can_admins_bypass;},
    p=>{p.protection_rules=[];},p=>{p.protection_rules.push(structuredClone(p.protection_rules[0]));},
    p=>{p.protection_rules[0].prevent_self_review=true;},p=>{p.protection_rules[0].reviewers=[];},
    p=>{p.protection_rules[0].reviewers[0].reviewer.id=1;},p=>{p.protection_rules[0].reviewers[0].reviewer.login='other';},
    p=>{p.protection_rules[0].reviewers[0].type='Team';},p=>{p.deployment_branch_policy.custom_branch_policies=false;},
    p=>{p.deployment_branch_policy.protected_branches=true;}]) {
    const f=fixture({preview:mutate});await reject(f.run,'PREVIEW_GUARD');assert.equal(f.postCount(),0);
    assert.equal(f.calls.some(call=>new URL(call.url).hostname==='api.vercel.com'),false);
  }
  for(const branches of [[],[{name:'*',type:'branch'}],[{name:'main',type:'tag'}],[{name:'main',type:'branch'},{name:'feature',type:'branch'}]]) {
    const f=fixture({previewBranches:branches});await reject(f.run,'PREVIEW_GUARD');assert.equal(f.postCount(),0);
  }
  assert.equal((await fixture({preview:p=>{p.name='preview';}}).run()).status,'READY');
});

test('project identity, repo ID, system env, framework and root must all be proved before POST',async()=>{
  for(const mutate of [p=>{p.id='prj_other';},p=>{p.name='other';},p=>{p.framework='nextjs';},p=>{p.rootDirectory='src';},
    p=>{delete p.autoExposeSystemEnvs;},p=>{p.autoExposeSystemEnvs=false;},p=>{delete p.link.repoId;},
    p=>{p.link.repoId=String(repoId);},p=>{p.link.type='gitlab';},p=>{p.link.productionBranch='other';},p=>{delete p.alias;}]) {
    const f=fixture({project:mutate});await reject(f.run,'PROJECT');assert.equal(f.postCount(),0);
  }
});

test('live main is checked initially, immediately before create, and after terminal',async()=>{
  for(const [shas,posts] of [[[other],0],[[sha,other],0],[[sha,sha,other],1]]) {
    const f=fixture({mainShas:shas});await reject(f.run,'SOURCE');assert.equal(f.postCount(),posts);assert.equal(f.stages.includes('COMPLETE'),false);
  }
});

test('owner deployment needs explicit null target, exact project/source/meta and supported state',async()=>{
  for(const mutate of [d=>{delete d.target;},d=>{d.target='production';},d=>{d.projectId='other';},d=>{delete d.gitSource.sha;},
    d=>{d.gitSource.sha=other;},d=>{d.meta.githubCommitSha=other;},d=>{d.gitSource.repoId=1;},d=>{d.gitSource.ref='other';},
    ...['ERROR','BLOCKED','CANCELED','UNKNOWN'].map(state=>d=>{d.readyState=state;})]) {
    const f=fixture({deployment:mutate});await reject(f.run,'DEPLOYMENT');assert.equal(f.postCount(),1);
  }
});

test('bounded polling and ambiguous POST failure never create a second deployment',async()=>{
  const pending=fixture({states:['BUILDING']});await reject(pending.run,'TIMEOUT');assert.equal(pending.postCount(),1);
  const failed=fixture({postError:new Error('SYNTHETIC_PRIVATE_TRANSPORT')});await reject(failed.run,'API');assert.equal(failed.postCount(),1);
});

test('routing/target/alias presence and declared protection drift cannot report success',async()=>{
  for(const mutate of [p=>{p.alias[0].deployment.id='dpl_other';},p=>{p.alias[0].domain='other.vercel.app';},
    p=>{p.alias[0].target='PREVIEW';},p=>{p.alias[0].environment='preview';},p=>{p.alias[0].target=null;},p=>{p.alias[0].environment=null;},
    p=>{p.alias[0].target='PREVIEW';p.alias[0].environment='preview';},p=>{p.targets.production.id='dpl_other';},
    p=>{delete p.targets.production.alias;},p=>{p.targets.production.alias=[];},p=>{p.targets.production.alias=['other.vercel.app'];},
    p=>{delete p.targets.production;},p=>{p.targets.production=null;}]) {
    const f=fixture({project:(p,count)=>{if(count===2)mutate(p);}});await reject(f.run,'ROUTING');assert.equal(f.postCount(),1);
  }
  for(const mutate of [p=>{p.ssoProtection={deploymentType:'all'};},p=>{p.optionsAllowlist=null;},p=>{delete p.protectionBypass;}]) {
    const f=fixture({project:(p,count)=>{if(count===2)mutate(p);}});await reject(f.run,'PROTECTION');
  }
  for(const productionTarget of [undefined,null]) {
    const f=fixture({project:p=>{delete p.rootDirectory;p.alias=[];if(productionTarget===undefined)delete p.targets;else p.targets.production=null;}});
    assert.equal((await f.run()).status,'READY');
  }
});

test('new and changed explicit Preview/staging aliases do not falsely change production routing',async()=>{
  for(const change of ['new','update']) {
    const f=fixture({project:(p,count)=>{
      if(change==='update'||count===2)p.alias.push({domain:count===2?'changed-preview.vercel.app':'old-preview.vercel.app',
        environment:'preview',target:count===2?'STAGING':'PREVIEW',deployment:{id:count===2?'dpl_newPreview':'dpl_oldPreview'},
        redirect:count===2?'new-preview.vercel.app':null,redirectStatusCode:count===2?308:null,gitBranch:count===2?'new-branch':'old-branch'});
    }});
    const result=await f.run();assert.equal(result.productionRoutingUnchanged,true);assert.equal(f.postCount(),1);
  }
  for(const bad of [{domain:'preview.vercel.app',environment:'preview',target:'PRODUCTION',deployment:null},
    {domain:'preview.vercel.app',environment:'production',target:'STAGING',deployment:null},
    {domain:'preview.vercel.app',environment:'production',target:'PREVIEW',deployment:null},
    {domain:'preview.vercel.app',environment:'preview',deployment:{id:'malformed'}},
    {domain:'preview.vercel.app',environment:'preview',target:123,deployment:null}]) {
    const f=fixture({project:p=>{p.alias.push(bad);}});
    await reject(f.run,bad.target==='PRODUCTION'||bad.environment==='production'?'ROUTING':'PROJECT');assert.equal(f.postCount(),0);
  }
});

test('ambiguous aliases remain pinned, including unknown mixed signals and presence changes',async()=>{
  for(const alias of [{domain:'unknown.vercel.app',deployment:null},
    {domain:'unknown.vercel.app',environment:null,target:null,deployment:{id:null}},
    {domain:'unknown.vercel.app',environment:'custom-unknown',target:'PREVIEW',deployment:null},
    {domain:'unknown.vercel.app',environment:'preview',target:'preview',deployment:null}]) {
    for(const change of ['domain','deployment','presence']) {
      const f=fixture({project:(p,count)=>{const route=structuredClone(alias);p.alias.push(route);if(count===2){
        if(change==='domain')route.domain='changed-unknown.vercel.app';
        if(change==='deployment')route.deployment={id:'dpl_changedUnknown'};
        if(change==='presence'){if(Object.hasOwn(route,'environment'))delete route.environment;else route.environment=null;}
      }}});
      await reject(f.run,'ROUTING');assert.equal(f.postCount(),1);
    }
  }
  const newlyAmbiguous=fixture({project:(p,count)=>{if(count===2)p.alias.push({domain:'new-unknown.vercel.app',deployment:null});}});
  await reject(newlyAmbiguous.run,'ROUTING');assert.equal(newlyAmbiguous.postCount(),1);
});

test('production and ambiguous routes pin redirect, status and branch presence/null/value',async()=>{
  for(const route of [{environment:'production',target:'PRODUCTION'},{}]) {
    for(const [field,first,second] of [['redirect',null,'other.vercel.app'],['redirect','old.vercel.app','other.vercel.app'],
      ['redirectStatusCode',null,307],['redirectStatusCode',301,308],['gitBranch',null,'other'],['gitBranch','main','other']]) {
      for(const mode of ['change','add','remove']) {
        const f=fixture({project:(p,count)=>{Object.assign(p.alias[0],route);if(!Object.hasOwn(route,'environment')){
          delete p.alias[0].environment;delete p.alias[0].target;}
          if(mode!=='add'||count===2)p.alias[0][field]=count===2?second:first;
          if(mode==='remove'&&count===2)delete p.alias[0][field];
        }});
        await reject(f.run,'ROUTING');assert.equal(f.postCount(),1);
      }
    }
  }
  for(const status of [301,302,307,308,null])assert.equal((await fixture({project:p=>{p.alias[0].redirectStatusCode=status;}}).run()).status,'READY');
});

test('all alias records validate routing field types before non-production filtering',async()=>{
  for(const fields of [{redirect:[]},{redirect:'x\nprivate'},{gitBranch:{}},{gitBranch:'x'.repeat(2049)},
    {redirectStatusCode:'307'},{redirectStatusCode:[307]},{redirectStatusCode:303},{redirectStatusCode:307.5}]) {
    const f=fixture({project:p=>{p.alias.push({domain:'preview.vercel.app',environment:'preview',target:'PREVIEW',deployment:null,...fields});}});
    await reject(f.run,'PROJECT');assert.equal(f.postCount(),0);
  }
});

test('only safe https vercel.app URL is emitted; HTTP access is not an app smoke claim',async()=>{
  for(const url of ['https://attacker.invalid','http://a.vercel.app','https://a.vercel.app@attacker.invalid',
    'https://a.vercel.app/private?token=SYNTHETIC_PRIVATE','https://a.vercel.app:444','a.vercel.app\n']) {
    const f=fixture({deployment:d=>{d.url=url;}});await reject(f.run,'DEPLOYMENT');
  }
});

test('response caps and raw/private transport errors produce only finite public errors',async()=>{
  for(const transport of [async()=>new Response(new Uint8Array(2*1024*1024+1)),
    async()=>new Response('SYNTHETIC_PRIVATE',{status:403}),async()=>{throw new Error('SYNTHETIC_PRIVATE');},
    async()=>{throw Object.assign(new Error('SYNTHETIC_PRIVATE'),{code:'FRONTEND_PREVIEW_API'});}]) {
    const f=fixture({transport});await reject(f.run,'API');assert.equal(f.postCount(),0);
  }
});

test('functional build accepts only the complete pinned public group and isolates its child environment',()=>{
  const inherited={VERCEL_ENV:'preview',PATH:'/usr/bin',HOME:'/private',TZ:'UTC',...functionalGroup,
    VERCEL_TOKEN:'SYNTHETIC_PRIVATE',GITHUB_TOKEN:'SYNTHETIC_PRIVATE',NODE_OPTIONS:'--import=private',
    VITE_DATA_MODE:'mock',VITE_SUPABASE_URL:'https://old.invalid',VITE_SUPABASE_ANON_KEY:'old-private',
    VITE_EXTRA:'old-private',POS_OTHER_SECRET:'private',NPM_TOKEN:'private'};
  const wanted={PATH:'/usr/bin',HOME:'/private',TZ:'UTC',VITE_DATA_MODE:'supabase',VITE_SUPABASE_URL:supabaseUrl,VITE_SUPABASE_ANON_KEY:publishableKey};
  assert.deepEqual(previewBuildEnvironment(inherited),wanted);
  assert.equal(buildPreview(inherited,(_command,_args,options)=>{assert.deepEqual(options.env,wanted);return {status:0};}),true);
  for(const mutate of [e=>{delete e.POS_PREVIEW_DATA_MODE;},e=>{delete e.POS_PREVIEW_SUPABASE_URL;},
    e=>{delete e.POS_PREVIEW_SUPABASE_PUBLISHABLE_KEY;},e=>{e.POS_PREVIEW_EXTRA='private';},e=>{e.pos_preview_data_mode='supabase';},
    e=>{e.POS_PREVIEW_DATA_MODE='mock';},e=>{e.POS_PREVIEW_DATA_MODE='unknown';},
    ...['https://kfqjdfwxhkdwihjobpny.supabase.co',supabaseUrl+'/',supabaseUrl+'?x=1','http://ineckiashpwloncxnbqx.supabase.co',
      supabaseUrl+'.attacker.invalid'].map(url=>e=>{e.POS_PREVIEW_SUPABASE_URL=url;}),
    ...['eyJhbGciOiJIUzI1NiJ9.private.signature','sb_secret_SYNTHETIC_PRIVATE_0123456789','service_role',publishableKey+'\n',
      publishableKey+' private','sb_publishable_'].map(key=>e=>{e.POS_PREVIEW_SUPABASE_PUBLISHABLE_KEY=key;})]) {
    const changed={...inherited};mutate(changed);let calls=0;
    assert.throws(()=>buildPreview(changed,()=>{calls++;return {status:0};}),error=>error.code==='FRONTEND_PREVIEW_CONFIG'&&error.message===error.code);
    assert.equal(calls,0);
  }
  assert.deepEqual(previewBuildEnvironment({VERCEL_ENV:'preview',POS_OTHER_SECRET:'private'}),
    {VITE_DATA_MODE:'mock',VITE_SUPABASE_URL:'',VITE_SUPABASE_ANON_KEY:''});
});

test('provider config requires a complete unpaginated list and never reads old VITE values',()=>{
  const oldRow={key:'VITE_SUPABASE_ANON_KEY',get value(){assert.fail('Legacy value must remain unread');}};
  assert.equal(previewProjectConfiguration([oldRow],'mock').dataMode,'mock');
  const first=previewProjectConfiguration(functionalRows(),'supabase');
  assert.equal(first.projectRef,'ineckiashpwloncxnbqx');assert.match(first.configurationSha256,/^[a-f0-9]{64}$/);
  assert.equal(previewProjectConfiguration({envs:functionalRows().reverse()},'supabase').configurationSha256,first.configurationSha256);
  for(const payload of [null,{},[],{envs:[]},{envs:functionalRows(),pagination:{next:123}},{envs:functionalRows(),next:null},
    {envs:functionalRows(),total:4},{envs:functionalRows(),partial:false},{envs:functionalRows(),sharedEnvs:[]},
    {envs:{}},[null],[{key:1}],Array.from({length:257},()=>({key:'UNRELATED'}))])
    assert.throws(()=>previewProjectConfiguration(payload,'supabase'),error=>error.code==='FRONTEND_PREVIEW_CONFIG');
});

test('documented full Vercel envelopes accept zero hidden rows and one complete pagination page',async()=>{
  const rows=functionalRows().map((row,i)=>({...row,id:'env_synthetic_'+i,createdAt:1700000000000,updatedAt:1700000000000,
    createdBy:'synthetic-owner',updatedBy:null,securityIssues:[],decrypted:false,system:false,customEnvironmentIds:[],configurationId:null}));
  const expected=previewProjectConfiguration(rows,'supabase');
  for(const envResponse of [{envs:rows,hiddenProductionEnvCount:0},{envs:rows,pagination:{count:3,next:null,prev:null}}]){
    assert.equal(previewProjectConfiguration(envResponse,'supabase').configurationSha256,expected.configurationSha256);
    const f=fixture({dataMode:'supabase',envResponse}),result=await f.run();
    assert.equal(result.status,'READY');assert.equal(result.dataMode,'supabase');assert.equal(f.postCount(),1);
  }
  for(const payload of [{envs:[],hiddenProductionEnvCount:0},{envs:[],pagination:{count:0,next:null,prev:null}}])
    assert.equal(previewProjectConfiguration(payload,'mock').dataMode,'mock');
  const bounded=[...rows,...Array.from({length:253},(_,i)=>({key:'UNRELATED_'+i}))];
  assert.equal(previewProjectConfiguration({envs:bounded,pagination:{count:256,next:null,prev:null}},'supabase').configurationSha256,
    expected.configurationSha256);
  for(const decrypted of ['false',null,0]){
    const invalid=structuredClone(rows);invalid[0].decrypted=decrypted;
    assert.throws(()=>previewProjectConfiguration({envs:invalid,hiddenProductionEnvCount:0},'supabase'),error=>error.code==='FRONTEND_PREVIEW_CONFIG');
  }
});

test('hidden, partial, inconsistent or malformed provider envelopes fail before any deployment',async()=>{
  const rows=functionalRows(),complete={count:3,next:null,prev:null};
  const invalid=[...[1,-1,0.5,'0',null,false].map(hiddenProductionEnvCount=>({envs:rows,hiddenProductionEnvCount})),
    {envs:rows,hiddenProductionEnvCount:0,unknown:false},{envs:rows,hiddenProductionEnvCount:0,pagination:complete},
    ...[null,{},[],{next:null},{count:3,next:null},
      {...complete,next:1700000000000},{...complete,prev:1700000000000},{...complete,count:2},
      {...complete,count:4},{...complete,count:-1},{...complete,count:3.5},{...complete,count:'3'},
      {...complete,count:257},{...complete,next:false},{...complete,prev:0},{...complete,total:3}].map(pagination=>({envs:rows,pagination})),
    {envs:Array.from({length:257},(_,i)=>({key:'UNRELATED_'+i})),pagination:{count:257,next:null,prev:null}}];
  for(const envResponse of invalid){
    const f=fixture({dataMode:'supabase',envResponse});await reject(f.run,'CONFIG');assert.equal(f.postCount(),0);
    assert.equal(f.calls.some(call=>new URL(call.url).hostname.endsWith('.supabase.co')),false);
  }
});

test('functional provider rows deny duplicate, secret, branch, production, shared and custom overrides before deployment',async()=>{
  const mutations=[rows=>{rows.pop();},rows=>{rows.push({...rows[0]});},rows=>{rows.push({...rows[0],target:['production']});},
    rows=>{rows.push({key:'POS_PREVIEW_UNKNOWN',value:'private',type:'plain',target:['preview']});},
    rows=>{rows[0].key='pos_preview_data_mode';},rows=>{rows[0].value='mock';},rows=>{rows[1].value='https://other.supabase.co';},
    rows=>{rows[2].value='sb_secret_SYNTHETIC_PRIVATE_0123456789';},rows=>{rows[2].value='eyJ.private.signature';},
    ...['encrypted','sensitive','secret','system'].map(type=>rows=>{rows[0].type=type;}),
    rows=>{rows[0].visibility='secret';},rows=>{rows[0].target='preview';},rows=>{rows[0].target=['preview','production'];},
    rows=>{rows[0].target=['development'];},rows=>{rows[0].target=[];},rows=>{delete rows[0].target;},
    rows=>{rows[0].gitBranch='main';},rows=>{rows[0].customEnvironmentIds=['env_custom'];},rows=>{rows[0].system=true;},
    rows=>{rows[0].decrypted=true;},rows=>{rows[0].configurationId='shared-configuration';},
    rows=>{rows[0].sharedEnvironmentVariableIds=['shared'];},rows=>{rows[0].source='shared';},
    rows=>{rows[0].edgeConfigId='edge';},rows=>{rows[0].securityIssues=['issue'];}];
  for(const mutate of mutations){
    const rows=functionalRows();mutate(rows);const f=fixture({dataMode:'supabase',envRows:rows});
    await reject(f.run,'CONFIG');assert.equal(f.postCount(),0);
    assert.equal(f.calls.some(call=>new URL(call.url).hostname.endsWith('.supabase.co')),false);
  }
});

test('data_mode is an exact expectation and cannot switch provider config or relax legacy mock mode',async()=>{
  for(const dataMode of ['unknown','SUPABASE',null,['supabase']]){
    const f=fixture({dataMode});await reject(f.run,'CONTEXT');assert.equal(f.calls.length,0);
  }
  const extra=fixture();extra.input.event.inputs.env={};await reject(extra.run,'CONTEXT');assert.equal(extra.calls.length,0);
  for(const options of [{envRows:functionalRows()},{dataMode:'mock',envRows:functionalRows()},{dataMode:'supabase'}]){
    const f=fixture(options);await reject(f.run,'CONFIG');assert.equal(f.postCount(),0);
  }
  for(const options of [{},{dataMode:'mock'}]){
    const f=fixture(options),result=await f.run();assert.equal(result.dataMode,'mock');assert.equal(result.supabaseProjectRef,null);
    assert.equal(result.authReadiness,'NOT_RUN');assert.equal(result.permissionContractReadiness,'NOT_RUN');
    assert.equal(f.calls.some(call=>new URL(call.url).hostname.endsWith('.supabase.co')),false);
  }
});

test('functional Preview checks public readiness before its one minimal Vercel POST and exposes only safe receipts',async()=>{
  const f=fixture({dataMode:'supabase',envResponse:functionalRows()}),result=await f.run();
  const publicCalls=f.calls.filter(call=>new URL(call.url).hostname==='ineckiashpwloncxnbqx.supabase.co');
  assert.equal(publicCalls.length,2);assert.equal(f.postCount(),1);
  assert.deepEqual(publicCalls.map(call=>[new URL(call.url).pathname,call.method]),
    [['/auth/v1/settings','GET'],['/rest/v1/rpc/permission_get_contract','POST']]);
  assert.deepEqual(publicCalls[0].headers,{apikey:publishableKey});assert.equal(publicCalls[0].body,undefined);
  assert.deepEqual(publicCalls[1].headers,{apikey:publishableKey,'Content-Type':'application/json','x-pos-permission-contract':'2'});
  assert.equal(publicCalls[1].body,'{}');
  const deploymentPost=f.calls.find(call=>new URL(call.url).hostname==='api.vercel.com'&&call.method==='POST');
  assert.ok(f.calls.indexOf(deploymentPost)>f.calls.indexOf(publicCalls[1]));
  assert.deepEqual(JSON.parse(deploymentPost.body),{name:'pos-cafe',project:projectId,gitSource:{type:'github',repoId,ref:'main',sha}});
  for(const call of f.calls){
    const host=new URL(call.url).hostname,headers=JSON.stringify(call.headers);
    assert.equal(headers.includes('SYNTHETIC_GH_TOKEN'),host==='api.github.com');
    assert.equal(headers.includes('SYNTHETIC_VERCEL_TOKEN'),host==='api.vercel.com');
    assert.equal(headers.includes(publishableKey),host==='ineckiashpwloncxnbqx.supabase.co');
    assert.equal(call.redirect,'error');assert.ok(call.signal instanceof AbortSignal);
  }
  assert.equal(result.dataMode,'supabase');assert.equal(result.supabaseProjectRef,'ineckiashpwloncxnbqx');
  assert.equal(result.authReadiness,'PASS');assert.equal(result.permissionContractReadiness,'PASS');
  assert.equal(result.applicationSmoke,'NOT_RUN');assert.equal(result.httpStatus,null);assert.match(result.configurationSha256,/^[a-f0-9]{64}$/);
  for(const value of [publishableKey,'SYNTHETIC_GH_TOKEN','SYNTHETIC_VERCEL_TOKEN','SYNTHETIC_PRIVATE_BYPASS'])assert.equal(JSON.stringify(result).includes(value),false);
});

test('Auth or contract incompatibility and bounded public transport failures prevent deployment without retry',async()=>{
  for(const options of [{authSettings:{mailer_autoconfirm:false}},{authSettings:{disable_signup:true}},{authSettings:{external:{email:false}}},
    {authSettings:{mailer_autoconfirm:'true'}},{authSettings:{disable_signup:undefined}},{authSettings:{external:{}}},
    {contract:{permissionContractVersion:1}},{contract:{writeProtocolVersion:2}},{contract:{writeProtocolVersion:'1'}},
    {publicDelayMs:30001},
    ...[async()=>new Response('SYNTHETIC_PRIVATE',{status:403}),async()=>new Response(null,{status:302,headers:{location:'https://attacker.invalid'}}),
      async()=>new Response(new Uint8Array(2*1024*1024+1)),async()=>{throw new Error('SYNTHETIC_PRIVATE');}].map(publicTransport=>({publicTransport}))]){
    const f=fixture({dataMode:'supabase',envRows:functionalRows(),...options});await reject(f.run,'READINESS');assert.equal(f.postCount(),0);
    const publicCalls=f.calls.filter(call=>new URL(call.url).hostname.endsWith('.supabase.co'));assert.ok(publicCalls.length<=2);
    assert.equal(f.stages.includes('CREATE'),false);
  }
});

test('post-READY config drift cannot report success or trigger another deployment',async()=>{
  for(const mutate of [rows=>{rows[2].value='sb_publishable_SYNTHETIC_ROTATED_0123456789';},rows=>{rows[0].target=['production'];},
    rows=>{rows.pop();},rows=>{rows[0].comment='changed';},rows=>{rows[0].visibility=undefined;}]){
    const f=fixture({dataMode:'supabase',envRows:functionalRows(),environment:(data,count)=>{if(count===2)mutate(data.envs);}});
    await reject(f.run,'CONFIG');assert.equal(f.postCount(),1);assert.equal(f.stages.includes('COMPLETE'),false);
  }
  const noRetry=fixture({dataMode:'supabase',envRows:functionalRows(),postError:new Error('SYNTHETIC_PRIVATE_UNKNOWN_OUTCOME')});
  await reject(noRetry.run,'API');assert.equal(noRetry.postCount(),1);
});
