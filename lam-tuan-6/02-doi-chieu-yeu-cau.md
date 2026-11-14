# Đối chiếu yêu cầu với hệ thống thực tế — 12/11/2026

**Bản nháp do AI (Claude Code) chạy và soạn. Lâm chưa xem ảnh, chưa tự làm tay; xem ô tự kiểm trong [README](README.md).**

## Nguồn và cách đối chiếu

- **Yêu cầu:** bảng FR-01…FR-21 và NFR-04 trong `docs/requirements.md`, nhánh `docs` commit [`e8a1810`](https://github.com/nguyentronglinh045/pos-cafe/blob/e8a1810f3de41453ad33b224334c26d6f8cd52db/docs/requirements.md). Câu trả lời của Linh ngày 08/11 ([team-week05-answers](https://github.com/nguyentronglinh045/pos-cafe/blob/e8a1810f3de41453ad33b224334c26d6f8cd52db/docs/workflow/tasks/team-week05-answers-2026-11-08.md)) dùng để biết điểm nào đã được ghi nhận (CX-01…CX-09).
- **Hệ thống thực tế:** bản demo dữ liệu giả (`VITE_DATA_MODE=mock`) chạy trên máy, mã nguồn giống hệt main [`cd35439`](https://github.com/nguyentronglinh045/pos-cafe/tree/cd3543996fb4d06f022dcf4a6829fba43645daff) (đã so mã băm 698 file `src/`, `tests/` và cấu hình, không khác file nào).
- **Cách làm:** script [`chay-runbook-va-yeu-cau.mjs`](script/chay-runbook-va-yeu-cau.mjs) điều khiển Chrome, lượt 3 lúc **08:44:56–08:45:54**. Ảnh ở [`chay-2026-11-12/demo/anh/`](chay-2026-11-12/demo/anh/), điều thấy từng bước ở [`ket-qua.json`](chay-2026-11-12/demo/ket-qua.json). Hai lượt trước bị bỏ vì lỗi script, lý do ghi ở [`cac-luot-da-bo.txt`](chay-2026-11-12/demo/cac-luot-da-bo.txt).
- Màn 1366×768 cho mọi ca, trừ ca màn dọc (390×844 và 844×390).

Kết luận dùng bốn mức:

| Mức | Nghĩa |
| --- | --- |
| **KHỚP** | Làm được đúng như yêu cầu ghi, trong phần đã thử |
| **KHỚP, CÓ ĐIỂM LỆCH** | Chức năng chạy, nhưng có chỗ hiển thị hoặc tên gọi khác yêu cầu, spec hay tài liệu |
| **CHỈ THỬ MỘT PHẦN** | Mới mở màn hoặc thử một nhánh; chưa đủ để nói khớp toàn bộ |
| **CHƯA KIỂM ĐƯỢC TRÊN DEMO** | Bản demo dữ liệu giả không có điều kiện để thử |

## Bảng đối chiếu

| Mã | Yêu cầu (tóm tắt) | Thấy trên demo 12/11 | Kết luận | Ảnh |
| --- | --- | --- | --- | --- |
| FR-01 | Tạo quán: tên, địa chỉ tùy chọn, PIN tạm, bắt đổi PIN, chọn dữ liệu mẫu | Màn **Tạo quán mới** có Tên quán, Địa chỉ (tuỳ chọn), ô dữ liệu mẫu (mặc định tắt), ô xác nhận sẽ lưu Store Key; nút Tạo khóa khi chưa nhập. Kết quả hiện Store Key và PIN tạm. Đăng nhập bằng PIN tạm thì bị chuyển sang **Đổi PIN tạm**; đổi xong app quay về màn chọn nhân viên, báo "Đã đổi PIN. Vui lòng đăng nhập bằng PIN mới."; đăng nhập lại thì vào POS với 0 bàn (không chọn dữ liệu mẫu) | KHỚP | `K-tao-quan/K1…K3c` |
| FR-02 | Ghép thiết bị bằng Store Key | Key demo ghép được. Key sai (`0000-AAAAAA`) **cũng vào được** màn chọn nhân viên, vì bản mock nhận mọi key ([permissionRuntime.ts:74](https://github.com/nguyentronglinh045/pos-cafe/blob/cd3543996fb4d06f022dcf4a6829fba43645daff/src/adapters/mock/permissionRuntime.ts#L74)) | CHỈ THỬ MỘT PHẦN — nhánh key sai cần backend thật | `P-phuc-vu/P1-key-sai` |
| FR-03 | Chọn nhân viên, nhập PIN trước khi vào POS | Chọn **Chủ quán**, nhập PIN, **Mở khoá** vào POS. PIN tạm bị bắt đổi (xem FR-01) | KHỚP | `K-tao-quan/K3a`, `K3b` |
| FR-04 | Màn và thao tác theo quyền | Thanh trái: Chủ quán 11 mục; Thu ngân 5 mục (không có Báo cáo); Phục vụ 4 mục (Sơ đồ bàn, Tra cứu thao tác, Bán mang đi, Khoá). Phục vụ mở đơn đã gửi chỉ có nút **Đóng**, không có Thanh toán; ở Bán mang đi chỉ có **Mở đơn**. Đúng quy tắc "nút theo quyền" ngày 08/11 | KHỚP (phía giao diện; phía server cần backend) | `P-phuc-vu/P2a`, `P2b` |
| FR-05 | Quản lý nhân viên, chỉnh quyền | Bỏ ô **Thu tiền** của Thu ngân, lưu; đăng nhập Thu ngân vẫn gửi được đơn nhưng mở lại đơn thì không còn nút Thanh toán; bật lại quyền thành công. Chưa thử tạo, đổi tên, đổi vai, khóa, đặt lại PIN | CHỈ THỬ MỘT PHẦN | `R-runbook/B14a`, `B14b` |
| FR-06 | Sơ đồ theo khu, lọc trạng thái bàn | Có dải khu (Tầng trệt…), bộ lọc **Tất cả / Trống / Đang phục vụ**, bàn trống và đang phục vụ khác màu, ô bàn ghi tổng tiền (`B01 145K`). Lọc **Trống** thì bàn không khớp bị **ẩn**, trong khi spec floor-operations ghi "chỉ làm nổi bật" | KHỚP, CÓ ĐIỂM LỆCH — đã có **CX-01** | `R-runbook/B04a`, `B06` |
| FR-07 | Tạo, sửa đơn tại bàn: món, số lượng, ghi chú, tùy chọn | Thêm 4 món, + −, ghi chú "ít ngọt" không cần bấm lưu, tổng 145.000đ, **In/Gửi đơn** | KHỚP | `R-runbook/B05b` |
| FR-08 | Tạo và tiếp tục đơn mang đi | Tạo, gửi, mở lại, thanh toán đơn mang đi đều được. Tạo rồi bỏ khi chưa gửi thì không sinh đơn (đúng câu trả lời Q-N01-1). Lệch: xem **YC-02, YC-03, YC-04** bên dưới | KHỚP, CÓ ĐIỂM LỆCH — **mới** | `T-mang-di/T1…T5` |
| FR-09 | Tùy chọn món dùng chung: một lựa chọn, nhiều lựa chọn | Cửa sổ chọn Size, Đá, Topping; giỏ hàng hiện tùy chọn đã chọn. Nhóm bắt buộc chưa thử (dữ liệu mẫu không có, như Ngọc ghi ở N01-02) | KHỚP | `R-runbook/B05a`, `B05b` |
| FR-10 | Phiếu gửi bếp chỉ có phần mới, không hiện giá | Phiếu gửi bếp #27 chỉ có tên món, số lượng, tùy chọn, ghi chú; không có số tiền nào | KHỚP | `R-runbook/B05c` |
| FR-11 | Thanh toán đủ bằng tiền mặt, tính thiếu/thối, trả bàn | Gõ thiếu: "Còn thiếu", nút hoàn tất bị khóa. Gõ dư: "Tiền trả lại khách 25.000 ₫". Trả xong B01 về trống | KHỚP | `R-runbook/B09a`, `B09b`, `B10b` |
| FR-12 | Chọn món để tách đơn và trả ngay | Chọn 2/2 Americano, trả 70.000đ, hóa đơn mang số #27; phần còn lại thành #28, 75.000đ | KHỚP | `R-runbook/B08a…c` |
| FR-13 | Xem/in tạm tính và hóa đơn qua trình duyệt | Cửa sổ **Hoá đơn thanh toán** có nút In; chưa in ra giấy (đúng phạm vi đã ghi). Nút **In lại** của đơn mang đi đã trả không tới được (YC-03) | CHỈ THỬ MỘT PHẦN | `R-runbook/B08b`, `B10a` |
| FR-14 | Lịch sử: mặc định gần đây, lọc ngày/trạng thái/loại đơn, phân trang, chi tiết | Có **Thời gian: Gần đây**, lọc **Tất cả / Đã thanh toán / Đã hủy**, **Tất cả loại / Tại bàn / Mang đi**, nút Trước/Sau "Trang 1/1", khung chi tiết đơn. Số đơn ở Lịch sử là #2, #3 trong khi hóa đơn là #27, #28 | KHỚP, CÓ ĐIỂM LỆCH — đã có **CX-04** | `R-runbook/B11a`, `T-mang-di/T5-lich-su` |
| FR-15 | Hủy đơn đã trả theo quyền, có lý do | 5 lý do; chọn **Lý do khác** mà chưa ghi chú thì nút xác nhận khóa. Hủy xong: nhãn **Đã hủy**, người hủy, giờ, lý do; nút in lại bị khóa | KHỚP | `R-runbook/B12a`, `B12b` |
| FR-16 | Quản lý thực đơn, ảnh món | Mở được **Thực đơn** ("4 danh mục · 22 món"). Chưa thử thêm, sửa món, tải ảnh | CHỈ THỬ MỘT PHẦN | `R-runbook/B15a` |
| FR-17 | Sửa khu, bàn, vật trang trí; kéo, xoay, khóa, lưu | Mở được **Sơ đồ cửa hàng** ("8 bàn · 2 khu"). Chưa kéo, xoay, lưu | CHỈ THỬ MỘT PHẦN | `R-runbook/B15b` |
| FR-18 | Vật trang trí, nền bàn đồng nhất giữa màn sửa và POS | Không thử bằng tay. Ca smoke tự động "wall, decor and table backgrounds persist…" đạt ở màn desktop (xem [03](03-kiem-tra-hoi-quy.md)) | CHỈ THỬ MỘT PHẦN | — |
| FR-19 | Báo cáo: doanh thu, số đơn, trung bình, top món, giờ bán, đơn/tiền hủy | 0đ → 145.000đ, 2 đơn, TB 72.500đ; sau hủy: 75.000đ, 1 đơn, hủy 1, tiền hủy 70.000đ — đúng. Hàng Món bán chạy ghi "Americano 145K" và "1 ngày top · 145.000 ₫" (doanh thu cả ngày). Ô **Thanh toán phổ biến** ghi "Đã thanh toán" | KHỚP, CÓ ĐIỂM LỆCH — top món đã có **CX-05**; Thanh toán phổ biến là **mới (YC-01)** | `R-runbook/B11b`, `B13` |
| FR-20 | Cập nhật thông tin quán; xóa dữ liệu mẫu có kiểm soát | Mở được **Cài đặt**. Nút trên màn là **Đặt lại dữ liệu mẫu**, hộp thoại ghi "chỉ đặt lại dữ liệu mẫu có sẵn, không xoá dữ liệu người dùng tự tạo…"; còn đơn mở thì bị chặn ("Còn 4 đơn đang mở"). Chưa thử sửa thông tin quán | KHỚP, CÓ ĐIỂM LỆCH — tên gọi khác yêu cầu (xem [01](01-ra-soat-tai-lieu.md) TL-04) | `R-runbook/B15c`, `B16` |
| FR-21 | Đồng bộ nhiều thiết bị khi online | Dữ liệu mock nằm riêng trong từng trình duyệt, hai máy không dùng chung dữ liệu | CHƯA KIỂM ĐƯỢC TRÊN DEMO | — |
| NFR-04 | Màn ngang dùng được; màn dọc hiện hướng dẫn xoay | Đăng nhập ở 844×390 rồi xoay dọc: hiện "Xoay ngang thiết bị", sơ đồ bàn ẩn; xoay lại ngang thì sơ đồ hiện lại. Màn đầu (trước đăng nhập) ở màn dọc không có hướng dẫn xoay và vẫn dùng được | KHỚP | `O-man-doc/O1`, `O2a`, `O2b` |

Ảnh nằm trong `chay-2026-11-12/demo/anh/<tên ca>/`. Ví dụ `R-runbook/B05c` là [`chay-2026-11-12/demo/anh/R-runbook/B05c-phieu-gui-bep.png`](chay-2026-11-12/demo/anh/R-runbook/B05c-phieu-gui-bep.png).

**Tổng:** 22 dòng: 10 KHỚP; 5 KHỚP, CÓ ĐIỂM LỆCH (3 điểm đã có trong CX-01, CX-04, CX-05; 2 điểm mới); 6 CHỈ THỬ MỘT PHẦN; 1 CHƯA KIỂM ĐƯỢC TRÊN DEMO.

NFR-01, 02, 03, 05, 06, 07, 08 là yêu cầu kỹ thuật (giao dịch, cô lập dữ liệu, kiến trúc, build, tầng kiểm thử, triển khai), không xem được bằng giao diện. Phần chạy test tự động liên quan nằm ở [03](03-kiem-tra-hoi-quy.md).

## Điểm lệch mới (chưa có trong CX-01…CX-09)

| Mã | Điểm lệch | Thấy ở đâu | Căn cứ trong mã (main `cd35439`) |
| --- | --- | --- | --- |
| **YC-01** | Ô **Thanh toán phổ biến** trong Báo cáo luôn ghi "Đã thanh toán" (là trạng thái), không phải phương thức như "Tiền mặt". `features.md` mô tả ô này là "thanh toán phổ biến" | Báo cáo, cột trái, phần tóm tắt nhanh | [reportHelpers.ts:77](https://github.com/nguyentronglinh045/pos-cafe/blob/cd3543996fb4d06f022dcf4a6829fba43645daff/src/features/admin/reportHelpers.ts#L77) gán `method: "paid"` cho mọi đơn; [ReportDrawer.tsx:74](https://github.com/nguyentronglinh045/pos-cafe/blob/cd3543996fb4d06f022dcf4a6829fba43645daff/src/app/drawers/admin/ReportDrawer.tsx#L74) đổi "paid" thành chữ "Đã thanh toán" |
| **YC-02** | Màn **Đơn mang đi**: thẻ **Đã thanh toán** luôn ra 0 đơn kèm câu "Chưa có đơn mang đi đang mở. Tạo đơn đầu tiên", kể cả ngay sau khi vừa trả một đơn mang đi. Thẻ **Hôm nay** cho ra đúng danh sách của **Đang mở** | `T-mang-di/T4-the-da-thanh-toan`, `T4-the-hom-nay`, `T5-sau-khi-tra` | [TakeawayDrawer.tsx:34-36](https://github.com/nguyentronglinh045/pos-cafe/blob/cd3543996fb4d06f022dcf4a6829fba43645daff/src/app/drawers/pos/TakeawayDrawer.tsx#L34-L36): "Đã thanh toán" trả danh sách rỗng, các thẻ còn lại dùng chung danh sách đơn đang mở |
| **YC-03** | Nút **In lại** cho đơn mang đi đã trả không bao giờ hiện (chỉ có trong danh sách "Đã thanh toán", mà danh sách này luôn rỗng); trong mã, nút cũng không gắn việc in | `T-mang-di/T5-sau-khi-tra` | [TakeawayDrawer.tsx:164](https://github.com/nguyentronglinh045/pos-cafe/blob/cd3543996fb4d06f022dcf4a6829fba43645daff/src/app/drawers/pos/TakeawayDrawer.tsx#L164): bấm chỉ chặn sự kiện, không làm gì |
| **YC-04** | Trả đủ một đơn **mang đi**, app báo "Đã thanh toán. **Bàn đã trống.**" dù đơn mang đi không có bàn | thông báo ở T5 (ghi trong `ket-qua.json`) | [PaymentDrawer.tsx:196](https://github.com/nguyentronglinh045/pos-cafe/blob/cd3543996fb4d06f022dcf4a6829fba43645daff/src/app/drawers/pos/PaymentDrawer.tsx#L196) dùng một câu cho mọi lần trả đủ |
| **YC-05** (nhỏ) | Chữ trên giao diện không thống nhất: nút đóng màn quản trị ghi **Thoát** (Thực đơn), **Huỷ** (Sơ đồ cửa hàng, Cài đặt), **Đóng** (Báo cáo, Lịch sử); cùng khung Báo cáo có "Đơn đã **huỷ**", "0 **huỷ**" cạnh "Tiền **hủy**"; app có cả "**Hoá** đơn thanh toán" và "In **hóa** đơn" | `R-runbook/B15a…c`, `B11b`, `B13` | — |

## Chỉ đúng với bản mock, không tính là lỗi app

- Store Key sai vẫn ghép được: bản mock nhận mọi key ([permissionRuntime.ts:74](https://github.com/nguyentronglinh045/pos-cafe/blob/cd3543996fb4d06f022dcf4a6829fba43645daff/src/adapters/mock/permissionRuntime.ts#L74)).
- Tạo quán mới luôn ra cùng quán #0001, cùng Store Key và PIN tạm demo ([permissionRuntime.ts:78](https://github.com/nguyentronglinh045/pos-cafe/blob/cd3543996fb4d06f022dcf4a6829fba43645daff/src/adapters/mock/permissionRuntime.ts#L78), giá trị cố định ở [dòng 114–115](https://github.com/nguyentronglinh045/pos-cafe/blob/cd3543996fb4d06f022dcf4a6829fba43645daff/src/adapters/mock/permissionRuntime.ts#L114-L115)). Vì vậy màn chọn nhân viên sau khi tạo ghi "Cửa hàng #0001", không phải tên quán vừa nhập. Ảnh K2 vẫn che Store Key và PIN.
- Dữ liệu mất khi tải lại trang, như đã ghi ở tuần 5.

## Giới hạn

- Chỉ là bản demo dữ liệu giả trên máy; chưa chạy với backend thật, chưa thử trên điện thoại hoặc máy tính bảng thật, chưa in ra giấy.
- Mỗi chức năng mới thử nhánh chính; "KHỚP" ở đây nghĩa là khớp trong phần đã thử, không phải nghiệm thu.
- Giờ ghi theo đồng hồ máy (UTC+7).
