# Tiếp nhận B03 — Thanh toán

Ngày: 2026-10-22. **Đề xuất, chờ duyệt trước triển khai.** Chưa sửa giao diện ứng dụng.

Code worktree `.worktrees/b03-ui-main`, branch `ui/remake-b03-20261022`, main `2da0d7e10d65ed4e79c8628d65220582a6cbd32b`. Docs worktree `.worktrees/b03-ui-docs`, branch `ui-remake-b03-docs-20261022`, docs `4125687a289f41e45bbc9924b2ae3709dbafbca1`. Remote `https://github.com/nguyentronglinh045/pos-cafe.git` được xác minh bằng ls-remote. B01/B02 vẫn là WIP riêng, không phải dependency đã merge.

## Nguồn và ủy quyền

Yêu cầu owner trong conversation ngày2026-10-22, bước4 bắt buộc duyệt reference trước implementation. Stitch: https://stitch.withgoogle.com/projects/15598521297295649761?node-id=9ea864f874bc4789834b6eec7670225f. PNG: UI-Design-Google-Stitch-Week01/Tran Thi Lam/B03_thanh_toan_don_hang.png. Raw SHA256:9318af8ff7f3f703d8e229a4e4bacb98ff4ece21f0dea46f6f949ebd80779317,3840×2160,387688bytes. CSS viewport/DPR/font gốc chưa xác minh. Trình duyệt Stitch chuyển đến trang đăng nhập, không lấy được source.

## Ánh xạ trạng thái và thao tác

| State/action | Cách tới / selector | Actor/quyền | Fixture và nguồn |
| --- | --- | --- | --- |
| Full cash | Pair→admin123456→nav-floor→table-a254…→submit-order-button-footer→payment-drawer | admin/cashier, payment.take | Đơn24/B02; PaymentDrawer.tsx:43–120 |
| Partial/none/cycle/refetch | pay-select-all,pay-item-checkbox,pay-item-plus | Handler blocked guard + flow payment.take | Due29k/58k/0; Drawer:153–181; orderFlow:297–396 |
| Received/change/insufficient | payment-received-amount,payment-key-*,quick buttons | Chỉ cash active | 125k/200k→75k; Drawer:122–141 |
| Missing/loading/error/retry | payment-loading-state/payment-error-state, Thử tải lại | Store-scoped query | Drawer:228–278; query fixture |
| Empty/paid/void | payment-order-items/payment-closed-state | Closed khóa pay | Summary:98–104,180–206 |
| Denied/pending/offline/unknown | pay-button/pay-button-footer/write-attempt-notice | payment.take; online và attempt guard | Drawer:83–96; useWriteAttempt:6–17; WriteAttemptNotice:11–37 |
| Full/split success/conflict | pay-button-footer→mutation | Actor/session/version hiện hữu | Drawer:184–224; orderFlow:351–396 |
| Provisional/receipt | print-provisional-button,print-receipt-checkbox,receiptPreview | Print port và initialSuccess hiện hữu | Drawer:143–146,197–215; Summary:228–249 |
| Close/overlay | payment-close-button,onOutsideClick | closeDrawer hiện hữu | useAppStore.ts:62; không tự reopen đơn |

## Trạng thái bàn giao trước duyệt

Ứng dụng main chưa thay đổi. Baseline screenshots ở artifacts/ui-remake/b03-preflight là chẩn đoán, không phải expected. Chỉ có independent reference, hợp đồng đo đề xuất và hồ sơ docs mới. Phép thử email Supabase trước đó chưa Authorize hoặc có kết quả; không nằm trong B03, không đọc hộp thư trong task này.
