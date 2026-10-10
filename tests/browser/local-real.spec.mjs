import { test, expect } from "@playwright/test";
import { writeFile, mkdir } from "node:fs/promises";
test("real ISNet local repair of controlled mask errors", async ({ page }) => {
  test.skip(
    process.env.LOCAL_AI !== "1",
    "Opt-in actual ISNet inference on a photograph",
  );
  if (process.env.AI_MODEL_MIRROR)
    await page
      .context()
      .route("https://staticimgly.com/**", (r) =>
        r.fulfill({
          status: 302,
          headers: {
            location:
              process.env.AI_MODEL_MIRROR +
              "/" +
              new URL(r.request().url()).pathname.split("/").pop(),
            "Access-Control-Allow-Origin": "*",
          },
          body: "",
        }),
      );
  await page.addInitScript(() => {
    window.cropRequests = [];
    const W = Worker;
    window.Worker = class extends W {
      postMessage(data) {
        cropRequests.push(data.image.type);
        super.postMessage(data);
      }
    };
  });
  await page.goto("");
  await page.locator("#file").setInputFiles("work/fixtures/person.jpg");
  await page.locator("#remove").click();
  await page.waitForFunction(
    () =>
      document.querySelector("#status").classList.contains("error") ||
      !document.querySelector("#download").hidden,
    { timeout: 480000 },
  );
  await expect(page.locator("#correct")).toBeVisible();
  await page.locator("#correct").click();
  const controls = await page.evaluate(async () => {
    window.globalReference = mask.slice();
    const fg = mask[450 * source.width + 300],
      bg = mask[300 * source.width + 120];
    // Deliberate segmentation errors, clearly separated from the real model's quality assessment.
    for (let y = 445; y < 455; y++)
      for (let x = 295; x < 305; x++) mask[y * source.width + x] = 0;
    for (let y = 295; y < 305; y++)
      for (let x = 115; x < 125; x++) mask[y * source.width + x] = 255;
    await showMask(mask.slice());
    window.beforeLocal = mask.slice();
    strokes = [
      { mode: "add", radius: 24, points: [{ x: 300, y: 450 }] },
      { mode: "remove", radius: 24, points: [{ x: 120, y: 300 }] },
    ];
    drawStrokes();
    updateRetouch();
    return { fg, bg };
  });
  expect(controls).toEqual({ fg: 255, bg: 0 });
  const start = Date.now();
  await page.locator("#applyLocal").click();
  await page.waitForFunction(() => !busy, { timeout: 480000 });
  await expect(page.locator("#status")).toContainText(
    "Correction locale appliquée",
  );
  const stats = await page.evaluate(() => {
    const rect = { x: 0, y: 0, w: source.width, h: source.height };
    const indicated = LocalBrush.coverage(
      [
        { mode: "add", radius: 24, points: [{ x: 300, y: 450 }] },
        { mode: "remove", radius: 24, points: [{ x: 120, y: 300 }] },
      ],
      rect,
    );
    let outside = 0,
      partial = 0,
      recovered = 0,
      removed = 0;
    for (let i = 0; i < mask.length; i++) {
      if (!indicated[i] && mask[i] !== beforeLocal[i]) outside++;
      if (mask[i] !== 0 && mask[i] !== 255) partial++;
      if (beforeLocal[i] === 0 && mask[i] === 255) recovered++;
      if (beforeLocal[i] === 255 && mask[i] === 0) removed++;
    }
    return {
      outside,
      partial,
      recovered,
      removed,
      width: source.width,
      height: source.height,
      requests: cropRequests,
      fg: mask[450 * source.width + 300],
      bg: mask[300 * source.width + 120],
    };
  });
  expect(stats.outside).toBe(0);
  expect(stats.partial).toBe(0);
  expect(stats.fg).toBe(255);
  expect(stats.bg).toBe(0);
  expect(stats.recovered).toBeGreaterThan(0);
  expect(stats.removed).toBeGreaterThan(0);
  expect(stats.requests.slice(1)).not.toContain(
    "image/x-rgba8;width=600;height=900",
  );
  await page.screenshot({ path: "work/v52-real-local.png", fullPage: true });
  await mkdir("work/results", { recursive: true });
  await writeFile(
    "work/results/local-real.json",
    JSON.stringify({ ...stats, localMs: Date.now() - start }, null, 2),
  );
  console.log(JSON.stringify(stats));
  await page.locator("#undoLocal").click();
  await expect(page.locator("#status")).toContainText("annulée");
  expect(
    await page.evaluate(() => mask.every((v, i) => v === beforeLocal[i])),
  ).toBe(true);
});
