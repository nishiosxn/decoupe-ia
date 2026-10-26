import { chromium } from "playwright";
import { writeFile, mkdir, readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
const device = process.argv[2] || "wasm",
  model = process.argv[3] || "biref",
  browser = await chromium.launch({
    channel: process.env.CI ? undefined : "chrome",
  }),
  page = await browser.newPage();
if (process.env.PERF_LOW_MEMORY === "1") {
  let code = await readFile("src/ai/segmentation.js", "utf8");
  code = code.replaceAll(
    'graphOptimizationLevel: "all"',
    'graphOptimizationLevel: "all", enableCpuMemArena:false, enableMemPattern:false',
  );
  await page
    .context()
    .route("**/segmentation.js", (r) =>
      r.fulfill({ contentType: "text/javascript", body: code }),
    );
}
const external = [];
page.context().on("response", async (r) => {
  if (/^https:/.test(r.url()))
    external.push({
      host: new URL(r.url()).hostname,
      path: new URL(r.url()).pathname,
      bytes: Number((await r.allHeaders())["content-length"] || 0),
    });
});
await page.goto("http://127.0.0.1:4173/decoupe-ia/");
await page.locator("#file").setInputFiles("tests/fixtures/quality/person.jpg");
await page.waitForFunction(() => source && !busy);
const gpu = await page.evaluate(async () => {
  const a = await navigator.gpu?.requestAdapter();
  return a
    ? {
        vendor: a.info.vendor,
        architecture: a.info.architecture,
        device: a.info.device,
        description: a.info.description,
        isFallbackAdapter: a.info.isFallbackAdapter,
        shaderF16: a.features.has("shader-f16"),
      }
    : null;
});
const cdp = await browser.newBrowserCDPSession();
let peak = 0,
  samples = 0,
  sampling = false;
async function memory() {
  if (process.platform !== "win32" || sampling) return;
  sampling = true;
  try {
    const info = await cdp.send("SystemInfo.getProcessInfo");
    const ids = info.processInfo.map((p) => p.id).filter(Number.isInteger);
    const value = Number(
      execFileSync(
        "powershell.exe",
        [
          "-NoProfile",
          "-Command",
          `(Get-Process -Id ${ids.join(",")} -ErrorAction SilentlyContinue | Measure-Object WorkingSet64 -Sum).Sum`,
        ],
        { encoding: "utf8" },
      ),
    );
    if (value) {
      peak = Math.max(peak, value);
      samples++;
    }
  } catch {
  } finally {
    sampling = false;
  }
}
const interval = setInterval(memory, 1500),
  rows = [];
try {
  for (const phase of (
    process.env.PERF_PHASES || "cold,warm,cached-new-worker"
  ).split(",")) {
    const count = external.length;
    const result = await page.evaluate(
      async ({ device, phase, model }) => {
        if (phase !== "warm") {
          window.perfWorker?.terminate();
          window.perfWorker = new Worker("background-worker.js");
        }
        const start = performance.now();
        const data = await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(Error("timeout")), 240000);
          perfWorker.onmessage = ({ data }) => {
            if (data.type === "result" || data.type === "error") {
              clearTimeout(timeout);
              resolve(data);
            }
          };
          perfWorker.onerror = (e) => reject(Error(e.message));
          perfWorker.postMessage({
            device,
            model,
            image: new Blob([source.data], {
              type: `image/x-rgba8;width=${source.width};height=${source.height}`,
            }),
          });
        });
        if (data.type === "error") return data;
        const a = new Uint8Array(data.alpha);
        let kept = 0,
          partial = 0,
          difference = 0;
        for (let i = 0; i < a.length; i++) {
          kept += a[i] === 255;
          partial += a[i] !== 0 && a[i] !== 255;
          if (window.firstPerfMask && a[i] !== firstPerfMask[i]) difference++;
        }
        window.firstPerfMask ||= a;
        return {
          phase,
          ms: performance.now() - start,
          backend: data.backend,
          fallback: data.fallback,
          kept,
          partial,
          difference,
          ...data.metrics,
        };
      },
      { device, phase, model },
    );
    await memory();
    rows.push({ ...result, externalRequests: external.length - count });
    console.log(JSON.stringify(rows.at(-1)));
  }
} finally {
  clearInterval(interval);
  await memory();
}
await mkdir("work/v53", { recursive: true });
const report = {
  date: "2026-10-25",
  browser: browser.version(),
  platform: process.platform,
  device,
  model,
  lowMemorySession: process.env.PERF_LOW_MEMORY === "1",
  gpu,
  rows,
  peakBrowserWorkingSetBytes: peak,
  memorySamples: samples,
  memoryMethod:
    "Sampled Windows working set sum of this Chrome process tree every1500ms; not dedicated WASM allocation, may miss short peaks.",
  external,
};
await writeFile(
  `work/v53/performance-${device}${model === "isnet" ? "-isnet" : ""}${process.env.PERF_LOW_MEMORY === "1" ? "-lowmem" : ""}.json`,
  JSON.stringify(report, null, 2),
);
await browser.close();
