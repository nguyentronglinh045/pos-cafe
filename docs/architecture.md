# Kiến trúc

Đối chiếu source `main@711a22e` ngày 25/10/2026. Các mô tả dưới đây là kiến trúc trong mã tích hợp; [testing](testing.md) và [giới hạn](limitations.md) xác định phạm vi đã kiểm, chưa xác nhận activation backend đích.

## Hexagonal Architecture / Ports & Adapters

UI gọi hook/flow, hook/flow phụ thuộc port, adapter thực hiện I/O. Đây là Ports & Adapters theo hướng Hexagonal; không phải mô hình textbook tuyệt đối vì tính nhất quán giao dịch nằm cả trong PostgreSQL. Chọn boundary này để thay mock/backend và kiểm logic độc lập; đánh đổi là thêm interface/mapper và phải kiểm contract hai adapter.

| Lớp | Trách nhiệm |
| --- | --- |
| `app` | Màn, drawer, điều hướng, tương tác và presentation |
| `features` | Điều phối nghiệp vụ, query/mutation, vòng đời phiên và invalidation |
| `core` / `domain` | Quy tắc thuần, validation, kiểu dữ liệu và lỗi |
| `ports` | Hợp đồng dữ liệu/side effect, không chứa React |
| `adapters` | Mock, Supabase, browser; mapping lỗi/DTO và I/O |

