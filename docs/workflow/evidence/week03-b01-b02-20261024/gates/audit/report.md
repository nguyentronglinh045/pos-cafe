# UI audit report

generated: 2026-10-24T08:55:23.730Z
targets: 13 x viewports: 3
findings: 37 total, 33 not in baseline

setup failures: 0
coverage: 39/39 completed
status: COMPLETE

## By severity

| severity | total | new |
| --- | ---: | ---: |
| warn | 17 | 14 |
| error | 13 | 12 |
| info | 7 | 7 |

## By rule

| rule | severity | total | new |
| --- | --- | ---: | ---: |
| `tiny-target` | warn | 9 | 6 |
| `clipped-text-vertical` | info | 7 | 7 |
| `clipped-text` | warn | 6 | 6 |
| `zero-size-interactive` | error | 4 | 4 |
| `no-accessible-name` | error | 3 | 3 |
| `clipped-interactive` | error | 3 | 3 |
| `empty-icon` | error | 2 | 2 |
| `tiny-font` | warn | 2 | 2 |
| `hit-blocked` | error | 1 | 0 |

## By target

| target | viewport | total | new |
| --- | --- | ---: | ---: |
| store-pairing | tablet | 1 | 0 |
| store-pairing | desktop | 1 | 0 |
| store-pairing | mobile | 1 | 0 |
| floor | tablet | 5 | 5 |
| floor | desktop | 2 | 2 |
| floor | mobile | 12 | 12 |
| menu-editor | mobile | 2 | 2 |
| report | mobile | 1 | 0 |
| settings | tablet | 1 | 1 |
| settings | desktop | 1 | 1 |
| payment | tablet | 3 | 3 |
| payment | desktop | 3 | 3 |
| payment | mobile | 4 | 4 |

## Findings

### `clipped-interactive` (error)
- target: **menu-editor** / mobile
- selector: `div.grid.h-full > section.grid.h-full > div.flex.min-h-11:nth-of-type(1) > div.flex.min-w-0 > button.inline-flex.min-h-8:nth-of-type(5)`
- detail: control is outside a non-scrollable clipped ancestor
- text: "Danh mục"
- rect: 110x32 at (505, 73)

### `clipped-interactive` (error) x3
- target: **menu-editor** / mobile
- selector: `div.grid.content-start > div.grid.min-h-[104px]:nth-of-type(2) > div.grid.min-w-0:nth-of-type(2) > div.flex.flex-wrap:nth-of-type(2) > button.inline-flex.h-7:nth-of-type(2)`
- detail: control is outside a non-scrollable clipped ancestor
- text: "Xóa"
- rect: 31x28 at (512, 213)

### `clipped-interactive` (error)
- target: **payment** / mobile
- selector: `aside.grid.min-h-0 > section.grid.min-h-0:nth-of-type(2) > div.flex.items-center:nth-of-type(1) > label.flex.cursor-pointer > input.size-4.accent-pos-primary`
- detail: control is outside a non-scrollable clipped ancestor
- text: "Chọn tất cả"
- rect: 16x16 at (550, 127)

### `empty-icon` (error)
- target: **floor** / tablet
- selector: `#floor-order-panel > header.order-panel-header > button.icon-button.close-orders`
- detail: icon rendered 0x0, font or glyph missing
- text: "Đóng danh sách đơn"
- rect: 0x0 at (0, 0)

### `empty-icon` (error)
- target: **floor** / mobile
- selector: `#floor-order-panel > header.order-panel-header > button.icon-button.close-orders`
- detail: icon rendered 0x0, font or glyph missing
- text: "Đóng danh sách đơn"
- rect: 0x0 at (0, 0)

### `hit-blocked` (error) - baseline x4
- target: **report** / mobile
- selector: `div.min-h-0.overflow-hidden > aside.grid.min-h-0 > div.grid.min-h-0:nth-of-type(2) > div.grid.content-start:nth-of-type(2) > button.flex.cursor-pointer:nth-of-type(1)`
- detail: centre point hits <div.flex> instead
- text: "Tổng quan 0 đơn"
- rect: 808x41 at (18, 191)

