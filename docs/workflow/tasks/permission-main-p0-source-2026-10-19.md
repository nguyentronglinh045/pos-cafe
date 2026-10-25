# P0 — nguồn, inventory và readback 19/10/2026

Liên kết [packet P0](permission-main-p0-2026-10-19.md). Đây là kiểm tra đọc và provenance cho preparation, không runtime hoặc source acceptance mới.

## Readback P0

| Checkout/ref | HEAD/tree/trạng thái đã đọc |
|---|---|
| D:/Workspace/pos-cafe-full-runner-20261018 | ci/permission-full-runner-20261018; HEAD567af2191400ef559e90b3eccae0a0e4992f82e5/tree5b8667b4c421a7e6c47f566e1634129799a5f83d;0dirty |
| D:/Workspace/pos-cafe | main local HEAD5156820f7d6679cd6f8051bdc38419737ffa0c7e;510dirty; không sửa |
| D:/Workspace/pos-cafe-ci | HEADc898d7602d83e1e6d444e0c22259bd141bef85a4;11WIP; không đọc/copy nội dung |
| D:/Workspace/pos-cafe-docs | docs HEAD2ad68003ca3de719c5dc4746a706dc600028dc2b;395dirty trước P0; index dirty baseline SHA256fd713feeb52aa3a2f082e67056ea94b9557e45f3f8a8bc9cb4b641b20ed77920; P0 không ghi file này, xem cập nhật đồng thời phía dưới |
| remote main/PR6 | Readback onboarding: main536d8f6497403ace1193af4586a89b4862c730fd; PR6 Draft/open/head7fa52d803432eedc1b3d3e71e0a60162519ab7e7, chưa merge; P0 không sửa/fetch ref hoặc dispatch |
| legacy commit có sẵn | ef2c372aec60d8362549e47b7aedb27126129479/tree1ef7df6b8f0e741ce96b4968edd77d1a28fe6fe4; chỉ git show/ls-tree |

Thay đổi docs HEAD sau onboarding chỉ là commit2ad6800 ghi đã nhận callback. Trong working tree có cập nhật đồng thời ngoài P0: index thêm đúng mục stitch-ui-intake-2026-10-19.md, raw SHA256 mới407b61bd2311be7b24439bb7922790147181e674509f4bd557bd6f4a8fb86e9d. Bỏ đúng bytes mục mới trong RAM cho SHA baselinefd713fee… như trước; phần cũ được giữ nguyên, không sửa/xóa mục Stitch. P0 không ghi index. Plan permission-main-session-plan-2026-10-19.md vẫn SHA256b2a1c4a949210bd889e7d0d218f4a1a24ced3ea9b2bf6b22b111c4695e803123; P0 không sửa plan. Handoff chỉ thêm liên kết P0. Worker phải đọc lại trước ghi; không dùng snapshot thay quyền launch hoặc tuyên bố toàn worktree dirty không có ai khác sửa.

P0 đã đọc trực tiếp human item01a151fa-1b26-79e2-959d-fba4e1a0b009, turn01a151fa-1afa-7913-a41b-f02bf6e9be78/chat01a14cc1-5b2d-7661-bd93-50d5fa1e2564/hostlocal. Nội dung chuyển giao tương tác cho coordinator mới không tự mở worker/worktree hoặc xác định quyền callback về đích mới. Lệnh chuyển P0 chỉ chuẩn bị tài liệu/review.

## Canonical source inventory

SHA256 tính từ bytes git show exactCommit:path trong RAM, không qua normalize nội dung. Đây là representation Git LF; working checkout Windows có thể CRLF. Không so raw working SHA với canonical rồi tự kết luận source drift. Mỗi file vẫn được pin bởi commit/tree; trước sửa worker phải phân biệt base Git blob và snapshot file mới.

