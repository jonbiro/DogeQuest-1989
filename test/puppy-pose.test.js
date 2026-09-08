import test from "node:test";
import assert from "node:assert/strict";
import {puppyPose,smoothLegAngles,bodyMotion,mochiCrouch} from "../src/runner/puppy-pose.js";

test('Mochi crouches with folded paired legs and preserves body volume',()=>{
  const standing=mochiCrouch(0),sliding=mochiCrouch(1);
  assert.equal(standing.scaleY,1);assert.equal(standing.lowering,0);
  assert.equal(sliding.scaleY,.65);assert.equal(sliding.lowering,.24);
  assert.ok(sliding.scaleZ>1);
  assert.equal(sliding.legs[0],sliding.legs[2]);
  assert.equal(sliding.legs[1],sliding.legs[3]);
  assert.ok(sliding.legs[0]<0&&sliding.legs[1]>0);
  for(const value of [-10,0,.25,.5,1,10,NaN,Infinity]) {
    const p=mochiCrouch(value);
    assert.ok(p.amount>=0&&p.amount<=1);
    assert.ok(p.scaleY>=.65&&p.scaleY<=1);
    assert.ok(p.lowering>=0&&p.lowering<=.24);
    assert.deepEqual(p,mochiCrouch(value));
  }
});
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

test("body weight follows velocity and landing impact without unbounded or reduced-motion bounce",()=>{
  assert.ok(bodyMotion({vx:12}).lean<0);
  assert.ok(bodyMotion({vx:-12}).lean>0);
  assert.ok(bodyMotion({vy:12}).pitch>0);
  assert.ok(bodyMotion({vy:-20}).pitch<0);
  const landing={time:5,speed:22};
  const options={time:5.08,landing};
  const weight=bodyMotion(options);
  assert.ok(weight.compression>0 && weight.compression<.1);
  assert.deepEqual(bodyMotion(options),weight,'a frozen timestamp must keep the same pose');
  assert.ok(bodyMotion({...options,landing:{...landing,speed:5}}).compression<weight.compression);
  for(const extra of [{y:2},{time:5.3},{time:4.9},{ziplining:true}])
    assert.equal(bodyMotion({...options,...extra}).compression,0);
  assert.deepEqual(bodyMotion({...options,vx:20,vy:-28,reducedMotion:true}),{lean:0,pitch:0,compression:0});
  for(const vx of [-100,0,100])for(const vy of [-100,0,100]) {
    const pose=bodyMotion({vx,vy,...options});
    assert.ok(Math.abs(pose.lean)<=.23 && Math.abs(pose.pitch)<=.16);
  }
});