### `no-accessible-name` (error) x3
- target: **payment** / tablet
- selector: `div.min-h-0.overflow-y-auto:nth-of-type(2) > div.grid.gap-2 > article.rounded-pos.border:nth-of-type(1) > div.grid.grid-cols-[auto_minmax(0,1fr)_auto]:nth-of-type(1) > input.size-4.accent-pos-primary`
- detail: no text, aria-label, title or alt
- rect: 16x16 at (707, 222)

### `no-accessible-name` (error) x3
- target: **payment** / desktop
- selector: `div.min-h-0.overflow-y-auto:nth-of-type(2) > div.grid.gap-2 > article.rounded-pos.border:nth-of-type(1) > div.grid.grid-cols-[auto_minmax(0,1fr)_auto]:nth-of-type(1) > input.size-4.accent-pos-primary`
- detail: no text, aria-label, title or alt
- rect: 16x16 at (1123, 228)

### `no-accessible-name` (error) x3
- target: **payment** / mobile
- selector: `div.min-h-0.overflow-y-auto:nth-of-type(2) > div.grid.gap-2 > article.rounded-pos.border:nth-of-type(1) > div.grid.grid-cols-[auto_minmax(0,1fr)_auto]:nth-of-type(1) > input.size-4.accent-pos-primary`
- detail: no text, aria-label, title or alt
- rect: 16x16 at (555, 178)

### `zero-size-interactive` (error)
- target: **floor** / tablet
- selector: `#floor-order-panel > header.order-panel-header > button.icon-button.close-orders`
- detail: clickable element rendered 0x0
- text: "Đóng danh sách đơn"
- rect: 0x0 at (0, 0)

### `zero-size-interactive` (error) x3
- target: **floor** / tablet
- selector: `#floor-order-panel > div.order-list > button.order-card:nth-of-type(1)`
- detail: clickable element rendered 0x0
- text: "B02#24Đang phục vụ125.000đMở đơn hàng →"
- rect: 0x0 at (0, 0)

### `zero-size-interactive` (error)
- target: **floor** / mobile
- selector: `#floor-order-panel > header.order-panel-header > button.icon-button.close-orders`
- detail: clickable element rendered 0x0
- text: "Đóng danh sách đơn"
- rect: 0x0 at (0, 0)

### `zero-size-interactive` (error) x3
- target: **floor** / mobile
- selector: `#floor-order-panel > div.order-list > button.order-card:nth-of-type(1)`
- detail: clickable element rendered 0x0
- text: "B02#24Đang phục vụ125.000đMở đơn hàng →"
- rect: 0x0 at (0, 0)

### `clipped-text` (warn)
- target: **floor** / tablet
- selector: `div.workspace > section.floor-card > div.area-navigation:nth-of-type(2) > div.area-metrics:nth-of-type(2) > strong.b01-area-only:nth-of-type(1)`
- detail: content 51px clipped to 1px, no text-overflow
- text: "Tầng trệt"
- rect: 1x1 at (904, 151)

### `clipped-text` (warn)
- target: **floor** / desktop
- selector: `div.workspace > section.floor-card > div.area-navigation:nth-of-type(2) > div.area-metrics:nth-of-type(2) > strong.b01-area-only:nth-of-type(1)`
- detail: content 51px clipped to 1px, no text-overflow
- text: "Tầng trệt"
- rect: 1x1 at (960, 151)

### `clipped-text` (warn) x10
- target: **floor** / mobile
- selector: `main.app-frame.[@media(orientation:portrait)]:hidden > aside.sidebar:nth-of-type(1) > nav.navigation > button.nav-button:nth-of-type(1) > span.nav-label`
- detail: content 70px clipped to 1px, no text-overflow
- text: "Sơ đồ bàn"
- rect: 1x1 at (33, 98)

### `clipped-text` (warn)
- target: **floor** / mobile
- selector: `main.app-frame.[@media(orientation:portrait)]:hidden > aside.sidebar:nth-of-type(1) > footer.sidebar-footer > button.nav-button.lock-button > span.nav-label`
- detail: content 36px clipped to 1px, no text-overflow
- text: "Khoá"
- rect: 1x1 at (33, 360)

