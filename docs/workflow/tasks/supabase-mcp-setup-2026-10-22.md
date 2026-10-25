# Supabase MCP cho pos-cafe — 22/10/2026

> Hồ sơ lịch sử của lần setup chỉ đọc. Sau đó trong cùng ngày, chủ dự án yêu cầu dùng MCP cho công việc Supabase và bật quyền ghi; xem [quyết định và trạng thái hiện hành](supabase-mcp-write-2026-10-22.md). Recipe/evidence bên dưới chỉ xác nhận candidate read-only lúc đó, không dùng để kiểm cấu hình đọc/ghi mới.

## Đề bài, quyền và hiện trạng

- Yêu cầu trong chat: “tôi nghĩ ta cần cài đặt mcp supabase vào dự án này, bạn kiểm tra và cài đặt”. Phạm vi là khảo sát, cấu hình và kiểm tra MCP cho Codex trong `D:/Workspace/pos-cafe`.
- Chủ dự án xác nhận trong cùng chat: “Tôi đã đăng nhập và cấp quyền”, sau khi được thông báo Supabase OAuth yêu cầu cả quyền ghi ở cấp tài khoản nhưng endpoint MCP vẫn chỉ đọc.
- Bảo trì cấu hình MCP đã tồn tại, giữ giới hạn chỉ đọc được chọn ngày 15/10; không tạo change OpenSpec hoặc yêu cầu sản phẩm mới. [Handoff trước](permission-progress-audit-2026-10-15.md) ghi nhận kết nối PAT tạm thời.
- Mức review: nhạy cảm do xác thực/quyền truy cập; cần hai reviewer độc lập, không sửa candidate.
- Code checkout: nhánh `main`, HEAD `5156820f7d6679cd6f8051bdc38419737ffa0c7e`, có nhiều thay đổi sẵn của các task khác. Docs checkout: nhánh `docs`, HEAD `25a8508de7e9ac0a11eb840dcd7d8af3e309e51f`, có 376 file thay đổi trước hồ sơ này. Thêm hồ sơ mới độc lập này và đúng một dòng pointer vào chỉ mục task theo workflow, giữ nguyên toàn bộ nội dung dirty trước đó bằng kiểm tra before/after; không checkout nhánh, stage, commit hoặc push.
- User config trước cài có `supabase` tắt và `pos_cafe_supabase_ro` bật. Mục sau yêu cầu `POS_CAFE_SUPABASE_PAT_EPHEMERAL`; biến không tồn tại ở Process/User/Machine, nên không có token để sử dụng trong phiên mới. `.env.local` xác nhận project ref `kfqjdfwxhkdwihjobpny`.

## Quyết định và kết quả cấu hình

- AI chọn cấu hình riêng dự án + OAuth trong phạm vi yêu cầu cài đặt. Giữ chế độ chỉ đọc và bốn công cụ của cấu hình cũ. Phương án nhập lại PAT tạm cần cung cấp token mỗi phiên; cài server qua npm không cần thiết vì hosted MCP hỗ trợ HTTP/OAuth.
- File mới trên code checkout: [`.codex/config.toml`](D:/Workspace/pos-cafe/.codex/config.toml), server `supabase_pos_cafe`.
- Endpoint: `https://mcp.supabase.com/mcp?project_ref=kfqjdfwxhkdwihjobpny&read_only=true&features=database,docs`.
- Cho phép `execute_sql`, `list_tables`, `list_extensions`, `search_docs`; cấu hình `default_tools_approval_mode = "prompt"`, timeout khởi động 30 giây, timeout công cụ 120 giây. Cơ chế approval thực tế vẫn phụ thuộc chính sách của client/phiên.
- Mục `pos_cafe_supabase_ro` kế thừa bị tắt bằng override chỉ trong dự án để tránh kết nối trùng. User config `C:/Users/nguye/.codex/config.toml`, mục `supabase` đang tắt, Playwright và cấu hình Claude Code không được sửa.
- `codex mcp login supabase_pos_cafe` thoát 0, báo `Successfully logged in`. Credential do Codex quản lý; không đọc/xuất token vào chat, file cấu hình, hồ sơ hoặc artifact.
- OAuth được nhà cung cấp yêu cầu rộng hơn endpoint MCP: không suy rằng OAuth credential chỉ có quyền đọc. Phạm vi MCP sử dụng là project-scoped/read-only và tool allowlist nói trên. Không có ủy quyền sửa dữ liệu, migration hoặc deploy từ task cài đặt.

## Bằng chứng và cách kiểm lại

