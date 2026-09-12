import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createBranchModel} from '../src/runner/branch-model.js';

test('overhead branch has grounded supports outside the playable clearance',()=>{
  const geometry=new THREE.BoxGeometry(1,1,1),material=new THREE.MeshBasicMaterial();
  const builder=(parent,_color,x,y,z,sx,sy,sz)=>{
    const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);parent.add(mesh);return mesh;
  };
  const branch=createBranchModel(builder,builder),supports=branch.children.filter(child=>child.name==='branch-support');
  assert.equal(supports.length,2);
  for(const support of supports) {
    const bounds=new THREE.Box3().setFromObject(support);
    assert.ok(Math.abs(bounds.min.y)<1e-9);assert.equal(bounds.max.y,2.2);
    assert.ok(bounds.max.x<=-.95||bounds.min.x>=.95,'posts stay outside the collision lane corridor');
    assert.equal(support.geometry,geometry,'shared mesh resources are reused');
  }
  const bounds=new THREE.Box3().setFromObject(branch);
  assert.ok(bounds.min.x>=-1.3&&bounds.max.x<=1.3,'no extra neighboring-lane clutter');
  assert.equal(branch.children.length,8,'only two support draws added');
  geometry.dispose();material.dispose();
});
