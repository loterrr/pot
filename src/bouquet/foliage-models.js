import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

const up=new THREE.Vector3(0,1,0);
function twig(start,end,radius){
 const delta=end.clone().sub(start),geometry=new THREE.CylinderGeometry(radius*.7,radius,delta.length(),6,1);
 geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(up,delta.normalize()));
 geometry.translate(...start.clone().add(end).multiplyScalar(.5).toArray());return geometry;
}
function leaf(start,end,width,twist=0){
 const delta=end.clone().sub(start),length=delta.length(),geometry=new THREE.PlaneGeometry(1,1,4,8),positions=geometry.attributes.position;
 for(let i=0;i<positions.count;i++){
  const t=positions.getY(i)+.5,u=positions.getX(i)*2,edge=Math.pow(Math.sin(Math.PI*t),.7);
  positions.setXYZ(i,u*width*edge,t*length,length*.12*Math.sin(t*Math.PI)*(1-u*u));
 }
 geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(up,delta.normalize()));
 geometry.applyQuaternion(new THREE.Quaternion().setFromAxisAngle(delta,twist));geometry.translate(...start.toArray());
 geometry.computeVertexNormals();return geometry;
}
function addMerged(root,parts,color,name){
 const geometry=mergeGeometries(parts);for(const part of parts)part.dispose();
 const material=new THREE.MeshStandardMaterial({color,roughness:.8,side:THREE.DoubleSide}),mesh=new THREE.Mesh(geometry,material);
 mesh.name=name;mesh.userData.role='foliage';root.add(mesh);
}
export function createFoliage(type){
 if(!['fern','ruscus'].includes(type.proceduralFoliage))throw new Error('Unknown foliage model.');
 const root=new THREE.Group(),stems=[],leaves=[],origin=new THREE.Vector3(),top=new THREE.Vector3(.12,3.4,.06);
 stems.push(twig(origin,top,.025));
 if(type.proceduralFoliage==='fern'){
  for(let i=0;i<18;i++)for(const side of [-1,1]){
   const t=i/18,start=new THREE.Vector3(.025+t*.08,.9+t*2.35,t*.04),reach=.68*Math.sin((t*.88+.1)*Math.PI);
   const end=start.clone().add(new THREE.Vector3(side*reach,.14+reach*.25,Math.sin(i*.8)*.1));
   stems.push(twig(start,end,.007));leaves.push(leaf(start,end,.05+reach*.07,side*.18));
  }
  leaves.push(leaf(new THREE.Vector3(.1,3.1,.05),top,.075));
 }else{
  for(let i=0;i<11;i++){
   const side=i%2?1:-1,angle=i*1.8,start=new THREE.Vector3(.02+i*.008,.7+i*.22,0);
   const joint=start.clone().add(new THREE.Vector3(side*.25,.16,Math.sin(angle)*.12));
   const end=joint.clone().add(new THREE.Vector3(side*(.22+(i%3)*.035),.35,Math.sin(angle)*.12));
   stems.push(twig(start,joint,.012));leaves.push(leaf(joint,end,.14+(i%3)*.012,Math.sin(angle)*.35));
  }
  leaves.push(leaf(new THREE.Vector3(.1,3.05,.04),top,.15));
 }
 addMerged(root,stems,new THREE.Color(type.color).multiplyScalar(.65),'foliage_stems');
 addMerged(root,leaves,type.color,'foliage_leaves');return root;
}
