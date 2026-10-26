# CI — đối chiếu proposal cũ với quy trình hiện hành

Đối chiếu ngày 26/10/2026 với main `711a22e`. [Setup CI/CD](../setup-project-ci-cd/proposal.md#điểm-vào-hiện-hành--26102026) là hồ sơ chính. Proposal này giữ truy vết phạm vi CI ban đầu; không mở một pipeline thứ hai hoặc nhận cả backlog đã hoàn tất. Change công cụ, không sinh hành vi người dùng: không tạo usecases mới; testplan/traceability theo change setup. [Nội dung gốc](history.md) được giữ nguyên.

## Đối chiếu phạm vi

| Đề xuất gốc | Nguồn hiện hành / cách xử lý |
| --- | --- |
| Pipeline tự động push/PR | GitHub Actions đã có; push loại nhánh docs và evidence pattern, PR có trigger riêng. [Workflow ghim nguồn](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/.github/workflows/ci.yml#L1). Không diễn đạt “mọi push” hoặc tự thay branch rules. |
| Cài dependency, type/build, unit, E2E | Light CI gọi launcher và profile theo source; mock UI và backend thật là các phạm vi khác nhau. [Strategy](../../../docs/test-strategy.md), [E-UI/E-CICD/E-BACKEND](../../../docs/testing.md#bản-đồ-bằng-chứng). Không nhận YAML là kết quả chạy. |
| Artifact và xử lý CI đỏ | Safe summary và allowlist ảnh PIN được source kiểm soát; không upload toàn bộ raw. Operator guide đi cùng tooling trên main. [Quyết định setup](../setup-project-ci-cd/proposal.md), [allowlist hiện hành](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/.github/workflows/ci.yml#L34). |
| Cache dependency | Là đề xuất tối ưu cũ, không là tính năng đã bật: workflow hiện đặt package-manager-cache=false. Giữ giới hạn dung lượng/chi phí; thay chính sách cần task riêng. |
| Npm, thời lượng và lịch chạy | Source workflow dùng Node24.16.0, job timeout30phút; lock npm trong source. Đây là cấu hình, không là số đo hoặc deadline giảng viên. Chưa có schedule trong workflow light; không tự bật nightly. |

## Quyết định đã chốt

Các câu hỏi nền tảng/nhánh/phân tầng gate được nối tới [DEC-CICD và các cập nhật](../setup-project-ci-cd/proposal.md). Không hỏi lại lựa chọn đã có. Tham số của lần chạy phải lấy từ source/receipt; thay đổi acceptance, upload hoặc lịch chạy chưa được cấp quyền từ trang này.

## Còn lại

Backend acceptance và dịch vụ thật giữ gate trong hồ sơ chuyên biệt; benchmark thời gian/cache/schedule chưa tự được bổ sung. NFR-06/07 không được nhận đạt trên source mới bằng kết quả cũ. Không archive change như đã nghiệm thu toàn bộ chỉ vì đường đọc đã được hợp nhất.

## Câu hỏi phải chốt trước khi làm

Không còn câu hỏi chặn lượt tổ chức tài liệu26/10 đã được giao. Các vấn đề triển khai còn mở được nêu ở phần phạm vi/còn lại và hồ sơ chính; không nhận bộ spec phần dư đã sẵn sàng code. Câu hỏi cũ và bối cảnh câu trả lời giữ trong [lịch sử](history.md#câu-hỏi-phải-chốt-trước-khi-làm).

## Tra cứu mục cũ

Các điểm neo được giữ để liên kết cũ vẫn tới được đúng bối cảnh.

| Mục lịch sử | Nguồn nguyên bản |
| --- | --- |
| <a id="dựng-pipeline-tích-hợp-liên-tục"></a>Dựng pipeline tích hợp liên tục | [Đọc lịch sử](history.md#dựng-pipeline-tích-hợp-liên-tục) |
| <a id="why"></a>Why | [Đọc lịch sử](history.md#why) |
| <a id="what-changes"></a>What Changes | [Đọc lịch sử](history.md#what-changes) |
| <a id="capabilities"></a>Capabilities | [Đọc lịch sử](history.md#capabilities) |
| <a id="new-capabilities"></a>New Capabilities | [Đọc lịch sử](history.md#new-capabilities) |
| <a id="modified-capabilities"></a>Modified Capabilities | [Đọc lịch sử](history.md#modified-capabilities) |
| <a id="impact"></a>Impact | [Đọc lịch sử](history.md#impact) |
| <a id="ngoài-phạm-vi"></a>Ngoài phạm vi | [Đọc lịch sử](history.md#ngoài-phạm-vi) |
| <a id="phụ-thuộc"></a>Phụ thuộc | [Đọc lịch sử](history.md#phụ-thuộc) |
