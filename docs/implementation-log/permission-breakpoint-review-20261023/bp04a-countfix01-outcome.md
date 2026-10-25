# COUNTFIX01 — sửa metric count và kiểm offline26/26

Ngày23/10/2026, Asia/Bangkok. **Hoàn tất tooling/fact và một batch26/26PASS offline.** Chưa chạy full46preflight, cài/build/unit hoặc cập nhật main/DB.

## Quyền và nguồn

Owner `request_user_input_async call_f93896fc7e8a4942b1f2ee620fbca66a item0` cho sửa offline30phút theo [proposal](bp04a-countdiag02-outcome.md). [Grant](bp04a-countfix01-owner-grant.json) ghi nhận14:07:21, ngừng test mới đủ sớm để hoàn tất trước14:32:21, hard stop **14:37:21**. Một batch; unexpectedFAIL/UNKNOWN phải dừng, expectednegative là PASS nếu bị từ chối đúng. Không network/full46/install/build/appunit/push/CI/backend/DB/deploy/cleanup.

Code app sạch `e42215044b4faf7e90f787ae8e975937ad3e4479`, lock `85969c1c161f74e9f68563182d99d1b0ac6fb5f17f5074444f329675ffd34e18`. Không sửa parser cũ, collector cũ, main03/grants đã đóng hoặc facts registry gốc. Tooling mới đặt trong operations, không được kích hoạt như một grant chạy nặng.

## Thay đổi và lỗi được đóng

1. [Certified fact](bp04a-countfix01-certified-fact.json) giữ metadata9, thêm regular7/19.802byte, inventory và nguồn bằng chứng của đúng `@types/pg@8.23.1`/SRI/bodySHA. Raw file SHA256 `3fae28db2709013b7aef24a77bafe413310ff64381f635ecb5ae3c99a219ad23`. Digest `4aebff07e02453c7f5bd1939c03f78c502aa265cb24ce387d68284b4d6a3d5bc` là SHA256 của `JSON.stringify(parsedFact)` giữ thứ tự key, không phải chuẩn canonical JSON sắp key.
2. [Helper](D:/Workspace/pos-cafe-permission-timeonly-20261022/operations/bp4-regular-count-facts01.mjs:18) tạo46expected items từ facts/lock, giữ raw metadata tổng1.579 và suy expected regular tổng**1.577** từ từng item. Đây đóng cả lỗi aggregate cũ còn hardcode1.579 tại [main03](D:/Workspace/pos-cafe-permission-timeonly-20261022/operations/run-bp4-local03.mjs:82); nếu chỉ sửa target9→7 thì aggregate cũ vẫn chặn. Không dùng heuristic trừ2 cho mọi package.
3. [Adapter](D:/Workspace/pos-cafe-permission-timeonly-20261022/operations/bp4-regular-count-facts01.mjs:33) chỉ dùng7 sau khi kiểm exact package/version/lockPath/URL/SRI, compact fact digest và SHA256 body thực. Package khác giữ count metadata nghiêm ngặt. Parser cũ tiếp tục kiểm SRI/checksum/path/root/type/byte/count. Output ghi riêng raw metadata9, expected regular7 và nguồn chứng nhận.
4. [Collector copy](D:/Workspace/pos-cafe-permission-timeonly-20261022/operations/bp4-archive-collector-countfix01.mjs:21) truyền đầy đủ identity/fact vào adapter; transport/timeout/abort/giới hạn cũ giữ nguyên. [Aggregate assertion](D:/Workspace/pos-cafe-permission-timeonly-20261022/operations/bp4-regular-count-facts01.mjs:38) kiểm46identity duy nhất, count từng item và tổng1.577; không cho count sai bù nhau qua tổng.

Main03 cũ giữ nguyên và đã hết grant. Consumer chạy thật tiếp theo **phải** dùng cả `derived.items` và `assertRegularFileTotal`; không được chỉ thay import collector rồi để mapping thiếu version/fact và literal1.579 cũ. Bản sửa hiện tại là module/collector đã kiểm offline, chưa có full runner mới được admit.

## Review trước test và runtime thực