### `clipped-text` (warn)
- target: **floor** / mobile
- selector: `#root > main.app-frame.[@media(orientation:portrait)]:hidden > header.workspace-header > div.breadcrumb:nth-of-type(1) > span.header-context:nth-of-type(3)`
- detail: content 112px clipped to 1px, no text-overflow
- text: "Vận hành bán hàng"
- rect: 1x1 at (77, 23)

### `clipped-text` (warn)
- target: **floor** / mobile
- selector: `div.workspace > section.floor-card > div.area-navigation:nth-of-type(2) > div.area-metrics:nth-of-type(2) > strong.b01-area-only:nth-of-type(1)`
- detail: content 51px clipped to 1px, no text-overflow
- text: "Tầng trệt"
- rect: 1x1 at (738, 124)

### `tiny-font` (warn)
- target: **settings** / tablet
- selector: `div.min-h-0.overflow-hidden > div.grid.h-full > aside.grid.min-h-0 > div.grid.gap-0.5:nth-of-type(2) > span.text-[9.5px].font-black`
- detail: font-size 9.5px
- text: "MÃ QUÁN"
- rect: 209x14 at (28, 705)

### `tiny-font` (warn)
- target: **settings** / desktop
- selector: `div.min-h-0.overflow-hidden > div.grid.h-full > aside.grid.min-h-0 > div.grid.gap-0.5:nth-of-type(2) > span.text-[9.5px].font-black`
- detail: font-size 9.5px
- text: "MÃ QUÁN"
- rect: 209x14 at (28, 837)

### `tiny-target` (warn) - baseline
- target: **store-pairing** / tablet
- selector: `main.box-border.grid > div.w-[min(960px,100%)].overflow-hidden > div.grid.grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] > div.grid.gap-4 > button.cursor-pointer.border-0:nth-of-type(2)`
- detail: 443x20px < 24px
- text: "Chưa có quán? Tạo quán mới"
- rect: 443x20 at (73, 515)

### `tiny-target` (warn)
- target: **payment** / tablet
- selector: `aside.grid.min-h-0 > section.grid.min-h-0:nth-of-type(2) > div.flex.items-center:nth-of-type(1) > label.flex.cursor-pointer > input.size-4.accent-pos-primary`
- detail: 118x20px < 24px
- text: "Chọn tất cả"
- rect: 16x16 at (698, 163)

### `tiny-target` (warn) x3
- target: **payment** / tablet
- selector: `div.min-h-0.overflow-y-auto:nth-of-type(2) > div.grid.gap-2 > article.rounded-pos.border:nth-of-type(1) > div.grid.grid-cols-[auto_minmax(0,1fr)_auto]:nth-of-type(1) > input.size-4.accent-pos-primary`
- detail: 16x16px < 24px
- rect: 16x16 at (707, 222)

### `tiny-target` (warn) - baseline
- target: **store-pairing** / desktop
- selector: `main.box-border.grid > div.w-[min(960px,100%)].overflow-hidden > div.grid.grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] > div.grid.gap-4 > button.cursor-pointer.border-0:nth-of-type(2)`
- detail: 443x20px < 24px
- text: "Chưa có quán? Tạo quán mới"
- rect: 443x20 at (281, 581)

### `tiny-target` (warn)
- target: **payment** / desktop
- selector: `aside.grid.min-h-0 > section.grid.min-h-0:nth-of-type(2) > div.flex.items-center:nth-of-type(1) > label.flex.cursor-pointer > input.size-4.accent-pos-primary`
- detail: 124x21px < 24px
- text: "Chọn tất cả"
- rect: 16x16 at (1114, 168)

### `tiny-target` (warn) x3
- target: **payment** / desktop
- selector: `div.min-h-0.overflow-y-auto:nth-of-type(2) > div.grid.gap-2 > article.rounded-pos.border:nth-of-type(1) > div.grid.grid-cols-[auto_minmax(0,1fr)_auto]:nth-of-type(1) > input.size-4.accent-pos-primary`
- detail: 16x16px < 24px
- rect: 16x16 at (1123, 228)

