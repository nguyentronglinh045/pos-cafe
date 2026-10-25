# P0 — Đầu vào triển khai A/B/L, 19/10/2026

Trạng thái triển khai: PREPARATION_ONLY, workers NOT_CREATED. Kết quả review xem biên bản cuối packet. Đây là phần chuẩn bị tiếp nối [kế hoạch](permission-main-session-plan-2026-10-19.md) và [handoff](permission-main-coordinator-handoff-2026-10-19.md), không phải change nghiệp vụ mới hoặc fullgate PASS. Bộ bảy artifact của feature tiếp tục ở openspec/changes/redesign-permission-model; P0 không đổi acceptance.

## Phạm vi và nguồn quyền

Người dùng trực tiếp yêu cầu tại chat cũ ngày 19/10: “giờ bạn ra lệnh đầu tiên cho nó xử lý đi, kể từ sau lệnh đó tôi sẽ làm việc tiếp với nó trên session đó luôn”. Đã tự đọc qua read_thread: chat 01a14cc1-5b2d-7661-bd93-50d5fa1e2564, host local, turn 01a151fa-1afa-7913-a41b-f02bf6e9be78, human item 01a151fa-1b26-79e2-959d-fba4e1a0b009. Lệnh P0 được coordinator cũ chuyển nguyên phạm vi: chuẩn bị contract/ownership/prompts/registry và review tài liệu; không tạo worker/worktree hoặc chạy implementation. Chat này là nơi người dùng làm việc tiếp: 01a151f6-cec4-78e2-ae17-25f3f8069213, host local.

Q-LAUNCH trước vẫn là chỉ hoàn tất kế hoạch. Quyền callback human cũ chỉ xác định chat gốc cũ; chưa suy thành quyền worker gửi tới coordinator mới. Không gửi tiếp báo cáo/câu hỏi về chat cũ. Review subagent chỉ đọc được phép bởi AGENTS.md và lệnh P0; không phải worker A/B/L hay user-owned chat mới.

P0 tự chọn chi tiết giao diện thuần và ownership dưới đây trong phạm vi chuẩn bị. Các đề xuất này chỉ có hiệu lực làm đầu vào sau khi review đạt và user giao khởi chạy; không tự mở quyền hành động. Nếu phát hiện đổi schema bằng chứng, privacy/ACL, acceptance, dữ liệu, chi phí hoặc phạm vi thì dừng phần phụ thuộc, hỏi user ở coordinator mới và chờ trả lời thật.

## Đầu vào đã đối chiếu

[Inventory và readback](permission-main-p0-source-2026-10-19.md) pin canonical Git bytes, paths và dòng code. Runner D:/Workspace/pos-cafe-full-runner-20261018 sạch tại commit 567af2191400ef559e90b3eccae0a0e4992f82e5, tree 5b8667b4c421a7e6c47f566e1634129799a5f83d, branch ci/permission-full-runner-20261018. Docs base 2ad68003ca3de719c5dc4746a706dc600028dc2b; plan baseline SHA256 b2a1c4a949210bd889e7d0d218f4a1a24ced3ea9b2bf6b22b111c4695e803123.

Giữ original main HEAD5156820/510dirty và ci HEADc898d76/11WIP. Docs có395dirty trước P0, bao gồm docs/workflow/tasks/README.md: không sửa/stage/commit chỉ mục này. P0 chỉ tạo các file permission-main-p0-*-2026-10-19.md, thêm liên kết vào handoff sạch của task và lưu snapshot/manifest review nhỏ tại D:/Workspace/pos-cafe-ci-main/artifacts/permission-main-p0-review01; không sửa plan đã review. Không stage/commit/push trong lượt P0. Không nhập docs vào main.

CI lịch sử đúng nguồn567 chỉ light11phases và namespace probe; full execution NOT_RUN, quotaEnforced=false. Code runtime vẫn PLAN_ONLY/NEEDS_PORT. Bộ PERM đã đọc từ manifest nguồn567: 60 REQUIRED cases,726 variant occurrences,27 stages. Legacy source ef2c372aec60d8362549e47b7aedb27126129479/tree1ef7df6b8f0e741ce96b4968edd77d1a28fe6fe4 có lock riêng; tuyệt đối không thay bằng candidate lock.

## Contract P0 v1: lớp chuẩn bị, không đổi schema thực thi

