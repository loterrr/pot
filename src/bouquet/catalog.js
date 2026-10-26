import data from './catalog-data.json' with {type:'json'};
export const flowers=data.flowers.filter(flower=>!flower.hidden);
export const wraps=data.wraps;
export const groups=flowers.reduce((list,flower)=>{
  let group=list.find(g=>g.name===flower.group);
  if(!group){group={name:flower.group,kind:flower.kind||'flower',variants:[]};list.push(group);}
  group.variants.push(flower);return list;
},[]);
export const byKey=Object.fromEntries(data.flowers.map(f=>[f.key,f]));
export const hex=value=>'#'+value.toString(16).padStart(6,'0');
export const backdrops=['#faf9f6','#f6e7e4','#eaf0e7','#e7eef4','#f3ecdd'];
export const pairings=[
  {name:'True Love',keys:['rose','white_rose'],meaning:'Red and white roses, a classic love that lasts.'},
  {name:'New Beginnings',keys:['white_rose','tulip_white'],meaning:'A fresh start, full of gentle possibility.'},
  {name:'Heartfelt Thanks',keys:['carnation','hydrangea'],meaning:'Warm admiration and heartfelt understanding.'},
  {name:'Sunny Hello',keys:['marguerite_pink','tulip_pink'],meaning:'A bright little hello to someone on your mind.'},
  {name:'Rare Admiration',keys:['phalaenopsis','white_rose'],meaning:'Something extraordinary, said softly.'},
  {name:'Keep Going',keys:['delphinium','marguerite'],meaning:'A little encouragement to reach for the light.'},
];
