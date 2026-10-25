# Bản sửa harness T04 và mức độ xác nhận — 24/10/2026

Đã sửa nguyên nhân hiện biết và kiểm chứng local; **chưa thể kết luận T04 đã được sửa triệt để**. Whole T04 trên bản mới chưa chạy. Lượt trước dừng ở test4, còn phần cuối test4, bước đo ảnh, restore sau activation và chín stage phía sau chưa được runtime chứng minh. CI xanh không thay thế các phần này.

Người dùng hỏi vì T04 đã thất bại nhiều lần. Root tiếp tục phạm vi sửa harness đang được giao, dùng backend_acceptance làm tác giả và hai reviewer độc lập. Không suy câu hỏi thành quyền chạy cloud không giới hạn. Các lượt publication/CI/T04 trước đã dùng 5/5/5, còn 0; chưa có publication, CI hoặc T04 mới, chưa merge/deploy. [Brief và phạm vi](t04-oracle-hardening-brief-20261024.md).

## Vì sao fail nhiều lần

| Lỗi được xác định | Bằng chứng và trạng thái |
| --- | --- |
| Reader receipt chỉ nhận 8 KiB, làm mất chẩn đoán | Đã sửa và xác nhận trong run40058110136: receipt hợp lệ34.207B đi qua reader. [Outcome lịch sử](receipt-boundary-outcome-20261024.md). Không khẳng định hồi tố nguyên nhân của run đã mất private receipt. |
| Test kiểm ảnh khi save/refetch đã bỏ selection | Đã chọn lại món bằng itemId; save/reopen/exactsrc/decode qua trong run40063022066. |
| Clear-demo phụ thuộc tên quán được test4 thiết lập | Test6 tự thiết lập và xác minh tiền điều kiện; toàn bộ test6 PASS trong run40063022066. |
| Assertion ảnh lỗi đếm cả SVG placeholder | Blocker mới nhất ở spec293 trên7dbd. Actual React/Lucide/Chromium local cho role-img=1, native-img=0, placeholder hiển thị. Private DOM của T04 không còn, nên không gọi số đếm local là quan sát trực tiếp của run đó. [Outcome lịch sử](image-clear-outcome-20261024.md). |

Các lần sửa có tiến triển nhưng trước đây chưa rà đủ phần sau điểm fail, và regression chưa kiểm đúng ngữ nghĩa browser thật. Đó là thiếu sót của quá trình implementation/review. Không có căn cứ gọi tất cả các lượt FAIL là cùng một lỗi tái phát, cũng không có căn cứ hứa lượt kế tiếp chắc chắn PASS.

## Thay đổi đã làm và cách đọc code

1. [Helper ảnh](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/tests/supabase/permissionCandidateUi.ts:5) giữ placeholder hiển thị và kiểm không còn HTML `<img>`. [Test4](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/tests/supabase/permissionCandidate.spec.ts:292) gọi đúng helper; toàn bộ kiểm geometry, tên, giá, thao tác, giỏ, bếp và receipt phía sau vẫn giữ. [Control Chromium](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/scripts/permission-candidate-browser-control.mjs:9) dùng Coffee thật và cùng helper: placeholder hợp lệ phải qua, còn native image hoặc thiếu placeholder phải fail đúng matcher.
2. [Promise và cleanup](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/tests/supabase/permissionCandidateUi.ts:12) nhận rejection của action/response ngay và giữ lỗi gốc nếu cleanup cũng lỗi. Test5 luôn đóng context; [test6](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/tests/supabase/permissionCandidate.spec.ts:403) giữ promise gốc để assertion vẫn fail nhưng không để rejection không được xử lý trong khi chờ đủ ba seed responses; tháo đúng listener sau kiểm.
3. Diagnostics khi thất bại phân biệt native image, role image và placeholder; ghi pha của test4, [parent T04](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/scripts/permission-runtime-t04.mjs:37), đo ảnh và cleanup. [TC-PIN-17 ngoài required inventory](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/scripts/permission-runtime-error-facts.mjs:31) có vị trí lỗi riêng. UNKNOWN giữ nguyên khi thiếu dữ liệu; không xuất URL, DOM, tên quán, token hoặc raw error. Hướng dẫn mã hữu hạn nằm trong [operator guide](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/scripts/permission-runtime-iteration.md:317).

Không thêm log debug thô hay log liên tục. Probe DOM ở teardown và attachment chỉ chạy/xuất khi test thất bại, có giới hạn thời gian; các checkpoint DB/API vẫn được quan sát hữu hạn trong luồng test. Thành công thì bỏ trạng thái tạm, không xuất attachment. Evidence nhỏ để truy vết được giữ. Diagnostics phục vụ lỗi còn mở chưa được coi là đã có thể bỏ chỉ vì local PASS. Việc dọn fixture synthetic được tách khỏi source/evidence kết quả.

Acceptance vẫn35 stage/760 required,12 obligations/34 contexts,A18/D19; sáu Candidate test names, hai required identities, catalog, fixture, các oracle, timeout/retry và deadline đều giữ nguyên. Không sửa ứng dụng, SQL, Auth/ACL hoặc storage policy. Bảy profile khác và các gate đã hoãn vẫn giữ nguyên trạng thái.

## Source và bằng chứng local

