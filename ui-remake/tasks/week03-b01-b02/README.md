# Week 03 — B01/B02 only

Mã nguồn trên nhánh ui/week03-b01-b02-20261024; spec, ownerrecord và biên bản ở companiondocs ui-week03-b01-b02-docs-20261024. Giữ nguyên reference B01v3/B02v3 và mọi ngưỡng; chỉ đổi runtime hai màn sang app5191/ref4185. Các proposedconfig cần owner duyệt runtimecontract mới trước khi đo. Không cập nhật baseline.

Dùng dependency/Chromium đã có và lockfile. Chạy Vite5191 với mock/URL-keySupabase rỗng; reference root artifacts/stitch ở4185. Đặt WEEK03_EVIDENCE_DIR thành thư mục mới rồi chạy node node_modules/@playwright/test/cli.js test -c playwright.week03.config.ts. Fidelity dùng hai approvedconfig b01.json/b02.json sau ownerduyệt. B03/ReceiptPreview giữ main, không đưa remakeB03 vào PR này.

Build/unit/tools/selftest/calibration/fidelity/responsive/smoke/audit phải trên source cuối của hai màn; không lấy PASS của ba màn để nghiệm thu hai màn. Audit theo thứ tự detector→app→đọcreport→xemảnh→classification, khôngupdatebaseline. Hai reviewer độc lập chốt gói cuối. Source/previews/fixturemock không chứng minh thiết bị/backend/browserzoom/OSkeyboard thật. Commit/PR ghi Tuần3 thống nhất; chưa merge/deploy.

Owner đã duyệt hai runtimecontract bằng phản hồi “Duyệt hai hợp đồng runtime B01–B02”. Trước khi chạy từ clone mới: `node ui-remake/tasks/week03-b01-b02/prepare-reference.mjs`; bundle đi cùngcode cung cấp toàn bộ reference và support (B01matrix, B02normalizedPNG). Script từ chối ghi đè file khácbytes.
