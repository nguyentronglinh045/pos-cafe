import type { ReactNode } from "react";
const shapes: Record<string, ReactNode> = {
  coffee: <path d="M5 7h12v8a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4zM17 8h2a3 3 0 0 1 0 6h-2M3 22h16M8 2v2m4-2v2" />,
  floor: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
  order: <path d="M7 3h10v3H7zM6 4H4v18h16V4h-3M8 11h8M8 15h8M8 19h5" />,
  users: <><circle cx="9" cy="7" r="4"/><path d="M2 21v-3a7 7 0 0 1 14 0v3M17 4a4 4 0 0 1 0 8m3 9v-3a6 6 0 0 0-2-5"/></>,
  chart: <path d="M3 3v18h18M7 17v-5m5 5V7m5 10V4"/>,
  settings: <><circle cx="12" cy="12" r="4"/><path d="m8 3-1 3-3 1v4l2 1-2 2 1 4 3 1 1 2h5l1-2 3-1 2-4-2-2 2-2V6l-3-1-2-3z"/></>,
  lock: <><rect x="4" y="10" width="16" height="12" rx="2"/><path d="M7 10V6a5 5 0 0 1 10 0v4"/></>,
  refresh: <path d="M20 7V2m0 5h-5M4 17v5m0-5h5M20 7a9 9 0 0 0-15-2M4 17a9 9 0 0 0 15 2"/>,
  store: <><path d="M3 9h18l-2-6H5zM5 10v11h14V10M9 21v-7h6v7"/><path d="M3 9v2a3 3 0 0 0 5 2 3 3 0 0 0 4 0 3 3 0 0 0 4 0 3 3 0 0 0 5-2V9"/></>,
};
export function RemakeIcon({ name }: { name: keyof typeof shapes }) {
  return <svg className="b01-icon" viewBox="0 0 24 24" aria-hidden="true">{shapes[name]}</svg>;
}
