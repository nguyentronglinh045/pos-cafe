# Giới hạn và phần chưa nghiệm thu

Đối chiếu source `main@711a22e`, ngày 25/10/2026. Trang này phân biệt giới hạn sản phẩm, giới hạn kiểm chứng và hồ sơ lịch sử; không biến một gate bắt buộc còn thiếu thành “đã xong có hạn chế”.

## Kiểm Thử, Triển Khai Và Artefact

- B01/B02/B03 đã merge và có kết quả UI/local theo [testing](testing.md). Backend acceptance/toàn hệ thống vẫn DEFERRED/NOT_ACCEPTED; T04, bảy service profiles và supplemental obligations chưa được đóng bởi lần merge UI.
- Chưa deploy, migration hoặc live activation trong đợt tích hợp/chỉnh lý này. Bằng chứng phát hành phase 27 tháng 9 là lịch sử, không xác nhận main hiện tại đang chạy ở đích.
- Hardware tablet/phone, máy in và browser zoom thật chưa được kiểm trong gói UI; headless viewport không thay thiết bị vật lý.
- Bộ spec15 quyền, forced-PIN và hồ sơ backend đã được hòa giải trong [gói xuất bản WIP](workflow/tasks/docs-wip-publication-2026-10-25.md). Có đầy đủ file/kết quả lịch sử không chứng minh backend hiện hành đã đạt; baseline capability vẫn chưa apply/archive đầy đủ delta.

## Bảo Mật Và Phân Quyền

Main đã có catalog 15 quyền, projections, phiên và refresh authority. Không còn mô tả runtime là “5 quyền và phải đăng nhập lại mới cập nhật UI”. Tuy nhiên code/mock không chứng minh direct API deny, Storage/Realtime hay mọi profile backend đã đạt.

Owner trong mô hình quyền không đồng nghĩa đã có tài khoản chủ bằng email xác thực hoặc recovery tự phục vụ. Luồng bắt đổi PIN tạm có trong source; không giữ nhận định cũ “chưa có cờ/luồng đổi PIN”. Chống brute-force, recovery và quy trình operator phải được nghiệm thu theo phạm vi riêng. Nguồn: [identity types:1](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/domain/permissions.ts#L1), [candidate identity:13](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-identity.sql#L13).

Các quyết định Q5/Q6 yêu cầu xác minh owner qua hồ sơ hỗ trợ ngoài app và audit operator; không coi Store Key/contact tự khai là bằng chứng sở hữu. [Spec recovery](../openspec/changes/redesign-permission-model/design.md) và [runbook snapshot](runbooks/README.md) giữ điều kiện lịch sử; không cấp quyền recovery live. N01–N03 giữ giới hạn ảnh/gateway và phép đo: private orphan do Storage/DB không cùng transaction, byte cached không thu hồi ngay, origin/revalidate có chi phí chưa đo và chưa có rate limit riêng cho public GET. Đây là rủi ro/điều kiện thiết kế, không chứng nhận sự cố hoặc số đo mới; [nguồn quyết định](../openspec/changes/redesign-permission-model/proposal.md).

## Online Và Realtime

Online-only, không local database/outbox để bán hàng offline. Query live poll 5 giây; authority revision poll 30 giây và refresh deadline 5 giây khi foreground. Đây không phải SLA mạng hoặc bảo đảm hội tụ khi server lỗi. Runtime mới dùng signal tables; lỗi thiếu subscription bảng nối ghi ở adapter legacy không tự là lỗi runtime mới. [Kiến trúc](architecture.md#realtime), [lifecycle:47](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/core/permissionLifecycle.ts#L47).

Đối chiếu trực tiếp candidate hiện hành: [permission-signals.sql:39](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-signals.sql#L39) cố ý không tạo trigger cho `menu_item_option_groups`; [changes.sql:155](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-changes.sql#L155) cho phép thay riêng liên kết này, còn [menu query:21](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/features/pos/usePosData.ts#L21) không bật live polling. Vì vậy thay đổi chỉ liên kết món–nhóm tùy chọn vẫn cần một lần tải lại/signal khác/reconnect thích hợp để thiết bị khác cập nhật. Đây là giới hạn đọc từ code, chưa phải kết quả tái hiện live trong lượt docs; cần test và quyết định phạm vi ở [G09](workflow/tasks/docs-thesis-audit-2026-10-25.md). Không thêm raw subscription để bỏ qua contract permission.

## Thanh Toán Và Đối Soát

Tiền mặt là phương thức thực hiện; thẻ/chuyển khoản/QR chưa xử lý provider/callback. Split-pay tạo các đơn độc lập, chưa có màn tổng hợp cả phiên bàn; refund, discount/voucher, price override, mở két và ca/kiểm két ngoài phạm vi. [PaymentDrawer:47](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/app/drawers/pos/PaymentDrawer.tsx#L47), [ADR Instant Pay](architecture.md#adr-instant-pay--tách-đơn-độc-lập-split-order).

## Giá Và Ghi Nhận Doanh Thu

Phần đã gọi giữ snapshot giá/options, phần mới theo quote hiện tại. Chưa có price history toàn menu. Business date chốt khi tạo đơn; TTL 24 giờ của pending operation không tự đóng đơn qua ngày. Receipt legacy thiếu metadata phải giữ dấu chưa biết. Khóa POS ở phạm vi store là đánh đổi tính đúng, chưa có benchmark production để nhận khả năng chịu tải. [Giao thức đã chốt](../openspec/changes/add-idempotent-write-operations/design.md), [financial candidate](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-financial.sql#L1).

## In Ấn Và Bếp

Browser preview/print chưa là tích hợp native/USB/ESC/POS. Quyền in lại kiểm soát chức năng ứng dụng, không ngăn người đã đọc hóa đơn chụp/lưu/in ngoài app; trình duyệt không xác nhận số bản giấy. Phiếu bếp chỉ preview, chưa có queue backend hoặc trạng thái chế biến. [Print boundary](architecture.md#print).

## Ảnh và dữ liệu phát sinh

Candidate dùng private staging/gateway và published lookup; DB/Storage không có transaction chung, cleanup lỗi có thể để lại orphan. Byte đã được tải không thể hứa thu hồi ngay. Chưa có bằng chứng tải production/chi phí gateway trong lượt docs. Bằng chứng cần giữ được phân loại ở [hồ sơ chỉnh lý](workflow/tasks/docs-normalization-2026-10-25.md); không xóa ảnh/JSON/trace chỉ vì generated.

## Phạm Vi Sản Phẩm

Chưa có gộp/chuyển bàn, kho/nguyên liệu, khách hàng/loyalty, chấm công/ca, chuỗi chi nhánh hoặc custom role editor. Decor/nền bàn là catalog built-in, khác upload ảnh món. Các phần có schema nhưng chưa có luồng dùng được được liệt kê trong [features](features.md#seam-có-code-nhưng-chưa-dùng-trên-ui).

## UX Và Hiệu Năng

Landscape-first; portrait hiển thị hướng dẫn xoay. Không dùng số bundle/độ phủ tháng 8 làm số đo source tháng 10. Dirty-exit Employees Drawer là điểm cần rà theo kế hoạch NC-07, chưa coi mọi màn đã đồng nhất. Hiệu năng dài hạn, tải đa thiết bị và ngân sách dịch vụ cần phép đo riêng trước tối ưu. [Kế hoạch chuẩn hóa](workflow/tasks/post-integration-standardization-plan-2026-10-25.md).

Thứ tự xử lý theo [roadmap](roadmap.md); trang này không tự mở lại scope hoặc cho phép deploy.
