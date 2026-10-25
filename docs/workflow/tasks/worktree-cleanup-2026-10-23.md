# Kiểm tra và dọn Git worktree — 23/10/2026

## Phạm vi và quyền

Chủ dự án yêu cầu tại chat `01a16803-fc3b-7781-b5a0-876d99ab0517`: kiểm tra worktree dư, không còn sử dụng hoặc hết giá trị và xóa khi đủ điều kiện; lấy `D:/Workspace/pos-cafe` (code) và `D:/Workspace/pos-cafe-docs` (docs) làm gốc. Đây là bảo trì checkout, không tạo yêu cầu sản phẩm hoặc change OpenSpec mới.

Giữ nhánh/commit, mọi thay đổi đang làm và bằng chứng riêng. Không merge/reset/clean/stash, đổi nhánh, push, cài dependency, đụng DB hoặc dựng runtime. Nhánh gốc code ở `5156820f7d6679cd6f8051bdc38419737ffa0c7e`, docs ở `0fe967d554cecfa7e0cb58d6efa01d64941439ff`; lần kiểm có tương ứng 553 và 476 dòng status. `origin/main` hiện có ref khác local main; không nhận các nhánh chưa vào local main/docs là đã tích hợp.

## Kết quả khảo sát và quyết định

Git ghi nhận 26 worktree: 24 thư mục hiện hữu, hai đăng ký Linux trỏ tới vị trí đã mất. Chọn xóa chín checkout lịch sử; đây là quyết định thực thi của agent trong phạm vi lệnh dọn của chủ dự án, không phải phê duyệt merge hoặc tuyên bố source đã vào hai nhánh gốc.

| Checkout trong `D:/Workspace` | HEAD | Lý do đủ điều kiện |
| --- | --- | --- |
| `pos-cafe/.claude/worktrees/code-spec-review-subagent-2bd9f4` | `5156820` | Source bằng main; 15 file báo cáo/ảnh riêng đã sao lưu, cache có thể tái tạo |
| `pos-cafe/.claude/worktrees/hopeful-albattani-42cb20` | `ef2c372` | HEAD nằm trong main; detached, không thay đổi source; giữ coverage/trace trước dọn dependency và dist |
| `pos-cafe/.claude/worktrees/optimize-server-db-connection-8238bd` | `ef2c372` | Source sạch, đã nằm trong main; settings trùng bản gốc và có bản lưu |
| `pos-cafe/.claude/worktrees/pos-web-ui-ux-requirements-2b0ef7` | `ef2c372` | Source đã nằm trong main; giữ năm ảnh riêng, log/snapshot trình duyệt và settings trước dọn dependency |
| `pos-cafe-evidence-code` | `43921c7` | Checkout source sạch; không ignored/untracked; commit có nhánh lưu và là ancestor của source phân quyền mới hơn |
| `pos-cafe-evidence-docs` | `d62aa4b` | Checkout minh chứng sạch; không ignored/untracked; nhánh minh chứng vẫn giữ nguyên, không nhận đã vào docs |
| `pos-cafe-full-runner-20261018` | `567af21` | Checkout sạch, không runtime/artifacts; HEAD cũng còn ở các worktree khác và là ancestor của source mới |
| `pos-cafe-merge-20261018` | `7fa52d8` | Checkout tích hợp cũ sạch; không ignored/untracked; commit được source mới kế thừa và nhánh vẫn giữ |
| `pos-cafe-ui-workflow-docs` | `0bcb510` | Checkout docs cũ sạch; không ignored/untracked; commit có nhánh lưu và nằm trong ref origin/docs đã có tại lần kiểm |

Hai đăng ký dự kiến prune: `/var/tmp/pos-cafe-perm-perm60-20261012/source` và `/var/tmp/pos-cafe-perm-source25-20261013/source`. Cả hai HEAD bằng main, index không có staged delta, reflog chỉ có HEAD đó. Metadata được sao lưu trước prune; dry-run chỉ liệt kê đúng hai mục này. Không khởi động/tạo WSL.

Giữ 15 worktree, gồm hai gốc và 13 checkout sau:

