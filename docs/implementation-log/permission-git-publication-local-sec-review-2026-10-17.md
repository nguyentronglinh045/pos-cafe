# SEC review độc lập — gói minh chứng Git local, 17/10/2026

**Verdict: APPROVE** trong phạm vi SEC của **gói chuẩn bị và kế hoạch local chưa thực thi**.

- Reviewer: `publication_final_sec`, không tham gia tạo candidate/source/scout; không sửa candidate.
- Candidate: `D:/Workspace/pos-cafe/artifacts/permission-git-publication-local-20261017/review-candidate-01/candidate.json`.
- SHA256 được duyệt: `abbad7c6d1a77808ccea99076b62bf4667528fd25359cd81462c7cf6c0f0f889`.
- Không có finding chặn hoặc yêu cầu sửa trong phạm vi đã giao. APPROVE không cấp quyền tạo nhánh/worktree, stage, commit, push, CI, DB/provider/deploy hay xóa dữ liệu.

## Phạm vi và phương pháp

Đã đọc AGENTS/workflow/chuẩn spec trên worktree docs; đối chiếu frozen manifest, plan, report, privacy scout và triage. Kiểm trực tiếp full text của 840 file export theo allowlist bằng Node stdlib riêng; không import/chạy helper hoặc module ứng dụng. Rà nội dung mới công khai theo bảy nhóm lexical: private key, provider token, JWT, URL userinfo, sensitive literal assignment, email và phone field; kiểm provenance/context các nhóm đáng chú ý. Đọc đúng hai commit docs local và 24 path lịch sử được chỉ định; không mở rộng sang toàn lịch sử.

Chỉ dùng Git đọc với `--no-optional-locks` và tắt fsmonitor; không dùng `hash-object -w`, không ghi index/object/ref. Không network, ứng dụng, test suite, browser, DB, provider, cài gói hoặc dọn dữ liệu. Chỉ ghi chính báo cáo này; Node heap 256 MiB, đọc tuần tự, không tạo runtime. Giới hạn 24 MiB là ngân sách vận hành của root, không phải quota OS.

## Bằng chứng trực tiếp

1. Candidate SHA khớp ở đầu và cuối review. **56/56 snapshots**, tổng **2.908.702 bytes**, khớp cả SHA256 và kích thước đã bind. Không chạy helper trong snapshots.
2. **840/840 frozen source files / 8.267.924 bytes** khớp raw SHA256/kích thước trong manifest. Không có path vượt export root, traversal hoặc actual env/private/credential/backup/dependency/artifact path trong allowlist đã kiểm. Hai deletion markers chỉ định đúng `useRealtimeInvalidation.ts` và test; đọc hai baseline blob ở parent code xác nhận hash và kích thước 553/2.143 bytes; không thực hiện deletion.
3. Bảng `045-scoped-final-source-hashes.tsv` phủ đúng 842 manifest rows; 840 file cuối khớp pin của scout. Cả **321 occurrence dispositions** bind đúng SHA của frozen final payload; **11/11 prior-triage file pins** khớp. Không dùng triage của file khác hash để miễn rà.
4. Quét riêng full frozen text thu được **0 private key, 0 provider-token shape, 1 JWT, 2 URL userinfo, 281 sensitive assignments, 37 email flags, 0 phone-field**. Cả 281 assignments có disposition theo đúng path/line/hash; không có assignment flag mới chưa xử lý. Đây là flag lexical, không phải 321 secret thật.
5. Kiểm range docs `132e9d6..e47862b` trực tiếp: đúng hai commit `9937f1f005f1569b0e348374b37cc95d8b490ca5` và `e47862b1dfed68d783dc07a2a1fd51ecdabc1b19`; diff có đúng **24 path**, không thiếu path so với bảng history. **44 commit/path blob records / 334.342 bytes** khớp SHA256/kích thước; quét bảy nhóm có **0 flag**. Các bản ghi có thể có bytes trùng giữa hai commit; không tuyên bố 44 nội dung duy nhất.

## Scrutiny về secret/PII và scope

