> **Đối chiếu xuất bản 25/10/2026.** Kế hoạch15/09, chưa xác nhận toàn change đã triển khai. Lô A được duyệt trước đo; store_pulse/60s là lựa chọn ghi nhận, nhưng ngưỡng20MB, lịch và ranh giới còn mở. Ước lượng request/egress bên dưới dựa raw repos/polling cũ, không là số đo main711a22e đang dùng projections/foreground polling. [Nguồn, trạng thái và giới hạn](../../../docs/workflow/tasks/docs-wip-publication-2026-10-25.md). Các yêu cầu SHALL/expected bên dưới được giữ; không đổi để hợp thức hóa code.

# Thiết kế

## Ranh giới Ports and Adapters

| Tầng | Cái gì thuộc về đây |
| --- | --- |
| `src/domain` | Thêm kiểu `StorePulse` với bốn bộ đếm và mốc thời gian. Không đổi kiểu nào đang có; đây là ràng buộc cố ý, xem LOAD-03 |
| `src/core` | Thêm hàm thuần `diffPulse(previous, next)` trả về danh sách nhóm dữ liệu cần làm mới. Toàn bộ quy tắc so sánh version nằm ở đây, kể cả quy tắc dùng phép khác nhau chứ không dùng phép lớn hơn |
| `src/ports` | Thêm `IPulseRepo` với một phương thức `getPulse(): Promise<StorePulse \| null>`. Trả `null` khi chưa có dòng pulse |
| `src/adapters/supabase` | `pulseRepo.ts` mới; sửa `floorPlanRepo.ts`, `menuRepo.ts`, `orderRepo.ts`, `reportRepo.ts` để gọi RPC gộp; sửa `realtimePort.ts` để gộp tín hiệu |
| `src/adapters/mock` | Hiện thực `IPulseRepo` cho mock, trả bộ đếm tăng khi mock có ghi |
| `src/features` | `usePosData.ts` đổi từ `refetchInterval: 5_000` sang nhịp lưới an toàn 60 giây; thêm `useStorePulse.ts` chạy nhịp 5 giây và gọi invalidate theo kết quả `diffPulse` |

Quy tắc so sánh version nằm ở `core` chứ không nằm trong adapter hay hook, vì đó là logic thuần có nhánh biên thật (thiếu bộ đếm, bộ đếm quay về 0) và phải kiểm được bằng test đơn vị. Điều này cũng giữ đúng ngưỡng độ phủ 90% của NFR-07, vốn chỉ đo phần logic nghiệp vụ thuần.

## Lược đồ dữ liệu

### Bảng `store_pulse`

```sql
create table public.store_pulse (
  store_id uuid primary key references public.stores(id) on delete cascade,
  orders_version bigint not null default 0,
  floor_version  bigint not null default 0,
  menu_version   bigint not null default 0,
  report_version bigint not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.store_pulse enable row level security;

create policy store_pulse_store_is_auth_user on public.store_pulse
for select using (store_id = (select auth.uid()));
```

Chỉ cấp quyền `select` cho vai trò của thiết bị. Việc ghi do trigger làm, và trigger chạy dưới quyền chủ sở hữu bảng, nên thiết bị không cần quyền ghi. Đây là thu hẹp có chủ ý: một thiết bị không được phép tự bịa bộ đếm.

Không có index phụ. Bảng chỉ có một dòng cho mỗi cửa hàng và luôn truy cập bằng khóa chính.

### Hàm bump

```sql
create or replace function private.bump_store_pulse(p_store_id uuid, p_domains text[])
returns void
language plpgsql volatile security definer set search_path = pg_catalog as $$
begin
  insert into public.store_pulse as p (store_id) values (p_store_id)
  on conflict (store_id) do update set
    orders_version = p.orders_version + (case when 'orders' = any(p_domains) then 1 else 0 end),
    floor_version  = p.floor_version  + (case when 'floor'  = any(p_domains) then 1 else 0 end),
    menu_version   = p.menu_version   + (case when 'menu'   = any(p_domains) then 1 else 0 end),
    report_version = p.report_version + (case when 'report' = any(p_domains) then 1 else 0 end),
    updated_at = now();
end;
$$;
```

Dùng `insert … on conflict` thay vì `update` thuần, để dòng pulse thiếu tự lành ở lần ghi kế tiếp thay vì phải backfill lại bằng tay.

### Trigger

Trigger đặt ở **mức câu lệnh**, không phải mức dòng, dùng transition table để lấy `store_id`. Lý do: một lần gửi đơn có thể ghi mười dòng `order_items`, và trigger mức dòng sẽ gọi bump mười lần vào cùng một dòng pulse. Số version không cần đếm đúng số lần thay đổi, nó chỉ cần khác đi.

Ánh xạ bảng sang nhóm theo đúng bảng trong LOAD-04.

Việc bump nằm trong cùng giao dịch với thao tác ghi, nên rollback thì bộ đếm cũng quay lại. Đây là điều kiện bắt buộc của LOAD-04, không phải hệ quả tình cờ.

