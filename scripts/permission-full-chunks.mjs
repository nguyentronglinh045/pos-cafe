import { createHash } from 'node:crypto';

// Pure framing for an opaque UTF-8 payload. These hashes do not authenticate
// origin, authorize I/O, prove source semantics, or admit any runtime resource.
// The caller must obtain the expected binding, payload hash and size from an
// independently validated descriptor, never from the received frames alone.
export const CHUNK_DATA_BYTES = 32768;
export const CHUNK_FRAME_BYTES = 65536;
export const CHUNK_PAYLOAD_BYTES = 8 * 1024 * 1024;
export const CHUNK_ERRORS = Object.freeze([
  'CHUNK_INPUT', 'CHUNK_LIMIT', 'CHUNK_UTF8', 'CHUNK_JSON',
  'CHUNK_DUPLICATE_KEY', 'CHUNK_SCHEMA', 'CHUNK_BINDING',
  'CHUNK_SEQUENCE', 'CHUNK_BYTES', 'CHUNK_HASH',
  'CHUNK_COMPLETENESS', 'CHUNK_STATE',
]);
const FRAME = 'permission-full-chunk-v1';
const COMMIT = 'permission-full-chunk-commit-v1';
const HASH = /^[a-f0-9]{64}$/;
const FRAME_KEYS = ['schema', 'streamId', 'bindingSha256', 'index', 'count',
  'payloadBytes', 'payloadSha256', 'previousSha256', 'chunkBytes', 'chunkSha256', 'data'];
const COMMIT_KEYS = ['schema', 'streamId', 'bindingSha256', 'count',
  'payloadBytes', 'payloadSha256', 'chainSha256'];
const digest = value => createHash('sha256').update(value).digest('hex');
const error = code => { const e = new Error(code); e.code = code; return e; };
const reject = code => { throw error(code); };
const validHash = value => typeof value === 'string' && HASH.test(value);
const integer = value => Number.isSafeInteger(value) && value >= 0;
const streamId = (binding, payloadHash, bytes, count) =>
  digest(`permission-full-stream-v1\0${binding}\0${payloadHash}\0${bytes}\0${count}`);
const startHash = id => digest(`permission-full-start-v1\0${id}`);
const frameHash = record => digest('permission-full-frame-v1\0' + JSON.stringify(record));

function textBytes(value, maximum, fail) {
  if (typeof value !== 'string') fail('CHUNK_INPUT');
  if (value.length > maximum) fail('CHUNK_LIMIT');
  const bytes = Buffer.from(value, 'utf8');
  if (bytes.length > maximum) fail('CHUNK_LIMIT');
  if (bytes.toString('utf8') !== value) fail('CHUNK_UTF8');
  return bytes;
}

// A flat JSON record parser detects duplicate decoded keys before lookup.
// Only string/number values are permitted; no caller objects are inspected.
function parseRecord(text, fail) {
  textBytes(text, CHUNK_FRAME_BYTES, fail);
  let at = 0;
  const ws = () => { while (at < text.length && /[\x20\t\r\n]/.test(text[at])) at++; };
  const string = () => {
    if (text[at] !== '"') fail('CHUNK_JSON');
    const begin = at++;
    while (at < text.length) {
      const character = text[at++];
      if (character === '\\') { at++; continue; }
      if (character === '"') {
        try { return JSON.parse(text.slice(begin, at)); }
        catch (e) { if (e instanceof SyntaxError) fail('CHUNK_JSON'); throw e; }
      }
      if (character.charCodeAt(0) < 32) fail('CHUNK_JSON');
    }
    fail('CHUNK_JSON');
  };
  ws(); if (text[at++] !== '{') fail('CHUNK_JSON');
  const result = Object.create(null);
  const seen = new Set();
  ws(); if (text[at] === '}') { at++; ws(); if (at !== text.length) fail('CHUNK_JSON'); return result; }
  while (at < text.length) {
    ws(); const key = string();
    if (seen.has(key)) fail('CHUNK_DUPLICATE_KEY');
    seen.add(key); if (seen.size > FRAME_KEYS.length) fail('CHUNK_SCHEMA');
    ws(); if (text[at++] !== ':') fail('CHUNK_JSON'); ws();
    let value;
    if (text[at] === '"') value = string();
    else {
      const token = /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/.exec(text.slice(at));
      if (!token) fail('CHUNK_JSON');
      value = Number(token[0]); at += token[0].length;
    }
    result[key] = value; ws();
    const separator = text[at++];
    if (separator === '}') { ws(); if (at !== text.length) fail('CHUNK_JSON'); return result; }
    if (separator !== ',') fail('CHUNK_JSON');
  }
  fail('CHUNK_JSON');
}

function keys(record, expected, fail) {
  const actual = Object.keys(record);
  if (actual.length !== expected.length || actual.some(key => !expected.includes(key))) fail('CHUNK_SCHEMA');
}

function canonicalFrame(record) {
  return {
    schema: record.schema, streamId: record.streamId, bindingSha256: record.bindingSha256,
    index: record.index, count: record.count, payloadBytes: record.payloadBytes,
    payloadSha256: record.payloadSha256, previousSha256: record.previousSha256,
    chunkBytes: record.chunkBytes, chunkSha256: record.chunkSha256, data: record.data,
  };
}

