# Sự cố dung lượng pos-cafe — khảo sát ngày 14/10/2026

Trạng thái: đã có chẩn đoán sơ bộ bằng metadata; **chưa khôi phục dung lượng hoặc sửa WSL**. Hai review độc lập cho hồ sơ khảo sát đang chờ. HP1 dừng, không tiếp tục feature.

## Quyền hiện tại

Chủ máy yêu cầu trong chat cha `01a1393e-c03e-79a2-a20e-3ecfaaf241ad`: tìm nguyên nhân và xử lý sự cố C/hai Drive, bảo toàn dữ liệu và hỏi trước mọi hành động quan trọng. Trong chat incident, chủ máy xác nhận **“Chưa có — tiếp tục khảo sát, chưa sửa/xóa dữ liệu”**, chưa có nơi lưu đơn lẻ còn 190 GiB, và **“chưa hề”** tự giải phóng dung lượng. Các quyền HP1 trước đây không cấp quyền cleanup/repair cho incident.

Đã làm: truy vấn ổ đĩa/tiến trình/registry, đọc recipe và transcript có giới hạn, đo allocation qua Windows FILE_STANDARD_INFO; đọc VHDX/ext4 bằng file handle `rb`, chỉ metadata thư mục/inode, không mount/replay journal/khởi động WSL. Tạo hồ sơ nhỏ trên D. Không xóa, di chuyển, compact, fsck/chkdsk, đổi cấu hình hoặc dừng dịch vụ; không gọi hosted/cloud deletion, không push/deploy/backup/cutover.

## Kết quả chính

Số đầu phiên: C11,803; D96,936; E95,479; G8,403; H3,711 GiB trống. Mẫu sau: C12,059 GiB, các ổ còn lại không đổi theo độ chính xác đã ghi. Không tìm thấy WSL VM/Docker/job HP1 đang ghi; đây là quan sát tiến trình, không chứng minh mọi writer toàn máy đã bị loại trừ. HP1 idle/interrupted theo transcript; không gửi resume. C/D cùng physical disk0, E disk1. G/H là hai Google Drive virtual volumes; chưa xác minh quota cloud/unsynced content.

| Vùng | Dung lượng quan sát | Ý nghĩa / bảo vệ |
| --- | ---: | --- |
| WSL `ext4.vhdx` trên C | 173,899 GiB **allocation trên Windows** | Không phải toàn bộ do HP1. Đĩa chứa OS, Docker/volume, dữ liệu cũ và private evidence; bảo vệ nguyên bản. |
| Metadata ext4 | khoảng170,681 GiB used | Còn journal-recovery flag; không replay hoặc kiểm integrity. Counter có thể chưa cập nhật; không dùng làm fsck PASS. |
| HP1 `images.tar` ở nguồn50–58 | 9file, khoảng16,748 GiB inode allocation guest | Metadata chỉ; chưa hash byte trùng. Chưa được phép xóa. |
| HP1 containerd blobs | 13namespace, khoảng24,195 GiB inode allocation guest | Có1.903 snapshot directory, chưa đo toàn bộ layer/volume. Không coi namespace là disposable toàn bộ. |
| Hai nhóm image trên | khoảng40,943 GiB **guest metadata**, có thể double-count hardlink/shared metadata | Không phải số Windows chắc chắn sẽ thu hồi. Chưa gồm expanded layers, DB volumes hoặc npm trees. |
| HP1 npm | 18cây `node_modules` và18 `npm-cache` | Xác nhận tồn tại; chưa đo đủ allocation tất cả cây. Có thể phục vụ replay/evidence, chưa phân loại được quyền xóa. |
| Source51 | quét bị chặn ở45giây/giới hạn tổng650.000inode; riêng cây này405.249inode và ít nhất14,134 GiB | Partial, không cộng vào40,943 GiB vì chồng phạm vi. |
| Google DriveFS local | khoảng139,135 MiB allocation của vùng cache mặc định đã khảo sát | Không giải thích hàng chục GiB mất trên C. Không xác minh mọi cache tùy chỉnh hoặc nội dung chưa sync; không đụng G/H/cache. |
| HP1 private tar nguồn56 trên C | logical4,030 GiB; physical3,387 GiB | Raw private/review evidence, giữ; không public payload. |

