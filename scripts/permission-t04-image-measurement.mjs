// Synthetic T04 only. No client, browser, database or network is opened at import.
import {createHash,randomUUID} from 'node:crypto';
import {readFileSync,realpathSync,lstatSync} from 'node:fs';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';

const API='http://127.0.0.1:62421',BUCKET='menu-item-image-staging';
const STORES=Object.freeze(['10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002']);
const EMPLOYEE='20000000-0000-4000-8000-000000000001';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const BINDING=Object.freeze(['sourceSHA','sourceFingerprint','lockSHA','runId','attempt','physicalBackendSHA']);
// The parent independently binds workflowSHA; this helper has six binding fields.
const OBSERVATIONS=Object.freeze(['publication','pngDecoded','origin200','origin304','warmCache','storageOrdinary503',
 'storageConditional503','lookupOrdinary503','lookupConditional503','freshAfterUnlink404','cache59Observed',
 'cache60Denied','cache61Denied','uploadProbeBypassed','uploadMetadata503','uploadStillUploading',
 'uploadNotPublished','uploadPreviousBindingPreserved','cleanupGateway503','cleanupDiscarded',
 'cleanupMetadataPreserved','cleanupBytesPreserved','cleanupControlDeleted','faultSentinelsPreserved']);
const RESTORATION=Object.freeze(['faultsRemoved','lookupAclRestored','catalogRestored','ownedStorageRemoved',
 'sentinelsPreserved','employeeSessionRevoked','browserClosed','physicalUnchanged']);
export const IMAGE_OBSERVATION_KEYS=OBSERVATIONS;
export const IMAGE_RESTORATION_KEYS=RESTORATION;
const TIMING=Object.freeze(['target59Ms','target60Ms','target61Ms','observed59Ms','observed60Ms','observed61Ms']);
const hash=value=>createHash('sha256').update(value).digest('hex');
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const exact=(value,keys)=>value!==null&&typeof value==='object'&&!Array.isArray(value)
 &&equal(Object.keys(value).sort(),[...keys].sort());
