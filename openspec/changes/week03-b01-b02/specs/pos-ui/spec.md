# Yêu cầu

Ngày 24/10/2026. Phạm vi được chủ dự án chốt: chỉ B01 và B02, repo nguyentronglinh045/pos-cafe, tác giả commit và người tạo PR 24tx610002-VoVanNgoc. Màu/font/reference đã duyệt giữ nguyên. Hai runtimecontract app5191/ref4185 được duyệt qua phản hồi “Duyệt hai hợp đồng runtime B01–B02”. Không merge/deploy.

## R01 — B01
SHALL dùng hàng riêng cho khu vực thay hàng thống kê cũ, toolbar title/filter/refresh ổn định; scroller một hàng, hai nút44px chỉ cuộn và ẩn khi đủ chỗ/disabled ở biên; active được đưa vào tầm nhìn khi chọn/resize. SHALL giữ tên truy cập đầy đủ và tablecount. SHALL kiểm1/2/5/6khu vực,>=80ký tự,không đặt giới hạn nghiệp vụ5lầu.

## R02 — B02
SHALL giữ thao tác tìm/lọc/chọn món, modifier/ghi chú/số lượng, giỏ hàng/draft, dirtyexit giữ/bỏ, lưu/gửi đơn/inbếp và bàn giao thanh toán hiện có. SHALL giữ loading/error/empty/unavailable/permission states; không thêm backend/quyền/giá.

## R03 — nghiệp vụ và phạm vi
SHALL giữ logicalcanvas1600×900,minScale/hitBoost,refetch trước mở bàn,ID/cache/dữ liệu. PaymentDrawer/PaymentCashierPane/PaymentSummaryPane/paymentShared/ReceiptPreview SHALL không có diff ứng dụng so main. Luồng B01↔B02 giữ lầu khi đóng,discard,lưu và bàn giao/thoát paymentmain.

## R04 — theme/responsive
SHALL lấy semantic tokens từ palette-a-v1.json, CSS/Tailwind/MUI cùngfactory,BeVietnamPro. SHALL dùng được landscape>=568×320,đủ matrix/breakpoint/sweep/touch/keyboard/longdata,không giả fidelity tại viewport không córeference.

## R05 — minh chứng/xuất bản
SHALL có approvedcontract/frozenreference/source/gate receipts và hai review độc lập. SHALL đóng gói reference/support đểclone mới chạy được. Commit/PR SHALL ghi Tuan3 và đúng tác giả24tx610002-VoVanNgoc; tách code main và spec/evidence docs. Chỉ push nhánhriêng/tạoPR, không merge/deploy.
