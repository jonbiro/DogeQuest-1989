import test from 'node:test';
import assert from 'node:assert/strict';
import {createPracticeRun,createZiplinePracticeRun,stepPractice,practiceCue,practiceProgress,practiceResult} from '../src/runner/practice.js';
import {act} from '../src/runner/world.js';
import {bankRun} from '../src/runner/rewards.js';
test('practice completes without penalties even when every lesson is missed',()=>{
  const run=createPracticeRun();
  for(let i=0;i<1500&&!run.ended;i++)stepPractice(run,1/120);
  assert.equal(run.ended,true);assert.equal(run.hearts,3);assert.equal(run.practice.correct,0);
  assert.equal(run.practice.outcomes.length,3);assert.equal(run.fetchCharge,0);
  assert.equal(bankRun({},run,[]),null);
});
test('practice teaches actual jump, slide and steering at every upgrade level',()=>{
  for(let level=0;level<=3;level++) {
    const run=createPracticeRun({leap:level,slide:level});const used=new Set();
    while(!run.ended) {
      const index=run.practice.index;
      if(index<2&&[35,75][index]-run.distance<3&&!used.has(index)){act(run,index===0?'jump':'slide');used.add(index);}
      if(index===2&&!used.has(index)){act(run,'left');used.add(index);}
      stepPractice(run,1/120);
    }
    assert.equal(run.practice.correct,3);assert.deepEqual(run.practice.outcomes,[true,true,true]);
    assert.equal(run.hearts,3);assert.equal(run.speed,12);
    assert.ok(!run.objects.some(o=>o.type.startsWith('corner')||o.type==='gift'));
  }
});
test('practice prompts distinguish preparation and timing without stacked notices',()=>{
  const run=createPracticeRun();assert.match(practiceCue(run),/1\/3.*Logs ahead.*wait/);
  run.distance=32;assert.match(practiceCue(run),/JUMP NOW/);
  run.practice.index=2;assert.match(practiceCue(run),/Steer.*left/);
});

test('practice acknowledges moves and their result instead of asking for duplicate input',()=>{
  const run=createPracticeRun();
  while(run.distance<30)stepPractice(run,1/120);
  act(run,'jump');assert.match(practiceCue(run),/Jumping/);assert.doesNotMatch(practiceCue(run),/NOW/);
  while(run.practice.index===0)stepPractice(run,1/120);
  assert.equal(practiceCue(run),'✓ Jump cleared');
  const feedback=practiceCue(run);assert.equal(practiceCue(run),feedback,'rendering does not consume the feedback');
  while(run.practice.feedback.until>run.time)stepPractice(run,1/120);
  assert.match(practiceCue(run),/Gates ahead.*wait/);
  while(run.distance<70)stepPractice(run,1/120);
  act(run,'slide');assert.match(practiceCue(run),/Sliding/);
  while(run.practice.index===1)stepPractice(run,1/120);
  assert.equal(practiceCue(run),'✓ Slide cleared');
});

test('practice gives collision-specific coaching for early moves and missing inputs',()=>{
  for(const early of [false,true]) {
    const run=createPracticeRun();const cues=[];let previous=0;
    while(!run.ended) {
      if(early && !cues.length && run.distance>=26 && run.distance<26.1)act(run,'jump');
      if(early && run.practice.index===1 && run.distance>=65.4 && run.distance<65.5)act(run,'slide');
      stepPractice(run,1/120);
      if(run.practice.index!==previous){cues.push(practiceCue(run));previous=run.practice.index;}
    }
    assert.deepEqual(run.practice.outcomes,[false,false,false]);
    assert.deepEqual(cues,early ? ['Jump later · nearer the log','Slide later · nearer the gate','Steer left into the open lane']
      : ['Use ↑ to jump over logs','Use ↓ to slide under gates','Steer left into the open lane']);
  }
});

test('a response delay after the actual practice cues still clears all three lessons',()=>{
  for(const delay of [0,.1,.2,.3])for(const level of [0,3]) {
    const run=createPracticeRun({leap:level,slide:level}),plans=new Map(),used=new Set();
    while(!run.ended) {
      const index=run.practice.index,cue=practiceCue(run);
      if(index<2&&/NOW/.test(cue)&&!plans.has(index))plans.set(index,run.time+delay);
      if(index<2&&run.time>=plans.get(index)&&!used.has(index)){act(run,index===0?'jump':'slide');used.add(index);}
      if(index===2&&!used.has(index)){act(run,'left');used.add(index);}
      stepPractice(run,1/120);
    }
    assert.deepEqual(run.practice.outcomes,[true,true,true],`delay ${delay}, level ${level}`);
  }
});

test('missing the practice cable offers a quick retry without collecting unreachable bones or banking',()=>{
  const run=createZiplinePracticeRun();
  assert.equal(run.distance-run.practice.start,0);
  assert.equal(run.previous.distance,run.distance,'first render must not interpolate from the start of the adventure');
  assert.match(practiceCue(run),/wait for jump cue/);
  for(let i=0;i<500&&!run.ended;i++)stepPractice(run,1/120);
  assert.equal(run.ended,true);assert.ok(run.time<4);
  assert.equal(run.bones,0);assert.equal(run.ziplines,0);assert.equal(run.hearts,3);
  assert.deepEqual(run.practice.outcomes,[false,false,false]);
  assert.match(practiceResult(run).lesson,/only.*riding the cable/);
  assert.equal(bankRun({},run,[]),null);
});
test('zipline practice uses real catch, steering, collection and automatic landing at all jump levels',()=>{
  for(let level=0;level<=3;level++) {
    const run=createZiplinePracticeRun({leap:level});let nextInput=0;
    for(let i=0;i<2300&&!run.ended;i++) {
      if(run.time>=nextInput) {
        const cue=practiceCue(run);
        if(cue==='↑ JUMP · ZIPLINE')act(run,'jump');
        else if(/(BONES|GIFT) LEFT/.test(cue))act(run,'left');
        else if(/(BONES|GIFT) RIGHT/.test(cue))act(run,'right');
        nextInput=run.time+.15;
      }
      stepPractice(run,1/120);
    }
    assert.equal(run.ended,true);assert.equal(run.bones,18);assert.equal(run.ziplines,1);
    assert.equal(run.hearts,3);assert.equal(run.y,0);assert.equal(run.fetchCharge,0);
    assert.deepEqual(run.practice.outcomes,[true,true,true]);
    assert.match(practiceProgress(run),/18\/18.*landed/);
    assert.match(practiceResult(run).lesson,/Every high bone collected/);
    assert.equal(bankRun({},run,[]),null);
  }
});
