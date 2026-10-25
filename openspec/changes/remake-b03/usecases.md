# Use case B03

Ngày:2026-10-22. **Đã hiện thực trên worktree B03 và kiểm chứng local/mock; chưa nghiệm thu sản phẩm, chưa push/merge/deploy.** Xem biên bản kiểm chứng và giới hạn ở docs/workflow/tasks/remake-b03-2026-10-22-validation.md.

## UC-B03-01 — Mở, xem và đóng thanh toán

**Tác nhân:** nhân viên admin/cashier; khách và thiết bị cùng store chịu ảnh hưởng của thanh toán.

**Mục tiêu:** Xem hóa đơn thật của bàn rồi thoát an toàn.

**Tiền điều kiện:** Store mock0001-X8F3QA, bànB02 có đơn24; OrderDrawer không có draft chưa lưu.

### Đầu vào

| Trường | Kiểu | Bắt buộc | Ràng buộc | Ví dụ |
| --- | --- | --- | --- | --- |
| actor | Employee | Có | Đã đăng nhập, role và overrides hiện hữu | admin123456 hoặc cashier111111 |
| orderId | UUID string | Có | Đơn thuộc store đang paired | 7e2f462b-e6ff-491a-85f8-9f4eb53d9c4c |

### Luồng chính

1. Người dùng mở bànB02 và nhấn Thanh toán.
2. Hệ thống tải detail, chọn toàn bộ món, đặt received=due và hiển thị hóa đơn/thu tiền.
3. Người dùng nhấn Quay lại, close hoặc overlay; hệ thống gọi closeDrawer hiện hữu.

### Luồng thay thế

Loading hiển thị “Đang tải đơn thanh toán...”. Không có paymentOrderId hiển thị “Không tìm thấy đơn.”. Query lỗi hiển thị “Không tải được đơn thanh toán” và nút Thử tải lại. Không sinh lệnh ghi từ các trạng thái đọc.

### Luồng ngoại lệ

NOT_FOUND: “Không tìm thấy đơn trong cửa hàng này.”; UNKNOWN: giữ message từ toToastError(error). Loading không có mã lỗi nghiệp vụ.

### Đầu ra

| Trường | Kiểu | Thay đổi / tác dụng phụ |
| --- | --- | --- |
| drawer | DrawerModule|null | Mở payment hoặc đóng về floor; không mở OrderDrawer mới |
| order | OrderDetail|null | Fixture3 dòng,4 món,total125000; không đổi đơn/payment |

### Tiêu chí chấp nhận

- Due125000 và received125000 khi mở đơn24.
- Đóng màn không ghi dữ liệu.

**Truy vết:** R01,R02,R05,R07.

## UC-B03-02 — Chọn món và số lượng trả lần này

**Tác nhân:** nhân viên admin/cashier; khách và thiết bị cùng store chịu ảnh hưởng của thanh toán.

**Mục tiêu:** Trả đúng phần khách chọn.

**Tiền điều kiện:** Đơn24 mở; write không blocked; payableLines lấy từ detail.

### Đầu vào

| Trường | Kiểu | Bắt buộc | Ràng buộc | Ví dụ |
| --- | --- | --- | --- | --- |
| actor | Employee | Có | Đã đăng nhập, role và overrides hiện hữu | admin123456 hoặc cashier111111 |
| orderId | UUID string | Có | Đơn thuộc store đang paired | 7e2f462b-e6ff-491a-85f8-9f4eb53d9c4c |
| selection | Record<UUID,integer> | Có | Mỗi ID hiện hữu có quantity1..line.quantity; bỏ chọn bằng xóa key | {cafeline:1} |
| checked | boolean | Có | true hoặc false | false cho Chọn tất cả |

### Luồng chính

1. Người dùng bỏ Chọn tất cả; hệ thống đặt selection={} và due0.
2. Người dùng chọn cà phê; hệ thống chọn1 và tính due29000.
3. Người dùng nhấn+; hệ thống giữ chu kỳ1→2→1 và cập nhật tiền.

### Luồng thay thế

