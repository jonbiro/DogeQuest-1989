import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createRaftModel} from '../src/runner/raft-model.js';
import {puppyPose} from '../src/runner/puppy-pose.js';
import {createWaterSurface} from '../src/runner/water.js';

test('raft reuses twelve mesh parts and keeps its deck beneath the puppy',()=>{
  const box=new THREE.BoxGeometry(),trunk=new THREE.CylinderGeometry(.7,1,1,10);
  const material=new THREE.MeshStandardMaterial();
  const raft=createRaftModel((parent,geometry,color,x,y,z,sx,sy,sz)=>{
    const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);parent.add(mesh);return mesh;
  },box,trunk);
  assert.equal(raft.children.length,12);assert.equal(raft.visible,false);
  assert.ok(raft.children.every(part=>part.geometry===box||part.geometry===trunk));
  for(const log of raft.children.slice(0,7))assert.equal(log.rotation.x,Math.PI/2);
  for(const distance of [1150,1170,1200])assert.deepEqual(puppyPose(2,distance,{rafting:true}).legs,[-.15,.18,-.15,.18]);
  box.dispose();trunk.dispose();material.dispose();
});

test('raft river follows route frames with a narrower channel and correct water height',()=>{
  const water=createWaterSurface(new THREE.Scene());
  water.update(1170,z=>({x:0,y:0,z,yaw:0}),false,0,false,{start:1150,end:1290});
  assert.equal(water.mesh.visible,true);
  const p=water.mesh.geometry.attributes.position;
  assert.equal(p.getX(0),-8);assert.equal(p.getX(4),8);
  assert.ok(Math.abs(p.getY(0)+.55)<1e-6);
  assert.equal(p.getZ(0),20);assert.equal(p.getZ(p.count-1),-120);
  water.mesh.geometry.dispose();water.mesh.material.dispose();
});
