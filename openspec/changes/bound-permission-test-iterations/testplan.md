> **Đối chiếu xuất bản 25/10/2026.** Các ngân sách, deadline, spent counters và authorization21/10 bên dưới là lịch sử đã kết thúc. Xuất bản hồ sơ không cấp lượt CI/backend/retry mới và không reset ledger. [Nguồn, trạng thái và giới hạn](../../../docs/workflow/tasks/docs-wip-publication-2026-10-25.md). Các yêu cầu SHALL/expected bên dưới được giữ; không đổi để hợp thức hóa code.

# Kiểm chứng

T1: failed/timedOut/interrupted có ordinal/code/line qua projections/parser/filter/collector. T2: runner-origin không giả testcase, skipped không che lỗi sau. T3: binding source/run/config/invocation/argv stale; malformed/oversized/duplicate/private transport phải từ chối.

T4: cùng budget đổiSHA/chat/identity vẫn giữ spent; hết allowance/deadline/unknown/stale/token stop phải từ chối ởV1; V2 explicitoverride chỉ thay token/time, không resetspent. T5: journal corruption/truncate đầu/suffix/empty, missing-stale-pendinghead phải bị từ chối — đã có regressionPASS candidate02. T6: unique usage gồm descendants, không cộng cumulative/cache/reasoning hai lần; conflictingduplicate/invalidtimestamp thànhUNKNOWN.

T7: hai manifest PIN/T04 cùng helper; staleCI, thiếu controls/review/cleanup, active runtime, disk thấp phải từ chối. T8: actual pinned Playwright failed/timeout/interrupted/runnererror/metadata absent + wrapper/refusal controls trong CI17; mutation bỏ facts phải làm controlFAIL. T9: collector thật đọc finite evidence trước reclaim; full Node regression + hai final reviews.

Đã chạy targetedT1–T7 một phần:58PASS0skip trên checkpoint source. T5suffix/T8/T9 và final review chưa đạt. Bằng chứng/recipe tại handoff, không suy NodePASS thành actual browser/backendPASS. Backend chỉ được mở khi guards thật đã đạt và budget còn đủ timeout/cleanup.

Checkpoint tiếp tục16:14: budget12testPASS gồm suffix-to-empty/mất-stale-pendinghead, negative/NaN/fractionalreserve, cumulative V2 và pinnedlegacyimport; transport7PASS gồm verifier bị mutation ở4boundary; admission2tests gồm26negative variants và2profiles. Fullscripts Node804/804PASS0skip (sau cấu hình PERMISSION_STATIC_TEST_TMP trênD và refresh canonical hash của project-ci). Actual Playwright1.60.0 theo lock, ba package integritySHA512 khớp, không browserdownload:7/7controlsPASS,20mutations. Bằng chứng local gắn base316+WIP snapshot, không phải source316CI/backendPASS. Sau delta admission phải chạy lại tests liên quan; reviewer và own-source CI còn pending.

