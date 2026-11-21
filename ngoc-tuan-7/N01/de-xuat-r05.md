# Đề xuất cập nhật kịch bản N01 r04 → r05



## 1. Bổ sung thao tác còn thiếu (không đổi Expected)

| Ca / bước | r04 | Đề xuất r05 | Lý do |
| --- | --- | --- | --- |
| N01-12 B6 | Bấm Đúng tiền, +50k, 500k | **Nhập lại `200000`**, rồi bấm Đúng tiền, +50k, 500k | Sau B5, số tiền khách đưa chỉ còn 125đ (thiếu tiền). Khi CX-02 chưa sửa, hàng nút nhanh bị ẩn lúc thiếu tiền, nên không làm được B6 nếu không nhập lại. Lượt chạy lại ngày 14/11 đã phải nhập lại 200000. Sau khi CX-02 được sửa, thao tác này vẫn đúng nhưng không còn bắt buộc |
| Điều kiện chạy | main `cd35439` | Ghi commit main của từng lượt. Lượt mốc tuần 7 chạy trên main `2e57649` | Main đã đổi từ ngày 19/11. Các file liên quan CX-01…CX-04 không đổi |

## 2. Kết quả chưa thống nhất (chờ Linh)

| Ca / bước | Hiện tại | Vấn đề |
| --- | --- | --- |
| N01-03 B5 | Expected ghi rõ chữ nút "Bỏ thay đổi". App hiện "Bỏ đơn" → **LỆCH — chờ CX-03** | — |
| N01-11 B4 | Expected ghi "Đóng, bỏ thay đổi", không nêu chữ nút. App hiện "Bỏ đơn" nhưng hành vi đúng → **ĐÚNG** | Cùng một hộp xác nhận, cùng loại đơn đã gửi nhưng hai ca chấm khác nhau. Nếu tính cả chữ nút thì N01 r04 còn **60 ĐÚNG / 5 LỆCH** thay vì 61/4 |

Hai cách xử lý:

- **A.** Thêm "nút ghi Bỏ thay đổi" vào Expected N01-11 B4 cho giống N01-03 B5. Kết quả thành LỆCH — chờ CX-03.
- **B.** Giữ N01-11 B4 chỉ kiểm hành vi, ghi chú chữ nút đã được kiểm ở N01-03 B5.

