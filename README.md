# Minh chứng công việc tuần 4 (26/10–01/11/2026) — Trần Thị Lâm

Đề tài POS Cafe. Phần việc: **rà chất lượng 12 nguồn tài liệu (L01)** và **góp ý kịch bản hồi quy N01 của Ngọc (L04)**.

| Thư mục | Nội dung |
| --- | --- |
| [L01/L01-ra-lien-ket.md](L01/L01-ra-lien-ket.md) | Rà 12 nguồn S01–S12 (bản r09): tiêu đề, phạm vi, phiên bản, liên kết, cách diễn đạt; 16 câu hỏi/đề nghị Q-L01-01…16 |
| [L04/L04-ra-kich-ban.md](L04/L04-ra-kich-ban.md) | Góp ý 8 kịch bản N01 (L04-01…08) và xác nhận bản N01 r02 |

## 1. L01 — Rà 12 nguồn tài liệu

**Nhiệm vụ:** rà 12 nguồn tài liệu/spec đã chọn về tiêu đề, phạm vi, phiên bản nguồn, liên kết và cách diễn đạt; ghi chỗ khó hiểu kèm vị trí và đề nghị sửa; tách kiểm offline và online.

**Kết quả:** đủ 12/12 nguồn, kiểm bản offline và đường dẫn online (12/12 mở được); 16 câu hỏi/đề nghị.

**Phát hiện chính:**

- S02 L025: chữ "số đơn" có hai cách hiểu (số thứ tự hay số lượng đơn).
- S01: nhiều thuật ngữ chưa giải thích cho người mới (R06, K, HOLD, quote…).
- S04 L020 và L025: so tiền khách đưa với hai mốc khác nhau ("tổng đơn" và "tổng phần đang chọn").
- S06 L018–L020 ghi bảng B02 là lịch sử, nhưng S01 L021 vẫn dùng B02 làm thay đổi hiện hành.
- Thiếu tài liệu design ánh xạ quyền ↔ nút trong bộ 12 nguồn.
- Mang đi có chức năng trong code nhưng chưa có bằng chứng kiểm hồi quy đủ luồng (S10, S11).

## 2. L04 — Góp ý kịch bản N01

- 8 góp ý L04-01…08 cho 8 kịch bản N01; các góp ý trùng với những điểm Ngọc đã xử lý trong bản r02 (giữ "số đơn" chờ làm rõ, tách căn cứ S06, bỏ expected không có nguồn ở N01-03/05, phân biệt nút ẩn và nút khóa ở N01-08).
- Đồng ý 8/8 ca trên N01 r02 (xác nhận lúc 21:47 ngày 29/10/2026, qua tin nhắn).

## Còn mở

- L01 chưa có đoạn tự giải thích một mục do Lâm tự viết (đang là bản AI soạn, file ghi rõ) và chưa có mốc giờ Lâm tự mở nguồn.
- Các câu hỏi nghiệp vụ Q-L01 và Q-N01 chờ làm rõ.

## Lưu ý

- **Nguồn S01–S12 không kèm theo** vì là nội dung repo dự án; các file dẫn nguồn theo `Sxx/Lnnn` tại ref docs `9fbd68657884155feb9f7680875f5da1356919e9` của repo `nguyentronglinh045/pos-cafe`.
- **AI hỗ trợ:** Claude Code soạn nháp L01 nhóm S01–S04; ChatGPT đọc đủ 12 nguồn, mở 12 đường dẫn, soạn nhận xét và cập nhật các bản L01/L04 từ r03 đến r09. Chi tiết ghi trong từng file.
