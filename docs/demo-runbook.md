# Demo Runbook

> Cập nhật 09/11/2026: viết lại bước 1–11 theo 20 góp ý cách viết của Lâm (HD-01…HD-20) và câu trả lời ngày 08/11/2026 ([hồ sơ](workflow/tasks/team-week05-answers-2026-11-08.md)). Tên nút và tên màn lấy đúng chữ trên app ở main `f2b486e`. Các bước viết lại theo kết quả Lâm chạy thử trên bản demo dữ liệu giả ngày 06/11/2026, khi mã `src/` giống main hiện tại; bản viết lại này chưa được chạy lại nguyên văn. Ảnh minh họa thêm sau khi sửa giao diện ([CX-06](workflow/tasks/team-week05-answers-2026-11-08.md#việc-chưa-xử-lý)). Ghi chú cho người chuẩn bị môi trường nằm ở mục [Ghi Chú Kỹ Thuật](#ghi-chú-kỹ-thuật).

Runbook này dùng để chuẩn bị demo/bảo vệ phase tiểu luận.

## Flow Demo Chính

1. Mở app ở chế độ màn hình ngang.
2. Nếu máy chưa kết nối với quán: chọn **Đã có quán**, nhập Store Key do người phụ trách demo cung cấp, rồi bấm **Ghép thiết bị**. Muốn tạo quán mới thì chọn **Tạo quán mới**.
3. Ở màn chọn nhân viên, chọn **Chủ quán** để có đủ quyền cho các bước dưới, nhập PIN do người phụ trách demo cung cấp, rồi bấm **Mở khoá**. Bước 11 cần quyền xem Báo cáo: Chủ quán và Quản lý có, Thu ngân không có.
4. Ở **Sơ đồ bàn**, bấm tên khu ở dải trên (ví dụ **Tầng trệt**), rồi bấm một bàn đang trống (ví dụ **B01**). Màn **Gọi món** của bàn đó mở ra. Có thể bấm **Trống** để chỉ hiện bàn trống; nếu dùng bộ lọc này, xem lưu ý ở bước 6.
5. Gọi món:
   1. Chọn danh mục ở cột trái, ví dụ **Cà phê** hoặc **Trà & trà sữa**. Không thấy món thì gõ tên vào ô **Tìm món**. Bấm **+ Thêm** trên thẻ món.
   2. Món ghi **Có tùy chọn** sẽ mở cửa sổ để chọn size, lượng đá hoặc topping; chọn xong bấm **Thêm vào đơn**. Món không có tùy chọn vào **Giỏ hàng** ngay.
   3. Trong **Giỏ hàng** bên phải, bấm **+** hoặc **−** để tăng giảm số lượng. Khách có yêu cầu riêng thì bấm **Ghi chú** và gõ nội dung, ví dụ "ít ngọt"; không cần bấm lưu.
   4. Kiểm tra lại các món rồi bấm **In/Gửi đơn**. Cửa sổ **Phiếu gửi bếp** hiện ra; bấm **Đóng** để tiếp tục, hoặc **In** nếu cần in phiếu.
6. App tự quay về **Sơ đồ bàn**. Nếu đang lọc **Trống**, bấm **Tất cả** để thấy lại bàn vừa gọi, vì hiện bộ lọc ẩn các bàn không khớp ([CX-01](workflow/tasks/team-week05-answers-2026-11-08.md#việc-chưa-xử-lý) sẽ đổi thành làm sáng bàn khớp). Kiểm tra bàn vừa gọi đã chuyển sang đang phục vụ, ghi tổng tiền (ví dụ **B01 145K**) và có trong danh sách **Đơn đang mở** bên phải.
7. Bấm lại bàn đó, hoặc bấm **Mở đơn hàng** ở danh sách **Đơn đang mở**, rồi bấm **Thanh toán**. Màn **Thanh toán đơn hàng** mở ra, đã chọn sẵn toàn bộ món.
8. **Thanh toán một phần món (tách đơn), điểm nhấn của demo:** khách trả trước một số món, các món còn lại vẫn giữ trên bàn.
   1. Bỏ chọn **Chọn tất cả**, rồi đánh dấu những món khách muốn trả.
   2. Món có số lượng từ 2 trở lên hiện số đã chọn trên số trong đơn, ví dụ **1/2**. Bấm **+** để chọn thêm; khi đã chọn đủ, bấm tiếp sẽ quay về 1.
   3. Ô **Tiền khách đưa** đã điền sẵn đúng số cần trả. Kiểm tra rồi bấm **Thanh toán món đã chọn (…)**.
   4. Nếu ô **In hóa đơn sau khi thanh toán** đang bật, cửa sổ **Hoá đơn thanh toán** hiện ra cho phần vừa trả, mang số đơn cũ (ví dụ **#27**); bấm **Đóng**. Nếu ô này tắt thì không hiện hóa đơn.
   5. Màn thanh toán vẫn mở cho phần còn lại. Phần này đã thành một đơn mới mang số mới (ví dụ **#28**), chưa món nào được chọn.

   Chưa mở Báo cáo ở bước này: khi màn thanh toán đang mở thì không bấm được **Báo cáo**. Xem ở bước 11.
9. Trả phần còn lại, vẫn ở màn thanh toán:
   1. Bấm **Chọn tất cả** để chọn các món còn lại. Nếu đã rời màn thanh toán rồi mở lại, **Chọn tất cả** đã bật sẵn; kiểm tra lại trước khi trả.
   2. Ô **Tiền khách đưa** đã điền sẵn đúng số phải trả. Muốn nhập số khác: bấm vào ô và gõ trực tiếp; hoặc bấm nút ⌫ ở hàng cuối bàn phím số để xóa rồi bấm số (ở màn 1366×768 có thể phải cuộn mới thấy nút này, màn 1920×1080 thấy ngay); hoặc dùng các nút nhanh **Đúng tiền**, **+20k**, **+50k**, **200k**, **500k**. Hiện khi đang thiếu tiền, hàng nút nhanh bị thay bằng dòng "Còn thiếu…" ([CX-02](workflow/tasks/team-week05-answers-2026-11-08.md#việc-chưa-xử-lý) sẽ sửa).
   3. Nhập thiếu tiền thì app báo số tiền còn thiếu và không cho hoàn tất. Nhập đủ hoặc dư thì app cho thanh toán và hiện **Tiền trả lại khách** nếu có.
   4. Bấm **Hoàn tất thanh toán (…)**.
10. Nếu ô **In hóa đơn sau khi thanh toán** đang bật, cửa sổ **Hoá đơn thanh toán** hiện ra; bấm **Đóng**. Nếu ô này tắt, màn thanh toán đóng ngay. App tự quay về **Sơ đồ bàn**; kiểm tra bàn vừa thanh toán đã trở lại trống và không còn trong **Đơn đang mở**.
11. Kiểm tra kết quả bằng vai có quyền xem Lịch sử đơn và Báo cáo, ví dụ Chủ quán:
    1. Mở **Lịch sử đơn**: thấy 2 đơn độc lập của cùng một bàn, đều **Đã thanh toán** (ví dụ 70.000đ và 75.000đ). Hóa đơn in số đơn theo thứ tự thanh toán (ví dụ #27, #28), còn Lịch sử hiện ghi số thứ tự dòng (ví dụ #2, #3), nên đối chiếu theo bàn, số tiền và giờ thanh toán. Khi làm xong [CX-04](workflow/tasks/team-week05-answers-2026-11-08.md#việc-chưa-xử-lý), Lịch sử sẽ hiện đúng số trên hóa đơn, chia nhóm theo ngày.
    2. Mở **Báo cáo**: doanh thu hôm nay tăng đúng tổng hai lần trả. Hàng **Món bán chạy** hiện ghi doanh thu cả ngày chứ không phải doanh thu của món; [CX-05](workflow/tasks/team-week05-answers-2026-11-08.md#việc-chưa-xử-lý) sẽ sửa.
12. **Demo hủy đơn đã thanh toán:** đăng nhập nhân viên có `orderHistory.view` và `order.voidPaid` (owner/manager theo defaults catalog), chọn một đơn paid trong Lịch sử, bấm `Hủy đơn`, chọn lý do (nếu chọn `Lý do khác` phải nhập ghi chú), xác nhận badge `Đã hủy`, người/thời điểm/lý do hủy và nút in lại bị khóa.
13. Mở Report: xác nhận đơn vừa hủy bị loại khỏi doanh thu/số đơn paid, đồng thời `Đơn đã huỷ` và `Tiền hủy` tăng đúng để đối soát.
14. **Demo phân quyền per-employee:** dùng owner hoặc actor có `employee.permission.edit` mở Nhân viên, chọn đúng nhân viên fixture thu ngân, bỏ quyền `payment.take` và lưu. Ở phiên nhân viên đích, chờ authority được xác minh theo lifecycle rồi kiểm vẫn tạo/sửa đơn nhưng không thực hiện được thanh toán. Khôi phục quyền bằng actor có quyền sửa trong fixture nếu kịch bản yêu cầu; không sửa quyền cửa hàng thật để demo.
15. Demo quản trị với quyền tương ứng: `menu.manage`, `floor.manage`, `settings.manage`.
16. Owner có `data.clearDemo` demo clear dữ liệu mẫu khi không còn order mở; nếu còn order mở thì giải thích trạng thái blocked.

## Ghi Chú Kỹ Thuật

- Các hành vi ghi ở bước 1–11 đã thấy khi Lâm chạy thử bản demo dữ liệu giả (`VITE_DATA_MODE=mock`) ngày 06/11/2026, màn 1366×768 và 1920×1080; bản viết lại chưa được chạy lại nguyên văn. Chưa kiểm với backend thật, chưa in vật lý, chưa thử nhánh **Tạo quán mới** và nút **In**.
- Chọn vai theo catalog quyền; chủ quán mới phải đổi PIN tạm trước khi vào POS.
- Chỉ chạy trên môi trường hoặc fixture được giao; tạo quán, seed và thu tiền đều ghi dữ liệu.
- Kết quả chạy cũ không chứng minh source mới; xem [testing](testing.md).

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
