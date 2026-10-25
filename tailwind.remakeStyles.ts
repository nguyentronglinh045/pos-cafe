import plugin from "tailwindcss/plugin";

// B01 presentation derived from owner-approved independent normalized v2.
// All colors remain semantic variables; values are supplied by src/theme/remakeTheme.
export const remakeStyles = plugin(({ addBase, addComponents }) => {
  addBase({ ".ui-remake": { "--workspace-rail-width": "260px" }, "@media (max-width:980px)": { ".ui-remake": { "--workspace-rail-width": "68px" } } });
  addComponents({
  ".ui-remake *": {
    "box-sizing": "border-box"
  },
  ".ui-remake :where(.sidebar,.workspace-header,.workspace,.order-panel) :where(button,input,select)": {
    "font": "inherit"
  },
  ".ui-remake :where(.sidebar,.workspace-header,.workspace,.order-panel) button": {
    "cursor": "pointer"
  },
  ".ui-remake :where(.sidebar,.workspace-header,.workspace,.order-panel) button:disabled": {
    "cursor": "not-allowed",
    "opacity": ".5"
  },
  ".ui-remake :where(.sidebar,.workspace-header,.workspace,.order-panel) button:focus-visible, .ui-remake :where(.sidebar,.workspace-header,.workspace,.order-panel) [tabindex]:focus-visible": {
    "outline": "3px solid var(--primary)",
    "outline-offset": "3px"
  },
  ".ui-remake :where(.sidebar,.workspace-header,.workspace,.order-panel) :is(h1,h2,p)": {
    "margin": "0"
  },
  ".ui-remake .b01-icon": {
    "width": "20px",
    "height": "20px",
    "fill": "none",
    "stroke": "currentColor",
    "stroke-width": "1.7",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    "flex-shrink": "0"
  },
  ".ui-remake [hidden]": {
    "display": "none !important"
  },
  ".ui-remake .app-frame": {
    "height": "100dvh",
    "display": "grid",
    "grid-template-columns": "var(--workspace-rail-width) minmax(0,1fr) 360px",
    "grid-template-rows": "48px minmax(0,1fr)",
    "overflow": "hidden"
  },
  ".ui-remake .sidebar": {
    "grid-column": "1",
    "grid-row": "1/-1",
    "display": "flex",
    "flex-direction": "column",
    "min-height": "0",
    "overflow": "hidden",
    "background": "var(--surface)",
    "border-right": "1px solid var(--line)"
  },
  ".ui-remake .brand": {
    "display": "flex",
    "align-items": "center",
    "gap": "12px",
    "min-height": "96px",
    "padding": "20px 16px",
    "border-bottom": "1px solid var(--line)"
  },
  ".ui-remake .brand-mark, .ui-remake .avatar": {
    "display": "grid",
    "place-items": "center",
    "flex-shrink": "0",
    "background": "var(--primary)",
    "color": "var(--primary-ink)",
    "border-radius": "10px",
    "width": "38px",
    "height": "38px"
  },
  ".ui-remake .brand-copy": {
    "min-width": "0"
  },
  ".ui-remake .brand-copy>strong": {
    "font-size": "19px",
    "line-height": "28px",
    "letter-spacing": "-.4px"
  },
  ".ui-remake .brand-copy p": {
    "min-width": "0",
    "display": "flex",
    "align-items": "center",
    "gap": "7px",
    "font-size": "12px",
    "line-height": "20px"
  },
  ".ui-remake .brand-copy small": {
    "display": "block",
    "margin-left": "15px",
    "color": "var(--muted)",
    "font-size": "11px"
  },
  ".ui-remake .status-dot": {
    "width": "7px",
    "height": "7px",
    "border-radius": "50%",
    "background": "var(--success)",
    "display": "inline-block",
    "flex-shrink": "0"
  },
  ".ui-remake .navigation": {
    "min-height": "0",
    "overflow-y": "auto",
    "overflow-x": "hidden",
    "padding": "12px",
    "display": "grid",
    "align-content": "start",
    "gap": "6px",
    "scrollbar-width": "thin"
  },
  ".ui-remake .nav-button": {
    "position": "relative",
    "display": "flex",
    "align-items": "center",
    "gap": "14px",
    "min-height": "44px",
    "padding": "10px 14px",
    "width": "100%",
    "border": "1px solid transparent",
    "border-radius": "10px",
    "background": "transparent",
    "text-align": "left",
    "color": "var(--muted)",
    "font-size": "14px",
    "line-height": "22px",
    "font-weight": "500",
    "white-space": "nowrap"
  },
  ".ui-remake .nav-button[aria-current=page]": {
    "background": "var(--primary-soft)",
    "color": "var(--primary)",
    "font-weight": "600"
  },
  ".ui-remake .nav-button:hover:not(:disabled)": {
    "background": "var(--surface-2)",
    "color": "var(--primary)"
  },
  ".ui-remake .nav-button[aria-current=page]:hover": {
    "background": "var(--primary-soft)"
  },
  ".ui-remake .sidebar-footer": {
    "margin-top": "auto",
    "padding": "12px",
    "border-top": "1px solid var(--line)",
    "display": "grid",
    "gap": "6px"
  },
  ".ui-remake .session": {
    "padding": "10px",
    "display": "flex",
    "gap": "10px",
    "align-items": "center",
    "min-width": "0",
    "background": "var(--surface-2)",
    "border-radius": "10px"
  },
  ".ui-remake .avatar": {
    "width": "34px",
    "height": "34px",
    "border-radius": "50%",
    "font-size": "13px",
    "font-weight": "600"
  },
  ".ui-remake .session-copy": {
    "min-width": "0",
    "display": "grid",
    "gap": "2px",
    "font-size": "13px",
    "line-height": "20px"
  },
  ".ui-remake .session-copy strong": {
    "overflow": "hidden",
    "text-overflow": "ellipsis",
    "white-space": "nowrap"
  },
  ".ui-remake .session-copy span": {
    "font-size": "11px",
    "color": "var(--muted)"
  },
  ".ui-remake .workspace-header": {
    "grid-column": "2/-1",
    "grid-row": "1",
    "display": "flex",
    "align-items": "center",
    "justify-content": "space-between",
    "gap": "12px",
    "min-width": "0",
    "padding": "0 20px",
    "background": "var(--surface)",
    "border-bottom": "1px solid var(--line)"
  },
  ".ui-remake .breadcrumb, .ui-remake .header-actions": {
    "display": "flex",
    "align-items": "center",
    "gap": "12px",
    "min-width": "0"
  },
  ".ui-remake .breadcrumb>span:first-child": {
    "color": "var(--primary)",
    "display": "flex"
  },
  ".ui-remake .breadcrumb strong": {
    "overflow": "hidden",
    "text-overflow": "ellipsis",
    "white-space": "nowrap",
    "font-size": "13px",
    "font-weight": "600"
  },
  ".ui-remake .breadcrumb-divider, .ui-remake .header-context, .ui-remake .sync-label": {
    "color": "var(--muted)",
    "font-size": "12px"
  },
  ".ui-remake .orders-toggle": {
    "display": "none !important"
  },
  ".ui-remake .workspace": {
    "grid-column": "2",
    "grid-row": "2",
    "min-width": "0",
    "min-height": "0",
    "padding": "16px",
    "overflow": "hidden"
  },
  ".ui-remake .floor-card": {
    "height": "100%",
    "min-height": "0",
    "min-width": "0",
    "display": "grid",
    "grid-template-rows": "auto auto minmax(0,1fr) auto",
    "background": "var(--surface)",
    "border": "1px solid var(--line)",
    "border-radius": "12px",
    "overflow": "hidden"
  },
  ".ui-remake .floor-toolbar": {
    "min-width": "0",
    "display": "flex",
    "align-items": "center",
    "flex-wrap": "wrap",
    "gap": "12px",
    "padding": "12px 14px",
    "border-bottom": "1px solid var(--line)"
  },
  ".ui-remake .floor-title": {
    "margin-right": "auto",
    "min-width": "100px"
  },
  ".ui-remake .floor-title h1": {
    "font-size": "18px",
    "line-height": "26px",
    "font-weight": "700",
    "letter-spacing": "-.3px"
  },
  ".ui-remake .floor-title p": {
    "font-size": "11px",
    "color": "var(--muted)",
    "line-height": "20px"
  },
  ".ui-remake .b01-zones, .ui-remake .status-filters": {
    "display": "flex",
    "gap": "4px",
    "align-items": "center",
    "max-width": "100%",
    "border-radius": "9px",
    "padding": "4px",
    "background": "var(--surface-2)",
    "overflow-x": "auto",
    "scrollbar-width": "thin"
  },
  ".ui-remake .b01-zones button, .ui-remake .status-filters button": {
    "display": "flex",
    "align-items": "center",
    "justify-content": "center",
    "gap": "7px",
    "flex-shrink": "0",
    "min-width": "44px",
    "min-height": "44px",
    "border": "1px solid transparent",
    "border-radius": "7px",
    "padding": "8px 12px",
    "white-space": "nowrap",
    "font-size": "12px",
    "line-height": "20px",
    "font-weight": "500",
    "background": "transparent",
    "color": "var(--muted)"
  },
  ".ui-remake .b01-zones button[aria-pressed=true]": {
    "background": "var(--primary)",
    "color": "var(--primary-ink)",
    "font-weight": "600"
  },
  ".ui-remake .tab-count, .ui-remake .count-badge": {
    "display": "inline-grid",
    "place-items": "center",
    "min-width": "20px",
    "height": "20px",
    "padding": "0 5px",
    "border-radius": "10px",
    "font-size": "10px",
    "line-height": "16px",
    "font-weight": "600",
    "background": "var(--surface-sunk)",
    "color": "var(--ink-2)"
  },
  ".ui-remake .b01-zones button[aria-pressed=true] .tab-count": {
    "background": "var(--primary-ink)",
    "color": "var(--primary)"
  },
  ".ui-remake .status-filters button[aria-pressed=true]": {
    "background": "var(--surface)",
    "color": "var(--primary)",
    "font-weight": "600"
  },
  ".ui-remake .status-filters .empty-dot": {
    "background": "var(--success)"
  },
  ".ui-remake .status-filters .occupied-dot": {
    "background": "var(--warning)"
  },
  ".ui-remake .icon-button, .ui-remake .secondary-button": {
    "min-width": "44px",
    "min-height": "44px",
    "display": "inline-flex",
    "align-items": "center",
    "justify-content": "center",
    "gap": "7px",
    "padding": "8px 10px",
    "border": "1px solid var(--line-control)",
    "border-radius": "8px",
    "background": "var(--surface)",
    "color": "var(--primary)",
    "font-weight": "500",
    "line-height": "20px"
  },
  ".ui-remake .icon-button:hover, .ui-remake .secondary-button:hover": {
    "background": "var(--primary-soft)"
  },
  ".ui-remake .area-summary": {
    "min-height": "46px",
    "display": "flex",
    "align-items": "center",
    "flex-wrap": "wrap",
    "gap": "8px 18px",
    "padding": "10px 16px",
    "background": "var(--primary-soft)",
    "border-bottom": "1px solid var(--line)",
    "font-size": "12px",
    "line-height": "20px"
  },
  ".ui-remake .area-summary>strong:first-child": {
    "min-width": "0",
    "max-width": "100%",
    "overflow": "hidden",
    "text-overflow": "ellipsis",
    "white-space": "nowrap",
    "display": "flex",
    "gap": "9px",
    "align-items": "center",
    "font-weight": "600"
  },
  ".ui-remake .area-summary>strong:first-child svg": {
    "width": "17px",
    "height": "17px",
    "color": "var(--primary)"
  },
  ".ui-remake .area-summary>span": {
    "color": "var(--muted)"
  },
  ".ui-remake .occupancy": {
    "color": "var(--primary)",
    "font-weight": "600"
  },
  ".ui-remake .canvas-viewport": {
    "min-height": "0",
    "min-width": "0",
    "overflow": "auto",
    "position": "relative",
    "padding": "16px",
    "outline-offset": "-4px !important",
    "scrollbar-width": "thin"
  },
  ".ui-remake .canvas-size": {
    "position": "relative",
    "margin": "auto"
  },
  ".ui-remake .logical-floor": {
    "position": "absolute",
    "top": "0",
    "left": "0",
    "width": "1600px",
    "height": "900px",
    "transform-origin": "top left",
    "background-color": "var(--surface-2)",
    "background-image": "linear-gradient(90deg,color-mix(in srgb,var(--line) 45%,transparent) 1px,transparent 1px),linear-gradient(color-mix(in srgb,var(--line) 45%,transparent) 1px,transparent 1px)",
    "background-size": "60px 60px",
    "border": "1px solid var(--line)",
    "border-radius": "8px",
    "overflow": "hidden"
  },
  ".ui-remake .b01-decoration": {
    "position": "absolute",
    "display": "flex",
    "align-items": "center",
    "justify-content": "center",
    "overflow": "hidden",
    "pointer-events": "none"
  },
  ".ui-remake .b01-decoration img": {
    "width": "100%",
    "height": "100%",
    "object-fit": "fill"
  },
  ".ui-remake .b01-table": {
    "position": "absolute",
    "display": "grid",
    "place-items": "center",
    "border": "2px solid var(--success)",
    "border-radius": "8px",
    "background-color": "var(--surface)",
    "background-size": "cover",
    "background-position": "center",
    "box-shadow": "0 8px 18px color-mix(in srgb,var(--ink) 10%,transparent)",
    "padding": "0",
    "color": "var(--ink)"
  },
  ".ui-remake .b01-table[data-status=occupied]": {
    "border-color": "var(--warning)"
  },
  ".ui-remake .b01-table.round": {
    "border-radius": "50%"
  },
  ".ui-remake .table-label": {
    "display": "grid",
    "place-items": "center",
    "gap": "2px",
    "padding": "4px 8px",
    "border-radius": "6px",
    "background": "color-mix(in srgb,var(--surface) 85%,transparent)",
    "transform-origin": "center",
    "line-height": "1"
  },
  ".ui-remake .table-label strong": {
    "font-size": "13px",
    "font-weight": "700",
    "line-height": "13px"
  },
  ".ui-remake .table-label small": {
    "font-size": "11px",
    "font-weight": "600",
    "line-height": "11px",
    "color": "var(--warning)"
  },
  ".ui-remake .floor-footer": {
    "display": "flex",
    "justify-content": "space-between",
    "gap": "8px",
    "padding": "7px 14px",
    "border-top": "1px solid var(--line)",
    "font-size": "11px",
    "line-height": "18px",
    "color": "var(--muted)"
  },
  ".ui-remake .state-message": { "overflow": "auto", "align-content": "safe center",
    "min-height": "0",
    "padding": "24px",
    "display": "grid",
    "place-content": "center",
    "justify-items": "center",
    "gap": "12px",
    "text-align": "center",
    "color": "var(--muted)",
    "font-size": "14px"
  },
  ".ui-remake .state-message .error-icon": {
    "color": "var(--warning)",
    "font-size": "28px"
  },
  ".ui-remake .order-panel": {
    "grid-column": "3",
    "grid-row": "2",
    "display": "flex",
    "flex-direction": "column",
    "min-height": "0",
    "min-width": "0",
    "border-left": "1px solid var(--line)",
    "background": "var(--surface)"
  },
  ".ui-remake .order-panel-header": {
    "display": "flex",
    "align-items": "center",
    "justify-content": "space-between",
    "gap": "8px",
    "padding": "18px 16px",
    "border-bottom": "1px solid var(--line)",
    "min-height": "64px"
  },
  ".ui-remake .order-panel h2": {
    "display": "flex",
    "align-items": "center",
    "gap": "9px",
    "font-size": "15px",
    "line-height": "24px",
    "font-weight": "600"
  },
  ".ui-remake .count-badge": {
    "background": "var(--primary-soft)",
    "color": "var(--primary)"
  },
  ".ui-remake .close-orders": {
    "display": "none"
  },
  ".ui-remake .order-list": {
    "overflow": "auto",
    "min-height": "0",
    "flex": "1",
    "padding": "16px",
    "display": "grid",
    "align-content": "start",
    "gap": "10px"
  },
  ".ui-remake .order-group-label": {
    "padding": "6px 0 2px",
    "color": "var(--muted)",
    "font-size": "11px",
    "font-weight": "600",
    "letter-spacing": ".6px",
    "text-transform": "uppercase"
  },
  ".ui-remake .order-card": {
    "min-height": "100px",
    "display": "grid",
    "gap": "8px",
    "border": "1px solid var(--line)",
    "border-radius": "12px",
    "padding": "14px",
    "background": "var(--surface)",
    "text-align": "left",
    "color": "var(--ink)"
  },
  ".ui-remake .order-card:hover": {
    "border-color": "var(--primary)"
  },
  ".ui-remake .order-card-top, .ui-remake .order-card-bottom": {
    "display": "flex",
    "justify-content": "space-between",
    "align-items": "center",
    "gap": "8px"
  },
  ".ui-remake .order-card-top strong": {
    "min-width": "0",
    "overflow": "hidden",
    "text-overflow": "ellipsis",
    "white-space": "nowrap",
    "font-size": "14px",
    "line-height": "22px",
    "font-weight": "600"
  },
  ".ui-remake .order-number": {
    "font-size": "12px",
    "line-height": "20px",
    "color": "var(--muted)"
  },
  ".ui-remake .order-status": {
    "display": "inline-flex",
    "align-items": "center",
    "gap": "6px",
    "color": "var(--primary)",
    "font-size": "11px",
    "line-height": "18px",
    "font-weight": "500"
  },
  ".ui-remake .order-total": {
    "overflow-wrap": "anywhere",
    "min-width": "0",
    "font-size": "16px",
    "line-height": "24px",
    "font-weight": "700",
    "color": "var(--primary)"
  },
  ".ui-remake .order-card-hint": {
    "font-size": "11px",
    "line-height": "18px",
    "color": "var(--muted)"
  },
  ".ui-remake .order-panel-footer": {
    "margin-top": "auto",
    "padding": "14px 16px",
    "border-top": "1px solid var(--line)",
    "font-size": "11px",
    "line-height": "20px",
    "color": "var(--muted)"
  },
  "@media (max-width:1279px)": {
    ".ui-remake .app-frame": {
      "grid-template-columns": "var(--workspace-rail-width) minmax(0,1fr)"
    },
    ".ui-remake .workspace-header": {
      "grid-column": "2"
    },
    ".ui-remake .orders-toggle": {
      "display": "inline-flex !important",
      "font-size": "12px"
    },
    ".ui-remake .order-panel": {
      "display": "none",
      "position": "absolute",
      "right": "0",
      "top": "48px",
      "bottom": "0",
      "width": "360px",
      "max-width": "calc(100vw - 68px)",
      "z-index": "5",
      "box-shadow": "-8px 0 24px color-mix(in srgb,var(--ink) 12%,transparent)"
    },
    ".ui-remake .order-panel.open": {
      "display": "flex"
    },
    ".ui-remake .close-orders": {
      "display": "inline-flex"
    },
    ".ui-remake .workspace": {
      "grid-column": "2"
    },
    ".ui-remake .sync-label": {
      "display": "none"
    }
  },
  "@media (max-width:980px)": {
    ".ui-remake .app-frame": {
      "grid-template-columns": "var(--workspace-rail-width) minmax(0,1fr)"
    },
    ".ui-remake .brand": {
      "min-height": "68px",
      "justify-content": "center",
      "padding": "12px 6px"
    },
    ".ui-remake .brand-mark": {
      "width": "36px",
      "height": "36px"
    },
    ".ui-remake .brand-copy, .ui-remake .session-copy, .ui-remake .nav-label, .ui-remake .header-context, .ui-remake .breadcrumb-divider": {
      "position": "absolute",
      "width": "1px",
      "height": "1px",
      "padding": "0",
      "margin": "-1px",
      "overflow": "hidden",
      "clip": "rect(0,0,0,0)",
      "white-space": "nowrap",
      "border": "0"
    },
    ".ui-remake .navigation": {
      "padding": "8px 6px",
      "gap": "4px"
    },
    ".ui-remake .nav-button": {
      "min-height": "44px",
      "justify-content": "center",
      "gap": "0",
      "padding": "10px"
    },
    ".ui-remake .sidebar-footer": {
      "padding": "8px 6px",
      "gap": "4px"
    },
    ".ui-remake .session": {
      "padding": "6px",
      "justify-content": "center"
    },
    ".ui-remake .brand, .ui-remake .session, .ui-remake .nav-button, .ui-remake .sidebar": {
      "position": "relative"
    },
    ".ui-remake .workspace-header": {
      "padding": "0 10px",
      "gap": "8px"
    },
    ".ui-remake .header-actions": {
      "gap": "6px"
    },
    ".ui-remake .breadcrumb": {
      "gap": "6px"
    },
    ".ui-remake .workspace": {
      "padding": "8px"
    },
    ".ui-remake .floor-toolbar": {
      "padding": "8px",
      "gap": "8px"
    },
    ".ui-remake .floor-title": {
      "flex": "1",
      "min-width": "100px"
    },
    ".ui-remake .floor-title h1": {
      "font-size": "16px",
      "line-height": "24px"
    },
    ".ui-remake .floor-title p": {
      "display": "none"
    },
    ".ui-remake .b01-zones": {
      "max-width": "calc(100% - 52px)"
    },
    ".ui-remake .b01-zones button, .ui-remake .status-filters button": {
      "padding": "8px"
    },
    ".ui-remake .status-filters": {
      "order": "4",
      "flex": "1",
      "justify-content": "flex-start"
    },
    ".ui-remake .refresh-button": {
      "order": "5"
    },
    ".ui-remake .area-summary": {
      "padding": "7px 10px",
      "gap": "4px 12px",
      "font-size": "11px",
      "min-height": "40px"
    },
    ".ui-remake .canvas-viewport": {
      "padding": "8px"
    },
    ".ui-remake .floor-footer": {
      "font-size": "10px",
      "padding": "5px 10px",
      "line-height": "16px"
    }
  },
  ".ui-remake .brand-copy p>span:last-child": {
    "overflow": "hidden",
    "text-overflow": "ellipsis",
    "white-space": "nowrap"
  },
  ".ui-remake .b01-zones button": {
    "max-width": "240px"
  },
  ".ui-remake .order-card-bottom": {
    "flex-wrap": "wrap"
  },
  ".ui-remake .b01-decoration:has([data-floor-label])": {
    "border": "1px dashed var(--line-control)",
    "background": "var(--surface-2)",
    "color": "var(--muted)"
  },
  ".ui-remake .b01-zone-name, .ui-remake .area-summary>strong span": {
    "overflow": "hidden",
    "text-overflow": "ellipsis",
    "white-space": "nowrap",
    "min-width": "0"
  },
  ".ui-remake .b01-table .table-label strong": {
    "overflow": "hidden",
    "text-overflow": "ellipsis",
    "white-space": "nowrap",
    "max-width": "100%"
  },
  ".ui-remake .b01-table .table-label": {
    "min-width": "0"
  },
  "@media (max-height:480px)": {
    ".ui-remake .floor-toolbar": {
      "flex-wrap": "nowrap"
    },
    ".ui-remake .floor-title": {
      "flex": "0 0 auto",
      "min-width": "100px"
    },
    ".ui-remake .floor-title p": {
      "display": "none"
    },
    ".ui-remake .b01-zones": {
      "min-width": "0"
    },
    ".ui-remake .status-filters": {
      "min-width": "44px"
    },
    ".ui-remake .refresh-button": {
      "flex-shrink": "0"
    },
    ".ui-remake .area-summary": {
      "flex-wrap": "nowrap",
      "overflow": "hidden"
    },
    ".ui-remake .area-summary>span": {
      "white-space": "nowrap",
      "overflow": "hidden",
      "text-overflow": "ellipsis"
    },
    ".ui-remake .occupancy": {
      "white-space": "nowrap",
      "flex-shrink": "0"
    }
  },
  ".ui-remake [data-testid=\"payment-method-list\"] button>span:last-child>span:first-child": {
    "white-space": "normal",
    "overflow-wrap": "break-word"
  }
});
});
