import { beforeEach, describe, expect, it, vi } from "vitest";
import { restoreCashierOverrides } from "./restoreCashierOverrides";

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
const restore = () => restoreCashierOverrides({ original, requestId });

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
    await expect(restore()).rejects.toThrow("revision changed");
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

  it("reports a rejected restore or a write whose readback still differs", async () => {
    listAudit.mockResolvedValue({ rows: [applied], nextCursor: null });
    updateEmployee.mockResolvedValueOnce({ ok: false }).mockResolvedValueOnce({ ok: true });
    await expect(restore()).rejects.toThrow("Could not confirm restoration");
    await expect(restore()).rejects.toThrow("Could not confirm restoration");
  });
});
