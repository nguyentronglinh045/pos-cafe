# Review EVC độc lập — gói Git minh chứng LOCAL, 17/10/2026

- Reviewer: `publication_final_evc`, subagent không tham gia tạo candidate/source/plan.
- Verdict: **APPROVE** trong phạm vi gói đóng băng và kế hoạch commit local chưa thực hiện.
- Candidate: `D:/Workspace/pos-cafe/artifacts/permission-git-publication-local-20261017/review-candidate-01/candidate.json`.
- Candidate SHA256: `abbad7c6d1a77808ccea99076b62bf4667528fd25359cd81462c7cf6c0f0f889`.
- Phạm vi EVC: selection/dependency/curation; ràng buộc source export, metadata, Git conversion/tree/parent; deletion/replacement; tính đúng của recipe và phát biểu bằng chứng/gate. Không duyệt toàn bộ logic ứng dụng, backend hay deployment.
- Nguồn quy trình: `D:/Workspace/pos-cafe-docs/AGENTS.md`, `docs/workflow/README.md`, `openspec/SPEC-STANDARD.md`, mẫu review và mục bàn giao Git minh chứng trong task index. Review này không cần reviewer lồng nhau theo review gate.

## Các phép kiểm độc lập

Chỉ dùng Node built-ins với heap 256 MiB và Git đọc/hash không `-w`; tối đa hai phép kiểm con đồng thời. Không chạy helper/module ứng dụng hoặc recovery trong candidate. Không cài công cụ, chạy app test, truy cập mạng/DB/provider, stage, tạo worktree/nhánh/commit, push hoặc xóa. File ghi duy nhất của reviewer là báo cáo này, ngoài 842 entries của lần publication đầu.

| Đối tượng | Phép kiểm và kết quả |
| --- | --- |
| Candidate và metadata | Tính lại SHA candidate đúng giá trị được giao. Cả 56 snapshot đúng SHA/bytes; đọc lại 56 source metadata tương ứng cũng 0 drift. |
| Frozen source | Đọc/hash 840 bản trong `payload/{main,docs}`: đúng **8.267.924 bytes**, SHA256/mode/blob metadata không sai; không có NUL. Đọc/hash source và input của từng record: 0 drift, gồm original của năm bản curated. |
| Selection | Đối chiếu capture 510 main + 380 docs với manifest: 842 unique selected records + 48 excluded deltas, mỗi capture path thuộc đúng một nhóm. 509 code = 507 files + 2 deletions; 333 docs. Mọi selection mới có căn cứ old INCLUDE, quyết định HOLD hoặc năm report sau freeze. |
| HOLD và curation | 22 docs HOLD = 6 whole + 3 curated + 13 excluded. Hai INCLUDE cũ dùng curated thêm, tổng năm copies. Tái áp dụng đủ **27 edits** đã kê vào original và giữ line ending: cả năm SHA khớp export. |
| Allowlist | NUL existing-path snapshots đúng tập **507 main / 333 docs**, không trùng, không thiếu hay thêm path. Hai deletion không nằm trong existing-path allowlist. |
| Git conversion | Tự gọi `git hash-object --path=<path> --stdin` không `-w` cho đủ 840 exports; raw blob SHA1 và Git blob khớp manifest. **126 files** có raw bytes khác Git blob. Git 2.54.0.windows.1, `core.autocrlf=true` tại review. |
| Git trees | Đọc baseline bằng explicit parent, tự dựng lại Git tree bằng SHA1/header/order trong memory, baseline khớp HEAD tree. Áp dụng đủ selected blob/mode/deletion rồi tính lại hai planned trees, khớp bảng bên dưới. Không ghi object/index/ref. |
| Docs ancestry | `rev-list` xác nhận đúng hai ancestor local docs chưa có ở remote base; `diff --name-only` đúng 24 paths. Đọc/hash độc lập **44 blobs/24 paths** được pin trong history metadata: 0 mismatch. Đây là workflow/spec/config history, không phải app source. |
| Dependency tĩnh | Trên tập final main paths = baseline + selected deltas, quét **1.526 relative/alias imports** trong selected JS/TS: 0 target thiếu. Root dependencies/devDependencies của npm lock khớp `package.json`. Đây là kiểm đóng gói tĩnh, không thay typecheck/runtime test. |
| Link docs | Quét lại 332 Markdown exports dựa trên selected paths và retained HEAD: 1.881 selected edges, 128 retained HEAD, 2.294 main-local provenance, 15 other-local provenance; **0 missing doc target**. Không mở linked raw targets. |
| Chưa thực hiện Git | Đọc local refs/worktree metadata và kiểm hai directory đích: hai proposed branch refs và directories vẫn absent. Không tự prune các worktree metadata cũ. |

| Nhánh dự kiến | Parent chính xác | Baseline tree | Planned tree tính lại | Entries cuối |
| --- | --- | --- | --- | ---: |
| `evidence/permission-20261016` | `5156820f7d6679cd6f8051bdc38419737ffa0c7e` | `2b99bddff5d89a3fd4b0596ccf8623e6199c236c` | `50fe1d4fcdd5563a8cdbe794c7035a22c148b574` | 848 |
| `evidence/permission-docs-20261016` | `e47862b1dfed68d783dc07a2a1fd51ecdabc1b19` | `46f66946cfe3fd538d66d6a90c3c9b6929d51a34` | `bc4027fe7daa4e62dc95e165162c2bc480645a7a` | 751 |

