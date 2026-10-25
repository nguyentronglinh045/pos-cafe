# Kho lưu trữ POS-cafe

Đợt tổ chức ngày25/10/2026. Trạng thái: **hoàn tất; kiểm hash/ACL/code/private sau thao tác đạt; hai reviewer độc lập APPROVE kết quả cuối**.

Chủ dự án yêu cầu gom bản lưu, báo cáo và bằng chứng vào một thư mục chung, xóa thư mục rỗng/cache không còn dùng và giữ nguyên code/dữ liệu riêng. Phạm vi dưới đây thực hiện đúng yêu cầu đó; không hợp nhất source, đổi nhánh code, chạy test/CI/backend hoặc push.

## Cấu trúc hiện tại

Các nhóm lịch sử giữ tên cũ bên trong `D:/Workspace/pos-cafe-archive/` để dễ tra cứu. Tám thư mục được chuyển nguyên nhóm:

- `pos-cafe-docs-retained-20261025`
- `pos-cafe-worktree-cleanup-20261023`
- `pos-cafe-worktree-cleanup-20261025`
- `pos-cafe-review-business`
- `pos-cafe-review-harness`
- `pos-cafe-review-harness-final`
- `pos-cafe-review-security`
- `pos-cafe-permission-ci-fix-20261022`

Hai nhóm chuyển từng mục con:

- `pos-cafe-permission-run-20261020`: chuyển drafts, lab recipes, helper scripts và dữ liệu khảo sát lịch sử. Giữ **toàn bộ `evidence/` và `private/` tại vị trí cũ** vì code hiện hành đọc trạng thái claim/ledger ở đó; không thay bằng junction. Đây là dữ liệu vận hành cần giữ, không phải cache.
- `pos-cafe-permission-verify`: chuyển source snapshot, manifest, báo cáo, review candidate, logs npm và fixture/helper; giữ `config/` tại vị trí cũ, gồm hai npmrc được pin và có ACL riêng.

Sau thực thi, `D:/Workspace` còn bảy thư mục nhóm pos-cafe: `pos-cafe`, `pos-cafe-permission-timeonly-20261022`, hai thư mục `pos-cafe-db-*-private`, `pos-cafe-permission-run-20261020`, `pos-cafe-permission-verify`, và kho `pos-cafe-archive` này. Hai worktree Git giữ nguyên HEAD/index/source; không thao tác vào môi trường và private bên trong timeonly, kể cả các thư mục từng bị bộ duyệt tự động từ chối xóa.

## Phạm vi xóa

Chỉ xóa thư mục `D:/Workspace/pos-cafe-code` sau kiểm tra rỗng cả file ẩn, cùng sáu đường dẫn cache trong `D:/Workspace/pos-cafe-permission-verify/`:

| Đường dẫn tương đối | Loại | Byte logic |
| --- | --- | ---: |
| source/node_modules | Dependency của snapshot kiểm thử cũ | 218313189 |
| source/dist | Bản build được sinh từ source snapshot | 7524048 |
| npm-cache/_cacache | Nội dung tải npm có thể tải lại | 49014592 |
| temp/node-compile-cache | Cache biên dịch Node | 5198227 |
| temp/node-jiti | Cache chuyển mã jiti | 2707 |
| temp/playwright-transform-cache | Cache chuyển mã Playwright | 376237 |

Tổng **280429000 byte ≈267,44 MiB file logic**. Source manifest 835 entries không gồm các nhóm này. Cả835trạng thái khớp:833file đúng hash và hai entry `deleted:true` (`src/features/integration/useRealtimeInvalidation.test.tsx`, `src/features/integration/useRealtimeInvalidation.ts`) vắng đúng yêu cầu của manifest; đây không phải thiếu snapshot. Giữ package/lock/config, source hiện có, bằng chứng build/test và11npm logs; muốn chạy lại cần dựng dependency/build/cache theo quy tắc dung lượng/cài đặt. Không cam kết khôi phục byte-identical cache đã xóa. Không xóa các thư mục rỗng có ý nghĩa trong snapshot/fixture/Git metadata, và không xem toàn bộ `temp/` là cache.

