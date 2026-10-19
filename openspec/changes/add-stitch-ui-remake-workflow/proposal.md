# Workflow remake UI từ Google Stitch

Ngày: 19/10/2026. Phạm vi đã được người dùng giao: workflow chung Codex/Claude, bộ đo chạy được và push để nhóm dùng; bổ sung D5–D6 cho vị trí tài liệu vận hành và merge đúng hai nhánh sau kiểm chứng. Đây là thay đổi **quy trình/công cụ**, không đổi hành vi ứng dụng; bỏ `usecases.md` theo SPEC-STANDARD, giữ testplan và traceability. Phân mức review nhạy cảm về **quy trình nghiệm thu**, không phải quyền thực thi tài chính hay quyền triển khai UI.

## Vấn đề và kết quả

Ảnh/mockup Stitch chưa tự là yêu cầu nghiệp vụ hoặc chuẩn màu của dự án. Audit DOM hiện có không đo fidelity; ảnh implementation tự nhận làm expected chỉ chứng minh hồi quy. Cần pipeline từ nguồn độc lập → reference được chuẩn hóa/duyệt → UI thực tế, với bằng chứng tách biệt.

Đầu ra vận hành ở [ui-remake/ trên nhánh code](https://github.com/nguyentronglinh045/pos-cafe/blob/main/ui-remake/README.md): workflow, templates, chuẩn palette/font, hợp đồng đo và executable. Spec, quyết định và biên bản ở `docs`. Không remake A04 hay màn khác trong task này, không sửa API/DB/permissions hoặc deploy. D6 cho phép merge PR #7 vào `main` và PR #8 vào `docs` sau kiểm tra/review; không trộn hai nhánh với nhau.

## Câu hỏi phải chốt trước khi làm

Không còn câu hỏi chặn trong phạm vi workflow và công cụ này: Q1–Q4 đã được chủ dự án trả lời, ghi thành D1–D4 bên dưới trước khi triển khai. Reference, deviations, viewport bổ sung và threshold của từng màn được chốt trong task remake tương ứng; chưa giao màn nào ở đây.

## Quyết định đã chốt

Nguồn: câu trả lời trực tiếp của chủ dự án ngày19/10/2026 trong chat tạo workflow; user yêu cầu “phải pushs workflow để người khác có thể dùng”.

| ID | Quyết định và lý do | Phương án không chọn / hệ quả |
| --- | --- | --- |
| D1 | Workflow + bộ đo chạy được, dùng chung Codex/Claude và push nhánh review | Chỉ tài liệu không đủ mục tiêu đo có thể tái hiện. Push không tự cấp quyền merge/deploy. |
| D2 | Hỗ trợ thiết kế responsive landscape từ568×320CSSpx | Không giới hạn tablet; sampling không chứng minh mọi kích thước/thiết bị vật lý. |
| D3 | Font Be Vietnam Pro | Không giữ Inter làm chuẩn. Reference phải chuẩn hóa font để sai lệch đúng chủ đích không bị chấm sai. |
| D4 | Palette A v1 đã chỉnh tương phản | Không dùng nguyên A của ảnh ban đầu. Quyết định này không phê duyệt mọi breakpoint/primitive/MUI migration trong proposal Claude cũ. |
| D5 — 19/10/2026 | Chủ dự án yêu cầu chuyển workflow vận hành, templates, palette/font và hướng dẫn đo vào nhánh code, cạnh `ui-remake/`; spec và biên bản vẫn trên `docs` | Thay cách tách hoàn toàn tài liệu khỏi code. Hướng dẫn gắn phiên bản công cụ, có một bản gốc; `docs` chỉ giữ liên kết. Quy ước hai nhánh được cập nhật tương ứng. |
| D6 — 19/10/2026 | Chủ dự án giao push lại hai PR, kiểm kỹ sau push rồi merge code→`main`, docs→`docs` | Thay giới hạn chỉ-push ban đầu cho đúng hai PR này. Giữ final candidate review, CI, kiểm remote và ranh giới payload; không cho phép deploy hoặc gom dirty WIP khác. |
| D7 — 19/10/2026 | Sau rà readiness, chủ dự án giao làm nốt CI và publish ui-audit, kiểm kỹ rồi push/merge đúng code→main, docs→docs; pilot màn thật để task riêng | Thêm CI chạy tests/calibration và xuất bản audit tương thích main. Không nhập feature phân quyền WIP, đổi baseline, sửa app UI, deploy hoặc tiến hành pilot Stitch→màn thật. |

Routine implementation choices của AI trong phạm vi công cụ: zero npm dependencies mới; tái dùng Playwright; local HTML reference, browser RGBA comparison, explicit thresholds; source/contract hash trước chạy; output mới, không tự overwrite baseline. Chọn hai worktree sạch từ origin/main và origin/docs, không đưa dirty WIP hoặc15commit docs khác vào gói push.

## Tác động, giới hạn

- Code chỉ thêm tool, fixtures tổng hợp, font có giấy phép và script aliases. Font/palette tương lai không tự thay toàn app hiện tại.
- Công cụ v1 chụp HTML local, không tự import bằng API Stitch, không tự tạo normalized reference từ actual, không đo bitmap trực tiếp như một DOM reference.
- Mọi gate sản phẩm hiện hành giữ nguyên. Nếu `ui-audit` còn vắng trong checkout published, ghi NOT_RUN và chưa nghiệm thu UI thực. Selftest của tool không thay gate đó.
- Ma trận browser và ngưỡng mỗi màn chốt trong task remake thực tế; không đặt “95% giống” chung. Chromium là môi trường kiểm tool hiện tại; không giả PASS WebKit/Firefox hoặc real device.

Liên kết: [requirements](specs/stitch-ui-remake/spec.md), [design](design.md), [tests](testplan.md), [traceability](traceability.md), [tasks](tasks.md).

## Slice D7 — đầu vào và ranh giới thực thi

Readiness đã xác minh mainfc7d454/docs81e1f99: tests ui-remake hiện chỉ có lệnh local, CI9phases không chọn chúng; ui-audit chưa publish; chưa có màn thật được remake. D7 giải quyết hai điểm đầu. Workflow/spec vẫn giữ ở đúng nhánh theo D5.

Routine choices trong quyền D7: thêm3phase sau browser (ui-tools tests, remake calibration, audit calibration), không đổi gate warning/error của audit; port audit phải do runner sở hữu. Giữ baseline lịch sử nguyên trạng có fingerprint và nguồn Git, không nhận baseline permission mới. Chọn13state tương ứng source main và3viewport legacy; ba state phụ thuộc unpublished permissioncomponents được ghi chưa áp dụng. Không còn câu hỏi nghiệp vụ chặn phần này; threshold/ngoại lệ của màn remake thật vẫn để pilot/task riêng.

Hash package.json trong release policy đã lệch từ lần thêm aliases trước; slice này đồng bộ đúng canonical bytes của các file được review thay vì refresh hàng loạt từ checkout CRLF. Không đổi owner, environment protection, allowedbranch hoặc productionEnabled=false.
