# Phase time-only V4 — kế hoạch trước triển khai, 22/10/2026

Trạng thái: **PROPOSED, chờ hai non-author reviewer APPROVE exact bản này trước sửa code**. Author: `/root/budget_time_guard_fix`; coordinator `/root`. Không có claim, publication, CI hay heavy nào được tạo bởi tài liệu này. Kế hoạch là phụ lục thiết kế/test của change [bound-permission-test-iterations](../../../openspec/changes/bound-permission-test-iterations/proposal.md); sau review phải cập nhật design/testplan/traceability/tasks của change cùng kết quả thật.

## Quyền và phạm vi

Coordinator chuyển grant owner mới: phase tối đa **2 candidate push + 2 automatic CI + 8 whole backend profiles**, review/subagent theo thời gian, không áp token cap; giữ tối đa một heavy. Deadline cứng **2026-10-22T17:00:00Z**, tức 00:00 đầu23/10 theo Asia/Bangkok. Mỗi dispatch phải còn **hơn hoặc bằng khoảng dự trữ 42 phút**, theo quy tắc thực thi dưới đây. Không retry cùng source khi đã lỗi; chỉ push khi local checks và review không còn known error. Fullgate giữ 35stage/760required identities,726PERM occurrences/111PIN mappings, discovery/config/lock/privacy/preservation và D19/R0/R1. Phase guard này không mở quyền hosted mutation; DB gốc bị cấm ghi tuyệt đối. Các synthetic backend fixture cô lập theo hợp đồng hiện có, gồm nativePG16 và T04, vẫn thuộc grant tám whole profiles. Không tạo hosted adapter hoặc dùng staging đã populated làm pristine fixture. Hosted writes/Auth settings/Edge deployment tiếp theo cần scope và cửa sổ riêng; kế hoạch này không chạy SQL, không đổi SQL/Auth/Edge.

**Owner grant thực đã lưu tại [owner-grant01.json](../../implementation-log/permission-main-staging-night-20261022/owner-grant01.json)**: `request_user_input_async call_917e58ccb3a447838f9b40f2d36145e6 item0`, answer “cho phép, nhưng chỉ nên push khi code không còn gây lỗi”. Receipt `recordedAtUtc=2026-10-22 11:44:58 UTC` là thời điểm ghi nhận bằng chứng, không khẳng định giờ click chính xác. Policy phải pin raw receipt cùng reference này trước init; lời chuyển của agent không thay bằng chứng owner. Grant2CI ở đây chưa bao gồm CI tự sinh bởi PR/main. Phần PR/main automatic CI **PENDING owner grant**, không âm thầm lấy thêm hoặc bỏ check. Hai push/CI là trần mới, không phải yêu cầu dùng hết; một lỗi tiêu claim và không tạo quyền retry.

Source base đã có: `b2e3122866f5b6108f026f381f4f12614c98027c`, clean tại `D:/Workspace/pos-cafe-permission-ci-fix-20261022/code`; own-sourceCI39713372721 PASS18/18. Sửa guard tạo SHA mới, cần CI18 của chính SHA mới trước heavy; không dùng PASSb2 cho nguồn mới.

## Lựa chọn nhỏ nhất và lý do

Thêm **một schema V4 tổng quát** vào module hiện có, giữ nguyên đọc/validation V1–V3 và bằng chứng cũ. Không thêm module có ngày/HEAD/root hardcode, không viết controller ngoài repo gọi trực tiếp gh để né budget. Sau lần sửa này, ngày, root, deadline, grant và candidate là dữ liệu policy/packet; grant tiếp theo không cần sửa code chỉ để đổi thời gian.

Giới hạn code dự kiến5file: `scripts/permission-batch-budget.mjs`, `scripts/permission-batch-budget.test.mjs`, `scripts/permission-runtime-admission.mjs`, `scripts/permission-runtime-admission.test.mjs`, `scripts/permission-batch-budget.README.md` mới. Không sửa backend workflow/fixture, product source hoặc dependency. Nếu phát hiện cần đổi scope ngoài năm file, dừng slice đó và review lại thay vì mở framework. Docs/spec/evidence nằm trên docs branch, operator README ship cùng tool trên code branch.

