# Bản mẫu giao diện — Hướng A "Teal Chuẩn Hoá"

Ngày lập: 2026-09-15. Trạng thái: **chờ chủ dự án duyệt**. Chưa có dòng mã nguồn nào của ứng dụng bị thay đổi.

Thư mục này chứa bốn bản mẫu HTML mở thẳng bằng trình duyệt, không cần cài đặt hay chạy máy chủ. Mục đích là để duyệt hướng thiết kế và cách sắp xếp lại giao diện **trước khi** viết đặc tả đầy đủ và trước khi động vào mã nguồn.

## Nội dung

| Tệp | Nội dung |
| --- | --- |
| [00-hien-trang-thanh-toan.html](00-hien-trang-thanh-toan.html) | Màn thanh toán **hiện trạng**, dựng lại đúng giá trị đang chạy để đối chiếu. Không dùng hệ thiết kế mới. |
| [01-thanh-toan.html](01-thanh-toan.html) | Màn thanh toán **thiết kế lại**. |
| [02-don-hang.html](02-don-hang.html) | Màn đơn hàng **thiết kế lại**. |
| [03-so-do-ban.html](03-so-do-ban.html) | Màn sơ đồ bàn **thiết kế lại**, kèm rail điều hướng. |
| [spec.md](spec.md) | Toàn bộ thông số: màu, cỡ chữ, độ đậm, khoảng cách, gap, bo góc, chiều cao chạm — theo từng bậc màn hình. |
| `assets/tokens.css` | Hệ thiết kế dùng chung cho ba bản mẫu mới. Một tệp duy nhất cấp màu và số đo cho cả ba màn. |

Bắt đầu bằng cách mở `00` rồi `01` cạnh nhau: cùng một hoá đơn, cùng số tiền, cùng bộ hành động.

## Ảnh chụp sẵn

Thư mục `anh/` chứa 12 ảnh, bốn màn × ba kích thước, chụp bằng trình duyệt thật:

| Kích thước | Bậc | Thiết bị |
| --- | --- | --- |
| 844 × 390 | compact | Điện thoại ngang — chụp trọn trang vì nội dung cao hơn màn |
| 1024 × 768 | default | Tablet ngang, mốc mục tiêu |
| 1440 × 900 | wide | Desktop |

Tên tệp theo dạng `<số thứ tự>-<tên màn>-<bề ngang>.png`.

## Lỗi đã phát hiện và sửa khi dựng ảnh

Ba bản mẫu mới đều có lỗi ở lần dựng đầu, phát hiện khi chụp ảnh thật:

| Màn | Lỗi | Cách sửa |
| --- | --- | --- |
| Thanh toán | Bàn phím số bị cắt mất hàng cuối ở chiều cao 768px, phải cuộn mới thấy | Dồn dòng tiền thối lên khối tiền đầu cột, và đổi bàn phím từ 3 cột × 4 hàng sang 4 cột × 3 hàng. Cột thu ngân rộng 300–380px nên phím vẫn trên 70px |
| Đơn hàng | Nhãn "Chưa lưu." trong dải cảnh báo bị ngắt dòng giữa hai từ | Dải cảnh báo chuyển từ hộp linh hoạt sang khối chữ chạy liền |
| Sơ đồ bàn | Bàn đang phục vụ cao hơn bàn trống vì nhãn trạng thái ngắt dòng | Cố định kích thước bàn và cấm ngắt dòng nhãn trạng thái |
| Sơ đồ bàn | Ô mẫu trong chú giải bị đọc nhầm thành ô đánh dấu | Đổi ô vuông thành chữ nhật rộng |
| Sơ đồ bàn | Vạch ngăn giữa nhóm khu vực và nhóm lọc không hiện | Đặt chiều cao tường minh |
| Sơ đồ bàn | Ở bậc compact, nút làm mới bị đẩy ra ngoài mép do thanh công cụ cuộn ngang | Ở bậc compact thanh công cụ xuống dòng thay vì cuộn |

## Cách xem phần đáp ứng đa kích thước

Ba bản mẫu mới đều đáp ứng thật. Thu hẹp cửa sổ trình duyệt để xem hành vi ở từng bậc:

