# REGISTRATION-FULLFILE01 — sửa và review hồi quy, 19/10/2026

- Trạng thái mới nhất: **LOCAL_REG_VERIFIED; hai final evidence reviewers APPROVE**. Các checkpoint NOT_RUN/review pending bên dưới giữ làm lịch sử trước lượt kiểm và review cuối.
- Nguồn giao việc: root chat `01a151f6-cec4-78e2-ae17-25f3f8069213`, human turn `01a15340-66ce-7690-b175-a4ccbe0cc5a8`, item `01a15340-66f8-7870-ace1-5cf053e16550`: “ok vậy tạo riêng 1 session mới xử lý vấn đề này, sau khi xong tiến hành review kĩ lại để đảm bảo không gây lỗi code cũ.” Bàn giao tạo chat truyền nguyên phạm vi; không tạo quyền chạy mới sau STOP.
- Code: `D:/Workspace/pos-cafe-permission-integration-20261019`, branch `ci/permission-full-integration-20261019`, HEAD `567af2191400ef559e90b3eccae0a0e4992f82e5`; combined dirty candidate được giữ. Docs HEAD `2ad68003ca3de719c5dc4746a706dc600028dc2b`, dirty edits khác được giữ.
- Ownership: chỉ `scripts/permission-full-registration.mjs`, helper runtime-reference mới riêng REG và `artifacts/permission-full-integration-d1/registration-check.test.mjs`; task này và duy nhất entry tương ứng trong index. Không sửa source app/test nghiệp vụ, shared D1/P/L/B/CI1, expected catalog, frozen packets hoặc hồ sơ chẩn đoán root.
- Mức nhạy cảm: analyzer dùng làm bằng chứng phân quyền/closure; cần hai reviewer không phải tác giả, correctness/runtime semantics và effects/bounds/compatibility. Review static trước mọi semantic execution.
- Artifact namespace mới: `D:/Workspace/pos-cafe-ci-main/artifacts/permission-main-reg-repair-20261019`; đã kiểm absent trước tạo. `baseline.json` và `pre/` lưu preimage hai file REG và index, có thể phục hồi bằng đối chiếu hash trước khi copy; chưa thực hiện rollback.

## Brief và bất biến

Chẩn đoán frozen `registration-stop-diagnosis.json` SHA256 `483ccd0ac6e1cb5fa30e5898b0ffc66425296fc9ef3fbb4013acd92b5aa9a773` đã được hai reviewer duyệt, không chạy lại để chẩn đoán. Lỗi trộn Identifier type/name/binding với runtime reads đưa `const` từ inline assertion vào domain chung và làm STAGES bị bỏ tại source18, lỗi3344 là hệ quả. Sửa mô hình traversal có role và lexical binding identity, bỏ erased type operands nhưng giữ runtime expression. Không blacklist `const`, không bỏ cả assertion subtree, không coi `as const` là runtime freeze.

Giữ exact55 identity triples =48 ordinary (đã gồm1 PERM29)+7 TC18, unresolved0; giữ import/alias/modifier/IIFE/transitive capture/root-shadow/generator/async guards và work/depth/value/output bounds. Không dùng ba nhóm PASS lịch sử thay suitePASS.

## Kế hoạch có giới hạn và traceability

| Yêu cầu | Thay đổi/kiểm dự kiến |
| --- | --- |
| Runtime reads có lexical identity | helper role-aware: type erased; binding/property label khác value read; computed keys, shorthand, defaults/calls vẫn được duyệt |
| Không nhiễm domain giữa scope/type/property | tổ hợp declared STAGES assertion + inline-loop assertion; type/property/local-name collisions; sibling scopes |
| Giữ fail-closed effects | cast/satisfies/non-null effects, getter/computed key, alias/mutation/unknown call negatives; giữ toàn bộ27 negatives cũ |
| Giữ positive thật và contracts | exact55/triples/7TC18/1PERM29/unresolved0, source raw read-only; finite errors/compiler I/O purity và giới hạn cũ |
| Review hồi quy và recoverability | impact/caller/import/read/tool closure thủ công từ inventory/manifest; pre/post snapshot và fingerprint; hai review static đúng candidate |
| Lượt kiểm mới sau STOP | packet cụ thể gồm lệnh, closure, bounds, fingerprint và review; trình owner nếu cần, không tự tạo grant/token |

## Quyền và ngân sách