Môi trường: Windows, Node `v24.16.0`, `codex-cli 0.163.0-alpha.11`. Hosted MCP qua HTTPS; không npm install, không cài SDK/browser/runtime, không WSL/Docker.

| Tiêu chí | Phép kiểm và kết quả |
| --- | --- |
| Đúng project, giới hạn chỉ đọc, không phụ thuộc PAT | `codex mcp get supabase_pos_cafe --json`: bật, đúng URL/query, `bearer_token_env_var: null`, đúng allowlist |
| Không trùng mục PAT trong project | `codex mcp get pos_cafe_supabase_ro --json`: `enabled: false` |
| Chỉ có cấu hình mới trong project | Chạy `codex mcp list --json` tại `D:/Workspace`: không có `supabase_pos_cafe` |
| OAuth được lưu và server trả công cụ | App-server JSON-RPC `initialize` → `mcpServerStatus/list`, chỉ khởi tạo endpoint cần kiểm: `authStatus: oAuth`, nhận đúng cả bốn công cụ |
| Bảo vệ dữ liệu khi smoke setup | Không tạo Codex chat/turn để chạy model, không gọi tool SQL hoặc truy vấn dữ liệu cửa hàng; `databaseQueriesExecuted: 0` |

Artifact gọn tại [thư mục evidence](D:/Workspace/pos-cafe/artifacts/supabase-mcp-20261022):

- [`check.mjs`](D:/Workspace/pos-cafe/artifacts/supabase-mcp-20261022/check.mjs) là recipe kiểm trực tiếp bằng CLI/app-server hiện có. App-server standalone không tự nạp layer project cho phép kiểm này, nên script chuyển cấu hình project đã resolve sang override **chỉ cho process kiểm**, thay toàn bộ map MCP bằng đúng một server. Không ghi user config, không khởi động Playwright, không dùng model.
- [`verification.json`](D:/Workspace/pos-cafe/artifacts/supabase-mcp-20261022/verification.json): lần kiểm cuối `2026-10-22T04:06:09.183Z` (11:06:09 Asia/Bangkok), exit 0; cấu hình, auth và remote tool discovery PASS. Đây là bằng chứng setup, không phải bằng chứng ứng dụng/DB đã qua acceptance.
- [`config.toml.snapshot`](D:/Workspace/pos-cafe/artifacts/supabase-mcp-20261022/config.toml.snapshot) giữ nguyên nội dung cấu hình để phục hồi candidate.
- SHA256 cấu hình/snapshot: `c6699ac3b90c86b0d152ef65e5dba50a027e6031767a8eb35b665d653c96c2cf`.
- SHA256 script: `64033d160f07b9c19db4520202c967114cd704efeae80b85bf4234c85038dc55`.
- SHA256 evidence: `ef4e243e603474527593c84f472fbf71e8bb165d551759447d9bfbaa1f2fae84`.
- User config hash đo sau setup: `a643b7b14760d8e49ee339696f6de54886bb6b7e226276ef6debb0e16b94e358`.
- Candidate review cuối và các snapshot có thể phục hồi được chỉ định trong [`candidate-v2.json`](D:/Workspace/pos-cafe/artifacts/supabase-mcp-20261022/candidate-v2.json). Snapshot `task-index.before.md.snapshot` giữ chỉ mục đang dirty trước task; delta cuối chỉ bổ sung đúng một dòng pointer, không nhận các thay đổi cũ thành công việc của task này. Manifest/snapshot v1 vẫn giữ làm lịch sử.

Kiểm lại tại `D:/Workspace/pos-cafe`: `node artifacts/supabase-mcp-20261022/check.mjs --no-write`. Nếu executable Codex đổi đường dẫn sau update, đặt `POS_CAFE_CODEX_EXE` đến executable đang dùng trước khi chạy. `--no-write` không thay evidence đã chốt. Bỏ cờ này sẽ cập nhật timestamp/evidence và cần chốt hash mới nếu dùng làm candidate mới.

Các lần thử chẩn đoán trước recipe cuối không phải PASS: app-server không có project override trả danh sách rỗng; override riêng `enabled=false` cho mục kế thừa gây `invalid transport` và thoát 1. Recipe cuối dùng một map MCP đầy đủ trong process kiểm, đã được chạy lại thành công. Không dùng các lần lỗi làm bằng chứng kết nối.

## Dung lượng, giới hạn và bàn giao

