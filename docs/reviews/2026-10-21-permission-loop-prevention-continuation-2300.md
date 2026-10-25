# Review continuation đến23:00 ngày21/10/2026

Owner cho tiếp tục đến23:00+07 qua message11:11:38.011UTC, sau đó reply11:13:46.625UTC chọn cấp thêm tối đa2vòng review, giữ1publication/1CI/2backend và yêu cầu kiểm kỹ trước khi chạy. Hai reviewer độc lập chỉ đọc/chạy phép kiểm cách ly; không edit, install hoặc dispatch.

Candidate03 SHA256 `c5e04116ff092bea6dfb36825cfafad7d9f9ae7ab4197dbb19abad9f48f3682c`: operations APPROVE; source CHANGES_REQUESTED. Source tái hiện hai successor byteidentical cùng predecessor/grant ở hai path đều init và mỗi bên dùng thêm2review, tổng6 dù grant chỉ2. Đây là blocker R3/R3b, không bị operations approval hoặc tests808PASS ghi đè.

Sửa: mỗi predecessor có durable `.successor.json` ràng buộc childPath tuyệt đối, childPolicySHA256 và parentPolicySHA256. Khởi tạo sibling/race khác bị từ chối trước anchor; đọc missing/drift claim failclosed. Chỉ seal hai cạnh lineage lịch sử đã có budget→17:00→23:00 từ exacthash đã review/inspect. Seal chạy11:21:44UTC trước sửa guard, chỉ thêm2claim/receipt; policy/journal/anchor/head/counters cũ không bị thay.

Candidate04 SHA256 `6bba1b1f9044d79ecb94e4a6f6e926fbe2c48bbca667f7aa1ff96f7524b3243e`, packet tại `D:/Workspace/pos-cafe-permission-run-20261020/evidence/loop-prevention-20261021/candidate04/packet.json`. Bao gồm18source,7docs,6operations/evidence,3checks và88canonicalpins; delta so315 chỉ3file budget/test/guide. Full Node810/810PASS0skip. Diagnostic code/collectors không đổi, actualcontrols7/7/20 của candidate03 được tái dùng với phạm vi rõ; CI mới sẽ kiểm lại.

**continuation_source_review — APPROVE candidate04, source/readiness local.** Kiểm độc lập27testsPASS0skip,34snapshots/88pins,4cuộc đua hai tiến trình: mỗi lần đúng1init thành công và bên kia SUCCESSOR_CONFLICT. Blocker sibling đã đóng; actualledger đọc đúng review4/4, execution0, usage giữ nguyên và deadline23:00.

**continuation_operations_review — APPROVE candidate04, operations/evidence/policy.** Đối chiếu34snapshots/88pins, source chỉ3file, retainedsession xác minh thứ tự seal/guard, claims là regularsinglelink đúngtaskroot. Oldpolicy/journalpins không drift; actualcounters4review/0executions. Đã xác minh810TAP/17budgettests và phạm vi reuse diagnostics phù hợp. Cảnh báo CRLF/canonical ban đầu được reviewer tự xác minh là false positive, không sửa source/packet để theo lỗi nhận định.

Hai approval cho phép tiến tới publication qua freshadmission, không thay own-sourceCI17 hoặc backendPASS, không tăng allowance.

Sau review: tạo commit `ed73a415737aaf6d460e90f1756148a6be4d19dc` đúng3file, kiểm88committedpins và origin chính xác. Publish dry-run ADMITTED, retained262.195.380bytes, C/D đều dư30GiB, khôngactivejobs/WSL và priorreclaim hợp lệ. Dispatch qua cùngadmission thành công, reserve publication1/1 + CI1/1. CI mới run39592119259 đang chạy; backend0/2. Kết quả và cleanup thực sẽ được ghi riêng, không nhận metadata dispatch thành PASS.

Kết quả tiếp theo: CI run39592119259 terminalsuccess, đủ17phasePASS trên chínhed73. FinalpublicSummary giữ4controlsgốc và7diagnostic/20mutation, Node810PASS. Đã đối chiếu toolingmanualdeferred1/smokeapplicabilityskip37 không tăng soCI22; không nhận các skip thànhexecutedPASS. Native uniqueNOT_PRESENT được bind bằng metadata/run/source/logSHA256. ActualPINadmission đạt retained262.306.840bytes/diskdư30GiB/globalbackendactive0; PIN_ONBOARD run39593847459 dispatch18:41, chưa nhận backendPASS.

Trướcbackend, cùnghai reviewer kiểm tiếp điều kiện vận hành trên cùngsource không đổi: source đối chiếu locatorTC18 vớioperatorHTML, PG17guard/rollback và config/catalog48+7/19stage; operations đối chiếu collector→native→manifest→actualadmission. Cả hai không thấy deterministicpreconditionmismatch trong phạmvi, không biến tiềnkiểm thànhruntimePASS. Đây là kiểm chứng vận hành của candidate04 đã duyệt, không sourceiteration hay allocation mới; countersreviewgiữ4/4.

## Backend setup failure và phần tiền kiểm còn thiếu

Run39593847459 terminalfailure trước test nghiệp vụ. Receipt `cloud-service14.json` giữ `edge-network-warm / EDGE_CACHE_PROOF / EDGE_CACHE_PIN`, imageOrdinal12/packageOrdinal9/version1.6.8. `cleanup:true`, không cleanupFailure; measured reclaim19.327.365.120bytes. Không nhận kết quả này thành48+7 đã chạy.

Source investigator ánh xạ package9 thành `@types/phoenix`: pin1.6.7 ở `tests/permissions/runtime/ci1-edge.json:86`, nhưng realtime-js2.10.2 yêu cầu `^1.5.4` (manifest:49), nên resolver online chọn1.6.8. `ci1EdgeBundleArguments` service-worker:564 dùng networkhost, không lock/import-map; proof:520 chỉ kiểm allowlist sau resolve. T04 cùng cách ở proof:518/warm:794–806. Cả hai hàm proof thật tái hiện cùng failure với cache adapter trong bộ nhớ, không runtime nặng.

Operations investigator xác nhận admission kiểm disk/CI/reclaim/budget, chưa kiểm resolution graph Edge hiện tại. CI17 npm lock dùng SDK2.108.1, khác graph Edge2.45.0; unit cache fixture kiểm validator, không chạy resolver thật. Vì vậy admission đã đạt đúng hợp đồng hiện tại nhưng thiếu một tiền kiểm có khả năng phát hiện drift này trước heavy. Không suy CI17PASS thành proof Edge.

Giữ **HOLD T04** và lượt heavy cuối. Không bỏ validator, chấp nhận mọi version hoặc cập nhật pin mù. Hướng tiếp theo: xác minh lock/config của đúng Edgev1.74.3; cố định toàn graph review; chạy phép kiểm runtime Edge gọn với fresh cache, SRI và offline replay trước fullbackend. Source thay đổi cần review/CI mới; publication1/1,CI1/1,review4/4 đã hết, không tự reset hay dispatch thêm. Đây là phát hiện sau candidate04, chưa có bản sửa resolution được review.

Owner18:59 sau đó cấp thêm1/1/1/2. Candidate06/source90e30f2 có haiAPPROVE nhưng CI25FAIL tạiEdgeprobe cleanup0555, chưa nativePASS. [Hồ sơ mới](2026-10-21-permission-edge-cleanup-incident.md) ghi defect/primaryUNKNOWN/stop. Khôngbackend mới, V3đóngcounts2/2/1/6; các status ở trên là lịch sử từngcheckpoint.
