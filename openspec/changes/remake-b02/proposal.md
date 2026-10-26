> **Điểm đọc26/10/2026:** [chỉ mục UI](../../../docs/ui-evolution.md) và [receipt tích hợp25/10](../../../docs/workflow/tasks/ui-main-docs-integration-2026-10-25.md) giữ trạng thái sau merge. Phần dưới giữ checkpoint/expected của batch; “chưa merge” chỉ thuộc ngày ghi, không là trạng thái hiện tại. Không thay scope, approval hoặc evidence gốc.

# Remake B02 — Đề xuất

B02 chọn món/giỏ hàng hiện dùng layout cũ, min-width620px và nhiều màu riêng. Owner giao remake presentation theo PNG B02, giữ nghiệp vụ và dữ liệu, hỗ trợ landscape từ568×320. Hiện mới dựng normalized độc lập để duyệt, chưa sửa ứng dụng.

Scope: OrderDrawer/OrderMenuPane/OrderCartPane và shared semantic theme cần thiết; modifier/alerts/dirty dialog giữ handler và hợp đồng. Không đổi domain/ports/adapters/SQL, quyền, idempotency, ghi đơn hoặc triển khai B03/B01. Xem docs/workflow/tasks/remake-b02-2026-10-21-intake.md để biết source, mapping,7deviations và hash.

Trade-off: fullscreen hiện hữu thay sidebar raw; dữ liệu mock thật/fallback thay ảnh mẫu không có asset; một CTA chuyển theo trạng thái thay các nút raw chưa có chức năng. Mọi thay đổi này đang ĐỀ XUẤT, owner chưa duyệt. Palette/font không mở lại quyết định.

Không còn câu hỏi phải khảo sát từ code; còn cổng quyết định normalized/deviations/thresholds. Chủ dự án duyệt trước implementation. App gates NOT_RUN; review/tool calibration không nghiệm thu sản phẩm. PR code→main, hồ sơ→docs, merge/deploy giao riêng.

## Trạng thái sau triển khai

Owner đã duyệt v3 ngày21/10; đã triển khai presentation và chạy gate local. Phần proposal bên trên giữ làm lịch sử, không còn là trạng thái hiện tại. Xem docs/workflow/tasks/remake-b02-2026-10-21-implementation.md và audit.md để biết source, kết quả, giới hạn và các cổng còn mở. Không coi owner reference approval là nghiệm thu app hoặc quyền merge/deploy.
