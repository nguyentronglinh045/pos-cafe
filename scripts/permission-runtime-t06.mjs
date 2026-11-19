import {execFileSync} from 'node:child_process';
import {lstatSync,realpathSync,statSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import {trackedFingerprint} from './project-ci.mjs';
import {runtimeHash} from './permission-runtime-results.mjs';
import {runtimeStage} from './permission-runtime-catalog.mjs';
import {T06_CANDIDATE_SHA,T06_CANDIDATE_TREE} from './permission-runtime-service-profile.mjs';

const candidateFingerprint='a543c8a7c5e0ea2d635b0843440191bd9cc6de102e4b4739e3319fe517d8ed37';
const hex64=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
const check=value=>{if(!value)throw Error('T06_CANDIDATE_EVIDENCE_REFUSED');};

export function t06CandidateCheckout(root) {
  const source=join(root,'candidate');
  const info=lstatSync(source);
  check(info.isDirectory()&&!info.isSymbolicLink()&&realpathSync(source)===source&&info.dev===statSync(root).dev);
  const git=args=>execFileSync('git',['-C',source,...args],{encoding:'utf8',timeout:10000,maxBuffer:256*1024}).trim();
  const sourceSHA=git(['rev-parse','HEAD']),tree=git(['rev-parse','HEAD^{tree}']);
  check(git(['rev-parse','--show-toplevel'])===source&&sourceSHA===T06_CANDIDATE_SHA&&tree===T06_CANDIDATE_TREE
    &&!git(['status','--porcelain','--untracked-files=no']));
  const paths=git(['ls-files','-z']).split('\0').filter(Boolean).sort();
  const sourceFingerprint=trackedFingerprint(source,paths);
  check(sourceFingerprint===candidateFingerprint);
  return {source,sourceSHA,tree,sourceFingerprint,lockSHA:runtimeHash(readFileSync(join(source,'package-lock.json')))};
}

export const t06DefaultCases=stage=>runtimeStage(stage).required.map(({name})=>({name,status:'NOT_RUN',lastPhase:null}));

export function t06ObservedCases(expected,report,context) {
  const keys=['stage','runner','sourceSHA','sourceFingerprint','lockSHA','configSHA','runId','invocationSHA'];
  check(report?.schemaVersion==='permission-runtime-stage-v1'&&report.complete===true
    &&keys.every(key=>report[key]===context[key])&&JSON.stringify(report.argv)===JSON.stringify(expected.argv)
    &&Array.isArray(report.discovery)&&Array.isArray(report.results));
  const identity=({file,name,project})=>JSON.stringify([file,name,project]);
  const allowed=new Set(expected.required.map(identity));
  check(report.discovery.length===allowed.size&&new Set(report.discovery.map(identity)).size===allowed.size
    &&report.discovery.every(item=>allowed.has(identity(item))&&item.retry===0&&item.repeats===1
      &&item.disabled===false&&item.exclusive===false&&item.expectedFailure===false)
    &&new Set(report.results.map(identity)).size===report.results.length
    &&report.results.every(item=>allowed.has(identity(item))&&item.attempts===1));
  return expected.required.map(test=>{
    const observed=report.results.find(item=>identity(item)===identity(test));
    const state=observed?.state;
    const clean=report.errorCount===0&&report.hookErrorCount===0;
    const status=state==='passed'?(clean?'PASS':'UNVERIFIED')
      :['failed','timedOut','fail'].includes(state)?'FAIL'
      :['skipped','pending','skip'].includes(state)?'NOT_RUN':'UNVERIFIED';
    return {name:test.name,status,lastPhase:null};
  });
}

const ackPhases=new Set(['PREFLIGHT','CREATE_STORE','RESTRICTED_LOGIN','READY_TO_COMPLETE','AFTER_SUBMIT','AFTER_UNCERTAIN_LOGIN','AFTER_REPLAY_PROBE',
  'AFTER_TEMP_LOGIN','AFTER_NEW_LOGIN','AFTER_PROTECTED_SHELL','AFTER_PREEXECUTE_SNAPSHOT',
  'AFTER_NEW_LOGIN_DENIAL','AFTER_TEMP_RESTRICTED_LOGIN'].map(value=>'PIN_ACK_PHASE_'+value));

export function t06AckPhases(path,cases) {
  try {
    const info=lstatSync(path);
    check(info.isFile()&&!info.isSymbolicLink()&&realpathSync(path)===path&&info.size<=16384);
    const proof=JSON.parse(readFileSync(path));
    check(proof.schema==='permission-pin-ack-safe-v1'&&proof.discovered===cases.length
      &&Array.isArray(proof.tests)&&proof.tests.length<=cases.length);
    return cases.map(item=>{
      const title=item.name.split(' > ').at(-1);
      const row=proof.tests.find(test=>test.title===title&&test.retry===0);
      return {...item,lastPhase:ackPhases.has(row?.lastPhase)?row.lastPhase:null};
    });
  }catch{return cases;}
}

export function validateT06Evidence(r,stage) {
  const t06=r.t06;
  const required=t06DefaultCases(stage);
  check(r.sourceSHA===T06_CANDIDATE_SHA&&r.workflowSHA!==r.sourceSHA&&r.sourceFingerprint===candidateFingerprint
    &&t06?.candidateTree===T06_CANDIDATE_TREE&&typeof t06.candidatePreserved==='boolean'
    &&Array.isArray(t06.cases)&&t06.cases.length===required.length
    &&t06.cases.every((item,i)=>Object.keys(item).sort().join(',')==='lastPhase,name,status'
      &&item.name===required[i].name&&['PASS','FAIL','NOT_RUN','UNVERIFIED'].includes(item.status)
      &&(item.lastPhase===null||stage==='t06-pin-ack'&&ackPhases.has(item.lastPhase)))
    &&Object.keys(t06).sort().join(',')==='candidatePreserved,candidateTree,cases,fixture');
  const f=t06.fixture;
  if(stage==='t06-pin-ack'){
    check(Object.keys(f).sort().join(',')==='postcheck'&&['NOT_RUN','PASS','FAIL'].includes(f.postcheck));
    if(r.status==='PASS')check(f.postcheck==='PASS');
  }else{
    check(Object.keys(f).sort().join(',')==='afterSHA,archiveSHA,baselineSHA,preflight,restore,storageSHA'
      &&['NOT_RUN','PASS','FAIL'].includes(f.preflight)&&['NOT_RUN','RESTORED_ORIGINAL','FAIL'].includes(f.restore)
      &&[f.afterSHA,f.archiveSHA,f.baselineSHA,f.storageSHA].every(value=>value===null||hex64(value)));
    if(r.status==='PASS')check(f.preflight==='PASS'&&f.restore==='RESTORED_ORIGINAL'
      &&[f.afterSHA,f.archiveSHA,f.baselineSHA,f.storageSHA].every(hex64));
  }
  if(r.failure==='candidate-preservation')check(t06.candidatePreserved===false);
  if(r.status==='PASS')check(t06.candidatePreserved&&t06.cases.every(item=>item.status==='PASS'));
}
