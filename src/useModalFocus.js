import {useEffect,useRef} from 'react';
export default function useModalFocus(ref,open,onClose){
 const close=useRef(onClose);close.current=onClose;
 useEffect(()=>{if(!open||!ref.current)return;const modal=ref.current,previous=document.activeElement;const selector='button:not(:disabled),input:not(:disabled):not([hidden]),textarea,select,[tabindex="0"]';const focusable=()=>Array.from(modal.querySelectorAll(selector)).filter(el=>el.getClientRects().length);focusable()[0]?.focus();
 function keyboard(event){if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close.current();}if(event.key==='Tab'){const list=focusable(),first=list[0],last=list.at(-1);if(event.shiftKey&&(document.activeElement===first||!modal.contains(document.activeElement))){event.preventDefault();last?.focus();}else if(!event.shiftKey&&(document.activeElement===last||!modal.contains(document.activeElement))){event.preventDefault();first?.focus();}}}
 modal.addEventListener('keydown',keyboard);return()=>{modal.removeEventListener('keydown',keyboard);previous?.focus?.();};
 },[ref,open]);
}
