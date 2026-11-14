# Chạy lại N01-11, N01-12 và mang đi 568×320 — 14/11/2026

**Đã thực thi đủ ba mục bằng Playwright trên Chrome.**

- Lượt dùng làm minh chứng: **09:05:01–09:05:21, UTC+7**, ngày 14/11/2026.
- Demo dữ liệu giả, `http://127.0.0.1:5175`; vai Thu ngân; mỗi mục dùng một browser context sạch. Chrome `157.0.8103.79`, chạy headless.
- N01: 1366×768 CSS px. Mang đi: **568×320 CSS px**, deviceScaleFactor 1.
- Kết quả: **18 bước kiểm tra: 17 ĐÚNG, 1 LỆCH đã biết CX-03; 0 bước không thực hiện được; 0 lỗi JavaScript trên trang.** Đây không phải lượt chạy lại toàn bộ 65 bước N01.
- Thư mục `src/` giống nhau trước và sau lượt chạy. Mã băm từng file và fingerprint nằm trong [ket-qua.json](ket-qua.json); không suy ra mã đang chạy trùng commit main chỉ từ kết quả này.

## N01-11 — thêm/bớt món đã gửi

Thời gian: **09:05:02–09:05:07**.

| Bước | Quan sát và đối chiếu | Kết quả |
| --- | --- | --- |
| B1 | Mở B02/#24, 3 dòng đã lưu, tổng 125.000đ | ĐÚNG |
| B2 | Bấm + ở Bạc xỉu đã lưu: dòng cũ vẫn ×1; thêm riêng một dòng Bạc xỉu ×1 “Phần gọi thêm”; cuộn tới dòng mới; tổng 157.000đ | ĐÚNG |
| B3 | Giảm Croissant về 0: dòng biến mất khỏi giỏ; tổng 122.000đ | ĐÚNG |
| B4 | Đóng, hộp xác nhận ghi **“Bỏ đơn”**. Bấm bỏ rồi mở lại: 3 dòng đã lưu, Croissant còn, tổng 125.000đ, không còn dòng gọi thêm | **ĐÚNG hành vi; LỆCH nhãn — chờ CX-03**, Expected là “Bỏ thay đổi” |

Ảnh: [dòng Bạc xỉu mới](anh/N01-11-B2.png), [sau khi giảm Croissant](anh/N01-11-B3.png), [nhãn nút bỏ nháp](anh/N01-11-B4-hop-bo-nhap.png), [đơn khôi phục](anh/N01-11-B4.png).

## N01-12 — nhập tiền khách đưa

Thời gian: **09:05:07–09:05:13**. Cả 6 bước đúng Expected R03/R04.

| Bước | Thao tác | Thực tế |
| --- | --- | --- |
| B1 | Mở thanh toán đơn #24 | 125.000đ |
| B2 | Xóa một chữ số | 12.500đ; hoàn tất bị khóa |
| B3 | Bấm 00 | 1.250.000đ |
| B4 | Bấm 9 bốn lần | **125.000.099đ**, đúng 9 chữ số; hai số 9 dư không được nhận |
| B5 | Chọn toàn bộ, gõ `12a5b` | Chỉ còn **125đ**, hoàn tất bị khóa; nút Đúng tiền **không hiện** do CX-02 |
| B6 | Nhập lại `200000` để hiện hàng nút nhanh; bấm Đúng tiền, +50k, 500k | Lần lượt **125.000đ → 175.000đ → 500.000đ** |

Sau đó đóng thanh toán và mở lại B02, vẫn #24/125.000đ. Không bấm Hoàn tất thanh toán. B6 chỉ xác nhận nút nhanh sau khi nhập đủ tiền, không chứng minh CX-02 đã được sửa.

Ảnh: [giới hạn 9 chữ số](anh/N01-12-B4.png), [lọc ký tự và khóa hoàn tất](anh/N01-12-B5.png), [nhập lại 200.000đ](anh/N01-12-B6-nhap-lai-200000.png), [Đúng tiền](anh/N01-12-B6-125000.png), [+50k](anh/N01-12-B6-175000.png), [500k](anh/N01-12-B6-500000.png).

## Màn mang đi 568×320

Thời gian: **09:05:13–09:05:20**. Tám bước kiểm tra thao tác đều thực hiện được; không chấm đạt một spec giao diện riêng chưa được chốt.

