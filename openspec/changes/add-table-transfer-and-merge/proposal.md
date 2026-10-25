> **Đối chiếu xuất bản 25/10/2026.** Nguồn quyết định/đề xuất được lưu theo ngày trong tài liệu; không tự coi proposal là đã duyệt thực hiện hoặc code/test đã hoàn tất. Đọc trạng thái và câu hỏi còn mở trước khi tiếp tục. [Nguồn, trạng thái và giới hạn](../../../docs/workflow/tasks/docs-wip-publication-2026-10-25.md). Các yêu cầu SHALL/expected bên dưới được giữ; không đổi để hợp thức hóa code.

# Chuyển bàn và gộp bàn

## Trạng thái

**Mức kế hoạch.** Chốt ngày 2026-09-12: chủ dự án đưa hai thao tác này vào phạm vi khóa luận, nhưng phần chi tiết nghiệp vụ sẽ được thảo luận sâu hơn ngay trước khi thực hiện. Proposal này ghi phạm vi, chi phí, ràng buộc và các câu hỏi phải chốt; **chưa** phải bộ đặc tả để giao cho người thực hiện. Các artifact còn lại viết sau khi trả lời xong mục câu hỏi bên dưới.

## Why

Hai thao tác này là nghiệp vụ thường ngày của quán cà phê: khách đổi chỗ, hoặc hai nhóm khách ngồi hai bàn nhập lại thành một hóa đơn. Hệ hiện **không làm được cả hai**, và đây là một trong số ít khoảng trống nghiệp vụ mà người dùng cuối cảm nhận trực tiếp.

Rà kho mã và tài liệu ngày 2026-09-12:

| Nơi | Ghi gì |
| --- | --- |
| `docs/requirements.md:69` | Xếp gộp và chuyển bàn vào nhóm ngoài phạm vi |
| `docs/limitations.md:56` | Ghi thẳng "Không có gộp/chuyển bàn" |
| `docs/phase-scope.md:89` | Ghi chi phí đã lượng định: cần quy tắc gộp đơn, xử lý xung đột, dấu vết kiểm toán, và một thủ tục giao dịch riêng |
| `docs/features.md:35` | Hai mã quyền tương ứng đã có trong danh mục nhưng **chưa phải quyền chạy thật**, vì chưa có tính năng đứng sau |
| `redesign-permission-model` proposal, mục 111 | Loại hai mã này khỏi đợt tổ chức lại phân quyền, với lý do chưa có tính năng đứng sau |
| Kho mã | Không có thủ tục nào đổi bàn của một đơn |

Phần nền dữ liệu thì đã sẵn: đơn có trường bàn cho phép rỗng (`supabase/migrations/001_schema_enums.sql:192`), có số phiên bản phục vụ khóa lạc quan (`:203`), và bàn có trạng thái trống hay đang phục vụ (`:154`). Nghĩa là phần thiếu là **quy tắc nghiệp vụ và giao dịch**, không phải lược đồ dữ liệu.

Change này cũng trả lời một phần câu hỏi số 3 đang bỏ ngỏ của `redesign-permission-model`: trong danh mục quyền chưa dùng, hai mã chuyển bàn và gộp bàn **sẽ có tính năng đứng sau**, nên chúng đủ điều kiện thành quyền chạy thật.

## What Changes

Hai lát, tách rời, làm theo thứ tự.

**Lát 1 — Chuyển bàn.** Một đơn đang mở chuyển sang một bàn khác. Bàn cũ trở về trạng thái trống, bàn mới thành đang phục vụ. Số bill, các món đã ghi, giá đã chụp và ngày kinh doanh của đơn **không đổi**.

**Lát 2 — Gộp bàn.** Hai đơn đang mở nhập làm một. Đơn còn lại giữ toàn bộ món của cả hai; đơn bị nhập vào đóng lại với dấu vết cho biết nó đã được gộp vào đâu. Bàn của đơn bị nhập trở về trạng thái trống.

Chung cho cả hai:

- Thực hiện trong một thủ tục giao dịch phía cơ sở dữ liệu, giống bốn nghiệp vụ ghi hiện có, để không có trạng thái nửa vời khi lỗi giữa chừng.
- Dùng khóa chống trùng của giao thức ghi hiện hành, để bấm hai lần hoặc mất phản hồi mạng không sinh ra hai lần chuyển.
- Kiểm tra khóa lạc quan trên cả đơn nguồn và đơn đích, vì đây là thao tác nhiều thiết bị có thể chạm cùng lúc.
- Ghi dấu vết kiểm toán: ai làm, lúc nào, từ bàn nào sang bàn nào, đơn nào nhập vào đơn nào.
- Hai mã quyền tương ứng chuyển từ danh mục sang quyền chạy thật.

