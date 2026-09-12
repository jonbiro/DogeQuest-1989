import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,step,act,LANES} from '../src/runner/world.js';
import {routeChoiceCue,actionCue} from '../src/runner/guidance.js';

test('route instructions wait until the reserved clear approach, then expire at the gates',()=>{
  for(const remaining of [101,99,60,40.01,0,-1])
    assert.equal(routeChoiceCue({choicePending:350,distance:350-remaining}),'');
  for(const remaining of [40,25,1])
    assert.match(routeChoiceCue({choicePending:350,distance:350-remaining}),/Scenic.*Challenge/);
  assert.equal(routeChoiceCue({choicePending:null,distance:350}),'');
});

test('two delayed lane inputs still reach either route at maximum boosted speed',()=>{
  for(const target of [0,2]) {
    const run=createRun(38);Object.assign(run,{distance:310,lane:2-target,x:LANES[2-target],
      speed:46.8,zoomies:6,objects:[],choicePending:350,nextRow:390,nextCorner:1});
    assert.ok(routeChoiceCue(run));
    let inputs=0;
    while(run.choicePending!==null) {
      // Includes the HUD's possible 100ms refresh delay and 150ms reaction.
      if(inputs<2 && run.time>=.25+inputs*.15) {act(run,target===2?'right':'left');inputs++;}
      step(run,1/120);
    }
    assert.equal(inputs,2);assert.equal(run.route.kind,target===2?'challenge':'scenic');
  }
});

test('seeded route prompts do not overlap unpassed hazards in either layout version',()=>{
  const hazards=new Set(['log','rock','arch','branch','gate','gap']);
  let prompts=0;
  for(const version of [1,2])for(const seed of [0,7,19,38]) {
    const run=createRun(seed,{},version);
    while(run.distance<6000) {
      run.invulnerable=10;
      const cue=actionCue(run);
      if(cue.includes('TURN')&&!cue.includes('SET'))act(run,cue.includes('LEFT')?'left':'right');
      if(routeChoiceCue(run)) {
        prompts++;
        assert.equal(run.objects.some(o=>hazards.has(o.type)&&o.at+.4>=run.distance&&o.at<run.choicePending),false,
          `unsafe route prompt: version ${version}, seed ${seed}, distance ${run.distance}`);
        if(run.lane<2)act(run,'right');
      }
      step(run,1/30);
      assert.equal(run.ended,false);
    }
  }
  assert.ok(prompts>100);
});
