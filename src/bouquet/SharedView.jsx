import {useState} from 'react';
import Icon from '../Icon.jsx';
import BouquetScene from './BouquetScene.jsx';
import {bouquetColor,stemCount} from './draft.js';
import {CardArtwork} from '../message/CardDesigner.jsx';
import {parseYouTubeUrl,youTubeStart} from '../message/media.js';

export default function SharedView({draft,onMakeOwn}){
  const [playSong,setPlaySong]=useState(false);
  const {message}=draft,card=message.card,song=parseYouTubeUrl(message.song),count=stemCount(draft);
  return <main className="shared-page">
    <header className="shared-header"><span className="brand-mark"><Icon size={31}/></span><div><span className="brand-name">flower4you</span><span className="brand-note">a little love, stem by stem</span></div></header>
    <h1 className="shared-kicker">A bouquet for you</h1>
    <div className="shared-stage" style={{backgroundColor:bouquetColor(draft)}}><BouquetScene draft={draft}/></div>
    <section className="shared-body">
      <p className="shared-count">{count} {count===1?'stem':'stems'}, chosen and arranged for you.</p>
      {card?<CardArtwork card={card} message={message.text} photos={[]}/>:message.text?<p className="finished-note">{message.text}</p>:null}
      {song&&<div className="finished-media">{playSong?<iframe title="Your bouquet song" src={'https://www.youtube-nocookie.com/embed/'+song+'?autoplay=1&start='+youTubeStart(message.song)} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen/>:<button className="pill rose-fill" onClick={()=>setPlaySong(true)}>♪ Play your song</button>}</div>}
      <button className="primary shared-cta" onClick={onMakeOwn}>Make your own bouquet</button>
      <p className="local-note">No account, no upload. This whole bouquet travels inside the link.</p>
    </section>
  </main>;
}
