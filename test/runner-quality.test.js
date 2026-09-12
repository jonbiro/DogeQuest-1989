import test from 'node:test';
import assert from 'node:assert/strict';
import {createQualityController} from '../src/runner/quality.js';

function frames(controller, count, dt, playing = true) {
  const changes=[];
  for(let i=0;i<count;i++) {
    const change=controller.sample(dt,playing);
    if(change!==null) changes.push(change);
  }
  return changes;
}
test('sustained slowdown lowers resolution and sustained recovery restores it',()=>{
  const quality=createQualityController(3);
  assert.equal(quality.ratio,1.5);
  assert.deepEqual(frames(quality,100,1/30),[1]);
  assert.deepEqual(frames(quality,1200,1/60),[]);
  assert.equal(quality.ratio,1);
  assert.deepEqual(frames(quality,400,1/60),[1.5]);
  assert.deepEqual(frames(quality,60,1/30),[]);
});
test('brief hitches, menus and hidden-tab gaps do not trigger a quality change',()=>{
  const quality=createQualityController(1.25);
  for(let i=0;i<20;i++) {
    assert.deepEqual(frames(quality,15,1/30),[]);
    assert.deepEqual(frames(quality,90,1/60),[]);
  }
  assert.deepEqual(frames(quality,1000,1/30,false),[]);
  assert.deepEqual(frames(quality,1000,2),[]);
  assert.equal(quality.ratio,1.25);
  assert.deepEqual(frames(quality,100,1/30),[1]);
  assert.deepEqual(frames(quality,3000,1/60,false),[]);
  assert.equal(quality.ratio,1);
});
test('quality remains bounded and avoids pointless resizing on standard-density screens',()=>{
  for(const ratio of [0,-1,1,NaN,Infinity]) {
    const quality=createQualityController(ratio);
    assert.equal(quality.ratio,1);
    assert.deepEqual(frames(quality,1000,1/30),[]);
  }
  const quality=createQualityController(1.25);
  assert.deepEqual(frames(quality,100,1/30),[1]);
  assert.deepEqual(frames(quality,1700,1/60),[1.25]);
});
