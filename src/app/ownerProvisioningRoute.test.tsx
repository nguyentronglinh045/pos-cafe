import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { newOwnerRequestId } from "@/core/ownerCreateInput";
import { PortsContext } from "@/features/shared/portsContext";
import type { AppPorts, IStoreProvisioningPort } from "@/ports";
import { App } from "./App";
import { ownerCreateAttemptStorage } from "./screens/useOwnerCreateCloseout";
import { useAppStore } from "./useAppStore";

function renderSetup(storeProvisioning?: IStoreProvisioningPort) {
  const auth = { getStoreSession: vi.fn().mockResolvedValue(null), pairStore: vi.fn() };
  const ports = { auth, storeProvisioning } as unknown as AppPorts;
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<PortsContext.Provider value={ports}>
    <QueryClientProvider client={client}><App /></QueryClientProvider>
  </PortsContext.Provider>);
  return { auth, client };
}

afterEach(() => {
  cleanup();
  window.sessionStorage.clear();
  useAppStore.setState({ screen: "landing" });
});

test("an unpaired app without provisioning shows the Preview notice even without a seed port", async () => {
  const { auth, client } = renderSetup();
  fireEvent.click(await screen.findByTestId("go-create-store"));
  expect(screen.getByTestId("create-store-preview-notice")).toBeVisible();
  expect(screen.queryByTestId("owner-create-request")).not.toBeInTheDocument();
  expect(auth.pairStore).not.toHaveBeenCalled();
  client.clear();
});

test("an unpaired app with provisioning opens email verification with user-facing copy", async () => {
  const provision: IStoreProvisioningPort = {
    requestCreateStoreOtp: vi.fn(),
    verifyAndAcceptCreate: vi.fn(),
    getCreateStatus: vi.fn(),
    confirmStoreKeySaved: vi.fn(),
  };
  const { auth, client } = renderSetup(provision);
  fireEvent.click(await screen.findByTestId("go-create-store"));
  expect(screen.getByTestId("owner-create-request")).toBeVisible();
  expect(screen.getByRole("textbox", { name: /Email chủ quán/ })).toBeVisible();
  expect(screen.getByTestId("owner-create-request")).not.toHaveTextContent(/dữ liệu mock|dữ liệu giả/i);
  expect(provision.requestCreateStoreOtp).not.toHaveBeenCalled();
  expect(auth.pairStore).not.toHaveBeenCalled();
  client.clear();
});

test("a saved OTP attempt resumes by reading status without repeating creation or returning a key", async () => {
  const attemptId = newOwnerRequestId(Date.now());
  window.sessionStorage.setItem(ownerCreateAttemptStorage, attemptId);
  const provision: IStoreProvisioningPort = {
    requestCreateStoreOtp: vi.fn(),
    verifyAndAcceptCreate: vi.fn(),
    getCreateStatus: vi.fn().mockResolvedValue({ status: "created" }),
    confirmStoreKeySaved: vi.fn(),
  };
  const { auth, client } = renderSetup(provision);
  expect(await screen.findByText(/đã tạo quán.*kiểm tra email/i)).toBeVisible();
  expect(provision.getCreateStatus).toHaveBeenCalledExactlyOnceWith({ attemptId });
  expect(screen.queryByTestId("owner-created-store-key")).not.toBeInTheDocument();
  expect(screen.getByTestId("owner-create-closeout")).not.toHaveTextContent(/dữ liệu mock|dữ liệu giả/i);
  expect(provision.verifyAndAcceptCreate).not.toHaveBeenCalled();
  expect(auth.pairStore).not.toHaveBeenCalled();
  client.clear();
});
