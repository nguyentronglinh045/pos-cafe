# Thiết kế kỹ thuật B03

Ngày:2026-10-22. **Đã hiện thực trên worktree B03 và kiểm chứng local/mock; chưa nghiệm thu sản phẩm, chưa push/merge/deploy.** Xem biên bản kiểm chứng và giới hạn ở docs/workflow/tasks/remake-b03-2026-10-22-validation.md.

Code worktree `.worktrees/b03-ui-main`, branch `ui/remake-b03-20261022`, main `2da0d7e10d65ed4e79c8628d65220582a6cbd32b`. Docs worktree `.worktrees/b03-ui-docs`, branch `ui-remake-b03-docs-20261022`, docs `4125687a289f41e45bbc9924b2ae3709dbafbca1`. Remote `https://github.com/nguyentronglinh045/pos-cafe.git` được xác minh bằng ls-remote. B01/B02 vẫn là WIP riêng, không phải dependency đã merge.

## Hợp đồng baseline đã đọc từ main2da0d7e

Số dòng trong bảng này thuộc baseline, không phải source sau remake.

| Nguồn file:dòng | Hợp đồng giữ nguyên |
| --- | --- |
| src/app/drawers/pos/PaymentDrawer.tsx:43–73 | Query detail, frozen confirmedOrder, stamp và clamp selection, reset received theo due |
| PaymentDrawer.tsx:75–109 | amount/insufficient/closed/nothing-selected/permission/blocked/pending, nhãn full/split |
| PaymentDrawer.tsx:112–181 | Chỉ cash hoạt động, input/keypad9 chữ số, quick set, selection và cycle quantity |
| PaymentDrawer.tsx:184–224 | Payload/lifetime guard, receipt initialSuccess, full close/split clear/refetch, error reload |
| PaymentDrawer.tsx:228–318 | Missing/loading/error/retry và props truyền xuống panes |
| PaymentSummaryPane.tsx:86–167 | Select all/từng dòng, disabled khi closed, unitTotal và nút quantity |
| PaymentSummaryPane.tsx:173–267 | Closed/reload, summary, print checkbox, provisional, footer pay |
| paymentShared.tsx:110–116 | Quick options dùng total=amountDue, không dùng received |
| src/features/pos/orderFlow.ts:297–329,351–396 | unitTotal gồm tùy chọn; validation, payment.take và protocol full/split |
| src/features/pos/useWriteAttempt.ts:6–17 | Blocked khi offline hoặc attempt chưa settled, không auto replay |
| src/app/drawers/pos/WriteAttemptNotice.tsx:11–37 | Retry cùng lệnh/tra cứu, message online/unknown |
| src/app/useAppStore.ts:62–67 | closeDrawer→null, openPayment không tạo callback trở về đơn, receipt preview riêng |
| src/core/guards.ts:59–83 | Role/overrides và FORBIDDEN ở flow |
| src/core/writeErrors.ts:4–28; src/app/appErrors.ts:6–20 | Mã/message và notifyUiError hiện hữu |

## Kiến trúc presentation đã hiện thực

Đổi JSX/class của drawer/panes theo reference; giữ nguyên các hàm xử lý, effects, giá, selection, domain/features/adapters và mutation payload. Có thể tách JSX summary/print/footer để đặt vị trí, không tạo state nghiệp vụ thứ hai. Class/overlay scope B03, không đổi layout mọi drawer.

Theme adapter dùng trực tiếp ui-remake/palette-a-v1.json để dẫn CSS variables, Tailwind và MUI. Nếu tái dùng adapter đã review ở B02, chỉ lấy phần theme cần thiết và review delta; không nhập OrderDrawer B02. Palette đóng băng trong reference phục vụ expected/provenance, không thành nguồn theme riêng của app. Test thay token qua factory phải chứng minh đổi đồng bộ.