Tên phiên bản tài liệu: permission-main-prep-v1. Một report chuẩn bị của A/B/L gồm các trường dưới đây. Đây là envelope riêng bên ngoài các record hiện hành; không chèn các field này vào custody binding, execution attestation hay manifest PERM.

| Trường | Kiểu và ràng buộc |
|---|---|
| contractVersion | Chuỗi đúng permission-main-prep-v1 |
| taskId | Enum A, B hoặc L |
| baseCommit, baseTree | Chuỗi hex lowercase40, đúng567/tree5b866 ở trên |
| candidate | Commit sạch40hex hoặc snapshot descriptor gồm baseCommit, patchSHA256, inventorySHA256, nội dung patch và mọi file mới/ignored có thể phục hồi; hash không thay nội dung |
| sourceInventory | Danh sách repo-relative path không có dot-dot/absolute, hash SHA256 hex64 của canonical Git bytes; file mới dùng exact snapshot bytes và ghi rõ representation |
| evidenceMode | PLAN_ONLY hoặc SIMULATION; initial slice không có OBSERVED_EXECUTION |
| execution | Đúng NOT_RUN; runtimeAdmission và custodyObserved cũng NOT_RUN |
| observations | Danh sách fact đọc thật, mỗi fact có source path:line hoặc safe receipt/hash và ngày; tách giả thuyết |
| checks | Danh sách argv/cwd/runtime/version/exit/counts/output hash; checkKind=PURE_UNIT hoặc READ_ONLY. Kết quả unit là kết quả của unit, không đổi execution=NOT_RUN |
| runtimeBinding | null cho runId/attempt/profile/stage/nonce/backend identity chưa tồn tại; không bịa ID rồi feed verifier |
| issues, pendingDecisions | Danh sách ID từ sổ lỗi chung và câu hỏi; mỗi mục ghi phần bị chặn |
| dependencies | Input version/hash đã có; input thiếu ghi UNKNOWN và chủ cung cấp; không null-as-zero |
| notRun | Mảng phần chưa chạy, ít nhất actual transport/provision/install/build/backend/ACK/fullgate theo task |
| safeReceipts | Relative paths của kết quả thuần/synthetic đã rà, bytes và SHA256; không secret/env/raw private |

Tất cả byte/count/time trong các record chuẩn bị dùng safe integer không âm, byte là bytes, thời gian seconds; thiếu upper bound dùng null cùng reason=UNKNOWN, không dùng0. Hash SHA256 là64hex lowercase, Git SHA/tree40hex lowercase. Không nhận số nén thành maximum unpacked/allocated. Kích thước logical, allocated, transfer và peak có cột riêng; không cộng đôi loop backing với nội dung, nhưng không bỏ writer ngoài loop.

### Bindings hiện hành phải giữ nguyên

Custody binding dùng đúng danh sách field của scripts/permission-full-custody.mjs:10-12: repository, repositoryId, runId, attempt, sourceSha, profile, nonce, permissionFingerprint, lockSha256, recipeSha256, artifactId, cipherSha256, cipherBytes, archiveSha256, manifestSha256, closureSha256, closedAt. Không thêm/bớt/đổi tên. Repository nguyentronglinh045/pos-cafe, repositoryId1263057386; ACK creator ownerId54500418/typeUser. RunId là decimal string1–20digits không leading0; attempt integer1…1000; profile đúng một trong STATIC/PIN_ONBOARD/PIN_IDENTITY/PIN_CANARY/PG16_T01/SUPABASE_T02/SUPABASE_T04; nonce32hex. CipherBytes positive tối đa268435456; các cap này không chứng minh toàn budget fit. Timestamp ISO UTC theo parser hiện có. Dùng nguyên hàm custodyAckDescriptor/verifyCustodyAck; latest context case-insensitive, exact SHA/query completeness và creator/time/binding bắt buộc. A không POST ACK hoặc gọi GPG để “kiểm protocol”.

Execution attestation/collector ở scripts/permission-execution-evidence.mjs:42-84 ràng buộc discovery/results/options với cùng runId/fingerprint, raw byte hashes và content hashes; observed service cần backend/API/fixture/catalog/schema/applied artifacts. Không tự sửa chúng để nhận envelope chuẩn bị. Full runtime profile/bootstrap/config/ports/guard aliases từ scripts/permission-full-runtime-policy.mjs:13-85 và ci1-policy; P0 không thay topology, fixed private alias, guard hay thư tự profile. Toàn bộ19stageT04 giữ một physical backend; ba baseTC53 DB variants vẫn bắt buộc.

