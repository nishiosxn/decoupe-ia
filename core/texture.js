import { localRepair } from './pixels.js';

/** Patch-based synthesis: sources come only from unselected background patches. */
export function textureRepair(pixels, selection, width, height) {
  const output = localRepair(pixels, selection, width, height);
  const radius = 2,
    sources = [],
    targets = [];
  for (let y = radius; y < height - radius; y++)
    for (let x = radius; x < width - radius; x++) {
      const i = y * width + x;
      if (selection[i]) {
        targets.push(i);
        continue;
      }
      let valid = true;
      for (let dy = -radius; dy <= radius && valid; dy++)
        for (let dx = -radius; dx <= radius; dx++)
          if (selection[i + dy * width + dx]) {
            valid = false;
            break;
          }
      if (valid) sources.push(i);
    }
  if (!sources.length || !targets.length) return output;
  const permitted = new Uint8Array(selection.length);
  sources.forEach((i) => (permitted[i] = 1));
  const nearest = new Int32Array(selection.length).fill(-1),
    costs = new Float32Array(selection.length).fill(Infinity);
  let seed = 2437;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  function distance(i, source) {
    let score = 0,
      weight = 0;
    const x = i % width,
      y = Math.floor(i / width);
    for (let dy = -radius; dy <= radius; dy++)
      for (let dx = -radius; dx <= radius; dx++) {
        if (x + dx < 0 || y + dy < 0 || x + dx >= width || y + dy >= height) continue;
        const a = i + dy * width + dx,
          b = source + dy * width + dx,
          w = selection[a] ? 0.2 : 1;
        for (let c = 0; c < 3; c++) {
          const delta = output[a * 4 + c] - pixels[b * 4 + c];
          score += delta * delta * w;
        }
        weight += w;
      }
    return score / Math.max(1, weight);
  }
  function consider(i, source) {
    if (source < 0 || source >= permitted.length || !permitted[source]) return;
    const score = distance(i, source);
    if (score < costs[i]) {
      costs[i] = score;
      nearest[i] = source;
    }
  }
  for (const i of targets)
    for (let trial = 0; trial < 12; trial++)
      consider(i, sources[Math.floor(random() * sources.length)]);
  for (let pass = 0; pass < 5; pass++) {
    const direction = pass % 2 ? -1 : 1,
      order = direction === 1 ? targets : [...targets].reverse();
    for (const i of order) {
      costs[i] = distance(i, nearest[i]);
      const x = i % width,
        y = Math.floor(i / width);
      const horizontal = i - direction,
        vertical = i - direction * width;
      if (x - direction >= 0 && x - direction < width && nearest[horizontal] >= 0)
        consider(i, nearest[horizontal] + direction);
      if (y - direction >= 0 && y - direction < height && nearest[vertical] >= 0)
        consider(i, nearest[vertical] + direction * width);
      for (let span = Math.max(width, height); span >= 1; span = Math.floor(span / 2)) {
        const source = nearest[i],
          sx = source % width,
          sy = Math.floor(source / width);
        const xx = Math.max(
          radius,
          Math.min(width - radius - 1, Math.round(sx + (random() * 2 - 1) * span)),
        );
        const yy = Math.max(
          radius,
          Math.min(height - radius - 1, Math.round(sy + (random() * 2 - 1) * span)),
        );
        consider(i, yy * width + xx);
      }
      for (let c = 0; c < 3; c++) output[i * 4 + c] = pixels[nearest[i] * 4 + c];
    }
  }
  return output;
}