- Trước ghi, đã đo ổ C còn khoảng 181,6 GiB, D còn 91,9 GiB; dự kiến tăng dưới 1 MB gồm cấu hình/auth. Không có gói tải về hay runtime nặng. Ba artifact evidence có tổng 5.833 byte logic, chưa tính file cấu hình và hồ sơ; không coi đây là số block NTFS thực chiếm ổ hoặc toàn bộ kích thước credential store của Codex.
- Không có tiến trình node/cmd mang `@playwright/mcp` tại checkpoint sau kiểm; không dùng trình duyệt Playwright trong task.
- Giữ evidence/recipe nhỏ để tái kiểm; không có nhóm cache/installer/runtime mới hết nhu cầu cần xin dọn. Không xóa dữ liệu có sẵn.
- Chưa chạy app build/unit/UI/E2E vì không thay ứng dụng. Chưa thực thi SQL để kiểm actor/transaction read-only; read-only là cấu hình endpoint đã xác nhận và hành vi được tài liệu Supabase mô tả. Chưa xác minh schema, dữ liệu hay trạng thái migration của database.
- Chat hiện tại chưa có bộ công cụ mới trong danh sách tools. Mở chat mới trong dự án hoặc khởi động lại Codex để nạp kết nối mới; nếu sau đó vẫn chưa thấy, kiểm MCP settings và xác thực lại bằng lệnh login trên.
- Hoàn tác cấu hình: bỏ hai stanza mới trong `.codex/config.toml` sau khi kiểm file còn chỉ chứa nội dung task này; khi đó override tắt PAT biến mất và cấu hình user cũ lại có hiệu lực. Đăng xuất riêng kết nối mới bằng `codex mcp logout supabase_pos_cafe` nếu muốn; không tự xóa/revoke quyền tổ chức hoặc credential khác.
- Walkthrough: file cấu hình có endpoint/allowlist, override mục cũ và lệnh login ở dòng đầu; hồ sơ này giải thích các lựa chọn. Chủ dự án chưa xác nhận đã đọc hoặc nghiệm thu ngoài thao tác OAuth.

