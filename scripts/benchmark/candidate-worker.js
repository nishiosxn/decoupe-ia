let session, key;
self.onmessage=async({data})=>{try {
 const ort=await import('https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/ort.all.min.mjs');
 ort.env.wasm.wasmPaths='https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/';ort.env.wasm.numThreads=1;
 const model=data.model, size=model==='anime'?1024:model==='biref1024'?1024:512;
 if(key!==model){await session?.release();session=await ort.InferenceSession.create(await(await fetch('http://127.0.0.1:4180/'+model+'.onnx')).arrayBuffer(),{executionProviders:[data.device||'wasm']});key=model;self.postMessage({type:'metadata',inputs:session.inputMetadata,outputs:session.outputMetadata});}
 const w=Number(data.image.type.match(/width=(\d+)/)[1]),h=Number(data.image.type.match(/height=(\d+)/)[1]);
 const rgba=new Uint8ClampedArray(await data.image.arrayBuffer());const c=new OffscreenCanvas(w,h);c.getContext('2d').putImageData(new ImageData(rgba,w,h),0,0);
 const small=new OffscreenCanvas(size,size),ctx=small.getContext('2d');let rw=size,rh=size,x=0,y=0;
 if(model==='anime'){const scale=size/Math.max(w,h);rw=Math.floor(w*scale);rh=Math.floor(h*scale);x=Math.floor((size-rw)/2);y=Math.floor((size-rh)/2);}
 ctx.drawImage(c,0,0,w,h,x,y,rw,rh);const rgb=ctx.getImageData(0,0,size,size).data;const a=new Float32Array(3*size*size);
 for(let i=0;i<size*size;i++)for(let k=0;k<3;k++)a[k*size*size+i]=model==='anime'?rgb[i*4+k]/255:(rgb[i*4+k]/255-[.485,.456,.406][k])/[.229,.224,.225][k];
 const t=new ort.Tensor('float32',a,[1,3,size,size]);const start=performance.now();const out=await session.run({[session.inputNames[0]]:t});const values=out[session.outputNames[0]].data;
 const gray=new Uint8ClampedArray(size*size*4);for(let i=0;i<values.length;i++){const p=model==='anime'?values[i]:1/(1+Math.exp(-values[i]));gray[i*4]=gray[i*4+1]=gray[i*4+2]=Math.round(255*p);gray[i*4+3]=255;}
 ctx.putImageData(new ImageData(gray,size,size),0,0);const original=new OffscreenCanvas(w,h);original.getContext('2d').drawImage(small,x,y,rw,rh,0,0,w,h);const d=original.getContext('2d').getImageData(0,0,w,h).data;const alpha=Uint8Array.from({length:w*h},(_,i)=>d[i*4]);
 self.postMessage({type:'result',alpha:alpha.buffer,ms:performance.now()-start},[alpha.buffer]);t.dispose();for(const v of Object.values(out))v.dispose();
}catch(e){self.postMessage({type:'error',message:String(e),stack:e.stack});}};
