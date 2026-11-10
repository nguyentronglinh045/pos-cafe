// @vitest-environment node
import { describe, expect, it } from "vitest";
import { newOwnerRequestId } from "@/core/ownerCreateInput";
import type { RequestCreateStoreOtp } from "@/domain/ownerCreate";
import { createMockOwnerOtpServer } from "./ownerOtpServer";

const minute = 60_000;
const ip = "192.0.2.10";
function fixture(start = Date.UTC(2026, 10, 10, 2)) {
  let time = start;
  const server = createMockOwnerOtpServer(() => time);
  function input(fields: Partial<RequestCreateStoreOtp> = {}): RequestCreateStoreOtp {
    return {
      requestId: newOwnerRequestId(time),
      intentId: crypto.randomUUID(),
      email: "Owner.A+qa@example.com",
      displayName: "Quán QA",
      address: "",
      ownerPin: "038251",
      seedDemo: false,
      ...fields,
    };
  }
  return { server, input, now: () => time, advance: (ms: number) => { time += ms; } };
}

describe("mock cổng gửi mã tạo quán", () => {
  it("gửi một mã, trả biên nhận không bí mật, và phát lại đúng biên nhận khi mất phản hồi", () => {
    const { server, input, advance } = fixture();
    const body = input();
    const first = server.request(body, ip);
    expect(first.ok).toBe(true);
    if (!first.ok) throw new Error(first.code);
    expect(Object.keys(first.receipt).sort()).toEqual(["challengeRef", "emailDisplay", "resendNotBefore", "serverNow"]);
    expect(first.receipt.emailDisplay).toBe("owner.a+qa@example.com");
    expect(first.receipt.resendNotBefore - first.receipt.serverNow).toBe(10 * minute);
    advance(30_000);
    expect(server.request(body, ip)).toEqual(first);
    expect(server.readTestMailbox()).toHaveLength(1);
    advance(10 * minute + 30_000);
    expect(server.request({ ...body, requestId: body.requestId.toUpperCase(), ownerPin: "123456" }, ip)).toEqual(first);
    expect(server.readTestMailbox()).toEqual([]);
    expect(server.request({ ...body, email: "another@example.com" }, ip)).toEqual({ ok: false, code: "A_REQUEST_ID_REUSED" });
    expect(server.request({ ...body, intentId: crypto.randomUUID() }, ip)).toEqual({ ok: false, code: "A_REQUEST_ID_REUSED" });
    expect(server.request(input({ intentId: body.intentId, email: "another@example.com" }), ip))
      .toEqual({ ok: false, code: "CREATE_INTENT_ID_REUSED" });
    advance(79 * minute - 1);
    expect(server.request(body, ip)).toEqual(first);
    expect(server.readTestMailbox()).toEqual([]);
    advance(1);
    expect(server.request(body, ip)).toMatchObject({ ok: false, code: "A_REQUEST_ID_STALE" });
    expect(server.readTestMailbox()).toEqual([]);
  });

  it("chặn cùng email qua intent/IP mới cho tới đúng mốc 10 phút", () => {
    const { server, input, advance } = fixture();
    server.request(input(), ip);
    expect(server.readTestMailbox()).toEqual([expect.objectContaining({ code: expect.stringMatching(/^\d{6}$/) })]);
    advance(10 * minute - 1);
    const blockedInput = input({ email: " owner.a+QA@EXAMPLE.COM " });
    const blocked = server.request(blockedInput, "198.51.100.2");
    expect(blocked.ok).toBe(true);
    if (!blocked.ok) throw new Error(blocked.code);
    expect(blocked.receipt.resendNotBefore - blocked.receipt.serverNow).toBe(1);
    expect(server.readTestMailbox()).toHaveLength(1);
    advance(1);
    expect(server.request(blockedInput, ip)).toEqual(blocked);
    expect(server.readTestMailbox()).toEqual([]);
    expect(server.request(input({ intentId: blockedInput.intentId }), ip).ok).toBe(true);
    expect(server.readTestMailbox()).toHaveLength(1);
    expect(server.readTestMailbox()[0].issuedAt).toBe(blocked.receipt.resendNotBefore);
  });

  it("từ chối ID mới lệch quá 30 phút và cho phép yêu cầu đã sửa giờ", () => {
    for (const direction of [-1, 1]) {
      const { server, input, now } = fixture();
      const original = input({ requestId: newOwnerRequestId(now() + direction * (30 * minute + 1)) });
      expect(server.request(original, ip)).toEqual({ ok: false, code: "A_REQUEST_ID_STALE", serverNow: now() });
      expect(server.readTestMailbox()).toEqual([]);
      expect(server.request({ ...original, requestId: newOwnerRequestId(now() + direction * 30 * minute) }, ip).ok).toBe(true);
      expect(server.readTestMailbox()).toEqual([expect.objectContaining({ intentId: original.intentId })]);
    }
  });

  it("replay và xung đột ID không phát thư hoặc lấy mất lượt IP thứ mười", () => {
    const { server, input } = fixture();
    const original = input();
    const receipt = server.request(original, ip);
    expect(receipt.ok).toBe(true);
    for (let i = 0; i < 8; i++) {
      server.request(input({ email: `filler${i}@example.com` }), ip);
    }
    const mailbox = server.readTestMailbox();
    expect(mailbox).toHaveLength(9);
    expect(server.request({ ...original, ownerPin: "111111" }, ip)).toEqual(receipt);
    expect(server.readTestMailbox()).toEqual(mailbox);
    expect(server.request({ ...original, email: "another@example.com" }, ip))
      .toEqual({ ok: false, code: "A_REQUEST_ID_REUSED" });
    expect(server.readTestMailbox()).toEqual(mailbox);
    expect(server.request({ ...original, intentId: crypto.randomUUID() }, ip))
      .toEqual({ ok: false, code: "A_REQUEST_ID_REUSED" });
    expect(server.readTestMailbox()).toEqual(mailbox);
    for (const ownerPin of ["111111", original.ownerPin]) {
      expect(server.request(input({ intentId: original.intentId, email: "another@example.com", ownerPin }), ip))
        .toEqual({ ok: false, code: "CREATE_INTENT_ID_REUSED" });
      expect(server.readTestMailbox()).toEqual(mailbox);
    }
    expect(server.request(input({ email: "tenth@example.com" }), ip).ok).toBe(true);
    expect(server.readTestMailbox().map(mail => mail.email)).toContain("tenth@example.com");
    expect(server.request(input({ email: "eleventh@example.com" }), ip).ok).toBe(true);
    expect(server.readTestMailbox()).toHaveLength(10);
  });

  it("chặn email, IP và trần dự án độc lập, giữ phản hồi chung", () => {
    const perIp = fixture();
    for (let i = 0; i < 11; i++) perIp.server.request(perIp.input({ email: `ip${i}@example.com` }), ip);
    expect(perIp.server.readTestMailbox()).toHaveLength(10);
    const perProject = fixture(Date.UTC(2026, 10, 10, 16, 45)); // 23:45 UTC+7
    for (let i = 0; i < 401; i++) {
      expect(perProject.server.request(perProject.input({ email: `project${i}@example.com` }), `fixture-${i}`).ok).toBe(true);
    }
    expect(perProject.server.readTestMailbox()).toHaveLength(400);
    perProject.advance(15 * minute - 1);
    expect(perProject.server.request(perProject.input(), "before-midnight").ok).toBe(true);
    expect(perProject.server.readTestMailbox()).toEqual([]);
    perProject.advance(1);
    expect(perProject.server.request(perProject.input(), "after-midnight").ok).toBe(true);
    expect(perProject.server.readTestMailbox()).toEqual([expect.objectContaining({ issuedAt: perProject.now() })]);
    const perEmail = fixture();
    for (let i = 0; i < 10; i++) {
      perEmail.server.request(perEmail.input(), `fixture-${i}`);
      perEmail.advance(10 * minute);
    }
    expect(perEmail.server.request(perEmail.input(), "another").ok).toBe(true);
    expect(perEmail.server.readTestMailbox()).toHaveLength(0);
  });

  it("mở lại trần email theo nửa đêm Việt Nam và trần IP sau đúng một giờ", () => {
    const email = fixture(Date.UTC(2026, 10, 10, 15, 10)); // 22:10 UTC+7
    for (let i = 0; i < 10; i++) {
      expect(email.server.request(email.input(), ip).ok).toBe(true);
      expect(email.server.readTestMailbox()).toEqual([expect.objectContaining({ issuedAt: email.now() })]);
      if (i < 9) email.advance(10 * minute);
    }
    email.advance(20 * minute - 1);
    expect(email.server.request(email.input(), ip).ok).toBe(true);
    expect(email.server.readTestMailbox()).toEqual([]);
    email.advance(1);
    expect(email.server.request(email.input(), ip).ok).toBe(true);
    expect(email.server.readTestMailbox()).toEqual([expect.objectContaining({ issuedAt: email.now() })]);

    const network = fixture();
    for (let i = 0; i < 10; i++) network.server.request(network.input({ email: `ip${i}@example.com` }), ip);
    network.advance(60 * minute - 1);
    expect(network.server.request(network.input(), ip).ok).toBe(true);
    expect(network.server.readTestMailbox()).toEqual([]);
    network.advance(1);
    expect(network.server.request(network.input(), ip).ok).toBe(true);
    expect(network.server.readTestMailbox()).toEqual([expect.objectContaining({ issuedAt: network.now() })]);
  });

  it("từ chối trường ngoài biên mà không phát thư", () => {
    const { server, input } = fixture();
    expect(server.request(input({ email: "owner.a@@example" }), ip)).toEqual({ ok: false, code: "A_EMAIL_INVALID" });
    expect(server.request(input({ email: "K@EXAMPLE.COM" }), ip)).toEqual({ ok: false, code: "A_EMAIL_INVALID" });
    expect(server.request(input({ email: `${"a".repeat(65)}@example.com` }), ip))
      .toEqual({ ok: false, code: "A_EMAIL_INVALID" });
    expect(server.request(input({ displayName: "a".repeat(121) }), ip)).toEqual({ ok: false, code: "A_REQUEST_INVALID" });
    expect(server.request(input({ address: "a".repeat(501) }), ip)).toEqual({ ok: false, code: "A_REQUEST_INVALID" });
    expect(server.request(input({ ownerPin: "12345" }), ip)).toEqual({ ok: false, code: "A_REQUEST_INVALID" });
    expect(server.request(input({ ownerPin: "1234567" }), ip)).toEqual({ ok: false, code: "A_REQUEST_INVALID" });
    expect(server.request(input({ ownerPin: "63825a" }), ip)).toEqual({ ok: false, code: "A_REQUEST_INVALID" });
    const { ownerPin, ...missingPin } = input();
    expect(server.request(missingPin, ip)).toEqual({ ok: false, code: "A_REQUEST_INVALID" });
    expect(server.request(input({ displayName: " " }), ip)).toEqual({ ok: false, code: "A_REQUEST_INVALID" });
    const localPart = "a".repeat(64);
    const domain = ["b".repeat(63), "c".repeat(63), "d".repeat(61)].join(".");
    const longEmail = `${localPart}@${domain}`;
    expect(longEmail).toHaveLength(254);
    expect(server.request(input({ email: `${longEmail}d` }), ip)).toEqual({ ok: false, code: "A_EMAIL_INVALID" });
    expect(server.readTestMailbox()).toHaveLength(0);
    expect(server.request(input({ email: longEmail, displayName: "a".repeat(120), address: "a".repeat(500) }), ip).ok).toBe(true);
    expect(server.request(input({ displayName: "a" }), ip).ok).toBe(true);
  });
});
