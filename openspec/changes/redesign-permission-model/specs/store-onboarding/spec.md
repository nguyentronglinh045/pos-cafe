> **Đối chiếu xuất bản 25/10/2026.** Bộ yêu cầu 15 quyền/Q1–Q15 được khôi phục từ WIP đã ghi quyết định; thay bản 14 quyền/có Kế toán trên docs cũ. Các mô tả code 3 role/5 quyền, forced PIN chưa hiện thực, đường dẫn local và quyền triển khai tháng 9 bên dưới là baseline/checkpoint lịch sử. Main711a22e đã có catalog15 và forced-PIN; chưa nhận backend/PIN19/PERM60 trên source hiện hành đạt. M24 cho merge mã trước backend acceptance, không miễn gate hoặc cho deploy. [Nguồn, trạng thái và giới hạn](../../../../../docs/workflow/tasks/docs-wip-publication-2026-10-25.md). Các yêu cầu SHALL/expected bên dưới được giữ; không đổi để hợp thức hóa code.

> **Quyết định26/10/2026 — R06-A:** chủ dự án chấp nhận retry seed lỗi tại thông báo chung sau đăng nhập normal owner, thay riêng vị trí “từ Cài đặt” trong scenario bên dưới. [Quyết định và giới hạn](../../../../../docs/spec-reconciliation.md#r06-decisions); các điều kiện PIN-05/receipt/quyền giữ nguyên, chưa là kết quả nghiệm thu.

# Delta store-onboarding

## MODIFIED Requirements

### Requirement: Tạo cửa hàng mới

Mã: **PERM-23**.

Giữ flow tạo/ghép store và Store Key hiện có. Bootstrap store/settings/employee owner SHALL là một transaction với đúng một owner active và catalog version đang bật. UUID store/owner theo input client hợp lệ nhưng không coi UUID tự khai là bằng chứng ownership cho migration sau. Gọi lại bootstrap đã hoàn tất SHALL không thêm owner; người chỉ có store Auth không được dùng bootstrap để promote/đổi owner đã tồn tại. Store tạo sau activation không sinh role admin.

Bootstrap là ngoại lệ trước employee session, chỉ cho tạo store thuộc identity provisioning hợp lệ theo flow hiện tại; không biến thành endpoint quản trị nhân viên không cần PIN. Không thêm email owner account, recovery contact hoặc quyền Store Key rotation trong change.

Giữ tên hiển thị/địa chỉ, Store Key và chính sách cấp PIN hiện có; chỉ đổi role bootstrap admin thành owner. Tên hiển thị mặc định và PIN khởi tạo hiện theo [authRepo.ts:56](D:/Workspace/pos-cafe/src/adapters/supabase/authRepo.ts:56); việc bắt người dùng đặt PIN riêng/ép đổi thuộc force-default-pin-change, không tự thêm vào change này. Mặc định cửa hàng trống; tùy chọn seed demo mặc định tắt. Seed chạy sau bootstrap dưới phiên owner được xác minh rồi revoke phiên tạm như [authRepo.ts:71](D:/Workspace/pos-cafe/src/adapters/supabase/authRepo.ts:71), từng call có đủ quyền; không atomic toàn seed với bootstrap. Seed lỗi giữ Store Key kết quả để không khóa người tạo khỏi store.

Tên hiển thị trim1–120 Unicode code points, địa chỉ trim0–500 theo [014:253](D:/Workspace/pos-cafe/supabase/migrations/014_write_identity_and_ledger.sql:253); không siết tên xuống100 hoặc tự cắt tên legacy.

#### Scenario: Tạo cửa hàng trống

- **WHEN** flow tạo store nhận tên/địa chỉ theo hợp đồng hiện có và không chọn seed demo
- **THEN** tạo store/settings/một owner active và Store Key dạng STORE_NO-SECRET theo flow hiện tại; không tạo danh mục, món, khu hoặc bàn.

#### Scenario: Tùy chọn khởi tạo dữ liệu mẫu

- **WHEN** bật tùy chọn seed demo khi tạo store
- **THEN** sau bootstrap, phiên owner hợp lệ seed bộ demo gồm danh mục/món/khu/bàn/cashier; không thêm owner hoặc bỏ qua employee guard.

#### Scenario: Seed dữ liệu mẫu thất bại

- **WHEN** seed lỗi sau bootstrap đã commit
- **THEN** store/owner và Store Key trả về vẫn dùng được; cảnh báo tại thông báo chung sau đăng nhập normal owner, kèm nút “Thử lại dữ liệu mẫu”. Chủ quán chủ động thử lại các stage chưa commit theo PIN-05, không chạy lại stage đã commit, không ghi đè dữ liệu/PIN đã sửa và không gọi lại bootstrap để reset owner/PIN. Vị trí này thay yêu cầu “từ Cài đặt” theo R06-A ngày26/10/2026.

#### Scenario: Tạo store sau activation

- **WHEN** flow tạo store hợp lệ chạy thành công
- **THEN** một store/settings/owner active với role owner, không có admin legacy; owner có catalog defaults và đăng nhập theo PERM-20.

#### Scenario: Bootstrap lại

- **GIVEN** store đã có owner
- **WHEN** caller retry nguyên request, đổi ownerId hoặc tự chèn field PIN không được hỗ trợ
- **THEN** retry trả identity an toàn không phát lại secret; ownerId khác trả BOOTSTRAP_CONFLICT; field PIN tự chèn trả INVALID_WRITE_REQUEST. Không thêm hoặc reset owner, dữ liệu/PIN cũ giữ nguyên.
