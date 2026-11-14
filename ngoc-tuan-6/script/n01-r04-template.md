# N01 — Kịch bản hồi quy luồng POS (r04)

**Trạng thái: r04 — Expected cập nhật theo câu trả lời của Linh ngày 08/11/2026 và thêm 5 ca mới. AI đã chạy 13 ca / 65 bước trên bản demo mock của main `cd35439` ngày 12/11/2026: {{TONG}}.** Ngọc chưa xem ảnh, chưa chạy tay lại; xem [ô tự kiểm](#tự-kiểm-r04). Đây là bản demo dữ liệu giả, không phải backend thật, không phải nghiệm thu.

- **Bản trước:** r03 (03/11/2026) đã lưu trên nhánh `docs` tại [`docs/implementation-log/student-week-4-5/tuan-5/24tx610002-VoVanNgoc/N01/N01-kich-ban.md`](https://github.com/nguyentronglinh045/pos-cafe/blob/e8a1810f3de41453ad33b224334c26d6f8cd52db/docs/implementation-log/student-week-4-5/tuan-5/24tx610002-VoVanNgoc/N01/N01-kich-ban.md). File đó giữ đủ lịch sử r01–r03, nguồn S01–S09, phản hồi L04 của Lâm và câu hỏi Q-N01-1…8. r04 không chép lại phần đó.
- **Người làm:** AI (Claude Code) cập nhật Expected, viết ca mới, chạy và ghi kết quả ngày 12/11/2026 theo yêu cầu của Ngọc. Ngọc cần tự đối chiếu Expected mới với nguồn và xem ảnh.

## Nguồn Expected r04

| Mã | Nguồn | Dùng cho |
| --- | --- | --- |
| S01–S09 | Bản offline trong gói, như r02/r03 | Các bước không đổi so với r03 |
| A08 | [Câu trả lời Q-N01-1…8 và CX-01…CX-09](https://github.com/nguyentronglinh045/pos-cafe/blob/e8a1810f3de41453ad33b224334c26d6f8cd52db/docs/workflow/tasks/team-week05-answers-2026-11-08.md), Linh, 08/11/2026 (CX-04 chốt 09/11) | Mọi chỗ Expected đổi ở r04 |
| FO | [floor-operations spec](https://github.com/nguyentronglinh045/pos-cafe/blob/e8a1810f3de41453ad33b224334c26d6f8cd52db/openspec/specs/floor-operations/spec.md) (đã sửa theo Q-N01-5) | N01-01 |
| OM | [order-management spec](https://github.com/nguyentronglinh045/pos-cafe/blob/e8a1810f3de41453ad33b224334c26d6f8cd52db/openspec/specs/order-management/spec.md), phần đơn mang đi | N01-07, N01-09 |
| B02-xx | [remake-b02 order-workspace](https://github.com/nguyentronglinh045/pos-cafe/blob/e8a1810f3de41453ad33b224334c26d6f8cd52db/openspec/changes/remake-b02/specs/order-workspace/spec.md), nguồn Expected gọi món theo Q-N01-6 | N01-02, N01-03, N01-10, N01-11 |
| R0x | [remake-b03 payment-ui](https://github.com/nguyentronglinh045/pos-cafe/blob/e8a1810f3de41453ad33b224334c26d6f8cd52db/openspec/changes/remake-b03/specs/payment-ui/spec.md) | N01-04, 05, 06, 12, 13 |

Tất cả ở nhánh `docs` commit `e8a1810` (11/11/2026).

## Điều kiện chạy r04

- **Mã nguồn:** thư mục `pos-cafe-main` trên máy, giống hệt main [`cd35439`](https://github.com/nguyentronglinh045/pos-cafe/tree/cd3543996fb4d06f022dcf4a6829fba43645daff) (10/11/2026). Đã so mã băm 698 file `src/`, `tests/` và cấu hình, không khác file nào. `src/` không đổi từ `052a7d1` (bản chạy r03), nên CX-01…CX-05 chưa được sửa trong bản đang chạy.
- **Môi trường:**
  - dữ liệu giả `VITE_DATA_MODE=mock`, dev server `127.0.0.1:5175`;
  - Chrome điều khiển qua Playwright, màn 1366×768, mỗi ca một phiên mới;
  - vai: Thu ngân cho các ca, Phục vụ cho N01-08, Chủ quán chỉ để chuẩn bị dữ liệu N01-02.
- **Dữ liệu:** dữ liệu minh họa ↔ dữ liệu demo giữ như bảng "Bổ sung r03" (Tầng 1 = Tầng trệt, Bàn 2 = B02 đơn #24 125.000đ, "Cà phê" = "Cà phê sữa"…). N01-11 dùng thêm hai dòng đã gửi của đơn #24: Bạc xỉu ×1 (32.000đ) và Croissant ×1 (35.000đ).
- **Script:** [`run-n01-r04.mjs`](../script/run-n01-r04.mjs). Kết quả: [`ket-qua.json`](../chay-2026-11-12/n01/ket-qua.json) và ảnh `../chay-2026-11-12/n01/anh/<ca>/<bước>.png`.

## Thay đổi Expected r03 → r04

| Ca / bước | Expected r03 | Expected r04 | Căn cứ |
| --- | --- | --- | --- |
| N01-01 B3 | Bàn 2 đang phục vụ kèm "số đơn" và tổng 125.000đ | Ô Bàn 2 ghi tên bàn và tổng tiền (125.000đ); **số đơn #24 xem ở danh sách Đơn đang mở**, không ghi trên ô bàn | A08 Q-N01-5; FO "Biểu diễn trạng thái bàn" |
| N01-01 B4 | Chỉ Bàn 2 được làm nổi bật | Giữ: bàn khớp sáng lên, **bàn không khớp vẫn hiện đúng chỗ**. App chưa sửa | A08 Q-N01-8, CX-01 |
| N01-02 B4 | Hủy: hộp đóng, giỏ không đổi (chỉ dựa S06) | Giữ. Nguồn chuyển sang B02-03 "cancel không đổi draft"; nút đóng (X, tên "Đóng") là thao tác hủy | A08 Q-N01-6; B02-03 |
| N01-03 B5 | Thay đổi chưa gửi bị bỏ (màn đơn đóng hay không: chưa rõ) | Với đơn đã gửi, nút bỏ ghi **"Bỏ thay đổi"**; bấm thì màn đơn đóng, đơn về bản đã lưu (125.000đ). App chưa đổi chữ nút | A08 Q-N01-4, CX-03; B02-07 |
| N01-04 B7 (mới) | — | Lịch sử hiện **số đơn #24** như hóa đơn, chia nhóm theo ngày kinh doanh. App chưa sửa | A08 CX-04 (chốt 09/11) |
| N01-05 B3 | Nút hoàn tất bị khóa, kèm lý do | Giữ; xác nhận "vẫn hiện ở trạng thái khóa kèm lý do" | A08 Q-N01-3 |
| N01-05 B4 | Bấm "Đúng tiền": 125.000đ | Giữ. App chưa sửa | A08 Q-N01-7, CX-02 |
| N01-07 B3 | Đơn mới có trong danh sách mang đi | Ghi rõ: đơn chỉ có sau khi **gửi món lần đầu** | A08 Q-N01-1; OM "Tạo đơn mang đi" |
| N01-08 B5 | Không có nút Thanh toán, không có nút hủy đơn mở | Đơn đã gửi: **chỉ có nút "Đóng"**, không có nút chính ở chân màn | A08 Q-N01-2 |

Các bước còn lại giữ Expected r02/r03.

## Ca mới r04

| ID | Luồng — loại | Mục tiêu và input | Các bước | Expected | Nguồn |
| --- | --- | --- | --- | --- | --- |
| N01-09 | Mang đi — biên | Thoát khi chưa gửi món thì không sinh đơn. Thu ngân; Americano | 1. Mở Bán mang đi, ghi số đơn đang mở.<br>2. Tạo đơn mang đi, thêm Americano, chưa gửi.<br>3. Bấm Đóng.<br>4. Bấm "Bỏ đơn", mở lại Bán mang đi. | B2: tổng 35.000đ.<br>B3: hỏi "Bỏ đơn chưa gửi?", nút "Tiếp tục chỉnh sửa", "Bỏ đơn" (đơn mới giữ chữ "Bỏ đơn").<br>B4: số đơn đang mở không đổi. | OM "Thoát trước khi gửi món"; A08 Q-N01-1, CX-03 |
| N01-10 | Gọi món — chính | Tìm món trên toàn menu. Bàn 1; danh mục "Trà & trà sữa"; gõ "americano" | 1. Mở Bàn 1, chọn "Trà & trà sữa".<br>2. Gõ "americano" (chữ thường).<br>3. Chọn danh mục "Cà phê". | B1: Americano không nằm ở danh mục này.<br>B2: vẫn tìm thấy Americano (không phân biệt hoa thường, tìm trên toàn menu).<br>B3: ô tìm được xóa. | B02-02 |
| N01-11 | Gọi món — biên | Thêm/bớt món đã gửi. Đơn #24: Bạc xỉu ×1, Croissant ×1 đã gửi | 1. Mở đơn #24.<br>2. Bấm + ở dòng Bạc xỉu đã lưu.<br>3. Bấm − ở dòng Croissant đã lưu.<br>4. Đóng, bỏ thay đổi, mở lại. | B1: 3 dòng "Phần đã lưu", 125.000đ.<br>B2: dòng đã lưu giữ ×1; thêm **một dòng Bạc xỉu mới** theo giá hiện hành; 157.000đ.<br>B3: Croissant về 0 thì **ẩn khỏi giỏ**; 122.000đ.<br>B4: đơn về bản đã lưu 125.000đ, Croissant còn. | B02-04; B02-07; A08 Q-N01-4 |
| N01-12 | Thanh toán — biên | Nhập tiền khách đưa. Đơn #24, 125.000đ | 1. Mở thanh toán.<br>2. Bấm xóa một lần.<br>3. Bấm "00".<br>4. Bấm thêm 4 lần "9".<br>5. Gõ thẳng "12a5b" vào ô.<br>6. Bấm Đúng tiền, +50k, 500k. | B1: ô 125.000.<br>B2: 12.500 (xóa một chữ số).<br>B3: 1.250.000.<br>B4: không quá 9 chữ số.<br>B5: chỉ nhận chữ số → 125.<br>B6: 125.000; 175.000; 500.000. | R04 |
| N01-13 | Thanh toán — chính | In hóa đơn và tạm tính. Đơn #24 | 1. Mở thanh toán.<br>2. Bấm in tạm tính.<br>3. Đóng phiếu, thoát thanh toán. | B1: ô "In hóa đơn sau khi thanh toán" bật sẵn.<br>B2: hiện phiếu tạm tính nằm trên màn thanh toán.<br>B3: vẫn ở màn thanh toán, phải trả không đổi; bàn vẫn đang phục vụ (xem tạm tính không ghi thanh toán). | R06 |

## Kết quả r04 (12/11/2026, demo mock, 1366×768)

Cách đọc:

| Kết quả | Nghĩa |
| --- | --- |
| **ĐÚNG** | Thấy đúng Expected r04 |
| **LỆCH — chờ CX-xx** | Khác Expected, nhưng Linh đã chốt cách sửa (CX) và chưa có code. Chạy lại khi CX xong |
| **LỖI** | Khác Expected và chưa có trong CX |
| **CHƯA CHẠY** | Không làm được bước |

{{BANG_TONG}}

{{BANG_CHI_TIET}}

### So với r03

| Ca / bước | r03 (03/11) | r04 (12/11) | Vì sao đổi |
| --- | --- | --- | --- |
| N01-01 B3 | ĐÚNG một phần, "số đơn" CHƯA KẾT LUẬN | ĐÚNG | Linh trả lời Q-N01-5; Expected sửa theo FO |
| N01-01 B4 | LỖI | LỆCH — chờ CX-01 | Linh giữ Expected và đã chốt sửa app |
| N01-05 B4 | LỖI | LỆCH — chờ CX-02 | Như trên |
| N01-03 B5 | ĐÚNG | LỆCH — chờ CX-03 | Expected r04 thêm chữ nút "Bỏ thay đổi" theo B02-07 (08/11); hành vi vẫn đúng |
| N01-04 B7 | (chưa có) | LỆCH — chờ CX-04 | Bước mới theo quyết định CX-04 |

Ở 44 bước có trong cả r03 và r04, app làm giống r03 (mã `src/` giống nhau). Kết quả đổi chỉ vì Expected mới.

## Câu hỏi

Không có câu hỏi mới về Expected của N01. Bốn bước LỆCH chờ CX-01…CX-04; khi Linh báo đã sửa, chạy lại đúng các bước đó. Câu hỏi về lỗi giao diện nằm ở [README](../README.md#câu-hỏi-cho-linh).

## Tự kiểm r04

- [ ] Ngọc tự mở các nguồn A08, FO, OM, B02-xx, R0x và đồng ý với bảng "Thay đổi Expected" và "Ca mới". Ghi giờ.
- [ ] Ngọc đã xem ảnh trong `chay-2026-11-12/n01/anh/` và đồng ý với cột Kết quả.
- [ ] Ngọc tự chạy tay lại ít nhất 2 ca trên demo `127.0.0.1:5175`. Gợi ý: N01-11 (thêm/bớt món đã gửi) và N01-12 (nhập tiền). Ghi giờ thật và điểm nào khác máy.
- [ ] Gửi Linh r04 và kết quả. Ghi giờ gửi.
