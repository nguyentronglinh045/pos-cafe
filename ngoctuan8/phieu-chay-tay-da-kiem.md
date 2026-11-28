# Phiếu kiểm thử tương tác trực tiếp tuần 8

**Phạm vi:** N01-11, N01-12 và màn Bán mang đi 568 × 320 CSS px  
**Ngày thực hiện:** 26/11/2026, giờ Việt Nam (UTC+7)  

## 1. Kết luận

| Hạng mục | Kết quả theo hành vi | Thời gian ghi nhận |
| --- | --- | --- |
| N01-11 — Thêm/bớt món đã gửi | **4/4 ĐÚNG** | 09:11:30–09:11:52 (22 giây) |
| N01-12 — Nhập tiền khách đưa | **7/7 ĐÚNG** | 09:12:10–09:12:54 (44 giây) |
| Bán mang đi 568 × 320 | **8/8 thao tác thực hiện được** | 09:14:47–09:16:43 (1 phút 56 giây) |
| **Tổng** | **19/19 hành vi khớp phiếu** | 29 ảnh mới |

**Lưu ý:** Tổng 19/19 chỉ phản ánh phần hành vi có thể quan sát. Không dùng để kết luận đã sửa CX-02/CX-03, đã đạt tiêu chí giao diện, đã hoàn tất hồi quy CX-01…CX-04 hoặc Ngọc đã trực tiếp thực hiện.

## 2. Điều kiện và cách thực hiện

- Dùng bản mã nguồn đi kèm `tuan8ngoc.rar`, hồ sơ mô tả đây là bản mốc `main 2e5764958a08300aac2f98701144a7d89ac8d4a5`. Không đối chiếu được commit bằng `.git` từ riêng bản sao lưu này.
- Chạy Vite ở `http://127.0.0.1:5175` với `VITE_DATA_MODE=mock`, Store Key demo `0001-X8F3QA`, vai trò **Thu ngân**, PIN demo `111111`.
- N01-11 và N01-12: Chromium giao diện desktop khoảng 1363 × 936 CSS px vùng nội dung, cùng phiên trình duyệt, trạng thái đơn đã được kiểm tra trước và sau; **khác hướng dẫn trong phiếu là mở InPrivate riêng cho từng ca và cửa sổ khoảng 1366 × 768**. Đây là sai khác môi trường cần lưu ý nếu muốn xác nhận phiếu gốc tuyệt đối.
- Bán mang đi: DevTools của Chromium bị chặn bởi chính sách môi trường, nên dùng trang QA chứa iframe cùng origin có **viewport nội bộ đúng 568 × 320 CSS px**, zoom 100%. Điều khiển chuột, bàn phím và cuộn trực tiếp qua giao diện; **không phải thiết bị cảm ứng thật**.
- Mỗi thao tác đều đọc màn sau khi bấm và chụp ảnh. Không thanh toán thật, không bấm **Hoàn tất thanh toán**, không gửi đơn, không cập nhật dữ liệu production.
- Đối chiếu với lượt tự động do nhóm lưu ngày 26/11/2026. Giờ ở đây là mốc của **lượt tương tác mới**; không sao chép giờ từ lượt Playwright tự động.

## 3. N01-11 — Thêm/bớt món đã gửi

**Bắt đầu:** 09:11:30 · **Kết thúc:** 09:11:52

| Bước | Giờ | Thao tác và kết quả quan sát trực tiếp | Kết quả | Ảnh |
| --- | --- | --- | --- | --- |
| B1 | 09:11:34 | Bấm bàn **B02**; thấy đơn **#24** đã gửi, 3 dòng món đã lưu gồm Cà phê sữa, Bạc xỉu, Croissant; tổng **125.000đ**. | **ĐÚNG** | [B1](anh/N01-11/B1.png) |
| B2 | 09:11:38 | Bấm `+` tại Bạc xỉu đã lưu; dòng cũ vẫn ×1, thêm một dòng **Bạc xỉu phần gọi thêm**; tổng tăng thành **157.000đ**. | **ĐÚNG** | [B2](anh/N01-11/B2.png) |
| B3 | 09:11:43 | Bấm `−` tại Croissant đã lưu; dòng Croissant biến mất khỏi giỏ; tổng còn **122.000đ**. | **ĐÚNG** | [B3](anh/N01-11/B3.png) |
| B4 | 09:11:52 | Bấm Đóng; hộp xác nhận có nút **“Bỏ đơn”**. Bấm nút này rồi mở lại B02: đơn **#24**, 3 dòng đã lưu, Croissant còn, không còn Bạc xỉu gọi thêm, tổng **125.000đ**. | **ĐÚNG về hành vi; nhãn chờ CX-03** | [Hộp xác nhận](anh/N01-11/B4-xac-nhan.png) · [B4](anh/N01-11/B4.png) |

