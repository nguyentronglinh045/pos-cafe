# Setup schema và phân quyền trên staging — 22/10/2026

Trạng thái: **đã apply và đối chiếu đúng candidate; COMMITTED_NOT_READY**. Cấu hình lưu đã trả về chỉ đọc lúc **16:31:09 Asia/Bangkok**, trước hạn17h. Chưa đủ full gate để push main; chưa phát hành production.

## Quyền và phạm vi

Owner chốt hạn17h tại call_72a24f794f9941cab522370806009e17 item0; chọn MCP ghi tạm rồi trả chỉ đọc tại call_f1764eba4eef4958b23d3c87a285418a item0; xác nhận Authorize tại call_e8483eb8dc884bec8ac1eae9a6b86f25 item0 và báo “đã mở lại” trong chat. Cutoff bắt đầu mutation16:45; hạn cứng17:00 ngày22/10/2026, Asia/Bangkok.

Target duy nhất ineckiashpwloncxnbqx. Không truy vấn DB gốc kfqjdfwxhkdwihjobpny. Lượt này dựng schema/RPC/RLS/ACL/hook/publication của candidateb2, giữ tenant/Auth/object data rỗng. Các bảng danh mục quyền và hai bucket cấu trúc do SQL tạo là một phần schema; không seed cửa hàng, tài khoản hoặc dữ liệu nghiệp vụ.

Không đổi Auth settings, deploy Edge, mở CI/backend nặng, push/merge main hoặc triển khai Vercel. Kế hoạch review ban đầu giữ nguyên tại [reviewed-plan01.md](../../implementation-log/permission-staging-setup-20261022/reviewed-plan01.md); bàn giao này không tạo quyền mới.

## Kết quả thật

| Bước | Kết quả và giới hạn |
| --- | --- |
| Sau restart16:11 | Native MCP đủ6tool; effective URL khóa staging/database/docs; hai profile gốc disabled |
| Introspection16:12:22 | postgres/sessionpostgres, PG17.11; app catalog/Auth users/buckets/objects0; allowlist mới được hai reviewer duyệt |
| Chuẩn bị | Nguồn app sạch b2e3122866f5b6108f026f381f4f12614c98027c; đủ28SQL/4controllers/30fragments; helper ngoài checkout app có7/7 test offline; hai reviewer duyệt exact bundle/transport |
| Apply16:26:19 | Một native apply_migration tên permission_staging_bootstrap_b2e3122_20261022_1700; kết quả thực success:true |
| Reconcile | Một SELECT đã pin; matchingMarkerObserved=true, binding/nonce khớp manifest; có stores, legacyEnum=null, Auth users0/Storage objects0; ready=false/businessTestsRun=false |
| Khép quyền16:31:09 | Stored config hash0afb…a8a9, ACL giữ nguyên; CLI xác nhận read_only=true/staging đúng/hai profile gốc disabled; không còn watcher |

Phần triển khai sau restart có **1 metadata SELECT +1 apply +1 reconcile SELECT**, không retry apply; cả hai claim tạo độc quyền còn nguyên. Metadata SELECT chỉ đọc trước restart là lịch sử riêng. Không nhận CI cũ của b2 thành kiểm chứng tooling mới hoặc business test trên staging.

Marker khớp cùng success:true là bằng chứng DO nguyên khối đã commit, gồm postflight về strict contract2, role/catalog, owner boundary, Storage/publication và raw privileges/PG17 MAINTAIN. Đây là suy luận từ semantics atomic DO và marker, không phải bộ test nghiệp vụ riêng. Nguồn guard/postflight: D:/Workspace/pos-cafe-permission-ci-fix-20261022/code/scripts/permission-staging-bootstrap-sql.mjs:56 và :85.

## Bằng chứng và cách đọc

Thư mục [permission-staging-setup-20261022](../../implementation-log/permission-staging-setup-20261022/) chứa:

