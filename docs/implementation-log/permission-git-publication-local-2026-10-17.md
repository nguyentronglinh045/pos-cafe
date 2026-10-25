# Gói minh chứng Git đã chọn và kế hoạch commit local — 17/10/2026

## Phạm vi và quyền

Owner giao: “Tiếp tục chốt gói file, kế hoạch commit và nhánh ở local để push minh chứng… Chưa push, chạy CI, sửa database hay deploy.” Lượt này đóng băng source export, chốt từng file và kế hoạch thực hiện; **chưa tạo worktree/nhánh, stage, commit hoặc push**. Không thay application code, xóa dữ liệu hay gọi lại probe PostgreSQL. Không cần quyết định nghiệp vụ mới để chốt phần chuẩn bị này.

Mốc minh chứng ghi nhận phần đã làm và giới hạn còn lại; trạng thái phát hành vẫn **NOT_READY_FOR_DEPLOY**. Giữ Tailwind 3 và quyết định owner bỏ qua advisory thuộc chuỗi Tailwind 3; không nhận đã vá advisory hoặc nâng Tailwind 4.

## Gói file đã đóng băng

Nguồn local: code HEAD `5156820f7d6679cd6f8051bdc38419737ffa0c7e`; docs HEAD `e47862b1dfed68d783dc07a2a1fd51ecdabc1b19`. Capture lúc `2026-10-17T01:51:22.521Z`: main có 510 dirty entries, docs 380; cả hai có 0 staged paths. Remote được đọc lại: main trùng local, docs ở `132e9d6cc065459031ee92cfbafcd423b5ac81c5`; hai tên nhánh đề xuất chưa có ở remote tại lần đọc.

| Gói | Entries chọn | File hiện hữu | Deletion | Vai trò |
| --- | ---: | ---: | ---: | --- |
| Code | 509 | 507 | 2 | Source phân quyền/PIN, adapters/ports/lifecycle, SQL/Edge candidate, tests và công cụ kiểm chứng |
| Docs | 333 | 333 | 0 | Spec, quyết định, runbook, tiến độ và bằng chứng đã lọc |
| Tổng | 842 | 840 | 2 | 8.267.924 bytes source text; không phải runtime/package |

Code gồm 209 entries dưới `src`, 125 dưới `tests`, 101 dưới `scripts`, 15 dưới `supabase`, 11 dưới `ui-audit`, 1 dưới `operator` và 47 manifest/lock/config cấp gốc. Giữ npm manifest + `package-lock.json` cùng source; `pnpm-lock.yaml` giữ ngoài mốc này, không xóa hoặc đổi package manager.

Hai deletion **là thay đổi chức năng đã có**, không phải temp: `src/features/integration/useRealtimeInvalidation.ts` và test tương ứng. Chúng đi cùng replacement/wiring `PermissionLifecycle`, ports và tests. Kế hoạch chỉ áp dụng deletion trong worktree minh chứng mới khi được giao thực hiện; checkout gốc hiện không bị tác động.

Docs = 319 INCLUDE trước + 9 HOLD đã giải quyết + 5 biên bản milestone/Preview OFF sau freeze trước. Trong 22 docs HOLD trước: 6 lấy toàn bộ, 3 lấy bản chọn lọc, 13 giữ ngoài mốc. Thêm 2 file đã INCLUDE nhưng có nội dung trộn cũng dùng bản chọn lọc. Năm bản chọn lọc:

- `docs/roadmap.md`
- `docs/workflow/tasks/README.md`
- `openspec/README.md`
- `docs/limitations.md`
- `openspec/changes/redesign-permission-model/testplan.md`

Chỉ bỏ delta của đề xuất độc lập (menu subscription, redesign, chuyển/gộp bàn, giảm giá thủ công, e-payment, kitchen, tối ưu tải dữ liệu và lịch sử incident không phụ thuộc). Giữ nội dung nền HEAD, yêu cầu phân quyền/PIN và gate hiện có; TC-PERM29 không giảm acceptance. Một link tới proposal deferred chưa xuất bản được đổi thành path văn bản kèm ghi chú, không nhận proposal đã hoàn thành. Sáu file lấy toàn bộ chứa index/bibliography/rubric cần cho link và báo cáo, không mở thêm implementation scope. Bản gốc cả năm file giữ nguyên.

