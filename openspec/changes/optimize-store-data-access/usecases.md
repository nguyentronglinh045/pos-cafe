> **Đối chiếu xuất bản 25/10/2026.** Kế hoạch15/09, chưa xác nhận toàn change đã triển khai. Lô A được duyệt trước đo; store_pulse/60s là lựa chọn ghi nhận, nhưng ngưỡng20MB, lịch và ranh giới còn mở. Ước lượng request/egress bên dưới dựa raw repos/polling cũ, không là số đo main711a22e đang dùng projections/foreground polling. [Nguồn, trạng thái và giới hạn](../../../docs/workflow/tasks/docs-wip-publication-2026-10-25.md). Các yêu cầu SHALL/expected bên dưới được giữ; không đổi để hợp thức hóa code.

# Use case

Change này đổi cách thiết bị phát hiện thay đổi, nên nó **có** hành vi người dùng nhìn thấy: dữ liệu xuất hiện trên máy khác nhanh hay chậm, và màn hình có hiển thị dữ liệu cũ hay không. Vì vậy file này được viết đầy đủ, không áp điều khoản miễn trừ của `openspec/SPEC-STANDARD.md`.

Tác nhân chính là **nhân viên quán** trên thiết bị POS. Một use case có tác nhân là **nhà phát triển**, vì nó mô tả cổng chặn khi thêm một đường ghi mới; nó vẫn kiểm chứng được nên vẫn giữ ở đây.

---

## UC-LOAD-01 — Nhân viên thấy bàn đổi trạng thái khi máy khác mở đơn

| | |
| --- | --- |
| **Tác nhân** | Nhân viên trên thiết bị B. Ảnh hưởng: nhân viên trên thiết bị A, khách tại bàn |
| **Mục tiêu** | Nhìn vào sơ đồ bàn và tin được rằng nó đúng với thực tế ngay lúc này |
| **Tiền điều kiện** | Hai thiết bị cùng đăng nhập một cửa hàng, cùng ở màn hình sàn, có mạng, bàn T05 đang trống |

**Đầu vào**

| Trường | Kiểu | Bắt buộc | Ràng buộc | Ví dụ |
| --- | --- | --- | --- | --- |
| Hành động trên thiết bị A | liệt kê | có | Một trong: mở đơn, sửa đơn, thanh toán, hủy đơn | `mở đơn` |
| Mã bàn | chuỗi | có | Bàn thuộc cửa hàng đang đăng nhập, đang ở trạng thái trống | `T05` |
| Trạng thái tab thiết bị B | liệt kê | có | `hiển thị` hoặc `ẩn`. Use case này chỉ xét `hiển thị` | `hiển thị` |

**Luồng chính**

1. Nhân viên trên thiết bị A mở đơn mới tại bàn T05.
2. Giao dịch ghi thành công và làm tăng `orders_version` cùng `floor_version` của cửa hàng, trong cùng giao dịch.
3. Thiết bị B chạy nhịp kiểm tra định kỳ, gọi lời gọi đọc pulse.
4. Thiết bị B so bộ đếm nhận về với bộ đếm đang giữ, thấy khác.
5. Thiết bị B tải lại sơ đồ bàn và danh sách đơn đang mở, mỗi thứ đúng một lời gọi.
6. Bàn T05 hiển thị ở trạng thái đang phục vụ trên thiết bị B.

**Luồng thay thế**

- 3a. Tín hiệu thời gian thực tới thiết bị B trước nhịp kiểm tra: thiết bị B làm mới ngay, không chờ hết chu kỳ 5 giây. Nhiều tín hiệu trong 250 ms được gộp thành một lượt.
- 5a. Thiết bị B đang mở drawer chi tiết một đơn khác: chỉ nhóm dữ liệu có version đổi được tải lại; drawer đang mở không bị đóng.

**Luồng ngoại lệ**

