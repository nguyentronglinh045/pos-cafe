# T06 mục 7.5 — Smoke ghép quán thử trên staging

Ngày kiểm staging 17/11/2026. Chuẩn bị PR ngày 18/11/2026.

Mã đã mở [PR #30](https://github.com/nguyentronglinh045/pos-cafe/pull/30) vào `main`, commit `d0556f007bf40649bf9638b2dfb3daf495a1e33e`. Hồ sơ này cập nhật trên nhánh `docs-t06-staging-smoke-pairing` với base `docs@fc2e231`.

Linh giao đổi smoke sang ghép quán thử có sẵn bằng Store Key từ môi trường runner và chạy đủ năm ca trên DB staging. Linh chọn quán thử 0004 sau khi được báo ảnh hưởng tới đơn, thanh toán và quyền thu ngân.

## Thay đổi và nguồn

Ba tệp mã là `tests/supabase/pos-cafe-supabase.spec.ts`, `package.json` và `scripts/permission-realtime-probe.mjs`. Lệnh `npm run smoke:supabase` khoanh đúng file năm ca và một worker. Runner ghép quán đã có, dùng quyền owner và cashier qua hợp đồng hiện hành, bám UUID từng đơn và số phiếu server cấp, rồi khôi phục ghi đè quyền thu ngân theo đúng request/audit.

Lượt staging dùng source ứng dụng tại `610f198d96765b01f3e0058bd793ccf5164a44a2` và ba tệp thay đổi có hash dưới đây. Nhánh PR dựa trên `main@81c37dd1ac04fe01424b729db2e877013d2b9092`. So sánh hai commit nền chỉ có `README.md` được thêm. Ba tệp đã kiểm được chép nguyên byte vào nhánh PR. Backend là Supabase staging T06 với các bản sửa đã áp và được ghi trong hồ sơ kiểm riêng.

## Kết quả năm ca

Lượt cuối bắt đầu 17/11/2026 lúc 22:12:50 UTC+7, chạy 67,9 giây. Cả năm ca đạt, 0 thất bại, 0 bỏ qua, 0 flaky.

| Ca | Bằng chứng kiểm |
| --- | --- |
| Ghép, thanh toán và lịch sử/báo cáo | Ghép đúng quán 0004, thanh toán đúng đơn và thấy UUID trong lịch sử. Số đơn đã trả và doanh thu tăng theo đơn. |
| Phân quyền thu ngân | Thu ngân tạo được đơn. UI ẩn thao tác thanh toán. RPC đăng ký lệnh thanh toán trả `FORBIDDEN`, version đơn giữ nguyên. |
| Hủy đơn đã trả | Đúng đơn chuyển sang `void` với lý do đã chọn. Thống kê paid và revenue giảm tương ứng, thống kê hủy tăng. |
| Tách món thanh toán | Trả 1/2 số lượng, phiếu đã trả giữ số cũ, phần còn lại có số mới. Chọn lại và trả nốt, hai UUID paid độc lập, bàn trống. |
| Realtime hai trình duyệt | Probe nhận topic `orders` sau tạo và trả tiền, hai trình duyệt cập nhật đúng bàn. |

Lượt đầu đạt 3/5. Đã sửa assertion UI quyền, đăng ký operation trước execute và chọn đúng topic Realtime. Hai đơn mở thuộc hai ca lỗi đã được ràng buộc bằng ledger, actor và thời điểm rồi đóng trước lượt sau.

Hậu kiểm 17/11 lúc 22:14:34 UTC+7 thấy 0 đơn mở, cashier overrides về `null`, PIN giữ nguyên. Các phiên kiểm được thu hồi và đăng xuất cục bộ. Dữ liệu đơn/thanh toán thử và audit được giữ tại quán 0004 theo phạm vi Linh chọn.

## Bằng chứng và fingerprint

Biên nhận gốc nằm tại `D:/Workspace/pos-cafe-t06-pg16-runtime/t06-inventory-20261117/`. Tệp Playwright ghi ID đơn và kết quả. Đã kiểm các artifact JSON/Markdown không chứa Store Key và PIN fixture.

| Tệp | SHA-256 |
| --- | --- |
| `tests/supabase/pos-cafe-supabase.spec.ts` | `4bbd1f946a76549b4309062df30b67803e43f4f36f5b60c0f67e8f5c5257b60a` |
| `package.json` | `fb5d191911b9a93b84a8b1da1096221fe7ec59705522e11dc0395932dab67eb9` |
| `scripts/permission-realtime-probe.mjs` | `f78b2d9801a405f0f669adc4002e99b4f284df625475981f30cf67c4eb4fb22b` |
| `smoke-75-20261117T151240584Z.playwright.json` | `92f95c42000653e3139351a7bc78cc725cc5e1ef258666c7235c9d57d58abdd3` |
| `smoke-75-20261117T151240584Z.preflight.json` | `e7a0a4e5d0e1d23e182c3e040b6ca21451c242356f27f7f1feb3b3bd05c8467c` |
| `smoke-75-20261117T151434876Z.preflight.json` | `2e9200d4f7507a672223a2e940f3f8249da5f5ffe2bb0243ab3194aa8467cb25` |

Hai reviewer độc lập đã duyệt bản mã trên ngày 17/11 theo phạm vi hành vi và an toàn vận hành. Đã hướng dẫn Linh các điểm đọc mã về ghép quán, ID đơn và hoàn nguyên quyền, đang chờ Linh tự kiểm.

## Trạng thái tiếp nối

Mục 7.5 đã kiểm xong. Các mục 7.1, 7.2 và phần test còn phụ thuộc ở 7.4 tiếp tục theo checklist T06. Việc phát hành toàn bộ bản vá SQL/Edge và hồi quy trên commit ứng viên cuối có gate riêng. [Checklist](../../../openspec/changes/add-owner-account-and-store-provisioning/tasks.md) · [Kế hoạch](../g01-g10-plan.md).
