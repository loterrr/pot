import {useEffect,useRef,useState} from 'react';
import {gifSettings,rotationAngle} from './gif-settings.js';
import {saveImageFile,shareImageFiles} from './share-image.js';

export default function GifExport({sceneRef,background,draft}){
 const worker=useRef(null),[progress,setProgress]=useState(null),[file,setFile]=useState(null),[status,setStatus]=useState('');
 function stop(){worker.current?.terminate();worker.current=null;sceneRef.current?.finishRotation();setProgress(null);}
 useEffect(()=>{setFile(null);setStatus('');setProgress(null);return()=>{worker.current?.terminate();worker.current=null;sceneRef.current?.finishRotation();};},[draft]);
 function prepare(){
  stop();setFile(null);setStatus('');setProgress(0);
  try{
   const job=new Worker(new URL('./spinning-gif.worker.js',import.meta.url),{type:'module'});worker.current=job;
   const fail=message=>{stop();setStatus(message);};
   const next=index=>{
    try{
     const pixels=sceneRef.current?.rotationFrame(rotationAngle(index),background);
     if(!pixels)throw new Error('Your bouquet is still loading. Try again in a moment.');
     job.postMessage(pixels.buffer,[pixels.buffer]);
    }catch(error){fail(error.message||'Could not capture the GIF.');}
   };
   job.onmessage=({data})=>{
    if(worker.current!==job)return;
    if(data.error){fail(data.error);return;}
    if(data.bytes){
     setFile(new File([data.bytes],`flower4you-spinning-${new Date().toISOString().slice(0,10)}.gif`,{type:'image/gif'}));
     stop();setStatus('GIF ready. Download it, or use Share to choose where to save it.');
    }else{setProgress(Math.round(data.frames/gifSettings.frames*100));next(data.frames);}
   };
   job.onerror=()=>fail('GIF export is unavailable in this browser. Try downloading a PNG image instead.');
   next(0);
  }catch{stop();setStatus('Could not start GIF export. Try downloading a PNG image instead.');}
 }
 async function share(){
  try{
   const result=await shareImageFiles([file]);
   setStatus(result==='shared'?'Share sheet completed.':result==='cancelled'?'Sharing cancelled. Your GIF is still ready.':'GIF sharing is unavailable here. Use Download GIF.');
  }catch{setStatus('Could not share the GIF. Try Download GIF instead.');}
 }
 return <section className="gif-export" aria-label="Spinning bouquet GIF">
  <h3>Keep it spinning</h3><p className="local-note">A three-second, 480px loop of your bouquet on its solid backdrop. No message card, photos or audio.</p>
  <div className="share-actions">{progress!==null?<><button className="pill" disabled>Creating GIF… {progress}%</button><button className="pill" onClick={()=>{stop();setStatus('GIF export cancelled.');}}>Cancel GIF</button></>:<button className="pill" onClick={prepare}>{file?'Create GIF again':'Save spinning GIF'}</button>}
  {file&&<><button className="pill rose-fill" onClick={()=>{try{saveImageFile(file);setStatus('GIF download requested. Check Files or Downloads.');}catch{setStatus('Could not start the download. Try Share GIF.');}}}>Download GIF</button><button className="pill" onClick={share}>Share GIF</button></>}</div>
  {status&&<p className="share-status" role="status">{status}</p>}
 </section>;
}