Chuẩn bị reversible đã thực hiện: coordinator tạo `D:/Workspace/pos-cafe-permission-timeonly-20261022/code` từ b2 sau disk preflight, báo dữ liệu thực41,7MB trong estimate50–80MB. Readback tại lúc sửa plan xác nhận HEADb2 và workingtree sạch; chưa sửa appcode. Không npm/install/browser/WSL/Docker mới. Giữ C/D≥30GiB và tổng dữ liệu task≤20GiB ở checkpoint tiếp; source checkout không phải môi trường heavy thứ hai. Không xóa temp cũ nếu chưa được cấp quyền. Quyền tạo checkout không thay gate hai review trước sửa code.

## Hợp đồng V4

Policy immutable, schema `permission-batch-budget-v4`; chứa `phaseId`, cùng workstream/originalStartedAt, `budgetMode=owner-time-only-continuation`, `usageLimits=null`, owner reply/reference/thời điểm quan sát/deadline đã cấp, phase limits `{publication:2,ci:2,heavy:8}`, review mode time-only, scope repository/ref/sourceRoot và đúng tám whole profiles. Không mã hóa actual ngày/SHA/root của lượt này thành hằng số trong module. CandidateSHA nằm trong từng reviewed packet và claim; hai candidate của một phase cùng dùng một ledger, không khởi tạo lại phase cho SHA thứ hai.

V4 nối predecessor CLOSED có raw pins policy/anchor/journal/head; đọc lại chain hợp lệ, lấy spent và reservation identity thực. Đợt bridge đầu tiên nhập hai external publication claim22Oct qua policy+claim raw pins dưới đây. Parser bridge chỉ hỗ trợ đúng hai schema claim lịch sử hiện có, kiểm payload source/phase/policy hash/predecessor/action grant và thứ tự parent của remediation; reject missing/duplicate/tamper. Mỗi claim cộng đúng1publication+1CI; **không cộng lại predecessor counts lặp trong payload**. Những ref lịch sử này là dữ liệu được hai reviewer kiểm, không hardcode vào executable.

Kết quả phải suy ra lịch sử trước V4 là publication4/CI4/heavy1/review6: old ledger2/2/1/6 cộng hai claim1/1/0/0. Đây là expected test/readback, không là một seed thủ công thay journal. Lưu riêng historical totals, phase spent và tổng cộng. Unused allowance của grant đã đóng/hết hạn không tự chuyển thành quyền phase mới. Review mới vẫn được ghi evidence/timestamps nhưng không bị trần token/số reviewer cũ chặn trong phase đã được owner cho phép.

Giữ exclusive successor claim tại predecessor, hash chain và independent head. Parent chỉ nhận một successor; sibling/newpath/newSHA/newidentity không nhân allowance. Future V4 successor bắt buộc CLOSED parent và actual grant mới, kế thừa toàn bộ lịch sử cùng imported-claim identities để không nhập lại bridge. Thay policy/journal/head/claim làm guard fail closed, không auto repair/reset.

Mỗi candidate publication là **một atomic journal reservation** tăng publication và CI cùng lúc trước push; không có cửa sổ chỉ tiêu một nửa cặp. Unknown push/dispatch vẫn tiêu claim. Mỗi heavy reservation bind candidateSHA+wholeprofile+attempt identity, giữ trạng thái PENDING độc quyền cho tới khi đối soát terminal receipt cùng runId/source/profile và reclaim thật. Pending/unknown không tự được giải phóng vì gh list chưa kịp thấy job; hai dispatcher tranh nhau chỉ một bên có quyền tạo intent. Giữ workflow concurrency như lớp bổ sung.

