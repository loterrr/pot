import test from 'node:test';
import assert from 'node:assert/strict';
import {createDraft} from './bouquet/draft.js';
import {hasBouquetContent,suggestShelfName,upsertShelfItem,removeShelfItem,shelfItemFromDraft} from './shelf.js';

test('shelf detects content and suggests a readable name',()=>{
  const blank=createDraft();
  assert.equal(hasBouquetContent(blank),false);
  assert.equal(suggestShelfName(blank),'My bouquet');
  const filled={...blank,quantities:{rose:2},message:{...blank.message,words:'for you'}};
  assert.equal(hasBouquetContent(filled),true);
  assert.equal(suggestShelfName(filled),'for you');
});

test('shelf items update in place and delete by id',()=>{
  const one={id:'a',name:'One',updatedAt:1,stemCount:2,size:10,thumbnail:null};
  const two={id:'b',name:'Two',updatedAt:2,stemCount:3,size:16,thumbnail:null};
  const updated={...one,name:'One again',updatedAt:3};
  assert.deepEqual(upsertShelfItem([one,two],updated).map(item=>item.name),['One again','Two']);
  assert.deepEqual(removeShelfItem([one,two],'a').map(item=>item.id),['b']);
});

test('shelf item is derived from the draft without media',()=>{
  const draft={...createDraft(),title:'Birthday',quantities:{rose:2,tulip_pink:1},size:10};
  const item=shelfItemFromDraft(draft,{id:'x',name:'Birthday',thumbnail:'data:image/png;base64,abc',now:123});
  assert.deepEqual(item,{id:'x',name:'Birthday',updatedAt:123,stemCount:3,size:10,thumbnail:'data:image/png;base64,abc'});
});
