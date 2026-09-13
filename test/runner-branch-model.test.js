import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createBranchModel} from '../src/runner/branch-model.js';

test('overhead branch has grounded supports outside the playable clearance',()=>{
  const geometry=new THREE.SphereGeometry(1,20,14),boxGeometry=new THREE.BoxGeometry(1,1,1),material=new THREE.MeshBasicMaterial();
  const builder=(geometry)=>(parent,_color,x,y,z,sx,sy,sz)=>{
    const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);parent.add(mesh);return mesh;
  };
  const branch=createBranchModel(builder(boxGeometry),builder(geometry)),supports=branch.children.filter(child=>child.name==='branch-support');
  assert.equal(supports.length,2);
  for(const support of supports) {
    const bounds=new THREE.Box3().setFromObject(support);
    assert.ok(Math.abs(bounds.min.y)<1e-9);assert.equal(bounds.max.y,2.2);
    assert.ok(bounds.max.x<=-.95||bounds.min.x>=.95,'posts stay outside the collision lane corridor');
    assert.equal(support.geometry,geometry,'shared mesh resources are reused');
  }
  const bounds=new THREE.Box3().setFromObject(branch);
  assert.ok(bounds.min.x>=-1.3&&bounds.max.x<=1.3,'no extra neighboring-lane clutter');
  const limbs=branch.children.filter(child=>child.name==='branch-limb');
  assert.equal(limbs.length,3);
  for(const limb of limbs)assert.ok(new THREE.Box3().setFromObject(limb).min.y>1.25,'duck-under opening remains clear');
  assert.equal(branch.children.length,10,'bounded model complexity');
  assert.equal(branch.children.filter(part=>part.userData.shadowDetail===true).length,5,'foliage and cues do not duplicate branch shadows');
  assert.equal(branch.children.filter(part=>part.userData.shadowDetail!==true).length,5,'supports and limbs keep their readable shadows');
  geometry.dispose();boxGeometry.dispose();material.dispose();
});
