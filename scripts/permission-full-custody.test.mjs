import assert from 'node:assert/strict';
import test from 'node:test';
import { custodyAckDescriptor, verifyCustodyAck } from './permission-full-custody.mjs';

const binding = () => ({ repository: 'nguyentronglinh045/pos-cafe', repositoryId: 1263057386,
  runId: '39124310244', attempt: 1, sourceSha: 'a'.repeat(40), profile: 'SUPABASE_T04', nonce: 'b'.repeat(32),
  permissionFingerprint: '1'.repeat(64), lockSha256: '2'.repeat(64), recipeSha256: '3'.repeat(64), artifactId: 123,
  cipherSha256: '4'.repeat(64), cipherBytes: 1024, archiveSha256: '5'.repeat(64), manifestSha256: '6'.repeat(64),
  closureSha256: '7'.repeat(64), closedAt: '2026-10-18T01:00:00Z' });
const now = { now: '2026-10-18T01:10:00Z' };
const success = (value, id = 11) => ({ id, state: 'success', ...custodyAckDescriptor(value),
  creator: { id: 54500418, type: 'User' }, created_at: '2026-10-18T01:01:00Z' });
const response = (value, statuses = [success(value)]) => ({ repositoryId: 1263057386, queriedSha: value.sourceSha, complete: true, statuses });

test('accepts a bound latest owner ACK, independently of unrelated statuses', () => {
  const value = binding();
  const result = verifyCustodyAck(value, response(value, [success(value), { context: 'ci', state: 'failure', id: 99 }]), now);
  assert.equal(result.valid, true);
  assert.equal(result.statusId, 11);
  assert.equal(custodyAckDescriptor(value).context.length <= 100, true);
});

test('every source, artifact and closure field is in the commitment; key insertion order is immaterial', () => {
  const value = binding(), descriptor = custodyAckDescriptor(value);
  assert.deepEqual(custodyAckDescriptor(Object.fromEntries(Object.entries(value).reverse())), descriptor);
  const mutations = { runId: '39124310245', attempt: 2, sourceSha: 'c'.repeat(40), profile: 'PIN_CANARY',
    nonce: 'c'.repeat(32), permissionFingerprint: 'c'.repeat(64), lockSha256: 'c'.repeat(64), recipeSha256: 'c'.repeat(64),
    artifactId: 124, cipherSha256: 'c'.repeat(64), cipherBytes: 1025, archiveSha256: 'c'.repeat(64),
    manifestSha256: 'c'.repeat(64), closureSha256: 'c'.repeat(64), closedAt: '2026-10-18T01:00:01Z' };
  for (const [field, changed] of Object.entries(mutations)) {
    const other = { ...value, [field]: changed };
    assert.notEqual(custodyAckDescriptor(other).commitment, descriptor.commitment, field);
    assert.equal(verifyCustodyAck(other, response(other, [success(value)]), now).valid, false, field);
  }
});

test('rejects stale success followed by failure or spoofed bot/owner status, in either API ordering', () => {
  const value = binding(), old = success(value);
  for (const mutation of [{ state: 'failure' }, { state: 'pending' }, { creator: { id: 41898282, type: 'Bot' } },
    { creator: { id: 54500418, type: 'Bot' } }, { creator: { id: 99, type: 'User' } }]) {
    const latest = { ...success(value, 12), ...mutation };
    for (const statuses of [[old, latest], [latest, old]]) assert.equal(verifyCustodyAck(value, response(value, statuses), now).valid, false);
  }
});

test('refuses incomplete/wrong-SHA query and malformed matching identities', () => {
  const value = binding();
  for (const mutation of [{ complete: false }, { complete: undefined }, { queriedSha: 'd'.repeat(40) },
    { repositoryId: 99 }, { statuses: [] }, { statuses: [success(value), success(value)] },
    { statuses: [{ ...success(value), id: '11' }] }, { statuses: null }])
    assert.equal(verifyCustodyAck(value, { ...response(value), ...mutation }, now).valid, false);
});

test('case-insensitive contexts cannot hide a newer failure or untrusted ACK', () => {
  const value = binding(), old = success(value);
  for (const mutation of [{ state: 'failure' }, { creator: { id: 99, type: 'User' } }]) {
    const newer = { ...success(value, 12), context: old.context.toUpperCase(), ...mutation };
    for (const statuses of [[old, newer], [newer, old]])
      assert.equal(verifyCustodyAck(value, response(value, statuses), now).valid, false);
  }
});

test('refuses replaced digest/link, ACK before closure, future ACK and invalid dates', () => {
  const value = binding();
  for (const mutation of [{ description: 'sha256:' + 'f'.repeat(64) }, { target_url: 'https://example.invalid/' },
    { created_at: '2026-10-18T00:59:59Z' }, { created_at: '2026-10-18T01:10:01Z' },
    { created_at: '2026-02-30T01:01:00Z' }])
    assert.equal(verifyCustodyAck(value, response(value, [{ ...success(value), ...mutation }]), now).valid, false);
});

test('strict binding validates numbers, caps, canonical UTC and rejects undeclared fields/HP1', () => {
  const value = binding();
  for (const mutation of [{ repository: 'other/repo' }, { repositoryId: '1263057386' }, { runId: '1\n' }, { attempt: 0 },
    { attempt: 1001 }, { attempt: 1.5 }, { sourceSha: 'f'.repeat(40) + '\n' }, { profile: 'HP1' }, { nonce: 'x'.repeat(32) },
    { artifactId: 0 }, { cipherBytes: 256 * 1024 ** 2 + 1 }, { cipherBytes: -1 }, { closureSha256: null },
    { closedAt: '2026-02-30T01:01:00Z' }, { closedAt: '2026-10-18T01:00:00+00:00' }, { unexpected: true }])
    assert.throws(() => custodyAckDescriptor({ ...value, ...mutation }), /PERMISSION_CUSTODY_BINDING_REFUSED/);
  assert.doesNotThrow(() => custodyAckDescriptor({ ...value, cipherBytes: 256 * 1024 ** 2 }));
  assert.doesNotThrow(() => custodyAckDescriptor({ ...value, profile: 'PIN_ONBOARD' }));
  assert.doesNotThrow(() => custodyAckDescriptor({ ...value, closedAt: '2026-10-18T01:00:00.123Z' }));
  assert.equal(verifyCustodyAck(value, response(value), { now: 'invalid' }).valid, false);
});
