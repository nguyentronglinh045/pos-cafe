import assert from 'node:assert/strict';
import test from 'node:test';
import { compareAnchors, comparePixels } from './metrics.mjs';

const strictPixels = { channelThreshold: 0, maxDiffRatio: 0 };
const rectangle = (id, changes = {}) => ({ id, x: 10, y: 20, width: 30, height: 40, ...changes });
const styled = (changes = {}) => rectangle('heading', {
  fontFamily: 'Inter, sans-serif',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '32px',
  color: 'rgb(20, 30, 40)',
  backgroundColor: 'rgb(255, 255, 255)',
  ...changes,
});

test('identical RGBA bytes pass a zero tolerance gate and remain unchanged', () => {
  const actual = Uint8Array.from([100, 120, 140, 255, 200, 220, 240, 128]);
  const expected = new Uint8ClampedArray(actual);
  const original = Array.from(actual);
  const result = comparePixels(actual, expected, 2, 1, strictPixels);
  assert.equal(result.pass, true);
  assert.equal(result.totalPixels, 2);
  assert.equal(result.differentPixels, 0);
  assert.equal(result.diffRatio, 0);
  assert.deepEqual(result.regions, []);
  assert.deepEqual(Array.from(result.overlayRgba), original);
  assert.deepEqual(Array.from(actual), original);
  assert.deepEqual(Array.from(expected), original);
  assert.deepEqual(Array.from(result.diffRgba), [35, 42, 49, 255, 70, 77, 84, 255]);
  assert.notEqual(result.diffRgba, actual);
  assert.notEqual(result.overlayRgba, expected);
});

test('one changed critical pixel fails its local gate despite a passing whole-image ratio', () => {
  const expected = new Uint8Array(100 * 100 * 4).fill(255);
  const actual = new Uint8Array(expected);
  actual[(61 * 100 + 72) * 4] = 0;
  const options = { channelThreshold: 0, maxDiffRatio: 0.01 };
  assert.equal(comparePixels(actual, expected, 100, 100, options).pass, true);
  const result = comparePixels(actual, expected, 100, 100, {
    ...options,
    regions: [
      { id: 'critical-control', x: 72, y: 61, width: 1, height: 1, maxDiffRatio: 0 },
      { id: 'other-control', x: 73, y: 61, width: 1, height: 1, maxDiffRatio: 0 },
    ],
  });
  assert.equal(result.pass, false);
  assert.equal(result.differentPixels, 1);
  assert.equal(result.diffRatio, 0.0001);
  assert.deepEqual(result.regions.map(({ differentPixels, diffRatio, pass }) => (
    { differentPixels, diffRatio, pass }
  )), [
    { differentPixels: 1, diffRatio: 1, pass: false },
    { differentPixels: 0, diffRatio: 0, pass: true },
  ]);
  assert.deepEqual(Array.from(result.diffRgba.slice((61 * 100 + 72) * 4, (61 * 100 + 72) * 4 + 4)), [255, 0, 0, 255]);
});

test('any changed RGBA channels count once per pixel, including alpha', () => {
  const result = comparePixels(
    Uint8Array.from([255, 255, 255, 255, 0, 0, 0, 1]),
    new Uint8Array(8),
    2, 1, strictPixels,
  );
  assert.equal(result.differentPixels, 2);
  assert.equal(result.diffRatio, 1);
  assert.equal(result.pass, false);
});

test('channel threshold is inclusive and accepts its exact zero/255 boundaries', () => {
  const expected = new Uint8Array(4);
  const actual = Uint8Array.from([10, 0, 0, 0]);
  assert.equal(comparePixels(actual, expected, 1, 1, { channelThreshold: 10, maxDiffRatio: 0 }).pass, true);
  assert.equal(comparePixels(actual, expected, 1, 1, { channelThreshold: 9, maxDiffRatio: 0 }).pass, false);
  assert.equal(comparePixels(actual, expected, 1, 1, { channelThreshold: 0, maxDiffRatio: 0 }).pass, false);
  assert.equal(comparePixels(Uint8Array.from([255, 255, 255, 255]), expected, 1, 1, {
    channelThreshold: 255, maxDiffRatio: 0,
  }).pass, true);
});

test('ratio gates are inclusive, and a passing region cannot waive whole-image failure', () => {
  const actual = Uint8Array.from([1, 0, 0, 0, 0, 0, 0, 0]);
  const expected = new Uint8Array(8);
  assert.equal(comparePixels(actual, expected, 2, 1, { channelThreshold: 0, maxDiffRatio: 0.5 }).pass, true);
  const result = comparePixels(actual, expected, 2, 1, {
    channelThreshold: 0,
    maxDiffRatio: 0.49,
    regions: [{ id: 'whole', x: 0, y: 0, width: 2, height: 1, maxDiffRatio: 1 }],
  });
  assert.equal(result.regions[0].pass, true);
  assert.equal(result.pass, false);
});

