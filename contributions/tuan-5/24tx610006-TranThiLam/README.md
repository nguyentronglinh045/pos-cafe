# Minh chứng tuần 5 (từ 02/11/2026) — Trần Thị Lâm

Việc tuần 5: đọc hướng dẫn hiện có và thử làm theo ở hai luồng gọi món, thanh toán. Ghi chỗ thiếu bước, khó hiểu, tên nút hoặc hình minh họa không khớp, rồi đề xuất cách viết dễ hiểu hơn.

**Trạng thái (06/11/2026):** Ngày 03/11 Lâm đã xem ảnh và viết lại 20 đề xuất bằng lời của mình (r02). Ngày 06/11 AI chạy lại bước 4–11 hai lượt trên bản demo: B01 tổng 145.000đ, trả 2 lần, Báo cáo tăng đúng 145.000đ/2 đơn, bàn về trống. Lâm báo đã xem ảnh và ghi đã tự làm tay bước 4–11 lúc 14:23–14:49; chỗ thấy khác **chưa ghi**. Việc gửi Linh (nhật ký ghi 14:55–14:58) **chờ Lâm xác nhận**.

| Thư mục / file | Nội dung |
| --- | --- |
| [thu-huong-dan/kiem-thu-2026-11-06.md](thu-huong-dan/kiem-thu-2026-11-06.md) | Phiếu kiểm thử 06/11: giờ từng bước, điểm vướng, đối chiếu 20 đề xuất |
| [thu-huong-dan/thu-huong-dan-r01.md](thu-huong-dan/thu-huong-dan-r01.md) | Phiếu gốc r02: kết quả làm theo từng bước ngày 03/11, 20 góp ý HD-01…HD-20, bản viết lại bước 4–11, câu hỏi H-Q1…H-Q4, ô tự kiểm của Lâm |
| [thu-huong-dan/noi-dung-gui-linh-2026-11-06.md](thu-huong-dan/noi-dung-gui-linh-2026-11-06.md) | Bản nháp gửi Linh kèm H-Q1…H-Q4; việc gửi chờ Lâm xác nhận |
| [chay-demo-2026-11-06-phien-moi/luot-hoan-chinh/](chay-demo-2026-11-06-phien-moi/luot-hoan-chinh/) | Lượt chính 14:39:19–14:40:35: 26 ảnh, 26 file chữ, `ket-qua.json`; không lưu script |
| [chay-demo-2026-11-06-phien-moi/luot-14-29/](chay-demo-2026-11-06-phien-moi/luot-14-29/) | Lượt đối chiếu 14:29:06–14:29:39: 22 ảnh, `ket-qua.json`, script |
| [chay-demo-2026-11-03/anh/](chay-demo-2026-11-03/anh/) | 23 ảnh chụp ngày 03/11, đặt tên theo bước (`B08a-chon-mot-phan.png`…) |
| `chay-demo-2026-11-03/ket-qua.json` | Quan sát máy ghi ở lần chạy 03/11, 14:28:51–14:29:10 |
| `chay-demo-2026-11-03/script/run-huong-dan.mjs` | Script Playwright đã dùng |

## Hướng dẫn đã thử

`docs/demo-runbook.md`, mục "Flow Demo Chính", nhánh `docs` commit `9916522` của repo `nguyentronglinh045/pos-cafe`. Bản trên máy đọc từ repo minh chứng tuần 4 của Lâm (chỉ đọc, không sửa). Chưa chắc đây đúng là "hướng dẫn hiện có" mà kế hoạch nhắc; đã ghi câu hỏi H-Q1.

## Điểm chính

- Làm theo được hết bước 4–11 trên bản demo, nhưng **20 chỗ** cần sửa cách viết. Phần lớn là từ tiếng Anh/kỹ thuật và tên nút khác chữ trên màn hình.
- **Thiếu bước:** chưa nói phải đổi danh mục món; chưa nói phải đóng cửa sổ **Phiếu gửi bếp** sau khi gửi đơn; chưa nói chọn vai nào để có quyền xem **Báo cáo**.
- **Thứ tự bước 8–9 không làm theo được nguyên văn:** đang ở màn thanh toán thì không mở được Báo cáo; quay lại thì các món đã được chọn sẵn, trái với "selection lúc này rỗng".
- **Số đơn dễ nhầm:** Lịch sử đơn ghi #2, #3 trong khi hóa đơn in #27, #28.
- **Hình minh họa:** hướng dẫn không có hình nào; bộ ảnh cũ đã bị bỏ khỏi nhánh docs.
- **Lọc Trống (phát hiện 06/11):** nếu bấm **Trống** rồi gọi món, về sơ đồ bộ lọc vẫn bật nên bàn vừa gọi bị ẩn; phải bấm **Tất cả**.
- **Món bán chạy (phát hiện 06/11):** hàng "Americano 145K" là doanh thu cả ngày, không phải doanh thu của món; chờ Linh xem.

## Môi trường và giới hạn

- Bản demo chạy trên máy, dữ liệu giả (`VITE_DATA_MODE=mock`), `src/` giống main `052a7d1`; Chrome tự động, màn 1366×768 (lượt 06/11 có thêm 1920×1080). Không backend thật, không thiết bị thật, không phải nghiệm thu.
- Ngày 03/11, lần chạy đầu (14:23–14:28) dừng ở bước 5 vì script chưa bấm sang đúng danh mục món; đã sửa script và chạy lại. Ảnh và kết quả là của lần sau.
- Lượt 06/11 lúc 14:39 không lưu script, nên chỉ đối chiếu được qua ảnh, chữ và JSON.
- Mã cửa hàng và PIN trong các script là dữ liệu demo có sẵn trong mã nguồn chế độ mock, không phải thông tin thật; các phiếu không ghi lại.

## AI hỗ trợ

Ngày 03/11: Claude Code tìm hướng dẫn trong nhánh docs, viết script, làm theo bước 1–11 trên bản demo, xem ảnh, soạn 20 góp ý, bản viết lại và câu hỏi. Cùng ngày (file lưu 15:13) Lâm đã xem ảnh, đồng ý phần "Thấy gì" và viết lại cả 20 đề xuất bằng lời của mình.

Ngày 06/11: một phiên AI khác chạy lượt 14:39 và viết phiếu kiểm thử, bản nháp gửi Linh. Claude Code chạy lượt 14:29, so mã nguồn với main, đối chiếu phiếu với minh chứng, tìm nguyên nhân số Món bán chạy và chỉnh các ghi chú về nguồn. Lâm báo đã xem ảnh và ghi đã tự làm tay lúc 14:23–14:49; AI không kiểm chứng được giờ này, chỗ thấy khác chưa ghi. Việc gửi Linh chờ Lâm xác nhận.
