import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

// Evaluate the actual routing function with a process adapter that only records
// argv. Loading this test never imports pg, invokes WSL or starts a service.
const source = readFileSync(new URL('./permission-bridge-runtime.mjs', import.meta.url), 'utf8');
const start = source.indexOf('const wsl = args => '), end = source.indexOf('\nconst configHash', start);
assert.ok(start >= 0 && end > start, 'Bridge command adapter must remain identifiable');
const adapter = source.slice(start, end);

for (const platform of ['linux', 'win32']) test(`T02 command routing on ${platform} preserves argv and bounded process options`, () => {
  const calls = [];
  const invoke = runInNewContext(adapter + '\nwsl', {
    process: { platform },
    execFileSync: (command, args, options) => { calls.push({ command, args: Array.from(args), options: { ...options } }); return 'fixture-output'; },
  });
  const argv = ['docker', 'inspect', 'supabase_db_pos-cafe-perm-s31-t02-20261013'];
  assert.equal(invoke(argv), 'fixture-output');
  assert.deepEqual(calls, [{ command: platform === 'linux' ? 'docker' : 'wsl',
    args: platform === 'linux' ? argv.slice(1) : ['-d', 'Ubuntu-24.04', '--', ...argv],
    options: { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024, timeout: 30000 } }]);
  assert.deepEqual(argv, ['docker', 'inspect', 'supabase_db_pos-cafe-perm-s31-t02-20261013']);
});

test('native T02 CLI path and arguments remain literal without shell interpolation', () => {
  let call;
  const invoke = runInNewContext(adapter + '\nwsl', { process: { platform: 'linux' },
    execFileSync: (...args) => { call = args; return '2.117.0\n'; } });
  const root = '/var/tmp/pos-cafe-perm-s31-t02-20261013';
  assert.equal(invoke([root + '/bin/supabase', '--workdir', root + '/stack', '--version']), '2.117.0\n');
  assert.equal(call[0], root + '/bin/supabase');
  assert.deepEqual(Array.from(call[1]), ['--workdir', root + '/stack', '--version']);
  assert.equal(call[2].shell, undefined);
});
