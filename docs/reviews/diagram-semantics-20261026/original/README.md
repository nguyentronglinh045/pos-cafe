# Review ngữ nghĩa 16 hình POS Cafe — 26/10/2026

**Không chấp nhận bộ hình là đúng toàn bộ: F04 cần sửa nút rẽ trạng thái.** Tám ERD và F01–F03/F05–F08 khớp các claim đã kiểm trong phạm vi hình đi cùng chú thích trên nguồn được ghim. Checkout WIP còn thiếu bảo vệ lifetime trước begin; catalog staging không xác minh DB khác được cấu hình trong checkout. Đây là kết luận review, không phải nghiệm thu sản phẩm.

Hồ sơ do /root biên soạn từ việc tự đối chiếu code, ba lượt khảo sát độc lập và kiểm chéo cuối. Candidate chỉ nằm ngoài checkout, chưa commit/push docs và chưa sửa bộ hình. Receipt gate cuối được ghi riêng sau khi reviewers nhận đúng hash; không coi các verdict khảo sát là duyệt candidate này.

## Nguồn và runtime

| Ký hiệu | Nguồn ghim | Cách hiểu |
| --- | --- | --- |
| D | docs@27f8cfb89b52b2a562bf3c59d1806c3ccdd02c1a | Bộ SVG/manifest/chú thích; Mermaid gốc docs@1751c2fefb7ce8accc2922af94b0083cf3321e3f |
| O | origin/main@711a22e71983e3d6aa17799649af05ce4c762555 | ls-remote đầu và cuối khảo sát đều khớp; code đã commit mới nhất tại thời điểm kiểm |
| W | HEAD@5156820f7d6679cd6f8051bdc38419737ffa0c7e + snapshot file thực tế | Bao gồm file WIP/untracked; HEAD riêng không nhận diện được W |
| S | Supabase staging ineckiashpwloncxnbqx | Catalog chỉ đọc mới trong lượt này; không tái dùng N1/N2 cũ làm PASS mới |
| L | Host kfqjdfwxhkdwihjobpny.supabase.co trong .env.local | mode=supabase, key có mặt nhưng không lưu giá trị; chưa đọc catalog L, chưa xem browser/build/deployment đang chạy |

[source-manifest.json](C:/Users/nguye/.codex/visualizations/2026/10/26/01a17779-e86e-7a83-86fd-20aaccf28435/semantic-review/source-manifest.json) SHA256 **2929925805096f6dc2873fea2f076e9f84a395e83cb57257f316f1f9bdac2282** ghim 592 đường source/config/test trong O/W, có snapshot có thể đọc lại. [Manifest bổ sung controller](C:/Users/nguye/.codex/visualizations/2026/10/26/01a17779-e86e-7a83-86fd-20aaccf28435/semantic-review/supplemental-erd-manifest.json) ghim hai script activation; [deltas](C:/Users/nguye/.codex/visualizations/2026/10/26/01a17779-e86e-7a83-86fd-20aaccf28435/semantic-review/source-deltas.json) so nội dung thực, gồm untracked. Mọi kết luận W chỉ áp cho snapshot này. Line ending CRLF/LF có thể làm byte hash khác mà nội dung ngữ nghĩa bằng nhau.

Đường production đã lần: AppProviders → createAppPortsFromViteEnv → runtimePorts.ts:16–34 → repos.ts:17–26 → createSupabasePermissionRuntime (newPermissionRuntime.ts:16–33). Nó nối permission identity/read/changes/signals/print và SupabaseWriteOperationRepo(client,true). createSupabaseLegacyPorts là factory regression riêng; không dùng raw legacy repos làm bằng chứng cho UI production. Vite env có thể chọn mock; cấu hình local đã đọc chọn Supabase L, còn deployed build chưa xác định. [Quan sát cấu hình đã lược secret](C:/Users/nguye/.codex/visualizations/2026/10/26/01a17779-e86e-7a83-86fd-20aaccf28435/semantic-review/runtime-observation.json); [cấu hình endpoint MCP riêng project](C:/Users/nguye/.codex/visualizations/2026/10/26/01a17779-e86e-7a83-86fd-20aaccf28435/semantic-review/db/connection-config.json) phân biệt server project S với server global L.

