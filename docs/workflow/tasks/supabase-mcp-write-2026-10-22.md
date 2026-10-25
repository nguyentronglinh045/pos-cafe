# Supabase MCP đọc/ghi — 22/10/2026

## Yêu cầu và quyết định

- Chủ dự án trong chat sau lần cài read-only: “tôi nghĩ bạn sẽ làm việc qua nó luôn. cần chế độ ghi nữa”. Đây là quyền chuyển MCP hiện có sang đọc/ghi và ưu tiên dùng kết nối đó cho công việc Supabase của dự án.
- Sau đó chủ dự án phản hồi: “Tôi đã hoàn tất đăng nhập”. Callback của lượt trước đã hết hạn; lệnh login mới đã tự nhận callback thành công, thoát 0 và báo `Successfully logged in` lúc khoảng 11:36 Asia/Bangkok. Không cần người dùng cấp thêm phạm vi ngoài yêu cầu đã có.
- Thay thế lựa chọn read-only tại [hồ sơ setup trước](supabase-mcp-setup-2026-10-22.md). Không tự mở tài khoản/dự án khác hoặc bật feature trả phí. Việc sửa dữ liệu/migration cụ thể vẫn theo task đang được giao và feature/release gates hiện hành.
- Phương án được chọn: giữ `supabase_pos_cafe`, project ref `kfqjdfwxhkdwihjobpny`, hai nhóm `database,docs`; bỏ tham số `read_only=true`, bổ sung `apply_migration` và `list_migrations` vào allowlist. Đây là quyền ghi database theo yêu cầu; Edge Functions/Storage/account/branching không được bật trong cấu hình này.
- Mức review: nhạy cảm vì mở quyền ghi; SEC kiểm scope/auth/quyền, EVC kiểm recipe/evidence/docs.
- Code checkout `D:/Workspace/pos-cafe`, nhánh `main`, HEAD `5156820f7d6679cd6f8051bdc38419737ffa0c7e`; docs checkout `D:/Workspace/pos-cafe-docs`, nhánh `docs`, HEAD `25a8508de7e9ac0a11eb840dcd7d8af3e309e51f`. Cả hai có nhiều thay đổi có sẵn, được giữ nguyên ngoài delta task này; không stage/commit/push.

## Phần thay đổi

- [`.codex/config.toml`](D:/Workspace/pos-cafe/.codex/config.toml): URL `https://mcp.supabase.com/mcp?project_ref=kfqjdfwxhkdwihjobpny&features=database,docs`; allowlist `execute_sql`, `apply_migration`, `list_tables`, `list_extensions`, `list_migrations`, `search_docs`.
- `default_tools_approval_mode = "prompt"`, timeout 30/120 giây, OAuth không PAT. Chính sách approval thực tế còn do client/phiên quyết định.
- Mục PAT kế thừa vẫn bị tắt chỉ trong project; mục `supabase` cũ vẫn tắt. User config, Playwright và Claude Code MCP không được thay.
- Thêm một đoạn preference trong [CLAUDE.md](D:/Workspace/pos-cafe-docs/CLAUDE.md:75): ưu tiên kết nối MCP này cho thao tác database hosted được giao, gồm đọc, SQL ghi và migrations. Không thay acceptance/release gates.
- Hồ sơ setup cũ được đánh dấu lịch sử, dẫn tới hồ sơ này; chỉ mục task trỏ tới trạng thái đọc/ghi hiện hành. Nội dung/evidence/review read-only cũ được giữ làm lịch sử, không tính là PASS cho candidate đọc/ghi.

## Kiểm chứng và giới hạn

Recipe mới: [`check.mjs`](D:/Workspace/pos-cafe/artifacts/supabase-mcp-write-20261022/check.mjs). Chạy tại `D:/Workspace/pos-cafe` bằng `node artifacts/supabase-mcp-write-20261022/check.mjs --no-write`; bỏ cờ chỉ khi muốn cập nhật evidence. Nếu Codex executable đổi đường dẫn, đặt `POS_CAFE_CODEX_EXE` tới bản đang dùng.

