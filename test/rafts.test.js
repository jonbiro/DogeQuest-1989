import test from 'node:test';
import assert from 'node:assert/strict';
import {raftAt,raftByIndex,raftIntersecting,raftCurrent,steerRaft,clearRaftGroundActions,RAFT_BANK_LIMIT} from '../src/runner/rafts.js';
import {cornerIntersecting} from '../src/runner/turns.js';
import {ZIPLINE_FIRST,ZIPLINE_PERIOD,ZIPLINE_LENGTH} from '../src/runner/ziplines.js';

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
