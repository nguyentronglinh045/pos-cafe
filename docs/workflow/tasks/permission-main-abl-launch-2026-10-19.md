# Launch A/B/L — 19/10/2026

Live registry cho đợt initial read-only/pure. [P0 đã review](permission-main-p0-2026-10-19.md) và [biên bản P0](permission-main-p0-review-2026-10-19.md) giữ nguyên nội dung/hash; các dòng NOT_CREATED/UNCONFIRMED trong snapshot P0 là lịch sử trước quyết định mới. File này chỉ ghi quyết định, preflight và receipts thực, không đổi contract/acceptance.

## DEC-LAUNCH-ABL-01 — user đã giao khởi chạy và callback về đây

Ngày19/10/2026, user chọn trực tiếp: “Mở A/B/L và cho phép báo kết quả/câu hỏi an toàn về chat này (Khuyến nghị)”.
- Nguồn đã tự read_thread: coordinator01a151f6-cec4-78e2-ae17-25f3f8069213, hostlocal, turn01a1520e-87d1-7102-91a5-44f50a967e6d, human item01a1520e-87fa-7ad0-8dfd-cd38a522153b.
- Câu hỏi gốc request_user_input_async/call_a4f09f41270c4403a5c15a74008a28d0/item0 pin P0, ba worktreeD từ567, fresh disk/setup preflight và chỉ phân tích/pure code.
- Được tạo đúng3chat fresh A/B/L, dùng3worktreeD bên dưới; không fork lịch sử, không tự đổi model/thinking. User-owned chats thuộc projectpos-cafe/local-35fb61c061ace0392881871c8f6d6591/hostlocal.
- Callback được user cho phép về đúng coordinator ở trên. Từng worker vẫn phải tự read_thread human source trước send_message_to_thread; chỉ lọc userMessage, không in toàn bộ tool result hoặc nạp lịch sử. Không gửi về chat cũ.
- Không mở quyền GPG thực, install/dependency/download, DB/runtime nặng, cleanup, deploy hoặc merge. Giữ HP1 RETIRED, GPG2FAILSTOP/max2issue/global20GiB/reserve30GiB/one-heavy/11WIP riêng.
- Các câu hỏi material mới phải hỏi user tại coordinator và đợi trả lời thật; report/root prompt/timeout không là approval.

## Preflight và cách tạo

Runner readback sạch commit567af2191400ef559e90b3eccae0a0e4992f82e5/tree5b8667b4c421a7e6c47f566e1634129799a5f83d. Ba path/branch đích chưa tồn tại trước lệnh; D:/Workspace và artifact root là directory thường/no reparse. Node đã có D:/tools/nodejs/node.exe v24.16.0; không cài thêm.

Tracked source918files/38119461bytes canonical. Upper bound tác nghiệp cho3checkout351940830bytes =3×(2×sourceBytes +8192×fileCount +32MiB control); cộng12MiB pure outputs và32MiB app/doc/control dự kiến vẫn dưới0.5GiB. Đây là estimate/operating bound, không quotaOS. Full runtime ledger vẫn UNKNOWN/STOP; không dùng preflight nhỏ này để nhận B full admission.

C196588814336bytes/D99175870464bytes free trước tạo. Metadata-only inventory D:/Workspace/pos-cafe-ci-main/artifacts:8808376logical bytes/809files/303directories, gồm cả lịch sử ngoài đợt và được đếm thừa thận trọng; không đọc nội dung artifacts. Không có môi trường nặng được tạo. Không tuyên bố đã đo toàn bộ allocated/raw private retention hoặc hoàn tất full-budget ledger.

Tạo bằng Git worktree add -b exactBranch exactPath exactSHA, tuần tự, không clone/download. Repo không .gitattributes/.gitmodules, không post-checkout hook, không core.hooksPath override; không có .codex local environment hoặc .worktreeinclude ở original/runner. Không app-managed worktree, không setup scripts hoặc copy ignored/env/dependencies. Chat được tạo ở chế độ project local; working directory mặc định trong UI có thể là original, vì vậy mọi shell/Git thao tác task bắt buộc truyền explicit workdir của own worktree và mọi file path phải dưới own root. Không dùng công cụ sửa file tại cwd mặc định original.

