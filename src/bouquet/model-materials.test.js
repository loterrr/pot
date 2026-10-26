import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {wraps} from './catalog.js';

test('curated recoloring preserves named foliage and green materials, with texture mask uniforms',async()=>{
 const {applyPetalColor}=await import('./model-materials.js');
 const root=new THREE.Group();
 for(const [name,color] of [['petals','#ffffff'],['leaves','#467847'],['unnamed','#336633']]){const object=new THREE.Mesh(new THREE.PlaneGeometry(),new THREE.MeshStandardMaterial({color}));object.name=name;root.add(object);}
 const material=root.children[0].material;applyPetalColor(root,{petalColor:'#cc5577'});
 assert.equal(material.color.getHexString(),'cc5577');assert.equal(root.children[1].material.color.getHexString(),'467847');assert.equal(root.children[2].material.color.getHexString(),'336633');
 const textured=new THREE.Mesh(new THREE.PlaneGeometry(),new THREE.MeshStandardMaterial({map:new THREE.Texture()}));root.add(textured);
 applyPetalColor(root,{petalColor:'#cc5577'});const shader={uniforms:{},fragmentShader:'#include <common>\n#include <map_fragment>'};textured.material.onBeforeCompile(shader);
 assert.ok(shader.fragmentShader.includes('posyGreen'));assert.equal(shader.uniforms.posyPetalColor.value.getHexString(),'cc5577');assert.equal(textured.material.color.getHexString(),'ffffff');
 const uniform=shader.uniforms.posyPetalColor;applyPetalColor(root,{petalColor:'#7788aa'});assert.equal(uniform.value.getHexString(),'7788aa');
 applyPetalColor(root,{});assert.equal(material.color.getHexString(),'ffffff');assert.equal(shader.uniforms.posyPetalEnabled.value,0);
});

test('leaf entries never get petal recoloring',async()=>{
 const {applyPetalColor}=await import('./model-materials.js');const root=new THREE.Group(),material=new THREE.MeshStandardMaterial({color:'#758b64'});root.add(new THREE.Mesh(new THREE.PlaneGeometry(),material));applyPetalColor(root,{kind:'leaf',petalColor:'#ff0000'});assert.equal(material.color.getHexString(),'758b64');
});

test('paper ribbon recolors independently and original Polka keeps world-space dots',async()=>{
 const {applyWrapMaterials}=await import('./model-materials.js'),config=wraps[0],root=new THREE.Group();
 for(const name of ['model_part0','model_part1']){const object=new THREE.Mesh(new THREE.PlaneGeometry(),new THREE.MeshStandardMaterial());object.name=name;root.add(object);}
 applyWrapMaterials(root,config,{paper:1,accent:0,ribbonColor:'#552266'});
 assert.equal(root.children[1].material.color.getHexString(),'552266');const surface=root.children[0].material;
 const shader={uniforms:{},vertexShader:'#include <common>\n#include <beginnormal_vertex>\n#include <begin_vertex>',fragmentShader:'#include <common>\n#include <color_fragment>'};surface.onBeforeCompile(shader);
 assert.ok(shader.vertexShader.includes('modelMatrix'));assert.ok(shader.fragmentShader.includes('uv*3.0'));assert.equal(shader.uniforms.uDot.value.getHexString(),'20201c');
 applyWrapMaterials(root,config,{paper:0,accent:0});assert.equal(surface.customProgramCacheKey(),'posy-surface-plain');assert.equal(root.children[1].material.color.getHex(),15972550);
});

test('ceramic patterns and body colors update in place while glass stays clear',async()=>{
 const {applyWrapMaterials}=await import('./model-materials.js'),{createProceduralWrap}=await import('./bouquet-models.js');
 for(const key of ['glass','ceramic']){
  const config=wraps.find(w=>w.key===key),vase=createProceduralWrap(config),surface=vase.children[0].material;
  applyWrapMaterials(vase,config,{paper:0,surfaceColor:'#aaccee',ribbonColor:'#552266',surfacePattern:'stripe'});
  assert.equal(vase.children[0].material,surface);
  if(key==='glass'){assert.ok(surface.transmission>.8);assert.equal(surface.userData.pattern,undefined);}else{assert.equal(surface.color.getHexString(),'aaccee');assert.equal(surface.userData.pattern,'stripe');}
 }
});
