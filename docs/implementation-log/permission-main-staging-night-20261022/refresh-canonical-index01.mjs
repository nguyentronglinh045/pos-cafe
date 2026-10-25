import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root='D:/Workspace/pos-cafe-permission-timeonly-20261022/code';
const evidence='D:/Workspace/pos-cafe-docs/docs/implementation-log/permission-main-staging-night-20261022';
const receipt=JSON.parse(readFileSync(evidence+'/canonical-bytes01.json'));
const git=args=>execFileSync('git',['-c','core.autocrlf=false',...args],{cwd:root,maxBuffer:1024**2,windowsHide:true,stdio:['pipe','pipe','pipe']});
if(git(['diff','--cached','--name-only']).toString().trim())throw Error('PREEXISTING_STAGED_CHANGE');
for(const row of receipt.changedFiles){
 if(createHash('sha256').update(readFileSync(root+'/'+row.path)).digest('hex')!==row.sha256)throw Error('CANONICAL_FILE_CHANGED');
 if(!readFileSync(root+'/'+row.path).equals(git(['show','HEAD:'+row.path])))throw Error('NOT_HEAD_BYTES');
}
for(let index=0;index<receipt.changedFiles.length;index+=64)git(['add','--',...receipt.changedFiles.slice(index,index+64).map(row=>row.path)]);
if(git(['diff','--cached','--name-only']).toString().trim())throw Error('UNEXPECTED_STAGED_CHANGE');
const result={recordedAtUtc:new Date().toISOString(),operation:'REFRESH_INDEX_STAT_FOR_VERIFIED_UNMODIFIED_CANONICAL_FILES',fileCount:receipt.changedFiles.length,
 stagedContentChanges:0,remainingTrackedDiff:git(['diff','--name-only','HEAD','--']).toString().trim().split('\n').filter(Boolean)};
writeFileSync(evidence+'/canonical-index-refresh01.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result));
