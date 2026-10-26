# CD — đối chiếu proposal cũ với quy trình hiện hành

Đối chiếu ngày 26/10/2026 với main `711a22e`. Đọc [setup CI/CD](../setup-project-ci-cd/proposal.md#điểm-vào-hiện-hành--26102026) và [bằng chứng triển khai](../../../docs/testing.md#bản-đồ-bằng-chứng). [Proposal gốc](history.md) giữ nguyên; trang này không cấp quyền deploy. Change công cụ không sinh hành vi người dùng: testplan/traceability ở setup, không tạo usecases mới.

## Đối chiếu phạm vi

| Đề xuất gốc | Nguồn hiện hành / phần còn lại |
| --- | --- |
| Phân môi trường Preview/Production | Workflow Preview thủ công, chỉ main, có input exact source/CI/mode; release có checkpoint approval nhưng production vẫn held. [Preview](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/.github/workflows/frontend-preview.yml#L1); [release](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/.github/workflows/frontend-release.yml#L1). Trạng thái cấu hình thực tế/đích phải được kiểm trong task deploy. |
| Tự deploy theo nhánh/PR | Hướng hiện hành là manual có gate; không mở lại auto-deploy từ câu đề xuất cũ. CI xanh không tự cho functional Preview hoặc production. |
| Migration forward, preflight và xác minh | Database/Edge nằm ngoài CD frontend. Giữ nguyên nghĩa vụ inventory, source/schema/fixture, backup và gate của task backend; không apply SQL từ lượt docs. |
| Rollback frontend và migration | Giữ yêu cầu lập/kiểm phương án theo lần phát hành. Không coi có workflow là đã diễn tập rollback hoặc rollback DB an toàn. |
| Health check và tài liệu release | Tooling có prepare/verify; nguồn receipt quyết định đã kiểm scope nào. Chưa có bằng chứng release chức năng nguồn cuối hoặc diễn tập restore đầy đủ tại bảng này. |

## Quyết định đã chốt

Xem [DEC-CICD và quyết định functional Preview](../setup-project-ci-cd/proposal.md), [backend/web23/10](../../../docs/workflow/tasks/permission-backend-web-release-2026-10-23.md) và [integration25/10](../../../docs/workflow/tasks/ui-main-docs-integration-2026-10-25.md). Giữ các grant lịch sử theo đúng source/đích/thời điểm; không tái sử dụng counter/cutoff cũ.

## Còn lại

Functional deployment còn phụ thuộc full gate backend/PIN/service profiles; production giữ HOLD. Backup, restore và giám sát không bị xóa vì nằm ngoài CD frontend. Mục tiêu G10 là chạy chức năng đăng ký trên Vercel và chứng minh kiểm local; không tự thêm cam kết vận hành thương mại. Nhánh docs là kho tài liệu, không có deployment ứng dụng trong lượt chỉnh lý này.

## Câu hỏi phải chốt trước khi làm

Không còn câu hỏi chặn lượt tổ chức tài liệu26/10 đã được giao. Các vấn đề triển khai còn mở được nêu ở phần phạm vi/còn lại và hồ sơ chính; không nhận bộ spec phần dư đã sẵn sàng code. Câu hỏi cũ và bối cảnh câu trả lời giữ trong [lịch sử](history.md#câu-hỏi-phải-chốt-trước-khi-làm).

## Tra cứu mục cũ

Các điểm neo được giữ để liên kết cũ vẫn tới được đúng bối cảnh.

| Mục lịch sử | Nguồn nguyên bản |
| --- | --- |
| <a id="dựng-quy-trình-triển-khai-liên-tục"></a>Dựng quy trình triển khai liên tục | [Đọc lịch sử](history.md#dựng-quy-trình-triển-khai-liên-tục) |
| <a id="why"></a>Why | [Đọc lịch sử](history.md#why) |
| <a id="what-changes"></a>What Changes | [Đọc lịch sử](history.md#what-changes) |
| <a id="capabilities"></a>Capabilities | [Đọc lịch sử](history.md#capabilities) |
| <a id="new-capabilities"></a>New Capabilities | [Đọc lịch sử](history.md#new-capabilities) |
| <a id="modified-capabilities"></a>Modified Capabilities | [Đọc lịch sử](history.md#modified-capabilities) |
| <a id="impact"></a>Impact | [Đọc lịch sử](history.md#impact) |
| <a id="ngoài-phạm-vi"></a>Ngoài phạm vi | [Đọc lịch sử](history.md#ngoài-phạm-vi) |
| <a id="phụ-thuộc"></a>Phụ thuộc | [Đọc lịch sử](history.md#phụ-thuộc) |