Nguồn chính thức đã đối chiếu ngày 22/10/2026: [OpenAI MCP configuration/OAuth](https://learn.chatgpt.com/docs/extend/mcp?surface=cli), [OpenAI app-server](https://learn.chatgpt.com/docs/app-server), [Supabase MCP](https://supabase.com/docs/guides/ai-tools/mcp). Hai nguồn đầu hỗ trợ cấu hình project và tool discovery; Supabase mô tả project scope, read-only, feature groups và OAuth không cần PAT.

## Review độc lập — metadata

Candidate cuối: `supabase-mcp-20261022-v2`, [manifest](D:/Workspace/pos-cafe/artifacts/supabase-mcp-20261022/candidate-v2.json) SHA256 `982ff42e7ef7ec58bc7ecc0120f031fc6385549ede42ec50e4fa54bc338cdc58`. SEC phụ trách scope/auth/bảo vệ dữ liệu; EVC phụ trách recipe/evidence/phạm vi kết luận. Cả hai APPROVE v2; task cài đặt đã qua gate review. Phần này chỉ bổ sung metadata báo cáo review, không đổi nội dung candidate trước heading này hoặc nhận DB/application acceptance.

### Lịch sử vòng 1

- SEC APPROVE v1. Tự kiểm hash và cấu hình trong/ngoài project; chạy recipe `--no-write` exit 0 lúc `2026-10-22T04:08:45.333Z`, OAuth và bốn công cụ đúng, evidence không đổi. User config có mtime `2026-10-22T00:47:47.3474742Z`; không có pre-setup hash để chứng minh bằng so sánh before/after. Không có finding chặn hoặc đề xuất không chặn.
- EVC CHANGES_REQUESTED v1 chỉ do EVC-01: thiếu pointer trong chỉ mục task, trái workflow dòng 132; hồ sơ dòng 9 còn ghi không sửa index. Không có finding chặn khác về recipe/config/evidence.
- Xử lý EVC-01: bổ sung đúng một bullet + dòng trắng vào chỉ mục, sửa mô tả hồ sơ, lưu snapshot before/after và manifest v2. EVC kiểm delta và đóng finding; SEC kiểm lại delta. Cấu hình/script/evidence kết nối bất biến, nên hai reviewer tái dùng phép kiểm runtime độc lập đã chạy thay vì thực hiện lại phần không bị ảnh hưởng.

### Báo cáo SEC cuối — nguyên kết quả

**SEC — APPROVE** cho candidate **`supabase-mcp-20261022-v2`** trong [candidate-v2.json](D:/Workspace/pos-cafe/artifacts/supabase-mcp-20261022/candidate-v2.json), SHA256 `982ff42e7ef7ec58bc7ecc0120f031fc6385549ede42ec50e4fa54bc338cdc58`.

Đã kiểm độc lập delta:

- Cấu hình MCP, script và evidence giữ nguyên hash của v1; tái sử dụng kết quả kiểm SEC trước vì không thay đổi auth, quyền, endpoint hoặc thao tác runtime.
- Hồ sơ/snapshot v2 khớp hash `7f305338…`; delta chỉ cập nhật mô tả thêm chỉ mục và liên kết manifest.
- Chỉ mục/snapshot v2 khớp hash `910cee45…`; đối chiếu snapshot before cho thấy chỉ thêm một bullet và dòng trắng. Pointer mô tả đúng setup/discovery, chỉ đọc, không SQL/migration/deploy; không mở rộng quyền hay nhận application acceptance.

**Finding chặn: không có. Đề xuất không chặn: không có.** Giữ nguyên các giới hạn kiểm chứng SEC đã ghi ở v1. Không chạy lại SQL/discovery, không sửa candidate hoặc credential.

Giới hạn SEC v1 được giữ: không đọc credential store; không kiểm toàn bộ scope thực tế của OAuth credential; không chạy SQL để chứng minh actor/transaction read-only; chưa kiểm tool availability trong chat mới. Không có pre-setup hash user config, nên mtime và trạng thái hiện tại chỉ là bằng chứng bổ sung về việc giữ cấu hình cũ. Không biến setup PASS thành DB/application acceptance.

### Báo cáo EVC cuối — nguyên kết quả

EVC — **APPROVE** candidate `supabase-mcp-20261022-v2` trong phạm vi cấu hình, recipe và tính xác thực bằng chứng.

Candidate: [candidate-v2.json](D:/Workspace/pos-cafe/artifacts/supabase-mcp-20261022/candidate-v2.json), SHA256 `982ff42e7ef7ec58bc7ecc0120f031fc6385549ede42ec50e4fa54bc338cdc58`. Tôi không tham gia tạo hoặc sửa candidate.

Đã tự kiểm:

- Cả 5 target và snapshot khớp hash manifest; baseline code/docs khớp hồ sơ. User config vẫn có hash `a643b7…e358`.
- CLI trong project resolve đúng endpoint, project ref, `read_only=true`, allowlist bốn công cụ; hai mục Supabase cũ đều tắt. Ngoài project tại `D:/Workspace`, server mới không tồn tại và mục PAT cũ vẫn bật.
- Chạy `node artifacts/supabase-mcp-20261022/check.mjs --no-write` tại project: **exit 0**, `2026-10-22T04:09:07.203Z`, Node `v24.16.0`, Codex `0.163.0-alpha.11`. App-server mới nhận đúng bốn công cụ và `authStatus: oAuth`; evidence đã chốt không bị ghi lại.
- [Recipe](D:/Workspace/pos-cafe/artifacts/supabase-mcp-20261022/check.mjs:64) chỉ initialize và discovery, không tạo model turn hoặc gọi SQL. Cách discovery phù hợp [OpenAI Docs app-server](https://learn.chatgpt.com/docs/app-server); cấu hình project phù hợp [OpenAI Docs MCP](https://learn.chatgpt.com/docs/extend/mcp).

| Finding | Phân loại và kết quả |
| --- | --- |
| EVC-01: v1 thiếu dòng chỉ mục task, trái workflow dòng 132; hồ sơ dòng 9 còn ghi không sửa index | **Chặn trên v1 — đã đóng trên v2.** [Chỉ mục dòng 3](D:/Workspace/pos-cafe-docs/docs/workflow/tasks/README.md:3) có liên kết đúng. So sánh before/after xác nhận chỉ thêm một bullet và dòng trống, giữ nguyên nội dung dirty cũ. [Hồ sơ dòng 9](D:/Workspace/pos-cafe-docs/docs/workflow/tasks/supabase-mcp-setup-2026-10-22.md:9) đã sửa tương ứng. |

Verdict lịch sử v1: **CHANGES_REQUESTED** do EVC-01. V2 không còn finding chặn hoặc đề xuất không chặn. Không chạy lại discovery sau delta tài liệu vì hash cấu hình, recipe và evidence đều bất biến, đã đối chiếu lại.

Giới hạn: không kiểm SQL, hiệu lực transaction read-only, schema/migration, ứng dụng hoặc khả năng dùng công cụ trong chat Desktop mới. Không đọc/xuất credential stores, không sửa file, commit hay deploy. APPROVE này không xác nhận OAuth credential chỉ có quyền đọc và không cấp quyền thay đổi database.
