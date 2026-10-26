# N4 — Hòa giải yêu cầu dữ liệu mẫu và khóa cửa hàng

> **Cập nhật phạm vi xuất bản26/10:** chủ dự án đã giao kiểm cuối với subagent rồi push gói N3–N5 tại [handoff N5](docs-test-traceability-2026-10-26.md). Các câu “chưa push/chưa giao N5” và receipt bên dưới giữ bối cảnh checkpoint trước đó; không phải giới hạn ủy quyền hiện tại.

Ngày26/10/2026. [Đối chiếu hiện trạng](../../spec-reconciliation.md#r06-detail) · [Quyết định hiện hành](../../spec-reconciliation.md#r06-decisions) · [Evidence khảo sát](../../implementation-log/requirements-reconciliation-20261026/README.md).

## Phạm vi và nguồn quyền

Lượt khảo sát bắt đầu từ xác nhận “ok tiến hành đi” của chủ dự án cho N4. Sau khi xem kết quả và hỏi đề xuất, chủ dự án đồng ý: giữ docs đúng thực tế, sửa/bổ sung lại khi triển khai sau. Đây là xác nhận ba hướng xử lý đã trình bày: chấp nhận vị trí retry hiện hành; hoãn reseed sau xóa; giữ khóa cửa hàng để hoàn thiện trong G04. Chỉ ghi quyết định và cập nhật docs; không sửa code/DB, refactor, chạy nghiệp vụ, hoàn thiện trước owner G05/G06 hoặc push phần mới.

Base lượt ghi quyết định `d89c85066ad4eb76134efd774478150e2e3b6355`; khảo sát trước đó dựa trên docs669a271 và code main`711a22e71983e3d6aa17799649af05ce4c762555`. Local main HEAD`5156820f7d6679cd6f8051bdc38419737ffa0c7e`/WIP giữ nguyên; index riêng, không switch/reset/stash/clean hoặc tạo docs worktree. N3/N4 chưa push; phần2 đã xuất bản tại d75e41ec40a3287da054b023594fb087d412d983.

## Kết quả và phần còn lại

- R06-A đã chốt vị trí thông báo chung; sửa đúng scenario PERM-23, giữ normal owner, explicit retry, receipts và bảo toàn dữ liệu/PIN.
- R06-B hoãn khỏi phạm vi triển khai hiện tại, chưa đáp ứng. Baseline store-settings giữ nguyên phần thân và có chú thích quyết định; không đổi clear thành reseed hoặc nhận FR-20 phần này đã xong.
- R06-C giữ yêu cầu, định hướng server + UI trong G04; còn tác nhân khóa/mở, phạm vi chặn, phiên đang dùng và khôi phục. Chưa có contract đủ để triển khai hoặc kết quả khóa app/DB.
- G05/G06 vẫn planned; usecases/testplan/traceability còn “Chưa viết” và chỉ bổ sung khi change được chọn.

[Bảng quyết định chính](../../spec-reconciliation.md#r06-decisions) giữ lý do, phương án khác và phạm vi thay thế; chỉ mục quyết định/requirements/features/limitations/baseline banners cùng trỏ tới đó. Không tạo bộ quyết định cạnh tranh hoặc apply/archive change.

## Kiểm nguồn và trạng thái

Không gọi lại MCP/DB trong lượt ghi quyết định. Metadata khảo sát trước đó (14 body function/overload) giữ nguyên bytes và giới hạn: chỉ SELECT catalog; target dựa trên comment marker staging, không có xác thực provider độc lập; không test bypass/deny/runtime. Không nhận evidence cũ thành lượt kiểm mới.

Kiểm lần này: diff-check, link/anchor, tham chiếu source, bảo toàn evidence và phần thân baseline, đúng một scenario PERM-23 đổi vị trí, trạng thái/chỉ mục nhất quán. Hai reviewer kiểm semantics/phạm vi và preservation/authority trước commit; receipt sau review ghi candidate/hash/verdict. Chưa kiểm sản phẩm hoặc tạo môi trường.

Checklist `D:/Workspace/pos-cafe-docs-priorities.local.md` nằm ngoài Git. Đã hoàn tất đối chiếu và ghi hướng xử lý; N4 tổng thể tiếp tục mở cho phần đặc tả khi triển khai, đặc biệt R06-C. N5, owner artifacts, P1-03 và H1–H4 không đóng. Chưa giao thêm N5 trong lượt này.

## Bước tiếp theo

Khi được giao triển khai một phần, làm rõ chi tiết còn thiếu, bổ sung spec/usecase/testplan và cập nhật docs theo source/DB/kết quả thực tế; không nâng planned/deferred thành đã làm. N5 có thể kiểm kê requirement → TC → evidence độc lập khi được giao. Không cần hỏi lại ba hướng đã được xác nhận; chỉ mở câu hỏi chi tiết chưa chốt hoặc có bằng chứng mới làm đổi phạm vi.

## Checkpoint trước xác nhận — lịch sử

Receipt bên dưới ghi đúng trạng thái khảo sát trước khi chủ dự án chốt hướng xử lý. Các câu “chờ quyết định” thuộc checkpoint này; trạng thái hiện hành ở phần đầu tài liệu và bảng quyết định.

## Receipt kiểm và review — 26/10/2026

Candidate được cả hai reviewer kiểm: `76add012358c2394fe0678d2e2cc4b8ea32d4e15`, base `669a27158032d585bef986be2145d6fc8d26a412`. Checklist candidate SHA256 `d155e6e3ccf3c6443d79e2935c1cdc902a639de05ea0174918b272577bcba478`; file ở ngoài Git.

| Reviewer / trọng tâm | Kiểm độc lập và giới hạn | Verdict / finding |
| --- | --- | --- |
| `/root/review_knowledge` — requirement/delta/source | Đọc baseline/PERM-23/PIN-05, phân biệt retry và reseed sau xóa; kiểm lifecycle/Settings, receipts/clear-demo, store-session/identity lock/employee guard; PIN-D04 không tự bãi bỏ SHALL; owner G05/G06 và ba khung giữ nguyên. Đối chiếu checklist và diff-check. Không DB, suite hoặc UI thực. | **APPROVE** đúng candidate/checklist; không có finding chặn hoặc đề nghị sửa trong phạm vi. |
| `/root/review_preservation` — DB/security evidence, target binding và bảo toàn | Giải mã 5 raw MCP khớp rows, 2 manifest hash, tính lại 14 body từ Git; kiểm 291 link/95 nguồn ghim, diff-check và main porcelain theo cùng tùy chọn. Giới hạn comment marker/provider, ACL/RLS/anon EXECUTE không suy runtime PASS; checklist append-only, N4 còn mở. Không gọi DB, chạy nghiệp vụ hoặc test bảo mật. | **APPROVE** đúng candidate/checklist; không có finding chặn. |

Tác giả kiểm 11 file (8 Markdown, 3 JSON), 291 liên kết nội bộ, 95 tham chiếu code ghim, 14 body function/overload, 5 raw queries và 2 hash dữ liệu; không lỗi link/anchor/encoding/diff-check. Các file candidate khớp Git; spec và evidence cũ bất biến, status main khớp snapshot. Không dùng các kiểm này thay test sản phẩm.

Không có vòng sửa finding. Sau hai verdict chỉ thêm metadata receipt này; nội dung đã review giữ nguyên. Hoàn tất **phần đối chiếu docs** của N4; R06-A/B/C vẫn chờ quyết định, N4 tổng thể chưa tích. Gói N3/N4 commit local, chưa push; không thay code/DB, refactor hoặc nhận nghiệm thu chức năng.

## Receipt ghi quyết định được xác nhận — 26/10/2026

Candidate `18a78dc87c07593add346bdec286bf1f9b58f1eb`, base `d89c85066ad4eb76134efd774478150e2e3b6355`. Checklist candidate SHA256 `6b126a3fdf0a6ad6c23b38f0818fe355ab18c347581724a82fe73a5418eb914a`, ngoài Git.

| Reviewer / trọng tâm | Kiểm độc lập và giới hạn | Verdict / finding |
| --- | --- | --- |
| `/root/review_knowledge` — yêu cầu, nguồn xác nhận và nhất quán | Đọc toàn bộ delta 13 Markdown; R06-A chỉ đổi vị trí và giữ PIN-05, R06-B hoãn/chưa đáp ứng, R06-C còn câu hỏi chi tiết; không mở quyền code/DB/refactor/push hoặc nhận nghiệm thu. G05/G06 planned, receipt cũ có nhãn lịch sử, checklist nhất quán. Không DB/test/UI thực. | **APPROVE** đúng candidate/checklist; không có finding chặn hoặc đề nghị sửa. |
| `/root/review_preservation` — bảo toàn, authority, evidence và checklist | Tự đối chiếu diff 13 Markdown với ba hướng được chủ dự án chấp thuận; ba baseline giữ bytes phần thân, proposal chỉ thêm note, PERM-23 thêm banner/sửa một THEN phù hợp PIN-05. Receipt cũ/evidence/code/SQL giữ nguyên; 342 link nội bộ và 81 nguồn ghim hợp lệ, diff-check sạch. Checklist live/main porcelain khớp snapshot theo cùng tùy chọn; mọi tick giữ nguyên. Không DB/MCP/runtime; 18 link local lịch sử giữ nguyên, chưa xác minh lại ngữ nghĩa; không có snapshot hash riêng để chứng nhận byte toàn index chính. | **APPROVE** đúng candidate/checklist; không có finding chặn hoặc đề nghị sửa. |

Tác giả xác minh file candidate khớp Git, các phạm vi bảo toàn, link/source, diff-check và checklist; không có lỗi. Không có vòng sửa findings. Sau hai verdict chỉ bổ sung metadata receipt này; nội dung đã review giữ nguyên.

Hoàn tất ghi quyết định trong docs và cập nhật nhật ký checklist. R06-A đã chốt vị trí; R06-B hoãn, chưa đáp ứng; R06-C giữ hướng G04 và còn đặc tả chi tiết. N4 tổng thể/N5/owner/P1-03/H1–H4 không được tích thêm. Commit local, chưa push N3/N4; không sửa code/DB hoặc nhận bằng chứng kiểm mới.
