import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,step} from '../src/runner/world.js';
import {bankRun} from '../src/runner/rewards.js';
import {collectionFrom} from '../src/runner/collection.js';
import {scoreBreakdown} from '../src/runner/score-breakdown.js';

function fixture(distance=1289.9){
  const run=createRun(1989);
  Object.assign(run,{raftPrototype:true,distance,raft:{index:0,start:1150,end:1290},objects:[],nextRow:Infinity});
  const profile={best:0,distance:0,bones:0,credits:0,challenges:0,collection:collectionFrom()};
  return {run,profile};
}
test('actual dismount enters the score once and the bank receipt does not award it again',()=>{
  const {run,profile}=fixture();step(run,1/30);
  assert.equal(run.rafts,1);assert.equal(run.bonusPoints,250);
  assert.equal(bankRun(profile,run,[]),null);assert.equal(profile.credits,0);
  run.ended=true;
  const receipt=bankRun(profile,run,[]),credits=profile.credits;
  assert.equal(receipt.scorePoints,run.score);
  assert.equal(run.score,Math.floor(run.distance)+250);
  assert.match(scoreBreakdown(run),/250 from river crossings/);
  for(let i=0;i<10;i++)assert.equal(bankRun(profile,run,[]),receipt);
  assert.equal(profile.credits,credits);assert.equal(run.bonusPoints,250);
});
test('retiring before shore cannot manufacture a river completion bonus',()=>{
  const {run,profile}=fixture(1200);step(run,1/120);
  run.ended=true;run.retired=true;step(run,1/30);
  assert.equal(run.rafts||0,0);assert.equal(run.bonusPoints,0);
  assert.equal(bankRun(profile,run,[]).scorePoints,Math.floor(run.distance));
  assert.doesNotMatch(scoreBreakdown(run),/river crossings/);
});
test('a completed river in practice never changes the profile',()=>{
  const {run,profile}=fixture();step(run,1/30);
  run.ended=true;run.practice={kind:'raft'};
  const before=globalThis.structuredClone(profile);
  assert.equal(bankRun(profile,run,[]),null);assert.deepEqual(profile,before);
});
