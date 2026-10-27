import { QueryClient, QueryClientProvider, focusManager, onlineManager } from "@tanstack/react-query";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PermissionCode } from "@/domain/permissions";
import { createCandidateRuntimeFixture } from "@/test/candidateRuntimeFixture";
import { usePurposeQuery } from "@/features/pos/usePosData";
import { usePurposeQuery as throughPosBarrel } from "@/features/pos";
import { usePurposeQuery as sharedQuery } from "./usePurposeQuery";
import { usePermissionSession } from "./permissionSession";

const clients: QueryClient[] = [];
afterEach(() => {
  cleanup();
  clients.splice(0).forEach((client) => client.clear());
  usePermissionSession.getState().clear();
  focusManager.setFocused(undefined);
  onlineManager.setOnline(true);
  vi.useRealTimers();
});

async function establish(denies: PermissionCode[] = []) {
  const fixture = await createCandidateRuntimeFixture({ overrides: { grants: [], denies } });
  act(() => usePermissionSession.getState().begin(fixture.session));
  return fixture;
}

function mountQuery(read: () => Promise<string>, options: {
  codes?: PermissionCode[]; enabled?: boolean; live?: boolean; purpose?: string; args?: unknown[];
} = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(client);
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  const hook = renderHook(() => usePurposeQuery(options.purpose ?? "report", options.codes ?? ["report.view"],
    options.args ?? [], read, options.enabled ?? true, options.live ?? false), { wrapper });
  return { ...hook, client };
}

describe("shared purpose query contract before moving its owner", () => {
  it("preserves one function identity through shared, legacy POS and barrel exports", () => {
    expect(usePurposeQuery).toBe(sharedQuery);
    expect(throughPosBarrel).toBe(sharedQuery);
  });

  it.each(["disabled", "denied", "unverified"])("does not read when %s", async (condition) => {
    await establish(condition === "denied" ? ["report.view"] : []);
    if (condition === "unverified") act(() => usePermissionSession.getState().setStatus("unverified"));
    const read = vi.fn(async () => "unexpected");
    const { result } = mountQuery(read, { enabled: condition !== "disabled" });
    await act(async () => { await Promise.resolve(); });
    expect(result.current.fetchStatus).toBe("idle");
    expect(result.current.status).toBe("pending");
    expect(result.current.error).toBeNull();
    expect(result.current.data).toBeUndefined();
    expect(read).not.toHaveBeenCalled();
  });

  it.each(["denied", "unverified"])("guards a manual refetch before reading when %s", async (condition) => {
    await establish(condition === "denied" ? ["report.view"] : []);
    if (condition === "unverified") act(() => usePermissionSession.getState().setStatus("unverified"));
    const read = vi.fn(async () => "unexpected protected data");
    const { result } = mountQuery(read);
    // Read the displayed state before the action so React Query tracks it for
    // notifications, as a component rendering the status would do.
    expect(result.current.status).toBe("pending");
    await act(async () => {
      const refetched = await result.current.refetch();
      expect(refetched.error).toMatchObject({ code: "FORBIDDEN" });
    });
    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.error).toMatchObject({ code: "FORBIDDEN" });
    expect(read).not.toHaveBeenCalled();
  });

  it("allows any granted code and keys the result by identity, generation, purpose and arguments", async () => {
    const fixture = await establish(["report.view"]);
    const generation = usePermissionSession.getState().generation;
    const read = vi.fn(async () => "allowed by floor permission");
    const filter = { fromDate: "2026-10-01", toDate: "2026-10-27" };
    const { result, client } = mountQuery(read, { codes: ["report.view", "floor.view"], purpose: "test-purpose", args: [filter] });
    await waitFor(() => expect(result.current.data).toBe("allowed by floor permission"));
    expect(read).toHaveBeenCalledTimes(1);
    expect(client.getQueryCache().getAll().map((query) => query.queryKey)).toEqual([
      ["permission", fixture.state.storeId, fixture.owner.id, generation, "test-purpose", filter],
    ]);
  });

  it("allows a verified display query with no permission codes", async () => {
    await establish();
    const read = vi.fn(async () => "store display");
    const { result } = mountQuery(read, { codes: [], purpose: "display" });
    await waitFor(() => expect(result.current.data).toBe("store display"));
    expect(read).toHaveBeenCalledTimes(1);
  });

  it("polls live reads every five seconds only in the foreground", async () => {
    await establish();
    vi.useFakeTimers();
    focusManager.setFocused(true);
    const read = vi.fn(async () => "live data");
    mountQuery(read, { live: true });
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    expect(read).toHaveBeenCalledTimes(1);
    await act(async () => { await vi.advanceTimersByTimeAsync(4999); });
    expect(read).toHaveBeenCalledTimes(1);
    await act(async () => { await vi.advanceTimersByTimeAsync(1); });
    expect(read).toHaveBeenCalledTimes(2);
    act(() => focusManager.setFocused(false));
    await act(async () => { await vi.advanceTimersByTimeAsync(5000); });
    expect(read).toHaveBeenCalledTimes(2);
    act(() => focusManager.setFocused(true));
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    expect(read).toHaveBeenCalledTimes(2);
    await act(async () => { await vi.advanceTimersByTimeAsync(5000); });
    expect(read).toHaveBeenCalledTimes(3);
  });

  it("does not poll a nonlive read or refetch merely on focus/reconnect", async () => {
    await establish();
    vi.useFakeTimers();
    focusManager.setFocused(true);
    const read = vi.fn(async () => "stable data");
    mountQuery(read);
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    expect(read).toHaveBeenCalledTimes(1);
    act(() => { focusManager.setFocused(false); onlineManager.setOnline(false); });
    await act(async () => { await vi.advanceTimersByTimeAsync(10000); });
    act(() => { focusManager.setFocused(true); onlineManager.setOnline(true); });
    await act(async () => { await vi.advanceTimersByTimeAsync(10000); });
    expect(read).toHaveBeenCalledTimes(1);
  });

  it.each(["generation", "revision", "catalog revision", "revocation"])("discards a late read after %s changes", async (change) => {
    const fixture = await establish();
    let resolve!: (value: string) => void;
    const pending = new Promise<string>((done) => { resolve = done; });
    const read = vi.fn(() => pending);
    const { result, client } = mountQuery(read);
    await waitFor(() => expect(read).toHaveBeenCalledTimes(1));
    const oldQuery = client.getQueryCache().getAll()[0];
    if (change === "generation") {
      act(() => usePermissionSession.getState().clear());
    } else {
      if (change === "catalog revision") fixture.state.catalog.revision++;
      else fixture.owner.permissionRevision++;
      if (change === "revocation") fixture.owner.overrides = { grants: [], denies: ["report.view"] };
      const authority = await fixture.ports.permission!.authority.getAuthority();
      act(() => usePermissionSession.getState().apply(authority));
    }
    await act(async () => { resolve("stale protected data"); });
    await waitFor(() => expect(oldQuery.state.fetchStatus).toBe("idle"));
    expect(oldQuery.state.data).toBeUndefined();
    expect(oldQuery.state.error).toMatchObject({ code: "FORBIDDEN" });
    expect(result.current.data).toBeUndefined();
  });
});