| Nhánh | Điều kiện | Kết quả |
| --- | --- | --- |
| 3a | Lời gọi đọc pulse lỗi mạng | Thiết bị B giữ nguyên dữ liệu đang hiển thị, thử lại ở nhịp sau, **không** hiện thông báo lỗi cho nhịp lẻ |
| 4a | Không tìm thấy dòng pulse của cửa hàng | Thiết bị B tải đầy ở mọi nhịp, tức lùi về hành vi hiện tại; ghi nhật ký kỹ thuật, không hiện lỗi cho người dùng |
| 5a | Lời gọi tải lại bị từ chối vì phiên hết hạn | Áp đúng xử lý phiên hiện hành với mã `AUTH_REQUIRED`; không có xử lý riêng cho đường pulse |

**Đầu ra**

| Kết quả | Chi tiết |
| --- | --- |
| Trạng thái hiển thị | Bàn T05 chuyển sang đang phục vụ trên thiết bị B |
| Số lời gọi của thiết bị B cho lượt này | 1 lời gọi pulse cộng 2 lời gọi tải lại |
| Thay đổi trạng thái hệ thống | Không. Thiết bị B chỉ đọc |
| Tác dụng phụ | Không |

**Tiêu chí chấp nhận**

- Thiết bị B hiển thị trạng thái mới trong vòng 5 giây kể từ khi giao dịch trên A hoàn tất, khi tín hiệu thời gian thực hoạt động bình thường.
- Trong lượt đó, thiết bị B không gọi lại thực đơn và không gọi lại báo cáo, vì `menu_version` không đổi.
- Không có lời gọi tuần tự phụ thuộc nhau trong bước 5.

**Truy vết** — LOAD-01, LOAD-03, LOAD-04, LOAD-06.

---

## UC-LOAD-02 — Máy để quên ở quán đã đóng cửa

| | |
| --- | --- |
| **Tác nhân** | Không có người thao tác. Ảnh hưởng: chủ quán, qua hóa đơn dịch vụ và hạn mức gói |
| **Mục tiêu** | Thiết bị không tiêu tài nguyên khi không ai dùng và không có gì thay đổi |
| **Tiền điều kiện** | Một thiết bị đăng nhập, tab đang hiển thị, quán đã đóng cửa, không có thao tác ghi nào |

**Đầu vào**

| Trường | Kiểu | Bắt buộc | Ràng buộc | Ví dụ |
| --- | --- | --- | --- | --- |
| Khoảng thời gian quan sát | số nguyên, phút | có | ≥ 5 | `60` |
| Số thao tác ghi trong khoảng đó | số nguyên | có | Use case này cố định bằng 0 | `0` |

**Luồng chính**

1. Thiết bị chạy nhịp kiểm tra mỗi 5 giây trong suốt khoảng quan sát.
2. Mỗi nhịp trả về bộ đếm không đổi.
3. Thiết bị không tải lại dữ liệu vận hành theo đường pulse.
4. Mỗi 60 giây, lưới an toàn vẫn tải đầy một lượt.

**Luồng thay thế**

- 1a. Tab chuyển sang ẩn: hành vi khi tab ẩn **không thuộc phạm vi change này**, xem `optimize-runtime-load`. Ở đây chỉ xét tab hiển thị.

**Luồng ngoại lệ**

| Nhánh | Điều kiện | Kết quả |
| --- | --- | --- |
| 2a | Mất mạng giữa chừng | Nhịp kiểm tra thất bại lặng lẽ và thử lại; khi có mạng lại, nhịp kế tiếp phát hiện chênh version nếu có |

**Đầu ra**

| Kết quả | Chi tiết |
| --- | --- |
| Số lời gọi trong 60 phút | 720 lời gọi pulse cộng 60 lượt lưới an toàn |
| Byte đọc trong 60 phút | Chủ yếu là payload pulse; phần payload đầy chỉ đến từ lưới an toàn |
| Thay đổi trạng thái hệ thống | Không |

**Tiêu chí chấp nhận**

