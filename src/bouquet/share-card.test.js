import test from 'node:test';
import assert from 'node:assert/strict';
import {cardAspects,cardFilename,cardHasContent,cardImageSize,messageCardFilename} from './share-card.js';

test('card exports keep the designed aspect ratio at 2160px wide',()=>{
  assert.deepEqual(cardImageSize({size:'Card'}),{width:2160,height:2700});
  assert.deepEqual(cardImageSize({size:'Square'}),{width:2160,height:2160});
  assert.deepEqual(cardImageSize({size:'Story'}),{width:2160,height:3840});
  assert.deepEqual(cardImageSize(),{width:2160,height:2700});
  assert.deepEqual(cardAspects,{Card:4/5,Square:1,Story:9/16});
});

test('card filenames are dated and distinguish the designed size',()=>{
  const date=new Date('2026-10-25T12:00:00Z');
  assert.equal(cardFilename(date,{size:'Card'}),'flower4you-card-2026-10-25.png');
  assert.equal(cardFilename(date,{size:'Square'}),'flower4you-card-2026-10-25-square.png');
  assert.equal(cardFilename(date,{size:'Story'}),'flower4you-card-2026-10-25-story.png');
  assert.equal(messageCardFilename(date),'flower4you-card-2026-10-25.png');
});

test('only a designed card or real message counts as card content',()=>{
  assert.equal(cardHasContent({card:{size:'Card'},text:''}),true);
  assert.equal(cardHasContent({card:null,text:'A little note'}),true);
  assert.equal(cardHasContent({card:null,text:'   '}),false);
  assert.equal(cardHasContent({}),false);
  assert.equal(cardHasContent(null),false);
});
