# Biên bản test 4 màn POS — chế độ mock, 29/10/2026

**Phạm vi:** test lại 4 màn POS chính (Sơ đồ bàn, Gọi món, Thanh toán, Mang đi) theo các ca N01, kiểm hiển thị trên các cỡ màn phổ biến. Chỉ ghi lỗi, **không sửa code**.

**Lưu ý:** việc này nằm ngoài gói tuần 4. Gói tuần 4 không giao chạy app; lần chạy này theo giao việc mới, đã được người làm xác nhận ngày 29/10/2026.

## 1. Môi trường thật đã dùng

| Mục | Giá trị |
| --- | --- |
| Mã nguồn | Thư mục `pos-cafe-main/pos-cafe-main` trên máy. **Không có lịch sử git** nên không xác định được PR/commit nào; kết quả chỉ đúng cho bản code trong thư mục này. |
| Chạy app | `vite` dev server, `VITE_DATA_MODE=mock`, Supabase để trống. Không backend thật, không dữ liệu khách thật. |
| Node | 24.16.0 (bản portable, cùng phiên bản CI dự án), `npm ci` theo lockfile. |
| Trình duyệt | Chromium của Playwright 1.60, **giả lập** kích thước màn hình (có bật chạm cho tablet/điện thoại). Không phải thiết bị thật. |
| Tài khoản | Tài khoản demo của chế độ mock: cửa hàng `0001-X8F3QA`; Thu ngân, Phục vụ. |
| Người/công cụ chạy | AI (Claude Code) điều khiển trình duyệt bằng script và xem ảnh chụp từng bước. Script ở [script/](script/), ảnh ở [anh/](anh/). |

> Đây là kiểm thử khám phá có script trên trình duyệt giả lập. Phần **chạm tay trên thiết bị thật** chưa làm — xem mục 5.

## 2. Kết quả chức năng theo ca N01

Màn laptop 1366×768, vai Thu ngân (trừ ca quyền). Dữ liệu mock khác input minh họa trong N01, nên số tiền dưới đây là số thật của dữ liệu mock.

| Ca N01 | Kết quả | Điều đã quan sát | Ảnh |
| --- | --- | --- | --- |
| N01-01 Sơ đồ bàn | **ĐẠT** | 8 bàn khu Tầng trệt; bàn có đơn hiện tổng (B02 125K, B05 86K). Bộ lọc "Đang phục vụ" bật được. Bấm vật trang trí không mở đơn. Bấm bàn trống B01 mở "Gọi món — Bàn B01 · Đơn mới". | F1-1, F1-2, F1-4 |
| N01-02 Gọi món / tùy chọn | **ĐẠT một phần** | Americano thêm thẳng vào giỏ. Cà phê sữa mở popup; đóng popup không đổi giỏ. Thêm Size L: 36.000đ, tổng 71.000đ; tăng lên 3 ly: 108.000đ, tổng 143.000đ. **Không kiểm được "nhóm bắt buộc chưa chọn"**: dữ liệu mock không có nhóm bắt buộc, nút "Thêm vào đơn" luôn bật. | F2-2, F2-4 |
| N01-03 Đóng khi còn nháp | **ĐẠT** (phần đã chạy) | Hộp "Bỏ đơn chưa gửi? Các món vừa chọn sẽ không được lưu." với hai nút **"Tiếp tục chỉnh sửa"** / **"Bỏ đơn"**. "Tiếp tục chỉnh sửa" giữ nguyên giỏ. Chưa bấm thử "Bỏ đơn". | F2-6 |
| N01-04 Trả đủ tiền mặt | **ĐẠT** | Mặc định chọn tất cả, phải trả = tổng. Thẻ/Chuyển khoản/QR hiện "Chưa bật" và bị khóa. Nút nhanh: Đúng tiền = 143.000, +20k = 163.000, +50k = 193.000, 200k, 500k — đúng R04. Khách đưa 200.000 cho phần còn 107.000 → trả lại 93.000. Trả xong: drawer đóng, bàn về trống. | F3-1, F3-3, F3-10 |
| N01-05 Thiếu tiền / không chọn món | **ĐẠT** | Nhập 142.999 cho đơn 143.000 → "thiếu 1", nút thanh toán khóa. Gõ 10 chữ số → giữ 9 chữ số (123456789). Bỏ chọn tất cả → phải trả 0, nút khóa. | F3-4, F3-6 |
| N01-06 Trả một phần | **ĐẠT** | Dòng Cà phê sữa L ×3: tick → 1/3 (36.000); + → 2/3; + → 3/3; + → 1/3 — xoay vòng đúng R03. Trả 1 ly → hóa đơn tách 36.000đ; drawer vẫn mở, bỏ chọn hết, phải trả 0, không tự chọn lại. Phần còn lại 107.000đ trả tiếp được. | F3-7, F3-8 |
| N01-07 Mang đi | **ĐẠT** phần chính, có 1 điểm cần làm rõ | Tạo đơn mang đi, gửi Americano → số bàn đang phục vụ không đổi (4 → 4). Thanh toán xong đơn rời tab "Đang mở" và có trong Lịch sử đơn (loại "Mang đi", Đã thanh toán). Xem UI-03. | F4-1, F4-5, F4-7 |
| N01-08 Thiếu quyền (Phục vụ) | **ĐẠT** | Thanh điều hướng chỉ có: Sơ đồ bàn, Tra cứu thao tác, Bán mang đi, Khoá — không có Lịch sử/Báo cáo/Thực đơn/Nhân viên/Cài đặt. Mở đơn B02: không có nút Thanh toán hay Hủy đơn; gọi thêm và gửi món được. Khi đơn chưa có thay đổi, footer chỉ có "Đóng", không có nút chính. Màn Mang đi chỉ có "Mở đơn", không có "Thanh toán". | F5-1, F5-3, F5-5 |

