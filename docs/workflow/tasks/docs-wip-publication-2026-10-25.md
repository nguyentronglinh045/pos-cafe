# Hòa giải và xuất bản spec/evidence WIP — 25/10/2026

## Phạm vi và trạng thái

Chủ dự án giao: “tiếp tục xử lý phần spec/evidence WIP chưa xuất bản trong pos-cafe-docs, đối chiếu rồi đưa nội dung còn cần lên nhánh docs. phần nào nên bỏ thì liệt kê để tôi duyệt, chưa làm refactor.” Đây là task tài liệu, tiếp sau [chỉnh lý core](docs-normalization-2026-10-25.md). Xuất bản không cấp lại các quyền chạy/cleanup/deploy đã hết hạn trong hồ sơ lịch sử.

Candidate đang kiểm và chờ hai review độc lập; chưa ghi nhận là đã xuất bản. Không sửa app/SQL vận hành, chạy backend/CI, refactor, cài môi trường hay xóa dữ liệu. Bản gốc WIP giữ nguyên.

| Nguồn | Mốc khóa đầu lượt |
| --- | --- |
| Remote docs | `4e70d0ccafb28d556a4d5d8e529a3560f9a99402` |
| Remote/main chỉ đọc | `711a22e71983e3d6aa17799649af05ce4c762555`; code ở `D:/Workspace/pos-cafe-permission-timeonly-20261022/code` |
| Nguồn WIP | `D:/Workspace/pos-cafe-docs`, local docs `0fe967d554cecfa7e0cb58d6efa01d64941439ff`; 39 tracked changes, 920 untracked |
| Checkout thực hiện | `D:/Workspace/pos-cafe-ui-integration-docs-20261025`, nhánh `docs-knowledge-cleanup-20261025`, sạch đầu lượt |
| Dung lượng Windows đầu lượt | C192.884.674.560 bytes, D98.718.982.144 bytes trống; dữ liệu nguồn33.694.315 bytes, dự kiến tăng dưới100MB gồm Git; không cài gói |

## Đọc nội dung đã hòa giải

- [Permission15: proposal và quyết định](../../../openspec/changes/redesign-permission-model/proposal.md), [use cases](../../../openspec/changes/redesign-permission-model/usecases.md), [test plan](../../../openspec/changes/redesign-permission-model/testplan.md), [traceability](../../../openspec/changes/redesign-permission-model/traceability.md).
- [Forced PIN](../../../openspec/changes/force-default-pin-change/proposal.md), [CI](../../../openspec/changes/setup-project-ci-cd/proposal.md), [bounded iterations](../../../openspec/changes/bound-permission-test-iterations/proposal.md), [staging](../../../openspec/changes/use-supabase-staging-for-permission-tests/proposal.md), [provider guard](../../../openspec/changes/permission-provider-capability-guard/proposal.md).
- [Tích hợp permission24/10](permission-main-integration-2026-10-24.md) → [tích hợp UI25/10](ui-main-docs-integration-2026-10-25.md) xác định source hiện hành. [Backend/web23/10](permission-backend-web-release-2026-10-23.md) giữ FAIL, spent counters và các profile chưa chạy.
- [Danh mục toàn bộ hồ sơ nhập](../evidence/docs-wip-publication-20261025/catalog.md), [inventory từng file/hash/quyết định xử lý](../evidence/docs-wip-publication-20261025/inventory.json), [runbooks lịch sử](../../runbooks/README.md), [nguồn học thuật đề xuất](../../references.md).

Không buộc người đọc đi qua toàn bộ checkpoint để hiểu hiện trạng: các trang core vẫn là đường đọc chính; danh mục này dành cho truy vết.

## Quyết định hòa giải

959 đường WIP gồm39 tracked changes và920 untracked,18.746.319 bytes. Có thêm497 file đã commit ở local docs nhưng vắng trên remote,14.947.996 bytes: predecessor receipts, bootstrap/source snapshots, review và artifact của cùng bộ spec. Giữ chúng để dependency của hồ sơ không bị đứt chỉ vì file không mang cờ untracked.

