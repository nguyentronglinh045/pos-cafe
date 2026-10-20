// Deterministic RGBA and anchor measurements. These are explicit comparison gates,
// not a perceptual similarity or UI accuracy score.
const MAX_PIXELS = 16_777_216;
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;
const GEOMETRY = ['x', 'y', 'width', 'height'];
const STYLES = [
  'fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'color', 'backgroundColor',
];

function object(value, name) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${name} must be an object`);
  }
}

function finiteNumber(value, name) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`${name} must be a finite number`);
  }
}

function integer(value, name, minimum, maximum) {
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    throw new RangeError(`${name} must be an integer from ${minimum} to ${maximum}`);
  }
}

function ratio(value, name) {
  finiteNumber(value, name);
  if (value < 0 || value > 1) throw new RangeError(`${name} must be from 0 to 1`);
}

function id(value, name) {
  if (typeof value !== 'string' || !SAFE_ID.test(value)) {
    throw new TypeError(`${name} must match ${SAFE_ID}`);
  }
}

function rgba(value, name, expectedLength) {
  if (!(value instanceof Uint8Array) && !(value instanceof Uint8ClampedArray)) {
    throw new TypeError(`${name} must be a Uint8Array or Uint8ClampedArray`);
  }
  if (value.length !== expectedLength) {
    throw new RangeError(`${name} must contain exactly ${expectedLength} RGBA bytes`);
  }
}

function validateRegions(regions, width, height) {
  if (!Array.isArray(regions)) throw new TypeError('regions must be an array');
  const ids = new Set();
  for (const region of regions) {
    object(region, 'region');
    id(region.id, 'region.id');
    if (ids.has(region.id)) throw new TypeError(`Duplicate region id: ${region.id}`);
    ids.add(region.id);
    integer(region.x, `${region.id}.x`, 0, width - 1);
    integer(region.y, `${region.id}.y`, 0, height - 1);
    integer(region.width, `${region.id}.width`, 1, width - region.x);
    integer(region.height, `${region.id}.height`, 1, height - region.y);
    ratio(region.maxDiffRatio, `${region.id}.maxDiffRatio`);
  }
}

/**
 * Count a pixel once when any RGBA channel differs by more than channelThreshold.
 * All thresholds are required, including each region's independent ratio gate.
 * Regions use integer pixel coordinates; their right/bottom edges may coincide
 * with the screenshot edges. Inputs are never changed.
 */
export function comparePixels(actualRgba, expectedRgba, width, height, options) {
  integer(width, 'width', 1, MAX_PIXELS);
  integer(height, 'height', 1, MAX_PIXELS);
  const totalPixels = width * height;
  if (totalPixels > MAX_PIXELS) {
    throw new RangeError(`Screenshot must contain at most ${MAX_PIXELS} pixels`);
  }
  rgba(actualRgba, 'actualRgba', totalPixels * 4);
  rgba(expectedRgba, 'expectedRgba', totalPixels * 4);
  object(options, 'options');
  const { channelThreshold, maxDiffRatio, regions = [] } = options;
  integer(channelThreshold, 'channelThreshold', 0, 255);
  ratio(maxDiffRatio, 'maxDiffRatio');
  validateRegions(regions, width, height);

  const diffRgba = new Uint8Array(totalPixels * 4);
  const overlayRgba = new Uint8Array(totalPixels * 4);
  const changed = new Uint8Array(totalPixels);
  let differentPixels = 0;
  for (let pixel = 0; pixel < totalPixels; pixel += 1) {
    const offset = pixel * 4;
    let different = false;
    for (let channel = 0; channel < 4; channel += 1) {
      const actual = actualRgba[offset + channel];
      const expected = expectedRgba[offset + channel];
      if (Math.abs(actual - expected) > channelThreshold) different = true;
      overlayRgba[offset + channel] = Math.round((actual + expected) / 2);
    }
    if (different) {
      changed[pixel] = 1;
      differentPixels += 1;
      diffRgba[offset] = 255;
      diffRgba[offset + 1] = 0;
      diffRgba[offset + 2] = 0;
      diffRgba[offset + 3] = 255;
    } else {
      // Opaque diagnostic background keeps even transparent source pixels visible.
      diffRgba[offset] = Math.round(expectedRgba[offset] * 0.35);
      diffRgba[offset + 1] = Math.round(expectedRgba[offset + 1] * 0.35);
      diffRgba[offset + 2] = Math.round(expectedRgba[offset + 2] * 0.35);
      diffRgba[offset + 3] = 255;
    }
  }

  const regionResults = regions.map((region) => {
    let regionDifferentPixels = 0;
    for (let y = region.y; y < region.y + region.height; y += 1) {
      const end = y * width + region.x + region.width;
      for (let pixel = y * width + region.x; pixel < end; pixel += 1) {
        regionDifferentPixels += changed[pixel];
      }
    }
    const regionPixels = region.width * region.height;
    const diffRatio = regionDifferentPixels / regionPixels;
    return {
      id: region.id,
      x: region.x,
      y: region.y,
      width: region.width,
      height: region.height,
      totalPixels: regionPixels,
      differentPixels: regionDifferentPixels,
      diffRatio,
      pass: diffRatio <= region.maxDiffRatio,
    };
  });
  const diffRatio = differentPixels / totalPixels;
  return {
    width,
    height,
    totalPixels,
    differentPixels,
    diffRatio,
    pass: diffRatio <= maxDiffRatio && regionResults.every((region) => region.pass),
    regions: regionResults,
    diffRgba,
    overlayRgba,
  };
}

function anchorMap(anchors, name) {
  if (!Array.isArray(anchors)) throw new TypeError(`${name} must be an array`);
  const byId = new Map();
  for (const anchor of anchors) {
    object(anchor, `${name} anchor`);
    id(anchor.id, `${name} anchor.id`);
    if (byId.has(anchor.id)) throw new TypeError(`Duplicate ${name} id: ${anchor.id}`);
    for (const property of GEOMETRY) {
      finiteNumber(anchor[property], `${name}.${anchor.id}.${property}`);
      if ((property === 'width' || property === 'height') && anchor[property] < 0) {
        throw new RangeError(`${name}.${anchor.id}.${property} must not be negative`);
      }
    }
    for (const property of STYLES) {
      if (Object.hasOwn(anchor, property) && typeof anchor[property] !== 'string') {
        throw new TypeError(`${name}.${anchor.id}.${property} must be a string`);
      }
    }
    byId.set(anchor.id, anchor);
  }
  return byId;
}

/**
 * Compare exact anchor coverage, geometry, and each style specified by expected.
 * CSS values must already be normalized by the capture layer; no font/style
 * differences are waived here. Missing/extra anchors always fail. The maximum
 * geometry delta covers matched anchors only (zero when none can be measured).
 */
export function compareAnchors(actualArray, expectedArray, tolerancePx) {
  finiteNumber(tolerancePx, 'tolerancePx');
  if (tolerancePx < 0) throw new RangeError('tolerancePx must not be negative');
  const actualById = anchorMap(actualArray, 'actual');
  const expectedById = anchorMap(expectedArray, 'expected');
  const anchors = [];
  let maxGeometryDeltaPx = 0;

  for (const [anchorId, expected] of expectedById) {
    const actual = actualById.get(anchorId);
    if (!actual) {
      anchors.push({
        id: anchorId, status: 'missing', pass: false, deltas: null, styleDifferences: [],
      });
      continue;
    }
    const deltas = Object.fromEntries(GEOMETRY.map((property) => [
      property, Math.abs(actual[property] - expected[property]),
    ]));
    const geometryDelta = Math.max(...Object.values(deltas));
    maxGeometryDeltaPx = Math.max(maxGeometryDeltaPx, geometryDelta);
    const styleDifferences = STYLES
      .filter((property) => Object.hasOwn(expected, property)
        && (!Object.hasOwn(actual, property) || actual[property] !== expected[property]))
      .map((property) => ({
        property,
        actual: Object.hasOwn(actual, property) ? actual[property] : null,
        expected: expected[property],
      }));
    anchors.push({
      id: anchorId,
      status: 'matched',
      pass: geometryDelta <= tolerancePx && styleDifferences.length === 0,
      deltas,
      styleDifferences,
    });
  }
  for (const anchorId of actualById.keys()) {
    if (!expectedById.has(anchorId)) {
      anchors.push({
        id: anchorId, status: 'extra', pass: false, deltas: null, styleDifferences: [],
      });
    }
  }
  return { pass: anchors.every((anchor) => anchor.pass), anchors, maxGeometryDeltaPx };
}
