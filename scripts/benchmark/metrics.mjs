export function metrics(prediction, truth, width, height, tolerance = 2) {
  if (
    prediction.length !== width * height ||
    truth.length !== prediction.length
  )
    throw Error("Mask size mismatch");
  const n = prediction.length,
    pe = new Uint8Array(n),
    te = new Uint8Array(n);
  let tp = 0,
    fp = 0,
    fn = 0,
    interiorFalseNegative = 0;
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const i = y * width + x,
        p = prediction[i] > 0,
        t = truth[i] > 0;
      if (p && t) tp++;
      else if (p) fp++;
      else if (t) fn++;
      if (x && y && x < width - 1 && y < height - 1) {
        const neighbors = [i - 1, i + 1, i - width, i + width];
        pe[i] = p && neighbors.some((j) => !prediction[j]) ? 1 : 0;
        te[i] = t && neighbors.some((j) => !truth[j]) ? 1 : 0;
        if (
          t &&
          !p &&
          x >= 3 &&
          y >= 3 &&
          x < width - 3 &&
          y < height - 3 &&
          [-3, -2, -1, 1, 2, 3].every(
            (d) => truth[i + d] && truth[i + d * width],
          )
        )
          interiorFalseNegative++;
      }
    }
  function match(a, b) {
    let count = 0,
      matches = 0;
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++)
        if (a[y * width + x]) {
          count++;
          let found = false;
          for (let dy = -tolerance; dy <= tolerance && !found; dy++)
            for (let dx = -tolerance; dx <= tolerance; dx++) {
              const xx = x + dx,
                yy = y + dy;
              if (
                xx >= 0 &&
                yy >= 0 &&
                xx < width &&
                yy < height &&
                b[yy * width + xx]
              ) {
                found = true;
                break;
              }
            }
          if (found) matches++;
        }
    return count ? matches / count : 1;
  }
  const precision = match(pe, te),
    recall = match(te, pe);
  return {
    iou: tp / (tp + fp + fn) || 0,
    dice: (2 * tp) / (2 * tp + fp + fn) || 0,
    tp,
    fp,
    fn,
    interiorFalseNegative,
    boundaryPrecision2px: precision,
    boundaryRecall2px: recall,
    boundaryF1:
      precision + recall ? (2 * precision * recall) / (precision + recall) : 0,
  };
}
