import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,act,step} from '../src/runner/world.js';
import {actionCue} from '../src/runner/guidance.js';
import {jumpLandingTime,JUMP_BUFFER} from '../src/runner/motion.js';

test('near-landing hints acknowledge buffered jumps without changing the current leap',()=>{
  for(const leap of [0,3]) {
    const run=createRun(1989,{leap});
    run.objects=[];run.nextRow=Infinity;run.nextChoice=Infinity;run.nextZipline=Infinity;
    act(run,'jump');
    while(run.vy>=0||jumpLandingTime(run)>JUMP_BUFFER)step(run,1/120);
    run.objects=[{id:999,type:'rock',lane:1,at:run.distance+run.speed*.4}];
    assert.equal(actionCue(run),'↑ JUMP AGAIN');
    const {y,vy}=run;
    act(run,'jump');
    assert.equal(run.y,y);assert.equal(run.vy,vy);
    assert.equal(actionCue(run),'');
    run.objects[0].at=run.distance+run.speed*.01;
    run.jumpBuffer=0;
    assert.equal(actionCue(run),'','a hazard reached before landing is not a second takeoff');
  }
});

test('closely spaced seeded obstacles remain clearable with a 150ms cue response',()=>{
  for(const seed of [5,7,8]) {
    const run=createRun(seed);let pending=null,last=-1,hits=0,again=false;
    while(!run.ended&&run.distance<5000) {
      const cue=actionCue(run);
      again ||= cue.includes('JUMP AGAIN');
      const action=/TURN LEFT|WEAVE LEFT|BONES LEFT|GIFT LEFT/.test(cue)?'left'
        :/TURN RIGHT|WEAVE RIGHT|BONES RIGHT|GIFT RIGHT/.test(cue)?'right'
          :cue.includes('SLIDE')?'slide':cue.includes('JUMP')?'jump':null;
      if(action&&!pending&&run.time-last>.2)pending={action,at:run.time+.15};
      if(pending&&run.time>=pending.at){act(run,pending.action);pending=null;last=run.time;}
      step(run,1/120);
      hits+=run.events.filter(event=>event==='hit').length;
      run.events=[];
    }
    assert.ok(again);
    assert.ok(run.distance>=5000);
    assert.equal(hits,0,`seed ${seed}: no collisions hidden by later heart pickups`);
  }
});
