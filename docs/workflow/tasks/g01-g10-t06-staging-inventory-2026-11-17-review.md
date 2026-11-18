# Review — T06 kiểm kê staging mục 9.5, 17/11/2026

Đây là metadata review cho [báo cáo](g01-g10-t06-staging-inventory-2026-11-17.md), bổ sung sau khi hai reviewer trả verdict. Hai subagent không tham gia viết candidate, chỉ đọc, không thay dữ liệu hoặc triển khai. `APPROVE` của reviewer không phải Linh duyệt dọn hoặc nghiệm thu T06.

## Reviewer bằng chứng — `/root/review_evidence`

**APPROVE** — không có finding chặn trong phạm vi bằng chứng và phân loại ca thử.

Reviewer tự đối chiếu danh sách staging bắt buộc với testplan/tasks và xác nhận các ca giai đoạn 2 được tách đúng, không bỏ nghĩa vụ hoặc đánh PASS. TC-92 khóa trên staging được tách khỏi DELETE/ràng buộc chủ trên PostgreSQL cô lập. TC-09 3/3 chỉ là local. FE-01 không gán Inbox ngày 16/11 cho lượt 13/11, và tách đồng hồ giả khỏi quan sát staging. Các lượt chưa đủ `0005/0017/0018` và ca thay thế khớp hồ sơ; đề xuất không bỏ một fixture PASS duy nhất. Reviewer kiểm 93 tham chiếu runtime khớp SHA-256, các neo bằng chứng tồn tại và `git diff --check` đạt.

Giới hạn: không chạy lại DB/browser/test, không xác minh trực tiếp staging. Số liệu mới được đọc từ projection đã khai rõ; không xem nó là backup. Biên bản này được bổ sung sau verdict.

## Reviewer kiểm kê — `/root/review_inventory`

**APPROVE** trong phạm vi kiểm kê và đề xuất giữ/dọn. Không có finding chặn.

Reviewer tự kiểm receipt có 26 số quán duy nhất, 17 owner, 24 active + 2 suspended, 26 Auth gắn quán + 3 Auth rời = 29. Nhóm A đúng `0005/0017/0018`, UUID khớp và giữ 23 quán. Sáu object tổng 340 byte logic; ảnh/registry/asset R07 khớp. Lịch sử ba quán dọn A và ca thay thế, cặp Auth `0024→0025`/`0026→0027`, R07 và placeholder khớp nguồn. Bốn truy vấn chỉ SELECT trong `BEGIN READ ONLY … ROLLBACK`, không có RPC nghiệp vụ/lệnh ghi. Đề xuất chưa thành quyền xóa; 9.5 còn mở. Giới hạn snapshot nối tiếp, metadata ảnh, identity Auth invite và phạm vi backup/dependency/mail/audit/owner chưa duyệt được giữ rõ.

Giới hạn: chỉ review tệp/query và observations đã có, không truy cập lại staging, không kiểm byte ảnh hoặc thử recipe DELETE.

## Candidate cả hai reviewer xác nhận

SHA-256 theo byte tệp. Bốn tệp docs ở worktree `D:/Workspace/pos-cafe-t06-docs-review`; hai tệp evidence ở `D:/Workspace/pos-cafe-t06-pg16-runtime/t06-inventory-20261117`.

| Tệp | SHA-256 |
| --- | --- |
| `docs/workflow/tasks/g01-g10-t06-staging-inventory-2026-11-17.md` | `2903d0e2b3a32d21c1840924a7798c6a56922f40b4d581069fb41c0f754454da` |
| `docs/workflow/tasks/g01-g10-t06-owner-implementation-2026-11-11.md` | `70d8812df9977ad39a8698ad4f0f70f8b3f32eed4d701e9214b9fdade95a0e74` |
| `docs/workflow/g01-g10-plan.md` | `7c1e81cf3caf39874ecd5877e55a52824b702a2f6056837475eb264005c09e34` |
| `openspec/changes/add-owner-account-and-store-provisioning/tasks.md` | `99cae2b156fc164a990647b826a6356cb85360ac004170ca7b4ade9f51f3b9ad` |
| `readback.json` | `fc5ecc8815897ddcd3223946699d5e68fabef2f9b6325d41632855575fd78f0b` |
| `queries.sql` | `b3d6b6b5e431b1c43190b24a8c60a3085996739c3e483ed16f09c6fec94d1202` |

