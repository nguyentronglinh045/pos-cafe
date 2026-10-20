// Synthetic loopback server for runner lifecycle regression tests. No app code.
import { createServer } from 'node:http';
const port = Number(process.env.UI_AUDIT_LIFECYCLE_PORT);
if (!Number.isInteger(port) || port < 1) throw new Error('Missing test port');
if (process.env.UI_AUDIT_LIFECYCLE_MODE === 'exit') process.exit(7);
createServer((_request, response) => {
  response.writeHead(process.env.UI_AUDIT_LIFECYCLE_MODE === 'ready' ? 200 : 503);
  response.end('synthetic runner lifecycle test');
}).listen(port, '127.0.0.1');
