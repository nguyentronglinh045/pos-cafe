# Bàn giao workflow remake UI Stitch — 19/10/2026

Đã xuất bản [workflow dùng chung](../stitch-ui-remake/README.md), [mẫu](https://github.com/nguyentronglinh045/pos-cafe/blob/main/ui-remake/templates.md), [palette/font](https://github.com/nguyentronglinh045/pos-cafe/blob/main/ui-remake/palette.md) và [hướng dẫn bộ đo](https://github.com/nguyentronglinh045/pos-cafe/blob/main/ui-remake/measurement.md). Chủ dự án chốt A v1 sửa tương phản, Be Vietnam Pro, minimum landscape 568×320 CSS px; cho tạo công cụ và push để nhóm dùng.

Code và hướng dẫn vận hành ở [PR #7, base main](https://github.com/nguyentronglinh045/pos-cafe/pull/7); spec/biên bản/quy ước ở [PR #8, base docs](https://github.com/nguyentronglinh045/pos-cafe/pull/8). D5–D6 cho phép chuyển tài liệu vận hành đi cùng code và merge đúng hai base sau kiểm chứng/review/CI. Trạng thái merge và source cuối xem PR cùng checkpoint mới nhất trong biên bản; không lấy mốc push lần đầu làm trạng thái cuối.

Candidate lần đầu `340c903` có 76 tests PASS và 11/11 calibration controls đúng; hai reviewer độc lập APPROVE phạm vi đó. Sau D5–D6, phải kiểm và review candidate mới trước merge. [Biên bản](../../implementation-log/stitch-ui-workflow-2026-10-19.md) giữ fingerprint, môi trường, findings và giới hạn từng checkpoint. [Change OpenSpec](../../../openspec/changes/add-stitch-ui-remake-workflow/proposal.md) ghi D1–D6 và traceability.

Không có app screen được remake hoặc nghiệm thu trong task này. Task tiếp theo cần màn/slice được giao, intake/mapping, normalized reference/deviations/threshold được duyệt, rồi triển khai và chạy đủ gate của sản phẩm; một PASS fixture không thay các điều kiện đó.
