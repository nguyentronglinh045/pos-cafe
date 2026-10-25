# Tech Stack & Technical Tradeoffs

File này là technical decision record rút gọn. Mỗi quyết định nêu rõ dùng gì, vì sao chọn, không chọn gì, đánh đổi và cách giảm rủi ro.

[Chỉ mục quyết định](workflow/decisions.md) phân biệt nguồn chốt, lịch sử phương án, phần đã xác nhận và chỗ còn thiếu căn cứ. Những lựa chọn mô tả dưới đây không tự là benchmark hoặc phê duyệt mới.

## Phiên bản nguồn ngày 25/10/2026

Đối chiếu `package-lock.json` tại main711a22e; các lựa chọn/lý do bên dưới là hồ sơ quyết định, không phải benchmark mới. Chi tiết runtime permission đọc ở [architecture](architecture.md), thay mô tả legacy trong các phase cũ.

| Nhóm | Phiên bản khóa trong source |
| --- | --- |
| Runtime/build | React 18.3.1, Vite 8.0.16, TypeScript 5.9.3 |
| Data/state | Supabase JS 2.108.1, TanStack Query 5.101.0, Zustand 4.5.7 |
| UI | MUI 5.18.0, Tailwind 3.4.19, Recharts 2.15.4, react-hot-toast 2.6.0, Lucide 0.468.0 |
| Test | Vitest 4.1.11, Playwright 1.60.0, Testing Library React 15.0.7 |

Vite 8 yêu cầu Node `^20.19.0 || >=22.12.0`; môi trường build/deploy phải thỏa engine này.

## Architectural Pattern: Hexagonal Architecture / Ports & Adapters

