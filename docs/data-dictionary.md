# Từ điển dữ liệu

Đối chiếu ngày **26/10/2026**, source `main@711a22e71983e3d6aa17799649af05ce4c762555`. [Mô hình và ERD](data-model.md) là điểm vào; [thuật ngữ](glossary.md) giải thích cách gọi nghiệp vụ. Đây là từ điển **mô hình đích được mô tả trong source**, gồm nền, bridge và candidate sau bước activation theo controller; **không phải bản dump đầy đủ của DB đang chạy**. Đã có [đối chiếu metadata staging ngày26/10/2026](implementation-log/staging-schema-20261026/README.md); giới hạn phép kiểm và bảng marker ngoài mô hình được ghi riêng bên dưới. Nghiệm thu backend vẫn HOLD.

Phạm vi kiểm kê: **35 bảng/332 cột của mô hình source N1**, sau khi loại ba bảng legacy mà controller dọn. Có tính bảng cổng tương thích được chuẩn bị trước activation. `auth.users`, `storage.buckets`, `storage.objects` do nền tảng quản lý chỉ là điểm tích hợp, không nằm trong số này. Lượt bổ sung đã dùng MCP chỉ đọc để introspect staging; không tạo hoặc sửa schema/dữ liệu. Catalog staging có tổng 36 bảng/335 cột trong public/private, gồm 35 bảng của mô hình và một marker vận hành.