## Ownership đóng trước dispatch

Các path mới dưới đây đều phải được xác minh chưa tồn tại ở worktree thực trước ghi. Nếu có collision thì dừng và root phân lại; không overwrite. Code path là tương đối với worktree riêng, không phải checkout original hoặc runner dùng chung. Không tự mở rộng prefix.

| Task | File code được tạo/sửa sau grant | Namespace kết quả riêng | Ngoài ownership |
|---|---|---|---|
| A | artifacts/permission-proof-transport-next/transport-model.mjs; receiver-model.mjs; transport-model.test.mjs; receiver-model.test.mjs cùng thư mục | artifacts/permission-proof-transport-next/receipts/ chỉ safe synthetic records | Không sửa/copy11WIP, helper GPG cũ, key/home/ACL, custody schema hoặc artifact01/02; model mới phải generic nonHP1 |
| B | scripts/permission-full-budget-plan.mjs; permission-full-budget-plan.test.mjs; permission-full-provision-plan.mjs; permission-full-provision-plan.test.mjs | artifacts/permission-full-budget-next/ | Không sửa worker/harness/runtime-policy/workflow/configs dùng chung; không tạo loop/container/DB |
| L | scripts/permission-full-legacy-plan.mjs; permission-full-legacy-plan.test.mjs | artifacts/permission-full-legacy-next/ | Không sửa permission-legacy-head/browser-prepare, lock/config/test gốc, không build/install/archive/extract/serve thật |

Shared helpers/config/workflows/manifest/expected/original tests chỉ D/root sở hữu khi có phạm vi tích hợp riêng. A/B/L được đọc; nhu cầu sửa gửi proposed patch + lý do + affected tests về root, chưa áp dụng kể cả bằng copy/rename. P/R có ownership riêng của kế hoạch, chưa dispatch trong P0. Worker không sửa docs dùng chung; root tổng hợp hồ sơ.

A đặt prototype ngoài application source theo kế hoạch: artifacts thường ignored, nên READY bắt buộc snapshot đủ bốn file, không chỉ git diff. Không force-add tài liệu/bằng chứng private vào main. B/L cũng snapshot mọi output/file mới, không copy dependencies giữa worktree.

## Hợp đồng riêng và dependency thật

### A — transport/receiver, nghiên cứu hướng khác khi GPG STOP

Input: contract chung, custody fields/limits nguyên bản, safe postmortem records đã pin trong inventory, sổ GPG=2FAIL/STOP. Chỉ đọc kết luận an toàn, không mở raw status/key/dump/env cũ. Hai lượt: attempt01 seal fail/status-fd3 bad descriptor; attempt02 seal được nhưng open fail/NO_SECKEY, DECRYPTION_FAILED; postmortem offline nhận GPG Agent/NO_PIN_ENTRY. Nguyên nhân pinentry/key usability vẫn chưa biết; không kết luận mất khóa hoặc password.

Output: (a) diagnosis tách fact/hypothesis/điều chưa biết; (b) bảng phương án khác, quyền/cài đặt/chi phí/guard cần nếu actual, khuyến nghị chưa tự chọn thay đổi material; (c) hai model thuần transport/receiver và negative tests; (d) typed interface đề xuất cho D: descriptors seal/receive/open/closure, lỗi hữu hạn và retry/retention accounting, nhưng không thực thi crypto/filesystem receiver; (e) output bounds gửi B: plain/archive/cipher/status/manifest/member count/peak RAM/privateC allocation/global retention của mọi profile và failure path, UNKNOWN nếu chưa chứng minh.

Model nhận descriptor giả gồm source/recipe/lock/config/member hashes, declared byte lengths, expected binding và danh sách members; kiểm missing/extra/duplicate/unsafe paths/hash-size-binding mismatch, truncated input và stale source/closure. Thành công của model chỉ SIMULATION, execution/custodyObserved=NOT_RUN; plaintext ghi đĩa0, network/process/GPG0. Không dùng lại payload HP1 hoặc coi hash tự khai là authentication thật. Phân tích thiếu bằng chứng có thể READY_FOR_REVIEW với kết luận STOP, không tạo “transport usable”.

