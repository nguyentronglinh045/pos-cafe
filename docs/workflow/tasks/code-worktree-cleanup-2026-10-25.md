# Dọn worktree code POS-cafe — 25/10/2026

Trạng thái: **đã xóa đủ 12 checkout theo xác nhận của chủ dự án; kiểm tra sau xóa đạt; hai reviewer độc lập APPROVE kết quả cuối**.

Kho bằng chứng và bản lưu tuyệt đối: `D:/Workspace/pos-cafe-worktree-cleanup-20261025/`. Các tên manifest, receipt, script và thư mục `retained/` trong hồ sơ này được tính từ đó.

Đã giảm **14 → 2 worktree**. Đây là dọn checkout lịch sử; không hợp nhất WIP, thay code ứng dụng, chạy test/CI, đổi backend, cập nhật main, xóa nhánh hoặc push.

## Hai worktree giữ nguyên

- `D:/Workspace/pos-cafe`: main local `5156820`, còn 553 dòng status. Giữ nguyên HEAD, index và mọi file đang làm.
- `D:/Workspace/pos-cafe-permission-timeonly-20261022/code`: detached `711a22e`, sạch, là checkout của main mới nhất đã xác minh qua `git ls-remote origin refs/heads/main`. Giữ cả parent chứa private/evidence/cache; bốn thư mục từng bị bộ duyệt tự động chặn xóa nằm ngoài phạm vi.

## Danh sách chính xác đã xóa

| Đường dẫn tuyệt đối | HEAD | File thay đổi/chưa theo dõi | MiB file logic | MiB giữ lại |
| --- | --- | ---: | ---: | ---: |
| D:/Workspace/pos-cafe-ci | c898d76 | 11 | 69.61 | 56.64 |
| D:/Workspace/pos-cafe-ci-fix | 8de965a | 0 | 33.60 | 0.99 |
| D:/Workspace/pos-cafe-ci-main | 691b0d4 | 0 | 55.21 | 22.56 |
| D:/Workspace/pos-cafe-permission-a-20261019 | 567af21 | 0 | 36.73 | 0.27 |
| D:/Workspace/pos-cafe-permission-b-20261019 | 567af21 | 4 | 38.29 | 1.83 |
| D:/Workspace/pos-cafe-permission-ci-fix-20261022/code | b2e3122 | 0 | 39.61 | 0.00 |
| D:/Workspace/pos-cafe-permission-integration-20261019 | 567af21 | 111 | 52.39 | 16.13 |
| D:/Workspace/pos-cafe-permission-l-20261019 | 567af21 | 2 | 37.89 | 1.43 |
| D:/Workspace/pos-cafe-permission-p-20261019 | 567af21 | 5 | 40.10 | 3.64 |
| D:/Workspace/pos-cafe-permission-r-20261019 | 567af21 | 4 | 38.50 | 2.04 |
| D:/Workspace/pos-cafe-permission-run-20261020/code | 38a55aa | 15 | 56.47 | 0.18 |
| D:/Workspace/pos-cafe-ui-workflow | b581afe | 0 | 158.59 | 110.11 |

Tất cả HEAD trên đều là ancestor của remote main `711a22e71983e3d6aa17799649af05ce4c762555`; mọi nhánh lịch sử tiếp tục giữ. Không staged changes. Có 152 dòng status ở bảy checkout: 151 file thay đổi/chưa theo dõi được lưu riêng; `.gitignore` ở checkout integration báo M nhưng 374 byte thực tế giống hệt HEAD nên được bảo toàn trong Git. Không nhận WIP đã merge chỉ vì HEAD đã merge.

Tổng checkout khoảng **657 MiB file logic**; WIP/bằng chứng khoảng **216 MiB**. Metadata nâng tổng bản sao 14.166 file thành **227.466.704 byte logic** (216,93 MiB), chưa tính manifest/patch/recipe. Phần giảm ước tính khoảng **440 MiB**, không phải cam kết dung lượng vật lý thu hồi: có hardlink/junction, filesystem overhead và hoạt động nền. Sau xóa phải đo lại ổ Windows C/D. Không cài dependency hay tạo runtime; dữ liệu chuẩn bị có trần 500 MiB.

## Những gì đã bảo toàn