Recipe dùng CLI để resolve config trong/ngoài project và app-server JSON-RPC để xác thực/discovery. Với app-server standalone, truyền một map MCP đầy đủ qua override process từ cấu hình project đã resolve. Không đổi stored config, không tạo chat/model turn hoặc thực thi tool SQL/migration.

| Tiêu chí | Expected |
| --- | --- |
| Project và quyền | Đúng project ref, không có `read_only` trong URL, server bật, không yêu cầu bearer env |
| Allowlist | Đúng sáu công cụ nêu trên |
| Phạm vi project | Mục PAT cũ tắt trong project; server mới không tồn tại tại `D:/Workspace` |
| OAuth và kết nối thật | `authStatus: oAuth`, remote discovery trả đúng sáu công cụ, có `apply_migration` |
| Bảo toàn dữ liệu khi setup | Không gọi execute_sql/apply_migration, không tạo dữ liệu thử |

Lịch sử trước PASS: CLI resolve đúng config đọc/ghi nhưng `auth_status: not_logged_in` vì URL tài nguyên đổi. Discovery trước đăng nhập trả 0 công cụ và recipe thoát 1. Lượt login đầu sau đổi mode hết hạn chờ callback; lần kiểm khi tiếp tục cũng trả 0 công cụ. Các lần đó là FAIL lịch sử, không nhận là PASS. Đã chạy lại `codex mcp login supabase_pos_cafe`, nhận callback thành công và exit 0. Không đọc hoặc xuất credential store.

Kết quả hiện hành: `node artifacts/supabase-mcp-write-20261022/check.mjs` exit 0 lúc `2026-10-22T04:36:25.595Z` (11:36:25 Asia/Bangkok), Node `v24.16.0`, Codex `0.163.0-alpha.11`. Tất cả tiêu chí bảng trên PASS ở phạm vi cấu hình/discovery: OAuth hoạt động, đúng sáu công cụ, có `apply_migration` và `execute_sql`, cấu hình chỉ trong project; `databaseQueriesExecuted: 0`.

Chỉ kiểm việc cấu hình và công cụ ghi được server cung cấp; chưa thực thi write/migration để chứng minh quyền database thực tế hoặc ứng dụng đã chạy đúng. Không có thay đổi ứng dụng nên không chạy build/unit/UI/E2E. Kết nối đọc/ghi cũng không xác nhận database đã được nâng lên schema của candidate ứng dụng.

## Evidence và khôi phục

Thư mục [`artifacts/supabase-mcp-write-20261022`](D:/Workspace/pos-cafe/artifacts/supabase-mcp-write-20261022) giữ recipe, snapshot trước/sau, evidence và manifest candidate. Snapshot before giữ cả các file docs đã dirty để đối chiếu đúng delta; không coi thay đổi của task khác là phần cài MCP.

- Candidate cuối cho review: [`candidate.json`](D:/Workspace/pos-cafe/artifacts/supabase-mcp-write-20261022/candidate.json), nhãn `supabase-mcp-write-20261022-v1`. Có snapshot cấu hình, recipe/evidence và bốn file docs liên quan; hồ sơ live có thể bổ sung riêng metadata review sau heading cuối.
- Cấu hình SHA256 `6409f5d2e31c8af98000cc03c135481fb92b63145488472b2316d1e64d3b850f`.
- Recipe SHA256 `2e8677e259a1e014678286b925e27e89f0cc5590d8b54ede735d66b5f7754b62`.
- [`verification.json`](D:/Workspace/pos-cafe/artifacts/supabase-mcp-write-20261022/verification.json) SHA256 `1d3d8b02889cdaa50d9617dafe0fe281309728f3a03054131fc6103c4c9816eb`.
- User config SHA256 trước/sau giữ nguyên `a643b7b14760d8e49ee339696f6de54886bb6b7e226276ef6debb0e16b94e358`.

