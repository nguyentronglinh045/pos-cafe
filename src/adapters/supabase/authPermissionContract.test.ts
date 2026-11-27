import { describe, expect, it, vi } from "vitest";
import { SupabaseAuthRepo } from "./authRepo";
import { employeeCredential } from "./employeeCredential";
import { SupabaseWriteOperationRepo } from "./writeOperationRepo";
import type { SupabaseAnyClient } from "./repoShared";

describe("current-device store logout", () => {
  it("reports SDK sign-out only when this device did not initiate it", async () => {
    let emit!: (event: string) => void;
    const unsubscribe = vi.fn();
    const onAuthStateChange = vi.fn((listener: typeof emit) => {
      emit = listener;
      return { data: { subscription: { unsubscribe } } };
    });
    const signOut = vi.fn(async () => { emit("SIGNED_OUT"); return { error: null }; });
    const client = { auth: { signOut, onAuthStateChange } } as unknown as SupabaseAnyClient;
    const auth = new SupabaseAuthRepo(client);
    const lost = vi.fn();
    const stop = auth.onStoreSessionLost(lost);

    await auth.unpairStore();
    emit("INITIAL_SESSION");
    emit("TOKEN_REFRESHED");
    expect(lost).not.toHaveBeenCalled();
    emit("SIGNED_OUT");
    expect(lost).toHaveBeenCalledOnce();
    stop();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  it("completes a deliberate unpair when refresh failed after the SDK removed the session", async () => {
    let emit!: (event: string) => void;
    const onAuthStateChange = vi.fn((listener: typeof emit) => {
      emit = listener;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
    const error = { code: "refresh_token_not_found", message: "Refresh token not found" };
    const signOut = vi.fn().mockResolvedValueOnce({ error }).mockImplementationOnce(async () => {
      emit("SIGNED_OUT");
      return { error };
    });
    const client = { auth: { signOut, onAuthStateChange } } as unknown as SupabaseAnyClient;
    const auth = new SupabaseAuthRepo(client);
    const lost = vi.fn();
    auth.onStoreSessionLost(lost);

    await expect(auth.unpairStore()).rejects.toMatchObject({ code: "AUTH_REQUIRED" });
    await expect(auth.unpairStore()).resolves.toBeUndefined();
    expect(lost).not.toHaveBeenCalled();
  });

  it("clears the employee credential and revokes only the current store session", async () => {
    const signOut = vi.fn().mockResolvedValue({ error: null });
    const client = { auth: { signOut } } as unknown as SupabaseAnyClient;
    const credential = employeeCredential(client);
    credential.token = "employee-session";

    await new SupabaseAuthRepo(client).unpairStore();

    expect(signOut).toHaveBeenCalledExactlyOnceWith({ scope: "local" });
    expect(credential).toEqual({ token: null, generation: 1 });
  });

  it.each([
    { name: "the store session is missing", storeSession: null },
    { name: "the store number differs", storeSession: { storeId: "store", storeNo: 8 } },
  ])("revokes only the newly paired session when $name", async ({ storeSession }) => {
    const signOut = vi.fn().mockResolvedValue({ error: null });
    const signInWithPassword = vi.fn().mockResolvedValue({ error: null });
    const getSession = vi.fn().mockResolvedValue({ data: { session: { user: { id: "store" } } }, error: null });
    const rpc = vi.fn().mockResolvedValueOnce({
      data: { permissionContractVersion: 2, writeProtocolVersion: 1 }, error: null,
    }).mockResolvedValueOnce({ data: { ok: true, data: storeSession }, error: null });
    const client = { auth: { signOut, signInWithPassword, getSession }, rpc } as unknown as SupabaseAnyClient;

    await expect(new SupabaseAuthRepo(client).pairStore("7-ABCDE")).rejects.toMatchObject({
      code: "AUTH_REQUIRED", message: "Store Key không đúng.",
    });

    expect(signInWithPassword).toHaveBeenCalledTimes(1);
    expect(signOut).toHaveBeenCalledExactlyOnceWith({ scope: "local" });
  });
});

describe("candidate compatibility gate", () => {
  it("blocks incompatible paired backend before store reads", async () => {
    for (const contract of [null, { permissionContractVersion: 0, writeProtocolVersion: 1 }, { permissionContractVersion: 1, writeProtocolVersion: 1 }, { permissionContractVersion: 2, writeProtocolVersion: 2 }]) {
      const rpc = vi.fn().mockResolvedValue({ data: contract, error: null });
      const client = { rpc, auth: { getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: "store" } } }, error: null }) } } as unknown as SupabaseAnyClient;
      const auth = new SupabaseAuthRepo(client);
      await expect(auth.getStoreSession()).rejects.toMatchObject({ code: "WRITE_PROTOCOL_UNSUPPORTED", message: "Phiên bản ứng dụng chưa tương thích. Vui lòng tải phiên bản mới trước khi tiếp tục." });
      expect(rpc.mock.calls.map(call => call[0])).toEqual(["permission_get_contract"]);
    }
  });
  it("allows minimal paired session on the compatible candidate without direct table reads", async () => {
    const rpc = vi.fn(async (name: string) => ({ data: name === "permission_get_contract"
      ? { permissionContractVersion: 2, writeProtocolVersion: 1 }
      : { ok: true, data: { storeId: "store", storeNo: 7 } }, error: null }));
    const client = { rpc, auth: { getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: "store" } } }, error: null }) } } as unknown as SupabaseAnyClient;
    await expect(new SupabaseAuthRepo(client).getStoreSession()).resolves.toEqual({ storeId: "store", storeNo: 7 });
    expect(rpc.mock.calls.map(call => call[0])).toEqual(["permission_get_contract", "permission_get_store_session"]);
  });
  it("candidate writes require the permission version while phase27 transport stays explicitly isolated", async () => {
    const base = { writeProtocolVersion: 1, maxPayloadBytes: 262144, pendingTtlSeconds: 86400 };
    const rpc = vi.fn().mockResolvedValue({ data: base, error: null }); const client = { rpc } as unknown as SupabaseAnyClient;
    await expect(new SupabaseWriteOperationRepo(client, true).capabilities()).rejects.toMatchObject({ code: "WRITE_PROTOCOL_UNSUPPORTED" });
    await expect(new SupabaseWriteOperationRepo(client).capabilities()).resolves.toEqual(base);
    rpc.mockResolvedValue({ data: { ...base, permissionContractVersion: 2 }, error: null });
    await expect(new SupabaseWriteOperationRepo(client, true).capabilities()).resolves.toMatchObject({ permissionContractVersion: 2 });
  });
});
