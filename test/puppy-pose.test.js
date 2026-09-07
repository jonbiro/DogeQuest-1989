import test from "node:test";
import assert from "node:assert/strict";
import {puppyPose,smoothLegAngles} from "../src/runner/puppy-pose.js";
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
  assert.deepEqual(puppyPose(4,200,{reducedMotion:true,airborne:true}).legs,[-.65,.5,-.65,.5]);
  assert.deepEqual(puppyPose(4,200,{sliding:true}).legs,[-.9,-.9,-.9,-.9]);
  assert.deepEqual(puppyPose(4,200,{ziplining:true,reducedMotion:true}).legs,[-2.65,.25,-2.65,.25]);
});
test("jump and hanging poses pair front paws and rear paws symmetrically",()=>{
  for(const options of [{airborne:true},{ziplining:true}]) {
    const {legs}=puppyPose(1,30,options);
    assert.equal(legs[0],legs[2]);assert.equal(legs[1],legs[3]);
    assert.notEqual(legs[0],legs[1]);
  }
});
test("leg transitions are frame-rate independent, bounded and stop with zero time",()=>{
  const start=[.7,-.7,-.7,.7],target=[-2.65,.25,-2.65,.25];
  assert.deepEqual(smoothLegAngles(start,target,0),start);
  const whole=smoothLegAngles(start,target,1/30);
  let split=start;
  for(let i=0;i<4;i++)split=smoothLegAngles(split,target,1/120);
  whole.forEach((angle,i)=>{
    assert.ok(Math.abs(angle-split[i])<1e-12);
    assert.ok(angle>=Math.min(start[i],target[i])&&angle<=Math.max(start[i],target[i]));
    assert.notEqual(angle,target[i]);
  });
});
test("pose is deterministic so frozen animation time stays frozen on pause",()=>{
  assert.deepEqual(puppyPose(12,345),puppyPose(12,345));
  assert.equal(puppyPose(.08,0).blink,.12);
  assert.equal(puppyPose(1,0).blink,1);
});