Khôi phục cấu hình read-only trước task bằng nội dung `config.before.toml.snapshot` sau khi kiểm live config không có thay đổi tiếp theo. OAuth dùng URL khác nên có thể cần đăng nhập lại khi đổi URL; không tự xóa/revoke credential hoặc quyền tổ chức khác. Recipe/evidence cũ chỉ còn giá trị lịch sử sau khi đổi mode.

Không tải/cài gói, SDK, runtime hay môi trường nặng; ước tính tăng dưới 1 MB cho cấu hình/credential/evidence nhỏ. Trước ghi đã đo C còn 181,36 GiB, D còn 91,90 GiB. Đây là ngân sách vận hành, không phải quota OS. Giữ evidence gọn để review/tái hiện, không có installer/cache/runtime mới hết nhu cầu cần dọn.

Chat hiện tại chưa có các tool Supabase trong tool inventory. Sau khi nạp lại kết nối ở chat mới/restart, dùng MCP trực tiếp cho task được giao. Phần setup dùng app-server để kết nối đúng MCP đó, không giả việc có tool trực tiếp trong chat này.

Nguồn đã đọc ngày 22/10/2026: [Supabase MCP](https://supabase.com/docs/guides/ai-tools/mcp) mô tả chế độ read-only tùy chọn, tool database và project scope; [OpenAI Docs MCP](https://learn.chatgpt.com/docs/extend/mcp?surface=cli) mô tả config project và OAuth. Hướng dẫn preference được ghi theo yêu cầu trực tiếp của chủ dự án, không phải do suy diễn từ tài liệu.

Walkthrough: thay đổi chức năng nằm ở URL và allowlist trong config; đoạn CLAUDE.md giữ preference cho phiên sau. Owner đã yêu cầu quyền ghi, chưa xác nhận đã đọc file hoặc nghiệm thu tác vụ database cụ thể.

## Review độc lập — metadata

OAuth/discovery đã PASS và candidate `supabase-mcp-write-20261022-v1` đã được chốt. SEC và EVC đều APPROVE candidate cuối; setup đọc/ghi đã qua review gate trong phạm vi cấu hình và công cụ được endpoint cung cấp. Các verdict sơ bộ dưới đây là lịch sử trước khi callback OAuth mới thành công.

- SEC sơ bộ: BLOCKED cho toàn setup do còn OAuth/discovery/manifest; chưa thấy finding chặn về scope hoặc secret. Gợi ý không chặn sửa CLAUDE.md thành “configured for database reads and writes” đã được áp dụng.
- EVC kiểm tĩnh: chưa thấy finding chặn config/recipe/docs; tự đối chiếu CLI trong/ngoài project và user config hash, delta docs đúng một đoạn preference + một notice + một dòng index. Chưa chạy recipe mới theo yêu cầu chờ OAuth; chưa APPROVE setup.
- Checklist tiếp tục trước đó: callback/login, recipe mới, cập nhật docs/index, manifest + snapshots đã hoàn tất; đã yêu cầu SEC/EVC kiểm lại candidate cuối. Không tái dùng PASS read-only cũ cho kết nối đọc/ghi.

### SEC cuối

**SEC — APPROVE** cho **`supabase-mcp-write-20261022-v1`**, [manifest](D:/Workspace/pos-cafe/artifacts/supabase-mcp-write-20261022/candidate.json) SHA256 `2fe6f11933bc596b643fd10016c0037fe7f93ede1ef1e350e85346c93b810830`.

Đã kiểm độc lập:

- Bảy snapshot và bốn snapshot before khớp manifest. Sáu target khớp hash; hồ sơ write live chỉ khác snapshot tại metadata review, phần nội dung trước heading này giống nguyên vẹn.
- Cấu hình mở ghi đúng yêu cầu user: bỏ `read_only`, thêm `apply_migration` và `list_migrations`; giữ đúng project, nhóm `database,docs`, prompt, timeout và override tắt PAT cũ.
- User config vẫn có hash `a643b7…e358`. Delta docs chỉ gồm preference, notice lịch sử, dòng chỉ mục và hồ sơ mới; không nhận evidence read-only cũ thành PASS cho write.
- Tự chạy recipe `--no-write`: **exit 0**, `2026-10-22T04:38:04.017Z`, OAuth hoạt động và discovery đúng sáu công cụ, gồm `execute_sql`/`apply_migration`. Evidence đã chốt giữ nguyên hash sau kiểm.
- Gợi ý về [CLAUDE.md:75](D:/Workspace/pos-cafe-docs/CLAUDE.md:75) đã được giải quyết bằng “configured for database reads and writes”. Preference giới hạn trong task được giao và giữ nguyên acceptance/release gates.

**Finding chặn: không có. Đề xuất không chặn còn mở: không có.** Blocker OAuth/discovery trước đó đã được giải quyết.

Giới hạn: chỉ xác minh cấu hình và authenticated tool discovery; không thực thi SQL/migration để chứng minh quyền ghi database thực tế, không đọc credential store, chưa kiểm tool inventory trong chat mới. APPROVE này xác nhận setup trong phạm vi trên; tác vụ dữ liệu/schema cụ thể vẫn theo quyền và gates của task tương ứng.

### EVC cuối

EVC — **APPROVE** candidate `supabase-mcp-write-20261022-v1` trong phạm vi cấu hình, recipe và bằng chứng setup.

Candidate: [candidate.json](D:/Workspace/pos-cafe/artifacts/supabase-mcp-write-20261022/candidate.json), SHA256 `2fe6f11933bc596b643fd10016c0037fe7f93ede1ef1e350e85346c93b810830`.

Đã kiểm độc lập:

- Chạy `node artifacts/supabase-mcp-write-20261022/check.mjs --no-write`: **exit 0**, lúc `2026-10-22T04:38:01.389Z`, Node `v24.16.0`, Codex `0.163.0-alpha.11`.
- OAuth/discovery trả đúng sáu công cụ, gồm `execute_sql`, `apply_migration`; đúng project ref và URL không có `read_only`. Server mới chỉ cấu hình trong project, mục PAT kế thừa vẫn tắt trong project.
- Cả bảy snapshot và bốn snapshot trước thay đổi khớp manifest. Sáu target khớp toàn bộ; hồ sơ mới khớp nguyên phần nội dung trước heading metadata review. Delta còn lại chỉ thuộc metadata được cho phép.
- Delta tài liệu giữ nguyên nội dung dirty cũ: một đoạn preference trong [CLAUDE.md](D:/Workspace/pos-cafe-docs/CLAUDE.md:75), một notice lịch sử và một dòng chỉ mục. Hash user config vẫn `a643b7…e358`.
- [Recipe](D:/Workspace/pos-cafe/artifacts/supabase-mcp-write-20261022/check.mjs:64) chỉ initialize/discovery; evidence không bị ghi lại. [Hồ sơ](D:/Workspace/pos-cafe-docs/docs/workflow/tasks/supabase-mcp-write-2026-10-22.md:34) giữ các lần FAIL trước OAuth và tách rõ PASS hiện hành.

Không có finding chặn hoặc đề xuất không chặn.

Giới hạn: APPROVE xác nhận cấu hình và việc endpoint đã xác thực cung cấp công cụ ghi. **Chưa chứng minh thực thi ghi database/migration thành công**, chưa kiểm schema, ứng dụng hoặc công cụ trực tiếp trong chat Desktop mới. Tôi không gọi SQL, đọc credential stores, sửa file, commit hoặc deploy.
