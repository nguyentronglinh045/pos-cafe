# Palette A v1 và font dùng cho UI remake

Quyết định áp dụng ngày **2026-10-19**: dùng **Palette A v1 đã sửa tương phản** và **Be Vietnam Pro** cho các slice UI remake sẽ được giao. Hợp đồng viewport tối thiểu là **568×320 CSS px, chiều ngang**. Quyết định này không giao việc đổi hàng loạt giao diện hiện tại.

Nguồn chuẩn có thể thực thi là [ui-remake/palette-a-v1.json trên nhánh code](https://github.com/nguyentronglinh045/pos-cafe/blob/workflow/stitch-ui-remake-code/ui-remake/palette-a-v1.json#L1). Khi lập evidence, ghi commit/hash thật của file; tên nhánh có thể di chuyển. Bảng dưới diễn giải cùng bộ 22 màu, không tạo palette khác.

## Nguồn quyết định và giới hạn

| Mốc | Nội dung và nguồn |
| --- | --- |
| 2026-09-15T13:04:20.796Z | Người dùng chọn **“A”** trong Claude session `fc10f114-32d6-4490-9e28-a8449ba009c3`; [artifact chọn màu](https://claude.ai/artifact/VS6wHCKPGXKsECrqw7TBa9) |
| Bản v1 trước lần chốt này | [Artifact A v1 sửa tương phản](https://claude.ai/artifact/CehuqcxnbUjA1MHXsjyBLH); khi đó v1 còn chờ quyết định |
| 2026-10-19 | Chủ dự án duyệt A v1 đã sửa tương phản + Be Vietnam Pro và chuẩn ngang tối thiểu 568×320; cho tạo quy trình/công cụ đo và push để nhóm dùng; chưa giao làm lại màn hình |

Đây là ghi nhận nguồn quyết định, không xác nhận đã chạy lại các artifact trực tuyến. Không công bố đường dẫn log riêng hoặc bản chép hội thoại thô. Các đề xuất breakpoint, bỏ MUI hoặc thay đổi kiến trúc trong tài liệu cũ **không** được tự nhận là đã duyệt từ quyết định chọn màu/font này. MUI theme khi thực hiện slice phải dẫn xuất từ token chung; quyết định này không yêu cầu gỡ MUI.

## Bộ token chính thức

| Token CSS | Giá trị A v1 | Vai trò |
| --- | --- | --- |
| `--bg` | `#F4F6F9` | Nền ứng dụng |
| `--surface` | `#FFFFFF` | Card, panel, mặt phẳng chính |
| `--surface-2` | `#F8FAFC` | Surface phụ |
| `--surface-sunk` | `#EAEEF4` | Vùng chìm, phân nhóm |
| `--ink` | `#16202F` | Chữ chính |
| `--ink-2` | `#414B5C` | Chữ phụ |
| `--ink-3` | `#667183` | Chữ mức thứ ba |
| `--muted` | `#5B6678` | Chữ hỗ trợ |
| `--line` | `#D5DCE6` | Đường phân cách trang trí |
| `--line-control` | `#7F8A9D` | Viền control cần nhận biết |
| `--primary` | `#0F766E` | Hành động chính |
| `--primary-hover` | `#115E59` | Hover hành động chính |
| `--primary-active` | `#134E4A` | Active/pressed hành động chính |
| `--primary-ink` | `#FFFFFF` | Chữ trên nền primary |
| `--primary-soft` | `#F0FDFA` | Nền nhấn nhẹ |
| `--primary-line` | `#99F6E4` | Viền nhấn trang trí |
| `--success` | `#15803D` | Thành công |
| `--success-soft` | `#ECFDF3` | Nền trạng thái thành công |
| `--warning` | `#9A5B08` | Cảnh báo |
| `--warning-soft` | `#FDF4E7` | Nền cảnh báo |
| `--danger` | `#B4251E` | Lỗi, hủy, thao tác nguy hiểm |
| `--danger-soft` | `#FEF1F0` | Nền lỗi/nguy hiểm |

Ánh xạ theo **vai trò**, không thay một mã màu gốc bằng một mã mới trên toàn ảnh. Một màu teal trong Stitch có thể là chữ, nền nút hoặc đường trang trí; từng vai trò cần mapping riêng. Không hue-rotate bitmap. Ghi mapping trong [mẫu chuẩn hóa](templates.md#chuan-hoa), giữ raw nguyên trạng và duyệt normalized reference trước khi dùng làm expected.

Các màu viền nhẹ không tự đáp ứng mục đích nhận biết control; dùng token đúng vai trò và đo cạnh/nền thực tế. Không mặc định mọi cặp trong bảng đều đạt tương phản. Kiểm chữ, icon, focus, trạng thái hover/active/disabled và nền composited thực khi render; không chỉ kiểm hex riêng lẻ. Tính năng/trạng thái chưa có trong slice không được tự dựng thêm để lấp palette.

## Be Vietnam Pro

`fontFamily` chính thức là **`Be Vietnam Pro`**, các weight đi kèm là **400 / 500 / 600 / 700**. Khai báo font cục bộ; kiểm font đã tải và là family đầu tiên tại các anchor. Có chuỗi fallback trong CSS không chứng minh font chính đã render.

Gói font nằm ở `ui-remake/fonts/`: `BeVietnamPro-Regular.ttf`, `BeVietnamPro-Medium.ttf`, `BeVietnamPro-SemiBold.ttf`, `BeVietnamPro-Bold.ttf`, `OFL.txt` và `provenance.json`; tổng khoảng **0,53 MiB** trong source. Nguồn là Google Fonts commit `47d54ca1ebb14fd864695f1d39dc734f39017c33`, giấy phép **SIL Open Font License 1.1**. Manifest có kích thước, SHA-256, Git blob và URL nguồn của từng file: [provenance.json](https://github.com/nguyentronglinh045/pos-cafe/blob/workflow/stitch-ui-remake-code/ui-remake/fonts/provenance.json#L1), [OFL.txt](https://github.com/nguyentronglinh045/pos-cafe/blob/workflow/stitch-ui-remake-code/ui-remake/fonts/OFL.txt#L1).

Đây là asset đi cùng công cụ, không phải npm dependency mới. Không cần gọi Google Fonts qua mạng khi đo. Actual UI phải tự khai báo và dùng font/token; runner chỉ được chèn CSS chuẩn hóa vào **reference**, không sửa actual để làm kết quả xanh. Xem [capture policy và giới hạn font](measurement.md#capture).

Đổi font có thể đổi wrapping, kích thước nút và mật độ nội dung. Khi chuẩn hóa, kiểm tiếng Việt có dấu, tên dài, số tiền, line-height và các breakpoint theo nội dung; ghi deviation được duyệt. Không lấy kích thước/font suy từ một bitmap làm ground truth chính xác.

## Dùng trong một slice

1. Đọc token/asset ở đúng commit của nhánh code; ghi hash trong config/evidence.
2. Lập mapping ngữ nghĩa từ source Stitch sang token và font này; giữ raw/normalized riêng.
3. Chủ dự án duyệt reference, deviations, viewport và ngưỡng đo được calibration.
4. Chỉ khi được giao triển khai: nối token CSS/Tailwind và MUI theme của slice vào cùng chuẩn, giữ nghiệp vụ/quyền/adapter.
5. Kiểm fidelity nơi có reference, responsive theo [quy trình](README.md), rồi chạy các gate ứng dụng. Việc công bố palette không chứng minh ứng dụng hiện tại đã được chuyển sang chuẩn này.
