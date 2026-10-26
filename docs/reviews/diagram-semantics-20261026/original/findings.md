# Findings và bản sửa đề xuất

Chỉ đề xuất tài liệu; không sửa application, tests, schema hoặc SVG/Mermaid đã xuất bản. Ưu tiên P1 là tác động tài chính của khác biệt WIP; P2 là lỗi giải thích F04. Trạng thái “mở” dưới đây không ngăn bàn giao kết quả review trung thực, nhưng ngăn nhận bộ hình đúng toàn bộ.

## Findings và đề xuất sửa tài liệu

### FIN-01 — F04 dùng sai trạng thái tại điểm hội tụ hai đường recovery

- **Chặn việc nhận F04 đúng hoàn toàn**, ưu tiên P2, áp dụng cả O và W.
- Vị trí: `D/docs/critical-flows.md:162,164,178,181` / `flow-04.svg`, cạnh `retry → state`, diamond “Get thấy trạng thái nào?”. Đã nhìn trên PNG hash khớp: nhánh retry và lookup thật sự cùng đổ vào diamond này.
- Code phản chứng: `O src/features/pos/writeOperationFlow.ts:105–120` (`W:100–115`) gọi get, bỏ giá trị get, sau đó execute; trạng thái/result trả về là **execute**, kể cả get terminal. `WriteAttemptNotice.tsx:20–29` xử lý status từ kết quả retryCurrent. Ngược lại `resume` (`O:129–138`, `W:124–133`) chỉ execute nếu get còn pending.
- Phản ví dụ: K đang pending; người dùng “Thử lại cùng lệnh”; get trả pending; execute applied. Code chuyển settled và báo thành công; hình đọc literal theo “Get thấy” rẽ pending và yêu cầu người dùng tiếp tục/hủy dù execute đã applied. Cùng sai nếu get pending rồi execute rejected/expired.
- Sửa tối thiểu: đổi diamond thành “Kết quả cuối của đường gọi?” và ghi rõ nhánh retry dùng kết quả execute, lookup dùng get. Sửa tốt hơn: tách nhánh retry thành `get → execute cùng K/payload → xử lý kết quả execute`, lookup thành `get → terminal/pending → resume hoặc cancel`; nối kết quả resume/cancel trở lại nút xử lý trạng thái. Giữ chú thích D:188 vì chú thích đó hiện đã diễn đạt đúng code.
- Cách kiểm lại: lần bằng tay phản ví dụ get=pending/execute=applied và get=applied/execute=replay; cả hai phải kết thúc terminal, không dẫn sang lời mời thực hiện lần nữa. Không yêu cầu thay thuật toán ứng dụng.

### FIN-WIP-02 — Thiếu biến thể WIP ở khoảng chờ authority trước begin

