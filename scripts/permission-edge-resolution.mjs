import {readFileSync,writeFileSync,lstatSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {ci1EdgeIntake} from './permission-ci1-intake.mjs';

const check=(ok)=>{if(!ok)throw Object.assign(Error('EDGE_RESOLUTION_REFUSED'),{ci1FailureCode:'EDGE_RESOLUTION_INPUT'});};
const stable=value=>JSON.stringify(value,(_key,item)=>item&&typeof item==='object'&&!Array.isArray(item)?Object.fromEntries(Object.entries(item).sort(([a],[b])=>a.localeCompare(b))):item);
export const edgeInputHash=value=>createHash('sha256').update(stable(value)).digest('hex');
export const EDGE_CONFIG=Object.freeze({lock:{path:'./deno.lock',frozen:true},nodeModulesDir:'none'});
export const EDGE_RESOLUTION_FILES=Object.freeze(['deno.json','deno.lock']);

// Explicit duplicate-version edges: runtime's synthetic Node types request is
// constrained to22.5.4, while @types/ws requests the reviewed26.6.5 graph.
// A lock snapshot is resolver input; independent proof remains mandatory because
// Edgev1.74.3 does not enforce its frozen option when adding npm requirements.
export function expectedEdgeLock(manifest){
 const packages=ci1EdgeIntake(manifest),byName=new Map();
 for(const pin of packages){const list=byName.get(pin.name)??[];list.push(pin);byName.set(pin.name,list);}
 const explicit={'@types/ws@8.18.2:@types/node':'26.6.5','@types/node@26.6.5:undici-types':'8.9.0','@types/node@22.5.4:undici-types':'6.19.8'};
 const npm={};
 for(const pin of packages){
  const id=`${pin.name}@${pin.version}`,dependencies=[];
  for(const name of Object.keys(pin.dependencies).sort()){
   const candidates=byName.get(name)??[],exact=explicit[`${id}:${name}`];
   const target=exact?candidates.find(item=>item.version===exact):(candidates.length===1?candidates[0]:null);
   check(target);dependencies.push(`${name}@${target.version}`);
  }
  npm[id]={integrity:pin.integrity,...(dependencies.length?{dependencies}: {})};
 }
 check(npm['@types/node@22.5.4']);
 return{version:'4',specifiers:{[`npm:${manifest.root}`]:manifest.root.slice(manifest.root.lastIndexOf('@')+1),'npm:@types/node@*':'22.5.4'},npm};
}
function readJSON(path){const info=lstatSync(path);check(info.isFile()&&!info.isSymbolicLink()&&info.nlink===1&&info.size<=128*1024);return JSON.parse(readFileSync(path,'utf8'));}
export function assertEdgeResolution(directory,manifest){
 const config=readJSON(join(directory,'deno.json')),lock=readJSON(join(directory,'deno.lock'));
 check(stable(config)===stable(EDGE_CONFIG)&&stable(lock)===stable(expectedEdgeLock(manifest)));
 return{configSHA256:edgeInputHash(config),lockSHA256:edgeInputHash(lock),packages:manifest.packages.length};
}
export function installEdgeResolution(source,functions,manifest){
 const reviewed=join(source,'tests/permissions/runtime/edge-resolution');assertEdgeResolution(reviewed,manifest);
 for(const name of EDGE_RESOLUTION_FILES)writeFileSync(join(functions,name),readFileSync(join(reviewed,name)),{flag:'wx',mode:0o400});
 return assertEdgeResolution(functions,manifest);
}
export function publicEdgeResolution(value,sourceSHA){
 const keys=['schemaVersion','sourceSHA','scope','configSHA256','lockSHA256','cacheSHA256','packages','observed','metadataOnly','warmBundles','runtimeBadSRIControls','rootRemoved','processReleased'];
 check(value&&Object.keys(value).sort().join(',')===keys.sort().join(',')&&value.schemaVersion==='permission-edge-resolution-v1'&&value.scope==='NATIVE_RESOLVER_ONLY'
  &&/^[a-f0-9]{40}$/.test(sourceSHA)&&value.sourceSHA===sourceSHA
  &&['configSHA256','lockSHA256','cacheSHA256'].every(key=>/^[a-f0-9]{64}$/.test(value[key]??''))
  &&value.packages===20&&Number.isSafeInteger(value.observed)&&value.observed>=17&&value.observed<=20
  &&Number.isSafeInteger(value.metadataOnly)&&value.metadataOnly>=0&&value.metadataOnly<=3&&value.observed+value.metadataOnly===20
  &&value.warmBundles===2&&value.runtimeBadSRIControls===1&&value.rootRemoved===true&&value.processReleased===true);
 return Object.fromEntries(keys.map(key=>[key,value[key]]));
}
export function edgeResolutionCounts(output,sourceSHA){
 const lines=output.split('\n').filter(line=>line.startsWith('PERMISSION_EDGE_RESOLUTION '));check(lines.length===1);
 return{run:3,pass:3,fail:0,skip:0,positiveControls:2,negativeControls:1,edgeResolution:publicEdgeResolution(JSON.parse(lines[0].slice('PERMISSION_EDGE_RESOLUTION '.length)),sourceSHA)};
}
export const EDGE_PROBE_PUBLIC_LIMITS=Object.freeze({edgeProbeReason:36,edgeProbePackage:100,edgeProbeVersionMajor:1000000,edgeProbeVersionMinor:1000000,edgeProbeVersionPatch:1000000,
 edgeProbeStage:10,edgeProbePrimaryReason:36,edgeProbePrimaryIO:3,edgeProbeCleanupReason:36,edgeProbeCleanupIO:3,edgeProbeRootRemoved:1,edgeProbeProcessReleased:1});
export function edgeProbeFailureMetrics(output){
 if(typeof output!=='string'||Buffer.byteLength(output)>1024**2)return{};
 const lines=output.split(/\r?\n/).filter(line=>line.startsWith('PERMISSION_EDGE_PROBE_FAILURE '));if(lines.length!==1)return{};
 try{const value=JSON.parse(lines[0].slice('PERMISSION_EDGE_PROBE_FAILURE '.length));
  if(Object.keys(value).sort().join(',')!==Object.keys(EDGE_PROBE_PUBLIC_LIMITS).sort().join(',')||!Object.entries(EDGE_PROBE_PUBLIC_LIMITS).every(([key,max])=>Number.isSafeInteger(value[key])&&value[key]>=0&&value[key]<=max))return{};
  return value;
 }catch{return{};}
}
