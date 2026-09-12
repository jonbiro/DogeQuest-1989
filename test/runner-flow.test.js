import test from 'node:test';
import assert from 'node:assert/strict';
import {cleanMove} from '../src/runner/flow.js';
import {createRun,act,step} from '../src/runner/world.js';
import {cornerByIndex} from '../src/runner/turns.js';

test('clean movement milestones ramp to a capped reward without changing bone streaks',()=>{
  const run=createRun(1); run.combo=7;
  for(let i=0;i<25;i++) cleanMove(run);
  assert.equal(run.bestCleanStreak,25);
  assert.equal(run.flowPoints,700);
  assert.equal(run.bonusPoints,700);
  assert.equal(run.events.filter(e=>e==='flow').length,5);
  assert.equal(run.combo,7);
});
function quietRun() {
  const run=createRun(1);
  Object.assign(run,{objects:[],nextRow:Infinity,nextChoice:Infinity,nextZipline:Infinity});
  return run;
}
test('actual slides advance once, collisions and shield saves reset, missed bones do not',()=>{
  for(const shield of [0,1]){
    const run=quietRun();run.cleanStreak=4;run.bestCleanStreak=4;
    run.objects=[{id:900,type:'gate',lane:1,at:.1}];
    act(run,'slide');
    for(let i=0;i<10;i++) step(run,1/120);
    assert.equal(run.cleanStreak,5);
    assert.equal(run.flowPoints,50);
    run.objects=[{id:901,type:'bone',lane:0,at:run.distance-3}];
    step(run,1/120);assert.equal(run.cleanStreak,5);
    run.slide=0;run.shield=shield;
    run.objects=[{id:902,type:'gate',lane:1,at:run.distance-1}];
    step(run,1/120);
    assert.equal(run.cleanStreak,0);
    assert.equal(run.bestCleanStreak,5);
    assert.equal(run.flowPoints,50);
    assert.equal(run.hearts,shield?3:2);
  }
});
test('automatic Zoomies clears do not count but a deliberate marked turn does',()=>{
  const run=quietRun();run.zoomies=5;
  run.objects=[{id:900,type:'gap',lane:1,at:-1}];
  step(run,1/120);assert.equal(run.cleanStreak,0);
  const corner=cornerByIndex(0);
  run.distance=corner.at-5;run.nextCorner=0;
  act(run,corner.direction);
  for(let i=0;i<60;i++) step(run,1/120);
  assert.equal(run.turns,1);assert.equal(run.cleanStreak,1);
});
