import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('.',import.meta.url));
const data=JSON.parse(readFileSync(join(root,'ket-qua.json'),'utf8'));
const measures=JSON.parse(readFileSync(join(root,'do-dac-mang-di.json'),'utf8'));
const steps=data.results.flatMap(c=>c.steps);
const countImages=dir=>readdirSync(dir,{withFileTypes:true}).reduce((n,e)=>n+(e.isDirectory()?countImages(join(dir,e.name)):/\.png$/.test(e.name)?1:0),0);
const esc=s=>String(s).replaceAll('|',' / ').replaceAll('\n',' ');
const first=measures[0];
const lines=[
'# Kết quả kiểm tra theo phiếu chạy tay tuần 7',
'',
'> **Người thực hiện: AI (Codex), kiểm tra UI tự động qua Playwright/Chrome headless. Đây chưa phải kết quả Ngọc tự chạy tay.** Công cụ điều khiển giao diện trực tiếp không kết nối được: `Computer Use native pipe is unavailable` và `The browser access host is unavailable`. Phiếu gốc và ô xác nhận của Ngọc được giữ nguyên.',
'',
`Ngày 20/11/2026, giờ UTC+7. Lượt lưu kết quả: **${data.results[0].start}–${data.results.at(-1).end}**.`,
'',
'## Phạm vi và môi trường',
'',
'- Theo [phiếu gốc](../chay-tay/phieu-chay-tay.md): N01-11, N01-12, màn mang đi 568×320; thêm bước kiểm tra sau N01-12 B6 theo yêu cầu trong phiếu.',
'- Mã nguồn: `'+data.source+'`. Dữ liệu giả `VITE_DATA_MODE=mock`, URL `'+data.baseURL+'`; không dùng backend thật.',
`- Chrome ${data.browserVersion}, headless, Playwright. Mỗi ca một browser context mới, dữ liệu/lưu trữ tách biệt, tương đương mục đích đặt lại dữ liệu của cửa sổ InPrivate.`,
'- N01-11/N01-12: viewport 1366×768. Mang đi: viewport 568×320 CSS px, DPR 1. Đây là kích thước vùng trang, không phải cửa sổ Edge hay thiết bị cảm ứng thật.',
'- Đăng nhập bằng Store Key/PIN demo trong phiếu. Chỉ bấm các thao tác trên UI; không sửa dữ liệu mock qua API, không bấm Hoàn tất thanh toán.',
'- Nút trong khung chi tiết mang đi được tiếp cận bằng cuộn chuột ngang/dọc và kiểm tra điểm giữa không bị che trước khi bấm; không dùng ép bấm (`force`). Các nút khác dùng click locator của Playwright, có thể được tự cuộn vào vùng nhìn thấy.',
'',
'## Tổng hợp',
'',
'| Ca | Bắt đầu | Kết thúc | Kết quả hành vi |',
'| --- | --- | --- | --- |',
...data.results.map(c=>`| ${c.caseId} | ${c.start} | ${c.end} | ${c.steps.filter(s=>s.status==='ĐÚNG').length}/${c.steps.length} ĐÚNG |`),
'',
`Tổng **${steps.filter(s=>s.status==='ĐÚNG').length}/${steps.length} kiểm tra hành vi ĐÚNG**: 18 bước trong bảng phiếu và 1 kiểm tra sau B6. Có **${countImages(join(root,'anh'))} ảnh PNG**; lỗi JavaScript trang ghi nhận: ${data.results.reduce((n,c)=>n+c.pageErrors.length,0)}. Cỡ nút chỉ ghi nhận để đối chiếu GD-01, không chấm đạt/không đạt.`,
'',
'## Điểm cần theo dõi và so với lượt 14/11',
'',
'- **N01-11 B4:** hành vi bỏ thay đổi đúng, nhưng nhãn vẫn là **“Bỏ đơn”**. CX-03 mong muốn “Bỏ thay đổi” cho đơn đã gửi; tình trạng này giống mốc 14/11. Xem [hộp xác nhận](anh/N01-11/B4-hop-xac-nhan.png). Không dùng kết quả ĐÚNG hành vi để kết luận CX-03 đã sửa.',
'- **N01-12 B5:** khi khách đưa 125đ, Hoàn tất bị khóa và **không có nút Đúng tiền**. Giống mốc 14/11; CX-02 vẫn cần theo dõi. B6 đã nhập lại 200000 trước khi bấm nút nhanh theo đề xuất trong phiếu.',
'- **Mang đi T4c/T4d:** lượt này cuộn ngang **72px**, dọc **150px**, rồi bấm được cả hai nút trong khung chi tiết và tới đúng #26/84.000đ. Mốc 14/11 ghi ngang 49px: **khác 23px**; không suy đoán nguyên nhân. Không có tràn toàn trang (scrollWidth/clientWidth = 568/568; scrollHeight/clientHeight = 320/320); vẫn có cuộn trong khung.',
'- Ở 568×320, khung chi tiết bên phải bị cắt một phần trước khi cuộn ngang; tổng tiền và hai nút trong khung này nằm ngoài vùng nhìn thấy ban đầu. Cuộn xuống/ngang tới nút thì nhìn thấy đầy đủ. Nút Đóng trên đầu màn vẫn bấm được.',
'- Chữ nút lọc và nút trên thẻ là 12px; nhãn trạng thái trên thẻ nhỏ khoảng 11px theo mã giao diện/ảnh. Chưa có đánh giá đọc bằng mắt của Ngọc trên thiết bị thật. Phát hiện DOM về chữ có ellipsis: '+(first.clippedText.length?esc(JSON.stringify(first.clippedText)):'không có trong các thẻ p/h1/h2/h3/span được đo; điều này không loại trừ chữ nằm ngoài khung cuộn')+'.',
'',
'## Chi tiết từng bước',
'',
];
for(const c of data.results){
  lines.push(`### ${c.caseId} — ${c.title}`,'','| Bước | Giờ bắt đầu bước | Expected | AI quan sát | Kết quả hành vi | Ảnh |','| --- | --- | --- | --- | --- | --- |');
  for(const s of c.steps){
    let observed=s.observed;
    if(c.caseId==='MANG-DI' && s.id==='T1') observed='1 đơn #26/84.000đ; 9 nút; trang 568×320 không tràn. Khung ngoài cuộn ngang tối đa 72px, danh sách dọc tối đa 19px, chi tiết dọc tối đa 150px.';
    lines.push(`| ${s.id} | ${s.time} | ${esc(s.expected)} | ${esc(observed)} | ${s.status} | [Ảnh](anh/${s.shot}) |`);
  }
  lines.push('');
}
lines.push('## Cỡ nút mang đi 568×320 (CSS px)','','| Nút / vị trí | Rộng × cao | Cỡ chữ |','| --- | --- | --- |');
first.buttons.forEach((b,i)=>lines.push(`| ${b.label}${i===5||i===6?' — trên thẻ':i===7||i===8?' — khung chi tiết':''} | ${b.width.toFixed(2)} × ${b.height.toFixed(2)} | ${b.fontSize} |`));
lines.push('','## Ảnh bổ sung','','- N01-12 B6: [Đúng tiền = 125.000](anh/N01-12/B6-1.png), [+50k = 175.000](anh/N01-12/B6-2.png), [500k = 500.000](anh/N01-12/B6-3.png).','- Bộ lọc mang đi: [Đã thanh toán](anh/MANG-DI/T2-1.png), [Hôm nay](anh/MANG-DI/T2-2.png), [Đang mở](anh/MANG-DI/T2-3.png).','- [Nháp mới chưa thêm món](anh/MANG-DI/T3-nhap-moi.png).','- Mở từ thẻ: [thanh toán #26](anh/MANG-DI/T4b-thanh-toan.png).','- Cuộn khung chi tiết: [nút Mở đơn](anh/MANG-DI/T4c-nut-sau-cuon.png), [nút Thanh toán](anh/MANG-DI/T4d-nut-sau-cuon.png), [màn thanh toán đích](anh/MANG-DI/T4d-thanh-toan.png), [tổng 84.000đ](anh/MANG-DI/T5-tong.png).','','## Tệp kết quả và chạy lại','','- [Dữ liệu kết quả từng bước](ket-qua.json).','- [Đo viewport, nút, vùng cuộn và điểm bấm](do-dac-mang-di.json).','- [Script kiểm tra](kiem-tra-theo-phieu.mjs), sử dụng helper/các bước N01-11 và N01-12 từ script tuần 7 có sẵn; bổ sung kiểm tra sau B6 và màn mang đi.','- [Script lập báo cáo](lap-bao-cao.mjs).','','Chạy server demo như phiếu gốc, sau đó chạy trong PowerShell tại `C:\\Users\\ngoc.vv\\Music\\KLTN`:','','```powershell',`node '.\\ngoc-tuan-7\\ket qua chay tay\\kiem-tra-theo-phieu.mjs' 'C:\\Users\\ngoc.vv\\Music\\KLTN\\pos-cafe-main-2e57649' 'C:\\Users\\ngoc.vv\\Music\\KLTN\\ngoc-tuan-7\\ket qua chay tay' '${data.baseURL}'`,`node '.\\ngoc-tuan-7\\ket qua chay tay\\lap-bao-cao.mjs'`,'```','','Lệnh chạy lại sẽ thay kết quả/ảnh của lượt này trong cùng thư mục; dùng thư mục đầu ra khác nếu cần giữ lượt cũ.','','## Phần Ngọc tự xác nhận','','- [ ] Ngọc tự chạy tay và ghi kết quả vào [phiếu gốc](../chay-tay/phieu-chay-tay.md).','- [ ] Ngọc đối chiếu mức cuộn ngang 72px so với mốc 49px.','- [ ] Ngọc xác nhận khả năng đọc chữ và thao tác thực tế ở 568×320.','','Không đánh dấu thay Ngọc. Giờ trong báo cáo này là giờ chạy tự động thực tế, không phải giờ Ngọc chạy tay.','');
writeFileSync(join(root,'README.md'),lines.join('\n'),'utf8');
console.log(`${steps.length} kiểm tra, ${countImages(join(root,'anh'))} ảnh; đã tạo README.md`);