**Nhận xét:** Hành vi hủy phần thay đổi chưa gửi chính xác. Tuy nhiên “Bỏ đơn” dễ khiến người dùng hiểu rằng toàn bộ đơn đã gửi bị xóa; cần chờ sửa nhãn thành **“Bỏ thay đổi”** theo CX-03 nếu nhóm thống nhất.

## 4. N01-12 — Nhập tiền khách đưa

**Bắt đầu:** 09:12:10 · **Kết thúc:** 09:12:54

| Bước | Giờ | Thao tác và kết quả quan sát trực tiếp | Kết quả | Ảnh |
| --- | --- | --- | --- | --- |
| B1 | 09:12:14 | Mở Thanh toán đơn **#24**, ô Tiền khách đưa mặc định **125.000đ**. | **ĐÚNG** | [B1](anh/N01-12/B1.png) |
| B2 | 09:12:18 | Bấm phím xóa một lần; còn **12.500đ**; nút Hoàn tất thanh toán bị khóa. | **ĐÚNG** | [B2](anh/N01-12/B2.png) |
| B3 | 09:12:22 | Bấm `00`; ô khách đưa thành **1.250.000đ**. | **ĐÚNG** | [B3](anh/N01-12/B3.png) |
| B4 | 09:12:27 | Bấm `9` bốn lần; ô nhận **125.000.099đ**, đúng 9 chữ số, không nhận quá giới hạn. | **ĐÚNG** | [B4](anh/N01-12/B4.png) |
| B5 | 09:12:33 | Chọn hết và gõ `12a5b`; ô chỉ còn **125đ**, Hoàn tất bị khóa. **Không hiện Đúng tiền**; viền ô vẫn xanh khi focus, không thấy nút x xóa nhanh theo CX-02. | **ĐÚNG theo Expected r04; CX-02 chưa sửa** | [B5](anh/N01-12/B5.png) |
| B6 | 09:12:47 | Nhập lại `200000` để hiện nút nhanh (đề xuất r05); lần lượt bấm **Đúng tiền → 125.000đ**, **+50k → 175.000đ**, **500k → 500.000đ**. | **ĐÚNG** | [Đúng tiền](anh/N01-12/B6-dung-tien.png) · [+50k](anh/N01-12/B6-cong-50k.png) · [500k](anh/N01-12/B6-500k.png) |
| Sau B6 | 09:12:54 | Đóng thanh toán bằng X, **không bấm Hoàn tất**, mở lại B02: vẫn đơn **#24** với tổng **125.000đ**. | **ĐÚNG** | [Sau B6](anh/N01-12/SAU-B6.png) |

**Nhận xét:** Phần giới hạn và nút nhanh hoạt động đúng trên bản mốc. Tại B5, trạng thái thiếu tiền đã khóa Hoàn tất nhưng chưa có cách bấm Đúng tiền tức thời; cần hồi quy lại sau CX-02, gồm màu viền báo lỗi và nút x nếu đó là yêu cầu đã duyệt.

## 5. Màn Bán mang đi tại 568 × 320

**Bắt đầu:** 09:14:47 · **Kết thúc:** 09:16:43