### B — budget/provision plan

Input: policy limits, tất cả STATIC+6profiles, source/tools/image pins, L graph, A transport bounds, P/R bounds ở bảng dưới. Writers phải bao gồm source/worktrees/control/index, tool transfer+unpack, npm dependencies/cache/scripts/temp, browser binary/cache/profile/trace, Docker/containerd compressed/unpacked/snapshot/writable/log, DB/WAL, stdout/stderr, safe receipts, ciphertextD/privateC/ACK retention và overlap khi chuyển profile. Phải nêu nơi chạy cloud hay Windows và ổ/backing thật; không mặc định nhiều máy hoặc storage không tính ngân sách.

Output budget record: writerId/profile/phases, placement/storage identity, compressedBytes/expandedMaxBytes/allocatedMaxBytes/peakMaxBytes, overlapGroup, durationMaxSeconds, measurementOrBoundSource, remainingUnknowns. Mỗi field maximum thiếu là null+UNKNOWN. Tính global task ledger ≤21474836480bytes, loop backing đề xuất19327352832 và tối đa2147483648bytes ngoài loop chỉ khi cộng đủ mọi writer; host/WindowsC/runtime reserve≥32212254720bytes; loop free≥1073741824bytes. Limits CPU/RAM/PIDs/time giữ policy hiện có, không kéo thời gian để né fit. Dữ liệu đã sinh của task vẫn tính: chưa biết retained usage toàn task thì không khai còn đủ20GiB.

planDecision chỉ ADMITTED khi mọi maximum/placement/reserve/time/retained usage đã đủ căn cứ và fit; còn UNKNOWN phải STOP kèm missingInputs cụ thể. Dù ADMITTED trong model, runtimeAdmission/enforcement/execution vẫn NOT_RUN; E còn phải actual readback/admission, fresh CI/source và user grant. Synthetic facts luôn SIMULATION. Không dùng namespace PASS/quotaEnforced=false hoặc cap loop18GiB làm proof quota toàn job.

Provision plan nhận profileId+reviewed layout+tool/config identities+budget assessment; trả ordered steps/preconditions/expected readbacks/owned resources/stop transitions và rollback/cleanup requirements. Không chạy adapter. Phải giữ host/unit device+inode visibility, norbind/no preexisting submounts, aliases vào owned loop, PIN_IDENTITY private absent trước bootstrap, canary16CLI migrations+empty seed, T01PG16 observer-only, T02/T04 đúngPG17/service topology. Lifecycle model không intentional cleanup trước verified custody/ACK; thiếu receipt khôngPASS. Teardown platform lỗi/cancel/timeout là rủi ro đã chấp nhận, không giả thành intentional cleanup đạt.

### L — legacy graph/provenance

Input: exact legacy commit/tree, package.json/package-lock.json canonical blobs, helper/config hiện tại và inventory. Dùng git show/ls-tree read-only, không archive/extract. Graph không dùng node_modules của candidate để nhận là lock legacy. Hai lock182800bytes nhưng SHA khác: legacy1b6d4002…/candidate85969c1c…. scripts/permission-legacy-head.mjs:74-76 bắt equality và sẽ refuse; không gọi helper hoặc bỏ guard.

Output: exact source/tree, source-listing/blob identity, legacy package/lock full hashes, graph direct/transitive/optional/platform/install-script flags, resolved URL+integrity inventory từ lock; không tải URL. hasInstallScript không cho biết command/maximum thực của script; thiếu package manifest riêng thì ghi UNKNOWN, không giả đủ closure. Tách expected archive recipe khỏi archive hash NOT_RUN, build recipe khỏi actual node/lock/envBinding/dist hashes NOT_RUN. Liệt kê build tool/compiler/runtime cần, giải thích resolution ancestor node_modules của helper cũ và mismatch hiện tại. Đề xuất patch cho D hoặc adapter mới trong ownership L, chưa áp dụng shared helper.

Build/server plan phải nêu exact argv/cwd/lock/tool pins, loopback origin/port5179/strictPort, candidate5178, env source synthetic được guard, preconditions fixture/grants/privacy. Không đọc env/credential thật hoặc chạy imported config gọi candidateEnvironment. L giữ ranh giới legacy financial DML revoked và tenant RLS; không sửa grants. Gửi B transfer/unpack/build/cache/dist/server/browser/time upper bounds có căn cứ; chưa biết ghi UNKNOWN. Không nhận graph/read-only là legacy build/browser PASS.

