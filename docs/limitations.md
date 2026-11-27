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

## Tạo quán, Store Key và thư T06

- **Mất khóa mã hóa.** Nếu mất khóa của phiên bản dùng để mã hóa Store Key, không thể giải mã các bản ghi dùng phiên bản đó. Sao lưu khóa tách khỏi bản sao DB. Nếu không lấy lại được khóa, việc khôi phục truy cập cần cấp lại Store Key và ghép lại thiết bị. Luồng tự phục vụ thuộc giai đoạn 2. [Thiết kế bảo quản khóa](../openspec/changes/add-owner-account-and-store-provisioning/design.md).
- **Store Key trong hộp thư.** Thư giao Store Key có thể còn trong hộp thư sau khi ứng dụng đóng cửa sổ nhận key. Người đọc được thư có thể biết key. Nếu nghi lộ, liên hệ người vận hành dự án để xác định cách xử lý. Cấp lại Store Key tự phục vụ thuộc T08. [Quyết định về thư Store Key](../openspec/changes/add-owner-account-and-store-provisioning/proposal.md).
- **Thư mặc định của Auth.** Staging đã tắt signup công khai sau vòng TC-104 đầu. Tại lần kiểm TC-78, cơ chế chặn chung thư mẫu vẫn tắt. Theo REQ-OWNER-16, rủi ro còn lại đã được chấp nhận: thư mẫu có thể đến hộp thư của nhóm và có thể phát sinh tài khoản rác. TC-78 xác nhận mã mời của Auth không cấp quyền tạo quán hay xác nhận đã lưu key. [REQ-OWNER-16](../openspec/changes/add-owner-account-and-store-provisioning/specs/owner-account/spec.md#requirement-req-owner-16--chặn-thư-mặc-định-của-supabase-auth) · [Bằng chứng TC-78](workflow/tasks/g01-g10-t06-owner-implementation-2026-11-11.md#tc-owner-78-103-2026-11-16).
- **Kết quả tạo chưa rõ.** Khi Auth hoặc DB chưa xác định được kết quả, lượt tạo có thể giữ một suất cho tới khi có xác minh riêng. Lượt tra chỉ đọc và hệ thống từ chối ghi muộn theo hợp đồng. Tự động đối soát, dọn tài khoản dở và cảnh báo cho trường hợp này thuộc phạm vi sau đồ án theo quyết định 48. [Hợp đồng và quyết định](../openspec/changes/add-owner-account-and-store-provisioning/proposal.md#quyết-định-đã-chốt).
- **Phạm vi đã kiểm.** Protected Preview và staging đã kiểm OTP, ghép, PIN và R07. Gói SQL/Edge đã vào `main` tại `9a1f23d` qua PR #32. T06 còn chờ kiểm thử hồi quy trên bản ứng viên phát hành để hoàn tất nghiệm thu. Hộp thư gửi riêng là việc T05. Hai nhãn mock trên Preview còn chờ sửa. [PR #32](https://github.com/nguyentronglinh045/pos-cafe/pull/32) · [Việc còn lại của T06](workflow/tasks/g01-g10-t06-owner-implementation-2026-11-11.md#t06-con-lai-2026-11-17).

## Đổi Store Key T08

Linh chốt A + M-A ngày 25/11/2026. Phạm vi hiện thực được theo dõi riêng trong hồ sơ T08. [Quyết định 59–60](../openspec/changes/add-owner-account-and-store-provisioning/proposal.md#quyết-định-đã-chốt) · [Hồ sơ T08](workflow/tasks/g01-g10-t08-session-review-2026-11-24.md).

- **Kết quả Auth chưa rõ.** Khi đối soát lỗi sáu lần trong cùng pha, hệ thống lưu một cảnh báo và dừng tự động. Giữ `pending` giúp tránh phát lại lệnh có thể đến muộn. Trong lúc đó quán bị bỏ qua khi gửi lại key. Thiết kế yêu cầu đổi email, chuyển quyền và reset phải chờ. Phần tích hợp của các thao tác này và quy trình người vận hành nằm trong hồ sơ T08. Hết thời gian chờ không tự mở lại lượt.
- **Thư gửi chậm.** Hàng rào kiểm thế hệ và chủ hiện hành trước khi gửi, giữ quy trình nhận key trực tiếp qua email. Thư đang gửi hoặc chưa rõ kết quả có thể trì hoãn đổi key, đổi email và chuyển quyền. SMTP đã tiếp nhận có thể giao thư cũ sau một lần đổi key, email hoặc chủ. Nếu chỉ đổi email hoặc chuyển quyền, thư ở hộp thư cũ có thể vẫn chứa key còn hiệu lực.
- **Phiên thiết bị.** Theo quyết định 42, access JWT đã cấp có thể còn được chấp nhận tới biên hết hạn của dịch vụ. Phép kiểm tuần tự 12.10 đo TTL staging 3.600 giây và thấy phiên cũ không làm mới được. Lượt 12.9 quan sát mốc UI quay lại màn ghép trên #0038. Kiểm đồng thời Auth vẫn cần bằng chứng riêng. [Bằng chứng 12.10](workflow/tasks/g01-g10-t08-session-review-2026-11-24.md#kiem-auth-1210-20261125).

## Dữ liệu mẫu và trạng thái cửa hàng

[Quyết định R06 ngày 26/10](spec-reconciliation.md#r06-decisions) chấp nhận retry seed tại thông báo chung. Reseed sau xóa được hoãn. T06 đã kiểm seed ban đầu và fallback thử lại/bỏ mẫu ở PostgreSQL cô lập. [Bằng chứng TC-09](workflow/tasks/g01-g10-t06-owner-implementation-2026-11-11.md#tc09-local-2026-11-17).

T06 đã kiểm nền khóa trạng thái ở DB và các nhánh R07 về ảnh, tín hiệu, PIN hạn chế và seed trên staging/cô lập theo từng ca. GET mới và revalidate qua gateway chịu cổng khóa. Byte đã tải và URL Storage public đời cũ có giới hạn riêng, trong đó probe legacy vẫn trả ảnh khi quán bị tạm ngưng. Hành vi giao diện và khôi phục phiên còn lại thuộc T10. [Bằng chứng R07](workflow/tasks/g01-g10-t06-owner-implementation-2026-11-11.md#r07-hosted-2026-11-15) · [Đối chiếu lịch sử 26/10](workflow/tasks/docs-requirements-reconciliation-2026-10-26.md).

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

## Việc chưa xử lý từ kiểm thử demo tuần 5

Ngày 08/11/2026 chủ dự án chốt các thay đổi dưới đây sau khi Ngọc và Lâm chạy thử bản demo; CX-04 chốt ngày 09/11/2026. Chưa làm, dự kiến phase tới. Hiện trạng, phương án và tài liệu phải sửa khi làm ở [hồ sơ 08/11](workflow/tasks/team-week05-answers-2026-11-08.md#việc-chưa-xử-lý).

- CX-01: bộ lọc sơ đồ làm sáng bàn khớp, không ẩn bàn khác.
- CX-02: luôn hiện nút tiền nhanh, bỏ dòng cảnh báo thay chỗ hàng nút; thiếu tiền thì tô đỏ ô nhập; thêm nút x xóa về 0.
- CX-03: với đơn đã gửi, nút bỏ thay đổi ghi "Bỏ thay đổi".
- CX-04: Lịch sử đơn hiện số đơn do database cấp như hóa đơn, chia nhóm theo ngày kinh doanh.
- CX-05: Món bán chạy bỏ số tiền đang lấy từ doanh thu cả ngày.
- CX-06: thêm ảnh vào hướng dẫn demo sau khi CX-01…05 xong; 20 góp ý cách viết của Lâm đã vào runbook ngày 09/11/2026.
- CX-07: bản trên Vercel là bản 17–18/10, cần deploy lại từ main.
- CX-09: cảnh báo trước khi tải lại trang lúc đơn còn món chưa gửi.

CX-08 đã hoàn tất việc lưu [minh chứng tuần 4–5 trên `docs`](workflow/tasks/team-week05-answers-2026-11-08.md#cx-08). Các thay đổi giao diện được theo dõi riêng ở danh sách trên.

Thứ tự xử lý theo [roadmap](roadmap.md); trang này không tự mở lại scope hoặc cho phép deploy.
