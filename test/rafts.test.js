import test from 'node:test';
import assert from 'node:assert/strict';
import {raftAt,raftByIndex,raftIntersecting,raftCurrent,steerRaft,clearRaftGroundActions,RAFT_BANK_LIMIT,advanceRaft,moveRaft,RAFT_REWARD} from '../src/runner/rafts.js';
import {cornerIntersecting} from '../src/runner/turns.js';
import {ZIPLINE_FIRST,ZIPLINE_PERIOD,ZIPLINE_LENGTH} from '../src/runner/ziplines.js';
import {createRun,fillTrack,step,act} from '../src/runner/world.js';
import {actionCue} from '../src/runner/guidance.js';

test('prototype river uses actual controls, collisions and reward collection at base and upgraded speeds',()=>{
  for(const hz of [24,60,120])for(const boosted of [false,true])for(const challenge of [false,true]){
    const run=createRun(1989,boosted?{leap:3,slide:3,magnet:3,value:3}:{});
    Object.assign(run,{raftPrototype:true,distance:1090,nextRow:1090,objects:[],nextChoice:1750,nextZipline:2050,
      course:null,route:{kind:challenge?'challenge':'scenic',until:1270},zoomies:boosted?10:0});
    run.previous.distance=run.distance;fillTrack(run);
    const rocks=run.objects.filter(object=>object.raftHazard);
    assert.equal(rocks.length,challenge?6:3);
    assert.ok(run.objects.filter(o=>o.at>=1105&&o.at<=1325).every(o=>o.raftHazard||o.raftPickup));
    let boarded=false;
    for(let frame=0;frame<hz*12&&run.distance<1320;frame++){
      // Follow real directional hints; ×2 naturally requires a second input.
      const cue=actionCue(run);
      if(cue.includes('←'))act(run,'left');
      if(cue.includes('→'))act(run,'right');
      if(run.raft){
        boarded=true;act(run,'jump');act(run,'slide');
        assert.equal(run.vy,0);assert.equal(run.slide,0);
      }
      step(run,1/hz);
    }
    assert.ok(boarded);assert.equal(run.rafts,1);assert.equal(run.raft,null);
    assert.equal(run.hearts,3);assert.ok(run.bones>=9,`reachable bones at ${hz} Hz`);
    assert.equal(run.gifts,1);assert.equal(run.jumpBuffer,0);assert.equal(run.slideNext,0);
  }
});

test('ordinary version-three runs do not silently enable prototype river encounters',()=>{
  const run=createRun(1989);
  Object.assign(run,{distance:1090,nextRow:1090,objects:[],nextChoice:1750,nextZipline:2050});
  fillTrack(run);assert.ok(run.objects.every(object=>!object.raftHazard&&!object.raftPickup));
});

test('river obstacles use normal damage and shields, while magnets collect the reachable bone line',()=>{
  for(const shield of [0,1]){
    const run=createRun(1989);
    Object.assign(run,{raftPrototype:true,distance:1090,nextRow:1090,objects:[],nextChoice:1750,nextZipline:2050,
      course:null,route:{kind:'scenic',until:1270},shield,magnet:20});
    run.previous.distance=run.distance;fillTrack(run);
    for(let frame=0;frame<1200&&run.distance<1320;frame++)step(run,1/120);
    assert.equal(run.rafts,1);assert.equal(run.hearts,shield?3:2);
    assert.equal(run.shield,0);assert.equal(run.bones,12);
  }
});

test('raft lifecycle boards and rewards exactly once without leaking queued ground actions',()=>{
  const run=createRun(1989);run.time=40;run.y=2;run.jumpBuffer=.3;run.slideNext=.7;
  assert.equal(advanceRaft(run,1149.8,1150.1),'entered');
  assert.equal(run.raft.boardingHeight,2);assert.equal(run.raft.boardedAt,40);
  assert.equal(run.jumpBuffer,0);assert.equal(run.slideNext,0);
  assert.equal(advanceRaft(run,1150.1,1151),'riding');
  assert.equal(advanceRaft(run,1289.9,1290),'exited');
  assert.equal(run.raft,null);assert.equal(run.rafts,1);assert.equal(run.bonusPoints,RAFT_REWARD);
  assert.equal(run.invulnerable,1.2);
  assert.equal(advanceRaft(run,1289.9,1290),null);
  assert.equal(advanceRaft(run,1149.8,1150.1),null,'same entry cannot be replayed');
  assert.equal(run.events.filter(e=>e==='raft-start').length,1);
  assert.equal(run.events.filter(e=>e==='raft-end').length,1);
});

