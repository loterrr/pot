import {stemCount} from './bouquet/draft.js';

export function hasBouquetContent(draft){
  const message=draft?.message||{};
  return stemCount(draft||{quantities:{}})>0
    ||Boolean(draft?.title?.trim())
    ||Boolean(message.text?.trim())
    ||Boolean(message.words?.trim())
    ||Boolean(message.song)
    ||Boolean(message.voice)
    ||Boolean(message.backdrop)
    ||Boolean(message.photos?.length)
    ||Boolean(message.card);
}

export function suggestShelfName(draft){
  const title=typeof draft?.title==='string'?draft.title.trim():'';
  if(title)return title;
  const words=typeof draft?.message?.words==='string'?draft.message.words.trim():'';
  return words?words.slice(0,40):'My bouquet';
}

export function upsertShelfItem(items,item){
  const list=Array.isArray(items)?items:[];
  return list.some(entry=>entry.id===item.id)
    ?list.map(entry=>entry.id===item.id?item:entry)
    :[...list,item];
}

export function removeShelfItem(items,id){
  return (Array.isArray(items)?items:[]).filter(item=>item.id!==id);
}

export function shelfItemFromDraft(draft,{id,name,thumbnail=null,now=Date.now()}){
  return {
    id,
    name,
    updatedAt:now,
    stemCount:stemCount(draft),
    size:draft.size,
    thumbnail,
  };
}
