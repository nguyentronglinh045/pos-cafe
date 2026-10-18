import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { createHash } from 'node:crypto';
import { FIXTURE_DRIFT_CODES, fixtureCatalogDriftMask, fixtureCleanupErrors, fixtureDriftCode,
  withFixtureCleanup } from './permission-fixture-diagnostics.mjs';
import { ci1SuiteDiagnostic, ci1SuiteFailureMarker, ci1SuiteFailureFacts } from './permission-ci1-diagnostics.mjs';
import { projectTestResults } from './permission-vitest-reporter.mjs';

const baseline = () => [{ surfaceId: 'SELECT:public.example', kind: 'SELECT',
  relation: { aclHash: 'old', rlsEnabled: true }, columns: [{ column: 'id', aclHash: 'old', type: 'uuid' }],
  observedGrants: [{ granted: false }], policies: [] }];
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

test('catalog diagnostic identifies each field without changing either snapshot or the strict hash', () => {
  const cases = [
    [2, value => { value[0].relation.aclHash = 'new'; }],
    [4, value => { value[0].columns[0].aclHash = 'new'; }],
    [8, value => { value[0].observedGrants[0].granted = true; }],
    [16, value => { value[0].routine = { bodyHash: 'new' }; }],
    [32, value => { value[0].columns[0].type = 'text'; }],
    [32, value => { value[0].relation.rlsEnabled = false; }],
    [64, value => { value[0].policies.push({ definition: 'PRIVATE_SECRET' }); }],
    [128, value => { value[0].unrecognized = 'PRIVATE_SECRET'; }],
    [1, value => { value.push({ surfaceId: 'RPC:public.new' }); }],
  ];
  for (const [expected, mutate] of cases) {
    const before = baseline(), after = structuredClone(before);
    mutate(after);
    const oldHash = hash(before), newHash = hash(after);
    assert.notEqual(oldHash, newHash);
    assert.equal(fixtureCatalogDriftMask(before, after), expected);
    assert.equal(hash(before), oldHash);
    assert.equal(hash(after), newHash);
  }
  assert.equal(fixtureCatalogDriftMask(baseline(), baseline()), 0);
  assert.equal(fixtureCatalogDriftMask(baseline(), []), 1);
  const mixed = baseline(); mixed[0].relation.aclHash = 'new'; mixed[0].columns[0].aclHash = 'new';
  mixed[0].observedGrants[0].granted = true;
  assert.equal(fixtureCatalogDriftMask(baseline(), mixed), 14);
  const oldRows = [...baseline(), { surfaceId: 'second', columns: [{ column: 'a' }, { column: 'b' }] }];
  const newRows = structuredClone(oldRows); newRows[0].relation.aclHash = 'new'; newRows[1].columns.reverse();
  assert.equal(fixtureCatalogDriftMask(oldRows, newRows), 130);
  const duplicateKind = [...baseline(), { ...baseline()[0], surfaceId: 'DML:public.example' }];
  const aclChanged = structuredClone(duplicateKind);
  aclChanged.forEach(value => { value.relation.aclHash = 'new'; });
  assert.equal(fixtureCatalogDriftMask(duplicateKind, aclChanged), 2);
  const oneRow = [{ ...baseline()[0], columns: [{ column: 'a' }, { column: 'b' }] }];
  const aclAndOrder = structuredClone(oneRow);
  aclAndOrder[0].relation.aclHash = 'new'; aclAndOrder[0].columns.reverse();
  assert.equal(fixtureCatalogDriftMask(oneRow, aclAndOrder), 130);
  assert.equal(fixtureCatalogDriftMask(duplicateKind, [...duplicateKind].reverse()), 128);
  assert.notEqual(hash(duplicateKind), hash([...duplicateKind].reverse()));
});

