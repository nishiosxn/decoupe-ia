// Exact revisions keep published candidates reproducible.
export const MODELS = {
  background: {
    id: 'studioludens/birefnet-lite-512',
    revision: '4a3c40c36c94093cc1e724d9ea428b8fa4b57dc7',
    license: 'MIT',
  },
  segment: {
    id: 'Xenova/slimsam-77-uniform',
    revision: '5850ab45f587c112167512ffef949107115e26a0',
    license: 'Apache-2.0',
  },
  repair: {
    url: 'https://huggingface.co/sapienkit/LaMa-ONNX/resolve/0153b00d76c01058d825296ee162b46ff75ce05d/lama_fp32.onnx',
    license: 'Apache-2.0',
  },
};
