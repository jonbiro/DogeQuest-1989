import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createLogModel} from '../src/runner/log-model.js';

test('logs share end geometry and retain full visible detail with one solid shadow caster',()=>{
  const boxGeometry=new THREE.BoxGeometry(1,1,1),material=new THREE.MeshStandardMaterial();
  const mesh=(parent,geometry,color,x,y,z,sx,sy,sz)=>{
    const part=new THREE.Mesh(geometry,material);part.position.set(x,y,z);part.scale.set(sx,sy,sz);parent.add(part);return part;
  };
  const log=createLogModel(mesh,(parent,color,...args)=>mesh(parent,boxGeometry,color,...args));
  assert.equal(log.children.length,7);
  assert.equal(log.children.filter(part=>!part.userData.shadowDetail).length,1);
  assert.equal(log.children.find(part=>!part.userData.shadowDetail).name,'log-body');
  assert.equal(log.children[1].geometry,log.children[3].geometry);
  assert.equal(log.children[2].geometry,log.children[4].geometry);
  const clone=log.clone();
  assert.equal(clone.children.filter(part=>!part.userData.shadowDetail).length,1,'pool clones retain shadow policy');
  for(const [i,part] of log.children.entries())assert.equal(part.geometry,clone.children[i].geometry);
  const bounds=new THREE.Box3().setFromObject(log);
  assert.ok(bounds.max.x<1.01&&bounds.min.x> -1.01&&bounds.max.y<1&&bounds.min.y>=0);
  for(const geometry of new Set(log.children.map(part=>part.geometry)))geometry.dispose();
  material.dispose();
});
