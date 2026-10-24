import{runtimeHash}from'./permission-runtime-results.mjs';
const check=x=>{if(!x)throw Error('PERMISSION_CONTAINER_STATE_REFUSED');};
const compare=(a,b)=>a<b?-1:a>b?1:0;
export function canonicalContainerValue(value){
 if(value===null||typeof value==='string'||typeof value==='boolean')return value;
 if(typeof value==='number'){check(Number.isFinite(value));return value;}
 if(Array.isArray(value))return value.map(canonicalContainerValue);
 check(value&&Object.getPrototypeOf(value)===Object.prototype);
 return Object.fromEntries(Object.keys(value).sort(compare).map(k=>[k,canonicalContainerValue(value[k])]));
}
export function canonicalContainerMounts(mounts){
 check(Array.isArray(mounts)&&mounts.length<=128&&mounts.every(m=>m&&typeof m.Destination==='string'
  &&m.Destination.startsWith('/')&&!/[\r\n\0]/.test(m.Destination))&&new Set(mounts.map(m=>m.Destination)).size===mounts.length);
 return mounts.slice().sort((a,b)=>compare(a.Destination,b.Destination)).map(canonicalContainerValue);
}
export function containerContinuityHash(container){
 check(container?.Config&&container.HostConfig);
 return runtimeHash([canonicalContainerValue(container.Config),canonicalContainerValue(container.HostConfig),canonicalContainerMounts(container.Mounts)]);
}
