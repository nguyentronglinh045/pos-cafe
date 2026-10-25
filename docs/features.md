# Features

Đối chiếu `main@711a22e` ngày 25/10/2026. “Có trên main” mô tả implementation, không phải nghiệm thu hoặc phát hành. [Testing](testing.md) giữ kết quả theo source; [giới hạn](limitations.md) giữ backend/deploy HOLD.

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
- Sau lần gửi thành công đầu tiên còn đúng màn/phiên, popup `Phiếu gửi bếp` chỉ gồm phần mới không có `sourceItemId`; draft phần cũ giữ ID. Dữ liệu phiếu lấy từ xác nhận local, chỉ tên/số lượng, không giá; đây vẫn là seam preview, chưa có phiếu bếp bền trên server. Replay/recovery không tự mở lại. Nguồn: `src/features/pos/orderFlow.ts:132`, `src/app/drawers/pos/OrderDrawer.tsx`.
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

Nguồn: `src/features/pos/writeOperationFlow.ts:25`, `:84`, `src/features/pos/orderFlow.ts:73`, `:183`, `src/app/drawers/pos/WriteRecoveryDrawer.tsx`; [quyết định và kiểm chứng phase 27](implementation-log/phase-27-idempotent-write-operations.md).

## Payment

- Thanh toán tiền mặt cho order mở, theo mô hình **instant pay (split-order)**: trả cả đơn một lần, hoặc chọn món/số lượng để **tách thành một đơn mới độc lập và thanh toán đơn đó ngay**.
- Màn thanh toán là console dành cho thu ngân, không phải màn đưa cho khách.
- Header hiển thị thu ngân đang đăng nhập, vị trí/order type và số lượng món; khách hàng hiện fallback là `Khách lẻ` vì `OrderDetail` chưa có customer field.
- Khu phương thức thanh toán dùng danh sách có thể mở rộng; hiện chỉ bật `Tiền mặt`, các phương thức thẻ/chuyển khoản/QR hiển thị disabled để tránh hiểu nhầm là đã xử lý thật.
- Khu nhập tiền đặt input `Tiền khách đưa` phía trên keypad custom, có quick cash buttons và hỗ trợ nhập số thủ công; input tự điền theo tổng phần đang chọn.
- **Chọn món để thanh toán** (pane phải): checkbox `Chọn tất cả` **mặc định bật** (= trả nhanh cả bàn, một chạm như cũ). Bỏ chọn rồi tick một dòng sẽ chọn **1 sản phẩm** của dòng đó; chỉnh số lượng bằng chip `đã chọn/tổng` + nút `+` xoay vòng (chạm trần quay về 1). Chỉnh bất kỳ dòng nào dưới mức tối đa → `Chọn tất cả` tự tắt; chọn đủ 100% → tự bật lại.
- Summary: `Khách đưa`, `Tiền thối`/`Còn thiếu`, `Tổng đơn`, dòng nổi bật `Thanh toán lần này`, checkbox `In hóa đơn sau khi thanh toán` mặc định bật và nút hoàn tất.
- Chặn hoàn tất khi tiền nhận chưa đủ **so với phần đang chọn**, hoặc khi chưa chọn món nào.
- Trước register, flow xác định chọn đủ → `pay_order`, chọn một phần → `pay_order_items`. Đây là kind của payload v1, không gọi RPC ghi cũ. Sau register giữ nguyên kind/selection/version/IDs. Thành công split lần đầu reset lựa chọn về phần còn lại; mất phản hồi giữ xác nhận để tra cứu/thử lại cùng K. Clamp rỗng do polling không tự chọn toàn bộ. Nguồn: `src/features/pos/orderFlow.ts:351`, `src/app/drawers/pos/PaymentDrawer.tsx:48`.
- **Đánh số theo thứ tự thanh toán**: bill trả trước mang số nhỏ hơn — đơn tách kế thừa `order_no` của đơn gốc, đơn gốc nhận số mới (header drawer đổi số tương ứng sau khi tách).
- Đơn gốc sau khi tách là đơn bình thường: sửa món, thêm món, thậm chí huỷ đều được (tiền đã thu nằm an toàn ở các đơn tách đã paid).
- Khi chưa có xác nhận đang xử lý, selection được clamp theo dữ liệu đơn mới nhất; clamp rỗng giữ rỗng. Khi K chưa rõ kết quả, bản xác nhận được giữ nguyên và server kiểm version/số lượng; polling không thay payload đang chờ.
- Có nút `In tạm tính` mở popup phiếu tạm tính (chưa thanh toán) từ đơn hiện tại.
- Khi checkbox in hóa đơn bật, sau khi thanh toán mở popup hoá đơn thanh toán in-app (PortalPopup); bỏ chọn thì vẫn thanh toán nhưng không mở popup. Phase này in chỉ là preview UI (popup + browser print qua iframe cô lập), chưa nối phần cứng; seam `IPrintPort` giữ nguyên cho adapter ESC/POS tương lai (`BrowserPrintPort` hiện no-op, không còn `window.open`).
- Bill dựng từ payload receipt trả về ngay trong mutation (không chờ refetch); in lại ở Lịch sử thì lấy từ payment snapshot của đơn đó.
- Hoá đơn dùng template `ReceiptDocument` khổ 80mm: `ticket` (tạm tính), `receipt` (thanh toán), `kitchen` (phiếu gửi bếp không giá). Receipt dùng metadata snapshot lúc thanh toán, còn ticket/kitchen lấy settings hiện tại; dữ liệu legacy được đánh dấu. Nguồn: `src/app/components/ReceiptPreview.tsx:150`.
- Lý do chọn mô hình split-order (và vì sao bỏ mô hình partial-cùng-đơn của migration 009), ưu/nhược điểm: xem ADR "Instant Pay" trong [architecture.md](architecture.md) và phân tích đầy đủ ở [implementation-log/phase-18-instant-pay.md](implementation-log/phase-18-instant-pay.md).

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
- Cột phải hiển thị item snapshot/options/note/quantity, khách hàng fallback `Khách lẻ`, **nhân viên thanh toán** được map từ `payment.employeeId`, phương thức thanh toán và paid time. Không hiển thị thêm ô `Thu ngân` trùng dữ liệu.
- Summary thanh toán cố định cuối cột phải theo thứ tự `Khách đưa`, `Tiền thừa`, `Tổng tiền`; `Tổng tiền` nổi bật hơn.
- `OrderDetail` đọc payment snapshot để lịch sử hiển thị đúng `receivedAmount` và `changeAmount`, không tính tạm ở UI.
- Nút `In lại hóa đơn` đọc receipt qua RPC được bảo vệ, kiểm trạng thái đơn hiện tại rồi mở popup dùng chung `ReceiptDocument`; ưu tiên snapshot metadata đã lưu, dữ liệu cũ thiếu snapshot được đánh dấu legacy. Đơn chưa có payment hoặc đã `void` không in lại được. Nguồn: `016_activate_write_protocol.sql:166`, `OrderHistoryDrawer.tsx`.
- **Hủy đơn đã thanh toán**: nút `Hủy đơn` chỉ hiện với người có quyền `order.voidPaid` (mặc định admin) và đơn đang ở `Đã thanh toán`. Bấm mở popup xác nhận: cảnh báo rõ "đơn <số tiền> sẽ bị loại khỏi doanh thu ngày DD/MM, không thể hoàn tác", chọn 1 trong các lý do ghi sẵn (Nhập sai đơn/sai món, Khách đổi ý/trả món, Hết món/hết nguyên liệu, Đơn bị trùng, Lý do khác) + ô ghi chú (bắt buộc khi chọn "Lý do khác"). Sau khi hủy, đơn chuyển `Đã hủy`, cột chi tiết hiển thị người hủy/thời điểm/lý do, và bị loại khỏi doanh thu (report tự cập nhật). Quyền được chốt ở flow (`requirePermission`) và guardrail lại trong RPC — không tin nút bị ẩn. Trước khi mở popup xác nhận, tải lại order detail. Khi xác nhận dùng đúng version đã hiển thị; đóng màn/khóa/mất mạng vô hiệu phản hồi đọc muộn, không tạo lệnh hủy sau đó. Nguồn: `src/app/drawers/admin/OrderHistoryDrawer.tsx`.
- Dùng cho cashier và admin (hủy đơn đã thanh toán mặc định chỉ admin, trừ khi cashier được cấp `order.voidPaid`).

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
