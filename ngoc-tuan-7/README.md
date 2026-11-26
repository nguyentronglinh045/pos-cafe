# Tuần 7 (16/11–22/11/2026) — Võ Văn Ngọc

Việc tuần 7: **hoàn thành phần tự kiểm còn lại của N01 r04**, gồm chạy tay N01-11, N01-12 và màn bán mang đi 568×320, thống nhất kết quả, bổ sung thao tác còn thiếu, gửi câu hỏi cho Linh và chuẩn bị hồi quy sau CX-01…CX-04.

**Trạng thái (20/11/2026):** AI (Claude Code) đã chuẩn bị phiếu chạy tay, đề xuất r05, câu hỏi gửi Linh, và chạy một lượt mốc tự động trên main mới. **Ngọc chưa chạy tay, chưa gửi câu hỏi.** Các ô bên dưới chưa đánh dấu.

**Kết quả bổ sung:** Codex đã kiểm tra UI tự động theo phiếu N01-11, N01-12 và mang đi 568×320, ngày 20/11/2026 lúc 08:47:03–08:47:27 (UTC+7): **19/19 kiểm tra hành vi ĐÚNG, 33 ảnh**. Xem [ket qua chay tay/README.md](<ket qua chay tay/README.md>). Công cụ điều khiển trực tiếp không kết nối được nên đây chưa phải lượt Ngọc tự chạy tay; phần xác nhận bên dưới giữ nguyên. Báo cáo ghi riêng CX-02, CX-03 và mức cuộn ngang 72px khác mốc 49px.

## Theo kế hoạch tuần 7

| Việc trong kế hoạch | Đã chuẩn bị | Còn lại |
| --- | --- | --- |
| Chạy tay N01-11, N01-12; kiểm mang đi 568×320 | [Phiếu chạy tay](chay-tay/phieu-chay-tay.md) có cách mở demo, Expected r04 và kết quả tự động 14/11 để đối chiếu | **Ngọc tự thao tác**, ghi giờ thật, chụp ảnh vào `chay-tay/anh/` |
| Cập nhật kết quả chưa thống nhất | Tìm ra N01-11 B4 và N01-03 B5 chấm khác nhau cho cùng chữ nút "Bỏ đơn". Xem [đề xuất r05, mục 2](N01/de-xuat-r05.md#2-kết-quả-chưa-thống-nhất-chờ-linh) | Chờ Linh trả lời Q-N01-9 |
| Bổ sung thao tác còn thiếu | N01-12 B6 thêm "nhập lại 200000". Xem [đề xuất r05, mục 1](N01/de-xuat-r05.md#1-bổ-sung-thao-tác-còn-thiếu-không-đổi-expected) | Ngọc duyệt rồi ghi vào kịch bản r05 |
| Xác nhận nhận xét của lượt tự động | Cột "Lượt tự động 14/11" trong phiếu chạy tay | Ngọc ghi chỗ nào khác ở cuối phiếu |
| Theo dõi lệch giao diện (cỡ nút, chữ nhỏ, nhãn) | GD-01…GD-05 giữ nguyên từ tuần 6. Phiếu chạy tay có cột ghi cỡ nút và chữ ở 568×320 | Ghi lại khi chạy tay |
| Tổng hợp câu hỏi gửi Linh | [cau-hoi-linh.md](cau-hoi-linh.md): Q-GD-1…3, Q-N01-9…10, Q-HS-1, Q-HQ-1 | **Ngọc sửa bằng lời mình và gửi**, ghi giờ gửi |
| Rà lại ảnh, kết quả, minh chứng | Hai link hỏng của tuần 6 đã ghi ở [đề xuất r05, mục 3](N01/de-xuat-r05.md#3-link-hỏng-trong-hồ-sơ-tuần-6) | Ngọc rà sau khi chạy tay |
| Đưa script và hồ sơ vào nhánh phù hợp | Theo CX-08, tuần 4–5 lưu nguyên trạng trên `docs` kèm script. Câu hỏi Q-HS-1 hỏi tuần 6–7 có làm giống vậy không | Chờ Linh |
| Chuẩn bị hồi quy sau CX-01…CX-04 | [hoi-quy/](hoi-quy/README.md): CX chưa vào main `2e57649`; lượt mốc tự động **61 ĐÚNG / 4 LỆCH**; lệnh chạy lại và các bước cần xem | Chờ Linh báo commit |

## Nguồn

- Hồ sơ tuần 6: nhánh [`ngoc-tuan-6`](https://github.com/nguyentronglinh045/pos-cafe/tree/ngoc-tuan-6/ngoc-tuan-6). Kịch bản r04 và biên bản chạy lại 14/11 nằm ở đó.
- Câu trả lời Q-N01, CX-01…CX-09: [team-week05-answers](https://github.com/nguyentronglinh045/pos-cafe/blob/e8a1810f3de41453ad33b224334c26d6f8cd52db/docs/workflow/tasks/team-week05-answers-2026-11-08.md). Đã đối chiếu với bản mới nhất trên `docs` ngày 20/11: file không đổi.
- Hệ thống: main [`2e57649`](https://github.com/nguyentronglinh045/pos-cafe/tree/2e57649) (19/11/2026). So với `cd35439` chỉ đổi luồng tạo quán. Các file của CX-01…CX-04 không đổi.

## Giới hạn

- Demo dữ liệu giả (`VITE_DATA_MODE=mock`), chỉ mở ở `127.0.0.1`. Không backend thật, không thiết bị cảm ứng thật. Đây không phải nghiệm thu.
- Lượt mốc 20/11 là lượt tự động, không thay việc Ngọc chạy tay.
- Mã cửa hàng và PIN trong phiếu và script là dữ liệu demo có sẵn trong mã nguồn chế độ mock.

## Ngọc tự kiểm

- [ ] Đã chạy tay N01-11 theo phiếu. Giờ thật: ........
- [ ] Đã chạy tay N01-12 theo phiếu. Giờ thật: ........
- [ ] Đã kiểm màn bán mang đi ở 568×320 theo phiếu. Giờ thật: ........
- [ ] Đã ghi các điểm khác lượt tự động.
- [ ] Đã duyệt đề xuất r05 mục 1 và ghi vào kịch bản.
- [ ] Đã sửa câu hỏi bằng lời mình và gửi Linh. Giờ gửi: ........
- [ ] Đã khai báo dùng AI tuần 7 trên nhánh `ai-log` (`khai-bao/ngoc/tuan-07-VoVanNgoc.md`).
