# Remake B03 thanh toan theo reference da duyet

**Base:** main. **Head:** ui/remake-b03-20261022. **Repo:** https://github.com/nguyentronglinh045/pos-cafe.

Màn thanh toán dùng bố cục hóa đơn bên trái, thu tiền bên phải theo normalized reference v3. Giữ tính tiền có phụ thu, chọn món/số lượng, thanh toán toàn bộ/một phần, phân quyền và write protocol. Dùng chung Palette A JSON cho CSS/Tailwind/MUI và Be Vietnam Pro; hỗ trợ màn hình ngang từ568×320, cuộn, bàn phím và popup hóa đơn sau khi drawer đóng. B01/B02 WIP không được nhập vào thay đổi này.

**Validation:** TypeScript/Vite build;643 unit/component,79 tool tests,11 runner selftest,29 calibration,3 fidelity,37 responsive đều đạt. Fidelity có0pixel khác sau ngưỡng channel16, geometry0px tại3state FHD. Mock smoke:35đạt,31skip theo phạm vi project,0fail/0flaky. Source:`058995f4d5de99c1b48cba541293b1f0e39d9a534c645e4fa1d482b4870b23af`. Hai reviewer cuối R1/R2 APPROVE manifest`a68b5a24406e0adcf876855073e7404160882d14312d66c4b7d1e5a01312392e`.

**Audit và giới hạn:** Audit selftest23findings/14rules/16targets đạt; app audit39/39complete nhưng exit1,29nhóm findings ngoàiB03. Cả7key chưa có baseline đều tái hiện main gốc; baseline giữ nguyên. CSS zoom200%/VisualViewport là mô phỏng; browser zoom/thiết bị/bàn phím thật và Supabase production NOT_RUN. Không coi toàn app đã sạch hoặc chủ dự án đã nghiệm thu.

**Hồ sơ:** Spec/owner approvals, audit classification, validation, review-final và handoff ở PR nhánh docs tương ứng; operator recipe ở ui-remake/tasks/b03/README.md. Gói snapshot/evidence có manifest và closure addendum.

**Trạng thái:** Bản PR nháp local; chưa commit/push/mở PR. Git user.name/email chưa cấu hình, chưa có xác thực GitHub được kiểm chứng cho task này; không tự gán tác giả. Merge/deploy cần được giao riêng.
