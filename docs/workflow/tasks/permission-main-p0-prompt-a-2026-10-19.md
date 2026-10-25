# Prompt A — transport/receiver thuần, initial slice

PREPARED_NOT_DISPATCHED. Prompt chỉ được kích hoạt khi user giao launch và root ghi nguồn quyền vào registry. Đọc [contract P0](permission-main-p0-2026-10-19.md), [inventory](permission-main-p0-source-2026-10-19.md) và biên bản hai review APPROVE; bản thân file này không cấp quyền.

## Nội dung giao việc

Bạn là tác giả A của pos-cafe. Đọc authority tại D:/Workspace/pos-cafe-docs: AGENTS.md, CLAUDE.md, docs/workflow/README.md, openspec/SPEC-STANDARD.md. Áp dụng permission-main-prep-v1 và ownership/issue ledger P0; không nạp toàn chat cũ hoặc raw private/HP1. Root tổ chức review độc lập; tác giả chỉ báo READY_FOR_REVIEW.

Base: ci/permission-full-runner-20261018, commit 567af2191400ef559e90b3eccae0a0e4992f82e5, tree 5b8667b4c421a7e6c47f566e1634129799a5f83d. Worktree dự kiến D:/Workspace/pos-cafe-permission-a-20261019, branch ci/permission-transport-20261019. Không tự tạo/switch worktree. Trước ghi, tự đọc registry đã có human launch grant, exact actual path/branch/thread và kiểm HEAD/tree/status/root identity. Mismatch, path chưa duyệt hoặc collision thì BLOCKED trước hiệu ứng. Không đụng original 510 dirty, ci 11 WIP, runner chung hoặc docs dùng chung.

Chỉ bốn file mới trong artifacts/permission-proof-transport-next/: transport-model.mjs, receiver-model.mjs, transport-model.test.mjs, receiver-model.test.mjs. Safe synthetic receipts nằm dưới receipts/ trong đúng namespace của worktree A. Artifacts thường ignored: snapshot phải có đủ nội dung bốn file, không nhận git diff rỗng làm freeze. Không sửa/copy/rename 11 WIP, helpers cũ hay artifact01/02. Shared helper/config/schema cần sửa thì gửi proposed patch và impact cho root/D, chưa áp dụng.

Nhiệm vụ: chẩn đoán kế thừa hai actual GPG FAIL/STOP, nghiên cứu phương án khác và viết model descriptor thuần non-HP1. Kết luận an toàn đã pin: attempt01 seal/status-fd3 lỗi; attempt02 seal được nhưng open FAIL; postmortem offline nhận NO_PIN_ENTRY. Nguyên nhân agent đòi pinentry/key usability chưa biết. Không gọi GPG/agent/key command, đọc key/env/raw status, patch adapter thật, sửa ACL/passphrase hay export khóa. additionalActualAllowed=0; không gọi phương án khác là quyền retry mới. Phương án có thay đổi material chỉ đề xuất trade-off và điều kiện user cần chốt.

Model transport/receiver nhận source/lock/recipe/config/member hashes, declared lengths và expected binding. Kiểm missing/extra/duplicate/path traversal/unsafe member/hash-size-binding/source drift/truncation và member closure; dùng fixture giả. Kết quả chỉ SIMULATION, execution/runtimeAdmission/custodyObserved=NOT_RUN, plaintext writes/network/process effects=0. Giữ nguyên custody binding/caps/latest ACK/owner protocol nguồn567; không POST ACK hoặc feed model vào execution verifier/aggregate. Hash do fixture khai không chứng minh authentication thật.

Đầu ra bắt buộc:
- P0 v1 envelope; diagnosis tách fact/hypothesis/unknown; bảng phương án khác và preconditions trước actual.
- Hai model, hai test, typed seal/receive/open/closure descriptors và finite errors để D tích hợp.
- Bounds gửi B: plain/archive/cipher/status/member count/peak RAM/privateC/retention và overhead failure path; thiếu ghi null+UNKNOWN.
- Source inventory, recoverable patch/snapshot/payload gồm ignored files; command/runtime/counts/exit/safe receipt hashes; issues, pending decisions và NOT_RUN rõ.

Kiểm nhẹ chỉ dùng Node builtin đã có: rà import/side effects rồi node --check đúng bốn file, node --test đúng hai test mới. Không npm/npx/install/download/network/browser/service/DB/container/WSL/build/smoke/broad tests. Thiếu công cụ thì BLOCKED. Fixture mỗi input≤256KiB, tổng sống≤4MiB; generated/logs/receipts≤4MiB cho slice trong global20GiB, reserve30GiB C và ổ runtime. Đây là operating bound, chưa quotaOS. Đo trước/cuối ghi, không cleanup; giữ Windows6fixture STOP.

READY_FOR_REVIEW theo đủ checklist P0, có main/negative/boundary/security checks meaningful và side effects0. Kết luận actual transport STOP vẫn là đầu ra phân tích hợp lệ; không ép actual để xanh. Root cần EVC+SEC APPROVE exact candidate trước DONE_IN_SCOPE. Kế thừa issue history toàn task: cùng issue tối đa2failed attempts, đủ2 thì dừng đoán-sửa và chẩn đoán/hướng khác; không reset bằng thread/phase. Capacity ghi riêng, không đổi model. Material uncertainty hỏi user qua root và chờ trả lời thật; chỉ tiếp tục phần độc lập đã giao.

Đích báo kết quả dự kiến: coordinator 01a151f6-cec4-78e2-ae17-25f3f8069213 / host local. Trước send_message_to_thread tự read_thread human launch/routing source trong registry, xác minh user trực tiếp cho A gửi tới đích mới. Lệnh root/prompt/quyền về chat cũ không đủ. Chưa xác minh: UNSENT, trả kết quả tại thread A để root lấy bounded wait_threads. Sau xác minh: một callback meaningful READY_FOR_REVIEW/NEEDS_USER/FAILED/PARTIAL theo fields P0, không raw private/chat cũ/callback loop/service/heartbeat.

HP1 actual RETIRED; GPG actual STOP; Production/live DB/Edge/cutover/cleanup/deploy/merge khóa. Một môi trường nặng toàn task; initial A không tạo môi trường nào. Không thay PIN19/PERM60/3TC53/preservation/custody/retention/fresh CI/final reviews bằng kết quả pure.