W khác O tại orderFlow/writeOperationFlow, nhiều UI và một số SQL. Hai delta SQL đáng lưu ý: permission-read.sql của O revoke ALL table/column privileges, W chỉ SELECT; permission-seed.sql khác credential_changed. Chúng không làm 36 cạnh ERD sai, nhưng không được kết luận ACL/seed behavior của hai nguồn giống hoàn toàn. Không chạy activation hay controller.

## Kết luận đủ 16 hình

“Khớp” = đối chiếu ngữ nghĩa source trong phạm vi đã nêu; không mang nghĩa mọi edge case runtime đã PASS. Đọc hình cùng chú thích là điều kiện sử dụng của gói xuất bản.

| Hình | O | W | Căn cứ/khoảng thiếu chính |
| --- | --- | --- | --- |
| ERD-01 | Khớp | Khớp | 7 FK; owner constraint tách khỏi cardinality FK; S khớp |
| ERD-02 | Khớp | Khớp | 5 FK; không tự thêm UNIQUE món–nhóm; S khớp |
| ERD-03 | Khớp | Khớp | 4 FK; table_id nullable, chỉ một order open/bàn theo partial index; S khớp |
| ERD-04 | Khớp | Khớp | 8 FK; K ghép, event 0..1/K, nhiều payment về mặt schema; S khớp |
| ERD-05 | Khớp | Khớp | 5 FK; grant 0..1/K, audit không FK; S khớp |
| ERD-06 | Khớp | Khớp | 3 FK; workflow 0..1/store, stage PK ghép; S khớp |
| ERD-07 | Khớp | Khớp | 4 FK; upload draft không FK item, published asset có FK; S khớp |
| ERD-08 | Khớp | Khớp | 3 bảng đứng riêng không FK; không suy strict bật hoặc delivery bảo đảm; S khớp |
| F01 | Khớp thuật toán | Khớp thuật toán; thiếu chú thích WIP | Toàn phần/tách, snapshot giá, OCC, payment/receipt cùng TX; FIN-WIP-02 xảy ra trước begin |
| F02 | Khớp happy path + ngoại lệ | Khớp protocol/SQL; thiếu chú thích WIP | Register/execute tách TX, lock/checkpoint, subtransaction, replay và print gate; không đồng nhất mọi bước trước begin |
| F03 | Khớp | Khớp | Pending→4 terminal; expiry khi RPC quan sát; unknown chỉ ở client |
| F04 | **Cần sửa** | **Cần sửa + bổ sung biến thể WIP** | FIN-01: nhánh retry trả execute nhưng diamond ghi Get; FIN-WIP-02: khoảng authority await trước begin |
| F05 | Khớp với caption | Khớp với caption | Normal12h/restricted5m, proof, lỗi PIN/lost ACK; cuối hình là nhánh thành công |
| F06 | Khớp với caption | Khớp với caption | Session trước receipt, PIN/revision/revoke/signal/audit một TX; không normal token; chưa test lock waits |
| F07 | Khớp với caption | Khớp với caption | Deadline5s/poll30s, phân lỗi, purge trước apply, response cũ bị bỏ; không đo độ trễ thu hồi |
| F08 | Khớp với caption | Khớp đường RPC/client; ACL khác | Signal là hint, không bảo đảm delivery/thứ tự ACK; không mọi query poll; chưa test subscription |

Chi tiết claim/node/edge và phản ví dụ ở [traceability.md](C:/Users/nguye/.codex/visualizations/2026/10/26/01a17779-e86e-7a83-86fd-20aaccf28435/semantic-review/candidate/docs/workflow/tasks/diagram-semantic-review-2026-10-26/traceability.md); sửa ưu tiên ở [findings.md](C:/Users/nguye/.codex/visualizations/2026/10/26/01a17779-e86e-7a83-86fd-20aaccf28435/semantic-review/candidate/docs/workflow/tasks/diagram-semantic-review-2026-10-26/findings.md). Không có PASS tổng cho bộ hình còn F04 sai. Các dòng “khớp” không xác minh catalog L hay deployment.

