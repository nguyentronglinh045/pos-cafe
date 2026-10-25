# B01 — Use cases cụ thể

Không có mã lỗi mới. Các mã UNKNOWN/FORBIDDEN đã có trong AppErrorCode. Error hạ tầng được mapper UNKNOWN giữ Error.message; thông báo dưới đây là đúng chuỗi UI.

## UC-B01-01 — Xem và lọc sơ đồ

- Tác nhân: nhân viên admin/cashier đã mở khóa trong store hiện hữu.
- Mục tiêu: Xem đúng khu vực và trạng thái bàn.
- Tiền điều kiện: phiên store đã paired; dữ liệu dùng ports hiện có; landscape trong hợp đồng.

### Đầu vào

| Trường | Kiểu | Ràng buộc | Ví dụ |
|---|---|---|---|
| areaId | UUID string \| null | null chỉ khi chưa chọn; sau chọn thuộc FloorPlan.areas[].id | 045eee43-5266-442f-8e87-978c1cc30d0c |
| tableFilter | enum string | all / empty / occupied; mặc định all | empty |

### Luồng chính

1. Sau PIN, hệ thống đọc floor plan và open orders bằng hooks hiện hữu.
2. Người dùng chọn khu vực, hệ thống đổi activeAreaId.
3. Người dùng chọn filter; hệ thống lọc occupied khi status=occupied hoặc có open order cùng tableId.
4. Người dùng cuộn canvas để tới bàn; stage vẫn1600×900.

### Luồng thay thế

Khi activeAreaId null, chọn khu vực đầu tiên từ query. Lọc không có kết quả hiển thị “Không có bàn phù hợp với bộ lọc.”.

### Luồng ngoại lệ

- UNKNOWN: lỗi đọc floor hiển thị “Không tải được sơ đồ bàn.” + Error.message/toToastError; retry “Thử tải lại”. Lỗi orders hiển thị “Không tải được đơn đang mở.”, retry “Thử lại”. Empty/loading là trạng thái, không phải mã lỗi.
- FORBIDDEN: khi gọi guarded module/flow không đủ quyền giữ “Nhân viên không có quyền dùng chức năng này.”. Không đổi luật ở data layer; không thêm endpoint.

### Đầu ra

| Trường | Kiểu | Thay đổi và tác dụng phụ |
|---|---|---|
| activeAreaId | UUID string \| null | setActiveAreaId cập nhật khi chọn khu vực |
| visibleTables | FloorTable[] | Chỉ bàn areaId hiện tại và predicate filter; giữ id/posX/posY/width/height/rotation/shape/seats/status/backgroundAssetKey |
| summary | {seats:number,occupiedPercent:number,shown:number,total:number} | seats tổng seats≥0; percent=round(occupied/all×100), all=0→0; không ghi DB |

### Tiêu chí chấp nhận

Không ghi layout, không đổi coords/assets/status; số lượng và summary khớp query; keyboard/touch cuộn tới được bàn. Requirements responsive/fidelity/theme theo spec chung.

### Truy vết

B01-01, B01-02, B01-04, B01-07, B01-08.

## UC-B01-02 — Mở đơn từ bàn hoặc thẻ đơn

- Tác nhân: nhân viên admin/cashier đã mở khóa trong store hiện hữu.
- Mục tiêu: Mở đúng đơn và giữ dữ liệu người dùng.
- Tiền điều kiện: phiên store đã paired; dữ liệu dùng ports hiện có; landscape trong hợp đồng.

### Đầu vào

| Trường | Kiểu | Ràng buộc | Ví dụ |
|---|---|---|---|
| tableId | UUID string \| null | UUID thuộc FloorTable.id khi dine_in; null khi takeover card takeaway | a254abd0-b883-4d5c-85c1-89f660409e02 |
| cachedOrder | OrderSummary \| undefined | Nếu có: id UUID, tableId UUID\|null, orderType dine_in/takeaway, total:number≥0 | order#24,total125000 |
| orderType | enum string | dine_in hoặc takeaway, theo table/card | dine_in |

### Luồng chính

1. Người dùng nhấn bàn có cached order; hệ thống gọi openOrder đúng context, không refetch thêm.
2. Với bàn chưa có cached order, hệ thống chờ openOrdersQuery.refetch() trước tìm freshOrder.
3. Nhấn card gọi openOrder với id và loại đơn của card.
4. Người dùng đóng drawer; nếu có draft thì giữ dialog/guard hiện hữu.

### Luồng thay thế

Bàn không có đơn cả sau refetch mở context orderId=null. Card mang đi mở tableId=null. Quay lại từ payment giữ hành vi closeDrawer hiện tại.

### Luồng ngoại lệ

- UNKNOWN: lỗi đọc floor hiển thị “Không tải được sơ đồ bàn.” + Error.message/toToastError; retry “Thử tải lại”. Lỗi orders hiển thị “Không tải được đơn đang mở.”, retry “Thử lại”. Empty/loading là trạng thái, không phải mã lỗi.
- FORBIDDEN: khi gọi guarded module/flow không đủ quyền giữ “Nhân viên không có quyền dùng chức năng này.”. Không đổi luật ở data layer; không thêm endpoint.

