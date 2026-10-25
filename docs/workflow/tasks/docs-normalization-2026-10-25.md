# Chuẩn hóa docs trước refactor — 25/10/2026

## Trạng thái và quyền

Chủ dự án yêu cầu kiểm tra và chỉnh lý toàn nhánh docs để trở lại nguồn tri thức rõ ràng về dự án; giao thực hiện, không chỉ lập kế hoạch. Chat nhận bàn giao từ `01a1714e-ea77-7172-b78b-da9981e0a5c3`, kế hoạch gốc `01a1711a-d488-7832-baf8-560e04578494`. Ưu tiên này cập nhật NC-10 và phần docs của NC-02 trong [kế hoạch chung](post-integration-standardization-plan-2026-10-25.md).

**Hoàn tất chỉnh lý, kiểm tài liệu và review độc lập** trên candidateff8a00d; K1–K4 đã đóng. Được commit/push docs sau review. Không sửa app/DB, deploy/migration/live activation, dispatch CI, dựng môi trường hay dọn worktree. Không xóa/chuyển bằng chứng. Chưa nhận chủ dự án đã nghiệm thu hoặc đọc hết tài liệu.

## Nguồn và nơi làm

| Nguồn | Trạng thái kiểm ngày25/10 |
| --- | --- |
| Remote main | `711a22e71983e3d6aa17799649af05ce4c762555`, xác minh bằng ls-remote |
| Remote docs đầu lượt | `2d5806c84bc9cfd4497dbff2830581a14c632ca6` |
| Checkout chỉnh lý | `D:/Workspace/pos-cafe-ui-integration-docs-20261025`, sạch đầu lượt; nhánh `docs-knowledge-cleanup-20261025` từ docs2d5806c |
| Code chỉ đọc | `D:/Workspace/pos-cafe-permission-timeonly-20261022/code`, sạch tại main711a22e |
| Code gốc | `D:/Workspace/pos-cafe`, main5156820,124 tracked changes/429 untracked; không ghi vào |
| Docs gốc | `D:/Workspace/pos-cafe-docs`, docs0fe967d,39 tracked changes/920 untracked; không ghi vào |
| Dung lượng đầu lượt | C192.161.538.048 bytes, D98.723.078.144 bytes trống; không cài/copy/archive lớn |

Các source URLs trong core docs pin main711a22e. Đối chiếu các điểm composition, ports, authority/catalog, lifecycle/query keys, shell/drawer, order/payment/receipt, SQL candidate và package-lock. Không đọc database thật. Khẳng định triển khai mới giới hạn ở source; backend acceptance/deploy vẫn HOLD theo [tích hợp UI](ui-main-docs-integration-2026-10-25.md).

## Kiểm kê và phân loại

Tree docs đầu lượt có **722 files,71.390.723 bytes logical**. Đây là tổng blob HEAD, không phải dung lượng vật lý được thu hồi hay kích thước lịch sử Git.

| Nhóm | Files / bytes logical | Consumer và xử lý |
| --- | --- | --- |
| workflow | 263 / 61.918.234 | Handoff, spec links, manifests/UI evidence; giữ package nguồn, đưa đường đọc task ra index ngắn |
| implementation-log | 171 / 7.198.229 | Phase/release/review dùng để chứng minh kết quả; giữ lịch sử, index không tự nhận baseline cũ là current |
| archive | 77 / 303.440 | Quyết định/spec/audit cũ; giữ để giải thích thiết kế, đánh dấu ảnh lịch sử vắng |
| reviews | 28 / 529.468 | Quyết định và review chống trùng; giữ verdict/nguồn, không biên tập lại kết quả |
| openspec | 148 / 961.480 | Hợp đồng và proposal; phân biệt baseline, WIP, khảo sát và bộ đầy đủ |
| .claude | 12 / 127.588 | Command/schema phục vụ OpenSpec, có consumer công cụ; giữ |
| Core/root còn lại | Phần còn lại của tree | Chỉnh mô tả/nguồn/quy tắc, gộp context trùng thành con trỏ |

OpenSpec:16 capability baseline,34 change không tính archive.7 bộ có đủ bảy loại artifact: chống trùng, owner provisioning, permission redesign, remakeB01/B02/B03 và week03B01/B02. Tooling Stitch đủ6, có ngoại lệ usecases rõ trong proposal.26 change khác chỉ proposal/metadata. Có file không chứng minh đã viết: owner/permission remote vẫn có placeholder test/usecase/traceability. Giữ requirement nguyên văn; thêm nhãn baseline, không điền spec xa lịch để giả “đủ”.

## Nguồn WIP và hòa giải

