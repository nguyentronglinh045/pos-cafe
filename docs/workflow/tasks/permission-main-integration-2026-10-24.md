# Tích hợp phân quyền vào main — 24/10/2026

MERGED_MAIN_CI_FAILED: PR6 đã merge lúc 11:26:52 UTC (18:26:52+07) vào main `0dd63ea81b27a38800044a55a7f9c8f12f87cad0`, tree12e8 trùng candidate a028. Hai source reviews và hai actual PR CI/PIN reviews APPROVE; PR40088569310 PASS18. Fresh mainCI40089941679 FAIL ở smoke thanh toán phone-landscape; 15 phase trước đó PASS, hai phase sau smoke chưa chạy. T04/backend acceptance vẫn hoãn; no deploy/live DB mutation. Tích hợp mã đã xong; kiểm chứng sau merge còn mở, không tuyên bố toàn bộ task/gate PASS.

## Quyết định và phạm vi

Nguồn: câu trả lời trực tiếp `call_fbf43a1b580f40a6920d665f83ec499d`: **“ưu tiên merge main, sau đó tính tiếp”**. Câu hỏi đã nêu rõ lựa chọn tích hợp trước khi T04 và 7 profile backend còn lại được nghiệm thu, vẫn phải review toàn bộ thay đổi và qua CI của PR; không deploy, chạy migration hay bật phân quyền trên DB thật.

Quyết định này thay điều kiện “chỉ push main khi đủ full gate” của 22/10 **cho tích hợp mã**. Acceptance nghiệp vụ và expected không đổi; các phần thiếu vẫn DEFERRED/NOT_ACCEPTED, không nhận bằng chứng cũ thành PASS nguồn mới. Timing T04/browser-worker tiếp tục hoãn. Không chạy thêm whole T04/backend trong lượt tích hợp. HP1 giữ không hoạt động. Các thư mục control tiếp tục HOLD theo chỉ đạo tạm chưa xóa.

Lý do: chủ dự án ưu tiên cập nhật main để tiếp tục công việc, tách code integration khỏi rollout. Phương án chờ đủ backend trước merge không được chọn. Hệ quả: main chứa chức năng chưa được nghiệm thu backend đầy đủ; frontend mới cần contract backend mới nên các khóa deploy/migration/activation phải giữ nguyên.

## Candidate và kế hoạch kiểm

