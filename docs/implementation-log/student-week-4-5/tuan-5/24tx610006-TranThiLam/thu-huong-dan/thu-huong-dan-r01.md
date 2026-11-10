# Thử làm theo hướng dẫn — gọi món và thanh toán

> Cập nhật 06/11/2026: **đã thực hiện mới bước 4–11 bằng Playwright trực tiếp lúc 14:39:19.052–14:40:35.981 (UTC+7)**; ảnh/text/JSON và giờ từng bước ở [phiếu kiểm thử mới](kiem-thu-2026-11-06.md). Tổng thu 145.000đ/2 đơn, B01 trống; đã tái hiện lọc Trống làm ẩn bàn sau gửi và số Lịch sử #2/#3 khác hóa đơn #27/#28. Có thêm lượt đối chiếu 14:29:06–14:29:39 của Claude Code; server chạy từ 14:03, `src/` khớp main `052a7d1`. **Lâm ghi đã tự làm bằng tay lúc 14:23–14:49 ngày 06/11/2026, chỗ thấy khác chưa ghi; việc gửi Linh chờ Lâm xác nhận.** Xem [bản chuẩn bị gửi Linh](noi-dung-gui-linh-2026-11-06.md). Giữ nguyên 20 đề xuất r02 của Lâm và các ô tự kiểm gốc; bản viết lại bước 4–11 bên dưới đã được bổ sung theo kết quả mới.

