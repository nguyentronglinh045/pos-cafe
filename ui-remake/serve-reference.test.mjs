import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdir, symlink, writeFile } from 'node:fs/promises';
import { request } from 'node:http';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { startReferenceServer } from './serve-reference.mjs';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function get(origin, path, method = 'GET') {
  return new Promise((resolveRequest, rejectRequest) => {
    const url = new URL(origin);
    const outgoing = request({
      hostname: url.hostname, port: url.port, path, method, agent: false,
    }, (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolveRequest({
        status: response.statusCode, headers: response.headers, body: Buffer.concat(chunks),
      }));
      response.on('error', rejectRequest);
    });
    outgoing.setTimeout(2_000, () => outgoing.destroy(new Error('Local request timed out')));
    outgoing.on('error', rejectRequest);
    outgoing.end();
  });
}

async function rejectsStart(options, expected) {
  let server;
  try {
    await assert.rejects(async () => { server = await startReferenceServer(options); }, expected);
  } finally {
    await server?.close();
  }
}

test('reference server serves bounded local exports and rejects unsafe access', async (t) => {
  const fixture = join(repositoryRoot, 'artifacts', 'stitch', `server-test-${randomUUID()}`);
  const rootDirectory = join(fixture, 'public');
  const html = '<h1>Stitch reference</h1>\n';
  const files = {
    'index.html': html,
    'main.css': 'h1 { color: #123456; }\n',
    'app.mjs': 'globalThis.__referenceServerMustNotExecute__ = true;\n',
    'data.json': '{"ok":true}\n',
    'font.ttf': Buffer.from([0, 1, 2, 3]),
    'oversized.css': 'x'.repeat(100),
    'notes.txt': 'not an allowed asset\n',
    '.secret.html': 'hidden\n',
    '.hidden/secret.html': 'hidden through alias\n',
  };
  await mkdir(join(rootDirectory, '.hidden'), { recursive: true });
  for (const [name, content] of Object.entries(files)) await writeFile(join(rootDirectory, name), content);
  // A Windows directory junction needs no file-symlink privilege. Both links are
  // retained with the tiny fixture: there is deliberately no cleanup authority.
  const linkType = process.platform === 'win32' ? 'junction' : 'dir';
  await symlink(repositoryRoot, join(rootDirectory, 'escape'), linkType);
  await symlink(join(rootDirectory, '.hidden'), join(rootDirectory, 'hidden-alias'), linkType);
  const logicalBytes = Object.values(files).reduce((sum, value) => sum + Buffer.byteLength(value), 0);
  assert.ok(logicalBytes <= 10 * 1024);
  t.diagnostic(`Retained fixture: ${fixture}; ${Object.keys(files).length} files, ${logicalBytes} logical bytes, 2 directory links.`);

  const server = await startReferenceServer({ rootDirectory, repositoryRoot, port: 0, maxFileBytes: 64 });
  try {
    await t.test('binds loopback and serves exact HTML with no cache or HTML CORS grant', async () => {
      assert.match(server.origin, /^http:\/\/127\.0\.0\.1:\d+$/);
      const result = await get(server.origin, '/index.html?preview=1');
      assert.equal(result.status, 200);
      assert.equal(result.body.toString(), html);
      assert.equal(result.headers['content-type'], 'text/html; charset=utf-8');
      assert.equal(result.headers['content-length'], String(Buffer.byteLength(html)));
      assert.equal(result.headers['cache-control'], 'no-store');
      assert.equal(result.headers['access-control-allow-origin'], undefined);
    });

    await t.test('HEAD sends headers without a body', async () => {
      const result = await get(server.origin, '/index.html', 'HEAD');
      assert.equal(result.status, 200);
      assert.equal(result.body.length, 0);
      assert.equal(result.headers['content-length'], String(Buffer.byteLength(html)));
    });

    await t.test('serves CSS, JavaScript, JSON and font MIME types without executing JavaScript', async () => {
      for (const [path, mime] of [
        ['/main.css', 'text/css; charset=utf-8'],
        ['/app.mjs', 'text/javascript; charset=utf-8'],
        ['/data.json', 'application/json; charset=utf-8'],
        ['/font.ttf', 'font/ttf'],
      ]) {
        const result = await get(server.origin, path);
        assert.equal(result.status, 200, path);
        assert.equal(result.headers['content-type'], mime, path);
        assert.equal(result.headers['access-control-allow-origin'], path === '/font.ttf' ? '*' : undefined);
      }
      assert.equal(globalThis.__referenceServerMustNotExecute__, undefined);
    });

    await t.test('rejects methods that could change state', async () => {
      for (const method of ['POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']) {
        const result = await get(server.origin, '/index.html', method);
        assert.equal(result.status, 405, method);
        assert.equal(result.headers.allow, 'GET, HEAD');
        assert.ok(result.body.length < 100);
      }
    });

    await t.test('never lists directories or serves unsupported or missing files', async () => {
      for (const path of ['/', '/.hidden', '/notes.txt', '/missing.html']) {
        const result = await get(server.origin, path);
        assert.equal(result.status, path === '/.hidden' ? 403 : 404, path);
        assert.ok(result.body.length < 100);
      }
    });

    await t.test('rejects traversal, hidden paths, malformed escapes and Windows path tricks', async () => {
      for (const [path, status] of [
        ['/../package.json', 403], ['/%2e%2e/package.json', 403],
        ['/%2e%2e%2fpackage.json', 403], ['/foo/../index.html', 403],
        ['/.secret.html', 403], ['/%2esecret.html', 403],
        ['/index.html:secret', 403], ['/%5cindex.html', 403],
        ['/%00index.html', 400], ['/%ZZ', 400],
        ['http://example.test/index.html', 400],
      ]) {
        const result = await get(server.origin, path);
        assert.equal(result.status, status, path);
        assert.ok(result.body.length < 100);
      }
    });

    await t.test('physical path checks block symlink escape and aliases to hidden files', async () => {
      assert.equal((await get(server.origin, '/escape/package.json')).status, 403);
      assert.equal((await get(server.origin, '/hidden-alias/secret.html')).status, 403);
      await rejectsStart({ rootDirectory: join(rootDirectory, 'escape'), repositoryRoot, port: 0 }, /physically inside/);
    });

    await t.test('enforces the lowered file cap for GET and HEAD with bounded errors', async () => {
      for (const method of ['GET', 'HEAD']) {
        const result = await get(server.origin, '/oversized.css', method);
        assert.equal(result.status, 413);
        assert.equal(result.headers['cache-control'], 'no-store');
        assert.ok(result.body.length < 100);
      }
    });

    await t.test('startup rejects roots outside the export area and invalid port/file limits', async () => {
      await rejectsStart({ rootDirectory: repositoryRoot, repositoryRoot, port: 0 }, /physically inside/);
      await rejectsStart({ rootDirectory: join(rootDirectory, 'index.html'), repositoryRoot, port: 0 }, /directory/);
      await rejectsStart({ repositoryRoot, port: 0 }, /required/);
      for (const port of [1, 1023, 65536, 1.5, NaN, '4174']) {
        await rejectsStart({ rootDirectory, repositoryRoot, port }, /port/);
      }
      for (const maxFileBytes of [0, -1, 16 * 1024 * 1024 + 1, NaN]) {
        await rejectsStart({ rootDirectory, repositoryRoot, port: 0, maxFileBytes }, /maxFileBytes/);
      }
    });
  } finally {
    await server.close();
  }
  // Closure is idempotent, and the listener no longer accepts connections.
  await server.close();
  await assert.rejects(get(server.origin, '/index.html'), /ECONNREFUSED/);
});
