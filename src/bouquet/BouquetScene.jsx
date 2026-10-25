import {useEffect,useRef,useState,forwardRef,useImperativeHandle} from 'react';
import Icon from '../Icon.jsx';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {wraps,byKey,backdrops} from './catalog.js';
import {arrange,stemCount} from './draft.js';
import {cameraFrame} from './scene-layout.js';

const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
const cache=new Map();
function model(url){if(!cache.has(url))cache.set(url,loader.loadAsync(url).then(g=>g.scene).catch(error=>{cache.delete(url);throw error;}));return cache.get(url);}
function cloneModel(source){const object=source.clone(true);object.traverse(mesh=>{if(mesh.isMesh)mesh.material=Array.isArray(mesh.material)?mesh.material.map(m=>m.clone()):mesh.material.clone();});return object;}
function disposeGroup(group){group.traverse(o=>{if(o.isMesh)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose());});group.clear();}
function flowerGroup(object){let node=object;while(node){if(node.userData.flower)return node;node=node.parent;}return null;}
function placeStem(flower,stem,spread,config){
  const x=stem.x*.4,z=stem.z*.4,distance=Math.hypot(x,z),angle=Math.atan2(z,x);
  const tilt=Math.asin(Math.max(-.9,Math.min(.9,(spread-.4)*Math.min(1,distance/.4)/2.6)));
  flower.quaternion.setFromAxisAngle(new THREE.Vector3(Math.sin(angle),0,-Math.cos(angle)),tilt).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),stem.spin*Math.PI/180));
  flower.position.set(x,(config.flowerHeight===.8?-.52:0)+(stem.height-1)*.45,z);
  flower.userData.phase=stem.spin;flower.userData.tilt=flower.rotation.z;
}
function polka(material){
  material.onBeforeCompile=shader=>{
    shader.uniforms.uDot={value:new THREE.Color('#20201c')};
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWPos;\nvarying vec3 vWN;').replace('#include <beginnormal_vertex>','#include <beginnormal_vertex>\nvWN = mat3(modelMatrix) * objectNormal;').replace('#include <begin_vertex>','#include <begin_vertex>\nvWPos = (modelMatrix * vec4(transformed,1.0)).xyz;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vWPos;\nvarying vec3 vWN;\nuniform vec3 uDot;').replace('#include <color_fragment>','#include <color_fragment>\n{ vec3 an=abs(normalize(vWN)); vec2 uv=(an.x>=an.y && an.x>=an.z)?vWPos.yz:((an.y>=an.z)?vWPos.xz:vWPos.xy); vec2 f=abs(fract(uv*3.0)-0.5); if(length(f)<0.15) diffuseColor.rgb=uDot; }');
  };material.customProgramCacheKey=()=> 'posy-polka';material.needsUpdate=true;
}
const BouquetScene=forwardRef(function BouquetScene({draft,onPatch,onSelect},ref){
  const host=useRef(null),engine=useRef(null),ready=useRef(false),selectRef=useRef(onSelect),[status,setStatus]=useState('Loading your wrap…'),[retry,setRetry]=useState(0),[failed,setFailed]=useState(false),[spinning,setSpinning]=useState(false);
  useEffect(()=>{selectRef.current=onSelect;},[onSelect]);
  useImperativeHandle(ref,()=>({
    snapshot(){
      const current=engine.current;
      if(!current||!ready.current)return null;
      current.renderer.render(current.scene,current.camera);
      return current.renderer.domElement.toDataURL('image/png');
    }
  }),[]);
  useEffect(()=>{
    const el=host.current;let renderer;
    try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});}catch{setStatus('Your browser could not start the 3D preview. Try enabling hardware acceleration.');setFailed(true);return;}
    renderer.localClippingEnabled=true;renderer.setPixelRatio(Math.min(devicePixelRatio,2));el.appendChild(renderer.domElement);
    renderer.domElement.setAttribute('aria-label','Interactive 3D bouquet. Drag to rotate.');renderer.domElement.setAttribute('role','img');
    const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(42,1,.1,150),root=new THREE.Group();scene.add(root);
    scene.add(new THREE.HemisphereLight(0xffffff,0xd9c7b0,1.7));scene.add(new THREE.AmbientLight(0xffffff,.35));const light=new THREE.DirectionalLight(0xffffff,1);light.position.set(3,6,4);scene.add(light);
    const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.08;controls.maxPolarAngle=.52*Math.PI;controls.enablePan=false;controls.minDistance=5;controls.maxDistance=35;
    let currentElevation=35;
    function fit(elevation=currentElevation){currentElevation=elevation;const aspect=Math.max(.1,el.clientWidth/Math.max(el.clientHeight,1));const box=new THREE.Box3().setFromObject(root);const frame=box.isEmpty()?{target:{x:0,y:0,z:0},distance:15}:cameraFrame(box,aspect);const {distance,target}=frame;const angle=elevation*Math.PI/180;camera.position.set(target.x,target.y+distance*Math.sin(angle),target.z+distance*Math.cos(angle));controls.target.set(target.x,target.y,target.z);controls.minDistance=distance*.35;controls.maxDistance=distance*2.5;controls.update();controls.saveState();}
    const resize=()=>{renderer.setSize(el.clientWidth,el.clientHeight);camera.aspect=el.clientWidth/Math.max(el.clientHeight,1);camera.updateProjectionMatrix();fit();};const observer=new ResizeObserver(resize);observer.observe(el);resize();
    const state={scene,camera,renderer,controls,root,fit};engine.current=state;
    const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let press=null;
    const onPointerDown=event=>{press={x:event.clientX,y:event.clientY};};
    const onPointerUp=event=>{
      const start=press;press=null;
      if(!start||Math.hypot(event.clientX-start.x,event.clientY-start.y)>6||!ready.current)return;
      const rect=renderer.domElement.getBoundingClientRect();
      pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);
      raycaster.setFromCamera(pointer,camera);
      const hit=raycaster.intersectObjects(root.children,true)[0];
      selectRef.current?.(hit?flowerGroup(hit.object)?.userData.stemId??null:null);
    };
    renderer.domElement.addEventListener('pointerdown',onPointerDown);
    renderer.domElement.addEventListener('pointerup',onPointerUp);
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');let raf;
    function frame(time){raf=requestAnimationFrame(frame);controls.update();root.children.forEach(c=>{if(c.userData.flower&&!reduced.matches)c.rotation.z=c.userData.tilt+.008*Math.sin(time*.0008+c.userData.phase);});renderer.render(scene,camera);}
    raf=requestAnimationFrame(frame);
    return()=>{cancelAnimationFrame(raf);observer.disconnect();controls.dispose();renderer.domElement.removeEventListener('pointerdown',onPointerDown);renderer.domElement.removeEventListener('pointerup',onPointerUp);disposeGroup(root);renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();engine.current=null;ready.current=false;};
  },[]);
  const sceneKey=JSON.stringify([draft.wrap,draft.size,draft.paper,draft.accent,draft.spread,draft.autoSpread,draft.seed,draft.quantities,retry]);
  useEffect(()=>{
    const e=engine.current;if(!e)return;let cancelled=false;const group=new THREE.Group();ready.current=false;e.stemGroups=null;setFailed(false);setStatus('Arranging your bouquet…');
    const config=wraps.find(w=>w.key===draft.wrap)||wraps[0];
    (async()=>{
      const stems=arrange(draft);const paths=[config.path,...new Set(stems.map(s=>byKey[s.key].modelPath))];
      await Promise.all(paths.map(model));if(cancelled)return;
      const wrap=cloneModel(await model(config.path));let box=new THREE.Box3().setFromObject(wrap);wrap.scale.setScalar(7/(box.max.y-box.min.y)*config.modelScale);box=new THREE.Box3().setFromObject(wrap);const center=box.getCenter(new THREE.Vector3());wrap.position.set(-center.x,3-box.max.y,-center.z);
      wrap.traverse(mesh=>{if(!mesh.isMesh)return;for(const material of (Array.isArray(mesh.material)?mesh.material:[mesh.material])){const name=(material.name+' '+mesh.name).toLowerCase();const index=config.colorGroups.findIndex(c=>c.parts.some(part=>name.includes(part)));if(index<0)continue;const cg=config.colorGroups[index];const options=cg.options.filter(o=>!o.hidden);const option=options[index===0?draft.paper:draft.accent]||options[0];material.color.setHex(option.color);material.roughness=cg.roughness;material.metalness=0;if(option.pattern)polka(material);}});
      group.add(wrap);const clip=new THREE.Plane(new THREE.Vector3(0,1,0),1);
      const spread=draft.autoSpread?Math.min(2.4,Math.max(.4,.4+(config.topR-.4)*(.8+.9*Math.min(1,Math.max(0,(stems.length-3)/17))))):draft.spread;
      const stemGroups=new Map();
      for(const stem of stems){
        const type=byKey[stem.key],source=cloneModel(await model(type.modelPath));box=new THREE.Box3().setFromObject(source);source.scale.multiplyScalar(2.6/(box.max.y-box.min.y));if(type.modelRot)source.rotation.set(...type.modelRot.map(v=>v*Math.PI/180));box=new THREE.Box3().setFromObject(source);source.position.y-=box.min.y;
        source.scale.multiplyScalar(type.modelScale);source.position.y*=type.modelScale;source.traverse(mesh=>{if(mesh.isMesh)for(const material of (Array.isArray(mesh.material)?mesh.material:[mesh.material]))material.clippingPlanes=[clip];});
        const flower=new THREE.Group();flower.add(source);flower.userData={flower:true,stemId:stem.id};placeStem(flower,stem,spread,config);stemGroups.set(stem.id,flower);group.add(flower);
      }
      const scale=draft.size===10?.9:draft.size===16?.95:1;group.scale.setScalar(scale);
      if(cancelled){disposeGroup(group);return;}disposeGroup(e.root);e.root.add(group);e.spread=spread;e.config=config;e.stemGroups=stemGroups;e.fit(config.camElev??35);ready.current=true;setStatus('');
    })().catch(()=>{if(!cancelled){ready.current=false;disposeGroup(group);setFailed(true);setStatus('A bouquet model could not load. Your choices are saved.');}});
    return()=>{cancelled=true;};
  },[sceneKey]);
  useEffect(()=>{
    const e=engine.current;if(!e?.stemGroups)return;
    for(const stem of arrange(draft)){const flower=e.stemGroups.get(stem.id);if(flower)placeStem(flower,stem,e.spread,e.config);}
  },[draft.stems]);
  useEffect(()=>{if(engine.current)engine.current.controls.autoRotate=spinning;},[spinning]);
  return <><div className="scene" ref={host}/>{status&&<div className={'scene-status '+(failed?'error':'')} role="status">{!failed&&<span className="spinner"/>}{status}{failed&&<button onClick={()=>setRetry(r=>r+1)}>Retry models</button>}</div>}

    <div className="floating-words" style={{color:draft.message.color,fontFamily:({'Classic':'Cormorant Garamond','Elegant':'Cormorant Garamond','Modern':'Manrope','Script':'Great Vibes'})[draft.message.font],'--word-scale':draft.message.textSize/100}}>{draft.message.words}{draft.message.date&&<small>{new Date(draft.message.date+'T12:00:00').toLocaleDateString(undefined,{month:'long',day:'numeric',year:'numeric'})}</small>}</div>
    <div className="scene-tools"><button title="Reset view" aria-label="Reset view" onClick={()=>engine.current?.fit(draft.wrap==='bow'?22:35)}><Icon name="reset" size={17}/></button><button aria-pressed={spinning} aria-label="Rotate bouquet automatically" onClick={()=>setSpinning(!spinning)}><Icon name="orbit" size={17}/></button><span>Drag to rotate · scroll to zoom</span></div>
    <div className="scene-caption">{stemCount(draft)?'Every stem, chosen by you.':'A little love starts with a wrap.'}</div></>;
});
export default BouquetScene;
