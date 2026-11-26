import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { createAppPorts } from "@/app/runtimePorts";
import { useAppStore } from "@/app/useAppStore";
import { PortsContext } from "@/features/shared/portsContext";
import { usePermissionSession } from "@/features/shared/permissionSession";
import type { IOwnerRecoveryPort, RotationConfirmResult } from "@/ports/ownerRecovery";
import { StoreKeyRotationPanel } from "./StoreKeyRotationPanel";

const name = "POS Demo";
const key = `0001-${"A".repeat(32)}`;
const challengeRef = "98765432-1234-4234-8234-987654321098";
const owner = { id: "30000000-0000-4000-8000-000000000011", name: "Chủ quán" };
const receipt = () => ({ kind: "receipt" as const, challengeRef, serverNow: Date.now(),
  resendNotBefore: Date.now() + 600_000 });

async function mount(port: IOwnerRecoveryPort) {
  const ports = createAppPorts({ mode: "mock" });
  await ports.auth.pairStore("0001-X8F3QA");
  const session = await ports.permission.session.startSession(owner.id, "123456");
  useAppStore.getState().startEmployeeSession(owner, session);
  const queries = new QueryClient();
  const originalPair = ports.auth.pairStore.bind(ports.auth);
  const pair = vi.spyOn(ports.auth, "pairStore");
  const unpair = vi.spyOn(ports.auth, "unpairStore");
  const revokeEmployee = vi.spyOn(ports.permission!.session, "revokeSession");
  render(<PortsContext.Provider value={ports}><QueryClientProvider client={queries}>
    <StoreKeyRotationPanel port={port} storeName={name} />
  </QueryClientProvider></PortsContext.Provider>);
  return { pair, originalPair, unpair, revokeEmployee, queries, auth: ports.auth };
}

async function sendAndEnterCode() {
  const send = screen.getByTestId("rotation-send-otp");
  expect(send).toBeDisabled();
  fireEvent.change(screen.getByTestId("rotation-store-name"), { target: { value: ` ${name} ` } });
  fireEvent.click(send);
  fireEvent.change(await screen.findByTestId("rotation-otp-input"), { target: { value: "540218" } });
  return screen.getByTestId("rotation-confirm");
}

afterEach(() => {
  cleanup();
  useAppStore.getState().setCurrentEmployee(null);
  useAppStore.setState({ rePairingStore: false, screen: "landing", sessionNotice: null });
  vi.restoreAllMocks();
});

it("reuses the exact attempt and OTP after losing the confirmation response", async () => {
  const confirmRotation = vi.fn<IOwnerRecoveryPort["confirmRotation"]>()
    .mockResolvedValueOnce({ kind: "uncertain" }).mockResolvedValueOnce({ kind: "status", status: "completed" });
  const { pair } = await mount({ requestRotationOtp: async () => receipt(), confirmRotation });
  fireEvent.click(await sendAndEnterCode());
  expect(await screen.findByText(/Chưa xác định kết quả/)).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Kiểm tra lại" }));
  expect(await screen.findByText(/đã tạo key mới/)).toBeVisible();
  expect(confirmRotation).toHaveBeenCalledTimes(2);
  expect(confirmRotation.mock.calls[0][0]).toEqual(confirmRotation.mock.calls[1][0]);
  expect(pair).not.toHaveBeenCalled();
  expect(screen.queryByTestId("store-key-rotation-success")).not.toBeInTheDocument();
  expect(window.sessionStorage.length).toBe(0);
  expect(window.localStorage.length).toBe(0);
});

it("corrects the request time after a stale ID and reuses the corrected ID after a lost issue response", async () => {
  const serverNow = Date.now() + 3_600_000;
  const requestRotationOtp = vi.fn<IOwnerRecoveryPort["requestRotationOtp"]>()
    .mockResolvedValueOnce({ kind: "error", code: "A_REQUEST_ID_STALE", serverNow })
    .mockResolvedValueOnce({ kind: "error", code: "A_SEND_UNAVAILABLE" })
    .mockResolvedValueOnce({ kind: "receipt", challengeRef, serverNow, resendNotBefore: serverNow + 600_000 });
  await mount({ requestRotationOtp, confirmRotation: vi.fn() });
  fireEvent.change(screen.getByTestId("rotation-store-name"), { target: { value: name } });
  const send = screen.getByTestId("rotation-send-otp");
  fireEvent.click(send);
  expect(await screen.findByText(/Thời gian trên thiết bị/)).toBeVisible();
  fireEvent.click(send);
  expect(await screen.findByText(/Chưa tiếp nhận được yêu cầu gửi mã/)).toBeVisible();
  fireEvent.click(send);
  expect(await screen.findByTestId("rotation-otp-input")).toBeVisible();
  const [stale, corrected, replay] = requestRotationOtp.mock.calls.map(([input]) => input);
  expect(stale.requestId).not.toBe(corrected.requestId);
  expect(parseInt(corrected.requestId.replace(/-/g, "").slice(0, 12), 16)).toBeGreaterThanOrEqual(serverNow);
  expect(replay).toEqual(corrected);
});

