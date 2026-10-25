"use strict";
globalThis.Segmentation = (() => {
  const runtime = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/";
  let ort, session, activeKey, backend;
  const progress = (message) => self.postMessage({ type: "progress", message });
  async function digest(buffer) {
    return Array.from(
      new Uint8Array(await crypto.subtle.digest("SHA-256", buffer)),
      (b) => b.toString(16).padStart(2, "0"),
    ).join("");
  }
  async function weights(key) {
    const spec = AIModels[key],
      url = new URL("model-cache/" + spec.sha256, location.href).href;
    let cache;
    try {
      cache = await caches.open("decoupe-models-v1");
    } catch {
      /* CacheStorage may be disabled. */
    }
    const cached = await cache?.match(url);
    if (cached && cached.headers.get("X-Model-SHA256") === spec.sha256) {
      progress("Modèle disponible dans le cache local…");
      return cached.arrayBuffer();
    }
    const buffer = new Uint8Array(spec.bytes);
    let received = 0;
    async function receive(address, offset, size) {
      const response = await fetch(address);
      if (!response.ok)
        throw Error(
          "Téléchargement du modèle impossible (" + response.status + ")",
        );
      const reader = response.body.getReader();
      let position = offset;
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        if (position + value.length > offset + size) {
          await reader.cancel();
          throw Error("Taille du modèle invalide");
        }
        buffer.set(value, position);
        position += value.length;
        received += value.length;
        progress(
          "Téléchargement du modèle… " +
            Math.round((100 * received) / spec.bytes) +
            " %",
        );
      }
      if (position !== offset + size) throw Error("Téléchargement incomplet");
    }
    if (spec.manifest) {
      const response = await fetch(new URL(spec.manifest, location.href));
      if (!response.ok) throw Error("Manifeste absent");
      const manifest = await response.json();
      for (const chunk of manifest.chunks)
        await receive(
          "https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/" +
            chunk.hash,
          chunk.offset,
          chunk.size,
        );
    } else await receive(spec.url, 0, spec.bytes);
    if ((await digest(buffer)) !== spec.sha256)
      throw Error("Intégrité du modèle non vérifiée");
    try {
      await cache?.put(
        url,
        new Response(buffer, {
          headers: {
            "X-Model-SHA256": spec.sha256,
            "Content-Type": "application/octet-stream",
          },
        }),
      );
    } catch {
      /* Quota failure must not prevent inference. */
    }
    return buffer.buffer;
  }
  async function load(key, device = "wasm") {
    if (session && activeKey === key && backend === device) return;
    await dispose();
    ort ||= await import(runtime + "ort.all.min.mjs");
    ort.env.wasm.wasmPaths = runtime;
    ort.env.wasm.numThreads = 1;
    ort.env.wasm.proxy = false;
    let buffer = await weights(key);
    progress("Préparation du moteur local…");
    try {
      session = await ort.InferenceSession.create(buffer, {
        executionProviders: [device],
        graphOptimizationLevel: "all",
      });
      backend = device;
    } catch (error) {
      if (device !== "webgpu") throw error;
      progress("Accélération indisponible. Passage au moteur CPU…");
      session = await ort.InferenceSession.create(buffer, {
        executionProviders: ["wasm"],
        graphOptimizationLevel: "all",
      });
      backend = "wasm";
    } finally {
      buffer = null;
    }
    activeKey = key;
  }
  function inputTensor(rgb, width, height, spec) {
    const size = spec.size,
      n = size * size,
      values = new Float32Array(3 * n);
    let rw = size,
      rh = size,
      x = 0,
      y = 0;
    if (spec.padding) {
      const scale = size / Math.max(width, height);
      rw = Math.max(1, Math.floor(width * scale));
      rh = Math.max(1, Math.floor(height * scale));
      x = Math.floor((size - rw) / 2);
      y = Math.floor((size - rh) / 2);
    }
    const mean = [0.485, 0.456, 0.406],
      std = [0.229, 0.224, 0.225];
    // Bilinear directly from immutable RGBA: no second full-resolution canvas/copy.
    for (let yy = 0; yy < rh; yy++)
      for (let xx = 0; xx < rw; xx++) {
        const sy = Math.max(
            0,
            Math.min(
              height - 1,
              spec.logits
                ? ((yy + 0.5) * height) / rh - 0.5
                : (yy * height) / rh,
            ),
          ),
          sx = Math.max(
            0,
            Math.min(
              width - 1,
              spec.logits ? ((xx + 0.5) * width) / rw - 0.5 : (xx * width) / rw,
            ),
          ),
          y0 = Math.floor(sy),
          x0 = Math.floor(sx),
          y1 = Math.min(height - 1, y0 + 1),
          x1 = Math.min(width - 1, x0 + 1),
          dx = sx - x0,
          dy = sy - y0,
          i = (y + yy) * size + x + xx;
        for (let k = 0; k < 3; k++) {
          const v =
            (rgb[(y0 * width + x0) * 4 + k] * (1 - dx) +
              rgb[(y0 * width + x1) * 4 + k] * dx) *
              (1 - dy) +
            (rgb[(y1 * width + x0) * 4 + k] * (1 - dx) +
              rgb[(y1 * width + x1) * 4 + k] * dx) *
              dy;
          values[k * n + i] = spec.padding
            ? v / 255
            : spec.logits
              ? (v / 255 - mean[k]) / std[k]
              : (Math.floor(v) - 128) / 256;
        }
      }
    return {
      tensor: new ort.Tensor("float32", values, [1, 3, size, size]),
      rect: { x, y, w: rw, h: rh },
    };
  }
  async function predict(rgb, width, height, key, device = "wasm") {
    await load(key, device);
    const spec = AIModels[key];
    const { tensor, rect } = inputTensor(rgb, width, height, spec);
    let outputs;
    const start = performance.now();
    progress("Analyse du sujet et des détails…");
    try {
      outputs = await session.run({ [spec.input]: tensor });
      const raw = outputs[spec.output].data;
      const probabilities = new Float32Array(raw.length);
      for (let i = 0; i < raw.length; i++) {
        const v = spec.logits ? 1 / (1 + Math.exp(-raw[i])) : raw[i];
        if (!Number.isFinite(v)) throw Error("Prédiction invalide");
        probabilities[i] = Math.max(0, Math.min(1, v));
      }
      return {
        confidence: MaskRefinement.resize(
          probabilities,
          spec.size,
          spec.size,
          width,
          height,
          rect,
        ),
        ms: performance.now() - start,
        backend,
      };
    } finally {
      tensor.dispose();
      if (outputs) for (const value of Object.values(outputs)) value.dispose();
    }
  }
  async function dispose() {
    if (session) await session.release();
    session = null;
    activeKey = null;
    backend = null;
  }
  return { predict, dispose };
})();
