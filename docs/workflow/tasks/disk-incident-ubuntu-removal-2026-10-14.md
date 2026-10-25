# Kiểm điều kiện gỡ Ubuntu — 14/10/2026

Đây là checkpoint/progress, không phải hồ sơ đã khôi phục dung lượng hoặc approval gỡ.

Chủ máy từ chối tạo bản bảo toàn toàn VHD nén trên E và chỉ cho phép gỡ/xóa **nếu Ubuntu chỉ dùng cho pos-cafe**. Trước đó chủ máy còn yêu cầu giữ các bản lưu quan trọng. Không được suy câu trả lời “chỉ dùng pos-cafe” thành inventory thực tế của filesystem.

Đọc metadata VHD trực tiếp bằng handle `rb`, không mount/start WSL/replay journal, thấy `/root` còn:

- `/root/nllb-ct2`: `model.bin`622.596.105 bytes, `shared_vocabulary.json`5.921.176 bytes, `config.json`223 bytes; inode allocation khoảng599,4 MiB.
- `/root/vi-game-env`: Python environment `bin`, `lib`, `include`, `share`, `pyvenv.cfg`; 30.835 inode, allocation khoảng1,281 GiB.
- `/root/vi_game_cache.sqlite3`: logical1.650.688 bytes, allocation1.654.784 bytes.

Tên thư mục/file cho thấy dấu vết môi trường/model/cache dịch game ngoài pos-cafe. Đây là inference từ metadata, chưa đọc payload/SQL và chưa chứng minh chúng thuộc riêng ReSister hoặc RoboLife. Kiểm latest turn hai chat game không tìm được exact path; không gán bừa provenance. Không đủ căn cứ xác nhận Ubuntu chỉ chứa dữ liệu pos-cafe, vì vậy điều kiện cho phép unregister chưa được thỏa.

Metadata source ổn định trong lần đọc. Journal/checksum ext4 chưa verify nên số inode allocation là provisional; điều này không cấp phép xóa các dữ liệu tìm được. `/home`, `/data`, `/srv` trống trong metadata đã đọc; `/root/.ssh` trống. Không dùng các thư mục trống để suy toàn hệ thống không có dữ liệu khác.

Ubuntu-24.04 đang Stopped theo truy vấn trạng thái22:25 ngày14/10. VHD Windows snapshot mới186.736.705.536 bytes, lớn hơn số đầu phiên13 MiB; LastWrite22:15:45.7806995. Không xác định writer, không gọi đó là runtime đang chạy. HP1/parent idle; không resume. `wsl --unregister` sẽ xóa vĩnh viễn dữ liệu/settings/software distro theo [Microsoft](https://learn.microsoft.com/en-us/windows/wsl/basic-commands#unregister-or-uninstall-a-linux-distribution).

Không gỡ, xóa, backup, repair hoặc compact. Không tạo75 GiB backup đã bị owner từ chối. Giữ code D, private Windows backups, Linux/game data, Google Drive và mọi dữ liệu hiện có. Bước tiếp theo cần owner chọn phạm vi mới: chỉ dọn dữ liệu pos-cafe đã chốt retention, hoặc chốt bảo toàn/được bỏ các dữ liệu khác trước khi gỡ Ubuntu. Không tự mở rộng conditional authorization thành xóa toàn distro.

Evidence nhỏ: `D:/Workspace/pos-cafe/artifacts/disk-incident-20261014/ownership-observation-02.json`; reader và chẩn đoán trước ở [hồ sơ incident](disk-incident-2026-10-14.md). Hai reviewer đã APPROVE diagnostic-v1 SHA5877e074d5b2f574fd00dda94d696b627208015cee7e4b273da04f71653cbda2; verdict cũ không duyệt unregister hay checkpoint ownership mới này.