Không ghi nhận lỗi console trong các lần chạy chức năng.

## 3. Kết quả hiển thị trên các thiết bị

Mỗi cỡ màn hình kiểm 6 màn: sơ đồ, popup tùy chọn, giỏ hàng, phiếu bếp, thanh toán, mang đi. Đo tự động 3 điểm: trang có tràn ngang/dọc không, nút có bị cắt ngoài màn không, nút nào nhỏ hơn 44px; sau đó xem ảnh bằng mắt.

| Thiết bị giả lập | Kích thước | Tràn trang | Nút bị cắt | Ghi chú |
| --- | --- | --- | --- | --- |
| Desktop Full HD | 1920×1080 | Không | Không | Danh sách đơn cố định bên phải. |
| Laptop | 1366×768 | Không | Không | |
| Laptop nhỏ (mốc 1280) | 1280×720 | Không | Không | Danh sách đơn cố định — đúng B01-07 (≥1280). |
| Mốc 1279 | 1279×720 | Không | Không | Danh sách đơn chuyển thành nút "Đơn đang mở (3)" — đúng B01-07 (<1280). |
| iPad Air ngang | 1180×820 | Không | Không | |
| iPad ngang | 1024×768 | Không | Không | Hàng phím 0/xóa nằm dưới mép, phải cuộn (UI-05). |
| Mốc sidebar | 981×600 / 980×600 | Không | Không | Sidebar thu gọn ở 980. |
| Điện thoại ngang | 844×390 | Không | Không | Khung tiền mặt nằm dưới danh sách món, phải cuộn (UI-05). |
| Điện thoại ngang nhỏ | 740×360 | Không | Không | |
| Tối thiểu theo spec | 568×320 | Không | Không | Màn Mang đi tràn trong khung (UI-01); toast che bàn (UI-04). |
| iPad dọc | 768×1024 | — | — | Màn đăng nhập hiện bình thường. |
| Điện thoại dọc | 390×844 | — | — | Sau đăng nhập hiện "Xoay ngang thiết bị"; xoay ngang thì vào sơ đồ — đúng NFR-04. |

Số liệu chi tiết: [script/responsive-report.json](script/responsive-report.json).

## 4. Danh sách lỗi và điểm cần làm rõ

Mức độ là đề xuất của người test, chưa được Linh xác nhận. Không có lỗi nào làm hỏng luồng bán hàng chính.