| Xử lý | Số đường nguồn | Ý nghĩa |
| --- | ---: | --- |
| Giữ byte gốc khi xuất bản | 1.363 | Evidence, lịch sử review/handoff, proposals không bị biên tập lại; inventory có SHA256 gốc và đích |
| Giữ toàn bộ nội dung, thêm banner trạng thái | 76 | 66 artifact Markdown OpenSpec và10 runbook; không đổi SHALL/expected/verdict để hợp thức hóa code |
| Giữ bản đã chỉnh lý trên docs | 17 | Core/index/instructions và2 handoff trùng tên; không chép snapshot cũ đè bản25/10 |

1.439 đường được nhập/thay thế,33.363.160 bytes sau banner; số này chưa gồm chỉ mục/manifest do task tạo. `publish-exact` dùng thuộc tính Git `-text` theo đúng đường để giữ CRLF và hash khi checkout. Chỉ các snapshot/source patch nằm trong package evidence được giữ để tái hiện candidate đã kiểm; chúng không phải bộ source/tool thứ hai được duy trì trên docs và không được thực thi từ đây.

### Yêu cầu, code và nghiệm thu không thay thế nhau

| Chủ đề | Cách đối chiếu / kết luận xuất bản |
| --- | --- |
| Permission15, bỏ Kế toán | WIP có Q1–Q15 và quyết định15/09 trong [review11](../../reviews/2026-09-14-permission-model/11-bo-ke-toan-chuan-bi-t02-2026-09-15.md). [Catalog main:5](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/core/permissionCatalog.ts#L5) kiểm15 quyền/5 role/4 role bật. Thay bản remote14 quyền và placeholder bằng bộ đã có quyết định; không sửa spec để chạy theo code |
| PIN/recovery | [Identity:13](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-identity.sql#L13) và [PasscodeScreen:42](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/app/screens/PasscodeScreen.tsx#L42) có trạng thái forced-PIN. Câu “chưa hiện thực” tháng9 là lịch sử. PASS source25/31/58 không là full PIN19/PERM60 trên main711a22e; owner email/recovery tự phục vụ chưa được chứng minh |
| A18 → D19 → M24 | Giữ nguyên quyết định/giới hạn ở hồ sơ gốc. M24 chỉ đổi điều kiện tích hợp mã trước backend acceptance; không mở functional deployment, xóa FAIL hay miễn35stages/760 identities và supplemental obligations. T04/bảy profile vẫn DEFERRED/NOT_ACCEPTED |
| CI/data mode | Quyết định cấu hình Preview23/10 là hợp đồng release. [Runtime resolver:16](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/app/runtimePorts.ts#L16) chọn explicit mode; khi thiếu mode, URL+key dẫn đến Supabase. Không đọc câu “mặc định mock” của cấu hình deployment thành quy luật mọi môi trường |
| Tối ưu store data | Giữ kế hoạch15/09, quyền cho lôA và câu hỏi ngưỡng/lịch/ranh giới còn mở. Ước lượng cũ chưa là số đo runtime mới; chưa triển khai toàn change trong task này |
| Modifier realtime | Khảo sát cũ nói chưa có publication cần đính chính: [migration008:64](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/008_modifier_rework.sql#L64) đã thêm bảng nối; [signal adapter:65](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/adapters/supabase/permissionSignalPort.ts#L65) dùng signal tables. Giữ ý định đồng bộ, không mở việc thêm raw subscription từ proposal cũ |
| UI / backlog / học thuật | UI hướngA15/09 là lịch sử trước B01–B03. Điện tử/bếp là khảo sát; chuyển/gộp bàn và giảm giá đã vào kế hoạch nhưng chưa có đầy đủ quyết định nghiệp vụ. references.md vẫn là danh mục đề xuất chưa đối chiếu bản in/trang/trích dẫn |
| Runbook và grant | Mười runbook có banner snapshot. Hướng dẫn đi cùng công cụ thuộc main; không biến grant, cutoff hoặc câu hỏi đã hết thời hạn trong log thành quyền mới |

### Vì sao giữ core/index mới hơn

17 đường `reconciled-keep-published` được liệt kê đủ trong inventory. Các hướng dẫn AGENTS/workflow đã được hòa giải ở task trước; CLAUDE/architecture/data/features/testing/roadmap/UI context hiện đã theo main711a22e. Unique decisions trong diff cũ được giữ tại bộ permission/Q5–Q15/N01–N03, forced-PIN, các review và proposal tương ứng; bổ sung đường đọc vào limitations/report-source-map thay vì trả core về trạng thái tháng9. Các chỉ mục WIP dài được thay bằng catalog lịch sử riêng.

Hai handoff trùng tên `post-integration-standardization-plan-2026-10-25.md` và `stitch-ui-remake-workflow-2026-10-19.md` giữ bản published đã có kết quả tích hợp/operator boundary. Chi tiết truy hồi palette/quyết định của Stitch được giữ thêm trong [snapshot nguyên byte](stitch-ui-remake-workflow-2026-10-19-history.md), vì bản handoff ngắn không chứa hết. Bản local chưa xóa. Không coi khác nội dung là duplicate byte hay được phép bỏ.

## Retention và danh sách chờ duyệt

**Chưa xóa, reset, stash, di chuyển hoặc dọn worktree gốc.** Danh sách dưới đề xuất bỏ bản local lặp sau xuất bản, không bỏ nội dung khỏi hồ sơ dự án.

| Nhóm original untracked có bản xuất bản byte-identical | Files | Bytes logical |
| --- | ---: | ---: |
| `D:/Workspace/pos-cafe-docs/docs/implementation-log/` | 660 | 14.301.585 |
| `D:/Workspace/pos-cafe-docs/docs/reviews/` | 91 | 496.455 |
| `D:/Workspace/pos-cafe-docs/docs/workflow/` | 98 | 1.215.694 |
| `D:/Workspace/pos-cafe-docs/docs/ui-redesign/` | 19 | 1.080.261 |
| `D:/Workspace/pos-cafe-docs/docs/references.md` | 1 | 10.793 |
| `D:/Workspace/pos-cafe-docs/openspec/changes/` — chỉ8 metadata YAML trong allowlist | 8 | 337 |
| Tổng | **877** | **17.105.125** |

[Allowlist đầy đủ, đường tuyệt đối và SHA256](../evidence/docs-wip-publication-20261025/cleanup-proposal.json). Chỉ xét dọn sau khi remote chứa đúng byte và người dùng duyệt. Trước dọn phải kiểm lại file không đổi, consumer và tình trạng worktree; cần đồng bộ worktree về docs mới để không làm hỏng đường đọc của bản WIP cũ. Không xóa cả các thư mục trong bảng; nhiều file tracked/độc nhất nằm chung đó. Tác động: mất bản untracked local ở đường cũ; bản canonical vẫn ở Git/checkout mới, cần checkout lại để đọc tại worktree cũ. Đây là tổng kích thước file logic, chưa đo allocation NTFS, không phải dung lượng cam kết thu hồi; Git history không giảm.

**Giữ, không đề nghị loại khỏi docs:** FAIL/checkpoint cũ, manifest và source snapshot; ảnh expected/actual thuộc các run khác nhau;8 ZIP PIN UI tổng532.160 bytes dù4 entry trong mỗi ZIP khớp bản giải nén, vì archiveSHA được receipt/index tham chiếu và các ZIP không cùng hash. Coverage HTML giữ chi tiết line/branch mà summary không thay thế được. Không xóa chỉ vì có thể chạy lại: lần chạy mới không khôi phục kết quả lịch sử. Các76 bản có banner và17 đường hòa giải không nằm trong allowlist exact-copy.

## Kiểm tra và review

Checkpoint trước freeze:1.456 đường nguồn hash/size khớp inventory,1.439 bản nhập giữ đúng byte gốc hoặc nguyên byte phía sau banner; snapshot Stitch bổ sung cũng khớp byte. Mọi JSON nhập parse được,8ZIP CRC đạt. Quét credential text độc lập không phát hiện JWT/private key/token/credential-DSN; reviewer xem62 PNG độc nhất phủ92 ảnh theo hash, không thấy credential thô. Đây là kiểm phạm vi gói, không là chứng nhận bảo mật toàn hệ thống. Không sửa các trường visualReview NOT_RUN/PENDING của manifest cũ; review ảnh lần này là bản ghi riêng.

Checker tài liệu tại checkpoint:854 Markdown/7.948 links,0anchor lỗi/0pinned-source path-line lỗi/0raw blob drift so docs4e70d0c.175 đích strict-parser báo thiếu đã phân loại trong [link audit](../evidence/docs-wip-publication-20261025/link-audit.json):102 tham chiếu dòng/bối cảnh đường dẫn cũ,35 local /D:,12 snapshot relative context và26 ảnh archive đã vắng từ trước. Secondary resolver tìm được đích của149 tham chiếu, không chứng minh dòng lịch sử còn cùng nghĩa hoặc link chạy trên GitHub.3.156 absolute local links giữ provenance, chưa portable; không nhận tất cả liên kết hoạt động. Link mới trong banner/catalog/handoff được kiểm riêng. Không HTTP crawl.

`git diff --check` trước stage phát hiện1 blank-at-EOF vốn có trong source access-control; giữ để không sửa nguyên văn spec. Thuộc tính cr-at-eol chỉ nhận diện CRLF, vẫn giữ kiểm trailing whitespace khác. Toàn staged có776 chẩn đoán whitespace trong73 file nhập nguyên văn/source snapshot, đều thuộc nội dung nguồn được giữ. Không sửa log/patch/raw để làm check xanh. Kiểm riêng18 file tác giả mới/điều hướng exit0; không gọi toàn staged --check PASS. [Verification receipt](../evidence/docs-wip-publication-20261025/verification.json) ghi số đếm và danh sách. Script kiểm dùng Python standard library tại `C:/Users/nguye/.codex/visualizations/2026/10/25/01a1722d-2ed2-7610-bd8c-eee18bc8de1f/check_wip_docs.py`; JSON kết quả cùng thư mục. Đây là công cụ QA ngoài repo, không thêm runner ứng dụng. Không chạy app/backend/CI hoặc kiểm lại các dịch vụ online. Local absolute paths trong lịch sử vẫn là provenance, không được đổi thành URL công khai giả. Link raw/frozen lỗi từ trước được phân loại và giữ nguyên snapshot; catalog/handoff mới phải có link đúng.

Review độc lập theo AGENTS/workflow: `review_knowledge` kiểm requirement/quyết định/trạng thái/source; `review_preservation` kiểm provenance, privacy, retention và byte-preservation. Cả hai chỉ đọc, candidate cuối phải có hai APPROVE trước push. Walkthrough tài liệu đã có đường đọc ở trên; chưa nhận chủ dự án đã đọc/nghiệm thu.

## Việc còn mở

Người dùng duyệt hay từ chối allowlist dọn bản lặp; nếu được duyệt vẫn cần kiểm an toàn và đồng bộ worktree riêng. Backend T04/bảy profile/supplemental acceptance, deploy, actual devices và bước refactor chưa mở trong task này. Baseline16 capability chưa apply/archive đầy đủ delta; owner-email và các proposal chưa hoàn thiện không được nhận là xong vì đã xuất bản file.

### Review vòng1 — candidate9f93b935b9624b794c748cc811a37e27e0b22a63

| Reviewer | Verdict / phạm vi / giới hạn |
| --- | --- |
| review_knowledge | CHANGES_REQUESTED với W1 chặn: project-overview:25 và requirements:3 còn mô tả bộ spec chưa nhập. Phần còn lại đạt: A18/D19/M24, PIN/PERM source, optimizer/backlog, staging/budget, runbook; tự kiểm76 banner giữ nguyên toàn nội dung nguồn. Không xác nhận lại runtime/privacy toàn gói/online |
| review_preservation | APPROVE scope provenance/privacy/retention/links/quyền. Tự kiểm1.456 nguồn,1.439 bản nhập/Git bytes,Stitch snapshot,877 cleanup candidates,62ảnh,8ZIP,149resolved context/26archive thiếu,776whitespace/73file nguồn. Tại freeze854MD/7947links; đề nghị cập nhật receipt cuối và sửa dấu+ thừa. Không bao phủ delta sửa sau9f93b935 |

Delta vòng2 sửa W1 tại hai trang core, ghi rõ baseline capability chưa apply và backend HOLD; bỏ dấu+ thừa, cập nhật checkpoint7948links và metadata review. Không đổi requirement, raw evidence hoặc allowlist. W1 chờ reviewer xác nhận trên commit delta; không tự nhận đã đóng. Kiểm diff delta exit0.
