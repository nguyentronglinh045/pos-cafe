import { readFileSync, appendFileSync, statfsSync } from 'node:fs';
import { cpus, totalmem } from 'node:os';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const GiB = 1024 ** 3;
const check = value => { if (!value) throw Error('CAPACITY_PROBE_REFUSED'); };
export function capacityAdmission(env, event, git) {
  check(env.GITHUB_ACTIONS === 'true' && env.RUNNER_ENVIRONMENT === 'github-hosted'
    && env.GITHUB_REPOSITORY === 'nguyentronglinh045/pos-cafe' && env.GITHUB_REPOSITORY_ID === '1263057386'
    && env.GITHUB_EVENT_NAME === 'workflow_dispatch' && env.PERMISSION_CAPACITY_CONFIRMATION === 'RUN_CAPACITY_PROBE'
    && /^[a-f0-9]{40}$/.test(env.PERMISSION_CAPACITY_EXPECTED_SHA ?? '')
    && env.PERMISSION_CAPACITY_EXPECTED_SHA === env.GITHUB_SHA && env.GITHUB_SHA === env.GITHUB_WORKFLOW_SHA
    && git.head === env.GITHUB_SHA && git.clean === true
    && event.repository?.full_name === env.GITHUB_REPOSITORY && event.repository?.id === 1263057386
    && event.repository?.private === false && event.inputs?.confirmation === 'RUN_CAPACITY_PROBE'
    && event.inputs?.expected_source_sha === env.GITHUB_SHA
    && /^[1-9][0-9]*$/.test(env.GITHUB_RUN_ID ?? '') && /^[1-9][0-9]*$/.test(env.GITHUB_RUN_ATTEMPT ?? ''));
  return true;
}
export function capacityResult(facts) {
  for (const key of ['hostFreeBytes','memoryBytes','cpus']) check(Number.isSafeInteger(facts[key]) && facts[key] >= 0);
  const fits = facts.hostFreeBytes >= 50 * GiB && facts.memoryBytes >= 12 * GiB && facts.cpus >= 3;
  return { schemaVersion:'permission-host-capacity-v1', ...Object.fromEntries(['hostFreeBytes','memoryBytes','cpus'].map(key=>[key,facts[key]])),
    requiredHostFreeBytes:50*GiB, taskBudgetBytes:20*GiB, hostReserveBytes:30*GiB,
    status:fits?'CAPACITY_AVAILABLE':'INSUFFICIENT_CAPACITY', fullExecution:'NOT_RUN', quotaEnforced:false,
    note:'Capacity observation only; unpack bounds, namespace, writer placement and full test dispatch remain required' };
}
function main() {
  check(process.platform === 'linux' && process.arch === 'x64');
  const git = args => execFileSync('git',args,{encoding:'utf8',timeout:10000,maxBuffer:65536}).trim();
  const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH,'utf8'));
  capacityAdmission(process.env,event,{head:git(['rev-parse','HEAD']),clean:git(['status','--porcelain','--untracked-files=all'])===''});
  const disk = statfsSync(process.cwd());
  const result = { ...capacityResult({hostFreeBytes:disk.bavail*disk.bsize,memoryBytes:totalmem(),cpus:cpus().length}),
    sourceSHA:process.env.GITHUB_SHA,workflowSHA:process.env.GITHUB_WORKFLOW_SHA,runId:process.env.GITHUB_RUN_ID,
    attempt:Number(process.env.GITHUB_RUN_ATTEMPT),node:process.version,observedUtc:new Date().toISOString() };
  const json=JSON.stringify(result); check(Buffer.byteLength(json)<2048);console.log(json);
  if(process.env.GITHUB_STEP_SUMMARY)appendFileSync(process.env.GITHUB_STEP_SUMMARY,'```json\n'+json+'\n```\n');
  if(result.status!=='CAPACITY_AVAILABLE')process.exitCode=1;
}
if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
  try{main();}catch{console.log('CAPACITY_PROBE_REFUSED');process.exitCode=1;}
}