Không tìm thấy finding cụ thể về live secret/private PII trong bytes đã đọc. Không chỉ dựa vào số hit bằng zero hoặc tên test: đã đối chiếu context của JWT negative-control, URL/identity fixtures, bootstrap/recovery guards, default PIN khai báo và sentinel dài của reporter.

- JWT nằm trong input âm và được đưa vào `invalid(version)`: frozen `payload/main/scripts/permission-ci1-evidence.test.mjs:129–146`.
- Bootstrap tạo password bằng `randomBytes(24)`, nhận session từ response; email flag là so sánh fixture, không phải literal password/session: `payload/main/scripts/permission-bridge-runtime.mjs:89–102,148–157`. Mẫu recovery có target/marker/graph guards trước so sánh fixture tại `permission-pin-onboard-recover-attempt04.mjs:10–28`; không chạy module đó.
- Sentinel dài được đưa vào lỗi/mock rồi assertion yêu cầu không phản chiếu: `permissionPinAckReporter.tool.test.ts:19–27`, `permissionPinCanaryReporter.tool.test.ts:11–17,30–40`, `permissionVerify.tool.test.ts:45–50`. Refresh-token test có fixture và fetch mock tại `permissionRealtimeHarness.tool.test.ts:19–38`.
- PIN literal của bootstrap/default/mock đi cùng hợp đồng đã khai báo, không là captured unique credential. Ví dụ `src/adapters/supabase/authRepo.ts:103–108` và `src/adapters/mock/permissionRuntime.ts:87–115`. Không mở lại business acceptance hoặc sửa source để loại flag.

Không đọc actual .env, credential/private inputs, protected runtime, backups hoặc raw output thuộc nhóm125 bị giữ ngoài slice. Không nhận các nhóm đó đã sạch; unchanged/public baseline cũng không phải chứng nhận sạch. Path provenance local trong docs không có nghĩa raw files được xuất bản. 48 dirty deltas bị loại là giữ ngoài gói, không phải quyền xóa. Năm curated docs nằm trong frozen source; stage tương lai phải dùng export thay vì dirty originals.

## Quyền, trigger và giới hạn phát hành

Snapshot `051-permission-git-publication-local-2026-10-17.md:5,59–66,88–90` và `003-commit-plan.json:73–76,89–93,112` giữ đúng ranh giới owner: hiện tại chỉ chuẩn bị local. Hai commit mới còn planned; hai commit docs ancestor là lịch sử local đã có. Plan yêu cầu lệnh riêng cho thực thi local, kiểm lại config/attributes/hooks/signing/author, hash/tree/index/refs và dung lượng trước khi thao tác; commit bình thường, không vô hiệu bảo vệ. Push cần lệnh riêng sau review commit cụ thể, chỉ hai refspec minh chứng đã ghi.

Không có `.github/` delta trong selected manifest. Điều này không chứng minh không còn automation của provider. Report giữ Preview Branch Tracking OFF là bằng chứng save/reload ngày16; ngày17 chưa đọc lại. Plan bắt buộc kiểm lại đúng project trước eventual push, không coi OFF chặn main/manual/API deployment. Không dùng review để cho phép bật lại Preview, gọi lại metadata probe đã dùng quyền, sửa DB hoặc deploy. Chỉ merge code về main sau đủ gate và có lệnh owner; không merge docs vào main.

Report snapshot giữ **NOT_READY_FOR_DEPLOY**, không chạy lại application tests và không nhận Windows/mock/Node lịch sử thành full backend/Linux/online acceptance (`051:7,74–78`). SEC không nghiệm thu schema/contract2, Edge/Storage/Realtime, recovery/cutover, toàn ứng dụng hoặc toàn lịch sử; phần evidence/tree/coverage có reviewer EVC riêng.

Bổ sung review metadata, closeout và task-index sau freeze phù hợp policy khi nằm ngoài 842 entries đầu và không đổi 840 source copies, năm curated copies hoặc hai expected trees. Thay bytes hoặc mở rộng gói phải review delta tương ứng; APPROVE này chỉ gắn exact candidate hash trên.
