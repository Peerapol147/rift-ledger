import {FRAME_URLS} from './character-sheets.gen.js';
import {frameIndex} from './character-identity.js';
export {FRAME_URLS};
const cache=new Map();
// Decode each identity only when it is used; all four frames share one texture.
export function loadCharacter(key) {
 if(cache.has(key)||!FRAME_URLS[key])return;
 const entry={frames:null,error:false};cache.set(key,entry);
 const image=new Image();
 image.onload=()=>{
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=64;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);
  entry.frames=Array.from({length:4},(_,i)=>{
   const rgba=ctx.getImageData(i*64,0,64,64).data, pixels=new Uint32Array(4096);
   for(let p=0;p<4096;p++)if(rgba[p*4+3]>=128)
    pixels[p]=(255<<24|rgba[p*4+2]<<16|rgba[p*4+1]<<8|rgba[p*4])>>>0;
   return {width:64,height:64,pixels};
  });
 };
 image.onerror=()=>{entry.error=true;console.error('Character sheet failed',key);};
 image.src=FRAME_URLS[key];
}
export function characterFrame(key,time,period,calm=false,busy=false) {
 loadCharacter(key);
 return cache.get(key)?.frames?.[frameIndex(time,period,calm,busy)]||null;
}
