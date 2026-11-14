// Module trung gian để chạy ui-audit của dự án bằng Chrome cài trên máy.
// ui-audit cố định channel "chromium" (cần trình duyệt riêng của Playwright, máy này không có) và cho phép
// thay module Playwright qua UI_AUDIT_PLAYWRIGHT_MODULE (xem ui-audit/README.md). Module này nạp đúng
// gói "playwright" đã cài của dự án; chỉ khi mở Chromium thì đổi channel thành "chrome". Mọi bộ đo,
// ngưỡng, viewport, trạng thái và cách chấm của ui-audit giữ nguyên.
// Lưu ý khi đọc kết quả: phiếu status.json của ui-audit vẫn ghi channel "chromium" vì giá trị đó viết cứng
// trong run.mjs; trình duyệt thật là Chrome, xem browserVersion.
// package.json cạnh file này mang tên "playwright" và version bằng gói thật, vì ui-audit tìm version theo tên đó.
// Chạy (PowerShell, từ thư mục mã nguồn main):
//   $env:POS_CAFE_ROOT = (Get-Location).Path
//   $env:UI_AUDIT_PLAYWRIGHT_MODULE = "file:///<đường dẫn>/ui-audit-chrome/index.mjs"
//   node ui-audit/run.mjs --selftest ; node ui-audit/run.mjs
import { createRequire } from "node:module";
import path from "node:path";

const root = process.env.POS_CAFE_ROOT;
if (!root) throw new Error("Cần đặt POS_CAFE_ROOT là thư mục mã nguồn main");
const real = createRequire(path.join(root, "package.json"))("playwright");

export const chromium = new Proxy(real.chromium, {
  get(target, prop) {
    if (prop === "launch") return (options = {}) => target.launch({ ...options, channel: "chrome" });
    const value = Reflect.get(target, prop);
    return typeof value === "function" ? value.bind(target) : value;
  },
});
export const { firefox, webkit, devices, errors, selectors, request } = real;
export default { ...real, chromium };
