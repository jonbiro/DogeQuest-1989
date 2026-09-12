import test from 'node:test';
import assert from 'node:assert/strict';
import {createTiltSteering} from '../src/runner/tilt.js';
import {createRun,step,act,fillTrack} from '../src/runner/world.js';
import {actionCue} from '../src/runner/guidance.js';

for(const preset of ['gentle','balanced','steady'])for(const fps of [24,60])for(const boosted of [false,true])test(`river tilt reactions preserve safe traversal, ${preset}, ${fps}Hz, boost=${boosted}`,async()=>{
  const run=createRun(1989);
  Object.assign(run,{raftPrototype:true,distance:1090,nextRow:1090,objects:[],nextChoice:1750,nextZipline:2050,
    course:null,route:{kind:'challenge',until:1270},zoomies:boosted?10:0});
  run.previous.distance=1090;fillTrack(run);
  let listener,gamma=0,nextSample=0,previous='',pending=null;
  const host={isSecureContext:true,DeviceOrientationEvent:{},performance:{now:()=>run.time*1000},
    addEventListener:(type,fn)=>{if(type==='deviceorientation')listener=fn;},removeEventListener:()=>{},setTimeout:()=>1,clearTimeout:()=>{}};
  const tilt=createTiltSteering(host,{onAction:action=>{act(run,action);gamma=0;}});
  tilt.setSensitivity(preset);
  await tilt.enable();listener({gamma:0});
  while(!run.ended&&run.distance<1300){
    if(run.time>=nextSample){
      nextSample+=1/fps;
      const cue=actionCue(run);
      if(cue!==previous){
        previous=cue;
        if(cue.startsWith('←')||cue.startsWith('→'))pending={at:run.time+.3,gamma:cue.startsWith('←')?-25:25};
      }
      if(pending&&run.time>=pending.at){gamma=pending.gamma;pending=null;}
      listener({gamma});
    }
    const before=run.events.length;step(run,1/120);
    assert.ok(!run.events.slice(before).some(e=>['hit','shield-break','smash'].includes(e)),`unsafe at ${run.distance}`);
  }
  assert.equal(run.rafts,1);assert.equal(run.hearts,3);assert.ok(run.bones>=9);assert.equal(run.gifts,1);
  tilt.stop();
});
