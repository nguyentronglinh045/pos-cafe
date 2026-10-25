> **Đối chiếu xuất bản 25/10/2026.** Kế hoạch15/09, chưa xác nhận toàn change đã triển khai. Lô A được duyệt trước đo; store_pulse/60s là lựa chọn ghi nhận, nhưng ngưỡng20MB, lịch và ranh giới còn mở. Ước lượng request/egress bên dưới dựa raw repos/polling cũ, không là số đo main711a22e đang dùng projections/foreground polling. [Nguồn, trạng thái và giới hạn](../../../docs/workflow/tasks/docs-wip-publication-2026-10-25.md). Các yêu cầu SHALL/expected bên dưới được giữ; không đổi để hợp thức hóa code.

# Kế hoạch kiểm thử

## Phạm vi

Change này giao ba loại sản phẩm: **migration** (policy RLS, index, bảng, trigger, RPC), **mã adapter và feature** (repo gọi RPC gộp, hook pulse, gộp tín hiệu), và **số đo** (byte đọc trước và sau). Kế hoạch dưới đây kiểm chứng cả ba.

Bốn nhóm bắt buộc của `openspec/SPEC-STANDARD.md` mục 5:

| Nhóm | Test case |
| --- | --- |
| Luồng chính | TC-LOAD-01 tới 07 |
| Luồng ngoại lệ | TC-LOAD-08 tới 12 |
| Biên | TC-LOAD-13 tới 17 |
| **Bảo mật và quyền** | TC-LOAD-18 tới 21 |

Nhóm bảo mật là **bắt buộc và không được bỏ** với change này, vì nó sửa đúng 14 policy RLS đang giữ biên cô lập cửa hàng của NFR-02, và vì nó thêm một bảng mới mà mọi thiết bị đọc được.

---

## Nhóm A — Luồng chính

### TC-LOAD-01 — Bộ đếm tăng đúng nhóm sau mỗi đường ghi

| | |
| --- | --- |
| **Truy vết** | UC-LOAD-01, UC-LOAD-05; LOAD-04 |
| **Mức** | tích hợp, chạy trên Postgres thật |
| **Tiền điều kiện** | Migration lô B đã áp; một cửa hàng có dữ liệu demo |
| **Dữ liệu thử** | Cửa hàng `S1`; bàn `T05`; món đơn giá 25000 |

**Các bước**

1. Đọc bộ đếm hiện tại của `S1`.
2. Gọi `submit_order_changes` tạo một đơn tại `T05` với một món.
3. Đọc lại bộ đếm.
4. Lặp bước 1–3 cho `pay_order`, `pay_order_items`, `void_order`, và các đường ghi thực đơn cùng sơ đồ bàn.

**Kết quả mong đợi**

- Sau `submit_order_changes`: `orders_version` và `report_version` đều tăng; `floor_version` tăng vì trạng thái bàn đổi; `menu_version` không đổi.
- Sau `pay_order` và `pay_order_items`: `orders_version` và `report_version` tăng.
- Sau `void_order` trên đơn đã thanh toán: `orders_version` và `report_version` tăng.
- Sau ghi thực đơn: chỉ `menu_version` tăng.
- Sau ghi sơ đồ bàn: chỉ `floor_version` tăng.

**Nơi hiện thực** — điền sau khi viết test.

---

### TC-LOAD-02 — Quán vắng không sinh lượt tải đầy theo đường pulse

| | |
| --- | --- |
| **Truy vết** | UC-LOAD-02; LOAD-01 |
| **Mức** | tích hợp, dùng đồng hồ giả |
| **Tiền điều kiện** | Hook pulse và hook dữ liệu đã nối; không có thao tác ghi |
| **Dữ liệu thử** | Khoảng quan sát 300 giây giả lập |

**Các bước**

1. Dựng client với đồng hồ giả, tab ở trạng thái hiển thị.
2. Tua 300 giây.
3. Đếm số lời gọi theo từng loại.

**Kết quả mong đợi**

