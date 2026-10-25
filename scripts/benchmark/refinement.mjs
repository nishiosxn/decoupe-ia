import { chromium } from "playwright";
import { readFile, writeFile } from "node:fs/promises";
const b = await chromium.launch({
    channel: process.env.CI ? undefined : "chrome",
  }),
  p = await b.newPage();
await p.goto("http://127.0.0.1:4173/decoupe-ia/");
await p.addScriptTag({ path: "src/core/mask-refinement.js" });
const cases = JSON.parse(
  await readFile("tests/fixtures/quality/manifest.json"),
);
const report = [];
for (const c of cases.filter((c) => c.mask)) {
  const result = await p.evaluate(
    async ({ image, truth, alpha }) => {
      async function decode(bytes) {
        const im = new Image();
        im.src = "data:image/png;base64," + bytes;
        await im.decode();
        const cv = document.createElement("canvas");
        cv.width = im.width;
        cv.height = im.height;
        const x = cv.getContext("2d");
        x.drawImage(im, 0, 0);
        return {
          rgb: x.getImageData(0, 0, cv.width, cv.height).data,
          w: cv.width,
          h: cv.height,
        };
      }
      const { rgb, w, h } = await decode(image),
        gt = (await decode(truth)).rgb;
      const probabilities = Float32Array.from(
        atob(alpha),
        (v) => v.charCodeAt(0) / 255,
      );
      const rows = [];
      for (const radius of [0, 1, 2, 3]) {
        const start = performance.now(),
          { alpha: mask } = MaskRefinement.refine(probabilities, rgb, w, h, {
            radius,
          });
        let tp = 0,
          fp = 0,
          fn = 0;
        for (let i = 0; i < mask.length; i++) {
          if (mask[i] && gt[i * 4]) tp++;
          else if (mask[i]) fp++;
          else if (gt[i * 4]) fn++;
        }
        const bands = [];
        for (const band of [1, 2, 3]) {
          const patch = MaskRefinement.decontaminate(
            rgb,
            probabilities,
            mask,
            w,
            h,
            band,
          );
          let inside = 0;
          for (const i of patch.indices) {
            const x = i % w,
              y = Math.floor(i / w);
            if ([i - 1, i + 1, i - w, i + w].every((j) => gt[j * 4])) inside++;
          }
          bands.push({
            band,
            corrected: patch.indices.length,
            notOnReferenceBoundary: inside,
          });
        }
        rows.push({
          radius,
          iou: tp / (tp + fp + fn),
          fp,
          fn,
          ms: performance.now() - start,
          bands,
        });
      }
      return rows;
    },
    {
      image: (await readFile("tests/fixtures/quality/" + c.file)).toString(
        "base64",
      ),
      truth: (await readFile("tests/fixtures/quality/" + c.mask)).toString(
        "base64",
      ),
      alpha: (
        await readFile("work/v53/results/biref16-" + c.id + ".alpha")
      ).toString("base64"),
    },
  );
  report.push({ image: c.id, rows: result });
  console.log(c.id, JSON.stringify(result));
  await writeFile("work/v53/refinement.json", JSON.stringify(report, null, 2));
}
await b.close();
