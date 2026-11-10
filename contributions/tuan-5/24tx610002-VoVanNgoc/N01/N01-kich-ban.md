# N01 — Kịch bản hồi quy chuẩn bị từ spec

Trạng thái: **r03 — ĐÃ CHẠY 8/8 CA TRÊN BẢN DEMO MOCK (03/11/2026): 41/44 BƯỚC ĐÚNG, 2 BƯỚC LỖI SO VỚI KỊCH BẢN, 1 BƯỚC CHƯA KẾT LUẬN** (Ngọc đã xem ảnh, chạy tay lại N01-01, N01-05; đã gửi Linh 06/11/2026 08:30) / expected giữ nguyên r02 (Ngọc đã đối chiếu, Lâm đồng ý) / còn chờ Linh Q-N01-1…8. Đây là kết quả chạy trên bản demo dữ liệu giả, không có backend thật, không phải nghiệm thu sản phẩm. Lịch sử r01/r02 giữ nguyên bên dưới; bản r02 gốc lưu ở [goc-r02/N01-kich-ban-r02.md](goc-r02/N01-kich-ban-r02.md).

- Người làm / ngày giờ thực tế (Asia/Bangkok): Võ Văn Ngọc — tự đối chiếu 29/10/2026 21:08–21:36
- Phiên bản file tự đặt / phạm vi ID đã điền: r02 (29/10/2026 21:36) — N01-01…N01-08 đã tự đối chiếu; sửa so với r01: expected N01-03 B5, N01-05 B5. (r01 lúc 21:04: nháp AI, chưa tự đối chiếu.)
- Source đã tự mở (Sxx/dòng/ref): N01-01 — S02, S05 L023, S08 L072 (ref `9fbd686…`, bản offline trong gói), Ngọc xác nhận 29/10/2026 21:08. N01-02 — S02 L062–L063, S03, S06 L007, Ngọc xác nhận 29/10/2026 21:18. N01-03 — S03 L072–L077, S06 L005, L011, Ngọc xác nhận 29/10/2026 21:25. N01-04 — S04, S07, S01 L023, S08 L040, Ngọc xác nhận 29/10/2026 21:28. N01-05 — S04, S07, S08 L089, Ngọc xác nhận 29/10/2026 21:31. N01-06 — S07, S04, S01 L023, S02, Ngọc xác nhận 29/10/2026 21:33. N01-07 — S03, S05 L017, S08 L039–L040, S09 L046–L048, Ngọc xác nhận 29/10/2026 21:34. N01-08 — S08, S02 L062–L063, S07 L014, Ngọc xác nhận 29/10/2026 21:36.
- Phần tự làm / AI hỗ trợ (công cụ, phần nào): AI (Claude Code) soạn nháp 8 ca và câu hỏi Q-N01-1…4 ngày 29/10/2026 từ bản offline S01–S09 trong gói (ref docs `9fbd686…`). Cùng ngày, AI tự rà nháp theo tiêu chí L04 (kiểm lại số dòng nguồn, đọc như người mới), sửa N01-01/04/05/07/08, thêm Q-N01-5/6. Đây **không phải** góp ý của Lâm. Ngọc tự đối chiếu cả 8 ca (AI liệt kê dòng nguồn và đặt câu hỏi tự kiểm a–j; Ngọc tự mở nguồn, xác nhận và trả lời). Hai chỗ sửa expected do Ngọc tự phát hiện: N01-03 B5 (tách "màn đơn đóng" chưa có nguồn), N01-05 B5 (bỏ "không tự chọn lại tất cả" vì S07 L027 chỉ áp khi refetch).
- Phần chưa làm / lý do (lúc r02): gửi r02 cho Lâm; nhận và trả lời L04; chờ Linh trả lời Q-N01-1…6.
- **r03 (03/11/2026 09:51–09:53):** theo yêu cầu của Ngọc, AI (Claude Code) chạy tự động 8 ca trên bản demo mock bằng trình duyệt Chrome điều khiển qua Playwright, ghi quan sát từng bước và chụp 45 ảnh. Không đổi expected nào. Thêm Q-N01-7, Q-N01-8 từ kết quả chạy. Cùng ngày Ngọc đã xem ảnh, đồng ý với kết quả và tự chạy tay lại N01-01 (11:11), N01-05 (11:13). Ngọc xác nhận đã gửi phần tuần 5, gồm Q-N01-7/8, cho Linh lúc 06/11/2026 08:30.

Input chỉ minh họa thiết kế ca; quyền có/thiếu theo spec, chưa xác nhận tài khoản/fixture thật. Không cần Linh cấp môi trường để soạn. Các số tiền 125.000đ / 160.000đ / 29.000đ / 96.000đ / 200.000đ lấy theo ví dụ có sẵn trong S06/S07, không phải dữ liệu thật của quán.

**Dữ liệu minh họa dùng chung:** Khu "Tầng 1" có Bàn 1 (trống), Bàn 2 (đang phục vụ, đơn số 24 tổng 125.000đ, trong đó có dòng "Cà phê" số lượng 2, đơn giá 29.000đ — món này khác "Cà phê sữa") và một vật trang trí (chậu cây). Menu có "Americano" (không có nhóm tùy chọn, 35.000đ — suy từ 125.000 → 160.000 ở S06 L005) và "Cà phê sữa" (có nhóm tùy chọn bắt buộc). Vai giả định theo bảng quyền mặc định S08 L033–L049.

**Các ca độc lập:** mỗi ca bắt đầu lại từ dữ liệu minh họa chung ở trên, không nối tiếp kết quả ca trước. Ví dụ sau N01-04, Bàn 2 đã trống; N01-05/06/08 cần đặt lại đơn 24 như ban đầu.

## Bổ sung r03 — điều kiện để chạy trên bản demo

