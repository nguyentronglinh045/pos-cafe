import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { employeeCredential } from "@/adapters/supabase/employeeCredential";
import { SupabaseSeedRepo } from "@/adapters/supabase/seedRepo";
import { PortsContext } from "@/features/shared/portsContext";
import { createCandidateRuntimeFixture } from "@/test/candidateRuntimeFixture";
import { App } from "./App";
import { useAppStore } from "./useAppStore";

vi.mock("./shell/AppShell", () => ({ AppShell: () => <div data-testid="pos-shell">POS</div> }));

afterEach(() => {
  cleanup();
  useAppStore.getState().setCurrentEmployee(null);
  useAppStore.setState({ screen: "landing", createdStoreResult: null, pendingStoreCreationInput: null });
});

it.each([
  { initial: "waiting", title: "Đang chuẩn bị dữ liệu mẫu" },
  { initial: "failed", title: "Chưa tạo xong dữ liệu mẫu" },
] as const)("pairs and signs in while keeping POS closed when server seed is $initial", async ({ initial, title }) => {
  const fixture = await createCandidateRuntimeFixture({ demoCredentials: true });
  await fixture.ports.auth.unpairStore();
  const legacyCreate = vi.spyOn(fixture.ports.auth, "createStore");
  let readiness: "waiting" | "failed" | "ready" = initial;
  const rpc = vi.fn((name: string) => ({ setHeader: async (_header: string, token: string) => {
    expect(token).toBe("fixture-employee-token");
    if (name === "owner_retry_initial_seed") readiness = "ready";
    if (name === "owner_get_seed_readiness" || name === "owner_retry_initial_seed") {
      return { data: { ok: true, data: { status: readiness } }, error: null };
    }
    throw new Error(`Unexpected seed RPC: ${name}`);
  } }));
  const client = { rpc } as never;
  employeeCredential(client).token = "fixture-employee-token";
  const initialSeed = new SupabaseSeedRepo(client);
  const ports = { ...fixture.ports, permission: { ...fixture.ports.permission, initialSeed }, seed: initialSeed };
  const queries = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  useAppStore.getState().setCurrentEmployee(null);
  useAppStore.setState({ screen: "landing" });
  render(<PortsContext.Provider value={ports}><QueryClientProvider client={queries}><App /></QueryClientProvider></PortsContext.Provider>);

  fireEvent.click(await screen.findByTestId("go-create-store"));
  expect(screen.getByRole("heading", { name: "Tạo quán trên Protected Preview" })).toBeVisible();
  expect(screen.queryByTestId("create-store-button")).not.toBeInTheDocument();
  expect(legacyCreate).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole("button", { name: "Ghép thiết bị" }));
  fireEvent.change(screen.getByTestId("store-key-input"), { target: { value: "0001-X8F3QA" } });
  fireEvent.click(screen.getByTestId("go-passcode"));
  fireEvent.click(await screen.findByTestId(`employee-${fixture.owner.id}`));
  for (const digit of fixture.pin) fireEvent.click(screen.getByTestId(`pin-${digit}`));
  fireEvent.click(screen.getByTestId("unlock-button"));

  expect(await screen.findByRole("heading", { name: title })).toBeVisible();
  expect(screen.queryByTestId("pos-shell")).not.toBeInTheDocument();
  await waitFor(() => expect(rpc.mock.calls.map(([name]) => name)).toEqual(["owner_get_seed_readiness"]));
  if (initial === "failed") {
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
  } else {
    const checkAgain = screen.getByRole("button", { name: "Kiểm tra lại" });
    await waitFor(() => expect(checkAgain).toBeEnabled());
    readiness = "ready";
    fireEvent.click(checkAgain);
  }
  expect(await screen.findByTestId("pos-shell")).toBeVisible();
  expect(rpc.mock.calls.map(([name]) => name)).toEqual(initial === "failed"
    ? ["owner_get_seed_readiness", "owner_retry_initial_seed", "owner_get_seed_readiness"]
    : ["owner_get_seed_readiness", "owner_get_seed_readiness"]);
  queries.clear();
});
