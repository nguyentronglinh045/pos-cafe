
## Giao diện (từ tuần 6, chưa gửi)

**Q-GD-1 — Cỡ nút ở màn Đơn mang đi.** Màn mang đi có 9 nút thấp hơn 44px ở cả 5 cỡ màn: ba thẻ lọc 24px, nút Mở đơn/Thanh toán trên thẻ 26px, hai nút ở khung chi tiết khoảng 31px, Tạo đơn mang đi/Đóng khoảng 37px. Ba màn POS còn lại đều đạt 44px. Màn mang đi có áp mức 44px như các màn kia không?

**Q-GD-2 — Cỡ chữ tối thiểu ngoài màn Thanh toán.** Mức 12px hiện chỉ có ở R07 cho Thanh toán. Ở 568×320, màn Gọi món có tên món và giá trong giỏ 11px, nhãn phụ 10px. Sơ đồ bàn có số liệu phụ 10–11px. Phiếu tạm tính có chữ 11px. Có áp 12px cho Gọi món và Sơ đồ bàn không? Phiếu tạm tính mô phỏng giấy in có được miễn không?

**Q-GD-3 — Ngưỡng của ui-audit.** ui-audit đang dùng nút 24px, chữ 10px, lỏng hơn spec (44px, 12px), và chưa có màn mang đi trong danh sách. Có nên đặt ngưỡng theo spec và thêm màn mang đi, để "0 lỗi" nghĩa là đạt spec không?

## Kịch bản N01

**Q-N01-9 — Chấm chữ nút ở N01-11 B4.** N01-03 B5 chấm LỆCH vì nút ghi "Bỏ đơn" thay cho "Bỏ thay đổi" (CX-03). N01-11 B4 dùng cùng hộp xác nhận cho đơn đã gửi nhưng chỉ kiểm hành vi nên chấm ĐÚNG. Em đề xuất giữ N01-11 B4 chỉ kiểm hành vi để điểm lệch này chỉ đếm một lần ở N01-03 B5. Anh/chị đồng ý không, hay muốn N01-11 B4 cũng kiểm chữ nút (khi đó kết quả là 60 ĐÚNG / 5 LỆCH)?

**Q-N01-10 — Thao tác ở N01-12 B6.** Sau B5 số tiền chỉ còn 125đ nên hàng nút nhanh bị ẩn (CX-02). Em thêm thao tác "nhập lại 200000" trước khi bấm Đúng tiền, +50k, 500k, Expected giữ nguyên. Sau khi CX-02 được sửa, em giữ thao tác này hay bỏ để B6 kiểm luôn việc nút nhanh hiện khi thiếu tiền?

## Hồ sơ và hồi quy

**Q-HS-1 — Nơi lưu minh chứng tuần 6–7.** Theo CX-08, minh chứng tuần 4–5 được lưu nguyên trạng trên `docs`, kèm script. Hồ sơ tuần 6 của em hiện nằm trên nhánh `ngoc-tuan-6` (tách từ `docs`, giống `lam-tuan-6`). Tuần 6–7 có nhập vào `docs/implementation-log` theo cách của tuần 4–5 không? Khi nhập, em sửa luôn hai link hỏng của tuần 6 được không?

**Q-HQ-1 — Hồi quy sau CX-01…CX-04.** Khi các mục này vào main, anh/chị báo em commit để em chạy lại. Em sẽ chạy lại đủ 65 bước và xem kỹ N01-01 B4, N01-03 B5, N01-04 B7, N01-05 B4, N01-11 B4, N01-12 B5–B6.

---

Đã gửi: ☐ · Giờ gửi: ........ · Kênh: ........
