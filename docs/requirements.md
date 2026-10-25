# Requirements & Traceability

Mã FR/NFR tổng quan được giữ để truy vết; cập nhật mô tả theo `main@711a22e` ngày 25/10/2026. “Đã triển khai” trong bảng nghĩa là có implementation trên main, **không** là backend acceptance hoặc phát hành. Kết quả theo [testing](testing.md); hợp đồng phân quyền đầy đủ còn WIP, xem [OpenSpec](../openspec/README.md).

> Cột **Bằng chứng chính** là traceability nội bộ cho AI/developer. Khi viết báo cáo, không sao chép tên code, file, symbol hoặc migration từ cột này; chỉ dùng chúng để kiểm chứng rồi diễn đạt lại yêu cầu và thiết kế ở mức hệ thống.

## Tác Nhân

| Tác nhân | Vai trò hiện hành |
| --- | --- |
| Người dùng trước đăng nhập | Tạo cửa hàng, ghép thiết bị bằng Store Key, chọn nhân viên và nhập PIN |
| Thu ngân (`cashier`) | Vận hành bàn, tạo/sửa đơn, thanh toán tiền mặt, xem lịch sử |
| Chủ quán / quản lý / phục vụ | Role `owner/manager/waiter` từ catalog; mở màn/hành động theo quyền hiệu lực, không suy toàn quyền từ tên role |
| Bếp (`kitchen`) | Chỉ là enum/schema/component seam tương lai; không phải tác nhân UI hiện hành |

## Yêu Cầu Chức Năng

