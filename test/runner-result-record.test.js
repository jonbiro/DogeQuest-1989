import test from 'node:test';
import assert from 'node:assert/strict';
import {resultRecord} from '../src/runner/result-record.js';
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
