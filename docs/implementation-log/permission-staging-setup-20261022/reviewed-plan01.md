# Chuẩn bị staging hiện hành cho kiểm thử — 22/10/2026

Trạng thái: **kế hoạch/phương án quyền đang chờ owner chọn; chưa thay cấu hình ghi hoặc DB**.

## Mục tiêu và quyền

Owner yêu cầu ưu tiên setup DB staging mới nhất để test; sau câu hỏi về cửa sổ mới, trả lời **17h** tại request `call_72a24f794f9941cab522370806009e17`, item0. Hạn cứng 17:00 ngày22/10/2026 Asia/Bangkok (10:00UTC). Đề xuất không bắt đầu mutation sau16:45 (09:45UTC), để dành đối chiếu/bàn giao. Đây là lượt setup mới; không reset cửa sổ11h hoặc claim/counter cũ.

Target duy nhất `ineckiashpwloncxnbqx`; DB gốc `kfqjdfwxhkdwihjobpny` vẫn cấm đọc/ghi dữ liệu. Chưa mở thêm CI, backend nặng, push main, Vercel, thay đổi Auth, deploy Edge hoặc tạo tenant/dữ liệu test.

## Hiện trạng đã đọc

- Local candidate sạch và remote `run/permissions-20261020` đều `b2e3122866f5b6108f026f381f4f12614c98027c`. Remote main vẫn `2da0d7e10d65ed4e79c8628d65220582a6cbd32b`. Không dùng dirty checkout owner làm nguồn.
- Một SELECT metadata chỉ đọc trên staging cho `public`: tables0/views0/functions0; không có dòng cho private/app_private/supabase_migrations. Không kết luận đầy đủ fresh-provider/Auth/Storage từ phép kiểm này. Raw tại `metadata-readonly01.json`.
- Snapshot source bằng chính bootstrap `readSource`:1106files,28SQL,4controllers, fingerprint `b966736214d772b33ebcc37bf6d5ad8e8df79c861d09d877dc6db13ffd6758dd`; đây là thuật toán fingerprint bootstrap, không thay thế fingerprint thuật toán CI. Canonical SQL bundle SHA `efbd60e136525932704547f13ecccf4ff72e688402f178050502fb92fde68d34`. Inventory tại `source-inventory01.json`.
- Hai agent đã kiểm: b2 không đổi SQL/Edge/activation so với38. 28SQL canonical và4controllers sau chuẩn hóa newline khớp nguồn cũ; raw bytes có khác CRLF/LF, phải tạo fingerprint/manifest mới.
- Bundle bootstrap cũ chưa Run, bind38 và cutoff đã hết hạn. Generator `permission-staging-bootstrap.mjs` hardcode cửa sổ cũ; không giả clock, sửa tay timestamp của SQL cũ, replay hoặc đổi manifest để nhận approval cũ.

## Phạm vi ưu tiên đề xuất trước17h

1. Dựng đúng schema, function/RPC, RLS/ACL, hook và publication của candidateb2 trên staging; giữ tenant/Auth/object data rỗng. Không lấy data hoặc dump DB gốc.
2. Kiểm metadata/contract và marker sau bootstrap. Bootstrap thành công chỉ là COMMITTED_NOT_READY; không coi là app ready hoặc full tests PASS.
3. Sau checkpoint DB mới xem Auth settings, hai Edge functions và synthetic app flow như phần riêng. Không tự tắt email confirmation, seed accounts hoặc vòng qua bootstrap/PIN invariants để thử nhanh.

Managed staging không thay thế29backendstage/417identities hiện có trên runner cô lập, vì T04 cần Docker/SUPERUSER/physical identity/whole-DB restore và PIN credential-expiry cần Auth signing key của fixture. Giữ nguyên35stage/760requiredidentities,726PERM occurrences,111PIN mappings và nativePG16; không viết hosted adapter chỉ để đếm đủ stage.

## Phương án thực hiện và gate

