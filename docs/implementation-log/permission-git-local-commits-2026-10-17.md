# Hai nhánh và hai commit minh chứng đã tạo local — 17/10/2026

## Quyền và kết quả thực tế

Owner giao: “Tiếp tục tạo hai nhánh và hai commit local theo gói đã chốt, rồi đưa SHA/diff để tôi kiểm tra. Chưa push, chạy CI, sửa database hay deploy. Có gì cần quyết định thì hỏi và đợi tôi trả lời.” Quyền này bao phủ tạo hai light worktree/nhánh, áp dụng đúng export đã review, stage allowlist và commit bình thường. Không có quyết định nghiệp vụ/dữ liệu/chi phí mới cần owner chốt trong lượt thực hiện này.

Gói nguồn đã duyệt: candidate SHA256 `abbad7c6d1a77808ccea99076b62bf4667528fd25359cd81462c7cf6c0f0f889`, 842 entries = 509 code + 333 docs, 840 text files/8.267.924B + 2 deletion markers. [Kế hoạch trước](permission-git-publication-local-2026-10-17.md). Không mở rộng gói hoặc thêm hồ sơ vận hành ngày17 vào commit đã chốt.

| Nội dung | Code | Docs |
| --- | --- | --- |
| Nhánh local đã tạo | `evidence/permission-20261016` | `evidence/permission-docs-20261016` |
| Commit SHA | `43921c7ebd957bf926bb45411eed849874ade446` | `d62aa4b50a44fbbf69796d37d9f0dda62b3cd805` |
| Parent | `5156820f7d6679cd6f8051bdc38419737ffa0c7e` | `e47862b1dfed68d783dc07a2a1fd51ecdabc1b19` |
| Tree | `50fe1d4fcdd5563a8cdbe794c7035a22c148b574` | `bc4027fe7daa4e62dc95e165162c2bc480645a7a` |
| Commit subject | `feat(permissions): add catalog and enforcement` | `docs(permissions): record specs and verified progress` |
| Thay đổi so với parent | 509 paths: 385 ADD / 122 MODIFY / 2 DELETE | 333 paths: 313 ADD / 20 MODIFY |
| Dòng thêm/xóa | +62.159 / −2.109 | +18.852 / −475 |
| Worktree mới | `D:/Workspace/pos-cafe-evidence-code` | `D:/Workspace/pos-cafe-evidence-docs` |

Đây là đúng hai commit mới; nhánh docs còn chứa hai ancestor local đã có `9937f1f005f1569b0e348374b37cc95d8b490ca5` và `e47862b1dfed68d783dc07a2a1fd51ecdabc1b19`. Không squash/amend/viết lại lịch sử. Hai worktree mới sạch sau commit. Checkout gốc vẫn trên main/docs với HEAD, raw index SHA và staged-entry SHA giữ nguyên; 0 staged path tại checkout gốc. Thay đổi chưa commit ngoài gói, năm docs gốc trộn nội dung, temp và private/runtime vẫn giữ nguyên.

## Diff để owner kiểm tra

- Code: [full patch](D:/Workspace/pos-cafe/artifacts/permission-git-local-commits-20261017/main.patch), [diffstat](D:/Workspace/pos-cafe/artifacts/permission-git-local-commits-20261017/main.stat).
- Docs: [full patch](D:/Workspace/pos-cafe/artifacts/permission-git-local-commits-20261017/docs.patch), [diffstat](D:/Workspace/pos-cafe/artifacts/permission-git-local-commits-20261017/docs.stat).
- [Receipt SHA/tree/parent/counts và remote sau commit](D:/Workspace/pos-cafe/artifacts/permission-git-local-commits-20261017/actual-diffs.json).

Patch là diff **mỗi commit mới so với parent trực tiếp**, không gộp hai ancestor docs cũ. Nội dung export bằng Git với external diff/textconv và rename detection tắt, không chạy module hoặc nội dung patch. Các lệnh đọc tương đương, không cần đổi checkout:

```powershell
git -C D:/Workspace/pos-cafe --no-pager diff --no-ext-diff --no-textconv --no-renames 5156820f7d6679cd6f8051bdc38419737ffa0c7e 43921c7ebd957bf926bb45411eed849874ade446 --
git -C D:/Workspace/pos-cafe --no-pager diff --no-ext-diff --no-textconv --no-renames e47862b1dfed68d783dc07a2a1fd51ecdabc1b19 d62aa4b50a44fbbf69796d37d9f0dda62b3cd805 --
```

Walkthrough đề xuất: catalog/ports/adapters → PermissionLifecycle/wiring và hai hook cũ bị bỏ → UI/tests → SQL/Edge candidate còn gate → specs/portable progress evidence → năm docs curated và 48 excluded deltas. Owner đang được giao SHA/diff để kiểm; chưa nhận đã đọc hoặc nghiệm thu.

## Kiểm chứng thực thi và chẩn đoán LF/CRLF

Preflight kiểm lại exact candidate/snapshot/export hashes, execution input files, Git config/attributes/hooks/author privacy, parent/remote bases, nhánh và directory chưa tồn tại, C/D reserve. Git hiện 2.54.0.windows.1, core.autocrlf=true, không active hook/custom attributes/commit signing cấu hình; author dùng GitHub noreply, không ghi giá trị email vào receipt. Không đổi các bảo vệ đó.

