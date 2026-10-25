import {useEffect,useRef,useState} from 'react';
import {CardArtwork} from '../message/CardDesigner.jsx';
import {cardHasContent} from './share-card.js';

export default function BouquetCard({message,tagRef,fallback=false}){
 const [open,setOpen]=useState(false),dialog=useRef(null);
 useEffect(()=>{
  if(!open||!dialog.current)return;
  const element=dialog.current,previous=document.activeElement;
  element.showModal();
  return()=>{element.close();previous?.focus?.();};
 },[open]);
 if(!cardHasContent(message))return null;
 return <>
  <button ref={tagRef} className={'bouquet-open-card'+(fallback?' card-fallback':'')} style={fallback?{visibility:'visible',transform:'none'}:undefined} aria-label="Open your card" aria-haspopup="dialog" onClick={()=>setOpen(true)}>
   <span className="mini-envelope" aria-hidden="true"><i className="mini-envelope-fold"/><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 20S3.5 14.8 3.5 8.6C3.5 3.8 9 2.6 12 6.3c3-3.7 8.5-2.5 8.5 2.3C20.5 14.8 12 20 12 20Z"/></svg></span>
   <span className="envelope-tag-label">open your card</span>
  </button>
  {open&&<dialog ref={dialog} className="modal bouquet-card-dialog envelope-card-dialog" aria-label="Your message card" onCancel={()=>setOpen(false)}>
   <button className="close" aria-label="Close card" onClick={()=>setOpen(false)}>×</button>
   <div className="envelope-reveal">
    <div className="envelope-shell" aria-hidden="true"><div className="envelope-lining"/><div className="envelope-front"/><div className="envelope-flap"/></div>
    <div className="envelope-letter"><h2>A little note for you</h2>{message.card?<CardArtwork card={message.card} message={message.text} photos={message.card.photos||[]}/>:<div className="finished-note">{message.text}</div>}</div>
   </div>
  </dialog>}
 </>;
}
