# Demo Runbook

> Cập nhật điều hướng 25/10/2026: Runbook thao tác được giữ để chuẩn bị demo. Với main711a22e, chọn role theo catalog; owner mới phải đổi PIN tạm trước POS. Chỉ chạy trên môi trường/fixture được giao; tạo quán/seed/thu tiền có ghi dữ liệu. Kết quả chạy cũ không chứng minh source mới; xem [testing](testing.md).


Runbook này dùng để chuẩn bị demo/bảo vệ phase tiểu luận.

## Flow Demo Chính

1. Mở app ở landscape.
2. Nếu chưa paired, tạo store mới hoặc ghép Store Key.
3. Vào passcode, chọn nhân viên có quyền cần cho demo và nhập PIN.
4. Ở floor view, chọn khu/tầng, mở một bàn trống.
5. Tạo order dine-in: chọn món, option/topping, chỉnh số lượng/ghi chú, gửi đơn.
6. Quay lại floor, thấy bàn chuyển sang đang phục vụ.
7. Mở lại order, chuyển sang payment.
8. **Demo instant pay (điểm nhấn):** bỏ `Chọn tất cả`, tick 1-2 món (chỉnh số lượng bằng nút `+`), hoàn tất → preview bill riêng mở khi có initial grant và bật checkbox in (kế thừa số đơn gốc), đơn gốc còn lại trên bàn với số mới; mở report thấy doanh thu vào NGAY.
9. Chủ động chọn phần còn lại sau split (selection lúc này rỗng), rồi nhập tiền khách đưa, kiểm tra trạng thái thiếu/đủ tiền, hoàn tất thanh toán.
10. Xem receipt preview, quay lại floor thấy bàn trống.
11. Mở report/history: 2 đơn độc lập từ cùng một bàn, số đơn tăng theo thứ tự thanh toán.
12. **Demo hủy đơn đã thanh toán:** đăng nhập nhân viên có `orderHistory.view` và `order.voidPaid` (owner/manager theo defaults catalog), chọn một đơn paid trong Lịch sử, bấm `Hủy đơn`, chọn lý do (nếu chọn `Lý do khác` phải nhập ghi chú), xác nhận badge `Đã hủy`, người/thời điểm/lý do hủy và nút in lại bị khóa.
13. Mở Report: xác nhận đơn vừa hủy bị loại khỏi doanh thu/số đơn paid, đồng thời `Đơn đã huỷ` và `Tiền hủy` tăng đúng để đối soát.
14. **Demo phân quyền per-employee:** dùng owner hoặc actor có `employee.permission.edit` mở Nhân viên, chọn đúng nhân viên fixture thu ngân, bỏ quyền `payment.take` và lưu. Ở phiên nhân viên đích, chờ authority được xác minh theo lifecycle rồi kiểm vẫn tạo/sửa đơn nhưng không thực hiện được thanh toán. Khôi phục quyền bằng actor có quyền sửa trong fixture nếu kịch bản yêu cầu; không sửa quyền cửa hàng thật để demo.
15. Demo quản trị với quyền tương ứng: `menu.manage`, `floor.manage`, `settings.manage`.
16. Owner có `data.clearDemo` demo clear dữ liệu mẫu khi không còn order mở; nếu còn order mở thì giải thích trạng thái blocked.

## Checklist Trước Demo

- Supabase project còn active, không bị pause.
- App build/deploy mới nhất mở được.
- Fixture demo có nhân viên/quyền, menu/modifier, bàn/khu và decor cần cho kịch bản; ghi fixture/source, không suy số lượng từ seed phase cũ.
- Có ít nhất một order thanh toán thành công để report/history không trống nếu cần.
- Chuẩn bị actor có `orderHistory.view` + `order.voidPaid` để demo hủy; actor `employee.permission.edit` để chỉnh quyền; `report.view` để kiểm báo cáo.
- Demo backend mới chỉ sau khi có môi trường được giao và gate activation/acceptance thích hợp. Không dùng migration012 như recipe runtime711a22e; giữ HOLD của [testing](testing.md).
- Kiểm projection sơ đồ/nền bàn trên đúng fixture/backend; không tự apply migration từ checklist demo.
- Màn hình trình chiếu ở landscape, đủ rộng.
- Chuẩn bị 4G/hotspot vì phase này online-only.
- Kitchen không còn entry point trong UI hiện hành. Nếu được hỏi, giải thích enum/schema/component scaffold được giữ cho tương lai nhưng queue backend và role vận hành chưa triển khai. Payment Settings/QR vẫn là preview optional.