Các lời gọi ghi hiện có đều đã giữ `pg_advisory_xact_lock(hashtext(store_id || ':pos-write'))` (`supabase/migrations/003_rpc_functions.sql:109`), nên ghi trong cùng một cửa hàng đã xếp hàng tuần tự. Việc nhiều giao dịch cùng cập nhật một dòng pulse vì thế **không tạo tranh chấp mới**; nó nằm sau đúng cái khóa đang có.

## Hợp đồng kỹ thuật

### Lời gọi đọc pulse

```sql
create or replace function public.get_store_pulse()
returns jsonb
language sql stable
as $$
  select to_jsonb(p) - 'store_id' from public.store_pulse p where p.store_id = (select auth.uid());
$$;
```

Để `security invoker`, tức mặc định, **không** dùng `security definer`. Lý do: cô lập cửa hàng phải do đúng một cơ chế quyết định, là RLS. Một hàm `security definer` ở đây sẽ tạo đường vòng thứ hai phải tự bảo vệ, và đó là nơi dễ sinh lỗ hổng.

Không tìm thấy dòng thì trả `null`. Client coi `null` là "không biết", và tải đầy mỗi nhịp — tức lùi về đúng hành vi hiện tại. Đây là hướng thoái lui an toàn: hỏng theo kiểu tốn tài nguyên, không hỏng theo kiểu hiển thị sai.

### Các lời gọi đọc gộp

| Hàm | Thay cho | Trả về |
| --- | --- | --- |
| `get_floor_plan()` | 3 truy vấn ở `floorPlanRepo.ts:12` | `jsonb` gồm `areas`, `tables`, `decorItems` |
| `get_menu_catalog()` | 5 truy vấn ở `menuRepo.ts:11` | `jsonb` gồm 5 danh sách |
| `get_open_orders()` | 2 truy vấn ở `orderRepo.ts:42` và `:110` | `jsonb` gồm `dineIn`, `takeaway` |
| `get_order_detail(p_order_id uuid)` | 4 truy vấn tuần tự ở `orderRepo.ts:52` | `jsonb` gồm đơn, món, tùy chọn, thanh toán |
| `get_core_report(p_business_date date)` | 3 truy vấn ở `reportRepo.ts` | `jsonb` gồm các chỉ số báo cáo |

Tất cả để `stable` và `security invoker`, để RLS vẫn áp đúng như đường PostgREST hiện tại. Không hàm nào trong nhóm này được dùng `security definer`.

Hình dạng JSON trả về giữ nguyên tên cột kiểu `snake_case` như PostgREST đang trả, để các hàm mapper hiện có trong `src/adapters/supabase/mappers.ts` dùng lại được mà không phải viết lại. Đây là lựa chọn có đánh đổi: nó làm JSON trả về không khớp kiểu miền, nhưng nó giữ nguyên toàn bộ tầng mapper đã có test, nên rẻ hơn hẳn phương án đổi sang `camelCase` ở tầng SQL.

### Chiến lược cache phía client

```
nhịp 5 giây  ──▶ get_store_pulse() ──▶ diffPulse(previous, next)
                                          │
                                          ├─ không đổi  ──▶ không làm gì
                                          └─ đổi nhóm X ──▶ invalidate nhóm X

nhịp 60 giây ──▶ tải đầy vô điều kiện mọi nhóm vận hành

tín hiệu realtime ──▶ gộp 250 ms ──▶ invalidate nhóm tương ứng
```

Ba đường độc lập, cùng đổ vào một cơ chế invalidate. Không đường nào được phép tắt hai đường kia.

Khóa query giữ nguyên. Pulse **không** đi vào khóa query. Lý do: nếu nhét version vào khóa thì mỗi lần version đổi sẽ sinh một mục cache mới và mục cũ tồn tại tới khi hết `gcTime`, làm bộ nhớ phình theo số lần thay đổi — đúng vấn đề mà `handle-long-running-session` đang theo dõi.

## Ảnh hưởng tới RLS, migration và realtime

### RLS

Một migration sửa 14 policy tại `supabase/migrations/002_indexes_rls_triggers.sql:88-129`, đổi `auth.uid()` thành `(select auth.uid())`. Phép biến đổi này giữ nguyên tập dòng: `auth.uid()` là hàm `stable` không tham số, nên bọc trong `select` cho Postgres tính một lần thành InitPlan thay vì gọi lại cho mỗi dòng.

Đây là chỗ **bắt buộc** phải có nhóm test bảo mật, vì nó đụng đúng biên của NFR-02. Không được coi phép biến đổi là hiển nhiên đúng chỉ vì nó phổ biến.

Phối hợp với `enforce-permissions-at-database`: hai change cùng viết lại cùng một khối policy. Nếu change kia chạy trước thì change này chỉ áp lên phiên bản policy mới của nó. Cần chốt thứ tự trước khi viết migration, xem câu hỏi 3 trong `proposal.md`.

### Migration

Đề xuất một migration `017_store_pulse_and_read_rpc.sql`, nhưng chia thành hai tệp nếu hai lô chạy cách nhau:

