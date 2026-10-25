import {createHash} from 'node:crypto';
import {readFileSync,lstatSync,realpathSync,writeFileSync} from 'node:fs';
import {resolve,relative,isAbsolute} from 'node:path';

const refuse=()=>{throw Error('PERMISSION_RUNTIME_RESULTS_REFUSED');};
const check=value=>{if(!value)refuse();};
export const runtimeHash=value=>createHash('sha256').update(typeof value==='string'||Buffer.isBuffer(value)?value:JSON.stringify(value)).digest('hex');
const hex=(s,n)=>typeof s==='string'&&s.length===n&&new RegExp('^[a-f0-9]{'+n+'}$').test(s);
const key=x=>JSON.stringify([x.file,x.name,x.project??null]);

// This validates observations produced by real runner reporters. It cannot run
// tests, provision a backend, or close the independent supplemental oracles.
export function validateRuntimeStage(expected,report,context,exitCode) {
  let refusal=1;
  // Fixed validation sections only; predicates and PASS criteria stay intact.
  const check=value=>{if(!value){const error=Error('PERMISSION_RUNTIME_RESULTS_REFUSED');error.runtimeResultFailureOrdinal=refusal;throw error;}};
  check(exitCode===0);
  refusal=2;
  check(expected&&Array.isArray(expected.required)&&expected.required.length>0);
  refusal=3;
  check(context&&hex(context.sourceSHA,40)&&hex(context.sourceFingerprint,64)&&hex(context.lockSHA,64)
    &&hex(context.configSHA,64)&&typeof context.runId==='string'&&/^[1-9][0-9]{0,19}$/.test(context.runId));
  refusal=4;check(expected.configSHA===context.configSHA);
  refusal=5;
  check(Array.isArray(expected.argv)&&expected.argv.length>1&&expected.argv.every(a=>typeof a==='string'&&!/[\r\n\0]/.test(a))
    &&isAbsolute(expected.argv[0])&&context.invocationSHA===runtimeHash(expected.argv));
  refusal=6;check(report?.schemaVersion==='permission-runtime-stage-v1'&&report.stage===expected.stage&&report.runner===expected.runner);
  refusal=7;
  for(const k of ['sourceSHA','sourceFingerprint','lockSHA','configSHA','runId','invocationSHA'])check(report[k]===context[k]);
  refusal=8;check(JSON.stringify(report.argv)===JSON.stringify(expected.argv));
  refusal=9;
  check(hex(context.invocationSHA,64)&&report.complete===true&&report.errorCount===0&&report.hookErrorCount===0
    &&report.runnerExit==='passed'&&Array.isArray(report.discovery)&&Array.isArray(report.results));
  refusal=10;check(report.discovery.length>0&&report.discovery.length<=10000&&report.results.length===report.discovery.length);
  const allowedFiles=new Set(expected.files),required=new Set(expected.required.map(key));
  refusal=11;check(required.size===expected.required.length&&allowedFiles.size===expected.files.length);
  const discovery=new Map(),results=new Map();
  refusal=12;for(const x of report.discovery){
    check(x&&typeof x.name==='string'&&x.name.length>0&&x.name.length<=4096&&allowedFiles.has(x.file)
      &&(x.project===null||typeof x.project==='string')&&!discovery.has(key(x)));
    check(x.retry===0&&x.repeats===1&&x.expectedFailure===false&&x.exclusive===false&&x.disabled===false);
    discovery.set(key(x),x);
  }
  refusal=13;for(const x of report.results){
    check(x&&discovery.has(key(x))&&!results.has(key(x))&&x.state==='passed'&&x.attempts===1);
    results.set(key(x),x);
  }
  refusal=14;for(const k of required)check(discovery.has(k));
  refusal=15;if(expected.exactDiscovery===true)check(required.size===discovery.size);
  refusal=16;
  check(report.selectedFiles?.length===allowedFiles.size&&new Set(report.selectedFiles).size===allowedFiles.size
    &&report.selectedFiles.every(f=>allowedFiles.has(f)));
  return {stage:expected.stage,status:'PASS',required:required.size,discovered:discovery.size,run:results.size,
    pass:results.size,fail:0,skip:0,retry:0,reportSHA:runtimeHash(report),sourceSHA:context.sourceSHA,
    invocationSHA:context.invocationSHA,supplementalOracles:'NOT_PROVEN_BY_STAGE_COUNTS'};
}

export function runtimeReporterContext(env=process.env) {
  const path=resolve(env.PERMISSION_RUNTIME_CONTEXT??'');
  check(env.PERMISSION_RUNTIME_CONTEXT&&lstatSync(path).isFile()&&!lstatSync(path).isSymbolicLink()
    &&lstatSync(path).size<=16384&&realpathSync(path)===path);
  const c=JSON.parse(readFileSync(path,'utf8'));
  check(c&&typeof c.stage==='string'&&/^[a-z0-9-]+$/.test(c.stage)&&['vitest','playwright'].includes(c.runner));
  check(isAbsolute(c.sourceRoot)&&isAbsolute(c.outputRoot)&&realpathSync(c.sourceRoot)===c.sourceRoot
    &&realpathSync(c.outputRoot)===c.outputRoot&&lstatSync(c.outputRoot).isDirectory()&&!lstatSync(c.outputRoot).isSymbolicLink());
  for(const k of ['sourceFingerprint','lockSHA','configSHA','invocationSHA'])check(hex(c[k],64));
  check(hex(c.sourceSHA,40)&&typeof c.runId==='string'&&/^[1-9][0-9]{0,19}$/.test(c.runId));
  const out=resolve(c.outputRoot,c.stage+'-runner.json');
  check(relative(c.outputRoot,out)===c.stage+'-runner.json'&&!lstatSync(out,{throwIfNoEntry:false}));
  return {...c,outputPath:out};
}

export function reporterFile(sourceRoot,path) {
  const p=relative(sourceRoot,resolve(path)).replaceAll('\\','/');
  check(p&&!isAbsolute(p)&&!p.startsWith('../')&&!p.includes('/../'));
  return p;
}

export function writeRuntimeReport(c,value) {
  const output={schemaVersion:'permission-runtime-stage-v1',stage:c.stage,runner:c.runner,
    ...Object.fromEntries(['sourceSHA','sourceFingerprint','lockSHA','configSHA','runId','invocationSHA'].map(k=>[k,c[k]])),
    ...value,argv:process.argv.slice(1)};
  const b=Buffer.from(JSON.stringify(output)+'\n');check(b.length<=1024**2);
  writeFileSync(c.outputPath,b,{flag:'wx',mode:0o600});
}