- **Chặn phát biểu rằng toàn đường local hiện tại có cùng bảo vệ lifetime như origin**, ưu tiên P1 về rủi ro tài chính; là thiếu phạm vi/chênh source, **không phải phản chứng các cạnh đang chờ register/execute trong F04**.
- Vị trí liên quan: F01 `authority → selection → choose/protocol`; F02 đầu vào coordinator; F04 chú thích về đổi vòng đời `D:190`. Hình hiện không trình bày khoảng chờ getAuthority trước khi attempt tồn tại.
- O có `captureContinuationGuard()` tại `writeOperationFlow.ts:44–48` và dùng trước/sau await authority tại `orderFlow.ts:277–279,362–364` (cả submit và void cũng tương tự). W không có helper; `W orderFlow.ts:272–280,354–360` await `requireCurrentPermission` rồi đi tiếp không kiểm generation coordinator. `O/W permissionSession.ts:64–71` chỉ kiểm compatibility/actor/quyền, không kiểm drawer hoặc generation coordinator.
- Phản ví dụ source: click thanh toán → getAuthority đang chờ → đóng drawer trong cùng phiên nhân viên, `O/W WriteLifecycle.tsx:24–29` gọi leave khi chưa có attempt → authority response hợp lệ về. W đi begin với generation mới và có thể register/execute nếu online và session vẫn hợp lệ; guard callback tại `W PaymentDrawer.tsx:197–198` chỉ ngăn phản hồi cũ cập nhật UI. O chặn trước begin nhờ guard đã chụp trước await. Root đã chạy mock unit regression kiểm chính khoảng chờ authority: W 12/12 FAIL; O 12/12 PASS, xem phần bằng chứng dưới. Chưa chạy race trên DB/browser.
- Sửa tài liệu trong lượt này: ghi rõ hai nguồn và thêm chú thích WIP có khoảng hở này; giữ mô tả origin có guard. Không tự sửa app để làm hình đúng. Nếu chủ dự án muốn mô tả một source duy nhất, chọn O hoặc W rõ ràng rồi duyệt phương án riêng.
- Giới hạn: đóng drawer **sau begin** vẫn khiến `suspend/leave` và `request.check` vô hiệu hóa continuation ở cả O/W. Caption “phản hồi cũ không cập nhật UI” vẫn có cơ sở ở cả hai. Không viết lại finding thành “mọi phản hồi muộn ở WIP đều chạy tiếp”.
- Test tham khảo đã đọc: chỉ O có `src/features/pos/orderFlow.lifecycle.test.ts:7–68`, gồm delayed authority/leave/suspend và second lookup khi full-selection. Root chạy bản copy assertions giữ nguyên trên cả hai snapshot bằng harness ngoài repo; reviewer kiểm recipe/diff/results, không tự chạy lại.



## Đề xuất sửa tối thiểu FIN-01 (chưa áp dụng)

Trong F04 của docs/critical-flows.md, thay đúng ba dòng để giữ nguyên thuật toán và các nhánh còn lại:

```diff
-    state{"Get thấy trạng thái nào?"}
+    state{"Kết quả cuối của đường gọi?"}
-    retry --> state
+    retry -->|"Kết quả execute"| state
-    lookup --> state
+    lookup -->|"Kết quả get"| state
```

Đây là patch text đề xuất, chưa parser/render hoặc phát hành. Khi được giao sửa, phải render lại F04, rà nhãn/cạnh và review hash mới. Phản ví dụ bắt buộc: get=pending rồi execute=applied/rejected/expired phải đi terminal; lookup pending mới mời resume/cancel. Có thể chọn phương án tách hẳn hai nhánh như FIN-01 nếu muốn hình tự đứng rõ hơn.

## Chú thích WIP đề xuất (chưa áp dụng)

“Bản hình này mô tả origin/main@711a22e. Snapshot checkout HEAD5156820+WIP được kiểm ngày26/10 có khác biệt trước khi coordinator.begin tạo attempt: khi getAuthority đang chờ, đóng drawer hoặc suspend chưa chặn continuation trước begin. Sau begin, guard coordinator và guard callback UI vẫn có hiệu lực. Không dùng mô tả lifecycle của origin để khẳng định WIP tương đương.”

Không thêm chú thích này như một quy tắc sản phẩm mong muốn; đó là ghi nhận source hiện trạng. Sửa code là task riêng do chủ dự án quyết định.

## Findings và đề xuất cụ thể

### ID-P1 — Nguồn DB phải tách, chặn kết luận backend checkout đã xác minh

Vị trí: chú thích đầu F05/F06/F07/F08 (`docs/critical-flows.md:197,239,272,320`) và mọi bảng tổng mới muốn nói “DB hiện tại”. Gói hình ghim staging `ineckiashpwloncxnbqx`; endpoint project MCP đã xác định cũng là staging đó qua `db/connection-config.json`, nhưng cấu hình frontend local trỏ `kfqjdfwxhkdwihjobpny`. Tác động: 21 body khớp staging không chứng minh backend mà checkout local gọi, và metadata không chứng minh giao dịch/runtime. Đề xuất: ghi O/W/staging riêng; endpoint identity evidence riêng; giữ N1/N2 là checkpoint lịch sử bên cạnh catalog mới. Không gộp “local-env DB” với “staging MCP”. Đây là giới hạn bắt buộc của báo cáo review, không phải yêu cầu đổi code/hình ngay.

