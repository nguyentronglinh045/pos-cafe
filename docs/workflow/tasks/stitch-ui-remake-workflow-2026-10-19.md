# Bàn giao workflow remake UI Stitch — 19/10/2026

Đã xuất bản [workflow dùng chung](../stitch-ui-remake/README.md), [mẫu](../stitch-ui-remake/templates.md), [palette/font](../stitch-ui-remake/palette.md) và [hướng dẫn bộ đo](../stitch-ui-remake/measurement.md). Chủ dự án chốt A v1 sửa tương phản, Be Vietnam Pro, minimum landscape 568×320 CSS px; cho tạo công cụ và push để nhóm dùng.

Code ở [PR #7, base main](https://github.com/nguyentronglinh045/pos-cafe/pull/7), docs ở [PR #8, base docs](https://github.com/nguyentronglinh045/pos-cafe/pull/8). Chọn đúng feature refs trong PR trước khi dùng; hai base chưa được merge bởi task này.

Code candidate `340c903` có 76 tests PASS và 11/11 calibration controls đúng; hai reviewer độc lập APPROVE phạm vi cuối. [Biên bản](../../implementation-log/stitch-ui-workflow-2026-10-19.md) giữ source/reference/contract hashes, môi trường, findings và giới hạn. [Change OpenSpec](../../../openspec/changes/add-stitch-ui-remake-workflow/proposal.md) ghi D1–D4 và traceability.

Không có app screen được remake hoặc nghiệm thu trong task này. Task tiếp theo cần màn/slice được giao, intake/mapping, normalized reference/deviations/threshold được duyệt, rồi triển khai và chạy đủ gate của sản phẩm; một PASS fixture không thay các điều kiện đó.
