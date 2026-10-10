import { copyFile, mkdir } from 'node:fs/promises';
import { siteFiles } from './site-files.mjs';
await mkdir('dist', { recursive: true });
for (const [source, target] of Object.entries(siteFiles)) await copyFile(source, 'dist/' + target);
console.log('Distribution generated from src/.');
