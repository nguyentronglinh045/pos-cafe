# Bộ hình từ mô hình và luồng hiện hành

Cập nhật 26/10/2026 sau review trực tiếp với code. Bộ **8 ERD + 8 sơ đồ luồng + 2 hình kiến trúc** dùng làm tài liệu đầu vào báo cáo; đọc cùng [data model](../data-model.md) [critical flows](../critical-flows.md) và [kiến trúc A01/A02](../architecture-diagrams.md). Nguồn chính là main `711a22e71983e3d6aa17799649af05ce4c762555`. [Hồ sơ review ngữ nghĩa](../reviews/diagram-semantics-20261026/INDEX.md) giữ bảng truy vết và phân biệt origin, WIP, staging và DB trong cấu hình local.

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
| A01 | [A01 — Lời gọi và ranh giới thực thi](../architecture-diagrams.md#a01) | [Mở SVG](2026-10-26-architecture/architecture-01.svg) | 784 × 967 |
| A02 | [A02 — Phụ thuộc module và điểm ghép adapter](../architecture-diagrams.md#a02) | [Mở SVG](2026-10-26-architecture/architecture-02.svg) | 569 × 552 |

<a id="chu-thich"></a>
## Chú thích để chọn và sử dụng hình

Bảng này cung cấp câu chú thích ở mức thiết kế/nghiệp vụ; dùng cùng trang nguồn và đúng SVG trong danh mục trên. Đây là nguyên liệu cho người viết, chưa đổi nhãn trong hình hoặc nhận đã dàn trang theo mẫu trường. Không sao chép hình có tên file/symbol vào báo cáo nếu chưa chuyển các nhãn đó thành vai trò thiết kế theo [quy tắc đầu vào](../report-source-map.md). ERD vật lý có thể giữ tên bảng/cột cần trình bày trong phần thiết kế dữ liệu.

| Hình / trang nguồn | Chú thích gợi ý | Giới hạn cần giữ khi diễn giải |
| --- | --- | --- |
| [ERD-01](../data-model.md#cửa-hàng-nhân-viên-và-danh-mục-quyền) | Quan hệ giữa cửa hàng, nhân viên, phiên và danh mục phân quyền. | Quan hệ dữ liệu không tự chứng minh quyền truy cập đã được kiểm. |
| [ERD-02](../data-model.md#thực-đơn-và-tùy-chọn-dùng-chung) | Mô hình thực đơn và nhóm tùy chọn được dùng chung giữa các món. | Không suy thêm ràng buộc duy nhất của cặp món–nhóm nếu DDL không khai báo. |
| [ERD-03](../data-model.md#sơ-đồ-bàn) | Quan hệ khu vực, bàn, vật trang trí và đơn gắn với bàn. | Đơn mang đi có thể không gắn bàn; tối đa một đơn mở trên bàn không cấm nhiều đơn lịch sử. |
| [ERD-04](../data-model.md#đơn-payment-lệnh-ghi-và-event) | Liên kết dữ liệu đơn, thanh toán, lệnh ghi và sự kiện tài chính. | Phân biệt kết quả lệnh được lưu với trạng thái đơn hiện tại. |
| [ERD-05](../data-model.md#quản-trị-và-grant-in) | Dữ liệu quản trị, nhật ký kiểm toán và quyền in được cấp theo thao tác. | Các liên kết logic/audit không được tự vẽ thành khóa ngoại; quyền in lại là quyền riêng. |
| [ERD-06](../data-model.md#khởi-tạo-cửa-hàng-và-dữ-liệu-mẫu) | Dữ liệu điều phối khởi tạo cửa hàng và nạp dữ liệu mẫu ban đầu. | Khởi tạo/retry khác khôi phục mẫu sau xóa đã hoãn theo R06. |
| [ERD-07](../data-model.md#ảnh-món) | Quan hệ dữ liệu quản lý ảnh món từ tải tạm đến công bố. | Dữ liệu ảnh trong Storage và dữ liệu quan hệ không nằm trong một transaction chung. |
| [ERD-08](../data-model.md#tín-hiệu-và-cổng-tương-thích) | Nhóm dữ liệu tín hiệu thay đổi và kiểm soát tương thích ứng dụng. | Các bảng rời không hàm ý thiếu FK trong hình; định tuyến logic không phải FK. |
| [F01](../critical-flows.md#f01) | Thanh toán toàn bộ đơn hoặc tách phần món được chọn thành đơn độc lập. | Ví dụ là minh họa nghiệp vụ, không phải giao dịch đã chạy trên staging. |
| [F02](../critical-flows.md#f02) | Đăng ký lệnh và thực thi giao dịch tài chính có kiểm quyền. | Đăng ký và thực thi là hai transaction; mạng và in không nằm trong transaction DB. |
| [F03](../critical-flows.md#f03) | Các trạng thái bền vững của lệnh ghi trên cơ sở dữ liệu. | Chưa rõ kết quả là trạng thái nhận biết ở client; hết hạn không chứng minh có tác vụ nền quét lệnh. |
| [F04](../critical-flows.md#f04) | Tra cứu và thử lại cùng ý định khi mất phản hồi. | Giữ phân biệt kết quả tra cứu với kết quả thực thi; không tự gửi lại khi reconnect. |
| [F05](../critical-flows.md#f05) | Đăng nhập nhân viên và điều hướng phiên bắt buộc đổi mã PIN. | Phiên hạn chế chưa cấp quyền vận hành; không đại diện cho tài khoản chủ/email/chuyển sở hữu. |
| [F06](../critical-flows.md#f06) | Hoàn tất đổi PIN bắt buộc và thu hồi phiên trong một transaction. | Đổi PIN thành công không tự cấp phiên vận hành; mất phản hồi có nhánh xử lý riêng. |
| [F07](../critical-flows.md#f07) | Xác minh lại quyền và xử lý thay đổi quyền trong phiên làm việc. | Chu kỳ/deadline là cấu hình, không phải giới hạn độ trễ được bảo đảm khi offline/lỗi server. |
| [F08](../critical-flows.md#f08) | Nhận tín hiệu thay đổi rồi đọc lại dữ liệu theo quyền hiện hành. | Không cam kết mọi signal đến hoặc đến theo thứ tự; một số dữ liệu không có live polling. |
| [A01](../architecture-diagrams.md#a01) | Thành phần khi ứng dụng hoạt động và ranh giới thực thi kiểm quyền. | Chiều gọi khác chiều phụ thuộc; Auth, RPC và Realtime là các đường riêng, chưa xác nhận deployment. |
| [A02](../architecture-diagrams.md#a02) | Chiều phụ thuộc giữa các nhóm module và điểm ghép adapter. | Hình chỉ giữ các cạnh chính của production source; test có ngoại lệ và features vẫn phụ thuộc framework. |

Đối với cả tám ERD, đây là góc nhìn rút gọn theo nguồn: đọc [từ điển dữ liệu](../data-dictionary.md) để lấy đầy đủ FK/nullability/constraint; nét đứt trong ERD không có cùng nghĩa với nét đứt signal ở A01. Các hình F/A không thay kết quả kiểm runtime. F01/F02/F04 còn phải giữ [khác biệt WIP](../reviews/diagram-semantics-20261026/INDEX.md#wip) khi chọn nguồn báo cáo.

Mỗi hình dùng trong báo cáo cần giữ một bản ghi nguồn nội bộ: ID hình → trang/khối nguồn → ref code và ngày đối chiếu → đúng file SVG/hash trong manifest → chú thích/phạm vi → vị trí dùng trong báo cáo. Ref/hash là dữ liệu truy vết nội bộ, không phải chữ bắt buộc in dưới hình. Câu nguồn có thể diễn đạt “Tổng hợp từ thiết kế và mã nguồn hệ thống, bản đối chiếu ngày 26/10/2026”; không gọi là ảnh chụp DB hoặc kết quả triển khai. Chọn số hình và quy cách nguồn theo mẫu trường khi có, không tự đánh số chương ở kho docs.

## Nội dung đã sửa

- **F04:** phân biệt kết quả execute của retry với kết quả get của lookup. Get pending rồi execute applied/rejected/expired phải đi theo kết quả execute; không bị diễn giải thành pending từ get cũ.
- **F05:** nhánh applied về đăng nhập, lỗi PIN/input giữ màn, lỗi phiên/revision hoặc kết quả chưa rõ về đăng nhập. Điểm rẽ kết quả cũng giúp các đường nối không đi qua ô chặn gửi.
- **F07:** response request/generation cũ hoặc đến sau deadline bị bỏ qua; deadline của lượt hiện hành vẫn đưa UI về unavailable. Không đồng nhất response cũ với lỗi phiên.
- **F08:** ACK và signal sau commit không có thứ tự nhận bảo đảm. Nhánh nhận signal, lọc store và đọc query có điều kiện; vẫn có kiểm quyền/generation sau response. Signal có thể bị bỏ lỡ và chỉ một số query có poll dự phòng.

Các hình còn rút gọn tầng adapter/HTTP và một số nhánh chi tiết; chú thích ở trang nguồn là một phần của tài liệu. WIP thiếu guard trước begin và khác recipe ACL; DB local được cấu hình khác staging đã kiểm. [Các khác biệt còn mở](../reviews/diagram-semantics-20261026/INDEX.md#wip) không được giải quyết bằng việc sửa hình.

## Nguồn, kiểm hình và tái xuất

Hai hình kiến trúc dùng [manifest riêng](2026-10-26-architecture/manifest.json) và [config renderer](2026-10-26-architecture/renderer-config.json). Các file `.mmd` là nguyên văn khối Mermaid ở trang nguồn; SVG có title/desc ghi phạm vi. Đã parse/render và xem PNG, kiểm hộp chữ, hash và link; [handoff A01/A02](../workflow/tasks/docs-architecture-overview-2026-10-26.md) giữ kết quả review riêng. Nhãn cạnh được đặt nền trắng, nhãn khung được nâng lên với nền cùng màu khung để không có nét xuyên chữ; không đổi ý nghĩa hay tọa độ đường nối. Để tái xuất, nạp Mermaid 12.2.0 với `base` trong config, render từng `.mmd` rồi áp dụng `postprocess`; PNG là bản QA local, không nằm trong nhánh docs.

[Manifest r2](2026-10-26-r2/manifest.json) ghim blob/hash trang nguồn, dòng/hash của bốn khối Mermaid, hash SVG/PNG và môi trường renderer. Bốn file `.mmd` cùng thư mục là bản trích nguyên văn chuẩn LF từ trang nguồn. Blob/hash tránh vòng phụ thuộc giữa commit chứa manifest và chính manifest. [Manifest bản đầu](2026-10-26/manifest.json) tiếp tục nhận diện 12 hình đang dùng và 4 hình lịch sử.

Bốn hình r2 đã parse/render bằng Mermaid 12.2.0, kiểm XML không chứa script/foreignObject/tài nguyên ngoài, kiểm hộp chữ trong viewBox và xem PNG ở kích thước gốc. Kết quả review độc lập của candidate cuối được ghi tại [handoff](../workflow/tasks/docs-flow-corrections-2026-10-26.md). Review của bản xuất đầu và review ngữ nghĩa trước sửa là các checkpoint riêng, không tự duyệt bản sửa này.

Recipe r2: lấy định nghĩa `.mmd` và kiểm hash; kiểm nó khớp khối Mermaid tương ứng trong trang nguồn theo blob/SHA256. Dùng bundle Mermaid 12.2.0 cùng URL/hash ở manifest, nạp local trong trang trống và chặn network. Áp `base` cùng overrides trong [config r2](2026-10-26-r2/renderer-config.json), đợi font Arial, parse rồi render. Đặt nền SVG trắng, width/height theo viewBox, thêm title/desc nguồn. Không tải renderer/browser vào repo.

Postprocess giữ tọa độ chữ và đường nối: state dùng nền trắng cho `.edgeLabels rect.background`; sequence thêm rect trắng theo bbox của `text.messageText` (padding ngang 2, dọc 0), đặt các rect rồi chữ lên cuối cùng trong SVG. R2 áp thêm cùng nền cho `text.loopText, text.sectionTitle` trong group control-structure không có transform, đặt rect rồi chữ cuối cùng trong cùng group. Dừng nếu cấu trúc/tọa độ DOM khác giả định. Bước này tránh lifeline xuyên chữ, không đổi message/node/edge. Xuất SVG rồi chụp PNG, kiểm nhánh, mũi tên, chữ và hash trước khi dùng.

SVG giữ vector; font hệ thống không nhúng nên cần kiểm lại khi nhập môi trường khác. ERD-05 và F07 rộng, một số flow dài; chưa nhận vừa một trang A4 hoặc đã kiểm Word/PDF/in. A01/A02 đã bổ sung kiến trúc có nguồn nhưng nhãn còn ở mức tài liệu kỹ thuật; chưa chuyển sang bản dàn trang/nhãn theo mẫu trường; HTML kiến trúc cũ không được mở hoặc xác minh trong lượt này. Các gate runtime/backend/deploy/hardware và N4/H1–H4 còn mở. P1-03 được đánh giá theo đầu ra kho tài liệu tại [handoff gói đầu vào](../workflow/tasks/docs-report-inputs-2026-10-26.md), không theo việc đã nộp báo cáo hoặc nghiệm thu sản phẩm.