- Trong 60 phút không có thao tác ghi, số lượt tải đầy đúng bằng số nhịp lưới an toàn, không nhiều hơn.
- Tổng byte đọc trong khoảng đó thấp hơn ít nhất 5 lần so với giá trị nền đo trước tối ưu, trên cùng kịch bản.

**Truy vết** — LOAD-01, LOAD-02, LOAD-07.

---

## UC-LOAD-03 — Lưới an toàn cứu một trigger bị sót

| | |
| --- | --- |
| **Tác nhân** | Nhân viên trên thiết bị B. Ảnh hưởng: khách hàng, vì dữ liệu sai dẫn tới tính tiền sai |
| **Mục tiêu** | Không bao giờ nhìn thấy dữ liệu cũ một cách vĩnh viễn, kể cả khi hệ có lỗi |
| **Tiền điều kiện** | Tồn tại một đường ghi không làm tăng bộ đếm version, do sót khi hiện thực |

**Đầu vào**

| Trường | Kiểu | Bắt buộc | Ràng buộc | Ví dụ |
| --- | --- | --- | --- | --- |
| Đường ghi bị sót | chuỗi | có | Tên lời gọi ghi | `pay_order_items` |
| Trạng thái tín hiệu thời gian thực | liệt kê | có | `bình thường` hoặc `mất` | `mất` |

**Luồng chính**

1. Thiết bị A ghi qua đường bị sót; dữ liệu đổi nhưng bộ đếm không đổi.
2. Thiết bị B chạy nhịp kiểm tra, thấy bộ đếm không đổi, không tải lại.
3. Tới nhịp lưới an toàn, thiết bị B tải đầy vô điều kiện.
4. Thiết bị B hiển thị trạng thái mới.

**Luồng thay thế**

- 2a. Tín hiệu thời gian thực vẫn hoạt động: thiết bị B làm mới sớm hơn nhờ tín hiệu, không phải chờ hết 60 giây. Lưới an toàn khi đó là lớp thứ ba, không phải lớp duy nhất.

**Luồng ngoại lệ**

| Nhánh | Điều kiện | Kết quả |
| --- | --- | --- |
| 3a | Lưới an toàn bị tắt bằng cấu hình | Trạng thái này **không được phép tồn tại** trong bản chạy thật, theo LOAD-02. Nếu phát hiện, coi là lỗi chặn phát hành |

**Đầu ra**

| Kết quả | Chi tiết |
| --- | --- |
| Độ trễ tối đa | 60 giây kể từ khi giao dịch trên A hoàn tất |
| Thông báo hiển thị | Không. Người dùng không cần biết cơ chế nào đã cứu |

**Tiêu chí chấp nhận**

- Với tín hiệu thời gian thực bị chặn hoàn toàn và bộ đếm không tăng, thiết bị B vẫn hiển thị trạng thái mới trong không quá 60 giây.

**Truy vết** — LOAD-02, LOAD-04.

---

## UC-LOAD-04 — Mở chi tiết một đơn đã thanh toán

| | |
| --- | --- |
| **Tác nhân** | Thu ngân. Ảnh hưởng: khách đang chờ xem lại hóa đơn |
| **Mục tiêu** | Mở chi tiết đơn nhanh, không phải chờ nhiều lượt tải nối nhau |
| **Tiền điều kiện** | Đơn tồn tại, đã thanh toán, thuộc cửa hàng đang đăng nhập |

**Đầu vào**

| Trường | Kiểu | Bắt buộc | Ràng buộc | Ví dụ |
| --- | --- | --- | --- | --- |
| `orderId` | chuỗi UUID | có | Đơn phải thuộc cửa hàng đang đăng nhập | `9f1c…` |
| Số món trong đơn | số nguyên | có | ≥ 0 | `5` |
| Số tùy chọn của các món | số nguyên | có | ≥ 0 | `8` |

**Luồng chính**

1. Thu ngân chạm vào một đơn trong danh sách.
2. Thiết bị gửi đúng một lời gọi lấy chi tiết đơn.
3. Backend trả về đơn, các món, các tùy chọn và bản ghi thanh toán trong một kết quả.
4. Màn hình hiển thị chi tiết đơn.

