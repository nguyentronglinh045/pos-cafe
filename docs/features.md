# Features

Đối chiếu `main@711a22e` ngày 25/10/2026. “Có trên main” mô tả implementation, không phải nghiệm thu hoặc phát hành. [Testing](testing.md) giữ kết quả theo source; [giới hạn](limitations.md) giữ backend/deploy HOLD.

## Danh mục tra cứu

Đây là điểm vào theo tính năng; mô tả bên dưới giữ luồng/quy tắc/giới hạn. [FR/NFR](requirements.md) giữ mã yêu cầu, [quyết định](workflow/decisions.md) giữ lý do và nguồn, [bản đồ spec](spec-reconciliation.md) chỉ cách kết hợp baseline/delta. Các chỉ dấu E-UI/E-PH27/E-BACKEND nằm trong [bản đồ bằng chứng](testing.md#bản-đồ-bằng-chứng), không phải tổng PASS chung.

| Tính năng, tác nhân và hành trình | Yêu cầu / mục tiêu | Spec cần đọc | Trạng thái và giới hạn |
| --- | --- | --- | --- |
| [Store & Session](#store--session) — Người tạo quán/nhân viên; tạo hoặc ghép Store Key → PIN → phiên → seed theo workflow | FR-01–03; G05/G07 | [store-onboarding](spec-reconciliation.md#store-onboarding) | Có luồng Store Key/owner bootstrap; email owner chưa có. |
| [Role & Permission](#role--permission) — Chủ/quản lý/nhân viên theo quyền; kiểm màn, đọc và hành động | FR-04; G03/G04 | [access-control](spec-reconciliation.md#access-control) | Catalog15 trong code; backend HOLD. |
| [POS Floor](#pos-floor) — Nhân viên có floor.view; xem khu/trạng thái → mở đơn hoặc làm mới | FR-06; G08 | [floor-operations](spec-reconciliation.md#floor-operations) | B01 tích hợp; kiểm UI/local theo E-UI. |
| [Order](#order) — Nhân viên có quyền; chọn món/modifier → nháp → xác nhận gửi → xem đơn/phiếu | FR-07/09/10; G02/G08 | [order-management](spec-reconciliation.md#order-management) | B02 và giao thức v1 có code; backend riêng. |
| [Ghi chống trùng và khôi phục](#ghi-chống-trùng-và-khôi-phục) — Người có quyền hiện hành; tra cứu → retry cùng K hoặc tiếp quản | NFR-01; G02 | [order-management](spec-reconciliation.md#order-management) | Phase27 có acceptance lịch sử; main mới chưa nhận full backend. |
| [Payment](#payment) — Thu ngân có quyền; chọn món/số lượng → xác nhận tiền → full/split → receipt | FR-11–13; G02/G08 | [payment](spec-reconciliation.md#payment) | B03 tích hợp; cash-only, không provider thật. |
| [Takeaway](#takeaway) — Nhân viên có quyền; mở đơn mang đi hoặc tạo đơn mới → order/payment | FR-08; G08 | [order-management](spec-reconciliation.md#order-management) | Chức năng có; chưa nhận batch remake mang đi riêng. |
| [Order History](#order-history) — Người có quyền đọc/void/reprint; lọc → chi tiết → thao tác được phép | FR-14/15; G03/G04 | [order-history](spec-reconciliation.md#order-history) | Snapshot/displayNo; không có search/table filter UI. |
| [Employees](#employees) — Owner/người có quyền; chọn/tạo nhân viên → sửa trường được phép → lưu | FR-05; G03/G07 | [employee-management](spec-reconciliation.md#employee-management) | Trần quyền/OCC; owner và non-owner có quy tắc khác. |
| [Menu Editor](#menu-editor) — Người có menu.manage; sửa danh mục/món/modifier/ảnh → lưu changes | FR-09/16; G04/G09 | [menu-management](spec-reconciliation.md#menu-management) | Ảnh cần gate dịch vụ thật; join-only sync có giới hạn. |
| [Floor Editor](#floor-editor) — Người có floor.manage; chỉnh khu/bàn/decor → lưu layout | FR-17/18 | [floor-plan-editor](spec-reconciliation.md#floor-plan-editor) | Giữ trạng thái phục vụ; source/test server riêng. |
| [Report](#report) — Người có report.view; chọn kỳ → đọc tổng hợp và các pane được phép | FR-19; NFR-01 | [reporting](spec-reconciliation.md#reporting) | Không export; quyền report không tự mở history detail. |
| [Settings & Maintenance](#settings--maintenance) — Người có quyền settings; sửa thông tin; owner clear mẫu | FR-20; G04 | [store-settings](spec-reconciliation.md#store-settings) | Seed lại từ Settings còn cần hòa giải R06. |
| [Đồng bộ nhiều thiết bị](#đồng-bộ-nhiều-thiết-bị) — Nhân viên đang online; signal/reconnect → tải lại theo purpose | FR-21; G09 | [multi-device-sync](spec-reconciliation.md#multi-device-sync) | Có code signal/poll; chưa có SLA nguồn cuối. |
| [Tài khoản chủ và sở hữu](#tài-khoản-chủ-và-sở-hữu) — Chủ email dự kiến; xác thực → tạo quán/khôi phục/chuyển chủ | G05/G06 | [store-onboarding](spec-reconciliation.md#store-onboarding) | Kế hoạch; 3 artifact owner còn khung. |

**Trạng thái chung:** các dòng có code không tự là đã nghiệm thu hoặc phát hành. E-UI kiểm candidate cùng tree với main; E-PH27 thuộc source cũ; E-BACKEND và deployment còn giữ gate. Từng quyết định được duyệt đọc tại hồ sơ chính, không suy cả danh mục đã được chủ dự án nghiệm thu từ việc đưa vào trang này. [Hồi quy tiểu luận](regression-map.md) nối phạm vi cũ, thay đổi và test/evidence cần đối chiếu.

## Store & Session

Ghép thiết bị bằng Store Key, chọn nhân viên và nhập PIN để cấp phiên. Token nhân viên không nằm trong UI state; reload/khóa yêu cầu xác minh lại. Tạo quán mới có lựa chọn seed demo; owner nhận PIN tạm và phải đổi trước khi dùng POS. Seed có workflow/stages và retry riêng, không coi seed lỗi là mất cửa hàng. Chưa có email ownership/recovery hoàn chỉnh.

Nguồn: [session contracts:17](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/ports/permissions.ts#L17), [PasscodeScreen:42](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/app/screens/PasscodeScreen.tsx#L42), [candidate bootstrap:498](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-identity.sql#L498).

## Role & Permission

Catalog có 15 quyền; vai trò bật là owner, manager, cashier, waiter; kitchen tắt. Role chọn trong editor là manager/cashier/waiter. Quyền hiệu lực đến từ catalog + overrides, không từ bảng role/module hardcode cũ.

| Nhóm | Quyền |
| --- | --- |
| Vận hành | `floor.view`, `order.create`, `order.update`, `order.voidOpen`, `payment.take` |
| Lịch sử và in | `orderHistory.view`, `order.voidPaid`, `receipt.reprint` |
| Quản trị | `menu.manage`, `floor.manage`, `employee.manage`, `employee.permission.edit`, `report.view`, `settings.manage` |
| Dữ liệu mẫu | `data.clearDemo` — owner-only |

`floor.view` là baseline cho role được bật. Mở màn, đọc dữ liệu và thực hiện thao tác là các kiểm tra riêng theo purpose; có quyền báo cáo không tự có chi tiết lịch sử. UI không hiện thao tác mất quyền và che phần bảo vệ khi authority chưa xác minh. SQL candidate bảo vệ server; **nghiệm thu backend vẫn chưa đóng**.

Nguồn: [permissionCatalog.ts:5](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/core/permissionCatalog.ts#L5), [permissionUi.ts:5](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/app/permissionUi.ts#L5), [read contract:59](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/ports/permissions.ts#L59).

## POS Floor

- Xem sơ đồ bàn theo khu/tầng.
- Lọc bàn theo trạng thái.
- Xem bàn trống/đang phục vụ, order number và tổng tiền khi có order mở.
- Render nền bàn từ catalog built-in khi bàn đã chọn mẫu; bàn không có `backgroundAssetKey` dùng nền trắng. Viền xanh/cam tiếp tục biểu diễn trạng thái bàn.
- Mở order tại bàn.
- Refresh floor/open orders từ toolbar sơ đồ khi cần.

## Order

- Tạo order dine-in hoặc takeaway.
- Chọn món theo danh mục.
- Món **có nhóm tuỳ chọn** → bấm vào hiện popup `ModifierPickerPopup` để chọn modifier (size/topping...); món **không có** nhóm thì thêm thẳng vào giỏ như cũ. Nhóm `single` chọn 1 (radio); nhóm `multi` tick nhiều giá trị, mỗi giá trị có stepper số lượng (mặc định 1). Nhóm bắt buộc thì nút `Thêm vào đơn` khoá đến khi chọn hợp lệ (`validateModifierSelection`).
- Số lượng món và ghi chú chỉnh ở giỏ; dòng giỏ hiển thị option kèm `×N` khi số lượng > 1. Giá dòng = (giá món + Σ giá_modifier × số_lượng) × số_lượng_món.
- Submit order lên backend qua RPC; backend quyết định snapshot tên/giá. Tuỳ chọn chỉ hợp lệ khi nhóm của nó được gắn với đúng món.
- Sau lần gửi thành công đầu tiên còn đúng màn/phiên, popup `Phiếu gửi bếp` chỉ gồm phần mới không có `sourceItemId`; draft phần cũ giữ ID. Dữ liệu phiếu lấy từ xác nhận local, chỉ tên/số lượng, không giá; đây vẫn là seam preview, chưa có phiếu bếp bền trên server. Replay/recovery không tự mở lại. Nguồn: [src/features/pos/orderFlow.ts:132](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/features/pos/orderFlow.ts#L132), [src/app/drawers/pos/OrderDrawer.tsx](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/app/drawers/pos/OrderDrawer.tsx#L1).
- Sau thành công, invalidate/refetch dữ liệu; không patch cache. Polling 5 giây khi active là cấu hình hồi phục, không phải cam kết mọi máy hội tụ trong 5 giây.
- Mở lại order đang mở để chỉnh sửa.
- Dirty close confirm cho draft/chỉnh sửa chưa lưu.
- Nếu order đã đóng/stale, UI hiển thị trạng thái không thể thanh toán/chỉnh như order mở.

## Ghi chống trùng và khôi phục

- Chỉ đơn đã được server ghi nhận mới là đơn của hệ thống. Nháp chưa gửi không được hứa khôi phục khi mất local.
- Khi mất phản hồi, hiện kết quả chưa rõ; “Thử lại cùng lệnh” giữ đúng xác nhận cũ. Polling không được đổi lựa chọn hoặc chuyển split sang pay toàn bộ.
- Tra cứu thao tác từ server sau đổi máy, reload hoặc hết ca; người tiếp quản cần phiên và quyền của chính mình. R1 lịch sử hiển thị riêng với đơn hiện tại; không tự preview/in lại.
- Lệnh pending quá 24 giờ không còn thực hiện được; có thể xem đơn và xác nhận lệnh mới. Đơn qua 1–2 ngày vẫn còn, không tự hủy theo hạn lệnh.
- Phần đã gọi giữ giá/snapshot; thêm món cùng tên với giá mới là phần riêng. Ví dụ 2 × 30.000 + 1 × 40.000 = 100.000 đồng, modifier 0 đồng. Không thêm/sửa modifier vào phần cũ.
- Đổi giá trong lúc xác nhận hiển thị quote cũ/mới, cần xác nhận mới với K mới. Mất mạng không tự gửi lại.

Nguồn: [src/features/pos/writeOperationFlow.ts:25](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/features/pos/writeOperationFlow.ts#L25), [:84](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/features/pos/writeOperationFlow.ts#L84), [src/features/pos/orderFlow.ts:73](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/features/pos/orderFlow.ts#L73), [:183](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/features/pos/orderFlow.ts#L183), [src/app/drawers/pos/WriteRecoveryDrawer.tsx](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/app/drawers/pos/WriteRecoveryDrawer.tsx#L1); [quyết định và kiểm chứng phase 27](implementation-log/phase-27-idempotent-write-operations.md).

## Payment

- Thanh toán tiền mặt toàn đơn hoặc chọn món/số lượng để tách thành đơn độc lập paid ngay; phần còn lại tiếp tục là order mở.
- B03 đặt danh sách món/summary bên trái và console thu tiền bên phải. Header ghi vị trí, số đơn và số món; tên thu ngân nằm trong console.
- Khi mở order mới, mặc định chọn tất cả. Bỏ chọn rồi tick dòng chọn1 sản phẩm; nút+ tăng và xoay vòng khi đến trần. Chọn đủ100% thì tương ứng trả toàn bộ.
- Tiền khách đưa tự điền theo phần đang chọn, có input/keypad và quick cash. Chặn khi không chọn món, thiếu tiền, order lỗi/đóng, mất quyền hoặc thao tác đang chưa rõ kết quả.
- Trước register, flow chốt kind `pay_order` hoặc `pay_order_items`. Sau register giữ K/kind/selection/version/IDs; refetch không tự thay ý định.
- **Sau split thành công, selection về rỗng**; lần thanh toán kế tiếp cần chủ động chọn lại. Refetch cũng không tự biến lựa chọn rỗng thành trả toàn bộ.
- Bill trả trước mang số nhỏ hơn: đơn tách kế thừa order_no, phần còn lại nhận số mới. Có thể sửa/thêm/hủy phần còn lại theo quyền; tiền đã thu ở đơn paid riêng. Xem [ADR Instant Pay](architecture.md#adr-instant-pay--tách-đơn-độc-lập-split-order).
- Checkbox in mặc định bật, nhưng chỉ mở initial preview khi còn đúng view, là initial success và có grant. Replay/recovery không tự mở/in lại. Bill dùng receipt payload, không chờ refetch.
- Tạm tính và receipt dùng browser preview/print; mỗi click in receipt kiểm quyền hiện hành. Receipt lưu metadata lịch sử; ticket/kitchen dùng settings hiển thị. Chưa tích hợp máy in native hoặc payment provider ngoài tiền mặt.

Nguồn: [PaymentDrawer.tsx:47](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/app/drawers/pos/PaymentDrawer.tsx#L47), [success/reset:183](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/app/drawers/pos/PaymentDrawer.tsx#L183), [bố cục:213](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/app/drawers/pos/PaymentDrawer.tsx#L213), [orderFlow.ts:358](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/features/pos/orderFlow.ts#L358), [ReceiptPreview.tsx:278](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/app/components/ReceiptPreview.tsx#L278).

## Takeaway

- Xem danh sách order takeaway đang mở.
- Mở chi tiết takeaway, tiếp tục chỉnh order hoặc chuyển sang thanh toán.
- Tạo takeaway mới từ drawer.
- Chỉ liệt kê đơn takeaway đang mở thật (đã bỏ dữ liệu paid takeaway hardcode); xem đơn đã thanh toán ở màn Lịch sử đơn.

## Order History

- Mặc định hiển thị các đơn đã kết thúc **gần đây nhất, không giới hạn ngày kinh doanh** (`main@c7f2f4e`). Trước đó mặc định là `Hôm nay`.
- Chỉ hiển thị đơn đã kết thúc (`Đã thanh toán`, `Đã hủy`); đơn đang mở thuộc màn Bàn/Mang đi.
- **Instant pay**: mỗi lần tách thanh toán là một ĐƠN độc lập → tự nhiên là một dòng lịch sử riêng, hiện **ngay sau khi thu tiền** (không chờ bàn đóng). Bàn trả 2 lần = 2 đơn độc lập về trạng thái, cùng nhãn bàn; ledger/audit lưu liên kết nguồn/kết quả của lần tách; số đơn tăng theo thứ tự thanh toán.
- Bộ lọc ngày là một nút `Filter date`, mở popup chọn `Gần đây` (mặc định), `Hôm nay`, `7 ngày`, `Tháng này` hoặc khoảng ngày tùy chọn.
- **Số hiển thị trong lịch sử KHÔNG phải số bill, và đây là chủ ý.** Vì danh sách trải nhiều ngày mà `order_no` chỉ duy nhất trong phạm vi một `business_date`, hiển thị `order_no` sẽ sinh nhiều dòng trùng số. Nên cả cột trái lẫn cột phải hiển thị `displayNo` — số thứ tự đếm giảm theo tập đơn khớp bộ lọc (`total - (page-1) * pageSize - index`). Đổi bộ lọc thì `displayNo` được tính lại. `order_no` giữ đúng vai trò số bill và **chỉ xuất hiện trên hóa đơn in**; màn lịch sử cố ý không hiển thị nó.
- Danh sách đơn dùng phân trang để giữ payload ổn định (`PAGE_SIZE = 20`); date/status/type được áp dụng ở repository trước khi cắt trang.
- **Chưa dùng trên UI:** ô tìm kiếm và bộ lọc theo bàn. Repository hỗ trợ `search` và `tableIds` nhưng màn hình không có entry point cho cả hai. Xem mục [Seam: Có Code Nhưng CHƯA Dùng Trên UI](#seam-có-code-nhưng-chưa-dùng-trên-ui).
- Layout chính là 2 cột: cột trái hiển thị thông tin nhanh của đơn, cột phải hiển thị chi tiết dạng receipt.
- Cột phải hiển thị item snapshot/options/note/quantity, khách hàng fallback `Khách lẻ`, **nhân viên thanh toán** từ projection `cashierName`, phương thức thanh toán và paid time. Không hiển thị thêm ô `Thu ngân` trùng dữ liệu.
- Summary thanh toán cố định cuối cột phải theo thứ tự `Khách đưa`, `Tiền thừa`, `Tổng tiền`; `Tổng tiền` nổi bật hơn.
- `OrderDetail` đọc payment snapshot để lịch sử hiển thị đúng `receivedAmount` và `changeAmount`, không tính tạm ở UI.
- Nút `In lại hóa đơn` đọc receipt qua RPC được bảo vệ, kiểm trạng thái đơn hiện tại rồi mở popup dùng chung `ReceiptDocument`; ưu tiên snapshot metadata đã lưu, dữ liệu cũ thiếu snapshot được đánh dấu legacy. Đơn chưa có payment hoặc đã `void` không in lại được. Nguồn runtime: [src/app/drawers/admin/OrderHistoryDrawer.tsx:188](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/app/drawers/admin/OrderHistoryDrawer.tsx#L188) và permission print port; migration016 là lịch sử giao thức trước candidate quyền.
- **Hủy đơn đã thanh toán**: nút `Hủy đơn` chỉ hiện với người có quyền `order.voidPaid` và đơn đang ở `Đã thanh toán`. Bấm mở popup xác nhận: cảnh báo rõ "đơn <số tiền> sẽ bị loại khỏi doanh thu ngày DD/MM, không thể hoàn tác", chọn 1 trong các lý do ghi sẵn (Nhập sai đơn/sai món, Khách đổi ý/trả món, Hết món/hết nguyên liệu, Đơn bị trùng, Lý do khác) + ô ghi chú (bắt buộc khi chọn "Lý do khác"). Sau khi hủy, đơn chuyển `Đã hủy`, cột chi tiết hiển thị người hủy/thời điểm/lý do, và bị loại khỏi doanh thu (report tự cập nhật). Quyền được chốt ở flow (`requireCurrentPermission`) và guardrail lại trong RPC — không tin nút bị ẩn. Trước khi mở popup xác nhận, tải lại order detail. Khi xác nhận dùng đúng version đã hiển thị; đóng màn/khóa/mất mạng vô hiệu phản hồi đọc muộn, không tạo lệnh hủy sau đó. Nguồn: [src/app/drawers/admin/OrderHistoryDrawer.tsx](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/app/drawers/admin/OrderHistoryDrawer.tsx#L1).
- Mở history bằng `orderHistory.view`; void-paid bằng `order.voidPaid`; in lại cần `receipt.reprint` cùng quyền đọc. Role/default lấy từ catalog. Nguồn: [OrderHistoryDrawer.tsx:84](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/app/drawers/admin/OrderHistoryDrawer.tsx#L84), [reprint:188](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/app/drawers/admin/OrderHistoryDrawer.tsx#L188), [void flow:427](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/features/pos/orderFlow.ts#L427).

## Employees

Màn nhân viên tách quyền quản lý hồ sơ và sửa quyền. Role/permission lựa chọn lấy từ catalog; owner được bảo vệ, không tạo owner hoặc kitchen qua editor. Có tạo/sửa nhân viên, reset PIN, overrides và version/revision để phát hiện thay đổi cạnh tranh. Không dùng quy tắc “admin cuối” của legacy thay hợp đồng owner mới.

Nguồn: [EmployeesDrawer.tsx:150](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/app/drawers/admin/EmployeesDrawer.tsx#L150), [request/response và mã lỗi](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/domain/permissions.ts#L99). Dirty-exit cần phân biệt theo màn, không tuyên bố mọi drawer đã có cùng mức bảo vệ; xem [giới hạn](limitations.md).

## Menu Editor

- Upload/lưu ảnh món JPG/PNG/WebP và hiển thị ảnh trong màn quản lý menu.
- Upload ảnh món có cảnh báo và chặn file quá 5MB trước khi lưu.
- Màn chọn món khi bán hàng hiển thị ảnh món nếu có, fallback bằng icon khi chưa có ảnh; card hết hàng có overlay `Đã bán hết`.
- Card món trong Menu Editor dùng ảnh cover, bỏ pill trạng thái bán khỏi card; trạng thái vẫn chỉnh ở panel chi tiết.
- Panel chi tiết món dùng select `Danh mục`, upload/preview ảnh, trạng thái bán và **danh sách checkbox nhóm tuỳ chọn dùng chung** — tick để gắn/bỏ nhóm cho món (tạo/xoá link). Nút bút chì mở popup `ModifierGroupEditor` để sửa nhóm (tên, chọn-1/chọn-nhiều, bắt buộc, các giá trị + giá).
- Đổi thứ tự món bằng switch `Đổi vị trí`: chọn món gốc, bật switch, bấm món khác trong cùng danh mục để swap rồi tự tắt switch.

- Quản lý category.
- Quản lý món: tên, giá, danh mục, trạng thái bán.
- Quản lý nhóm tuỳ chọn (size/topping) **dùng chung** cho mọi món: tạo/sửa nhóm + giá trị một nơi, gắn vào nhiều món bằng checkbox. Sửa nhóm ảnh hưởng mọi món đang dùng.
- Lưu theo changeset create/update/delete, không hard-delete dữ liệu editor.

## Floor Editor

- Quản lý khu/tầng.
- Tạo/sửa/xóa mềm bàn.
- Inspector bàn cho chọn giữa nền trắng mặc định và 11 ảnh nền built-in lấy từ thư viện nội bộ `evo-edit-room`; bàn mới luôn khởi tạo nền trắng.
- Nền bàn được preview ngay trên canvas và lưu theo bàn. Trên canvas editor chỉ hiện tên bàn trực tiếp trên nền, không hiện số chỗ và không bọc nhãn bằng nền trắng; trường số chỗ vẫn được giữ trong inspector/data model cho nghiệp vụ.
- Tạo/sửa/xóa mềm decor; thư viện built-in gồm 9 texture tường và 131 ảnh trang trí (57 cây, 29 ghế, 30 thiết bị, 15 ảnh khác).
- Toolbar mở popup chọn mẫu tường hoặc ảnh trang trí theo nhóm; inspector cho đổi mẫu của decor đã có. Ảnh render bằng `object-cover` với tường và `object-contain` với decor.
- `assetKey` cũ không khớp catalog vẫn hiển thị placeholder nhãn/màu để dữ liệu seed hoặc dữ liệu đã lưu trước đây không bị ảnh hỏng.
- Floor mẫu mock dùng 13 decor ảnh trên hai khu; bộ seed Supabase gọn dùng 7 decor ảnh, phủ đủ texture tường và bốn nhóm Cây/Ghế/Thiết bị/Khác.
- Khi chọn một object trên sơ đồ (bàn hoặc decor), hiện 2 handle kéo trực tiếp để xoay và resize; handle luôn nằm ngang bên dưới object, không xoay theo object, và ẩn với object đã xoá hoặc decor đang khoá.
- Lưu layout không ghi đè `table.status`.

## Report

- Core report theo `business_date`.
- Doanh thu, số đơn đã thanh toán, average ticket, top item.
- Biểu đồ doanh thu theo giờ.
- Report chỉ tính order đã thanh toán và loại order hủy. Đơn `paid` bị hủy tự động rời khỏi doanh thu (report tính live, không có bảng tổng hợp).
- Tổng hợp đơn hủy cho người có quyền báo cáo: `CoreReport.voidCount`/`voidAmount` đếm các đơn **paid-rồi-hủy** theo `business_date`; hiển thị ở rail trái (số đơn huỷ + tiền hủy). Nguồn lấy từ CoreReport chứ không đếm từ mảng orders phân trang.
- Bộ lọc khoảng: Hôm nay / 7 ngày / Tháng này / Tuỳ chọn (from–to). Nút Xuất hiện disabled (chưa hỗ trợ export).
- Layout dashboard **master/detail** (phase 12): rail trái = thẻ doanh thu + sparkline theo giờ, nav mục báo cáo (có badge) và tóm tắt nhanh (giờ cao điểm, thanh toán phổ biến, đơn huỷ); pane phải = chi tiết mục đang chọn. 4 mục: Tổng quan (KPI tile + biểu đồ giờ + món bán chạy), Theo giờ (bảng), Món bán chạy (bar-list), Đơn đã thanh toán (bảng).
- Look mô phỏng Tremor nhưng dựng bằng Tailwind `pos-*` + Recharts, không thêm dependency.

## Settings & Maintenance

Thông tin quán phục vụ hiển thị/hóa đơn được đọc bằng purpose display, khác quyền quản lý settings. Settings và dữ liệu mẫu đi qua permission changes; đổi múi giờ và clear demo có ràng buộc owner phía server. Clear demo không là reset toàn bộ giao dịch, ledger hay audit.

Nguồn: [permission changes contract](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/ports/permissionChanges.ts#L1), [candidate changes](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-changes.sql#L1), [display query](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/features/pos/usePosData.ts#L8).

## Đồng bộ nhiều thiết bị

Mục đích: các thiết bị đang online đọc lại dữ liệu sau thay đổi, đồng thời cập nhật authority/quyền của phiên. Luồng chính: adapter nhận signal tối thiểu → invalidate query theo topic/purpose → refetch; reconnect xác minh phiên và tải lại protected queries. Polling dữ liệu vận hành và revision quyền có điều kiện riêng, không là cam kết độ trễ thực đo.

Nguồn: [invalidation/reconnect](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/app/PermissionLifecycle.tsx#L76), [query/polling](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/features/pos/usePosData.ts#L8). Chỉ thay liên kết món–nhóm tùy chọn vẫn có giới hạn: [join không có trigger](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-signals.sql#L39). [Delta quyền/sync](spec-reconciliation.md#multi-device-sync) và [E-BACKEND](testing.md#bản-đồ-bằng-chứng) giữ expected và phần còn phải kiểm.

## Tài khoản chủ và sở hữu

**Kế hoạch G05/G06:** xác thực email thật, quyền tạo cửa hàng, khôi phục truy cập, đổi thông tin chủ và chuyển sở hữu theo [các quyết định owner](../openspec/changes/add-owner-account-and-store-provisioning/proposal.md#quyết-định-đã-chốt). Mỗi quán một chủ là lựa chọn nghiệp vụ; không phải quản lý quan hệ góp vốn.

Main có role owner, self-PIN và recovery operator chuyển tiếp; chưa đồng nghĩa có tài khoản chủ email. CreateStore hiện dùng tài khoản cửa hàng với email sinh theo Store Key: [Auth tạo quán](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/adapters/supabase/authRepo.ts#L80), [email theo số quán](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/adapters/supabase/storeKey.ts#L34). Ba artifact usecases/testplan/traceability của owner còn khung. Chưa có evidence nghiệm thu luồng email/chuyển chủ; không ghi G05/G06 hoàn tất. [R03](spec-reconciliation.md#phần-còn-thiếu-và-phân-loại).

## Seam: Có Code Nhưng CHƯA Dùng Trên UI

| Phần chưa là tính năng vận hành đầy đủ | Giới hạn |
| --- | --- |
| Bếp | Chỉ phiếu preview; kitchen không bật, không có queue vận hành trong shell |
| Thanh toán ngoài tiền mặt | Không có xử lý provider/callback/đối soát; QR settings là preview cục bộ |
| Máy in POS | Browser print/preview, không có adapter ESC/POS |
| Tìm/lọc lịch sử theo bàn | Contract dữ liệu có trường nhưng chưa có control tương ứng trên màn lịch sử |
| Export báo cáo | Chưa có luồng xuất tệp hoạt động |
| Discount/refund/kho/loyalty/ca | Ngoài phạm vi đã triển khai; schema hoặc proposal không đủ để tính là feature |

Nguồn UI: [shell registry:22](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/app/shell/AppShell.tsx#L22), [PaymentSettingsDrawer:1](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/app/drawers/admin/PaymentSettingsDrawer.tsx#L1), [OrderHistoryDrawer:1](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/app/drawers/admin/OrderHistoryDrawer.tsx#L1), [ReportDrawer:1](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/app/drawers/admin/ReportDrawer.tsx#L1). Giữ các điểm mở rộng; không xóa chỉ vì chưa có UI.

## Shared UI Behavior

B01 sơ đồ, B02 gọi món và B03 thanh toán đã merge; shell dùng theme chung và cổng authority. Đọc [screens](screens.md) cho bản đồ màn; [handoff tích hợp](workflow/tasks/ui-main-docs-integration-2026-10-25.md) cho source, kiểm và giới hạn. Mô tả thao tác ở trên giữ ý nghĩa nghiệp vụ; ảnh/bố cục phase cũ không đại diện giao diện mới.

Nguồn nghiệp vụ đang dùng: [orderFlow.ts:250](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/features/pos/orderFlow.ts#L250), [PaymentDrawer.tsx:1](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/app/drawers/pos/PaymentDrawer.tsx#L1). Các tham chiếu phase 18/27 trong phần nghiệp vụ là lịch sử quyết định, không phải phép kiểm mới.

## Đối chiếu 12 mục tiêu tốt nghiệp

Đây là góc nhìn của cùng danh mục, giữ G01–G12 từ bản audit và không tạo mã requirement thay FR/NFR. Khung mục tiêu, 15 tuần và mức bàn giao đã được [chủ dự án làm rõ](workflow/tasks/docs-knowledge-clarification-2026-10-25.md#dec-thesis-01--thời-gian-và-mức-hoàn-thành-đồ-án). Không đưa đề xuất UAT/rubric trong hồ sơ cũ thành yêu cầu bổ sung của giảng viên.

| Mục tiêu | Điểm tra cứu chính | Trạng thái / việc còn lại |
| --- | --- | --- |
| **G01 — Chiến lược và môi trường kiểm thử** | [Chiến lược](test-strategy.md), [E-UI/E-CICD/E-BACKEND](testing.md#bản-đồ-bằng-chứng) | Có strategy/runners/fixture/CI; hợp nhất coverage nguồn cuối và recipe local, không cài lab từ task docs. |
| **G02 — Chống trùng và khôi phục thanh toán** | [Giao thức ghi](#ghi-chống-trùng-và-khôi-phục), [payment](#payment) | Có code và acceptance lịch sử; cần gate backend tương ứng main mới. |
| **G03 — Vai trò và quyền** | [Catalog/quyền](#role--permission), [quyết định](workflow/decisions.md#nghiệp-vụ-và-quyền) | Catalog15 có code; kiểm quản trị, trần quyền và audit đủ profiles. |
| **G04 — Kiểm quyền tại DB** | [Spec access-control](spec-reconciliation.md#access-control), [E-BACKEND](testing.md#bản-đồ-bằng-chứng) | Có SQL/adapter candidate; không tự nhận grants đích hoặc acceptance đã đạt. |
| **G05 — Chủ quán, email, quyền tạo quán** | [Owner](#tài-khoản-chủ-và-sở-hữu) | Chưa có flow email owner; phải hoàn thiện spec và implementation khi được giao. |
| **G06 — Recovery, thông tin chủ, chuyển sở hữu** | [Owner](#tài-khoản-chủ-và-sở-hữu), [quyết định chuyển tiếp](workflow/decisions.md#nghiệp-vụ-và-quyền) | Operator PIN không thay khối email/ownership. Còn artifact khung và implementation. |
| **G07 — Đổi PIN mặc định lần đầu** | [Session](#store--session), [PIN delta](spec-reconciliation.md#employee-session) | Scope đã chốt owner bootstrap/recovery; có code, full gate còn mở. Không tự mở non-owner. |
| **G08 — UI bàn, gọi món, thanh toán, mang đi** | [UI](#shared-ui-behavior), [E-UI](testing.md#bản-đồ-bằng-chứng) | B01–03 tích hợp/đã kiểm scope local; mang đi có chức năng, chưa có batch remake riêng được nhận hoàn tất. |
| **G09 — Đồng bộ nhiều thiết bị** | [Realtime](#đồng-bộ-nhiều-thiết-bị) | Có signal/refetch, join-only còn giới hạn; cần bài đo/kiểm dịch vụ thật theo expected. |
| **G10 — Triển khai, backup, bảo mật, hiệu năng** | [E-CICD/E-OPS](testing.md#bản-đồ-bằng-chứng), [kế hoạch](roadmap.md) | Mục tiêu Vercel và kiểm local; chưa xác nhận release nguồn cuối, restore/RPO/RTO hoặc benchmark đầy đủ. |
| **G11 — Nguồn học thuật** | [References](references.md), [quyết định](workflow/decisions.md) | Có nguồn đã đọc một phần; cần tiếp tục gắn luận điểm, không nhận đã đọc cả danh mục. |
| **G12 — Báo cáo và tài liệu hệ thống** | [Bản đồ nguồn](report-source-map.md), [lịch](roadmap.md#khung-thời-gian-đồ-án--xác-nhận-2026-10-25) | Docs là đầu vào; Word/slide/bộ hình và kiểu trích dẫn chưa được hoàn tất trong lượt này. |
