> **Đối chiếu xuất bản 25/10/2026.** Nguồn quyết định/đề xuất được lưu theo ngày trong tài liệu; không tự coi proposal là đã duyệt thực hiện hoặc code/test đã hoàn tất. Đọc trạng thái và câu hỏi còn mở trước khi tiếp tục. [Nguồn, trạng thái và giới hạn](../../../docs/workflow/tasks/docs-wip-publication-2026-10-25.md). Các yêu cầu SHALL/expected bên dưới được giữ; không đổi để hợp thức hóa code.

# Giảm giá thủ công trên một đơn

## Trạng thái

**Bản tối thiểu, có thực hiện.** Chốt ngày 2026-09-12: chủ dự án chọn làm phần giảm giá thủ công ở mức đơn, **không** kéo toàn bộ cơ chế giảm giá từ giai đoạn 2 lên. Mã khuyến mãi, giờ vàng, khuyến mãi theo món và ghi đè giá từng món vẫn nằm ngoài phạm vi.

## Why

Giảm giá cho khách quen hoặc bớt tiền lẻ là việc xảy ra hằng ngày ở quán nhỏ. Hiện thu ngân **không có cách nào làm việc đó trong phần mềm**, nên hoặc phải sửa số lượng món cho khớp số tiền, hoặc thu ngoài sổ.

Phần nền dữ liệu đã dựng sẵn từ đầu nhưng chưa có gì dùng:

| Thành phần | Hiện trạng | Nguồn |
| --- | --- | --- |
| Kiểu giảm giá | Kiểu liệt kê ba giá trị: không giảm, theo phần trăm, theo số tiền | `supabase/migrations/001_schema_enums.sql:15` |
| Cột trên đơn | Đơn có sẵn kiểu giảm giá và giá trị giảm, mặc định là không giảm và bằng không | `:198`, `:199` |
| Mã quyền | Mã áp giảm giá có trong danh mục nhưng **chưa phải quyền chạy thật**, vì chưa có tính năng đứng sau | `docs/features.md:35` |
| Giao diện | Không có đường vào nào | — |

`docs/limitations.md` gọi đúng tên tình trạng này: cột giảm giá vẫn là phần có sẵn nhưng chưa dùng. Theo quy tắc chuyển sang báo cáo, phần như vậy **không được kể như chức năng đang có**. Change này biến nó thành chức năng thật.

Đây cũng là phần thứ hai của câu trả lời cho câu hỏi về danh mục quyền chưa dùng trong `redesign-permission-model`: mã áp giảm giá sẽ có tính năng đứng sau nên đủ điều kiện thành quyền chạy thật; mã ghi đè giá từng món thì **không**, và vẫn ở trạng thái dự trữ.

## What Changes

- Thu ngân áp một khoản giảm cho đơn đang mở, theo phần trăm hoặc theo số tiền, đúng ba giá trị mà kiểu dữ liệu đã cho phép.
- Khoản giảm được tính vào tổng tiền của đơn và vào số tiền phải thu khi thanh toán.
- Gỡ khoản giảm khi đơn còn mở.
- Thao tác áp và gỡ giảm giá đều ghi dấu vết kiểm toán: ai làm, lúc nào, giá trị bao nhiêu.
- Mã quyền áp giảm giá chuyển từ danh mục sang quyền chạy thật.
- Hóa đơn in ra hiển thị khoản giảm thành một dòng riêng, không trộn vào tổng.
- Báo cáo doanh thu tách phần đã giảm khỏi doanh thu thực thu.

## Capabilities

### New Capabilities

Không có.

### Modified Capabilities

- `order-management`: thêm thao tác áp và gỡ giảm giá trên đơn đang mở.
- `payment`: số tiền phải thu tính theo tổng đã trừ giảm giá.
- `receipt-printing`: hóa đơn có dòng giảm giá.
- `reporting`: tách doanh thu trước giảm, phần giảm, và thực thu.
- `access-control`: một mã quyền thành quyền chạy thật.

## Impact

