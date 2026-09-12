import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,step} from '../src/runner/world.js';
import {scoreBreakdown} from '../src/runner/score-breakdown.js';
import {bankRun} from '../src/runner/rewards.js';
import {collectionFrom} from '../src/runner/collection.js';
import {eventNotice} from '../src/runner/guidance.js';

test('separate ten-bone streaks retain their actual bonuses through misses and banking',()=>{
  for(const boosted of [false,true]) {
    const run=createRun(1,{value:boosted?3:0});
    Object.assign(run,{objects:[],nextRow:Infinity,nextChoice:Infinity,nextZipline:Infinity,double:boosted?10:0});
    for(let group=0;group<2;group++) {
      run.objects=Array.from({length:10},(_,id)=>({id:id+group*10,type:'bone',lane:1,at:run.distance+.1}));
      step(run,1/120);
      run.objects=[{id:100+group,type:'bone',lane:0,at:run.distance-3}];step(run,1/120);
    }
    assert.equal(run.bestCombo,10);assert.equal(run.combo,0);assert.equal(run.streakPoints,200);
    assert.equal(run.bonusPoints,200);assert.equal(run.bonePoints,boosted?1600:500);
    assert.match(scoreBreakdown(run),/200 from bone streaks/);
    assert.equal(run.score,Math.floor(run.distance)+run.bonePoints+run.bonusPoints);
    const profile={best:0,distance:0,bones:0,credits:0,challenges:0,collection:collectionFrom()};
    run.ended=true;const receipt=bankRun(profile,run,[]),credits=profile.credits;
    assert.equal(receipt.scorePoints,run.score);assert.equal(bankRun(profile,run,[]),receipt);assert.equal(profile.credits,credits);
    assert.equal(Object.hasOwn(profile,'streakPoints'),false,'new detail does not become a saved currency');
    assert.equal(eventNotice('streak',run),null,'in-run reward feedback stays quiet');
  }
});
test('score details explain included bonuses without counting them twice',()=>{
  assert.equal(scoreBreakdown({distance:100.9,bonePoints:250,bonusPoints:150,score:500,streakPoints:100,flowPoints:50}),
    'Score sources: 100 distance + 250 bones + 150 trail bonuses = 500 points. Trail bonuses include 100 from bone streaks and 50 from clean-move streaks; these are already in your score.');
  assert.equal(scoreBreakdown({distance:0,bonePoints:0,bonusPoints:0,score:0}),
    'Score sources: 0 distance + 0 bones + 0 trail bonuses = 0 points.');
});