| File tại source567, trừ hàng LEGACY | Canonical bytes | SHA256 |
|---|---:|---|
| scripts/permission-full-custody.mjs | 4797 | a6b2e9944a5144ff974090fc604a739be591b32b0e0c89e8d51c5839ea01ea53 |
| scripts/permission-full-runtime-policy.mjs | 10314 | efa9e4ba861b4e7268e7efaeeaeeb123a9cef4541bb9bd6adb43b9f4a400f0ae |
| scripts/permission-ci1-policy.mjs | 11481 | edc74cc667114a886749ef72b3097410f939f4a7aeb5c12da3c2d3e7689dcb0b |
| scripts/permission-ci1-worker.mjs | 57745 | 0d98212a7451a0042beb1a7c8d06c65fa05b7d1945cab230d0498f6e265a722c |
| scripts/permission-ci1-harness.mjs | 23912 | afde353f6340efbe69a26fed56506842882a549814db7d011366651e65b6f689 |
| scripts/permission-ci1-source.mjs | 3486 | d07212bb69ba2972f1326d8734f5df3e2f5c902cf05c4655815a843b2388295a |
| scripts/permission-execution-evidence.mjs | 6622 | c87fedfcd6d106db5b014d86fa606661c9facd4a793475fbadbc708b095845a6 |
| scripts/permission-full-static.mjs | 12464 | 118cf46ab5c9feb9e7727240a0ac8370d49e35a974bc00ac8bc0e0fbf279aefb |
| scripts/permission-legacy-head.mjs | 6798 | 67e5fef3ee270906d60a960dea46ed9d83c3eba38c52090c3d0e2a8ac9b9aea9 |
| scripts/permission-legacy-browser-prepare.mjs | 3863 | 3e7908650e37668d5e3279fc1f54fae89fceeda1caa9951e55b80b30d114948e |
| scripts/permission-aggregate-verify.mjs | 12910 | 77fb0280071513c52f07464e0dbb8e04dbc1f8b630b94b917263c6bf65f142ba |
| scripts/permission-verify.mjs | 11810 | 7803cffb6421e6d6c04eb75b8b33a26892448cc774f277cb3d6ff2253e4eb6f2 |
| scripts/permission-preflight-core.mjs | 11335 | 052f7536f36b33971599372633d4e6d8e6c46ec117c5cf2521cc0e89c4bcdcc1 |
| tests/permissions/permissionAggregateCases.json | 214409 | 6571509a877e3bee7f75efa6bc6488667952b6639a9abbf7fbb7d6f86c43156d |
| tests/permissions/runtime/ci1-tools.json | 652 | bde0a12f4e0d2c603f912c260825db37b3c3ff1228b338166b9fbd053f083638 |
| tests/permissions/runtime/ci1-images.json | 4545 | 6dbf8db15721095665c625abadd4000a07c119d9f1bb46ff0826f2d8354ce46c |
| package-lock.json | 182800 | 85969c1c161f74e9f68563182d99d1b0ac6fb5f17f5074444f329675ffd34e18 |
| playwright.permission-legacy-transition.config.ts | 1356 | 7852e623e9f7ec71c12a203824a10a47034112efb4c6de893271024a500cb62b |
| .github/workflows/backend.yml | 2392 | 2efd01a339256d4639b4aa522f44298c17eea68ab908e342a2236a9b4fdde2c3 |
| LEGACY:package.json | 1833 | c444db7f1e05ce130d88752ce27f8bf143f395696f9bf18054f265cb8ef54ca0 |
| LEGACY:package-lock.json | 182800 | 1b6d400213384cd736ee7dd2108137d7b63b67a467bd9672886e220cc2f0cf0b |

Manifest nguồn567 đọc trong RAM:60cases/726variant occurrences/27stages; đây là expected inventory REQUIRED, không số thực thi. Source fingerprint của candidate mới chưa tính/chạy, không lấy fingerprint source cũ để nhận source mới PASS.

## Căn cứ ngữ nghĩa đã đọc

Các link dưới đây trỏ vào runner sạch đã pin; dòng chỉ để tìm code, hash/commit ở bảng mới là nhận diện nội dung.

