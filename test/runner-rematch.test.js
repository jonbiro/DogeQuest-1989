import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun} from '../src/runner/world.js';
import {createPracticeRun,createGapPracticeRun,createWeavePracticeRun,createTurnPracticeRun,createZiplinePracticeRun,createRaftPracticeRun,stepPractice} from '../src/runner/practice.js';
import {rematchFor} from '../src/runner/rematch.js';
import {bankRun} from '../src/runner/rewards.js';

test('focused practice and repeated drills retain the original rematch, not practice scores',()=>{
  const original=createRun(1989,{},1);
  Object.assign(original,{score:4200,rematchBest:5000,challengeTarget:6000,ended:true});
  const target=rematchFor(original,true);
  assert.deepEqual(target,{seed:1989,generatorVersion:1,rematchBest:5000,challengeTarget:6000});
  for(const kind of ['jump','slide','jump']){
    const practice=createPracticeRun({},kind);practice.practice.returnTrail=target;
    practice.score=99999;
    assert.deepEqual(rematchFor(practice,true),target);
    assert.equal(rematchFor(practice,false),null,'camp does not inherit an old rematch');
  }
  assert.equal(rematchFor(createPracticeRun(),true),null,'standalone practice starts a new adventure');
  const replay=createRun(target.seed,{},target.generatorVersion);
  assert.equal(replay.seed,original.seed);assert.equal(replay.generatorVersion,original.generatorVersion);
});

test('every practice type preserves all supported replay versions and cannot bank rehearsal scores',()=>{
  const factories=[()=>createPracticeRun(),()=>createPracticeRun({},'jump'),()=>createPracticeRun({},'slide'),
    createGapPracticeRun,createWeavePracticeRun,createTurnPracticeRun,createZiplinePracticeRun,createRaftPracticeRun];
  for(const version of [1,2,3,4]){
    const original=createRun(0xffffffff,{},version);
    Object.assign(original,{score:4200,rematchBest:5000,challengeTarget:6000,ended:true});
    const target=rematchFor(original,true);
    const profile={credits:1234,challenges:30,bones:60};
    const before=globalThis.structuredClone(profile);
    for(const create of factories){
      const practice=create();practice.practice.returnTrail=target;
      if(practice.practice.kind==='raft'){
        for(let i=0;i<5000&&!practice.ended;i++)stepPractice(practice,1/120);
        assert.equal(practice.rafts,1,'exercise real boarding and shore completion');
        assert.equal(practice.ended,true);
      }else practice.ended=true;
      practice.score=99999;
      assert.equal(bankRun(profile,practice,[]),null);
      assert.deepEqual(profile,before);
      const retry=rematchFor(practice,true);
      assert.deepEqual(retry,target);
      const replay=createRun(retry.seed,{},retry.generatorVersion);
      assert.equal(replay.seed,0xffffffff);
      assert.equal(replay.generatorVersion,version);
      assert.equal(replay.raftPrototype,version===4);
      assert.equal(rematchFor(practice,false),null,'returning to camp releases the retry context');
    }
  }
});