## Capabilities

### New Capabilities

Không có. Hai thao tác này thuộc phạm vi quản lý đơn và sơ đồ bàn đang có.

### Modified Capabilities

- `order-management`: thêm hai thao tác ghi mới trên đơn đang mở.
- `floor-operations`: trạng thái bàn đổi theo kết quả hai thao tác trên.
- `access-control`: hai mã quyền thành quyền chạy thật.
- `order-history`: đơn bị nhập vào phải tra cứu lại được và thấy được nó đã gộp đi đâu.

## Impact

- Thêm một hoặc hai thủ tục giao dịch mới. Chúng **đụng cùng vùng mã với ba lời gọi tiền**, tức vùng đắt nhất kho mã theo phần phân tích thứ tự trong lộ trình. Nên làm sau khi tổ chức lại phân quyền và siết quyền xuống tầng dữ liệu đã ổn định, để không phải viết lại chữ ký thêm một lần.
- Báo cáo doanh thu: gộp bàn làm một đơn biến mất khỏi danh sách đơn thường, cần chắc rằng nó không bị đếm hai lần hoặc mất khỏi đối chiếu.
- Giao diện: thêm thao tác trên màn sơ đồ bàn và màn gọi món. Chạm cùng bề mặt với `redesign-pos-ui`.
- Kiểm thử: nhóm tình huống nhiều thiết bị là phần nặng nhất, vì hai người cùng thao tác trên hai đơn liên quan.

## Ngoài phạm vi

- Tách một đơn thành hai bàn. Đây là chiều ngược lại của gộp bàn và chưa có yêu cầu.
- Chuyển từng món giữa hai bàn thay vì chuyển cả đơn.
- Gộp đơn đã thanh toán hoặc đã thanh toán một phần.
- Đổi số bill hoặc ngày kinh doanh của đơn.

## Phụ thuộc

- Nên **sau** `redesign-permission-model`, vì hai mã quyền chỉ có nghĩa khi mô hình quyền mới đã dựng xong.
- Nên **sau** `enforce-permissions-at-database`, để hai thủ tục mới sinh ra đã mang sẵn cách kiểm quyền cuối cùng thay vì phải sửa lại.
- Dùng khóa chống trùng của `add-idempotent-write-operations`, đã hoàn thành phần lõi.
- Chạm cùng màn với `redesign-pos-ui`; nếu làm gần nhau thì gộp một lượt sửa giao diện.

## Câu hỏi phải chốt trước khi làm

Đây là phần chủ dự án đã hẹn thảo luận sâu hơn khi bắt đầu thực hiện.

1. **Gộp bàn thì giữ số bill nào?** Giữ số của đơn mở trước, giữ số của bàn đích, hay cấp số mới? Quyết định này ảnh hưởng tới việc tra cứu lịch sử và tới lời giải thích cho khách.
2. **Đơn bị nhập vào tồn tại ở trạng thái gì?** Đóng với lý do đã gộp, hay xóa mềm? Giữ lại thì lịch sử đầy đủ nhưng danh sách đơn có thêm một loại trạng thái mới phải hiển thị.
3. Gộp hai đơn có món giống nhau thì cộng số lượng hay để thành hai dòng riêng? Để riêng thì hóa đơn dài nhưng giữ đúng vết ai gọi gì; cộng lại thì gọn hơn nhưng mất thông tin đó.
4. Hai đơn có ngày kinh doanh khác nhau, ví dụ một bàn ngồi qua nửa đêm, thì đơn gộp tính vào ngày nào?
5. Chuyển bàn sang một bàn **đang có đơn mở** thì hệ xử lý ra sao: từ chối, hay tự hiểu là gộp bàn?
6. Ai được làm hai thao tác này? Thu ngân tự làm, hay cần quyền của quản lý? Gộp bàn đụng tới cấu trúc hóa đơn nên rủi ro gian lận cao hơn chuyển bàn.
7. Có cần lý do bắt buộc khi gộp bàn không, giống như huỷ đơn đã thanh toán hiện nay?
8. Làm cả hai lát, hay dừng ở chuyển bàn nếu quỹ thời gian căng? Cần một điểm dừng được chốt trước.

## Quyết định đã chốt

1. **Đưa vào phạm vi khóa luận ở mức kế hoạch.** Chốt ngày 2026-09-12 theo yêu cầu của chủ dự án. Phần chi tiết nghiệp vụ thảo luận ngay trước khi thực hiện; chưa viết delta spec, design hay tasks cho tới lúc đó.
2. **Hai mã quyền chuyển bàn và gộp bàn sẽ thành quyền chạy thật**, vì đã có tính năng đứng sau. Đây là một phần câu trả lời cho câu hỏi số 3 của `redesign-permission-model`.
