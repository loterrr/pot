import test from 'node:test';
import assert from 'node:assert/strict';
import {createDraft,updateDraft,arrange} from './draft.js';
import {createCard,element} from '../message/card.js';
import {encodeShareLink,decodeShareLink,shareState} from './share-link.js';

function sampleDraft(){
  let draft={...createDraft(),step:2,quantities:{rose:8,eucalyptus:6,tulip_pink:6},stems:[]};
  draft=updateDraft(draft,{type:'arrange'}).draft;
  draft=updateDraft(draft,{type:'message',value:{
    text:'A little note for you, because ordinary days deserve flowers.',
    words:'For you',
    date:'2026-10-25',
    color:'#B0554F',
    font:'Script',
    textSize:120,
    song:'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    card:{...createCard('Love note'),photos:[new Blob(['photo'],{type:'image/png'})],elements:[...createCard('Love note').elements,{...element('photo','0',10,10),frame:'polaroid'}]},
  }}).draft;
  return draft;
}

test('a bouquet link carries the arrangement, wrapping and words',async()=>{
  const draft=sampleDraft();
  const link=await encodeShareLink(draft,'https://example.test/flowers/');
  assert.ok(link.startsWith('https://example.test/flowers/#b='));
  const data=link.split('#b=')[1];
  assert.match(data,/^[A-Za-z0-9_-]+$/);

  const decoded=await decodeShareLink(link);
  assert.equal(decoded.wrap,draft.wrap);
  assert.equal(decoded.size,draft.size);
  assert.equal(decoded.paper,draft.paper);
  assert.equal(decoded.accent,draft.accent);
  assert.equal(decoded.spread,draft.spread);
  assert.equal(decoded.seed,draft.seed);
  assert.equal(decoded.backdrop,draft.backdrop);
  assert.deepEqual(decoded.quantities,draft.quantities);
  assert.equal(decoded.stems.length,draft.stems.length);
  assert.equal(decoded.stems[0].key,draft.stems[0].key);
  assert.ok(Math.abs(decoded.stems[0].x-draft.stems[0].x)<.001);
  assert.ok(Math.abs(decoded.stems[0].height-draft.stems[0].height)<.01);
  assert.equal(decoded.message.text,draft.message.text);
  assert.equal(decoded.message.words,draft.message.words);
  assert.equal(decoded.message.date,draft.message.date);
  assert.equal(decoded.message.font,'Script');
  assert.equal(decoded.message.textSize,120);
  assert.equal(decoded.message.song,draft.message.song);
  assert.equal(decoded.message.card.template,'Love note');
  assert.equal(decoded.message.card.elements.some(item=>item.type==='photo'),false);
});

test('a bouquet link leaves local media behind',async()=>{
  const draft=sampleDraft();
  draft.message.photos=[new Blob(['memory'],{type:'image/png'})];
  draft.message.voice=new Blob(['voice'],{type:'audio/webm'});
  draft.message.backdrop=new Blob(['backdrop'],{type:'image/png'});
  draft.shelfId='shelf-1';
  draft.title='For Nic';

  const decoded=await decodeShareLink(await encodeShareLink(draft,'https://example.test/'));
  assert.deepEqual(decoded.message.photos,[]);
  assert.equal(decoded.message.voice,null);
  assert.equal(decoded.message.backdrop,null);
  assert.equal(decoded.shelfId,null);
  assert.equal(decoded.title,'');
  assert.deepEqual(decoded.message.card.photos,[]);
});

test('damaged or oversized links are rejected instead of rendered',async()=>{
  assert.equal(await decodeShareLink(''),null);
  assert.equal(await decodeShareLink('#'),null);
  assert.equal(await decodeShareLink('#b='),null);
  assert.equal(await decodeShareLink('#b=nonsense'),null);
  assert.equal(await decodeShareLink('#b=z'+'A'.repeat(200000)),null);
  assert.equal(await decodeShareLink('#other=1'),null);
});

test('a shared link cannot smuggle unsafe layout or styles',async()=>{
  const state={
    v:1,
    wrap:'evil',size:99,spread:9,autoSpread:'yes',seed:'x',paper:-4,accent:99,
    backdrop:'url(https://evil.test/pixel)',
    quantities:{not_a_flower:9,rose:3},
    stems:[['not_a_flower',0,0,0,1],['rose',9,9,9999,9]],
    message:{
      text:'x'.repeat(400),words:'w'.repeat(400),date:'not-a-date',color:'red;background:url(x)',font:'Comic Sans',textSize:9999,
      song:'javascript:alert(1)',
      card:{size:'Huge',background:'url(https://evil.test/pixel)',texture:true,elements:[
        {type:'photo',content:'0'},
        {type:'text',content:'hi',x:9999,y:-9999,width:9999,height:-5,rotation:9999,fontSize:9999,font:'Comic Sans',color:'url(x)',align:'justify'},
      ]},
    },
  };
  const draft=await decodeShareLink('#b=r'+Buffer.from(JSON.stringify(state)).toString('base64url'));
  assert.equal(draft.wrap,'segment');
  assert.equal(draft.size,20);
  assert.equal(draft.spread,2.4);
  assert.equal(draft.autoSpread,false);
  assert.equal(draft.seed,42);
  assert.equal(draft.paper,0);
  assert.equal(draft.backdrop,'auto');
  assert.deepEqual(draft.quantities,{rose:3});
  assert.equal(draft.stems.length,1);
  assert.equal(draft.stems[0].key,'rose');
  assert.ok(Math.abs(draft.stems[0].x)<=.85);
  assert.equal(draft.message.text.length,70);
  assert.equal(draft.message.date,'');
  assert.equal(draft.message.color,'#20201c');
  assert.equal(draft.message.font,'Classic');
  assert.equal(draft.message.textSize,180);
  assert.equal(draft.message.song,'');
  assert.equal(draft.message.card.size,'Card');
  assert.equal(draft.message.card.background,'#FFFFFF');
  assert.equal(draft.message.card.elements.length,1);
  const [text]=draft.message.card.elements;
  assert.equal(text.x,200);
  assert.equal(text.y,-100);
  assert.equal(text.width,200);
  assert.equal(text.height,2);
  assert.equal(text.rotation,360);
  assert.equal(text.fontSize,100);
  assert.equal(text.font,'Playfair Display');
  assert.equal(text.color,'#2C384E');
  assert.equal(text.align,'center');
});

