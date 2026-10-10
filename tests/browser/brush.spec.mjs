import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
async function setup(page) {
  await page.addInitScript(() => {
    window.requests = [];
    const W = Worker;
    window.Worker = class extends W {
      async postMessage(data) {
        const bytes = new Uint8Array(await data.image.arrayBuffer());
        requests.push({ type: data.image.type, first: [...bytes.slice(0, 4)] });
        super.postMessage(data);
      }
    };
  });
  let count = 0;
  await page.route("**/background-worker.js", (r) => {
    const global = ++count === 1;
    return r.fulfill({
      contentType: "text/javascript",
      body: `onmessage=({data})=>{const w=Number(data.image.type.match(/width=(\\d+)/)[1]),h=Number(data.image.type.match(/height=(\\d+)/)[1]);const a=new Uint8Array(w*h);for(let i=0;i<a.length;i++)a[i]=${global ? "i%w>=w/2?255:0" : "255"};postMessage({type:'result',alpha:a.buffer})}`,
    });
  });
  await page.goto("");
  const bytes = await page.evaluate(async () => {
    const c = document.createElement("canvas");
    c.width = 800;
    c.height = 600;
    const x = c.getContext("2d");
    x.fillStyle = "#3f72ab";
    x.fillRect(0, 0, 800, 600);
    return [
      ...new Uint8Array(
        await (await new Promise((r) => c.toBlob(r))).arrayBuffer(),
      ),
    ];
  });
  await page.locator("#file").setInputFiles({
    name: "brush.png",
    mimeType: "image/png",
    buffer: Buffer.from(bytes),
  });
  await expect(page.locator("#retouch")).toBeHidden();
  await page.locator("#remove").click();
  await expect(page.locator("#correct")).toBeVisible();
  await page.locator("#correct").click();
}
async function paint(page, x = 0.25, y = 0.5) {
  const c = page.locator("#brushOverlay");
  await c.scrollIntoViewIfNeeded();
  const r = await c.boundingBox();
  await page.mouse.move(r.x + r.width * x, r.y + r.height * y);
  await page.mouse.down();
  await page.mouse.move(r.x + r.width * (x + 0.025), r.y + r.height * y, {
    steps: 5,
  });
  await page.mouse.up();
}
async function snapshot(page) {
  return page.evaluate(() => [...mask]);
}
async function download(page) {
  const pending = page.waitForEvent("download");
  await page.locator("#download").click();
  const d = await pending,
    bytes = await readFile(await d.path());
  return page.evaluate(
    async (bytes) => {
      const b = await createImageBitmap(
        new Blob([new Uint8Array(bytes)], { type: "image/png" }),
      );
      const c = document.createElement("canvas");
      c.width = b.width;
      c.height = b.height;
      const ctx = c.getContext("2d");
      ctx.drawImage(b, 0, 0);
      const d = ctx.getImageData(0, 0, c.width, c.height).data;
      let partial = 0;
      for (let i = 3; i < d.length; i += 4)
        if (d[i] !== 0 && d[i] !== 255) partial++;
      return {
        width: c.width,
        height: c.height,
        partial,
        corner: [...d.slice(0, 4)],
        subject: [...d.slice((300 * 800 + 600) * 4, (300 * 800 + 600) * 4 + 4)],
      };
    },
    [...bytes],
  );
}
for (const mobile of [false, true])
  test(`local add is deferred, cropped, undoable and export-safe ${mobile ? "mobile" : "desktop"}`, async ({
    page,
  }) => {
    await page.setViewportSize(
      mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 },
    );
    await setup(page);
    const before = await snapshot(page);
    await paint(page);
    expect(await snapshot(page)).toEqual(before);
    await expect(page.locator("#download")).toBeDisabled();
    await page.locator("#applyLocal").click();
    await expect(page.locator("#status")).toContainText(
      "Correction locale appliquée",
    );
    const after = await snapshot(page);
    let changed = 0;
    for (let i = 0; i < after.length; i++)
      if (after[i] !== before[i]) {
        changed++;
        expect(i % 800).toBeLessThan(300);
        expect(Math.floor(i / 800)).toBeGreaterThan(200);
        expect(Math.floor(i / 800)).toBeLessThan(400);
      }
    expect(changed).toBeGreaterThan(0);
    const requests = await page.evaluate(() => requests);
    expect(requests).toHaveLength(2);
    expect(requests[1].type).not.toBe("image/x-rgba8;width=800;height=600");
    expect(requests[1].first).toEqual([63, 114, 171, 255]);
    await page.locator("#correct").click();
    await expect(page.locator("#compare")).toBeVisible();
    await page.locator("#compare").focus();
    await page.locator("#compare").press("Home");
    await expect(page.locator("#compare")).toHaveValue("0");
    for (const bg of ["transparent", "white", "black"]) {
      await page.locator("input[value=" + bg + "]").check();
      const out = await download(page);
      expect(out.width).toBe(800);
      expect(out.height).toBe(600);
      expect(out.partial).toBe(0);
      expect(out.subject).toEqual([63, 114, 171, 255]);
      expect(out.corner).toEqual(
        bg === "transparent"
          ? [0, 0, 0, 0]
          : bg === "white"
            ? [255, 255, 255, 255]
            : [0, 0, 0, 255],
      );
    }
    await page.locator("#correct").click();
    await page.locator("#undoLocal").click();
    await expect(page.locator("#status")).toContainText("annulée");
    expect(await snapshot(page)).toEqual(before);
    expect(await page.evaluate(() => requests.length)).toBe(2);
  });