- native-postgres-introspection01.json → postgres-observation01.json → provider-allowlist01.json; hai scope tại provider-review01.json.
- bootstrap-input01.json, phase-policy01.json, source-inventory01.json, successor-tooling-review01.json và source snapshots. Fingerprint bootstrapb966… không thay thuật toán fingerprint CI.
- bootstrap01/bootstrap.sql:543149bytes, SHA256 5c5c40dd5a0c3e98000a041da34446370fa539f47bd423fbe6196ba682c4e7f5.
- Manifest SHA b404504fd723fe2df25e471f97d9c11eef5431caac23c1f453f4fa3121f082d3; reconcile SHA54ea8f763573da4bc3aa441b486280bc34c6d881bad37ff87d5f117aa2ce72d7. Artifact không sửa sau execution; kết quả nằm ở receipt riêng.
- bootstrap-review01.json, native-transport01.json, native-payload-loader01.js.txt, native-payload-loader-check01.json: nguyên chuỗi SQL lắp từ33 đoạn đọc local; SHA/size sai bị từ chối; không chia thành nhiều remote statements. Không tuyên bố digest JS độc lập.
- bootstrap-apply01.claim.json/.result.json và bootstrap-reconcile01.claim.json/.result.json: claim/raw result/parsed marker. outcome01.json tóm tắt; predecessor-snapshots/ giữ raw manifest/claim cũ đúng hash, không reset lịch sử.
- early-readonly-restore02.json, source/launch02, early-readonly-effective-cli01.json; gate review cuối tại final-review01.json.

Hồ sơ chưa phải nghiệm thu của owner. Walkthrough chưa được owner xác nhận: điểm đọc chính là guard trước ghi ở SQL renderer:56, collector30fragments ở helper prepare.mjs:131, postflight renderer:85 và raw reconcile. Không suy owner đã xem/hiểu code.

## Lỗi cục bộ và điều phải tránh lần sau

1. Watcher đầu chạy powershell.exe không tìm được Get-FileHash; chuyển sang bundled pwsh đã có. Không cài runtime mới.
2. Watcher đã thoát khi Codex restart. Sau restart đã kiểm PID vắng mặt rồi khởi động lại; không được hứa background process sống qua restart.
3. File.Replace với $null bị PowerShell bind thành tên backup rỗng. Lần restore đầu dừng trước thay config; correction dùng NullString.Value, cùng temp thuộc task, đã thay atomically và kiểm hash/ACL thật.
4. Source watcher9c… được giữ nguyên làm lịch sử và đánh dấu **KNOWN_NOT_REUSABLE** trong deadline-readonly-guard-retired01.json. Review/parse trước đó không thay runtime PASS; không dùng lại nguyên source này làm guard.
5. File.Replace không phải CAS. Khôi phục dùng contract một writer được phối hợp; actor ngoài contract vẫn có thể tạo race. Không tuyên bố hạn tuyệt đối khi máy ngủ/process bị dừng.
6. Parser local đầu tiên chọn nhầm boundary trong lời nhắc MCP; đã sửa regex có đầu dòng và parse lại chính result đã lưu, không gọi SQL lại.

Khôi phục **stored config** không reload live MCP đang mở và không revoke OAuth. Không gọi DB thêm sau khôi phục. Lần kết nối mới cần nạp profile chỉ đọc; chưa có SELECT mới chứng minh live role/transaction_read_only sau lần khôi phục này.

## Tiếp tục đúng chỗ

**Không chạy lại bootstrap này.** Một lượt apply đã tiêu thụ và marker đã commit; replay phải bị freshness guard từ chối. Bundle cũ38 và cửa sổ11h đã hết hạn. Không sửa clock/cutoff hoặc đổi receipt để dùng lại approval.

Bước sau là kiểm profile chỉ đọc sau reload, rồi chốt cửa sổ/phạm vi riêng cho Auth settings, Edge deployment và synthetic app flow nếu owner giao. Giữ nền DB hiện tại; chưa reset hoặc nạp lại PIN pristine fixture lên DB này.

Coverage/full gate giữ nguyên35stage/760identities;29backendstage/417identities chưa chạy. Managed PG17 không thay T04 cần Docker/SUPERUSER/physical identity/whole-DB restore hoặc fixture PIN/nativePG16. Chỉ push main khi đủ full gate theo quyết định owner; DB gốc chỉ cập nhật sau owner xác nhận ổn. Không có runtime nặng, WSL/Docker hoặc package mới trong lượt setup này.
