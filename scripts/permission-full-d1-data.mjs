import {createHash} from 'node:crypto';
import {parseText,PIN19_ERRORS} from './permission-full-pin-plan.mjs';
import {LEGACY_ERRORS} from './permission-full-legacy-plan.mjs';
import {PLAN_ERRORS} from './permission-full-budget-plan.mjs';
export const D1_VERSION='permission-full-composition-v1';
export const D1_ERRORS=Object.freeze(['INPUT','SCHEMA','PATH','SOURCE','DUPLICATE','PARTITION','OPTIONS','ORACLE','BINDING','BACKEND','CUSTODY','AUTHENTICATION','BOUND','EXECUTION_NOT_GRANTED'].map(x=>'D1_'+x));
export class D1Error extends Error{constructor(code){super('D1_'+code);this.code=this.message;}}
export const demand=(v,code='SCHEMA')=>{if(!v)throw new D1Error(code);};
export const freeze=v=>{if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
export const sha=v=>createHash('sha256').update(v).digest('hex');
export const hex=v=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
export const uint=v=>Number.isSafeInteger(v)&&v>=0;
export const str=v=>typeof v==='string'&&v.length>0&&v.length<=2048;
export const record=(v,keys)=>{demand(v!==null&&typeof v==='object'&&!Array.isArray(v));demand(Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k)));return v;};
export function data(text){demand(typeof text==='string','INPUT');let v;try{v=parseText(text);}catch{throw new D1Error('INPUT');}const walk=(x,d=0)=>{demand(d<=40,'INPUT');if(x&&typeof x==='object')for(const[k,v]of Object.entries(x)){demand(!['__proto__','prototype','constructor'].includes(k));walk(v,d+1);}};walk(v);return v;}
export function safePath(v){return str(v)&&/^[A-Za-z0-9_.\/-]+$/.test(v)&&v.split('/').every(p=>p&&p!=='.'&&p!=='..'&&!/[. ]$/.test(p)&&!/^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(p));}
export const result=(decision,details={})=>freeze({...details,schemaVersion:D1_VERSION,modelDecision:decision,valid:false,authentication:'NOT_PROVEN',evidenceMode:'PLAN_ONLY',execution:'NOT_RUN',runtimeAdmission:'NOT_RUN',custodyObserved:'NOT_RUN',fullGate:'NOT_RUN',intentionalCleanupAllowed:false,effects:0});
export function checked(action){try{return action();}catch(e){if(e instanceof D1Error)return result('STOP',{errors:[e.code]});if(e instanceof Error&&(Object.values(PIN19_ERRORS).some(a=>a.includes(e.message))||LEGACY_ERRORS.includes(e.code??e.message)||PLAN_ERRORS.includes(e.code??e.message)||e.message==='PERMISSION_CUSTODY_BINDING_REFUSED'))return result('STOP',{errors:['D1_ORACLE'],componentError:e.code??e.message});throw e;}}
export function identity(v){record(v,['baseCommit','targetCommit','sourceFingerprint','lockSha256','recipeSha256','graphSha256']);demand(v.baseCommit==='567af2191400ef559e90b3eccae0a0e4992f82e5'&&v.targetCommit==='2da0d7e10d65ed4e79c8628d65220582a6cbd32b','SOURCE');for(const k of ['sourceFingerprint','lockSha256','recipeSha256','graphSha256'])demand(hex(v[k]),'SOURCE');return v;}
export function sameIdentity(a,b){identity(a);identity(b);demand(JSON.stringify(a)===JSON.stringify(b),'BINDING');}

// Semantic parser for a codec-verified large payload. Framing integrity never
// licenses clipping a report or skipping duplicate-key/schema checks.
export function largeData(text){
 demand(typeof text==='string'&&Buffer.byteLength(text)<=8*1024**2,'INPUT');let i=0,nodes=0;
 const ws=()=>{while(i<text.length&&/[\t\r\n ]/.test(text[i]))i++;};
 const string=()=>{const start=i++;while(i<text.length){const c=text[i++];if(c==='\\'){i++;continue;}if(c==='"'){let s;try{s=JSON.parse(text.slice(start,i));}catch{throw new D1Error('INPUT');}demand(s.isWellFormed(),'INPUT');return s;}}demand(false,'INPUT');};
 const val=depth=>{demand(depth<=64&&++nodes<=300000,'INPUT');ws();const c=text[i];if(c==='"')return string();
  if(c==='{'||c==='['){i++;ws();const object=c==='{',end=object?'}':']',out=object?Object.create(null):[],seen=new Set();if(text[i]===end){i++;return out;}
   for(;;){ws();let k;if(object){demand(text[i]==='"','INPUT');k=string();demand(!seen.has(k),'DUPLICATE');demand(!['__proto__','constructor','prototype'].includes(k));seen.add(k);ws();demand(text[i++]===':','INPUT');}
    const v=val(depth+1);if(object)out[k]=v;else out.push(v);ws();if(text[i]===end){i++;return out;}demand(text[i++]===',','INPUT');}}
  for(const[t,v]of[['null',null],['true',true],['false',false]])if(text.startsWith(t,i)){i+=t.length;return v;}
  const n=/^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/.exec(text.slice(i));demand(n,'INPUT');i+=n[0].length;const v=Number(n[0]);demand(Number.isSafeInteger(v)&&!Object.is(v,-0),'INPUT');return v;};
 const v=val(0);ws();demand(i===text.length,'INPUT');return v;
}
