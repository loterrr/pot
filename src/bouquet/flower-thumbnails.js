import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
const cache=new Map();let renderer,queue=Promise.resolve();
async function renderThumbnail(type){
 renderer??=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});renderer.setSize(240,240);renderer.setPixelRatio(1);
 const model=(await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(type.modelPath)).scene;
 try{
  if(type.modelRot)model.rotation.set(...type.modelRot.map(value=>value*Math.PI/180));
  const scene=new THREE.Scene();scene.add(model);scene.add(new THREE.HemisphereLight(0xffffff,0xd5e2f0,2));const light=new THREE.DirectionalLight(0xffffff,2);light.position.set(3,5,6);scene.add(light);
  const box=new THREE.Box3().setFromObject(model),center=box.getCenter(new THREE.Vector3()),radius=box.getBoundingSphere(new THREE.Sphere()).radius;
  const camera=new THREE.PerspectiveCamera(30,1,.01,Math.max(100,radius*30));const distance=radius/Math.sin(Math.PI/12)*1.08;camera.position.set(center.x,center.y+radius*.25,center.z+distance);camera.lookAt(center);renderer.setClearColor(0xffffff,0);renderer.render(scene,camera);
  return renderer.domElement.toDataURL('image/png');
 }finally{
  model.traverse(object=>{
   if(!object.isMesh)return;
   object.geometry.dispose();
   for(const material of (Array.isArray(object.material)?object.material:[object.material])){
    for(const item of Object.values(material))if(item?.isTexture)item.dispose();
    material.dispose();
   }
  });
 }
}
export function flowerThumbnail(type){
 if(!cache.has(type.key)){
  const task=queue.catch(()=>{}).then(()=>renderThumbnail(type));queue=task;cache.set(type.key,task.catch(error=>{cache.delete(type.key);throw error;}));
 }
 return cache.get(type.key);
}