test('teleports, ended runs and another traversal cannot award a raft ride',()=>{
  for(const configure of [run=>{run.ended=true;},run=>{run.zipline={end:1400};}]){
    const run=createRun(1989);configure(run);
    assert.equal(advanceRaft(run,1149,1151),null);assert.equal(run.bonusPoints,0);
  }
  const run=createRun(1989);
  assert.equal(advanceRaft(run,1150,1150),null,'paused intervals cannot board');
  assert.equal(advanceRaft(run,1100,1300),null);
  assert.equal(advanceRaft(run,1160,1170),null,'restored mid-river positions do not create a boarding event');
  assert.equal(advanceRaft(run,1149,1151),'entered');
  assert.equal(advanceRaft(run,1300,1301),'aborted');
  assert.equal(run.bonusPoints,0);assert.equal(run.rafts,undefined);
});

test('raft motion clears ground actions but pause and ended states preserve the frozen pose',()=>{
  const run=createRun(1989);advanceRaft(run,1149,1151);run.distance=1200;
  run.jumpBuffer=.3;run.slide=.5;
  assert.equal(moveRaft(run,2.4,1/60),true);assert.ok(run.x>0);
  assert.equal(run.jumpBuffer,0);assert.equal(run.slide,0);
  const pose={x:run.x,vx:run.vx};
  assert.equal(moveRaft(run,-2.4,0),false);
  run.ended=true;assert.equal(moveRaft(run,-2.4,1/60),false);
  assert.deepEqual({x:run.x,vx:run.vx},pose);
});

test('raft windows reserve entry and recovery without corners, choices or cables',()=>{
  for(let index=0;index<100;index++){
    const raft=raftByIndex(index);
    assert.equal(raftAt(raft.start).index,index);
    assert.equal(raftAt(raft.end),null);
    assert.equal(raftIntersecting(raft.approach-1,raft.approach).index,index);
    assert.equal(raftIntersecting(raft.recovery,raft.recovery+1).index,index);
    assert.equal(raftIntersecting(raft.recovery+1,raft.recovery+2),null);
    assert.equal(cornerIntersecting(raft.approach,raft.recovery),null);
    for(let at=350;at<raft.recovery+45;at+=700)
      assert.ok(at+45<raft.approach||at-45>raft.recovery,'choice clearance');
    for(let at=ZIPLINE_FIRST;at<raft.recovery+45;at+=ZIPLINE_PERIOD)
      assert.ok(at+ZIPLINE_LENGTH+45<raft.approach||at-45>raft.recovery,'zipline clearance');
  }
  for(const value of [NaN,Infinity,-1])assert.equal(raftAt(value),null);
  assert.equal(raftByIndex(.5),null);assert.equal(raftIntersecting(5,4),null);
  assert.equal(raftIntersecting(Number.MAX_VALUE,Number.MAX_VALUE),null);
  assert.equal(raftAt(Number.MAX_VALUE),null);
});

test('raft steering preserves momentum and matches 24, 60 and 120 Hz integration',()=>{
  const results=[];
  for(const hz of [24,60,120]){
    const body={x:-2.4,vx:0};let peak=-Infinity;
    for(let i=0;i<hz;i++){steerRaft(body,2.4,1/hz);peak=Math.max(peak,body.x);}
    assert.ok(peak>2.45&&peak<RAFT_BANK_LIMIT,'controlled drift beyond target');
    assert.ok(Math.abs(body.x-2.4)<.03,'settles to intended lane');
    results.push({...body});
  }
  for(const body of results){assert.ok(Math.abs(body.x-results[0].x)<1e-10);assert.ok(Math.abs(body.vx-results[0].vx)<1e-10);}
});

test('raft banks bound rapid steering reversals and currents ease at shores',()=>{
  const body={x:0,vx:0};
  for(let i=0;i<24000;i++){
    steerRaft(body,(Math.floor(i/19)%2?1:-1)*2.4+raftCurrent(1150+i/120*36),1/120);
    assert.ok(Number.isFinite(body.x)&&Number.isFinite(body.vx));
    assert.ok(Math.abs(body.x)<=RAFT_BANK_LIMIT);
  }
  assert.equal(raftCurrent(1150),0);assert.equal(raftCurrent(1290),0);
  for(const distance of [1150.001,1289.999])assert.ok(Math.abs(raftCurrent(distance))<1e-8);
  for(let distance=1150;distance<1290;distance+=.1)assert.ok(Math.abs(raftCurrent(distance))<=.22);
});

test('shore action reset does not remove earned progress or active powers',()=>{
  const run={y:3,vy:14,slide:.5,slideNext:.6,jumpBuffer:.3,diving:true,slideExpiredAt:7,
    bones:25,score:700,magnet:4,shield:1,zoomies:3,hearts:2,credits:800};
  clearRaftGroundActions(run);
  for(const key of ['y','vy','slide','slideNext','jumpBuffer'])assert.equal(run[key],0);
  assert.equal(run.diving,false);assert.equal(run.slideExpiredAt,null);
  assert.deepEqual([run.bones,run.score,run.magnet,run.shield,run.zoomies,run.hearts,run.credits],[25,700,4,1,3,2,800]);
});
