import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createRiverBanks} from '../src/runner/river-banks.js';

test('shore stones are bounded, reuse geometry and stay outside playable lanes',()=>{
  const geometry=new THREE.BoxGeometry(),banks=createRiverBanks(new THREE.Scene(),geometry);
  const frameAt=z=>({x:0,y:0,z,yaw:0,pitch:0});
  const section={start:1150,end:1290};
  const matrix=new THREE.Matrix4(),position=new THREE.Vector3();
  const buffer=banks.mesh.instanceMatrix.array;
  for(let distance=1090;distance<1320;distance+=5){
    banks.update(distance,frameAt,section);
    assert.ok(banks.mesh.count<=36);
    for(let i=0;i<banks.mesh.count;i++){
      banks.mesh.getMatrixAt(i,matrix);position.setFromMatrixPosition(matrix);
      assert.ok(Math.abs(position.x)>8);
      assert.ok(position.z>=-170&&position.z<=12);
      assert.ok(matrix.elements.every(Number.isFinite));
    }
    assert.equal(banks.mesh.geometry,geometry);
    assert.equal(banks.mesh.instanceMatrix.array,buffer);
  }
  banks.update(0,frameAt,null);
  assert.equal(banks.mesh.visible,false);assert.equal(banks.mesh.count,0);
});