Terminal failure/unknown được ghi bất biến, chặn retry profile lỗi trên cùng source và dừng phần phụ thuộc; đổi identity/chat không mở lượt mới. Muốn sửa nguồn phải qua local checks, hai review và publication/own-sourceCI mới, vẫn tiêu cùng phase2/2/8. Một heavy lỗi đã tiêu sẽ làm thiếu ngân sách tám profiles của nguồn mới; không giả kết quả cũ thành PASS nguồn mới hoặc tự cấp lượt thứ chín.

## Admission và thời gian

Runtime admission giữ source clean/HEAD/blob pins/remote exact và hai reviewer source+operations khác author và khác nhau. **Candidate publication** cần whole local checks cùng hai review đã APPROVE, sau đó push mới tạo automatic CI; không yêu cầu own-sourceCI của SHA chưa được push. **Heavy dispatch** mới yêu cầu full own-sourceCI18 PASS, reporter4+diagnostics7/20mutationchecks, nativecleanup và Edge input bindings của đúng candidateSHA đó. Budget V4 scope phải bind repository/ref/root/allowed profile; reviewed packet bind exactcandidate. C/D≥30GiB, retained≤768MiB, priorreclaim, host/outside/loop budget và một heavy tiếp tục giữ nguyên. Query active backend jobs ở phạm vi repository/workflow, không chỉ30run của một branch. Không queued heavy thứ hai.

Thứ tự: collect fresh facts → validate reviewed scope/pins/clock → exclusive atomic claim+fsync → collect/revalidate live facts/clock ngay trước gh push/dispatch. Crossing cutoff hoặc uncertainty giữ claim đã tiêu và REFUSED; không replay tự động. Settlement pending heavy chỉ sau metadata terminal có binding chính xác và receipt preservation/reclaim hợp lệ; thiếu bằng chứng giữ block để coordinator điều tra.

**42 phút là tổng khoảng còn lại từ thời điểm dispatch tới deadline**, bao gồm job được cấu hình tối đa35phút và buffer7phút; không cộng thành35+42phút cho mỗi job. Dùng `now + 42min < deadline` để giữ hành vi fail-closed hiện có tại exact boundary; cần công khai operator rằng đúng23:18 local đã từ chối nếu deadline00:00. Tất cả publication/CI/heavy của phase này dùng cùng reserve42 theo grant. Clock đọc mới sau I/O và ngay trước external action. Guard không phải scheduler tự kill model/process lúc deadline; coordinator còn phải giữ thời gian chốt evidence/handoff và không làm việc quá hạn.

Tám job×35phút=280phút worst case. Cửa sổ18:30→00:00 có330phút. Reserve42 đã gồm35phút của job cuối, nên không trừ thêm42 sau tổng280: cần giữ7phút buffer còn lại và strict boundary; tổng overhead ngoài thời gian tám job phải **nhỏ hơn43phút** (`330−280−7`), gồm sửa/review/CI/queue/thu receipt/chốt handoff. Thời gian đã qua kể từ18:30 cũng thuộc overhead này. Không bảo đảm fullgate/main trước hạn vì overhead thực chưa được chốt; runtime thực ngắn hơn có thể tạo thêm dư địa nhưng không giảm coverage để vừa thời gian. Sau mỗi terminal chỉ dispatch tiếp nếu còn reserve và mọi gate vẫn hợp lệ. Deadline đến thì giữ candidate và checkpoint chưa hoàn tất.

## Preimplementation test matrix