- Base remote main: `2da0d7e10d65ed4e79c8628d65220582a6cbd32b`.
- Candidate cuối: `a028cc5b07bf3a02e3b837d8aec2b832325503a2`; tree `12e8e64bd3df60ee3b1be55ec42f3cd5de35b746`; local checkout sạch. Bản đầu4e78a8c được giữ;3476 sửa5file để đóng hai finding, a028 sửa thêm1tooling test representation-coupled sau freshCI.
- Diff cuối: 91 commits/703 paths; 209 src, 15 Supabase, 479 paths tooling/config/test khác. [PR6](https://github.com/nguyentronglinh045/pos-cafe/pull/6) đã fast-forward từ7fa52d8 qua3476d14 lêna028cc5, đã merge vào0dd63ea; baseB đã đối chiếu live trướcmerge.
- Hai review bắt buộc: main_integration kiểm app/src và SQL/backend; final_diagnostic_review kiểm workflow/CI/scripts/tooling/tests/config và tổng hợp review phụ cho test surface. Các review cũ 12 file không thay review toàn diff.
- Đã cập nhật nhánh PR bằng fast-forward bình thường; chạy fresh PR CI song song phần review còn lại để giảm thời gian, giữ draft đến khi các review bắt buộc và CI đạt. Merge qua protection, expected head guard; không bypass. Sau merge kiểm fresh main CI, tree và khóa phát hành.
- CI cũ `40081353958` PASS18 chỉ là lịch sử bản4e78a8c; không thay fresh PR/main CI.

## Hai finding tích hợp đã sửa

1. `orderFlow.ts` chờ authority trước khi tạo write attempt, nên leave/suspend trong lúc chờ không làm phản hồi muộn vô hiệu. Thêm guard generation lấy trước await và kiểm ngay sau await, trước register/execute. 12 deferred-authority controls tái hiện FAIL trên mã cũ; sau sửa 56 tests liên quan PASS, typecheck0. Kiểm cả5route và await thứ hai của full-selection; không tự cancel server K, không log tạm mới.
2. Generic legacy contract glob kéo21suite permission/PIN vào fixture IDEM, có thể fail ngay import do thiếu đúng profile. Dùng danh sách9contract legacy; hai kiểm discovery thực PASS, toàn bộ29contract permission/PIN vẫn qua dedicated config (bao gồm3rollback variants). Không chạy backend hoặc giảm coverage.

Evidence local nằm tại `D:/Workspace/pos-cafe-permission-timeonly-20261022/evidence/permission-main-{lifecycle,discovery}-*.log`; discovery RED lần đầu còn ghi lỗi setup của control rollback variant, được sửa trong chính test để duyệt đủ3variant và khôi phục env. Failure chính generic glob là đối chiếu actual file set, độc lập lỗi control đó.

Ngân sách CI đã thông báo LỚN HƠN1GB: npm/Chromium trên GitHub, download0,5–2GiB/runner, peak2–5GiB/runner, hai automaticCI peak tổng tối đa10GiB trong ngân sách20GiB; không cài local, không Supabase heavy. Local C191302672384B/D98700800000B free trước publication. Live holds: [GitHub readback](../../implementation-log/permission-backend-web-release-20261023/permission-main-live-hold01.json), [Vercel readback](../../implementation-log/permission-backend-web-release-20261023/permission-main-vercel-readback01.json).

## Giới hạn bằng chứng

Diagnostic `40082616309` FAIL timing59s: thực tế60,657s, vượt biên59750ms; 6Candidate và21imageobservations gồm warm/fresh đã qua nhưng ba cache timing observations chưa chứng minh. Whole T04 không PASS trên source cuối; 7 service profiles và supplemental obligations chưa đóng. Không đổi các kết luận này khi CI tích hợp xanh.

Review/CI/merge receipts nằm ở `docs/implementation-log/permission-backend-web-release-20261023/permission-main-*`; [báo cáo kết quả](../../implementation-log/permission-backend-web-release-20261023/permission-main-outcome-20261024.md). Không cài dependency local; giữ checkout gốc và mọi thay đổi ngoài scope. Walkthrough đã được đề nghị ở task trước; chưa nhận owner xác nhận đã đọc/hiểu.

## Đường đọc code và giới hạn còn lại

Điểm vào: `src/app/runtimePorts.ts:24` → `src/adapters/supabase/newPermissionRuntime.ts:15` → `permissionIdentityRepo.ts:35/123` giữ credential riêng và ràng buộc generation của session/authority. `src/features/shared/permissionSession.ts:64/83` kiểm authority và ngăn read cũ nạp lại cache; `src/app/PermissionLifecycle.tsx:16` refresh/purge; `src/app/WriteLifecycle.tsx:24` vô hiệu continuation khi đổi navigation/session. Financial write đi từ `src/features/pos/orderFlow.ts:253/277/362/426` qua coordinator guard `writeOperationFlow.ts:45`, rồi backend `supabase/candidate/permission-financial.sql:5/61` kiểm checkpoint và K-bound execution. Raw-table closure ở financial:231/administration:308; không suy các đường code này thành runtime PASS.

Review ghi nhận một gap UI kế thừa, không phát sinh bởi delta: EmployeesDrawer chỉ confirm dirty khi đổi target (`src/app/drawers/admin/EmployeesDrawer.tsx:97`), nút đóng/outside ở289/306 không đi qua guard tương ứng; baselineB cũng có. Ghi giữ để xử lý khi nghiệm thu UI, không nhận là đã được lifecycle patch sửa. Đường dẫn đã đối chiếu theo inventory source cuối.


Fresh CI lần1 FAIL được giữ nguyên: PR40087989282 kiểm synthetic merge7e3af4bb và push40087987854 kiểm3476, cùng fail đúngpermissionVerify.tool.test.ts. Safe finite diagnostics có failedfile và số lượng, không OOM. Local focusedRED ghi exactassertion36; sửa oracle từexclude-array sangactualglob với positivelegacyfile, không đổi scope. Fulltooling567PASS/0FAIL/1TC-IDEM-087defer sẵn. Hai review đã rebinda028; [source review record](../../implementation-log/permission-backend-web-release-20261023/permission-main-source-reviews01.json). Collection tagspr01FAILED được giữ; lượt mớipr02, không overwrite/retry oldrun.


Đã merge bình thường qua protectedPR, không --admin/bypass, expectedheada028; mergeparentsB+a028 đúng thứ tự, treeidentical12e8. [Merge receipt](../../implementation-log/permission-backend-web-release-20261023/permission-main-merge01.json), [actualPR gate reviews](../../implementation-log/permission-backend-web-release-20261023/permission-main-pr02-gate-reviews.json). Remote main đã cập nhật; workspacegốc D:/Workspace/pos-cafe vẫnHEAD5156820 với475porcelainentries, không chỉnh file hoặc chuyểnbranch để tránh ảnh hưởng việc riêng. Đây là merge trên GitHub, không nhận localmainworkingtree đã sạch/cập nhật.

## Bàn giao lỗi CI sau merge

Run40089941679/a1 trên đúng main0dd63ea FAIL: payment closeout tại `tests/smoke/permission-ui-closeout.spec.ts:40`, phone-landscape 844×390, duration 11.310 ms, status `failed`. Build/unit/tooling/node-tools/static/native PG16 và các phase trước smoke đều PASS. ui-selftest/ui-audit cuối chưa chạy. [Phân tích độc lập và nguồn](../../implementation-log/permission-backend-web-release-20261023/permission-main-main01-diagnosis.md).

Đã chứng minh blind spot của diagnostics: marker polling trung gian có thể ghi đè vị trí lỗi cuối; chưa chứng minh control nào hoặc lỗi ứng dụng nào. File core synthetic từ node-tools khiến metric core không đủ kết luận browser crash. Không thêm log/sửa code sau merge, không chạy lại CI/T04. Bước tiếp theo đề xuất: sửa attribution theo kết quả cuối từng test, rồi tái hiện riêng ca mock này với diagnostics hữu hạn và giữ nguyên acceptance. Nếu không tái hiện, ghi UNKNOWN; không dùng chạy lại xanh để xóa failure.
