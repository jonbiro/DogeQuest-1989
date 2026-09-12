import test from 'node:test';
import assert from 'node:assert/strict';
import {RESUME_DURATION,resumeStep} from '../src/runner/resume.js';
import {createRun,step} from '../src/runner/world.js';

test('resume eases monotonically back to speed and is independent of display refresh rate',()=>{
  const totals=[];
  for(const hz of [30,60,120]) {
    const run={resumeRemaining:RESUME_DURATION};
    let total=0,previous=0;
    for(let i=0;i<hz*2;i++) {
      const dt=resumeStep(run,1/hz),scale=dt*hz;
      assert.ok(scale>=.15-1e-9 && scale<=1+1e-9);
      assert.ok(scale>=previous-1e-9);
      previous=scale;total+=dt;
    }
    assert.equal(run.resumeRemaining,0);
    totals.push(total);
  }
  for(const total of totals) assert.ok(Math.abs(total-(2-.9*.425))<1e-9);
});
test('fresh runs stay at normal speed and invalid frames do not advance recovery',()=>{
  const run=createRun(1);
  assert.equal(resumeStep(run,.02),.02);
  run.resumeRemaining=.9;
  for(const dt of [0,-1,NaN,Infinity]) assert.equal(resumeStep(run,dt),0);
  assert.equal(run.resumeRemaining,.9);
  assert.ok(resumeStep(run,1.5)>1);
  assert.equal(run.resumeRemaining,0);
});
test('resume scales the entire simulation instead of spending powers during the slow return',()=>{
  const run=createRun(1),reference=createRun(1);
  for(const candidate of [run,reference]) Object.assign(candidate,{
    nextRow:Infinity,objects:[],magnet:10,double:10,slide:.5,
  });
  run.resumeRemaining=RESUME_DURATION;
  let accumulator=0,ticks=0;
  for(let i=0;i<30;i++) {
    accumulator+=resumeStep(run,1/60);
    while(accumulator>=1/120){step(run,1/120);accumulator-=1/120;ticks++;}
  }
  for(let i=0;i<ticks;i++) step(reference,1/120);
  for(const key of ['distance','time','magnet','double','slide','hearts'])
    assert.equal(run[key],reference[key]);
  assert.ok(run.time<.25);
  assert.ok(run.slide>0);
});
