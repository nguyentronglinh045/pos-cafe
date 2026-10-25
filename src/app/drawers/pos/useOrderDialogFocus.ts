import { useLayoutEffect, useRef } from "react";

/** Presentation only: keyboard navigation invokes the existing cancel/keep action. */
export function useOrderDialogFocus(selector: string, onEscape: () => void) {
  const escape = useRef(onEscape);
  escape.current = onEscape;
  useLayoutEffect(() => {
    const root = document.querySelector<HTMLElement>(selector);
    if (!root) return;
    const visible = (element: HTMLElement) => !element.closest('[aria-hidden="true"], [inert]')
      && getComputedStyle(element).visibility !== "hidden" && element.getClientRects().length > 0;
    const previous = document.activeElement;
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-label", root.querySelector("h1, h3")?.textContent ?? "Gọi món");
    root.setAttribute("data-b02-dialog", "");
    root.tabIndex = -1;
    const controls = () => Array.from(root.querySelectorAll<HTMLElement>('button, input, select, textarea, [tabindex="0"]'))
      .filter(element => !element.matches(":disabled") && visible(element));
    if (visible(root)) (controls()[0] ?? root).focus({ preventScroll: true });
    const onKeyDown = (event: KeyboardEvent) => {
      const dialogs = [...document.querySelectorAll<HTMLElement>("[data-b02-dialog]")].filter(visible);
      if (!visible(root) || dialogs[dialogs.length - 1] !== root || event.defaultPrevented) return;
      if (event.key === "Escape") {
        event.preventDefault();
        escape.current();
      } else if (event.key === "Tab") {
        const items = controls();
        const first = items[0] ?? root, last = items[items.length - 1] ?? root;
        if (!root.contains(document.activeElement) || (event.shiftKey ? document.activeElement === first : document.activeElement === last)) {
          event.preventDefault();
          (event.shiftKey ? last : first).focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (previous instanceof HTMLElement && previous.isConnected && visible(previous)) previous.focus({ preventScroll: true });
    };
  }, [selector]);
}
