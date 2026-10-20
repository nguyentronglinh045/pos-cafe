import{data,checked,result,record,demand,str,hex,sha,safePath}from'./permission-full-d1-data.mjs';
const packagePath=v=>typeof v==='string'&&v.length>0&&v.length<=500&&/^[A-Za-z0-9_@.+/-]+$/.test(v)&&v.split('/').every(p=>p&&p!=='.'&&p!=='..'&&!/[. ]$/.test(p)&&!/^node_modules$/i.test(p)&&!/^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(p));

// Pure declared-target resolution, not package installation or runtime entry
// authentication. TypeScript's audited resolver handles extension substitution
// and versioned types conditions through an injected read-only host.
export function resolvePackageReference(contextJson,metadataJson){return checked(()=>{
 const c=record(data(contextJson),['name','version','metadataSha256','specifier','mode','conditions']);
 demand(str(c.name)&&str(c.version)&&hex(c.metadataSha256)&&typeof metadataJson==='string'&&sha(metadataJson)===c.metadataSha256&&str(c.specifier)&&['runtime','type'].includes(c.mode)&&Array.isArray(c.conditions)&&c.conditions.every(str),'SOURCE');
 demand(new Set(c.conditions).size===c.conditions.length,'DUPLICATE');const m=data(metadataJson);demand(m!==null&&typeof m==='object'&&!Array.isArray(m));
 demand(m.name===c.name&&m.version===c.version,'SOURCE');demand(c.specifier===c.name||c.specifier.startsWith(c.name+'/'),'SOURCE');
 const subpath=c.specifier===c.name?'.':'./'+c.specifier.slice(c.name.length+1);let target,selected=[];
 const choose=(v,star=null,depth=0)=>{
  demand(depth<=24,'SOURCE');if(v===null)return null;
  if(typeof v==='string'){const t=star===null?v:v.replaceAll('*',star);demand(t.startsWith('./')&&packagePath(t.slice(2)),'PATH');return t;}
  if(Array.isArray(v)){demand(v.length<=1,'SOURCE');return v.length?choose(v[0],star,depth+1):null;}
  demand(v&&typeof v==='object','SCHEMA');
  for(const[k,child]of Object.entries(v)){demand(!/^\d+$/.test(k)&&!k.startsWith('.'),'SCHEMA');if(k.startsWith('types@'))demand(false,'SOURCE');if(k==='default'||c.conditions.includes(k)||(c.mode==='type'&&k==='types')){selected.push(k);const found=choose(child,star,depth+1);if(found!==undefined)return found;}}
  return undefined;
 };
 if(Object.hasOwn(m,'exports')){
  const e=m.exports;if(e&&typeof e==='object'&&!Array.isArray(e)&&Object.keys(e).some(k=>k.startsWith('.'))){demand(Object.keys(e).every(k=>k.startsWith('.')),'SCHEMA');
   if(Object.hasOwn(e,subpath))target=choose(e[subpath]);else{const patterns=Object.keys(e).filter(k=>k.includes('*')&&k.split('*').length===2&&subpath.startsWith(k.split('*')[0])&&subpath.endsWith(k.split('*')[1])).sort((a,b)=>b.split('*')[0].length-a.split('*')[0].length||b.length-a.length);if(patterns.length){const k=patterns[0],[start,end]=k.split('*');target=choose(e[k],subpath.slice(start.length,subpath.length-end.length));}}
  }else if(subpath==='.')target=choose(e);
 }else{
  if(c.mode==='type'&&m.typesVersions)return result('STOP',{cause:'TYPES_VERSIONS_REQUIRE_AUDITED_COMPILER',package:c.name});
  if(subpath!=='.')target=subpath;else target=c.mode==='type'?(m.types??m.typings??null):(c.conditions.includes('browser')?(m.module??m.main??null):(m.main??null));
  if(target!==null&&target!==undefined){demand(typeof target==='string','SCHEMA');if(!target.startsWith('./'))target='./'+target;demand(packagePath(target.slice(2)),'PATH');}
 }
 if(typeof target!=='string')return result('STOP',{cause:target===null?'PACKAGE_SUBPATH_EXPLICITLY_BLOCKED':'PACKAGE_EXPORT_OR_TYPE_TARGET_UNRESOLVED',package:c.name,subpath,metadataSha256:c.metadataSha256});
 return result('MATCH',{package:c.name,version:c.version,subpath,mode:c.mode,conditions:selected,declaredTarget:target,metadataSha256:c.metadataSha256,targetFileExistence:'NOT_OBSERVED',runtimeBytesObserved:false});
});}

export function createPackageTypePort(descriptorJson,resolverFunction){const d=record(data(descriptorJson),['name','version','entrySha256','packageSha256','readOnlySandbox']);demand(d.name==='typescript'&&str(d.version)&&hex(d.entrySha256)&&hex(d.packageSha256)&&d.readOnlySandbox===true&&typeof resolverFunction==='function','SOURCE');
 return Object.freeze({resolve(inputJson){return checked(()=>{const x=record(data(inputJson),['from','specifier','options']);demand(safePath(x.from)&&str(x.specifier)&&x.options!==null&&typeof x.options==='object'&&!Array.isArray(x.options),'SOURCE');const resolved=resolverFunction(x);record(resolved,['path','packageVersion','metadataPins','missing']);demand((resolved.path===null||str(resolved.path))&&Array.isArray(resolved.metadataPins)&&Array.isArray(resolved.missing),'SOURCE');return result(resolved.path!==null&&!resolved.missing.length?'MATCH':'STOP',{...resolved,tool:d,actualTypecheck:'NOT_RUN'});});}});
}
