// Sinh bảng kết quả N01 r04 từ ket-qua.json để không phải chép tay.
// Chạy: node tao-bang-n01.mjs <ket-qua.json> <template.md> <file ra .md>
// Template có ba chỗ thay: {{TONG}}, {{BANG_TONG}}, {{BANG_CHI_TIET}}.
import { readFileSync, writeFileSync } from "node:fs";

const [json, tpl, out] = process.argv.slice(2);
const { results } = JSON.parse(readFileSync(json, "utf8"));
const kind = (s) => (s.startsWith("ĐÚNG") ? "ĐÚNG" : s.startsWith("LỆCH") ? "LỆCH" : s.startsWith("LỖI") ? "LỖI" : s.startsWith("ĐÃ CHUẨN BỊ") ? "CB" : "CHƯA CHẠY");
const esc = (s) => String(s).replace(/\|/g, "\\|").replace(/\n/g, " ");
const all = results.flatMap((c) => c.steps.filter((s) => s.id !== "CB"));
const n = (k) => all.filter((s) => kind(s.status) === k).length;
const tong = `${all.length} bước: ${n("ĐÚNG")} ĐÚNG, ${n("LỆCH")} LỆCH chờ CX, ${n("LỖI")} LỖI mới, ${n("CHƯA CHẠY")} CHƯA CHẠY`;

const bangTong = ["| Ca | Giờ chạy | Số bước | ĐÚNG | LỆCH — chờ CX | LỖI | CHƯA CHẠY |", "| --- | --- | --- | --- | --- | --- | --- |",
  ...results.map((c) => { const st = c.steps.filter((s) => s.id !== "CB"); const k = (x) => st.filter((s) => kind(s.status) === x).length;
    return `| ${c.caseId} ${c.title} | ${c.start}–${c.end} | ${st.length} | ${k("ĐÚNG")} | ${k("LỆCH")} | ${k("LỖI")} | ${k("CHƯA CHẠY")} |`; }),
  `| **Tổng** | | **${all.length}** | **${n("ĐÚNG")}** | **${n("LỆCH")}** | **${n("LỖI")}** | **${n("CHƯA CHẠY")}** |`].join("\n");

const chiTiet = results.map((c) => [`**${c.caseId} — ${c.title}**`, "", "| Bước | Expected r04 | Nguồn | Thực tế trên demo | Kết quả |", "| --- | --- | --- | --- | --- |",
  ...c.steps.map((s) => `| ${s.id === "CB" ? "Chuẩn bị" : s.id} | ${esc(s.expected)} | ${esc(s.source)} | ${esc(s.observed)} | ${s.status.startsWith("ĐÚNG") ? "ĐÚNG" : `**${esc(s.status)}**`} |`),
  c.pageErrors.length ? `\nLỗi JavaScript trên trang: ${esc(c.pageErrors.join("; "))}` : ""].join("\n")).join("\n\n");

writeFileSync(out, readFileSync(tpl, "utf8").replace("{{TONG}}", tong).replace("{{BANG_TONG}}", bangTong).replace("{{BANG_CHI_TIET}}", chiTiet), "utf8");
console.log(tong);