| ID / invariant | Dữ liệu và bước bắt buộc | Kết quả mong đợi |
| --- | --- | --- |
| V4-01 legacy compatibility | Chạy nguyên suite V1–V3, init/check/close và corruption cases hiện có | Không đổi contract/verdict cũ |
| V4-02 derive history | Fixture oldV3 CLOSED spent2/2/1/6 + hai raw-pinned external claims1/1; init V4 và đọc lại | historical4/4/1/6, phase0/0/0, origin giữ nguyên |
| V4-03 bridge hostile | Thiếu/mismatch policy, actioncount sai, duplicate claim, remediation parent sai, hash/source/phase drift, nhập lại qua successor | REFUSED; không tạo claim/anchor phần tử thành công |
| V4-04 one successor | Hai path/SHA/agent cùng init trên một predecessor; mất/sửa successor claim | Một child tối đa; replay/fork/missing bị chặn |
| V4-05 rollback/crash | Cắt suffix/emptyjournal, stale/missinghead, pendingtmp, crash giữa append/head/claim | REFUSED, spent không tự reset/recover |
| V4-06 limits across candidates | Hai candidate publication+CI atomic; thử publication3/CI3/heavy9; đổi SHA/profile/identity/chat | Phase vẫn tối đa2/2/8; total không giảm; unused old grant không cộng |
| V4-07 owner/time-only | Thiếu/PENDING/future/replayed authorization; valid null tokenlimits và oldusage vượtcap | Invalidgrant REFUSED; validgrant không tokenstop; reply phải được reviewer xác minh |
| V4-08 clock boundary | Before/at/after42min; âm/NaN/fractional reserve; clock qua deadline trong collection hoặc sauclaim | Chỉ strictly đủ42min được chạy; crossing giữ spent và không external action |
| V4-09 source/CI/coverage | Candidate publication với full local checks+hai APPROVE nhưng chưa có own-sourceCI; heavy dùng newcandidate+CIb2, dirtyHEAD/blob/ref/config/lock/profile mismatch hoặc thiếu phase/reporter/native/Edgebinding | Publication không bị deadlock vì CI chưa được push; heavy các trường hợp sai bị REFUSED, chỉ own-source fullCI18 mới và fullgates mới đủ |
| V4-10 concurrent heavy | Hai dispatcher cùng thấy remote0job; job backend ở branch khác; API eventual consistency sauclaim | Một pending intent/physical heavy; không queued intent thứ hai |
| V4-11 settlement/failure | Wrongrun/source/profile/attempt; missing preservation/reclaim; terminalfailure rồi đổiidentity cùngSHA | Không settle sai; unknown giữblock; failedsame-source không retry |
| V4-12 operational negatives | Review author/selfreview, scopeprofile đổi, C/D dưới30GiB, retained vượt768MiB, reclaim thiếu, malformedAPI | REFUSED trước push/dispatch |
| V4-13 uncertain action | Push/dispatch throw/unknown sauclaim; restartprocess | Counts/intent cònspent; chỉ đối soát terminal, không tự retry |
| V4-14 full acceptance | Join actual ownsource receipts của6light +19T04 +10service, identities760 và12obligations | Không count-only/fixture-only/requiredskip thànhfullPASS; main chỉ sau finalgate |

Tests phải có negative controls phát hiện detector bị vô hiệu hóa; không chỉ assert implementation với chính nó. Không cài dependency để chạy suite Node. Local **toàn bộ suite Node tracked hiện904cases + guard cases mới**, không chỉ targeted; syntax và fixture tests cùng pass. Existing manual-deferred/applicability skip giữ nguyên định nghĩa, không đổi thành executedPASS.

## Trình tự và các điểm dừng

