/** RGB is never multiplied by the mask: only output alpha changes. */
export function composite(rgba, mask) {
  if (rgba.length !== mask.length * 4) throw new Error('Dimensions du masque invalides.');
  const output = new Uint8ClampedArray(rgba);
  for (let i = 0; i < mask.length; i++) output[i * 4 + 3] = Math.min(rgba[i * 4 + 3], mask[i]);
  return output;
}

export function applySelection(mask, original, selection, action) {
  if (selection.length !== mask.length) throw new Error('Sélection de dimensions invalides.');
  for (let i = 0; i < mask.length; i++) {
    const amount = selection[i] / 255;
    const target = action === 'restore' ? original[i * 4 + 3] : 0;
    mask[i] = Math.round(mask[i] + (target - mask[i]) * amount);
  }
}

export function brushSegment(target, original, width, height, a, b, radius, hardness, action) {
  const left = Math.max(0, Math.floor(Math.min(a.x, b.x) - radius));
  const right = Math.min(width - 1, Math.ceil(Math.max(a.x, b.x) + radius));
  const top = Math.max(0, Math.floor(Math.min(a.y, b.y) - radius));
  const bottom = Math.min(height - 1, Math.ceil(Math.max(a.y, b.y) + radius));
  const dx = b.x - a.x,
    dy = b.y - a.y,
    length = dx * dx + dy * dy;
  const inner = radius * hardness;
  for (let y = top; y <= bottom; y++)
    for (let x = left; x <= right; x++) {
      const t = length ? Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / length)) : 0;
      const distance = Math.hypot(x - a.x - t * dx, y - a.y - t * dy);
      if (distance > radius) continue;
      const coverage =
        distance <= inner || inner === radius ? 1 : (radius - distance) / (radius - inner);
      const i = y * width + x;
      if (action === 'select') target[i] = Math.max(target[i], Math.round(255 * coverage));
      else if (action === 'unselect') target[i] = Math.round(target[i] * (1 - coverage));
      else {
        const goal = action === 'restore' ? original[i * 4 + 3] : 0;
        target[i] = Math.round(target[i] + (goal - target[i]) * coverage);
      }
    }
}

export function selectionBounds(selection, width, height, padding = 0) {
  let x0 = width,
    y0 = height,
    x1 = -1,
    y1 = -1;
  for (let i = 0; i < selection.length; i++)
    if (selection[i]) {
      const x = i % width,
        y = Math.floor(i / width);
      x0 = Math.min(x0, x);
      y0 = Math.min(y0, y);
      x1 = Math.max(x1, x);
      y1 = Math.max(y1, y);
    }
  if (x1 < 0) return null;
  x0 = Math.max(0, x0 - padding);
  y0 = Math.max(0, y0 - padding);
  x1 = Math.min(width - 1, x1 + padding);
  y1 = Math.min(height - 1, y1 + padding);
  return { x: x0, y: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 };
}

export function mergeRepair(pixels, repaired, selection) {
  if (pixels.length !== repaired.length || pixels.length !== selection.length * 4)
    throw new Error('Dimensions de reconstruction invalides.');
  for (let i = 0; i < selection.length; i++) {
    const t = selection[i] / 255;
    if (!t) continue;
    for (let c = 0; c < 3; c++)
      pixels[i * 4 + c] = Math.round(pixels[i * 4 + c] * (1 - t) + repaired[i * 4 + c] * t);
  }
}

/** Fast, deterministic local fill. Explicitly separate from neural LaMa. */
export function localRepair(pixels, selection, width, height) {
  const output = new Uint8ClampedArray(pixels),
    known = new Uint8Array(selection.length);
  const queue = new Int32Array(selection.length);
  let head = 0,
    tail = 0;
  const neighbors = (i) => {
    const x = i % width,
      y = Math.floor(i / width),
      list = [];
    if (x) list.push(i - 1);
    if (x + 1 < width) list.push(i + 1);
    if (y) list.push(i - width);
    if (y + 1 < height) list.push(i + width);
    return list;
  };
  for (let i = 0; i < known.length; i++) known[i] = selection[i] === 0 ? 1 : 0;
  if (!known.some(Boolean)) throw new Error('Conservez du fond autour de la sélection.');
  for (let i = 0; i < known.length; i++)
    if (!known[i] && neighbors(i).some((j) => known[j] === 1)) {
      queue[tail++] = i;
      known[i] = 2;
    }
  while (head < tail) {
    const i = queue[head++],
      adjacent = neighbors(i),
      valid = adjacent.filter((j) => known[j] === 1);
    if (!valid.length) continue;
    for (let c = 0; c < 3; c++)
      output[i * 4 + c] = Math.round(
        valid.reduce((sum, j) => sum + output[j * 4 + c], 0) / valid.length,
      );
    known[i] = 1;
    for (const j of adjacent)
      if (!known[j]) {
        known[j] = 2;
        queue[tail++] = j;
      }
  }
  return output;
}
