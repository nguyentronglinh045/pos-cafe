# Bằng chứng thực chạy và recipe

Không có test nghiệp vụ trên Supabase được chạy. Mọi JSON DB ở db/ là SELECT catalog/pg_get_functiondef; database role read-only. Các test contract/Playwright được đọc để tìm nhánh, không được ghi PASS.

## Regression lifetime nhẹ đã chạy

Lấy nguyên assertions của O/src/features/pos/orderFlow.lifecycle.test.ts. Hai relative imports ./orderFlow và ./writeOperationFlow được đổi thành alias @/features/pos tương ứng, để một test oracle dùng lần lượt toàn source snapshot O và W. Không đổi expected/assertion/fixture. Harness và outputs ngoài repository; dependency có sẵn từ D:/Workspace/pos-cafe/node_modules; Vitest4.1.10, jsdom, một worker. Không cài thêm hoặc symlink node_modules.

| Run | Lệnh/config | Exit | Kết quả |
| --- | --- | --- | --- |
| Chuẩn bị1 | checkout.config.mjs, root repo/include absolute Windows | 1 | No test files found;0 assertion, không là business failure |
| Chuẩn bị2 | root artifact; alias vitest tới CommonJS entry | 1 | Import error;0 assertion, không là business failure |
| W chính thức | node D:/Workspace/pos-cafe/node_modules/vitest/vitest.mjs run --config C:/Users/nguye/.codex/visualizations/2026/10/26/01a17779-e86e-7a83-86fd-20aaccf28435/semantic-review/checks/checkout.config.mjs | 1 |12 tests,0 pass/12 fail/0 skip; oracle không nhận WRITE_RESULT_UNKNOWN như yêu cầu |
| O đối chứng | cùng runner, config checks/origin-main.config.mjs | 0 |12 tests,12 pass/0 fail/0 skip |

[recipe/import hashes](C:/Users/nguye/.codex/visualizations/2026/10/26/01a17779-e86e-7a83-86fd-20aaccf28435/semantic-review/checks/recipe.json); [test copy](C:/Users/nguye/.codex/visualizations/2026/10/26/01a17779-e86e-7a83-86fd-20aaccf28435/semantic-review/checks/lifecycle.test.ts); [W JSON](C:/Users/nguye/.codex/visualizations/2026/10/26/01a17779-e86e-7a83-86fd-20aaccf28435/semantic-review/checks/lifecycle-checkout-attempt3.json); [O JSON](C:/Users/nguye/.codex/visualizations/2026/10/26/01a17779-e86e-7a83-86fd-20aaccf28435/semantic-review/checks/lifecycle-origin-main-attempt3.json). Source/dependency identity được ghim trong source-manifest và final evidence manifest. Không đổi source sau test. Hai lần harness lỗi giữ lại, không gộp thành test nghiệp vụ.

Giới hạn phép thử: mock in-memory; kiểm continuation trước begin, không mô phỏng browser đóng drawer trực tiếp hay Postgres locks. Các ca void dùng seeded order open nên không suy tất cả12 ca đã tạo hiệu ứng nghiệp vụ thành công; chỉ khẳng định tất cả12 oracle lifetime thất bại ở W. Các ca thanh toán/tách/submit trả business value thay vì chặn lifetime. Không suy concurrency DB an toàn/hỏng từ các kết quả này.

## Catalog và checks nhẹ khác

[connection-config](C:/Users/nguye/.codex/visualizations/2026/10/26/01a17779-e86e-7a83-86fd-20aaccf28435/semantic-review/db/connection-config.json), [probe read-only](C:/Users/nguye/.codex/visualizations/2026/10/26/01a17779-e86e-7a83-86fd-20aaccf28435/semantic-review/db/probe.json), [query catalog](C:/Users/nguye/.codex/visualizations/2026/10/26/01a17779-e86e-7a83-86fd-20aaccf28435/semantic-review/db/queries.json) và raw captures giữ nguồn. Thu riêng helper-definitions và invariant-definitions có query trong raw tương ứng. Không đọc secret hay hàng khách hàng. Migration ledger chỉ có bootstrap marker version20261022092646; vì vậy không suy deployment theo danh sách001–017 đã replay từng bước. Schema/definition thực quan sát là căn cứ cấu trúc S.

Recipe đã thực chạy: erd-source-check.cjs; erd-catalog-check.cjs; finance-verify.cjs; verify-identity.cjs. Kết quả:36 FK/35 entity/6 standalone;37 financial overload body matches;21 identity/read/signal matches. Các body cùng tên/overload được so với source có hiệu lực đã chỉ rõ; không coi toàn bộ public/private function catalogue đã kiểm. Invariant definitions được lấy thêm để đọc, không cộng vào số body comparison khi chưa chạy so.

## Kiểm hình

Reviewer financial xem F01–04; identity xem F05–08; ERD xem ERD01–08. Hash SVG và PNG khớp manifest docs; root trực tiếp xem lại F04 và thấy nhãn “Get thấy trạng thái nào?” tại điểm hội tụ. Đây là kiểm truyền tải ngữ nghĩa trên hình đã render sau source inspection, khác APPROVE renderer lịch sử. Không chạy finalize.py/publish.py/checkpoint.py, không mở HTML cũ hoặc trình duyệt mới. Không suy print/Word/A4 đạt.

## Bảo toàn và khả năng tái kiểm

Source snapshot + manifest giữ code WIP và tests cần cho kiểm lại; không cần khôi phục vào main. Không checkout/switch/reset/stash/clean/worktree/commit/push. Trạng thái main/index, HEAD, các hash source và remote được kiểm lại bằng preservation.json; hồ sơ evidence/review cũ không bị sửa. Final receipt ghi kiểm này riêng để không biến quy trình dự kiến thành kết quả.

Tổng artifact source chỉ khoảng11 MB trước evidence bổ sung; không dựng môi trường nặng. Các cache Vitest nhỏ trong checks/cache-* là dữ liệu tái tạo, chỉ dọn nếu chủ dự án cho phép. Source snapshot, raw catalog, reports và recipe là bằng chứng cần giữ, không mặc định temp.
