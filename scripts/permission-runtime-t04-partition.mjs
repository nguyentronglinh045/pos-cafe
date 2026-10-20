// Private pre-clean plan for the inherited realtime PRIMARY KEY family only.
// The immutable archive remains whole. Unsupported topology/dependencies STOP.
const check=(value,ordinal=1)=>{if(!value)throw Object.assign(Error('T04_PARTITION_CONSTRAINT_REFUSED'),
 {t04RestoreFacts:{t04PartitionRefusalOrdinal:ordinal}});};
const identifier=value=>typeof value==='string'&&/^[A-Za-z_][A-Za-z_0-9$]*$/.test(value)&&Buffer.byteLength(value)<=63;
const key=row=>[row.schema,row.table,row.constraint].join('\0');
const quote=value=>'"'+value.replaceAll('"','""')+'"';
const fields=['schema','table','constraint','owner','kind','local','inherited','parentSchema','parentTable','parentConstraint',
 'tableKind','tablePartition','parentAttached','childCount','definition','indexDefinition','valid','ready','primary','unique','externalDependencies','extensionOwned'];

export const T04_PARTITION_CONSTRAINT_QUERY=`select n.nspname schema,t.relname "table",c.conname "constraint",
 pg_get_userbyid(t.relowner) owner,c.contype kind,c.conislocal "local",c.coninhcount inherited,
 pn.nspname "parentSchema",pt.relname "parentTable",pc.conname "parentConstraint",
 t.relkind "tableKind",t.relispartition "tablePartition",
 (select count(*)::int from pg_constraint child where child.conparentid=c.oid) "childCount",
 case when c.conparentid=0 then true else
   exists(select 1 from pg_inherits h where h.inhrelid=t.oid and h.inhparent=pt.oid)
   and exists(select 1 from pg_inherits h where h.inhrelid=c.conindid and h.inhparent=pc.conindid) end "parentAttached",
 pg_get_constraintdef(c.oid,true) definition,pg_get_indexdef(c.conindid) "indexDefinition",
 i.indisvalid valid,i.indisready ready,i.indisprimary "primary",i.indisunique "unique",
 exists(select 1 from pg_depend d where
   ((d.refclassid='pg_constraint'::regclass and d.refobjid=c.oid)
     or (d.refclassid='pg_class'::regclass and d.refobjid=c.conindid))
   and not (
     (d.classid='pg_class'::regclass and d.objid=c.conindid)
     or (d.classid='pg_constraint'::regclass and d.objid=c.oid)
     or (d.classid='pg_constraint'::regclass and exists(select 1 from pg_constraint child where child.oid=d.objid and child.conparentid=c.oid))
     or (d.classid='pg_class'::regclass and exists(select 1 from pg_constraint child where child.conindid=d.objid and child.conparentid=c.oid))
   )) "externalDependencies",
 exists(select 1 from pg_depend d where d.deptype in ('e','x')
   and ((d.classid='pg_constraint'::regclass and d.objid=c.oid)
     or (d.classid='pg_class'::regclass and d.objid in (t.oid,c.conindid)))) "extensionOwned"
 from pg_constraint c join pg_class t on t.oid=c.conrelid join pg_namespace n on n.oid=t.relnamespace
 join pg_index i on i.indexrelid=c.conindid
 left join pg_constraint pc on pc.oid=c.conparentid left join pg_class pt on pt.oid=pc.conrelid
 left join pg_namespace pn on pn.oid=pt.relnamespace
 where n.nspname='realtime' and c.contype='p'
   and (c.conparentid<>0 or exists(select 1 from pg_constraint child where child.conparentid=c.oid))
 order by n.nspname,t.relname,c.conname limit 129`;

export function t04PartitionConstraintPlan(rows,toc){
 check(Array.isArray(rows)&&rows.length>=2&&rows.length<=128&&typeof toc==='string'&&Buffer.byteLength(toc)<=1024**2);
 const lines=toc.split(/\r?\n/),map=new Map(),topology=[];
 for(const r of rows){
  check(r&&Object.keys(r).sort().join(',')===[...fields].sort().join(','));
  check(r.schema==='realtime'&&[r.table,r.constraint,r.owner].every(identifier)&&r.kind==='p'
   &&['r','p'].includes(r.tableKind)&&typeof r.tablePartition==='boolean'&&typeof r.local==='boolean'
   &&[0,1].includes(r.inherited)&&r.parentAttached===true&&Number.isSafeInteger(r.childCount)&&r.childCount>=0&&r.childCount<=128
   &&['valid','ready','primary','unique'].every(k=>r[k]===true)
   &&r.externalDependencies===false&&r.extensionOwned===false,2);
  for(const [name,max]of[['definition',4096],['indexDefinition',8192]])check(typeof r[name]==='string'&&r[name].length>0
   &&Buffer.byteLength(r[name])<=max&&!r[name].includes('\0'),3);
  const root=r.parentConstraint===null;
  check(root?r.parentSchema===null&&r.parentTable===null&&r.local&&r.inherited===0&&r.tableKind==='p'&&!r.tablePartition
   :r.parentSchema==='realtime'&&[r.parentTable,r.parentConstraint].every(identifier)&&!r.local&&r.inherited===1&&r.tablePartition,4);
  const suffix=`CONSTRAINT realtime ${r.table} ${r.constraint} ${r.owner}`;
  check(lines.filter(line=>/^[1-9][0-9]*; 2606 [1-9][0-9]* /.test(line)&&line.replace(/^[1-9][0-9]*; 2606 [1-9][0-9]* /,'')===suffix).length===1,5);
  const tableSuffix=`TABLE realtime ${r.table} ${r.owner}`;
  check(lines.filter(line=>/^[1-9][0-9]*; 1259 [1-9][0-9]* /.test(line)&&line.replace(/^[1-9][0-9]*; 1259 [1-9][0-9]* /,'')===tableSuffix).length===1,6);
  check(!map.has(key(r)));map.set(key(r),r);topology.push(Object.fromEntries(fields.map(k=>[k,r[k]])));
 }
 const roots=[];
 for(const r of rows){
  check(rows.filter(child=>child.parentSchema===r.schema&&child.parentTable===r.table&&child.parentConstraint===r.constraint).length===r.childCount,7);
  let current=r;const seen=new Set();
  while(current.parentConstraint!==null){
   check(!seen.has(key(current)),7);seen.add(key(current));
   current=map.get([current.parentSchema,current.parentTable,current.parentConstraint].join('\0'));check(current,7);
  }
  if(r===current){check(rows.some(child=>child.parentSchema===r.schema&&child.parentTable===r.table&&child.parentConstraint===r.constraint));roots.push(r);}
 }
 // Exactly one inherited family; ordinary realtime PKs were never selected.
 // Multiple families are ambiguous and must not become a broad pre-clean.
 check(roots.length===1,8);
 topology.sort((a,b)=>key(a).localeCompare(key(b),'en'));
 roots.sort((a,b)=>key(a).localeCompare(key(b),'en'));
 return{topology,dropSQL:'BEGIN; '+roots.map(r=>`ALTER TABLE ${quote(r.schema)}.${quote(r.table)} DROP CONSTRAINT ${quote(r.constraint)} RESTRICT;`).join(' ')+' COMMIT;'};
}
