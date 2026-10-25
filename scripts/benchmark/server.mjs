import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
const files = {
  "/biref16.onnx": "work/v53/biref-fp16.onnx",
  "/anime.onnx": "work/v53/anime.onnx",
  "/biref.onnx": "work/models/birefnet512.onnx",
  "/biref1024.onnx": "work/models/model.onnx",
};
createServer(async (q, r) => {
  const f =
    files[q.url] ||
    "dist/" + (q.url.replace("/decoupe-ia/", "") || "index.html");
  try {
    const s = await stat(f);
    r.writeHead(200, {
      "Access-Control-Allow-Origin": "*",
      "Content-Length": s.size,
      "Content-Type": f.endsWith(".js")
        ? "text/javascript"
        : f.endsWith(".html")
          ? "text/html"
          : f.endsWith(".css")
            ? "text/css"
            : "application/octet-stream",
    });
    createReadStream(f).pipe(r);
  } catch {
    r.writeHead(404);
    r.end();
  }
}).listen(4180, "127.0.0.1");