Trạng thái: **r02 (03/11/2026, file lưu 15:13) — LÂM ĐÃ XEM ẢNH VÀ VIẾT LẠI 20 ĐỀ XUẤT; CHƯA TỰ LÀM THEO BẰNG TAY; CHƯA GỬI LINH.** r01 (14:29): AI làm theo hướng dẫn trên bản demo dữ liệu giả, ghi chỗ thiếu bước, khó hiểu, tên nút không khớp và đề xuất cách viết. r02: Lâm xem ảnh, đồng ý phần "Thấy gì" và viết lại đề xuất bằng lời của mình (mục [Đề xuất cách viết của Lâm (r02)](#đề-xuất-cách-viết-của-lâm-r02)). Trạng thái mới nhất xem ghi chú 06/11 ở trên.

- **Hướng dẫn đã dùng:** `docs/demo-runbook.md`, mục "Flow Demo Chính" (dòng L10–L20), nhánh `docs` commit `9916522` (29/10/2026). Đây là tài liệu duy nhất trong docs mô tả từng bước gọi món và thanh toán. `docs/README.md` L34 chỉ "Demo → Runbook"; `docs/test-strategy.md` L47 ghi đổi hành trình người dùng thì phải sửa runbook trước. Chưa chắc đây đúng là "hướng dẫn hiện có" trong kế hoạch tuần 5 → câu hỏi H-Q1.
- **Phạm vi:** bước 4–6 (gọi món) và 7–11 (thanh toán). Bước 1–3 chỉ làm để vào được app, vẫn ghi lại chỗ khó.
- **Môi trường:** bản demo chạy trên máy, dữ liệu giả (`VITE_DATA_MODE=mock`), `src/` giống main `052a7d1`; Chrome điều khiển tự động qua Playwright, màn 1366×768. Không backend thật, không thiết bị thật.
- **Thời gian chạy (03/11/2026):** lần 1 lúc 14:23–14:28 dừng ở bước 5 vì script chưa bấm sang danh mục "Trà & trà sữa" (lỗi script, không phải app). Đã sửa script, lần 2 lúc 14:28:51–14:29:10 đi hết bước 1–11. Kết quả và 23 ảnh dưới đây là của lần 2.
- **Vai đã dùng:** Chủ quán (vì bước 8 và 11 cần mở Báo cáo). Thêm một bước phụ đăng nhập Thu ngân để xem có nút Báo cáo không.

## Kết quả nhanh

| Bước | Làm theo được không | Góp ý |
| --- | --- | --- |
| 1–3 Vào app | Được, nhưng phải đoán tên nút và chọn vai nào | HD-01, HD-02 |
| 4 Mở bàn trống | Được | HD-03 |
| 5 Gọi món | Được, nhưng thiếu 2 bước (đổi danh mục món; đóng phiếu gửi bếp) | HD-04, HD-05, HD-06, HD-07 |
| 6 Về sơ đồ | Được | HD-08 |
| 7 Mở thanh toán | Được | HD-09 |
| 8 Trả một phần | Được phần tách đơn; **không mở được Báo cáo khi màn thanh toán đang mở** | HD-10…HD-14 |
| 9 Trả phần còn lại | Được, nhưng **khác mô tả**: sau khi đi xem Báo cáo rồi quay lại, các món đã được chọn sẵn chứ không "rỗng" | HD-14, HD-15 |
| 10 Hóa đơn, bàn trống | Được | HD-16 |
| 11 Lịch sử, báo cáo | Được, nhưng **số đơn trong Lịch sử (#2, #3) khác số in trên hóa đơn (#27, #28)** | HD-17 |
| Chung | Nhiều từ tiếng Anh; không có hình minh họa; ghi chú đầu trang còn nhắc main cũ | HD-18, HD-19, HD-20 |

## Chi tiết từng bước

Ảnh nằm trong [../chay-demo-2026-11-03/anh/](../chay-demo-2026-11-03/anh/).

| Bước | Hướng dẫn ghi (nguyên văn) | Đã làm trên demo | Thấy gì | Ảnh |
| --- | --- | --- | --- | --- |
| 1–3 | "Mở app ở landscape. Nếu chưa paired, tạo store mới hoặc ghép Store Key. Vào passcode, chọn nhân viên có quyền cần cho demo và nhập PIN." | Bấm **Đã có quán**, nhập Store Key demo, bấm **Ghép thiết bị**; chọn **Chủ quán**, nhập PIN demo, bấm **Mở khoá**. | Màn đầu có 2 nút: **Đã có quán** ("Nhập Store Key để ghép máy vào quán hiện có") và **Tạo quán mới**. Màn chọn nhân viên có 5 người: Chủ quán, Quản lý, Thu ngân, Phục vụ, Nhân viên chỉ xem. Vào màn **Sơ đồ bàn**. | B01-mo-dau, B03-chon-nhan-vien |
| 4 | "Ở floor view, chọn khu/tầng, mở một bàn trống." | Khu **Tầng trệt** đã được chọn sẵn; bấm bàn B01. | Dải khu: **Tầng trệt**, **Lầu 1**; nút lọc **Tất cả / Trống** (chấm xanh) **/ Đang phục vụ** (chấm cam). Bàn trống (B01, B04, B06, B07) viền xanh, chỉ ghi tên. Bàn đang phục vụ viền cam, thường ghi thêm số tiền (B02 125K), nhưng B03 đang phục vụ mà chỉ ghi tên (không có đơn mở). Khung phải **Đơn đang mở** có nút **Mở đơn hàng →**. Mở màn **Gọi món — Bàn B01 · Đơn mới · Chưa gửi**, nút **Đóng**, **In/Gửi đơn**. | B04a-so-do, B04b-man-goi-mon |
| 5 | "Tạo order dine-in: chọn món, option/topping, chỉnh số lượng/ghi chú, gửi đơn." | Cà phê sữa → chọn Size M, Ít đá → **Thêm vào đơn**. Bấm danh mục **Trà & trà sữa** → Trà sữa truyền thống → topping Trân châu → **Thêm vào đơn**. Về **Cà phê** → Americano, bấm **+** thành 2. Bấm **Ghi chú** trên dòng Cà phê sữa, gõ "ít ngọt". Bấm **In/Gửi đơn**. | Món chia theo **Danh mục món** ở cột trái; thẻ món ghi "Có tùy chọn" hoặc "Chọn để thêm vào đơn", nút **+ Thêm**. Món có tùy chọn mở hộp chọn (Size, Đá, Topping…) với nút **Thêm vào đơn**; Americano vào giỏ ngay. Mỗi dòng giỏ có **−**/**+** và **Ghi chú**; ô ghi chú không có nút lưu. Tổng 145.000đ. Bấm **In/Gửi đơn** thì bật cửa sổ **Phiếu gửi bếp** (đơn #27, có ghi chú "ít ngọt"), nút **Đóng** và **In**. Hướng dẫn không nhắc cửa sổ này. | B05a-hop-tuy-chon, B05b-topping, B05c-gio-truoc-khi-gui, B05d-phieu-gui-bep |
| 6 | "Quay lại floor, thấy bàn chuyển sang đang phục vụ." | Bấm **Đóng** trên phiếu gửi bếp. | App tự về Sơ đồ bàn, không cần bấm gì thêm. B01 ghi "B01 145K"; khung **Đơn đang mở** có B01 #27. | B06-ban-dang-phuc-vu |
| 7 | "Mở lại order, chuyển sang payment." | Bấm B01, bấm **Thanh toán** ở cuối giỏ. | Màn đơn có **Đóng**, **Hủy đơn mở**, **Thanh toán** (đầu màn) và **Thanh toán** (cuối giỏ). Mở màn **Thanh toán đơn hàng — Bàn B01 · Đơn #27 · 4 món**: **Chọn tất cả** bật sẵn, phải trả 145.000đ, ô **Tiền khách đưa** điền sẵn 145.000, ô **In hóa đơn sau khi thanh toán** bật sẵn. Nút cuối màn: **Hoàn tất thanh toán (145.000 ₫)** và **Quay lại**. | B07a-mo-lai-don, B07b-man-thanh-toan |
| 8 | "Demo instant pay (điểm nhấn): bỏ `Chọn tất cả`, tick 1-2 món (chỉnh số lượng bằng nút `+`), hoàn tất → preview bill riêng mở khi có initial grant và bật checkbox in (kế thừa số đơn gốc), đơn gốc còn lại trên bàn với số mới; mở report thấy doanh thu vào NGAY." | Bỏ **Chọn tất cả**; tick Americano (1/2), bấm **+** (2/2); bấm **Thanh toán món đã chọn (70.000 ₫)**; bấm **Đóng** trên hóa đơn; thử bấm **Báo cáo**. | Tiền khách đưa tự thành 70.000, không cần nhập. Nút cuối màn đổi tên thành **Thanh toán món đã chọn (…)**, không phải "Hoàn tất". Bật cửa sổ **Hoá đơn thanh toán** đơn #27, 70.000đ (giữ số đơn cũ). Màn thanh toán vẫn mở: **Đơn #28 · 2 món**, tổng 75.000đ, 0 món đã chọn; thông báo "Đã tách và thanh toán đơn #27 (70.000 ₫). Bàn còn 75.000 ₫." **Không bấm được Báo cáo vì màn thanh toán che thanh trái**; phải đóng màn thanh toán (bàn B01 còn 75K) rồi mới mở **Báo cáo**: "Doanh thu hôm nay 70.000 ₫ · 1 đơn". | B08a-chon-mot-phan, B08b-hoa-don-tach, B08c-sau-khi-tach, B08d-bao-cao |
| 9 | "Chủ động chọn phần còn lại sau split (selection lúc này rỗng), rồi nhập tiền khách đưa, kiểm tra trạng thái thiếu/đủ tiền, hoàn tất thanh toán." | Mở lại B01 → **Thanh toán**. Xóa ô tiền bằng nút ⌫, nhập 50000; xóa, nhập 100000; bấm **Hoàn tất thanh toán (75.000 ₫)**. | Vào lại thì **Chọn tất cả đang bật**, 75.000đ đã chọn — không "rỗng" như hướng dẫn, vì phải rời màn ở bước 8. Ô tiền điền sẵn 75.000; muốn nhập số khác phải xóa bằng nút ⌫ (chỉ có biểu tượng, ở hàng cuối bàn phím số, màn 1366×768 phải cuộn mới thấy). Thiếu: dòng "Còn thiếu 25.000 ₫.", nút hoàn tất bị khóa, hàng nút nhanh biến mất. Đủ: "Tiền trả lại khách 25.000 ₫", nút bấm được. | B09a-vao-lai-thanh-toan, B09b-thieu-tien, B09c-du-tien |
| 10 | "Xem receipt preview, quay lại floor thấy bàn trống." | Bấm **Đóng** trên hóa đơn. | Cửa sổ **Hoá đơn thanh toán** đơn #28, 75.000đ, khách đưa 100.000đ, trả lại 25.000đ; nút **Đóng**, **In**. Đóng xong app tự về Sơ đồ bàn, thông báo "Đã thanh toán. Bàn đã trống."; B01 chỉ còn tên bàn. | B10a-hoa-don, B10b-ban-trong |
| 11 | "Mở report/history: 2 đơn độc lập từ cùng một bàn, số đơn tăng theo thứ tự thanh toán." | Bấm **Lịch sử đơn**, rồi **Báo cáo**. | Lịch sử có 2 đơn bàn B01, đều **Đã thanh toán**: **#2** 70.000đ và **#3** 75.000đ. Hai số này **khác** số in trên hóa đơn (#27, #28). Báo cáo: "Doanh thu hôm nay 145.000 ₫ · 2 đơn", không cho biết đơn của bàn nào. | B11a-lich-su, B11b-bao-cao |
| Phụ | (Hướng dẫn không ghi) | Khóa máy, đăng nhập **Thu ngân**. | Thanh trái của Thu ngân: Sơ đồ bàn, Tra cứu thao tác, Bán mang đi, Lịch sử đơn, Khoá — **không có Báo cáo**. Nếu bước 3 chọn Thu ngân thì không làm được phần "mở report" ở bước 8 và 11. Chưa thử vai Quản lý. | PHU-thu-ngan |

## Góp ý cho hướng dẫn

Loại: **Thiếu bước** / **Khó hiểu** / **Tên nút không khớp** / **Hình minh họa**. Cột cuối là cách viết AI thử ở r01; bản Lâm viết lại nằm ở mục [Đề xuất cách viết của Lâm (r02)](#đề-xuất-cách-viết-của-lâm-r02).

| ID | Bước | Loại | Vấn đề | Đề xuất cách viết (AI, r01) |
| --- | --- | --- | --- | --- |
| HD-01 | 2 | Tên nút không khớp | Hướng dẫn ghi "paired", "tạo store mới", "ghép Store Key". App ghi **Đã có quán**, **Tạo quán mới**, rồi **Ghép thiết bị**. | "Nếu máy chưa vào quán nào: bấm **Đã có quán**, nhập Store Key do người phụ trách demo cung cấp, bấm **Ghép thiết bị**. Muốn tạo quán mới thì bấm **Tạo quán mới**." |
| HD-02 | 3 | Thiếu bước | "Chọn nhân viên có quyền cần cho demo" không nói chọn ai, cũng không nói lấy PIN ở đâu. Bước 8 và 11 cần **Báo cáo**: Chủ quán có, Thu ngân không có (đã thử). Nút mở là **Mở khoá**. | "Chọn **Chủ quán** (đủ quyền cho các bước dưới), nhập PIN do người phụ trách demo cung cấp, bấm **Mở khoá**." |
| HD-03 | 4 | Khó hiểu | "Floor view", "khu/tầng" là chữ khác với app. Trên bàn không có chữ "trống"; chỉ phân biệt bằng màu viền. Không thể dựa vào "có số tiền hay không", vì B03 đang phục vụ mà cũng chỉ ghi tên. | "Ở màn **Sơ đồ bàn**, bấm tên khu ở dải trên (ví dụ **Tầng trệt**). Bấm nút **Trống** ở góc trên để chỉ hiện bàn trống (bàn viền xanh), rồi bấm một bàn (ví dụ **B01**)." |
| HD-04 | 5 | Thiếu bước | Món được chia theo danh mục; món có topping (Trà sữa truyền thống) nằm ở **Trà & trà sữa**, không hiện ở danh mục đầu. Hướng dẫn không nói phải đổi danh mục hay tìm món. | "Chọn danh mục ở cột trái (ví dụ **Cà phê**, **Trà & trà sữa**) hoặc gõ tên vào ô **Tìm món**, rồi bấm **+ Thêm** trên thẻ món." |
| HD-05 | 5 | Khó hiểu | "Option/topping" không nói chuyện gì xảy ra. Thực tế món ghi "Có tùy chọn" sẽ mở hộp chọn, phải bấm **Thêm vào đơn**; món khác vào giỏ ngay. | "Món ghi 'Có tùy chọn' sẽ mở một hộp: chọn Size, Đá, Topping… rồi bấm **Thêm vào đơn**. Món không có tùy chọn vào **Giỏ hàng** ngay." |
| HD-06 | 5 | Khó hiểu | "Chỉnh số lượng/ghi chú" không nói chỉnh ở đâu. Thực tế ở **Giỏ hàng** bên phải, mỗi dòng có **−**/**+** và **Ghi chú**; gõ xong không cần bấm lưu. | "Trong **Giỏ hàng**: bấm **−**/**+** để đổi số lượng; bấm **Ghi chú** rồi gõ (ví dụ 'ít ngọt'), không cần bấm lưu." |
| HD-07 | 5 | Tên nút không khớp + thiếu bước | Hướng dẫn ghi "gửi đơn"; nút thật là **In/Gửi đơn**. Bấm xong bật cửa sổ **Phiếu gửi bếp** phải đóng, hướng dẫn không nhắc. | "Bấm **In/Gửi đơn**. Cửa sổ **Phiếu gửi bếp** hiện ra; bấm **Đóng** (hoặc **In** nếu có máy in)." |
| HD-08 | 6 | Khó hiểu (nhẹ) | "Quay lại floor" như phải tự bấm, nhưng app tự về sơ đồ. Chưa nói nhìn gì để biết bàn "đang phục vụ". | "App tự về **Sơ đồ bàn**. Kiểm tra: bàn vừa gọi có thêm số tiền (ví dụ **B01 145K**) và có trong khung **Đơn đang mở** bên phải." |
| HD-09 | 7 | Tên nút không khớp | "Chuyển sang payment" → nút **Thanh toán**; màn mở ra tên **Thanh toán đơn hàng**. Có thể mở đơn từ khung **Đơn đang mở** (**Mở đơn hàng →**), hướng dẫn không nói. | "Bấm lại bàn đó (hoặc **Mở đơn hàng** ở khung **Đơn đang mở**), rồi bấm **Thanh toán**. Màn **Thanh toán đơn hàng** mở, mặc định đã chọn tất cả món." |
| HD-10 | 8 | Khó hiểu | "Instant pay", "split" là từ tiếng Anh, người mới không biết nghĩa. | Đổi tiêu đề bước thành "**Trả trước một phần món (tách đơn)**: khách trả trước vài món, phần còn lại vẫn để trên bàn." |
| HD-11 | 8 | Khó hiểu | "Chỉnh số lượng bằng nút +" không giải thích ô **1/2** (đã chọn / số trong đơn), và khi đã chọn đủ thì bấm **+** sẽ quay về 1 (đã thấy ở N01-06 của Ngọc). | "Đánh dấu món muốn trả. Ô cạnh nút **+** ghi số đã chọn / số trong đơn (ví dụ **1/2**). Bấm **+** để chọn thêm; khi đã đủ, bấm tiếp sẽ quay về 1." |
| HD-12 | 8 | Tên nút không khớp | "Hoàn tất" → khi chỉ chọn một phần, nút tên **Thanh toán món đã chọn (…)**; khi chọn hết mới là **Hoàn tất thanh toán (…)**. Tiền khách đưa tự điền đúng số cần trả. | "Ô **Tiền khách đưa** tự điền đúng số cần trả. Bấm **Thanh toán món đã chọn (…)**." |
| HD-13 | 8 | Khó hiểu | "Preview bill riêng mở khi có initial grant và bật checkbox in (kế thừa số đơn gốc), đơn gốc còn lại trên bàn với số mới" quá kỹ thuật ("initial grant", "checkbox in"). Tên ô thật là **In hóa đơn sau khi thanh toán**, bật sẵn. | "Nếu ô **In hóa đơn sau khi thanh toán** đang bật (mặc định bật), cửa sổ **Hoá đơn thanh toán** hiện ra cho phần vừa trả, mang số đơn cũ (ví dụ **#27**); bấm **Đóng**. Màn thanh toán vẫn mở cho phần còn lại, mang số đơn mới (ví dụ **Đơn #28**)." |
| HD-14 | 8 → 9 | Thiếu bước + thứ tự | "Mở report thấy doanh thu vào NGAY" nằm giữa bước 8, nhưng khi màn thanh toán mở thì không bấm được **Báo cáo**. Phải đóng màn thanh toán, xem Báo cáo, rồi mở lại bàn → **Thanh toán**. Khi đó **Chọn tất cả** đã bật sẵn, trái với bước 9 ghi "selection lúc này rỗng". | Dời "xem Báo cáo" xuống bước 11. Bước 9 viết: "Vẫn ở màn thanh toán, lúc này chưa món nào được chọn. Bấm **Chọn tất cả** để chọn phần còn lại." Nếu Linh muốn giữ chỗ cũ thì phải ghi cách quay lại (câu hỏi H-Q3). |
| HD-15 | 9 | Thiếu bước + khó hiểu | "Nhập tiền khách đưa" không nói ô đã điền sẵn đúng số tiền, phải xóa mới nhập số khác. Nút xóa chỉ có biểu tượng ⌫ ở hàng cuối bàn phím số; màn 1366×768 phải cuộn mới thấy. Hướng dẫn không nói "thiếu/đủ" trông thế nào. | "Ô **Tiền khách đưa** đã điền đúng số phải trả. Muốn nhập số khác: bấm nút ⌫ ở góc dưới bàn phím số (có thể phải cuộn) để xóa, rồi bấm số; hoặc dùng nút nhanh **Đúng tiền / +20k / +50k / 200k / 500k**. Nhập thiếu sẽ thấy dòng **Còn thiếu …** và nút hoàn tất bị khóa; nhập đủ sẽ thấy **Tiền trả lại khách …**. Bấm **Hoàn tất thanh toán (…)**." |
| HD-16 | 10 | Tên nút không khớp | "Receipt preview" → cửa sổ **Hoá đơn thanh toán**, nút **Đóng**, **In**. "Quay lại floor" → app tự về. | "Cửa sổ **Hoá đơn thanh toán** hiện ra; bấm **Đóng**. App tự về **Sơ đồ bàn**, bàn đã trống (viền xanh, không còn số tiền)." |
| HD-17 | 11 | Khó hiểu (quan trọng) | "Số đơn tăng theo thứ tự thanh toán" không nói xem số nào. Lịch sử đơn ghi **#2** và **#3**, còn hóa đơn in **#27** và **#28**; người mới sẽ tưởng sai. `docs/screens.md` L52 có ghi "Số thứ tự hiển thị theo bộ lọc, khác số bill", nhưng runbook không nhắc. Báo cáo chỉ có tổng, không cho biết đơn thuộc bàn nào. | "Mở **Lịch sử đơn**: thấy 2 đơn của cùng bàn, đều **Đã thanh toán** (ví dụ 70.000đ và 75.000đ). Số # trong danh sách này là số thứ tự trong danh sách, không phải số in trên hóa đơn. Mở **Báo cáo**: doanh thu hôm nay tăng đúng tổng hai lần trả." (Chờ H-Q2.) |
| HD-18 | Chung | Khó hiểu | Nhiều từ tiếng Anh hoặc kỹ thuật không có trên màn hình: paired, passcode, floor view, order dine-in, option, payment, instant pay, split, selection, initial grant, checkbox, receipt preview, report, history. | Dùng đúng chữ trên màn: **Đã có quán**, màn chọn nhân viên, **Sơ đồ bàn**, **Gọi món — Bàn …**, tùy chọn, **Thanh toán**, trả một phần / tách đơn, món đã chọn, **In hóa đơn sau khi thanh toán**, **Hoá đơn thanh toán**, **Báo cáo**, **Lịch sử đơn**. |
| HD-19 | Chung | Hình minh họa | Runbook không có hình minh họa nên không có hình nào để so. `docs/screenshots/current/README.md` liệt kê 33 tên ảnh (ví dụ `08-order-drawer-new-draft.png`, `11-payment-drawer-normal-cash.png`, `29-payment-instant-pay-selection.png`) nhưng ghi ảnh đã bị bỏ khỏi nhánh docs và bộ ảnh 20/06/2026 không còn đúng main hiện tại. | Nếu Linh đồng ý (H-Q4), thêm 6 ảnh từ lần chạy này: B05c-gio-truoc-khi-gui, B05d-phieu-gui-bep, B07b-man-thanh-toan, B08a-chon-mot-phan, B09b-thieu-tien, B11a-lich-su. |
| HD-20 | Chung | Khó hiểu | Ghi chú đầu trang (L3) ghi "Với main711a22e" (thiếu dấu cách), trong khi `docs/README.md` L3 ghi main hiện tại là `052a7d1`. Người đọc không biết hướng dẫn còn đúng không. | Sửa thành main hiện tại và ngày kiểm lại; tách riêng ghi chú cho người chạy demo với ghi chú kỹ thuật. |

## Đề xuất cách viết của Lâm (r02)

Lâm viết lại theo lời của mình, chép nguyên văn từ phần Lâm điền ở mục tự kiểm (file lưu 03/11/2026 15:13). Đây là bản dùng để gửi Linh; cột "Đề xuất cách viết (AI, r01)" ở bảng trên giữ để đối chiếu.

| ID | Đề xuất cách viết của Lâm |
| --- | --- |
| HD-01 | Nếu chưa kết nối với quán, chọn Đã có quán, nhập Store Key được cung cấp rồi bấm Ghép thiết bị. Nếu muốn tạo quán mới thì chọn Tạo quán mới. |
| HD-02 | Ở màn hình chọn nhân viên, chọn Chủ quán để có đủ quyền thực hiện các bước demo. Sau đó nhập mã PIN và bấm Mở khoá. |
| HD-03 | Vào Sơ đồ bàn, chọn khu vực muốn thao tác, chẳng hạn Tầng trệt. Có thể bấm Trống để lọc các bàn chưa có khách, sau đó chọn bàn B01. |
| HD-04 | Khi gọi món, chọn đúng danh mục bên trái như Cà phê hoặc Trà & trà sữa. Nếu không thấy món cần tìm thì nhập tên vào ô Tìm món, sau đó bấm + Thêm. |
| HD-05 | Với món có tùy chọn, hệ thống sẽ hiện cửa sổ để chọn size, lượng đá hoặc topping. Chọn xong bấm Thêm vào đơn. Những món không có tùy chọn sẽ được thêm thẳng vào giỏ hàng. |
| HD-06 | Trong Giỏ hàng bên phải, dùng nút + hoặc − để tăng giảm số lượng. Nếu khách có yêu cầu riêng thì bấm Ghi chú và nhập nội dung, không cần bấm lưu. |
| HD-07 | Sau khi kiểm tra các món đã chọn, bấm In/Gửi đơn. Khi cửa sổ Phiếu gửi bếp xuất hiện, bấm Đóng để tiếp tục hoặc In nếu cần in phiếu. |
| HD-08 | Sau khi đóng phiếu gửi bếp, hệ thống tự quay về Sơ đồ bàn. Kiểm tra bàn vừa gọi đã chuyển sang trạng thái đang phục vụ và xuất hiện trong danh sách Đơn đang mở. |
| HD-09 | Chọn lại bàn đang phục vụ hoặc bấm Mở đơn hàng ở danh sách bên phải. Sau đó bấm Thanh toán để mở màn hình thanh toán. Hệ thống sẽ chọn sẵn toàn bộ món trong đơn. |
| HD-10 | Đổi cách ghi thành Thanh toán một phần món (tách đơn) để người đọc hiểu đây là trường hợp khách chỉ muốn thanh toán trước một số món, những món còn lại vẫn giữ trên bàn. |
| HD-11 | Bỏ chọn Chọn tất cả, sau đó đánh dấu những món khách muốn thanh toán. Nếu một món có số lượng 2, màn hình sẽ hiển thị số đã chọn trên tổng số lượng, ví dụ 1/2. Có thể bấm + để chọn thêm. |
| HD-12 | Sau khi chọn món cần trả, kiểm tra số tiền khách đưa được hệ thống điền sẵn, rồi bấm Thanh toán món đã chọn để hoàn tất phần thanh toán này. |
| HD-13 | Nếu đang bật In hóa đơn sau khi thanh toán, hệ thống sẽ hiện hóa đơn của phần vừa trả. Bấm Đóng để tiếp tục xử lý những món còn lại. Phần chưa thanh toán sẽ được chuyển sang đơn mới. |
| HD-14 | Nên chuyển bước kiểm tra doanh thu trong Báo cáo xuống cuối hướng dẫn. Vì khi đang ở màn hình thanh toán không thể mở Báo cáo trực tiếp, người dùng phải thoát ra rồi mới xem được. |
| HD-15 | Khi thanh toán phần còn lại, chọn các món cần trả. Nếu muốn thay đổi số tiền khách đưa thì xóa số tiền đã điền sẵn và nhập lại. Nhập thiếu tiền sẽ có thông báo số tiền còn thiếu và không thể hoàn tất. Nhập đủ hoặc dư thì hệ thống cho phép thanh toán và hiển thị tiền thừa nếu có. |
| HD-16 | Sau khi thanh toán xong, cửa sổ Hoá đơn thanh toán xuất hiện. Bấm Đóng, hệ thống tự quay về Sơ đồ bàn. Kiểm tra bàn vừa thanh toán đã trở lại trạng thái trống. |
| HD-17 | Vào Lịch sử đơn để kiểm tra hai phần đã thanh toán của cùng một bàn. Sau đó mở Báo cáo để kiểm tra tổng doanh thu. Cần ghi chú rõ số thứ tự trong danh sách lịch sử có thể khác số đơn in trên hóa đơn để tránh nhầm lẫn. |
| HD-18 | Nên thống nhất cách gọi theo đúng tên hiển thị trên ứng dụng, chẳng hạn Sơ đồ bàn, Gọi món, Thanh toán, Lịch sử đơn và Báo cáo. Hạn chế dùng nhiều từ tiếng Anh để nhân viên mới dễ làm theo. |
| HD-19 | Nên bổ sung hình minh họa ở các bước quan trọng như gọi món, gửi bếp, chọn món thanh toán một phần, nhập thiếu tiền và kiểm tra lịch sử đơn. Như vậy người mới có thể nhìn hình để đối chiếu khi thao tác. |
| HD-20 | Nên cập nhật lại thông tin phiên bản ứng dụng và ngày kiểm tra hướng dẫn. Đồng thời tách phần ghi chú kỹ thuật ra riêng để người sử dụng không bị rối khi đọc. |

## Bản viết lại đề xuất cho bước 4–11 (bản AI, cập nhật 06/11)

Bổ sung sau lượt kiểm thử UI mới ngày 06/11/2026, tham khảo đề xuất của Lâm nhưng không thay lời Lâm r02. Đây là bản đề xuất, chưa sửa runbook chính thức trên nhánh docs. Ý nghĩa số đơn ở bước 11 còn chờ Linh (H-Q2); việc dời kiểm Báo cáo xuống cuối còn chờ H-Q3. Dùng vai Chủ quán và PIN do người phụ trách demo cung cấp; không ghi PIN vào phiếu. Theo lượt chạy 14:29 ngày 06/11, Quản lý cũng có Báo cáo, Thu ngân không có.

**Gọi món**

4. Ở màn **Sơ đồ bàn**, bấm tên khu ở dải trên (ví dụ **Tầng trệt**). Có thể bấm **Trống** để chỉ hiện bàn trống, rồi bấm một bàn thực sự đang trống (ví dụ **B01**). Màn **Gọi món — Bàn B01** mở ra. Bộ lọc được giữ sau khi gửi đơn; nếu dùng Trống, cần chuyển lại Tất cả ở bước 6.
5. Chọn món:
   1. Chọn danh mục ở cột trái (ví dụ **Cà phê**, **Trà & trà sữa**) hoặc gõ tên vào ô **Tìm món**, rồi bấm **+ Thêm** trên thẻ món.
   2. Món ghi "Có tùy chọn" sẽ mở một hộp: chọn Size, Đá, Topping… rồi bấm **Thêm vào đơn**. Món không có tùy chọn vào **Giỏ hàng** ngay.
   3. Trong **Giỏ hàng** bên phải: bấm **−**/**+** để đổi số lượng; bấm **Ghi chú** rồi gõ (ví dụ "ít ngọt"), không cần bấm lưu.
   4. Bấm **In/Gửi đơn**. Cửa sổ **Phiếu gửi bếp** hiện ra; bấm **Đóng**.
6. App tự về **Sơ đồ bàn**. **Nếu đang lọc Trống, bấm Tất cả để thấy lại bàn.** Kiểm tra bàn vừa gọi đang phục vụ, có thêm số tiền (ví dụ **B01 145K**) và có trong khung **Đơn đang mở** bên phải. Không chỉ suy ra trạng thái từ việc có hay không có số tiền.

**Thanh toán**

7. Bấm lại bàn đó (hoặc **Mở đơn hàng** ở khung **Đơn đang mở**), rồi bấm **Thanh toán**. Màn **Thanh toán đơn hàng** mở, mặc định đã chọn tất cả món.
8. Trả trước một phần món (tách đơn):
   1. Bỏ dấu ở **Chọn tất cả**.
   2. Đánh dấu 1–2 món. Ô cạnh nút **+** ghi số đã chọn / số trong đơn (ví dụ **1/2**). Bấm **+** để chọn thêm; khi đã đủ, bấm tiếp sẽ quay về 1.
   3. Ô **Tiền khách đưa** tự điền đúng số cần trả. Bấm **Thanh toán món đã chọn (…)**.
   4. Nếu ô **In hóa đơn sau khi thanh toán** đang bật (mặc định bật), cửa sổ **Hoá đơn thanh toán** hiện ra cho phần vừa trả, mang số đơn cũ (ví dụ **#27**). Bấm **Đóng**.
   5. Màn thanh toán vẫn mở cho phần còn lại, mang số đơn mới (ví dụ **Đơn #28**), chưa món nào được chọn.
9. Trả phần còn lại (vẫn ở màn thanh toán):
   1. Bấm **Chọn tất cả**.
   2. Ô **Tiền khách đưa** đã điền đúng số phải trả. Có thể chọn ô và gõ trực tiếp số mới. Hoặc dùng nút ⌫ để xóa ký tự rồi bấm số; nút ở hàng cuối bàn phím số, bị khuất ở màn 1366×768 nên có thể cần cuộn, còn màn 1920×1080 thấy ngay. Có thể dùng nút nhanh **Đúng tiền / +20k / +50k / 200k / 500k**.
   3. Thử nhập ít hơn số phải trả: thấy dòng **Còn thiếu …**, nút hoàn tất bị khóa. Nhập đủ: thấy **Tiền trả lại khách …**.
   4. Bấm **Hoàn tất thanh toán (…)**.
   Nếu đã rời Thanh toán để xem Báo cáo ở bước 8 rồi quay lại, **Chọn tất cả đã bật sẵn**; kiểm tra lại thay vì mặc định lựa chọn đang rỗng.
10. Nếu ô **In hóa đơn sau khi thanh toán** đang bật, cửa sổ **Hoá đơn thanh toán** hiện ra; bấm **Đóng**. Kiểm tra app về **Sơ đồ bàn**, bàn đã trống (viền xanh, không còn số tiền và không còn đơn đang mở của bàn). Lượt mới đã thử với ô in bật; chưa thử nhánh tắt hoặc in vật lý.
11. Kiểm tra kết quả (cần vai có quyền xem, ví dụ Chủ quán):
    1. **Lịch sử đơn**: thấy 2 đơn của cùng bàn, đều **Đã thanh toán** (ví dụ 70.000đ và 75.000đ). Lượt 06/11 thấy #2/#3 trong Lịch sử khác #27/#28 trên hóa đơn; ghi lại cả hai cặp số và đối chiếu thêm bàn, số tiền, thời điểm. Chưa kết luận ý nghĩa số thứ tự khi Linh chưa trả lời H-Q2.
    2. **Báo cáo**: doanh thu hôm nay tăng đúng tổng hai lần trả.

## Câu hỏi cho Linh

| ID | Câu hỏi | Ảnh hưởng | Trạng thái |
| --- | --- | --- | --- |
| H-Q1 | "Hướng dẫn hiện có" trong kế hoạch tuần 5 là `docs/demo-runbook.md` đúng không, hay có hướng dẫn sử dụng khác cho nhân viên quán? | Toàn bộ phiếu này | CHƯA GỬI |
| H-Q2 | Lịch sử đơn ghi #2, #3 trong khi hóa đơn in #27, #28. Đây có phải thiết kế (`docs/screens.md` L52: "Số thứ tự hiển thị theo bộ lọc, khác số bill") không? Hướng dẫn nên cho người dùng đối chiếu số nào? (Repo có nhánh tên `agent/fix-order-history-display-numbers`, chưa đọc nội dung, có thể liên quan.) | HD-17, bước 11 | CHƯA GỬI |
| H-Q3 | Có thể dời "mở Báo cáo xem doanh thu" từ giữa bước 8 xuống bước 11 không? Nếu giữ chỗ cũ, sau khi quay lại màn thanh toán thì các món được chọn sẵn, không "rỗng" như bước 9. | HD-14, bước 8–9 | CHƯA GỬI |
| H-Q4 | Có được thêm ảnh chụp từ bản demo vào hướng dẫn không, và lưu ở đâu (nhánh docs đã bỏ ảnh)? | HD-19 | CHƯA GỬI |

## Giới hạn của lượt 03/11 (lịch sử)

- Đây là thử làm theo trên bản demo dữ liệu giả, một máy, một kích thước màn hình. Không phải nghiệm thu app, không kiểm backend thật, không thử trên điện thoại hay tablet.
- AI làm theo bằng trình duyệt tự động. Người thật có thể vướng ở chỗ khác (ví dụ không thấy nút do phải cuộn). Vì vậy Lâm cần tự làm lại ít nhất một lượt.
- Chưa thử vai Quản lý; chưa thử nhánh "Tạo quán mới" ở bước 2; không xem phần "Checklist trước demo" và các bước 12–16 (ngoài phạm vi gọi món, thanh toán).
- Không ghi Store Key hay PIN trong phiếu này. Script có dùng mã demo có sẵn trong mã nguồn chế độ mock, không phải thông tin thật.

## Tự kiểm của Lâm

- [x] Lâm đã xem ảnh trong `chay-demo-2026-11-03/anh/` và đồng ý với phần "Thấy gì" ở từng bước. Lâm ghi (file lưu 03/11/2026 15:13):
  > Nội dung ảnh ghi nhận quá trình vào ứng dụng, chọn bàn, gọi món, gửi bếp, thanh toán một phần, thanh toán phần còn lại và kiểm tra lịch sử đơn, báo cáo doanh thu.
  >
  > Qua đối chiếu tài liệu, có một số điểm cần chú ý: sau khi gửi đơn phải đóng cửa sổ Phiếu gửi bếp; sau khi tách thanh toán, muốn xem Báo cáo phải thoát màn thanh toán; khi mở lại đơn thì Chọn tất cả được bật sẵn. Ngoài ra, số đơn trong Lịch sử đơn (#2, #3) khác với số trên hóa đơn (#27, #28), cần Linh xác nhận cách hiển thị.
- [x] Lâm tự làm theo hướng dẫn bằng tay ít nhất một lượt bước 4–11 trên cùng bản demo — Lâm ghi làm lúc 14:23–14:49 ngày 06/11/2026, chi tiết ở [phiếu kiểm thử](kiem-thu-2026-11-06.md#lâm-làm-tay).
- [ ] Ghi chỗ nào thấy khác khi làm tay. **Chưa ghi.**
- [x] Lâm sửa phần "Đề xuất cách viết" theo lời của mình (có thể giữ, sửa hoặc bỏ từng dòng) — viết lại cả 20 dòng, xem mục [Đề xuất cách viết của Lâm (r02)](#đề-xuất-cách-viết-của-lâm-r02) (file lưu 03/11/2026 15:13).
- [ ] Gửi Linh phiếu này kèm H-Q1…H-Q4, ghi giờ gửi thật. Nhật ký Lâm ghi 14:55–14:58; chờ Lâm xác nhận.
