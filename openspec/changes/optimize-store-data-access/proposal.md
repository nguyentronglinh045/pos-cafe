> **Đối chiếu xuất bản 25/10/2026.** Kế hoạch15/09, chưa xác nhận toàn change đã triển khai. Lô A được duyệt trước đo; store_pulse/60s là lựa chọn ghi nhận, nhưng ngưỡng20MB, lịch và ranh giới còn mở. Ước lượng request/egress bên dưới dựa raw repos/polling cũ, không là số đo main711a22e đang dùng projections/foreground polling. [Nguồn, trạng thái và giới hạn](../../../docs/workflow/tasks/docs-wip-publication-2026-10-25.md). Các yêu cầu SHALL/expected bên dưới được giữ; không đổi để hợp thức hóa code.

# Tối ưu đường đọc dữ liệu theo cửa hàng

## Why

Câu hỏi khởi nguồn của chủ dự án ngày 2026-09-15: mỗi thiết bị gọi thẳng vào cơ sở dữ liệu thì mở rộng kiểu gì, và nếu hệ nhận hơn 100 quán × 5 thiết bị thì phương án là gì.

### Sửa một tiền đề

Thiết bị **không** mở kết nối tới Postgres. Đường đi thật là browser → PostgREST của Supabase (HTTP không trạng thái) → pool kết nối dùng chung. Mười máy không thành mười kết nối cơ sở dữ liệu. `vercel.json` chỉ phục vụ tệp tĩnh, không có tầng ứng dụng riêng — đúng như NFR-08 đã ghi.

Nên "tối ưu kết nối" là tối ưu sai chỗ. Trần thật nằm ở bốn nơi khác, và trần đắt nhất là **số byte đọc**, không phải số kết nối.

### Tải hiện tại, đọc từ kho mã

`src/features/pos/usePosData.ts:6` đặt `refetchInterval: 5_000` cùng `refetchIntervalInBackground: true`. Mỗi query lại nở ra nhiều lời gọi HTTP:

| Query | Số request mỗi lần | Nguồn |
| --- | --- | --- |
| `floorPlan` | 3 | `src/adapters/supabase/floorPlanRepo.ts:12` |
| `openOrders` | 1 | `src/adapters/supabase/orderRepo.ts:42` |
| `takeawayOpenOrders` | 1 | `src/adapters/supabase/orderRepo.ts:110` |
| `orderDetail` | 2–4, tuần tự | `src/adapters/supabase/orderRepo.ts:52` |
| `menu`, khi bị invalidate | 5 | `src/adapters/supabase/menuRepo.ts:11` |

Một máy ở màn hình sàn gửi 5 request mỗi 5 giây, tức **60 request mỗi phút**, và vẫn gửi khi quán đã đóng cửa. Mở chi tiết đơn thì lên khoảng 100. `src/app/drawers/pos/WriteRecoveryDrawer.tsx:55` thêm một nhịp 5 giây nữa khi drawer tra cứu đang mở.

Ước lượng của `measure-runtime-load` ghi 36–48 request mỗi phút. Con số đó **thiếu**, vì nó đếm query chứ không đếm request; một query sơ đồ bàn là ba lời gọi HTTP.

Cú dồn lớn hơn nằm ở realtime. `src/adapters/supabase/realtimePort.ts:24` đăng ký riêng lẻ `orders`, `payments`, `tables`, và mỗi sự kiện gọi ba hàm invalidate. `src/features/integration/realtimeInvalidation.ts` làm cả `invalidateQueries` lẫn `refetchQueries` cho mỗi hàm đó. Một lần thanh toán sinh sự kiện trên ba bảng, nên mọi máy trong quán cùng chạy lại sơ đồ bàn (3 request), danh sách đơn và báo cáo (3 request). Không có bước gộp tín hiệu. Năm máy thì một hóa đơn kéo theo khoảng một trăm lời gọi HTTP.

### Bốn trần của gói miễn phí

Giả định để tính, **chưa đo**, phải xác nhận ở `measure-runtime-load`: quán 30 bàn, 60 món, 150 đơn mỗi ngày, mở 12 giờ, 5 máy đều ở màn hình sàn, payload đã nén gzip khoảng 4 KB mỗi nhịp.

