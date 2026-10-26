# Kiểm quyền tại database — phạm vi còn lại

Đối chiếu 26/10/2026, main `711a22e`. Mục tiêu G04 giữ nguyên. Đây là proposal khảo sát cho phần ngoài phạm vi đã chuyển sang [redesign-permission-model](../redesign-permission-model/proposal.md#quyết-định-đã-chốt); chưa có bộ spec đầy đủ hoặc quyền triển khai phần dư. [Lịch sử và bảy câu hỏi gốc](history.md) giữ nguyên để truy vết.

## Ánh xạ từng nhóm yêu cầu gốc

| Nhóm gốc | Nguồn tiếp nhận / ranh giới |
| --- | --- |
| Danh tính phiên nhân viên | [Permission session](../redesign-permission-model/specs/employee-session/spec.md) và [PIN delta](../force-default-pin-change/specs/employee-session/spec.md); Store Auth là tenant boundary, employee session phục vụ authority. Không dùng ID tự khai thay chứng minh phiên. |
| Kiểm quyền đọc và ghi ở server | Q1–Q15 và [access-control](../redesign-permission-model/specs/access-control/spec.md) đã nhận toàn catalog15, gồm projection/RPC, direct SELECT/DML, ảnh và signal liên quan. Có source không chứng minh grants/schema đích đã activation. |
| Inventory mọi bảng/lời gọi | Inventory trong change permission chỉ chứng minh phạm vi của change đó. Phải so inventory với bề mặt thực khi mở phần dư; giữ riêng vòng đời owner/email và trạng thái khóa store, không suy “toàn DB an toàn”. |
| Audit thao tác nhạy cảm | [Employee-management](../redesign-permission-model/specs/employee-management/spec.md), financial contract và audit trong permission. Không thay bằng một báo cáo audit đầy đủ cho người dùng cuối; retention ngoài scope đã chốt cần xác định riêng. |
| Cập nhật NFR-02 | [Requirements](../../../docs/requirements.md) và [kiến trúc](../../../docs/architecture.md#permission) đã phân biệt tenant/employee authority, implementation và backend HOLD. Không còn lấy câu “không claim per-employee” lịch sử làm mô tả hiện hành. |

Nguồn implementation đã đọc: [authority/session](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/ports/permissions.ts#L12), [catalog](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/core/permissionCatalog.ts#L5), [runtime composition](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/adapters/supabase/repos.ts#L17). Spec/evidence chuyên biệt quyết định expected và scope kiểm, không lấy bảng này làm audit bảo mật runtime.

## Bảy câu hỏi cũ đã đi tới đâu

| Câu gốc | Trạng thái hiện nay |
| --- | --- |
| 1. Có cần làm không? | G04 nằm trong mục tiêu đã được GV xác nhận theo chủ dự án; catalog15 đã chọn server enforcement. Không hỏi lại có bỏ toàn bộ G04. Phạm vi dư phải khảo sát. |
| 2–3. Danh tính và luồng Store Key/PIN | Catalog15 giữ Store Auth cùng employee session; owner email là change riêng. Không tự chuyển mọi nhân viên sang tài khoản email. |
| 4. Chặn đọc hay cả ghi? | Q1 đã chọn cả đọc/ghi trong catalog; phần ngoài inventory chưa được nhận phủ. |
| 5. Tương thích thiết bị | Compatibility/session/revision theo permission và PIN delta. Cách chuyển đổi đích thực vẫn theo gate release; trang này không duyệt migration. |
| 6. Audit gì và giữ bao lâu? | Nghĩa vụ trong permission giữ nguyên; audit/retention ngoài phạm vi vẫn cần chốt khi xác định bề mặt còn thiếu. |
| 7. Chỉ làm tiền trước? | Giao thức v1 là nền lịch sử; permission mở rộng catalog15. Không hạ scope đã duyệt về chỉ ba RPC tiền từ phương án cũ. |

## Phần còn mở và phụ thuộc

- So inventory phần dư: đặc biệt hành vi khóa store ở server, owner/email/provisioning và các capability tương lai. [R06](../../../docs/spec-reconciliation.md#phần-còn-thiếu-và-phân-loại) giữ chỗ chưa có kết luận.
- Gắn từng bề mặt dư với actor/tenant/đọc/ghi, deny test, audit, lifecycle và gate trước khi lập spec triển khai; không tự khẳng định bề mặt đó đang bị hở.
- Full backend/PIN/Storage/Realtime acceptance vẫn theo [bản đồ evidence](../../../docs/testing.md#bản-đồ-bằng-chứng). Không tạo lab hoặc chạy trên dữ liệu thật từ task tài liệu.
- Không còn áp quy tắc chung “owner email luôn phải xong trước mọi enforcement”: catalog15 có quyết định/implementation riêng; thứ tự phần dư theo dependency thực.

## Quyết định đã chốt

Q1–Q15/PIN chỉ thay phần được nêu trong hồ sơ chính. Chủ dự án ngày26/10 cho phép tổ chức lại tài liệu theo hiện trạng, giữ evidence và chưa refactor code; đây không phải phê duyệt nghiệp vụ mới cho phần dư. Không xóa yêu cầu, hạ gate hoặc archive như hoàn tất.

## Câu hỏi phải chốt trước khi làm

Không còn câu hỏi chặn lượt tổ chức tài liệu26/10 đã được giao. Các vấn đề triển khai còn mở được nêu ở phần phạm vi/còn lại và hồ sơ chính; không nhận bộ spec phần dư đã sẵn sàng code. Câu hỏi cũ và bối cảnh câu trả lời giữ trong [lịch sử](history.md#câu-hỏi-phải-chốt-trước-khi-làm).

## Tra cứu mục cũ

Các điểm neo được giữ để liên kết cũ vẫn tới được đúng bối cảnh.

| Mục lịch sử | Nguồn nguyên bản |
| --- | --- |
| <a id="siết-ranh-giới-bảo-mật-quyền-nhân-viên-xuống-tầng-database"></a>Siết ranh giới bảo mật quyền nhân viên xuống tầng database | [Đọc lịch sử](history.md#siết-ranh-giới-bảo-mật-quyền-nhân-viên-xuống-tầng-database) |
| <a id="ranh-giới-cập-nhật-ngày-2026-09-15"></a>Ranh giới cập nhật ngày 2026-09-15 | [Đọc lịch sử](history.md#ranh-giới-cập-nhật-ngày-2026-09-15) |
| <a id="liên-quan-quyết-định-chống-trùng-08092026"></a>Liên quan quyết định chống trùng 08/09/2026 | [Đọc lịch sử](history.md#liên-quan-quyết-định-chống-trùng-08092026) |
| <a id="why"></a>Why | [Đọc lịch sử](history.md#why) |
| <a id="what-changes"></a>What Changes | [Đọc lịch sử](history.md#what-changes) |
| <a id="capabilities"></a>Capabilities | [Đọc lịch sử](history.md#capabilities) |
| <a id="new-capabilities"></a>New Capabilities | [Đọc lịch sử](history.md#new-capabilities) |
| <a id="modified-capabilities"></a>Modified Capabilities | [Đọc lịch sử](history.md#modified-capabilities) |
| <a id="impact"></a>Impact | [Đọc lịch sử](history.md#impact) |
| <a id="ngoài-phạm-vi"></a>Ngoài phạm vi | [Đọc lịch sử](history.md#ngoài-phạm-vi) |
| <a id="phụ-thuộc"></a>Phụ thuộc | [Đọc lịch sử](history.md#phụ-thuộc) |
| <a id="ghi-chú-về-phương-án-thu-hẹp"></a>Ghi chú về phương án thu hẹp | [Đọc lịch sử](history.md#ghi-chú-về-phương-án-thu-hẹp) |
