# Đồng bộ worktree docs và giữ phần khác biệt — 25/10/2026

## Yêu cầu và kết quả

Chủ dự án giao đối chiếu 39 file sửa và 920 file untracked trong `D:/Workspace/pos-cafe-docs` với remote, dọn phần đã xuất bản, đồng bộ về docs mới nhất, giữ và báo phần độc nhất; chưa refactor. Quyền mới này cho phép xử lý WIP trong đúng worktree, thay trạng thái chờ dọn của các task trước.

Đã đồng bộ local branch `docs` từ `0fe967d554cecfa7e0cb58d6efa01d64941439ff` sang remote `5cf681db14e72048cee122570fbd828e96baae15` lúc `2026-10-25T10:00:54.0693798Z` (17:00 UTC+7). Ngay sau đồng bộ, HEAD khớp remote và `git status --porcelain=v1 -uall` rỗng: **0 modified, 0 untracked**. Các commit sau mốc này chỉ ghi biên bản và trạng thái liên quan, được review rồi push bình thường; worktree tiếp tục ở local branch docs, theo dõi origin/docs.

## Đối chiếu đủ 959 file

| Phân loại theo byte nội dung | Modified | Untracked | Xử lý |
| --- | ---: | ---: | --- |
| Trùng nguyên byte tại cùng path trên remote | 3 | 877 | Dùng bản đã xuất bản |
| Toàn bộ byte nguồn nằm sau banner trạng thái trên remote | 21 | 41 | Dùng bản remote có banner; không mất SHALL/expected/verdict gốc |
| Trùng nguyên byte tại path lịch sử khác | 0 | 1 | Stitch handoff có bản `stitch-ui-remake-workflow-2026-10-19-history.md` |
| Snapshot local khác remote, giữ riêng | 15 | 1 | Sao nguyên byte ra kho giữ bên dưới, kiểm SHA256 trước khi đồng bộ |
| Tổng | **39** | **920** | **943 bản được bảo toàn trên remote, 16 bản giữ riêng** |

Không gọi cả 16 snapshot là 16 yêu cầu mới chưa triển khai. Phần lớn là core/index/kế hoạch cũ đã được chỉnh lý; giữ vì chưa có bản nguyên byte tương đương trên remote. Không áp đè chúng lên docs mới chỉ để duy trì WIP cũ.

## Phần giữ riêng

Thư mục `D:/Workspace/pos-cafe-docs-retained-20261025` là kho snapshot, **không phải worktree Git**. Có 16 file nguồn, tổng **357.496 bytes logical**, dưới `files/` theo đúng đường dẫn tương đối:

| Bản local giữ nguyên | Bytes |
| --- | ---: |
| `AGENTS.md` | 13.063 |
| `CLAUDE.md` | 21.768 |
| `docs/README.md` | 7.098 |
| `docs/architecture.md` | 19.412 |
| `docs/data-model.md` | 18.818 |
| `docs/features.md` | 26.433 |
| `docs/implementation-log/README.md` | 21.963 |
| `docs/limitations.md` | 19.415 |
| `docs/report-source-map.md` | 18.205 |
| `docs/roadmap.md` | 32.059 |
| `docs/testing.md` | 16.589 |
| `docs/ui-redesign-context.md` | 3.705 |
| `docs/workflow/README.md` | 23.745 |
| `docs/workflow/tasks/README.md` | 53.576 |
| `openspec/README.md` | 21.316 |
| `docs/workflow/tasks/post-integration-standardization-plan-2026-10-25.md` | 40.331 |

[README của kho giữ](D:/Workspace/pos-cafe-docs-retained-20261025/README.md) và [manifest đối chiếu](D:/Workspace/pos-cafe-docs-retained-20261025/comparison.json) ghi SHA256, loại WIP, blob/path remote đủ 959 file. Manifest SHA256: `63e9a541abfdca76e3dcb290149140fbd9dde00df60f0f8306d6996235fe7aeb`. Không xóa kho này trong lượt đồng bộ.

Hai lịch sử Git đã phân nhánh: 43 commit chỉ có local, 40 commit chỉ có remote tại mốc so sánh. Đã tạo local branch **`preserve/docs-pre-sync-20261025`** trỏ đúng `0fe967d554cecfa7e0cb58d6efa01d64941439ff` trước khi đổi local docs. Nhánh giữ lịch sử không được push và không có worktree mới.

