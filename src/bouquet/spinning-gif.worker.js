import {createSpinningGif,gifSettings} from './spinning-gif.js';
const encoder=createSpinningGif();let frames=0;
self.onmessage=({data})=>{
 try{
  encoder.addFrame(new Uint8ClampedArray(data));frames++;
  if(frames===gifSettings.frames){
   const bytes=encoder.finish();self.postMessage({bytes},[bytes.buffer]);
  }else self.postMessage({frames});
 }catch{self.postMessage({error:'Could not encode the GIF. Try again with fewer flowers.'});}
};
