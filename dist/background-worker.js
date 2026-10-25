"use strict";
importScripts("models.js", "mask-refinement.js", "segmentation.js");
let running = false;
self.onmessage = async ({ data }) => {
  if (running) return;
  running = true;
  try {
    const width = Number(data.image.type.match(/width=(\d+)/)?.[1]),
      height = Number(data.image.type.match(/height=(\d+)/)?.[1]);
    if (!width || !height || width * height > 32000000)
      throw Error("Dimensions invalides");
    const rgb = new Uint8ClampedArray(await data.image.arrayBuffer());
    if (rgb.length !== width * height * 4) throw Error("Image incomplète");
    let key = AIModels[data.model] ? data.model : "biref",
      fallback = false,
      prediction;
    try {
      prediction = await Segmentation.predict(
        rgb,
        width,
        height,
        key,
        data.device === "webgpu" ? "webgpu" : "wasm",
      );
    } catch (error) {
      console.warn("Segmentation candidate unavailable:", String(error));
      if (key === "isnet") throw error;
      fallback = true;
      key = "isnet";
      await Segmentation.dispose();
      self.postMessage({
        type: "progress",
        message:
          "Moteur spécialisé indisponible. Utilisation du moteur de secours…",
      });
      prediction = await Segmentation.predict(rgb, width, height, key, "wasm");
    }
    self.postMessage({
      type: "progress",
      message: "Préparation du masque à la résolution originale…",
    });
    const { alpha, uncertain } = MaskRefinement.refine(
      prediction.confidence,
      rgb,
      width,
      height,
      {
        radius:
          data.refine === false
            ? 0
            : Math.min(
                3,
                Math.max(1, Math.round(Math.max(width, height) / 512)),
              ),
      },
    );
    const corrections =
      key === "isnet" ||
      data.local ||
      data.decontaminate === false ||
      MaskRefinement.flatColorRisk(rgb)
        ? { indices: new Uint32Array(), colors: new Uint8Array() }
        : MaskRefinement.decontaminate(
            rgb,
            prediction.confidence,
            alpha,
            width,
            height,
            2,
          );
    self.postMessage(
      {
        type: "result",
        alpha: alpha.buffer,
        correctionIndices: corrections.indices.buffer,
        correctionColors: corrections.colors.buffer,
        model: key,
        fallback,
        backend: prediction.backend,
        metrics: {
          inferenceMs: prediction.ms,
          uncertain,
          corrected: corrections.indices.length,
        },
      },
      [alpha.buffer, corrections.indices.buffer, corrections.colors.buffer],
    );
  } catch (error) {
    console.error("Background removal:", error);
    self.postMessage({
      type: "error",
      message:
        "Le moteur local n’a pas pu traiter cette image. Vérifiez la connexion et réessayez.",
    });
  } finally {
    running = false;
  }
};