Căn cứ OpenAI Docs đã đọc: [Local environments](https://learn.chatgpt.com/docs/environments/local-environment) mô tả setup tự chạy khi app tạo worktree; [Git worktrees](https://learn.chatgpt.com/docs/environments/git-worktrees) phân biệt CLI worktrees với managed worktrees. Chọn Git tạo pathD đã duyệt + local chat là chi tiết thực thi giữ vị trí và phạm vi đã giao, không đổi app settings.

## Registry hiện hành

| Task | State | Actual worktree / branch | Thread/host/cursor | Author candidate |
|---|---|---|---|---|
| A | DONE_IN_SCOPE_INITIAL_PURE | D:/Workspace/pos-cafe-permission-a-20261019 / ci/permission-transport-20261019 | 01a15212-86ee-7ad1-8a87-91b0a17701ff/local/9737094b-113c-4cc0-b834-31ffa63865ad:1 | A-initial-01 manifest2686c938…;2APPROVE/rootrecheck |
| B | DONE_IN_SCOPE_INITIAL_PURE | D:/Workspace/pos-cafe-permission-b-20261019 / ci/permission-budget-20261019 | 01a15212-d098-7a80-9d83-18be18b3ad83/local/d388f0af-47ce-4b0a-95c2-360df25e6028:1 | B-candidate03 manifest2216e89b…;2APPROVE/rootrecheck |
| L | DONE_IN_SCOPE_INITIAL_PURE | D:/Workspace/pos-cafe-permission-l-20261019 / ci/permission-legacy-20261019 | 01a15213-1616-7933-83a0-586a11da1e83/local/f08fa481-6a6d-44d1-adea-29b20fe585c5:1 | L-02 manifest37c1ce63…;2APPROVE/rootrecheck |

Mỗi worktree readback0dirty,919files/38228902logical bytes kể cả.git pointer, exactHEAD/tree như trên. Tổng checkout114686706logical bytes; allocated chưa đo, không gọi logical là disk allocation. Original.git/index hash trước/sau nguyên vẹn. Không node_modules trong các worktree mới. Registry threadId/cursor chỉ điền từ tool thật.

## Activation và theo dõi

Prompt gốc:
- [A](permission-main-p0-prompt-a-2026-10-19.md)
- [B](permission-main-p0-prompt-b-2026-10-19.md)
- [L](permission-main-p0-prompt-l-2026-10-19.md)

P0-01 manifest b7355fcd8128961742cf14960ab482a41d08acf4fa7312d5fbe9d1b3a5a0d448, EVC+SEC APPROVE nội dung initial slice. Live registry này ghi user grant mới; không dùng review để tạo quyền.

Worker đầu lượt tự đọc file này, P0/authority và human launch/routing source; kiểm own path/branch/base/tree/status, own new file collisions và imports/effects trước ghi. Nếu registry chưa có own threadId thì chỉ đọc, ghi WAIT_REGISTRY; root sẽ ghi receipt tool rồi gửi activation. Chỉ sau registryACTIVE+root activation trong grant hiện hành mới pure implementation. Đừng tự mở rộng quyền khi thấy callback hoặc status agent.

Root dùng bounded wait_threads tối đa3targets, hostlocal và afterCursor thật; đọc details chỉ khi completion/NEEDS_USER. Callback một báo cáo meaningful per turn theo fields P0, không progress spam/heartbeat/scheduler/service. Root xác minh source/receipts, không nhập nhánh/copy WIP hoặc dispatchP/R/D/E trong đợt này. A/B/L tác giả chỉ READY_FOR_REVIEW; root nhận hai reviews exactcandidate trước DONE_IN_SCOPE. Đợt launch không phải fullgate/main complete.


## Receipt khởi chạy chat

Đã tạo đúng3chat fresh bằng create_thread, target project local, không fork/worktree tự động và không model/thinking override. Tool trả threadId/hostlocal thật như registry. Ba worktree GitD đã có trước tạo chat, không tạo thêm môi trường hoặc dependency. Root đã ghi ACTIVE_INITIAL_PURE và gửi activation riêng sau registration; worker phải xác minh live registry và human grant trước ghi/callback.

Callback authorization về coordinator mới: VERIFIED_BY_ROOT_FROM_HUMAN_SOURCE; WORKER_SELF_READ_STILL_REQUIRED. Dòng này không thay nguồn human hoặc mở thêm đích gửi. Root chưa dispatchP/R/D/E hoặc nhập code worker.

Checkpoint ngay sau tạo worktree: C196446945280bytes/D99051999232bytes free. Chưa có cài đặt, download, GPG, DB/runtime, cleanup hoặc merge từ bước launch. Worker artifacts/pure outputs vẫn phải tuân cap4MiB mỗi task và báo root nếu vượt trước ghi.


## Readback tiến độ đầu tiên

Bounded wait_threads(timeoutMs=0) trả cả ba thread ACTIVE/inProgress sau activation. A đang chuẩn bị bốn file model/test; B bắt đầu ledger/provision model và UNKNOWN→STOP; L đã xác minh human launch/callback và đọc source graph riêng. Đây là tiến độ, chưa READY_FOR_REVIEW hoặc DONE_IN_SCOPE. Cursors thật nằm ở registry để lần chờ sau không đọc lặp final text. Callback mới được user cho phép và worker tự xác minh; chưa ghi đã thử gửi thành công từ cả ba worker.


## Checkpoint đợt initial pure hoàn tất

A01/B03/L02 đã có EVC+SEC APPROVE exact candidates và root readback, chỉ DONE_IN_SCOPE_INITIAL_PURE. [Biên bản review và lịch sử findings](permission-main-abl-initial-review-2026-10-19.md) là nguồn verdict, issue counters và giới hạn. Bounds A/L đã chuyển về B bằng safe refs, maxima vẫn UNKNOWN; B planDecisionSTOP/runtimeNOT_RUN. Không tạo P/R/D/E, không commit/import/merge hoặc mở actual transport/runtime. Original510dirty, ci11WIP và runner567 được giữ riêng.
