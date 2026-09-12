import test from 'node:test';
import assert from 'node:assert/strict';
import {createTurnPracticeRun,stepPractice,practiceCue,practiceProgress,practiceResult} from '../src/runner/practice.js';
import {act} from '../src/runner/world.js';
import {turnPrompt} from '../src/runner/turns.js';
import {bankRun} from '../src/runner/rewards.js';

test('both practice corners use the real input window and complete without banking', () => {
  for (const index of [0,1]) for (const mode of ['correct','miss','corrected']) {
    const run=createTurnPracticeRun({leap:3},index);
    assert.match(practiceCue(run),/wait for the turn cue/);
    act(run,run.practice.direction);
    assert.equal(run.turnAttempt,null,'an early swipe changes lanes, not the corner');
    for(let tick=0;tick<1000&&!run.ended;tick++) {
      const prompt=turnPrompt(run);
      if(prompt&&mode!=='miss'&&prompt.status!=='accepted') {
        if(mode==='corrected') {
          act(run,prompt.direction==='left'?'right':'left');
          assert.equal(turnPrompt(run).status,'wrong');
        }
        act(run,prompt.direction);
        assert.equal(practiceCue(run),'✓ TURN SET');
      }
      stepPractice(run,1/120);
    }
    const correct=mode!=='miss';
    assert.equal(run.ended,true);
    assert.ok(run.time<7);
    assert.equal(run.practice.correct,Number(correct));
    assert.deepEqual(run.practice.outcomes,[correct]);
    assert.equal(run.hearts,3);
    assert.equal(run.fetchCharge,0);
    assert.equal(run.objects.length,0);
    assert.equal(bankRun({},run,[]),null);
    assert.match(practiceProgress(run),/corner/);
    assert.match(practiceResult(run).lesson,correct?/Between corners/:/early swipe/);
    assert.ok(!run.events.some(event=>['hit','end','flow'].includes(event)));
  }
});
