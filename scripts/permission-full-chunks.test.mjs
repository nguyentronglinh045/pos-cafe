import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { encodeChunks, createChunkDecoder, CHUNK_DATA_BYTES, CHUNK_FRAME_BYTES,
  CHUNK_PAYLOAD_BYTES, CHUNK_ERRORS } from './permission-full-chunks.mjs';

const binding = 'a'.repeat(64);
const digest = value => createHash('sha256').update(value).digest('hex');
const code = (action, expected) => assert.throws(action, e => e instanceof Error
  && e.message === expected && e.code === expected && CHUNK_ERRORS.includes(e.code));
const decoder = encoded => createChunkDecoder(binding, encoded.descriptor.payloadSha256, encoded.descriptor.payloadBytes);
function read(encoded) { const d = decoder(encoded); for (const f of encoded.frames) d.push(f); return d.finish(encoded.commit); }
const change = (text, fields) => JSON.stringify({...JSON.parse(text), ...fields});

test('opaque UTF-8 payload greater than 256 KiB is reconstructed byte exactly', () => {
  const text = JSON.stringify({format:'raw-aggregate-fixture', raw:'x'.repeat(280 * 1024), ending:'\u0000\n💧'});
  const encoded = encodeChunks(text, binding);
  assert.ok(encoded.frames.length > 8);
  assert.ok(encoded.frames.every(f => Buffer.byteLength(f) <= CHUNK_FRAME_BYTES));
  assert.equal(encoded.descriptor.payloadBytes, Buffer.byteLength(text));
  assert.equal(encoded.descriptor.payloadSha256, digest(Buffer.from(text)));
  assert.equal(read(encoded), text);
  assert.equal(encoded.valid, false); assert.equal(encoded.authentication, 'NOT_PROVEN');
  assert.equal(encoded.execution, 'NOT_RUN'); assert.equal(encoded.effects, 0);
  // Reachable fixture wire+input+output stay well below4MiB serialized; this
  // assertion is not an RSS/OS quota or runtime admission measurement.
  assert.ok(Buffer.byteLength(JSON.stringify(encoded)) + 2 * Buffer.byteLength(text) < 4 * 1024 * 1024);
});

for (const bytes of [1, CHUNK_DATA_BYTES - 1, CHUNK_DATA_BYTES, CHUNK_DATA_BYTES + 1]) {
  test(`chunk boundary ${bytes} bytes preserves every byte`, () => {
    const text = 'x'.repeat(bytes); const encoded = encodeChunks(text, binding);
    assert.equal(encoded.frames.length, Math.ceil(bytes / CHUNK_DATA_BYTES));
    assert.equal(read(encoded), text);
  });
}

test('UTF-8 character may span chunk boundaries without partial decoding', () => {
  const text = 'x'.repeat(CHUNK_DATA_BYTES - 1) + '💧' + 'z';
  assert.equal(read(encodeChunks(text, binding)), text);
});

test('decoder requires independently supplied expected payload hash and size', () => {
  const encoded = encodeChunks('original', binding);
  const other = encodeChunks('replacement', binding);
  code(() => decoder(encoded).push(other.frames[0]), 'CHUNK_BINDING');
  code(() => createChunkDecoder(binding), 'CHUNK_BINDING');
  code(() => createChunkDecoder(binding, encoded.descriptor.payloadSha256, encoded.descriptor.payloadBytes + 1).push(encoded.frames[0]), 'CHUNK_BINDING');
  code(() => createChunkDecoder('b'.repeat(64), encoded.descriptor.payloadSha256, encoded.descriptor.payloadBytes).push(encoded.frames[0]), 'CHUNK_BINDING');
});

test('order, duplicates, truncation, omission and extra frames fail closed', () => {
  const encoded = encodeChunks('x'.repeat(CHUNK_DATA_BYTES + 1), binding);
  code(() => decoder(encoded).push(encoded.frames[1]), 'CHUNK_SEQUENCE');
  const duplicate = decoder(encoded); duplicate.push(encoded.frames[0]);
  code(() => duplicate.push(encoded.frames[0]), 'CHUNK_SEQUENCE');
  code(() => duplicate.push(encoded.frames[1]), 'CHUNK_STATE');
  const missing = decoder(encoded); missing.push(encoded.frames[0]);
  code(() => missing.finish(encoded.commit), 'CHUNK_COMPLETENESS');
  code(() => missing.push(encoded.frames[1]), 'CHUNK_STATE');
  code(() => decoder(encoded).push(encoded.frames[0].slice(0, -1)), 'CHUNK_JSON');
  const extra = decoder(encoded); for (const frame of encoded.frames) extra.push(frame);
  code(() => extra.push(encoded.frames[1]), 'CHUNK_SEQUENCE');
});

test('final commitment is mandatory and a stream can finish only once', () => {
  const encoded = encodeChunks('complete', binding); const d = decoder(encoded);
  d.push(encoded.frames[0]); assert.equal(d.finish(encoded.commit), 'complete');
  code(() => d.finish(encoded.commit), 'CHUNK_STATE');
  code(() => d.push(encoded.frames[0]), 'CHUNK_STATE');
  const early = decoder(encoded); code(() => early.finish(encoded.commit), 'CHUNK_COMPLETENESS');
});

