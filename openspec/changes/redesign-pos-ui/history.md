> **Tư liệu lịch sử, chuyển ngày 26/10/2026.** Nội dung bên dưới giữ nguyên byte từ docs `8bf74fd9b8e2c3962ecafbd9e5fde3ca830be0a2`; đọc [proposal hiện hành](proposal.md) để biết phần đã thay thế/còn mở. Các chữ “hiện tại”, “chưa có” và quyền thực hiện chỉ thuộc thời điểm ghi ban đầu.

> **Điều hướng hiện hành25/10/2026:** proposal này giữ bối cảnh/backlog tại thời điểm lập; một phần đã có tại [hồ sơ hiện hành](../../../docs/features.md#shared-ui-behavior). Đối chiếu [bản đồ spec và phần còn thiếu](../../../docs/spec-reconciliation.md) trước khi dùng chữ “chưa có” bên dưới làm hiện trạng. Không tự archive hoặc nhận toàn proposal hoàn tất.

> **Đối chiếu xuất bản 25/10/2026.** Proposal/brief lịch sử; B01–B03 đã được tích hợp theo handoff25/10. Không coi đề xuất cũ là yêu cầu làm lại UI hoặc quyền refactor. [Nguồn, trạng thái và giới hạn](../../../docs/workflow/tasks/docs-wip-publication-2026-10-25.md). Các yêu cầu SHALL/expected bên dưới được giữ; không đổi để hợp thức hóa code.

# Thiết kế lại giao diện POS

## Why

Chủ dự án muốn sản phẩm nhìn chuyên nghiệp hơn và thao tác thân thiện hơn, hợp môi trường quán cà phê. `docs/ui-redesign-context.md` đã có sẵn phần định hướng và danh sách màn ưu tiên, nhưng đó là **bản tóm tắt để đưa cho công cụ sinh giao diện**, không phải một change có phạm vi, tiêu chí nghiệm thu và điểm dừng. Change này bổ sung đúng phần còn thiếu đó.

Rà kho mã ngày 2026-09-12 phát hiện một điều kiện tiên quyết mà bản tóm tắt kia không nhắc tới: **hệ thống đang có hai nguồn khai báo ngôn ngữ thị giác song song, và chúng trùng nội dung**.

| Nguồn | Khai báo gì | Nguồn |
| --- | --- | --- |
| Bộ tiện ích Tailwind | 13 biến thiết kế gồm nền, bề mặt, đường kẻ, màu chữ, màu phụ, ba màu trạng thái; cộng màu chính `#0f766e`, phông Inter | `tailwind.posCafeStyles.ts:3`–`:20` |
| Chủ đề của thư viện thành phần | **Cùng** màu chính `#0F766E`, **cùng** phông Inter, bo góc 8 | `src/app/AppProviders.tsx:9`–`:24` |
| Cấu hình Tailwind | Ánh xạ nhóm màu `pos-*` sang 13 biến trên, và bo góc 8 lần thứ ba | `tailwind.config.ts:8`–`:31` |

Ba chỗ cùng phát biểu một bảng màu. 34 trong 41 tệp giao diện của tầng ứng dụng vẫn dùng thư viện thành phần. Hệ quả với việc thiết kế lại: **đổi bảng màu ở một chỗ thì giao diện lệch màu chứ không lỗi**, nên loại sai này không có kiểm thử nào bắt được và chỉ lộ ra khi nhìn bằng mắt trên đúng màn có vấn đề.

Vì vậy việc đầu tiên của change này không phải vẽ lại màn, mà là **hợp nhất nguồn khai báo ngôn ngữ thị giác về một chỗ**. Làm ngược lại thì mỗi màn vẽ lại sẽ phải sửa hai nơi.

## What Changes

Chia làm ba nhánh, **cố ý tách rời nhau** để chạy song song với việc khác hoặc để làm sau cùng mà không chặn ai.

**Nhánh A — Ngôn ngữ thị giác. Làm được bất cứ lúc nào, không phụ thuộc mục nào của lộ trình.**

- Hợp nhất bảng màu, phông, bo góc và thang khoảng cách về **một** nguồn khai báo duy nhất; nguồn còn lại đọc từ đó thay vì khai báo lại.
- Chốt thang chữ, thang khoảng cách và kích thước vùng chạm tối thiểu cho thao tác bằng ngón tay.
- Rà và thống nhất cách thể hiện bốn trạng thái đang bị làm mỗi nơi một kiểu: đang tải, rỗng, lỗi, và bị chặn do thiếu quyền.

**Nhánh B — Bốn màn vận hành. Mỗi màn là một lát độc lập, làm xong màn nào dùng được màn đó.**

1. Sơ đồ bàn: quét nhanh trạng thái trống hay đang phục vụ, thấy đơn đang mở và đơn mang đi.
2. Màn gọi món: chọn món và tuỳ chọn ít bước, giỏ hàng rõ, trạng thái có thay đổi chưa lưu rõ mà không gây nhiễu.
3. Màn thanh toán: tổng tiền và nút hoàn tất luôn nổi bật, nhập tiền khách đưa nhanh, phần còn thiếu hoặc tiền thối hiện rõ.
4. Màn bán mang đi: danh sách và chi tiết rõ, tạo đơn mới và đi tiếp tới thanh toán dễ.

**Nhánh C — Cấu trúc điều hướng. Bắt buộc sau mục 3 và mục 6 của lộ trình.**

- Vỏ điều hướng dựng theo bộ quyền mới, vì mục 3 làm điều hướng suy ra từ quyền.
- Mặt giao diện của tài khoản chủ sinh ra ở mục 5 và 6.

Làm nhánh C trước hai mục đó nghĩa là dựng điều hướng hai lần. Đây là ràng buộc thứ tự, không phải khuyến nghị.

## Capabilities

### New Capabilities

Không có. Change này **không đổi hành vi nghiệp vụ, không đổi mô hình dữ liệu, không đổi lời gọi ghi**. Vì vậy `.openspec.yaml` đặt `skip_specs: true` và không có `usecases.md`; phần kiểm chứng nằm ở `testplan.md` theo quy định của chuẩn viết spec cho change không sinh hành vi mới.

### Modified Capabilities

Không có năng lực nào đổi phát biểu yêu cầu. Các màn bị chạm thuộc `floor-operations`, `order-management`, `payment` và `order-history`, nhưng chỉ ở phần trình bày.

## Impact

- Bộ kiểm thử hiện có **là ràng buộc, không phải mục tiêu**: kiểm thử giao diện và kiểm thử đầu-cuối bám vào các mã định danh phần tử. Đổi hoặc xoá mã định danh sẽ làm đỏ bộ kiểm thử mà không có lỗi thật nào. Xem câu hỏi 6.
- Có một kiểm thử đang canh việc trộn lẫn hai hệ lớp trình bày trên cùng một phần tử. Việc thiết kế lại phải giữ nó xanh hoặc sửa nó một cách có chủ ý, không tắt đi.
- Kích thước gói phát hành hiện đã vượt ngưỡng cảnh báo và chưa tách theo màn. Thiết kế lại có thể làm xấu thêm, nên phải đo trước và sau.
- Ảnh chụp màn hình dùng cho báo cáo phải chụp **sau** khi thiết kế lại xong.
- Không đụng cơ sở dữ liệu, không đụng ba lời gọi tiền.

## Ngoài phạm vi

- Đổi luồng nghiệp vụ, thêm bước hoặc bớt bước trong quy trình bán hàng.
- Hỗ trợ đầy đủ màn dọc. Hệ đang là ưu tiên nằm ngang và màn dọc chỉ hướng dẫn xoay máy; xem câu hỏi 3.
- Tách gói phát hành theo màn. Việc đó là tối ưu hiệu năng, không phải thiết kế lại.
- Đưa các phần chưa có đường vào giao diện lên màn, gồm hàng đợi bếp, giảm giá và thanh toán điện tử.
- Thiết kế lại màn quản trị và màn báo cáo, trừ khi còn thời gian sau khi xong bốn màn vận hành.

## Phụ thuộc

- Nhánh A và nhánh B: **không phụ thuộc change nào**, chạy song song với bất kỳ mục nào của lộ trình.
- Nhánh C: **bắt buộc sau** `redesign-permission-model` và sau giai đoạn hai của `add-owner-account-and-store-provisioning`.
- Toàn bộ change phải xong **trước mục 10 của lộ trình**, vì chương báo cáo cần ảnh chụp của giao diện cuối cùng. Đây là hạn cứng duy nhất.
- Không chặn change nào khác.

## Câu hỏi phải chốt trước khi làm

1. **Giữ thư viện thành phần hiện tại hay chuyển hẳn sang bộ tiện ích?** Đây là câu đắt nhất. Giữ cả hai như hiện nay là rẻ nhất về công nhưng giữ nguyên hai nguồn khai báo; chuyển hẳn thì ngôn ngữ thị giác về một chỗ nhưng phải viết lại 34 tệp giao diện, tức vượt xa phạm vi một lần thiết kế lại.
2. Có đổi bảng màu và nhận diện không, hay giữ tông xanh hiện tại và chỉ chỉnh lại bố cục, khoảng cách, thang chữ?
3. Màn dọc có vào phạm vi không? Vào thì mỗi màn phải thiết kế hai lần; không vào thì hướng dẫn xoay máy vẫn là câu trả lời cho điện thoại cầm dọc.
4. **Nghiệm thu bằng gì?** Không có kiểm thử tự động nào chứng minh giao diện đẹp hơn. Đề xuất ba thước đo kiểm chứng được: số thao tác để hoàn tất ba tác vụ chuẩn đo trước và sau, ảnh chụp đối chiếu từng màn, và bộ kiểm thử cũ vẫn xanh. Chủ dự án cần xác nhận hoặc thay bằng thước đo khác.
5. Có làm chế độ tối không? Hệ hiện chỉ có một bộ biến màu sáng.
6. Có được đổi mã định danh phần tử không? Không đổi thì bộ kiểm thử đầu-cuối giữ nguyên nhưng cấu trúc màn bị buộc theo cái cũ ở vài chỗ; được đổi thì phải cập nhật kịch bản kiểm thử tương ứng trong cùng lượt.
7. **Điểm dừng ở đâu?** Bốn màn vận hành là đủ, hay làm tiếp màn quản trị? Đây là loại việc không có điểm kết thúc tự nhiên nên phải chốt trước.

## Quyết định đã chốt

1. **Không xếp tuần riêng.** Chốt ngày 2026-09-12 theo yêu cầu của chủ dự án: change này chạy song song với các mục khác hoặc làm sau cùng, không gấp. Ràng buộc đi kèm là hạn cứng trước mục 10 và thứ tự bắt buộc của nhánh C, đã ghi ở mục phụ thuộc.