Pure code/review được giao. Chưa có lượt semantic run mới: hai FAIL gốc + ngoại lệ1 FAIL3/4, token đã consumed; đổi session không reset. Không REG/compiler/AST probe/alternate harness, raw suite/probe, AUDIT, app/Vitest/Playwright/DB/heavy/CI, install, GPG/crypto thực, key/ACL, cleanup, commit/push/merge.

Trước ghi: C free195940843520B, D free98842460160B; measured gross D worktree50727278B + root D1 controls6551890B =57279168 logicalB, không phải physical allocation. Thêm ban đầu tối đa4MiB; tổng D1 increment64MiB và source8MiB kế thừa, không cộng lại budget; fixtures serialized đồng thời4MiB, không phải RSS quota. Task20GiB/reserve30GiB C/D. Chưa cài/tải hoặc tạo heavy environment. Không cleanup nếu thiếu exact authorization.

## Bàn giao lúc khởi động (lịch sử)

Đang triển khai traversal và regression source. Code prepared/verified/owner accepted là các trạng thái riêng. Chưa claim PASS/DONE. Walkthrough code/test sẽ cung cấp khi candidate đủ evidence; chưa có phản hồi owner là đã đọc/hiểu. Callback sang chat khác **UNSENT**, root theo dõi bằng wait_threads.

Lịch sử giữ nguyên: ROOT-SEARCH-PATHS CAP_BREACH, scanner closure2STOP, compiler typings lookup broadened read, GPG2FAILSTOP/0extra; RAW27 PASS5/5 đúng ngoại lệ cũ và RAW38 frozen, không chạy lại. Một truy vấn caller trên inventory ban đầu lọc extension sai nên không có input; đã sửa lọc EndsWith và không fallback sang quét thư mục compiler/repo rộng.

## Candidate01 — đã chuẩn bị, chưa chạy

Manifest `D:/Workspace/pos-cafe-ci-main/artifacts/permission-main-reg-repair-20261019/candidate01/manifest.json`, SHA256 `35cfcd69400882f789322ea41d02487e9fc7c5291a5381a2f2f1956c9df8d640`. Snapshot23inputs, actual9ESM modules, ba text/JSON reads và hai compiler tools/Node binary được pin; tools chỉ pin, không copy hoặc install. RAW38 live guards khớp frozen manifest, không gọi lại raw suite.

| File được sửa | SHA256 candidate01 |
| --- | --- |
| `scripts/permission-full-registration.mjs` | `5ed8a6fd4d42bf0141c345e29b3b6d6f6f3e66f8a4b30eca5429aab2aa3c82b1` |
| `scripts/permission-full-registration-references.mjs` mới | `519f8678a5f6553eec6545a90e23a96c12960348b2ab9ce2155d2d616b6d4fe3` |
| `artifacts/permission-full-integration-d1/registration-check.test.mjs` | `47c3c614a2562281c268a9b3da9d98b5df9be231e5fe89f18f161a13ad960ffd` |

`impact-and-plan.json` ghi inventory/caller/actual import-read-tool closure và ma trận regression. Chỉ tìm được direct caller trong test REG, hai recipe lịch sử đọc path để snapshot; đây không phải bằng chứng không có caller injection ở ngoài inventory. Public port signatures/result shape giữ nguyên; việc tích hợp toàn graph vẫn STOP.

`static-validation01.json` là kiểm **bytes/text**, không phải test semantic:23live/snapshot pins khớp, RAW38unchanged, ba nhóm test cũ2–4 giữ nguyên cả dòng; nhóm source thật1 chỉ thêm assert unresolved0/diagnostics0; có9top-leveltestgroups. Inverse index chỉ xóa entry sở hữu khôi phục bytes preimage đúng. Tổng measured gross58.120.618 logicalB, namespace mới828.254B; C195.937.710.080B/D98.841.354.240B free. Đây là checkpoint trước review, không phải quota kỹ thuật.

Hai reviewer được giao độc lập: `/root/reg_correctness_review` (runtime semantics/positive fullfile/count/partition) và `/root/reg_security_review` (effects/bounds/old guards/compiler purity/permissions packet). Họ chỉ đọc, không sửa hoặc chạy candidate. Verdict đang chờ, không nhận là APPROVE.

