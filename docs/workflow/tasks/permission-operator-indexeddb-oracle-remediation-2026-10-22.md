# Sửa oracle IndexedDB của operator — 22/10/2026

## Kết luận và phạm vi

Reviewer độc lập mới phát hiện `SOURCE-OP-IDB-01`: source `4d1ba3ada3810405b16c24d7b99ec7563a4f30ae` tại `tests/supabase/ownerPinOnboardingCloseout.spec.ts:4648–4649` gán `databases: []` trong capture operator. Bảy testcase TC18 đã chạy PASS nhưng assertion đó chưa quan sát IndexedDB tại origin operator. Không có bằng chứng product leak. Đây là thiếu kiểm chứng bắt buộc: [design:51](../../../openspec/changes/force-default-pin-change/design.md), [testplan:176–183](../../../openspec/changes/force-default-pin-change/testplan.md) và D19 trong [proposal](../../../openspec/changes/redesign-permission-model/proposal.md) giữ coverage; source HTML không ghi storage không thay thế runtime capture được yêu cầu.

Main tiếp tục giữ nguyên. Không thay acceptance, SQL, ứng dụng, Auth hoặc Edge; không truy vấn DB gốc. Hạn cứng vẫn 00:00 đầu ngày23/10 theo giờ thiết bị, `2026-10-22T17:00:00Z`. Admission cần còn hơn42phút; guard không phải scheduler tự dừng.

## Việc đã thực hiện trong quyền hiện hữu

T04 của4d1 PASS19stage/291required; PIN_ONBOARD PASS2stage/55required; T02 PASS3stage/17required. Cùng LIGHT6stage/343required, đây là30/35stage và706/760required của source cũ, không phải fullgate PASS: operator oracle thiếu và năm profile chưa chạy. Giữ mọi bằng chứng cũ theo đúng source.

T02 đã được settle SUCCESS bằng metadata/log/reclaim thật. Root đóng phase02 với pending rỗng để tránh chạy thêm: đã dùng2/7heavy, còn5chưa dùng; không refund lượt đã chạy. Lịch sử lifetime6publication/6CI/5heavy/10review được giữ. Hai CI PR/main chưa dùng. Policy02 và mọi predecessor được giữ nguyên, không init lại.

Candidate sửa local riêng: `4f8772667fc0607c77451e5b0c5ddbedfe7b63b5`, tree `95013ef246608c96239b8ac31e8e5ea3fa744cef`, nhánh `fix/operator-indexeddb-evidence-20261022`. Chỉ một file test thay đổi, raw SHA256 `c58ffe1c607ccc9a27f4c5c4ba7a417f20d8d58fc4001b81581b772736dc9e15`.

- Dùng chung reader thật cho generic/operator; đọc database, object store, cursor key/value, kể cả database có tên rỗng; lỗi đọc phải FAIL, đóng connection.
- Trong chính testcase operator hiện hữu, ghi canary chỉ ở nested record value trong một DB control riêng; đòi đúng lỗi `CANARY_LEAK_browserStorage`, xóa đúng DB đó, kiểm tên DB/baseline và capture sạch lại.
- Giữ nguyên testcase identities,7wrapper,20×11matrix,149selector và catalog35/760/12. Actual operator capture vẫn tách riêng10sink; không gọi declaration rỗng là observation hay gộp nó thành220runtime captures.
- Probe Chrome local dùng gói Playwright1.60.0 đã giữ lại, không install, không Supabase: sáu control PASS, gồm mutant `databases: []` bị bắt, nested value/tên DB rỗng/cursor key, lỗi enumeration FAIL và cleanup. Browser/loopback đã đóng. Receipt `operator-indexeddb-local-probe01.json`, SHA256 `cd3bb500d95923f0d134bbb3acb8e905083ad967ef8dc54223fa86b80b8dde67`. Probe chỉ chứng minh reader/control, không thay whole PIN_ONBOARD hoặc CI.
- Whole Node local05 đạt938/938, zero fail/skip/cancel/todo; source clean. Receipt nằm trong evidence ngoài code. Candidate cần hai non-author APPROVE trước đề nghị publication; review local không cấp quyền remote.

## Lựa chọn cần chủ dự án quyết định sau review

Ngân sách candidate publication/CI hiện hết. Không push hoặc mở policy ghi mới từ văn bản này. Đề xuất ưu tiên: cấp thêm đúng1candidate publication +1CI Linux cho candidate đã kiểm local, không backend mới tối nay. Giữ lịch sử,5heavy chưa dùng và2CI PR/main được ghi nhận riêng; không coi chúng là quyền thực thi trong policy có heavy0. Nếu quyết định này được chọn, policy/receipt mới phải pin parent CLOSED và qua hai review đúng bytes trước init; guard kiểm source/remote/concurrency/disk/clock mới trước push. Lỗi hoặc UNKNOWN thì dừng, không retry cùng source.

Lựa chọn khác: chỉ giữ candidate local và checkpoint, không mở thêm remote action. Nếu chủ dự án muốn chạy thêm backend tối nay, cần quyết định riêng rõ phạm vi/ngân sách: source mới cần đủ8profile mới;5lượt chưa dùng cộng net3mới mới đủ8, giữ lịch sử và không nhận PASS4d1 thành PASS4f. Chỉ chạy sau CI cùng source PASS và admission còn hơn42phút; không có quyết định thì không chạy.

Theo thời gian đã quan sát, CI candidate khoảng14phút, tám backend khoảng75phút, PR/main CI khoảng28phút tổng, chưa queue/review/collect. Không có kế hoạch đủ dự phòng để hứa cập nhật main trước00:00 ở thời điểm phát hiện này. Main chỉ được cập nhật khi35/760/12 vàD19/R0/R1 thực sự đủ, mọi reviewer được giao cổng cuối APPROVE, PR/main CI đúng ngân sách và còn thời gian. Không nới cổng để đạt hạn.

## Checkpoint và lần tiếp tục

Giữ old source4d1, packet04, raw logs/settlements, các policy CLOSED và finding; local4f không được gắn PASS runtime cũ. Trong lượt sau phải chốt cửa sổ thời gian/quyền còn hiệu lực, đọc metadata/ledger thật và xác nhận candidate source sạch/remote. CI mới nếu được chạy thành công chỉ được dùng lại cho đúng source, attempt, producer/config/lock; mọi backend cần fresh cùng source. Làm rõ đủ12oracle/34context bằng assertion và receipt, giữ denial audit/registry effects riêng với credential/session unchanged. Không xuất canary/key/private captures.

DB staging vẫn ở trạng thái trước đó; Auth DEFER, Edge BLOCKED. DB gốc, Vercel và production không có action mới. Không xóa nhánh chưa merge hay bằng chứng. Chỉ dọn fixture `temp/night-nodeNN` từ cùng runner sau lưu report/hash theo quyền đã cấp tới00:00; không suy quyền dọn cache/runtime khác.
