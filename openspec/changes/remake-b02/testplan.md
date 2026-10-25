# B02 — Test plan và kết quả local

Tiền điều kiện chung: mock main2da0d7e + candidate được owner duyệt, admin PIN123456/cashier111111, store0001-X8F3QA; không Supabaseproduction. Nơi hiện thực dự kiến: tests/ui-remake/b02/workspace.spec.ts, fixture riêng trong test, component tests OrderDrawer/Menu/Cart, existing pos flow/permission/write tests. Đã có tests/ui-remake/b02/workspace.spec.ts và harness.tsx cùng các test flow/guards/write hiện hữu; xem biên bản implementation để biết kết quả, source và giới hạn.

| TC | Truy vết UC | Mức/dữ liệu và bước cụ thể | Expected |
|---|---|---|---|
| TC01 | UC01,UC05 | FHD order24/B02, clean125000; chạy measurement.json đã bind approval | Pixel/anchor/font/tokens/regions theo ngưỡng đã duyệt |
| TC02 | UC01,UC03 | FHD click Americano35000 sau order24 | Dirty160000, CTA In/Gửi đơn, primary/payment semantics không đổi; fidelitycase dirty |
| TC03 | UC01 | Đổi4categories; search Americano ở category trà, xóa search; unavailable và image null/valid/broken | Kết quả/filter/disabled/fallback đúng, không fakebestseller/new/all |
| TC04 | UC01 | Cà phê sữa→modifier: thiếu required, single/multi, quantitymodifier, confirm/cancel | Validation/giá/options đúng; cancel không đổi draft |
| TC05 | UC02 | Qty0/1/999; tăng saved/giá menu đổi; note rỗng/dài; optsnapshot | Saved+ giữ qty/snapshot cũ, thêm dòng currentquote khi giá/options đổi; saved−/new± clamp0…999; zero saved vẫn ở draft, note/total từ flow đúng |
| TC06 | UC01,UC03 | Loading/reject UNKNOWN cho menu/order; retry; menu rỗng/searchkhôngkhớp; paid/void | State/CTA/notices không biến mất, retry tới được |
| TC07 | UC03 | Denyorder.create/update/voidOpen/payment.take; gọi flow bypass UI | FORBIDDEN và không write; không đổi ACL/backend |
| TC08 | UC03 | Remote version đổi khi dirty, PRICE_CHANGED, WRITE_RESULT_UNKNOWN, retry/recovery, navigationrace | Giữ draft/K/payload, disable đúng, không preview/submit lặp |
| TC09 | UC04 | Close clean; close dirty→keep/discard, cả chuột/touch/keyboard | Guard giữ hành vi; đóng/trở về sàn đúng |
| TC10 | UC05 | Matrix23viewport, width/heightbreakpoint±1 và sweep trong contract | Controls44, menu/cart/categoryscroll, không overflow/che CTA; không gánfidelity viewportthiếu reference |
| TC11 | UC02,UC05 | 120chartên/note,100items/100cartlines, large money, minimum568×320 | Scroll/ellipsis tênđầyđủ, tiền không bị cắt; đóng popup vàCTA tớiđược |
| TC12 | UC03,UC05 | Đổi canonicalprimary trong bản input test; kiểm CSS/Tailwind/MUI portal, đóng/mở scope | Cùng nguồn cập nhật, font local, không ảnh hưởng ngoài scope trái phép |
| TC13 | UC03,UC04 | Smoke gọi món→gửi/preview→mở lại→payment/back/dirty, dine_in/takeaway | Luồng/dữ liệu/quyền không đổi; B03khôngremake trongslice |
| TC14 | UC05 | Build,unit,smoke; auditselftest23/OK→appaudit→đọc/xemảnh/phânloại; 2reviewer | Mỗi verdict/source riêng, khôngauto baseline; mockkhôngnghiệmthuRLS/máythật |

Bốn nhóm: chínhTC01–05/13; ngoại lệTC04/06–08; biênTC05/10/11; quyền/bypassTC07/08. Các write error codes và thông báo phải giữ từ mapping hiện hữu; parameterized test phủ từng code liên quan. Không gọi DB thật: RLS/integration production NOT_RUN, không giả nhận được kiểm từ mock. Mã nguồn không đổi nghiệp vụ/SQL là ranh giới bắt buộc; nếu cần thay phải xin scope riêng.
