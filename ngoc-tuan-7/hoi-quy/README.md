# Chuẩn bị hồi quy sau CX-01…CX-04

## Hiện trạng ngày 20/11/2026

- Main mới nhất: [`2e57649`](https://github.com/nguyentronglinh045/pos-cafe/tree/2e57649) (19/11/2026). Các commit chạm `src/` sau `cd35439` đều thuộc luồng tạo quán. Các file của CX-01…CX-04 không đổi: `FloorWorkspace.tsx`, `PaymentCashierPane.tsx`, `DiscardDraftDialog.tsx`, `historyHelpers.ts`, `OrderHistoryDrawer.tsx`, `OrderHistoryListPane.tsx`. Kiểm bằng `git diff` giữa hai commit, kết quả rỗng.
- **Chưa chạy hồi quy được** vì bốn mục CX chưa có code.


| | |
| --- | --- |
| Thời gian | 20/11/2026, 08:27:29–08:29:04 (UTC+7) |
| Môi trường | Demo mock `127.0.0.1:5181`, Chromium qua Playwright, 1366×768, mỗi ca một phiên mới |
| Kết quả | **65 bước: 61 ĐÚNG, 4 LỆCH, 0 LỖI**, giống lượt 12/11 |
| Bốn bước LỆCH | N01-01 B4 (CX-01), N01-03 B5 (CX-03), N01-04 B7 (CX-04), N01-05 B4 (CX-02) |
| Minh chứng | [`moc-2026-11-20-main-2e57649/ket-qua.json`](moc-2026-11-20-main-2e57649/ket-qua.json) và 66 ảnh trong `anh/` |

Script tuần 6 ghi cứng nguồn là `cd35439`, nên trường `source` của file kết quả đã được sửa tay sau khi chạy. Bản script trong [`../script/run-n01-r04.mjs`](../script/run-n01-r04.mjs) nhận biến `N01_SOURCE` để lần sau ghi đúng ngay. Logic kiểm không đổi.

Đây là lượt tự động, không thay việc Ngọc chạy tay.

## Khi Linh báo CX đã vào main

```powershell
Set-Location C:\Users\ngoc.vv\Music\KLTN\pos-cafe-owner-ui
git fetch origin main
git -C ..\pos-cafe-main-2e57649 checkout --detach origin/main
Set-Location ..\pos-cafe-main-2e57649; npm.cmd ci
$env:VITE_DATA_MODE = 'mock'; npm.cmd run dev -- --host 127.0.0.1 --port 5181 --strictPort
# Cửa sổ khác:
$env:N01_SOURCE = "main <commit mới>"
node C:\Users\ngoc.vv\Music\KLTN\ngoc-tuan-7\script\run-n01-r04.mjs C:\Users\ngoc.vv\Music\KLTN\pos-cafe-main-2e57649 C:\Users\ngoc.vv\Music\KLTN\ngoc-tuan-7\hoi-quy\<thu-muc-moi> http://127.0.0.1:5181
```

Khi app đã sửa đúng, các bước phải đổi như sau. Script có thể phải sửa phần kiểm của đúng các bước này, vì giao diện đổi:

| Bước | Hiện tại | Sau khi sửa phải thấy |
| --- | --- | --- |
| N01-01 B4 | Lọc thì bàn không khớp bị ẩn | Bàn khớp sáng lên, bàn khác vẫn hiện đúng chỗ (CX-01) |
| N01-05 B4 | Thiếu tiền thì không có nút Đúng tiền | Hàng nút nhanh luôn hiện, ô nhập tô đỏ, có nút x (CX-02) |
| N01-03 B5, N01-11 B4 | Nút ghi "Bỏ đơn" | Đơn đã gửi ghi "Bỏ thay đổi", đơn mới giữ "Bỏ đơn" (CX-03) |
| N01-04 B7 | Lịch sử ghi #2 | Lịch sử ghi #24, chia nhóm theo ngày kinh doanh (CX-04) |
| N01-12 B5–B6 | Phải nhập lại 200000 mới thấy nút nhanh | Nút nhanh hiện ngay lúc thiếu tiền (CX-02) |