**48 dirty deltas ngoài gói** = 1 pnpm lock + 47 docs. Đây không phải danh sách được phép xóa; toàn bộ delta gốc và nội dung nền HEAD vẫn giữ. `.tmp` logs/PLAN đã phân loại ngoài payload ở lượt trước cũng giữ nguyên; không cần dọn để làm commit. Không đưa actual `.env`, credential/private inputs, runtime, backup Supabase, raw output nhạy cảm, cache, dependencies, dist hoặc toàn cây `artifacts` vào gói.

Manifest đầy đủ từng file, SHA raw, mode/Git blob, loại ADD/MODIFY/DELETE, nguồn bản chọn lọc và 48 lý do loại:

- [Manifest JSON](D:/Workspace/pos-cafe/artifacts/permission-git-publication-local-20261017/payload-manifest.json)
- [Danh sách dễ đọc TSV](D:/Workspace/pos-cafe/artifacts/permission-git-publication-local-20261017/payload-files.tsv)
- [Quyết định docs HOLD](D:/Workspace/pos-cafe/artifacts/permission-git-publication-local-20261017/docs-scout/hold-decisions.tsv)
- [Mapping năm bản chọn lọc](D:/Workspace/pos-cafe/artifacts/permission-git-publication-local-20261017/docs-scout/prepared-mapping.tsv)

Source export thật nằm ở `D:/Workspace/pos-cafe/artifacts/permission-git-publication-local-20261017/payload/{main,docs}`. Đây là bản bytes đóng băng để review/áp dụng sau, không phải thêm một môi trường kiểm thử. Không stage trực tiếp từ các file docs trộn ở checkout gốc.

## Hai commit và nhánh dự kiến

Giữ tên đã đề xuất ngày 16/10 để nối với hồ sơ trước; ngày trong tên nhánh là mốc minh chứng, không phải ngày đã push.

| Nhánh chưa tạo | Parent | Commit mới dự kiến | Expected Git tree |
| --- | --- | --- | --- |
| `evidence/permission-20261016` | `5156820f7d6679cd6f8051bdc38419737ffa0c7e` | `feat(permissions): add catalog and enforcement` | `50fe1d4fcdd5563a8cdbe794c7035a22c148b574` |
| `evidence/permission-docs-20261016` | `e47862b1dfed68d783dc07a2a1fd51ecdabc1b19` | `docs(permissions): record specs and verified progress` | `bc4027fe7daa4e62dc95e165162c2bc480645a7a` |

Đây là **hai commit mới dự kiến**, chưa có commit SHA. Nhánh docs còn mang theo hai commit workflow local đã tồn tại `9937f1f005f1569b0e348374b37cc95d8b490ca5` và `e47862b1dfed68d783dc07a2a1fd51ecdabc1b19` (24 path lịch sử); nếu push sau này sẽ có tổng ba commit chưa có trên remote docs. Không squash hoặc viết lại chúng trong kế hoạch này.

