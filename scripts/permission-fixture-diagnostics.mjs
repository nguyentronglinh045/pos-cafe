// Diagnostic-only helpers. They never change a fingerprint or grant decision.
export const FIXTURE_DRIFT_CODES = Object.freeze([
  'READ_FIXTURE_DRIFT', 'FINANCIAL_FIXTURE_DRIFT', 'BUSINESS_FIXTURE_DRIFT', 'IDENTITY_CATALOG_DRIFT',
  ...Array.from({ length: 255 }, (_, index) => `IDENTITY_CATALOG_DRIFT_MASK_${index + 1}`),
]);

export async function withFixtureCleanup(body, finalizer) {
  const errors = [];
  try { await body(); } catch (error) { errors.push(error); }
  try { await finalizer(); } catch (error) { errors.push(error); }
  if (errors.length === 1) throw errors[0];
  if (errors.length) throw new AggregateError(errors, 'FIXTURE_CLEANUP_FAILED');
}

export function fixtureCleanupErrors(error) {
  const result = [];
  function visit(value, depth) {
    if (result.length >= 32) return;
    if (value instanceof AggregateError && value.message === 'FIXTURE_CLEANUP_FAILED') {
      if (depth >= 4 || !Array.isArray(value.errors) || !value.errors.length || value.errors.length > 32) {
        result.push(undefined);
      } else for (const nested of value.errors) visit(nested, depth + 1);
    } else result.push(value);
  }
  visit(error, 0);
  return result;
}

export function fixtureDriftCode(error) {
  const message = error?.message;
  if (typeof message !== 'string') return null;
  if (message.startsWith('READ_FIXTURE_DRIFT: ')) return 'READ_FIXTURE_DRIFT';
  if (message === 'IDENTITY_CATALOG_DRIFT') {
    const mask = error.permissionCatalogDriftMask;
    return Number.isSafeInteger(mask) && mask >= 1 && mask <= 255
      ? `IDENTITY_CATALOG_DRIFT_MASK_${mask}` : message;
  }
  return FIXTURE_DRIFT_CODES.includes(message) ? message : null;
}

// Bits: 1 missing/added surface; 2 relation ACL; 4 column ACL;
// 8 effective grants; 16 routine; 32 relation/column structure;
// 64 policy/publication/Storage metadata; 128 other or unreadable diagnostic.
// The caller still compares the full original semantic hash, regardless of mask.
export function fixtureCatalogDriftMask(before, after) {
  try {
    const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
    const index = values => {
      if (!Array.isArray(values) || values.length > 20000) throw new Error();
      const rows = new Map();
      for (const value of values) {
        if (!value || typeof value !== 'object' || typeof value.surfaceId !== 'string'
          || value.surfaceId.length > 4096 || rows.has(value.surfaceId)) throw new Error();
        rows.set(value.surfaceId, value);
      }
      return rows;
    };
    const without = (value, keys) => value && Object.fromEntries(Object.entries(value).filter(([key]) => !keys.includes(key)));
    const oldRows = index(before), newRows = index(after);
    // Ordering is part of the caller's full JSON hash. Matching rows by ID
    // must not silently hide ordering-only differences from the diagnostic.
    const commonOldIds = [...oldRows.keys()].filter(id => newRows.has(id));
    const commonNewIds = [...newRows.keys()].filter(id => oldRows.has(id));
    let mask = same(commonOldIds, commonNewIds) ? 0 : 128;
    const metadata = ['policies', 'publication', 'members', 'schemaMemberships', 'membership', 'bucket', 'metadataStatus'];
    for (const id of new Set([...oldRows.keys(), ...newRows.keys()])) {
      const left = oldRows.get(id), right = newRows.get(id);
      if (!left || !right) { mask |= 1; continue; }
      if (same(left, right)) continue;
      let rowMask = 0;
      if (!same(left.relation?.aclHash, right.relation?.aclHash)) rowMask |= 2;
      const columns = values => {
        if (values === undefined) return new Map();
        if (!Array.isArray(values) || values.length > 20000) throw new Error();
        const rows = new Map();
        for (const value of values) {
          if (!value || typeof value.column !== 'string' || rows.has(value.column)) throw new Error();
          rows.set(value.column, value);
        }
        return rows;
      };
      const oldColumns = columns(left.columns), newColumns = columns(right.columns);
      if (!same([...oldColumns.keys()].filter(column => newColumns.has(column)),
        [...newColumns.keys()].filter(column => oldColumns.has(column)))) rowMask |= 128;
      for (const column of new Set([...oldColumns.keys(), ...newColumns.keys()])) {
        const oldColumn = oldColumns.get(column), newColumn = newColumns.get(column);
        if (!oldColumn || !newColumn) rowMask |= 32;
        else {
          if (!same(oldColumn.aclHash, newColumn.aclHash)) rowMask |= 4;
          if (!same(without(oldColumn, ['aclHash']), without(newColumn, ['aclHash']))) rowMask |= 32;
        }
      }
      if (!same(left.observedGrants, right.observedGrants)) rowMask |= 8;
      if (!same(left.routine, right.routine)) rowMask |= 16;
      if (!same(without(left.relation, ['aclHash']), without(right.relation, ['aclHash']))) rowMask |= 32;
      if (metadata.some(key => !same(left[key], right[key]))) rowMask |= 64;
      if (!same(without(left, ['relation', 'columns', 'observedGrants', 'routine', ...metadata]),
        without(right, ['relation', 'columns', 'observedGrants', 'routine', ...metadata]))) rowMask |= 128;
      // A changed but otherwise unclassified row (for example array order)
      // remains unknown even when another surface already set a known bit.
      mask |= rowMask || 128;
    }
    return mask;
  } catch { return 128; }
}