| Trần | Hạn mức miễn phí | 1 quán × 5 máy | 100 quán × 5 máy |
| --- | --- | --- | --- |
| Egress | 5 GB mỗi tháng | **5,2 GB** | 520 GB, vượt 104 lần |
| Kết nối realtime đồng thời | khoảng 200 | 5 | 500, vượt 2,5 lần |
| Message realtime | 2 triệu mỗi tháng | 90 nghìn | 9 triệu, vượt 4,5 lần |
| Dung lượng cơ sở dữ liệu | 500 MB | ~5 MB mỗi tháng | ~540 MB mỗi tháng, vượt ngay tháng đầu |

Kết luận đọc thẳng từ bảng: **một quán năm máy đã tiêu hết egress của gói miễn phí**. Câu hỏi 100 quán không phải chuyện tương lai xa; hệ đang chạm trần ở quy mô một quán.

### Vì sao không thêm tầng máy chủ riêng

Phương án trực giác là dựng một backend Node ở giữa. Đã cân nhắc và **loại**, vì bốn lý do:

1. Nó không giảm kết nối Postgres. PostgREST đã dùng pool; thêm một tầng chỉ dời chỗ pool.
2. Nó thêm một chặng mạng và một điểm chết mới vào đúng đường đi của tiền.
3. Nó làm mất RLS với tư cách biên cô lập cửa hàng, trừ khi dựng lại toàn bộ phần kiểm tra ở tầng ứng dụng. NFR-02 đang dựa vào RLS.
4. Nó tốn tiền hạ tầng, mà đồ án không có ngân sách tiền.

Hướng đúng: **giữ nguyên đường đi, giảm số request và số byte**.

## What Changes

Chia hai lô theo mức rủi ro.

### Lô A — không đổi hành vi quan sát được

1. **RLS dùng initplan.** Đổi `auth.uid()` thành `(select auth.uid())` trong 14 policy tại `supabase/migrations/002_indexes_rls_triggers.sql:88-129`. Postgres tính một lần cho cả truy vấn thay vì gọi lại mỗi dòng. Kho mã hiện **không có** chỗ nào dùng dạng bọc `select`.
2. **Bổ sung index còn thiếu** cho `order_item_options (store_id, order_item_id)`. Rà toàn bộ migration cho thấy bảng này chỉ có trigger và policy, **không có index nào**. `orderRepo.getOrder` lọc bằng `.in("order_item_id", ...)` tại `src/adapters/supabase/orderRepo.ts:74`, và truy vấn đó đang chạy mỗi 5 giây khi có đơn mở.
3. **Gộp mỗi màn hình đọc về một lời gọi.** Thêm RPC trả JSON: `get_floor_plan`, `get_menu_catalog`, `get_open_orders`, `get_order_detail`, `get_core_report`. Sơ đồ bàn 3 → 1, thực đơn 5 → 1, chi tiết đơn 4 → 1, báo cáo 3 → 1. Bỏ luôn chuỗi tuần tự trong `getOrder`.

Lô A giảm mạnh số request và chi phí CPU, nhưng **gần như không giảm egress**, vì egress là byte payload chứ không phải số request. Cần ghi rõ điều này để không nhầm lẫn khi đọc số đo.

### Lô B — đổi cách phát hiện thay đổi

4. **Bảng `store_pulse`.** Một dòng cho mỗi cửa hàng, giữ bốn bộ đếm đơn điệu: `orders_version`, `floor_version`, `menu_version`, `report_version`. Trigger trên các bảng nghiệp vụ tăng bộ đếm tương ứng. Thiết bị poll `get_store_pulse()` mỗi 5 giây, nhận khoảng 150 byte, và **chỉ tải payload đầy khi số version khác với số đang giữ**.

   Đây là cơ chế `ETag` và `If-None-Match` của HTTP làm bằng tay, vì PostgREST không sinh ETag cho truy vấn động.

