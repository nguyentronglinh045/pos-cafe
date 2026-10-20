// Private server/client/catalog correlation. Only the allowlisted bounded
// integers leave the fixture; never export log text, SQL, identifiers or PID.
export const T04_RESTORE_SQLSTATES=Object.freeze(['2BP01','55006','42P01','42704','42501','42710','23505','23503','23514','0A000',
 'XX000','XX001','XX002','54000','53300','53200','53100','57014','25P02','42601','3F000','28P01','08006','40001','40P01',
 '55000','42P16','42P17','42809','42883','42703','22023','23502','25001','53400','53000','57P01','57P03','P0001','22012']);
export const T04_DIAGNOSTIC_BOUNDS=Object.freeze({t04PreflightOrdinal:[0,2],t04RestoreLogObserved:[0,4],
 t04RestoreSqlstateOrdinal:[0,T04_RESTORE_SQLSTATES.length],t04RestoreTargetObserved:[0,4],t04RestoreSchemaOrdinal:[0,10],
 t04RestoreLogCapabilityMask:[0,15],t04PreflightControlOrdinal:[0,4],
 t04RestoreConstraintKind:[0,6],t04RestoreConstraintLocal:[0,1],t04RestoreConstraintInherited:[0,32767],
 t04RestoreConstraintParent:[0,1],t04RestoreDependencyMask:[0,31]});
const unknown=()=>({t04RestoreLogObserved:0,t04RestoreSqlstateOrdinal:0});
const bounded=value=>{if(Buffer.isBuffer(value)){if(value.length>1024**2)return null;value=value.toString('utf8');}
 return typeof value==='string'&&Buffer.byteLength(value)<=1024**2?value:null;};
const escape=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
function prefixRegex(prefix){
 if(typeof prefix!=='string'||Buffer.byteLength(prefix)>256||!prefix.includes('%p')||!/%[mt]/.test(prefix))return null;
 const timestamp='[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}(?:\\.[0-9]{1,6})? [A-Za-z0-9_+:/-]{1,32}';
 const tokens={m:timestamp,t:timestamp,p:'(?<pid>[1-9][0-9]{0,9})',q:'',u:'[^\\s\\r\\n]{0,63}',d:'[^\\s\\r\\n]{0,63}',
  a:'[^\\r\\n]{0,128}?',h:'[^\\s\\r\\n]{0,128}',r:'[^\\r\\n]{0,128}?',l:'[0-9]{1,10}',c:'[0-9a-f.]{1,64}',
  v:'[0-9/]{1,32}',x:'[0-9]{1,20}',i:'[^\\r\\n]{0,64}?',e:'[A-Z0-9]{5}',b:'[^\\r\\n]{0,64}?','%':'%'};
 let text='',pids=0,count=0;
 for(let i=0;i<prefix.length;i++){if(prefix[i]!=='%'){text+=escape(prefix[i]);continue;}const token=prefix[++i];
  if(!Object.hasOwn(tokens,token)||++count>24||token==='p'&&++pids>1)return null;text+=tokens[token];}
 if(pids!==1)return null;
 try{return new RegExp('^'+text+'(?<severity>ERROR|FATAL|STATEMENT|DETAIL|HINT|CONTEXT|LOCATION):\\s+(?<body>[^\\r\\n]*)$');}catch{return null;}
}
function clientFailure(stderr){
 stderr=bounded(stderr);if(stderr===null)return null;
 const headers=[...stderr.matchAll(/^pg_restore: error: could not execute query: (?:ERROR|FATAL):\s*([^\r\n]*)/gm)];
 const commands=[...stderr.matchAll(/^Command was: ([^\r\n]*)/gm)];
 if(headers.length!==1||commands.length!==1||!commands[0][1].trim())return null;
 const command=stderr.slice(commands[0].index+'Command was: '.length).trim();
 if(/[\r\n]/.test(command))return null;
 return{primary:headers[0][1].trim(),command};
}
export function t04LogCapabilityMask(driver,logging){
 return Number(['json-file','local'].includes(driver))
  +2*Number(logging?.collector==='off')
  +4*Number(typeof logging?.destination==='string'&&logging.destination.split(',').map(x=>x.trim()).includes('stderr'))
  +8*Number(prefixRegex(logging?.prefix)!==null);
}
export function t04CorrelateServerLog(primary,command,log,prefix,expectedPid){
 primary=bounded(primary);command=bounded(command);log=bounded(log);
 if(primary===null||command===null||log===null||!primary||!command||/[\r\n]/.test(primary+command)
  ||expectedPid!==undefined&&(!Number.isSafeInteger(expectedPid)||expectedPid<1||expectedPid>2147483647))return unknown();
 const parse=prefixRegex(prefix);if(!parse)return{t04RestoreLogObserved:3,t04RestoreSqlstateOrdinal:0};
 const errors=[],lastByPid=new Map();const lines=log.split(/\r?\n/);if(lines.length>10000)return unknown();
 for(const line of lines){if(Buffer.byteLength(line)>65536)return unknown();const match=parse.exec(line);if(!match)continue;
  const{pid,severity,body}=match.groups;
  if(severity==='ERROR'||severity==='FATAL'){
   const error=/^([A-Z0-9]{5}):\s+(.*)$/.exec(body);lastByPid.delete(pid);
   if(error){const record={pid:Number(pid),message:error[2].trim(),state:error[1],statements:[]};errors.push(record);lastByPid.set(pid,record);}
  }else if(severity==='STATEMENT'){const record=lastByPid.get(pid);if(record)record.statements.push(body.trim());}
 }
 const matches=errors.filter(e=>(expectedPid===undefined||e.pid===expectedPid)&&e.message===primary
  &&e.statements.length===1&&e.statements[0]===command);
 if(matches.length!==1)return{t04RestoreLogObserved:matches.length>1?2:0,t04RestoreSqlstateOrdinal:0};
 return{t04RestoreLogObserved:1,t04RestoreSqlstateOrdinal:T04_RESTORE_SQLSTATES.indexOf(matches[0].state)+1};
}
export function t04CorrelateRestoreLog(stderr,log,prefix){
 const error=clientFailure(stderr);return error?t04CorrelateServerLog(error.primary,error.command,log,prefix):unknown();
}

