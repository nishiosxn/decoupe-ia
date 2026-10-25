// Benchmark-only experiment, not loaded by the application.
importScripts(
  "models.js",
  "mask-refinement.js",
  "segmentation.js",
  "local-brush.js",
);
self.onmessage = async ({ data }) => {
  try {
    const w = Number(data.image.type.match(/width=(\d+)/)[1]),
      h = Number(data.image.type.match(/height=(\d+)/)[1]);
    const rgb = new Uint8ClampedArray(await data.image.arrayBuffer()),
      start = performance.now();
    const { confidence } = await Segmentation.predict(rgb, w, h, "biref");
    const before = confidence.slice(),
      cells = [];
    const size = 512,
      step = 384;
    for (let y = 0; y < h; y += step)
      for (let x = 0; x < w; x += step) {
        const rect = {
          x: Math.min(x, Math.max(0, w - size)),
          y: Math.min(y, Math.max(0, h - size)),
          w: Math.min(size, w),
          h: Math.min(size, h),
        };
        let score = 0;
        for (let yy = rect.y; yy < rect.y + rect.h; yy += 4)
          for (let xx = rect.x; xx < rect.x + rect.w; xx += 4) {
            const p = confidence[yy * w + xx];
            if (p > 0.25 && p < 0.75) score++;
          }
        cells.push({ rect, score });
      }
    cells.sort((a, b) => b.score - a.score);
    const selected = [];
    for (const cell of cells) {
      if (!cell.score) continue;
      if (
        selected.some(
          ({ rect: r }) =>
            cell.rect.x < r.x + r.w &&
            r.x < cell.rect.x + cell.rect.w &&
            cell.rect.y < r.y + r.h &&
            r.y < cell.rect.y + cell.rect.h,
        )
      )
        continue;
      selected.push(cell);
      if (selected.length === 2) break;
    }
    for (const { rect } of selected) {
      const crop = LocalBrush.crop(rgb, w, rect),
        out = await Segmentation.predict(crop, rect.w, rect.h, "biref");
      for (let y = 0; y < rect.h; y++)
        for (let x = 0; x < rect.w; x++) {
          const i = (rect.y + y) * w + rect.x + x,
            p = confidence[i];
          if (p <= 0.15 || p >= 0.85) continue;
          const weight = Math.min(
            1,
            x / 64,
            y / 64,
            (rect.w - 1 - x) / 64,
            (rect.h - 1 - y) / 64,
          );
          confidence[i] =
            p * (1 - weight) + out.confidence[y * rect.w + x] * weight;
        }
    }
    const { alpha } = MaskRefinement.refine(confidence, rgb, w, h, {
      radius: Math.min(3, Math.max(1, Math.round(Math.max(w, h) / 512))),
    });
    let outside = 0,
      boundary = 0;
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (confidence[i] === before[i]) continue;
        const inside = selected.some(
          ({ rect: r }) =>
            x > r.x && y > r.y && x < r.x + r.w - 1 && y < r.y + r.h - 1,
        );
        if (!inside) outside++;
      }
    self.postMessage(
      {
        type: "result",
        alpha: alpha.buffer,
        ms: performance.now() - start,
        roi: selected,
        outside,
        boundary,
      },
      [alpha.buffer],
    );
  } catch (error) {
    self.postMessage({ type: "error", message: String(error) });
  }
};
