> **Đối chiếu xuất bản 25/10/2026.** Kế hoạch15/09, chưa xác nhận toàn change đã triển khai. Lô A được duyệt trước đo; store_pulse/60s là lựa chọn ghi nhận, nhưng ngưỡng20MB, lịch và ranh giới còn mở. Ước lượng request/egress bên dưới dựa raw repos/polling cũ, không là số đo main711a22e đang dùng projections/foreground polling. [Nguồn, trạng thái và giới hạn](../../../../../docs/workflow/tasks/docs-wip-publication-2026-10-25.md). Các yêu cầu SHALL/expected bên dưới được giữ; không đổi để hợp thức hóa code.

# Delta multi-device-sync — chi phí đường đọc

Mọi requirement dưới đây truy vết về NFR-05 (khả năng khôi phục đồng bộ online) và **NFR-09**, mã mới khai trong change này: "Chi phí đọc lúc chạy có trần đo được". NFR-09 phải được thêm vào `docs/requirements.md` khi archive change.

## MODIFIED Requirements

### Requirement: Tải lại theo chu kỳ cho dữ liệu vận hành

Mã: **LOAD-01**. Thay cho phát biểu cũ, vốn viết là các truy vấn sơ đồ bàn, danh sách đơn đang mở và chi tiết đơn được **tải lại** theo chu kỳ khoảng 5 giây.

Hệ thống SHALL **kiểm tra thay đổi** theo chu kỳ khoảng 5 giây bằng một lời gọi duy nhất trả về bộ đếm version theo cửa hàng, và SHALL tải lại dữ liệu đầy đủ của một nhóm chỉ khi bộ đếm của nhóm đó khác giá trị thiết bị đang giữ.

Chu kỳ kiểm tra MUST NOT vượt quá 5 giây khi tab đang hiển thị. Lời gọi kiểm tra MUST NOT trả về dữ liệu nghiệp vụ; nó chỉ được trả về bộ đếm version và mốc thời gian.

So sánh version SHALL dùng phép **khác nhau**, không dùng phép lớn hơn. Lý do: nếu dòng pulse của một cửa hàng bị xóa rồi tạo lại thì bộ đếm quay về 0, và phép lớn hơn sẽ làm thiết bị không bao giờ tải lại nữa.

Thiết bị chưa có bộ đếm nào trong bộ nhớ, hoặc nhận về bộ đếm rỗng, SHALL coi như có thay đổi và tải đầy.

#### Scenario: Quán vắng, không ai thao tác

- **WHEN** không có thao tác ghi nào trong 5 phút và tab đang hiển thị
- **THEN** thiết bị gửi khoảng 60 lời gọi kiểm tra và **không** gửi lời gọi tải dữ liệu vận hành nào

#### Scenario: Thiết bị khác mở đơn tại bàn

- **WHEN** một thiết bị mở đơn mới tại một bàn
- **THEN** ở lần kiểm tra kế tiếp, các thiết bị khác thấy `orders_version` và `floor_version` đổi, tải lại danh sách đơn và sơ đồ bàn, và hiển thị bàn đó ở trạng thái đang phục vụ

#### Scenario: Dòng pulse chưa tồn tại

- **WHEN** lời gọi kiểm tra không tìm thấy dòng pulse của cửa hàng
- **THEN** thiết bị tải đầy ở mọi nhịp kiểm tra, tức lùi về đúng hành vi hiện tại, và không hiển thị lỗi cho người dùng

## ADDED Requirements

### Requirement: Lưới an toàn tải đầy vô điều kiện

Mã: **LOAD-02**.

Ngoài đường kiểm tra version, mỗi truy vấn vận hành SHALL tải đầy vô điều kiện ít nhất một lần trong mỗi 60 giây khi tab đang hiển thị, kể cả khi bộ đếm version không đổi.

Requirement này tồn tại để chặn đúng một chế độ hỏng: một đường ghi không làm tăng bộ đếm thì thiết bị hiển thị dữ liệu cũ **mà không có lỗi nào bắn ra**, và không có cơ chế nào tự phát hiện. Lưới an toàn biến sai sót đó từ vĩnh viễn thành tối đa 60 giây.

Lưới an toàn MUST NOT bị tắt bởi cấu hình, cờ tính năng hoặc tham số môi trường trong bản chạy thật.

#### Scenario: Trigger bump bị sót

- **GIVEN** một đường ghi không làm tăng `orders_version`
- **WHEN** thiết bị A ghi qua đường đó
- **THEN** thiết bị B vẫn hiển thị trạng thái mới chậm nhất 60 giây sau

### Requirement: Một lời gọi cho mỗi nhóm dữ liệu đọc

Mã: **LOAD-03**.

Mỗi thao tác tải sơ đồ bàn, thực đơn, danh sách đơn đang mở, chi tiết đơn và báo cáo ngày SHALL hoàn tất bằng **đúng một** lời gọi tới backend.

Đường đọc MUST NOT chứa chuỗi lời gọi tuần tự trong đó lời gọi sau phụ thuộc kết quả lời gọi trước.

