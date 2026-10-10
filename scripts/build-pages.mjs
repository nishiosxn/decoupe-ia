import { cpSync, mkdirSync, writeFileSync, existsSync, lstatSync, rmSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
// Isolated CI staging directory, never the production dist/.
const root = resolve(import.meta.dirname, '..');
const staging = resolve(root, '.pages');
if(dirname(staging) !== root || (existsSync(staging) && lstatSync(staging).isSymbolicLink())) throw Error('Unsafe staging path');
rmSync(staging, {recursive:true, force:true});
cpSync('dist','.pages',{recursive:true});
writeFileSync('.pages/.nojekyll','');
for(const version of ['v3.2.0','v4.0.0']) {
  const ref='archive/preview/github-pages-'+version;
  const files=execFileSync('git',['ls-tree','-r','--name-only',ref,'dist/'],{encoding:'utf8'}).trim().split('\n');
  if(!files.includes('dist/index.html')) throw Error('Missing historical preview '+ref);
  for(const file of files) {
    const target='.pages/previews/'+version+'/'+file.slice(5);
    mkdirSync(target.slice(0,target.lastIndexOf('/')),{recursive:true});
    writeFileSync(target,execFileSync('git',['show',ref+':'+file],{maxBuffer:20*1024*1024}));
  }
}
console.log('Pages: current work/main version at root, historical previews at previews/v3.2.0/ and previews/v4.0.0/');
