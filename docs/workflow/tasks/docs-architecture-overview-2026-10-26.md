# Hai hình kiến trúc theo code — 26/10/2026

## Đề bài, nguồn và phạm vi

Chủ dự án đã chọn tiếp phần hình kiến trúc tổng thể bằng “ok tiến hành đi”, trong session chỉ cập nhật docs theo code/DB thực tế, không sửa code hoặc DB. Quyền xuất bản docs sau kiểm/review đã có trong session. Lượt này thêm A01 (lời gọi/ràng buộc thực thi) và A02 (phụ thuộc module), không đổi kiến trúc ứng dụng. Đây là bảo trì tài liệu, không tạo change OpenSpec hoặc yêu cầu nghiệp vụ mới.

- Docs nền: `2e458f0bd9ad82467bbb3ccd0fbb45654a53c2d0`; origin/docs và docs local khớp trước khi làm.
- Code đối chiếu: `711a22e71983e3d6aa17799649af05ce4c762555` trên origin/main. Local main `5156820f7d6679cd6f8051bdc38419737ffa0c7e` có WIP; không checkout/stash/reset hoặc dùng index chính để commit docs.
- DB: dẫn lại bằng chứng staging N1/N2 và [phân biệt O/W/S/L](../../reviews/diagram-semantics-20261026/INDEX.md). Không truy vấn mới hoặc thay DB; FIN-WIP-02 vẫn mở.
- Checklist ở `D:/Workspace/pos-cafe-docs-priorities.local.md` giữ local-only. Giữ nguyên tất cả tick; P1-03 còn chuyển nhãn/dàn trang theo mẫu trường và evidence runtime, N4/H1–H4 không đóng.

## Kết quả và cách đọc

[Trang nguồn](../../architecture-diagrams.md) chứa hai khối Mermaid, bảng source file/dòng, ranh giới trách nhiệm và các cạnh rút gọn. [Gallery](../../figures/README.md) có 18 hình hiện hành, giữ bản đầu và bản sửa r2 nguyên vẹn. [Manifest A01/A02](../../figures/2026-10-26-architecture/manifest.json) và config ghim source/renderer; .mmd trích nguyên văn để tái xuất.

Phân biệt rõ: AppPorts là hợp đồng được inject; mock/Supabase là lựa chọn composition; app lifecycle có lời gọi port trực tiếp; core nhận callback/timer và features còn phụ thuộc React/Zustand/Query; SQL giữ quyền/giao dịch ngoài TypeScript. Đường Storage/Edge Function và browser print được ghi trong bảng, không giả tạo app server hoặc tuyến RPC cho no-op print seam. Nguồn và động cơ lựa chọn tiếp tục ở architecture/decision/reference hiện có.

## Kiểm trước review

Hai hình parse/render bằng Mermaid 12.2.0, Chromium 151.0.7922.34; dùng thư viện đã có, không cài dependency hoặc tạo môi trường nặng. Renderer nạp bundle local vào trang trắng, chặn network, đóng browser trong finally; không mở HTML kiến trúc cũ. Có 36 hộp chữ, không vượt viewBox. SVG tổng 63548 bytes; có title/desc, không script/foreignObject/tài nguyên ngoài.

Đã tự kiểm PNG: sửa hướng bố cục A01 để đường gọi tiến từ browser xuống backend; kênh Realtime hai chiều có chú giải subscribe/signal; nền nhãn cạnh/khung ngăn nét xuyên chữ. Đây là chỉnh trình bày của hai hình mới, không sửa flow cũ. A02 có cạnh giao nhau giữa features/adapters và core/ports; giao nhau không phải nút nối, mũi tên giữ đích riêng.

Recipe kiểm: đối chiếu từng cạnh/claim với git show ở code ref; kiểm khối Mermaid khớp .mmd và source blob/hash; XML/hash/nhãn/đường dẫn/anchor/source-line; git diff --check; đối chiếu hash index, HEAD và status main, mọi evidence/spec/hình cũ không đổi. Kết quả candidate cụ thể và review ghi trong receipt cuối. Không chạy app suite, không nhận boundary test là PASS mới; không chạy browser E2E, DB hoặc Vercel.

## Review, giải thích và phần còn lại

Hai reviewer độc lập bắt buộc: một người đối chiếu kiến trúc/quyền với code; một người kiểm hình, provenance và bảo toàn. Mỗi reviewer phải APPROVE đúng candidate cuối; receipt chỉ thêm metadata sau verdict. Không dùng review của bộ 16 hình cũ để duyệt A01/A02.

Đường giải thích đã chuẩn bị cho chủ dự án: A01 → bảng ranh giới SQL/Auth → A02 → động cơ/đánh đổi trong architecture. Chưa khẳng định chủ dự án đã đọc hoặc hiểu các hình mới.

Phần còn mở: FIN-WIP-02 và các delta O/W; DB L/deployment; nghiệm thu backend/runtime; N4 khi chọn triển khai; HTML H1–H4; nhãn/kiểu trích dẫn/dàn trang theo mẫu trường và screenshot demo. Những phần này không được đóng bằng việc xuất thêm SVG. Không refactor, không sửa code/tests/config/DB; giữ nguyên evidence và checklist local.
