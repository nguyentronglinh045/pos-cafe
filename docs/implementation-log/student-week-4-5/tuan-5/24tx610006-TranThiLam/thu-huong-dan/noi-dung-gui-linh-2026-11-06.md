# Nội dung chuẩn bị gửi Linh — 06/11/2026

**BẢN NHÁP. Nhật ký Lâm ghi đã gửi Linh lúc 14:55–14:58 ngày 06/11/2026, đang chờ Lâm xác nhận.** Bản dưới đây được sửa sau mốc đó (15:06 trở đi), nên nếu đã gửi thì Linh nhận bản cũ hơn.

**Tiêu đề:** Kết quả thử bước 4–11 và nhờ xác nhận H-Q1–H-Q4

Linh ơi,

Nhờ Linh xem phiếu thử hướng dẫn gọi món, thanh toán tuần 5 và 20 đề xuất cách viết của Lâm.

Ngày 06/11, AI đã chạy tự động bước 4–11 qua giao diện bằng Playwright, hai lượt: **14:29:06–14:29:39** và **14:39:19–14:40:35 (UTC+7)**, đều có ảnh và giờ từng bước. Đây là máy thao tác. **Lâm cũng đã tự làm tay bước 4–11 một lượt, lúc 14:23–14:49** ([chỗ thấy khác so với máy — Lâm điền trước khi gửi]). Demo chạy trên máy ở cổng 5175, dữ liệu giả; `src/` khớp main `052a7d1` (đã so mã băm từng file).

Lượt 14:39 trên B01 tạo tổng 145.000đ, trả trước 70.000đ rồi trả 75.000đ. Báo cáo tăng từ 0đ/0 đơn lên 145.000đ/2 đơn, bàn về trống. Hóa đơn #27/#28 vẫn khác số #2/#3 trong Lịch sử.

Điểm cần bổ sung vào hướng dẫn:

- Nếu đã chọn lọc **Trống**, sau gửi đơn bàn vừa gọi bị ẩn. Thêm vào bước 6/HD-08: **“Nếu đang lọc Trống, bấm Tất cả để thấy lại bàn.”** Ảnh B6a và B6b của lượt 14:39 thể hiện trước/sau thao tác này.
- HD-02 cần nơi nhận PIN. HD-11 cần ghi vòng +: 1/2 → 2/2 → 1/2. HD-15 nên cho phép gõ trực tiếp vào ô tiền và nhắc nút ⌫ bị khuất ở 1366×768, thấy ngay ở 1920×1080.
- HD-16 cần điều kiện bật **In hóa đơn sau khi thanh toán**. Nút In của HD-07 chưa thử; chưa xác nhận in vật lý.
- Tổng Báo cáo đúng, nhưng hàng **Món bán chạy** ghi Americano 145K trong khi món này trên hóa đơn là 70.000đ. Theo `src/features/admin/reportHelpers.ts` L37, số này là doanh thu cả ngày của ngày món đó đứng đầu. Thẻ tóm tắt có ghi "1 ngày top", còn hàng này thì không. Nhờ Linh xem đây là chủ đích hay cần đổi cách hiển thị.

20 đề xuất r02 của Lâm được giữ nguyên. Bản đề xuất bước 4–11 đã bổ sung các điểm trên, chưa sửa runbook chính thức.

Nhờ Linh xác nhận:

1. **H-Q1 — Tài liệu áp dụng:** “Hướng dẫn hiện có” trong kế hoạch tuần 5 có đúng là docs/demo-runbook.md, mục Flow Demo Chính trên nhánh docs, commit 9916522, hay có hướng dẫn khác cho nhân viên quán? File vẫn ở nhánh docs; thư mục mã nguồn đang dùng không chứa bản đó.
2. **H-Q2 — Số đơn đối chiếu:** Cả hai lượt ngày 06/11 vẫn thấy Lịch sử #2/#3 khác hóa đơn #27/#28. Đây là số thứ tự theo bộ lọc hay lỗi cần sửa? Hướng dẫn nên cho người dùng đối chiếu trường nào? Chưa coi cách giải thích “số thứ tự khác số bill” là kết luận đã được Linh xác nhận.
3. **H-Q3 — Thứ tự Báo cáo:** Có thể dời xem doanh thu từ giữa bước 8 xuống bước 11 không? Đang ở Thanh toán không mở được Báo cáo trực tiếp. Vừa tách thì lựa chọn rỗng; nếu rời đi xem Báo cáo rồi quay lại thì Chọn tất cả bật sẵn. Nếu giữ thứ tự cũ, cần ghi rõ đường quay lại và trạng thái lựa chọn này.
4. **H-Q4 — Ảnh minh họa:** Có được thêm ảnh chụp demo vào hướng dẫn không, và lưu ở đâu/nhánh nào? Đã có bộ ảnh mới ngày 06/11; nhờ Linh xác nhận quy ước trước khi thêm vào tài liệu chính thức.

Tài liệu dự kiến kèm theo:

- [Phiếu nguồn và 20 đề xuất r02 của Lâm](thu-huong-dan-r01.md).
- [Phiếu kết quả mới, thời gian từng bước và bảng đối chiếu 20 đề xuất](kiem-thu-2026-11-06.md).
- [Bộ bằng chứng lượt 14:39](../chay-demo-2026-11-06-phien-moi/luot-hoan-chinh/), gồm ảnh, text UI và ket-qua.json; lượt này không lưu script.
- [Bộ bằng chứng lượt 14:29](../chay-demo-2026-11-06-phien-moi/luot-14-29/), gồm ảnh, ket-qua.json và script.

Cảm ơn Linh.

---

Ghi nhận gửi bên ngoài nội dung tin nhắn: **CHỜ LÂM XÁC NHẬN** (nhật ký ghi 14:55–14:58). Chỉ chốt giờ khi có bằng chứng gửi thành công. H-Q1–H-Q4 chưa có trả lời được xác nhận.
