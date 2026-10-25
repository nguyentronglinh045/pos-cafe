# T04 fixture remediation — 22/10/2026

Author `/root/mcp_staging_evidence_review`; root là author code, không phải author proposal này. **Kế hoạch dùng ngân sách hiện có; lựa chọn +1 heavy chưa được cấp quyền.** Tài liệu không tạo claim, successor, push, workflow hay thay đổi ledger. Root và reviewer scope cần review bản cuối; việc review proposal không chặn thao tác đã được cấp quyền khi packet/admission riêng đủ điều kiện.

## Kết quả và giới hạn bằng chứng

Candidate mới `4d1ba3ada3810405b16c24d7b99ec7563a4f30ae`, tree `55d70f701b9b173da53c8f91a752a8050e340f3c`, tại `D:/Workspace/pos-cafe-permission-timeonly-20261022/code`. So với `ad265321144521c0669500fea9be0f96ebacb769` có năm file fixture/diagnostic/test và một pin trung thực trong `ci/release-policy.json`; không sửa app, SQL candidate, workflow, acceptance hoặc release hold.

T04 cũ run39783325574/attempt1 trên ad265 **FAIL**: 18stage PASS, stage19 `transition-compatibility-database`, required testcase2/line91 thất bại. Public export chưa ghi loop index nên **endpoint thực tế UNKNOWN**. Source cho thấy fixture bridge cũ chưa cài `permission_get_pos_menu`; đây là giả thuyết nguyên nhân hợp lý, không phải chứng minh endpoint đã fail. Không đổi lỗi cũ thành PASS và không retry source đã bị block.

Fix chuẩn bị fresh owned fixture bằng activation thật, xác minh strict/version2 rồi chỉ chuyển gate strict=false để kiểm compatibility. Candidate RPC/ACL vẫn hiện diện. Readiness hữu hạn chỉ chờ404/PGRST202 chuyển thành200/EMPLOYEE_SESSION_REQUIRED; không nhận missing route thành PASS. Ma trận bảy route đòi426, marker0/1, role matrix, missing singleton và rollback vẫn giữ nguyên. Diagnostic thêm ordinal cố định34–40 từ structured error.code, không export SQL, response body, URL, token, assertion values hoặc stack. Release pin cập nhật đúng bytes mới; `productionEnabled:false` và Vercel `deploymentEnabled:false` không đổi.

Local03 trên intermediate9395 chạy938cases:937PASS/1FAIL do trusted pin canonical còn cũ (`FRONTEND_RELEASE_BLOCKED`). Giữ nguyên TAP/receipt thất bại. Sau sửa đúng pin, root xác nhận Local04 trên4d1: **938/938 PASS**,69tracked Node files,0fail/skip/cancel/todo, source sạch, không cài/network. Đây là local Node PASS; fresh own-sourceCI18 và backend trên4d1 vẫn PENDING. Code có SOURCE và OPS non-author APPROVE; packet03 có review riêng trước publication.

## Thực hiện trong quyền còn sẵn

Giữ nguyên immutable `budget-phase01.json` SHA `86a7ed053fbebcfad314ef985834fb4d70017d61548b15f2d4ad61d7f3390dcc` và toàn bộ journal/head/ancestor history. Checkpoint sau T04 failure đã settle từng có phase spent1publication/1candidateCI/1heavy/4review; lifetime5/5/2/10; pending rỗng, ad265 blocked. Khi đó còn1publication+1candidateCI+7heavy, đủ quyền publication kế tiếp mà không cần successor.

**Cập nhật actual từ root:** publication03 guard ADMITTED/dispatch=true lúc14:01:34UTC22/10, reservation `05499d1ef6982b655831448b05563fc00b490f800c74ee26f067450aa32b0a1c`; remote4d1 đã xác nhận, CI39792208893 queued. Phase hiện spent2publication/2candidateCI/1heavy, publication pending; **còn0candidatepublication/0candidateCI/7heavy**, PR1/main1 riêng chưa tiêu. Queued không phải CI PASS; phải collect/settle terminal thật trước heavy. Đây là ghi nhận root, không phải external action do author proposal thực hiện. Không reset/fork/successor để dùng7heavy hiện có.

