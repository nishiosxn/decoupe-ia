"use strict";
// Internal confidence stays soft. Only the last step creates the binary export mask.
globalThis.MaskRefinement = (() => {
  function resize(
    values,
    sw,
    sh,
    width,
    height,
    rect = { x: 0, y: 0, w: sw, h: sh },
  ) {
    const out = new Float32Array(width * height);
    for (let y = 0; y < height; y++) {
      const sy = Math.max(
        rect.y,
        Math.min(
          rect.y + rect.h - 1,
          rect.y + ((y + 0.5) * rect.h) / height - 0.5,
        ),
      );
      const y0 = Math.floor(sy),
        y1 = Math.min(sh - 1, y0 + 1),
        dy = sy - y0;
      for (let x = 0; x < width; x++) {
        const sx = Math.max(
          rect.x,
          Math.min(
            rect.x + rect.w - 1,
            rect.x + ((x + 0.5) * rect.w) / width - 0.5,
          ),
        );
        const x0 = Math.floor(sx),
          x1 = Math.min(sw - 1, x0 + 1),
          dx = sx - x0;
        out[y * width + x] =
          (values[y0 * sw + x0] * (1 - dx) + values[y0 * sw + x1] * dx) *
            (1 - dy) +
          (values[y1 * sw + x0] * (1 - dx) + values[y1 * sw + x1] * dx) * dy;
      }
    }
    return out;
  }
  function colorDistance(rgb, a, b) {
    let sum = 0;
    for (let k = 0; k < 3; k++) sum += (rgb[a * 4 + k] - rgb[b * 4 + k]) ** 2;
    return sum;
  }
  function refine(
    confidence,
    rgb,
    width,
    height,
    { radius = 1, threshold = 0.5 } = {},
  ) {
    if (
      confidence.length !== width * height ||
      rgb.length !== width * height * 4
    )
      throw Error("Dimensions du masque incohérentes");
    const alpha = new Uint8Array(confidence.length);
    let uncertain = 0;
    // Joint bilateral at original resolution, limited to uncertain pixels; no erosion/dilation.
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++) {
        const i = y * width + x,
          p = confidence[i];
        let q = p;
        if (p > 0.15 && p < 0.85 && radius > 0) {
          uncertain++;
          let sum = 0,
            weight = 0;
          for (let dy = -radius; dy <= radius; dy++)
            for (let dx = -radius; dx <= radius; dx++) {
              const xx = x + dx,
                yy = y + dy;
              if (xx < 0 || yy < 0 || xx >= width || yy >= height) continue;
              const j = yy * width + xx,
                w =
                  1 /
                  ((1 + dx * dx + dy * dy) *
                    (1 + colorDistance(rgb, i, j) / 400));
              sum += confidence[j] * w;
              weight += w;
            }
          q = sum / weight;
        }
        alpha[i] = q >= threshold && rgb[i * 4 + 3] > 0 ? 255 : 0;
      }
    return { alpha, uncertain };
  }
  function decontaminate(rgb, confidence, alpha, width, height, band = 2) {
    if (![1, 2, 3].includes(band)) throw Error("Bande de contour invalide");
    const indices = [],
      colors = [];
    // Require an uncertain mixed pixel and confident foreground AND background witnesses.
    // High-confidence coloured line art and every interior pixel are left untouched.
    for (let y = band; y < height - band; y++)
      for (let x = band; x < width - band; x++) {
        const i = y * width + x,
          p = confidence[i];
        if (!alpha[i] || p < 0.45 || p > 0.85) continue;
        let fg = -1,
          bg = -1,
          fd = Infinity,
          bd = Infinity;
        for (let dy = -band; dy <= band; dy++)
          for (let dx = -band; dx <= band; dx++) {
            const j = (y + dy) * width + x + dx,
              d = dx * dx + dy * dy;
            if (alpha[j] && confidence[j] > 0.97 && d < fd) {
              fg = j;
              fd = d;
            }
            if (!alpha[j] && confidence[j] < 0.03 && d < bd) {
              bg = j;
              bd = d;
            }
          }
        if (fg < 0 || bg < 0) continue;
        let norm = 0,
          dot = 0;
        for (let k = 0; k < 3; k++) {
          const v = rgb[fg * 4 + k] - rgb[bg * 4 + k];
          norm += v * v;
          dot += (rgb[i * 4 + k] - rgb[bg * 4 + k]) * v;
        }
        if (norm < 6400) continue;
        const t = dot / norm;
        if (t < 0.45 || t > 0.85 || Math.abs(t - p) > 0.12) continue;
        let residual = 0;
        for (let k = 0; k < 3; k++)
          residual +=
            (rgb[i * 4 + k] -
              (rgb[bg * 4 + k] + t * (rgb[fg * 4 + k] - rgb[bg * 4 + k]))) **
            2;
        if (residual > 36) continue;
        indices.push(i);
        for (let k = 0; k < 3; k++) colors.push(rgb[fg * 4 + k]);
      }
    return {
      indices: Uint32Array.from(indices),
      colors: Uint8Array.from(colors),
    };
  }
  return { resize, refine, decontaminate };
})();