test('region indexing includes the last row/column and counts overlapping regions independently', () => {
  const expected = new Uint8Array(3 * 2 * 4);
  const actual = new Uint8Array(expected);
  actual[(1 * 3 + 2) * 4 + 3] = 1;
  const result = comparePixels(actual, expected, 3, 2, {
    channelThreshold: 0, maxDiffRatio: 1,
    regions: [
      { id: 'right', x: 2, y: 0, width: 1, height: 2, maxDiffRatio: 0.5 },
      { id: 'bottom', x: 0, y: 1, width: 3, height: 1, maxDiffRatio: 1 / 3 },
    ],
  });
  assert.equal(result.pass, true);
  assert.deepEqual(result.regions.map((region) => region.differentPixels), [1, 1]);
  assert.deepEqual(result.regions.map((region) => region.totalPixels), [2, 3]);
});

test('overlay contains a rounded 50/50 blend of all four channels', () => {
  const result = comparePixels(
    Uint8Array.from([0, 101, 255, 1]),
    Uint8Array.from([255, 100, 0, 254]),
    1, 1, { channelThreshold: 0, maxDiffRatio: 1 },
  );
  assert.deepEqual(Array.from(result.overlayRgba), [128, 101, 128, 128]);
});

test('pixel comparison accepts an exact Buffer view without reading surrounding storage', () => {
  const storage = Buffer.from([99, 1, 2, 3, 4, 99]);
  const actual = storage.subarray(1, 5);
  assert.equal(comparePixels(actual, Uint8Array.from([1, 2, 3, 4]), 1, 1, strictPixels).pass, true);
  assert.deepEqual(Array.from(storage), [99, 1, 2, 3, 4, 99]);
});

test('pixel dimensions reject zero, negatives, fractions, non-finite, and more than 16,777,216 pixels', () => {
  for (const [width, height] of [[0, 1], [1, 0], [-1, 1], [0.5, 2], [NaN, 1], [1, Infinity], [4097, 4096], [16_777_217, 1]]) {
    assert.throws(() => comparePixels(new Uint8Array(4), new Uint8Array(4), width, height, strictPixels));
  }
});

test('pixel inputs require byte arrays of exactly four bytes per pixel', () => {
  for (const invalid of [null, [], new Uint16Array(4), new Float32Array(4), new Uint8Array(3), new Uint8Array(5)]) {
    assert.throws(() => comparePixels(invalid, new Uint8Array(4), 1, 1, strictPixels));
    assert.throws(() => comparePixels(new Uint8Array(4), invalid, 1, 1, strictPixels));
  }
});

test('pixel gates require explicit finite thresholds and ratio values', () => {
  for (const invalid of [undefined, null, [], {}, { channelThreshold: 0 }, { maxDiffRatio: 0 },
    { channelThreshold: NaN, maxDiffRatio: 0 }, { channelThreshold: 0.5, maxDiffRatio: 0 },
    { channelThreshold: -1, maxDiffRatio: 0 }, { channelThreshold: 256, maxDiffRatio: 0 },
    { channelThreshold: '0', maxDiffRatio: 0 }, { channelThreshold: 0, maxDiffRatio: NaN },
    { channelThreshold: 0, maxDiffRatio: Infinity }, { channelThreshold: 0, maxDiffRatio: -0.01 },
    { channelThreshold: 0, maxDiffRatio: 1.01 }, { channelThreshold: 0, maxDiffRatio: '0' }]) {
    assert.throws(() => comparePixels(new Uint8Array(4), new Uint8Array(4), 1, 1, invalid));
  }
});

test('regions reject malformed arrays, unsafe/duplicate ids, absent gates, and out-of-bounds rectangles', () => {
  const region = { id: 'button', x: 0, y: 0, width: 1, height: 1, maxDiffRatio: 0 };
  const { maxDiffRatio: ignored, ...ungatedRegion } = region;
  const invalidRegions = [null, {}, [null], [region, region], [{ ...region, id: '../button' }],
    [{ ...region, id: '' }], [ungatedRegion], [{ ...region, maxDiffRatio: NaN }],
    [{ ...region, maxDiffRatio: 1.01 }], [{ ...region, x: -1 }], [{ ...region, y: -1 }],
    [{ ...region, x: 2 }], [{ ...region, y: 2 }], [{ ...region, x: 0.5 }],
    [{ ...region, width: 0 }], [{ ...region, height: 0 }], [{ ...region, width: 3 }],
    [{ ...region, height: 3 }], [{ ...region, x: 1, width: 2 }], [{ ...region, y: 1, height: 2 }],
    [{ ...region, x: NaN }], [{ ...region, height: Infinity }]];
  for (const regions of invalidRegions) {
    assert.throws(() => comparePixels(new Uint8Array(16), new Uint8Array(16), 2, 2, { ...strictPixels, regions }));
  }
});

test('matching anchors pass independent of array ordering', () => {
  const expected = [rectangle('title'), rectangle('total', { x: 60 })];
  const actual = [rectangle('total', { x: 60 }), rectangle('title')];
  const result = compareAnchors(actual, expected, 0);
  assert.equal(result.pass, true);
  assert.equal(result.maxGeometryDeltaPx, 0);
  assert.deepEqual(result.anchors.map((anchor) => anchor.id), ['title', 'total']);
  assert.deepEqual(result.anchors[0].deltas, { x: 0, y: 0, width: 0, height: 0 });
});

