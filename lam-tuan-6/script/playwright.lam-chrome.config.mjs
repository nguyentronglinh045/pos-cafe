// Chạy bộ smoke có sẵn của main bằng Chrome cài trên máy (máy không có trình duyệt riêng của Playwright).
// Giữ nguyên mọi project, viewport, timeout, webServer và chế độ mock của playwright.config.ts;
// chỉ đổi channel sang "chrome", trỏ testDir/webServer về thư mục mã nguồn và thêm reporter JSON.
//
// Cách chạy (từ thư mục mã nguồn main):
//   set POS_CAFE_ROOT=<thư mục mã nguồn>   (PowerShell: $env:POS_CAFE_ROOT = "...")
//   set LAM_OUT=<thư mục lưu kết quả>
//   npx playwright test -c <đường dẫn tới file này>
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.env.POS_CAFE_ROOT;
const OUT = process.env.LAM_OUT;
if (!ROOT || !OUT) throw new Error("Cần đặt POS_CAFE_ROOT và LAM_OUT");

const base = (await import(pathToFileURL(path.join(ROOT, "playwright.config.ts")).href)).default;

export default {
  ...base,
  testDir: path.join(ROOT, "tests", "smoke"),
  outputDir: path.join(OUT, "test-results"),
  reporter: [["line"], ["json", { outputFile: path.join(OUT, "ket-qua.json") }]],
  webServer: { ...base.webServer, cwd: ROOT },
  use: { ...base.use, channel: "chrome" },
  projects: base.projects.map((p) => ({ ...p, use: { ...p.use, channel: "chrome" } })),
};
