// Chạy nhóm ca "B" (tests/ui-remake/integration) của main bằng Chrome cài trên máy.
// Lấy nguyên playwright.b01.config.ts (cổng 5176, mock, viewport, locale, timezone),
// chỉ đổi channel sang "chrome", giới hạn testDir vào integration và lưu kết quả ra LAM_OUT.
//
// Cách chạy (từ thư mục mã nguồn main):
//   $env:POS_CAFE_ROOT = "<thư mục mã nguồn>"; $env:LAM_OUT = "<thư mục lưu kết quả>"
//   npx playwright test -c <đường dẫn tới file này>
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.env.POS_CAFE_ROOT;
const OUT = process.env.LAM_OUT;
if (!ROOT || !OUT) throw new Error("Cần đặt POS_CAFE_ROOT và LAM_OUT");

const base = (await import(pathToFileURL(path.join(ROOT, "playwright.b01.config.ts")).href)).default;

export default {
  ...base,
  testDir: path.join(ROOT, "tests", "ui-remake", "integration"),
  outputDir: path.join(OUT, "test-results"),
  reporter: [["line"], ["json", { outputFile: path.join(OUT, "ket-qua.json") }]],
  webServer: { ...base.webServer, cwd: ROOT },
  use: { ...base.use, channel: "chrome" },
};
