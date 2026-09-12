import test from 'node:test';
import assert from 'node:assert/strict';
import {resultRecord,resultChallenge} from '../src/runner/result-record.js';
import {bankRun} from '../src/runner/rewards.js';
import {collectionFrom} from '../src/runner/collection.js';

test('distance and bone records recognize a good run without beating score',()=>{
  for(const [distance,bones,expected] of [[100.9,10,''],[101,10,'New distance best! '],
    [100,11,'New bone best! '],[101,11,'New distance and bone bests! ']]) {
    const profile={best:10000,distance:100.1,bones:50,bestRunBones:10,credits:0,
      challenges:0,collection:collectionFrom()};
    const run={ended:true,score:50,distance,bones,gifts:0};
    const receipt=bankRun(profile,run,[]);
    assert.equal(resultRecord(receipt,run),expected);
    assert.equal(receipt.totalPoints,50,'record recognition does not mint currency');
    assert.equal(resultRecord(bankRun(profile,run,[]),run),expected,'record survives re-reading the receipt');
  }
});

test('record messaging stays compact and prioritizes score and rematch achievements',()=>{
  const receipt={personalBest:true,distanceBest:true,bonesBest:true};
  assert.equal(resultRecord(receipt,{score:200,rematchBest:100}),'New personal best! ');
  receipt.personalBest=false;
  assert.equal(resultRecord(receipt,{score:200,rematchBest:100}),'Rematch best! ');
  assert.equal(resultRecord({}, {score:100,rematchBest:100}),'');
});

test('close retry results explain points to beat, including ties and shared priority',()=>{
  assert.equal(resultChallenge({score:100,challengeTarget:100}),'1 more point to beat the shared target. ');
  assert.equal(resultChallenge({score:90,rematchBest:100}),'11 more points to beat your rematch best. ');
  assert.equal(resultChallenge({score:90,challengeTarget:120,rematchBest:100}),'31 more points to beat the shared target. ');
  assert.equal(resultChallenge({score:101,challengeTarget:100}),'Target beaten! ');
  assert.equal(resultChallenge({score:101,rematchBest:100}),'','record helper owns rematch wins');
});

test('retry encouragement is bounded and does not turn a distant target into pressure',()=>{
  for(const target of [100,2000,10000]) {
    const window=Math.min(500,Math.max(150,target*.1));
    if(target>=window) {
      assert.notEqual(resultChallenge({score:target-window+1,challengeTarget:target}),'');
      assert.equal(resultChallenge({score:target-window,challengeTarget:target}),'');
    }
  }
  for(const target of [0,-1,NaN,Infinity,1.5,1000000000])
    assert.equal(resultChallenge({score:0,challengeTarget:target,rematchBest:target}),'');
  for(const score of [-1,NaN,Infinity,1.5])assert.equal(resultChallenge({score,challengeTarget:100}),'');
  assert.equal(resultChallenge({score:100,challengeTarget:10000,rematchBest:100}),'','explicit shared challenge keeps priority');
});