Recipe Windows fullNode: tạo owned temp dướiD trong evidence, đặt PERMISSION_STATIC_TEST_TMP tới đó; node --test --test-concurrency=2 --test-reporter=tap trên git ls-files scripts/*.test.mjs cùng3test mới. Không gồm15private recovery helpers lịch sử. RawTAP lần chưa cấu hình được giữ (796PASS/8FAIL), không ghi đè lịch sử. T8 negative report không lưu rawmessage, private sentinel phải vắng mặt. T4 kiểm deadline đúng17:00 và reserve37/42phút; không nhận unlimitedtoken thành unlimitedtime.

Candidate02 thêm test actualpublicSummary→admission và stale source/lock/mutations/states, alternateledger/hash/workstream. Actualpinnedcontrols chạy lại qua2workerexport thật:7/7PASS,20mutation. FullNode805case cần đạt trên finalsource; kết quả và hash trong packet02. Giữ candidate01 làm lịch sử với3finding chặn, không sửa verdict cũ.

T10 (R3b): predecessor đã dùng2review và1heavy; explicitgrant2 làm tổngreview4, spent vẫn2/1, chỉ còn2review/1heavy. Khônggrant/sai1/thiếureference/tăngheavy/replay lên6 phảiREFUSE. Chạy15budgettests và fullscriptsNode808case trên candidate mới, không nhận805cũ thành PASS source mới. Kiểm deadline23:00 và reserve37/42phút đúngbiên. Beforebackend checklist phải lấy actualCI17 mới đúngsource, publiccontrol7/20, native+priorreclaim và preflight fresh.

T11: hai successor byteidenticalpolicy/grant ở2path phải chỉinit1; siblingREFUSE trướcanchor. Chủgrant chỉcấp tổng2review, không2mỗipath. Time-only sibling cũngkhông đượcforkexecutionallowance. Mất/sửa claimrefuse, khôngresethead/counters;17budgettests vàfullNode810 phảiđạt trêncandidate04. Lần test đầu thiếuimportlstatSync đượcgiữ là lỗi testharness, phải rerun sau sửa; không nhận thànhPASS.

## Bổ sung Edge và grant18:59

T12 (R3d): giữ cumulative counts qua V3, chỉ exact increment1/1/1/2, sai/thiếu auth/increment/deadline/predecessor/sibling phải từ chối; publication thứ3 bị chặn, deadline23:00 không đổi.

T13 (R6): graph20/dualNode mapping/fullSRI; thiếu lock, sai edge/hash/specifier/unknownversion và config lockfalse phải refuse trước resolve. Cả hai worker truyền config rõ và cache proof thật vẫn từ chối actual regression1.6.8. Native archive traversal/link/duplicate/expandedoverflow/missingbinary failclosed. Finite failure metric qua parser→publicSummary giữ ordinal/package/version, reject out-of-range/private/duplicate. CI actual native2entrypoint fresh-cache + bad-SRI control và closure20/cleanup là PENDING cho đến run nguồn mới; local unit không thay nó. Giữ đầy đủ17 gate cũ và backend PIN48+7/T0419 sau own-sourceCI18.

Local full Node edge-full-node-03.tap:821/821PASS0skip trên WIP sourceed73+delta. Giữ lần01 (817/819, thiếu refresh release pins/phase array) và lần02 (820/821, fixture exporter thiếu preceding phase prefix); đã sửa test recipe/harness, không giảm acceptance. Native archive inspection có hash/245.736.752B; chưa chạy binary trên Windows.

## Đóng lượt sau CI25FAIL

CI25 nguồn90 đãchạy7phasePASS: unit1175,tooling567PASS/1manualDeferred,Node823,reporter4+7/20; phase8EdgeFAIL7.063ms vàphases9–18NOTRUN. Không nhận thànhCI18PASS. Thiếu test actualLinuxnonroot0555 cleanup và precedenceprimary/cleanup; đề xuấtfixture nhỏ chạy trướcarchive83MB. Edge rootRemoved/reclaim/bundle/badSRI chưa cóproof. Actualdatahelper đãrefuseCI_NOT_PASS, manifestCreatedfalse,dispatch0,countsunchanged; V3CLOSED. Không chạy thêmruntime theoownerstop.

## T14 — V4 continuation, checkpoint 20:13 ngày 22/10/2026

Theo 14 nhóm V4-01…V4-14 tại [plan đã review](../../../docs/workflow/tasks/permission-timeonly-budget-v4-2026-10-22.md): giữ V1–V3 regression; kiểm bridge hostile/duplicate/sibling/crash/head, derive history 4/4/1/6, atomic publication-CI, phase limits qua hai SHA, pending-heavy race, terminal/source/profile/attempt/reclaim mismatch, failed-source replay, actual owner/time-only và exact 42 phút. Runtime kiểm publication không đòi CI chưa tồn tại, heavy từ chối CI cũ, non-author reviews/local whole-suite, active backend ở branch khác, malformed API và cutoff/source drift sau claim. Uncertain action giữ spent và không tự retry. Phụ lục post-gate CI giữ counter riêng cho 2 automatic CI đã được owner cấp; fullgate và hai final review vẫn bắt buộc trước PR/main.

Đã chạy trên candidate sạch `ad265321144521c0669500fea9be0f96ebacb769`: targeted guards trước heavy, whole 69 tracked Node files 935/935 PASS, fail/skip 0; receipt `D:/Workspace/pos-cafe-permission-timeonly-20261022/evidence/night-node02.json` và TAP/hash giữ nguyên. Hai non-author final scopes APPROVE packet `publication-packet02.json` trong `publication-reviews02.json` trước push. CI18 mới run `39780944907` terminal PASS; node-tools 935/935, runtime reporters 4 controls + 7 diagnostics/20 mutations, native resolver closure 20 và cleanup đã collect; own publication intent được settle qua `night-ci01-terminal.json`/`night-ci01-settlement.json`.

Số skip không được viết thành zero trên toàn CI: tooling 567 PASS/1 manualDeferred; smoke 44 PASS/37 skip theo applicability được chấp nhận. Chỉ whole local Node và CI node-tools ở trên có skip 0. Không suy CI18 hoặc total-count PASS thành full coverage hay full business PASS.

Regression chuẩn bị giữ bằng chứng refusal source cũ `f35126a0a11a227d1f294f39ba60032df8978ab1`: maxBuffer 1 MiB không chứa được PNG 1.743.309 bytes, ENOBUFS trước reserve. Bản mới kiểm đủ 1.107 Git pins qua binary batch 41.686.492 bytes, bound 64 MiB và framing/hash/order/EOF negatives; fresh whole 935 + hai review sau sửa. Không bỏ asset/pin, không tiêu CI/backend cho refusal cũ. [Incident](../../../docs/implementation-log/permission-main-staging-night-20261022/preparation-incidents01.json) và `publication-admission01.json` được giữ riêng khỏi runtime verdict.

T04 nguyên 19-stage profile run `39783325574` đang active theo điều phối tại checkpoint; 1/8 whole backend đã khởi chạy, 7 service profiles chưa chạy. Mỗi lượt tiếp theo phải fresh admission, chỉ một heavy active, có terminal/reclaim/settlement trước lượt sau. Full35/760, 12 obligations và final D19/R0/R1 vẫn CHƯA PASS; source mapping hoặc ảnh PIN không thay runtime receipt. Không dùng hosted staging thay Docker/PG16 fixture. [Owner cleanup grant](../../../docs/implementation-log/permission-main-staging-night-20261022/owner-fixture-cleanup-grant01.json) giữ report/hash trước dọn owned fixtures tới 00:00; [Auth/TEST grant](../../../docs/implementation-log/permission-main-staging-night-20261022/owner-auth-test-grant01.json) 21:00–21:45 là supplemental, chưa bắt đầu và không cấp Edge/main PASS.