Production `AppPorts` chỉ gồm **permission, write, auth, seed, print**. `permission` chứa authority, session, read projections, quản trị nhân viên, changes, signals, ảnh và quyền in. `LegacyAppPorts` giữ repository cũ cho test tương thích; sự tồn tại của nó không làm nó thành đường đọc/ghi UI hiện hành. Nguồn: [ports/index.ts:154](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/ports/index.ts#L154), [composition:24](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/app/runtimePorts.ts#L24), [Supabase factory:17](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/adapters/supabase/repos.ts#L17).

## Folder Boundary Guard

`domain/core/ports` không phụ thuộc React/app/adapters; features không import app/adapters; adapters không import app/features; composition đặt ở `runtimePorts`. Guard AST kiểm import/export/dynamic import và thêm boundary permission/legacy. Xem [architectureBoundaries.test.ts:121](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/architectureBoundaries.test.ts#L121). Đây là kiểm cấu trúc, không chứng minh nghiệp vụ hoặc backend an toàn.

## Data Flow Tổng Quát

Màn → hook/flow → port theo purpose → adapter/RPC → DTO. Query keys chứa store, employee, generation phiên và purpose; response cũ sau đổi phiên không được khôi phục dữ liệu. UI chỉ giữ hồ sơ hiển thị; quyền lấy từ authority đã xác minh. Nguồn: [permissionSession.ts:28](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/features/shared/permissionSession.ts#L28), [read projections:59](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/ports/permissions.ts#L59).

## Navigation & State

Single URL; Zustand giữ screen/drawer/nháp, TanStack Query giữ dữ liệu async. Shell dùng registry drawer và quyền hiện hành; authority chưa verified thì nội dung được che và không tương tác. Không dùng role snapshot cũ để quyết định module. [AppShell.tsx:22](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/app/shell/AppShell.tsx#L22), [permissionUi.ts:17](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/app/permissionUi.ts#L17).

## Server State

Query chạy theo quyền/purpose, mutation invalidate/refetch thay vì merge payload realtime vào cache. Các query vận hành live poll 5 giây khi foreground; đây là cấu hình hồi phục, không là SLA. [usePosData.ts:8](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/features/pos/usePosData.ts#L8).

## Permission

Catalog có 15 quyền, 5 mã vai trò (4 bật, kitchen tắt); owner không là role có thể tùy chọn khi tạo nhân viên. Quyền mặc định đến từ catalog, overrides là grants/denies; `floor.view` là baseline, `data.clearDemo` owner-only. Quyền module và thao tác cùng dựa authority, không còn hai bảng hardcode 5 action/role làm nguồn runtime. [permissionCatalog.ts:5](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/core/permissionCatalog.ts#L5).

Store Auth là tenant boundary; employee token chứng minh phiên cho RPC được bảo vệ. Read projections phân biệt vận hành, history, report, admin và display. Catalog/snapshot đọc cùng bundle; query/cache gắn identity generation. Vòng đời quyền poll revision 30 giây khi visible, refresh có deadline 5 giây; focus/reconnect đi qua xác minh. Không diễn đạt thành bảo đảm 35 giây khi offline/server lỗi. [permissionLifecycle.ts:47](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/core/permissionLifecycle.ts#L47), [ports/permissions.ts:12](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/ports/permissions.ts#L12).

SQL candidate nằm ngoài chuỗi migration thông thường; không lấy sự tồn tại của source làm bằng chứng grants/schema đích đã đổi. [Data model](data-model.md) phân ranh giới này.

## RPC & Transaction Boundary

Bốn luồng submit, pay, split-pay và void-paid dùng giao thức ghi v1. Register đóng băng K/payload; execute xử lý business rows, audit và terminal R1 trong transaction. Register/execute là hai transaction riêng. Retry giữ K/kind/version/IDs, không biến mất phản hồi thành giao dịch mới. UI timeout chuyển kết quả chưa rõ; không có offline outbox tự replay. [writeOperationFlow.ts:25](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/features/pos/writeOperationFlow.ts#L25), [orderFlow.ts:250](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/features/pos/orderFlow.ts#L250).

Giữ invariant giá retained/new, OCC và khóa ghi phạm vi store từ [quyết định giao thức v1](../openspec/changes/add-idempotent-write-operations/design.md); candidate phân quyền bổ sung authority phía server. Khóa store ưu tiên tính đúng cho quán nhỏ; chưa có benchmark tải để khẳng định chi phí thấp. Không khôi phục RPC/DML legacy để né cổng quyền.

### ADR: Instant Pay — TÁCH ĐƠN ĐỘC LẬP (split-order)

**Quyết định (phase 18, bản chốt):** thanh toán một phần = tách các món được chọn ra một **đơn mới hoàn toàn độc lập** (UUID client cấp) và thanh toán đơn đó ngay trong cùng transaction. Hai đơn tiếp tục độc lập về nghiệp vụ và cùng nhãn bàn; phase 27 bổ sung liên kết nguồn/kết quả trong ledger và audit để tra cứu đúng thao tác, không tạo quan hệ phụ thuộc thanh toán. Đơn gốc còn lại trên bàn là đơn `open` bình thường.

**Lịch sử quyết định:** bản đầu của phase 18 làm theo mô hình "partial payment trên cùng một đơn" (nhiều payments/đơn, `order_items.payment_id`, view `history_entries` — migration 009). Người dùng **không chấp nhận các đánh đổi** của mô hình đó — report lệch két trong ngày, phải ẩn/đóng băng món đã trả, lịch sử phải chế khái niệm "Lần x/y" — nên rework sang split-order (migration 010 dọn toàn bộ 009).

**Lý do chọn split-order:** (1) **report đúng két ngay** — mỗi lần thu là một đơn `paid` nên doanh thu vào report tức thì, không có trạng thái "tiền đã thu nhưng chưa ghi nhận"; (2) **không có trạng thái đặc biệt** — không món đóng băng, không ẩn UI, đơn gốc sửa/void như mọi đơn; (3) **lịch sử giữ nguyên order-centric** — mỗi bill một dòng đơn bình thường; (4) đổi lại chấp nhận từ bỏ "1 phiên bàn = 1 đơn tổng" — điều người dùng chủ động muốn ("hai đơn không liên quan gì nhau").

**Quy tắc đánh số (yêu cầu cứng, có test):** bill thanh toán TRƯỚC mang `order_no` NHỎ hơn. Cơ chế: đơn tách **kế thừa** `order_no` của đơn gốc; đơn gốc nhận `order_no` mới (max+1 theo `business_date`). Ví dụ bàn #12 trả 2 lần → bill #12 (lần 1), phần còn lại trên bàn thành #13, bill #13 (lần 2). Hệ quả chấp nhận: phiếu bếp in trước đó mang số cũ trong khi đơn trên bàn đã đổi số.

**Đánh đổi còn lại:** muốn biết cả phiên bàn tiêu bao nhiêu phải cộng nhiều đơn; mỗi lần tách tốn một `order_no`; hoàn tiền theo payment vẫn ngoài scope phase này; chỉ trả theo món (không trả theo số tiền tuỳ ý).

## Realtime

Adapter runtime subscribe **store_change_signals** và **permission_catalog_signals**, giải mã tín hiệu tối thiểu theo topic/revision rồi yêu cầu đọc lại. Mô tả subscribe trực tiếp orders/payments/menu của adapter cũ không phải đường production hiện tại. [permissionSignalPort.ts:49](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/adapters/supabase/permissionSignalPort.ts#L49). Vì vậy không mang nguyên gap subscription bảng nối của legacy sang kết luận về runtime mới; service-level convergence còn phải nghiệm thu theo gate backend.

## Print

Preview và lệnh in trình duyệt ở UI, còn quyền mỗi click in qua port permission. Initial receipt grant là metadata riêng, không sửa immutable K/R1; in lại là quyền riêng. `IPrintPort`/browser no-op giữ seam phần cứng, chưa tích hợp ESC/POS. [ReceiptPreview.tsx:260](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/app/components/ReceiptPreview.tsx#L260), [permissionPrint.ts:1](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/ports/permissionPrint.ts#L1).

## Floor Asset Catalog

Sơ đồ là logical stage 1600×900; layout bàn/decor và trạng thái vận hành có ownership riêng. Decor/nền bàn là catalog đóng gói, khác ảnh món upload. Giữ UUID client, tombstone dữ liệu editor và domain camelCase để bảo toàn các seam mở rộng; không gọi đây là đã có offline. [floorStage.ts:1](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/app/floorStage.ts#L1), [data model](data-model.md#nhóm-floor).

## UI Overlay Primitives

Popup/drawer dùng portal; trạng thái/dirty-exit và quyền là trách nhiệm của consumer. B01/B02/B03 đã tích hợp theme/remake; không dùng mô tả layout phase cũ làm hợp đồng UI hiện hành. [Screens](screens.md) dẫn các điểm vào cụ thể.

## Testing

Xem [chiến lược](test-strategy.md) để chọn phép kiểm, [testing](testing.md) để lấy kết quả theo source và [workflow](workflow/README.md) để đóng task. Unit/boundary/mock UI không thay Auth/REST/Storage/Realtime và backend acceptance.