const refuse=()=>{throw Error('PERMISSION_T04_IMAGE_MEASUREMENT_REFUSED');};
const check=value=>{if(!value)refuse();};
export const T04_IMAGE_MEASUREMENT_FIELDS=Object.freeze({binding:BINDING,observations:OBSERVATIONS,restoration:RESTORATION,timing:TIMING});
function validBinding(binding){
 check(exact(binding,BINDING));
 for(const key of ['sourceFingerprint','lockSHA','physicalBackendSHA'])check(typeof binding[key]==='string'&&/^[a-f0-9]{64}$/.test(binding[key]));
 check(typeof binding.sourceSHA==='string'&&/^[a-f0-9]{40}$/.test(binding.sourceSHA));
 check(typeof binding.runId==='string'&&/^[1-9][0-9]{0,19}$/.test(binding.runId));
 check(Number.isSafeInteger(binding.attempt)&&binding.attempt>=1&&binding.attempt<=1000);
}
export function validateT04ImageMeasurement(receipt,binding){
 check(exact(receipt,['schemaVersion','scope','status','execution','binding','observations','timing','restoration','uploadOrphanStatus']));
 check(receipt.schemaVersion==='permission-t04-image-measurement-v1'&&receipt.scope==='SYNTHETIC_T04_IMAGE_ONLY'
  &&receipt.status==='PASS'&&receipt.execution==='RUNTIME'&&receipt.uploadOrphanStatus==='QUEUE_CLEANUP_UNCERTAIN');
 validBinding(receipt.binding);
 check(binding!==null&&typeof binding==='object'&&!Array.isArray(binding)&&Object.keys(binding).length>0);
 for(const [key,value] of Object.entries(binding))check(BINDING.includes(key)&&receipt.binding[key]===value);
 for(const [key,fields] of [['observations',OBSERVATIONS],['restoration',RESTORATION]])
  check(exact(receipt[key],fields)&&fields.every(field=>receipt[key][field]===true));
 check(exact(receipt.timing,TIMING)&&TIMING.every(k=>Number.isSafeInteger(receipt.timing[k])&&receipt.timing[k]>=0&&receipt.timing[k]<=180000));
 for(const second of [59,60,61])check(receipt.timing['target'+second+'Ms']===second*1000
  &&receipt.timing['observed'+second+'Ms']>=second*1000&&receipt.timing['observed'+second+'Ms']<second*1000+750);
 check(receipt.timing.observed59Ms<receipt.timing.observed60Ms&&receipt.timing.observed60Ms<receipt.timing.observed61Ms);
 return true;
}
function sourceFacts(root){
 check(process.platform==='linux'&&process.getuid?.()===0&&typeof root==='string'&&root.startsWith('/')
  &&root===realpathSync(root)&&process.cwd()===join(root,'source'));
 const source=join(root,'source'),git=args=>execFileSync('git',['-c',`safe.directory=${source}`,'-C',source,...args],
  {encoding:'utf8',timeout:10000,maxBuffer:8*1024**2,stdio:['ignore','pipe','pipe']});
 const sourceSHA=git(['rev-parse','HEAD']).trim();check(git(['diff','--name-only','HEAD','--']).trim()==='');
 const paths=git(['ls-files','-z']).split('\0').filter(Boolean).sort();check(paths.includes('scripts/permission-t04-image-measurement.mjs'));
 for(const path of paths){check(!path.split('/').some(p=>p==='..'||p==='.')&&!path.startsWith('/')&&!path.includes('\\'));
  const info=lstatSync(join(source,path));check(info.isFile()&&!info.isSymbolicLink());}
 return {sourceSHA,sourceFingerprint:hash(paths.map(path=>path+'\0'+hash(readFileSync(join(source,path)))+'\0').join('')),
  lockSHA:hash(readFileSync(join(source,'package-lock.json')))};
}
function tokenClaims(value,role,now,store){
 check(typeof value==='string'&&value.length<=16384&&/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value));
 const body=JSON.parse(Buffer.from(value.split('.')[1],'base64url'));check(body.role===role&&Number.isSafeInteger(body.exp)&&body.exp*1000>now+225000);
 if(store)check(body.sub===store);
}
function owned(row){
 check(row&&STORES.includes(row.store_id)&&UUID.test(row.item_id)&&UUID.test(row.upload_handle)
  &&['image/png','image/jpeg','image/webp'].includes(row.mime_type));
 const ext={'image/png':'png','image/jpeg':'jpg','image/webp':'webp'}[row.mime_type];
 check(row.object_key===`${row.store_id}/menu-items/${row.item_id}/${row.upload_handle}.${ext}`);
 return row;
}
const imageBytes=()=>Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64');
const emptyMenu=()=>Object.fromEntries(['categories','menuItems','optionGroups','optionValues','menuItemOptionGroups'].map(k=>[k,{created:[],updated:[],deleted:[]} ]));

