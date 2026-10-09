import { test, expect } from "@playwright/test";
import { mkdir, writeFile, readFile } from "node:fs/promises";
const cases = [
  "person.jpg",
  "watch.jpg",
  "car-1.jpg",
  "plants-1.jpg",
  "shoe.jpg",
];
test("real ISNet representative images", async ({ page }) => {
  test.skip(
    process.env.REAL_AI !== "1",
    "Opt-in: downloads actual model, requires work/fixtures",
  );
  if (process.env.AI_MODEL_MIRROR)
    await page.context().route("https://staticimgly.com/**", (route) =>
      route.fulfill({
        status: 302,
        headers: {
          location:
            process.env.AI_MODEL_MIRROR +
            "/" +
            new URL(route.request().url()).pathname.split("/").pop(),
          "Access-Control-Allow-Origin": "*",
        },
        body: "",
      }),
    );
  await mkdir("work/results", { recursive: true });
  const report = [];
  for (const name of cases.filter(
    (name) => !process.env.AI_CASE || name === process.env.AI_CASE,
  )) {
    if (name === "shoe.jpg")
      await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("");
    await page.locator("#file").setInputFiles("work/fixtures/" + name);
    await expect(page.locator("#remove")).toBeVisible();
    const before = await page.evaluate(() => ({
      width: source.width,
      height: source.height,
    }));
    const start = Date.now();
    await page.locator("#remove").click();
    await page.waitForFunction(
      () =>
        document.querySelector("#status").classList.contains("error") ||
        !document.querySelector("#download").hidden,
      { timeout: 480000 },
    );
    await expect(page.locator("#download")).toBeVisible();
    const pending = page.waitForEvent("download");
    await page.locator("#download").click();
    const dl = await pending;
    await dl.saveAs("work/results/" + name + ".png");
    const check = await page.evaluate(async (original) => {
      const b = await createImageBitmap(await (await fetch(resultURL)).blob());
      const c = document.createElement("canvas");
      c.width = b.width;
      c.height = b.height;
      const x = c.getContext("2d");
      x.drawImage(b, 0, 0);
      const d = x.getImageData(0, 0, c.width, c.height).data;
      let kept = 0,
        removed = 0,
        partial = 0,
        colorErrors = 0;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] === 255) {
          kept++;
          for (let k = 0; k < 3; k++)
            if (d[i + k] !== source.data[i + k]) colorErrors++;
        } else if (d[i + 3] === 0) removed++;
        else partial++;
      }
      return {
        width: b.width,
        height: b.height,
        kept,
        removed,
        partial,
        colorErrors,
      };
    }, before);
    expect(check.width).toBe(before.width);
    expect(check.height).toBe(before.height);
    expect(check.partial).toBe(0);
    expect(check.colorErrors).toBe(0);
    expect(check.kept).toBeGreaterThan(0);
    expect(check.removed).toBeGreaterThan(0);
    report.push({ name, ...check, ms: Date.now() - start });
    console.log(JSON.stringify(report.at(-1)));
  }
  await writeFile("work/results/report.json", JSON.stringify(report, null, 2));
});
