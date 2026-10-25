# Nội dung đĩa Ubuntu WSL — 14/10/2026

Phạm vi được giao mới: chủ máy hỏi “phân tích được trong170GB đó có chứa dữ liệu nào nữa không”. Chỉ inventory/analysis, chưa cleanup/gỡ. Trước đó chủ máy từ chối full-image backup trên E và cho phép gỡ có điều kiện nếu Ubuntu chỉ phục vụ pos-cafe; đã gặp môi trường/model/cache dịch game nên chưa thỏa điều kiện. Giữ yêu cầu bảo toàn dữ liệu quan trọng và hỏi trước hành động quan trọng.

## Phương pháp và kết quả

Inventory offline đọc VHD bằng `rb`, chỉ system metadata/inode/directory; không mount, khởi động distro, replay journal hoặc đọc file payload. Không scan Windows C/G/H. Inode table cache trong RAM giúp tránh hàng triệu lượt đọc4096bytes riêng lẻ. Validator so sánh fast inode reader với reader trước trên4inode đại diện. Giới hạn mỗi lượt150giây/7,5triệu inode; lần cuối kết thúc43,38giây trước bound, không directory error, source size/mtime không đổi trong lượt đọc.

Snapshot hoàn tất khoảng22:44:59 Asia/Bangkok.4.816.759 reachable inode duy nhất;19.488 duplicate inode paths bỏ khỏi tổng, symlink không follow. `completeTraversal=true` chỉ nghĩa đi hết cây reachable đã đọc, không chứng minh integrity hay hết mọi inode không tham chiếu. Tổng allocation theo i_blocks khoảng173,042 GiB; VHD host length ở snapshot186.736.705.536 bytes ≈173,912 GiB. Chúng đo phạm vi khác nhau, không coi là exact host reclaim.

| Nhóm theo đường dẫn | Allocation guest đã loại inode trùng |
| --- | ---: |
| Các môi trường HP1 `/var/tmp/pos-cafe-hosted-hp1-*` | 135,199 GiB |
| Docker chung `/var/lib/docker` | 10,756 GiB |
| Containerd chung `/var/lib/containerd` | 8,741 GiB |
| Các môi trường pos-cafe khác (gồm cả HP1 review) | 8,941 GiB |
| Các môi trường backup-v2 | 3,242 GiB |
| Model/môi trường/cache có tên dịch game | 1,868 GiB |
| Hệ thống/log/cache và filesystem data khác | 4,295 GiB |
| **Tổng** | **173,042 GiB** |

Nếu cùng inode có nhiều đường dẫn/nhóm, block được gán cho đường dẫn gặp đầu tiên. Tổng không cộng trùng hardlink, nhưng cột nhóm không khẳng định ownership hay số byte sẽ freed khi xóa riêng thư mục. Shared external xattr blocks vẫn có thể đếm lại; journal/checksum ext4 không verify. Root/dirname-based labels không phải payload provenance.

## Dữ liệu cụ thể và vùng chiếm lớn

- HP1 có75,188 GiB unpacked containerd snapshots và24,195 GiB blob/content; HP1 Docker fixtures/volumes/logs5,787 GiB; supporting gate inputs/runtime/evidence10,053 GiB. Đây là môi trường sinh từ kiểm, không tự suy toàn bộ disposable vì còn test results/volumes/private refs.
- Across pos-cafe roots: `source/node_modules`8,589 GiB; `npm-cache`1,980 GiB; private inputs/results/packages11,496 GiB; source/runtime/archives khác8,212 GiB. `private` chứa dữ liệu cần xác minh retention trước xóa, không phải tất cả “backup gốc” hay đã có bản thứ hai.
- Primary Docker database/Storage volumes10,345 GiB, primary container state/logs0,410 GiB. Đường dẫn large file là `supabase_db_pos-cafe-perm-s31-t04-20261013/_data/base/...`; đây là database pages theo path, chưa đọc row/payload nên không suy fake-vs-live hoặc cần-vs-không cần. HP1 volumes cũng có pgdata trong các namespace riêng.
- Một private package nguồn56 cólogical4.327.352.320 bytes ≈4,030 GiB trong Linux. Bản Windows nguồn56 đã quan sát riêng trước đó vẫn nằm ngoài VHD; chưa kiểm hash/equality toàn package trong lượt này và không chứng minh mọi backup khác đã có bản Windows.
- Riêng source55 được gán47,981 GiB; source51 được gán26,457 GiB; source56 15,077 GiB; source53 11,662 GiB; source57 11,241 GiB. Không cộng lại chúng vào tổng HP1; attribution theo hardlink encounter, không là scoped deletion/reclaim estimate.
- Dữ liệu có dấu vết dịch game: `/root/vi-game-env`1,281 GiB; `/root/nllb-ct2`0,585 GiB, trong đó `model.bin`622.596.105 logical bytes; `/root/vi_game_cache.sqlite3`1.654.784 inode-allocated bytes. Mục đích suy từ tên/structure, chưa gán riêng ReSister/RoboLife.
- Extras: `/usr`1,957 GiB; `/var/log`0,755 GiB; `/root/.cache`0,920 GiB, trong đó ms-playwright0,625 GiB. Không tự phân loại credential/config folders là cache được phép bỏ.

