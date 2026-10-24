// Synthetic T04 only. No client, browser, database or network is opened at import.
import {createHash,randomUUID} from 'node:crypto';
import {readFileSync,realpathSync,lstatSync} from 'node:fs';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {bootstrapImageMeasurementPage,closeImageMeasurementResource} from './permission-t04-image-browser.mjs';

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
export const IMAGE_FAILURE_BOUNDS=Object.freeze({
 t04ImageMeasureStepOrdinal:[0,33],t04ImageMeasurePredicateOrdinal:[0,70],
 t04ImageMeasureObservationMask:[0,16777215],t04ImageMeasureExceptionClassOrdinal:[0,6],
 t04ImageMeasureCacheTargetOrdinal:[0,3],t04ImageMeasureElapsedObserved:[0,1],
 t04ImageMeasureElapsedMs:[0,180000],t04ImageMeasureElapsedCapped:[0,1],
 t04ImageWarmStatus200Ordinal:[0,2],t04ImageWarmCachedOrdinal:[0,2],t04ImageWarmBytesMatchOrdinal:[0,2]});
export function imageFailureFacts(error){
 return Object.fromEntries(Object.entries(IMAGE_FAILURE_BOUNDS).map(([key,[min,max]])=>[key,
  Number.isSafeInteger(error?.[key])&&error[key]>=min&&error[key]<=max?error[key]:0]));
}
// This state contains only fixed ordinals and completed-oracle bits. A zero bit
// is unproved, not a negative business observation. Freeze before close runs.
export function createImageMeasurementDiagnostics(observations){
 let step=0,target=0,elapsedObserved=0,elapsedMs=0,elapsedCapped=0,warm=[0,0,0],frozen;
 return{
  step(value){check(Number.isInteger(value)&&value>=1&&value<=33);step=value;
   target=value>=30&&value<=32?value-29:0;elapsedObserved=0;elapsedMs=0;elapsedCapped=0;warm=[0,0,0];},
  warm(status,cached,bytesMatch){warm=[status===200,cached===true,bytesMatch===true].map(value=>value?2:1);},
  timing(second,value){target=[59,60,61].indexOf(second)+1;elapsedObserved=Number.isSafeInteger(value)?1:0;
   elapsedMs=elapsedObserved?Math.max(0,Math.min(180000,value)):0;elapsedCapped=elapsedObserved&&elapsedMs!==value?1:0;},
  check(value,predicate){if(!value){check(Number.isInteger(predicate)&&predicate>=1&&predicate<=70);
   throw Object.assign(Error('PERMISSION_T04_IMAGE_PREDICATE_FAILED'),{t04ImageMeasurePredicateOrdinal:predicate});}},
  capture(error){
   frozen??=Object.freeze({t04ImageMeasureStepOrdinal:step,
    t04ImageMeasurePredicateOrdinal:imageFailureFacts(error).t04ImageMeasurePredicateOrdinal,
    t04ImageMeasureObservationMask:OBSERVATIONS.reduce((mask,key,index)=>mask+(observations[key]===true?2**index:0),0),
    t04ImageMeasureExceptionClassOrdinal:['Error','TypeError','RangeError','SyntaxError','AbortError','TimeoutError'].indexOf(error?.name)+1,
    t04ImageMeasureCacheTargetOrdinal:target,t04ImageMeasureElapsedObserved:elapsedObserved,
    t04ImageMeasureElapsedMs:elapsedMs,t04ImageMeasureElapsedCapped:elapsedCapped,
    t04ImageWarmStatus200Ordinal:warm[0],t04ImageWarmCachedOrdinal:warm[1],t04ImageWarmBytesMatchOrdinal:warm[2]});
   return Object.assign(Error('PERMISSION_T04_IMAGE_MEASURE_FAILED'),frozen,
    {t04ImageMeasurementCleanupAttempted:error?.t04ImageMeasurementCleanupAttempted===1?1:0,
     t04ImageMeasurementCleanupFailed:error?.t04ImageMeasurementCleanupFailed===1?1:0});
  }
 };
}
// Only the fresh cache-control context uses this boundary. Freeze body failure
// before closing it; a failed close must neither replace that cause nor vanish
// when the containing browser later closes successfully.
export async function withImageMeasurementContext(body,close,capture){
 let primary,result,cleanupFailed=0;
 try{result=await body();}catch(error){primary=capture(error);}
 try{await close();}catch(error){cleanupFailed=1;primary??=capture(error);}
 if(primary)throw Object.assign(primary,{t04ImageMeasurementCleanupAttempted:1,t04ImageMeasurementCleanupFailed:Math.max(cleanupFailed,primary.t04ImageMeasurementCleanupFailed===1?1:0)});
 return result;
}
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
 }catch(error){if(error?.t04ImageMeasurementCleanupAttempted===1)cleanupAttempted=1;
  if(error?.t04ImageMeasurementCleanupFailed===1)cleanupFailed=1;
  failure=Object.assign(Error(admitted?'PERMISSION_T04_IMAGE_MEASUREMENT_FAILED':'PERMISSION_T04_IMAGE_MEASUREMENT_REFUSED'),
  {t04ImageMeasurementPhaseOrdinal:phase},imageFailureFacts(phase===3?error:null));throw failure;}
 finally{if(cleanup){cleanupAttempted=1;try{await cleanup();}catch{cleanupFailed=1;}}
  if(failure)Object.assign(failure,{t04ImageMeasurementCleanupAttempted:cleanupAttempted,t04ImageMeasurementCleanupFailed:cleanupFailed});}
}

