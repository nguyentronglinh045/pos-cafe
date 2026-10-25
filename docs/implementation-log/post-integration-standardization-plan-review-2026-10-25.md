# Review kế hoạch chuẩn hóa sau tích hợp — 25/10/2026

## Candidate và phạm vi bàn giao

- Yêu cầu người dùng: chuẩn bị task/thứ tự rà soát, chuẩn hóa sau tích hợp và cleanup worktree; **phiên này chỉ lập kế hoạch**.
- [Kế hoạch NC-00…NC-11](../workflow/tasks/post-integration-standardization-plan-2026-10-25.md): SHA256 `E79BEEFA0EAE530CE0F2FC4F8B683038872D9CE47387C793FA99A16F1C61B86B`, 31.480 byte.
- [Task index](../workflow/tasks/README.md): SHA256 `D106252363E42AB563AD0300C336619C29437F591AEDC3CBE79E93D0F06C40D4`, 53.244 byte. Trước append: 52.903 byte, SHA256 `5A343FB0EB20F3A580E38853A53D91FD47AF3A2C331E773850900091712E618B`; byte prefix được tác giả kiểm nguyên vẹn và reviewer tính lại hash khớp.
- Hai reviewer không tham gia tạo candidate, ngữ cảnh mới, chỉ đọc. Candidate cuối bổ sung bảng inventory NC-09 sau draft đầu; cả hai đã kiểm và APPROVE đúng hash cuối nêu trên.
- Kế hoạch và index là nội dung được review; file này chỉ ghi metadata, findings/verdict và giới hạn sau review theo ngoại lệ không review đệ quy của workflow. Không sửa nội dung candidate sau APPROVE.

## Reviewer kiến trúc và kiểm chứng

Reviewer: `/root/review_plan_architecture`.

**Verdict: APPROVE — phạm vi review kỹ thuật của kế hoạch; không xác nhận ứng dụng PASS.**

Finding chặn: không có. Đề xuất không chặn: không có.

Đã kiểm:

- Thứ tự NC-00 → baseline/khảo sát → quy ước → từng luồng → tinh gọn → hồi quy phù hợp; NC-04 bị chặn khi baseline liên quan chưa đáng tin. Kế hoạch không mở quyền triển khai trong phiên lập kế hoạch.
- Trách nhiệm UI/hooks/flow/core/ports/adapters/server khớp guard hiện có; giữ validation ở các trust boundary, legacy test surface và lifecycle exception, không suy trùng mã chỉ từ hình thức.
- Checkout `a028cc5…` và ref local `origin/main@0dd63ea…` cùng tree `12e8e64…`; số tracked files và các nhóm src/scripts/tests/vitest khớp.
- Đối chiếu AppPorts/LegacyAppPorts, runtime composition, continuation guard, PaymentDrawer, payment hook, Vitest discovery, CI phases. Closeout test chỉ kiểm selection/quantity; kế hoạch còn yêu cầu hồi quy thực hiện thanh toán.
- Chênh lệch CLAUDE.md:88 với ports/index.ts:154–176 có thật; CI failure/UNKNOWN và backend acceptance hoãn được giữ đúng handoff, không suy merge/mock PASS thành nghiệm thu backend.
- Hồi quy giữ OCC, K/payload, tiền/atomicity, quyền thay đổi giữa await, direct-call/cross-store, source fingerprint và bằng chứng phục hồi. Backend gate bắt buộc chưa đạt vẫn chặn kết luận hoàn tất.
- NC-09 là inventory để kiểm, không là allowlist xóa; bảo vệ nested `code`, WIP, ignored artifacts và evidence.

Giới hạn reviewer: chỉ đọc Git/filesystem/source/hồ sơ; không chạy test/runtime, không truy cập backend/remote, không sửa/xóa dữ liệu. Chưa chứng nhận toàn bộ retention hoặc khả năng xóa từng worktree.

## Reviewer bảo toàn và phạm vi

Reviewer: `/root/review_plan_retention`.

**Verdict: APPROVE — phạm vi quyền thực hiện, WIP/worktree, retention/recovery, ngân sách Windows, docs và bàn giao.**

Không có finding chặn; không có đề xuất bắt buộc sửa.

Đã kiểm:

- Đối chiếu AGENTS/workflow/SPEC-STANDARD, handoff tích hợp và cleanup 23/10.
- Xác minh 15 đăng ký worktree, số WIP của từng nhóm, sự tồn tại của chín path ngoài registry, manifest backup 84 mục, hai tree bằng nhau và 14/14 HEAD code thuộc lịch sử ref local `origin/main`.
- 8/8 liên kết tương đối tồn tại; hash 52.903 byte đầu index khớp preimage trước append.
- Kế hoạch chỉ lập kế hoạch, không biến merge thành nghiệm thu backend, không cấp quyền xóa; giữ backup/HOLD, kiểm dependency/bảo toàn WIP trước cleanup. Điều kiện ngân sách, allowlist, khôi phục, đo dung lượng thực và nguồn chứng cứ đủ rõ để giao NC-00.

