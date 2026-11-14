# Kiểm tra kịch bản hồi quy — 12/11/2026

**Bản nháp do AI (Claude Code) chạy và soạn. Lâm chưa xem; xem ô tự kiểm trong [README](README.md).**

"Kịch bản hồi quy" ở đây là các ca kiểm mà [`docs/regression-map.md`](https://github.com/nguyentronglinh045/pos-cafe/blob/e8a1810f3de41453ad33b224334c26d6f8cd52db/docs/regression-map.md) (nhánh `docs` `e8a1810`) dẫn cho 21 FR và 8 NFR, cùng các bộ test tự động chứa chúng. Nếu Linh muốn nói tới kịch bản N01 của Ngọc thì xem câu Q-L6-1 trong README.

Phần này trả lời ba câu hỏi:
1. Các bộ test hồi quy có còn chạy đạt trên main hiện tại không?
2. Từng ca mà bản đồ dẫn tới có còn đúng chỗ và đạt không?
3. Bản đồ còn thiếu gì so với điều thấy trên demo?

## 1. Chạy lại các bộ test trên main `cd35439`

Mã trên máy giống hệt main [`cd35439`](https://github.com/nguyentronglinh045/pos-cafe/tree/cd3543996fb4d06f022dcf4a6829fba43645daff): đã so mã băm 698 file `src/`, `tests/` và cấu hình, không có file khác hoặc thừa.

| Bộ | Cách chạy | Giờ (12/11, UTC+7) | Kết quả | So với số đã ghi |
| --- | --- | --- | --- | --- |
| **U** — unit | `npx vitest run` | 08:27:10–08:28:13 | **116 file, 1.240/1.240 ca đạt**, 0 lỗi | Bản đồ (nhãn U, `cf8e304`): 113 file / 1.201 ca. CI main `28a3dc5` ghi trong chính bản đồ: unit 1240 |
| **S** — smoke trên trình duyệt | Bộ `tests/smoke` với cấu hình phụ [`playwright.lam-chrome.config.mjs`](script/playwright.lam-chrome.config.mjs) (giữ nguyên mọi viewport, timeout, chế độ mock; chỉ dùng Chrome cài trên máy) | 08:29:10, 78 giây | **86 ca: 49 đạt, 37 bỏ qua theo cấu hình, 0 lỗi, 0 phải chạy lại** | Bản đồ (nhãn S): 44 đạt / 37 bỏ qua. CI main: 49 đạt / 37 bỏ qua |
| **B** — giao diện mới | `tests/ui-remake/integration` với cấu hình phụ [`playwright.lam-chrome-b.config.mjs`](script/playwright.lam-chrome-b.config.mjs) (lấy nguyên cấu hình `b01`) | Lượt 1: 08:31:19 dừng ngay khi nạp file. Lượt 2: 08:31:44–08:32:01, chỉ `journey.spec.ts` | `journey.spec.ts`: **4/4 đạt**. `areas.spec.ts`: **không chạy được**, thiếu file (H-01) | Bản đồ (nhãn B): 26 đạt |
| Contract (cần PostgreSQL 16) | — | — | **Không chạy**: cần cơ sở dữ liệu thật | — |

37 ca "bỏ qua" là do cấu hình chứ không phải lỗi. Mỗi ca chỉ chạy ở loại màn nó áp dụng: ví dụ ca màn dọc chỉ chạy ở project `portrait`, ca giao diện màn ngang thì bỏ qua `portrait`.

Kết quả gốc: [`unit/ket-qua.json`](chay-2026-11-12/unit/ket-qua.json), [`smoke/ket-qua.json`](chay-2026-11-12/smoke/ket-qua.json), [`b/ket-qua.json`](chay-2026-11-12/b/ket-qua.json), cùng log trong từng thư mục.

## 2. Từng ca mà bản đồ dẫn tới

**Link còn đúng chỗ không?** [`kiem-lien-ket-regression-map.sh`](script/kiem-lien-ket-regression-map.sh) so 62 link dạng `file#Ldòng` (ghim commit `711a22e`) với cùng dòng trên main `cd35439`. Kết quả: **62/62 còn đúng dòng** ([`rm-links-check.tsv`](chay-2026-11-12/lien-ket/rm-links-check.tsv)).

**Ca đó đạt không?** [`doi-chieu-ca-hoi-quy.mjs`](script/doi-chieu-ca-hoi-quy.mjs) nối từng link với kết quả chạy ở mục 1. Link trỏ vào giữa một ca (ví dụ một bước trong ca 14 bước) được nối với ca bao quanh nó. Bảng đầy đủ ở [`doi-chieu-ca.md`](chay-2026-11-12/lien-ket/doi-chieu-ca.md).

| Loại link | Số link | Kết quả 12/11 |
| --- | --- | --- |
| Unit (U) | 35 | Đạt hết. Một ca có tham số (FR-13, `ReceiptPrintLifecycle.test.tsx:46`) gồm 10 biến thể, cả 10 đạt |
| Smoke (S) | 10 | Đạt hết ở các màn áp dụng; phần bỏ qua đúng cấu hình |
| Browser (B) | 4 | 3 link vào `journey.spec.ts` đạt ở cả 568×320 và 1920×1080; 1 link vào `areas.spec.ts` (FR-06) không chạy được |
| Contract (cần PG16) | 7 | Chưa chạy (FR-04, FR-11, FR-12, NFR-01 ×2, NFR-02 ×2) |
| Không phải ca kiểm (mã hoặc cấu hình) | 6 | Chỉ kiểm link còn đúng dòng |
| **Tổng** | **62** | **48 link có ca đạt, 1 không chạy được, 7 chưa chạy, 6 không phải ca kiểm** |

Bản đồ hiện ghi ở nhiều dòng "U: suite PASS; chưa có kết quả riêng từng TC". Lượt này đã có kết quả riêng cho từng ca unit được dẫn.

## 3. Điểm cần lưu ý

| Mã | Điểm | Ảnh hưởng | Gợi ý |
| --- | --- | --- | --- |
| H-01 | `tests/ui-remake/integration/areas.spec.ts` đọc file `artifacts/stitch/B01/v3/responsive-contract.proposed.json` ngay khi nạp; file không có trong repo (đã tìm trên mọi nhánh). Chạy cả thư mục thì dừng luôn cả `journey.spec.ts` | Bằng chứng B cho FR-06 (dải khu ở 3 cỡ màn) không chạy lại được từ repo | Đưa file vào repo hoặc ghi rõ trong bản đồ (TL-14) |
| H-02 | 7 link contract cần PostgreSQL 16 | Phần quyền phía server, giao dịch tiền, cô lập dữ liệu giữa quán chưa có kết quả từ máy này | Chạy trong môi trường backend khi Linh giao |
| H-03 | Ca smoke "kịch bản demo chính chạy liền mạch qua **14 bước**" (`tests/smoke/demo-runbook.spec.ts`) dùng dữ liệu khác runbook bản 09/11 (3 Cà phê sữa Size L, 108.000đ, tách 72.000/36.000) và chỉ có 14 bước, trong khi runbook có **16 bước** | Ca này đạt chứng minh luồng chạy, không chứng minh chữ và thứ tự trong runbook mới. Bước 15–16 (quản trị, dữ liệu mẫu) không có ca tự động nào | Lượt tay/bán tự động của Lâm ([02](02-doi-chieu-yeu-cau.md), [01](01-ra-soat-tai-lieu.md)) bù phần chữ; nếu muốn tự động, ca smoke nên theo runbook mới |
| H-04 | Hồi quy mang đi (FR-08) chỉ có một ca unit: bấm "Bán mang đi" thì mở màn. Lượt demo thấy 3 điểm lệch ở màn mang đi (YC-02, YC-03, YC-04) mà không ca tự động nào bắt được | Đúng điều bản đồ đã ghi ở mục "Cách hoàn thiện", ý 3 | Khi viết ca mang đi, thêm kiểm thẻ "Đã thanh toán", nút In lại và câu thông báo sau khi trả |
| H-05 | Báo cáo (FR-19): không ca nào kiểm ô "Thanh toán phổ biến"; ô này luôn ghi "Đã thanh toán" (YC-01) | Lỗi hiển thị lọt qua cả unit lẫn smoke | Thêm vào ca Báo cáo khi sửa |

## Cách chạy lại

Từ thư mục mã nguồn main (đã `npm ci`), PowerShell:

```powershell
npx vitest run --reporter=dot --reporter=json --outputFile.json=<out>\unit\ket-qua.json
$env:POS_CAFE_ROOT = (Get-Location).Path; $env:LAM_OUT = "<out>\smoke"
npx playwright test -c <lam-tuan-6>\script\playwright.lam-chrome.config.mjs
$env:LAM_OUT = "<out>\b"
npx playwright test -c <lam-tuan-6>\script\playwright.lam-chrome-b.config.mjs journey.spec.ts
node <lam-tuan-6>\script\doi-chieu-ca-hoi-quy.mjs <out> (Get-Location).Path
```

Kiểm link chạy trong một bản clone repo đã `git fetch` (Git Bash): `bash kiem-lien-ket-regression-map.sh <out>\lien-ket`.

## Giới hạn

- Unit và smoke chạy trên bản mock và môi trường giả lập trong test; không phải backend thật, không phải thiết bị thật.
- Không đo độ phủ (coverage) trong lượt này; NFR-07 (≥ 90% dòng) chưa được kiểm lại.
- Smoke dùng Chrome cài trên máy thay cho trình duyệt riêng của Playwright; viewport, timeout và chế độ mock giữ nguyên.
