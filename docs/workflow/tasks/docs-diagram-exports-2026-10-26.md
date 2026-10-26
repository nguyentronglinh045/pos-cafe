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

## Receipt review độc lập — 26/10/2026

Phạm vi cuối: toàn bộ 25 file của gói xuất hình từ docs `1751c2fefb7ce8accc2922af94b0083cf3321e3f` tới candidate `65d6164cfd7c68e9f06e6aa8f9acb8c747e63ed3`, tree `bd754200ef399bf4c02faa7f39ab224c894bbd1a`; checklist local SHA256 `75af32bb3a766fb08a9c2d921390f19655c03dc6bd51992b4e36d187877e7d71`.

| Reviewer | Kiểm độc lập và kết luận cuối | Giới hạn |
| --- | --- | --- |
| `/root/review_knowledge` | **APPROVE** candidate/checklist nêu trên. Đã xem đủ 16 ảnh ở vòng đầu và xem lại F02/F03/F06/F08 sau sửa; nhãn rõ, không còn đường xuyên chữ. Đối chiếu Mermaid, text/hình học cạnh, hash nguồn/SVG/PNG, config/recipe/handoff và checklist; không còn finding chặn. | Không xác nhận A4, Word/PDF, HTML hoặc nghiệm thu sản phẩm. |
| `/root/review_preservation` | **APPROVE** candidate/checklist nêu trên. Kế thừa review toàn gói, kiểm lại hash 16 SVG/PNG, bundle/config, nguồn và tính toàn vẹn text/tọa độ/path/line/marker; XML không có active content/tài nguyên ngoài. Spec/evidence/HTML cũ, main status/index và tick checklist giữ nguyên; diff-check sạch. | Không chạy lại renderer; việc xác nhận bốn hình hết đường xuyên chữ thuộc reviewer hình ảnh. Không kiểm Word/PDF/in. |

Lịch sử finding: tại candidate `e43130d7b5ca5a4fc877df4dea979a4ae3823cd3`, checklist SHA256 `c9c2229d5c0560080b99cd5d5f997bfdbd38d5678b2530f585a588a5134a348d`, reviewer hình ảnh trả **CHANGES_REQUESTED**: F03 có đường pending→expired xuyên nhãn chuyển sang cancelled; F02/F06/F08 có lifeline xuyên chữ self-call. Reviewer preservation đã APPROVE trong phạm vi riêng, nhưng chưa đủ để bàn giao. Tác giả thêm nền trắng cho nhãn, giữ nguyên nội dung và hình học; chỉ bốn PNG này đổi, 12 PNG khác giữ nguyên hash. Reviewer hình ảnh xác nhận đóng finding trên candidate cuối; reviewer preservation cũng xác nhận lại candidate cuối. ERD-05 rộng là lưu ý dàn trang không chặn, đã ghi giới hạn.

Kiểm cuối của tác giả đạt: 16 SVG (469.642 bytes), 344 hộp chữ trong khung, 218 liên kết nội bộ và 81 tham chiếu source ghim; 16 khối Mermaid và nội dung/tọa độ chữ/hình học cạnh giữ nguyên. Không đổi code/DB, evidence/spec/HTML cũ hoặc trạng thái main/index. Checklist giữ P1-03/N4/H1–H4 mở và nằm ngoài Git.

Sau các verdict chỉ bổ sung metadata receipt này, không đổi nội dung/hình đã duyệt. Lượt công việc tiếp tục nhánh docs theo phạm vi đã giao; kết quả push thực tế được ghi riêng ở checklist và receipt local sau khi xác minh remote. Không nhận review là chủ dự án đã đọc, nghiệm thu hay đã hoàn thành báo cáo.
