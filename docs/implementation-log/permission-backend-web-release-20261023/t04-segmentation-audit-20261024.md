# Khảo sát điều kiện chia T04 — 24/10/2026

Tác giả: /root/backend_acceptance. Trạng thái: **phân tích nguồn; chưa triển khai/chạy fallback; chờ review độc lập**.

Nguồn: commit `34db1b13ab707bab114fe1d83642d021ff324c93`, tree `cb6f69c67f70d9391877ab492dd25935b05c428f`, fingerprint Git-blob `fa38fc2ffbfcb7aab99d5b61b69b36d25c936bcdc7b7d98e9f15f7e1570066ab`. Checkout sạch khi khảo sát. [Commit binding](D:/Workspace/pos-cafe-docs/docs/implementation-log/permission-backend-web-release-20261023/t04-hardening-commit01.json) và [mapping07](D:/Workspace/pos-cafe-docs/docs/implementation-log/permission-backend-web-release-20261023/supplemental-source-mapping07.json) giữ nhận diện nguồn; mapping07 không kế thừa PASS lịch sử.

## Ủy quyền và phạm vi hiện tại

Theo chỉ đạo root ngày 24/10, chuyển tiếp yêu cầu mới của người dùng: cho phép một publication/fresh CI mới, và một whole T04 nếu gate trước đạt; nếu thất bại thì xác định nguyên nhân chính xác và sửa; nếu chưa giải quyết được, có ủy quyền có điều kiện chia T04 thành lượt nhỏ độc lập, giữ acceptance, chưa merge/deploy. Đây là ghi nhận phạm vi đã giao, không tạo thêm lượt chạy vô hạn, đổi acceptance hoặc điều kiện phê duyệt mới.

Ở thời điểm khảo sát, điều kiện fallback **chưa được kích hoạt**. Không có source edit, runner mới, dispatch, backend, cài đặt hoặc dọn dữ liệu do khảo sát. Năm thư mục temp của lượt local trước vẫn giữ nguyên vì yêu cầu dọn chưa được trả lời. Evidence của lượt đang được root điều phối sẽ quyết định có cần fallback; tài liệu không dự đoán lượt đó sẽ thất bại.

## Runner và gate đang có

Runner lấy đúng 19 stage thuộc SUPABASE_T04 và chạy theo thứ tự. Một stage lỗi làm các stage sau thành NOT_RUN. Mỗi stage qua physical/baseline, prepare, runner, post-run guard, observe, restore khi được khai báo, rồi kiểm lại physical/baseline. Candidate E2E còn phải có image measurement trước observation/reset. Entry point hiện tại không nhận subset. Xem [permission-runtime-t04.mjs](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/scripts/permission-runtime-t04.mjs:53), dòng53–103 và159–165.

Để nhận PASS, renderer đòi đúng 19 hàng đúng thứ tự, một physicalBackendSHA, một logicalBaselineSHA/checkpoint, các reset theo thứ tự nguồn, image receipt đúng source/run/attempt/physical binding, và cleanup thành công. PASS yêu cầu toàn bộ stage PASS, đủ 10 reset và runner preflight PASS. Receipt FAIL có thể ghi cleanup=false; việc renderer chấp nhận cấu trúc receipt FAIL không biến nó thành acceptance PASS. Không có phép nối receipt từ backend khác nhau thành T04 PASS. Xem [renderer](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/scripts/permission-runtime-t04.mjs:106), dòng106–149.

Recipe stage chạy toàn bộ file với config/catalog cố định; không có CLI test-name filter. Full-file discovery/result phải được validator chấp nhận, không chỉ các identity required trong catalog. Xem [catalog](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/scripts/permission-runtime-catalog.mjs:46), dòng46–63. Candidate-e2e có 2 required identities nhưng cả 6 test trong file vẫn phải PASS một lần; stage 19 có 3 required và TC-PIN-17 ngoài required vẫn có thể làm full-file FAIL.

## Ranh giới tự nhiên để chẩn đoán

Các nhóm dưới đây mô tả ranh giới hiện tại, **không phải profile/command mới**. Required counts được đọc từ runtimeStageCatalog; pre/post/reset từ t04Lifecycle. Xem [lifecycle](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/scripts/permission-runtime-t04-fixture.mjs:13), dòng13–18 và78–85.

| Nhóm | Stage theo thứ tự hiện hành và required count | Required | Ranh giới |
|---|---|---:|---|
| 1–9 | identity-database (42); candidate-images-service (1); administration-database (55); read-database (120); clear-demo-database (9); candidate-signals-database (3); financial-database (37); candidate-print-database (4); candidate-bulk-concurrency-database (4) | 275 | Legacy→legacy; không reset giữa các stage; vẫn quan sát và xác minh baseline sau từng stage. |
| 10 | candidate-e2e (2), toàn bộ 6 test và image measurement | 2 | Legacy→activated; đo ảnh, observe và restore original trước rời boundary. |
| 11–13 | candidate-seed-recovery-database (1); candidate-roles-e2e (1); realtime-e2e (1) | 3 | Prepare activated riêng; mỗi stage observe và restore original. |
| 14–16 | rollback-additive-database (1); rollback-preflight-database (1); rollback-recovery-database (1) | 3 | Pre legacy; hai stage đầu post legacy, recovery post candidate-pass-through; mỗi stage restore original. |
| 17–19 | transition-database (4); transition-e2e (1); transition-compatibility-database (3) | 8 | Hai stage đầu legacy→activated; compatibility pre/post candidate-pass-through; mỗi stage restore original. |
| Tổng | 19 stage | **291** | 275+2+3+3+8. |

