import { afterEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { createOwnerRecoveryServer, createPgRecoveryExecutor, projectRecoveryResult,
  validateRecoveryRequest } from '../../scripts/owner-recovery-operator-core.mjs';

// Independent exact wording from the accepted context contract, not the production map.
const expectedRecoveryMessages = {
  "OWNER_RECOVERY_REVIEW_REQUIRED": "Chưa đủ căn cứ khôi phục chủ quán. Cần xác minh hồ sơ hỗ trợ.",
  "OWNER_PROTECTED": "Tài khoản cần khôi phục phải là chủ quán đang hoạt động.",
  "NOT_FOUND": "Không tìm thấy tài khoản cần khôi phục.",
  "FORBIDDEN": "Bạn không có quyền thực hiện thao tác này.",
  "ADMIN_REQUEST_REUSED": "Mã yêu cầu đã được dùng cho nội dung khác. Vui lòng tạo yêu cầu mới.",
  "PERMISSION_UPDATE_UNAVAILABLE": "Chưa xác nhận được việc khôi phục PIN. Kiểm tra hồ sơ trước khi thử lại cùng yêu cầu.",
  "INVALID_EMPLOYEE_REQUEST": "PIN mới phải gồm 6 chữ số."
};

const launchCode = 'operator-test-code-keep-out-of-reports-2026';
const pin = '729461';
const request = () => ({ requestId: randomUUID(), storeId: randomUUID(), targetId: randomUUID(),
  operatorRef: 'op-test', caseRef: 'case-test-001', proofRef: 'proof-test-001', newPin: pin, acknowledged: true });
let server;
afterEach(async () => { if (server) await new Promise(resolve => server.close(resolve)); server = undefined; });

async function start(recover) {
  const app = createOwnerRecoveryServer({ launchCode, recover, port: 0 });
  server = app.server;
  const address = await app.listen();
  const base = `http://127.0.0.1:${address.port}`;
  return { base, post: (route, body, headers = {}) => fetch(base + route, { method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: base, ...headers }, body: JSON.stringify(body),
    redirect: 'manual' }) };
}

describe('owner recovery operator boundary', () => {
  it('binds only loopback, requires unlock/session/Origin/CSRF, and never projects the PIN', async () => {
    const calls = [];
    const { base, post } = await start(async payload => {
      calls.push(payload);
      return { ok: true, outcome: 'applied', data: { credentialChanged: true,
        pinChangeRequired: true, employeeRevision: 9, newPin: pin, passcodeHash: 'raw-hash' } };
    });
    expect(server.address().address).toBe('127.0.0.1');
    const page = await fetch(base);
    expect(page.status).toBe(200);
    expect(page.headers.get('cache-control')).toBe('no-store');
    expect(page.headers.get('content-security-policy')).toContain("frame-ancestors 'none'");
    expect(page.headers.get('content-security-policy')).toMatch(/script-src 'sha256-[^']+';/);
    expect(page.headers.get('content-security-policy')).not.toContain("script-src 'self' 'unsafe-inline'");
    expect(await page.text()).not.toContain(launchCode);
    expect((await post('/api/recover', request())).status).toBe(403);
    const badOrigin = await fetch(base + '/api/unlock', { method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'http://elsewhere.invalid' },
      body: JSON.stringify({ code: launchCode }) });
    expect(badOrigin.status).toBe(403);
    // Valid JSON/code/Origin: only the byte limit should prevent this unlock.
    const oversizedBody=JSON.stringify({code:launchCode})+' '.repeat(16_384);
    expect(Buffer.byteLength(oversizedBody)).toBeGreaterThan(16_384);
    const oversized=await fetch(base+'/api/unlock',{method:'POST',
      headers:{'Content-Type':'application/json',Origin:base},body:oversizedBody,redirect:'manual'});
    expect(oversized.status).toBe(400);
    expect(await oversized.json()).toEqual({ok:false});
    expect(calls).toHaveLength(0);
    const unlocked = await post('/api/unlock', { code: launchCode });
    expect(unlocked.status).toBe(200);
    const cookie = unlocked.headers.get('set-cookie');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Strict');
    const session = await unlocked.json();
    expect(session.csrf).toBeTruthy();
    expect((await post('/api/recover', request(), { Cookie: cookie })).status).toBe(403);
    const response = await post('/api/recover', request(), { Cookie: cookie, 'X-CSRF-Token': session.csrf });
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).not.toContain(pin);
    expect(text).not.toContain('raw-hash');
    expect(text).not.toContain(launchCode);
    expect(JSON.parse(text)).toMatchObject({ ok: true, outcome: 'applied', data: { employeeRevision: 9 } });
    expect(calls).toHaveLength(1);
    expect(calls[0].newPin).toBe(pin);
    expect(calls[0]).not.toHaveProperty('acknowledged');
    const locked = await post('/api/lock', {}, { Cookie: cookie, 'X-CSRF-Token': session.csrf });
    expect(locked.status).toBe(200);
    expect((await post('/api/recover', request(), { Cookie: cookie, 'X-CSRF-Token': session.csrf })).status).toBe(403);
  });

  it('validates target/case/PIN before DB and maps all recovery errors to exact safe messages', async () => {
    for (const code of ['OWNER_RECOVERY_REVIEW_REQUIRED', 'OWNER_PROTECTED', 'NOT_FOUND',
      'FORBIDDEN', 'ADMIN_REQUEST_REUSED', 'PERMISSION_UPDATE_UNAVAILABLE', 'INVALID_EMPLOYEE_REQUEST']) {
      const result = projectRecoveryResult({ ok: false, error: { code, message: 'raw SQL secret' } });
      expect(result).toEqual({ ok: false, error: { code, message: expectedRecoveryMessages[code] } });
      expect(JSON.stringify(result)).not.toContain('raw SQL secret');
    }
    expect(validateRecoveryRequest({ ...request(), newPin: '１２３４５６' }).error.code).toBe('INVALID_EMPLOYEE_REQUEST');
    expect(validateRecoveryRequest({ ...request(), acknowledged: false }).error.code).toBe('OWNER_RECOVERY_REVIEW_REQUIRED');
    expect(validateRecoveryRequest({ ...request(), storeId: 'not-a-uuid' }).error.code).toBe('OWNER_RECOVERY_REVIEW_REQUIRED');
    expect(validateRecoveryRequest({ ...request(), injected: 'value' }).error.code).toBe('OWNER_RECOVERY_REVIEW_REQUIRED');
    expect(() => createPgRecoveryExecutor('postgresql://user@wrong.invalid/db', '127.0.0.1'))
      .toThrow('OWNER_RECOVERY_TARGET_INVALID');
  });

  it('returns only the recovery context sentence for DB faults and throttles unlock guesses', async () => {
    const { post } = await start(async () => { throw new Error(`raw SQL ${pin}`); });
    const unlocked = await post('/api/unlock', { code: launchCode });
    const cookie = unlocked.headers.get('set-cookie');
    const session = await unlocked.json();
    const response = await post('/api/recover', request(), { Cookie: cookie, 'X-CSRF-Token': session.csrf });
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ ok: false, error: { code: 'PERMISSION_UPDATE_UNAVAILABLE',
      message: expectedRecoveryMessages.PERMISSION_UPDATE_UNAVAILABLE } });
    for (let i = 0; i < 5; i++) expect((await post('/api/unlock', { code: 'incorrect-code' })).status).toBe(403);
    expect((await post('/api/unlock', { code: launchCode })).status).toBe(429);
  });
});
