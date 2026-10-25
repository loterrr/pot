import test from 'node:test';
import assert from 'node:assert/strict';
import {createSpinningGif,gifSettings,rotationAngle} from './spinning-gif.js';

test('the spinning loop has sixty unique frames spanning three seconds',()=>{
 assert.equal(gifSettings.frames*gifSettings.delay,3000);
 assert.equal(gifSettings.size,480);
 assert.equal(rotationAngle(0),0);
 assert.ok(rotationAngle(59)<Math.PI*2);
 assert.equal(rotationAngle(30),Math.PI);
});
test('the encoder produces an animated looping GIF from RGBA frames',()=>{
 const encoder=createSpinningGif(2,2);
 encoder.addFrame(new Uint8ClampedArray([255,0,0,255,255,0,0,255,255,0,0,255,255,0,0,255]));
 encoder.addFrame(new Uint8ClampedArray([0,0,255,255,0,0,255,255,0,0,255,255,0,0,255,255]));
 const bytes=encoder.finish();
 assert.equal(new TextDecoder().decode(bytes.slice(0,6)),'GIF89a');
 assert.equal(bytes[6]|bytes[7]<<8,2);assert.equal(bytes[8]|bytes[9]<<8,2);
 assert.ok(new TextDecoder().decode(bytes).includes('NETSCAPE2.0'));
 assert.equal(bytes.at(-1),0x3b);
});
test('invalid frames and empty exports fail explicitly',()=>{
 const encoder=createSpinningGif(2,2);
 assert.throws(()=>encoder.addFrame(new Uint8ClampedArray(3)),/frame/i);
 assert.throws(()=>encoder.finish(),/frame/i);
});


test('rotation capture restores the camera and renderer, including after failure',async()=>{
 const {PerspectiveCamera,Group,Mesh,BoxGeometry,MeshBasicMaterial,Vector3}=await import('three');
 const {captureRotationFrame}=await import('./spin-capture.js');
 const camera=new PerspectiveCamera(42,1.5,.1,150);camera.position.set(2,7,14);camera.lookAt(0,2,0);
 const position=camera.position.clone(),quaternion=camera.quaternion.clone();
 const root=new Group();root.add(new Mesh(new BoxGeometry(4,8,3),new MeshBasicMaterial()));
 let ratio=2,size={x:700,y:500},renderedPosition,fail=false;
 const pixels=new Uint8ClampedArray(480*480*4);
 const context={fillRect(){},drawImage(){if(fail)throw new Error('Capture failed');},getImageData(){return {data:pixels};}};
 const state={camera,root,scene:{},controls:{target:new Vector3(0,2,0)},gifCanvas:{width:480,height:480,getContext:()=>context},renderer:{
  domElement:{},getSize:out=>out.set(size.x,size.y),getPixelRatio:()=>ratio,setPixelRatio:value=>{ratio=value;},setSize:(x,y)=>{size={x,y};},render:()=>{renderedPosition??=camera.position.clone();}
 }};
 assert.equal(captureRotationFrame(state,Math.PI,'#ffffff'),pixels);
 assert.ok(renderedPosition.z<0);assert.equal(context.fillStyle,'#ffffff');
 assert.deepEqual(camera.position,position);assert.ok(camera.quaternion.equals(quaternion));assert.equal(camera.aspect,1.5);
 assert.deepEqual(size,{x:700,y:500});assert.equal(ratio,2);
 state.gifView={position:position.clone(),target:state.controls.target.clone()};
 camera.position.set(-10,10,-5);renderedPosition=null;
 captureRotationFrame(state,Math.PI,'#ffffff');const frozenDirection=renderedPosition.clone();
 camera.position.set(20,1,2);renderedPosition=null;
 captureRotationFrame(state,Math.PI,'#ffffff');assert.deepEqual(renderedPosition,frozenDirection);
 camera.position.copy(position);camera.quaternion.copy(quaternion);
 fail=true;assert.throws(()=>captureRotationFrame(state,0,'#ffffff'),/Capture failed/);
 assert.deepEqual(camera.position,position);assert.ok(camera.quaternion.equals(quaternion));assert.equal(camera.aspect,1.5);
 assert.deepEqual(size,{x:700,y:500});assert.equal(ratio,2);
 root.children[0].geometry.dispose();root.children[0].material.dispose();
});


test('the worker accepts one transferred frame at a time and finishes the complete loop',{timeout:20000},async()=>{
 const {Worker}=await import('node:worker_threads');
 const url=new URL('./spinning-gif.worker.js',import.meta.url).href;
 const source=`import {parentPort} from 'node:worker_threads';globalThis.self={postMessage:(...args)=>parentPort.postMessage(...args)};await import(${JSON.stringify(url)});parentPort.on('message',data=>self.onmessage({data}));`;
 const job=new Worker(new URL('data:text/javascript,'+encodeURIComponent(source)),{type:'module'});let count=0;
 try{
  await new Promise((resolve,reject)=>{
   const next=()=>{const pixels=new Uint8ClampedArray(gifSettings.size**2*4);pixels.fill(255);job.postMessage(pixels.buffer,[pixels.buffer]);assert.equal(pixels.byteLength,0);};
   job.on('error',reject);
   job.on('message',data=>{
    try{
     if(data.error)throw new Error(data.error);
     count++;
     if(data.bytes){assert.equal(count,gifSettings.frames);assert.equal(data.bytes.at(-1),0x3b);resolve();}
     else{assert.equal(data.frames,count);next();}
    }catch(error){reject(error);}
   });
   next();
  });
 }finally{await job.terminate();}
});
