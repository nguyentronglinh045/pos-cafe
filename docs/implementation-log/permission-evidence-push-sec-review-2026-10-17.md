# SEC review độc lập — push hai nhánh minh chứng, 17/10/2026

**Verdict: APPROVE** trong phạm vi actual publication delta được giao; **không có finding SEC chặn**.

- Reviewer: `publication_final_sec`, không phải tác giả push/helper/candidate; không sửa chúng.
- Candidate: `D:/Workspace/pos-cafe/artifacts/permission-evidence-push-20261017/review-candidate-01/candidate.json`.
- SHA256 được duyệt: `dc6fe5b1316918a3e9369d0da5192b1f0f76bacd84af403a1893d441211a6dee`.
- Nguồn đã SEC duyệt: execution candidate `ab194a70abf7836fb66f0b109903255a8fe6f5ca9ae59629075aad70b46bb67a`; [review hai commit local](permission-git-local-commits-sec-review-2026-10-17.md).

## Quyền và bytes được công khai

Owner đã yêu cầu rõ push đúng hai nhánh evidence và SHA đã chốt, kiểm refs/trigger trước push; chưa merge main, chạy CI, sửa DB hoặc deploy. Snapshot report/invocation ghi đúng quyền này. Không dùng quyền local hoặc review trước để suy ra quyền push. Không có quyền thêm commit/PR, đổi nội dung/provider, force hoặc cleanup.

Đã tự kiểm candidate hash, **11/11 snapshot pins / 29.809 bytes**, source execution candidate hash và actual local Git SHA/tree/parent. Tất cả khớp. Hai actual commit/tree giữ nguyên so với review trước:

| Ref được phép | Commit đã xuất bản | Tree đã duyệt |
| --- | --- | --- |
| `evidence/permission-20261016` | `43921c7ebd957bf926bb45411eed849874ade446` | `50fe1d4fcdd5563a8cdbe794c7035a22c148b574` |
| `evidence/permission-docs-20261016` | `d62aa4b50a44fbbf69796d37d9f0dda62b3cd805` | `bc4027fe7daa4e62dc95e165162c2bc480645a7a` |

Do đúng immutable SHAs, tái dùng privacy review của chính 840 source blobs, hai deletion markers và docs ancestors/24 history paths đã kiểm. Không có bytes/author/message/history mới cần mở lại toàn bộ audit; không nhận mọi history/private/raw đã sạch. Hồ sơ vận hành/reviews ngày17 nằm ngoài hai published commits; không thêm `.env`, credential/private inputs, protected runtime, backup hoặc nhóm raw125.

Đã đọc helper dưới dạng text, không chạy. Invocation dùng đúng hai literal SHA→fully qualified refs, `--atomic --no-follow-tags --recurse-submodules=no`; không force/tags/main/docs/ref thứ ba. Push-result exit0, stdout báo đúng hai new branches, không retry. Tự gọi GitHub GET refs công khai xác nhận cả hai evidence refs đúng SHA, main vẫn `5156820f7d6679cd6f8051bdc38419737ffa0c7e`, docs vẫn `132e9d6cc065459031ee92cfbafcd423b5ac81c5`; không chỉ dựa vào stdout push.

## Trigger và giới hạn chứng minh

Đã đối chiếu before/after receipts và report. Fresh Vercel receipt trước invocation khoảng48giây: đúng project/repo, Preview Branch Tracking OFF, Save disabled, không custom environment/deploy hook, Production matching main. GitHub trước push ghi0workflows/0runs/Pages=false, hai approved trees không có workflow. Không có receipt thay setting hoặc reveal env values.

UI receipts nói rõ **facts chép từ AX quan sát**, không giả là screenshot/DOM export. SEC không thao tác lại provider UI. After receipt giữ Production Ready/main5156820 và docs Preview Error cũ; filter6/7statuses là giới hạn thật. Không dùng Overview một mình để khẳng định mọi trạng thái/provider đều được phủ.

GitHub after receipt có0Actionsruns, hai SHA có0checkruns/0statuses/0deployments, deployment IDs gần nhất giữ nguyên. Aggregate `pending` với `total_count=0`/statuses rỗng không phải job đang chạy hoặc test PASS. Kết luận phù hợp là **không thấy CI/deployment mới tại checkpoint**, không phải bảo đảm không bao giờ có automation. Preview OFF không chặn main/manual/API deploy. Webhooks/provider khác không được nhận đã clear; giữ quyết định owner bỏ bước Locofy, không tự mở lại flow giả định.

Không có lệnh CI/DB/deploy/provider mutation trong helper đã đọc; report không nhận push là application/backend/Linux/UI tests. **NOT_READY_FOR_DEPLOY** và các gate database/contract2 giữ nguyên. Actual remote refs/tree/after-state evidence chi tiết còn được reviewer EVC kiểm độc lập.

## Phương pháp và handoff

Chỉ đọc metadata/source đã bind, Git `--no-optional-locks` với fsmonitor tắt và GitHub GET public refs. Không chạy helper/app/module/test, không đọc env/credential/private/runtime/backup/raw; không provider UI/DB/install hoặc mutation. Chỉ ghi báo cáo này; Node heap256MiB, đọc tuần tự, không tạo môi trường. Evidence8MiB là ngân sách vận hành, không phải quota OS.

APPROVE không cấp thêm quyền merge, commit/push lần nữa, CI, DB, deploy, bật Preview hoặc xóa. Metadata verdict/handoff/task-index/closeout sau freeze có thể bổ sung local ngoài published refs; không đổi candidate/snapshots/commits. Owner vẫn kiểm SHA/diff, chưa được nhận đã nghiệm thu. Khi đủ gate và có lệnh owner mới merge code về main; không merge docs vào main. Thay bytes/ref ngoài phạm vi này phải review delta tương ứng.
