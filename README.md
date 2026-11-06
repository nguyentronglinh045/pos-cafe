# Minh chứng tuần 5 (từ 02/11/2026) — Võ Văn Ngọc

Việc tuần 5: dùng 8 kịch bản N01 (bản r02 đã thống nhất với Lâm), bổ sung phần thiếu rồi chạy thử trên bản demo, ghi từng bước **ĐÚNG / LỖI / CHƯA CHẠY**.

| Thư mục / file | Nội dung |
| --- | --- |
| [N01/N01-kich-ban.md](N01/N01-kich-ban.md) | N01 bản **r03**: giữ nguyên 8 ca và expected của r02, thêm điều kiện chạy trên demo, cột Actual, kết quả từng bước, câu hỏi Q-N01-7/8 |
| [N01/goc-r02/](N01/goc-r02/) | Bản r02 gốc, lấy từ nhánh `24tx610002-VoVanNgoc/tuan-4` commit `e6b78a0`, không sửa |
| [chay-demo-2026-11-03/anh/](chay-demo-2026-11-03/anh/) | 45 ảnh chụp, mỗi bước một ảnh, đặt theo ca (`N01-05/B4.png`…) |
| `chay-demo-2026-11-03/ket-qua-lan-1.json` | Kết quả máy ghi lần chạy 8 ca lúc 09:51 (N01-02 hỏng ở bước chuẩn bị do script) |
| `chay-demo-2026-11-03/ket-qua-N01-02-lan-2.json` | Kết quả chạy lại N01-02 lúc 09:52 sau khi sửa script |
| `chay-demo-2026-11-03/script/run-n01.mjs` | Script Playwright đã dùng để chạy |

## Kết quả (03/11/2026)

44 bước trong 8 ca: **41 ĐÚNG, 2 LỖI, 1 CHƯA KẾT LUẬN, 0 CHƯA CHẠY**.

| Ca | Kết quả | Ghi chú |
| --- | --- | --- |
| N01-01 Sơ đồ bàn | 4 đúng, 1 lỗi, 1 chưa kết luận | B4: bộ lọc **ẩn** bàn không khớp thay vì làm nổi bật (Q-N01-8). B3: trên bàn không có "số đơn" (Q-N01-5) |
| N01-02 Gọi món, nhóm bắt buộc | 5/5 đúng | Phải chuẩn bị dữ liệu trước: demo không có nhóm bắt buộc. Hộp thoại không có nút "Hủy", chỉ có "Đóng" (X) |
| N01-03 Đóng khi còn nháp | 5/5 đúng | |
| N01-04 Trả đủ | 6/6 đúng | |
| N01-05 Thiếu tiền | 4 đúng, 1 lỗi | B4: khi thiếu tiền không có nút "Đúng tiền" để bấm (Q-N01-7) |
| N01-06 Trả một phần | 6/6 đúng | |
| N01-07 Mang đi | 6/6 đúng | |
| N01-08 Thiếu quyền (Waiter) | 5/5 đúng | |

"LỖI" ở đây nghĩa là app khác kịch bản. Chưa kết luận là lỗi của app hay kịch bản cần sửa; cả hai đã thành câu hỏi gửi Linh (Q-N01-7, Q-N01-8).

## Môi trường và giới hạn

- Mã nguồn: thư mục `pos-cafe-main` trên máy, không có git. Đã so mã băm với main `052a7d1` (PR #15): toàn bộ `src/` giống hệt; 8 file khác chỉ ở `ci/`, `scripts/`.
- Chế độ dữ liệu giả (`VITE_DATA_MODE=mock`), dev server local, Chrome headless qua Playwright, màn 1366×768. **Không backend thật, không thiết bị thật**, không phải nghiệm thu sản phẩm.
- Dữ liệu demo khác dữ liệu minh họa trong kịch bản ở vài chỗ (tên khu, tên món "Cà phê", số bàn đang phục vụ); bảng đối chiếu nằm trong N01 mục "Bổ sung r03".
- Mã cửa hàng và PIN trong `script/run-n01.mjs` là dữ liệu demo có sẵn trong mã nguồn chế độ mock, không phải thông tin thật.

## AI hỗ trợ

Claude Code đọc bản r02 từ repo git trên máy, kiểm phiên bản mã nguồn, viết script, chạy 8 ca tự động, xem ảnh và ghi kết quả vào N01 r03. Ngày 03/11/2026 Ngọc đã xem ảnh, đồng ý với kết quả và tự chạy tay lại N01-01 (11:11), N01-05 (11:13) trên cùng bản demo. Ngọc xác nhận đã gửi phần tuần 5, gồm Q-N01-7/8, cho Linh lúc 06/11/2026 08:30; còn chờ Linh trả lời Q-N01-1…8.
