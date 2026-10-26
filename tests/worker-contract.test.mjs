import { test } from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import "../src/core/mask-refinement.js";
function worker(predict) {
  const messages = [],
    calls = [];
  const context = vm.createContext({
    self: { postMessage: (d) => messages.push(d) },
    importScripts() {},
    AIModels: { biref: {}, isnet: {} },
    Segmentation: {
      predict: async (...args) => {
        calls.push(args[3]);
        return predict(...args);
      },
      dispose: async () => {},
    },
    MaskRefinement,
    Uint8Array,
    Uint8ClampedArray,
    Uint32Array,
    Float32Array,
    console: { warn() {}, error() {} },
  });
  vm.runInContext(readFileSync("src/ai/background-worker.js", "utf8"), context);
  return { context, messages, calls };
}
const image = () =>
  new Blob([new Uint8Array([10, 20, 30, 255, 60, 70, 80, 255])], {
    type: "image/x-rgba8;width=2;height=1",
  });
test("candidate failure falls back once and preserves binary worker output", async () => {
  const w = worker(async (rgb, width, height, key) => {
    if (key === "biref") throw Error("unsupported");
    return {
      confidence: Float32Array.from([0.01, 0.99]),
      backend: "wasm",
      ms: 1,
    };
  });
  await w.context.self.onmessage({ data: { image: image() } });
  assert.deepEqual(w.calls, ["biref", "isnet"]);
  const result = w.messages.find((m) => m.type === "result");
  assert.equal(result.fallback, true);
  assert.equal(result.model, "isnet");
  assert.deepEqual([...new Uint8Array(result.alpha)], [0, 255]);
});
test("invalid input never reaches inference and a following valid request can recover", async () => {
  const w = worker(async () => ({
    confidence: Float32Array.from([0.01, 0.99]),
    backend: "wasm",
    ms: 1,
  }));
  await w.context.self.onmessage({
    data: {
      image: new Blob([new Uint8Array(1)], {
        type: "image/x-rgba8;width=2;height=1",
      }),
    },
  });
  assert.equal(w.calls.length, 0);
  assert.equal(w.messages.at(-1).type, "error");
  await w.context.self.onmessage({ data: { image: image() } });
  assert.equal(w.messages.at(-1).type, "result");
});
