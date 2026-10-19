# Test plan workflow và bộ đo

Đây là tooling/process, không có use case sản phẩm mới. Command đầy đủ và candidate thực được lưu ở biên bản cuối; không suy test cấu hình là execution.

## Thiết lập và cách chạy từng case

Mã chuẩn là **TC-SUI-01 … TC-SUI-16**, tương ứng alias **T01 … T16** trong bảng expected và [traceability](traceability.md). Mỗi hàng bên dưới là một case; truy vết requirement theo bảng đó, không có use case sản phẩm mới.

Tiền điều kiện dùng chung:

- **P0:** checkout code chứa `ui-remake/`, ghi HEAD/dirty state; Node và module Playwright/browser đã có theo [measurement](../../../docs/workflow/stitch-ui-remake/measurement.md). Không tải thêm dependency từ test.
- **P1:** P0 + Chromium chạy được, font local còn nguyên provenance; fixture/test tự tạo context và đóng browser. Không có DB hoặc dữ liệu kinh doanh.
- **P2:** P0 + folder output mới trong `artifacts/ui-remake/`, đủ budget; synthetic HTTP server của integration tự chọn loopback port và đóng khi xong.
- **P3:** checkout docs candidate và code candidate xác định; đọc workflow/palette/templates/measurement, D1–D4 và nguồn của kịch bản. Không triển khai app khi forward-test.

Các bước áp dụng **cho từng case**: **1.** Dựng tiền điều kiện và dữ liệu ở hàng tương ứng. **2.** Chạy file kiểm thử được chỉ ra bằng `node --test <file>`; với case review, thực hiện walkthrough/đối chiếu ở bảng expected thay vì giả runtime test. **3.** Đối chiếu expected của case, ghi lệnh/exit/count hoặc verdict cùng giới hạn vào [biên bản](../../../docs/implementation-log/stitch-ui-workflow-2026-10-19.md). T10 dùng lệnh CLI riêng; T11 đọc artifacts T10; T16 chỉ push sau đủ approval, rồi đọc remote SHA.

