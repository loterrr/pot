import * as gifenc from 'gifenc';
import {gifSettings} from './gif-settings.js';
export {gifSettings,rotationAngle} from './gif-settings.js';
const {GIFEncoder,quantize,applyPalette}=gifenc.GIFEncoder?gifenc:gifenc.default;

export function createSpinningGif(width=gifSettings.size,height=gifSettings.size){
 const encoder=GIFEncoder();let frames=0;
 return {
  addFrame(rgba){
   if(rgba.length!==width*height*4)throw new Error('Invalid GIF frame.');
   const palette=quantize(rgba,256),pixels=applyPalette(rgba,palette);
   encoder.writeFrame(pixels,width,height,{palette,delay:gifSettings.delay,repeat:0});frames++;
  },
  finish(){
   if(!frames)throw new Error('The GIF has no frames.');
   encoder.finish();return encoder.bytes();
  }
 };
}