Lệnh mới đề xuất, **chưa được cấp quyền**: `D:/tools/nodejs/node.exe --test --test-isolation=none --test-reporter=tap --test-concurrency=1 D:/Workspace/pos-cafe-permission-integration-20261019/artifacts/permission-full-integration-d1/registration-check.test.mjs`. Proposed controller `run-reviewed-once.mjs` chỉ spawn đúng lệnh đó, không patch source; đúng1child Node, timeout child60giây/8192Bstdout+stderr/16384Bcontrols (pre/post hash I/O nằm ngoài timeout, không có wall-clock quota cho toàn controller), fixtures serialized đồng thời4MiB và conservative synthetic peak≤256KiB; strict9PASS/0FAIL/0SKIP/0CANCELLED/0TODO. Chỉ tạo human-grant record sau direct owner decision gắn manifest; token run mới exclusive, giữ counters2FAIL+1consumed exception. Nếu FAIL/timeout/overflow/drift thì STOP, không retry. Controller chưa từng chạy.

## Hướng dẫn đọc code/test cho owner

Walkthrough được chuẩn bị; chưa có xác nhận owner đã đọc/hiểu. Đọc helper `runtimeReferences`: entry phân biệt erased type với runtime operand, binding scopes và key resolution; sau đó `typescriptRegistrations` nối cùng key vào domains/dependencies/captures và env. Đọc test tổ hợp STAGES+inline assertion trước, rồi role fixture (computed/shorthand/default so với type/property/local names), effects negatives và cuối cùng ca source thật exact55. So với preimage trong `pre/`, ba nhóm guard cũ không đổi; test mới bổ sung thay vì giảm expected/acceptance. Kết luận đúng hiện tại là **CODE_PREPARED / NOT_VERIFIED**, không bảo đảm không còn hồi quy.

Candidate02 thay candidate01 để sửa mô tả count27 negatives cũ (source test không đổi) và đổi path manifest trong proposed controller sang candidate02; không đổi ba REG source hashes ở bảng trên. Manifest cuối `candidate02/manifest.json` SHA256 `42ae9a5d67701864ec99dff9981cf39a242e98bdbae2d6ec3876a7e4d32744ff`. Candidate01 giữ làm lịch sử, không còn là packet đề xuất chạy. Hai reviewer đang đối chiếu delta cuối; vẫn **NOT_RUN/NO_NEW_GRANT**.

## Lượt kiểm mới đã được duyệt và kết quả thật

Owner trả lời **“Cho phép đúng 1 lượt theo packet02”** qua `request_user_input_async/call_589dd102720247ebb2a523afceb4825a/0`. Đã đọc trực tiếp userMessage bằng read_thread tại chat `01a15342-e563-7b20-adbf-ea0a2d7b3123`, turn đang chạy `01a15342-e812-7313-9706-0562f7ee4ed9`, human item `01a15351-d256-71f3-aafa-faddb97d7ab0`. Không dùng nội dung agent làm approval. `human-grant.json` SHA256 `730c9d9f456ecc284b5792c048bf81d509de0f2387350afef65e2f7593638d5c` chỉ ghi lại quyết định đó.

Trước chạy, cả `/root/reg_correctness_review` và `/root/reg_security_review` **APPROVE CODE_AND_PROPOSED_RUN_ONLY** đúng manifest02 `42ae…44ff` và task doc pre-verdict-metadata SHA256 `6e84bf00a1a8377c751aa2c0a12e91ece9f61d7e5f2b71d41609f210cb5ed625`. Báo cáo ở `review-results02.json`; snapshot doc đã review ở `reviewed-task-document.md`. Metadata count26→27 đã đóng; không có finding code chặn. Reviewer không sửa hoặc chạy candidate.

Đã gọi đúng controller đã review, đúng1lần, trong worktree D đã giao. Node child chạy lệnh đã nêu, `--test-isolation=none` và concurrency1; exit0, **9PASS/0FAIL/0SKIP/0CANCELLED/0TODO**. Receipt từ08:41:18.055Z đến08:41:18.532Z ngày19/10/2026 (15:41 giờ Asia/Bangkok),477ms; TAP duration336.5602ms. Output2434B; tổng grant+token+result+output4588B, trong8192Boutput/16384Bcontrols. Không thêm lần chạy hoặc retry.