test('geometry compares each position and dimension using the largest absolute delta', () => {
  const expected = [rectangle('title')];
  const actual = [rectangle('title', { x: 9, y: 22, width: 27, height: 44 })];
  const result = compareAnchors(actual, expected, 3);
  assert.equal(result.pass, false);
  assert.equal(result.maxGeometryDeltaPx, 4);
  assert.deepEqual(result.anchors[0].deltas, { x: 1, y: 2, width: 3, height: 4 });
  assert.equal(compareAnchors(actual, expected, 4).pass, true);
});

test('a tiny fractional geometry shift fails a zero tolerance gate', () => {
  const expected = [rectangle('title')];
  const actual = [rectangle('title', { x: 10.25 })];
  assert.equal(compareAnchors(actual, expected, 0).pass, false);
  assert.equal(compareAnchors(actual, expected, 0.25).pass, true);
});

test('each geometry property independently enforces the tolerance gate', () => {
  const expected = rectangle('control');
  for (const property of ['x', 'y', 'width', 'height']) {
    const actual = { ...expected, [property]: expected[property] + 2 };
    const result = compareAnchors([actual], [expected], 1);
    assert.equal(result.pass, false, property);
    assert.equal(result.maxGeometryDeltaPx, 2, property);
    assert.equal(compareAnchors([actual], [expected], 2).pass, true, property);
  }
});

test('missing and extra anchors are explicit findings even with unlimited useful geometry tolerance', () => {
  const result = compareAnchors([rectangle('extra'), rectangle('same')], [rectangle('missing'), rectangle('same')], 1_000_000);
  assert.equal(result.pass, false);
  assert.deepEqual(result.anchors.map(({ id, status, pass }) => ({ id, status, pass })), [
    { id: 'missing', status: 'missing', pass: false },
    { id: 'same', status: 'matched', pass: true },
    { id: 'extra', status: 'extra', pass: false },
  ]);
  assert.equal(result.anchors[0].deltas, null);
  assert.equal(result.anchors[2].deltas, null);
});

test('every expected typography and color property is checked exactly', () => {
  const expected = styled();
  for (const property of ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'color', 'backgroundColor']) {
    const actual = { ...expected, [property]: `${expected[property]} changed` };
    const result = compareAnchors([actual], [expected], 0);
    assert.equal(result.pass, false, property);
    assert.deepEqual(result.anchors[0].styleDifferences, [{ property, actual: actual[property], expected: expected[property] }]);
    assert.equal(result.maxGeometryDeltaPx, 0);
  }
});

test('a missing expected font cannot pass; styles absent from expected are outside that gate', () => {
  const actual = rectangle('heading');
  const result = compareAnchors([actual], [styled()], 0);
  assert.equal(result.pass, false);
  assert.equal(result.anchors[0].styleDifferences.length, 6);
  assert.deepEqual(result.anchors[0].styleDifferences[0], {
    property: 'fontFamily', actual: null, expected: 'Inter, sans-serif',
  });
  assert.equal(compareAnchors([styled()], [actual], 0).pass, true);
  assert.equal(compareAnchors([styled()], [styled()], 0).pass, true);
});

test('empty anchor arrays agree, but one-sided empty coverage fails', () => {
  assert.deepEqual(compareAnchors([], [], 0), { pass: true, anchors: [], maxGeometryDeltaPx: 0 });
  assert.equal(compareAnchors([], [rectangle('missing')], 0).pass, false);
  assert.equal(compareAnchors([rectangle('extra')], [], 0).pass, false);
});

test('anchor inputs and comparisons do not mutate caller records', () => {
  const actual = Object.freeze([Object.freeze(styled({ width: 31 }))]);
  const expected = Object.freeze([Object.freeze(styled())]);
  const before = JSON.stringify({ actual, expected });
  compareAnchors(actual, expected, 1);
  assert.equal(JSON.stringify({ actual, expected }), before);
});

test('anchor arrays reject invalid records, duplicate ids, non-finite geometry, and non-string styles', () => {
  const invalidArrays = [null, {}, [null], [rectangle('a'), rectangle('a')], [rectangle('')],
    [rectangle('../anchor')], [rectangle('a', { x: NaN })], [rectangle('a', { y: Infinity })],
    [rectangle('a', { width: -1 })], [rectangle('a', { height: -1 })],
    [rectangle('a', { x: '10' })], [rectangle('a', { fontSize: 24 })], [rectangle('a', { color: undefined })]];
  for (const invalid of invalidArrays) {
    assert.throws(() => compareAnchors(invalid, [], 0));
    assert.throws(() => compareAnchors([], invalid, 0));
  }
  assert.throws(() => compareAnchors([{ id: 'a', x: 0, y: 0, width: 1 }], [], 0));
});

test('anchor tolerance must be an explicit finite nonnegative number', () => {
  for (const tolerance of [undefined, null, NaN, Infinity, -1, '0']) {
    assert.throws(() => compareAnchors([], [], tolerance));
  }
});