| Bậc | Bề ngang | Điều cần quan sát |
| --- | --- | --- |
| compact | dưới 900px | Hai vùng xếp dọc; cỡ chữ và lề giảm; nút xác nhận tiền hạ từ 60px xuống 52px; rail điều hướng thu còn 68px |
| default | 900px trở lên | Bố cục hai vùng; đây là vùng chứa mốc 1024 × 768 |
| wide | 1280px trở lên | Cỡ chữ và lề tăng |
| ultra | 1600px trở lên | Lề tăng thêm |

Bản `00` cố tình **không** xếp dọc ở bậc nhỏ — đó là hành vi thật của mã nguồn hiện hành, nơi vùng nội dung bị đặt bề ngang tối thiểu 720px nên cuộn ngang thay vì bố trí lại.

## Ràng buộc đã áp dụng

Theo quyết định ngày 2026-09-15 của chủ dự án: **ưu tiên giữ nguyên số bước nghiệp vụ, chỉ thay đổi cách sắp xếp giao diện và vị trí các nút.**

Bộ hành động trên cả ba màn được giữ nguyên — không thêm, không bớt:

| Màn | Hành động giữ nguyên |
| --- | --- |
| Thanh toán | Đóng · Thanh toán ở đầu màn · Chọn tất cả · Chọn từng món · Tăng giảm số lượng từng món · In hóa đơn sau khi thanh toán · In lại hóa đơn · Thanh toán ở chân màn · Chọn phương thức · Nhập tiền khách đưa · Bàn phím số · Gợi ý mệnh giá |
| Đơn hàng | Đóng · Thanh toán · Gửi đơn ở đầu màn · Chọn nhóm món · Chọn món · Tăng giảm số lượng · Bỏ món · Gửi đơn ở chân giỏ hàng |
| Sơ đồ bàn | Chọn khu vực · Lọc bàn · Làm mới · Mở đơn theo bàn · Mở đơn từ danh sách đơn đang mở · Điều hướng các mô-đun |

Cái thay đổi là **thứ bậc thị giác, nhóm và vị trí**, không phải số lượng việc người dùng phải làm.

## Những điểm đáng so sánh giữa `00` và `01`

| Điểm | Hiện trạng | Bản thiết kế lại |
| --- | --- | --- |
| Số tiền phải trả | Cùng cỡ với các dòng khác, nằm lẫn trong khối tổng kết | Khối riêng trên đầu quầy thu ngân, nền nhấn, cỡ lớn nhất màn |
| Độ đậm chữ | Gần như mọi chữ đều ở mức 700–900 | Bốn mức; số tiền tổng là thứ duy nhất ở mức 700 |
| Nút liên quan tiền ở đầu màn | 36px, hạ còn 30px dưới 900px | 44px ở mọi bậc |
| Nút xác nhận thanh toán | 36px, cùng cỡ mọi nút khác | 60px, hạ 52px ở compact, rộng hết vùng |
| Viền ô nhập tiền | 1,35:1 | 3,49:1 |
| Bàn phím số | Phím 34px, gap bóp còn 4px dưới 900px | Phím 52px, gap 8px ở mọi bậc |
| Tiền thối | Cùng kiểu với các dòng khác | Màu và cỡ riêng, đọc được từ xa |
| Bậc dưới 900px | Cuộn ngang | Xếp dọc |

## Bước kế tiếp

1. Chủ dự án duyệt hoặc nêu điểm cần sửa. Sửa ở tầng token rẻ hơn nhiều so với sửa sau khi đã thay toàn bộ các màn.
2. Sau khi chốt, lập đặc tả thay đổi theo chuẩn bảy artefact trên nhánh này, lấy đặc tả chiến lược kiểm thử làm khuôn mẫu.
3. Thiết kế lại các bề mặt còn lại theo cụm luồng công việc, dùng chung tệp thông số này.

Thư mục này là artefact triển khai, không phải nguồn nội dung báo cáo. Khi viết báo cáo, mô tả ở mức nguyên tắc thiết kế, khả dụng và kết quả kiểm chứng; không chép bảng giá trị hay định danh kỹ thuật vào chương nội dung.
