# Dọn worktree docs đã hết dùng — 25/10/2026

> **Hiện trạng sau yêu cầu tiếp:** đã xóa cả worktree docs cuối sau khi đồng bộ và xác minh toàn bộ commit trên remote. Còn14 worktree code,0 worktree docs; nhánh docs và kho16 snapshot vẫn giữ. Các mục đầu trang ghi lần xóa worktree tạm trước đó.

> **Tiếp nối25/10:** [task đồng bộ docs](docs-worktree-sync-2026-10-25.md) đã xử lý WIP gốc sau mốc xóa worktree tạm này. Các câu39/920 còn nguyên/chưa dọn bên dưới là kết quả lịch sử tại thời điểm16:41; hiện trạng mới theo task tiếp nối.

## Yêu cầu và phạm vi

Chủ dự án yêu cầu: “hiện tại trên local có worktree nào của docs mà không dùng không? xóa giúp tôi”. Lệnh này cho phép kiểm và xóa worktree docs đã hết dùng; không yêu cầu xóa nhánh, lịch sử Git, worktree code hoặc WIP còn cần giữ. Không hỏi lại quyền xóa đúng worktree sạch đã xác minh.

Hai worktree docs được nhận diện trong registry16 worktree:

| Worktree | Kết quả |
| --- | --- |
| `D:/Workspace/pos-cafe-ui-integration-docs-20261025` | **Đã xóa** bằng `git worktree remove`, không force. Task chỉnh lý/xuất bản đã hoàn tất; HEAD89b5157 trùng remote docs trước xóa, clean,0untracked/ignored/reparse/nested repo. Nhánh `docs-knowledge-cleanup-20261025` và Git objects vẫn giữ |
| `D:/Workspace/pos-cafe-docs` | **Giữ nguyên** HEAD0fe967d trên local branch docs;39 tracked changes/920 untracked. Toàn bộ1.856 file khớp hash trước/sau. Đây vẫn là nguồn WIP gốc; chưa đồng bộ/reset nó hoặc xóa877 bản lặp ở task trước |

14 worktree còn lại là code, không thuộc phạm vi. `pos-cafe-ui-workflow` cũng là code; không xóa chỉ vì tên có UI. Sau thao tác còn15 worktree, trong đó1docs.

## Kiểm trước và kết quả thực hiện

- Xác minh đường tuyệt đối nằm trong `D:/Workspace`, đúng allowlist một path; `.git` và backpointer trỏ đúng metadata, không locked hoặc reparse/nested Git. Không thấy process thường trú có command line gắn worktree mục tiêu; chỉ process PowerShell kiểm tra. Không tự dừng process ngoài task.
- `review_knowledge` và `review_preservation` tự kiểm nguồn/remote/registry/cleanliness và cùng APPROVE kế hoạch trước remove. Cả hai chỉ đọc. Git không force bảo vệ nếu có file mới/dirty giữa các lần kiểm.
- Fresh check ngay trước lệnh: target HEAD và remote docs đều `89b5157e29ee44095391f747daa6dcfd40b3a219`; clean,0ignored. Thực hiện từ `D:/Workspace/pos-cafe`:

```powershell
git -C D:/Workspace/pos-cafe worktree remove -- D:/Workspace/pos-cafe-ui-integration-docs-20261025
```

- Hoàn thành lúc `2026-10-25T09:41:18.4443284Z` (16:41 UTC+7), exit0. Thư mục và entry registry mục tiêu đều không còn; registry16→15. Không dùng `Remove-Item`, `git clean`, `prune`, force hay xóa branch.
- Worktree đã xóa có2.164 files/106.449.782 bytes logical. Windows FileStandardInfo đo110.512.784 bytes allocation của các file;0hardlink/0lỗi, chưa tính overhead directory/MFT/gitdir. Không dùng logical size hoặc GetCompressedFileSize làm số allocation NTFS.

| Dung lượng Windows thực | Trước remove (bytes) | Ngay sau remove (bytes) | Chênh lệch trống |
| --- | ---: | ---: | ---: |
| C | 192.726.642.688 | 192.726.642.688 | 0 |
| D | 98.671.947.776 | 98.783.375.360 | **+111.427.584** |

Đây là chênh lệch free space đo sát lệnh, khoảng111,4MB thập phân (106,3MiB); gồm metadata và có thể chịu biến động ghi khác trên ổ. Không nhận việc dừng process, Recycle Bin hoặc xóa Git history là cách thu hồi. Lịch sử/nhánh còn đầy đủ trên Git.

## Nguồn bằng chứng và tiếp tục

Receipt `docs-worktree-cleanup-result.json`, inventory trước xóa `docs-worktree-cleanup-inventory.json` và phép đo `docs-worktree-cleanup-allocation.json` giữ ngoài thư mục đã xóa tại `C:/Users/nguye/.codex/visualizations/2026/10/25/01a1722d-2ed2-7610-bd8c-eee18bc8de1f/`. Các công cụ QA của task xuất bản trước vẫn là bằng chứng lịch sử; đường checkout đã xóa trong chúng không còn là nơi chạy hiện hành.

