# Review độc lập — inventory nội dung WSL, 14/10/2026

Phạm vi: phân tích metadata dung lượng, safety/privacy/authorization. Không cấp quyền cleanup, unregister, backup hoặc recovery; không chứng nhận integrity/payload/restore. Không reviewer chạy scanner, đọc VHD, mount hoặc mutate.

## Candidate và lịch sử

- Candidate01 `content-candidate-01.json` SHA`17119f5ea8f98cf33b20a76e06004d885b81b59732a8d64bdd351b51186b581c`: safety APPROVE; evidence CHANGES_REQUESTED với EVC-CONTENT-01, nhóm8,941 GiB gọi là “cũ” không được rule prefix chứng minh. Có HP1 review directories trong nhóm. Frozen report/source giữ ở artifacts.
- Candidate02 `D:/Workspace/pos-cafe/artifacts/disk-incident-20261014/content-candidate-02.json` SHA`e6ec7d7d466c4f1ebc2cfa681ec564926ea06b085e3cc4f60e51a467cb74f1f3`: cả hai reviewer kiểm khớp7file/hash/bytes; **cả hai APPROVE same exact candidate**.
- Original inventory04 và actual-run source giữ nguyên. Label sửa ở derived JSON cósource SHA/provenance, current scanner chỉ sửa một string, không dựng lượt scan mới. Candidate02 report freeze tại `D:/Workspace/pos-cafe/artifacts/disk-incident-20261014/content-analysis-02-report-frozen.md`, byte hash khớp file report trong manifest trước bổ sung metadata review.

## Reviewer evidence — incident_evidence_review

Verdict cuối: **APPROVE candidate02**, EVC-CONTENT-01 **CLOSED**.

Đã kiểm bitmap loại inode trùng toàn cây, fast inode formula/offset giữ reader gốc, symlink không follow, arithmetic/source binding. Ba tổng topLevel/families/dataCategories đều185.802.645.504 bytes =173,042198 GiB. HP1 folder tổng135,198841 GiB.9images.tar cùng inode1295873 được tính một lần1,860882 GiB; không giữ overestimate16,748 GiB. Chênh superblock17,144688 GiB chưa được gán nguyên nhân.

Delta02: raw inventory/frozen scanner khớp candidate01 hash; scanner hiện tại chỉ sửa string; derived JSON chỉ sửa một nhãn và thêm provenance, mọi timestamp/inode/byte totals/dữ liệu khác nguyên vẹn. Report phân biệt actual raw và editorial change. SQLite number dùng frozen allocation1.654.784 bytes. Không còn finding chặn.

Chưa kiểm checksum/integrity, file payload, writer, cleanup eligibility hay recover/restore. Không thực thi lại probe.

## Reviewer safety — incident_safety_review

Verdict cuối: **APPROVE candidate02**, không finding chặn/đề xuất tồn đọng.

Đã kiểm đúng quyền user: chỉ phân tích; unregister conditional chưa thỏa vì có game-related-looking data. Report phân biệt private/database/backup chưa xác minh với generated layers/modules, path attribution không phải ownership, số đo không phải reclaim guarantee. Không suy journal flag mới thành đã repair hoặc integrity PASS. Không coi thiếu user document name là không có private data bên trong.

Delta02:7hash/bytes khớp; raw/helper/hardlink evidence giữ nguyên; scanner/derived JSON đúng sửa nhãn nhỏ; scope và giới hạn không đổi. Cảnh báo timestamp trước của reviewer do PowerShell DateTime rendering; raw file UTC15:44:59.163023+00:00 đúng, tương ứngBangkok22:44:59.

Chưa đọc VHD/scanner runtime, backup/Windows package equality hoặc restore. Approval chỉ cho hồ sơ phân tích.

## Root đối chiếu

Hai verdict bao phủ evidence/accounting và safety/authority. Báo cáo core/actual-run bytes đã freeze, chỉ bổ sung metadata kết quả review sau gate theo workflow; không thay số đo/diễn giải/acceptance. Handoff/index trỏ analysis cuối. Toàn bộ hành động thực tế vẫn chỉ đọc VHD và tạo hồ sơ nhỏ trên D, không gỡ/xóa/move/repair/compact/backup lớn, không resume HP1.
