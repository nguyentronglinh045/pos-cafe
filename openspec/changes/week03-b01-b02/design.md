# Thiết kế

Ngày 24/10/2026. Phạm vi được chủ dự án chốt: chỉ B01 và B02, repo nguyentronglinh045/pos-cafe, tác giả commit và người tạo PR 24tx610002-VoVanNgoc. Màu/font/reference đã duyệt giữ nguyên. Hai runtimecontract app5191/ref4185 được duyệt qua phản hồi “Duyệt hai hợp đồng runtime B01–B02”. Không merge/deploy.

AreaChooser tại src/app/shell/FloorAreaChooser.tsx:17 và floorAreaSelector.css:3 dùng scrollLeft/ResizeObserver/RAF cleanup; FloorWorkspace.tsx:98 đặt hàng dãy lầu/thống kê. Không đổi business/canvas. B02 giữ OrderDrawer/OrderMenuPane/OrderCartPane/modifier/dirtyexit theo bản đã duyệt. Sharedtheme dùng mộtpalettefactory,refcountscope và fontimport; tailwindresetB01 giới hạn shell để không rò disabled/font sang B02. PortalDrawer dùng phiên bảnB01,không cần API overlay mới của B03.

Đối chiếu PaymentDrawer, các paymentpane/shared,ReceiptPreview và financialtests với main bằng blob/bytes. Reference B01v3 hash4285b1…af63; B02v3 dcfbc71…3c12. Hai contract mới chỉ đổi runtime5191/4185 và recipehai màn. Code đi cùng bundle61inputs+prepare-reference script từ chối overwrite khácbytes. Không phụ thuộc worktree cũ để chạy lại.

Ngưỡng/anchors/regions/matrix giữ approved; B01 chỉ1FHDstate, B02clean/dirty2FHDstates. Ngoài chúng chỉresponsive, không đođộgiốnggiả. Ngân sách reuse runtime/deps/browser, khônginstall/download hoặc deletecache. Bảo toàn ba candidatecũ. Kiểm thủ công nativeWindows chưa hoàn tất vì capturehelpertimeout; không giảđãkiểmmáythật.
