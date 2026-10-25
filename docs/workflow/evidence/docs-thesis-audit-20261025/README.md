# Phương pháp rà docs — 25/10/2026

Receipt phân tích tài liệu, không phải acceptance ứng dụng. Mốc đầu vào docs `422eecfd280f889d8c6f7a43c9df77197789c3f7`, main `711a22e71983e3d6aa17799649af05ce4c762555`. [Báo cáo](../../tasks/docs-thesis-audit-2026-10-25.md).

- [audit-summary.json](audit-summary.json): counts trên đầu vào, không cộng các file được gói rà soát này thêm vào.
- [change-inventory.json](change-inventory.json): toàn bộ47 change chưa archive và loại artifact hiện diện; không đánh giá tính đầy đủ bằng số file.
- Git inventory đọc bằng `git ls-tree -rlz <docs-sha>`; Markdown được đọc từ blob với `git cat-file --batch`, không cần worktree.
- Scanner bỏ fenced code, nhận inline Markdown link, phân loại đường Windows, resolve relative target theo cây Git, kiểm heading/anchor và file/biên dòng của link main711a22e. Không dùng để chứng nhận HTTP, reference-style/HTML links, nội dung nhị phân, hay ý nghĩa claim.
- Phân loại140 relative target chưa resolve:93 cú pháp file:line,21 snapshot-relative,26 ảnh archive. Bản này không tự kết luận bằng chứng gốc đã mất.
- Đọc sâu core/spec/handoff liên quan12 mục tiêu và mã đã ghim; hai reviewer độc lập kiểm các phạm vi bổ sung. Không đọc thủ công mọi dòng log/JSON và không chạy suite/live.

Script kiểm một lần được giữ ngoài nhánh docs tại `C:/Users/nguye/.codex/visualizations/2026/10/25/01a1722d-2ed2-7610-bd8c-eee18bc8de1f/docs-thesis-audit/audit_links.py`, SHA256 `ea2c6c494ae2e7e5c5cb24d35423551a90756105a73d5cdfc69f18e60a5b644a`. Kết quả chi tiết local ở `link-findings.json` cạnh script; không đưa một công cụ kiểm mới vào docs hoặc main trong task phân tích. Có thể chạy lại trên máy này bằng Python hiện có, với `--repo D:/Workspace/pos-cafe --out <thư-mục-kết-quả-riêng>`; mặc định hai SHA đúng đầu vào trên. Đây là recipe local, không cam kết các đường QA tồn tại trên máy khác; thuật toán và đầu vào Git đủ để đối chiếu bằng scanner độc lập.

Không đổi byte của evidence cũ, SHALL, expected, grants, cutoffs hoặc verdict. Không đổi main, không tạo worktree docs, không thực hiện xóa/hợp nhất được đề nghị trong báo cáo.
