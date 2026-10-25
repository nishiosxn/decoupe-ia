// Deterministic composites have exact source-alpha ground truth, photographs do not.
import {chromium} from 'playwright';
import {mkdir,readFile,writeFile,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root='tests/fixtures/quality';await mkdir(root,{recursive:true});
const svg=await readFile(root+'/wikipe-tan.svg','utf8');
const browser=await chromium.launch({channel:process.env.CI?undefined:'chrome'});
const page=await browser.newPage();
const cases=[['anime-complex',700,900,'complex'],['anime-hat',700,900,'hat'],['fine-lines',700,900,'lines'],['internal-openings',800,800,'ring'],['similar-colors',800,800,'similar'],['high-resolution',2400,3200,'large']];
const manifest=[];
for(const [id,w,h,kind] of cases){
 const result=await page.evaluate(async({svg,w,h,kind})=>{
  const fg=document.createElement('canvas');fg.width=w;fg.height=h;const f=fg.getContext('2d');
  if(['ring','similar'].includes(kind)){
   f.fillStyle=kind==='similar'?'#a8b2aa':'#ca4b37';f.strokeStyle='#293233';f.lineWidth=w*.008;
   f.beginPath();f.ellipse(w/2,h/2,w*.30,h*.35,0,0,7);f.ellipse(w/2,h/2,w*.13,h*.17,0,0,7,true);f.fill('evenodd');f.stroke();
  }else{
   const img=new Image();img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);await img.decode();
   f.drawImage(img,w*.24,h*.12,w*.52,h*.84);
   if(kind==='hat'){f.fillStyle='#733928';f.strokeStyle='#261925';f.lineWidth=3;f.beginPath();f.ellipse(w*.50,h*.20,w*.24,h*.04,0,0,7);f.fill();f.stroke();f.fillRect(w*.38,h*.09,w*.24,h*.11);f.strokeRect(w*.38,h*.09,w*.24,h*.11);}
   if(kind==='lines'){f.strokeStyle='#29202c';f.lineWidth=2;for(let j=0;j<12;j++){f.beginPath();f.moveTo(w*.5,h*.25);f.bezierCurveTo(w*.8,h*.4,w*.1,h*.5,w*(.14+j*.055),h*.80);f.stroke();}}
  }
  const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');
  const g=x.createLinearGradient(0,0,w,h);g.addColorStop(0,kind==='similar'?'#a1b0a5':'#92c7e1');g.addColorStop(1,kind==='similar'?'#b5bcb4':'#edaf74');x.fillStyle=g;x.fillRect(0,0,w,h);
  if(!['ring','similar'].includes(kind)){for(let j=0;j<70;j++){x.fillStyle=['#5c8392','#cbe2dc','#bf8759','#456455'][j%4];x.fillRect((j*197%w),j*353%h,w*.06,h*.12);}}
  x.drawImage(fg,0,0);const a=f.getImageData(0,0,w,h).data;
  const mask=document.createElement('canvas');mask.width=w;mask.height=h;const mx=mask.getContext('2d'),d=mx.createImageData(w,h);for(let i=0;i<w*h;i++){d.data[i*4]=d.data[i*4+1]=d.data[i*4+2]=a[i*4+3]>=128?255:0;d.data[i*4+3]=255;}mx.putImageData(d,0,0);
  return {image:c.toDataURL('image/png').split(',')[1],mask:mask.toDataURL('image/png').split(',')[1]};
 },{svg,w,h,kind});
 await writeFile(`${root}/${id}.png`,Buffer.from(result.image,'base64'));await writeFile(`${root}/${id}-mask.png`,Buffer.from(result.mask,'base64'));
 manifest.push({id,file:id+'.png',mask:id+'-mask.png',category:kind,width:w,height:h,license:['ring','similar'].includes(kind)?'CC0-1.0':'CC-BY-SA-3.0',groundTruth:'source alpha of deterministic composite; not a natural-scene annotation'});
}
for(const [id,file,category] of [['portrait','person.jpg','portrait'],['fur','corgi.jpg','fur'],['object-plain','watch.jpg','object-plain'],['object-complex','car-1.jpg','object-complex'],['red-shoe','shoe.jpg','similar-colors-photo']]){
 // Photographs are committed with provenance, not fetched again during a benchmark.
 manifest.push({id,file,category,mask:null,license:'Unsplash License',groundTruth:null});
}
for(const entry of manifest)entry.sha256=createHash('sha256').update(await readFile(root+'/'+entry.file)).digest('hex');
await writeFile(root+'/manifest.json',JSON.stringify(manifest,null,2)+'\n');await browser.close();console.log(`${manifest.length} fixtures generated.`);