Giới hạn reviewer: chưa đo từng thư mục, kiểm process/handle đang dùng, hash lại 84 bản lưu hoặc thử khôi phục. Không chạy test/backend, xác minh remote hiện thời hoặc thay dữ liệu. Verdict xác nhận chất lượng kế hoạch, không xác nhận runtime PASS hay cho phép triển khai/dọn.

## Kết quả đúng phạm vi

Đã hoàn thành **lập và review kế hoạch**. NC-00…NC-11 vẫn chưa thực thi; quyết định nghiệm thu của chủ dự án chưa có. Chưa sửa ứng dụng, chạy test/CI, cài dependency, đổi Git refs, xóa worktree hoặc tác động backend/phát hành. Hồ sơ mới và entry index chỉ lưu local trên worktree `docs`, chưa commit/push.

Việc tiếp theo đề xuất: giao NC-00 để xác minh nguồn và lập manifest/recipe bảo toàn, rồi NC-01 để xử lý baseline; đọc lại kế hoạch và trạng thái thực trước mọi thực thi.

## Vòng bổ sung NC-UI theo yêu cầu tiếp ngày 25/10/2026

Phần review phía trên là lịch sử candidate ban đầu `E79BEEFA…`; lượt này bổ sung việc kiểm các PR UI theo yêu cầu người dùng, không thay đổi verdict lịch sử thành review của nội dung mới.

- Candidate mới: kế hoạch SHA256 `A8242F256F5DD030F5BBD08304D79C6FF09B164619DF3EB361A94A12085D4877`, 40.331 byte; index SHA256 `9EF52D6D570634740BA1477B2D129DE04AA644BDB9FE71F4FB21E0BA95FCCC58`, 53.576 byte.
- Prefix index cũ 53.244 byte vẫn có SHA256 `D106252363E42AB563AD0300C336619C29437F591AEDC3CBE79E93D0F06C40D4`; tác giả kiểm byte và reviewer retention tính lại hash độc lập.
- Phạm vi: kiểm kê metadata/file lists của bốn Draft PR, bổ sung NC-UI-A/B/C/D, đặt quyết định UI và baseline trước refactor, cập nhật retention/dependencies. Không review toàn bộ code PR hoặc thực thi thay đổi.

### `/root/review_plan_architecture` — APPROVE

Finding chặn: không có. Đề xuất không chặn: không có. Reviewer tự đọc GitHub GET và Git local, xác nhận trên đúng candidate mới:

- Bốn Draft PR: code #11/#13, docs #12/#14; head/base, số file 59/269/32/19, main `0dd63ea…` khớp kế hoạch.
- #11 `mergeable=false/dirty`; #13 `true/unstable` chỉ trên base nhánh #11. Không suy #13 sẵn sàng vào main.
- Giao file lists với diff tích hợp cho 12 đường dẫn #11 và 9 đường dẫn #13; đúng là overlap, không phải số conflict.
- PR bodies hỗ trợ các khoảng trống audit/source được ghi; số PASS của tác giả vẫn phải kiểm chứng.
- NC-01 chẩn đoán song song review UI; nhận/hoãn và baseline trước refactor; B03 đọc sớm được nhưng review tích hợp cuối theo B01/B02 ổn định.
- Integration có điều kiện; đổi base phải kiểm lại diff/CI/review; không cấp quyền sửa/merge/retarget/gửi review trong phiên này. Giữ WIP, evidence, backend/release holds.

Giới hạn: review kế hoạch, chưa review từng dòng PR, chưa chạy test/CI hoặc xác nhận gate ứng dụng. Không sửa local/remote.

### `/root/review_plan_retention` — APPROVE

Không có finding chặn hoặc đề xuất cần sửa. Reviewer đọc toàn bộ delta và dependencies trên đúng candidate mới:

- Phân biệt kiểm kê với review đầy đủ; #11/#12 trước phần tích hợp cuối #13/#14; nhận/hoãn và baseline trước refactor.
- Merge/retarget/chạy gate chỉ khi được giao riêng, kế hoạch không tạo quyền thực thi.
- Retention bao gồm checkout/nhánh/evidence PR; docs PR phản ánh trạng thái code và bảo toàn WIP local. Backup/HOLD, ngân sách Windows và backend/release holds không đổi.
- Kiểm độc lập 8 link tương đối và hash prefix index; hoàn tất kế hoạch không đồng nghĩa triển khai/nghiệm thu.

Giới hạn: vòng này không đọc GitHub trực tiếp, review từng dòng PR, chạy runtime/tests hoặc thay dữ liệu. Không xác nhận PR đủ điều kiện merge.

**Kết luận lượt bổ sung:** kế hoạch NC-UI đã được cả hai reviewer APPROVE. Nhóm mới và các task cũ vẫn chưa thực thi. Việc tiếp theo là NC-00, rồi chẩn đoán NC-01 và intake/review NC-UI theo thứ tự #11/#12 → #13/#14, chốt lại source/baseline trước refactor. Chưa sửa mã, merge/retarget PR, gửi bình luận, chạy CI hoặc dọn worktree. Metadata review được append sau APPROVE; candidate kế hoạch/index giữ nguyên hash nêu trên.
