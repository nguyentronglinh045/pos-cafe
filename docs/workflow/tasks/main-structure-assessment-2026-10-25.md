# Đánh giá cấu trúc thư mục main — 25/10/2026

## Phạm vi và nguồn

Yêu cầu: “bạn đánh giá cấu trúc thư mục hiện tại của dự án này ở nhánh main ?”.
Đây là khảo sát và đề xuất, chưa phải quyết định refactor hay xóa thêm code.

Nguồn chính: commit `711a22e71983e3d6aa17799649af05ce4c762555`, trùng `origin/main` và remote main tại thời điểm kiểm bằng `git ls-remote`.
Đọc và chạy kiểm tra tại checkout sạch `D:/Workspace/pos-cafe-permission-timeonly-20261022/code`.
Checkout `D:/Workspace/pos-cafe` đang ở local main `5156820f7d6679cd6f8051bdc38419737ffa0c7e`, có 553 dòng trạng thái chưa commit, chậm hơn remote main 131 commit. Không dùng trạng thái WIP đó để đại diện cho cấu trúc main đã tích hợp.
Quy tắc: đọc AGENTS.md/CLAUDE.md/workflow/SPEC-STANDARD từ nhánh docs; local docs có các commit dọn kho lưu trữ mới hơn origin/docs. Skill supabase được đọc cho phần adapter/backend; không thao tác database.

## Nhận định

Kiến trúc ứng dụng có nền tốt. Điểm cần chuẩn hóa rõ nhất là cách tổ chức tooling và cấu hình test; sau đó là ranh giới trách nhiệm giữa các feature. Chưa thấy bằng chứng cần thay mô hình kiến trúc hiện có.

Các số đếm dưới đây chỉ tính file đã được Git theo dõi tại nguồn trên, không tính cache, node_modules, báo cáo ngoài repo hay các thư mục worktree cũ.

| Khu vực | Hiện trạng |
| --- | --- |
| Toàn repo | 1.185 file |
| File ngay root | 68; gồm 32 cấu hình Vitest và 20 cấu hình Playwright |
| src | 336 file; 113 file test TS/TSX, 217 TS/TSX không phải test |
| scripts | 298 file; 297 nằm trực tiếp trong scripts; 266 tên bắt đầu permission-; 76 file test |
| tests | 182 file: contracts 98, supabase 38, permissions 23, ui-remake 17, smoke 4, operator 2 |
| Backend | supabase có migrations 17, candidate 11, functions 3 |
| Tooling/UI references | ui-remake 42, ui-audit 17, UI-Design-Google-Stitch-Week01 45 |

### Phần nên giữ

- Phân tầng `domain / core / ports / features / adapters / app` có hướng phụ thuộc rõ. Nơi ghép adapter tập trung ở [runtimePorts.ts](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/src/app/runtimePorts.ts:24). Boundary tests dùng AST kiểm import của src và tests, bao gồm các luật giữa tầng tại [architectureBoundaries.test.ts](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/src/architectureBoundaries.test.ts:129).
- Unit test đặt gần code; integration/contract/browser được tổ chức riêng trong tests. Không có lý do gom tất cả vào một thư mục chỉ để trông đồng nhất. [vitest.config.ts](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/vitest.config.ts:10) chỉ include src tests cho suite mặc định.
- Backend, UI audit và UI remake có khu vực riêng; hướng dẫn vận hành nằm cạnh tool đúng mô hình hai nhánh. Specs và hồ sơ chung tiếp tục ở docs. [ui-remake/README.md](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/ui-remake/README.md:3).
- Code UI thanh toán đã chia thành panes/helpers/hooks; không nên mô tả toàn bộ UI là monolith. [PaymentDrawer.tsx](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/src/app/drawers/pos/PaymentDrawer.tsx:15).

### Những điểm nên cải thiện, theo thứ tự

1. **Tooling và config quá phẳng.** 52 cấu hình test tại root cùng 298 file scripts làm việc tìm đúng entry point và biết tool nào còn đang dùng khó hơn. Có cả công cụ CI tái dùng và script gắn một đợt chạy cụ thể: [permission-release-phase-admission.mjs](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/scripts/permission-release-phase-admission.mjs:4) dùng đường dẫn workspace và thời hạn cố định. Đề xuất lập bảng entry point/consumer/lifecycle trước, rồi gom theo CI, permissions và các phase vận hành; gom config chuyên biệt theo Vitest/Playwright nếu phù hợp. Phải cập nhật npm/CI/import/đường dẫn tương đối và manifest liên quan, giữ nguyên tập test được chạy. Không suy script thừa chỉ từ tên/ngày hoặc thiếu import tĩnh. CI hiện vẫn gọi scripts, ví dụ [.github/workflows/ci.yml](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/.github/workflows/ci.yml:33).

