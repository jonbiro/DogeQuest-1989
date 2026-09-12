import test from 'node:test';
import assert from 'node:assert/strict';
import {createQualityController} from '../src/runner/quality.js';
import {readFileSync} from 'node:fs';
import {URL} from 'node:url';

function frames(controller, count, dt, playing = true) {
  const changes=[];
  for(let i=0;i<count;i++) {
    const change=controller.sample(dt,playing);
    if(change!==null) changes.push(change);
  }
  return changes;
}
test('severe slowdown is measured in wall time rather than clamped physics time',()=>{
  const quality=createQualityController(2);
  assert.deepEqual(frames(quality,29,.1),[]);
  assert.deepEqual(frames(quality,2,.1),[1]);
  const app=readFileSync(new URL('../src/runner/app.js',import.meta.url),'utf8');
  const render=readFileSync(new URL('../src/runner/render.js',import.meta.url),'utf8');
  assert.match(app,/const dt = Math\.min\(0\.05, frameDt\)/,'physics retains its safety cap');
  assert.match(app,/saved\.collection, frameDt\)/,'real display interval reaches renderer');
  assert.match(render,/quality\.sample\(frameDt,/);
});
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
test('failed high-resolution retries back off instead of repeating the same cycle',()=>{
  const quality=createQualityController(2);
  assert.deepEqual(frames(quality,100,1/30),[1]);
  assert.deepEqual(frames(quality,1600,1/60),[1.5]);
  assert.deepEqual(frames(quality,300,1/30),[1]);
  assert.deepEqual(frames(quality,2000,1/60),[],'failed retry needs more than the original 20s recovery');
  assert.deepEqual(frames(quality,1000,1/60),[1.5]);
  frames(quality,2000,1/60);
  assert.deepEqual(frames(quality,100,1/30),[1]);
  assert.deepEqual(frames(quality,1600,1/60),[1.5],'sustained high-quality success restores normal recovery');
});
