export const templateNames=['Classic','Polaroid','Love note','Minimal','Postcard','Story'];
export const stickers=['♥','♡','💕','★','✧','✨','🌸','🌼','🌷','🍃','🌿','🎀','🦋','☀','☾','☁','🌈','♫','✉','🎈','🎁','🎂','💍','♛','☺','🎊','〰','❦'];
export const stickerNames=['Heart','Heart outline','Two hearts','Star','Twinkle','Sparkles','Flower','Daisy','Tulip','Leaf','Sprig','Bow','Butterfly','Sun','Moon','Cloud','Rainbow','Music note','Envelope','Balloon','Gift box','Cake','Ring','Crown','Smile','Confetti','Swash','Wreath'];
export const cardColors=['#faf9f6','#f3ede4','#f7d9de','#fbe8c8','#e7efe3','#e3e9f5','#3a2f2f','#20201c'];
export const gradients=['linear-gradient(135deg,#f7d9de,#fbe8c8)','linear-gradient(135deg,#e7efe3,#faf9f6)','linear-gradient(135deg,#e3e9f5,#f7d9de)','linear-gradient(135deg,#f3ede4,#faf9f6)','linear-gradient(135deg,#3a2f2f,#a85a67)','linear-gradient(135deg,#fbe8c8,#e7efe3)'];
export const element=(type,content,x=15,y=30)=>({id:crypto.randomUUID(),type,content,x,y,width:70,height:type==='photo'?35:16,rotation:0,fontSize:type==='sticker'?42:25,color:'#2C384E',font:'Playfair Display',align:'center',frame:'none'});
export function createCard(template='Classic'){
  const card={template,size:template==='Story'?'Story':'Card',background:'#FFFFFF',texture:true,elements:[element('text','A little something\nfor you',12,14),element('message','',12,57)]};
  if(template==='Polaroid'){card.background='#EBF2F7';card.elements=[{...element('photo','',10,9),width:80,height:55,frame:'polaroid'},element('message','',10,72)];}
  if(template==='Love note'){card.background='#E2EDF8';card.elements=[element('sticker','♡',15,8),{...element('text','with love,',15,31),font:'Caveat',fontSize:40},element('message','',15,62)];}
  if(template==='Minimal')card.elements=[{...element('text','FOR YOU',15,22),font:'Inter',fontSize:17},element('message','',15,51)];
  if(template==='Postcard'){card.background='#F3F7FA';card.elements=[{...element('text','a note for you',10,15),fontSize:32},element('message','',10,50),{...element('sticker','✉',72,8),width:16}];}
  if(template==='Story'){card.background='linear-gradient(145deg,#E2EDF8,#FFFFFF)';card.elements=[{...element('text','You make the\nworld bloom.',10,17),fontSize:35},element('message','',10,63),element('sticker','✧',10,80)];}
  return card;
}
export const createHistory=card=>({past:[],present:card,future:[]});
export const changeCard=(h,card)=>({past:[...h.past.slice(-39),h.present],present:card,future:[]});
export const undoCard=h=>h.past.length?{past:h.past.slice(0,-1),present:h.past.at(-1),future:[h.present,...h.future]}:h;
export const redoCard=h=>h.future.length?{past:[...h.past,h.present],present:h.future[0],future:h.future.slice(1)}:h;
export const photoPool=(card,bouquetPhotos)=>card.photos?[...card.photos]:[...bouquetPhotos];
export const pinchElement=(item,ratio,rotation)=>({...item,width:Math.max(5,Math.min(150,item.width*ratio)),height:Math.max(5,Math.min(150,item.height*ratio)),rotation:item.rotation+rotation});