Git hiện `core.autocrlf=true`, không tìm thấy custom attributes/filter, active hook hoặc cấu hình commit signing ở checkpoint; author đã cấu hình email GitHub noreply, không lưu giá trị email. 126 file có raw worktree bytes khác Git blob do chuyển đổi Git. Expected tree được tính từ baseline HEAD + blob OID thực bằng `git hash-object --path=... --stdin` **không có `-w`**; dựng lại hai cây baseline khớp cây HEAD trước khi áp dụng delta. Không ghi Git object/index/ref. Cách hash có chuyển đổi theo path được mô tả trong [Git hash-object](https://git-scm.com/docs/git-hash-object).

[Kế hoạch máy đọc](D:/Workspace/pos-cafe/artifacts/permission-git-publication-local-20261017/commit-plan.json) và hai file commit message chứa đầy đủ allowlist, deletion hashes, parents, trees, preflight và refspec. Chưa chạy recipe sau:

1. Khi owner giao thực hiện local, kiểm lại hashes của export, HEAD/index gốc, remote bases/nhánh trùng tên, config/attributes/hooks/signing/author và dung lượng. Bất kỳ thay đổi ngoài giả định thì dừng phần liên quan.
2. Dùng `git worktree add -b` bình thường từ đúng parent vào `D:/Workspace/pos-cafe-evidence-code` và `D:/Workspace/pos-cafe-evidence-docs` (hiện chưa tồn tại), không switch/reset/stash checkout gốc. [Git worktree](https://git-scm.com/docs/git-worktree) mô tả worktree riêng trên cùng repository.
3. Copy đúng từng file trong frozen manifest vào worktree tương ứng; so SHA raw. Trong worktree code, xác minh đúng hai baseline deletion hashes rồi `git rm` đúng hai path đó. Không copy runtime hoặc thư mục theo wildcard.
4. Stage bằng literal NUL allowlist `main-existing-paths.nul` (507 path) / `docs-existing-paths.nul` (333 path), không dùng `git add .`. Đối chiếu toàn bộ staged path/mode/blob và `git write-tree` với expected tree trong bảng. Hai deletion đã stage bằng `git rm`, không đưa lại vào existing-path list.
5. Commit bình thường bằng `git commit --file` với message đã chuẩn bị, giữ hook/signing nếu cấu hình được owner chấp nhận ở preflight; không dùng `commit-tree` hoặc tự vô hiệu bảo vệ. Kiểm parent/tree commit và HEAD/index checkout gốc không đổi, ghi SHA thật cho owner review.
6. Push cần lệnh riêng sau khi review commit cụ thể. Trước đó đọc lại Preview Branch Tracking OFF ở đúng project Vercel và trigger/ref đã biết. Không tự push main/docs, `--all`, `--mirror`, force hoặc tags. Chỉ hai refspec minh chứng đã ghi trong plan mới thuộc đề xuất.

Nhắc merge: **sau khi đủ gate phát hành và có lệnh owner, merge nhánh code minh chứng về main**. Nhánh docs minh chứng giữ luồng tài liệu riêng; **không merge docs vào main**. Không tự bật lại Preview hoặc dọn worktree sau đó.

## Kiểm tra đã làm và giới hạn kết luận

Privacy scout đọc đúng 840 source text đã chọn và 44 blob/24 path trong hai commit docs local nói trên: không còn finding cụ thể về secret/PII bị giữ lại. 321 lexical flags được phân loại là fixture/default PIN khai báo, dữ liệu test, message, template/env-reference hoặc triage cũ đúng hash. Không in literal bí mật. Đây là kiểm nội dung có phạm vi, không phải audit bảo mật toàn ứng dụng/toàn lịch sử và không bảo đảm tìm mọi dạng secret.

Docs link audit: 333 docs, 332 Markdown; 0 missing doc target trong inline local/relative links đã kiểm. Không kiểm external URL/anchor/reference-style link và không nhận local provenance links/raw files thành nội dung đã công khai. [Kết quả privacy](D:/Workspace/pos-cafe/artifacts/permission-git-publication-local-20261017/privacy-scout/scoped-publication-content-report.md), [link audit](D:/Workspace/pos-cafe/artifacts/permission-git-publication-local-20261017/docs-scout/final-docs-link-audit.json).

Lượt này không chạy lại application tests. Báo cáo công khai đã chọn ghi đúng kiểm thử Windows lịch sử: 1.173 unit, 489 tooling, hai typecheck/build mock PASS; smoke 44 PASS/37 viewport skip đã giải thích, UI selftest 23 và 6 baseline false positives/0 mới. Không nhận các kết quả đó là full backend/Linux/online acceptance. CI-1 local 33 Node PASS có gồm 15 ca cũ, chưa chạy CI-1 thật. Nguồn app ở mốc capture không đổi so với selection trước; Git canonicalization không được coi là test suite mới.

Supabase hiện có một actor/scope metadata probe lịch sử PASS 79 stores/145 Auth IDs/3 Storage metadata, TLS READ ONLY/rollback/close. Quyền invocation đó đã dùng. Nó **không chứng minh schema/contract2 hay database tương thích code mới**. Full backend gates, certified hosted profile/control, backup/recovery, cutover, Edge/Storage/Realtime và environment còn cần hoàn tất trước production. Không chạy SQL/probe mới ở lượt này.

Preview Branch Tracking đã Save/reload OFF ngày 16/10 theo quyền riêng, có biên bản/review trong payload. Ngày 17/10 chỉ chuẩn bị local; chưa đọc lại setting Vercel. OFF không chặn main/manual/API deployment hay tự chứng minh mọi provider không có automation. Trước eventual push phải kiểm lại trạng thái đúng project; giữ OFF đến lệnh bật lại.

## Tài nguyên, review và handoff

Source/export/helper/review lượt này nằm trên D:/Workspace, giới hạn vận hành **24 MiB logical**; không cài/tải gói, không dùng credential hoặc runtime riêng, không thêm môi trường nặng. Git hash tối đa 8 process đồng thời tận dụng CPU; Node heap 256 MiB. Đây không phải quota OS.

Hai worktree nhẹ ở bước tương lai dự kiến tổng tăng 35–70 MiB, đỉnh dự trù **128 MiB** trên D (không dependencies). Căn cứ: hai HEAD tổng18,97MB + export8,27MB và dự trữ objects/pack/temp; phải đo lại trước khi tạo, giữ C/D trống ít nhất30GiB và tổng task trong20GiB. Chưa tạo chúng, không nhận 128MiB là disk quota kỹ thuật. Không xóa temp trong lượt này.

Candidate cuối bind source export thật, manifest/tree/plan/messages/allowlists, hồ sơ scope/privacy và bản report này. Hai reviewer độc lập SEC/EVC phải APPROVE exact candidate trước handoff hoàn tất. Walkthrough cho owner: 509 code → 333 docs/5 bản chọn lọc → fixture/privacy → tree/parent/2 commit mới → giới hạn test/DB → Preview OFF → merge code về main. Chưa nhận owner đã xem hoặc nghiệm thu walkthrough.

**Các hồ sơ vận hành ngày17 này, review mới và closeout giữ local ngoài payload 842 entries của lần minh chứng đầu.** Gói đã đóng băng không tự mở rộng sau mỗi review/hash; manifest/840 source copies là ranh giới. Metadata task-index bổ sung sau freeze cũng ngoài payload, không làm thay bản docs chọn lọc đã đóng băng. Có thể bổ sung hồ sơ này bằng một commit docs sau nếu owner yêu cầu; không tự thêm vào hai expected trees đã chốt.

Handoff: hoàn tất sau review và recheck; bước tiếp theo khi owner giao là thực hiện đúng hai commit local từ gói này rồi trình SHA/diff thật. Chưa có lệnh push/CI/DB write/deploy, không diễn giải kế hoạch hoặc review thành quyền đó.


### Metadata review cuối — gói local đã chốt, chưa tạo commit

SEC và EVC cùng APPROVE exact candidate `abbad7c6d1a77808ccea99076b62bf4667528fd25359cd81462c7cf6c0f0f889`; không còn finding chặn trong phạm vi chuẩn bị/kế hoạch. [SEC](permission-git-publication-local-sec-review-2026-10-17.md), [EVC](permission-git-publication-local-evc-review-2026-10-17.md). Hai reviewer kiểm trực tiếp frozen source; EVC tính lại hai trees khớp. Root kiểm56snapshots/840source+input+original:0drift, HEAD/index hai checkout giữ nguyên,0staged, tên nhánh local không đổi. Không chạy lại app tests, không branch/stage/commit/push/CI/DB/provider/deploy/delete.

[Handoff](../workflow/tasks/permission-git-publication-local-2026-10-17.md) và [closeout local](D:/Workspace/pos-cafe/artifacts/permission-git-publication-local-20261017/closeout.json) lưu bằng chứng/candidate/review hashes. Metadata này cùng handoff/reviews mới ở ngoài842entries; source export và expected trees không đổi. Bước kế tiếp khi được giao là tạo hai commit local, trình SHA/diff thật; quyền push vẫn riêng.
