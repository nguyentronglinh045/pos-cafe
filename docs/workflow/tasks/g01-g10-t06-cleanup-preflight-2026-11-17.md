# T06 mục 9.5 — Phụ thuộc trước khi dọn ba quán thử

Ngày 17/11/2026, Linh giao dọn những quán không cần dùng lại, tiếp tục kế hoạch và hỏi trước khi làm phần thiếu thông tin. [Bảng kiểm kê và phạm vi ban đầu](g01-g10-t06-staging-inventory-2026-11-17.md).

Sau khi xem phương án, Linh đã chọn giữ cả ba quán. Bảng dưới đây ghi kết quả kiểm tra trước quyết định. [Quyết định hiện hành](#t06-retention-decision-2026-11-17).

Phương án dọn ban đầu nêu `0005`, `0017`, `0018`. Ca FE-06 đầy đủ dùng `0008`, lần kiểm chính thức FE-02 không cần quán, và lần F5 đầy đủ dùng `0021`. Trong mã, tài liệu, artifact và ghi chú local đã khảo sát, không thấy ba UUID hoặc alias này được gán cho kịch bản hồi quy sắp tới. Kết luận chỉ áp dụng cho phạm vi đã đọc. Runner `smoke:supabase` ở candidate vẫn gọi hàm tạo quán qua giao diện cũ. Lượt này chưa chạy smoke hay thay runner. Nguồn ở `D:/Workspace/pos-cafe-t06-local/tests/supabase/pos-cafe-supabase.spec.ts:6`. Các quán còn lại tiếp tục giữ theo kế hoạch, gồm `0022/0023` cho R07.

## Đọc lại staging lúc 15:49:53 UTC+7

SQL Editor ở project đã xác minh `ineckiashpwloncxnbqx`, `BEGIN READ ONLY` và `ROLLBACK`. Khớp cả số và UUID trên ba quán. Tổng staging vẫn là 26 quán, 29 Auth user, 17 tài khoản chủ. Đối chiếu 183 tổ hợp cột UUID và quán qua catalog ở `public`, `private`, `auth`, kèm phép kiểm Storage theo prefix và chủ object. Phép kiểm nhắm các cột quan hệ đã liệt kê, chưa thay diễn tập xóa và phục hồi.

| Tài nguyên | 0005 | 0017 | 0018 | Đề xuất |
| --- | ---: | ---: | ---: | --- |
| Store, Auth kỹ thuật và Auth identity khớp | 1 mỗi loại | 1 mỗi loại | 1 mỗi loại | Sao lưu, gỡ đúng cặp UUID đã kiểm kê. |
| Chủ, store settings, seed workflow và signal | 1 mỗi loại | 1 mỗi loại | 1 mỗi loại | Giữ tài khoản chủ. Sao lưu và gỡ settings, workflow, nhân viên chủ của quán và signal. |
| Operation `created`, reservation, Auth dispatch, mail Store Key `submitted`, audit tạo quán | 1 mỗi loại | 1 mỗi loại | 1 mỗi loại | Nếu chọn dọn, sao lưu và gỡ theo thứ tự khóa ngoại. Đây là phần lịch sử được đưa ra khi xin quyết định. |
| Auth session / phiên PIN còn hiệu lực / phiên PIN cũ | 0 / 0 / 1 | 0 / 0 / 0 | 0 / 0 / 0 | Gỡ hàng phiên PIN cũ của `0005` trước khi xóa quán. |
| Intent, challenge OTP và mail OTP | 1 mỗi loại | 1 mỗi loại | 1 mỗi loại | Giữ. |
| Quán cùng chủ / suất đang giữ / object theo UUID hoặc owner | 1 / 0 / 0 | 1 / 0 / 0 | 1 / 0 / 0 | Sau dọn, mỗi chủ từ một quán xuống không có quán, trả lại một suất trong trần 5. |

Ba biên nhận giao Store Key đều hết hạn. Mỗi audit tạo quán trỏ tới chính quán và tài khoản chủ. Catalog xác nhận `create_operations.created_store_id` và `store_admin_log.store_id` tham chiếu quán, còn mail Store Key và reservation tham chiếu operation. Auth dispatch tham chiếu reservation. `created_store_id` phải tồn tại khi operation có trạng thái `created`. Muốn giữ nguyên lịch sử live và câu trả lời `created` thì cần giữ quán với hợp đồng hiện hành. [Lược đồ candidate](../../../openspec/changes/add-owner-account-and-store-provisioning/design.md).

Mã tra cũ sẽ trả `not_accepted` sau khi gỡ operation. Luồng gửi mã có thể phát OTP mới cho intent cũ khi không còn operation và yêu cầu mới qua đủ cổng kiểm. OTP cũ đã hết hạn. Đây là tác động suy từ code base `610f198` cộng WIP đang có, chưa thực hiện phép xóa hoặc gửi thử. Nguồn ở `D:/Workspace/pos-cafe-t06-local/supabase/candidate/owner-provisioning-verify.sql:210` và `owner-provisioning-otp.sql:99`.

<a id="t06-retention-decision-2026-11-17"></a>

## Quyết định của Linh ngày 17/11/2026

**Giữ `0005`, `0017`, `0018` trên staging.** Linh chốt trong chat T06 mục 9.5 bằng lời “cứ kệ 3 quán đó, nếu cần tạo quán mới”. Kết thúc đề xuất dọn ba quán. Nếu một ca kiểm về sau cần quán mới, tạo fixture riêng trong phạm vi ca đó. Lượt này chỉ ghi quyết định, chưa phát sinh ca cần quán mới.

**Đóng 9.5 ngày 17/11/2026.** Linh xác nhận trong chat T06 rằng giữ ba quán được tính là đã xử lý dữ liệu thử và giao đánh dấu 9.5 hoàn tất. Quyết định này thay yêu cầu thực hiện bước dọn trong riêng mục 9.5 và giữ lịch sử của ba quán. Phần test tay có bằng chứng từ hai vòng TC-104 và các checkpoint staging giai đoạn 1. [Kiểm kê và bằng chứng test](g01-g10-t06-staging-inventory-2026-11-17.md) · [Checklist](../../../openspec/changes/add-owner-account-and-store-provisioning/tasks.md#9-kiểm-thử-giai-đoạn-1).

## Các phương án đã xem trước khi chốt

- **Dọn sau khi có bản sao phục hồi.** Chỉ gỡ ba quán, ba Auth kỹ thuật và các hàng phụ thuộc trực tiếp trong bảng. Giữ ba tài khoản chủ, dữ liệu intent/challenge/mail OTP, 23 quán khác, ba Auth không gắn quán và sáu object Storage. Một phần audit và mail của ba quán sẽ chỉ còn trong bản sao, cùng bằng chứng lịch sử hiện có.
- **Giữ.** Giữ ba quán cùng operation, audit và kết quả tra. Tạo quán mới cho ca cần fixture mới. Linh chọn phương án này.

Phương án dọn từng dự kiến kiểm lại danh sách tham chiếu và hàng phục hồi, bao gồm seed stage phụ thuộc workflow. Bản sao riêng đúng ba quán sẽ nằm trên ổ D và lấy qua kết nối chỉ đọc. Dữ liệu Auth và bản mã trong backup cần lưu ngoài Git, được bảo vệ bằng mã hóa và chỉ đọc trong tiến trình sao lưu. Khả năng đọc và khôi phục sẽ được kiểm ở PostgreSQL cô lập với FK và trigger hiện hành. Chưa tạo bản sao dữ liệu nhạy cảm hoặc DB mới ở checkpoint này.

Recipe dự kiến chỉ áp khi backup và diễn tập đạt, số/UUID, liên kết Auth, số hàng và trạng thái phiên còn khớp. Các hàng con sẽ được gỡ trước hàng cha trong một giao dịch, với các constraint hoãn được kiểm trước commit. `employees_owner_boundary` và `stores_owner_boundary` đang bật. Hậu kiểm dự kiến 23 quán và 26 Auth user, ba owner vẫn tồn tại, số sequence và tài nguyên được giữ khớp với trước dọn. Nếu phát hiện hàng mới hoặc phụ thuộc chưa bao phủ thì rollback và đối chiếu lại.

Biên nhận truy vấn chỉ đọc ở `D:/Workspace/pos-cafe-t06-pg16-runtime/t06-inventory-20261117/cleanup-dependencies.json`.
