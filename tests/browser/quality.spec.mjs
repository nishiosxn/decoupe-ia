import { test, expect } from "@playwright/test";
async function image(page, type = "image/png") {
  return Buffer.from(
    await page.evaluate(async (type) => {
      const c = document.createElement("canvas");
      c.width = 8;
      c.height = 6;
      const x = c.getContext("2d");
      x.fillStyle = "#cb7959";
      x.fillRect(0, 0, 8, 6);
      return [
        ...new Uint8Array(
          await (await new Promise((r) => c.toBlob(r, type))).arrayBuffer(),
        ),
      ];
    }, type),
  );
}
const mock = `onmessage=({data})=>{const w=Number(data.image.type.match(/width=(\\d+)/)[1]),h=Number(data.image.type.match(/height=(\\d+)/)[1]);const a=Uint8Array.from({length:w*h},(_,i)=>i%w<w/2?0:255);postMessage({type:'result',model:data.model||'biref',alpha:a.buffer});}`;
test("JPG PNG WebP imports keep decoded dimensions and offer explicit classic retry", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.modelRequests = [];
    const W = Worker;
    window.Worker = class extends W {
      postMessage(d) {
        modelRequests.push(d.model);
        super.postMessage(d);
      }
    };
  });
  await page.route("**/background-worker.js", (r) =>
    r.fulfill({ contentType: "text/javascript", body: mock }),
  );
  await page.goto("");
  for (const [type, name] of [
    ["image/jpeg", "a.jpg"],
    ["image/png", "a.png"],
    ["image/webp", "a.webp"],
  ]) {
    await page
      .locator("#file")
      .setInputFiles({ name, mimeType: type, buffer: await image(page, type) });
    await page.waitForFunction(() => source && !busy);
    expect(await page.evaluate(() => [source.width, source.height])).toEqual([
      8, 6,
    ]);
    await page.locator("#remove").click();
    await expect(page.locator("#classic")).toBeVisible();
    await page.locator("#classic").click();
    await expect(page.locator("#download")).toBeEnabled();
    expect(await page.evaluate(() => resultModel)).toBe("isnet");
  }
  expect(await page.evaluate(() => modelRequests)).toEqual([
    "biref",
    "isnet",
    "biref",
    "isnet",
    "biref",
    "isnet",
  ]);
});
test("worker-level failure retries classic once then allows recovery without changing source", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.modelRequests = [];
    const W = Worker;
    window.Worker = class extends W {
      postMessage(d) {
        modelRequests.push(d.model);
        super.postMessage(d);
      }
    };
  });
  await page.route("**/background-worker.js", (r) =>
    r.fulfill({
      contentType: "text/javascript",
      body: `onmessage=()=>postMessage({type:'error'})`,
    }),
  );
  await page.goto("");
  await page
    .locator("#file")
    .setInputFiles({
      name: "a.png",
      mimeType: "image/png",
      buffer: await image(page),
    });
  await page.locator("#remove").click();
  await expect(page.locator("#status")).toHaveClass(/error/);
  expect(await page.evaluate(() => modelRequests)).toEqual(["biref", "isnet"]);
  expect(await page.evaluate(() => source.width)).toBe(8);
  await expect(page.locator("#remove")).toBeEnabled();
  await page.route("**/background-worker.js", (r) =>
    r.fulfill({ contentType: "text/javascript", body: mock }),
  );
  await page.locator("#remove").click();
  await expect(page.locator("#download")).toBeVisible();
});
test("session is reused for current image and released on replacement", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.created = 0;
    window.terminated = 0;
    const W = Worker;
    window.Worker = class extends W {
      constructor(...a) {
        super(...a);
        created++;
      }
      terminate() {
        terminated++;
        super.terminate();
      }
    };
  });
  await page.route("**/background-worker.js", (r) =>
    r.fulfill({ contentType: "text/javascript", body: mock }),
  );
  await page.goto("");
  const png = await image(page);
  await page
    .locator("#file")
    .setInputFiles({ name: "a.png", mimeType: "image/png", buffer: png });
  await page.locator("#remove").click();
  await expect(page.locator("#download")).toBeVisible();
  await page.locator("#classic").click();
  await expect(page.locator("#download")).toBeEnabled();
  expect(await page.evaluate(() => ({ created, terminated }))).toEqual({
    created: 1,
    terminated: 0,
  });
  await page
    .locator("#file")
    .setInputFiles({ name: "b.png", mimeType: "image/png", buffer: png });
  await page.waitForFunction(() => !busy);
  expect(await page.evaluate(() => terminated)).toBe(1);
});
test("low-memory hint selects the validated classic model without extra download", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "deviceMemory", { value: 2 }),
  );
  await page.route("**/background-worker.js", (r) =>
    r.fulfill({ contentType: "text/javascript", body: mock }),
  );
  await page.goto("");
  await page
    .locator("#file")
    .setInputFiles({
      name: "small.png",
      mimeType: "image/png",
      buffer: await image(page),
    });
  await page.locator("#remove").click();
  await expect(page.locator("#download")).toBeVisible();
  expect(await page.evaluate(() => resultModel)).toBe("isnet");
});
