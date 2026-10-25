# MCP Supabase staging — chỉ đọc — 2026-10-22

Trạng thái hiện tại: **kiểm kết nối MCP/SELECT thật trên staging chỉ đọc PASS**. Đã kiểm một SELECT, `connection_ok=1`, `database_role=supabase_read_only_user`, `transaction_read_only=on`; không truy vấn DB gốc. Đây là thao tác cấu hình được người dùng giao riêng sau checkpoint phát hành; không mở lại ngân sách CI, SQL ghi, backend hoặc push main.

## Yêu cầu và quyết định

Nguồn ủy quyền: yêu cầu trực tiếp ngày 2026-10-22: “chuyển MCP sang project staging ineckiashpwloncxnbqx rồi kiểm tra kết nối chỉ đọc giúp tôi, không chạm DB gốc”.

- Chỉ sửa cấu hình project `D:/Workspace/pos-cafe/.codex/config.toml`: đổi server `supabase_pos_cafe` sang staging/chỉ đọc, giữ override `pos_cafe_supabase_ro.enabled=false` có sẵn và bổ sung override `supabase.enabled=false` sau xác thực.
- URL: `https://mcp.supabase.com/mcp?project_ref=ineckiashpwloncxnbqx&read_only=true&features=database,docs`.
- Giữ năm tool chỉ đọc hoặc tài liệu: `execute_sql`, `list_tables`, `list_extensions`, `list_migrations`, `search_docs`. Bỏ `apply_migration` khỏi allowlist và thêm vào denylist.
- Giữ override `pos_cafe_supabase_ro.enabled=false`. Effective config xác nhận cả hai profile chứa ref DB gốc đều disabled trong project này.
- Không sửa cấu hình global hoặc Playwright trong các thao tác của task; không sửa token thủ công, OAuth do Codex CLI quản lý. Không có baseline byte của global từ đầu lượt; reviewer chỉ xác minh project diff và hiện trạng global, không chứng nhận lịch sử byte của global.

## Checkpoint cấu hình trước xác thực — lịch sử

Evidence: [mcp-staging-readonly](../../implementation-log/permission-release-20261022/mcp-staging-readonly/).

| Kiểm tra | Kết quả |
| --- | --- |
| TOML parse, scope staging, read_only và allow/denylist | PASS |
| `codex mcp list --json`, chỉ lưu trường Supabase không bí mật | PASS: chỉ `supabase_pos_cafe` enabled; đúng URL staging/chỉ đọc |
| OAuth cho URL mới | `not_logged_in` |
| Kết nối MCP đang nạp trong hội thoại | Chưa reload/xác minh; không gọi tool DB trên kết nối có thể đang cache URL cũ |
| Truy vấn SQL chỉ đọc thật | NOT_RUN — cần xác thực và reload trước |
| Số request tới DB trong task | 0 |
| Schema/data/migration/DB gốc | Không thực hiện thao tác |

Snapshot trước SHA256 `6409f5d2e31c8af98000cc03c135481fb92b63145488472b2316d1e64d3b850f`; sau `c7fcf77795264691cccf0c84190c1281f4ed632e9bee6f8ed44180249aa8f231`. Snapshot là cấu hình project không chứa credential. Không lưu credential hoặc OAuth URL/callback/token.

