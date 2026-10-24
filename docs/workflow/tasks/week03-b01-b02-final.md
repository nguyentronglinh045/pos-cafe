# Tuần 3: tích hợp B01 và B02

Ngày24/10/2026. Chỉ hai màn B01–Sơ đồ bàn và B02–Gọi món; B03/ReceiptPreview/paymentpanes/financialstore giữ main2da0d7e,khôngshipremakeB03. Source `9b6790ca85ca91338087239138c5dc389e45b86b8fb2ece0779703816b4a5209`. Codebranch `ui/week03-b01-b02-20261024`; docsbranch `ui-week03-b01-b02-docs-20261024`,basedocs4125687. Repo `nguyentronglinh045/pos-cafe`. Tácgiảcommit/PRcreatorđãxácminhAPI: `24tx610002-VoVanNgoc`,id227207168,noreply227207168+24tx610002-VoVanNgoc@users.noreply.github.com,pushtrue. Khôngtoken/mật khẩu trongevidence.

Ownerduyệt hai runtimecontract mới với app5191/ref4185; referenceB01v3/B02v3 và threshold không đổi. Giữ PaletteA v1/BeVietnamPro mộtnguồn CSS/Tailwind/MUI. B01 dải lầu riêng, cuộn ngang,44pxtargets,ellipsis+fullaria,1/2/5/6khuvực,27viewport×8fixture=216;canvaslogical1600×900 vàhitBoost/minScale giữ. B02 tìm/lọc/chọnmón/modifier/qty/note/draft/keep-discard/save/inbếp và handoffpaymentmain giữflow/quyền/dữliệu.

| Gate | Kết quả thực |
| --- | --- |
| TypeScript/buildmock |PASS |
| Unit |642PASS |
| Tools/selftest |79PASS/11controlsPASS |
| Calibration |B01:19,B02:29controlsPASS |
| Fidelity |B01default1pixel/2073600;B02clean/dirty0pixel;geometry0,tokens22/22,font/regionsPASS |
| Browser |149PASS,0skip/0fail/0flaky;B01/B02/integration/sharedtheme |
| Smoke |35PASS,31scope-skip,0fail/0flaky |
| Auditselftest |23findings/14rules/16controls,OK |
| Whole-appaudit |FAIL,39/39COMPLETE,37groups/76occurrences;19floorFP+18realoutside (payment10) |
| PhysicalWindowsmanual |NOT_RUN: nativecapturetimeout dù đãrecovery; khôngthaybằngheadless |
| Independentfinalreviews |PENDING exactpackage; ghi receipt riêng sauverdict |

Mọi12gates cùng source9b679…,khônglấyPASS gói ba màn. BaselineSHA79fe315c36c21db23a66724939b085e5ac4065d16780e2a0d26e1f9da5c87080 giữ. Cácfindingngoàiscopeđãđối chiếumain gốc564files; rawbaseexactdetailfalse2findingchọn-tất-cảwidthdo font, cùngheight20/21<24,khônggọi pixel/metric identical. JSON/MDtừngstate/selector/measure+ảnh ởpackageaudit.

Tiếp nối việc thiết kế tuần2; commit/PR mới ghi **Tuan3** thống nhất. Khôngsửa lịch sử hai commit thiết kếWeek01 hoặc tựbịa báo cáotuần1. PRởtrạngtháidraft để hoàn tất chạymáythật/dữliệumẫu theoGVHD trướcreadyforreview. Chưa kiểmtablet/phone,Supabase/RLS/backend thật,OSkeyboard/browserzoom thật. Chỉ tạoPR,khôngmerge/deploy.

Code/operator/referencebundle61members nằm trênmain;7OpenSpecartifacts/specB01-B02,decision/biênbản/evidence ởdocs. Cácsource/góiB01/B02/B03 cũ vẫngiữnguyên. Demo http://127.0.0.1:5191/; đối chiếu http://127.0.0.1:4185/week03-review/index.html . Sourceevidence khôi phục đủfilemới/tests; bundleclone-ready khôngphụthuộcworktreecũ.
