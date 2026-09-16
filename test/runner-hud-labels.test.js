import test from 'node:test';
import assert from 'node:assert/strict';
import {runHudLabels,missionSummaryLabel,boneStreakLabel,cleanFlowLabel} from '../src/runner/hud-labels.js';
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

test('destination rhythm never leaks across an area boundary',()=>{
  const run=createRun(1989);
  run.distance=224;
  run.objects=[
    {at:229,encounter:'Lantern line',used:false,passed:false},
    {at:223,encounter:'Root run',used:false,passed:false},
  ];
  const labels=runHudLabels(run,0);
  assert.equal(labels.region,'Sunleaf Woods');
  assert.equal(labels.rhythm,'Roots + canopy');

  run.distance=210;
  run.objects=[{at:218,encounter:'Root run',used:false,passed:false}];
  assert.equal(runHudLabels(run,0).rhythm,'Root run');
});

test('portrait mission summaries stay scannable while preserving progress',()=>{
  assert.equal(missionSummaryLabel({metric:'regionalCourses',title:'Course conqueror',target:1},0,1,3),'1/3 · Course · 0/1');
  assert.equal(missionSummaryLabel({metric:'bestCombo',title:'Snack streak',target:10},7,2,3),'2/3 · Streak · 7/10');
  assert.equal(missionSummaryLabel({metric:'unknown',title:'A very long custom goal',target:4},9,0,3),'1/3 · A very long custom goal · 4/4');
});

test('bone streak labels stay quiet until a combo is worth showing, then expose bonus progress',()=>{
  assert.equal(boneStreakLabel(0).visible,false);
  assert.equal(boneStreakLabel(1).label,'');
  assert.deepEqual(boneStreakLabel(2),{count:2,target:10,progress:2,remaining:8,visible:true,label:'BONE STREAK ×2',detail:'8 to +100'});
  assert.equal(boneStreakLabel(10).detail,'+100 BONUS EARNED');
  assert.equal(boneStreakLabel(12).progress,2);
});

test('clean flow labels expose the next movement bonus without noisy copy',()=>{
  assert.equal(cleanFlowLabel(0).visible,false);
  assert.equal(cleanFlowLabel(1).label,'');
  assert.deepEqual(cleanFlowLabel(2),{
    count:2,target:5,progress:2,remaining:3,nextTarget:5,nextBonus:50,
    visible:true,label:'CLEAN FLOW ×2',detail:'3 to +50',
  });
  assert.equal(cleanFlowLabel(5).detail,'+50 BONUS EARNED');
  assert.deepEqual(cleanFlowLabel(6),{
    count:6,target:5,progress:1,remaining:4,nextTarget:10,nextBonus:100,
    visible:true,label:'CLEAN FLOW ×6',detail:'4 to +100',
  });
  assert.equal(cleanFlowLabel(20).detail,'+200 BONUS EARNED');
  assert.equal(cleanFlowLabel(25).nextBonus,200);
  assert.equal(cleanFlowLabel('not-a-number').visible,false);
});
