import test from 'node:test';
import assert from 'node:assert/strict';
import {createGapPracticeRun,stepPractice,practiceCue,practiceResult,practiceProgress} from '../src/runner/practice.js';
import {act} from '../src/runner/world.js';
import {bankRun} from '../src/runner/rewards.js';

test('gap rehearsal uses a tiled full-width gap and rewards only a timed jump',()=>{
  for(const leap of [0,3]) for(const action of ['jump','slide','left',null]) {
    const run=createGapPracticeRun({leap});
    assert.equal(run.objects.length,3);
    assert.deepEqual(run.objects.map(object=>object.lane),[0,1,2]);
    assert.ok(run.objects.every(object=>object.type==='gap'&&object.at%5===0));
    assert.match(practiceCue(run),/wait/);
    let acted=false;
    for(let tick=0;tick<700&&!run.ended;tick++) {
      if(!acted&&practiceCue(run)==='↑ JUMP GAP') {
        acted=true;
        if(action)act(run,action);
      }
      stepPractice(run,1/120);
    }
    assert.equal(acted,true);
    assert.equal(run.ended,true);
    assert.ok(run.time<5);
    assert.equal(run.practice.correct,Number(action==='jump'));
    assert.equal(run.practice.outcomes.length,1);
    assert.equal(run.hearts,3);
    assert.equal(run.fetchCharge,0);
    assert.equal(bankRun({},run,[]),null);
    assert.match(practiceProgress(run),/gap/);
    assert.match(practiceResult(run).title,/Gap cleared|Try the gap/);
  }
});

test('gap practice leaves a short reaction margin with base and upgraded jumps',()=>{
  for(const leap of [0,3]) {
    const run=createGapPracticeRun({leap});
    while(practiceCue(run)!=='↑ JUMP GAP')stepPractice(run,1/120);
    for(let tick=0;tick<12;tick++)stepPractice(run,1/120);
    act(run,'jump');
    assert.match(practiceCue(run),/Stay airborne/);
    while(!run.ended)stepPractice(run,1/120);
    assert.equal(run.practice.correct,1);
  }
});
