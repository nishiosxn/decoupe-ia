"use strict";
globalThis.LocalBrush = (() => {
  function bounds(stroke, width, height, context = 0) {
    const r = stroke.radius + context,
      xs = stroke.points.map((p) => p.x),
      ys = stroke.points.map((p) => p.y);
    const x = Math.max(0, Math.floor(Math.min(...xs) - r)),
      y = Math.max(0, Math.floor(Math.min(...ys) - r));
    return {
      x,
      y,
      w: Math.min(width, Math.ceil(Math.max(...xs) + r)) - x,
      h: Math.min(height, Math.ceil(Math.max(...ys) + r)) - y,
    };
  }
  function regions(strokes, width, height) {
    const boxes = [];
    for (const stroke of strokes) {
      let box = bounds(stroke, width, height, Math.max(64, stroke.radius * 3));
      for (let i = 0; i < boxes.length; ) {
        const b = boxes[i];
        if (
          box.x <= b.x + b.w &&
          b.x <= box.x + box.w &&
          box.y <= b.y + b.h &&
          b.y <= box.y + box.h
        ) {
          const x = Math.min(box.x, b.x),
            y = Math.min(box.y, b.y);
          box = {
            x,
            y,
            w: Math.max(box.x + box.w, b.x + b.w) - x,
            h: Math.max(box.y + box.h, b.y + b.h) - y,
          };
          boxes.splice(i, 1);
          i = 0;
        } else i++;
      }
      boxes.push(box);
    }
    return boxes;
  }
  function coverage(strokes, rect) {
    const codes = new Uint8Array(rect.w * rect.h);
    for (const stroke of strokes) {
      const points = stroke.points,
        code = stroke.mode === "add" ? 1 : 2,
        r = stroke.radius;
      for (let i = 0; i < points.length; i++) {
        const a = points[Math.max(0, i - 1)],
          b = points[i],
          dx = b.x - a.x,
          dy = b.y - a.y,
          len = dx * dx + dy * dy;
        const x0 = Math.max(rect.x, Math.floor(Math.min(a.x, b.x) - r)),
          x1 = Math.min(rect.x + rect.w, Math.ceil(Math.max(a.x, b.x) + r));
        const y0 = Math.max(rect.y, Math.floor(Math.min(a.y, b.y) - r)),
          y1 = Math.min(rect.y + rect.h, Math.ceil(Math.max(a.y, b.y) + r));
        for (let y = y0; y < y1; y++)
          for (let x = x0; x < x1; x++) {
            const t = len
              ? Math.max(
                  0,
                  Math.min(
                    1,
                    ((x + 0.5 - a.x) * dx + (y + 0.5 - a.y) * dy) / len,
                  ),
                )
              : 0;
            if (
              (x + 0.5 - a.x - t * dx) ** 2 + (y + 0.5 - a.y - t * dy) ** 2 <=
              r * r
            )
              codes[(y - rect.y) * rect.w + x - rect.x] = code;
          }
      }
    }
    return codes;
  }
  function crop(original, width, rect) {
    const data = new Uint8ClampedArray(rect.w * rect.h * 4);
    for (let y = 0; y < rect.h; y++)
      data.set(
        original.subarray(
          ((rect.y + y) * width + rect.x) * 4,
          ((rect.y + y) * width + rect.x + rect.w) * 4,
        ),
        y * rect.w * 4,
      );
    return data;
  }
  function changes(mask, width, original, rect, alpha, codes) {
    if (alpha.length !== rect.w * rect.h || codes.length !== alpha.length)
      throw Error("Dimensions locales incohérentes");
    const indices = [],
      before = [],
      after = [];
    for (let y = 0; y < rect.h; y++)
      for (let x = 0; x < rect.w; x++) {
        const j = y * rect.w + x,
          i = (rect.y + y) * width + rect.x + x;
        let value = mask[i];
        if (codes[j] === 1 && alpha[j] >= 128 && original[i * 4 + 3] > 0)
          value = 255;
        if (codes[j] === 2 && alpha[j] < 128) value = 0;
        if (value !== mask[i]) {
          indices.push(i);
          before.push(mask[i]);
          after.push(value);
        }
      }
    return {
      indices: Uint32Array.from(indices),
      before: Uint8Array.from(before),
      after: Uint8Array.from(after),
    };
  }
  function apply(mask, patch, undo = false) {
    const values = undo ? patch.before : patch.after;
    for (let i = 0; i < patch.indices.length; i++)
      mask[patch.indices[i]] = values[i];
  }
  return { bounds, regions, coverage, crop, changes, apply };
})();
