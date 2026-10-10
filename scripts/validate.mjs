import { readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { siteFiles } from './site-files.mjs';
const read = p => readFileSync(p, 'utf8');
for (const [source, target] of Object.entries(siteFiles)) assert.equal(read(source), read('dist/' + target), target + ': rebuild dist/');
assert.deepEqual(readdirSync('dist').sort(), Object.values(siteFiles).sort(), 'Unexpected distribution files');
for (const directory of ['src', 'scripts', 'tests']) {
  for (const file of readdirSync(directory, {recursive:true})) {
    if (/\.(?:mjs|js)$/.test(file)) execFileSync(process.execPath, ['--check', directory + '/' + file], {stdio:'pipe'});
  }
}
const html = read('src/index.html');
for(const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
  if(!/^(?:https?:|data:)/.test(match[1])) assert.ok(Object.values(siteFiles).includes(match[1]), 'Missing local resource: '+match[1]);
}
const version=JSON.parse(read('package.json')).version;
assert.ok(html.includes('<span class="version">v'+version+'</span>'), 'Visible version mismatch');
const stable=read('WORK_STATE.md').match(/Stable : \*\*v([\d.]+)\*\*/)?.[1];
assert.ok(stable, 'Stable declaration missing');
assert.ok(read('README.md').includes('Version stable actuelle : **v'+stable+'**'), 'Stable documentation mismatch');
const readme = read('README.md');
assert.ok(readme.includes('Candidate : **v'+version+'**') || version === stable, 'Candidate documentation mismatch');
if(process.argv.includes('--release')) {
  assert.equal(version,stable,'Release requires explicit stable documentation promotion');
  assert.ok(!readme.includes('Candidate : **v'+version+'**') && !readme.includes('Cette candidate n’est pas une release production validée'), 'Release README still presents an unapproved candidate');
  const changelog = read('docs/CHANGELOG.md');
  assert.ok(changelog.includes('## Stable V'+version) && !changelog.includes('## Candidate V'+version), 'Release changelog not promoted');
}
console.log('Syntax, resources, versions and generated distribution: PASS');
