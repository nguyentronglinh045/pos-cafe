import { createHash } from 'node:crypto';
import { custodyAckDescriptor } from './permission-full-custody.mjs';

// Proposed descriptor API only. No crypto adapter, filesystem, process or network.
// Strings are the only admitted inputs: caller objects (including proxies and
// accessors) are refused by typeof without inspecting any of their properties.
// All "observed" fields below are synthetic declarations, NOT authentication.
export const MODEL_VERSION = 'permission-transport-model-v1';
export const INPUT_MAX_BYTES = 262144;
export const MEMBER_MAX_COUNT = 1024; // Model input bound, not a runtime gate cap.
export const CIPHER_MAX_BYTES = 268435456; // Existing custody cap, source567.
export const BINDING_FIELDS = Object.freeze(['repository', 'repositoryId', 'runId', 'attempt', 'sourceSha', 'profile', 'nonce',
  'permissionFingerprint', 'lockSha256', 'recipeSha256', 'artifactId', 'cipherSha256', 'cipherBytes',
  'archiveSha256', 'manifestSha256', 'closureSha256', 'closedAt']);
export const ERROR_CODES = Object.freeze(['INPUT_TYPE', 'INPUT_TOO_LARGE', 'INVALID_JSON', 'DUPLICATE_KEY',
  'SCHEMA_MISMATCH', 'INVALID_VALUE', 'UNSAFE_PATH', 'DUPLICATE_MEMBER', 'MEMBER_TREE_CONFLICT',
  'MISSING_MEMBER', 'EXTRA_MEMBER', 'HASH_MISMATCH', 'SIZE_MISMATCH', 'TRUNCATED_INPUT',
  'SOURCE_DRIFT', 'BINDING_MISMATCH', 'CLOSURE_MISMATCH', 'MANIFEST_MISMATCH', 'BINDING_INVALID',
  'RECEIVE_INCOMPLETE', 'RECEIVE_MISMATCH', 'ACK_REFUSED']);

/** @typedef {{path:string, sha256:string, bytes:number}} ExpectedMember */
/** @typedef {ExpectedMember & {observedSha256:string, observedBytes:number}} MemberDescriptor */
/** @typedef {{sha256:string, bytes:number, observedSha256:string, observedBytes:number}} BlobDescriptor */
/** @typedef {{format:'permission-model-closure-v1',sha256:string,memberCount:number,plaintextBytes:number}} ClosureDescriptor */
/** @typedef {{kind:'seal',mode:'SIMULATION',algorithm:'NOT_SELECTED',archive:BlobDescriptor,cipher:BlobDescriptor,statusBytes:number}} SealDescriptor */
/** @typedef {{kind:'receive',mode:'SIMULATION',artifactId:number,cipherSha256:string,cipherBytes:number}} ReceiveDescriptor */
/** @typedef {{kind:'open',mode:'SIMULATION',archiveSha256:string,archiveBytes:number,plaintextBytes:number,authentication:'NOT_PROVEN'}} OpenDescriptor */

export class ModelRefusal extends Error {
  constructor(code, field) {
    super(code);
    this.code = code;
    this.field = field;
  }
}
export const refuse = (code, field) => { throw new ModelRefusal(code, field); };
const sha256 = text => createHash('sha256').update(text).digest('hex');
const has = (obj, key) => Object.hasOwn(obj, key);
const decodedObjects = new WeakSet();
export const same = (left, right, code, field) => { if (left !== right) refuse(code, field); };
export const integer = (value, field, minimum = 0) => {
  if (!Number.isSafeInteger(value) || value < minimum) refuse('INVALID_VALUE', field);
  return value;
};
export const hash = (value, field) => {
  if (typeof value !== 'string' || !/^[a-f0-9]{64}$/.test(value)) refuse('INVALID_VALUE', field);
  return value;
};
export function shape(obj, keys, field) {
  // Helpers are internal to the two models. Branding also refuses caller
  // objects before even Object.getPrototypeOf can trigger a proxy trap.
  if (!obj || typeof obj !== 'object' || !decodedObjects.has(obj) || Array.isArray(obj)
    || Object.getPrototypeOf(obj) !== Object.prototype
    || Object.keys(obj).length !== keys.length || keys.some(key => !has(obj, key))) refuse('SCHEMA_MISMATCH', field);
}

