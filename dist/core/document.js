import { composite } from './pixels.js';

export class ImageDocument {
  constructor(width, height, pixels, name = 'image') {
    if (pixels.length !== width * height * 4) throw new Error('Image invalide.');
    this.width = width;
    this.height = height;
    this.name = name;
    this.original = new Uint8ClampedArray(pixels);
    this.pixels = new Uint8ClampedArray(pixels);
    this.mask = Uint8ClampedArray.from({ length: width * height }, (_, i) => pixels[i * 4 + 3]);
    this.selection = new Uint8ClampedArray(width * height);
    this.past = [];
    this.future = [];
    this.revision = 0;
    // Snapshots include RGB edits and alpha; bound history by bytes, not only count.
    this.historyLimit = Math.max(
      2,
      Math.min(20, Math.floor((96 * 1024 * 1024) / (pixels.length * 1.5))),
    );
  }
  snapshot() {
    return {
      pixels: this.pixels.slice(),
      mask: this.mask.slice(),
      selection: this.selection.slice(),
    };
  }
  checkpoint() {
    this.past.push(this.snapshot());
    if (this.past.length > this.historyLimit) this.past.shift();
    this.future = [];
    this.revision++;
  }
  restore(state) {
    this.pixels = state.pixels;
    this.mask = state.mask;
    this.selection = state.selection;
    this.revision++;
  }
  undo() {
    if (!this.past.length) return false;
    this.future.push(this.snapshot());
    this.restore(this.past.pop());
    return true;
  }
  redo() {
    if (!this.future.length) return false;
    this.past.push(this.snapshot());
    this.restore(this.future.pop());
    return true;
  }
  output() {
    return composite(this.pixels, this.mask);
  }
  reset() {
    this.checkpoint();
    this.pixels = this.original.slice();
    this.mask = Uint8ClampedArray.from(this.mask, (_, i) => this.original[i * 4 + 3]);
    this.selection.fill(0);
  }
}