### `tiny-target` (warn) - baseline
- target: **store-pairing** / mobile
- selector: `main.box-border.grid > div.w-[min(960px,100%)].overflow-hidden > div.grid.grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] > div.grid.gap-4 > button.cursor-pointer.border-0:nth-of-type(2)`
- detail: 374x20px < 24px
- text: "Chưa có quán? Tạo quán mới"
- rect: 374x20 at (51, 333)

### `tiny-target` (warn)
- target: **payment** / mobile
- selector: `aside.grid.min-h-0 > section.grid.min-h-0:nth-of-type(2) > div.flex.items-center:nth-of-type(1) > label.flex.cursor-pointer > input.size-4.accent-pos-primary`
- detail: 16x16px < 24px
- text: "Chọn tất cả"
- rect: 16x16 at (550, 127)

### `tiny-target` (warn) x3
- target: **payment** / mobile
- selector: `div.min-h-0.overflow-y-auto:nth-of-type(2) > div.grid.gap-2 > article.rounded-pos.border:nth-of-type(1) > div.grid.grid-cols-[auto_minmax(0,1fr)_auto]:nth-of-type(1) > input.size-4.accent-pos-primary`
- detail: 16x16px < 24px
- rect: 16x16 at (555, 178)

### `clipped-text-vertical` (info)
- target: **floor** / tablet
- selector: `div.workspace > section.floor-card > div.area-navigation:nth-of-type(2) > div.area-metrics:nth-of-type(2) > strong.b01-area-only:nth-of-type(1)`
- detail: content 18px clipped to 1px tall
- text: "Tầng trệt"
- rect: 1x1 at (904, 151)

### `clipped-text-vertical` (info)
- target: **floor** / desktop
- selector: `div.workspace > section.floor-card > div.area-navigation:nth-of-type(2) > div.area-metrics:nth-of-type(2) > strong.b01-area-only:nth-of-type(1)`
- detail: content 18px clipped to 1px tall
- text: "Tầng trệt"
- rect: 1x1 at (960, 151)

### `clipped-text-vertical` (info) x10
- target: **floor** / mobile
- selector: `main.app-frame.[@media(orientation:portrait)]:hidden > aside.sidebar:nth-of-type(1) > nav.navigation > button.nav-button:nth-of-type(1) > span.nav-label`
- detail: content 22px clipped to 1px tall
- text: "Sơ đồ bàn"
- rect: 1x1 at (33, 98)

### `clipped-text-vertical` (info)
- target: **floor** / mobile
- selector: `aside.sidebar:nth-of-type(1) > footer.sidebar-footer > div.session > div.session-copy > strong`
- detail: content 20px clipped to 0px tall
- text: "Quản lý"
- rect: 41x0 at (33, 311)

### `clipped-text-vertical` (info)
- target: **floor** / mobile
- selector: `main.app-frame.[@media(orientation:portrait)]:hidden > aside.sidebar:nth-of-type(1) > footer.sidebar-footer > button.nav-button.lock-button > span.nav-label`
- detail: content 22px clipped to 1px tall
- text: "Khoá"
- rect: 1x1 at (33, 360)

### `clipped-text-vertical` (info)
- target: **floor** / mobile
- selector: `#root > main.app-frame.[@media(orientation:portrait)]:hidden > header.workspace-header > div.breadcrumb:nth-of-type(1) > span.header-context:nth-of-type(3)`
- detail: content 18px clipped to 1px tall
- text: "Vận hành bán hàng"
- rect: 1x1 at (77, 23)

### `clipped-text-vertical` (info)
- target: **floor** / mobile
- selector: `div.workspace > section.floor-card > div.area-navigation:nth-of-type(2) > div.area-metrics:nth-of-type(2) > strong.b01-area-only:nth-of-type(1)`
- detail: content 17px clipped to 1px tall
- text: "Tầng trệt"
- rect: 1x1 at (738, 124)
