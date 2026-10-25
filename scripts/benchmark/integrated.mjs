import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
const out = process.env.INTEGRATED_OUT || "work/v53/integrated";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
    channel: process.env.CI ? undefined : "chrome",
  }),
  page = await browser.newPage();
const requests = [];
page
  .context()
  .on("request", (r) => requests.push({ url: r.url(), method: r.method() }));
page.on("console", (m) => {
  if (m.type() === "error") console.log(m.text().slice(0, 300));
});
await page.addInitScript(() => {
  const W = Worker;
  window.inferenceResults = [];
  window.Worker = class extends W {
    constructor(...args) {
      super(...args);
      this.addEventListener("message", ({ data }) => {
        if (data.type === "result")
          inferenceResults.push({
            model: data.model,
            backend: data.backend,
            fallback: data.fallback,
            metrics: data.metrics,
          });
      });
    }
  };
});
await page.goto(
  process.env.TEST_BASE_URL || "http://127.0.0.1:4173/decoupe-ia/",
);
for (const [file, classic] of [
  ["person.jpg", false],
  ...(process.env.TEST_CLASSIC === "1" ? [["person.jpg", true]] : []),
]) {
  if (!classic) {
    await page.locator("#file").setInputFiles("tests/fixtures/quality/" + file);
    await page.waitForFunction(() => source && !busy);
  }
  const start = Date.now();
  await page.locator(classic ? "#classic" : "#remove").click();
  await page.waitForFunction(
    () =>
      !busy &&
      (!document.querySelector("#download").hidden ||
        document.querySelector("#status").classList.contains("error")),
    null,
    { timeout: 480000 },
  );
  const status = await page.locator("#status").textContent();
  if (
    await page.locator("#status").evaluate((e) => e.classList.contains("error"))
  )
    throw Error(status);
  const pending = page.waitForEvent("download");
  await page.locator("#download").click();
  const dl = await pending;
  await dl.saveAs(`${out}/${classic ? "classic" : "candidate"}-${file}.png`);
  const check = await page.evaluate(async () => {
    const b = await createImageBitmap(await (await fetch(resultURL)).blob()),
      c = document.createElement("canvas");
    c.width = b.width;
    c.height = b.height;
    const x = c.getContext("2d");
    x.drawImage(b, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height).data;
    const allowed = new Set(colorCorrections?.indices || []);
    let kept = 0,
      removed = 0,
      partial = 0,
      interiorColorErrors = 0,
      edgeChanges = 0;
    for (let i = 0; i < mask.length; i++) {
      if (d[i * 4 + 3] === 255) {
        kept++;
        for (let k = 0; k < 3; k++)
          if (d[i * 4 + k] !== source.data[i * 4 + k]) {
            if (allowed.has(i)) edgeChanges++;
            else interiorColorErrors++;
          }
      } else if (d[i * 4 + 3] === 0) removed++;
      else partial++;
    }
    return {
      width: c.width,
      height: c.height,
      kept,
      removed,
      partial,
      interiorColorErrors,
      edgeChanges,
      model: resultModel,
      worker: inferenceResults.at(-1),
    };
  });
  if (
    check.width !== 600 ||
    check.height !== 900 ||
    check.partial ||
    check.interiorColorErrors ||
    !check.kept ||
    !check.removed
  )
    throw Error(JSON.stringify(check));
  const result = {
    date: "2026-10-25",
    url: page.url(),
    classic,
    ms: Date.now() - start,
    status,
    ...check,
    requests,
  };
  await writeFile(
    `${out}/${classic ? "classic" : "candidate"}.json`,
    JSON.stringify(result, null, 2),
  );
  console.log(JSON.stringify({ ...result, requests: requests.length }));
}
await page.screenshot({ path: out + "/desktop.png", fullPage: true });
await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({ path: out + "/mobile.png", fullPage: true });
await browser.close();
