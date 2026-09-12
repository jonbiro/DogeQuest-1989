import test from 'node:test';
import assert from 'node:assert/strict';
import {createWeavePracticeRun,stepPractice,practiceCue,practiceResult,practiceProgress,practiceOffer} from '../src/runner/practice.js';
import {createRun,act,step} from '../src/runner/world.js';
import {bankRun} from '../src/runner/rewards.js';
import {runLesson} from '../src/runner/guidance.js';

test('weave rehearsal teaches two two-swipe moves and one adjacent move without banking',()=>{
  for(const leap of [0,3]) {
    const run=createWeavePracticeRun({leap});let last='',pending=[],inputs=0;
    while(!run.ended) {
      const cue=practiceCue(run);
      if(cue!==last){last=cue;if(cue.includes('WEAVE'))pending.push({at:run.time+.15,action:cue.includes('←')?'left':'right'});}
      while(pending.length&&pending[0].at<=run.time){act(run,pending.shift().action);inputs++;}
      stepPractice(run,1/120);assert.equal(run.hearts,3);
    }
    assert.equal(inputs,5);assert.deepEqual(run.practice.outcomes,[true,true,true]);
    assert.equal(practiceProgress(run),'3/3 weaves cleared');
    assert.match(practiceResult(run).lesson,/Two quick swipes/);
    assert.equal(bankRun({},run,[]),null);
    assert.ok(run.time<10);
  }
});
test('unanswered weaves finish safely and explain two swipes',()=>{
  const run=createWeavePracticeRun();
  while(!run.ended)stepPractice(run,1/30);
  assert.equal(run.hearts,3);assert.equal(run.practice.correct,1);
  assert.match(practiceResult(run).lesson,/two separate swipes/);
  assert.equal(bankRun({},run,[]),null);
});
test('actual course-rock collisions preserve evidence for contextual practice and coaching',()=>{
  for(const courseRegion of [undefined,0,1,2]) {
    const run=createRun(1989);run.hearts=1;run.objects=[{id:999,type:'rock',lane:1,at:1,courseRegion}];run.nextRow=Infinity;
    while(!run.ended)step(run,1/120);
    const course=courseRegion!==undefined;
    assert.equal(practiceOffer(run).kind,course?'weave':'moves');
    if(course)assert.match(runLesson(run),/Each swipe moves one lane/);
    else assert.deepEqual(run.lastMistake,{type:'rock'});
  }
});
