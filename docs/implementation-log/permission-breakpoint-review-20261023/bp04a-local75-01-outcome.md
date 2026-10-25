# BP4A LOCAL75-01 — archive/install đạt, build dừng ở shell Windows

Ngày 23/10/2026, giờ Asia/Bangkok (UTC+7). **Đã dừng sau build FAIL; unit/coverage chưa chạy.** Không cập nhật main hoặc DB. Kết quả này không phải full application/security gate PASS.

## Quyền, source và lịch sử

Owner duyệt [gói local 75 phút](../../workflow/tasks/permission-bp4a-full-local-after-countfix-2026-10-23.md) tại `request_user_input_async call_16b37ac7f478441d85b1d9bdb1b11244 item0`, trả lời “Duyệt gói local 75 phút (khuyến nghị)”. [Grant](bp4a-local75-01-owner-grant.json) ghi nhận **14:36:32**, readiness đến 15:01:32, không admit execution mới sau 15:41:32, hard stop **15:51:32**. Điều kiện sau R1: phase FAIL/UNKNOWN thì dừng phụ thuộc, không tự sửa/retry. Điều kiện này đã kích hoạt và tiếp tục có hiệu lực dù còn thời gian.

App worktree `D:/Workspace/pos-cafe-permission-timeonly-20261022/code`, HEAD sạch `e42215044b4faf7e90f787ae8e975937ad3e4479`; lock SHA256 `85969c1c161f74e9f68563182d99d1b0ac6fb5f17f5074444f329675ffd34e18`. Node 24.16.0/npm 11.13.0 có sẵn trên D. Không đổi app, lock, coverage config hoặc checkout bẩn của owner.

Lịch sử thực tế đến checkpoint này: **3 full preflight** (2 lượt cũ FAIL, lượt này PASS), **1 npm ci PASS**, **1 build FAIL**, **0 unit**. Native install probe có 1 lượt PASS. Không reset grant/marker/ledger; sáu phase03 ledger được runner xác nhận nguyên hash. Không có quyền push/CI/backend/DB, kể cả SELECT, Auth/Edge/deploy hoặc cleanup trong lượt này.

## Kết quả đã chạy thật

| Bước | Kết quả và căn cứ |
| --- | --- |
| R0 | 20/20 controls offline PASS, 14:48:02; fake transport không thay archive/app evidence. Hai reviewer APPROVE exact candidate trước R1, ghi trong [admission](bp4a-local75-01-source-admission.json). |
| R1 | **46/46 archive PASS**: 45 GET thực + 1 retained archive `@types/pg` được kiểm lại SRI/body/parser trong phase. Tải mới 1.695.598 B. Raw metadata total 1.579, expected regular total 1.577; countfix không hạ count guard của package khác. |
| R2 | **npm ci PASS**, 14:54:48.809–14:55:04.353; npm báo thêm 351 package trong 13 giây. Versions của Vite/Vitest/TypeScript/coverage/Supabase/Playwright/pg khớp lock. Native Rolldown/LightningCSS load PASS, 14:55:07.118–14:55:10.562. |
| R3 | **Build FAIL**, 14:55:13.230–14:55:14.738, exit 1. Log là lỗi tìm lệnh `tsc`, chưa có TypeScript diagnostics. |
| R4 | **NOT_RUN**: chưa có full unit JSON/coverage PASS hoặc unit marker. Giữ yêu cầu đúng 110 tracked source test files và line coverage ≥90%. |

[Receipt gốc](bp4a-local75-01-local01.json), SHA256 `6113b5da8866bc1b11cb53cb4afb3bf00ec9e33b5de6d46590b6a903cc1143df`, ghi execution 14:54:46.089–14:55:14.738. Trường `status=FAIL_OR_UNKNOWN` và stop code tổng quát `BP4_UNCLASSIFIED_STOP` được giữ nguyên; không sửa raw receipt để đổi kết quả. [Build stderr](bp4a-local75-01-build.stderr.log) xác định lỗi cụ thể:

```text
'tsc' is not recognized as an internal or external command,
operable program or batch file.
```

Cả install/native/build đều có Job proof riêng: `activeProcesses=0`, `releaseVerified=true`, không timeout/orphan/native failure. Build `passed=false`, `rootExitCode=1`; release thành công không biến build thành PASS. [Manifest](bp04a-local75-01-manifest.json) pin 29 raw copies, bao gồm grant, admission, controls, archive admission, logs, child/release proofs và snapshots. Các file được copy nguyên bytes, không chứa credential.

## Nguyên nhân đã biết và phần còn là giả thuyết

**Đã xác nhận bằng đọc source/filesystem:**