/** Overrides exist for unit fault/guard controls only. They cannot produce a runtime receipt. */
export async function runT04ImageMeasurement(options,overrides){
 const now=overrides?.now??Date.now,mono=overrides?.monotonic??(()=>performance.now());
 let admitted=false,cleanup,receipt,failure,phase=1,cleanupAttempted=0,cleanupFailed=0;
 try{
  check(options&&typeof options.guard==='function'&&typeof options.physical==='function'&&typeof options.db?.query==='function');
  check(options.api===API&&equal(options.storeIds,STORES)&&options.employeeId===EMPLOYEE);
  validBinding(options.binding);
  check(Number.isSafeInteger(options.deadline)&&Number.isSafeInteger(now())&&options.deadline-now()>=225000);
  check(typeof options.root==='string'&&options.root.startsWith('/')&&!/[\r\n\0\\]/.test(options.root)
   &&!options.root.split('/').some(p=>p==='.'||p==='..')&&!options.root.endsWith('/'));
  tokenClaims(options.anonKey,'anon',now());tokenClaims(options.storeJwt,'authenticated',now(),STORES[0]);tokenClaims(options.serviceKey,'service_role',now());
  await options.guard();
  const facts=await (overrides?.sourceFacts??sourceFacts)(options.root);
  check(exact(facts,['sourceSHA','sourceFingerprint','lockSHA']));
  for(const key of Object.keys(facts))check(facts[key]===options.binding[key]);
  check(await options.physical()===options.binding.physicalBackendSHA);
  check(options.deadline-now()>=225000);await options.guard();
  const admittedAt=now(),measurementEnd=Math.min(admittedAt+180000,options.deadline-45000);
  const gate=async(cleaning=false)=>{await options.guard();check(now()<(cleaning?options.deadline:measurementEnd));
   check(await options.physical()===options.binding.physicalBackendSHA);
   check(now()<(cleaning?options.deadline:measurementEnd));};
  const effects=overrides?.effects??createRuntimeEffects;
  phase=2;const runtime=await effects(options,{now,mono,gate,measurementEnd});cleanup=runtime.close;admitted=true;
  phase=3;
  const result=await runtime.measure();
  phase=4;cleanupAttempted=1;let restored;
  try{restored=await runtime.close();}catch(error){cleanupFailed=1;throw error;}cleanup=undefined;
  phase=5;receipt={schemaVersion:'permission-t04-image-measurement-v1',scope:'SYNTHETIC_T04_IMAGE_ONLY',status:'PASS',
   execution:overrides?'UNIT_SIMULATION':'RUNTIME',binding:{...options.binding},observations:result.observations,timing:result.timing,
   restoration:restored,uploadOrphanStatus:'QUEUE_CLEANUP_UNCERTAIN'};
  validateT04ImageMeasurement({...receipt,execution:'RUNTIME'},options.binding);
  // The public validator always rejects simulated receipts.
  if(!overrides)validateT04ImageMeasurement(receipt,options.binding);
  return receipt;
 }catch{failure=Object.assign(Error(admitted?'PERMISSION_T04_IMAGE_MEASUREMENT_FAILED':'PERMISSION_T04_IMAGE_MEASUREMENT_REFUSED'),
  {t04ImageMeasurementPhaseOrdinal:phase});throw failure;}
 finally{if(cleanup){cleanupAttempted=1;try{await cleanup();}catch{cleanupFailed=1;}}
  if(failure)Object.assign(failure,{t04ImageMeasurementCleanupAttempted:cleanupAttempted,t04ImageMeasurementCleanupFailed:cleanupFailed});}
}