export function decode(text, field) {
  if (typeof text !== 'string') refuse('INPUT_TYPE', field);
  if (Buffer.byteLength(text, 'utf8') > INPUT_MAX_BYTES) refuse('INPUT_TOO_LARGE', field);
  let parsed;
  try {
    parsed = JSON.parse(text, (_key, value) => {
      if (value && typeof value === 'object') {
        Object.freeze(value);
        decodedObjects.add(value);
      }
      return value;
    });
  } catch { refuse('INVALID_JSON', field); }
  // JSON.parse accepts duplicate object keys. Refuse them instead of silently
  // letting one binding/hash shadow another. Grammar is already checked above.
  const stack = [];
  const tokens = /"(?:[^"\\]|\\[\s\S])*"|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null|[{}\[\]:,]/g;
  for (const match of text.matchAll(tokens)) {
    const token = match[0];
    if (token === '{') stack.push({ object: true, keys: new Set(), key: true });
    else if (token === '[') stack.push({ object: false });
    else if (token === '}' || token === ']') stack.pop();
    else if (token === ',') { if (stack.at(-1)?.object) stack.at(-1).key = true; }
    else if (token.startsWith('"') && stack.at(-1)?.object && stack.at(-1).key) {
      const key = JSON.parse(token);
      if (stack.at(-1).keys.has(key)) refuse('DUPLICATE_KEY', field);
      stack.at(-1).keys.add(key);
      stack.at(-1).key = false;
    }
  }
  return parsed;
}

function safePath(path) {
  if (typeof path !== 'string' || path.length < 1 || path.length > 240) refuse('UNSAFE_PATH', 'members.path');
  const parts = path.split('/');
  if (parts.some(part => !/^[a-zA-Z0-9_.-]+$/.test(part) || part === '.' || part === '..'
    || part.endsWith('.') || /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part))) refuse('UNSAFE_PATH', 'members.path');
}

export function checkMembers(list, observed, field) {
  if (!decodedObjects.has(list)) refuse('INPUT_TYPE', field);
  if (!Array.isArray(list) || list.length < 1 || list.length > MEMBER_MAX_COUNT) refuse('INVALID_VALUE', field);
  let bytes = 0;
  const paths = new Set();
  const members = [];
  for (const item of list) {
    shape(item, observed ? ['path', 'sha256', 'bytes', 'observedSha256', 'observedBytes'] : ['path', 'sha256', 'bytes'], field);
    safePath(item.path);
    const alias = item.path.toLowerCase();
    if (paths.has(alias)) refuse('DUPLICATE_MEMBER', field);
    paths.add(alias);
    hash(item.sha256, `${field}.sha256`);
    integer(item.bytes, `${field}.bytes`);
    if (observed) {
      hash(item.observedSha256, `${field}.observedSha256`);
      integer(item.observedBytes, `${field}.observedBytes`);
      if (item.observedBytes < item.bytes) refuse('TRUNCATED_INPUT', field);
      same(item.observedBytes, item.bytes, 'SIZE_MISMATCH', field);
      same(item.observedSha256, item.sha256, 'HASH_MISMATCH', field);
    }
    bytes += item.bytes;
    integer(bytes, `${field}.totalBytes`);
    const member = Object.freeze({ path: item.path, sha256: item.sha256, bytes: item.bytes });
    decodedObjects.add(member);
    members.push(member);
  }
  for (const path of paths) {
    const segments = path.split('/');
    for (let i = 1; i < segments.length; i++) if (paths.has(segments.slice(0, i).join('/'))) refuse('MEMBER_TREE_CONFLICT', field);
  }
  members.sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
  Object.freeze(members);
  decodedObjects.add(members);
  return { members, bytes };
}

export function compareMembers(actual, expected) {
  if (!decodedObjects.has(actual) || !decodedObjects.has(expected)) refuse('INPUT_TYPE', 'members');
  const index = new Map(actual.map(member => [member.path, member]));
  const expectedIndex = new Set(expected.map(member => member.path));
  for (const member of actual) if (!expectedIndex.has(member.path)) refuse('EXTRA_MEMBER', 'members');
  for (const member of expected) {
    if (!index.has(member.path)) refuse('MISSING_MEMBER', 'members');
    same(index.get(member.path).sha256, member.sha256, 'HASH_MISMATCH', 'members');
    same(index.get(member.path).bytes, member.bytes, 'SIZE_MISMATCH', 'members');
  }
}

function closureDigest(members) {
  // Explicit simulation format. This is NOT a proposed change to the real
  // archive/manifest/closure schema or an input for an execution verifier.
  return sha256(JSON.stringify(['permission-model-closure-v1', members]));
}
function manifestDigest(binding, configSha256, archiveBytes, members) {
  return sha256(JSON.stringify(['permission-model-manifest-v1', binding.sourceSha, binding.lockSha256,
    binding.recipeSha256, configSha256, archiveBytes, members]));
}

