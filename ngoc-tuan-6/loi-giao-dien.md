# Kiểm tra lỗi giao diện bốn luồng POS — 12/11/2026

**Bổ sung thực thi ngày 14/11/2026:** [mang đi 568×320 chạy lại qua Playwright](chay-lai-2026-11-14-playwright-r02/README.md) đã cuộn tới và bấm thật Mở đơn/Thanh toán trên thẻ lẫn khung chi tiết, mở đúng #26/84.000đ. GD-01 vẫn còn 9 nút thấp hơn 44px. Lượt mới bổ sung phần thiếu trong `keys: []` của số liệu ngày 12/11; không sửa hồi tố JSON cũ và chưa phải xác nhận thao tác cá nhân hoặc touch trên thiết bị thật.

**Rà soát ảnh 14/11/2026:** đã xem đủ 45 ảnh, gồm ảnh gốc 568×320. Xem [biên bản bổ sung](kiem-tra-2026-11-14/kiem-tra-truoc-khi-nop.md). Màn mang đi có `keys: []` trong cả 5 bản ghi nên **chưa kiểm khả năng tới nút/bị che**; phần này không được diễn giải thành đạt. Chưa thao tác trực tiếp do công cụ điều khiển mất kết nối.

## Expected về giao diện

Lấy từ spec trên nhánh `docs` commit `e8a1810`:

| Màn | Expected | Nguồn |
| --- | --- | --- |
| Sơ đồ bàn | Dùng được ở mọi màn ngang từ 568×320. Nút (kể cả ô bàn) từ 44×44 px, có tên đọc được. Nội dung không làm tràn trang. Dưới 1280 px, khung "Đơn đang mở" thu gọn, mở/đóng bằng nút hoặc Escape | [remake-b01](https://github.com/nguyentronglinh045/pos-cafe/blob/e8a1810f3de41453ad33b224334c26d6f8cd52db/openspec/changes/remake-b01/specs/floor-workspace/spec.md) B01-07, B01-08 |
| Gọi món | Dùng được từ 568×320; nút 44 px; không tràn, không che nút chính | [remake-b02](https://github.com/nguyentronglinh045/pos-cafe/blob/e8a1810f3de41453ad33b224334c26d6f8cd52db/openspec/changes/remake-b02/specs/order-workspace/spec.md) B02-08 |
| Thanh toán | Dùng được từ 568×320; nút từ 44×44 px; **chữ từ 12 px**; tràn trang tối đa 1 px; tiền, nhãn, nút chính không bị che; cuộn tới được mọi nút | [remake-b03](https://github.com/nguyentronglinh045/pos-cafe/blob/e8a1810f3de41453ad33b224334c26d6f8cd52db/openspec/changes/remake-b03/specs/payment-ui/spec.md) R07 |
| Mang đi | **Chưa có spec giao diện riêng** (features ghi chưa có đợt làm lại giao diện mang đi). Chỉ đo để tham khảo | — |

## Cách kiểm: hai lớp

| Lớp | Công cụ | Phạm vi | Giờ (12/11, UTC+7) |
| --- | --- | --- | --- |
| **A. ui-audit của dự án** | `node ui-audit/run.mjs` (14 loại lỗi: bị che, nút nhỏ, chữ bị cắt, tràn, ảnh/biểu tượng hỏng, tương phản, thiếu tên…). Ngưỡng của công cụ: nút từ 24 px, chữ từ 10 px | 16 màn × 3 cỡ: 1024×768, 1440×900, 844×390 | Tự kiểm 09:09:34 (đạt); chạy 09:09:43–09:13:37 |
| **B. Đo theo ngưỡng spec** | [`kiem-giao-dien.mjs`](script/kiem-giao-dien.mjs), vai Thu ngân | 9 trạng thái của bốn luồng POS (gồm cả màn mang đi, mà ui-audit không có) × 5 cỡ: 568×320, 844×390, 1024×600, 1366×768, 1920×1080 | 09:15:58–09:16:53 |

**Ghi chú về lớp A:**
- **Nơi chạy:** một bản clone sạch của main `cd35439` (ui-audit cần thư mục git để ghi mã nguồn trước và sau khi đo).
- **Trình duyệt:** ui-audit cố định trình duyệt riêng của Playwright, máy này không có. Vì vậy phải chạy qua module trung gian [`ui-audit-chrome/`](script/ui-audit-chrome/index.mjs), dùng đúng gói Playwright 1.60.0 của dự án và chỉ đổi sang Chrome cài trên máy. README của ui-audit cho phép cách này, với điều kiện ghi lại khi dùng làm bằng chứng.
- **Phiếu `status.json`:** vẫn ghi `channel: chromium` vì giá trị này viết cứng trong công cụ. Trình duyệt thật là Chrome `157.0.8103.38` (ô `browserVersion`).

**Ghi chú về lớp B:** lượt đo đầu (09:14:03–09:14:55) báo "bị che" ở hai chỗ, đều do cách đo:
- **Thẻ đơn ở sơ đồ bàn:** dưới 1280 px khung thu gọn đúng thiết kế, mà script chưa bấm mở khung.
- **Phiếu tạm tính:** phiếu cao hơn màn nên chưa thể nằm trọn trong màn.

Mình đã sửa script (mở khung bằng nút **Đơn đang mở**; đo nút ở chân phiếu) rồi chạy lại toàn bộ. Số liệu dưới đây là của lượt sau.

## Kết quả lớp A — ui-audit

**48/48 cặp màn × cỡ màn đo xong, 0 lỗi**, không cặp nào lỗi khi dựng màn. Mã nguồn trước và sau khi đo giống hệt (`cd35439`). Kết quả khớp số CI mà `regression-map.md` ghi ("UI audit 48 PASS/0 findings").

- **Phạm vi kết luận:** ui-audit tự ghi `productAcceptance: NOT_ASSESSED`, tức đây không phải nghiệm thu.
- **Tệp:** [`report.md`](chay-2026-11-12/ui-audit/report.md), [`report.json`](chay-2026-11-12/ui-audit/report.json), [`status.json`](chay-2026-11-12/ui-audit/status.json), [`log.txt`](chay-2026-11-12/ui-audit/log.txt), [`selftest-log.txt`](chay-2026-11-12/ui-audit/selftest-log.txt).

## Kết quả lớp B — đo theo ngưỡng spec

Mỗi ô ghi số chỗ vi phạm ở 5 cỡ màn theo thứ tự 568×320 / 844×390 / 1024×600 / 1366×768 / 1920×1080.

| Trạng thái | Tràn trang | Nút < 44 px | Chữ < 12 px | Chữ bị cắt | Nút không có tên | Tiền / nút chính bị che hoặc không tới được |
| --- | --- | --- | --- | --- | --- | --- |
| 1 Sơ đồ bàn | 0 | 0 | 8 / 8 / 9 / 9 / 9 | 0 | 0 | 0 |
| 1b Khung Đơn đang mở | 0 | 0 | 7 ở mọi cỡ | 0 | 0 | 0 |
| 2 Gọi món (đơn #24) | 0 | 0 | 20 / 6 / 8 / 9 / 9 | 0 | 0 | 0 |
| 3 Hộp chọn tùy chọn | 0 | 0 | 2 | 0 | 0 | 0 |
| 4 Hộp "Bỏ đơn chưa gửi?" | 0 | 0 | 0 | 0 | 0 | 0 |
| 5 Thanh toán | 0 | 0 | **0** | 0 | 0 | 0 |
| 6 Thanh toán, thiếu tiền | 0 | 0 | **0** | 0 | 0 | 0 |
| 7 Phiếu tạm tính | 0 | 0 | 7 | 0 | 0 | 0 |
| 8 Mang đi | 0 | **9** | 1 | 0 | 0 | **Chưa đo (`keys: []`)** |

- Không có lỗi JavaScript trên trang ở cả 5 lượt.
- Ảnh: [`chay-2026-11-12/giao-dien/anh/`](chay-2026-11-12/giao-dien/anh/), tên `<cỡ màn>-<trạng thái>.png` (45 ảnh). Số liệu và danh sách từng chỗ: [`ket-qua.json`](chay-2026-11-12/giao-dien/ket-qua.json).

## Đối chiếu với Expected

| Màn | Thực tế | Kết luận |
| --- | --- | --- |
| Sơ đồ bàn | Không tràn trang. Mọi nút, kể cả ô bàn, từ 44×44 px và có tên. Dưới 1280 px có nút **Đơn đang mở (3)**; mở ra thì thẻ đơn tới được, bấm Escape thì khung đóng. Từ 1366 px khung hiện thường trực | **ĐẠT** B01-07/08 |
| Gọi món | Không tràn. Nút từ 44 px. Nút **In/Gửi đơn**, tổng tiền, nút **Đóng** tới được và không bị che ở cả 5 cỡ; hộp tùy chọn và hộp bỏ nháp cũng vậy | **ĐẠT** B02-08 |
| Thanh toán | Không tràn. Nút từ 44 px. Không chữ nào dưới 12 px. Số phải trả, ô tiền khách đưa, nút xóa, nút hoàn tất, ô Chọn tất cả tới được và không bị che, kể cả ở 568×320 và khi thiếu tiền | **ĐẠT** R07 |
| Phiếu tạm tính | Nút Đóng (đầu và chân phiếu) tới được. Ở màn thấp phiếu cuộn bên trong hộp. Chữ trên phiếu 11 px | ĐẠT phần thao tác; cỡ chữ xem GD-04 |
| Mang đi | Không tràn document theo số đo cũ, nút có tên. **9 nút nhỏ hơn 44 px** ở mọi cỡ màn. Chưa kiểm cuộn tới nút và bị che; ở 568×320 khung chi tiết chỉ hiện một phần | Chưa đủ bằng chứng kết luận thao tác đầy đủ; không có Expected giao diện riêng; xem GD-01 và biên bản 14/11 |

## Điểm cần ghi

| Mã | Điểm | Mức | Gợi ý |
| --- | --- | --- | --- |
| GD-01 | Màn **Đơn mang đi** có 9 nút nhỏ hơn 44 px ở cả 5 cỡ màn: ba thẻ lọc "Đang mở", "Đã thanh toán", "Hôm nay" chỉ cao 24 px; "Mở đơn", "Thanh toán" trên thẻ đơn cao 26 px; hai nút ở khung chi tiết cao 31 px; "Tạo đơn mang đi", "Đóng" cao 37 px. Ba màn POS kia đều đạt 44 px | Chưa có spec để gọi là lỗi | Hỏi Linh có áp mức 44 px cho màn mang đi không (Q-GD-1) |
| GD-02 | Màn **Gọi món ở 568×320**: 20 chữ nhỏ hơn 12 px. Có cả tên món và giá trong giỏ (11 px), "Phần đã lưu", đơn giá, tùy chọn (10 px). Ở các cỡ lớn hơn còn 6–9 chữ, chủ yếu là nhãn phụ | B02 không quy định cỡ chữ; mức 12 px chỉ có ở R07 cho Thanh toán | Hỏi Linh có áp 12 px cho Gọi món không (Q-GD-2) |
| GD-03 | Màn **Sơ đồ bàn**: số liệu phụ 10–11 px ("34 chỗ ngồi", "50% sử dụng", "8 / 8 bàn", tổng tiền trên ô bàn "125K" 11 px) | Tham khảo | Như GD-02 |
| GD-04 | **Phiếu tạm tính**: chữ 11 px (địa chỉ quán, tiêu đề cột, tùy chọn món) | Tham khảo: phiếu mô phỏng giấy in | Hỏi Linh R07 có áp cho phiếu in không (Q-GD-2) |
| GD-05 | Ngưỡng của ui-audit (nút 24 px, chữ 10 px) lỏng hơn spec (44 px, 12 px), và danh sách màn của ui-audit chưa có màn mang đi. Vì vậy ui-audit "0 lỗi" chưa đủ để nói đạt spec | Về cách kiểm | Hỏi Linh có nên đặt ngưỡng ui-audit theo spec và thêm màn mang đi không (Q-GD-3) |

## Giới hạn

- Đo trên bản demo dữ liệu giả, trình duyệt Chrome giả lập kích thước màn. Chưa thử trên điện thoại hoặc máy tính bảng thật, chưa thử bàn phím ngoài và trình đọc màn hình.
- Chỉ đo vai Thu ngân và dữ liệu mẫu; tên món hoặc tên khu dài hơn có thể cho kết quả khác.
- Chưa đo độ tương phản theo spec (lớp A có đo với ngưỡng 4.5 và không báo lỗi).
- "Nút có tên" chỉ kiểm có chữ, nhãn hoặc `aria-label`; chưa kiểm tên đó có đúng nghĩa không.