export function encodeChunks(payloadText, bindingSha256) {
  if (!validHash(bindingSha256)) reject('CHUNK_BINDING');
  const payload = textBytes(payloadText, CHUNK_PAYLOAD_BYTES, reject);
  if (payload.length === 0) reject('CHUNK_INPUT');
  const payloadSha256 = digest(payload);
  const count = Math.ceil(payload.length / CHUNK_DATA_BYTES);
  const id = streamId(bindingSha256, payloadSha256, payload.length, count);
  let previous = startHash(id);
  const frames = [];
  for (let index = 0; index < count; index++) {
    const chunk = payload.subarray(index * CHUNK_DATA_BYTES, (index + 1) * CHUNK_DATA_BYTES);
    const frame = {schema: FRAME, streamId: id, bindingSha256, index, count,
      payloadBytes: payload.length, payloadSha256, previousSha256: previous,
      chunkBytes: chunk.length, chunkSha256: digest(chunk), data: chunk.toString('base64')};
    const text = JSON.stringify(frame);
    if (Buffer.byteLength(text) > CHUNK_FRAME_BYTES) reject('CHUNK_LIMIT');
    frames.push(text); previous = frameHash(frame);
  }
  const commit = JSON.stringify({schema: COMMIT, streamId: id, bindingSha256, count,
    payloadBytes: payload.length, payloadSha256, chainSha256: previous});
  return Object.freeze({frames: Object.freeze(frames), commit,
    descriptor: Object.freeze({bindingSha256, payloadSha256, payloadBytes: payload.length, count, streamId: id}),
    valid: false, authentication: 'NOT_PROVEN', execution: 'NOT_RUN', effects: 0});
}

export function createChunkDecoder(expectedBindingSha256, expectedPayloadSha256, expectedPayloadBytes) {
  if (!validHash(expectedBindingSha256) || !validHash(expectedPayloadSha256)) reject('CHUNK_BINDING');
  if (!integer(expectedPayloadBytes) || expectedPayloadBytes < 1) reject('CHUNK_INPUT');
  if (expectedPayloadBytes > CHUNK_PAYLOAD_BYTES) reject('CHUNK_LIMIT');
  const count = Math.ceil(expectedPayloadBytes / CHUNK_DATA_BYTES);
  const id = streamId(expectedBindingSha256, expectedPayloadSha256, expectedPayloadBytes, count);
  let state = 'OPEN', next = 0, received = 0, previous = startHash(id);
  const chunks = [];
  const hasher = createHash('sha256');
  const fail = code => { state = 'FAILED'; chunks.length = 0; throw error(code); };
  const open = () => { if (state !== 'OPEN') fail('CHUNK_STATE'); };
  const binding = record => {
    if (record.streamId !== id || record.bindingSha256 !== expectedBindingSha256
      || record.payloadSha256 !== expectedPayloadSha256 || record.payloadBytes !== expectedPayloadBytes
      || record.count !== count) fail('CHUNK_BINDING');
  };
  return Object.freeze({
    push(frameText) {
      open(); const record = parseRecord(frameText, fail); keys(record, FRAME_KEYS, fail);
      if (record.schema !== FRAME || !validHash(record.streamId) || !validHash(record.bindingSha256)
        || !validHash(record.payloadSha256) || !validHash(record.previousSha256)
        || !validHash(record.chunkSha256) || !integer(record.index) || !integer(record.count)
        || !integer(record.payloadBytes) || !integer(record.chunkBytes) || typeof record.data !== 'string') fail('CHUNK_SCHEMA');
      binding(record);
      if (record.index !== next || next >= count) fail('CHUNK_SEQUENCE');
      if (record.previousSha256 !== previous) fail('CHUNK_HASH');
      const expectedBytes = Math.min(CHUNK_DATA_BYTES, expectedPayloadBytes - received);
      if (record.chunkBytes !== expectedBytes || record.data.length !== 4 * Math.ceil(expectedBytes / 3)
        || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(record.data)) fail('CHUNK_BYTES');
      const chunk = Buffer.from(record.data, 'base64');
      if (chunk.length !== expectedBytes || chunk.toString('base64') !== record.data) fail('CHUNK_BYTES');
      if (digest(chunk) !== record.chunkSha256) fail('CHUNK_HASH');
      hasher.update(chunk); chunks.push(chunk); received += chunk.length; next++;
      previous = frameHash(canonicalFrame(record));
      return Object.freeze({accepted: next, count, complete: false, valid: false, effects: 0});
    },
    finish(commitText) {
      open(); const record = parseRecord(commitText, fail); keys(record, COMMIT_KEYS, fail);
      if (record.schema !== COMMIT || !validHash(record.streamId) || !validHash(record.bindingSha256)
        || !validHash(record.payloadSha256) || !validHash(record.chainSha256)
        || !integer(record.count) || !integer(record.payloadBytes)) fail('CHUNK_SCHEMA');
      binding(record);
      if (next !== count || received !== expectedPayloadBytes) fail('CHUNK_COMPLETENESS');
      if (record.chainSha256 !== previous || hasher.digest('hex') !== expectedPayloadSha256) fail('CHUNK_HASH');
      const bytes = Buffer.concat(chunks, expectedPayloadBytes);
      const result = bytes.toString('utf8');
      if (!Buffer.from(result, 'utf8').equals(bytes)) fail('CHUNK_UTF8');
      chunks.length = 0; state = 'CLOSED';
      return result;
    },
  });
}
