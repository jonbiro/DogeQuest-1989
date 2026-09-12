import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun} from '../src/runner/world.js';
import {createPracticeRun} from '../src/runner/practice.js';
import {rematchFor} from '../src/runner/rematch.js';

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
