import * as THREE from 'three';
import {buildFlower,cloneModel,loadModel,disposeModel} from './bouquet-models.js';
import {wraps} from './catalog.js';
import {applyWrapMaterials} from './model-materials.js';
const cache=new Map();let renderer,queue=Promise.resolve();
export async function buildThumbnailModel(type){
 const config=type.group==='wrap'?wraps.find(w=>w.key===type.key.replace(/^wrap-/,'')):null;
 const model=config?cloneModel(await loadModel(config)):await buildFlower(type);
 if(config)applyWrapMaterials(model,config,{paper:0,accent:0});
 return model;
}
async function renderThumbnail(type){
 renderer??=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});renderer.setSize(240,240);renderer.setPixelRatio(1);
 const model=await buildThumbnailModel(type);
 try{
  const scene=new THREE.Scene();scene.add(model);scene.add(new THREE.HemisphereLight(0xffffff,0xd5e2f0,2));const light=new THREE.DirectionalLight(0xffffff,2);light.position.set(3,5,6);scene.add(light);
  const box=new THREE.Box3().setFromObject(model),center=box.getCenter(new THREE.Vector3()),radius=box.getBoundingSphere(new THREE.Sphere()).radius;
  const camera=new THREE.PerspectiveCamera(30,1,.01,Math.max(100,radius*30));const distance=radius/Math.sin(Math.PI/12)*1.08;camera.position.set(center.x,center.y+radius*.25,center.z+distance);camera.lookAt(center);renderer.setClearColor(0xffffff,0);renderer.render(scene,camera);
  return renderer.domElement.toDataURL('image/png');
 }finally{disposeModel(model);}
}
export function flowerThumbnail(type){
 const key=type.key+':'+(type.petalColor||'');
 if(!cache.has(key)){
  if(cache.size>=96)cache.delete(cache.keys().next().value);
  const task=queue.catch(()=>{}).then(()=>renderThumbnail(type));queue=task;cache.set(key,task.catch(error=>{cache.delete(key);throw error;}));
 }
 return cache.get(key);
}
