# Hướng dẫn kỹ thuật POS Cafe

Quy tắc agent chung nằm ở [AGENTS.md](AGENTS.md); quy trình thực hiện và review ở [workflow](docs/workflow/README.md); chuẩn đặc tả ở [SPEC-STANDARD](openspec/SPEC-STANDARD.md). File ở code root chỉ là con trỏ. Đối chiếu kỹ thuật ngày 25/10/2026 với `main@711a22e`; xem [điểm vào tài liệu](docs/README.md) trước khi lấy thông tin từ phase log.

## Dự án và giới hạn

POS web tiếng Việt, ưu tiên landscape, online-only, cash-only, browser print. Bếp là seam tương lai. Giữ các giới hạn ở [phase-scope](docs/phase-scope.md); không mở nghiệp vụ mới dưới tên refactor. Có implementation phân quyền và UI mới trên main không đồng nghĩa backend đã nghiệm thu/activate.

## Kiến trúc cần giữ

- UI → feature hook/flow → port → adapter. Chỉ `src/app/runtimePorts.ts:24` compose adapter. `src/architectureBoundaries.test.ts:121` kiểm hướng import và boundary permission/legacy.
- Production `src/ports/index.ts:154` gồm permission/write/auth/seed/print; raw repos thuộc `LegacyAppPorts:163` cho regression riêng. Không tái đưa legacy factory vào UI hoặc dùng nó để bypass permission.
- Catalog 15 quyền và authority đã xác minh là nguồn quyền (`src/core/permissionCatalog.ts:5`, `src/core/permissionAuthority.ts:18`). `core/guards.ts` còn là legacy, không dùng bảng 5 quyền của nó để mô tả runtime mới.
- UI profile chỉ phục vụ hiển thị; session credential nằm trong adapter, memory-only. Query key gắn store/employee/generation/purpose (`src/features/shared/permissionSession.ts:76`). Response muộn không được khôi phục quyền/dữ liệu của phiên cũ.
- TanStack Query giữ async state, Zustand giữ UI/nháp. Invalidate/refetch theo purpose; không tự merge payload realtime vào cache. Query live poll5s foreground (`src/features/pos/usePosData.ts:8`); authority lifecycle poll30s/deadline5s (`src/core/permissionLifecycle.ts:47`).
- Navigation là single URL + screen/drawer state. `src/app/shell/AppShell.tsx:22` đăng ký drawer và cổng quyền; không thêm route/history workflow ngoài phạm vi.

Bản giải thích và lý do lựa chọn ở [architecture](docs/architecture.md); mô hình dữ liệu ở [data-model](docs/data-model.md). Các đường `src/...:line` trong file này đều tương đối với **code checkout main711a22e**, không phải nhánh docs.

## Giao dịch và seam

- Dùng `IWriteOperationRepo` cho submit/pay/split/void. K/payload bất biến trước execute; retry giữ cùng ý định, R1 là kết quả lịch sử. Không replay tự động khi reconnect; TTL pending không là hạn đơn. `src/features/pos/writeOperationFlow.ts:25`, `src/features/pos/orderFlow.ts:250`.
- Retained lines giữ IDs/giá/options; phần mới dùng quote hiện tại. OCC dùng expectedVersion; không bỏ vì UI đã chặn double-click.
- UUID client cho dữ liệu theo contract; editor dùng tombstone, order dùng void/removed. Không hard-delete chỉ để đơn giản hóa sync.
- snake_case/Supabase DTO chỉ ở adapter, domain dùng camelCase và AppError. Port không chứa React.
- Floor editor sở hữu layout, không sở hữu trạng thái vận hành bàn. Decor không nhận đơn. Logical stage1600×900.
- Initial receipt grant nằm ngoài immutable K/R1; mỗi click in kiểm quyền hiện hành. Browser print không có xác nhận giấy; không hồi sinh callback cũ sau revoke/regrant. `src/app/components/ReceiptPreview.tsx:260`.
- Ảnh món dùng staging/gateway/finalization của runtime permission; decor/nền bàn là asset đóng gói. Không khôi phục upload raw legacy để né guard. `src/adapters/supabase/newPermissionRuntime.ts:16`.

## Môi trường và lệnh

`src/app/runtimePorts.ts:16` chọn mock nếu không ép mode và không đủ URL/key; có URL/key thì Supabase. Vì vậy một frontend mở được chưa chứng minh đang nối đúng backend. Không ghi secrets vào docs hoặc evidence.

Các lệnh sau đọc từ `package.json:6` ở code source trên, chạy trong code checkout phù hợp:

| Lệnh | Mục đích/giới hạn |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | TypeScript build + Vite; không là backend gate |
| `npm test` | Vitest suite theo config; không bao gồm mọi contract/backend/browser |
| `npm run test:coverage` | Độ phủ theo config, không phải toàn hệ thống |
| `npm run smoke` | Playwright mock; đọc applicability và skips |
| `npm run smoke:supabase` | Suite riêng có ghi dữ liệu; chỉ dùng môi trường/phạm vi được giao |
| `npm run ui-audit:selftest` → `npm run ui-audit` | Selftest detector trước audit app, đọc report và ảnh để phân loại |
| `test:idempotency:*`, `test:contracts` | Runner chống trùng với source/environment/manifest riêng |
| `permission:preflight`, `test:permission:t01`…`t07` | Các runner permission riêng, không tự chạy chỉ vì có script |

Không có lint script riêng trong package hiện tại. Dùng dependencies/browser đã có; trước cài/copy lớn tuân thủ dung lượng máy và thông báo ước tính. Không tự tạo WSL/Docker hoặc dựng backend để xử lý docs.

Hướng dẫn đi cùng công cụ là nguồn chuẩn trên main: [UI audit](https://github.com/nguyentronglinh045/pos-cafe/blob/main/ui-audit/README.md), [UI remake](https://github.com/nguyentronglinh045/pos-cafe/blob/main/ui-remake/README.md). Không tự chạy `ui-audit:update`; baseline defect chỉ được chủ dự án chấp nhận sau phân loại. Thay detector phải chạy selftest; quy trình chi tiết trong AGENTS và operator guide.

## Backend và phát hành

Source có migrations001–017 và fragments trong `supabase/candidate/`; activation là quy trình riêng. Không replay migration destructive hoặc apply candidate vào đích thật từ một ví dụ tài liệu. Giữ backend acceptance, migration, live activation và deployment HOLD theo [handoff tích hợp](docs/workflow/tasks/ui-main-docs-integration-2026-10-25.md). Kiểm deploy cần source/version/environment, không suy từ code merge hoặc CI mock.

## Làm việc và viết tài liệu

Đọc [task index](docs/workflow/tasks/README.md), đối chiếu nguồn rồi làm đúng phần đã được giao. Chưa rõ nghiệp vụ/quyền/dữ liệu/nghiệm thu thì hỏi phần phụ thuộc và tiếp tục phần độc lập. Chỉ sửa app khi được yêu cầu; review độc lập trước bàn giao. Giữ kết quả thực chạy ở [testing](docs/testing.md)/hồ sơ task, không sao chép counts vào hướng dẫn kỹ thuật này.
