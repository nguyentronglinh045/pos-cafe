import { createHash, createHmac } from "node:crypto";
import { isIP } from "node:net";

const stagingProject = "ineckiashpwloncxnbqx";
const stagingUrl = `https://${stagingProject}.supabase.co`;
const publishableKey = /^sb_publishable_[A-Za-z0-9_-]{16,256}(?![\s\S])/;

export function publicDemoClientKey(env) {
  if (env.VERCEL !== "1" || env.VERCEL_ENV !== "production" || env.VERCEL_TARGET_ENV !== "production"
    || env.VERCEL_GIT_COMMIT_REF !== "main" || !/^[a-f0-9]{40}$/.test(env.POS_PUBLIC_DEMO_SHA ?? "")
    || env.POS_PUBLIC_DEMO_SHA !== env.VERCEL_GIT_COMMIT_SHA
    || !publishableKey.test(env.POS_PUBLIC_DEMO_CLIENT_KEY ?? "")) return null;
  return env.POS_PUBLIC_DEMO_CLIENT_KEY;
}

const issueErrors = new Set([
  "A_EMAIL_INVALID", "A_REQUEST_INVALID", "A_REQUEST_ID_STALE", "A_REQUEST_ID_REUSED",
  "CREATE_INTENT_ID_REUSED", "A_SEND_UNAVAILABLE",
  "AUTH_REQUIRED", "EMPLOYEE_SESSION_REQUIRED", "OWNER_ROLE_REQUIRED", "PIN_CHANGE_REQUIRED",
  "STORE_SUSPENDED", "STORE_NAME_MISMATCH",
]);

export function ownerOtpGateway({ env = process.env, fetchImpl = fetch, clock = Date.now } = {}) {
  return async (request, response) => {
    response.setHeader("Cache-Control", "no-store");
    if (request.method !== "POST") {
      response.setHeader("Allow", "POST");
      return response.status(405).json({ ok: false, code: "A_REQUEST_INVALID" });
    }
    let input;
    try {
      input = typeof request.body === "string" ? JSON.parse(request.body) : request.body;
    } catch {
      return response.status(400).json({ ok: false, code: "A_REQUEST_INVALID" });
    }
    if (!input || typeof input !== "object" || Array.isArray(input) ||
      !["requestCreateStoreOtp", "requestRotateStoreKeyOtp", "forgotStoreKey"].includes(input.action)) {
      return response.status(400).json({ ok: false, code: "A_REQUEST_INVALID" });
    }
    const rotation = input.action === "requestRotateStoreKeyOtp";
    const forgot = input.action === "forgotStoreKey";
    const authorization = request.headers.authorization;
    const employeeToken = request.headers["x-pos-employee-token"];
    if (rotation && (typeof authorization !== "string" || authorization.length > 4103
      || !/^Bearer [\w-]+\.[\w-]+\.[\w-]+$/i.test(authorization))) {
      return response.status(401).json({ ok: false, code: "AUTH_REQUIRED" });
    }
    if (rotation && (typeof employeeToken !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(employeeToken))) {
      return response.status(401).json({ ok: false, code: "EMPLOYEE_SESSION_REQUIRED" });
    }
    const raw = JSON.stringify(input);
    if (Buffer.byteLength(raw) > 8192) return response.status(400).json({ ok: false, code: "A_REQUEST_INVALID" });

    const ip = request.headers["x-vercel-forwarded-for"];
    const demoKey = publicDemoClientKey(env);
    const key = Buffer.from((demoKey ? env.POS_PUBLIC_DEMO_OTP_INGRESS_KEY : env.POS_CAFE_OTP_INGRESS_KEY) ?? "", "base64");
    const apiKey = demoKey ?? env.POS_CAFE_OWNER_SUPABASE_PUBLISHABLE_KEY ?? "";
    if ((forgot && demoKey) || (!demoKey && (env.VERCEL !== "1" || env.VERCEL_ENV !== "preview" || env.VERCEL_TARGET_ENV !== "preview"
      || env.POS_PREVIEW_DATA_MODE !== "supabase"
      || env.POS_PREVIEW_SUPABASE_URL !== stagingUrl || env.POS_CAFE_OWNER_SUPABASE_PROJECT_REF !== stagingProject
      || !publishableKey.test(apiKey) || apiKey !== env.POS_PREVIEW_SUPABASE_PUBLISHABLE_KEY))
      || typeof ip !== "string" || !isIP(ip) || key.byteLength !== 32) {
      return response.status(503).json({ ok: false, code: "A_SEND_UNAVAILABLE" });
    }

    const now = String(clock());
    const digest = createHash("sha256").update(raw).digest("hex");
    const signature = createHmac("sha256", key).update(`pos-cafe-otp-v1\n${now}\n${ip}\n${digest}`).digest("hex");
    try {
      const reply = await fetchImpl(`${stagingUrl}/functions/v1/owner-provisioning`, {
        method: "POST", redirect: "error", signal: AbortSignal.timeout(15_000), body: raw,
        headers: {
          "content-type": "application/json", apikey: apiKey,
          "x-pos-cafe-ip": ip, "x-pos-cafe-time": now, "x-pos-cafe-signature": signature,
          ...(rotation ? { authorization, "x-pos-employee-token": employeeToken } : {}),
        },
      });
      const result = await reply.json();
      if (forgot) {
        if (reply.status === 202 && result?.ok === true) return response.status(202).json({ ok: true });
        if (reply.status === 400 && result?.ok === false && ["A_EMAIL_INVALID", "A_REQUEST_INVALID"].includes(result.code)) {
          return response.status(400).json({ ok: false, code: result.code });
        }
        return response.status(503).json({ ok: false, code: "A_SEND_UNAVAILABLE" });
      }
      if (rotation && reply.status === 200 && ["pending", "applied", "completed"].includes(result?.status)) {
        return response.status(200).json({ status: result.status });
      }
      if (reply.status === 202 && result?.ok === true) {
        const receipt = result.receipt;
        if (typeof receipt?.challengeRef === "string" && (rotation || typeof receipt.emailDisplay === "string")
          && typeof receipt.serverNow === "number" && typeof receipt.resendNotBefore === "number") {
          const { challengeRef, emailDisplay, serverNow, resendNotBefore } = receipt;
          return response.status(202).json({ ok: true, receipt: { challengeRef, serverNow, resendNotBefore,
            ...(!rotation ? { emailDisplay } : {}) } });
        }
      }
      const allowedErrors = rotation ? [400, 401, 403, 409, 503] : [400, 409, 503];
      if (result?.ok === false && issueErrors.has(result.code) && allowedErrors.includes(reply.status)) {
        return response.status(reply.status).json({ ok: false, code: result.code,
          ...(typeof result.serverNow === "number" ? { serverNow: result.serverNow } : {}) });
      }
      return response.status(503).json({ ok: false, code: "A_SEND_UNAVAILABLE" });
    } catch {
      return response.status(503).json({ ok: false, code: "A_SEND_UNAVAILABLE" });
    }
  };
}

export default ownerOtpGateway();