5. **Lưới an toàn 60 giây.** Ngoài đường pulse, mỗi truy vấn vận hành vẫn tải đầy vô điều kiện mỗi 60 giây. Đây là lớp chặn cho rủi ro nghiêm trọng nhất của thiết kế pulse: nếu một đường ghi nào đó không bump version thì thiết bị sẽ hiển thị dữ liệu cũ **mà không có lỗi nào bắn ra**. Có lưới này thì sai sót đó tốn tối đa 60 giây thay vì vĩnh viễn.

6. **Gộp tín hiệu realtime.** Dồn các lần invalidate trong một cửa sổ khoảng 250 ms thành một lượt, để một lần thanh toán sinh một lượt tải lại thay vì ba.

### Kết quả kỳ vọng

| Chỉ số, một quán 5 máy, 12 giờ | Hiện tại | Sau lô A | Sau lô B |
| --- | --- | --- | --- |
| Request mỗi phút mỗi máy | 60 | 12 | 12, phần lớn là pulse 150 byte |
| Byte đọc mỗi ngày mỗi quán | ~173 MB | ~165 MB | **~17 MB** |
| Egress mỗi tháng mỗi quán | 5,2 GB | 5,0 GB | **0,55 GB** |
| Số quán trong hạn mức miễn phí | ~1 | ~1 | **~9 quán bận, ~25 quán vắng** |

Toàn bộ các con số trên là **ước lượng suy từ mã, chưa đo**. Việc biến chúng thành số thật thuộc `measure-runtime-load`.

### Trả lời câu 100 quán × 5 thiết bị

Không có đường miễn phí cho quy mô đó, và spec này không giả vờ là có. Câu trả lời đúng gồm hai phần, và phần thứ hai chỉ đứng vững khi có phần thứ nhất:

1. **Chi phí mỗi quán giảm khoảng 10 lần**, chứng minh được bằng số đo trước và sau.
2. **Đường mở rộng biết trước và tuyến tính.** Gói trả phí bậc đầu phủ được egress ở quy mô đó — hạn mức cụ thể phải kiểm lại bảng giá tại thời điểm triển khai, không chép theo trí nhớ. Trần kết nối realtime thì 100 quán × 5 máy chạm đúng mép hạn mức, nên vượt mức đó phải **chia sang nhiều project Supabase, định tuyến theo `store_no`**. Mô hình shared-schema hiện tại đã tách sạch theo `store_id` nên chia được mà không đụng mã nghiệp vụ. Trần dung lượng thì xử bằng archive hoặc partition `orders` và `order_items` theo `business_date`.

## Capabilities

### Modified Capabilities

- `multi-device-sync`: requirement "Tải lại theo chu kỳ cho dữ liệu vận hành" hiện phát biểu là các truy vấn được **tải lại** mỗi khoảng 5 giây. Sau change này, mỗi 5 giây là một lần **kiểm tra thay đổi**, còn tải đầy chỉ xảy ra khi có thay đổi hoặc khi tới nhịp lưới an toàn 60 giây.

Requirement "Tín hiệu thời gian thực dùng để tải lại, không vá cache" **không đổi**. Pulse chỉ báo "cần tải lại", nó không vá cache từ nội dung tín hiệu.

## Impact

- Migration mới: bảng `store_pulse`, trigger bump, index `order_item_options`, sửa 14 policy RLS, và các RPC đọc gộp.
- Adapter: `src/adapters/supabase/floorPlanRepo.ts`, `menuRepo.ts`, `orderRepo.ts`, `reportRepo.ts`, `realtimePort.ts`; thêm một repo cho pulse.
- Ports: thêm hợp đồng đọc pulse vào `src/ports/index.ts`, và adapter mock tương ứng.
- Features: `src/features/pos/usePosData.ts`, `src/features/integration/realtimeInvalidation.ts`.
- Tài liệu nhánh `docs`: `architecture.md` mục realtime, `data-model.md`, `requirements.md` (khai NFR-09 mới), `limitations.md`, `testing.md`.
- Rủi ro thật, xếp theo mức nghiêm trọng:
  1. Trigger bump sót một đường ghi thì thiết bị hiển thị dữ liệu cũ mà không báo lỗi. Chặn bằng lưới an toàn 60 giây và bằng test bắt buộc cho từng đường ghi.
  2. RPC đọc gộp viết lại bốn đường đọc cùng lúc. Chặn bằng bộ test adapter hiện có, chạy trước và sau.
  3. Sửa policy RLS đụng đúng biên cô lập cửa hàng của NFR-02. Chặn bằng nhóm test bảo mật bắt buộc.