- `pos-cafe-ci`: 11 thay đổi source riêng và artifacts.
- `pos-cafe-ci-fix`, `pos-cafe-ci-main`: source sạch nhưng artifacts là bằng chứng đang được docs tham chiếu; giữ đường dẫn gốc.
- `pos-cafe-permission-a-20261019`: có artifacts, giữ bằng chứng.
- `pos-cafe-permission-b-20261019`, `pos-cafe-permission-l-20261019`, `pos-cafe-permission-p-20261019`, `pos-cafe-permission-r-20261019`: lần lượt 4/2/5/4 file source chưa commit và artifacts.
- `pos-cafe-permission-integration-20261019`: 111 dòng status, gồm source đang làm và artifacts.
- `pos-cafe-permission-run-20261020/code`: 15 file source chưa commit, dependency và artifacts.
- `pos-cafe-permission-ci-fix-20261022/code`, `pos-cafe-permission-timeonly-20261022/code`: source sạch nhưng thuộc đường chạy/handoff gần nhất; chưa xác minh đã hết nhu cầu sử dụng.
- `pos-cafe-ui-workflow`: source sạch nhưng có artifacts/report/ảnh riêng đang được hồ sơ tham chiếu.

## Bảo toàn, bằng chứng và cách khôi phục

Gói kiểm kê và bản lưu nằm ngoài checkout tại [D:/Workspace/pos-cafe-worktree-cleanup-20261023](D:/Workspace/pos-cafe-worktree-cleanup-20261023). `inventory-before.json` và `candidate.json` ghi đủ HEAD/branch/path; `refs-before.txt` ghi toàn bộ nhánh local/remote có sẵn. Không fetch nên quan hệ với origin chỉ là ref đã có, không là xác nhận GitHub hiện thời.

`backup-manifest.json` ghi 84 file, **5.931.877 byte logic**: ảnh/report, coverage, trace, log/snapshot và bốn settings. Từng bản lưu đã đối chiếu SHA256 với bản gốc; không đưa nội dung log/settings vào docs. Đây là bằng chứng/đầu ra cần giữ, không phải temp được phép xóa tiếp. Metadata hai đăng ký cũ ở `pruned-metadata/`; metadata cả chín checkout hiện hữu ở `worktree-metadata/` (69 file, 676.582 byte logic). Chỉ bỏ `node_modules`, `dist` và cache Vite có thể tái tạo trong bốn checkout Claude đã chọn. Không tuyên bố kích thước logic là dung lượng thực thu hồi.

Review lịch sử tìm thấy commit `4f82a3363c2edba36251892bae78c522b6339930` không reachable từ refs nhưng còn trong HEAD reflog của checkout review và common reflog của nhánh khác. Trước xóa sẽ tạo đúng một ref lưu trữ `refs/archive/worktree-cleanup/20261023/code-spec-review-subagent-2bd9f4/4f82a3363c2edba36251892bae78c522b6339930` để giữ object độc lập với thời hạn reflog; không đổi nhánh/remote ref hiện hữu. Plan chính xác nằm ở `recovery-refs-plan.json` và `candidate.json`. Không có bằng chứng drift WIP gốc: hai file `useRealtimeInvalidation.*` được ghi `D`/`ABSENT` và vẫn vắng; cảnh báo sơ bộ của reviewer do xử lý sai sentinel đã được rút trước verdict.

Trước thao tác xóa: xác minh đường dẫn tuyệt đối thuộc allowlist, `.git` trỏ đúng common repository, HEAD/branch không đổi, không lock/submodule/repository lồng hoặc reparse point; xác minh lại backup và không có file riêng mới. Chỉ xóa từng file untracked đã có bản lưu khớp hash, rồi dùng `git worktree remove <đường-dẫn>` **không `--force`**. Prune chỉ chạy khi dry-run vẫn đúng hai đăng ký đã duyệt. Không sửa cấu hình MCP/Playwright.

Phục hồi checkout có nhánh bằng `git -C D:/Workspace/pos-cafe worktree add <đường-dẫn-cũ> <nhánh-trong-candidate.json>`; checkout detached dùng `worktree add --detach <đường-dẫn-cũ> <HEAD-đầy-đủ>`. Sao chép các file riêng từ đường dẫn `backup` về `source` trong manifest nếu cần. Dependency/dist phải dựng lại khi thật sự cần, theo quy tắc ngân sách/cài đặt. Các liên kết tuyệt đối vào checkout đã xóa có thể cần phục hồi checkout theo recipe này; nội dung Git và bằng chứng riêng vẫn giữ được.

Không thấy process có command line trỏ tới pos-cafe hoặc Claude khi quét; danh sách 50 chat gần nhất không có chat đang chạy ở chín checkout này. Không coi đó là kiểm kê mọi cwd/handle của toàn hệ thống; sẽ dừng nếu Git báo đường dẫn bận hoặc xuất hiện thay đổi mới.

## Trạng thái thực thi và review

