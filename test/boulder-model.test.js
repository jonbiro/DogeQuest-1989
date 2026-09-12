import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createBoulderGeometry} from '../src/runner/boulder-model.js';

test('weathered boulder preserves bounds and vertex budget while breaking the spherical silhouette',()=>{
  const before=new THREE.DodecahedronGeometry(1,1),after=createBoulderGeometry();
  before.computeBoundingBox();
  assert.deepEqual(after.boundingBox,before.boundingBox);
  assert.equal(after.attributes.position.count,before.attributes.position.count);
  assert.deepEqual(after.attributes.position.array,createBoulderGeometry().attributes.position.array);
  assert.notDeepEqual(after.attributes.position.array,before.attributes.position.array);
  const radii=[];
  for(let i=0;i<after.attributes.position.count;i++){
    const position=new THREE.Vector3().fromBufferAttribute(after.attributes.position,i);
    const normal=new THREE.Vector3().fromBufferAttribute(after.attributes.normal,i);
    assert.ok(Number.isFinite(position.length()));
    assert.ok(Math.abs(normal.length()-1)<1e-5);
    radii.push(position.length());
  }
  assert.ok(Math.max(...radii)-Math.min(...radii)>.15,'visible chipped contours, not another sphere');
});

test('coincident stone vertices have continuous lighting while texture UVs remain intact',()=>{
  const geometry=createBoulderGeometry(),source=new THREE.DodecahedronGeometry(1,1);
  assert.deepEqual(geometry.attributes.uv.array,source.attributes.uv.array);
  const positions=geometry.attributes.position,normals=geometry.attributes.normal,seen=new Map();
  let duplicates=0;
  for(let i=0;i<positions.count;i++){
    const key=[positions.getX(i),positions.getY(i),positions.getZ(i)].map(n=>n.toFixed(5)).join(',');
    const normal=[normals.getX(i),normals.getY(i),normals.getZ(i)];
    if(seen.has(key)){assert.deepEqual(normal,seen.get(key));duplicates++;}
    else seen.set(key,normal);
  }
  assert.ok(duplicates>100,'exercise shared triangle edges, including UV seams');
});
