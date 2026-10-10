import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
const mock = `onmessage=({data})=>{const n=Number(data.image.type.match(/width=(\\d+)/)[1])*Number(data.image.type.match(/height=(\\d+)/)[1]);const a=new Uint8Array(n);for(let i=0;i<n;i++)a[i]=i%3===2?255:0;postMessage({type:'result',alpha:a.buffer})}`;
async function start(page, width = 300, height = 200, workerBody = mock) {
  await page.addInitScript(() => {
    window.workerCount = 0;
    const NativeWorker = Worker;
    window.Worker = class extends NativeWorker {
      constructor(...args) {
        super(...args);
        window.workerCount++;
      }
    };
  });
  await page.route("**/background-worker.js", (r) =>
    r.fulfill({ contentType: "text/javascript", body: workerBody }),
  );
  await page.goto("");
  const bytes = await page.evaluate(
    async ({ width, height }) => {
      const c = document.createElement("canvas");
      c.width = width;
      c.height = height;
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#3f72ab";
      ctx.fillRect(0, 0, width, height);
      return [
        ...new Uint8Array(
          await (await new Promise((r) => c.toBlob(r))).arrayBuffer(),
        ),
      ];
    },
    { width, height },
  );
  await page.locator("#file").setInputFiles({
    name: "compare.png",
    mimeType: "image/png",
    buffer: Buffer.from(bytes),
  });
  await expect(page.locator("#compare")).toBeHidden();
  await expect(page.locator("#backgrounds")).toBeHidden();
  await expect(page.locator("#original")).toBeVisible();
  await page.locator("#remove").click();
  await expect(page.locator("#download")).toBeVisible();
  await expect(page.locator("#compare")).toHaveValue("50");
  return bytes;
}
async function decodedDownload(page) {
  const pending = page.waitForEvent("download");
  await page.locator("#download").click();
  const d = await pending;
  const bytes = await readFile(await d.path());
  const pixels = await page.evaluate(
    async (bytes) => {
      const bitmap = await createImageBitmap(
        new Blob([new Uint8Array(bytes)], { type: "image/png" }),
      );
      const c = document.createElement("canvas");
      c.width = bitmap.width;
      c.height = bitmap.height;
      const ctx = c.getContext("2d");
      ctx.drawImage(bitmap, 0, 0);
      bitmap.close();
      return {
        width: c.width,
        height: c.height,
        data: [...ctx.getImageData(0, 0, c.width, c.height).data],
      };
    },
    [...bytes],
  );
  return { ...pixels, name: d.suggestedFilename() };
}
for (const mobile of [false, true])
  test(`comparison and background PNGs ${mobile ? "mobile" : "desktop"}`, async ({
    page,
  }) => {
    await page.setViewportSize(
      mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 },
    );
    const input = await start(page, 3, 2);
    const url = await page.evaluate(() => resultURL);
    await expect(page.locator("[value=transparent]")).toBeChecked();
    const slider = page.locator("#compare");
    await slider.focus();
    for (const [key, value] of [
      ["Home", "0"],
      ["End", "100"],
      ["ArrowLeft", "99"],
      ["Home", "0"],
    ]) {
      await slider.press(key);
      await expect(slider).toHaveValue(value);
      await expect(slider).toHaveAttribute("aria-valuenow", value);
    }
    const box = await slider.boundingBox();
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.5, {
      steps: 12,
    });
    await page.mouse.up();
    await expect(slider).toHaveValue("80");
    for (const background of [
      "transparent",
      "white",
      "black",
      "white",
      "transparent",
    ]) {
      await page.locator("input[value=" + background + "]").check();
      const out = await decodedDownload(page);
      expect(out.width).toBe(3);
      expect(out.height).toBe(2);
      for (let i = 0; i < 6; i++) {
        const p = out.data.slice(i * 4, i * 4 + 4);
        if (i % 3 === 2) expect(p).toEqual([63, 114, 171, 255]);
        else if (background === "transparent") expect(p[3]).toBe(0);
        else
          expect(p).toEqual(
            background === "white" ? [255, 255, 255, 255] : [0, 0, 0, 255],
          );
      }
      expect(await page.evaluate(() => workerCount)).toBe(1);
      expect(await page.evaluate(() => resultURL)).toBe(url);
    }
    await page.locator("input[value=black]").check();
    await page.locator("#file").setInputFiles({
      name: "again.png",
      mimeType: "image/png",
      buffer: Buffer.from(input),
    });
    await expect(slider).toBeHidden();
    await expect(page.locator("#backgrounds")).toBeHidden();
    await page.locator("#remove").click();
    await expect(page.locator("#download")).toBeVisible();
    await expect(slider).toHaveValue("50");
    await expect(page.locator("input[value=transparent]")).toBeChecked();
    expect(await page.evaluate(() => workerCount)).toBe(2);
    expect((await decodedDownload(page)).name).toBe("again-sans-fond.png");
  });