Nguồn chuyển trạng thái: [thứ tự fragments](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/scripts/permission-activation-bundle.mjs#L4), [đổi role và dọn bridge](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/scripts/permission-activation-steps.mjs#L36). Migrations 001–016 xác định nền trước activation; 017 thêm catalog/bridge. Vì controller áp 017 trong bundle, danh sách file 001–017 không phải hướng dẫn áp tất cả rồi chạy lại bundle. Recipe triển khai giữ ở hồ sơ backend; không thực hiện từ trang này.

## Cách đọc

- `Có` ở cột NULL: không có NOT NULL/PK trong khai báo cột; CHECK hoặc RPC có thể hạn chế thêm theo trạng thái. `Không`: cột bắt buộc, kể cả thành phần PK ghép.
- PK là khóa chính; UNIQUE hoặc unique index là ràng buộc duy nhất; FK là khóa ngoại. Các FK ghép có store_id giữ tenant khi cả phần tham chiếu cần thiết được cung cấp. ID không ghi FK thì không tự là FK.
- Cột “Khai báo cột” ghi mặc định, generated, CHECK/FK/UNIQUE tại cột, lược NOT NULL vì đã có cột riêng. `—` nghĩa không khai báo thêm, không có nghĩa tự sinh giá trị.
- CHECK cho phép kết quả SQL NULL; không suy NOT NULL từ một biểu thức kiểm tra. PK ép các thành phần khác NULL. [PostgreSQL 16, mục 5.4](https://www.postgresql.org/docs/16/ddl-constraints.html) là nguồn cho cách đọc này.
- Tiền nghiệp vụ là integer VND trong các trường giá/tổng; revision/replay bigint cần giữ chính xác khi qua JSON/JavaScript. Timestamp DB là timestamptz, ngày nghiệp vụ là date. Không đồng nhất timezone cửa hàng với múi giờ máy.
- Tài liệu chỉ liệt kê tên/kiểu khóa và hash, không chứa giá trị credential, token, PIN, MAC key hoặc dữ liệu người dùng.

## Chỉ mục bảng

| Nhóm | Bảng |
| --- | --- |
| Cửa hàng, nhân viên và phiên | [public.stores](#public-stores), [public.store_settings](#public-store_settings), [public.employees](#public-employees), [private.employee_sessions](#private-employee_sessions) |
| Thực đơn và sơ đồ bàn | [public.categories](#public-categories), [public.menu_items](#public-menu_items), [public.option_groups](#public-option_groups), [public.option_values](#public-option_values), [public.menu_item_option_groups](#public-menu_item_option_groups), [public.floor_areas](#public-floor_areas), [public.tables](#public-tables), [public.floor_decor_items](#public-floor_decor_items) |
| Đơn, thanh toán và sổ lệnh | [public.orders](#public-orders), [public.order_items](#public-order_items), [public.order_item_options](#public-order_item_options), [public.payments](#public-payments), [public.write_operations](#public-write_operations), [public.order_events](#public-order_events), [private.initial_receipt_print_grants](#private-initial_receipt_print_grants) |
| Danh mục quyền, yêu cầu quản trị và audit | [public.permission_roles](#public-permission_roles), [public.permission_catalog](#public-permission_catalog), [public.role_permission_defaults](#public-role_permission_defaults), [public.permission_catalog_state](#public-permission_catalog_state), [private.permission_request_mac_keys](#private-permission_request_mac_keys), [private.employee_admin_requests](#private-employee_admin_requests), [public.employee_admin_audit](#public-employee_admin_audit) |
| Khởi tạo, ảnh, tín hiệu và tương thích | [private.bootstrap_requests](#private-bootstrap_requests), [private.store_no_reservations](#private-store_no_reservations), [private.initial_seed_workflows](#private-initial_seed_workflows), [private.initial_seed_stages](#private-initial_seed_stages), [private.menu_image_uploads](#private-menu_image_uploads), [private.menu_image_assets](#private-menu_image_assets), [public.store_change_signals](#public-store_change_signals), [public.permission_catalog_signals](#public-permission_catalog_signals), [private.permission_contract_gate](#private-permission_contract_gate) |

## Miền giá trị và hợp đồng JSON

Các enum dưới đây lấy từ [001_schema_enums.sql:6](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L6) và [014_write_identity_and_ledger.sql:329](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/014_write_identity_and_ledger.sql#L329). Kiểu employee_role nền đã bị controller loại sau activation; candidate dùng text + catalog/FK.

| Kiểu | Giá trị khai báo | Giới hạn sử dụng |
| --- | --- | --- |
| `employee_role` | `admin`, `cashier`, `kitchen` | Chỉ nền/bridge, không dùng làm role candidate. |
| `seed_status` | `pending`, `seeded`, `failed` | Trạng thái nền, khác workflow seed. |
| `option_select_type` | `single`, `multi` | Theo loại trường được khai báo. |
| `table_shape` | `round`, `square`, `rectangle` | Theo loại trường được khai báo. |
| `table_status` | `empty`, `occupied` | Theo loại trường được khai báo. |
| `decor_kind` | `wall`, `plant`, `counter`, `door`, `decor`, `image` | Theo loại trường được khai báo. |
| `order_type` | `dine_in`, `takeaway` | Theo loại trường được khai báo. |
| `order_status` | `open`, `paid`, `void` | Theo loại trường được khai báo. |
| `order_item_status` | `waiting`, `done`, `removed` | Không chứng minh đã có kitchen queue. |
| `discount_type` | `none`, `percent`, `amount` | Có seam trong schema; chưa có nghĩa UI giảm giá được nghiệm thu. |
| `payment_method` | `cash`, `bank_transfer`, `qr`, `other` | Ứng dụng trong scope hiện tại chỉ cash. |
| `write_operation_status` | `pending`, `applied`, `rejected`, `cancelled`, `expired` | Trạng thái lệnh, khác trạng thái đơn. |

JSON trong DDL không tự cung cấp đầy đủ schema nghiệp vụ:

| Nhóm | Hợp đồng cần đọc cùng |
| --- | --- |
| payload/result/error và receipt thanh toán | [payload v1](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/domain/writeOperations.ts#L6), [receipt/result](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/domain/writeOperations.ts#L36); validator SQL [014_write_identity_and_ledger.sql:88](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/014_write_identity_and_ledger.sql#L88) |
| Quyền, authority và projections | [permissions.ts:1](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/domain/permissions.ts#L1), [permissions.ts:1](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/ports/permissions.ts#L1); không là một bảng authority lưu toàn bộ quyền UI |
| Audit/registry quản trị | [permission-administration.sql:1](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-administration.sql#L1); shape phụ thuộc kind/outcome |
| Receipt seed | [permission-seed.sql:1](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-seed.sql#L1); không dùng như hóa đơn tài chính |
| Receipt thanh toán cũ nullable | [014_write_identity_and_ledger.sql:327](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/014_write_identity_and_ledger.sql#L327); không gán schema mới cho dữ liệu chưa có snapshot |

## Cửa hàng, nhân viên và phiên


<a id="public-stores"></a>

### `public.stores`

Danh tính tenant và trạng thái cửa hàng; ID dùng chung với Supabase Auth user của cửa hàng.

Nguồn tạo bảng: **Nền**, [001_schema_enums.sql:18](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L18). PK: `id`. Các bổ sung/đổi kiểu được ghim tại từng cột.

| Cột | Kiểu | NULL | Khai báo cột | Ý nghĩa | Nguồn |
| --- | --- | --- | --- | --- | --- |
| `id` | `uuid` | Không | `primary key references auth.users (id) on delete cascade` | Định danh bản ghi. | [19](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L19) |
| `store_no` | `integer` | Không | `unique` | Số cửa hàng dùng để ghép thiết bị. | [20](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L20) |
| `name` | `text` | Có | — | Tên đối tượng. | [21](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L21) |
| `email` | `text` | Có | — | Thông tin email cửa hàng trong mô hình nền; không chứng minh email chủ đã được xác minh. | [22](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L22) |
| `seed_status` | `public.seed_status` | Không | `default 'pending'` | Trạng thái seed nền; phân biệt với trạng thái workflow chi tiết. | [23](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L23) |
| `is_active` | `boolean` | Không | `default true` | Cờ hoạt động của đối tượng. | [24](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L24) |
| `created_at` | `timestamptz` | Không | `default now()` | Thời điểm tạo bản ghi. | [25](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L25) |
| `updated_at` | `timestamptz` | Không | `default now()` | Thời điểm cập nhật bản ghi. | [26](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L26) |

<a id="public-store_settings"></a>

### `public.store_settings`

Thông tin hiển thị, tiền tệ, múi giờ và cấu hình hóa đơn.

Nguồn tạo bảng: **Nền**, [001_schema_enums.sql:42](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L42). PK: `store_id`. Các bổ sung/đổi kiểu được ghim tại từng cột.

| Cột | Kiểu | NULL | Khai báo cột | Ý nghĩa | Nguồn |
| --- | --- | --- | --- | --- | --- |
| `store_id` | `uuid` | Không | `primary key references public.stores (id) on delete cascade` | Định danh cửa hàng/tenant. | [43](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L43) |
| `display_name` | `text` | Không | `default 'POS Demo'` | Tên quán dùng để hiển thị. | [44](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L44) |
| `address` | `text` | Không | `default ''` | Địa chỉ hiển thị. | [45](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L45) |
| `currency` | `text` | Không | `default 'VND'` | Đơn vị tiền tệ. | [46](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L46) |
| `timezone` | `text` | Không | `default 'Asia/Saigon'` | Múi giờ nghiệp vụ của cửa hàng. | [47](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L47) |
| `bill_footer` | `text` | Không | `default ''` | Nội dung chân hóa đơn. | [48](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L48) |
| `qr_info` | `jsonb` | Có | — | Cấu hình QR; không đồng nghĩa đã xử lý thanh toán QR. | [49](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L49) |
| `created_at` | `timestamptz` | Không | `default now()` | Thời điểm tạo bản ghi. | [50](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L50) |
| `updated_at` | `timestamptz` | Không | `default now()` | Thời điểm cập nhật bản ghi. | [51](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L51) |

Ràng buộc cấp bảng/chỉ mục duy nhất (FK khai báo ngay tại cột nằm trong bảng trên):

- `constraint store_settings_currency_vnd check (currency = 'VND')` — [52](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L52).

<a id="public-employees"></a>

### `public.employees`

Hồ sơ nhân viên, vai trò, PIN hash và phiên bản quyền/thông tin xác thực.

Nguồn tạo bảng: **Nền**, [001_schema_enums.sql:29](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L29). PK: `id`. Các bổ sung/đổi kiểu được ghim tại từng cột.

| Cột | Kiểu | NULL | Khai báo cột | Ý nghĩa | Nguồn |
| --- | --- | --- | --- | --- | --- |
| `id` | `uuid` | Không | `primary key` | Định danh bản ghi. | [30](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L30) |
| `store_id` | `uuid` | Không | `references public.stores (id) on delete cascade` | Định danh cửa hàng/tenant. | [31](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L31) |
| `name` | `text` | Không | — | Tên đối tượng. | [32](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L32) |
| `role` | `text` | Không | — | Mã vai trò. | [36](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/scripts/permission-activation-steps.mjs#L36) |
| `passcode_hash` | `text` | Không | — | Hash mã PIN; không phải PIN thô. | [34](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L34) |
| `is_active` | `boolean` | Không | `default true` | Cờ hoạt động của đối tượng. | [35](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L35) |
| `seed_key` | `text` | Có | — | Khóa nhận diện dữ liệu mẫu trong cửa hàng. | [36](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L36) |
| `created_at` | `timestamptz` | Không | `default now()` | Thời điểm tạo bản ghi. | [37](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L37) |
| `updated_at` | `timestamptz` | Không | `default now()` | Thời điểm cập nhật bản ghi. | [38](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L38) |
| `permission_overrides` | `jsonb` | Có | — | JSON grants/denies; NULL không tự là quyền đầy đủ. | [37](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/011_void_paid_order.sql#L37) |
| `permission_revision` | `bigint` | Không | `default 0 check(permission_revision>=0)` | Revision của hồ sơ quyền/credential. | [33](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/017_permission_catalog_bridge.sql#L33) |
| `pin_change_required` | `boolean` | Không | `default false` | Cờ yêu cầu owner đổi PIN tạm. | [13](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-identity.sql#L13) |

Ràng buộc cấp bảng/chỉ mục duy nhất (FK khai báo ngay tại cột nằm trong bảng trên):

- `unique (store_id, id)` — [39](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L39).
- `constraint employees_permission_role_fk foreign key(role) references public.permission_roles(code)` — [11](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-identity.sql#L11).
- `constraint employees_owner_active check(role<>'owner' or is_active)` — [12](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-identity.sql#L12).
- `constraint employees_pin_change_owner check(not pin_change_required or role='owner')` — [14](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-identity.sql#L14).
- UNIQUE index `(store_id, seed_key) where seed_key is not null` — [54](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/002_indexes_rls_triggers.sql#L54).

`role` là `public.employee_role` trong mô hình nền, được controller đổi sang `text` trước fragment identity. Candidate dùng FK role→catalog, unique owner theo store, CHECK owner hoạt động/PIN owner-only và constraint trigger trì hoãn tới cuối transaction để kiểm đúng một owner hoạt động. Chưa xác nhận các ràng buộc này đã activate ở DB đích. Nguồn thực thi: [permission-identity.sql:23](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-identity.sql#L23).

<a id="private-employee_sessions"></a>

### `private.employee_sessions`

Phiên nhân viên phía server, lưu hash token thay vì token thô.

Nguồn tạo bảng: **Nền**, [014_write_identity_and_ledger.sql:162](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/014_write_identity_and_ledger.sql#L162). PK: `token_hash`. Các bổ sung/đổi kiểu được ghim tại từng cột.

| Cột | Kiểu | NULL | Khai báo cột | Ý nghĩa | Nguồn |
| --- | --- | --- | --- | --- | --- |
| `token_hash` | `bytea` | Không | `primary key` | Hash token phiên. | [163](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/014_write_identity_and_ledger.sql#L163) |
| `store_id` | `uuid` | Không | `references public.stores(id)` | Định danh cửa hàng/tenant. | [164](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/014_write_identity_and_ledger.sql#L164) |
| `employee_id` | `uuid` | Không | — | Nhân viên liên quan theo trách nhiệm của bảng. | [165](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/014_write_identity_and_ledger.sql#L165) |
| `issued_at` | `timestamptz` | Không | — | Thời điểm cấp phiên. | [166](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/014_write_identity_and_ledger.sql#L166) |
| `expires_at` | `timestamptz` | Không | — | Thời điểm hết hạn theo loại bản ghi. | [167](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/014_write_identity_and_ledger.sql#L167) |
| `revoked_at` | `timestamptz` | Có | — | Thời điểm thu hồi phiên. | [168](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/014_write_identity_and_ledger.sql#L168) |
| `purpose` | `text` | Không | `default 'normal' check(purpose in ('normal','required_pin_change'))` | Loại phiên normal hoặc required_pin_change. | [16](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-identity.sql#L16) |
| `employee_revision` | `bigint` | Không | `default 0 check(employee_revision between 0 and 9007199254740991)` | Revision nhân viên gắn với phiên. | [18](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-identity.sql#L18) |

Ràng buộc cấp bảng/chỉ mục duy nhất (FK khai báo ngay tại cột nằm trong bảng trên):

- `foreign key(store_id,employee_id) references public.employees(store_id,id)` — [169](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/014_write_identity_and_ledger.sql#L169).
- `constraint employee_sessions_purpose_ttl check( (purpose='normal' and expires_at=issued_at+interval '12 hours') or (purpose='required_pin_change' and expires_at=issued_at+interval '5 minutes'))` — [20](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-identity.sql#L20).

Candidate thay CHECK TTL nền 12 giờ bằng TTL theo purpose: normal 12 giờ, required_pin_change 5 phút. Quyền thao tác của phiên hạn chế được kiểm ở RPC; schema phiên không tự là toàn bộ cơ chế xác thực.

## Thực đơn và sơ đồ bàn


<a id="public-categories"></a>

### `public.categories`

Danh mục món.

Nguồn tạo bảng: **Nền**, [001_schema_enums.sql:55](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L55). PK: `id`. Các bổ sung/đổi kiểu được ghim tại từng cột.

| Cột | Kiểu | NULL | Khai báo cột | Ý nghĩa | Nguồn |
| --- | --- | --- | --- | --- | --- |
| `id` | `uuid` | Không | `primary key` | Định danh bản ghi. | [56](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L56) |
| `store_id` | `uuid` | Không | `references public.stores (id) on delete cascade` | Định danh cửa hàng/tenant. | [57](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L57) |
| `name` | `text` | Không | — | Tên đối tượng. | [58](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L58) |
| `sort_order` | `integer` | Không | `default 0` | Thứ tự hiển thị. | [59](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L59) |
| `seed_key` | `text` | Có | — | Khóa nhận diện dữ liệu mẫu trong cửa hàng. | [60](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L60) |
| `deleted_at` | `timestamptz` | Có | — | Dấu thời gian xóa mềm; NULL là chưa đánh dấu xóa. | [61](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L61) |
| `deleted_by_employee_id` | `uuid` | Có | — | Nhân viên ghi dấu xóa mềm. | [62](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L62) |
| `created_at` | `timestamptz` | Không | `default now()` | Thời điểm tạo bản ghi. | [63](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L63) |
| `updated_at` | `timestamptz` | Không | `default now()` | Thời điểm cập nhật bản ghi. | [64](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L64) |

Ràng buộc cấp bảng/chỉ mục duy nhất (FK khai báo ngay tại cột nằm trong bảng trên):

- `unique (store_id, id)` — [65](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L65).
- `foreign key (store_id, deleted_by_employee_id) references public.employees (store_id, id)` — [66](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L66).
- UNIQUE index `(store_id, seed_key) where seed_key is not null` — [56](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/002_indexes_rls_triggers.sql#L56).

<a id="public-menu_items"></a>

### `public.menu_items`

Món trong thực đơn và giá hiện hành.

Nguồn tạo bảng: **Nền**, [001_schema_enums.sql:69](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L69). PK: `id`. Các bổ sung/đổi kiểu được ghim tại từng cột.

| Cột | Kiểu | NULL | Khai báo cột | Ý nghĩa | Nguồn |
| --- | --- | --- | --- | --- | --- |
| `id` | `uuid` | Không | `primary key` | Định danh bản ghi. | [70](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L70) |
| `store_id` | `uuid` | Không | `references public.stores (id) on delete cascade` | Định danh cửa hàng/tenant. | [71](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L71) |
| `category_id` | `uuid` | Không | — | Danh mục của món. | [72](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L72) |
| `name` | `text` | Không | — | Tên đối tượng. | [73](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L73) |
| `price` | `integer` | Không | `check (price >= 0)` | Giá món hiện hành, số nguyên VND. | [74](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L74) |
| `image_asset_key` | `text` | Có | — | Khóa/đường dẫn ảnh theo contract ảnh; không có FK trực tiếp từ cột này tới registry ảnh. | [75](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L75) |
| `sort_order` | `integer` | Không | `default 0` | Thứ tự hiển thị. | [76](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L76) |
| `is_available` | `boolean` | Không | `default true` | Cờ món còn được chọn. | [77](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L77) |
| `seed_key` | `text` | Có | — | Khóa nhận diện dữ liệu mẫu trong cửa hàng. | [78](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L78) |
| `deleted_at` | `timestamptz` | Có | — | Dấu thời gian xóa mềm; NULL là chưa đánh dấu xóa. | [79](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L79) |
| `deleted_by_employee_id` | `uuid` | Có | — | Nhân viên ghi dấu xóa mềm. | [80](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L80) |
| `created_at` | `timestamptz` | Không | `default now()` | Thời điểm tạo bản ghi. | [81](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L81) |
| `updated_at` | `timestamptz` | Không | `default now()` | Thời điểm cập nhật bản ghi. | [82](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L82) |

Ràng buộc cấp bảng/chỉ mục duy nhất (FK khai báo ngay tại cột nằm trong bảng trên):

- `unique (store_id, id)` — [83](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L83).
- `foreign key (store_id, category_id) references public.categories (store_id, id)` — [84](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L84).
- `foreign key (store_id, deleted_by_employee_id) references public.employees (store_id, id)` — [85](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L85).
- UNIQUE index `(store_id, seed_key) where seed_key is not null` — [58](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/002_indexes_rls_triggers.sql#L58).

<a id="public-option_groups"></a>

### `public.option_groups`

Nhóm tùy chọn dùng chung; không còn thuộc riêng một món.

Nguồn tạo bảng: **Nền**, [001_schema_enums.sql:88](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L88). PK: `id`. Các bổ sung/đổi kiểu được ghim tại từng cột.

| Cột | Kiểu | NULL | Khai báo cột | Ý nghĩa | Nguồn |
| --- | --- | --- | --- | --- | --- |
| `id` | `uuid` | Không | `primary key` | Định danh bản ghi. | [89](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L89) |
| `store_id` | `uuid` | Không | `references public.stores (id) on delete cascade` | Định danh cửa hàng/tenant. | [90](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L90) |
| `name` | `text` | Không | — | Tên đối tượng. | [92](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L92) |
| `select_type` | `public.option_select_type` | Không | — | Cách chọn một/nhiều tùy chọn. | [93](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L93) |
| `is_required` | `boolean` | Không | `default false` | Cờ bắt buộc chọn tùy chọn theo nghiệp vụ. | [94](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L94) |
| `sort_order` | `integer` | Không | `default 0` | Thứ tự hiển thị. | [97](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L97) |
| `seed_key` | `text` | Có | — | Khóa nhận diện dữ liệu mẫu trong cửa hàng. | [98](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L98) |
| `deleted_at` | `timestamptz` | Có | — | Dấu thời gian xóa mềm; NULL là chưa đánh dấu xóa. | [99](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L99) |
| `deleted_by_employee_id` | `uuid` | Có | — | Nhân viên ghi dấu xóa mềm. | [100](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L100) |
| `created_at` | `timestamptz` | Không | `default now()` | Thời điểm tạo bản ghi. | [101](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L101) |
| `updated_at` | `timestamptz` | Không | `default now()` | Thời điểm cập nhật bản ghi. | [102](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L102) |

Ràng buộc cấp bảng/chỉ mục duy nhất (FK khai báo ngay tại cột nằm trong bảng trên):

- `unique (store_id, id)` — [103](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L103).
- `foreign key (store_id, deleted_by_employee_id) references public.employees (store_id, id)` — [105](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L105).
- UNIQUE index `(store_id, seed_key) where seed_key is not null` — [60](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/002_indexes_rls_triggers.sql#L60).

<a id="public-option_values"></a>

### `public.option_values`

Giá trị tùy chọn và khoản cộng giá.

Nguồn tạo bảng: **Nền**, [001_schema_enums.sql:109](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L109). PK: `id`. Các bổ sung/đổi kiểu được ghim tại từng cột.

| Cột | Kiểu | NULL | Khai báo cột | Ý nghĩa | Nguồn |
| --- | --- | --- | --- | --- | --- |
| `id` | `uuid` | Không | `primary key` | Định danh bản ghi. | [110](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L110) |
| `store_id` | `uuid` | Không | `references public.stores (id) on delete cascade` | Định danh cửa hàng/tenant. | [111](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L111) |
| `option_group_id` | `uuid` | Không | — | Nhóm tùy chọn. | [112](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L112) |
| `name` | `text` | Không | — | Tên đối tượng. | [113](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L113) |
| `price_delta` | `integer` | Không | `default 0` | Khoản cộng giá cho tùy chọn, số nguyên VND. | [114](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L114) |
| `sort_order` | `integer` | Không | `default 0` | Thứ tự hiển thị. | [115](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L115) |
| `seed_key` | `text` | Có | — | Khóa nhận diện dữ liệu mẫu trong cửa hàng. | [116](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L116) |
| `deleted_at` | `timestamptz` | Có | — | Dấu thời gian xóa mềm; NULL là chưa đánh dấu xóa. | [117](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L117) |
| `deleted_by_employee_id` | `uuid` | Có | — | Nhân viên ghi dấu xóa mềm. | [118](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L118) |
| `created_at` | `timestamptz` | Không | `default now()` | Thời điểm tạo bản ghi. | [119](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L119) |
| `updated_at` | `timestamptz` | Không | `default now()` | Thời điểm cập nhật bản ghi. | [120](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L120) |

Ràng buộc cấp bảng/chỉ mục duy nhất (FK khai báo ngay tại cột nằm trong bảng trên):

- `unique (store_id, id)` — [121](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L121).
- `foreign key (store_id, option_group_id) references public.option_groups (store_id, id)` — [122](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L122).
- `foreign key (store_id, deleted_by_employee_id) references public.employees (store_id, id)` — [123](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L123).
- `constraint option_values_nonnegative_delta check(price_delta>=0)` — [320](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/014_write_identity_and_ledger.sql#L320).
- UNIQUE index `(store_id, seed_key) where seed_key is not null` — [62](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/002_indexes_rls_triggers.sql#L62).

<a id="public-menu_item_option_groups"></a>

### `public.menu_item_option_groups`

Liên kết món với nhóm tùy chọn.

Nguồn tạo bảng: **Nền**, [008_modifier_rework.sql:9](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/008_modifier_rework.sql#L9). PK: `id`. Các bổ sung/đổi kiểu được ghim tại từng cột.

| Cột | Kiểu | NULL | Khai báo cột | Ý nghĩa | Nguồn |
| --- | --- | --- | --- | --- | --- |
| `id` | `uuid` | Không | `primary key` | Định danh bản ghi. | [10](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/008_modifier_rework.sql#L10) |
| `store_id` | `uuid` | Không | `references public.stores (id) on delete cascade` | Định danh cửa hàng/tenant. | [11](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/008_modifier_rework.sql#L11) |
| `menu_item_id` | `uuid` | Không | — | Món nguồn trong catalog. | [12](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/008_modifier_rework.sql#L12) |
| `option_group_id` | `uuid` | Không | — | Nhóm tùy chọn. | [13](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/008_modifier_rework.sql#L13) |
| `sort_order` | `integer` | Không | `default 0` | Thứ tự hiển thị. | [14](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/008_modifier_rework.sql#L14) |
| `seed_key` | `text` | Có | — | Khóa nhận diện dữ liệu mẫu trong cửa hàng. | [15](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/008_modifier_rework.sql#L15) |
| `deleted_at` | `timestamptz` | Có | — | Dấu thời gian xóa mềm; NULL là chưa đánh dấu xóa. | [16](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/008_modifier_rework.sql#L16) |
| `deleted_by_employee_id` | `uuid` | Có | — | Nhân viên ghi dấu xóa mềm. | [17](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/008_modifier_rework.sql#L17) |
| `created_at` | `timestamptz` | Không | `default now()` | Thời điểm tạo bản ghi. | [18](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/008_modifier_rework.sql#L18) |
| `updated_at` | `timestamptz` | Không | `default now()` | Thời điểm cập nhật bản ghi. | [19](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/008_modifier_rework.sql#L19) |

Ràng buộc cấp bảng/chỉ mục duy nhất (FK khai báo ngay tại cột nằm trong bảng trên):

- `unique (store_id, id)` — [20](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/008_modifier_rework.sql#L20).
- `foreign key (store_id, menu_item_id) references public.menu_items (store_id, id)` — [21](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/008_modifier_rework.sql#L21).
- `foreign key (store_id, option_group_id) references public.option_groups (store_id, id)` — [22](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/008_modifier_rework.sql#L22).
- `foreign key (store_id, deleted_by_employee_id) references public.employees (store_id, id)` — [23](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/008_modifier_rework.sql#L23).
- UNIQUE index `(store_id, seed_key) where seed_key is not null` — [44](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/008_modifier_rework.sql#L44).

Không có UNIQUE(menu_item_id, option_group_id) trong DDL này. Quan hệ nhiều-nhiều không tự chứng minh mỗi cặp chỉ xuất hiện một lần; validator/changes contract chịu phần kiểm tương ứng.

<a id="public-floor_areas"></a>

### `public.floor_areas`

Khu/tầng trên sơ đồ.

Nguồn tạo bảng: **Nền**, [001_schema_enums.sql:126](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L126). PK: `id`. Các bổ sung/đổi kiểu được ghim tại từng cột.

| Cột | Kiểu | NULL | Khai báo cột | Ý nghĩa | Nguồn |
| --- | --- | --- | --- | --- | --- |
| `id` | `uuid` | Không | `primary key` | Định danh bản ghi. | [127](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L127) |
| `store_id` | `uuid` | Không | `references public.stores (id) on delete cascade` | Định danh cửa hàng/tenant. | [128](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L128) |
| `name` | `text` | Không | — | Tên đối tượng. | [129](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L129) |
| `sort_order` | `integer` | Không | `default 0` | Thứ tự hiển thị. | [130](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L130) |
| `seed_key` | `text` | Có | — | Khóa nhận diện dữ liệu mẫu trong cửa hàng. | [131](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L131) |
| `deleted_at` | `timestamptz` | Có | — | Dấu thời gian xóa mềm; NULL là chưa đánh dấu xóa. | [132](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L132) |
| `deleted_by_employee_id` | `uuid` | Có | — | Nhân viên ghi dấu xóa mềm. | [133](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L133) |
| `created_at` | `timestamptz` | Không | `default now()` | Thời điểm tạo bản ghi. | [134](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L134) |
| `updated_at` | `timestamptz` | Không | `default now()` | Thời điểm cập nhật bản ghi. | [135](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L135) |

Ràng buộc cấp bảng/chỉ mục duy nhất (FK khai báo ngay tại cột nằm trong bảng trên):

- `unique (store_id, id)` — [136](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L136).
- `foreign key (store_id, deleted_by_employee_id) references public.employees (store_id, id)` — [137](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L137).
- UNIQUE index `(store_id, seed_key) where seed_key is not null` — [64](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/002_indexes_rls_triggers.sql#L64).

<a id="public-tables"></a>

### `public.tables`

Bàn phục vụ: bố cục và trạng thái vận hành.

Nguồn tạo bảng: **Nền**, [001_schema_enums.sql:140](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L140). PK: `id`. Các bổ sung/đổi kiểu được ghim tại từng cột.

| Cột | Kiểu | NULL | Khai báo cột | Ý nghĩa | Nguồn |
| --- | --- | --- | --- | --- | --- |
| `id` | `uuid` | Không | `primary key` | Định danh bản ghi. | [141](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L141) |
| `store_id` | `uuid` | Không | `references public.stores (id) on delete cascade` | Định danh cửa hàng/tenant. | [142](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L142) |
| `area_id` | `uuid` | Không | — | Khu/tầng của đối tượng. | [143](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L143) |
| `name` | `text` | Không | — | Tên đối tượng. | [144](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L144) |
| `background_asset_key` | `text` | Có | — | Khóa ảnh nền bàn đóng gói. | [145](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L145) |
| `pos_x` | `integer` | Không | — | Tọa độ ngang trong hệ tọa độ sơ đồ. | [146](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L146) |
| `pos_y` | `integer` | Không | — | Tọa độ dọc trong hệ tọa độ sơ đồ. | [147](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L147) |
| `width` | `integer` | Không | `check (width > 0)` | Chiều rộng đối tượng. | [148](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L148) |
| `height` | `integer` | Không | `check (height > 0)` | Chiều cao đối tượng. | [149](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L149) |
| `shape` | `public.table_shape` | Không | — | Hình dạng bàn. | [150](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L150) |
| `rotation` | `integer` | Không | `default 0` | Giá trị xoay trong mô hình bố cục. | [151](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L151) |
| `seats` | `integer` | Không | `default 2` | Số chỗ ngồi. | [152](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L152) |
| `sort_order` | `integer` | Không | `default 0` | Thứ tự hiển thị. | [153](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L153) |
| `status` | `public.table_status` | Không | `default 'empty'` | Trạng thái theo loại bản ghi; không dùng chung một vòng đời cho mọi bảng. | [154](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L154) |
| `seed_key` | `text` | Có | — | Khóa nhận diện dữ liệu mẫu trong cửa hàng. | [155](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L155) |
| `deleted_at` | `timestamptz` | Có | — | Dấu thời gian xóa mềm; NULL là chưa đánh dấu xóa. | [156](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L156) |
| `deleted_by_employee_id` | `uuid` | Có | — | Nhân viên ghi dấu xóa mềm. | [157](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L157) |
| `created_at` | `timestamptz` | Không | `default now()` | Thời điểm tạo bản ghi. | [158](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L158) |
| `updated_at` | `timestamptz` | Không | `default now()` | Thời điểm cập nhật bản ghi. | [159](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L159) |

Ràng buộc cấp bảng/chỉ mục duy nhất (FK khai báo ngay tại cột nằm trong bảng trên):

- `unique (store_id, id)` — [160](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L160).
- `foreign key (store_id, area_id) references public.floor_areas (store_id, id)` — [161](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L161).
- `foreign key (store_id, deleted_by_employee_id) references public.employees (store_id, id)` — [162](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L162).
- UNIQUE index `(store_id, seed_key) where seed_key is not null` — [66](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/002_indexes_rls_triggers.sql#L66).

<a id="public-floor_decor_items"></a>

### `public.floor_decor_items`

Vật trang trí trên sơ đồ, không nhận đơn.

Nguồn tạo bảng: **Nền**, [001_schema_enums.sql:165](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L165). PK: `id`. Các bổ sung/đổi kiểu được ghim tại từng cột.

| Cột | Kiểu | NULL | Khai báo cột | Ý nghĩa | Nguồn |
| --- | --- | --- | --- | --- | --- |
| `id` | `uuid` | Không | `primary key` | Định danh bản ghi. | [166](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L166) |
| `store_id` | `uuid` | Không | `references public.stores (id) on delete cascade` | Định danh cửa hàng/tenant. | [167](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L167) |
| `area_id` | `uuid` | Không | — | Khu/tầng của đối tượng. | [168](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L168) |
| `kind` | `public.decor_kind` | Không | — | Loại đối tượng/thao tác theo contract của bảng. | [169](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L169) |
| `label` | `text` | Có | — | Nhãn hiển thị. | [170](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L170) |
| `asset_key` | `text` | Không | — | Định danh tài nguyên ảnh. | [171](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L171) |
| `pos_x` | `integer` | Không | — | Tọa độ ngang trong hệ tọa độ sơ đồ. | [172](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L172) |
| `pos_y` | `integer` | Không | — | Tọa độ dọc trong hệ tọa độ sơ đồ. | [173](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L173) |
| `width` | `integer` | Không | `check (width > 0)` | Chiều rộng đối tượng. | [174](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L174) |
| `height` | `integer` | Không | `check (height > 0)` | Chiều cao đối tượng. | [175](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L175) |
| `rotation` | `integer` | Không | `default 0` | Giá trị xoay trong mô hình bố cục. | [176](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L176) |
| `z_index` | `integer` | Không | `default 0` | Thứ tự chồng lớp. | [177](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L177) |
| `is_locked` | `boolean` | Không | `default false` | Khóa thao tác bố cục của vật trang trí. | [178](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L178) |
| `seed_key` | `text` | Có | — | Khóa nhận diện dữ liệu mẫu trong cửa hàng. | [179](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L179) |
| `deleted_at` | `timestamptz` | Có | — | Dấu thời gian xóa mềm; NULL là chưa đánh dấu xóa. | [180](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L180) |
| `deleted_by_employee_id` | `uuid` | Có | — | Nhân viên ghi dấu xóa mềm. | [181](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L181) |
| `created_at` | `timestamptz` | Không | `default now()` | Thời điểm tạo bản ghi. | [182](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L182) |
| `updated_at` | `timestamptz` | Không | `default now()` | Thời điểm cập nhật bản ghi. | [183](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L183) |

Ràng buộc cấp bảng/chỉ mục duy nhất (FK khai báo ngay tại cột nằm trong bảng trên):

- `unique (store_id, id)` — [184](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L184).
- `foreign key (store_id, area_id) references public.floor_areas (store_id, id)` — [185](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L185).
- `foreign key (store_id, deleted_by_employee_id) references public.employees (store_id, id)` — [186](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L186).
- UNIQUE index `(store_id, seed_key) where seed_key is not null` — [68](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/002_indexes_rls_triggers.sql#L68).

## Đơn, thanh toán và sổ lệnh


<a id="public-orders"></a>

### `public.orders`

Đơn độc lập, trạng thái tiền, ngày nghiệp vụ, version và metadata hủy.

Nguồn tạo bảng: **Nền**, [001_schema_enums.sql:189](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L189). PK: `id`. Các bổ sung/đổi kiểu được ghim tại từng cột.

| Cột | Kiểu | NULL | Khai báo cột | Ý nghĩa | Nguồn |
| --- | --- | --- | --- | --- | --- |
| `id` | `uuid` | Không | `primary key` | Định danh bản ghi. | [190](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L190) |
| `store_id` | `uuid` | Không | `references public.stores (id) on delete cascade` | Định danh cửa hàng/tenant. | [191](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L191) |
| `table_id` | `uuid` | Có | — | Bàn gắn với đơn; có thể NULL. | [192](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L192) |
| `order_type` | `public.order_type` | Không | — | Dine-in hoặc takeaway. | [193](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L193) |
| `order_no` | `integer` | Không | — | Số bill theo cửa hàng/ngày nghiệp vụ, khác UUID và số dòng lịch sử. | [194](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L194) |
| `business_date` | `date` | Không | — | Ngày nghiệp vụ chốt theo múi giờ cửa hàng. | [195](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L195) |
| `status` | `public.order_status` | Không | `default 'open'` | Trạng thái theo loại bản ghi; không dùng chung một vòng đời cho mọi bảng. | [196](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L196) |
| `subtotal` | `integer` | Không | `default 0` | Tạm tính, số nguyên VND. | [197](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L197) |
| `discount_type` | `public.discount_type` | Không | `default 'none'` | Loại giảm giá trong schema; chưa chứng minh có UI giảm giá. | [198](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L198) |
| `discount_value` | `integer` | Không | `default 0` | Giá trị giảm giá theo loại. | [199](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L199) |
| `total` | `integer` | Không | `default 0` | Tổng tiền đơn, số nguyên VND. | [200](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L200) |
| `employee_id` | `uuid` | Không | — | Nhân viên liên quan theo trách nhiệm của bảng. | [201](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L201) |
| `paid_at` | `timestamptz` | Có | — | Thời điểm thanh toán được ghi nhận. | [202](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L202) |
| `lock_version` | `integer` | Không | `default 0` | Version phục vụ kiểm soát cập nhật cạnh tranh. | [203](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L203) |
| `created_at` | `timestamptz` | Không | `default now()` | Thời điểm tạo bản ghi. | [204](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L204) |
| `updated_at` | `timestamptz` | Không | `default now()` | Thời điểm cập nhật bản ghi. | [205](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L205) |
| `voided_at` | `timestamptz` | Có | — | Thời điểm hủy đơn đã thanh toán. | [19](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/011_void_paid_order.sql#L19) |
| `voided_by_employee_id` | `uuid` | Có | — | Nhân viên hủy đơn đã thanh toán. | [19](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/011_void_paid_order.sql#L19) |
| `void_reason_code` | `text` | Có | — | Mã lý do hủy. | [19](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/011_void_paid_order.sql#L19) |
| `void_reason_note` | `text` | Có | — | Ghi chú lý do hủy. | [19](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/011_void_paid_order.sql#L19) |
| `created_by_employee_id` | `uuid` | Có | — | Nhân viên tạo bản ghi/nghiệp vụ; ý nghĩa cụ thể theo bảng. | [322](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/014_write_identity_and_ledger.sql#L322) |
| `last_modified_by_employee_id` | `uuid` | Có | — | Nhân viên sửa đơn gần nhất. | [322](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/014_write_identity_and_ledger.sql#L322) |

Ràng buộc cấp bảng/chỉ mục duy nhất (FK khai báo ngay tại cột nằm trong bảng trên):

- `unique (store_id, id)` — [206](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L206).
- `unique (store_id, business_date, order_no)` — [207](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L207).
- `foreign key (store_id, table_id) references public.tables (store_id, id)` — [208](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L208).
- `foreign key (store_id, employee_id) references public.employees (store_id, id)` — [209](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L209).
- `constraint order_money_nonnegative check (subtotal >= 0 and discount_value >= 0 and total >= 0)` — [210](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L210).
- `constraint orders_voided_by_employee_fk foreign key (store_id, voided_by_employee_id) references public.employees (store_id, id)` — [25](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/011_void_paid_order.sql#L25).
- `constraint orders_void_reason_code_check check (void_reason_code is null or void_reason_code in ('wrong_order', 'customer_request', 'out_of_stock', 'duplicate', 'other'))` — [30](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/011_void_paid_order.sql#L30).
- `foreign key(store_id,created_by_employee_id) references public.employees(store_id,id)` — [322](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/014_write_identity_and_ledger.sql#L322).
- `foreign key(store_id,last_modified_by_employee_id) references public.employees(store_id,id)` — [322](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/014_write_identity_and_ledger.sql#L322).
- `constraint orders_valid_version check(lock_version>=0)` — [322](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/014_write_identity_and_ledger.sql#L322).
- UNIQUE index `(store_id, table_id) where status = 'open' and table_id is not null` — [70](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/002_indexes_rls_triggers.sql#L70).

Unique có điều kiện trên (store_id, table_id) chỉ áp dụng khi status=open và table_id không NULL. DDL không CHECK quan hệ order_type–table_id. Trường employee_id nền không được đồng nhất với created_by_employee_id; các dòng legacy có thể thiếu creator. Quy tắc snapshot, tính tổng, giá và OCC đọc thêm data-model.

<a id="public-order_items"></a>

### `public.order_items`

Dòng món của đơn, giữ snapshot tên và giá.

Nguồn tạo bảng: **Nền**, [001_schema_enums.sql:213](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L213). PK: `id`. Các bổ sung/đổi kiểu được ghim tại từng cột.

| Cột | Kiểu | NULL | Khai báo cột | Ý nghĩa | Nguồn |
| --- | --- | --- | --- | --- | --- |
| `id` | `uuid` | Không | `primary key` | Định danh bản ghi. | [214](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L214) |
| `store_id` | `uuid` | Không | `references public.stores (id) on delete cascade` | Định danh cửa hàng/tenant. | [215](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L215) |
| `order_id` | `uuid` | Không | — | Định danh đơn. | [216](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L216) |
| `menu_item_id` | `uuid` | Có | — | Món nguồn trong catalog. | [217](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L217) |
| `item_name` | `text` | Không | — | Snapshot tên món. | [218](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L218) |
| `quantity` | `integer` | Không | `check (quantity >= 0)` | Số lượng tại dòng/bản ghi. | [219](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L219) |
| `unit_price` | `integer` | Không | `check (unit_price >= 0)` | Snapshot đơn giá gốc, số nguyên VND. | [220](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L220) |
| `note` | `text` | Có | — | Ghi chú dòng món. | [221](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L221) |
| `status` | `public.order_item_status` | Không | `default 'waiting'` | Trạng thái theo loại bản ghi; không dùng chung một vòng đời cho mọi bảng. | [222](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L222) |
| `sort_order` | `integer` | Không | `default 0` | Thứ tự hiển thị. | [223](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L223) |
| `created_at` | `timestamptz` | Không | `default now()` | Thời điểm tạo bản ghi. | [224](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L224) |
| `updated_at` | `timestamptz` | Không | `default now()` | Thời điểm cập nhật bản ghi. | [225](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L225) |

Ràng buộc cấp bảng/chỉ mục duy nhất (FK khai báo ngay tại cột nằm trong bảng trên):

- `unique (store_id, id)` — [226](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L226).
- `foreign key (store_id, order_id) references public.orders (store_id, id) on delete cascade` — [227](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L227).
- `foreign key (store_id, menu_item_id) references public.menu_items (store_id, id)` — [228](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L228).

<a id="public-order_item_options"></a>

### `public.order_item_options`

Snapshot tùy chọn trên từng dòng món.

Nguồn tạo bảng: **Nền**, [001_schema_enums.sql:231](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L231). PK: `id`. Các bổ sung/đổi kiểu được ghim tại từng cột.

| Cột | Kiểu | NULL | Khai báo cột | Ý nghĩa | Nguồn |
| --- | --- | --- | --- | --- | --- |
| `id` | `uuid` | Không | `primary key` | Định danh bản ghi. | [232](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L232) |
| `store_id` | `uuid` | Không | `references public.stores (id) on delete cascade` | Định danh cửa hàng/tenant. | [233](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L233) |
| `order_item_id` | `uuid` | Không | — | Dòng món sở hữu snapshot tùy chọn. | [234](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L234) |
| `option_value_id` | `uuid` | Có | — | Giá trị tùy chọn nguồn; snapshot vẫn được lưu riêng. | [235](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L235) |
| `option_name` | `text` | Không | — | Snapshot tên tùy chọn. | [236](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L236) |
| `price_delta` | `integer` | Không | `default 0` | Khoản cộng giá cho tùy chọn, số nguyên VND. | [237](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L237) |
| `created_at` | `timestamptz` | Không | `default now()` | Thời điểm tạo bản ghi. | [238](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L238) |
| `updated_at` | `timestamptz` | Không | `default now()` | Thời điểm cập nhật bản ghi. | [239](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L239) |
| `quantity` | `integer` | Không | `default 1 check (quantity > 0)` | Số lượng tại dòng/bản ghi. | [36](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/008_modifier_rework.sql#L36) |
| `snapshot_sort_order` | `integer` | Không | `default 0` | Thứ tự tùy chọn trong snapshot. | [4](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/015_write_business_helpers.sql#L4) |

Ràng buộc cấp bảng/chỉ mục duy nhất (FK khai báo ngay tại cột nằm trong bảng trên):

- `unique (store_id, id)` — [240](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L240).
- `foreign key (store_id, order_item_id) references public.order_items (store_id, id) on delete cascade` — [241](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L241).
- `foreign key (store_id, option_value_id) references public.option_values (store_id, id)` — [242](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L242).
- `constraint order_item_options_nonnegative_delta check(price_delta>=0)` — [321](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/014_write_identity_and_ledger.sql#L321).

<a id="public-payments"></a>

### `public.payments`

Lần thu tiền của đơn và snapshot hóa đơn.

Nguồn tạo bảng: **Nền**, [001_schema_enums.sql:245](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L245). PK: `id`. Các bổ sung/đổi kiểu được ghim tại từng cột.

| Cột | Kiểu | NULL | Khai báo cột | Ý nghĩa | Nguồn |
| --- | --- | --- | --- | --- | --- |
| `id` | `uuid` | Không | `primary key` | Định danh bản ghi. | [246](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L246) |
| `store_id` | `uuid` | Không | `references public.stores (id) on delete cascade` | Định danh cửa hàng/tenant. | [247](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L247) |
| `order_id` | `uuid` | Không | — | Định danh đơn. | [248](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L248) |
| `employee_id` | `uuid` | Không | — | Nhân viên liên quan theo trách nhiệm của bảng. | [249](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L249) |
| `method` | `public.payment_method` | Không | — | Phương thức thu tiền; schema rộng hơn scope cash-only. | [250](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L250) |
| `amount` | `integer` | Không | `check (amount >= 0)` | Số tiền thu cho đơn. | [251](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L251) |
| `received_amount` | `integer` | Không | `check (received_amount >= 0)` | Tiền khách đưa. | [252](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L252) |
| `change_amount` | `integer` | Không | `check (change_amount >= 0)` | Tiền thừa trả khách. | [253](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L253) |
| `paid_at` | `timestamptz` | Không | `default now()` | Thời điểm thanh toán được ghi nhận. | [254](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L254) |
| `created_at` | `timestamptz` | Không | `default now()` | Thời điểm tạo bản ghi. | [255](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L255) |
| `updated_at` | `timestamptz` | Không | `default now()` | Thời điểm cập nhật bản ghi. | [256](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L256) |
| `receipt_snapshot` | `jsonb` | Có | — | JSON snapshot hóa đơn tại lúc thanh toán. | [327](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/014_write_identity_and_ledger.sql#L327) |

Ràng buộc cấp bảng/chỉ mục duy nhất (FK khai báo ngay tại cột nằm trong bảng trên):

- `unique (store_id, id)` — [257](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L257).
- `foreign key (store_id, order_id) references public.orders (store_id, id)` — [258](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L258).
- `foreign key (store_id, employee_id) references public.employees (store_id, id)` — [259](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/001_schema_enums.sql#L259).

Không có UNIQUE(order_id) hoặc UNIQUE(store_id, order_id). Tối đa một payment/đơn paid là bất biến của đường nghiệp vụ, không là cardinality một-một do schema bảo đảm. receipt_snapshot nullable cho dữ liệu lịch sử; không suy mọi payment cũ đều có snapshot.

<a id="public-write_operations"></a>

### `public.write_operations`

Sổ lệnh ghi v1: ý định bất biến, trạng thái và kết quả/ lỗi cuối.

Nguồn tạo bảng: **Nền**, [014_write_identity_and_ledger.sql:330](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/014_write_identity_and_ledger.sql#L330). PK: `store_id, operation_id`. Các bổ sung/đổi kiểu được ghim tại từng cột.

| Cột | Kiểu | NULL | Khai báo cột | Ý nghĩa | Nguồn |
| --- | --- | --- | --- | --- | --- |
| `store_id` | `uuid` | Không | `references public.stores(id)` | Định danh cửa hàng/tenant. | [331](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/014_write_identity_and_ledger.sql#L331) |
| `operation_id` | `uuid` | Không | — | K: định danh ý định ghi, duy nhất trong phạm vi cửa hàng. | [331](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/014_write_identity_and_ledger.sql#L331) |
| `schema_version` | `integer` | Không | `check(schema_version=1)` | Phiên bản payload ghi. | [332](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/014_write_identity_and_ledger.sql#L332) |
| `kind` | `text` | Không | — | Loại đối tượng/thao tác theo contract của bảng. | [332](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/014_write_identity_and_ledger.sql#L332) |
| `action` | `text` | Có | — | Biến thể hành động của lệnh. | [333](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/014_write_identity_and_ledger.sql#L333) |
| `required_permission` | `text` | Không | — | Mã quyền cần cho lệnh; text không phải FK tới permission_catalog. | [333](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/014_write_identity_and_ledger.sql#L333) |
| `payload` | `jsonb` | Không | — | JSON ý định bất biến, theo hợp đồng v1. | [333](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/014_write_identity_and_ledger.sql#L333) |
| `order_id` | `uuid` | Có | `generated always as ((payload->>'orderId')::uuid) stored` | Định danh đơn. | [334](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/014_write_identity_and_ledger.sql#L334) |
| `registered_at` | `timestamptz` | Không | — | Thời điểm đăng ký ý định. | [335](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/014_write_identity_and_ledger.sql#L335) |
| `expires_at` | `timestamptz` | Không | — | Thời điểm hết hạn theo loại bản ghi. | [335](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/014_write_identity_and_ledger.sql#L335) |
| `initiated_by_employee_id` | `uuid` | Không | — | Người khởi tạo lệnh. | [336](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/014_write_identity_and_ledger.sql#L336) |
| `status` | `public.write_operation_status` | Không | `default 'pending'` | Trạng thái theo loại bản ghi; không dùng chung một vòng đời cho mọi bảng. | [336](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/014_write_identity_and_ledger.sql#L336) |
| `result` | `jsonb` | Có | — | Kết quả nghiệp vụ cuối; shape theo loại lệnh. | [337](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/014_write_identity_and_ledger.sql#L337) |
| `error` | `jsonb` | Có | — | Lỗi nghiệp vụ cuối của lệnh bị từ chối. | [337](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/014_write_identity_and_ledger.sql#L337) |
| `executed_by_employee_id` | `uuid` | Có | — | Người thực thi thành công lệnh. | [337](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/014_write_identity_and_ledger.sql#L337) |
| `decided_at` | `timestamptz` | Có | — | Thời điểm có quyết định cuối. | [337](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/014_write_identity_and_ledger.sql#L337) |
| `cancelled_by_employee_id` | `uuid` | Có | — | Người hủy lệnh pending. | [338](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/014_write_identity_and_ledger.sql#L338) |
| `replay_count` | `bigint` | Không | `default 0 check(replay_count>=0)` | Số lần trả lại kết quả theo cơ chế replay. | [338](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/014_write_identity_and_ledger.sql#L338) |

Ràng buộc cấp bảng/chỉ mục duy nhất (FK khai báo ngay tại cột nằm trong bảng trên):

- `primary key(store_id,operation_id)` — [339](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/014_write_identity_and_ledger.sql#L339).
- `foreign key(store_id,initiated_by_employee_id) references public.employees(store_id,id)` — [340](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/014_write_identity_and_ledger.sql#L340).
- `foreign key(store_id,executed_by_employee_id) references public.employees(store_id,id)` — [341](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/014_write_identity_and_ledger.sql#L341).
- `foreign key(store_id,cancelled_by_employee_id) references public.employees(store_id,id)` — [342](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/014_write_identity_and_ledger.sql#L342).
- `check(expires_at=registered_at+interval '24 hours')` — [343](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/014_write_identity_and_ledger.sql#L343).
- `check(private.valid_write_payload(operation_id,payload))` — [344](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/014_write_identity_and_ledger.sql#L344).
- `check(kind=payload->>'kind' and action is not distinct from payload->>'action')` — [345](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/014_write_identity_and_ledger.sql#L345).
- `check((status='pending' and result is null and error is null and decided_at is null and executed_by_employee_id is null and cancelled_by_employee_id is null) or (status='applied' and result is not null and error is null and decided_at is not null and executed_by_employee_id is not null and cancelled_by_employee_id is null) or (status='rejected' and result is null and error is not null and decided_at is not null and executed_by_employee_id is null and cancelled_by_employee_id is null) or (status='cancelled' and result is null and error is null and decided_at is not null and executed_by_employee_id is null and cancelled_by_employee_id is not null) or (status='expired' and result is null and error is null and decided_at is not null and executed_by_employee_id is null and cancelled_by_employee_id is null))` — [346](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/014_write_identity_and_ledger.sql#L346).

order_id được sinh từ payload và KHÔNG có FK tới orders vì lệnh tạo đơn có thể đăng ký trước khi đơn tồn tại. TTL pending là 24 giờ, không phải tuổi thọ đơn. Trigger bất biến giữ K/payload và trạng thái cuối; replay_count là ngoại lệ cho phép tăng. CHECK gọi validator payload v1; xem hợp đồng JSON bên dưới. Nguồn thực thi: [014_write_identity_and_ledger.sql:371](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/014_write_identity_and_ledger.sql#L371).

<a id="public-order_events"></a>

### `public.order_events`

Sự kiện nghiệp vụ liên kết lệnh với đơn nguồn/đơn kết quả/payment.

Nguồn tạo bảng: **Nền**, [014_write_identity_and_ledger.sql:355](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/014_write_identity_and_ledger.sql#L355). PK: `id`. Các bổ sung/đổi kiểu được ghim tại từng cột.

| Cột | Kiểu | NULL | Khai báo cột | Ý nghĩa | Nguồn |
| --- | --- | --- | --- | --- | --- |
| `id` | `uuid` | Không | `primary key` | Định danh bản ghi. | [356](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/014_write_identity_and_ledger.sql#L356) |
| `store_id` | `uuid` | Không | `references public.stores(id)` | Định danh cửa hàng/tenant. | [356](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/014_write_identity_and_ledger.sql#L356) |
| `operation_id` | `uuid` | Không | — | K: định danh ý định ghi, duy nhất trong phạm vi cửa hàng. | [356](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/014_write_identity_and_ledger.sql#L356) |
| `action` | `text` | Không | — | Biến thể hành động của lệnh. | [357](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/014_write_identity_and_ledger.sql#L357) |
| `source_order_id` | `uuid` | Không | — | Đơn nguồn của sự kiện. | [357](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/014_write_identity_and_ledger.sql#L357) |
| `result_order_id` | `uuid` | Có | — | Đơn kết quả, nếu có. | [357](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/014_write_identity_and_ledger.sql#L357) |
| `payment_id` | `uuid` | Có | — | Payment liên quan, nếu có. | [357](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/014_write_identity_and_ledger.sql#L357) |
| `initiated_by` | `uuid` | Không | — | Nhân viên khởi tạo. | [358](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/014_write_identity_and_ledger.sql#L358) |
| `executed_by` | `uuid` | Không | — | Nhân viên thực thi. | [358](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/014_write_identity_and_ledger.sql#L358) |
| `occurred_at` | `timestamptz` | Không | — | Thời điểm ghi sự kiện/audit. | [358](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/014_write_identity_and_ledger.sql#L358) |
| `before_version` | `integer` | Có | — | Version đơn trước thay đổi, có thể không có khi tạo. | [359](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/014_write_identity_and_ledger.sql#L359) |
| `after_version` | `integer` | Không | — | Version đơn sau thay đổi. | [359](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/014_write_identity_and_ledger.sql#L359) |
| `summary` | `jsonb` | Không | — | JSON tóm tắt sự kiện. | [359](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/014_write_identity_and_ledger.sql#L359) |

Ràng buộc cấp bảng/chỉ mục duy nhất (FK khai báo ngay tại cột nằm trong bảng trên):

- `unique(store_id,operation_id)` — [360](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/014_write_identity_and_ledger.sql#L360).
- `foreign key(store_id,operation_id) references public.write_operations(store_id,operation_id)` — [361](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/014_write_identity_and_ledger.sql#L361).
- `foreign key(store_id,source_order_id) references public.orders(store_id,id)` — [362](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/014_write_identity_and_ledger.sql#L362).
- `foreign key(store_id,result_order_id) references public.orders(store_id,id)` — [363](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/014_write_identity_and_ledger.sql#L363).
- `foreign key(store_id,payment_id) references public.payments(store_id,id)` — [364](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/014_write_identity_and_ledger.sql#L364).
- `foreign key(store_id,initiated_by) references public.employees(store_id,id)` — [365](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/014_write_identity_and_ledger.sql#L365).
- `foreign key(store_id,executed_by) references public.employees(store_id,id)` — [366](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/014_write_identity_and_ledger.sql#L366).

UNIQUE(store_id, operation_id) cho phép mỗi lệnh có tối đa một event; lệnh pending/rejected/cancelled/expired không mặc nhiên có event. Trigger chặn sửa/xóa event. Các cột nguồn/kết quả/payment dùng FK ghép cùng store. Nguồn thực thi: [014_write_identity_and_ledger.sql:382](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/014_write_identity_and_ledger.sql#L382).

<a id="private-initial_receipt_print_grants"></a>

### `private.initial_receipt_print_grants`

Bằng chứng đủ điều kiện mở in lần đầu, nằm ngoài kết quả R1 bất biến.

Nguồn tạo bảng: **Candidate**, [permission-print.sql:4](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-print.sql#L4). PK: `grant_id`. Các bổ sung/đổi kiểu được ghim tại từng cột.

| Cột | Kiểu | NULL | Khai báo cột | Ý nghĩa | Nguồn |
| --- | --- | --- | --- | --- | --- |
| `grant_id` | `uuid` | Không | `primary key` | Định danh grant in lần đầu. | [5](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-print.sql#L5) |
| `store_id` | `uuid` | Không | — | Định danh cửa hàng/tenant. | [6](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-print.sql#L6) |
| `operation_id` | `uuid` | Không | — | K: định danh ý định ghi, duy nhất trong phạm vi cửa hàng. | [7](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-print.sql#L7) |
| `order_id` | `uuid` | Không | — | Định danh đơn. | [8](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-print.sql#L8) |
| `executor_employee_id` | `uuid` | Không | — | Nhân viên thực thi gắn với grant in. | [9](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-print.sql#L9) |
| `employee_session_hash` | `bytea` | Không | — | Hash phiên gắn với grant; không có FK tới bảng phiên. | [10](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-print.sql#L10) |
| `created_at` | `timestamptz` | Không | — | Thời điểm tạo bản ghi. | [11](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-print.sql#L11) |

Ràng buộc cấp bảng/chỉ mục duy nhất (FK khai báo ngay tại cột nằm trong bảng trên):

- `unique(store_id,operation_id)` — [12](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-print.sql#L12).
- `foreign key(store_id,operation_id) references public.write_operations(store_id,operation_id)` — [13](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-print.sql#L13).
- `foreign key(store_id,order_id) references public.orders(store_id,id)` — [14](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-print.sql#L14).
- `foreign key(store_id,executor_employee_id) references public.employees(store_id,id)` — [15](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-print.sql#L15).

UNIQUE(store_id, operation_id) cho tối đa một grant/lệnh. employee_session_hash không là FK tới employee_sessions. Trigger chặn update/delete; grant này không thay receipt.reprint và không sửa payload/result của lệnh. Nguồn thực thi: [permission-print.sql:19](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-print.sql#L19).

## Danh mục quyền, yêu cầu quản trị và audit


<a id="public-permission_roles"></a>

### `public.permission_roles`

Danh mục năm mã vai trò; kitchen chưa bật.

Nguồn tạo bảng: **Bridge/catalog nền**, [017_permission_catalog_bridge.sql:4](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/017_permission_catalog_bridge.sql#L4). PK: `code`. Các bổ sung/đổi kiểu được ghim tại từng cột.

| Cột | Kiểu | NULL | Khai báo cột | Ý nghĩa | Nguồn |
| --- | --- | --- | --- | --- | --- |
| `code` | `text` | Không | `primary key check(code in ('owner','manager','cashier','waiter','kitchen'))` | Mã catalog. | [5](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/017_permission_catalog_bridge.sql#L5) |
| `label_vi` | `text` | Không | `check(length(label_vi)>0)` | Nhãn tiếng Việt. | [6](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/017_permission_catalog_bridge.sql#L6) |
| `enabled` | `boolean` | Không | — | Vai trò được bật. | [7](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/017_permission_catalog_bridge.sql#L7) |
| `selectable` | `boolean` | Không | — | Vai trò được chọn khi quản trị nhân viên. | [8](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/017_permission_catalog_bridge.sql#L8) |

Ràng buộc cấp bảng/chỉ mục duy nhất (FK khai báo ngay tại cột nằm trong bảng trên):

- `check(enabled = (code <> 'kitchen'))` — [9](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/017_permission_catalog_bridge.sql#L9).
- `check(selectable = (code in ('manager','cashier','waiter')))` — [10](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/017_permission_catalog_bridge.sql#L10).

<a id="public-permission_catalog"></a>

### `public.permission_catalog`

Danh mục 15 quyền và metadata module/baseline/owner-only.

Nguồn tạo bảng: **Bridge/catalog nền**, [017_permission_catalog_bridge.sql:12](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/017_permission_catalog_bridge.sql#L12). PK: `code`. Các bổ sung/đổi kiểu được ghim tại từng cột.

| Cột | Kiểu | NULL | Khai báo cột | Ý nghĩa | Nguồn |
| --- | --- | --- | --- | --- | --- |
| `code` | `text` | Không | `primary key check(code in ('floor.view','order.create','order.update','order.voidOpen', 'payment.take','orderHistory.view','order.voidPaid','menu.manage','floor.manage','employee.manage', 'employee.permission.edit','report.view','settings.manage','data.clearDemo','receipt.reprint'))` | Mã catalog. | [13](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/017_permission_catalog_bridge.sql#L13) |
| `label_vi` | `text` | Không | `check(length(label_vi)>0)` | Nhãn tiếng Việt. | [16](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/017_permission_catalog_bridge.sql#L16) |
| `module` | `text` | Không | — | Nhóm chức năng của quyền. | [17](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/017_permission_catalog_bridge.sql#L17) |
| `owner_only` | `boolean` | Không | `default false check(owner_only = (code='data.clearDemo'))` | Quyền dành riêng owner. | [18](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/017_permission_catalog_bridge.sql#L18) |
| `baseline` | `boolean` | Không | `default false check(baseline = (code='floor.view'))` | Quyền nền. | [19](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/017_permission_catalog_bridge.sql#L19) |

<a id="public-role_permission_defaults"></a>

### `public.role_permission_defaults`

Quan hệ nhiều-nhiều vai trò–quyền mặc định.

Nguồn tạo bảng: **Bridge/catalog nền**, [017_permission_catalog_bridge.sql:21](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/017_permission_catalog_bridge.sql#L21). PK: `role_code, permission_code`. Các bổ sung/đổi kiểu được ghim tại từng cột.

| Cột | Kiểu | NULL | Khai báo cột | Ý nghĩa | Nguồn |
| --- | --- | --- | --- | --- | --- |
| `role_code` | `text` | Không | `references public.permission_roles(code)` | Mã vai trò ở quan hệ mặc định. | [22](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/017_permission_catalog_bridge.sql#L22) |
| `permission_code` | `text` | Không | `references public.permission_catalog(code)` | Mã quyền ở quan hệ mặc định. | [23](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/017_permission_catalog_bridge.sql#L23) |

Ràng buộc cấp bảng/chỉ mục duy nhất (FK khai báo ngay tại cột nằm trong bảng trên):

- `primary key(role_code,permission_code)` — [24](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/017_permission_catalog_bridge.sql#L24).
- `check(role_code <> 'kitchen')` — [25](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/017_permission_catalog_bridge.sql#L25).
- `check(permission_code <> 'data.clearDemo' or role_code='owner')` — [26](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/017_permission_catalog_bridge.sql#L26).

<a id="public-permission_catalog_state"></a>

### `public.permission_catalog_state`

Phiên bản catalog toàn hệ thống; singleton.

Nguồn tạo bảng: **Bridge/catalog nền**, [017_permission_catalog_bridge.sql:28](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/017_permission_catalog_bridge.sql#L28). PK: `singleton`. Các bổ sung/đổi kiểu được ghim tại từng cột.

| Cột | Kiểu | NULL | Khai báo cột | Ý nghĩa | Nguồn |
| --- | --- | --- | --- | --- | --- |
| `singleton` | `boolean` | Không | `primary key default true check(singleton)` | Khóa boolean chỉ nhận true, cho phép tối đa một dòng. | [29](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/017_permission_catalog_bridge.sql#L29) |
| `revision` | `bigint` | Không | `default 0 check(revision>=0)` | Số phiên bản tăng của catalog/tín hiệu. | [30](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/017_permission_catalog_bridge.sql#L30) |
| `changed_in_transaction` | `xid8` | Có | — | ID transaction được dùng để tránh tăng revision nhiều lần trong cùng transaction. | [31](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/017_permission_catalog_bridge.sql#L31) |

PK singleton + CHECK(singleton) chỉ bảo đảm tối đa một dòng; initialization và constraint trigger catalog kiểm invariant đầy đủ. Không suy mọi bảng singleton tự luôn có một dòng. Nguồn thực thi: [017_permission_catalog_bridge.sql:83](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/017_permission_catalog_bridge.sql#L83).

<a id="private-permission_request_mac_keys"></a>

### `private.permission_request_mac_keys`

Khóa MAC nội bộ để kiểm tính trùng khớp yêu cầu quản trị; không lưu giá trị bí mật trong tài liệu.

Nguồn tạo bảng: **Bridge/catalog nền**, [017_permission_catalog_bridge.sql:112](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/017_permission_catalog_bridge.sql#L112). PK: `key_version`. Các bổ sung/đổi kiểu được ghim tại từng cột.

| Cột | Kiểu | NULL | Khai báo cột | Ý nghĩa | Nguồn |
| --- | --- | --- | --- | --- | --- |
| `key_version` | `integer` | Không | `primary key check(key_version>0)` | Phiên bản khóa MAC. | [113](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/017_permission_catalog_bridge.sql#L113) |
| `secret_bytes` | `bytea` | Không | `check(octet_length(secret_bytes)>=32)` | Vật liệu khóa MAC nội bộ; không xuất giá trị. | [114](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/017_permission_catalog_bridge.sql#L114) |

<a id="private-employee_admin_requests"></a>

### `private.employee_admin_requests`

Registry chống lặp yêu cầu quản trị theo actor và request ID.

Nguồn tạo bảng: **Bridge/catalog nền**, [017_permission_catalog_bridge.sql:117](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/017_permission_catalog_bridge.sql#L117). PK: `store_id, actor_type, actor_key, request_id`. Các bổ sung/đổi kiểu được ghim tại từng cột.

| Cột | Kiểu | NULL | Khai báo cột | Ý nghĩa | Nguồn |
| --- | --- | --- | --- | --- | --- |
| `store_id` | `uuid` | Không | `references public.stores(id)` | Định danh cửa hàng/tenant. | [118](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/017_permission_catalog_bridge.sql#L118) |
| `actor_type` | `text` | Không | — | Loại actor employee/operator trong candidate. | [119](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/017_permission_catalog_bridge.sql#L119) |
| `actor_key` | `text` | Không | `check(length(actor_key)>0)` | Khóa actor trong namespace actor_type. | [120](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/017_permission_catalog_bridge.sql#L120) |
| `request_id` | `uuid` | Không | — | Định danh yêu cầu trong namespace registry. | [121](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/017_permission_catalog_bridge.sql#L121) |
| `kind` | `text` | Không | — | Loại đối tượng/thao tác theo contract của bảng. | [122](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/017_permission_catalog_bridge.sql#L122) |
| `payload_mac` | `bytea` | Không | `check(octet_length(payload_mac)=32)` | MAC của nội dung yêu cầu; không phải payload thô. | [123](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/017_permission_catalog_bridge.sql#L123) |
| `mac_key_version` | `integer` | Không | `references private.permission_request_mac_keys(key_version)` | Phiên bản khóa dùng để tạo/kiểm MAC. | [124](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/017_permission_catalog_bridge.sql#L124) |
| `terminal_outcome` | `jsonb` | Không | — | JSON kết quả cuối được lưu để nhận diện yêu cầu lặp. | [125](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/017_permission_catalog_bridge.sql#L125) |
| `audit_keys` | `jsonb` | Không | `default '[]' check(jsonb_typeof(audit_keys)='array')` | Danh sách khóa audit JSON. | [126](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/017_permission_catalog_bridge.sql#L126) |

Ràng buộc cấp bảng/chỉ mục duy nhất (FK khai báo ngay tại cột nằm trong bảng trên):

- `primary key(store_id,actor_type,actor_key,request_id)` — [127](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/017_permission_catalog_bridge.sql#L127).
- `check(actor_type in ('employee','operator'))` — [64](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-identity.sql#L64).

Candidate đổi actor_type từ employee/recovery của bridge sang employee/operator. actor_key/audit_keys/terminal_outcome không là các FK. Quy tắc canonical input, request reuse và replay nằm trong administration contract.

<a id="public-employee_admin_audit"></a>

### `public.employee_admin_audit`

Nhật ký quản trị nhân viên, gồm yêu cầu bị từ chối; không có FK tới dữ liệu nghiệp vụ/nhân viên.

Nguồn tạo bảng: **Candidate**, [permission-identity.sql:47](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-identity.sql#L47). PK: `store_id, actor_type, actor_key, request_id, target_id`. Các bổ sung/đổi kiểu được ghim tại từng cột.

| Cột | Kiểu | NULL | Khai báo cột | Ý nghĩa | Nguồn |
| --- | --- | --- | --- | --- | --- |
| `store_id` | `uuid` | Không | — | Định danh cửa hàng/tenant. | [48](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-identity.sql#L48) |
| `actor_type` | `text` | Không | `check(actor_type in ('employee','operator'))` | Loại actor employee/operator trong candidate. | [48](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-identity.sql#L48) |
| `actor_key` | `text` | Không | — | Khóa actor trong namespace actor_type. | [49](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-identity.sql#L49) |
| `request_id` | `uuid` | Không | — | Định danh yêu cầu trong namespace registry. | [49](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-identity.sql#L49) |
| `target_id` | `uuid` | Không | — | ID đích, không mặc nhiên là FK. | [49](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-identity.sql#L49) |
| `kind` | `text` | Không | — | Loại đối tượng/thao tác theo contract của bảng. | [50](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-identity.sql#L50) |
| `outcome` | `text` | Không | `check(outcome in ('applied','noop','denied'))` | Kết quả xử lý theo loại registry/audit. | [50](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-identity.sql#L50) |
| `reason` | `text` | Có | — | Lý do của kết quả audit. | [50](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-identity.sql#L50) |
| `before_snapshot` | `jsonb` | Có | — | Snapshot trước yêu cầu. | [51](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-identity.sql#L51) |
| `proposed_after` | `jsonb` | Có | — | Snapshot đề xuất sau yêu cầu. | [51](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-identity.sql#L51) |
| `actual_after` | `jsonb` | Có | — | Snapshot thực sau xử lý. | [51](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-identity.sql#L51) |
| `actor_effective` | `text[]` | Không | — | Tập quyền hiệu lực của actor lúc ghi audit. | [51](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-identity.sql#L51) |
| `catalog_revision` | `bigint` | Không | — | Revision catalog lúc ghi audit. | [52](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-identity.sql#L52) |
| `credential_changed` | `boolean` | Không | `default false` | Đánh dấu thay đổi credential. | [52](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-identity.sql#L52) |
| `operator_case_ref` | `text` | Có | — | Tham chiếu hồ sơ recovery operator. | [53](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-identity.sql#L53) |
| `operator_proof_ref` | `text` | Có | — | Tham chiếu bằng chứng operator, không là bí mật. | [53](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-identity.sql#L53) |
| `occurred_at` | `timestamptz` | Không | — | Thời điểm ghi sự kiện/audit. | [53](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-identity.sql#L53) |
| `details` | `jsonb` | Có | — | JSON chi tiết audit bổ sung. | [2](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-administration.sql#L2) |

Ràng buộc cấp bảng/chỉ mục duy nhất (FK khai báo ngay tại cột nằm trong bảng trên):

- `primary key(store_id,actor_type,actor_key,request_id,target_id)` — [54](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-identity.sql#L54).

Không có FK tới stores/employees/request registry. ID và snapshot dùng để truy vết, không được vẽ thành FK. before/proposed/actual snapshots và details nullable; audit không ghi PIN hash/MAC/bí mật.

## Khởi tạo, ảnh, tín hiệu và tương thích


<a id="private-bootstrap_requests"></a>

### `private.bootstrap_requests`

Registry khởi tạo cửa hàng, dùng lại kết quả theo request ID.

Nguồn tạo bảng: **Bridge/catalog nền**, [017_permission_catalog_bridge.sql:129](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/017_permission_catalog_bridge.sql#L129). PK: `store_id, request_id`. Các bổ sung/đổi kiểu được ghim tại từng cột.

| Cột | Kiểu | NULL | Khai báo cột | Ý nghĩa | Nguồn |
| --- | --- | --- | --- | --- | --- |
| `store_id` | `uuid` | Không | `references public.stores(id)` | Định danh cửa hàng/tenant. | [130](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/017_permission_catalog_bridge.sql#L130) |
| `request_id` | `uuid` | Không | — | Định danh yêu cầu trong namespace registry. | [130](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/017_permission_catalog_bridge.sql#L130) |
| `owner_id` | `uuid` | Không | — | ID owner dự kiến trong bootstrap; không có FK từ cột này. | [130](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/017_permission_catalog_bridge.sql#L130) |
| `canonical_input` | `jsonb` | Không | `check(jsonb_typeof(canonical_input)='object')` | JSON input đã chuẩn hóa để đối chiếu bootstrap lặp. | [131](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/017_permission_catalog_bridge.sql#L131) |
| `outcome` | `jsonb` | Không | — | Kết quả xử lý theo loại registry/audit. | [132](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/017_permission_catalog_bridge.sql#L132) |

Ràng buộc cấp bảng/chỉ mục duy nhất (FK khai báo ngay tại cột nằm trong bảng trên):

- `primary key(store_id,request_id)` — [133](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/017_permission_catalog_bridge.sql#L133).

owner_id là tham chiếu logic, không FK. Registry này không chứng minh tài khoản email cá nhân, xác minh email hoặc chuyển quyền sở hữu đã được hiện thực.

<a id="private-store_no_reservations"></a>

### `private.store_no_reservations`

Đặt trước số cửa hàng theo lần tạo, trước khi có tenant/Auth user.

Nguồn tạo bảng: **Candidate**, [permission-identity.sql:67](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-identity.sql#L67). PK: `request_id`. Các bổ sung/đổi kiểu được ghim tại từng cột.

| Cột | Kiểu | NULL | Khai báo cột | Ý nghĩa | Nguồn |
| --- | --- | --- | --- | --- | --- |
| `request_id` | `uuid` | Không | `primary key` | Định danh yêu cầu trong namespace registry. | [68](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-identity.sql#L68) |
| `store_no` | `integer` | Không | `unique check(store_no between 1 and 2147483647)` | Số cửa hàng dùng để ghép thiết bị. | [69](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-identity.sql#L69) |
| `created_at` | `timestamptz` | Không | — | Thời điểm tạo bản ghi. | [70](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-identity.sql#L70) |

Không có store_id/FK tới stores: reservation tồn tại trước signup/bootstrap. Unique store_no không phải FK tới stores.store_no.

<a id="private-initial_seed_workflows"></a>

### `private.initial_seed_workflows`

Tiến trình tạo dữ liệu mẫu ban đầu cho cửa hàng.

Nguồn tạo bảng: **Candidate**, [permission-identity.sql:72](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-identity.sql#L72). PK: `workflow_id`. Các bổ sung/đổi kiểu được ghim tại từng cột.

| Cột | Kiểu | NULL | Khai báo cột | Ý nghĩa | Nguồn |
| --- | --- | --- | --- | --- | --- |
| `workflow_id` | `uuid` | Không | `primary key` | Định danh tiến trình seed. | [73](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-identity.sql#L73) |
| `store_id` | `uuid` | Không | `unique references public.stores(id) on delete cascade` | Định danh cửa hàng/tenant. | [74](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-identity.sql#L74) |
| `requested` | `boolean` | Không | — | Chủ quán có yêu cầu dữ liệu mẫu ban đầu hay không. | [75](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-identity.sql#L75) |
| `template_version` | `integer` | Không | `check(template_version=1)` | Phiên bản mẫu seed. | [76](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-identity.sql#L76) |
| `status` | `text` | Không | `check(status in ('skipped','pending','in_progress','needs_retry','completed'))` | Trạng thái theo loại bản ghi; không dùng chung một vòng đời cho mọi bảng. | [77](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-identity.sql#L77) |
| `workflow_revision` | `bigint` | Không | `default 0 check(workflow_revision between 0 and 9007199254740991)` | Revision workflow. | [78](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-identity.sql#L78) |
| `auto_claimed_at` | `timestamptz` | Có | — | Thời điểm nhận chạy tự động. | [79](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-identity.sql#L79) |
| `run_generation` | `bigint` | Không | `default 0 check(run_generation between 0 and 9007199254740991)` | Thế hệ lượt chạy seed. | [80](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-identity.sql#L80) |
| `last_error_code` | `text` | Có | `check(last_error_code in ('ENTITY_ID_CONFLICT','PERMISSION_UPDATE_UNAVAILABLE'))` | Mã lỗi seed gần nhất. | [81](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-identity.sql#L81) |
| `created_at` | `timestamptz` | Không | — | Thời điểm tạo bản ghi. | [82](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-identity.sql#L82) |
| `updated_at` | `timestamptz` | Không | — | Thời điểm cập nhật bản ghi. | [83](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-identity.sql#L83) |

UNIQUE(store_id) cho tối đa một workflow/cửa hàng. Không đồng nhất status=completed/skipped của workflow với yêu cầu seed lại từ Settings; R06 vẫn mở.

<a id="private-initial_seed_stages"></a>

### `private.initial_seed_stages`

Trạng thái và receipt từng chặng employee/menu/floor của seed.

Nguồn tạo bảng: **Candidate**, [permission-identity.sql:85](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-identity.sql#L85). PK: `workflow_id, stage`. Các bổ sung/đổi kiểu được ghim tại từng cột.

| Cột | Kiểu | NULL | Khai báo cột | Ý nghĩa | Nguồn |
| --- | --- | --- | --- | --- | --- |
| `workflow_id` | `uuid` | Không | `references private.initial_seed_workflows(workflow_id) on delete cascade` | Định danh tiến trình seed. | [86](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-identity.sql#L86) |
| `stage` | `text` | Không | `check(stage in ('employee','menu','floor'))` | Tên chặng seed. | [87](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-identity.sql#L87) |
| `stage_id` | `uuid` | Không | `unique` | Định danh riêng của chặng. | [88](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-identity.sql#L88) |
| `status` | `text` | Không | `default 'pending' check(status in ('pending','committed'))` | Trạng thái theo loại bản ghi; không dùng chung một vòng đời cho mọi bảng. | [89](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-identity.sql#L89) |
| `committed_at` | `timestamptz` | Có | — | Thời điểm chặng commit. | [90](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-identity.sql#L90) |
| `receipt` | `jsonb` | Có | — | JSON receipt chặng seed; không phải hóa đơn thanh toán. | [91](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-identity.sql#L91) |

Ràng buộc cấp bảng/chỉ mục duy nhất (FK khai báo ngay tại cột nằm trong bảng trên):

- `primary key(workflow_id,stage)` — [92](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-identity.sql#L92).
- `check((status='pending' and committed_at is null and receipt is null) or (status='committed' and committed_at is not null and jsonb_typeof(receipt)='object'))` — [93](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-identity.sql#L93).

FK workflow và UNIQUE(stage_id); CHECK liên hệ status/committed_at/receipt đọc đúng biểu thức bên dưới. receipt vẫn nullable trong khai báo: CHECK dùng jsonb_typeof không được mô tả thành NOT NULL tuyệt đối. Đây là mô tả source, không là kết quả thử insert bypass.

<a id="private-menu_image_uploads"></a>

### `private.menu_image_uploads`

Registry ảnh đang upload/staging; item có thể còn là bản nháp.

Nguồn tạo bảng: **Candidate**, [permission-images.sql:21](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-images.sql#L21). PK: `upload_handle`. Các bổ sung/đổi kiểu được ghim tại từng cột.

| Cột | Kiểu | NULL | Khai báo cột | Ý nghĩa | Nguồn |
| --- | --- | --- | --- | --- | --- |
| `upload_handle` | `uuid` | Không | `primary key` | Định danh upload. | [22](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-images.sql#L22) |
| `store_id` | `uuid` | Không | `references public.stores(id)` | Định danh cửa hàng/tenant. | [23](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-images.sql#L23) |
| `item_id` | `uuid` | Không | — | ID món của upload/asset; ràng buộc khác nhau giữa hai bảng. | [24](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-images.sql#L24) |
| `object_key` | `text` | Không | `unique` | Khóa bytes trong Storage; không có FK tới storage.objects. | [25](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-images.sql#L25) |
| `mime_type` | `text` | Không | `check(mime_type in('image/jpeg','image/png','image/webp'))` | Kiểu MIME của ảnh. | [26](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-images.sql#L26) |
| `byte_size` | `bigint` | Không | `check(byte_size between 1 and 5242880)` | Dung lượng ảnh tính bằng byte. | [27](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-images.sql#L27) |
| `created_by_employee_id` | `uuid` | Không | — | Nhân viên tạo bản ghi/nghiệp vụ; ý nghĩa cụ thể theo bảng. | [28](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-images.sql#L28) |
| `state` | `text` | Không | `check(state in('uploading','ready','published','discarded'))` | Trạng thái upload. | [29](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-images.sql#L29) |
| `created_at` | `timestamptz` | Không | `default now()` | Thời điểm tạo bản ghi. | [30](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-images.sql#L30) |
| `ready_at` | `timestamptz` | Có | — | Thời điểm ảnh sẵn sàng. | [31](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-images.sql#L31) |
| `published_at` | `timestamptz` | Có | — | Thời điểm công bố ảnh. | [32](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-images.sql#L32) |
| `discarded_at` | `timestamptz` | Có | — | Thời điểm bỏ upload. | [33](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-images.sql#L33) |

Ràng buộc cấp bảng/chỉ mục duy nhất (FK khai báo ngay tại cột nằm trong bảng trên):

- `unique(store_id,item_id,upload_handle)` — [34](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-images.sql#L34).
- `foreign key(store_id,created_by_employee_id) references public.employees(store_id,id)` — [37](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-images.sql#L37).

item_id không FK vì món nháp chưa nhất thiết tồn tại. UNIQUE(store_id,item_id,upload_handle) không thay FK món. Giới hạn ảnh 5.242.880 byte (5 MiB).

<a id="private-menu_image_assets"></a>

### `private.menu_image_assets`

Registry ảnh đã qua bước công bố, liên kết món thật.

Nguồn tạo bảng: **Candidate**, [permission-images.sql:39](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-images.sql#L39). PK: `asset_key`. Các bổ sung/đổi kiểu được ghim tại từng cột.

| Cột | Kiểu | NULL | Khai báo cột | Ý nghĩa | Nguồn |
| --- | --- | --- | --- | --- | --- |
| `asset_key` | `uuid` | Không | `primary key` | Định danh tài nguyên ảnh. | [40](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-images.sql#L40) |
| `store_id` | `uuid` | Không | `references public.stores(id)` | Định danh cửa hàng/tenant. | [41](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-images.sql#L41) |
| `item_id` | `uuid` | Không | — | ID món của upload/asset; ràng buộc khác nhau giữa hai bảng. | [42](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-images.sql#L42) |
| `upload_handle` | `uuid` | Không | `unique references private.menu_image_uploads(upload_handle)` | Định danh upload. | [43](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-images.sql#L43) |
| `object_key` | `text` | Không | `unique` | Khóa bytes trong Storage; không có FK tới storage.objects. | [44](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-images.sql#L44) |
| `mime_type` | `text` | Không | `check(mime_type in('image/jpeg','image/png','image/webp'))` | Kiểu MIME của ảnh. | [45](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-images.sql#L45) |
| `byte_size` | `bigint` | Không | `check(byte_size between 1 and 5242880)` | Dung lượng ảnh tính bằng byte. | [46](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-images.sql#L46) |
| `published` | `boolean` | Không | `default true` | Cờ asset đang được công bố. | [47](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-images.sql#L47) |
| `published_at` | `timestamptz` | Không | — | Thời điểm công bố ảnh. | [48](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-images.sql#L48) |
| `unpublished_at` | `timestamptz` | Có | — | Thời điểm ngừng công bố. | [49](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-images.sql#L49) |

Ràng buộc cấp bảng/chỉ mục duy nhất (FK khai báo ngay tại cột nằm trong bảng trên):

- `foreign key(store_id,item_id) references public.menu_items(store_id,id)` — [50](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-images.sql#L50).

Có FK cùng-store tới menu_items và FK riêng upload_handle; FK upload_handle không tự ràng buộc store_id/item_id giữa hai registry. Việc đối chiếu cùng upload/món/store nằm ở function publish. object_key không FK Storage; DB và bytes Storage không chung transaction. Nguồn thực thi: [permission-images.sql:137](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-images.sql#L137).

<a id="public-store_change_signals"></a>

### `public.store_change_signals`

Tín hiệu tối thiểu theo cửa hàng/chủ đề để yêu cầu đọc lại.

Nguồn tạo bảng: **Candidate**, [permission-identity.sql:56](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-identity.sql#L56). PK: `store_id, topic`. Các bổ sung/đổi kiểu được ghim tại từng cột.

| Cột | Kiểu | NULL | Khai báo cột | Ý nghĩa | Nguồn |
| --- | --- | --- | --- | --- | --- |
| `store_id` | `uuid` | Không | — | Định danh cửa hàng/tenant. | [57](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-identity.sql#L57) |
| `topic` | `text` | Không | — | Chủ đề tín hiệu cần đọc lại. | [57](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-identity.sql#L57) |
| `revision` | `bigint` | Không | `check(revision>=0)` | Số phiên bản tăng của catalog/tín hiệu. | [57](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-identity.sql#L57) |
| `event_id` | `uuid` | Không | — | ID sự kiện tín hiệu hiện tại. | [58](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-identity.sql#L58) |
| `target_id` | `uuid` | Có | — | ID đích, không mặc nhiên là FK. | [58](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-identity.sql#L58) |

Ràng buộc cấp bảng/chỉ mục duy nhất (FK khai báo ngay tại cột nằm trong bảng trên):

- `primary key(store_id,topic)` — [58](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-identity.sql#L58).

Không có FK store_id hoặc target_id. PK (store_id,topic) giữ tín hiệu hiện tại theo chủ đề; không phải nhật ký mọi thay đổi và không cung cấp bảo đảm hội tụ/thời gian.

<a id="public-permission_catalog_signals"></a>

### `public.permission_catalog_signals`

Tín hiệu revision catalog toàn cục; không là bảng dữ liệu quyền chi tiết.

Nguồn tạo bảng: **Candidate**, [permission-signals.sql:4](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-signals.sql#L4). PK: `singleton`. Các bổ sung/đổi kiểu được ghim tại từng cột.

| Cột | Kiểu | NULL | Khai báo cột | Ý nghĩa | Nguồn |
| --- | --- | --- | --- | --- | --- |
| `singleton` | `boolean` | Không | `primary key default true check(singleton)` | Khóa boolean chỉ nhận true, cho phép tối đa một dòng. | [5](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-signals.sql#L5) |
| `revision` | `bigint` | Không | `check(revision>=0)` | Số phiên bản tăng của catalog/tín hiệu. | [6](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-signals.sql#L6) |
| `event_id` | `uuid` | Không | — | ID sự kiện tín hiệu hiện tại. | [7](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-signals.sql#L7) |

Singleton toàn cục, không có FK tới permission_catalog_state. Tín hiệu chỉ nhắc đọc lại; revision trùng ý nghĩa không tạo ràng buộc tham chiếu.

<a id="private-permission_contract_gate"></a>

### `private.permission_contract_gate`

Cổng tương thích hợp đồng client; trạng thái strict được activate riêng.

Nguồn tạo bảng: **Candidate**, [permission-compatibility-prepare.sql:4](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-compatibility-prepare.sql#L4). PK: `singleton`. Các bổ sung/đổi kiểu được ghim tại từng cột.

| Cột | Kiểu | NULL | Khai báo cột | Ý nghĩa | Nguồn |
| --- | --- | --- | --- | --- | --- |
| `singleton` | `boolean` | Không | `primary key default true check (singleton)` | Khóa boolean chỉ nhận true, cho phép tối đa một dòng. | [5](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-compatibility-prepare.sql#L5) |
| `strict` | `boolean` | Không | `default false` | Cờ cổng tương thích ở chế độ strict. | [6](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-compatibility-prepare.sql#L6) |
| `contract_version` | `integer` | Không | `default 2 check (contract_version=2)` | Phiên bản hợp đồng permission. | [7](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-compatibility-prepare.sql#L7) |

Được chuẩn bị trước activation; giá trị strict mặc định false không chứng minh trạng thái đích. Mô hình tài liệu không bật cổng hoặc thay quyền truy cập.

## Ranh giới của bản kiểm kê

- Đây là tổng hợp DDL và controller bằng đọc source, không phải kết quả apply/migration, kiểm quyền thực tế hay introspection DB đích.
- Không mô tả toàn bộ function, view, index hiệu năng, policy và trigger ở mức catalog. Các constraint/trigger có ảnh hưởng trực tiếp tới cách hiểu mô hình được nêu; hợp đồng thực thi và bằng chứng tiếp tục ở spec/testing.
- Ba bảng `private.legacy_permission_roles`, `private.legacy_permission_catalog`, `private.legacy_permission_defaults` và enum employee_role chỉ thuộc bridge trước activation. Cột `orders.paid_amount`, `order_items.payment_id` cùng view history_entries đã bị thay bởi mô hình tách đơn; không đưa vào mô hình đích.
- Không thêm entity tài khoản owner email/chuyển quyền sở hữu chỉ từ proposal; đó là phần kế hoạch riêng. Các khoảng thiếu nghiệp vụ/kiểm chứng không được đóng bằng từ điển dữ liệu.

## Đối chiếu staging và bảng vận hành ngoài mô hình N1

Ngày26/10/2026, MCP được khóa vào staging `ineckiashpwloncxnbqx`, `read_only=true`. Catalog PostgreSQL17.11 xác nhận 35 bảng/332 cột của mô hình với tên/kiểu/NULL và PK khớp; 69 FK khớp cột hai phía/ON DELETE, 24 UNIQUE khớp bộ cột. Tám ERD rút gọn vẽ 36 trong 69 FK đó. [Biên bản và metadata gốc](implementation-log/staging-schema-20261026/README.md) ghi phạm vi kiểm; không suy đã so sánh đầy đủ mọi CHECK/default/function body hoặc chứng minh quyền truy cập runtime.

`private.permission_staging_bootstrap_marker` là bảng thứ 36, riêng cho bootstrap staging, được tạo bởi [bootstrap source:72](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/scripts/permission-staging-bootstrap-sql.mjs#L72). Bảng không có FK và không thêm thực thể nghiệp vụ vào tám ERD.

| Cột | Kiểu | NULL | Ràng buộc/default trong catalog |
| --- | --- | --- | --- |
| singleton | boolean | Không | PK; CHECK(singleton); không có default |
| binding | jsonb | Không | Không có default |
| state | text | Không | CHECK(state = 'COMMITTED_NOT_READY'); không có default |

CHECK trên state là định nghĩa schema, không là kết quả đọc giá trị marker. Không đọc binding hoặc dòng dữ liệu nào của bảng này. Không lấy sự hiện diện marker hay schema làm PASS triển khai/kiểm thử.
