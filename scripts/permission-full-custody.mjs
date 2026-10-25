import { createHash } from 'node:crypto';

// Pure protocol checks only. The future adapters must obtain these records from
// authenticated GitHub responses and local verified decryption. This module does
// not download, decrypt, post statuses, authorize filesystem paths or delete data.
const repository = 'nguyentronglinh045/pos-cafe';
const repositoryId = 1263057386;
const ownerId = 54500418;
const profiles = ['STATIC', 'PIN_ONBOARD', 'PIN_IDENTITY', 'PIN_CANARY', 'PG16_T01', 'SUPABASE_T02', 'SUPABASE_T04'];
const fields = ['repository', 'repositoryId', 'runId', 'attempt', 'sourceSha', 'profile', 'nonce',
  'permissionFingerprint', 'lockSha256', 'recipeSha256', 'artifactId', 'cipherSha256', 'cipherBytes',
  'archiveSha256', 'manifestSha256', 'closureSha256', 'closedAt'];
const refuse = () => { throw new Error('PERMISSION_CUSTODY_BINDING_REFUSED'); };
const hex = (value, length) => typeof value === 'string' && value.length === length && new RegExp(`^[a-f0-9]{${length}}$`).test(value);
const positive = value => Number.isSafeInteger(value) && value > 0;
const instant = value => typeof value === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(value)
  && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().replace('.000Z', 'Z') === value.replace('.000Z', 'Z');

export function custodyAckDescriptor(binding) {
  if (!binding || Object.getPrototypeOf(binding) !== Object.prototype
    || Object.keys(binding).sort().join(',') !== [...fields].sort().join(',')
    || binding.repository !== repository || binding.repositoryId !== repositoryId
    || typeof binding.runId !== 'string' || !/^[1-9][0-9]{0,19}$/.test(binding.runId)
    || !positive(binding.attempt) || binding.attempt > 1000 || !hex(binding.sourceSha, 40)
    || !profiles.includes(binding.profile) || !hex(binding.nonce, 32)
    || !positive(binding.artifactId) || !positive(binding.cipherBytes) || binding.cipherBytes > 256 * 1024 ** 2
    || !instant(binding.closedAt)) refuse();
  for (const field of ['permissionFingerprint', 'lockSha256', 'recipeSha256', 'cipherSha256', 'archiveSha256', 'manifestSha256', 'closureSha256'])
    if (!hex(binding[field], 64)) refuse();
  // Fixed order and domain separation bind every declared field, including the
  // artifact identity and member closure, without publishing private report data.
  const commitment = createHash('sha256').update(JSON.stringify(['permission-custody-ack-v1', ...fields.map(field => binding[field])])).digest('hex');
  return {
    context: `pos-perm-custody/${binding.runId}/${binding.attempt}/${profiles.indexOf(binding.profile)}/${binding.nonce}`,
    description: `sha256:${commitment}`,
    target_url: `https://github.com/${repository}/actions/runs/${binding.runId}`,
    commitment,
  };
}

export function verifyCustodyAck(binding, response, { now = new Date().toISOString() } = {}) {
  const descriptor = custodyAckDescriptor(binding);
  const rejected = reason => ({ valid: false, reason, commitment: descriptor.commitment });
  // Complete is the adapter's pagination assertion, not a field in GitHub JSON.
  // The adapter must refuse truncation and must query the exact immutable SHA.
  if (response?.repositoryId !== repositoryId || response.queriedSha !== binding.sourceSha
    || response.complete !== true || !Array.isArray(response.statuses) || response.statuses.length > 10000
    || !instant(now)) return rejected('STATUS_QUERY_UNVERIFIED');
  // GitHub treats status contexts as case-insensitive. A newer differently
  // cased status must supersede an earlier success in the same context.
  const matching = response.statuses.filter(status => typeof status?.context === 'string'
    && status.context.toLowerCase() === descriptor.context.toLowerCase());
  if (!matching.length) return rejected('ACK_MISSING');
  if (matching.some(status => !positive(status.id)) || new Set(matching.map(status => status.id)).size !== matching.length)
    return rejected('STATUS_IDENTITY_INVALID');
  // An old success never overrides a newer failure or an untrusted status in
  // this context. Ignore the combined commit-green status entirely.
  const latest = matching.reduce((left, right) => left.id > right.id ? left : right);
  if (latest.creator?.id !== ownerId || latest.creator?.type !== 'User') return rejected('ACK_CREATOR_REFUSED');
  if (latest.state !== 'success' || latest.description !== descriptor.description || latest.target_url !== descriptor.target_url)
    return rejected('ACK_BINDING_MISMATCH');
  if (!instant(latest.created_at) || Date.parse(latest.created_at) < Date.parse(binding.closedAt)
    || Date.parse(latest.created_at) > Date.parse(now)) return rejected('ACK_TIME_INVALID');
  return { valid: true, reason: null, commitment: descriptor.commitment, statusId: latest.id };
}
