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
const progressMarker = 'UI_AUDIT_WATCH_STAGE ';
const controlMarker = 'PROJECT_UI_WATCH_CONTROL ';
const freshFacts = () => ({ version: 1, stage: 0, failureStage: 0, httpStatus: 0, generatedWatchCount: 0,
  appSourceWatched: 0, watchedPathCount: 0, closed: 0, exitOrdinal: 0, exitCode: 0, timeoutOrdinal: 0 });
const bounded = (promise, ms, detail) => new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error(detail)), ms);
  promise.then(value => { clearTimeout(timer); resolve(value); }, error => { clearTimeout(timer); reject(error); });
});

async function worker() {
  const fixture = process.argv[3];
  const facts = freshFacts();
  const stage = value => { facts.stage = value; console.log(progressMarker + JSON.stringify(facts)); };
  let server, result = { status: 'FAIL', closed: false };
  try {
    stage(1);
    const { createServer } = await import('vite');
    stage(2);
    server = await createServer({ root, configFile: path.join(root, 'vite.config.ts'),
      cacheDir: path.join(fixture, 'vite-cache'), logLevel: 'silent',
      server: { host: '127.0.0.1', port: 0, strictPort: true, hmr: false } });
    // Chokidar can finish its initial scan before createServer returns. Its
    // emitted-ready flag avoids waiting for an event that already happened.
    const ready = server.watcher._readyEmitted ? Promise.resolve() : new Promise(resolve => server.watcher.once('ready', resolve));
    stage(3);
    await bounded(Promise.all([server.listen(), ready]), 5000, 'VITE_WATCH_STARTUP_TIMEOUT');
    const address = server.httpServer.address();
    assert(address && typeof address === 'object' && address.port > 0);
    const origin = `http://127.0.0.1:${address.port}`;
    stage(4);
    const httpDeadline = Date.now() + 2000;
    const signal = AbortSignal.timeout(2000);
    const response = await fetch(origin, { signal });
    facts.httpStatus = response.status;
    assert.equal(response.status, 200);
    assert.match(await response.text(), /\/src\/main\.tsx/);
    // Fetch the real application module as a browser bootstrap does. An HTML
    // response alone need not register its script in every watcher version.
    const entry = await fetch(`${origin}/src/main.tsx`, { signal });
    facts.httpStatus = entry.status;
    assert.equal(entry.status, 200);
    assert.match(entry.headers.get('content-type') || '', /(?:text|application)\/javascript\b/i);
    const javascript = await entry.text();
    assert.match(javascript, /\bcreateRoot\b/);
    assert.match(javascript, /\bAppProviders\b/);
    stage(5);
    const readWatchedPaths = () => Object.entries(server.watcher.getWatched())
      .flatMap(([directory, entries]) => [directory, ...entries.map(entry => path.join(directory, entry))]);
    const appSourceWatched = paths => paths.some(full => path.resolve(full) === path.join(root, 'src', 'main.tsx'));
    let watchedPaths = readWatchedPaths();
    // Asynchronous registration shares the original HTTP budget; no new wait
    // allowance is introduced after the HTML and module requests.
    while (!appSourceWatched(watchedPaths) && Date.now() < httpDeadline && !signal.aborted) {
      await new Promise(resolve => setTimeout(resolve, Math.min(25, Math.max(1, httpDeadline - Date.now()))));
      watchedPaths = readWatchedPaths();
    }
    const generated = watchedPaths.filter(full => /\/artifacts(?:\/|$)|\/ui-audit\/out(?:\/|$)|\/ui-audit\/report\.(json|md)$/.test(full.replaceAll('\\', '/')));
    facts.watchedPathCount = Math.min(watchedPaths.length, 1000000);
    facts.generatedWatchCount = Math.min(generated.length, 1000000);
    facts.appSourceWatched = Number(appSourceWatched(watchedPaths));
    assert.deepEqual(generated, [], 'generated artifacts/root-backlinks must never enter the live watcher');
    assert(appSourceWatched(watchedPaths), 'real application source remains watched');
    result = { status: 'PASS', closed: false, origin, watchedPathCount: watchedPaths.length,
      generatedWatchCount: generated.length, fixture };
  } catch (error) {
    facts.failureStage = facts.stage;
    if (error.message === 'VITE_WATCH_STARTUP_TIMEOUT') facts.timeoutOrdinal = 1;
    result.error = String(error.message || error).slice(0, 1000);
  }
  finally {
    stage(6);
    try { await bounded(server?.close() || Promise.resolve(), 3000, 'VITE_WATCH_CLOSE_TIMEOUT'); result.closed = true; facts.closed = 1; }
    catch (error) {
      facts.failureStage = 6;
      if (error.message === 'VITE_WATCH_CLOSE_TIMEOUT') facts.timeoutOrdinal = 2;
      result.status = 'FAIL'; result.error = String(error.message || error).slice(0, 1000);
    }
  }
  result.facts = facts;
  stage(6); // Preserve completed cleanup even if another handle delays process exit.
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
    let output = '', stderr = '', facts = freshFacts();
    child.stdout.on('data', chunk => {
      output = (output + String(chunk)).slice(-128 * 1024);
      for (const line of output.split(/\r?\n/).filter(value => value.startsWith(progressMarker))) {
        try { const observed = JSON.parse(line.slice(progressMarker.length));
          for (const key of Object.keys(facts)) if (Number.isSafeInteger(observed[key]) && observed[key] >= 0 && observed[key] <= 1000000) facts[key] = observed[key];
        } catch { /* A partial line is observed again with the next chunk. */ }
      }
    });
    child.stderr.on('data', chunk => { stderr = (stderr + String(chunk)).slice(-4096); });
    try {
      const code = await bounded(new Promise((resolve, reject) => {
        child.once('error', reject); child.once('exit', resolve);
      }), 11000, 'VITE_WATCH_WORKER_TIMEOUT');
      facts.exitOrdinal = code === 0 ? 1 : Number.isInteger(code) ? 2 : 3;
      facts.exitCode = Number.isInteger(code) && code >= 0 && code <= 255 ? code : 0;
      assert.equal(code, 0, output + stderr);
      const line = output.split(/\r?\n/).find(item => item.startsWith(marker));
      assert(line, 'worker must return a completed observation');
      const result = JSON.parse(line.slice(marker.length));
      assert.equal(result.status, 'PASS');
      assert.equal(result.closed, true);
      assert.equal(result.generatedWatchCount, 0);
      assert(result.watchedPathCount > 0);
      facts.stage = 7;
      await assertPortFree(result.origin);
      t.diagnostic(`Retained watcher fixture: ${fixture}; root backlink + bounded Vite cache; watched paths ${result.watchedPathCount}.`);
    } catch (error) {
      if (error.message === 'VITE_WATCH_WORKER_TIMEOUT') { facts.exitOrdinal = 4; facts.timeoutOrdinal = 3; }
      else if (facts.exitOrdinal === 0) facts.exitOrdinal = 5;
      facts.failureStage ||= facts.stage;
      // Finite facts only. Paths, error strings and worker stdout stay private.
      console.log(controlMarker + JSON.stringify(facts));
      throw error;
    } finally { await stopDevServer(child); }
  });
}
