import test from 'node:test';
import assert from 'node:assert/strict';
import {runHudLabels} from '../src/runner/hud-labels.js';
import {createRun} from '../src/runner/world.js';
import {createPracticeRun} from '../src/runner/practice.js';

test('both routes retain shared targets, records and rematches across every region',()=>{
  for (const [index,name] of ['Jungle','Canyon','Glade'].entries()) {
    for (const kind of ['scenic','challenge']) {
      const run=createRun(1989);
      run.distance=index*450+100;run.route={kind,until:run.distance+220};
      run.score=900;run.challengeTarget=1000;
      const location=`${name} · ${kind==='challenge'?'Challenge':'Scenic'}`;
      assert.deepEqual(runHudLabels(run,10000),{region:location,score:'101 pts to target'});
      run.score=1001;
      assert.equal(runHudLabels(run,10000).score,'1,001 pts · TARGET BEAT');
      run.challengeTarget=0;run.score=900;
      assert.equal(runHudLabels(run,1000).score,'101 pts to best');
      run.rematchBest=1000;
      assert.equal(runHudLabels(run,10000).score,'101 pts to rematch best');
    }
  }
});
test('route labels end at the exact boundary and practice remains explicitly unscored',()=>{
  const run=createRun(1989);
  run.distance=570;run.route={kind:'challenge',until:570};
  assert.deepEqual(runHudLabels(run,0),{region:'Biscuit Canyon',score:'0 pts'});
  const practice=createPracticeRun();
  practice.route={kind:'challenge',until:1000};practice.challengeTarget=100;
  assert.deepEqual(runHudLabels(practice,100),{region:'Practice · no penalties',score:'0/3 moves cleared'});
});
