import { describe, expect, it, vi } from "vitest";
import { createCandidateRuntimeFixture } from "@/test/candidateRuntimeFixture";
import { mockMenuCatalog } from "@/adapters/mock/mockData";
import { buildPayableLines, fullSelection, payOrderAndPrint, payOrderItemsAndPrint, submitOrderAndPrint, voidPaidOrder } from "./orderFlow";
import { getWriteCoordinator } from "./writeOperationFlow";

describe("authority lookup stays inside the initiating write lifetime", () => {
  for (const action of ["submit", "pay", "split", "full-selection", "void"] as const) {
    for (const invalidate of ["leave", "suspend"] as const) {
      it(`${action} cannot register after ${invalidate} while authority is pending`, async () => {
        const { ports, actor, legacyPorts } = await createCandidateRuntimeFixture();
        const order = await legacyPorts.order.getOrder("7e2f462b-e6ff-491a-85f8-9f4eb53d9c4c");
        const authority = await ports.permission!.authority.getAuthority();
        const coordinator = getWriteCoordinator(ports.write);
        const capabilities = vi.spyOn(ports.write, "capabilities");
        const register = vi.spyOn(ports.write, "register");
        const execute = vi.spyOn(ports.write, "execute");
        const receipt = vi.spyOn(ports.write, "executeForInitialReceipt");
        const cancel = vi.spyOn(ports.write, "cancel");
        let release!: () => void;
        const pending = new Promise<void>(resolve => { release = resolve; });
        const lookup = vi.spyOn(ports.permission!.authority, "getAuthority").mockImplementationOnce(async () => {
          await pending;
          return authority;
        });
        const payment = { order, actor, receivedAmount: order.total, printReceipt: true };
        const work = action === "submit" ? submitOrderAndPrint(ports, {
          actor, context: { orderId: null, tableId: null, orderType: "takeaway" }, expectedVersion: null,
          menu: mockMenuCatalog,
          items: [{ id: crypto.randomUUID(), menuItemId: "d50ff72b-d0bc-4832-8888-183c19f5a158", quantity: 1, options: [] }],
        }) : action === "pay" ? payOrderAndPrint(ports, payment)
          : action === "void" ? voidPaidOrder(ports, { actor, order, reasonCode: "other", reasonNote: "Test" })
            : payOrderItemsAndPrint(ports, { ...payment, selection: action === "full-selection"
              ? fullSelection(buildPayableLines(order)) : { [order.items[0].id]: 1 } });
        const outcome = work.then(value => ({ value }), error => ({ error }));
        expect(lookup).toHaveBeenCalledOnce();
        coordinator[invalidate]();
        release();
        expect(await outcome).toMatchObject({ error: { code: "WRITE_RESULT_UNKNOWN" } });
        for (const spy of [capabilities, register, execute, receipt, cancel]) expect(spy).not.toHaveBeenCalled();
        expect(coordinator.snapshot()).toBeNull();
      });
    }
  }

  for (const invalidate of ["leave", "suspend"] as const) {
    it(`full-selection delegation also respects ${invalidate} during its second lookup`, async () => {
      const { ports, actor, legacyPorts } = await createCandidateRuntimeFixture();
      const order = await legacyPorts.order.getOrder("7e2f462b-e6ff-491a-85f8-9f4eb53d9c4c");
      const authority = await ports.permission!.authority.getAuthority();
      let release!: () => void;
      const pending = new Promise<void>(resolve => { release = resolve; });
      const lookup = vi.spyOn(ports.permission!.authority, "getAuthority").mockResolvedValueOnce(authority)
        .mockImplementationOnce(async () => { await pending; return authority; });
      const register = vi.spyOn(ports.write, "register");
      const execute = vi.spyOn(ports.write, "executeForInitialReceipt");
      const work = payOrderItemsAndPrint(ports, { order, actor, receivedAmount: order.total,
        printReceipt: true, selection: fullSelection(buildPayableLines(order)) });
      const outcome = work.then(value => ({ value }), error => ({ error }));
      await vi.waitFor(() => expect(lookup).toHaveBeenCalledTimes(2));
      getWriteCoordinator(ports.write)[invalidate]();
      release();
      expect(await outcome).toMatchObject({ error: { code: "WRITE_RESULT_UNKNOWN" } });
      expect(register).not.toHaveBeenCalled();
      expect(execute).not.toHaveBeenCalled();
    });
  }
});
