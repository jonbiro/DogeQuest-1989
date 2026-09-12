import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,step,act} from '../src/runner/world.js';
import {actionCue} from '../src/runner/guidance.js';

test('extra warning applies only to consecutive on-path jumps, never short slides or distant clutter',()=>{
  const run=createRun(1989);run.speed=36;run.course=null;
  const first={id:1,type:'log',lane:1,at:19.8};
  const next={id:2,type:'rock',lane:1,at:41.4};
  run.objects=[first,next];assert.equal(actionCue(run),'↑ JUMP');
  next.lane=0;assert.equal(actionCue(run),'');
  next.lane=1;next.at=60;assert.equal(actionCue(run),'');
  next.at=41.4;first.type='branch';assert.equal(actionCue(run),'');
  first.type='log';next.used=true;assert.equal(actionCue(run),'');
});

test('lookahead scans only the extra warning interval and only for the occupied path',()=>{
  const run=createRun(1989);run.speed=36;run.course=null;
  const first={id:1,type:'log',lane:1,at:14};
  run.objects=[first,{id:2,type:'rock',lane:1,at:35}];
  let scans=0;
  run.objects.some=function(predicate){scans++;return Array.prototype.some.call(this,predicate);};
  assert.equal(actionCue(run),'↑ JUMP');assert.equal(scans,0,'ordinary warnings need no extra scan');
  first.at=19.8;
  assert.equal(actionCue(run),'↑ JUMP');assert.equal(scans,1,'extended interval performs one lookahead');
  scans=0;first.lane=0;
  assert.equal(actionCue(run),'');assert.equal(scans,0,'off-path obstacles need no lookahead');
  first.lane=1;first.at=21;
  assert.equal(actionCue(run),'');assert.equal(scans,0,'beyond the warning interval needs no lookahead');
});

for(const fps of [24,60])for(const level of [0,3])test(`Scenic cues tolerate 300ms reactions at ${fps}fps, upgrade level ${level}`,()=>{
  for(const seed of [1989,1990,1991,1992]){
    const run=createRun(seed,{leap:level,slide:level,magnet:level,value:level});
    const seen=new Set(),pending=[],history=[];
    let previous='',nextFrame=0;
    while(!run.ended&&run.distance<6000){
      if(run.course?.scenic)seen.add(run.course.region);
      if(run.time+1e-9>=nextFrame){
        nextFrame+=1/fps;
        // Commit Scenic explicitly; do not let aerial steering choose Challenge.
        const atGate=run.choicePending!==null&&run.choicePending-run.distance<30;
        const cue=actionCue(run);
        const decision=atGate&&!cue.includes('TURN')
          ? (run.lane===0?'': 'SCENIC LEFT') : cue;
        if(decision!==previous){
          history.push({distance:run.distance,cue:decision,y:run.y,vy:run.vy});
          if(history.length>8)history.shift();
          previous=decision;
          const action=decision.includes('LEFT')?'left':decision.includes('RIGHT')?'right':
            decision.includes('SLIDE')?'slide':decision.includes('JUMP')?'jump':null;
          if(action&&!decision.includes('SET'))pending.push({at:run.time+.3,action});
        }
      }
      while(pending[0]?.at<=run.time)act(run,pending.shift().action);
      const from=run.events.length;
      step(run,1/120);
      assert.ok(!run.events.slice(from).some(e=>e==='hit'||e==='shield-break'),
        `${seed} at ${run.distance}: ${JSON.stringify({mistake:run.lastMistake,detail:run.lastMistakeDetail,history})}`);
    }
    assert.ok(run.distance>=6000);
    assert.ok(seen.has(1)&&seen.has(2),'must exercise new canyon and glade encounters');
    assert.equal(run.regionalCourses[1],0);assert.equal(run.regionalCourses[2],0);
  }
});
