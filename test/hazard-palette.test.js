import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {HAZARD_PALETTES,RELIC_PALETTES,themeHazard} from '../src/runner/hazard-palette.js';

test('six local stone families preserve shared materials and universal clearance marks',()=>{
  const original=new THREE.MeshStandardMaterial({color:'#175c70'});
  const cue=new THREE.MeshStandardMaterial({color:'#b3ffe7'});
  const band=new THREE.MeshStandardMaterial({color:'#102b36'});
  const item=new THREE.Group();
  for(const material of [original,cue,band])item.add(new THREE.Mesh(new THREE.BoxGeometry(),material));
  let allocations=0;
  const cache=new Map();
  const mat=color=>{if(!cache.has(color)){cache.set(color,new THREE.MeshStandardMaterial({color}));allocations++;}return cache.get(color);};
  const geometry=item.children.map(p=>p.geometry);
  for(let cycle=0;cycle<3;cycle++)for(let area=0;area<6;area++){
    themeHazard(item,'arch',area*225+80,mat);
    assert.equal('#'+item.children[0].material.color.getHexString(),HAZARD_PALETTES[area][1]);
    assert.equal(item.children[1].material,cue);
    assert.equal(item.children[2].material,band);
    assert.deepEqual(item.children.map(p=>p.geometry),geometry);
    themeHazard(item,'arch',area*225+81,()=>assert.fail('same area must be cached'));
  }
  assert.equal(allocations,6);
  assert.equal(original.color.getHexString(),'175c70');
});

test('special crystals and pickups retain their materials',()=>{
  for(const type of ['crystal-rock','bone','warden-gate','feed-sacks','pound-officer','crate-cart']){
    const item=new THREE.Group();
    item.traverse=()=>assert.fail('unrelated models must not be traversed');
    themeHazard(item,type,500,()=>assert.fail());
  }
});

test('area relics keep a bright three-color signature while following each destination',()=>{
  const item=new THREE.Group();
  for(const color of ['#efbf67','#fff0b7','#173b3e'])
    item.add(new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshStandardMaterial({color})));
  const cache=new Map();
  let allocations=0;
  const mat=color=>{
    if(!cache.has(color)){cache.set(color,new THREE.MeshStandardMaterial({color}));allocations++;}
    return cache.get(color);
  };
  for(let area=0;area<RELIC_PALETTES.length;area++){
    themeHazard(item,'relic',area*225+80,mat);
    assert.deepEqual(item.children.map(part=>`#${part.material.color.getHexString()}`),RELIC_PALETTES[area]);
    themeHazard(item,'relic',area*225+81,()=>assert.fail('same area must be cached'));
  }
  assert.equal(allocations,RELIC_PALETTES.length*3);
});
