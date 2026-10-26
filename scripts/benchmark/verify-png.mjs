import { chromium } from "playwright";
import { readFile, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const b = await chromium.launch({
    channel: process.env.CI ? undefined : "chrome",
  }),
  p = await b.newPage();
const report = [];
for (const item of JSON.parse(
  await readFile("tests/fixtures/quality/manifest.json"),
)) {
  const input = await readFile("tests/fixtures/quality/" + item.file),
    png = await readFile(`work/v53/results/v53-${item.id}.png`);
  const result = await p.evaluate(
    async ({ input, png, mime }) => {
      async function decode(bytes, mime) {
        const im = await createImageBitmap(
          new Blob([Uint8Array.from(atob(bytes), (c) => c.charCodeAt(0))], {
            type: mime,
          }),
        );
        const c = document.createElement("canvas");
        c.width = im.width;
        c.height = im.height;
        const x = c.getContext("2d");
        x.drawImage(im, 0, 0);
        return {
          w: c.width,
          h: c.height,
          p: x.getImageData(0, 0, c.width, c.height).data,
        };
      }
      const a = await decode(input, mime),
        b = await decode(png, "image/png");
      let partial = 0,
        kept = 0,
        removed = 0,
        colorErrors = 0,
        maxColorDelta = 0;
      for (let i = 0; i < b.p.length; i += 4) {
        const alpha = b.p[i + 3];
        if (alpha === 0) removed++;
        else if (alpha === 255) {
          kept++;
          for (let k = 0; k < 3; k++)
            if (a.p[i + k] !== b.p[i + k]) {
              colorErrors++;
              maxColorDelta = Math.max(
                maxColorDelta,
                Math.abs(a.p[i + k] - b.p[i + k]),
              );
            }
        } else partial++;
      }
      return {
        original: [a.w, a.h],
        result: [b.w, b.h],
        partial,
        kept,
        removed,
        colorErrors,
        maxColorDelta,
      };
    },
    {
      input: input.toString("base64"),
      png: png.toString("base64"),
      mime: item.file.endsWith(".jpg") ? "image/jpeg" : "image/png",
    },
  );
  console.log(item.id, JSON.stringify(result));
  assert.deepEqual(result.original, result.result);
  assert.equal(result.partial, 0);
  // Independent JPEG decoding can round RGB by one level. Live download tests compare
  // against the exact in-memory original and require zero unapproved RGB differences.
  if (item.file.endsWith(".png")) assert.equal(result.colorErrors, 0);
  else assert.ok(result.maxColorDelta <= 1);
  assert.ok(result.kept && result.removed);
  report.push({ image: item.id, ...result });
}
await writeFile(
  "work/v53/png-invariants.json",
  JSON.stringify(
    {
      note: "Diagnostic PNGs from real integrated-model masks: dimensions/binary alpha checked. PNG source RGB exact; independently re-decoded JPEG RGB allows one rounding level (recorded). Strict in-memory RGB and edge patches are checked separately by live download tests.",
      report,
    },
    null,
    2,
  ),
);
await b.close();
console.log(
  `${report.length} real-model diagnostic PNGs: dimensions and binary alpha PASS; independent JPEG RGB delta <=1`,
);
