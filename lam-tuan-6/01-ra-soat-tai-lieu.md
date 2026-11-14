# Rà soát tài liệu — 12/11/2026

**Bản nháp do AI (Claude Code) soạn từ lượt chạy ngày 12/11. Lâm chưa xem; xem ô tự kiểm trong [README](README.md).**

## Tài liệu đã rà

Tất cả lấy từ nhánh `docs` commit [`e8a1810`](https://github.com/nguyentronglinh045/pos-cafe/tree/e8a1810f3de41453ad33b224334c26d6f8cd52db/docs) (11/11/2026):

| Tài liệu | Phần rà | Đối chiếu với |
| --- | --- | --- |
| `docs/demo-runbook.md` | Bước 1–16 và Ghi Chú Kỹ Thuật (bản viết lại ngày 09/11 theo 20 góp ý của Lâm) | Làm theo nguyên văn trên bản demo, main `cd35439` |
| `docs/requirements.md` | Đầu trang, bảng FR, mục Ngoài phạm vi | Bản demo (chi tiết ở [02](02-doi-chieu-yeu-cau.md)) và câu trả lời ngày 08/11 |
| `docs/regression-map.md` | Link ca kiểm, số liệu, cách viết | Mã nguồn và kết quả chạy test ngày 12/11 (chi tiết ở [03](03-kiem-tra-hoi-quy.md)) |

Mã các điểm: **TL-xx** (tài liệu). Cột "Ai quyết" chỉ là gợi ý: Linh là người sửa tài liệu chính thức.

## A. demo-runbook.md

### Bước 1–11: làm theo nguyên văn được hết

Lượt 3 lúc 08:44:57–08:45:12 ngày 12/11 làm đúng thứ tự bước 1–11.

- **44/44 tên nút, tên màn và tên vai** mà runbook nhắc ở bước 1–11 đều có đúng chữ trên màn hình, đúng cả dấu ("Mở khoá", "Hoá đơn thanh toán", "In hóa đơn sau khi thanh toán").
- Mọi hành vi runbook mô tả đều khớp:
  - lọc **Trống** làm ẩn B01 sau khi gửi đơn, bấm **Tất cả** thì thấy lại;
  - ô bàn ghi `B01 145K`;
  - bấm **+** cho ra 1/2 → 2/2 → 1/2;
  - hóa đơn phần đầu mang số cũ #27, phần còn lại thành #28 và chưa chọn món nào;
  - đang ở màn thanh toán thì không bấm được **Báo cáo**;
  - thiếu tiền thì hàng nút nhanh bị thay bằng "Còn thiếu…", đúng ghi chú chờ CX-02;
  - nút xóa bị khuất ở 1366×768;
  - Lịch sử ghi #2, #3 trong khi hóa đơn ghi #27, #28;
  - Báo cáo tăng đúng 145.000đ / 2 đơn;
  - Món bán chạy ghi doanh thu cả ngày (đã có CX-05).

Ảnh: `chay-2026-11-12/demo/anh/R-runbook/B01…B11`.

| Mã | Chỗ trong runbook | Điểm thấy | Gợi ý | Ai quyết |
| --- | --- | --- | --- | --- |
| TL-01 | Đầu trang và mục Ghi Chú Kỹ Thuật | Hai chỗ ghi "bản viết lại này chưa được chạy lại nguyên văn" và "chưa thử nhánh **Tạo quán mới**". Ngày 12/11 đã chạy nguyên văn bước 1–11 trên main `cd35439` và thử nhánh Tạo quán mới trên bản mock | Cập nhật hai câu này, dẫn tới hồ sơ tuần 6 khi đã lên `docs` | Linh |
| TL-02 | Bước 9.2, "nút ⌫" | Trên màn, nút xóa chỉ có hình biểu tượng, không có chữ; trình đọc màn hình đọc là "Xóa một số" | Viết "nút xóa (hình ⌫) ở hàng cuối bàn phím số" để người đọc không đi tìm chữ "⌫" | Lâm đề xuất |

### Bước 12–16: chưa được viết lại

Hành vi của bước 12–16 khớp app:
- hủy đơn cần ghi chú khi chọn Lý do khác;
- Báo cáo trừ đơn hủy, hiện "Đơn đã huỷ", "Tiền hủy";
- bỏ quyền thì Thu ngân không còn nút Thanh toán;
- xóa dữ liệu mẫu bị chặn khi còn đơn mở.

Ảnh: `R-runbook/B12…B16`. Tuy vậy, cách viết vẫn là kiểu cũ mà 20 góp ý tuần 5 đã sửa cho bước 1–11.

| Mã | Chỗ trong runbook | Điểm thấy | Gợi ý | Ai quyết |
| --- | --- | --- | --- | --- |
| TL-03 | Bước 12–16 | Vẫn dùng mã quyền và từ tiếng Anh mà người dùng không thấy trên màn: `orderHistory.view`, `order.voidPaid`, `employee.permission.edit`, `payment.take`, `menu.manage`, `floor.manage`, `settings.manage`, `data.clearDemo`, "badge", "paid", "actor", "fixture", "authority", "lifecycle", "blocked", "Report". Đối chiếu tên trên màn: `payment.take` là ô **Thu tiền**; `menu.manage` là mục **Thực đơn**; `floor.manage` là **Sơ đồ cửa hàng**; `settings.manage` là **Cài đặt**; `data.clearDemo` là nút **Đặt lại dữ liệu mẫu** trong Cài đặt; "Report" là **Báo cáo**; "Lịch sử" trên màn là **Lịch sử đơn** | Viết lại bước 12–16 theo cùng cách đã dùng cho bước 1–11 | Linh đồng ý thì Lâm viết |
| TL-04 | Bước 16, và FR-20 trong requirements | Runbook và FR-20 gọi là "clear / xóa dữ liệu mẫu". App ghi **Đặt lại dữ liệu mẫu**, hộp thoại giải thích "chỉ đặt lại dữ liệu mẫu có sẵn, không xoá dữ liệu người dùng tự tạo và giữ lại tài khoản quản lý hiện tại". Hai cách gọi cho người đọc hiểu khác nhau: xóa đi hay khôi phục lại | Chốt một tên, sửa cả runbook, requirements và chữ trên app cho giống nhau | Linh |
| TL-05 | Bước 16 | Dữ liệu mẫu có sẵn 3 đơn đang mở (B02 #24, B05 #25, Mang đi #26). Vì vậy trên bản demo mới, bấm Đặt lại dữ liệu mẫu **luôn bị chặn** ("Còn … đơn đang mở"). Lượt 12/11 thấy 4 đơn vì thêm đơn B01 ở bước 14 | Ghi rõ: muốn trình diễn nhánh xóa thành công thì phải trả hoặc hủy hết đơn đang mở trước; nếu chỉ muốn trình diễn trạng thái bị chặn thì làm luôn | Lâm đề xuất |
| TL-06 | Bước 14 | "Ở phiên nhân viên đích, chờ authority được xác minh theo lifecycle". Trên demo, chỉ cần bấm **Khoá**, chọn **Thu ngân**, nhập PIN; quyền mới có hiệu lực ngay khi đăng nhập lại, không phải chờ | Viết thành các bước bấm cụ thể; nếu thật sự cần chờ (ví dụ khi dùng hai máy với backend) thì nói rõ chờ bao lâu, nhìn vào đâu | Linh xác nhận |
| TL-07 | Bước 15 | Chỉ nêu ba mã quyền, không nói mở mục nào, xem gì, đóng thế nào. Chủ quán còn có mục **Cấu hình thanh toán** mà runbook không nhắc. Nút đóng ba màn quản trị ghi khác nhau: **Thoát** (Thực đơn), **Huỷ** (Sơ đồ cửa hàng, Cài đặt) | Liệt kê mục trên thanh trái, điều cần chỉ cho người xem, và tên nút để thoát mà không lưu | Lâm đề xuất |

## B. requirements.md

| Mã | Chỗ | Điểm thấy | Gợi ý | Ai quyết |
| --- | --- | --- | --- | --- |
| TL-08 | Đầu trang | Ghi "cập nhật mô tả theo `main@711a22e` ngày 25/10/2026". Main hiện tại là `cd35439`; mã `src/` đã đổi ở PR #15 (`052a7d1`) và không đổi từ đó tới nay. Các dòng FR vẫn đúng với hành vi thấy trên demo | Ghi thêm mốc đối chiếu mới, hoặc ghi rõ các dòng FR đã được thử lại trên `cd35439` ngày 12/11 | Linh |
| TL-09 | FR-19 | Trạng thái "Đã triển khai" cho cả "top món", trong khi CX-05 đã chốt hàng Món bán chạy hiển thị sai nghĩa. Thêm: ô **Thanh toán phổ biến** luôn ghi "Đã thanh toán" (YC-01 ở [02](02-doi-chieu-yeu-cau.md)) | Ghi chú cạnh FR-19: đã triển khai, hai chỗ hiển thị đang chờ sửa | Linh |
| TL-10 | FR-08 | "Đã triển khai". Tạo, mở lại, thanh toán mang đi đều chạy, nhưng thẻ lọc, nút In lại và thông báo sau khi trả bị lệch (YC-02…04) | Như TL-09 | Linh |
| TL-11 | FR-02 | Không ghi rằng bản demo mock nhận mọi Store Key. Người thử demo có thể tưởng nhánh "key sai" đã được kiểm | Ghi giới hạn này ở testing hoặc limitations | Linh |

## C. regression-map.md

| Mã | Chỗ | Điểm thấy | Gợi ý | Ai quyết |
| --- | --- | --- | --- | --- |
| TL-12 | Mọi link ca kiểm | Các link ghim commit cũ `711a22e`. Đã kiểm cả **62 link**: tất cả vẫn trỏ đúng dòng đó trên main `cd35439`, không link nào gãy hay lệch dòng ([`rm-links-check.tsv`](chay-2026-11-12/lien-ket/rm-links-check.tsv)) | Không cần sửa link | — |
| TL-13 | Bảng nhãn U/S | U ghi "113 files/1.201 tests" (lần chạy `cf8e304`), S ghi "44 PASS, 37 skip". Lần chạy 12/11 trên `cd35439`: U **116 file, 1.240 ca đạt**; S **86 ca: 49 đạt, 37 bỏ qua** (khớp số CI mà chính tài liệu ghi ở mục T02) | Thêm một mốc kết quả mới, giữ mốc cũ làm lịch sử | Linh |
| TL-14 | Dòng FR-06, ca B `areas.spec.ts` | Ca này cần file `artifacts/stitch/B01/v3/responsive-contract.proposed.json`, nhưng file không có trong repo (đã tìm trên mọi nhánh). Người khác không chạy lại được ca mà dòng FR-06 dựa vào | Đưa file vào repo, hoặc ghi rõ ca này chỉ chạy được trên máy có file đó | Linh |
| TL-15 | Cột "Evidence" | Ghi "U: suite PASS; chưa có kết quả riêng từng TC". Lượt 12/11 đã có kết quả riêng cho **35 ca unit** được dẫn, đều đạt ([03](03-kiem-tra-hoi-quy.md)) | Có thể dẫn kết quả này | Linh |
| TL-16 | Các mục từ dòng 11 đến 23 (T02) | Chữ viết dính, thiếu dấu cách, rất khó đọc, ví dụ "C18phase trênnhánhriêng", "**18/18PASS**,source/workflow9ec6b05,PG16native30/30+cleanup", "khôngđổi appassertion", "Chưamerge/mainvẫn052" | Tách lại chữ cho đúng | Linh |
| TL-17 | Dòng FR-08, FR-10 và mục "Cách hoàn thiện" ý 3 | Ghi còn thiếu ca cho hành trình mang đi (tạo → mở lại → trả) và "phiếu bếp không giá". Lượt 12/11 đã làm hai hành trình này trên demo (ảnh `T-mang-di/…`, `R-runbook/B05c`), nhưng đó là lượt chạy thử, không phải test tự động trong repo | Dùng làm đầu vào khi viết ca tự động; chưa đổi trạng thái trong bản đồ | Linh |

## Câu hỏi cho Linh

Các câu Q-L6-1…6 nằm trong [README](README.md#câu-hỏi-cho-linh).

## Giới hạn

- Chỉ rà ba tài liệu trên; chưa rà `features.md`, `screens.md`, `testing.md`, `limitations.md`. Riêng `features.md` dòng 162 được đọc để đối chiếu ô Thanh toán phổ biến.
- Mọi điểm "thấy trên màn" là bản demo dữ liệu giả, không phải backend thật.