Focus/Tab/Escape chỉ hỗ trợ tương tác trong dialog hiện tại, giữ callback close và nhường receipt popup trên cùng. Không có schema/domain/AppErrorCode mới. Ticket/receipt giữ payload và immutable snapshot hiện hữu.

## Lựa chọn và đánh đổi

Giữ panel giữa màn như raw ở desktop; nền opaque tránh đưa shell B01/B02 chưa merge vào phạm vi. Không chọn chụp actual background làm expected vì mất tính độc lập. Màn nhỏ cuộn/tách cột thay scale toàn UI để giữ44px và chữ đọc được. Giữ các control nghiệp vụ dù raw thiếu; không sáng tác dữ liệu thời lượng hoặc MỚI.

## Hợp đồng đo đã duyệt

Normalized v3, config ui-remake/tasks/b03/measurement.json; referenceApproval được ghi theo hai quyết định owner, giữ initial-approved và proposed làm lịch sử. Fidelity chỉ3 trạng thái1920×1080. Geometry2 CSSpx; channel threshold16; global diff<=0,015; critical regions0pixel khác sau channel threshold. Font/style/token so chính xác; min target44px. Regions bảo vệ tiền, phương trình tiền, CTA, nhãn keypad/quick, selected count và checked state. Supplemental interaction assertions vẫn bắt buộc sau triển khai.

Calibration được lập trước actual bằng repeat và phản ví dụ; không chọn ngưỡng để actual đạt. Source/config/font/palette/environment phải được khóa và kiểm trước/sau. Snapshot đủ tracked modified và untracked/new tests. App build/unit/smoke/fidelity/responsive/audit chỉ chạy sau duyệt; không ghép PASS khác candidate.

## Ngân sách

Workspace đầu task1.413.945.400bytes, bỏ qua junction; C trống52.474.654.720bytes; không có D. Ước tính tăng đỉnh350MiB, evidence250MiB; trần pilot1GiB/0,5GiB và giữ>=30GiB trống. Reuse Node24.22.0, Playwright 1.60.0, full Chromium148.0.7778.96, lock FA532F1203F4074FA1A4400F830458E465BA32E13AD39CC44291AE1505A7CC08. Không install/download/cleanup. Giữ base-main.tar, WIP và demo B01/B02; đo lại checkpoint.

## Delta presentation và dẫn nguồn candidate

- `src/app/drawers/pos/PaymentDrawer.tsx:23`: provider, focus và VisualViewport; phần tính tiền/selection/handlers/effects và payload được giữ, chỉ thêm nhãn UI presentation khi mở preview tại125/188.
- `src/app/components/ReceiptPreview.tsx:260`: bọc theme có điều kiện cho preview mở từ màn remake; ReceiptPreviewContent giữ luồng getReceipt/revalidate/browserprint.
- `src/theme/remakeTheme.ts:7`: CSSvars/Tailwind/MUI dẫn từ palette JSON. `RemakeThemeProvider.tsx:7` đếm scope còn mở, giữ theme khi full-pay đóng drawer nhưng receipt còn.
- `src/app/components/useDialogFocus.ts:4`: pause theo enabledref, giữ triggerfocus khi popup chồng; kiểm trigger còn hiển thị/enable/connected trước restore. Không đổi callback nghiệp vụ.
- `src/app/drawers/pos/usePaymentViewport.ts:4`: theo visualViewport, cleanup resize/scroll; CSS container queries theo vùng hiển thị760/1100/480, giữ geometry desktop và cho phép cuộn.
- `tests/ui-remake/b03/payment.spec.ts:133,239,259,290,307`: popup/focus, receipt sau unmount, VisualViewport mô phỏng, theme propagation và CSS zoom200%. Browser zoom thực chưa chạy.

Không có schema/domain/financial RPC thay đổi; UI union trong useAppStore thêm presentation optional, không vào mutation payload. B03 dựa main sạch, không nhập màn B01/B02 WIP. Thay theme factory/canonical JSON áp dụng đồng bộ các màn sử dụng adapter; reference đã duyệt vẫn cố định phục vụ đo.