- Số lời gọi `get_store_pulse` bằng 60.
- Số lượt tải đầy đúng bằng 5, tức chỉ đến từ lưới an toàn 60 giây.
- Không có lượt tải đầy nào phát sinh từ đường pulse.

---

### TC-LOAD-03 — Version đổi thì chỉ nhóm liên quan được tải lại

| | |
| --- | --- |
| **Truy vết** | UC-LOAD-01; LOAD-01 |
| **Mức** | đơn vị cho `diffPulse`, cộng tích hợp cho hook |
| **Tiền điều kiện** | Không |
| **Dữ liệu thử** | previous `{orders:5, floor:2, menu:9, report:5}`; next `{orders:6, floor:3, menu:9, report:6}` |

**Các bước**

1. Gọi `diffPulse(previous, next)`.
2. Chạy hook với cặp giá trị đó và đếm lời gọi tải lại.

**Kết quả mong đợi**

- `diffPulse` trả về đúng ba nhóm: đơn, sơ đồ, báo cáo.
- Hook tải lại đúng ba nhóm đó và **không** gọi lại thực đơn.

---

### TC-LOAD-04 — Chi tiết đơn lấy bằng đúng một lời gọi

| | |
| --- | --- |
| **Truy vết** | UC-LOAD-04; LOAD-03 |
| **Mức** | tích hợp adapter |
| **Tiền điều kiện** | RPC `get_order_detail` đã có |
| **Dữ liệu thử** | Đơn đã thanh toán, 5 món, 8 tùy chọn |

**Các bước**

1. Gọi `orderRepo.getOrder(orderId)` qua adapter Supabase với client đếm request.
2. Đếm số request phát ra.
3. So kết quả với kỳ vọng nghiệp vụ trong bộ test adapter hiện có.

**Kết quả mong đợi**

- Số request đúng bằng 1.
- Kết quả trả về khớp kiểu `OrderDetail` hiện có, không phải sửa kỳ vọng nghiệp vụ nào trong `src/adapters/supabase/repos.test.ts`.

---

### TC-LOAD-05 — Sơ đồ bàn, thực đơn, đơn đang mở và báo cáo mỗi thứ một lời gọi

| | |
| --- | --- |
| **Truy vết** | UC-LOAD-04; LOAD-03 |
| **Mức** | tích hợp adapter |
| **Tiền điều kiện** | Bốn RPC còn lại đã có |
| **Dữ liệu thử** | Cửa hàng demo đầy đủ |

**Các bước**

1. Gọi lần lượt `floorPlanRepo.getFloorPlan`, `menuRepo.getMenu`, `orderRepo.listOpenOrders`, `reportRepo.getCoreReport`.
2. Đếm request cho từng lần.

**Kết quả mong đợi**

- Mỗi lần đúng 1 request; tổng 4 request cho bốn thao tác, so với 12 ở baseline.

---

### TC-LOAD-06 — Ba sự kiện thời gian thực gộp thành một lượt

| | |
| --- | --- |
| **Truy vết** | UC-LOAD-01; LOAD-06 |
| **Mức** | tích hợp, dùng đồng hồ giả và realtime mock |
| **Tiền điều kiện** | Bước gộp đã nối vào `realtimePort` |
| **Dữ liệu thử** | Ba sự kiện trên `orders`, `payments`, `tables` cách nhau 10 ms |

**Các bước**

1. Bắn ba sự kiện.
2. Tua 250 ms.
3. Đếm số lượt làm mới cho từng nhóm.

**Kết quả mong đợi**

- Mỗi nhóm được làm mới đúng một lần.
- Tổng thời gian từ sự kiện đầu tới lượt làm mới không quá 250 ms.

---

### TC-LOAD-07 — Policy dùng InitPlan thay vì gọi mỗi dòng

| | |
| --- | --- |
| **Truy vết** | LOAD-05 |
| **Mức** | tích hợp, chạy trên Postgres thật |
| **Tiền điều kiện** | Migration lô A đã áp; bảng `menu_items` có ít nhất 500 dòng |
| **Dữ liệu thử** | Truy vấn liệt kê `menu_items` của một cửa hàng |

