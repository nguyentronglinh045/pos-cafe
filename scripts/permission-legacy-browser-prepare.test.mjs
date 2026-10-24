import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareLegacyBrowserSurface, LEGACY_BROWSER_READ_TABLES as tables} from './permission-legacy-browser-prepare.mjs';

// State-model controls for guard ordering and atomic ACL changes. Real SQL/PG17
// semantics are verified by the source-bound T04 browser/database execution.
const stores=['10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002'];
const row=(table,role,privilege)=>({table_name:table,grantee:role,privilege_type:privilege,is_grantable:false,owner_grant:true});
const stock=(version=170006)=>tables.flatMap(t=>['anon','authenticated'].flatMap(r=>['SELECT',...(version>=170000?['MAINTAIN']:[])].map(p=>row(t,r,p))));
function fixture(options={}){
 const version=options.version??170006,original=structuredClone(options.acl??stock(version));
 let acl=structuredClone(original),transaction=null,writes=0;const calls=[];
 const effective=()=>tables.flatMap(table=>['anon','authenticated'].map(role=>{
  const privileges=[...new Set([...acl.filter(x=>x.table_name===table&&x.grantee===role).map(x=>x.privilege_type),...(role==='anon'?options.inheritedAnon??[]:[])])];
  return{table_name:table,grantee:role,privileges,column_privileges:privileges.filter(p=>['SELECT','INSERT','UPDATE','REFERENCES'].includes(p))};
 }));
 const db={async query(sql,params){
  calls.push(sql);
  if(sql==='begin'){transaction=structuredClone(acl);return{rows:[]};}
  if(sql==='commit'){transaction=null;return{rows:[]};}
  if(sql==='rollback'){if(transaction)acl=transaction;transaction=null;return{rows:[]};}
  if(sql.startsWith('set local')||sql.startsWith('lock table'))return{rows:[]};
  if(sql.includes('select marker,engine,store_ids'))return{rows:[{marker:options.badMarker?'OTHER':'fixture',engine:'supabase-identity-v1',store_ids:stores}]};
  if(sql==='select id from public.stores order by id')return{rows:stores.map(id=>({id}))};
  if(sql.includes("to_regclass('public.permission_catalog')"))return{rows:[{value:null}]};
  if(sql.includes("to_regtype('public.employee_role')"))return{rows:[{value:'employee_role'}]};
  if(sql.includes('count(p.policyname)'))return{rows:tables.map(table_name=>({table_name,relrowsecurity:!(options.badRls||options.postBadRls&&writes>0),policies:1,policy_matches:true}))};
  if(sql.includes("current_setting('server_version_num')"))return{rows:[{value:version}]};
  if(sql.includes('aclexplode(a.attacl)'))return{rows:options.columnAcl??[]};
  if(sql.includes('aclexplode(coalesce(c.relacl'))return{rows:structuredClone(acl)};
  if(sql.includes('has_table_privilege(r.oid,c.oid,p)')){
   assert.equal(params[2].includes('MAINTAIN'),version>=170000);
   const rows=effective();if(options.missingFinalRow&&writes>0)rows.pop();return{rows};
  }
  if(sql.startsWith('revoke all privileges on ')){writes++;acl=acl.filter(x=>!['anon','authenticated'].includes(x.grantee));return{rows:[]};}
  if(sql.startsWith('grant select on ')){if(options.grantFailure)throw Object.assign(Error('synthetic grant fault'),{code:'42501'});writes++;acl.push(...tables.map(t=>row(t,'authenticated','SELECT')));return{rows:[]};}
  throw Error('UNEXPECTED_QUERY');
 }};
 return{db,calls,original,get acl(){return acl;},get writes(){return writes;},get transaction(){return transaction;}};
}
const run=x=>prepareLegacyBrowserSurface(x.db,{marker:'fixture',storeIds:stores});

test('known legacy SELECT and PG17 maintenance defaults normalize atomically to authenticated SELECT only',async()=>{
 const f=fixture(),r=await run(f);assert.equal(r.status,'LEGACY_BROWSER_READS_READY');
 assert.deepEqual(r.normalized,{anonSelect:4,maintain:8});assert.equal(f.writes,2);assert.equal(f.transaction,null);
 assert.deepEqual(f.acl,tables.map(t=>row(t,'authenticated','SELECT')));assert.equal(f.calls.at(-1),'commit');
 assert.equal(r.after.length,4);assert(r.after.every(x=>x.allowed));
});
test('PG16 fixture uses only supported privilege names and preserves the same final read surface',async()=>{
 const f=fixture({version:160015}),r=await run(f);assert.deepEqual(r.normalized,{anonSelect:4,maintain:0});assert.equal(f.calls.at(-1),'commit');
});
test('fixture and RLS guard failures precede ACL mutation',async()=>{
 for(const options of[{badMarker:true},{badRls:true}]){const f=fixture(options);await assert.rejects(run(f));assert.equal(f.writes,0);assert.deepEqual(f.acl,f.original);assert.equal(f.calls.at(-1),'rollback');}
});
test('DML, PUBLIC/inherited grants, grant options, foreign tables and duplicate ACL rows refuse before mutation',async()=>{
 const t=tables[0],bad=[row(t,'anon','INSERT'),row(t,'authenticated','TRUNCATE'),row(t,'PUBLIC','SELECT'),row(t,'inherited_reader','SELECT'),
  {...row(t,'authenticated','SELECT'),is_grantable:true},{...row(t,'anon','SELECT'),owner_grant:false},row('foreign','anon','SELECT'),row(t,'anon','SELECT')];
 for(const extra of bad){const f=fixture({acl:[...stock(),extra]});await assert.rejects(run(f),/UNEXPECTED_LEGACY_FINANCIAL_GRANT/);assert.equal(f.writes,0);assert.deepEqual(f.acl,f.original);}
});
test('unexpected effective DML and column grants refuse before mutation',async()=>{
 for(const options of[{inheritedAnon:['UPDATE']},{columnAcl:[{table_name:tables[0]}]}]){const f=fixture(options);await assert.rejects(run(f),/UNEXPECTED_LEGACY_FINANCIAL_GRANT/);assert.equal(f.writes,0);}
});
test('inherited effective SELECT surviving direct revocation fails the final proof and rolls back',async()=>{
 const f=fixture({inheritedAnon:['SELECT']});await assert.rejects(run(f),/LEGACY_BROWSER_READ_GRANT_RESTORE_FAILED/);
 assert.equal(f.writes,2);assert.deepEqual(f.acl,f.original);assert.equal(f.calls.at(-1),'rollback');
});
test('missing final rows and changed RLS cannot pass vacuously and restore the original ACL',async()=>{
 for(const options of[{missingFinalRow:true},{postBadRls:true}]){const f=fixture(options);await assert.rejects(run(f));assert.equal(f.writes,2);assert.deepEqual(f.acl,f.original);assert.equal(f.calls.at(-1),'rollback');}
});
test('grant failure rolls back the preceding revocation and retains its actual error',async()=>{
 const f=fixture({grantFailure:true});await assert.rejects(run(f),e=>e.code==='42501');assert.equal(f.writes,1);assert.deepEqual(f.acl,f.original);assert.equal(f.calls.at(-1),'rollback');
});
