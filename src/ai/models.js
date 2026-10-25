"use strict";
globalThis.AIModels = Object.freeze({
  biref: {
    size: 512,
    bytes: 98484532,
    sha256: "eff9216bb2f9d3f023d9c2b7196845a7485739ab1f231593633e4d2344ffc516",
    url: "https://huggingface.co/studioludens/birefnet-lite-512/resolve/962e67969ec6acec9c19fab76acee4f5e22e990c/onnx/model_fp16.onnx",
    license: "MIT",
    input: "input_image",
    output: "output_image",
    logits: true,
  },
  isnet: {
    size: 1024,
    bytes: 88152708,
    sha256: "2eb4b5dda7ec41c617e59706e5aafa1f978c9a5f983d2518d9f0ae4d6eb04f20",
    manifest: "isnet-model.json",
    license: "Apache-2.0",
    input: "input",
    output: "output",
  },
});
