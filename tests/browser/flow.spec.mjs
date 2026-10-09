import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
const mock = `onmessage=()=>{postMessage({type:'progress',message:'Analyse…'});setTimeout(()=>postMessage({type:'result',alpha:new Uint8Array([0,127,128,255,200,0]).buffer}),500)}`;
async function fixture(page) {
  return page.evaluate(async () => {
    const c = document.createElement("canvas");
    c.width = 3;
    c.height = 2;
    const x = c.getContext("2d");
    x.fillStyle = "#3f72ab";
    x.fillRect(0, 0, 3, 2);
    return Array.from(
      new Uint8Array(
        await (await new Promise((r) => c.toBlob(r))).arrayBuffer(),
      ),
    );
  });
}
async function upload(page) {
  await page
    .locator("#file")
    .setInputFiles({
      name: "test.png",
      mimeType: "image/png",
      buffer: Buffer.from(await fixture(page)),
    });
}
for (const mobile of [false, true])
  test(`import process download ${mobile ? "mobile" : "desktop"}`, async ({
    page,
  }) => {
    await page.setViewportSize(
      mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 },
    );
    await page.route("**/background-worker.js", (r) =>
      r.fulfill({ contentType: "text/javascript", body: mock }),
    );
    await page.goto("");
    await upload(page);
    await expect(page.locator("#original")).toBeVisible();
    await page.locator("#remove").click();
    await expect(page.locator("#change")).toBeDisabled();
    await expect(page.locator("#download")).toBeVisible();
    const pending = page.waitForEvent("download");
    await page.locator("#download").click();
    const download = await pending;
    expect(download.suggestedFilename()).toBe("test-sans-fond.png");
    const bytes = await readFile(await download.path());
    const out = await page.evaluate(
      async (bytes) => {
        const bmp = await createImageBitmap(
          new Blob([new Uint8Array(bytes)], { type: "image/png" }),
        );
        const c = document.createElement("canvas");
        c.width = bmp.width;
        c.height = bmp.height;
        const x = c.getContext("2d");
        x.drawImage(bmp, 0, 0);
        const d = [...x.getImageData(0, 0, c.width, c.height).data];
        return {
          w: c.width,
          h: c.height,
          alpha: d.filter((_, i) => i % 4 === 3),
          rgb: d.slice(8, 11),
        };
      },
      [...bytes],
    );
    expect(out).toEqual({
      w: 3,
      h: 2,
      alpha: [0, 0, 255, 255, 255, 0],
      rgb: [63, 114, 171],
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await upload(page);
    await expect(page.locator("#download")).toBeHidden();
    await expect(page.locator("#remove")).toBeVisible();
  });
test("cancel and retry after inference error", async ({ page }) => {
  await page.route("**/background-worker.js", (r) =>
    r.fulfill({
      contentType: "text/javascript",
      body: `onmessage=()=>setTimeout(()=>postMessage({type:'error'}),1000)`,
    }),
  );
  await page.goto("");
  await upload(page);
  await page.locator("#remove").click();
  await page.locator("#cancel").click();
  await expect(page.locator("#status")).toContainText("annulé");
  await page.locator("#remove").click();
  await expect(page.locator("#status")).toContainText("échoué");
  await expect(page.locator("#remove")).toBeEnabled();
  await expect(page.locator("#original")).toBeVisible();
});
test("invalid import does not destroy current image", async ({ page }) => {
  await page.goto("");
  await upload(page);
  await page
    .locator("#file")
    .setInputFiles({
      name: "broken.png",
      mimeType: "image/png",
      buffer: Buffer.from("invalid"),
    });
  await expect(page.locator("#status")).toHaveClass(/error/);
  await expect(page.locator("#original")).toBeVisible();
  await expect(page.locator("#remove")).toBeEnabled();
});
test("drop import and locked drop during analysis", async ({ page }) => {
  await page.route("**/background-worker.js", (r) =>
    r.fulfill({ contentType: "text/javascript", body: mock }),
  );
  await page.goto("");
  const bytes = await fixture(page);
  const drop = async (name) => {
    const transfer = await page.evaluateHandle(
      ({ bytes, name }) => {
        const dt = new DataTransfer();
        dt.items.add(
          new File([new Uint8Array(bytes)], name, { type: "image/png" }),
        );
        return dt;
      },
      { bytes, name },
    );
    await page
      .locator("#drop")
      .dispatchEvent("drop", { dataTransfer: transfer });
    await transfer.dispose();
  };
  await drop("dropped.png");
  await expect(page.locator("#info")).toContainText("dropped.png");
  await page.locator("#remove").click();
  await drop("blocked.png");
  await expect(page.locator("#info")).toContainText("dropped.png");
  await expect(page.locator("#download")).toBeVisible();
});
