const wordFonts={Classic:'Cormorant Garamond',Elegant:'Cormorant Garamond',Modern:'Manrope',Script:'Great Vibes'};
export const imageFormats={
  portrait:{width:2160,height:2700,sceneTop:420,sceneHeight:1880,scenePadding:80,wordTop:224,wordSize:92,brandInset:208},
  square:{width:2160,height:2160,sceneTop:340,sceneHeight:1520,scenePadding:80,wordTop:168,wordSize:84,brandInset:176},
  story:{width:2160,height:3840,sceneTop:500,sceneHeight:2800,scenePadding:80,wordTop:280,wordSize:104,brandInset:232},
};
export function imageLayout(format='portrait'){
  return imageFormats[format]||imageFormats.portrait;
}

export function shareFilename(date=new Date(),format='portrait'){
  const suffix=format==='portrait'||!imageFormats[format]?'':`-${format}`;
  return `flower4you-${date.toISOString().slice(0,10)}${suffix}.png`;
}

export function fitRect(sourceWidth,sourceHeight,targetWidth,targetHeight,padding=0){
  const availableWidth=Math.max(1,targetWidth-padding*2),availableHeight=Math.max(1,targetHeight-padding*2);
  const scale=Math.min(availableWidth/Math.max(1,sourceWidth),availableHeight/Math.max(1,sourceHeight));
  const fitted={width:sourceWidth*scale,height:sourceHeight*scale};
  return {x:(targetWidth-fitted.width)/2,y:(targetHeight-fitted.height)/2,...fitted};
}

export function wrapLines(text,maxWidth,measure){
  const lines=[];
  for(const paragraph of String(text).split('\n')){
    if(!paragraph){lines.push('');continue;}
    let line='';
    for(const word of paragraph.split(' ')){
      if(line&&measure(line+' '+word)<=maxWidth){line+=' '+word;continue;}
      if(line){lines.push(line.trimEnd());line='';}
      if(measure(word)<=maxWidth){line=word;continue;}
      for(const character of word){
        const next=line+character;
        if(line&&measure(next)>maxWidth){lines.push(line);line=character;}
        else line=next;
      }
    }
    lines.push(line.trimEnd());
  }
  return lines;
}

export function readableInk(color){
  const match=/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color||'');
  if(!match)return '#2C384E';
  let hex=match[1];if(hex.length===3)hex=hex.split('').map(c=>c+c).join('');
  const [r,g,b]=[0,2,4].map(i=>parseInt(hex.slice(i,i+2),16)/255);
  return .299*r+.587*g+.114*b>.58?'#2C384E':'#FFFDF9';
}

function loadImage(source){
  return new Promise((resolve,reject)=>{
    const image=new Image();
    image.onload=()=>resolve(image);
    image.onerror=()=>reject(new Error('Could not load an image for the bouquet snapshot.'));
    image.src=source;
  });
}

function drawCover(ctx,image,targetWidth,targetHeight){
  const scale=Math.max(targetWidth/image.width,targetHeight/image.height);
  const drawWidth=image.width*scale,drawHeight=image.height*scale;
  ctx.drawImage(image,(targetWidth-drawWidth)/2,(targetHeight-drawHeight)/2,drawWidth,drawHeight);
}

export async function composeBouquetImage({sceneDataUrl,background,backdropUrl,words='',date='',wordColor='#20201c',wordFont='Classic',textSize=100,format='portrait'}){
  if(!sceneDataUrl)throw new Error('The bouquet is still loading. Try again in a moment.');
  const layout=imageLayout(format),width=layout.width,height=layout.height;
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext('2d');
  if(!ctx)throw new Error('This browser could not create the bouquet image.');
  await document.fonts?.ready;
  ctx.fillStyle=background||'#EBF2F7';ctx.fillRect(0,0,width,height);
  if(backdropUrl){
    try{
      const backdrop=await loadImage(backdropUrl);
      ctx.save();ctx.filter='blur(36px)';ctx.globalAlpha=.5;drawCover(ctx,backdrop,width,height);ctx.restore();
    }catch{}
  }
  const scene=await loadImage(sceneDataUrl);
  const sceneRect=fitRect(scene.width,scene.height,width,layout.sceneHeight,layout.scenePadding);
  ctx.drawImage(scene,sceneRect.x,layout.sceneTop+sceneRect.y,sceneRect.width,sceneRect.height);

  const ink=readableInk(background);
  const size=Math.round(layout.wordSize*Math.min(1.5,Math.max(.6,textSize/100)));
  ctx.textAlign='center';ctx.textBaseline='alphabetic';
  ctx.font=`${size}px "${wordFonts[wordFont]||wordFonts.Classic}", Georgia, serif`;
  ctx.fillStyle=wordColor||ink;
  let top=layout.wordTop;
  if(words.trim()){
    for(const line of wrapLines(words.trim(),width-360,value=>ctx.measureText(value).width)){
      ctx.fillText(line,width/2,top);top+=size*1.18;
    }
  }
  if(date){
    ctx.font='40px Manrope, sans-serif';ctx.globalAlpha=.72;
    ctx.fillText(new Date(date+'T12:00:00').toLocaleDateString(undefined,{month:'long',day:'numeric',year:'numeric'}),width/2,top+8);
    ctx.globalAlpha=1;
  }

  ctx.font='500 52px "Playfair Display", Georgia, serif';
  const brand='flower4you',brandWidth=ctx.measureText(brand).width+128,brandY=height-layout.brandInset;
  ctx.fillStyle='rgba(255,255,255,.88)';
  ctx.beginPath();ctx.roundRect((width-brandWidth)/2,brandY,brandWidth,112,56);ctx.fill();
  ctx.fillStyle='#2C384E';ctx.fillText(brand,width/2,brandY+74);

  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
  if(!blob)throw new Error('This browser could not create the bouquet image.');
  return new File([blob],shareFilename(new Date(),format),{type:'image/png'});
}

export function saveImageFile(file){
  const url=URL.createObjectURL(file),link=document.createElement('a');
  link.href=url;link.download=file.name;document.body.append(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),60000);
}

export async function shareImageFiles(files,text=''){
  let canShare=false;
  try{canShare=Boolean(navigator.share&&navigator.canShare?.({files}));}catch{}
  if(canShare){
    try{
      await navigator.share({files,title:'flower4you',text});
      return 'shared';
    }catch(error){
      if(error.name==='AbortError')return 'cancelled';
      throw error;
    }
  }
  return 'unavailable';
}
