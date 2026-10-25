> **Đối chiếu xuất bản 25/10/2026.** Kế hoạch15/09, chưa xác nhận toàn change đã triển khai. Lô A được duyệt trước đo; store_pulse/60s là lựa chọn ghi nhận, nhưng ngưỡng20MB, lịch và ranh giới còn mở. Ước lượng request/egress bên dưới dựa raw repos/polling cũ, không là số đo main711a22e đang dùng projections/foreground polling. [Nguồn, trạng thái và giới hạn](../../../docs/workflow/tasks/docs-wip-publication-2026-10-25.md). Các yêu cầu SHALL/expected bên dưới được giữ; không đổi để hợp thức hóa code.

# Thứ tự thực hiện

Ước lượng giờ công là **dự báo**, không phải cam kết lịch. Vị trí của hai lô trên `docs/roadmap.md` **chưa chốt** — chủ dự án quyết sau, xem câu hỏi 3 trong `proposal.md`. Không tự điền vào bảng lịch chính thức.

Mỗi task dưới đây gọn trong khoảng 2 giờ.

## Cổng chặn trước khi bắt đầu

| Cổng | Điều kiện |
| --- | --- |
| G0 | Chốt thứ tự với `enforce-permissions-at-database`. Hai change cùng viết lại 14 policy RLS; phải biết cái nào chạy trước để migration không đè nhau |
| G1 | Lô B **không** được bắt đầu khi `measure-runtime-load` chưa cho số nền. Lô A không bị cổng này chặn, theo quyết định 3 ngày 2026-09-15 |
| G2 | Chốt ngưỡng đạt ở câu hỏi 2 của `proposal.md` trước khi đóng lô B |

---

## Lô A — không đổi hành vi quan sát được

### A1 — Ghi số nền cho đường đọc, 1 giờ

- Chạy kịch bản chuẩn trên project đang phát triển, đếm số request và số byte cho: sơ đồ bàn, thực đơn, đơn đang mở, chi tiết đơn, báo cáo.
- Ghi vào `docs/testing.md` dưới mục số nền, kèm ngày và cấu hình.
- **Không** sửa mã nào ở task này.

### A2 — Migration RLS initplan, 1,5 giờ

- Viết `017_read_path_optimization.sql` phần policy: đổi `auth.uid()` thành `(select auth.uid())` cho đủ 14 policy tại `supabase/migrations/002_indexes_rls_triggers.sql:88-129`.
- Không đổi tên policy, không đổi phạm vi `for all`.

### A3 — Test bảo mật cho phép biến đổi policy, 2 giờ

- Viết TC-LOAD-18: đếm số dòng đọc được trên 14 bảng, dưới phiên `S1`, trước và sau migration, với bộ dữ liệu hai cửa hàng dựng lại được.
- Viết TC-LOAD-07: `explain (analyze, verbose)` khẳng định có nút `InitPlan`.
- **Cổng chặn:** hai test này phải xanh trước khi làm A4.

### A4 — Index cho `order_item_options`, 0,5 giờ

- Thêm `create index if not exists order_item_options_store_item_idx on public.order_item_options (store_id, order_item_id);` vào cùng migration.
- Ghi lại kế hoạch thực thi của truy vấn `.in("order_item_id", …)` trước và sau.

### A5 — RPC `get_floor_plan` và `get_menu_catalog`, 2 giờ

- Viết hai hàm `stable`, `security invoker`, trả `jsonb`, giữ nguyên tên cột `snake_case`.
- Không hàm nào được dùng `security definer`.

### A6 — RPC `get_open_orders` và `get_order_detail`, 2 giờ

- `get_open_orders` gộp cả đơn tại bàn và đơn mang đi trong một kết quả.
- `get_order_detail` gộp đơn, món, tùy chọn và bản ghi thanh toán; bỏ chuỗi tuần tự ở `src/adapters/supabase/orderRepo.ts:52-92`.

### A7 — RPC `get_core_report`, 1,5 giờ

