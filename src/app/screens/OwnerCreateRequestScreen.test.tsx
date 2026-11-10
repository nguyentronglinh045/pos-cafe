import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { createMockOwnerOtpServer } from "@/adapters/mock/ownerOtpServer";
import type { RequestCreateStoreOtp } from "@/domain/ownerCreate";
import { OwnerCreateRequestScreen } from "./OwnerCreateRequestScreen";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

it("neo đồng hồ theo phản hồi mới và chỉ gửi lại đúng mốc server", async () => {
  vi.useFakeTimers({ toFake: ["Date", "performance", "setInterval", "clearInterval"] });
  vi.setSystemTime(Date.UTC(2026, 10, 10, 2));
  const mock = createMockOwnerOtpServer();
  let disconnect = true;
  const send = vi.fn(async (input: RequestCreateStoreOtp) => {
    if (disconnect) {
      disconnect = false;
      throw new Error("Mất kết nối trước khi request tới mock");
    }
    return { result: mock.request(input, "192.0.2.1"), serverTime: Date.now() };
  });
  render(<OwnerCreateRequestScreen port={{
    requestCreateStoreOtp: send,
    verifyAndAcceptCreate: vi.fn(),
    getCreateStatus: vi.fn(),
    confirmStoreKeySaved: vi.fn(),
  }} />);
  fireEvent.change(screen.getByLabelText(/^Email chủ quán/), { target: { value: "qa@example.com" } });
  fireEvent.change(screen.getByLabelText(/^Tên quán/), { target: { value: "Quán QA" } });
  fireEvent.change(screen.getByLabelText(/^PIN chủ quán/), { target: { value: "038251" } });
  const button = screen.getByTestId("owner-create-send");
  await act(async () => fireEvent.click(button));
  expect(mock.readTestMailbox()).toHaveLength(0);
  act(() => vi.advanceTimersByTime(20_000));
  await act(async () => fireEvent.click(button));
  expect(send.mock.calls[1][0].requestId).toBe(send.mock.calls[0][0].requestId);
  expect(button).toHaveTextContent("Gửi lại sau 600 giây");
  expect(mock.readTestMailbox()).toHaveLength(1);
  act(() => vi.advanceTimersByTime(599_999));
  expect(button).toBeDisabled();
  act(() => vi.advanceTimersByTime(1));
  expect(button).toBeEnabled();
  await act(async () => fireEvent.click(button));
  expect(send.mock.calls[2][0].intentId).toBe(send.mock.calls[1][0].intentId);
  expect(send.mock.calls[2][0].requestId).not.toBe(send.mock.calls[1][0].requestId);
  expect(mock.readTestMailbox()).toHaveLength(1);
  expect(mock.readTestMailbox()[0].issuedAt).toBe(Date.now());
  expect(button).toBeDisabled();
});
