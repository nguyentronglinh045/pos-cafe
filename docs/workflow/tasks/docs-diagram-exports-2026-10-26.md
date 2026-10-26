# Xuất hình ERD và luồng từ docs hiện hành

Ngày 26/10/2026. [Bộ hình chuẩn](../../figures/README.md) · [Manifest](../../figures/2026-10-26/manifest.json).

## Phạm vi và nguồn quyền

Sau khi N5 và gói N3–N5 đã xuất bản, chủ dự án yêu cầu “làm tiếp phần tiếp theo”. Đối chiếu checklist, chọn phần xuất hình còn thiếu của P1-03: render 8 ERD và 8 luồng có sẵn, kiểm khả năng đọc, ghi nguồn và nối vào kho docs. Đây là công việc tài liệu trong phạm vi cập nhật hiện trạng; không chọn triển khai N4/owner hoặc tự chốt nghiệp vụ. Giữ quy trình kiểm/review độc lập trước xuất bản đã được chủ dự án yêu cầu.

Docs input `1751c2fefb7ce8accc2922af94b0083cf3321e3f`, main đối chiếu `711a22e71983e3d6aa17799649af05ce4c762555`; đã kiểm remote đầu lượt khớp. Main local HEAD `5156820f7d6679cd6f8051bdc38419737ffa0c7e` có WIP, không dùng làm nguồn mới. Snapshot và index riêng ngoài checkout; không tạo worktree docs, switch/reset/stash/clean hoặc thay index chính.

## Kết quả

- 16 SVG tương ứng nguyên 8 khối Mermaid trong data-model và 8 khối trong critical-flows; không đổi node/edge/text. Manifest giữ source blob, dòng/hash khối, hash SVG, config và môi trường. SVG có title/description nguồn, không script/foreignObject/tài nguyên ảnh ngoài.
- Mermaid 12.2.0 parse/render 16/16. Kiểm tất cả hộp chữ trong viewBox và xem 16 PNG ở kích thước gốc. Sửa ngắt tên cột/tên bảng/mã lỗi bằng cấu hình wrapping/font; không sửa định nghĩa nghiệp vụ. Review phát hiện đường xuyên chữ tại F02/F03/F06/F08: thêm nền trắng cho nhãn state/sequence và đặt chữ sequence trên các đường; giữ nguyên tọa độ, path, marker và Mermaid. Đã xem lại bốn hình sau sửa; recipe và cấu hình ghi bước xử lý trình bày này. Đây là kiểm hình tĩnh, không là kiểm trình duyệt của ứng dụng hoặc DB.
- Cập nhật data-model/critical-flows/source-map/README/task index; receipt cũ N1/N2 và mọi evidence/spec giữ nguyên. Chú thích source map hiện hành phân biệt đã xuất SVG với chưa dàn trang theo mẫu.
- Dùng Playwright 1.62.1/Chromium có sẵn; chỉ tải bundle tĩnh 5.494.801 bytes và license 1.089 bytes vào artifact phiên trên C, hash khớp metadata CDN. Không npm install, tải browser mới hoặc sửa dependency dự án. Đã kiểm C 181,25 GiB/D 97,39 GiB trước tải; ngân sách dự kiến dưới 150 MB. Bundle không vào Git; cấu hình render thuộc artifact tài liệu.

Browser headless chỉ tạo trang trống, nạp bundle local và 16 khối Mermaid; chặn network và đóng trong finally. Không mở `architecture-explainer.html`, không dùng localhost/browser khác để vượt từ chối preview cũ. HTML H1–H4 giữ nguyên trạng thái.

## Giới hạn và phần còn mở

P1-03 vẫn mở: cần hình kiến trúc tổng thể phù hợp báo cáo, bố cục/kích thước/trích dẫn theo mẫu trường, screenshot/demo và evidence runtime còn thiếu. ERD-05 rộng; một số flow dài nên cần dàn trang riêng, chưa nhận vừa một trang A4 hoặc đã kiểm Word/PDF/in. Font hệ thống có thể khác khi nhập sang môi trường khác. N4/owner và các gate backend/deploy/hiệu năng/hardware không đóng.

Checklist ngoài Git chỉ cập nhật tiến độ phần hình và nhật ký; không đổi tick N4/P1-03/H1–H4. Những dòng “chưa render” ở receipt lịch sử vẫn mô tả đúng checkpoint cũ; trạng thái hiện hành ở bộ hình này. Không biến N1/N2 metadata staging cũ thành kiểm DB mới.

## Kiểm cuối và bàn giao

Kiểm candidate: đủ 16 SVG/XML an toàn, source Mermaid giữ nguyên, hash/config/PNG khớp, liên kết/anchor/source ghim, diff-check và bảo toàn main/index/evidence. Review độc lập gồm tính đọc được của hình và tính đúng nguồn/giới hạn/preservation. Candidate/checklist/verdict thật được ghi trong receipt cuối; không nhận kế hoạch review là APPROVE.

Khi cập nhật source sau này, xuất lại đúng hình bị ảnh hưởng và kiểm/review trước thay bộ SVG; không sửa tay SVG để làm khác nội dung Mermaid. Sau nhập vào báo cáo phải kiểm lại dàn trang tại tài liệu đích. Bộ hình không thay việc chủ dự án đọc và giải thích thiết kế.