## Ngoài phạm vi

- Dừng hoặc giãn polling khi tab ẩn, và việc chỉnh chu kỳ 5 giây thành số khác. Hai việc đó thuộc `optimize-runtime-load`.
- Đo đạc. Việc đó thuộc `measure-runtime-load`.
- Đổi realtime publication từ 9 bảng nghiệp vụ sang chỉ `store_pulse`. Việc này cắt được message realtime khoảng ba lần và ngừng phát dữ liệu nghiệp vụ qua websocket, nhưng nó **phụ thuộc bảng `store_pulse` phải có trước**, và nó buộc viết lại `realtimePort.ts`. Để lại thành quyết định riêng sau khi lô B chạy và có số đo.
- Thêm tầng máy chủ ứng dụng riêng. Đã cân nhắc và loại, lý do ở mục Why.
- Nâng gói dịch vụ. Đồ án không có ngân sách tiền.
- Tăng trưởng bộ nhớ phía trình duyệt. Việc đó thuộc `handle-long-running-session`.

## Phụ thuộc

- **Lô A không phụ thuộc change nào.** Chủ dự án đã duyệt ngày 2026-09-15 cho phép làm trước khi có số đo, vì ba việc trong lô là sửa lỗi hiệu năng chứng minh được bằng tài liệu Postgres chứ không phải suy đoán, và bộ test hồi quy hiện có đủ làm cổng chặn.
- **Lô B bắt buộc làm sau `measure-runtime-load`.** Không có số nền thì không chứng minh được egress giảm thật.
- Chạm cùng vùng policy RLS với `enforce-permissions-at-database`. Hai change phải phối hợp để không viết lại policy hai lần.
- Nên làm sau `expand-e2e-coverage`, vì đụng vào phần khó kiểm nhất của hệ.

## Câu hỏi phải chốt trước khi làm

1. Ranh giới với `optimize-runtime-load`: giữ hai change riêng, hay thu hẹp `optimize-runtime-load` còn đúng phần tab ẩn và chu kỳ rồi dồn phần còn lại sang đây? Hiện hai proposal chồng nhau ở mục "xem lại quan hệ giữa polling và realtime".
2. Ngưỡng nghiệm thu cho lô B: đề xuất "một quán 5 máy, 12 giờ, 150 đơn thì tổng byte đọc không quá 20 MB mỗi ngày", so với khoảng 173 MB hiện tại. Chủ dự án có chốt con số này làm tiêu chí đạt hay không?
3. Vị trí trên lịch cho từng lô. Chủ dự án đã nói quyết định sau; cần chốt trước khi biến `tasks.md` thành lịch thật.
4. Đòn đổi realtime publication có được đưa vào phạm vi khóa luận không, hay để lại làm hướng phát triển ghi trong `limitations.md`?

## Quyết định đã chốt

Ghi ngày 2026-09-15, theo trả lời của chủ dự án.

| # | Nội dung chốt |
| --- | --- |
| 1 | **Mục tiêu** là ở lại gói miễn phí, đồng thời phải trả lời được câu phản biện về quy mô hơn 100 quán × 5 thiết bị. Nên spec phải có cả phần số đo lẫn phần đường mở rộng có giá. |
| 2 | **Làm `store_pulse` kèm lưới an toàn 60 giây.** Hai phương án còn lại bị loại: chỉ giãn chu kỳ 5 giây lên 15 giây thì egress chỉ giảm ba lần và phải đổi số cam kết trong `multi-device-sync`; làm pulse mà bỏ lưới an toàn thì một trigger sót gây dữ liệu cũ vĩnh viễn, không chấp nhận được. |
| 3 | **Lô A được làm trước khi có số đo** của `measure-runtime-load`, vì không đổi hành vi quan sát được. |
| 4 | **Vị trí trên lịch quyết định sau.** Ưu tiên chốt phần kỹ thuật cốt lõi trước. |
