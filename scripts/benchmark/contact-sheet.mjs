import { chromium } from "playwright";
import { readFile, mkdir, writeFile } from "node:fs/promises";
const cases = JSON.parse(
  await readFile("tests/fixtures/quality/manifest.json"),
);
const b = await chromium.launch({
    channel: process.env.CI ? undefined : "chrome",
  }),
  p = await b.newPage({ viewport: { width: 1400, height: 900 } });
let html =
  "<style>body{font:15px sans-serif;background:#eee;margin:10px}section{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;break-inside:avoid;margin:10px}img{width:100%;height:230px;object-fit:contain;background:repeating-conic-gradient(#bbb 0% 25%,#fff 0% 50%) 0/20px 20px}h2{font-size:16px;margin:5px}label{display:block}</style>";
for (const c of cases.filter(
  (c) => !process.env.BENCH_CASE || c.id === process.env.BENCH_CASE,
)) {
  html += "<h2>" + c.id + "</h2><section>";
  for (const model of ["source", "baseline", "anime", "biref"]) {
    const path =
      model === "source"
        ? "tests/fixtures/quality/" + c.file
        : `work/v53/results/${model}-${c.id}.png`;
    const data = await readFile(path);
    html += `<div><label>${model}</label><img src="data:image/${path.endsWith(".jpg") ? "jpeg" : "png"};base64,${data.toString("base64")}"></div>`;
  }
  html += "</section>";
}
await p.setContent(html);
await p.screenshot({ path: "work/v53/contact-sheet.png", fullPage: true });
await writeFile("work/v53/contact-sheet.html", html);
await b.close();