- Gộp ba truy vấn ở `src/adapters/supabase/reportRepo.ts` thành một.
- Chuyển phần tính tổng theo giờ và món bán chạy xuống SQL, hoặc giữ ở client nếu điều đó làm kết quả dễ kiểm hơn. Ghi lý do đã chọn vào `design.md`.

### A8 — Sửa adapter gọi RPC gộp, 2 giờ

- Sửa `floorPlanRepo.ts`, `menuRepo.ts`, `orderRepo.ts`, `reportRepo.ts` gọi RPC mới.
- Dùng lại `src/adapters/supabase/mappers.ts` không sửa. Nếu buộc phải sửa mapper thì dừng lại: nghĩa là hình dạng JSON đã lệch khỏi ràng buộc của LOAD-03.

### A9 — Test đếm request cho bốn đường đọc, 2 giờ

- Viết TC-LOAD-04, TC-LOAD-05, TC-LOAD-12, TC-LOAD-15.
- **Cổng chặn:** `src/adapters/supabase/repos.test.ts` phải xanh mà **không** phải sửa kỳ vọng nghiệp vụ nào.

### A10 — Test bảo mật cho RPC đọc gộp, 1,5 giờ

- Viết TC-LOAD-21, gồm cả phần khẳng định `prosecdef = false` cho cả năm hàm.

### A11 — Đo lại và ghi kết quả lô A, 1 giờ

- Chạy lại kịch bản của A1.
- Ghi vào `docs/testing.md`, đặt cạnh số nền.
- Ghi rõ điều dễ hiểu nhầm: lô A giảm số request và CPU nhưng **gần như không giảm egress**.

**Tổng lô A: khoảng 17 giờ.**

---

## Lô B — đổi cách phát hiện thay đổi

### B1 — Migration bảng `store_pulse`, 1,5 giờ

- Viết `018_store_pulse.sql`: bảng, RLS bật, chỉ cấp `select`, policy dùng `(select auth.uid())`.

### B2 — Hàm `bump_store_pulse` và trigger, 2 giờ

- Viết hàm bump dùng `insert … on conflict`.
- Gắn trigger **mức câu lệnh** cho đủ các bảng trong bảng ánh xạ của LOAD-04.

### B3 — Test bộ đếm cho từng đường ghi, 2 giờ

- Viết TC-LOAD-01 phủ `submit_order_changes`, `pay_order`, `pay_order_items`, `void_order`, ghi thực đơn, ghi sơ đồ bàn.
- Viết TC-LOAD-10 và TC-LOAD-16.

### B4 — Test rà soát chống sót đường ghi, 1,5 giờ

- Viết một test liệt kê toàn bộ hàm ghi trong `public` và đối chiếu với danh sách hàm đã có test bộ đếm.
- Hàm mới không nằm trong danh sách thì test đỏ. Đây là cổng chặn của UC-LOAD-05, không phải khuyến nghị.

### B5 — RPC `get_store_pulse` và test bảo mật, 1,5 giờ

- Viết hàm `stable`, `security invoker`.
- Viết TC-LOAD-19 và TC-LOAD-20.

### B6 — Port và hàm thuần `diffPulse`, 1,5 giờ

- Thêm `StorePulse` vào `src/domain`, `IPulseRepo` vào `src/ports`.
- Viết `diffPulse` trong `src/core` kèm test TC-LOAD-03, TC-LOAD-13, TC-LOAD-14, TC-LOAD-17.
- Quy tắc so sánh dùng phép khác nhau, không dùng phép lớn hơn. Bộ đếm xử lý dưới dạng chuỗi hoặc `bigint`, không dùng số dấu phẩy động.

### B7 — Adapter pulse, Supabase và mock, 1,5 giờ

- `src/adapters/supabase/pulseRepo.ts` và bản mock tương ứng.
- Mock phải tăng bộ đếm khi mock có ghi, để test tích hợp chạy được không cần Postgres thật.

### B8 — Hook pulse và lưới an toàn, 2 giờ

