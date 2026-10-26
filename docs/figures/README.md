# Bộ hình từ mô hình và luồng hiện hành

Cập nhật 26/10/2026. Bộ **8 ERD + 8 sơ đồ luồng** được xuất từ Mermaid đã có ở [data model](../data-model.md) và [critical flows](../critical-flows.md). Các khối Mermaid giữ nguyên; SVG là bản xuất để đọc, phóng to và làm đầu vào dàn trang báo cáo. Không có yêu cầu hoặc hành vi hệ thống mới.

Nguồn đầu vào là docs `1751c2fefb7ce8accc2922af94b0083cf3321e3f`, mô tả main `711a22e71983e3d6aa17799649af05ce4c762555`. Các phạm vi metadata staging vẫn theo N1/N2; lượt xuất hình **không kiểm lại DB hoặc nghiệm thu sản phẩm**. Đọc chú thích và giới hạn bên cạnh Mermaid ở trang nguồn khi dùng từng hình; SVG riêng không thay toàn bộ phần giải thích.

## Chọn hình và dùng đúng phạm vi

- SVG giữ chữ và đường nét dạng vector, có title/description ghi nguồn. Chỉ giữ bản xuất SVG trên docs; PNG dùng kiểm hình ở artifact local được ghi hash trong manifest. Không đưa bundle renderer/browser vào Git.
- Mã ERD-01–08 ở đây chỉ là tên hình xuất, không là requirement mới; F01–F08 giữ mã hình đã có. ERD thể hiện quan hệ FK chọn lọc, không phải mọi cột/FK. Bảng đứng riêng nghĩa là hình không nối FK, không có nghĩa nó độc lập về nghiệp vụ.
- Đây là **hình kỹ thuật đầu vào**, chưa phải bộ hình dàn trang theo mẫu trường. ERD-05 rất rộng; F01/F02/F04/F05/F07 nhiều bước. Khi viết, chọn trang ngang hoặc tách hình và kiểm cỡ chữ, giữ đầy đủ nhánh/transaction/giới hạn; không ép mọi hình vào một trang nhỏ.
- Phông Arial dùng từ hệ thống, không nhúng font. Đã kiểm ảnh ở Chromium của lượt này; cần kiểm lại sau nhập Word/PDF hoặc đổi font. Chưa xác minh bản in, máy in hay nội dung báo cáo cuối.
- Hình kiến trúc tổng thể dành riêng cho báo cáo chưa được bổ sung trong gói này. HTML kiến trúc cũ và checklist H1–H4 vẫn chưa được xác minh hiển thị/tương tác/in; không dùng kết quả render SVG thay việc đó.

## Danh mục hình

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
| F04 | [F04 — Mất phản hồi, thử lại và tra cứu khôi phục](../critical-flows.md#f04) | [Mở SVG](2026-10-26/flow-04.svg) | 874 × 1601 |
| F05 | [F05 — Đăng nhập nhân viên và phiên đổi PIN bắt buộc](../critical-flows.md#f05) | [Mở SVG](2026-10-26/flow-05.svg) | 833 × 1514 |
| F06 | [F06 — Hoàn tất đổi PIN bắt buộc trong một transaction](../critical-flows.md#f06) | [Mở SVG](2026-10-26/flow-06.svg) | 811 × 1194 |
| F07 | [F07 — Làm mới authority và mất quyền khi đang thao tác](../critical-flows.md#f07) | [Mở SVG](2026-10-26/flow-07.svg) | 1478 × 1533 |
| F08 | [F08 — Signal rồi đọc lại dữ liệu có quyền](../critical-flows.md#f08) | [Mở SVG](2026-10-26/flow-08.svg) | 1007 × 1030 |

## Kết quả kiểm và tái xuất

[Manifest](2026-10-26/manifest.json) ghi source blob, vị trí/hash từng khối Mermaid, 16 hash SVG, kích thước, môi trường và hash PNG đã xem. [Cấu hình](2026-10-26/renderer-config.json) ghi style/layout, override độ rộng nhãn và bước thêm nền chữ sau render; [handoff](../workflow/tasks/docs-diagram-exports-2026-10-26.md) giữ review và phạm vi công việc.

16/16 khối đã qua parser và renderer Mermaid 12.2.0, xuất SVG thuần (không script, ảnh ngoài hoặc foreignObject). Kiểm hộp chữ nằm trong viewBox đạt; tác giả đã mở cả 16 PNG và rà chữ/nhánh/mũi tên. Review độc lập phát hiện đường nối xuyên chữ ở F02/F03/F06/F08; bản xuất đã thêm nền trắng cho nhãn và kiểm lại bốn hình này, không còn quan sát chữ bị cắt hoặc đường xuyên chữ ở kích thước gốc. Kiểm hộp chữ không tự phát hiện mọi đường giao nhau hoặc chứng minh bố cục trên mọi trình đọc. Đã chỉnh cấu hình để tên bảng/cột và mã PAYMENT_AMOUNT_TOO_LOW không bị ngắt giữa từ; không đổi text, node hoặc edge trong source.

Recipe tái xuất:

1. Lấy hai file Markdown ở đúng docs SHA trong manifest, trích 8 khối Mermaid mỗi file theo thứ tự. Chuẩn hóa CRLF→LF và giữ một newline cuối để kiểm `mermaid_sha256_lf`; không chép source từ screenshot.
2. Dùng bundle Mermaid 12.2.0 tại URL/hash trong manifest, theo [API chính thức](https://mermaid.js.org/config/usage.html). Không đưa toàn bộ source dự án lên dịch vụ render bên ngoài. Lượt này chỉ tải bundle tĩnh; lúc render chặn mọi request mạng.
3. Áp `base` trong cấu hình, gộp `erOverrides` cho ERD và `diagramOverrides` theo ID nếu có. Font Arial sẵn trên máy; đợi font sẵn trước parse/render. Dùng canvas trắng, layout Dagre, SVG text thay nhãn HTML.
4. Gọi parser rồi renderer với từng khối; áp `postprocess` của cấu hình trên SVG đã gắn vào DOM. Đặt nền SVG trắng. Với state diagram, đặt fill/fill-opacity/opacity của `.edgeLabels rect.background` thành trắng/1/1. Với sequence, đo `getBBox()` của từng `text.messageText` ở trực tiếp dưới SVG; thêm tất cả rect nền trắng tại bbox (padding ngang 2, dọc 0 đơn vị SVG), rồi đưa các text đó lên cuối cùng trong cùng SVG. Không đổi tọa độ chữ, path, marker hoặc nội dung. Nếu cấu trúc DOM khác, dừng và kiểm lại thay vì áp lên tọa độ chưa biết.
5. Ghi `width/height` từ viewBox, thêm title/description nguồn và xuất UTF-8 SVG; chụp PNG để kiểm. Các file SVG đã có có thể xem độc lập mà không cài renderer. Byte output có thể khác khi đổi runtime/font; bản đã duyệt được nhận diện bằng hash, không nhận bản mới chỉ vì cùng tên.
6. Kiểm XML, link/nguồn và phạm vi; mở hình ở kích thước gốc, rồi kiểm lại bản nhập tài liệu đích. Reviewer kiểm độc lập trước khi cập nhật bộ hình trên docs.

Không chạy suite sản phẩm, không mở HTML bị chặn trước đó, không tạo môi trường WSL/Docker hoặc thay DB. Kiểm hiện trạng/schema/source vẫn xem tại trang gốc; renderer không chứng minh các claim đó.
