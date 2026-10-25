import {byKey,wraps} from './catalog.js';
import {arrange,createDraft} from './draft.js';
import {templateNames} from '../message/card.js';
import {limitMessage,parseYouTubeUrl} from '../message/media.js';
import {cardAspects} from './share-card.js';

const CARD_FONTS=['Playfair Display','Inter','Caveat','Cormorant Garamond','Manrope','Great Vibes'];
const WORD_FONTS=['Classic','Elegant','Modern','Script'];
const ALIGNS=['left','center','right'];
const MAX_LINK_CHARS=160000;
const MAX_DECODED_BYTES=256*1024;
const HEX=/^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

const clamp=(value,min,max,fallback)=>{const number=Number(value);return Number.isFinite(number)?Math.min(max,Math.max(min,number)):fallback;};
const pick=(value,list,fallback)=>list.includes(value)?value:fallback;
const shortText=(value,max)=>typeof value==='string'?Array.from(value).slice(0,max).join(''):'';
const hexColor=(value,fallback='#2C384E')=>typeof value==='string'&&HEX.test(value)?value:fallback;
const surface=value=>typeof value==='string'&&value.length<=200&&!/url\(|[;{}<>]/i.test(value)&&(HEX.test(value)||/^linear-gradient\([^;{}<>]*\)$/i.test(value))?value:'#FFFFFF';
const dateValue=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value+'T12:00:00'))?value:'';

function compactCard(card){
  if(!card||typeof card!=='object')return null;
  const elements=(Array.isArray(card.elements)?card.elements:[]).filter(item=>item&&['text','message','sticker'].includes(item.type)).slice(0,24);
  return {
    template:card.template,
    size:card.size,
    background:card.background,
    texture:Boolean(card.texture),
    elements:elements.map(item=>({
      type:item.type,
      content:item.type==='sticker'?shortText(item.content,4):shortText(item.content,300),
      x:item.x,y:item.y,width:item.width,height:item.height,
      rotation:item.rotation,fontSize:item.fontSize,font:item.font,color:item.color,align:item.align,
    })),
  };
}

export function shareState(draft){
  const stems=arrange(draft).slice(0,20);
  return {
    v:1,
    wrap:draft.wrap,
    size:draft.size,
    spread:draft.spread,
    autoSpread:Boolean(draft.autoSpread),
    seed:draft.seed,
    paper:draft.paper,
    accent:draft.accent,
    backdrop:draft.backdrop,
    quantities:Object.fromEntries(Object.entries(draft.quantities||{}).filter(([key,count])=>Object.hasOwn(byKey,key)&&count>0)),
    stems:stems.map(stem=>[stem.key,+stem.x.toFixed(3),+stem.z.toFixed(3),Math.round(stem.spin),+stem.height.toFixed(2)]),
    message:{
      text:draft.message.text,
      words:draft.message.words,
      date:draft.message.date,
      color:draft.message.color,
      font:draft.message.font,
      textSize:draft.message.textSize,
      song:draft.message.song,
      card:compactCard(draft.message.card),
    },
  };
}

function decodeCard(value){
  if(!value||typeof value!=='object')return null;
  const elements=(Array.isArray(value.elements)?value.elements:[]).slice(0,24).flatMap((item,index)=>{
    if(!item||!['text','message','sticker'].includes(item.type))return [];
    return [{
      id:'shared-element-'+index,
      type:item.type,
      content:item.type==='sticker'?shortText(item.content,4):shortText(item.content,300),
      x:clamp(item.x,-100,200,15),
      y:clamp(item.y,-100,200,30),
      width:clamp(item.width,2,200,70),
      height:clamp(item.height,2,200,16),
      rotation:clamp(item.rotation,-360,360,0),
      fontSize:clamp(item.fontSize,8,100,25),
      font:pick(item.font,CARD_FONTS,'Playfair Display'),
      color:hexColor(item.color),
      align:pick(item.align,ALIGNS,'center'),
    }];
  });
  if(!elements.length)return null;
  return {
    template:pick(value.template,templateNames,'Classic'),
    size:pick(value.size,Object.keys(cardAspects),'Card'),
    background:surface(value.background),
    texture:value.texture===true,
    photos:[],
    elements,
  };
}

