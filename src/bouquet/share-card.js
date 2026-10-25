import {wrapLines} from './share-image.js';

export const cardAspects={Card:4/5,Square:1,Story:9/16};

export function cardHasContent(message){
  return Boolean(message?.card || String(message?.text||'').trim());
}

export function cardImageSize(card){
  const width=2160,aspect=cardAspects[card?.size]||cardAspects.Card;
  return {width,height:Math.round(width/aspect)};
}

export function cardFilename(date=new Date(),card){
  const suffix=card?.size==='Square'?'-square':card?.size==='Story'?'-story':'';
  return `flower4you-card-${date.toISOString().slice(0,10)}${suffix}.png`;
}

export function messageCardFilename(date=new Date()){
  return `flower4you-card-${date.toISOString().slice(0,10)}.png`;
}

function fileFromCanvas(canvas,name){
  return new Promise((resolve,reject)=>{
    canvas.toBlob(blob=>blob?resolve(new File([blob],name,{type:'image/png'})):reject(new Error('This browser could not create the card image.')),'image/png');
  });
}

export async function composeMessageCard({message,date=''}={}){
  const text=String(message||'').trim();
  if(!text)throw new Error('There is no message to put on the card.');
  const scale=2,width=1080,height=1350;
  const canvas=document.createElement('canvas');canvas.width=width*scale;canvas.height=height*scale;
  const ctx=canvas.getContext('2d');
  if(!ctx)throw new Error('This browser could not create the card image.');
  ctx.scale(scale,scale);
  await document.fonts?.ready;

  ctx.fillStyle='#EBF2F7';ctx.fillRect(0,0,width,height);
  ctx.save();
  ctx.shadowColor='rgba(44,56,78,.12)';ctx.shadowBlur=28;ctx.shadowOffsetY=10;
  ctx.fillStyle='#FFFDF9';
  ctx.beginPath();ctx.roundRect(90,70,900,1210,18);ctx.fill();
  ctx.restore();
  ctx.strokeStyle='#E2ECF5';ctx.lineWidth=2;
  ctx.beginPath();ctx.roundRect(90,70,900,1210,18);ctx.stroke();

  ctx.textAlign='center';ctx.textBaseline='alphabetic';
  ctx.fillStyle='#7D93B2';
  ctx.font='italic 400 32px "Playfair Display", Georgia, serif';
  ctx.fillText('a note for you',width/2,210);

  let size=68;
  let lines=[];
  let lineHeight=0;
  do{
    lineHeight=Math.round(size*1.35);
    ctx.font=`400 ${size}px Caveat, cursive`;
    lines=wrapLines(text,800,value=>ctx.measureText(value).width);
    if(lines.length*lineHeight<=760||size<=40)break;
    size-=4;
  }while(true);

  ctx.fillStyle='#2C384E';
  const total=lines.length*lineHeight;
  let y=680-total/2+lineHeight*.82;
  for(const line of lines){ctx.fillText(line,width/2,y);y+=lineHeight;}

  if(date){
    ctx.fillStyle='#7D93B2';ctx.globalAlpha=.8;
    ctx.font='400 24px Manrope, sans-serif';
    ctx.fillText(new Date(date+'T12:00:00').toLocaleDateString(undefined,{month:'long',day:'numeric',year:'numeric'}),width/2,1085);
    ctx.globalAlpha=1;
  }

  ctx.fillStyle='#4A6B94';
  ctx.font='500 28px "Playfair Display", Georgia, serif';
  ctx.fillText('flower4you',width/2,1210);
  return fileFromCanvas(canvas,messageCardFilename(new Date()));
}

export async function captureDesignedCard(node,card){
  if(!node)throw new Error('The card is not ready to share yet.');
  const {toBlob}=await import('html-to-image');
  const blob=await toBlob(node,{pixelRatio:2});
  if(!blob)throw new Error('This browser could not create the card image.');
  return new File([blob],cardFilename(new Date(),card),{type:'image/png'});
}
