> **Đối chiếu xuất bản 25/10/2026.** Đính chính khảo sát cũ: migration008 đã thêm bảng nối vào publication (008_modifier_rework.sql:64); runtime hiện dùng permissionSignalPort.ts:65,72 với signal tables. Không triển khai thêm raw subscription từ mô tả cũ; phải đánh giá lại với contract permission trước khi làm. Giữ proposal để truy vết ý định đồng bộ. [Nguồn, trạng thái và giới hạn](../../../docs/workflow/tasks/docs-wip-publication-2026-10-25.md). Các yêu cầu SHALL/expected bên dưới được giữ; không đổi để hợp thức hóa code.

# Đồng bộ thời gian thực cho liên kết món và nhóm tùy chọn

## Why

`docs/limitations.md` xếp việc này ở **ưu tiên số 1** trong danh sách đề xuất, và giảng viên phản biện cũng nêu: client chưa đăng ký thay đổi thời gian thực cho bảng liên kết món và nhóm tùy chọn, nên một số thay đổi cấu hình menu có thể cần thiết bị khác làm mới thủ công mới thấy.

Rà kho mã ngày 2026-09-12 cho thấy hậu quả **nặng hơn mức "có thể cần làm mới thủ công"**, vì hai thiếu sót cộng lại:

| Lớp | Hiện trạng | Nguồn |
| --- | --- | --- |
| Xuất bản phía cơ sở dữ liệu | Danh sách bảng được đưa vào kênh thời gian thực gồm chín bảng, **không có** bảng liên kết món và nhóm tùy chọn | `supabase/migrations/004_realtime_publication.sql:4`–`:14` |
| Đăng ký phía client | Nhóm bảng làm mất hiệu lực dữ liệu menu gồm danh mục, món, nhóm tùy chọn và giá trị tùy chọn, **không có** bảng liên kết | `src/adapters/supabase/realtimePort.ts:31` |
| Lưới an toàn bằng tải lại theo chu kỳ | Truy vấn menu **không có** tải lại theo chu kỳ; chỉ sơ đồ bàn, đơn đang mở, đơn mang đi và báo cáo mới có | `src/features/pos/usePosData.ts:11`–`:13` so với `:6`–`:9` |

Vì truy vấn menu không nằm trong nhóm tải lại 5 giây, **không có cơ chế dự phòng nào bù cho việc thiếu đăng ký**. Thao tác gắn hoặc bỏ một nhóm tùy chọn khỏi một món (`src/adapters/supabase/menuRepo.ts:104`, `:147`, `:155`) sẽ không tới được máy khác cho tới khi máy đó tải lại trang hoặc kênh thời gian thực nối lại và kích hoạt đồng bộ toàn bộ.

Hậu quả nghiệp vụ: quản lý bỏ nhóm "Mức đường" khỏi một món trên máy quầy, thu ngân ở máy thứ hai vẫn chọn được mức đường cho món đó và gửi đơn kèm tùy chọn đã bị gỡ.

## What Changes

- Đưa bảng liên kết món và nhóm tùy chọn vào danh sách xuất bản của kênh thời gian thực.
- Đăng ký bảng đó ở nhóm làm mất hiệu lực dữ liệu menu phía client.
- Bổ sung kiểm thử chứng minh thay đổi liên kết trên một thiết bị làm thiết bị thứ hai tải lại menu.
- Rà lại toàn bộ danh sách bảng: đối chiếu từng bảng nghiệp vụ với truy vấn đang phụ thuộc nó, để phát hiện các bảng khác cũng bị sót nếu có.

## Capabilities

### New Capabilities

Không có.

### Modified Capabilities

- `multi-device-sync`: bổ sung một bảng vào tập thay đổi được lan truyền.

## Impact

- Một migration nhỏ sửa danh sách xuất bản, và vài dòng ở bộ điều hợp thời gian thực.
- Tăng lượng sự kiện thời gian thực khi quản lý chỉnh menu; không đáng kể vì đây là thao tác quản trị, không phải thao tác quầy.
- Không đụng lời gọi ghi tiền, không đổi lược đồ dữ liệu nghiệp vụ.

## Ngoài phạm vi

- Giảm tải tải lại theo chu kỳ. Việc đó thuộc `optimize-runtime-load`.
- Đo độ trễ hội tụ. Việc đó thuộc `measure-runtime-load`.
- Thêm tải lại theo chu kỳ cho truy vấn menu như một lưới an toàn thứ hai: cần chốt riêng, xem câu hỏi 2.

## Phụ thuộc

- Không phụ thuộc change nào. Làm được bất kỳ lúc nào.
- Nên làm **trước** `measure-runtime-load`, để số đo độ trễ hội tụ phản ánh hệ đã đủ bảng chứ không phải hệ còn sót.

## Câu hỏi phải chốt trước khi làm

1. Có gộp việc này vào lần chạm menu gần nhất, hay làm thành một lượt riêng ngay? Chủ dự án đã chọn làm sớm khi chạm tới phần menu.
2. Có thêm tải lại theo chu kỳ cho truy vấn menu làm lưới an toàn không? Thêm thì hết phụ thuộc hoàn toàn vào kênh thời gian thực, nhưng làm tăng đúng loại tải mà `optimize-runtime-load` muốn giảm.
3. Có bảng nào khác đang bị sót theo cùng kiểu không? Cần một lượt rà đối chiếu chứ không sửa mỗi bảng đã biết.

## Quyết định đã chốt

1. **Làm sớm, không chờ giai đoạn 2.** Chốt ngày 2026-09-12 theo yêu cầu của chủ dự án: thực hiện trong lần chạm phần menu gần nhất, vì đây là lỗi đồng bộ quan sát được chứ không phải việc tối ưu.
