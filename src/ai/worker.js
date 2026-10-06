import { MODELS } from './models.js';
import { localRepair, selectionBounds } from '../core/pixels.js';
import { textureRepair } from '../core/texture.js';

let library, background, sam, processor, embeddings, embeddingKey, lama, ort;
async function releaseOtherModels(task) {
  if (task !== 'background' && background) {
    await background.model.dispose();
    background = null;
  }
  if (task !== 'segment' && sam) {
    if (embeddings) for (const value of Object.values(embeddings)) value.dispose?.();
    await sam.dispose();
    sam = null;
    processor = null;
    embeddings = null;
    embeddingKey = null;
  }
  if (task !== 'repair' && lama) {
    await lama.release();
    lama = null;
  }
}
const send = (id, progress) => self.postMessage({ id, progress });
async function transformers() {
  if (!library) {
    library = await import(
      'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js'
    );
    library.env.allowLocalModels = false;
    library.env.backends.onnx.wasm.numThreads = 1;
    library.env.backends.onnx.wasm.proxy = false;
    library.env.backends.onnx.wasm.wasmPaths =
      'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/';
  }
  return library;
}
function progress(id, label) {
  const last = new Map();
  return (event) => {
    if (event.status === 'progress') {
      const percent = Math.round(event.progress || 0);
      if (last.get(event.file) === percent) return;
      last.set(event.file, percent);
      send(id, `${label} · ${percent} % · ${event.file || ''}`);
    }
  };
}
async function raw(blob) {
  const { RawImage } = await transformers();
  return RawImage.fromBlob(blob);
}

async function removeBackground(id, blob) {
  const { AutoModel, AutoProcessor, RawImage } = await transformers();
  if (!background) {
    send(id, 'Chargement de BiRefNet · premier téléchargement…');
    const config = MODELS.background;
    const model = await AutoModel.from_pretrained(config.id, {
      revision: config.revision,
      dtype: 'fp32',
      device: 'wasm',
      progress_callback: progress(id, 'BiRefNet'),
    });
    const preprocessor = await AutoProcessor.from_pretrained(config.id, {
      revision: config.revision,
    });
    background = { model, preprocessor };
  }
  const image = await raw(blob);
  send(id, 'BiRefNet analyse les contours…');
  const inputs = await background.preprocessor(image);
  const output = await background.model({ input_image: inputs.pixel_values });
  const tensor = output.output_image ?? Object.values(output)[0];
  const mask = await RawImage.fromTensor(tensor[0].sigmoid().mul(255).to('uint8')).resize(
    image.width,
    image.height,
  );
  for (const value of Object.values(output)) value.dispose?.();
  inputs.pixel_values.dispose?.();
  return { mask: new Uint8ClampedArray(mask.data), width: image.width, height: image.height };
}

async function segment(id, blob, points, labels, key) {
  const { SamModel, AutoProcessor } = await transformers();
  const config = MODELS.segment;
  if (!sam) {
    send(id, 'Chargement de SlimSAM · premier téléchargement…');
    sam = await SamModel.from_pretrained(config.id, {
      revision: config.revision,
      dtype: 'q8',
      device: 'wasm',
      progress_callback: progress(id, 'SlimSAM'),
    });
    processor = await AutoProcessor.from_pretrained(config.id, { revision: config.revision });
  }
  const image = await raw(blob);
  const inputs = await processor(image, { input_points: [points], input_labels: [labels] });
  if (embeddingKey !== key) {
    if (embeddings) for (const value of Object.values(embeddings)) value.dispose?.();
    send(id, 'SlimSAM prépare l’image…');
    embeddings = await sam.get_image_embeddings(inputs);
    embeddingKey = key;
  }
  send(id, 'SlimSAM détecte l’objet indiqué…');
  const output = await sam({ ...inputs, ...embeddings });
  const masks = await processor.post_process_masks(
    output.pred_masks,
    inputs.original_sizes,
    inputs.reshaped_input_sizes,
  );
  const scores = output.iou_scores.data;
  let best = 0;
  for (let i = 1; i < scores.length; i++) if (scores[i] > scores[best]) best = i;
  const size = image.width * image.height;
  const mask = Uint8ClampedArray.from(
    masks[0].data.subarray(best * size, (best + 1) * size),
    (value) => (value ? 255 : 0),
  );
  const score = Math.max(0, Math.min(1, Number(scores[best])));
  for (const value of Object.values(output)) value.dispose?.();
  for (const value of Object.values(inputs)) value.dispose?.();
  for (const value of masks) value.dispose?.();
  return { mask, score };
}