2. **Helper dùng chung nằm dưới POS.** [useAdminData.ts](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/src/features/admin/useAdminData.ts:3) import usePurposeQuery từ pos; helper generic ở [usePosData.ts](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/src/features/pos/usePosData.ts:8). Admin cũng lấy helper ngày từ [reportHelpers.ts](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/src/features/admin/reportHelpers.ts:3). Đây là điểm sở hữu trách nhiệm chưa rõ, không phải bằng chứng lỗi runtime. Khi refactor được duyệt, chuyển phần query thật sự dùng chung vào shared và xác định rõ nơi chứa logic report/history; không biến shared thành kho chứa mọi thứ.

3. **Nhóm admin chứa nhiều capability.** Menu, floor, employees, reports, history và settings đang cùng nhóm feature/drawer admin. Có thể chia nhỏ theo nghiệp vụ khi sửa phần tương ứng, vẫn giữ các tầng hiện tại. ReportDrawer khoảng 506 dòng, OrderHistoryDrawer 501, FloorEditorDrawer 441 là tín hiệu đọc trách nhiệm, không tự chứng minh cần tách. ReportDrawer còn dùng query/history helpers từ POS tại [ReportDrawer.tsx](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/src/app/drawers/admin/ReportDrawer.tsx:9).

4. **Bề mặt runtime hiện hành và tương thích cũ cần dễ nhận diện.** AppPorts/LegacyAppPorts đã phân biệt tại [ports/index.ts](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/src/ports/index.ts:154), và legacy factory có mục đích contract-test tại [repos.ts](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/src/adapters/supabase/repos.ts:30). Tuy vậy tên newPermissionRuntime và chú thích “candidate-only ... production runtime” tại [newPermissionRuntime.ts](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/src/adapters/supabase/newPermissionRuntime.ts:14) dễ gây nhầm khi định hướng. Nên làm rõ namespace/entry point và consumer trước khi cân nhắc đổi tên hoặc nghỉ dùng; không xóa legacy theo tên.

5. **Tra cứu entry point/tool/suite có thể rõ hơn.** Main không có root README được theo dõi; tài liệu dự án cố ý nằm trên docs. Dùng điểm vào docs/README.md hiện có, bảng lớp trong docs/architecture.md và bảng lệnh CLAUDE.md; bổ sung mapping entry point/tool/suite/consumer và liên kết đến guide cạnh tool trên main. Không sao chép specs hay hướng dẫn dự án vào main. Các thư mục thiết kế/tham chiếu chỉ được di chuyển sau khi kiểm consumer, chưa được phân loại là rác.

## Hướng đề xuất

Ưu tiên 1: làm rõ bản main dùng để phát triển và phần WIP cần giữ; khảo sát consumer tooling/config, lập mapping trước–sau.
Ưu tiên 2: chuẩn hóa scripts và config theo nhóm nhỏ, giữ entry point tương thích nếu cần; kiểm tương đương các suite và guard.
Ưu tiên 3: chỉnh shared query helpers và trách nhiệm reporting/history; tách component theo trách nhiệm khi có nhu cầu.
Giữ kiến trúc Ports & Adapters; chưa đề nghị rewrite, monorepo, xóa legacy hay chuyển hàng loạt thư mục.
Đây là đề xuất của AI dựa trên code ngày 25/10/2026, chưa phải phương án được chủ dự án duyệt triển khai. Khác với nhiệm vụ dọn thư mục ngoài repo đã hoàn tất.

## Kiểm chứng và giới hạn

- Lệnh: `node node_modules/vitest/vitest.mjs run src/architectureBoundaries.test.ts --reporter=verbose`.
- Cwd: `D:/Workspace/pos-cafe-permission-timeonly-20261022/code`.
- Nguồn: commit sạch 711a22e71983e3d6aa17799649af05ce4c762555; dùng dependency hiện có, Vitest 4.1.11.
- Thời điểm log: 19:36:39 ngày 25/10/2026 (Asia/Bangkok); exit 0; 1 file test, 5 test passed, không fail/skip.
- Log: `D:/Workspace/pos-cafe-archive/_assessments/main-structure-20261025/architecture-boundaries.log`.
- Chỉ chứng minh các luật import trong bộ kiểm này đạt; không chứng minh mọi phụ thuộc ngữ nghĩa, hành vi ứng dụng, E2E, database, deploy hay coverage toàn bộ.
- Không cài dependency, không chạy backend/browser, không sửa/xóa/di chuyển file ứng dụng.
- Review độc lập bắt buộc: /root/review_main_structure; receipt được lưu cùng artifact khi reviewer chốt candidate.
- Hồ sơ này được ghi trên docs bằng index riêng, không checkout/chạm index WIP của main. Không push remote trong task.
- Walkthrough: phần nhận định dẫn source trực tiếp để chủ dự án đọc; chưa có xác nhận người dùng đã xem hoặc nghiệm thu.

Artifact gốc: `D:/Workspace/pos-cafe-archive/_assessments/main-structure-20261025/assessment.md`.
