// Nối từng link ca kiểm trong docs/regression-map.md với kết quả chạy thật trên máy.
// Chạy: node doi-chieu-ca-hoi-quy.mjs <thư mục chay-YYYY-MM-DD> <thư mục mã nguồn main>
// Đọc: lien-ket/rm-links-check.tsv, unit/ket-qua.json, smoke/ket-qua.json, b/ket-qua.json
// Ghi: lien-ket/doi-chieu-ca.json và lien-ket/doi-chieu-ca.md
// Link trỏ vào giữa một ca (ví dụ một test.step) được nối với ca bao quanh nó.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const [dir, root] = process.argv.slice(2);
if (!dir || !root) throw new Error("Thiếu thư mục kết quả hoặc thư mục mã nguồn");
// Tìm khai báo it()/test() gần nhất ở trên hoặc tại dòng được dẫn; trả về dòng và tên ca (dạng regex nếu có ${...}).
function enclosing(file, line) {
  const src = readFileSync(join(root, file), "utf8").split(/\r?\n/);
  for (let i = line - 1; i >= 0; i--) {
    const m = src[i].match(/^\s*(?:it|test)(?:\.\w+)?\(\s*(["'`])/);
    if (!m) continue;
    const q = m[1], rest = src.slice(i, i + 4).join(" ").slice(src[i].indexOf(q) + 1);
    const title = rest.slice(0, rest.indexOf(q));
    const re = new RegExp("^" + title.split(/\$\{[^}]*\}/).map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(".*") + "$");
    return { line: i + 1, title, re, param: /\$\{/.test(title) };
  }
  return null;
}
const rd = (p) => JSON.parse(readFileSync(join(dir, p), "utf8"));
const norm = (p) => p.replace(/\\/g, "/");

const links = readFileSync(join(dir, "lien-ket", "rm-links-check.tsv"), "utf8").trim().split(/\r?\n/).slice(1)
  .map((l) => { const [id, file, line, content, status] = l.split("\t"); return { id, file, line: Number(line), content, linkStatus: status }; });

const unit = rd("unit/ket-qua.json");
const unitTests = unit.testResults.flatMap((f) => f.assertionResults.map((a) => ({ file: norm(f.name), title: a.title, full: a.fullName, status: a.status })));

function pwRows(json) {
  const rows = [];
  const walk = (s) => { for (const sp of s.specs || []) for (const t of sp.tests) { const r = t.results.at(-1) || {}; rows.push({ file: norm(sp.file), line: sp.line, title: sp.title, project: t.projectName, outcome: t.results.length ? r.status : "skipped" }); } for (const c of s.suites || []) walk(c); };
  for (const s of json.suites) walk(s);
  return rows;
}
const smoke = pwRows(rd("smoke/ket-qua.json"));
const b = pwRows(rd("b/ket-qua.json"));

const sum = (rows) => { const c = {}; for (const r of rows) c[r.outcome] = (c[r.outcome] || 0) + 1; return Object.entries(c).map(([k, v]) => `${v} ${k}`).join(", "); };

const out = links.map((l) => {
  const base = { ...l, kind: "", result: "", detail: "" };
  const f = l.file;
  if (!/\.(test|spec)\.tsx?$/.test(f)) return { ...base, kind: "không phải ca kiểm", result: "—", detail: "link tới mã/cấu hình, chỉ đối chiếu link còn đúng dòng" };
  if (f.startsWith("tests/contracts/")) return { ...base, kind: "contract (cần backend PG16)", result: "CHƯA CHẠY", detail: "cần cơ sở dữ liệu thật; ngoài phạm vi máy này" };
  if (f.endsWith("ui-remake/integration/areas.spec.ts")) return { ...base, kind: "browser (B)", result: "KHÔNG CHẠY ĐƯỢC", detail: "file cần artifacts/stitch/B01/v3/responsive-contract.proposed.json, không có trong repo" };
  const enc = enclosing(f, l.line);
  if (!enc) return { ...base, kind: "?", result: "KHÔNG TÌM THẤY CA", detail: l.content };
  const where = enc.line === l.line ? "" : `link trỏ vào bên trong ca dòng ${enc.line}; `;
  if (f.startsWith("tests/smoke/")) {
    const rows = smoke.filter((r) => r.file.endsWith(f.replace("tests/smoke/", "")) && r.line === enc.line);
    return { ...base, kind: "smoke (S)", result: rows.length ? sum(rows) : "KHÔNG KHỚP", detail: where + rows.map((r) => `${r.project}:${r.outcome}`).join(" ") };
  }
  if (f.startsWith("tests/ui-remake/integration/")) {
    if (f.endsWith("areas.spec.ts")) return { ...base, kind: "browser (B)", result: "KHÔNG CHẠY ĐƯỢC", detail: "file cần artifacts/stitch/B01/v3/responsive-contract.proposed.json, không có trong repo" };
    const rows = b.filter((r) => f.endsWith(r.file.split("/").pop()) && r.line === enc.line);
    return { ...base, kind: "browser (B)", result: rows.length ? sum(rows) : "KHÔNG KHỚP", detail: where + [...new Set(rows.map((r) => r.title))].join(" | ") };
  }
  const rows = unitTests.filter((t) => t.file.endsWith(f) && enc.re.test(t.title));
  const res = rows.length ? sum(rows.map((r) => ({ outcome: r.status }))) : "KHÔNG KHỚP";
  return { ...base, kind: "unit (U)", result: res, detail: where + (enc.param ? `ca có tham số, ${rows.length} biến thể; ` : "") + enc.title };
});

writeFileSync(join(dir, "lien-ket", "doi-chieu-ca.json"), JSON.stringify(out, null, 2), "utf8");
const md = ["| Mã | File:dòng | Loại | Kết quả 12/11 | Ghi chú |", "| --- | --- | --- | --- | --- |",
  ...out.map((o) => `| ${o.id} | \`${o.file}:${o.line}\` | ${o.kind} | ${o.result} | ${String(o.detail).replace(/\|/g, "\\|").slice(0, 120)} |`)];
writeFileSync(join(dir, "lien-ket", "doi-chieu-ca.md"), md.join("\n") + "\n", "utf8");
const c = {}; for (const o of out) c[`${o.kind} → ${o.result}`] = (c[`${o.kind} → ${o.result}`] || 0) + 1;
console.log(JSON.stringify(c, null, 1));
