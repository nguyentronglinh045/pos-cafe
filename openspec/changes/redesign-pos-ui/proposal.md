# Thiết kế lại POS — phạm vi tổng và đường đọc hiện hành

Đối chiếu 26/10/2026, main `711a22e`. [Chỉ mục các đợt UI](../../../docs/ui-evolution.md) nối scope, quyết định, spec và evidence. [Màn hình](../../../docs/screens.md) mô tả điểm vào hiện tại; [features](../../../docs/features.md#shared-ui-behavior) mô tả chức năng. [Proposal gốc](history.md) giữ bối cảnh và quyết định12/09.

## Phạm vi đã được cụ thể hóa

| Nhánh gốc | Nguồn hiện hành / phần còn lại |
| --- | --- |
| A — màu, font, theme và trạng thái UI | Các batch dùng Palette A v1/Be Vietnam Pro theo hồ sơ đã duyệt. AppProviders vẫn có cấu hình MUI/Inter riêng ([source:9](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/app/AppProviders.tsx#L9)); chưa nhận toàn app thống nhất theme. Giữ gap phần còn lại, không tự đổi palette hoặc refactor. |
| B — sơ đồ, gọi món, thanh toán | B01/B02/B03 đã tích hợp25/10; từng batch giữ spec/owner approval và gate riêng. Merge không là nghiệm thu mọi thiết bị hoặc backend. |
| B — bán mang đi | Chức năng hiện có; chưa thấy batch remake riêng được nghiệm thu. Giữ mục này trong G08, không suy ba batch đã hoàn thành bốn màn. |
| C — shell theo quyền và UI owner | Shell theo authority đã có; owner email/chuyển sở hữu vẫn kế hoạch. Không dùng dependency cũ để yêu cầu chờ owner email mới được công nhận shell đã hiện thực. |

## Quyết định đã chốt

Quyết định12/09 “không xếp tuần riêng” nằm trong [lịch sử](history.md#quyết-định-đã-chốt). Phạm vi/reference/deviation cụ thể xem [B01](../remake-b01/proposal.md), [B02](../remake-b02/proposal.md), [B03](../remake-b03/proposal.md) và [chỉ mục](../../../docs/ui-evolution.md). Hạn đồ án hiện hành theo [roadmap](../../../docs/roadmap.md); không dùng số tuần trong lịch cũ làm deadline mới.

## Còn lại và giới hạn

Giữ nghiệp vụ/quyền/giao thức ghi đã duyệt. Mang đi, UI owner, thiết bị thật và các màn ngoài batch còn phải đánh giá riêng. Scope portrait/dark mode/đổi test ID theo hợp đồng của batch tương ứng; không tự thêm yêu cầu từ một đề xuất lịch sử. Không có refactor UI, thay test hoặc deploy trong lượt tổ chức docs này.

## Câu hỏi phải chốt trước khi làm

Không còn câu hỏi chặn lượt tổ chức tài liệu26/10 đã được giao. Các vấn đề triển khai còn mở được nêu ở phần phạm vi/còn lại và hồ sơ chính; không nhận bộ spec phần dư đã sẵn sàng code. Câu hỏi cũ và bối cảnh câu trả lời giữ trong [lịch sử](history.md#câu-hỏi-phải-chốt-trước-khi-làm).

## Tra cứu mục cũ

Các điểm neo được giữ để liên kết cũ vẫn tới được đúng bối cảnh.

| Mục lịch sử | Nguồn nguyên bản |
| --- | --- |
| <a id="thiết-kế-lại-giao-diện-pos"></a>Thiết kế lại giao diện POS | [Đọc lịch sử](history.md#thiết-kế-lại-giao-diện-pos) |
| <a id="why"></a>Why | [Đọc lịch sử](history.md#why) |
| <a id="what-changes"></a>What Changes | [Đọc lịch sử](history.md#what-changes) |
| <a id="capabilities"></a>Capabilities | [Đọc lịch sử](history.md#capabilities) |
| <a id="new-capabilities"></a>New Capabilities | [Đọc lịch sử](history.md#new-capabilities) |
| <a id="modified-capabilities"></a>Modified Capabilities | [Đọc lịch sử](history.md#modified-capabilities) |
| <a id="impact"></a>Impact | [Đọc lịch sử](history.md#impact) |
| <a id="ngoài-phạm-vi"></a>Ngoài phạm vi | [Đọc lịch sử](history.md#ngoài-phạm-vi) |
| <a id="phụ-thuộc"></a>Phụ thuộc | [Đọc lịch sử](history.md#phụ-thuộc) |