Không có finding chặn cần sửa. Root chạy `git diff --check` và `openspec validate add-owner-account-and-store-provisioning --strict`, cùng exit 0. Hash-audit được ghi tại `t06-inventory-20261117/hash-audit.json`: 93 tham chiếu khớp, là kiểm toàn vẹn evidence chứ không chạy lại ca thử. Không commit/push, không sửa ứng dụng hoặc dữ liệu staging. Dừng ở quyết định phạm vi cần Linh chốt.

## Review cập nhật trước dọn, 17/11/2026

Hai reviewer độc lập **APPROVE** [checkpoint chuẩn bị](g01-g10-t06-cleanup-preflight-2026-11-17.md). Reviewer bằng chứng đối chiếu ca thay thế, ảnh hưởng tra trạng thái và điều kiện có thể phát OTP mới. Finding về mô tả chung của runner đã được sửa. Bản cuối ghi `smoke:supabase` ở candidate vẫn gọi luồng tạo qua UI cũ, chưa chạy lại trong lượt này. Reviewer kiểm kê đối chiếu SQL chỉ đọc, phạm vi 183 tổ hợp, khóa ngoại, trigger owner, quota, số liệu và xác nhận delta câu smoke. Hai verdict chỉ áp dụng cho checkpoint chuẩn bị. Recipe xóa, backup/restore và quyết định của Linh còn mở.

| Tệp | SHA-256 candidate cập nhật |
| --- | --- |
| `g01-g10-t06-cleanup-preflight-2026-11-17.md` | `4a82c821bdd2677b958191f78a35ee48fb5b0cf3b29b4c34c83e2d5518f5eb61` |
| `g01-g10-t06-owner-implementation-2026-11-11.md` | `e3212ece8c6389d107073c7ee34e68a0e98422cce1fc36a2ec88b7f6e25953d2` |
| `g01-g10-plan.md` | `b276aa83d1b198478a55ce427f88ca3fdd345cb880c2a5f398426cf61d3b28d2` |
| `cleanup-dependencies.json` | `a8ce442976d47a19d7ec132ad3d4f6f32265c22010208ab3b187ce971e402fcb` |
| `cleanup-dependencies.sql` | `7ac110b8deafffa6bd26305576ed890b64178bcd8b57c690f390802fd5e3b125` |

## Review ghi quyết định giữ quán, 17/11/2026

`/root/review_evidence` **APPROVE** phần ghi quyết định. Reviewer xác nhận ba quán giữ đúng ý Linh, chỉ tạo fixture khi ca sau cần, bước dọn trong checklist 9.5 chưa thực hiện và các link quyết định hợp lệ. Finding về câu còn chờ chọn trong kế hoạch và mô tả thì hiện tại của phương án cũ đã sửa và được reviewer xác nhận. Review này chỉ kiểm tài liệu local. `git diff --check` và OpenSpec strict đạt.

| Tệp | SHA-256 sau khi ghi quyết định |
| --- | --- |
| `g01-g10-t06-cleanup-preflight-2026-11-17.md` | `3894c3d4170652b341dcc57cfdbcc2316281019dc2c8426edaf4995d6ae6f902` |
| `g01-g10-t06-staging-inventory-2026-11-17.md` | `be6205dc104f53512d9694cd64b7a7563b6e5fa06bb0440e64953c2085a127e0` |
| `g01-g10-t06-owner-implementation-2026-11-11.md` | `3fa97362adc871f1383c2674d8382dd709a8631ae6b8c74af5608cb4612a3829` |
| `g01-g10-plan.md` | `81093fefb6dc1123aee54d15154215869388f02818569a5317e9af443c3382fb` |
| `tasks.md` | `eac6ac46f28cbbee13e224f3f0619a18143c796ab7ca9718df7bdfdbd4cb6cc7` |

## Review đối chiếu việc còn lại của T06, 17/11/2026

