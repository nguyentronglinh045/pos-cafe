import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { ForgotStoreKeyDialog } from "./ForgotStoreKeyDialog";

it("renders the generic status before confirming the mail receipt", async () => {
  const responseText = "Nếu email này đứng tên quán, thư chứa Store Key đã được gửi.";
  let statusAtConfirmation: string | null | undefined;
  const confirmReceipt = vi.fn(async () => {
    statusAtConfirmation = screen.queryByRole("status")?.textContent;
  });
  render(<ForgotStoreKeyDialog port={{ request: async () => ({ kind: "accepted", confirmReceipt }) }} onClose={() => {}} />);

  fireEvent.change(screen.getByRole("textbox", { name: "Email chủ quán" }), { target: { value: "fixture@invalid.test" } });
  fireEvent.click(screen.getByRole("button", { name: "Gửi key hiện tại qua email" }));

  expect(await screen.findByRole("status")).toHaveTextContent(responseText);
  await waitFor(() => expect(confirmReceipt).toHaveBeenCalledOnce());
  expect(statusAtConfirmation).toBe(responseText);
});
