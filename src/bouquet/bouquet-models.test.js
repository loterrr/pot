import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {byKey,flowers,wraps,groups} from './catalog.js';

test('curated colors retain existing species and GLBs, including six additional lilies',()=>{
 for(const shade of ['yellow','orange','peach','coral','lavender','burgundy']){
  const lily=byKey['lily_'+shade];assert.ok(lily,shade);assert.match(lily.petalColor,/^#[\da-f]{6}$/i);assert.equal(lily.modelPath,'/flowers/lily/white.glb');
 }
 for(const flower of flowers)assert.ok(flower.modelPath||flower.proceduralFoliage);
 assert.deepEqual(wraps.map(w=>w.key),['segment','bow','glass','ceramic']);
 for(const wrap of wraps.slice(0,2)){
  assert.deepEqual(wrap.colorGroups[0].options.slice(0,2).map(o=>o.name),['White','Polka']);
  for(const color of ['Cream','Blush','Dusty rose','Lavender','Sage','Powder blue','Navy','Charcoal'])assert.ok(wrap.colorGroups[0].options.some(o=>o.name===color));
 }
});

test('vases have finite open walls and a body anchor, without ribbon meshes or accent groups',async()=>{
 const {createProceduralWrap,vesselLayout,disposeModel}=await import('./bouquet-models.js');
 for(const key of ['glass','ceramic']){
  const config=wraps.find(w=>w.key===key),vase=createProceduralWrap(config),box=new THREE.Box3().setFromObject(vase);
  assert.equal(vase.children.length,1);assert.ok(vase.getObjectByName('wrap_surface'));
  vase.traverse(object=>{assert.doesNotMatch(object.name,/ribbon|bow|belt|tail/);if(object.isMesh)assert.ok([...object.geometry.attributes.position.array].every(Number.isFinite));});
  assert.ok(config.colorGroups.every(group=>group.label!=='Accent'));
  assert.ok(box.min.y<-3&&box.max.y>.7);
  const positions=vase.children[0].geometry.attributes.position;let highCenter=false;
  for(let i=0;i<positions.count;i++)if(positions.getY(i)>.5&&Math.hypot(positions.getX(i),positions.getZ(i))<.6)highCenter=true;
  assert.equal(highCenter,false);
  const layout=vesselLayout(config,40);assert.ok(layout.clipY<-3);assert.ok(config.tag.y>box.min.y&&config.tag.y<box.max.y);
  if(key==='glass'){assert.ok(vase.children[0].material.transmission>.8);assert.equal(vase.children[0].material.depthWrite,false);assert.equal(vase.children[0].material.opacity,1);assert.equal(vase.children[0].material.transparent,false);assert.equal(vase.children[0].material.side,THREE.FrontSide);}
  disposeModel(vase);
 }
});

test('forty cloned flowers retain shared geometry after disposal and extensions converge inside glass',async()=>{
 const {cloneModel,disposeModel,extendedStem}=await import('./bouquet-models.js');
 const template=new THREE.Group(),geometry=new THREE.CylinderGeometry(.02,.02,3),material=new THREE.MeshStandardMaterial();geometry.translate(0,1.5,0);template.add(new THREE.Mesh(geometry,material));let disposed=0;geometry.addEventListener('dispose',()=>disposed++);
 for(let i=0;i<40;i++){
  const clone=cloneModel(template);clone.position.set(.4*Math.cos(i),-.4,.4*Math.sin(i));clone.rotation.z=.25;
  const extension=extendedStem({x:.8*Math.cos(i),z:.8*Math.sin(i)},clone,-3.27),box=new THREE.Box3().setFromObject(extension);
  assert.ok(box.min.y>=-3.27&&box.max.y>clone.position.y);assert.ok([...extension.children[0].geometry.attributes.position.array].every(Number.isFinite));
  assert.notEqual(clone.children[0].material,material);disposeModel(clone);disposeModel(extension);
 }
 assert.equal(disposed,0);disposeModel(template);assert.equal(disposed,1);
});

test('forty low stems pass through each vase mouth and stay finite at maximum spread',async()=>{
 const {placeStem,vesselLayout}=await import('./bouquet-models.js');
 for(const key of ['glass','ceramic']){
  const config={...wraps.find(w=>w.key===key)};config.layout=vesselLayout(config,40);
  for(let i=0;i<40;i++){
   const stem={x:.85*Math.cos(i),z:.85*Math.sin(i),height:-.5,spin:i*9},flower=new THREE.Group();placeStem(flower,stem,2.4,config);
   assert.ok([...flower.position.toArray(),...flower.quaternion.toArray()].every(Number.isFinite));
   const up=new THREE.Vector3(0,1,0).applyQuaternion(flower.quaternion),atMouth=flower.position.clone().addScaledVector(up,(.84-flower.position.y)/up.y);
   assert.ok(Math.hypot(atMouth.x,atMouth.z)<config.topR-.07,key);
  }
 }
});

test('wrap thumbnails resolve vase cache keys to ribbon-free catalog models',async()=>{
 const {buildThumbnailModel}=await import('./flower-thumbnails.js'),{disposeModel}=await import('./bouquet-models.js');
 for(const key of ['glass','ceramic']){
  const model=await buildThumbnailModel({key:'wrap-'+key,group:'wrap'});
  assert.equal(model.children.length,1);assert.ok(model.getObjectByName('wrap_surface'));disposeModel(model);
 }
});


test('lily picker includes yellow and orange while retired colors still resolve',()=>{
 const lilies=groups.find(group=>group.name==='Lily').variants;
 assert.deepEqual(lilies.map(lily=>lily.name),['White','Pink','Blue','Yellow','Orange','Lavender','Burgundy']);
 assert.equal(byKey.lily_blue.petalColor,'#6d91d8');assert.equal(byKey.lily_blue.modelPath,'/flowers/lily/white.glb');
 assert.ok(byKey.lily_peach);assert.ok(!flowers.some(flower=>flower.key==='lily_peach'));
 assert.equal(byKey.dahlia_black.name,'Black');assert.equal(byKey.dahlia_black.petalColor,'#241a22');
});


test('fern and ruscus provide two shades and load through the scene and thumbnail model path',async()=>{
 const {buildFlower,disposeModel}=await import('./bouquet-models.js');
 const silhouettes=[];
 for(const group of ['Fern','Ruscus']){
  const variants=groups.find(item=>item.name===group)?.variants;assert.equal(variants?.length,2);
  let firstCount;
  for(const type of variants){
   assert.equal(type.kind,'leaf');const model=await buildFlower(type),box=new THREE.Box3().setFromObject(model);
   assert.ok(box.max.y>2.5&&box.min.y<=0);assert.ok(box.max.x-box.min.x>.5);
   let count=0;model.traverse(mesh=>{if(mesh.isMesh){assert.equal(mesh.userData.role,'foliage');assert.ok([...mesh.geometry.attributes.position.array].every(Number.isFinite));count+=mesh.geometry.attributes.position.count;}});
   assert.ok(count<20000);firstCount??=count;disposeModel(model);
  }
  silhouettes.push(firstCount);
 }
 assert.notEqual(silhouettes[0],silhouettes[1]);
});


test('vase extensions join offset model stem ends after rotation, with matching stem color',async()=>{
 const {stemAttachment,extendedStem,disposeModel}=await import('./bouquet-models.js');
 const geometry=new THREE.CylinderGeometry(.025,.025,3,12);geometry.translate(.23,1.5,-.18);
 const material=new THREE.MeshStandardMaterial({color:'#29431b'}),flower=new THREE.Group(),source=new THREE.Group();source.add(new THREE.Mesh(geometry,material));source.scale.setScalar(1.3);flower.add(source);flower.position.set(.3,-.2,.1);flower.rotation.set(.2,.7,-.3);
 const attachment=stemAttachment(flower);
 assert.ok(attachment.base.distanceTo(new THREE.Vector3(.23*1.3,0,-.18*1.3))<.01);
 const join=attachment.join.clone().applyQuaternion(flower.quaternion).add(flower.position);
 const extension=extendedStem({x:.3,z:.2},flower,-3.27),mesh=extension.children[0],positions=mesh.geometry.attributes.position;
 let distance=Infinity;for(let i=0;i<positions.count;i++)distance=Math.min(distance,new THREE.Vector3().fromBufferAttribute(positions,i).distanceTo(join));
 assert.ok(distance<.00001,'the extension cap must touch the actual model stem');
 assert.equal(mesh.material.color.getHexString(),'29431b');
 flower.rotation.y+=1;const moved=extendedStem({x:.3,z:.2},flower,-3.27);assert.notDeepEqual(new THREE.Box3().setFromObject(moved).max,new THREE.Box3().setFromObject(extension).max);
 disposeModel(moved);disposeModel(extension);disposeModel(flower);
});
test('textured stem attachments sample the authored stem color instead of generic green',async()=>{
 const {stemAttachment,disposeModel}=await import('./bouquet-models.js');
 const geometry=new THREE.CylinderGeometry(.02,.02,2,8);geometry.translate(0,1,0);
 const texture=new THREE.DataTexture(new Uint8Array([24,48,12,255]),1,1);texture.colorSpace=THREE.SRGBColorSpace;
 const flower=new THREE.Group();flower.add(new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({map:texture})));
 assert.equal(stemAttachment(flower).color.getHexString(),'18300c');
 disposeModel(flower);texture.dispose();
});
