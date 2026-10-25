import test from 'node:test';
import assert from 'node:assert/strict';
import {cameraFrame} from './scene-layout.js';
test('camera fits tall bouquets and narrow mobile previews without clipping',()=>{
 const box={min:{x:-2,y:-4,z:-2},max:{x:2,y:7,z:2}};
 const desktop=cameraFrame(box,1.5),mobile=cameraFrame(box,.6);
 assert.equal(desktop.target.y,1.5);
 const radius=Math.sqrt(4*4+11*11+4*4)/2;
 assert.ok(desktop.distance*Math.sin(21*Math.PI/180)>radius);
 assert.ok(mobile.distance>desktop.distance);
});
