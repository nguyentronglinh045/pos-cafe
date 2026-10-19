# Workflow remake UI Stitch — hồ sơ triển khai 19/10/2026

## Phạm vi

Nguồn ủy quyền: chủ dự án chọn workflow kèm bộ đo chạy được và yêu cầu push cho nhóm; chốt landscape568×320CSSpx,BeVietnamPro,A v1 hiệu chỉnh tương phản. [Proposal và quyết định](../../openspec/changes/add-stitch-ui-remake-workflow/proposal.md). Ban đầu chỉ cho push; D5–D6 bổ sung chuyển tài liệu vận hành vào code và merge riêng PR#7→main, PR#8→docs sau kiểm chứng. Task không remake màn, đổi API/DB/phân quyền hoặc deploy.

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

Author tái dùng dependency từ checkout khác bằng env explicit `UI_REMAKE_PLAYWRIGHT_MODULE` trỏ fileURL của modulePlaywright đã cài. Runner thực dùng `playwright`1.60.0, không phải `@playwright/test`1.62.1 được thấy ở khảo sát ban đầu. Teammate dùng dependency chuẩn của checkout mình, ghi đúng engine/OS/font và hiệu chuẩn lại. [Measurement](https://github.com/nguyentronglinh045/pos-cafe/blob/main/ui-remake/measurement.md) mô tả các điều kiện và template source/contract approval.

## Review và trạng thái

Hai reviewer không phải tác giả đã review và **APPROVE** trong phạm vi được giao:

| Reviewer | Candidate / phạm vi | Kiểm độc lập và verdict |
| --- | --- | --- |
| `review_final_ui_code` | Code `340c903d60aa7f761cb05112ec75c81079350ee1`: phép đo, approval, output containment, capture, font/source evidence | Đọc runner/config/capture/metrics/server/provenance và report; tự chạy 65 tests PASS, 0 fail/skip; **APPROVE**, không blocker |
| `review_final_ui_workflow` | Docs `c85c06442cc4a59f77ad633dbf7363e3d65de071` + code trên: scope, palette/font, contracts, forward-test, privacy và tái hiện | Kiểm CLI help/plan/hashes, 46 local links, hai ảnh current và kịch bản; **APPROVE** sau đóng F1/F2, không blocker |

Xử lý findings: F1 thêm hai mục proposal đúng chuẩn và trạng thái không còn câu hỏi chặn; F2 bổ sung setup/level/dữ liệu/file-testname cho từng TC, phân biệt source review với mutation runtime chưa chạy. Khuyến nghị network đã sửa tại `b926033`: chỉ chặn remote HTTP(S), không hứa sandbox WebSocket/mọi giao thức. Code không đổi qua các vòng sửa docs. Các bổ sung review/publication sau candidate này chỉ ghi metadata thực tế.

Hiện chưa có owner nghiệm thu màn UI nào. Hai approval không tự xác nhận merge hay deploy.

Đường đọc giải thích cho chủ dự án: workflow → config/runner → capture/metrics → report. Đã chuẩn bị hướng dẫn này; chưa nhận xác nhận chủ dự án đã đọc hoặc hiểu code.

## Tài nguyên và cleanup

Checkpoint cuối trước publication: C còn khoảng 182,50 GiB, D 92,24 GiB; không tạo WSL/Docker hay cài npm/browser. Evidence cuối giữ `candidate-02`; output thử cũ `development-01` + `candidate-01` có 92 files, tổng logical 2.883.552 bytes. Chủ dự án đã đồng ý xóa riêng hai thư mục này, nhưng lệnh native PowerShell bị bộ duyệt tự động từ chối với `blocked by policy`, kể cả sau xác minh đường dẫn và dùng literal paths. Chưa xóa, chưa có dung lượng thu hồi để báo; không đổi cách xóa để vượt chặn.

## Publication lần đầu — trước D5–D6

Đã push hai nhánh riêng theo D1, tạo PR và đọc lại remote refs/PR base/HEAD:

| Gói | Ref / xác minh | Đường dùng chung |
| --- | --- | --- |
| Công cụ | `workflow/stitch-ui-remake-code`, remote HEAD `340c903d60aa7f761cb05112ec75c81079350ee1`, base `main` | [PR #7](https://github.com/nguyentronglinh045/pos-cafe/pull/7) |
| Workflow/spec | `workflow/stitch-ui-remake-docs`, lần push đầu `e5e7b43c3550230f5f87a6a76308d3633246b20e`, base `docs`; metadata publication bổ sung sau đó | [PR #8](https://github.com/nguyentronglinh045/pos-cafe/pull/8) và [điểm bắt đầu](../workflow/stitch-ui-remake/README.md) |

Nhóm dùng tài liệu ở ref workflow docs và chạy công cụ ở ref workflow code, không mặc định chúng đã có trên `docs`/`main` trước merge. Hai PR đang OPEN; không merge hoặc gọi workflow deploy. POS light CI được GitHub tự kích hoạt cho push/PR code; trạng thái kiểm lúc ghi biên bản còn đang chạy, không coi kết quả unit/selftest local là CI PASS. Trạng thái CI mới nhất xem tại PR #7; các phép đo mới vẫn cần tự chạy theo môi trường của người dùng.

<a id="nguon-palette"></a>
## Nguồn palette — chuyển từ tài liệu vận hành theo D5

| Mốc | Bằng chứng và giới hạn |
| --- | --- |
| 2026-09-15T13:04:20.796Z | Chủ dự án chọn hướng A trong Claude session `fc10f114-32d6-4490-9e28-a8449ba009c3`; [artifact so sánh A/B/C](https://claude.ai/artifact/VS6wHCKPGXKsECrqw7TBa9) khớp ảnh đầu vào |
| Sau mốc chọn A | [Artifact A v1 sửa tương phản](https://claude.ai/artifact/CehuqcxnbUjA1MHXsjyBLH) đổi viền control thành `#7F8A9D`, primary-soft thành `#F0FDFA`; lúc đó chưa có xác nhận riêng cho v1 |
| 19/10/2026, D3–D4 | Chủ dự án xác nhận dùng A v1 đã sửa tương phản và Be Vietnam Pro cho workflow này; không duyệt mọi đề xuất breakpoint/MUI cũ |

Đây là nguồn quyết định đã truy hồi từ dữ liệu local, không xác nhận đã chạy lại artifact trực tuyến. Không công bố raw transcript hoặc private log path. Hợp đồng thực thi 22 màu/font nằm trong `ui-remake/` trên nhánh code; lịch sử và giới hạn truy hồi có một bản tại đây.

## Bổ sung D5–D6 — chuyển vị trí và quyền merge

Nguồn: chủ dự án yêu cầu “chuyển workflow vận hành, templates và hướng dẫn đo sang nhánh code; giữ spec và biên bản ở docs, cập nhật quy ước rồi push lại hai PR”, sau push kiểm kỹ và merge code→main, docs→docs. Đây là quyền merge riêng PR#7/#8 sau đủ gate, không mở quyền deploy hoặc sửa app UI.

Đã chuyển bản gốc `README.md`, `templates.md`, `palette.md`, `measurement.md` sang `ui-remake/`; docs giữ con trỏ và hồ sơ. Source links trong gói vận hành chuyển thành relative, CLI help chỉ tới hướng dẫn trong checkout. AGENTS/CLAUDE và chỉ mục trên docs quy định ngoại lệ tài liệu vận hành đi cùng công cụ. Source palette/fixture/font không đổi, code runtime chỉ đổi nội dung help.

CI của candidate cũ `340c903` đã SUCCESS cho cả push và PR; đó là lịch sử, không thay CI/kiểm thử của candidate D5–D6. Candidate mới, review, remote readback và kết quả merge được ghi tại checkpoint tiếp theo. Không nhận dữ liệu cũ thành PASS source mới.

### Kiểm chứng D5–D6 trước push lại

Code candidate **`0479955df65f24fd50bc011ef279ab25c5c9a7a4`**, checkout sạch; không có app source hay dependency/lockfile thay đổi. Chạy lại `npm run test:ui-remake`: **76/76 PASS**, 0 fail/skip, exit0. Chạy `npm run ui-remake:selftest -- --out artifacts/ui-remake/relocated-01`: **11/11 controls đúng**, 5PASS/6FAIL có chủ đích, 0ERROR, exit0. Môi trường giữ Node24.16.0/Playwright1.60.0/Chromium148.0.7778.96/Windows, không cài thêm gói/browser.

Report `artifacts/ui-remake/relocated-01/report.json` giữ source SHA **`8e976f83e1b40ee66d284e963d85b6b0f7730305ab927935648b3b99f58ad672`**; reference SHA `9cf839d41f8f7a4e67973f91a7402fb3d3b1a106227afecf0a3a75dab4e313d0` và contract SHA `76532f6fc530ecdfeb6ad306fe939c6c81478f3bc1c94082d1e9120b8a34723a` không đổi. `productAcceptance=NOT_ASSESSED`. Đã mở ảnh minimum-reference hiện tại, fixture vừa568×320; không dùng ảnh candidate cũ làm bằng chứng source mới.

Rà package source/docs: **18 Markdown files, 84 local/cross-branch links, 9 anchors và 22 palette tokens**, 0 lỗi; link cross-branch được đối chiếu hai candidate checkout, sẽ kiểm URL canonical sau merge. Không còn ba bản templates/palette/measurement trùng trên docs. CLI `--help` trỏ `ui-remake/README.md` tại checkout và URL main; `git diff --check` sạch. Font/provenance/palette/fixture bytes không đổi.

Merge recipe theo D6: kiểm remote HEAD khớp reviewed candidate, PR base7=`main`/8=`docs`, CI của candidate mới PASS và payload không chứa WIP khác; dùng merge có `--match-head-commit`, không admin override, không xóa nhánh. Đọc lại state/mergeSHA, xác nhận reviewed head là ancestor và merge tree khớp candidate trên từng base. Vercel `git.deploymentEnabled=false`, release/preview workflow chỉ workflow_dispatch; không dispatch trong task. Review mới và remote result được ghi sau checkpoint này.

### Review độc lập D5–D6

| Reviewer | Phạm vi/candidate | Verdict và phép kiểm độc lập |
| --- | --- | --- |
| `review_final_ui_code` | Code `0479955df65f24fd50bc011ef279ab25c5c9a7a4`, cross-links sang docs `334969b` | **APPROVE**, 49tests PASS/0fail/skip; 41links/22tokens đúng; kiểm lại report và hashes547sourcefiles/7referencefiles/config/contract/22actual-referencePNGs |
| `review_final_ui_workflow` | Code trên + docs `c57841032732c10d099122937d8ba0be86cf4158` | **APPROVE**, 73links/9anchors/22tokens trong15Markdown không lỗi; scope/canonical ownership/D5–D6/provenance đúng; mở ảnh minimum hiện tại |

Finding D5-F1: design.md còn câu vị trí workflow cũ. Đã sửa tại `c578410`, đồng bộ header AGENTS/CLAUDE phân biệt quy tắc chung và operator guides, P3 đọc D1–D6; reviewer xác nhận đóng. Delta này không đổi code hoặc link targets của code-review scope. Không còn finding chặn. Hai reviewer không sửa candidate, không thực hiện push/merge; bước hậu push/merge thuộc author theo D6. Metadata verdict/publication sau candidate không thay hợp đồng được review.

### Hậu push và thực thi D6

Đã đối chiếu remote HEAD code `0479955` / docs `e483573` với local sạch, PR#7 base=`main`, PR#8 base=`docs`, cả hai MERGEABLE; code diff27files chỉ package.json + ui-remake, docs diff14files chỉ Markdown. Hai base lúc kiểm là main536d8f6/docs132e9d6, không có WIP từ checkout gốc.

CI mới đúng code `0479955`: [push run39194921456](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/39194921456) và [PR run39194924395](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/39194924395) đều **SUCCESS** trước merge. Docs là nhánh Markdown không có workflow CI riêng; không giả đã chạy CI docs hoặc thay review bằng CI cũ.

PR#7 đã **MERGED vào main**, merge commit **`fc7d454979f049dcdb266e1e42dde4bd056ce9ff`**, dùng merge-commit và `--match-head-commit 0479955…`, không admin override. Đã fetch/readback origin/main: reviewed head là ancestor, tree **`6872977e3d05ed5ccb7ed6f3eca8ce2ee3120e48`** bằng đúng tree candidate. GitHub Contents API xác minh cả4operatorMD trên main có Git blobSHA đúng source; canonical links đã tồn tại.

Kết quả merge cuối và source sau kiểm readback của **cả hai PR** được ghi trong metadata GitHub: [PR#7](https://github.com/nguyentronglinh045/pos-cafe/pull/7), [PR#8](https://github.com/nguyentronglinh045/pos-cafe/pull/8) (`state`, `headRefOid`, `mergeCommit`, `mergedAt` và phần biên bản hậu merge). PR#8 chứa chính biên bản này: không tự ghi nó MERGED trước khi lệnh thực thi; metadata PR giữ kết quả cuối sau merge. Tác giả kiểm lại exacthead/base/tree/ancestry và canonical docs links sau push metadata cuối, không đưa thay đổi code hoặc acceptance mới vào vòng này.
