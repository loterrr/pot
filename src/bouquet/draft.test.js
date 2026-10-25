import test from 'node:test';
import assert from 'node:assert/strict';
import { createDraft, updateDraft, stemCount, arrange, pairingMatches, hydrateDraft } from './draft.js';

test('capacity and smaller size never discard selected stems', () => {
  let draft = createDraft();
  for (let i=0;i<20;i++) draft=updateDraft(draft,{type:'add',key:'rose'}).draft;
  assert.equal(stemCount(draft),20);
  const full=updateDraft(draft,{type:'add',key:'rose'});
  assert.ok(full.error); assert.equal(stemCount(full.draft),20);
  const smaller=updateDraft(draft,{type:'size',value:10});
  assert.ok(smaller.error); assert.equal(smaller.draft.size,20);
});
test('zero subtraction, clear, steps and variants preserve valid state',()=>{
  let d=createDraft(); d=updateDraft(d,{type:'remove',key:'rose'}).draft;
  assert.equal(stemCount(d),0);
  d=updateDraft(d,{type:'add',key:'white_rose'}).draft;
  d=updateDraft(d,{type:'patch',value:{step:2}}).draft;
  assert.equal(d.quantities.white_rose,1);
  assert.equal(stemCount(updateDraft(d,{type:'clear'}).draft),0);
});
test('surprise respects every selected capacity',()=>{
  for(const size of [10,16,20]) {
    const d=updateDraft({...createDraft(),size},{type:'surprise'}).draft;
    assert.equal(stemCount(d),size);
    assert.ok(Object.keys(d.selected).length>0);
  }
});
test('arrangement is reproducible and changes with seed',()=>{
  const d={...createDraft(),quantities:{rose:3,white_rose:2}};
  assert.deepEqual(arrange(d),arrange(structuredClone(d)));
  assert.notDeepEqual(arrange(d),arrange({...d,seed:d.seed+1}));
  assert.equal(arrange(d).length,5);
  assert.deepEqual(pairingMatches({...d,quantities:{rose:1,white_rose:1}}).map(p=>p.name),['True Love']);
});
test('adding a flower creates a persistent stem placement',()=>{
 let d=createDraft();
 d=updateDraft(d,{type:'add',key:'rose'}).draft;
 assert.equal(d.stems.length,1);
 assert.equal(d.stems[0].key,'rose');
 assert.equal(typeof d.stems[0].id,'string');
 assert.deepEqual(arrange(d),d.stems);
 const first=structuredClone(d.stems[0]);
 d=updateDraft(d,{type:'add',key:'tulip_pink'}).draft;
 assert.deepEqual(d.stems[0],first);
 assert.equal(d.stems.length,2);
});
test('stem adjustments clamp values and leave other stems alone',()=>{
 let d=createDraft();
 d=updateDraft(d,{type:'add',key:'rose'}).draft;
 d=updateDraft(d,{type:'add',key:'tulip_pink'}).draft;
 const [first,second]=d.stems.map(s=>s.id);
 const untouched=structuredClone(d.stems[1]);
 d=updateDraft(d,{type:'stem',id:first,value:{height:9,x:2,z:-2,spin:725}}).draft;
 const changed=d.stems.find(s=>s.id===first);
 assert.equal(changed.height,1.5);
 assert.ok(Math.hypot(changed.x,changed.z)<=.850001);
 assert.equal(changed.spin,5);
 assert.deepEqual(d.stems.find(s=>s.id===second),untouched);
});
test('removing a stem removes only that flower and keeps the rest',()=>{
 let d=createDraft();
 for(const key of ['rose','tulip_pink','rose']) d=updateDraft(d,{type:'add',key}).draft;
 const removed=d.stems[1], remaining=d.stems.filter(s=>s.id!==removed.id).map(s=>structuredClone(s));
 d=updateDraft(d,{type:'removeStem',id:removed.id}).draft;
 assert.equal(stemCount(d),2);
 assert.equal(d.quantities.tulip_pink,0);
 assert.deepEqual(d.stems,remaining);
});
test('surprise and arrange keep one stem per flower',()=>{
 let d=updateDraft(createDraft(),{type:'surprise'}).draft;
 assert.equal(d.stems.length,stemCount(d));
 const before=d.stems.map(s=>s.id);
 d=updateDraft(d,{type:'arrange'}).draft;
 assert.equal(d.stems.length,stemCount(d));
 assert.notDeepEqual(d.stems.map(s=>s.id),before);
});
test('asynchronous image completion appends against current state and rechecks capacity',()=>{
 let d=createDraft();d=updateDraft(d,{type:'appendPhotos',photos:['first','second']}).draft;
 d=updateDraft(d,{type:'appendPhotos',photos:['third','fourth']}).draft;
 assert.deepEqual(d.message.photos,['first','second','third','fourth']);
 const overflow=updateDraft(d,{type:'appendPhotos',photos:['fifth']});
 assert.ok(overflow.error);assert.equal(overflow.draft.message.photos.length,4);
});

test('draft hydration preserves shelf link and fills new defaults',()=>{
  const saved={version:1,message:{text:'hello'},shelfId:'shelf-1',title:'Birthday'};
  const draft=hydrateDraft(saved);
  assert.equal(draft.shelfId,'shelf-1');
  assert.equal(draft.title,'Birthday');
  assert.equal(draft.message.text,'hello');
  assert.equal(draft.message.words,'');
  assert.equal(draft.step,0);
});
