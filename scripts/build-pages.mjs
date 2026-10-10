import { cpSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
// Isolated CI staging directory, never the production dist/.
if(existsSync('.pages')) throw Error('Use a fresh .pages staging directory');
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
console.log('Pages: develop at root, historical previews at previews/v3.2.0/ and previews/v4.0.0/');