test('chunk bytes, chunk hash, chain and final hash commitments are checked', () => {
  const encoded = encodeChunks('abc', binding);
  code(() => decoder(encoded).push(change(encoded.frames[0], {data:Buffer.from('abd').toString('base64')})), 'CHUNK_HASH');
  code(() => decoder(encoded).push(change(encoded.frames[0], {chunkSha256:'0'.repeat(64)})), 'CHUNK_HASH');
  code(() => decoder(encoded).push(change(encoded.frames[0], {previousSha256:'0'.repeat(64)})), 'CHUNK_HASH');
  const final = decoder(encoded); final.push(encoded.frames[0]);
  code(() => final.finish(change(encoded.commit, {chainSha256:'0'.repeat(64)})), 'CHUNK_HASH');
  const wrongHash = decoder(encoded); wrongHash.push(encoded.frames[0]);
  code(() => wrongHash.finish(change(encoded.commit, {payloadSha256:'0'.repeat(64)})), 'CHUNK_BINDING');
});

test('canonical base64 rejects alternate padding bits, wrong sizes and invalid bytes', () => {
  const encoded = encodeChunks('a', binding);
  for (const data of ['YR==', 'YQ', 'YQ===', 'YQ==\n', '!!!!']) {
    code(() => decoder(encoded).push(change(encoded.frames[0], {data})), 'CHUNK_BYTES');
  }
  code(() => decoder(encoded).push(change(encoded.frames[0], {chunkBytes:0})), 'CHUNK_BYTES');
});

test('duplicate decoded JSON keys, unknown/prototype keys and nested values are refused', () => {
  const encoded = encodeChunks('schema', binding);
  code(() => decoder(encoded).push(encoded.frames[0].replace('{', '{"schema":"permission-full-chunk-v1",')), 'CHUNK_DUPLICATE_KEY');
  code(() => decoder(encoded).push(encoded.frames[0].replace('{', '{"\\u0073chema":"permission-full-chunk-v1",')), 'CHUNK_DUPLICATE_KEY');
  for (const key of ['__proto__', 'toString', 'constructor']) {
    code(() => decoder(encoded).push(encoded.frames[0].replace('{', `{${JSON.stringify(key)}:"x",`)), 'CHUNK_SCHEMA');
  }
  code(() => decoder(encoded).push(change(encoded.frames[0], {index:{}})), 'CHUNK_JSON');
  code(() => decoder(encoded).push(encoded.frames[0] + ' trailing'), 'CHUNK_JSON');
});

test('JSON whitespace and header order do not alter canonical frame chaining', () => {
  const encoded = encodeChunks('x'.repeat(CHUNK_DATA_BYTES + 1), binding);
  const d = decoder(encoded);
  for (const text of encoded.frames) {
    const record = JSON.parse(text);
    const reversed = Object.fromEntries(Object.entries(record).reverse());
    d.push(' \n' + JSON.stringify(reversed, null, 1) + '\t');
  }
  assert.equal(d.finish(encoded.commit), 'x'.repeat(CHUNK_DATA_BYTES + 1));
});

test('scalar/type limits return finite errors without invoking caller getters or proxies', () => {
  let traps = 0;
  const poison = new Proxy({}, {get(){traps++;throw Error('UNREACHABLE');},ownKeys(){traps++;throw Error('UNREACHABLE');},getPrototypeOf(){traps++;throw Error('UNREACHABLE');}});
  const encoded = encodeChunks('safe', binding);
  for (const value of [null, undefined, 1, true, [], {}, poison]) {
    code(() => encodeChunks(value, binding), 'CHUNK_INPUT');
    code(() => decoder(encoded).push(value), 'CHUNK_INPUT');
    code(() => decoder(encoded).finish(value), 'CHUNK_INPUT');
    code(() => createChunkDecoder(value, encoded.descriptor.payloadSha256, 4), 'CHUNK_BINDING');
  }
  assert.equal(traps, 0);
  code(() => encodeChunks('', binding), 'CHUNK_INPUT');
  code(() => encodeChunks('\ud800', binding), 'CHUNK_UTF8');
  code(() => decoder(encoded).push('x'.repeat(CHUNK_FRAME_BYTES + 1)), 'CHUNK_LIMIT');
  code(() => createChunkDecoder(binding, encoded.descriptor.payloadSha256, CHUNK_PAYLOAD_BYTES + 1), 'CHUNK_LIMIT');
  code(() => createChunkDecoder(binding, encoded.descriptor.payloadSha256, 1.5), 'CHUNK_INPUT');
  code(() => decoder(encoded).push(change(encoded.frames[0], {index:1e99})), 'CHUNK_SCHEMA');
});

test('a self-consistent raw wire stream still refuses invalid UTF-8', () => {
  // Construct a hostile producer independently from the encoder: framing and
  // hashes are consistent, but decoding would replace invalid payload bytes.
  const raw = Buffer.from([255]); const payloadSha256 = digest(raw);
  const id = digest(['permission-full-stream-v1',binding,payloadSha256,'1','1'].join('\0'));
  const frame = {schema:'permission-full-chunk-v1',streamId:id,bindingSha256:binding,index:0,count:1,
    payloadBytes:1,payloadSha256,previousSha256:digest(`permission-full-start-v1\0${id}`),
    chunkBytes:1,chunkSha256:payloadSha256,data:raw.toString('base64')};
  const commit = {schema:'permission-full-chunk-commit-v1',streamId:id,bindingSha256:binding,count:1,
    payloadBytes:1,payloadSha256,chainSha256:digest('permission-full-frame-v1\0'+JSON.stringify(frame))};
  const d = createChunkDecoder(binding,payloadSha256,1); d.push(JSON.stringify(frame));
  code(() => d.finish(JSON.stringify(commit)), 'CHUNK_UTF8');
});
