# B02 — Requirements đề xuất

| ID | Yêu cầu SHALL | Scenario kiểm chứng |
|---|---|---|
| B02-01 | Trình bày header, categories/menu/cart theo normalized v3 nếu owner duyệt; giữ viewport screen/close guard. | Đơn24/B02 hiển thị đúng fixture125000, dirty+Americano thành160000. |
| B02-02 | Giữ chọn danh mục, search không phân biệt hoa thường trên toàn menu, disabled sold-out và image adapter/fallback. | Gõ Americano ở category khác vẫn tìm được; đổi category xóa search như hiện tại. |
| B02-03 | Giữ requestAdd/modifier validation và confirm/cancel hiện hữu. | Cà phê sữa có popup bắt buộc; Americano thêm trực tiếp; cancel không đổi draft. |
| B02-04 | Giữ đúng saved+ → thêm dòng currentquote, saved−/new± → clamp0…999; ghi chú từng dòng, sourceItemId/options/snapshot giá và calculateCartTotal. | Saved+ không tăng dòng snapshot cũ, thêm dòng giá/options hiện hành. Saved0 còn trong draft, cart ẩn dòng0; giá cũ không bị thay. |
| B02-05 | Giữ primaryAction, permission, disabled/blockers, submit/recovery/preview/payment transition. | Clean mở payment; dirty gửi; thiếu quyền hoặc stale/price/write blocked không được ghi. |
| B02-06 | Giữ loading/error/retry/empty/paid/void và notices, không giấu lỗi để giống ảnh. | Query fail có Thử lại, closed có Đơn đã được cập nhật và CTA disabled. |
| B02-07 | Giữ dirty exit Giữ/Bỏ nháp; bảo toàn pending-navigation/write coordinator. | Đóng dirty → Bỏ đơn chưa gửi?; Tiếp tục chỉnh sửa giữ draft. |
| B02-08 | Dùng được mọi viewport ngang≥568×320; menu/cart/categories scroll riêng, controls44 và focus/touch. | Matrix23viewport, breakpoint±1, sweep và long/list/qty biên theo contract. |
| B02-09 | Dùng chung canonical Palette A JSON→CSS/Tailwind/MUI và Be Vietnam Pro local; không hardcode màu component. | Đổi token chung làm CSS/Tailwind/MUI portal đổi cùng lúc; B01/B02 không có palette tách riêng. |
| B02-10 | Gate/reference/source binding và independent review theo workflow; không tự baseline/merge/deploy. | Hai fidelity cases đạt thresholds đã duyệt, audit chạy/xem/phân loại, mỗi gate có snapshot/log. |

DEV01–07 và hashes trong intake là cổng duyệt, không tự trở thành yêu cầu đã được owner chấp nhận.

## Trạng thái sau triển khai

Owner đã duyệt v3 ngày21/10; đã triển khai presentation và chạy gate local. Phần proposal bên trên giữ làm lịch sử, không còn là trạng thái hiện tại. Xem docs/workflow/tasks/remake-b02-2026-10-21-implementation.md và audit.md để biết source, kết quả, giới hạn và các cổng còn mở. Không coi owner reference approval là nghiệm thu app hoặc quyền merge/deploy.
