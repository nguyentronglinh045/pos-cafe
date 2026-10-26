# Chỉ mục các đợt thay đổi giao diện

Đối chiếu 26/10/2026 với main `711a22e`. Đây là đường đọc chung để giải thích giao diện đến từ đâu; [screens](screens.md) giữ bản đồ màn hiện hành, [features](features.md#shared-ui-behavior) giữ nghiệp vụ và [testing](testing.md#bản-đồ-bằng-chứng) giữ kết quả theo nguồn. Không gộp counts của các đợt thành một lần kiểm mới.

| Đợt / vai trò | Spec và quyết định | Evidence và trạng thái |
| --- | --- | --- |
| Đề xuất UI tổng12/09 | [Proposal tổng](../openspec/changes/redesign-pos-ui/proposal.md), [bối cảnh gốc](../openspec/changes/redesign-pos-ui/history.md) | Định hướng lịch sử; bốn màn ưu tiên, phần mang đi/owner còn tách riêng. |
| Week03 B01/B02 | [Proposal](../openspec/changes/week03-b01-b02/proposal.md), [quyết định](workflow/tasks/week03-b01-b02-owner-decisions.md) | [Gate/final](workflow/tasks/week03-b01-b02-final.md), [gói gốc](workflow/evidence/week03-b01-b02-20261024/README.md). Giữ FAIL/skip/NOT_RUN của đúng source, không lấy merge sau này ghi đè kết quả cũ. |
| Remake B01 — sơ đồ | [Bộ change](../openspec/changes/remake-b01/proposal.md) | Scope normalized đã duyệt, canvas động/quyền/data giữ nguyên. Trạng thái tích hợp cuối nằm ở receipt25/10 bên dưới, không ở chữ “chưa merge” của checkpoint batch. |
| Remake B02 — gọi món | [Bộ change](../openspec/changes/remake-b02/proposal.md) | Có trạng thái sau triển khai trong proposal; source/reference/test của batch vẫn giữ riêng. |
| Remake B03 — thanh toán | [Bộ change](../openspec/changes/remake-b03/proposal.md) | Giữ DEV01–08, approval và validation; “chưa merge” ngày22/10 là lịch sử, đã có integration25/10. |
| Tích hợp25/10 | [Handoff chung](workflow/tasks/ui-main-docs-integration-2026-10-25.md), [review](implementation-log/ui-main-docs-integration-review-2026-10-25.md) | Main711a22e cùng tree candidate cf8e304 đã kiểm local/mock. Backend/activation/deployment vẫn có gate riêng. |

## Cách đọc một thay đổi UI

Màn hiện hành → tính năng/quyền → batch/spec/reference đã duyệt → receipt đúng source và môi trường. Operator workflow đi cùng tooling trên main: [UI remake](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/ui-remake/README.md#L1). Không nhân đôi hướng dẫn công cụ trong docs.

## Phần chưa được ba batch chứng minh

- Bán mang đi có chức năng cũ, chưa có batch remake riêng được nhận hoàn tất.
- Theme batch dùng Palette A/Be Vietnam Pro, nhưng [AppProviders:9](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/app/AppProviders.tsx#L9) còn cấu hình MUI/Inter riêng. Đây là phạm vi cần đối chiếu tiếp, không kết luận đã thống nhất theme toàn app hoặc khẳng định lỗi hiển thị khi chưa render.
- Owner email/provisioning/chuyển sở hữu và các màn tương ứng vẫn là kế hoạch.
- Viewport/mock/rendered audit không thay kiểm thiết bị thật hoặc kiểm backend/quyền/dữ liệu cùng source.
- Evidence trước–sau, ảnh raw và receipt từng đợt giữ nguyên vị trí/byte. Lượt26/10 chỉ gom điều hướng; không duyệt reference mới hoặc thay acceptance.