Khả năng phục hồi: bản committed cũ còn ở nhánh giữ; 16 snapshot còn nguyên byte trong `files/`; 943 bản còn lại có pinned blob/path trong manifest. Với loại banner, phần cuối blob có đúng số bytes nguồn và SHA256 đã ghi. Không dùng riêng hash thay nội dung phục hồi, không phụ thuộc vào HEAD remote tương lai.

## Cách thực hiện và kiểm sau

Trước thao tác: kiểm manifest/hash đủ959 file, bản giữ16 file, backup ref, HEAD/branch/toplevel/remote/origin/docs đúng mốc; staged và ignored đều rỗng, không reparse point. Toàn bộ935 tracked paths cũ còn trong target; mọi920 untracked path đều đã được target theo dõi. Không có tracked deletion hoặc đường ngoài phạm vi cần xóa.

Sau hai review độc lập APPROVE kế hoạch, fresh checks sát lệnh đạt rồi thực hiện:

```powershell
git -C D:/Workspace/pos-cafe-docs reset --hard 5cf681db14e72048cee122570fbd828e96baae15
```

Exit0, HEAD đúng mốc và status sạch. Không chạy `git clean`, prune, xóa hàng loạt theo glob, xóa branch dự phòng hoặc force-push. Thao tác lấy bản remote thay các bản WIP tại cùng path; các file đã xuất bản trở thành tracked, không bị loại khỏi tài liệu dự án.

Kiểm lại sau thao tác: **943 nội dung published và16 snapshot giữ riêng khớp toàn bộ hash/size, 0 sai lệch**; nhánh giữ vẫn trỏ đúng HEAD cũ. Receipt thực hiện và kiểm sau nằm ở `sync-result.json`, `post-sync-verification.json` trong kho giữ. Không sửa code/DB, chạy runtime/CI, deploy hay refactor; các worktree khác giữ nguyên.

| Free space Windows | Trước đồng bộ | Ngay sau đồng bộ | Chênh lệch |
| --- | ---: | ---: | ---: |
| C | 192.725.803.008 | 192.725.803.008 | 0 |
| D | 98.782.195.712 | 98.717.466.624 | −64.729.088 bytes |

Dung lượng tăng khoảng64,7MB do checkout nhận đủ tài liệu/evidence mới; đây là làm sạch trạng thái WIP, không phải giảm dung lượng worktree. Ước tính trước làm dưới100MB, không cài gói/môi trường. Các số free-space là đo sát thao tác, không là quota kỹ thuật hoặc phép đo độc lập mọi ghi nền.

## Trạng thái danh sách dọn trước

Allowlist877 bản untracked trong task xuất bản đã được giải quyết bằng việc đồng bộ. **Không dùng lại allowlist đó để xóa:** tại worktree hiện hành, các path đó là file tracked canonical. JSON đề xuất giữ danh sách/hash lịch sử nhưng đánh dấu superseded; các checkpoint “39/920 WIP còn nguyên/chưa được dọn” ở hồ sơ cũ chỉ đúng trước task này.

16 snapshot và nhánh giữ lịch sử tiếp tục được giữ để người dùng xem xét. Không có câu hỏi nghiệp vụ mới được tự chốt, không mở công việc refactor hoặc backend acceptance từ kết quả đồng bộ.

## Review

`review_knowledge` và `review_preservation` đều kiểm độc lập đủ959 file, remote,16 snapshot,43 local-only commits/ref và phạm vi reset; cùng APPROVE kế hoạch trước thao tác. Biên bản hậu đồng bộ trên candidate `1c863f9b70d025a33f61cf14af2f04b7a31c3926` đã có hai **APPROVE**, không còn finding chặn:

- `review_preservation`: tự kiểm943 nội dung published và16 snapshot, manifest hash, backup ref, allowlist877 không đổi danh sách/hash nhưng đã superseded, raw receipt/disk và diff7files đúng phạm vi. Không coi số bytes tăng sau sync là thu hồi.
- `review_knowledge`: tự kiểm cùng943+16 nội dung, branch/upstream/cleanliness,16 snapshot không là16 yêu cầu mới, tất cả877path hiện tracked, các pointer tiếp nối và diff-check đạt. Không thay code hoặc mở backend acceptance.

Sau review, commit receipt chỉ bổ sung verdict/status, không sửa nội dung đối chiếu, kho giữ hoặc kết quả reset. Xuất bản bằng push fast-forward thông thường trên docs, không force. Người dùng đã giao dọn/sync; chưa cho xóa16 snapshot hoặc nhánh lịch sử được giữ.
