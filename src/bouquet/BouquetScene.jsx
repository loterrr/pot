import {useEffect,useRef,useState,forwardRef,useImperativeHandle} from 'react';
import Icon from '../Icon.jsx';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {wraps,byKey} from './catalog.js';
import {loadModel,buildFlower,cloneModel,disposeModel,vesselLayout,extendedStem,placeStem} from './bouquet-models.js';
import {applyWrapMaterials} from './model-materials.js';
import {arrange,stemCount} from './draft.js';
import {cameraFrame} from './scene-layout.js';
import BouquetCard from './BouquetCard.jsx';
import {projectCardTag} from './card-tag.js';
import {captureRotationFrame} from './spin-capture.js';

const disposeGroup=disposeModel;
function flowerGroup(object){let node=object;while(node){if(node.userData.flower)return node;node=node.parent;}return null;}
const BouquetScene=forwardRef(function BouquetScene({draft,onPatch,onSelect},ref){
  const draftRef=useRef(draft);draftRef.current=draft;
  const host=useRef(null),tagRef=useRef(null),engine=useRef(null),ready=useRef(false),selectRef=useRef(onSelect),[status,setStatus]=useState('Loading your wrap…'),[retry,setRetry]=useState(0),[failed,setFailed]=useState(false),[spinning,setSpinning]=useState(false);
  useEffect(()=>{selectRef.current=onSelect;},[onSelect]);
  useImperativeHandle(ref,()=>({
    rotationFrame(angle,background){
      if(!engine.current||!ready.current)return null;
      const current=engine.current;
      if(current.renderer.getContext().isContextLost())throw new Error('The 3D preview needs to reload before exporting.');
      if(!current.exporting){current.exporting=true;current.gifView={position:current.camera.position.clone(),target:current.controls.target.clone()};current.controlsEnabled=current.controls.enabled;current.controls.enabled=false;}
      return captureRotationFrame(current,angle,background);
    },
    finishRotation(){const current=engine.current;if(current?.exporting){current.exporting=false;current.gifView=null;current.controls.enabled=current.controlsEnabled;}},
    snapshot(width=2160){
      const current=engine.current;
      if(!current||!ready.current)return null;
      const {renderer,camera,scene}=current,canvas=renderer.domElement;
      const cssWidth=canvas.clientWidth||1,cssHeight=canvas.clientHeight||1,size=new THREE.Vector2(),ratio=renderer.getPixelRatio(),aspect=camera.aspect;
      renderer.getSize(size);
      // Render at export resolution without changing the preview framing.
      try{
        renderer.setPixelRatio(1);renderer.setSize(width,Math.max(1,Math.round(width*cssHeight/cssWidth)),false);
        camera.aspect=cssWidth/cssHeight;camera.updateProjectionMatrix();
        renderer.render(scene,camera);
        return canvas.toDataURL('image/png');
      }finally{
        renderer.setPixelRatio(ratio);renderer.setSize(size.x,size.y,false);
        camera.aspect=aspect;camera.updateProjectionMatrix();
      }
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
      const hit=raycaster.intersectObjects(root.children,true).find(hit=>!(state.config?.key==='glass'&&hit.object.userData.role==='surface'));
      selectRef.current?.(hit?flowerGroup(hit.object)?.userData.stemId??null:null);
    };
    renderer.domElement.addEventListener('pointerdown',onPointerDown);
    renderer.domElement.addEventListener('pointerup',onPointerUp);
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');let raf;
    function frame(time){raf=requestAnimationFrame(frame);
      if(state.exporting)return;
      if(tagRef.current?.getAttribute('aria-expanded')==='true')return;
      controls.update();state.stemGroups?.forEach(c=>{if(!reduced.matches&&!state.config?.layout.vessel)c.rotation.z=c.userData.tilt+.008*Math.sin(time*.0008+c.userData.phase);});renderer.render(scene,camera);
      const tag=tagRef.current;
      if(tag&&!tag.classList.contains('card-fallback')){
        const anchor=state.tagAnchor,holder=state.tagGroup;
        if(!ready.current||!anchor||!holder)tag.style.visibility='hidden';
        else{const position=projectCardTag(anchor,holder.matrixWorld,camera,el.clientWidth,el.clientHeight);tag.style.visibility=position.visible?'visible':'hidden';tag.style.transform=`matrix(${position.a},${position.b},${position.c},${position.d},${position.x},${position.y}) translate(-50%,-50%)`;}
      }
    }
    raf=requestAnimationFrame(frame);
    return()=>{cancelAnimationFrame(raf);observer.disconnect();controls.dispose();renderer.domElement.removeEventListener('pointerdown',onPointerDown);renderer.domElement.removeEventListener('pointerup',onPointerUp);disposeGroup(root);renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();engine.current=null;ready.current=false;};
  },[]);
  const sceneKey=JSON.stringify([draft.wrap,draft.size,draft.spread,draft.autoSpread,draft.seed,draft.quantities,retry]);
  useEffect(()=>{
    const e=engine.current;if(!e)return;let cancelled=false;const group=new THREE.Group();ready.current=false;e.stemGroups=null;setFailed(false);setStatus('Arranging your bouquet…');
    const config={...(wraps.find(w=>w.key===draft.wrap)||wraps[0])};
    (async()=>{
      const stems=arrange(draft);config.layout=vesselLayout(config,stems.length);
      await Promise.all([loadModel(config),...stems.map(stem=>loadModel(byKey[stem.key]))]);if(cancelled)return;
      const wrap=cloneModel(await loadModel(config));let box;
      if(!config.proceduralModel){box=new THREE.Box3().setFromObject(wrap);wrap.scale.setScalar(7/(box.max.y-box.min.y)*config.modelScale);box=new THREE.Box3().setFromObject(wrap);const center=box.getCenter(new THREE.Vector3());wrap.position.set(-center.x,3-box.max.y,-center.z);}
      applyWrapMaterials(wrap,config,draft);group.add(wrap);wrap.updateWorldMatrix(true,true);
      const tagAnchor=new THREE.Vector3(config.tag?.x??0,(config.tag?.y??-.5)-(config.layout.vessel?0:.6),.5);
      const wrapBounds=new THREE.Box3().setFromObject(wrap);
      const surfaceHit=new THREE.Raycaster(new THREE.Vector3(tagAnchor.x,tagAnchor.y,wrapBounds.max.z+1),new THREE.Vector3(0,0,-1)).intersectObject(wrap,true)[0];
      if(surfaceHit)tagAnchor.z=surfaceHit.point.z+.12;
      const scale=draft.size===10?.9:draft.size===16?.95:Math.min(1.1,.86+Math.sqrt(draft.size/40)*.24);
      const clip=new THREE.Plane(new THREE.Vector3(0,1,0),-config.layout.clipY*scale);
      const spread=draft.autoSpread?Math.min(2.4,Math.max(.4,.4+(config.topR-.4)*(.8+.9*Math.min(1,Math.max(0,(stems.length-3)/37))))):draft.spread;
      const stemGroups=new Map(),extensions=new Map();
      for(const stem of stems){
        const type=byKey[stem.key],source=await buildFlower(type);box=new THREE.Box3().setFromObject(source);source.scale.multiplyScalar(2.6/Math.max(.01,box.max.y-box.min.y));box=new THREE.Box3().setFromObject(source);source.position.y-=box.min.y;
        source.scale.multiplyScalar(type.modelScale);source.position.y*=type.modelScale;source.traverse(mesh=>{if(mesh.isMesh)for(const material of (Array.isArray(mesh.material)?mesh.material:[mesh.material]))material.clippingPlanes=[clip];});
        const flower=new THREE.Group();flower.add(source);flower.userData={flower:true,stemId:stem.id};placeStem(flower,stem,spread,config);stemGroups.set(stem.id,flower);group.add(flower);
        if(config.layout.vessel){const extension=extendedStem(stem,flower,config.layout.clipY);extension.userData={flower:true,stemId:stem.id};extensions.set(stem.id,extension);group.add(extension);}
      }
      group.scale.setScalar(scale);
      if(cancelled){disposeGroup(group);return;}
      applyWrapMaterials(wrap,config,draftRef.current);
      for(const stem of arrange(draftRef.current)){const flower=stemGroups.get(stem.id);if(flower){placeStem(flower,stem,spread,config);const extension=extensions.get(stem.id);if(extension){disposeGroup(extension);const updated=extendedStem(stem,flower,config.layout.clipY);while(updated.children.length)extension.add(updated.children[0]);}}}
      disposeGroup(e.root);e.root.add(group);e.spread=spread;e.config=config;e.wrapGroup=wrap;e.extensions=extensions;e.stemGroups=stemGroups;e.tagAnchor=tagAnchor;e.tagGroup=group;e.fit(config.camElev??35);ready.current=true;setStatus('');
    })().catch(()=>{disposeGroup(group);if(!cancelled){ready.current=false;setFailed(true);setStatus('A bouquet model could not load. Your choices are saved.');}});
    return()=>{cancelled=true;};
  },[sceneKey]);
  useEffect(()=>{
    const e=engine.current;if(!e?.stemGroups)return;
    for(const stem of arrange(draft)){const flower=e.stemGroups.get(stem.id);if(flower){placeStem(flower,stem,e.spread,e.config);const extension=e.extensions?.get(stem.id);if(extension){disposeGroup(extension);const updated=extendedStem(stem,flower,e.config.layout.clipY);while(updated.children.length)extension.add(updated.children[0]);}}}
  },[draft.stems]);
  useEffect(()=>{
    const e=engine.current;if(e?.wrapGroup)applyWrapMaterials(e.wrapGroup,e.config,draft);
  },[draft.paper,draft.accent,draft.surfaceColor,draft.ribbonColor,draft.surfacePattern]);
  useEffect(()=>{if(engine.current)engine.current.controls.autoRotate=spinning;},[spinning]);
  return <><div className="scene" ref={host}/><BouquetCard message={draft.message} tagRef={tagRef} fallback={failed}/>{status&&<div className={'scene-status '+(failed?'error':'')} role="status">{!failed&&<span className="spinner"/>}{status}{failed&&<button onClick={()=>setRetry(r=>r+1)}>Retry models</button>}</div>}

    <div className="floating-words" style={{color:draft.message.color,fontFamily:({'Classic':'Cormorant Garamond','Elegant':'Cormorant Garamond','Modern':'Manrope','Script':'Great Vibes'})[draft.message.font],'--word-scale':draft.message.textSize/100}}>{draft.message.words}{draft.message.date&&<small>{new Date(draft.message.date+'T12:00:00').toLocaleDateString(undefined,{month:'long',day:'numeric',year:'numeric'})}</small>}</div>
    <div className="scene-tools"><button title="Reset view" aria-label="Reset view" onClick={()=>engine.current?.fit(engine.current.config?.camElev??35)}><Icon name="reset" size={17}/></button><button aria-pressed={spinning} aria-label="Rotate bouquet automatically" onClick={()=>setSpinning(!spinning)}><Icon name="orbit" size={17}/></button><span>Drag to rotate · scroll to zoom</span></div>
    <div className="scene-caption">{stemCount(draft)?'Every stem, chosen by you.':'A little love starts with a wrap.'}</div></>;
});
export default BouquetScene;
