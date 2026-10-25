# SEC review độc lập — hai commit minh chứng local, 17/10/2026

**Verdict: APPROVE** exact execution candidate trong phạm vi SEC đã giao. Không có finding SEC chặn.

- Reviewer: `publication_final_sec`, không phải tác giả candidate/commits/helper; không sửa chúng.
- Candidate: `D:/Workspace/pos-cafe/artifacts/permission-git-local-commits-20261017/review-candidate-01/candidate.json`.
- SHA256 được duyệt: `ab194a70abf7836fb66f0b109903255a8fe6f5ca9ae59629075aad70b46bb67a`.
- Source package đã SEC APPROVE trước đó: `abbad7c6d1a77808ccea99076b62bf4667528fd25359cd81462c7cf6c0f0f889`; review gốc: [SEC publication plan](permission-git-publication-local-sec-review-2026-10-17.md).

APPROVE áp dụng cho việc đã tạo đúng hai nhánh/hai commit **ở local** và trình SHA/diff. Không cấp quyền push, CI, DB/provider/deploy, cleanup, amend hoặc tạo commit bổ sung.

## Quyền và cách kiểm

Task giao review ghi owner đã yêu cầu tạo hai nhánh/hai commit từ gói đã duyệt và trình SHA/diff, tiếp tục cấm push/CI/DB/deploy. Snapshot `016-permission-git-local-commits-2026-10-17.md` và `012-preflight.json` ghi cùng ranh giới; không dùng plan cũ hoặc verdict reviewer để tự tạo quyền thực thi.

Đã đọc candidate, report/handoff, preflight, receipts, deletion diagnosis và source hai helper trong snapshots; không chạy helper. Đã tự hash snapshots/patches, đọc metadata Git thực của hai commit, so tree/path/mode/blob với manifest cũ. Metadata author/committer được kiểm trong bộ nhớ và chỉ xuất boolean; không lưu hoặc in giá trị identity. Đã dùng Git `--no-optional-locks`, tắt fsmonitor cho lệnh đọc; không ghi Git object/index/ref hoặc dùng `hash-object -w`.

Không chạy app/tests/modules, network, DB, browser, provider hoặc cài gói; không đọc .env/credential/private inputs/protected runtime/backups/raw bị loại. Chỉ ghi báo cáo này. Node heap 256 MiB; đọc tuần tự, không thêm môi trường kiểm thử. Ngân sách evidence16MiB của root là giới hạn vận hành, không phải quota OS.

## Kết quả độc lập

1. **18/18 snapshots / 194.514 bytes** và **2/2 full patches / 7.899.140 bytes** khớp SHA256/kích thước candidate. Candidate SHA khớp cả đầu và cuối review. Candidate/manifest/plan nguồn cũ khớp cả ba pins đã bind, không thay source package sau review.
2. Git object thực xác nhận:

| Nhánh | Actual commit | Parent đúng kế hoạch | Tree đúng gói SEC đã review |
| --- | --- | --- | --- |
| `evidence/permission-20261016` | `43921c7ebd957bf926bb45411eed849874ade446` | `5156820f7d6679cd6f8051bdc38419737ffa0c7e` | `50fe1d4fcdd5563a8cdbe794c7035a22c148b574` |
| `evidence/permission-docs-20261016` | `d62aa4b50a44fbbf69796d37d9f0dda62b3cd805` | `e47862b1dfed68d783dc07a2a1fd51ecdabc1b19` | `bc4027fe7daa4e62dc95e165162c2bc480645a7a` |

