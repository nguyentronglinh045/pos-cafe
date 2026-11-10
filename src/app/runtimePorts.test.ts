import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { createElement } from "react";
import * as supabase from "@/adapters/supabase";
import { createAppPorts } from "./runtimePorts";
import { AppProviders } from "./AppProviders";

describe("production runtime ports", () => {
  it("từ chối link xem thử khi mode không phải mock trước khi mở Supabase", () => {
    const createClient = vi.spyOn(supabase, "createSupabaseBrowserClient");
    const initialUrl = window.location.href;
    try {
      expect(() => createAppPorts({ mode: "supabase", ownerCreateMock: true })).toThrow("yêu cầu cấu hình mock");
      expect(() => createAppPorts({ ownerCreateMock: true })).toThrow("yêu cầu cấu hình mock");
      vi.stubEnv("VITE_DATA_MODE", "supabase");
      window.history.replaceState(null, "", "/?owner-create-mock=1");
      const app = render(createElement(AppProviders, { children: "POS app" }));
      expect(screen.getByRole("alert")).toHaveTextContent("Bản xem thử tạo quán yêu cầu cấu hình mock.");
      expect(screen.queryByText("POS app")).not.toBeInTheDocument();
      app.unmount();
      expect(createClient).not.toHaveBeenCalled();
      expect(createAppPorts({ mode: "mock", ownerCreateMock: true }).storeProvisioning).toBeDefined();
    } finally {
      window.history.replaceState(null, "", initialUrl);
      vi.unstubAllEnvs();
      createClient.mockRestore();
    }
  });

  it("always exposes the complete candidate permission bundle in mock mode", async () => {
    const ports = createAppPorts({ mode: "mock" });
    expect(Object.keys(ports).sort()).toEqual(["auth", "permission", "print", "seed", "write"]);
    expect(ports.permission).toMatchObject({
      authority: expect.any(Object), employeeAdmin: expect.any(Object), read: expect.any(Object),
      session: expect.any(Object), changes: expect.any(Object), signals: expect.any(Object),
      menuImages: expect.any(Object), print: expect.any(Object),
    });
    await ports.auth.pairStore("0001-X8F3QA");
    const roster = await ports.permission!.authority.listRoster();
    const owner = roster[0];
    const cashier = roster[2];
    await expect(ports.permission!.session.startSession(owner.id, "123456")).resolves.toBeTruthy();
    await ports.permission!.session.revokeSession();
    await expect(ports.permission!.session.startSession(cashier.id, "111111")).resolves.toBeTruthy();
  });
});
