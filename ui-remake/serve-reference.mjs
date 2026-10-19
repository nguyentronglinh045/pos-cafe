import { createServer } from 'node:http';
import { open, realpath, stat } from 'node:fs/promises';
import { dirname, extname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_REPOSITORY_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MAX_FILE_BYTES = 16 * 1024 * 1024;
const FONT_EXTENSIONS = new Set(['.woff', '.woff2', '.ttf', '.otf']);
const MIME_TYPES = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.svg', 'image/svg+xml'],
  ['.webp', 'image/webp'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
  ['.ttf', 'font/ttf'],
  ['.otf', 'font/otf'],
]);
const ERROR_TEXT = new Map([
  [400, 'Bad request\n'],
  [403, 'Forbidden\n'],
  [404, 'Not found\n'],
  [405, 'Method not allowed\n'],
  [409, 'File changed; retry\n'],
  [413, 'File too large\n'],
  [500, 'Internal server error\n'],
]);

function inside(root, target) {
  const pathFromRoot = relative(root, target);
  return pathFromRoot === '' || (!isAbsolute(pathFromRoot)
    && pathFromRoot !== '..' && !pathFromRoot.startsWith(`..${sep}`));
}

function fail(response, method, status) {
  const body = ERROR_TEXT.get(status);
  response.writeHead(status, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...(status === 405 ? { Allow: 'GET, HEAD' } : {}),
  });
  response.end(method === 'HEAD' ? undefined : body);
}

