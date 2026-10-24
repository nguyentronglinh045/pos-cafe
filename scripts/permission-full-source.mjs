import {data,checked,result,record,demand,safePath,str,hex,uint,sha,identity} from './permission-full-d1-data.mjs';

// No source/config module is imported to inspect it. The tokenizer records
// executable and type edges plus opaque/dynamic cases separately. Unresolved
// modes remain named STOP rows; literal edges alone cannot produce COMPLETE.
export function sourceTokens(text){
 demand(typeof text==='string','INPUT');const tokens=[];let i=0,line=1;
 while(i<text.length){const c=text[i],next=text[i+1];if(c==='\n'){line++;i++;continue;}if(/\s/.test(c)){i++;continue;}
  if(c==='/'&&next==='/'){while(i<text.length&&text[i]!=='\n')i++;continue;}
  if(c==='/'&&next==='*'){i+=2;while(i<text.length&&!(text[i]==='*'&&text[i+1]==='/')){if(text[i++]==='\n')line++;}demand(i<text.length,'SOURCE');i+=2;continue;}
  const at=i,ln=line;if(c==='"'||c==="'"||c==='`'){const quote=c;let s='',dynamic=false;i++;while(i<text.length&&text[i]!==quote){if(text[i]==='\n')line++;if(quote==='`'&&text[i]==='$'&&text[i+1]==='{')dynamic=true;if(text[i]==='\\'){s+=text[i++];if(i<text.length)s+=text[i++];}else s+=text[i++];}demand(i<text.length,'SOURCE');i++;tokens.push({kind:dynamic?'template':'string',value:s,line:ln,offset:at});continue;}
  if(/[A-Za-z_$]/.test(c)){i++;while(i<text.length&&/[A-Za-z0-9_$]/.test(text[i]))i++;tokens.push({kind:'word',value:text.slice(at,i),line:ln,offset:at});continue;}
  tokens.push({kind:'symbol',value:c,line:ln,offset:at});i++;
 }
 return tokens;
}
export function inspectSource(textJson){return checked(()=>{
 const x=record(data(textJson),['path','source']);demand(safePath(x.path)&&typeof x.source==='string','SOURCE');const tokens=sourceTokens(x.source),edges=[],unresolved=[];
 const edge=(t,kind)=>{if(t?.kind==='string')edges.push({specifier:t.value,kind,line:t.line});else unresolved.push({kind,line:t?.line??1,cause:'NON_LITERAL_EXPRESSION',owner:'D',action:'SUPPLY_BOUND_PARAMETER_DOMAIN_AND_RESOLVER_OR_REFUSE_EXECUTION'});};
 for(let i=0;i<tokens.length;i++){
  const t=tokens[i];if(t.kind!=='word')continue;
  if(t.value==='import'||t.value==='export'){
   if(tokens[i+1]?.value==='.'&&tokens[i+2]?.value==='meta')continue;
   if(tokens[i+1]?.value==='('){edge(tokens[i+2],'DYNAMIC_IMPORT');continue;}
   if(tokens[i+1]?.kind==='string'){edge(tokens[i+1],'RUNTIME_IMPORT');continue;}
   for(let j=i+1;j<tokens.length&&j<i+100;j++){if(tokens[j].value==='from'){edge(tokens[j+1],tokens[i+1]?.value==='type'?'TYPE_IMPORT':'RUNTIME_IMPORT');break;}if(tokens[j].value===';')break;}
  }
  if(t.value==='require'&&tokens[i+1]?.value==='(')edge(tokens[i+2],'REQUIRE');
  if(t.value==='URL'&&tokens[i-1]?.value==='new'&&tokens[i+1]?.value==='(')edge(tokens[i+2],'URL_ASSET');
  if(['readFileSync','readFile','readJSON','readFileText'].includes(t.value)&&tokens[i+1]?.value==='('){if(tokens[i+2]?.kind==='string')edge(tokens[i+2],'FILE_ASSET');else unresolved.push({kind:'FILE_ASSET',line:t.line,cause:'RUNTIME_PATH_OR_COMPOSED_URL',owner:'D',action:'BIND_EXACT_OWNED_FILE_CATALOG_AND_PARAMETERS_AT_ADAPTER'});}
 }
 return result(unresolved.length?'STOP':'MATCH',{path:x.path,sha256:sha(x.source),scanner:'CONSERVATIVE_LEXICAL_NOT_AST_DISCOVERY',edges,unresolved});
});}

