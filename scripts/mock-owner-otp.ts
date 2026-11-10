import type { IncomingMessage } from "node:http";
import type { TLSSocket } from "node:tls";
import type { Plugin } from "vite";
import { createMockOwnerProvisioning } from "../src/adapters/mock/ownerProvisioningModel";
import { createErrorHttpCode, createStatusHttpCode } from "../src/adapters/mock/ownerMockHttp";
import type { ConfirmStoreKeyResponse, CreateStoreOtpResponse, GetCreateStatusResponse, MockProvisionedStore, VerifyCreateResponse } from "../src/domain/ownerCreate";

type Reply = CreateStoreOtpResponse | VerifyCreateResponse | GetCreateStatusResponse | ConfirmStoreKeyResponse
  | { ok: true; store?: MockProvisionedStore };
const routes = ["/request-otp", "/verify", "/status", "/confirm-key", "/pair", "/owner-pin"] as const;
type Route = typeof routes[number];
const isRoute = (route: unknown): route is Route => routes.some(value => value === route);

function localRequestAddress(req: IncomingMessage) {
  const ip = req.socket.remoteAddress;
  const host = req.headers.host?.toLowerCase() ?? "";
  const protocol = (req.socket as TLSSocket).encrypted ? "https" : "http";
  if (ip && ["::1", "127.0.0.1", "::ffff:127.0.0.1"].includes(ip)
    && /^(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(host)
    && (req.headers.origin === undefined || req.headers.origin === `${protocol}://${host}`)) return ip;
}

async function readSmallJson(req: IncomingMessage): Promise<unknown> {
  let size = 0;
  const chunks: Buffer[] = [];
  for await (const chunk of req.iterator({ destroyOnReturn: false })) {
    const bytes = Buffer.from(chunk);
    size += bytes.length;
    if (size > 8_192) {
      req.resume();
      return null;
    }
    chunks.push(bytes);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export function mockOwnerOtp(createModel?: typeof createMockOwnerProvisioning): Plugin {
  return {
    name: "pos-cafe-mock-owner-otp",
    apply: "serve",
    configureServer(server) {
      if (!server.config.env.DEV || server.config.env.VITE_DATA_MODE !== "mock") return;
      const model = createModel?.() ?? createMockOwnerProvisioning({
        autoComplete: true,
        fixtureOtp: server.config.env.VITE_OWNER_CREATE_FIXTURE === "1" ? () => "012345" : undefined,
      });
      server.middlewares.use("/__pos_owner_mock", async (req, res) => {
        const route = req.url;
        const ip = localRequestAddress(req);
        if (req.method !== "POST" || !ip
          || !isRoute(route)
          || req.headers["content-type"] !== "application/json") {
          res.writeHead(404).end();
          return;
        }
        const input = await readSmallJson(req).catch(() => null);
        let result: Reply;
        try {
          switch (route) {
            case "/request-otp":
              result = model.requestCreateStoreOtp(input, ip);
              break;
            case "/verify":
              result = model.verifyAndAcceptCreate(input);
              break;
            case "/status":
              result = model.getCreateStatus(input);
              break;
            case "/confirm-key":
              result = model.confirmStoreKeySaved(input);
              break;
            case "/pair": {
              const store = model.pairMockStore((input as { storeKey?: unknown } | null)?.storeKey);
              result = store ? { ok: true, store } : { ok: false, code: "A_REQUEST_INVALID" };
              break;
            }
            case "/owner-pin": {
              const credentials = input as { storeKey?: unknown; pin?: unknown } | null;
              result = model.checkMockOwnerPin(credentials?.storeKey, credentials?.pin)
                ? { ok: true } : { ok: false, code: "A_REQUEST_INVALID" };
              break;
            }
          }
        } catch {
          result = { ok: false, code: route === "/request-otp" ? "A_SEND_UNAVAILABLE" : "CREATE_VERIFY_UNAVAILABLE" };
        }
        const httpStatus = "status" in result ? createStatusHttpCode(result.status, route === "/verify")
          : result.ok ? (route === "/request-otp" ? 202 : 200) : createErrorHttpCode(result.code);
        res.writeHead(httpStatus, {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
          "X-POS-Mock-Now": String(model.readServerTime()),
        }).end(JSON.stringify(result));
      });
    },
  };
}