### Đầu ra

| Trường | Kiểu | Thay đổi và tác dụng phụ |
|---|---|---|
| drawer | DrawerModule | order khi điều hướng được chấp nhận; giữ dirty-exit guard hiện tại |
| orderContext | {orderId:UUID\|null,tableId:UUID\|null,orderType:dine_in\|takeaway} | cached→orderId cached; bàn không cached→refetch rồi id mới/null; takeaway→tableId null |
| read effect | listOpenOrders():Promise<OrderSummary[]> | Chỉ refetch trước mở bàn không cached; không mutation/create/pay từ mở drawer |

### Tiêu chí chấp nhận

Không sai bàn/đơn, không tạo đơn chỉ vì mở drawer; không bỏ qua guard draft. Order/Payment giữ viewport screen mặc định. Requirements responsive/fidelity/theme theo spec chung.

### Truy vết

B01-03, B01-05.

## UC-B01-03 — Làm mới và thử lại dữ liệu

- Tác nhân: nhân viên admin/cashier đã mở khóa trong store hiện hữu.
- Mục tiêu: Đọc lại dữ liệu khi cần và thấy trạng thái lỗi rõ ràng.
- Tiền điều kiện: phiên store đã paired; dữ liệu dùng ports hiện có; landscape trong hợp đồng.

### Đầu vào

| Trường | Kiểu | Ràng buộc | Ví dụ |
|---|---|---|---|
| action | enum string | refresh / floor-retry / orders-retry | floor-retry |
| queryState | loading \| error \| success | Từ TanStack Query; error là Error hoặc AppError hiện hữu | Error("Không thể kết nối tới máy chủ.") |

### Luồng chính

1. Người dùng nhấn Làm mới; hai refetch chạy và toast hiện như baseline.
2. Khi query lỗi, hệ thống hiển thị trạng thái lỗi và nút retry tương ứng.
3. Người dùng nhấn retry; query tương ứng đọc lại dữ liệu.
4. Thành công hiển thị canvas/list, lỗi tiếp tục hiển thị thông báo.

### Luồng thay thế

Khi loading không dựng dữ liệu giả. Tại viewport thấp vùng thông báo cuộn riêng để nút retry không bị footer che.

### Luồng ngoại lệ

- UNKNOWN: lỗi đọc floor hiển thị “Không tải được sơ đồ bàn.” + Error.message/toToastError; retry “Thử tải lại”. Lỗi orders hiển thị “Không tải được đơn đang mở.”, retry “Thử lại”. Empty/loading là trạng thái, không phải mã lỗi.
- FORBIDDEN: khi gọi guarded module/flow không đủ quyền giữ “Nhân viên không có quyền dùng chức năng này.”. Không đổi luật ở data layer; không thêm endpoint.

### Đầu ra

| Trường | Kiểu | Thay đổi và tác dụng phụ |
|---|---|---|
| refresh result | Promise<QueryObserverResult> từ hai query | refresh gọi floorPlanQuery.refetch và openOrdersQuery.refetch; toast ngay “Đã làm mới dữ liệu” như baseline |
| retry result | Promise<QueryObserverResult> | floor-retry chỉ refetch floor; orders-retry chỉ refetch orders |
| visible state | string hoặc list query | Floor loading “Đang tải sơ đồ...”; empty “Chưa có bàn. Vào Sơ đồ để tạo bàn.”; orders loading “Đang tải đơn đang mở...”; empty dine_in “Chưa có đơn tại bàn.” |

### Tiêu chí chấp nhận

Giữ callbacks/query keys/polling. Các trạng thái không crash; retry và refresh tới được bằng keyboard/touch, không thay thông báo nghiệp vụ. Requirements responsive/fidelity/theme theo spec chung.

### Truy vết

B01-04, B01-08.

## UC-B01-04 — Điều hướng theo quyền và khóa phiên

- Tác nhân: nhân viên admin/cashier đã mở khóa trong store hiện hữu.
- Mục tiêu: Truy cập chức năng được phép và kết thúc phiên.
- Tiền điều kiện: phiên store đã paired; dữ liệu dùng ports hiện có; landscape trong hợp đồng.

### Đầu vào

| Trường | Kiểu | Ràng buộc | Ví dụ |
|---|---|---|---|
| currentEmployee | Employee \| null | Employee.id UUID, role admin/cashier/kitchen, isActive boolean; shell chỉ sau mở khóa | role=cashier,isActive=true |
| module | DrawerModule enum \| null | null→floor; order/payment/takeaway/writeRecovery/menuEditor/floorEditor/report/orderHistory/employees/settings/paymentSettings theo registry hiện hữu | menuEditor |
| lockRequested | boolean | true khi nhấn Khoá; false ở nav thông thường | true |

