export function parseYouTubeUrl(value){
  try{const u=new URL(value.trim());if(!['https:','http:'].includes(u.protocol))return null;const host=u.hostname.toLowerCase();let id;
    if(host==='youtu.be')id=u.pathname.slice(1).split('/')[0];
    else if(['youtube.com','www.youtube.com','m.youtube.com','music.youtube.com'].includes(host))id=u.pathname==='/watch'?u.searchParams.get('v'):u.pathname.match(/^\/(?:shorts|embed)\/([^/]+)/)?.[1];
    return /^[\w-]{11}$/.test(id||'')?id:null;
  }catch{return null;}
}
export const limitMessage=value=>Array.from(value).slice(0,70).join('');
export function youTubeStart(value){try{const params=new URL(value).searchParams;const raw=params.get('t')||params.get('start')||'';if(/^\d+$/.test(raw))return Math.min(86400,+raw);const match=raw.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);return match?Math.min(86400,(+match[1]||0)*3600+(+match[2]||0)*60+(+match[3]||0)):0;}catch{return 0;}}
export function startVoiceRecording(stream,{onComplete,onError,onTick}){
 const mime=['audio/webm;codecs=opus','audio/mp4','audio/webm'].find(t=>MediaRecorder.isTypeSupported(t));
 let recorder;try{recorder=new MediaRecorder(stream,mime?{mimeType:mime}:undefined);}catch(error){stream.getTracks().forEach(t=>t.stop());throw error;}
 const chunks=[];let failed=false,cancelled=false,seconds=0,interval,deadline,cleaned=false;
 const cleanup=()=>{clearInterval(interval);clearTimeout(deadline);if(!cleaned){stream.getTracks().forEach(t=>t.stop());cleaned=true;}};
 recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
 recorder.onstop=()=>{cleanup();if(!failed&&!cancelled&&chunks.length)onComplete(new Blob(chunks,{type:recorder.mimeType}));};
 recorder.onerror=()=>{failed=true;cleanup();onError();if(recorder.state==='recording')recorder.stop();};
 try{recorder.start();interval=setInterval(()=>onTick(++seconds),1000);deadline=setTimeout(()=>{if(recorder.state==='recording')recorder.stop();},60000);}catch(error){cleanup();throw error;}
 return {stop:()=>{if(recorder.state==='recording')recorder.stop();},cancel:()=>{cancelled=true;if(recorder.state==='recording')recorder.stop();cleanup();}};
}
export function validateImage(file){if(!['image/jpeg','image/png','image/webp','image/gif'].includes(file.type))return 'Choose a JPG, PNG, WebP or GIF image.';if(file.size>10*1024*1024)return 'Each image must be 10 MB or smaller.';return null;}
export const validatePhotos=(count,added)=>count+added>4?'You can add up to four photos.':null;
export async function readImages(files){
  const images=[];
  for(const file of files){const error=validateImage(file);if(error)throw Error(error);const bitmap=await createImageBitmap(file).catch(()=>{throw Error('This image could not be opened. Try another file.');});bitmap.close();images.push(file);}
  return images;
}
