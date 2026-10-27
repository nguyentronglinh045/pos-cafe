# Chỉ mục công việc

## Điều phối G01–G10 — cập nhật 27/10/2026

- [Bảng công việc và việc nên làm tiếp](../g01-g10-plan.md#next): kế hoạch còn lại G01–G10, thứ tự phụ thuộc, trạng thái và cách cập nhật. Đây là điểm đọc trước khi hỏi cần làm gì; các hồ sơ dưới giữ source/trạng thái tại checkpoint của chúng.
G11/G12 tiếp tục để giai đoạn cuối; docs kỹ thuật cập nhật xuyên suốt.

## Cập nhật27/10/2026

- [Refactor code và đồng bộ docs](refactor-safety-2026-10-25/implementation-20261027.md): nối kế hoạch25/10 và bàn giao26/10 với quyền triển khai27/10, các extraction/gates/review/rollback và quyết định NO_CHANGE/HOLD. Đã merge PR15 vào main `052a7d1e156425ea82ed1c9cf978d7ef4d4f3571`; nhánh refactor đã xóa, WIP giữ nguyên. [Biên bản](refactor-safety-2026-10-25/merge-20261027.md); [kiểm lại sau merge](refactor-safety-2026-10-25/merge-20261027.md#closure-20261027) xác nhận CI PASS và đủ điều kiện chốt phạm vi refactor đã chọn. NO_CHANGE/HOLD và nghiệp vụ Report giữ riêng; không có thao tác deploy trong task.


## Đang theo dõi

- [Hoàn thiện gói đầu vào báo cáo — 26/10/2026](docs-report-inputs-2026-10-26.md): mapping chủ đề/luận điểm/nguồn/evidence và chú thích 18 hình; sửa trạng thái G11/G12/R06 còn cũ. Rà điều kiện hoàn tất P1-03 riêng với Word/runtime, không đổi gate sản phẩm hoặc sửa code/DB.

- [Hai hình kiến trúc theo code — 26/10/2026](docs-architecture-overview-2026-10-26.md): lời gọi và phụ thuộc module, ranh giới quyền, hai SVG/Mermaid với bảng truy nguồn. Chỉ docs; giữ WIP/DB/runtime và HTML cũ trong đúng giới hạn.

- [Sửa hình sau review ngữ nghĩa — 26/10/2026](docs-flow-corrections-2026-10-26.md): F04 phân biệt get/execute; làm rõ F05/F07/F08; giữ khác biệt WIP/DB và evidence gốc. Chỉ docs, không sửa code/DB.

- [Xuất hình ERD/luồng — 26/10/2026](docs-diagram-exports-2026-10-26.md): 16 SVG từ Mermaid N1/N2 giữ nguyên; parser/render/kiểm hình và nguồn. P1-03 còn mở; không kiểm HTML cũ, code/DB hoặc runtime sản phẩm.

- [N5 — Truy vết kiểm chứng và xuất bản N3–N5 — 26/10/2026](docs-test-traceability-2026-10-26.md): đủ21 FR/8 NFR có scenario/UC, ca kiểm, evidence hoặc khoảng thiếu; chỉ đọc source/artifact. Chủ dự án đã giao push toàn gói sau kiểm cuối với hai subagent; receipt review ở handoff. Các checkpoint “chưa push” của N3/N4 là lịch sử trước lượt này.

- [N4 — Hòa giải seed/Settings và khóa store — 26/10/2026](docs-requirements-reconciliation-2026-10-26.md): đã đối chiếu và ghi quyết định chủ dự án — nhận vị trí retry hiện tại, hoãn reseed sau xóa, giữ khóa store trong G04; còn đặc tả/kiểm chứng khi triển khai, chỉ docs.
- [N3 — Tài liệu tham khảo theo luận điểm — 26/10/2026](docs-academic-references-2026-10-26.md): tám nguồn nền tảng, hai chuẩn đối chiếu, C01–C11 và giới hạn; phần2 đã push tại d75e41e. Chỉ docs, không code/DB.

- [N2 — Sơ đồ các luồng quan trọng — 26/10/2026](docs-critical-flows-2026-10-26.md): tám hình theo code và metadata DB staging, không sửa code/schema hoặc nghiệm thu runtime.
- [N1 — Thuật ngữ, ERD và từ điển dữ liệu — 26/10/2026](docs-data-model-2026-10-26.md): chuẩn hóa mô hình source và ràng buộc; đã đối chiếu catalog staging qua MCP chỉ đọc, có marker vận hành ngoài mô hình; chưa refactor code hoặc đóng gate backend.

- [Tổ chức năm nhóm docs — 26/10/2026](docs-reorganization-2026-10-26.md): CI/CD, UI, enforcement, lịch sử và HTML kiến trúc; giữ evidence, không refactor; được giao push sau kiểm/review.

- [Chuẩn hóa đường tra cứu tri thức — 25/10/2026](docs-knowledge-reconciliation-2026-10-25.md): danh mục tính năng/G01–G12, quyết định, 16 baseline/delta và evidence; hồi quy tiểu luận21FR/8NFR; giữ các gap và đề nghị tổ chức lại, chưa refactor/push.

- [Kế hoạch refactor an toàn — bàn giao nguồn 26/10/2026](refactor-safety-2026-10-25/README.md#handoff-20261026): nối docs hiện hành, mapping hồi quy/spec/evidence và findings WIP vào kế hoạch 25/10. Chuẩn bị docs đã xong phần nội dung; RF-00/01 đầy đủ, baseline và pilot Report chưa thực hiện; chưa sửa code. Receipt kiểm/review ghi trong hồ sơ kế hoạch.

- [Làm rõ kho docs và nguồn quyết định — 25/10/2026](docs-knowledge-clarification-2026-10-25.md): AI là đối tượng khai thác chủ yếu; khung12 mục tiêu đã được giảng viên xác nhận theo thông tin chủ dự án; đã xác nhận người chốt và động cơ tách các phần để thích ứng thay UI/DB; ký ức DDD và chi phí code giữ giới hạn nguồn; đã có khung 15 tuần từ 05/10, bảo vệ tuần 16, mục tiêu chạy trên Vercel và kiểm thử local; đã xác định phần cũ là tiểu luận từng demo, có ứng viên code/docs tháng 8 để khảo sát hồi quy; chưa xác nhận source demo chính xác. Checklist vẫn local.

- [Đánh giá cấu trúc thư mục main — 25/10/2026](main-structure-assessment-2026-10-25.md): khảo sát main711a22e; giữ phân tầng src, ưu tiên tổ chức tooling/config và shared helpers; 5 boundary tests đạt; chưa refactor.

- [Gom kho lưu trữ và dọn cache — 25/10/2026](archive-consolidation-2026-10-25.md): gom bản lưu/review vào pos-cafe-archive, giữ code/private/trạng thái vận hành; xóa đúng6cache cũ và1thư mục rỗng; có relocation map và kiểm hash/ACL.

- [Dọn worktree code — 25/10/2026](code-worktree-cleanup-2026-10-25.md): đã xóa12 checkout theo danh sách chủ dự án xác nhận, còn main WIP và timeonly711a22e; giữ source/bằng chứng/nhánh cùng recipe khôi phục.

- [Rà soát docs theo 12 mục tiêu tốt nghiệp — 25/10/2026](docs-thesis-audit-2026-10-25.md): mapping mục tiêu–source–evidence–khoảng thiếu; sửa sự kiện đã xác minh, giữ đề nghị hợp nhất/xóa riêng để chủ dự án xem xét; chưa refactor.

- [Đồng bộ worktree docs — 25/10/2026](docs-worktree-sync-2026-10-25.md): đã đối chiếu959file và sync;16snapshot khác và43commit lịch sử giữ riêng. Worktree đã được xóa ở bước tiếp; allowlist dọn cũ không còn áp dụng.

- [Dọn worktree docs đã hết dùng — 25/10/2026](docs-worktree-cleanup-2026-10-25.md): đã xóa cả hai checkout docs sau kiểm chứng; hiện0 worktree docs. Giữ nhánh/lịch sử Git và kho16snapshot.

- [Xuất bản spec/evidence WIP — 25/10/2026](docs-wip-publication-2026-10-25.md): permission15/PIN/CI và lịch sử evidence theo nguồn; bộ hồ sơ đã xuất bản; allowlist dọn được task đồng bộ tiếp nối đánh dấu superseded.

- [Chuẩn hóa docs — 25/10/2026](docs-normalization-2026-10-25.md): đã chỉnh lý, kiểm và có hai APPROVE; evidence giữ nguyên; WIP đã xuất bản/đồng bộ ở task tiếp nối, backend vẫn riêng.
- [Kế hoạch chuẩn hóa sau tích hợp](post-integration-standardization-plan-2026-10-25.md): NC-10 + phần docs của NC-02 đi trước; NC-04…08 chưa mở.
- [Tích hợp UI B01–B03](ui-main-docs-integration-2026-10-25.md): đã merge bốn PR, source main711a22e; backend/deploy HOLD.

## Hồ sơ các checkpoint trước

Các dòng bên dưới là ghi nhận tác giả tại ngày lập. Dòng “chưa merge/draft” của B03 không thay trạng thái tích hợp25/10 ở trên. Muốn tiếp tục task, đọc phần hiện hành của handoff thay vì lấy dòng index lịch sử làm quyền thực hiện.


- [Tích hợp UI B01–B03 vào main/docs, branch cleanup — 25/10/2026](ui-main-docs-integration-2026-10-25.md) — đã merge đủ bốn PR và xóa bốn source branches local+remote; deployment/backend hold giữ nguyên. Hai cache còn do bộ duyệt tự động từ chối xóa.
- [Kế hoạch chuẩn hóa sau tích hợp — rebind theo main711a22e](post-integration-standardization-plan-2026-10-25.md).

- [D7 — CI bộ đo và publish audit](ui-validation-ci-audit-2026-10-19.md): publish công cụ trên main, thêm CI calibration; pilot remake màn thật để task khác.

- [Workflow remake UI Stitch, 19/10/2026](stitch-ui-remake-workflow-2026-10-19.md): đã kiểm/review và push nhánh code/docs; dùng chung Codex/Claude. Chưa remake màn sản phẩm.

- [B03 — Thanh toán: khảo sát và đề xuất trước duyệt](remake-b03-2026-10-22-intake.md).

- [B03 — Kết quả implementation/local mock](remake-b03-2026-10-22-validation.md); [phân loại audit](remake-b03-2026-10-22-audit.md); PR drafts [main](remake-b03-2026-10-22-pr-main.md) / [docs](remake-b03-2026-10-22-pr-docs.md). Review final và bàn giao được ghi riêng.

- [B03 — Bàn giao implementation và2review APPROVE](remake-b03-2026-10-22-handoff.md); chưa push/merge/deploy, audit toàn app còn findings ngoàiB03.
