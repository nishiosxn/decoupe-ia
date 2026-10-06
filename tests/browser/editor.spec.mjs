import { test, expect } from '@playwright/test';
async function demo(page) {
  await page.goto('./', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Essayer avec l’image de démonstration' }).click();
  await expect(page.locator('#dimensions')).toHaveText('900 × 650 px');
}
async function pixel(page, x, y) {
  return page
    .locator('#image')
    .evaluate((canvas, p) => [...canvas.getContext('2d').getImageData(p.x, p.y, 1, 1).data], {
      x,
      y,
    });
}
async function brush(page, x, y) {
  await page.locator('#interaction').scrollIntoViewIfNeeded();
  const r = await page.locator('#interaction').boundingBox();
  await page.mouse.move(r.x + (x / 900) * r.width, r.y + (y / 650) * r.height);
  await page.mouse.down();
  await page.mouse.up();
}
test('gomme, restoration, undo and downloaded PNG have actual transparent pixels', async ({
  page,
}) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await demo(page);
  const original = await pixel(page, 420, 330);
  expect(original[3]).toBe(255);
  await brush(page, 420, 330);
  await expect.poll(async () => (await pixel(page, 420, 330))[3]).toBe(0);
  expect((await pixel(page, 200, 200))[3]).toBe(255);
  const downloading = page.waitForEvent('download');
  await page.locator('#download').click();
  const download = await downloading;
  const fs = await import('node:fs/promises');
  const png = await fs.readFile(await download.path());
  const alpha = await page.evaluate(
    async (data) => {
      const bitmap = await createImageBitmap(
        new Blob([Uint8Array.from(data)], { type: 'image/png' }),
      );
      const c = document.createElement('canvas');
      c.width = bitmap.width;
      c.height = bitmap.height;
      c.getContext('2d').drawImage(bitmap, 0, 0);
      bitmap.close();
      return c.getContext('2d').getImageData(420, 330, 1, 1).data[3];
    },
    [...png],
  );
  expect(alpha).toBe(0);
  await page.locator('#undo').click();
  expect(await pixel(page, 420, 330)).toEqual(original);
  await page.locator('#redo').click();
  expect((await pixel(page, 420, 330))[3]).toBe(0);
  await page.locator('[data-tool=restore]').click();
  await brush(page, 420, 330);
  await expect.poll(async () => await pixel(page, 420, 330)).toEqual(original);
  expect(errors).toEqual([]);
});
test('fast repair and undo preserve the edited image', async ({ page }) => {
  await demo(page);
  await page.locator('[data-tool=select]').click();
  await brush(page, 752, 360);
  await expect(page.locator('#repair')).toBeEnabled();
  const original = await pixel(page, 752, 360);
  await page.locator('#repair-method').selectOption('fast');
  await page.locator('#repair').click();
  await expect(page.locator('#status')).toContainText('fond reconstruit', { timeout: 20000 });
  expect((await pixel(page, 752, 360))[3]).toBe(255);
  await expect(page.locator('#repair')).toBeDisabled();
  await page.locator('#undo').click();
  expect(await pixel(page, 752, 360)).toEqual(original);
});
test('texture reconstruction runs without model or network downloads', async ({
  page,
  context,
}) => {
  await context.route(/https:\/\/.*(huggingface|jsdelivr)/, (route) => route.abort());
  await demo(page);
  await page.locator('[data-tool=select]').click();
  await brush(page, 752, 360);
  await page.locator('#repair').click();
  await expect(page.locator('#status')).toContainText('Texture locale', { timeout: 20000 });
  expect((await pixel(page, 752, 360))[3]).toBe(255);
});
test('project roundtrip preserves transparent mask and original for restoration', async ({
  page,
}) => {
  await demo(page);
  await brush(page, 420, 330);
  const downloading = page.waitForEvent('download');
  await page.locator('#save-project').click();
  const project = await downloading;
  await page.locator('#reset').click();
  expect((await pixel(page, 420, 330))[3]).toBe(255);
  await page.locator('#project-file').setInputFiles(await project.path());
  await expect(page.locator('#status')).toContainText('Projet retrouvé');
  expect((await pixel(page, 420, 330))[3]).toBe(0);
  await page.locator('[data-tool=restore]').click();
  await brush(page, 420, 330);
  await expect.poll(async () => (await pixel(page, 420, 330))[3]).toBe(255);
});
test('mobile has no horizontal overflow and keeps export usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await demo(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('#download').scrollIntoViewIfNeeded();
  await expect(page.locator('#download')).toBeVisible();
});
test('an unavailable model preserves the document and unlocks manual tools', async ({
  page,
  context,
}) => {
  await context.route('**/transformers.min.js', (route) => route.abort());
  await demo(page);
  const before = await pixel(page, 420, 330);
  await page.locator('#background').click();
  await expect(page.locator('#status')).toContainText('conservé', { timeout: 15000 });
  expect(await pixel(page, 420, 330)).toEqual(before);
  await expect(page.locator('[data-tool=erase]')).toBeEnabled();
  await brush(page, 420, 330);
  await expect.poll(async () => (await pixel(page, 420, 330))[3]).toBe(0);
});
test('cancelling model initialization preserves pixels', async ({ page, context }) => {
  await context.route('**/transformers.min.js', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await route.abort();
  });
  await demo(page);
  const before = await pixel(page, 420, 330);
  await page.locator('#background').click();
  await page.locator('#cancel').click();
  await expect(page.locator('#status')).toContainText('annulée');
  expect(await pixel(page, 420, 330)).toEqual(before);
  await expect(page.locator('#background')).toBeEnabled();
});
test('AI models run locally without uploading image bytes', async ({ page, context }) => {
  test.skip(!process.env.AI_SMOKE, 'Explicit network/model smoke test.');
  test.setTimeout(900000);
  const uploads = [];
  page.on('request', (req) => {
    if (/huggingface|jsdelivr/.test(req.url()) && !['GET', 'HEAD'].includes(req.method()))
      uploads.push(req.url());
  });
  // Optional local mirror of the exact pinned model bytes for slow networks.
  if (process.env.AI_MODEL_MIRROR)
    await context.route(/https:\/\/huggingface\.co\/.*\.onnx(\?.*)?$/, (route) => {
      const path = new URL(route.request().url()).pathname;
      const name = path.includes('studioludens/birefnet-lite-512')
        ? 'birefnet512.onnx'
        : path.split('/').pop();
      return route.fulfill({
        status: 302,
        headers: {
          location: `${process.env.AI_MODEL_MIRROR}/${name}`,
          'Access-Control-Allow-Origin': '*',
        },
        body: '',
      });
    });
  await demo(page);
  await page.exposeFunction('reportModelStatus', (text) => console.log(text));
  await page.evaluate(() =>
    new MutationObserver(() =>
      window.reportModelStatus(document.querySelector('#status').textContent),
    ).observe(document.querySelector('#status'), { childList: true }),
  );
  const completed = async (text) => {
    await page.waitForFunction(
      (text) =>
        document.querySelector('#status').classList.contains('error') ||
        document.querySelector('#status').textContent.includes(text),
      text,
      { timeout: 300000 },
    );
    await expect(page.locator('#status')).toContainText(text);
  };
  await page.locator('[data-tool=object]').click();
  await brush(page, 420, 330);
  await completed('Objet sélectionné');
  await page.locator('#erase-selection').click();
  expect((await pixel(page, 420, 330))[3]).toBe(0);
  if (process.env.AI_ONLY === 'segment') return;
  await page.locator('#reset').click();
  await page.locator('#background').click();
  await completed('Fond retiré');
  expect((await pixel(page, 10, 10))[3]).toBeLessThan(30);
  await page.locator('#reset').click();
  await page.locator('[data-tool=select]').click();
  await page.locator('#brush').focus();
  await page.keyboard.press('End');
  await brush(page, 752, 360);
  const beforeRepair = await pixel(page, 752, 360),
    exterior = await pixel(page, 100, 100);
  await page.locator('#repair-method').selectOption('lama');
  await page.locator('#repair').click();
  await completed('LaMa : élément retiré');
  expect(uploads).toEqual([]);
  expect(await pixel(page, 752, 360)).not.toEqual(beforeRepair);
  expect(await pixel(page, 100, 100)).toEqual(exterior);
});
