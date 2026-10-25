import { test } from "node:test";
import assert from "node:assert/strict";
import { metrics } from "../scripts/benchmark/metrics.mjs";
test("quality metrics distinguish false positives, missing interior and matched contours", () => {
  const w = 21,
    h = 21,
    gt = new Uint8Array(w * h);
  for (let y = 6; y < 15; y++) for (let x = 6; x < 15; x++) gt[y * w + x] = 255;
  const perfect = metrics(gt, gt, w, h);
  assert.equal(perfect.iou, 1);
  assert.equal(perfect.boundaryF1, 1);
  const damaged = gt.slice();
  damaged[10 * w + 10] = 0;
  damaged[1 * w + 1] = 255;
  const m = metrics(damaged, gt, w, h);
  assert.equal(m.fp, 1);
  assert.equal(m.fn, 1);
  assert.equal(m.interiorFalseNegative, 1);
  assert.ok(m.boundaryPrecision2px < 1);
});
