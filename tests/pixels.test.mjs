import test from 'node:test';
import assert from 'node:assert/strict';
import {
  composite,
  applySelection,
  brushSegment,
  localRepair,
  mergeRepair,
} from '../src/core/pixels.js';
import { ImageDocument } from '../src/core/document.js';
import { textureRepair } from '../src/core/texture.js';

const fixture = (w = 11, h = 11) =>
  Uint8ClampedArray.from({ length: w * h * 4 }, (_, i) => [170, 80, 45, 255][i % 4]);
test('erasing removes alpha to zero without darkening RGB, and restores original alpha', () => {
  const original = fixture(),
    doc = new ImageDocument(11, 11, original);
  brushSegment(doc.mask, original, 11, 11, { x: 5, y: 5 }, { x: 5, y: 5 }, 2, 1, 'erase');
  const result = doc.output(),
    i = (5 * 11 + 5) * 4;
  assert.deepEqual([...result.slice(i, i + 4)], [170, 80, 45, 0]);
  assert.equal(result[3], 255);
  brushSegment(doc.mask, original, 11, 11, { x: 5, y: 5 }, { x: 5, y: 5 }, 2, 1, 'restore');
  assert.deepEqual([...doc.output()], [...original]);
});
test('continuous segments have no holes between distant pointer samples', () => {
  const mask = new Uint8ClampedArray(11 * 11).fill(255);
  brushSegment(mask, fixture(), 11, 11, { x: 1, y: 5 }, { x: 9, y: 5 }, 1, 1, 'erase');
  for (let x = 1; x <= 9; x++) assert.equal(mask[5 * 11 + x], 0);
});
test('selection removes entire region to transparency in one application', () => {
  const doc = new ImageDocument(11, 11, fixture());
  doc.selection[60] = 255;
  applySelection(doc.mask, doc.original, doc.selection, 'erase');
  assert.equal(doc.output()[60 * 4 + 3], 0);
  assert.equal(doc.output()[59 * 4 + 3], 255);
});
test('undo and redo restore both RGB reconstruction and alpha', () => {
  const doc = new ImageDocument(11, 11, fixture());
  doc.checkpoint();
  doc.pixels[0] = 12;
  doc.mask[0] = 0;
  assert.ok(doc.undo());
  assert.equal(doc.pixels[0], 170);
  assert.equal(doc.mask[0], 255);
  assert.ok(doc.redo());
  assert.equal(doc.pixels[0], 12);
  assert.equal(doc.mask[0], 0);
});
test('repair preserves every unselected pixel and removes a contrasting center', () => {
  const pixels = fixture(5, 5),
    selection = new Uint8ClampedArray(25);
  selection[12] = 255;
  pixels.set([255, 0, 255, 255], 48);
  const repaired = localRepair(pixels, selection, 5, 5),
    result = pixels.slice();
  mergeRepair(result, repaired, selection);
  assert.deepEqual([...result.slice(48, 52)], [170, 80, 45, 255]);
  for (let i = 0; i < pixels.length; i++) if (i < 48 || i > 51) assert.equal(result[i], pixels[i]);
});
test('repair refuses a mask without any known background', () =>
  assert.throws(() => localRepair(fixture(), new Uint8Array(121).fill(255), 11, 11), /fond/));
test('partial original transparency is never made opaque by compositing', () =>
  assert.deepEqual(
    [...composite(new Uint8Array([20, 40, 60, 40]), new Uint8Array([200]))],
    [20, 40, 60, 40],
  ));
test('texture synthesis uses only known background and preserves the exterior', () => {
  const pixels = fixture(21, 21),
    selected = new Uint8ClampedArray(441);
  for (let y = 8; y <= 12; y++)
    for (let x = 8; x <= 12; x++) {
      const i = y * 21 + x;
      pixels.set([0, 255, 0, 255], i * 4);
      selected[i] = 255;
    }
  const result = textureRepair(pixels, selected, 21, 21);
  for (let i = 0; i < selected.length; i++)
    assert.deepEqual([...result.subarray(i * 4, i * 4 + 4)], [170, 80, 45, 255]);
});