test('diagnostic input is bounded and never turns malformed input into a success assertion', () => {
  for (const value of [null, {}, [null], [{ surfaceId: 'x' }, { surfaceId: 'x' }], Array(20001).fill({ surfaceId: 'x' })])
    assert.equal(fixtureCatalogDriftMask(baseline(), value), 128);
  const duplicateColumn = baseline(); duplicateColumn[0].columns.push({ column: 'id' });
  assert.equal(fixtureCatalogDriftMask(baseline(), duplicateColumn), 128);
  for (const mask of [-1, 0, 256, NaN, '2', 2.1, 'PRIVATE_SECRET'])
    assert.equal(fixtureDriftCode({ message: 'IDENTITY_CATALOG_DRIFT', permissionCatalogDriftMask: mask }), 'IDENTITY_CATALOG_DRIFT');
  assert.equal(fixtureDriftCode({ message: 'READ_FIXTURE_DRIFT: PRIVATE_SECRET' }), 'READ_FIXTURE_DRIFT');
  assert.equal(fixtureDriftCode({ message: 'PRIVATE_SECRET' }), null);
});

test('cleanup preserves primary and nested finalizer errors and always runs finalization', async () => {
  const body = new Error('READ_FIXTURE_DRIFT: PRIVATE_SECRET');
  const identity = Object.assign(new Error('IDENTITY_CATALOG_DRIFT'), { permissionCatalogDriftMask: 2 });
  const financial = new Error('FINANCIAL_FIXTURE_DRIFT');
  const order = [];
  await assert.rejects(withFixtureCleanup(async () => { order.push('read'); throw body; }, async () => {
    await withFixtureCleanup(async () => { order.push('financial'); throw financial; }, async () => { order.push('identity'); throw identity; });
  }), error => {
    assert.deepEqual(fixtureCleanupErrors(error), [body, financial, identity]);
    return true;
  });
  assert.deepEqual(order, ['read', 'financial', 'identity']);
  await withFixtureCleanup(async () => {}, async () => {});
  await assert.rejects(withFixtureCleanup(async () => { throw body; }, async () => {}), error => error === body);
  const cycle = new AggregateError([], 'FIXTURE_CLEANUP_FAILED'); cycle.errors.push(cycle);
  assert.deepEqual(fixtureCleanupErrors(cycle), [undefined]);
});

test('actual read and financial cleanup bodies retain both errors from the existing teardown sequence', async () => {
  for (const [file, functionName, first, last] of [
    ['permissionReadFixture.ts', 'cleanupReadFixture', 'resetReadFixture', 'cleanupFinancialFixture'],
    ['permissionFinancialFixture.ts', 'cleanupFinancialFixture', 'resetFinancialFixture', 'cleanupIdentityFixture'],
    ['permissionIdentityFixture.ts', 'cleanupIdentityFixture', 'resetIdentityFixture', 'end'],
  ]) {
    const source = readFileSync(new URL(`../tests/contracts/${file}`, import.meta.url), 'utf8');
    const start = source.indexOf(`export async function ${functionName}()`);
    const next = source.indexOf('\nexport async function ', start + 1);
    const body = source.slice(start, next === -1 ? undefined : next).replace('export ', '');
    const primary = new Error('primary'), finalizer = new Error('finalizer');
    const cleanup = runInNewContext(`${body}\n${functionName}`, { staged: true, createdLegacyView: false,
      withFixtureCleanup, db: { query: async () => {}, end: async () => { throw finalizer; } },
      [first]: async () => { throw primary; }, [last]: async () => { throw finalizer; } });
    await assert.rejects(cleanup(), error => {
      assert.deepEqual(fixtureCleanupErrors(error), [primary, finalizer]); return true;
    });
  }
});

test('actual identity semantic fingerprint still rejects ACL, routine and grant drift', async () => {
  const source = readFileSync(new URL('../tests/contracts/permissionIdentityFixture.ts', import.meta.url), 'utf8');
  const start = source.indexOf('async function semanticCatalogHash()');
  const body = source.slice(start, source.indexOf('export const fixtureEvidence', start));
  for (const mutate of [value => { value[0].relation.aclHash = 'new'; },
    value => { value[0].routine = { bodyHash: 'new' }; },
    value => { value[0].observedGrants[0].granted = true; }]) {
    const before = baseline(), after = structuredClone(before); mutate(after);
    const snapshots = [before, after];
    const semanticHash = runInNewContext(`let catalogSurfacesCurrent; ${body}; semanticCatalogHash`, {
      db: {}, digest: hash, collectInventory: async () => ({ surfaces: snapshots.shift() }),
    });
    assert.notEqual(await semanticHash(), await semanticHash());
  }
});