- [Runner dòng 105](D:/Workspace/pos-cafe-permission-timeonly-20261022/operations/run-bp4-local75-01.mjs:105), SHA256 `5a420869dadf4a91bc21c25f1474853f99907625084375afaa35f9d6c48a8e46`, tạo child env bằng allowlist nhưng bỏ `PATHEXT`. Nó gọi nguyên script `npm run build`, không gọi compiler qua absolute path.
- `code/node_modules/.bin/tsc.cmd` và `vite.cmd` cùng compiler TypeScript 5.9.3 đều tồn tại. SHA256 `tsc.cmd=54c7c33889f405746bfaba0fda5e725d4a88b77a708d41806408b4662f88d509`, `vite.cmd=e865893c8f57ff153c66cf80aac687f436b457922d9585495becee81c927e910`. Đây không phải bằng chứng compiler đã chạy.
- npm hiện có: [make-spawn-args](D:/tools/nodejs/node_modules/npm/node_modules/@npmcli/run-script/lib/make-spawn-args.js:32) kế thừa env; [set-path](D:/tools/nodejs/node_modules/npm/node_modules/@npmcli/run-script/lib/set-path.js:27) thêm ancestor `node_modules/.bin`; [promise-spawn](D:/tools/nodejs/node_modules/npm/node_modules/@npmcli/promise-spawn/lib/index.js:103) xử lý shell Windows và chuyển command cho CMD. [Job helper](D:/Workspace/pos-cafe-permission-timeonly-20261022/operations/bp4-child-job.ps1:45) dùng môi trường kế thừa khi tạo child.
- Microsoft mô tả CMD dùng `PATHEXT` để tìm extension cho token lệnh không ghi extension. [Microsoft Learn](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/start#remarks)

**Kết luận có giới hạn:** thiếu `PATHEXT` là nguyên nhân có khả năng cao của lỗi tìm `tsc.cmd`. Chưa capture env thực trong child và chưa chạy reproduction, nên chưa tuyên bố chứng minh quan hệ nhân quả. Chưa có căn cứ nói app TypeScript có lỗi hay build ứng dụng đã đạt. Không chạy probe hoặc sửa runner sau STOP.

R0 vừa rồi tập trung archive retention/count/composition; version checks đọc manifest và native probe gọi Node bằng absolute path. Các bước đó không thử bare `.cmd` qua đúng npm/CMD chain. Hai review source cũng đã bỏ sót khoảng trống này. Đây là lỗi tiền kiểm/tooling do agent chuẩn bị; không phải lý do sửa app hoặc giảm acceptance. Bài học cụ thể: trước build nặng, phải có control thực nhỏ ở đúng shell/env và cả negative control, thay vì chỉ thêm nhiều review tĩnh.

## Chi phí thời gian, dung lượng và khả năng tiếp tục

Từ ghi nhận grant đến admission khoảng 18 phút 14 giây; execution thực chỉ khoảng **29 giây** trước STOP. Vì thế ở lượt này thời gian chủ yếu thuộc chuẩn bị consumer/control/review, không phải backend chạy lâu. Cài thật chỉ 13 giây; không lấy timeout tối đa làm thời gian đã tiêu. Những lượt archive/diagnostic cũ đã phát sinh lỗi metric riêng, có hồ sơ trước đó; không gộp chúng thành lỗi build hiện tại.

[Post-stop snapshot chỉ đọc](bp4a-local75-01-post-stop-observation.json) lúc **15:02:41.967**: task 302.834.058 B, tăng 251.524.928 B từ baseline; retained 584.778.149 B dưới 805.306.368 B; C còn 193.213.530.112 B, D còn 98.194.354.176 B, đều trên 30 GiB. Đây là logical tree bytes và free-volume snapshot, không phải quota OS. Raw copies/docs mới khoảng 3,45 MB nằm ngoài phép đo bảy retained roots này; vẫn là dữ liệu phát sinh của task và cần tính thêm khi lập ngân sách sau.

[Dependency snapshot](bp4a-local75-01-dependency-snapshot.json), SHA256 `1589438b4344c922690cbe1f84cf75b9250e22950032f23c37d82a68da6a409f`, ghi 19.068 file/203.000.430 B, không symlink trong `node_modules`. Đây là hash baseline sau STOP để phát hiện drift khi tiếp tục, không thay registry SRI attestation. Hidden install lock có 351 package rows khớp version/resolved/integrity ở source lock; 5 Windows-compatible rows không cài đều là optional WASM packages, không ép giả đủ 356. Native packages thực dùng đã load PASS.

Giữ `code/node_modules`, `npm-cache-bp4a-local75-01` và evidence vì còn giúp lượt sau tránh cài/tải lại. Không cleanup; không nhận di chuyển/dừng process là thu hồi dung lượng. Snapshot này không tạo quyền tiếp tục execution.

## Bước tiếp theo và review

[Đề nghị sửa command resolution rồi chỉ build/unit](../../workflow/tasks/permission-bp4a-windows-command-resolution-2026-10-23.md) chờ owner duyệt. Giữ kết quả archive/install đúng source hiện tại nếu fresh admission xác nhận source/lock/dependency không đổi; không nhận chúng thành application PASS. Nếu guard hoặc build/unit tiếp theo FAIL/UNKNOWN thì lại dừng phụ thuộc, không retry ngầm.

Walkthrough để owner kiểm: grant → source admission → archive admission → install/native proof → build stderr → post-stop snapshot → đề nghị guard. Owner chưa được ghi nhận đã đọc/nghiệm thu. Review cuối của hồ sơ và proposal được chép tại metadata review sau khi hai reviewer đọc exact candidate; chưa có phê duyệt thực thi mới.
