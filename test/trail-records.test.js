import test from 'node:test';
import assert from 'node:assert/strict';
import {trailRecordsFrom,trailBest,bankTrailRecord} from '../src/runner/trail-records.js';
import {dailyTrail} from '../src/runner/daily-trail.js';
import {bankRun} from '../src/runner/rewards.js';
import {createRun} from '../src/runner/world.js';
import {collectionFrom} from '../src/runner/collection.js';

test('trail records sanitize input, merge duplicates and remain bounded',()=>{
  const input=[{seed:0,version:4,best:120},{seed:0,version:4,best:240},
    {seed:-1,version:4,best:900},{seed:1,version:6,best:900},{seed:2,version:4,best:NaN},
    ...Array.from({length:60},(_,i)=>({seed:i+10,version:4,best:i}))];
  const records=trailRecordsFrom(input);
  assert.equal(records.length,32);assert.equal(trailBest(records,0,4),240);
  assert.equal(trailBest(records,0,3),0);assert.equal(trailBest(records,1,6),0);
  assert.equal(input[0].best,120);assert.deepEqual(trailRecordsFrom({}),[]);
});

test('completed adventures bank their own best once, never practice or another layout version',()=>{
  const profile={best:0,distance:0,bones:0,credits:0,challenges:0,collection:collectionFrom()};
  const run=createRun(1989,{},4);run.score=2400;
  assert.equal(bankRun(profile,run,[]),null);assert.equal(profile.trailRecords,undefined);
  run.ended=true;run.practice={};
  assert.equal(bankRun(profile,run,[]),null);assert.equal(profile.trailRecords,undefined);
  delete run.practice;bankRun(profile,run,[]);
  assert.equal(trailBest(profile.trailRecords,1989,4),2400);
  const before=JSON.stringify(profile);bankRun(profile,run,[]);assert.equal(JSON.stringify(profile),before);
  const worse=createRun(1989,{},4);worse.ended=true;worse.score=100;bankRun(profile,worse,[]);
  assert.equal(trailBest(profile.trailRecords,1989,4),2400);
  const legacy=createRun(1989,{},3);legacy.ended=true;legacy.score=3000;bankRun(profile,legacy,[]);
  assert.equal(trailBest(profile.trailRecords,1989,3),3000);
  assert.equal(trailBest(profile.trailRecords,1989,4),2400);
});

test('today survives a hundred random runs without growing history or pinning yesterday forever',()=>{
  const timestamp=Date.parse('2026-09-13T12:00:00Z');
  const daily=dailyTrail('https://example.com/runner/',timestamp),profile={};
  bankTrailRecord(profile,{ended:true,seed:daily.seed,generatorVersion:daily.version,score:2400},timestamp);
  for(let seed=0;seed<100;seed++){
    bankTrailRecord(profile,{ended:true,seed,generatorVersion:4,score:seed},timestamp);
    assert.equal(trailBest(profile.trailRecords,daily.seed,daily.version),2400);
    assert.ok(profile.trailRecords.length<=32);
  }
  for(let seed=100;seed<140;seed++)
    bankTrailRecord(profile,{ended:true,seed,generatorVersion:4,score:seed},timestamp+86400000);
  assert.equal(trailBest(profile.trailRecords,daily.seed,daily.version),0);
  assert.equal(profile.trailRecords.length,32);
});
