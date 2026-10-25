import {flowers,byKey,pairings} from './catalog.js';
export const STEM_RADIUS=.85,STEM_HEIGHT_MIN=-.5,STEM_HEIGHT_MAX=1.5;
const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
const finite=(value,fallback)=>Number.isFinite(value)?value:fallback;
const normalizeSpin=value=>((finite(value,0)%360)+360)%360;
function clampPosition(x,z){const distance=Math.hypot(x,z);return distance>STEM_RADIUS?[x/distance*STEM_RADIUS,z/distance*STEM_RADIUS]:[x,z];}
function sanitizeStem(stem,index,used){
  if(!stem||!byKey[stem.key])return null;
  let id=typeof stem.id==='string'&&stem.id?stem.id:'stem-'+(index+1);
  while(used.has(id))id='stem-'+(index+1)+'-'+used.size;
  used.add(id);
  const [x,z]=clampPosition(finite(stem.x,0),finite(stem.z,0));
  return {id,key:stem.key,x,z,spin:normalizeSpin(stem.spin),height:clamp(finite(stem.height,1),STEM_HEIGHT_MIN,STEM_HEIGHT_MAX)};
}
function storedStems(d){
  const used=new Set();
  return (Array.isArray(d.stems)?d.stems:[]).flatMap((stem,index)=>{const clean=sanitizeStem(stem,index,used);return clean?[clean]:[];});
}
function stemsMatch(d,stems){
  if(stems.length!==stemCount(d))return false;
  const counts={};for(const stem of stems)counts[stem.key]=(counts[stem.key]||0)+1;
  return Object.entries(d.quantities).every(([key,count])=>(counts[key]||0)===count);
}
function generatedStems(quantities,seed){
  const random=seeded(seed),keys=Object.entries(quantities).flatMap(([key,count])=>Array(Math.max(0,count)).fill(key));
  return keys.map((key,index)=>{
    const angle=index*2.399963229728653+random()*.32,radius=Math.sqrt((index+.5)/Math.max(1,keys.length))*STEM_RADIUS;
    return {id:`s${seed}-${index+1}`,key,x:Math.cos(angle)*radius,z:Math.sin(angle)*radius,spin:byKey[key].spinDeg??random()*360,height:1+(random()-.5)*.5};
  });
}
function nextStemId(stems,seed){
  const largest=stems.reduce((max,stem)=>{const match=/-(\d+)$/.exec(stem.id);return match?Math.max(max,+match[1]):max;},0);
  return `s${seed}-${largest+1}`;
}
function materialize(d){return arrange(d).map(stem=>({...stem}));}
export const createDraft=()=>({version:1,step:0,wrap:'segment',size:20,spread:.92,autoSpread:true,paper:0,accent:0,backdrop:'auto',quantities:{},stems:[],selected:{},seed:42,shelfId:null,title:'',message:{text:'',song:'',voice:null,photos:[],backdrop:null,words:'',date:'',color:'#20201c',font:'Classic',textSize:100,card:null}});
export function hydrateDraft(saved){
  if(!saved||saved.version!==1)return createDraft();
  return {...createDraft(),...saved,shelfId:typeof saved.shelfId==='string'?saved.shelfId:null,title:typeof saved.title==='string'?saved.title:'',message:{...createDraft().message,...saved.message}};
}
export const stemCount=d=>Object.values(d.quantities).reduce((a,b)=>a+b,0);
export const pairingMatches=d=>pairings.filter(p=>p.keys.every(k=>d.quantities[k]>0));
export function updateDraft(d,action){
  let next=d;let error='';
  const count=stemCount(d);
  if(action.type==='add'){
    if(!byKey[action.key])error='Unknown flower.';
    else if(count>=d.size)error=`Your bouquet is full — ${d.size} stems. Remove a stem to add another.`;
    else{
      const stems=materialize(d),quantities={...d.quantities,[action.key]:(d.quantities[action.key]||0)+1};
      const ordinal=stems.filter(stem=>stem.key===action.key).length;
      const candidates=generatedStems(quantities,d.seed).filter(stem=>stem.key===action.key);
      const candidate=candidates[ordinal]||candidates[candidates.length-1];
      next={...d,quantities,stems:[...stems,{...candidate,id:nextStemId(stems,d.seed)}]};
    }
  }else if(action.type==='remove'){
    const quantity=d.quantities[action.key]||0;
    if(quantity>0){
      const stems=materialize(d);
      for(let index=stems.length-1;index>=0;index--)if(stems[index].key===action.key){stems.splice(index,1);break;}
      next={...d,quantities:{...d.quantities,[action.key]:quantity-1},stems};
    }
  }else if(action.type==='removeStem'){
    const stems=materialize(d),index=stems.findIndex(stem=>stem.id===action.id);
    if(index<0)error='That flower is no longer in the bouquet.';
    else{
      const [removed]=stems.splice(index,1);
      next={...d,quantities:{...d.quantities,[removed.key]:Math.max(0,(d.quantities[removed.key]||0)-1)},stems};
    }
  }else if(action.type==='stem'){
    const stems=materialize(d),index=stems.findIndex(stem=>stem.id===action.id);
    if(index<0)error='That flower is no longer in the bouquet.';
    else{
      const value=action.value||{},current=stems[index];
      let {height,x,z,spin}=current;
      if(Number.isFinite(value.height))height=clamp(value.height,STEM_HEIGHT_MIN,STEM_HEIGHT_MAX);
      if(Number.isFinite(value.x)||Number.isFinite(value.z))[x,z]=clampPosition(finite(value.x,x),finite(value.z,z));
      if(Number.isFinite(value.spin))spin=normalizeSpin(value.spin);
      stems[index]={...current,height,x,z,spin};
      next={...d,stems};
    }
  }else if(action.type==='size'){
    if(![10,16,20].includes(action.value))error='Choose a valid bouquet size.';
    else if(count>action.value)error=`Remove ${count-action.value} stems before choosing this size. Your flowers are safe.`;
    else next={...d,size:action.value};
  }else if(action.type==='clear')next={...d,quantities:{},stems:[]};
  else if(action.type==='arrange'){
    const seed=d.seed+1;
    next={...d,seed,stems:generatedStems(d.quantities,seed)};
  }else if(action.type==='surprise'){
    const random=seeded(d.seed+1),quantities={};
    const candidates=flowers.filter(f=>f.kind!=='leaf');
    const palette=Array.from({length:4},()=>candidates[Math.floor(random()*candidates.length)]);
    for(let i=0;i<d.size;i++){const key=palette[Math.floor(random()*palette.length)].key;quantities[key]=(quantities[key]||0)+1;}
    const selected={...d.selected};for(const key of Object.keys(quantities))selected[byKey[key].group]=key;
    const seed=d.seed+1;
    next={...d,quantities,stems:generatedStems(quantities,seed),selected,seed};
  }else if(action.type==='patch')next={...d,...action.value};
  else if(action.type==='message')next={...d,message:{...d.message,...action.value}};
  else if(action.type==='appendPhotos'){
    if(d.message.photos.length+action.photos.length>4)error='You can add up to four photos.';
    else next={...d,message:{...d.message,photos:[...d.message.photos,...action.photos]}};
  }
  else if(action.type==='wrap')next={...d,wrap:action.value,spread:.92,autoSpread:true};
  return {draft:next,error};
}
export function seeded(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
export function arrange(d){
  const stored=storedStems(d);
  if(stemsMatch(d,stored))return stored;
  return generatedStems(d.quantities,d.seed);
}
