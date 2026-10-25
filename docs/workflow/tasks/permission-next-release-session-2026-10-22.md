# Tiếp tục phân quyền sau checkpoint CI22/10/2026

## Điểm bắt đầu đã kiểm chứng

**Cửa sổ thực thi22Oct đã đóng ởcutoff10:15:** [receipt](../../implementation-log/permission-release-20261022/cutoff1015-checkpoint.json) ghi guardREFUSED/DEADLINE, SQLitem1 chưa được trả lời/khôngRun và không mởheavy. Lượt sau cần owner chốt cửa sổ giờ và quyền tương ứng; các snapshot trước cutoff bên dưới không tự cấp quyền chạy muộn.

- Candidate local/remote: `b2e3122866f5b6108f026f381f4f12614c98027c`; remote `run/permissions-20261020`; checkout sạch `D:/Workspace/pos-cafe-permission-ci-fix-20261022/code`, local branch `fix/permissions-ci-portability-20261022`.
- [CI39713372721](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/39713372721), attempt1, **18/18phasePASS**,12m54s. [Terminal metadata](../../implementation-log/permission-release-20261022/ci-portability/ci02-terminal-metadata.json), [safe summary](../../implementation-log/permission-release-20261022/ci-portability/ci02-summary.json). Windows904PASS và Linux904PASS được ghi riêng; nativePG16 actualserver160015/30PASS, Edge2bundles/badSRInegative/control/cleanup đều có kết quả. Peak1.316GB dưới5GiB. Một manual-deferred tooling case và37smoke applicability skips giữ đúng hợp đồng cũ, không gọi thành case thực đãPASS.
- Main và DB gốc chưa đổi. Staging `ineckiashpwloncxnbqx` là target duy nhất được phép ghi; gói SQL38 đãreview nhưng còn câu hỏi xác nhận riêng, chưaRun tại lúc lập checkpoint. Chỉ dùng terminalreceipt mới hơn để xác định nó có được chạy sau checkpoint này hay không.
- Hai candidatepublication/automaticCI22Oct đã dùng dưới hai grant riêng; hai claim không được reset. OldV3 ngày21Oct vẫn CLOSED với toàn lịch sử. Hạn owner hiện tại11:00 ngày22Oct, cutoffpublication/mutation10:15. Không tự mở hạn mới trong lượt tiếp tục.
- Checkout cũ `D:/Workspace/pos-cafe-permission-run-20261020/code` giữHEAD38 và15recoveryhelpers ngoài Git để không thay nguồn SQL đang chờ xác nhận. Không reset/switch/stage checkout bẩn của owner tại `D:/Workspace/pos-cafe`.

## Acceptance cần dùng

Giữ **35stage/760requiredidentities**,726PERM occurrences và111PIN mappings; fullfiles, khônggrep chọncase, không retry hoặc requiredskip. [Inventory gốc](../../implementation-log/permission-staging-20261021/inventory.json) SHA `0943976f676dcfcecfd76f79c117c81a3ab8cb8d016320484b4593602cbd0e7e`.

Acceptance hiện hành là [D19](../../../openspec/changes/redesign-permission-model/proposal.md) tại proposal dòng172–174 và [R0/R1](permission-delivery-r0-r1-2026-10-19.md), không hoàn thiện whole-D1/D2/custody framework lịch sử chỉ để phát hành. D19 vẫn giữ discover/report/source/config/lock/profile/preservation, backuprestore trước live, security và12nghĩa vụ bổ sung. Không nhận model fixture hoặc stagecounts riêng thành fullPASS. SafeJobSummary là route được chấp nhận; không cần giả mộtworkflowrun chung hoặc thêm GPG/ACK khi không chuyển private rawarchive.

[Ma trận12nghĩa vụ](../../implementation-log/permission-release-20261022/fullgate-obligation-map01.json) là source mapping, **không phải kết quả test**:6SOURCE_MAPPED_NOT_EXECUTED/6NEEDS_VERIFICATION tại lúc lập. Ghép với actualCI receipts mới để đóng từng leaf đã chứng minh; phần backend chưa chạy vẫnPENDING. Không suy reason lịch sử trong D1 thành12hook ứng dụng còn thiếu hôm nay. Ba ảnh PIN chỉ là credential-free mock; phải xem ảnh và ghi inspection riêng, giữ manifest upload nguyên trạng.

[Status sidecar](../../implementation-log/permission-release-20261022/fullgate-obligation-map01-status.json) giữ nguyên matrix đãreview và nêu rõ `currentLight:NOT_TERMINAL`/“Wait for terminal” trong matrix là **historical coordinator snapshot trước terminal**, được CI02PASS và inspection mới supersede. Không chạy lại CI chỉ vì đọc trạng thái lịch sử này; cũng không suyCI18PASS đã đóng toàn12nghĩavụ/backend.

## Đường backend đã có

| Lane | Stage | Required identities |
| --- | ---: | ---: |
| Light:5STATIC+1nativePG16 |6|343|
| T04 trên cùng syntheticphysicalbackend |19|291|
| Bảy serviceprofiles |10|126|
| Tổng |35|760|

Light đãPASS; **29backendstage/417identities cònNOT_RUN**. NativePG16 không được thay bằng hostedPG17. T04 dùng Docker/SUPERUSER thật/physicalidentity/wholeDBrestore; PIN expiredcredential dùng signingsecret của syntheticAuthcontainer. Stagingonline phù hợp triển khai schema/logic và kiểm contracts được cấp, còn các fixture hiện hữu chạy trên runner Linux cô lập.

Entrypoints hiện có trong `.github/workflows/backend.yml` của đúngcandidate:

- T04: `confirmation=RUN_T04_PROFILE`, `expected_source_sha=<reviewed SHA>`.
- Services: `confirmation=RUN_SERVICE_PROFILE`, cùngSHA và lần lượt `SUPABASE_T02`, `PIN_ONBOARD`, `PIN_RACE`, `PIN_EXPIRY`, `PIN_IDENTITY_SERVER`, `PIN_IDENTITY_ONBOARDING`, `PIN_CANARY`.
- Támjob chạy tuần tự qua concurrency group; mỗijob35phút. Configuredtotal4h40 chưa kểqueue/collect/review. Không có căn cứ cam kết đủ támjob trước11:00. `RUN_SYNTHETIC_PILOT` chỉT09/T10, không thay fullgate.

Lượt heavy tiếp theo chỉ bắt đầu sau owner chọn profile/ngân sách/hạn giờ, hai reviewer duyệt exactpacket và guard freshADMITTED. Không tự chọn mởT04 trong grantlightCI. Ưu tiên đề nghị một profile nguyên vẹnT04 để kiểm291identities/19stages và restore, nhưng đây là **đề nghị chưa được owner chọn**. Không cắt profile để vừa hạn; fail thì dừng, không retry/alternate mặc định.

## Ngân sách và admission còn phải giải quyết

Không cần sửa guard chỉ vì localbranch tênfix: `permission-runtime-admission.mjs` khóa **manifest remote dispatch ref** `run/permissions-20261020`, còn local chỉ kiểmHEAD/diff. Remote run branch hiện đãb2; sourceRoot mới phải được pin/review trong manifest/packet. Kết luận localbranch tự gâyMANIFEST đã được reviewer rút lại sau đọc code.

Blocker quyền thực tế: `permission-batch-budget.mjs` hiện chỉV1–V3. V1 đặt tokenlimits, trái quyết định owner time-only; successorV2/V3 có predecessor/cap constraints và oldV3 đãCLOSED. Không khởi tạo mộtV1 mới, sửadeadline/counter hoặc tái dùng grantlight để lách vấn đề. Cần thiết kế successor/time-only phase có tham chiếu các ledger đã tiêu và review trước heavy. **Chưa triển khai phần này trong candidateb2.**

Lưu ý về kế hoạch sửa tiếp: thay module guard trong candidate sẽ đổisourceSHA và đòi own-sourceCI mới. Tránh chu trình “đổi ngân sách → đổi code guard → mất binding CI → xinCI mới” cho từng grant. Đề xuất nghiên cứu schema/policy hỗ trợ các phase/grant mới mà không hardcode ngày/HEAD/root mỗi lần, giữ immutableparenthash/counts, actualownerreply, hai non-authorreviews, one-shotclaim và freshclock/disk/jobs/sourcechecks. Đây là thay đổi vận hành cần spec/review/quyết định trước code; không tự giảm gate để giữCIb2PASS.

**LỚN HƠN1GB nếu mở heavy:** estimate lịch sử2,5–3,5GBdownload/lượt, worst khoảng10GB khi boundedimagepulls lặp; chưa phải đo hiện tại. Peak một loop18GiB+outside1GiB+Windowsretained≤768MiB=19,75GiB; chỉ một runtime nặng. Guard phải đo hostquota/free và C/D≥30GiB, Windowsretained, priorreclaim, nguồn và còn42phútreserve. Outside1GiB là điều kiện đo của admission, chưa phải OSquota. Không cài WSL/DockerDesktop trên máy owner. Trước download mới phải thông báo estimates và đo lại, không dựa vào sốfree của checkpoint này.

## Thứ tự tiếp tục và điều kiện dừng

1. Đọc [handoff hiện tại](permission-release-2026-10-22.md), authorization/claims/terminalreceipts; lấy exactcandidateb2, không replay lượt đãtiêu. Xác nhận deadline và ownerdecision nào còn thiếu.
2. Kiểm actualCI bindings,18phase, reporter4+diagnostics7/20mutationchecks, nativecleanup, Edgeinputhashes; lưu/kiểm ba ảnh PIN; ghép12obligation map với evidence thật. Giữ các unknown rõ ràng.
3. Chốt thiết kế ngân sách heavy theo time-only và history; reviewhai scope trước khi xin grant/chạy. Dùng runner/profiles hiện có; không mở hostedadapter hoặc frameworkD1 nếu không có requirement mới.
4. Khi đã đủ quyền và preconditions, chạy đúngmột profile đã chọn. Sau terminalresult kiểm physicalpreservation/reclaim/actualrows trước khi xét profile kế. Cùngsource/config/lock; nguồn đổi thì evidence cũ không tự làPASS của nguồn mới.
5. Join đủ35/760,12nghĩavụ, ảnh/actualruntime, physicalpreservation của fixture và review cuối theoD19; kiểm production-hold bằng readback thực trước main. Khi đủ các điều kiện này mới mởPR/requiredcheck/merge+pushmain qua branchprotection. Backup/restore/recovery của target và xác nhận owner là cổng riêng **trước LIVE mutation/rollout**, không tự thêm chúng thành điều kiện merge mà D19 không yêu cầu. Không Vercel/production; DBgốc chỉ cập nhật sau xác nhận riêng của owner.
6. Đếncutoff hoặc guardREFUSE/failure/unknown: dừng phần phụ thuộc, lưu source/runIDs/counts/receipt/blocker và recipe. Không resetclaim/đổiexpected/requiredskip/timeoutđểqua. Cleanup đo thực sauprocessrelease, hỏi trước khi xóa temp chưa được cấp quyền. Tới11:00 vẫn thiếugate thì giữcandidate theo quyết định owner.