1. Hai non-author reviewer độc lập source/design và operations/history APPROVE exact plan hash; ghi findings và giải quyết trước code.
2. Isolated worktree đã được chuẩn bị sạch từ b2 sau disk preflight; chỉ bắt đầu code sau hai plan review APPROVE. Implement đúng slice5file, giữ SQL/Auth/Edge/workflow untouched; local targeted rồi fullNode904+newguards. Freeze codepins/operatorcontract và docs traceability.
3. Hai reviewer APPROVE exact candidate/packet, không knownerror. Policy dữ liệu pin actual grant, tất cả parent/claim refs và source scope; dryrun controls trước candidatepush.
4. Dùng một claim publication+automaticCI từ phase2/2. Collect own-sourceCI18 terminal, xác minh counts/source/config/lock/nativecleanup/Edge; failure dừng, không rerun sameSHA. Nếu cần candidate2, sửa nguyên nhân và lặp local/review một lần trong ngân sách còn lại.
5. Chỉ sau CI mới PASS và fresh guardADMITTED chạy T04 nguyên19stage rồi bảy whole serviceprofiles tuần tự; mỗi profile terminal đối soát và reclaim trước profile kế. Không optionalpilot/grep/requiredskip/timeoutchange/parallelheavy.
6. Khi đủ full35/760 và12obligations, source/preservation/security/D19 review cuối mới xét main. **PR/main automaticCI grant vẫnPENDING**, root phải nhận actual owner reply trước bước tiêu thêmCI, không dùng tài liệu này cấp quyền.
7. Đến cutoff/failure/unknown: dừng phần phụ thuộc, lưu exactsource/runIDs/phasecounts/globalspent/claim/terminalreceipt/blocker/recipe và handoff. Không nới cap hoặc deadline; không dọn dữ liệu chưa được cấp quyền.

## Raw pins cho bridge lịch sử (đọc lại 22/10/2026)

Đường dẫn là file gốc thực, không copy docs để thay nguồn. Khi triển khai phải rehash và đối chiếu; mismatch dừng. Owner grant/reference thực được ghi ở trên và phải có raw receipt pin trong policy; không init từ placeholder. Bản trước sửa được giữ nguyên tại [v4-plan-candidate01.md](../../implementation-log/permission-main-staging-night-20261022/v4-plan-candidate01.md), SHA `3d6a46907289aede0c5706f691e470e773471a40cfd8ee67912f17e0fba92d21`; bản đó có lỗi double-count buffer trong phép tính tổng, được đoạn timeline hiện tại thay thế.

| Record | Đường dẫn tuyệt đối | SHA256 raw |
| --- | --- | --- |
| Old V3 policy | `D:/Workspace/pos-cafe-permission-run-20261020/evidence/loop-prevention-20261021/budget-edge-resolution-2300.json` | `3c222cb3a5b66a37107522ddce08c2fc8f68e99777f4a921aeb0eba2c936797c` |
| Old anchor | cùngpath policy + `.anchor.json` | `089157c4f1af815bd825316f896d30da35d6a81d9aad61b246a6a81dd1a2402e` |
| Old journal | cùngpath policy + `.journal.jsonl` | `583f336dafa025e3088e0afc1dad23be68b2324c6e5f37facc11ca230d372880` |
| Old head | cùngpath policy + `.head.json` | `7f5d12c37918d6efbb48b336234bcc2efb627c0c8e4fb96002f599f26a4bab15` |
| Phase22 policy1 | `D:/Workspace/pos-cafe-docs/docs/implementation-log/permission-release-20261022/publication-policy01.json` | `aaf7d7a943927218c1773eb93ba69f308b0e09ec82f9ecff30c87cd4358d6658` |
| Claim1 | `D:/Workspace/pos-cafe-permission-run-20261020/evidence/permission-release-20261022/publication-autoci.claim.json` | `74fd7017a497ddc2da4658798f68756edca3ac637e04ecf0b9009f7282e5a598` |
| Remediation policy | `D:/Workspace/pos-cafe-docs/docs/implementation-log/permission-release-20261022/ci-portability/publication-policy-remediation01.json` | `18325065527ac125f670932e4cbdee3846466cf7045b36790438dac6bf04ab55` |
| Claim2 | `D:/Workspace/pos-cafe-permission-run-20261020/evidence/permission-release-20261022/publication-autoci-remediation01.claim.json` | `d5fb2f7205a1651f68223d70b4a1f21e68c580149c4e98ff63fe02903d1be99c` |

Guided walkthrough cần trình owner sau implementation: historybridge → phasecounts/atomicclaims → freshadmission/settlement → evidencejoin. Chưa tuyên bố owner đã đọc hoặc hiểu code.
