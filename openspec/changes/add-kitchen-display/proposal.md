> **Đối chiếu xuất bản 25/10/2026.** Nguồn quyết định/đề xuất được lưu theo ngày trong tài liệu; không tự coi proposal là đã duyệt thực hiện hoặc code/test đã hoàn tất. Đọc trạng thái và câu hỏi còn mở trước khi tiếp tục. [Nguồn, trạng thái và giới hạn](../../../docs/workflow/tasks/docs-wip-publication-2026-10-25.md). Các yêu cầu SHALL/expected bên dưới được giữ; không đổi để hợp thức hóa code.

# Màn bếp và phiếu gửi bếp lưu bền

## Trạng thái

**Proposal phân tích, chưa cam kết thực hiện.** Viết ngày 2026-09-12 để trả lời nhận xét phản biện ở mức thiết kế thay vì chỉ một câu trong chương hạn chế. Thuộc giai đoạn 2. Không chiếm tuần nào của giai đoạn 1 và không đổi phạm vi đang cam kết.

## Why

Giảng viên phản biện nêu: phiếu gửi bếp hiện chỉ là bản xem trước tạm thời, chưa được lưu bền vững và chưa có màn hình bếp vận hành thực sự.

Rà kho mã ngày 2026-09-12 xác nhận, và cho thấy đây là một quyết định thu hẹp phạm vi có chủ ý chứ không phải phần làm dở:

| Thành phần | Hiện trạng | Nguồn |
| --- | --- | --- |
| Phiếu gửi bếp | Dựng tại chỗ từ các dòng vừa thêm trong lượt gửi đơn, hiển thị như một biến thể của bản in. Không ghi xuống cơ sở dữ liệu, đóng là mất | `src/app/drawers/pos/OrderDrawer.tsx:140`, `:155` |
| Màn hàng đợi bếp | Có sẵn thành phần giao diện với danh sách phiếu và nút đánh dấu xong | `src/app/drawers/admin/KitchenQueueDrawer.tsx:95`, `:171`, `:187` |
| Đường vào màn đó | Không có. Vai trò bếp bị loại khỏi tập vai trò đang bật nên không xuất hiện ở điều hướng lẫn màn đăng nhập | `src/core/guards.ts:4` |
| Vai trò bếp | Vẫn tồn tại trong kiểu liệt kê của cơ sở dữ liệu và trong bảng nhãn hiển thị, nhưng không có quyền nào | `supabase/migrations/001_schema_enums.sql:6`, `src/core/guards.ts:63` |
| Trạng thái chế biến | Không có. Đơn chỉ có trạng thái mở, đã thanh toán và đã hủy; từng món không có trạng thái riêng | `supabase/migrations/001_schema_enums.sql` |

Phần còn thiếu quan trọng nhất **không phải màn hình** — màn hình đã có khung — mà là **mô hình dữ liệu cho vòng đời một món trong bếp** và cơ chế đẩy thay đổi tới thiết bị đặt ở khu pha chế.

## What Changes

- Phiếu gửi bếp trở thành dữ liệu lưu bền: mỗi lần gửi đơn sinh ra một phiếu gắn với đơn và với các dòng món trong lượt gửi đó, kèm thời điểm và người gửi.
- Từng dòng món có trạng thái chế biến, tối thiểu là chờ, đang làm và xong. Chuyển trạng thái được ghi nhận kèm người thực hiện.
- Màn bếp hiển thị các phiếu chưa hoàn tất theo thứ tự thời gian, cho đánh dấu từng món hoặc cả phiếu là xong, và tự cập nhật khi có phiếu mới mà không cần thao tác tay.
- Quầy nhìn thấy tiến độ: món nào đã xong, phiếu nào còn chờ.
- Mở lại vai trò bếp với bộ quyền tối thiểu: chỉ xem hàng đợi và đổi trạng thái chế biến, không xem tiền, không sửa đơn, không thanh toán.
- Hủy đơn hoặc bỏ món đã gửi bếp phải phản ánh sang phiếu, vì món đã bắt đầu làm là chi phí thật.

