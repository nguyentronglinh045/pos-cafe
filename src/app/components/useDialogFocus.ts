import { useLayoutEffect, useRef } from "react";

/** Presentation only: trap keyboard focus in the active top dialog and restore it on close. */
export function useDialogFocus(selector: string, onClose: () => void, active: boolean, label: string) {
  const callback = useRef(onClose);
  const enabled = useRef(active),
    last = useRef<HTMLElement | null>(null);
  callback.current = onClose;
  enabled.current = active;
  const usable = (el: HTMLElement): boolean => el.isConnected && !el.matches(":disabled") && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden";
  useLayoutEffect(() => {
    const root = document.querySelector<HTMLElement>(selector);
    if (!root) return;
    const previous = document.activeElement;
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-label", label);
    root.tabIndex = -1;
    const controls = () => Array.from(root.querySelectorAll<HTMLElement>('button,input,select,textarea,a[href],[tabindex="0"]')).filter(el => !el.matches(":disabled") && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden");
    if (enabled.current) (controls()[0] ?? root).focus({
      preventScroll: true
    });
    const focusin = (event: FocusEvent) => {
      if (event.target instanceof HTMLElement && root.contains(event.target)) last.current = event.target;
    };
    root.addEventListener("focusin", focusin);
    const keydown = (event: KeyboardEvent) => {
      if (!enabled.current || event.defaultPrevented) return;
      if (event.key === "Escape") {
        event.preventDefault();
        callback.current();
      } else if (event.key === "Tab") {
        const all = controls(),
          first = all[0] ?? root,
          last = all[all.length - 1] ?? root;
        if (!root.contains(document.activeElement) || (event.shiftKey ? document.activeElement === first : document.activeElement === last)) {
          event.preventDefault();
          (event.shiftKey ? last : first).focus();
        }
      }
    };
    document.addEventListener("keydown", keydown);
    return () => {
      document.removeEventListener("keydown", keydown);
      root.removeEventListener("focusin", focusin);
      const dialogs = Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"],[data-testid="receipt-preview"]')).filter(usable);
      if (dialogs.length && dialogs[dialogs.length - 1] !== root) return;
      if (previous instanceof HTMLElement && usable(previous)) previous.focus({
        preventScroll: true
      });else document.querySelector<HTMLElement>('[data-testid="nav-floor"],[data-testid="payment-close-button"]')?.focus({
        preventScroll: true
      });
    };
  }, [selector, label]);
  useLayoutEffect(() => {
    if (!active) return;
    const root = document.querySelector<HTMLElement>(selector);
    if (!root) return;
    if (last.current && usable(last.current) && root.contains(last.current)) last.current.focus({
      preventScroll: true
    });else root.querySelector<HTMLElement>('button:not(:disabled),input:not(:disabled)')?.focus({
      preventScroll: true
    });
  }, [active, selector]);
}