## Đối chiếu nội dung và recipe

Năm curated copies bỏ đúng delta đề xuất độc lập/incident và giữ nền HEAD; không biến excluded delta thành deletion. Đã đọc danh sách edits và đối chiếu bytes tái dựng. `openspec/changes/redesign-permission-model/testplan.md` chỉ thay một link sang proposal deferred bằng tên/path có ghi phạm vi; TC-PERM-29, expected results, controls và gate không bị hạ. References/rubric/index whole được giữ để đáp ứng dependency của selected permission handoffs. Không phát hiện yêu cầu nghiệp vụ mới cần chốt để chuẩn bị gói này.

Hai deletion đã đối chiếu bytes/SHA từ đúng main parent. Baseline callers/export nằm ở `src/app/App.tsx` và `src/features/integration/index.ts`, đều được thay trong selected payload; không còn tên hook cũ trong selected source. Replacement được chọn gồm `src/app/PermissionLifecycle.tsx:16`, wiring `src/app/App.tsx:118`, core lifecycle, ports và tests. Lifecycle mới chứa signal subscription, invalidation/reconnect và cleanup tại `PermissionLifecycle.tsx:65–93`. Phép kiểm này xác nhận coupling đóng gói; không tuyên bố hành vi runtime đã được kiểm lại.

Plan đúng mô hình hai nhánh và giữ checkout gốc: chỉ sau lệnh owner mới dùng `git worktree add -b` từ explicit parent, copy từng export, so raw hash, xác minh hai deletion baseline rồi `git rm` đúng hai path; stage bằng literal NUL allowlist. Cần so toàn bộ staged paths/modes/blobs và `git write-tree` với expected tree trước normal `git commit --file`, rồi kiểm lại parent/tree commit và HEAD/index gốc. Không có `commit-tree`, blanket add, reset/stash/force hay tự bỏ hook/signing. Preflight yêu cầu dừng khi config/attributes/hooks/ref/source khác giả định; phải giữ điều kiện này khi thực hiện.

Docs branch từ parent local mang thêm hai commit đã tồn tại `9937f1f005f1569b0e348374b37cc95d8b490ca5` và `e47862b1dfed68d783dc07a2a1fd51ecdabc1b19`, bên cạnh một commit docs mới dự kiến. Allowlist dirty không loại chúng khỏi ancestry. Plan/report công bố đúng phần này, không giả hai commit mới là toàn bộ unpublished history. Docs giữ luồng riêng, code chỉ merge về main khi đủ gate và có lệnh owner.

Recipe giữ quyền push riêng; phải kiểm lại Preview Branch Tracking OFF trên đúng Vercel project và remote/trigger trước eventual push. Setting OFF lịch sử không thành bằng chứng chặn mọi kiểu deployment. Review này không cấp quyền tạo hai commit, push, CI, DB hay deploy.

## Bằng chứng, finding và giới hạn

Đã đọc public progress evidence trong payload và đối chiếu fields với frozen `sanitized-progress-summary-final.json`, source correspondence và publication report. Các số Windows 15/10 được ghi đúng phạm vi lịch sử mock/unit/tooling: 1.173 unit, 489 tooling, hai typecheck/build exit 0, smoke 44 PASS/37 viewport skips, UI selftest 23 và 6 baseline false positives/0 mới. Worker local 33 PASS có gồm 15 ca cũ; actual Linux/backend runs vẫn 0. Source correspondence 834 entries/1 env template held/0 drift không được nhận là full-source acceptance hoặc test mới. Không đọc lại raw logs hay tái xác minh toàn bộ receipt lịch sử trong review này.

Probe actor/scope lịch sử 79 stores/145 Auth IDs/3 Storage metadata chỉ chứng minh metadata scope với TLS/READ ONLY/rollback/close. Hồ sơ giữ rõ chưa có schema/contract2 compatibility, full backend gates, certified hosted profile/control, backup/recovery, cutover, Edge/Storage/Realtime và binding môi trường. Quyền invocation đã dùng, không có probe mới. Tailwind 3 được giữ theo quyết định owner; không nhận advisory đã vá. Trạng thái phát hành **NOT_READY_FOR_DEPLOY** được giữ.

| Finding | Phân loại và trạng thái |
| --- | --- |
| Không có finding cần sửa | Không còn finding chặn trong phạm vi EVC của exact candidate này. |

Không kiểm external URLs, anchors hay reference-style Markdown; local provenance links không có nghĩa raw artifacts đã công khai. Không audit mọi baseline blob/toàn lịch sử, secret/PII, ACL, runtime hoặc toàn logic ứng dụng; SEC là scope riêng. Không chạy Linux/backend/UI/app tests, không giảm acceptance để duyệt local plan. Trần 24 MiB, heap và dự trù worktree 128 MiB là giới hạn vận hành/dự trù, không phải OS quota; không tạo runtime hoặc cài dependency. Free Windows tại checkpoint review: C 199.560.179.712 B, D 102.794.461.184 B; vẫn phải đo lại trước bước ghi lớn.

**APPROVE** áp dụng cho candidate SHA256 `abbad7c6d1a77808ccea99076b62bf4667528fd25359cd81462c7cf6c0f0f889`, hai expected trees và plan-only scope trên. Thay source/curation/plan/tree/expected hoặc kết luận bằng chứng phải gửi delta để review lại. SHA256 của báo cáo được tính sau khi ghi và trả về điều phối; không nhúng self-hash vào file.
