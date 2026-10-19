# UI audit — kiểm tra giao diện đã render

Bộ đo đọc DOM và style thực trong Chromium để tìm control bị che, vùng bấm nhỏ,
chữ bị cắt, nội dung tràn, ảnh/icon hỏng và một số vấn đề tương phản hoặc tên
truy cập. Nó bổ sung cho test logic, smoke nghiệp vụ và phép so thiết kế
[ui-remake](../ui-remake/README.md); không thay thế các kiểm tra đó.

## Chạy từ checkout code

Dùng dependency Playwright đã khóa trong `package-lock.json` và Chromium tương
ứng. Không thêm một package/browser khác chỉ cho audit. Cài dependency/browser
phải theo quy tắc dung lượng của dự án; runner không tự tải gì.

```sh
npm run ui-audit:selftest
npm run ui-audit
```

Selftest phải in **đúng 23 findings**, đủ 14 lớp lỗi bắt buộc, 16 đối chứng vùng
bấm/vùng cuộn đạt và `selftest OK`. Selftest hỏng thì dừng trước khi tin audit.

Runner tự mở dev server riêng tại `127.0.0.1:5178`, cưỡng định cấu hình mock bằng
`VITE_DATA_MODE=mock`, URL/key Supabase rỗng; context mới cho từng state/viewport.
**Cổng đang bận sẽ làm lệnh thất bại**. Đóng server cũ hoặc chọn cổng riêng trong
config; không dùng một server không rõ source làm bằng chứng. Runner dừng browser
và cây process server do nó tạo, kể cả khi setup/đo thất bại. Nó không sở hữu hay
tắt server khác đang có trên máy.

Config Vite của SPA chỉ dùng `index.html` làm dependency entry và bỏ generated
artifacts/out/report khỏi watcher. Các fixture bảo vệ đường dẫn có junction về
repo; giữ chúng để kiểm thử, không để Vite quét như source ứng dụng.

```sh
node ui-audit/run.mjs --list
node ui-audit/run.mjs --state floor --viewport tablet
node ui-audit/run.mjs --selftest --selftest-report artifacts/ui-audit/selftest-<new-name>.json
node --test --test-concurrency=1 ui-audit/runtime.test.mjs ui-audit/run.integration.test.mjs ui-audit/watch.test.mjs
```

Report selftest là tùy chọn, phải là đường dẫn tương đối dưới `artifacts/ui-audit/`
và tên `.json` mới; runner từ chối ghi đè hoặc đi qua symlink/junction. JSON v1 có
`kind: ui-audit-selftest`, PASS/FAIL, 23 findings, 14 required rules, 16 target
checks, thời gian, Git HEAD/hash nguồn trước/sau và browser/runtime thực.
`productAcceptance: NOT_ASSESSED` luôn được giữ: selftest chỉ chứng minh detector.

Mặc định import module `playwright` mà `@playwright/test` đã phụ thuộc; version
được đọc từ chính module vừa nạp. Chạy trong worktree có thể trỏ tới dependency
đã cài bằng `UI_AUDIT_PLAYWRIGHT_MODULE` (file URL tới `playwright/index.mjs`). Đây
là override môi trường, phải ghi lại khi dùng làm bằng chứng. Browser dùng
`channel: chromium`, headless, DPR1; không lấy version package `@playwright/test`
khác trên máy thay cho version module thực đã dùng.

## Đọc và phân loại kết quả

- `ui-audit/report.md`: tổng hợp finding và setup failure.
- `ui-audit/report.json`: finding dạng máy đọc.
- `ui-audit/out/*.png`: ảnh annotated của state/viewport có finding, kể cả baseline.
- `ui-audit/out/status.json`: receipt của lượt hiện tại, expected/attempted/completed
  pairs, setup failures, thời gian, hash nguồn/baseline trước–sau và runtime thực.

Runner ghi checkpoint sau từng cặp. Report mới bắt đầu `INCOMPLETE` và chỉ thành
`COMPLETE` khi đủ matrix, không có setup/runtime/cleanup failure. Lỗi navigation,
detector hoặc screenshot được ghi rõ stage; runner thử các cặp còn lại, giữ finding
đã đo và trả exit2 nếu coverage thiếu. Diagnostic tail tối đa4096ký tự chỉ lấy từ
server do runner tạo. `COMPLETE` nói về coverage, không phải nghiệm thu UI.

Các output trên bị git-ignore. Mở ảnh của **lượt hiện tại** trước khi kết luận
selector là lỗi thật; ảnh của state không sinh finding trong lượt mới có thể là
ảnh cũ từ lượt trước. Ghi rõ state, viewport, selector, phép đo và lý do phân
loại. Không sửa `src/` chỉ vì audit báo finding ngoài scope đã duyệt.

