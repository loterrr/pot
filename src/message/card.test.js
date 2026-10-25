import test from 'node:test';
import assert from 'node:assert/strict';
import {createCard,changeCard,undoCard,redoCard,createHistory,photoPool,pinchElement} from './card.js';
test('templates create serializable compositions',()=>{
  for(const name of ['Classic','Polaroid','Love note','Minimal','Postcard','Story']) {
    const card=createCard(name); assert.equal(card.template,name);
    assert.deepEqual(JSON.parse(JSON.stringify(card)),card);
    assert.ok(card.elements.length);
  }
});
test('saved card photo references survive bouquet photo insertion and removal',()=>{
 const ownPhoto=new Blob(['card image'],{type:'image/png'}),bouquetPhoto=new Blob(['other'],{type:'image/png'});
 const saved={...createCard(),photos:[ownPhoto]};
 assert.equal(photoPool(saved,[bouquetPhoto])[0],ownPhoto);
 assert.equal(photoPool(saved,[])[0],ownPhoto);
 assert.equal(photoPool(createCard(),[bouquetPhoto])[0],bouquetPhoto);
});
test('pinch scales from the gesture origin and constrains element size',()=>{
 const item={width:40,height:20,rotation:0};
 assert.deepEqual(pinchElement(item,1.5,20),{width:60,height:30,rotation:20});
 assert.equal(pinchElement(item,10,0).width,150);
});
test('undo and redo restore transforms and new edits clear redo',()=>{
  let h=createHistory({...createCard('Classic'),background:'#faf9f6'});
  h=changeCard(h,{...h.present,background:'#20201c'});
  h=undoCard(h); assert.equal(h.present.background,'#faf9f6');
  h=redoCard(h); assert.equal(h.present.background,'#20201c');
  h=undoCard(h); h=changeCard(h,{...h.present,size:'Square'});
  assert.equal(h.future.length,0); assert.equal(h.present.size,'Square');
});
test('new stationery templates do not overwrite legacy artwork when undone',()=>{
 const legacy={template:'Classic',size:'Card',background:'#f7d9de',texture:true,elements:[{id:'old-text',type:'text',content:'Saved words',font:'Great Vibes',color:'#563e3a',x:12,y:30,width:70,height:16,rotation:8,fontSize:30,align:'center'}]};
 const original=structuredClone(legacy);
 const themed=createCard('Classic');
 assert.equal(themed.background,'#FFFFFF');
 assert.equal(themed.elements[0].font,'Playfair Display');
 const history=changeCard(createHistory(legacy),themed);
 assert.deepEqual(undoCard(history).present,original);
 assert.deepEqual(legacy,original);
});