920 untracked ở docs gốc:660 implementation-log (14.301.585 bytes),91 reviews (496.455),100 workflow (1.270.993),39 openspec files (302.247),19 ui-redesign (1.080.261),10 runbooks (147.554),1 references.md (10.793).918 file không có ở tree xuất bản;2 đường trùng tên nhưng khác nội dung là kế hoạch chuẩn hóa25/10 và handoff Stitch19/10. Số liệu theo filesystem tại lần đọc; không nhận nội dung trùng tên là duplicate đã có thể bỏ.

Đọc diff có mục tiêu ở core, instructions, proposal và handoff liên quan. Các điểm độc nhất phải giữ: bộ quyền15 và bỏ kế toán, owner recovery/PIN, private image gateway, kế hoạch/test/traceability backend, holds/deploy, thiết kế CI/runtime và nguồn tham khảo khóa luận. Những file này **chưa được nhập hàng loạt hoặc nhận thành trạng thái đã phát hành**. Đường nguồn cụ thể: `D:/Workspace/pos-cafe-docs/openspec/changes/redesign-permission-model/`, `docs/implementation-log/permission-backend-web-release-20261023/`, `docs/runbooks/`, `docs/reviews/`, `docs/references.md` tính từ docs gốc. Bước riêng sau chỉnh lý: hòa giải spec/evidence WIP với source và quyết định, review rồi xuất bản đúng phạm vi; giữ bản gốc đến lúc đó.

Ngoại lệ được hòa giải có chủ đích trong lượt này: **hướng dẫn gốc được yêu cầu áp dụng** tại AGENTS.md, SPEC-STANDARD.md, workflow/README.md và templates/start-task. Remote trước đó thiếu bộ workflow chung; lấy bản gốc local làm nguồn quy tắc đang áp dụng, giữ operator exception19/10 trên main. Chỉ sửa starter để phân biệt WIP/ref, không tạo quyền thực thi mới. Hai reviewer kiểm riêng chất lượng nội dung và tính bảo toàn quy trình; không thay đổi bảy artifact hoặc hạ gate review.

## Chỉnh lý đã thực hiện

