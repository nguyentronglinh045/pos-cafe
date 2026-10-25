# Tích hợp phân quyền vào main — 24/10/2026

**Đã merge mã; CI sau merge FAIL ở một smoke test UI.** [PR6](https://github.com/nguyentronglinh045/pos-cafe/pull/6) merge lúc 18:26:52 ngày 24/10/2026 (Asia/Bangkok), commit `0dd63ea81b27a38800044a55a7f9c8f12f87cad0`. PR CI và hai review bắt buộc đã đạt trước merge. CI sau merge là kết quả riêng, chưa đạt; chưa xác định được nguyên nhân lỗi ứng dụng. Không deploy hoặc chạy migration/kích hoạt phân quyền trên DB thật.

## Phạm vi và quyền

Owner trả lời “ưu tiên merge main, sau đó tính tiếp” cho câu hỏi cho phép tích hợp trước khi T04 và7profile backend còn lại được nghiệm thu, vẫn phải review toàn diff và qua PR CI. Quyết định M24 chỉ đổi thứ tự tích hợp/nghiệm thu. Acceptance, expected và coverage không đổi; các gate backend chưa đủ giữ NOT_ACCEPTED/DEFERRED. [Quyết định, kế hoạch và walkthrough](../../workflow/tasks/permission-main-integration-2026-10-24.md).

Candidate `a028cc5b07bf3a02e3b837d8aec2b832325503a2` so với base `2da0d7e10d65ed4e79c8628d65220582a6cbd32b`:91commits/703paths, gồm app adapters/UI, role/permission overrides, PIN/recovery, candidate SQL và tooling/tests. Hai reviewer độc lập phủ224src/Supabase và479tooling/config/test paths; reviewer hỗ trợ kiểm83src test paths. [Source reviews](permission-main-source-reviews01.json).

Merge dùng protectedPR bình thường với expectedhead guard, không force/bypass/--admin. Hai parents của merge làB vàa028 theo đúng thứ tự; tree `12e8e64bd3df60ee3b1be55ec42f3cd5de35b746` trùng candidate và merge thử mà PR CI đã kiểm. [Merge receipt](permission-main-merge01.json).

## Lỗi review phát hiện và sửa

1. **Lệnh tài chính có thể sống qua drawer đã đóng.** Authority lookup chạy trước khi coordinator tạo attempt; leave/suspend trong lúc chờ chưa có attempt để vô hiệu, nên phản hồi muộn có thể tạo lệnh mới. Guard lấy generation trước await và kiểm ngay sau await, trước register/execute, đã đóng khe này.12control cố ý giữ authority chậm đều FAIL trước sửa; sau sửa56test liên quan PASS, typecheck0. Bao gồm submit/pay/split/full-selection/void và lần lookup thứ hai khi full-selection gọi pay; không tự cancel serverK. Không thêm debug log vào application.
2. **Discovery legacy lẫn fixture phân quyền.** Glob chung chọn21suite permission/PIN ngoài9contract legacy, dẫn đến khởi tạo module với sai môi trường. Config cuối liệt kê đúng9legacy; regression kiểm discovery thật và giữ đủ29permission/PIN contracts qua các config riêng, gồm3rollback variants. Không bỏ test hoặc đổi expected.

CI đầu trên3476d14 (`40087989282` PR, `40087987854` push) FAILtooling vì một test cũ kiểm hình thức `exclude` thay vì tập file thực được chọn. Root tái hiện đúng assertion với23PASS/1FAIL, sửa sang glob thực cùng positive control legacy. Full tooling local567PASS/0FAIL/1TC-IDEM-087defer sẵn; commit a028 chỉ đổi test đó. Hai reviewer đã rebind source cuối. Safe diagnostics và log RED/GREEN được giữ trong evidence; failure đầu không được ghi lại thành PASS.

## Kiểm chứng tích hợp

| Bằng chứng | Trạng thái/phạm vi |
| --- | --- |
| [Fresh PR CI40088569310/a1](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/40088569310) | PASS18phase, source merge thử984660f8, tree trùnga028 |
| Push CI40088566269/a1 | SUCCESS trêna028, tách khỏi bằng chứng PR |
| Unit / Node / tooling trong PR CI | 1189PASS /1044PASS /567PASS+1manualdefer đã khai báo |
| LIGHT static/native PG16 | 480static+30PG16 PASS; không thay fullbackend |
| UI | 48/48cặp state–viewport PASS (16state×3viewport) với6baselinefindings được chấp nhận từ trước; ba ảnh PIN native đúngrun/source đã root vàhai reviewer mở, không thấy lỗi ngoài vùngmask |
| [Fresh main CI40089941679/a1](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/40089941679) | FAIL: 15 phase trước smoke PASS; smoke có 43 expected, 1 unexpected, 37 skipped; ui-selftest và ui-audit sau smoke chưa chạy. Không nhận whole CI PASS |

PR collection ràng buộc exacthead/base/orderedparents/tree/workflow/source/run/attempt. Fingerprint `771c03c33376eccc6b7dfe8c24c4f7556747875d1fcf6cb3f1b8cbefbc5b6f68`, lock `85969c1c161f74e9f68563182d99d1b0ac6fb5f17f5074444f329675ffd34e18`;1126canonicalGitblobs/42006170B,64trustedpins. [Actual PR gate reviews](permission-main-pr02-gate-reviews.json), [PIN integrity](permission-main-pr02-pin-integrity.json). Producer `visualReview: NOT_RUN` giữ nguyên; review thủ công là evidence riêng. Hai vùng PIN che đen không được dùng để kết luận hình thức input.

## Lỗi còn lại sau merge và hướng xử lý

Test `payment selection and quantity controls stay accessible without paying` tại `tests/smoke/permission-ui-closeout.spec.ts:40` thất bại trên `phone-landscape` 844×390 sau 11.310 ms. Cùng tree đã qua PR CI trước đó, nhưng điều này không đủ để gọi lỗi mới là vô hại hoặc kết luận nguyên nhân. Status thực là `failed`; mã phân loại `TEST_TIMEOUT` không chứng minh đã hết timeout toàn test 60 giây.

Hai reviewer xác định một lỗi trong cách gán diagnostics: reporter phát cả lỗi polling trung gian; parser lấy marker đầu toàn lượt, không ràng buộc với test thất bại cuối. Vì vậy marker dòng 6 không đủ xác định control/assertion cuối bị lỗi. Metric một file core/4 KiB cũng có nguồn synthetic từ test tooling trước đó, không phải bằng chứng Chromium crash. [Phân tích, nguồn và bằng chứng](permission-main-main01-diagnosis.md).

Hướng sửa tiếp: gắn diagnostics hữu hạn với đúng test/kết quả cuối, thêm định danh control và geometry/hit-test không chứa nội dung người dùng, rồi tái hiện riêng ca thanh toán phone-landscape bằng mock. Giữ nguyên assertions, timeout và retry=0; chỉ sửa layout nếu có bằng chứng chỉ đúng phần lỗi. Đây là việc đề xuất cho lượt tiếp theo, chưa thực hiện; không chạy lại whole CI hoặc T04 chỉ để lấy kết quả xanh. Tích hợp mã đã xong, kiểm chứng CI sau merge còn mở.

## Hold và giới hạn sau merge

GitHub Production/Preview tiếp tục yêu cầu owner, main-only và không cho admin bypass; Vercel đọc lại sau merge vẫn `Don’t build anything / exit 0`, Production vẫn commit4a89cc3 của17/10. Source main giữgit.deploymentEnabled=false vàproductionEnabled=false. Không có workflow Preview/Release mới; không chạy liveDB/Edge/activation. [Post-merge readback](permission-main-postmerge-hold01.json).

T04 timing/browser-worker tiếp tục hoãn. Diagnostic cuối ở4e78a8c thất bại vì requesttarget59s thực tế60,657s, vượt biên59750ms; đây là late dispatch được đo, không phải bằng chứng lỗi business cache TTL. Currenta028/main chưa có wholeT04PASS;7profile backend và supplemental obligations chưa đóng. HP1 vẫn không hoạt động. Không triển khai phân quyền lên backend cũ chỉ vì code đã vào main.

Gap UI kế thừa chưa sửa: EmployeesDrawer chỉ confirm dirty khi đổi target, chưa hỏi khi đóng/outside; baselineB cũng có. Đây là việc còn lại cho nghiệm thu UI, không phải regression mới của lượt tích hợp.

Remote main đã cập nhật. Workspace gốc `D:/Workspace/pos-cafe` cònHEAD5156820 và475porcelainentries, được giữ nguyên để không ảnh hưởng thay đổi riêng; không tuyên bố localmainworkingtree đã đồng bộ/sạch. Không xóa control theo chỉ đạo HOLD; không cài local/WSL/Docker. Hồ sơ này nằm trên docs worktree, chưa đồng nghĩa đã publish mọi thay đổi docs đang tồn tại.