### P/R/A/L cung cấp cho B trước đóng admission

| Chủ | Input/version bắt buộc | Nội dung tối thiểu B cần |
|---|---|---|
| P, chưa giao | PIN19 frozen manifest/config/helper hashes;19case IDs và exact file/fullName/project identities | Output/member/count/maximum bytes discovery/results/options/attestation, TC18 capture/control và TC19 direct preservation, browser traces/screenshots/temp/concurrency/time, seal/privateC/retention bounds; không bỏ required cases/retry để fit |
| R, chưa giao | PERM60 manifest6571509a… với27stages/726occurrences; exact stage/config/helper identities | Per-stage discovery/results/options/attestation/DB-preservation outputs, bound cho full19stageT04 trên cùng backend, rollback/transition/bridge/browser và3TC53variants, WAL/data reset/retention/time; không đổi expected |
| L | Legacy graph/source/lock/helper/config identity riêng | Transfer/unpack/install scripts/build/dist/cache/preview/browser lifetime/time và output upper bounds; unknown không0 |
| A | Transport model/strategy version, actual chưa chạy | Archive/seal/cipher/receiver/privateC/ACK retention + retries/failure-path overhead và member closure upper bounds; plaintext chỉprivateC nếu actual được giao sau |
| D/root | Tất cả predecessor receipts + shared wiring plan | Global overlap/retention/controller/supervisor writers, historical retained usage và exact placement; B không tự viết “fit” khi thiếu |

B bắt đầu model và missing-input matrix độc lập với A/L/P/R, không chờ giả cả năm hoàn tất. L/A không cần B để làm read-only/pure; download/install/build/crypto thật không thuộc slice ban đầu. P/R có thể phân tích khi user giao slot sau, chưa cần A xong. Khi có phạm vi riêng, D có thể chuẩn bị pure wiring trước; đóng integration cần reviewed compatible contracts. E tuần tự sau D, source cuối/freshCI/actual admission và quyền đủ.

## Kiểm tra nhẹ và ngân sách vận hành đề xuất cho worker sau grant

Không có cài đặt nào được P0 ủy quyền. Worker kiểm Node đã có trước, chỉ builtin Node; thiếu công cụ thì BLOCKED, không npx/npm auto-fetch. Cho phép git read-only, đọc source public đã chỉ định, syntax-check đúng file mới và node --test đúng tests mới sau tự rà import/side effects. Không import helper thực thi cũ để dò; không broad npm test/build/smoke, network/download/registry retry, child service, GPG/key/ACL, DB/container/WSL hoặc browser.

Giới hạn vận hành tự chọn cho initial pure slice: generated files/fixtures/logs≤4MiB mỗi A/B/L, tổng≤12MiB và vẫn nằm trong20GiB toàn task; ưu tiên fixture RAM, mỗi input≤256KiB và tổng fixture sống≤4MiB/task. Không tạo nhiều vòng fixture; dự kiến vượt thì báo root trước ghi. Đây là giới hạn tác nghiệp, chưa là quotaOS và không đổi coverage/acceptance. Kiểm freeC/D trước ghi và khi kết thúc. Worktrees không dependencies dự kiến tổng150–250MiB trênD; phải đo lại trước tạo, xác minh physical paths/auto-setup và actual global retained usage. Không copy/cache thêm để thử fit. Không xóa temp trong slice; đề xuất nhóm cleanup đúng path/size/impact để user quyết định, giữ STOP Windows6fixtures.

P0 hiện tại chỉ viết tài liệu≤2MiB trênD, download0/install0/runtime0. Snapshot trước ghi: C196712943616bytes/D99223179264bytes free. Số free không là số còn lại của budget task hoặc admission runtime.

## Tiêu chí READY_FOR_REVIEW và nhận kết quả