**Luồng thay thế**

- 3a. Đơn chưa thanh toán: kết quả không có phần thanh toán; màn hình hiển thị đơn ở trạng thái đang mở.
- 3b. Đơn không có món nào: kết quả có danh sách món rỗng, không phát sinh lời gọi phụ.

**Luồng ngoại lệ**

| Nhánh | Điều kiện | Kết quả |
| --- | --- | --- |
| 3a | Đơn không tồn tại hoặc thuộc cửa hàng khác | Mã lỗi `NOT_FOUND`, hiển thị "Không tìm thấy đơn." |
| 3b | Phiên cửa hàng không hợp lệ | Mã lỗi `AUTH_REQUIRED`, áp xử lý phiên hiện hành |

**Đầu ra**

| Kết quả | Chi tiết |
| --- | --- |
| Dữ liệu trả về | Một đối tượng chi tiết đơn, hình dạng không đổi so với kiểu hiện có trong `src/domain` |
| Số lời gọi | Đúng 1 |
| Thay đổi trạng thái hệ thống | Không |

**Tiêu chí chấp nhận**

- Số lời gọi mạng cho thao tác này đúng bằng 1, kiểm bằng cách đếm request trong test.
- Kiểu dữ liệu trả về khớp kiểu hiện có, nên bộ test adapter hiện hành chạy qua mà không phải sửa kỳ vọng nghiệp vụ.

**Truy vết** — LOAD-03.

---

## UC-LOAD-05 — Nhà phát triển thêm một đường ghi mới

| | |
| --- | --- |
| **Tác nhân** | Nhà phát triển. Ảnh hưởng: mọi nhân viên dùng hệ sau đó |
| **Mục tiêu** | Thêm một lời gọi ghi mà không vô tình tạo ra vùng dữ liệu không bao giờ được đồng bộ |
| **Tiền điều kiện** | Lô B đã chạy, bảng `store_pulse` và bộ trigger đã tồn tại |

**Đầu vào**

| Trường | Kiểu | Bắt buộc | Ràng buộc | Ví dụ |
| --- | --- | --- | --- | --- |
| Tên lời gọi ghi mới | chuỗi | có | Phải là hàm trong `public` | `transfer_table` |
| Bảng bị ghi | danh sách tên bảng | có | Mỗi bảng phải có mặt trong bảng ánh xạ của LOAD-04, hoặc ánh xạ phải được bổ sung | `orders`, `tables` |

**Luồng chính**

1. Nhà phát triển viết lời gọi ghi mới.
2. Nhà phát triển kiểm bảng ánh xạ trong LOAD-04 xem các bảng bị ghi đã có đủ chưa.
3. Nhà phát triển viết test khẳng định bộ đếm tương ứng tăng sau khi gọi.
4. Chạy bộ test; toàn bộ phải xanh.

**Luồng thay thế**

- 2a. Lời gọi ghi vào một bảng chưa có trong ánh xạ: phải bổ sung trigger và cập nhật bảng ánh xạ trong spec trước khi tiếp tục.

**Luồng ngoại lệ**

| Nhánh | Điều kiện | Kết quả |
| --- | --- | --- |
| 3a | Không có test cho bộ đếm | Thay đổi không đủ điều kiện đóng. Đây là cổng chặn, không phải khuyến nghị |

**Đầu ra**

| Kết quả | Chi tiết |
| --- | --- |
| Test mới | Ít nhất một ca khẳng định bộ đếm tăng |
| Tài liệu | Bảng ánh xạ trong spec được cập nhật nếu có bảng mới |

**Tiêu chí chấp nhận**

- Không tồn tại lời gọi ghi nào trong `public` mà không có ít nhất một test khẳng định bộ đếm tăng, kiểm bằng một test rà soát liệt kê hàm và đối chiếu.

**Truy vết** — LOAD-04.
