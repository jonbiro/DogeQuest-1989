import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createWaterSurface} from '../src/runner/water.js';

test('raft wake follows the rider in river coordinates and fades at both shores',()=>{
  const water=createWaterSurface(new THREE.Scene());
  const shader={uniforms:{},vertexShader:'#include <begin_vertex>',fragmentShader:'#include <color_fragment>'};
  water.mesh.material.onBeforeCompile(shader);
  const uniform=shader.uniforms.raftWake.value;
  const section={start:1150,end:1290};
  const frameAt=z=>({x:0,y:0,z,yaw:0});
  water.update(1220,frameAt,false,1/60,true,section,2.4);
  assert.deepEqual(uniform.toArray(),[2.4,50,1.4,1]);
  water.update(1151.5,frameAt,false,0,false,section,-2.4);
  assert.equal(uniform.x,-2.4);assert.equal(uniform.w,.5);
  water.update(1288.5,frameAt,false,0,false,section,0);
  assert.equal(uniform.w,.5);
  for(const args of [[1220,false,section,null],[1290,false,section,0],[1220,true,section,0],[1220,false,null,0]]){
    water.update(args[0],frameAt,args[1],0,false,args[2],args[3]);
    assert.equal(uniform.w,0);
  }
  assert.equal(shader.uniforms.raftWake.value,uniform,'reuse uniform without per-frame allocations');
  assert.match(shader.fragmentShader,/float foam = edge \* tail \* raftWake.w/);
});
