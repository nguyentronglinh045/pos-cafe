import { useLayoutEffect } from "react";

/** Keep the drawer inside the visible area when a software keyboard covers the layout viewport. */
export function usePaymentViewport() {
  useLayoutEffect(() => {
    const viewport = window.visualViewport;
    const overlay = document.querySelector<HTMLElement>(".b03-backdrop");
    if (!viewport || !overlay) return;
    const update = () => {
      if (viewport.height < window.innerHeight - 1) {
        const zoom = Number.parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
        overlay.style.setProperty("--b03-visible-height", `${viewport.height / zoom}px`);
        overlay.style.setProperty("--b03-visible-top", `${viewport.offsetTop / zoom}px`);
      } else {
        overlay.style.removeProperty("--b03-visible-height");
        overlay.style.removeProperty("--b03-visible-top");
      }
    };
    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, []);
}