- `inventory.json`: đường dẫn, HEAD/branch, status, hash từng file, danh sách thư mục và 319 reparse entries của 12 checkout. Không duyệt theo target junction.
- `retained/<id>/files/`: mọi file mới/ignored, mọi file tracked thay đổi; chỉ loại `node_modules/` và `dist/` ở gốc khỏi bản lưu vì có thể dựng lại. Giữ đầy đủ artifacts, report/ảnh, test-results và 113 repository Git lồng trong fixture artifacts.
- `retained/<id>/git-metadata/`: index, HEAD, logs và các file quản trị worktree. Root `.git` pointer cũng được lưu.
- `retained/<id>/{worktree,index,unstaged}.patch`: binary/full-index patches. `links.json` giữ đường dẫn/target junction; không dựng junction trong backup.
- `backup-manifest.json`: source/backup/bytes/SHA256 của 14.166 bản sao; đã kiểm hash sau copy. `backup-acl-manifest.json` lưu SDDL gốc/bản sao; owner, group và quy tắc ACL hiệu lực đã đối chiếu. Khi cần, bản sao có ACL explicit bảo toàn các rule inherited từ nguồn.
- Hai ref mới `refs/archive/worktree-cleanup/20261025/ci-main/<SHA>` giữ commit reflog-only `638ee233c85142caf2348d5db6d4a8f25832b74a` và `98f3afc8d674ee0a55044047e8981f42b2ede917`; không sửa/xóa branch hiện hữu.

Không dọn các thư mục `pos-cafe-*` khác ngoài bảng, kể cả backup 23/10, docs-retained, runtime/private, review snapshots và các parent của hai đường dẫn `/code` trong bảng. Những nơi này không phải checkout Git đăng ký hoặc còn chứa dữ liệu cần giữ.

## Quy trình thực thi đã áp dụng

`execute-cleanup.ps1` mặc định chỉ dry run. Khi có xác nhận rõ của chủ dự án, hồ sơ quyền phải khớp SHA256 `inventory.json`, và reviewer phải duyệt candidate cuối trước `-Execute`.

Trước mỗi checkout: xác minh literal allowlist, resolved absolute path, Git identity/branch/HEAD/index/status/file hash, bản sao, registry lock và process có command line liên quan. Xóa từng reparse entry bằng `Remove-Item -LiteralPath` **không recurse**, rồi `git worktree remove --force -- <đường-dẫn>`; force chỉ dùng vì WIP đã được lưu/kiểm và danh sách được chủ dự án duyệt. Không đi theo junction tới main/node_modules; nếu bị tool/Git từ chối thì dừng, không đổi cách để vượt chặn. Không chạy prune toàn hệ thống.

Sau xóa: kiểm 12 path vắng, Git không còn đăng ký chúng, các branch/commit vẫn tồn tại, mọi bản lưu đúng hash, hai worktree giữ nguyên HEAD/index/WIP và đo C/D. Không đòi mọi ref nội bộ `refs/codex/*` bất biến vì app tạo/xóa chúng; nhánh docs đang có chat khác cập nhật nên chỉ kiểm còn tồn tại, không ghi đè ref đó.

## Khôi phục

1. Đọc HEAD/branch và path từ `inventory.json`. Dùng `git -C D:/Workspace/pos-cafe worktree add <path-cũ> <branch>`; nếu branch đã được checkout nơi khác hoặc đã thay đổi, dùng `worktree add --detach <path-cũ> <HEAD-đã-lưu>` để dựng đúng source.
2. Áp `worktree.patch` hoặc chép đúng file WIP từ `retained/<id>/files/` về vị trí cũ; khôi phục file mới/ignored và thư mục rỗng theo manifest. Không chép đè root `.git` pointer lên worktree mới. `index.patch`/`unstaged.patch` dành cho khôi phục tách staged/unstaged; hiện staged rỗng.
3. Khôi phục ACL theo manifest và các junction từ `links.json` sau khi xác minh target còn hợp lệ. Dependency/dist cần dựng lại theo quy tắc cài đặt/dung lượng nếu dùng tiếp; snapshot không chứa bản dependency đầy đủ.
4. Link tuyệt đối cũ trong docs/scripts không tự chuyển tới kho lưu. Ví dụ helper lịch sử `pos-cafe-permission-ci-fix-20261022/tools/staging-setup-20261022/prepare.mjs` pin code b2e3122: phải khôi phục đúng checkout b2 vào đường dẫn cũ trước khi tái hiện phase đó, không sửa helper sang main mới.

Chưa dựng thử phục hồi toàn bộ checkout/dependency. Việc kiểm hiện tại là identity/status/hash/ACL/ref/path; không phải test ứng dụng hoặc xác nhận backend/deploy PASS.

## Kết quả thực thi — 18:15 ngày 25/10/2026 (UTC+7)