async function modelBytes(id) {
  const url = MODELS.repair.url;
  const cache = self.caches ? await caches.open('decoupe-models-v4') : null;
  const cached = await cache?.match(url);
  if (cached) return cached.arrayBuffer();
  send(id, 'Téléchargement de LaMa · environ 200 Mo, conservés en cache…');
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Téléchargement LaMa impossible (HTTP ${response.status}).`);
  const copy = response.clone(),
    reader = response.body.getReader(),
    chunks = [];
  const total = Number(response.headers.get('Content-Length')) || 208044816;
  let loaded = 0,
    last = -1;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.length;
    const percent = Math.round((loaded / total) * 100);
    if (percent !== last) {
      send(id, `LaMa · téléchargement ${percent} %`);
      last = percent;
    }
  }
  const bytes = new Uint8Array(loaded);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  const buffer = bytes.buffer;
  try {
    await cache?.put(url, copy);
  } catch {
    /* Quota full: inference still works. */
  }
  return buffer;
}
async function repair(id, pixels, selection, width, height, method) {
  if (method === 'fast')
    return { pixels: localRepair(pixels, selection, width, height), method: 'Remplissage local' };
  if (method === 'texture') {
    send(id, 'Reconstruction des textures · sans téléchargement…');
    const bounds = selectionBounds(selection, width, height, 80);
    if (!bounds) throw new Error('Sélectionnez une zone à reconstruire.');
    const factor = Math.min(1, 384 / Math.max(bounds.width, bounds.height));
    const w = Math.max(1, Math.round(bounds.width * factor)),
      h = Math.max(1, Math.round(bounds.height * factor));
    const crop = new Uint8ClampedArray(w * h * 4),
      mask = new Uint8ClampedArray(w * h);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const sx = bounds.x + Math.min(bounds.width - 1, Math.floor(x / factor));
        const sy = bounds.y + Math.min(bounds.height - 1, Math.floor(y / factor)),
          i = sy * width + sx,
          q = y * w + x;
        crop.set(pixels.subarray(i * 4, i * 4 + 4), q * 4);
        mask[q] = selection[i];
      }
    const generated = textureRepair(crop, mask, w, h),
      output = pixels.slice();
    for (let y = bounds.y; y < bounds.y + bounds.height; y++)
      for (let x = bounds.x; x < bounds.x + bounds.width; x++) {
        const i = y * width + x;
        if (!selection[i]) continue;
        const q =
          Math.min(h - 1, Math.floor((y - bounds.y) * factor)) * w +
          Math.min(w - 1, Math.floor((x - bounds.x) * factor));
        for (let c = 0; c < 3; c++) output[i * 4 + c] = generated[q * 4 + c];
      }
    return { pixels: output, method: 'Texture locale' };
  }
  if (!lama) {
    ort = await import('https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/ort.wasm.min.mjs');
    ort.env.wasm.numThreads = 1;
    ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/';
    lama = await ort.InferenceSession.create(await modelBytes(id), {
      executionProviders: ['wasm'],
    });
  }
  const bounds = selectionBounds(selection, width, height, 96);
  if (!bounds) throw new Error('Peignez ou sélectionnez un objet avant de reconstruire le fond.');
  // Crop with context; infer a padded square rather than distorting the source.
  const side = Math.max(bounds.width, bounds.height),
    scale = 512 / side;
  const ox = bounds.x - (side - bounds.width) / 2,
    oy = bounds.y - (side - bounds.height) / 2;
  const rgb = new Float32Array(3 * 512 * 512),
    region = new Float32Array(512 * 512);
  for (let y = 0; y < 512; y++)
    for (let x = 0; x < 512; x++) {
      const sx = Math.max(0, Math.min(width - 1, Math.floor(ox + x / scale)));
      const sy = Math.max(0, Math.min(height - 1, Math.floor(oy + y / scale)));
      const i = sy * width + sx,
        q = y * 512 + x;
      for (let c = 0; c < 3; c++) rgb[c * 512 * 512 + q] = pixels[i * 4 + c] / 255;
      // Expand the binary repair mask to include anti-aliased edges.
      let selected = false;
      for (let dy = -2; dy <= 2 && !selected; dy++)
        for (let dx = -2; dx <= 2; dx++) {
          const xx = sx + dx,
            yy = sy + dy;
          if (xx >= 0 && yy >= 0 && xx < width && yy < height && selection[yy * width + xx]) {
            selected = true;
            break;
          }
        }
      region[q] = selected ? 1 : 0;
    }
  send(id, 'LaMa reconstruit le fond · gardez cet onglet ouvert…');
  const imageTensor = new ort.Tensor('float32', rgb, [1, 3, 512, 512]);
  const maskTensor = new ort.Tensor('float32', region, [1, 1, 512, 512]);
  const output = await lama.run({ image: imageTensor, mask: maskTensor });
  const result = output.output ?? Object.values(output)[0],
    data = result.data;
  const repaired = new Uint8ClampedArray(pixels);
  for (let y = bounds.y; y < bounds.y + bounds.height; y++)
    for (let x = bounds.x; x < bounds.x + bounds.width; x++) {
      const i = y * width + x;
      if (!selection[i]) continue;
      const xx = Math.max(0, Math.min(511, Math.round((x - ox) * scale)));
      const yy = Math.max(0, Math.min(511, Math.round((y - oy) * scale))),
        q = yy * 512 + xx;
      for (let c = 0; c < 3; c++) repaired[i * 4 + c] = data[c * 512 * 512 + q];
    }
  imageTensor.dispose();
  maskTensor.dispose();
  for (const value of Object.values(output)) value.dispose();
  return { pixels: repaired, method: 'LaMa' };
}

self.onmessage = async ({ data }) => {
  const { id, task } = data;
  try {
    await releaseOtherModels(task);
    let result;
    if (task === 'background') result = await removeBackground(id, data.blob);
    else if (task === 'segment')
      result = await segment(id, data.blob, data.points, data.labels, data.key);
    else if (task === 'repair')
      result = await repair(id, data.pixels, data.selection, data.width, data.height, data.method);
    else throw new Error('Action IA inconnue.');
    self.postMessage({ id, result });
  } catch (error) {
    const message =
      typeof error === 'number'
        ? 'Le moteur IA n’a pas pu terminer dans ce navigateur. Essayez une image plus petite ou les outils locaux.'
        : error.message || String(error);
    self.postMessage({ id, error: message });
  }
};