test('identity table ACL snapshot and restore retain catalog-only privileges and grant options', async () => {
  const source = readFileSync(new URL('../tests/contracts/permissionIdentityFixture.ts', import.meta.url), 'utf8');
  const capture = source.match(/employeeAcl = \(await db\.query\([\s\S]*?\)\)\.rows;/)?.[0];
  const restore = source.match(/for \(const a of employeeAcl\) await db\.query\([^\n]+/)?.[0];
  assert.ok(capture); assert.ok(restore);
  const privileges = ['INSERT', 'SELECT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER', 'MAINTAIN'];
  const catalogRows = privileges.map(privilege => ({ grantee: 'service_role', privilege, grantable: privilege === 'SELECT' }));
  const commands = [];
  const exercise = runInNewContext(`(async () => { let employeeAcl; ${capture}\n${restore}\nreturn employeeAcl; })`, {
    q: value => '"' + value.replaceAll('"', '""') + '"',
    db: { query: async sql => {
      if (sql.startsWith('grant ')) { commands.push(sql); return {}; }
      // Model the documented PostgreSQL 17 view omission. This is a unit
      // regression for the actual capture/restore code, not a DB execution.
      if (sql.includes('information_schema.role_table_grants')) return { rows: catalogRows.filter(row => row.privilege !== 'MAINTAIN') };
      assert.match(sql, /aclexplode\(coalesce\(c\.relacl,acldefault\('r',c\.relowner\)\)\)/);
      assert.match(sql, /a\.is_grantable grantable/);
      assert.match(sql, /c\.oid='public\.employees'::regclass/);
      assert.match(sql, /r\.rolname in \('anon','authenticated','service_role'\)/);
      return { rows: catalogRows };
    } },
  });
  assert.deepEqual(await exercise(), catalogRows);
  assert.equal(commands.length, 8);
  assert.ok(commands.includes('grant MAINTAIN on public.employees to "service_role"'));
  assert.ok(commands.includes('grant SELECT on public.employees to "service_role" with grant option'));
  assert.equal(commands.filter(sql => sql.endsWith(' with grant option')).length, 1);
  assert.ok(!commands.some(sql => /grant all/i.test(sql)));
});

test('all catalog masks cross the finite reporter and marker boundary without private values or changing failure', () => {
  for (let mask = 1; mask <= 255; mask++) {
    const code = fixtureDriftCode({ message: 'IDENTITY_CATALOG_DRIFT', permissionCatalogDriftMask: mask });
    assert.ok(FIXTURE_DRIFT_CODES.includes(code));
    const error = { message: 'PRIVATE_SECRET', permissionCleanupDiagnostics: [
      { phase: 'read-fixture', step: 'cleanup-read', code: 'READ_FIXTURE_DRIFT', raw: 'PRIVATE_SECRET' },
      { phase: 'read-fixture', step: 'cleanup-read', code, raw: 'PRIVATE_SECRET' },
    ] };
    const modules = [{ moduleId: 'known-test', errors: () => [error], children: {
      allSuites: () => [], allTests: () => [{ fullName: 'known', result: () => ({ state: 'passed' }) }],
    } }];
    const report = projectTestResults(modules, [], 'failed');
    assert.equal(report.success, false); assert.equal(report.hookErrorCount, 1);
    assert.equal(report.hookErrors.length, 2);
    const diagnostic = ci1SuiteDiagnostic(modules, []);
    const marker = ci1SuiteFailureMarker('T09', { hookErrorCount: 1, errorCount: 0, diagnostic });
    const facts = ci1SuiteFailureFacts(marker);
    assert.equal(facts.suiteCleanupCodeOrdinal, 23 + mask);
    assert.ok(!JSON.stringify({ report, marker, facts }).includes('PRIVATE_SECRET'));
  }
});
