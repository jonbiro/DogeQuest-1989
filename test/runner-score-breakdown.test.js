import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,step,NEAR_MISS_REWARD} from '../src/runner/world.js';
import {scoreBreakdown,pickupReceiptItems} from '../src/runner/score-breakdown.js';
import {bankRun} from '../src/runner/rewards.js';
import {collectionFrom} from '../src/runner/collection.js';
import {eventNotice} from '../src/runner/guidance.js';

test('collectible bonus detail records actual awards once without changing the total',()=>{
  const run=createRun(1);
  Object.assign(run,{nextRow:Infinity,nextChoice:Infinity,nextZipline:Infinity,shield:1,double:10});
  run.objects=['gem','gift','heart','shield','magnet'].map((type,id)=>({id,type,lane:1,at:.1}));
  step(run,1/120);
  assert.equal(run.pickupBonusPoints,550);
  assert.equal(run.bonusPoints,550);
  assert.equal(run.score,Math.floor(run.distance)+550);
  assert.match(scoreBreakdown(run),/550 from gems, gifts and spare pickups/);
  step(run,1/120);assert.equal(run.pickupBonusPoints,550);
  run.hearts=1;run.shield=0;
  run.objects=['heart','shield'].map((type,id)=>({id:10+id,type,lane:1,at:run.distance+.1}));
  step(run,1/120);
  assert.equal(run.pickupBonusPoints,550,'healing and new protection are not point awards');
  assert.equal(createRun(1).pickupBonusPoints,0);
});

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

test('score details identify mine-cart gem choices as an already-counted reward', () => {
  const text = scoreBreakdown({
    distance: 7200,
    bonePoints: 500,
    bonusPoints: 750,
    score: 8450,
    minecartGemChoices: 3,
  });
  assert.match(text, /750 from mine-cart gem choices/);
  assert.match(text, /already in your score/);
});

test('receipt itemizes special pickups with their actual effects', () => {
  const text = scoreBreakdown({
    distance: 120,
    bonePoints: 250,
    bonusPoints: 350,
    score: 720,
    pickupCounts: { magnet: 2, shield: 1, gem: 1, zoomies: 1 },
  });
  assert.match(text, /Pickup haul: 2 magnets \(pull nearby bones\); 1 shields \(block one hit\); 1 gems \(\+250 points each\); 1 Zoomies balls \(speed \+ smash for 6s\)\./);
});

test('pickup receipt rows stay structured for the visual results haul', () => {
  assert.deepEqual(pickupReceiptItems({pickupCounts: {magnet: 2, gift: 1, relic: -4}}), [
    {key: 'magnet', count: 2, label: 'magnets', effect: 'pull nearby bones'},
    {key: 'gift', count: 1, label: 'gift boxes', effect: '+100 points each'},
  ]);
  assert.deepEqual(pickupReceiptItems({}), []);
});

test('a last-second lane dodge earns one quiet near-miss reward',()=>{
  const run=createRun(1);
  Object.assign(run,{objects:[{id:1,type:'log',lane:0,at:.55,used:false}],nextRow:Infinity,nextChoice:Infinity,nextZipline:Infinity,nextMinecart:Infinity});
  run.lane=1;
  // Start inside the edge of the left lane, then let the spring carry the
  // puppy back toward center as the log crosses its collision plane.
  run.x=-1.25;
  for(let i=0;i<20&&run.nearMisses===0;i++) step(run,1/120);
  assert.equal(run.nearMisses,1);
  assert.equal(run.nearMissPoints,NEAR_MISS_REWARD);
  assert.equal(run.bonusPoints,NEAR_MISS_REWARD);
  assert.match(scoreBreakdown(run),/15 from near misses/);
  const points=run.nearMissPoints;
  step(run,1/120);
  assert.equal(run.nearMissPoints,points,'the passed hazard cannot pay twice');
});
