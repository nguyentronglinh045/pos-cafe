# N01 — Kịch bản hồi quy luồng POS (r04)

**Chạy lại 14/11/2026 bằng Playwright (Codex):** [biên bản và ảnh mới](../chay-lai-2026-11-14-playwright-r02/README.md). N01-11: 3 bước đúng, B4 đúng khôi phục đơn nhưng lệch nhãn CX-03. N01-12: 6/6 đúng, có ghi thao tác nhập lại `200000` ở B6. Đây là lượt tự động bổ sung, không phải xác nhận Ngọc tự chạy tay và không thay kết quả toàn bộ 65 bước bên dưới.

**Đối chiếu bổ sung 14/11/2026 (Codex):** đã mở nguồn gốc và xem đủ 66 ảnh. [Biên bản rà soát](../kiem-tra-2026-11-14/kiem-tra-truoc-khi-nop.md) ghi rõ N01-11 B4 đúng hành vi nhưng lệch nhãn CX-03; nếu tính cả nhãn thì 60 ĐÚNG/5 bước LỆCH. N01-12 B6 phải nhập lại `200000` trước khi bấm nút nhanh. Các bảng dưới giữ kết quả tự động gốc ngày 12/11; chưa có lượt chạy tay mới do công cụ điều khiển mất kết nối.