Metadata layout cho thấy9archive và13containerd data roots trong cùng task. Recipe chủ động tạo npm-cache riêng theo source và data-root riêng theo lần thử, save/load lại image. Đây là cơ chế phù hợp với việc C giảm từ một mẫu lịch sử khoảng65,746 GiB trống xuống19,5 GiB trong phiên HP1, rồi task báo full/emergency_ro. Không có baseline VHD trước HP1 đủ để quy toàn bộ173,899 GiB cho task, cũng chưa chứng minh byte-for-byte mọi image giống nhau.

Đường dẫn VHD đã resolve qua Windows handle: `C:/Users/nguye/AppData/Local/wsl/{f6332a69-1b57-4d64-aadb-60b07bd9c6b1}/ext4.vhdx`.

Root private dùng tên logic `C:/Users/nguye/AppData/Local/pos-cafe-release`, nhưng process trong package Codex resolve tới `C:/Users/nguye/AppData/Local/Packages/OpenAI.Codex_2p2nqsd0c76g0/LocalCache/Local/pos-cafe-release`. Phải chốt actual handle path/ACL trước bất kỳ hành động sau này; không áp dụng delete vào đường dẫn logic theo suy đoán. Tar được bảo vệ là `hosted-hp1-20261014/hp1-source56-private-package-01.tar` dưới root này.

Các path guest liên quan (tất cả nằm trong VHD trên C):

- `images.tar`: `/var/tmp/pos-cafe-hosted-hp1-20261014-source-{50..58}/private/gate-isolation/images.tar`; brace notation chỉ để mô tả, **không phải lệnh/allowlist xóa**. Danh sách từng root thực tế trong observation JSON.
- Containerd: source51 `ns04/ns05/ns06`; source53/54 `ns01`; source55 `ns01..ns05`; source56/57/58 `ns01`, dưới `private/gate-isolation/containerd-data-nsNN/io.containerd.content.v1.content/blobs/sha256`. Không theo symlink; chỉ stat inode/file names, không đọc blob payload.
- Npm: `/var/tmp/pos-cafe-hosted-hp1-20261014-source-{41..58}/source/node_modules` và `/var/tmp/pos-cafe-hosted-hp1-20261014-source-{41..58}/npm-cache`; không có cleanup authority.