**Các bước**

1. Chạy `explain (analyze, verbose)` cho truy vấn, dưới phiên của cửa hàng.
2. Đọc kế hoạch thực thi.

**Kết quả mong đợi**

- Kế hoạch có nút `InitPlan` chứa `auth.uid()`.
- `auth.uid()` **không** xuất hiện như điều kiện lọc được đánh giá lại trên từng dòng.

---

## Nhóm B — Luồng ngoại lệ

### TC-LOAD-08 — Không có dòng pulse thì lùi về tải đầy

| | |
| --- | --- |
| **Truy vết** | UC-LOAD-01 nhánh 4a; LOAD-01 |
| **Mức** | tích hợp |
| **Tiền điều kiện** | Xóa dòng pulse của cửa hàng thử |
| **Dữ liệu thử** | Cửa hàng không có dòng pulse |

**Các bước**

1. Chạy client 30 giây giả lập.
2. Đếm lượt tải đầy và kiểm giao diện.

**Kết quả mong đợi**

- Mỗi nhịp 5 giây đều sinh một lượt tải đầy, tức đúng hành vi baseline.
- Không có thông báo lỗi nào hiển thị cho người dùng.
- Có ghi nhật ký kỹ thuật một lần, không lặp mỗi nhịp.

---

### TC-LOAD-09 — Lời gọi pulse lỗi mạng không làm hỏng màn hình

| | |
| --- | --- |
| **Truy vết** | UC-LOAD-01 nhánh 3a |
| **Mức** | tích hợp |
| **Tiền điều kiện** | Client đang có dữ liệu hiển thị |
| **Dữ liệu thử** | Lỗi mạng ở 3 nhịp liên tiếp, rồi phục hồi |

**Các bước**

1. Cho lời gọi pulse thất bại 3 nhịp.
2. Cho phục hồi, với bộ đếm đã đổi.

**Kết quả mong đợi**

- Trong 3 nhịp lỗi, màn hình giữ nguyên dữ liệu cũ và **không** hiện toast lỗi.
- Ngay nhịp phục hồi, chênh version được phát hiện và các nhóm liên quan được tải lại.

---

### TC-LOAD-10 — Giao dịch rollback thì bộ đếm không tăng

| | |
| --- | --- |
| **Truy vết** | LOAD-04 |
| **Mức** | tích hợp, Postgres thật |
| **Tiền điều kiện** | Một đơn ở `lock_version = 3` |
| **Dữ liệu thử** | Gọi `pay_order` với `p_expected_lock_version = 1` |

**Các bước**

1. Đọc bộ đếm.
2. Gọi `pay_order` với version sai để nó bị từ chối.
3. Đọc lại bộ đếm.

**Kết quả mong đợi**

- Lời gọi bị từ chối theo đúng hành vi hiện hành.
- Cả bốn bộ đếm **không đổi**.

---

### TC-LOAD-11 — Lưới an toàn cứu trigger bị sót

| | |
| --- | --- |
| **Truy vết** | UC-LOAD-03; LOAD-02 |
| **Mức** | tích hợp, dùng đồng hồ giả |
| **Tiền điều kiện** | Dựng một đường ghi thử **cố ý không bump** bộ đếm, chỉ trong môi trường test |
| **Dữ liệu thử** | Tín hiệu thời gian thực bị chặn hoàn toàn |

**Các bước**

1. Ghi qua đường không bump.
2. Tua 59 giây, kiểm màn hình.
3. Tua thêm 2 giây, kiểm lại.

**Kết quả mong đợi**

- Ở mốc 59 giây, màn hình có thể vẫn hiển thị dữ liệu cũ. Đây là hành vi được chấp nhận.
- Ở mốc 61 giây, màn hình đã hiển thị dữ liệu mới.

---

### TC-LOAD-12 — Chi tiết đơn không tồn tại trả đúng mã lỗi

