import { createHash, createHmac } from "node:crypto";
import { isIP } from "node:net";

const stagingProject = "ineckiashpwloncxnbqx";
const stagingUrl = `https://${stagingProject}.supabase.co`;
const publishableKey = /^sb_publishable_[A-Za-z0-9_-]{16,256}(?![\s\S])/;

const issueErrors = new Set([
  "A_EMAIL_INVALID", "A_REQUEST_INVALID", "A_REQUEST_ID_STALE", "A_REQUEST_ID_REUSED",
  "CREATE_INTENT_ID_REUSED", "A_SEND_UNAVAILABLE",
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
    if (!input || typeof input !== "object" || Array.isArray(input) || input.action !== "requestCreateStoreOtp") {
      return response.status(400).json({ ok: false, code: "A_REQUEST_INVALID" });
    }
    const raw = JSON.stringify(input);
    if (Buffer.byteLength(raw) > 8192) return response.status(400).json({ ok: false, code: "A_REQUEST_INVALID" });

    const ip = request.headers["x-vercel-forwarded-for"];
    const key = Buffer.from(env.POS_CAFE_OTP_INGRESS_KEY ?? "", "base64");
    const apiKey = env.POS_CAFE_OWNER_SUPABASE_PUBLISHABLE_KEY ?? "";
    if (env.VERCEL !== "1" || env.VERCEL_ENV !== "preview" || env.VERCEL_TARGET_ENV !== "preview"
      || env.POS_PREVIEW_DATA_MODE !== "supabase"
      || env.POS_PREVIEW_SUPABASE_URL !== stagingUrl || env.POS_CAFE_OWNER_SUPABASE_PROJECT_REF !== stagingProject
      || !publishableKey.test(apiKey) || apiKey !== env.POS_PREVIEW_SUPABASE_PUBLISHABLE_KEY
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
        },
      });
      const result = await reply.json();
      if (reply.status === 202 && result?.ok === true) {
        const receipt = result.receipt;
        if (typeof receipt?.challengeRef === "string" && typeof receipt.emailDisplay === "string"
          && typeof receipt.serverNow === "number" && typeof receipt.resendNotBefore === "number") {
          const { challengeRef, emailDisplay, serverNow, resendNotBefore } = receipt;
          return response.status(202).json({ ok: true, receipt: { challengeRef, emailDisplay, serverNow, resendNotBefore } });
        }
      }
      if (result?.ok === false && issueErrors.has(result.code) && [400, 409, 503].includes(reply.status)) {
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