1. **Đã thực hiện:** hai non-author reviewer APPROVE exact packet03/source4d1/local04, giữ all1107 canonical Git blob pins; root đã qua guard thật và tiêu candidate push+automaticCI còn sẵn như checkpoint trên. Không lặp publication hoặc hoàn slot vì CI đang queued/pending.
2. Chỉ sau fresh CI18 trên4d1 PASS và native cleanup/source/run binding đúng mới dispatch T04 nguyên19stage, rồi các whole service profiles theo ưu tiên owner, tuần tự trong **tối đa7heavy còn sẵn**. Một physical heavy/pending slot; metadata attempt1 + preservation/reclaim terminal thật trước profile kế. Không same-source retry sau failure/unknown; không dùng18stage PASS cũ làm PASS source mới.
3. Không hứa đủ tám profile: T04 mới cộng bảy service cần8heavy, trong khi hiện còn7. Khi thật sự cần profile thứ tám và thời gian còn đủ, root mới đưa đề nghị +1heavy cụ thể cho owner; không chặn first7 bằng quyết định này. Thiếu slot/thời gian thì giữ fullgate PENDING, lưu receipt cùng source để xét tiếp dưới quyền tương lai; không tự chạy qua deadline.
4. Main chỉ sau unchanged35stage/760required identities +12obligations/D19/R0/R1 và final reviews, rồi hai CI PR/main đã được cấp riêng, cùng mapping/source-tree và deadline guards. Không Vercel/deploy, không original DB, không hosted mutation từ proposal này. Auth staging có gate/window riêng, không được coi là backend coverage.

Deadline giữ **17:00UTC22/10 =00:00 đầu23/10 Asia/Bangkok**. Mọi admission dùng strict `now+42min<deadline`:42phút gồm execution tối đa35phút và closure7phút, không cộng thêm42 sau execution; đúng23:18local bị từ chối. Khoảng gần21:00→00:00 chỉ còn3giờ, thấp hơn8×35=280phút worst case, chưa kể CI/queue/review/collection. Chỉ chạy admissions còn đủ reserve; không giảm coverage, đổi timeout, auto-retry hoặc claim hoàn tất để vừa giờ. Guard là admission, không phải lời bảo đảm tự kill mọi process; coordinator giữ closure/handoff trước hạn.

## Lựa chọn ngân sách nếu cần về sau — PROPOSED ONLY

Chỉ đề nghị đúng **net+1heavy** nếu sau này thật sự cần profile thứ tám và còn đủ thời gian. Trước khi đề nghị, đọc lại actual spent/pending/blocked sources và các quyền còn lại; không dùng lại counters tại thời điểm viết plan. **Không cấp publication hoặc candidateCI mới**, không reset/refund slot đã tiêu, không chuyển pending thành unused. Nếu cần successor V4, concrete policy/recipe phải được soạn và review theo counters lúc đó; có thể giới hạn phase bổ sung publication0/ci0/heavy1 dưới actual owner reply, carry toàn bộ spent/history/blocked sources và không cộng lại grant cũ. Pending chưa settle hợp lệ tiếp tục block, không mở successor để vượt nó. PR/main chỉ renew đúng quyền thực còn lại nếu cần và owner cho phép, không sinh thêm hai CI trùng. Chưa implement framework/init successor/ledger mutation; không gia hạn00:00 hoặc thay fullgate.

## Phối hợp và evidence giữ lại

Root báo có khoảng trễ phối hợp **~20:23→20:40 local** khi gửi `send_message` tới agent đã completed; đây là thời gian điều phối ước lượng từ root, không phải runtime backend. Dùng `followup_task` để kích hoạt lại agent idle/completed và kiểm trạng thái trước khi chờ. Tách riêng actual T04 job **20:02:07→20:19:52 =17phút45giây** từ metadata; không quy toàn bộ thời gian trễ cho backend. Local03 stale-pin failure là sự kiện khác, được giữ nguyên, không sửa historical receipt.

Auth là scope độc lập: root đã **DEFER lúc21:02** theo actual owner WAIT_RESOLVED, không toggle/TEST. Root readback MCP read-only với Auth users/stores/employees/Storage objects đều0 và AX Confirm ON. Không chuyển quyết định hoãn thành quyền chạy muộn hoặc hosted PASS; backend candidate4d1 không đổi.

Evidence dưới `D:/Workspace/pos-cafe-permission-timeonly-20261022/evidence/`:

| File | SHA256 |
| --- | --- |
| `cloud-t0401-api.json` | `9178cc349c9405919b96c859500926a208c7ef4c04891790ef80aea3b11651f3` |
| `cloud-t0401.json` | `60358a4420b43a0bce1d29769ba5c775a353f20a432eaa8466161ce31f01b5bb` |
| `night-node03.json` | `3bbbd14e3e9251c0ea0333814e6c3543cb49fb39c43ff7524687fd837cbe924f` |
| `night-node04.json` | `d9299dcc37fe5c96a4669049ff923d6b80b86038abbed603872e6b1d03b95dfa` |
| `publication-packet03.json` | `c53fcb4d270c1815d5fb5fc8276047a7dfaa7256081bf1d1bfcc97411848ae4d` |

Raw TAP/stderr/source/history và cleanup03/04 receipts được giữ. Temp03/04 đã được root dọn trong grant đúng nhóm; không xóa thêm dữ liệu để làm proposal. Walkthrough cần trình owner: fixture phase → bảy426 → source-bound CI/backend → history/budget/fullgate; chưa tuyên bố owner đã đọc/hiểu.
