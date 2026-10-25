export function cameraFrame(box,aspect){
 const target={x:(box.min.x+box.max.x)/2,y:(box.min.y+box.max.y)/2,z:(box.min.z+box.max.z)/2};
 const radius=Math.hypot(box.max.x-box.min.x,box.max.y-box.min.y,box.max.z-box.min.z)/2;
 const halfFov=Math.atan(Math.tan(21*Math.PI/180)*Math.min(1,Math.max(.1,aspect)));
 return {target,distance:Math.max(8,radius/Math.sin(halfFov)*1.08)};
}
