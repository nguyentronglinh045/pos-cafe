import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { assertPortFree, stopDevServer } from './runtime.mjs';

const filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(filename), '..');
const marker = 'UI_AUDIT_WATCH_RESULT ';
const bounded = (promise, ms, detail) => new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error(detail)), ms);
  promise.then(value => { clearTimeout(timer); resolve(value); }, error => { clearTimeout(timer); reject(error); });
});

async function worker() {
  const fixture = process.argv[3];
  let server, result = { status: 'FAIL', closed: false };
  try {
    const { createServer } = await import('vite');
    server = await createServer({ root, configFile: path.join(root, 'vite.config.ts'),
      cacheDir: path.join(fixture, 'vite-cache'), logLevel: 'silent',
      server: { host: '127.0.0.1', port: 0, strictPort: true, hmr: false } });
    // Chokidar can finish its initial scan before createServer returns. Its
    // emitted-ready flag avoids waiting for an event that already happened.
    const ready = server.watcher._readyEmitted ? Promise.resolve() : new Promise(resolve => server.watcher.once('ready', resolve));
    await bounded(Promise.all([server.listen(), ready]), 5000, 'VITE_WATCH_STARTUP_TIMEOUT');
    const address = server.httpServer.address();
    assert(address && typeof address === 'object' && address.port > 0);
    const origin = `http://127.0.0.1:${address.port}`;
    const response = await fetch(origin, { signal: AbortSignal.timeout(2000) });
    assert.equal(response.status, 200);
    assert.match(await response.text(), /\/src\/main\.tsx/);
    const watched = server.watcher.getWatched();
    const watchedPaths = Object.entries(watched).flatMap(([directory, entries]) => [directory, ...entries.map(entry => path.join(directory, entry))]);
    const generated = watchedPaths.filter(full => /\/artifacts(?:\/|$)|\/ui-audit\/out(?:\/|$)|\/ui-audit\/report\.(json|md)$/.test(full.replaceAll('\\', '/')));
    assert.deepEqual(generated, [], 'generated artifacts/root-backlinks must never enter the live watcher');
    assert(watchedPaths.some(full => path.resolve(full) === path.join(root, 'src', 'main.tsx')), 'real application source remains watched');
    result = { status: 'PASS', closed: false, origin, watchedPathCount: watchedPaths.length,
      generatedWatchCount: generated.length, fixture };
  } catch (error) { result.error = String(error.message || error).slice(0, 1000); }
  finally {
    try { await bounded(server?.close() || Promise.resolve(), 3000, 'VITE_WATCH_CLOSE_TIMEOUT'); result.closed = true; }
    catch (error) { result.status = 'FAIL'; result.error = String(error.message || error).slice(0, 1000); }
  }
  console.log(marker + JSON.stringify(result));
  process.exitCode = result.status === 'PASS' ? 0 : 1;
}

if (process.argv[2] === '--watch-fixture-worker') {
  await worker();
} else {
  test('real Vite excludes a retained root-backlink fixture while serving and watching app source', { timeout: 16000 }, async t => {
    const fixture = path.join(root, 'artifacts', 'ui-audit', `watch-test-${randomUUID()}`);
    fs.mkdirSync(fixture, { recursive: true });
    fs.symlinkSync(root, path.join(fixture, 'escape'), process.platform === 'win32' ? 'junction' : 'dir');
    // A bounded child contains regressions that recursively follow the backlink.
    // Retain the tiny fixture/cache: cleanup requires separate owner permission.
    const child = spawn(process.execPath, [filename, '--watch-fixture-worker', fixture], {
      cwd: root, env: { ...process.env, VITE_DATA_MODE: 'mock', VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '' },
      stdio: ['ignore', 'pipe', 'pipe'], detached: process.platform !== 'win32', windowsHide: true,
    });
    let output = '', stderr = '';
    child.stdout.on('data', chunk => { output = (output + String(chunk)).slice(-128 * 1024); });
    child.stderr.on('data', chunk => { stderr = (stderr + String(chunk)).slice(-4096); });
    try {
      const code = await bounded(new Promise((resolve, reject) => {
        child.once('error', reject); child.once('exit', resolve);
      }), 11000, 'VITE_WATCH_WORKER_TIMEOUT');
      assert.equal(code, 0, output + stderr);
      const line = output.split(/\r?\n/).find(item => item.startsWith(marker));
      assert(line, 'worker must return a completed observation');
      const result = JSON.parse(line.slice(marker.length));
      assert.equal(result.status, 'PASS');
      assert.equal(result.closed, true);
      assert.equal(result.generatedWatchCount, 0);
      assert(result.watchedPathCount > 0);
      await assertPortFree(result.origin);
      t.diagnostic(`Retained watcher fixture: ${fixture}; root backlink + bounded Vite cache; watched paths ${result.watchedPathCount}.`);
    } finally { await stopDevServer(child); }
  });
}