Lượt tạo worktree code đầu tiên dừng trước stage/commit tại guard deletion: helper so raw worktree SHA với HEAD SHA đã pin, chưa tính checkout CRLF. Giữ partial worktree; không reset/xóa/tạo nhánh thay thế. Chẩn đoán chỉ đọc xác nhận cả hai HEAD blobs đúng SHA/size đã duyệt; file checkout chỉ khác LF→CRLF và `hash-object --path` của chúng khớp đúng parent blob OID. [Receipt](D:/Workspace/pos-cafe/artifacts/permission-git-local-commits-20261017/deletion-eol-diagnosis.json).

Sửa chi tiết kiểm guard: đối chiếu SHA của HEAD bytes và blob OID của worktree qua Git conversion. Resume chỉ worktree code đã tạo, đúng nhánh/parent, index chưa stage; từng dirty path partial phải nằm trong allowlist và khớp frozen payload SHA. Không đổi source, deletion identity, expected trees hoặc acceptance. Sau đó copy đủ export, `git rm` đúng hai path trong worktree code, stage literal NUL allowlist 507/333 files. Không dùng blanket add, reset/stash/force, commit-tree hoặc bypass hook.

Trước mỗi commit, so full staged path/mode/blob set và `git write-tree` với planned tree: cả hai khớp. Dùng normal `git commit --file` với hai message đã chốt. Sau commit kiểm parent/tree và worktree clean; so lại HEAD/index hai checkout gốc. Full patches có SHA/bytes trong receipt để reviewer tính lại.

Không chạy lại app/Windows/Linux/backend/UI tests; đây là kiểm **đóng gói và commit đúng nguồn**, không thêm runtime PASS. Privacy review đã có chỉ bao phủ bytes/history đã chọn; actual commit phải giữ đúng các blob đó. Khả năng phát hành vẫn **NOT_READY_FOR_DEPLOY**: actor/scope metadata probe lịch sử không phải schema/contract2 compatibility. Không dùng credential hoặc gọi lại DB probe, không sửa Supabase/Edge/env/Vercel.

Sau hai commit, `ls-remote` chỉ đọc xác nhận remote main/docs vẫn ở base trước; hai evidence refs vẫn chưa có trên origin tại checkpoint. Không push, chạy CI hoặc deploy. Preview OFF giữ bằng chứng lịch sử ngày16; chưa kiểm lại provider ngày17 vì chưa push. Trước eventual push vẫn cần lệnh riêng và kiểm lại đúng Preview OFF/ref/trigger.

## Tài nguyên và handoff

Không cài/tải dependency/runtime/browser/image, không thêm môi trường kiểm thử nặng. Hai worktree mới tổng **26.069.205B logical** (gồm file `.git` con trỏ), hồ sơ diff ban đầu khoảng8,08MB; dùng chung Git object store. Kích thước logical không phải dung lượng thực allocated; biến động free disk có thể gồm process khác. C/D sau export còn199.547.609.088/102.751.031.296B, đều trên30GiB. Ngân sách vận hành lượt này đỉnh128MiB trên D; hồ sơ execution/diff tối đa16MiB. Node heap256MiB, thao tác Git tuần tự; không tuyên bố quota OS.

Lưu hai worktree và patches để owner review, chưa hết nhu cầu; không tự dọn. [Resources receipt](D:/Workspace/pos-cafe/artifacts/permission-git-local-commits-20261017/resources.json). Local execution candidate phải được SEC/EVC review exact SHA/trees/patches trước handoff hoàn tất; review không cấp quyền push/deploy.

Nhắc merge: khi đủ gate phát hành và có lệnh owner, **merge nhánh code minh chứng về main**; docs giữ luồng riêng, **không merge docs vào main**. Chờ owner kiểm SHA/diff và lệnh tiếp; không tự tạo commit thứ ba, amend hoặc push. Báo cáo/handoff/reviews mới vẫn là hồ sơ local ngoài hai commit vừa tạo.


### Metadata review cuối — thực thi local hoàn tất

SEC và EVC cùng APPROVE exact execution candidate `ab194a70abf7836fb66f0b109903255a8fe6f5ca9ae59629075aad70b46bb67a`, không finding chặn. [SEC](permission-git-local-commits-sec-review-2026-10-17.md), [EVC](permission-git-local-commits-evc-review-2026-10-17.md). Actual parents/trees/840blob-modes/messages,509/333pathsets và cả8diffoutputs đã được đối chiếu độc lập. Hai commits/patches/snapshots không đổi.

EVC-LC-N1 không chặn: field lịch sử `actual-diffs.json.patchBytes` là tổng8outputs **8.051.800B**; riêng2fullpatches **7.899.140B**, auxiliary152.660B. Giữ nguyên receipt đã freeze; từng patch bytes/hash là căn cứ khi đọc nội dung. [Closeout local](D:/Workspace/pos-cafe/artifacts/permission-git-local-commits-20261017/closeout.json) ghi rõ ba metric và review hashes. Handoff hoàn tất trong phạm vi local; owner chưa nghiệm thu/push. Metadata này ngoài hai commits; không amend hoặc tạo commit mới.
