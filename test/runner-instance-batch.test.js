import test from 'node:test';
import assert from 'node:assert/strict';
import {Scene,BoxGeometry,MeshStandardMaterial,Matrix4,DynamicDrawUsage} from 'three';
import {createInstanceBatch} from '../src/runner/instance-batch.js';

test('pickup batches preserve transforms across growth and release only the old instance buffer',()=>{
  const scene=new Scene(),geometry=new BoxGeometry(),material=new MeshStandardMaterial();
  const batch=createInstanceBatch(scene,geometry,material,2);
  const old=scene.children[0];let retired=0,geometryDisposed=0,materialDisposed=0;
  old.addEventListener('dispose',()=>retired++);
  geometry.addEventListener('dispose',()=>geometryDisposed++);
  material.addEventListener('dispose',()=>materialDisposed++);
  batch.begin();
  for(let i=0;i<5;i++)batch.add(new Matrix4().makeTranslation(i,3+i,-20-i));
  batch.end();
  assert.equal(batch.count,5);assert.equal(batch.capacity,8);
  assert.equal(scene.children.length,1);assert.equal(retired,1);
  assert.equal(geometryDisposed,0);assert.equal(materialDisposed,0);
  const mesh=scene.children[0];assert.equal(mesh.geometry,geometry);assert.equal(mesh.material,material);
  assert.equal(mesh.instanceMatrix.usage,DynamicDrawUsage);assert.equal(mesh.count,5);
  const actual=new Matrix4();
  for(let i=0;i<5;i++) {
    mesh.getMatrixAt(i,actual);
    assert.deepEqual(actual.elements,new Matrix4().makeTranslation(i,3+i,-20-i).elements);
  }
});
test('shrinking, collecting everything and starting another run leave no stale instances',()=>{
  const scene=new Scene(),batch=createInstanceBatch(scene,new BoxGeometry(),new MeshStandardMaterial());
  for(const count of [60,18,0,3,0]) {
    batch.begin();for(let i=0;i<count;i++)batch.add(new Matrix4().makeTranslation(i,0,0));batch.end();
    assert.equal(scene.children.length,1);
    assert.equal(batch.count,count);assert.equal(scene.children[0].count,count);
    assert.equal(scene.children[0].visible,count>0);assert.equal(batch.capacity,64);
  }
});