const extensions=['','.ts','.tsx','.mjs','.js','.json','.css','/index.ts','/index.tsx','/index.mjs','/index.js'];
const normalize=s=>{const parts=[];for(const p of s.split('/')){if(!p||p==='.')continue;if(p==='..'){if(!parts.length)return null;parts.pop();}else parts.push(p);}return parts.join('/');};
export function resolveSourceEdge(inputJson){return checked(()=>{
 const x=record(data(inputJson),['from','specifier','kind','files','aliases','packages']);demand(safePath(x.from)&&str(x.specifier)&&str(x.kind));demand(Array.isArray(x.files)&&Array.isArray(x.aliases)&&Array.isArray(x.packages));
 demand(['RUNTIME_IMPORT','TYPE_IMPORT','TYPE_EXPORT','RUNTIME_EXPORT','DYNAMIC_IMPORT','REQUIRE','URL_ASSET','FILE_ASSET','CSS_ASSET','TYPE_REFERENCE','PACKAGE_TYPE_REFERENCE','TSCONFIG_EXTENDS','TSCONFIG_REFERENCE'].includes(x.kind));
 for(const p of x.packages){record(p,['name','version','integrity','exportsState']);demand(str(p.name)&&str(p.version)&&str(p.integrity)&&str(p.exportsState));}
 demand(x.files.every(safePath),'PATH');demand(new Set(x.files.map(p=>p.toLowerCase())).size===x.files.length,'DUPLICATE');
 let spec=x.specifier.replace(/\?(?:raw|url|inline)$/, '');if(spec.startsWith('node:'))return result('MATCH',{resolution:'BUILTIN',path:spec});
 let target=null;
 if(spec.startsWith('.'))target=normalize(x.from.split('/').slice(0,-1).join('/')+'/'+spec);
 else for(const a of x.aliases){record(a,['prefix','target']);demand(str(a.prefix)&&safePath(a.target));if(spec.startsWith(a.prefix))target=normalize(a.target+'/'+spec.slice(a.prefix.length));}
 if(target!==null){const found=extensions.map(e=>target+e).filter(p=>x.files.includes(p));demand(found.length>0,'SOURCE');return result('MATCH',{resolution:x.kind==='TYPE_IMPORT'?'TYPE':'LOCAL',path:found[0],candidates:found});}
 const name=spec.startsWith('@')?spec.split('/').slice(0,2).join('/'):spec.split('/')[0];
 const pkg=x.packages.find(p=>p.name===name);demand(pkg,'SOURCE');record(pkg,['name','version','integrity','exportsState']);demand(str(pkg.version)&&str(pkg.integrity));
 return result('STOP',{resolution:'PACKAGE_DECLARED_NOT_RESOLVED',package:name,version:pkg.version,missingInputs:[{owner:'D',field:spec,cause:'PACKAGE_EXPORTS_CONDITIONS_TYPES_PLATFORM_RUNTIME_BYTES_NOT_INSTALLED',action:'AUTHORIZED_EXACT_LOCK_INSTALL_OR_REVIEWED_PACKAGE_EXPORTS_METADATA_WITH_BOUNDS'}]});
});}

const key=t=>JSON.stringify([t.file,t.fullName,t.project]);
function identities(rows){demand(Array.isArray(rows));for(const r of rows){record(r,['file','fullName','project']);demand(safePath(r.file)&&str(r.fullName)&&(r.project===null||str(r.project)));}demand(new Set(rows.map(key)).size===rows.length,'DUPLICATE');return rows;}
export function partitionDiscovery(inputJson){return checked(()=>{
 const x=record(data(inputJson),['sourceIdentity','fullFile','ordinary','tc18','wrapperRequired']);identity(x.sourceIdentity);identities(x.fullFile);identities(x.ordinary);identities(x.tc18);demand(x.wrapperRequired===true,'PARTITION');
 const all=new Set(x.fullFile.map(key)),ordinary=new Set(x.ordinary.map(key)),special=new Set(x.tc18.map(key));
 demand(x.tc18.length===7,'PARTITION');demand(x.fullFile.length===x.ordinary.length+x.tc18.length,'PARTITION');
 for(const t of x.fullFile){const k=key(t),tc18=/TC-PIN-18/.test(t.fullName);demand(tc18?special.has(k)&&!ordinary.has(k):ordinary.has(k)&&!special.has(k),'PARTITION');}
 demand([...ordinary,...special].every(k=>all.has(k)),'PARTITION');
 demand(x.fullFile.some(t=>/PERM.?29/.test(t.fullName)),'PARTITION');
 return result('MATCH',{partition:'EXACT_DISJOINT_FULL_FILE',ordinaryCount:x.ordinary.length,tc18Count:7,sourceFingerprint:x.sourceIdentity.sourceFingerprint,fullFileSha256:sha(JSON.stringify(x.fullFile)),execution:'NOT_RUN'});
});}
export function checkWholeFile(inputJson){return checked(()=>{
 const x=record(data(inputJson),['sourceIdentity','expected','discovery','results','options','requiredOptions','projection']);identity(x.sourceIdentity);identities(x.expected);identities(x.discovery);identities(x.projection);
 demand(JSON.stringify(x.expected.map(key).sort())===JSON.stringify(x.discovery.map(key).sort()),'PARTITION');demand(Array.isArray(x.results));
 const actual=[];for(const r of x.results){record(r,['file','fullName','project','status','expectedStatus','attempts','retries','repeatIndex','skip','todo','only']);
  demand(r.status==='passed'&&r.expectedStatus==='passed'&&r.attempts===1&&r.retries===0&&r.repeatIndex===0&&r.skip===false&&r.todo===false&&r.only===false,'ORACLE');actual.push({file:r.file,fullName:r.fullName,project:r.project});}
 identities(actual);demand(JSON.stringify(actual.map(key).sort())===JSON.stringify(x.discovery.map(key).sort()),'PARTITION');
 record(x.options,['configSha256','forbidOnly','retries','repeatEach','workers','grep','grepInvert','project']);record(x.requiredOptions,Object.keys(x.options));
 demand(JSON.stringify(x.options)===JSON.stringify(x.requiredOptions)&&x.options.forbidOnly===true&&x.options.retries===0&&x.options.repeatEach===1&&x.options.workers===1&&hex(x.options.configSha256),'OPTIONS');
 const set=new Set(x.expected.map(key));demand(x.projection.every(t=>set.has(key(t))),'PARTITION');
 return result('MATCH',{fullFileCount:x.expected.length,projectedIdentities:x.projection,unprojectedIdentities:x.expected.filter(t=>!new Set(x.projection.map(key)).has(key(t))),fullFileClosureSha256:sha(JSON.stringify([x.discovery,x.results,x.options])),sourceFingerprint:x.sourceIdentity.sourceFingerprint});
});}
