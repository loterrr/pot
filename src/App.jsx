import {useEffect,useRef,useState} from 'react';
import Icon from './Icon.jsx';
import {createDraft,hydrateDraft,updateDraft,stemCount,arrange} from './bouquet/draft.js';
import {createDraftFromOccasion} from './bouquet/occasions.js';
import {loadDraft,saveDraft,canSaveDraft,saveShelfBouquet,loadShelfDraft,deleteShelfBouquet} from './storage.js';
import ShelfDialog from './bouquet/ShelfDialog.jsx';
import {flowerThumbnail} from './bouquet/flower-thumbnails.js';
import {byKey} from './bouquet/catalog.js';
import {hasBouquetContent,shelfItemFromDraft} from './shelf.js';
import BouquetScene from './bouquet/BouquetScene.jsx';
import FlowerControls from './bouquet/FlowerControls.jsx';
import {composeBouquetImage,saveImageFile,shareImageFiles,imageFormats} from './bouquet/share-image.js';
import {cardHasContent,captureDesignedCard,composeMessageCard} from './bouquet/share-card.js';
import WrapPanel from './bouquet/WrapPanel.jsx';
import FlowersPanel from './bouquet/FlowersPanel.jsx';
import MessagePanel,{useBlobUrl,BlobImage,BlobAudio} from './message/MessagePanel.jsx';
import CardDesigner,{CardArtwork} from './message/CardDesigner.jsx';
import {parseYouTubeUrl,youTubeStart} from './message/media.js';
function Dialog({title,children,onClose}){const ref=useRef(null);useEffect(()=>{const previous=document.activeElement;ref.current.showModal();return()=>{ref.current?.close();previous?.focus?.();};},[]);return <dialog ref={ref} className="modal native-dialog" onCancel={onClose}><button className="close" aria-label="Close dialog" onClick={onClose}>×</button><h2>{title}</h2>{children}</dialog>;}
export default function App(){
 const [draft,setDraft]=useState(createDraft),[hydration,setHydration]=useState("loading"),[saveStatus,setSaveStatus]=useState('Loading draft…'),[error,setError]=useState(''),[info,setInfo]=useState(null),[designer,setDesigner]=useState(null),[preview,setPreview]=useState(false),[playSong,setPlaySong]=useState(false),[previewStatus,setPreviewStatus]=useState(''),[preparingImage,setPreparingImage]=useState(false),[includeCard,setIncludeCard]=useState(false),[selectedId,setSelectedId]=useState(null),[shelfOpen,setShelfOpen]=useState(false),[exportFormat,setExportFormat]=useState('portrait');const previewScene=useRef(null),cardExport=useRef(null),body=useRef(null),saveQueue=useRef(Promise.resolve()),saveNumber=useRef(0),errorTimer=useRef(null);
 function notify(message){setError(message);clearTimeout(errorTimer.current);errorTimer.current=setTimeout(()=>setError(''),8000);}
 async function saveShelf(name){
  const id=draft.shelfId||crypto.randomUUID();
  let thumbnail=null;
  const first=arrange(draft)[0];
  if(first){try{thumbnail=await flowerThumbnail(byKey[first.key]);}catch{}}
  const linked={...draft,shelfId:id,title:name};
  await saveShelfBouquet(shelfItemFromDraft(linked,{id,name,thumbnail}),linked);
  setDraft(linked);
  notify('Saved to my bouquets.');
 }
 async function openShelf(item){
  if(hasBouquetContent(draft)&&!window.confirm(`Open "${item.name}"? Unsaved changes to your current bouquet will be replaced.`))return;
  const saved=await loadShelfDraft(item.id);
  if(!saved)throw new Error('That saved bouquet is no longer available.');
  setDraft(hydrateDraft(saved));setShelfOpen(false);setDesigner(null);setSelectedId(null);closePreview();notify(`Opened ${item.name}.`);
 }
 async function duplicateShelf(item){
  const saved=await loadShelfDraft(item.id);
  if(!saved)throw new Error('That saved bouquet is no longer available.');
  const id=crypto.randomUUID(),name=`Copy of ${item.name}`,copy={...hydrateDraft(saved),shelfId:id,title:name};
  await saveShelfBouquet(shelfItemFromDraft(copy,{id,name,thumbnail:item.thumbnail}),copy);
  notify(`Duplicated ${item.name}.`);
 }
 async function deleteShelf(item){
  await deleteShelfBouquet(item.id);
  if(draft.shelfId===item.id)setDraft(previous=>({...previous,shelfId:null,title:''}));
  notify(`Deleted ${item.name}.`);
 }
 function startNewBouquet(){
  if(hasBouquetContent(draft)&&!window.confirm('Start a new bouquet? Unsaved changes to your current bouquet will be replaced.'))return;
  setDraft(createDraft());setShelfOpen(false);setDesigner(null);setSelectedId(null);closePreview();notify('Started a new bouquet.');
 }
 function applyOccasion(occasion){
  if(hasBouquetContent(draft)&&!window.confirm(`Start a ${occasion.name} bouquet? Unsaved changes to your current bouquet will be replaced.`))return;
  setDraft(createDraftFromOccasion(occasion));setDesigner(null);setSelectedId(null);closePreview();notify(`${occasion.name} bouquet started.`);
 }
 useEffect(()=>{let alive=true;loadDraft().then(saved=>{if(!alive)return;if(saved?.version===1){setDraft(hydrateDraft(saved));if(saved.message?.designerSession)setDesigner(saved.message.designerSession.history.present);}setHydration('ready');}).catch(()=>{if(alive){setHydration('failed');setSaveStatus('Draft recovery failed. Saving paused to protect it. Reload to retry.');}});return()=>{alive=false;clearTimeout(errorTimer.current);};},[]);
 useEffect(()=>{if(!canSaveDraft(hydration))return;setSaveStatus('Saving…');const number=++saveNumber.current;const timer=setTimeout(()=>{saveQueue.current=saveQueue.current.catch(()=>{}).then(()=>saveDraft(draft)).then(()=>{if(number===saveNumber.current)setSaveStatus('Saved on this device');}).catch(()=>{if(number===saveNumber.current)setSaveStatus('Could not save — storage may be full. Keep this tab open.');});},350);return()=>clearTimeout(timer);},[draft,hydration]);
 function dispatch(action){setDraft(previous=>{const result=updateDraft(previous,action);if(result.error)queueMicrotask(()=>notify(result.error));return result.draft;});}
 useEffect(()=>{setSelectedId(null);},[draft.step]);
 const selected=selectedId?arrange(draft).find(stem=>stem.id===selectedId):null;
 useEffect(()=>{if(selectedId&&!selected)setSelectedId(null);},[selectedId,selected]);
 function changeFlower(value){if(selected)dispatch({type:'stem',id:selected.id,value});}
 function removeFlower(){if(!selected)return;dispatch({type:'removeStem',id:selected.id});setSelectedId(null);}
 useEffect(()=>{body.current?.scrollTo({top:0});if(matchMedia("(max-width:820px)").matches&&document.documentElement.scrollTop>0){const editor=body.current?.parentElement;const stage=document.querySelector(".preview");if(editor&&stage)window.scrollTo({top:Math.max(0,editor.offsetTop-stage.offsetHeight),behavior:"instant"});}},[draft.step]);
 const backdrop=useBlobUrl(draft.message.backdrop),color=draft.backdrop==='auto'?(draft.accent===1?'#E2EDF8':draft.accent===3?'#F1F3EF':'#EBF2F7'):draft.backdrop,hasCard=cardHasContent(draft.message);
 function openPreview(){setPreviewStatus('');setPreparingImage(false);setExportFormat('portrait');setIncludeCard(hasCard);setPreview(true);}
 function closePreview(){setPreview(false);setPlaySong(false);setPreviewStatus('');setPreparingImage(false);setIncludeCard(false);}
 async function makeBouquetFile(){
  const sceneDataUrl=previewScene.current?.snapshot();
  if(!sceneDataUrl)throw new Error('Your bouquet is still loading. Try again in a moment.');
  return composeBouquetImage({sceneDataUrl,background:color,backdropUrl:backdrop,words:draft.message.words,date:draft.message.date,wordColor:draft.message.color,wordFont:draft.message.font,textSize:draft.message.textSize,format:exportFormat});
 }
 async function makeExportFiles(){
  const files=[await makeBouquetFile()];
  if(includeCard&&hasCard)files.push(draft.message.card?await captureDesignedCard(cardExport.current,draft.message.card):await composeMessageCard({message:draft.message.text,date:draft.message.date}));
  return files;
 }
 async function downloadBouquet(){
  if(preparingImage)return;setPreparingImage(true);setPreviewStatus(includeCard&&hasCard?'Preparing both images…':'Preparing image…');
  try{const files=await makeExportFiles();files.forEach(saveImageFile);setPreviewStatus(files.length>1?'Bouquet and card downloaded.':'Image downloaded.');}
  catch(error){setPreviewStatus(error.message||'Could not create the image.');}
  finally{setPreparingImage(false);}
 }
 async function shareBouquet(){
  if(preparingImage)return;setPreparingImage(true);setPreviewStatus(includeCard&&hasCard?'Preparing both images…':'Preparing image…');
  try{
   const files=await makeExportFiles(),result=await shareImageFiles(files,draft.message.words||'A bouquet made with flower4you');
   setPreviewStatus(result==='shared'?(files.length>1?'Bouquet and card shared.':'Image shared.'):result==='downloaded'?(files.length>1?'Sharing two images is unavailable here, so both were downloaded.':'Sharing is unavailable here, so the image was downloaded.'):'');
  }catch(error){setPreviewStatus(error.message||'Could not create the image.');}
  finally{setPreparingImage(false);}
 }
 return <main className={'builder '+(draft.step===2?'message-mode':'')}><header className="studio-header"><div className="studio-brand"><span className="brand-mark"><Icon size={31}/></span><div><span className="brand-name">flower4you</span><span className="brand-note">a little love, stem by stem</span></div></div><nav className="studio-nav desktop-step-nav" aria-label="Bouquet steps">{['Wrap','Flowers','Message'].map((label,i)=><button key={label} aria-label={label+' step'} className={draft.step===i?'current':''} aria-current={draft.step===i?'step':undefined} onClick={()=>dispatch({type:'patch',value:{step:i}})}>{label}</button>)}</nav><div className="studio-header-actions"><span className="save-status" role="status">{saveStatus}</span><button className="preview-action" aria-label="Preview bouquet" onClick={openPreview}><Icon name="eye" size={17}/> Preview</button></div></header><section className="preview" aria-label="Bouquet preview"><div className="stage-heading"><span>Your bouquet</span><span className="stage-note">made with a little thought</span></div><div className="bouquet-stage" style={{backgroundColor:color}}>{backdrop&&<div className="photo-backdrop" style={{backgroundImage:`url(${backdrop})`}}/>}<BouquetScene draft={draft} onSelect={setSelectedId}/>{selected&&<FlowerControls className="desktop" stem={selected} onChange={changeFlower} onRemove={removeFlower} onClose={()=>setSelectedId(null)}/>}{draft.message.text&&<button className="bouquet-card-button" onClick={()=>setInfo({title:'A note for you',text:draft.message.text})}>♡<small>open your card</small></button>}</div><div className="stage-footer"><span>Turn it around. Make it yours.</span><span>{stemCount(draft)} / {draft.size} stems</span></div>{selected&&<div className="flower-controls-slot mobile"><FlowerControls stem={selected} onChange={changeFlower} onRemove={removeFlower} onClose={()=>setSelectedId(null)}/></div>}</section><aside className="editor" aria-label="Bouquet editor"><nav className="studio-nav mobile-step-nav" aria-label="Bouquet steps">{['Wrap','Flowers','Message'].map((label,i)=><button key={label} aria-label={label+' step'} className={draft.step===i?'current':''} aria-current={draft.step===i?'step':undefined} onClick={()=>dispatch({type:'patch',value:{step:i}})}>{label}</button>)}</nav><div className="editor-body" ref={body}>{hydration!=='loading'&&<div className="bouquet-bar"><button className="shelf-link" onClick={()=>setShelfOpen(true)}>My bouquets</button><span className="bouquet-title">{draft.title||'Unsaved bouquet'}</span></div>}{hydration==='loading'?<p>Restoring your bouquet…</p>:draft.step===0?<WrapPanel draft={draft} dispatch={dispatch} onOccasion={applyOccasion}/>:draft.step===1?<FlowersPanel draft={draft} dispatch={dispatch} onInfo={setInfo}/>:<MessagePanel draft={draft} dispatch={dispatch} onDesigner={setDesigner} onPreview={openPreview} onError={notify}/>}</div><footer className="editor-footer"><span>{stemCount(draft)} little reasons to smile</span><span>flower4you</span></footer></aside>
 {error&&<div className="toast" role="alert">{error}<button aria-label="Dismiss notification" onClick={()=>setError('')}>×</button></div>}
 {info&&<Dialog title={info.title} onClose={()=>setInfo(null)}><p>{info.text}</p><button className="primary" onClick={()=>setInfo(null)}>Lovely</button></Dialog>}
 {designer&&<CardDesigner value={designer} message={draft.message.text} photos={draft.message.photos} session={draft.message.designerSession} savedHistory={draft.message.cardHistory} onDraft={session=>dispatch({type:"message",value:{designerSession:session}})} onCancel={()=>{setDesigner(null);dispatch({type:"message",value:{designerSession:null}});}} onError={notify} onSave={(card,cardHistory)=>{dispatch({type:"message",value:{card,cardHistory,designerSession:null}});setDesigner(null);}}/>}
 {shelfOpen&&<ShelfDialog draft={draft} onClose={()=>setShelfOpen(false)} onOpen={openShelf} onNew={startNewBouquet} onSave={saveShelf} onDuplicate={duplicateShelf} onDelete={deleteShelf}/>}
 {preview&&<Dialog title="A little something for you" onClose={closePreview}><p className="preview-subtitle">{stemCount(draft)} {stemCount(draft)===1?'stem':'stems'}, a little thought, and a whole lot of love.</p><div className="finished-bouquet" style={{backgroundColor:color}}>{backdrop&&<div className="photo-backdrop" style={{backgroundImage:`url(${backdrop})`}}/>}<BouquetScene ref={previewScene} draft={draft}/></div>{draft.message.card?<CardArtwork card={draft.message.card} message={draft.message.text} photos={draft.message.card.photos||[]}/>:draft.message.text&&<div className="finished-note">{draft.message.text}</div>}{draft.message.photos.length>0&&<div className="finished-photos">{draft.message.photos.map((photo,i)=><BlobImage key={i} blob={photo} alt={'Memory '+(i+1)}/>)}</div>}{draft.message.voice&&<div className="finished-media"><h3>A note in your voice</h3><BlobAudio blob={draft.message.voice}/></div>}{parseYouTubeUrl(draft.message.song)&&<div className="finished-media">{playSong?<iframe title="Your bouquet song" src={'https://www.youtube-nocookie.com/embed/'+parseYouTubeUrl(draft.message.song)+'?autoplay=1&start='+youTubeStart(draft.message.song)} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen/>:<button className="pill rose-fill" onClick={()=>setPlaySong(true)}>♪ Play your song</button>}</div>}<div className="export-formats" role="group" aria-label="Image format">{Object.entries(imageFormats).map(([key,format])=><button key={key} className={exportFormat===key?'active':''} aria-pressed={exportFormat===key} disabled={preparingImage} onClick={()=>{setExportFormat(key);setPreviewStatus('');}}>{key[0].toUpperCase()+key.slice(1)}<small>{format.width}×{format.height}</small></button>)}</div>{hasCard&&<label className="check-label include-card"><input type="checkbox" checked={includeCard} disabled={preparingImage} onChange={event=>{setIncludeCard(event.target.checked);setPreviewStatus('');}}/>Include card</label>}<div className="share-actions"><button className="pill rose-fill" disabled={preparingImage} onClick={shareBouquet}>{includeCard&&hasCard?'Share images':'Share image'}</button><button className="pill" disabled={preparingImage} onClick={downloadBouquet}>{includeCard&&hasCard?'Download images':'Download image'}</button></div>{previewStatus&&<p className="share-status" role="status">{previewStatus}</p>}<p className="local-note">Saved only on this device. Nothing has been uploaded.</p><button className="primary" onClick={closePreview}>Back to editing</button></Dialog>}
 {preview&&includeCard&&draft.message.card&&<div className="card-export" aria-hidden="true"><CardArtwork artworkRef={cardExport} width={1080} card={draft.message.card} message={draft.message.text} photos={draft.message.card.photos||[]}/></div>}
 </main>;
}