| ID | Mức | Màn / kích thước | Mô tả và cách tái hiện | Mong đợi / căn cứ | Ảnh |
| --- | --- | --- | --- | --- | --- |
| UI-01 | Trung bình | Bán mang đi, 568×320 | Đăng nhập Thu ngân → "Bán mang đi". Cột "Chi tiết đơn" kéo tới x=638px trên màn rộng 568px; khung có thanh cuộn ngang, phần số đơn/giá bị khuất bên phải. Từ 740px trở lên hiển thị đủ. | Dùng được ở viewport ngang ≥568×320 (S05 B01-07, S11 NFR-04). Màn Mang đi chưa có đợt remake riêng (S10 L017), nên cần Linh xác nhận tiêu chí áp dụng. | R-phone-568-land-takeaway |
| UI-02 | Thấp | Bán mang đi, mọi cỡ | Nút nhỏ hơn 44px: chip "Đang mở / Đã thanh toán / Hôm nay" cao 24px; "Mở đơn", "Thanh toán" trên thẻ đơn cao 26px; nút trong chi tiết đơn cao 31px; "Tạo đơn mang đi", "Đóng" cao 37px. Khó bấm trên màn cảm ứng. | Target ≥44×44 (S05 B01-08 cho B01). Cần làm rõ có áp cho màn Mang đi không. | R-laptop-1366-takeaway |
| UI-03 | Cần làm rõ | Bán mang đi, tab "Đã thanh toán" | Thanh toán xong đơn mang đi → bấm tab "Đã thanh toán": danh sách 0 đơn, nhưng đơn có trong Lịch sử đơn. Câu báo trống ghi "Chưa có đơn mang đi **đang mở**" dù đang ở tab Đã thanh toán. | S03 L023–L026: đơn mang đi đã thanh toán chỉ còn xem ở Lịch sử. Nếu đúng spec thì tab này gây hiểu nhầm; nếu tab có chủ đích thì đang không hiện dữ liệu. Câu báo trống sai ngữ cảnh. | F4-6 |
| UI-04 | Thấp | Sơ đồ bàn, ngay sau đăng nhập | Toast "Đã ghép thiết bị" và "Xin chào …" che góc dưới phải sơ đồ khoảng 4 giây; ở 568×320 che lên bàn. | Không che thao tác chính; có thể dời vị trí hoặc rút ngắn. | R-phone-568-land-floor, R-bp-1279-floor |
| UI-05 | Quan sát | Thanh toán, ≤1024 rộng | Ở 1024×768 và 981×600, hàng phím 0/xóa nằm dưới mép khung; ở 844×390, ô nhập tiền và bàn phím nằm dưới danh sách món. **Cuộn tới được** ở mọi kích thước đã thử. | B01-07 cho phép vùng cuộn riêng; ghi lại để Linh cân nhắc trải nghiệm thu ngân. | R-ipad-land-payment, R-phone-740-land-payment |
| UI-06 | Cần làm rõ | Sơ đồ bàn | B03 và B08 ở trạng thái "đang phục vụ" nhưng không có tổng tiền (không có đơn mở trong dữ liệu mock). | S02 L025: bàn đang phục vụ hiện số đơn + tổng tiền; S05 B01-04: occupied = status occupied **hoặc** có đơn mở. Cần làm rõ cách hiển thị khi bàn occupied mà không có đơn. | R-bp-1279-floor |
| UI-07 | Cần làm rõ | Phiếu bếp / Lịch sử | Đơn mang đi vừa tạo: phiếu bếp ghi số đơn 27, Lịch sử hiện "#2". Có thể là hai hệ số khác nhau (số đơn và số bill theo thứ tự thanh toán, S04 L047). | Cần xác nhận để nhân viên không nhầm khi tra đơn. | F4-7 |

## 5. Phần chưa kiểm / không kiểm được

- **Thiết bị thật:** chạm tay, bàn phím ảo, xoay máy thật, zoom — cần người test trên máy thật (gợi ý ở mục 6).
- **N01-02 nhóm bắt buộc:** dữ liệu mock không có nhóm tùy chọn bắt buộc.
- **N01-03 nút "Bỏ đơn":** chưa bấm thử.
- **Q-N01-1** (đơn mang đi rỗng có hiện trong danh sách không): chưa quan sát, vì script gửi món trước rồi mới mở danh sách.
- **Đơn bị máy khác cập nhật/đóng, mất quyền giữa phiên, backend Supabase thật:** không thuộc chế độ mock đã chạy.
- **PR nào đã merge:** không xác định được vì thư mục code không có git.

## 6. Hướng dẫn test tay trên thiết bị thật

1. Trên máy tính, trong `pos-cafe-main/pos-cafe-main`, chạy app cho máy khác trong cùng Wi-Fi truy cập:
   `VITE_DATA_MODE=mock npx vite --host 0.0.0.0 --port 5175`
   (cần Node 24; mở cổng 5175 nếu tường lửa chặn).
2. Trên điện thoại/tablet mở `http://<IP máy tính>:5175`, ghép quán `0001-X8F3QA`, đăng nhập Thu ngân.
3. Đi lại 8 ca ở mục 2, kiểm thêm: bấm chạm có trúng nút nhỏ (UI-02) không, bàn phím ảo có che ô nhập không, xoay dọc/ngang.
4. Ghi vào bảng: thiết bị (hãng, model, trình duyệt, kích thước), ca, kết quả, ảnh chụp màn hình.

| Thiết bị / trình duyệt | Kích thước | Ca đã đi | Kết quả | Lỗi mới / ghi chú |
| --- | --- | --- | --- | --- |
| CHƯA CHẠY | | | | |
