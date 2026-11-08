# Trả lời câu hỏi kiểm thử tuần 5 và việc chưa xử lý — 08/11/2026

Chủ dự án (Linh) trả lời các câu hỏi phát sinh khi Ngọc và Lâm chạy thử bản demo trong tuần 5. Hồ sơ này ghi quyết định, quy tắc áp dụng ngay cho tài liệu và danh sách việc chưa xử lý. **Chưa sửa code.** Các thay đổi giao diện dưới đây dự kiến làm ở phase tới.

## Nguồn câu hỏi

- Ngọc chạy 8 ca N01 bản r03 (44 bước: 41 đúng, 2 lệch so với kịch bản, 1 chưa kết luận), câu hỏi Q-N01-1…8: [nhánh tuần 5 của Ngọc](https://github.com/nguyentronglinh045/pos-cafe/blob/eedc79b914d3b0aa6b5a7c17787239010c0d5462/N01/N01-kich-ban.md).
- Lâm làm theo hướng dẫn demo ở hai luồng gọi món và thanh toán, 20 góp ý cách viết, câu hỏi H-Q1…4 và điểm Món bán chạy: [nhánh tuần 5 của Lâm](https://github.com/nguyentronglinh045/pos-cafe/blob/2e24c29c2ec08797acbe2099a3b289190de69e6a/README.md).
- Cả hai chạy bản demo trên máy với dữ liệu giả (`VITE_DATA_MODE=mock`), mã nguồn `src/` giống main `052a7d1`. Đây không phải nghiệm thu với backend thật.
- Theo hồ sơ của hai bạn, các lượt chạy tự động do Claude Code thực hiện theo yêu cầu của từng bạn; Ngọc và Lâm đã xem ảnh và tự chạy tay lại một phần.
- Hai lỗi số đơn ở Lịch sử và Món bán chạy cũng được giảng viên nêu trong nhận xét tuần 5, chủ dự án chuyển lại ngày 08/11/2026.

Đối chiếu code ở main [`f2b486e`](https://github.com/nguyentronglinh045/pos-cafe/tree/f2b486e8998dd5577f3e79eefe70b908da1e3d62).

## Quy tắc áp dụng ngay

### Nút theo quyền

Khi người dùng thiếu quyền làm một việc, nút hoặc lối vào dẫn tới việc đó phải bị **ẩn hoặc vô hiệu hóa**, không cho truy cập. Server vẫn kiểm lại quyền, không dựa vào việc nút có hiện hay không.

Ví dụ: Waiter không có `payment.take` mở một đơn đã gửi thì chỉ có nút "Đóng", không có nút Thanh toán. Đây là đúng thiết kế.

Bảng quyền ↔ màn hình nằm ở [design của redesign-permission-model, mục 3 "Inventory 15 quyền và dữ liệu được trả"](../../../openspec/changes/redesign-permission-model/design.md). Cột "Module/UI" cho biết mỗi quyền mở màn hoặc chức năng nào. Đọc kèm [access-control spec](../../../openspec/changes/redesign-permission-model/specs/access-control/spec.md): PERM-01 vai trò dựng sẵn, PERM-02 danh mục quyền, PERM-04 ẩn phần tử khi thiếu quyền.

Tra nhanh các nút hay gặp ([permissionUi.ts:6-23](https://github.com/nguyentronglinh045/pos-cafe/blob/f2b486e8998dd5577f3e79eefe70b908da1e3d62/src/app/permissionUi.ts#L6-L23)): tạo đơn mới → `order.create`; mở một đơn đang mở → một trong `order.update`, `order.voidOpen`, `payment.take`; Thanh toán → `payment.take`; Hủy đơn đang mở → `order.voidOpen`; Lịch sử → `orderHistory.view`; Báo cáo → `report.view`; Thực đơn → `menu.manage`; Nhân viên → `employee.manage` hoặc `employee.permission.edit`; Cài đặt → `settings.manage`. Người không có `order.update` nhưng có `payment.take` bấm vào đơn trên sơ đồ sẽ vào thẳng màn Thanh toán ([FloorWorkspace.tsx:64](https://github.com/nguyentronglinh045/pos-cafe/blob/f2b486e8998dd5577f3e79eefe70b908da1e3d62/src/app/shell/FloorWorkspace.tsx#L64)).

### Bỏ thay đổi chưa gửi

Đóng màn đơn khi còn thay đổi chưa gửi thì app hỏi "Bỏ đơn chưa gửi?" với hai nút "Tiếp tục chỉnh sửa" và "Bỏ đơn". **Bỏ nghĩa là trở về bản đã lưu gần nhất trên server.** Quy tắc này giống nhau cho đơn tại bàn và đơn mang đi.

| Trường hợp | Kết quả khi bỏ |
| --- | --- |
| Đơn mới, chưa gửi lần nào | Đơn mất hẳn, không có gì được lưu |
| Đơn đã gửi, có thêm món chưa gửi | Về bản mới nhất trên server, ví dụ đơn 24 về 125.000đ |
| Đơn đã gửi, giảm hoặc xóa món đã gửi mà chưa gửi lại | Về bản mới nhất trên server, món đã gửi giữ nguyên |
| Đơn đã gửi, đổi tùy chọn hoặc ghi chú chưa gửi | Về bản mới nhất trên server |
| Máy khác vừa sửa đơn này | Về bản mới nhất trên server, tức có cả phần máy khác vừa gửi |
| Tải lại trang hoặc đóng tab | Hiện app không hỏi, phần chưa gửi mất luôn. Sẽ thêm cảnh báo trước khi tải lại hoặc đóng tab, xem [CX-09](#việc-chưa-xử-lý) |

Chữ nút sẽ đổi theo loại đơn, xem [CX-03](#việc-chưa-xử-lý).

### Các câu khác

| Câu | Quyết định |
| --- | --- |
| Q-N01-1 đơn mang đi | Đơn mang đi chỉ được tạo trên server và xuất hiện trong danh sách "Đơn mang đi đang mở" khi gửi món lần đầu. Tạo đơn rồi thoát khi chưa gửi món thì không có đơn nào |
| Q-N01-5 số đơn trên bàn | "Số đơn" là số thứ tự đơn như #24, xem ở danh sách Đơn đang mở. Ô bàn chỉ ghi tên bàn và tổng tiền. Đã sửa [floor-operations](../../../openspec/specs/floor-operations/spec.md) |
| Q-N01-6 nguồn kịch bản gọi món | Dùng [remake-b02](../../../openspec/changes/remake-b02/specs/order-workspace/spec.md) (B02-01…10) làm nguồn expected, vì bản này khớp giao diện hiện tại; không dùng bảng B02 cũ đã chuyển thành lịch sử |
| H-Q1 hướng dẫn | "Hướng dẫn hiện có" là [demo-runbook](../../demo-runbook.md), mục Flow Demo Chính. 20 góp ý của Lâm dùng để sửa file này |
| H-Q3 thứ tự Báo cáo | Xem Báo cáo ở bước 11, sau khi trả xong cả hai phần; đã sửa runbook |
| H-Q4 ảnh hướng dẫn | Thêm ảnh trên nhánh docs, cạnh runbook, nhưng chụp sau khi làm xong CX-01…05 để ảnh khớp giao diện mới |
| Minh chứng nhánh cá nhân | Sau khi review: script chạy được vào `main`, ảnh và phiếu kết quả vào `docs`, không để lẫn |

## Việc chưa xử lý

Chủ dự án đã chốt hướng làm, trừ CX-04 còn đang cân nhắc; chưa có code. Khi làm từng mục, sửa luôn các tài liệu ghi ở cột cuối.

| Mã | Việc | Hiện trạng | Phương án | Tài liệu phải sửa khi làm |
| --- | --- | --- | --- | --- |
| CX-01 | Bộ lọc trên sơ đồ bàn (Q-N01-8) | Lọc "Trống" hoặc "Đang phục vụ" thì bàn không khớp bị **ẩn** ([FloorWorkspace.tsx:77](https://github.com/nguyentronglinh045/pos-cafe/blob/f2b486e8998dd5577f3e79eefe70b908da1e3d62/src/app/shell/FloorWorkspace.tsx#L77)). Lâm gặp thêm: đang lọc "Trống" mà gọi món thì về sơ đồ không thấy bàn vừa gọi | Bàn khớp bộ lọc **sáng lên rõ rệt** so với bàn khác; bàn không khớp vẫn hiện đúng chỗ, không ẩn. Đúng với spec floor-operations ("chỉ làm nổi bật các bàn khớp") | features mục POS Floor; kịch bản N01-01 B4 |
| CX-02 | Ô nhập tiền khi thiếu tiền (Q-N01-7) | Thiếu tiền thì cả hàng nút nhanh (Đúng tiền, +20k, +50k, 200k, 500k) bị thay bằng dòng "Còn thiếu…" ([PaymentCashierPane.tsx:42](https://github.com/nguyentronglinh045/pos-cafe/blob/f2b486e8998dd5577f3e79eefe70b908da1e3d62/src/app/drawers/pos/PaymentCashierPane.tsx#L42)) | Luôn hiện hàng nút nhanh và bỏ dòng cảnh báo "Còn thiếu…" đang nằm thay chỗ hàng nút. Thiếu tiền thì **ô nhập tiền tô đỏ**. Ô bên dưới, lúc thiếu tiền ghi "Còn thiếu" kèm phép tính và số tiền ([PaymentCashierPane.tsx:43](https://github.com/nguyentronglinh045/pos-cafe/blob/f2b486e8998dd5577f3e79eefe70b908da1e3d62/src/app/drawers/pos/PaymentCashierPane.tsx#L43)), được giữ. Ô nhập có **nút x** để xóa toàn bộ số đã nhập, về 0 cho thu ngân nhập lại. Vẫn chặn hoàn tất khi thiếu tiền | remake-b03 payment-ui R04; features mục Payment; kịch bản N01-05 B4 |
| CX-03 | Chữ nút bỏ thay đổi (Q-N01-4) | Mọi trường hợp đều ghi "Bỏ đơn" ([DiscardDraftDialog.tsx:12](https://github.com/nguyentronglinh045/pos-cafe/blob/f2b486e8998dd5577f3e79eefe70b908da1e3d62/src/app/drawers/pos/DiscardDraftDialog.tsx#L12)); với đơn đã gửi, chữ này dễ hiểu nhầm là hủy cả đơn | Đơn mới giữ "Bỏ đơn"; đơn đã gửi đổi thành **"Bỏ thay đổi"**. Hành vi giữ nguyên theo quy tắc ở trên | remake-b02 B02-07; features mục Order; kịch bản N01-03 |
| CX-04 | Số đơn ở Lịch sử đơn (H-Q2) | Lịch sử hiện số thứ tự dòng trong danh sách (`displayNo`, [historyHelpers.ts:107](https://github.com/nguyentronglinh045/pos-cafe/blob/f2b486e8998dd5577f3e79eefe70b908da1e3d62/src/features/pos/historyHelpers.ts#L107)), nên cùng hai đơn lại là #2, #3 ở Lịch sử nhưng #27, #28 trên hóa đơn và phiếu bếp | **Chưa chốt.** Chủ dự án đã chọn bỏ số thứ tự dòng, và đang cân nhắc đánh số theo thứ tự trong database. Cần chốt thêm: số này lấy từ đâu, vì số đơn hiện tại chỉ không trùng trong một ngày kinh doanh nên sang ngày mới lại đếm lại; và hóa đơn có in số này không, để Lịch sử và hóa đơn khớp nhau | features mục Order History (đang ghi dùng `displayNo` là chủ ý); order-history spec; demo-runbook bước 11 |
| CX-05 | Món bán chạy trong Báo cáo (Lâm) | Hàng "Americano 145K" lấy doanh thu **cả ngày** của những ngày món đó đứng đầu, không phải doanh thu của món; Americano thực bán 70.000đ ([reportHelpers.ts:32](https://github.com/nguyentronglinh045/pos-cafe/blob/f2b486e8998dd5577f3e79eefe70b908da1e3d62/src/features/admin/reportHelpers.ts#L32-L39)) | Bỏ số tiền ở hàng này, ghi số ngày món đứng đầu, ví dụ "Americano · đứng đầu 1 ngày". Doanh thu đúng theo từng món cần thêm dữ liệu từ server, làm sau | features mục Report |
| CX-06 | Ảnh trong hướng dẫn demo (H-Q4) | Runbook chưa có ảnh | Chụp sau khi CX-01…05 xong, lưu trên nhánh docs cạnh runbook; đưa thêm 20 góp ý của Lâm vào runbook | demo-runbook |
| CX-07 | Bản trên Vercel | Lần deploy thành công gần nhất là 17/10 (production) và 18/10 (preview), trước khi giao diện mới vào main ngày 25/10; hai lần deploy production sau đó lỗi; `vercel.json` tắt tự deploy | Deploy lại từ main. Xem nguyên nhân hai lần lỗi trước, hỏi lại chủ dự án trước khi chạy | testing hoặc limitations, ghi bản đang chạy |
| CX-09 | Cảnh báo khi tải lại trang lúc còn món chưa gửi (Q-N01-4) | Trình duyệt chỉ hỏi trước khi tải lại ở màn tạo quán và màn kết quả tạo quán ([CreateStoreScreen.tsx:88](https://github.com/nguyentronglinh045/pos-cafe/blob/f2b486e8998dd5577f3e79eefe70b908da1e3d62/src/app/screens/CreateStoreScreen.tsx#L88), [App.tsx:38](https://github.com/nguyentronglinh045/pos-cafe/blob/f2b486e8998dd5577f3e79eefe70b908da1e3d62/src/app/App.tsx#L38)). Ở màn đơn, tải lại hoặc đóng tab làm mất phần chưa gửi mà không có cảnh báo | Khi còn thay đổi chưa gửi, trình duyệt hỏi xác nhận trước khi tải lại hoặc đóng tab | features mục Order |
| CX-08 | Minh chứng tuần 4, 5 của Lâm và Ngọc | Đang ở nhánh cá nhân, chưa vào repo chung | Sau khi review: script vào `main`, ảnh và phiếu vào `docs` | testing, bản đồ minh chứng |

## Giới hạn

- Các quan sát dựa trên bản demo dữ liệu giả; chưa chạy với backend thật.
- Kịch bản N01 và runbook sẽ được Ngọc, Lâm cập nhật theo các câu trả lời này; tin trả lời chưa gửi tại thời điểm ghi.
- Danh sách trên chưa có ước lượng công sức và chưa xếp vào tuần cụ thể.