**Trạng thái: r04 — Expected cập nhật theo câu trả lời của Linh ngày 08/11/2026 và thêm 5 ca mới. AI đã chạy 13 ca / 65 bước trên bản demo mock của main `cd35439` ngày 12/11/2026: 65 bước: 61 ĐÚNG, 4 LỆCH chờ CX, 0 LỖI mới, 0 CHƯA CHẠY.** Ngọc chưa xem ảnh, chưa chạy tay lại; xem [ô tự kiểm](#tự-kiểm-r04). Đây là bản demo dữ liệu giả, không phải backend thật, không phải nghiệm thu.

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

| Ca | Giờ chạy | Số bước | ĐÚNG | LỆCH — chờ CX | LỖI | CHƯA CHẠY |
| --- | --- | --- | --- | --- | --- | --- |
| N01-01 Sơ đồ bàn | 09:06:45–09:06:52 | 6 | 5 | 1 | 0 | 0 |
| N01-02 Gọi món — nhóm bắt buộc | 09:06:52–09:07:04 | 5 | 5 | 0 | 0 | 0 |
| N01-03 Gọi món — đóng khi còn nháp | 09:07:05–09:07:11 | 5 | 4 | 1 | 0 | 0 |
| N01-04 Thanh toán — trả đủ | 09:07:11–09:07:18 | 7 | 6 | 1 | 0 | 0 |
| N01-05 Thanh toán — thiếu tiền / không chọn | 09:07:18–09:07:25 | 5 | 4 | 1 | 0 | 0 |
| N01-06 Thanh toán — trả một phần | 09:07:25–09:07:32 | 6 | 6 | 0 | 0 | 0 |
| N01-07 Mang đi | 09:07:32–09:07:41 | 6 | 6 | 0 | 0 | 0 |
| N01-08 Thiếu quyền — Waiter | 09:07:41–09:07:47 | 5 | 5 | 0 | 0 | 0 |
| N01-09 Mang đi — thoát trước khi gửi món | 09:07:47–09:07:53 | 4 | 4 | 0 | 0 | 0 |
| N01-10 Gọi món — tìm món và đổi danh mục | 09:07:53–09:07:59 | 3 | 3 | 0 | 0 | 0 |
| N01-11 Gọi món — thêm/bớt món đã gửi | 09:07:59–09:08:05 | 4 | 4 | 0 | 0 | 0 |
| N01-12 Thanh toán — nhập tiền khách đưa | 09:08:05–09:08:12 | 6 | 6 | 0 | 0 | 0 |
| N01-13 Thanh toán — in hóa đơn và tạm tính | 09:08:12–09:08:18 | 3 | 3 | 0 | 0 | 0 |
| **Tổng** | | **65** | **61** | **4** | **0** | **0** |

**N01-01 — Sơ đồ bàn**

| Bước | Expected r04 | Nguồn | Thực tế trên demo | Kết quả |
| --- | --- | --- | --- | --- |
| B1 | Màn đầu tiên là Sơ đồ bàn | S02/PERM-03 | Đăng nhập Thu ngân; Sơ đồ bàn hiện, 0 màn mở đè. | ĐÚNG |
| B2 | Sơ đồ hiện bàn và vật trang trí của khu | floor-operations: Chuyển khu | Tầng trệt: 8 bàn, 7 vật trang trí. | ĐÚNG |
| B3 | Bàn 1 trống; Bàn 2 đang phục vụ, ô bàn ghi tên bàn và tổng tiền 125.000đ; số đơn #24 xem ở danh sách Đơn đang mở | floor-operations (sửa theo Q-N01-5, 08/11) | B01 "empty". B02 "occupied", chữ trên ô "B02125K", tổng 125000đ. Đơn đang mở của B02: "B02#24Đang phục vụ125.000đMở đơn hàng →". | ĐÚNG |
| B4 | Chọn bộ lọc 'Đang phục vụ': bàn khớp sáng lên, bàn không khớp vẫn hiện đúng chỗ | floor-operations: Lọc theo trạng thái; Q-N01-8, CX-01 | Trước lọc 8 bàn; sau lọc còn 4 bàn trên sơ đồ: B02/occupied, B03/occupied, B05/occupied, B08/occupied. Bàn không khớp bị ẩn. | **LỆCH — chờ CX-01** |
| B5 | Bấm vật trang trí: không mở đơn nào | floor-operations: Bấm vào vật trang trí | Không có màn đơn nào mở. | ĐÚNG |
| B6 | Bấm Bàn 1: mở màn tạo đơn mới cho Bàn 1 | floor-operations: Mở đơn tại bàn trống | Đầu màn: "Gọi món — Bàn B01Tầng trệt · Tại bànĐơn mới · Chưa gửiĐóngIn/Gửi đơn". | ĐÚNG |


**N01-02 — Gọi món — nhóm bắt buộc**

| Bước | Expected r04 | Nguồn | Thực tế trên demo | Kết quả |
| --- | --- | --- | --- | --- |
| Chuẩn bị | Chuẩn bị dữ liệu: nhóm Size của Cà phê sữa là bắt buộc | điều kiện chạy (r03) | Chủ quán đổi nhóm "Size" thành "Bắt buộc chọn" (đã đổi), lưu, thoát; đăng nhập lại Thu ngân. | **ĐÃ CHUẨN BỊ** |
| B1 | Mở đơn 24 của Bàn 2, tổng 125.000đ | S02/B02-01 | Đầu màn "Gọi món — Bàn B02Tầng trệt · Tại bànĐơn #24 · Đã gửiĐóngHủy đơn mởThan"; tổng 125000đ. | ĐÚNG |
| B2 | Americano vào giỏ ngay, không mở hộp thoại; tổng 160.000đ | B02-01, B02-03 | Hộp thoại không mở; giỏ 3 → 4 dòng; tổng 160000đ. | ĐÚNG |
| B3 | Bấm Cà phê sữa, chưa chọn: hộp thoại mở, nút thêm bị khóa | B02-03 | Hộp thoại mở; nút "Thêm vào đơn" bị khóa. | ĐÚNG |
| B4 | Hủy (đóng) hộp thoại: giỏ không đổi so với sau B2 | B02-03 (Q-N01-6: dùng remake-b02) | Dùng nút đóng (X, tên "Đóng"). Hộp đã đóng; giỏ 4 dòng (sau B2: 4), tổng 160000đ. | ĐÚNG |
| B5 | Chọn giá trị hợp lệ: nút thêm mở khóa; dòng Cà phê sữa vào giỏ, hiện tùy chọn | S03, B02-03 | Nút thêm mở khóa; dòng cuối giỏ "Cà phê sữa29.000 ₫Phần gọi thêm29.000 ₫ / mónSize M−1+Ghi ch". | ĐÚNG |


**N01-03 — Gọi món — đóng khi còn nháp**

| Bước | Expected r04 | Nguồn | Thực tế trên demo | Kết quả |
| --- | --- | --- | --- | --- |
| B1 | Mở đơn 24 của Bàn 2 | S02 | Tổng 125000đ. | ĐÚNG |
| B2 | Thêm Americano: tổng nháp 160.000đ | B02-01 | Tổng 160000đ. | ĐÚNG |
| B3 | Bấm đóng: hiện hộp 'Bỏ đơn chưa gửi?' | B02-07 | Hộp hiện "Bỏ đơn chưa gửi?"; nút: "Tiếp tục chỉnh sửa", "Bỏ đơn". | ĐÚNG |
| B4 | 'Tiếp tục chỉnh sửa': vẫn ở màn đơn, nháp giữ 160.000đ | B02-07 | Màn đơn vẫn mở; tổng 160000đ. | ĐÚNG |
| B5 | Đóng lần nữa: với đơn đã gửi nút bỏ ghi 'Bỏ thay đổi'; bấm bỏ thì màn đơn đóng và đơn về bản đã lưu (125.000đ) | B02-07 (cập nhật 08/11), Q-N01-4, CX-03 | Nút bỏ ghi "Bỏ đơn". Bấm xong màn đơn đóng; mở lại B02 tổng 125000đ. | **LỆCH — chờ CX-03 (hành vi đúng, chữ nút chưa đổi)** |


**N01-04 — Thanh toán — trả đủ**

| Bước | Expected r04 | Nguồn | Thực tế trên demo | Kết quả |
| --- | --- | --- | --- | --- |
| B1 | Mở đơn 24, bấm Thanh toán | S04 | "Bàn B02 · Đơn #24 · 4 món". | ĐÚNG |
| B2 | Mặc định chọn tất cả; phải trả 125.000đ | R03 | Chọn tất cả bật; phải trả 125000đ. | ĐÚNG |
| B3 | Bấm Thẻ/QR: không được chọn, vẫn tiền mặt | S04 phương thức khả dụng, R01 | Thẻ bị vô hiệu; Tiền mặt vẫn chọn. | ĐÚNG |
| B4 | '200k': khách đưa 200.000đ, trả lại 75.000đ | R04 | Khách đưa 200000đ; trả lại "75.000 ₫". | ĐÚNG |
| B5 | '+20k' đặt 145.000đ; '200k' đặt lại 200.000đ | R04 | +20k → 145000đ; 200k → 200000đ. | ĐÚNG |
| B6 | Hoàn tất: màn thanh toán đóng; Bàn 2 trống; Lịch sử có đơn đã thanh toán 125.000đ của B02 | S04, R05 | Màn thanh toán đóng; B02 "empty"; Lịch sử B02: 125000đ/paid. | ĐÚNG |
| B7 | Lịch sử hiện số đơn do database cấp (#24) như hóa đơn, chia nhóm theo ngày | CX-04 (chốt 09/11) | Dòng Lịch sử của đơn vừa trả: "#2Đã thanh toánB02·12/11/2026125.000đTại bàn"; dòng tiêu đề theo ngày: 0. | **LỆCH — chờ CX-04** |


**N01-05 — Thanh toán — thiếu tiền / không chọn**

| Bước | Expected r04 | Nguồn | Thực tế trên demo | Kết quả |
| --- | --- | --- | --- | --- |
| B1 | Mở thanh toán đơn 24: chọn tất cả, phải trả 125.000đ | R03 | Phải trả 125000đ; ô khách đưa 125000đ. | ĐÚNG |
| B2 | Xóa hết, nhập 124999 bằng bàn phím số: hiển thị thiếu 1đ | R04 | Xóa 6 lần; khách đưa 124999đ; cảnh báo "Còn thiếu 1 ₫.". | ĐÚNG |
| B3 | Nút hoàn tất vẫn hiện ở trạng thái khóa kèm lý do; bấm không ghi lệnh | R04, PERM-04, Q-N01-3 | Nút hiện, khóa; lý do: dòng "Còn thiếu"; bấm ép không ra hóa đơn. | ĐÚNG |
| B4 | Bấm 'Đúng tiền': số khách đưa = 125.000đ | R04; Q-N01-7 giữ Expected, CX-02 | Khi đang thiếu tiền, hàng nút nhanh bị thay bằng dòng "Còn thiếu…", không có nút Đúng tiền để bấm. | **LỆCH — chờ CX-02** |
| B5 | Bỏ chọn tất cả: phải trả 0đ, bị chặn hoàn tất | S04, R05 | Phải trả 0đ; "0 món đã chọn"; nút khóa. | ĐÚNG |


**N01-06 — Thanh toán — trả một phần**

| Bước | Expected r04 | Nguồn | Thực tế trên demo | Kết quả |
| --- | --- | --- | --- | --- |
| B1 | Mở thanh toán đơn 24 | S04 | Phải trả 125000đ. | ĐÚNG |
| B2 | Bỏ chọn tất cả: 0đ | R03 | Phải trả 0đ. | ĐÚNG |
| B3 | Tick dòng Cà phê: 1/2, phải trả 29.000đ | R03 | Cà phê sữa 1/2; phải trả 29000đ. | ĐÚNG |
| B4 | '+' hai lần: 2/2 58.000đ rồi 1/2 29.000đ | R03 | Lần 1: 2/2 58000đ; lần 2: 1/2 29000đ. | ĐÚNG |
| B5 | Đúng tiền, hoàn tất: màn vẫn mở; đơn tách 29.000đ; nguồn 96.000đ; lựa chọn rỗng, 0đ | R05 | Đơn tách 29000đ; màn vẫn mở; nguồn 96000đ; phải trả 0đ; Chọn tất cả tắt. | ĐÚNG |
| B6 | Đóng màn thanh toán: Bàn 2 vẫn đang phục vụ, tổng 96.000đ | S04 | B02 "occupied", tổng 96000đ. | ĐÚNG |


**N01-07 — Mang đi**

| Bước | Expected r04 | Nguồn | Thực tế trên demo | Kết quả |
| --- | --- | --- | --- | --- |
| B1 | Ghi lại bàn đang phục vụ; mở khu Mang đi | S09 | Bàn đang phục vụ: B02, B03, B05, B08; Mang đi: "1 đơn đang mở". | ĐÚNG |
| B2 | Tạo đơn mang đi, thêm Americano, gửi | order-management: Tạo đơn mang đi | Gửi xong ra phiếu bếp đơn #27. | ĐÚNG |
| B3 | Đơn mới có trong danh sách mang đi đang mở; không bàn nào đổi sang đang phục vụ | order-management: Tạo đơn mang đi | "1 đơn đang mở" → "2 đơn đang mở"; #27 có; bàn đang phục vụ B02, B03, B05, B08. | ĐÚNG |
| B4 | Mở lại đơn từ danh sách, Thanh toán, Đúng tiền, hoàn tất | S09, R04 | Hóa đơn 35000đ. | ĐÚNG |
| B5 | Đơn rời khỏi danh sách mang đi | order-management: Đơn mang đi đã thanh toán | "1 đơn đang mở"; #27 không còn. | ĐÚNG |
| B6 | Chỉ còn xem được ở Lịch sử đơn: đơn mang đi đã thanh toán | order-management: Đơn mang đi đã thanh toán | Đơn 35.000đ trong Lịch sử: Mang đi/paid. | ĐÚNG |


**N01-08 — Thiếu quyền — Waiter**

| Bước | Expected r04 | Nguồn | Thực tế trên demo | Kết quả |
| --- | --- | --- | --- | --- |
| B1 | Vai Waiter: về Sơ đồ bàn | PERM-03 | Vai waiter. | ĐÚNG |
| B2 | Không có Lịch sử đơn, Báo cáo, Thực đơn, Nhân viên, Cài đặt | PERM-02, PERM-04 | Thanh trái: Sơ đồ bàn, Tra cứu thao tác, Bán mang đi, Khoá. | ĐÚNG |
| B3 | Bấm Bàn 2: đơn 24 mở được | S02 | "Gọi món — Bàn B02Tầng trệt · Tại bànĐơn #24 · Đã gửiĐóng". | ĐÚNG |
| B4 | Thêm Americano, gửi: đơn 24 có thêm Americano, 160.000đ | PERM-02 | Mở lại: tổng 160000đ. | ĐÚNG |
| B5 | Đơn đã gửi: chỉ có nút Đóng; không có Thanh toán, không có Hủy đơn đang mở | Q-N01-2 (08/11), PERM-04 | Nút ở đầu màn: "Đóng"; nút Thanh toán không; nút chính ở chân màn không; Hủy đơn mở không. | ĐÚNG |


**N01-09 — Mang đi — thoát trước khi gửi món**

| Bước | Expected r04 | Nguồn | Thực tế trên demo | Kết quả |
| --- | --- | --- | --- | --- |
| B1 | Mở Bán mang đi, ghi số đơn đang mở | S09 | "1 đơn đang mở". | ĐÚNG |
| B2 | Tạo đơn mang đi, thêm Americano (chưa gửi) | order-management | "Gọi món — Mang điMang điĐơn mới · Chưa gửiĐóngIn/G", tổng 35000đ. | ĐÚNG |
| B3 | Bấm đóng: hỏi 'Bỏ đơn chưa gửi?'; đơn mới nên nút bỏ ghi 'Bỏ đơn' | B02-07, CX-03 | Hộp hiện; nút: Tiếp tục chỉnh sửa, Bỏ đơn. | ĐÚNG |
| B4 | Bấm Bỏ đơn: không có đơn nào được tạo, danh sách mang đi không đổi | order-management: Thoát trước khi gửi món; Q-N01-1 | Danh sách: "1 đơn đang mở" → "1 đơn đang mở". | ĐÚNG |


**N01-10 — Gọi món — tìm món và đổi danh mục**

| Bước | Expected r04 | Nguồn | Thực tế trên demo | Kết quả |
| --- | --- | --- | --- | --- |
| B1 | Mở Bàn 1, chọn danh mục 'Trà & trà sữa' | B02-02 | Americano ở danh mục này: không. | ĐÚNG |
| B2 | Gõ 'americano' (chữ thường): vẫn tìm thấy Americano dù đang ở danh mục khác | B02-02 (không phân biệt hoa thường, trên toàn menu) | Kết quả: thấy Americano. | ĐÚNG |
| B3 | Đổi sang danh mục 'Cà phê': ô tìm được xóa | B02-02 (đổi category xóa search) | Ô tìm sau khi đổi danh mục: "". | ĐÚNG |


**N01-11 — Gọi món — thêm/bớt món đã gửi**

| Bước | Expected r04 | Nguồn | Thực tế trên demo | Kết quả |
| --- | --- | --- | --- | --- |
| B1 | Mở đơn 24 (Bàn 2): các dòng đã gửi ghi 'Phần đã lưu' | B02-04 | 3 dòng: Cà phê sữa58.000 ₫Phần đã lưu29.000 ₫ / mónSize  \| Bạc xỉu32.000 ₫Phần đã lưu32.000 ₫ / món50% đườn \| Croissant35.000 ₫Phần đã lưu35.000 ₫ / mónHâm nó; tổng 125000đ. | ĐÚNG |
| B2 | Bấm + ở dòng Bạc xỉu đã lưu: dòng đã lưu giữ nguyên, thêm một dòng Bạc xỉu mới theo giá hiện hành; tổng 157.000đ | B02-04 (saved+ → thêm dòng giá hiện hành) | 4 dòng: Cà phê sữa58.000 ₫Phần đã lưu29.000 ₫ / mónSize  \| Bạc xỉu32.000 ₫Phần đã lưu32.000 ₫ / món50% đườn \| Croissant35.000 ₫Phần đã lưu35.000 ₫ / mónHâm nó \| Bạc xỉu32.000 ₫Phần gọi thêm32.000 ₫ / món50% đư. Dòng đã lưu số lượng 1; dòng Bạc xỉu mới: 1; tổng 157000đ. | ĐÚNG |
| B3 | Bấm − ở dòng Croissant đã lưu: về 0 thì dòng ẩn khỏi giỏ; tổng giảm 35.000đ | B02-04 (saved− clamp 0; giỏ ẩn dòng 0) | 3 dòng: Cà phê sữa58.000 ₫Phần đã lưu29.000 ₫ / mónSize  \| Bạc xỉu32.000 ₫Phần đã lưu32.000 ₫ / món50% đườn \| Bạc xỉu32.000 ₫Phần gọi thêm32.000 ₫ / món50% đư; tổng 122000đ. | ĐÚNG |
| B4 | Đóng, bỏ thay đổi: mở lại đơn 24 về bản đã lưu 125.000đ, Croissant còn | B02-07, Q-N01-4 | Nút bỏ "Bỏ đơn". Mở lại: 3 dòng, tổng 125000đ. | ĐÚNG |


**N01-12 — Thanh toán — nhập tiền khách đưa**

| Bước | Expected r04 | Nguồn | Thực tế trên demo | Kết quả |
| --- | --- | --- | --- | --- |
| B1 | Mở thanh toán đơn 24: ô khách đưa 125.000 | R03 | Khách đưa 125000đ. | ĐÚNG |
| B2 | Bấm xóa một lần: xóa một chữ số (12.500) | R04 (delete xóa một chữ số) | Khách đưa 12500đ. | ĐÚNG |
| B3 | Bấm phím 00: thêm hai số 0 (1.250.000) | R04 (có phím 00) | Khách đưa 1250000đ. | ĐÚNG |
| B4 | Bấm thêm 4 chữ số 9: chỉ giữ tối đa 9 chữ số | R04 (cắt tối đa 9 chữ số) | Khách đưa 125000099đ (9 chữ số). | ĐÚNG |
| B5 | Gõ thẳng '12a5b' vào ô: chỉ nhận chữ số (125) | R04 (direct input chỉ nhận chữ số) | Khách đưa 125đ; ô hiện "125". | ĐÚNG |
| B6 | Nút nhanh: Đúng tiền = 125.000; +50k = 175.000; 500k = 500.000 | R04 | Đúng tiền → 125000; +50k → 175000; 500k → 500000 | ĐÚNG |


**N01-13 — Thanh toán — in hóa đơn và tạm tính**

| Bước | Expected r04 | Nguồn | Thực tế trên demo | Kết quả |
| --- | --- | --- | --- | --- |
| B1 | Mở thanh toán đơn 24: ô 'In hóa đơn sau khi thanh toán' bật sẵn | R06 (checkbox in mặc định true) | Ô in bật sẵn. | ĐÚNG |
| B2 | Bấm in tạm tính: hiện phiếu tạm tính nằm trên màn thanh toán; đơn chưa bị thanh toán | R06 (Xem tạm tính không ghi lệnh) | Nút "In tạm tính". Cửa sổ: "Phiếu tạm tínhPOS Demo01 Demo StreetPHIẾU TẠM TÍNHĐơn#24LoạiBàn B02Thờ"; nằm trên cùng: có. | ĐÚNG |
| B3 | Đóng phiếu tạm tính: vẫn ở màn thanh toán, phải trả không đổi; bàn vẫn đang phục vụ | R06 | Màn thanh toán vẫn mở, phải trả 125000đ; sau đó B02 "occupied". | ĐÚNG |


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