Chọn tất cả đặt đủ quantity. Refetch cùng đơn chỉ clamp theo detail mới, không đổi empty thành all. Đơn khác khởi tạo all. Offline/attempt chưa settled giữ guard blocked của handler.

### Luồng ngoại lệ

INVALID_ORDER_ITEMS khi gọi flow trực tiếp với lựa chọn sai: “Các món được chọn không hợp lệ. Vui lòng kiểm tra lại đơn.”. UI không gửi khi amountDue<=0.

### Đầu ra

| Trường | Kiểu | Thay đổi / tác dụng phụ |
| --- | --- | --- |
| selection | PaymentSelection | Chỉ đổi phần thanh toán, không sửa OrderDetail |
| amountDue | integerVND>=0 | Σ unitTotal×selectedQuantity |
| received | integerVND | Reset về due khi amountDue đổi như effect hiện hữu |

### Tiêu chí chấp nhận

- Cycle tại max quay về1.
- Option7k×2 phải được tính vào unitTotal43k.
- Refetch không tạo ý định thanh toán mới.

**Truy vết:** R01,R03,R05.

## UC-B03-03 — Nhập tiền khách đưa

**Tác nhân:** nhân viên admin/cashier; khách và thiết bị cùng store chịu ảnh hưởng của thanh toán.

**Mục tiêu:** Kiểm tra tiền nhận và tiền trả lại.

**Tiền điều kiện:** Đơn mở, due125000; chỉ tiền mặt hoạt động.

### Đầu vào

| Trường | Kiểu | Bắt buộc | Ràng buộc | Ví dụ |
| --- | --- | --- | --- | --- |
| actor | Employee | Có | Đã đăng nhập, role và overrides hiện hữu | admin123456 hoặc cashier111111 |
| orderId | UUID string | Có | Đơn thuộc store đang paired | 7e2f462b-e6ff-491a-85f8-9f4eb53d9c4c |
| receivedInput | string | Có | Chỉ giữ0–9, cắt9 chữ số; rỗng→0 | 200.000 |
| quick | enum | Không | Đúng tiền,+20k,+50k,200k,500k | +20k |
| key | enum string | Không | 0..9,00,delete | delete |

### Luồng chính

1. Người dùng nhập200000; hệ thống hiển thị200.000 và trả lại75000.
2. Người dùng bấm+20k; hệ thống đặt received=due+20000=145000.
3. Người dùng xóa hoặc nhấn phím số; hệ thống giữ quy tắc9 chữ số hiện hữu.

### Luồng thay thế

Nếu received124999, hiển thị “Còn thiếu 1 ₫.” theo formatVnd và khóa pay. Giữ điều kiện hiện/ẩn quick buttons khi insufficient. Quick set giữ hàm riêng, không tự áp giới hạn mới ngoài input/keypad.

### Luồng ngoại lệ

PAYMENT_AMOUNT_TOO_LOW ở flow: “Tiền nhận chưa đủ để thanh toán phần đã chọn.”.

### Đầu ra

| Trường | Kiểu | Thay đổi / tác dụng phụ |
| --- | --- | --- |
| received | integerVND>=0 | Direct/keypad tối đa999999999; quick theo quy tắc hiện hữu |
| change | integerVND | received−due; âm là thiếu tiền |
| paymentDisabled | boolean | True khi thiếu tiền, cùng các điều kiện khác hiện có |

### Tiêu chí chấp nhận

- +20k không cộng vào received cũ.
- Phím và nhãn gợi ý đúng, target>=44px.
- Không đổi số học tiền hoặc xử lý9 chữ số.

**Truy vết:** R01,R04,R07.

## UC-B03-04 — Xác nhận thanh toán toàn bộ hoặc một phần

**Tác nhân:** nhân viên admin/cashier; khách và thiết bị cùng store chịu ảnh hưởng của thanh toán.

**Mục tiêu:** Ghi đúng giao dịch đã xác nhận một lần.

**Tiền điều kiện:** Actor có payment.take; đơn mở; query không lỗi; đủ tiền; selection khác rỗng; online; attempt settled.

