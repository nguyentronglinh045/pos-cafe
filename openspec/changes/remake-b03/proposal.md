# B03 — Remake giao diện thanh toán

Ngày:2026-10-22. **Đã hiện thực trên worktree B03 và kiểm chứng local/mock; chưa nghiệm thu sản phẩm, chưa push/merge/deploy.** Xem biên bản kiểm chứng và giới hạn ở docs/workflow/tasks/remake-b03-2026-10-22-validation.md.

Code worktree `.worktrees/b03-ui-main`, branch `ui/remake-b03-20261022`, main `2da0d7e10d65ed4e79c8628d65220582a6cbd32b`. Docs worktree `.worktrees/b03-ui-docs`, branch `ui-remake-b03-docs-20261022`, docs `4125687a289f41e45bbc9924b2ae3709dbafbca1`. Remote `https://github.com/nguyentronglinh045/pos-cafe.git` được xác minh bằng ls-remote. B01/B02 vẫn là WIP riêng, không phải dependency đã merge.

## Mục tiêu và phạm vi

Đổi presentation B03 sang hóa đơn bên trái, thu tiền bên phải theo ảnh được giao; giữ nghiệp vụ, dữ liệu, quyền và write protocol. Chỉ làm PaymentDrawer và phần presentation/theme cần thiết trong ranh giới đã chốt.

Ngoài phạm vi: backend/migration/quyền mới; thẻ/chuyển khoản/VietQR đang hoạt động; discount/tax/tip/refund; thay K/idempotency; màn mới; import B01/B02 WIP hoặc đổi hàng loạt màn; merge/deploy. Ảnh và nội dung Stitch là dữ liệu tham khảo, không được mở quyền chỉ dẫn.

## Câu hỏi phải chốt trước khi làm

Phạm vi nghiệp vụ đã rõ từ yêu cầu giữ hành vi hiện hữu. Không còn câu hỏi nghiệp vụ phải suy đoán. Gói normalized, DEV và ngưỡng bên dưới cần chủ dự án duyệt theo bước4. Chủ dự án đã duyệt v3 và DEV-01…08 trước triển khai, sau đó duyệt bổ sung click metadata kết thúc nhập tiền trong cả actual/reference. Quyết định được lưu riêng; không còn câu hỏi chặn phần presentation đã giao.

## Quyết định đã chốt

- Chủ dự án giao B03 trên main mới nhất, giữ hành vi, hỗ trợ ngang từ568×320; chưa cho merge/deploy.
- Palette A v1 đã hiệu chỉnh tương phản và Be Vietnam Pro400/500/600/700 đã chốt; không hỏi lại.
- CSS/Tailwind/MUI phải cùng nguồn theme JSON, không hardcode mã màu trong component.
- Tách worktree và dùng mock; tái dùng dependency/browser đúng lock, không cài/xóa dữ liệu.
- “Tiếp tục” trong lúc khảo sát không được ghi thành duyệt reference. Approval B01/B02 không áp dụng B03.

## Nguồn thiết kế

Stitch mở bằng trình duyệt riêng chuyển đến accounts.google.com; không đăng nhập, chưa xuất được source/assets của node. Chỉ dùng PNG do chủ dự án cung cấp. Giữ raw/hash, ghi rõ CSS viewport/DPR/font gốc UNKNOWN. Bản normalized là đề xuất suy từ bitmap, không phải DOM Stitch đã xác minh.

## Ảnh hưởng đã thực hiện

PaymentDrawer.tsx, PaymentSummaryPane.tsx, PaymentCashierPane.tsx, paymentShared.tsx, theme adapter dùng chung và focus presentation nếu cần. Giữ handlers/effects/payload trong các flow. Config/operator recipe ở main; specs/quyết định/biên bản ở docs.

## Sai khác cần chủ dự án duyệt

