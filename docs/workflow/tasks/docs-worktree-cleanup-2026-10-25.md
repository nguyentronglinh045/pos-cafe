# Dọn worktree docs đã hết dùng — 25/10/2026

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
