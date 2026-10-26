# N4 — Hòa giải yêu cầu dữ liệu mẫu và khóa cửa hàng

Ngày26/10/2026. [Bảng chuẩn R06-A/B/C](../../spec-reconciliation.md#r06-detail) · [Evidence mới](../../implementation-log/requirements-reconciliation-20261026/README.md).

## Phạm vi và nguồn quyền

Chủ dự án trả lời “ok tiến hành đi” cho bước N4: đối chiếu yêu cầu seed từ Settings và khóa/trạng thái cửa hàng, ghi phần đã rõ và phần cần chốt; session chỉ cập nhật docs theo code/DB. Quyền này không là quyết định bỏ SHALL, triển khai owner G05/G06, sửa code/DB hay push phần mới. N3 và N4 giữ local; phần2 đã xuất bản tại `d75e41ec40a3287da054b023594fb087d412d983`.

Docs base `669a27158032d585bef986be2145d6fc8d26a412`; source code remote main `711a22e71983e3d6aa17799649af05ce4c762555`. Local main HEAD `5156820f7d6679cd6f8051bdc38419737ffa0c7e` và WIP giữ nguyên. Dùng index riêng và snapshot ngoài repo, không switch/reset/stash/clean, tạo worktree docs hoặc sửa index chính. Không app/test run, DB mutation, dựng lab/cài gói hay refactor.

## Kết quả phân tích

- R06-A: retry seed ban đầu đã có workflow/receipt và UI chung cho normal owner, khác vị trí Settings trong baseline/PERM-23.
- R06-B: baseline store-settings **có** yêu cầu khôi phục sau xóa; không được bỏ sót khi chỉ đọc scenario lỗi onboarding. Workflow hiện hành không đáp ứng reseed sau xóa. Giữ yêu cầu mở; đề xuất hoãn chỉ là đề xuất cần duyệt.
- R06-C: các đường load/pair/store-session/start-session/guard đã đọc không dùng cờ store active. Metadata xác nhận cột còn có, không chứng minh hành vi khóa. Giữ requirement khóa app và câu hỏi server riêng.
- G05/G06 giữ planned, ba khung chưa viết không đổi; chưa chọn triển khai nên không tự hoàn thiện chi tiết.

Nguồn code/delta, khác biệt giữa quyết định chủ dự án với lựa chọn kỹ thuật PIN-D04, lựa chọn tiếp theo và giới hạn kiểm ở bảng chuẩn. N4 không biến design “không thêm reseed” thành quyết định bãi bỏ baseline. Không apply/archive change hoặc sửa evidence/spec lịch sử.

## Kiểm nguồn và trạng thái

MCP `supabase_pos_cafe` chạy SELECT metadata; role `supabase_read_only_user`, transaction_read_only on; comment marker khai báo staging `ineckiashpwloncxnbqx`. Không có API cung cấp URL/project provider trong bộ tool hiện tại; đây là binding metadata tại kết nối, không chứng thực độc lập phía provider. Không dùng cấu hình CLI khác ref để gọi DB. Body 14 function/overload khớp source; headers/ACL và policies liên quan được lưu riêng, không là full dependency audit, deny test hoặc runtime acceptance.

Kiểm tài liệu: link/anchor, source path/line ghim, body comparison/raw query/manifest, diff-check và bảo toàn status main/spec/evidence cũ/checklist. Hai reviewer độc lập: tính đúng requirement/source và ranh giới permission/evidence/bảo toàn. Receipt ghi candidate/hash và verdict sau review; không nhận kế hoạch kiểm thành kết quả.

Checklist `D:/Workspace/pos-cafe-docs-priorities.local.md` tiếp tục ngoài Git. N4 tổng thể giữ mở do R06-A/B/C chưa có quyết định; ghi riêng phần **đối chiếu tài liệu đã hoàn tất sau review**. N5, owner artifacts và H1–H4 không đóng.

## Bước tiếp theo

Chủ dự án xem ba phương án ở [bảng cần duyệt](../../spec-reconciliation.md#r06-detail). Chỉ sửa expected sau quyết định tương ứng; không cần code để ghi quyết định. N5 có thể kiểm kê requirement → TC → evidence độc lập khi được giao, nhưng không dùng để đóng những nghĩa vụ còn mở. Đã cung cấp đường đọc source; chưa nhận chủ dự án đã hiểu hoặc nghiệm thu. Chưa push N3/N4.

## Receipt kiểm và review — 26/10/2026

Candidate được cả hai reviewer kiểm: `76add012358c2394fe0678d2e2cc4b8ea32d4e15`, base `669a27158032d585bef986be2145d6fc8d26a412`. Checklist candidate SHA256 `d155e6e3ccf3c6443d79e2935c1cdc902a639de05ea0174918b272577bcba478`; file ở ngoài Git.

| Reviewer / trọng tâm | Kiểm độc lập và giới hạn | Verdict / finding |
| --- | --- | --- |
| `/root/review_knowledge` — requirement/delta/source | Đọc baseline/PERM-23/PIN-05, phân biệt retry và reseed sau xóa; kiểm lifecycle/Settings, receipts/clear-demo, store-session/identity lock/employee guard; PIN-D04 không tự bãi bỏ SHALL; owner G05/G06 và ba khung giữ nguyên. Đối chiếu checklist và diff-check. Không DB, suite hoặc UI thực. | **APPROVE** đúng candidate/checklist; không có finding chặn hoặc đề nghị sửa trong phạm vi. |
| `/root/review_preservation` — DB/security evidence, target binding và bảo toàn | Giải mã 5 raw MCP khớp rows, 2 manifest hash, tính lại 14 body từ Git; kiểm 291 link/95 nguồn ghim, diff-check và main porcelain theo cùng tùy chọn. Giới hạn comment marker/provider, ACL/RLS/anon EXECUTE không suy runtime PASS; checklist append-only, N4 còn mở. Không gọi DB, chạy nghiệp vụ hoặc test bảo mật. | **APPROVE** đúng candidate/checklist; không có finding chặn. |

Tác giả kiểm 11 file (8 Markdown, 3 JSON), 291 liên kết nội bộ, 95 tham chiếu code ghim, 14 body function/overload, 5 raw queries và 2 hash dữ liệu; không lỗi link/anchor/encoding/diff-check. Các file candidate khớp Git; spec và evidence cũ bất biến, status main khớp snapshot. Không dùng các kiểm này thay test sản phẩm.

Không có vòng sửa finding. Sau hai verdict chỉ thêm metadata receipt này; nội dung đã review giữ nguyên. Hoàn tất **phần đối chiếu docs** của N4; R06-A/B/C vẫn chờ quyết định, N4 tổng thể chưa tích. Gói N3/N4 commit local, chưa push; không thay code/DB, refactor hoặc nhận nghiệm thu chức năng.
