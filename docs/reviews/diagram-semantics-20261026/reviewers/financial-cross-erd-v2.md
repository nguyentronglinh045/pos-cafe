# Receipt kiểm chéo độc lập ERD, candidate v2 — APPROVE

Reviewer: `/root/review_financial`, ngày 26/10/2026. Tôi không tạo bảng ERD khảo sát ban đầu và không sửa candidate. Đây là receipt mới cho v2; giữ nguyên receipt v1 `financial-cross-erd.md`, SHA256 `8052c49a33fdb7e2b71dc847949b4a44668a9c2c99f946bec3c063c1d91cd64d`.

**Candidate được duyệt:** `candidate-manifest.json` SHA256 `13110a1ad65090f34c7f5bf6a650ff6e9efd5a6ae05f6d2779e28695e880cd51`.

**Evidence được dùng:** `evidence-manifest.json` SHA256 `6d8c701c3f2d3e94023f4c435766f141ce4d0950320229284d436001f8b313ea`.

Phạm vi giữ nguyên: 8 ERD, 36 cạnh/35 entity dự án/6 entity đứng riêng; traceability và ràng buộc, findings ERD, nguồn O/W/S/L và giới hạn kiểm chứng trong 4 file; tính nhất quán kết luận ERD với bảng đủ 16 hình. Không thay reviewer F05–F08, không tự duyệt bảng tài chính tôi góp khảo sát ban đầu.

## Kiểm v2 và kế thừa kiểm v1

1. Tự tính lại hai manifest và toàn bộ entry: **4/4 candidate, 1272/1272 evidence khớp SHA256 và bytes; không entry thiếu hoặc sai**. Hai hash manifest đúng như nêu trên. Hash hai manifest lưu `history/v1` khớp receipt v1 (`3608e8e4bf0d548d2c17ccfccf273fb3324450b8ddf5bc03b9dd17e141fb99ee` và `549aa72852848bdfc88ef6d88b87e13ab9629ca6eb174f062dee18fed70006cf`).
2. Tự diff toàn bộ 4 file v2 với bản giữ trong `history/v1`: chỉ 3 dẫn chiếu adapter trong các row F07-01/F07-02/F07-05 của `traceability.md` thay đổi. README/findings/verification không thay đổi byte. Không đổi ERD, kết luận, source scope, evidence interpretation hoặc acceptance.
3. Đọc recipe `correct-trace-v2.cjs`; đối chiếu nguồn adapter: `getAuthority` ở dòng 123–128 và `getRevision` ở 129–137, kiểm generation lần lượt ở 127/133. Dẫn chiếu v2 123–136/129–136 đúng vùng thực thi; adapter O/W cùng SHA256 `62de6a828bc1c16669c603fb735b3acadc85ef90559a829d184477d619f75b4e`. Đây là kiểm delta, không thay cuộc audit F07 của reviewer chuyên trách.
4. Diff evidence manifests: thêm 7 entry (recipe sửa dẫn chiếu, 2 manifest v1 và 4 candidate v1); đổi hash `candidate-manifest.json`, `preservation.json`; không mất entry. Không thay source/catalog/runtime/checks/PNG bằng chứng đã dùng trong kiểm ERD v1. Preservation mới quan sát `2026-10-26T09:34:54.661Z`, vẫn ghi HEAD/index/status unchanged, snapshot hash errors rỗng và remote O/D giữ nguyên; phân biệt metadata tác giả với phép hash artifact tôi tự làm.
5. Kế thừa kiểm ERD v1 vì phần nội dung và bằng chứng liên quan không đổi: đọc 8 Mermaid/caption và DDL/controller; kiểm catalog PK/FK/nullability/cardinality cả unique indexes; checker độc lập xác nhận đủ 36 cạnh và 6 standalone không FK; hash và xem đủ 8 PNG. Không rerun test DB/browser/hardware hoặc render A4. Các giới hạn staging S khác runtime L, gate mở và F04 cần sửa vẫn giữ nguyên.

## Findings và verdict

**Không có finding chặn trong phạm vi kiểm chéo ERD/provenance trên v2. Verdict: APPROVE** đúng hai hash nêu trên. Delta F07 không ảnh hưởng kết luận kiểm ERD, và dẫn chiếu mới đã kiểm trực tiếp.

APPROVE là duyệt tính chính xác của hồ sơ review trong phạm vi được giao; không duyệt F04 chưa sửa, không nghiệm thu DB/runtime/sản phẩm, không cho phép sửa code/DB hoặc phát hành bộ hình. Nội dung hoặc bằng chứng liên quan thay đổi sau hai hash này phải được kiểm lại.