| Tiêu chí | Evidence thực tế trên source candidate02 |
| --- | --- |
| Source thật exact55 và phân hoạch P03 | PASS group1: sorted55 triples bằng frozen mappings,7TC18/1PERM29/suite prefix, unresolved0 và diagnostics0 |
| Tái hiện tổ hợp gây lỗi và va chạm type/property/scope | PASS groups5–7, gồm lexical roles và parameter-default/body-var/computed-destructuring |
| Hồi quy guard cũ | PASS groups2–4; ba nhóm giữ nguyên từng dòng, group4 chứa27 negatives; không giảm expected |
| Cast/effect/computed/getter/alias và giới hạn | PASS groups8–9 cùng group4; finite STOP/error/parse/depth/binding/resource cases |
| Compiler purity | afterhook kiểm ioAttempts=[]/loadedBuiltins=[] đạt; compiler được sandbox, source/app/test bodies chỉ đọc text |
| Source/tool custody |23inputs+38RAWguards+Node/compiler pins khớp trước/sau; raw fullfile hash vẫn6fb950…d6fa0 |

`repair-run01-result.json` SHA256 `6b6619c3f7c46095ee7d198d8e6f232923ebea02356bf87e8a9b3a048264e9e9`; output SHA256 `a1ae5ee221bc021562861553b9788cfe77ea846671b8ddf0b97c9d9bb76244b4`. `post-run-checkpoint.json` ghi task Node process0, measured gross58.888.210logicalB, namespace mới1.595.846B; C195.931.049.984B/D98.840.129.536B free. Không cài/tải, heavy environment, cleanup hoặc source drift; logical caps không phải RSS/disk quota.

Lịch sử issue hiện:2FAIL gốc + ngoại lệ cũ1FAIL3/4 + đúng1lượt mới9/9PASS; cả hai token consumed được giữ, quyền kiểm còn lại0. Chỉ **PASS_PURE_REG_ONLY**; không dùng kết quả này mở lại AUDIT/RAW/fullD1/runtime/CI/merge. Chưa phát hành hoặc owner nghiệm thu toàn dự án. Code walkthrough đã chuẩn bị/được dẫn ở trên; chưa có xác nhận owner đã đọc hiểu. Hai reviewer đang kiểm final evidence bundle, không chạy lại vì grant đã consumed.

## Metadata review cuối và bàn giao

Cả `/root/reg_correctness_review` và `/root/reg_security_review` **APPROVE PURE_REG_REPAIR_VERIFIED_LOCAL_ONLY** trên evidence bundle `execution-evidence01/manifest.json` SHA256 `4a12a01887a7efe2cbc9bd2deda666fa24c563938a84b52f4321b2a55887f6ff` và candidate02 `42ae…44ff`. Họ độc lập đọc primary human approval, đối chiếu12entry/snapshot,3sourcepins,23candidateinputs,38RAWguards,Node/compiler tools và9PASS cùng source assertions. Không còn finding chặn; reviewer không sửa hoặc semantic rerun. Báo cáo đầy đủ ở `executed-review-results.json` cùng artifact namespace.

Doc được review trước metadata này SHA256 `1547c333b8096ab82e6d50df525d80359acb6a03b586a4cb824c6ca867f43aa0`, index `53fc48bee1d27c9b1f9e2ac633317b9cecf3834aff000e95938eabf14ffd8c06`; bytes đã lưu trong evidence snapshots. Mục này và status/index chỉ ghi verdict thực tế, không đổi code, expected hoặc kết luận đã review; không tạo vòng review đệ quy theo workflow.

Khả năng phục hồi: preimages hai file REG và index ở `pre/`, baseline hashes ở `baseline.json`; toàn postimage/closure nằm trong candidate02 snapshots. Khi rollback phải so live postimage trước, chỉ phục hồi file sở hữu; helper mới có thể để lại không được import, không tự xóa khi chưa có quyền cleanup. Chưa rollback/delete/commit/push/merge. Task technical REG local hoàn tất; owner walkthrough/nghiệm thu toàn dự án chưa được xác nhận. Root nhận qua wait_threads; không tự gửi sang chat khác.

Lỗi đóng gói evidence metadata đầu tiên do PowerShell ghép array paths thành một path khiến Get-Item từ chối, trước khi ghi snapshot/manifest; chỉ tạo thư mục rỗng. Đã xác minh rỗng rồi hoàn tất cùng namespace bằng recipe rõ suffix list; `packaging-history.json` giữ lịch sử. Đây không phải lượt REG thứ hai, không reset hoặc sử dụng thêm grant.
