import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
await mkdir("work/v53", { recursive: true });
await mkdir("work/models", { recursive: true });
const files = [
  [
    "work/v53/anime.onnx",
    "https://huggingface.co/skytnt/anime-seg/resolve/493cb60893f47441b26ec4fb9a306bce9e342982/isnetis.onnx",
    "f15622d853e8260172812b657053460e20806f04b9e05147d49af7bed31a6e99",
  ],
  [
    "work/models/birefnet512.onnx",
    "https://huggingface.co/studioludens/birefnet-lite-512/resolve/962e67969ec6acec9c19fab76acee4f5e22e990c/onnx/model.onnx",
    "1cb0fb360dadd15af77c639085d77a9df67db0c64315560c3de005f676345ac2",
  ],
];
if (process.env.BENCH_1024 === "1")
  files.push([
    "work/models/model.onnx",
    "https://huggingface.co/onnx-community/BiRefNet_lite-ONNX/resolve/de15b22ba131738a16dff04aab8bdf8dc32e3ac1/onnx/model.onnx",
    "5600024376f572a557870a5eb0afb1e5961636bef4e1e22132025467d0f03333",
  ]);
for (const [path, url, hash] of files) {
  let bytes = await readFile(path).catch(() => null);
  if (!bytes) {
    console.log("Downloading " + url);
    const response = await fetch(url);
    if (!response.ok) throw Error(response.status);
    bytes = Buffer.from(await response.arrayBuffer());
  }
  if (createHash("sha256").update(bytes).digest("hex") !== hash)
    throw Error("SHA256 mismatch: " + path);
  await writeFile(path, bytes);
  console.log("Verified " + path);
}
await writeFile(
  "work/v53/baseline.js",
  execFileSync("git", ["show", "v5.2.0:src/ai/background-worker.js"]),
);
