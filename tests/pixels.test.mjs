import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";
import "../src/core/pixels.js";
const composite = globalThis.binaryComposite;
test("binary alpha, unchanged RGB and immutable original", () => {
  const src = new Uint8ClampedArray([
    50, 80, 90, 255, 3, 2, 1, 255, 200, 100, 1, 255, 7, 8, 9, 0, 100, 101, 102,
    127,
  ]);
  const copy = src.slice();
  const out = composite(src, new Uint8Array([127, 128, 255, 255, 128]));
  assert.deepEqual(
    [...out].filter((_, i) => i % 4 === 3),
    [0, 255, 255, 0, 255],
  );
  for (let i = 0; i < src.length; i++)
    if (i % 4 !== 3) assert.equal(out[i], src[i]);
  assert.deepEqual(src, copy);
});
test("mask dimensions checked", () =>
  assert.throws(() => composite(new Uint8Array(8), new Uint8Array(1))));
test("RGB edge patches never mutate source, interiors or restored transparent pixels", () => {
  const original = new Uint8ClampedArray([
    10, 20, 30, 255, 40, 50, 60, 255, 70, 80, 90, 0,
  ]);
  const copy = original.slice();
  const out = composite(original, new Uint8Array([255, 255, 255]), {
    indices: new Uint32Array([0, 2]),
    colors: new Uint8Array([12, 22, 32, 200, 200, 200]),
  });
  assert.deepEqual([...out], [12, 22, 32, 255, 40, 50, 60, 255, 70, 80, 90, 0]);
  assert.deepEqual(original, copy);
  assert.throws(() =>
    composite(original, new Uint8Array([255, 255, 255]), {
      indices: new Uint32Array([4]),
      colors: new Uint8Array(3),
    }),
  );
});
test("published sources identical", () => {
  assert.equal(
    readFileSync("src/index.html", "utf8"),
    readFileSync("dist/index.html", "utf8"),
  );
  assert.equal(
    readFileSync("src/ai/background-worker.js", "utf8"),
    readFileSync("dist/background-worker.js", "utf8"),
  );
});
