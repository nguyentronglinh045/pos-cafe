# Workflow remake UI Stitch — hồ sơ triển khai 19/10/2026

## Phạm vi

Nguồn ủy quyền: chủ dự án chọn workflow kèm bộ đo chạy được và yêu cầu push cho nhóm; chốt landscape568×320CSSpx,BeVietnamPro,A v1 hiệu chỉnh tương phản. [Proposal và quyết định](../../openspec/changes/add-stitch-ui-remake-workflow/proposal.md). Task không remake màn, đổi API/DB/phân quyền, merge hay deploy.

Code tách worktree/branch `workflow/stitch-ui-remake-code` từ origin/main536d8f6. Docs `workflow/stitch-ui-remake-docs` từ origin/docs132e9d6. Không stage/commit/push dirty WIP ở checkout gốc hoặc15commit docs khác. Không cài npm/browser mới; tái dùng Playwright đang có và tải0.53MiB font/OFL từ google/fonts commit47d54ca1ebb14fd864695f1d39dc734f39017c33; giữ provenance và license.

## Bằng chứng candidate cuối

Code candidate: `340c903d60aa7f761cb05112ec75c81079350ee1`, working tree sạch khi chạy. Môi trường: Node `24.16.0`, Windows `10.0.26300` x64, Chromium `148.0.7778.96`, Playwright **`1.60.0`**, DPR 1, `vi-VN`, `Asia/Ho_Chi_Minh`, light, fixed Date `2026-10-19T03:00:00Z`. Đính chính khảo sát ban đầu: checkout dùng chung có `@playwright/test` 1.62.1 nhưng runner import `playwright` 1.60.0; report ghi module thực.

| Kiểm chứng | Lệnh / artifact | Kết quả |
| --- | --- | --- |
| Unit, browser, integration và static server | `npm run test:ui-remake` | **76/76 PASS**, 0 FAIL, 0 SKIP, exit 0 |
| CLI selftest nguồn cuối | `npm run ui-remake:selftest -- --out artifacts/ui-remake/candidate-02` | **11/11 controls đúng**, exit 0: 5 phép đo PASS, 6 phép đo FAIL có chủ đích, 0 ERROR |
| Screen-mode CLI integration | Nằm trong 76 tests, fixture HTTP tổng hợp | Plan → bind approval → đo PASS; đổi ngưỡng bị chặn; output cũ và parent junction bị từ chối trước khi ghi |
| Kiểm ảnh hiện tại | `candidate-02/minimum-reference.png`, `detect-palette-diff.png` | Đã mở ảnh nguồn cuối: fixture vừa 568×320, diff khoanh đúng vùng nút đổi màu |

Năm positive: minimum 568×320, phone 844×390, tablet 1024×768, desktop 1440×900, tiếng Việt dài. Sáu negative: shift, palette, overlay trong suốt, target nhỏ, font, overflow. Overlay có pixel diff **0** nhưng responsive **FAIL**, chứng minh cần kiểm hit-test ngoài so ảnh. Đây là fixture hiệu chuẩn, không phải remake màn thanh toán.

Report cuối giữ ở `artifacts/ui-remake/candidate-02/report.json` và `.md` trong checkout code; 44 PNG dùng 1.040.246 bytes. Fingerprint:

```text
sourceSha256: cf36c6b2480922aa4fd2541d3e9f19cd7c05bee3eba51e8d594a53026edbd797
referenceSourceSha256: 9cf839d41f8f7a4e67973f91a7402fb3d3b1a106227afecf0a3a75dab4e313d0
contractSha256: 76532f6fc530ecdfeb6ad306fe939c6c81478f3bc1c94082d1e9120b8a34723a
```

Development/candidate-01 là lịch sử, không dùng làm PASS của source cuối. `productAcceptance` luôn `NOT_ASSESSED`. Build/logic/smoke/ui-audit và nghiệm thu thiết bị thực của app **NOT_RUN** trong task công cụ không đổi UI này; không suy PASS sản phẩm từ fixture.

## Forward-test quy trình

Đầu vào kịch bản: node A04 trong link Stitch của chủ dự án có lọc vai trò, mã nhân viên và toolbar QA; slice giả định chỉ được rework màn chọn nhân viên/PIN đang có, roster trước PIN không cung cấp role. Đi theo workflow và templates cho kết quả: ghi mismatch vào intake/deviation, toolbar QA ngoài sản phẩm, không thêm role/API/quyền để giống ảnh; chủ dự án phải chốt phần sai khác trước reference approval. Chuẩn hóa màu/font độc lập, giữ raw và normalized riêng; threshold còn đề xuất thì chỉ `--plan`, chưa chạy như reference đã duyệt.

Đầu vào ngoại lệ: chỉ có bitmap, không có reference ngang 568×320, hoặc checkout thiếu `ui-audit/`. Kết quả: ghi phần suy đoán và xin duyệt normalized HTML độc lập; viewport thiếu design chỉ kiểm hợp đồng responsive; audit thiếu ghi `NOT_RUN` và chặn nghiệm thu sản phẩm. Không dùng selftest, ảnh actual hoặc nới threshold để lấp gate. Đó là kiểm kịch bản T01/T02/T13/T15, không thực hiện A04 hay mở rộng nghiệp vụ.

## Tái hiện

Sau khi checkout nhánh code và có Node/Playwright/browser theo môi trường đã chọn:

```powershell
npm run test:ui-remake
npm run ui-remake:selftest -- --out artifacts/ui-remake/NEW-RUN
```

Author tái dùng dependency từ checkout khác bằng env explicit `UI_REMAKE_PLAYWRIGHT_MODULE` trỏ fileURL của modulePlaywright đã cài. Runner thực dùng `playwright`1.60.0, không phải `@playwright/test`1.62.1 được thấy ở khảo sát ban đầu. Teammate dùng dependency chuẩn của checkout mình, ghi đúng engine/OS/font và hiệu chuẩn lại. [Measurement](../workflow/stitch-ui-remake/measurement.md) mô tả các điều kiện và template source/contract approval.

## Review và trạng thái

Code candidate và hồ sơ trên đã khóa để hai reviewer độc lập kiểm công cụ/bằng chứng và workflow/phạm vi. Verdict, xử lý findings và publication sẽ được ghi sau review; hiện chưa có owner nghiệm thu màn UI nào.

Đường đọc giải thích cho chủ dự án: workflow → config/runner → capture/metrics → report. Đã chuẩn bị hướng dẫn này; chưa nhận xác nhận chủ dự án đã đọc hoặc hiểu code.