| Bước | Giờ | Thao tác và điều quan sát | Hành vi | Ảnh |
| --- | --- | --- | --- | --- |
| T1 | 09:14:55 | Mở Bán mang đi: hiển thị **1 đơn đang mở #26, 84.000đ**. Danh sách và chi tiết nằm cạnh nhau; khung có thanh cuộn ngang bên dưới. | **ĐÚNG** | [T1](anh/MANG-DI/T1.png) |
| T2 | 09:15:04 | Bấm từng thẻ: **Đã thanh toán** trống; **Hôm nay** có #26; **Đang mở** có #26. Ba thẻ phản hồi khi bấm. | **ĐÚNG** | [Đã thanh toán](anh/MANG-DI/T2-da-thanh-toan.png) · [Hôm nay](anh/MANG-DI/T2-hom-nay.png) · [Đang mở](anh/MANG-DI/T2.png) |
| T3 | 09:15:16 | Bấm Tạo đơn mang đi: mở giỏ nháp mới **0 món**; bấm Đóng và mở lại Bán mang đi: vẫn chỉ **1 đơn #26**, chưa tạo thêm đơn lưu. | **ĐÚNG** | [Nháp](anh/MANG-DI/T3-nhap-moi.png) · [T3](anh/MANG-DI/T3.png) |
| T4a | 09:15:25 | Bấm **Mở đơn** trên thẻ #26: vào giỏ mang đi có **2 món**, tổng **84.000đ**. Ở kích thước này tiêu đề giỏ không hiển thị rõ số #26; đơn nguồn xác định từ thẻ vừa bấm. | **ĐÚNG** | [T4a](anh/MANG-DI/T4a.png) |
| T4b | 09:15:31 | Bấm **Thanh toán** trên thẻ #26: màn thanh toán hiển thị rõ **Đơn #26**, tổng phải thanh toán **84.000đ**; đóng mà không hoàn tất. | **ĐÚNG** | [T4b](anh/MANG-DI/T4b.png) |
| T4c | 09:16:10 | Từ Chi tiết đơn, dùng chuột **cuộn dọc rồi ngang** mới thấy nút Mở đơn đầy đủ; bấm và mở đúng giỏ 2 món, **84.000đ**. | **ĐÚNG; phải cuộn** | [Sau cuộn](anh/MANG-DI/T4c-sau-cuon.png) · [Màn đích](anh/MANG-DI/T4c.png) |
| T4d | 09:16:24 | Tương tự, sau cuộn bấm **Thanh toán** tại Chi tiết đơn: mở đúng **Đơn #26**, **84.000đ**. | **ĐÚNG; phải cuộn** | [Sau cuộn](anh/MANG-DI/T4d-sau-cuon.png) · [Màn đích](anh/MANG-DI/T4d.png) |
| T5 | 09:16:43 | Cuộn lên trong Chi tiết để đọc **Tổng 84.000đ**, bấm **Đóng** ở phần đầu và mở lại: vẫn **1 đơn #26**. | **ĐÚNG** | [Tổng](anh/MANG-DI/T5-tong.png) · [Sau mở lại](anh/MANG-DI/T5.png) |

### Đánh giá đọc chữ, kích thước nút và cuộn

- **Chữ:** Nhãn đơn, ba bộ lọc, tổng tiền và nút có thể đọc được trên ảnh 100%, nhưng chữ trong thẻ và nút nhỏ; một số khu vực chỉ nhìn thấy sau cuộn. Đây là đánh giá thị giác qua giao diện từ xa, chưa thay cho cảm nhận của người dùng trên màn hình thật.
- **Nút:** Nhìn chung bấm chuột trúng đích trong các bước trên. Lượt đo tự động cùng bản mốc ngày 26/11 ghi nhận **9 nút cao 24–36,5px**, chữ 12–14px, tức thấp hơn ngưỡng tham khảo **44px** nếu nhóm áp cho màn này. Lượt thao tác hiện tại **không tự đo lại bounding box**.
- **Cuộn:** Muốn tới hai nút trong Chi tiết phải cuộn dọc rồi ngang; khi cuộn ngang sang phải, phần bên trái danh sách và số tiền trên thẻ bị che. Sau khi cuộn tới đáy, cần cuộn dọc ngược một đoạn mới nhìn rõ dòng Tổng 84.000đ. Đây là điểm bất tiện rõ nhất.
- **Số đo tham chiếu:** Lượt Playwright 26/11 ghi mức cuộn tối đa **72px ngang, 150px dọc**; lượt GUI này sử dụng cuộn chuột trực tiếp nhưng không đo lại vị trí scroll chính xác. Không gán các con số của lượt tự động thành kết quả đo của lượt GUI.
- **Chưa chấm lỗi GD-01:** Chưa có đặc tả riêng được nhóm duyệt cho Bán mang đi ở 568 × 320. Đề nghị Linh xác nhận ngưỡng cỡ chữ/cỡ nút và việc có chấp nhận cuộn ngang để thao tác không.

## 6. Đối chiếu với lượt tự động 26/11

| Nội dung | Lượt tự động lưu sẵn | Lượt tương tác mới | Nhận xét |
| --- | --- | --- | --- |
| N01-11 | 4/4 hành vi đúng | 4/4 hành vi đúng | B4 vẫn nhãn “Bỏ đơn” |
| N01-12 | 7/7 hành vi đúng | 7/7 hành vi đúng | B5 chưa thấy Đúng tiền khi thiếu tiền |
| Mang đi | 8/8 hành vi đúng | 8/8 thao tác được | Cuộn hai chiều vẫn cần thiết |
| Môi trường | Chrome headless 158, viewport trực tiếp | Chromium GUI; desktop + iframe 568 × 320 | Hai phương pháp khác nhau; chưa thử touch thật |