Các đường dẫn test sau thuộc [nhánh code, thư mục ui-remake](https://github.com/nguyentronglinh045/pos-cafe/tree/workflow/stitch-ui-remake-code/ui-remake). Có thể lọc test cụ thể bằng `node --test --test-name-pattern '<tên>' <file>`; không nhận ca bị lọc/skip thành coverage đã chạy. `npm run test:ui-remake` chạy toàn bộ 76 tests ở candidate ghi trong biên bản.

| Mã / alias | Mức | Tiền điều kiện | Dữ liệu thử cụ thể | Nơi hiện thực / cách tái hiện |
| --- | --- | --- | --- | --- |
| TC-SUI-01 / T01 | E2E, walkthrough quy trình | P3 | Node A04 từ link Stitch của chủ dự án; kịch bản roster trước PIN chỉ có `id/name`, design có role filters/QA toolbar | Workflow mục 1–2, templates intake; biên bản mục Forward-test ghi mismatch và quyết định không mở rộng |
| TC-SUI-02 / T02 | Đơn vị + walkthrough | P0/P3 | Actual/reference cùng `http://127.0.0.1:5173`; hash `reference-hash` đổi thành `modified-reference`; reference approval còn đề xuất | `config.test.mjs`: `screen remake cannot take own implementation as reference`; `run.test.mjs`: `approval binds reference content and the measurement contract`; workflow mục 3 |
| TC-SUI-03 / T03 | Đơn vị | P0 | Ratio 0→1, width 568→844, selector `button`→`body`, clock 19→20/10, browser absent→`firefox`, recipe `mock-local`→`different source` | `run.test.mjs`: sáu tests `changed … invalidates stored approval`, test metadata/title và missing approver/date |
| TC-SUI-04 / T04 | Đơn vị | P0 | RGBA 2×1; ảnh 100×100 đổi 1 pixel trong critical region; channel threshold 0/9/10/255; ratio 0/0,5 | `metrics.test.mjs`: nhóm `identical RGBA`, `one changed critical pixel`, `channel threshold`, `ratio gates`, `region indexing` |
| TC-SUI-05 / T05 | Đơn vị | P0 | x lệch 0,25; từng x/y/width/height lệch2 với tolerance1/2; font/color sai; anchor thiếu/thừa/duplicate; geometry NaN/Infinity | `metrics.test.mjs`: nhóm `geometry`, `missing and extra anchors`, `every expected typography`, `anchor arrays reject` |
| TC-SUI-06 / T06 | Đơn vị | P0 | 568×320 hợp lệ; 320×568, height 319, remote `https://example.com`, credentials synthetic, 32×3840×2160, region x560+width20 trên width568 | `config.test.mjs`: minimum, `rejects …`, containment; dữ liệu không gọi URL remote thật |
| TC-SUI-07 / T07 | Giao diện | P1 | Arial không có declared face; face `NoSuchFontFace-7654321` chưa load; Regular.ttf với chữ `Tiếng Việt`; family đầu đổi sang Arial | `capture.test.mjs`: `system fallback`, `declared Be Vietnam Pro`, `declared face that has never loaded` |
| TC-SUI-08 / T08 | Giao diện | P1 | Target 31×32 với min32; 32×32 đúng biên; overlay trong suốt trên nút96×40; document rộng569/570 tại viewport568; nested scroll position35/30 | `capture.test.mjs`: nhóm overflow/tiny/covered/below-fold/nested; CLI control `detect-occlusion` dùng overlay pixel-identical |
| TC-SUI-09 / T09 | Giao diện + review tích hợp | P1/P3 | `data:image/png;base64,not-an-image`; img src rỗng; `.many` khớp2, `#missing` khớp0, `#hidden` displaynone; SVG10×10 hợp lệ | `capture.test.mjs`: ba tests `stabilize …`. Đối chiếu thêm `run.mjs` phần so hai PNG byte-identical; chưa chạy mutation JavaScript gây capture không ổn định, không nhận subcase này là runtime PASS |
| TC-SUI-10 / T10 | E2E công cụ | P2 | `examples/selftest.json`: 11 cases, năm positive và sáu negative ở bảng expected | `npm run ui-remake:selftest -- --out artifacts/ui-remake/<NEW-ID>`; `fixtures/payment.html`; report ghi `kind:selftest` |
| TC-SUI-11 / T11 | E2E, kiểm evidence | P3 + T10 có report | `candidate-02/report.json`, `.md`, `minimum-reference.png`, `detect-palette-diff.png`; SHA của source/ref/contract trong biên bản | Mở JSON/Markdown và ảnh, đối chiếu source/env/count; biên bản mục Bằng chứng candidate cuối |
| TC-SUI-12 / T12 | Tích hợp + review guard | P2/P3 | Synthetic actual/reference HTTP568×320, output đã có; parent output junction; approval ratio0→0,1; input actual.normalizationCss | `run.integration.test.mjs` thực chạy plan/approval/output/changedgate; `run.mjs` từ chối actual normalization và so source/ref trước–sau. Drift và actual-normalization path là đối chiếu source, không giả đã chạy mutation CLI |
| TC-SUI-13 / T13 | E2E, walkthrough quy trình | P3 | Chỉ có bitmap, chưa có reference568×320, checkout không có `ui-audit/` | Workflow mục3/4/7 và measurement mục3/6; biên bản Forward-test ghi fidelity chưa đánh giá và audit NOT_RUN, không lấy selftest thay gate |
| TC-SUI-14 / T14 | Tích hợp, review payload | P3 | Diff chỉ `ui-remake/`, package aliases và docs đã liệt kê; 4TTF+OFL; 22 màu; Claude session ID/artifact links, không rawJSONL/private path | `git diff --name-only <base> HEAD`, CLI `--help`; kiểm local Markdown links, palette table so JSON và font provenance; lưu verdict reviewer |
| TC-SUI-15 / T15 | E2E, walkthrough responsive | P3 | Minimum568×320;844×390;1024×600/768;1440×900;1920×1080; ultrawide và mỗi breakpoint±1 khai báo cho slice | Workflow mục4 và templates viewport; kiểm CTA/scroll/touch/focus, state dài; task này chỉ kiểm hợp đồng và fixtures, chưa chạy ma trận app/thiết bị thật |
| TC-SUI-16 / T16 | Tích hợp, review/phát hành nhánh | P3 + hai reviewer đủ scope | Code `340c903…`, docs candidate cuối; refs `workflow/stitch-ui-remake-code` và `workflow/stitch-ui-remake-docs` | Biên bản ghi hai verdict; `git push origin <branch>` đúng ref, `git ls-remote --heads origin <branch>` khớp local HEAD; PR code→main và docs→docs, không merge |

## Bước và expected theo từng case

| TC | Steps/dữ liệu | Expected |
| --- | --- | --- |
| T01 | Đối chiếu rawStitch có role filters trướcPIN với roster id/name | Intake ghi mismatch, không tạo role fields/API/màn mới; workflow templates chứa deviation/authorization |
| T02 | Review raw/normalized/referenceApproval và template | Hai nguồn tách biệt; actual không làm reference; source/contract hashes được owner bind |
| T03 | Unit đổi reference hash, threshold, selector, viewport, clock, browser sau approval | Mọi thay đổi tác động contract đều invalidate approval; title/metadata không tạo hash đệ quy |
| T04 | Metrics equality,1pixel tại vùng critical trên ảnh phần lớn bằng nhau, alpha/channel boundaries | Count/mẫu số đúng; critical fail dù whole ratio nhỏ; threshold/region boundary đúng |
| T05 | Anchors đổi từng x/y/w/h, font/color, thiếu/thừa/duplicate/nonfinite | Có finding tương ứng; max geometry delta; invalid input không được giảm coverage |
| T06 | Config portrait,319pxheight,568×320minimum, duplicateid, region ngoàiảnh, credentials/remoteURL, huge matrix | Minimum hợp lệ; invalid bị từ chối trước capture/ghi vô hạn |
| T07 | Browserfixture normal, fallback/unloaded font, font đã load từ BeVietnamProTTF | Font gate chỉ PASS khi declared/loaded và firstfamily của anchors đúng |
| T08 | Transparent overlay pixel-identical,20pxcontrol, offscreen dưới fold, nestedscroll, root/internal overflow | Overlay/tiny/rootoverflow FAIL; control reachable sau scroll và internalcanvas hợp lệ không bị nhận sai; scroll phục hồi |
| T09 | Brokenimage, missing/duplicate/hiddenready, changingcapture | ERROR/block, không coi là tín hiệu fidelity pass; decode/readiness cần đủ |
| T10 | CLI selftest11case:5positive(min568,phone844,tablet1024,desktop1440,longVietnamese) và6negative | Đối chứng PASS khi5casePASS,6caseFAIL đúng lý do; không ERROR/SKIP; productAcceptance NOT_ASSESSED |
| T11 | Read final JSON/MD + mở ảnh reference/actual/diff/overlay | Count,thresholds,geometry,tokens,font,source/env/contract có thật; ảnh sạch, ảnhdiff nêu vùnglệch |
| T12 | Run output path đã tồn tại; kiểm source/reference drift; actualnormalization; missingapproval | Không overwrite/source mutation; actual không bị recolor để che lỗi; drift/error không PASS |
| T13 | Forward-test workflow trên tình huống đầu vào Stitch và nguồn chưa đủ/missingaudit | Agent tạo đúng intake/plan; không remake app/tự duyệt threshold; NOT_RUN của productgate không biến PASS |
| T14 | Review public payload paths/diff/license/links/code-docs split, commandhelp | Không privateClaude/rawlogs/secrets/unrelateddirty changes; tài liệu dùng được từ clone/branch rõ |
| T15 | Review responsive matrix beyond min + breakpoint±1/browsers/zoom/touch/CTA rules | Phạm vi/ngoại lệ/mẫu số rõ; không gọi sampling bằng mọi thiết bị; viewport chưa códesign không cófidelity giả |
| T16 | Hai reviewer độc lập kiểm candidate; push/readback branches/PR | Cả hai APPROVE phạm vi; push đúng source reviewed, no merge/deploy; remote SHA khớp |

T04–T09 có unit/browser controls; T10–T12 có CLI/integration và phần guard review ghi rõ ở bảng hiện thực. Không suy code review thành một mutation runtime đã chạy. T01/T02/T13/T14/T15 có review kịch bản/quy trình. Không chạy flow tài chính/DB trên production để chứng minh task tooling. Gate build/unit/smoke/ui-audit sản phẩm chỉ áp khi task remake thật sửa UI; lượt này không có app UI change.