- README/overview là đường đọc ngắn; context root thành con trỏ, giảm mô tả trùng.
- Kiến trúc/features/data/screens/CLAUDE chuyển mô tả legacy5 quyền/raw repos sang runtime catalog15/projections; source pin, activation ghi riêng.
- Giữ ADR Instant Pay và bất biến K/R1/retained-new/OCC; không xóa quyết định vì cũ.
- Requirements giữ mã FR/NFR; sửa trạng thái/quyền; OpenSpec baseline và bộ permission cũ được gắn nhãn rõ, không sửa expected theo code.
- Testing đứng đầu bằng evidence UI25/10 có source; lịch cũ/phase cũ giữ nguồn riêng. Roadmap/plan cập nhật docs-first, không tự dời hạn hoặc mở refactor.
- Tech stack lấy version từ lockfile; reporting/demo/screenshots/UI context phân biệt source hiện hành và lịch sử.
- [Quy tắc duy trì](../../README.md#quy-tắc-duy-trì) đặt bản chuẩn theo chủ đề, chỉ dẫn operator trên main, tránh checkpoint chắp nối và output tự sinh không có consumer.

## Retention: dữ liệu giữ và lý do

Tất cả đường dưới tương đối với checkout docs đã nêu. Không xóa hoặc di chuyển file/evidence trong lượt này.

| Nhóm đã xác minh | Kích thước / consumer | Quyết định tác giả trong phạm vi giữ nguyên |
| --- | --- | --- |
| `docs/workflow/evidence/week03-b01-b02-20261024/gates/smoke-traces/demo-runbook-kịch-bản-demo-chính-chạy-liền-mạch-qua-14-bước-demo-runbook/trace.zip` |49.620.138 bytes; ZIP1224 entries,61.541.023 bytes uncompressed; manifest.json:1146 | KEEP. Gói lịch sử gắn source; chạy lại tạo trace mới không thay trace gốc. Chưa giải nén hoặc gọi nó là temp |
| Hai `idempotency-manifest.json` dưới `docs/implementation-log/phase-27-release-evidence-2026-09-14/` và `phase-27-timeout-evidence-2026-09-14/` | Mỗi811.944 bytes, SHA256 **khác nhau**; bundle summary/SHA256SUMS và review sử dụng | KEEP. Cùng size không là duplicate; giữ provenance và gate lịch sử |
|27 nhóm blob trùng, tổng phần lặp1.540.030 bytes | Gồm YAML metadata, placeholders và ảnh expected/actual/control; PNG/last-run được manifest/report tham chiếu | KEEP. Vai trò khác nhau hoặc snapshot độc lập; không thay bằng symlink/pointer làm sai verifier |
| Hai `.last-run.json` dưới gates/browser/traces và gates/smoke-traces của cùng package |48bytes mỗi file, manifest:231/1141 | KEEP cùng package; lợi ích48bytes không đáng phá manifest |
| WIP gốc và evidence local trong handoff UI/backend | Có nội dung độc nhất/chưa xuất bản và nghĩa vụ HOLD | KEEP; không thuộc allowlist cleanup |

Không có nhóm đã chứng minh hết consumer/nghĩa vụ để đề nghị xóa ngay. Muốn tách package nhị phân khỏi Git sau này phải xác minh nơi lưu thay thế/quyền truy cập, cập nhật consumer/hash/recipe và xin quyết định đúng danh sách; chưa thực hiện chuyển lưu trữ. Xóa file ở HEAD cũng không giảm lịch sử Git; không rewrite history. Hai cache watcher bị bộ duyệt tự động chặn ở chat trước nằm ngoài phạm vi, không thử cách khác để xóa.

## Kiểm tra và giới hạn

- Baseline quét Markdown:36 relative file links thiếu ở27 files;26 là ảnh/contact sheet archive đã vắng,10 nằm trong bản proposal snapshot frozen `docs/reviews/2026-09-07-idempotency/evidence/2026-09-09-proposal-truoc-bo-spec.md` do lệch một cấp `docs/`. Không sửa snapshot đã dùng làm evidence. Mapping10 link: bỏ phần `docs/` dư trong resolved `docs/docs/...`; các đích thật vẫn có trong `docs/reviews/2026-09-07-idempotency/` và `docs/test-strategy.md`.
-166 liên kết tuyệt đối local trong baseline; nhiều đường thuộc WIP/evidence bên ngoài Git. Kiểm và phân loại, không đổi chúng thành URL public giả. Core mới dùng link tương đối hoặc GitHub source pin; local paths chỉ trong hồ sơ provenance.
- Kiểm final file/anchor, source path/line, OpenSpec artifact preservation, diff whitespace và review ghi ở checkpoint cuối bên dưới. Không HTTP-crawl các URL bên ngoài; source GitHub pin được kiểm qua checkout cùng SHA. Không chạy app suite/CI/backend.

## Review và bàn giao

Candidate chờ hai verdict độc lập. Kiểm tự rà trước review:343 Markdown,1.225 links;0 anchor lỗi,0 source path/line pin thiếu,0 blob drift trong các package raw kiểm.36 link file thiếu đã phân loại lịch sử ở trên;1 thuộc README archive được sửa để thêm cảnh báo, không phải lỗi mới.166 local links,156 không resolve trên máy tại checkpoint; giữ rõ provenance thay vì tạo URL công khai giả. `git diff --check` exit0. Không tuyên bố toàn bộ liên kết web/local đã hoạt động.

Recipe kiểm dùng Python standard library (không cài gói), quét Markdown links/heading anchors, kiểm source pin trên code checkout và git hash-object của raw evidence so docs2d5806c. Script và JSON kết quả giữ ngoài nhánh docs tại `C:/Users/nguye/.codex/visualizations/2026/10/25/01a1722d-2ed2-7610-bd8c-eee18bc8de1f/check_docs.py` và `docs-check-result.json`; baseline `docs-link-baseline.json` cùng thư mục. Đây là bằng chứng kiểm tài liệu, không là công cụ mới trong dự án. `python <đường-dẫn-check_docs.py>` exit0; parser chỉ kiểm cú pháp link Markdown đang dùng, không là browser/HTTP crawl. Review kiểm nội dung/requirement bổ sung.

Checkpoint dung lượng trước review:C192.843.644.928 bytes,D98.720.903.168 bytes trống; không nhận biến động dung lượng hệ thống là lượng thu hồi của task. Reviewer không sửa candidate. Walkthrough tài liệu: đường đọc README → overview/features → architecture/data → testing/limitations → roadmap; đã cung cấp đường đọc, chưa nhận chủ dự án đã đọc/nghiệm thu.


### Vòng review 1 — candidate90b03df1d71033cf1d60108a941611bb5bcc35bf

| Reviewer / phạm vi | Kết quả và giới hạn |
| --- | --- |
| review_knowledge — tri thức core/source/current-vs-history | CHANGES_REQUESTED. Đã đối chiếu ports/catalog/session/payment/RPC, versions/Node engine và tree cf8e304=711a22e; không kiểm backend/HTTP hoặc phát hành |
| review_preservation — workflow/ủy quyền, WIP/spec/evidence, retention, links và NC dependencies | APPROVE. Tự tính inventory/duplicates/ZIP/hash;343Markdown/1225links,0anchor/source-pin/raw-drift;36missing/166local156vắng đúng mô tả. Không deletion/rename,24spec chỉ thêm banner; WIP hiện trạng khớp, không có snapshot trước để reviewer chứng minh độc lập mọi byte chưa từng thay đổi |

| Finding chặn | Sửa trong delta sau90b03df | Trạng thái |
| --- | --- | --- |
| K1 tech-stack:52 gọi RPC legacy là hiện hành | Đổi sang permission identity/register-execute/projections, cập nhật AppPorts/query keys/print boundary và bỏ claim deployment-ready | Chờ review lại |
| K2 features:100–101 nói admin/cashier/requirePermission cũ | Quyền history/void/reprint theo catalog, requireCurrentPermission; nguồn FR05/16/19/20/21 đổi khỏi adapter legacy | Chờ review lại |
| K3 features:64–70 mô tả B03 header/pane/reset lựa chọn cũ | Header vị trí/số đơn/số món, summary trái/cashier phải; sau split selection rỗng. Sửa screens/demo cùng nghĩa, giữ điều kiện initial receipt grant | Chờ review lại |

Delta còn thêm README ở root để GitHub nhánh docs có điểm vào tự hiển thị; context cũ giữ con trỏ tương thích. Self-check delta:344Markdown/1239links,0anchor/source-pin/raw-drift; các missing/local lịch sử không đổi; diff-check exit0. Không chạy app/test backend. Hai reviewer cần xác nhận candidate mới trước xuất bản.


### Vòng review 2 — candidate1e89f408e9aed89c14e59d70c1718cb52a3478c0

review_preservation **APPROVE**, tái kiểm344Markdown/1239links và bảo toàn trong scope. review_knowledge xác nhận K1/K2/K3 đã sửa nhưng **CHANGES_REQUESTED** với K4 chặn: demo-runbook:21/23 vẫn dùng role admin trong luồng hiện hành. Delta tiếp sửa bước12–16 theo quyền/catalog/fixture, checklist bỏ recipe migration012/013 và giữ cloud evidence phase15–20 dưới nhãn lịch sử. K4 chờ reviewer kiểm lại; không tự nhận đóng.


### Kết quả cuối — candidateff8a00d1b98454d3b138c70f6d5cfca358587e44

- **review_knowledge APPROVE** toàn phạm vi core. K1–K4 đóng; runtimeRPC, history/void, B03 và demo khớp source711a22e. Đã kiểm delta cuối, quyền nhân viên/clear-demo; không chạy app/backend hoặc xác nhận thiết bị thật.
- **review_preservation APPROVE** toàn phạm vi quy trình/bảo toàn. Delta giữ nguyên workflow/spec/evidence; cloud evidence lịch sử không bị sửa thành kết quả mới. Không finding mới; các giới hạn WIP và không HTTP-crawl tiếp tục áp dụng.
- Điều phối chạy lại checker:344Markdown/1240links;0anchor lỗi,0pinned-source path/line lỗi,0raw blob drift.36missing lịch sử và166local/156vắng giữ nguyên; diff-check exit0.56file thay đổi so baseline, không deletion/rename. Nhóm core (`docs/*.md`,CLAUDE,context) giảm45.108bytes logical từ233.888 xuống188.780; đây là giảm nội dung trùng/cũ, không là dung lượng ổ/Git thu hồi.
- Remote trước xuất bản vẫn docs2d5806c/main711a22e; dùng push fast-forward thông thường, không force/history rewrite. Code tham chiếu sạch; hai worktree gốc giữ HEAD và số tracked changes124/39. Không có thao tác ghi vào chúng.
- Checkpoint C192.876.818.432bytes,D98.719.600.640bytes trống; không cài môi trường, xóa hoặc chuyển bằng chứng. Bản ghi receipt sau candidate chỉ bổ sung kết quả/status, không sửa claim/expected đã review.

**Bàn giao tiếp:** phần hòa giải/xuất bản WIP được xử lý tại [task25/10](docs-wip-publication-2026-10-25.md); trạng thái WIP chưa xuất bản trong các checkpoint phía trên là lịch sử trước lượt tiếp này. **Còn mở:** nguồn ảnh archive vắng và link local chưa portable; backend/T04/profiles/supplemental acceptance, thiết bị thật và release gates. Không lấy hoàn tất chỉnh lý này để đóng các việc đó hoặc mở NC-04…08. Walkthrough đã cung cấp đường đọc, chủ dự án chưa xác nhận đã đọc/nghiệm thu.
