# Chỉ mục bằng chứng kiểm thử cho N5

Lập ngày 26/10/2026, phục vụ [ma trận 21 FR/8 NFR](../../regression-map.md) và [handoff N5](../../workflow/tasks/docs-test-traceability-2026-10-26.md). Đây là kết quả **đọc artifact cũ**, không phải chạy test mới.

## Nguồn và phạm vi

Run được [handoff UI](../../workflow/tasks/ui-main-docs-integration-2026-10-25.md) và [review UI](../ui-main-docs-integration-review-2026-10-25.md) gắn với `cf8e304869ad0e92c491736790f59bff1b6f9dcc` ngày25/10. Đối chiếu Git trong N5: source đó và main`711a22e71983e3d6aa17799649af05ce4c762555` cùng tree`395953d26e9702e307c49ed62a3a7773575be00d`. Không gọi đây là lần chạy trên merge SHA, hoặc chuyển backend lịch sử sang source này.

[Manifest](manifest.json) giữ SHA256/kích thước năm raw file đã đọc, source và blob của hai hồ sơ attribution. [Chỉ mục từng ca browser](browser-cases.json) chỉ giữ file/dòng/title/project/expected/actual status; bỏ cấu hình môi trường, log, attachment và payload. Không sao chép raw gốc vào Git. Quyền đọc raw vẫn phụ thuộc máy local, đường gốc được ghi trong manifest; hash không thay cho raw nếu cần điều tra sâu.

| Ký hiệu trong ma trận | Đã đọc được | Cách dùng |
| --- | --- | --- |
| U | Log Vitest: 113 files / 1.201 tests PASS, không có danh sách từng ca hoặc file | Chỉ ghi **suite PASS**. Test source trong bảng là ca được chọn để truy vết, không có receipt riêng cho từng ca. Không có coverage run trong log này. |
| B | JSON targeted browser: 26 PASS / 0 skip, từng project và attempt | Có thể ghi PASS cho đúng file/dòng/title/project trong JSON. |
| S | JSON full mock smoke: 44 PASS / 37 skip trong 81 bản ghi | Chỉ nhận ca thực chạy; skip là applicability ghi trong source/report, không tính thành PASS. |
| BUILD | Log `tsc -b && vite build` hoàn tất, handoff ghi PASS | Giữ cảnh báo chunk lớn hơn 500 kB; không suy hiệu năng/triển khai. |

U/B/S/BUILD đều là phần của **E-UI** tại [testing](../../testing.md#bản-đồ-bằng-chứng), không phải một bộ TC hoặc requirement mới. Tên project trong S gồm desktop, tablet-landscape, phone-landscape, small-landscape, portrait và demo-runbook; xem JSON để biết tổ hợp thật sự chạy. B/S là môi trường mock/fixture; cảnh `offline` được mô phỏng không là thử lỗi mạng/backend thật. Tổng các bản ghi không là số nghĩa vụ đã phủ.

## Cách tái đối chiếu

1. Đọc source attribution và lệnh/môi trường ở handoff UI; không suy source chỉ từ tên file raw.
2. Kiểm hai Git tree bằng `git rev-parse <SHA>^{tree}`. Đọc test/config ở đúng main SHA trên; không dùng WIP trong checkout.
3. Kiểm SHA256/kích thước raw theo manifest. Với JSON Playwright, duyệt đệ quy `suites`, `specs`, từng `tests[]` và `results[]`. Khóa tra cứu là run + file + line + title + project; dòng source có thể chứa nhiều biến thể.
4. PASS trong chỉ mục đòi `status=expected`, `expectedStatus=passed`, có attempt và mọi attempt là `passed`. SKIP giữ `status=skipped`. Đối chiếu totals với `stats`: B26/0, S44/37; không có unexpected/flaky trong hai report. Không suy kết quả từng step có điều kiện từ PASS của cả test.
5. Với unit chỉ giữ tổng kết 113/1.201; [Vitest include](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/vitest.config.ts#L10) chọn `src/**/*.{test,spec}.{ts,tsx}`. Contract/backend, browser và Node tooling có runner riêng. Muốn kết luận từng unit case phải thu report chi tiết trong lượt kiểm được giao sau.

Kiểm N5 chỉ xác minh chỉ mục, liên kết và nguồn. Không chạy lại suite, tạo lab, SELECT DB, sửa code/DB, bỏ skip, đổi threshold hoặc viết lại evidence cũ. Recipe chạy sản phẩm vẫn ở handoff/source operator guide, không nhân bản thành runner trên docs.