Union full acceptance vẫn là LIGHT 6 stage/343 required + T04 19/291 + bảy service profiles 10/126 = **35 stage/760 required**, cộng 12 nghĩa vụ bổ sung, 34 context và A18/D19 hiện hành. Các nhóm chẩn đoán không đổi mẫu số hoặc đóng các gate khác.

Prepare có thể dựng activated/candidate-pass-through từ original baseline cho stage cần trạng thái đó; đây là fixture operation đã có, không phải cho phép bỏ precondition. Observe kiểm trạng thái mong đợi và storage; restore kiểm protected data **trước** khi khôi phục để không che regression. Sau restore phải cùng physical/backend và baseline/storage. Xem [prepare/observe](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/scripts/permission-runtime-t04-fixture.mjs:291), dòng291–318; [kiểm trước restore](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/scripts/permission-runtime-t04-fixture.mjs:319), dòng319–331; [xác minh sau restore](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/scripts/permission-runtime-t04-fixture.mjs:390), dòng390–397. Các ranh giới này làm lượt chẩn đoán nhỏ khả thi về mặt thiết lập fixture, chưa chứng minh có entry point được hỗ trợ.

## Hai cách chia có ý nghĩa khác nhau

**Lượt chẩn đoán dùng backend mới độc lập:** có thể tập trung vào nguyên nhân tại một whole-stage boundary, giữ full-file recipe, setup/readback/preservation/privacy/resource/cleanup guards. Mỗi lượt có source/run/attempt và backend riêng; kết quả chỉ có giá trị chẩn đoán trong phạm vi đã chạy. Những lượt này không chứng minh chuỗi 19 stage trên cùng physical backend và không thể cộng thành PASS của renderer hiện hành. Không kế thừa PASS nguồn cũ, bỏ lỗi đầu tiên hoặc gọi stage chưa chạy là lỗi sản phẩm.

**Chia thực thi mà vẫn giữ acceptance hiện hành:** hướng khả thi để đánh giá tiếp là các đoạn whole-stage có thứ tự **trong cùng owned backend/unit và checkpoint**. Mỗi lần chuyển đoạn phải xác nhận physical identity, baseline/archive/storage và receipt đã hoàn tất; giữ thứ tự, không lặp stage thất bại trong cùng attempt, không bỏ image measurement/restore/preservation. Cuối cùng vẫn phải qua renderer 19 hàng cùng binding. Đây là thiết kế có điều kiện cần hiện thực/review nếu evidence đòi hỏi, chưa phải tính năng hiện có và không bảo đảm khắc phục lỗi hoặc giảm tổng thời gian.

## Giới hạn thời gian và tài nguyên không tự mở lại

Unit có runtimeSeconds 1800, tức 30 phút; stop grace 30 giây. Loop 18 GiB, tổng task 20 GiB và host reserve 30 GiB giữ nguyên. Xem [CI1_LIMITS](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/scripts/permission-ci1-policy.mjs:6), dòng6–10.

T04 tính outer end bằng thời điểm launch bất biến +27 phút, để lại 3 phút cleanup trong unit 30 phút. Inner deadline là min(now+14 phút, outerEnd−30 giây); harness timeout tối đa15 phút và không vượt thời gian còn lại đến outerEnd. Worker còn thu nhỏ command timeout theo deadline tuyệt đối trước spawn. Xem [t04TimeBudget](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/scripts/permission-runtime-t04.mjs:19), dòng19–26; [command guard](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/scripts/permission-runtime-t04-worker.mjs:241), dòng241–247; [harness invocation](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/scripts/permission-runtime-t04-worker.mjs:649), dòng649–651.

Continuation cùng backend không được cấp lại 14/30 phút cho mỗi đoạn hoặc tạo unit mới để né trần. Nếu phần còn lại không vừa deadline/budget, segmentation không thể giữ acceptance theo giới hạn hiện tại. Lượt diagnostic mới độc lập vẫn có ngân sách/lifecycle riêng trong phạm vi điều kiện đã giao; không che chi phí bằng cách giữ nhiều runtime nặng song song.

## Công việc tối thiểu chỉ khi evidence kích hoạt fallback

1. Đọc safe receipt đúng source/run/attempt và boundary đầu tiên: phân biệt runner, image measurement, observe/restore/verify và transport refusal; UNKNOWN vẫn UNKNOWN. Giữ lỗi chính, lịch sử FAIL và cleanup evidence.
2. Nếu nguyên nhân cụ thể sửa được trong harness đã giao, sửa đúng nguyên nhân và kiểm regression tương ứng; không tự thay app/SQL/Auth/ACL, acceptance hoặc timeout để tạo PASS.
3. Nếu cần lượt nhỏ để chẩn đoán, thiết kế selection bằng whole-stage identity cố định, đúng lifecycle và scope riêng. Giữ validateRuntimeStage, binding, resource/privacy và cleanup guards; không dùng test-name grep hay cộng nhiều backend thành T04 PASS.
4. Nếu cần chia để đóng acceptance, đánh giá continuation trên cùng unit/backend/checkpoint với deadline gốc và receipt đủ 19 stage. Không resume sau failure bằng cách nhận phần chưa có proof là PASS.
5. Review source/tooling/packet thay đổi và kiểm binding drift, thiếu/duplicate/out-of-order stage, failed prior segment, reset/storage/physical drift, hết deadline và cleanup failure trước chạy trong phạm vi đã giao. Evidence mới gắn đúng source mới; tài liệu này là phân tích, không thay authorization hoặc runtime receipt.

Không triển khai hay chạy fallback trong khảo sát này. Whole CI/T04 được root điều phối vẫn là bước hiện hành; kết quả của nó quyết định có cần sử dụng ủy quyền có điều kiện hay không.
