# B01 — Yêu cầu đã chốt

## B01-01 — Khung màn hình

Hệ thống SHALL trình bày B01 theo normalized v2 đã duyệt: sidebar, header, toolbar khu vực/bộ lọc, summary, canvas và danh sách đơn. Không thêm thao tác domain từ raw Stitch.

Scenario: dựng fixture main 2da0d7e, thực hiện test trong traceability và quan sát đúng tiêu chí, không đổi nghiệp vụ.

## B01-02 — Canvas động

Hệ thống SHALL giữ id, posX/posY, width/height, rotation, shape, seats, status và asset keys của dữ liệu hiện có trên logical stage 1600×900. Chỉ scale/scroll presentation, không ghi layout.

Scenario: dựng fixture main 2da0d7e, thực hiện test trong traceability và quan sát đúng tiêu chí, không đổi nghiệp vụ.

## B01-03 — Mở đơn

Hệ thống SHALL giữ mở drawer/context bằng đơn cached; khi bàn chưa có đơn cached SHALL refetch listOpenOrders trước khi quyết định orderId. Nhấn order card SHALL mở đúng đơn tại bàn hoặc mang đi.

Scenario: dựng fixture main 2da0d7e, thực hiện test trong traceability và quan sát đúng tiêu chí, không đổi nghiệp vụ.

## B01-04 — Query và trạng thái

Hệ thống SHALL giữ query/poll/invalidation, hai truy vấn refresh và toast hiện tại, all/empty/occupied với occupied = table.status occupied hoặc có open order. Loading/empty/error/retry của floor và orders được giữ.

Scenario: dựng fixture main 2da0d7e, thực hiện test trong traceability và quan sát đúng tiêu chí, không đổi nghiệp vụ.

## B01-05 — Quyền và điều hướng

Hệ thống SHALL giữ nav admin/cashier, guard tại flow/data và lock phiên hiện hữu. Không thêm RPC, migration, quyền hoặc ghi Supabase.

Scenario: dựng fixture main 2da0d7e, thực hiện test trong traceability và quan sát đúng tiêu chí, không đổi nghiệp vụ.

## B01-06 — Theme chung

Mọi màu UI remake SHALL lấy semantic tokens từ ui-remake/palette-a-v1.json qua adapter dùng chung cho CSS/Tailwind và MUI. Font Be Vietnam Pro local 400/500/600/700. Thay token nguồn SHALL cập nhật các bề mặt remake và MUI mà không sửa component. Portal cùng scope theme/font.

Scenario: dựng fixture main 2da0d7e, thực hiện test trong traceability và quan sát đúng tiêu chí, không đổi nghiệp vụ.

## B01-07 — Responsive

Hệ thống SHALL dùng được trên viewport ngang width≥568,height≥320,width>height CSS px. Sidebar 260 (>980)/68 (≤980); order panel 360 thường trực từ1280, mở/đóng dưới1280. Canvas cuộn riêng với scale tối thiểu0,6; offset drawer dùng cùng biến layout.

Scenario: dựng fixture main 2da0d7e, thực hiện test trong traceability và quan sát đúng tiêu chí, không đổi nghiệp vụ.

## B01-08 — Tiếp cận

Controls SHALL có accessible name, focus-visible, target≥44×44; keyboard/touch tới được CTA và bàn sau scroll. Panel thu gọn đóng bằng nút/Escape, focus vào và trở về nút mở; không che bàn khi đóng. Nội dung dài không tạo overflow trang.

Scenario: dựng fixture main 2da0d7e, thực hiện test trong traceability và quan sát đúng tiêu chí, không đổi nghiệp vụ.

## B01-09 — Fidelity

Default1920×1080 SHALL đo bằng normalized độc lập v2 đã duyệt: channel16/global≤0,015; geometry≤2; style/font đúng; regions control≤0,005, mọi số tiền≤0,003. Không nới ngưỡng hoặc đổi reference/baseline để đạt.

Scenario: dựng fixture main 2da0d7e, thực hiện test trong traceability và quan sát đúng tiêu chí, không đổi nghiệp vụ.

## B01-10 — Bằng chứng

Hệ thống SHALL có gate fidelity/responsive/build/tests/smoke/ui-audit riêng gắn cùng source; audit selftest23 findings/selftest OK trước app audit, xem ảnh và phân loại findings. Review độc lập candidate cuối trước PR main/docs; không merge/deploy.

Scenario: dựng fixture main 2da0d7e, thực hiện test trong traceability và quan sát đúng tiêu chí, không đổi nghiệp vụ.


Làm rõ offset sau đối chiếu source: PortalDrawer mặc định viewport=screen nên inset-0/left0; OrderDrawer và PaymentDrawer giữ mặc định này. CHỈ caller truyền viewport=workspace dùng --workspace-rail-width (260/68 ở shell remake, fallback176/68 cho legacy). PortalPopup hiện cả hai viewport đều inset-0 như baseline; không tự đổi hành vi popup. Không có thao tác nghiệp vụ mới từ việc đổi biến layout.
