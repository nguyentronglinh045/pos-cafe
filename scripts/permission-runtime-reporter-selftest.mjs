import{RUNTIME_ERROR_CODES}from'./permission-runtime-error-facts.mjs';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync,lstatSync,realpathSync,readdirSync} from 'node:fs';
import {resolve,relative,join} from 'node:path';
import {spawnSync,execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {runtimeHash,validateRuntimeStage} from './permission-runtime-results.mjs';
import{diagnosticReporterSelftest,verifyDiagnosticPipeline}from'./permission-runtime-diagnostic-selftest.mjs';

const fail=()=>{throw Error('PERMISSION_REPORTER_SELFTEST_FAILED');};
const check=x=>{if(!x)fail();};
// Extra subscenario of the existing Vitest negative control. The original
// four control groups and seven diagnostic groups/20 mutations remain intact.
function beforeAllHookControl(root,parent,{sourceSHA,lockSHA}){
  const dir=join(parent,'vitest-beforeall-skipped');mkdirSync(dir);
  const testFile=join(dir,'example.test.mjs'),configFile=join(dir,'config.mjs');
  const fixture=resolve(root,'tests/contracts/permissionImagesFixture.ts');
  const line=readFileSync(fixture,'utf8').split(/\r?\n/).findIndex(x=>x.includes('throw Object.assign(new Error("IMAGE_EXPIRED_JWT_FIXTURE_UNAVAILABLE")'))+1;
  check(line>0);
  const stack='Error: PRIVATE_DIAGNOSTIC_SENTINEL\n    at expiredImageStoreJwt ('+fixture.replaceAll('\\','/')+':'+line+':7)';
  writeFileSync(testFile,`import{test,beforeAll}from'vitest';import{annotateImageHookFailure}from${JSON.stringify(pathToFileURL(resolve(root,'scripts/permission-runtime-error-facts.mjs')).href)};
    beforeAll(()=>{const error=Object.assign(new Error('IMAGE_EXPIRED_JWT_FIXTURE_UNAVAILABLE'),{privatePayload:'PRIVATE_DIAGNOSTIC_SENTINEL',permissionImageJwtSubreasonOrdinal:8,permissionImageJwtAlgorithmOrdinal:2,permissionImageJwtAuthStatus:401});error.stack=${JSON.stringify(stack)};throw annotateImageHookFailure(error,7);});test('required',()=>{throw Error('BODY_MUST_NOT_RUN');});\n`);
  const file=relative(root,testFile).replaceAll('\\','/');
  writeFileSync(configFile,`export default {test:{include:[${JSON.stringify(file)}],environment:'node',allowOnly:false,retry:0,maxWorkers:1,fileParallelism:false,passWithNoTests:false}};\n`);
  const argv=[resolve(root,'node_modules/vitest/vitest.mjs'),'run','--config',configFile,'--reporter','./scripts/permission-runtime-vitest-reporter.mjs'];
  const context={stage:'candidate-images-service',runner:'vitest',sourceSHA,sourceFingerprint:runtimeHash('beforeall-hook-control:'+sourceSHA),lockSHA,
    configSHA:runtimeHash(readFileSync(configFile)),runId:process.env.GITHUB_RUN_ID??'1',invocationSHA:runtimeHash(argv),sourceRoot:root,outputRoot:dir};
  const cp=join(dir,'context.json');writeFileSync(cp,JSON.stringify(context));
  const child=spawnSync(process.execPath,argv,{cwd:root,env:{...process.env,PERMISSION_RUNTIME_CONTEXT:cp},encoding:'utf8',timeout:45000,maxBuffer:128*1024,windowsHide:true});
  check(!child.error&&!child.signal&&child.status!==0);
  const raw=readFileSync(join(dir,context.stage+'-runner.json'),'utf8');check(!raw.includes('PRIVATE_DIAGNOSTIC_SENTINEL')&&!raw.includes('BODY_MUST_NOT_RUN'));
  const report=JSON.parse(raw),expected={stage:context.stage,runner:'vitest',required:[{file,name:'required',project:null}],files:[file],configSHA:context.configSHA,exactDiscovery:true,argv};
  check(report.discovery.length===1&&report.results.length===1&&report.results[0].state==='skipped'&&report.hookErrorCount===1&&report.errorCount===0);
  check(report.failureLocation.fileOrdinal===10&&report.failureLocation.line===line);
  let refused=false;try{validateRuntimeStage(expected,report,context,child.status);}catch{refused=true;}check(refused);
  verifyDiagnosticPipeline(expected,report,{...context,argv},'hook-error');
}
export function reporterSelftest(root=process.cwd()){
  root=realpathSync(root);const parent=resolve(root,'artifacts');mkdirSync(parent,{recursive:true});
  check(!lstatSync(parent).isSymbolicLink()&&realpathSync(parent)===parent);
  const temporary=mkdtempSync(join(parent,'permission-reporter-selftest-'));
  const counts={run:4,pass:0,fail:0,skip:0,positiveControls:2,negativeControls:2};
  try{
    const sourceSHA=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8',timeout:10000}).trim();
    const lockSHA=runtimeHash(readFileSync(join(root,'package-lock.json')));
    const imageCache=spawnSync(process.execPath,[join(root,'scripts/permission-t04-image-browser-control.mjs')],{cwd:root,encoding:'utf8',windowsHide:true,timeout:120000,maxBuffer:16384});
    check(!imageCache.error&&!imageCache.signal&&imageCache.status===0);
    const imageCacheRows=imageCache.stdout.split('\n').filter(line=>line.startsWith('T04_IMAGE_BROWSER_CONTROL '));check(imageCacheRows.length===1);
    const imageProof=JSON.parse(imageCacheRows[0].slice('T04_IMAGE_BROWSER_CONTROL '.length));
    check(imageProof.opaqueOriginRefused===1&&imageProof.stableOriginCache===1&&imageProof.crossOriginCache===1&&imageProof.noStoreRefused===1
      &&imageProof.bootstrapRefusals===3&&imageProof.freshAfterUnlink===1&&imageProof.guardFailureRefused===1&&imageProof.timedSamples===3
      &&Array.isArray(imageProof.observedMs)&&imageProof.observedMs.length===3
      &&imageProof.observedMs.every((ms,i)=>Number.isSafeInteger(ms)&&ms>=(59+i)*1000&&ms<(59+i)*1000+750)&&imageProof.guardCalls>=3);

    for(const kind of ['vitest-pass','vitest-hook-failure','playwright-pass','playwright-retry']){
      const dir=join(temporary,kind);mkdirSync(dir);
      const vitest=kind.startsWith('vitest'),negative=kind==='vitest-hook-failure'||kind==='playwright-retry';
      const testFile=join(dir,'example.test.mjs'),configFile=join(dir,'config.mjs');
      const name='suite > required',project=vitest?null:'reporter-selftest';
      // Exercise the pinned runner's real title formatter before DB profiles:
      // object placeholders quote strings in Vitest4; %s preserves canonical IDs.
      const expiryCases=[['expiry-minus-1ms','2026-09-22T00:04:59.999Z',true],
        ['expiry','2026-09-22T00:05:00.000Z',false],['expiry-plus-1ms','2026-09-22T00:05:00.001Z',false]];
      const canonicalTitle=offset=>'TC-PIN-08 completion rechecks '+offset+' after waiting for identity lock';
      // Runs in the existing post-browser positive control, never node-tools.
      // Real Lucide SVG + real Playwright semantics exercise the same helper
      // used by TC47, including native-image-present and missing-fallback refusals.
      const imageFallbackImports=!vitest&&!negative
        ?`import{candidateImageFallbackBrowserControl}from${JSON.stringify(pathToFileURL(resolve(root,'scripts/permission-candidate-browser-control.mjs')).href)};`:'';
      const imageFallbackControl=!vitest&&!negative?`
        expect(await candidateImageFallbackBrowserControl(page)).toEqual({svgPlaceholder:1,nativeImageRefused:1,missingPlaceholderRefused:1});
      `:'';
      const titleControls=vitest&&!negative
        ?`test.each(${JSON.stringify(expiryCases)})('TC-PIN-08 completion rechecks %s after waiting for identity lock',()=>expect(true).toBe(true));
          test.each(${JSON.stringify(expiryCases.map(([offset])=>({offset})))})('object-v4 TC-PIN-08 completion rechecks $offset after waiting for identity lock',()=>expect(true).toBe(true));`:'';
      writeFileSync(testFile,vitest
        ?`import {test,expect,afterAll,describe} from 'vitest';describe('suite',()=>{test('required',()=>expect(2+2).toBe(4));${titleControls}${negative?"afterAll(()=>{throw Error('SELFTEST_PRIVATE_ERROR_MUST_NOT_LEAK');});":''}});\n`
        :`import {test,expect} from '@playwright/test';${imageFallbackImports}test.describe('suite',()=>{test('required',async(${negative?'{}':'{page}'},info)=>{${negative?"if(info.retry===0)expect('EMPLOYEE_SESSION_REQUIRED','SELFTEST_PRIVATE_ERROR_MUST_NOT_LEAK cycle-1-grant/device0: REALTIME_TIMING_ORACLE_FAILED:signal-arrival').toBe('PIN_CHANGE_REQUIRED');expect(info.retry).toBe(1);":"await page.goto('data:text/html,<button>OK</button>');await expect(page.getByRole('button',{name:'OK'})).toBeVisible();"}${imageFallbackControl}});});\n`);
      const file=relative(root,testFile).replaceAll('\\','/');
      writeFileSync(configFile,vitest
        ?`export default {test:{include:[${JSON.stringify(file)}],environment:'node',allowOnly:false,retry:0,maxWorkers:1,fileParallelism:false,passWithNoTests:false}};\n`
        :`export default {testDir:${JSON.stringify(dir)},testMatch:'example.test.mjs',workers:1,retries:${negative?1:0},repeatEach:1,forbidOnly:true,timeout:10000,outputDir:${JSON.stringify(join(dir,'browser'))},use:{channel:'chromium',trace:'off',video:'off',screenshot:'off'},projects:[{name:'reporter-selftest'}]};\n`);
      const runner=vitest?'vitest':'playwright',configSHA=runtimeHash(readFileSync(configFile));
      const command=vitest?['node_modules/vitest/vitest.mjs','run','--config',configFile,'--reporter','./scripts/permission-runtime-vitest-reporter.mjs']
        :['node_modules/@playwright/test/cli.js','test','--config',configFile,'--reporter','./scripts/permission-runtime-playwright-reporter.mjs'];
      command[0]=resolve(root,command[0]);
      const context={stage:kind,runner,sourceSHA,sourceFingerprint:runtimeHash('reporter-infrastructure-selftest:'+sourceSHA),lockSHA,
        configSHA,runId:process.env.GITHUB_RUN_ID??'1',invocationSHA:runtimeHash(command),sourceRoot:root,outputRoot:dir};
      const cp=join(dir,'context.json');writeFileSync(cp,JSON.stringify(context));
      const child=spawnSync(process.execPath,command,{cwd:root,env:{...process.env,PERMISSION_RUNTIME_CONTEXT:cp},
        encoding:'utf8',timeout:45000,maxBuffer:128*1024});
      check(!child.error&&!child.signal);
      const raw=readFileSync(join(dir,kind+'-runner.json'),'utf8');check(!raw.includes('SELFTEST_PRIVATE_ERROR_MUST_NOT_LEAK'));
      const required=[{file,name,project},...(vitest&&!negative?expiryCases.flatMap(([offset])=>[
        {file,name:'suite > '+canonicalTitle(offset),project},
        {file,name:'suite > object-v4 '+canonicalTitle("'"+offset+"'"),project}]):[])];
      const report=JSON.parse(raw),expected={stage:kind,runner,required,files:[file],configSHA,exactDiscovery:true,argv:command};
      if(!negative){
        const observed=validateRuntimeStage(expected,report,context,child.status);
        if(vitest){
          check(observed.run===7);
          const wrong={...expected,required:required.map(x=>({...x,name:x.name.replace(/'([^']+)'/g,'$1')}))};
          let rejected=false;try{validateRuntimeStage(wrong,report,context,child.status);}catch{rejected=true;}check(rejected);
        }
      }
      else{
        let rejected=false;try{validateRuntimeStage(expected,report,context,child.status);}catch{rejected=true;}check(rejected);
        if(vitest){check(child.status!==0&&report.hookErrorCount>0&&report.results.every(r=>r.state==='passed'));
          beforeAllHookControl(root,temporary,{sourceSHA,lockSHA});counts.beforeAllHookDiagnostics='PASS';}
        else{check(child.status===0&&report.results[0].state==='passed'&&report.results[0].attempts===2&&report.discovery[0].retry===1);
          check(Number.isSafeInteger(report.failureLine)&&report.failureLine>=1&&report.failureLine<=100000&&report.realtimeFailureMask===1&&report.realtimeFirstFailureOrdinal===1);
          check(Object.keys(report.failureFacts).sort().join(',')==='errorCodeOrdinal,errorMatcherOrdinal,errorNameOrdinal');check(report.failureFacts.errorCodeOrdinal===RUNTIME_ERROR_CODES.indexOf('EMPLOYEE_SESSION_REQUIRED')+1&&report.failureFacts.errorMatcherOrdinal===1);}
      }
      counts.pass++;
    }
    counts.diagnosticControls=diagnosticReporterSelftest(root,temporary,{sourceSHA,lockSHA});
    return counts;
  }finally{
    const within=relative(parent,temporary);check(within.startsWith('permission-reporter-selftest-')&&!within.includes('..')
      &&realpathSync(temporary)===temporary);
    const inspect=p=>{for(const e of readdirSync(p,{withFileTypes:true})){const f=join(p,e.name);check(!lstatSync(f).isSymbolicLink());if(e.isDirectory())inspect(f);}};
    inspect(temporary);rmSync(temporary,{recursive:true});
  }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  try{console.log('PERMISSION_REPORTER_SELFTEST '+JSON.stringify(reporterSelftest()));}
  catch{console.log('PERMISSION_REPORTER_SELFTEST_FAILED');process.exitCode=1;}
}