## Kiểm Chứng Trên Supabase — lịch sử phase 15–20

- **Realtime cross-device (phase 15): ĐÃ kiểm chứng** qua `npm run smoke:supabase` (phase 18): 2 browser cùng store thật, máy A tạo đơn → máy B thấy bàn đang phục vụ ≤30s; máy B thanh toán → máy A thấy bàn trống. Phần self-heal khi ngắt/nối mạng vẫn chỉ kiểm được thủ công (ngắt mạng máy B rồi nối lại → sau `SUBSCRIBED` phải tự resync ngay). Xem [implementation-log/phase-15-realtime-hardening.md](implementation-log/phase-15-realtime-hardening.md).
- **Instant pay tách đơn (phase 18): ĐÃ kiểm chứng** qua E2E trên cloud đã áp migration 009+010 (tách dòng, số bill theo thứ tự trả, lịch sử 2 đơn độc lập).
- **Hủy đơn đã thanh toán (phase 19): ĐÃ kiểm chứng** trên cloud đã áp migration 011: admin tạo/thanh toán/hủy đơn qua UI, popup đóng, audit hiện và badge chuyển `Đã hủy`; fix refetch `lock_version` trước khi gọi RPC đã chạy ổn định. Ngày 2026-07-19 chạy lại targeted E2E 1/1 pass.
- **Phân quyền per-employee (phase 20): ĐÃ kiểm chứng cloud** sau khi áp migration 012. E2E admin deny `payment.take` → cashier đăng nhập lại vẫn tạo đơn được, UI khóa thanh toán; gọi thẳng payment RPC trả `FORBIDDEN`. Full `smoke:supabase` 5/5 pass ngày 2026-07-19.
- **Baseline theo nguồn:** xem [testing.md](testing.md). Không gộp 260 local tests với 5 cloud E2E thành một con số.

## Luận Điểm Nên Nói Khi Bảo Vệ

- Scope tiểu luận tập trung vào POS cafe nhỏ, không cố làm ERP/chuỗi/quản lý kho.
- Backend dùng Supabase/Postgres để có dữ liệu quan hệ, RPC transaction và realtime nhanh.
- Order/payment dùng RPC để đảm bảo consistency giữa order, payment và table status.
- Realtime được dùng để invalidate/refetch, giảm rủi ro patch cache thủ công.
- Ports/adapters giúp app không khóa cứng vào Supabase và dễ test/mock.
- Offline-first, native printer, QR payment thật và kitchen queue thật là mở rộng sau, đã có seam trong schema/architecture.
- Store Auth cô lập tenant; runtime có employee session/projections theo quyền. Backend acceptance mới chưa đóng, không nhận demo mock là chứng minh quyền DB hoàn chỉnh.

## Rủi Ro Demo & Cách Xử Lý

- **Report trống:** trên fixture/môi trường demo được giao, tạo và thanh toán đơn mẫu trước khi mở report; không dùng giao dịch cửa hàng thật để tạo số liệu.
- **Report về 0 sau hủy:** đây là behavior đúng nếu đơn paid duy nhất vừa bị hủy; kiểm tra thêm `Đơn đã huỷ`/`Tiền hủy` ở rail trái.
- **Không thấy nút Hủy đơn:** kiểm tra đang chọn đơn `Đã thanh toán` và nhân viên hiện tại có quyền `order.voidPaid` (theo catalog/overrides).
- **Quyền vừa sửa nhưng UI chưa đổi:** runtime mới xác minh revision/authority qua lifecycle; kiểm trạng thái unavailable, signal/refetch và đúng source/backend. Không phục hồi legacy grants hoặc dùng recipe migration012 để sửa một candidate mới. Xem [architecture](architecture.md#permission).
- **Mất mạng:** dùng hotspot; nói rõ online-only là tradeoff phase này.
- **Supabase pause:** wake project trước demo.
- **Clear demo bị blocked:** đây là behavior đúng vì còn order mở; đóng/thanh toán order trước.
- **UI overlay/drawer:** drawer đã có portal overlay, click outside để đóng và slide-in khi mở; exit animation là polish optional/backlog.
- **Vercel hiện dữ liệu mẫu dù không tạo store cloud:** kiểm tra đủ `VITE_DATA_MODE=supabase`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`; không ép mode và thiếu URL/key sẽ chọn mock; explicit Supabase mode không tự fallback khi cấu hình sai.