3. Cả hai branch refs trỏ đúng actual commit. Mỗi commit có đúng một parent. Actual diff so với parent có đúng **509 code / 333 docs paths**, không extra/missing so với manifest. **507 code + 333 docs blob/mode** khớp chính xác `gitBlobOID`/mode đã SEC duyệt; đúng hai code deletions vắng khỏi actual tree. Full tree OID cũng khớp expected tree, giữ nguyên baseline ngoài delta. Không có extra payload/private input hoặc mở rộng docs sang main.
4. Actual commit message bytes khớp hai SHA đã duyệt: code `1fb2948f15c849fad80e2d4d7f9ec17017fc028d4e407a0377c2936455e924eb`, docs `a8570f31e88b56b1d97d1ccbe919dfde1eca77e92f55e8705d112eaa25524ac3`. Không chỉ dựa vào SHA của file message trên receipt.
5. **Author và committer thực tế của cả hai commit đều dùng GitHub noreply**, khớp identity đã cấu hình và khớp nhau; chỉ ghi kết quả boolean. Không thấy giá trị email author/committer bị chép vào 18 metadata snapshots hoặc hai patches. Identity vẫn tồn tại trong Git commit theo bản chất thao tác owner đã giao; đây không phải tuyên bố Git commit không có author metadata.
6. Vì 840 actual blob IDs/modes và hai full trees không đổi so với source package đã kiểm, tái dùng kết quả privacy có phạm vi trên đúng bytes đó. Parent docs không đổi nên hai local ancestors/24 path/44 history records đã kiểm trước cũng giữ nguyên. Không suy từ đó thành audit toàn ứng dụng/toàn lịch sử hoặc chứng nhận không thể có secret ẩn.

## Guard LF/CRLF và ranh giới thực thi

Diagnosis snapshot xác nhận hai HEAD SHA/kích thước đúng pin, canonical blob đúng parent và chỉ khác checkout LF→CRLF; trạng thái lúc chẩn đoán còn 0 staged paths, chưa commit. Đã đọc qualified-resume trong helper: chỉ cho worktree code đã có, đúng branch/parent, index chưa stage, mọi partial dirty path phải trong allowlist và khớp frozen export; không reset/xóa worktree để vượt gate. Guard cuối kiểm HEAD bytes và canonical blob identity trước đúng hai `git rm`, rồi full staged set/tree phải khớp.

SEC không chạy lại lỗi đầu hoặc helper resume; bằng chứng là diagnosis/prepared/committed receipts, source guard và actual immutable commits. Hai actual trees giữ nguyên chứng minh cách xử lý EOL không đổi publication scope/deletion identity/source acceptance. Đây là sửa phép so bytes theo Git conversion trong quyền đã giao, không mở quyền DB hoặc thực thi nghiệp vụ mới.

Helper chỉ có thao tác local worktree/copy/allowlist-stage/normal commit và đọc refs; không chứa lệnh push, CI, DB/provider/deploy. Preflight kiểm hook/config/attributes/signing và author privacy, không vô hiệu bảo vệ. Receipts trước/sau giữ HEAD/index checkout gốc; kiểm đầy đủ original/worktree/patch correspondence thuộc reviewer EVC. Remote receipt trước/sau ghi main/docs giữ base, hai evidence refs chưa có. SEC không gọi mạng để kiểm lại remote/provider hiện tại; không tuyên bố remote không thể thay đổi sau checkpoint.

Thông tin dung lượng gửi EVC: field `patchBytes=8.051.800` trong actual-diffs receipt là accumulator cho patch+stat+numstat+name-status; hai patch pins riêng tổng7.899.140B, auxiliary outputs152.660B. SEC dùng hai pins riêng khi kiểm nội dung và không suy thêm payload từ tên field tổng này.

## Giới hạn và điều kiện tiếp theo

Report giữ đúng **NOT_READY_FOR_DEPLOY**; không nhận việc tạo commit/hash/diff là app/Windows/Linux/backend/UI tests mới. Metadata probe lịch sử không được nâng thành schema/contract2 compatibility, không được gọi lại từ review này. Preview OFF vẫn là bằng chứng ngày16, chưa có fresh provider check ngày17. Eventual push vẫn cần lệnh riêng và kiểm lại đúng Preview OFF/refs/automation; OFF không chặn mọi dạng deploy.

Hai commit/patches giữ local để owner đọc; chưa nhận owner đã xem hoặc nghiệm thu walkthrough. Không merge docs vào main; merge code chỉ sau đủ gate và có lệnh owner. Review metadata/handoff/task-index/closeout sau freeze chỉ hợp policy khi ngoài hai actual commits và không đổi candidate/snapshots/patches/Git objects. Thay nội dung phải review delta; APPROVE này chỉ gắn exact hash nêu đầu báo cáo.
