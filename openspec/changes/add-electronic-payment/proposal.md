> **Đối chiếu xuất bản 25/10/2026.** Nguồn quyết định/đề xuất được lưu theo ngày trong tài liệu; không tự coi proposal là đã duyệt thực hiện hoặc code/test đã hoàn tất. Đọc trạng thái và câu hỏi còn mở trước khi tiếp tục. [Nguồn, trạng thái và giới hạn](../../../docs/workflow/tasks/docs-wip-publication-2026-10-25.md). Các yêu cầu SHALL/expected bên dưới được giữ; không đổi để hợp thức hóa code.

# Thanh toán điện tử: chuyển khoản và QR

## Trạng thái

**Proposal phân tích, chưa cam kết thực hiện.** Viết ngày 2026-09-12 để trả lời nhận xét phản biện ở mức thiết kế thay vì chỉ một câu trong chương hạn chế. Thuộc giai đoạn 2. Không chiếm tuần nào của giai đoạn 1 và không đổi phạm vi đang cam kết.

## Why

Giảng viên phản biện nêu: hệ chỉ hỗ trợ tiền mặt, còn QR và chuyển khoản mới dừng ở mức xem trước giao diện. Nhận xét ghi nhận nhóm đã trình bày trung thực điều này, nhưng vẫn coi đó là giới hạn đáng kể với một hệ POS cho quán cà phê hiện nay, nơi thanh toán không tiền mặt rất phổ biến.

Rà kho mã ngày 2026-09-12 cho thấy phần khung đã có sẵn nhiều hơn mức mà chương hạn chế mô tả, và chính điều đó làm khoảng cách tới bản dùng được **hẹp hơn vẻ ngoài**:

| Thành phần | Đã có | Chưa có |
| --- | --- | --- |
| Kiểu phương thức thanh toán | Bốn giá trị gồm tiền mặt, chuyển khoản, QR và khác, đã nằm trong kiểu liệt kê của cơ sở dữ liệu và trong mô hình miền (`supabase/migrations/001_schema_enums.sql:16`, `src/domain/models.ts:5`) | Không lời gọi ghi nào nhận phương thức khác tiền mặt |
| Bản ghi thanh toán | Cột phương thức trên bảng thanh toán (`001_schema_enums.sql:250`) | Không có mã giao dịch của bên thứ ba, không có trạng thái chờ đối soát |
| Cấu hình cửa hàng | Trường thông tin QR trên bảng cấu hình (`001_schema_enums.sql:49`) | Chưa được màn cấu hình lưu xuống qua bộ điều hợp cấu hình |
| Giao diện quầy | Ô chọn QR hiển thị nhãn "Chưa bật" và không bấm được (`src/app/drawers/pos/PaymentDrawer.tsx:115`) | Không có màn hiển thị mã, không có bước xác nhận đã nhận tiền |
| Giao diện quản trị | Màn cấu hình phương thức có sẵn khung bật/tắt QR (`src/app/drawers/admin/PaymentSettingsDrawer.tsx:65`) | Không lưu được cấu hình |
| Lịch sử đơn | Nhãn hiển thị cho cả ba phương thức (`src/features/pos/historyHelpers.ts:18`) | Không có dữ liệu thật nào mang phương thức khác tiền mặt |

Nói cách khác, phần còn thiếu **không phải kiểu dữ liệu mà là nghiệp vụ đối soát**: làm sao biết tiền đã về, ai xác nhận, và xử lý thế nào khi khách báo đã chuyển mà tài khoản chưa nhận.

## What Changes

Ba mức, tăng dần theo chi phí và theo mức ràng buộc với bên thứ ba. Mức 1 và 2 không cần hợp đồng hay phí dịch vụ nên nằm trong khả năng của một đồ án không có ngân sách tiền.

**Mức 1 — QR tĩnh, xác nhận thủ công.** Cửa hàng lưu thông tin tài khoản nhận tiền vào cấu hình; màn thanh toán hiện mã QR theo chuẩn thanh toán nội địa kèm số tiền; thu ngân nhìn thông báo nhận tiền trên điện thoại rồi bấm xác nhận. Bản ghi thanh toán lưu phương thức QR kèm người xác nhận và thời điểm. Không có callback, không tự đối soát.

**Mức 2 — QR động theo đơn.** Mã QR mang nội dung chuyển khoản chứa mã tham chiếu duy nhất của đơn, để đối chiếu sau này với sao kê. Thêm màn đối soát so khớp danh sách thanh toán điện tử trong ngày với sao kê nhập vào, đánh dấu khớp và lệch.