1. Ref/base/worktree đúng và file delta nằm hoàn toàn trong ownership; shared proposals tách khỏi candidate. Source snapshot có thể phục hồi gồm new/ignored files, tests, configs cần; công bố commit hoặc manifest/hash+patch+payload, không chỉ hash.
2. Contract v1, input versions/hash, outputs/interface/finite errors/missingInputs nhất quán; UNKNOWN/SIMULATION/NOT_RUN chính xác. A chẩn đoán đúngSTOP; B mô hình chặn unknown/overbudget/wrong placement; L không dùng candidate lock bù. Không yêu cầu actual bị cấm để đạtREADY.
3. Pure checks meaningful phủ main/negative/boundary/security của interface được giao: missing/extra/mismatch/path traversal/duplicate/stale bindings và side effects0; mô hình getter/prototype nếu nhận object data không được gọi getter hay tạo effect. Kết quả command/runtime/counts/exit/receipts có hash, khôngrequiredskip/retry giảPASS. Không viết test chỉ để lặp implementation.
4. Báo NOT_RUN, generated/retained bytes, sổ lỗi kế thừa/cập nhật, câu hỏi material và dependency còn thiếu. Không raw private vào chat/repo. Chỉ root đổi registry sau đối chiếu.
5. Tác giả tự báo READY_FOR_REVIEW, chưa DONE. Root lấy hai reviewer độc lập EVC/SEC kiểm exact candidate. Chỉ mọi reviewer bắt buộc APPROVE + root đối chiếu thì DONE_IN_SCOPE. Review tài liệu/pure không thay GPG/fullgate/finalcandidate reviews hoặc user launch.

## Registry P0 — chưa có worker

| Task | Trạng thái | Planned worktree / branch, chưa tạo | Thread/cursor | Dependencies/next action |
|---|---|---|---|---|
| Coordinator | P0_PREPARED; REVIEW_REQUIRED | docs worktree hiện có, không đổi checkout | 01a151f6-cec4-78e2-ae17-25f3f8069213/local | Review verdict lưu riêng; user làm việc tại đây; không callback về chat cũ |
| A | NOT_CREATED; launch chưa được giao | D:/Workspace/pos-cafe-permission-a-20261019 / ci/permission-transport-20261019 | null/null | [Prompt A](permission-main-p0-prompt-a-2026-10-19.md); kế thừaGPGSTOP |
| B | NOT_CREATED; launch chưa được giao | D:/Workspace/pos-cafe-permission-b-20261019 / ci/permission-budget-20261019 | null/null | [Prompt B](permission-main-p0-prompt-b-2026-10-19.md); unknownL/P/R/A/D |
| L | NOT_CREATED; launch chưa được giao | D:/Workspace/pos-cafe-permission-l-20261019 / ci/permission-legacy-20261019 | null/null | [Prompt L](permission-main-p0-prompt-l-2026-10-19.md); graph/pure độc lập |
| P/R | NOT_DISPATCHED | null | null/null | Root giao sau khi có slot/quyền; tối đa3author active |
| D/E | NOT_DISPATCHED | null | null/null | D integration rồi E runtime tuần tự, chưa quyền |

Root sau grant ghi source human launch/routing + exact worktree/branch identity, threadId/hostId/afterCursor, input packet hashes, authorHead/snapshot, status/issues/pendingDecisions/receipts và observed bytes. Không điền threadId/runId giả. Nếu app auto-setup không xác minh được thì không tạo; chọn read-only hoặc hỏi phần thiếu. Không đổi model/thinking.

Chuyển trạng thái: NOT_CREATED → ACTIVE_READ_ONLY_OR_PURE sau grant/readback → READY_FOR_REVIEW hoặc NEEDS_USER/BLOCKED/FAILED/PARTIAL → DONE_IN_SCOPE sau reviews. NEEDS_USER chỉ chặn phần phụ thuộc; phần độc lập đã giao có thể tiếp tục. User silence/timeout/callback agent không là approval.

## Sổ lỗi chung kế thừa — không reset qua session