## Sửa ước lượng cũ và trạng thái snapshot

Query nhỏ xác nhận **9path `images.tar` ở source50–58 là hardlink cùng inode1295873, links9**. Unique guest allocation chỉ1,861 GiB. Con số16,748 GiB trước là tổng theo9path, có caveat double-count nhưng vẫn cần sửa khi dùng làm dung lượng thực. Không giữ kết luận “9bản độc lập chiếm16,75GiB”. Blob content13namespace vẫn24,195 GiB sau dedup toàn cây, do nhiều inode độc lập. Chưa hash payload để chứng minh chúng byte-equal.

Lần inventory đầu `inventory-03.json` bị bound4,5triệu inode, partial162,369 GiB. Không dùng làm bảng hoàn tất; final là `inventory-04.json`, tăng bound nhưng vẫn bounded. Lượt cuối đọc metadata cho thấy journal-recovery flag=false và superblock used khoảng190,187 GiB, khác snapshot đầu170,681 GiB/flag=true; VHD LastWrite vẫn22:15:45.7806995. Không quy sự thay đổi này cho thao tác của incident: helper chỉ `rb`, chưa xác định writer và không claim đã repair. Superblock used, inode-accounted file allocation và host VHD allocation là số đo khác nhau; khoảng17,145 GiB chênh superblock-vs-inode chưa được phân rã (filesystem metadata/reserved/unreferenced/shared accounting có thể góp phần), không dựng nguyên nhân cụ thể hoặc integrity PASS. Cần owner-authorized investigation nếu muốn xác minh mức block sâu hơn.

Chưa đọc nội dung các dump/database/private files, nên chưa chốt backup nào quan trọng/duy nhất/có thể xóa. Không phát hiện user documents chỉ từ tên không đồng nghĩa không có PII/private rows bên trong. Không có quyền backup mới, gỡ/xóa/compact/repair hoặc resume HP1. Các script báo cáo chỉ tạo JSON nhỏ trên D; original VHD/user/cloud data giữ nguyên bởi các thao tác của incident.

## Evidence và review

- `D:/Workspace/pos-cafe/artifacts/disk-incident-20261014/inventory-04.json`: raw actual-run tree/family/category/folder totals và largest files, không file payload. UTC nguyên văn `2026-10-14T15:44:59.163023+00:00` tương ứng22:44:59 Bangkok; PowerShell ConvertFrom-Json/ConvertTo-Json có thể hiển thị DateTime thành+07:00 nhưng không sửa file raw.
- `inventory-04-labelled.json`: bản diễn giải sửa nhãn8,941 GiB từ “older pos-cafe environments” thành “other pos-cafe environments”, vì rule prefix còn bao gồm HP1 review directories. Không đổi timestamp/inode/byte totals; mang sourceSHA256 và correction provenance, không phải một lượt scan mới. Báo cáo này dùng nhãn đã sửa. Mô tả sơ bộ trước là “môi trường cũ” không đủ căn cứ và được thay bằng “môi trường khác”.
- `inventory-wsl-content-run04.py`: frozen actual script đã chạy inventory04, giữ hash trước sửa nhãn. `inventory-wsl-content.py` đã sửa riêng string label cho lần dùng sau, không rerun. Cùng thuật toán/bitmap dedup toàn filesystem và small-report output; phụ thuộc `read-vhd-metadata.py` đã được review chẩn đoán trước. Frozen report candidate01 còn ở artifact để giữ lịch sử review.
- `hardlink-observation-04.json`: inode/link proof9archive paths.
- [Incident ban đầu](disk-incident-2026-10-14.md), [checkpoint điều kiện gỡ](disk-incident-ubuntu-removal-2026-10-14.md); quyền gỡ hiện chưa thỏa. Final inventory là evidence mới và cần2review độc lập trước bàn giao analysis là hoàn tất. Không đổi app/code/HP1 handoff/frozen artifacts hoặc Git HEAD.

Metadata sau review: candidate02 SHA`e6ec7d7d466c4f1ebc2cfa681ec564926ea06b085e3cc4f60e51a467cb74f1f3` đã được evidence và safety reviewer cùng **APPROVE**; EVC-CONTENT-01 CLOSED. [Biên bản review](../../reviews/disk-incident-content-analysis-2026-10-14.md). Bản core đã review giữ nguyên tại artifact `content-analysis-02-report-frozen.md`, đúng hash manifest trước bổ sung đoạn metadata này. Hoàn tất hồ sơ phân tích theo scope; **chưa khôi phục dung lượng hoặc được phép gỡ toàn distro**.