- [Runtime policy:80](D:/Workspace/pos-cafe-full-runner-20261018/scripts/permission-full-runtime-policy.mjs:80): PLAN_ONLY/NOT_RUN/NEEDS_PORT, NOT_ENFORCED_BY_THIS_MODULE; :72 giữ cùng physical backend T04; :28-77 pin bootstrap/config/ports.
- [CI1 limits:6](D:/Workspace/pos-cafe-full-runner-20261018/scripts/permission-ci1-policy.mjs:6):18GiB loop/20GiB task/30GiB host reserve/1GiB loop reserve/1800s,3CPU/10GiBRAM/swap0/PIDs2048. [Old worker:690](D:/Workspace/pos-cafe-full-runner-20261018/scripts/permission-ci1-worker.mjs:690) còn source-intake64MiB; không chạy lại nguyên worker cho fullgate.
- [Custody:10](D:/Workspace/pos-cafe-full-runner-20261018/scripts/permission-full-custody.mjs:10): exact binding fields; :18-35 hash/range/owner bindings; :41-67 latest ACK/creator/query/time. Module chỉ pure protocol, chưa receive/decrypt/POST.
- [Execution:42](D:/Workspace/pos-cafe-full-runner-20261018/scripts/permission-execution-evidence.mjs:42): discovery/results/options byte/content hashes và profile attestation; :60-84 strict collector. [Aggregate:85](D:/Workspace/pos-cafe-full-runner-20261018/scripts/permission-aggregate-verify.mjs:85) riêng60PERM, không dùng làm PIN19.
- [Static collector:9](D:/Workspace/pos-cafe-full-runner-20261018/scripts/permission-full-static.mjs:9): bốn static stages, full-file selection và SIMULATION tách actual; không thay27stage execution.
- [Legacy helper:67](D:/Workspace/pos-cafe-full-runner-20261018/scripts/permission-legacy-head.mjs:67): archive lock vs workspace lock sau CRLF transform; :76 từ chối mismatch. :93-110 dùng ancestor workspace dependencies để build, nên không được đổi lock hoặc giả graph legacy tương đương. P0 chỉ đọc, chưa chạy helper.
- [Legacy browser fixture:14](D:/Workspace/pos-cafe-full-runner-20261018/scripts/permission-legacy-browser-prepare.mjs:14): checks fixture/RLS/grants trước SELECT-only grant; hàm có DB mutation, không import/call trong initial slice. [Preview config:26](D:/Workspace/pos-cafe-full-runner-20261018/playwright.permission-legacy-transition.config.ts:26) chạy helper thật; P0/L chỉ đọc.
- [Backend workflow:8](D:/Workspace/pos-cafe-full-runner-20261018/.github/workflows/backend.yml:8): chỉ pilot/namespace dispatch, chưa full workflow.

## Safe evidence kế thừa và điều chưa xác minh

[HandoffA18-15/A19-01](permission-merge-hp1-alternative-2026-10-18.md#a18-15--ci-mới-và-namespace-pass-full-backend-vẫn-chờ-budgetcustody) và [plan](permission-main-session-plan-2026-10-19.md) giữ scope/gates mới nhất. Đã đối chiếu manifest f835c1232befa0bd5cee7416b0922de9ea8610174bbc9e7b3e8a8afd83139862 với snapshots/review-results của D:/Workspace/pos-cafe-ci-main/artifacts/permission-session-plan-a19-review01. Hai review chỉ ANALYSIS_ONLY_NO_LAUNCH. Handoff onboarding tiếp nối review riêng, không phải runtime approval.

GPG facts lấy từ đoạn safe summary A18-04 và A18-07 trong handoff, không đọc raw status hoặc private key. Safe refs để A viện dẫn:
- D:/Workspace/pos-cafe-ci-main/artifacts/permission-proof-transport-a18-02/smoke-result.json.
- D:/Workspace/pos-cafe-ci-main/artifacts/permission-proof-transport-a18-02/postmortem-errors.json và postmortem-error-decoding.json.

P0 chưa mở các file này; không khẳng định hash/actual mới. A chỉ dùng kết luận đã pin trong summary hoặc nhận safe redacted metadata cụ thể từ root, không tự mở raw payload. Hai actual failures kế thừa STOP; lỗi GPG Agent/NO_PIN_ENTRY là observation token cũ, nguyên nhân/key usability còn UNKNOWN.

D:/Workspace/pos-cafe-ci-main/artifacts/permission-full-runtime-budget-a18-01/registry-metadata.json được handoff ghi SHA2562897c40d17f641ad8c126f68e9bd863052a48be00ac6ad7818826d659e5db6d1:1unverified attempt/0verified manifests. P0 không gọi registry hoặc tải blob/token.112621911bytes tool archive và caps npm compressed512MiB/loose expanded94.5GiB trong handoff chưa chứng minh allocation fit; không dùng partial sums thành0 hoặc upper bound thành actual estimate.

Retained task allocation/global remaining budget, full provision/runtime/transport/ACK/retention và P/R output bounds chưa xác minh. P0 không nhận preparation hoặc namespace PASS thành ADMITTED runtime. C196712943616bytes/D99223179264bytes free trước P0; source/doc output nhỏ không thay budget ledger cho heavy.
