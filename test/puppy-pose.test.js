import test from "node:test";
import assert from "node:assert/strict";
import {puppyPose} from "../src/runner/puppy-pose.js";
test("cosmetic poses stay finite and bounded during long runs",()=>{
  for(let t=0;t<300;t+=.037){
    const p=puppyPose(t,t*46.8);
    assert.ok(p.blink>=.12&&p.blink<=1);
    for(const v of [p.breathe,p.ears,p.tail,p.cape,...p.legs])assert.ok(Number.isFinite(v)&&Math.abs(v)<=1);
  }
});
test("reduced motion disables decorative movement while keeping action silhouettes",()=>{
  const p=puppyPose(4,200,{reducedMotion:true,menu:true});
  assert.deepEqual(p,{blink:1,breathe:0,ears:0,tail:0,cape:0,legs:[0,0,0,0]});
  assert.deepEqual(puppyPose(4,200,{reducedMotion:true,airborne:true}).legs,[-.65,-.65,.5,.5]);
  assert.deepEqual(puppyPose(4,200,{sliding:true}).legs,[-.9,-.9,-.9,-.9]);
  assert.deepEqual(puppyPose(4,200,{ziplining:true,reducedMotion:true}).legs,[-2.65,.25,-2.65,.25]);
});
test("pose is deterministic so frozen animation time stays frozen on pause",()=>{
  assert.deepEqual(puppyPose(12,345),puppyPose(12,345));
  assert.equal(puppyPose(.08,0).blink,.12);
  assert.equal(puppyPose(1,0).blink,1);
});