### ID-P2 — Delta ACL của W không được coi là bằng origin

Vị trí liên quan F08 “đọc qua RPC có quyền”: O `supabase/candidate/permission-read.sql:357–373` REVOKE ALL table+column; W `:357–370` REVOKE SELECT. Function bodies được vẽ giống nhau nhưng recipe schema/ACL không giống. Tác động: không dùng kết luận F08 để khẳng định W có cùng bề mặt đặc quyền DB hoặc mọi raw DML/DDL bị đóng; phụ thuộc ACL hiện hữu và các bước activation khác. Đề xuất: ghi delta này trong source scope; kiểm actual grants khi cần security acceptance. Không có claim hình cụ thể buộc phải đổi nếu vẫn mô tả đường production permission RPC.

### ID-P3 — Đề xuất không chặn: đem giới hạn F08 vào hình xuất

Vị trí: F08 `db-->>deviceA`, `db-->>realtime`, `realtime-->>deviceB` (docs:333–335). Caption :345 đã nói đúng: không đảm bảo giao nhận/thứ tự ACK. PNG một mình nhìn như tuần tự chắc chắn. Phản ví dụ: server commit, ACK A bị trễ/mất nhưng B nhận signal; hoặc B mất signal và menu không poll. Đề xuất lần sửa hình sau: note “nhánh khi signal đã đến; ACK và signal không có thứ tự nhận bảo đảm”, dùng nhánh tùy chọn cho delivery/refetch và thêm fallback tham chiếu F07/poll. Không đổi Mermaid trong lượt này. Không chặn khi giữ đúng quy tắc bộ hình phải đi cùng caption.

### ID-P4 — Đề xuất không chặn: F07 tách stale response khỏi lỗi phiên

Vị trí: câu hỏi `Phiên và response còn hợp lệ?` (docs:280). Code `permissionLifecycle.ts:97,104,109,115` im lặng bỏ response thuộc request/generation cũ; không khóa phiên mới. Caption hiện hữu :313 giữ đúng guard nhưng hình không có nhánh bỏ qua. Đề xuất đổi nhãn thành “Kết quả đọc revision hiện hành?” hoặc thêm nhánh “response cũ → bỏ qua”. Tránh người đọc hiểu response stale là lỗi session buộc logout.

### ID-P5 — Đề xuất không chặn: F05 gắn nhãn thành công lên cạnh cuối

Vị trí: `submit --> done` (docs:227). Caption :230 nói rõ nhánh thành công. Code `RequiredPinChangeScreen.tsx:137–140` vẫn ở màn khi PIN reuse/invalid input. Đề xuất ghi `applied` trên cạnh, thêm note “lỗi nhập liệu giữ màn; unknown ACK về login”. Đây là làm hình tự đứng được hơn, không sửa logic mô tả hiện có.



## Phân loại hành động

| Mã | Trạng thái / hành động cụ thể |
| --- | --- |
| FIN-01 | Mở, bắt buộc sửa trước khi nhận F04 hoàn toàn khớp O/W |
| FIN-WIP-02 | Đã xác nhận khác biệt bằng source + mock oracle; tài liệu phải ghi nguồn/giới hạn, chưa sửa app |
| ID-P1 | Đã xử lý trong hồ sơ này bằng tách S/L; không mở quyền kiểm DB L hoặc runtime |
| ID-P2 | Đã ghi delta ACL O/W; không nhận security acceptance |
| ID-P3–05 | Đề xuất không chặn khi hình đi cùng caption; nên làm nếu mang SVG độc lập vào luận văn |
| ERD | Không có sửa bắt buộc trong phạm vi36 cạnh; giữ chú thích rút gọn và môi trường |

F06 có kiểm expiry trước bước đọc MAC key FOR SHARE. Không dùng hình để hứa kiểm expiry sau mọi khả năng chờ khóa; xem trace F06-06. Chưa chạy thử concurrency này và không đổi expected requirement.