for (const [width, height] of [
  [300, 200],
  [120, 360],
])
  for (const mobile of [false, true])
    test(`alignment ${width}x${height} ${mobile ? "mobile" : "desktop"}`, async ({
      page,
    }) => {
      await page.setViewportSize(
        mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 },
      );
      await start(page, width, height);
      const first = await page.locator("#original").boundingBox(),
        second = await page.locator("#result").boundingBox();
      expect(second).toEqual(first);
      expect(first.width / first.height).toBeCloseTo(width / height, 2);
      await page.setViewportSize(
        mobile ? { width: 844, height: 390 } : { width: 800, height: 900 },
      );
      expect(await page.locator("#result").boundingBox()).toEqual(
        await page.locator("#original").boundingBox(),
      );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    });
test("actual rendered reveal at 0, 50 and 100 percent", async ({ page }) => {
  await start(page, 3, 2, mock.replace("i%3===2", "i%3===1"));
  await page.locator("input[value=white]").check();
  await page.locator("#comparison").scrollIntoViewIfNeeded();
  const slider = page.locator("#compare");
  await slider.focus();
  async function colors() {
    const bytes = await page.locator("#comparison").screenshot();
    return page.evaluate(
      async (bytes) => {
        const bitmap = await createImageBitmap(
          new Blob([new Uint8Array(bytes)], { type: "image/png" }),
        );
        const c = document.createElement("canvas");
        c.width = bitmap.width;
        c.height = bitmap.height;
        const ctx = c.getContext("2d");
        ctx.drawImage(bitmap, 0, 0);
        return [
          [0.15, 0.2],
          [0.85, 0.8],
        ].map(([x, y]) => [
          ...ctx.getImageData(
            Math.floor(x * c.width),
            Math.floor(y * c.height),
            1,
            1,
          ).data,
        ]);
      },
      [...bytes],
    );
  }
  await slider.press("Home");
  expect(await colors()).toEqual([
    [63, 114, 171, 255],
    [63, 114, 171, 255],
  ]);
  await page.evaluate(() => setComparison(50));
  expect(await colors()).toEqual([
    [255, 255, 255, 255],
    [63, 114, 171, 255],
  ]);
  await slider.press("End");
  expect(await colors()).toEqual([
    [255, 255, 255, 255],
    [255, 255, 255, 255],
  ]);
});
test("touch drag updates comparison and keeps capture outside frame", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await start(page);
  const slider = page.locator("#compare");
  await slider.scrollIntoViewIfNeeded();
  const box = await slider.boundingBox();
  const session = await context.newCDPSession(page);
  const y = box.y + box.height / 2;
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: box.x + box.width * 0.2, y }],
  });
  for (const value of [0.4, 0.6, 0.8])
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: box.x + box.width * value, y }],
    });
  await expect(slider).toHaveValue("80");
  await session.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: box.x + box.width + 12, y }],
  });
  await expect(slider).toHaveValue("100");
  await session.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: box.x - 12, y }],
  });
  await expect(slider).toHaveValue("0");
  await session.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  expect(await page.evaluate(() => workerCount)).toBe(1);
  await context.close();
});