Tham chiếu đã đọc: [Supabase MCP scope/read-only](https://supabase.com/docs/guides/ai-tools/mcp#configuration-options), [OpenAI Docs: cấu hình MCP](https://developers.openai.com/codex/mcp). `read_only=true` là hạn chế thực thi phía server theo tài liệu Supabase; task chưa có kết quả SQL để xác nhận kết nối DB thật.

## Bước tiếp theo

Kiểm kết nối theo yêu cầu đã hoàn tất sau khi người dùng khởi động lại Codex. Không cần thêm truy vấn để chứng minh lại cùng kết quả. MCP giữ cấu hình staging/chỉ đọc, hai profile gốc disabled trong project. Việc triển khai phân quyền, backend, migration, cập nhật main/DB hoặc Vercel vẫn theo quyền và full gate riêng; kết quả kết nối không thay cho các gate đó. Không gửi mật khẩu, OTP, callback hoặc token qua chat.

Task này không đổi yêu cầu full gate, coverage, DB gốc, Vercel hoặc quyền phát hành của [kế hoạch release](permission-release-2026-10-22.md).

## Review

Hai reviewer độc lập `/root/mcp_staging_scope_review` và `/root/mcp_staging_evidence_review` đều **APPROVE** checkpoint cấu hình/bằng chứng/bàn giao/chỉ mục, không có finding chặn. Candidate tài liệu trước khi thêm metadata review: SHA256 `8950e024a3f6ef5cd46378fb5900483db9d74e23bbdff01edb3c23b4ec70a83f`. Verdict và giới hạn tại `review-checkpoint.json` trong evidence.

Phản hồi người dùng: “Tôi sẽ xác thực rồi báo lại” (request `call_7d7e778dc1764588b90cb277ec0e9d10`, item0). Đây là dự định xác thực, chưa phải bằng chứng đã xác thực; giữ kết nối DB ở trạng thái chưa kiểm.


## Lịch sử: bàn giao trang xác thực trước khi người dùng Authorize

Theo yêu cầu tiếp theo của người dùng, đã mở IAB tab2 tới trang Authorize Codex, tài khoản Supabase đã đăng nhập sẵn. Flow CLI chỉ yêu cầu `database:read,projects:read`; ảnh hiển thị Database, Projects READ. Agent chưa bấm Authorize, chưa có truy vấn DB. Receipt `browser-auth-checkpoint.json`, ảnh `oauth-readonly-consent.png` và hai verdict APPROVE tại `browser-auth-reviews.json` trong evidence xác nhận checkpoint mở trang/chờ người dùng, không xác nhận OAuth hoặc DB đã thành công.

Tại checkpoint trước consent, CLI `--no-browser` chờ callback URL trên stdin ẩn (session99013). Checkpoint đó yêu cầu xử lý callback bằng công cụ trong máy và không yêu cầu người dùng gửi callback/code/token vào chat. Hiện callback đã được trao đổi thành công, CLI đã thoát và tab callback đã đóng; không tiếp tục dùng session99013.


## Lịch sử: checkpoint sau Authorize, trước khi khởi động lại — 22/10/2026

OAuth exchange PASS. CLI đọc cấu hình mới thấy global `supabase.enabled=true`; tác nhân thay đổi chưa xác định. Đã thêm project override `[mcp_servers.supabase] enabled=false`, không sửa global. Cả hai profile gốc đều disabled trong project. Config hiện tại SHA256 `0afb3ee78fa7f75786bb2d7345d51a2ef64afe26c7a0be032c8a1e726156a8a9`.

Kết nối MCP mới được buộc URL staging/chỉ đọc bằng cấu hình tiến trình, xác minh `config/read` và gọi `mcpServerStatus/list` đúng một server: OAuth `oAuth`, năm tool `execute_sql`, `list_extensions`, `list_migrations`, `list_tables`, `search_docs`, không có `apply_migration`. Đây là **MCP discovery PASS**, không phải bằng chứng SQL/database hay kiểm phân quyền PASS.

Ba probe helper cục bộ được giữ nguyên: hai lượt dừng tại initialize vì cách tạo config override tạm sai; sau sửa, tiền kiểm cấu hình/initialize/config-read PASS nhưng thread/resume bị RPC từ chối -32600. Không giữ thông điệp lỗi RPC nên chưa xác định chính xác lý do từ chối. Cả ba có **0 lệnh DB**. Sau đó phép discovery độc lập không resume chat đã PASS trong một kết nối mới. Không reset lịch sử hoặc coi helper lỗi là SQL lỗi. Chi tiết, hashes, giới hạn và bước tiếp theo tại `authenticated-checkpoint.json` cùng `staging-fresh-discovery01.json` trong evidence.

Tại checkpoint trước khởi động lại, catalog công cụ chat còn sáu tool cũ và chưa dùng để gọi DB; cần nạp lại MCP trước SELECT. Tổng truy vấn DB và DB gốc lúc đó là **0**; không DDL/DML/migration, CI, merge, Vercel hoặc đổi DB gốc. Tab callback đã đóng sau OAuth.


Nguồn chính xác của lượt discovery đã chạy được trích từ custom-tool-call gốc trong rollout cục bộ vào `discovery01-original-tool-input.js`, SHA256 `87b376f6b6c85643fa7001737ea9a31070507dc195bf55ad1e1f4c42acee1dbd`; provenance tại `discovery01-source-provenance.json`. Không dựng lại source hoặc chạy lại lượt discovery để bổ sung bằng chứng.

Phản hồi trước khởi động lại: người dùng trả lời “Tôi sẽ mở lại Codex rồi báo” cho request `call_33dbe7973ed54ea6aa6dd38ba89dd5aa`, item0. Tại thời điểm đó chưa xem là đã reload nên SELECT còn NOT_RUN. Sau đó người dùng đã báo khởi động lại và yêu cầu tiến hành kiểm tra như checkpoint cuối dưới đây.


Review checkpoint sau xác thực: `/root/mcp_staging_scope_review` và `/root/mcp_staging_evidence_review` đều **APPROVE** candidate trước metadata SHA256 `bddfb79127028e28bb15db3152a50f75ee07de478a7621f8b000f7ca2987e0e0`, không còn finding chặn. Verdict, findings đã đóng và giới hạn tại `authenticated-final-reviews.json`; chỉ duyệt OAuth/MCP discovery, không duyệt SQL/database PASS.


## Kết quả sau khi khởi động lại: SELECT thật PASS — 22/10/2026

Nguồn ủy quyền: người dùng báo “đã khỏi động lại, bạn tiến hành kiểm tra”. Catalog MCP của chính chat đã đổi thành đúng năm tool chỉ đọc/tài liệu, không có migration. Trước SQL, đọc TOML và `codex mcp list --json` xác nhận staging `ineckiashpwloncxnbqx`, `read_only=true`, OAuth hoạt động và hai profile DB gốc disabled. Config trước/sau SQL giữ nguyên SHA256 `0afb3ee78fa7f75786bb2d7345d51a2ef64afe26c7a0be032c8a1e726156a8a9`.

Đã gọi trực tiếp `mcp__supabase_pos_cafe__execute_sql` đúng **một lần**, không dùng helper app-server: 

```sql
select 1 as connection_ok, current_user as database_role,
       current_setting('transaction_read_only') as transaction_read_only;
```

Kết quả một hàng, đã kiểm giá trị thực: `connection_ok=1`, `database_role=supabase_read_only_user`, `transaction_read_only=on`. Thời gian gọi 1.579 ms (khoảng 1,6 giây). Đây là PASS kết nối và vai trò/transaction chỉ đọc cho SELECT đã chạy; không thử câu ghi để kiểm chặn ghi, không đọc bảng nghiệp vụ và không xác nhận test phân quyền/PIN/backend PASS.

Raw tool response, câu SQL, catalog, thời điểm và giá trị đã kiểm nằm tại `staging-readonly-sql01.json`; đối chiếu cấu hình sau SQL tại `sql01-post-config-check.json`. Từ đầu task: **1 lệnh SQL tới staging, 0 lệnh DB gốc, 0 DDL/DML/migration** theo bản ghi thao tác. Không có chứng cứ network capture và không suy diễn hoạt động nội bộ server từ số đếm tool. Không chạy thêm SQL, không đổi schema/data, CI, main hoặc Vercel.


Review cuối kết quả SELECT: `/root/mcp_staging_scope_review` và `/root/mcp_staging_evidence_review` đều **APPROVE**, không có finding chặn, candidate trước metadata SHA256 `01a7cf9b63b99ff2845a44fdf5d40be36e7249c6ebc908e5b73921e60667a21b`. Review chỉ đọc evidence/offline, không phát sinh truy vấn DB. Verdict và giới hạn tại `sql01-final-reviews.json`.
