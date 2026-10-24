# Yêu cầu B03

Ngày:2026-10-22. **Đã hiện thực trên worktree B03 và kiểm chứng local/mock; chưa nghiệm thu sản phẩm, chưa push/merge/deploy.** Xem biên bản kiểm chứng và giới hạn ở docs/workflow/tasks/remake-b03-2026-10-22-validation.md.

## ADDED Requirements

### Requirement: R01 — Giữ nghiệp vụ và ranh giới

Hệ thống SHALL giữ OrderDetail, PayableLine, mutation, payment.take, expectedVersion và write protocol v1. MUST NOT thêm phương thức thanh toán đang hoạt động, financial DML, RPC, migration hoặc sửa seed để khớp ảnh. Đơn giá dùng unitTotal đã gồm priceDelta × quantity của tùy chọn.

#### Scenario: Món có phụ thu

- **WHEN** xảy ra tình huống trên.
- **THEN** Base29.000đ cộng option7.000đ ×2 có unitTotal43.000đ; chọn một đơn vị phải trả43.000đ. Thiếu payment.take phải bị từ chối ở cả UI và flow.

### Requirement: R02 — Bố cục và nguồn tham chiếu

UI SHALL bám bản normalized độc lập đã được duyệt, bao gồm các DEV trong proposal. Raw phải giữ nguyên hash. MUST NOT dùng ảnh actual làm expected hoặc tự ghi referenceApproval.

#### Scenario: Chưa có duyệt reference

- **WHEN** xảy ra tình huống trên.
- **THEN** Không triển khai ứng dụng; config giữ referenceApproval=null. Chỉ trình bản tham chiếu và ngưỡng.

### Requirement: R03 — Chọn phần thanh toán

UI SHALL giữ chọn tất cả, chọn từng dòng và nút tăng theo chu kỳ1…max→1. Refetch cùng đơn chỉ clamp lựa chọn, không biến lựa chọn rỗng thành chọn tất cả. Đơn khác khởi tạo chọn tất cả. Khi amountDue đổi, received được reset về amountDue như hiện tại.

#### Scenario: Chọn cà phê trong đơn24

- **WHEN** xảy ra tình huống trên.
- **THEN** Bỏ tất cả→0đ; chọn cà phê→1/2 và29.000đ; nhấn+→2/2 và58.000đ; nhấn+→1/2 và29.000đ.

### Requirement: R04 — Nhập tiền mặt

UI SHALL giữ direct input/keypad chỉ nhận chữ số và cắt tối đa9 chữ số; delete xóa một chữ số, có phím00. Quick Đúng tiền=due; +20k=due+20.000; +50k=due+50.000; 200k/500k cố định. Thiếu tiền khóa thanh toán.

#### Scenario: Đơn125.000đ, khách đưa200.000đ

- **WHEN** xảy ra tình huống trên.
- **THEN** Trả lại75.000đ; nhấn+20k phải đặt145.000đ. Nhập124.999đ hiển thị thiếu1đ và không ghi lệnh.

### Requirement: R05 — Trạng thái và kết quả

UI SHALL giữ missing/loading/error/retry/empty/closed/insufficient/nothing-selected/permission-denied/pending/offline/unknown. Full success đóng drawer; split success giữ drawer, xóa selection, refetch đơn nguồn. Giữ confirmedOrder, lifetime guard, K/payload và initialSuccess.

#### Scenario: Trả một cà phê29.000đ

- **WHEN** xảy ra tình huống trên.
- **THEN** Đơn trả29.000đ; đơn nguồn còn96.000đ; selection={} và due0. Không tự tạo ý định thanh toán phần còn lại.

### Requirement: R06 — In và popup

UI SHALL giữ checkbox in mặc định true, ticketFromOrderDetail cho tạm tính, receipt trả về từ mutation khi initialSuccess. Không thêm in lại/refund/native printing. Popup phải nằm trên drawer và focus trở lại hợp lệ khi đóng.

#### Scenario: Xem tạm tính

- **WHEN** xảy ra tình huống trên.
- **THEN** Mở ticket preview không gọi register/execute. Retry kết quả terminal không tự in thêm receipt.

### Requirement: R07 — Responsive và khả năng thao tác

UI SHALL dùng được ở mọi viewport ngang width>=568,height>=320,width>height. Controls hoạt động >=44×44 CSSpx, font>=12px, document overflow<=1px; tiền/nhãn/CTA không bị che. Giữ scroll, touch và keyboard theo responsive contract.

#### Scenario: 568×320 và1101×600

- **WHEN** xảy ra tình huống trên.
- **THEN** Cuộn tới mọi control, amount và keypad; CTA/close tới được, không có center hit bị chặn. Không scale toàn UI làm chữ/nút nhỏ đi.

### Requirement: R08 — Theme chung

CSS variables, Tailwind và MUI SHALL dẫn xuất từ ui-remake/palette-a-v1.json. Dùng Be Vietnam Pro cục bộ400/500/600/700. MUST NOT hardcode mã màu trong component hoặc tạo palette ứng dụng riêng B03.

#### Scenario: Thay token nguồn chung

- **WHEN** xảy ra tình huống trên.
- **THEN** Các control CSS/Tailwind/MUI đổi đồng bộ mà không sửa từng màn. Mọi anchor phải dùng Be Vietnam Pro đã tải.

### Requirement: R09 — Bằng chứng và gate

Change SHALL ghi riêng fidelity/responsive/build/unit/smoke/audit/review và owner acceptance, source trước/sau và snapshot phục hồi. MUST NOT nới ngưỡng theo actual, cập nhật baseline, merge hoặc deploy. Code/operator guide ở main; spec/biên bản ở docs.

#### Scenario: Audit phát hiện lỗi

- **WHEN** xảy ra tình huống trên.
- **THEN** Đọc report và ảnh annotated, phân loại từng finding. Lỗi ngoài slice được báo riêng, không tự sửa.