export function checkExpectation(text) {
  const expected = decode(text, 'expected');
  shape(expected, ['schemaVersion', 'binding', 'configSha256', 'archiveBytes', 'members'], 'expected');
  same(expected.schemaVersion, 'permission-transport-expectation-v1', 'SCHEMA_MISMATCH', 'expected.schemaVersion');
  shape(expected.binding, BINDING_FIELDS, 'expected.binding');
  let ack;
  try { ack = custodyAckDescriptor(expected.binding); } catch { refuse('BINDING_INVALID', 'expected.binding'); }
  hash(expected.configSha256, 'expected.configSha256');
  integer(expected.archiveBytes, 'expected.archiveBytes', 1);
  const checked = checkMembers(expected.members, false, 'expected.members');
  same(closureDigest(checked.members), expected.binding.closureSha256, 'CLOSURE_MISMATCH', 'expected.binding.closureSha256');
  same(manifestDigest(expected.binding, expected.configSha256, expected.archiveBytes, checked.members),
    expected.binding.manifestSha256, 'MANIFEST_MISMATCH', 'expected.binding.manifestSha256');
  return { expected, members: checked.members, plaintextBytes: checked.bytes, ack };
}

export function checkBlob(blob, sha, bytes, field) {
  shape(blob, ['sha256', 'bytes', 'observedSha256', 'observedBytes'], field);
  hash(blob.sha256, field);
  hash(blob.observedSha256, field);
  integer(blob.bytes, field, 1);
  integer(blob.observedBytes, field);
  if (blob.observedBytes < blob.bytes) refuse('TRUNCATED_INPUT', field);
  same(blob.observedBytes, blob.bytes, 'SIZE_MISMATCH', field);
  same(blob.sha256, blob.observedSha256, 'HASH_MISMATCH', field);
  same(blob.sha256, sha, 'HASH_MISMATCH', field);
  same(blob.bytes, bytes, 'SIZE_MISMATCH', field);
}

export function result(model, simulationAccepted, error = null, descriptors = null) {
  return {
    contractVersion: 'permission-main-prep-v1', taskId: 'A', modelVersion: model,
    evidenceMode: 'SIMULATION', valid: false, simulationAccepted,
    execution: 'NOT_RUN', runtimeAdmission: 'NOT_RUN', custodyObserved: 'NOT_RUN', authentication: 'NOT_PROVEN',
    runtimeBinding: { runId: null, attempt: null, profile: null, stage: null, nonce: null, backendIdentity: null },
    effects: { plaintextWrites: 0, networkRequests: 0, processInvocations: 0, gpgInvocations: 0, ackPosts: 0 },
    actualTransport: 'STOP', intentionalCleanupAllowed: false,
    retryPolicy: { issueId: 'TRANSPORT-GPG', failedActual: 2, additionalActualAllowed: 0 },
    errors: error ? [{ code: error.code, field: error.field }] : [], descriptors,
  };
}