async function createRuntimeEffects(o,{now,mono,gate,measurementEnd}){
 let cleaning=false,browser,context,sessionToken='',closed=false,lookupRevoked=false,lookupOriginal,storageMissing;
 const uploads=[],entry=[],createdItems=[],faults=new Set(),observations=Object.fromEntries(OBSERVATIONS.map(k=>[k,false]));
 const restoration=Object.fromEntries(RESTORATION.map(k=>[k,false]));
 let baselineObjects,baselineCatalog,baselineSentinels;
 const q=async(sql,args=[])=>{await gate(cleaning);
  // The parent lends its existing <=10s statement-timeout client. Never start a
  // query that can consume the following phase's reserved time.
  check(now()+10000<(cleaning?o.deadline:measurementEnd));return o.db.query(sql,args);};
 const rows=async(sql,args)=>(await q(sql,args)).rows;
 const req=async(path,init={})=>{await gate(cleaning);check(path.startsWith('/')&&!path.includes('..')&&!/[\r\n\0]/.test(path));
  return fetch(API+path,{...init,redirect:'error',signal:AbortSignal.timeout(Math.max(1,Math.min(10000,(cleaning?o.deadline:measurementEnd)-now())))});};
 const auth=()=>({apikey:o.anonKey,Authorization:'Bearer '+o.storeJwt,'x-pos-employee-token':sessionToken,'x-pos-permission-contract':'2'});
 const service=()=>({apikey:o.serviceKey,Authorization:'Bearer '+o.serviceKey});
 const rpc=async(name,body)=>{check(['permission_start_session','permission_revoke_session','apply_menu_changes'].includes(name));
  const r=await req('/rest/v1/rpc/'+name,{method:'POST',headers:{...auth(),'Content-Type':'application/json'},body:JSON.stringify(body)});
  check(r.ok);const result=await r.json();check(result?.ok===true);return result;};
 const storagePath=row=>'/storage/v1/object/authenticated/'+encodeURIComponent(row.bucket_id??BUCKET)+'/'+(row.name??row.object_key).split('/').map(encodeURIComponent).join('/');
 const bytesHash=async row=>{const r=await req(storagePath(row),{headers:service()});check(r.ok);
  const declared=Number(r.headers.get('content-length'));check(!Number.isFinite(declared)||declared<=5242880);
  const reader=r.body.getReader(),chunks=[];let count=0;for(;;){const part=await reader.read();if(part.done)break;
   count+=part.value.length;if(count>5242880){await reader.cancel();refuse();}chunks.push(part.value);}return hash(Buffer.concat(chunks));};
 const catalog=async()=>rows(`select p.oid::text,p.proacl::text,pg_get_functiondef(p.oid) definition from pg_proc p
  where p.oid='public.permission_menu_image_public_lookup(uuid)'::regprocedure`);
 const sentinel=async()=>{
  const metadata=await rows('select to_jsonb(o) row from storage.objects o where bucket_id<>$1 order by id',[BUCKET]);
  check(metadata.length===6);const result=[];for(const {row} of metadata){check(typeof row.bucket_id==='string'&&typeof row.name==='string'
   &&row.name.length<=500&&!row.name.split('/').some(p=>p==='..'||p==='.')&&!/[\r\n\0\\]/.test(row.name));
   result.push({row,sha:await bytesHash(row)});}return result;
 };
 const registry=async()=>{const result=await rows('select upload_handle,store_id,item_id,object_key,mime_type,state from private.menu_image_uploads order by upload_handle');
  check(result.length<=68);return result.map(owned);};
 const captureNew=async()=>{const current=await registry();for(const row of current)if(!entry.some(x=>x.upload_handle===row.upload_handle)
  &&!uploads.some(x=>x.upload_handle===row.upload_handle)){check(createdItems.includes(row.item_id));uploads.push(row);}check(uploads.length<=4);return current;};
 const upload=async item=>{const form=new FormData();form.set('itemId',item);form.set('file',new File([imageBytes()],'measurement.png',{type:'image/png'}));
  const response=await req('/functions/v1/menu-image-gateway',{method:'POST',headers:auth(),body:form});
  await captureNew();return response;};
 const publish=async(item,handle,create=false)=>{const changes=emptyMenu();changes.imageChanges=[{itemId:item,uploadHandle:handle}];
  if(create){const category=(await rows('select id from public.categories where store_id=$1 and deleted_at is null order by id limit 1',[STORES[0]]))[0];check(UUID.test(category?.id));
   changes.menuItems.created=[{id:item,categoryId:category.id,name:'Synthetic image measurement',price:1000,sortOrder:999,isAvailable:true}];}
  return rpc('apply_menu_changes',{p_changes:changes});};
 const errorResponse=async(response,status,code)=>{check(response.status===status&&response.headers.get('cache-control')==='no-store');
  check((await response.json())?.error?.code===code);};
 const publicGet=async(asset,conditional=false)=>req('/functions/v1/menu-image-public/'+asset,
  {headers:conditional?{'If-None-Match':'"'+asset+'"'}:{}});
 const suffix=hash(o.binding.runId+':'+o.binding.attempt).slice(0,12),names={upload:'t04_image_up_'+suffix,cleanup:'t04_image_del_'+suffix};
 const installFault=async(kind,predicate)=>{
  const name=names[kind];check(['upload','cleanup'].includes(kind)&&/^[a-z0-9_]{1,63}$/.test(name));
  check((await rows('select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname=\'private\' and p.proname=$1',[name])).length===0);
  check((await rows('select 1 from pg_trigger where tgname=$1',[name])).length===0);
  check((await rows("select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='private' and c.relname=any($1::text[])",[ [name+'_probe',name+'_fault'] ])).length===0);
  faults.add(kind);
  await q(`create sequence private.${name}_probe as integer maxvalue 1024 no cycle`);
  await q(`create sequence private.${name}_fault as integer maxvalue 1024 no cycle`);
  // Identifiers and body literals are generated only from checked UUIDs and the fixed bucket.
  // Sequences are nontransactional: a real metadata failure leaves a bounded
  // counter even when Storage rolls its transaction back. The fixed definer
  // function can touch only these owned counters; it accepts no arguments.
  await q(`create function private.${name}() returns trigger language plpgsql security definer set search_path=pg_catalog as $$ begin
   if ${predicate} then
    ${kind==='upload'?`if new.version='1' then perform nextval('private.${name}_probe'::regclass); return new; end if;`:''}
    perform nextval('private.${name}_fault'::regclass);
    raise exception 'T04_OWNED_IMAGE_FAULT' using errcode='P0001'; end if;
   return ${kind==='cleanup'?'old':'new'}; end $$`);
  await q(`revoke all on function private.${name}() from public,anon,authenticated,service_role`);
  await q(`create trigger ${name} before ${kind==='cleanup'?'delete':'insert or update'} on storage.objects
   for each row execute function private.${name}()`);
 };
 const dropFault=async kind=>{if(!faults.has(kind))return;const name=names[kind];
  await q(`drop trigger if exists ${name} on storage.objects`);await q(`drop function if exists private.${name}()`);
  await q(`drop sequence if exists private.${name}_probe,private.${name}_fault`);faults.delete(kind);};
 const faultObserved=async(kind,probe=false)=>{const name=names[kind]+'_'+(probe?'probe':'fault');
  const value=(await rows(`select last_value,is_called from private.${name}`))[0];check(value?.is_called===true&&Number(value.last_value)>=1&&Number(value.last_value)<=1024);};
 const removeOwned=async row=>{owned(row);const r=await req('/storage/v1/object/'+BUCKET,{method:'DELETE',headers:{...service(),'Content-Type':'application/json'},body:JSON.stringify({prefixes:[row.object_key]})});check(r.ok);};
 const close=async()=>{
  if(closed)return restoration;cleaning=true;let failed=false;
  const attempt=async fn=>{try{await fn();}catch{failed=true;}};
  for(const kind of ['upload','cleanup'])await attempt(()=>dropFault(kind));
  await attempt(async()=>{restoration.faultsRemoved=(await rows('select 1 from pg_trigger where tgname=any($1::text[])',[Object.values(names)])).length===0
   &&(await rows('select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname=\'private\' and p.proname=any($1::text[])',[Object.values(names)])).length===0
   &&(await rows("select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='private' and c.relname=any($1::text[])",
    [Object.values(names).flatMap(name=>[name+'_probe',name+'_fault'])])).length===0;check(restoration.faultsRemoved);});
  await attempt(async()=>{if(lookupRevoked){await q('grant execute on function public.permission_menu_image_public_lookup(uuid) to service_role');lookupRevoked=false;}
   restoration.lookupAclRestored=equal(await catalog(),lookupOriginal);check(restoration.lookupAclRestored);});
  if(storageMissing)await attempt(async()=>{const value=storageMissing;check((await q('update private.menu_image_assets set object_key=$1 where asset_key=$2 and object_key=$3',[value.original,value.asset,value.missing])).rowCount===1);storageMissing=undefined;});
  await attempt(async()=>{await captureNew();for(const row of [...entry,...uploads])await removeOwned(row);
   const count=(await rows('select count(*)::int n from storage.objects where bucket_id=$1',[BUCKET]))[0].n;check(count===0);restoration.ownedStorageRemoved=true;});
  await attempt(async()=>{restoration.sentinelsPreserved=equal(await sentinel(),baselineSentinels);check(restoration.sentinelsPreserved);});
  if(sessionToken)await attempt(async()=>{await rpc('permission_revoke_session',{});
   const token=hash(sessionToken),r=await rows('select revoked_at is not null revoked from private.employee_sessions where store_id=$1 and token_hash=decode($2,\'hex\')',[STORES[0],token]);
   check(r.length===1&&r[0].revoked===true);restoration.employeeSessionRevoked=true;});
  await attempt(async()=>{restoration.catalogRestored=equal(await catalog(),baselineCatalog);check(restoration.catalogRestored);});
  await attempt(async()=>{if(browser)await browser.close();restoration.browserClosed=true;});
  await attempt(async()=>{await gate(true);restoration.physicalUnchanged=true;});
  closed=true;check(!failed&&RESTORATION.every(k=>restoration[k]));return restoration;
 };
 return {close,measure:async()=>{
  // Every setup effect lives inside measure so close is registered before it can fail.
  const marker=await rows(`select current_database() db,current_user actor,engine,store_ids,
   (select setting::int from pg_settings where name='statement_timeout') statement_timeout_ms
   from private.idempotency_test_environment where singleton`);
  check(marker.length===1&&marker[0].db==='postgres'&&marker[0].actor==='postgres'&&marker[0].engine==='supabase-identity-v1'
   &&equal(marker[0].store_ids,STORES)&&Number.isSafeInteger(marker[0].statement_timeout_ms)
   &&marker[0].statement_timeout_ms>0&&marker[0].statement_timeout_ms<=10000);
  check(equal((await rows('select id from public.stores order by id')).map(r=>r.id),STORES));
  const buckets=await rows('select public,file_size_limit,allowed_mime_types from storage.buckets where id=$1',[BUCKET]);
  check(buckets.length===1&&buckets[0].public===false&&Number(buckets[0].file_size_limit)===5242880
   &&equal([...(buckets[0].allowed_mime_types??[])].sort(),['image/jpeg','image/png','image/webp']));
  const initial=await registry();check(initial.length<=64);entry.push(...initial);
  baselineObjects=await rows('select to_jsonb(o) row from storage.objects o where bucket_id=$1 order by id',[BUCKET]);
  check(baselineObjects.length<=64&&baselineObjects.every(({row})=>entry.some(e=>e.object_key===row.name)));
  baselineCatalog=await catalog();lookupOriginal=baselineCatalog;check(baselineCatalog.length===1);
  baselineSentinels=await sentinel();
  check(STORES.every(id=>baselineSentinels.some(({row})=>row.name.startsWith(id+'/menu-items/'))));
  const session=await rpc('permission_start_session',{p_employee_id:EMPLOYEE,p_pin:'384729'});
  check(session.kind==='normal'&&typeof session.token==='string'&&/^[A-Za-z0-9_-]{43}$/.test(session.token));sessionToken=session.token;
  // Load only the admitted checkout's already-installed, lock-bound Playwright.
  const {chromium}=await import('@playwright/test');await gate();
  browser=await chromium.launch({channel:'chromium',headless:true,timeout:10000});
  context=await browser.newContext();const page=await context.newPage();await page.setContent('<!doctype html><title>T04 image cache measurement</title>');
  const cdp=await context.newCDPSession(page),events=[];
  cdp.on('Network.requestServedFromCache',e=>events.push({type:'cache',id:e.requestId}));
  cdp.on('Network.responseReceived',e=>events.push({type:'response',id:e.requestId,status:e.response.status,url:e.response.url,
   disk:e.response.fromDiskCache===true,worker:e.response.fromServiceWorker===true}));await cdp.send('Network.enable');
  const browserGet=async asset=>{await gate();const offset=events.length;
   const timeoutMs=Math.max(1,Math.min(10000,measurementEnd-now()));
   const value=await page.evaluate(async ({url,timeoutMs})=>{const requestAt=performance.now();const r=await fetch(url,{signal:AbortSignal.timeout(timeoutMs)});
    const bytes=Array.from(new Uint8Array(await r.arrayBuffer()));
    return {status:r.status,cache:r.headers.get('cache-control'),bytes,requestAt,completedAt:performance.now()};},
    {url:API+'/functions/v1/menu-image-public/'+asset,timeoutMs});
   const observed=events.slice(offset),responses=observed.filter(e=>e.type==='response'&&e.url===API+'/functions/v1/menu-image-public/'+asset);
   check(responses.length===1&&!responses[0].worker);return {...value,cached:responses[0].disk||observed.some(e=>e.type==='cache'&&e.id===responses[0].id)};};
  const main=randomUUID(),failedUpload=randomUUID();createdItems.push(main,failedUpload);
  const uploaded=await upload(main);check(uploaded.status===201);const handle=(await uploaded.json())?.data?.uploadHandle;check(UUID.test(handle));
  await publish(main,handle,true);observations.publication=true;
  const stored=(await registry()).find(r=>r.upload_handle===handle);check(stored?.state==='published');
  const origin=await publicGet(handle);check(origin.status===200&&origin.headers.get('cache-control')==='private, max-age=60, must-revalidate'
   &&origin.headers.get('etag')==='"'+handle+'"'&&hash(Buffer.from(await origin.arrayBuffer()))===hash(imageBytes()));observations.origin200=true;
  const unchanged=await publicGet(handle,true);check(unchanged.status===304&&unchanged.headers.get('cache-control')==='private, max-age=60, must-revalidate');observations.origin304=true;
  // Both ordinary and conditional paths must fail while Storage cannot serve the exact owned asset.
  const missing=`${STORES[0]}/menu-items/${main}/${randomUUID()}.png`;storageMissing={asset:handle,original:stored.object_key,missing};
  check((await q('update private.menu_image_assets set object_key=$1 where asset_key=$2 and object_key=$3',[missing,handle,stored.object_key])).rowCount===1);
  for(const conditional of [false,true]){await errorResponse(await publicGet(handle,conditional),503,'IMAGE_STORAGE_UNAVAILABLE');observations[conditional?'storageConditional503':'storageOrdinary503']=true;}
  check((await q('update private.menu_image_assets set object_key=$1 where asset_key=$2 and object_key=$3',[stored.object_key,handle,missing])).rowCount===1);storageMissing=undefined;
  const privileges=(await rows(`select has_function_privilege('service_role','public.permission_menu_image_public_lookup(uuid)','execute') service,
   has_function_privilege('anon','public.permission_menu_image_public_lookup(uuid)','execute') anon,
   has_function_privilege('authenticated','public.permission_menu_image_public_lookup(uuid)','execute') authenticated`))[0];
  check(privileges.service&&!privileges.anon&&!privileges.authenticated);
  await q('revoke execute on function public.permission_menu_image_public_lookup(uuid) from service_role');lookupRevoked=true;
  check(!(await rows("select has_function_privilege('service_role','public.permission_menu_image_public_lookup(uuid)','execute') value"))[0].value);
  for(const conditional of [false,true]){await errorResponse(await publicGet(handle,conditional),503,'IMAGE_GATEWAY_UNAVAILABLE');observations[conditional?'lookupConditional503':'lookupOrdinary503']=true;}
  await q('grant execute on function public.permission_menu_image_public_lookup(uuid) to service_role');lookupRevoked=false;check(equal(await catalog(),lookupOriginal));
  const boundBefore=await rows('select to_jsonb(m) row from public.menu_items m where store_id=$1 and id=$2',[STORES[0],main]);
  const assetBefore=await rows('select to_jsonb(a) row from private.menu_image_assets a where store_id=$1 and item_id=$2 order by asset_key',[STORES[0],main]);
  check(assetBefore.length===1&&assetBefore[0].row.published===true);
  await installFault('upload',`new.bucket_id='${BUCKET}' and new.name like '${STORES[0]}/menu-items/${failedUpload}/%'`);
  const fault=await upload(failedUpload);await errorResponse(fault,503,'IMAGE_STORAGE_UNAVAILABLE');observations.uploadMetadata503=true;
  const failed=(await registry()).filter(r=>r.item_id===failedUpload);check(failed.length===1&&failed[0].state==='uploading');observations.uploadStillUploading=true;
  await faultObserved('upload',true);await faultObserved('upload');
  observations.uploadProbeBypassed=true;
  check((await rows('select 1 from private.menu_image_assets where upload_handle=$1',[failed[0].upload_handle])).length===0);observations.uploadNotPublished=true;
  check(equal(boundBefore,await rows('select to_jsonb(m) row from public.menu_items m where store_id=$1 and id=$2',[STORES[0],main]))
   &&equal(assetBefore,await rows('select to_jsonb(a) row from private.menu_image_assets a where store_id=$1 and item_id=$2 order by asset_key',[STORES[0],main])));
  observations.uploadPreviousBindingPreserved=true;
  await dropFault('upload');
  const uResponse=await upload(main),cResponse=await upload(main);check(uResponse.status===201&&cResponse.status===201);
  const uHandle=(await uResponse.json()).data.uploadHandle,cHandle=(await cResponse.json()).data.uploadHandle;
  const all=await registry(),u=all.find(r=>r.upload_handle===uHandle),control=all.find(r=>r.upload_handle===cHandle);check(u&&control);
  const uMetadata=await rows('select to_jsonb(o) row from storage.objects o where bucket_id=$1 and name=$2',[BUCKET,u.object_key]);check(uMetadata.length===1);
  const uHash=await bytesHash(u),publishedHash=await bytesHash(stored),s2=await rows('select to_jsonb(a) row from private.menu_image_assets a where store_id=$1 order by asset_key',[STORES[1]]);
  await installFault('cleanup',`old.bucket_id='${BUCKET}' and old.name='${u.object_key}'`);
  await errorResponse(await req('/functions/v1/menu-image-gateway/staging/'+uHandle,{method:'DELETE',headers:auth()}),503,'IMAGE_STORAGE_UNAVAILABLE');observations.cleanupGateway503=true;
  await faultObserved('cleanup');
  check((await registry()).find(r=>r.upload_handle===uHandle)?.state==='discarded');observations.cleanupDiscarded=true;
  check(equal(uMetadata,await rows('select to_jsonb(o) row from storage.objects o where bucket_id=$1 and name=$2',[BUCKET,u.object_key])));observations.cleanupMetadataPreserved=true;
  check(uHash===await bytesHash(u));observations.cleanupBytesPreserved=true;
  const removed=await req('/functions/v1/menu-image-gateway/staging/'+cHandle,{method:'DELETE',headers:auth()});check(removed.status===200);
  check((await rows('select 1 from storage.objects where bucket_id=$1 and name=$2',[BUCKET,control.object_key])).length===0);observations.cleanupControlDeleted=true;
  const stillPublished=await publicGet(handle);check(stillPublished.status===200&&hash(Buffer.from(await stillPublished.arrayBuffer()))===publishedHash);
  check(publishedHash===await bytesHash(stored)&&equal(s2,await rows('select to_jsonb(a) row from private.menu_image_assets a where store_id=$1 order by asset_key',[STORES[1]]))
   &&equal(assetBefore,await rows('select to_jsonb(a) row from private.menu_image_assets a where store_id=$1 and item_id=$2 order by asset_key',[STORES[0],main]))
   &&equal(boundBefore,await rows('select to_jsonb(m) row from public.menu_items m where store_id=$1 and id=$2',[STORES[0],main]))
   &&equal(await sentinel(),baselineSentinels));observations.faultSentinelsPreserved=true;await dropFault('cleanup');
  const cold=await browserGet(handle);check(cold.status===200&&!cold.cached&&hash(Buffer.from(cold.bytes))===hash(imageBytes()));
  const coldAt=mono();
  const decoded=await page.evaluate(async bytes=>{const b=new Blob([new Uint8Array(bytes)],{type:'image/png'}),img=await createImageBitmap(b);
   const result=img.width===1&&img.height===1;img.close();return result;},cold.bytes);check(decoded);observations.pngDecoded=true;
  const warm=await browserGet(handle);check(warm.status===200&&warm.cached&&hash(Buffer.from(warm.bytes))===hash(imageBytes()));observations.warmCache=true;
  await publish(main,null);
  const fresh=await browser.newContext();try{const p=await fresh.newPage();await p.setContent('<!doctype html><title>Fresh client</title>');
   const status=await p.evaluate(async url=>{const r=await fetch(url,{signal:AbortSignal.timeout(10000)});return {status:r.status,cache:r.headers.get('cache-control')};},API+'/functions/v1/menu-image-public/'+handle);
   check(status.status===404&&status.cache==='no-store');observations.freshAfterUnlink404=true;
  }finally{await fresh.close();}
  const timing={target59Ms:59000,target60Ms:60000,target61Ms:61000};
  for(const second of [59,60,61]){
   for(;;){await gate();const remaining=coldAt+second*1000-mono();if(remaining<=0)break;await new Promise(resolve=>setTimeout(resolve,Math.min(remaining,1000)));}
   const value=await browserGet(handle);
   // Report the browser's actual fetch dispatch against that same page's cold
   // response completion, including time spent in guards and the CDP round trip.
   const elapsed=Math.floor(value.requestAt-cold.completedAt);check(elapsed>=second*1000&&elapsed<second*1000+750);timing['observed'+second+'Ms']=elapsed;
   if(second===59){check(value.status===404&&value.cache==='no-store'||value.status===200&&value.cached&&hash(Buffer.from(value.bytes))===hash(imageBytes()));observations.cache59Observed=true;}
   else {check(value.status===404&&value.cache==='no-store'&&!value.cached);observations['cache'+second+'Denied']=true;}
  }
  check(OBSERVATIONS.every(k=>observations[k]));return {observations,timing};
 }};
}
