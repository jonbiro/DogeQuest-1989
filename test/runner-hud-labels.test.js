import test from 'node:test';
import assert from 'node:assert/strict';
import {runHudLabels,missionSummaryLabel} from '../src/runner/hud-labels.js';
import {createRun} from '../src/runner/world.js';
import {createPracticeRun} from '../src/runner/practice.js';

test('both routes retain area identity, shared targets, records and rematches across all six areas',()=>{
  for (const [index,name] of ['Sunleaf','Bamboo','Redrock','Oasis','Crystal','Mooncap'].entries()) {
    for (const kind of ['scenic','challenge']) {
      const run=createRun(1989);
      run.distance=index*225+100;run.route={kind,until:run.distance+220};
      run.score=900;run.challengeTarget=1000;
      const location=`${name} · ${kind==='challenge'?'Challenge':'Scenic'}`;
      assert.deepEqual(runHudLabels(run,10000),{region:location,rhythm:['Roots + canopy','Bamboo zigzag','Broken ridge','Oasis stepping stones','Crystal slalom','Moonlit canopy'][index],score:'101 pts to target'});
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
  assert.deepEqual(runHudLabels(run,0),{region:'Redrock Pass',rhythm:'Broken ridge',score:'0 pts'});
  const practice=createPracticeRun();
  practice.route={kind:'challenge',until:1000};practice.challengeTarget=100;
  assert.deepEqual(runHudLabels(practice,100),{region:'Practice · no penalties',rhythm:'',score:'0/3 moves cleared'});
});

test('portrait mission summaries stay scannable while preserving progress',()=>{
  assert.equal(missionSummaryLabel({metric:'regionalCourses',title:'Course conqueror',target:1},0,1,3),'1/3 · Course · 0/1');
  assert.equal(missionSummaryLabel({metric:'bestCombo',title:'Snack streak',target:10},7,2,3),'2/3 · Streak · 7/10');
  assert.equal(missionSummaryLabel({metric:'unknown',title:'A very long custom goal',target:4},9,0,3),'1/3 · A very long custom goal · 4/4');
});