### Đầu vào

| Trường | Kiểu | Bắt buộc | Ràng buộc | Ví dụ |
| --- | --- | --- | --- | --- |
| actor | Employee | Có | Đã đăng nhập, role và overrides hiện hữu | admin123456 hoặc cashier111111 |
| orderId | UUID string | Có | Đơn thuộc store đang paired | 7e2f462b-e6ff-491a-85f8-9f4eb53d9c4c |
| selection | PaymentSelection | Có | Integer1..qty của ID món hiện hữu | Toàn bộ hoặc cà phê1 |
| expectedVersion | integer | Có | Giữ order.lockVersion | 3 |
| receivedAmount | integerVND | Có | >=selectionAmount | 200000 hoặc50000 |
| printReceipt | boolean | Có | Mặc địnhtrue | false cho test không in |

### Luồng chính

1. Người dùng nhấn pay header/footer; hệ thống giữ paymentDisabled, confirmedOrder và captureView.
2. Mutation gọi flow/coordinator hiện hữu với cùng order, actor, received, selection và printReceipt.
3. Full success đóng drawer; split success giữ drawer, xóa selection và refetch nguồn. Receipt theo initialSuccess.

### Luồng thay thế

Retry/tra cứu đi qua WriteAttemptNotice và giữ cùng K/payload. Closed/denied/pending/offline khóa pay. Kết quả của view đã đóng không được đưa toast/receipt/close sang view mới.

### Luồng ngoại lệ

FORBIDDEN tại guard: “Nhân viên không có quyền thực hiện thao tác này.”; protocol: “Bạn không có quyền thực hiện thao tác này.”. ORDER_VERSION_CONFLICT: “Đơn đã thay đổi. Hãy tải lại, kiểm tra rồi xác nhận một thao tác mới.”. PAYMENT_AMOUNT_TOO_LOW/INVALID_ORDER_ITEMS như UC02/03. WRITE_RESULT_UNKNOWN: “Chưa xác định kết quả trên server. Hãy tra cứu thao tác trước khi tiếp tục.”. EMPLOYEE_SESSION_REQUIRED: “Phiên nhân viên đã hết hiệu lực. Vui lòng nhập lại PIN.”. AUTH_REQUIRED: “Chưa ghép cửa hàng. Vui lòng đăng nhập lại.”. Giữ mapping/title và notifyUiError hiện hữu.

### Đầu ra

| Trường | Kiểu | Thay đổi / tác dụng phụ |
| --- | --- | --- |
| fullResult | PayOrderItemsFlowResult(mode=full) | Đơn paid, bàn trống, đóng drawer; toast “Đã thanh toán. Bàn đã trống.” |
| splitResult | PayOrderItemsFlowResult(mode=split) | Trả29k, nguồn96k,selection={},due0; toast hiện hữu chứa orderNo,total,sourceTotal |
| operation | OperationView | Giữ K,payload,expectedVersion,immutable receipt,initialSuccess |

### Tiêu chí chấp nhận

- Hai nút pay gọi cùng handler, không double write.
- Thiếu quyền bị chặn cả UI và gọi flow trực tiếp.
- Split không tự chọn phần còn lại.

**Truy vết:** R01,R03,R04,R05.

## UC-B03-05 — Xem tạm tính và hóa đơn

**Tác nhân:** nhân viên admin/cashier; khách và thiết bị cùng store chịu ảnh hưởng của thanh toán.

**Mục tiêu:** Kiểm tra bản in đúng giao dịch.

**Tiền điều kiện:** Detail đã tải cho tạm tính; receipt lấy từ mutation thành công.

### Đầu vào

| Trường | Kiểu | Bắt buộc | Ràng buộc | Ví dụ |
| --- | --- | --- | --- | --- |
| actor | Employee | Có | Đã đăng nhập, role và overrides hiện hữu | admin123456 hoặc cashier111111 |
| orderId | UUID string | Có | Đơn thuộc store đang paired | 7e2f462b-e6ff-491a-85f8-9f4eb53d9c4c |
| variant | enum(ticket,receipt) | Có | Đúng kiểu ReceiptPreview hiện hữu | ticket |
| printReceipt | boolean | Có | Mặc địnhtrue | true |

