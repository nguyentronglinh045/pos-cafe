# Hoãn timing T04 và điều kiện tích hợp phân quyền vào main — 24/10/2026

## Quyết định mới của người dùng

Nguồn trực tiếp: “vậy thì hoãn nó, nhưng mà có thể cập nhật phần phân quyền vào main chưa (ý tôi là các phần ta làm ấy)”. Theo ngữ cảnh câu trả lời ngay trước, **hoãn phần timing59/60/61 của T04 và việc triển khai browser-worker thay thế**. Không chạy thêm CI/T04/worker trong lượt hỏi readiness này. Giữ kết quả DIAGNOSTIC_FAIL và các thư mục control theo chỉ đạo tạm chưa xóa.

Phần hỏi cập nhật main được xử lý là đánh giá/chuẩn bị quyết định tích hợp. Chưa diễn giải câu này thành miễn tất cả acceptance backend còn thiếu hoặc cho phép merge/deploy ngay. Không thay lịch sử run cũ, không ghi phần hoãn thành PASS.

## Candidate cụ thể đang có

- Main remote: `2da0d7e10d65ed4e79c8628d65220582a6cbd32b`.
- Remote publication branch `review/permission-staging-20261023` ở `4e78a8c11d2d895ccebaccd2b2f7d3b2c69bcb3e`. Local checkout branch `fix/operator-indexeddb-evidence-20261022` sạch, cùng SHA.
- Delta từ main:89commits/701paths, trong đó208paths dướisrc và15paths dướiSupabase. Đây là cả phần tích hợp phân quyền, không chỉ12file sửa helper gần nhất. Không có slice ứng dụng độc lập đã được duyệt để cherry-pick chỉ dựa vào tênfile hoặc CI PASS.
- [Diff candidate cụ thể](https://github.com/nguyentronglinh045/pos-cafe/compare/2da0d7e10d65ed4e79c8628d65220582a6cbd32b...4e78a8c11d2d895ccebaccd2b2f7d3b2c69bcb3e).
- [PR6](https://github.com/nguyentronglinh045/pos-cafe/pull/6) còn draft, head `7fa52d803432eedc1b3d3e71e0a60162519ab7e7` là ancestor của candidate hiện tại; chưa cập nhật PR trong lượt này.
- Fresh CI40081353958/a1 PASS18. Diagnostic40082616309/a1 FAIL timing:6Candidate và21imageobservations gồmwarm/fresh đã qua; requesttarget59s ở60,657s. Đây chưa là fullbackend acceptance.

## Điều kiện merge hiện hành

Owner từng chốt rõ: **“Giữ cổng cũ: chỉ push main khi đủ full gate; tới11h chưa đạt thì giữ candidate riêng”** tại [task release](../../workflow/tasks/permission-release-2026-10-22.md:13). A18/D19 vẫn giữ baseTC53/PIN19/PERM60 và runtime đúngsource; A18 chỉ hoãnHP1, không miễn các nghĩa vụ non-HP1: [proposal](../../../openspec/changes/redesign-permission-model/proposal.md:168).

Vì vậy **chưa đủ điều kiện merge theo quyết định đang có**. Hoãn timing không tự miễn9stage sau image của whole T04,7service execution profiles và các supplemental obligations chưa được đóng. First9PASS ở source cũ không biến thành current wholePASS. Hai review gần nhất chỉ duyệt đúngsource/local/diagnostic/evidence scope; không thay finalreview toàn701paths cho merge.

Live main protection đọc qua gh sau connector bị403: required PR, strict required check `Build, unit, tooling and mock UI`, enforceadmins=true. Không thay protection hoặc bypass nó. CI xanh theo GitHub không tự thay cổng nghiệm thu của chủ dự án.

## Có thể tách merge code khỏi deploy

Việc tích hợp mã vào main và triển khai/bật phân quyền là hai hành động riêng. Source hiện tại có `vercel.json:5` deploymentEnabled=false; `scripts/project-release.mjs:7` PRODUCTION_ENABLED=false; Preview/release workflows dùngworkflow_dispatch. Không suy từ source thành đã readback mọi live hold trong lượt này. D19 yêu cầu kiểm productionhold thực tế trước khi chọn tách merge khỏi rollout.

Nếu owner muốn ưu tiên đưa code vào main để tiếp tục phát triển, cần chốt **quyết định mới về điều kiện merge**: cho phép tích hợp khi acceptance backend còn thiếu được ghi DEFERRED, giữ no deploy/no DB migration/activation và không gọi feature nghiệm thu đầy đủ. Quyết định này phải bao quát phần backend còn thiếu ngoài timing; không phải chỉ bỏ một assertion.

Sau quyết định đó mới cập nhật/chuẩn bị PR đúngcandidate, review toànphạmvi tích hợp với hai reviewer độc lập, chạy required PR CI đúnghead/mergecandidate và merge qua protection thông thường. Main CI chạy sau merge; không đòi mainCI trước merge. Không thêm HP1/HP2/IDEM087 hoặc backup/restore production thành gate merge mới. Không có đảm bảo rằng bản hiện tại đã đủ an toàn/nghiệm thu chỉ từ CI18.

Nếu giữ quyết định fullgate trướcmerge, candidate tiếp tục trên reviewbranch; timingDEFERRED và main chưa thay đổi. Câu hỏi cần owner chốt nếu muốn đi đường khác là **đổi điều kiện tích hợp mã trước fullbackend gate**, không phải xin lại quyền cho một thao tác kỹ thuật đã được cho phép.

Lượt này: chỉ đọc Git/GitHub/docs và cập nhật hồ sơ hoãn/readiness. Không sửa application/source, không push/PR mutation/merge/deploy, không chạy runtime hoặc xóa control.

24/10, quyết định mới sau báo cáo này: owner chọn “ưu tiên merge main, sau đó tính tiếp”, cho phép tích hợp mã trước full backend acceptance theo điều kiện review toàn diff + PR CI và giữ khóa deploy/DB. Quyết định PENDING phía trên đã được giải quyết bằng [M24/task tích hợp](../../workflow/tasks/permission-main-integration-2026-10-24.md); nội dung trước giữ làm lịch sử, không còn là blocker ủy quyền merge.