### Luồng chính

1. Người dùng chọn module, hệ thống kiểm canAccessModule trước guardedOpen.
2. Hệ thống mở drawer đúng registry; module bị cấm giữ disabled.
3. Người dùng nhấn Khoá; currentEmployee=null, closeDrawer và setScreen(passcode) như baseline.
4. Người dùng có thể mở khóa lại bằng PIN hiện hữu.

### Luồng thay thế

Nav floor đóng drawer qua guard hiện tại. Module writeRecovery/takeaway giữ handlers và guard seam như nguồn; không giả định disabled nav là ranh giới bảo mật.

### Luồng ngoại lệ

- UNKNOWN: lỗi đọc floor hiển thị “Không tải được sơ đồ bàn.” + Error.message/toToastError; retry “Thử tải lại”. Lỗi orders hiển thị “Không tải được đơn đang mở.”, retry “Thử lại”. Empty/loading là trạng thái, không phải mã lỗi.
- FORBIDDEN: khi gọi guarded module/flow không đủ quyền giữ “Nhân viên không có quyền dùng chức năng này.”. Không đổi luật ở data layer; không thêm endpoint.

### Đầu ra

| Trường | Kiểu | Thay đổi và tác dụng phụ |
|---|---|---|
| drawer | DrawerModule \| null | Mở module qua openDrawer/guardedOpen hoặc closeDrawer; không thêm module/quyền |
| session UI | {currentEmployee:null,screen:passcode} | Khi khóa theo actions hiện hữu; không lưu credential mới |
| permission feedback | disabled:boolean / toast:string | Admin-only disabled với cashier; guardedOpen từ chối bằng “Nhân viên không có quyền dùng chức năng này.”; flow/data guards không đổi |

### Tiêu chí chấp nhận

Cashier chỉ bật module đúng baseline; admin truy cập được; flow bypass vẫn FORBIDDEN khi thiếu quyền. Theme/token/font và portal cùng scope. Requirements responsive/fidelity/theme theo spec chung.

### Truy vết

B01-05, B01-06, B01-07, B01-08.

## UC-B01-05 — Mở panel đơn thu gọn

- Tác nhân: nhân viên admin/cashier đã mở khóa trong store hiện hữu.
- Mục tiêu: Chọn đơn trên màn hình ngang nhỏ.
- Tiền điều kiện: phiên store đã paired; dữ liệu dùng ports hiện có; landscape trong hợp đồng.

### Đầu vào

| Trường | Kiểu | Ràng buộc | Ví dụ |
|---|---|---|---|
| viewport | {width:number,height:number} | CSS integer width≥568,height≥320,width>height; compact width<1280 | 568×320 |
| ordersOpen | boolean | Mặc định false; UI state, không persist | false |
| action | enum string | toggle / close / Escape / select-order / resize | Escape |

### Luồng chính

1. Ở width<1280 người dùng nhấn Đơn đang mở.
2. Panel mở, focus vào nút đóng, keyboard Tab/Shift+Tab ở trong panel.
3. Người dùng cuộn list và chọn đơn hoặc nhấn close/Escape.
4. Đóng panel trả focus nút mở nếu không điều hướng sang drawer.

### Luồng thay thế

Width≥1280 panel thường trực360px, không áp dialog/focus trap. Resize sang persistent không để background inert hoặc focus kẹt.

### Luồng ngoại lệ

- UNKNOWN: lỗi đọc floor hiển thị “Không tải được sơ đồ bàn.” + Error.message/toToastError; retry “Thử tải lại”. Lỗi orders hiển thị “Không tải được đơn đang mở.”, retry “Thử lại”. Empty/loading là trạng thái, không phải mã lỗi.
- FORBIDDEN: khi gọi guarded module/flow không đủ quyền giữ “Nhân viên không có quyền dùng chức năng này.”. Không đổi luật ở data layer; không thêm endpoint.

### Đầu ra

| Trường | Kiểu | Thay đổi và tác dụng phụ |
|---|---|---|
| ordersOpen | boolean | toggle→true; close/Escape/select-order/resize sang persistent→false |
| panel accessibility | {role:dialog\|undefined,ariaModal:boolean\|undefined,ariaExpanded:boolean} | compact mở→dialog/modal, background inert, focus trap; đóng→không nằm trong tab order |
| focus | HTMLElement\|null | Mở focus nút Đóng danh sách đơn; đóng trả nút toggle trừ khi chuyển drawer |
| selection | OrderContext hiện hữu hoặc không thay đổi | Chọn card→UC02; đóng/resize không ghi đơn |

### Tiêu chí chấp nhận

Toggle/close≥44×44, list dài cuộn tới cuối, overlay không tồn tại khi đóng. Context chọn đơn giữ nguyên, không thêm preview nghiệp vụ. Requirements responsive/fidelity/theme theo spec chung.

### Truy vết

B01-01, B01-07, B01-08.