### Luồng chính

1. Người dùng nhấn In tạm tính; hệ thống dựng ticketFromOrderDetail và mở preview.
2. Người dùng đóng preview, trở về drawer không ghi dữ liệu.
3. Sau thanh toán, hệ thống chỉ mở receipt nếu printReceipt và initialSuccess.

### Luồng thay thế

Bỏ checkbox in thì thanh toán không mở receipt. Giữ browser print preview. Popup nằm trên drawer và giữ focus hợp lệ; drawer không lấy focus từ popup trên.

### Luồng ngoại lệ

RECEIPT_UNAVAILABLE: “Đơn chưa thanh toán hoặc đã hủy nên không thể in hóa đơn.”; UNKNOWN giữ message từ print port nếu có.

### Đầu ra

| Trường | Kiểu | Thay đổi / tác dụng phụ |
| --- | --- | --- |
| receiptPreview | ReceiptPreview|null | Giữ payload ticket/receipt hiện hữu |
| sideEffect | Mở preview; chỉ in khi người dùng nhấn In | Không register/execute chỉ vì xem tạm tính. Mở receipt sau pay chỉ là preview, không tự gọi browser print. Nút In mới revalidate getReceipt rồi in iframe theo ReceiptPreview.tsx:333–347 |

### Tiêu chí chấp nhận

- Ticket không ghi đơn.
- Retry terminal không tự in thêm.
- Đóng preview không mất selection/received.

**Truy vết:** R01,R06,R07.

## UC-B03-06 — Thao tác trên màn hình nhỏ và theme chung

**Tác nhân:** nhân viên admin/cashier; khách và thiết bị cùng store chịu ảnh hưởng của thanh toán.

**Mục tiêu:** Đọc và thanh toán được trên thiết bị ngang nhỏ.

**Tiền điều kiện:** B03 render; viewport ngang>=568×320. Preview normalized chưa thực hiện giao dịch.

### Đầu vào

| Trường | Kiểu | Bắt buộc | Ràng buộc | Ví dụ |
| --- | --- | --- | --- | --- |
| viewport | {width:integer,height:integer} CSSpx | Có | width>=568,height>=320,width>height | 568×320,1101×600 |
| method | enum(touch,mouse,keyboard) | Có | Pointer,Tab,ShiftTab,Enter,Escape | keyboard |
| palette | PaletteAJSON | Có | 22 semantic tokens, font cục bộ | pos-cafe-teal-a-v1 |

### Luồng chính

1. Người dùng mở B03 và cuộn body/invoice/cashier theo kích thước.
2. Người dùng Tab tới input/checkbox/keypad/pay; focus rõ và nhường popup trên cùng.
3. Hệ thống giữ footer/close tới được, bọc/cuộn nội dung dài, không scale chữ.

### Luồng thay thế

<=760 một cột; <=1100 panel phủ màn; <=480 chiều cao footer một hàng và body cuộn. Tại1101×600 invoice có min-height420 để vùng món còn dùng được. Kiểm200% zoom và visual viewport khi bàn phím mở.

### Luồng ngoại lệ

Không phát sinh AppError từ responsive/theme; lỗi nghiệp vụ giữ UC01–05.

### Đầu ra

| Trường | Kiểu | Thay đổi / tác dụng phụ |
| --- | --- | --- |
| layout | CSS geometry | Controls>=44px,font>=12px,document overflow<=1px,CTA tới được |
| theme | 22CSS variables+MUItheme | Cùng canonical JSON, font thực sự đã tải |

### Tiêu chí chấp nhận

- Đủ20 viewport và sweep, không gán fidelity cho viewport thiếu reference.
- Tiền/phím số/checked đúng nội dung, không ẩn lỗi để pass audit.
- Thay theme chung đổi đồng bộ CSS/Tailwind/MUI.

**Truy vết:** R02,R07,R08,R09.
