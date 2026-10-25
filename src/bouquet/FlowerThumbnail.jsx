import {useEffect,useState} from 'react';
import {flowerThumbnail} from './flower-thumbnails.js';
export default function FlowerThumbnail({type,retryable=true}){
 const [image,setImage]=useState(''),[failed,setFailed]=useState(false),[retry,setRetry]=useState(0);
 useEffect(()=>{let active=true;setImage('');setFailed(false);flowerThumbnail(type).then(url=>{if(active)setImage(url);}).catch(()=>{if(active)setFailed(true);});return()=>{active=false;};},[type.key,retry]);
 return <div className="flower-thumbnail">{image?<img src={image} alt={type.name+' '+type.group}/>:failed?(retryable?<button className="thumbnail-retry" onClick={()=>setRetry(n=>n+1)}>Retry image</button>:<span className="thumbnail-unavailable">Preview unavailable</span>):<span className="thumbnail-loading" aria-label="Loading flower image"/>}</div>;
}