async function createRuntimeEffects(o,{now,mono,gate,measurementEnd}){
 let cleaning=false,browser,context,sessionToken='',closed=false,lookupRevoked=false,lookupOriginal,storageMissing;
 const uploads=[],entry=[],createdItems=[],faults=new Set(),observations=Object.fromEntries(OBSERVATIONS.map(k=>[k,false]));
 const diagnostic=createImageMeasurementDiagnostics(observations);
 const restoration=Object.fromEntries(RESTORATION.map(k=>[k,false]));
 let baselineObjects,baselineCatalog,baselineSentinels;
 const q=async(sql,args=[])=>{await gate(cleaning);
  // The parent lends its existing <=10s statement-timeout client. Never start a
  // query that can consume the following phase's reserved time.
  diagnostic.check(now()+10000<(cleaning?o.deadline:measurementEnd), 1);return o.db.query(sql,args);};
 const rows=async(sql,args)=>(await q(sql,args)).rows;
 const req=async(path,init={})=>{await gate(cleaning);diagnostic.check(path.startsWith('/')&&!path.includes('..')&&!/[\r\n\0]/.test(path), 2);
  return fetch(API+path,{...init,redirect:'error',signal:AbortSignal.timeout(Math.max(1,Math.min(10000,(cleaning?o.deadline:measurementEnd)-now())))});};
 const auth=()=>({apikey:o.anonKey,Authorization:'Bearer '+o.storeJwt,'x-pos-employee-token':sessionToken,'x-pos-permission-contract':'2'});
 const service=()=>({apikey:o.serviceKey,Authorization:'Bearer '+o.serviceKey});
 const rpc=async(name,body)=>{diagnostic.check(['permission_start_session','permission_revoke_session','apply_menu_changes'].includes(name), 3);
  const r=await req('/rest/v1/rpc/'+name,{method:'POST',headers:{...auth(),'Content-Type':'application/json'},body:JSON.stringify(body)});
  diagnostic.check(r.ok, 4);const result=await r.json();diagnostic.check(result?.ok===true, 5);return result;};
 const storagePath=row=>'/storage/v1/object/authenticated/'+encodeURIComponent(row.bucket_id??BUCKET)+'/'+(row.name??row.object_key).split('/').map(encodeURIComponent).join('/');
 const bytesHash=async row=>{const r=await req(storagePath(row),{headers:service()});diagnostic.check(r.ok, 6);
  const declared=Number(r.headers.get('content-length'));diagnostic.check(!Number.isFinite(declared)||declared<=5242880, 7);
  const reader=r.body.getReader(),chunks=[];let count=0;for(;;){const part=await reader.read();if(part.done)break;
   count+=part.value.length;if(count>5242880){await reader.cancel();refuse();}chunks.push(part.value);}return hash(Buffer.concat(chunks));};
 const catalog=async()=>rows(`select p.oid::text,p.proacl::text,pg_get_functiondef(p.oid) definition from pg_proc p
  where p.oid='public.permission_menu_image_public_lookup(uuid)'::regprocedure`);
 const sentinel=async()=>{
  const metadata=await rows('select to_jsonb(o) row from storage.objects o where bucket_id<>$1 order by id',[BUCKET]);
  diagnostic.check(metadata.length===6, 8);const result=[];for(const {row} of metadata){diagnostic.check(typeof row.bucket_id==='string'&&typeof row.name==='string'
   &&row.name.length<=500&&!row.name.split('/').some(p=>p==='..'||p==='.')&&!/[\r\n\0\\]/.test(row.name), 9);
   result.push({row,sha:await bytesHash(row)});}return result;
 };
 const registry=async()=>{const result=await rows('select upload_handle,store_id,item_id,object_key,mime_type,state from private.menu_image_uploads order by upload_handle');
  diagnostic.check(result.length<=68, 10);return result.map(owned);};
 const captureNew=async()=>{const current=await registry();for(const row of current)if(!entry.some(x=>x.upload_handle===row.upload_handle)
  &&!uploads.some(x=>x.upload_handle===row.upload_handle)){diagnostic.check(createdItems.includes(row.item_id), 11);uploads.push(row);}diagnostic.check(uploads.length<=4, 12);return current;};
 const upload=async item=>{const form=new FormData();form.set('itemId',item);form.set('file',new File([imageBytes()],'measurement.png',{type:'image/png'}));
  const response=await req('/functions/v1/menu-image-gateway',{method:'POST',headers:auth(),body:form});
  await captureNew();return response;};
 const publish=async(item,handle,create=false)=>{const changes=emptyMenu();changes.imageChanges=[{itemId:item,uploadHandle:handle}];
  if(create){const category=(await rows('select id from public.categories where store_id=$1 and deleted_at is null order by id limit 1',[STORES[0]]))[0];diagnostic.check(UUID.test(category?.id), 13);
   changes.menuItems.created=[{id:item,categoryId:category.id,name:'Synthetic image measurement',price:1000,sortOrder:999,isAvailable:true}];}
  return rpc('apply_menu_changes',{p_changes:changes});};
 const errorResponse=async(response,status,code)=>{diagnostic.check(response.status===status&&response.headers.get('cache-control')==='no-store', 14);
  diagnostic.check((await response.json())?.error?.code===code, 15);};
 const publicGet=async(asset,conditional=false)=>req('/functions/v1/menu-image-public/'+asset,
  {headers:conditional?{'If-None-Match':'"'+asset+'"'}:{}});
 const suffix=hash(o.binding.runId+':'+o.binding.attempt).slice(0,12),names={upload:'t04_image_up_'+suffix,cleanup:'t04_image_del_'+suffix};
 const installFault=async(kind,predicate)=>{
  const name=names[kind];diagnostic.check(['upload','cleanup'].includes(kind)&&/^[a-z0-9_]{1,63}$/.test(name), 16);
  diagnostic.check((await rows('select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname=\'private\' and p.proname=$1',[name])).length===0, 17);
  diagnostic.check((await rows('select 1 from pg_trigger where tgname=$1',[name])).length===0, 18);
  diagnostic.check((await rows("select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='private' and c.relname=any($1::text[])",[ [name+'_probe',name+'_fault'] ])).length===0, 19);
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
  const value=(await rows(`select last_value,is_called from private.${name}`))[0];diagnostic.check(value?.is_called===true&&Number(value.last_value)>=1&&Number(value.last_value)<=1024, 20);};
 const removeOwned=async row=>{owned(row);const r=await req('/storage/v1/object/'+BUCKET,{method:'DELETE',headers:{...service(),'Content-Type':'application/json'},body:JSON.stringify({prefixes:[row.object_key]})});diagnostic.check(r.ok, 21);};
 const close=async()=>{
  if(closed)return restoration;cleaning=true;let failed=false;
  const attempt=async fn=>{try{await fn();}catch{failed=true;}};
  for(const kind of ['upload','cleanup'])await attempt(()=>dropFault(kind));
  await attempt(async()=>{restoration.faultsRemoved=(await rows('select 1 from pg_trigger where tgname=any($1::text[])',[Object.values(names)])).length===0
   &&(await rows('select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname=\'private\' and p.proname=any($1::text[])',[Object.values(names)])).length===0
   &&(await rows("select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='private' and c.relname=any($1::text[])",
    [Object.values(names).flatMap(name=>[name+'_probe',name+'_fault'])])).length===0;diagnostic.check(restoration.faultsRemoved, 22);});
  await attempt(async()=>{if(lookupRevoked){await q('grant execute on function public.permission_menu_image_public_lookup(uuid) to service_role');lookupRevoked=false;}
   restoration.lookupAclRestored=equal(await catalog(),lookupOriginal);diagnostic.check(restoration.lookupAclRestored, 23);});
  if(storageMissing)await attempt(async()=>{const value=storageMissing;diagnostic.check((await q('update private.menu_image_assets set object_key=$1 where asset_key=$2 and object_key=$3',[value.original,value.asset,value.missing])).rowCount===1, 24);storageMissing=undefined;});
  await attempt(async()=>{await captureNew();for(const row of [...entry,...uploads])await removeOwned(row);
   const count=(await rows('select count(*)::int n from storage.objects where bucket_id=$1',[BUCKET]))[0].n;diagnostic.check(count===0, 25);restoration.ownedStorageRemoved=true;});
  await attempt(async()=>{restoration.sentinelsPreserved=equal(await sentinel(),baselineSentinels);diagnostic.check(restoration.sentinelsPreserved, 26);});
  if(sessionToken)await attempt(async()=>{await rpc('permission_revoke_session',{});
   const token=hash(sessionToken),r=await rows('select revoked_at is not null revoked from private.employee_sessions where store_id=$1 and token_hash=decode($2,\'hex\')',[STORES[0],token]);
   diagnostic.check(r.length===1&&r[0].revoked===true, 27);restoration.employeeSessionRevoked=true;});
  await attempt(async()=>{restoration.catalogRestored=equal(await catalog(),baselineCatalog);diagnostic.check(restoration.catalogRestored, 28);});
  await attempt(async()=>{if(browser)await closeImageMeasurementResource(browser,{deadline:o.deadline,now});restoration.browserClosed=true;});
  await attempt(async()=>{await gate(true);restoration.physicalUnchanged=true;});
  closed=true;diagnostic.check(!failed&&RESTORATION.every(k=>restoration[k]), 29);return restoration;
 };
 return {close,measure:async()=>{try{
  // Every setup effect lives inside measure so close is registered before it can fail.
  diagnostic.step(1);
  const marker=await rows(`select current_database() db,current_user actor,engine,store_ids,
   (select setting::int from pg_settings where name='statement_timeout') statement_timeout_ms
   from private.idempotency_test_environment where singleton`);
  diagnostic.check(marker.length===1&&marker[0].db==='postgres'&&marker[0].actor==='postgres'&&marker[0].engine==='supabase-identity-v1'
   &&equal(marker[0].store_ids,STORES)&&Number.isSafeInteger(marker[0].statement_timeout_ms)
   &&marker[0].statement_timeout_ms>0&&marker[0].statement_timeout_ms<=10000, 30);
  diagnostic.check(equal((await rows('select id from public.stores order by id')).map(r=>r.id),STORES), 31);
  diagnostic.step(2);
  const buckets=await rows('select public,file_size_limit,allowed_mime_types from storage.buckets where id=$1',[BUCKET]);
  diagnostic.check(buckets.length===1&&buckets[0].public===false&&Number(buckets[0].file_size_limit)===5242880
   &&equal([...(buckets[0].allowed_mime_types??[])].sort(),['image/jpeg','image/png','image/webp']), 32);
  const initial=await registry();diagnostic.check(initial.length<=64, 33);entry.push(...initial);
  baselineObjects=await rows('select to_jsonb(o) row from storage.objects o where bucket_id=$1 order by id',[BUCKET]);
  diagnostic.check(baselineObjects.length<=64&&baselineObjects.every(({row})=>entry.some(e=>e.object_key===row.name)), 34);
  diagnostic.step(3);
  baselineCatalog=await catalog();lookupOriginal=baselineCatalog;diagnostic.check(baselineCatalog.length===1, 35);
  baselineSentinels=await sentinel();
  diagnostic.check(STORES.every(id=>baselineSentinels.some(({row})=>row.name.startsWith(id+'/menu-items/'))), 36);
  diagnostic.step(4);
  const session=await rpc('permission_start_session',{p_employee_id:EMPLOYEE,p_pin:'384729'});
  diagnostic.check(session.kind==='normal'&&typeof session.token==='string'&&/^[A-Za-z0-9_-]{43}$/.test(session.token), 37);sessionToken=session.token;
  // Load only the admitted checkout's already-installed, lock-bound Playwright.
  diagnostic.step(5);
  const {chromium}=await import('@playwright/test');await gate();
  browser=await chromium.launch({channel:'chromium',headless:true,timeout:10000});
  diagnostic.step(6);
  context=await browser.newContext();const page=await context.newPage();await bootstrapImageMeasurementPage(page,{api:API,gate,deadline:measurementEnd,now});
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
   diagnostic.check(responses.length===1&&!responses[0].worker, 38);return {...value,cached:responses[0].disk||observed.some(e=>e.type==='cache'&&e.id===responses[0].id)};};
  const main=randomUUID(),failedUpload=randomUUID();createdItems.push(main,failedUpload);
  diagnostic.step(7);
  const uploaded=await upload(main);diagnostic.check(uploaded.status===201, 39);const handle=(await uploaded.json())?.data?.uploadHandle;diagnostic.check(UUID.test(handle), 40);
  diagnostic.step(8);await publish(main,handle,true);observations.publication=true;
  diagnostic.step(9);
  const stored=(await registry()).find(r=>r.upload_handle===handle);diagnostic.check(stored?.state==='published', 41);
  diagnostic.step(10);
  const origin=await publicGet(handle);diagnostic.check(origin.status===200&&origin.headers.get('cache-control')==='private, max-age=60, must-revalidate'
   &&origin.headers.get('etag')==='"'+handle+'"'&&hash(Buffer.from(await origin.arrayBuffer()))===hash(imageBytes()), 42);observations.origin200=true;
  diagnostic.step(11);
  const unchanged=await publicGet(handle,true);diagnostic.check(unchanged.status===304&&unchanged.headers.get('cache-control')==='private, max-age=60, must-revalidate', 43);observations.origin304=true;
  // Both ordinary and conditional paths must fail while Storage cannot serve the exact owned asset.
  diagnostic.step(12);
  const missing=`${STORES[0]}/menu-items/${main}/${randomUUID()}.png`;storageMissing={asset:handle,original:stored.object_key,missing};
  diagnostic.check((await q('update private.menu_image_assets set object_key=$1 where asset_key=$2 and object_key=$3',[missing,handle,stored.object_key])).rowCount===1, 44);
  for(const conditional of [false,true]){await errorResponse(await publicGet(handle,conditional),503,'IMAGE_STORAGE_UNAVAILABLE');observations[conditional?'storageConditional503':'storageOrdinary503']=true;}
  diagnostic.check((await q('update private.menu_image_assets set object_key=$1 where asset_key=$2 and object_key=$3',[stored.object_key,handle,missing])).rowCount===1, 45);storageMissing=undefined;
  diagnostic.step(13);
  const privileges=(await rows(`select has_function_privilege('service_role','public.permission_menu_image_public_lookup(uuid)','execute') service,
   has_function_privilege('anon','public.permission_menu_image_public_lookup(uuid)','execute') anon,
   has_function_privilege('authenticated','public.permission_menu_image_public_lookup(uuid)','execute') authenticated`))[0];
  diagnostic.check(privileges.service&&!privileges.anon&&!privileges.authenticated, 46);
  await q('revoke execute on function public.permission_menu_image_public_lookup(uuid) from service_role');lookupRevoked=true;
  diagnostic.check(!(await rows("select has_function_privilege('service_role','public.permission_menu_image_public_lookup(uuid)','execute') value"))[0].value, 47);
  for(const conditional of [false,true]){await errorResponse(await publicGet(handle,conditional),503,'IMAGE_GATEWAY_UNAVAILABLE');observations[conditional?'lookupConditional503':'lookupOrdinary503']=true;}
  await q('grant execute on function public.permission_menu_image_public_lookup(uuid) to service_role');lookupRevoked=false;diagnostic.check(equal(await catalog(),lookupOriginal), 48);
  diagnostic.step(14);
  const boundBefore=await rows('select to_jsonb(m) row from public.menu_items m where store_id=$1 and id=$2',[STORES[0],main]);
  const assetBefore=await rows('select to_jsonb(a) row from private.menu_image_assets a where store_id=$1 and item_id=$2 order by asset_key',[STORES[0],main]);
  diagnostic.check(assetBefore.length===1&&assetBefore[0].row.published===true, 49);
  diagnostic.step(15);await installFault('upload',`new.bucket_id='${BUCKET}' and new.name like '${STORES[0]}/menu-items/${failedUpload}/%'`);
  diagnostic.step(16);
  const fault=await upload(failedUpload);await errorResponse(fault,503,'IMAGE_STORAGE_UNAVAILABLE');observations.uploadMetadata503=true;
  diagnostic.step(17);
  const failed=(await registry()).filter(r=>r.item_id===failedUpload);diagnostic.check(failed.length===1&&failed[0].state==='uploading', 50);observations.uploadStillUploading=true;
  await faultObserved('upload',true);await faultObserved('upload');
  observations.uploadProbeBypassed=true;
  diagnostic.check((await rows('select 1 from private.menu_image_assets where upload_handle=$1',[failed[0].upload_handle])).length===0, 51);observations.uploadNotPublished=true;
  diagnostic.step(18);
  diagnostic.check(equal(boundBefore,await rows('select to_jsonb(m) row from public.menu_items m where store_id=$1 and id=$2',[STORES[0],main]))
   &&equal(assetBefore,await rows('select to_jsonb(a) row from private.menu_image_assets a where store_id=$1 and item_id=$2 order by asset_key',[STORES[0],main])), 52);
  observations.uploadPreviousBindingPreserved=true;
  await dropFault('upload');
  diagnostic.step(19);
  const uResponse=await upload(main),cResponse=await upload(main);diagnostic.check(uResponse.status===201&&cResponse.status===201, 53);
  const uHandle=(await uResponse.json()).data.uploadHandle,cHandle=(await cResponse.json()).data.uploadHandle;
  const all=await registry(),u=all.find(r=>r.upload_handle===uHandle),control=all.find(r=>r.upload_handle===cHandle);diagnostic.check(u&&control, 54);
  diagnostic.step(20);
  const uMetadata=await rows('select to_jsonb(o) row from storage.objects o where bucket_id=$1 and name=$2',[BUCKET,u.object_key]);diagnostic.check(uMetadata.length===1, 55);
  const uHash=await bytesHash(u),publishedHash=await bytesHash(stored),s2=await rows('select to_jsonb(a) row from private.menu_image_assets a where store_id=$1 order by asset_key',[STORES[1]]);
  diagnostic.step(21);await installFault('cleanup',`old.bucket_id='${BUCKET}' and old.name='${u.object_key}'`);
  diagnostic.step(22);
  await errorResponse(await req('/functions/v1/menu-image-gateway/staging/'+uHandle,{method:'DELETE',headers:auth()}),503,'IMAGE_STORAGE_UNAVAILABLE');observations.cleanupGateway503=true;
  await faultObserved('cleanup');
  diagnostic.step(23);
  diagnostic.check((await registry()).find(r=>r.upload_handle===uHandle)?.state==='discarded', 56);observations.cleanupDiscarded=true;
  diagnostic.check(equal(uMetadata,await rows('select to_jsonb(o) row from storage.objects o where bucket_id=$1 and name=$2',[BUCKET,u.object_key])), 57);observations.cleanupMetadataPreserved=true;
  diagnostic.check(uHash===await bytesHash(u), 58);observations.cleanupBytesPreserved=true;
  diagnostic.step(24);
  const removed=await req('/functions/v1/menu-image-gateway/staging/'+cHandle,{method:'DELETE',headers:auth()});diagnostic.check(removed.status===200, 59);
  diagnostic.check((await rows('select 1 from storage.objects where bucket_id=$1 and name=$2',[BUCKET,control.object_key])).length===0, 60);observations.cleanupControlDeleted=true;
  diagnostic.step(25);
  const stillPublished=await publicGet(handle);diagnostic.check(stillPublished.status===200&&hash(Buffer.from(await stillPublished.arrayBuffer()))===publishedHash, 61);
  diagnostic.check(publishedHash===await bytesHash(stored)&&equal(s2,await rows('select to_jsonb(a) row from private.menu_image_assets a where store_id=$1 order by asset_key',[STORES[1]]))
   &&equal(assetBefore,await rows('select to_jsonb(a) row from private.menu_image_assets a where store_id=$1 and item_id=$2 order by asset_key',[STORES[0],main]))
   &&equal(boundBefore,await rows('select to_jsonb(m) row from public.menu_items m where store_id=$1 and id=$2',[STORES[0],main]))
   &&equal(await sentinel(),baselineSentinels), 62);observations.faultSentinelsPreserved=true;await dropFault('cleanup');
  diagnostic.step(26);
  const cold=await browserGet(handle);diagnostic.check(cold.status===200&&!cold.cached&&hash(Buffer.from(cold.bytes))===hash(imageBytes()), 63);
  const coldAt=mono();
  diagnostic.step(27);
  const decoded=await page.evaluate(async bytes=>{const b=new Blob([new Uint8Array(bytes)],{type:'image/png'}),img=await createImageBitmap(b);
   const result=img.width===1&&img.height===1;img.close();return result;},cold.bytes);diagnostic.check(decoded, 64);observations.pngDecoded=true;
  diagnostic.step(28);
  const warm=await browserGet(handle);diagnostic.warm(warm.status,warm.cached,hash(Buffer.from(warm.bytes))===hash(imageBytes()));diagnostic.check(warm.status===200&&warm.cached&&hash(Buffer.from(warm.bytes))===hash(imageBytes()), 65);observations.warmCache=true;
  diagnostic.step(29);await publish(main,null);
  const fresh=await browser.newContext();await withImageMeasurementContext(async()=>{const p=await fresh.newPage();await bootstrapImageMeasurementPage(p,{api:API,gate,deadline:measurementEnd,now});
   const status=await p.evaluate(async url=>{const r=await fetch(url,{signal:AbortSignal.timeout(10000)});return {status:r.status,cache:r.headers.get('cache-control')};},API+'/functions/v1/menu-image-public/'+handle);
   diagnostic.check(status.status===404&&status.cache==='no-store', 66);observations.freshAfterUnlink404=true;
  },()=>closeImageMeasurementResource(fresh,{deadline:o.deadline,now}),error=>diagnostic.capture(error));
  const timing={target59Ms:59000,target60Ms:60000,target61Ms:61000};
  for(const second of [59,60,61]){
   diagnostic.step(second-29);
   for(;;){await gate();const remaining=coldAt+second*1000-mono();if(remaining<=0)break;await new Promise(resolve=>setTimeout(resolve,Math.min(remaining,1000)));}
   const value=await browserGet(handle);
   // Report the browser's actual fetch dispatch against that same page's cold
   // response completion, including time spent in guards and the CDP round trip.
   const elapsed=Math.floor(value.requestAt-cold.completedAt);diagnostic.timing(second,elapsed);
   diagnostic.check(elapsed>=second*1000&&elapsed<second*1000+750, 67);timing['observed'+second+'Ms']=elapsed;
   if(second===59){diagnostic.check(value.status===404&&value.cache==='no-store'||value.status===200&&value.cached&&hash(Buffer.from(value.bytes))===hash(imageBytes()), 68);observations.cache59Observed=true;}
   else {diagnostic.check(value.status===404&&value.cache==='no-store'&&!value.cached, 69);observations['cache'+second+'Denied']=true;}
  }
  diagnostic.step(33);diagnostic.check(OBSERVATIONS.every(k=>observations[k]), 70);return {observations,timing};
  }catch(error){throw diagnostic.capture(error);}}};
}
