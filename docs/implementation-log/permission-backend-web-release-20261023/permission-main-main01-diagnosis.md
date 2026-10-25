# CI sau merge — phân tích hữu hạn ngày 24/10/2026

**Main CI FAIL; nguyên nhân lỗi ứng dụng chưa xác định.** Đây là bàn giao bằng chứng và hướng xử lý, không phải xác nhận đã sửa lỗi hay đạt nghiệm thu.

## Kết quả xác minh được

- Run [40089941679/a1](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/40089941679), main `0dd63ea81b27a38800044a55a7f9c8f12f87cad0`, parents `2da0d7e10d65ed4e79c8628d65220582a6cbd32b` + `a028cc5b07bf3a02e3b837d8aec2b832325503a2`, tree `12e8e64bd3df60ee3b1be55ec42f3cd5de35b746` trùng candidate và PR CI đã PASS. Hai reviewer đã kiểm source binding và 13 file/hash tham chiếu.
- 15 phase trước smoke PASS, gồm unit 1189, tooling 567 + 1 manual-defer đã khai báo, node-tools 1044, static 480 và native PG16 30. Smoke FAIL; `ui-selftest` và `ui-audit` sau smoke chưa chạy. Selftest detector ở phase `ui-audit-selftest` trước smoke đã PASS; hai selftest này là hai bước riêng.
- Smoke báo 43 expected, 1 unexpected, 37 skipped, 0 flaky. Test thất bại: `payment selection and quantity controls stay accessible without paying`, `tests/smoke/permission-ui-closeout.spec.ts:40`, project `phone-landscape` 844×390, duration 11310 ms. Không đổi nghĩa các skipped thành PASS.
- Status ordinal 1 là `failed`, không phải `timedOut` (`scripts/project-ci-results.mjs:403`). Nhãn `TEST_TIMEOUT` dùng regex rộng (:500); không chứng minh đã hết timeout toàn test 60000 ms.
- OOM events/kills và pids-limit events đều 0. Không có bằng chứng đủ để quy lỗi cho cạn RAM, PID hay crash Chromium.

## Hai giới hạn diagnostics đã xác định từ source

1. `SmokeFailureReporter` phát các step lỗi ngay khi kết thúc, kể cả lỗi trung gian của polling (`scripts/project-ci-results.mjs:124–134`). Parser lấy marker đầu toàn lượt, không gắn với test/kết quả cuối, và có thể ghi đè vị trí lỗi cuối (:480–497). Vì vậy `smokeFailureLine=6`, duration 8 ms chỉ là một dấu vết; chưa chứng minh assertion cuối hay control nào thất bại. Kết luận trước đó coi đây chắc chắn là lỗi `expectUncovered` phải được hạ xuống giả thuyết.
2. Node-tools tạo fixture 32 byte `core.1` cùng hardlink `core.2` trước smoke (`scripts/project-ci-results.test.mjs:751–758`). Bộ đếm khử trùng inode và nhận diện core bằng tên (`scripts/project-ci.mjs:84–105`), không chứng thực crash dump. Fixture này có thể giải thích metric 1 file/4096 byte; không dùng metric đó làm bằng chứng browser crash.

Source dẫn trên thuộc candidate a028, có cùng tree với main đã merge. Test chỉ thao tác selection/quantity, không thực hiện thanh toán (`tests/smoke/permission-ui-closeout.spec.ts:40–82`), nên chưa có căn cứ gắn failure này với bản sửa authority continuation. Nested scrolling/min-height ở `src/app/drawers/pos/PaymentDrawer.tsx:264,278` và `src/app/drawers/pos/PaymentSummaryPane.tsx:98` là hướng kiểm tra, chưa phải nguyên nhân.

## Hướng xử lý tiếp, chưa thực hiện

1. Sửa việc gán diagnostics: giữ buffer hữu hạn theo test, chỉ xuất kết quả thất bại cuối từ `onTestEnd`; không cho lỗi polling tạm thời hoặc test khác ghi đè lỗi cuối. Thêm regression controls cho polling có lỗi trung gian nhưng cuối cùng PASS, nhiều test khác nhau và lỗi terminal khác vị trí marker đầu.
2. Gắn ordinal cố định cho control/row và geometry/hit-test hữu hạn (self/descendant/other/null), không xuất raw DOM, nội dung người dùng hay PIN. Giữ nguyên lỗi ném ra và assertions; diagnostics tạm chỉ phục vụ xác nhận nguyên nhân rồi bỏ sau khi fix được xác minh.
3. Chạy riêng ca payment closeout, project phone-landscape bằng mock hiện có, retry=0, timeout/expected giữ nguyên; lưu evidence vào đường dẫn mới. Đối chiếu control, rect và phần tử che trước khi sửa layout. Nếu ca riêng không tái hiện, giữ UNKNOWN; không coi một lượt xanh là chứng minh đã sửa.

Không thực hiện thêm code change, rerun CI, T04, backend hoặc deploy trong bước phân tích này. T04 và backend acceptance giữ hoãn theo M24. PR CI xanh trước merge vẫn là evidence lịch sử hợp lệ của đúng tree; không thay thế main CI đang FAIL.

## Evidence lưu giữ

[Collection](D:/Workspace/pos-cafe-permission-timeonly-20261022/evidence/permission-main-main01-collection.json) liên kết raw workflow log, API metadata, source objects và summary có hash. [Summary](D:/Workspace/pos-cafe-permission-timeonly-20261022/evidence/permission-main-main01-summary.json) SHA256 `4077a48c71e2f9626ee4b8b883c0bed14985a4b4fba26bc7aceb079c5454582d`. Hai reviewer độc lập (`main_integration`, `final_diagnostic_review`) cùng kết luận nguyên nhân ứng dụng UNKNOWN; không thực thi thêm lượt test hoặc sửa mã khi review.
