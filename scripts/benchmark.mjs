// Opt-in real browser inference. No synthetic predicted masks. See docs/QUALITY_BENCHMARK.md.
import { chromium } from "playwright";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
const root = "tests/fixtures/quality",
  out = process.env.BENCH_OUT || "work/v53/results";
await mkdir(out, { recursive: true });
const fixtures = JSON.parse(await readFile(root + "/manifest.json"));
const models = (process.env.BENCH_MODELS || "baseline,anime,biref").split(",");
const report = await readFile(out + "/report.json", "utf8")
  .then(JSON.parse)
  .catch(() => []);
for (const model of models) {
  const browser = await chromium.launch({
    channel: process.env.CI ? undefined : "chrome",
  });
  const page = await browser.newPage();
  page.on("console", (m) => {
    if (m.type() === "error") console.log(m.text().slice(0, 300));
  });
  await page.route("**/background-worker.js", (r) =>
    r.fulfill({
      contentType: "text/javascript",
      path:
        model === "roi"
          ? "scripts/benchmark/roi-worker.js"
          : model === "v53"
            ? "src/ai/background-worker.js"
            : model === "baseline"
              ? "work/v53/baseline.js"
              : "scripts/benchmark/candidate-worker.js",
    }),
  );
  await page.goto(process.env.BENCH_URL || "http://127.0.0.1:4180/decoupe-ia/");
  await page.evaluate(() => {
    window.benchWorker = new Worker("background-worker.js");
  });
  for (const item of fixtures.filter(
    (f) =>
      (!process.env.BENCH_CASE || f.id === process.env.BENCH_CASE) &&
      !report.some((r) => r.model === model && r.image === f.id),
  )) {
    await page.locator("#file").setInputFiles(root + "/" + item.file);
    await page.waitForFunction(() => source !== null && !busy);
    const gt = item.mask
      ? (await readFile(root + "/" + item.mask)).toString("base64")
      : null;
    const result = await page.evaluate(
      async ({ model, gt }) => {
        const start = performance.now();
        const data = await new Promise((resolve, reject) => {
          const timer = setTimeout(
            () => reject(Error("inference timeout")),
            240000,
          );
          benchWorker.onmessage = ({ data }) => {
            if (data.type === "result" || data.type === "error") {
              clearTimeout(timer);
              resolve(data);
            }
          };
          benchWorker.onerror = (e) => reject(Error(e.message));
          benchWorker.postMessage({
            model,
            image: new Blob([source.data], {
              type: `image/x-rgba8;width=${source.width};height=${source.height}`,
            }),
          });
        });
        if (data.type === "error") return data;
        const alpha = new Uint8Array(data.alpha),
          w = source.width,
          h = source.height;
        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        const x = c.getContext("2d");
        let truth;
        if (gt) {
          const im = new Image();
          im.src = "data:image/png;base64," + gt;
          await im.decode();
          x.drawImage(im, 0, 0);
          truth = x.getImageData(0, 0, w, h).data;
        }
        const metrics = [];
        for (const threshold of [96, 112, 128, 144, 160]) {
          let tp = 0,
            fp = 0,
            fn = 0,
            tn = 0,
            edges = 0,
            edgeMatches = 0,
            details = 0,
            detailHits = 0;
          if (truth)
            for (let y = 0; y < h; y++)
              for (let z = 0; z < w; z++) {
                const i = y * w + z,
                  p = alpha[i] >= threshold,
                  t = truth[i * 4] >= 128;
                if (p && t) tp++;
                else if (p) fp++;
                else if (t) fn++;
                else tn++;
                if (z && y && z < w - 1 && y < h - 1 && t) {
                  const neighbors = [i - 1, i + 1, i - w, i + w];
                  const n = neighbors.filter((j) => truth[j * 4] >= 128).length;
                  if (n < 4) {
                    edges++;
                    let match = false;
                    for (let dy = -2; dy <= 2 && !match; dy++)
                      for (let dx = -2; dx <= 2; dx++) {
                        const j = (y + dy) * w + z + dx;
                        if (
                          j >= w &&
                          j < alpha.length - w &&
                          alpha[j] >= threshold &&
                          [j - 1, j + 1, j - w, j + w].some(
                            (k) => alpha[k] < threshold,
                          )
                        ) {
                          match = true;
                          break;
                        }
                      }
                    if (match) edgeMatches++;
                  }
                  if (n <= 2) {
                    details++;
                    if (p) detailHits++;
                  }
                }
              }
          metrics.push(
            truth
              ? {
                  threshold,
                  iou: tp / (tp + fp + fn),
                  dice: (2 * tp) / (2 * tp + fp + fn),
                  fp,
                  fn,
                  tp,
                  tn,
                  boundaryRecall2px: edgeMatches / edges,
                  thinRecall: details ? detailHits / details : null,
                }
              : { threshold },
          );
        }
        const pixels = new Uint8ClampedArray(source.data);
        let kept = 0;
        for (let i = 0; i < alpha.length; i++) {
          pixels[i * 4 + 3] = alpha[i] >= 128 ? 255 : 0;
          kept += pixels[i * 4 + 3] > 0;
        }
        x.putImageData(new ImageData(pixels, w, h), 0, 0);
        return {
          width: w,
          height: h,
          totalMs: performance.now() - start,
          inferenceMs: data.ms ?? null,
          kept,
          metrics,
          png: c.toDataURL().split(",")[1],
          alpha: btoa(
            Array.from({ length: Math.ceil(alpha.length / 32768) }, (_, i) =>
              String.fromCharCode(
                ...alpha.subarray(i * 32768, (i + 1) * 32768),
              ),
            ).join(""),
          ),
          heap: performance.memory?.usedJSHeapSize ?? null,
        };
      },
      { model, gt },
    );
    if (result.png) {
      await writeFile(
        `${out}/${model}-${item.id}.png`,
        Buffer.from(result.png, "base64"),
      );
      delete result.png;
      await writeFile(
        `${out}/${model}-${item.id}.alpha`,
        Buffer.from(result.alpha, "base64"),
      );
      delete result.alpha;
    }
    const entry = { model, image: item.id, ...result };
    report.push(entry);
    await writeFile(
      `${out}/report.json`,
      JSON.stringify(report, null, 2) + "\n",
    );
    console.log(
      JSON.stringify({
        ...entry,
        metrics: entry.metrics?.find((m) => m.threshold === 128),
      }),
    );
  }
  await browser.close();
}