**Nguồn quyết định:** chủ dự án xác nhận hồi cứu ngày 25/10/2026 rằng mình chọn kiến trúc cuối cùng dựa trên thông tin AI cung cấp. Động cơ chính đã được xác nhận; phương án DDD và bối cảnh chấp nhận đánh đổi còn cần đối chiếu. [Hồ sơ làm rõ](workflow/tasks/docs-knowledge-clarification-2026-10-25.md#dec-arch-01--nguồn-của-quyết-định-lựa-chọn-kiến-trúc) giữ nguồn và giới hạn; ngày xác nhận không phải ngày lựa chọn ban đầu.

- **Quyết định:** dùng Ports & Adapters, lấy cảm hứng từ Hexagonal Architecture.
- **Dùng cho:** tách UI/feature flow khỏi Supabase, realtime, print và mock data.
- **Động cơ chủ dự án xác nhận:** tách rõ trách nhiệm giữa các phần ngay từ đầu để có thể thích ứng khi UI thay đổi hoặc chuyển công nghệ cơ sở dữ liệu, giảm phụ thuộc giữa nghiệp vụ với phần giao tiếp và hạ tầng.
- **Lý do bổ sung từ tài liệu cũ:** kiểm thử/demo ổn định và cô lập SDK backend. Chưa đồng nhất các lý do này với thứ tự ưu tiên cá nhân khi quyết định.
- **Cách tổ chức tránh theo tài liệu cũ:** để React components gọi trực tiếp Supabase client, print API hoặc realtime SDK; chưa có hồ sơ cho thấy đây là toàn bộ phương án đã được đem ra so sánh.
- **Phương án cần xác minh:** chủ dự án nhớ từng cân nhắc DDD nhưng chưa rõ cách áp dụng cụ thể và lý do không chọn. DDD có thể kết hợp với Hexagonal; xem nguồn thuật ngữ trong hồ sơ làm rõ. Chưa ghi kết luận “DDD không phù hợp với dự án”.
- **Đánh đổi có căn cứ tài liệu:** thêm interface, mapper và adapter; đã được ghi tại [tech-stack ngày 21/06/2026](https://github.com/nguyentronglinh045/pos-cafe/blob/7413fc4213e1988f023922c4aca6af5633b1d540/docs/tech-stack.md#L11), phù hợp ký ức “viết nhiều code hơn” nhưng chưa xác minh bối cảnh chủ dự án chấp nhận hoặc định lượng chi phí.
- **Giảm rủi ro theo thiết kế đã ghi:** giữ `AppPorts` nhỏ, adapter Supabase/mock cùng implement contract, print/realtime cũng đi qua port riêng.
- **Giới hạn:** mục tiêu giảm tác động khi thay UI/DB không chứng minh đã thay được mọi công nghệ, hoặc việc chuyển DB chỉ cần đổi adapter. Không mở kế hoạch chuyển công nghệ từ xác nhận này.
- **Đầu vào cho báo cáo:** dùng động cơ đã xác nhận, nguồn lý thuyết đã đọc và mô tả kỹ thuật ở [architecture](architecture.md); giữ rõ phần lịch sử chưa xác minh và khả năng tương lai chưa được kiểm chứng.

## 1. React + Vite + TypeScript

- **Quyết định:** dùng React 18, Vite, TypeScript.
- **Dùng cho:** frontend single-page POS app.
- **Vì sao chọn:** setup nhanh, build nhanh, phù hợp UI nhiều state/drawer, dễ deploy static, TypeScript giúp khóa domain DTO và port interface.
- **Không chọn:** Next.js/full-stack framework.
- **Đánh đổi:** không có routing/server rendering built-in; API/backend phải do Supabase đảm nhiệm.
- **Giảm rủi ro:** app là single URL POS nên không cần SSR; navigation dùng Zustand/internal state.
- **Liên quan tới tiểu luận:** chứng minh ưu tiên đúng bài toán POS realtime nội bộ thay vì dùng framework nặng hơn scope.
- **Form hiện tại:** controlled state + validation thủ công. `react-hook-form`, `@hookform/resolvers` và `zod` không được sử dụng nên đã bị gỡ khỏi dependency ở `main@b7b7262`; không liệt kê chúng như công nghệ của báo cáo hiện trạng.

## 2. Supabase

- **Quyết định:** dùng Supabase làm backend managed.
- **Dùng cho:** Postgres, store Auth, employee session qua RPC, RLS, realtime và cloud demo; role owner không đồng nghĩa email ownership đã hoàn tất.
- **Vì sao chọn:** miễn phí cho demo, có Postgres quan hệ, realtime và RLS sẵn; giảm thời gian tự build backend.
- **Không chọn:** tự viết NestJS/VPS, PocketBase, Firebase.
- **Đánh đổi:** phụ thuộc managed service và online connection; giới hạn free tier.
- **Giảm rủi ro:** ports/adapters cô lập Supabase; demo runbook có bước wake/check Supabase trước demo.
- **Liên quan tới tiểu luận:** có thể giải thích tradeoff giữa tốc độ phát triển, dữ liệu quan hệ và realtime multi-device.

## 3. PostgreSQL + RPC + RLS

- **Quyết định:** nghiệp vụ quan trọng chạy qua Postgres tables/RPC/RLS.
- **Dùng cho:** xác minh PIN, submit order, full/split payment, hủy đơn paid, clear demo data, helper quyền và store-scoped data. Runtime xác minh phiên qua permission identity, ghi tài chính qua register/execute và đọc qua projections. Các RPC submit/pay/verify cũ là legacy, không phải API để UI fallback. Nguồn: `src/adapters/supabase/permissionIdentityRepo.ts:41`, `src/adapters/supabase/writeOperationRepo.ts:33`, `src/ports/permissions.ts:59`.
- **Vì sao chọn:** order/payment cần transaction, lock version, snapshot giá/tên và consistency bàn/order/payment.
- **Không chọn:** để client tự tính và ghi nhiều table rời rạc.
- **Đánh đổi:** SQL/RPC phức tạp hơn CRUD client đơn giản.
- **Giảm rủi ro:** RPC boundary rõ, test migration/RPC, adapter map lỗi thành `AppError`.
- **Liên quan tới tiểu luận:** thể hiện xử lý consistency và concurrency trong bài toán POS thật.

## 4. Realtime Invalidate/Refetch

- **Quyết định:** realtime event chỉ là tín hiệu invalidate/refetch.
- **Dùng cho:** menu, floor, open orders, payment/report sync giữa nhiều máy.
- **Vì sao chọn:** giảm bug merge state thủ công, phù hợp data nhỏ của cafe/demo.
- **Không chọn:** patch cache thủ công từ từng payload hoặc offline-first replication.
- **Đánh đổi:** có thêm request refetch và không tối ưu tuyệt đối realtime latency.
- **Giảm rủi ro:** TanStack Query cache tập trung; realtime adapter gọi invalidate theo domain.
- **Liên quan tới tiểu luận:** giải thích được lựa chọn đơn giản, ổn định hơn cho MVP nhưng vẫn chứng minh multi-device sync.

## 5. Ports/Adapters

- **Quyết định:** UI/features phụ thuộc `AppPorts`, không phụ thuộc trực tiếp Supabase.
- **Dùng cho:** production surface permission/write/auth/seed/print. Permission nhóm các cổng read/admin/session/changes/signals/images/print; raw repos thuộc LegacyAppPorts cho kiểm tương thích. Nguồn: `src/ports/index.ts:154`.
- **Vì sao chọn:** dễ test bằng mock adapter, dễ đổi backend/offline sau này.
- **Không chọn:** import Supabase client trực tiếp trong components/features.
- **Đánh đổi:** phải duy trì interface và mapper.
- **Giảm rủi ro:** port surface nhỏ, adapter Supabase/mock cùng implement contract.
- **Liên quan tới tiểu luận:** chứng minh kiến trúc tách layer và khả năng mở rộng.

## 6. TanStack Query

- **Quyết định:** dùng TanStack Query cho server state.
- **Dùng cho:** menu, floor plan, orders, history, reports, settings.
- **Vì sao chọn:** cache, loading/error state, refetch/invalidate hợp với realtime signal.
- **Không chọn:** tự viết global store cho server state trong Zustand.
- **Đánh đổi:** cần quản lý query keys và invalidation discipline.
- **Giảm rủi ro:** query keys theo store/employee/generation/purpose, mutation hooks refetch đúng scope (`src/features/shared/permissionSession.ts:76`).
- **Liên quan tới tiểu luận:** phân biệt server state và UI state rõ ràng.

## 7. Zustand

- **Quyết định:** dùng Zustand cho UI/navigation state.
- **Dùng cho:** pre-login screen, current employee, active area/category, drawer context, draft/payment context.
- **Vì sao chọn:** nhẹ, dễ đọc, phù hợp single URL app.
- **Không chọn:** Redux hoặc route-based navigation.
- **Đánh đổi:** phải tự giữ invariant khi mở/đóng drawer.
- **Giảm rủi ro:** store nhỏ, action rõ: `openOrder`, `openPayment`, `openDrawer`, `closeDrawer`.
- **Liên quan tới tiểu luận:** phù hợp POS thao tác nội bộ không cần browser history phức tạp.

## 8. MUI + Tailwind + Design Tokens

- **Quyết định:** dùng MUI components kết hợp Tailwind utilities và token POS.
- **Dùng cho:** buttons/forms/dialogs/drawers/layout và shared portal primitives.
- **Vì sao chọn:** MUI giúp form/control nhanh; Tailwind giúp chỉnh layout responsive và visual polish trực tiếp trong TSX.
- **Không chọn:** CSS file lớn hoặc design system tự viết từ đầu.
- **Đánh đổi:** có nguy cơ style lẫn lộn nếu không có quy tắc.
- **Giảm rủi ro:** ưu tiên Tailwind utilities, token tập trung, test chống legacy CSS class, chuẩn hóa popup/drawer bằng `PortalPopup` và `PortalDrawer`.
- **Liên quan tới tiểu luận:** cho thấy cân bằng giữa tốc độ build UI và khả năng redesign.

## 9. Vitest + Playwright

- **Quyết định:** dùng Vitest cho unit/component/feature tests và Playwright cho smoke E2E.
- **Dùng cho:** core logic, adapters, permission/transaction flows, drawer behavior, demo flow, Supabase realtime và nghiệp vụ cloud smoke.
- **Vì sao chọn:** nhanh trong local, hợp Vite, Playwright kiểm chứng flow người dùng thật.
- **Không chọn:** chỉ manual test hoặc chỉ unit test.
- **Đánh đổi:** E2E tốn thời gian hơn unit test và cần data/test mode ổn định.
- **Giảm rủi ro:** tách `npm run test`, `npm run smoke`, `npm run smoke:supabase`.
- **Liên quan tới tiểu luận:** có bằng chứng kiểm thử từ logic tới flow demo.
- **Kết quả kiểm chứng:** xem [testing.md](testing.md); không sao chép số baseline lịch sử vào decision record.

## 10. Browser Print Preview

- **Quyết định:** popup/iframe UI render preview cho phiếu tạm và hóa đơn; `BrowserPrintPort` hiện no-op và chỉ giữ seam cho adapter thiết bị tương lai.
- **Dùng cho:** order ticket và final receipt trong `ReceiptPreview`.
- **Vì sao chọn:** đủ demo, không phụ thuộc driver/máy in, chạy được trên web deployment.
- **Không chọn:** native printer, USB, ESC/POS, service in local.
- **Đánh đổi:** không phải tích hợp máy in POS thật.
- **Giảm rủi ro:** giữ seam `IPrintPort` cho adapter thiết bị, còn authorization mỗi click qua permission print; không bypass grant/reprint gate khi đổi adapter.
- **Liên quan tới tiểu luận:** giải thích phạm vi web/free demo và seam mở rộng phần cứng.

## 11. Online-Only Phase Này

- **Quyết định:** phase tiểu luận là online-only.
- **Dùng cho:** toàn bộ app web và Supabase realtime.
- **Vì sao chọn:** yêu cầu chính là sync nhiều máy; offline-first sẽ làm tăng lớn độ phức tạp.
- **Không chọn:** RxDB/local-first/offline replication ngay trong phase này.
- **Đánh đổi:** mất mạng thì không dùng được.
- **Giảm rủi ro:** thiết kế seam: UUID client, timestamps, soft delete editor, ports/adapters, realtime transport tập trung.
- **Liên quan tới tiểu luận:** trình bày được điểm yếu đã biết và hướng nâng cấp sau.

## 12. Cash-Only Payment Phase Này

- **Quyết định:** payment flow thật chỉ dùng tiền mặt trong phase tiểu luận.
- **Dùng cho:** payment drawer, `pay_order`, receipt.
- **Vì sao chọn:** cash là flow POS nền tảng, dễ demo end-to-end và đủ kiểm chứng transaction order/payment/table.
- **Không chọn:** QR/bank/e-wallet processing thật ngay trong phase này.
- **Đánh đổi:** chưa cover thanh toán điện tử thật.
- **Giảm rủi ro:** schema có `payment_method` và `store_settings.qr_info` seam; Payment Settings/QR hiện là preview/local UI, chưa persist qua `settingsRepo` và không claim processing thật.
- **Liên quan tới tiểu luận:** tập trung vào nghiệp vụ lõi và consistency thay vì tích hợp cổng thanh toán ngoài.

## 13. Deployment & Runtime Mode

- **Quyết định:** frontend build tĩnh bằng Vite và cấu hình deploy Vercel; backend dùng Supabase managed.
- **Vercel contract:** `npm ci` → `npm run build` → publish `dist`; SPA rewrite mọi path về `index.html`.
- **Runtime env:** `VITE_DATA_MODE=supabase`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- **Fallback quan trọng:** khi không ép mode và không đủ URL/key, `runtimePorts` chọn mock; đủ URL/key chọn Supabase, mode explicit có ưu tiên (`src/app/runtimePorts.ts:16`). Vì vậy mở được deployment chưa đủ chứng minh đang nối cloud; phải kiểm tra mode/env và data thật.
- **Backend prerequisite:** source main711a22e có migrations001–017 và candidate fragments với gate activation riêng. Recipe001–013 cũ không đủ cho runtime mới; không replay migration007 hoặc apply candidate vào đích từ trang này. Xem [data-model](data-model.md) và handoff được giao.
- **Đánh đổi:** deploy nhanh và chi phí thấp, nhưng phụ thuộc trạng thái Supabase/Vercel và cấu hình env.
- **Mức claim hiện tại:** repository có cấu hình build/deploy; **chưa xác nhận deployment-ready cho runtime backend mới**. Chỉ claim deployment live đã xác minh khi có URL, commit/version và ngày kiểm tra cụ thể.
