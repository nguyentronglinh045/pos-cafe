# V4 — phụ lục chỉ ghi nhận CI sau full gate, 22/10/2026

**PROPOSED; chưa implement phần này cho tới khi hai non-author reviewer APPROVE exact hash.** Author `/root/budget_time_guard_fix`; phụ lục hẹp của [plan V4 đã review](permission-timeonly-budget-v4-2026-10-22.md). Không tạo controller PR/merge hoặc aggregator fullgate; vẫn chỉ sửa ba file budget/module test/operator README trong tổng scope năm file.

## Quyền mới và giới hạn

Actual owner reply `request_user_input_async call_2d0c88f57f7541cca1a9ee2226283df6 item0` ở [owner-pr-main-grant01.json](../../implementation-log/permission-main-staging-night-20261022/owner-pr-main-grant01.json), recorded12:02:10UTC22Oct, cấp tối đa **hai automatic CI thêm**: một do PR và một do cập nhật main, chỉ sau candidate đạt fullgate không đổi. Recording time không phải claimed exact click time. Candidate grant giữ2publication/2candidateCI/8wholebackend; deadline17:00UTC giữ nguyên; không production/DBgốc/hosted/Auth/Edge writes. Chỉ xóa nhánh của task sau verified successful merge theo quyền đã ghi, không xóa bằng chứng hoặc nhánh khác.

Mục đích phụ lục: giữ cùng một lịch sử, pending slot và reserve cho hai CI này ngay từ candidate code hiện tại; tránh sửa guard tạo SHA/CI mới sau khi heavy đã xong. Không tự cấp thêm push/CI/heavy hoặc retry.

## Thay đổi dữ liệu/API nhỏ nhất

Thêm optional `postGateCi` vào policy V4 trước init:

```text
postGateCi = {
  grant: {path, sha256},
  limits: {pull_request: 1, main_push: 1}
}
```

Grant raw-pinned phải ghi đúng additionalAutomaticCi2, deadline bằng policy, actual reference/answer/recording time; không trùng grant cũ. Không có field này thì CI-only luôn REFUSED. Hai purpose là hai slot riêng, không đổi một PR lỗi thành main slot hoặc tạo PR2 bằng identity khác.

Export thêm `reservePostGateCi(path,{repository,branch,sourceRoot,sourceSHA,purpose,identity,packet,reviews,now,reserveMs})`. `sourceSHA` là candidate đã fullgate; purpose đúng `pull_request` hoặc `main_push`. Packet/reviews là refs raw-pinned; không boolean `fullGate:true`. API chỉ ghi intent CI-only, không mở PR, merge hoặc push. Pending intent dùng `kind:ci`, `profile:null`, purpose/source/mapping refs; dùng cùng exclusive lock/head/journal và single-pending slot của publication/heavy. `inspectBatch(...,{reservationId})` chỉ cho đúng own intent revalidate, vẫn kiểm source/time/scope.

Giữ `phaseCounts.ci` là **candidateCI** đã đi cặp publication; thêm `postGateCiCounts:{pull_request,main_push,total}`. `counts.ci`/`totalCounts.ci` là lịch sửCI + candidateCIphase + CI-onlyphase. `historicalCounts` ở successor lấy tổng thật này; future grants không mất hoặc nhập lại CI-only. `phaseCounts.publication`/heavy không tăng khi reserve CI-only. Một purpose tối đa một intent, unknown/failure vẫn spent.

## Fullgate/review trước consume

Packet `permission-postgate-ci-packet-v1` bind repository, candidateSHA, candidateTreeSHA, purpose, authors, acceptance `D19/R0/R1`, fullGate ref và purpose mapping. FullGate là kết quả đã kiểm thực, không là ma trận source-mapped. Hợp đồng tối thiểu của attestation `permission-fullgate-reviewed-v1`: sourceSHA candidate, statusPASS, stageCount35, requiredIdentities760, đúng12obligations đều PASS, không requiredskip/retry và có raw-pinned inventory/receipt references để truy nguyên toàn bộ nguồn/evidence. Tool đọc/hash tất cả refs được packet kê; không tự tái triển khai join35stage hoặc quyết định business acceptance.

Hai review source+operations khác nhau, không có tên trong packet.authors, APPROVE đúng raw packet hash và fullGate ref. Người review chịu trách nhiệm kiểm meaning D19/R0/R1, 35/760,12nghĩavụ, privacy/preservation/source binding thực. Placeholder, pending/source-mapped/partial receipt không cấp quyền. Kiểm tra này chỉ tiêu CI sau khi gate đã được kết luận đúng; không biến bookkeeping tool thành fullgate engine.

## Candidate và actual CI source khác nhau

Không ép candidateSHA bằng PR synthetic mergeSHA hay main mergeSHA. Packet chứa mapping đã review cho repository/ref/head/base/tree; actual GitHub API/commit objects và CI summary dùng để đóng mapping cụ thể.

