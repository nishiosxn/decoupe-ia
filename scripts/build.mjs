import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..');
await mkdir(resolve(root, 'dist'), { recursive: true });
await cp(resolve(root, 'src'), resolve(root, 'dist'), { recursive: true });
await cp(resolve(root, 'outputs/favicon.svg'), resolve(root, 'dist/favicon.svg'));
await writeFile(resolve(root, 'dist/.nojekyll'), '');
// Keep the historical local entry usable without preserving an obsolete editor.
await writeFile(
  resolve(root, 'outputs/decoupe.html'),
  '<!doctype html><html lang="fr"><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=../dist/"><title>Découpe Studio</title><a href="../dist/">Ouvrir Découpe Studio</a></html>\n',
);
const html = await readFile(resolve(root, 'dist/index.html'), 'utf8');
if (!html.includes('src="app.js"') || !html.includes('href="styles.css"'))
  throw new Error('Entrées de build invalides.');
console.log('Découpe Studio v4 : distribution statique construite.');