Chủ dự án trả lời **“Đồng ý xóa 12 worktree theo danh sách”** cho câu hỏi async trong chat `01a172b4-4636-7f61-a5ba-cf240f5d5247`. `user-approval.json` gắn quyền với inventory SHA256 `4AA47E85F338090E598D1D6FDCB14CC700216C318E3AFD1B20DF24A26FA66B06`.

Hai reviewer độc lập `/root/review_git_retention` và `/root/review_cleanup_scope` đã APPROVE candidate trước Execute. Reviewer Git kiểm history/WIP/metadata/recovery; reviewer scope kiểm allowlist/quyền/retention/ACL. Đã xử lý hai findings: bổ sung so sánh toàn bộ metadata Git và lock mới trước mỗi lần remove; sửa mô tả 152 dòng status thành 151 file lưu riêng cùng một file byte-identical HEAD. Candidate executor SHA256 `5390BAC9E15BE3E7429EFC3376EFB7FC63DF3342277A00DA51AF3D01FC8AE535`, verifier `AC7BCF03541394C9D8032019A6512B4703AB4188A00CAAC839BB4DD89F41E11D`.

Lệnh `execute-cleanup.ps1 -Execute` exit 0. `removal-receipt.json` ghi đúng 12 path; `execution-summary.json` và `after-verification.json` xác nhận còn đúng hai checkout đã giữ. Cả 12 HEAD và các nhánh lịch sử còn tồn tại. Main vẫn 553 dòng status, HEAD/index/WIP fingerprint không đổi; timeonly vẫn sạch tại711a22e. Sau xóa, 14.166/14.166 bản lưu đúng SHA256; hai archive refs đúng SHA. Các reparse entry được tháo tại vị trí link; không đi theo target main/node_modules.

Dung lượng Windows trong khoảng Execute: D trống **103.659.827.200 → 104.399.507.456 byte**, tăng **739.680.256 byte ≈ 705,41 MiB**. C trống **192.438.599.680 → 192.444.350.464 byte**. Đây là biến động dung lượng trống đo trên ổ thực, có thể chịu hoạt động nền; không suy từ tổng file logic. Các số trước Execute đã bao gồm bản lưu chuẩn bị. Kho lưu cộng script/manifest chiếm khoảng239 MiB file logic tại checkpoint trước Execute; bản lưu này cần giữ, không phải temp đã được cho phép xóa.

Không tạo thêm worktree docs để ghi hồ sơ. Hồ sơ task trên nhánh docs được cập nhật bằng index riêng, dựa trên HEAD docs mới nhất và compare-and-swap ref để không ghi đè công việc chat docs đang chạy. Không chuyển branch hoặc chạm index của main. Không push từ task này. `docs-publication.json` ghi base/commit và đúng hai file docs được cập nhật; task index giữ nguyên ngoài một mục liên kết mới.

## Metadata review kết quả cuối

Candidate nội dung kết quả trước bổ sung metadata: README SHA256 `51877E6B6AD9390D3A1CA348A28AB4BABF4820A7C53AFF025FC6E3D7D9E1F592`; execution summary `25236E5B7D1A9AF50CCFE7BC47A4B6980D466D76AD66C223719AECA7E14A509C`; after-verification `D476B1CA3D3661A8214D372625BAD4BE3D95850AE85EE7303A6DD1C092575871`.

| Reviewer | Phạm vi tự kiểm kết quả cuối | Verdict |
| --- | --- | --- |
| `/root/review_git_retention` | 12 path vắng; hai worktree giữ nguyên HEAD/index/status/WIP;12 nhánh lịch sử cùng hai archive refs đúng;14.166 bản lưu khớp hash/kích thước;receipt/báo cáo/recovery đúng | **APPROVE**, không finding chặn |
| `/root/review_cleanup_scope` | Allowlist/quyền; hai worktree, bốn path từng bị chặn, parent evidence/private/helper và main/node_modules còn nguyên;14.166 hash và14.166 ACL khớp;refs/receipt/dung lượng đúng;giới hạn phục hồi được ghi | **APPROVE**, không finding chặn |

Hai reviewer chỉ đọc, không sửa/xóa candidate. Cả hai chưa dựng thử phục hồi checkout/dependency toàn bộ. Review kết quả diễn ra trước bước ghi commit docs; nội dung hồ sơ đã được review. Phần bổ sung sau review chỉ ghi verdict, đường dẫn kho bằng chứng theo đề nghị reviewer và metadata xuất bản hồ sơ.
