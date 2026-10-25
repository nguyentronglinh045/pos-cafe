# Chuẩn hóa đường tra cứu tri thức — 25/10/2026

## Phạm vi và nguồn

Chủ dự án yêu cầu “ok vậy tìm hiểu rồi cập nhật giúp tôi” sau Q01–Q10. Cập nhật docs phục vụ AI tra cứu tính năng/quyết định và làm nguyên liệu báo cáo. Docs đầu vào `810e7759df3c9935a95fd09acc525a1cd5995521`; main remote/local ref `711a22e71983e3d6aa17799649af05ce4c762555`, remote docs `9b4fd3acb626a27b3561f3e3d2bfd0d8cad51088`. Giữ các commit docs local có trước; dùng index riêng, không checkout/switch/reset WIP. Lượt này lưu docs local, chưa push; checklist ngoài repo.

## Kết quả của lượt chỉnh lý

- [Features](../../features.md#danh-mục-tra-cứu): một điểm vào theo tính năng/tác nhân/luồng, FR và spec; 12 mục tiêu giữ mã G01–G12, tách hiện thực/kiểm/nghiệm thu/phát hành.
- [Quyết định](../decisions.md): tập hợp nguồn/lý do/phương án/hệ quả, ghi rõ phần chưa xác minh; không biến nhận định AI thành xác nhận của chủ dự án.
- [Spec reconciliation](../../spec-reconciliation.md): 16 capability có đường tới delta; label phần thay thế và câu hỏi còn mở. Banner baseline giữ nguyên byte nội dung yêu cầu; không apply/archive. Sửa trạng thái forced-PIN lỗi thời trong bảng dependency permission.
- [Testing](../../testing.md#bản-đồ-bằng-chứng): map theo source/môi trường/phạm vi/khả năng truy cập; không cộng counts. [Regression map](../../regression-map.md) nối 21 FR/8 NFR tiểu luận với thay đổi, code/test và evidence còn thiếu, chưa là ma trận TC đã chạy.
- README, requirements, roadmap, tech-stack và report-source-map nối các nguồn mới. Đã bỏ cách hiểu code có quyền thay requirement; lịch cũ và evidence vẫn giữ.

## Những khoảng thiếu vẫn được giữ rõ

Owner email/provisioning/chuyển sở hữu chưa hoàn tất, 3 artifact owner còn khung. Forced PIN chỉ owner theo quyết định; scope non-owner không tự mở. Backend/PIN/service profiles còn acceptance HOLD, không đổi bởi merge UI. Join-only modifier có giới hạn. R06 về seed lại Settings và phạm vi khóa store cần hòa giải sâu theo requirement; không thay yêu cầu từ code. Mang đi chưa nhận có batch remake riêng đã nghiệm thu. Chưa có URL/evidence release cuối, bài đo hiệu năng/realtime/restore nguồn cuối, kiểu trích dẫn hoặc bộ hình/Word hoàn chỉnh.

Chưa tìm đủ nguồn xác nhận lý do từng cân nhắc DDD và đúng commit demo tiểu luận. Dùng nhãn chưa xác minh và mốc khảo sát; không hỏi lại câu người dùng đã trả lời chỉ vì chưa biết SHA.

## Đề nghị tổ chức lại, chưa xóa

| Phạm vi cụ thể | Đề nghị để chủ dự án duyệt | Cần giữ / tác động |
| --- | --- | --- |
| `openspec/changes/add-ci-pipeline/proposal.md`, `add-cd-deployment/proposal.md` | Sau rà coverage, đưa phần kế hoạch đã được thay thế ra đường đọc chính, dùng `setup-project-ci-cd` làm điểm vào. Lượt này chỉ thêm banner. | Giữ requirement/backlog chưa phủ, lịch sử phương án và gate; không archive như hoàn tất chỉ vì có YAML. |
| `openspec/changes/redesign-pos-ui/proposal.md`, `week03-b01-b02/`, `remake-b01/`, `remake-b02/`, `remake-b03/` | Dùng features/screens và receipt integration làm điểm vào duy nhất; cân nhắc gom chỉ mục batch, không gom/xóa raw evidence. | Giữ phạm vi mang đi còn lại, quyết định layout và evidence trước–sau từng batch. |
| `openspec/changes/enforce-permissions-at-database/proposal.md` | Giữ phần inventory ngoài catalog15; chỉ rút bớt mô tả đã được thay thế sau khi map requirement xong. | Không bỏ G04, không làm biến mất yêu cầu ngoài phạm vi permission. |
| Lịch gốc và giải thích dài trong `docs/roadmap.md`; checkpoint cũ trong `docs/testing.md` | Có thể chuyển phần lịch sử sang hồ sơ riêng ở lượt được duyệt, giữ anchor/redirect/link consumer. | Ngày, nguồn, FAIL/NOT_RUN, ngân sách và quyết định cũ phải truy vết được; lượt này chưa di chuyển. |
| `docs/architecture-explainer.html` | Cập nhật ví dụ/diagram theo AppPorts hiện hành hoặc đưa rõ vào nhóm tư liệu lịch sử; chưa xóa. | Ví dụ raw repository còn giá trị dạy học nhưng không dùng làm mô tả runtime mới. |
| Frozen runbooks, ZIP/ảnh/raw và snapshot ngoài Git | Chưa đề nghị xóa file cụ thể: cần kiểm consumer, bản thay thế, hash, quyền truy cập và dung lượng trước. | Không coi mọi artifact là temp. Lượt này không xóa/di chuyển/chỉnh byte evidence. |

Không có file được xóa trong lượt này. Danh sách là đề nghị tổ chức tài liệu, không là danh sách chức năng bỏ khỏi đồ án.

## Kiểm chứng và giới hạn

Đối chiếu source quan trọng của catalog/AppPorts/Auth/giao thức ghi/query/signal, 16 baseline và delta liên quan, hồ sơ quyết định và evidence. Không nhận đã đọc thủ công từng dòng toàn kho hoặc tái kiểm runtime. Kiểm link/path/anchor và code link ghim nguồn; hash baseline body/frozen input; main WIP trước/sau; review độc lập trước bàn giao. Không chạy ứng dụng/backend/CI, cài dependency, refactor, deploy, tạo worktree hoặc xóa dữ liệu.

Checklist local chỉ tích các đầu ra đã đạt tiêu chí tài liệu. P1-03 vẫn cần bộ hình/mô hình và việc đọc/trích nguồn học thuật tiếp; map hồi quy không là coverage TC đã nghiệm thu. Mọi kết quả acceptance/phát hành phải cập nhật từ công việc tương ứng, không lấy lượt docs này làm quyền hoặc evidence thay thế.
