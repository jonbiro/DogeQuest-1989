import test from "node:test";
import assert from "node:assert/strict";
import {createRun,act,step,fillTrack} from "../src/runner/world.js";
function advance(run,seconds){for(let i=0;i<seconds*120;i++)step(run,1/120);}
function fixture(speed=22,lead=.5){
  const r=createRun(1);r.distance=speed===36?2000:0;r.speed=speed;r.nextRow=99999;
  r.objects=[0,1,2].map(lane=>({id:lane,type:"gap",lane,at:r.distance+speed*lead}));return r;
}
test("gaps can be jumped at starting and maximum speed with useful reaction margin",()=>{
  for(const speed of [22,36])for(const lead of [.25,.45,.7,.9]){
    const r=fixture(speed,lead);act(r,"jump");advance(r,1.2);
    assert.equal(r.hearts,3,`${speed}m/s and ${lead}s lead`);assert.equal(r.clears,1);
  }
});
test("running or sliding into a gap costs one heart; shield rescues once",()=>{
  for(const action of [null,"slide"]){const r=fixture();if(action)act(r,action);advance(r,1);assert.equal(r.hearts,2);assert.equal(r.clears,0);}
  const r=fixture();r.shield=1;advance(r,1);assert.equal(r.hearts,3);assert.equal(r.shield,0);
});
test("Zoomies visibly jumps gaps and never calls them smashed obstacles",()=>{
  const r=fixture(36);r.zoomies=2;advance(r,.4);assert.ok(r.y>0);advance(r,.6);
  assert.equal(r.hearts,3);assert.equal(r.clears,1);assert.equal(r.smashes,0);
});
test("generated gaps align to paving tiles and preserve full-width jump rows",()=>{
  let count=0;
  for(let seed=0;seed<20;seed++){
    const r=createRun(seed);
    for(let distance=0;distance<2000;distance+=150){r.distance=distance;fillTrack(r);
      for(const gap of r.objects.filter(o=>o.type==="gap")){
        assert.equal(gap.at%5,0);assert.equal(r.objects.filter(o=>o.at===gap.at&&o.type==="gap").length,3);count++;
      }
      r.objects=r.objects.filter(o=>o.at>distance);
    }
  }
  assert.ok(count>0);
});
