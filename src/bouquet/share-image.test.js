import test from 'node:test';
import assert from 'node:assert/strict';
import {fitRect,wrapLines,readableInk,shareFilename,imageFormats,imageLayout} from './share-image.js';

test('share image fits a snapshot inside its frame without distortion',()=>{
  const rect=fitRect(1200,800,1080,940,40);
  assert.equal(Math.round(rect.width/rect.height*100),150);
  assert.ok(rect.width<=1000);assert.ok(rect.height<=860);
  assert.equal(Math.round(rect.x*2+rect.width),1080);
  const tall=fitRect(600,1200,1080,940,40);
  assert.ok(tall.height<=860);assert.ok(tall.width<tall.height);
});
test('share image text wraps by character and keeps explicit line breaks',()=>{
  const measure=value=>value.length*10;
  assert.deepEqual(wrapLines('abcdef',30,measure),['abc','def']);
  assert.deepEqual(wrapLines('hello world',70,measure),['hello','world']);
  assert.deepEqual(wrapLines('ab\ncd',50,measure),['ab','cd']);
  assert.deepEqual(wrapLines('',50,measure),['']);
});
test('share image ink stays readable on pale and dark paper',()=>{
  assert.equal(readableInk('#FFFDF9'),'#2C384E');
  assert.equal(readableInk('#20201C'),'#FFFDF9');
  assert.equal(readableInk('not-a-color'),'#2C384E');
});
test('share image filename is dated and stable',()=>{
  assert.equal(shareFilename(new Date('2026-10-25T12:00:00Z')),'flower4you-2026-10-25.png');
});

test('export formats provide the expected HD canvas sizes',()=>{
  assert.deepEqual([imageFormats.portrait.width,imageFormats.portrait.height],[2160,2700]);
  assert.deepEqual([imageFormats.square.width,imageFormats.square.height],[2160,2160]);
  assert.deepEqual([imageFormats.story.width,imageFormats.story.height],[2160,3840]);
});

test('export layouts keep the scene inside the canvas',()=>{
  for(const format of Object.keys(imageFormats)){
    const layout=imageLayout(format);
    assert.ok(layout.sceneTop>=0);
    assert.ok(layout.sceneTop+layout.sceneHeight<=layout.height);
    assert.ok(layout.wordTop<layout.sceneTop);
    assert.ok(layout.brandInset>0);
  }
});

test('export filenames add a suffix only for non-portrait formats',()=>{
  const date=new Date('2026-10-25T12:00:00Z');
  assert.equal(shareFilename(date),'flower4you-2026-10-25.png');
  assert.equal(shareFilename(date,'square'),'flower4you-2026-10-25-square.png');
  assert.equal(shareFilename(date,'story'),'flower4you-2026-10-25-story.png');
});
