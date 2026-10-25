import {useEffect,useRef,useState} from 'react';
import useModalFocus from '../useModalFocus.js';
import {loadShelfIndex} from '../storage.js';
import {suggestShelfName} from '../shelf.js';

const dateLabel=value=>new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',year:'numeric'}).format(new Date(value));

export default function ShelfDialog({draft,onClose,onOpen,onNew,onSave,onDuplicate,onDelete}){
  const modal=useRef(null);
  const [items,setItems]=useState(null),[name,setName]=useState(()=>suggestShelfName(draft)),[busy,setBusy]=useState(false),[loadError,setLoadError]=useState(''),[actionError,setActionError]=useState('');
  function requestClose(){if(!busy)onClose();}
  useModalFocus(modal,true,requestClose);
  useEffect(()=>{modal.current?.showModal();return()=>modal.current?.close();},[]);
  useEffect(()=>{let alive=true;loadShelfIndex().then(result=>{if(alive)setItems(result.items);}).catch(()=>{if(alive)setLoadError('Could not load your saved bouquets.');});return()=>{alive=false;};},[]);

  async function refresh(){
    const result=await loadShelfIndex();
    setItems(result.items);
    setLoadError('');
  }
  async function stay(task,message){
    if(busy)return;
    setBusy(true);setActionError('');
    try{await task();await refresh();}
    catch(error){setActionError(error.message||message);}
    finally{setBusy(false);}
  }
  async function leave(task,message){
    if(busy)return;
    setBusy(true);setActionError('');
    try{await task();}
    catch(error){setActionError(error.message||message);}
    finally{setBusy(false);}
  }
  function save(){
    const next=name.trim();
    if(!next){setActionError('Give this bouquet a name.');return;}
    stay(()=>onSave(next),'Could not save this bouquet.');
  }
  function remove(item){
    if(!window.confirm(`Delete "${item.name}"? This cannot be undone.`))return;
    stay(()=>onDelete(item),'Could not delete that bouquet.');
  }
  const ordered=items?[...items].sort((a,b)=>b.updatedAt-a.updatedAt):null;
  return <dialog ref={modal} className="modal shelf-dialog" onCancel={event=>{event.preventDefault();requestClose();}} aria-label="My bouquets">
    <button className="close" aria-label="Close my bouquets" disabled={busy} onClick={requestClose}>×</button>
    <h2>My bouquets</h2>
    <p className="shelf-intro">Saved only on this device. Opening a bouquet replaces the one you are working on.</p>
    {actionError&&<p className="shelf-error" role="alert">{actionError}</p>}
    <div className="shelf-save">
      <label className="field-label" htmlFor="shelf-name">Bouquet name</label>
      <div className="shelf-save-row">
        <input id="shelf-name" value={name} maxLength={80} onChange={event=>setName(event.target.value)} placeholder="My bouquet"/>
        <button className="primary" disabled={busy} onClick={save}>{draft.shelfId?'Update saved bouquet':'Save to my bouquets'}</button>
      </div>
    </div>
    {loadError?<p className="shelf-empty">{loadError}</p>:!ordered?<p className="shelf-empty">Opening your shelf…</p>:ordered.length===0?<p className="shelf-empty">No saved bouquets yet. Save this one to start your shelf.</p>:<div className="shelf-list">{ordered.map(item=><article className="shelf-item" key={item.id}>
      <div className="shelf-thumb">{item.thumbnail?<img src={item.thumbnail} alt=""/>:<span>{item.stemCount}</span>}</div>
      <div className="shelf-item-copy"><h3>{item.name}</h3><p>{item.stemCount===1?'1 stem':`${item.stemCount} stems`} · {item.size} stem bouquet · {dateLabel(item.updatedAt)}</p></div>
      <div className="shelf-actions">
        <button className="pill" disabled={busy} onClick={()=>leave(()=>onOpen(item),'Could not open that bouquet.')}>Open</button>
        <button className="pill" disabled={busy} onClick={()=>stay(()=>onDuplicate(item),'Could not duplicate that bouquet.')}>Duplicate</button>
        <button className="pill shelf-delete" disabled={busy} onClick={()=>remove(item)}>Delete</button>
      </div>
    </article>)}</div>}
    <div className="shelf-footer">
      <span>{draft.shelfId?'Changes save to the shelf only when you choose Update.':'This bouquet is not on the shelf yet.'}</span>
      <button className="pill" disabled={busy} onClick={()=>leave(onNew,'Could not start a new bouquet.')}>Start a new bouquet</button>
    </div>
  </dialog>;
}
