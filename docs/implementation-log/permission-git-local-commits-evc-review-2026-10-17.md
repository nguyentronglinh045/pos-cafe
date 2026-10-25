# Review EVC độc lập — hai commit LOCAL thực tế, 17/10/2026

- Reviewer: `publication_final_evc`, không tham gia tạo helper, candidate hoặc hai commit.
- Verdict: **APPROVE** trong phạm vi thực thi hai commit local đúng gói đã duyệt.
- Candidate: `D:/Workspace/pos-cafe/artifacts/permission-git-local-commits-20261017/review-candidate-01/candidate.json`.
- Candidate SHA256: `ab194a70abf7836fb66f0b109903255a8fe6f5ca9ae59629075aad70b46bb67a`.
- Quyền được đối chiếu: owner yêu cầu tạo hai nhánh/hai commit local và trình SHA/diff; chưa cho push/CI/DB/deploy, amend, commit thứ ba hoặc cleanup.
- Scope: actual parent/tree/blob/mode/message/path set, patches/stats, checkout/ref invariants, chẩn đoán deletion CRLF, tính đúng của report/handoff và giới hạn evidence/resource. Không mở lại full backend/application acceptance.

## Nguồn và cách kiểm

Áp dụng quy trình/review gate tại `D:/Workspace/pos-cafe-docs/AGENTS.md` và `docs/workflow/README.md`; đọc candidate, 18 snapshot, report/handoff, preflight/prepared/committed receipts, diagnosis và hai helper dưới dạng văn bản. Không chạy helper hoặc module trong package.

Tính lại SHA candidate, đủ 18 snapshot và source metadata: **0 mismatch**, tổng snapshot **194.514 B**. Hai patch đúng SHA/bytes đã pin. Source package candidate `abbad7c6d1a77808ccea99076b62bf4667528fd25359cd81462c7cf6c0f0f889`, manifest `ec05b82acd77ca8ee88932b9af471c2bd92ca5d16f99c3aaca34aa4422cd0ed2` và plan `5b1c1ab325c3ebf26aca6e23dab882ee59478f38413d76e90b371dad6a31ca49` vẫn đúng hash.

Tái dùng review EVC gói source trước tại `permission-git-publication-local-evc-review-2026-10-17.md` (SHA256 `1011df09e87f2cc221ea062f8d502d237d78deeed797f2351986f5d1dae3ba36`) cho selection/curation/dependencies, 840 exports và 126 canonicalizations đã kiểm. Lượt này tự đọc actual Git objects và đối chiếu **toàn bộ 840 blob OIDs/modes**, hai deletion và phần baseline không chọn. Đây là căn cứ nội dung đã review không bị thay khi commit, không suy verdict từ lời tác giả.

Chỉ dùng Node built-ins, heap256MiB, tối đa hai kiểm tra con đồng thời, và Git read-only/hash không `-w`. Không mạng, app suite, credential/.env/private inputs/protected runtime/raw backup; không Git mutation hay xóa. File ghi duy nhất là review này, ngoài hai actual commits.

## Commit và diff thực tế

| Nội dung | Code | Docs |
| --- | --- | --- |
| Nhánh | `evidence/permission-20261016` | `evidence/permission-docs-20261016` |
| Commit | `43921c7ebd957bf926bb45411eed849874ade446` | `d62aa4b50a44fbbf69796d37d9f0dda62b3cd805` |
| Parent duy nhất | `5156820f7d6679cd6f8051bdc38419737ffa0c7e` | `e47862b1dfed68d783dc07a2a1fd51ecdabc1b19` |
| Tree | `50fe1d4fcdd5563a8cdbe794c7035a22c148b574` | `bc4027fe7daa4e62dc95e165162c2bc480645a7a` |
| Final tree entries | 848 | 751 |
| Selected paths | 509: 385A / 122M / 2D | 333: 313A / 20M |
| Insertions/deletions | +62.159 / −2.109 | +18.852 / −475 |
| Full patch bytes | 4.319.127 | 3.580.013 |

Đọc `cat-file commit` xác nhận đúng một parent và đúng tree mỗi commit. Message bytes khớp message đã duyệt; SHA256 lần lượt `1fb2948f15c849fad80e2d4d7f9ec17017fc028d4e407a0377c2936455e924eb` và `a8570f31e88b56b1d97d1ccbe919dfde1eca77e92f55e8705d112eaa25524ac3`.

Đối chiếu `ls-tree -rz` actual với manifest: 507 code + 333 docs blob/mode đều đúng, hai deletion absent; mọi baseline path ngoài selection giữ nguyên, không có extra path. Đối chiếu `diff --name-status -z --no-renames`: exact path sets và loại A/M/D khớp manifest. Không có rename che khuất deletion/addition.

Tái xuất trong memory từ explicit parent/commit với `--no-ext-diff --no-textconv --no-renames`, đủ bốn dạng mỗi commit: `--binary`, `--stat=100`, `--numstat -z`, `--name-status -z`. **Cả tám outputs byte-for-byte và SHA/bytes khớp tệp đã pin**. Đếm lại numstat khớp bảng, không binary entry. Patch là mỗi commit mới so với parent trực tiếp; không gộp hai ancestor docs vào patch mới.

## Checkout, ancestry và guard

