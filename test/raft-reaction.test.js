import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,fillTrack,step,act} from '../src/runner/world.js';
import {actionCue} from '../src/runner/guidance.js';

test('prototype courses advance by encounters, while old trails keep distance-based variants',()=>{
  for(const prototype of [false,true]){
    const run=createRun(1989);
    Object.assign(run,{raftPrototype:prototype,distance:2460,nextRow:2490,objects:[],nextChoice:3150,nextZipline:3450,
      course:null,route:{kind:'challenge',until:2670}});
    fillTrack(run);
    assert.equal(run.course.name,prototype?'Crystal slalom':'Moonlit hurdles');
    if(prototype){assert.equal(run.courseOrdinals[2],1);fillTrack(run);assert.equal(run.courseOrdinals[2],1);}
    else assert.equal(run.courseOrdinals,undefined);
  }
  const scenic=createRun(1989);
  Object.assign(scenic,{raftPrototype:true,distance:2460,nextRow:2490,objects:[],nextChoice:3150,nextZipline:3450,
    course:null,courseOrdinals:[4,3,2],route:{kind:'scenic',until:2670}});
  fillTrack(scenic);assert.ok(scenic.course.scenic);assert.deepEqual(scenic.courseOrdinals,[4,3,2]);
});

for(const fps of [24,60])for(const boosted of [false,true])test(`raft cues allow 300ms reactions at ${fps}fps, boost ${boosted}`,()=>{
  for(const challenge of [false,true]){
    const run=createRun(1989,boosted?{leap:3,slide:3,magnet:3,value:3}:{});
    Object.assign(run,{raftPrototype:true,distance:1090,nextRow:1090,objects:[],nextChoice:1750,nextZipline:2050,
      course:null,route:{kind:challenge?'challenge':'scenic',until:1270},zoomies:boosted?10:0});
    run.previous.distance=run.distance;fillTrack(run);
    let nextFrame=0,previous='';const pending=[];
    while(!run.ended&&run.distance<1320){
      if(run.time+1e-9>=nextFrame){
        nextFrame+=1/fps;
        const cue=actionCue(run);
        if(cue!==previous){
          previous=cue;
          const action=cue.startsWith('←')?'left':cue.startsWith('→')?'right':null;
          if(action)pending.push({at:run.time+.3,action});
        }
      }
      while(pending[0]?.at<=run.time)act(run,pending.shift().action);
      const from=run.events.length;step(run,1/120);
      assert.ok(!run.events.slice(from).some(event=>['hit','shield-break','smash'].includes(event)),`${challenge?'Challenge':'Scenic'} at ${run.distance}`);
    }
    assert.equal(run.rafts,1);assert.equal(run.hearts,3);
  }
});