## Bảo toàn, liên kết và khôi phục

Hồ sơ thao tác tại `D:/Workspace/pos-cafe-archive/_organization-20261025/`:

- `plan.json`:338 thao tác move (8root,330mục con), hash/loại từng entry, sáu cache+thư mục rỗng cần xóa và fingerprint các vùng phải giữ.
- `relocation-map.json`: ánh xạ từng đường dẫn cũ sang mới. Khớp prefix dài nhất, không phân biệt slash/case Windows và luôn có biên thành phần đường dẫn. Phân biệt root chuyển toàn bộ và partial children; không suy rằng toàn bộ run/verify đã chuyển.
- `acl-manifest.json`:30747entry/8descriptor để so owner/group/ACL trước và sau; chỉ đọc quyền, không nới quyền.
- `organize.mjs`, `execute.ps1`: recipe kiểm hash, registry/ref, path, ACL, process và thực thi; script mặc định dry run. Chỉ dùng Move-Item/Remove-Item với LiteralPath trong PowerShell, cùng ổ D, không theo junction.
- `receipt.json`, `execution-summary.json`, `after-verification.json`: ghi kết quả thật sau Execute.

Các snapshot/manifests/scripts lịch sử giữ nguyên byte và hash. Kho này **không phải môi trường được cô lập**:26junction được giữ nguyên target và ACL, trong đó3junction vẫn trỏ tới `main/node_modules`; không duyệt theo link khi kiểm/dọn. Sau chuyển,21target nội bộ trỏ đường dẫn cũ không còn phân giải;2negative fixtures vốn đã dangling vẫn được giữ đúng trạng thái. Việc này được ghi nhận thay vì sửa bằng chứng lịch sử.

**Không chạy scripts/tests cũ trực tiếp từ archive.** Các script/manifest cleanup trước và helper lịch sử chứa đường dẫn tuyệt đối. Muốn tái hiện, đọc map để tìm nguồn hiện tại; khôi phục đúng từng nhóm/mục con về đường dẫn cũ khi đích cũ **chưa tồn tại**. Với partial run/verify, không chép đè `private/`, `evidence/`, `config/` đang giữ hoặc bất kỳ dữ liệu mới nào. Khôi phục đúng vị trí sẽ làm link nội bộ phân giải lại; hai fixture dangling vẫn phải dangling. Tải lại dependency khi cần, không dùng junction để thay thế các thư mục trạng thái vận hành vốn kiểm tra realpath.

Các reference tuyệt đối cũ trong nhóm bằng chứng đã chuyển là provenance; dùng relocation map khi tra cứu. Phần run/evidence giữ nguyên vẫn chứa trạng thái vận hành hiện hành. Không sửa hàng loạt manifest/script/receipt cũ hoặc chạy lại script cleanup cũ sau khi chuyển. Chưa dựng thử phục hồi toàn bộ snapshot/runtime.

## Kiểm chứng và dung lượng

Chuẩn bị hiện tại đã hash24051file cần lưu (460604155byte logic),26junction và code/private cần giữ. Di chuyển cùng ổ D không tự thu hồi dung lượng hoặc nhân đôi dữ liệu; phần dung lượng thu hồi đến từ cache. Hồ sơ mới dự kiến10–40MiB, trần100MiB; không cài gói hay tạo runtime. Số đo Windows C/D trước/sau Execute sẽ được ghi riêng, không đồng nhất tổng file logic với dung lượng vật lý thực thu hồi.

Hai reviewer độc lập kiểm candidate và kết quả trong scope Git/hash/recovery và quyền/private/ACL/retention. Hồ sơ ghi vào nhánh docs qua index riêng/CAS, không tạo thêm worktree hoặc sửa index main.

## Kết quả lúc18:45 ngày25/10/2026 (UTC+7)

Quyền thực hiện đến từ yêu cầu trực tiếp của chủ dự án trong chat `01a172b4-4636-7f61-a5ba-cf240f5d5247`: “gom các bản lưu, báo cáo và bằng chứng vào một thư mục chung, rồi xóa thư mục rỗng và cache không còn dùng ... giữ nguyên code và dữ liệu riêng”. Không mở rộng sang code/private hoặc cache đang phục vụ hai worktree.

