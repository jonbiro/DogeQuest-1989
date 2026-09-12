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

test('authored lane weaves earn clean flow and Fetch once without becoming jump clears',()=>{
  for(const fps of [60,120,240]) {
    const run=quietRun();run.cleanStreak=4;run.bestCleanStreak=4;
    run.course={end:100,checked:0,clean:0,region:2,beats:[{at:10,type:'rock',safeLane:0}]};
    act(run,'left');
    for(let i=0;i<fps;i++)step(run,1/fps);
    assert.equal(run.course.clean,1);
    assert.equal(run.cleanStreak,5);
    assert.equal(run.flowPoints,50);
    assert.equal(run.fetchCharge,12);
    assert.equal(run.clears,0,'jump / slide missions keep their meaning');
    assert.equal(run.weaves,1);
    assert.equal(run.events.filter(e=>e==='weave').length,1);
  }
});

test('missed lanes and Zoomies do not earn weave charge; Fetch cannot refill itself',()=>{
  for(const mode of ['miss','zoomies','fetch']) {
    const run=quietRun();
    run.course={end:100,checked:0,clean:0,region:2,beats:[{at:1,type:'rock',safeLane:1}]};
    if(mode==='miss'){run.x=-2.4;run.lane=0;}
    if(mode==='zoomies')run.zoomies=5;
    if(mode==='fetch')run.fetchTime=5;
    for(let i=0;i<30;i++)step(run,1/120);
    assert.equal(run.fetchCharge,0,mode);
    assert.equal(run.cleanStreak,mode==='fetch'?1:0,mode);
    assert.equal(run.weaves,mode==='fetch'?1:0,mode);
  }
});

test('a full slalom pays three weave credits and its course bonus without collision',()=>{
  const run=quietRun();
  const beats=[{at:10,type:'rock',safeLane:0},{at:45,type:'rock',safeLane:2},{at:80,type:'rock',safeLane:1}];
  run.course={end:100,checked:0,clean:0,region:2,beats};
  run.objects=beats.flatMap(beat=>[0,1,2].filter(l=>l!==beat.safeLane)
    .map(lane=>({id:run.id++,type:'rock',lane,at:beat.at,courseRegion:2})));
  act(run,'left');let movedRight=false,movedCenter=false;
  while(run.distance<101&&!run.ended) {
    if(run.distance>20&&!movedRight){act(run,'right');act(run,'right');movedRight=true;}
    if(run.distance>60&&!movedCenter){act(run,'left');movedCenter=true;}
    step(run,1/120);
  }
  assert.equal(run.hearts,3);
  assert.equal(run.regionalCourses[2],1);
  assert.equal(run.cleanStreak,3);
  assert.equal(run.weaves,3);
  assert.equal(run.fetchCharge,36);
  assert.equal(run.bonusPoints,180);
  assert.equal(run.events.filter(e=>e==='weave').length,3);
});
