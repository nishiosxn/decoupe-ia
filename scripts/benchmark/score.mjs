import { chromium } from "playwright";
import { readFile, writeFile } from "node:fs/promises";
import { metrics } from "./metrics.mjs";
const browser = await chromium.launch({
    channel: process.env.CI ? undefined : "chrome",
  }),
  page = await browser.newPage();
const cases = JSON.parse(
  await readFile("tests/fixtures/quality/manifest.json"),
);
const report = [];
for (const item of cases.filter((c) => c.mask)) {
  const gt = await page.evaluate(
    async (b64) => {
      const im = new Image();
      im.src = "data:image/png;base64," + b64;
      await im.decode();
      const c = document.createElement("canvas");
      c.width = im.width;
      c.height = im.height;
      const x = c.getContext("2d");
      x.drawImage(im, 0, 0);
      const rgb = x.getImageData(0, 0, c.width, c.height).data;
      return {
        w: c.width,
        h: c.height,
        b64: btoa(
          Array.from(
            { length: Math.ceil((c.width * c.height) / 32768) },
            (_, chunk) => {
              const start = chunk * 32768,
                n = Math.min(32768, c.width * c.height - start),
                a = new Uint8Array(n);
              for (let i = 0; i < n; i++) a[i] = rgb[(start + i) * 4];
              return String.fromCharCode(...a);
            },
          ).join(""),
        ),
      };
    },
    (await readFile("tests/fixtures/quality/" + item.mask)).toString("base64"),
  );
  for (const model of (
    process.env.SCORE_MODELS || "baseline,anime,biref,biref16,v53,roi"
  ).split(",")) {
    const data = await readFile(
      `work/v53/results/${model}-${item.id}.alpha`,
    ).catch(() => null);
    if (!data) continue;
    const mask = Uint8Array.from(data, (p) => (p >= 128 ? 255 : 0));
    report.push({
      model,
      image: item.id,
      ...metrics(mask, Buffer.from(gt.b64, "base64"), gt.w, gt.h),
    });
  }
}
await writeFile("work/v53/boundaries.json", JSON.stringify(report, null, 2));
await browser.close();
console.log(
  report
    .map(
      (r) =>
        `${r.model} ${r.image}: IoU ${(r.iou * 100).toFixed(2)}, boundary F1 ${(r.boundaryF1 * 100).toFixed(2)}`,
    )
    .join("\n"),
);
