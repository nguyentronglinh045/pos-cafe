# B03 — Kết quả kiểm chứng implementation

Ngày2026-10-22. Code base2da0d7e; source`058995f4d5de99c1b48cba541293b1f0e39d9a534c645e4fa1d482b4870b23af`. Reference`a93da9b3d6ef11aee464ac5b7b0b6ae6982fd0daeb1d0c956ab178e8b29cc9e8`; contract`29d4ea694ceef991ede62f2b4f471e5beb2dd20f8836fb2000e47a04a4d37c74`. Source được kiểm trước/sau và giữ nguyên qua mọi gate bên dưới. Gói chưa có nghĩa sản phẩm được nghiệm thu.

| Gate | Kết quả | Evidence dưới artifacts/ui-remake/b03-final |
| --- | --- | --- |
| TypeScript/build bundle | PASS; cảnh báo chunk>500kB | build.log, bundle.log và receipts |
| Unit/component | PASS643,67 files,0 skip/0 fail | unit.log |
| Tool tests | PASS79,0 skip/0 fail | tool-tests.log |
| Runner selftest | PASS11 controls đúng kỳ vọng | tool-selftest.log và report selftest |
| Reference calibration | PASS29:3positive/26negative | calibration/report.json |
| Fidelity | PASS3FHD,0pixel khác sau channel16; geometry0px;38anchors/49regions mỗi case | fidelity/report.md/json +12 ảnh |
| Responsive | PASS37,0 skip/fail/flaky;20 matrix×3state và145 sweep | responsive/results.json +ảnh/sweep.json |
| Mock smoke | PASS35,SKIP31,FAIL0,FLAKY0 | smoke/results.json, traces |
| Audit selftest | PASS23 findings/14 rules/16 targets,selftest OK | audit-selftest.log; artifacts/ui-audit/b03-final-selftest.json |
| Whole-app audit | FAIL,exit1;39/39complete,setup0,29 nhóm/51 occurrences | audit.log,ui-audit/report.md/json/out |
| B03 audit classification | Không có finding payment trong matrix legacy;7 key chưa có baseline đều tái hiện main gốc | audit-classification.md/json,base-comparison/report.json |

## Phạm vi kiểm thử

Kiểm actual app theo đường pairing/login→B02→payment; fixturefault dùng component/hook/mockports thật, không import vào productionentry. Bao gồm missing/loading/error/retry/empty/paid/void/denied/cashier/pending/unknown/conflict/offline, clamp khi refetch, option43k, split/full, input9digits,quick/keypad, touch emulation, keyboard/focus/receiptstack,100 dòng/tên dài/qty 999/tiền lớn và theme propagation.37 tests không có nghĩa37 viewport; matrix là20 viewport và sweep145lượt riêng.

Smoke bỏ31ca có chủ đích theo annotations từngproject (portrait-only/desktop-only/workflow chạy một lần); xem results.json, không tính skip là đã đạt. Ma trận appaudit legacy39lượt có3 payment viewport; bộ responsive/fidelity B03 mở rộng riêng, không thay audit. Đã xem expected/actual/diff/overlay3case và17 ảnh annotated; mọifinding được phân loại riêng.

## Giới hạn và trạng thái

CSS zoom200% và VisualViewport là **mô phỏng**, không phải browser zoom hoặc bàn phím OS thật. Browserzoom200%, thiết bị/touch hardware, bàn phím thật, Supabase/RLS/backend production, máy in native và hosted CI: NOT_RUN. Pixel0 chỉ trong3state FHD/environment đã khóa, không tuyên bố100% giống trên mọi máy. Stitch source chưa truy cập do login, normalized dựng độc lập từPNG và owner đã duyệt.

Whole-app audit còn22 nhóm lỗi thật ngoài B03 (vùng chạm/tên truy cập/chữ nhỏ/tương phản/menu clipping/report hit-blocked) và7 nhóm falsepositive sr-only; không sửa ngoài ủy quyền, không cập nhật baseline. Không dùng kết quả này để tự cho phép triển khai toàn app. Hai review độc lập final ghi riêng; owner mới duyệt reference/capture, chưa nghiệm thu app.

## Tái hiện và kiểm source

Operatorrecipe ở main:ui-remake/tasks/b03/README.md. Gói chứa source-snapshot.json.gz đủ 592 file kể cả filemới/test, patch,raw/normalized,config,logs/reports/ảnh vàrecipes; kiểmmanifest trước khôi phục vào thư mục trống, không chép đè WIP. gate-summary.json chứa command/timestamps/exit/source/loghash của từnggate. Dependency/browser được tái dùng, không đóng kèm node_modules hoặc credential.