## Bằng chứng và giới hạn

- ERD: kiểm 36/36 cạnh, 35 entity dự án, 6 entity đứng riêng; cột FK, PK/UNIQUE/nullability và kiểu quan hệ đều đối chiếu source và catalog S. Hình không có hộp thuộc tính nên không tuyên bố đã kiểm mọi cột của toàn database chỉ từ ERD.
- Luồng: 31 hàng trace F01–04 và 23 hàng F05–08; đường UI/port/adapter/SQL, happy path/ngoại lệ/quyền/transaction/cache được ghi riêng. 37 financial/print/helper overload và 21 identity/read/signal body comparison đạt trong tập đã chọn; hai tập có thể giao nhau, không cộng thành58 unique functions. Không phải mọi function trong catalog đều đã audit.
- Catalog S mới: 36 bảng/335 cột (có marker kỹ thuật), constraints/indexes/policies/grants/triggers/functions/publication. Probe 2026-10-26T09:14:34Z (16:14:34 giờ Bangkok), supabase_read_only_user/read_only=on. Các SELECT thu ở nhiều request, không giả là một snapshot transaction đồng thời. Chỉ đọc metadata/definitions, không hàng nghiệp vụ/token/PIN.
- Test thực chạy: cùng12 oracle lifetime trên O đạt12, W lỗi12; không phải12 giao dịch đều thành công trên W. Ca void dùng đơn open nên có thể thất bại nghiệp vụ; điểm chung là không dừng bằng WRITE_RESULT_UNKNOWN đúng kỳ vọng. Xem [verification.md](C:/Users/nguye/.codex/visualizations/2026/10/26/01a17779-e86e-7a83-86fd-20aaccf28435/semantic-review/candidate/docs/workflow/tasks/diagram-semantic-review-2026-10-26/verification.md).
- Hình: ba reviewer đã xem đủ16 PNG sau kiểm hash SVG/PNG theo manifest; root xem lại F04. Không thấy vấn đề render mới che khuất ngữ nghĩa; F04 hiển thị rõ chính nhãn sai của Mermaid. Chưa kiểm Word/PDF/A4/in; F01 dài, ERD05 rất rộng. Không mở HTML kiến trúc cũ.

Không chạy giao dịch staging, migration/reset/seed, browser E2E, delivery realtime, deployment hoặc hardware. Không sửa code/tests/index/runtime/DB/bộ hình. N1/N2 cũ là lịch sử. Giữ P1-03, N4, H1–H4 và backend/deploy/hardware acceptance mở. Chủ dự án chưa được ghi là đã nghiệm thu hoặc đã đọc/hiểu kết quả.

## Hồ sơ review độc lập

Khảo sát chuyên môn: [tài chính](C:/Users/nguye/.codex/visualizations/2026/10/26/01a17779-e86e-7a83-86fd-20aaccf28435/semantic-review/review-financial.md), [identity/authority/signal](C:/Users/nguye/.codex/visualizations/2026/10/26/01a17779-e86e-7a83-86fd-20aaccf28435/semantic-review/review-identity.md), [ERD](C:/Users/nguye/.codex/visualizations/2026/10/26/01a17779-e86e-7a83-86fd-20aaccf28435/semantic-review/review-erd.md). Sau biên soạn, reviewer tài chính kiểm chéo 8 ERD; reviewer identity kiểm chéo F01–04 và test; reviewer ERD kiểm chéo F05–08 cùng provenance/limits. Hợp scope phủ16 hình và bảng truy vết cuối; mọi verdict phải gắn candidate-manifest hash cuối trong receipt riêng. APPROVE hồ sơ có nghĩa kết luận/findings được trình bày có căn cứ, không duyệt nguyên F04 hay đóng gate sản phẩm.

Đề xuất bước tiếp theo cho chủ dự án: chấp nhận/chỉnh phương án sửa F04 và chọn source đích khi cập nhật docs; xử lý WIP lifetime ở task code riêng nếu muốn. Chưa áp đề xuất hoặc push bộ hình trong lượt review này.
