import { assessBudget, BASE_COMMIT, PROFILES, planData, PlanError, withinPlanPath } from './permission-full-budget-plan.mjs';
import { fullRuntimeProfile, fullRuntimeLayout, fullRuntimeUnitProperties, assertFullRuntimeRootFacts } from './permission-full-runtime-policy.mjs';

export const PROVISION_VERSION = 'permission-full-provision-plan-v1';
export const PROVISION_ERRORS = Object.freeze(['PROFILE_REFUSED', 'BUDGET_STOP', 'MISSING_INPUT', 'STALE_IDENTITY', 'ALIAS_ESCAPE', 'TOOL_IDENTITY', 'PRIVATE_NOT_ABSENT', 'CLEANUP_LOCKED']);
export const SOURCE_PINS = Object.freeze({
  policy: 'efa9e4ba861b4e7268e7efaeeaeeb123a9cef4541bb9bd6adb43b9f4a400f0ae',
  tools: 'bde0a12f4e0d2c603f912c260825db37b3c3ff1228b338166b9fbd053f083638',
  images: '6dbf8db15721095665c625abadd4000a07c119d9f1bb46ff0826f2d8354ce46c',
});
const ordinary = v => JSON.parse(JSON.stringify(v)); // only after planData()
const exact = (v, keys) => {
  if (!v || typeof v !== 'object' || Array.isArray(v) || Object.keys(v).length !== keys.length || keys.some(k => !Object.hasOwn(v, k))) throw new PlanError('INPUT_INVALID');
};
function freezePlan(value) {
  if (value && typeof value === 'object') { Object.values(value).forEach(freezePlan); Object.freeze(value); }
  return value;
}
const h64 = v => typeof v === 'string' && /^[a-f0-9]{64}$/.test(v);
const numberString = v => typeof v === 'string' && /^(0|[1-9][0-9]*)$/.test(v);

export function initialProvisionInput(profileId = 'STATIC') {
  if (!PROFILES.includes(profileId)) throw new PlanError('PROFILE_REFUSED');
  return { schemaVersion: PROVISION_VERSION, profileId, budgetInput: null, identity: null, review: null,
    tools: null, rootFacts: null, aliases: [], t01Alias: null, privatePathState: 'UNKNOWN' };
}

