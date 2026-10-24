# B01 — Kế hoạch kiểm chứng

## TC-B01-01

- Truy vết: UC-B01-01; xem traceability.
- Mức: giao diện.
- Tiền điều kiện: mock mode, base main2da0d7e + code candidate; không Supabase production.
- Dữ liệu: store0001-X8F3QA; admin123456/cashier111111; area045eee43-5266-442f-8e87-978c1cc30d0c; B02/a254abd0-b883-4d5c-85c1-89f660409e02; #24/125000; #25/86000; #26/84000.
- Các bước: Dựng admin fixture main; vào defaultFHD; chạy runner với config được approval.
- Kết quả mong đợi: Anchors, style/font và mọi vùng tiền đạt ngưỡng đã duyệt.
- Hiện thực và bằng chứng cuối: ui-remake/tasks/b01/measurement.json → b01-close-fidelity/report.json; PASS93pixel, anchors/money/font/22tokens.

## TC-B01-02

- Truy vết: UC-B01-01; xem traceability.
- Mức: tích hợp.
- Tiền điều kiện: mock mode, base main2da0d7e + code candidate; không Supabase production.
- Dữ liệu: store0001-X8F3QA; admin123456/cashier111111; area045eee43-5266-442f-8e87-978c1cc30d0c; B02/a254abd0-b883-4d5c-85c1-89f660409e02; #24/125000; #25/86000; #26/84000.
- Các bước: Đọc floor baseline; đổi area/all/empty/occupied; so id/coords/shape/assets và số ghế/tỷ lệ.
- Kết quả mong đợi: Không ghi layout/domain; filter đúng trạng thái và open orders.
- Hiện thực và bằng chứng cuối: src/app/shell/FloorWorkspace.test.tsx + tests/ui-remake/b01.spec.ts area/filter; trong641unit và65responsivePASS.

## TC-B01-03

- Truy vết: UC-B01-02; xem traceability.
- Mức: tích hợp.
- Tiền điều kiện: mock mode, base main2da0d7e + code candidate; không Supabase production.
- Dữ liệu: store0001-X8F3QA; admin123456/cashier111111; area045eee43-5266-442f-8e87-978c1cc30d0c; B02/a254abd0-b883-4d5c-85c1-89f660409e02; #24/125000; #25/86000; #26/84000.
- Các bước: Nhấn B02 #24 cached; nhấn B01 không cached; mô phỏng refetch vừa có đơn; nhấn takeaway#26.
- Kết quả mong đợi: Đúng orderId/tableId/type, refetch trước bàn trống, không mutation từ thao tác mở.
- Hiện thực và bằng chứng cuối: FloorWorkspace.test.tsx cached order/refetch race + b01.spec.ts order cards; trong641/65PASS.

## TC-B01-04

- Truy vết: UC-B01-03; xem traceability.
- Mức: giao diện.
- Tiền điều kiện: mock mode, base main2da0d7e + code candidate; không Supabase production.
- Dữ liệu: store0001-X8F3QA; admin123456/cashier111111; area045eee43-5266-442f-8e87-978c1cc30d0c; B02/a254abd0-b883-4d5c-85c1-89f660409e02; #24/125000; #25/86000; #26/84000.
- Các bước: Mock pending/reject UNKNOWN/empty cho floor và orders; nhấn retry và refresh.
- Kết quả mong đợi: Đúng chuỗi tiếng Việt, controls tới được, hai refetch refresh giữ nguyên.
- Hiện thực và bằng chứng cuối: FloorWorkspace.test.tsx refresh/retry + b01.spec.ts floor/orders loading/error/empty;6errorretry ở height479/480/481; PASS.

## TC-B01-05

- Truy vết: UC-B01-04; xem traceability.
- Mức: tích hợp.
- Tiền điều kiện: mock mode, base main2da0d7e + code candidate; không Supabase production.
- Dữ liệu: store0001-X8F3QA; admin123456/cashier111111; area045eee43-5266-442f-8e87-978c1cc30d0c; B02/a254abd0-b883-4d5c-85c1-89f660409e02; #24/125000; #25/86000; #26/84000.
- Các bước: Login cashier111111; thử nav admin và gọi flow guarded trực tiếp; lock; login admin123456.
- Kết quả mong đợi: FORBIDDEN ở tầng flow như baseline, không thay ACL/data; lock/passcode/nav đúng.
- Hiện thực và bằng chứng cuối: LeftNav.test.tsx + flow permission tests hiện có trong641unit; b01.spec.ts cashier navigation/keyboard lock ở3width; PASS, DBproductionNOT_RUN.

## TC-B01-06