- MCP hiện bị khóa chỉ đọc đúng yêu cầu trước đó. Để ưu tiên MCP cho setup DB, đề xuất đổi riêng profile staging sang database đọc/ghi; vẫn chỉ features database/docs và hai profile DB gốc disabled trong project. **Chưa áp dụng**. Diff reviewable: `current-readonly-config.toml` → `proposed-staging-write-config.toml` trong evidence.
- Quyền ghi đề xuất chỉ phục vụ lượt setup này; sau apply/đối chiếu hoặc trước hạn17h sẽ trả cấu hình project về bản chỉ đọc đã kiểm. Không nhận việc tắt profile là đã revoke quyền OAuth ở Supabase, không tự revoke app/tài khoản hoặc quyền tổ chức khác.
- OAuth cần scope đọc/ghi DB phù hợp cho migrations và có thể phải người dùng Authorize/restart. Không gửi token/mật khẩu vào chat, không đọc credential store và không tự chọn scope rộng sang services khác. Đối chiếu scope OAuth hiện hành trước mở flow.
- Khi đã có transport phù hợp, chạy đúng SELECT introspection đã ghim tại `proposed-postgres-introspection.sql` bằng vai trò thực tế của write transport. Chỉ đọc catalog, provider capabilities và aggregate freshness; không thực thi bootstrap ở bước này. Allowlist provider phải dựa output thật và hai reviewer.
- Tạo successor preparation nhỏ cho cửa sổ mới, có nguồn/quyết định owner, predecessor và hash lịch sử. Giữ source ứng dụngb2; tooling/controller mới phải có source snapshot/hash và kiểm riêng, không nhận CI18phase của b2 thành PASS của tooling mới. Không thay đổi source ứng dụng, không chạy/publish CI chỉ để tạo artifact deploy.
- Exact bundle mới phải giữ thứ tự đầy đủ28SQL/shared activation controller và live target/freshness/capability/lock/deadline/atomic guards. Không chỉ chạy migrations001–017: sẽ thiếu permission candidate. Không migration glob, fake Auth/Storage hoặc reset.
- Chỉ thực thi sau kiểm tooling và **hai review scope trên đúng bundle/transport/binding**. Một apply atomic, rồi reconcile đọc. Nếu timeout/unknown: chỉ xác định outcome, không tự replay. Nếu guard từ chối hoặc không đủ thời gian: dừng phần ghi và giữ gói/bằng chứng.
- Gói SQL mới chưa được tạo/APPROVE; scope permission và cửa sổ mới không thay approval exact-output hoặc full gate.

## Khả năng hoàn thành

Ước tính kế hoạch của reviewer:45–90phút cho successor/introspection/bundle/review/apply/reconcile sau khi transport phù hợp; Auth/Edge/synthetic app flow thêm30–60phút. Đây không phải cam kết hoặc thời gian đo. Tại15:28 còn khoảng92phút tới17h; do đó ưu tiên DB schema/logic và báo rõ nếu chỉ kịp gói chuẩn bị. Full backend là lượt riêng, không hứa hoàn tất trước17h.

## Bằng chứng và câu hỏi đang mở

Evidence: [permission-staging-setup-20261022](../../implementation-log/permission-staging-setup-20261022/).

Cần owner chốt việc mở quyền ghi staging để triển khai phạm vi trên; giữ chỉ đọc thì chỉ chuẩn bị artifact. Chưa đổi stored config hoặc DB trong task này. Bản đề xuất cấu hình và câu metadata SQL đã sẵn để review, không bao gồm approval cho unseen bootstrap SQL.

Tài liệu nguồn: [handoff tiếp tục](permission-next-release-session-2026-10-22.md), [kết nối staging](permission-mcp-staging-readonly-2026-10-22.md), [Supabase MCP scope/read-only](https://supabase.com/docs/guides/ai-tools/mcp), [permission scopes](https://supabase.com/docs/guides/platform/personal-access-tokens#mcp-tools).
