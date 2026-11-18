import { beforeEach, describe, expect, it, vi } from "vitest";
import { cashierUpdateConfirmed, restoreCashierOverrides } from "./restoreCashierOverrides";

const ports = vi.hoisted(() => ({
  employeeAdmin: { getEmployee: vi.fn(), listAudit: vi.fn(), updateEmployee: vi.fn() },
  authority: { getAuthority: vi.fn() },
}));
vi.mock("/src/app/runtimePorts.ts", () => ({ createAppPortsFromViteEnv: () => ({ permission: ports }) }));

const { getEmployee, listAudit, updateEmployee } = ports.employeeAdmin;
const original = { id: "cashier", permissionRevision: 11, overrides: null };
const changed = { ...original, permissionRevision: 12, overrides: { grants: [], denies: ["payment.take"] } };
const requestId = "smoke-change";
const applied = { targetId: original.id, outcome: "applied", requestId, actualAfter: changed };
const restore = (responseConfirmed = true) => restoreCashierOverrides({ original, requestId, responseConfirmed });

describe("staging smoke cashier cleanup", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getEmployee.mockResolvedValue(changed);
    ports.authority.getAuthority.mockResolvedValue({ catalog: { revision: 3 } });
    updateEmployee.mockResolvedValue({ ok: true });
  });

  it("finds the applied request on a later audit page and verifies the persisted baseline", async () => {
    getEmployee.mockResolvedValueOnce(changed).mockResolvedValueOnce(original);
    listAudit.mockResolvedValueOnce({ rows: [{ ...applied, requestId: "another-change" }], nextCursor: "page-2" })
      .mockResolvedValueOnce({ rows: [applied], nextCursor: null });
    await restore();
    expect(listAudit.mock.calls.map(([filter]) => filter)).toEqual([
      { targetId: original.id, outcome: "applied", limit: 10, cursor: undefined },
      { targetId: original.id, outcome: "applied", limit: 10, cursor: "page-2" },
    ]);
    expect(updateEmployee).toHaveBeenCalledExactlyOnceWith({
      targetId: original.id, requestId: expect.any(String), expectedRevision: 12,
      expectedCatalogRevision: 3, patch: { overrides: null },
    });
    expect(getEmployee).toHaveBeenCalledTimes(2);
  });

  it("reports unverified cleanup when the last page has no matching applied request", async () => {
    listAudit.mockResolvedValue({ rows: [
      { ...applied, requestId: "other" }, { ...applied, targetId: "other" }, { ...applied, outcome: "denied" },
    ], nextCursor: null });
    await expect(restore()).rejects.toThrow("Could not verify");
    expect(updateEmployee).not.toHaveBeenCalled();
  });

  it("stops on a repeating audit cursor without writing", async () => {
    listAudit.mockResolvedValue({ rows: [], nextCursor: "same-page" });
    await expect(restore()).rejects.toThrow("Could not verify");
    expect(listAudit).toHaveBeenCalledTimes(2);
    expect(updateEmployee).not.toHaveBeenCalled();
  });

  it("leaves an operator's newer revision untouched", async () => {
    getEmployee.mockResolvedValue({ ...changed, permissionRevision: 13 });
    listAudit.mockResolvedValue({ rows: [applied], nextCursor: null });
    await expect(restore()).rejects.toThrow("no longer matches");
    expect(updateEmployee).not.toHaveBeenCalled();
  });

  it("refuses to restore when the applied snapshot differs from the current overrides", async () => {
    listAudit.mockResolvedValue({ rows: [{ ...applied, actualAfter: { ...changed, overrides: null } }], nextCursor: null });
    await expect(restore()).rejects.toThrow("no longer matches");
    expect(updateEmployee).not.toHaveBeenCalled();
  });

  it("needs no write when the cashier already has the original overrides", async () => {
    getEmployee.mockResolvedValue(original);
    await restore();
    expect(listAudit).not.toHaveBeenCalled();
    expect(updateEmployee).not.toHaveBeenCalled();
  });

  it("does not accept a pre-commit baseline when the dispatched POST is still pending", async () => {
    vi.useFakeTimers();
    try {
      const response = vi.fn().mockReturnValue(new Promise(() => {}));
      const confirmed = cashierUpdateConfirmed({ response }, original.id);
      await vi.advanceTimersByTimeAsync(5_000);
      expect(await confirmed).toBe(false);
      getEmployee.mockResolvedValue(original);
      listAudit.mockResolvedValue({ rows: [], nextCursor: null });
      await expect(restore(await confirmed)).rejects.toThrow("Could not verify");
      expect(updateEmployee).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("recovers a lost reply using the matching committed audit before reading the cashier", async () => {
    listAudit.mockResolvedValue({ rows: [applied], nextCursor: null });
    getEmployee.mockResolvedValueOnce(changed).mockResolvedValueOnce(original);
    await restore(false);
    expect(listAudit).toHaveBeenCalledBefore(getEmployee);
    expect(updateEmployee).toHaveBeenCalledOnce();
  });

  it("recognizes a terminal reply only for the captured RPC", async () => {
    const response = vi.fn();
    const request = { response };
    const confirm = () => cashierUpdateConfirmed(request, original.id);
    for (const [body, expected] of [
      [{ ok: true, outcome: "applied", data: { id: original.id } }, true],
      [{ ok: false, error: { code: "EMPLOYEE_VERSION_CONFLICT" } }, true],
      [{ ok: true, outcome: "applied", data: { id: "other" } }, false],
      [{}, false],
    ] as const) {
      response.mockResolvedValue({ ok: () => true, json: async () => body });
      expect(await confirm()).toBe(expected);
    }
    response.mockRejectedValue(new Error("lost reply"));
    expect(await confirm()).toBe(false);
  });

  it("reports a rejected restore or a write whose readback still differs", async () => {
    listAudit.mockResolvedValue({ rows: [applied], nextCursor: null });
    updateEmployee.mockResolvedValueOnce({ ok: false }).mockResolvedValueOnce({ ok: true });
    await expect(restore()).rejects.toThrow("Could not confirm restoration");
    await expect(restore()).rejects.toThrow("Could not confirm restoration");
  });
});
