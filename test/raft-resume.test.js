import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,step,act} from '../src/runner/world.js';
import {resumeStep,RESUME_DURATION} from '../src/runner/resume.js';

function resumedRun(start,fps){
  const run=createRun(1989);
  Object.assign(run,{raftPrototype:true,distance:start,raft:{index:0,start:1150,end:1290},objects:[],
    nextRow:Infinity,resumeRemaining:RESUME_DURATION});
  run.previous.distance=start;act(run,'left');act(run,'jump');act(run,'slide');
  let accumulator=0;
  for(let frame=0;frame<fps;frame++){
    accumulator+=resumeStep(run,1/fps);
    while(accumulator+1e-12>=1/120){step(run,1/120);accumulator-=1/120;}
  }
  return run;
}
test('raft recovery preserves fixed-step motion across display rates without queued ground actions',()=>{
  const runs=[24,30,60,120].map(fps=>resumedRun(1150,fps));
  for(const run of runs){
    assert.ok(run.raft);assert.equal(run.hearts,3);assert.equal(run.resumeRemaining,0);
    assert.equal(run.y,0);assert.equal(run.jumpBuffer,0);assert.equal(run.slideNext,0);
    assert.ok(run.distance>1165&&run.distance<1175,'recovery progresses gently rather than freezing or running at full speed');
    assert.ok(Math.abs(run.distance-runs[0].distance)<1e-8);
    assert.ok(Math.abs(run.x-runs[0].x)<1e-8);
  }
});
test('resuming at the shore grants one crossing bonus without a buffered jump or slide',()=>{
  for(const fps of [24,30,60,120]){
    const run=resumedRun(1289.9,fps);
    assert.equal(run.raft,null);assert.equal(run.rafts,1);assert.equal(run.bonusPoints,250);
    assert.equal(run.y,0);assert.equal(run.slide,0);assert.equal(run.jumpBuffer,0);
    assert.equal(run.events.filter(e=>e==='raft-end').length,1);
  }
});
