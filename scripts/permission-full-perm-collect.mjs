import { parseInput, checkedStageMap, checkedManifest, pinnedStageMap, modelResult,
  guarded, exact, requireFact as need, integer, hex, safePath, pathCollisionKey, sha256, canonical, sourcePinMatches } from './permission-full-perm-plan.mjs';

// Restricted wire shapes are intentionally fail-closed. D must review a source-
// root/streaming adapter for unsupported real runner shapes; these functions
// never read files, launch runners, measure backends or authenticate attestations.
const same = (a,b) => canonical(a) === canonical(b);
const text = value => typeof value === 'string' && value.length > 0 && value.length <= 1024
  && !/[\x00-\x1f\x7f]/.test(value);
const uuid = value => typeof value === 'string'
  && /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(value);
const id = row => JSON.stringify([row.file,row.name,row.project ?? null]);
function array(value, min=0, max=4000) {
  need(Array.isArray(value) && value.length >= min && value.length <= max,'PERM_EVIDENCE_SCHEMA'); return value;
}
function unique(rows) {
  const keys = rows.map(id);
  need(new Set(keys).size === keys.length,'PERM_EVIDENCE_RESULTS'); return keys;
}
function identity(row, stage) {
  need(safePath(row.file) && stage.files.includes(row.file) && text(row.name)
    && (row.project === null || text(row.project)),'PERM_EVIDENCE_IDENTITY');
  need(stage.runner === 'playwright' ? stage.required.some(item => item.project === row.project)
    : row.project === null,'PERM_EVIDENCE_IDENTITY');
  return row;
}
function artifact(item) {
  exact(item,['path','text','byteHash','contentHash']);
  need(safePath(item.path) && typeof item.text === 'string' && hex(item.byteHash) && hex(item.contentHash),'PERM_EVIDENCE_SCHEMA');
  const parsed = parseInput(item.text);
  need(sha256(item.text) === item.byteHash && sha256(JSON.stringify(parsed)) === item.contentHash,'PERM_EVIDENCE_HASH');
  return parsed;
}
function vitest(discovery,results,options,stage) {
  const discovered = array(discovery,1).map(row => {
    exact(row,['name','file']); return identity({...row,project:null},stage);
  });
  exact(results,['success','errorCount','hookErrorCount','hookErrors','runErrors','testResults']);
  need(results.success === true && results.errorCount === 0 && results.hookErrorCount === 0
    && same(results.hookErrors,[]) && same(results.runErrors,[]),'PERM_EVIDENCE_RESULTS');
  const executed = array(results.testResults,1).flatMap(file => {
    exact(file,['name','assertionResults']); need(safePath(file.name),'PERM_EVIDENCE_IDENTITY');
    return array(file.assertionResults,1).map(row => {
      exact(row,['fullName','status']); need(row.status === 'passed','PERM_EVIDENCE_RESULTS');
      return identity({file:file.name,name:row.fullName,project:null},stage);
    });
  });
  need(new Set(results.testResults.map(file => file.name)).size === results.testResults.length,'PERM_EVIDENCE_RESULTS');
  exact(options,['runner','reason','errorCount','tests']);
  need(options.runner === 'vitest-actual-options-v1' && options.reason === 'passed'
    && options.errorCount === 0,'PERM_EVIDENCE_OPTIONS');
  const configured = array(options.tests,1).map(row => {
    exact(row,['name','file','options','state']); exact(row.options,['fails','retry','repeats','mode']);
    need(row.state === 'passed' && row.options.fails === false && row.options.retry === 0
      && row.options.repeats === 0 && row.options.mode === 'run','PERM_EVIDENCE_OPTIONS');
    return identity({file:row.file,name:row.name,project:null},stage);
  });
  return {discovered,executed,configured};
}
function playwright(discovery,results,options,stage) {
  function projects(projects) {
    const rows = array(projects,1,8);
    for (const row of rows) {
      exact(row,['id','retries','repeatEach']);
      need(text(row.id) && row.retries === 0 && row.repeatEach === 1,'PERM_EVIDENCE_OPTIONS');
    }
    const ids = rows.map(row => row.id).sort(); need(new Set(ids).size === rows.length,'PERM_EVIDENCE_OPTIONS');
    return ids;
  }
  function entries(report, isDiscovery) {
    exact(report,['config','suites','errors','stats']); exact(report.config,['projects']);
    exact(report.stats,['unexpected','flaky','skipped']);
    need(same(report.errors,[]) && report.stats.unexpected === 0 && report.stats.flaky === 0
      && report.stats.skipped === 0,'PERM_EVIDENCE_RESULTS');
    const rows=[];
    function walk(suites,depth) {
      need(depth <= 32,'PERM_EVIDENCE_SCHEMA');
      for (const suite of array(suites,0,4000)) {
        exact(suite,['specs','suites']);
        for (const spec of array(suite.specs)) {
          exact(spec,['title','file','tests']);
          for (const test of array(spec.tests,1,8)) {
            exact(test,['projectName','expectedStatus','results']);
            need(test.expectedStatus === 'passed','PERM_EVIDENCE_RESULTS');
            if (isDiscovery) need(same(test.results,[]),'PERM_EVIDENCE_RESULTS');
            else {
              need(array(test.results,1,1).length === 1,'PERM_EVIDENCE_RESULTS');
              exact(test.results[0],['status','retry']);
              need(test.results[0].status === 'passed' && test.results[0].retry === 0,'PERM_EVIDENCE_RESULTS');
            }
            rows.push(identity({file:spec.file,name:spec.title,project:test.projectName},stage));
          }
        }
        walk(suite.suites,depth+1);
      }
    }
    walk(report.suites,0); return {rows,projects:projects(report.config.projects)};
  }
  const d=entries(discovery,true),r=entries(results,false);
  exact(options,['runner','projects','tests']);
  need(options.runner === 'playwright-actual-options-v1' && same(projects(options.projects),d.projects)
    && same(d.projects,r.projects),'PERM_EVIDENCE_OPTIONS');
  const configured=array(options.tests,1).map(row => {
    exact(row,['file','name','project','retries','repeatEachIndex','expectedStatus']);
    need(row.retries === 0 && row.repeatEachIndex === 0 && row.expectedStatus === 'passed','PERM_EVIDENCE_OPTIONS');
    return identity({file:row.file,name:row.name,project:row.project},stage);
  });
  return {discovered:d.rows,executed:r.rows,configured};
}
function serviceBinding(service,stage) {
  if (stage.runtimeProfile === 'STATIC') { need(service === null,'PERM_EVIDENCE_BINDING'); return null; }
  exact(service,['engineMajor','physicalBackend','storageIdentity','topology','apiMode','binding']);
  const legacy=stage.runtimeProfile === 'PG16_T01';
  need(hex(service.physicalBackend) && hex(service.storageIdentity) && service.engineMajor === (legacy?16:17)
    && service.topology === (legacy?'OBSERVER_ONLY':'FULL_SUPABASE_12')
    && service.apiMode === (legacy?'OBSERVER_ONLY':'API_AUTH_STORAGE_REALTIME'),'PERM_EVIDENCE_BINDING');
  const binding=service.binding;
  exact(binding,['profile','stage','executionKind','configId','backend','fixtureIds','markerProof','catalogHash','schemaHash','appliedArtifacts','apiBinding']);
  need(binding.profile === stage.profile && binding.stage === stage.stage && binding.executionKind === 'service'
    && binding.configId === stage.configuration.path,'PERM_EVIDENCE_BINDING');
  exact(binding.backend,['reference','host','port','database','engine']);
  need(text(binding.backend.reference) && ['127.0.0.1','localhost','[::1]'].includes(binding.backend.host)
    && integer(binding.backend.port,1,65535) && text(binding.backend.database) && text(binding.backend.engine)
    && hex(binding.markerProof) && hex(binding.catalogHash) && hex(binding.schemaHash),'PERM_EVIDENCE_BINDING');
  need(array(binding.fixtureIds,1,32).every(uuid)
    && new Set(binding.fixtureIds).size === binding.fixtureIds.length,'PERM_EVIDENCE_BINDING');
  const applied=array(binding.appliedArtifacts,1,128);
  for (const row of applied) { exact(row,['id','hash']); need(typeof row.id === 'string' && row.id.endsWith('.sql')
    && sourcePinMatches(row.id,row.hash),'PERM_EVIDENCE_BINDING'); }
  need(new Set(applied.map(row => row.id)).size === applied.length,'PERM_EVIDENCE_BINDING');
  if (legacy) need(binding.apiBinding === 'OBSERVER_ONLY','PERM_EVIDENCE_BINDING');
  else {
    exact(binding.apiBinding,['baseUrl','projectRef']);
    need(typeof binding.apiBinding.baseUrl === 'string' && /^http:\/\/127\.0\.0\.1:[1-9][0-9]{0,4}$/.test(binding.apiBinding.baseUrl)
      && text(binding.apiBinding.projectRef),'PERM_EVIDENCE_BINDING');
  }
  return service;
}
function preservation(proof,stage,evidence) {
  if (stage.runtimeProfile === 'STATIC') { need(proof === null,'PERM_EVIDENCE_PRESERVATION'); return; }
  exact(proof,['scope','phase','beforeHash','afterHash','beforeBytes','afterBytes','sourceBefore','sourceAfter',
    'startedMs','finishedMs','reset','snapshotOnly','physicalRestore','delivery03','closure','phaseProof'],['recovery']);
  const phase=stage.stage === 'rollback-additive-database'?'TC53_ADDITIVE':stage.stage === 'rollback-preflight-database'?
    'TC53_PREFLIGHT':stage.stage === 'rollback-recovery-database'?'TC53_RECOVERY':'STAGE_HOOKS';
  need(proof.scope === 'FIXTURE_LOGICAL_ONLY' && proof.phase === phase && hex(proof.beforeHash)
    && proof.beforeHash === proof.afterHash && integer(proof.beforeBytes) && proof.beforeBytes === proof.afterBytes
    && proof.sourceBefore === evidence.sourceBefore && proof.sourceAfter === evidence.sourceAfter
    && proof.startedMs === evidence.startedMs && proof.finishedMs === evidence.finishedMs
    && proof.reset === 'REVIEWED_LOGICAL_BOUNDARY' && proof.snapshotOnly === true
    && proof.physicalRestore === 'NOT_RUN' && proof.delivery03 === 'NOT_RUN' && proof.closure === true,'PERM_EVIDENCE_PRESERVATION');
  const phaseKeys=phase === 'TC53_ADDITIVE'?['businessPreserved','phase27GrantsPreserved','catalogGrantsPreserved']:
    phase === 'TC53_PREFLIGHT'?['wrongBindingBlockedBeforeBusinessRead','validDiscoveryReadOnly']:
    phase === 'TC53_RECOVERY'?['postQSnapshot','forwardFixScope']:['hooksClosed'];
  exact(proof.phaseProof,phaseKeys,[],'PERM_EVIDENCE_PRESERVATION');
  need(Object.values(proof.phaseProof).every(value => value === true),'PERM_EVIDENCE_PRESERVATION');
  if (phase === 'TC53_RECOVERY') {
    exact(proof.recovery,['postBackupWrite','restoreBlocked','forwardFix','qPreserved','kPreserved','r1Preserved']);
    need(Object.values(proof.recovery).every(value => value === true),'PERM_EVIDENCE_PRESERVATION');
  } else need(!Object.hasOwn(proof,'recovery'),'PERM_EVIDENCE_PRESERVATION');
}
function checkStage(map,evidence) {
  exact(evidence,['version','evidenceMode','stage','profile','runtimeProfile','runner','stageExecutionId','workflowRunId','attempt',
    'sourceBefore','sourceAfter','manifestHash','inventoryHash','configHash','lockHash','recipeHash','startedMs','finishedMs',
    'exitCode','selection','service','preservation','artifacts']);
  need(evidence.version === 'perm-stage-input-v1' && evidence.evidenceMode === 'SIMULATION','PERM_EVIDENCE_SCHEMA');
  need(typeof evidence.stage === 'string','PERM_EVIDENCE_IDENTITY');
  const stage=map.stages.find(row => row.stage === evidence.stage);
  need(stage && evidence.profile === stage.profile && evidence.runtimeProfile === stage.runtimeProfile
    && evidence.runner === stage.runner && uuid(evidence.stageExecutionId)
    && typeof evidence.workflowRunId === 'string' && /^[1-9][0-9]{0,19}$/.test(evidence.workflowRunId)
    && integer(evidence.attempt,1,100),'PERM_EVIDENCE_IDENTITY');
  need(evidence.sourceBefore === map.inventoryHash && evidence.sourceAfter === map.inventoryHash
    && evidence.manifestHash === map.manifestHash && evidence.inventoryHash === map.inventoryHash
    && evidence.configHash === stage.configuration.sha256 && evidence.lockHash === map.lockHash
    && evidence.recipeHash === stage.recipeHash,'PERM_EVIDENCE_HASH');
  need(integer(evidence.startedMs,1,4102444800000) && integer(evidence.finishedMs,evidence.startedMs,4102444800000)
    && evidence.finishedMs-evidence.startedMs <= 1800000,'PERM_EVIDENCE_TIME');
  need(evidence.exitCode === 0,'PERM_EVIDENCE_RESULTS');
  exact(evidence.selection,['files','grep','forbidOnly','retries','repeats']);
  need(same(evidence.selection.files,stage.files) && evidence.selection.grep === null
    && evidence.selection.forbidOnly === true && evidence.selection.retries === 0
    && evidence.selection.repeats === 1,'PERM_EVIDENCE_OPTIONS');
  const service=serviceBinding(evidence.service,stage);
  preservation(evidence.preservation,stage,evidence);
  exact(evidence.artifacts,['discovery','results','options','attestation']);
  const paths=Object.values(evidence.artifacts).map(row => { exact(row,['path','text','byteHash','contentHash']); return row.path; });
  need(paths.every(safePath),'PERM_EVIDENCE_SCHEMA');
  need(new Set(paths.map(pathCollisionKey)).size === 4,'PERM_EVIDENCE_SCHEMA');
  const discovery=artifact(evidence.artifacts.discovery),results=artifact(evidence.artifacts.results),
    options=artifact(evidence.artifacts.options),attestation=artifact(evidence.artifacts.attestation);
  exact(attestation,['schemaVersion','runner','runId','sourceFingerprint','executionProfile','startedAt','finishedAt','artifactHashes','artifactByteHashes']);
  need(attestation.schemaVersion === 'permission-execution-profile-v1' && attestation.runner === 'permission-execution-profile-v1'
    && attestation.runId === evidence.stageExecutionId && attestation.sourceFingerprint === evidence.sourceBefore
    && attestation.startedAt === new Date(evidence.startedMs).toISOString()
    && attestation.finishedAt === new Date(evidence.finishedMs).toISOString(),'PERM_EVIDENCE_IDENTITY');
  exact(attestation.artifactHashes,['discovery','results','options']); exact(attestation.artifactByteHashes,['discovery','results','options']);
  for (const name of ['discovery','results','options']) need(attestation.artifactHashes[name] === evidence.artifacts[name].contentHash
    && attestation.artifactByteHashes[name] === evidence.artifacts[name].byteHash,'PERM_EVIDENCE_HASH');
  const binding=service?service.binding:{profile:stage.profile,stage:stage.stage,executionKind:stage.executionKind,
    configId:stage.configuration.path,backend:{applicable:false}};
  need(same(attestation.executionProfile,binding),'PERM_EVIDENCE_BINDING');
  const lists=stage.runner === 'vitest'?vitest(discovery,results,options,stage):playwright(discovery,results,options,stage);
  const discovered=unique(lists.discovered),executed=unique(lists.executed),configured=unique(lists.configured);
  need(same([...discovered].sort(),[...executed].sort()) && same([...executed].sort(),[...configured].sort()),'PERM_EVIDENCE_RESULTS');
  need(stage.files.every(file => lists.discovered.some(row => row.file === file))
    && stage.required.every(row => discovered.includes(id(row))),'PERM_EVIDENCE_IDENTITY');
  return {stage:stage.stage,profile:stage.profile,runtimeProfile:stage.runtimeProfile,
    stageExecutionId:evidence.stageExecutionId,workflowRunId:evidence.workflowRunId,attempt:evidence.attempt,
    sourceHash:map.inventoryHash,startedMs:evidence.startedMs,finishedMs:evidence.finishedMs,
    declaration:service?{physicalBackend:service.physicalBackend,storageIdentity:service.storageIdentity,backend:service.binding.backend}:null,
    discovered:discovered.length,executed:executed.length,occurrences:stage.occurrences,
    rawArtifactsHash:sha256(canonical(evidence.artifacts)),evidenceHash:sha256(canonical(evidence)),
    preservation:'SUPPLIED_LOGICAL_FIXTURE_ONLY',physicalRestore:'NOT_RUN',delivery03:'NOT_RUN'};
}
export function checkPermStage(stageMapJson,evidenceJson) {
  return guarded(() => modelResult('MATCH','SIMULATION',{
    version:'perm-stage-model-result-v1',stageResult:checkStage(checkedStageMap(stageMapJson),parseInput(evidenceJson)),
    sourceFingerprintKind:'PINNED_INVENTORY_SIMULATION_ONLY',backendObserved:false,
    missingInputs:[{owner:'D',field:'authenticatedRunnerAndObserver',reason:'These are supplied simulation bytes/tuples, not fresh observations',
      nextAction:'Review adapter, fresh runtime source fingerprints and actual verifiers in D1/E'},
      {owner:'D',field:'appliedArtifactCompleteness',reason:'Each supplied SQL pin is checked; phase-specific actual applied-set closure is not authenticated',
        nextAction:'Bind full phase-specific schema/migration/artifact set and fresh observer evidence before actual verification'}],errors:[]}), 'SIMULATION');
}

