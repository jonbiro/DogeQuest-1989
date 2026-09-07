import test from "node:test";
import assert from "node:assert/strict";
import {createRun,step,HAZARDS} from "../src/runner/world.js";
function advance(run,seconds){for(let i=0;i<seconds*120;i++)step(run,1/120);}
function fixture(){const r=createRun(1);r.objects=[];r.nextRow=99999;return r;}
test("tennis ball activates once; speed ramps smoothly and returns after expiry",()=>{
  const r=fixture();r.objects=[{id:1,type:"zoomies",lane:1,at:2}];
  advance(r,.2);assert.ok(r.zoomies>5.8);assert.ok(r.speed>22&&r.speed<28.6);
  advance(r,1);assert.ok(r.speed>28);
  advance(r,6);assert.equal(r.zoomies,0);
  assert.ok(Math.abs(r.speed-Math.min(36,22+r.distance/90))<.2);
});
test("zoomies smashes all obstacle types once without consuming shield",()=>{
  for(const type of HAZARDS.filter(type=>type!=="gap")){
    const r=fixture();r.zoomies=2;r.shield=1;r.objects=[{id:1,type,lane:1,at:2}];
    advance(r,.5);assert.equal(r.hearts,3);assert.equal(r.shield,1);
    assert.equal(r.smashes,1);assert.equal(r.bonusPoints,40);
    assert.equal(r.clears,0,"Smashing does not count as a skilled jump or slide");
    advance(r,.5);assert.equal(r.smashes,1);
  }
});
test("expiry grants short recovery, then collisions become dangerous again",()=>{
  const r=fixture();r.zoomies=.02;r.objects=[{id:1,type:"rock",lane:1,at:2}];
  advance(r,.3);assert.equal(r.hearts,3);assert.equal(r.smashes,0);
  advance(r,1.3);r.objects=[{id:2,type:"rock",lane:1,at:r.distance+2}];
  advance(r,.3);assert.equal(r.hearts,2);
});
test("zoomies combines with magnet and double points without changing their timers",()=>{
  const r=fixture();r.zoomies=2;r.magnet=2;r.double=2;
  r.objects=[{id:1,type:"bone",lane:0,at:10}];advance(r,.4);
  assert.equal(r.bones,1);assert.equal(r.bonePoints,50);
  assert.ok(Math.abs(r.magnet-r.zoomies)<1e-9);
});