Đã thực thi lúc **16:25 ngày 23/10/2026 (UTC+7)**, exit 0, đúng script SHA256 `520ACDDBD1CCF3172B29CB527662FD8B2AD648CC039BB2770F1BA10A1914EC73`. Hai reviewer `review_worktree_integrity` và `review_worktree_scope` đều APPROVE gói chuẩn bị và delta script trước Execute. Candidate SHA256 `AF58CDABC1253F18A216195D6BBE07486FBC0CACACC4527B70C63B7EA208006D`.

- Xóa đúng chín thư mục và prune đúng hai đăng ký đã liệt kê: **26 → 15 worktree**. `removal-receipt.json`, `execution-summary.json` và `worktrees-after.txt` ghi kết quả; prune dry-run cuối không còn mục nào.
- **60 ref nhánh/remote trước và sau giống nhau**, không xóa nhánh; recovery ref mới trỏ đúng `4f82a3363c2edba36251892bae78c522b6339930`. Các HEAD của checkout đã xóa vẫn có commit object và nhánh lưu để dựng lại.
- HEAD/branch/index hai gốc không đổi. Đối chiếu toàn bộ **553 fingerprint code và 476 fingerprint docs có trước task: không lệch** tại kiểm tra ngay sau xóa. Code vẫn 553 dòng status; docs tăng 476 → 477 chỉ do hồ sơ mới này. Sau phép kiểm đó, chỉ append một dòng task index: `task-index-before.md` lưu preimage, `task-index-update.json` chứng minh toàn bộ byte tiền tố cũ được giữ nguyên. Không sửa nội dung WIP có sẵn.
- **84/84 bản lưu khớp SHA256**, 0 sai lệch sau xóa. `verification-after.json` ghi trạng thái cả 15 checkout còn lại; các checkout giữ lại không đổi HEAD/số dòng status ngoài hồ sơ docs mới.
- Windows D trống **98.178.129.920 → 98.856.898.560 byte** ngay trước/sau Execute, tăng **678.768.640 byte ≈ 647,32 MiB**. Đây là mức tăng trống đo trên ổ thực trong khoảng thực thi, có thể chịu hoạt động nền; không phải lấy tổng file logic làm dung lượng thu hồi. C trống **193.157.767.168 → 193.156.755.456 byte**. Không cài gói hoặc tạo môi trường kiểm thử; dữ liệu bổ sung lưu giữ chỉ vài MB.

Kiểm chứng phù hợp là identity/status/hash/ref/path và dung lượng, không chạy lại test ứng dụng vì không thay source. Chưa dựng thử checkout phục hồi hoặc tải lại dependency; không tuyên bố đã kiểm nghiệm recipe khôi phục đầu cuối. Hồ sơ đã được thêm vào task index; không commit/push. Hai reviewer đã APPROVE kết quả cuối theo metadata dưới đây; không còn bước xóa nào đang chờ.

## Metadata review cuối — 23/10/2026

Candidate nội dung kết quả trước bổ sung metadata: handoff SHA256 `A97A7154BFB0801D0068B71C30F4868FC923E4E642ACE3C83498AD2A0186A46C`; task index `70429E0BDB77ED10D0A6F77387B4BFBC9BF44CAAFDD1FD98146597D98611D93B`; verification `7A24D8EE280F831A0BB4F9813CF9202837FB14D6EA11DCCE0113BE9C8AA75C74`; execution summary `1EA9D5E41C00230DB5ACB30230B94B54BAB00EBC9D831000A2DF0458E0EE1896`.

| Reviewer độc lập | Phạm vi và kiểm lại | Verdict |
| --- | --- | --- |
| `/root/review_worktree_integrity` | Git/file/evidence: chín path vắng, đủ 15 checkout giữ lại, prune rỗng, 60 ref không đổi, recovery ref/commit objects tồn tại, 84 backup + 69 metadata đúng hash, WIP/HEAD/index gốc nguyên, task index giữ đủ 49.378 byte cũ và chỉ append 287 byte; số đo D khớp receipt | **APPROVE kết quả thực thi**, không finding chặn |
| `/root/review_worktree_scope` | Quyền/retention/recovery/báo cáo: kiểm độc lập path/ref/object/hash/fingerprint, task index prefix, phạm vi 9 removals + 2 prunes và 15 checkout giữ; đúng giới hạn khôi phục/link tuyệt đối, đo ròng dung lượng và không commit/push | **APPROVE kết quả thực thi cuối**, không finding chặn |

Cả hai chỉ đọc, không sửa candidate hoặc xóa dữ liệu; chưa dựng thử phục hồi checkout/dependency hay xác nhận remote hiện thời. Chỉ bổ sung metadata verdict sau review theo quy tắc không review đệ quy. Đã hoàn tất trong phạm vi bảo trì được giao; bản lưu và nhánh lịch sử tiếp tục được giữ.