- Thêm `useStorePulse` chạy nhịp 5 giây, gọi invalidate theo kết quả `diffPulse`.
- Đổi `src/features/pos/usePosData.ts` từ `refetchInterval: 5_000` sang `refetchInterval: 60_000`.
- Giữ `refetchIntervalInBackground` **nguyên trạng** ở task này. Việc đổi nó thuộc `optimize-runtime-load`; đụng vào đây sẽ làm hai change lẫn nhau khi đọc số đo.
- Lưới an toàn không được có cờ tắt trong bản chạy thật, theo LOAD-02.

### B9 — Test nhịp và lưới an toàn, 2 giờ

- Viết TC-LOAD-02, TC-LOAD-08, TC-LOAD-09, TC-LOAD-11 với đồng hồ giả.

### B10 — Gộp tín hiệu thời gian thực, 1,5 giờ

- Bọc các hàm invalidate trong `src/features/integration/realtimeInvalidation.ts` qua bộ gộp 250 ms.
- Giữ nguyên danh sách bảng đăng ký trong `src/adapters/supabase/realtimePort.ts`.
- Viết TC-LOAD-06.

### B11 — Đo lại và đối chiếu ngưỡng, 1,5 giờ

- Chạy lại kịch bản chuẩn, ghi byte đọc mỗi ngày mỗi quán.
- Đối chiếu với ngưỡng đã chốt ở G2.
- **Cổng chặn:** chưa đạt ngưỡng thì change chưa đóng.

### B12 — Kiểm chéo độ trễ hội tụ, 1,5 giờ

- Đo lại độ trễ hội tụ giữa hai thiết bị, so với số của `measure-runtime-load`.
- **Cổng chặn:** độ trễ **không được xấu đi**. Tối ưu mà làm chậm đồng bộ là đổi một năng lực đã đặc tả lấy một chỉ số chi phí, không chấp nhận.

**Tổng lô B: khoảng 20 giờ.**

---

## Cập nhật tài liệu nhánh `docs`

### D1 — Cập nhật tài liệu nền, 2 giờ

- `docs/requirements.md`: thêm **NFR-09** "Chi phí đọc lúc chạy có trần đo được"; cập nhật ghi chú của NFR-05.
- `docs/architecture.md`: viết lại mục realtime cho đúng ba đường tín hiệu — pulse, lưới an toàn, realtime đã gộp.
- `docs/data-model.md`: thêm bảng `store_pulse` và bảng ánh xạ trigger.
- `docs/testing.md`: bảng số đo trước và sau cho cả hai lô.
- `docs/limitations.md`: ghi trần thật của gói miễn phí sau tối ưu, và đường mở rộng cho quy mô lớn hơn.

### D2 — Cập nhật OpenSpec, 1 giờ

- `openspec/specs/multi-device-sync/spec.md`: áp delta khi archive.
- `openspec/changes/optimize-runtime-load/proposal.md`: ghi rõ phần nào đã chuyển sang change này, để hai proposal không còn chồng nhau.
- `openspec/changes/measure-runtime-load/proposal.md`: sửa ước lượng 36–48 request mỗi phút, vì nó đếm query chứ không đếm request.
- `docs/roadmap.md`: điền vị trí hai lô, **sau khi** chủ dự án chốt câu hỏi 3.

---

## Cổng đóng change

| # | Điều kiện |
| --- | --- |
| 1 | Toàn bộ 21 test case trong `testplan.md` xanh |
| 2 | Bốn test case nhóm bảo mật, TC-LOAD-18 tới 21, xanh trên Postgres thật, không phải mock |
| 3 | `npm test`, `npm run test:coverage` đạt ngưỡng 90%, và `npm run build` đều qua |
| 4 | `src/adapters/supabase/repos.test.ts` xanh mà không phải sửa kỳ vọng nghiệp vụ |
| 5 | Byte đọc mỗi ngày mỗi quán đạt ngưỡng đã chốt ở G2 |
| 6 | Độ trễ hội tụ giữa hai thiết bị không xấu đi so với số nền |
| 7 | Tài liệu nhánh `docs` đã cập nhật theo D1 và D2 |
