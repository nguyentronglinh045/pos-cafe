import {readFileSync,writeFileSync,lstatSync,realpathSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root='D:/Workspace/pos-cafe-permission-timeonly-20261022/code';
const output='D:/Workspace/pos-cafe-docs/docs/implementation-log/permission-main-staging-night-20261022/canonical-bytes01.json';
const git=args=>execFileSync('git',args,{cwd:root,maxBuffer:128*1024**2,windowsHide:true});
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const before=git(['status','--porcelain=v1','-z']);
const dirty=new Set(git(['diff','--name-only','-z','HEAD','--']).toString().split('\0').filter(Boolean));
const entries=git(['ls-files','--stage','-z']).toString().split('\0').filter(Boolean).map(row=>{
 const match=/^(100644|100755) ([a-f0-9]{40}) 0\t(.+)$/.exec(row);if(!match)throw Error('TRACKED_ENTRY');
 return {oid:match[2],path:match[3]};
}).filter(row=>!dirty.has(row.path));
if(lstatSync(output,{throwIfNoEntry:false}))throw Error('RECEIPT_EXISTS');
const head=git(['rev-parse','HEAD']).toString().trim();
const batch=execFileSync('git',['cat-file','--batch'],{cwd:root,input:entries.map(row=>row.oid).join('\n')+'\n',maxBuffer:128*1024**2,windowsHide:true});
let offset=0;const rows=[];
for(const entry of entries){
 const end=batch.indexOf(10,offset);if(end<offset)throw Error('BATCH_HEADER');
 const match=/^([a-f0-9]{40}) blob ([0-9]+)$/.exec(batch.subarray(offset,end).toString());
 if(!match||match[1]!==entry.oid)throw Error('BATCH_OBJECT');
 const size=Number(match[2]),bytes=batch.subarray(end+1,end+1+size);offset=end+1+size+1;
 if(bytes.length!==size||batch[offset-1]!==10)throw Error('BATCH_BYTES');
 const path=resolve(join(root,entry.path)),stat=lstatSync(path),base=resolve(root);
 if(!path.startsWith(base+'\\')||!stat.isFile()||stat.isSymbolicLink()||stat.nlink!==1||realpathSync(path)!==path)throw Error('FILE_IDENTITY');
 const current=readFileSync(path);
 rows.push({...entry,absolutePath:path,bytes,current,changed:!current.equals(bytes)});
}
if(offset!==batch.length||git(['rev-parse','HEAD']).toString().trim()!==head)throw Error('SOURCE_DRIFT');
// Only files already known unmodified by Git are rewritten to their own HEAD
// blob. All authored files remain excluded, including concurrent builder files.
for(const row of rows)if(row.changed)writeFileSync(row.absolutePath,row.bytes);
const changed=rows.filter(row=>row.changed).map(row=>({path:row.path,beforeBytes:row.current.length,afterBytes:row.bytes.length,sha256:hash(row.bytes)}));
const receipt={schemaVersion:'permission-ci-local-canonical-byte-receipt-v1',recordedAtUtc:new Date().toISOString(),sourceRoot:root,sourceSHA:head,
 operation:'CANONICAL_GIT_BYTES_ONLY_ON_PREVIOUSLY_UNMODIFIED_TRACKED_FILES',excludedModifiedPaths:[...dirty].sort(),changedFiles:changed,
 noInstall:true,noNetwork:true,beforeStatusSHA256:hash(before),remainingTrackedDiff:git(['diff','--name-only','HEAD','--']).toString().trim().split('\n').filter(Boolean)};
writeFileSync(output,JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({sourceSHA:head,canonicalizedFiles:changed.length,excludedModifiedPaths:[...dirty].sort(),receipt:output}));
