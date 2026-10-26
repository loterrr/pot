import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {applyPetalColor} from './model-materials.js';

const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder),templates=new Map();
const surfaceMaterial=color=>new THREE.MeshStandardMaterial({color,roughness:.76,side:THREE.DoubleSide});
function mesh(parent,geometry,material,role,name=role){const object=new THREE.Mesh(geometry,material);object.name=name;object.userData.role=role;parent.add(object);return object;}
function tubeBetween(a,b,radius=.025){const direction=new THREE.Vector3().subVectors(b,a),geometry=new THREE.CylinderGeometry(radius*.8,radius,direction.length(),7,1);geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),direction.clone().normalize()));geometry.translate(...a.clone().add(b).multiplyScalar(.5).toArray());return geometry;}

function vesselShell(key){
 const glass=key==='glass';
 const profile=glass?[[0,-3.5],[.78,-3.5],[.89,-3.35],[.89,.8],[.84,.84],[.81,.78],[.81,-3.3],[0,-3.3]]:[[0,-3.5],[.79,-3.5],[.96,-3.23],[1.05,-1.8],[.82,.7],[.76,.78],[.70,.7],[.93,-1.8],[.84,-3.2],[0,-3.2]];
 return new THREE.LatheGeometry(profile.map(([x,y])=>new THREE.Vector2(x,y)),64);
}
export function createProceduralWrap(config){
 const root=new THREE.Group(),key=config.proceduralModel;
 if(!['glass','ceramic'].includes(key))throw new Error('Unknown procedural vessel.');
 const material=key==='glass'?new THREE.MeshPhysicalMaterial({color:0xe7f4fa,roughness:.08,transmission:.94,thickness:.12,ior:1.46,transparent:true,opacity:.38,depthWrite:false,side:THREE.DoubleSide}):surfaceMaterial(0xf4eee2);
 mesh(root,vesselShell(key),material,'surface','wrap_surface');return root;
}

export function vesselLayout(config,count){
 const vessel=config.key==='glass'||config.key==='ceramic';
 return {vessel,clipY:vessel?-3.27:-1,radialScale:Math.min(1.65,Math.max(.85,Math.sqrt(Math.max(1,count)/16)))};
}
export function cloneModel(source){
 const object=source.clone(true);
 object.traverse(mesh=>{if(mesh.isMesh){mesh.userData.sharedGeometry=true;mesh.material=Array.isArray(mesh.material)?mesh.material.map(material=>material.clone()):mesh.material.clone();}});
 return object;
}
export function disposeModel(root){
 const geometries=new Set(),materials=new Set();root.traverse(mesh=>{if(!mesh.isMesh)return;if(!mesh.userData.sharedGeometry)geometries.add(mesh.geometry);for(const material of (Array.isArray(mesh.material)?mesh.material:[mesh.material]))materials.add(material);});
 for(const geometry of geometries)geometry.dispose();for(const material of materials)material.dispose();root.clear();
}
export function loadModel(type){
 const key=type.modelPath||type.path||(type.proceduralModel+':'+type.key);
 if(!templates.has(key))templates.set(key,(type.proceduralModel?Promise.resolve(createProceduralWrap(type)):loader.loadAsync(key).then(gltf=>gltf.scene)).catch(error=>{templates.delete(key);throw error;}));
 return templates.get(key);
}
export async function buildFlower(type){
 const source=cloneModel(await loadModel(type));
 if(type.modelRot)source.rotation.set(...type.modelRot.map(value=>value*Math.PI/180));
 applyPetalColor(source,type);return source;
}
export function extendedStem(stem,flower,clipY){
 const top=new THREE.Vector3(0,.45,0).applyQuaternion(flower.quaternion).add(flower.position),bottom=new THREE.Vector3(stem.x*.07,clipY+.1,stem.z*.07);
 const root=new THREE.Group();mesh(root,tubeBetween(bottom,top,.028),surfaceMaterial(0x527748),'foliage','vase_stem');return root;
}

export function placeStem(flower,stem,spread,config){
  const x=stem.x*.4*(config.layout?.radialScale??1),z=stem.z*.4*(config.layout?.radialScale??1),distance=Math.hypot(x,z),angle=Math.atan2(z,x);
  const y=(config.flowerHeight===.8?-.52:0)+(stem.height-1)*.45;
  let tilt=Math.asin(Math.max(-.9,Math.min(.9,(spread-.4)*Math.min(1,distance/.4)/2.6)));
  if(config.layout?.vessel)tilt=Math.min(tilt,Math.atan2(Math.max(.02,config.topR-.1-distance),Math.max(.1,.84-y)));
  flower.quaternion.setFromAxisAngle(new THREE.Vector3(Math.sin(angle),0,-Math.cos(angle)),tilt).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),stem.spin*Math.PI/180));
  flower.position.set(x,y,z);
  flower.userData.phase=stem.spin;flower.userData.tilt=flower.rotation.z;
}
