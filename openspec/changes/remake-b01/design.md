# B01 — Thiết kế triển khai

## Quyết định đã duyệt

Owner trả lời “duyệt ạ” sau khi được trình normalized v2, DEV-01…07, reference/contract hashes và thresholds. Đây là duyệt scope/reference để triển khai theo yêu cầu gốc; màu/font không hỏi lại. Xem docs/workflow/tasks/remake-b01-2026-10-19-owner-approval.md và intake. Spec này cụ thể hóa đúng nội dung đó, không thêm quyết định nghiệp vụ.

## Hiện trạng được đọc từ main 2da0d7e

FloorWorkspace.tsx:43–86 giữ activeArea/query/refetch-before-open/filter; :118 refresh; :145–159 states; :244–303 order list. LeftNav.tsx:16–25 canAccess/guardedOpen, :135 lock. AppShell.tsx:36 drawer registry. ScaledFloorStage.tsx:94 fit; floorStage.ts:1 stage1600×900; PortalDrawer.tsx:30 offset176/68. Không thay ports, features, store actions, mutations hay domain.

## Cấu trúc

- Adapter src/theme/remakeTheme.ts lấy JSON canonical, tạo CSS vars và MUI theme từ một nguồn. RemakeTheme scope/provider áp vào AppShell và các portal liên quan; legacy screens không rewrite hàng loạt. Font local từ ui-remake/fonts có OFL/provenance.
- Styles qua Tailwind plugin/semantic classes scoped .ui-remake, giữ Tailwind là pipeline chính. Không import ảnh actual làm expected hoặc import reference HTML vào runtime. Icon paths xuất từ thiết kế được kiểm riêng, không dùng font icon online.
- FloorWorkspace giữ hook/callback nghiệp vụ; chia header/order panel và stage presentation. Dùng settings query hiện hữu cho tên quán, không hardcode POS Demo. Panel thu gọn là UI state, đóng/khôi phục focus; drawer offset biến --workspace-rail-width dùng chung.
- ScaledFloorStage thêm lựa chọn minScale/scroll cho B01, mặc định giữ fit của floor editor. Logical coords/size không đổi. Label/object boost giữ công thức nguồn; test và browser hit-test sau scale.
- Summary seats và occupancy tính từ dữ liệu hiện có, không ghi domain. Tên dài ellipsis có title; lists/tabs/canvas cuộn trong container, controls chính44px.

## Dữ liệu/lỗi

Không schema/migration/API mới. UNKNOWN và FORBIDDEN đã có; không tạo mã lỗi domain cho lỗi layout. Empty floor “Chưa có bàn. Vào Sơ đồ để tạo bàn.”; loading “Đang tải sơ đồ...”; orders loading “Đang tải đơn đang mở...”; empty dine-in “Chưa có đơn tại bàn.”.

## Trade-offs và giới hạn

Giữ canvas thay card raw vì dữ liệu sàn phải giữ nguyên. Giữ click mở drawer và order list thay preview chọn bàn vì không đổi nghiệp vụ. Không thêm search/zoom/chuyển/gộp/ca làm/VAT vì không có đối ứng được giao. Scroll nội bộ thay fit nhỏ tại568×320 để bảo vệ target. Bàn tùy chỉnh quá nhỏ/gần nhau cần ca biên và ghi finding, không hứa mọi bố trí không chồng. Live Stitch không truy cập được; normalized từ PNG là inference đã được owner duyệt. Chỉ defaultFHD có fidelity; còn lại responsive.

## Rủi ro

MUI CssBaseline/global legacy font và portal nằm ngoài DOM scope có thể lệch theme; dùng provider+token scope và browser test portal. Sidebar rộng260 cần regression offset toàn bộ drawer; không sửa nội dung các màn B02/B03 trong slice này. Audit legacy ngoài slice phải phân loại/ghi giới hạn, không lặng lẽ sửa hay accept baseline.


Làm rõ offset sau đối chiếu source: PortalDrawer mặc định viewport=screen nên inset-0/left0; OrderDrawer và PaymentDrawer giữ mặc định này. CHỈ caller truyền viewport=workspace dùng --workspace-rail-width (260/68 ở shell remake, fallback176/68 cho legacy). PortalPopup hiện cả hai viewport đều inset-0 như baseline; không tự đổi hành vi popup. Không có thao tác nghiệp vụ mới từ việc đổi biến layout.
