# Cài skill chính thức Supabase — 22/10/2026

## Đề bài và lựa chọn

- User: “hình như có mấy skill cho phần này, bạn tìm và cài vô luôn nhé (skill của supabase á)”. Quyền thực hiện: tìm và cài skill Supabase phù hợp cho dự án; không giao sửa ứng dụng hoặc database.
- Nguồn chính thức: [Supabase Agent Skills docs](https://supabase.com/docs/guides/ai-tools/ai-skills), [supabase/agent-skills](https://github.com/supabase/agent-skills). Đã đối chiếu bản phát hành ổn định mới nhất tại thời điểm khảo sát: [`v0.1.9`](https://github.com/supabase/agent-skills/releases/tag/v0.1.9), phát hành 28/09/2026, commit `544bfc56c89afe2b87b20017a59b2c6e9502a1fb`.
- Repo có đúng hai skill công khai phù hợp. Đã kiểm tra thư mục skill user và project trước cài, chưa có tên trùng. Chọn cài cả hai, giữ nguyên nội dung upstream, ghim commit để tái hiện.
- Phạm vi project tại `D:/Workspace/pos-cafe/.agents/skills`, theo lựa chọn cài cho dự án hiện tại; không cài global/không tạo bản trùng cho từng client. Codex hỗ trợ scope này theo [OpenAI Docs](https://learn.chatgpt.com/docs/build-skills).
- Maintenance/tooling, không tạo requirement sản phẩm hoặc change OpenSpec mới. Không thay cơ chế quyền/gate của dự án. Một reviewer độc lập kiểm source/integrity/discovery và hồ sơ.
- Code `main` HEAD `5156820f7d6679cd6f8051bdc38419737ffa0c7e`; docs HEAD `25a8508de7e9ac0a11eb840dcd7d8af3e309e51f`. Cả hai có dirty state từ trước, giữ nguyên ngoài các file skill mới, hồ sơ này và một dòng thêm vào chỉ mục. Không stage/commit/push.

| Skill | Version trong SKILL.md | Nội dung | File / byte upstream |
| --- | --- | --- | --- |
| `supabase` | `0.1.2` | Quy trình Supabase Database/Auth/Realtime/Storage/Edge Functions, tài liệu hiện hành, MCP/CLI, bảo mật và debugging | 4 / 23.772 |
| `supabase-postgres-best-practices` | `1.1.1` | Schema, SQL, RLS, indexes, connections, locking và Postgres performance | 36 / 62.007 |

Version bundle `v0.1.9` khác version riêng từng skill. Hai skill có tổng 40 file, 85.779 byte logic, đều là Markdown/asset văn bản; không script executable hoặc dependency cần cài.

## Cài đặt và provenance

- Đã dùng skill-installer có sẵn. Python `3.14.6` đã cài trên máy; không tải Python/npm/tool/runtime mới.
- Recipe [`install.py`](D:/Workspace/pos-cafe/artifacts/supabase-skills-20261022/install.py) gọi `main()` của helper chính thức `C:/Users/nguye/.codex/skills/.system/skill-installer/scripts/install-skill-from-github.py`, truyền repo, ref commit, hai path và `--dest D:/Workspace/pos-cafe/.agents/skills --method download`.
- Wrapper chỉ đổi `_tmp_root` sang artifact trên D và giữ cleanup target thay vì xóa, để tuân thủ quy tắc xin phép dọn temp. Không sửa helper hoặc global `shutil`; copy logic và download/validation của helper được dùng nguyên.
- Archive toàn repo thực tải 141.877 byte; tổng nội dung repo giải nén 227.598 byte. Chỉ copy hai thư mục skill vào destination. Helper thoát 0 và báo cài cả hai thành công.
- Giữ MIT license gốc tại [supabase-agent-skills.LICENSE](D:/Workspace/pos-cafe/.agents/skills/supabase-agent-skills.LICENSE) và nguồn/file fingerprints tại [supabase-agent-skills.source.json](D:/Workspace/pos-cafe/.agents/skills/supabase-agent-skills.source.json). Không thêm/sửa nội dung bên trong hai skill.
- API Git tree không truncated; đối chiếu từng file cài bằng kích thước, Git blob SHA1 và SHA256. Cả 40 file khớp đúng commit upstream.

## Kiểm chứng

Recipe: [`verify.mjs`](D:/Workspace/pos-cafe/artifacts/supabase-skills-20261022/verify.mjs), lệnh tại `D:/Workspace/pos-cafe`: `node artifacts/supabase-skills-20261022/verify.mjs --no-write`. Nếu Codex executable chuyển đường dẫn sau update, đặt `POS_CAFE_CODEX_EXE` tới bản hiện tại. Bỏ cờ sẽ cập nhật evidence, không dùng khi review candidate đã chốt.

| Phép kiểm | Kết quả |
| --- | --- |
| 40 file, byte count, SHA256 và Git blob SHA1 | PASS |
| MIT license giữ đúng fingerprint | PASS |
| SKILL.md có frontmatter/name/description và các Markdown link nội bộ | PASS, 2 relative-link checks |
| Codex app-server `skills/list`, `forceReload: true`, cwd project | PASS: đúng hai skill, `scope: repo`, `enabled: true`, đúng đường dẫn, không có load error liên quan |
| Cwd ngoài project `D:/Workspace` | PASS: không thấy hai skill mới |
| MCP/database/model turn | Không gọi; app-server smoke đặt `mcp_servers={}` chỉ trong process để tránh khởi động MCP khác |

Lần kiểm tác giả: exit 0, `2026-10-22T06:58:41.310Z` (13:58:41 Asia/Bangkok), Node `v24.16.0`, Codex `0.163.0-alpha.11`. Evidence [`verification.json`](D:/Workspace/pos-cafe/artifacts/supabase-skills-20261022/verification.json). [`installation.json`](D:/Workspace/pos-cafe/artifacts/supabase-skills-20261022/installation.json) giữ provenance/helper hash/temp receipt. Snapshot/manifest candidate và archive cài đặt gọn ở cùng thư mục artifact.

Đây là kiểm cài đặt/discovery, không phải bằng chứng các hướng dẫn đã được áp dụng để sửa/kiểm chứng ứng dụng hoặc database. Không chạy build/unit/UI/E2E vì không thay các thành phần đó.

Skill là hướng dẫn upstream tổng quát; chỉ thị của chủ dự án và conventions/gates đã chấp nhận vẫn ưu tiên. Ví dụ skill nêu `.mcp.json` cho client khác; setup Codex dự án vẫn ở `.codex/config.toml`. Hướng dẫn thử schema trong database local không cho phép suy thành quyền thử trực tiếp trên database hosted. Không sửa MCP, OAuth hoặc migration từ task cài skill.

Hai skill sẽ sẵn sàng dùng từ lượt chat tiếp theo. Nếu client chưa cập nhật catalog thì restart Codex theo OpenAI Docs. Đã kiểm catalog bằng API thật, chưa kiểm implicit invocation bởi model trong một task nghiệp vụ mới.

## Dung lượng và temp

- Trước cài đã thông báo tên/mục đích/destination D, ước tính archive dưới 0,3 MB, cài skill khoảng 86 KB, đỉnh dưới 5 MB gồm extract/evidence. API tree toàn repo chỉ 227.598 byte; dùng Python có sẵn, không npm dependency/cache. C trước ghi khoảng 181,5 GiB, D khoảng 91,9 GiB; không tạo môi trường kiểm thử nặng.
- Cần giữ file skill, license, source metadata và evidence gọn. Không coi các đầu ra đó là temp.
- Installer temp riêng: `D:/Workspace/pos-cafe/artifacts/supabase-skills-20261022/installer-temp/skill-install-dc11vhi6`, 62 file, 369.475 byte logic (~361 KiB), gồm ZIP và source repo giải nén. Không phát hiện compressed/sparse/reparse file; kích thước logic không đồng nghĩa block NTFS thực chiếm ổ. Không còn cần cho hoạt động của skill sau cài; đã hỏi user có muốn xóa đúng nhóm này theo quy tắc dọn temp. Chưa có câu trả lời thì giữ nguyên; nếu xóa sẽ cần tải lại khi tái cài.
- Candidate lưu snapshot skill riêng để phục hồi mà không phụ thuộc installer temp. Không dọn ngoài nhóm được user cho phép, không prune toàn máy. Trạng thái cleanup cuối nếu có sẽ ghi ở metadata dưới đây, không đổi candidate skill đã review.

## Review độc lập — metadata

Reviewer `/root/review_supabase_skills` đã APPROVE candidate `supabase-skills-20261022-v1`; task cài đặt đã qua review gate. Manifest [`candidate.json`](D:/Workspace/pos-cafe/artifacts/supabase-skills-20261022/candidate.json) SHA256 `28b83270a93ad54622551da853f96cf292fbe23381f35bef5c397cc3c3decd39`. Phần này chỉ ghi metadata sau review; nội dung trước heading và các file candidate khác giữ nguyên.

### Báo cáo reviewer

**APPROVE** — reviewer `/root/review_supabase_skills`, phạm vi toàn gói cài đặt và hồ sơ.

Candidate: `candidate.json`, SHA256 `28b83270a93ad54622551da853f96cf292fbe23381f35bef5c397cc3c3decd39`.

Đã kiểm độc lập:

- Cả 48 target khớp manifest và snapshot; ZIP chứa đúng 42 entry. Chỉ mục docs thêm đúng một bullet.
- GitHub tree tại commit `544bfc56c89afe2b87b20017a59b2c6e9502a1fb` khớp **đúng tập 40 file, 85.779 byte**, Git blob SHA1, kích thước và mode `100644`; MIT LICENSE cũng khớp upstream.
- [Tài liệu Supabase](https://supabase.com/docs/guides/ai-tools/ai-skills) liệt kê đúng hai skill đã cài. GitHub API xác nhận bản ổn định mới nhất là `v0.1.9`, phát hành `2026-09-28T09:42:47Z`, trỏ đúng commit.
- Đọc wrapper và helper thật; helper hash khớp evidence. Wrapper chỉ điều chỉnh temp-root/giữ cleanup target, dùng nguyên `main()` và download/copy validation.
- Chạy `node artifacts/supabase-skills-20261022/verify.mjs --no-write`: **exit 0**, `2026-10-22T07:02:49.367Z`. Hai skill đúng đường dẫn, `scope: repo`, `enabled: true`; không hiện ngoài project, không load error liên quan.
- Nội dung handoff phù hợp kết quả; quy tắc discovery/restart khớp [OpenAI Docs](https://learn.chatgpt.com/docs/build-skills). Temp vẫn còn đúng 62 file/369.475 byte, chưa bị dọn.

**Finding chặn: không. Đề xuất không chặn: không.**

Giới hạn: không chạy lại installer, không kiểm chất lượng toàn bộ SQL examples hoặc implicit invocation trong task nghiệp vụ; không chứng minh ứng dụng/database PASS. Không sửa candidate, credential, config, DB; không gọi MCP Supabase hay dọn temp.

Cleanup receipt tại bàn giao cài đặt ban đầu: đã hỏi đúng nhóm installer temp, khi đó chưa nhận trả lời và giữ nguyên 62 file/369.475 byte logic. Quyết định dọn sau đó không ảnh hưởng skill, license, source metadata và snapshot candidate đã giữ riêng.

### Cleanup tiếp nối — user đã cho phép

- User trả lời đúng câu hỏi nhóm temp: “Xóa nhóm temp này”. Đã xác minh đường dẫn tuyệt đối theo `installation.json`, parent trong workspace, không reparse point, đủ 62 file/369.475 byte, nội dung giải nén khớp byte với ZIP và không có file lạ. Snapshot skill riêng vẫn khớp manifest.
- Lệnh PowerShell xóa đệ quy ban đầu bị công cụ chặn trước khi tạo process, chưa xóa gì. Đã chuyển sang recipe hẹp [`cleanup.py`](D:/Workspace/pos-cafe/artifacts/supabase-skills-20261022/cleanup.py): kiểm toàn bộ file trước, unlink từng file đã xác minh và chỉ rmdir thư mục rỗng. Không sửa helper hoặc xóa ngoài target được cho phép.
- Chạy inspect rồi `python -B artifacts/supabase-skills-20261022/cleanup.py --delete-authorized`, exit 0 lúc `2026-10-22T07:16:16.195404Z` (14:16:16 Asia/Bangkok). [`cleanup.json`](D:/Workspace/pos-cafe/artifacts/supabase-skills-20261022/cleanup.json) xác nhận target không còn, 62 file đã xóa; không dọn thư mục `installer-temp` cha hoặc evidence khác.
- Đo dung lượng Windows ngay trước/sau: D từ 98.671.497.216 lên 98.672.009.216 byte trống, tăng 512.000 byte (500 KiB); C giữ 194.821.914.624 byte trống. Đây là delta toàn volume có thể gồm hoạt động nền, không coi 369.475 byte logic là số block thực thu hồi.
- Kiểm lại `node artifacts/supabase-skills-20261022/verify.mjs --no-write`: exit 0 lúc `2026-10-22T07:16:16.964Z`, 40 file/85.779 byte khớp fingerprint, 2 relative links đúng, Codex nhận đúng hai skill repo/enabled, không load error; không ghi lại evidence cài đặt đã chốt.
- Đã dọn đúng nhóm được phép, giữ skill/license/source metadata/snapshot/evidence. Reviewer độc lập đã APPROVE cleanup candidate bên dưới; task cleanup đã qua gate.

### Review cleanup cuối

**APPROVE** — phạm vi cleanup tiếp nối và tính toàn vẹn skill sau dọn.

Candidate `cleanup-candidate.json`, SHA256 `da1c6594ef49009d87a74a74491fcbb0dd538499eb76e554b987312589e82c50`.

- Ba file trong manifest khớp hash; receipt và handoff nhất quán với quyền xóa đúng nhóm temp.
- Đã đọc `cleanup.py`: kiểm đường dẫn, reparse point, 62 file/369.475 byte, nội dung ZIP và snapshot trước khi xóa; chỉ unlink file đã kiểm và rmdir thư mục rỗng.
- Xác minh độc lập target đã mất, thư mục cha còn. Candidate cài đặt, snapshot skill và mọi target cũ ngoài handoff giữ nguyên; handoff chỉ đổi phần metadata được phép.
- Chạy lại `verify.mjs --no-write`: **exit 0**, `2026-10-22T07:17:37.759Z`; 40 file/85.779 byte nguyên vẹn, hai skill repo/enabled, không load error liên quan.

**Không có finding chặn hoặc đề xuất không chặn.**

Delta D `+512.000 byte`, C `0` được tính đúng từ receipt; đây là biến động dung lượng toàn volume, không chứng minh chính xác số block riêng cleanup thu hồi. Reviewer không chạy lại cleanup, không sửa/xóa/cài đặt hoặc gọi DB.