Mã thoát app audit: 0 khi không có **error mới ngoài baseline** và setup hoàn tất;
1 khi có error mới; 2 khi coverage/setup/runtime/cleanup/nguồn thất bại. Selftest
FAIL trả1; chọn matrix/config sai trả mã khác0. `failOn` hiện là `["error"]`:
warning/info mới vẫn có trong báo cáo và vẫn phải
phân loại, nhưng không tự làm CI đỏ. Vì vậy exit0 không có nghĩa UI không còn lỗi.
Audit chỉ kiểm các phần tử/state đang đo; không chứng nhận đầy đủ WCAG, bàn phím,
thiết bị vật lý hay độ giống design.

## Phạm vi state/viewport

Config published bao phủ 13 state trên **UI main hiện có**: landing, store-pairing,
passcode, floor, order-drawer, order-cart, menu-editor, report, employees, settings,
clear-demo-dialog, payment và receipt-preview. State con kế thừa steps của cha bằng
`extends`; `@ten` là `[data-testid="ten"]`. Hỗ trợ `click`, `clickAll`, `fill` +
`value`, `press`, `waitFor` + `state`, `wait` và `timeout` riêng từng bước.

Giữ ba viewport lịch sử: tablet 1024×768, desktop 1440×900, mobile ngang 844×390;
tổng **39 cặp**. Đây là kiểm thử vận hành audit trên app mock hiện có. Không phải
pilot remake màn Stitch và không chứng minh toàn app đạt 568×320. Gate responsive
568×320 trở lên của từng màn remake nằm trong workflow `ui-remake/`.

Công thức login và fixture lấy từ `tests/smoke/helpers.ts` và
`tests/smoke/demo-runbook.spec.ts`: mã mock `0001-X8F3QA`, admin
`6b7bd350-7db2-4160-8471-cca2668c070d`, PIN mock `123456`. Không dùng thông tin cửa
hàng thật. Ba fixture/state compatibility/required-PIN trên nhánh permission chưa
được đưa sang vì module đó chưa thuộc main; publish audit không mở rộng scope app.

## Baseline và quyền chấp nhận

`baseline.json` là tập key `state :: viewport :: rule :: selector`, không phải ảnh
thiết kế. Phiên bản được publish giữ nguyên 36 key lịch sử từ commit
`d78c929c9ce6f6c09790bbfa4135b1cc47d0f1b1` (16/09/2026). File Git lịch sử
dùng LF (blob `2861d0ef1d0d556afb4508f4d5344ce8583171e1`, SHA256
`bf94db0428557376481f01a3cabea474c73eef156a95218ae09cbf960d4ffd42`).
File được publish giữ bytes CRLF của checkout nguồn hiện có, SHA256
`79fe315c36c21db23a66724939b085e5ac4065d16780e2a0d26e1f9da5c87080`;
khác line ending, cùng nội dung 36 key. Không gọi hai raw hash là cùng một file bytes.
Đó là mốc chặn hồi quy đã ghi nhận; không có nghĩa các finding đã được sửa.

**Không tự chạy `npm run ui-audit:update`.** Chỉ chạy sau khi chủ dự án xem danh
sách đã phân loại và cho phép cập nhật đúng baseline. `--update` chỉ chấp nhận
matrix đầy đủ; không kết hợp filter state/viewport để vô tình bỏ key ngoài scope.
Task publish/CI này không cập nhật baseline, thay severity, hạ threshold hay sửa UI
để làm gate xanh.

## Detector và giới hạn

Detector hiện có năm nhóm điều chỉnh cho pos-cafe, giữ chú thích trong `audit.js`:

1. Scope lớp fixed phủ viewport trên cùng để không bắt nhầm control nền sau modal.
2. Bỏ container toast fixed, pointer-events:none, cỡ viewport.
3. Bỏ phép đo contrast ở backdrop gradient/image thay vì đoán nền phẳng.
4. Đo phần control thật sự lộ ra sau clipping/scroll; báo `clipped-interactive`
   khi không thể cuộn để đưa control ra.
5. Dùng vùng label có hit thực của input, chọn label hữu dụng và phục hồi scroll.

Runner gộp selector chỉ khác `nth-of-type` và chuẩn hóa React `useId` để một lỗi
lặp không thành hàng chục baseline key. Contrast là ước lượng DOM trong phạm vi
hỗ trợ; các phần bị bỏ qua không nhận PASS. Recharts được loại trừ trong config.

[UPSTREAM-README.md](UPSTREAM-README.md) lưu mô tả kit lịch sử chưa xác minh nguồn
phát hành/license, không phải hướng dẫn cài hay chấp nhận baseline hiện tại.
Nguồn trong repo bắt đầu ở commit `bccec3af9c1ea501dcbdf166deec6dd8d52e2941`.
Không suy một license ngoài từ tên "upstream" và không thêm attribution chưa có
bằng chứng. Specs, quyết định và biên bản kiểm/review sống trên nhánh `docs`; hướng
dẫn vận hành chỉ có bản gốc cạnh công cụ trên `main`.
