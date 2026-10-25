# Xây workflow remake UI từ Google Stitch — 19/10/2026

## Đề bài và trạng thái

- Người dùng đã làm rõ: task này tạo **workflow riêng cho dự án** để remake UI từ Stitch, có quy trình kiểm thử/đo độ khớp thiết kế và responsive thiết bị màn hình ngang. Không phải task triển khai A04. [Khảo sát link trước đó](stitch-ui-intake-2026-10-19.md) chỉ là ví dụ đầu vào, không là phạm vi màn đã được duyệt để sửa.
- Màu chủ đạo lấy từ hướng **A — Teal Chuẩn Hoá** trong trao đổi Claude; phải tìm lại nguồn thay vì lấy màu trực tiếp từ ảnh hay Stitch.
- Được phép: đọc nguồn dự án/lịch sử Claude liên quan, dùng subagent, soạn workflow và hồ sơ trên `docs`, tạo bộ đo chạy được và **push để nhóm dùng**. Không remake màn hoặc sửa application code trong task này.
- Trạng thái cuối sau D5–D6: **đã chuyển operator guides vào code, kiểm thử/review lại, push và MERGE đúng hai base**. [Workflow gốc trên main](https://github.com/nguyentronglinh045/pos-cafe/blob/main/ui-remake/README.md); [code PR #7](https://github.com/nguyentronglinh045/pos-cafe/pull/7) → main `fc7d454`, [docs PR #8](https://github.com/nguyentronglinh045/pos-cafe/pull/8) → docs `81e1f99`. Chưa remake/nghiệm thu UI app hoặc deploy.
- Code `D:/Workspace/pos-cafe`, `main`, HEAD `5156820f7d6679cd6f8051bdc38419737ffa0c7e`; docs `D:/Workspace/pos-cafe-docs`, `docs`, HEAD `2ad68003ca3de719c5dc4746a706dc600028dc2b`. Cả hai đã có nhiều thay đổi chưa commit từ công việc khác; chỉ bổ sung hồ sơ riêng và entry chỉ mục trong lượt này.

## Nguồn Claude đã tìm thấy — khảo sát trước quyết định cuối

Session local: `C:/Users/nguye/.claude/projects/D--Workspace-pos-cafe--claude-worktrees-pos-web-ui-ux-requirements-2b0ef7/fc10f114-32d6-4490-9e28-a8449ba009c3.jsonl`.

| Vị trí | Bằng chứng và giới hạn |
| --- | --- |
| JSONL dòng 183 | Link [so sánh A/B/C](https://claude.ai/artifact/VS6wHCKPGXKsECrqw7TBa9), ba hướng và mẫu thanh toán trùng ảnh người dùng gửi. Nội dung HTML còn tại dòng 171. |
| JSONL dòng 191, `2026-09-15T13:04:20.796Z` = 20:04 giờ Việt Nam | Người dùng: “tôi chọn A Teal Chuẩn Hoá nhé”. Xác nhận chọn hướng A; không suy thành phê duyệt mọi chi tiết tạo sau đó. |
| JSONL dòng 238 | [Bản A đầy đủ v1](https://claude.ai/artifact/CehuqcxnbUjA1MHXsjyBLH), có hiệu chỉnh tương phản; HTML tại dòng 218. Không thấy xác nhận riêng của người dùng cho toàn bộ v1. |
| [spec.md](../../ui-redesign/2026-09-15-huong-a/spec.md:3), [tokens.css](../../ui-redesign/2026-09-15-huong-a/assets/tokens.css:7) | Bản chi tiết còn lưu local. Spec vẫn ghi chờ chủ dự án duyệt, chưa triển khai. Đây là nguồn truy hồi, chưa tự chuyển thành chuẩn v1 đã duyệt. |

Không copy nguyên transcript hoặc dữ liệu không liên quan vào repo. Temp scratchpad gốc đã không còn; không tạo lại hay tải artifact để thay thế bằng chứng nguồn.

### Phân biệt A trong ảnh và A v1

| Vai trò | A trong ảnh so sánh | A v1 sau đó |
| --- | --- | --- |
| Nền app / bề mặt / bề mặt phụ | `#F4F6F9` / `#FFFFFF` / `#F8FAFC` | Giữ nguyên |
| Chữ chính / chữ phụ | `#16202F` / `#5B6678` | Giữ nguyên |
| Primary / chữ trên primary | `#0F766E` / `#FFFFFF` | Giữ nguyên |
| Đường phân cách | `#D5DCE6` | Giữ nguyên |
| Viền control | `#8A94A6` | `#7F8A9D` |
| Nền nhấn primary | `#EAF7F5` | `#F0FDFA` |
| Success / warning | `#15803D` / `#9A5B08` | Giữ nguyên |
| Hover / active primary | Chưa xác lập trong đoạn token A của bản so sánh | `#115E59` / `#134E4A`; active mới có ở thang màu, chưa có binding `:active` trong CSS v1 |
| Viền trạng thái primary | Chưa xác lập trong đoạn token A của bản so sánh | `#99F6E4` |
| Chữ nhấn / chữ cấp ba | Chưa xác lập trong đoạn token A của bản so sánh | `#414B5C` / `#667183` |
| Success-soft / warning-soft | Chưa xác lập trong đoạn token A của bản so sánh | `#ECFDF3` / `#FDF4E7` |
| Danger / danger-soft | Chưa xác lập trong đoạn token A của bản so sánh | `#B4251E` / `#FEF1F0` |
| Disabled nền / chữ / viền | Chưa xác lập trong đoạn token A của bản so sánh | `#EAEEF4` / `#667183` / `#D5DCE6` |

Claude nêu lý do chỉnh viền control và chữ cấp ba để tăng tương phản. Không lấy màu trung bình của screenshot làm mã token. Không coi các đề xuất Be Vietnam Pro, breakpoint, primitive hoặc loại bỏ MUI trong spec v1 là đã được người dùng duyệt chỉ vì đã chọn hướng màu A.

### Hiện trạng code về màu và font

[tailwind.posCafeStyles.ts:4](D:/Workspace/pos-cafe/tailwind.posCafeStyles.ts:4) đã có primary `#0F766E`, surface trắng và success `#15803D`, nhưng nền `#F5F7FA`, ink `#172033`, muted `#657286`, line `#D7DEE8`, warning `#B45309`, danger `#B91C1C` còn khác bảng A. Chưa có token `--line-control` trong root này. [AppProviders.tsx:20](D:/Workspace/pos-cafe/src/app/AppProviders.tsx:20) và plugin dùng Inter; bản A v1 đề xuất Be Vietnam Pro. Kết luận: **đã có đề xuất/token A trên docs, app chưa áp đầy đủ; chưa có căn cứ gọi toàn hệ A v1 là đã duyệt**.

## Kiểm thử hiện tại và khoảng trống

- [ui-audit/config.json:16](D:/Workspace/pos-cafe/ui-audit/config.json:16) có 16 state; ba viewport 1024×768, 1440×900, 844×390 tại dòng 146. Detector đo lỗi DOM thực, không đo fidelity với Stitch. `baseline.json` là tập finding key, không phải golden design; xem [run.mjs:473](D:/Workspace/pos-cafe/ui-audit/run.mjs:473).
- Config tại dòng 152 chỉ fail mức `error`; min target 24px, contrast 4.5 ở dòng 154–156. Audit exit 0 không chứng minh mọi warning, yêu cầu control hoặc độ khớp thiết kế đều đạt.
- Ảnh audit có annotation và thường chụp khi có finding; xem [run.mjs:480](D:/Workspace/pos-cafe/ui-audit/run.mjs:480). Không dùng ảnh annotate hay screenshot implementation tự tạo làm reference thiết kế độc lập.
- [playwright.config.ts:26](D:/Workspace/pos-cafe/playwright.config.ts:26) có bốn landscape viewport 1366×768, 1024×600, 844×390, 740×360, thêm portrait/demo; cùng Desktop Chrome. Đây là sampling cấu hình, không chứng minh support minimum hay mọi thiết bị/browser.
- Capture hiện chờ fonts và settle tại [run.mjs:442](D:/Workspace/pos-cafe/ui-audit/run.mjs:442), context mới/DPR1 tại dòng 417. Chưa khóa đầy đủ browser/OS/font thực, clock/fixture/date, locale/timezone, decode ảnh và animation cho design comparison.
- Standing rule [ui-audit/AGENTS.md:18](D:/Workspace/pos-cafe/ui-audit/AGENTS.md:18) đòi **23 findings và selftest OK**. Runner [run.mjs:293](D:/Workspace/pos-cafe/ui-audit/run.mjs:293) hiện cho range 18..30 cùng kiểm lớp lỗi/negative controls. Workflow phải ghi nhận chênh lệch, không suy chỉ `selftest OK` đã đủ standing rule.
- Đính chính nhận diện runtime: lockfile và module `playwright` mà bộ đo thực import đều1.60.0. Package `@playwright/test`1.62.1 thấy trong checkout dùng chung là package khác; không gán phiên bản đó cho runner. Final report ghi đúng module thực dùng.

## Hướng workflow đang chuẩn bị

1. Nhận link/project/node, đọc design và đối chiếu inventory màn/state/action/permission hiện có; lưu raw source cùng version/hash và các giới hạn truy cập.
2. Tạo **bản tham chiếu đã chuẩn hóa** theo palette/font được chốt, dữ liệu kiểm thử và các khác biệt nghiệp vụ đã duyệt. Giữ nguyên bản Stitch gốc và bản ghi mapping; không đổi hue toàn ảnh hoặc tự coi demo controls là yêu cầu sản phẩm.
3. Lập hợp đồng responsive bằng CSS viewport, quy tắc reflow/scroll/CTA/overlay và các trường hợp chiều cao thấp. Test mốc thiết bị, hai phía breakpoint và invariants; không tuyên bố vài screenshot đã bao phủ mọi kích thước.
4. Khi có task remake được giao: triển khai từng lát trong app, giữ dữ liệu/quyền/nghiệp vụ và định danh kiểm thử trừ thay đổi đã chốt riêng. Task hiện tại không tự cấp quyền remake A04.
5. Tách phép đo: geometry/typography/assets, semantic palette compliance, screenshot expected–actual–overlay/diff, DOM defects và business regression. Chụp lặp để đo nhiễu, dùng sai lệch đã biết để hiệu chuẩn; chốt ngưỡng sau pilot thay vì gọi tỷ lệ pixel là “% chính xác design”.
6. Evidence gắn đúng source/state/env/reference, ghi PASS/FAIL/chưa chạy/không có reference riêng. Viewport không có design được kiểm theo responsive contract, không có pixel fidelity giả.
7. Review độc lập theo quy trình hiện hành; không tự update audit baseline hoặc chấp nhận implementation golden/design reference để làm phép đo PASS.

Nguồn kỹ thuật để hoàn thiện phương pháp: [Playwright visual comparisons](https://playwright.dev/docs/test-snapshots), [toHaveScreenshot](https://playwright.dev/docs/api/class-pageassertions#page-assertions-to-have-screenshot-1), [W3C contrast](https://www.w3.org/TR/WCAG22/#contrast-minimum), [W3C reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow). Chỉ dùng để thiết kế phép kiểm thích hợp, không tuyên bố app đạt WCAG.

## Quyết định đã chốt ngày 19/10/2026

| Mã | Điểm đã hỏi | Câu trả lời trực tiếp của chủ dự án |
| --- | --- | --- |
| Q1 / D1 | Có triển khai bộ đo? | Chọn workflow chung kèm bộ đo chạy được, **phải push để người khác dùng**. |
| Q2 / D2 | Minimum landscape? | **568×320 CSS px**, gồm điện thoại ngang. |
| Q3 / D3 | Font? | **Be Vietnam Pro** đi cùng hướng A. |
| Q4 / D4 | Phiên bản A? | **A v1 đã hiệu chỉnh tương phản**. |

Q1–Q4 đã giải quyết trước triển khai công cụ. Đây là phê duyệt palette/font và phạm vi workflow; không duyệt mọi đề xuất breakpoint/primitive/MUI cũ hoặc reference/ngưỡng của một màn app cụ thể.

## Kết quả cuối và bàn giao

- Hai worktree sạch tách từ remote để không push dirty WIP hoặc15commit docs khác: code `D:/Workspace/pos-cafe-ui-workflow`, docs `D:/Workspace/pos-cafe-ui-workflow-docs`. Remote code `340c903d60aa7f761cb05112ec75c81079350ee1`; docs `b80b16bb6ddc3bc9b58f8e62456877bf84fc4a53` gồm candidate được review và metadata publication.
- `npm run test:ui-remake`: **76/76 PASS**,0fail/skip. CLI selftest **11/11 controls đúng** (5PASS,6FAIL có chủ đích), source cuối340c903. Node24.16.0/Playwright1.60.0/Chromium148.0.7778.96/Windows; không cài npm/browser. Tải0.53MiB font/OFL có provenance; không WSL/Docker.
- Hai reviewer `review_final_ui_code` và `review_final_ui_workflow` **APPROVE** phạm vi cuối; code reviewer tự chạy lại65testsPASS. F1/F2 tài liệu đã sửa và review lại. [Biên bản công khai](https://github.com/nguyentronglinh045/pos-cafe/blob/workflow/stitch-ui-remake-docs/docs/implementation-log/stitch-ui-workflow-2026-10-19.md) có fingerprint, kịch bản, findings và giới hạn. Evidence cuối giữ local `artifacts/ui-remake/candidate-02` ở worktree code.
- Checkpoint disk: C≈182.50GiB, D≈92.24GiB. Người dùng cho xóa development-01/candidate-01 (92files,2.75MiB logical), nhưng lệnh literal PowerShell vẫn bị bộ duyệt tự động chặn `blocked by policy`; chưa xóa và không nhận có thu hồi dung lượng.
- Task tiếp theo cần giao slice cụ thể và duyệt normalized reference/deviations/threshold; chưa có app UI/business/audit/device acceptance. Trạng thái CI remote theo PR#7, không lấy localPASS thay CI. Không merge/deploy hoặc updatebaseline.

## Closeout D5–D6 — trạng thái mới nhất

Chủ dự án giao chuyển workflow vận hành/templates/measurement và chuẩn palette/font sang code, giữ spec/quyết định/biên bản ở docs, cập nhật quy ước, push hai PR rồi kiểm kỹ và merge đúng base. Bốn Markdown gốc ở `ui-remake/`; docs chỉ giữ con trỏ, không giữ ba guide trùng. AGENTS/CLAUDE/quy ước hai nhánh đã cập nhật. Các mốc chỉ-push ở phần trên là lịch sử trước D6.

- Candidate code `0479955df65f24fd50bc011ef279ab25c5c9a7a4`: fresh **76/76tests PASS**,0fail/skip; selftest **11/11controls đúng**, report `artifacts/ui-remake/relocated-01`. Source SHA `8e976f83e1b40ee66d284e963d85b6b0f7730305ab927935648b3b99f58ad672`; môi trường không đổi, không cài gói/browser.
- Hai reviewer APPROVE final scopes: code0479955, docsc578410 cộng metadata sau đó. Review đóng finding câu ownership cũ; kiểm lại links/anchors/22tokens và evidence. Code reviewer tự chạy49tests PASS. Author kiểm18MD/84links/9anchors/22tokens,0errors.
- Hai CI đúng code0479955 **SUCCESS**: push39194921456, PR39194924395. Sau push kiểm remoteHEAD/base/diff/clean; code27files chỉ package.json+ui-remake, docs14files chỉMarkdown; không gom WIP khác.
- PR#7 **MERGED main** `fc7d454979f049dcdb266e1e42dde4bd056ce9ff`, head0479955; PR#8 **MERGED docs** `81e1f99bc61a2138070245b820d5a058083d439c`, headf377bd9d79550c33d6dc296844770881b994abf8. Dùng merge-commit + match-head guard, không admin override/xóa nhánh.
- Postmerge fetch/readback: hai candidateheads là ancestors, tree main `6872977e3d05ed5ccb7ed6f3eca8ce2ee3120e48`, docs `a19495d4191c66d3a921d22c846b25b4478c0ec4`, đều bằng tree candidate. GitHub Contents API xác minh4operatorMDmain+5docsrules/recordfiles; thư mục operator cũ trên docs chỉ cònREADMEpointer. PR bodies đã lưu biên bản hậu merge, source/merge/tree hashes.
- Main postmerge CI **`39195334171` SUCCESS** trên đúng merge commitfc7d454, đã đọc kết quả riêng và cập nhật vào biên bản hậu merge ở hai PR. Không deploy; vercelGitdeploymentdisabled/manualreleasegiữnguyên. Local dirty worktrees gốc không checkout/pull/merge tự động; chỉ sửa đúng quy ước/handoff liên quan. Source mới dùng remote main/docs hoặc worktree sạch đã tạo.
- Disk sau lượt C≈182.47GiB,D≈92.24GiB; final evidence giữ. Haioutputcũ từng được cho xóa vẫn chưa xóa do bộ duyệt tự động chặn trước đó; không lặp lệnh hay nhận có thu hồi dung lượng.