- Truy vết: UC-B01-04; xem traceability.
- Mức: đơn vị.
- Tiền điều kiện: mock mode, base main2da0d7e + code candidate; không Supabase production.
- Dữ liệu: store0001-X8F3QA; admin123456/cashier111111; area045eee43-5266-442f-8e87-978c1cc30d0c; B02/a254abd0-b883-4d5c-85c1-89f660409e02; #24/125000; #25/86000; #26/84000.
- Các bước: Tạo theme từ canonical; đổi primary trong bản copy token input; so CSSvars/Tailwind mapping/MUI; kiểm portal browser.
- Kết quả mong đợi: Cả CSS và MUI cập nhật cùng nguồn, không hardcode component, local font weights đúng.
- Hiện thực và bằng chứng cuối: src/theme/remakeTheme.test.ts + b01.spec.ts runtime palette reachesCSS/Tailwind/MUIportal; PASS.

## TC-B01-07

- Truy vết: UC-B01-01, UC-B01-05; xem traceability.
- Mức: E2E.
- Tiền điều kiện: mock mode, base main2da0d7e + code candidate; không Supabase production.
- Dữ liệu: store0001-X8F3QA; admin123456/cashier111111; area045eee43-5266-442f-8e87-978c1cc30d0c; B02/a254abd0-b883-4d5c-85c1-89f660409e02; #24/125000; #25/86000; #26/84000.
- Các bước: Chạy18viewport gốc +6height479/480/481 tại568/1024,6errorretryheight vàbreakpoint±1 và sweep; scroll canvas/list/nav; touch bàn xa và keyboard focus/Enter.
- Kết quả mong đợi: Không overflow trang/clipping CTA, target44, đúng bàn sau scale, panel đóng/Escape/focus return.
- Hiện thực và bằng chứng cuối: tests/ui-remake/b01.spec.ts:24matrix (18gốc+6height) +sweep/breakpoint±1;65tổngPASS. Sweep chỉoverflow/canvasheight, khônggánfidelity.

## TC-B01-08

- Truy vết: UC-B01-01, UC-B01-05; xem traceability.
- Mức: E2E.
- Tiền điều kiện: mock mode, base main2da0d7e + code candidate; không Supabase production.
- Dữ liệu: store0001-X8F3QA; admin123456/cashier111111; area045eee43-5266-442f-8e87-978c1cc30d0c; B02/a254abd0-b883-4d5c-85c1-89f660409e02; #24/125000; #25/86000; #26/84000.
- Các bước: Fixture biên: tên120ký tự,100orders,total999999999, tiny/rotated/adjacent tables; states loading/empty/error/cashier.
- Kết quả mong đợi: Không crash/undefined; scroll/ellipsis có title, tiền không tràn, ghi rõ mọi giới hạn target customlayout.
- Hiện thực và bằng chứng cuối: tests/ui-remake/fixtures.ts/b01.spec.ts120char,100orders,999999999money,40pxrotated/adjacenttable; PASStrong65. Không đảm bảo layout tùy chỉnh chồng lấp tùy ý.

## TC-B01-09

- Truy vết: UC-B01-02; xem traceability.
- Mức: E2E.
- Tiền điều kiện: mock mode, base main2da0d7e + code candidate; không Supabase production.
- Dữ liệu: store0001-X8F3QA; admin123456/cashier111111; area045eee43-5266-442f-8e87-978c1cc30d0c; B02/a254abd0-b883-4d5c-85c1-89f660409e02; #24/125000; #25/86000; #26/84000.
- Các bước: Mở order; thêm món; dirty-exit; return; thanh toán bằng smoke mock; trở lại B01.
- Kết quả mong đợi: Luồng ghi hiện hữu giữ nguyên; không thay financial calculation, drawer không lệch rail.
- Hiện thực và bằng chứng cuối: tests/ui-remake/b01.spec.ts area2/farB08/dirtykeep-discard/payment-return tại568,1024,1920 +smokemock35PASS/31scopeSKIP.

## TC-B01-10

- Truy vết: UC-B01-01, UC-B01-04; xem traceability.
- Mức: giao diện.
- Tiền điều kiện: mock mode, base main2da0d7e + code candidate; không Supabase production.
- Dữ liệu: store0001-X8F3QA; admin123456/cashier111111; area045eee43-5266-442f-8e87-978c1cc30d0c; B02/a254abd0-b883-4d5c-85c1-89f660409e02; #24/125000; #25/86000; #26/84000.
- Các bước: Build/tests/smoke; ui-audit selftest rồi app; mở ảnh annotated, phân loại; khóa source và independent review.
- Kết quả mong đợi: Selftest23/OK; không auto baseline; mọi gate có source và verdict độc lập.
- Hiện thực và bằng chứng cuối: Manifest131files source-bound; build641/78/65/35PASS; appaudit39/39FAILđãphânloại37nhóm; independentreviewởbiênbảnriêng.

Bốn nhóm: chính01–03/09; ngoại lệ04/05; biên07/08; quyền/bypass05 và các kiểm thử guard/write hiện có trong npm test. Không gọi DB thật: slice presentation không đổi ACL/SQL; integration RLS production không nằm trong ủy quyền, NOT_RUN và không dùng mock thay bằng chứng đó.