// This private target is never exported. A full command must fit this narrow
// pg_restore grammar; identifiers become query parameters, never executable SQL.
export function t04RestoreConstraintTarget(stderr){
 const error=clientFailure(stderr);if(!error)return null;
 const id='(?:"(?:[^"\\r\\n\\0]|"")+"|[a-z_][a-z_0-9$]*)';
 const pattern=new RegExp('^ALTER TABLE (?:IF EXISTS )?(?:ONLY )?('+id+')\\.('+id+') DROP CONSTRAINT (?:IF EXISTS )?('+id+');$');
 const match=pattern.exec(error.command);if(!match)return null;
 const decode=s=>s.startsWith('"')?s.slice(1,-1).replaceAll('""','"'):s;
 const [schema,table,constraint]=match.slice(1).map(decode);
 if([schema,table,constraint].some(s=>!s||Buffer.byteLength(s)>63))return null;
 return{schema,table,constraint};
}
export function t04ConstraintCatalogFacts(target,rows,toc){
 const absent=n=>({t04RestoreTargetObserved:n});
 if(!target||!Array.isArray(rows)||rows.length!==1)return absent(3);
 const r=rows[0];toc=bounded(toc);
 if(toc===null||r.schema!==target.schema||r.table!==target.table||r.constraint!==target.constraint
  ||!Number.isSafeInteger(r.oid)||r.oid<1||r.oid>4294967295||typeof r.owner!=='string'
  ||!['c','f','p','u','t','x'].includes(r.kind)||typeof r.local!=='boolean'||typeof r.parent!=='boolean'
  ||!Number.isSafeInteger(r.inherited)||r.inherited<0||r.inherited>32767
  ||!Number.isSafeInteger(r.dependencies)||r.dependencies<0||r.dependencies>31)return absent(3);
 // pg_restore --list has unquoted names. Refuse whitespace/ambiguous names
 // instead of inferring an archive entry from a partially matching identifier.
 if([r.schema,r.table,r.constraint,r.owner].some(s=>!/^[A-Za-z_][A-Za-z_0-9$]*$/.test(s)))return absent(4);
 // Internal object OIDs change after a successful clean restore. Correlate the
 // unique logical object in the immutable archive, never require its old OID.
 const suffix=`${r.kind==='f'?'FK ':''}CONSTRAINT ${r.schema} ${r.table} ${r.constraint} ${r.owner}`;
 const matches=toc.split(/\r?\n/).filter(s=>{
  const m=/^[1-9][0-9]*; 2606 ([1-9][0-9]*) (.+)$/.exec(s);
  return m&&Number(m[1])<=4294967295&&m[2]===suffix;
 });
 if(matches.length!==1)return absent(4);
 const schemas=['public','private','auth','storage','realtime','extensions','vault','graphql_public','graphql','supabase_functions'];
 return{t04RestoreTargetObserved:1,t04RestoreSchemaOrdinal:schemas.indexOf(r.schema)+1,
  t04RestoreConstraintKind:['c','f','p','u','t','x'].indexOf(r.kind)+1,t04RestoreConstraintLocal:Number(r.local),
  t04RestoreConstraintInherited:r.inherited,t04RestoreConstraintParent:Number(r.parent),t04RestoreDependencyMask:r.dependencies};
}