Candidate là baseline `7dbd6dd4b8abb8d8b614b5957559952372905529` cộng18 file chưa commit, không phải source7dbd nguyên trạng. Fingerprint `fa38fc2ffbfcb7aab99d5b61b69b36d25c936bcdc7b7d98e9f15f7e1570066ab`;1.119 file/41.923.864B canonical, lock `85969c1c161f74e9f68563182d99d1b0ac6fb5f17f5074444f329675ffd34e18`. [Manifest](t04-hardening-source01.json), [snapshot phục hồi đủ file mới](t04-hardening-snapshot01.json) và [patch](t04-hardening-source01.patch) đóng băng chính xác nội dung. Manifest SHA256 `952a33aeccef0134c0e544c22c9f43ef763466aa6435a8e39ebd3ac953540796`. Policy có56 trusted pins; production/ref/release flags không đổi.

| Kiểm tra | Kết quả và giới hạn |
| --- | --- |
| Node trên12 file liên quan |182/182 PASS, không skip/fail. Bao gồm promise/cleanup, tám parent phases, schema/privacy và envelope.63 ca sơ bộ và34 parent tests nằm trong182, không cộng lần nữa. |
| Typecheck |Exit0. |
| Policy |2/2 PASS,56 canonical pins khớp, release vẫn khóa. |
| Chromium đã cài |Một positive và hai negative PASS; network0, browser đã đóng. Synthetic DOM, không phải whole business test. |
| Reporter/diagnostics cuối |7/7 nhóm,20 mutation checks; ba Candidate controls và một compatibility extra-only control qua reporter, receipt và collector. Windows chứng minh REFUSAL_ONLY tại Unix ownership; accepted file/accounting/handback trên Linux vẫn cần fresh CI. |
| Giới hạn dữ liệu |Attachment16.384B; shared receipt131.072B giữ nguyên. Hai envelope tối đa có cả primary+cleanup:102.713B T04 và107.891B service. |

[Author manifest và toàn bộ recipe/log hashes](D:/Workspace/pos-cafe-permission-timeonly-20261022/evidence/candidate-t04-hardening-author-manifest01.json) SHA `00a4d97bf9c40697c365fcab12fc66918992091f03fcd183287a908ac3aeea19`. [Node02](D:/Workspace/pos-cafe-permission-timeonly-20261022/evidence/candidate-t04-hardening-node02.log) chạy trước thay đổi cuối chỉ trong control: sửa expected matcher Vitest từ1 thành0 vì reporter thực không cung cấp matcherResult. [Reporters01 lỗi](D:/Workspace/pos-cafe-permission-timeonly-20261022/evidence/candidate-t04-hardening-reporters01.log) được giữ; không sửa production để đoán matcher từ raw text. [Reporters02 PASS](D:/Workspace/pos-cafe-permission-timeonly-20261022/evidence/candidate-t04-hardening-reporters02.log) kiểm đúng bytes cuối của file đó. Policy được kiểm riêng sau cập nhật pins. Không ghép bằng chứng này thành CI hoặc T04 PASS.

Hai reviewer không author đã APPROVE đúng source và bằng chứng local: main_integration phụ trách integration/acceptance; final_diagnostic_review phụ trách privacy/transport/bounds. [Verdict và giới hạn](t04-hardening-source-reviews01.json) được lưu riêng. Approval local và báo cáo không phải business acceptance hoặc quyền chạy cloud mới. Báo cáo này được gửi hai reviewer kiểm riêng trước bàn giao. Walkthrough ở trên đã cung cấp; chưa có xác nhận chủ repo đã đọc/hiểu.

## Phần còn lại và dung lượng

Rà source toàn bộ sáu Candidate tests và chín stage cuối chưa phát hiện thêm lỗi tất định. Vẫn có rủi ro chưa được runtime xác nhận: test4 lỗi sau tạo takeaway có thể kéo theo clear-demo fail; image measurement và restore sau activation chưa chạy tới; tổng thời gian toàn luồng chưa được chứng minh trong deadline14 phút hiện có. Không tự dọn đơn để che lỗi hoặc tăng timeout.

Để xác nhận bản sửa cần source cuối được review, thêm quyền publication cùng một fresh CI và một whole T04; CI mới phải xác nhận Linux file controls và các gate hiện hành trước T04. Nếu còn FAIL, dùng source/run/attempt cùng diagnostics mới để chỉ ra pha và nguyên nhân; không tự retry. Chưa tạo packet/mapping thực thi cho lượt mới, chưa dùng lại PASS của source cũ.

[Checkpoint local](t04-hardening-checkpoint01.json): C còn189.451.464.704B, D98.723.168.256B; dữ liệu giữ lại616.429.997B logic dưới cap805.306.368B. Không cài dependency/browser, WSL/Docker hoặc backend nặng. Số đo không phải quota OS, chưa đo allocated bytes. Process pwsh trong checkpoint là quan sát tại thời điểm lệnh kiểm; không dùng nó làm chứng minh process đã nhả fixture.

Năm thư mục synthetic mới có89 file/393.476B logic, vẫn giữ nguyên; [inventory chính xác](D:/Workspace/pos-cafe-permission-timeonly-20261022/evidence/candidate-t04-hardening-temp-inventory01.json). Chỉ dọn sau review, người dùng cho phép và kiểm identity/process/lock.36 thư mục cũ đã được cho phép nhưng lần xóa trước bị automatic approval review từ chối “blocked by policy”; không thử đường vòng, không tuyên bố thu hồi. [Đường dẫn cũ chưa xóa](unremoved-control-paths02.txt).