// A plan describes observations that a future adapter MUST obtain itself.
// No supplied plan, review hash or synthetic fact is an execution capability.
export function provisionPlan(input) {
  const x = planData(input);
  exact(x, ['schemaVersion', 'profileId', 'budgetInput', 'identity', 'review', 'tools', 'rootFacts', 'aliases', 't01Alias', 'privatePathState']);
  if (x.schemaVersion !== PROVISION_VERSION || !PROFILES.includes(x.profileId)) throw new PlanError('PROFILE_REFUSED');
  if (!Array.isArray(x.aliases) || !['UNKNOWN', 'ABSENT', 'PRESENT'].includes(x.privatePathState)) throw new PlanError('INPUT_INVALID');
  const reasons = []; const stop = (code, at) => reasons.push({ code, at });
  const budget = x.budgetInput === null ? null : assessBudget(x.budgetInput);
  if (!budget || budget.planDecision !== 'ADMITTED') stop('BUDGET_STOP', 'budgetInput');
  let layout = null;
  if (x.identity === null) stop('MISSING_INPUT', 'identity');
  else {
    exact(x.identity, ['runId', 'attempt', 'nonce', 'ownerUid']);
    try { layout = fullRuntimeLayout(x.identity.runId, x.identity.attempt, x.identity.nonce, x.identity.ownerUid); }
    catch { stop('STALE_IDENTITY', 'identity'); }
  }
  if (layout && (!x.budgetInput || ['root', 'loopMount', 'loopBackingFile'].some(k => x.budgetInput.layout[k] !== layout[k]))) stop('STALE_IDENTITY', 'budgetLayout');
  if (x.review === null) stop('MISSING_INPUT', 'review');
  else { exact(x.review, ['version', 'sha256']); if (typeof x.review.version !== 'string' || !x.review.version || !h64(x.review.sha256)) stop('MISSING_INPUT', 'review'); }
  const profile = x.profileId === 'STATIC' ? { kind: 'STATIC', bootstrap: null, config: null } : fullRuntimeProfile(x.profileId);
  if (x.tools === null) stop('MISSING_INPUT', 'tools');
  else {
    exact(x.tools, ['sourceSha', 'policySha256', 'toolsManifestSha256', 'imagesManifestSha256', 'configSha256']);
    if (x.tools.sourceSha !== BASE_COMMIT || x.tools.policySha256 !== SOURCE_PINS.policy || x.tools.toolsManifestSha256 !== SOURCE_PINS.tools
      || x.tools.imagesManifestSha256 !== SOURCE_PINS.images || x.tools.configSha256 !== (profile.config?.sha256 ?? null)) stop('TOOL_IDENTITY', 'tools');
  }
  if (!layout || x.rootFacts === null) stop('MISSING_INPUT', 'hostUnitRootFacts');
  else {
    try { assertFullRuntimeRootFacts(layout, ordinary(x.rootFacts)); }
    catch { stop('STALE_IDENTITY', 'hostUnitRootFacts'); }
  }
  if (x.profileId === 'PIN_IDENTITY' && x.privatePathState !== 'ABSENT') stop('PRIVATE_NOT_ABSENT', 'privatePathState');
  const expectedAliases = [];
  const addAlias = alias => {
    if (expectedAliases.some(a => a.alias === alias)) return;
    const target = layout ? `${layout.loopMount}/runtime/${alias.slice('/var/tmp/'.length)}` : null;
    expectedAliases.push({ alias, target });
  };
  if (profile.kind === 'SUPABASE') { addAlias(profile.aliasRoot); addAlias(profile.stackAlias); addAlias(profile.cliAlias); }
  if (profile.kind === 'NATIVE_POSTGRESQL') {
    if (typeof x.t01Alias !== 'string' || !(new RegExp(profile.aliasRootPattern)).test(x.t01Alias)) stop('ALIAS_ESCAPE', 't01Alias');
    else addAlias(x.t01Alias);
  } else if (x.t01Alias !== null) stop('ALIAS_ESCAPE', 't01Alias');
  const aliasesSeen = new Set();
  for (const a of x.aliases) {
    exact(a, ['alias', 'target', 'sourceDevice', 'sourceInode', 'aliasDevice', 'aliasInode']);
    const expected = expectedAliases.find(e => e.alias === a.alias);
    if (!expected || aliasesSeen.has(a.alias) || !layout || a.target !== expected.target || !withinPlanPath(a.target, layout.loopMount)
      || !numberString(a.sourceDevice) || !numberString(a.sourceInode) || a.sourceInode === '0'
      || a.aliasDevice !== a.sourceDevice || a.aliasInode !== a.sourceInode) stop('ALIAS_ESCAPE', 'aliases');
    aliasesSeen.add(a.alias);
  }
  for (const a of expectedAliases) if (!aliasesSeen.has(a.alias)) stop('MISSING_INPUT', `aliases:${a.alias}`);
  const steps = [];
  const step = (id, preconditions, expectedActualReadbacks, ownedResources = []) => steps.push({
    order: steps.length + 1, id, execution: 'NOT_RUN', preconditions, expectedActualReadbacks, ownedResources,
    onMissingOrMismatch: 'STOP_RETAIN_NO_INTENTIONAL_CLEANUP',
  });
  step('source-review-budget-grant', ['exact candidate and compatible reviewed A/L/P/R/D inputs', 'actual execution grant distinct from preparation'],
    ['source/tree/config/tool hashes', 'fresh CI for final source', 'actual maximum/placement/reserve/time admission', 'global retained allocation including outside-loop writers']);
  step('previous-profile-transition', ['STATIC then six runtime profiles in policy order', 'never two heavy environments', 'no per-stage replacement of T04 physical backend'],
    ['previous heavy profile processes stopped before next starts', 'retain all still-needed evidence and account overlap through custody/ACK',
      'any destructive transition requires verified custody/ACK and exact cleanup grant; otherwise STOP', 'no timing or retention discount from a hypothetical cleanup']);
  step('host-unit-root-visibility', ['owned empty host root', 'no preexisting submounts', 'same root visible in host and unit'],
    ['lstat/stat/realpath device+inode equal host/unit', 'owner UID, mode0700, nonce and ownerLabel exact',
      'PrivateTmp=yes', 'BindPaths=root:root:norbind, source mandatory, nonrecursive'], layout ? [layout.root] : []);
  step('loop-and-cgroup-boundary', ['actual disk reserves and resource readbacks', 'one heavy environment'],
    ['18GiB backing allocation counted once in global20GiB', 'ext4 loop free>=1GiB; host/C/runtime reserve>=30GiB',
      '3CPU,10GiB RAM,swap0,PIDs2048,runtime1800s,grace30s', 'owned Docker/containerd data+exec roots and cgroup membership',
      'HOME/TMP/TEMP/XDG/npm/browser caches and logs mapped; no escaped physical writer'], layout ? [layout.loopBackingFile, layout.loopMount] : []);
  step('fixed-alias-mapping', ['all fixed guard aliases below owned loop', 'no guard relaxation'],
    ['findmnt exact ext4 boundary', 'alias and target device/inode match', 'no symlink, no recursive bind, no preexisting submount'], expectedAliases);
  if (x.profileId === 'PIN_IDENTITY') step('identity-private-absent', ['before bootstrap; private alias must not exist'],
    ['lstat private returns ENOENT before identity bootstrap; bootstrap owns its creation'], [profile.privateAlias]);
  step('tools-config-bootstrap', ['exact tool/image/config pins, independently bounded transfer/unpack/install scripts', 'synthetic fixture only'],
    profile.kind === 'STATIC' ? ['STATIC-only prerequisites; no backend implied'] : [
      'config exact hash and ports; pinned binaries', `bootstrap=${profile.bootstrap.strategy}; migrations=${profile.bootstrap.migrationCount}`,
      ...(x.profileId === 'PIN_CANARY' ? ['16 CLI migrations; exclusive stack/supabase/seed.sql exactly0bytes', 'tenantRowsEmpty=true,authUsers=0,storageObjects=0; never seeded pilot'] : []),
      ...(x.profileId === 'PG16_T01' ? ['verified PostgreSQL16; SHOW data_directory exact owned path', 'observer-only; does not prove Auth/REST/Storage/Realtime'] : ['SupabaseCLI2.117.0,PostgreSQL17; full pinned service topology and loopback ports']),
      ...(x.profileId === 'PIN_IDENTITY' ? ['exact legacy auth/catalog ACL preflight'] : []),
    ], profile.kind === 'SUPABASE' ? [profile.topology.dbVolume, profile.topology.network] : []);
  step('profile-execution-evidence', ['required manifests/configs/fixtures fixed; no skip/retry/expected weakening'],
    ['PIN19 exact identities, TC18 capture/control and TC19 direct preservation', 'PERM60/726occurrences/27stages; all3TC53 DB variants',
      ...(x.profileId === 'SUPABASE_T04' ? ['all19 stages share system_identifier, data-directory device/inode and API backend identity; only reviewed logical resets', ...profile.stages] : []),
      'discovery/results/options/attestation byte+content hashes and required preservation; record backend identities'], []);
  step('custody-and-retention', ['verified closure, transfer to D, privateC receiver, authenticated latest ACK', 'global retention/failure maxima remain within ledger'],
    ['existing17-field custody binding unchanged', 'verifyCustodyAck exact immutable SHA, complete query, latest case-insensitive context, owner/time/binding',
      'verified local decrypted member closure; ACK observation has actual provenance; missing proof=STOP']);
  step('intentional-cleanup-locked', ['verified custody/ACK', 'exact human cleanup grant for identified resources', 'processes released owned data'],
    ['no cleanup adapter in initial slice', 'verify absolute identity/nonce/labels before future deletion', 'measure physical free bytes after authorized cleanup']);
  return freezePlan({ schemaVersion: PROVISION_VERSION, profileId: x.profileId, evidenceMode: budget?.evidenceMode ?? 'PLAN_ONLY',
    planDecision: reasons.length ? 'STOP' : 'ADMITTED', reasons, execution: 'NOT_RUN', runtimeAdmission: 'NOT_RUN', enforcement: 'NOT_RUN', custodyObserved: 'NOT_RUN',
    runtimeBinding: { runId: null, attempt: null, profile: null, stage: null, nonce: null, backendIdentity: null },
    declaredLayout: layout, unitProperties: layout ? fullRuntimeUnitProperties(layout) : null, expectedAliases,
    profileRequirements: profile, steps,
    stopTransitions: ['missing/mismatch/FAIL => STOP_RETAIN', 'cancel/timeout/platform teardown => UNPROVEN_LOSS_RISK; never custody PASS', 'no missing receipt may become PASS'],
    cleanup: { intentionalAllowed: false, status: 'LOCKED_INITIAL_SLICE', requires: ['actual verified custody and ACK', 'exact cleanup grant', 'actual identity/process checks', 'future reviewed adapter'] },
    notRun: ['actual transport', 'provision', 'install', 'build', 'backend', 'ACK', 'cleanup', 'fullgate'],
  });
}

// The preparation API never grants cleanup, including on platform termination.
export function lifecyclePlan(event) {
  if (!['FAIL', 'CANCEL', 'TIMEOUT', 'CUSTODY_PENDING', 'INTENTIONAL_CLEANUP'].includes(event)) throw new PlanError('INPUT_INVALID');
  return freezePlan({ event, planDecision: 'STOP', execution: 'NOT_RUN', intentionalCleanupAllowed: false,
    reason: event === 'INTENTIONAL_CLEANUP' ? 'CLEANUP_LOCKED' : 'RETAIN_PENDING_VERIFIED_CUSTODY_ACK_AND_EXACT_GRANT',
    custodyObserved: 'NOT_RUN', platformTeardown: ['CANCEL', 'TIMEOUT'].includes(event) ? 'UNPROVEN_LOSS_RISK' : 'NOT_REQUESTED' });
}
