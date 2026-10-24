# B03 — Chạy và kiểm giao diện thanh toán

Config được owner duyệt: `measurement.json`. Giữ `measurement.proposed.json`, các bản discovery và `measurement.initial-approved.json` để truy nguồn; không dùng chúng thay config cuối. Reference v3 không đổi; contract sau bổ sung bước kết thúc nhập tiền là `29d4ea694ceef991ede62f2b4f471e5beb2dd20f8836fb2000e47a04a4d37c74`.

## Môi trường và nguồn

Kiểm branch/HEAD/WIP trước; không chép đè worktree đang có việc khác. Dùng lockfile của checkout, Chromium full channel, font cục bộ. Không tự cài lại dependency hoặc browser. Lượt xác minh này dùng Node24.22.0, Playwright1.60.0, Chromium148.0.7778.96, DPR1, vi-VN, Asia/Ho_Chi_Minh và clock trong config.

Reference/assets được giữ trong gói bàn giao, không lấy ảnh app làm expected. Khôi phục mục `reference-v3` của gói vào `artifacts/stitch/B03/v3` và xác minh manifest trước khi chạy. Snapshot source phải khớp candidate trong báo cáo; `--plan` phải trả đúng reference/contract hashes. Các file raw/normalized trên máy không tự được Git lưu vì `artifacts` bị ignore.

Khi tái dùng môi trường sẵn có, đặt `PLAYWRIGHT_BROWSERS_PATH`, `UI_REMAKE_PLAYWRIGHT_MODULE` và `UI_AUDIT_PLAYWRIGHT_MODULE` trỏ tới browser/module đã kiểm đúng phiên bản; không tải browser trùng. Nếu dùng dependency mặc định thì không cần module override. Git phải đọc được worktree để tính fingerprint.

## Chạy local

Terminal app:

```powershell
$env:VITE_DATA_MODE='mock'
$env:VITE_SUPABASE_URL=''
$env:VITE_SUPABASE_ANON_KEY=''
node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5183 --strictPort
```

Terminal reference:

```powershell
node ui-remake/serve-reference.mjs --root artifacts/stitch/B03 --port 4177
```

Trong app: paired store mẫu `0001-X8F3QA`, quản lý PIN mẫu `123456` hoặc thu ngân `111111`; chọn bàn B02 và Thanh toán. B03 không cần B01/B02 WIP và không kết nối Supabase khi dùng recipe trên.

```powershell
node ui-remake/run.mjs --config ui-remake/tasks/b03/measurement.json --plan
node ui-remake/run.mjs --config ui-remake/tasks/b03/measurement.json --out artifacts/ui-remake/b03-fidelity-NEW
node node_modules/@playwright/test/cli.js test -c playwright.b03.config.ts
node node_modules/typescript/bin/tsc -b
node node_modules/vite/bin/vite.js build
node node_modules/vitest/vitest.mjs run
node node_modules/@playwright/test/cli.js test
```

`B03_EVIDENCE_DIR` chọn thư mục mới cho report responsive. Fixture trong `tests/ui-remake/b03` dùng component/hook/mock repository thật, chỉ dành cho kiểm thử; production entry không import fixture. Các phép đo focus và keyboard chạy riêng; fidelity chụp trạng thái trung tính sau click metadata đã được owner duyệt, không xóa focus trong app hoặc sửa capture để che lỗi.

Chạy tool tests/selftest và `ui-audit` theo README gốc. Audit bắt buộc selftest đúng23findings/14rules/16targets trước app, đọc report và ảnh annotated rồi phân loại mọi finding. Không chạy `ui-audit:update`. Không sửa candidate trong lúc gate chạy; đổi source phải chạy lại các bằng chứng liên quan. Không suy mock test thành chứng minh backend/production hay thiết bị thật.

## Theme và hành vi

`src/theme/remakeTheme.ts` dẫn CSS variables/Tailwind và MUI từ `ui-remake/palette-a-v1.json`; không sửa màu từng component. `RemakeThemeProvider` giữ scope theo số provider đang mở để hóa đơn còn theme sau khi drawer thanh toán đóng. `ReceiptPreview.presentation` là nhãn UI trong app store, không đi vào financial payload/domain/database.

Breakpoint của panel dựa trên kích thước vùng hiển thị bằng container queries, giữ bố cục viewport thông thường theo reference và hỗ trợ phóng to. VisualViewport listener giới hạn panel khi bàn phím che layout viewport. In tạm tính/receipt vẫn mở preview; chỉ nút In mới revalidate receipt và gọi browser print. Không có phương thức thanh toán mới, refund hoặc tự động in native.

Spec, sai khác, owner approval, kiểm chứng và PR descriptions nằm trên nhánh docs. Workflow này không cấp quyền merge/deploy hoặc cập nhật baseline.