- `017_read_path_optimization.sql` cho lô A: RLS initplan, index `order_item_options`, năm RPC đọc gộp.
- `018_store_pulse.sql` cho lô B: bảng, trigger, RPC đọc pulse.

Cả hai đều cộng thêm, không xóa gì. Đường PostgREST cũ vẫn chạy được sau migration, nên có thể triển khai migration trước rồi mới triển khai frontend — điều này quan trọng vì Vercel và Supabase deploy độc lập.

### Realtime

`realtimePort.ts` giữ nguyên danh sách bảng đang đăng ký. Thay đổi duy nhất là thêm bước gộp: mỗi hàm invalidate được bọc qua một bộ hẹn giờ 250 ms, nhiều lần gọi trong cửa sổ thì chỉ chạy một lần ở cuối.

`realtimeInvalidation.ts` hiện gọi cả `invalidateQueries` lẫn `refetchQueries` (`src/features/integration/realtimeInvalidation.ts:10-26`). Giữ nguyên cặp này; việc gộp diễn ra ở tầng trên nó.

Việc đổi publication sang chỉ phát `store_pulse` **không** thuộc change này. Nó cần bảng pulse có trước, và nó buộc viết lại cách `realtimePort` phân biệt nhóm dữ liệu, vì khi đó chỉ còn một bảng phát sự kiện. Xem mục Ngoài phạm vi của `proposal.md`.

## Phương án đã cân nhắc và loại

| Phương án | Vì sao loại |
| --- | --- |
| Thêm backend Node làm tầng trung gian | Không giảm kết nối Postgres vì PostgREST đã dùng pool; thêm một điểm chết vào đường đi của tiền; mất RLS làm biên cô lập, tức phải dựng lại NFR-02 ở tầng ứng dụng; tốn tiền hạ tầng mà đồ án không có ngân sách |
| Chỉ giãn chu kỳ từ 5 giây lên 15 giây | Rẻ nhất, một dòng code, nhưng egress chỉ giảm ba lần thay vì mười, và phải hạ cam kết độ trễ trong `multi-device-sync` từ 5 giây xuống 15 giây. Đổi cam kết với người dùng để đổi lấy một phần ba lợi ích là đánh đổi tệ |
| Bỏ hẳn polling, chỉ dựa tín hiệu thời gian thực | Tiết kiệm nhất nhưng bỏ luôn lưới an toàn. `realtimePort.ts:50` đã có cơ chế tự lành khi kênh nối lại, nhưng nó không cứu được ca socket còn sống mà không nhận sự kiện. Rủi ro hiển thị dữ liệu cũ vĩnh viễn, không chấp nhận được với một hệ tính tiền |
| Làm `store_pulse` mà bỏ lưới an toàn 60 giây | Egress thấp hơn nữa, nhưng một trigger sót sẽ gây dữ liệu cũ vĩnh viễn mà không có lỗi nào bắn ra. Chủ dự án đã loại phương án này ngày 2026-09-15 |
| Dùng `ETag` và `If-None-Match` của HTTP | Đúng chuẩn hơn, nhưng PostgREST không sinh ETag cho truy vấn động, nên không có gì để so. Pulse chính là cách làm tay của cơ chế này |
| Nhét version vào khóa query của TanStack Query | Ngắn gọn hơn ở tầng hook, nhưng mỗi lần đổi version sinh một mục cache mới, làm bộ nhớ phình theo số lần thay đổi |
| Trigger mức dòng thay vì mức câu lệnh | Viết đơn giản hơn, nhưng một lần gửi đơn mười món sẽ gọi bump mười lần vào cùng một dòng |

## Rủi ro

| Rủi ro | Mức | Cách chặn |
| --- | --- | --- |
| Trigger sót một đường ghi, thiết bị hiển thị dữ liệu cũ mà không báo lỗi | **Cao** | Lưới an toàn 60 giây theo LOAD-02; test bắt buộc cho từng đường ghi theo UC-LOAD-05; một test rà soát liệt kê toàn bộ hàm ghi trong `public` và đối chiếu với danh sách đã có test |
| Sửa 14 policy RLS làm lệch biên cô lập cửa hàng | **Cao** | Nhóm test bảo mật bắt buộc, chạy cùng bộ dữ liệu trước và sau migration, khẳng định tập dòng đọc được không đổi |
| RPC đọc gộp làm sai hình dạng dữ liệu | Trung bình | Giữ nguyên kiểu miền và tầng mapper; chạy bộ test adapter hiện có làm cổng hồi quy |
| Dòng pulse bị xóa rồi tạo lại, bộ đếm quay về 0 | Trung bình | So sánh bằng phép khác nhau, không dùng phép lớn hơn; quy tắc này nằm trong `diffPulse` ở `core` và có test biên riêng |
| Frontend triển khai trước migration | Thấp | Migration chỉ cộng thêm; đường PostgREST cũ vẫn chạy. Thứ tự triển khai: migration trước, frontend sau |
| Hai change cùng viết lại policy | Thấp | Chốt thứ tự với `enforce-permissions-at-database` trước khi viết migration |
