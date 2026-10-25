import {byKey} from './catalog.js';
import {createDraft,updateDraft} from './draft.js';
import {createCard} from '../message/card.js';

export const occasions=[
  {key:'birthday',name:'Birthday',note:'A bright, happy mix',wrap:'bow',size:16,paper:0,accent:0,backdrop:'#f6e7e4',flowers:{tulip_pink:4,gerbera_white:3,carnation:3,spray_rose:3,eucalyptus:3},cardTemplate:'Story',words:'happy birthday',message:'A little birthday wish, wrapped in flowers.'},
  {key:'anniversary',name:'Anniversary',note:'Soft roses and cream',wrap:'segment',size:16,paper:0,accent:4,backdrop:'#f3ecdd',flowers:{rose:4,white_rose:4,lisianthus_white:4,eucalyptus:4},cardTemplate:'Love note',words:'for always',message:'Another year, another reason to choose you.'},
  {key:'thank-you',name:'Thank you',note:'A warm, grateful bunch',wrap:'bow',size:10,paper:0,accent:1,backdrop:'#e7eef4',flowers:{carnation:3,hydrangea:2,marguerite:3,eucalyptus:2},cardTemplate:'Minimal',words:'thank you',message:'Thank you for being exactly the kind of person you are.'},
  {key:'just-because',name:'Just because',note:'A small, spontaneous love',wrap:'segment',size:10,paper:0,accent:0,backdrop:'#faf9f6',flowers:{tulip_pink:3,ranunculus_blush:3,spray_rose:2,eucalyptus:2},cardTemplate:'Classic',words:'just because',message:'No occasion. Just a little love, stem by stem.'},
];

export function createDraftFromOccasion(occasion){
  let draft=updateDraft(createDraft(),{type:'patch',value:{
    step:1,
    wrap:occasion.wrap,
    size:occasion.size,
    paper:occasion.paper,
    accent:occasion.accent,
    backdrop:occasion.backdrop,
  }}).draft;
  for(const [key,count] of Object.entries(occasion.flowers)){
    for(let i=0;i<count;i++)draft=updateDraft(draft,{type:'add',key}).draft;
  }
  const selected={};
  for(const key of Object.keys(occasion.flowers))selected[byKey[key].group]=key;
  return updateDraft({...draft,selected},{type:'message',value:{
    text:occasion.message,
    words:occasion.words,
    card:createCard(occasion.cardTemplate),
  }}).draft;
}
