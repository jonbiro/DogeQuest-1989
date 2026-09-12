import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,act,step} from '../src/runner/world.js';
import {mistakeDetail,timingLesson} from '../src/runner/mistakes.js';
import {runLesson} from '../src/runner/guidance.js';

function collision(type,setup=()=>{}) {
  const run=createRun(1989);
  run.objects=[{id:1,type,lane:1,at:1,used:false}];
  run.nextRow=1000;setup(run);
  for(let i=0;i<12 && !run.lastMistake;i++)step(run,1/120);
  assert.equal(run.lastMistake?.type,type);
  return run;
}
test('actual collisions retain specific late-jump and wrong-action coaching',()=>{
  const late=collision('rock',run=>act(run,'jump'));
  assert.equal(late.lastMistakeDetail.reason,'late-jump');
  assert.match(runLesson(late),/little earlier/);
  const slid=collision('log',run=>act(run,'slide'));
  assert.equal(slid.lastMistakeDetail.reason,'slid');
  const overhead=collision('gate',run=>act(run,'jump'));
  assert.equal(overhead.lastMistakeDetail.reason,'jumped');
});
test('coaching distinguishes early landing, cancelled jumps and expired slides',()=>{
  const run=createRun(1);run.time=10;run.distance=121.8;
  run.y=.3;run.vy=-3;
  assert.deepEqual(mistakeDetail(run,{type:'log'}),{reason:'early-jump',distance:121});
  run.diving=true;assert.equal(mistakeDetail(run,{type:'gap'}).reason,'cancelled-jump');
  assert.equal(mistakeDetail(run,{type:'arch'}).reason,'late-dive');
  run.y=0;run.diving=false;run.slideExpiredAt=9.8;
  assert.equal(mistakeDetail(run,{type:'gate'}).reason,'early-slide');
  run.slideExpiredAt=5;assert.equal(mistakeDetail(run,{type:'gate'}).reason,'missed');
  run.landing={time:9.9};assert.equal(mistakeDetail(run,{type:'log'}).reason,'early-jump');
  run.landing.time=8;assert.equal(mistakeDetail(run,{type:'log'}).reason,'missed');
});
test('missed actions keep general lessons and fresh runs reset collision evidence',()=>{
  const run=collision('log');assert.equal(run.lastMistakeDetail.reason,'missed');
  assert.match(runLesson(run),/low obstacle/);
  assert.equal(timingLesson(null),'');
  assert.equal(createRun(1).lastMistakeDetail,null);
  assert.equal(createRun(1).slideExpiredAt,null);
});

test('only naturally expired slides produce early-slide evidence',()=>{
  const run=createRun(1);run.objects=[];run.nextRow=1000;
  act(run,'slide');
  for(let i=0;i<75;i++)step(run,1/120);
  assert.ok(run.slideExpiredAt>0);
  assert.equal(mistakeDetail(run,{type:'gate'}).reason,'early-slide');
  act(run,'jump');assert.equal(run.slideExpiredAt,null);
  const cancelled=createRun(1);act(cancelled,'slide');act(cancelled,'jump');
  assert.equal(cancelled.slideExpiredAt,null);
});

test('course collisions distinguish a late correct lane from a missed lane choice',()=>{
  for(const safeLane of [0,1,2])for(const choseCorrectly of [false,true]) {
    const run=collision('rock',run=>{
      const from=safeLane===1?0:1;
      run.lane=from;run.x=(from-1)*2.4;run.objects[0].lane=from;
      run.objects[0].courseRegion=2;
      run.objects[0].at=0;
      run.course={end:100,checked:0,clean:0,region:2,beats:[{at:0,type:'rock',safeLane}]};
      if(choseCorrectly)act(run,safeLane<from?'left':'right');
    });
    assert.equal(run.lastMistake.safeLane,safeLane);
    assert.equal(run.lastMistakeDetail.reason,choseCorrectly?'late-weave':'missed');
    assert.match(runLesson(run),choseCorrectly?/chose the open lane.*too late/:/Each swipe moves one lane/);
    run.lane=1;run.distance+=100;
    assert.match(runLesson(run),choseCorrectly?/too late/:/Each swipe/,'coaching uses captured collision evidence');
  }
  const run=createRun(1);run.lane=0;
  assert.equal(mistakeDetail(run,{type:'rock',courseWeave:true}).reason,'missed','unknown safe lane must not imply late steering');
});