function requestPath(rawUrl) {
  if (typeof rawUrl !== 'string' || !rawUrl.startsWith('/')) return { status: 400 };
  let decoded;
  try {
    decoded = decodeURIComponent(rawUrl.split(/[?#]/, 1)[0]);
  } catch {
    return { status: 400 };
  }
  if (/[\x00-\x1f\x7f]/.test(decoded)) return { status: 400 };
  // Backslashes, drive prefixes, and Windows alternate data streams are not URLs
  // this server accepts. Check dot segments before filesystem normalization.
  if (/[\\:*?"<>|]/.test(decoded)) return { status: 403 };
  const segments = decoded.split('/').filter(Boolean);
  if (segments.some((segment) => segment.startsWith('.'))) return { status: 403 };
  return { segments };
}

async function readStableFile(file, size, maxFileBytes) {
  const data = Buffer.alloc(size);
  let offset = 0;
  while (offset < size) {
    const { bytesRead } = await file.read(data, offset, size - offset, offset);
    if (bytesRead === 0) return { status: 409 };
    offset += bytesRead;
  }
  // Never read an unbounded stream if an exported asset grows after its stat.
  const { bytesRead } = await file.read(Buffer.alloc(1), 0, 1, offset);
  if (bytesRead !== 0) return { status: size >= maxFileBytes ? 413 : 409 };
  return { data };
}

/**
 * Serve an existing local export, read-only, on 127.0.0.1. Physical roots must be
 * under repositoryRoot/artifacts/stitch; symlinks cannot grant wider access.
 * maxFileBytes can only lower the 16 MiB cap (useful for bounded tests).
 */
export async function startReferenceServer({
  rootDirectory,
  port = 4174,
  repositoryRoot = DEFAULT_REPOSITORY_ROOT,
  maxFileBytes = MAX_FILE_BYTES,
} = {}) {
  if (typeof rootDirectory !== 'string' || rootDirectory.trim() === '') {
    throw new TypeError('rootDirectory is required');
  }
  if (typeof repositoryRoot !== 'string' || repositoryRoot.trim() === '') {
    throw new TypeError('repositoryRoot must be a directory path');
  }
  if (!Number.isSafeInteger(port) || (port !== 0 && (port < 1024 || port > 65535))) {
    throw new RangeError('port must be 0 for tests, or an integer from 1024 to 65535');
  }
  if (!Number.isSafeInteger(maxFileBytes) || maxFileBytes < 1 || maxFileBytes > MAX_FILE_BYTES) {
    throw new RangeError(`maxFileBytes must be an integer from 1 to ${MAX_FILE_BYTES}`);
  }
  const physicalRepositoryRoot = await realpath(resolve(repositoryRoot));
  const allowedRoot = join(physicalRepositoryRoot, 'artifacts', 'stitch');
  const physicalRoot = await realpath(resolve(physicalRepositoryRoot, rootDirectory));
  if (!inside(allowedRoot, physicalRoot)) {
    throw new RangeError('Reference root must be physically inside repositoryRoot/artifacts/stitch');
  }
  if (!(await stat(physicalRoot)).isDirectory()) {
    throw new TypeError('rootDirectory must be a directory');
  }

  const server = createServer(async (request, response) => {
    const method = request.method;
    if (method !== 'GET' && method !== 'HEAD') {
      fail(response, method, 405);
      return;
    }
    const parsed = requestPath(request.url);
    if (parsed.status) {
      fail(response, method, parsed.status);
      return;
    }
    const candidate = resolve(physicalRoot, ...parsed.segments);
    if (!inside(physicalRoot, candidate)) {
      fail(response, method, 403);
      return;
    }
    if (!MIME_TYPES.has(extname(candidate).toLowerCase())) {
      fail(response, method, 404);
      return;
    }
    let file;
    try {
      const physicalFile = await realpath(candidate);
      if (!inside(physicalRoot, physicalFile)
        || relative(physicalRoot, physicalFile).split(sep).some((segment) => segment.startsWith('.'))) {
        fail(response, method, 403);
        return;
      }
      const extension = extname(physicalFile).toLowerCase();
      if (!MIME_TYPES.has(extension)) {
        fail(response, method, 404);
        return;
      }
      file = await open(physicalFile, 'r');
      const metadata = await file.stat();
      if (!metadata.isFile()) {
        fail(response, method, 404);
        return;
      }
      if (metadata.size > maxFileBytes) {
        fail(response, method, 413);
        return;
      }
      let data;
      if (method === 'GET') {
        const result = await readStableFile(file, metadata.size, maxFileBytes);
        if (result.status) {
          fail(response, method, result.status);
          return;
        }
        data = result.data;
      }
      response.writeHead(200, {
        'Content-Type': MIME_TYPES.get(extension),
        'Content-Length': metadata.size,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
        ...(FONT_EXTENSIONS.has(extension) ? { 'Access-Control-Allow-Origin': '*' } : {}),
      });
      response.end(data);
    } catch (error) {
      if (!response.headersSent) {
        const status = ['ENOENT', 'ENOTDIR', 'EISDIR'].includes(error.code) ? 404
          : ['EACCES', 'EPERM', 'ELOOP'].includes(error.code) ? 403 : 500;
        fail(response, method, status);
      } else {
        response.destroy();
      }
    } finally {
      if (file) await file.close();
    }
  });
  server.requestTimeout = 15_000;
  server.headersTimeout = 10_000;
  await new Promise((resolveListen, rejectListen) => {
    server.once('error', rejectListen);
    server.listen(port, '127.0.0.1', () => {
      server.off('error', rejectListen);
      resolveListen();
    });
  });
  const address = server.address();
  let closing;
  return {
    origin: `http://127.0.0.1:${address.port}`,
    close() {
      if (!closing) {
        closing = new Promise((resolveClose, rejectClose) => {
          server.close((error) => (error ? rejectClose(error) : resolveClose()));
          server.closeAllConnections();
        });
      }
      return closing;
    },
  };
}

const USAGE = 'Usage: node ui-remake/serve-reference.mjs --root artifacts/stitch/SCREEN [--port 4174]';

async function main(args) {
  if (args.length === 1 && args[0] === '--help') {
    console.log(USAGE);
    return;
  }
  const options = {};
  const seen = new Set();
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (!['--root', '--port'].includes(argument) || seen.has(argument) || !args[index + 1]) {
      throw new TypeError(USAGE);
    }
    seen.add(argument);
    const value = args[++index];
    if (argument === '--root') options.rootDirectory = value;
    else {
      if (!/^\d+$/.test(value)) throw new TypeError(`Invalid port. ${USAGE}`);
      options.port = Number(value);
    }
  }
  if (!options.rootDirectory) throw new TypeError(USAGE);
  if (options.port === 0) throw new RangeError(`CLI port must be from 1024 to 65535. ${USAGE}`);
  const reference = await startReferenceServer(options);
  console.log(`${reference.origin}\nPress Ctrl+C to stop.`);
  const stop = () => {
    reference.close().catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
  };
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
