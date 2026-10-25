# B02 — Thiết kế triển khai đề xuất

Base main2da0d7e; docs4125687. Chưa sửa src. Normalized HTML/CSS/JS độc lập, chỉ đọc fixture public, không import app hoặc dùng actual screenshot làm expected. Raw PNG/hash giữ riêng; live Stitch yêu cầu login.

OrderDrawer.tsx giữ hooks, getOrderPrimaryAction, requiredPermission, coordinator, captureView, submit callbacks và notices. Chỉ thay markup/class presentation, bổ sung selector ổn định và aria-label cho nút. OrderMenuPane giữ callbacks/query flags; OrderCartPane giữ props handlers/total. Không thêm public API/domain field/SQL/mã lỗi.

PortalDrawer giữ viewport screen; layout panel B02 dùng panelClassName riêng để tránh grid auto-row của portal làm alerts chèn sai vùng. Alerts nằm trong vùng cuộn có thể đọc và thao tác được, không bị header/footer che. Modifier/dirty popup giữ nghiệp vụ, typography/color qua cùng MUI provider; không sửa component popup ngoài phần cần scope/theme/accessibility đã duyệt.

Theme chung: tái sử dụng factory/API src/theme/remakeTheme.ts và RemakeThemeProvider từ hướng B01 đã review; dẫn xuất canonical ui-remake/palette-a-v1.json, CSS variables, Tailwind utility mapping và MUI palette/typography từ cùng nguồn. Không chép B01 layout hoặc code chưa publish vào nền main. Font local400/500/600/700 có OFL/provenance. Test portal và cleanup scope khi đóng, provider lồng khi hai remake sau này được merge. Token JSON phải đổi được cả CSS/Tailwind/MUI mà không sửa B02.

Desktop3cột giống cấu trúc nội dung raw: categories220/menu3cols/cart440. <=1599:180/2cols/360;<=1100:categories thành hàng ngang bên menu, cart340;<=760:menu1col/cart248. Height<=480 thu gọn header/search/image, giữ control44. Ma trận exactbreakpoint±1 và sweep trong responsive-contract.proposed.json. Đây là đề xuất cần owner duyệt, không phải reference pixel cho mọi viewport.

Không tự chuyển nhãn Phần đã lưu thành Đã phục vụ. Saved+ giữ nguyên dòng cũ và addDraftMenuItem theo giá/options hiện hành; saved−/new± sửa qty với clamp0…999. Snapshot và source ID được giữ, không tạo order-note khi model không có. Tiền đầy đủ là presentation, vẫn dùng formatVnd/calculateCartTotal hiện hành. Callback thêm món còn mở modifiers nếu cần; các nút reference chỉ trình bày, không mô phỏng gửi đơn thật.

Các lỗi giữ mã hiện có: UNKNOWN,FORBIDDEN,ORDER_VERSION_CONFLICT,MENU_ITEM_UNAVAILABLE,OPTION_VALUE_UNAVAILABLE,PRICE_CHANGED,WRITE_RESULT_UNKNOWN và WriteErrorCode hiện hành. Mapping thông báo từ features/integration/uiError.ts và writeErrors.ts, không dựng thông báo giả/mã mới. HTTP/auth/live schema không thay đổi. RLS/Supabase production NOT_RUN và không dùng mock để chứng minh backend.

Rủi ro: portal font/theme ảnh hưởng layout legacy; cần smoke toàn luồng và phân loại audit ngoài slice. Ảnh thật/broken image khác fallback phải kiểm riêng. Shared B01 theme chưa commit/merge, phải kiểm dependency/merge delta trước xuất bản. Scroll/CTA màn320px cần đo DOM, không chỉ ảnh. Không nới thresholds khi actual chưa đạt.

## Trạng thái sau triển khai

Owner đã duyệt v3 ngày21/10; đã triển khai presentation và chạy gate local. Phần proposal bên trên giữ làm lịch sử, không còn là trạng thái hiện tại. Xem docs/workflow/tasks/remake-b02-2026-10-21-implementation.md và audit.md để biết source, kết quả, giới hạn và các cổng còn mở. Không coi owner reference approval là nghiệm thu app hoặc quyền merge/deploy.
