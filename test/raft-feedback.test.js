import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,step} from '../src/runner/world.js';
import {runLesson,eventNotice} from '../src/runner/guidance.js';

for(const late of [false,true])test(`real raft collision gives steering advice, late=${late}`,()=>{
  const run=createRun(1989);
  Object.assign(run,{raftPrototype:true,distance:1184.9,raft:{index:0,start:1150,end:1290},
    lane:late?0:1,x:0,vx:0,nextRow:Infinity,objects:[{id:1,type:'rock',lane:1,at:1185,used:false,raftHazard:true,raftSafeLane:0}]});
  for(let i=0;i<4;i++)step(run,1/120);
  assert.equal(run.hearts,2);assert.equal(run.lastMistake.raftHazard,true);
  assert.equal(run.lastMistakeDetail.reason,late?'late-raft-steer':'raft-lane');
  run.raft=null; // Advice must remain correct after leaving the river.
  const lesson=runLesson(run);
  assert.match(lesson,late?/drifting/:/open lane/);
  assert.match(lesson,/Jump and slide return at the shore/);
  assert.doesNotMatch(lesson,/Jump shortly|Swipe up/);
});
test('river completion uses the quiet notice dock while boarding adds no banner',()=>{
  assert.equal(eventNotice('raft-start',createRun(1)),null);
  assert.deepEqual(eventNotice('raft-end',createRun(1)),{text:'Shore reached · +250',priority:1});
});
