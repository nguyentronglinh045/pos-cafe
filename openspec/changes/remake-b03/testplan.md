# Kế hoạch kiểm chứng B03

Ngày:2026-10-22. **Đã hiện thực trên worktree B03 và kiểm chứng local/mock; chưa nghiệm thu sản phẩm, chưa push/merge/deploy.** Xem biên bản kiểm chứng và giới hạn ở docs/workflow/tasks/remake-b03-2026-10-22-validation.md.

Các test ứng dụng đã chạy trên source `058995f4d5de99c1b48cba541293b1f0e39d9a534c645e4fa1d482b4870b23af`. Nơi hiện thực bổ sung là tests/ui-remake/b03/payment.spec.ts và các file unit ghi bên dưới. Bảng kết quả cuối phân biệt từng gate và phần chưa chạy.

## TC-B03-01 — Mở/đọc/đóng và trạng thái query

**Truy vết:** UC-B03-01; R01,R02,R05.

**Mức:** giao diện.

**Tiền điều kiện / dữ liệu thử:** Mock0001-X8F3QA/admin123456; đơn24/B02,total125000.

**Các bước:**

1. Mở B02→payment; đọc3 dòng/4 món rồi đóng.
2. Dùng fixture delay/reject NOT_FOUND/missing ID/empty items; bấm retry khi resolve.

**Kết quả mong đợi:** Due=received=125000; đóng về floor, không write. Missing/loading/error/retry đúng UC01. Empty hiển thị “Chưa có món trong đơn.” và khóa pay.

**Nơi hiện thực:** src/app/demoHardening.test.tsx; bổ sung test B03 cho trạng thái còn thiếu.

## TC-B03-02 — Selection, cycle và refetch

**Truy vết:** UC-B03-02,UC-B03-04; R01,R03,R05.

**Mức:** tích hợp.

**Tiền điều kiện / dữ liệu thử:** 2 cà phê29k,1 Bạc xỉu32k,1 Croissant35k.

**Các bước:**

1. Bỏ all, chọn cà phê, nhấn+ hai lần.
2. Refetch cùng đơn giảm cà phê còn1, loại dòng khác; bỏ all rồi refetch.
3. Mở đơn khác.

**Kết quả mong đợi:** Due0→29k→58k→29k; clamp đúng, empty không thành all; đơn khác khởi tạo all; received reset khi due đổi.

**Nơi hiện thực:** src/app/instantPay.test.tsx và tests/ui-remake/b03/payment.spec.ts (selection/refetch).

## TC-B03-03 — Tiền, keypad, quick và9 chữ số

**Truy vết:** UC-B03-03; R01,R04,R07.

**Mức:** giao diện.

**Tiền điều kiện / dữ liệu thử:** Due125000,received200000.

**Các bước:**

1. Bấm +20k,+50k,Đúng tiền,200k,500k.
2. Nhập abc/rỗng/0/124999/999999999999; nhấn00/delete/digits.
3. Thử pay lúc thiếu.

**Kết quả mong đợi:** Quick lần lượt145k/175k/125k/200k/500k; input lọc/cắt9;124999 thiếu1đ, pay disabled và không execute. Quick giữ hàm riêng.

**Nơi hiện thực:** tests/smoke/demo-runbook.spec.ts; tests/ui-remake/b03/payment.spec.ts (money input).

## TC-B03-04 — Full payment và protocol

**Truy vết:** UC-B03-04,UC-B03-05; R01,R04,R05,R06.

**Mức:** tích hợp.

**Tiền điều kiện / dữ liệu thử:** Đơn24 full125k,received200k,print=true.

**Các bước:**

1. Nhấn pay rồi nhấn lần nữa khi pending.
2. Resolve operation applied; đọc receipt, toast, drawer và bàn.

**Kết quả mong đợi:** Một K/payload, methodcash,expectedVersion3; paid125k/change75k; receipt ban đầu một lần; đóng drawer và bàn trống.

**Nơi hiện thực:** instantPay.test.tsx, orderFlow.test.ts, writePaymentLifetime.test.tsx.

## TC-B03-05 — Split và phụ thu tùy chọn

**Truy vết:** UC-B03-02,UC-B03-04; R01,R03,R04,R05.