/** Inspect synthetic seal/closure descriptors; never seal or read an archive. */
export function modelTransport(packageJson, expectedJson) {
  try {
    const { expected, members, plaintextBytes, ack } = checkExpectation(expectedJson);
    const pkg = decode(packageJson, 'package');
    shape(pkg, ['schemaVersion', 'binding', 'configSha256', 'members', 'archive', 'cipher', 'status', 'closure'], 'package');
    same(pkg.schemaVersion, 'permission-transport-package-v1', 'SCHEMA_MISMATCH', 'package.schemaVersion');
    shape(pkg.binding, BINDING_FIELDS, 'package.binding');
    for (const field of BINDING_FIELDS) same(pkg.binding[field], expected.binding[field], field === 'sourceSha' ? 'SOURCE_DRIFT' : 'BINDING_MISMATCH', `binding.${field}`);
    same(pkg.configSha256, expected.configSha256, 'HASH_MISMATCH', 'configSha256');
    const checked = checkMembers(pkg.members, true, 'members');
    compareMembers(checked.members, members);
    checkBlob(pkg.archive, expected.binding.archiveSha256, expected.archiveBytes, 'archive');
    checkBlob(pkg.cipher, expected.binding.cipherSha256, expected.binding.cipherBytes, 'cipher');
    shape(pkg.status, ['bytes', 'observedBytes'], 'status');
    integer(pkg.status.bytes, 'status.bytes');
    integer(pkg.status.observedBytes, 'status.observedBytes');
    if (pkg.status.observedBytes < pkg.status.bytes) refuse('TRUNCATED_INPUT', 'status');
    same(pkg.status.observedBytes, pkg.status.bytes, 'SIZE_MISMATCH', 'status');
    shape(pkg.closure, ['format', 'sha256', 'memberCount', 'plaintextBytes'], 'closure');
    same(pkg.closure.format, 'permission-model-closure-v1', 'CLOSURE_MISMATCH', 'closure');
    same(pkg.closure.sha256, expected.binding.closureSha256, 'CLOSURE_MISMATCH', 'closure');
    same(pkg.closure.memberCount, members.length, 'CLOSURE_MISMATCH', 'closure');
    same(pkg.closure.plaintextBytes, plaintextBytes, 'CLOSURE_MISMATCH', 'closure');
    return result(MODEL_VERSION, true, null, {
      seal: { kind: 'seal', mode: 'SIMULATION', algorithm: 'NOT_SELECTED', archive: pkg.archive, cipher: pkg.cipher, statusBytes: pkg.status.bytes },
      closure: pkg.closure,
      receive: { kind: 'receive', mode: 'SIMULATION', artifactId: expected.binding.artifactId, cipherSha256: pkg.cipher.sha256, cipherBytes: pkg.cipher.bytes },
      open: { kind: 'open', mode: 'SIMULATION', archiveSha256: pkg.archive.sha256, archiveBytes: pkg.archive.bytes, plaintextBytes, authentication: 'NOT_PROVEN' },
      ackCommitment: ack,
      declaredAccounting: { plaintextLogicalBytes: plaintextBytes, archiveLogicalBytes: pkg.archive.bytes,
        cipherLogicalBytes: pkg.cipher.bytes, statusLogicalBytes: pkg.status.bytes, memberCount: members.length,
        meaning: 'SYNTHETIC_DECLARATIONS_ONLY' },
    });
  } catch (error) {
    if (!(error instanceof ModelRefusal)) throw error;
    return result(MODEL_VERSION, false, error);
  }
}

/** For B: no maximum for real profiles can be inferred from a small fixture. */
export function transportBounds() {
  const fields = ['plaintextLogicalMaxBytes', 'archiveLogicalMaxBytes', 'archiveAllocatedMaxBytes', 'cipherTransferMaxBytes',
    'cipherDAllocatedMaxBytes', 'statusMaxBytes', 'manifestMaxBytes', 'memberCountMax', 'peakRamMaxBytes',
    'sealPeakRamMaxBytes', 'receiverPeakRamMaxBytes', 'privateCAllocatedMaxBytes',
    'globalRetainedAllocatedMaxBytes', 'failurePathOverheadMaxBytes', 'ackStatusMaxBytes', 'ackAllocatedMaxBytes',
    'archiveTimeMaxSeconds', 'sealTimeMaxSeconds', 'receiveOpenTimeMaxSeconds', 'ackRetentionMaxSeconds'];
  return {
    contractVersion: 'permission-main-prep-v1', taskId: 'A', modelVersion: MODEL_VERSION,
    evidenceMode: 'PLAN_ONLY', execution: 'NOT_RUN', runtimeAdmission: 'NOT_RUN', custodyObserved: 'NOT_RUN',
    planDecision: 'STOP', custodyCipherCapBytes: CIPHER_MAX_BYTES, capIsBudgetProof: false,
    profiles: ['STATIC', 'PIN_ONBOARD', 'PIN_IDENTITY', 'PIN_CANARY', 'PG16_T01', 'SUPABASE_T02', 'SUPABASE_T04'].map(profile => ({
      profile, bounds: Object.fromEntries(fields.map(field => [field, { maximum: null, reason: 'UNKNOWN' }])),
    })),
    missingInputs: [
      { owner: 'P', input: 'Frozen PIN19 output/member/trace/retention maxima' },
      { owner: 'R', input: 'Frozen PERM60 stage/DB-preservation output/member maxima' },
      { owner: 'D/root', input: 'Approved actual crypto/archive/receiver strategy and exact writers/placement/overlap' },
      { owner: 'D/root', input: 'Historical retained allocation and failure/ACK lifecycle accounting' },
    ],
    failurePolicy: { issueId: 'TRANSPORT-GPG', failedActual: 2, additionalActualAllowed: 0,
      keepExistingEvidence: true, newRetriesAuthorized: false, missingEvidenceNeverPasses: true },
  };
}