**Mức 3 — tích hợp cổng thanh toán thật.** Bên thứ ba báo về khi tiền đã vào, hệ thống tự chuyển đơn sang đã thanh toán. Kéo theo điểm tiếp nhận thông báo phía máy chủ, xác minh chữ ký, chống phát lại, xử lý thông báo đến trùng hoặc đến muộn, và hoàn tiền.

Chung cho mọi mức:

- Lời gọi thanh toán nhận thêm tham số phương thức, thay vì mặc định tiền mặt.
- Hóa đơn in ra ghi rõ phương thức đã dùng.
- Báo cáo doanh thu tách theo phương thức.
- Thanh toán tách đơn giữ nguyên mô hình hiện hành: mỗi lần tách là một đơn độc lập, nên phương thức được ghi theo từng đơn tách chứ không theo phiên bàn.

## Capabilities

### New Capabilities

- `payment-reconciliation` từ mức 2 trở đi: đối soát giữa thanh toán ghi trong hệ thống và tiền thật đã nhận.

### Modified Capabilities

- `payment`: thêm phương thức, thêm trạng thái chờ xác nhận, thêm người xác nhận.
- `store-settings`: lưu và xác thực thông tin tài khoản nhận tiền.
- `reporting`: tách doanh thu theo phương thức.
- `receipt-printing`: hóa đơn ghi phương thức.
- `access-control`: cần quyền riêng cho việc xác nhận đã nhận tiền và cho việc đối soát, vì đây là thao tác đụng tiền.

## Impact

- Cơ sở dữ liệu: thêm cột vào bảng thanh toán; từ mức 2 thêm bảng đối soát. Lời gọi thanh toán và thanh toán tách đơn phải sửa — đây là hai trong ba lời gọi tiền đắt nhất kho mã.
- Bảo mật: từ mức 3 phát sinh điểm tiếp nhận công khai từ Internet, tức bề mặt tấn công mới mà mô hình hiện tại chưa có.
- Kiểm thử: nhóm tình huống mới gồm khách báo đã chuyển nhưng chưa nhận được, chuyển thiếu, chuyển thừa, chuyển hai lần, và xác nhận nhầm.
- Báo cáo tài chính không còn đồng nghĩa với tiền trong két.

## Ngoài phạm vi

- Ví điện tử riêng của từng nhà cung cấp.
- Thanh toán thẻ qua máy POS vật lý.
- Hoàn tiền, vì hệ hiện chưa có nghiệp vụ hoàn tiền cho cả tiền mặt.
- Hóa đơn điện tử theo quy định thuế.

## Phụ thuộc

- Nên sau `redesign-permission-model`, vì việc xác nhận đã nhận tiền cần một quyền riêng.
- Mức 3 nên sau `add-owner-account-and-store-provisioning`, vì cần một danh tính đáng tin để gắn tài khoản nhận tiền và để phân xử tranh chấp.
- Không phụ thuộc nhóm offline.

## Câu hỏi phải chốt trước khi làm

1. Làm tới mức mấy? Mức 1 giải quyết đúng phần lớn tình huống thực tế ở quán nhỏ và không cần ngân sách; mức 3 mới là cái mà thị trường gọi là "tích hợp thanh toán".
2. Ai được xác nhận đã nhận tiền? Nếu thu ngân tự xác nhận thì rủi ro gian lận nội bộ tăng; nếu bắt buộc quản lý thì chậm và cần người có mặt.
3. Đơn đã bấm thanh toán QR nhưng tiền chưa về thì trạng thái là gì? Cần một trạng thái trung gian hay giữ nguyên chưa thanh toán cho tới khi xác nhận?
4. Có cho phép một đơn trả bằng nhiều phương thức không, ví dụ nửa tiền mặt nửa chuyển khoản? Mô hình một thanh toán cho mỗi đơn hiện tại sẽ phải nới nếu có.
5. Mức 2 nhập sao kê bằng cách nào? Dán tay, tải tệp, hay đọc từ hộp thư ngân hàng?
6. Nếu chỉ làm mức 1 thì báo cáo có được gọi là "đã hỗ trợ thanh toán điện tử" không, hay phải ghi rõ là xác nhận thủ công?

## Quyết định đã chốt

Chưa có. Ghi câu trả lời của chủ dự án vào mục này trước khi viết các artifact còn lại.