Dữ liệu trả về SHALL giữ nguyên hình dạng miền hiện có, tức kiểu trong `src/domain` không đổi. Đây là ràng buộc cố ý: nó cho phép dùng chính bộ test adapter hiện có làm cổng chặn hồi quy.

#### Scenario: Mở chi tiết một đơn đã thanh toán

- **WHEN** nhân viên mở chi tiết một đơn đã thanh toán có 5 món và 8 tùy chọn
- **THEN** thiết bị gửi đúng 1 lời gọi, và nhận đủ đơn, các món, các tùy chọn và bản ghi thanh toán

### Requirement: Bộ đếm version phản ánh đủ mọi đường ghi

Mã: **LOAD-04**.

Mọi thao tác ghi làm đổi dữ liệu mà thiết bị khác nhìn thấy SHALL làm tăng ít nhất một bộ đếm version của đúng cửa hàng đó.

Ánh xạ bắt buộc, tối thiểu:

| Bảng bị ghi | Bộ đếm phải tăng |
| --- | --- |
| `orders`, `order_items`, `order_item_options` | `orders_version`, `report_version` |
| `payments` | `orders_version`, `report_version` |
| `tables`, `floor_areas`, `floor_decor_items` | `floor_version` |
| `categories`, `menu_items`, `option_groups`, `option_values`, `menu_item_option_groups` | `menu_version` |

Việc tăng bộ đếm SHALL nằm trong **cùng giao dịch** với thao tác ghi. Giao dịch bị rollback thì bộ đếm cũng phải quay lại; không được để bộ đếm tăng cho một thay đổi không xảy ra.

Bộ đếm MUST NOT giảm trong vòng đời bình thường của một cửa hàng.

#### Scenario: Giao dịch thanh toán bị từ chối

- **WHEN** `pay_order` bị từ chối vì sai `expectedVersion`
- **THEN** không bộ đếm nào của cửa hàng đó thay đổi

#### Scenario: Hủy đơn đã thanh toán

- **WHEN** `void_order` chạy xong trên một đơn đã thanh toán
- **THEN** cả `orders_version` và `report_version` đều tăng

### Requirement: Tối ưu policy không được nới cô lập cửa hàng

Mã: **LOAD-05**. Truy vết NFR-02.

Việc viết lại biểu thức trong policy RLS để Postgres tính một lần cho cả truy vấn SHALL giữ nguyên **chính xác** tập dòng mà mỗi cửa hàng đọc và ghi được.

Bảng `store_pulse` SHALL có RLS bật, và một cửa hàng MUST NOT đọc được dòng pulse của cửa hàng khác. Hàm đọc pulse MUST NOT chạy ở chế độ bỏ qua RLS.

#### Scenario: Gọi thẳng vào tầng dữ liệu bằng phiên của cửa hàng khác

- **WHEN** một phiên đã đăng nhập của cửa hàng X gọi thẳng lời gọi đọc pulse kèm định danh cửa hàng Y
- **THEN** kết quả rỗng, và không có dữ liệu nào của Y bị lộ

### Requirement: Gộp tín hiệu thời gian thực

Mã: **LOAD-06**.

Nhiều tín hiệu thời gian thực đến trong một cửa sổ khoảng 250 ms SHALL được gộp thành một lượt làm mới duy nhất cho mỗi nhóm dữ liệu.

Việc gộp MUST NOT làm mất tín hiệu: tín hiệu cuối cùng trong cửa sổ luôn dẫn tới ít nhất một lượt làm mới sau đó. Việc gộp MUST NOT đẩy lùi vô hạn; tổng độ trễ do gộp không vượt quá 250 ms kể từ tín hiệu đầu tiên của cửa sổ.

Requirement "Tín hiệu thời gian thực dùng để tải lại, không vá cache" giữ nguyên hiệu lực. Tín hiệu vẫn chỉ dùng để đánh dấu cần tải lại.

#### Scenario: Một lần thanh toán sinh ba sự kiện

- **WHEN** một lần thanh toán sinh sự kiện trên `orders`, `payments` và `tables` cách nhau vài mili giây
- **THEN** mỗi thiết bị khác chạy đúng một lượt làm mới cho mỗi nhóm dữ liệu, không phải ba lượt

### Requirement: Trần chi phí đọc đo được

Mã: **LOAD-07**. Truy vết NFR-09.

Chi phí đọc của một cửa hàng SHALL được đo và ghi lại thành số, theo kịch bản chuẩn: 5 thiết bị, 12 giờ hoạt động, 150 đơn, 30 bàn, 60 món.

Số đo SHALL được ghi vào `docs/testing.md` kèm ngày đo, cấu hình, và giá trị nền trước khi tối ưu để so sánh được.

Ngưỡng đạt của change này **chưa chốt**; xem câu hỏi 2 trong `proposal.md`. Không được coi change là xong khi chưa có ngưỡng được chủ dự án duyệt và chưa có số đo đối chiếu.

#### Scenario: Báo cáo kết quả tối ưu

- **WHEN** lô B chạy xong
- **THEN** `docs/testing.md` có một bảng gồm byte đọc mỗi ngày mỗi quán trước và sau, đo trên cùng kịch bản, cùng project Supabase