| Mã | Yêu cầu | Trạng thái | Bằng chứng chính |
| --- | --- | --- | --- |
| FR-01 | Tạo cửa hàng mới với tên, địa chỉ tùy chọn, PIN tạm owner, đổi PIN bắt buộc và lựa chọn seed dữ liệu mẫu | Đã triển khai | [features.md](features.md#store--session), `sessionFlow`, `authRepo`, seed bundle |
| FR-02 | Ghép thiết bị vào cửa hàng bằng Store Key và lưu session cửa hàng ở client | Đã triển khai | [screens.md](screens.md#2-store-pairing), `sessionFlow`, `storeKey` |
| FR-03 | Chọn nhân viên hiện hành và xác minh PIN trước khi vào POS | Đã triển khai | [screens.md](screens.md#4-passcode), `src/ports/permissions.ts:17`, `src/app/screens/PasscodeScreen.tsx:42` |
| FR-04 | Giới hạn màn, đọc và thao tác theo catalog 15 quyền/authority | Đã triển khai | [features.md](features.md#role--permission), `src/core/permissionCatalog.ts:5`, `src/app/permissionUi.ts:17`; SQL candidate chưa nhận activation đích |
| FR-05 | Quản lý nhân viên: lọc, tạo, sửa tên/role/trạng thái, reset PIN và chỉnh quyền | Đã triển khai | [screens.md](screens.md#12-employees-drawer), phase 22 |
| FR-06 | Xem sơ đồ theo khu/tầng, lọc trạng thái bàn và nhận biết bàn trống/đang phục vụ | Đã triển khai | [features.md](features.md#pos-floor), `FloorWorkspace` |
| FR-07 | Tạo và cập nhật đơn tại bàn, gồm món, số lượng, ghi chú và modifier | Đã triển khai | [features.md](features.md#order), giao thức v1 action create/update, retained/new |
| FR-08 | Tạo và tiếp tục xử lý đơn mang đi | Đã triển khai | [features.md](features.md#takeaway), `TakeawayDrawer` |
| FR-09 | Dùng thư viện modifier chung nhiều-nhiều, hỗ trợ single/multi, bắt buộc và số lượng | Đã triển khai | [data-model.md](data-model.md#nhóm-menu), migration 008 |
| FR-10 | Khi gửi đơn, tạo phiếu gửi bếp từ các dòng mới thêm mà không hiển thị giá | Đã triển khai ở mức preview | Phase 14, `ReceiptPreview`; chưa có kitchen queue hoặc máy in thật |
| FR-11 | Thanh toán toàn bộ đơn bằng tiền mặt, tính tiền thiếu/thối và trả bàn về trống | Đã triển khai | [features.md](features.md#payment), giao thức v1 kind `pay_order` |
| FR-12 | Chọn món/số lượng để tách thành đơn độc lập và thanh toán ngay | Đã triển khai | ADR instant pay, giao thức v1 kind `pay_order_items`, migration 015 |
| FR-13 | Preview/in phiếu tạm tính và hóa đơn qua browser | Đã triển khai ở mức web | Phase 13–14, `ReceiptPreview`; không claim tích hợp ESC/POS |
| FR-14 | Xem lịch sử đơn đã kết thúc, mặc định gần đây không giới hạn ngày, lọc theo khoảng ngày/trạng thái/loại đơn, phân trang và xem chi tiết snapshot | Đã triển khai | [features.md](features.md#order-history), `OrderHistoryDrawer` |
| FR-15 | Hủy đơn đã thanh toán theo quyền, lý do, audit và optimistic lock | Đã triển khai | giao thức v1 action void_paid, migration 015 |
| FR-16 | Quản lý menu/category/món/modifier và upload ảnh món JPG/PNG/WebP tối đa 5MB | Đã triển khai | [features.md](features.md#menu-editor), migrations 005–006 |
| FR-17 | Quản lý khu, bàn, decor; kéo, resize, xoay, khóa và lưu changeset | Đã triển khai | [features.md](features.md#floor-editor), phase 17 và 21 |
| FR-18 | Chọn asset decor và nền bàn built-in, render đồng nhất ở editor và POS | Đã triển khai | Phase 21 và 23, migration 013 |
| FR-19 | Xem báo cáo doanh thu, số đơn, trung bình đơn, top món, giờ bán và số/tiền đơn hủy | Đã triển khai | [features.md](features.md#report), `reportRepo` |
| FR-20 | Cập nhật thông tin cửa hàng, seed lại hoặc xóa dữ liệu mẫu có kiểm soát | Đã triển khai | [features.md](features.md#settings--maintenance), `settingsRepo`, `seedRepo` |
| FR-21 | Đồng bộ thay đổi chính giữa nhiều thiết bị khi online bằng realtime invalidate/refetch | Đã triển khai có giới hạn | [architecture.md](architecture.md#realtime), phase 15 và [limitations.md](limitations.md) |

## Yêu Cầu Phi Chức Năng

| Mã | Yêu cầu | Tiêu chí chấp nhận hiện tại | Trạng thái |
| --- | --- | --- | --- |
| NFR-01 | Nhất quán giao dịch order/payment | Transaction v1 nguyên tử, replay K/R1 không ghi lặp; stale update bị chặn bằng expectedVersion bắt buộc | Đã triển khai và có test |
| NFR-02 | Cô lập dữ liệu giữa cửa hàng | Tenant theo store; runtime đọc/ghi qua permission RPC/projection, phải kiểm deny trực tiếp | Có source; backend acceptance mới còn HOLD |
| NFR-03 | Dễ kiểm thử và thay adapter | UI/features phụ thuộc ports; Supabase/mock cùng implement contract | Đã triển khai và có boundary test |
| NFR-04 | Hỗ trợ màn hình vận hành ngang | Desktop, tablet/phone landscape dùng được; portrait hiển thị hướng dẫn xoay | Đã kiểm tra bằng Playwright đa viewport |
| NFR-05 | Khả năng khôi phục đồng bộ online | Realtime signal kết hợp refetch/polling danh mục đang active | Đã triển khai; không phải SLA cứng |
| NFR-06 | Build kiểm tra kiểu nghiêm ngặt | `tsc -b` với TypeScript strict và Vite production build phải pass | Đạt tại baseline |
| NFR-07 | Có bằng chứng kiểm thử nhiều lớp | Sáu tầng kiểm thử, tiêu chí "đủ test" theo loại thay đổi và cổng chất lượng định nghĩa tại [test-strategy.md](test-strategy.md); ngưỡng độ phủ 90% dòng trên phần logic nghiệp vụ thuần | **Kết quả lịch sử** tại main@3ada48c ngày 2026-09-10: chiến lược thành văn, độ phủ dòng 92,53%, kịch bản demo tự động hóa và gate chống trùng. Kết quả và ngày chạy trong [testing.md](testing.md) |
| NFR-08 | Deploy web không cần server ứng dụng riêng | Vite build ra `dist`, Vercel SPA rewrite, Supabase làm backend managed | Đã cấu hình; URL live cần xác minh riêng trước khi claim |

## Bổ sung chống trùng ngày 2026-09-10

Bộ yêu cầu chính thức gồm 33 requirement / 12 use case / 93 TC gốc trong [change](../openspec/changes/add-idempotent-write-operations/proposal.md). Giữ các mã FR/NFR đã chốt tại đó, không tạo một bộ mã cạnh tranh ở trang tổng quan. [Ma trận](../openspec/changes/add-idempotent-write-operations/traceability.md) nối đủ requirement–UC–TC; [testplan](../openspec/changes/add-idempotent-write-operations/testplan.md) ghi expected và nơi hiện thực. Trạng thái nghiệm thu hoàn tất và SHA code tại [phase 27](implementation-log/phase-27-idempotent-write-operations.md).

Các yêu cầu thêm bao gồm K/payload bất biến, server recovery/takeover, phiên nhân viên và chặn bypass, giá theo phần cũ/mới, receipt lịch sử, audit nguyên tử, TTL theo lệnh và UI online không tự gửi lại. Giới hạn tiền mặt, bếp và offline giữ theo quyết định của chủ dự án.

## Ngoài Phạm Vi Hoặc Hoãn

Các yêu cầu sau không được tính là thiếu so với baseline tiểu luận hiện tại:

- Kitchen queue/backend và role bếp vận hành thật.
- QR/bank/e-wallet processing thật.
- Offline-first/local database.
- Máy in native, USB hoặc ESC/POS.
- Gộp/chuyển bàn, discount/voucher/refund, quản lý kho, ca làm việc, loyalty.
- Quản lý chuỗi nhiều chi nhánh và custom role hoàn chỉnh.

Lý do và hướng mở rộng được tổng hợp tại [limitations.md](limitations.md).

## Quy Tắc Traceability

- `Đã triển khai` nghĩa là có code trên baseline nêu trên; không tự động có nghĩa đã kiểm chứng cloud trong ngày audit.
- `Đã kiểm chứng` phải kèm lệnh, kết quả, ngày và môi trường trong [testing.md](testing.md) hoặc phase log.
- Root docs nêu source/phạm vi đối chiếu; phase log là bằng chứng lịch sử. Code, spec và test có vai trò khác nhau, không dùng một loại để thay nghiệm thu của loại khác.
- Code xác định implementation; yêu cầu đã duyệt xác định expected; evidence xác định điều đã kiểm. Mâu thuẫn phải được đối chiếu, không tự đổi requirement theo code.
