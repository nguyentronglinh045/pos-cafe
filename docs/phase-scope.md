# Phạm vi dự án

Phạm vi sản phẩm hiện hành được đọc cùng [features](features.md) và [giới hạn](limitations.md), đối chiếu main711a22e ngày 25/10/2026. Không thay quyết định nghiệm thu/deploy bằng trạng thái có code.

## Phần đang có trên main

| Nhóm | Phạm vi |
| --- | --- |
| Vào hệ thống | Ghép Store Key, chọn nhân viên/PIN, tạo quán và đổi PIN tạm owner, seed có workflow |
| Phân quyền | Catalog 15 quyền, bốn role bật, projections theo purpose, quyền quản trị/in riêng; backend acceptance còn HOLD |
| Vận hành | Bàn/khu/tầng, dine-in/takeaway, món/modifier, nháp, gọi thêm và giữ giá lịch sử |
| Thu tiền | Cash toàn đơn hoặc split-pay, tiền thiếu/thối, receipt, tra cứu lệnh chưa rõ kết quả |
| Quản trị | Menu/ảnh món, sơ đồ/decor, nhân viên, settings theo quyền |
| Tra cứu | History đơn kết thúc, void-paid có lý do/audit, báo cáo doanh thu |
| UI | B01/B02/B03 đã tích hợp; chưa thay kiểm thiết bị thật bằng viewport headless |

## Giới hạn không đổi

Online-only; cash-only; browser print; bếp chỉ preview. Gộp/chuyển bàn, refund/discount, kho/loyalty/ca, offline và quản lý chuỗi không được đưa vào chương trình chuẩn hóa. Owner/email provisioning vẫn là phạm vi khác với role owner trong catalog.

## Quyền của lượt chuẩn hóa 25/10/2026

Ưu tiên chỉnh lý docs trước refactor. Được sửa nội dung, mục lục, cấu trúc/liên kết có thể phục hồi, kiểm và xuất bản docs sau review. Không sửa app/DB, chạy backend, dispatch CI, deploy hoặc cleanup worktree. Bỏ/chuyển bằng chứng cần quyết định theo nhóm cụ thể. [Handoff](workflow/tasks/docs-normalization-2026-10-25.md).

## Lịch sử thay đổi phạm vi đến tháng 8

Các mốc sau ghi điều đúng tại thời điểm đó, kể cả role admin/5 quyền và baseline cũ. Không dùng chúng thay bảng hiện hành trên.

### Scope Update 2026-06-22

- Upload ảnh món được đưa vào scope hiện tại cho Menu Editor và màn chọn món POS.
- Upload ảnh decor vẫn là mở rộng sau phase này.

### Scope Update 2026-06-23

- Menu Editor được polish thêm: ảnh card món dùng cover, món hết hàng có overlay `Đã bán hết`, selector danh mục chuyển sang select và sắp xếp món dùng switch swap vị trí.
- Giới hạn upload ảnh món theo bucket Supabase: JPG/PNG/WebP, tối đa 5MB.

### Scope Update 2026-07-16

- Hủy đơn đã thanh toán được đưa vào scope hiện tại: mặc định admin có quyền `order.voidPaid`; cashier chỉ thực hiện được khi có grant override và không bị deny.
- Đơn paid bị hủy giữ nguyên số tiền/payment để đối soát, ghi người hủy/thời điểm/lý do, bị loại khỏi doanh thu và được cộng vào `voidCount`/`voidAmount`.
- Phase 19 hoàn thành seam quyền theo hành động và consumer đầu tiên; phần editor/enforce rộng hơn được hoàn tất tiếp ở phase 20.

### Scope Update 2026-07-19

- Employees Drawer đã có editor checkbox theo quyền hiệu lực cho từng nhân viên; đổi role reset default, lưu diff grants/denies và chặn hạ role admin active cuối.
- 5 quyền runtime được enforce ở feature flow; Order/Payment UI có soft gate và migration 012 guardrail ba RPC `submit_order_changes`, `pay_order`, `pay_order_items`.
- Client nhận permission mới khi đăng nhập lại; server guardrail đọc override live. Migration 012 đã apply và Supabase E2E 5/5 pass ngày 2026-07-19.

### Scope Update 2026-07-22

- Decor built-in đầy đủ được đưa vào Floor Editor: 9 texture tường và 131 ảnh chia nhóm Cây/Ghế/Thiết bị/Khác.
- Admin chọn hoặc đổi mẫu trong popup; Floor Editor và POS Floor cùng render ảnh từ `asset_key` đã lưu. Không đổi schema/database migration.
- Đây là catalog đóng gói cùng ứng dụng, không phải upload ảnh decor của người dùng; upload/custom asset vẫn thuộc mở rộng sau phase.
- Sau audit code/docs, role/module kitchen được chốt là future-only: bỏ khỏi nav, drawer registry, màn PIN và form nhân viên; giữ enum/schema/component scaffold để phát triển sau.

### Scope Update 2026-07-25

- Employees Drawer được redesign thành layout hai pane: danh bạ/filter ở trái và hồ sơ/quyền/PIN ở phải.
- Bộ lọc hiện hành gồm Tất cả, Quản lý, Thu ngân và Tạm khoá, có count; chọn nhân viên đầu tiên tự động khi tải xong.
- Trạng thái đăng nhập, role, quyền và reset PIN được chỉnh trong cùng form; có dirty confirm khi đổi lựa chọn.
- Không cho tự tạm khóa tài khoản đang đăng nhập hoặc tạm khóa/hạ role quản lý active cuối. Không có migration mới.

