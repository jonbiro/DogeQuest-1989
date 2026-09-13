import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createBranchModel} from '../src/runner/branch-model.js';
import {themeHazard} from '../src/runner/hazard-palette.js';
import {ORGANIC_PALETTES} from '../src/runner/organic-hazards.js';

test('regional branch silhouettes retain clearance, markers and shared geometry through pool reuse',()=>{
  const sphere=new THREE.SphereGeometry(1,20,14),cube=new THREE.BoxGeometry(1,1,1),cache=new Map();
  const material=color=>{if(!cache.has(color))cache.set(color,new THREE.MeshStandardMaterial({color}));return cache.get(color);};
  const builder=geometry=>(parent,color,x,y,z,sx,sy,sz)=>{
    const part=new THREE.Mesh(geometry,material(color));part.position.set(x,y,z);part.scale.set(sx,sy,sz);parent.add(part);return part;
  };
  const model=createBranchModel(builder(cube),builder(sphere));
  const geometry=model.children.map(part=>part.geometry),markers=model.children.slice(-3).map(part=>part.material);
  const shapes=new Set();let warm;
  for(let cycle=0;cycle<3;cycle++)for(let area=0;area<6;area++){
    themeHazard(model,'branch',area*225+50,material);
    assert.deepEqual(model.children.map(part=>part.geometry),geometry);
    assert.deepEqual(model.children.slice(-3).map(part=>part.material),markers);
    assert.equal(model.children.length,10);
    const limbs=model.children.filter(part=>part.name==='branch-limb');
    shapes.add(JSON.stringify(limbs.map(part=>[part.position.y,part.rotation.z])));
    for(const limb of limbs)assert.ok(new THREE.Box3().setFromObject(limb).min.y>1.25);
    const bounds=new THREE.Box3().setFromObject(model);
    assert.ok(bounds.min.x>=-1.31&&bounds.max.x<=1.31,'no neighboring lane clutter');
    themeHazard(model,'branch',area*225+51,()=>assert.fail('same-area material cache was missed'));
    if(cycle===0&&area===5)warm=cache.size;
    if(cycle>0)assert.equal(cache.size,warm,'materials stabilize after all six areas');
  }
  assert.equal(shapes.size,6);
  sphere.dispose();cube.dispose();for(const value of cache.values())value.dispose();
});

test('pooled logs recover the correct local bark instead of carrying the previous area color',()=>{
  const model=new THREE.Group(),geometry=new THREE.CylinderGeometry();
  model.add(new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:'#683a20'})));
  for(const area of [0,5,2,4,1,3,0]){
    themeHazard(model,'log',area*225+20,color=>new THREE.MeshStandardMaterial({color}));
    assert.equal('#'+model.children[0].material.color.getHexString(),ORGANIC_PALETTES[area][0]);
    assert.equal(model.children[0].geometry,geometry);
  }
});
