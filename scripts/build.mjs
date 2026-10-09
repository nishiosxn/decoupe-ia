import { copyFile } from "node:fs/promises";
for (const [source, target] of [
  ["decoupe.html", "index.html"],
  ["favicon.svg", "favicon.svg"],
  ["background-worker.js", "background-worker.js"],
])
  await copyFile("outputs/" + source, "dist/" + target);
console.log("Distribution synchronized.");