Tài liệu xuất bản trước vẫn ở commit89b5157 trên remote docs. Những link local trỏ worktree đã xóa cần đọc qua nhánh docs trên GitHub hoặc checkout thích hợp; không tự sửa các snapshot cũ để đổi nguồn. Handoff này được ghi bằng Git index tách biệt, không tạo thêm checkout và không thay working tree/index của các worktree đang giữ.

Danh sách877 bản WIP local trùng ở task trước **chưa được dọn**: yêu cầu mới nhắm worktree hết dùng, không tự mở rộng sang xóa file trong worktree WIP đang giữ. Không refactor, chạy backend/CI, migration, deploy hoặc mở lại acceptance gates.

## Review kết quả

Hai reviewer độc lập đã **APPROVE** receipt candidate `5fe77755b8af33a21c5a24bfd3f2e957af1377e4` sau thao tác, không có finding chặn:

- `review_preservation`: kiểm target/gitdir/registry đã mất, các worktree khác giữ HEAD/branch,1.856 hash/size của docs gốc không đổi,39/920 WIP giữ nguyên; receipt/free-space/allocation khớp và diff2files đúng phạm vi.
- `review_knowledge`: kiểm hậu xóa, dòng index, parent/ref,1.856 SHA256 và phép phân biệt logical/allocation/free-space; không mở quyền xóa WIP/branch/code hoặc backend acceptance.

`git diff --check` đạt. Receipt sau candidate chỉ bổ sung kết quả review, không sửa phạm vi xóa, số đo hay evidence. Hồ sơ được xuất bản bằng push fast-forward thông thường lên docs; không tạo lại worktree đã xóa.


## Xóa worktree docs cuối sau đồng bộ — 25/10/2026

Sau khi được báo chỉ còn `D:/Workspace/pos-cafe-docs`, chủ dự án hỏi “có thể xóa đi không”. Trong chuỗi yêu cầu dọn worktree này, AI tiếp tục thực hiện xóa đúng checkout đã sạch/đã xuất bản, thông báo rõ mục tiêu và phần giữ trước thao tác. Không mở rộng sang xóa branch, Git history hoặc kho16 bản khác biệt.

Hai reviewer độc lập tự kiểm và APPROVE kế hoạch: target HEAD/local docs/origin/docs/remote đều `b5be5914e1782f6b52cf386246e7ff15558d180f`; clean,0untracked/ignored/reparse/nested Git/lock; pointer/backpointer đúng. Inventory2.166 files/106.445.969 bytes logical. Kho `D:/Workspace/pos-cafe-docs-retained-20261025` là sibling ngoài target;16snapshot/357.496 bytes khớp hash, preserve ref vẫn0fe967d. Không thấy process thường trú gắn target.

Fresh checks sát lệnh kiểm lại refs, sạch/ignored và hash toàn bộ2.166 file, containment của target và kho giữ. Từ cwd `D:/Workspace/pos-cafe` chạy:

```powershell
git -C D:/Workspace/pos-cafe worktree remove -- D:/Workspace/pos-cafe-docs
```

Exit0 lúc `2026-10-25T10:22:47.4701109Z` (17:22 UTC+7); không force, không prune/glob/Remove-Item. Target và registry entry không còn; tổng worktrees15→14, **docs1→0**. Local docs vẫn b5be591 ngay sau remove; Git objects/remote/preserve ref và toàn bộ worktree code giữ nguyên. Kiểm lại16snapshot sau xóa không sai hash.

| Windows free space (bytes) | Trước | Ngay sau | Chênh lệch |
| --- | ---: | ---: | ---: |
| C | 192.733.511.680 | 192.733.511.680 | 0 |
| D | 98.717.110.272 | 98.828.529.664 | **+111.419.392** |

Ổ D tăng khoảng111,4MB trống sát thao tác; đây là đo free-space, không đồng nhất với106,4MB logical hoặc tuyên bố Git history đã bị xóa. Số đo có thể gồm metadata và ghi nền khác. Receipt/manifest mới là `docs-last-worktree-removal-result.json` và `docs-last-worktree-removal-input.json` tại thư mục QA đã ghi ở trên; không ghi đè receipt lần xóa worktree tạm.

Hướng dẫn hiện hành vẫn ở nhánh docs. AGENTS và starter được cập nhật cách đọc bằng `git show docs:<path>` khi không có worktree; các con trỏ trên main không bị sửa. Kho16 snapshot không là nguồn hướng dẫn hiện hành. Biên bản được ghi bằng temporary Git index, không tạo lại checkout vừa xóa.

Kết quả và delta hướng dẫn trên candidate `f850c6bbcf6de7990e9a7bb297ee7fe9bb8e3c96` đã có hai **APPROVE**, không còn finding chặn:

- `review_preservation` tự kiểm target/gitdir/registry,14worktree/0docs,16snapshot/ref,raw receipt/size và fallback Git với AGENTS/CLAUDE/spec/workflow/starter; diff5files đúng phạm vi.
- `review_knowledge` tự kiểm cùng postconditions,16hash/size,preserve ref,khả năng đọc hướng dẫn bằng Git và ranh giới quyền; diff-check đạt.

Receipt sau candidate chỉ ghi verdict/status rồi push fast-forward lên docs. Không refactor, DB/deploy, xóa kho giữ hoặc nhánh preserve; không tạo lại checkout để lưu biên bản.