G/H trở lại8,403/3,711 GiB khi C trở lại khoảng12 GiB và chủ máy chưa cleanup. Việc C đầy ảnh hưởng Drive desktop là giả thuyết phù hợp với quan sát, không kết luận quota cloud. [Google](https://support.google.com/drive/answer/17196458?hl=en) phân biệt số dung lượng file manager với quota cloud; [hướng dẫn nâng cao](https://support.google.com/drive/answer/16631477?hl=en) cho biết local cache có thể chứa thay đổi chưa sync. Cache không đủ căn cứ để xóa an toàn. Chưa rõ vì sao C tự có lại khoảng12 GiB; không gán cho cleanup, WSL swap hoặc pagefile khi chưa có evidence.

## Phương án tiếp theo — dự thảo, chưa được cho phép thực thi

1. Giữ HP1 dừng và chỉ tạo evidence KB–MB trên D. Không mở WSL/DB/test mới. Nếu C tụt nhanh hoặc dưới10 GiB, ngừng thêm khảo sát nặng/ghi artifact và báo chủ máy. Không automation hoặc background monitor mới.
2. Bảo toàn trước repair. D/E từng ổ thiếu chỗ cho raw VHD173,899 GiB. Có thể chuẩn bị phương án backup **cục bộ nén, chia phần** trên D/E với quota ví dụ≤70 GiB mỗi ổ và verify SHA256 toàn stream đối chiếu nguyên bản; tỷ lệ nén chưa biết, phải dừng nếu vượt budget, giữ source nguyên. Đây chỉ là phương án cho owner duyệt riêng về exact target folders/ACL/budget/copy time/rollback. Chưa tạo backup. D cùng disk vật lý với C nên phương án này không bảo vệ trước hỏng disk0; còn phải kiểm khả năng restore đích đủ chỗ. Không lưu raw/credentials lên G/H.
3. Sau khi có phương án bảo toàn đã duyệt và kiểm chứng: đề xuất riêng cách xác minh journal/filesystem; không force remount rw hoặc sửa original trước approval. Cần biết phiên bản WSL, mount/service behavior và scope thiết bị trước khi đưa exact repair command. [Microsoft](https://learn.microsoft.com/en-us/windows/wsl/disk-space) mô tả read-only fallback và recovery; không suy restart chắc chắn an toàn/đủ.
4. Inventory đáng tin sau recovery: chốt từng candidate cache/tar/layer với byte hash hoặc content identifier độc lập, reference graph, recipe pinned, retained dumps/volumes/raw/private package và khả năng replay. Code dirty, source41–58, source40/backup-v2/hosted-path candidates, historical FAIL evidence, credentials/Auth, originals và user/cloud data đều được bảo vệ. **Không đề nghị xóa toàn bộ artifact, namespace, Docker volume hoặc private roots.**
5. Cleanup chỉ sau exact allowlist/owner approval và preservation proof; guest deletion chưa chắc giảm allocation Windows. Mọi trim/compact/move VHD cần approval/preconditions/rollback riêng. Không hứa thu hồi40,943 GiB hoặc đủ chỗ chỉ bằng compact hiện trạng.
6. Trước bất kỳ resume HP1: chuẩn bị storage budget kiểm **host C và guest**, retention/copy-once hoặc reuse image có source-bound manifest rõ, không nhân graph đầy đủ cho từng retry. Chưa sửa recipe/config và không nới gate/evidence. Owner duyệt thiết kế cùng independent review trước áp dụng.

## Evidence, phương pháp và giới hạn

- `D:/Workspace/pos-cafe/artifacts/disk-incident-20261014/observation-01.json`: host allocated measurements/actual paths, exact per-source/namespace layout, counter metadata, budgets và limitations. Snapshot metadata, không chứa raw credentials/data rows.
- `D:/Workspace/pos-cafe/artifacts/disk-incident-20261014/read-vhd-metadata.py`: chỉ mở VHD `rb`; kiểm CRC32C header/region, từ chối active VHDX log, differencing/unsupported mapping; không mount hoặc đọc file payload. Ext4 journal không replay và ext4 metadata checksums chưa verify; directory/inode counts chỉ provisional, không cấp quyền xóa. Full inode scan bị bound; layout pass nhẹ, file size/mtime ổn định trước/sau.
- Recipe nguồn: `D:/Workspace/pos-cafe/artifacts/permission-hosted-hp1-20261014/pipeline.py:15` riêng cache, `prepare-gate-isolation.py:27` save images, `gate-namespace.py:23` containerd root, `:30` Docker root, `:40` load images.
- Transcript HP1 `01a1398d-3932-79c3-bcfd-01147e5990fa`: idle/interrupted; owner nói tạm dừng, không cấp restart. Số lịch sử là evidence cũ, không đọc thành tình trạng hiện tại.
- First trial stat inode dedup trả zero inode trên runtime Windows nên bị loại; report chỉ giữ phép đo sửa bằng FILE_STANDARD_INFO qua handle. Không dựa vào apparent size cho sparse private tar.
- Main HEAD`5156820f7d6679cd6f8051bdc38419737ffa0c7e`, docs HEAD`e47862b1dfed68d783dc07a2a1fd51ecdabc1b19`; dirty460main/226docs trước ghi doc incident. Không stage/commit/reset/stash/switch/clean; không edit code/HP1 handoff hay frozen artifacts. Chỉ thêm hồ sơ incident riêng và link index.

Chưa kiểm integrity toàn máy, quota cloud, mọi unsynced local content, byte identity của image blobs, đầy đủ target volume preservation, repair hoặc restore. Không nhận “đã sửa” hoặc “100% an toàn”. Phần thực thi recovery đang chờ owner cho phép rõ sau khảo sát, theo yêu cầu mới của chủ máy.

## Review gate

Candidate khảo sát v1 gồm hồ sơ này, observation JSON và read-only helper, khóa bằng SHA256 manifest riêng. Reviewer1: data safety/authorization/recovery plan; reviewer2: attribution/measurement/probe correctness/evidence. Cả hai chỉ đọc; không repair/restart/xóa/backup/chạy quét lớn. Review chỉ nghiệm thu hồ sơ chẩn đoán có giới hạn, không phê duyệt cleanup hay HP1.
