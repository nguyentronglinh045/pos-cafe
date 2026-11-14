# Minh chứng tuần 6 (09/11–15/11/2026) — Võ Văn Ngọc

**Đã chạy lại qua Playwright ngày 14/11, 09:05:01–09:05:21 (UTC+7):** [N01-11, N01-12 và mang đi 568×320](chay-lai-2026-11-14-playwright-r02/README.md), 36 ảnh và 3 trace. N01-11 đúng hành vi, còn lệch nhãn CX-03; N01-12 đúng 6/6; mang đi cuộn tới và bấm được các nút trên thẻ/khung chi tiết, vẫn có 9 nút thấp hơn 44px. Đây là lượt tự động do Codex thực hiện; chưa đánh dấu Ngọc tự chạy tay. Các ghi chú mất kết nối bên dưới là trạng thái trước khi khôi phục Playwright.

**Rà soát bổ sung 14/11/2026:** Codex đã đọc 6 nguồn gốc và xem đủ 66 ảnh N01 + 45 ảnh giao diện theo yêu cầu của Ngọc. Xem [biên bản trước khi nộp](kiem-tra-2026-11-14/kiem-tra-truoc-khi-nop.md): cần làm rõ N01-11 B4 (đúng hành vi, lệch nhãn CX-03), bổ sung thao tác nhập lại tiền ở N01-12 B6, và sửa kết luận khả năng tới nút màn mang đi. **Chưa chạy tay được do công cụ điều khiển Windows/trình duyệt mất kết nối; các ô xác nhận cá nhân bên dưới chưa được đánh dấu.** Nội dung thống kê ngày 12/11 dưới đây là bản ghi gốc.

Việc tuần 6: **kiểm thử các luồng POS, kiểm tra lỗi giao diện và đối chiếu kết quả thực tế với Expected.**