## Capabilities

### New Capabilities

- `kitchen-operations`: vòng đời phiếu gửi bếp và trạng thái chế biến của từng món.

### Modified Capabilities

- `order-management`: gửi đơn sinh phiếu; sửa hoặc bỏ món đã gửi phải xử lý phần đã vào bếp.
- `receipt-printing`: phiếu gửi bếp chuyển từ bản xem trước tạm thời sang tài liệu in ra từ dữ liệu đã lưu.
- `access-control`: mở lại vai trò bếp kèm bộ quyền tối thiểu.
- `multi-device-sync`: thiết bị bếp cần nhận thay đổi đủ nhanh để dùng được trong lúc phục vụ.
- `order-void`: hủy đơn phải xử lý phần đã chế biến.

## Impact

- Cơ sở dữ liệu: thêm bảng phiếu gửi bếp và trạng thái dòng món, kèm chính sách cô lập theo cửa hàng như mọi bảng nghiệp vụ khác.
- Lời gọi gửi đơn phải sinh phiếu trong cùng giao dịch, nếu không sẽ có đơn đã gửi mà bếp không thấy. Đây là một trong ba lời gọi tiền đắt nhất kho mã.
- Tải đồng bộ tăng: thêm một loại thiết bị luôn mở màn hình và luôn cần dữ liệu mới.
- Vận hành: quán phải có thêm một thiết bị ở khu pha chế. Với quán rất nhỏ, đây có thể là chi phí không đáng, nên tính năng cần bật tắt được theo cửa hàng.
- Kiểm thử: thêm nhóm tình huống nhiều thiết bị, gồm hai người cùng đánh dấu một món là xong.

## Ngoài phạm vi

- Máy in nhiệt đặt tại bếp. Việc in vật lý thuộc hướng phát triển về in ấn, hiện bộ điều hợp in là rỗng.
- Ước tính thời gian chờ và cảnh báo quá hạn.
- Định tuyến phiếu theo nhiều trạm, ví dụ tách quầy pha chế và quầy bánh.
- Trừ nguyên liệu khi món được làm. Việc đó thuộc `add-recipe-based-stock-deduction`.

## Phụ thuộc

- Nên sau `redesign-permission-model`, vì change này mở lại một vai trò và cần bộ quyền mới.
- Nên sau `measure-runtime-load`, vì thêm một thiết bị luôn mở màn hình sẽ làm tăng tải đọc, mà hiện chưa có số nền để biết trần ở đâu.
- Không phụ thuộc nhóm thanh toán điện tử.
- `add-recipe-based-stock-deduction` nếu làm sau sẽ dùng chính trạng thái chế biến ở đây làm điểm trừ kho.

## Câu hỏi phải chốt trước khi làm

1. Đơn vị theo dõi là phiếu hay từng món? Theo phiếu thì đơn giản hơn nhiều; theo món thì quầy biết chính xác món nào xong nhưng dữ liệu và giao diện phức tạp hơn hẳn.
2. Quán nhỏ một người vừa pha chế vừa thu ngân thì màn bếp có ích gì không, hay chỉ thêm thao tác? Nếu không thì phải bật tắt được theo cửa hàng và mặc định là tắt.
3. Món đã đánh dấu xong rồi khách đổi ý thì xử lý ra sao? Cho quay lại trạng thái chờ, hay ghi thành một lần hủy có lý do?
4. Thiết bị bếp đăng nhập bằng gì? Dùng đúng mô hình PIN hiện tại thì đơn giản, nhưng màn bếp thường để mở suốt ca, tức là một phiên không ai canh.
5. Bếp cần thấy ghi chú của khách và tùy chọn của món ở mức chi tiết nào?
6. Khi mạng của thiết bị bếp rớt, phiếu đã nhận có được giữ lại trên màn hình không? Nếu có thì chạm sang nhóm ngoại tuyến đang hoãn.

## Quyết định đã chốt

Chưa có. Ghi câu trả lời của chủ dự án vào mục này trước khi viết các artifact còn lại.
