# Kế hoạch kiểm thử

Ngày 24/10/2026. Phạm vi được chủ dự án chốt: chỉ B01 và B02, repo nguyentronglinh045/pos-cafe, tác giả commit và người tạo PR 24tx610002-VoVanNgoc. Màu/font/reference đã duyệt giữ nguyên. Hai runtimecontract app5191/ref4185 được duyệt qua phản hồi “Duyệt hai hợp đồng runtime B01–B02”. Không merge/deploy.

| Test | Nhóm | Bước/dữ liệu | Expected |
| --- | --- | --- | --- |
| T01 | Main/boundary |27viewport×1/2/5/6areas×short/80+names;chọnmọinút,resize |216fixtures;stabletoolbar,label/target44,activevisible,canvas>=44 |
| T02 | Boundary/accessibility |tap,wheel,next/prev,Tab/ShiftTab/Enter/Space568/1920×320 |scrollthật,edge/hideđúng,selection/tablecontextgiữ |
| T03 | Main |Lầu1B02+Americano→160k→keep/discard→125k→paymentmain→back |ID/lầu/tọađộ/totalđúng;khôngremakeB03 |
| T04 | Main |Lầu1empty→SizeL36k→save→inbếp→close→reopen |savedtotal36k,receipt36k,samearea |
| T05 | Exception |menu/order loading/error/empty/unavailable/paid/void |retry/recovery/disabled đúng bộB02 |
| T06 | Permission/security |cashier/deny,core/mockprotocol bypassUI |guardkhôngbịpresentationbypass;khôngDBproduction |
| T07 | Theme/responsive |editcommonpalette,CSS/Tailwind/MUI;matrix/sweep,100lines,120names,999qty |samefactory,font,tokens,scroll/focus/CTA |
| T08 | Measurement |79toolunit,11selftest,48calcontrols,3fidelitycases |negativecontrolsđúng;threshold/sourcebindinggiữ |
| T09 | Whole candidate |build,allunit,149browser,smoke,auditselftest23/14/16→app→ảnh,classify |khôngrequiredskip/fail/flaky;baselinegiữ |
| T10 | Publication |2review,scopeblobs,author/PRlogin/weeklabel,branches |correctrepo/account;noB03remake;nomerge/deploy |

Smoke scope-skips giữ lý do; không đếm là cađạt. NativeWindows test NOT_RUN sau hai capturetimeout; tablet/phonehardware,Supabase thật,OSkeyboard/browserzoom thật NOT_RUN. Mock local không thay xácminh cácmôi trườngnày.