### Scope Update 2026-07-27

- Floor Editor có thêm catalog 11 ảnh nền bàn built-in và lựa chọn nền trắng mặc định; bàn mới và dữ liệu cũ dùng trắng khi `background_asset_key` là `null`.
- Admin chọn/đổi nền từ inspector; lựa chọn persist qua changeset và hiển thị đồng nhất trên Floor Editor/POS. Status bàn tiếp tục dùng border xanh/cam.
- Migration 013 thêm `tables.background_asset_key`; đã được apply và xác minh PostgREST đọc được cột cùng full floor-plan select.
- Đây là catalog đóng gói, không phải upload nền bàn. Upload/custom table background tiếp tục nằm ngoài scope.

### Scope Update 2026-07-30

- Root docs được audit lại theo `main@b7b7262` và chuẩn hóa thành source material cho báo cáo.
- Order history filter, report master/detail và các catalog floor đã là **implemented**, không còn nằm trong nhóm “làm nếu kịp”.
- Bổ sung traceability yêu cầu, baseline kiểm thử, giới hạn và hướng phát triển; tách rõ bằng chứng local, cloud và deployment readiness.


### Scope Update 2026-08-21

- Root docs được rà lại theo `main@c7f2f4e` và thống nhất một baseline duy nhất; trước đó các file ghi bốn mốc khác nhau (`3d9b64a`, `1b0098b`, `b7b7262`, `c7f2f4e`).
- Màn Lịch sử đơn đổi hành vi ở `main@c7f2f4e`: mặc định liệt kê gần đây không giới hạn ngày, số hiển thị là số thứ tự theo bộ lọc chứ không phải số bill, và ô tìm kiếm đã bị gỡ khỏi giao diện. Xem [implementation-log/phase-26-history-recent-listing.md](implementation-log/phase-26-history-recent-listing.md).
- Tìm kiếm trong lịch sử đơn chuyển từ **implemented** sang **seam chưa có entry point**; không còn được kể là chức năng hiện hành.
- Bổ sung phân tích bảo đảm ACID và transport realtime vào [architecture.md](architecture.md), kèm hai dòng claim an toàn tương ứng trong [report-source-map.md](report-source-map.md).
- Quản lý spec chuyển sang OpenSpec đặt tại `openspec/` trên chính nhánh này: 14 baseline spec mô tả hiện trạng và 24 đề xuất mở rộng đang chờ chốt.

## Phần Hoàn Thiện Tùy Chọn

- Exit animation khi đóng drawer/popup và visual polish bổ sung.
- Tìm kiếm/favorite/tối ưu asset cho Floor Editor.
- Code splitting/lazy-load để xử lý chunk-size warning.
- Bổ sung insight/report nâng cao ngoài các metric hiện có.
- Refresh screenshot/diagram artefact cho báo cáo ở nơi lưu binary riêng.

## Mở Rộng Sau Phase Này

| Hướng mở rộng | Lý do hoãn | Hướng triển khai dự kiến |
| --- | --- | --- |
| Gộp/chuyển bàn | Cần quy tắc merge order, conflict và audit mới | Thiết kế RPC transaction riêng và lịch sử thao tác |
| Kitchen queue/role bếp thật | Chưa có queue backend và item workflow | Persist ticket/item status, màn bếp và realtime riêng |
| QR/bank/e-wallet | Cần provider/callback/đối soát ngoài | Payment provider abstraction và transaction ledger |
| Discount/voucher/refund | Làm rộng pricing, permission và report | Bổ sung policy tính giá, audit và report adjustment |
| Upload decor/nền bàn | Cần storage lifecycle và quyền ghi | Tái dùng pattern upload ảnh món, thêm tối ưu asset |
| Offline-first/local database | Tăng lớn độ phức tạp sync/conflict | Thêm local adapter, outbox và conflict policy |
| Native printer/ESC/POS | Phụ thuộc driver/phần cứng | Service/adapter in cục bộ sau `IPrintPort` |
| Kho, loyalty, ca/chấm công | Ngoài core flow POS hiện tại | Mỗi nhóm cần domain và module độc lập |
| Super-admin/chuỗi chi nhánh | MVP hiện cô lập từng store, chưa có aggregate UI | Tenant hierarchy và quyền cấp tổ chức |
| Custom role editor | Runtime có catalog 15 quyền nhưng chưa có editor tạo role tùy ý | Mở rộng catalog/role với hợp đồng và audit phù hợp |

## Ghi Chú Quan Trọng

- Một số màn optional có thể đang tồn tại dưới dạng UI scaffold để chứng minh seam, nhưng không được tính là thiếu nếu chưa có logic thật trong phase tiểu luận.
- Schema có chừa field/enum cho mở rộng sau như `payment_method`, `discount_type`, `order_item_status`, nhưng UI phase này chỉ cần phần đã khóa ở mục bắt buộc.
- Khi bảo vệ, nên nói rõ: dự án ưu tiên vận hành cafe nhỏ, realtime online, dữ liệu quan hệ và demo end-to-end thay vì mở rộng quá rộng.
- Xem [requirements.md](requirements.md) cho yêu cầu có mã và [limitations.md](limitations.md) cho giới hạn/hướng phát triển đầy đủ.
