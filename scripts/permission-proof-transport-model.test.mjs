import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { CIPHER_MAX_BYTES, ERROR_CODES, INPUT_MAX_BYTES, MEMBER_MAX_COUNT, checkBlob, checkMembers,
  compareMembers, decode, modelTransport, shape, transportBounds } from './permission-proof-transport-model.mjs';

const digest = value => createHash('sha256').update(value).digest('hex');
const h = character => character.repeat(64);
function fixture(members = [{ path: 'reports/result.json', sha256: h('a'), bytes: 27 }]) {
  members = members.toSorted((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
  const binding = { repository: 'nguyentronglinh045/pos-cafe', repositoryId: 1263057386,
    runId: '123', attempt: 1, sourceSha: 'b'.repeat(40), profile: 'STATIC', nonce: 'c'.repeat(32),
    permissionFingerprint: h('d'), lockSha256: h('e'), recipeSha256: h('f'), artifactId: 1234,
    cipherSha256: h('1'), cipherBytes: 320, archiveSha256: h('2'), manifestSha256: h('3'),
    closureSha256: digest(JSON.stringify(['permission-model-closure-v1', members])), closedAt: '2026-10-19T00:00:00Z' };
  const expected = { schemaVersion: 'permission-transport-expectation-v1', binding, configSha256: h('4'), archiveBytes: 5120, members };
  binding.manifestSha256 = digest(JSON.stringify(['permission-model-manifest-v1', binding.sourceSha,
    binding.lockSha256, binding.recipeSha256, expected.configSha256, expected.archiveBytes, members]));
  const blob = (sha256, bytes) => ({ sha256, bytes, observedSha256: sha256, observedBytes: bytes });
  const pkg = { schemaVersion: 'permission-transport-package-v1', binding: structuredClone(binding),
    configSha256: expected.configSha256, members: members.map(member => ({ ...member, observedSha256: member.sha256, observedBytes: member.bytes })),
    archive: blob(binding.archiveSha256, expected.archiveBytes), cipher: blob(binding.cipherSha256, binding.cipherBytes),
    status: { bytes: 361, observedBytes: 361 }, closure: { format: 'permission-model-closure-v1', sha256: binding.closureSha256,
      memberCount: members.length, plaintextBytes: members.reduce((sum, member) => sum + member.bytes, 0) } };
  return { expected, pkg };
}
const run = ({ expected, pkg }) => modelTransport(JSON.stringify(pkg), JSON.stringify(expected));
function rejected(mutator, code) {
  const input = fixture(); mutator(input);
  const result = run(input);
  assert.equal(result.simulationAccepted, false);
  assert.equal(result.errors[0].code, code);
  assert.ok(ERROR_CODES.includes(code));
  assert.equal(result.valid, false);
}
function assertInert(result) {
  assert.equal(result.evidenceMode, 'SIMULATION');
  for (const key of ['execution', 'runtimeAdmission', 'custodyObserved']) assert.equal(result[key], 'NOT_RUN');
  assert.equal(result.authentication, 'NOT_PROVEN');
  assert.equal(result.actualTransport, 'STOP');
  assert.equal(result.intentionalCleanupAllowed, false);
  assert.deepEqual(Object.values(result.effects), [0, 0, 0, 0, 0]);
  assert.equal(result.retryPolicy.failedActual, 2);
  assert.equal(result.retryPolicy.additionalActualAllowed, 0);
  assert.ok(Object.values(result.runtimeBinding).every(value => value === null));
}

test('main: complete synthetic package gives typed descriptors, never execution evidence', () => {
  const result = run(fixture());
  assert.equal(result.simulationAccepted, true);
  assert.equal(result.valid, false);
  assert.equal(result.descriptors.seal.kind, 'seal');
  assert.equal(result.descriptors.receive.kind, 'receive');
  assert.equal(result.descriptors.open.kind, 'open');
  assert.equal(result.descriptors.closure.memberCount, 1);
  assert.equal(result.descriptors.declaredAccounting.plaintextLogicalBytes, 27);
  assertInert(result);
});
test('closure canonicalizes member order but preserves exact member identities', () => {
  const input = fixture([{ path: 'b.json', sha256: h('b'), bytes: 0 }, { path: 'a.json', sha256: h('a'), bytes: 1 }]);
  input.pkg.members.reverse();
  assert.equal(run(input).simulationAccepted, true);
});
const negative = [
  ['missing top field', x => { delete x.pkg.status; }, 'SCHEMA_MISMATCH'],
  ['extra top field', x => { x.pkg.execute = true; }, 'SCHEMA_MISMATCH'],
  ['extra binding field', x => { x.pkg.binding.cleanup = true; }, 'SCHEMA_MISMATCH'],
  ['source drift', x => { x.pkg.binding.sourceSha = '0'.repeat(40); }, 'SOURCE_DRIFT'],
  ['recipe drift', x => { x.pkg.binding.recipeSha256 = h('0'); }, 'BINDING_MISMATCH'],
  ['lock drift', x => { x.pkg.binding.lockSha256 = h('0'); }, 'BINDING_MISMATCH'],
  ['stale nonce', x => { x.pkg.binding.nonce = '0'.repeat(32); }, 'BINDING_MISMATCH'],
  ['config drift', x => { x.pkg.configSha256 = h('0'); }, 'HASH_MISMATCH'],
  ['member hash mismatch', x => { x.pkg.members[0].observedSha256 = h('0'); }, 'HASH_MISMATCH'],
  ['declared member hash differs from expected', x => { x.pkg.members[0].sha256 = x.pkg.members[0].observedSha256 = h('0'); }, 'HASH_MISMATCH'],
  ['member length mismatch', x => { x.pkg.members[0].bytes = x.pkg.members[0].observedBytes = 26; }, 'SIZE_MISMATCH'],
  ['truncated member', x => { x.pkg.members[0].observedBytes = 26; }, 'TRUNCATED_INPUT'],
  ['oversized member stream', x => { x.pkg.members[0].observedBytes = 28; }, 'SIZE_MISMATCH'],
  ['negative length', x => { x.pkg.members[0].bytes = -1; }, 'INVALID_VALUE'],
  ['fractional length', x => { x.pkg.members[0].bytes = 1.5; }, 'INVALID_VALUE'],
  ['duplicate member', x => { x.pkg.members.push(structuredClone(x.pkg.members[0])); }, 'DUPLICATE_MEMBER'],
  ['case alias', x => { x.pkg.members.push({ ...x.pkg.members[0], path: 'REPORTS/RESULT.JSON' }); }, 'DUPLICATE_MEMBER'],
  ['extra member', x => { x.pkg.members.push({ ...x.pkg.members[0], path: 'extra.json' }); }, 'EXTRA_MEMBER'],
  ['file/directory conflict', x => { x.pkg.members.push({ ...x.pkg.members[0], path: 'reports' }); }, 'MEMBER_TREE_CONFLICT'],
  ['truncated archive', x => { x.pkg.archive.observedBytes--; }, 'TRUNCATED_INPUT'],
  ['truncated cipher', x => { x.pkg.cipher.observedBytes--; }, 'TRUNCATED_INPUT'],
  ['cipher hash mismatch', x => { x.pkg.cipher.observedSha256 = h('0'); }, 'HASH_MISMATCH'],
  ['archive hash mismatch', x => { x.pkg.archive.observedSha256 = h('0'); }, 'HASH_MISMATCH'],
  ['cipher declared length mismatch', x => { x.pkg.cipher.bytes = x.pkg.cipher.observedBytes = 319; }, 'SIZE_MISMATCH'],
  ['truncated status', x => { x.pkg.status.observedBytes--; }, 'TRUNCATED_INPUT'],
  ['extra status bytes', x => { x.pkg.status.observedBytes++; }, 'SIZE_MISMATCH'],
  ['closure count drift', x => { x.pkg.closure.memberCount++; }, 'CLOSURE_MISMATCH'],
  ['closure byte drift', x => { x.pkg.closure.plaintextBytes++; }, 'CLOSURE_MISMATCH'],
  ['closure hash drift', x => { x.pkg.closure.sha256 = h('0'); }, 'CLOSURE_MISMATCH'],
  ['stale expected closure', x => { x.expected.members[0].sha256 = h('0'); }, 'CLOSURE_MISMATCH'],
  ['stale expected manifest', x => { x.expected.configSha256 = h('0'); }, 'MANIFEST_MISMATCH'],
  ['invalid expected owner repository', x => { x.expected.binding.repositoryId++; }, 'BINDING_INVALID'],
  ['over cipher cap', x => { x.expected.binding.cipherBytes = CIPHER_MAX_BYTES + 1; }, 'BINDING_INVALID'],
];
for (const [name, mutator, code] of negative) test(`negative: ${name}`, () => rejected(mutator, code));
test('missing one required member is refused even when the remaining member is valid', () => {
  const input = fixture([{ path: 'a', sha256: h('a'), bytes: 1 }, { path: 'b', sha256: h('b'), bytes: 2 }]);
  input.pkg.members.pop();
  assert.equal(run(input).errors[0].code, 'MISSING_MEMBER');
});
for (const path of ['../secret', '/absolute', 'C:/file', 'a\\b', 'a//b', 'a/./b', 'a/../b', 'a:b', 'a%2fb', 'NUL.txt', 'aux', 'a.', 'a\u0000b', 'é.json']) {
  test(`security: refuse unsafe path ${JSON.stringify(path)}`, () => rejected(x => { x.pkg.members[0].path = path; }, 'UNSAFE_PATH'));
}
test('security: external getter/prototype/proxy inputs are rejected without invoking user code', () => {
  let effects = 0;
  const getter = Object.defineProperty({}, 'binding', { get() { effects++; throw Error('getter'); } });
  const custom = Object.create({ get schemaVersion() { effects++; return ''; } });
  const proxy = new Proxy({}, { get() { effects++; throw Error('get'); }, getPrototypeOf() { effects++; throw Error('prototype'); }, ownKeys() { effects++; throw Error('keys'); } });
  for (const input of [getter, custom, proxy, null, [], 42]) {
    assert.equal(modelTransport(input, JSON.stringify(fixture().expected)).errors[0].code, 'INPUT_TYPE');
    assert.equal(modelTransport('{}', input).errors[0].code, 'INPUT_TYPE');
  }
  assert.equal(effects, 0);
});
test('security: duplicate JSON keys, including escaped aliases, cannot shadow bindings', () => {
  for (const text of ['{"x":1,"x":2}', '{"x":1,"\\u0078":2}']) {
    assert.equal(modelTransport(text, JSON.stringify(fixture().expected)).errors[0].code, 'DUPLICATE_KEY');
  }
});
test('security: prototype pollution key is refused without modifying Object.prototype', () => {
  const text = JSON.stringify(fixture().pkg).replace('"schemaVersion":', '"__proto__":{"polluted":true},"schemaVersion":');
  assert.equal(modelTransport(text, JSON.stringify(fixture().expected)).errors[0].code, 'SCHEMA_MISMATCH');
  assert.equal({}.polluted, undefined);
});
test('security: internal descriptor helpers refuse unbranded objects before any getter or proxy trap', () => {
  let effects = 0;
  const object = Object.defineProperty({}, 'sha256', { get() { effects++; throw Error('getter'); } });
  const proxy = new Proxy([], { get() { effects++; throw Error('get'); }, getPrototypeOf() { effects++; throw Error('prototype'); } });
  const revoked = Proxy.revocable({}, {}); revoked.revoke();
  for (const input of [object, proxy, revoked.proxy]) {
    assert.throws(() => shape(input, ['sha256'], 'blob'), /SCHEMA_MISMATCH/);
    assert.throws(() => checkBlob(input, h('a'), 1, 'blob'), /SCHEMA_MISMATCH/);
    assert.throws(() => checkMembers(input, true, 'members'), /INPUT_TYPE/);
    assert.throws(() => compareMembers(input, input), /INPUT_TYPE/);
  }
  const parsed = decode('{"nested":{"value":1}}', 'fixture');
  assert.ok(Object.isFrozen(parsed) && Object.isFrozen(parsed.nested));
  assert.equal(effects, 0);
});
test('boundary: exact input cap passes; one UTF8 byte over fails before parsing', () => {
  const input = fixture();
  const text = JSON.stringify(input.pkg);
  const padded = text + ' '.repeat(INPUT_MAX_BYTES - Buffer.byteLength(text));
  assert.equal(modelTransport(padded, JSON.stringify(input.expected)).simulationAccepted, true);
  assert.equal(modelTransport(padded + ' ', JSON.stringify(input.expected)).errors[0].code, 'INPUT_TOO_LARGE');
  assert.equal(modelTransport('é'.repeat(INPUT_MAX_BYTES / 2 + 1), '{}').errors[0].code, 'SCHEMA_MISMATCH'); // expected validated first
  assert.equal(modelTransport('é'.repeat(INPUT_MAX_BYTES / 2 + 1), JSON.stringify(input.expected)).errors[0].code, 'INPUT_TOO_LARGE');
});
test('boundary: minimum member bytes and status bytes are zero', () => {
  const input = fixture([{ path: 'empty.json', sha256: h('a'), bytes: 0 }]);
  input.pkg.status.bytes = input.pkg.status.observedBytes = 0;
  assert.equal(run(input).simulationAccepted, true);
});
test('boundary: exact custody cipher cap passes only as a declaration', () => {
  const input = fixture();
  input.expected.binding.cipherBytes = input.pkg.binding.cipherBytes = CIPHER_MAX_BYTES;
  input.pkg.cipher.bytes = input.pkg.cipher.observedBytes = CIPHER_MAX_BYTES;
  const result = run(input);
  assert.equal(result.simulationAccepted, true); assertInert(result);
});
test('boundary: safe integer total overflow fails closed', () => {
  const input = fixture([{ path: 'a', sha256: h('a'), bytes: Number.MAX_SAFE_INTEGER }, { path: 'b', sha256: h('b'), bytes: 1 }]);
  assert.equal(run(input).errors[0].code, 'INVALID_VALUE');
});
test('boundary: model member maximum and maximum+1', () => {
  const members = Array.from({ length: MEMBER_MAX_COUNT }, (_, i) => ({ path: `r${i}`, sha256: h('a'), bytes: 0 }));
  const input = fixture(members);
  assert.ok(Buffer.byteLength(JSON.stringify(input.pkg)) <= INPUT_MAX_BYTES);
  assert.ok(Buffer.byteLength(JSON.stringify(input.expected)) <= INPUT_MAX_BYTES);
  assert.equal(run(input).simulationAccepted, true);
  input.expected.members.push({ path: 'overflow', sha256: h('a'), bytes: 0 });
  assert.equal(run(input).errors[0].code, 'INVALID_VALUE');
});
test('malformed JSON and primitive JSON never yield simulation acceptance', () => {
  for (const text of ['{', 'null', '[]', 'true', '"text"']) assert.equal(modelTransport(text, JSON.stringify(fixture().expected)).simulationAccepted, false);
});
test('budget handoff preserves all seven profiles and every UNKNOWN, including failure retention', () => {
  const report = transportBounds();
  assert.equal(report.profiles.length, 7);
  assert.equal(report.planDecision, 'STOP');
  assert.equal(report.custodyCipherCapBytes, CIPHER_MAX_BYTES);
  assert.equal(report.capIsBudgetProof, false);
  for (const profile of report.profiles) for (const bound of Object.values(profile.bounds)) assert.deepEqual(bound, { maximum: null, reason: 'UNKNOWN' });
  assert.equal(report.failurePolicy.additionalActualAllowed, 0);
  assert.ok(report.missingInputs.some(input => input.owner === 'P'));
  assert.ok(report.missingInputs.some(input => input.owner === 'R'));
});
