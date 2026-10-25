import { test } from "node:test";
import assert from "node:assert/strict";
await import("../src/core/mask-refinement.js");
test("confidence resize preserves constants and unpads without border seams", () => {
  const p = Float32Array.from([0, 0.8, 0.8, 0, 0, 0.8, 0.8, 0]);
  const out = MaskRefinement.resize(p, 4, 2, 19, 7, { x: 1, y: 0, w: 2, h: 2 });
  assert.ok(out.every((v) => Math.abs(v - 0.8) < 1e-6));
});
test("uncertain contour follows source edges; confident holes and hair survive", () => {
  const w = 9,
    h = 7,
    rgb = new Uint8ClampedArray(w * h * 4).fill(255),
    p = new Float32Array(w * h).fill(0.99);
  p[3 * w + 4] = 0.01;
  p[2 * w + 4] = 0.99;
  p[3 * w + 3] = 0.49;
  const before = p.slice(),
    original = rgb.slice();
  const { alpha } = MaskRefinement.refine(p, rgb, w, h);
  assert.equal(alpha[3 * w + 4], 0);
  assert.equal(alpha[2 * w + 4], 255);
  assert.ok(alpha.every((a) => a === 0 || a === 255));
  assert.deepEqual(p, before);
  assert.deepEqual(rgb, original);
});
test("decontamination changes a provable mixture, preserves confident coloured outlines and interior", () => {
  const w = 9,
    h = 9,
    rgb = new Uint8ClampedArray(w * h * 4),
    p = new Float32Array(w * h),
    alpha = new Uint8Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      rgb[i * 4] = x < 4 ? 240 : 40;
      rgb[i * 4 + 1] = 40;
      rgb[i * 4 + 2] = x < 4 ? 40 : 240;
      rgb[i * 4 + 3] = 255;
      p[i] = x < 4 ? 0.99 : 0.01;
      alpha[i] = x < 4 ? 255 : 0;
    }
  const i = 4 * w + 3;
  p[i] = 0.6;
  rgb[i * 4] = 160;
  rgb[i * 4 + 2] = 120;
  const copy = rgb.slice();
  const patch = MaskRefinement.decontaminate(rgb, p, alpha, w, h, 2);
  assert.deepEqual([...patch.indices], [i]);
  assert.deepEqual([...patch.colors], [240, 40, 40]);
  assert.deepEqual(rgb, copy);
  p[i] = 0.99;
  assert.equal(
    MaskRefinement.decontaminate(rgb, p, alpha, w, h, 3).indices.length,
    0,
  );
});
test("flat coloured artwork veto prevents RGB repair of intentionally drawn lines", () => {
  const rgba = new Uint8ClampedArray(400).fill(255);
  for (let i = 0; i < 100; i++) {
    rgba[i * 4] = 20;
    rgba[i * 4 + 1] = 120;
    rgba[i * 4 + 2] = 240;
  }
  assert.equal(MaskRefinement.flatColorRisk(rgba), true);
});
test("uncertain one-pixel hole can close without filling a confident legitimate opening", () => {
  const rgb = new Uint8ClampedArray(11 * 11 * 4).fill(255),
    p = new Float32Array(121).fill(0.99);
  p[60] = 0.49;
  p[24] = 0.01;
  const { alpha } = MaskRefinement.refine(p, rgb, 11, 11, { radius: 2 });
  assert.equal(alpha[60], 255);
  assert.equal(alpha[24], 0);
});