- **Đụng lời gọi thanh toán**, tức một trong ba lời gọi tiền đắt nhất kho mã. Nên gom cùng đợt với `add-table-transfer-and-merge` và làm sau khi siết quyền xuống tầng dữ liệu, để không viết lại chữ ký thêm lần nữa.
- Không đổi lược đồ dữ liệu ở phần đơn, vì hai cột đã có. Có thể phát sinh bảng hoặc trường cho dấu vết kiểm toán.
- Báo cáo doanh thu đổi ý nghĩa: từ nay tổng tiền của đơn không còn bằng tổng tiền các món.
- Dữ liệu cũ không bị ảnh hưởng, vì mặc định của hai cột là không giảm.
- Kiểm thử: nhóm biên là phần nặng nhất — giảm quá tổng tiền, giảm trên đơn rỗng, giảm rồi thêm món, giảm phần trăm ra số lẻ.

## Ngoài phạm vi

- Mã khuyến mãi, phiếu giảm giá, giờ vàng, khuyến mãi theo món. Toàn bộ thuộc `add-discount-engine` và nhóm khuyến mãi ở giai đoạn 2.
- **Ghi đè giá từng món.** Mã quyền tương ứng giữ nguyên trạng thái dự trữ.
- Giảm giá trên đơn đã thanh toán, và hoàn tiền.
- Giới hạn mức giảm tối đa theo vai trò hoặc theo cửa hàng. Xem câu hỏi 4.

## Phụ thuộc

- Nên **sau** `redesign-permission-model`, vì mã quyền chỉ có nghĩa khi mô hình quyền mới đã dựng xong.
- Nên **sau** `enforce-permissions-at-database`, để lời gọi sinh ra đã mang cách kiểm quyền cuối cùng.
- Dùng khóa chống trùng của `add-idempotent-write-operations`.
- **Không** phụ thuộc `add-discount-engine`. Ngược lại, change đó nếu làm sau sẽ phải bao được phần này thay vì làm song song một cơ chế thứ hai; đây là điểm phải ghi rõ khi mở lại nhóm khuyến mãi.

## Câu hỏi phải chốt trước khi làm

1. Giảm theo phần trăm ra số lẻ thì làm tròn thế nào, và làm tròn ở bước nào? Quyết định này phải thống nhất với cách tính tiền hiện hành để tổng tiền không lệch một đồng.
2. Ai được áp giảm giá: thu ngân tự làm, hay chỉ quản lý? Đây là thao tác đụng trực tiếp vào doanh thu nên rủi ro gian lận nội bộ cao hơn các thao tác quầy khác.
3. Có bắt buộc nhập lý do khi giảm giá không, giống như huỷ đơn đã thanh toán hiện nay?
4. Có đặt trần cho mức giảm không, ví dụ không quá một tỷ lệ nhất định hoặc không quá một số tiền nhất định? Đặt trần thì an toàn hơn nhưng thêm một mục cấu hình cửa hàng.
5. Giảm giá rồi thêm món thì khoản giảm theo phần trăm tính lại theo tổng mới, còn khoản giảm theo số tiền giữ nguyên — xác nhận cách hiểu này đúng với mong muốn nghiệp vụ.
6. Đơn tách ra để thanh toán tức thời thì khoản giảm của đơn gốc xử lý ra sao: chia theo tỷ lệ, giữ nguyên ở đơn gốc, hay chặn không cho tách khi đơn đang có giảm giá?

## Quyết định đã chốt

1. **Làm bản tối thiểu ở mức đơn**, không kéo cơ chế giảm giá đầy đủ từ giai đoạn 2 lên. Chốt ngày 2026-09-12 theo lựa chọn của chủ dự án. Lý do: dùng đúng hai cột đã có sẵn nên không đổi lược đồ dữ liệu, đóng được khoảng trống nghiệp vụ thấy rõ nhất, mà không nhận rủi ro của cả nhóm khuyến mãi trong quỹ thời gian đã kín.
2. **Ghi đè giá từng món không làm trong khóa luận.** Mã quyền giữ ở trạng thái dự trữ.
