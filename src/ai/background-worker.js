"use strict";
self.onmessage = async ({ data }) => {
  try {
    const { segmentForeground } = await import(
      "https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/+esm"
    );
    const mask = await segmentForeground(data.image, {
      publicPath:
        "https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/",
      model: "isnet_fp16",
      device: "cpu",
      rescale: true,
      proxyToWorker: false,
      output: { format: "image/x-rgba8" },
      progress(key, current, total) {
        const message = key.startsWith("fetch:")
          ? "Téléchargement du modèle et du moteur… " +
            Math.round((current / total) * 100) +
            " %"
          : "Analyse du sujet et de l’arrière-plan…";
        self.postMessage({ type: "progress", message });
      },
    });
    const rgba = new Uint8Array(await mask.arrayBuffer()),
      alpha = new Uint8Array(rgba.length / 4);
    for (let i = 0; i < alpha.length; i++) alpha[i] = rgba[i * 4 + 3];
    self.postMessage({ type: "result", alpha: alpha.buffer }, [alpha.buffer]);
  } catch (error) {
    console.error("Background removal:", error);
    self.postMessage({ type: "error" });
  }
};
