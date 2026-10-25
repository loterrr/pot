import {Vector3} from 'three';

export function projectCardTag(anchor,worldMatrix,camera,width,height){
 const point=anchor.clone().applyMatrix4(worldMatrix);
 const normal=new Vector3(0,0,1).transformDirection(worldMatrix);
 const facing=normal.dot(camera.position.clone().sub(point));
 const screen=local=>{const value=local.applyMatrix4(worldMatrix).project(camera);return {x:(value.x+1)*width/2,y:(1-value.y)*height/2,z:value.z};};
 const center=screen(anchor.clone()),angle=8*Math.PI/180;
 const right=screen(anchor.clone().add(new Vector3(1.5*Math.cos(angle),1.5*Math.sin(angle),0)));
 const down=screen(anchor.clone().add(new Vector3(1.15*Math.sin(angle),-1.15*Math.cos(angle),0)));
 return {x:center.x,y:center.y,a:(right.x-center.x)/84,b:(right.y-center.y)/84,c:(down.x-center.x)/66,d:(down.y-center.y)/66,visible:facing>0&&center.z>-1&&center.z<1};
}