- Trước reserve `pull_request`: pin candidate headSHA, current main baseSHA, candidate treeSHA và actual candidate/base Git commit objects. Root kiểm fresh remote/base/head và không có PR/active job ngoài phạm vi trước external action. PR number chưa tồn tại được bind sau khi tạo bằng raw PR response cùng exact head/base/repository; không nhận một PR khác cùng tên nhánh.
- CI PR terminal: actual testedSHA lấy từ public CI summary, `event=pull_request`, `prHeadSHA=candidateSHA`. Dùng **existing `sourceBinding` PR-aware attestation** với actual Git commit parents chính xác `[reviewedBaseSHA,candidateSHA]`; raw Git commit object tree phải bằng candidateTreeSHA. Raw run metadata/PR objects phải bind run, attempt1, event, repository, PR number và actual head/base; lưu vai trò cụ thể của metadata.head_sha khi quan sát, không suy nó bằng testedSHA hoặc candidate chỉ từ tên trường.
- Trước reserve `main_push`: PR purpose đã settle SUCCESS; packet mapping pin PR number/head/base/tested tree và CI PR receipt. Root kiểm fresh base/head/branch protection và fullgate vẫn cùng candidate; base drift thì REFUSED/review lại, không merge để tìm kết quả.
- Main CI terminal: eventpush, actual sourceSHA là commit main thực, raw PR merged result/merge_commit_sha và current-main observation phải bind commit này, tree bằng candidateTreeSHA. Summary.prHeadSHA phải null. Commit identity có thể khác candidate nhưng nội dung cây phải chính xác như candidate đã fullgate; tree khác không được nhận acceptance cũ.

Existing PR CI `sourceBinding` kiểm synthetic merge parents, không dựa vào webhook merge_commit_sha có thể stale. Giữ logic này; không sửa workflow/sourceBinding để ép equality sai. `workflowSHA` có thể là SHA khác theo event: raw workflow-file/source pins phải được review/đối chiếu với workflow đã duyệt thay vì thêm equality candidate/tested/workflow thiếu căn cứ.

Nếu chưa thu được mapping/attestation hiện có đủ chặt, giữ intent PENDING và báo thiếu bằng chứng, không đoán head/base/tree hoặc tự mở adapter mới. Không tuyên bố full backend đã chạy lại trên mergeSHA; acceptance dựa candidate fullgate cộng exact tree equivalence và CI actual merge/source đã bind như trên, cần hai final reviewer xác nhận.

## Settlement, deadline và failure

Mở rộng `settleBatchDispatch` cho `kind:ci`, purpose và mapping refs. Raw-pinned terminal proof cần actual GitHub metadata, PR/commit objects, CI18 summary và nativePG16 NOT_PRESENT/rootRemoved/processReleased receipt cho **actual testedSHA/run**, không lấy candidate native receipt thay. Metadata/summary/purpose/PR/tree/workflow mapping phải khớp packet và đúng attempt1. Success phải PASS18/18 cùng actual preservation; known failure vẫn cần metadata/cleanup thật để nhả pending, nhưng chặn phần phụ thuộc và không refund slot. UNKNOWN hoặc thiếu mapping/cleanup tiếp tục PENDING, không rerun.

Reserve trước external action, dùng42phút tổng đến cùng deadline và strict `now+42min<deadline`, fresh clock trước claim và trước action. CI-only không tạo ngoại lệ thời gian. Main purpose không cấp quyền production/deploy; nó chỉ giữ sổ cho CI đã được owner cấp. Không thêm command thực thi PR/merge vào budget module/runtime admission.

## Test cases trước triển khai

| ID | Kiểm chứng | Expected |
| --- | --- | --- |
| PG-01 | Policy thiếu/giả/tamper grant, deadline mismatch, limits sai, replay grant | CI-only REFUSED, core V4 unchanged |
| PG-02 | Candidate pair2CI và hai CI-only; inspect rồi successor | CandidateCI vẫn2, extraCI2, totalCI tăng4 đúng và history không reset |
| PG-03 | Same purpose/identity/SHA đổi tên; purpose lạ hoặc PR2 | Một PR và một main slot tối đa; spent không refund |
| PG-04 | Gate34stage/759identity/11obligation, statuspending/source-mapped, missing raw refs hoặc changed pin | REFUSED trước consume |
| PG-05 | Self-review, một reviewer, wrong packet hash, reviewer cùng author | REFUSED trước consume |
| PG-06 | PR valid candidate≠synthetic SHA với actual parents base/head, prHeadSHA đúng, tree đúng | Accept mapping; không equality giả candidate/tested SHA |
| PG-07 | PR head/base/parent order/tree/repository/event/run/attempt/workflow pin drift | Settlement REFUSED, pending giữ nguyên |
| PG-08 | Main valid mergeSHA≠candidate, raw merged PR/commit/mainref và exact candidate tree | Accept mapping; candidate receipt không giả thành merge-source execution |
| PG-09 | Main trước PR success, base drift, wrong PR/mergedsha/tree, candidate cleanup dùng thay actual source | REFUSED, pending/spent an toàn |
| PG-10 | Concurrent CI-only với publication/heavy; exact42boundary; time crossed postclaim; unknown external result | Single pending, no external retry, spent retained |
| PG-11 | CI18 missing/fail/skipped, absent reclaim, attempt2, metadata-only positive flags | Không PASS/không nhả pending thiếu proof |
| PG-12 | Legacy21 + core V4 tests, whole tracked Node suite và two final candidate reviews | Không regression; sửa một candidate trước own-sourceCI/heavy |

Hai reviewer phải APPROVE phụ lục trước thêm code. Sau implementation, targeted tests và full tracked Node suite, source/operations exact candidate review vẫn bắt buộc trước publication. Phụ lục không tạo quyền thực thi từ lúc viết.
