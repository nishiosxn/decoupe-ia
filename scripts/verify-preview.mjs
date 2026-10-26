import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import { siteFiles } from "./site-files.mjs";
const base = process.argv[2] || "https://nishiosxn.github.io/decoupe-ia/";
const sha = execFileSync("git", ["rev-parse", "HEAD"], {
  encoding: "utf8",
}).trim();
for (const file of Object.values(siteFiles)) {
  const expected = execFileSync("git", ["show", `HEAD:dist/${file}`]);
  const url = new URL(file, base);
  url.searchParams.set("verify", sha);
  const response = await fetch(url, { cache: "no-store" });
  assert.equal(response.status, 200, file);
  const actual = new Uint8Array(await response.arrayBuffer());
  const digest = (b) => createHash("sha256").update(b).digest("hex");
  assert.equal(
    digest(actual),
    digest(expected),
    "Stale or modified preview resource: " + file,
  );
  console.log("PASS " + file);
}
for (const path of ["previews/v3.2.0/", "previews/v4.0.0/"])
  assert.equal(
    (await fetch(new URL(path, base))).status,
    200,
    "Archived preview " + path,
  );
console.log(
  JSON.stringify({
    base,
    sha,
    assets: Object.keys(siteFiles).length,
    archivedPreviews: 2,
  }),
);
