import { test } from "node:test";
import assert from "node:assert/strict";
import "../src/core/local-brush.js";
import { readFileSync } from "node:fs";
const B = globalThis.LocalBrush;
const stroke = (mode, x, y, r = 2) => ({ mode, radius: r, points: [{ x, y }] });
test("context crops cluster nearby strokes but keep distant requests local", () => {
  const r = B.regions(
    [stroke("add", 20, 20), stroke("remove", 25, 25), stroke("add", 780, 580)],
    800,
    600,
  );
  assert.equal(r.length, 2);
  for (const b of r) {
    assert.ok(b.x >= 0 && b.y >= 0 && b.x + b.w <= 800 && b.y + b.h <= 600);
    assert.ok(b.w * b.h < (800 * 600) / 4);
  }
});
test("crop copies only original RGBA at the correct offset", () => {
  const original = Uint8Array.from({ length: 64 }, (_, i) => i);
  assert.deepEqual(
    [...B.crop(original, 4, { x: 1, y: 1, w: 2, h: 2 })],
    [...original.slice(20, 28), ...original.slice(36, 44)],
  );
});
test("continuous coverage and last indication wins without editing a mask", () => {
  const codes = B.coverage(
    [
      {
        mode: "add",
        radius: 1,
        points: [
          { x: 1, y: 2 },
          { x: 7, y: 2 },
        ],
      },
      stroke("remove", 4, 2, 1),
    ],
    { x: 0, y: 0, w: 8, h: 4 },
  );
  for (let x = 1; x < 7; x++) assert.ok(codes[1 * 8 + x] > 0);
  assert.equal(codes[1 * 8 + 3], 2);
  assert.equal(codes[0], 0);
});
test("probability-gated add/remove are binary, monotonic, limited to indicated pixels and undoable", () => {
  const mask = Uint8Array.from([0, 0, 255, 255, 0, 255]),
    copy = mask.slice(),
    original = new Uint8Array(24).fill(255),
    rect = { x: 1, y: 0, w: 2, h: 2 };
  const alpha = Uint8Array.from([128, 127, 255, 127]),
    codes = Uint8Array.from([1, 2, 0, 2]);
  const patch = B.changes(mask, 3, original, rect, alpha, codes);
  assert.deepEqual(mask, copy);
  B.apply(mask, patch);
  assert.deepEqual([...mask], [0, 255, 0, 255, 0, 0]);
  assert.ok([...mask].every((a) => a === 0 || a === 255));
  B.apply(mask, patch, true);
  assert.deepEqual(mask, copy);
});
test("no forced erase when local model still predicts subject; invisible original never restored", () => {
  const mask = Uint8Array.from([255, 0]),
    original = Uint8Array.from([1, 2, 3, 255, 1, 2, 3, 0]);
  const p = B.changes(
    mask,
    2,
    original,
    { x: 0, y: 0, w: 2, h: 1 },
    new Uint8Array([255, 255]),
    new Uint8Array([2, 1]),
  );
  assert.equal(p.indices.length, 0);
  assert.throws(() =>
    B.changes(
      mask,
      2,
      original,
      { x: 0, y: 0, w: 2, h: 1 },
      new Uint8Array(1),
      new Uint8Array(2),
    ),
  );
});
test("local brush distribution is synchronized", () =>
  assert.equal(
    readFileSync("src/core/local-brush.js", "utf8"),
    readFileSync("dist/local-brush.js", "utf8"),
  ));
