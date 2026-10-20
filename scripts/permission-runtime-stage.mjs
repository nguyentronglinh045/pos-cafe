import {readFileSync,writeFileSync,mkdirSync,lstatSync,realpathSync,statSync} from 'node:fs';
import {resolve,join,relative,isAbsolute} from 'node:path';
import {execFileSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {runtimeHash,validateRuntimeStage} from './permission-runtime-results.mjs';
import {runtimeStage,runtimeStageCommand,runtimeConfigBinding} from './permission-runtime-catalog.mjs';
import {capturedCommand,trackedFingerprint} from './project-ci.mjs';

const check=x=>{if(!x)throw Error('PERMISSION_RUNTIME_STAGE_REFUSED');};
export function runtimeApplicationRunId(stage,runId){
  runtimeStage(stage);check(typeof runId==='string'&&/^[1-9][0-9]{0,19}$/.test(runId));
  // The legacy preflight's existing application contract requires a UUID.
  // Reporter context.runId independently retains the exact GitHub numeric ID.
  return stage==='legacy-t01-database'?randomUUID():runId;
}
export function prepareRuntimeDirectory(sourceRoot,outputRoot,guard){
  const root=realpathSync(sourceRoot),out=resolve(outputRoot),rel=relative(root,out);
  check(!isAbsolute(rel)&&rel.replaceAll('\\','/').startsWith('artifacts/')&&!rel.split(/[\\/]/).includes('..'));
  let p=root;const components=rel.split(/[\\/]/);
  for(const part of components){p=join(p,part);const info=lstatSync(p,{throwIfNoEntry:false});
    check(!info||info.isDirectory()&&!info.isSymbolicLink()&&realpathSync(p)===p);}
  check(!lstatSync(out,{throwIfNoEntry:false}));
  p=root;for(const part of components){p=join(p,part);if(!lstatSync(p,{throwIfNoEntry:false})){guard();mkdirSync(p,{mode:0o700});}}
  return out;
}
export async function executeRuntimeStage(stage,{sourceRoot,outputRoot,baseEnv,sourceSHA,sourceFingerprint,lockSHA,runId,guard,deadline}){
  let boundary=1,childExitCode;
  try{
  const s=runtimeStage(stage),root=resolve(sourceRoot),out=resolve(outputRoot);
  check(realpathSync(root)===root&&realpathSync(out)===out&&!lstatSync(out).isSymbolicLink()
    &&statSync(out).dev===statSync(root).dev&&typeof guard==='function'&&Number.isFinite(deadline));
  const git=args=>execFileSync('git',['-C',root,...args],{encoding:'utf8',timeout:10000,maxBuffer:128*1024});
  const paths=git(['ls-files','-z']).split('\0').filter(Boolean).sort();
  const unchanged=()=>{guard();check(git(['rev-parse','HEAD']).trim()===sourceSHA&&trackedFingerprint(root,paths)===sourceFingerprint
    &&runtimeHash(readFileSync(join(root,'package-lock.json')))===lockSHA);};
  unchanged();
  boundary=2;const configSHA=runtimeConfigBinding(stage,readFileSync(join(root,s.config.path)));
  const command=runtimeStageCommand(stage,{sourceRoot:root,outputRoot:out});
  const expected={...s,argv:command.runnerArgv};
  const context={stage,runner:s.runner,sourceSHA,sourceFingerprint,lockSHA,configSHA,runId,
    invocationSHA:runtimeHash(expected.argv),sourceRoot:root,outputRoot:command.reportRoot};
  boundary=3;const contextPath=join(out,stage+'-context.json');
  writeFileSync(contextPath,JSON.stringify(context),{flag:'wx',mode:0o600});
  const remaining=deadline-Date.now();check(remaining>1000);
  // Per-stage raw output never enters public evidence. The enclosing supervisor
  // owns the same write budget and kills the group on timeout/quota failure.
  boundary=4;const child=await capturedCommand(process.execPath,command.argv,{cwd:root,
    env:{...baseEnv,PERMISSION_RUNTIME_CONTEXT:contextPath,PERM_RUN_ID:runtimeApplicationRunId(stage,runId),PERM_RUN_STAGE:stage,PERM_RUN_CONFIG:configSHA},
    output:join(out,stage+'-private.log'),guard,timeoutMs:Math.min(s.timeoutMs,remaining),maxBytes:1024**2});
  childExitCode=child.exitCode;
  boundary=5;unchanged();check(child.blocked===false&&child.signalCode===null);
  boundary=6;const resultPath=join(command.reportRoot,stage+'-runner.json'),info=lstatSync(resultPath);
  check(info.isFile()&&!info.isSymbolicLink()&&info.size<=1024**2&&realpathSync(resultPath)===resultPath);
  const report=JSON.parse(readFileSync(resultPath));
  boundary=7;return validateRuntimeStage(expected,report,context,child.exitCode);
  }catch(error){if(error&&typeof error==='object'){error.runtimeStageBoundaryOrdinal=boundary;if(boundary>=5)error.runtimeStageChildExitCode=childExitCode??null;}throw error;}
}