**Trạng thái (12/11/2026):** AI (Claude Code) đã cập nhật kịch bản N01 lên r04, chạy mọi lượt và soạn hai phiếu dưới đây. **Ngọc chưa tự đối chiếu Expected mới, chưa xem ảnh, chưa chạy tay**; xem [ô tự kiểm](#ngọc-tự-kiểm). Câu hỏi Q-GD-1…3 **chưa gửi Linh**.

| File / thư mục | Nội dung |
| --- | --- |
| [N01/N01-kich-ban.md](N01/N01-kich-ban.md) | Kịch bản N01 **r04**: Expected cập nhật theo câu trả lời của Linh ngày 08/11, thêm 5 ca mới (N01-09…13), kết quả 13 ca / 65 bước, so với r03 |
| [loi-giao-dien.md](loi-giao-dien.md) | Lỗi giao diện bốn luồng POS: ui-audit của dự án (48 cặp) và đo theo ngưỡng spec (9 trạng thái × 5 cỡ màn); điểm GD-01…GD-05 |
| `chay-2026-11-12/n01/` | 66 ảnh theo ca và bước, `ket-qua.json` |
| `chay-2026-11-12/giao-dien/` | 45 ảnh theo cỡ màn và trạng thái, `ket-qua.json` |
| `chay-2026-11-12/ui-audit/` | `report.md`, `report.json`, `status.json`, log chạy và log tự kiểm |
| `script/` | Script chạy N01 r04, script đo giao diện, script sinh bảng N01, template N01, module trung gian chạy ui-audit bằng Chrome |

## Nguồn

- **Expected:** nhánh `docs` commit [`e8a1810`](https://github.com/nguyentronglinh045/pos-cafe/tree/e8a1810f3de41453ad33b224334c26d6f8cd52db) (11/11/2026). Gồm:
  - [câu trả lời Q-N01-1…8 và CX-01…CX-09](https://github.com/nguyentronglinh045/pos-cafe/blob/e8a1810f3de41453ad33b224334c26d6f8cd52db/docs/workflow/tasks/team-week05-answers-2026-11-08.md);
  - spec floor-operations, order-management, remake-b01, remake-b02, remake-b03.
- **Bản r03 trước đó** đã nằm trên `docs`, trong `docs/implementation-log/student-week-4-5/tuan-5/24tx610002-VoVanNgoc/`.
- **Hệ thống:** main [`cd35439`](https://github.com/nguyentronglinh045/pos-cafe/tree/cd3543996fb4d06f022dcf4a6829fba43645daff) (10/11/2026). Mã trên máy giống hệt main: đã so mã băm 698 file. `src/` không đổi từ bản chạy r03 (`052a7d1`), nên CX-01…CX-05 chưa được sửa.

## Điểm chính

- **N01 r04, 65 bước:** 61 ĐÚNG, 4 LỆCH, 0 lỗi mới, 0 chưa chạy. Bốn bước LỆCH đều là việc Linh đã chốt cách sửa nhưng chưa có code:

  | Bước | Lệch | Chờ |
  | --- | --- | --- |
  | N01-01 B4 | Lọc bàn đang ẩn bàn không khớp, thay vì làm sáng bàn khớp | CX-01 |
  | N01-05 B4 | Không có nút Đúng tiền khi đang thiếu tiền | CX-02 |
  | N01-03 B5 | Nút vẫn ghi "Bỏ đơn" thay vì "Bỏ thay đổi" | CX-03 |
  | N01-04 B7 | Lịch sử ghi #2 thay vì #24 | CX-04 |

- **5 ca mới đều ĐÚNG.** Các ca này lấy Expected từ spec: mang đi thoát trước khi gửi, tìm món trên toàn menu, thêm/bớt món đã gửi, nhập tiền khách đưa, in tạm tính.
- **So với r03:** N01-01 B3 chuyển từ "chưa kết luận" sang ĐÚNG nhờ câu trả lời Q-N01-5. Hai bước LỖI cũ thành "LỆCH — chờ CX". Ở 44 bước có cả trong r03 và r04, app làm giống r03.
- **Giao diện:**
  - ui-audit: 48/48 cặp, 0 lỗi.
  - Đo theo spec: sơ đồ bàn, gọi món, thanh toán **đạt** B01-07/08, B02-08, R07. Không tràn trang, nút từ 44 px, tiền và nút chính không bị che ở cả 5 cỡ màn; riêng thanh toán, chữ không dưới 12 px.
  - Cần Linh quyết: màn mang đi có 9 nút nhỏ hơn 44 px nhưng chưa có spec (GD-01); màn gọi món ở 568×320 có tên món và giá 10–11 px (GD-02); ngưỡng của ui-audit lỏng hơn spec (GD-05).

## Môi trường và giới hạn

- **Bản demo:** chạy trên máy, dữ liệu giả (`VITE_DATA_MODE=mock`), chỉ mở ở `127.0.0.1`.
  - Chrome tự động. N01 chạy ở 1366×768; phần giao diện đo 5 cỡ màn từ 568×320 đến 1920×1080.
  - Không backend thật, không thiết bị thật. Đây không phải nghiệm thu.
- **ui-audit:** chạy trong một bản clone sạch của main `cd35439` ở thư mục tạm, qua module trung gian để dùng Chrome cài trên máy (chi tiết ở [loi-giao-dien.md](loi-giao-dien.md#cách-kiểm-hai-lớp)). Thư mục mã nguồn trên máy không bị sửa: báo cáo của ui-audit đã chuyển sang đây.
- **Lượt đo giao diện:** chạy hai lần. Lần đầu (09:14) báo "bị che" ở hai chỗ do cách đo; đã sửa script và chạy lại (09:15:58–09:16:53). Số liệu là của lần sau.
- **Dữ liệu demo:** mã cửa hàng và PIN trong script là dữ liệu demo có sẵn trong mã nguồn chế độ mock, không phải thông tin thật.
- **Giờ:** theo đồng hồ máy (UTC+7).


## Ngọc tự kiểm

- [ ] Đã tự mở nguồn và đồng ý bảng "Thay đổi Expected r03 → r04" và "Ca mới r04" trong N01. Ghi giờ.
- [ ] Đã xem ảnh N01 (`chay-2026-11-12/n01/anh/`) và ảnh giao diện (`chay-2026-11-12/giao-dien/anh/`), đồng ý hoặc sửa kết quả.
- [ ] Đã tự chạy tay ít nhất N01-11 và N01-12 trên demo, và tự xem màn mang đi ở 568×320 (GD-01). Ghi giờ thật và điểm nào khác máy.
- [ ] Đã viết lại kết luận GD-xx bằng lời mình.
- [ ] Đã gửi Linh N01 r04 và Q-GD-1…3. Ghi giờ gửi.

## Khi nộp

Phương án dưới đây từng dựa trên quy tắc ngày 09/11/2026. **Đối chiếu 14/11:** [CX-08 tại đúng commit nguồn](https://github.com/nguyentronglinh045/pos-cafe/blob/e8a1810f3de41453ad33b224334c26d6f8cd52db/docs/workflow/tasks/team-week05-answers-2026-11-08.md#cx-08) đã cập nhật ngày 10/11: các snapshot tuần 4–5 được lưu nguyên trên `docs`. Vì vậy bảng tách hai PR sau đây chỉ giữ để tham khảo phương án cũ, chưa phải yêu cầu đã xác nhận cho tuần 6:

| Phần | Đưa vào | Thư mục |
| --- | --- | --- |
| `script/*.mjs` và `script/ui-audit-chrome/` | `main` | `tests/team/week06-ngoc-luong-pos/` |
| Mọi file còn lại (README, N01, loi-giao-dien.md, `chay-2026-11-12/`, `script/n01-r04-template.md`) | `docs` | `docs/workflow/evidence/week06-ngoc-luong-pos-<ngày commit cuối>/` |

- `script/ui-audit-chrome/package.json` mang tên "playwright" vì ui-audit tìm version theo tên đó. Nhờ Linh xem có giữ trên `main` không.
- Khi tách, sửa các link `script/...` trong phiếu cho trỏ sang thư mục trên `main`.