| Kiểm tra | Kết quả |
| --- | --- |
| Ban đầu | Đúng viewport 568×320; 1 đơn #26/84.000đ; 9 nút. Document overflow ngang/dọc bằng 0 |
| Ba thẻ lọc | Bấm được cả Đã thanh toán, Hôm nay, Đang mở. Đã thanh toán hiện danh sách rỗng; hai thẻ còn lại có #26 |
| Tạo đơn mang đi | Mở nháp mới; đóng khi chưa thêm/gửi món; mở lại danh sách vẫn 1 đơn |
| Mở đơn trên thẻ | Bấm được, mở đúng #26/84.000đ |
| Thanh toán trên thẻ | Bấm được, mở đúng thanh toán #26, phải trả 84.000đ; đóng lại |
| Mở đơn ở khung chi tiết | Cuộn nội bộ tới nút rồi bấm được, mở đúng #26/84.000đ |
| Thanh toán ở khung chi tiết | Cuộn nội bộ tới nút rồi bấm được, mở đúng thanh toán #26/84.000đ; đóng lại |
| Tổng chi tiết và Đóng | Cuộn tới tổng 84.000đ; Đóng hoạt động; mở lại vẫn 1 đơn |

Bốn nút Mở đơn/Thanh toán được kiểm actionability bằng Playwright, xác nhận tâm nút không bị che, toàn bộ khung nút nằm trong viewport, **rồi bấm thật và kiểm màn đích**. Ở nút Thanh toán của khung chi tiết, vùng ngang đã cuộn 49px và vùng dọc trong chi tiết đã cuộn 150px. Danh sách bên trái bị khuất một phần khi cuộn ngang để xem bên phải; không phải mọi nội dung đều hiện đồng thời ở 568px.

**GD-01 vẫn còn:** 9 nút đều thấp hơn 44px: ba thẻ lọc 24px; nút trên thẻ 26px; hai nút chi tiết 30,75px; Tạo đơn/Đóng 36,5px. Kết quả mới bổ sung bằng chứng cuộn và thao tác trên demo, không xóa nhận xét nút nhỏ và không thay cho kiểm tra touch trên thiết bị thật.

Ảnh: [ban đầu](anh/MANG-DI-568x320-T1.png), [cuộn tới Mở đơn chi tiết](anh/MANG-DI-568x320-T4-chi-tiet-order-truoc-bam.png), [cuộn tới Thanh toán chi tiết](anh/MANG-DI-568x320-T4-chi-tiet-payment-truoc-bam.png), [màn thanh toán #26](anh/MANG-DI-568x320-T4-chi-tiet-payment-da-mo.png), [tổng chi tiết sau cuộn](anh/MANG-DI-568x320-T5-tong-chi-tiet.png).

## Minh chứng và tái chạy

- [ket-qua.json](ket-qua.json): Expected, giờ từng bước, số liệu quan sát, đường dẫn ảnh, lỗi trang, mã băm nguồn.
- [anh/](anh/): **36 ảnh PNG**, có cả trạng thái trước/sau bấm và từng nút nhanh.
- Trace Playwright: [N01-11](N01-11-trace.zip), [N01-12](N01-12-trace.zip), [mang đi](MANG-DI-568x320-trace.zip).
- Script: [run-ngoc-recheck.mjs](../script/run-ngoc-recheck.mjs). Truyền thư mục mã nguồn tuyệt đối, thư mục đầu ra mới và URL demo. Script từ chối ghi đè thư mục đã có kết quả; chỉ nhận URL host `127.0.0.1`.

Lượt đầu **09:04:04–09:04:26** được giữ tại `../chay-lai-2026-11-14-playwright/`; cả ba mục đều chạy xong, nhưng một số ảnh chụp giữa hiệu ứng mở màn. Lượt r02 này chụp với `animations: 'disabled'` để kết thúc hiệu ứng hữu hạn trước khi lưu ảnh; không đổi CSS, dữ liệu hoặc code ứng dụng. Dùng r02 khi xem/nộp minh chứng.

Các ô “Ngọc tự chạy tay” trong hồ sơ vẫn để trống vì chưa có lượt thao tác cá nhân được xác nhận.
