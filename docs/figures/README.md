# Bộ hình từ mô hình và luồng hiện hành

Cập nhật 26/10/2026 sau review trực tiếp với code. Bộ **8 ERD + 8 sơ đồ luồng** dùng làm tài liệu đầu vào báo cáo; đọc cùng [data model](../data-model.md) và [critical flows](../critical-flows.md). Nguồn chính là main `711a22e71983e3d6aa17799649af05ce4c762555`. [Hồ sơ review ngữ nghĩa](../reviews/diagram-semantics-20261026/INDEX.md) giữ bảng truy vết và phân biệt origin, WIP, staging và DB trong cấu hình local.

F04/F05/F07/F08 dùng bản sửa `2026-10-26-r2`; 12 hình còn lại dùng bản xuất đầu. Toàn bộ 16 SVG, manifest và config của bản đầu vẫn giữ nguyên để truy lại lịch sử. Không dùng bản F04 đầu để giải thích điểm rẽ retry sau khi đã có bản sửa.

## Danh mục hình hiện hành

| Hình | Nội dung / nguồn giải thích | Bản SVG | Kích thước gốc |
| --- | --- | --- | --- |
| ERD-01 | [Cửa hàng, nhân viên và danh mục quyền](../data-model.md#cửa-hàng-nhân-viên-và-danh-mục-quyền) | [Mở SVG](2026-10-26/erd-01.svg) | 1012 × 675 |
| ERD-02 | [Thực đơn và tùy chọn dùng chung](../data-model.md#thực-đơn-và-tùy-chọn-dùng-chung) | [Mở SVG](2026-10-26/erd-02.svg) | 758 × 675 |
| ERD-03 | [Sơ đồ bàn](../data-model.md#sơ-đồ-bàn) | [Mở SVG](2026-10-26/erd-03.svg) | 516 × 675 |
| ERD-04 | [Đơn, payment, lệnh ghi và event](../data-model.md#đơn-payment-lệnh-ghi-và-event) | [Mở SVG](2026-10-26/erd-04.svg) | 1279 × 485 |
| ERD-05 | [Quản trị và grant in](../data-model.md#quản-trị-và-grant-in) | [Mở SVG](2026-10-26/erd-05.svg) | 1958 × 313 |
| ERD-06 | [Khởi tạo cửa hàng và dữ liệu mẫu](../data-model.md#khởi-tạo-cửa-hàng-và-dữ-liệu-mẫu) | [Mở SVG](2026-10-26/erd-06.svg) | 797 × 485 |
| ERD-07 | [Ảnh món](../data-model.md#ảnh-món) | [Mở SVG](2026-10-26/erd-07.svg) | 683 × 503 |
| ERD-08 | [Tín hiệu và cổng tương thích](../data-model.md#tín-hiệu-và-cổng-tương-thích) | [Mở SVG](2026-10-26/erd-08.svg) | 1121 × 105 |
| F01 | [F01 — Chọn phần thanh toán và kết quả tách đơn](../critical-flows.md#f01) | [Mở SVG](2026-10-26/flow-01.svg) | 1263 × 2351 |
| F02 | [F02 — Đăng ký K và thực hiện giao dịch tài chính](../critical-flows.md#f02) | [Mở SVG](2026-10-26/flow-02.svg) | 812 × 1590 |
| F03 | [F03 — Trạng thái bền vững của lệnh trên DB](../critical-flows.md#f03) | [Mở SVG](2026-10-26/flow-03.svg) | 1045 × 418 |
| F04 | [F04 — Mất phản hồi, thử lại và tra cứu khôi phục](../critical-flows.md#f04) | [Mở SVG](2026-10-26-r2/flow-04.svg) | 874 × 1657 |
| F05 | [F05 — Đăng nhập nhân viên và phiên đổi PIN bắt buộc](../critical-flows.md#f05) | [Mở SVG](2026-10-26-r2/flow-05.svg) | 1110 × 1763 |
| F06 | [F06 — Hoàn tất đổi PIN bắt buộc trong một transaction](../critical-flows.md#f06) | [Mở SVG](2026-10-26/flow-06.svg) | 811 × 1194 |
| F07 | [F07 — Làm mới authority và mất quyền khi đang thao tác](../critical-flows.md#f07) | [Mở SVG](2026-10-26-r2/flow-07.svg) | 1850 × 1574 |
| F08 | [F08 — Signal rồi đọc lại dữ liệu có quyền](../critical-flows.md#f08) | [Mở SVG](2026-10-26-r2/flow-08.svg) | 1047 × 1441 |

## Nội dung đã sửa

- **F04:** phân biệt kết quả execute của retry với kết quả get của lookup. Get pending rồi execute applied/rejected/expired phải đi theo kết quả execute; không bị diễn giải thành pending từ get cũ.
- **F05:** nhánh applied về đăng nhập, lỗi PIN/input giữ màn, lỗi phiên/revision hoặc kết quả chưa rõ về đăng nhập. Điểm rẽ kết quả cũng giúp các đường nối không đi qua ô chặn gửi.
- **F07:** response request/generation cũ hoặc đến sau deadline bị bỏ qua; deadline của lượt hiện hành vẫn đưa UI về unavailable. Không đồng nhất response cũ với lỗi phiên.
- **F08:** ACK và signal sau commit không có thứ tự nhận bảo đảm. Nhánh nhận signal, lọc store và đọc query có điều kiện; vẫn có kiểm quyền/generation sau response. Signal có thể bị bỏ lỡ và chỉ một số query có poll dự phòng.

Các hình còn rút gọn tầng adapter/HTTP và một số nhánh chi tiết; chú thích ở trang nguồn là một phần của tài liệu. WIP thiếu guard trước begin và khác recipe ACL; DB local được cấu hình khác staging đã kiểm. [Các khác biệt còn mở](../reviews/diagram-semantics-20261026/INDEX.md#wip) không được giải quyết bằng việc sửa hình.

## Nguồn, kiểm hình và tái xuất

[Manifest r2](2026-10-26-r2/manifest.json) ghim blob/hash trang nguồn, dòng/hash của bốn khối Mermaid, hash SVG/PNG và môi trường renderer. Bốn file `.mmd` cùng thư mục là bản trích nguyên văn chuẩn LF từ trang nguồn. Blob/hash tránh vòng phụ thuộc giữa commit chứa manifest và chính manifest. [Manifest bản đầu](2026-10-26/manifest.json) tiếp tục nhận diện 12 hình đang dùng và 4 hình lịch sử.

Bốn hình r2 đã parse/render bằng Mermaid 12.2.0, kiểm XML không chứa script/foreignObject/tài nguyên ngoài, kiểm hộp chữ trong viewBox và xem PNG ở kích thước gốc. Kết quả review độc lập của candidate cuối được ghi tại [handoff](../workflow/tasks/docs-flow-corrections-2026-10-26.md). Review của bản xuất đầu và review ngữ nghĩa trước sửa là các checkpoint riêng, không tự duyệt bản sửa này.

Recipe r2: lấy định nghĩa `.mmd` và kiểm hash; kiểm nó khớp khối Mermaid tương ứng trong trang nguồn theo blob/SHA256. Dùng bundle Mermaid 12.2.0 cùng URL/hash ở manifest, nạp local trong trang trống và chặn network. Áp `base` cùng overrides trong [config r2](2026-10-26-r2/renderer-config.json), đợi font Arial, parse rồi render. Đặt nền SVG trắng, width/height theo viewBox, thêm title/desc nguồn. Không tải renderer/browser vào repo.

Postprocess giữ tọa độ chữ và đường nối: state dùng nền trắng cho `.edgeLabels rect.background`; sequence thêm rect trắng theo bbox của `text.messageText` (padding ngang 2, dọc 0), đặt các rect rồi chữ lên cuối cùng trong SVG. R2 áp thêm cùng nền cho `text.loopText, text.sectionTitle` trong group control-structure không có transform, đặt rect rồi chữ cuối cùng trong cùng group. Dừng nếu cấu trúc/tọa độ DOM khác giả định. Bước này tránh lifeline xuyên chữ, không đổi message/node/edge. Xuất SVG rồi chụp PNG, kiểm nhánh, mũi tên, chữ và hash trước khi dùng.

SVG giữ vector; font hệ thống không nhúng nên cần kiểm lại khi nhập môi trường khác. ERD-05 và F07 rộng, một số flow dài; chưa nhận vừa một trang A4 hoặc đã kiểm Word/PDF/in. Chưa có hình kiến trúc tổng thể theo mẫu trường; HTML kiến trúc cũ không được mở hoặc xác minh trong lượt này. Các gate runtime/backend/deploy/hardware và P1-03/N4/H1–H4 còn mở.
