import test from 'node:test';
import assert from 'node:assert/strict';
import {byKey,wraps} from './catalog.js';
import {stemCount,arrange} from './draft.js';
import {occasions,createDraftFromOccasion} from './occasions.js';

test('every occasion uses valid catalog values and fills its size',()=>{
  for(const occasion of occasions){
    assert.ok(wraps.some(wrap=>wrap.key===occasion.wrap),occasion.key);
    const total=Object.values(occasion.flowers).reduce((a,b)=>a+b,0);
    assert.equal(total,occasion.size,occasion.key);
    for(const key of Object.keys(occasion.flowers))assert.ok(byKey[key],occasion.key+':'+key);
  }
});

test('occasion draft has stems, words, message and card',()=>{
  for(const occasion of occasions){
    const draft=createDraftFromOccasion(occasion);
    assert.equal(stemCount(draft),occasion.size);
    assert.equal(arrange(draft).length,occasion.size);
    assert.equal(draft.step,1);
    assert.equal(draft.wrap,occasion.wrap);
    assert.equal(draft.size,occasion.size);
    assert.equal(draft.message.words,occasion.words);
    assert.equal(draft.message.text,occasion.message);
    assert.equal(draft.message.card.template,occasion.cardTemplate);
    assert.equal(draft.shelfId,null);
    for(const [key,count] of Object.entries(occasion.flowers))assert.equal(draft.quantities[key],count,occasion.key+':'+key);
  }
});
