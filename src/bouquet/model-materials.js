import * as THREE from 'three';

const safeColor=value=>typeof value==='string'&&/^#[\da-f]{6}$/i.test(value)?value:null;
const materials=mesh=>Array.isArray(mesh.material)?mesh.material:[mesh.material];

export function applyPetalColor(root,type){
 if(type.kind==='leaf')return;
 const override=safeColor(type.petalColor);
 root.traverse(mesh=>{
  if(!mesh.isMesh||mesh.userData.role==='foliage'||mesh.userData.role==='center')return;
  for(const material of materials(mesh)){
   if(!material.color)continue;
   const name=(mesh.name+' '+material.name).toLowerCase();
   if(/stem|leaf|leaves|foliage|sepal|pollen|stamen/.test(name))continue;
   if(!override&&!material.userData.petalDefault)continue;
   material.userData.petalDefault??=material.color.clone();
   if(!material.map){
    const base=material.userData.petalDefault;
    if(mesh.userData.role!=='petal'&&base.g>base.r*1.08&&base.g>base.b*1.08)continue;
    material.color.copy(override?new THREE.Color(override):base);
    continue;
   }
   if(!material.userData.petalUniforms){
    const uniforms={posyPetalColor:{value:new THREE.Color(override||type.color||0xffffff)},posyPetalEnabled:{value:override?1:0},posyPreserveYellow:{value:type.group==='Sunflower'?0:1}};
    // shortcut: Texture hues identify petals and foliage, replace with authored masks if unusual greens or golden petals need correction.
    material.userData.petalUniforms=uniforms;
    material.onBeforeCompile=shader=>{
     Object.assign(shader.uniforms,uniforms);
     shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nuniform vec3 posyPetalColor;\nuniform float posyPetalEnabled;\nuniform float posyPreserveYellow;').replace('#include <map_fragment>',`#include <map_fragment>
      #ifdef USE_MAP
       vec3 posyOriginal=diffuseColor.rgb;
       float posyGreen=smoothstep(0.0,0.07,(posyOriginal.g-max(posyOriginal.r,posyOriginal.b))/max(max(posyOriginal.r,posyOriginal.g),max(posyOriginal.b,0.001)));
       float posyYellow=smoothstep(0.08,0.25,min(posyOriginal.r,posyOriginal.g)-posyOriginal.b)*(1.0-smoothstep(0.0,0.12,abs(posyOriginal.r-posyOriginal.g)));
       float posyLight=dot(posyOriginal,vec3(0.2126,0.7152,0.0722));
       float posyPetalMask=(1.0-posyGreen)*(1.0-posyYellow*posyPreserveYellow)*smoothstep(0.015,0.08,posyLight)*posyPetalEnabled;
       diffuseColor.rgb=mix(posyOriginal,posyPetalColor*clamp(sqrt(posyLight)*1.35,0.15,1.15),posyPetalMask);
      #endif`);
    };
    material.customProgramCacheKey=()=> 'posy-petal-mask-v1';material.needsUpdate=true;
   }
   material.userData.petalUniforms.posyPetalColor.value.set(override||type.color||0xffffff);
   material.userData.petalUniforms.posyPetalEnabled.value=override?1:0;
  }
 });
}

function legacyDots(material,shader){
    shader.uniforms.uDot={value:new THREE.Color('#20201c')};
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWPos;\nvarying vec3 vWN;').replace('#include <beginnormal_vertex>','#include <beginnormal_vertex>\nvWN = mat3(modelMatrix) * objectNormal;').replace('#include <begin_vertex>','#include <begin_vertex>\nvWPos = (modelMatrix * vec4(transformed,1.0)).xyz;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vWPos;\nvarying vec3 vWN;\nuniform vec3 uDot;').replace('#include <color_fragment>','#include <color_fragment>\n{ vec3 an=abs(normalize(vWN)); vec2 uv=(an.x>=an.y && an.x>=an.z)?vWPos.yz:((an.y>=an.z)?vWPos.xz:vWPos.xy); vec2 f=abs(fract(uv*3.0)-0.5); if(length(f)<0.15) diffuseColor.rgb=uDot; }');
}

function surfacePattern(material,pattern,legacyPolka=false){
 const selected=['polka','stripe'].includes(pattern)?pattern:'plain';
 if(material.userData.pattern===selected)return;
 material.userData.pattern=selected;
 material.onBeforeCompile=shader=>{
  if(selected==='plain')return;
  if(legacyPolka){legacyDots(material,shader);return;}
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 posySurface;').replace('#include <begin_vertex>','#include <begin_vertex>\nposySurface=position;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 posySurface;').replace('#include <color_fragment>',`#include <color_fragment>
   vec2 posyUV=vec2(atan(posySurface.z,posySurface.x)*1.5,posySurface.y*2.5);
   float posyInk=${selected==='polka'?'1.0-step(0.18,length(fract(posyUV)-0.5))':'step(0.66,fract(posyUV.x+posyUV.y*0.22))'};
   diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*0.42,posyInk*0.65);`);
 };
 material.customProgramCacheKey=()=> legacyPolka?'posy-polka':'posy-surface-'+selected;material.needsUpdate=true;
}

export function applyWrapMaterials(root,config,draft){
 root.traverse(mesh=>{
  if(!mesh.isMesh)return;
  for(const material of materials(mesh)){
   const name=(material.name+' '+mesh.name).toLowerCase();
   const index=config.colorGroups.findIndex(group=>group.parts.some(part=>name.includes(part)));
   if(index<0)continue;
   const group=config.colorGroups[index],options=group.options.filter(option=>!option.hidden),option=options[index===0?draft.paper:draft.accent]||options[0];
   if(index===0&&config.key==='glass')continue;
   const override=safeColor(index===0?draft.surfaceColor:draft.ribbonColor);
   material.color.set(override||option.color);material.roughness=group.roughness;material.metalness=group.metalness||0;
   surfacePattern(material,index===0?(draft.surfacePattern??option.pattern):'plain',!config.proceduralModel&&index===0&&option.pattern==='polka'&&!draft.surfacePattern);
  }
 });
}