// D1 source adapter: keep the reviewed occurrence/identity taxonomy while
// binding config/recipe/source hashes to the new independently frozen map.
// All three values remain primitive JSON; this does not authenticate them.
export function checkIntegratedPermStage(stageMapJson,evidenceJson,contextJson) {
  return guarded(() => {
    const context=parseInput(contextJson),map=parseInput(stageMapJson);
    exact(context,['stageMapSha256','sourceFingerprint','lockSha256']);
    need(hex(context.stageMapSha256)&&hex(context.sourceFingerprint)&&hex(context.lockSha256)
      && sha256(stageMapJson)===context.stageMapSha256,'PERM_EVIDENCE_HASH');
    const base=pinnedStageMap();exact(map,Object.keys(base));
    need(map.version===base.version&&map.sourceCommit===base.sourceCommit&&map.sourceTree===base.sourceTree
      &&map.manifestHash===base.manifestHash&&map.inventoryHash===context.sourceFingerprint&&map.lockHash===context.lockSha256
      &&map.caseCount===60&&map.occurrenceCount===726&&map.stageCount===27,'PERM_EVIDENCE_BINDING');
    array(map.stages,27,27);need(new Set(map.stages.map(s=>s?.stage)).size===27,'PERM_EVIDENCE_IDENTITY');
    for(const s of map.stages){const expected=base.stages.find(e=>e.stage===s?.stage);need(expected,'PERM_EVIDENCE_IDENTITY');exact(s,Object.keys(expected));
      for(const k of ['stage','profile','runtimeProfile','runner','executionKind','order','profileOrder','files','required','occurrences','physicalGroup','resetPolicy'])
        need(same(s[k],expected[k]),'PERM_EVIDENCE_IDENTITY');
      exact(s.configuration,Object.keys(expected.configuration));need(s.configuration.path===expected.configuration.path&&hex(s.configuration.sha256)&&hex(s.recipeHash),'PERM_EVIDENCE_HASH');
    }
    const checked=checkStage(map,parseInput(evidenceJson));
    return modelResult('MATCH','SIMULATION',{version:'perm-integrated-stage-result-v1',...checked,backendObserved:false});
  });
}
function declaredSchedule(map,input) {
  exact(input,['version','rows']);
  need(input.version === 'perm-declared-schedule-v1' && array(input.rows,27,27).length === 27,'PERM_EVIDENCE_RUN_SET');
  for (const row of input.rows) {
    exact(row,['stage','runtimeProfile','stageExecutionId','workflowRunId','attempt','startedMs','finishedMs','physicalBackend','storageIdentity','backend']);
    const stage=map.stages.find(stage => stage.stage === row.stage);
    need(stage && row.runtimeProfile === stage.runtimeProfile && uuid(row.stageExecutionId)
      && typeof row.workflowRunId === 'string' && /^[1-9][0-9]{0,19}$/.test(row.workflowRunId)
      && integer(row.attempt,1,100),'PERM_EVIDENCE_IDENTITY');
    need(integer(row.startedMs,1,4102444800000) && integer(row.finishedMs,row.startedMs,4102444800000),'PERM_EVIDENCE_TIME');
    if (stage.runtimeProfile === 'STATIC') need(row.physicalBackend === null && row.storageIdentity === null && row.backend === null,'PERM_EVIDENCE_BINDING');
    else {
      need(hex(row.physicalBackend) && hex(row.storageIdentity),'PERM_EVIDENCE_BINDING');
      exact(row.backend,['reference','host','port','database','engine']);
      need(text(row.backend.reference) && ['127.0.0.1','localhost','[::1]'].includes(row.backend.host)
        && integer(row.backend.port,1,65535) && text(row.backend.database) && text(row.backend.engine),'PERM_EVIDENCE_BINDING');
    }
  }
  need(new Set(input.rows.map(row => row.stage)).size === 27
    && new Set(input.rows.map(row => row.stageExecutionId)).size === 27
    && new Set(input.rows.map(row => row.workflowRunId+'|'+row.attempt)).size === 1,'PERM_EVIDENCE_RUN_SET');
  const ordered=map.stages.map(stage => input.rows.find(row => row.stage === stage.stage));
  need(ordered.at(-1).finishedMs-ordered[0].startedMs <= 1800000,'PERM_EVIDENCE_TIME');
  for (let i=1;i<ordered.length;i++) need(ordered[i].startedMs >= ordered[i-1].finishedMs,'PERM_EVIDENCE_TIME');
  for (const profile of ['PG16_T01','SUPABASE_T02','SUPABASE_T04']) {
    const rows=ordered.filter(row => row.runtimeProfile === profile);
    need(rows.every(row => row.physicalBackend === rows[0].physicalBackend && row.storageIdentity === rows[0].storageIdentity
      && same(row.backend,rows[0].backend)),'PERM_EVIDENCE_BACKEND');
  }
  return ordered;
}
// Small declarative schedule permits meaningful cross-stage counterexamples
// without manufacturing 27 execution receipts or trimming raw runner reports.
export function checkPermSchedule(stageMapJson,scheduleJson) {
  return guarded(() => {
    declaredSchedule(checkedStageMap(stageMapJson),parseInput(scheduleJson));
    return modelResult('MATCH','PLAN_ONLY',{version:'perm-schedule-model-result-v1',stageCount:27,
      runtimeProfiles:{STATIC:4,PG16_T01:1,SUPABASE_T02:3,SUPABASE_T04:19},backendObserved:false,
      stageEvidenceChecked:false,errors:[]});
  });
}
export function checkPermAggregate(manifestJson,stageResultsJson) {
  return guarded(() => {
    checkedManifest(manifestJson);
    const input=parseInput(stageResultsJson),map=pinnedStageMap();
    exact(input,['version','runs']);
    need(input.version === 'perm-aggregate-input-v1' && array(input.runs,27,27).length === 27,'PERM_EVIDENCE_RUN_SET');
    for (const run of input.runs) { exact(run,['stage','evidenceJson']); need(typeof run.stage === 'string' && typeof run.evidenceJson === 'string','PERM_EVIDENCE_SCHEMA'); }
    const names=input.runs.map(run => run.stage);
    need(new Set(names).size === 27 && map.stages.every(stage => names.includes(stage.stage)),'PERM_EVIDENCE_RUN_SET');
    // Do not accept a caller-created MATCH summary or digest as a verified run.
    const results=input.runs.map(run => { const value=parseInput(run.evidenceJson); need(value.stage === run.stage,'PERM_EVIDENCE_IDENTITY'); return checkStage(map,value); });
    need(new Set(results.map(row => row.stageExecutionId)).size === 27
      && new Set(results.map(row => row.workflowRunId+'|'+row.attempt)).size === 1,'PERM_EVIDENCE_RUN_SET');
    declaredSchedule(map,{version:'perm-declared-schedule-v1',rows:results.map(row => ({stage:row.stage,
      runtimeProfile:row.runtimeProfile,stageExecutionId:row.stageExecutionId,workflowRunId:row.workflowRunId,
      attempt:row.attempt,startedMs:row.startedMs,finishedMs:row.finishedMs,
      physicalBackend:row.declaration?.physicalBackend ?? null,storageIdentity:row.declaration?.storageIdentity ?? null,
      backend:row.declaration?.backend ?? null}))});
    return modelResult('MATCH','SIMULATION',{version:'perm-aggregate-model-result-v1',stageCount:27,
      caseCount:60,occurrenceCount:726,stageResults:results,backendObserved:false,
      fullFileClosure:'SUPPLIED_BYTES_ONLY',errors:[]});
  },'SIMULATION');
}