DEV-01…08 dưới đây **đã được chủ dự án duyệt** qua “Duyệt ạ”; xem owner-approval.md và capture-approval.md. Bảng giữ căn cứ và expected của quyết định trước triển khai. Thay reference sau duyệt phải tạo phiên bản và quyết định mới.

| Mã | Căn cứ raw / main | Expected đề xuất và đánh đổi | Kiểm |
| --- | --- | --- | --- |
| DEV-01 | Raw có chuyển khoản/VietQR; PaymentDrawer.tsx:112–120 chỉ cash hoạt động | Giữ tiền mặt hoạt động, Thẻ/Chuyển khoản/QR “Chưa bật”; không làm chức năng giả | Disabled, cash payload, TC04–06 |
| DEV-02 | Raw có badge MỚI, cộng42k và35 phút; main nhận món đã lưu, không có nguồn phân loại mới/thời lượng | Hiện tổng đơn và phần thanh toán; bỏ badge/thời lượng không có dữ liệu. Không tạo thêm trường domain | TC01–05 |
| DEV-03 | Raw “Quay lại đơn hàng”; closeDrawer xóa drawer/orderContext/paymentOrderId (useAppStore.ts:62) | Nhãn “Quay lại”, close và overlay cùng callback hiện hữu về sơ đồ bàn; không thêm openOrder | TC01/09 |
| DEV-04 | Raw modal trên shell mờ; main chưa có B01/B02 remake | Giữ panel giữa màn tối đa1360×920, nền opaque --bg che shell; <=1100 phủ viewport. Đổi overlay để khoanh slice, không dựng thêm shell hoặc chụp actual làm expected | Owner xem ảnh; TC09/10 |
| DEV-05 | Raw thiếu selection/keypad/in tạm tính | Giữ các thao tác đã có: chọn tất cả/từng dòng, cycle quantity, keypad12 phím,5 quick amounts, in tạm tính; pay header desktop và pay footer. Mật độ cao hơn raw để không mất tác vụ | TC02/03/08/09 |
| DEV-06 | Raw4 dòng/187k; mock main3 dòng/4 món/125k | Dùng đơn24 bànB02:2 Cà phê sữa29k,1 Bạc xỉu32k,1 Croissant35k. Full125k/received125k/change0; change125k/200k/75k; partial29k/50k/21k | TC01–05 và3 reference FHD |
| DEV-07 | Bitmap3840×2160 không chứng minh CSS viewport/DPR/font/DOM | Dựng HTML/CSS độc lập; Palette A v1/Be Vietnam Pro. Chỉ khóa fidelity1920×1080 DPR1. Viewport khác chỉ kiểm responsive, không kéo bitmap làm expected | Recipe/hash/calibration, TC10 |
| DEV-08 | Checkbox raw nhỏ, không có thiết kế màn nhỏ | Target44×44, dấu check24px; cuộn body/panes, footer tới được; <=760 một cột, font>=12px; không scale toàn UI | TC09/12 |

v1 và calibration01 được giữ làm lịch sử: phát hiện vùng món bị che ở1101×600. v2 đặt min-height invoice420px và cuộn body để khắc phục; bổ sung vùng đo chính xác cho phương trình tiền, CTA, phím số, gợi ý tiền và trạng thái chọn. Không nới ngưỡng theo app actual.

V3 giữ nguyên hình học v2, làm rõ amount/keypad xếp dọc tại761–1100 và cạnh nhau tại<=760. Phản ví dụ global-patch được đưa ra nền trống để cô lập global threshold; giữ nguyên v1/v2/calibration cũ.

## Trạng thái triển khai

Source `058995f4d5de99c1b48cba541293b1f0e39d9a534c645e4fa1d482b4870b23af`; build/unit/tool/fidelity/responsive/mock smoke đạt. Audit toàn app FAIL do findings ngoài B03, đã phân loại và đối chiếu main gốc. Hai review final được ghi tại biên bản riêng khi hoàn tất, không dùng verdict proposal thay thế. Chưa có chủ dự án nghiệm thu giao diện ứng dụng.