export function hydrateSharedState(state){
  if(!state||typeof state!=='object'||state.v!==1)return null;
  const size=pick(Number(state.size),[10,16,20],20);
  const quantities={};
  let total=0;
  for(const [key,count] of Object.entries(state.quantities&&typeof state.quantities==='object'?state.quantities:{})){
    if(!Object.hasOwn(byKey,key)||total>=size)continue;
    const amount=Math.min(size-total,Math.floor(clamp(count,0,size,0)));
    if(amount>0){quantities[key]=amount;total+=amount;}
  }
  const stems=(Array.isArray(state.stems)?state.stems:[]).slice(0,size).flatMap((stem,index)=>{
    if(!Array.isArray(stem)||!quantities[stem[0]])return [];
    return [{id:'shared-stem-'+index,key:stem[0],x:clamp(stem[1],-.85,.85,0),z:clamp(stem[2],-.85,.85,0),spin:clamp(stem[3],-360,360,0),height:clamp(stem[4],-.5,1.5,1)}];
  });
  const raw=state.message&&typeof state.message==='object'?state.message:{};
  const song=shortText(raw.song,300);
  const defaults=createDraft().message;
  return {
    ...createDraft(),
    step:2,
    wrap:pick(state.wrap,wraps.map(item=>item.key),'segment'),
    size,
    spread:clamp(state.spread,.4,2.4,.92),
    autoSpread:state.autoSpread===true,
    seed:Math.floor(clamp(state.seed,0,1e9,42)),
    paper:Math.floor(clamp(state.paper,0,10,0)),
    accent:Math.floor(clamp(state.accent,0,10,0)),
    backdrop:state.backdrop==='auto'||HEX.test(state.backdrop)?state.backdrop:'auto',
    quantities,
    stems,
    message:{
      ...defaults,
      text:limitMessage(shortText(raw.text,140)),
      words:shortText(raw.words,80),
      date:dateValue(raw.date),
      color:hexColor(raw.color,'#20201c'),
      font:pick(raw.font,WORD_FONTS,'Classic'),
      textSize:clamp(raw.textSize,60,180,100),
      song:parseYouTubeUrl(song)?song:'',
      card:decodeCard(raw.card),
      photos:[],
      voice:null,
      backdrop:null,
    },
  };
}

function base64url(bytes){
  let binary='';
  for(let index=0;index<bytes.length;index+=0x8000)binary+=String.fromCharCode(...bytes.subarray(index,index+0x8000));
  return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}

function fromBase64url(value){
  const text=value.replace(/-/g,'+').replace(/_/g,'/'),binary=atob(text+'='.repeat((4-text.length%4)%4));
  const bytes=new Uint8Array(binary.length);
  for(let index=0;index<binary.length;index++)bytes[index]=binary.charCodeAt(index);
  return bytes;
}

async function pack(json){
  const bytes=new TextEncoder().encode(json);
  try{if(typeof CompressionStream==='function'){
    const stream=new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'));
    return 'z'+base64url(new Uint8Array(await new Response(stream).arrayBuffer()));
  }}catch{ /* Fall back when this browser does not support deflate-raw. */ }
  return 'r'+base64url(bytes);
}

async function unpack(data){
  const bytes=fromBase64url(data.slice(1));
  if(data[0]==='z'){
    if(typeof DecompressionStream!=='function')throw new Error('This browser cannot open bouquet links.');
    const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    const reader=stream.getReader(),chunks=[];let length=0;
    try{
      while(true){const {value,done}=await reader.read();if(done)break;length+=value.length;if(length>MAX_DECODED_BYTES){await reader.cancel();throw new Error('Bouquet link is too large.');}chunks.push(value);}
    }finally{reader.releaseLock();}
    const output=new Uint8Array(length);let offset=0;for(const chunk of chunks){output.set(chunk,offset);offset+=chunk.length;}
    return new TextDecoder().decode(output);
  }
  if(data[0]==='r'&&bytes.length<=MAX_DECODED_BYTES)return new TextDecoder().decode(bytes);
  throw new Error('Unknown bouquet link format.');
}

export async function encodeShareLink(draft,base=''){
  const data=await pack(JSON.stringify(shareState(draft)));
  if(data.length>MAX_LINK_CHARS)throw new Error('This bouquet is too large for a link.');
  return String(base).split('#')[0]+'#b='+data;
}

export async function decodeShareLink(value){
  const raw=String(value??''),marker=raw.indexOf('#b='),data=marker>=0?raw.slice(marker+3):raw;
  if(!/^[zr][A-Za-z0-9_-]+$/.test(data)||data.length>MAX_LINK_CHARS)return null;
  try{
    const state=JSON.parse(await unpack(data));
    return hydrateSharedState(state);
  }catch{
    return null;
  }
}
