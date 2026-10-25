import assert from 'node:assert/strict';
import test from 'node:test';
import { statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { HP1_EXECUTION_ENABLED, requireHp1ExecutionEnabled, runHostedLogicalBackup } from './permission-hosted-backup.mjs';

test('HP1 admission is disabled without an environment override', () => {
  assert.equal(HP1_EXECUTION_ENABLED, false);
  assert.throws(requireHp1ExecutionEnabled, { code: 'HOSTED_ACTION_UNAUTHORIZED' });
});

test('HP1 producer rejects before accessing config, options or injected runtime', async () => {
  let accesses = 0;
  const forbidden = new Proxy({}, { get() { accesses++; throw new Error('MUST_NOT_ACCESS'); } });
  await assert.rejects(runHostedLogicalBackup(forbidden, forbidden), { code: 'HOSTED_ACTION_UNAUTHORIZED' });
  assert.equal(accesses, 0);
});

test('HP1 CLI rejects before trying to read any config or start a runtime', () => {
  const producer = fileURLToPath(new URL('./permission-hosted-backup.mjs', import.meta.url));
  assert.equal(statSync(producer).isFile(), true);
  // A child of this verified regular file cannot be a readable config, even if admission regresses.
  const result = spawnSync(process.execPath, [producer, '--local-config', `${producer}/missing-config.json`],
    { encoding: 'utf8', timeout: 10000, maxBuffer: 65536 });
  assert.equal(result.error, undefined);
  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr.trim(), 'HOSTED_ACTION_UNAUTHORIZED');
});