Đọc actual branch refs và HEAD hai worktree mới: đều trỏ đúng commit trong bảng; `status --porcelain=v1 --untracked-files=all` rỗng tại cả hai. So local branch-name set với capture trước thực thi: chỉ thêm đúng hai nhánh evidence, không mất tên cũ.

Tự kiểm hai checkout gốc so fresh capture/preflight: vẫn trên main/docs, HEAD nguyên; raw index SHA256 và staged-entry SHA256 đều nguyên, **0 staged paths**. Main index `45849e5188d12f3f52a0354e354e0a8e8d836fa37d68223a1e455d2f8c429352`; docs index `91324609352aab1201cac0d5e3bf07d9105ec187373235a7074cfb42555d45ec`.

`rev-list --reverse 132e9d6cc065459031ee92cfbafcd423b5ac81c5..d62aa4b50a44fbbf69796d37d9f0dda62b3cd805` trả đúng hai ancestor đã tồn tại `9937f1f005f1569b0e348374b37cc95d8b490ca5`, `e47862b1dfed68d783dc07a2a1fd51ecdabc1b19`, rồi commit docs mới. Không squash/amend hay nhập docs vào main. Phần lịch sử 44 blobs/24 paths đã được kiểm ở review source trước vẫn được giữ bởi exact ancestry.

Đã đọc final helper: dùng normal worktree add, literal NUL allowlist, `git rm` đúng hai hook paths, full staged blob/mode/path checks và `git write-tree`, rồi normal `git commit --file`; không commit-tree/bypass hook/reset/stash. Resume yêu cầu đúng main branch/parent, index chưa stage, diagnosis đủ điều kiện và từng dirty partial path thuộc selection với SHA payload chính xác. Deletion guard so HEAD bytes SHA, base blob OID và canonical OID của checkout trước khi xóa trong evidence worktree.

Tự lấy hai deletion blobs từ đúng parent, đổi LF→CRLF trong memory: sizes **2.143→2.205 B** và **553→570 B**, SHA khớp checkout hashes trong diagnosis. `hash-object --path --stdin` không `-w` cho hai bản CRLF trả đúng base OIDs `0299c3c491ca390185ced605ad2395befca51538` và `9373db0918e5cf10e3302f3345503e60203829cf`. Chẩn đoán EOL có căn cứ và final guard giữ deletion identity. Diễn biến lần dừng đầu dựa pinned report/diagnosis; không replay lần lỗi hoặc helper. Actual trees/path sets xác nhận không đổi source, scope hay acceptance sau sửa guard.

## Finding, tài nguyên và giới hạn

| Mục | Phân loại | Bằng chứng và kết luận |
| --- | --- | --- |
| EVC-LC-N1: tên metric aggregate | Gợi ý không chặn | `actual-diffs.json.patchBytes=8.051.800` là tổng cả tám diff outputs theo builder; hai full patches cộng **7.899.140 B**, auxiliary stat/numstat/name-status **152.660 B**. Từng file có đúng bytes/hash, candidate không gọi aggregate này là tổng riêng hai patches, report ghi đúng hồ sơ khoảng8,08MB. Khi trình owner nên nêu ba số rõ như trên; metadata closeout có thể làm rõ mà không đổi immutable candidate. Không có lỗi payload/count/budget hoặc kết luận dựa trên tổng này. |
| Finding chặn | Không có | Exact commits và evidence phù hợp scope đã giao; không yêu cầu thay source/candidate/commit. |

Tự đo lại metadata kích thước hai worktree: **13.378.182 + 12.691.023 = 26.069.205 B logical**, gồm `.git` pointers, khớp resources receipt. Execution folder sau freeze có38files/**8.289.254 B**, dưới16MiB. Free Windows tại review: C199.544.393.728B, D102.750.371.840B, trên30GiB. Không nhận logical size là allocated size hoặc chênh free disk là toàn bộ writes riêng task; peak128MiB là giới hạn vận hành, không OS quota. Không cài/runtime/test stack mới. Hai worktree/patches còn phục vụ owner review; không tự cleanup.

Report/handoff giữ đúng: không thêm app/Windows/Linux/backend/UI test PASS ở lượt commit; kết quả Windows lịch sử và actor/scope metadata probe không chứng minh schema/contract2 compatibility. Full backend/hosted recovery/cutover/Edge/Storage/Realtime/binding môi trường vẫn cần gate riêng; **NOT_READY_FOR_DEPLOY** không thay đổi. Walkthrough mới được đề xuất, không nhận owner đã đọc/nghiệm thu.

Không đọc lại nội dung mọi application blob hoặc chạy lại suite; reuse chỉ áp dụng exact blob IDs đã duyệt. Không audit secret/PII/toàn lịch sử/ACL; SEC là scope khác. Không kiểm online lại remote/provider: phát biểu remote refs còn nguyên và evidence refs absent dựa pinned read-only receipts của tác giả. Before-push vẫn cần owner command riêng và fresh Preview OFF/ref/trigger checks. Không suy approval local thành quyền push/CI/DB/deploy, amend hoặc commit thứ ba. Review/handoff metadata ngày17 vẫn ngoài hai commits.

**APPROVE** exact candidate SHA256 `ab194a70abf7836fb66f0b109903255a8fe6f5ca9ae59629075aad70b46bb67a` cho kết quả hai local commits và diff để owner kiểm. SHA256 review được tính sau khi ghi và báo cho điều phối, không nhúng self-hash.
