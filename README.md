# POS Cafe — khai báo sử dụng AI

Nhánh `ai-log` lưu bản khai báo sử dụng AI mà từng thành viên đã tự duyệt để công khai. Mỗi bản ghi dùng hai mục **Yêu cầu đã giao** và **AI đã làm**.

Trước khi gửi, đối chiếu người thực hiện qua thông tin tác giả trong Git và tên sinh viên không dấu trong tên file. Người thực hiện duyệt bản của mình trên máy trước khi push. Bản nháp, nội dung chat nguyên văn, workflow, script, UI và xác nhận duyệt lưu local. Bản công khai dùng nội dung đã diễn giải và đã che dữ liệu nhạy cảm khi cần.

## Vai trò của ba nhánh

| Nhánh | Vai trò |
| --- | --- |
| [main](https://github.com/nguyentronglinh045/pos-cafe/tree/main) | Mã ứng dụng, kiểm thử và công cụ chạy cùng mã nguồn. |
| [docs](https://github.com/nguyentronglinh045/pos-cafe/tree/docs) | Đặc tả, hướng dẫn dự án, quyết định kỹ thuật và minh chứng. |
| `ai-log` | Bản khai báo sử dụng AI. |

**Ba nhánh chính phát hành độc lập.** Cấm merge hoặc mở PR giữa bất kỳ hai nhánh nào trong ba nhánh `main`, `docs` và `ai-log`, theo cả hai chiều. Quy tắc áp dụng cho merge thường, squash và rebase qua PR. Agent phải từ chối mọi yêu cầu merge chéo, kể cả khi có yêu cầu trực tiếp từ người dùng. Công việc cần PR thì bắt đầu từ nhánh chính phù hợp và mở PR về chính nhánh đó.

Đọc [quy tắc nhánh chính thức](https://github.com/nguyentronglinh045/pos-cafe/blob/docs/AGENTS.md#branch-model) trước khi thao tác Git.
