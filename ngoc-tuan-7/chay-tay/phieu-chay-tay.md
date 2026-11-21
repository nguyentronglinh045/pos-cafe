# Phiếu chạy tay tuần 7 — N01-11, N01-12 và màn mang đi 568×320


## Chuẩn bị

1. Mở PowerShell và chạy bản demo của main `2e57649`:

   ```powershell
   Set-Location C:\Users\ngoc.vv\Music\KLTN\pos-cafe-main-2e57649
   $env:VITE_DATA_MODE = 'mock'; $env:VITE_SUPABASE_URL = ''; $env:VITE_SUPABASE_ANON_KEY = ''
   npm.cmd run dev -- --host 127.0.0.1 --port 5175 --strictPort
   ```

2. **Mỗi ca dùng một cửa sổ InPrivate mới** (Edge: `Ctrl+Shift+N`) để dữ liệu mock quay về ban đầu: đơn #24 ở B02 có tổng 125.000đ, đơn mang đi #26 có tổng 84.000đ.
3. Mở `http://127.0.0.1:5175` → **Đã có quán** → Store Key `0001-X8F3QA` → chọn **Thu ngân** → PIN `111111`. Đây là dữ liệu demo có sẵn trong mã nguồn chế độ mock.
4. Kích thước màn:
   - N01-11, N01-12: cửa sổ khoảng 1366×768.
   - Mang đi: `F12` → `Ctrl+Shift+M` → chọn **Responsive**, nhập **568 × 320**, zoom 100%. Đây là giả lập kích thước bằng CSS px, không phải thiết bị cảm ứng thật.
5. Chụp ảnh bằng `Win+Shift+S`, lưu vào `chay-tay/anh/` với tên theo cột "Ảnh", ví dụ `N01-11-B2.png`.

## N01-11 — Thêm/bớt món đã gửi

Bắt đầu: ........ (giờ thật) · Kết thúc: ........

| Bước | Thao tác | Expected r04 | Lượt tự động 14/11 | Giờ | Ngọc thấy | Kết quả | Ảnh |
| --- | --- | --- | --- | --- | --- | --- | --- |
| B1 | Bấm bàn B02 để mở đơn #24 | 3 dòng ghi "Phần đã lưu", tổng 125.000đ | ĐÚNG | | | | N01-11-B1.png |
| B2 | Bấm **+** ở dòng Bạc xỉu đã lưu | Dòng đã lưu vẫn ×1; thêm **một dòng Bạc xỉu mới** theo giá hiện hành; tổng 157.000đ | ĐÚNG | | | | N01-11-B2.png |
| B3 | Bấm **−** ở dòng Croissant đã lưu | Croissant về 0 thì ẩn khỏi giỏ; tổng 122.000đ | ĐÚNG | | | | N01-11-B3.png |
| B4 | Đóng màn đơn → bấm nút bỏ trong hộp xác nhận → mở lại B02 | Đơn về bản đã lưu 125.000đ, Croissant còn, không còn dòng gọi thêm | ĐÚNG hành vi; nhãn nút là "Bỏ đơn" (CX-03 muốn "Bỏ thay đổi") | | Nhãn nút: ........ | | N01-11-B4.png |

## N01-12 — Nhập tiền khách đưa

Bắt đầu: ........ · Kết thúc: ........

| Bước | Thao tác | Expected r04 | Lượt tự động 14/11 | Giờ | Ngọc thấy | Kết quả | Ảnh |
| --- | --- | --- | --- | --- | --- | --- | --- |
| B1 | Mở đơn #24 → **Thanh toán** | Ô khách đưa 125.000 | ĐÚNG | | | | N01-12-B1.png |
| B2 | Bấm phím xóa một lần | 12.500 (xóa một chữ số); hoàn tất bị khóa | ĐÚNG | | | | N01-12-B2.png |
| B3 | Bấm **00** | 1.250.000 | ĐÚNG | | | | N01-12-B3.png |
| B4 | Bấm **9** bốn lần | Không quá 9 chữ số (125.000.099) | ĐÚNG | | | | N01-12-B4.png |
| B5 | Bấm vào ô, `Ctrl+A`, gõ `12a5b` | Chỉ nhận chữ số → 125; hoàn tất bị khóa | ĐÚNG; nút Đúng tiền **không hiện** (CX-02) | | Có nút Đúng tiền không: ........ | | N01-12-B5.png |
| B6 | **Nhập lại `200000`** để hiện hàng nút nhanh, rồi bấm Đúng tiền, +50k, 500k | 125.000 → 175.000 → 500.000 | ĐÚNG sau khi nhập lại 200000 | | | | N01-12-B6.png |

Sau B6: đóng thanh toán, **không bấm Hoàn tất**, mở lại B02 và kiểm vẫn là #24, 125.000đ.

Thao tác "nhập lại 200000" ở B6 là đề xuất r05 (xem [de-xuat-r05.md](../N01/de-xuat-r05.md)). Expected không đổi.

## Màn mang đi ở 568×320

Bắt đầu: ........ · Kết thúc: ........

Màn này chưa có spec giao diện riêng, nên chỉ kiểm việc **tới được và bấm được nút**, cùng màn đích. Cỡ nút ghi để đối chiếu GD-01, không chấm đạt/không đạt.

| Kiểm tra | Cách làm | Lượt tự động 14/11 | Giờ | Ngọc thấy (có phải cuộn không, nút có bị che không) | Kết quả | Ảnh |
| --- | --- | --- | --- | --- | --- | --- |
| T1 Ban đầu | Bấm **Bán mang đi** ở thanh bên trái | 1 đơn #26/84.000đ, 9 nút, không tràn trang | | | | MANG-DI-T1.png |
| T2 Ba thẻ lọc | Bấm Đã thanh toán, Hôm nay, Đang mở | Bấm được cả ba; Đã thanh toán rỗng, hai thẻ kia có #26 | | | | MANG-DI-T2.png |
| T3 Tạo đơn mang đi | Bấm Tạo đơn mang đi, đóng khi chưa thêm món, mở lại Bán mang đi | Mở nháp mới; mở lại vẫn 1 đơn (Q-N01-1) | | | | MANG-DI-T3.png |
| T4a Mở đơn trên thẻ | Bấm Mở đơn trên thẻ #26 | Mở đúng #26/84.000đ | | | | MANG-DI-T4a.png |
| T4b Thanh toán trên thẻ | Bấm Thanh toán trên thẻ #26, rồi đóng | Mở đúng thanh toán #26, phải trả 84.000đ | | | | MANG-DI-T4b.png |
| T4c Mở đơn ở khung chi tiết | Chọn #26, cuộn khung chi tiết tới nút, bấm | Phải cuộn trong khung; mở đúng #26 | | | | MANG-DI-T4c.png |
| T4d Thanh toán ở khung chi tiết | Như trên với nút Thanh toán | Phải cuộn ngang 49px và dọc 150px; mở đúng thanh toán #26 | | | | MANG-DI-T4d.png |
| T5 Tổng chi tiết và Đóng | Cuộn tới tổng, bấm Đóng, mở lại | Thấy 84.000đ; Đóng hoạt động; vẫn 1 đơn | | | | MANG-DI-T5.png |

Ghi thêm: chữ nào bị cắt hoặc quá nhỏ để đọc, nhãn nút nào dễ hiểu nhầm.

