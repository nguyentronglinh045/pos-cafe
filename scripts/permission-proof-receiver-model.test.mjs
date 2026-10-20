import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { custodyAckDescriptor } from './permission-full-custody.mjs';
import { modelReceiver } from './permission-proof-receiver-model.mjs';

const digest = value => createHash('sha256').update(value).digest('hex');
const h = character => character.repeat(64);
function fixture() {
  const members = [{ path: 'reports/result.json', sha256: h('a'), bytes: 27 }, { path: 'receipts/closed.json', sha256: h('b'), bytes: 0 }];
  const binding = { repository: 'nguyentronglinh045/pos-cafe', repositoryId: 1263057386,
    runId: '123', attempt: 1, sourceSha: 'b'.repeat(40), profile: 'STATIC', nonce: 'c'.repeat(32),
    permissionFingerprint: h('d'), lockSha256: h('e'), recipeSha256: h('f'), artifactId: 1234,
    cipherSha256: h('1'), cipherBytes: 320, archiveSha256: h('2'), manifestSha256: h('3'),
    closureSha256: digest(JSON.stringify(['permission-model-closure-v1', members.toSorted((a,b) => a.path < b.path ? -1 : 1)])), closedAt: '2026-10-19T00:00:00Z' };
  const expected = { schemaVersion: 'permission-transport-expectation-v1', binding, configSha256: h('4'), archiveBytes: 5120, members };
  binding.manifestSha256 = digest(JSON.stringify(['permission-model-manifest-v1', binding.sourceSha,
    binding.lockSha256, binding.recipeSha256, expected.configSha256, expected.archiveBytes, members.toSorted((a,b) => a.path < b.path ? -1 : 1)]));
  const blob = (sha256, bytes) => ({ sha256, bytes, observedSha256: sha256, observedBytes: bytes });
  const observed = members.map(member => ({ ...member, observedSha256: member.sha256, observedBytes: member.bytes }));
  const pkg = { schemaVersion: 'permission-transport-package-v1', binding: structuredClone(binding), configSha256: expected.configSha256,
    members: observed, archive: blob(binding.archiveSha256, 5120), cipher: blob(binding.cipherSha256, binding.cipherBytes),
    status: { bytes: 361, observedBytes: 361 }, closure: { format: 'permission-model-closure-v1', sha256: binding.closureSha256, memberCount: 2, plaintextBytes: 27 } };
  const ack = custodyAckDescriptor(binding);
  const status = { id: 1, context: ack.context, state: 'success', description: ack.description, target_url: ack.target_url,
    created_at: '2026-10-19T00:01:00Z', creator: { id: 54500418, type: 'User' } };
  const request = { schemaVersion: 'permission-receiver-request-v1', packageJson: JSON.stringify(pkg),
    receipt: { artifactId: binding.artifactId, sourceSha: binding.sourceSha, cipherSha256: binding.cipherSha256,
      cipherBytes: binding.cipherBytes, receivedBytes: binding.cipherBytes, complete: true },
    openedArchive: structuredClone(pkg.archive), openedMembers: structuredClone(observed),
    ackResponse: { repositoryId: binding.repositoryId, queriedSha: binding.sourceSha, complete: true, statuses: [status] },
    now: '2026-10-19T00:02:00Z' };
  return { request, expected };
}
const run = ({ request, expected }) => modelReceiver(JSON.stringify(request), JSON.stringify(expected));
function rejected(mutate, code, ackReason) {
  const input = fixture(); mutate(input);
  const result = run(input);
  assert.equal(result.simulationAccepted, false);
  assert.equal(result.errors[0].code, code);
  if (ackReason) assert.equal(result.ackReason, ackReason);
}
test('main: receive/open/closure/latest owner ACK are only synthetic descriptors', () => {
  const result = run(fixture());
  assert.equal(result.simulationAccepted, true);
  assert.equal(result.valid, false);
  for (const field of ['execution', 'runtimeAdmission', 'custodyObserved']) assert.equal(result[field], 'NOT_RUN');
  assert.equal(result.descriptors.simulatedAck.accepted, true);
  assert.equal(result.descriptors.simulatedAck.provenance, 'UNAUTHENTICATED_SYNTHETIC_JSON');
  assert.equal(result.intentionalCleanupAllowed, false);
  assert.equal(result.actualTransport, 'STOP');
  assert.equal(result.retryPolicy.additionalActualAllowed, 0);
  assert.ok(Object.values(result.effects).every(value => value === 0));
  assert.equal(result.descriptors.placement.actualPath, null);
});
const negative = [
  ['missing request field', x => { delete x.request.receipt; }, 'SCHEMA_MISMATCH'],
  ['extra request field', x => { x.request.cleanup = true; }, 'SCHEMA_MISMATCH'],
  ['incomplete receive', x => { x.request.receipt.complete = false; }, 'RECEIVE_INCOMPLETE'],
  ['wrong artifact', x => { x.request.receipt.artifactId++; }, 'RECEIVE_MISMATCH'],
  ['wrong source', x => { x.request.receipt.sourceSha = '0'.repeat(40); }, 'RECEIVE_MISMATCH'],
  ['wrong cipher hash', x => { x.request.receipt.cipherSha256 = h('0'); }, 'RECEIVE_MISMATCH'],
  ['wrong cipher size', x => { x.request.receipt.cipherBytes--; }, 'RECEIVE_MISMATCH'],
  ['truncated download', x => { x.request.receipt.receivedBytes--; }, 'TRUNCATED_INPUT'],
  ['extra received bytes', x => { x.request.receipt.receivedBytes++; }, 'SIZE_MISMATCH'],
  ['truncated opened archive', x => { x.request.openedArchive.observedBytes--; }, 'TRUNCATED_INPUT'],
  ['wrong opened archive hash', x => { x.request.openedArchive.observedSha256 = h('0'); }, 'HASH_MISMATCH'],
  ['missing opened member', x => { x.request.openedMembers.pop(); }, 'MISSING_MEMBER'],
  ['extra opened member', x => { x.request.openedMembers.push({ ...x.request.openedMembers[0], path: 'extra' }); }, 'EXTRA_MEMBER'],
  ['duplicate opened member', x => { x.request.openedMembers.push(structuredClone(x.request.openedMembers[0])); }, 'DUPLICATE_MEMBER'],
  ['opened member traversal', x => { x.request.openedMembers[0].path = '../escape'; }, 'UNSAFE_PATH'],
  ['opened member hash mismatch', x => { x.request.openedMembers[0].observedSha256 = h('0'); }, 'HASH_MISMATCH'],
  ['stale nested package source', x => { const p = JSON.parse(x.request.packageJson); p.binding.sourceSha = '0'.repeat(40); x.request.packageJson = JSON.stringify(p); }, 'SOURCE_DRIFT'],
  ['missing ACK', x => { x.request.ackResponse.statuses = []; }, 'ACK_REFUSED', 'ACK_MISSING'],
  ['wrong ACK SHA', x => { x.request.ackResponse.queriedSha = '0'.repeat(40); }, 'ACK_REFUSED', 'STATUS_QUERY_UNVERIFIED'],
  ['incomplete pagination', x => { x.request.ackResponse.complete = false; }, 'ACK_REFUSED', 'STATUS_QUERY_UNVERIFIED'],
  ['wrong repository', x => { x.request.ackResponse.repositoryId++; }, 'ACK_REFUSED', 'STATUS_QUERY_UNVERIFIED'],
  ['wrong creator', x => { x.request.ackResponse.statuses[0].creator.id++; }, 'ACK_REFUSED', 'ACK_CREATOR_REFUSED'],
  ['creator bot', x => { x.request.ackResponse.statuses[0].creator.type = 'Bot'; }, 'ACK_REFUSED', 'ACK_CREATOR_REFUSED'],
  ['wrong commitment', x => { x.request.ackResponse.statuses[0].description = 'sha256:' + h('0'); }, 'ACK_REFUSED', 'ACK_BINDING_MISMATCH'],
  ['wrong ACK URL', x => { x.request.ackResponse.statuses[0].target_url += '0'; }, 'ACK_REFUSED', 'ACK_BINDING_MISMATCH'],
  ['stale ACK', x => { x.request.ackResponse.statuses[0].created_at = '2026-10-18T23:59:59Z'; }, 'ACK_REFUSED', 'ACK_TIME_INVALID'],
  ['future ACK', x => { x.request.ackResponse.statuses[0].created_at = '2026-10-19T00:03:00Z'; }, 'ACK_REFUSED', 'ACK_TIME_INVALID'],
  ['invalid now', x => { x.request.now = '2026-02-31T00:00:00Z'; }, 'ACK_REFUSED', 'STATUS_QUERY_UNVERIFIED'],
  ['duplicate ACK identity', x => { x.request.ackResponse.statuses.push(structuredClone(x.request.ackResponse.statuses[0])); }, 'ACK_REFUSED', 'STATUS_IDENTITY_INVALID'],
  ['combined green cannot replace context', x => { x.request.ackResponse.statuses[0].context = 'ci/combined'; }, 'ACK_REFUSED', 'ACK_MISSING'],
];
for (const [name, mutate, code, reason] of negative) test(`negative: ${name}`, () => rejected(mutate, code, reason));
for (const reverse of [false, true]) test(`security: newer differently cased failure supersedes success; reverse=${reverse}`, () => {
  const input = fixture();
  input.request.ackResponse.statuses.push({ ...input.request.ackResponse.statuses[0], id: 2,
    context: input.request.ackResponse.statuses[0].context.toUpperCase(), state: 'failure' });
  if (reverse) input.request.ackResponse.statuses.reverse();
  const result = run(input);
  assert.equal(result.simulationAccepted, false);
  assert.equal(result.ackReason, 'ACK_BINDING_MISMATCH');
});
test('security: newer untrusted creator supersedes an older owner success', () => rejected(x => {
  x.request.ackResponse.statuses.push({ ...x.request.ackResponse.statuses[0], id: 2, creator: { id: 99, type: 'User' } });
}, 'ACK_REFUSED', 'ACK_CREATOR_REFUSED'));
test('boundary: ACK at close and now time is accepted as simulation only', () => {
  const input = fixture();
  input.request.ackResponse.statuses[0].created_at = input.request.now = input.expected.binding.closedAt;
  assert.equal(run(input).simulationAccepted, true);
});
test('security: request and expectation object getters/proxies have no effects', () => {
  let effects = 0;
  const object = Object.defineProperty({}, 'receipt', { get() { effects++; throw Error('getter'); } });
  const proxy = new Proxy({}, { get() { effects++; throw Error('get'); }, getPrototypeOf() { effects++; throw Error('prototype'); } });
  for (const input of [object, proxy, null]) {
    assert.equal(modelReceiver(input, JSON.stringify(fixture().expected)).errors[0].code, 'INPUT_TYPE');
    assert.equal(modelReceiver('{}', input).errors[0].code, 'INPUT_TYPE');
  }
  assert.equal(effects, 0);
});
test('security: duplicate request keys are refused rather than silently choosing a receipt', () => {
  assert.equal(modelReceiver('{"receipt":{},"receipt":{}}', JSON.stringify(fixture().expected)).errors[0].code, 'DUPLICATE_KEY');
});
