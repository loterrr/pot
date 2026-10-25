import {Box3,Vector2,Vector3} from 'three';
import {cameraFrame} from './scene-layout.js';
import {gifSettings} from './gif-settings.js';

export function captureRotationFrame(current,angle,background){
 const {renderer,camera,scene,root,controls}=current;
 const size=renderer.getSize(new Vector2()),ratio=renderer.getPixelRatio(),aspect=camera.aspect;
 const position=camera.position.clone(),quaternion=camera.quaternion.clone();
 const output=current.gifCanvas??=document.createElement('canvas');
 if(output.width!==gifSettings.size||output.height!==gifSettings.size)output.width=output.height=gifSettings.size;
 const context=output.getContext('2d',{willReadFrequently:true});
 if(!context)throw new Error('This browser could not create the GIF frames.');
 const frame=cameraFrame(new Box3().setFromObject(root),1),target=new Vector3(frame.target.x,frame.target.y,frame.target.z);
 try{
  const direction=(current.gifView?.position||position).clone().sub(current.gifView?.target||controls.target).normalize().multiplyScalar(frame.distance);
  direction.applyAxisAngle(new Vector3(0,1,0),angle);
  camera.position.copy(target).add(direction);camera.lookAt(target);camera.aspect=1;camera.updateProjectionMatrix();
  renderer.setPixelRatio(1);renderer.setSize(gifSettings.size,gifSettings.size,false);renderer.render(scene,camera);
  context.fillStyle=background;context.fillRect(0,0,output.width,output.height);
  context.drawImage(renderer.domElement,0,0);
  return context.getImageData(0,0,output.width,output.height).data;
 }finally{
  camera.position.copy(position);camera.quaternion.copy(quaternion);camera.aspect=aspect;camera.updateProjectionMatrix();
  renderer.setPixelRatio(ratio);renderer.setSize(size.x,size.y,false);
  renderer.render(scene,camera);
 }
}