test('the shared payload stays inside a practical link length',async()=>{
  const draft=sampleDraft();
  const link=await encodeShareLink(draft,'https://example.test/');
  assert.ok(link.length<4000,`link was ${link.length} characters`);
  const state=shareState(draft);
  assert.equal(state.message.card.photos,undefined);
  assert.equal(arrange(draft).length,20);
});

test('prototype names cannot be decoded as flowers',async()=>{
  const state=JSON.parse('{"v":1,"quantities":{"__proto__":2,"constructor":2,"rose":1}}');
  const decoded=await decodeShareLink('#b=r'+Buffer.from(JSON.stringify(state)).toString('base64url'));
  assert.deepEqual(decoded.quantities,{rose:1});
});

test('compressed expansion is bounded before parsing',async()=>{
  const payload=JSON.stringify({v:1,message:{text:'x'.repeat(300000)}});
  const stream=new Blob([payload]).stream().pipeThrough(new CompressionStream('deflate-raw'));
  const bytes=Buffer.from(await new Response(stream).arrayBuffer());
  assert.equal(await decodeShareLink('#b=z'+bytes.toString('base64url')),null);
});

test('unsupported compression uses the portable raw encoding',async()=>{
  const original=globalThis.CompressionStream;
  globalThis.CompressionStream=class {constructor(){throw new TypeError('unsupported format');}};
  try{
    const link=await encodeShareLink(sampleDraft(),'https://example.test/');
    assert.ok(link.includes('#b=r'));
    assert.equal((await decodeShareLink(link)).message.words,'For you');
  }finally{globalThis.CompressionStream=original;}
});

test('photo-only cards leave a plain message available to the receiver',async()=>{
  const draft=sampleDraft();
  draft.message.card.elements=[element('photo','0')];
  const decoded=await decodeShareLink(await encodeShareLink(draft));
  assert.equal(decoded.message.card,null);
  assert.equal(decoded.message.text,draft.message.text);
});


test('forty stems and custom wrap materials survive the share link without unsafe values',async()=>{
 const draft=updateDraft({...createDraft(),size:40,ribbonColor:'#123456',surfaceColor:'#AABBCC',surfacePattern:'stripe'},{type:'surprise'}).draft;
 const decoded=await decodeShareLink(await encodeShareLink(draft,'https://example.test/'));
 assert.equal(decoded.size,40);assert.equal(decoded.stems.length,40);assert.equal(decoded.ribbonColor,'#123456');assert.equal(decoded.surfaceColor,'#AABBCC');assert.equal(decoded.surfacePattern,'stripe');
 const {hydrateSharedState}=await import('./share-link.js');const payload=shareState(draft);payload.ribbonColor='url(bad)';payload.surfaceColor='red;';payload.surfacePattern='<img>';
 const safe=hydrateSharedState(payload);assert.equal(safe.ribbonColor,null);assert.equal(safe.surfaceColor,null);assert.equal(safe.surfacePattern,null);
});


test('every curated color and ribbon-free vase survives a recipient link',async()=>{
 const {flowers,wraps}=await import('./catalog.js');
 for(const flower of flowers){
  const draft=updateDraft({...createDraft(),size:1},{type:'add',key:flower.key}).draft;
  const opened=await decodeShareLink(await encodeShareLink(draft,'https://example.test/'));
  assert.equal(opened.stems[0].key,flower.key);
 }
 for(const wrap of wraps){
  const draft={...createDraft(),size:16,wrap:wrap.key,surfaceColor:'#AABBCC',surfacePattern:'stripe',paper:9,ribbonColor:'#123456'};
  const opened=await decodeShareLink(await encodeShareLink(draft,'https://example.test/'));
  assert.equal(opened.wrap,wrap.key);assert.equal(opened.size,16);assert.equal(opened.paper,9);assert.equal(opened.surfaceColor,'#AABBCC');assert.equal(opened.surfacePattern,'stripe');
 }
});


test('retired lily colors remain readable in existing bouquet links',async()=>{
 const old=updateDraft(createDraft(),{type:'add',key:'lily_peach'}).draft;
 const opened=await decodeShareLink(await encodeShareLink(old,'https://example.test/'));
 assert.equal(opened.stems[0].key,'lily_peach');assert.equal(opened.quantities.lily_peach,1);
});