`/root/review_evidence` **APPROVE** [mục đối chiếu](g01-g10-t06-owner-implementation-2026-11-11.md#t06-con-lai-2026-11-17) và đoạn dẫn trong kế hoạch. Reviewer xác nhận mục 7, dấu kiểm 9.x, mục 10, giới hạn bằng chứng 8.8, REQ-OWNER-16 và nguyên nhân CI chưa xác định. Không có finding chặn. Review chỉ đọc local. Diff check và OpenSpec strict đạt.

- Hồ sơ T06 có SHA-256 `3b36c724e257025c6adff0fc62c841ac945e151fa3b39e5a254e9553bcd28177`.
- Kế hoạch G01–G10 có SHA-256 `a576870697e52d4ad417aadd914a834644c8c8dd2c53fa5023677c1e2fd57719`.

## Review đồng bộ tài liệu và checklist, 17/11/2026

Hai subagent khảo sát nguồn cho nhóm 0–9. Hai reviewer độc lập **APPROVE** phần [cập nhật tài liệu và đối chiếu](g01-g10-t06-owner-implementation-2026-11-11.md#t06-doi-chieu-tai-lieu-2026-11-17). `/root/review_evidence` kiểm mục 10.1–10.5, nguồn Git, lược đồ, giao diện, Auth và ranh giới kiểm chứng. Reviewer xác nhận đã sửa neo giao dịch ghi quán và câu dễ hiểu nhầm recovery live đã nghiệm thu. `/root/review_inventory` kiểm mục 10.6–10.7, trang testing, checklist, hồ sơ và kế hoạch. Reviewer xác nhận đã đưa 0.3 về mở và bỏ câu cũ nói mục 10 chưa xong. Các verdict chỉ áp dụng cho delta tài liệu. Không có finding chặn còn mở.

Root kiểm 72 liên kết local trong phần cập nhật, 50 dấu mới có bằng chứng lịch sử và 7 mục tài liệu. OpenSpec strict và `git diff --check` đạt. Không chạy runtime ở lượt này.

| Tệp | SHA-256 candidate được duyệt |
| --- | --- |
| `docs/requirements.md` | `9b04dc7f9faea825d21bb937eb16f0fb644f0e7f3f00c21adbee4d7718c2d9d7` |
| `docs/architecture.md` | `726a66bce91022d9237d71da6e1f5b7ac5dcd873578f838b45fbc6b472f70c61` |
| `docs/data-model.md` | `a70f89c553b61200cbdb9e3af51c38fc048ea2fc8104f9a0b8a2452d160ea7c8` |
| `docs/screens.md` | `5e6dbfdb046747dc8015c16a0455526b545eb9e306bfbfe0bbf1a76907499d69` |
| `docs/limitations.md` | `4c281908bf645657e6db8ce4ea30df60b01cd20d8659decbb75e4cd4cc2763d5` |
| `docs/features.md` | `5abdae4d2ff992fca9790c881453034bf7a6ce14c19e05d64cc9f818ffc998e0` |
| `docs/roadmap.md` | `8a5d099c8dcb7b7f53aac9c798c21fc2fa7406c89f1e5ab1323f53a526b13f1f` |
| `docs/testing.md` | `78f3ff0c283f4e6b24d0668becea7a04f9d1e5eb86e249bed54de2de71a9e809` |
| `pos-cafe-context.md` | `6980d994af41cae0b33a640b6415af7353ade9395e3489d7d6bf10a2a7023415` |
| `openspec/changes/add-owner-account-and-store-provisioning/tasks.md` | `6d5ddaf36a7712989912c67b03084ca1cea7d23f4eb67994deb3d089e1ed7de9` |
| `docs/workflow/tasks/g01-g10-t06-owner-implementation-2026-11-11.md` | `c04ddaeae17af67a734ed4ee5b97a1f548e0efc397a6d29d5a5c72e154cddb73` |
| `docs/workflow/g01-g10-plan.md` | `0b8830de3a8c684a562667460d9d55c4070894579e69c4764c5ab74f1c719b28` |

## Review đóng 9.5 và đối chiếu 8.7–8.8, 17/11/2026

- `/root/review_evidence` **APPROVE** phạm vi đóng 9.5. Ngoại lệ chỉ áp dụng lượt 17/11 và đúng ba quán Linh cho giữ. Testplan giữ quy tắc dọn chung. 8.7–8.8, 0.3 và gate toàn T06 vẫn mở.
- `/root/review_inventory` **APPROVE** cách diễn giải biên nhận lịch sử và phép đọc staging mới. Hai hash gốc cutover và quán `0004` khớp. Số đếm fixture và cổng xác thực khớp truy vấn và nguồn. Diễn tập PostgreSQL cô lập, kiểm catalog hosted và xác thực Store Key hosted được phân biệt rõ. Verdict duyệt báo cáo, 8.7–8.8 vẫn thiếu các phép kiểm ghi trong hồ sơ.

Hai reviewer đọc local và không chạy runtime. Root xác minh `git diff --check`, OpenSpec strict, mục 9.5 có dấu và các mục 0.3, 8.7, 8.8 còn mở.

| Tệp | SHA-256 |
| --- | --- |
| `tasks.md` | `08be1e1672cea4ab5b079d3b61fa99ef5916f4f23b9d4722032067127289850b` |
| `testplan.md` | `55afe3f2dedc4c27a3e834dd3155fd9578b385882a0d1c7ddaa8b0c5a72b16a1` |
| `g01-g10-t06-cleanup-preflight-2026-11-17.md` | `79ba90a93ff30174be7f5527cf36f3cc08688bfe993eba8848a51e365a568fb7` |
| `g01-g10-t06-staging-inventory-2026-11-17.md` | `630e055393b3be1fdc6bcf0a00588601c8aab838a87567081eb79edc0ed00537` |
| `roadmap.md` | `1687d67eb0fc4f69f13b58d606ccacb5ab91e3e34d0bcce661d8c85aecedc1d7` |
| `g01-g10-plan.md` | `da3d6d2ffb7b0494ff089eeee10d4fa124c93f5d8da15e465aaa7cd1b3f15052` |
| `g01-g10-t06-owner-implementation-2026-11-11.md` | `2011bb8d8e7054b612d90cca04dd357474b296a2f3647a2c48e18d1b4fce61e7` |
| `cutover-87-88-readback.json` | `b47a9510d9dec47b4be43d65d373bb9e3169f2c307f2c47d035baf45dd79fbf4` |
| `cutover-87-88-readback.sql` | `587b5e93752717d3a26370bca044e6720bbacc16f2104587d6b1ed659f4e8067` |

## Review bằng chứng bổ sung 8.7–8.8 và 0.3, 17/11/2026

- `/root/review_evidence` **APPROVE** 8.7 sau khi đồng bộ bảng tình trạng và ghi lỗi trình chạy. Receipt, SHA-256 ảnh sơ đồ và phạm vi frontend local nối staging khớp. Xác nhận ba lần thử Store Key và ba lần làm mới phiên 8.8 dùng đúng fixture hoặc phiên backup và đều bị Auth từ chối.
- `/root/review_inventory` đối chiếu các dấu vết UI/API ngày 23/10 và T05 ngày 11/11. Xác nhận đã giữ phiên demo của `0001` lúc bàn giao cho Linh, và từng gỡ ghép `0003`. Xác nhận 0.3 có đủ bằng chứng mock, T05, TC-104 và 1c.5 khi bổ sung chứng cứ 8.7–8.8. Điều kiện sao lưu khóa trước cutover ở 8.4 không áp dụng khi lược đồ cũ chưa có khóa.
- Linh được báo trong chat rằng tab hoặc máy từng ghép `0001–0003` cần gỡ ghép và dùng Store Key hiện hành. Phạm vi báo dựa theo người dùng demo đã xác định. Hai reviewer xem hồ sơ và kết quả đã lọc.

| Bằng chứng | SHA-256 |
| --- | --- |
| `cutover-87-demo.result.json` | `149e4bcec7664a1c8b9193d1c44c03bc4cc4825ef733143290620948e5ff1b67` |
| `cutover-87-demo-floor.png` | `59228e71826f4f8f9d56a6370ae9273c33c19da9a430834272de146652cefb91` |
| `cutover-88-old-keys.result.json` | `b5264db76184e5aaf32478b791ded7068458bd1fd2b743e3b965abaa375455fc` |
| `cutover-88-archived-sessions.result.json` | `b78f919b1114eac206644ff4aec685232ea0075656d732eb8899ec135a52a632` |

## Review smoke mục 7.5 trên staging, 17/11/2026

- `/root/review_evidence` **APPROVE** phạm vi đủ năm ca và khớp contract. Bản cuối register trước execute, dùng probe topic `orders`, xác nhận đơn mới trước ghi và giữ đúng UUID qua các phép kiểm UI/RPC.
- `/root/review_inventory` **APPROVE** phạm vi xác thực và dọn dữ liệu. Đã đối chiếu chặn ảnh/context lỗi chứa credential, ràng buộc hoàn nguyên thu ngân vào request ID và audit thực, cùng hướng dọn đúng phiên và đúng đơn do test tạo.
- Root đối chiếu báo cáo Playwright 5/5 trên đúng quán `0004` và hậu kiểm 0 đơn mở, cashier overrides `null`, cổng Vite đã đóng. Đã đề nghị Linh đối chiếu cách ghép, định danh đơn và hoàn nguyên quyền qua liên kết code trong bàn giao. Chờ Linh tự kiểm.

| Tệp | SHA-256 |
| --- | --- |
| `tests/supabase/pos-cafe-supabase.spec.ts` | `4bbd1f946a76549b4309062df30b67803e43f4f36f5b60c0f67e8f5c5257b60a` |
| `package.json` | `fb5d191911b9a93b84a8b1da1096221fe7ec59705522e11dc0395932dab67eb9` |
| `scripts/permission-realtime-probe.mjs` | `f78b2d9801a405f0f669adc4002e99b4f284df625475981f30cf67c4eb4fb22b` |
| `smoke-75-20261117T151240584Z.playwright.json` | `92f95c42000653e3139351a7bc78cc725cc5e1ef258666c7235c9d57d58abdd3` |
| `smoke-75-20261117T151240584Z.preflight.json` | `e7a0a4e5d0e1d23e182c3e040b6ca21451c242356f27f7f1feb3b3bd05c8467c` |
| `smoke-75-20261117T151434876Z.preflight.json` | `2e9200d4f7507a672223a2e940f3f8249da5f5ffe2bb0243ab3194aa8467cb25` |

## Review gói SQL/Edge và hồ sơ còn lại ngày 18/11/2026

`/root/review_evidence` **APPROVE** nguồn sáu tệp SQL/Edge theo đúng hash trong checkpoint và manifest. Các guard lỗi, giữ suất, trạng thái sau rollback và ACL của RPC mới khớp phạm vi đã kiểm. Reviewer đối chiếu thêm các kết quả local ngày 18/11 gồm ba test chính với hai bước con, 12 ca hồi quy và một ca tranh sweep. [Checkpoint và nguồn](g01-g10-t06-owner-implementation-2026-11-11.md#t06-backend-pr-2026-11-18).

`/root/review_inventory` **APPROVE** hồ sơ WIP 18 tệp theo phạm vi bằng chứng và trạng thái. Các mục gỡ luồng cũ giữ mở, phạm vi 7.5 và ngoại lệ giữ fixture được ghi đúng. 173 liên kết relative mới hoặc đổi và anchor đã đối chiếu trong bộ hồ sơ. Các phần trùng PR #31 được hợp nhất khi dựng nhánh PR mới.

Hai reviewer **APPROVE** cập nhật một pin `package.json` ở PR #30. Hash canonical khớp nguồn Git; cờ production và các guard phát hành giữ nguyên. Phép kiểm pin đạt 2/2 trên máy. Reviewer đọc local và đối chiếu biên nhận đã lọc.

| Biên nhận local ngày 18/11 | SHA-256 |
| --- | --- |
| `backend-pr-20261118-source.json` | `26c84fb82285c2b15952c22456654fe6ccc3f5958bca1afed9fa8ca67114179b` |
| `backend-pr-20261118-regression.result.txt` | `f57eef364553e60a5583489ed1cd31697a8bb6823773e4ced03e951e561db6f3` |
| `backend-pr-20261118-mail-contention.result.txt` | `6af647a57e203e3b891735bc80793d2c9b21d56387dae4b778b2c33c7dd978fc` |
