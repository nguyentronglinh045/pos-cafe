# Minh chứng công việc tuần 4 (26/10–01/11/2026) — Võ Văn Ngọc

Đề tài POS Cafe. Phần việc: **chuẩn bị kịch bản hồi quy từ spec (N01)** và **test 4 màn POS ở chế độ mock** (việc giao thêm).

| Thư mục | Nội dung |
| --- | --- |
| [N01/N01-kich-ban.md](N01/N01-kich-ban.md) | 8 kịch bản hồi quy, bản r02 — đã tự đối chiếu nguồn, **chưa chạy** |
| [N01/gui-lam/](N01/gui-lam/) | Các bản đã gửi Lâm để góp ý: r01 (nháp, 21:06), r02 (đã đối chiếu, 21:44) |
| [N01/dau-vao/](N01/dau-vao/) | Góp ý L04 và tin nhắn xác nhận nhận từ Lâm, lưu nguyên văn |
| [test-mock-2026-10-29/](test-mock-2026-10-29/) | Biên bản test, 98 ảnh chụp 13 kích thước màn hình, script |

## 1. N01 — Kịch bản hồi quy

**Nhiệm vụ:** chuẩn bị 6–8 kịch bản từ spec cho 4 luồng POS (sơ đồ bàn, gọi món, thanh toán, mang đi), có ca lỗi/biên và ca thiếu quyền; mỗi expected dẫn được dòng nguồn.

**Kết quả:** 8 ca N01-01…N01-08 — sơ đồ bàn (01), gọi món (02, 03), thanh toán (04, 05, 06), mang đi (07), thiếu quyền (08); lỗi/biên: 02, 03, 05. Mỗi ca có mục tiêu, quyền giả định, dữ liệu minh họa, 3–6 bước, expected kèm nguồn `Sxx/Lnnn`.

**Quá trình (29/10/2026):**

| Giờ | Việc |
| --- | --- |
| Tối 29/10 | AI soạn nháp 8 ca từ S01–S09, tự rà nháp một lượt |
| 21:06 | Gửi Lâm bản r01, ghi rõ là nháp chưa tự đối chiếu |
| 21:08–21:36 | Tự mở từng dòng nguồn, đối chiếu lần lượt 8 ca; lưu r02 |
| 21:40 | Nhận góp ý dự thảo L04; trả lời 8 đề xuất trong N01 |
| 21:44 | Gửi Lâm bản r02 |
| 21:45 | Gửi Linh 6 câu hỏi cần làm rõ Q-N01-1…6 |
| 21:56 | Nhận tin nhắn Lâm đồng ý 8/8 ca trên r02 |

**Điểm tự phát hiện và sửa khi đối chiếu:**

- N01-03 B5: bỏ ý "màn đơn đóng sau khi bỏ nháp" vì không có câu nguồn → câu hỏi Q-N01-4.
- N01-05 B5: bỏ ý "không tự chọn lại tất cả" vì quy tắc S07 L027 chỉ áp khi hệ thống tải lại dữ liệu, ca này không có bước đó.
- Phân biệt mức căn cứ: bước chỉ dựa bảng B02 (S06, tự ghi là lịch sử) được đánh dấu chờ xác nhận (Q-N01-6); bước có căn cứ spec nền S03 giữ nguyên.
- Phân biệt hai quy tắc quyền (S08 PERM-04): thiếu quyền → không hiện nút (N01-08); có quyền nhưng thiếu điều kiện nghiệp vụ → nút hiện nhưng bị khóa kèm lý do (N01-05).

**Còn chờ trả lời:** Q-N01-1…6 (đơn mang đi rỗng; nút chính khi thiếu quyền thanh toán; design ánh xạ nút ↔ quyền; tên nút bỏ nháp; nghĩa "số đơn"; hiệu lực bảng B02).

## 2. Test 4 màn POS chế độ mock (29/10/2026)

- **Cách làm:** AI (Claude Code) chạy ứng dụng ở chế độ dữ liệu giả, điều khiển Chromium giả lập 13 kích thước màn hình và xem ảnh từng bước. Không backend thật, không thiết bị thật; không xác định được PR/commit vì thư mục mã nguồn không có lịch sử git.
- **Kết quả theo 8 ca N01:** 7 ca đạt; N01-02 đạt một phần (dữ liệu mock không có nhóm tùy chọn bắt buộc).
- **Hiển thị:** không tràn trang hay cắt nút từ 1920×1080 đến 568×320; màn dọc hiện hướng dẫn xoay ngang đúng yêu cầu.
- **7 điểm ghi nhận UI-01…07**, nặng nhất: màn Mang đi tràn ngang ở 568×320; 9 nút ở màn Mang đi nhỏ hơn 44px.
- Kết quả này tách riêng khỏi N01 (N01 vẫn là kịch bản chưa chạy). Chưa test trên điện thoại/tablet thật.

## Lưu ý

- **Nguồn S01–S12 không kèm theo** vì là nội dung repo dự án; các file dẫn nguồn theo `Sxx/Lnnn` tại ref docs `9fbd68657884155feb9f7680875f5da1356919e9` của repo `nguyentronglinh045/pos-cafe`.
- **AI hỗ trợ:** Claude Code soạn nháp 8 ca và câu hỏi, liệt kê dòng nguồn và đặt câu hỏi tự kiểm để Ngọc mở nguồn trả lời, ghi trạng thái vào file theo xác nhận của Ngọc; chạy test mock và soạn biên bản. Việc đối chiếu nguồn và quyết định sửa expected do Ngọc thực hiện.
- Mã cửa hàng và PIN trong `test-mock-2026-10-29/script/` là dữ liệu demo của chế độ mock, không phải thông tin thật.
