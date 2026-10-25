# Chỉ mục công việc

## Đang theo dõi

- [Làm rõ kho docs và nguồn quyết định — 25/10/2026](docs-knowledge-clarification-2026-10-25.md): AI là đối tượng khai thác chủ yếu; khung12 mục tiêu đã được giảng viên xác nhận theo thông tin chủ dự án; đã xác nhận người chốt và động cơ tách các phần để thích ứng thay UI/DB; ký ức DDD và chi phí code giữ giới hạn nguồn; đã có khung 15 tuần từ 05/10, bảo vệ tuần 16, mục tiêu chạy trên Vercel và kiểm thử local; còn xác định bản cũ làm mốc hồi quy. Checklist vẫn local.

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