Hai reviewer khác tác giả APPROVE exact sources trước [source admission](bp04a-countfix01-source-admission.json)14:22:31.589. Các source pins:

| File | SHA256 |
| --- | --- |
| helper | `6230b753ccbdb1f71cd748c99f4732c2b5816cc69ce132ce60745dc5d7537311` |
| collector copy | `8091a91f64fda093a733fbf8ed079282a6fb4c95b5d9a9b8ab16db0d525acca5` |
| harness cuối | `c518e6eec98b83f1341fa3ac22d4d838f17bad72bc9eae9cb2d333db8c8dd032` |

[Report](bp04a-countfix01-controls.json) SHA256 `1343d9fdb79651ff706fc4a007abcfedb062bbfc5d968d28dd8043400e8d316f`, **14:22:32.714–14:22:32.813**,26/26PASS, network0. Bật chặn global fetch; collector chỉ nhận fake transport. Một batch duy nhất, không retry. Reviewer sau chạy chỉ đọc/hash.

Kiểm có ý nghĩa gồm: exact archive cũ vẫn thất bại9/7 với parser gốc nhưng adapter thành công7/19.802; collector thật đi qua adapter với fake transport; sai version/SRI/body/fact hoặc thiếu counts phải từ chối; raw9 không được âm thầm đổi thành7; directory/PAX không thay countfile; ordinary package không được trừ2; các guard SRI/byte/path/type/root giữ nguyên. Arithmetic controls dùng46model result identities, từ chối tổng cũ1.579, count sai bù nhau, duplicate/missing identity và SRI sai. **Model arithmetic không xác minh45 archive còn lại.**

[Job proof](bp04a-countfix01-controls.release.json) SHA256 `720ca2cd2aac9847d8fe1fc61e3fbeee5e583f743932af19dc7fe06bc20465dc`: wrapper14:22:32.405–.824, rootExit0, active0, releaseVerified/passed=true, no timeout/orphan/native failure. Helper Job `794b81...` được reuse đúng hash, không chạy lại controls không đổi. Child cap60s và release headroom30s nằm trước reserve.

Trong chuẩn bị, PowerShell object-view từ chối empty root key của lock; đã chuyển đọc-only sang `-AsHashtable` trước khi tạo fact/test admission. Ghi ở [readiness snapshot](bp04a-countfix01-readiness-observation.json); không có batch failed bị xóa/reset. Đây không phải kết quả test chức năng hoặc lý do đổi source/acceptance.

## Lưu giữ và giới hạn

[Post snapshot](bp04a-countfix01-post-observation.json) xác nhận source/lock, parser/collector/main cũ, facts gốc và sáu phase03ledger hashes không đổi; process child đã nhả. [Manifest](bp04a-countfix01-manifest.json) pin9raw copies. Không cleanup; archive nhỏ được giữ để tránh tải lại.

Tại snapshot14:16:52, task51.686.830B, tăng377.700B từ baseline; retained333.601.917B, C/D còn trên30GiB. Các số tree là logical bytes/snapshot, không quota OS. Không cài mới hoặc tạo môi trường khác.

Full-preflight vẫn2/2 đã dùng, diagnostic GET1/1 từ lượt trước, batchoffline hiện1/1. Install/native/build/unit/CI/backend/DB/deploy đều NOT_RUN trong lượt này; không push. Coverage/acceptance/110srcunit/full permission gate giữ nguyên. Chưa đủ cơ sở cập nhật main.

## Bước tiếp theo, chưa có quyền chạy

[Kế hoạch75phút cho full local](../../workflow/tasks/permission-bp4a-full-local-after-countfix-2026-10-23.md) gộp chuẩn bị consumer mới → full46preflight (45GET+retained target) → một npm ci → build →110file unit/coverage≥90%, dừng ngay khi phase thật FAIL/UNKNOWN. Đề nghị này còn chờ owner; không chuyển tiếp bằng thời gian/quota dư của grant offline. Walkthrough: fact → derive/item/aggregate → collector adapter → report/proof → consumer integration pending. Chưa nhận owner nghiệm thu.