test("remove only predicted background, failure is atomic and preserves strokes", async ({
  page,
}) => {
  await setup(page);
  await page.route("**/background-worker.js", (r) =>
    r.fulfill({
      contentType: "text/javascript",
      body: `onmessage=({data})=>{const w=Number(data.image.type.match(/width=(\\d+)/)[1]),h=Number(data.image.type.match(/height=(\\d+)/)[1]);postMessage({type:'result',alpha:new Uint8Array(w*h).buffer})}`,
    }),
  );
  await page.locator("#removeBrush").click();
  const before = await snapshot(page);
  await paint(page, 0.75);
  await page.locator("#applyLocal").click();
  await expect(page.locator("#status")).toContainText(
    "Correction locale appliquée",
  );
  const after = await snapshot(page);
  expect(after.reduce((n, v) => n + (v === 255), 0)).toBeLessThan(
    before.reduce((n, v) => n + (v === 255), 0),
  );
  expect(after.every((v, i) => i % 800 >= 500 || v === before[i])).toBe(true);
  await paint(page, 0.75);
  await page.route("**/background-worker.js", (r) =>
    r.fulfill({
      contentType: "text/javascript",
      body: `onmessage=()=>postMessage({type:'error'})`,
    }),
  );
  await page.locator("#applyLocal").click();
  await expect(page.locator("#status")).toHaveClass(/error/);
  expect(await snapshot(page)).toEqual(after);
  await expect(page.locator("#applyLocal")).toBeEnabled();
  await page.locator("#clearStrokes").click();
  await expect(page.locator("#download")).toBeEnabled();
});
test("brush has real touch strokes, does not edit before apply, and clear keeps mask", async ({
  browser,
}) => {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await ctx.newPage();
  await setup(page);
  const before = await snapshot(page),
    c = page.locator("#brushOverlay");
  await c.scrollIntoViewIfNeeded();
  const r = await c.boundingBox(),
    session = await ctx.newCDPSession(page);
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: r.x + r.width * 0.2, y: r.y + r.height * 0.5 }],
  });
  await session.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: r.x + r.width * 0.3, y: r.y + r.height * 0.5 }],
  });
  await session.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  expect(await page.evaluate(() => strokes.length)).toBe(1);
  expect(await snapshot(page)).toEqual(before);
  await page.locator("#clearStrokes").click();
  expect(await page.evaluate(() => strokes.length)).toBe(0);
  expect(await snapshot(page)).toEqual(before);
  await ctx.close();
});