**Môi trường đã chạy (03/11/2026):**
- Mã nguồn: thư mục `pos-cafe-main` trên máy (không có git). Đã so mã băm từng file với main `052a7d1` (merge PR #15): 1185/1193 file giống hệt, **toàn bộ `src/` giống hệt**; 8 file khác đều thuộc `ci/` và `scripts/` (công cụ CI, không thuộc giao diện app).
- Chế độ dữ liệu giả `VITE_DATA_MODE=mock`, dev server Vite tại `127.0.0.1:5175`; trình duyệt Google Chrome (headless, điều khiển qua Playwright), kích thước 1366×768 (laptop). Không backend/Supabase, không thiết bị thật.
- Mỗi ca chạy trong một phiên trình duyệt mới nên dữ liệu demo trở về ban đầu, đúng ý "các ca độc lập".

**Dữ liệu minh họa → dữ liệu có sẵn trong demo:**

| Trong kịch bản | Trên demo | Ghi chú |
| --- | --- | --- |
| Khu "Tầng 1" | Khu "Tầng trệt" | Khu đầu tiên, được chọn sẵn khi vào sơ đồ |
| Bàn 1 (trống) | Bàn B01 (trống) | Khớp |
| Bàn 2, đơn số 24, 125.000đ | Bàn B02, đơn #24, 125.000đ | Gồm Cà phê sữa ×2 (58.000đ), Bạc xỉu 32.000đ, Croissant 35.000đ |
| Dòng "Cà phê" ×2, 29.000đ | Dòng "Cà phê sữa" ×2, 29.000đ | Demo không có món tên "Cà phê"; dùng dòng cùng số lượng và đơn giá |
| Americano 35.000đ, không tùy chọn | Americano 35.000đ, không tùy chọn | Khớp |
| Cà phê sữa có nhóm bắt buộc | Cà phê sữa có nhóm "Size", "Đá" nhưng **không bắt buộc** | Phải chuẩn bị dữ liệu trước khi chạy N01-02 (xem dưới) |
| Chậu cây (vật trang trí) | Vật trang trí đầu tiên trên sơ đồ Tầng trệt | Khu có 7 vật trang trí |
| Chỉ Bàn 2 đang phục vụ | B02, B03, B05, B08 đang phục vụ | B03, B08 hiện "đang phục vụ" nhưng không có đơn mở (tổng 0) |

**Tài khoản demo theo vai:** Thu ngân (Cashier) cho N01-01…N01-07; Phục vụ (Waiter) cho N01-08; Chủ quán chỉ dùng để chuẩn bị dữ liệu N01-02. Mã cửa hàng và PIN demo có sẵn trong `tests/smoke/helpers.ts` và `src/adapters/mock/permissionState.ts`, không ghi lại ở đây.

**Chuẩn bị dữ liệu cho N01-02:** vai Chủ quán vào Thực đơn → chọn món Cà phê sữa → bấm sửa nhóm "Size" → bấm "Không bắt buộc" để chuyển thành "Bắt buộc chọn" → Lưu → Thoát; khóa máy, đăng nhập lại vai Thu ngân. Ở lần chạy đầu (09:51), bước chuẩn bị hỏng vì script bấm nhầm vào vùng nút "Tạm hết/Xóa" trên thẻ món (lỗi của script, không phải của app); đã sửa script và chạy lại riêng N01-02 lúc 09:52.

| ID | Luồng + loại chính/lỗi/biên/quyền | Mục tiêu, quyền/tiền điều kiện, input minh họa | Các bước 1…n | Expected quan sát được | Sxx/Lnnn + requirement/scenario | Tự đối chiếu / điều chưa rõ | Actual |
| --- | --- | --- | --- | --- | --- | --- | --- |
| N01-01 | Sơ đồ bàn — chính (+ biên vật trang trí) | **Mục tiêu:** sơ đồ phân biệt bàn trống/đang phục vụ, vật trang trí không nhận đơn, bàn trống mở được đơn mới.<br>**Quyền giả định:** Cashier mặc định (có `floor.view`, `order.create`).<br>**Input:** Tầng 1 như dữ liệu chung. | 1. Vào ứng dụng; màn đầu tiên là Sơ đồ bàn.<br>2. Chọn khu "Tầng 1" trên thanh khu.<br>3. Nhìn Bàn 1 và Bàn 2.<br>4. Chọn bộ lọc trạng thái "đang phục vụ".<br>5. Bấm vào chậu cây (vật trang trí).<br>6. Bấm vào Bàn 1 (trống). | B2: sơ đồ hiện bàn và vật trang trí của Tầng 1.<br>B3: Bàn 1 hiện trạng thái trống; Bàn 2 hiện đang phục vụ kèm "số đơn" (xem Q-N01-5) và tổng tiền 125.000đ.<br>B4: chỉ Bàn 2 được làm nổi bật.<br>B5: không mở đơn nào.<br>B6: mở màn tạo đơn mới cho Bàn 1. | S02 L014–L021 "Xem sơ đồ bàn theo khu"/"Chuyển khu"; S02 L023–L030 "Biểu diễn trạng thái bàn"/"Bàn đang phục vụ"; S02 L032–L035 "Lọc theo trạng thái"; S02 L037–L049 "Bấm vào vật trang trí"; S02 L055–L058 "Mở đơn tại bàn trống"; S05 L017 B01-03, L023 B01-04 (bộ lọc all/empty/occupied; occupied = status occupied hoặc có open order); S08 L035 `floor.view`, L072 (sơ đồ là home). | **ĐÃ ĐỐI CHIẾU** — Ngọc xác nhận 29/10/2026 21:08 đã tự mở và khớp 6 expected (S08 L072; S02 L020–L021, L025, L029–L030, L034–L035, L039, L048–L049, L057–L058; S05 L023). **CẦN LÀM RÕ (Q-N01-5):** "số đơn" ở S02 L025/L030 là số thứ tự đơn (24) hay số lượng đơn đang mở. Chưa rõ thêm: S02 là baseline lịch sử, S05 B01 chỉ đổi layout/tương tác; tên hiển thị của bộ lọc chưa có trong nguồn. | **ĐÃ CHẠY 03/11/2026 (demo mock)** — B1 đúng; B2 đúng; B3 đúng phần tổng 125.000đ, "số đơn" **chưa kết luận** (trên bàn không có số đơn, Q-N01-5); B4 **LỖI**: bàn không khớp bị ẩn chứ không được làm nổi bật (Q-N01-8); B5 đúng; B6 đúng. |
| N01-02 | Gọi món — lỗi/biên (nhóm bắt buộc chưa chọn) | **Mục tiêu:** món không có tùy chọn thêm thẳng; món có nhóm bắt buộc phải chọn hợp lệ mới thêm được; Hủy không đổi giỏ.<br>**Quyền giả định:** Cashier (`order.update`).<br>**Input:** Bàn 2, đơn 24 (125.000đ), Americano, Cà phê sữa. | 1. Từ sơ đồ bấm Bàn 2 để mở đơn 24.<br>2. Bấm "Americano".<br>3. Bấm "Cà phê sữa", chưa chọn giá trị nào trong nhóm bắt buộc.<br>4. Bấm Hủy trên hộp thoại.<br>5. Bấm lại "Cà phê sữa", chọn một giá trị hợp lệ của nhóm bắt buộc, bấm thêm. | B2: Americano vào giỏ ngay, không mở hộp thoại tùy chọn.<br>B3: hộp thoại tùy chọn mở; nút thêm vào đơn bị khóa.<br>B4: hộp thoại đóng, giỏ không đổi so với sau B2.<br>B5: nút thêm mở khóa; dòng Cà phê sữa vào giỏ và hiển thị tùy chọn đã chọn. | S03 L030 "Chọn món kèm nhóm tùy chọn dùng chung"; S03 L032–L035 "Món không có nhóm tùy chọn"; S03 L037–L040 "Nhóm bắt buộc chưa chọn"; S03 L054 (dòng hiển thị tùy chọn); S06 L007 B02-03 (Cà phê sữa có popup bắt buộc; Americano thêm trực tiếp; cancel không đổi draft); S02 L060–L063 "Mở lại đơn đang phục vụ". | **ĐÃ ĐỐI CHIẾU** — Ngọc xác nhận 29/10/2026 21:18 đã tự mở và khớp 5 expected (S02 L062–L063; S03 L030, L034–L035, L039–L040, L054; S06 L007). B2/B3 có căn cứ S03; S06 chỉ cho tên món ví dụ. **B4 (Hủy không đổi giỏ) chỉ dựa S06 L007 → chờ Q-N01-6.** Chưa rõ: nguồn không nêu tên nhóm/giá trị cụ thể của Cà phê sữa, nên B5 chỉ ghi "một giá trị hợp lệ". | **ĐÃ CHẠY 03/11/2026 (demo mock)** — sau bước chuẩn bị dữ liệu: B1–B5 đúng. B4: hộp thoại không có nút "Hủy", chỉ có nút đóng (X, tên "Đóng"); bấm nút này hộp đóng, giỏ không đổi. |
| N01-03 | Gọi món — biên (đóng đơn khi còn nháp chưa gửi) | **Mục tiêu:** đóng màn đơn khi có thay đổi chưa gửi phải hỏi xác nhận; "Tiếp tục chỉnh sửa" giữ nháp.<br>**Quyền giả định:** Cashier (`order.update`).<br>**Input:** Bàn 2, đơn 24 (125.000đ) đã gửi. | 1. Mở đơn 24 của Bàn 2.<br>2. Thêm Americano (chưa gửi).<br>3. Bấm đóng màn đơn.<br>4. Chọn "Tiếp tục chỉnh sửa".<br>5. Bấm đóng lần nữa, chọn bỏ nháp. | B2: giỏ có Americano, tổng nháp 160.000đ.<br>B3: hiện hộp xác nhận "Bỏ đơn chưa gửi?".<br>B4: vẫn ở màn đơn, nháp giữ nguyên (Americano, 160.000đ).<br>B5: thay đổi chưa gửi bị bỏ. (Màn đơn có đóng hay không: chưa có câu nguồn — Q-N01-4.) | S03 L070–L077 "Bảo vệ chỉnh sửa đơn"/"Đóng đơn khi còn thay đổi chưa lưu"; S06 L005 B02-01 (fixture 125000, dirty+Americano thành 160000); S06 L011 B02-07 (Đóng dirty → "Bỏ đơn chưa gửi?"; "Tiếp tục chỉnh sửa" giữ draft). | **ĐÃ ĐỐI CHIẾU** — Ngọc xác nhận 29/10/2026 21:25 (S03 L072, L076–L077; S06 L005, L011). Mức căn cứ: B2, B4 chỉ dựa S06 → chờ Q-N01-6; B3 phần "phải xác nhận" có S03, tên hộp "Bỏ đơn chưa gửi?" chỉ ở S06 → chờ Q-N01-6; B5 phần "bỏ thay đổi" có S03 L077, phần sau khi bỏ → Q-N01-4. Chưa rõ: nguồn chỉ nêu "Giữ/Bỏ nháp" (S06 L011), không có tên chính xác nút bỏ; sau B5 đơn 24 vẫn 125.000đ là suy ra từ "bỏ thay đổi", chưa có câu nguồn ghi số. | **ĐÃ CHẠY 03/11/2026 (demo mock)** — B1–B5 đúng. Nút bỏ tên "Bỏ đơn"; bấm xong màn đơn đóng, mở lại Bàn 2 thấy 125.000đ (quan sát cho Q-N01-4). |
| N01-04 | Thanh toán — chính (trả đủ cả đơn, tiền mặt) | **Mục tiêu:** trả toàn bộ đơn bằng tiền mặt, tính tiền thối, bàn về trống; chỉ tiền mặt được chọn.<br>**Quyền giả định:** Cashier (`payment.take`).<br>**Input:** Bàn 2, đơn 24 = 125.000đ; khách đưa 200.000đ. | 1. Mở đơn 24, bấm Thanh toán.<br>2. Nhìn danh sách món chọn trả và số phải trả.<br>3. Bấm phương thức Thẻ (hoặc QR).<br>4. Bấm nút nhanh "200k".<br>5. Bấm "+20k" rồi bấm lại "200k".<br>6. Bấm hoàn tất thanh toán. | B2: mặc định chọn tất cả; phải trả 125.000đ.<br>B3: Thẻ/QR không được chọn, vẫn ở tiền mặt.<br>B4: khách đưa 200.000đ, trả lại 75.000đ.<br>B5: "+20k" đặt số khách đưa thành 145.000đ; "200k" đặt lại 200.000đ.<br>B6: màn thanh toán đóng; trên sơ đồ Bàn 2 trở về trống; nếu mở Lịch sử đơn (Cashier có `orderHistory.view`) thì đơn 24 ở trạng thái đã thanh toán. | S04 L014–L021 "Thanh toán toàn bộ đơn bằng tiền mặt"/"Khách đưa đủ tiền"; S04 L058 (chọn tất cả bật mặc định); S04 L075–L082 "Phương thức thanh toán khả dụng"; S07 L027 R03 (đơn khác khởi tạo chọn tất cả); S07 L036–L041 R04 (quick +20k, 200k; đơn 125.000 khách đưa 200.000 trả lại 75.000, +20k đặt 145.000); S07 L045 R05 (full success đóng drawer); S01 L023. | **ĐÃ ĐỐI CHIẾU** — Ngọc xác nhận 29/10/2026 21:28 đã tự mở và khớp 5 expected (S04 L016, L020–L021, L058, L077, L081–L082; S07 L027, L036, L040–L041, L045; S01 L023; xem Lịch sử cần S08 L040 `orderHistory.view`). Không chờ Q-N01-6: S07 L003 chỉ ghi code "chưa nghiệm thu/merge/deploy", không ghi yêu cầu là lịch sử như S06 L020 (S01 L005: yêu cầu xác định expected, code xác định implementation). Chưa rõ: số bill (S04 L047–L054) không kiểm trong ca này. | **ĐÃ CHẠY 03/11/2026 (demo mock)** — B1–B6 đúng. Sau khi hoàn tất có hiện hóa đơn vì ô "In hóa đơn sau khi thanh toán" bật sẵn. |
| N01-05 | Thanh toán — lỗi/biên (thiếu tiền, không chọn món) | **Mục tiêu:** chặn hoàn tất khi thiếu 1đ và khi bỏ chọn hết món.<br>**Quyền giả định:** Cashier (`payment.take`).<br>**Input:** Bàn 2, đơn 24 = 125.000đ; nhập 124.999đ. | 1. Mở thanh toán đơn 24 (mặc định chọn tất cả, phải trả 125.000đ).<br>2. Bấm phím xóa đến khi ô "khách đưa" trống, rồi nhập 124999 bằng bàn phím số.<br>3. Bấm hoàn tất.<br>4. Bấm "Đúng tiền".<br>5. Bỏ chọn tất cả món, rồi bấm hoàn tất. | B2: hiển thị thiếu 1đ.<br>B3: nút hoàn tất bị khóa (vẫn hiện, kèm lý do thiếu tiền); không ghi lệnh thanh toán; đơn vẫn mở.<br>B4: số khách đưa = 125.000đ.<br>B5: phải trả 0đ, trạng thái "chưa chọn món"; hoàn tất bị chặn. | S04 L023–L026 "Khách đưa thiếu tiền"; S04 L028–L031 "Chưa chọn món nào"; S07 L036–L041 R04 (delete xóa một chữ số; Đúng tiền = due; nhập 124.999đ hiển thị thiếu 1đ và không ghi lệnh; thiếu tiền khóa thanh toán); S07 L027 R03, L032 (bỏ tất cả → 0đ); S07 L045 R05 (trạng thái insufficient/nothing-selected); S08 L089 PERM-04 (actor có quyền nhưng nghiệp vụ chưa cho thì giữ nút disabled cùng lý do); S09 L044. | **ĐÃ ĐỐI CHIẾU** — Ngọc xác nhận 29/10/2026 21:31 (S04 L025–L026, L030–L031; S07 L032, L036, L041, L045; S08 L089). **Đã sửa B5 (Ngọc tự phát hiện):** bỏ ý "không tự chọn lại tất cả" vì S07 L027 chỉ áp khi refetch cùng đơn, ca này không có refetch. Chưa thêm bước refetch vì nguồn không nêu thao tác làm mới trong màn thanh toán (S02 L053 là nút làm mới trên sơ đồ). Chưa rõ: giá trị ban đầu của ô khách đưa khi mở thanh toán (R03 L027 chỉ nói reset về amountDue khi amountDue đổi); sau B5 received về 0đ, nguồn không mô tả chữ hiển thị cụ thể. | **ĐÃ CHẠY 03/11/2026 (demo mock)** — B1, B2, B3, B5 đúng; B4 **LỖI so với kịch bản**: khi đang thiếu tiền, màn không có nút "Đúng tiền" để bấm (Q-N01-7). Ô khách đưa ban đầu điền sẵn 125.000đ. |
| N01-06 | Thanh toán — chính (trả một phần / tách đơn) | **Mục tiêu:** chọn một phần món, nút + xoay vòng, tách thành đơn đã thanh toán độc lập; đơn gốc vẫn mở.<br>**Quyền giả định:** Cashier (`payment.take`).<br>**Input:** Bàn 2, đơn 24 = 125.000đ, dòng Cà phê ×2 giá 29.000đ. | 1. Mở thanh toán đơn 24.<br>2. Bỏ chọn tất cả.<br>3. Tick dòng Cà phê.<br>4. Bấm "+" hai lần, quan sát sau mỗi lần.<br>5. Để Cà phê ở 1/2, bấm "Đúng tiền" rồi hoàn tất.<br>6. Đóng màn thanh toán, nhìn Bàn 2 trên sơ đồ. | B2: 0đ.<br>B3: Cà phê 1/2, phải trả 29.000đ.<br>B4: lần 1 → 2/2, 58.000đ; lần 2 → 1/2, 29.000đ.<br>B5: màn thanh toán vẫn mở; đơn tách đã trả 29.000đ; đơn nguồn còn 96.000đ; lựa chọn rỗng, phải trả 0đ; không tự chọn phần còn lại.<br>B6: Bàn 2 vẫn đang phục vụ, tổng 96.000đ. | S04 L033–L040 "Thanh toán một phần bằng cách tách đơn độc lập"/"Tách và thanh toán một phần"; S04 L060–L063 "Bỏ chọn rồi chọn lại từng dòng"; S07 L027–L032 R03 "Chọn cà phê trong đơn24"; S07 L045–L050 R05 "Trả một cà phê29.000đ"; S01 L023 (chọn tất cả chỉ áp lúc mở đơn, không tự chọn lại sau split); S02 L025–L030; S09 L044. | **ĐÃ ĐỐI CHIẾU** — Ngọc xác nhận 29/10/2026 21:33 (S07 L027, L032, L045, L050; S04 L035–L040, L062–L063; S01 L023; S02 L025–L030). Giữ ý "không tự chọn phần còn lại" vì có căn cứ trực tiếp S07 L050 và S01 L023 cho tình huống sau split (khác N01-05). Chưa rõ: số bill sau tách (S04 L049–L054: đơn tách giữ số 24, đơn gốc nhận số mới) chưa đưa vào bước vì chưa biết màn nào hiện số bill. | **ĐÃ CHẠY 03/11/2026 (demo mock)** — B1–B6 đúng (dùng dòng "Cà phê sữa" thay cho "Cà phê"). |
| N01-07 | Mang đi — chính | **Mục tiêu:** đơn mang đi không chiếm bàn, chỉ đơn đang mở nằm trong danh sách; đã thanh toán thì chỉ còn ở lịch sử.<br>**Quyền giả định:** Cashier (`order.create`, `payment.take`, `orderHistory.view`).<br>**Input:** đơn mang đi mới gồm 1 Americano; khách đưa đúng tiền. | 1. Trên sơ đồ, ghi lại các bàn đang phục vụ (theo dữ liệu chung: chỉ Bàn 2); rồi mở khu Mang đi (Takeaway drawer) từ thanh điều hướng.<br>2. Tạo đơn mang đi mới, thêm Americano, gửi đơn.<br>3. Nhìn danh sách mang đi; quay lại sơ đồ so với danh sách bàn đã ghi ở bước 1.<br>4. Mở lại đơn từ danh sách, bấm Thanh toán, "Đúng tiền", hoàn tất.<br>5. Nhìn lại danh sách mang đi.<br>6. Mở Lịch sử đơn. | B3: đơn mới có trong danh sách mang đi đang mở; không bàn nào trên sơ đồ đổi sang đang phục vụ vì đơn này.<br>B4: thanh toán hoàn tất.<br>B5: đơn không còn trong danh sách mang đi.<br>B6: thấy đơn mang đi ở trạng thái đã thanh toán. | S03 L014–L021 "Tạo đơn tại bàn và đơn mang đi"/"Tạo đơn mang đi"; S03 L023–L026 "Đơn mang đi đã thanh toán"; S09 L046–L048 §10 Takeaway Drawer; S05 L017 B01-03 (order card mở đúng đơn tại bàn hoặc mang đi); S08 L036, L039, L040. | **ĐÃ ĐỐI CHIẾU** — Ngọc xác nhận 29/10/2026 21:34 (S03 L016, L020–L021, L025–L026; S05 L017; S08 L039, L040; S09 L046–L048). Expected B3–B6 có căn cứ spec; S09 chỉ dùng để biết bấm ở đâu (B1, B4), không có expected chỉ dựa S09. Q-N01-1 không chặn ca vì B2 đã thêm món và gửi trước khi B3 quan sát. **CẦN LÀM RÕ (Q-N01-1):** đơn xuất hiện trong danh sách ngay khi tạo hay sau khi gửi món đầu. Tham khảo: S10 L017 ghi chưa có batch remake mang đi riêng; S11 L039 ghi hành trình tạo → mở lại → thanh toán mang đi chưa đủ evidence — chỉ là lý do ưu tiên ca, không phải expected. | **ĐÃ CHẠY 03/11/2026 (demo mock)** — B1–B6 đúng (đơn mang đi #27). |
| N01-08 | Sơ đồ + gọi món + thanh toán — thiếu quyền | **Mục tiêu:** thiếu quyền thì không hiện lối vào/nút tương ứng; quyền nền vẫn dùng được.<br>**Quyền giả định:** Waiter mặc định: có `floor.view`, `order.create`, `order.update`; **không** có `payment.take`, `order.voidOpen`, `orderHistory.view`, `report.view`, `menu.manage`, `employee.manage`, `settings.manage` (cùng các quyền quản trị khác ở S08 L041–L049).<br>**Input:** Bàn 2, đơn 24. Vai Waiter chỉ là giả định theo spec, chưa có tài khoản thật. | 1. Vào ứng dụng với vai Waiter (giả định).<br>2. Nhìn thanh điều hướng.<br>3. Bấm Bàn 2 để mở đơn 24.<br>4. Thêm Americano, gửi đơn.<br>5. Nhìn các nút trên màn đơn. | B1: về màn Sơ đồ bàn (home).<br>B2: không có lối vào Lịch sử đơn, Báo cáo, Menu, Nhân viên, Cài đặt.<br>B3: đơn 24 mở được.<br>B4: gửi được; đơn 24 có thêm dòng Americano.<br>B5: không có nút/lối vào Thanh toán, không có nút hủy đơn đang mở. | S08 L031–L049 PERM-02 (bảng quyền Waiter); S08 L072 PERM-03 (sơ đồ là home/fallback do `floor.view` luôn có; quyền action không tự cấp history/report); S08 L089 PERM-04 (thiếu quyền không render lối vào/nút); S07 L014 R01 (thiếu `payment.take` phải bị từ chối ở cả UI và flow); S09 L032, L036. Không dùng nav admin/cashier ở S05 L029 B01-05 (theo nguon/README). | **ĐÃ ĐỐI CHIẾU** — Ngọc xác nhận 29/10/2026 21:36 (S08 L035–L047, L072, L089; S02 L062–L063; S07 L014). B5 là "không render" vì thiếu quyền (PERM-04 ý 1), khác N01-05 B3 là "disabled + lý do" vì điều kiện nghiệp vụ (PERM-04 ý 2). Không dùng S05 L029 vì nav admin/cashier là checkpoint cũ (nguon/README; S01 L013; S08 L072). **CẦN LÀM RÕ (Q-N01-2, Q-N01-3):** nút chính của đơn đã gửi khi thiếu `payment.take`; mapping nút ↔ quyền nằm ở design chưa có trong gói. Phần "server cũng phải kiểm lại" (PERM-04) không kiểm được bằng thao tác UI; không tự gọi backend. | **ĐÃ CHẠY 03/11/2026 (demo mock)** — B1–B5 đúng. Màn đơn của Waiter chỉ có nút "Đóng", không có nút chính nào khác (quan sát cho Q-N01-2). |

## Kết quả chạy r03 — từng bước (03/11/2026, demo mock, 1366×768)

Cách đọc: **ĐÚNG** = thấy đúng expected của r02; **LỖI** = khác expected hoặc không làm được bước như kịch bản ghi (chưa kết luận là lỗi app hay lỗi kịch bản, chờ Linh); **CHƯA KẾT LUẬN** = expected còn chờ câu hỏi; **CHƯA CHẠY** = không chạy được. Ảnh nằm trong [../chay-demo-2026-11-03/anh/](../chay-demo-2026-11-03/anh/), tên file theo ca và bước (ví dụ `N01-05/B4.png`).

**Tổng hợp:** 44 bước; 41 ĐÚNG, 2 LỖI (N01-01 B4, N01-05 B4), 1 CHƯA KẾT LUẬN (N01-01 B3 phần "số đơn"), 0 CHƯA CHẠY. Thêm 1 bước chuẩn bị dữ liệu cho N01-02.

**N01-01 — Sơ đồ bàn**

| Bước | Quan sát trên demo | Kết quả |
| --- | --- | --- |
| B1 | Đăng nhập Thu ngân, màn đầu là Sơ đồ bàn, không có màn nào khác mở đè. | ĐÚNG |
| B2 | Khu "Tầng trệt" đã được chọn sẵn; sau khi bấm, sơ đồ hiện 8 bàn (B01–B08) và 7 vật trang trí. Vì khu đã chọn sẵn nên bước này chưa thật sự thử "chuyển sang khu khác". | ĐÚNG |
| B3 | B01 trống. B02 đang phục vụ, trên bàn ghi "B02 125K" (tổng 125.000đ). Không thấy số thứ tự đơn hay số lượng đơn trên bàn. | ĐÚNG phần tổng tiền; "số đơn" CHƯA KẾT LUẬN (Q-N01-5) |
| B4 | Chọn "Đang phục vụ": sơ đồ chỉ còn 4/8 bàn (B02, B03, B05, B08); các bàn khác **bị ẩn**, không phải được làm nổi bật. B03 và B08 hiện đang phục vụ nhưng không có đơn mở. | **LỖI** so với expected (S02 L035) — Q-N01-8 |
| B5 | Bấm một vật trang trí: không mở đơn nào. | ĐÚNG |
| B6 | Bấm B01: mở "Gọi món — Bàn B01 · Đơn mới · Chưa gửi". | ĐÚNG |

**N01-02 — Gọi món, nhóm bắt buộc**

| Bước | Quan sát trên demo | Kết quả |
| --- | --- | --- |
| Chuẩn bị | Vai Chủ quán đặt nhóm "Size" của Cà phê sữa thành "Bắt buộc chọn", lưu, rồi đăng nhập lại vai Thu ngân. | ĐÃ CHUẨN BỊ |
| B1 | Mở B02: "Gọi món — Bàn B02 · Đơn #24 · Đã gửi", tổng 125.000đ. | ĐÚNG |
| B2 | Bấm Americano: không mở hộp thoại; giỏ từ 3 lên 4 dòng; tổng 160.000đ. | ĐÚNG |
| B3 | Bấm Cà phê sữa: hộp thoại mở, nhóm "Size · Chọn 1 · Bắt buộc"; nút "Thêm vào đơn" bị khóa. | ĐÚNG |
| B4 | Hộp thoại **không có nút "Hủy"**, chỉ có nút đóng (X, tên "Đóng"). Bấm nút này: hộp đóng, giỏ vẫn 4 dòng, 160.000đ như sau B2. | ĐÚNG (nút tên "Đóng", không phải "Hủy") |
| B5 | Chọn "Size M": nút thêm mở khóa; giỏ có thêm dòng "Cà phê sữa · Phần gọi thêm · Size M". | ĐÚNG |

**N01-03 — Đóng đơn khi còn nháp**

| Bước | Quan sát trên demo | Kết quả |
| --- | --- | --- |
| B1 | Mở đơn 24 của B02, tổng 125.000đ. | ĐÚNG |
| B2 | Thêm Americano: tổng 160.000đ. | ĐÚNG |
| B3 | Bấm "Đóng": hiện hộp "Bỏ đơn chưa gửi?" với 2 nút "Tiếp tục chỉnh sửa" và "Bỏ đơn". | ĐÚNG |
| B4 | Bấm "Tiếp tục chỉnh sửa": vẫn ở màn đơn, tổng 160.000đ. | ĐÚNG |
| B5 | Đóng lần nữa, bấm "Bỏ đơn": màn đơn đóng. Mở lại B02: tổng 125.000đ, không còn Americano. | ĐÚNG |

**N01-04 — Thanh toán trả đủ**

| Bước | Quan sát trên demo | Kết quả |
| --- | --- | --- |
| B1 | Bấm "Thanh toán": mở "Thanh toán đơn hàng · Bàn B02 · Đơn #24 · 4 món". | ĐÚNG |
| B2 | "Chọn tất cả" bật, "4 món đã chọn", phải trả 125.000đ. | ĐÚNG |
| B3 | Thẻ và QR (cả Chuyển khoản) ghi "Chưa bật", không bấm được; Tiền mặt vẫn "Đang chọn". | ĐÚNG |
| B4 | Bấm "200k": khách đưa 200.000đ, trả lại 75.000đ. | ĐÚNG |
| B5 | "+20k" đặt 145.000đ; bấm "200k" đặt lại 200.000đ. | ĐÚNG |
| B6 | Bấm hoàn tất: màn thanh toán đóng, hiện hóa đơn số 24. Đóng hóa đơn: B02 trống. Lịch sử đơn: B02, 125.000đ, đã thanh toán. | ĐÚNG |

**N01-05 — Thiếu tiền, không chọn món**

| Bước | Quan sát trên demo | Kết quả |
| --- | --- | --- |
| B1 | Phải trả 125.000đ; ô "Tiền khách đưa" **điền sẵn 125.000** (trả lời phần "chưa rõ giá trị ban đầu" của r02). | ĐÚNG |
| B2 | Bấm xóa 6 lần đến khi ô về 0, nhập 124999: hiện "Còn thiếu 1 ₫.". | ĐÚNG |
| B3 | Nút "Hoàn tất thanh toán (125.000 ₫)" vẫn hiện nhưng bị khóa; lý do hiện ở dòng "Còn thiếu 1 ₫" (bản thân nút không có chú thích). Bấm ép: không ra hóa đơn, màn vẫn mở. | ĐÚNG |
| B4 | Khi đang thiếu tiền, cả hàng nút nhanh (Đúng tiền, +20k, +50k, 200k, 500k) **bị thay bằng** dòng "Còn thiếu…", nên không có nút "Đúng tiền" để bấm. | **LỖI** so với kịch bản — Q-N01-7 |
| B5 | Bỏ "Chọn tất cả": "0 món đã chọn", phải trả 0đ, ô khách đưa về 0; nút "Thanh toán món đã chọn (0 ₫)" bị khóa; bấm ép không ra hóa đơn. Không có dòng chữ "chưa chọn món" riêng. | ĐÚNG |

**N01-06 — Trả một phần**

| Bước | Quan sát trên demo | Kết quả |
| --- | --- | --- |
| B1 | Mở thanh toán đơn 24, phải trả 125.000đ. | ĐÚNG |
| B2 | Bỏ chọn tất cả: phải trả 0đ. | ĐÚNG |
| B3 | Tick dòng "Cà phê sữa": 1/2, phải trả 29.000đ. | ĐÚNG |
| B4 | "+" lần 1: 2/2, 58.000đ; lần 2: 1/2, 29.000đ. | ĐÚNG |
| B5 | "Đúng tiền" rồi hoàn tất: hóa đơn đơn tách 29.000đ. Đóng hóa đơn: màn thanh toán vẫn mở; tổng đơn nguồn 96.000đ; phải trả 0đ; "Chọn tất cả" tắt; không dòng nào được chọn. | ĐÚNG |
| B6 | Đóng màn thanh toán: B02 vẫn đang phục vụ, tổng 96.000đ. | ĐÚNG |

**N01-07 — Mang đi**

| Bước | Quan sát trên demo | Kết quả |
| --- | --- | --- |
| B1 | Bàn đang phục vụ ở Tầng trệt: B02, B03, B05, B08. Mở "Bán mang đi": "1 đơn đang mở". | ĐÚNG |
| B2 | "Tạo đơn mang đi" mở "Gọi món — Mang đi · Đơn mới"; thêm Americano, bấm "In/Gửi đơn": ra phiếu bếp đơn #27. | ĐÚNG |
| B3 | Danh sách mang đi từ 1 lên 2 đơn đang mở, có #27. Bàn đang phục vụ vẫn là B02, B03, B05, B08. | ĐÚNG |
| B4 | Mở #27 từ danh sách → "Thanh toán" → "Đúng tiền" → hoàn tất: phải trả 35.000đ, hóa đơn 35.000đ. | ĐÚNG |
| B5 | Danh sách về "1 đơn đang mở", không còn #27. | ĐÚNG |
| B6 | Lịch sử đơn: đơn "Mang đi" 35.000đ, đã thanh toán. | ĐÚNG |

**N01-08 — Thiếu quyền (Waiter)**

| Bước | Quan sát trên demo | Kết quả |
| --- | --- | --- |
| B1 | Đăng nhập vai Phục vụ (Waiter): màn Sơ đồ bàn. | ĐÚNG |
| B2 | Thanh điều hướng chỉ có: Sơ đồ bàn, Tra cứu thao tác, Bán mang đi, Khoá. | ĐÚNG |
| B3 | Mở B02: "Gọi món — Bàn B02 · Đơn #24 · Đã gửi". | ĐÚNG |
| B4 | Thêm Americano, bấm "In/Gửi đơn": ra phiếu bếp. Mở lại: 4 dòng, có Americano, tổng 160.000đ. | ĐÚNG |
| B5 | Màn đơn chỉ có nút "Đóng" ở đầu màn; không có "Thanh toán", không có "Hủy đơn mở". | ĐÚNG |

## Nhận và trả lời góp ý của Lâm

- Bản N01 thực gửi Lâm / phạm vi ca / thời điểm: r01 / N01-01…N01-08 / ĐÃ GỬI — Ngọc xác nhận đã gửi lúc 29/10/2026 21:06 (bản lưu: gui-lam/N01-kich-ban-r01.md); gửi kèm ghi chú "nháp AI, chưa tự đối chiếu xong". r02 / N01-01…N01-08 đã tự đối chiếu / ĐÃ GỬI — Ngọc xác nhận đã gửi lúc 29/10/2026 21:44 (bản lưu: gui-lam/N01-kich-ban-r02.md, gồm phản hồi L04-01…08), kèm đề nghị Lâm ghi giờ nhận và rà chính thức trên r02
- Bản L04 thực nhận / người gửi / thời điểm: L04 **dự thảo**, không ghi phiên bản / Lâm / Ngọc nhận 29/10/2026 21:40 (bản lưu: dau-vao/L04-nhan-2026-10-29-2140.md). Chính L04 ghi "CHƯA NHẬN ĐẦU VÀO / CHƯA RÀ BẢN N01 THỰC TẾ": 8 ca đều CHƯA RÀ, góp ý là "ĐỀ XUẤT", nguồn "CHƯA TỰ ĐỐI CHIẾU", soạn từ nội dung trao đổi với AI (ChatGPT). L04 ghi chưa nhận N01, trong khi r01 đã gửi 21:06 → cần Lâm xác nhận bản nhận. **Chưa tính là Lâm đã rà N01.** L04 cập nhật nhận 29/10/2026 21:50 (dau-vao/L04-nhan-2026-10-29-2150.md): vẫn CHỜ LÂM XÁC NHẬN cả 8 ca, mục 9 chưa điền. L04 thứ ba nhận 21:55 (dau-vao/L04-nhan-2026-10-29-2155.md): ChatGPT đọc r02, đánh giá nội dung N01-04/05/06 RÕ THEO NGUỒN, N01-01/02/03/07/08 CẦN LÀM RÕ (khớp Q-N01 đang chờ Linh), không đề xuất sửa mới; mục 7 "Xác nhận của Lâm" vẫn trống.

| ID góp ý L04 | Ca liên quan | Tôi sửa gì hoặc giữ vì nguồn nào | Phiên bản N01 sau sửa | Lâm kiểm lại bản nào / kết quả và thời điểm thật |
| --- | --- | --- | --- | --- |
| L04-01 (đề xuất) | N01-01 | Đồng ý. Giữ nguyên chữ "số đơn" như S02 L025/L030, đã có Q-N01-5 chờ Linh. Không sửa. | r02 (không đổi) | r02 — Lâm đồng ý (tin nhắn Lâm tự gửi, Ngọc nhận 29/10/2026 21:56; Lâm ghi giờ xác nhận 21:47; dau-vao/tin-nhan-Lam-2026-10-29-2156.md). Mục xác nhận trong file L04 chưa điền. |
| L04-02 (đề xuất) | N01-02 | Đồng ý, đã xử lý: B2/B3 có căn cứ S03 (L034–L035, L039–L040), S06 chỉ cho tên món; chỉ B4 (Hủy không đổi giỏ) dựa duy nhất S06 L007 → chờ Q-N01-6. | r02 | r02 — Lâm đồng ý (tin nhắn Lâm tự gửi, Ngọc nhận 29/10/2026 21:56; Lâm ghi giờ xác nhận 21:47; dau-vao/tin-nhan-Lam-2026-10-29-2156.md). Mục xác nhận trong file L04 chưa điền. |
| L04-03 (đề xuất) | N01-03 | Đồng ý, đã xử lý: ghi mức căn cứ từng bước (B2, B4 chỉ S06; B3 phần xác nhận có S03 L076–L077); B5 tách "màn đơn đóng" vì chưa có câu nguồn → Q-N01-4. | r02 | r02 — Lâm đồng ý (tin nhắn Lâm tự gửi, Ngọc nhận 29/10/2026 21:56; Lâm ghi giờ xác nhận 21:47; dau-vao/tin-nhan-Lam-2026-10-29-2156.md). Mục xác nhận trong file L04 chưa điền. |
| L04-04 (đề xuất) | N01-04 | Đồng ý, đã kiểm: S07 L003 chỉ ghi code "chưa nghiệm thu/merge/deploy", không ghi yêu cầu là lịch sử như S06 L020 → S07 dùng làm expected được (S01 L005). Số 125.000/200.000/75.000/145.000 khớp S07 L036, L040–L041. | r02 | r02 — Lâm đồng ý (tin nhắn Lâm tự gửi, Ngọc nhận 29/10/2026 21:56; Lâm ghi giờ xác nhận 21:47; dau-vao/tin-nhan-Lam-2026-10-29-2156.md). Mục xác nhận trong file L04 chưa điền. |
| L04-05 (đề xuất) | N01-05 | Đồng ý, đã sửa: bỏ "không tự chọn lại tất cả" khỏi B5 (S07 L027 chỉ áp khi refetch). **Chưa thêm** bước refetch vì nguồn không nêu thao tác làm mới trong màn thanh toán (S02 L053 là nút trên sơ đồ). | r02 | r02 — Lâm đồng ý (tin nhắn Lâm tự gửi, Ngọc nhận 29/10/2026 21:56; Lâm ghi giờ xác nhận 21:47; dau-vao/tin-nhan-Lam-2026-10-29-2156.md). Mục xác nhận trong file L04 chưa điền. |
| L04-06 (đề xuất) | N01-06 | Đồng ý, giữ: S07 L045 (split success → xóa selection, refetch đơn nguồn) và S07 L050 ("Không tự tạo ý định thanh toán phần còn lại"), S01 L023. | r02 (không đổi) | r02 — Lâm đồng ý (tin nhắn Lâm tự gửi, Ngọc nhận 29/10/2026 21:56; Lâm ghi giờ xác nhận 21:47; dau-vao/tin-nhan-Lam-2026-10-29-2156.md). Mục xác nhận trong file L04 chưa điền. |
| L04-07 (đề xuất) | N01-07 | Đồng ý: expected B3–B6 dựa S03/S05/S08, S09 chỉ để tìm màn. Nguyên văn Q-N01-1 ở bảng "Câu hỏi cần làm rõ" cuối N01; ca không phụ thuộc câu trả lời vì B2 đã thêm món và gửi trước khi B3 quan sát. | r02 (không đổi) | r02 — Lâm đồng ý (tin nhắn Lâm tự gửi, Ngọc nhận 29/10/2026 21:56; Lâm ghi giờ xác nhận 21:47; dau-vao/tin-nhan-Lam-2026-10-29-2156.md). Mục xác nhận trong file L04 chưa điền. |
| L04-08 (đề xuất) | N01-08 | Đồng ý, đã ghi: thiếu quyền → không render (PERM-04 ý 1), khác N01-05 B3 → disabled + lý do (ý 2); không dùng S05 L029 vì nav admin/cashier là checkpoint cũ (nguon/README; S01 L013; S08 L072). | r02 | r02 — Lâm đồng ý (tin nhắn Lâm tự gửi, Ngọc nhận 29/10/2026 21:56; Lâm ghi giờ xác nhận 21:47; dau-vao/tin-nhan-Lam-2026-10-29-2156.md). Mục xác nhận trong file L04 chưa điền. |

## Câu hỏi cần làm rõ

| ID | Ca bị ảnh hưởng | Hai nguồn/dòng hoặc phần thiếu | Câu hỏi cụ thể cho Linh / phần độc lập vẫn làm tiếp | Phản hồi thật nếu có |
| --- | --- | --- | --- | --- |
| Q-N01-1 | N01-07 | S03 L020–L021 nói đơn mang đi "được tạo… và xuất hiện trong danh sách đơn mang đi đang mở", nhưng không nói đơn chưa có món có được tính là đơn đang mở không. | Đơn mang đi xuất hiện trong danh sách ngay khi tạo hay sau khi gửi món đầu? Ca vẫn giữ bước "thêm món, gửi" rồi mới quan sát, nên bước 4–6 không phụ thuộc câu trả lời. | Đã gửi Linh (Ngọc xác nhận 29/10/2026 21:45) — CHỜ LINH TRẢ LỜI |
| Q-N01-2 | N01-08 | S06 L009 B02-05: "Clean mở payment" là hành động chính; S08 L089 PERM-04: thiếu quyền thì không render nút. Nguồn không nói khi Waiter (không có `payment.take`) mở đơn đã gửi thì nút chính là gì. | Với Waiter, đơn clean hiện nút chính nào (ẩn hẳn hay nút khác)? Ca chỉ ghi expected "không có nút Thanh toán", không tự chọn nút thay thế. | Đã gửi Linh (Ngọc xác nhận 29/10/2026 21:45) — CHỜ LINH TRẢ LỜI |
| Q-N01-3 | N01-08 (và N01-07 nếu đổi vai) | S08 L072 PERM-03 nói lối vào đơn/payment/lịch sử/in lại "dùng mapping ở design" — file design không có trong 12 nguồn. | Có thể cấp đoạn design mapping nút ↔ quyền (hủy đơn, chuyển thanh toán từ danh sách mang đi) không? Hiện chỉ dẫn bảng PERM-02 + quy tắc PERM-04. | Đã gửi Linh (Ngọc xác nhận 29/10/2026 21:45) — CHỜ LINH TRẢ LỜI |
| Q-N01-4 | N01-03 | S03 L077 chỉ nói "xác nhận trước khi bỏ thay đổi"; S06 L011 ghi "Giữ/Bỏ nháp" và "Tiếp tục chỉnh sửa". Không có tên chính xác nút bỏ và không có câu ghi tổng đơn sau khi bỏ. | Tên nút bỏ nháp là gì; sau khi bỏ thì màn đơn đóng hay giữ mở; có cần kiểm đơn quay về 125.000đ không? Ca vẫn giữ bước 1–4 có nguồn rõ. | Đã gửi Linh (Ngọc xác nhận 29/10/2026 21:45) — CHỜ LINH TRẢ LỜI |
| Q-N01-5 | N01-01 | S02 L025 "hiển thị thêm số đơn và tổng tiền", L030 "kèm số đơn và tổng tiền hiện tại" — "số đơn" có thể là số thứ tự đơn (24) hoặc số lượng đơn đang mở; S05 B01 không mô tả lại. | "Số đơn" trên bàn nghĩa là gì? Ca giữ chữ "số đơn" nguyên văn, chưa ghi giá trị mong đợi; tổng tiền 125.000đ vẫn kiểm được. | Đã gửi Linh (Ngọc xác nhận 29/10/2026 21:45) — CHỜ LINH TRẢ LỜI |
| Q-N01-6 | N01-02, N01-03, N01-08 (các expected dẫn S06) | S01 L021 dùng B02 (S06) làm delta order-management; nhưng S06 L018–L020 ghi bảng B02-01…10 "giữ làm lịch sử, không còn là trạng thái hiện tại" và trỏ sang tài liệu implementation/audit không có trong gói. | Các scenario B02-01/03/05/07 trong S06 có còn dùng làm expected không, hay cần đoạn nào thay thế? Các bước có nguồn S03 (baseline) vẫn giữ. | Đã gửi Linh (Ngọc xác nhận 29/10/2026 21:45) — CHỜ LINH TRẢ LỜI |
| Q-N01-7 (mới, r03) | N01-05 B4 | S07 L036 R04 liệt kê nút nhanh "Đúng tiền=due; +20k; +50k; 200k/500k" và "Thiếu tiền khóa thanh toán", không nói ẩn nút nhanh khi thiếu tiền. Trên demo, khi đang thiếu tiền, hàng nút nhanh bị thay bằng dòng "Còn thiếu…". | Ẩn nút nhanh khi thiếu tiền là đúng thiết kế hay cần sửa? Nếu đúng thiết kế thì N01-05 B4 sẽ đổi thành "xóa và nhập lại số tiền". Các bước khác của N01-05 không phụ thuộc câu này. | Đã gửi Linh (Ngọc xác nhận 06/11/2026 08:30) — CHỜ LINH TRẢ LỜI |
| Q-N01-8 (mới, r03) | N01-01 B4 | S02 L035 "sơ đồ chỉ làm nổi bật các bàn khớp trạng thái đã chọn"; S05 L023 B01-04 chỉ nêu ba bộ lọc all/empty/occupied. Trên demo, bàn không khớp bị ẩn khỏi sơ đồ. | Bộ lọc nên làm nổi bật hay ẩn bàn không khớp? Nếu ẩn là đúng thì sửa expected N01-01 B4. | Đã gửi Linh (Ngọc xác nhận 06/11/2026 08:30) — CHỜ LINH TRẢ LỜI |

**Quan sát trên demo liên quan câu hỏi cũ** (chỉ là app đang làm gì, không thay câu trả lời của Linh):
- Q-N01-2: Waiter mở đơn đã gửi, màn đơn chỉ có nút "Đóng", không có nút chính nào.
- Q-N01-4: nút bỏ nháp tên "Bỏ đơn"; bấm xong màn đơn đóng; mở lại đơn về 125.000đ.
- Q-N01-5: trên bàn chỉ hiện tên bàn và tổng tiền rút gọn ("B02 125K"), không hiện số đơn.

## Tự kiểm và bàn giao thật

- [x] Số ca thực: 8; ca sơ đồ: N01-01 (+ N01-08); gọi món: N01-02, N01-03; thanh toán: N01-04, N01-05, N01-06; mang đi: N01-07. ID không dùng: không có.
- [x] Ca lỗi/biên: N01-02, N01-03, N01-05; thiếu quyền: N01-08; expected có nguồn đã tự mở: 8/8 ca (29/10/2026 21:08–21:36). Phần chưa rõ không tính hoàn tất: N01-02 B4, N01-03 B2–B4 chờ Q-N01-6; N01-03 B5 chờ Q-N01-4; N01-01 "số đơn" chờ Q-N01-5; N01-08 chờ Q-N01-2/3.
- [ ] Tôi giải thích được ca N01-02 (câu c, lời Ngọc 29/10/2026 21:18): "Phần bảng yêu cầu B02 trong S06 là đề xuất cũ, không còn đại diện đầy đủ cho trạng thái hiện tại sau triển khai. Vì một số expected của N01-02 vẫn dựa trên bảng này nên cần hỏi Linh xác nhận trước khi dùng làm expected." Thêm ca N01-08 (câu i, lời Ngọc 29/10/2026 21:36): "N01-08 bị giới hạn bởi phân quyền nên không hiện nút; N01-05 bị giới hạn bởi điều kiện nghiệp vụ nên nút hiện nhưng bị khóa và có lý do." Phần còn chưa hiểu: Ngọc tự ghi nếu có; input giả và CHƯA CHẠY giữ rõ.
- [x] Phản hồi Lâm đúng bản thật, tác giả tự sửa: L04 dự thảo nhận 21:40, Ngọc trả lời 8 đề xuất trong r02 (gửi Lâm 21:44). Lâm xác nhận bằng tin nhắn tự gửi (Ngọc nhận 21:56): đồng ý 8/8 ca trên r02, giờ xác nhận Lâm ghi 21:47, Q-N01-1…6 vẫn chờ Linh. Giới hạn: 3 bản file L04 (21:40, 21:50, 21:55) do ChatGPT soạn, mục "Xác nhận của Lâm" trong file vẫn trống; xác nhận hiện có là qua tin nhắn.
- Tình trạng tài liệu tự ghi khi có căn cứ: 8 ca ĐÃ ĐỐI CHIẾU (r02), LÂM ĐỒNG Ý r02 qua tin nhắn (nhận 21:56), CẦN LÀM RÕ Q-N01-1…6, CHƯA CHẠY
- Thời điểm bàn giao Linh / file-phiên bản thực gửi: r02 + Q-N01-1…6 đã gửi Linh — Ngọc xác nhận 29/10/2026 21:45. Chưa phải bàn giao cuối: còn chờ Lâm rà r02 và Linh trả lời câu hỏi. Phần tuần 5 của Ngọc đã gửi Linh — Ngọc xác nhận 06/11/2026 08:30.
- Linh xem/nhận xét khi thuận tiện; chưa phải nghiệm thu nghiệp vụ: CHƯA KIỂM

**Tự kiểm r03 (chạy trên demo):**

- [x] Ngọc đã xem ảnh từng bước trong `chay-demo-2026-11-03/anh/` và đồng ý với kết quả ĐÚNG/LỖI/CHƯA KẾT LUẬN — Ngọc tự ghi "đồng ý với kết quả" (03/11/2026).
- [x] Ngọc tự chạy lại bằng tay ít nhất 2 ca (đề xuất N01-05 và N01-01, là hai ca có bước LỖI) trên cùng bản demo, ghi thời điểm thật — Ngọc chạy tay N01-01 lúc 11:11 và N01-05 lúc 11:13 ngày 03/11/2026 trên demo `127.0.0.1:5175`; Ngọc không báo bước nào khác kết quả máy. (Ô gốc Ngọc ghi "N01-01" hai lần; ca lúc 11:13 sửa thành N01-05 theo lời Ngọc: "chạy tay N01-01 và N01-05".)
- [x] Gửi Linh Q-N01-7, Q-N01-8 kèm ảnh N01-05/B4.png, N01-01/B4.png — Ngọc xác nhận đã gửi phần Ngọc cho Linh lúc 06/11/2026 08:30 (chưa ghi riêng việc có kèm hai ảnh không).
- [ ] Chưa làm: chạy trên tablet/điện thoại thật; chạy với backend thật. Hai việc này chưa được giao và chưa có môi trường.
- Phần đã làm / chưa làm / bước kế: Đã có 8 ca + 6 câu hỏi; r01 (nháp) đã gửi Lâm 21:06; Ngọc tự đối chiếu xong 8/8 ca lúc 21:36, lưu r02. Đã nhận L04 dự thảo 21:40 và trả lời 8 đề xuất (L04-01…08) trong bảng góp ý. r02 đã gửi Lâm 21:44; Lâm đồng ý 8/8 ca qua tin nhắn (nhận 21:56). Bước kế: chờ Linh trả lời Q-N01-1…8 (Q-N01-1…6 đã gửi 29/10/2026 21:45; Q-N01-7/8 đã gửi 06/11/2026 08:30) rồi bàn giao cuối.
