# Bàn giao candidate phân quyền — CI 03 ngày 22/10/2026

Đã hoàn thành phạm vi chủ dự án chọn: **thêm đúng một push candidate và một CI; không backend tối nay**. Candidate `4f8772667fc0607c77451e5b0c5ddbedfe7b63b5` đã lên `run/permissions-20261020`; [CI 39811728040](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/39811728040) attempt 1 SUCCESS đủ 18 pha. Job chạy 14 phút 1 giây, chờ runner 3 giây theo timestamp GitHub. Local 938/938 và sáu control Chrome thật PASS trước push. Xem [checkpoint CI](checkpoint-operator-indexeddb-ci-complete03.json); review package cuối ghi riêng trong `docs-package-review03.json` sau khi duyệt.

**Main chưa cập nhật:** vẫn `2da0d7e10d65ed4e79c8628d65220582a6cbd32b`. LIGHT xác nhận6 stage / 343 ca bắt buộc; cả 8 profile backend của source 4f chưa chạy. Full gate 35 stage / 760 ca bắt buộc / 12 nghĩa vụ và D19/R0/R1 vẫn PENDING. Không lấy PASS của 4d1 thành PASS của 4f. CI giữ nguyên tooling 1 manualDeferred, smoke 37 skip do viewport và 6 finding UI đã có baseline; không tuyên bố toàn CI zero-skip hoặc không còn mọi finding. Không giảm acceptance/coverage.

## Bản sửa và cách đọc code

Finding SOURCE-OP-IDB-01 là thiếu quan sát trong test: source 4d1 dùng `databases: []` cho operator dù phải kiểm IndexedDB thật. Không có bằng chứng product leak. Candidate 4f chỉ sửa `tests/supabase/ownerPinOnboardingCloseout.spec.ts`; ứng dụng và SQL không đổi.

Đọc file này trong `D:/Workspace/pos-cafe-permission-timeonly-20261022/code`: dòng 177 đọc database/store/cursor key và value thật; dòng 220 kiểm canary chỉ trong nested value của DB control riêng, đòi đúng lỗi leak, xóa đúng control rồi đọc sạch lại; dòng 4727 đưa capture thật đó vào testcase operator. Probe local bắt được mutant khai báo DB rỗng. Bảy wrapper, testcase identities và ma trận 20×11 được giữ. Đây là hướng dẫn đọc code đã chuẩn bị; walkthrough trực tiếp với chủ dự án CHƯA THỰC HIỆN, không suy rằng chủ dự án đã đọc/hiểu/nghiệm thu.

Root và hai reviewer đã mở thật ba ảnh PIN và kiểm source/hash bằng validator production; xem [review runtime/visual](ci03-runtime-visual-review01.json). Hai vùng PIN bị mask nên không đánh giá chữ/nhãn/caret/contrast bên dưới. Mobile viewport 844×390 có ảnh fullpage 844×419; không suy toàn nội dung nằm trong viewport ban đầu. Fixture mock không chứng minh Auth/PIN hosted.

## Trạng thái an toàn và lịch sử

Phase 03 settle SUCCESS một lần rồi CLOSED, pending rỗng: dùng 1 publication / 1 CI / 0 heavy; lifetime 7 publication / 7 CI / 5 heavy / 10 reviewRounds giữ nguyên. Năm heavy và hai CI PR/main chưa dùng từ phase cũ chỉ ghi là hoãn, không là quyền thực thi trong policy 03. Guard thực tế từ chối heavy và postgate; admission push đã kiểm source/remote/concurrency/disk/clock và còn hơn 42 phút. Guard kiểm theo thao tác, không phải scheduler tự tắt máy.

Không có action mới với staging, DB gốc hoặc Vercel trong lượt này. Staging vẫn Auth DEFER/Edge BLOCKED; cửa sổ Auth 21:00–21:45 cũ đã hết, không tự dùng lại. Chưa merge nhánh nào nên chưa xóa nhánh. Không cài thêm gói, WSL hay Docker; C còn khoảng 193 GB / D 98,5 GB, retained logical 331 MB ở checkpoint. Fixture 05 đã xóa đúng quyền sau lưu report/hash; lỗi tên receipt khi chuẩn bị cleanup và việc khôi phục nguyên bytes của receipt 04 được giữ trong [incidents](preparation-incidents03.json). [Erratum](review-attribution-errata03.json) rút một câu gán thừa phạm vi review; bản gốc giữ nguyên.

Bằng chứng có ba mapping lưu giữ: [local](compact-evidence-custody03.json), [publication](ci03-publication-custody.json), [terminal/ledger/ảnh](ci03-terminal-custody.json). Raw workflow log/TAP và tham chiếu lịch sử còn ở đường dẫn retained ghi kèm hash; không xuất private captures/canary/keys. Không xóa nếu chưa được chủ dự án cho phép. Gói 75 file đã commit trước vẫn khớp mọi hash. Docs mới được commit cục bộ sau hai review; không có docs push trong phạm vi lượt này.

## Lần tiếp tục

1. Xin chủ dự án chốt hạn mới và ngân sách thực thi 8 profile backend cùng hai CI PR/main trước phần phụ thuộc; không mở lại phase CLOSED hay tự chuyển quyền hoãn thành quyền chạy.
2. Đọc checkpoint/ledger thật; kiểm source 4f sạch/tree/fingerprint/lock, remote main/candidate, concurrency và ổ Windows. Nếu source/config/lock không đổi và gate cho phép dùng lại, dùng CI 03 đã có; không chạy lại CI chỉ vì mở chat mới.
3. Chạy đủ 8 profile nguyên vẹn, từng backend một, admission còn hơn 42 phút; lỗi/UNKNOWN thì dừng, không retry cùng source. Kiểm đủ 12 nghĩa vụ bằng evidence thật, giữ audit/registry effects riêng với credential/session invariants. Không đổi source giữa chừng nếu chưa có lý do từ lỗi hoặc finding mới.
4. Chỉ PR/main sau fullgate và mọi reviewer bắt buộc APPROVE; CI PR/main phải có quyền còn hiệu lực và đủ thời gian. Sau merge được xác minh mới xóa các nhánh task đã merge. Hosted Auth/Edge cần quyết định và cửa sổ riêng; DB gốc/Vercel không tự được cấp quyền bởi bản bàn giao này.

Kế hoạch gốc: [operator IndexedDB remediation](../../workflow/tasks/permission-operator-indexeddb-oracle-remediation-2026-10-22.md). Không hứa cập nhật main từ một CI PASS; phần chưa kiểm được giữ rõ để lần sau không lặp lại hoặc vượt ngân sách.