**Mức:** tích hợp.

**Tiền điều kiện / dữ liệu thử:** A:đơn24, chọn1 cà phê29k,received50k. B:2 mónbase29k+option7k×2,unit43k,total86k.

**Các bước:**

1. A: chọn1 và pay; resolve/refetch.
2. B: chọn1,received50k,pay split; đọc receipt và đơn nguồn.

**Kết quả mong đợi:** A:29k/change21k/nguồn96k,selection={},due0. B:43k/change7k/nguồn43k; dùng unitTotal thật có option, không copy công thức unitPrice từ fixture HTML.

**Nơi hiện thực:** instantPay.test.tsx, modifier.test.ts; bổ sung split có phụ thu.

## TC-B03-06 — Quyền và bypass UI/repository

**Truy vết:** UC-B03-04; R01,R05.

**Mức:** tích hợp.

**Tiền điều kiện / dữ liệu thử:** Cashier có override denies payment.take; admin/cashier allowed; mock write session.

**Các bước:**

1. Mở UI actor bị deny.
2. Gọi full/split flow trực tiếp; gọi write.register/execute bằng actor/session bị deny hoặc payload sai.
3. Kiểm actor allowed.

**Kết quả mong đợi:** Pay disabled với title “Không có quyền thanh toán”; FORBIDDEN đúng nhánh; không financial mutation hoặc fallback legacy. Allowed giữ kết quả cũ. Không ghi database thật.

**Nơi hiện thực:** orderFlow.test.ts:296; writeOperationFlow.test.ts và mock protocol/contract tests.

## TC-B03-07 — Conflict, closed, offline, unknown, auth và lifetime

**Truy vết:** UC-B03-01,UC-B03-02,UC-B03-04; R01,R03,R05.

**Mức:** tích hợp.

**Tiền điều kiện / dữ liệu thử:** Order24 lock3; fake pending/unknown/offline; ORDER_VERSION_CONFLICT,EMPLOYEE_SESSION_REQUIRED,AUTH_REQUIRED.

**Các bước:**

1. Đổi query sang paid/void.
2. Mất mạng hoặc nhận unknown, retry cùng K.
3. Inject conflict/auth errors.
4. Chuyển view trước khi release pending.

**Kết quả mong đợi:** Closed khóa pay+reload. Offline khóa pay; notice/recovery tới được. Retry giữ K/payload. Message và refetch/navigation theo UC04; view cũ không toast/close/receipt sang view mới. Test INVALID_ORDER_ITEMS và PAYMENT_AMOUNT_TOO_LOW trực tiếp.

**Nơi hiện thực:** writePaymentLifetime.test.tsx,demoHardening.test.tsx,writeOperationFlow.test.ts.

## TC-B03-08 — Tạm tính, in và receipt popup

**Truy vết:** UC-B03-05; R01,R06,R07.

**Mức:** giao diện.

**Tiền điều kiện / dữ liệu thử:** Đơn24; print mặc địnhtrue; mock getReceipt và browser print.

**Các bước:**

1. Mở và đóng tạm tính.
2. Bỏ print rồi pay; lặp fixture mới với print=true/initialSuccess=true.
3. Retry terminal; trong receipt preview bấm In và inject RECEIPT_UNAVAILABLE khi getReceipt revalidate.
4. Tab trong popup và đóng.

**Kết quả mong đợi:** Ticket không register/execute; payload đúng. Printfalse không preview; initialSuccess mới mở receipt; retry không lặp. Focus thuộc popup trên cùng và trở về hợp lệ; lỗi giữ mapping.

**Nơi hiện thực:** demoHardening.test.tsx; tests/ui-remake/b03/payment.spec.ts (popup/focus/full receipt).

## TC-B03-09 — Responsive, touch, keyboard và nội dung biên

**Truy vết:** UC-B03-01,UC-B03-03,UC-B03-05,UC-B03-06; R02,R07.

**Mức:** E2E.

**Tiền điều kiện / dữ liệu thử:** 20 viewport+width sweep;100 dòng; tên/note120 ký tự;qty 999;received999999999.

**Các bước:**