Hai reviewer `/root/review_git_retention` và `/root/review_cleanup_scope` đã APPROVE candidate trước Execute, lần lượt kiểm hash/map/recovery và scope/quyền/ACL/operational claims. Plan SHA256 `68267CF6B48CADF70C150F4FDEBFEA7478763BD02B1329B507818435BDE5F12D`; executor `A0E4270DE462A833F302022465CDA903526F6DC4986246F920C7BE8CC9DD1A6D`; verifier `428D3B212989365E1BDBD3FAEE96F9E5A18A80D0DAED4EAC5874801E28BB4EE0`.

`execute.ps1 -Execute` exit0. Receipt ghi338move và7delete, khớp allowlist. Đã kiểm sau thao tác:24051/24051file lưu trữ đúng hash,26junction giữ target cũ,30747/30747ACL đúng; hai worktree giữ nguyên registry/HEAD/index/status/source, năm nhóm dữ liệu bảo vệ giữ nguyên hash. Các nhánh Git và hai archive refs của đợt trước còn nguyên. Các nhóm cũ đã chuyển không còn tại đường dẫn cũ; run còn `evidence/`+`private/`, verify còn `config/`.

Dung lượng Windows trong khoảng Execute: D trống **104367792128 →104678363136byte**, tăng **310571008byte ≈296,18MiB**. C trống **192422866944 →192422518784byte**. Đây là biến động đo trên ổ thực trong khoảng chạy, có thể chịu hoạt động nền; số đầu đã gồm khoảng29,48MiB hồ sơ chuẩn bị. Việc move cùng ổ không được tính là thu hồi dung lượng; cache bị xóa có280429000byte logic. Không cài gói, tải thêm dữ liệu hoặc tạo runtime.

Chưa dựng lại dependency hay chạy phục hồi end-to-end các snapshot lịch sử. Không có tuyên bố app/backend/CI PASS từ phép kiểm filesystem này. Các link cần restore đúngpath vẫn được ghi ở trên. Hồ sơ cập nhật ba file trên docs: task này, một mục task index và đường dẫn hiện hành của docs-retained trong AGENTS.md; giữ nguyên mọi nội dung lịch sử khác, không push từ task này. `docs-publication.json` ghi base/commit và phạm vi thay đổi thực tế.

## Metadata review cuối

Candidate nội dung trước bổ sung metadata: README SHA256 `4FE537898D842B0D11B1DDF0C91A934A2932A767294A63A3929CCFB83C5E9811`; execution summary `0FCC0FCBAFE57D15C8D2957A7A24B3C597BFB81BD87F90B1CC21411B0C7FC8AF`; after-verification `197F17FF0B08128FE2C3BB6667D7343EC6E3080E219CE81110DF9071C8126679`.

| Reviewer | Kết quả kiểm độc lập | Verdict cuối |
| --- | --- | --- |
| `/root/review_git_retention` | 338 move/7 delete đúng; 24051 file và 14166 bản lưu cũ đúng hash; 26 junction đúng target; hai code/năm nhóm bảo vệ/refs nguyên; mapping và recovery rõ | **APPROVE** |
| `/root/review_cleanup_scope` | Scope/quyền/private/operational claims đúng; 24051 hash và 30747 ACL khớp; path/dung lượng/report đúng; không mở rộng cache đang dùng | **APPROVE** |

Finding báo cáo đã đóng: reviewer Git ban đầu bỏ sót trường `deleted:true`, diễn giải hai file vắng là thiếu snapshot; reviewer scope yêu cầu sửa và tự kiểm đủ835trạng thái. Root đối chiếu manifest, sửa báo cáo; reviewer Git rút nhận định cũ và cả hai APPROVE candidate cuối ở trên. Không có sửa source/manifest lịch sử hoặc chạy lại test không cần thiết.

Review kết quả diễn ra trước publication; recipe ghi docs được reviewer Git kiểm, commit thực tế được kiểm ở bước cuối. Phần thêm sau review chỉ là verdict, trạng thái hoàn tất và metadata publication; không thay phạm vi, kết quả hoặc giới hạn kiểm chứng.
