import test from 'node:test';
import assert from 'node:assert/strict';
import {createRaftPracticeRun,stepPractice,practiceCue,practiceResult,practiceOffer,practiceProgress} from '../src/runner/practice.js';
import {act} from '../src/runner/world.js';
import {bankRun} from '../src/runner/rewards.js';

test('river rehearsal completes using actual steering cues with all bones and no damage',()=>{
  const run=createRaftPracticeRun();
  for(let i=0;i<5000&&!run.ended;i++){
    const cue=practiceCue(run);
    if(cue.startsWith('←'))act(run,'left');
    if(cue.startsWith('→'))act(run,'right');
    stepPractice(run,1/120);
  }
  assert.equal(run.ended,true);
  assert.equal(run.rafts,1);
  assert.equal(run.bones,12);
  assert.equal(run.practice.hits,0);
  assert.equal(run.hearts,3);
  assert.equal(run.practice.correct,3);
  assert.match(practiceProgress(run),/12\/12.*landed/);
  assert.match(practiceResult(run).lesson,/does not award points/);
  const profile={credits:200,bones:40,best:900};
  const before=globalThis.structuredClone(profile);
  assert.equal(bankRun(profile,run,[]),null);
  assert.deepEqual(profile,before);
});

test('missed river steering preserves unlimited hearts and gives relevant advice',()=>{
  const run=createRaftPracticeRun();
  for(let i=0;i<5000&&!run.ended;i++)stepPractice(run,1/120);
  assert.equal(run.ended,true);
  assert.ok(run.practice.hits>0);
  assert.equal(run.hearts,3);
  assert.match(practiceResult(run).lesson,/Steer earlier/);
  assert.equal(practiceOffer(run),null);
  assert.equal(practiceOffer({ended:true,lastMistake:{type:'rock',raftHazard:true}}).kind,'raft');
});
