import test from "node:test";
import assert from "node:assert/strict";
import {createRun,step,fillTrack,LANES,HAZARDS} from "../src/runner/world.js";
function choose(lane){
  const r=createRun(8);r.distance=349.9;r.nextRow=320;r.objects=[];
  fillTrack(r);r.lane=lane;r.x=LANES[lane];step(r,1/120);return r;
}
test("gates stop future generation until the player commits, with a clear approach",()=>{
  const r=createRun(8);r.distance=250;fillTrack(r);
  assert.equal(r.choicePending,350);
  assert.equal(r.objects.filter(o=>o.type.startsWith("choice-")).length,2);
  assert.ok(r.objects.filter(o=>HAZARDS.includes(o.type)).every(o=>o.at<305));
  const count=r.objects.length;fillTrack(r);assert.equal(r.objects.length,count);
});
test("actual lane position selects challenge, with scenic as safe center default",()=>{
  for(const lane of [0,1,2]){
    const r=choose(lane);assert.equal(r.route.kind,lane===2?"challenge":"scenic");
    assert.equal(r.routeChoices,1);assert.equal(r.nextChoice,1050);
    assert.equal(r.route.until,570);assert.equal(r.choicePending,null);
    step(r,1/120);assert.equal(r.routeChoices,1);
  }
});
test("route choice changes obstacle density and locks skill rewards onto generated objects",()=>{
  const scenic=choose(0),challenge=choose(2);
  const hazards=r=>r.objects.filter(o=>HAZARDS.includes(o.type));
  assert.ok(hazards(challenge).length>hazards(scenic).length);
  assert.ok(hazards(scenic).every(o=>hazards(scenic).filter(other=>other.at===o.at).length===1));
  assert.ok(hazards(challenge).every(o=>o.skillReward===60));
  assert.ok(hazards(scenic).every(o=>o.skillReward===20));
  assert.ok(hazards(challenge).every(o=>o.at>=390));
});
test("clean challenge clears pay 60 once while ordinary clears keep their baseline",()=>{
  const r=choose(2);r.objects=[{id:1000,type:"gate",lane:2,at:r.distance+.1,skillReward:60}];r.nextRow=99999;r.choicePending=99999;r.slide=1;
  for(let i=0;i<30;i++)step(r,1/120);
  assert.equal(r.clears,1);assert.equal(r.bonusPoints,60);
});
