import test from 'node:test';
import assert from 'node:assert/strict';
import {Scene} from 'three';
import {createWaterSurface} from '../src/runner/water.js';
import {createRouteSampler} from '../src/runner/route.js';

test('river ripples reuse a uniform, freeze when paused and keep anchored coordinates',()=>{
  const water=createWaterSurface(new Scene()),shader={uniforms:{},vertexShader:'#include <begin_vertex>',fragmentShader:'#include <color_fragment>'};
  water.mesh.material.onBeforeCompile(shader);
  const phase=shader.uniforms.riverPhase,uv=water.mesh.geometry.attributes.uv;
  const original=Array.from(uv.array);
  water.update(225,createRouteSampler(225),false,1/60,true);
  assert.equal(phase.value,.02);
  water.update(230,createRouteSampler(230),false,1,false);
  assert.equal(phase.value,.02);
  water.update(1125,createRouteSampler(1125),false,NaN,true);
  assert.equal(phase.value,.02);
  water.update(1125,createRouteSampler(1125),false,20,true);
  assert.ok(Math.abs(phase.value-.08)<1e-8);
  assert.deepEqual(Array.from(uv.array),original);
  assert.match(shader.fragmentShader,/length\(vViewPosition\)/);
  assert.equal(water.mesh.material.map,null);
});

test('river uses shared indexed edges with no overlapping water slabs',()=>{
  const water=createWaterSurface(new Scene()),geometry=water.mesh.geometry;
  assert.equal(geometry.attributes.position.count,105);
  assert.equal(geometry.index.count,480);
  const edges=new Map();
  const index=geometry.index.array;
  for(let i=0;i<index.length;i+=3)for(const [a,b] of [[index[i],index[i+1]],[index[i+1],index[i+2]],[index[i+2],index[i]]]){
    const key=[a,b].sort((x,y)=>x-y).join(':');edges.set(key,(edges.get(key)||0)+1);
  }
  assert.ok([...edges.values()].every(count=>count===1||count===2));
  assert.equal([...edges.values()].filter(count=>count===1).length,48);
});

test('river follows real curved routes, repeats and reuses its buffers',()=>{
  const water=createWaterSurface(new Scene()),positions=water.mesh.geometry.attributes.position;
  const buffer=positions.array;
  for(const distance of [180,225,275,1080,1125,1975]){
    const sample=createRouteSampler(distance),bounds=water.update(distance,sample);
    assert.equal(water.mesh.visible,true);
    assert.equal(bounds.end-bounds.start,100);
    for(const value of buffer)assert.ok(Number.isFinite(value));
    for(let row=0;row<21;row++){
      const station=bounds.start+row*5,frame=sample(distance-station);
      assert.ok(Math.abs(positions.getY(row*5+2)-(frame.y-1.08))<.00001);
      assert.ok(Math.abs(positions.getX(row*5+2)-frame.x)<.0001);
    }
    assert.equal(positions.array,buffer);
  }
  for(const distance of [0,400,900,-1,NaN,Infinity]){
    water.update(distance,createRouteSampler(0));assert.equal(water.mesh.visible,false);
  }
  water.update(225,createRouteSampler(225),true);assert.equal(water.mesh.visible,false);
});