| IssueID | Lịch sử có nguồn | Trạng thái hiện tại và quy tắc |
|---|---|---|
| TRANSPORT-GPG |2actual FAIL: attempt01 seal/status-fd3; attempt02 open; offline NO_PIN_ENTRY, xem safe receipt refs inventory | STOP; failedActual=2, additionalActualAllowed=0. A chỉ chẩn đoán/hướng khác, không patch/retry crypto/key/ACL |
| WINDOWS-FIXTURE-DELETE |2auto-review rejections,6fixture/0deleted, handoffA18-08/15 | STOP; không thứ3/không đổi tool népolicy, giữ dữ liệu |
| NAMESPACE-ADMISSION |1FAIL run39134184289 rồi1PASS39136704294 nguồn567 | RESOLVED_NAMESPACE_ONLY; khôngrerun khi không delta/lý do; khôngquota/fullgatePASS |
| REGISTRY-METADATA |1initial unverified request/parser refusal; HEAD chỉ realm/service/scope;0verified manifests | UNKNOWN; B không sum0 hay tự sửa/retry/network, chuyển thiết kế/thu thập khi có phạm vi phù hợp |
| LEGACY-LOCK-MISMATCH |P0 đọc canonical hashes khác nhau, chưa chạy helper để gâyFAIL | DISCOVERED_READ_ONLY; failedRuns=0, L phân tích hướng riêng; khôngbypassguard |

Issue mới phải reuseID khi cùng triệu chứng/căn nguyên, ghi attempt ordinal toàn task, source/check/exit/effect/giả thuyết/receipt/changed approach/decision. Tối đa2lượt thất bại cùng vấn đề theo giới hạn hiện hành; đủ2 thì dừng đoán-sửa, chẩn đoán và đưa hướng khác, không cấp lại2lượt bằng đổi tên/file/chat. Không biết lịch sử thì giữUNKNOWN và hỏi root, không coi0. Capacity/outage ghi riêng, khôngcodeFAIL/không tự đổi model. Các finding review tài liệu theo dõi riêng cùng source/candidate, không reset lỗi runtime.

## Routing, chờ user và quyết định trước launch

Callback target dự kiến duy nhất: coordinator01a151f6-cec4-78e2-ae17-25f3f8069213/hostlocal. callbackAuthorization=UNCONFIRMED_FOR_NEW_TARGET; không dùng lệnh coordinator hoặc human grant vềchat cũ làm quyền gửi mới. Sau user chốt, root lưu human message/turn/item; từng worker tự read_thread kiểm nguồn trực tiếp trước send_message_to_thread. Không xác minh được thì UNSENT; root dùng bounded wait_threads/afterCursor, không callback loop/service/heartbeat.

Một báo cáo meaningful theo lượt READY_FOR_REVIEW/NEEDS_USER/FAILED/PARTIAL gồm taskId/threadId/baseCommit/head-or-snapshotHash/status/filesChanged/checksAndScope/safeReceiptPaths/remainingNOT_RUN/issueHistory/pendingDecisionIds/nextDependencies. Worker hỏi root qua report; root hỏi user ngay ở chat mới, lưu answer thật, chỉ giao tiếp phần phụ thuộc khi đủ quyền/câu trả lời. Không gửi secret hoặc raw private; không gửi tiến độ vềchat cũ.

Hai quyết định cần cho bước SAU P0, chưa hỏi lại Q-LAUNCH trong lúc chuẩn bị: (1) user có giao khởi chạy3worker A/B/L từexact567 trong ba worktreeD đã nêu, initial read-only/pure và khôngsetupdependency hay chưa; (2) user có cho ba worker báo safe results/câu hỏi vềchínhcoordinator mới hay chọn root chỉ dùngwait_threads. Quyền mở worker không mở GPG/heavy/install/cleanup/merge. Khuyến nghị đợt đầu đúnginitialslice và callback vềđây; phạm vi reviewable là bộP0 này. Nếu user chưa chọn thì giữNOT_CREATED.

## Kiểm chứng và giới hạn bàn giao

Các tiêu chí P0: source/inventory đúng; contract và ownership cụ thể; prompts dùng được saugrant; dependencyP/R rõ; registry/issuehistory/routing fail-closed; bảo toàn dirtyfiles; hai reviews exact candidate. Kiểm bằng đọc nguồn, canonical hash/counts, local links, cross-file consistency và scope diff; không build/test app. [Biên bản review và kiểm tra](permission-main-p0-review-2026-10-19.md) lưu exact candidate/verdict; trước khi có đủreview chỉ gọi đây là candidate.

Chưa làm: worker/worktree/code/runtime/GPG/install/download/DB/cleanup/push/deploy/merge. Fullgate/main vẫn IN_PROGRESS. Walkthrough P0 thể hiện đường source → ownership/interface → prompt → READY/review → launch/user; chưa khẳng định owner đã đọc/hiểu hoặc nghiệm thu.
