import {readFileSync} from 'node:fs';
import {resolve,isAbsolute} from 'node:path';
import {pinnedStageMap} from './permission-full-perm-plan.mjs';
import {FULL_STAGE_PLAN} from './permission-full-controller.mjs';
import {runtimeHash} from './permission-runtime-results.mjs';

// The two metadata-only corrections were reviewed in full-port-plan04. Original
// mappings and historical config pins remain in full-pin19-integrated.json.
const rebindings={
  'playwright.pin-onboard-closeout.config.ts':'05203e6f86fb0b6e4e25099725a232e1155ad2de325356a5a628d1a637fe9d73',
  'playwright.pin-tc18.config.ts':'a268f4913f6f9309389de21958363181ff54f82b5355c1298a9cf91cc9d23fc1',
};
const pin=JSON.parse(readFileSync(new URL('../tests/permissions/full-pin19-integrated.json',import.meta.url)));
const perm=pinnedStageMap();
const refuse=()=>{throw Error('PERMISSION_RUNTIME_CATALOG_REFUSED');};
const check=x=>{if(!x)refuse();};
const key=x=>JSON.stringify([x.file,x.name,x.project??null]);
const catalog=FULL_STAGE_PLAN.map(s=>{
  const p=perm.stages.find(x=>x.stage===s.stage);
  if(p)return {...s,runner:p.runner,files:[...p.files],required:structuredClone(p.required),
    config:structuredClone(p.configuration),configSHA:p.configuration.sha256,exactDiscovery:false,
    executionKind:p.executionKind,rollbackVariant:p.recipe.rollbackVariant,
    timeoutMs:10*60000,wrapper:null};
  const mappings=pin.mappings.filter(m=>m.stage===s.stage);check(mappings.length>0);
  const first=mappings[0];
  check(mappings.every(m=>m.runner===first.runner&&m.config.path===first.config.path
    &&m.config.sha256===first.config.sha256&&m.runtimeProfile===s.runtimeProfile));
  return {...s,runner:first.runner,files:[...new Set(mappings.map(m=>m.file))],
    required:mappings.map(m=>({file:m.file,name:m.fullName,project:m.project})),
    config:{path:first.config.path,sha256:rebindings[first.config.path]??first.config.sha256},
    configSHA:rebindings[first.config.path]??first.config.sha256,exactDiscovery:true,executionKind:first.executionKind,
    rollbackVariant:null,timeoutMs:s.stage==='pin-tc18-wrapper'?26*60000:15*60000,
    wrapper:s.stage==='pin-tc18-wrapper'?'scripts/permission-pin-canary-run.mjs':null};
});
check(catalog.length===35&&new Set(catalog.map(s=>s.stage)).size===35&&perm.occurrenceCount===726
  &&perm.caseCount===60&&pin.mappings.length===111&&pin.cases.length===19);
for(const s of catalog)check(s.required.length>0&&new Set(s.required.map(key)).size===s.required.length);
const ordinary=catalog.find(s=>s.stage==='pin-onboard-closeout'),tc18=catalog.find(s=>s.stage==='pin-tc18-wrapper');
check(ordinary.required.length===48&&tc18.required.length===7
  &&new Set([...ordinary.required,...tc18.required].map(key)).size===55);

export const runtimeStageCatalog=()=>structuredClone(catalog);
export function runtimeStage(stage){const s=catalog.find(s=>s.stage===stage);check(s);return structuredClone(s);}
export function runtimeConfigBinding(stage,bytes){const s=runtimeStage(stage);
  check(Buffer.isBuffer(bytes)&&runtimeHash(bytes)===s.configSHA);return s.configSHA;}

// Exact full-file recipe only. Config grep/grepInvert keeps the approved
// ordinary48 / TC18seven partition; no CLI name filter is accepted here.
export function runtimeStageCommand(stage,{sourceRoot,outputRoot}){
  const s=runtimeStage(stage);check(isAbsolute(sourceRoot)&&isAbsolute(outputRoot)
    &&![sourceRoot,outputRoot].some(v=>/[\r\n\0]/.test(v)));
  if(s.wrapper)return {stage,cwd:sourceRoot,argv:[resolve(sourceRoot,s.wrapper),resolve(outputRoot,'tc18')],
    runnerArgv:[resolve(sourceRoot,'node_modules/@playwright/test/cli.js'),'test','-c','playwright.pin-tc18.config.ts',
      '--workers=1','--retries=0','--forbid-only','--reporter',
      './scripts/permission-pin-canary-reporter.mjs,./scripts/permission-runtime-playwright-reporter.mjs'],
    timeoutMs:s.timeoutMs,wrapper:true,reportRoot:resolve(outputRoot,'tc18')};
  const argv=s.runner==='vitest'
    ?['node_modules/vitest/vitest.mjs','run','--config',s.config.path,...s.files,'--allowOnly=false','--retry=0',
      '--reporter','./scripts/permission-runtime-vitest-reporter.mjs']
    :['node_modules/@playwright/test/cli.js','test','--config',s.config.path,...s.files,'--workers=1','--retries=0',
      '--repeat-each=1','--forbid-only','--reporter','./scripts/permission-runtime-playwright-reporter.mjs',
      '--output',resolve(outputRoot,stage+'-browser')];
  argv[0]=resolve(sourceRoot,argv[0]);
  return {stage,cwd:sourceRoot,argv,runnerArgv:[...argv],timeoutMs:s.timeoutMs,wrapper:false,reportRoot:outputRoot};
}
