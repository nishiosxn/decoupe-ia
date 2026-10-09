import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";
const html = readFileSync("outputs/decoupe.html", "utf8");
const start = html.indexOf("function binaryComposite(");
const end = html.indexOf("async function importImage(", start);
const composite = new Function(
  html.slice(start, end) + ";return binaryComposite;",
)();
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
test("published sources identical", () => {
  assert.equal(html, readFileSync("dist/index.html", "utf8"));
  assert.equal(
    readFileSync("outputs/background-worker.js", "utf8"),
    readFileSync("dist/background-worker.js", "utf8"),
  );
});
