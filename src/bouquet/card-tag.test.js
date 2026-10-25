import test from 'node:test';
import assert from 'node:assert/strict';
import {PerspectiveCamera,Matrix4,Vector3} from 'three';
import {projectCardTag} from './card-tag.js';

function camera(z=10){const value=new PerspectiveCamera(42,1,.1,100);value.position.set(0,0,z);value.lookAt(0,0,0);value.updateMatrixWorld();return value;}
test('the card is projected from its bouquet anchor and grows when zooming',()=>{
 const anchor=new Vector3(0,-.5,.5),transform=new Matrix4();
 const normal=projectCardTag(anchor,transform,camera(),600,600);
 const zoom=projectCardTag(anchor,transform,camera(5),600,600);
 assert.equal(normal.visible,true);assert.ok(zoom.a>normal.a);assert.ok(zoom.y>normal.y);
 const moved=projectCardTag(anchor,new Matrix4().makeTranslation(1,0,0),camera(),600,600);
 assert.ok(moved.x>normal.x);
});
test('the card follows rotation and hides behind the bouquet',()=>{
 const anchor=new Vector3(0,-.5,.5);
 const front=projectCardTag(anchor,new Matrix4(),camera(),600,600);
 const turned=projectCardTag(anchor,new Matrix4().makeRotationY(.6),camera(),600,600);
 assert.notEqual(turned.x,front.x);
 assert.equal(projectCardTag(anchor,new Matrix4().makeRotationY(Math.PI),camera(),600,600).visible,false);
});