| | |
| --- | --- |
| **Truy vết** | UC-LOAD-04 nhánh ngoại lệ 3a |
| **Mức** | tích hợp adapter |
| **Tiền điều kiện** | Không |
| **Dữ liệu thử** | `orderId` là UUID hợp lệ nhưng không tồn tại |

**Các bước**

1. Gọi `orderRepo.getOrder` với id đó.

**Kết quả mong đợi**

- Ném `AppError` mã `NOT_FOUND`.
- Giao diện hiện đúng câu "Không tìm thấy đơn."

---

## Nhóm C — Biên

### TC-LOAD-13 — Bộ đếm quay về 0 vẫn được coi là có thay đổi

| | |
| --- | --- |
| **Truy vết** | LOAD-01 |
| **Mức** | đơn vị, `diffPulse` |
| **Tiền điều kiện** | Không |
| **Dữ liệu thử** | previous `{orders: 42, …}`; next `{orders: 0, …}` |

**Các bước**

1. Gọi `diffPulse(previous, next)`.

**Kết quả mong đợi**

- Trả về có chứa nhóm đơn. Đây là ca chặn đúng lỗi dùng phép lớn hơn thay vì phép khác nhau.

---

### TC-LOAD-14 — Chưa có bộ đếm trong bộ nhớ thì tải đầy

| | |
| --- | --- |
| **Truy vết** | LOAD-01 |
| **Mức** | đơn vị |
| **Tiền điều kiện** | Không |
| **Dữ liệu thử** | previous `null`; next `{orders: 0, floor: 0, menu: 0, report: 0}` |

**Kết quả mong đợi**

- Trả về đủ cả bốn nhóm, kể cả khi mọi bộ đếm đều bằng 0.

---

### TC-LOAD-15 — Đơn không có món nào

| | |
| --- | --- |
| **Truy vết** | UC-LOAD-04 nhánh 3b; LOAD-03 |
| **Mức** | tích hợp adapter |
| **Dữ liệu thử** | Đơn tồn tại, 0 món |

**Kết quả mong đợi**

- Đúng 1 request; danh sách món rỗng; không phát sinh lời gọi phụ cho tùy chọn.

---

### TC-LOAD-16 — Một lần gửi đơn nhiều món chỉ bump một lần mỗi nhóm

| | |
| --- | --- |
| **Truy vết** | LOAD-04 |
| **Mức** | tích hợp, Postgres thật |
| **Dữ liệu thử** | Đơn 10 món trong một lời gọi `submit_order_changes` |

**Kết quả mong đợi**

- `orders_version` tăng đúng 1, không tăng 10. Đây là ca chứng minh trigger đặt ở mức câu lệnh.

---

### TC-LOAD-17 — Bộ đếm vượt ngưỡng số nguyên lớn

| | |
| --- | --- |
| **Truy vết** | LOAD-01, LOAD-04 |
| **Mức** | đơn vị |
| **Dữ liệu thử** | previous `{orders: 9007199254740991}`; next `{orders: 9007199254740992}` |

**Kết quả mong đợi**

- `diffPulse` vẫn báo có thay đổi. Nếu client đọc `bigint` thành số dấu phẩy động thì hai giá trị trên có thể bằng nhau; ca này buộc phải xử lý bộ đếm dưới dạng chuỗi hoặc `bigint`, và nó ghi lại lý do cho lựa chọn đó.

---

## Nhóm D — Bảo mật và quyền

### TC-LOAD-18 — Tập dòng đọc được không đổi sau khi sửa policy

| | |
| --- | --- |
| **Truy vết** | LOAD-05; NFR-02 |
| **Mức** | tích hợp, Postgres thật |
| **Tiền điều kiện** | Hai cửa hàng `S1` và `S2`, mỗi cửa hàng có dữ liệu trên cả 14 bảng |
| **Dữ liệu thử** | Bộ dữ liệu cố định, dựng lại được |

**Các bước**

