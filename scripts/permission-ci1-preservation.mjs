import {fixtureCatalogDriftMask} from './permission-fixture-diagnostics.mjs';

// This is the synthetic fixture's logical preservation view, not the inventory
// API. pg_dump skips dropped attributes; keep visible column order explicitly
// without treating the physical attnum holes as data restored by a logical dump.
// The existing routine ACL projection still uses its effective-grants checks.
export function ci1PreservationSurfaces(surfaces){
  if(!Array.isArray(surfaces)||surfaces.length>20000)throw Error('CI1_PRESERVATION_VIEW_REFUSED');
  return surfaces.map(surface=>{
    let value=surface.routine?{...surface,routine:{...surface.routine,aclHash:'EFFECTIVE_GRANTS_CHECKED'}}:{...surface};
    if(Object.hasOwn(surface,'columns')){
      const columns=surface.columns;
      if(!Array.isArray(columns)||columns.length>20000)throw Error('CI1_PRESERVATION_VIEW_REFUSED');
      const ordinals=new Set(),names=new Set();
      for(const column of columns){
        if(!column||!Number.isSafeInteger(column.ordinal)||column.ordinal<1||column.ordinal>32767
          ||typeof column.column!=='string'||!column.column||names.has(column.column)||ordinals.has(column.ordinal)
          ||column.schema!==surface.schema||column.object!==surface.object)throw Error('CI1_PRESERVATION_VIEW_REFUSED');
        names.add(column.column);ordinals.add(column.ordinal);
      }
      const positions=new Map([...columns].sort((a,b)=>a.ordinal-b.ordinal).map((column,index)=>[column.column,index+1]));
      value={...value,columns:columns.map(column=>({...column,ordinal:positions.get(column.column)}))};
    }
    return value;
  });
}

const fields={
  routine:['schema','object','signature','routineKind','owner','securityDefiner','volatility','leakProof','parallel','resultType','returnsSet','bodyHash','configHash','aclHash','definitionHash'],
  relation:['schema','object','relationKind','owner','rlsEnabled','rlsForced','replicaIdentity','persistence','isPartition','aclHash','optionsHash','viewHash','partitionHash'],
  column:['schema','object','column','ordinal','type','notNull','identity','generated','collation','defaultHash','aclHash','observerCanSelect'],
  metadata:['policies','publication','members','schemaMemberships','membership','bucket','metadataStatus'],
};
export const CI1_CATALOG_DIAGNOSTIC_BOUNDS=Object.freeze({
  t04CatalogDriftMask:[1,255],t04CatalogAdded:[0,20000],t04CatalogRemoved:[0,20000],t04CatalogChanged:[0,20000],
  t04CatalogRoutineFieldMask:[0,65535],t04CatalogRelationFieldMask:[0,16383],t04CatalogColumnFieldMask:[0,8191],
  t04CatalogMetadataFieldMask:[0,255],t04CatalogSchemaMask:[0,31],t04CatalogKindMask:[0,63],t04CatalogFirstStaticOrdinal:[0,20000],
});
const keys=Object.keys(CI1_CATALOG_DIAGNOSTIC_BOUNDS),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const mask=(before,after,names)=>names.reduce((n,key,index)=>n|(!same(before?.[key],after?.[key])?2**index:0),0)
  |(!same(before&&Object.fromEntries(Object.entries(before).filter(([k])=>!names.includes(k))),
    after&&Object.fromEntries(Object.entries(after).filter(([k])=>!names.includes(k))))?2**names.length:0);
const within=values=>values.length===keys.length&&values.every((n,i)=>Number.isSafeInteger(n)
  &&n>=CI1_CATALOG_DIAGNOSTIC_BOUNDS[keys[i]][0]&&n<=CI1_CATALOG_DIAGNOSTIC_BOUNDS[keys[i]][1]);

// No names, values, SQL, hashes or paths leave this private comparison. The
// first static ordinal is reconstructed from scanSourceInventory at this source.
export function ci1CatalogFailureMarker(before,after){
  try{
    for(const value of [before,after])if(!Array.isArray(value)||value.length>20000||Buffer.byteLength(JSON.stringify(value))>16*1024**2)return null;
    const index=rows=>new Map(rows.map(row=>[row.surfaceId,row])),old=index(before),now=index(after);
    if(old.size!==before.length||now.size!==after.length||[...old.keys(),...now.keys()].some(id=>typeof id!=='string'||id.length>4096))return null;
    const values=[fixtureCatalogDriftMask(before,after),0,0,0,0,0,0,0,0,0,0],statics=before.filter(row=>row.evidence==='static');
    let first=true;
    for(const id of new Set([...old.keys(),...now.keys()])){
      const left=old.get(id),right=now.get(id);if(same(left,right))continue;
      if(!left)values[1]++;else if(!right)values[2]++;else values[3]++;
      const row=left??right;
      values[8]|=2**(['public','private','storage','pg_catalog'].indexOf(row.schema)+1||0);
      values[9]|=2**(['SELECT','DML','RPC','publication','Storage'].indexOf(row.kind)+1||0);
      if(first){values[10]=statics.findIndex(r=>r.kind===row.kind&&r.schema===row.schema&&r.object===row.object)+1;first=false;}
      values[4]|=mask(left?.routine,right?.routine,fields.routine);
      values[5]|=mask(left?.relation,right?.relation,fields.relation);
      const a=new Map((left?.columns??[]).map(c=>[c.column,c])),b=new Map((right?.columns??[]).map(c=>[c.column,c]));
      for(const name of new Set([...a.keys(),...b.keys()]))values[6]|=mask(a.get(name),b.get(name),fields.column);
      values[7]|=mask(left,right,fields.metadata)&127;
    }
    return within(values)?'CI1_CATALOG_FAILURE '+values.join(' '):null;
  }catch{return null;}
}
export function ci1CatalogFailureFacts(stderr){
  if(typeof stderr!=='string'||Buffer.byteLength(stderr)>1024**2)return{};
  const lines=stderr.split(/\r?\n/).filter(line=>line.startsWith('CI1_CATALOG_FAILURE'));
  if(lines.length!==1||!/^CI1_CATALOG_FAILURE(?: (?:0|[1-9][0-9]{0,4})){11}$/.test(lines[0]))return{};
  const values=lines[0].slice('CI1_CATALOG_FAILURE '.length).split(' ').map(Number);
  return within(values)?Object.fromEntries(keys.map((key,i)=>[key,values[i]])):{};
}
