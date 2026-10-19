# Workflow remake UI từ Google Stitch

Ngày: 19/10/2026. Phạm vi đã được người dùng giao: workflow chung Codex/Claude, bộ đo chạy được và push để nhóm dùng. Đây là thay đổi **quy trình/công cụ**, không đổi hành vi ứng dụng; bỏ `usecases.md` theo SPEC-STANDARD, giữ testplan và traceability. Phân mức review nhạy cảm về **quy trình nghiệm thu**, không phải quyền thực thi tài chính hay quyền triển khai UI.

## Vấn đề và kết quả

Ảnh/mockup Stitch chưa tự là yêu cầu nghiệp vụ hoặc chuẩn màu của dự án. Audit DOM hiện có không đo fidelity; ảnh implementation tự nhận làm expected chỉ chứng minh hồi quy. Cần pipeline từ nguồn độc lập → reference được chuẩn hóa/duyệt → UI thực tế, với bằng chứng tách biệt.

Đầu ra: [workflow](../../../docs/workflow/stitch-ui-remake/README.md), mẫu hồ sơ, chuẩn palette/font, hợp đồng đo; executable `ui-remake/` trên nhánh code. Không remake A04 hay màn khác trong task này, không sửa API/DB/permissions, không deploy hoặc merge vào main.

## Quyết định đã chấp nhận

Nguồn: câu trả lời trực tiếp của chủ dự án ngày19/10/2026 trong chat tạo workflow; user yêu cầu “phải pushs workflow để người khác có thể dùng”.

| ID | Quyết định và lý do | Phương án không chọn / hệ quả |
| --- | --- | --- |
| D1 | Workflow + bộ đo chạy được, dùng chung Codex/Claude và push nhánh review | Chỉ tài liệu không đủ mục tiêu đo có thể tái hiện. Push không tự cấp quyền merge/deploy. |
| D2 | Hỗ trợ thiết kế responsive landscape từ568×320CSSpx | Không giới hạn tablet; sampling không chứng minh mọi kích thước/thiết bị vật lý. |
| D3 | Font Be Vietnam Pro | Không giữ Inter làm chuẩn. Reference phải chuẩn hóa font để sai lệch đúng chủ đích không bị chấm sai. |
| D4 | Palette A v1 đã chỉnh tương phản | Không dùng nguyên A của ảnh ban đầu. Quyết định này không phê duyệt mọi breakpoint/primitive/MUI migration trong proposal Claude cũ. |

Routine implementation choices của AI trong phạm vi công cụ: zero npm dependencies mới; tái dùng Playwright; local HTML reference, browser RGBA comparison, explicit thresholds; source/contract hash trước chạy; output mới, không tự overwrite baseline. Chọn hai worktree sạch từ origin/main và origin/docs, không đưa dirty WIP hoặc15commit docs khác vào gói push.

## Tác động, giới hạn

- Code chỉ thêm tool, fixtures tổng hợp, font có giấy phép và script aliases. Font/palette tương lai không tự thay toàn app hiện tại.
- Công cụ v1 chụp HTML local, không tự import bằng API Stitch, không tự tạo normalized reference từ actual, không đo bitmap trực tiếp như một DOM reference.
- Mọi gate sản phẩm hiện hành giữ nguyên. Nếu `ui-audit` còn vắng trong checkout published, ghi NOT_RUN và chưa nghiệm thu UI thực. Selftest của tool không thay gate đó.
- Ma trận browser và ngưỡng mỗi màn chốt trong task remake thực tế; không đặt “95% giống” chung. Chromium là môi trường kiểm tool hiện tại; không giả PASS WebKit/Firefox hoặc real device.

Liên kết: [requirements](specs/stitch-ui-remake/spec.md), [design](design.md), [tests](testplan.md), [traceability](traceability.md), [tasks](tasks.md).