it("lets the owner request a new OTP as soon as the server reports expiry", async () => {
  const requestRotationOtp = vi.fn<IOwnerRecoveryPort["requestRotationOtp"]>().mockImplementation(async () => receipt());
  await mount({ requestRotationOtp, confirmRotation: async () => ({ kind: "error", code: "A_OTP_EXPIRED" }) });
  fireEvent.click(await sendAndEnterCode());
  expect(await screen.findByText(/Mã xác minh đã hết hạn/)).toBeVisible();
  expect(screen.queryByTestId("rotation-otp-input")).not.toBeInTheDocument();
  const send = screen.getByTestId("rotation-send-otp");
  expect(send).toBeEnabled();
  fireEvent.click(send);
  expect(await screen.findByTestId("rotation-otp-input")).toBeVisible();
  expect(requestRotationOtp.mock.calls[0][0].requestId).not.toBe(requestRotationOtp.mock.calls[1][0].requestId);
});

it("hands the actual returned key to pairing, clears employee state and requires PIN again", async () => {
  const { pair, queries } = await mount({ requestRotationOtp: async () => receipt(),
    confirmRotation: async () => ({ kind: "key", storeKey: key }) });
  fireEvent.click(await sendAndEnterCode());
  expect(await screen.findByLabelText("Store Key mới")).toHaveTextContent(key);
  expect(pair).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Dùng key mới trên máy này" }));
  await waitFor(() => expect(useAppStore.getState().screen).toBe("passcode"));
  expect(pair).toHaveBeenCalledExactlyOnceWith(key);
  expect(useAppStore.getState().currentEmployee).toBeNull();
  expect(usePermissionSession.getState().session).toBeNull();
  expect(window.sessionStorage.length).toBe(0);
  expect(window.localStorage.length).toBe(0);
  queries.clear();
});

it("suppresses a late key after the owner session is cleared", async () => {
  let deliver: (value: RotationConfirmResult) => void = () => { throw new Error("unexpected"); };
  const confirmRotation = vi.fn<IOwnerRecoveryPort["confirmRotation"]>()
    .mockImplementation(() => new Promise((resolve) => { deliver = resolve; }));
  await mount({ requestRotationOtp: async () => receipt(), confirmRotation });
  fireEvent.click(await sendAndEnterCode());
  expect(confirmRotation).toHaveBeenCalledTimes(1);
  await act(async () => {
    usePermissionSession.getState().clear();
    deliver({ kind: "key", storeKey: key });
  });
  expect(screen.queryByLabelText("Store Key mới")).not.toBeInTheDocument();
});

it("leaves the machine unpaired when verifying a partially established store session fails", async () => {
  const { pair, originalPair, unpair, queries, auth } = await mount({ requestRotationOtp: async () => receipt(),
    confirmRotation: async () => ({ kind: "key", storeKey: key }) });
  pair.mockImplementationOnce(async value => {
    await originalPair(value);
    throw new Error("fixture store session verification failure");
  });
  fireEvent.click(await sendAndEnterCode());
  expect(await screen.findByLabelText("Store Key mới")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Dùng key mới trên máy này" }));
  await waitFor(() => expect(useAppStore.getState().sessionNotice).toMatch(/Chưa ghép được máy này/));
  expect(useAppStore.getState().screen).toBe("storePairing");
  expect(useAppStore.getState().currentEmployee).toBeNull();
  expect(unpair).toHaveBeenCalledTimes(2);
  expect(unpair.mock.invocationCallOrder[0]).toBeLessThan(pair.mock.invocationCallOrder[0]);
  expect(unpair.mock.invocationCallOrder[1]).toBeGreaterThan(pair.mock.invocationCallOrder[0]);
  expect(await auth.getStoreSession()).toBeNull();
  expect(queries.getQueryData(["session", "store"])).toEqual({ status: "unpaired", session: null });
  queries.clear();
});

it.each([
  { code: "AUTH_REQUIRED", next: "storePairing" },
  { code: "EMPLOYEE_SESSION_REQUIRED", next: "passcode" },
  { code: "PIN_CHANGE_REQUIRED", next: "passcode" },
] as const)("clears the confirmed invalid session ($code) after an interrupted confirmation", async ({ code, next }) => {
  const confirmRotation = vi.fn<IOwnerRecoveryPort["confirmRotation"]>()
    .mockResolvedValueOnce({ kind: "uncertain" }).mockResolvedValueOnce({ kind: "error", code });
  const { pair, unpair, queries, revokeEmployee, auth } = await mount({ requestRotationOtp: async () => receipt(), confirmRotation });
  queries.setQueryData(["permission", "fixture"], { protected: true });
  fireEvent.click(await sendAndEnterCode());
  await screen.findByText(/Chưa xác định kết quả/);
  fireEvent.click(screen.getByRole("button", { name: "Kiểm tra lại" }));
  await waitFor(() => expect(useAppStore.getState()).toMatchObject({ screen: next, rePairingStore: false,
    currentEmployee: null, sessionNotice: expect.stringContaining("email đã đăng ký") }));
  expect(screen.queryByRole("button", { name: "Kiểm tra lại" })).not.toBeInTheDocument();
  expect(screen.queryByTestId("rotation-otp-input")).not.toBeInTheDocument();
  expect(usePermissionSession.getState().session).toBeNull();
  expect(queries.getQueryData(["permission", "fixture"])).toBeUndefined();
  expect(pair).not.toHaveBeenCalled();
  if (next === "storePairing") {
    expect(unpair).toHaveBeenCalledTimes(1);
    expect(await auth.getStoreSession()).toBeNull();
  } else {
    expect(revokeEmployee).toHaveBeenCalledTimes(1);
    expect(unpair).not.toHaveBeenCalled();
    expect(await auth.getStoreSession()).not.toBeNull();
  }
  queries.clear();
});