1. Đo44px/font12/overflow và cuộn tới mọi control ở từng viewport.
2. Touch,Tab/ShiftTab/Escape/focus restore, popup trên.
3. Kiểm CSS zoom200% và mô phỏng visual viewport khi bàn phím mở; browser zoom200% và bàn phím OS thật NOT_RUN.
4. Đọc tiền dài và cuộn danh sách.

**Kết quả mong đợi:** Document overflow<=1px; không che tiền/nhãn; hit đúng; CTA/close/amount tới được. Không nhận emulation thành kiểm thiết bị thật.

**Nơi hiện thực:** tests/ui-remake/b03/payment.spec.ts và playwright.b03.config.ts.

## TC-B03-10 — Reference, calibration và fidelity

**Truy vết:** UC-B03-06; R02,R09.

**Mức:** giao diện.

**Tiền điều kiện / dữ liệu thử:** 3FHD reference v3; chỉ chạy actual sau duyệt đúng hashes.

**Các bước:**

1. Chạy tool unit/selftest11 controls và calibration repeat/negative.
2. Xác minh source/server/config/font/palette.
3. Đo3 case app rồi đọc reports/diff/overlay/regions.

**Kết quả mong đợi:** Repeat ổn định0pixel; negative font/màu/geometry/overlay/target/overflow/tiền/CTA/key/quick/checked bị bắt. App phải đạt ngưỡng đã duyệt hoặc báo FAIL, không nới/baseline update.

**Nơi hiện thực:** ui-remake tests/run.mjs, tasks/b03/measurement.json, calibration recipe.

## TC-B03-11 — Theme và font chung

**Truy vết:** UC-B03-06; R08.

**Mức:** tích hợp.

**Tiền điều kiện / dữ liệu thử:** Canonical22 tokens,4TTF; fixture thay primary.

**Các bước:**

1. Assert CSSvars và MUI cùng JSON.
2. Đổi token trong test factory; render CSS/Tailwind/MUI controls.
3. Scan component màu hardcode và font thực đã tải.

**Kết quả mong đợi:** Đổi theme chung không cần sửa màn; CSS/Tailwind/MUI đồng bộ; font đầu tiên là Be Vietnam Pro đã tải; tương phản kiểm theo vai trò.

**Nơi hiện thực:** src/theme/remakeTheme.test.ts, RemakeThemeProvider.test.tsx và tests/ui-remake/b03/payment.spec.ts (theme propagation).

## TC-B03-12 — Build, unit, smoke, audit và review

**Truy vết:** UC-B03-06; R07,R09.

**Mức:** E2E.

**Tiền điều kiện / dữ liệu thử:** Một candidate fingerprint giữ nguyên qua các gate.

**Các bước:**

1. Build, unit, tool tests, smoke.
2. Audit selftest đúng23 findings/14 rules/16 targets vàselftest OK rồi audit app.
3. Đọc report.md, mở ảnh annotated, phân loại từng finding.
4. Đóng snapshot và hai PR draft, review độc lập.

**Kết quả mong đợi:** Ghi riêng PASS/FAIL/NOT_RUN/blocker/skip/source. Cả hai reviewer phải APPROVE candidate cuối khi đóng task. Không đổi baseline/merge/deploy.

**Nơi hiện thực:** Scripts package.json,ui-audit/config.json và docs biên bản/handoff.

## Kết quả chạy cuối

TC01–08 và11: có test mock/component/browser tương ứng trong unit643 ca và bộ B03; không suy ra backend production. TC09:37 browser tests đạt,20 matrix×3state và145 sweep; CSS zoom/VisualViewport mô phỏng đạt, browser zoom/thiết bị/bàn phím thật NOT_RUN. TC10:79 tool tests,11 selftest,29 calibration và3 fidelity đạt trên cùng candidate. TC12:build/bundle/unit/smoke đạt; smoke35đạt/31skip do điều kiện từng project/0 fail/0 flaky. Audit39/39complete nhưng raw exit1,29 nhóm findings ngoài B03; không gọi whole-app PASS. Review final và package xem biên bản/handoff riêng.

Các kế hoạch “dự kiến” trong mô tả TC giữ lịch sử thiết kế test; bằng chứng thực thi có thẩm quyền là gate-summary.json, receipts, logs và results của package cuối. Không đổi baseline.