1. Trước migration: dưới phiên `S1`, đếm số dòng đọc được trên từng bảng trong 14 bảng, ghi lại.
2. Áp migration lô A.
3. Lặp lại bước 1.
4. So hai bộ số.

**Kết quả mong đợi**

- Hai bộ số **giống nhau tuyệt đối** trên cả 14 bảng.
- Dưới phiên `S1`, số dòng của `S2` đọc được bằng 0 ở cả trước và sau.

---

### TC-LOAD-19 — Cửa hàng không đọc được pulse của cửa hàng khác

| | |
| --- | --- |
| **Truy vết** | LOAD-05 |
| **Mức** | tích hợp, gọi thẳng tầng dữ liệu |
| **Tiền điều kiện** | `S1` và `S2` đều có dòng pulse |
| **Dữ liệu thử** | Phiên đăng nhập của `S1` |

**Các bước**

1. Dưới phiên `S1`, gọi `get_store_pulse()`.
2. Dưới phiên `S1`, truy vấn thẳng `select * from public.store_pulse` không kèm điều kiện.

**Kết quả mong đợi**

- Bước 1 trả đúng bộ đếm của `S1`.
- Bước 2 trả đúng một dòng, là của `S1`. Không có dòng nào của `S2`.

---

### TC-LOAD-20 — Thiết bị không ghi được vào bảng pulse

| | |
| --- | --- |
| **Truy vết** | LOAD-05 |
| **Mức** | tích hợp, gọi thẳng tầng dữ liệu |
| **Dữ liệu thử** | Phiên đăng nhập của `S1` |

**Các bước**

1. Dưới phiên `S1`, thử `update public.store_pulse set orders_version = 999 where store_id = auth.uid()`.
2. Thử `insert` một dòng mới.
3. Thử `delete` dòng của chính mình.

**Kết quả mong đợi**

- Cả ba thao tác đều bị từ chối. Bảng chỉ cấp `select`.

---

### TC-LOAD-21 — RPC đọc gộp vẫn chịu RLS

| | |
| --- | --- |
| **Truy vết** | LOAD-05; NFR-02 |
| **Mức** | tích hợp, gọi thẳng tầng dữ liệu |
| **Tiền điều kiện** | `S2` có một đơn với id đã biết |
| **Dữ liệu thử** | Phiên `S1`; `orderId` thuộc `S2` |

**Các bước**

1. Dưới phiên `S1`, gọi `get_order_detail` với `orderId` của `S2`.
2. Dưới phiên `S1`, gọi `get_floor_plan` và `get_core_report`, so với dữ liệu của `S1`.

**Kết quả mong đợi**

- Bước 1 không trả về dữ liệu của `S2`; kết quả rỗng hoặc lỗi `NOT_FOUND`, không được trả nội dung đơn.
- Bước 2 chỉ trả dữ liệu của `S1`.
- Không hàm nào trong năm RPC đọc gộp được khai báo `security definer`; kiểm bằng truy vấn `pg_proc` và khẳng định `prosecdef = false` cho cả năm.

---

## Đo lường kèm theo

Không phải test case theo nghĩa xanh hay đỏ, nhưng là điều kiện đóng change, theo LOAD-07.

| Số đo | Cách lấy | Ghi vào |
| --- | --- | --- |
| Byte đọc mỗi ngày mỗi quán, trước tối ưu | Kịch bản chuẩn 5 máy, 12 giờ, 150 đơn | `docs/testing.md` |
| Byte đọc mỗi ngày mỗi quán, sau lô A | Cùng kịch bản, cùng project | `docs/testing.md` |
| Byte đọc mỗi ngày mỗi quán, sau lô B | Cùng kịch bản, cùng project | `docs/testing.md` |
| Độ trễ hội tụ giữa hai thiết bị, trước và sau | Thuộc `measure-runtime-load`, dùng lại ở đây để chứng minh không bị chậm đi | `docs/testing.md` |

Ngưỡng đạt chưa chốt; xem câu hỏi 2 trong `proposal.md`.
