# Tổng quan POS Cafe

POS Cafe là ứng dụng web bán hàng cho quán cà phê nhỏ, dùng trên nhiều thiết bị, ưu tiên màn hình ngang và giao diện tiếng Việt. Dự án phục vụ tiểu luận và phát triển tiếp thành đồ án tốt nghiệp; trọng tâm là vận hành bàn, gọi món, thu tiền và quản trị quán.

## Bài toán và mục tiêu

Theo xác nhận của chủ dự án ngày25/10/2026, [12 mục tiêu tốt nghiệp](workflow/tasks/docs-thesis-audit-2026-10-25.md#đối-chiếu-12-mục-tiêu) đã được giảng viên xác nhận và là định hướng đích của đồ án. [Hồ sơ nguồn và giới hạn](workflow/tasks/docs-knowledge-clarification-2026-10-25.md#dec-docs-02--khung12-mục-tiêu-tốt-nghiệp-được-giảng-viên-xác-nhận) phân biệt xác nhận mục tiêu với tiêu chí chi tiết, hiện trạng và nghiệm thu; lượt này chưa đối chiếu văn bản của giảng viên.

Nhân viên cần nhìn trạng thái bàn, ghi nhận món và tùy chọn, tiếp tục đơn tại bàn hoặc mang đi, thu tiền và tra cứu giao dịch. Chủ quán cần quản lý nhân viên/quyền, thực đơn, sơ đồ và doanh thu. Hệ thống phải giữ lịch sử giá, chống ghi trùng khi mất phản hồi, phát hiện sửa đồng thời và đồng bộ các thiết bị khi online.

Mỗi cửa hàng là một phạm vi dữ liệu riêng. Khả năng phục vụ nhiều cửa hàng trong backend không đồng nghĩa đã có sản phẩm quản lý chuỗi hay báo cáo đa chi nhánh.

## Khung thực hiện và đầu ra tốt nghiệp

Theo chủ dự án ngày 25/10/2026, đồ án có 15 tuần thực hiện từ 05/10/2026 và bảo vệ trực tiếp với giảng viên ở tuần 16. Quy đổi theo tuần liên tiếp, giai đoạn thực hiện kết thúc 17/01/2027, tuần bảo vệ là 18–24/01/2027; chưa có ngày bảo vệ hoặc hạn nộp báo cáo cụ thể. [Roadmap](roadmap.md#khung-thời-gian-đồ-án--xác-nhận-2026-10-25) giữ khung lịch hiện hành và lịch sử riêng.

Mục tiêu bàn giao là các chức năng đã đăng ký hoạt động trên Vercel và chứng minh có thể chạy kiểm thử ở local. Phần chức năng cũ cần bảo toàn đã được xác định là tiểu luận từng demo cho giảng viên. [Mốc khảo sát hồi quy](phase-scope.md#mốc-tiểu-luận-dùng-để-khảo-sát-hồi-quy) liên kết ứng viên code tháng 8 và snapshot tài liệu; chưa xác nhận source chính xác của bản demo. Giảng viên chưa có yêu cầu minh chứng bổ sung cụ thể theo thông tin chủ dự án. [Hồ sơ nguồn](workflow/tasks/docs-knowledge-clarification-2026-10-25.md#dec-thesis-01--thời-gian-và-mức-hoàn-thành-đồ-án) phân biệt mục tiêu này với trạng thái code, kết quả kiểm chứng và quyền triển khai.

## Người dùng và hành trình

Ghép thiết bị bằng Store Key → chọn nhân viên và nhập PIN → vào sơ đồ bàn hoặc đơn mang đi → chọn món/modifier → gửi đơn → thanh toán tiền mặt → xem hóa đơn/lịch sử. Thanh toán một phần tách món thành một đơn độc lập đã trả; phần còn lại tiếp tục bán hàng.

Source main có bốn vai trò bật: chủ quán (`owner`), quản lý (`manager`), thu ngân (`cashier`), phục vụ (`waiter`). Bếp được giữ cho tương lai. Màn và hành động mở theo quyền hiệu lực từ catalog, không dựa riêng tên vai trò. Chủ quán mới có luồng đổi PIN tạm bắt buộc trước POS. Nguồn: [catalog](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/core/permissionCatalog.ts#L5), [đăng nhập](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/app/screens/PasscodeScreen.tsx#L42), [điều hướng](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/app/permissionUi.ts#L17).

## Trạng thái ngày 25/10/2026

| Phần | Trạng thái và giới hạn |
| --- | --- |
| Source ứng dụng | Main `711a22e`; UI B01 sơ đồ, B02 gọi món, B03 thanh toán đã tích hợp cùng cổng quyền. [Receipt merge](workflow/tasks/ui-main-docs-integration-2026-10-25.md) |
| Kiểm chứng UI/local | Có build, unit, browser, smoke và audit theo candidate; [testing](testing.md) giữ nguồn và số liệu riêng |
| Backend phân quyền | Có adapter/SQL candidate trên main; acceptance toàn backend còn DEFERRED/NOT_ACCEPTED, không nhận local mock thay thế |
| Phát hành | Task chỉnh lý và đợt tích hợp UI không deploy, migration hay live activation. Không khẳng định main hiện là bản cửa hàng đang chạy |
| Tài liệu | Core đã chỉnh lý; [spec/evidence WIP đã hòa giải](workflow/tasks/docs-wip-publication-2026-10-25.md), bản gốc giữ để chờ duyệt dọn. Baseline capability chưa apply đầy đủ; backend acceptance HOLD |

## Phạm vi chủ động giới hạn

Online-only, thanh toán tiền mặt, in qua trình duyệt; chưa có offline, xử lý QR/ngân hàng thật, máy in ESC/POS hoặc kitchen queue vận hành. Chưa mở gộp/chuyển bàn, kho, khách hàng/loyalty, ca làm việc và quản lý chuỗi trong lượt chuẩn hóa.

Đọc tiếp [tính năng](features.md), [kiến trúc](architecture.md), [giới hạn](limitations.md) và [lộ trình](roadmap.md). Mục tiêu, trạng thái code, kiểm chứng và quyết định nghiệm thu là các thông tin riêng; không dùng từ “hoàn thành hệ thống” khi gate còn mở.
