import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {addBambooLeaves} from '../src/runner/bamboo-leaves.js';
import {createPalmFrondGeometry} from '../src/runner/palm-frond.js';

test('bamboo leaf fans share one geometry and attach to opposite sides of the stem',()=>{
  const group=new THREE.Group(),geometry=createPalmFrondGeometry();
  const mesh=(parent,shape,color,x,y,z,sx,sy,sz)=>{
    const leaf=new THREE.Mesh(shape,new THREE.MeshBasicMaterial({color}));
    leaf.position.set(x,y,z);leaf.scale.set(sx,sy,sz);parent.add(leaf);return leaf;
  };
  addBambooLeaves(group,geometry,mesh,.5,8);
  assert.equal(group.children.length,6);
  group.updateMatrixWorld(true);
  for(const [i,leaf] of group.children.entries()){
    assert.equal(leaf.geometry,geometry);
    const root=new THREE.Vector3(-1,0,0).applyMatrix4(leaf.matrixWorld);
    assert.ok(Math.abs(root.x-.5)<1e-9&&Math.abs(root.z)<1e-9,'leaves meet the stem');
    assert.equal(root.y,8*(i<3?.8:.57));
    const tip=new THREE.Vector3(1,0,0).applyMatrix4(leaf.matrixWorld);
    assert.ok(i<3?tip.x>.5:tip.x<.5);
  }
  assert.ok(group.children.length*geometry.attributes.position.count<2*new THREE.SphereGeometry(1,20,14).attributes.position.count,
    'six tapered leaves use fewer vertices than the two former foliage spheres');
});
